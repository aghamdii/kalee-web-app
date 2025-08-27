# Kalee Cloud Functions API Documentation

## Overview

This document describes the API specifications for the new unified Kalee Cloud Functions that provide single-phase AI food analysis. These functions replace the legacy two-phase analysis system with streamlined, comprehensive analysis in a single call.

**Base URL**: `https://europe-west1-[your-project-id].cloudfunctions.net/`  
**Region**: `europe-west1`  
**Authentication**: Firebase Authentication required  
**Timeout**: 120 seconds  
**Memory**: 1GiB  

---

## 🍽️ analyzeMealImageFunction

Analyzes meal photos to provide complete nutrition information with food validity detection.

### Request Format

#### HTTP Method
```
POST /analyzeMealImageFunction
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer [Firebase ID Token]
```

#### Request Body
```typescript
{
  "data": {
    "storagePath": string,        // Required: Firebase Storage path to image
    "language": string,           // Optional: Language code (default: "en")
    "unitSystem": string,         // Optional: "metric" | "imperial" (default: "metric")
    "notes": string              // Optional: User context/notes (max 200 chars)
  }
}
```

#### Field Descriptions

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `storagePath` | string | ✅ | Firebase Storage path to uploaded image | `"food_analysis/user123/1703123456789.jpg"` |
| `language` | string | ❌ | Language for AI responses | `"en"`, `"ar"`, `"es"`, `"fr"` |
| `unitSystem` | string | ❌ | Measurement system | `"metric"` (g/ml) or `"imperial"` (oz/cups) |
| `notes` | string | ❌ | User-provided context | `"Large portion"`, `"McDonald's Big Mac"` |

### Response Format

#### Success Response (200)
```typescript
{
  "success": true,
  "sessionId": string,
  "mode": "meal",
  
  // Core Results
  "mealName": string,
  "nutrition": {
    "calories": number,           // Total calories (kcal)
    "protein": number,            // Protein in grams
    "carbs": number,              // Carbohydrates in grams
    "fat": number                // Fat in grams
  },
  
  // Confidence Metrics
  "confidence": number,          // Overall confidence (0.0-1.0)
  "foodValidity": {
    "score": number,             // Food validity score (0.0-1.0)
    "isFood": boolean,           // Is this actually food?
    "warningMessage": string,    // Warning if score < 0.75 (optional)
    "category": string           // "meal" | "packaged_food" | "beverage" | "non_food" | "unclear"
  },
  
  // Supporting Data
  "ingredients": [               // Optional: Detected ingredients
    {
      "name": string,            // Ingredient name
      "quantity": number,        // Estimated quantity
      "unit": string,           // Unit (g, ml, pieces, etc.)
      "calories": number        // Calories from this ingredient
    }
  ],
  "servingSize": string,        // Optional: Estimated serving size
  "servingsAnalyzed": number,   // Number of servings analyzed (default: 1.0)
  
  // Metadata
  "processingTime": number,     // Processing time in milliseconds
  "model": string,             // AI model used
  "language": string,          // Language used for response
  "unitSystem": string,        // Unit system used
  "userNotes": string,         // User notes provided (optional)
  
  // Quality Indicators
  "warnings": string[],        // Any warnings about the analysis (optional)
  "suggestions": string[]      // Suggestions for better results (optional)
}
```

#### Example Success Response
```json
{
  "success": true,
  "sessionId": "meal_1703123456789_abc123def",
  "mode": "meal",
  "mealName": "Grilled Chicken Caesar Salad",
  "nutrition": {
    "calories": 420.5,
    "protein": 35.2,
    "carbs": 12.8,
    "fat": 26.1
  },
  "confidence": 0.87,
  "foodValidity": {
    "score": 0.92,
    "isFood": true,
    "category": "meal"
  },
  "ingredients": [
    {
      "name": "Grilled Chicken Breast",
      "quantity": 150,
      "unit": "g",
      "calories": 247
    },
    {
      "name": "Romaine Lettuce",
      "quantity": 100,
      "unit": "g",
      "calories": 17
    },
    {
      "name": "Caesar Dressing",
      "quantity": 30,
      "unit": "ml",
      "calories": 156
    }
  ],
  "servingSize": "1 large bowl",
  "servingsAnalyzed": 1.0,
  "processingTime": 8450,
  "model": "gemini-2.5-flash",
  "language": "en",
  "unitSystem": "metric",
  "userNotes": "Restaurant portion",
  "warnings": [],
  "suggestions": []
}
```

