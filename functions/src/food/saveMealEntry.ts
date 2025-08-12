import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

import { FoodUtils } from '../shared/utils';

export const saveMealEntryFunction = onCall({
    region: 'europe-west1',
    timeoutSeconds: 60,
    memory: '512MiB',
}, async (request) => {
    const timer = FoodUtils.createTimer();
    const { data, auth } = request;
    
    // Verify authentication
    if (!auth?.uid) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const userId = auth.uid;
    
    try {
        FoodUtils.logFunctionStart('saveMealEntry', userId, data);
        
        // Validate input data
        const validation = validateMealEntryRequest(data);
        if (!validation.isValid) {
            throw new HttpsError('invalid-argument', `Invalid request: ${validation.errors.join(', ')}`);
        }
        
        const {
            sessionId,
            mealName,
            mealType,
            ingredients,
            nutrition,
            confidence,
            notes,
            storagePath,
            timestamp
        } = data;
        
        // Generate meal ID and prepare meal entry
        const mealId = generateMealId();
        const now = admin.firestore.Timestamp.now();
        const mealTimestamp = timestamp ? admin.firestore.Timestamp.fromDate(new Date(timestamp)) : now;
        
        // Generate tags and search keywords
        const tags = generateMealTags(mealName, mealType, ingredients);
        const searchKeywords = generateSearchKeywords(mealName, ingredients, notes);
        
        // Prepare meal entry document
        const mealEntry = {
            id: mealId,
            userId,
            mealName,
            mealType,
            ingredients,
            nutrition,
            confidence,
            notes: notes || '',
            imagePath: storagePath,
            source: 'ai_detection',
            tags,
            searchKeywords,
            timestamp: mealTimestamp,
            createdAt: now,
            updatedAt: now,
        };
        
        // Start batch write
        const db = admin.firestore();
        const batch = db.batch();
        
        // Save meal to meals collection
        const mealRef = db.collection('meals').doc(mealId);
        batch.set(mealRef, mealEntry);
        
        // Update user's meal statistics
        const userStatsRef = db.collection('userStats').doc(userId);
        batch.set(userStatsRef, {
            totalMeals: admin.firestore.FieldValue.increment(1),
            lastMealAt: now,
            totalCalories: admin.firestore.FieldValue.increment(nutrition.calories),
            mealsByType: {
                [mealType]: admin.firestore.FieldValue.increment(1)
            }
        }, { merge: true });
        
        // Update session with meal ID if session exists
        if (sessionId) {
            const sessionRef = db.collection('aiSessions').doc(sessionId);
            batch.update(sessionRef, {
                savedMealId: mealId,
                saved: true,
                savedAt: now
            });
        }
        
        // Commit batch
        await batch.commit();
        
        // Log successful completion
        const duration = timer.end();
        FoodUtils.logFunctionEnd('saveMealEntry', userId, true, duration);
        
        logger.info('Meal entry saved successfully', {
            userId,
            mealId,
            sessionId,
            mealName,
            mealType,
            totalCalories: nutrition.calories,
            duration: `${duration}ms`
        });
        
        return {
            success: true,
            mealId,
            data: {
                id: mealId,
                mealName,
                mealType,
                totalCalories: nutrition.calories,
                timestamp: mealTimestamp.toDate().toISOString(),
                tags
            },
            metadata: {
                processingTime: duration,
                saved: true
            }
        };
        
    } catch (error: any) {
        const duration = timer.end();
        FoodUtils.logError('saveMealEntry', error, userId, data.sessionId);
        FoodUtils.logFunctionEnd('saveMealEntry', userId, false, duration);
        
        // If it's already an HttpsError, re-throw it
        if (error instanceof HttpsError) {
            throw error;
        }
        
        // Handle unexpected errors
        throw new HttpsError('internal', 'Failed to save meal entry', {
            code: 'save_failed',
            originalError: error.message
        });
    }
});

/**
 * Validate meal entry request data
 */
