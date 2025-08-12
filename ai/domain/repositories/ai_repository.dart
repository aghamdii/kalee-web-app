import '../../../../core/domain/entities/ingredient.dart';
import '../../../../core/domain/entities/nutrition_data.dart';

abstract class AIRepository {
  /// Phase 1: Analyze food image to identify ingredients and portions
  Future<AIAnalysisResult> analyzeFoodImage(String imagePath);
  
  /// Phase 2: Detailed nutritional analysis based on corrected ingredients
  Future<NutritionAnalysisResult> analyzeNutrition({
    required String imagePath,
    required String mealName,
    required List<Ingredient> ingredients,
    String? additionalInfo,
  });
}

/// Result from Phase 1 AI analysis
class AIAnalysisResult {
  final String sessionId;
  final String mealName;
  final double confidence;
  final List<Ingredient> ingredients;
  final String suggestedMealType;
  
  const AIAnalysisResult({
    required this.sessionId,
    required this.mealName,
    required this.confidence,
    required this.ingredients,
    required this.suggestedMealType,
  });
}

/// Result from Phase 2 nutrition analysis
class NutritionAnalysisResult {
  final NutritionData nutrition;
  final double confidence;
  final double portionAccuracy;
  final List<String> dietaryFlags;
  final List<NutritionAlternative> alternatives;
  
  const NutritionAnalysisResult({
    required this.nutrition,
    required this.confidence,
    required this.portionAccuracy,
    required this.dietaryFlags,
    required this.alternatives,
  });
}

class NutritionAlternative {
  final String name;
  final NutritionData nutrition;
  
  const NutritionAlternative({
    required this.name,
    required this.nutrition,
  });
}