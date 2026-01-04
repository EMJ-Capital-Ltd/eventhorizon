# Sensor Interface Specification

This document defines the technical interface for EventHorizon sensors.

---

## Overview

A sensor is a pure function that:
- **Receives** belief data (probabilities, liquidity, timestamps)
- **Returns** measurements (values, confidence, regime state)

Sensors do not:
- Mutate state
- Make external calls
- Output trade signals
- Persist data

---

## Type Definitions

### Core Types

```typescript
type Probability = number;  // 0 to 1
type Timestamp = number;    // Unix ms
type Liquidity = number;    // USD equivalent
type MarketId = string;     // Unique market identifier
type OutcomeId = string;    // Unique outcome identifier
```

---

## Input Structure

### BeliefSnapshot

A single point-in-time observation:

```typescript
interface BeliefSnapshot {
  timestamp: Timestamp;     // When observed
  probability: Probability; // Current probability
  liquidity: Liquidity;     // Backing liquidity
  marketId: MarketId;       // Source market
  outcomeId: OutcomeId;     // Specific outcome
  venue?: string;           // Optional: polymarket, kalshi, etc.
}
```

### BeliefTimeSeries

Ordered observations for one outcome:

```typescript
interface BeliefTimeSeries {
  marketId: MarketId;
  outcomeId: OutcomeId;
  title: string;                        // Human-readable
  snapshots: readonly BeliefSnapshot[]; // Oldest first
  startTime: Timestamp;
  endTime: Timestamp;
}
```

### BeliefCorrelationData

For cross-market sensors:

```typescript
interface BeliefCorrelationData {
  primary: BeliefTimeSeries;
  related: readonly BeliefTimeSeries[];
}
```

### SensorInput

What your `measure()` function receives:

```typescript
interface SensorInput {
  series: BeliefTimeSeries | BeliefCorrelationData;
  now: Timestamp;
  config?: Record<string, unknown>;
}
```

---

## Output Structure

### Measurement

A single computed value:

```typescript
interface Measurement {
  value: number;                              // The measurement
  unit: string;                               // e.g., "prob/hour", "ratio"
  confidence: 'low' | 'medium' | 'high';      // How confident
  timestamp: Timestamp;                        // When computed
}
```

### RegimeState

Optional regime detection:

```typescript
interface RegimeState {
  regime: 'stable' | 'transitioning' | 'volatile' | 'tail';
  probability: Probability;  // Confidence in classification
  duration: number;          // Time in this regime (ms)
}
```

### SensorOutput

What your `measure()` function returns:

```typescript
interface SensorOutput {
  sensorId: string;                      // Your sensor's ID
  timestamp: Timestamp;                  // When measured
  marketIds: readonly MarketId[];        // Markets covered
  primary: Measurement;                  // Main measurement
  secondary?: readonly Measurement[];    // Optional additional
  regime?: RegimeState;                  // Optional regime
  metadata?: Record<string, unknown>;    // Optional extras
}
```

---

## Sensor Interface

```typescript
interface Sensor {
  metadata: SensorMetadata;

  measure(input: SensorInput): SensorOutput;

  validateConfig?(config: Record<string, unknown>): true | string;
}
```

### SensorMetadata

```typescript
interface SensorMetadata {
  id: string;           // Unique, lowercase, hyphenated
  name: string;         // Human-readable
  description: string;  // What it measures
  author: string;       // Your name/handle
  version: string;      // Semver (e.g., "1.0.0")
  category: SensorCategory;
  inputType: 'single' | 'correlation';
  tags: readonly string[];
}
```

### SensorCategory

```typescript
type SensorCategory =
  | 'velocity'      // Rate of probability change
  | 'acceleration'  // Second derivative
  | 'conviction'    // Liquidity-weighted confidence
  | 'divergence'    // Cross-market disagreement
  | 'consensus'     // Cross-market agreement
  | 'surprise'      // Unexpected movements
  | 'regime'        // Phase transitions
  | 'correlation'   // Cross-market relationships
  | 'tail'          // Extreme probability events
  | 'decay'         // Conviction persistence
  | 'other';
```

