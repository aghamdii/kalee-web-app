/**
 * Notification messages for trial reminder
 * Supports 4 languages: Arabic, English, Japanese, Korean
 */

export interface NotificationMessage {
    title: string;
    body: string;
}

export type NotificationType = 'trial_reminder';
export type Language = 'ar' | 'en' | 'ja' | 'ko';

export const NOTIFICATION_MESSAGES: Record<NotificationType, Record<Language, NotificationMessage>> = {
    trial_reminder: {
        ar: {
            title: '💚 تذكير سريع',
            body: 'تنتهي تجربتك المجانية خلال 4 أيام. نأمل أن كالي يساعدك في رحلتك الصحية. اشترك في أي وقت للاستمرار!'
        },
        en: {
            title: '💚 Quick reminder',
            body: 'Your trial ends in 4 days. We hope Kalee is helping your health journey. Subscribe anytime to continue!'
        },
        ja: {
            title: '💚 リマインダー',
            body: '無料トライアルは4日後に終了します。Kaleeがあなたの健康の旅に役立っていることを願っています。いつでも登録して続けましょう!'
        },
        ko: {
            title: '💚 간단한 알림',
            body: '무료 체험이 4일 후에 종료됩니다. Kalee가 건강 여정에 도움이 되고 있기를 바랍니다. 언제든지 구독하여 계속하세요!'
        }
    }
};

export function getNotificationMessage(type: NotificationType, language: Language): NotificationMessage {
    return NOTIFICATION_MESSAGES[type][language];
}

export function validateLanguage(language: string): Language {
    const validLanguages: Language[] = ['ar', 'en', 'ja', 'ko'];
    return validLanguages.includes(language as Language) ? (language as Language) : 'en';
}