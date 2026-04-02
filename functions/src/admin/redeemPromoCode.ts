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

interface DiscountCodeResponse {
  success: true;
  type: 'discount';
  offeringId: string;
}

interface GiftCodeResponse {
  success: true;
  entitlementId: string;
  durationDays: number;
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

    // Read promo code document
    const promoDoc = await promoRef.get();

    if (!promoDoc.exists) {
      throw new HttpsError('not-found', 'Invalid promo code');
    }

    const promoData = promoDoc.data()!;
    const codeType = promoData.type || 'single_use';

    // Shared validation: status, expiration, max uses
    if (promoData.status !== 'active' && promoData.status !== 'reserved') {
      throw new HttpsError(
        'failed-precondition',
        promoData.status === 'used'
          ? 'This code has already been used'
          : 'This code is no longer valid'
      );
    }

    if (promoData.expiresAt && promoData.expiresAt.toDate() < new Date()) {
      await promoRef.update({ status: 'expired' });
      throw new HttpsError('failed-precondition', 'This code has expired');
    }

    if (promoData.maxUses !== -1 && promoData.usedCount >= promoData.maxUses) {
      await promoRef.update({ status: 'used' });
      throw new HttpsError(
        'failed-precondition',
        'This code has reached its maximum uses'
      );
    }

    // --- DISCOUNT CODE PATH ---
    if (codeType === 'discount') {
      // Check if user already purchased with this code
      const existingTxn = await db
        .collection('discountTransactions')
        .where('promoCode', '==', normalizedCode)
        .where('rcAppUserId', '==', userId)
        .limit(1)
        .get();

      if (!existingTxn.empty) {
        throw new HttpsError(
          'failed-precondition',
          'You have already redeemed this code'
        );
      }

      logger.info('Discount promo code validated', {
        code: normalizedCode,
        userId,
        offeringId: promoData.offeringId,
        authType: auth?.uid ? 'firebase' : 'anonymous_revenuecat',
      });

      return {
        success: true,
        type: 'discount',
        offeringId: promoData.offeringId,
      } as DiscountCodeResponse;
    }

    // --- GIFT/SUBSCRIPTION CODE PATH (existing behavior) ---
    const result = await db.runTransaction(async (transaction) => {
      // Re-read inside transaction for consistency
      const txPromoDoc = await transaction.get(promoRef);
      const txPromoData = txPromoDoc.data()!;

      // Re-validate inside transaction
      if (txPromoData.status !== 'active' && txPromoData.status !== 'reserved') {
        throw new HttpsError(
          'failed-precondition',
          txPromoData.status === 'used'
            ? 'This code has already been used'
            : 'This code is no longer valid'
        );
      }

      if (txPromoData.maxUses !== -1 && txPromoData.usedCount >= txPromoData.maxUses) {
        transaction.update(promoRef, { status: 'used' });
        throw new HttpsError(
          'failed-precondition',
          'This code has reached its maximum uses'
        );
      }

      // Check if this user already redeemed this code
      const existingRedemption = (txPromoData.redemptions as PromoRedemption[] || []).find(
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
      if (txPromoData.durationDays >= 9999) {
        durationParam = 'lifetime';
      } else if (txPromoData.durationDays <= 31) {
        durationParam = 'monthly';
      }

      // Grant entitlement via RevenueCat
      const grantResult = await grantPromotionalEntitlement(
        revenueCatSecretKey.value(),
        userId,
        txPromoData.entitlementId,
        durationParam
      );

      const redemption: PromoRedemption = {
        usedBy: userId,
        usedAt: admin.firestore.Timestamp.now(),
        revenueCatGrantId: grantResult.grantId || null,
        success: grantResult.success,
        errorMessage: grantResult.error || null,
      };

      const newUsedCount = txPromoData.usedCount + 1;
      const newStatus =
        txPromoData.maxUses !== -1 && newUsedCount >= txPromoData.maxUses
          ? 'used'
          : 'active';

      transaction.update(promoRef, {
        usedCount: newUsedCount,
        status: grantResult.success ? newStatus : txPromoData.status,
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
        entitlementId: txPromoData.entitlementId,
        durationDays: txPromoData.durationDays,
      } as GiftCodeResponse;
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
