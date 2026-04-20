import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import {
  RcEventData,
  getDiscountCode,
  lookupPromoCode,
  createAffiliateTransaction,
  findTransactionForRefund,
  applyRefund,
} from './affiliateTransactionHelpers';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Listens on revenuecatSubscriptionEvents and maintains the affiliateTransactions
 * ledger. Each commissionable event (INITIAL_PURCHASE, RENEWAL, PRODUCT_CHANGE)
 * creates one affiliateTransactions doc. REFUND events update the original doc.
 *
 * Event classification based on RevenueCat docs
 * (https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields):
 *
 *   INITIAL_PURCHASE → transactionType: 'initial_purchase'
 *     period_type === 'TRIAL'  → isTrial: true,  priceUsd: 0
 *     period_type === 'NORMAL' → isTrial: false, priceUsd > 0
 *
 *   RENEWAL → transactionType: 'trial_conversion' if is_trial_conversion === true,
 *             else 'renewal'
 *
 *   PRODUCT_CHANGE → transactionType: 'product_change'
 *
 *   REFUND → updates existing doc (price is negative on these events)
 *
 *   EXPIRATION, CANCELLATION, BILLING_ISSUE, etc. → not commissionable, skipped
 */
export const affiliateTransactionsListener = onDocumentCreated({
  document: 'revenuecatSubscriptionEvents/{eventId}',
  region: 'europe-west1',
  timeoutSeconds: 60,
  memory: '256MiB',
}, async (event) => {
  const eventData = event.data?.data() as RcEventData | undefined;
  if (!eventData) {
    logger.warn('No data in RevenueCat event document', { eventId: event.params.eventId });
    return;
  }

  const rcEventId = event.params.eventId;
  const rcEventType = eventData.type;
  const appUserId = eventData.app_user_id;

  if (!rcEventType || !appUserId) {
    return;
  }

  // Step 1: Only events with a discount_code subscriber attribute are relevant
  const discountCode = getDiscountCode(eventData);
  if (!discountCode) {
    return; // Not affiliate-driven
  }

  // Step 2: Validate the promo code exists and is a discount code
  const promoLookup = await lookupPromoCode(discountCode);
  if (!promoLookup || !promoLookup.exists) {
    logger.warn('Event has discount_code but promo code not found', {
      rcEventId, discountCode, appUserId, rcEventType,
    });
    return;
  }
  if (!promoLookup.isDiscountType) {
    logger.warn('Event has discount_code but promo is not a discount type', {
      rcEventId, discountCode, appUserId,
    });
    return;
  }

  try {
    switch (rcEventType) {
      case 'INITIAL_PURCHASE':
        await createAffiliateTransaction(
          eventData,
          rcEventId,
          'initial_purchase',
          discountCode,
          promoLookup.affiliateId,
          promoLookup.offeringId,
        );
        // Increment usedCount only on INITIAL_PURCHASE — one increment per
        // unique user who redeemed the code. Renewals / product changes
        // represent the same user and should not count again.
        await incrementPromoCodeUsage(discountCode, promoLookup);
        break;

      case 'RENEWAL': {
        // RevenueCat docs: is_trial_conversion === true means this renewal is the
        // transition from a free trial to a paid subscription
        const isConversion = eventData.is_trial_conversion === true;
        await createAffiliateTransaction(
          eventData,
          rcEventId,
          isConversion ? 'trial_conversion' : 'renewal',
          discountCode,
          promoLookup.affiliateId,
          promoLookup.offeringId,
        );
        break;
      }

      case 'PRODUCT_CHANGE':
        await createAffiliateTransaction(
          eventData,
          rcEventId,
          'product_change',
          discountCode,
          promoLookup.affiliateId,
          promoLookup.offeringId,
        );
        break;

      case 'REFUND': {
        const original = await findTransactionForRefund(eventData);
        if (!original) {
          logger.warn('Could not find original affiliateTransactions doc for REFUND', {
            rcEventId,
            transactionId: eventData.transaction_id,
            originalTransactionId: eventData.original_transaction_id,
          });
          return;
        }
        await applyRefund(original, eventData, rcEventId);
        break;
      }

      // Non-commissionable lifecycle events — skip
      case 'EXPIRATION':
      case 'CANCELLATION':
      case 'UNCANCELLATION':
      case 'BILLING_ISSUE':
      case 'SUBSCRIBER_ALIAS':
      case 'TRANSFER':
      case 'NON_RENEWING_PURCHASE':
        return;

      default:
        logger.info('Unhandled RevenueCat event type', { rcEventId, rcEventType });
        return;
    }
  } catch (error: unknown) {
    logger.error('Error processing affiliate transaction event', {
      rcEventId, rcEventType, discountCode, appUserId, error,
    });
  }
});

// ---------------------------------------------------------------------------
// Atomically increment promoCodes.usedCount and mark as 'used' when maxUses reached.
// Called only on INITIAL_PURCHASE — each unique user who redeems the code counts once.
// ---------------------------------------------------------------------------

async function incrementPromoCodeUsage(
  code: string,
  promoLookup: { maxUses: number; status: string },
): Promise<void> {
  const db = admin.firestore();
  const promoRef = db.collection('promoCodes').doc(code);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(promoRef);
    if (!doc.exists) return;

    const data = doc.data()!;
    const newUsedCount = (data.usedCount || 0) + 1;
    const shouldMarkUsed =
      promoLookup.maxUses !== -1 && newUsedCount >= promoLookup.maxUses;

    transaction.update(promoRef, {
      usedCount: newUsedCount,
      status: shouldMarkUsed ? 'used' : data.status,
      lastRedeemedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

