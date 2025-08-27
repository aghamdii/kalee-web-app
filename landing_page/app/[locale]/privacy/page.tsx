import Image from "next/image";
import Link from "next/link";
import { Locale } from '@/i18n/config';

export default async function Privacy({
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

      {/* Privacy Policy Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: January 15, 2025</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Our Commitment to Your Privacy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                This privacy policy applies to the Kalee mobile app ("Kalee" or "the App"), an AI-powered nutrition tracking application developed by Ahmed Alghamdi. Kalee offers both free features and optional premium subscriptions for enhanced functionality.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                At Kalee, we believe that effective nutrition tracking requires trust. This privacy policy explains how we collect, use, and protect your information while helping you achieve your health goals through AI-powered food analysis.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">1. Information We Collect</h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Account Information</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Email address:</strong> Used to create and manage your account and provide support</li>
                  <li><strong>Name:</strong> Used to personalize your nutrition experience</li>
                  <li><strong>Personal metrics:</strong> Height, weight, age, activity level for BMR/TDEE calculations</li>
                  <li><strong>Goal preferences:</strong> Weight management goals, dietary restrictions, and nutrition targets</li>
                  <li><strong>Subscription status:</strong> To provide access to premium features</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Nutrition & Food Data</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Food images:</strong> Photos you take for AI analysis (stored securely for meal tracking and history)</li>
                  <li><strong>Meal entries:</strong> Food items, portions, and nutritional information you log</li>
                  <li><strong>Daily tracking data:</strong> Calories, macronutrients, and dietary intake patterns</li>
                  <li><strong>User corrections:</strong> Edits you make to AI-generated food analysis</li>
                  <li><strong>Meal history:</strong> Your logged meals and nutrition progress over time</li>
                  <li><strong>Manual entries:</strong> Food items and nutrition data you input directly</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Usage Information</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Your device's Internet Protocol address (e.g. IP address)</li>
                  <li>App interaction data: How you navigate and use features within the app</li>
                  <li>AI usage patterns: Frequency of photo analysis, text descriptions, and manual entries</li>
                  <li>Session information: Time spent in the app and feature usage patterns</li>
                  <li>The operating system you use on your mobile device</li>
                  <li>Diagnostic data: App performance metrics and crash reports to improve stability</li>
                </ul>
              </div>

              <p className="text-gray-700 leading-relaxed">
                Kalee does not gather precise information about the location of your mobile device unless you explicitly grant location permissions for features like nearby restaurant recommendations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">2. How We Use Your Information</h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Essential App Functionality</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>To create and maintain your account</li>
                  <li>To analyze food images using AI and calculate nutritional information</li>
                  <li>To store and display your meal history and progress</li>
                  <li>To calculate personalized daily goals based on BMR and TDEE formulas</li>
                  <li>To process and manage your subscription</li>
                  <li>To provide AI-powered nutrition tracking assistance</li>
                  <li>To improve app stability and fix technical issues</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">AI Processing & Personalization</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>To analyze food photos and identify ingredients and portions</li>
                  <li>To improve our food recognition accuracy based on user corrections</li>
                  <li>To customize nutrition recommendations based on your goals and preferences</li>
                  <li>To track your progress toward daily macro and calorie targets</li>
                  <li>To provide insights and trends in your nutrition patterns</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Analytics & Service Improvement</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>To understand how users interact with our AI features</li>
                  <li>To identify common food items for database improvements</li>
                  <li>To measure the effectiveness of new features</li>
                  <li>To improve our AI food recognition algorithms</li>
                  <li>To enhance accuracy of nutritional calculations</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Communication</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may use the information you provided to contact you from time to time to provide you with important information, required notices, nutrition tips, and promotional content related to health and nutrition tracking.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">3. AI Processing and Data Security</h2>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <p className="text-gray-700 leading-relaxed font-semibold">
                  IMPORTANT: Your food images are stored securely and encrypted to enable meal tracking and history viewing.
                </p>
              </div>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                Your food images are processed using advanced AI technology with the following security measures:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Secure processing:</strong> Images are processed on encrypted servers using Google's Gemini AI</li>
                <li><strong>Encrypted storage:</strong> Food images are stored securely with industry-standard encryption</li>
                <li><strong>Data encryption:</strong> All transmitted data is encrypted in transit and at rest</li>
                <li><strong>Limited access:</strong> Only authorized systems and you have access to your food images</li>
                <li><strong>User control:</strong> Images are retained for your meal history and can be deleted when you delete meals or your account</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mb-4">
                Food images are stored alongside the nutritional data extracted from them (calories, macros, ingredients) to provide you with a complete meal history and visual tracking experience.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">4. Third Party Access</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Only aggregated, anonymized data is periodically transmitted to external services to help us improve Kalee and our services. We may share your information with third parties only in the ways described in this privacy policy.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                Please note that Kalee utilizes third-party services that have their own privacy policies about handling data. Below are the links to the privacy policies of the third-party service providers used by Kalee:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><a href="https://www.google.com/policies/privacy/" target="_blank" rel="noopener noreferrer" className="text-kalee-secondary hover:underline">Google Play Services</a></li>
                <li><a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-kalee-secondary hover:underline">Google Analytics for Firebase</a></li>
                <li><a href="https://firebase.google.com/support/privacy/" target="_blank" rel="noopener noreferrer" className="text-kalee-secondary hover:underline">Firebase Crashlytics</a></li>
                <li><a href="https://ai.google.dev/privacy" target="_blank" rel="noopener noreferrer" className="text-kalee-secondary hover:underline">Google AI/Gemini API</a></li>
              </ul>

              <p className="text-gray-700 leading-relaxed mb-4">
                We may disclose your information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>as required by law, such as to comply with a subpoena, or similar legal process;</li>
                <li>when we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a government request;</li>
                <li>with our trusted service providers who work on our behalf, do not have an independent use of the information we disclose to them, and have agreed to adhere to the rules set forth in this privacy policy.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">5. What We DON'T Do With Your Data</h2>
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>We <strong>do not</strong> sell your personal information to anyone</li>
                  <li>We <strong>do not</strong> share your meal data or food photos with third parties without your explicit consent</li>
                  <li>We <strong>do not</strong> provide medical or dietary advice based on your data</li>
                  <li>We <strong>do not</strong> share your nutrition information with insurance companies or employers</li>
                  <li>We <strong>do not</strong> use your health data for advertising purposes outside of our own nutrition-related services</li>
                  <li>We <strong>do not</strong> share your food images with third parties without your explicit consent</li>
                  <li>We <strong>do not</strong> track your actual location for food logging without permission</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">6. Account Deletion</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can delete your account and associated personal data directly within the Kalee app:
              </p>
              <ol className="list-decimal pl-6 text-gray-700 space-y-2 mb-4">
                <li>Go to "Settings" &gt; "Account" &gt; "Delete Account"</li>
                <li>Follow the confirmation steps to permanently delete your account</li>
              </ol>

              <p className="text-gray-700 leading-relaxed mb-4">
                When you delete your account:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Your personal information (name, email, health metrics, preferences) will be removed from our systems</li>
                <li>Your meal history and nutritional data will be permanently deleted</li>
                <li>All your food images will be permanently deleted from our servers</li>
                <li>Your subscription will be canceled (though you may need to cancel through the app store separately)</li>
                <li>Deletion will be completed within 30 days</li>
              </ul>

              <p className="text-gray-700 leading-relaxed">
                We may retain certain anonymized usage data after account deletion for analytics and service improvement purposes only, with no personally identifiable information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">7. Data Retention Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We will retain your data for as long as you use Kalee and for a reasonable time thereafter:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Food images:</strong> Stored securely and retained while you have an active account for meal history viewing</li>
                <li><strong>Nutritional data:</strong> Retained while you have an active account for progress tracking</li>
                <li><strong>Account information:</strong> Retained until you delete your account</li>
                <li><strong>Usage analytics:</strong> Anonymized and retained for service improvement</li>
                <li><strong>Health metrics:</strong> Retained for goal calculations and progress tracking</li>
              </ul>

              <p className="text-gray-700 leading-relaxed">
                If you'd like to request deletion of User Provided Data outside of the in-app account deletion process, please contact us at app.kalee@gmail.com and we will respond in a reasonable time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">8. Health Data Disclaimer</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-gray-700 leading-relaxed font-semibold">
                  IMPORTANT: Kalee is a tracking tool, not a medical device or health advisor.
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                While we collect and process nutrition and health-related data to provide our tracking services:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We do not provide medical advice or health recommendations</li>
                <li>All nutritional calculations are estimates and should not replace professional guidance</li>
                <li>We are not responsible for health decisions made based on app data</li>
                <li>Always consult healthcare professionals for medical or dietary advice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">9. International Data Processing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kalee operates globally to serve users worldwide. By using our app, you acknowledge that your information may be transferred to and processed in countries other than your country of residence, including the United States, where our servers are located. These countries may have different data protection laws than your country.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We ensure appropriate safeguards are in place to protect your privacy rights regardless of where your data is processed.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">10. Your Privacy Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Depending on your location, you may have specific rights regarding your personal data:
              </p>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">For EU/UK Residents (GDPR)</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Right to access, correct, and delete your personal data</li>
                  <li>Right to restrict or object to our processing of your data</li>
                  <li>Right to data portability (export your nutrition data)</li>
                  <li>Right to withdraw consent for data processing</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">For California Residents (CCPA/CPRA)</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Right to know what personal information is collected</li>
                  <li>Right to delete personal information</li>
                  <li>Right to opt-out of the sale of personal information (though we do not sell your information)</li>
                  <li>Right to non-discrimination for exercising these rights</li>
                </ul>
              </div>

              <p className="text-gray-700 leading-relaxed">
                To exercise these rights, contact us at app.kalee@gmail.com.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">11. Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We are committed to safeguarding the confidentiality of your information. We implement industry-standard security measures including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Secure data storage practices with regular backups</li>
                <li>Secure encrypted storage of food images for meal history access</li>
                <li>Regular security reviews and updates</li>
                <li>Limited employee access to user data on a need-to-know basis</li>
                <li>Secure API connections for all third-party integrations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">12. Children</h2>
              <p className="text-gray-700 leading-relaxed">
                Kalee is not intended for anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13 years of age. If we discover that a child under 13 has provided personal information, we will immediately delete this information from our servers. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us at app.kalee@gmail.com so that we can take the necessary actions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">13. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                This Privacy Policy may be updated from time to time for any reason. We will notify you of any changes to the Privacy Policy by updating this page with the new Privacy Policy and through Kalee when appropriate. You are advised to consult this Privacy Policy regularly for any changes, as continued use is deemed approval of all changes.
              </p>
              <p className="text-gray-700 leading-relaxed">
                This privacy policy is effective as of January 15, 2025.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">14. Your Consent</h2>
              <p className="text-gray-700 leading-relaxed">
                By using Kalee, you are consenting to the processing of your information as set forth in this Privacy Policy now and as amended by us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">15. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions regarding privacy while using Kalee, or have questions about our practices, please contact us:
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