---

## 🏷️ analyzeLabelImageFunction

Analyzes nutrition labels using OCR to extract accurate nutrition information.

### Request Format

#### HTTP Method
```
POST /analyzeLabelImageFunction
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer [Firebase ID Token]
```

#### Request Body
```typescript
{
  "data": {
    "storagePath": string,        // Required: Firebase Storage path to label image
    "language": string,           // Optional: Language code (default: "en")
    "unitSystem": string,         // Optional: "metric" | "imperial" (default: "metric")
    "notes": string              // Optional: Portion adjustments (max 200 chars)
  }
}
```

#### Field Descriptions

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `storagePath` | string | ✅ | Firebase Storage path to nutrition label image | `"food_analysis/user123/1703123456789.jpg"` |
| `language` | string | ❌ | Language for AI responses | `"en"`, `"ar"`, `"es"`, `"fr"` |
| `unitSystem` | string | ❌ | Measurement system | `"metric"` (g/ml) or `"imperial"` (oz/cups) |
| `notes` | string | ❌ | Portion adjustments | `"Half package"`, `"2 servings"`, `"With 200ml milk"` |

### Response Format

#### Success Response (200)
```typescript
{
  "success": true,
  "sessionId": string,
  "mode": "label",
  
  // Core Results
  "mealName": string,            // Product name from label
  "nutrition": {
    "calories": number,           // Calories per serving (adjusted for notes)
    "protein": number,            // Protein in grams
    "carbs": number,              // Carbohydrates in grams
    "fat": number                // Fat in grams
  },
  
  // Confidence Metrics
  "confidence": number,          // OCR reading confidence (0.0-1.0)
  "foodValidity": {
    "score": number,             // Label readability score (0.0-1.0)
    "isFood": boolean,           // Is this a nutrition label?
    "warningMessage": string,    // Warning if unclear (optional)
    "category": string           // "packaged_food" | "beverage" | "unclear" | "non_food"
  },
  
  // Label-Specific Data
  "servingSize": string,        // Serving size from label
  "servingsAnalyzed": number,   // Actual servings calculated (based on notes)
  
  // Metadata
  "processingTime": number,     // Processing time in milliseconds
  "model": string,             // AI model used
  "language": string,          // Language used for response
  "unitSystem": string,        // Unit system used
  "userNotes": string,         // Portion adjustments provided (optional)
  
  // Quality Indicators
  "warnings": string[],        // Label quality warnings (optional)
  "suggestions": string[]      // OCR improvement suggestions (optional)
}
```

#### Example Success Response
```json
{
  "success": true,
  "sessionId": "label_1703123456789_xyz789abc",
  "mode": "label",
  "mealName": "Whole Grain Cereal",
  "nutrition": {
    "calories": 75.0,
    "protein": 2.0,
    "carbs": 16.0,
    "fat": 0.75
  },
  "confidence": 0.94,
  "foodValidity": {
    "score": 0.96,
    "isFood": true,
    "category": "packaged_food"
  },
  "servingSize": "1 cup (40g)",
  "servingsAnalyzed": 0.5,
  "processingTime": 7200,
  "model": "gemini-2.5-flash",
  "language": "en",
  "unitSystem": "metric",
  "userNotes": "Half cup serving",
  "warnings": [],
  "suggestions": ["Nutrition values adjusted for half serving based on your notes."]
}
```

---

## 🚫 Error Response Format

All functions return structured error responses for various failure scenarios.

### HTTP Status Codes
- `400` - Invalid request parameters
- `401` - Authentication required
- `403` - Permission denied
- `404` - Image not found
- `429` - Rate limit exceeded  
- `500` - Internal server error
- `503` - Service temporarily unavailable

