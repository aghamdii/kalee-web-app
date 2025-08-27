import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';
import * as logger from 'firebase-functions/logger';

import { FoodAiConfig } from '../shared/aiConfig';
import { getUnifiedAnalysisSchema } from '../shared/unifiedSchemas';
import { UnifiedPrompts } from '../shared/unifiedPrompts';
import { FoodUtils } from '../shared/utils';
import { logFoodPromptAsync, extractFoodTokenUsage, extractFoodAiConfig, logFoodErrorAsync, updateDailyUsageStats } from '../shared/promptLogger';

// Define the API key secret
const apiKey = defineSecret('GEMINI_API_KEY');

export const analyzeMealImageFunction = onCall({
    region: 'europe-west1',
    timeoutSeconds: 120,
    memory: '1GiB',
    secrets: [apiKey],
    enforceAppCheck: false,
}, async (request) => {
    const timer = FoodUtils.createTimer();
    const { data, auth } = request;
    
    // Verify authentication
    if (!auth?.uid) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const userId = auth.uid;
    
    try {
        FoodUtils.logFunctionStart('analyzeMealImage', userId, data);
        
        const {
            storagePath,
            language = 'en',
            unitSystem = 'metric',
            notes = ''
        } = data;
        
        // Validate input data using unified validation
        const validation = FoodUtils.validateUnifiedAnalysisRequest(data);
        if (!validation.isValid) {
            throw new HttpsError('invalid-argument', `Invalid request: ${validation.errors.join(', ')}`);
        }
        
        // Validate and normalize language and unit system
        const validLanguage = UnifiedPrompts.validateLanguage(language);
        const validUnitSystem = UnifiedPrompts.validateUnitSystem(unitSystem);
        
        // Validate image file
        const imageValidation = FoodUtils.validateImage(storagePath);
        if (!imageValidation.isValid) {
            throw new HttpsError('invalid-argument', imageValidation.error!);
        }
        
        // Download image from Firebase Storage
        let imageBuffer: Buffer;
        try {
            imageBuffer = await FoodUtils.getImageFromStorage(storagePath);
        } catch (error) {
            logger.error('Failed to download image:', error);
            throw new HttpsError('not-found', 'Image not found or inaccessible');
        }
        
        // Convert image to base64 for AI processing
        const imageBase64 = FoodUtils.imageToBase64(imageBuffer);
        
        // Initialize Google AI with mobile-optimized schema
        const genAI = new GoogleGenAI({ apiKey: apiKey.value() });
        const responseSchema = getUnifiedAnalysisSchema(true); // Use mobile schema
        const aiConfig = FoodAiConfig.getGenerationConfigWithSchema(responseSchema);
        
        // Generate unified meal analysis prompt
        const prompt = UnifiedPrompts.getMealAnalysisPrompt(validLanguage, validUnitSystem, notes);
        
        // Generate session ID
        const sessionId = UnifiedPrompts.generateSessionId();
        
        try {
            // Capture start time for performance metrics
            const analysisStartTime = Date.now();
            
            // Generate content using structured output - Single comprehensive call
            const result = await genAI.models.generateContent({
                model: FoodAiConfig.DEFAULT_MODEL,
                contents: [{
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                data: imageBase64,
                                mimeType: 'image/jpeg'
                            }
                        }
                    ]
                }],
                config: aiConfig,
            });
            
            const responseText = result.text;
            const analysisEndTime = Date.now();
            const analysisTime = analysisEndTime - analysisStartTime;
            
            if (!responseText) {
                throw new Error('Empty response from AI model');
            }
            
            // With structured output, JSON parsing is guaranteed to succeed
            let analysisResult;
            try {
                analysisResult = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON Parse Error (should not happen with structured output):', parseError);
                console.error('Response Text:', responseText.substring(0, 500));
                throw new Error('Invalid JSON response from AI model - this indicates a schema issue');
            }
            
            // Enhance response with metadata
            analysisResult.sessionId = sessionId;
            analysisResult.mode = 'meal';
            analysisResult.processingTime = analysisTime;
            analysisResult.model = FoodAiConfig.DEFAULT_MODEL;
            analysisResult.language = validLanguage;
            analysisResult.unitSystem = validUnitSystem;
            analysisResult.userNotes = notes || undefined;
            analysisResult.success = true;
            
            // Add warnings for low food validity
            if (analysisResult.foodValidity?.score < 0.25) {
                analysisResult.warnings = [
                    ...(analysisResult.warnings || []),
                    'Low confidence this is food. Please ensure you are photographing actual food items.'
                ];
            }
            
            // Add performance warning for very slow responses
            if (analysisTime > 15000) {
                analysisResult.suggestions = [
                    ...(analysisResult.suggestions || []),
                    'Analysis took longer than expected. Try taking clearer photos with better lighting.'
                ];
            }
            
            // Validate nutrition values are reasonable
            const nutrition = analysisResult.nutrition;
            if (nutrition) {
                if (nutrition.calories > 2000) {
                    analysisResult.warnings = [
                        ...(analysisResult.warnings || []),
                        'Very high calorie estimate. Please verify portion sizes.'
                    ];
                }
                
                // Check calorie-macro alignment (protein*4 + carbs*4 + fat*9 should ≈ calories)
                const calculatedCalories = (nutrition.protein * 4) + (nutrition.carbs * 4) + (nutrition.fat * 9);
                const caloriesDifference = Math.abs(nutrition.calories - calculatedCalories);
                if (caloriesDifference > nutrition.calories * 0.2) { // More than 20% difference
                    analysisResult.suggestions = [
                        ...(analysisResult.suggestions || []),
                        'Macronutrient ratios may need adjustment. Consider the cooking method and hidden ingredients.'
                    ];
                }
            }
            
            // Log comprehensive prompt interaction for monitoring
            const promptLogDocId = await logFoodPromptAsync({
                user_id: userId,
                prompt_type: 'unified_meal_analysis',
                session_id: sessionId,
                user_request: data,
                prompt_text: prompt,
                llm_response: analysisResult,
                token_usage: extractFoodTokenUsage(result.usageMetadata, true), // true = includes image
                ai_config: extractFoodAiConfig(FoodAiConfig.DEFAULT_MODEL, aiConfig),
                performance: {
                    response_time_ms: analysisTime,
                    success: true,
                    confidence_score: analysisResult.confidence,
                    food_validity_score: analysisResult.foodValidity?.score || 0,
                    total_calories: analysisResult.nutrition?.calories || 0
                },
                food_metadata: {
                    meal_name: analysisResult.mealName,
                    language: validLanguage,
                    unit_system: validUnitSystem,
                    image_size_bytes: imageBuffer.length,
                    storage_path: storagePath,
                    mode: 'meal',
                    has_user_notes: !!notes,
                    ingredient_count: analysisResult.ingredients?.length || 0
                }
            });
            
            // Update daily usage stats for cost tracking
            await updateDailyUsageStats(userId, extractFoodTokenUsage(result.usageMetadata, true));
            
            // Log successful completion
            const duration = timer.end();
            FoodUtils.logFunctionEnd('analyzeMealImage', userId, true, duration);
            
            // Enhanced logging with correlation ID
            logger.info(`[${userId}] [unified_meal] [${promptLogDocId || 'NO_LOG_ID'}] Analysis completed`, {
                sessionId,
                mealName: analysisResult.mealName,
                totalCalories: analysisResult.nutrition?.calories || 0,
                macros: {
                    protein: analysisResult.nutrition?.protein || 0,
                    carbs: analysisResult.nutrition?.carbs || 0,
                    fat: analysisResult.nutrition?.fat || 0
                },
                confidence: analysisResult.confidence,
                foodValidityScore: analysisResult.foodValidity?.score || 0,
                language: validLanguage,
                unitSystem: validUnitSystem,
                hasNotes: !!notes,
                warningCount: analysisResult.warnings?.length || 0,
                tokens: result.usageMetadata?.totalTokenCount || 0,
                duration: `${duration}ms`
            });
            
            return analysisResult;
            
        } catch (aiError: any) {
            const errorTime = timer.end();
            logger.error('Unified meal analysis failed:', aiError);
            
            // Log error for debugging
            await logFoodErrorAsync({
                user_id: userId,
                prompt_type: 'unified_meal_analysis',
                session_id: sessionId,
                error_code: 'meal_analysis_failed',
                error_message: aiError.message,
                user_request: data,
                prompt_text: prompt,
                performance: {
                    response_time_ms: errorTime,
                    success: false
                }
            });
            
            // Return structured error response
            const errorMessage = UnifiedPrompts.getErrorMessage('image_analysis_failed', validLanguage);
            throw new HttpsError('internal', errorMessage, {
                code: 'meal_analysis_failed',
                sessionId,
                originalError: aiError.message
            });
        }
        
    } catch (error: any) {
        const duration = timer.end();
        FoodUtils.logError('analyzeMealImage', error, userId);
        FoodUtils.logFunctionEnd('analyzeMealImage', userId, false, duration);
        
        // If it's already an HttpsError, re-throw it
        if (error instanceof HttpsError) {
            throw error;
        }
        
        // Handle unexpected errors
        const errorMessage = UnifiedPrompts.getErrorMessage('image_analysis_failed', data.language || 'en');
        throw new HttpsError('internal', errorMessage, {
            code: 'unexpected_error',
            originalError: error.message
        });
    }
});