import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { CloudTasksClient } from '@google-cloud/tasks';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import { FoodUtils } from '../shared/utils';
import { NotificationType } from './messages';

const tasksClient = new CloudTasksClient();
const db = admin.firestore();

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'kalee-prod';
const LOCATION = 'europe-west1';
const QUEUE_NAME = 'onboarding-notifications';
const TRIAL_REMINDER_HOURS = 36; // 1.5 days after signup (reminder for tomorrow)

interface UserData {
    notificationsEnabled?: boolean;
    fcmToken?: string;
    languageSelected?: string;
    email?: string;
    displayName?: string;
    createdAt?: number;
}

export const scheduleOnboardingNotifications = onDocumentCreated(
    {
        document: 'profiles/{profileId}',
        region: 'europe-west1',
    },
    async (event) => {
        const timer = FoodUtils.createTimer();
        const profileId = event.params.profileId;

        logger.info(`[${profileId}] New profile created, fetching user data for notification eligibility`);

        // Fetch user data from users collection using the same ID
        let userData: UserData | undefined;
        try {
            const userDoc = await db.collection('users').doc(profileId).get();
            if (!userDoc.exists) {
                logger.warn(`[${profileId}] User document not found - skipping scheduling`);
                return;
            }
            userData = userDoc.data() as UserData;
        } catch (error) {
            logger.error(`[${profileId}] Failed to fetch user document:`, error);
            return;
        }

        if (!userData.notificationsEnabled) {
            logger.info(`[${profileId}] Notifications disabled - skipping scheduling`);
            return;
        }

        const language = userData.languageSelected || 'en';

        logger.info(`[${profileId}] Scheduling trial reminder notification`, {
            language,
            email: userData.email,
            hasFcmToken: !!userData.fcmToken
        });

        try {
            await scheduleNotificationTask(profileId, language, 'trial_reminder', TRIAL_REMINDER_HOURS);

            const duration = timer.end();
            logger.info(`[${profileId}] Successfully scheduled trial reminder notification`, {
                duration: `${duration}ms`
            });
        } catch (error) {
            const duration = timer.end();
            logger.error(`[${profileId}] Failed to schedule notification:`, {
                error,
                duration: `${duration}ms`
            });
        }
    }
);

async function scheduleNotificationTask(
    userId: string,
    language: string,
    type: NotificationType,
    hoursDelay: number
): Promise<void> {
    const parent = tasksClient.queuePath(PROJECT_ID, LOCATION, QUEUE_NAME);

    const scheduleTime = new Date();
    scheduleTime.setHours(scheduleTime.getHours() + hoursDelay);

    const functionUrl = `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/sendScheduledNotification`;

    const task = {
        httpRequest: {
            httpMethod: 'POST' as const,
            url: functionUrl,
            headers: {
                'Content-Type': 'application/json',
            },
            body: Buffer.from(
                JSON.stringify({
                    userId,
                    language,
                    type,
                })
            ).toString('base64'),
            oidcToken: {
                serviceAccountEmail: `${process.env.GCLOUD_PROJECT_NUMBER || '735916985913'}-compute@developer.gserviceaccount.com`,
                audience: functionUrl,
            },
        },
        scheduleTime: {
            seconds: Math.floor(scheduleTime.getTime() / 1000),
        },
    };

    try {
        const [response] = await tasksClient.createTask({ parent, task });
        logger.info(`[${userId}] Scheduled ${type} notification`, {
            taskName: response.name,
            scheduleTime: scheduleTime.toISOString(),
        });
    } catch (error) {
        logger.error(`[${userId}] Failed to create task for ${type}:`, error);
        throw error;
    }
}
