# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Kalee Web App, a comprehensive AI-powered food detection and nutrition analysis platform. The project consists of:

1. **Next.js Landing Page**: Frontend interface built with React, TypeScript, and Tailwind CSS (current directory)
2. **Firebase Cloud Functions**: Backend AI services for food analysis (located in `../functions/`)
3. **Flaia Functions**: Travel itinerary generation services (located in `../flaia_functions/`)

## Development Commands

### Main Web Application (Landing Page)
```bash
# Development server with Turbopack
npm run dev

# Build production version
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Firebase Cloud Functions (`../functions/`)
```bash
cd ../functions

# Build TypeScript functions
npm run build

# Build and watch for changes
npm run build:watch

# Start local Firebase emulators
npm run serve

# Deploy functions to Firebase
npm run deploy

# View function logs
npm run logs

# Start Firebase Functions shell
npm run shell
```

### Flaia Functions (`../flaia_functions/`)
```bash
cd ../flaia_functions

# Build TypeScript functions
npm run build

# Build and watch for changes
npm run build:watch

# Start local Firebase emulators
npm run serve

# Deploy functions to Firebase
npm run deploy

# View function logs
npm run logs

# Start Firebase Functions shell
npm run shell
```

## Architecture

### Web Application Structure
- **Framework**: Next.js 15.4.6 with App Router
- **Styling**: Tailwind CSS v4 with PostCSS
- **TypeScript**: Strict type checking enabled
- **Fonts**: Geist Sans and Geist Mono from Vercel
- **Development**: Turbopack for faster development builds

### Firebase Functions Architecture
The project has two separate Firebase Functions modules:

#### Food Analysis Functions (`../functions/`)
- **Runtime**: Node.js 22
- **AI Integration**: Google Gemini AI via `@google/genai` package
- **Functions Framework**: Firebase Functions v2 with callable functions
- **Core Functions**:
  1. **analyzeFoodImageFunction**: Visual food recognition from images
  2. **analyzeNutritionFunction**: Detailed nutrition analysis
  3. **saveMealEntryFunction**: Save meal entries to user database

#### Travel Itinerary Functions (`../flaia_functions/`)
- **Runtime**: Node.js 22
- **AI Integration**: Google Gemini AI via `@google/genai` package
- **Functions Framework**: Firebase Functions v2 with callable functions
- **Region**: europe-west1 for optimal performance
- **Core Functions**:
  1. **generateInitialItineraryFunction**: Creates basic travel itineraries (5 min timeout, 1GiB memory)
  2. **generateAdvancedItineraryFunction**: Enhanced itinerary generation (5 min timeout, 1GiB memory)
  3. **shuffleActivitiesFunction**: Reorganizes activity lists (3 min timeout, 512MiB memory)
  4. **editActivityFunction**: Modifies individual activities (2 min timeout, 512MiB memory)
  5. **getTripDetailsFunction**: Retrieves trip information (1 min timeout, 256MiB memory)

## Key Technical Features

### AI Food Detection Flow
The food analysis system implements a sophisticated two-phase AI analysis:

#### Phase 1: Visual Food Recognition
- Image capture via camera or gallery selection
- AI identifies ingredients and estimates quantities
- User review and correction interface
- Meal categorization (breakfast, lunch, dinner, snack)

#### Phase 2: Detailed Nutrition Analysis
- Enhanced AI analysis using corrected ingredient data
- Comprehensive macro and micronutrient breakdown
- Dietary flag detection (gluten-free, dairy-free, etc.)
- Portion size validation and optimization

### Structured Output System
- **100% Valid JSON Guarantee**: Uses Gemini API structured output with schema enforcement
- **Schema Versioning**: Supports V1 and V2 response schemas for backward compatibility
- **Prompt Versioning**: Enhanced AI prompts that evolve with frontend capabilities
- **Error Prevention**: Three-layer protection (schema enforcement, JSON parsing, basic validation)

## Configuration Files

### TypeScript Configuration
- **Main**: `tsconfig.json` - Next.js TypeScript configuration with strict mode
- **Functions**: `../functions/tsconfig.json` - Firebase Functions TypeScript config
- **Flaia Functions**: `../flaia_functions/tsconfig.json` - Travel functions TypeScript config

### Firebase Configuration
- Functions use secrets management for API keys (`GEMINI_API_KEY`)
- Regional deployment to europe-west1
- Memory and timeout optimization per function type
- Firebase project configuration in `../firebase.json`

## Development Guidelines

### Code Style
- TypeScript strict mode enabled across all modules
- Tailwind CSS for consistent styling in web app
- React 19 with modern hooks and patterns
- Firebase Functions v2 syntax for all cloud functions

### Multi-Function Architecture
When working with this codebase, note that there are two separate Firebase Functions modules:
- `../functions/` - Food analysis and nutrition tracking
- `../flaia_functions/` - Travel itinerary generation

Each has its own package.json, build process, and deployment configuration.

### Testing Strategy
- Unit tests for schema validation
- Integration tests for AI function calls
- Response structure validation
- Error handling verification

## Deployment

### Web Application
Deploy to Vercel or similar Next.js-compatible platform:
```bash
npm run build
# Deploy build output
```

### Firebase Functions
```bash
# Deploy food analysis functions
cd ../functions
npm run deploy

# Deploy travel functions
cd ../flaia_functions
npm run deploy
```

### Environment Variables
- `GEMINI_API_KEY`: Required for AI functions (set as Firebase secret)
- Configure Firebase project settings in console

## Documentation

### Important Documentation Files
- `AI_FOOD_DETECTION_FLOW.md`: Comprehensive product specification for food detection system
- `AI_FOOD_DETECTION_IMPLEMENTATION_GUIDE.md`: Technical implementation guidance
- `KALEE_CLOUD_FUNCTIONS_API.md`: Complete API documentation with examples
- `../functions/LOGGING_GUIDE.md`: Logging guidelines for food functions
- `../flaia_functions/SCHEMA_VERSIONING_README.md`: Schema versioning documentation
- `../flaia_functions/STRUCTURED_OUTPUT_README.md`: Structured output implementation

## Monitoring

### Analytics Integration
- User behavior tracking (meal logging patterns, AI accuracy)
- Performance metrics (function execution times, error rates)
- AI model improvement data (confidence scores, user corrections)

### Error Handling
- Comprehensive error logging for AI functions
- Network connectivity fallbacks
- Image quality validation
- Graceful degradation to manual entry modes