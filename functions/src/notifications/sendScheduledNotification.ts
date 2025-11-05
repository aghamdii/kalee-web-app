import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { FoodUtils } from '../shared/utils';
import { getNotificationMessage, validateLanguage, type NotificationDay } from './messages';

const db = admin.firestore();
const messaging = admin.messaging();

interface NotificationPayload {
    userId: string;
    language: string;
    day: NotificationDay;
}

export const sendScheduledNotification = onRequest(
    {
        region: 'europe-west1',
        timeoutSeconds: 60,
        memory: '256MiB',
    },
    async (req, res) => {
        const timer = FoodUtils.createTimer();

        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        const payload = req.body as NotificationPayload;
        const { userId, language, day } = payload;

        logger.info(`[${userId}] Processing scheduled ${day} notification`);

        try {
            const userDoc = await db.collection('users').doc(userId).get();

            if (!userDoc.exists) {
                logger.warn(`[${userId}] User no longer exists - skipping notification`);
                res.status(200).send('User not found - skipped');
                return;
            }

            const userData = userDoc.data();

            if (!userData?.notificationsEnabled) {
                logger.info(`[${userId}] Notifications now disabled - skipping`);
                res.status(200).send('Notifications disabled - skipped');
                return;
            }

            if (!userData?.fcmToken) {
                logger.warn(`[${userId}] No FCM token available - skipping notification`);
                res.status(200).send('No FCM token - skipped');
                return;
            }

            const currentFcmToken = userData.fcmToken;
            const validLanguage = validateLanguage(language);
            const notificationMessage = getNotificationMessage(day, validLanguage);

            const message: admin.messaging.Message = {
                notification: {
                    title: notificationMessage.title,
                    body: notificationMessage.body,
                },
                data: {
                    type: `${day}_onboarding`,
                    userId: userId,
                },
                token: currentFcmToken,
                android: {
                    priority: 'high',
                    notification: {
                        icon: 'notification_icon',
                        color: '#FF6B35',
                        sound: 'default',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            };

            const response = await messaging.send(message);

            const duration = timer.end();

            logger.info(`[${userId}] Successfully sent ${day} notification`, {
                messageId: response,
                language: validLanguage,
                duration: `${duration}ms`
            });

            await db.collection('notificationLogs').add({
                userId,
                type: `${day}_onboarding`,
                title: notificationMessage.title,
                body: notificationMessage.body,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                date: new Date().toISOString().split('T')[0],
                language: validLanguage,
                success: true,
                messageId: response,
                processingTime: duration
            });

            res.status(200).send({ success: true, messageId: response });
        } catch (error: any) {
            const duration = timer.end();
            logger.error(`[${userId}] Failed to send ${day} notification:`, {
                error: error.message,
                duration: `${duration}ms`
            });

            await db.collection('notificationLogs').add({
                userId,
                type: `${day}_onboarding`,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                date: new Date().toISOString().split('T')[0],
                success: false,
                error: error.message,
                processingTime: duration
            });

            res.status(500).send({ success: false, error: error.message });
        }
    }
);
