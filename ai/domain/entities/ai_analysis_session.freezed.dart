// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'ai_analysis_session.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$UserCorrection {
  String get field => throw _privateConstructorUsedError;
  String get originalValue => throw _privateConstructorUsedError;
  String get correctedValue => throw _privateConstructorUsedError;
  DateTime get timestamp => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $UserCorrectionCopyWith<UserCorrection> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $UserCorrectionCopyWith<$Res> {
  factory $UserCorrectionCopyWith(
          UserCorrection value, $Res Function(UserCorrection) then) =
      _$UserCorrectionCopyWithImpl<$Res, UserCorrection>;
  @useResult
  $Res call(
      {String field,
      String originalValue,
      String correctedValue,
      DateTime timestamp});
}

/// @nodoc
class _$UserCorrectionCopyWithImpl<$Res, $Val extends UserCorrection>
    implements $UserCorrectionCopyWith<$Res> {
  _$UserCorrectionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? field = null,
    Object? originalValue = null,
    Object? correctedValue = null,
    Object? timestamp = null,
  }) {
    return _then(_value.copyWith(
      field: null == field
          ? _value.field
          : field // ignore: cast_nullable_to_non_nullable
              as String,
      originalValue: null == originalValue
          ? _value.originalValue
          : originalValue // ignore: cast_nullable_to_non_nullable
              as String,
      correctedValue: null == correctedValue
          ? _value.correctedValue
          : correctedValue // ignore: cast_nullable_to_non_nullable
              as String,
      timestamp: null == timestamp
          ? _value.timestamp
          : timestamp // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$UserCorrectionImplCopyWith<$Res>
    implements $UserCorrectionCopyWith<$Res> {
  factory _$$UserCorrectionImplCopyWith(_$UserCorrectionImpl value,
          $Res Function(_$UserCorrectionImpl) then) =
      __$$UserCorrectionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String field,
      String originalValue,
      String correctedValue,
      DateTime timestamp});
}

/// @nodoc
class __$$UserCorrectionImplCopyWithImpl<$Res>
    extends _$UserCorrectionCopyWithImpl<$Res, _$UserCorrectionImpl>
    implements _$$UserCorrectionImplCopyWith<$Res> {
  __$$UserCorrectionImplCopyWithImpl(
      _$UserCorrectionImpl _value, $Res Function(_$UserCorrectionImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? field = null,
    Object? originalValue = null,
    Object? correctedValue = null,
    Object? timestamp = null,
  }) {
    return _then(_$UserCorrectionImpl(
      field: null == field
          ? _value.field
          : field // ignore: cast_nullable_to_non_nullable
              as String,
      originalValue: null == originalValue
          ? _value.originalValue
          : originalValue // ignore: cast_nullable_to_non_nullable
              as String,
      correctedValue: null == correctedValue
          ? _value.correctedValue
          : correctedValue // ignore: cast_nullable_to_non_nullable
              as String,
      timestamp: null == timestamp
          ? _value.timestamp
          : timestamp // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ));
  }
}

/// @nodoc

class _$UserCorrectionImpl implements _UserCorrection {
  const _$UserCorrectionImpl(
      {required this.field,
      required this.originalValue,
      required this.correctedValue,
      required this.timestamp});

  @override
  final String field;
  @override
  final String originalValue;
  @override
  final String correctedValue;
  @override
  final DateTime timestamp;

  @override
  String toString() {
    return 'UserCorrection(field: $field, originalValue: $originalValue, correctedValue: $correctedValue, timestamp: $timestamp)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UserCorrectionImpl &&
            (identical(other.field, field) || other.field == field) &&
            (identical(other.originalValue, originalValue) ||
                other.originalValue == originalValue) &&
            (identical(other.correctedValue, correctedValue) ||
                other.correctedValue == correctedValue) &&
            (identical(other.timestamp, timestamp) ||
                other.timestamp == timestamp));
  }

  @override
  int get hashCode =>
      Object.hash(runtimeType, field, originalValue, correctedValue, timestamp);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$UserCorrectionImplCopyWith<_$UserCorrectionImpl> get copyWith =>
      __$$UserCorrectionImplCopyWithImpl<_$UserCorrectionImpl>(
          this, _$identity);
}

abstract class _UserCorrection implements UserCorrection {
  const factory _UserCorrection(
      {required final String field,
      required final String originalValue,
      required final String correctedValue,
      required final DateTime timestamp}) = _$UserCorrectionImpl;

  @override
  String get field;
  @override
  String get originalValue;
  @override
  String get correctedValue;
  @override
  DateTime get timestamp;
  @override
  @JsonKey(ignore: true)
  _$$UserCorrectionImplCopyWith<_$UserCorrectionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
mixin _$AIAnalysisSession {
  String get id => throw _privateConstructorUsedError;
  String get userId => throw _privateConstructorUsedError;
  String get imagePath => throw _privateConstructorUsedError;
  DateTime get startedAt => throw _privateConstructorUsedError;
  AIAnalysisPhase get currentPhase => throw _privateConstructorUsedError;
  Map<String, dynamic> get phase1Results =>
      throw _privateConstructorUsedError; // initial analysis
  Map<String, dynamic> get phase2Results =>
      throw _privateConstructorUsedError; // nutrition analysis
  List<UserCorrection> get userCorrections =>
      throw _privateConstructorUsedError;
  double get finalConfidenceScore => throw _privateConstructorUsedError;
  DateTime? get completedAt => throw _privateConstructorUsedError;
  String? get errorMessage => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $AIAnalysisSessionCopyWith<AIAnalysisSession> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AIAnalysisSessionCopyWith<$Res> {
  factory $AIAnalysisSessionCopyWith(
          AIAnalysisSession value, $Res Function(AIAnalysisSession) then) =
      _$AIAnalysisSessionCopyWithImpl<$Res, AIAnalysisSession>;
  @useResult
  $Res call(
      {String id,
      String userId,
      String imagePath,
      DateTime startedAt,
      AIAnalysisPhase currentPhase,
      Map<String, dynamic> phase1Results,
      Map<String, dynamic> phase2Results,
      List<UserCorrection> userCorrections,
      double finalConfidenceScore,
      DateTime? completedAt,
      String? errorMessage});
}

/// @nodoc
class _$AIAnalysisSessionCopyWithImpl<$Res, $Val extends AIAnalysisSession>
    implements $AIAnalysisSessionCopyWith<$Res> {
  _$AIAnalysisSessionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? imagePath = null,
    Object? startedAt = null,
    Object? currentPhase = null,
    Object? phase1Results = null,
    Object? phase2Results = null,
    Object? userCorrections = null,
    Object? finalConfidenceScore = null,
    Object? completedAt = freezed,
    Object? errorMessage = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      userId: null == userId
          ? _value.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as String,
      imagePath: null == imagePath
          ? _value.imagePath
          : imagePath // ignore: cast_nullable_to_non_nullable
              as String,
      startedAt: null == startedAt
          ? _value.startedAt
          : startedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      currentPhase: null == currentPhase
          ? _value.currentPhase
          : currentPhase // ignore: cast_nullable_to_non_nullable
              as AIAnalysisPhase,
      phase1Results: null == phase1Results
          ? _value.phase1Results
          : phase1Results // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      phase2Results: null == phase2Results
          ? _value.phase2Results
          : phase2Results // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      userCorrections: null == userCorrections
          ? _value.userCorrections
          : userCorrections // ignore: cast_nullable_to_non_nullable
              as List<UserCorrection>,
      finalConfidenceScore: null == finalConfidenceScore
          ? _value.finalConfidenceScore
          : finalConfidenceScore // ignore: cast_nullable_to_non_nullable
              as double,
      completedAt: freezed == completedAt
          ? _value.completedAt
          : completedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      errorMessage: freezed == errorMessage
          ? _value.errorMessage
          : errorMessage // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AIAnalysisSessionImplCopyWith<$Res>
    implements $AIAnalysisSessionCopyWith<$Res> {
  factory _$$AIAnalysisSessionImplCopyWith(_$AIAnalysisSessionImpl value,
          $Res Function(_$AIAnalysisSessionImpl) then) =
      __$$AIAnalysisSessionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String userId,
      String imagePath,
      DateTime startedAt,
      AIAnalysisPhase currentPhase,
      Map<String, dynamic> phase1Results,
      Map<String, dynamic> phase2Results,
      List<UserCorrection> userCorrections,
      double finalConfidenceScore,
      DateTime? completedAt,
      String? errorMessage});
}

/// @nodoc
class __$$AIAnalysisSessionImplCopyWithImpl<$Res>
    extends _$AIAnalysisSessionCopyWithImpl<$Res, _$AIAnalysisSessionImpl>
    implements _$$AIAnalysisSessionImplCopyWith<$Res> {
  __$$AIAnalysisSessionImplCopyWithImpl(_$AIAnalysisSessionImpl _value,
      $Res Function(_$AIAnalysisSessionImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? userId = null,
    Object? imagePath = null,
    Object? startedAt = null,
    Object? currentPhase = null,
    Object? phase1Results = null,
    Object? phase2Results = null,
    Object? userCorrections = null,
    Object? finalConfidenceScore = null,
    Object? completedAt = freezed,
    Object? errorMessage = freezed,
  }) {
    return _then(_$AIAnalysisSessionImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      userId: null == userId
          ? _value.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as String,
      imagePath: null == imagePath
          ? _value.imagePath
          : imagePath // ignore: cast_nullable_to_non_nullable
              as String,
      startedAt: null == startedAt
          ? _value.startedAt
          : startedAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      currentPhase: null == currentPhase
          ? _value.currentPhase
          : currentPhase // ignore: cast_nullable_to_non_nullable
              as AIAnalysisPhase,
      phase1Results: null == phase1Results
          ? _value._phase1Results
          : phase1Results // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      phase2Results: null == phase2Results
          ? _value._phase2Results
          : phase2Results // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>,
      userCorrections: null == userCorrections
          ? _value._userCorrections
          : userCorrections // ignore: cast_nullable_to_non_nullable
              as List<UserCorrection>,
      finalConfidenceScore: null == finalConfidenceScore
          ? _value.finalConfidenceScore
          : finalConfidenceScore // ignore: cast_nullable_to_non_nullable
              as double,
      completedAt: freezed == completedAt
          ? _value.completedAt
          : completedAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      errorMessage: freezed == errorMessage
          ? _value.errorMessage
          : errorMessage // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc

class _$AIAnalysisSessionImpl extends _AIAnalysisSession {
  const _$AIAnalysisSessionImpl(
      {required this.id,
      required this.userId,
      required this.imagePath,
      required this.startedAt,
      required this.currentPhase,
      required final Map<String, dynamic> phase1Results,
      required final Map<String, dynamic> phase2Results,
      required final List<UserCorrection> userCorrections,
      required this.finalConfidenceScore,
      this.completedAt,
      this.errorMessage})
      : _phase1Results = phase1Results,
        _phase2Results = phase2Results,
        _userCorrections = userCorrections,
        super._();

  @override
  final String id;
  @override
  final String userId;
  @override
  final String imagePath;
  @override
  final DateTime startedAt;
  @override
  final AIAnalysisPhase currentPhase;
  final Map<String, dynamic> _phase1Results;
  @override
  Map<String, dynamic> get phase1Results {
    if (_phase1Results is EqualUnmodifiableMapView) return _phase1Results;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_phase1Results);
  }

// initial analysis
  final Map<String, dynamic> _phase2Results;
// initial analysis
  @override
  Map<String, dynamic> get phase2Results {
    if (_phase2Results is EqualUnmodifiableMapView) return _phase2Results;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_phase2Results);
  }

// nutrition analysis
  final List<UserCorrection> _userCorrections;
// nutrition analysis
  @override
  List<UserCorrection> get userCorrections {
    if (_userCorrections is EqualUnmodifiableListView) return _userCorrections;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_userCorrections);
  }

  @override
  final double finalConfidenceScore;
  @override
  final DateTime? completedAt;
  @override
  final String? errorMessage;

  @override
  String toString() {
    return 'AIAnalysisSession(id: $id, userId: $userId, imagePath: $imagePath, startedAt: $startedAt, currentPhase: $currentPhase, phase1Results: $phase1Results, phase2Results: $phase2Results, userCorrections: $userCorrections, finalConfidenceScore: $finalConfidenceScore, completedAt: $completedAt, errorMessage: $errorMessage)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AIAnalysisSessionImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.imagePath, imagePath) ||
                other.imagePath == imagePath) &&
            (identical(other.startedAt, startedAt) ||
                other.startedAt == startedAt) &&
            (identical(other.currentPhase, currentPhase) ||
                other.currentPhase == currentPhase) &&
            const DeepCollectionEquality()
                .equals(other._phase1Results, _phase1Results) &&
            const DeepCollectionEquality()
                .equals(other._phase2Results, _phase2Results) &&
            const DeepCollectionEquality()
                .equals(other._userCorrections, _userCorrections) &&
            (identical(other.finalConfidenceScore, finalConfidenceScore) ||
                other.finalConfidenceScore == finalConfidenceScore) &&
            (identical(other.completedAt, completedAt) ||
                other.completedAt == completedAt) &&
            (identical(other.errorMessage, errorMessage) ||
                other.errorMessage == errorMessage));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      userId,
      imagePath,
      startedAt,
      currentPhase,
      const DeepCollectionEquality().hash(_phase1Results),
      const DeepCollectionEquality().hash(_phase2Results),
      const DeepCollectionEquality().hash(_userCorrections),
      finalConfidenceScore,
      completedAt,
      errorMessage);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AIAnalysisSessionImplCopyWith<_$AIAnalysisSessionImpl> get copyWith =>
      __$$AIAnalysisSessionImplCopyWithImpl<_$AIAnalysisSessionImpl>(
          this, _$identity);
}

abstract class _AIAnalysisSession extends AIAnalysisSession {
  const factory _AIAnalysisSession(
      {required final String id,
      required final String userId,
      required final String imagePath,
      required final DateTime startedAt,
      required final AIAnalysisPhase currentPhase,
      required final Map<String, dynamic> phase1Results,
      required final Map<String, dynamic> phase2Results,
      required final List<UserCorrection> userCorrections,
      required final double finalConfidenceScore,
      final DateTime? completedAt,
      final String? errorMessage}) = _$AIAnalysisSessionImpl;
  const _AIAnalysisSession._() : super._();

  @override
  String get id;
  @override
  String get userId;
  @override
  String get imagePath;
  @override
  DateTime get startedAt;
  @override
  AIAnalysisPhase get currentPhase;
  @override
  Map<String, dynamic> get phase1Results;
  @override // initial analysis
  Map<String, dynamic> get phase2Results;
  @override // nutrition analysis
  List<UserCorrection> get userCorrections;
  @override
  double get finalConfidenceScore;
  @override
  DateTime? get completedAt;
  @override
  String? get errorMessage;
  @override
  @JsonKey(ignore: true)
  _$$AIAnalysisSessionImplCopyWith<_$AIAnalysisSessionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
