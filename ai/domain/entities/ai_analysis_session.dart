import 'package:freezed_annotation/freezed_annotation.dart';

part 'ai_analysis_session.freezed.dart';

enum AIAnalysisPhase {
  initial,
  ingredientAnalysis,
  nutritionAnalysis,
  completed,
  failed,
}

@freezed
class UserCorrection with _$UserCorrection {
  const factory UserCorrection({
    required String field,
    required String originalValue,
    required String correctedValue,
    required DateTime timestamp,
  }) = _UserCorrection;
}

@freezed
class AIAnalysisSession with _$AIAnalysisSession {
  const factory AIAnalysisSession({
    required String id,
    required String userId,
    required String imagePath,
    required DateTime startedAt,
    required AIAnalysisPhase currentPhase,
    required Map<String, dynamic> phase1Results, // initial analysis
    required Map<String, dynamic> phase2Results, // nutrition analysis
    required List<UserCorrection> userCorrections,
    required double finalConfidenceScore,
    DateTime? completedAt,
    String? errorMessage,
  }) = _AIAnalysisSession;

  const AIAnalysisSession._();

  bool get isCompleted => currentPhase == AIAnalysisPhase.completed;
  bool get hasFailed => currentPhase == AIAnalysisPhase.failed;
  
  Duration get duration {
    final endTime = completedAt ?? DateTime.now();
    return endTime.difference(startedAt);
  }
}