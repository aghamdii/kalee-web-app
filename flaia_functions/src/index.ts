import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { generateInitialItinerary } from './ai/generateInitialItinerary';
import { generateAdvancedItinerary } from './ai/generateAdvancedItinerary';
import { shuffleActivities } from './ai/shuffleActivities';
import { editActivity } from './ai/editActivity';
import { getTripDetails } from './ai/getTripDetails';

// Initialize Firebase Admin SDK
admin.initializeApp();



// Define the secret for all AI functions
const apiKey = defineSecret('GEMINI_API_KEY');
// Export all AI functions with Firebase Functions v2 syntax
export const generateInitialItineraryFunction = onCall({
    region: 'europe-west1',
    timeoutSeconds: 300, // 5 minutes
    memory: '1GiB', // Note: 'GiB' instead of 'GB' in v2
    secrets: [apiKey],

    enforceAppCheck: false,
}, generateInitialItinerary);

export const generateAdvancedItineraryFunction = onCall({
    region: 'europe-west1',
    timeoutSeconds: 300, // 5 minutes
    memory: '1GiB', // Note: 'GiB' instead of 'GB' in v2
    secrets: [apiKey],
    enforceAppCheck: false,
}, generateAdvancedItinerary);

export const shuffleActivitiesFunction = onCall({
    region: 'europe-west1',
    timeoutSeconds: 180, // 3 minutes
    memory: '512MiB', // Note: 'MiB' instead of 'MB' in v2
    secrets: [apiKey],
    enforceAppCheck: false,
}, shuffleActivities);

export const editActivityFunction = onCall({
    region: 'europe-west1',
    timeoutSeconds: 120, // 2 minutes
    memory: '512MiB', // Note: 'MiB' instead of 'MB' in v2
    secrets: [apiKey],
    enforceAppCheck: false,
}, editActivity);


export const getTripDetailsFunction = onCall({
    region: 'europe-west1',
    timeoutSeconds: 60, // 1 minute (should be fast since it's just a Firestore read)
    memory: '256MiB',
    enforceAppCheck: false,
}, getTripDetails);