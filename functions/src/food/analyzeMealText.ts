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

export const analyzeMealTextFunction = onCall({
    region: 'europe-west1',
    timeoutSeconds: 60,
    memory: '512MiB',
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
        FoodUtils.logFunctionStart('analyzeMealText', userId, data);
        
        const {
            text,
            language = 'en',
            unitSystem = 'metric',
            notes = ''
        } = data;
        
        // Validate input data
        const validation = validateTextAnalysisRequest(data);
        if (!validation.isValid) {
            throw new HttpsError('invalid-argument', `Invalid request: ${validation.errors.join(', ')}`);
        }
        
        // Validate and normalize language and unit system
        const validLanguage = UnifiedPrompts.validateLanguage(language);
        const validUnitSystem = UnifiedPrompts.validateUnitSystem(unitSystem);
        
        // Initialize Google AI with mobile-optimized schema
        const genAI = new GoogleGenAI({ apiKey: apiKey.value() });
        const responseSchema = getUnifiedAnalysisSchema(true); // Use mobile schema
        const aiConfig = FoodAiConfig.getGenerationConfigWithSchema(responseSchema);
        
        // Generate text analysis prompt
        const prompt = UnifiedPrompts.getTextAnalysisPrompt(text, validLanguage, validUnitSystem, notes);
        
        // Generate session ID
        const sessionId = UnifiedPrompts.generateSessionId();
        
        try {
            // Capture start time for performance metrics
            const analysisStartTime = Date.now();
            
            // Generate content using structured output - Text-only analysis
            const result = await genAI.models.generateContent({
                model: FoodAiConfig.DEFAULT_MODEL,
                contents: [{
                    role: 'user',
                    parts: [{ text: prompt }]
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
            analysisResult.mode = 'text';
            analysisResult.processingTime = analysisTime;
            analysisResult.model = FoodAiConfig.DEFAULT_MODEL;
            analysisResult.language = validLanguage;
            analysisResult.unitSystem = validUnitSystem;
            analysisResult.userNotes = notes || undefined;
            analysisResult.success = true;
            analysisResult.textInput = text;
            
            // Add warnings for very low confidence (but don't block - let Flutter decide)
            if (analysisResult.confidence < 0.3) {
                analysisResult.warnings = [
                    ...(analysisResult.warnings || []),
                    'Very low confidence in food recognition. Please provide more specific details.'
                ];
            }
            
            // Add suggestions for vague descriptions
            if (analysisResult.confidence < 0.6) {
                analysisResult.suggestions = [
                    ...(analysisResult.suggestions || []),
                    'For better accuracy, include specific foods, quantities, and cooking methods.'
                ];
            }
            
            // Validate nutrition values are reasonable for text input
            const nutrition = analysisResult.nutrition;
            if (nutrition) {
                // Check for unrealistic calories
                if (nutrition.calories > 3000) {
                    analysisResult.warnings = [
                        ...(analysisResult.warnings || []),
                        'Very high calories detected. Please verify the meal description.'
                    ];
                }
                
                if (nutrition.calories < 10 && analysisResult.confidence > 0.5) {
                    analysisResult.warnings = [
                        ...(analysisResult.warnings || []),
                        'Very low calories detected. Please verify the meal description.'
                    ];
                }
            }
            
            // Log comprehensive prompt interaction for monitoring
            const promptLogDocId = await logFoodPromptAsync({
                user_id: userId,
                prompt_type: 'text_meal_analysis',
                session_id: sessionId,
                user_request: data,
                prompt_text: prompt,
                llm_response: analysisResult,
                token_usage: extractFoodTokenUsage(result.usageMetadata, false), // false = no image
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
                    mode: 'text',
                    has_user_notes: !!notes,
                    text_length: text.length,
                    text_input: text.substring(0, 100) // Store first 100 chars for analysis
                }
            });
            
            // Update daily usage stats for cost tracking
            await updateDailyUsageStats(userId, extractFoodTokenUsage(result.usageMetadata, false));
            
            // Log successful completion
            const duration = timer.end();
            FoodUtils.logFunctionEnd('analyzeMealText', userId, true, duration);
            
            // Enhanced logging with correlation ID
            logger.info(`[${userId}] [text_meal] [${promptLogDocId || 'NO_LOG_ID'}] Analysis completed`, {
                sessionId,
                mealName: analysisResult.mealName,
                totalCalories: analysisResult.nutrition?.calories || 0,
                macros: {
                    protein: analysisResult.nutrition?.protein || 0,
                    carbs: analysisResult.nutrition?.carbs || 0,
                    fat: analysisResult.nutrition?.fat || 0
                },
                confidence: analysisResult.confidence,
                foodValidity: analysisResult.foodValidity?.score || 0,
                language: validLanguage,
                unitSystem: validUnitSystem,
                hasNotes: !!notes,
                textLength: text.length,
                warningCount: analysisResult.warnings?.length || 0,
                tokens: result.usageMetadata?.totalTokenCount || 0,
                duration: `${duration}ms`
            });
            
            return analysisResult;
            
        } catch (aiError: any) {
            const errorTime = timer.end();
            logger.error('Text meal analysis failed:', aiError);
            
            // Log error for debugging
            await logFoodErrorAsync({
                user_id: userId,
                prompt_type: 'text_meal_analysis',
                session_id: sessionId,
                error_code: 'text_analysis_failed',
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
                code: 'text_analysis_failed',
                sessionId,
                originalError: aiError.message
            });
        }
        
    } catch (error: any) {
        const duration = timer.end();
        FoodUtils.logError('analyzeMealText', error, userId);
        FoodUtils.logFunctionEnd('analyzeMealText', userId, false, duration);
        
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

/**
 * Validate text analysis request data
 */
function validateTextAnalysisRequest(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.text || typeof data.text !== 'string') {
        errors.push('text is required and must be a string');
    } else {
        const trimmedText = data.text.trim();
        if (trimmedText.length < 2) {
            errors.push('text must be at least 2 characters long');
        }
        if (trimmedText.length > 500) {
            errors.push('text must be less than 500 characters');
        }
    }
    
    if (data.language && typeof data.language !== 'string') {
        errors.push('language must be a string');
    }
    
    if (data.unitSystem && !['metric', 'imperial'].includes(data.unitSystem)) {
        errors.push('unitSystem must be either "metric" or "imperial"');
    }
    
    if (data.notes && typeof data.notes !== 'string') {
        errors.push('notes must be a string');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}