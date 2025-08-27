import { FoodAiConfig } from './aiConfig';
import { FoodPrompts } from './prompts';

export class UnifiedPrompts {
    
    /**
     * Generate mobile-optimized meal analysis prompt for quick logging
     */
    static getMealAnalysisPrompt(language: string = 'en', unitSystem: string = 'metric', userNotes?: string): string {
        const languageInfo = FoodAiConfig.SUPPORTED_LANGUAGES[language as keyof typeof FoodAiConfig.SUPPORTED_LANGUAGES] || FoodAiConfig.SUPPORTED_LANGUAGES.en;
        
        const contextNote = userNotes ? 
            `Context: "${userNotes}" - adjust estimates accordingly.` : '';

        const basePrompt = `Mobile food photo analysis for quick calorie logging.

Response language: ${languageInfo.nativeName} (${language})
${contextNote}

**STEP 1 - VALIDATE** (Critical - fail fast):
Food validity score 0.0-1.0:
• 0.0-0.25: Not food → STOP, warn user
• 0.25-0.75: Uncertain → proceed with caution  
• 0.75-1.0: Definitely food → full analysis

Categories: meal | packaged_food | beverage | non_food | unclear

**STEP 2 - IDENTIFY**:
• Meal name (specific, in ${languageInfo.nativeName})
• Serving size estimate
• Account for mobile photo limitations (angles, lighting, partial view)

**STEP 3 - CALCULATE**:
Total nutrition per visible serving:
• Calories: 50-2000 kcal
• Protein: 0-200g  
• Carbs: 0-300g
• Fat: 0-150g

Quick portion references (${unitSystem}):
• Protein: palm = ${unitSystem === 'metric' ? '120g' : '4oz'}
• Carbs: fist = ${unitSystem === 'metric' ? '150g' : '1 cup'}
• Fat: thumb = ${unitSystem === 'metric' ? '15g' : '1 tbsp'}

Adjustments:
• Restaurant food: +25% calories
• Fried food: +15% calories  
• Poor lighting/angle: be conservative
• ${userNotes ? `User specified: "${userNotes}"` : ''}

**OUTPUT** (JSON only):
{
  "mealName": "specific dish name",
  "nutrition": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0},
  "confidence": 0.0,
  "foodValidity": {"score": 0.0, "isFood": false, "category": "meal"},
  "servingSize": "estimated size",
  "language": "${language}",
  "unitSystem": "${unitSystem}"
}

Analyze now.`;

        return basePrompt;
    }

    /**
     * Generate mobile-optimized label analysis prompt for quick OCR
     */
    static getLabelAnalysisPrompt(language: string = 'en', unitSystem: string = 'metric', userNotes?: string): string {
        const languageInfo = FoodAiConfig.SUPPORTED_LANGUAGES[language as keyof typeof FoodAiConfig.SUPPORTED_LANGUAGES] || FoodAiConfig.SUPPORTED_LANGUAGES.en;
        
        const portionNote = userNotes ? 
            `Portion: "${userNotes}" - adjust nutrition values accordingly.` : '';

        const basePrompt = `Mobile nutrition label OCR for quick calorie logging.

Response language: ${languageInfo.nativeName} (${language})
${portionNote}

**STEP 1 - VALIDATE** (Critical):
Label readability score 0.0-1.0:
• 0.0-0.25: Not a nutrition label → STOP
• 0.25-0.75: Partially readable → estimate missing
• 0.75-1.0: Clear label → extract exact values

Categories: packaged_food | beverage | meal | unclear | non_food

**STEP 2 - EXTRACT**:
Read from nutrition facts panel:
• Product name (in ${languageInfo.nativeName})
• Serving size (e.g., "1 cup (40g)", "25 gm")
• Servings per container/package (CRITICAL - look for "0.5", "2.5", etc.)
• Calories per serving (from label)
• Total Fat per serving (g)
• Total Carbs per serving (g)  
• Protein per serving (g)

**STEP 2B - CALCULATE ACTUAL PACKAGE NUTRITION**:
Determine what user is consuming:
• If "servings per container" = 1.0 → return per-serving values
• If "servings per container" ≠ 1.0 → multiply all nutrition × servings per container
• This gives nutrition for the ENTIRE package (what user typically consumes)

Example calculation:
• Label: 134 calories per serving, 0.5 servings per container
• Package total: 134 × 0.5 = 67 calories
• Return: 67 calories (actual package content)

**STEP 3 - ADJUST FOR USER CONSUMPTION**:
After calculating package nutrition, apply any additional adjustments:
• "half package" → ×0.5
• "two packages" → ×2.0  
• "quarter package" → ×0.25
• ${userNotes ? `User note: "${userNotes}"` : ''}

Default behavior: Return nutrition for entire package (most common use case)

Mobile photo considerations:
• Blurry text: use context clues
• Partial visibility: estimate from visible
• Poor angle: read what's clear

**OUTPUT** (JSON only):
{
  "mealName": "product name from label",
  "nutrition": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0},
  "confidence": 0.0,
  "foodValidity": {"score": 0.0, "isFood": false, "category": "packaged_food"},
  "servingSize": "from label (e.g., 25 gm)",
  "servingsPerContainer": 0.0,
  "nutritionCalculation": "package_total",
  "servingsAnalyzed": 1.0,
  "language": "${language}",
  "unitSystem": "${unitSystem}"
}

Read label now.`;

        return basePrompt;
    }

