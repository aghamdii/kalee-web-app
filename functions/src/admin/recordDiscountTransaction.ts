import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

interface RecordDiscountTransactionRequest {
  promoCode: string;
  rcAppUserId: string;
  firebaseUserId: string;
  offeringId: string;
  productIdentifier: string;
  planType: 'annual' | 'monthly';
  price: number;
  currency: string;
  platform: 'ios' | 'android';
  initialStatus: 'trial' | 'paid';
  trialStartedAt: string | null;
  convertedAt: string | null;
}

export const recordDiscountTransactionFunction = onCall({
  region: 'europe-west1',
  timeoutSeconds: 60,
  memory: '256MiB',
}, async (request) => {
  const { auth, data } = request;

  // Require authentication — either Firebase Auth or appUserId
  const userId = auth?.uid || (data as RecordDiscountTransactionRequest)?.rcAppUserId;
  if (!userId) {
    logger.error('Unauthenticated call to recordDiscountTransaction');
    return { success: false };
  }

  const {
    promoCode,
    rcAppUserId,
    firebaseUserId,
    offeringId,
    productIdentifier,
    planType,
    price,
    currency,
    platform,
    initialStatus,
    trialStartedAt,
    convertedAt,
  } = (data || {}) as RecordDiscountTransactionRequest;

  // Validate required fields (return gracefully — this is fire-and-forget)
  if (!promoCode || !rcAppUserId || !planType || price == null || !currency || !platform || !initialStatus) {
    logger.error('Missing required fields in recordDiscountTransaction', { promoCode, rcAppUserId, planType, price, currency, platform, initialStatus });
    return { success: false };
  }

  // Verify the promo code exists and is a discount code
  try {
    const db = admin.firestore();
    const promoDoc = await db.collection('promoCodes').doc(promoCode.trim().toUpperCase()).get();
    if (promoDoc.exists && promoDoc.data()?.type !== 'discount') {
      logger.error('Attempted to record discount transaction for non-discount code', { promoCode, userId });
      return { success: false };
    }
  } catch {
    // Don't block on this check — still allow the transaction to be recorded
  }

  try {
    const db = admin.firestore();
    const normalizedCode = promoCode.trim().toUpperCase();

    // Check for duplicate transaction (idempotent — don't error)
    const existingTxn = await db
      .collection('discountTransactions')
      .where('promoCode', '==', normalizedCode)
      .where('rcAppUserId', '==', rcAppUserId)
      .limit(1)
      .get();

    if (!existingTxn.empty) {
      logger.info('Discount transaction already recorded', {
        promoCode: normalizedCode,
        rcAppUserId,
        existingId: existingTxn.docs[0].id,
      });
      return {
        success: true,
        transactionId: existingTxn.docs[0].id,
      };
    }

    // Look up promo code for affiliateId
    const promoDoc = await db.collection('promoCodes').doc(normalizedCode).get();
    const affiliateId = promoDoc.exists ? (promoDoc.data()?.affiliateId || null) : null;

    if (!promoDoc.exists) {
      logger.warn('Promo code not found when recording discount transaction', {
        promoCode: normalizedCode,
        rcAppUserId,
      });
    }

    // Build initial statusHistory entry
    const initialEvent = initialStatus === 'trial' ? 'trial_started' : 'paid';
    const eventTimestamp = initialStatus === 'trial'
      ? (trialStartedAt ? admin.firestore.Timestamp.fromDate(new Date(trialStartedAt)) : admin.firestore.Timestamp.now())
      : (convertedAt ? admin.firestore.Timestamp.fromDate(new Date(convertedAt)) : admin.firestore.Timestamp.now());

    // Create the discount transaction document
    const transactionData = {
      promoCode: normalizedCode,
      affiliateId,
      rcAppUserId,
      firebaseUserId: firebaseUserId || '',
      offeringId: offeringId || '',
      productIdentifier: productIdentifier || '',
      planType,
      price,
      currency,
      platform,
      status: initialStatus,
      initialStatus,
      trialStartedAt: trialStartedAt
        ? admin.firestore.Timestamp.fromDate(new Date(trialStartedAt))
        : null,
      convertedAt: convertedAt
        ? admin.firestore.Timestamp.fromDate(new Date(convertedAt))
        : null,
      statusHistory: [
        {
          event: initialEvent,
          timestamp: eventTimestamp,
          rcEventType: 'INITIAL_PURCHASE',
        },
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      payoutId: null,
    };

    const txnRef = await db.collection('discountTransactions').add(transactionData);

    // NOTE: usedCount on promoCodes is no longer incremented here.
    // The displayed usage count is now derived from the affiliateTransactions
    // collection via a count() query, so we avoid double-counting (the
    // affiliateTransactionsListener also processes the same purchase).

    logger.info('Discount transaction recorded successfully', {
      transactionId: txnRef.id,
      promoCode: normalizedCode,
      rcAppUserId,
      planType,
      price,
      currency,
      initialStatus,
    });

    return {
      success: true,
      transactionId: txnRef.id,
    };
  } catch (error: unknown) {
    logger.error('Error recording discount transaction:', error);
    // Graceful response — purchase already succeeded, don't confuse the user
    return {
      success: false,
    };
  }
});
