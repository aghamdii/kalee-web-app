# Kalee AI Food Detection Cloud Functions

This directory contains Firebase Cloud Functions that provide AI-powered food detection and nutrition analysis capabilities for the Kalee web application.

## Overview

The system implements a two-phase AI analysis workflow:

1. **Phase 1: Food Image Analysis** (`analyzeFoodImageFunction`)
   - Analyzes food images using Google Gemini 2.0 Flash Exp (vision model)
   - Identifies meal names and ingredient lists with quantities
   - Returns structured JSON with ingredient breakdown
   - Supports 15+ languages and metric/imperial units

2. **Phase 2: Nutrition Analysis** (`analyzeNutritionFunction`) 
   - Calculates precise nutritional information using Google Gemini 2.5 Flash
   - Provides 4 essential macros: calories, protein, carbohydrates, fat
   - Uses Phase 1 results and user corrections for accurate calculations
   - Returns detailed per-ingredient nutrition breakdown

## Architecture

### Function Configuration
- **Region**: europe-west1
- **Memory**: 1GiB (for AI processing)
- **Timeout**: 90s (Phase 1), 120s (Phase 2)
- **Authentication**: Required (Firebase Auth)

### Key Components

```
functions/src/
├── food/
│   ├── analyzeFoodImage.ts    # Phase 1: Image analysis
│   └── analyzeNutrition.ts    # Phase 2: Nutrition calculation
├── shared/
│   ├── aiConfig.ts           # AI model configuration
│   ├── schemas.ts            # Structured output schemas
│   ├── prompts.ts            # Multi-language prompts
│   └── utils.ts              # Utilities and validation
└── index.ts                  # Function exports
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Set Up Google AI API Key

```bash
# Set the secret for Firebase Functions
firebase functions:secrets:set GEMINI_API_KEY
# Enter your Google AI Studio API key when prompted
```

### 3. Build Functions

```bash
npm run build
```

### 4. Deploy Functions

```bash
npm run deploy
```

## API Reference

### analyzeFoodImageFunction

Analyzes food images and identifies ingredients.

**Input:**
```typescript
{
  imagePath: string;        // Firebase Storage path to image
  language?: string;        // Language code (default: 'en')
  unitSystem?: string;      // 'metric' | 'imperial' (default: 'metric')
}
```

**Output:**
```typescript
{
  sessionId: string;        // Unique session identifier
  mealName: string;         // Identified meal name
  confidence: number;       // Overall confidence (0-1)
  ingredients: Array<{
    name: string;           // Ingredient name in specified language
    quantity: number;       // Estimated quantity
    unit: string;          // Unit of measurement
    confidence: number;     // Ingredient confidence (0-1)
    category: string;      // Food category
  }>;
  suggestedMealType: string; // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  language: string;         // Language used for response
}
```

### analyzeNutritionFunction

Calculates detailed nutrition information for identified ingredients.

**Input:**
```typescript
{
  sessionId: string;        // From Phase 1 analysis
  mealName: string;         // Meal name (can be modified by user)
  ingredients: Array<{      // Ingredients (can be modified by user)
    name: string;
    quantity: number;
    unit: string;
  }>;
  additionalInfo?: string;  // Optional cooking/preparation details
  dietaryRestrictions?: string[]; // Optional dietary restrictions
  language?: string;        // Language code (default: 'en')
}
```

**Output:**
```typescript
{
  sessionId: string;        // Session identifier
  nutrition: {
    calories: number;       // Total calories (kcal)
    protein: number;        // Total protein (g)
    carbohydrates: number;  // Total carbs (g)
    fat: number;           // Total fat (g)
  };
  confidence: number;       // Nutrition confidence (0-1)
  portionAccuracy: number;  // Portion estimation confidence (0-1)
  calculationMethod: string; // Brief explanation of calculation
  ingredientBreakdown: Array<{ // Per-ingredient nutrition
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  }>;
  language: string;         // Language used for response
}
```

## Supported Languages

- English (en)
- Arabic (ar)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Japanese (ja)
- Korean (ko)
- Chinese (zh)
- Hindi (hi)
- Turkish (tr)
- Dutch (nl)
- Swedish (sv)

## Error Handling

The functions return structured error responses:

```typescript
{
  error: {
    code: string;           // Error code for client handling
    message: string;        // Localized error message
    details?: string;       // Additional error details
  };
  sessionId?: string;       // Session ID if available
  language: string;         // Language for error messages
}
```

### Common Error Codes

- `image_analysis_failed`: AI couldn't analyze the image
- `nutrition_calculation_failed`: AI couldn't calculate nutrition
- `invalid_session`: Session not found or expired
- `image_quality_poor`: Image quality too poor for analysis

## Data Storage

### Session Management

Analysis sessions are stored in Firestore (`aiSessions` collection):

```typescript
{
  userId: string;           // User ID from Firebase Auth
  phase: number;           // Current phase (1 or 2)
  imagePath: string;       // Original image path
  language: string;        // User's language preference
  unitSystem: string;      // User's unit system
  phase1Results: object;   // Results from Phase 1
  phase2Results?: object;  // Results from Phase 2
  completed: boolean;      // Whether analysis is complete
  createdAt: Timestamp;    // Creation timestamp
  updatedAt: Timestamp;    // Last update timestamp
}
```

### Image Storage

Images are stored in Firebase Storage. The functions expect images to be uploaded to Storage first, then the storage path is passed to the Cloud Functions.

## Performance & Monitoring

### Logging

All functions include comprehensive logging:
- Function start/end times
- Performance metrics
- Error details
- User actions

### Session Cleanup

Old analysis sessions (older than 7 days) can be cleaned up using:

```typescript
await FoodUtils.cleanupOldSessions(7);
```

## Development Commands

```bash
# Build TypeScript
npm run build

# Watch for changes
npm run build:watch

# Run local emulators
npm run serve

# Deploy functions
npm run deploy

# View logs
npm run logs

# Start functions shell
npm run shell
```

## Security

- All functions require Firebase Authentication
- Input validation on all parameters
- Session ownership verification
- No sensitive data logging
- Structured error responses without internal details

## Future Enhancements

Planned improvements:
- Batch image processing
- Recipe recognition
- Brand/packaged food detection
- Meal planning integration
- Enhanced portion size estimation
- Custom food database integration