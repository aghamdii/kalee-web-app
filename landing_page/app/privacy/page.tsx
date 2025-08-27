import Image from "next/image";
import Link from "next/link";
import { headers } from 'next/headers';

export default async function Privacy() {
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

      {/* Privacy Policy Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: November 2024</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">1. Information We Collect</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kalee collects information to provide and improve our AI-powered nutrition tracking services:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Food Images:</strong> Photos you take or select for nutritional analysis</li>
                <li><strong>Nutritional Data:</strong> Meal information, calorie counts, and dietary preferences</li>
                <li><strong>Account Information:</strong> Email, name, and basic profile information</li>
                <li><strong>Usage Data:</strong> How you interact with the app to improve our services</li>
                <li><strong>Device Information:</strong> Device type, operating system, and app version</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">2. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Analyze food images and provide nutritional calculations</li>
                <li>Maintain your meal history and dietary tracking</li>
                <li>Improve our AI algorithms and service accuracy</li>
                <li>Send important app updates and notifications</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Ensure app security and prevent fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">3. AI Processing and Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your food images are processed using advanced AI technology:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Images are processed securely on encrypted servers</li>
                <li>We use Google's Gemini AI for food recognition and analysis</li>
                <li>Images are automatically deleted after processing (within 24 hours)</li>
                <li>Nutritional data is stored securely with industry-standard encryption</li>
                <li>We never sell or share your personal food data with third parties</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">4. Information Sharing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties, except:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>With your explicit consent</li>
                <li>To trusted service providers who help operate our app (under strict confidentiality)</li>
                <li>To comply with legal obligations or protect our rights</li>
                <li>In aggregated, anonymized form for research and app improvement</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">5. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We retain your information only as long as necessary:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Food images: Deleted within 24 hours after AI processing</li>
                <li>Nutritional data: Retained while you have an active account</li>
                <li>Account information: Retained until you delete your account</li>
                <li>Usage analytics: Anonymized and retained for service improvement</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">6. Your Privacy Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Export your nutritional data</li>
                <li>Opt-out of non-essential communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">7. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kalee is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will delete the information immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">8. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your privacy rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">9. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update this Privacy Policy periodically. We will notify you of any material changes through the app or via email. Your continued use of Kalee after such updates constitutes acceptance of the revised policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">10. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions about this Privacy Policy or how we handle your data, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">Email: privacy@kalee.app</p>
                <p className="text-gray-700">Data Protection Officer: dpo@kalee.app</p>
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
            © 2024 Kalee. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}