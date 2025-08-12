import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenerativeAI } from '@google/genai';
import * as logger from 'firebase-functions/logger';

import { FoodAiConfig } from '../shared/aiConfig';
import { getFoodImageAnalysisSchema } from '../shared/schemas';
import { FoodPrompts } from '../shared/prompts';
import { FoodUtils } from '../shared/utils';

// Define the API key secret
const apiKey = defineSecret('GEMINI_API_KEY');

export const analyzeFoodImageFunction = onCall({
    region: 'europe-west1',
    timeoutSeconds: 90,
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
        FoodUtils.logFunctionStart('analyzeFoodImage', userId, data);
        
        // Validate input data
        const validation = FoodUtils.validateFoodImageRequest({...data, imagePath: actualImagePath});
        if (!validation.isValid) {
            throw new HttpsError('invalid-argument', `Invalid request: ${validation.errors.join(', ')}`);
        }
        
        const {
            storagePath: imagePath,
            language = 'en',
            unitSystem = 'metric'
        } = data;
        
        // Support both storagePath and imagePath for compatibility
        const actualImagePath = imagePath || data.imagePath;
        
        // Validate and normalize language and unit system
        const validLanguage = FoodPrompts.validateLanguage(language);
        const validUnitSystem = FoodPrompts.validateUnitSystem(unitSystem);
        
        // Validate image file
        const imageValidation = FoodUtils.validateImage(actualImagePath);
        if (!imageValidation.isValid) {
            throw new HttpsError('invalid-argument', imageValidation.error!);
        }
        
        // Download image from Firebase Storage
        let imageBuffer: Buffer;
        try {
            imageBuffer = await FoodUtils.getImageFromStorage(actualImagePath);
        } catch (error) {
            logger.error('Failed to download image:', error);
            throw new HttpsError('not-found', 'Image not found or inaccessible');
        }
        
        // Convert image to base64 for AI processing
        const imageBase64 = FoodUtils.imageToBase64(imageBuffer);
        
        // Initialize Google AI
        const genAI = new GoogleGenerativeAI(apiKey.value());
        const model = genAI.getGenerativeModel({ 
            model: FoodAiConfig.VISION_MODEL,
            generationConfig: FoodAiConfig.getGenerationConfigWithSchema(getFoodImageAnalysisSchema())
        });
        
        // Generate analysis prompt
        const prompt = FoodPrompts.getPhase1Prompt(validLanguage, validUnitSystem);
        
        // Generate session ID
        const sessionId = FoodPrompts.generateSessionId();
        
        try {
            // Analyze the image
            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: 'image/jpeg'
                    }
                }
            ]);
            
            const response = result.response;
            const analysisResult = JSON.parse(response.text());
            
            // Ensure session ID is set correctly
            analysisResult.sessionId = sessionId;
            analysisResult.language = validLanguage;
            
            // Save analysis session to Firestore for Phase 2
            await FoodUtils.saveAnalysisSession(sessionId, {
                userId,
                phase: 'phase1_completed',
                storagePath: actualImagePath,
                language: validLanguage,
                unitSystem: validUnitSystem,
                phase1Results: analysisResult,
                confidence: analysisResult.confidence || 0,
                phase1ProcessingTimeMs: timer.end(),
                modelUsed: FoodAiConfig.VISION_MODEL
            });
            
            // Log successful completion
            const duration = timer.end();
            FoodUtils.logFunctionEnd('analyzeFoodImage', userId, true, duration);
            
            logger.info('Food image analysis completed successfully', {
                userId,
                sessionId,
                mealName: analysisResult.mealName,
                ingredientCount: analysisResult.ingredients?.length || 0,
                confidence: analysisResult.confidence,
                language: validLanguage,
                duration: `${duration}ms`
            });
            
            return analysisResult;
            
        } catch (aiError: any) {
            logger.error('AI analysis failed:', aiError);
            
            // Return structured error response
            const errorMessage = FoodPrompts.getErrorMessage('image_analysis_failed', validLanguage);
            throw new HttpsError('internal', errorMessage, {
                code: 'image_analysis_failed',
                sessionId,
                originalError: aiError.message
            });
        }
        
    } catch (error: any) {
        const duration = timer.end();
        FoodUtils.logError('analyzeFoodImage', error, userId);
        FoodUtils.logFunctionEnd('analyzeFoodImage', userId, false, duration);
        
        // If it's already an HttpsError, re-throw it
        if (error instanceof HttpsError) {
            throw error;
        }
        
        // Handle unexpected errors
        const errorMessage = FoodPrompts.getErrorMessage('image_analysis_failed', data.language || 'en');
        throw new HttpsError('internal', errorMessage, {
            code: 'unexpected_error',
            originalError: error.message
        });
    }
});