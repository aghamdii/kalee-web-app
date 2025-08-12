# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Kalee Web App, a comprehensive AI-powered food detection and nutrition analysis platform. The project consists of:

1. **Next.js Web Application**: Frontend interface built with React, TypeScript, and Tailwind CSS
2. **Firebase Cloud Functions**: Backend AI services for travel itinerary generation (located in `flaia_functions/`)
3. **Flutter Mobile Components**: Supporting Dart files for mobile integration (in `ai/` directory)

## Development Commands

### Main Web Application
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

### Firebase Cloud Functions (`flaia_functions/`)
```bash
cd flaia_functions

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
- **Runtime**: Node.js 22
- **AI Integration**: Google Gemini AI via `@google/genai` package
- **Functions Framework**: Firebase Functions v2 with callable functions
- **Region**: europe-west1 for optimal performance
- **Memory**: Configured per function (256MiB to 1GiB)
- **Timeout**: Function-specific timeouts (60s to 300s)

### Core AI Functions
1. **generateInitialItineraryFunction**: Creates basic travel itineraries (5 min timeout, 1GiB memory)
2. **generateAdvancedItineraryFunction**: Enhanced itinerary generation (5 min timeout, 1GiB memory)
3. **shuffleActivitiesFunction**: Reorganizes activity lists (3 min timeout, 512MiB memory)
4. **editActivityFunction**: Modifies individual activities (2 min timeout, 512MiB memory)
5. **getTripDetailsFunction**: Retrieves trip information (1 min timeout, 256MiB memory)

## Key Technical Features

### Structured Output System
- **100% Valid JSON Guarantee**: Uses Gemini API structured output with schema enforcement
- **Schema Versioning**: Supports V1 and V2 response schemas for backward compatibility
- **Prompt Versioning**: Enhanced AI prompts that evolve with frontend capabilities
- **Error Prevention**: Three-layer protection (schema enforcement, JSON parsing, basic validation)

### Data Models (Dart/Flutter Integration)
- **MealEntry**: Complete meal logging with ingredients and nutrition data
- **AIAnalysisSession**: Two-phase AI analysis (visual recognition + nutrition analysis)
- **UserFoodDatabase**: Personalized food items and preferences
- **NutritionData**: Comprehensive nutritional information with confidence scoring

### Firebase Integration
- **Firestore Collections**: users, meals, userFoods, aiSessions
- **Firebase Storage**: Image storage for food photos and meal pictures
- **Authentication**: Firebase Auth integration ready
- **Security**: Configurable App Check enforcement

## AI Food Detection Flow

The application implements a sophisticated two-phase AI analysis system:

### Phase 1: Visual Food Recognition
- Image capture via camera or gallery selection
- AI identifies ingredients and estimates quantities
- User review and correction interface
- Meal categorization (breakfast, lunch, dinner, snack)

### Phase 2: Detailed Nutrition Analysis
- Enhanced AI analysis using corrected ingredient data
- Comprehensive macro and micronutrient breakdown
- Dietary flag detection (gluten-free, dairy-free, etc.)
- Portion size validation and optimization

## Configuration Files

### TypeScript Configuration
- **Main**: `tsconfig.json` - Next.js TypeScript configuration
- **Functions**: `flaia_functions/tsconfig.json` - Firebase Functions TypeScript config

### Firebase Configuration
- Functions use secrets management for API keys (`GEMINI_API_KEY`)
- Regional deployment to europe-west1
- Memory and timeout optimization per function type

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- Tailwind CSS for consistent styling
- React 19 with modern hooks and patterns
- Firebase Functions v2 syntax for all cloud functions

### Testing Strategy
- Unit tests for schema validation
- Integration tests for AI function calls
- Response structure validation
- Error handling verification

### Performance Considerations
- Image compression before AI processing
- Caching for frequent meals and ingredients
- Optimistic UI updates for better user experience
- Background sync capabilities for offline usage

## Deployment

### Web Application
Deploy to Vercel or similar Next.js-compatible platform:
```bash
npm run build
# Deploy build output
```

### Firebase Functions
```bash
cd flaia_functions
npm run deploy
```

### Environment Variables
- `GEMINI_API_KEY`: Required for AI functions (set as Firebase secret)
- Configure Firebase project settings in console

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

## Future Enhancements

### Planned Features
- Real-time meal recommendations
- Social sharing capabilities
- Advanced dietary restriction handling
- Multi-language support expansion
- Enhanced mobile app integration

### AI Improvements
- Multi-dish meal recognition
- Brand recognition for packaged foods
- Cooking method detection
- Nutritional label scanning capabilities