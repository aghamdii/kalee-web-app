import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "../globals.css";
import { i18n } from '@/i18n/config';

const rubik = Rubik({
  subsets: ["latin", "arabic"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'ar' ? 'كالي - تتبع السعرات الحرارية بالذكاء الاصطناعي' : 'Kalee - AI-Powered Calorie Tracking',
    description: locale === 'ar' 
      ? 'تتبع السعرات الحرارية بسحر الذكاء الاصطناعي. التقط صورة لوجبتك ودع الذكاء الاصطناعي يحسب السعرات فوراً. لا مزيد من التخمين أو التسجيل اليدوي.'
      : 'Track calories with AI magic. Just snap a photo of your meal and let our AI calculate calories instantly. No more guessing, no more manual logging.',
    alternates: {
      languages: {
        'en': '/en',
        'ar': '/ar',
        'x-default': '/en'
      }
    },
    openGraph: {
      title: locale === 'ar' ? 'كالي - تتبع السعرات الحرارية بالذكاء الاصطناعي' : 'Kalee - AI-Powered Calorie Tracking',
      description: locale === 'ar' 
        ? 'تتبع السعرات الحرارية بسحر الذكاء الاصطناعي. التقط صورة لوجبتك ودع الذكاء الاصطناعي يحسب السعرات فوراً.'
        : 'Track calories with AI magic. Just snap a photo of your meal and let our AI calculate calories instantly.',
      locale: locale,
    }
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  return (
    <html suppressHydrationWarning lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr' }>
      <head>
        <link rel="alternate" hrefLang="en" href="/en" />
        <link rel="alternate" hrefLang="ar" href="/ar" />
        <link rel="alternate" hrefLang="x-default" href="/en" />
      </head>
      <body className={`${rubik.className} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}