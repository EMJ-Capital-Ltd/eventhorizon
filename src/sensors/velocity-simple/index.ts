/**
 * Simple Velocity Sensor
 *
 * Measures the rate of probability change over a time window.
 * This is a reference implementation demonstrating the sensor interface.
 */

import type {
  Sensor,
  SensorInput,
  SensorOutput,
  SensorMetadata,
  BeliefTimeSeries,
  Confidence,
} from '../../interfaces/sensor.js';

// =============================================================================
// Configuration
// =============================================================================

interface VelocityConfig {
  /** Window size in hours for velocity calculation */
  windowHours?: number;
  /** Minimum samples required for high confidence */
  minSamplesHighConfidence?: number;
  /** Minimum samples required for medium confidence */
  minSamplesMediumConfidence?: number;
}

const DEFAULT_CONFIG: Required<VelocityConfig> = {
  windowHours: 24,
  minSamplesHighConfidence: 20,
  minSamplesMediumConfidence: 5,
};

// =============================================================================
// Metadata
// =============================================================================

const metadata: SensorMetadata = Object.freeze({
  id: 'velocity-simple',
  name: 'Simple Velocity',
  description:
    'Measures the linear rate of probability change over a configurable time window. ' +
    'Outputs probability change per hour, weighted by sample density.',
  author: 'eventhorizon',
  version: '1.0.0',
  category: 'velocity',
  inputType: 'single',
  tags: ['velocity', 'rate', 'linear', 'basic', 'reference'],
});

// =============================================================================
// Implementation
// =============================================================================

function isSingleSeries(
  series: SensorInput['series']
): series is BeliefTimeSeries {
  return 'snapshots' in series;
}

function getConfidence(
  sampleCount: number,
  config: Required<VelocityConfig>
): Confidence {
  if (sampleCount >= config.minSamplesHighConfidence) return 'high';
  if (sampleCount >= config.minSamplesMediumConfidence) return 'medium';
  return 'low';
}

function measure(input: SensorInput): SensorOutput {
  // Validate input type
  if (!isSingleSeries(input.series)) {
    throw new Error('velocity-simple requires single series input');
  }

  const series = input.series;
  const snapshots = series.snapshots;
  const config: Required<VelocityConfig> = {
    ...DEFAULT_CONFIG,
    ...(input.config as VelocityConfig),
  };

  // Handle edge case: insufficient data
  if (snapshots.length < 2) {
    return {
      sensorId: metadata.id,
      timestamp: input.now,
      marketIds: [series.marketId],
      primary: {
        value: 0,
        unit: 'prob/hour',
        confidence: 'low',
        timestamp: input.now,
      },
      metadata: {
        reason: 'insufficient_data',
        sampleCount: snapshots.length,
      },
    };
  }

  // Filter to window
  const windowMs = config.windowHours * 60 * 60 * 1000;
  const windowStart = input.now - windowMs;
  const windowedSnapshots = snapshots.filter((s) => s.timestamp >= windowStart);

  // Use all data if window filter leaves too few points
  const effectiveSnapshots =
    windowedSnapshots.length >= 2 ? windowedSnapshots : snapshots;

  const first = effectiveSnapshots[0];
  const last = effectiveSnapshots[effectiveSnapshots.length - 1];

  // Calculate velocity
  const probChange = last.probability - first.probability;
  const timeChangeMs = last.timestamp - first.timestamp;
  const timeChangeHours = timeChangeMs / (1000 * 60 * 60);

  const velocity = timeChangeHours > 0 ? probChange / timeChangeHours : 0;

  // Calculate average liquidity for context
  const avgLiquidity =
    effectiveSnapshots.reduce((sum, s) => sum + s.liquidity, 0) /
    effectiveSnapshots.length;

  return {
    sensorId: metadata.id,
    timestamp: input.now,
    marketIds: [series.marketId],
    primary: {
      value: velocity,
      unit: 'prob/hour',
      confidence: getConfidence(effectiveSnapshots.length, config),
      timestamp: input.now,
    },
    secondary: [
      {
        value: probChange,
        unit: 'prob',
        confidence: getConfidence(effectiveSnapshots.length, config),
        timestamp: input.now,
      },
      {
        value: avgLiquidity,
        unit: 'usd',
        confidence: 'high',
        timestamp: input.now,
      },
    ],
    metadata: {
      windowHours: config.windowHours,
      effectiveWindowHours: timeChangeHours,
      sampleCount: effectiveSnapshots.length,
      startProbability: first.probability,
      endProbability: last.probability,
      avgLiquidity,
    },
  };
}

function validateConfig(config: Record<string, unknown>): true | string {
  if (config.windowHours !== undefined) {
    if (typeof config.windowHours !== 'number') {
      return 'windowHours must be a number';
    }
    if (config.windowHours <= 0) {
      return 'windowHours must be positive';
    }
    if (config.windowHours > 8760) {
      return 'windowHours cannot exceed 8760 (1 year)';
    }
  }

  if (config.minSamplesHighConfidence !== undefined) {
    if (
      typeof config.minSamplesHighConfidence !== 'number' ||
      config.minSamplesHighConfidence < 1
    ) {
      return 'minSamplesHighConfidence must be a positive integer';
    }
  }

  if (config.minSamplesMediumConfidence !== undefined) {
    if (
      typeof config.minSamplesMediumConfidence !== 'number' ||
      config.minSamplesMediumConfidence < 1
    ) {
      return 'minSamplesMediumConfidence must be a positive integer';
    }
  }

  return true;
}

// =============================================================================
// Export
// =============================================================================

export const velocitySimpleSensor: Sensor = {
  metadata,
  measure,
  validateConfig,
};

export default velocitySimpleSensor;
