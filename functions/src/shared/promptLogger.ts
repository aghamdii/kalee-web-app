import * as admin from 'firebase-admin';

export interface FoodPromptLogData {
    user_id: string;
    prompt_type: 'unified_meal_analysis' | 'unified_label_analysis' | 'text_meal_analysis' | 'product_analysis';
    session_id?: string; // Session identifier for tracking
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
        image_tokens?: number;           // Tokens used for image processing
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
        confidence_score?: number; // AI confidence in the analysis
        ingredient_count?: number; // Number of ingredients detected
        total_calories?: number;   // Total calories calculated
    };
    
    // Food-specific metadata
    food_metadata?: {
        meal_name?: string;
        meal_type?: string; // breakfast, lunch, dinner, snack
        language?: string;
        unit_system?: string; // metric, imperial
        image_size_bytes?: number;
        storage_path?: string;
    };
    
    created_at: admin.firestore.Timestamp;
}

/**
 * Logs successful prompt interactions to Firestore 'food_prompts' collection
 * Returns the document ID for correlation with logs
 */
export async function logFoodPromptInteraction(data: Omit<FoodPromptLogData, 'created_at'>): Promise<string | null> {
    try {
        const db = admin.firestore();
        
        const promptDoc: FoodPromptLogData = {
            ...data,
            created_at: admin.firestore.Timestamp.now(),
        };
        
        // Add document to 'food_prompts' collection (separate from travel prompts)
        const docRef = await db.collection('food_prompts').add(promptDoc);
        
        // Log key metrics for monitoring
        console.log(`[${data.user_id}] [${data.prompt_type}] [${docRef.id}] Logged - Tokens: ${data.token_usage.total_tokens}, Time: ${data.performance.response_time_ms}ms`);
        
        return docRef.id;
    } catch (error) {
        // Don't let logging errors break the main flow
        console.error(`[${data.user_id}] [${data.prompt_type}] [ERROR] Failed to log prompt interaction:`, error);
        return null;
    }
}

/**
 * Helper to extract token usage from Gemini API response
 * Enhanced for image processing tokens
 */
export function extractFoodTokenUsage(usageMetadata: any, includesImage: boolean = false) {
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
    
    // Estimate image tokens if not provided
    if (includesImage && !tokenUsage.image_tokens) {
        // Rough estimate: images typically use 258-1032 tokens depending on resolution
        tokenUsage.image_tokens = 258; // Conservative estimate
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
export function extractFoodAiConfig(model: string, config: any) {
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
 * Safely log food prompt without blocking main response
 * Returns a promise that resolves to the document ID
 * Use this in the AI functions - automatically converts objects to JSON strings
 */
export function logFoodPromptAsync(data: {
    user_id: string;
    prompt_type: 'unified_meal_analysis' | 'unified_label_analysis' | 'text_meal_analysis' | 'product_analysis';
    session_id?: string;
    user_request: any; // Will be converted to JSON string
    prompt_text: string;
    llm_response: any; // Will be converted to JSON string
    token_usage: any;
    ai_config: any;
    performance: any;
    food_metadata?: any;
}): Promise<string | null> {
    
    // Convert objects to JSON strings for easy copy/paste debugging
    const logData: Omit<FoodPromptLogData, 'created_at'> = {
        ...data,
        user_request: typeof data.user_request === 'string' 
            ? data.user_request 
            : JSON.stringify(data.user_request, null, 2),
        llm_response: typeof data.llm_response === 'string'
            ? data.llm_response
            : JSON.stringify(data.llm_response, null, 2),
    };
    
    // Return the promise but don't block main response
    return logFoodPromptInteraction(logData).catch(error => {
        console.error(`[${data.user_id}] [${data.prompt_type}] [ERROR] Async prompt logging failed:`, error);
        return null;
    });
}

/**
 * Log error interactions for debugging
 */
export async function logFoodErrorAsync(data: {
    user_id: string;
    prompt_type: string;
    session_id?: string;
    error_code: string;
    error_message: string;
    user_request: any;
    prompt_text?: string;
    performance: {
        response_time_ms: number;
        success: false;
    };
}): Promise<void> {
    try {
        const db = admin.firestore();
        
        await db.collection('food_errors').add({
            ...data,
            user_request: JSON.stringify(data.user_request, null, 2),
            prompt_text: data.prompt_text || 'No prompt generated',
            created_at: admin.firestore.Timestamp.now(),
        });
        
        console.error(`[${data.user_id}] [${data.prompt_type}] [ERROR] ${data.error_code}: ${data.error_message}`);
    } catch (logError) {
        console.error('Failed to log error:', logError);
    }
}

/**
 * Create daily aggregation for cost tracking
 */
export async function updateDailyUsageStats(userId: string, tokenUsage: any): Promise<void> {
    try {
        const db = admin.firestore();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const statsRef = db.collection('food_usage_stats').doc(`${userId}_${today}`);
        
        await statsRef.set({
            user_id: userId,
            date: today,
            total_tokens: admin.firestore.FieldValue.increment(tokenUsage.total_tokens),
            prompt_tokens: admin.firestore.FieldValue.increment(tokenUsage.prompt_tokens),
            completion_tokens: admin.firestore.FieldValue.increment(tokenUsage.candidates_tokens),
            image_analysis_count: admin.firestore.FieldValue.increment(tokenUsage.image_tokens ? 1 : 0),
            request_count: admin.firestore.FieldValue.increment(1),
            updated_at: admin.firestore.Timestamp.now(),
        }, { merge: true });
        
    } catch (error) {
        console.error(`Failed to update usage stats for ${userId}:`, error);
    }
}