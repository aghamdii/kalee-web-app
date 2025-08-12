export class AiConfig {
    // Model Configuration - Using latest Gemini model
    static readonly DEFAULT_MODEL = 'gemini-2.5-flash';
    static readonly DEFAULT_TEMPERATURE = 0.25;
    static readonly DEFAULT_MAX_TOKENS = 24000; // Reduced from 24K for efficiency

    // Base Generation Configuration for @google/genai
    static readonly BASE_GENERATION_CONFIG = {
        temperature: AiConfig.DEFAULT_TEMPERATURE,
        maxOutputTokens: AiConfig.DEFAULT_MAX_TOKENS,
        responseMimeType: 'application/json',
        thinkingConfig: {
            includeThoughts: true, // Don't include thoughts in response
            thinkingBudget: 1250, // Set thinking budget to 0 tokens
        },
    };

    // Get generation config with schema (recommended approach)
    static getGenerationConfigWithSchema(responseSchema: any) {
        return {
            ...AiConfig.BASE_GENERATION_CONFIG,
            responseSchema: responseSchema,
        };
    }

    // Activity Categories
    static readonly ACTIVITY_CATEGORIES = [
        'historic', 'food', 'culture', 'entertainment', 'nature', 'shopping',
        'adventure', 'sports', 'wellness', 'photography', 'localExperience',
        'education', 'scenic', 'markets', 'accommodation'
    ];

    // Default questionnaire answers for quick mode
    static getDefaultQuickSearchAnswers() {
        return {
            travel_companion: 'friends',
            budget_preference: {
                level: 'moderate',
                description: 'traveler who wants to spend a moderate amount of money'
            },
            meal_preferences: ['breakfast', 'lunch'],
            travel_interests: [
                {
                    type: 'food',
                    name: 'Food & Culinary',
                    description: 'Local cuisine and dining experiences'
                },
                {
                    type: 'art',
                    name: 'Art & Culture',
                    description: 'Museums, galleries, and cultural sites'
                },
                {
                    type: 'history',
                    name: 'History & Heritage',
                    description: 'Historical landmarks and heritage sites'
                },
                {
                    type: 'photography',
                    name: 'Photography',
                    description: 'Scenic spots and Instagram-worthy locations'
                }
            ],
            additional_details: 'Quick search mode with balanced preferences for breakfast and late lunch experiences.'
        };
    }
}