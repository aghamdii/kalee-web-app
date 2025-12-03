import { FoodAiConfig } from './aiConfig';
import { FoodPrompts } from './prompts';

export class ProductPrompts {

    /**
     * Generate product label analysis prompt - extracts nutrition facts with fromLabel flags
     */
    static getProductAnalysisPrompt(language: string = 'en', unitSystem: string = 'metric', userNotes?: string): string {
        const languageInfo = FoodAiConfig.SUPPORTED_LANGUAGES[language as keyof typeof FoodAiConfig.SUPPORTED_LANGUAGES] || FoodAiConfig.SUPPORTED_LANGUAGES.en;

        const contextNote = userNotes ?
            `Context: "${userNotes}" - adjust analysis accordingly.` : '';

        return `Nutrition label OCR - extract nutrition facts.

Response language: ${languageInfo.nativeName} (${language})
${contextNote}

**EXTRACT FROM LABEL**:

Serving Info:
• servingSize: ONLY the weight/volume measurement (e.g., "27g", "240ml"). Do NOT include piece counts like "5 pieces" or descriptions.
• servingsPerContainer: Number of servings in package

Nutrition Facts (per serving):
For each nutrient, extract the value AND set the FromLabel flag:
• [nutrient]FromLabel = true if clearly visible on label
• [nutrient]FromLabel = false if estimated or not visible (use 0 for value)

Required nutrients:
• calories + caloriesFromLabel
• protein + proteinFromLabel (grams)
• carbs + carbsFromLabel (grams)
• fat + fatFromLabel (grams)

Optional nutrients (use 0 and false if not visible):
• sugar + sugarFromLabel (grams)
• fiber + fiberFromLabel (grams)
• sodium + sodiumFromLabel (milligrams)
• cholesterol + cholesterolFromLabel (milligrams)

Confidence:
• confidenceScore: 0.0 to 1.0 based on label clarity

**OUTPUT** (JSON only):
{
  "servingSize": "27g",
  "servingsPerContainer": 10,
  "calories": 150,
  "caloriesFromLabel": true,
  "protein": 2,
  "proteinFromLabel": true,
  "carbs": 22,
  "carbsFromLabel": true,
  "fat": 6,
  "fatFromLabel": true,
  "sugar": 11,
  "sugarFromLabel": true,
  "fiber": 1,
  "fiberFromLabel": true,
  "sodium": 105,
  "sodiumFromLabel": true,
  "cholesterol": 0,
  "cholesterolFromLabel": false,
  "confidenceScore": 0.95
}

Extract now.`;
    }

    /**
     * Validate language support using existing validation
     */
    static validateLanguage(language: string): string {
        return FoodPrompts.validateLanguage(language);
    }

    /**
     * Validate unit system using existing validation
     */
    static validateUnitSystem(unitSystem: string): string {
        return FoodPrompts.validateUnitSystem(unitSystem);
    }

    /**
     * Generate session ID using existing utility
     */
    static generateSessionId(): string {
        return FoodPrompts.generateSessionId();
    }

    /**
     * Get error message using existing system
     */
    static getErrorMessage(errorCode: string, language: string = 'en'): string {
        return FoodPrompts.getErrorMessage(errorCode, language);
    }
}