---

## Example Implementation

### Velocity Sensor

Measures the rate of probability change over time:

```typescript
import {
  Sensor,
  SensorInput,
  SensorOutput,
  BeliefTimeSeries,
  defineSensor
} from '../interfaces/sensor.js';

const metadata = defineSensor({
  id: 'velocity-simple',
  name: 'Simple Velocity',
  description: 'Measures probability change rate over configurable window',
  author: 'eventhorizon',
  version: '1.0.0',
  category: 'velocity',
  inputType: 'single',
  tags: ['velocity', 'rate', 'basic']
});

export const velocitySensor: Sensor = {
  metadata,

  measure(input: SensorInput): SensorOutput {
    const series = input.series as BeliefTimeSeries;
    const snapshots = series.snapshots;

    if (snapshots.length < 2) {
      return {
        sensorId: metadata.id,
        timestamp: input.now,
        marketIds: [series.marketId],
        primary: {
          value: 0,
          unit: 'prob/hour',
          confidence: 'low',
          timestamp: input.now
        }
      };
    }

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];

    const probChange = last.probability - first.probability;
    const timeChangeHours = (last.timestamp - first.timestamp) / (1000 * 60 * 60);

    const velocity = timeChangeHours > 0 ? probChange / timeChangeHours : 0;

    return {
      sensorId: metadata.id,
      timestamp: input.now,
      marketIds: [series.marketId],
      primary: {
        value: velocity,
        unit: 'prob/hour',
        confidence: snapshots.length > 10 ? 'high' : 'medium',
        timestamp: input.now
      },
      metadata: {
        windowSize: snapshots.length,
        startProb: first.probability,
        endProb: last.probability
      }
    };
  }
};
```

---

## Validation Requirements

Your sensor must pass these checks:

| Requirement | Check |
|-------------|-------|
| Deterministic | Same input always produces same output |
| Pure | No side effects, no external calls |
| Valid output | Matches `SensorOutput` interface |
| Reasonable latency | < 100ms for typical input |
| Error handling | Graceful handling of edge cases |

---

## Edge Cases to Handle

- Empty snapshot array
- Single snapshot (no delta possible)
- Zero liquidity
- Probability at 0 or 1 (boundaries)
- Large time gaps in series
- Duplicate timestamps
- Out-of-order timestamps (should not happen, but handle gracefully)

---

## Units Convention

| Measurement Type | Recommended Unit |
|------------------|------------------|
| Velocity | `prob/hour` or `prob/day` |
| Acceleration | `prob/hour²` |
| Conviction | `usd` or `ratio` |
| Divergence | `ratio` or `percentage` |
| Correlation | `coefficient` (-1 to 1) |
| Surprise | `sigma` (standard deviations) |

---

## Configuration

Sensors may accept configuration via `input.config`.

Example:

```typescript
interface VelocityConfig {
  windowHours: number;
  minSamples: number;
}

measure(input: SensorInput): SensorOutput {
  const config = (input.config ?? {}) as Partial<VelocityConfig>;
  const windowHours = config.windowHours ?? 24;
  const minSamples = config.minSamples ?? 5;
  // ...
}
```

Use `validateConfig()` to validate configuration:

```typescript
validateConfig(config: Record<string, unknown>): true | string {
  if (config.windowHours !== undefined) {
    if (typeof config.windowHours !== 'number' || config.windowHours <= 0) {
      return 'windowHours must be a positive number';
    }
  }
  return true;
}
```

---

## File Structure

```
src/sensors/your-sensor-name/
├── index.ts        # Main sensor implementation
├── index.test.ts   # Tests
└── README.md       # Documentation
```

---

## Next Steps

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md) for submission process
2. Review [evaluation-framework.md](./evaluation-framework.md) for how sensors are scored
3. Check [examples/](./examples/) for complete implementations
