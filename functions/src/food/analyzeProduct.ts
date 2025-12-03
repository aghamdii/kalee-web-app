import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';
import * as logger from 'firebase-functions/logger';

import { FoodAiConfig } from '../shared/aiConfig';
import { getProductAnalysisSchema } from '../shared/productSchemas';
import { ProductPrompts } from '../shared/productPrompts';
import { FoodUtils } from '../shared/utils';
import { logFoodPromptAsync, extractFoodTokenUsage, extractFoodAiConfig, logFoodErrorAsync, updateDailyUsageStats } from '../shared/promptLogger';

// Define the API key secret
const apiKey = defineSecret('GEMINI_API_KEY');

export const analyzeProductFunction = onCall({
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
        FoodUtils.logFunctionStart('analyzeProduct', userId, data);

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
        const validLanguage = ProductPrompts.validateLanguage(language);
        const validUnitSystem = ProductPrompts.validateUnitSystem(unitSystem);

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

        // Initialize Google AI with product analysis schema (fast config - no thinking)
        const genAI = new GoogleGenAI({ apiKey: apiKey.value() });
        const responseSchema = getProductAnalysisSchema();
        const aiConfig = FoodAiConfig.getFastConfigWithSchema(responseSchema);

        // Generate product analysis prompt
        const prompt = ProductPrompts.getProductAnalysisPrompt(validLanguage, validUnitSystem, notes);

        // Generate session ID
        const sessionId = ProductPrompts.generateSessionId();

        try {
            // Capture start time for performance metrics
            const analysisStartTime = Date.now();

            // Generate content using structured output
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

            // Parse structured output
            let analysisResult;
            try {
                analysisResult = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON Parse Error (should not happen with structured output):', parseError);
                console.error('Response Text:', responseText.substring(0, 500));
                throw new Error('Invalid JSON response from AI model - this indicates a schema issue');
            }

            // Validate required fields
            if (!analysisResult.servingSize || analysisResult.servingsPerContainer === undefined) {
                throw new Error('Missing required serving information');
            }
            if (analysisResult.calories === undefined || analysisResult.protein === undefined ||
                analysisResult.carbs === undefined || analysisResult.fat === undefined) {
                throw new Error('Missing required nutrition facts');
            }

            // Log comprehensive prompt interaction
            const promptLogDocId = await logFoodPromptAsync({
                user_id: userId,
                prompt_type: 'product_analysis',
                session_id: sessionId,
                user_request: data,
                prompt_text: prompt,
                llm_response: analysisResult,
                token_usage: extractFoodTokenUsage(result.usageMetadata, true),
                ai_config: extractFoodAiConfig(FoodAiConfig.DEFAULT_MODEL, aiConfig),
                performance: {
                    response_time_ms: analysisTime,
                    success: true,
                    confidence_score: analysisResult.confidenceScore,
                    total_calories: analysisResult.calories || 0
                },
                food_metadata: {
                    meal_name: `Product (${analysisResult.servingSize})`,
                    language: validLanguage,
                    unit_system: validUnitSystem,
                    image_size_bytes: imageBuffer.length,
                    storage_path: storagePath,
                    mode: 'product',
                    has_user_notes: !!notes
                }
            });

            // Update daily usage stats
            await updateDailyUsageStats(userId, extractFoodTokenUsage(result.usageMetadata, true));

            // Log successful completion
            const duration = timer.end();
            FoodUtils.logFunctionEnd('analyzeProduct', userId, true, duration);

            // Enhanced logging
            logger.info(`[${userId}] [product_analysis] [${promptLogDocId || 'NO_LOG_ID'}] Analysis completed`, {
                sessionId,
                servingSize: analysisResult.servingSize,
                servingsPerContainer: analysisResult.servingsPerContainer,
                calories: analysisResult.calories,
                confidence: analysisResult.confidenceScore,
                language: validLanguage,
                unitSystem: validUnitSystem,
                hasNotes: !!notes,
                tokens: result.usageMetadata?.totalTokenCount || 0,
                duration: `${duration}ms`
            });

            // Return the AI response directly (flat structure matching Flutter spec)
            return analysisResult;

        } catch (aiError: any) {
            const errorTime = timer.end();
            logger.error('Product analysis failed:', aiError);

            // Log error for debugging
            await logFoodErrorAsync({
                user_id: userId,
                prompt_type: 'product_analysis',
                session_id: sessionId,
                error_code: 'product_analysis_failed',
                error_message: aiError.message,
                user_request: data,
                prompt_text: prompt,
                performance: {
                    response_time_ms: errorTime,
                    success: false
                }
            });

            // Return structured error response
            const errorMessage = ProductPrompts.getErrorMessage('image_analysis_failed', validLanguage);
            throw new HttpsError('internal', errorMessage, {
                code: 'product_analysis_failed',
                sessionId,
                originalError: aiError.message
            });
        }

    } catch (error: any) {
        const duration = timer.end();
        FoodUtils.logError('analyzeProduct', error, userId);
        FoodUtils.logFunctionEnd('analyzeProduct', userId, false, duration);

        // If it's already an HttpsError, re-throw it
        if (error instanceof HttpsError) {
            throw error;
        }

        // Handle unexpected errors
        const errorMessage = ProductPrompts.getErrorMessage('image_analysis_failed', data.language || 'en');
        throw new HttpsError('internal', errorMessage, {
            code: 'unexpected_error',
            originalError: error.message
        });
    }
});