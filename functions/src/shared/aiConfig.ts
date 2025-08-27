export class FoodAiConfig {
    // Model Configuration - Using same model as Flaia functions
    static readonly DEFAULT_MODEL = 'gemini-2.5-flash'; // Same as Flaia
    static readonly DEFAULT_TEMPERATURE = 0.25; // Same as Flaia  
    static readonly DEFAULT_MAX_TOKENS = 24000; // Same as Flaia

    // Base Generation Configuration for @google/genai - Same as Flaia
    static readonly BASE_GENERATION_CONFIG = {
        temperature: FoodAiConfig.DEFAULT_TEMPERATURE,
        maxOutputTokens: FoodAiConfig.DEFAULT_MAX_TOKENS,
        responseMimeType: 'application/json',
        thinkingConfig: {
            includeThoughts: true,
            thinkingBudget: 1250,
        },
    };

    // Get generation config with schema - Same approach as Flaia
    static getGenerationConfigWithSchema(responseSchema: any) {
        return {
            ...FoodAiConfig.BASE_GENERATION_CONFIG,
            responseSchema: responseSchema,
        };
    }

    // Supported languages for food analysis
    static readonly SUPPORTED_LANGUAGES = {
        en: { name: 'English', nativeName: 'English' },
        ar: { name: 'Arabic', nativeName: 'العربية' },
        es: { name: 'Spanish', nativeName: 'Español' },
        fr: { name: 'French', nativeName: 'Français' },
        de: { name: 'German', nativeName: 'Deutsch' },
        it: { name: 'Italian', nativeName: 'Italiano' },
        pt: { name: 'Portuguese', nativeName: 'Português' },
        ru: { name: 'Russian', nativeName: 'Русский' },
        ja: { name: 'Japanese', nativeName: '日本語' },
        ko: { name: 'Korean', nativeName: '한국어' },
        zh: { name: 'Chinese', nativeName: '中文' },
        hi: { name: 'Hindi', nativeName: 'हिन्दी' },
        tr: { name: 'Turkish', nativeName: 'Türkçe' },
        nl: { name: 'Dutch', nativeName: 'Nederlands' },
        sv: { name: 'Swedish', nativeName: 'Svenska' }
    };

    // Unit systems
    static readonly UNIT_SYSTEMS = {
        metric: {
            weight: 'g',
            volume: 'ml',
            temperature: '°C'
        },
        imperial: {
            weight: 'oz',
            volume: 'fl oz',
            temperature: '°F'
        }
    };

    // Common food categories for better AI recognition
    static readonly FOOD_CATEGORIES = [
        'grains', 'vegetables', 'fruits', 'protein', 'dairy', 'nuts', 'oils', 
        'spices', 'beverages', 'sweets', 'processed', 'seafood', 'poultry', 
        'meat', 'legumes', 'herbs'
    ];

    // Meal types
    static readonly MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

    // Default values for quick mode
    static getDefaultUserPreferences() {
        return {
            language: 'en',
            unitSystem: 'metric',
            dietaryRestrictions: [],
            activityLevel: 'moderate'
        };
    }
}