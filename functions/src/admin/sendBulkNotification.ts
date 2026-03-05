import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { isAdminEmail } from './adminConfig';

const db = admin.firestore();
const messaging = admin.messaging();

interface BulkNotificationRequest {
    title: string;
    body: string;
    filters: {
        language?: string;
        isPremium?: boolean;
        hasNotifications?: boolean;
    };
    dryRun?: boolean;
}

export const sendBulkNotificationFunction = onCall(
    {
        region: 'europe-west1',
        timeoutSeconds: 300,
        memory: '512MiB',
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

        const { title, body, filters, dryRun = false } = request.data as BulkNotificationRequest;

        if (!title || !body) {
            throw new HttpsError('invalid-argument', 'Title and body are required');
        }

        try {
            const startTime = Date.now();

            // Build query based on filters
            let query: admin.firestore.Query = db.collection('users');

            if (filters.language) {
                query = query.where('languageSelected', '==', filters.language);
            }
            if (filters.isPremium !== undefined) {
                query = query.where('isPremium', '==', filters.isPremium);
            }
            if (filters.hasNotifications) {
                query = query.where('notificationsEnabled', '==', true);
            }

            // Paginate through users
            const PAGE_SIZE = 500;
            let matchedCount = 0;
            let sentCount = 0;
            let failedCount = 0;
            let lastDoc: admin.firestore.DocumentSnapshot | null = null;
            const staleTokenUserIds: string[] = [];

            while (true) {
                let pageQuery = query.limit(PAGE_SIZE);
                if (lastDoc) {
                    pageQuery = pageQuery.startAfter(lastDoc);
                }

                const snapshot = await pageQuery.get();
                if (snapshot.empty) break;

                matchedCount += snapshot.docs.length;
                lastDoc = snapshot.docs[snapshot.docs.length - 1];

                const usersWithTokens = snapshot.docs.filter((doc) => doc.data().fcmToken);

                if (dryRun) {
                    sentCount += usersWithTokens.length;
                    if (snapshot.docs.length < PAGE_SIZE) break;
                    continue;
                }

                // Build FCM messages for batch sending
                const messages: admin.messaging.Message[] = usersWithTokens.map((doc) => ({
                    token: doc.data().fcmToken as string,
                    notification: { title, body },
                    android: {
                        priority: 'high' as const,
                        notification: {
                            sound: 'default',
                            defaultVibrateTimings: true,
                        },
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: 'default',
                                badge: 1,
                            },
                        },
                    },
                }));

                if (messages.length > 0) {
                    const batchResponse = await messaging.sendEach(messages);
                    sentCount += batchResponse.successCount;
                    failedCount += batchResponse.failureCount;

                    // Track stale tokens
                    batchResponse.responses.forEach((resp, idx) => {
                        if (resp.error) {
                            const code = resp.error.code;
                            if (
                                code === 'messaging/invalid-registration-token' ||
                                code === 'messaging/registration-token-not-registered'
                            ) {
                                staleTokenUserIds.push(usersWithTokens[idx].id);
                            }
                        }
                    });
                }

                if (snapshot.docs.length < PAGE_SIZE) break;
            }

            if (dryRun) {
                return { success: true, matchedCount, sentCount };
            }

            // Clean up stale FCM tokens
            if (staleTokenUserIds.length > 0) {
                const BATCH_SIZE = 500;
                for (let i = 0; i < staleTokenUserIds.length; i += BATCH_SIZE) {
                    const batch = db.batch();
                    const chunk = staleTokenUserIds.slice(i, i + BATCH_SIZE);
                    for (const userId of chunk) {
                        batch.update(db.collection('users').doc(userId), { fcmToken: null });
                    }
                    await batch.commit();
                }
                logger.info(`Cleaned up ${staleTokenUserIds.length} stale FCM tokens`);
            }

            const durationMs = Date.now() - startTime;

            // Audit log
            await db.collection('adminAuditLog').add({
                action: 'bulk_notification_sent',
                adminId: request.auth.uid,
                adminEmail: email,
                details: {
                    title,
                    body,
                    filters,
                    matchedCount,
                    sentCount,
                    failedCount,
                    staleTokensCleaned: staleTokenUserIds.length,
                    durationMs,
                },
                timestamp: new Date(),
            });

            logger.info('Bulk notification sent', { matchedCount, sentCount, failedCount, durationMs });

            return { success: true, matchedCount, sentCount, failedCount, durationMs };
        } catch (error: unknown) {
            logger.error('Error sending bulk notifications:', error);
            throw new HttpsError('internal', 'Failed to send notifications');
        }
    }
);