### Error Response Structure
```typescript
{
  "error": {
    "code": string,              // Error code for client handling
    "message": string,           // Human-readable error message
    "details": object           // Additional error context (optional)
  }
}
```

### Common Error Responses

#### Authentication Error (401)
```json
{
  "error": {
    "code": "unauthenticated",
    "message": "User must be authenticated"
  }
}
```

#### Invalid Request (400)
```json
{
  "error": {
    "code": "invalid-argument",
    "message": "Invalid request: storagePath is required",
    "details": {
      "field": "storagePath",
      "reason": "missing_required_field"
    }
  }
}
```

#### Image Not Found (404)
```json
{
  "error": {
    "code": "not-found",
    "message": "Image not found or inaccessible",
    "details": {
      "storagePath": "food_analysis/user123/invalid.jpg"
    }
  }
}
```

#### Analysis Failed (500)
```json
{
  "error": {
    "code": "meal_analysis_failed",
    "message": "Unable to analyze the food image. Please try with a clearer photo.",
    "details": {
      "sessionId": "meal_1703123456789_abc123def",
      "originalError": "AI model timeout"
    }
  }
}
```

#### Rate Limit Exceeded (429)
```json
{
  "error": {
    "code": "resource-exhausted",
    "message": "AI analysis quota exceeded. Please try again later.",
    "details": {
      "retryAfter": 3600
    }
  }
}
```

---

## 🔧 Usage Examples

### JavaScript/TypeScript (Web/React Native)
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions(app, 'europe-west1');

// Analyze meal image
const analyzeMealImage = httpsCallable(functions, 'analyzeMealImageFunction');

try {
  const result = await analyzeMealImage({
    storagePath: 'food_analysis/user123/meal.jpg',
    language: 'en',
    unitSystem: 'metric',
    notes: 'Large restaurant portion'
  });
  
  console.log('Meal Analysis:', result.data);
  console.log('Calories:', result.data.nutrition.calories);
  console.log('Food Valid:', result.data.foodValidity.isFood);
} catch (error) {
  console.error('Analysis failed:', error);
}

// Analyze nutrition label
const analyzeLabelImage = httpsCallable(functions, 'analyzeLabelImageFunction');

try {
  const result = await analyzeLabelImage({
    storagePath: 'food_analysis/user123/label.jpg',
    language: 'en',
    unitSystem: 'metric',
    notes: 'Half package consumed'
  });
  
  console.log('Label Analysis:', result.data);
  console.log('Adjusted Calories:', result.data.nutrition.calories);
} catch (error) {
  console.error('Label analysis failed:', error);
}
```

### Flutter/Dart
```dart
import 'package:cloud_functions/cloud_functions.dart';

final functions = FirebaseFunctions.instanceFor(region: 'europe-west1');

// Analyze meal image
Future<Map<String, dynamic>> analyzeMealImage({
  required String storagePath,
  String language = 'en',
  String unitSystem = 'metric',
  String? notes,
}) async {
  try {
    final callable = functions.httpsCallable('analyzeMealImageFunction');
    
    final result = await callable.call({
      'storagePath': storagePath,
      'language': language,
      'unitSystem': unitSystem,
      'notes': notes ?? '',
    });
    
    return result.data as Map<String, dynamic>;
  } on FirebaseFunctionsException catch (e) {
    print('Function error: ${e.code} - ${e.message}');
    rethrow;
  }
}

// Usage
final analysisResult = await analyzeMealImage(
  storagePath: 'food_analysis/user123/meal.jpg',
  notes: 'Homemade pasta with cheese',
);

print('Calories: ${analysisResult['nutrition']['calories']}');
print('Carbs: ${analysisResult['nutrition']['carbs']}');
print('Valid food: ${analysisResult['foodValidity']['isFood']}');
```

### cURL (Testing)
```bash
# Get Firebase ID token first
ID_TOKEN="your-firebase-id-token"

# Analyze meal image
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -d '{
    "data": {
      "storagePath": "food_analysis/user123/meal.jpg",
      "language": "en",
      "unitSystem": "metric",
      "notes": "Large portion from restaurant"
    }
  }' \
  "https://europe-west1-your-project-id.cloudfunctions.net/analyzeMealImageFunction"

