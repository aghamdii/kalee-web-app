import 'package:injecteo/injecteo.dart';
import '../../domain/repositories/ai_repository.dart';
import '../../../../core/domain/entities/ingredient.dart';
import '../../../../core/domain/entities/nutrition_data.dart';
import 'dart:math';

@LazySingleton(as: AIRepository)
class AIRepositoryImpl implements AIRepository {
  final Random _random = Random();

  @override
  Future<AIAnalysisResult> analyzeFoodImage(String imagePath) async {
    // Simulate AI processing delay
    await Future.delayed(const Duration(seconds: 2));

    // Generate dummy data based on common meals
    final dummyMeals = [
      {
        'name': 'Grilled Chicken with Rice and Vegetables',
        'ingredients': [
          Ingredient(
            id: '1',
            name: 'Grilled Chicken Breast',
            quantity: 150,
            unit: 'g',
          ),
          Ingredient(id: '2', name: 'White Rice', quantity: 200, unit: 'g'),
          Ingredient(
            id: '3',
            name: 'Mixed Vegetables',
            quantity: 100,
            unit: 'g',
          ),
        ],
        'mealType': 'lunch',
      },
      {
        'name': 'Caesar Salad with Croutons',
        'ingredients': [
          Ingredient(id: '4', name: 'Romaine Lettuce', quantity: 80, unit: 'g'),
          Ingredient(
            id: '5',
            name: 'Caesar Dressing',
            quantity: 30,
            unit: 'ml',
          ),
          Ingredient(id: '6', name: 'Croutons', quantity: 20, unit: 'g'),
          Ingredient(id: '7', name: 'Parmesan Cheese', quantity: 15, unit: 'g'),
        ],
        'mealType': 'lunch',
      },
      {
        'name': 'Oatmeal with Berries and Nuts',
        'ingredients': [
          Ingredient(id: '8', name: 'Rolled Oats', quantity: 50, unit: 'g'),
          Ingredient(id: '9', name: 'Mixed Berries', quantity: 80, unit: 'g'),
          Ingredient(id: '10', name: 'Almonds', quantity: 20, unit: 'g'),
          Ingredient(id: '11', name: 'Milk', quantity: 200, unit: 'ml'),
        ],
        'mealType': 'breakfast',
      },
      {
        'name': 'Pasta with Tomato Sauce',
        'ingredients': [
          Ingredient(id: '12', name: 'Pasta', quantity: 100, unit: 'g'),
          Ingredient(id: '13', name: 'Tomato Sauce', quantity: 120, unit: 'ml'),
          Ingredient(id: '14', name: 'Olive Oil', quantity: 10, unit: 'ml'),
          Ingredient(id: '15', name: 'Basil', quantity: 5, unit: 'g'),
        ],
        'mealType': 'dinner',
      },
    ];

    final selectedMeal = dummyMeals[_random.nextInt(dummyMeals.length)];
    final confidence = 0.75 + _random.nextDouble() * 0.2; // 0.75-0.95

    return AIAnalysisResult(
      sessionId: 'session_${DateTime.now().millisecondsSinceEpoch}',
      mealName: selectedMeal['name'] as String,
      confidence: confidence,
      ingredients: selectedMeal['ingredients'] as List<Ingredient>,
      suggestedMealType: selectedMeal['mealType'] as String,
    );
  }

