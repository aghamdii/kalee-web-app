import { PromptTemplates } from './promptTemplates';

export class PromptBuilder {
    // Build quick mode prompt with minimal, focused context - Version Support
    static buildQuickItineraryPrompt(tripData: any, language: string, version?: number | null): string {
        const prompt = PromptTemplates.getQuickItineraryPromptVersioned(language, version, tripData.preferred_currency);
        const context = PromptBuilder.buildMinimalTripContext(tripData);

        return `${prompt}

TRIP DETAILS:
${context}`;
    }

    // Build personalized prompt with user preferences - Version Support
    static buildPersonalizedItineraryPrompt(
        tripData: any,
        preferences: any,
        language: string,
        version?: number | null
    ): string {
        const prompt = PromptTemplates.getPersonalizedItineraryPromptVersioned(language, version, tripData.preferred_currency);
        const tripContext = PromptBuilder.buildMinimalTripContext(tripData);
        const prefContext = PromptBuilder.buildFocusedPreferences(preferences);

        return `${prompt}

TRIP DETAILS:
${tripContext}

USER PREFERENCES:
${prefContext}`;
    }

    // Build shuffle prompt with focused activity context - Version Support
    static buildShufflePrompt(
        tripData: any,
        shuffleData: any,
        language: string,
        version?: number | null
    ): string {
        const prompt = PromptTemplates.getShuffleActivitiesPromptVersioned(language, version, tripData.preferred_currency);
        const context = PromptBuilder.buildShuffleContext(tripData, shuffleData);

        return `${prompt}

${context}`;
    }

    // Build edit prompt with focused activity context - Version Support
    static buildEditPrompt(
        tripData: any,
        editData: any,
        language: string,
        version?: number | null
    ): string {
        const prompt = PromptTemplates.getEditActivityPromptVersioned(language, version, tripData.preferred_currency);
        const context = PromptBuilder.buildEditContext(tripData, editData);

        return `${prompt}

${context}`;
    }

    // Helper methods for building focused context (no verbose formatting)

    private static buildMinimalTripContext(tripData: any): string {
        const additionalNotes = tripData.additional_notes && tripData.additional_notes.trim() !== ''
            ? `Notes: ${tripData.additional_notes}`
            : '';

        return `
Destination: ${tripData.destination}
Dates: ${tripData.check_in_date} to ${tripData.check_out_date} (${tripData.number_of_days} days)
${additionalNotes}`.trim();
    }

    private static buildFocusedPreferences(preferences: any): string {
        const lines: string[] = [];

        if (preferences.travel_companion) {
            lines.push(`Travel Style: ${preferences.travel_companion}`);

            // Add group size context when traveling with friends/family
            if (preferences.group_size && (preferences.travel_companion === 'friends' || preferences.travel_companion === 'family')) {
                lines.push(`Group Size: ${preferences.group_size} people`);
                lines.push(`CRITICAL: All activity suggestions must accommodate ${preferences.group_size} people. Consider group booking requirements and group-friendly venues.`);
            }
        }

        // Add schedule preferences for activity timing - Updated to handle object structure
        if (preferences.schedule_preference) {
            const schedule = preferences.schedule_preference;
            lines.push(`Schedule Preference: ${schedule.name} - ${schedule.description}`);
            lines.push(`Preferred Time Range: ${schedule.time_range}`);
            lines.push(`CRITICAL: Optimize activity timing based on this schedule preference. Adjust start times and activity pacing to match the user's preferred ${schedule.time_range} schedule.`);
        }

        if (preferences.budget_preference) {
            lines.push(`Budget Level: ${preferences.budget_preference.level} - ${preferences.budget_preference.description}`);
            lines.push(`CRITICAL: All activities and dining must match ${preferences.budget_preference.level} standards`);
        }

        if (preferences.meal_preferences && preferences.meal_preferences.length > 0) {
            lines.push(`Required Meals: ${preferences.meal_preferences.join(', ')}`);
        } else {
            lines.push('Meals: None selected - skip all dining activities');
        }
        if (preferences.dietary_preferences && preferences.dietary_preferences.length > 0) {
            lines.push(`Dietary Restrictions: ${preferences.dietary_preferences.map((d: any) => `${d.name} (${d.description})`).join(', ')}`);
            lines.push(`CRITICAL: All restaurant recommendations and food activities must accommodate these dietary restrictions`);
        }



        if (preferences.travel_interests && preferences.travel_interests.length > 0) {
            lines.push(`PRIMARY FOCUS AREAS (70%+ of activities):`);
            preferences.travel_interests.forEach((interest: any, index: number) => {
                lines.push(`${index + 1}. ${interest.name} - ${interest.description}`);
            });
            lines.push(`ENSURE: Maximum variety within each interest category - no repeated activities`);
        }

        if (preferences.additional_details) {
            lines.push(`User Notes: ${preferences.additional_details}`);
            lines.push(`INTEGRATE: User's specific requests throughout the itinerary`);
        }

        return lines.join('\n');
    }