# Analyze nutrition label
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -d '{
    "data": {
      "storagePath": "food_analysis/user123/label.jpg",
      "language": "en",
      "unitSystem": "metric",
      "notes": "Two servings consumed"
    }
  }' \
  "https://europe-west1-your-project-id.cloudfunctions.net/analyzeLabelImageFunction"
```

---

## 🚀 Flutter Integration Guide

### Complete Flutter Integration Example

```dart
// lib/feature/ai/domain/entities/unified_analysis_result.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'unified_analysis_result.freezed.dart';
part 'unified_analysis_result.g.dart';

@freezed
class UnifiedAnalysisResult with _$UnifiedAnalysisResult {
  const factory UnifiedAnalysisResult({
    required bool success,
    required String sessionId,
    required String mode, // 'meal' or 'label'
    
    // Core data
    required String mealName,
    required NutritionData nutrition,
    
    // Confidence metrics
    required double confidence,
    required FoodValidity foodValidity,
    
    // Supporting data
    @Default([]) List<SimpleIngredient> ingredients,
    String? servingSize,
    @Default(1.0) double servingsAnalyzed,
    
    // Metadata
    required int processingTime,
    required String model,
    required String language,
    required String unitSystem,
    String? userNotes,
    
    // Warnings
    @Default([]) List<String> warnings,
    @Default([]) List<String> suggestions,
  }) = _UnifiedAnalysisResult;

  const UnifiedAnalysisResult._();

  factory UnifiedAnalysisResult.fromJson(Map<String, dynamic> json) =>
      _$UnifiedAnalysisResultFromJson(json);
      
  // Helper getters
  bool get isValidFood => foodValidity.score > 0.25;
  bool get hasHighConfidence => confidence > 0.7;
  bool get needsWarning => foodValidity.score < 0.25;
}

@freezed
class NutritionData with _$NutritionData {
  const factory NutritionData({
    required double calories,
    required double protein,
    required double carbs,    // Changed from carbohydrates
    required double fat,
  }) = _NutritionData;

  factory NutritionData.fromJson(Map<String, dynamic> json) =>
      _$NutritionDataFromJson(json);
}

@freezed
class FoodValidity with _$FoodValidity {
  const factory FoodValidity({
    required double score, // 0.0 to 1.0
    required bool isFood,
    String? warningMessage,
    required String category, // meal, packaged_food, beverage, non_food, unclear
  }) = _FoodValidity;

  factory FoodValidity.fromJson(Map<String, dynamic> json) =>
      _$FoodValidityFromJson(json);
}

@freezed
class SimpleIngredient with _$SimpleIngredient {
  const factory SimpleIngredient({
    required String name,
    required double quantity,
    required String unit,
    required double calories,
  }) = _SimpleIngredient;

  factory SimpleIngredient.fromJson(Map<String, dynamic> json) =>
      _$SimpleIngredientFromJson(json);
}
```

### Repository Implementation
```dart
// lib/feature/ai/data/repositories/ai_repository_impl.dart
@LazySingleton(as: AIRepository)
class AIRepositoryImpl implements AIRepository {
  final FirebaseService _firebaseService;
  late final FirebaseFunctions _functions;

  AIRepositoryImpl(this._firebaseService) {
    _functions = FirebaseFunctions.instanceFor(
      app: _firebaseService.auth.app,
      region: 'europe-west1',
    );
  }

  @override
  Future<UnifiedAnalysisResult> analyzeMealImage({
    required String storagePath,
    String? notes,
    required String language,
    required String unitSystem,
  }) async {
    try {
      final callable = _functions.httpsCallable(
        'analyzeMealImageFunction',
        options: HttpsCallableOptions(
          timeout: const Duration(seconds: 120),
        ),
      );

      final result = await callable.call({
        'storagePath': storagePath,
        'language': language,
        'unitSystem': unitSystem,
        'notes': notes ?? '',
      });
      
      return UnifiedAnalysisResult.fromJson(
        result.data as Map<String, dynamic>
      );
      
    } on FirebaseFunctionsException catch (e) {
      throw _handleFunctionError(e);
    }
  }

