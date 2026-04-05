/**
 * Firebase Cloud Functions for Kalee AI Food Detection
 *
 * This module exports AI-powered food detection and nutrition analysis functions
 * using a unified single-phase analysis system:
 *
 * UNIFIED SYSTEM:
 * - Single-phase analysis with complete nutrition data in one call
 * - Food validity detection to prevent non-food analysis
 * - Support for meal photos, nutrition labels, and product label scanning
 * - Comprehensive nutrition analysis with confidence scoring
 * - Advanced product analysis with ingredient detection and health ratings
 *
 * SCHEDULED NOTIFICATIONS:
 * - On-demand notification scheduling via callable function
 * - Multi-language support (Arabic, English, Japanese, Korean)
 * - Cloud Tasks scheduling with FCM delivery
 */

// UNIFIED FOOD ANALYSIS FUNCTIONS
export { analyzeMealImageFunction } from './food/analyzeMealImage';
export { analyzeLabelImageFunction } from './food/analyzeLabelImage';
export { analyzeMealTextFunction } from './food/analyzeMealText';
export { analyzeProductFunction } from './food/analyzeProduct';

// NOTIFICATION FUNCTIONS
export { scheduleOnboardingNotifications } from './notifications/scheduleOnboarding';
export { sendScheduledNotification } from './notifications/sendScheduledNotification';

// ADMIN FUNCTIONS
export { redeemPromoCodeFunction } from './admin/redeemPromoCode';
export { recordDiscountTransactionFunction as recordDiscountTransaction } from './admin/recordDiscountTransaction';
export { updateDiscountTransactionStatusFunction } from './admin/updateDiscountTransactionStatus';
export { sendBulkNotificationFunction } from './admin/sendBulkNotification';
export { syncRevenueCatDataFunction } from './admin/syncRevenueCatData';