  @override
  Future<NutritionAnalysisResult> analyzeNutrition({
    required String imagePath,
    required String mealName,
    required List<Ingredient> ingredients,
    String? additionalInfo,
  }) async {
    // Simulate AI processing delay
    await Future.delayed(const Duration(seconds: 3));

    // Calculate nutrition based on ingredients
    double totalCalories = 0;
    double totalProtein = 0;
    double totalCarbs = 0;
    double totalFat = 0;

    for (final ingredient in ingredients) {
      // Dummy nutrition calculation based on ingredient name and quantity
      final nutrition = _calculateIngredientNutrition(
        ingredient.name,
        ingredient.quantity,
      );
      totalCalories += nutrition['calories']!;
      totalProtein += nutrition['protein']!;
      totalCarbs += nutrition['carbs']!;
      totalFat += nutrition['fat']!;
    }

    final confidence = 0.80 + _random.nextDouble() * 0.15; // 0.80-0.95
    final portionAccuracy = 0.75 + _random.nextDouble() * 0.20; // 0.75-0.95

    // Generate dietary flags based on nutrition
    final dietaryFlags = <String>[];
    if (totalProtein > 25) dietaryFlags.add('high_protein');
    if (totalFat < 10) dietaryFlags.add('low_fat');
    if (totalCarbs > 50) dietaryFlags.add('high_carb');
    if (totalCalories < 300) dietaryFlags.add('low_calorie');

    // Generate alternatives
    final alternatives = [
      NutritionAlternative(
        name: 'With larger portion (+50%)',
        nutrition: NutritionData(
          calories: totalCalories * 1.5,
          protein: totalProtein * 1.5,
          carbs: totalCarbs * 1.5,
          fat: totalFat * 1.5,
        ),
      ),
      NutritionAlternative(
        name: 'With smaller portion (-25%)',
        nutrition: NutritionData(
          calories: totalCalories * 0.75,
          protein: totalProtein * 0.75,
          carbs: totalCarbs * 0.75,
          fat: totalFat * 0.75,
        ),
      ),
    ];

    return NutritionAnalysisResult(
      nutrition: NutritionData(
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
      ),
      confidence: confidence,
      portionAccuracy: portionAccuracy,
      dietaryFlags: dietaryFlags,
      alternatives: alternatives,
    );
  }

  /// Calculate dummy nutrition for an ingredient based on its name and quantity
  Map<String, double> _calculateIngredientNutrition(
    String ingredientName,
    double quantity,
  ) {
    final name = ingredientName.toLowerCase();

    // Nutrition per 100g for common ingredients
    Map<String, double> nutritionPer100g;

    if (name.contains('chicken') ||
        name.contains('beef') ||
        name.contains('pork')) {
      nutritionPer100g = {
        'calories': 200,
        'protein': 25,
        'carbs': 0,
        'fat': 10,
      };
    } else if (name.contains('rice') ||
        name.contains('pasta') ||
        name.contains('bread')) {
      nutritionPer100g = {'calories': 350, 'protein': 8, 'carbs': 70, 'fat': 2};
    } else if (name.contains('vegetable') ||
        name.contains('lettuce') ||
        name.contains('broccoli')) {
      nutritionPer100g = {'calories': 25, 'protein': 3, 'carbs': 5, 'fat': 0.3};
    } else if (name.contains('oil') || name.contains('butter')) {
      nutritionPer100g = {
        'calories': 900,
        'protein': 0,
        'carbs': 0,
        'fat': 100,
      };
    } else if (name.contains('milk') || name.contains('yogurt')) {
      nutritionPer100g = {'calories': 60, 'protein': 3.5, 'carbs': 5, 'fat': 3};
    } else if (name.contains('cheese')) {
      nutritionPer100g = {
        'calories': 350,
        'protein': 25,
        'carbs': 2,
        'fat': 28,
      };
    } else if (name.contains('nuts') || name.contains('almond')) {
      nutritionPer100g = {
        'calories': 580,
        'protein': 20,
        'carbs': 20,
        'fat': 50,
      };
    } else if (name.contains('berries') || name.contains('fruit')) {
      nutritionPer100g = {
        'calories': 50,
        'protein': 1,
        'carbs': 12,
        'fat': 0.3,
      };
    } else if (name.contains('oats') || name.contains('oatmeal')) {
      nutritionPer100g = {
        'calories': 380,
        'protein': 13,
        'carbs': 65,
        'fat': 7,
      };
    } else {
      // Default values for unknown ingredients
      nutritionPer100g = {'calories': 150, 'protein': 5, 'carbs': 20, 'fat': 5};
    }

    // Calculate for actual quantity
    final factor = quantity / 100;
    return {
      'calories': nutritionPer100g['calories']! * factor,
      'protein': nutritionPer100g['protein']! * factor,
      'carbs': nutritionPer100g['carbs']! * factor,
      'fat': nutritionPer100g['fat']! * factor,
    };
  }
}
