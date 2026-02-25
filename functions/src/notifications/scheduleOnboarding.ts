import { onCall, HttpsError } from 'firebase-functions/v2/https';
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

interface ScheduleNotificationRequest {
    userId: string;
    type: NotificationType;
    delayHours: number;
}

export const scheduleOnboardingNotifications = onCall(
    {
        region: 'europe-west1',
        timeoutSeconds: 60,
        memory: '256MiB',
    },
    async (request) => {
        const timer = FoodUtils.createTimer();
        const { userId, type, delayHours } = request.data as ScheduleNotificationRequest;

        if (!userId || !type || !delayHours) {
            throw new HttpsError('invalid-argument', 'Missing required fields: userId, type, delayHours');
        }

        logger.info(`[${userId}] Scheduling ${type} notification with ${delayHours}h delay`);

        let userData;
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                logger.warn(`[${userId}] User document not found - skipping scheduling`);
                return { success: false, reason: 'user_not_found' };
            }
            userData = userDoc.data();
        } catch (error) {
            logger.error(`[${userId}] Failed to fetch user document:`, error);
            throw new HttpsError('internal', 'Failed to fetch user document');
        }

        if (!userData?.notificationsEnabled) {
            logger.info(`[${userId}] Notifications disabled - skipping scheduling`);
            return { success: false, reason: 'notifications_disabled' };
        }

        if (!userData?.fcmToken) {
            logger.info(`[${userId}] No FCM token - skipping scheduling`);
            return { success: false, reason: 'no_fcm_token' };
        }

        const language = userData.languageSelected || 'en';

        try {
            await scheduleNotificationTask(userId, language, type, delayHours);

            const duration = timer.end();
            logger.info(`[${userId}] Successfully scheduled ${type} notification`, {
                duration: `${duration}ms`,
                delayHours,
            });

            return { success: true, delayHours, language };
        } catch (error) {
            const duration = timer.end();
            logger.error(`[${userId}] Failed to schedule notification:`, {
                error,
                duration: `${duration}ms`,
            });
            throw new HttpsError('internal', 'Failed to schedule notification');
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
