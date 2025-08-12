# AI Food Detection & Nutrition Analysis Flow

## 📋 Product Overview

The AI Food Detection system enables users to log meals through two primary methods: **Quick Add** (manual/preset selection) and **Camera-based AI Detection**. The system uses a two-phase AI analysis approach to provide accurate nutritional information by combining visual analysis with user-provided context.

## 🎯 Product Goals

- **Accuracy**: Provide precise nutritional analysis by combining AI visual recognition with user input
- **Speed**: Quick meal logging with minimal user friction
- **Flexibility**: Support both preset meals and custom food detection
- **Learning**: Improve AI accuracy over time with user corrections and preferences
- **Personalization**: Build user-specific food database and preferences

---

## 🚀 User Flows

### Flow 1: Quick Add (Manual Entry)

**Entry Point**: Home screen → Quick Add button

#### User Journey:
1. **Quick Add Modal Opens**
   - Display recently logged meals
   - Show favorite/frequent meals
   - Search functionality for preset meals
   - "Create New Meal" option

2. **Meal Selection**
   - **Option A**: Select from preset/recent meals
     - Auto-populate ingredients and portions
     - Allow quantity adjustments
     - Skip to Phase 2 (nutrition confirmation)
   
   - **Option B**: Create new meal
     - Manual ingredient entry
     - Quantity and unit specification
     - Meal type selection (breakfast, lunch, dinner, snack)
     - Proceed to Phase 2

3. **Save & Personalization**
   - Option to save new meal to favorites
   - Add custom meal tags/categories
   - Set default portions for future use

### Flow 2: Camera-based AI Detection

**Entry Point**: Home screen → Camera/Photo button

#### Phase 1: Image Capture & Initial Analysis

1. **Image Input Selection**
   ```
   Camera Modal Options:
   ├── Take Photo (Camera)
   ├── Select from Gallery
   └── Cancel
   ```

2. **AI Initial Analysis** 🤖
   - **Input**: Food image
   - **AI Processing**: Visual food recognition
   - **Output**: 
     - Suggested meal name
     - Identified ingredients list with estimated quantities
     - Meal type suggestion (based on time of day)

3. **User Review & Correction** (Ingredient Analysis Modal)
   - **Meal Name**: Editable text field with AI suggestion
   - **Meal Type**: Emoji selector (🌅 breakfast, ☀️ lunch, 🌙 dinner, 🍿 snack)
   - **Ingredients List**: 
     - Editable ingredient names
     - Adjustable quantities with unit selection
     - Add/remove ingredients
     - Visual feedback with focus management
   - **Additional Information**: Free text for cooking methods, modifications, etc.

#### Phase 2: Detailed Nutrition Analysis

4. **Enhanced AI Analysis** 🤖
   - **Input**: 
     - Original food image
     - Corrected meal name
     - Final ingredients list with quantities
     - Additional user information
     - User's dietary preferences/restrictions (from profile)
   
   - **AI Processing**: Advanced nutritional analysis
   - **Output**:
     - Detailed macronutrients (calories, carbs, protein, fat)
     - Micronutrients (vitamins, minerals)
     - Portion size validation
     - Dietary flags (gluten-free, dairy-free, etc.)

5. **Nutrition Review & Confirmation**
   - Display comprehensive nutrition breakdown
   - Allow manual adjustments if needed
   - Compare with daily targets/goals
   - Save to meal log

---

## 📊 Data Models

### Core Entities

#### Meal Entry
```dart
class MealEntry {
  final String id;
  final String userId;
  final DateTime timestamp;
  final MealType mealType; // breakfast, lunch, dinner, snack
  final String mealName;
  final String? imagePath; // null for quick-add meals
  final List<Ingredient> ingredients;
  final String? additionalInfo;
  final NutritionData nutrition;
  final MealSource source; // quickAdd, aiDetection
  final bool isFavorite;
  final List<String> tags;
  final DateTime createdAt;
  final DateTime updatedAt;
}
```

#### Ingredient
```dart
class Ingredient {
  final String id;
  final String name;
  final double quantity;
  final String unit; // g, kg, ml, L, cups, pieces, etc.
  final NutritionData? nutritionPer100g; // for calculation
  final String? brand;
  final String? category; // protein, vegetable, grain, etc.
}
```

