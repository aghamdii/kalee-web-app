import Image from "next/image";
import Link from "next/link";
import { headers } from 'next/headers';

export default async function Terms() {
  const headersList = await headers();
  // Extract locale from referer or default to 'en'
  const referer = headersList.get('referer') || '';
  const locale = referer.includes('/ar') ? 'ar' : 'en';
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <Link href={`/${locale}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <Image
              src="/kalee_logo_circle.png"
              alt="Kalee Logo"
              width={40}
              height={40}
              className="pixelated"
            />
            <span className="text-2xl font-bold text-foreground">Kalee</span>
          </Link>
        </div>
      </header>

      {/* Terms Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Terms & Conditions</h1>
          <p className="text-gray-600 mb-8">Last updated: November 2024</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By downloading, accessing, or using the Kalee mobile application ("App"), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, please do not use the App.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kalee is an AI-powered nutrition tracking application that uses artificial intelligence to analyze food images and calculate nutritional information including calories, macronutrients, and other dietary data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">3. User Responsibilities</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Provide accurate information when using the App</li>
                <li>Use the App for personal, non-commercial purposes only</li>
                <li>Not reverse engineer or attempt to extract source code</li>
                <li>Not use the App for any illegal or unauthorized purpose</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">4. AI Accuracy Disclaimer</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                While our AI technology strives for accuracy, nutritional calculations are estimates and should not be considered as professional medical or dietary advice. Always consult with healthcare professionals for specific dietary needs or medical conditions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">5. Privacy and Data</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. Food images and data are processed securely to provide our AI services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">6. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The App and its original content, features, and functionality are owned by Kalee and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">7. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kalee shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, or goodwill, resulting from your use of the App.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">8. Modifications to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes through the App or via email. Continued use of the App after such modifications constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">9. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms & Conditions, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">Email: legal@kalee.app</p>
                <p className="text-gray-700">Support: <Link href={`/${locale}/support`} className="text-kalee-secondary hover:underline">Visit our Support page</Link></p>
              </div>
            </section>
          </div>

          {/* Back to Home */}
          <div className="mt-12 text-center">
            <Link 
              href={`/${locale}`} 
              className="inline-flex items-center gap-2 text-kalee-secondary hover:text-kalee-primary transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            © 2025 Kalee. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}