import { FoodAiConfig } from './aiConfig';
import { FoodPrompts } from './prompts';

export class ProductPrompts {

    /**
     * Generate product label analysis prompt - matches Flutter ProductAnalysisResult
     */
    static getProductAnalysisPrompt(language: string = 'en', unitSystem: string = 'metric', userNotes?: string): string {
        const languageInfo = FoodAiConfig.SUPPORTED_LANGUAGES[language as keyof typeof FoodAiConfig.SUPPORTED_LANGUAGES] || FoodAiConfig.SUPPORTED_LANGUAGES.en;

        const contextNote = userNotes ?
            `Context: "${userNotes}" - adjust analysis accordingly.` : '';

        return `Nutrition label OCR - extract product and nutrition information.

Response language: ${languageInfo.nativeName} (${language})
${contextNote}

**EXTRACT FROM LABEL**:

Product Info:
• productName: Product name from label
• brand: Brand name if visible (optional)

Serving Info:
• servingSize: As shown on label (e.g., "1 cup (240ml)", "30g", "2 cookies (28g)")
• servingsPerContainer: Number of servings in package

Nutrition Facts (per serving):
• calories: Calories (kcal)
• protein: Protein (g)
• carbs: Total Carbohydrates (g)
• fat: Total Fat (g)
• sugar: Sugars (g) - use 0 if not visible
• fiber: Dietary Fiber (g) - use 0 if not visible
• sodium: Sodium (mg) - use 0 if not visible
• saturatedFat: Saturated Fat (g) - use 0 if not visible
• cholesterol: Cholesterol (mg) - use 0 if not visible

Confidence:
• confidenceScore: 0.0 to 1.0 based on label clarity

**OUTPUT** (JSON only):
{
  "productName": "Product Name",
  "brand": "Brand Name or null",
  "servingSize": "1 cup (240ml)",
  "servingsPerContainer": 2.5,
  "calories": 200,
  "protein": 10,
  "carbs": 25,
  "fat": 8,
  "sugar": 5,
  "fiber": 3,
  "sodium": 150,
  "saturatedFat": 2,
  "cholesterol": 10,
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