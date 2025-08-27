import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin", "arabic"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Kalee - AI-Powered Calorie Tracking",
  description: "Track calories with AI magic. Just snap a photo of your meal and let our AI calculate calories instantly. No more guessing, no more manual logging.",
  alternates: {
    languages: {
      'en': '/en',
      'ar': '/ar',
      'x-default': '/en'
    }
  },
  openGraph: {
    title: 'Kalee - AI-Powered Calorie Tracking',
    description: 'Track calories with AI magic. Just snap a photo of your meal and let our AI calculate calories instantly.',
    locale: 'en',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
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