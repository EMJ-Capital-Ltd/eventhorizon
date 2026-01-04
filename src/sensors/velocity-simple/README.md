# Simple Velocity Sensor

A reference implementation of a velocity sensor for EventHorizon.

## What It Measures

The rate of probability change over time, expressed as probability points per hour.

**Example:** If a market moves from 0.40 to 0.52 over 4 hours, the velocity is:
```
(0.52 - 0.40) / 4 = 0.03 prob/hour
```

This means the probability is increasing at 3 percentage points per hour.

## Why This Matters

Velocity tells you how fast beliefs are changing:

- **High positive velocity**: Conviction building rapidly toward YES
- **High negative velocity**: Conviction building rapidly toward NO
- **Near-zero velocity**: Stable belief, low activity
- **Velocity reversal**: Possible regime change

## Output

### Primary Measurement

| Field | Description |
|-------|-------------|
| `value` | Probability change per hour |
| `unit` | `prob/hour` |
| `confidence` | Based on sample count |

### Secondary Measurements

1. **Total probability change** (`prob`) - Raw delta over window
2. **Average liquidity** (`usd`) - Mean liquidity in window

### Metadata

- `windowHours`: Configured window size
- `effectiveWindowHours`: Actual time span used
- `sampleCount`: Number of observations
- `startProbability`: Probability at window start
- `endProbability`: Probability at window end
- `avgLiquidity`: Mean liquidity

## Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `windowHours` | number | 24 | Lookback window in hours |
| `minSamplesHighConfidence` | number | 20 | Samples needed for high confidence |
| `minSamplesMediumConfidence` | number | 5 | Samples needed for medium confidence |

## Example Usage

```typescript
import { velocitySimpleSensor } from './index.js';

const input = {
  series: {
    marketId: 'market-123',
    outcomeId: 'yes',
    title: 'Will X happen?',
    snapshots: [
      { timestamp: 1704067200000, probability: 0.40, liquidity: 50000, marketId: 'market-123', outcomeId: 'yes' },
      { timestamp: 1704070800000, probability: 0.42, liquidity: 52000, marketId: 'market-123', outcomeId: 'yes' },
      { timestamp: 1704074400000, probability: 0.48, liquidity: 55000, marketId: 'market-123', outcomeId: 'yes' },
      { timestamp: 1704078000000, probability: 0.52, liquidity: 60000, marketId: 'market-123', outcomeId: 'yes' },
    ],
    startTime: 1704067200000,
    endTime: 1704078000000,
  },
  now: 1704078000000,
  config: {
    windowHours: 24,
  },
};

const output = velocitySimpleSensor.measure(input);
console.log(output.primary.value); // ~0.04 prob/hour
```

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Empty snapshots | Returns 0 velocity with low confidence |
| Single snapshot | Returns 0 velocity with low confidence |
| Window has < 2 points | Uses full series instead |
| Zero time delta | Returns 0 velocity |

## Limitations

- **Linear assumption**: Calculates simple slope, ignores non-linear patterns
- **No weighting**: All observations weighted equally (consider liquidity-weighted variant)
- **Point-to-point**: Only uses first and last observations in window

## When to Use

- Quick overview of belief momentum
- Baseline comparison for more sophisticated sensors
- High-frequency monitoring where speed matters

## When NOT to Use

- When you need to detect acceleration (use acceleration sensor)
- When liquidity weighting is critical (use conviction-weighted variant)
- When non-linear patterns matter (use more sophisticated models)

## Author

eventhorizon (reference implementation)

## Version History

- 1.0.0: Initial release
