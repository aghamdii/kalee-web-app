# Schema & Prompt Versioning System

This document explains how the schema and prompt versioning system works in the Firebase Functions backend, enabling backward compatibility with different versions of the Flutter app.

## Overview

The versioning system allows different versions of the Flutter app to receive different response structures AND use different prompts from the AI functions without breaking existing implementations. This dual versioning approach provides:

1. **Schema Versioning**: Different response structures for different app versions
2. **Prompt Versioning**: Enhanced AI prompts that can utilize new frontend data fields

## How It Works

### 1. Request Schema Version
All AI function requests can include an optional `schema_version` field:

```typescript
{
  "destination": "Paris",
  "number_of_days": 3,
  "language": "English",
  "schema_version": 2  // Optional: defaults to 1 for backward compatibility
}
```

### 2. Automatic Version Selection
The system automatically selects both the appropriate response schema AND prompt version:

```typescript
// Schema Selection
const responseSchema = getItineraryResponseSchema(schemaVersion);

// Prompt Selection  
const prompt = PromptBuilder.buildQuickItineraryPrompt(validatedData, language, schemaVersion);
```

### 3. Dual Application
Both schema and prompt versions are applied simultaneously:

```typescript
const schemaVersion = validatedData.schema_version || 1;  // Default to V1

// V2 gets enhanced prompts + simplified schema
// V1 gets original prompts + full schema
```

## Schema Differences

### V1 vs V2 Comparison

| Feature | Schema V1 | Schema V2 |
|---------|-----------|-----------|
| Summary | ✅ Included | ❌ Removed |
| Weather | ✅ Full (4 fields) | ✅ Simplified (3 fields) |
| Day Themes | ✅ Included | ❌ Removed |
| Cost Breakdown | ✅ Included | ❌ Removed |
| Activity Details | ✅ Full (location, booking, image) | ✅ Simplified (core fields only) |

## Prompt Differences

### V1 vs V2 Prompt Comparison

| Feature | Prompt V1 | Prompt V2 |
|---------|-----------|-----------|
| Base Instructions | ✅ Core travel AI rules | ✅ Enhanced with V2 optimizations |
| Activity Selection | ✅ Standard algorithms | ✅ Enhanced clustering & variety |
| Budget Handling | ✅ Basic budget matching | ✅ Advanced budget optimization |
| Personalization | ✅ Standard preferences | ✅ Enhanced behavior patterns |
| Geographic Logic | ✅ Basic clustering | ✅ Advanced proximity algorithms |

### Prompt V1 (Standard)
```
TASK: Create balanced itinerary with minimal user input.

DEFAULTS for quick mode:
- Include breakfast (7-10 AM) and late lunch (2-4 PM) only
- Mix of must-see attractions and local experiences  
- Moderate budget level (150-400 local currency meals)
```

### Prompt V2 (Enhanced)
```
TASK: Create balanced itinerary with minimal user input (Enhanced V2).

ENHANCED V2 FEATURES:
- Better integration with new frontend data fields
- Enhanced personalization based on user behavior
- Improved activity clustering and timing optimization

DEFAULTS for quick mode:
- Include breakfast (7-10 AM) and late lunch (2-4 PM) only
- Mix of must-see attractions and local experiences  
- Moderate budget level (150-400 local currency meals)
```

## Functions Supporting Versioning

| Function | Schema Versioning | Prompt Versioning | Default Version |
|----------|------------------|-------------------|-----------------|
| `generateInitialItinerary` | ✅ Yes | ✅ Yes | V1 |
| `generateAdvancedItinerary` | ✅ Yes | ✅ Yes | V1 |
| `shuffleActivities` | ✅ Yes | ✅ Yes | V1 |
| `editActivity` | ✅ Yes | ✅ Yes | V1 |
| `getTripDetails` | ❌ No versioning needed | ❌ No versioning needed | N/A |

## Usage Examples

### Flutter App Implementation

```dart
// For newer app versions (V2) - Enhanced prompts + simplified schema
final request = {
  'destination': 'Tokyo',
  'number_of_days': 5,
  'language': 'English',
  'schema_version': 2,  // Gets enhanced prompts + simplified response
  'new_frontend_data': {  // V2 prompts can utilize this new data
    'user_behavior_patterns': ['morning_person', 'food_explorer'],
    'advanced_preferences': {...}
  }
};

// For older app versions (V1) - Original prompts + full schema
final request = {
  'destination': 'Tokyo',
  'number_of_days': 5,
  'language': 'English',
  // schema_version omitted = defaults to V1 prompts + V1 schema
};
```