  @override
  Future<UnifiedAnalysisResult> analyzeLabelImage({
    required String storagePath,
    String? notes,
    required String language,
    required String unitSystem,
  }) async {
    try {
      final callable = _functions.httpsCallable('analyzeLabelImageFunction');

      final result = await callable.call({
        'storagePath': storagePath,
        'language': language,
        'unitSystem': unitSystem,
        'notes': notes ?? '',
      });
      
      return UnifiedAnalysisResult.fromJson(
        result.data as Map<String, dynamic>
      );
      
    } on FirebaseFunctionsException catch (e) {
      throw _handleFunctionError(e);
    }
  }
}
```

### Cubit Usage
```dart
// Usage in FoodAnalysisCubit
Future<void> analyzeFoodImage({
  required String imagePath,
  required String mode, // 'meal' or 'label'
  String? notes,
}) async {
  try {
    // Upload image first
    final storagePath = await _aiRepository.uploadFoodImage(imagePath);
    
    // Call appropriate analysis function
    final UnifiedAnalysisResult result;
    if (mode == 'label') {
      result = await _aiRepository.analyzeLabelImage(
        storagePath: storagePath,
        notes: notes,
        language: 'English',
        unitSystem: 'metric',
      );
    } else {
      result = await _aiRepository.analyzeMealImage(
        storagePath: storagePath,
        notes: notes,
        language: 'English',
        unitSystem: 'metric',
      );
    }
    
    // Handle result
    emit(state.copyWith(
      result: result,
      showFoodWarning: result.needsWarning,
    ));
    
  } catch (e) {
    // Handle error
    emit(state.copyWith(errorMessage: e.toString()));
  }
}
```

---

## 📊 Response Processing Guidelines

### Food Validity Handling
```typescript
// Check if food is valid before saving
if (result.foodValidity.score < 0.25) {
  // Show warning dialog
  showWarning(result.foodValidity.warningMessage || 'This may not be food');
  // Allow user to override or retake photo
} else if (result.foodValidity.score < 0.75) {
  // Show mild caution
  showInfo('AI is uncertain about this image');
}
```

### Confidence-Based UI
```typescript
// Adjust UI based on confidence levels
if (result.confidence >= 0.8) {
  // High confidence - show results prominently
  showHighConfidenceUI(result);
} else if (result.confidence >= 0.6) {
  // Medium confidence - show with caveats
  showMediumConfidenceUI(result);
} else {
  // Low confidence - suggest retaking photo
  showLowConfidenceUI(result);
}
```

### Warning and Suggestion Handling
```typescript
// Display warnings to user
result.warnings?.forEach(warning => {
  showWarningToast(warning);
});

// Show suggestions for improvement
result.suggestions?.forEach(suggestion => {
  showSuggestionTip(suggestion);
});
```

---

## 🔒 Security & Rate Limiting

### Authentication Requirements
- All requests must include valid Firebase ID Token
- Token must not be expired
- User must exist in Firebase Auth

### Rate Limiting
- **Per User**: 100 requests per hour
- **Per IP**: 1000 requests per hour  
- **Global**: 10,000 requests per hour

### Input Validation
- Image size: Max 10MB
- Notes length: Max 200 characters
- Supported image formats: JPEG, PNG, WebP
- Storage path must be valid Firebase Storage reference

---

## 📈 Monitoring & Analytics

### Success Metrics
- **Response Time**: Target < 12 seconds
- **Success Rate**: Target > 95%
- **Food Validity Accuracy**: Target > 95%

### Logged Events
- Function invocations with performance metrics
- Food validity scores and categories
- User feedback correlation
- Error rates and types

### Health Checks
- Function availability monitoring
- AI model performance tracking
- Storage access verification

---

This API documentation provides complete specifications for integrating with the new unified Kalee Cloud Functions. Both functions deliver comprehensive nutrition analysis in a single call, eliminating the complexity of the previous two-phase system while providing enhanced food validity detection and user experience.