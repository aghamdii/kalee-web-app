import Image from "next/image";
import Link from "next/link";

export default function Support() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-50/80 backdrop-blur-md border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
        </div>
      </header>

      {/* Support Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
            <p className="text-xl text-gray-600">
              Find answers to common questions about Kalee nutrition tracking
            </p>
          </div>

          {/* FAQ Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              {/* Macro & Calorie Calculations */}
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold mb-3 text-kalee-primary">📊 Macro & Calorie Calculations</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">How does Kalee calculate my daily macro goals?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Kalee uses scientifically-proven BMR (Basal Metabolic Rate) and TDEE (Total Daily Energy Expenditure) equations during onboarding. Based on your age, height, weight, activity level, and fitness goals, we calculate personalized daily targets for calories, protein, carbs, and fats.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Can I adjust my macro goals after onboarding?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Yes! You can update your macro targets anytime in the app settings. Whether your fitness goals change or you want to fine-tune your targets based on progress, you have full control over your daily goals.
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Accuracy & Technology */}
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold mb-3 text-kalee-primary">🤖 AI Accuracy & Technology</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">How accurate is the AI food recognition?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Our AI achieves 80-90% accuracy in food identification and macro estimation. The accuracy depends on photo quality, lighting, and food visibility. For best results, take clear photos with good lighting and the entire meal visible.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">What if the AI gets my food wrong?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      You can easily edit any meal entry. After AI analysis, review the identified items and adjust portions or ingredients as needed. You can also use text description or manual entry for more control.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">How does the text description feature work?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Simply describe your meal in words like "grilled chicken breast with rice and broccoli" and our AI will analyze the nutritional content. It's perfect for home-cooked meals or when you can't take a photo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Health & Medical Disclaimer */}
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold mb-3 text-kalee-primary">🏥 Health & Medical Disclaimer</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Is Kalee a replacement for medical or nutritional advice?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      No, Kalee is a tracking tool designed to help you build healthy habits and monitor your nutrition. For medical conditions, dietary restrictions, or specific health concerns, always consult with qualified healthcare professionals or registered dietitians. Think of Kalee as your daily companion for building awareness and consistency, not medical guidance.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Can Kalee help with specific diet plans?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Kalee is flexible and works with any eating style. While we don't prescribe specific diets, our macro tracking helps you stay accountable to whatever nutrition approach you and your healthcare provider have chosen.
                    </p>
                  </div>
                </div>
              </div>

              {/* App Features & Usage */}
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold mb-3 text-kalee-primary">📱 App Features & Usage</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">What are the three ways to track meals?</h4>
                    <div className="text-gray-700 leading-relaxed">
                      <p className="mb-2">You can track your meals in three convenient ways:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Camera AI</strong> - Snap a photo for instant analysis</li>
                        <li><strong>Text Description</strong> - Describe your meal in words</li>
                        <li><strong>Manual Entry</strong> - Search our database and log foods traditionally</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">How do daily reminders work?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Kalee sends smart notifications to help you log meals consistently. You can customize reminder times in settings to match your eating schedule, helping you build the habit of tracking.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Can I view my historical data and progress?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Yes! The Progress page shows your daily macro averages, weight trends, and complete meal history. You can filter and search past meals to understand your eating patterns over time.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Can I view my meal photos later?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Yes! All your meal photos are saved with their entries in your meals list. You can browse through your meal history anytime to see both the photos and nutritional information.
                    </p>
                  </div>
                </div>
              </div>

              {/* Privacy & Data */}
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold mb-3 text-kalee-primary">🔒 Privacy & Data</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Is my food data private?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Absolutely. Your meal photos and nutritional data are stored securely and encrypted. We never share your personal health information with third parties. Your data belongs to you alone.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Can I export my nutrition data?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      We're working on data export features for future updates. You'll be able to download your complete nutrition history for personal records or to share with healthcare providers.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Can I delete my account and data?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Yes, you can delete your account anytime from the app settings. This will permanently remove all your data including meal history, photos, and personal information.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing & Availability */}
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold mb-3 text-kalee-primary">💰 Pricing & Availability</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Is Kalee free to use?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      You can try Kalee free for 3 days to experience all features. After the trial, you can subscribe with the pricing options listed in the app to continue your nutrition tracking journey.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Is Kalee available for Android?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Currently, Kalee is exclusively available on iOS through the Apple App Store. We're evaluating Android development based on user demand.
                    </p>
                  </div>
                </div>
              </div>

              {/* Getting Started */}
              <div className="bg-white rounded-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold mb-3 text-kalee-primary">🎯 Getting Started</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">How long does onboarding take?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      The initial setup takes about 2-3 minutes. You'll answer a few questions about your stats and goals, and Kalee will calculate your personalized daily macro targets.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Can multiple people use the same account?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      Kalee is designed for individual use with personalized goals. Each person should have their own account for accurate tracking and progress monitoring.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">What happens if I miss logging a meal?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      No worries! You can add meals retroactively. While real-time logging is ideal for building habits, we understand life gets busy. The daily reminders help you stay consistent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tips for Better Results */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Tips for Better AI Recognition</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="mb-4">
                  <div className="bg-kalee-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">📸</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">Good Lighting</h3>
                <p className="text-gray-600 text-sm">
                  Take photos in natural light when possible for better AI recognition
                </p>
              </div>

              <div className="text-center">
                <div className="mb-4">
                  <div className="bg-kalee-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">Clear Focus</h3>
                <p className="text-gray-600 text-sm">
                  Ensure your food is clearly visible and in focus for accurate analysis
                </p>
              </div>

              <div className="text-center">
                <div className="mb-4">
                  <div className="bg-kalee-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">📏</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">Full View</h3>
                <p className="text-gray-600 text-sm">
                  Capture the entire meal in frame for comprehensive macro calculation
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-white border border-gray-100 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Get in Touch</h2>
            <p className="text-center text-gray-600 mb-8">
              If you can't find an answer in our FAQs, or if you need further assistance with your nutrition tracking, please don't hesitate to reach out.
            </p>
            
            <div className="max-w-md mx-auto space-y-6">
              {/* App Support */}
              <div className="text-center">
                <h3 className="font-bold mb-2">App Support Email</h3>
                <a 
                  href="mailto:app.kalee@gmail.com"
                  className="text-kalee-secondary hover:text-kalee-primary transition-colors text-lg"
                >
                  app.kalee@gmail.com
                </a>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-bold mb-4 text-center">Developer Information</h3>
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-gray-700 font-semibold">Ahmed Alghamdi</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <a 
                      href="mailto:alghamdii.ahmad@gmail.com"
                      className="text-kalee-secondary hover:text-kalee-primary transition-colors"
                    >
                      alghamdii.ahmad@gmail.com
                    </a>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">X (Twitter)</p>
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
              href="/" 
              className="inline-flex items-center gap-2 text-kalee-secondary hover:text-kalee-primary transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            © 2025 Kalee. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}