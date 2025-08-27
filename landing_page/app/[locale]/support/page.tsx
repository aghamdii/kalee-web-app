import Image from "next/image";
import Link from "next/link";
import { getDictionary } from '@/i18n/get-dictionary';
import { Locale } from '@/i18n/config';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default async function Support({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const isRTL = locale === 'ar';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-50/80 backdrop-blur-md border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/kalee_logo_circle.png"
                alt="Kalee Logo"
                width={32}
                height={32}
                className="pixelated"
                priority
              />
              <span className="text-lg font-semibold">Kalee</span>
            </Link>
            <LanguageSwitcher currentLocale={locale} />
          </div>
        </div>
      </header>

      {/* Support Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{dict.support.title}</h1>
            <p className="text-xl text-gray-600">
              {dict.support.subtitle}
            </p>
          </div>

          {/* FAQ Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">{dict.support.faqTitle}</h2>
            
            <div className="space-y-6">
              {/* Macro & Calorie Calculations */}
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold mb-3 text-kalee-primary">📊 {locale === 'ar' ? 'حسابات الماكروز والسعرات' : 'Macro & Calorie Calculations'}</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">
                      {locale === 'ar' ? 'كيف يحسب كالي أهداف الماكروز اليومية؟' : 'How does Kalee calculate my daily macro goals?'}
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {locale === 'ar' 
                        ? 'يستخدم كالي معادلات BMR (معدل الأيض الأساسي) و TDEE (إجمالي الطاقة المستهلكة يومياً) المثبتة علمياً أثناء التسجيل. بناءً على عمرك وطولك ووزنك ومستوى النشاط وأهداف اللياقة، نحسب أهدافاً يومية مخصصة للسعرات والبروتين والكربوهيدرات والدهون.'
                        : 'Kalee uses scientifically-proven BMR (Basal Metabolic Rate) and TDEE (Total Daily Energy Expenditure) equations during onboarding. Based on your age, height, weight, activity level, and fitness goals, we calculate personalized daily targets for calories, protein, carbs, and fats.'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">
                      {locale === 'ar' ? 'هل يمكنني تعديل أهداف الماكروز بعد التسجيل؟' : 'Can I adjust my macro goals after onboarding?'}
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {locale === 'ar'
                        ? 'نعم! يمكنك تحديث أهداف الماكروز في أي وقت في إعدادات التطبيق. سواء تغيرت أهداف اللياقة أو كنت تريد ضبط أهدافك بناءً على التقدم، لديك السيطرة الكاملة على أهدافك اليومية.'
                        : 'Yes! You can update your macro targets anytime in the app settings. Whether your fitness goals change or you want to fine-tune your targets based on progress, you have full control over your daily goals.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Accuracy & Technology */}
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold mb-3 text-kalee-primary">🤖 {locale === 'ar' ? 'دقة الذكاء الاصطناعي والتكنولوجيا' : 'AI Accuracy & Technology'}</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">
                      {locale === 'ar' ? 'ما دقة التعرف على الطعام بالذكاء الاصطناعي؟' : 'How accurate is the AI food recognition?'}
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {locale === 'ar'
                        ? 'يحقق الذكاء الاصطناعي دقة 80-90% في تحديد الطعام وتقدير الماكروز. تعتمد الدقة على جودة الصورة والإضاءة ووضوح الطعام. للحصول على أفضل النتائج، التقط صوراً واضحة بإضاءة جيدة مع ظهور كامل الوجبة.'
                        : 'Our AI achieves 80-90% accuracy in food identification and macro estimation. The accuracy depends on photo quality, lighting, and food visibility. For best results, take clear photos with good lighting and the entire meal visible.'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">
                      {locale === 'ar' ? 'ماذا لو أخطأ الذكاء الاصطناعي في تحديد طعامي؟' : 'What if the AI gets my food wrong?'}
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {locale === 'ar'
                        ? 'يمكنك تعديل أي إدخال وجبة بسهولة. بعد تحليل الذكاء الاصطناعي، راجع العناصر المحددة واضبط الحصص أو المكونات حسب الحاجة. يمكنك أيضاً استخدام الوصف النصي أو الإدخال اليدوي للمزيد من التحكم.'
                        : 'You can easily edit any meal entry. After AI analysis, review the identified items and adjust portions or ingredients as needed. You can also use text description or manual entry for more control.'
                      }
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">
                      {locale === 'ar' ? 'كيف تعمل ميزة الوصف النصي؟' : 'How does the text description feature work?'}
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {locale === 'ar'
                        ? 'ببساطة اوصف وجبتك بالكلمات مثل "صدر دجاج مشوي مع أرز وبروكلي" وسيحلل الذكاء الاصطناعي المحتوى الغذائي. إنها مثالية للوجبات المطبوخة منزلياً أو عندما لا تستطيع التقاط صورة.'
                        : 'Simply describe your meal in words like "grilled chicken breast with rice and broccoli" and our AI will analyze the nutritional content. It\'s perfect for home-cooked meals or when you can\'t take a photo.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Health & Medical Disclaimer */}
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold mb-3 text-kalee-primary">🏥 {locale === 'ar' ? 'إخلاء المسؤولية الصحية والطبية' : 'Health & Medical Disclaimer'}</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">
                      {locale === 'ar' ? 'هل كالي بديل عن النصائح الطبية أو الغذائية؟' : 'Is Kalee a replacement for medical or nutritional advice?'}
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {locale === 'ar'
                        ? 'لا، كالي أداة تتبع مصممة لمساعدتك في بناء عادات صحية ومراقبة التغذية. للحالات الطبية أو القيود الغذائية أو المخاوف الصحية المحددة، استشر دائماً المتخصصين الصحيين المؤهلين أو اختصاصيي التغذية المسجلين. فكر في كالي كرفيقك اليومي لبناء الوعي والثبات، وليس التوجيه الطبي.'
                        : 'No, Kalee is a tracking tool designed to help you build healthy habits and monitor your nutrition. For medical conditions, dietary restrictions, or specific health concerns, always consult with qualified healthcare professionals or registered dietitians. Think of Kalee as your daily companion for building awareness and consistency, not medical guidance.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tips for Better Results */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">{dict.support.tipsTitle}</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="mb-4">
                  <div className="bg-kalee-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">📸</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  {locale === 'ar' ? 'إضاءة جيدة' : 'Good Lighting'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {locale === 'ar'
                    ? 'التقط الصور في الضوء الطبيعي عندما أمكن للحصول على تعرف أفضل بالذكاء الاصطناعي'
                    : 'Take photos in natural light when possible for better AI recognition'
                  }
                </p>
              </div>

              <div className="text-center">
                <div className="mb-4">
                  <div className="bg-kalee-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  {locale === 'ar' ? 'تركيز واضح' : 'Clear Focus'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {locale === 'ar'
                    ? 'تأكد من أن طعامك مرئي بوضوح ومركز للحصول على تحليل دقيق'
                    : 'Ensure your food is clearly visible and in focus for accurate analysis'
                  }
                </p>
              </div>

              <div className="text-center">
                <div className="mb-4">
                  <div className="bg-kalee-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">📏</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  {locale === 'ar' ? 'عرض كامل' : 'Full View'}
                </h3>
                <p className="text-gray-600 text-sm">
                  {locale === 'ar'
                    ? 'اتقط كامل الوجبة في الإطار للحصول على حساب شامل للماكروز'
                    : 'Capture the entire meal in frame for comprehensive macro calculation'
                  }
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-white border border-gray-100 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">{dict.support.contactTitle}</h2>
            <p className="text-center text-gray-600 mb-8">
              {dict.support.contactDescription}
            </p>
            
            <div className="max-w-md mx-auto space-y-6">
              {/* App Support */}
              <div className="text-center">
                <h3 className="font-bold mb-2">{dict.support.appSupport}</h3>
                <a 
                  href="mailto:app.kalee@gmail.com"
                  className="text-kalee-secondary hover:text-kalee-primary transition-colors text-lg"
                >
                  app.kalee@gmail.com
                </a>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-bold mb-4 text-center">{dict.support.developerInfo}</h3>
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-gray-700 font-semibold">Ahmed Alghamdi</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">{dict.support.email}</p>
                    <a 
                      href="mailto:alghamdii.ahmad@gmail.com"
                      className="text-kalee-secondary hover:text-kalee-primary transition-colors"
                    >
                      alghamdii.ahmad@gmail.com
                    </a>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">{dict.support.twitter}</p>
                    <a 
                      href="https://twitter.com/aghamdii1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-kalee-secondary hover:text-kalee-primary transition-colors"
                    >
                      @aghamdii1
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Back to Home */}
          <div className="mt-12 text-center">
            <Link 
              href={`/${locale}`} 
              className="inline-flex items-center gap-2 text-kalee-secondary hover:text-kalee-primary transition-colors"
            >
              <span className="inline rtl:hidden">←</span>
              <span className="hidden rtl:inline">→</span>
              {' '}{dict.footer.backToHome}
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            {dict.footer.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}