function validateMealEntryRequest(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.mealName || typeof data.mealName !== 'string') {
        errors.push('mealName is required and must be a string');
    }
    
    if (!data.mealType || !['breakfast', 'lunch', 'dinner', 'snack'].includes(data.mealType)) {
        errors.push('mealType is required and must be one of: breakfast, lunch, dinner, snack');
    }
    
    if (!data.ingredients || !Array.isArray(data.ingredients) || data.ingredients.length === 0) {
        errors.push('ingredients is required and must be a non-empty array');
    }
    
    if (!data.nutrition || typeof data.nutrition !== 'object') {
        errors.push('nutrition is required and must be an object');
    } else {
        const { calories, protein, carbohydrates, fat } = data.nutrition;
        if (typeof calories !== 'number' || calories < 0) {
            errors.push('nutrition.calories must be a non-negative number');
        }
        if (typeof protein !== 'number' || protein < 0) {
            errors.push('nutrition.protein must be a non-negative number');
        }
        if (typeof carbohydrates !== 'number' || carbohydrates < 0) {
            errors.push('nutrition.carbohydrates must be a non-negative number');
        }
        if (typeof fat !== 'number' || fat < 0) {
            errors.push('nutrition.fat must be a non-negative number');
        }
    }
    
    if (data.confidence !== undefined && (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1)) {
        errors.push('confidence must be a number between 0 and 1');
    }
    
    if (!data.storagePath || typeof data.storagePath !== 'string') {
        errors.push('storagePath is required and must be a string');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Generate meal ID
 */
function generateMealId(): string {
    return `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate tags for meal categorization
 */
function generateMealTags(mealName: string, mealType: string, ingredients: any[]): string[] {
    const tags = new Set<string>();
    
    // Add meal type
    tags.add(mealType);
    
    // Add ingredient-based tags
    ingredients.forEach(ingredient => {
        const name = ingredient.name.toLowerCase();
        
        // Protein sources
        if (name.includes('chicken') || name.includes('beef') || name.includes('fish') || 
            name.includes('salmon') || name.includes('tuna') || name.includes('egg')) {
            tags.add('protein');
        }
        
        // Carb sources
        if (name.includes('rice') || name.includes('pasta') || name.includes('bread') || 
            name.includes('potato') || name.includes('quinoa')) {
            tags.add('carbs');
        }
        
        // Vegetables
        if (name.includes('vegetable') || name.includes('carrot') || name.includes('broccoli') || 
            name.includes('spinach') || name.includes('tomato') || name.includes('lettuce')) {
            tags.add('vegetables');
        }
        
        // Fruits
        if (name.includes('apple') || name.includes('banana') || name.includes('berry') || 
            name.includes('orange') || name.includes('fruit')) {
            tags.add('fruits');
        }
        
        // Dairy
        if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || 
            name.includes('butter')) {
            tags.add('dairy');
        }
    });
    
    // Cooking method tags from meal name
    const mealLower = mealName.toLowerCase();
    if (mealLower.includes('grilled')) tags.add('grilled');
    if (mealLower.includes('fried')) tags.add('fried');
    if (mealLower.includes('baked')) tags.add('baked');
    if (mealLower.includes('steamed')) tags.add('steamed');
    if (mealLower.includes('raw')) tags.add('raw');
    
    return Array.from(tags);
}

/**
 * Generate search keywords for meal discovery
 */
function generateSearchKeywords(mealName: string, ingredients: any[], notes: string): string[] {
    const keywords = new Set<string>();
    
    // Add meal name words
    mealName.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) keywords.add(word);
    });
    
    // Add ingredient names
    ingredients.forEach(ingredient => {
        ingredient.name.toLowerCase().split(/\s+/).forEach((word: string) => {
            if (word.length > 2) keywords.add(word);
        });
    });
    
    // Add notes words
    if (notes) {
        notes.toLowerCase().split(/\s+/).forEach(word => {
            if (word.length > 2) keywords.add(word);
        });
    }
    
    return Array.from(keywords);
}