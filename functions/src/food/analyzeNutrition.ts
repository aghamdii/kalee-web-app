import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenerativeAI } from '@google/genai';
import * as logger from 'firebase-functions/logger';

import { FoodAiConfig } from '../shared/aiConfig';
import { getNutritionAnalysisSchema } from '../shared/schemas';
import { FoodPrompts } from '../shared/prompts';
import { FoodUtils } from '../shared/utils';

// Define the API key secret
const apiKey = defineSecret('GEMINI_API_KEY');

export const analyzeNutritionFunction = onCall({
    region: 'europe-west1',
    timeoutSeconds: 120,
    memory: '1GiB',
    secrets: [apiKey],
}, async (request) => {
    const timer = FoodUtils.createTimer();
    const { data, auth } = request;
    
    // Verify authentication
    if (!auth?.uid) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const userId = auth.uid;
    
    try {
        FoodUtils.logFunctionStart('analyzeNutrition', userId, data);
        
        // Validate input data
        const validation = FoodUtils.validateNutritionRequest(data);
        if (!validation.isValid) {
            throw new HttpsError('invalid-argument', `Invalid request: ${validation.errors.join(', ')}`);
        }
        
        const {
            sessionId,
            mealName,
            ingredients,
            additionalInfo,
            dietaryRestrictions = [],
            language = 'en'
        } = data;
        
        // Validate and normalize language
        const validLanguage = FoodPrompts.validateLanguage(language);
        
        // Retrieve Phase 1 analysis session
        const session = await FoodUtils.getAnalysisSession(sessionId);
        if (!session) {
            const errorMessage = FoodPrompts.getErrorMessage('invalid_session', validLanguage);
            throw new HttpsError('not-found', errorMessage, {
                code: 'invalid_session',
                sessionId
            });
        }
        
        // Verify session belongs to the authenticated user
        if (session.userId !== userId) {
            throw new HttpsError('permission-denied', 'Session does not belong to authenticated user');
        }
        
        // Verify this is a valid Phase 1 session
        if (session.phase !== 1 || !session.phase1Results) {
            const errorMessage = FoodPrompts.getErrorMessage('invalid_session', validLanguage);
            throw new HttpsError('invalid-argument', errorMessage, {
                code: 'invalid_session_phase',
                sessionId
            });
        }
        
        // Get original image for context (optional - helps with portion estimation)
        let imageBase64: string | null = null;
        if (session.imagePath) {
            try {
                const imageBuffer = await FoodUtils.getImageFromStorage(session.imagePath);
                imageBase64 = FoodUtils.imageToBase64(imageBuffer);
            } catch (error) {
                logger.warn('Could not retrieve original image for nutrition analysis:', error);
                // Continue without image - nutrition analysis can work with just ingredients
            }
        }
        
        // Initialize Google AI
        const genAI = new GoogleGenerativeAI(apiKey.value());
        const model = genAI.getGenerativeModel({ 
            model: FoodAiConfig.TEXT_MODEL,
            generationConfig: FoodAiConfig.getGenerationConfigWithSchema(getNutritionAnalysisSchema())
        });
        
        // Generate nutrition analysis prompt
        const prompt = FoodPrompts.getPhase2Prompt(
            validLanguage,
            session.unitSystem || 'metric',
            mealName,
            ingredients,
            additionalInfo,
            dietaryRestrictions
        );
        
        try {
            // Prepare content for AI analysis
            const content: any[] = [prompt];
            
            // Include original image if available for better portion estimation
            if (imageBase64) {
                content.push({
                    inlineData: {
                        data: imageBase64,
                        mimeType: 'image/jpeg'
                    }
                });
            }
            
            // Analyze nutrition
            const result = await model.generateContent(content);
            const response = result.response;
            const nutritionResult = JSON.parse(response.text());
            
            // Ensure session ID and language are set correctly
            nutritionResult.sessionId = sessionId;
            nutritionResult.language = validLanguage;
            
            // Validate nutrition data structure
            if (!nutritionResult.nutrition || 
                typeof nutritionResult.nutrition.calories !== 'number' ||
                typeof nutritionResult.nutrition.protein !== 'number' ||
                typeof nutritionResult.nutrition.carbohydrates !== 'number' ||
                typeof nutritionResult.nutrition.fat !== 'number') {
                throw new Error('Invalid nutrition data structure returned by AI');
            }
            
            // Update analysis session with Phase 2 results
            await FoodUtils.updateAnalysisSession(sessionId, {
                phase: 2,
                phase2Results: nutritionResult,
                finalMealName: mealName,
                finalIngredients: ingredients,
                additionalInfo,
                dietaryRestrictions,
                completed: true,
                completedAt: new Date().toISOString()
            });
            
            // Log successful completion
            const duration = timer.end();
            FoodUtils.logFunctionEnd('analyzeNutrition', userId, true, duration);
            
            logger.info('Nutrition analysis completed successfully', {
                userId,
                sessionId,
                mealName,
                totalCalories: nutritionResult.nutrition.calories,
                confidence: nutritionResult.confidence,
                language: validLanguage,
                duration: `${duration}ms`
            });
            
            return nutritionResult;
            
        } catch (aiError: any) {
            logger.error('Nutrition AI analysis failed:', aiError);
            
            // Return structured error response
            const errorMessage = FoodPrompts.getErrorMessage('nutrition_calculation_failed', validLanguage);
            throw new HttpsError('internal', errorMessage, {
                code: 'nutrition_calculation_failed',
                sessionId,
                originalError: aiError.message
            });
        }
        
    } catch (error: any) {
        const duration = timer.end();
        FoodUtils.logError('analyzeNutrition', error, userId, data.sessionId);
        FoodUtils.logFunctionEnd('analyzeNutrition', userId, false, duration);
        
        // If it's already an HttpsError, re-throw it
        if (error instanceof HttpsError) {
            throw error;
        }
        
        // Handle unexpected errors
        const errorMessage = FoodPrompts.getErrorMessage('nutrition_calculation_failed', data.language || 'en');
        throw new HttpsError('internal', errorMessage, {
            code: 'unexpected_error',
            sessionId: data.sessionId,
            originalError: error.message
        });
    }
});