import { Type } from "@google/genai";

// Phase 1: Food Image Analysis Response Schema
export const FoodImageAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        sessionId: { 
            type: Type.STRING,
            description: "Unique session identifier for tracking this analysis" 
        },
        mealName: { 
            type: Type.STRING,
            description: "The name of the meal or dish identified in the image"
        },
        confidence: { 
            type: Type.NUMBER,
            description: "Confidence score for the overall meal identification (0-1)"
        },
        ingredients: {
            type: Type.ARRAY,
            description: "List of ingredients identified in the image",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { 
                        type: Type.STRING,
                        description: "Name of the ingredient in the specified language"
                    },
                    quantity: { 
                        type: Type.NUMBER,
                        description: "Estimated quantity of the ingredient"
                    },
                    unit: { 
                        type: Type.STRING,
                        description: "Unit of measurement (g, ml, pieces, cups, etc.)"
                    },
                    confidence: { 
                        type: Type.NUMBER,
                        description: "Confidence score for this ingredient identification (0-1)"
                    },
                    category: {
                        type: Type.STRING,
                        description: "Food category (protein, vegetable, grain, etc.)",
                        enum: ["grains", "vegetables", "fruits", "protein", "dairy", "nuts", "oils", "spices", "beverages", "sweets", "processed", "seafood", "poultry", "meat", "legumes", "herbs"]
                    }
                },
                required: ["name", "quantity", "unit", "confidence", "category"],
                propertyOrdering: ["name", "quantity", "unit", "confidence", "category"]
            }
        },
        suggestedMealType: {
            type: Type.STRING,
            description: "Suggested meal type based on image analysis",
            enum: ["breakfast", "lunch", "dinner", "snack"]
        },
        language: {
            type: Type.STRING,
            description: "Language code used for ingredient names"
        }
    },
    required: ["sessionId", "mealName", "confidence", "ingredients", "suggestedMealType", "language"],
    propertyOrdering: ["sessionId", "mealName", "confidence", "ingredients", "suggestedMealType", "language"]
};

// Phase 2: Nutrition Analysis Response Schema
export const NutritionAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        sessionId: { 
            type: Type.STRING,
            description: "Session identifier linking back to Phase 1 analysis" 
        },
        nutrition: {
            type: Type.OBJECT,
            description: "Detailed nutritional information for the meal",
            properties: {
                calories: { 
                    type: Type.NUMBER,
                    description: "Total calories (kcal) for the entire meal"
                },
                protein: { 
                    type: Type.NUMBER,
                    description: "Total protein in grams"
                },
                carbohydrates: { 
                    type: Type.NUMBER,
                    description: "Total carbohydrates in grams"
                },
                fat: { 
                    type: Type.NUMBER,
                    description: "Total fat in grams"
                }
            },
            required: ["calories", "protein", "carbohydrates", "fat"],
            propertyOrdering: ["calories", "protein", "carbohydrates", "fat"]
        },
        confidence: { 
            type: Type.NUMBER,
            description: "Overall confidence score for nutrition calculations (0-1)"
        },
        portionAccuracy: { 
            type: Type.NUMBER,
            description: "Confidence score for portion size estimation (0-1)"
        },
        calculationMethod: {
            type: Type.STRING,
            description: "Brief explanation of how nutrition was calculated"
        },
        ingredientBreakdown: {
            type: Type.ARRAY,
            description: "Nutrition breakdown per ingredient for transparency",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { 
                        type: Type.STRING,
                        description: "Ingredient name"
                    },
                    quantity: { 
                        type: Type.NUMBER,
                        description: "Final quantity used in calculation"
                    },
                    unit: { 
                        type: Type.STRING,
                        description: "Unit of measurement"
                    },
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    carbohydrates: { type: Type.NUMBER },
                    fat: { type: Type.NUMBER }
                },
                required: ["name", "quantity", "unit", "calories", "protein", "carbohydrates", "fat"],
                propertyOrdering: ["name", "quantity", "unit", "calories", "protein", "carbohydrates", "fat"]
            }
        },
        language: {
            type: Type.STRING,
            description: "Language code used for responses"
        }
    },
    required: ["sessionId", "nutrition", "confidence", "portionAccuracy", "calculationMethod", "ingredientBreakdown", "language"],
    propertyOrdering: ["sessionId", "nutrition", "confidence", "portionAccuracy", "calculationMethod", "ingredientBreakdown", "language"]
};

// Error Response Schema for both functions
export const ErrorResponseSchema = {
    type: Type.OBJECT,
    properties: {
        error: {
            type: Type.OBJECT,
            properties: {
                code: { 
                    type: Type.STRING,
                    description: "Error code for client handling"
                },
                message: { 
                    type: Type.STRING,
                    description: "Human-readable error message in the requested language"
                },
                details: { 
                    type: Type.STRING,
                    description: "Additional error details for debugging"
                }
            },
            required: ["code", "message"],
            propertyOrdering: ["code", "message", "details"]
        },
        sessionId: { 
            type: Type.STRING,
            description: "Session ID if available"
        },
        language: {
            type: Type.STRING,
            description: "Language code for error messages"
        }
    },
    required: ["error"],
    propertyOrdering: ["error", "sessionId", "language"]
};

// Schema Selection Utilities
export function getFoodImageAnalysisSchema() {
    return FoodImageAnalysisSchema;
}

export function getNutritionAnalysisSchema() {
    return NutritionAnalysisSchema;
}

export function getErrorResponseSchema() {
    return ErrorResponseSchema;
}