import { z } from 'zod';

// Validation schemas using Zod - Updated to match Flutter DTOs exactly
export const InitialItineraryRequestSchema = z.object({
    destination: z.string().min(1, 'Destination is required'),
    check_in_date: z.string().min(1, 'Check-in date is required'),
    check_out_date: z.string().min(1, 'Check-out date is required'),
    number_of_days: z.number().min(1, 'Number of days must be at least 1'),
    planning_mode: z.string().min(1, 'Planning mode is required'), // Required in Flutter
    additional_notes: z.string().optional().nullable(),
    language: z.string().min(1, 'Language is required'), // Required in Flutter
    schema_version: z.number().optional().nullable(),
    preferred_currency: z.string().optional().nullable(), // NEW FIELD: User's preferred currency for pricing
});

export const AdvancedItineraryRequestSchema = z.object({
    destination: z.string().min(1, 'Destination is required'),
    check_in_date: z.string().min(1, 'Check-in date is required'),
    check_out_date: z.string().min(1, 'Check-out date is required'),
    number_of_days: z.number().min(1, 'Number of days must be at least 1'),
    planning_mode: z.string().min(1, 'Planning mode is required'), // Required in Flutter
    additional_notes: z.string().optional().nullable(),
    language: z.string().min(1, 'Language is required'), // Required in Flutter
    schema_version: z.number().optional().nullable(),
    preferred_currency: z.string().optional().nullable(), // NEW FIELD: User's preferred currency for pricing
    questionnaire_answers: z.object({
        travel_companion: z.string().optional().nullable(),
        group_size: z.number().optional().nullable(), // NEW FIELD: Number of people when traveling with friends/family
        schedule_preference: z.object({ // NEW FIELD: Travel schedule preference object
            type: z.string(),
            name: z.string(),
            description: z.string(),
            time_range: z.string(), // matches @JsonKey(name: 'time_range')
        }).optional().nullable(),
        budget_preference: z.object({
            level: z.string(),
            description: z.string(),
        }).optional().nullable(),
        meal_preferences: z.array(z.string()).optional().nullable(), // Make optional
        dietary_preferences: z.array(z.object({
            type: z.string(),
            name: z.string(),
            description: z.string(),
        })).optional().nullable(), // NEW FIELD
        travel_interests: z.array(z.object({
            type: z.string(),
            name: z.string(),
            description: z.string(),
        })).optional().nullable(), // Make optional
        additional_details: z.string().optional().nullable(),
    }),
});

export const ShuffleActivitiesRequestSchema = z.object({
    destination: z.string().min(1, 'Destination is required'),
    check_in_date: z.string().min(1, 'Check-in date is required'), // Flutter sends this
    check_out_date: z.string().min(1, 'Check-out date is required'), // Flutter sends this
    number_of_days: z.number().min(1, 'Number of days must be at least 1'),
    planning_mode: z.string().min(1, 'Planning mode is required'), // Flutter sends this
    additional_notes: z.string().optional().nullable(), // Flutter sends this
    language: z.string().min(1, 'Language is required'), // Required in Flutter
    schema_version: z.number().optional().nullable(),
    preferred_currency: z.string().optional().nullable(), // NEW FIELD: User's preferred currency for pricing
    existing_activities: z.array(z.object({
        id: z.string(),
        name: z.string(),
        category: z.string(), // Flutter includes category
        time_slot: z.string(),
        day_number: z.number(),
        is_locked: z.boolean(),
    })),
    activities_to_replace: z.array(z.string()).min(1, 'At least one activity to replace is required'),
    locked_activity_ids: z.array(z.string()), // Flutter uses locked_activity_ids, not locked_activities
});

export const EditActivityRequestSchema = z.object({
    destination: z.string().min(1, 'Destination is required'),
    check_in_date: z.string().min(1, 'Check-in date is required'), // Flutter sends this
    check_out_date: z.string().min(1, 'Check-out date is required'), // Flutter sends this
    number_of_days: z.number().min(1, 'Number of days must be at least 1'), // Flutter sends this
    planning_mode: z.string().min(1, 'Planning mode is required'), // Flutter sends this
    additional_notes: z.string().optional().nullable(), // Flutter sends this
    language: z.string().min(1, 'Language is required'), // Required in Flutter
    schema_version: z.number().optional().nullable(),
    preferred_currency: z.string().optional().nullable(), // NEW FIELD: User's preferred currency for pricing
    current_activity: z.object({
        id: z.string(),
        name: z.string(),
        category: z.string(), // Flutter includes category
        time_slot: z.string(),
        day_number: z.number(), // Flutter includes day_number
        is_locked: z.boolean(), // Flutter includes is_locked
    }),
    user_request: z.string().min(1, 'User request is required'),
    day_context: z.array(z.object({ // Flutter uses day_context, not day_activities
        id: z.string(),
        name: z.string(),
        category: z.string(),
        time_slot: z.string(),
        day_number: z.number(),
        is_locked: z.boolean(),
    })),
    all_activities: z.array(z.object({ // Flutter also sends all_activities
        id: z.string(),
        name: z.string(),
        category: z.string(),
        time_slot: z.string(),
        day_number: z.number(),
        is_locked: z.boolean(),
    })),
});

// Validation functions
export function validateInitialItineraryRequest(data: any) {
    return InitialItineraryRequestSchema.parse(data);
}

export function validateAdvancedItineraryRequest(data: any) {
    return AdvancedItineraryRequestSchema.parse(data);
}

export function validateShuffleActivitiesRequest(data: any) {
    return ShuffleActivitiesRequestSchema.parse(data);
}

export function validateEditActivityRequest(data: any) {
    return EditActivityRequestSchema.parse(data);
} 