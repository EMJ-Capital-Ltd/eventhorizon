# Example: Divergence Sensor

This document outlines how you might build a divergence sensor — one that detects when different markets or venues disagree about the same outcome.

---

## What It Measures

Divergence sensors detect disagreement:

- Cross-venue divergence: Polymarket says 60%, Kalshi says 72%
- Cross-market divergence: Related markets moving in opposite directions
- Internal divergence: YES/NO probabilities not summing correctly

## Why This Matters

Divergence signals uncertainty or arbitrage:

- **High divergence**: Markets disagree, information asymmetry exists
- **Low divergence**: Consensus, stable belief
- **Divergence spike**: New information, market catching up
- **Divergence collapse**: Convergence, consensus forming

## Proposed Interface

```typescript
interface DivergenceSensorInput {
  // Multiple series for the same outcome across venues/markets
  series: BeliefCorrelationData;
  now: Timestamp;
  config?: {
    // How to weight by liquidity
    liquidityWeighting: 'none' | 'linear' | 'sqrt';
    // Minimum liquidity to include
    minLiquidity: number;
  };
}
```

## Proposed Output

```typescript
interface DivergenceOutput extends SensorOutput {
  primary: {
    value: number;        // Divergence score (0 = perfect agreement)
    unit: 'ratio';
    confidence: Confidence;
    timestamp: Timestamp;
  };
  secondary: [
    {
      value: number;      // Max pairwise divergence
      unit: 'prob';
      confidence: Confidence;
      timestamp: Timestamp;
    },
    {
      value: number;      // Number of venues compared
      unit: 'count';
      confidence: 'high';
      timestamp: Timestamp;
    }
  ];
  metadata: {
    venues: string[];
    probabilities: Record<string, number>;
    liquidities: Record<string, number>;
    pairwiseDivergences: Array<{
      venue1: string;
      venue2: string;
      divergence: number;
    }>;
  };
}
```

## Algorithm Sketch

```typescript
function measureDivergence(input: DivergenceSensorInput): DivergenceOutput {
  const { primary, related } = input.series;
  const allSeries = [primary, ...related];

  // Get latest probability from each series
  const latestProbs = allSeries.map(s => ({
    venue: s.snapshots[s.snapshots.length - 1].venue ?? 'unknown',
    probability: s.snapshots[s.snapshots.length - 1].probability,
    liquidity: s.snapshots[s.snapshots.length - 1].liquidity,
  }));

  // Calculate weighted mean
  const totalLiquidity = latestProbs.reduce((sum, p) => sum + p.liquidity, 0);
  const weightedMean = latestProbs.reduce(
    (sum, p) => sum + (p.probability * p.liquidity) / totalLiquidity,
    0
  );

  // Calculate divergence as weighted standard deviation from mean
  const variance = latestProbs.reduce((sum, p) => {
    const weight = p.liquidity / totalLiquidity;
    return sum + weight * Math.pow(p.probability - weightedMean, 2);
  }, 0);

  const divergence = Math.sqrt(variance);

  // Calculate max pairwise divergence
  let maxDivergence = 0;
  for (let i = 0; i < latestProbs.length; i++) {
    for (let j = i + 1; j < latestProbs.length; j++) {
      const diff = Math.abs(latestProbs[i].probability - latestProbs[j].probability);
      maxDivergence = Math.max(maxDivergence, diff);
    }
  }

  return {
    sensorId: 'divergence-weighted',
    timestamp: input.now,
    marketIds: allSeries.map(s => s.marketId),
    primary: {
      value: divergence,
      unit: 'ratio',
      confidence: latestProbs.length >= 3 ? 'high' : 'medium',
      timestamp: input.now,
    },
    secondary: [
      {
        value: maxDivergence,
        unit: 'prob',
        confidence: 'high',
        timestamp: input.now,
      },
      {
        value: latestProbs.length,
        unit: 'count',
        confidence: 'high',
        timestamp: input.now,
      },
    ],
    metadata: {
      venues: latestProbs.map(p => p.venue),
      probabilities: Object.fromEntries(latestProbs.map(p => [p.venue, p.probability])),
      liquidities: Object.fromEntries(latestProbs.map(p => [p.venue, p.liquidity])),
      pairwiseDivergences: [],  // Populate in full implementation
    },
  };
}
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Single venue | Return 0 divergence with low confidence |
| Zero liquidity venue | Exclude from calculation |
| Missing timestamps | Use latest available |
| Large time gaps | Flag in metadata, reduce confidence |

## Interpretation Guide

| Divergence | Meaning |
|------------|---------|
| 0.00 - 0.02 | Strong consensus |
| 0.02 - 0.05 | Normal disagreement |
| 0.05 - 0.10 | Significant divergence |
| > 0.10 | Major disagreement, investigate |

## This Is NOT

- An arbitrage signal
- A trading recommendation
- A profit opportunity detector

This is a measurement of belief disagreement across venues.
The interpretation of what to do with that information is not our concern.

---

**Measure disagreement. Report it. Move on.**
