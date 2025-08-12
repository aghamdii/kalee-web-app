import { CallableRequest } from 'firebase-functions/v2/https';
import { GoogleGenAI } from '@google/genai';
import { PromptBuilder } from '../shared/promptBuilder';
import { AiConfig } from '../shared/aiConfig';
import { getItineraryResponseSchema } from '../shared/schemas';
import { validateInitialItineraryRequest } from '../shared/validation';
import { handleAiError } from '../shared/errorHandler';
import { logPromptAsync, extractTokenUsage, extractAiConfig } from '../shared/promptLogger';
import { defineSecret } from 'firebase-functions/params';

// Initialize Gemini AI with @google/genai
const apiKey = defineSecret('GEMINI_API_KEY');

export async function generateInitialItinerary(
    request: CallableRequest
): Promise<any> {
    try {
        const genAI = new GoogleGenAI({ apiKey: apiKey.value() });
        // Extract data and auth from request object
        const data = request.data;
        const auth = request.auth;

        // Validate authentication
        if (!auth) {
            throw new Error('Authentication required');
        }

        // Validate request data
        const validatedData = validateInitialItineraryRequest(data);

        // Get user's language preference (default to English)
        const language = validatedData.language || 'English';
        const schemaVersion = validatedData.schema_version || 1;

        // Build prompt using improved prompt builder with version support
        const prompt = PromptBuilder.buildQuickItineraryPrompt(validatedData, language, schemaVersion);

        // Capture start time for performance metrics
        const startTime = Date.now();

        // Get schema based on version for better compatibility
        const responseSchema = getItineraryResponseSchema(schemaVersion);
        const aiConfig = AiConfig.getGenerationConfigWithSchema(responseSchema);

        // Generate content using structured output (RECOMMENDED approach)
        const result = await genAI.models.generateContent({
            model: AiConfig.DEFAULT_MODEL,
            contents: prompt,
            config: aiConfig,
        });

        const responseText = result.text;

        if (!responseText) {
            throw new Error('Empty response from AI model');
        }

        // With structured output, JSON parsing is guaranteed to succeed
        // But we still wrap in try-catch for safety
        let jsonResponse;
        try {
            jsonResponse = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON Parse Error (should not happen with structured output):', parseError);
            console.error('Response Text:', responseText.substring(0, 500));
            throw new Error('Invalid JSON response from AI model - this indicates a schema issue');
        }

        // With structured output schema, validation is built-in
        // But we still do basic validation for safety
        if (!jsonResponse.title || !jsonResponse.destination || !jsonResponse.days) {
            throw new Error('Invalid response structure from AI model - schema validation failed');
        }

        // Calculate performance metrics
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Log prompt interaction to Firestore and get document ID
        const promptLogDocId = await logPromptAsync({
            user_id: auth.uid,
            prompt_type: 'initial_search',
            user_request: validatedData,
            prompt_text: prompt,
            llm_response: jsonResponse,
            token_usage: extractTokenUsage(result.usageMetadata),
            ai_config: extractAiConfig(AiConfig.DEFAULT_MODEL, aiConfig),
            performance: {
                response_time_ms: responseTime,
                success: true
            }
        });

        // Log successful generation with document ID for correlation
        console.log(`[${auth.uid}] [initial_search] [${promptLogDocId || 'NO_LOG_ID'}] Initial itinerary generated for ${validatedData.destination}, ${validatedData.number_of_days} days`);

        return {
            success: true,
            data: jsonResponse,
            metadata: {
                model: AiConfig.DEFAULT_MODEL,
                language: language,
                schema_version: schemaVersion,
                generated_at: new Date().toISOString(),
                user_id: auth.uid,
                prompt_log_doc_id: promptLogDocId, // Include document ID for reference
            }
        };

    } catch (error) {
        console.error('Generate Initial Itinerary Error:', error);
        return handleAiError(error, 'generateInitialItinerary');
    }
}