    private static buildShuffleContext(tripData: any, shuffleData: any): string {
        // Handle both old and new field names for backward compatibility
        let activitiesToReplaceNames = shuffleData.activities_to_replace_names || [];
        let lockedActivityNames = shuffleData.locked_activity_names || [];
        let allActivityNames = shuffleData.all_activity_names || [];

        // Fallback to old field names if new ones are empty
        if (activitiesToReplaceNames.length === 0 && shuffleData.activities_to_replace) {
            // Extract names from IDs by looking them up in existing_activities
            activitiesToReplaceNames = shuffleData.activities_to_replace.map((id: string) => {
                const activity = shuffleData.existing_activities?.find((a: any) => a.id === id);
                return activity ? activity.name : id;
            }).filter((name: string) => name);
        }

        if (lockedActivityNames.length === 0 && shuffleData.locked_activity_ids) {
            // Extract names from IDs by looking them up in existing_activities
            lockedActivityNames = shuffleData.locked_activity_ids.map((id: string) => {
                const activity = shuffleData.existing_activities?.find((a: any) => a.id === id);
                return activity ? activity.name : id;
            }).filter((name: string) => name);
        }

        if (allActivityNames.length === 0 && shuffleData.existing_activities) {
            // Extract all activity names from existing activities
            allActivityNames = shuffleData.existing_activities.map((a: any) => a.name).filter((name: string) => name);
        }

        // Create exclusion list (all activities EXCEPT the ones being replaced)
        const exclusionList = allActivityNames.filter((name: string) =>
            !activitiesToReplaceNames.includes(name)
        );

        // Get time slots that need to be filled
        const timeSlotsToFill = PromptBuilder.formatReplacementSlots(
            shuffleData.existing_activities,
            shuffleData.activities_to_replace || []
        );

        return `
TRIP: ${tripData.destination}, ${tripData.number_of_days} days

TASK: Generate ${activitiesToReplaceNames.length} COMPLETELY NEW activities to replace these old ones:
${activitiesToReplaceNames.map((name: string, index: number) => `${index + 1}. ${name}`).join('\n')}

CRITICAL: You must suggest ENTIRELY DIFFERENT activities. Do NOT return any of the activities listed above.

TIME SLOTS TO FILL:
${timeSlotsToFill}

PRESERVE THESE LOCKED ACTIVITIES: ${lockedActivityNames.join(', ')}

NEVER SUGGEST any of these existing activities: ${exclusionList.join(', ')}

CONTEXT - LOCKED ACTIVITIES TO COORDINATE WITH:
${PromptBuilder.formatLockedActivitiesOnly(shuffleData.existing_activities)}`;
    }

    // New helper method to format only the time slots that need replacement
    private static formatReplacementSlots(activities: any[], activitiesToReplace: string[]): string {
        if (!activities || !Array.isArray(activities) || !activitiesToReplace) {
            return 'No replacement slots available';
        }

        const replacementSlots: string[] = [];
        const groupedByDay: { [key: number]: any[] } = {};

        // Find activities that need replacement
        for (const activity of activities) {
            if (activitiesToReplace.includes(activity.id)) {
                const day = activity.day_number;
                if (!groupedByDay[day]) {
                    groupedByDay[day] = [];
                }
                groupedByDay[day].push(activity);
            }
        }

        for (const [day, dayActivities] of Object.entries(groupedByDay)) {
            replacementSlots.push(`Day ${day}:`);
            for (const activity of dayActivities) {
                replacementSlots.push(`  ${activity.time_slot} - [REPLACE: ${activity.name}]`);
            }
        }

        return replacementSlots.join('\n');
    }

    // New helper method to show only locked activities for context
    private static formatLockedActivitiesOnly(activities: any[]): string {
        if (!activities || !Array.isArray(activities)) {
            return 'No locked activities available';
        }

        const lines: string[] = [];
        const groupedByDay: { [key: number]: any[] } = {};

        // Only include locked activities
        for (const activity of activities) {
            if (activity.is_locked) {
                const day = activity.day_number;
                if (!groupedByDay[day]) {
                    groupedByDay[day] = [];
                }
                groupedByDay[day].push(activity);
            }
        }

        for (const [day, dayActivities] of Object.entries(groupedByDay)) {
            lines.push(`Day ${day}:`);
            for (const activity of dayActivities) {
                lines.push(`  ${activity.name} (${activity.time_slot}) [LOCKED]`);
            }
        }

        return lines.length > 0 ? lines.join('\n') : 'No locked activities to coordinate with';
    }

    private static buildEditContext(tripData: any, editData: any): string {
        return `
TRIP: ${tripData.destination}
CURRENT ACTIVITY: ${editData.current_activity.name} (${editData.current_activity.time_slot})
USER REQUEST: ${editData.user_request}

DAY CONTEXT: ${PromptBuilder.formatDayActivities(editData.day_context)}
ALL ACTIVITIES: ${PromptBuilder.formatAllActivities(editData.all_activities)}`;
    }


    private static formatDayActivities(activities: any[]): string {
        if (!activities || !Array.isArray(activities)) {
            return 'No day context available';
        }
        return activities
            .map((a: any) => `${a.name} (${a.time_slot})`)
            .join(', ');
    }

    private static formatAllActivities(activities: any[]): string {
        if (!activities || !Array.isArray(activities)) {
            return 'No activities context available';
        }

        const lines: string[] = [];
        const groupedByDay: { [key: number]: any[] } = {};

        for (const activity of activities) {
            const day = activity.day_number;
            if (!groupedByDay[day]) {
                groupedByDay[day] = [];
            }
            groupedByDay[day].push(activity);
        }

        for (const [day, dayActivities] of Object.entries(groupedByDay)) {
            lines.push(`Day ${day}:`);
            for (const activity of dayActivities) {
                const lock = activity.is_locked ? ' [LOCKED]' : '';
                lines.push(`  ${activity.name} (${activity.time_slot})${lock}`);
            }
        }

        return lines.join('\n');
    }
} 