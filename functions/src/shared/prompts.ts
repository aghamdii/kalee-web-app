import { FoodAiConfig } from './aiConfig';

export class FoodPrompts {
    
    // Phase 1: Food Image Analysis Prompts
    static getPhase1Prompt(language: string = 'en', unitSystem: string = 'metric'): string {
        const languageInfo = FoodAiConfig.SUPPORTED_LANGUAGES[language as keyof typeof FoodAiConfig.SUPPORTED_LANGUAGES] || FoodAiConfig.SUPPORTED_LANGUAGES.en;
        const units = FoodAiConfig.UNIT_SYSTEMS[unitSystem as keyof typeof FoodAiConfig.UNIT_SYSTEMS] || FoodAiConfig.UNIT_SYSTEMS.metric;
        
        const basePrompt = `You are an expert food analyst and nutritionist. Analyze this food image and provide detailed ingredient identification.

**IMPORTANT**: All instructions are in English, but your response must be in ${languageInfo.nativeName} (${language}).

**Task**: Identify the meal and all visible ingredients with their estimated quantities.

**Units to Use**: 
- Weight: ${units.weight}
- Volume: ${units.volume}

**Portion Reference Guidelines**:
- Meat/Fish: Palm size ≈ ${unitSystem === 'metric' ? '120-150g' : '4-5 oz'}
- Rice/Pasta (cooked): Fist size ≈ ${unitSystem === 'metric' ? '150-200g' : '1 cup'}
- Vegetables: Handful ≈ ${unitSystem === 'metric' ? '80-100g' : '3-4 oz'}
- Cheese slice: Thumb size ≈ ${unitSystem === 'metric' ? '25-30g' : '1 oz'}
- Oil/Dressing: Thumb tip ≈ ${unitSystem === 'metric' ? '5-10ml' : '1 tsp'}
- Bread slice: Standard ≈ ${unitSystem === 'metric' ? '25-30g' : '1 slice'}

**Instructions**:
1. **Meal Name**: Provide the most accurate name for this dish/meal (in ${languageInfo.nativeName})
2. **Ingredients**: List ALL visible ingredients with:
   - Accurate names in ${languageInfo.nativeName}
   - Realistic quantity estimates using portion references above
   - Appropriate food category
   - High confidence scores for clear ingredients
3. **Meal Type**: Suggest meal type based on visual cues and typical eating patterns

**Quality Guidelines**:
- Be specific with ingredient names (e.g., "grilled chicken breast" not just "meat")
- Include cooking method if visible (grilled, fried, steamed, baked, raw)
- Estimate quantities using visual cues like plate size, utensil size for scale
- Identify major seasonings or sauces if clearly visible
- Account for hidden ingredients in prepared dishes (oils, butter, etc.)

**Example Response Structure**:
{
  "sessionId": "unique-session-id",
  "mealName": "Grilled Chicken Caesar Salad",
  "confidence": 0.85,
  "ingredients": [
    {
      "name": "Grilled Chicken Breast",
      "quantity": 150,
      "unit": "g",
      "confidence": 0.90,
      "category": "protein"
    }
  ],
  "suggestedMealType": "lunch",
  "language": "${language}"
}

Generate a unique sessionId and analyze the food image now.`;

        return basePrompt;
    }

