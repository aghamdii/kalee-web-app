/**
 * Firebase Cloud Functions for Kalee AI Food Detection
 * 
 * This module exports AI-powered food detection and nutrition analysis functions
 * that provide a two-phase analysis system:
 * 
 * Phase 1: Image Analysis - Identify food items and ingredients from photos
 * Phase 2: Nutrition Analysis - Calculate detailed macronutrient information
 */

// Food Detection Functions
export { analyzeFoodImageFunction } from './food/analyzeFoodImage';
export { analyzeNutritionFunction } from './food/analyzeNutrition';
export { saveMealEntryFunction } from './food/saveMealEntry';
