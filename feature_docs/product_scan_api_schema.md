# Product Scan API Response Schema

## Structured Output Schema for Gemini API

### Root Object
```typescript
interface ProductScanResponse {
  productInfo: ProductInfo;
  servingInfo: ServingInfo;
  nutritionPerServing: NutritionValues;
  ingredients?: Ingredient[];           // Optional - only if visible on label
  allergens?: AllergenEnum[];          // Optional - only if visible on label  
  processingLevel?: ProcessingLevel;    // Optional - calculated from ingredients
  analysis: AnalysisMetadata;
}
```

### Sub-Types Definition

#### ProductInfo
```typescript
interface ProductInfo {
  name: string;                    // Product name extracted from label
  // Note: Image URL will be stored via Firebase Storage, not extracted by AI
}
```

#### ServingInfo
```typescript
interface ServingInfo {
  servingSize: number;             // Amount per serving (numeric value)
  servingUnit: string;             // Unit type (ml, g, cup, piece, oz, etc.)
  servingsPerContainer: number;    // Total servings in package
  hasMultipleServings: boolean;    // false for single-serve items (e.g. Pepsi can with 1 serving)
}
```

#### NutritionValues
```typescript
interface NutritionValues {
  calories: NutritionValue;
  protein: NutritionValue;        // in grams
  carbs: NutritionValue;          // in grams
  fat: NutritionValue;            // in grams
  sugar: NutritionValue;          // in grams
  sodium: NutritionValue;         // in milligrams
  fiber: NutritionValue;          // in grams
  cholesterol: NutritionValue;    // in milligrams
}

interface NutritionValue {
  value: number;
  isFromLabel: boolean;           // true if extracted from label, false if estimated
  healthRating: HealthRatingEnum; // Health assessment for this nutrient amount
}

enum HealthRatingEnum {
  EXCELLENT = "EXCELLENT",       // Green circle
  GOOD = "GOOD",                 // Light green circle
  FAIR = "FAIR",                 // Orange circle
  POOR = "POOR"                  // Red circle
}
```

#### Ingredient
```typescript
interface Ingredient {
  name: string;
  category: IngredientCategory;
  eNumber?: string | null;         // E-number if applicable (e.g., "E407")
  isHighlighted: boolean;          // Mark for user attention (removed healthWarning)
}

enum IngredientCategory {
  NATURAL = "NATURAL",           // Basic ingredients
  ADDITIVE = "ADDITIVE",         // E-numbers, preservatives
  VITAMIN = "VITAMIN",           // Added vitamins
  MINERAL = "MINERAL",           // Added minerals
  STABILIZER = "STABILIZER",     // Texture agents
  FLAVORING = "FLAVORING",       // Flavor enhancers
  SWEETENER = "SWEETENER"        // Artificial sweeteners
}
```

#### ProcessingLevel
```typescript
interface ProcessingLevel {
  score: number;           // 1-10 scale (0 means not available/no ingredients)
  level: ProcessingLevelEnum;
}

enum ProcessingLevelEnum {
  MINIMAL = "MINIMAL",     // score 1-3
  LOW = "LOW",            // score 4-5
  MODERATE = "MODERATE",   // score 6-7
  HIGH = "HIGH"           // score 8-10
}
```

#### AnalysisMetadata
```typescript
interface AnalysisMetadata {
  confidenceScore: number;        // 0-100 percentage (removed warnings and notes)
}
```

### Allergens Enum
```typescript
enum AllergenEnum {
  WHEAT = "WHEAT",
  DAIRY = "DAIRY", 
  SOY = "SOY",
  NUTS = "NUTS",
  EGGS = "EGGS",
  SHELLFISH = "SHELLFISH",
  FISH = "FISH",
  PEANUTS = "PEANUTS",
  GLUTEN = "GLUTEN",
  SESAME = "SESAME",
  TREE_NUTS = "TREE_NUTS"
}
```

## Validation Rules

1. **Required Fields**: `productInfo`, `servingInfo`, `nutritionPerServing`, and `analysis` are always required
2. **Optional Fields**: `ingredients`, `allergens`, and `processingLevel` should only be included if ingredients are visible on the label
3. **Numeric Ranges**:
   - `confidenceScore`: 0-100
   - `processingLevel.score`: 0-10 (0 = not available, 1-10 = processing level)
   - All nutrition values: >= 0
   - `servingsPerContainer`: > 0
4. **String Constraints**:
   - `productInfo.name`: Non-empty string
   - `servingUnit`: Should be a recognized unit
5. **Processing Level Mapping**:
   - Score 0 → Not available (no ingredients visible)
   - Score 1-3 → MINIMAL
   - Score 4-5 → LOW
   - Score 6-7 → MODERATE
   - Score 8-10 → HIGH
6. **E-Number Format**: Should follow pattern "E[0-9]+" when provided
7. **hasMultipleServings Logic**: 
   - false when servingsPerContainer == 1 (e.g., single Pepsi can)
   - true when servingsPerContainer > 1
8. **Health Rating Guidelines**:
   - EXCELLENT: Optimal nutrient levels
   - GOOD: Healthy ranges
   - FAIR: Moderate concern levels
   - POOR: High concern levels