    // Phase 2: Nutrition Analysis Prompts
    static getPhase2Prompt(
        language: string = 'en',
        unitSystem: string = 'metric',
        mealName: string,
        ingredients: Array<{name: string, quantity: number, unit: string}>,
        additionalInfo?: string,
        dietaryRestrictions?: string[]
    ): string {
        const languageInfo = FoodAiConfig.SUPPORTED_LANGUAGES[language as keyof typeof FoodAiConfig.SUPPORTED_LANGUAGES] || FoodAiConfig.SUPPORTED_LANGUAGES.en;
        
        const ingredientsList = ingredients.map(ing => 
            `- ${ing.name}: ${ing.quantity} ${ing.unit}`
        ).join('\n');

        const dietaryInfo = dietaryRestrictions && dietaryRestrictions.length > 0 
            ? `\n**Dietary Restrictions**: ${dietaryRestrictions.join(', ')}`
            : '';

        const additionalContext = additionalInfo 
            ? `\n**Additional Information**: ${additionalInfo}`
            : '';

        const basePrompt = `You are an expert nutritionist with access to comprehensive food databases. Calculate precise nutritional information for this meal.

**IMPORTANT**: All instructions are in English, but your response must be in ${languageInfo.nativeName} (${language}).

**Task**: Provide accurate macro-nutrition analysis for the specified meal and ingredients.

**Meal Information**:
**Name**: ${mealName}
**Ingredients**:
${ingredientsList}${additionalContext}${dietaryInfo}

**Required Calculations**:
1. **Total Macronutrients**: Calculate exact amounts for:
   - Calories (kcal)
   - Protein (g)
   - Carbohydrates (g) 
   - Fat (g)

2. **Per-Ingredient Breakdown**: Show nutrition contribution of each ingredient

3. **Calculation Method**: Briefly explain your approach (in ${languageInfo.nativeName})

**Calculation Guidelines**:
- Use precise nutritional data from reliable sources (USDA, food labels)
- Account for cooking methods that affect nutrition:
  * Fried foods: Add 10-15% calories from oil absorption
  * Grilled/baked: Account for moisture loss, no oil addition
  * Raw foods: Use standard database values
- Consider preparation methods mentioned in additional info
- Account for restaurant/fast food if mentioned (higher calories, oils)
- Apply dietary restrictions to ingredient selection if specified
- Be conservative but realistic with calorie estimates
- Round final values to 1 decimal place

**Quality Assurance**:
- Verify that ingredient totals match overall nutrition
- Ensure realistic calorie density for the meal type
- Cross-check protein/carb/fat ratios make sense
- Account for cooking losses or additions

**Example Response Structure**:
{
  "sessionId": "same-session-id-from-phase1",
  "nutrition": {
    "calories": 450.0,
    "protein": 35.2,
    "carbohydrates": 48.1,
    "fat": 8.5
  },
  "confidence": 0.89,
  "portionAccuracy": 0.91,
  "calculationMethod": "Used USDA nutrition database with cooking adjustments",
  "ingredientBreakdown": [...],
  "language": "${language}"
}

Calculate the nutrition information now with high precision.`;

        return basePrompt;
    }

    // Language-specific error messages
    static getErrorMessage(errorCode: string, language: string = 'en'): string {
        const errorMessages: Record<string, Record<string, string>> = {
            'image_analysis_failed': {
                'en': 'Unable to analyze the food image. Please try with a clearer photo.',
                'ar': 'تعذر تحليل صورة الطعام. يرجى المحاولة بصورة أوضح.',
                'es': 'No se pudo analizar la imagen de comida. Intenta con una foto más clara.',
                'fr': 'Impossible d\'analyser l\'image de nourriture. Essayez avec une photo plus claire.',
                'de': 'Lebensmittelbild konnte nicht analysiert werden. Versuchen Sie es mit einem klareren Foto.',
            },
            'nutrition_calculation_failed': {
                'en': 'Unable to calculate nutrition information. Please verify the ingredients.',
                'ar': 'تعذر حساب المعلومات الغذائية. يرجى التحقق من المكونات.',
                'es': 'No se pudo calcular la información nutricional. Verifica los ingredientes.',
                'fr': 'Impossible de calculer les informations nutritionnelles. Vérifiez les ingrédients.',
                'de': 'Nährwertinformationen konnten nicht berechnet werden. Überprüfen Sie die Zutaten.',
            },
            'invalid_session': {
                'en': 'Invalid or expired analysis session. Please start over.',
                'ar': 'جلسة تحليل غير صالحة أو منتهية الصلاحية. يرجى البدء من جديد.',
                'es': 'Sesión de análisis inválida o expirada. Por favor, comienza de nuevo.',
                'fr': 'Session d\'analyse invalide ou expirée. Veuillez recommencer.',
                'de': 'Ungültige oder abgelaufene Analysesitzung. Bitte beginnen Sie von vorne.',
            },
            'image_quality_poor': {
                'en': 'Image quality is too poor for analysis. Please take a clearer photo.',
                'ar': 'جودة الصورة ضعيفة جداً للتحليل. يرجى التقاط صورة أوضح.',
                'es': 'La calidad de la imagen es muy pobre para el análisis. Toma una foto más clara.',
                'fr': 'La qualité de l\'image est trop faible pour l\'analyse. Prenez une photo plus claire.',
                'de': 'Die Bildqualität ist zu schlecht für die Analyse. Machen Sie ein klareres Foto.',
            }
        };

        return errorMessages[errorCode]?.[language] || errorMessages[errorCode]?.['en'] || 'An unexpected error occurred.';
    }

    // Helper to generate session ID
    static generateSessionId(): string {
        return `food_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Validate language support
    static validateLanguage(language: string): string {
        return Object.keys(FoodAiConfig.SUPPORTED_LANGUAGES).includes(language) ? language : 'en';
    }

    // Validate unit system
    static validateUnitSystem(unitSystem: string): string {
        return Object.keys(FoodAiConfig.UNIT_SYSTEMS).includes(unitSystem) ? unitSystem : 'metric';
    }
}