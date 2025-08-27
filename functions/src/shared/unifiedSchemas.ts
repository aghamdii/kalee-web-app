import { Type } from "@google/genai";

// Food validity assessment schema
export const FoodValiditySchema = {
    type: Type.OBJECT,
    properties: {
        score: { 
            type: Type.NUMBER,
            description: "Confidence score that this is food (0.0-1.0)" 
        },
        isFood: { 
            type: Type.BOOLEAN,
            description: "Boolean determination if this is food" 
        },
        warningMessage: { 
            type: Type.STRING,
            description: "Warning message if food validity is low"
        },
        category: {
            type: Type.STRING,
            description: "Category of the analyzed content",
            enum: ["meal", "packaged_food", "beverage", "non_food", "unclear"]
        }
    },
    required: ["score", "isFood", "category"],
    propertyOrdering: ["score", "isFood", "category", "warningMessage"]
};

// Unified nutrition response schema
export const UnifiedNutritionSchema = {
    type: Type.OBJECT,
    properties: {
        calories: { 
            type: Type.NUMBER,
            description: "Total calories (kcal)" 
        },
        protein: { 
            type: Type.NUMBER,
            description: "Total protein in grams" 
        },
        carbs: { 
            type: Type.NUMBER,
            description: "Total carbohydrates in grams" 
        },
        fat: { 
            type: Type.NUMBER,
            description: "Total fat in grams" 
        }
    },
    required: ["calories", "protein", "carbs", "fat"],
    propertyOrdering: ["calories", "protein", "carbs", "fat"]
};

// Simplified ingredient for reference
export const SimpleIngredientSchema = {
    type: Type.OBJECT,
    properties: {
        name: { 
            type: Type.STRING,
            description: "Name of the ingredient" 
        },
        quantity: { 
            type: Type.NUMBER,
            description: "Quantity of the ingredient" 
        },
        unit: { 
            type: Type.STRING,
            description: "Unit of measurement (g, ml, pieces, etc.)" 
        },
        calories: { 
            type: Type.NUMBER,
            description: "Calories contributed by this ingredient" 
        }
    },
    required: ["name", "quantity", "unit", "calories"],
    propertyOrdering: ["name", "quantity", "unit", "calories"]
};

// Complete unified analysis response schema
export const UnifiedAnalysisResponseSchema = {
    type: Type.OBJECT,
    properties: {
        success: { 
            type: Type.BOOLEAN,
            description: "Whether the analysis was successful" 
        },
        sessionId: { 
            type: Type.STRING,
            description: "Unique session identifier" 
        },
        mode: {
            type: Type.STRING,
            description: "Analysis mode used",
            enum: ["meal", "label"]
        },
        
        // Core results
        mealName: { 
            type: Type.STRING,
            description: "Name of the meal or food item" 
        },
        nutrition: UnifiedNutritionSchema,
        
        // Confidence metrics
        confidence: { 
            type: Type.NUMBER,
            description: "Overall confidence score (0.0-1.0)" 
        },
        foodValidity: FoodValiditySchema,
        
        // Supporting data
        ingredients: {
            type: Type.ARRAY,
            description: "List of detected ingredients",
            items: SimpleIngredientSchema
        },
        servingSize: { 
            type: Type.STRING,
            description: "Detected or estimated serving size" 
        },
        servingsAnalyzed: { 
            type: Type.NUMBER,
            description: "Number of servings analyzed (default 1.0)" 
        },
        servingsPerContainer: { 
            type: Type.NUMBER,
            description: "Number of servings per container/package from label" 
        },
        nutritionCalculation: { 
            type: Type.STRING,
            description: "How nutrition was calculated (per_serving, package_total, etc.)" 
        },
        
        // Metadata
        processingTime: { 
            type: Type.NUMBER,
            description: "Processing time in milliseconds" 
        },
        model: { 
            type: Type.STRING,
            description: "AI model used for analysis" 
        },
        language: { 
            type: Type.STRING,
            description: "Language used for responses" 
        },
        unitSystem: {
            type: Type.STRING,
            description: "Unit system used",
            enum: ["metric", "imperial"]
        },
        userNotes: { 
            type: Type.STRING,
            description: "User-provided notes or context" 
        },
        
        // Warnings and suggestions
        warnings: {
            type: Type.ARRAY,
            description: "Any warnings or concerns about the analysis",
            items: { type: Type.STRING }
        },
        suggestions: {
            type: Type.ARRAY,
            description: "Suggestions for better results",
            items: { type: Type.STRING }
        }
    },
    required: ["success", "sessionId", "mode", "mealName", "nutrition", "confidence", "foodValidity"],
    propertyOrdering: [
        "success", "sessionId", "mode", "mealName", "nutrition", "confidence", "foodValidity", 
        "ingredients", "servingSize", "servingsAnalyzed", "servingsPerContainer", "nutritionCalculation", 
        "processingTime", "model", "language", "unitSystem", "userNotes", "warnings", "suggestions"
    ]
};

// Mobile-optimized schema for quick logging (essential fields only)
export const MobileOptimizedSchema = {
    type: Type.OBJECT,
    properties: {
        mealName: { 
            type: Type.STRING,
            description: "Name of the meal or food item" 
        },
        nutrition: UnifiedNutritionSchema,
        confidence: { 
            type: Type.NUMBER,
            description: "Overall confidence score (0.0-1.0)" 
        },
        foodValidity: FoodValiditySchema,
        servingSize: { 
            type: Type.STRING,
            description: "Detected or estimated serving size" 
        },
        servingsAnalyzed: { 
            type: Type.NUMBER,
            description: "Number of servings analyzed (default 1.0)" 
        },
        servingsPerContainer: { 
            type: Type.NUMBER,
            description: "Number of servings per container/package from label" 
        },
        nutritionCalculation: { 
            type: Type.STRING,
            description: "How nutrition was calculated (per_serving, package_total, etc.)" 
        },
        language: { 
            type: Type.STRING,
            description: "Language used for responses" 
        },
        unitSystem: {
            type: Type.STRING,
            description: "Unit system used",
            enum: ["metric", "imperial"]
        }
    },
    required: ["mealName", "nutrition", "confidence", "foodValidity"],
    propertyOrdering: [
        "mealName", "nutrition", "confidence", "foodValidity", 
        "servingSize", "servingsAnalyzed", "servingsPerContainer", "nutritionCalculation", 
        "language", "unitSystem"
    ]
};

// Helper function to get the unified schema
export function getUnifiedAnalysisSchema(mobile: boolean = false) {
    return mobile ? MobileOptimizedSchema : UnifiedAnalysisResponseSchema;
}