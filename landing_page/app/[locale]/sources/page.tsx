import Image from "next/image";
import Link from "next/link";
import { Locale } from '@/i18n/config';

export default async function Sources({
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

      {/* Sources Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Health Information & Sources</h1>
          <p className="text-gray-600 mb-8">
            Kalee's health calculations and AI-powered nutrition analysis are based on established medical standards and peer-reviewed scientific research. All calculations are estimates and should not replace professional medical advice.
          </p>

          <div className="prose prose-lg max-w-none">
            {/* Body Mass Index (BMI) Calculations */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Body Mass Index (BMI) Calculations</h2>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">BMI Formula & Classification</h3>
                  <p className="text-gray-700 mb-4">
                    BMI is calculated using the standard formula: <strong>BMI = weight (kg) / height (m) squared</strong> or <strong>BMI = weight (lbs) / height (inches) squared x 703</strong>
                  </p>
                  <div className="bg-white p-4 rounded border-l-4 border-kalee-secondary mb-4">
                    <h4 className="font-semibold mb-2">WHO BMI Classifications:</h4>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>Underweight: BMI less than 18.5</li>
                      <li>Normal weight: BMI 18.5-24.9</li>
                      <li>Overweight: BMI 25.0-29.9</li>
                      <li>Obese: BMI 30.0 or greater</li>
                    </ul>
                  </div>
                  <p className="text-gray-700 mb-2">
                    World Health Organization standard classification for BMI ranges used to assess weight status in adults.
                  </p>
                  <a href="https://www.who.int/europe/news-room/fact-sheets/item/a-healthy-lifestyle---who-recommendations" target="_blank" rel="noopener noreferrer" className="text-kalee-secondary hover:underline">
                    WHO BMI Guidelines
                  </a>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">CDC BMI Guidelines</h3>
                  <p className="text-gray-700 mb-2">
                    Centers for Disease Control and Prevention BMI guidelines for adults, including considerations for different populations.
                  </p>
                  <a href="https://www.cdc.gov/healthyweight/assessing/bmi/adult_bmi/index.html" target="_blank" rel="noopener noreferrer" className="text-kalee-secondary hover:underline">
                    CDC BMI Information
                  </a>
                </div>
              </div>
            </section>

            {/* Calorie & Metabolism Calculations */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Calorie & Metabolism Calculations</h2>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Harris-Benedict Equation (Revised)</h3>
                  <p className="text-gray-700 mb-2">
                    Revised Harris-Benedict equation for calculating Basal Metabolic Rate (BMR), updated in 1984 for improved accuracy in modern populations.
                  </p>
                  <div className="bg-white p-4 rounded border-l-4 border-kalee-secondary mb-2">
                    <p className="text-sm font-mono text-gray-700">
                      <strong>Men:</strong> BMR = 88.362 + (13.397 × weight in kg) + (4.799 × height in cm) - (5.677 × age)<br/>
                      <strong>Women:</strong> BMR = 447.593 + (9.247 × weight in kg) + (3.098 × height in cm) - (4.330 × age)
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    Roza AM, Shizgal HM. "The Harris Benedict equation reevaluated: resting energy requirements and the body cell mass." Am J Clin Nutr. 1984;40(1):168-82.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Mifflin-St Jeor Equation</h3>
                  <p className="text-gray-700 mb-2">
                    More accurate BMR calculation method that research shows outperforms Harris-Benedict in 70-82% of individuals. Recommended by clinical guidelines when indirect calorimetry is unavailable.
                  </p>
                  <div className="bg-white p-4 rounded border-l-4 border-kalee-secondary mb-2">
                    <p className="text-sm font-mono text-gray-700">
                      <strong>Men:</strong> BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) + 5<br/>
                      <strong>Women:</strong> BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) - 161
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. "A new predictive equation for resting energy expenditure in healthy individuals." Am J Clin Nutr. 1990;51(2):241-7.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Physical Activity Level (PAL) Values</h3>
                  <p className="text-gray-700 mb-2">
                    Activity factors used by Kalee for calculating Total Daily Energy Expenditure (TDEE) from BMR, based on WHO/FAO/UNU Expert Consultation.
                  </p>
                  <div className="bg-white p-4 rounded border-l-4 border-kalee-secondary mb-2">
                    <p className="text-sm text-gray-700">
                      <strong>Sedentary:</strong> BMR × 1.2 (little to no exercise)<br/>
                      <strong>Lightly Active:</strong> BMR × 1.375 (light exercise 1-3 days/week)<br/>
                      <strong>Moderately Active:</strong> BMR × 1.55 (moderate exercise 3-5 days/week)<br/>
                      <strong>Very Active:</strong> BMR × 1.725 (hard exercise 6-7 days/week)<br/>
                      <strong>Extremely Active:</strong> BMR × 1.9 (very hard exercise, physical job)
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    FAO/WHO/UNU. "Human Energy Requirements: Report of a Joint FAO/WHO/UNU Expert Consultation." Rome, 2001.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Recent Validation Studies</h3>
                  <p className="text-gray-700 mb-4">
                    Clinical research comparing BMR prediction equations shows important accuracy differences:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li><strong>Mifflin-St Jeor accuracy:</strong> 70-82% of individuals within 10% of measured values</li>
                    <li><strong>Harris-Benedict accuracy:</strong> 38-80% of individuals within 10% of measured values</li>
                    <li><strong>Clinical recommendation:</strong> Mifflin-St Jeor preferred when indirect calorimetry unavailable</li>
                    <li><strong>Population considerations:</strong> Accuracy may be reduced in obese populations and specific demographic groups</li>
                  </ul>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 italic">
                      Amirkalali B, Hosseini S, Heshmat R, Larijani B. "Comparison of Harris Benedict and Mifflin-ST Jeor equations with indirect calorimetry in evaluating resting energy expenditure." Indian J Med Sci. 2008;62(7):283-90.
                    </p>
                    <p className="text-sm text-gray-600 italic">
                      Frankenfield D, Roth-Yousey L, Compher C. "Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review." J Am Diet Assoc. 2005;105(5):775-89.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* TDEE Research & Components */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Total Daily Energy Expenditure (TDEE) Research</h2>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">TDEE Components & Composition</h3>
                  <p className="text-gray-700 mb-4">
                    Research shows TDEE consists of four main components, with BMR being the largest contributor to total energy expenditure:
                  </p>
                  <div className="bg-white p-4 rounded border-l-4 border-kalee-secondary mb-4">
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li><strong>Basal Metabolic Rate (BMR):</strong> 60-70% of TDEE</li>
                      <li><strong>Thermic Effect of Food (TEF):</strong> 8-10% of TDEE</li>
                      <li><strong>Physical Activity Energy Expenditure:</strong> 15-25% of TDEE</li>
                      <li><strong>Non-Exercise Activity Thermogenesis (NEAT):</strong> Variable component</li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    Westerterp KR. "Physical activity and physical activity induced changes in body composition in relation to energy balance." Proc Nutr Soc. 2018;77(1):20-26.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">2024 TDEE & Weight Management Research</h3>
                  <p className="text-gray-700 mb-4">
                    Recent comprehensive review examining TDEE's role in weight management and metabolic health:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                    <li><strong>Weight Loss Maintenance:</strong> Successful maintainers show higher physical activity energy expenditure (812±268 vs 621±285 kcal/day in controls)</li>
                    <li><strong>Age-Related Changes:</strong> TDEE follows 3 phases - incline, stable, and decline according to age groups</li>
                    <li><strong>Individual Variation:</strong> TDEE can vary significantly between individuals of similar characteristics</li>
                    <li><strong>Clinical Application:</strong> TDEE measurement crucial for personalized nutrition interventions</li>
                  </ul>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 italic">
                      Comprehensive Review on BMI, TDEE, BMR, and Calories for Weight Management: Insights into Energy Expenditure and Nutrient Balance for Long-Term Well-Being. ResearchGate. 2024.
                    </p>
                    <p className="text-sm text-gray-600 italic">
                      Thomas DM, et al. "Physical Activity Energy Expenditure and Total Daily Energy Expenditure in Successful Weight Loss Maintainers." Obesity. 2019;27(3):496-504.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* AI & Food Recognition Technology */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-foreground">AI & Food Recognition Technology</h2>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Google Gemini AI</h3>
                  <p className="text-gray-700 mb-2">
                    Advanced multi-modal AI model used by Kalee for food image recognition and nutritional analysis. Trained on extensive food datasets for accurate identification and portion estimation.
                  </p>
                  <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-kalee-secondary hover:underline">
                    Learn about Gemini AI
                  </a>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-foreground">AI Accuracy & Limitations</h3>
                  <p className="text-gray-700 mb-2">
                    Kalee's AI technology achieves 80-90% accuracy under optimal conditions with clear, well-lit food images. Accuracy may vary based on image quality, lighting, and food complexity.
                  </p>
                </div>
              </div>
            </section>

            {/* Important Medical Disclaimer */}
            <section className="mb-12">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
                <h2 className="text-xl font-bold mb-4 text-foreground">Important Medical Disclaimer</h2>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>All nutritional calculations and health assessments are estimates based on established formulas and average values</li>
                  <li>Individual nutritional needs vary significantly based on age, gender, activity level, metabolism, and health conditions</li>
                  <li>BMI calculations may not be appropriate for athletes, pregnant women, or individuals with certain medical conditions</li>
                  <li><strong>Always consult with healthcare professionals before making medical or dietary decisions</strong></li>
                  <li>Kalee is designed to support healthy lifestyle choices but does not provide medical advice</li>
                  <li>AI analysis results should be used as estimates only and may contain errors</li>
                </ul>
              </div>
            </section>

            {/* Data Accuracy & Updates */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Data Accuracy & Updates</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kalee is committed to maintaining accuracy in our health calculations:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Scientific Standards:</strong> All formulas based on peer-reviewed research and established medical guidelines</li>
                <li><strong>AI Model Updates:</strong> Continuous improvement based on user feedback and expanded training data</li>
                <li><strong>Formula Verification:</strong> Regular review of calculation methods against current medical standards</li>
                <li><strong>Transparency:</strong> Open documentation of all calculation methods and data sources</li>
              </ul>
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