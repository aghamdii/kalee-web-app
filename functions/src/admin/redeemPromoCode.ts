import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { grantPromotionalEntitlement } from './revenueCat';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const revenueCatSecretKey = defineSecret('REVENUECAT_SECRET_KEY');

interface RedeemPromoCodeRequest {
  code: string;
  appUserId?: string; // RevenueCat app_user_id (for unauthenticated users)
}

interface PromoRedemption {
  usedBy: string;
  usedAt: admin.firestore.Timestamp;
  revenueCatGrantId: string | null;
  success: boolean;
  errorMessage?: string | null;
}

export const redeemPromoCodeFunction = onCall({
  region: 'europe-west1',
  timeoutSeconds: 60,
  memory: '256MiB',
  secrets: [revenueCatSecretKey],
}, async (request) => {
  const { auth, data } = request;

  const { code, appUserId } = (data || {}) as RedeemPromoCodeRequest;

  if (!code || typeof code !== 'string') {
    throw new HttpsError('invalid-argument', 'Promo code is required');
  }

  // Use Firebase UID if authenticated, otherwise use RevenueCat appUserId
  const userId = auth?.uid || appUserId;

  if (!userId) {
    throw new HttpsError(
      'invalid-argument',
      'Either Firebase authentication or appUserId is required'
    );
  }

  const normalizedCode = code.trim().toUpperCase();

  try {
    const db = admin.firestore();
    const promoRef = db.collection('promoCodes').doc(normalizedCode);

    // Use transaction to prevent race conditions
    const result = await db.runTransaction(async (transaction) => {
      const promoDoc = await transaction.get(promoRef);

      if (!promoDoc.exists) {
        throw new HttpsError('not-found', 'Invalid promo code');
      }

      const promoData = promoDoc.data()!;

      // Check if code is still valid (active or reserved codes can be redeemed)
      if (promoData.status !== 'active' && promoData.status !== 'reserved') {
        throw new HttpsError(
          'failed-precondition',
          promoData.status === 'used'
            ? 'This code has already been used'
            : 'This code is no longer valid'
        );
      }

      // Check if code has expired
      if (promoData.expiresAt && promoData.expiresAt.toDate() < new Date()) {
        transaction.update(promoRef, { status: 'expired' });
        throw new HttpsError('failed-precondition', 'This code has expired');
      }

      // Check if already at max uses
      if (promoData.usedCount >= promoData.maxUses) {
        transaction.update(promoRef, { status: 'used' });
        throw new HttpsError(
          'failed-precondition',
          'This code has reached its maximum uses'
        );
      }

      // Check if this user already redeemed this code
      const existingRedemption = (promoData.redemptions as PromoRedemption[] || []).find(
        (r) => r.usedBy === userId && r.success
      );
      if (existingRedemption) {
        throw new HttpsError(
          'failed-precondition',
          'You have already redeemed this code'
        );
      }

      // Determine duration type for RevenueCat
      let durationParam: 'yearly' | 'lifetime' | 'monthly' = 'yearly';
      if (promoData.durationDays >= 9999) {
        durationParam = 'lifetime';
      } else if (promoData.durationDays <= 31) {
        durationParam = 'monthly';
      }

      // Grant entitlement via RevenueCat
      const grantResult = await grantPromotionalEntitlement(
        revenueCatSecretKey.value(),
        userId, // Firebase UID as RevenueCat app_user_id
        promoData.entitlementId,
        durationParam
      );

      const redemption: PromoRedemption = {
        usedBy: userId,
        usedAt: admin.firestore.Timestamp.now(),
        revenueCatGrantId: grantResult.grantId || null,
        success: grantResult.success,
        errorMessage: grantResult.error || null,
      };

      const newUsedCount = promoData.usedCount + 1;
      const newStatus = newUsedCount >= promoData.maxUses ? 'used' : 'active';

      transaction.update(promoRef, {
        usedCount: newUsedCount,
        status: grantResult.success ? newStatus : promoData.status,
        redemptions: admin.firestore.FieldValue.arrayUnion(redemption),
      });

      if (!grantResult.success) {
        throw new HttpsError(
          'internal',
          'Failed to apply promo code. Please try again.'
        );
      }

      return {
        success: true,
        entitlementId: promoData.entitlementId,
        durationDays: promoData.durationDays,
      };
    });

    logger.info('Promo code redeemed successfully', {
      code: normalizedCode,
      userId,
      authType: auth?.uid ? 'firebase' : 'anonymous_revenuecat',
    });

    return result;
  } catch (error: unknown) {
    logger.error('Error redeeming promo code:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to redeem promo code');
  }
});
