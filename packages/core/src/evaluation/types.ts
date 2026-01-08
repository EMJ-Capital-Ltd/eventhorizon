/**
 * Sensor Evaluation Types
 *
 * Types for the sensor credibility and evaluation framework.
 */

import type { Timestamp } from '../interfaces/sensor.js';

// =============================================================================
// Score Types
// =============================================================================

/**
 * A score from 0 to 100
 */
export type Score = number;

/**
 * Credibility level based on track record duration
 */
export type CredibilityLevel = 'new' | 'establishing' | 'proven' | 'veteran';

// =============================================================================
// Reliability Metrics
// =============================================================================

export interface ReliabilityMetrics {
  /** Percentage of successful invocations (0-100) */
  uptime: number;

  /** Percentage of invocations that failed (0-100) */
  errorRate: number;

  /** Median processing time in milliseconds */
  latencyP50: number;

  /** 95th percentile processing time in milliseconds */
  latencyP95: number;

  /** 99th percentile processing time in milliseconds */
  latencyP99: number;

  /** Total invocations in measurement period */
  totalInvocations: number;

  /** Successful invocations in measurement period */
  successfulInvocations: number;
}

// =============================================================================
// Consistency Metrics
// =============================================================================

export interface ConsistencyMetrics {
  /** Whether the sensor is deterministic (same input = same output) */
  isDeterministic: boolean;

  /** Number of determinism tests run */
  determinismTestCount: number;

  /** Output stability score (0-100) */
  stabilityScore: Score;

  /** Long-term drift score (0-100, higher = less drift) */
  driftScore: Score;
}

// =============================================================================
// Signal Quality Metrics
// =============================================================================

export interface SignalQualityMetrics {
  /** Information content score (0-100) */
  informationScore: Score;

  /** Signal vs. noise ratio score (0-100) */
  noiseRatioScore: Score;

  /** Lead time score - detection before obvious (0-100) */
  leadTimeScore: Score;

  /** False positive rate (0-100, lower = better) */
  falsePositiveRate: number;
}

// =============================================================================
// Regime Behavior Metrics
// =============================================================================

export type RegimeType = 'stable' | 'transitioning' | 'volatile' | 'tail';

export interface RegimeBehavior {
  /** Regime type */
  regime: RegimeType;

  /** Score for behavior in this regime (0-100) */
  score: Score;

  /** Number of regime periods evaluated */
  periodCount: number;

  /** Notes on behavior */
  notes?: string;
}

export interface RegimeBehaviorMetrics {
  /** Overall regime behavior score (0-100) */
  overallScore: Score;

  /** Per-regime scores */
  byRegime: Record<RegimeType, RegimeBehavior>;
}

// =============================================================================
// Overall Evaluation
// =============================================================================

export interface EvaluationWeights {
  reliability: number;
  consistency: number;
  signalQuality: number;
  regimeBehavior: number;
}

export const DEFAULT_WEIGHTS: EvaluationWeights = {
  reliability: 0.30,
  consistency: 0.25,
  signalQuality: 0.25,
  regimeBehavior: 0.20,
};

export interface SensorEvaluation {
  /** Sensor ID */
  sensorId: string;

  /** When this evaluation was computed */
  evaluatedAt: Timestamp;

  /** Evaluation period start */
  periodStart: Timestamp;

  /** Evaluation period end */
  periodEnd: Timestamp;

  /** Overall score (0-100) */
  overallScore: Score;

  /** Component scores */
  reliability: ReliabilityMetrics & { score: Score };
  consistency: ConsistencyMetrics & { score: Score };
  signalQuality: SignalQualityMetrics & { score: Score };
  regimeBehavior: RegimeBehaviorMetrics;

  /** Credibility level based on track record */
  credibilityLevel: CredibilityLevel;

  /** Days since first evaluation */
  trackRecordDays: number;

  /** Weights used for scoring */
  weights: EvaluationWeights;
}

// =============================================================================
// Public Profile
// =============================================================================

export interface SensorPublicProfile {
  /** Sensor ID */
  sensorId: string;

  /** Sensor name */
  name: string;

  /** Sensor author */
  author: string;

  /** Current version */
  version: string;

  /** Category */
  category: string;

  /** Overall score (0-100) */
  overallScore: Score;

  /** Component scores */
  reliabilityScore: Score;
  consistencyScore: Score;
  signalQualityScore: Score;
  regimeBehaviorScore: Score;

  /** Key metrics */
  uptime30d: number;
  latencyP50: number;

  /** Track record */
  activeSince: Timestamp;
  credibilityLevel: CredibilityLevel;

  /** Coverage */
  marketsProcessed: number;

  /** Last updated */
  lastUpdated: Timestamp;
}

// =============================================================================
// Thresholds
// =============================================================================

export interface EvaluationThresholds {
  /** Minimum uptime to avoid probation (percentage) */
  minUptime: number;

  /** Maximum error rate before probation (percentage) */
  maxErrorRate: number;

  /** Minimum overall score to avoid removal */
  minOverallScore: Score;

  /** Days below threshold before removal */
  probationDays: number;
}

export const DEFAULT_THRESHOLDS: EvaluationThresholds = {
  minUptime: 95,
  maxErrorRate: 5,
  minOverallScore: 50,
  probationDays: 60,
};

// =============================================================================
// Helpers
// =============================================================================

export function getCredibilityLevel(trackRecordDays: number): CredibilityLevel {
  if (trackRecordDays < 30) return 'new';
  if (trackRecordDays < 90) return 'establishing';
  if (trackRecordDays < 180) return 'proven';
  return 'veteran';
}

export function calculateOverallScore(
  evaluation: Pick<
    SensorEvaluation,
    'reliability' | 'consistency' | 'signalQuality' | 'regimeBehavior'
  >,
  weights: EvaluationWeights = DEFAULT_WEIGHTS
): Score {
  return (
    evaluation.reliability.score * weights.reliability +
    evaluation.consistency.score * weights.consistency +
    evaluation.signalQuality.score * weights.signalQuality +
    evaluation.regimeBehavior.overallScore * weights.regimeBehavior
  );
}

export function formatScore(score: Score): string {
  return Math.round(score).toString().padStart(2, ' ');
}

export function getScoreBar(score: Score, width: number = 10): string {
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
