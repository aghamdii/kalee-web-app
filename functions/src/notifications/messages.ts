/**
 * Notification messages for onboarding flow
 * Supports 4 languages: Arabic, English, Japanese, Korean
 */

export interface NotificationMessage {
    title: string;
    body: string;
}

export type NotificationDay = 'day1' | 'day2' | 'day3';
export type Language = 'ar' | 'en' | 'ja' | 'ko';

export const ONBOARDING_NOTIFICATIONS: Record<NotificationDay, Record<Language, NotificationMessage>> = {
    day1: {
        ar: {
            title: '💪 هذه المرة مختلفة',
            body: 'واصل رحلتك الصحية اليوم. سجل وجباتك الآن'
        },
        en: {
            title: '💪 This time is different',
            body: 'Continue your healthy journey today. Track your meals now'
        },
        ja: {
            title: '💪 今回は違います',
            body: '健康な生活を続けましょう。今日の食事を記録してください'
        },
        ko: {
            title: '💪 이번엔 다릅니다',
            body: '건강한 여정을 계속하세요. 오늘 식사를 기록하세요'
        }
    },
    day2: {
        ar: {
            title: '🌟 الخطوات الصغيرة تصنع التغيير الكبير',
            body: 'كل وجبة تسجلها تقربك من هدفك. استمر في التقدم'
        },
        en: {
            title: '🌟 Small steps lead to big changes',
            body: 'Every meal you track brings you closer to your goal. Keep moving forward'
        },
        ja: {
            title: '🌟 小さな一歩が大きな変化を生む',
            body: '記録する食事一つ一つが目標に近づけます。前進を続けましょう'
        },
        ko: {
            title: '🌟 작은 발걸음이 큰 변화를 만듭니다',
            body: '기록하는 모든 식사가 목표에 가까워지게 합니다. 계속 나아가세요'
        }
    },
    day3: {
        ar: {
            title: '❤️ التغيير الحقيقي يبدأ هنا',
            body: 'أنت لست وحدك في هذه الرحلة. سجل وجباتك واستمر في بناء مستقبلك الصحي'
        },
        en: {
            title: '❤️ Real change starts here',
            body: "You're not alone in this journey. Track your meals and keep building your healthy future"
        },
        ja: {
            title: '❤️ 本当の変化はここから始まります',
            body: 'この旅にあなたは一人ではありません。食事を記録して健康な未来を築き続けましょう'
        },
        ko: {
            title: '❤️ 진정한 변화는 여기서 시작됩니다',
            body: '이 여정에서 당신은 혼자가 아닙니다. 식사를 기록하고 건강한 미래를 계속 만들어가세요'
        }
    }
};

export function getNotificationMessage(day: NotificationDay, language: Language): NotificationMessage {
    return ONBOARDING_NOTIFICATIONS[day][language];
}

export function validateLanguage(language: string): Language {
    const validLanguages: Language[] = ['ar', 'en', 'ja', 'ko'];
    return validLanguages.includes(language as Language) ? (language as Language) : 'en';
}