import { Type } from "@google/genai";

// Product analysis response schema - matches Flutter ProductAnalysisResult
export const ProductAnalysisResponseSchema = {
    type: Type.OBJECT,
    properties: {
        // Product Info
        productName: {
            type: Type.STRING,
            description: "Product name extracted from label"
        },
        brand: {
            type: Type.STRING,
            description: "Brand name if visible on label"
        },

        // Serving Information
        servingSize: {
            type: Type.STRING,
            description: "Serving size as displayed on label (e.g., '1 cup (240ml)', '30g')"
        },
        servingsPerContainer: {
            type: Type.NUMBER,
            description: "Number of servings per container/package"
        },

        // Nutrition Facts (per serving) - Required
        calories: {
            type: Type.NUMBER,
            description: "Calories per serving (kcal)"
        },
        protein: {
            type: Type.NUMBER,
            description: "Protein in grams per serving"
        },
        carbs: {
            type: Type.NUMBER,
            description: "Total carbohydrates in grams per serving"
        },
        fat: {
            type: Type.NUMBER,
            description: "Total fat in grams per serving"
        },

        // Nutrition Facts (per serving) - Optional
        sugar: {
            type: Type.NUMBER,
            description: "Total sugars in grams per serving"
        },
        fiber: {
            type: Type.NUMBER,
            description: "Dietary fiber in grams per serving"
        },
        sodium: {
            type: Type.NUMBER,
            description: "Sodium in milligrams per serving"
        },
        saturatedFat: {
            type: Type.NUMBER,
            description: "Saturated fat in grams per serving"
        },
        cholesterol: {
            type: Type.NUMBER,
            description: "Cholesterol in milligrams per serving"
        },

        // AI Confidence
        confidenceScore: {
            type: Type.NUMBER,
            description: "AI confidence score (0.0 to 1.0)"
        }
    },
    required: ["productName", "servingSize", "servingsPerContainer", "calories", "protein", "carbs", "fat", "confidenceScore"],
    propertyOrdering: [
        "productName", "brand", "servingSize", "servingsPerContainer",
        "calories", "protein", "carbs", "fat",
        "sugar", "fiber", "sodium", "saturatedFat", "cholesterol",
        "confidenceScore"
    ]
};

// Helper function to get product analysis schema
export function getProductAnalysisSchema() {
    return ProductAnalysisResponseSchema;
}