import Image from "next/image";
import Link from "next/link";
import { Locale } from '@/i18n/config';

export default async function Terms({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

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
          <p className="text-gray-600 mb-8">Last updated: January 2025</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">1. Introduction and Acceptance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These terms and conditions apply to the Kalee mobile app ("Kalee" or "the App"), an AI-powered nutrition tracking application created by Ahmed Alghamdi. Kalee offers both free features and optional premium subscriptions for enhanced functionality.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                By downloading or using Kalee, you automatically agree to these terms and conditions. Please read them carefully before using the app.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">2. Service Description</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kalee is an AI-powered nutrition tracking app that helps you monitor your dietary intake and achieve your health goals. Our app provides:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>AI Food Recognition:</strong> Photo analysis using advanced AI technology to identify food items and estimate portions</li>
                <li><strong>Nutritional Analysis:</strong> Calculation of calories, macronutrients (protein, carbohydrates, fats) and other nutritional information</li>
                <li><strong>Goal Setting:</strong> Personalized daily targets based on BMR and TDEE calculations</li>
                <li><strong>Progress Tracking:</strong> Daily averages, weight trends, and meal history</li>
                <li><strong>Multiple Input Methods:</strong> Camera recognition, text description, and manual entry</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kalee includes both free features and optional premium features available through subscription.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">3. Age Requirements and User Eligibility</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You must be at least 13 years old to use Kalee. By using the app, you represent and warrant that:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>You are at least 13 years of age</li>
                <li>You have the legal capacity to enter into these terms</li>
                <li>You will provide accurate and truthful information</li>
                <li>You will maintain the security of your account</li>
                <li>You will not misuse Kalee's services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">4. Premium Features & Subscription Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kalee offers premium features through in-app purchases and subscription options. Premium features may include advanced analytics, unlimited AI analysis, priority support, and enhanced customization options.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Subscription options may include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Weekly subscription: Pricing as displayed in the app store</li>
                <li>Annual subscription: Pricing as displayed in the app store</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                All subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscription by going to your account settings in the App Store or Google Play Store after purchase.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">5. AI Technology and Accuracy Disclaimers</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-gray-700 leading-relaxed font-semibold">
                  IMPORTANT: Please read this section carefully as it contains crucial information about the limitations of our AI technology.
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our AI food recognition and nutritional analysis technology achieves approximately 80-90% accuracy under optimal conditions. However, we do not guarantee the accuracy, completeness, or reliability of:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Food identification and portion size estimates from images</li>
                <li>Nutritional calculations and macro/micronutrient content</li>
                <li>Daily goal calculations based on BMR and TDEE formulas</li>
                <li>Calorie and macro recommendations</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Accuracy depends on factors including photo quality, lighting conditions, food visibility, and the complexity of the meal. Users should review and correct AI-generated results as needed.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">6. Health and Medical Disclaimers</h2>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <p className="text-gray-700 leading-relaxed font-semibold">
                  MEDICAL DISCLAIMER: Kalee is NOT a substitute for professional medical or nutritional advice.
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Application is designed as a tracking tool to help you build healthy habits and monitor your nutrition. However:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>We do not provide medical, dietary, or health advice</li>
                <li>All nutritional information is for informational purposes only</li>
                <li>We do not guarantee any health outcomes from using the Application</li>
                <li>We are not responsible for health decisions made based on the Application's data</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>We strongly recommend consulting with qualified healthcare professionals, registered dietitians, or medical doctors for:</strong>
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Specific dietary needs or restrictions</li>
                <li>Medical conditions requiring dietary management</li>
                <li>Weight management programs</li>
                <li>Any health-related concerns or decisions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">7. Account Management and Deletion</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may delete your account at any time by using the "Delete Account" function within the Application or by contacting us directly. Upon account deletion:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Your personal information and meal data will be removed as described in our Privacy Policy</li>
                <li>Food images are already automatically deleted within 24 hours of processing</li>
                <li>Some anonymized data may be retained for service improvement purposes</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Note:</strong> Deleting your account does not automatically cancel your subscription. You must separately cancel your subscription through the App Store or Google Play Store settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">8. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                All trademarks, copyrights, database rights, and other intellectual property rights related to the Application remain the property of the Service Provider. You are prohibited from:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Unauthorized copying, modification of the Application or our trademarks</li>
                <li>Extracting the source code of the Application</li>
                <li>Translating the Application into other languages without permission</li>
                <li>Creating derivative versions or reverse engineering</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">9. Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Application utilizes third-party services that have their own Terms and Conditions:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-kalee-secondary hover:underline">Google Play Services</a></li>
                <li><a href="https://www.google.com/analytics/terms/" target="_blank" rel="noopener noreferrer" className="text-kalee-secondary hover:underline">Google Analytics for Firebase</a></li>
                <li><a href="https://firebase.google.com/terms/crashlytics" target="_blank" rel="noopener noreferrer" className="text-kalee-secondary hover:underline">Firebase Crashlytics</a></li>
                <li><a href="https://ai.google.dev/terms" target="_blank" rel="noopener noreferrer" className="text-kalee-secondary hover:underline">Google AI/Gemini API</a></li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">10. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Service Provider is not responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Any health decisions or outcomes based on Application data</li>
                <li>Inaccuracies in AI food recognition or nutritional calculations</li>
                <li>Loss of data due to technical issues or user error</li>
                <li>Interruptions in service due to internet connectivity issues</li>
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Application is provided "as is" without warranties of any kind. Your use of the Application is at your own risk and discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">11. Service Termination</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Service Provider reserves the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Suspend or terminate accounts that violate these terms</li>
                <li>Modify, suspend, or discontinue the Application at any time</li>
                <li>Update the Application as needed for compatibility and security</li>
                <li>Refuse access to any user for any reason deemed appropriate</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">12. Changes to Terms and Conditions</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Service Provider may periodically update these Terms and Conditions. You will be notified of any material changes through the Application or via email. Continued use of the Application after such modifications constitutes acceptance of the updated Terms.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                These terms and conditions are effective as of January 15, 2025.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">13. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions or suggestions about these Terms and Conditions, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>App Support:</strong> app.kalee@gmail.com</p>
                <p className="text-gray-700"><strong>Developer:</strong> Ahmed Alghamdi</p>
                <p className="text-gray-700"><strong>Email:</strong> alghamdii.ahmad@gmail.com</p>
                <p className="text-gray-700"><strong>Support:</strong> <Link href={`/${locale}/support`} className="text-kalee-secondary hover:underline">Visit our Support page</Link></p>
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