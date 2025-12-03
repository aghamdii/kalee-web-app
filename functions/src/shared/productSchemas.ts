import { Type } from "@google/genai";

// Product analysis response schema - matches Flutter ProductAnalysisResult
export const ProductAnalysisResponseSchema = {
    type: Type.OBJECT,
    properties: {
        // Serving Information
        servingSize: {
            type: Type.STRING,
            description: "Serving size measurement ONLY (e.g., '27g', '240ml'). Do NOT include piece counts or descriptions."
        },
        servingsPerContainer: {
            type: Type.NUMBER,
            description: "Number of servings per container/package"
        },

        // Nutrition Facts (per serving)
        calories: {
            type: Type.NUMBER,
            description: "Calories per serving (kcal)"
        },
        caloriesFromLabel: {
            type: Type.BOOLEAN,
            description: "true if calories was visible on label, false if estimated"
        },
        protein: {
            type: Type.NUMBER,
            description: "Protein in grams per serving"
        },
        proteinFromLabel: {
            type: Type.BOOLEAN,
            description: "true if protein was visible on label, false if estimated"
        },
        carbs: {
            type: Type.NUMBER,
            description: "Total carbohydrates in grams per serving"
        },
        carbsFromLabel: {
            type: Type.BOOLEAN,
            description: "true if carbs was visible on label, false if estimated"
        },
        fat: {
            type: Type.NUMBER,
            description: "Total fat in grams per serving"
        },
        fatFromLabel: {
            type: Type.BOOLEAN,
            description: "true if fat was visible on label, false if estimated"
        },
        sugar: {
            type: Type.NUMBER,
            description: "Total sugars in grams per serving"
        },
        sugarFromLabel: {
            type: Type.BOOLEAN,
            description: "true if sugar was visible on label, false if estimated"
        },
        fiber: {
            type: Type.NUMBER,
            description: "Dietary fiber in grams per serving"
        },
        fiberFromLabel: {
            type: Type.BOOLEAN,
            description: "true if fiber was visible on label, false if estimated"
        },
        sodium: {
            type: Type.NUMBER,
            description: "Sodium in milligrams per serving"
        },
        sodiumFromLabel: {
            type: Type.BOOLEAN,
            description: "true if sodium was visible on label, false if estimated"
        },
        cholesterol: {
            type: Type.NUMBER,
            description: "Cholesterol in milligrams per serving"
        },
        cholesterolFromLabel: {
            type: Type.BOOLEAN,
            description: "true if cholesterol was visible on label, false if estimated"
        },

        // AI Confidence
        confidenceScore: {
            type: Type.NUMBER,
            description: "AI confidence score (0.0 to 1.0)"
        }
    },
    required: [
        "servingSize", "servingsPerContainer",
        "calories", "caloriesFromLabel",
        "protein", "proteinFromLabel",
        "carbs", "carbsFromLabel",
        "fat", "fatFromLabel",
        "confidenceScore"
    ],
    propertyOrdering: [
        "servingSize", "servingsPerContainer",
        "calories", "caloriesFromLabel",
        "protein", "proteinFromLabel",
        "carbs", "carbsFromLabel",
        "fat", "fatFromLabel",
        "sugar", "sugarFromLabel",
        "fiber", "fiberFromLabel",
        "sodium", "sodiumFromLabel",
        "cholesterol", "cholesterolFromLabel",
        "confidenceScore"
    ]
};

// Helper function to get product analysis schema
export function getProductAnalysisSchema() {
    return ProductAnalysisResponseSchema;
}