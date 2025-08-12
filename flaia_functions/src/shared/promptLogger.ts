import * as admin from 'firebase-admin';

export interface PromptLogData {
    user_id: string;
    prompt_type: 'initial_search' | 'advanced_search' | 'shuffle' | 'edit';
    user_request: string; // JSON string of user request (for easy copy/paste)
    prompt_text: string; // The actual prompt sent to LLM
    llm_response: string; // JSON string of LLM response (for easy copy/paste)

    // Token usage analytics
    token_usage: {
        prompt_tokens: number;
        candidates_tokens: number;
        total_tokens: number;
        thinking_tokens?: number;        // Only present if thinking was used
        cached_content_tokens?: number; // Only present if cache was used
        tool_use_prompt_tokens?: number; // Only present if tools were used
        traffic_type?: string;           // Only present if available
    };

    // AI Configuration used
    ai_config: {
        model: string;
        temperature: number;
        max_output_tokens: number;
        thinking_config?: {
            include_thoughts: boolean;
            thinking_budget: number;
        };
    };

    // Performance metrics
    performance: {
        response_time_ms: number;
        success: boolean;
    };

    created_at: admin.firestore.Timestamp;
}

/**
 * Logs successful prompt interactions to Firestore 'prompts' collection
 * Returns the document ID for correlation with logs
 */
export async function logPromptInteraction(data: Omit<PromptLogData, 'created_at'>): Promise<string | null> {
    try {
        const db = admin.firestore();

        const promptDoc: PromptLogData = {
            ...data,
            created_at: admin.firestore.Timestamp.now(),
        };

        // Add document to 'prompts' collection
        const docRef = await db.collection('prompts').add(promptDoc);


        return docRef.id;
    } catch (error) {
        // Don't let logging errors break the main flow
        console.error(`[${data.user_id}] [${data.prompt_type}] [ERROR] Failed to log prompt interaction:`, error);
        return null;
    }
}

/**
 * Helper to extract token usage from Gemini API response
 * Only includes defined values to avoid Firestore undefined errors
 */
export function extractTokenUsage(usageMetadata: any) {
    const tokenUsage: any = {
        prompt_tokens: usageMetadata?.promptTokenCount || 0,
        candidates_tokens: usageMetadata?.candidatesTokenCount || 0,
        total_tokens: usageMetadata?.totalTokenCount || 0,
    };

    // Only include optional fields if they have actual values
    if (usageMetadata?.thoughtsTokenCount !== undefined) {
        tokenUsage.thinking_tokens = usageMetadata.thoughtsTokenCount;
    }

    if (usageMetadata?.cachedContentTokenCount !== undefined) {
        tokenUsage.cached_content_tokens = usageMetadata.cachedContentTokenCount;
    }

    if (usageMetadata?.toolUsePromptTokenCount !== undefined) {
        tokenUsage.tool_use_prompt_tokens = usageMetadata.toolUsePromptTokenCount;
    }

    if (usageMetadata?.trafficType !== undefined) {
        tokenUsage.traffic_type = usageMetadata.trafficType;
    }

    return tokenUsage;
}

/**
 * Helper to extract AI configuration
 * Only includes defined values to avoid Firestore undefined errors
 */
export function extractAiConfig(model: string, config: any) {
    const aiConfig: any = {
        model: model,
        temperature: config.temperature || 0,
        max_output_tokens: config.maxOutputTokens || 0,
    };

    // Only include thinking_config if it exists
    if (config.thinkingConfig) {
        aiConfig.thinking_config = {
            include_thoughts: config.thinkingConfig.includeThoughts || false,
            thinking_budget: config.thinkingConfig.thinkingBudget || 0,
        };
    }

    return aiConfig;
}

/**
 * Safely log prompt without blocking main response
 * Returns a promise that resolves to the document ID
 * Use this in the AI functions - automatically converts objects to JSON strings
 */
export function logPromptAsync(data: {
    user_id: string;
    prompt_type: 'initial_search' | 'advanced_search' | 'shuffle' | 'edit';
    user_request: any; // Will be converted to JSON string
    prompt_text: string;
    llm_response: any; // Will be converted to JSON string
    token_usage: any;
    ai_config: any;
    performance: any;
}): Promise<string | null> {

    // Convert objects to JSON strings for easy copy/paste debugging
    const logData: Omit<PromptLogData, 'created_at'> = {
        ...data,
        user_request: JSON.stringify(data.user_request, null, 2),
        llm_response: JSON.stringify(data.llm_response, null, 2),
    };

    // Return the promise but don't block main response
    return logPromptInteraction(logData).catch(error => {
        console.error(`[${data.user_id}] [${data.prompt_type}] [ERROR] Async prompt logging failed:`, error);
        return null;
    });
} 