### Response Includes Version Info
```json
{
  "success": true,
  "data": { /* itinerary data matching schema version */ },
  "metadata": {
    "model": "gemini-2.5-flash",
    "language": "English",
    "schema_version": 2,  // Shows which version was used
    "generated_at": "2025-01-09T...",
    "user_id": "user123"
  }
}
```

## Adding New Versions

### Step 1: Define New Schema & Prompts
```typescript
// In schemas.ts
export const ItineraryResponseSchemaV3 = { /* new schema */ };

// In promptTemplates.ts  
static readonly QUICK_ITINERARY_PROMPT_V3 = `
  ${PromptTemplates.CORE_SYSTEM_PROMPT}
  
  TASK: Create itinerary with V3 enhancements.
  
  V3 FEATURES:
  - AI-powered activity recommendations
  - Real-time optimization
  - Advanced user profiling
`;
```

### Step 2: Update Selection Functions
```typescript
// Schema selector
export function getItineraryResponseSchema(version?: number | null) {
    switch (version) {
        case 3: return ItineraryResponseSchemaV3;  // Add V3
        case 2: return ItineraryResponseSchemaV2;
        case 1:
        default: return ItineraryResponseSchemaV1;
    }
}

// Prompt selector
static getQuickItineraryPromptVersioned(language: string, version?: number | null): string {
    switch (version) {
        case 3: return PromptTemplates.injectLanguage(PromptTemplates.QUICK_ITINERARY_PROMPT_V3, language);
        case 2: return PromptTemplates.injectLanguage(PromptTemplates.QUICK_ITINERARY_PROMPT_V2, language);
        case 1:
        default: return PromptTemplates.injectLanguage(PromptTemplates.QUICK_ITINERARY_PROMPT, language);
    }
}
```

### Step 3: Test All Versions
Ensure backward compatibility for all existing versions.

## Enhanced V2 Features Ready for Implementation

The V2 prompt system is ready to handle new frontend data such as:

### New Frontend Data Support
- **User Behavior Patterns**: Morning person, night owl, food explorer
- **Advanced Preferences**: Detailed activity preferences, timing preferences  
- **Budget Optimization**: More granular budget controls
- **Geographic Intelligence**: Better location clustering

### Prompt Enhancements in V2
- **Better Context Awareness**: Enhanced understanding of user intent
- **Improved Variety Scoring**: Advanced algorithms for activity uniqueness
- **Enhanced Personalization**: Better matching with user patterns
- **Optimized Geography**: Smarter activity clustering and routing

## Monitoring & Debugging

### Log Messages
Each function logs both schema and prompt versions:
```
[user123] [initial_search] Using schema version: 2
[user123] [advanced_search] Using schema version: 1  
[user123] [shuffle] Using schema version: 2
[user123] [edit_activity] Using schema version: 1
```

### Version Usage Tracking
All requests are logged with version info for analytics:
- Schema version distribution
- Prompt version performance
- Migration progress monitoring

## Benefits Achieved

✅ **Dual Versioning**: Both response structure AND AI prompt intelligence can evolve  
✅ **Zero Downtime**: All existing functionality preserved  
✅ **Enhanced AI**: V2 prompts ready for advanced frontend features  
✅ **Future-Proof**: Easy to add V3, V4 with new capabilities  
✅ **Gradual Migration**: Users update at their own pace  
✅ **Full Monitoring**: Complete visibility into version usage  

## Migration Strategy

### For Schema Changes
1. Create new schema version for structural changes
2. Test backward compatibility thoroughly
3. Release with both versions supported

### For Prompt Enhancements  
1. Create enhanced prompts for new frontend capabilities
2. Test AI output quality improvements
3. Roll out gradually with version-specific features

### For Frontend Integration
1. New frontend features use `schema_version: 2`
2. Enhanced prompts automatically utilize new data fields
3. Old app versions continue working with V1 system
4. Monitor performance and adoption metrics 