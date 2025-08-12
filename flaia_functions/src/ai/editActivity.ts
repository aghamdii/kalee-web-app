import { CallableRequest } from 'firebase-functions/v2/https';
import { GoogleGenAI } from '@google/genai';
import { PromptBuilder } from '../shared/promptBuilder';
import { AiConfig } from '../shared/aiConfig';
import { getActivityEditResponseSchema } from '../shared/schemas';
import { validateEditActivityRequest } from '../shared/validation';
import { handleAiError } from '../shared/errorHandler';
import { logPromptAsync, extractTokenUsage, extractAiConfig } from '../shared/promptLogger';
import { defineSecret } from 'firebase-functions/params';

const apiKey = defineSecret('GEMINI_API_KEY');

export async function editActivity(
    request: CallableRequest
): Promise<any> {
    try {
        const genAI = new GoogleGenAI({ apiKey: apiKey.value() });
        const data = request.data;
        const auth = request.auth;

        if (!auth) {
            throw new Error('Authentication required');
        }

        const validatedData = validateEditActivityRequest(data);
        const language = validatedData.language || 'English';
        const schemaVersion = validatedData.schema_version || 1;

        console.log(`[${auth.uid}] [edit_activity] Using schema version: ${schemaVersion}`);

        // Separate trip data from edit-specific data
        const tripData = {
            destination: validatedData.destination,
            check_in_date: validatedData.check_in_date,
            check_out_date: validatedData.check_out_date,
            number_of_days: validatedData.number_of_days,
            additional_notes: validatedData.additional_notes,
            preferred_currency: validatedData.preferred_currency
        };

        const editData = {
            current_activity: validatedData.current_activity,
            user_request: validatedData.user_request,
            day_context: validatedData.day_context,
            all_activities: validatedData.all_activities
        };

        // Build prompt with separated data and version support
        const prompt = PromptBuilder.buildEditPrompt(tripData, editData, language, schemaVersion);

        // Capture start time for performance metrics
        const startTime = Date.now();

        // Get schema based on version for better compatibility
        const responseSchema = getActivityEditResponseSchema(schemaVersion);
        const aiConfig = AiConfig.getGenerationConfigWithSchema(responseSchema);

        const result = await genAI.models.generateContent({
            model: AiConfig.DEFAULT_MODEL,
            contents: prompt,
            config: aiConfig,
        });

        const responseText = result.text;

        if (!responseText) {
            throw new Error('Empty response from AI model');
        }

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Response Text:', responseText.substring(0, 500));
            throw new Error('Invalid JSON response from AI model');
        }

        if (!jsonResponse.activity || !jsonResponse.activity.id || !jsonResponse.activity.name) {
            throw new Error('Invalid response structure from AI model');
        }

        // Calculate performance metrics
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Log prompt interaction to Firestore and get document ID
        const promptLogDocId = await logPromptAsync({
            user_id: auth.uid,
            prompt_type: 'edit',
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

        // Log successful edit with document ID for correlation
        console.log(`[${auth.uid}] [edit] [${promptLogDocId || 'NO_LOG_ID'}] Activity edited for ${tripData.destination}, activity: ${editData.current_activity.name}`);

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
        console.error('Edit Activity Error:', error);
        return handleAiError(error, 'editActivity');
    }
}