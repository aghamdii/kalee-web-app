/**
 * Firebase Cloud Functions for Kalee AI Food Detection
 *
 * This module exports AI-powered food detection and nutrition analysis functions
 * using a unified single-phase analysis system:
 *
 * UNIFIED SYSTEM:
 * - Single-phase analysis with complete nutrition data in one call
 * - Food validity detection to prevent non-food analysis
 * - Support for both meal photos and nutrition labels
 * - Comprehensive nutrition analysis with confidence scoring
 *
 * ONBOARDING NOTIFICATIONS:
 * - Automated 3-day onboarding flow (Day 1, 2, 3 at 24h, 48h, 72h intervals)
 * - Multi-language support (Arabic, English, Japanese, Korean)
 * - Cloud Tasks scheduling with FCM delivery
 */

// UNIFIED FOOD ANALYSIS FUNCTIONS
export { analyzeMealImageFunction } from './food/analyzeMealImage';
export { analyzeLabelImageFunction } from './food/analyzeLabelImage';
export { analyzeMealTextFunction } from './food/analyzeMealText';

// NOTIFICATION FUNCTIONS
export { scheduleOnboardingNotifications } from './notifications/scheduleOnboarding';
export { sendScheduledNotification } from './notifications/sendScheduledNotification';
