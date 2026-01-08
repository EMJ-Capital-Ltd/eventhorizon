/**
 * EventHorizon Sensor Interface
 *
 * All sensors must implement this interface.
 * Sensors are read-only modules that measure belief dynamics.
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * A probability value between 0 and 1
 */
export type Probability = number;

/**
 * Unix timestamp in milliseconds
 */
export type Timestamp = number;

/**
 * Liquidity in USD equivalent
 */
export type Liquidity = number;

/**
 * Unique identifier for a market
 */
export type MarketId = string;

/**
 * Unique identifier for an outcome within a market
 */
export type OutcomeId = string;

// =============================================================================
// Belief Data Structures
// =============================================================================

/**
 * A single observation of belief state
 */
export interface BeliefSnapshot {
  /** When this snapshot was taken */
  readonly timestamp: Timestamp;

  /** The probability at this moment */
  readonly probability: Probability;

  /** Liquidity backing this probability */
  readonly liquidity: Liquidity;

  /** Source market identifier */
  readonly marketId: MarketId;

  /** Specific outcome within the market */
  readonly outcomeId: OutcomeId;

  /** Optional venue identifier (polymarket, kalshi, etc.) */
  readonly venue?: string;
}

/**
 * Time series of belief observations for a single outcome
 */
export interface BeliefTimeSeries {
  /** Market identifier */
  readonly marketId: MarketId;

  /** Outcome identifier */
  readonly outcomeId: OutcomeId;

  /** Human-readable market title */
  readonly title: string;

  /** Ordered snapshots (oldest first) */
  readonly snapshots: readonly BeliefSnapshot[];

  /** Series start time */
  readonly startTime: Timestamp;

  /** Series end time */
  readonly endTime: Timestamp;
}

/**
 * Cross-market belief data for correlation sensors
 */
export interface BeliefCorrelationData {
  /** Primary series */
  readonly primary: BeliefTimeSeries;

  /** Related series to compare against */
  readonly related: readonly BeliefTimeSeries[];
}

// =============================================================================
// Sensor Input
// =============================================================================

/**
 * Input provided to a sensor's measure() function
 */
export interface SensorInput {
  /**
   * The belief time series to analyze
   * Single series for most sensors, multiple for correlation sensors
   */
  readonly series: BeliefTimeSeries | BeliefCorrelationData;

  /**
   * Current timestamp (when the sensor is invoked)
   */
  readonly now: Timestamp;

  /**
   * Optional configuration passed to the sensor
   */
  readonly config?: Record<string, unknown>;
}

// =============================================================================
// Sensor Output
// =============================================================================

/**
 * Confidence level in the measurement
 */
export type Confidence = 'low' | 'medium' | 'high';

/**
 * Base measurement output
 */
export interface Measurement {
  /** The computed value */
  readonly value: number;

  /** Unit of measurement */
  readonly unit: string;

  /** Confidence in this measurement */
  readonly confidence: Confidence;

  /** When this measurement was computed */
  readonly timestamp: Timestamp;
}

/**
 * Regime state detection
 */
export interface RegimeState {
  /** Current regime classification */
  readonly regime: 'stable' | 'transitioning' | 'volatile' | 'tail';

  /** Probability of being in this regime */
  readonly probability: Probability;

  /** How long in this regime (ms) */
  readonly duration: number;
}

/**
 * Output from a sensor's measure() function
 */
export interface SensorOutput {
  /** Unique sensor identifier */
  readonly sensorId: string;

  /** When the measurement was taken */
  readonly timestamp: Timestamp;

  /** Market(s) this measurement applies to */
  readonly marketIds: readonly MarketId[];

  /** Primary measurement value */
  readonly primary: Measurement;

  /** Optional secondary measurements */
  readonly secondary?: readonly Measurement[];

  /** Optional regime detection */
  readonly regime?: RegimeState;

  /** Optional metadata */
  readonly metadata?: Record<string, unknown>;
}

// =============================================================================
// Sensor Interface
// =============================================================================

/**
 * Metadata about a sensor
 */
export interface SensorMetadata {
  /** Unique identifier for this sensor */
  readonly id: string;

  /** Human-readable name */
  readonly name: string;

  /** What this sensor measures */
  readonly description: string;

  /** Original author (name or handle) */
  readonly author: string;

  /** Version (semver) */
  readonly version: string;

  /** Category of measurement */
  readonly category: SensorCategory;

  /** Required input type */
  readonly inputType: 'single' | 'correlation';

  /** Tags for discovery */
  readonly tags: readonly string[];
}

/**
 * Categories of sensors
 */
export type SensorCategory =
  | 'velocity'        // Rate of probability change
  | 'acceleration'    // Second derivative of probability
  | 'conviction'      // Liquidity-weighted confidence
  | 'divergence'      // Cross-market disagreement
  | 'consensus'       // Cross-market agreement
  | 'surprise'        // Unexpected movements
  | 'regime'          // Phase transitions
  | 'correlation'     // Cross-market relationships
  | 'tail'            // Extreme probability events
  | 'decay'           // Conviction persistence
  | 'other';          // Uncategorized

/**
 * The core sensor interface
 *
 * All contributed sensors must implement this interface.
 * Sensors are pure functions: same input always produces same output.
 */
export interface Sensor {
  /** Sensor metadata */
  readonly metadata: SensorMetadata;

  /**
   * Process belief data and return measurements
   *
   * This function must be:
   * - Pure (no side effects)
   * - Deterministic (same input = same output)
   * - Read-only (no state mutation)
   *
   * @param input - Belief data and configuration
   * @returns Measurement output
   */
  measure(input: SensorInput): SensorOutput;

  /**
   * Optional validation of configuration
   *
   * @param config - Configuration to validate
   * @returns true if valid, error message if invalid
   */
  validateConfig?(config: Record<string, unknown>): true | string;
}

// =============================================================================
// Factory Pattern (Optional)
// =============================================================================

/**
 * Factory function for creating sensor instances
 * Use this if your sensor requires initialization
 */
export type SensorFactory<TConfig = Record<string, unknown>> = (
  config: TConfig
) => Sensor;

// =============================================================================
// Export Helpers
// =============================================================================

/**
 * Helper to create sensor metadata
 */
export function defineSensor(metadata: SensorMetadata): SensorMetadata {
  return Object.freeze(metadata);
}

/**
 * Helper to validate sensor output format
 */
export function isValidOutput(output: unknown): output is SensorOutput {
  if (!output || typeof output !== 'object') return false;

  const o = output as Record<string, unknown>;

  return (
    typeof o.sensorId === 'string' &&
    typeof o.timestamp === 'number' &&
    Array.isArray(o.marketIds) &&
    o.primary !== null &&
    typeof o.primary === 'object'
  );
}
