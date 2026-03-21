import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { isAdminEmail } from './adminConfig';

const REVENUECAT_API_URL = 'https://api.revenuecat.com/v1';
const BATCH_SIZE = 400; // Stay below 480/min rate limit
const BATCH_DELAY_MS = 60_000; // 1 minute between batches
const RETRY_DELAY_MS = 65_000; // Wait on 429 before retrying

const revenueCatSecretKey = defineSecret('REVENUECAT_SECRET_KEY');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface SyncProgress {
  status: 'running' | 'completed' | 'failed';
  total: number;
  processed: number;
  proCount: number;
  freeCount: number;
  skipped: number;
  errorCount: number;
  failedUserIds: string[];
  startedAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  completedAt: admin.firestore.Timestamp | null;
  adminEmail: string;
  forceResync: boolean;
}

interface SyncRequest {
  forceResync?: boolean;
}

async function fetchSubscriberData(
  secretKey: string,
  userId: string
): Promise<{ success: boolean; subscriber?: Record<string, unknown>; error?: string; rateLimited?: boolean }> {
  const url = `${REVENUECAT_API_URL}/subscribers/${encodeURIComponent(userId)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 429) {
      return { success: false, rateLimited: true, error: 'Rate limited' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorData.message || response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, subscriber: data.subscriber };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const syncRevenueCatDataFunction = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 1800, // 30 minutes
    memory: '512MiB',
    secrets: [revenueCatSecretKey],
    enforceAppCheck: false,
  },
  async (request) => {
    // Verify admin
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const email = request.auth.token.email;
    if (!isAdminEmail(email)) {
      throw new HttpsError('permission-denied', 'Not authorized as admin');
    }

    const { forceResync = false } = (request.data || {}) as SyncRequest;

    // Create progress document
    const syncRef = db.collection('adminSyncProgress').doc();
    const syncId = syncRef.id;

    try {
      // Get all user IDs from profiles collection
      const profilesSnapshot = await db.collection('profiles').select().get();
      const allUserIds = profilesSnapshot.docs.map((doc) => doc.id);

      logger.info(`Starting RevenueCat sync for ${allUserIds.length} users`, {
        forceResync,
        adminEmail: email,
      });

      // Determine which users to skip (already synced)
      let userIdsToSync = allUserIds;
      let skipped = 0;

      if (!forceResync) {
        const existingDocs = new Set<string>();
        // Check in batches of 500 (Firestore getAll limit is 100 per call)
        for (let i = 0; i < allUserIds.length; i += 100) {
          const chunk = allUserIds.slice(i, i + 100);
          const refs = chunk.map((id) => db.collection('revenuecatCustomersInfo').doc(id));
          const docs = await db.getAll(...refs);
          docs.forEach((doc) => {
            if (doc.exists) existingDocs.add(doc.id);
          });
        }

        userIdsToSync = allUserIds.filter((id) => !existingDocs.has(id));
        skipped = allUserIds.length - userIdsToSync.length;
      }

      // Initialize progress document
      const now = admin.firestore.Timestamp.now();
      const progress: SyncProgress = {
        status: 'running',
        total: userIdsToSync.length,
        processed: 0,
        proCount: 0,
        freeCount: 0,
        skipped,
        errorCount: 0,
        failedUserIds: [],
        startedAt: now,
        updatedAt: now,
        completedAt: null,
        adminEmail: email!,
        forceResync,
      };
      await syncRef.set(progress);

      // Process in batches
      let processed = 0;
      let proCount = 0;
      let freeCount = 0;
      let errorCount = 0;
      const failedUserIds: string[] = [];

      for (let batchStart = 0; batchStart < userIdsToSync.length; batchStart += BATCH_SIZE) {
        const batch = userIdsToSync.slice(batchStart, batchStart + BATCH_SIZE);

        // Process each user in this batch
        for (const userId of batch) {
          const result = await fetchSubscriberData(revenueCatSecretKey.value(), userId);

          if (result.rateLimited) {
            // Wait and retry once
            logger.warn(`Rate limited at user ${userId}, pausing ${RETRY_DELAY_MS}ms`);
            await sleep(RETRY_DELAY_MS);

            const retryResult = await fetchSubscriberData(revenueCatSecretKey.value(), userId);
            if (!retryResult.success) {
              errorCount++;
              failedUserIds.push(userId);
              logger.error(`Failed after retry for user ${userId}:`, retryResult.error);
              processed++;
              continue;
            }
            // Use retry result
            Object.assign(result, retryResult);
          }

          if (!result.success || !result.subscriber) {
            errorCount++;
            failedUserIds.push(userId);
            logger.error(`Failed to fetch subscriber ${userId}:`, result.error);
            processed++;
            continue;
          }

          const subscriber = result.subscriber;

          // Build aliases array
          const aliases: string[] = [];
          if (subscriber.original_app_user_id && subscriber.original_app_user_id !== userId) {
            aliases.push(subscriber.original_app_user_id as string);
          }
          aliases.push(userId);

          // Build document matching the extension format:
          // The extension writes the full subscriber object + aliases
          const docData = {
            ...subscriber,
            aliases,
          };

          // Write to Firestore using set with merge (same as the extension)
          await db.collection('revenuecatCustomersInfo').doc(userId).set(docData, { merge: true });

          // Determine if Pro
          const entitlements = (subscriber.entitlements || {}) as Record<string, { expires_date?: string | null }>;
          const isPro = Object.values(entitlements).some(
            (e) => e.expires_date === null || (e.expires_date && new Date(e.expires_date) > new Date())
          );

          if (isPro) {
            proCount++;
          } else {
            freeCount++;
          }

          processed++;
        }

        // Update progress after each batch
        await syncRef.update({
          processed,
          proCount,
          freeCount,
          errorCount,
          failedUserIds: failedUserIds.slice(0, 100), // Cap at 100 to avoid doc size issues
          updatedAt: admin.firestore.Timestamp.now(),
        });

        logger.info(`Batch complete: ${processed}/${userIdsToSync.length}`, {
          proCount,
          freeCount,
          errorCount,
        });

        // Pause between batches to respect rate limits (skip if last batch)
        if (batchStart + BATCH_SIZE < userIdsToSync.length) {
          await sleep(BATCH_DELAY_MS);
        }
      }

      // Mark as completed
      await syncRef.update({
        status: 'completed',
        processed,
        proCount,
        freeCount,
        errorCount,
        failedUserIds: failedUserIds.slice(0, 100),
        updatedAt: admin.firestore.Timestamp.now(),
        completedAt: admin.firestore.Timestamp.now(),
      });

      // Audit log
      await db.collection('adminAuditLog').add({
        action: 'revenuecat_sync',
        adminId: request.auth.uid,
        adminEmail: email,
        details: {
          syncId,
          total: userIdsToSync.length,
          skipped,
          processed,
          proCount,
          freeCount,
          errorCount,
          forceResync,
        },
        timestamp: new Date(),
      });

      logger.info('RevenueCat sync completed', {
        syncId,
        total: userIdsToSync.length,
        skipped,
        processed,
        proCount,
        freeCount,
        errorCount,
      });

      return {
        success: true,
        syncId,
        total: userIdsToSync.length,
        skipped,
        processed,
        proCount,
        freeCount,
        errorCount,
      };
    } catch (error: unknown) {
      logger.error('RevenueCat sync failed:', error);

      // Update progress doc to failed
      await syncRef.update({
        status: 'failed',
        updatedAt: admin.firestore.Timestamp.now(),
      }).catch(() => {});

      throw new HttpsError('internal', 'Sync failed. Check progress document for details.');
    }
  }
);
