import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RcEventData {
  type: string;
  id?: string;
  app_user_id: string;
  original_app_user_id?: string;
  transaction_id?: string;
  original_transaction_id?: string;
  product_id?: string;
  period_type?: string;                   // TRIAL | NORMAL | INTRO | PROMOTIONAL | PREPAID
  price?: number;                         // USD, can be 0 (trial) or negative (refund)
  price_in_purchased_currency?: number;   // local currency amount
  currency?: string;
  store?: string;                         // APP_STORE | PLAY_STORE
  environment?: string;                   // PRODUCTION | SANDBOX
  country_code?: string;
  commission_percentage?: number;
  takehome_percentage?: number;
  tax_percentage?: number;
  renewal_number?: number;
  is_trial_conversion?: boolean;
  presented_offering_id?: string | null;
  event_timestamp_ms?: number;
  expiration_at_ms?: number | null;
  subscriber_attributes?: Record<string, { value?: string; updated_at_ms?: number }>;
}

export type TransactionType =
  | 'initial_purchase'
  | 'renewal'
  | 'trial_conversion'
  | 'product_change';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function parsePlanType(productId: string | undefined): 'monthly' | 'annual' | 'unknown' {
  if (!productId) return 'unknown';
  const p = productId.toLowerCase();
  if (p.includes('annual') || p.includes('yearly')) return 'annual';
  if (p.includes('monthly')) return 'monthly';
  return 'unknown';
}

export function isDiscountedProductId(productId: string | undefined): boolean {
  if (!productId) return false;
  return productId.toLowerCase().includes('discounted');
}

export function platformFromStore(store: string | undefined): 'ios' | 'android' | 'unknown' {
  if (store === 'APP_STORE') return 'ios';
  if (store === 'PLAY_STORE') return 'android';
  return 'unknown';
}

export function getDiscountCode(eventData: RcEventData): string | null {
  const raw = eventData.subscriber_attributes?.discount_code?.value;
  if (!raw || typeof raw !== 'string') return null;
  return raw.trim().toUpperCase();
}

// ---------------------------------------------------------------------------
// Core: create affiliateTransactions document
// ---------------------------------------------------------------------------

/**
 * Creates an affiliateTransactions document for a commissionable event.
 * Uses rcEventId as the Firestore document ID → idempotent (safe to call
 * multiple times for the same event).
 *
 * RevenueCat semantics (per docs):
 * - `price` is USD (can be 0 for trials, negative for refunds)
 * - `price_in_purchased_currency` is the local currency amount
 * - `period_type` distinguishes TRIAL from NORMAL
 * - `is_trial_conversion` on RENEWAL events explicitly marks trial → paid
 */