9. **UI Display Logic**:
   - When `isFromLabel == false`, display "--" instead of numeric value
   - When `hasMultipleServings == false`, hide portion adjustment controls
   - When `ingredients` is missing, hide Ingredients section entirely
   - When `allergens` is missing or empty AND `processingLevel` is missing, hide Allergy & Additives section

## Example Processing Logic

### Calculating Processing Level
```typescript
function calculateProcessingLevel(ingredients?: Ingredient[]): ProcessingLevel | undefined {
  // Return undefined if no ingredients available
  if (!ingredients || ingredients.length === 0) {
    return undefined; // This field will be omitted from response
  }
  
  const additiveCount = ingredients.filter(i => i.category === 'ADDITIVE').length;
  const hasArtificialSweeteners = ingredients.some(i => i.category === 'SWEETENER');
  const hasMultipleStabilizers = ingredients.filter(i => i.category === 'STABILIZER').length > 1;
  
  let score = 1; // Start at 1 (minimum for visible ingredients)
  
  // Base score from additive count
  score += Math.min(additiveCount * 2, 6);
  
  // Additional penalties
  if (hasArtificialSweeteners) score += 2;
  if (hasMultipleStabilizers) score += 1;
  
  // Cap at 10
  score = Math.min(score, 10);
  
  // Determine level
  let level: ProcessingLevelEnum;
  if (score >= 8) level = "HIGH";
  else if (score >= 6) level = "MODERATE";
  else if (score >= 4) level = "LOW";
  else level = "MINIMAL";
  
  return { score, level };
}
```

### Confidence Score Factors
```typescript
function calculateConfidence(factors: {
  labelClarity: number;      // 0-100
  textRecognition: number;   // 0-100
  productImageQuality: number; // 0-100
  completenessOfData: number; // 0-100
}): number {
  // Weighted average
  return Math.round(
    factors.labelClarity * 0.3 +
    factors.textRecognition * 0.3 +
    factors.productImageQuality * 0.2 +
    factors.completenessOfData * 0.2
  );
}
```

## Response Examples

### Example 1: Complete Response (with ingredients visible)
```json
{
  "productInfo": { "name": "Organic Whole Milk" },
  "servingInfo": { "servingSize": 240, "servingUnit": "ml", "servingsPerContainer": 4.2, "hasMultipleServings": true },
  "nutritionPerServing": { 
    "calories": { "value": 150, "isFromLabel": true, "healthRating": "GOOD" },
    "protein": { "value": 8, "isFromLabel": true, "healthRating": "EXCELLENT" }
  },
  "ingredients": [
    { "name": "Organic Milk", "category": "NATURAL", "isHighlighted": false },
    { "name": "Vitamin D3", "category": "VITAMIN", "isHighlighted": false }
  ],
  "allergens": ["DAIRY"],
  "processingLevel": { "score": 2, "level": "MINIMAL" },
  "analysis": { "confidenceScore": 95 }
}
```

### Example 2: Nutrition-Only Response (no ingredients visible)
```json
{
  "productInfo": { "name": "Energy Bar" },
  "servingInfo": { "servingSize": 40, "servingUnit": "g", "servingsPerContainer": 1, "hasMultipleServings": false },
  "nutritionPerServing": { 
    "calories": { "value": 200, "isFromLabel": true, "healthRating": "GOOD" },
    "protein": { "value": 12, "isFromLabel": true, "healthRating": "EXCELLENT" }
  },
  "analysis": { "confidenceScore": 88 }
}
```

## Notes for Gemini API Implementation

1. **Conditional Content Detection**: Only include `ingredients`, `allergens`, and `processingLevel` if ingredients list is clearly visible on the label
2. **Structured Output**: Use Gemini's structured generation to ensure response matches this schema exactly
3. **Image Storage**: Product images are handled by Firebase Storage (similar to meal analysis), not by AI
4. **Fallback Values**: When nutrition info can't be extracted from label, set `isFromLabel: false` and provide estimated values
5. **Ingredient Parsing**: When visible, parse ingredients list carefully to categorize and identify E-numbers
6. **Allergen Detection**: Return enum values only (e.g., "DAIRY", "SOY") - emojis will be added by UI
7. **Health Rating Assessment**: Provide health ratings based on serving size amounts per standard nutritional guidelines
8. **Single vs Multiple Servings**: Analyze if product is single-serve (like Pepsi can) vs multi-serve (like milk carton)
9. **Processing Level Calculation**: Only calculate if ingredients are visible; score 0 means no ingredients data available
10. **Error Handling**: If critical data missing, return appropriate error response rather than incomplete data

## UI Implementation Notes

1. **Portion Control**: Only show edit button when `hasMultipleServings == true`
2. **Nutrition Display**: Show "--" for nutrients where `isFromLabel == false`
3. **Health Circles**: Use `healthRating` enum to determine circle color (green/light green/orange/red)
4. **Allergen Icons**: Map enum values to emojis in UI (DAIRY → 🥛, WHEAT → 🌾, etc.)
5. **Firebase Storage**: Use same upload pattern as meal analysis for product images