export function handleAiError(error: any, functionName: string) {
    console.error(`${functionName} Error:`, error);

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
        return {
            success: false,
            error: {
                message: 'Invalid request data',
                details: error.errors,
                code: 'VALIDATION_ERROR',
                timestamp: new Date().toISOString(),
            }
        };
    }

    // Handle AI model errors
    if (error.message?.includes('API key') || error.message?.includes('quota')) {
        return {
            success: false,
            error: {
                message: 'AI service temporarily unavailable',
                code: 'AI_SERVICE_ERROR',
                timestamp: new Date().toISOString(),
            }
        };
    }

    // Handle JSON parsing errors
    if (error.message?.includes('JSON') || error.message?.includes('parse')) {
        return {
            success: false,
            error: {
                message: 'Invalid response from AI model',
                code: 'RESPONSE_PARSING_ERROR',
                timestamp: new Date().toISOString(),
            }
        };
    }

    // Generic error
    return {
        success: false,
        error: {
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            code: 'INTERNAL_ERROR',
            timestamp: new Date().toISOString(),
        }
    };
}