import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Event types we care about
const RELEVANT_EVENTS = ['RENEWAL', 'REFUND', 'EXPIRATION', 'CANCELLATION'];

export const updateDiscountTransactionStatusFunction = onDocumentCreated({
  document: 'revenuecatSubscriptionEvents/{eventId}',
  region: 'europe-west1',
  timeoutSeconds: 60,
  memory: '256MiB',
}, async (event) => {
  const eventData = event.data?.data();
  if (!eventData) {
    logger.warn('No data in RevenueCat event document');
    return;
  }

  const rcEventType = eventData.type as string;
  const appUserId = eventData.app_user_id as string;
  const eventTimestampMs = eventData.event_timestamp_ms as number;
  const productId = eventData.product_id as string | undefined;

  if (!appUserId || !rcEventType) {
    return;
  }

  // Quick exit: only process relevant event types
  if (!RELEVANT_EVENTS.includes(rcEventType)) {
    return;
  }

  try {
    const db = admin.firestore();

    // Find all discount transactions for this user (a user could have multiple codes)
    const txnSnapshot = await db
      .collection('discountTransactions')
      .where('rcAppUserId', '==', appUserId)
      .get();

    if (txnSnapshot.empty) {
      return; // Not a discount user — skip
    }

    // If multiple transactions exist, try to match by productIdentifier
    // Otherwise fall back to the most recent one
    let txnDoc = txnSnapshot.docs[0];
    if (txnSnapshot.size > 1 && productId) {
      const matchByProduct = txnSnapshot.docs.find(
        (doc) => doc.data().productIdentifier === productId
      );
      if (matchByProduct) {
        txnDoc = matchByProduct;
      }
    }

    const txnData = txnDoc.data();
    const currentStatus = txnData.status as string;
    const eventTimestamp = admin.firestore.Timestamp.fromMillis(eventTimestampMs);

    // Determine status update and history event based on event type + current status
    let newStatus: string | null = null;
    let historyEvent: string | null = null;
    const updates: Record<string, unknown> = {};

    switch (rcEventType) {
      case 'RENEWAL':
        if (currentStatus === 'trial') {
          newStatus = 'paid';
          historyEvent = 'converted';
          updates.convertedAt = eventTimestamp;
        } else {
          historyEvent = 'renewed';
        }
        break;

      case 'REFUND':
        newStatus = 'refunded';
        historyEvent = 'refunded';
        break;

      case 'EXPIRATION':
        if (currentStatus === 'trial') {
          newStatus = 'trial_expired';
          historyEvent = 'trial_expired';
        } else {
          historyEvent = 'expired';
        }
        break;

      case 'CANCELLATION':
        // Don't change status — user still has access until period ends
        historyEvent = 'cancelled';
        break;

      default:
        return;
    }

    // Build the update
    if (newStatus) {
      updates.status = newStatus;
    }

    if (historyEvent) {
      updates.statusHistory = admin.firestore.FieldValue.arrayUnion({
        event: historyEvent,
        timestamp: eventTimestamp,
        rcEventType,
      });
    }

    if (Object.keys(updates).length > 0) {
      await txnDoc.ref.update(updates);

      logger.info('Discount transaction status updated', {
        transactionId: txnDoc.id,
        rcEventType,
        previousStatus: currentStatus,
        newStatus: newStatus || currentStatus,
        historyEvent,
        appUserId,
      });
    }
  } catch (error: unknown) {
    logger.error('Error updating discount transaction status:', error);
  }
});
