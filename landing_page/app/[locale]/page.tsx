import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionary } from '@/i18n/get-dictionary';
import { Locale } from '@/i18n/config';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import DownloadButton from '@/components/DownloadButton';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const isRTL = locale === 'ar';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal Header */}
      <header className="fixed top-0 w-full bg-gray-50/80 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/kalee_logo_circle.png"
                alt="Kalee"
                width={32}
                height={32}
                className="pixelated"
                priority
              />
              <span className="font-semibold text-lg">Kalee</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href={`/${locale}#features`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {dict.nav.features}
              </Link>
              <Link href={`/${locale}#how`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {dict.nav.howItWorks}
              </Link>
              <LanguageSwitcher currentLocale={locale} />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section with iPhone Mockup */}
      <section className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* iPhone Mockup */}
            <div className="order-2 lg:order-1 rtl:order-1 rtl:lg:order-2 flex justify-center">
              <div className="relative">
                <Image
                  src={locale === 'ar' ? "/progresspage_ar.png" : "/progresspage_en.png"}
                  alt="Kalee App Progress Screen"
                  width={300}
                  height={600}
                  priority
                />
              </div>
            </div>
            
            {/* Content */}
            <div className="order-1 lg:order-2 rtl:order-2 rtl:lg:order-1 text-center lg:text-left rtl:lg:text-right">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                {dict.hero.title}
                <span className="block text-kalee-primary">{dict.hero.titleHighlight}</span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 mb-10">
                {dict.hero.description}
              </p>
              
              <div className={`flex justify-center lg:justify-start ${isRTL ? 'lg:justify-end' : ''}`}>
                <DownloadButton isRTL={isRTL} className="bg-kalee-primary hover:bg-kalee-primary/90 text-white px-8">
                  {dict.hero.cta}
                </DownloadButton>
              </div>

              {/* Nutrition Icons Display */}
              <div className="grid grid-cols-4 gap-6 mt-16 mb-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-kalee-primary/10 rounded-full flex items-center justify-center">
                    <Image src="/calories_icon.png" alt={dict.macros.calories} width={200} height={200} className="pixelated" style={{objectFit: "contain"}} />
                  </div>
                  <span className="text-sm text-gray-600">{dict.macros.calories}</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-kalee-secondary/10 rounded-full flex items-center justify-center">
                    <Image src="/protein_icon.png" alt={dict.macros.protein} width={200} height={200} className="pixelated" style={{objectFit: "contain"}} />
                  </div>
                  <span className="text-sm text-gray-600">{dict.macros.protein}</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-kalee-primary/10 rounded-full flex items-center justify-center">
                    <Image src="/carbs_icon.png" alt={dict.macros.carbs} width={200} height={200} className="pixelated" style={{objectFit: "contain"}} />
                  </div>
                  <span className="text-sm text-gray-600">{dict.macros.carbs}</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-kalee-secondary/10 rounded-full flex items-center justify-center">
                    <Image src="/fat_icon.png" alt={dict.macros.fat} width={200} height={200} className="pixelated" style={{objectFit: "contain"}} />
                  </div>
                  <span className="text-sm text-gray-600">{dict.macros.fat}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 mt-16 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-kalee-primary mb-2">{dict.benefits.easyTracking.title}</div>
              <p className="text-sm text-gray-600">{dict.benefits.easyTracking.description}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-kalee-secondary mb-2">{dict.benefits.dailyReminders.title}</div>
              <p className="text-sm text-gray-600">{dict.benefits.dailyReminders.description}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-kalee-primary mb-2">{dict.benefits.visualProgress.title}</div>
              <p className="text-sm text-gray-600">{dict.benefits.visualProgress.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {dict.features.title}
              </h2>
              <p className="text-lg text-gray-600">
                {dict.features.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-gray-100 bg-white hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="w-20 h-20 bg-kalee-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Image
                      src="/robot_icon.png"
                      alt="AI Recognition"
                      width={40}
                      height={40}
                      className="pixelated"
                      style={{objectFit: "contain"}}
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{dict.features.aiTracking.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {dict.features.aiTracking.description}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-100 bg-white hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="w-20 h-20 bg-kalee-secondary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Image
                      src="/calories_icon.png"
                      alt="Personalized Goals"
                      width={200}
                      height={200}
                      className="pixelated"
                      style={{objectFit: "contain"}}
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{dict.features.personalizedGoals.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {dict.features.personalizedGoals.description}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-100 bg-white hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="w-20 h-20 bg-kalee-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Image
                      src="/protein_icon.png"
                      alt="Progress Analytics"
                      width={200}
                      height={200}
                      className="pixelated"
                      style={{objectFit: "contain"}}
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{dict.features.progressAnalytics.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {dict.features.progressAnalytics.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Three Ways to Track */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {dict.trackingMethods.title}
              </h2>
              <p className="text-lg text-gray-600">
                {dict.trackingMethods.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-kalee-primary/10 to-kalee-primary/5 rounded-full flex items-center justify-center mb-4 hover:scale-105 transition-transform">
                  <Image
                    src="/robot_icon.png"
                    alt="Camera AI"
                    width={40}
                    height={40}
                    className="pixelated"
                    style={{objectFit: "contain"}}
                  />
                </div>
                <h4 className="font-semibold mb-2">{dict.trackingMethods.camera.title}</h4>
                <p className="text-sm text-gray-600">{dict.trackingMethods.camera.description}</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-kalee-secondary/10 to-kalee-secondary/5 rounded-full flex items-center justify-center mb-4 hover:scale-105 transition-transform">
                  <Image
                    src="/calories_icon.png"
                    alt="Text Description"
                    width={200}
                    height={200}
                    className="pixelated"
                    style={{objectFit: "contain"}}
                  />
                </div>
                <h4 className="font-semibold mb-2">{dict.trackingMethods.text.title}</h4>
                <p className="text-sm text-gray-600">{dict.trackingMethods.text.description}</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-kalee-primary/10 to-kalee-primary/5 rounded-full flex items-center justify-center mb-4 hover:scale-105 transition-transform">
                  <Image
                    src="/protein_icon.png"
                    alt="Manual Entry"
                    width={200}
                    height={200}
                    className="pixelated"
                    style={{objectFit: "contain"}}
                  />
                </div>
                <h4 className="font-semibold mb-2">{dict.trackingMethods.manual.title}</h4>
                <p className="text-sm text-gray-600">{dict.trackingMethods.manual.description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {dict.howItWorks.title}
              </h2>
              <p className="text-lg text-gray-600">
                {dict.howItWorks.subtitle}
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-10 h-10 rounded-full bg-kalee-primary text-white flex items-center justify-center font-semibold shrink-0">
                  <span className="block rtl:hidden">1</span>
                  <span className="hidden rtl:block">١</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{dict.howItWorks.step1.title}</h3>
                  <p className="text-gray-600">{dict.howItWorks.step1.description}</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-10 h-10 rounded-full bg-kalee-secondary text-white flex items-center justify-center font-semibold shrink-0">
                  <span className="block rtl:hidden">2</span>
                  <span className="hidden rtl:block">٢</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{dict.howItWorks.step2.title}</h3>
                  <p className="text-gray-600">{dict.howItWorks.step2.description}</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-10 h-10 rounded-full bg-kalee-primary text-white flex items-center justify-center font-semibold shrink-0">
                  <span className="block rtl:hidden">3</span>
                  <span className="hidden rtl:block">٣</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{dict.howItWorks.step3.title}</h3>
                  <p className="text-gray-600">{dict.howItWorks.step3.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-kalee-primary/5 to-kalee-secondary/5">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {dict.cta.title}
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {dict.cta.subtitle}
            </p>
            <DownloadButton isRTL={isRTL} className="bg-kalee-primary hover:bg-kalee-primary/90 text-white px-10">
              {dict.cta.button}
            </DownloadButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Image
                src="/kalee_logo_circle.png"
                alt="Kalee"
                width={24}
                height={24}
                className="pixelated"
              />
              <span className="text-sm text-gray-600">{dict.footer.copyright}</span>
            </div>
            
            <div className="flex gap-8">
              <Link href={`/${locale}/terms`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {dict.nav.terms}
              </Link>
              <Link href={`/${locale}/privacy`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {dict.nav.privacy}
              </Link>
              <Link href={`/${locale}/support`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                {dict.nav.support}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}