    /**
     * Generate mobile-optimized text meal analysis prompt 
     */
    static getTextAnalysisPrompt(text: string, language: string = 'en', unitSystem: string = 'metric', userNotes?: string): string {
        const languageInfo = FoodAiConfig.SUPPORTED_LANGUAGES[language as keyof typeof FoodAiConfig.SUPPORTED_LANGUAGES] || FoodAiConfig.SUPPORTED_LANGUAGES.en;
        
        const contextNote = userNotes ? 
            `Additional context: "${userNotes}" - adjust estimates accordingly.` : '';

        const basePrompt = `Text-based meal analysis for nutrition estimation.

Response language: ${languageInfo.nativeName} (${language})
${contextNote}

**STEP 1 - VALIDATE TEXT** (Critical):
Food relevance score 0.0-1.0:
• 0.8-1.0: Clear food description ("grilled chicken with rice", "2 apples")
• 0.5-0.7: Vague but food-related ("healthy lunch", "something sweet")  
• 0.2-0.4: Unclear food reference ("meal", "food")
• 0.0-0.1: Not food-related ("hello world", "my cat", "123")

Categories: meal | snack | beverage | non_food | unclear

**STEP 2 - PARSE MEAL DESCRIPTION**:
Extract from text: "${text}"
• Identify specific foods mentioned
• Parse quantities when specified ("2 slices", "large portion", "cup of")
• Infer cooking methods ("grilled", "fried", "steamed", "raw")
• Estimate portions when not specified using common serving sizes

**STEP 3 - CALCULATE NUTRITION**:
Total nutrition for described meal:
• Calories: 20-2500 kcal (realistic range)
• Protein: 0-200g  
• Carbs: 0-300g
• Fat: 0-150g

Standard portion references (${unitSystem}):
• Meat/Fish: ${unitSystem === 'metric' ? '120g (palm size)' : '4oz (palm size)'}
• Rice/Pasta: ${unitSystem === 'metric' ? '150g (fist size)' : '1 cup (fist size)'}
• Vegetables: ${unitSystem === 'metric' ? '80g (handful)' : '3oz (handful)'}
• Bread: ${unitSystem === 'metric' ? '30g (1 slice)' : '1 slice'}

Estimation strategies:
• Use USDA/nutrition database values
• Apply cooking method adjustments (fried +15% calories)
• Default to medium portions if size not specified
• Account for common preparation methods
• Be conservative but realistic with estimates

**STEP 4 - CONFIDENCE ASSESSMENT**:
Rate confidence based on:
• Text specificity (specific foods vs. vague terms)
• Quantity clarity (exact amounts vs. estimated)
• Cooking method clarity (specified vs. assumed)
• Overall completeness of description

**OUTPUT** (JSON only):
{
  "mealName": "descriptive meal name in ${languageInfo.nativeName}",
  "nutrition": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0},
  "confidence": 0.0,
  "foodValidity": {"score": 0.0, "isFood": false, "category": "meal"},
  "servingSize": "estimated from text",
  "servingsAnalyzed": 1.0,
  "nutritionCalculation": "text_estimation",
  "language": "${language}",
  "unitSystem": "${unitSystem}"
}

Analyze text now.`;

        return basePrompt;
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