#### Nutrition Data
```dart
class NutritionData {
  final double calories;
  final double protein; // grams
  final double carbohydrates; // grams
  final double fat; // grams
  final double fiber; // grams
  final double sugar; // grams
  final double sodium; // mg
  final Map<String, double> vitamins; // vitamin name -> amount
  final Map<String, double> minerals; // mineral name -> amount
  final DateTime calculatedAt;
  final double confidenceScore; // AI confidence 0-1
}
```

#### User Food Database
```dart
class UserFoodItem {
  final String id;
  final String userId;
  final String name;
  final String? imagePath;
  final List<Ingredient> defaultIngredients;
  final MealType? preferredMealType;
  final int usageCount;
  final DateTime lastUsed;
  final bool isCustom; // user-created vs preset
  final List<String> tags;
}
```

#### AI Analysis Session
```dart
class AIAnalysisSession {
  final String id;
  final String userId;
  final String imagePath;
  final DateTime startedAt;
  final AIAnalysisPhase currentPhase;
  final Map<String, dynamic> phase1Results; // initial analysis
  final Map<String, dynamic> phase2Results; // nutrition analysis
  final List<UserCorrection> userCorrections;
  final double finalConfidenceScore;
}
```

---

## 🔧 Technical Implementation

### State Management (Cubit Architecture)

#### MealLoggingCubit
```dart
class MealLoggingCubit extends Cubit<MealLoggingState> {
  // Quick Add functionality
  Future<void> loadRecentMeals();
  Future<void> loadFavoriteMeals();
  Future<void> searchMeals(String query);
  Future<void> createCustomMeal(MealEntry meal);
  
  // Camera flow
  Future<void> startCameraFlow();
  Future<void> processImage(String imagePath);
  Future<void> submitPhase1Analysis(MealAnalysisData data);
  Future<void> requestPhase2Analysis();
  Future<void> saveMealEntry(MealEntry meal);
}
```

#### AIAnalysisCubit
```dart
class AIAnalysisCubit extends Cubit<AIAnalysisState> {
  Future<void> analyzeFood(String imagePath);
  Future<void> analyzeNutrition({
    required String imagePath,
    required String mealName,
    required List<Ingredient> ingredients,
    String? additionalInfo,
  });
}
```

### Repository Layer

#### MealRepository
```dart
abstract class MealRepository {
  Future<List<MealEntry>> getRecentMeals(String userId);
  Future<List<UserFoodItem>> getFavoriteMeals(String userId);
  Future<List<UserFoodItem>> searchMeals(String query);
  Future<void> saveMealEntry(MealEntry meal);
  Future<void> saveFoodItem(UserFoodItem foodItem);
}
```

#### AIRepository
```dart
abstract class AIRepository {
  Future<AIAnalysisResult> analyzeFoodImage(String imagePath);
  Future<NutritionAnalysisResult> analyzeNutrition({
    required String imagePath,
    required String mealName,
    required List<Ingredient> ingredients,
    String? additionalInfo,
  });
}
```

---

## 🔗 Firebase Integration

### Firestore Collections

#### Users Collection
```
users/{userId}/ {
  profile: UserProfile,
  settings: UserSettings,
  nutritionGoals: NutritionGoals,
  dietaryRestrictions: List<String>
}
```

#### Meals Collection
```
meals/{mealId}/ {
  userId: string,
  timestamp: Timestamp,
  mealType: string,
  mealName: string,
  imagePath?: string,
  ingredients: List<Map>,
  nutrition: Map,
  source: string,
  isFavorite: boolean,
  tags: List<string>
}
```

#### User Foods Collection
```
userFoods/{userId}/foods/{foodId}/ {
  name: string,
  imagePath?: string,
  defaultIngredients: List<Map>,
  usageCount: number,
  lastUsed: Timestamp,
  isCustom: boolean
}
```

#### AI Sessions Collection (for debugging/improvement)
```
aiSessions/{sessionId}/ {
  userId: string,
  imagePath: string,
  phase1Results: Map,
  phase2Results: Map,
  userCorrections: List<Map>,
  confidenceScore: number,
  timestamp: Timestamp
}
```

### Firebase Storage
```
images/
├── users/{userId}/
│   ├── meals/{mealId}.jpg
│   └── foods/{foodId}.jpg
└── temp/{sessionId}.jpg (for AI processing)
```

---

## 🤖 AI Integration Specifications

### Phase 1: Visual Food Recognition

**Endpoint**: `/api/v1/analyze/food-image`

