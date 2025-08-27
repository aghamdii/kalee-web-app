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
 */

// UNIFIED FOOD ANALYSIS FUNCTIONS
export { analyzeMealImageFunction } from './food/analyzeMealImage';
export { analyzeLabelImageFunction } from './food/analyzeLabelImage';
export { analyzeMealTextFunction } from './food/analyzeMealText';
