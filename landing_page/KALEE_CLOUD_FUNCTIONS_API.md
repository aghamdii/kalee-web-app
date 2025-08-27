# Kalee AI Food Detection Cloud Functions API Documentation

## 📋 Table of Contents

1. [API Overview](#api-overview)
2. [Function 1: analyzeFoodImageFunction](#function-1-analyzefoodimagefunction)
3. [Function 2: analyzeNutritionFunction](#function-2-analyzenutritionfunction)
4. [Function 3: saveMealEntryFunction](#function-3-savemealentryfunction)
5. [Error Response Format](#error-response-format)
6. [Dummy Data Examples](#dummy-data-examples)
7. [Integration Examples](#integration-examples)

---

## API Overview

The Kalee AI Food Detection system provides three Firebase Cloud Functions that work together to analyze food images and calculate nutrition information.

**AI Model**: Uses `gemini-2.5-flash` (same as Flaia functions) with structured JSON output for guaranteed response format.

### **Authentication**

All functions require Firebase Authentication. Include the user's Firebase Auth token in requests.

### **Base Configuration**

- **Region**: `europe-west1`
- **Endpoint**: `https://europe-west1-[PROJECT_ID].cloudfunctions.net/`
- **Content-Type**: `application/json`
- **AI Model**: `gemini-2.5-flash`
- **SDK Version**: `@google/genai ^1.5.0`

---

## Function 1: analyzeFoodImageFunction

### **Purpose**

Analyzes a food image to identify the meal name and ingredients with estimated portions.

### **Request Format**

```typescript
interface AnalyzeFoodImageRequest {
  storagePath: string; // Firebase Storage path to the uploaded image
  language?: string; // Language code for response (default: 'en')
  unitSystem?: string; // 'metric' or 'imperial' (default: 'metric')
}
```

### **Request Example**

```json
{
  "storagePath": "food_images/user_abc123/session_1701234567890.jpg",
  "language": "en",
  "unitSystem": "metric"
}
```

### **Response Format**

```typescript
interface AnalyzeFoodImageResponse {
  sessionId: string; // Unique session ID for Phase 2
  mealName: string; // Identified meal name in requested language
  confidence: number; // Overall confidence score (0-1)
  ingredients: Array<{
    name: string; // Ingredient name in requested language
    quantity: number; // Estimated quantity
    unit: string; // Unit of measurement (g, ml, oz, cups, etc.)
    confidence: number; // Ingredient confidence score (0-1)
    category: string; // Food category (protein, vegetables, grains, etc.)
  }>;
  suggestedMealType: string; // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  language: string; // Language code used for response
}
```

f

### **Response Example**

```json
{
  "sessionId": "food_1701234567890_abc123def",
  "mealName": "Grilled Chicken with Rice and Vegetables",
  "confidence": 0.87,
  "ingredients": [
    {
      "name": "Grilled Chicken Breast",
      "quantity": 150,
      "unit": "g",
      "confidence": 0.92,
      "category": "protein"
    },
    {
      "name": "White Rice",
      "quantity": 180,
      "unit": "g",
      "confidence": 0.88,
      "category": "grains"
    },
    {
      "name": "Mixed Vegetables",
      "quantity": 100,
      "unit": "g",
      "confidence": 0.85,
      "category": "vegetables"
    },
    {
      "name": "Olive Oil",
      "quantity": 10,
      "unit": "ml",
      "confidence": 0.8,
      "category": "oils"
    }
  ],
  "suggestedMealType": "lunch",
  "language": "en"
}
```

---

## Function 2: analyzeNutritionFunction

### **Purpose**

Calculates detailed nutrition information based on the user-reviewed ingredients from Phase 1.

### **Request Format**

```typescript
interface AnalyzeNutritionRequest {
  sessionId: string; // Session ID from Phase 1
  mealName: string; // Final meal name (user can edit)
  ingredients: Array<{
    // User-reviewed ingredients
    name: string; // Ingredient name
    quantity: number; // Quantity per serving
    unit: string; // Unit of measurement
    servingAmount: number; // How many servings eaten (e.g., 1.5)
  }>;
  additionalInfo?: string; // Optional cooking/preparation notes
  dietaryRestrictions?: string[]; // Optional dietary restrictions
  language?: string; // Language code for response (default: 'en')
}
```

### **Request Example**

```json
{
  "sessionId": "food_1701234567890_abc123def",
  "mealName": "Grilled Chicken with Rice and Vegetables",
  "ingredients": [
    {
      "name": "Grilled Chicken Breast",
      "quantity": 150,
      "unit": "g",
      "servingAmount": 1.0
    },
    {
      "name": "White Rice",
      "quantity": 200,
      "unit": "g",
      "servingAmount": 1.0
    },
    {
      "name": "Mixed Vegetables",
      "quantity": 120,
      "unit": "g",
      "servingAmount": 1.0
    },
    {
      "name": "Olive Oil",
      "quantity": 15,
      "unit": "ml",
      "servingAmount": 1.0
    }
  ],
  "additionalInfo": "Chicken was grilled without additional oil, vegetables were steamed",
  "dietaryRestrictions": [],
  "language": "en"
}
```

### **Response Format**

```typescript
interface AnalyzeNutritionResponse {
  sessionId: string; // Session ID linking to Phase 1
  nutrition: {
    calories: number; // Total calories (kcal)
    protein: number; // Total protein (g)
    carbohydrates: number; // Total carbohydrates (g)
    fat: number; // Total fat (g)
  };
  confidence: number; // Overall nutrition confidence (0-1)
  portionAccuracy: number; // Portion estimation confidence (0-1)
  calculationMethod: string; // Brief explanation of calculation method
  ingredientBreakdown: Array<{
    name: string; // Ingredient name
    quantity: number; // Final quantity used in calculation
    unit: string; // Unit of measurement
    calories: number; // Calories from this ingredient
    protein: number; // Protein from this ingredient (g)
    carbohydrates: number; // Carbs from this ingredient (g)
    fat: number; // Fat from this ingredient (g)
  }>;
  language: string; // Language code used for response
}
```

### **Response Example**

```json
{
  "sessionId": "food_1701234567890_abc123def",
  "nutrition": {
    "calories": 485.2,
    "protein": 35.8,
    "carbohydrates": 52.4,
    "fat": 12.9
  },
  "confidence": 0.89,
  "portionAccuracy": 0.91,
  "calculationMethod": "Used USDA nutrition database with cooking method adjustments for grilled chicken and steamed vegetables",
  "ingredientBreakdown": [
    {
      "name": "Grilled Chicken Breast",
      "quantity": 150,
      "unit": "g",
      "calories": 231.0,
      "protein": 30.9,
      "carbohydrates": 0.0,
      "fat": 10.3
    },
    {
      "name": "White Rice",
      "quantity": 200,
      "unit": "g",
      "calories": 205.0,
      "protein": 4.3,
      "carbohydrates": 44.5,
      "fat": 0.4
    },
    {
      "name": "Mixed Vegetables",
      "quantity": 120,
      "unit": "g",
      "calories": 26.4,
      "protein": 0.6,
      "carbohydrates": 5.9,
      "fat": 0.0
    },
    {
      "name": "Olive Oil",
      "quantity": 15,
      "unit": "ml",
      "calories": 22.8,
      "protein": 0.0,
      "carbohydrates": 2.0,
      "fat": 2.2
    }
  ],
  "language": "en"
}
```

---

## Function 3: saveMealEntryFunction

### **Purpose**

Saves the final meal entry to the user's meal database with tags and search keywords.

### **Request Format**

```typescript
interface SaveMealEntryRequest {
  sessionId?: string; // Optional session ID from previous phases
  mealName: string; // Final meal name
  mealType: string; // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ingredients: Array<{
    // Final ingredients list
    name: string;
    quantity: number;
    unit: string;
    servingAmount: number;
  }>;
  nutrition: {
    // Nutrition information from Phase 2
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  };
  confidence: number; // AI confidence score from Phase 2
  notes?: string; // Optional user notes
  storagePath: string; // Firebase Storage path to image
  timestamp?: string; // Optional meal timestamp (ISO string, defaults to now)
}
```

### **Request Example**

```json
{
  "sessionId": "food_1701234567890_abc123def",
  "mealName": "Grilled Chicken with Rice and Vegetables",
  "mealType": "lunch",
  "ingredients": [
    {
      "name": "Grilled Chicken Breast",
      "quantity": 150,
      "unit": "g",
      "servingAmount": 1.0
    },
    {
      "name": "White Rice",
      "quantity": 200,
      "unit": "g",
      "servingAmount": 1.0
    },
    {
      "name": "Mixed Vegetables",
      "quantity": 120,
      "unit": "g",
      "servingAmount": 1.0
    },
    {
      "name": "Olive Oil",
      "quantity": 15,
      "unit": "ml",
      "servingAmount": 1.0
    }
  ],
  "nutrition": {
    "calories": 485.2,
    "protein": 35.8,
    "carbohydrates": 52.4,
    "fat": 12.9
  },
  "confidence": 0.89,
  "notes": "Had this for lunch at home. Chicken was perfectly grilled.",
  "storagePath": "food_images/user_abc123/session_1701234567890.jpg",
  "timestamp": "2024-11-29T12:30:00.000Z"
}
```

### **Response Format**

```typescript
interface SaveMealEntryResponse {
  success: boolean; // Whether save was successful
  mealId: string; // Unique ID of saved meal
  data: {
    id: string; // Same as mealId
    mealName: string; // Saved meal name
    mealType: string; // Saved meal type
    totalCalories: number; // Total calories saved
    timestamp: string; // ISO timestamp of when meal was eaten
    tags: string[]; // Auto-generated tags for categorization
  };
  metadata: {
    processingTime: number; // Time taken to save (ms)
    saved: boolean; // Confirmation that save completed
  };
}
```

### **Response Example**

```json
{
  "success": true,
  "mealId": "meal_1701234567890_xyz789abc",
  "data": {
    "id": "meal_1701234567890_xyz789abc",
    "mealName": "Grilled Chicken with Rice and Vegetables",
    "mealType": "lunch",
    "totalCalories": 485.2,
    "timestamp": "2024-11-29T12:30:00.000Z",
    "tags": ["lunch", "protein", "carbs", "vegetables", "grilled"]
  },
  "metadata": {
    "processingTime": 234,
    "saved": true
  }
}
```

---

## Error Response Format

All functions return structured error responses when something goes wrong:

```typescript
interface ErrorResponse {
  error: {
    code: string; // Error code for client handling
    message: string; // Human-readable error message (localized)
    details?: string; // Additional technical details
  };
  sessionId?: string; // Session ID if available
  language?: string; // Language used for error messages
}
```

### **Common Error Codes**

| Code                           | Description                     | Retry Suggested |
| ------------------------------ | ------------------------------- | --------------- |
| `image_analysis_failed`        | AI couldn't analyze the image   | Yes             |
| `nutrition_calculation_failed` | AI couldn't calculate nutrition | Yes             |
| `invalid_session`              | Session not found or expired    | No              |
| `image_quality_poor`           | Image quality too poor          | No              |
| `invalid_argument`             | Request validation failed       | No              |
| `unauthenticated`              | User not authenticated          | No              |
| `save_failed`                  | Failed to save meal entry       | Yes             |

### **Error Response Example**

```json
{
  "error": {
    "code": "image_analysis_failed",
    "message": "Unable to analyze the food image. Please try with a clearer photo.",
    "details": "AI model returned invalid JSON response"
  },
  "sessionId": "food_1701234567890_abc123def",
  "language": "en"
}
```

---

## Dummy Data Examples

### **Phase 1: Breakfast Example (Arabic Response)**

**Request:**

```json
{
  "storagePath": "food_images/user_456/breakfast_1701234567890.jpg",
  "language": "ar",
  "unitSystem": "metric"
}
```

**Response:**

```json
{
  "sessionId": "food_1701234567890_breakfast456",
  "mealName": "فول مدمس مع الخبز والسلطة",
  "confidence": 0.82,
  "ingredients": [
    {
      "name": "فول مدمس",
      "quantity": 200,
      "unit": "g",
      "confidence": 0.9,
      "category": "legumes"
    },
    {
      "name": "خبز عربي",
      "quantity": 80,
      "unit": "g",
      "confidence": 0.85,
      "category": "grains"
    },
    {
      "name": "سلطة خضراء",
      "quantity": 100,
      "unit": "g",
      "confidence": 0.75,
      "category": "vegetables"
    },
    {
      "name": "زيت زيتون",
      "quantity": 15,
      "unit": "ml",
      "confidence": 0.8,
      "category": "oils"
    }
  ],
  "suggestedMealType": "breakfast",
  "language": "ar"
}
```

### **Phase 2: Dinner Example (Spanish Response)**

**Request:**

```json
{
  "sessionId": "food_1701234567890_dinner789",
  "mealName": "Salmón a la Plancha con Verduras",
  "ingredients": [
    {
      "name": "Salmón a la Plancha",
      "quantity": 180,
      "unit": "g",
      "servingAmount": 1.0
    },
    {
      "name": "Brócoli al Vapor",
      "quantity": 150,
      "unit": "g",
      "servingAmount": 1.0
    },
    {
      "name": "Batata Asada",
      "quantity": 200,
      "unit": "g",
      "servingAmount": 1.0
    },
    {
      "name": "Aceite de Oliva",
      "quantity": 10,
      "unit": "ml",
      "servingAmount": 1.0
    }
  ],
  "additionalInfo": "Salmón cocinado a la plancha sin aceite adicional",
  "language": "es"
}
```

**Response:**

```json
{
  "sessionId": "food_1701234567890_dinner789",
  "nutrition": {
    "calories": 456.8,
    "protein": 34.2,
    "carbohydrates": 31.5,
    "fat": 18.7
  },
  "confidence": 0.91,
  "portionAccuracy": 0.88,
  "calculationMethod": "Utilicé la base de datos nutricional USDA con ajustes para el método de cocción a la plancha",
  "ingredientBreakdown": [
    {
      "name": "Salmón a la Plancha",
      "quantity": 180,
      "unit": "g",
      "calories": 248.4,
      "protein": 25.2,
      "carbohydrates": 0.0,
      "fat": 15.5
    },
    {
      "name": "Brócoli al Vapor",
      "quantity": 150,
      "unit": "g",
      "calories": 51.0,
      "protein": 4.3,
      "carbohydrates": 10.1,
      "fat": 0.6
    },
    {
      "name": "Batata Asada",
      "quantity": 200,
      "unit": "g",
      "calories": 172.0,
      "protein": 3.8,
      "carbohydrates": 41.4,
      "fat": 0.1
    },
    {
      "name": "Aceite de Oliva",
      "quantity": 10,
      "unit": "ml",
      "calories": 85.4,
      "protein": 0.0,
      "carbohydrates": 0.0,
      "fat": 2.5
    }
  ],
  "language": "es"
}
```

### **Phase 3: Snack Example (Imperial Units)**

**Request:**

```json
{
  "sessionId": "food_1701234567890_snack123",
  "mealName": "Apple with Peanut Butter",
  "mealType": "snack",
  "ingredients": [
    {
      "name": "Medium Apple",
      "quantity": 6,
      "unit": "oz",
      "servingAmount": 1.0
    },
    {
      "name": "Natural Peanut Butter",
      "quantity": 2,
      "unit": "tbsp",
      "servingAmount": 1.0
    }
  ],
  "nutrition": {
    "calories": 282.5,
    "protein": 8.1,
    "carbohydrates": 31.2,
    "fat": 16.2
  },
  "confidence": 0.94,
  "notes": "Perfect afternoon snack!",
  "storagePath": "food_images/user_789/snack_1701234567890.jpg",
  "timestamp": "2024-11-29T15:45:00.000Z"
}
```

**Response:**

```json
{
  "success": true,
  "mealId": "meal_1701234567890_snack456def",
  "data": {
    "id": "meal_1701234567890_snack456def",
    "mealName": "Apple with Peanut Butter",
    "mealType": "snack",
    "totalCalories": 282.5,
    "timestamp": "2024-11-29T15:45:00.000Z",
    "tags": ["snack", "fruits", "nuts", "protein"]
  },
  "metadata": {
    "processingTime": 189,
    "saved": true
  }
}
```

### **Complex Meal Example: Mixed Language (French)**

**Phase 1 Request:**

```json
{
  "storagePath": "food_images/user_321/complex_meal_1701234567890.jpg",
  "language": "fr",
  "unitSystem": "metric"
}
```

**Phase 1 Response:**

```json
{
  "sessionId": "food_1701234567890_complex321",
  "mealName": "Salade César au Poulet Grillé avec Croûtons",
  "confidence": 0.86,
  "ingredients": [
    {
      "name": "Poitrine de Poulet Grillée",
      "quantity": 120,
      "unit": "g",
      "confidence": 0.93,
      "category": "protein"
    },
    {
      "name": "Laitue Romaine",
      "quantity": 80,
      "unit": "g",
      "confidence": 0.88,
      "category": "vegetables"
    },
    {
      "name": "Fromage Parmesan Râpé",
      "quantity": 25,
      "unit": "g",
      "confidence": 0.85,
      "category": "dairy"
    },
    {
      "name": "Croûtons",
      "quantity": 30,
      "unit": "g",
      "confidence": 0.82,
      "category": "grains"
    },
    {
      "name": "Sauce César",
      "quantity": 30,
      "unit": "ml",
      "confidence": 0.8,
      "category": "oils"
    }
  ],
  "suggestedMealType": "lunch",
  "language": "fr"
}
```

---

## Integration Examples

### **Flutter/Dart Integration**

```dart
class FoodAnalysisService {
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  // Phase 1: Analyze Image
  Future<Map<String, dynamic>> analyzeImage({
    required String storagePath,
    String language = 'en',
    String unitSystem = 'metric',
  }) async {
    try {
      final result = await _functions
          .httpsCallable('analyzeFoodImageFunction')
          .call({
        'storagePath': storagePath,
        'language': language,
        'unitSystem': unitSystem,
      });

      return result.data as Map<String, dynamic>;
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Phase 2: Analyze Nutrition
  Future<Map<String, dynamic>> analyzeNutrition({
    required String sessionId,
    required String mealName,
    required List<Map<String, dynamic>> ingredients,
    String? additionalInfo,
    List<String>? dietaryRestrictions,
    String language = 'en',
  }) async {
    try {
      final result = await _functions
          .httpsCallable('analyzeNutritionFunction')
          .call({
        'sessionId': sessionId,
        'mealName': mealName,
        'ingredients': ingredients,
        'additionalInfo': additionalInfo,
        'dietaryRestrictions': dietaryRestrictions ?? [],
        'language': language,
      });

      return result.data as Map<String, dynamic>;
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Phase 3: Save Meal
  Future<Map<String, dynamic>> saveMeal({
    String? sessionId,
    required String mealName,
    required String mealType,
    required List<Map<String, dynamic>> ingredients,
    required Map<String, double> nutrition,
    required double confidence,
    String? notes,
    required String storagePath,
    DateTime? timestamp,
  }) async {
    try {
      final result = await _functions
          .httpsCallable('saveMealEntryFunction')
          .call({
        'sessionId': sessionId,
        'mealName': mealName,
        'mealType': mealType,
        'ingredients': ingredients,
        'nutrition': nutrition,
        'confidence': confidence,
        'notes': notes,
        'storagePath': storagePath,
        'timestamp': timestamp?.toIso8601String(),
      });

      return result.data as Map<String, dynamic>;
    } catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(dynamic error) {
    if (error is FirebaseFunctionsException) {
      final details = error.details as Map<String, dynamic>?;
      return Exception(details?['error']?['message'] ?? error.message);
    }
    return Exception(error.toString());
  }
}
```

### **JavaScript/Web Integration**

```javascript
import { getFunctions, httpsCallable } from "firebase/functions";

class FoodAnalysisService {
  constructor() {
    this.functions = getFunctions();
  }

  // Phase 1: Analyze Image
  async analyzeImage(storagePath, language = "en", unitSystem = "metric") {
    const analyzeFoodImage = httpsCallable(
      this.functions,
      "analyzeFoodImageFunction"
    );

    try {
      const result = await analyzeFoodImage({
        storagePath,
        language,
        unitSystem,
      });

      return result.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Phase 2: Analyze Nutrition
  async analyzeNutrition(data) {
    const analyzeNutrition = httpsCallable(
      this.functions,
      "analyzeNutritionFunction"
    );

    try {
      const result = await analyzeNutrition(data);
      return result.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Phase 3: Save Meal
  async saveMeal(data) {
    const saveMeal = httpsCallable(this.functions, "saveMealEntryFunction");

    try {
      const result = await saveMeal(data);
      return result.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    const errorData = error.details?.error || {};
    return new Error(errorData.message || error.message);
  }
}
```

---

## Testing with Postman/Curl

### **Test Phase 1 with cURL**

```bash
curl -X POST \
  https://europe-west1-[PROJECT_ID].cloudfunctions.net/analyzeFoodImageFunction \
  -H "Authorization: Bearer YOUR_FIREBASE_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "storagePath": "food_images/test/sample_meal.jpg",
      "language": "en",
      "unitSystem": "metric"
    }
  }'
```

### **Test Phase 2 with cURL**

```bash
curl -X POST \
  https://europe-west1-[PROJECT_ID].cloudfunctions.net/analyzeNutritionFunction \
  -H "Authorization: Bearer YOUR_FIREBASE_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "sessionId": "food_1701234567890_test123",
      "mealName": "Grilled Chicken Salad",
      "ingredients": [
        {
          "name": "Grilled Chicken Breast",
          "quantity": 150,
          "unit": "g",
          "servingAmount": 1.0
        }
      ],
      "language": "en"
    }
  }'
```

---

This API documentation provides everything needed to integrate with the Kalee AI Food Detection Cloud Functions. The functions are designed to work seamlessly together for the complete food analysis and meal logging workflow.