**Request**:
```json
{
  "image": "base64_encoded_image",
  "userId": "user_id",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Response**:
```json
{
  "sessionId": "analysis_session_id",
  "mealName": "Grilled Chicken with Rice and Vegetables",
  "confidence": 0.87,
  "ingredients": [
    {
      "name": "Grilled Chicken Breast",
      "quantity": 150,
      "unit": "g",
      "confidence": 0.92
    },
    {
      "name": "White Rice",
      "quantity": 200,
      "unit": "g",
      "confidence": 0.85
    }
  ],
  "suggestedMealType": "lunch"
}
```

### Phase 2: Nutritional Analysis

**Endpoint**: `/api/v1/analyze/nutrition`

**Request**:
```json
{
  "sessionId": "analysis_session_id",
  "image": "base64_encoded_image",
  "mealName": "Grilled Chicken with Rice",
  "ingredients": [
    {
      "name": "Grilled Chicken Breast",
      "quantity": 150,
      "unit": "g"
    }
  ],
  "additionalInfo": "grilled not fried, no oil added",
  "userProfile": {
    "dietaryRestrictions": ["none"],
    "activityLevel": "moderate"
  }
}
```

**Response**:
```json
{
  "nutrition": {
    "calories": 450,
    "protein": 35.2,
    "carbohydrates": 48.1,
    "fat": 8.5,
    "fiber": 2.3,
    "sugar": 1.2,
    "sodium": 320
  },
  "confidence": 0.89,
  "portionAccuracy": 0.91,
  "dietaryFlags": ["high_protein", "low_fat"],
  "alternatives": [
    {
      "name": "With added olive oil (1 tbsp)",
      "nutrition": { "calories": 570, "fat": 18.5 }
    }
  ]
}
```

---

## 📈 Analytics & Improvement

### User Behavior Tracking (Mixpanel)

#### Events to Track:
- `meal_logging_started` (method: quickAdd/camera)
- `quick_add_meal_selected` (mealId, isCustom)
- `camera_photo_taken` / `camera_gallery_selected`
- `ai_analysis_phase1_completed` (confidence, corrections_made)
- `ai_analysis_phase2_completed` (confidence, manual_adjustments)
- `meal_saved` (source, nutrition_totals)
- `meal_marked_favorite`
- `ingredient_corrected` (original, corrected)

#### User Properties:
- `total_meals_logged`
- `quick_add_usage_percentage`
- `camera_usage_percentage`
- `average_ai_confidence`
- `correction_frequency`

### AI Model Improvement
- Store user corrections for model retraining
- A/B test different AI models
- Track confidence scores vs user satisfaction
- Identify common misrecognitions for targeted improvements

---

## 🚦 User Experience Considerations

### Loading States
- Image upload progress indicator
- AI analysis progress with estimated time
- Skeleton loading for ingredient cards
- Optimistic updates for better perceived performance

### Error Handling
- Network connectivity issues
- AI service unavailability
- Image quality too poor for analysis
- Fallback to manual entry options

### Accessibility
- Screen reader support for all inputs
- High contrast mode for ingredient text
- Voice input for meal names and ingredients
- Keyboard navigation support

### Performance Optimizations
- Image compression before upload
- Caching of frequent meals and ingredients
- Offline capability for previously logged meals
- Background sync when connection restored

---

## 🔮 Future Enhancements

### Smart Suggestions
- Meal recommendations based on time of day and past preferences
- Ingredient substitution suggestions for dietary restrictions
- Portion size recommendations based on user goals

### Social Features
- Share favorite meals with friends
- Community meal database
- Recipe suggestions based on available ingredients

### Integration Opportunities
- Grocery shopping lists from meal plans
- Restaurant menu integration
- Fitness tracker synchronization
- Healthcare provider nutrition reports

### Advanced AI Features
- Multi-dish meal recognition
- Cooking method detection (fried vs grilled)
- Brand recognition for packaged foods
- Nutritional label scanning and parsing

---

## 📋 Success Metrics

### User Engagement
- Daily active users logging meals
- Retention rate after first week/month
- Average meals logged per user per day
- Quick Add vs Camera usage distribution

### AI Performance
- Phase 1 accuracy (ingredient identification)
- Phase 2 accuracy (nutrition calculation)
- User correction frequency
- Confidence score trends over time

### Product Goals
- Time to log a meal (target: <2 minutes)
- User satisfaction with nutrition accuracy
- Feature adoption rates
- User-generated content (custom meals, corrections)

---

This comprehensive product specification provides a roadmap for implementing the AI food detection system with clear technical requirements, data models, and user experience guidelines. It serves as a foundation for development team coordination and future feature planning.