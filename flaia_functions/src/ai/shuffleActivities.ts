import { CallableRequest } from 'firebase-functions/v2/https';
import { GoogleGenAI } from '@google/genai';
import { PromptBuilder } from '../shared/promptBuilder';
import { AiConfig } from '../shared/aiConfig';
import { getActivityShuffleResponseSchema } from '../shared/schemas';
import { validateShuffleActivitiesRequest } from '../shared/validation';
import { handleAiError } from '../shared/errorHandler';
import { logPromptAsync, extractTokenUsage, extractAiConfig } from '../shared/promptLogger';
import { defineSecret } from 'firebase-functions/params';

const apiKey = defineSecret('GEMINI_API_KEY');

export async function shuffleActivities(
    request: CallableRequest
): Promise<any> {
    try {
        const genAI = new GoogleGenAI({ apiKey: apiKey.value() });
        const data = request.data;
        const auth = request.auth;

        if (!auth) {
            throw new Error('Authentication required');
        }

        const validatedData = validateShuffleActivitiesRequest(data);
        const language = validatedData.language || 'English';
        const schemaVersion = validatedData.schema_version || 1;

        console.log(`[${auth.uid}] [shuffle] Using schema version: ${schemaVersion}`);

        // Separate trip data from shuffle-specific data
        const tripData = {
            destination: validatedData.destination,
            check_in_date: validatedData.check_in_date,
            check_out_date: validatedData.check_out_date,
            number_of_days: validatedData.number_of_days,
            additional_notes: validatedData.additional_notes,
            preferred_currency: validatedData.preferred_currency
        };

        const shuffleData = {
            activities_to_replace: validatedData.activities_to_replace,
            activities_to_replace_names: (validatedData as any).activities_to_replace_names,
            locked_activity_ids: validatedData.locked_activity_ids,
            locked_activity_names: (validatedData as any).locked_activity_names,
            all_activity_names: (validatedData as any).all_activity_names,
            existing_activities: validatedData.existing_activities
        };

        // Build prompt with separated data and version support
        const prompt = PromptBuilder.buildShufflePrompt(tripData, shuffleData, language, schemaVersion);

        // Capture start time for performance metrics
        const startTime = Date.now();

        // Get schema based on version for better compatibility
        const responseSchema = getActivityShuffleResponseSchema(schemaVersion);
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

        if (!jsonResponse.activities || !Array.isArray(jsonResponse.activities)) {
            throw new Error('Invalid response structure from AI model');
        }

        // Calculate performance metrics
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Log prompt interaction to Firestore and get document ID
        const promptLogDocId = await logPromptAsync({
            user_id: auth.uid,
            prompt_type: 'shuffle',
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

        // Better logging with document ID for correlation
        const activitiesCount = shuffleData.activities_to_replace?.length ||
            shuffleData.activities_to_replace_names?.length || 0;
        console.log(`[${auth.uid}] [shuffle] [${promptLogDocId || 'NO_LOG_ID'}] Activities shuffled for ${tripData.destination}, ${activitiesCount} activities replaced`);

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
        console.error('Shuffle Activities Error:', error);
        return handleAiError(error, 'shuffleActivities');
    }
}