export async function createAffiliateTransaction(
  eventData: RcEventData,
  rcEventId: string,
  transactionType: TransactionType,
  promoCode: string,
  affiliateId: string | null,
  offeringIdFromPromoCode: string | null,
): Promise<FirebaseFirestore.DocumentReference | null> {
  const db = admin.firestore();

  const productId = eventData.product_id || '';
  const periodType = eventData.period_type || 'NORMAL';
  const isTrial = periodType === 'TRIAL';
  const eventTsMs = eventData.event_timestamp_ms || Date.now();
  const purchasedAt = admin.firestore.Timestamp.fromMillis(eventTsMs);
  const expiresAt = eventData.expiration_at_ms
    ? admin.firestore.Timestamp.fromMillis(eventData.expiration_at_ms)
    : null;

  const data = {
    // Links back to sources
    rcEventId,
    rcTransactionId: eventData.transaction_id || null,
    originalTransactionId: eventData.original_transaction_id || null,

    // Who
    rcAppUserId: eventData.app_user_id,
    firebaseUserId: eventData.original_app_user_id || '',

    // What
    promoCode,
    affiliateId,

    // Transaction classification
    transactionType,
    isTrialConversion: transactionType === 'trial_conversion',
    isDiscountedProduct: isDiscountedProductId(productId),
    periodType,
    renewalNumber: eventData.renewal_number ?? null,

    // Product snapshot
    productIdentifier: productId,
    offeringId: eventData.presented_offering_id || offeringIdFromPromoCode || null,
    planType: parsePlanType(productId),
    platform: platformFromStore(eventData.store),
    store: eventData.store || 'UNKNOWN',
    environment: eventData.environment || 'UNKNOWN',

    // Money snapshot (RevenueCat docs: price = USD, price_in_purchased_currency = local)
    price: eventData.price_in_purchased_currency ?? 0,
    currency: eventData.currency || 'USD',
    priceUsd: eventData.price ?? 0,
    commissionPercentage: eventData.commission_percentage ?? null,
    takehomePercentage: eventData.takehome_percentage ?? null,
    taxPercentage: eventData.tax_percentage ?? null,
    countryCode: eventData.country_code || null,

    // Period flags (useful denormalization)
    isTrial,
    isPaidTransaction: !isTrial && (eventData.price ?? 0) > 0,

    // Refund state (initial: not refunded)
    isRefunded: false,
    priceUsdRefunded: 0,
    refundedAt: null,
    refundEventId: null,

    // Settlement state (initial: not settled)
    payoutId: null,
    settledAt: null,
    settledBy: null,
    isClawback: false,

    // Timestamps
    purchasedAt,
    expiresAt,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Idempotent: use rcEventId as doc ID so duplicate trigger fires overwrite same data
  const ref = db.collection('affiliateTransactions').doc(rcEventId);
  await ref.set(data, { merge: false });

  logger.info('Created affiliateTransactions doc', {
    rcEventId,
    transactionType,
    promoCode,
    rcAppUserId: eventData.app_user_id,
    productId,
    priceUsd: eventData.price,
    currency: eventData.currency,
  });

  return ref;
}

// ---------------------------------------------------------------------------
// Refund handling: find and update existing doc by transaction linkage
// ---------------------------------------------------------------------------

/**
 * Finds the original affiliateTransactions doc that a REFUND event is refunding.
 * RevenueCat refund events carry `transaction_id` = the transaction being refunded.
 * Falls back to `original_transaction_id` if needed.
 */
export async function findTransactionForRefund(
  eventData: RcEventData,
): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  const db = admin.firestore();

  // Primary: match by rcTransactionId
  if (eventData.transaction_id) {
    const snap = await db
      .collection('affiliateTransactions')
      .where('rcTransactionId', '==', eventData.transaction_id)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0];
  }

  // Fallback: match by originalTransactionId + latest purchased doc
  if (eventData.original_transaction_id) {
    const snap = await db
      .collection('affiliateTransactions')
      .where('originalTransactionId', '==', eventData.original_transaction_id)
      .orderBy('purchasedAt', 'desc')
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0];
  }

  return null;
}

/**
 * Marks the refunded transaction. If the transaction was already settled
 * (payoutId != null), flags isClawback for admin review.
 */
export async function applyRefund(
  txnDoc: FirebaseFirestore.QueryDocumentSnapshot,
  eventData: RcEventData,
  rcEventId: string,
): Promise<void> {
  const txnData = txnDoc.data();
  const alreadySettled = txnData.payoutId != null;

  // Per RevenueCat docs: price is negative on REFUND events
  const refundedUsd = Math.abs(eventData.price ?? 0);
  const refundTs = eventData.event_timestamp_ms
    ? admin.firestore.Timestamp.fromMillis(eventData.event_timestamp_ms)
    : admin.firestore.Timestamp.now();

  await txnDoc.ref.update({
    isRefunded: true,
    priceUsdRefunded: admin.firestore.FieldValue.increment(refundedUsd),
    refundedAt: refundTs,
    refundEventId: rcEventId,
    isClawback: alreadySettled,
  });

  logger.info('Applied refund to affiliateTransactions doc', {
    transactionId: txnDoc.id,
    refundedUsd,
    isClawback: alreadySettled,
    rcEventId,
  });
}

// ---------------------------------------------------------------------------
// Promo code lookup + usage increment
// ---------------------------------------------------------------------------

export interface PromoCodeLookup {
  exists: boolean;
  isDiscountType: boolean;
  affiliateId: string | null;
  offeringId: string | null;
  maxUses: number;
  status: string;
}

export async function lookupPromoCode(code: string): Promise<PromoCodeLookup | null> {
  const db = admin.firestore();
  const doc = await db.collection('promoCodes').doc(code).get();

  if (!doc.exists) {
    return { exists: false, isDiscountType: false, affiliateId: null, offeringId: null, maxUses: 0, status: 'none' };
  }

  const data = doc.data()!;
  return {
    exists: true,
    isDiscountType: data.type === 'discount',
    affiliateId: data.affiliateId || null,
    offeringId: data.offeringId || null,
    maxUses: data.maxUses ?? 0,
    status: data.status || 'active',
  };
}
