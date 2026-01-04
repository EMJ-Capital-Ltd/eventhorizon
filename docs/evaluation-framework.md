# Sensor Evaluation Framework

How EventHorizon measures sensor credibility, reliability, and value.

---

## Philosophy

Sensors are evaluated on their ability to measure belief dynamics accurately, not on their ability to generate trading profits.

We measure:
- Does the sensor reliably produce output?
- Is the output consistent and stable?
- Does the sensor detect real signal vs. noise?
- How does it behave during stress regimes?

We do NOT measure:
- Trading performance
- PnL
- Sharpe ratio
- Any execution-related metric

---

## Evaluation Dimensions

### 1. Reliability

Can we depend on this sensor to run?

| Metric | Description | Target |
|--------|-------------|--------|
| **Uptime** | Percentage of successful invocations | > 99.5% |
| **Error Rate** | Failed measurements / total | < 0.5% |
| **Latency P50** | Median processing time | < 50ms |
| **Latency P99** | 99th percentile processing time | < 200ms |

Sensors that crash, timeout, or produce malformed output lose credibility quickly.

### 2. Consistency

Does the sensor produce stable, reproducible results?

| Metric | Description | Method |
|--------|-------------|--------|
| **Determinism** | Same input = same output | Replay historical data |
| **Stability** | Low variance in output over similar inputs | Rolling window analysis |
| **Drift** | Output characteristics don't change unexpectedly | Long-term monitoring |

Sensors should be pure functions. Non-deterministic behavior is a red flag.

### 3. Signal Quality

Is the sensor measuring something real?

| Metric | Description | Method |
|--------|-------------|--------|
| **Information Content** | How much does output reduce uncertainty? | Entropy analysis |
| **Noise Ratio** | Signal vs. random fluctuation | Autocorrelation |
| **Lead Time** | Does it detect changes before they're obvious? | Event study around regime shifts |
| **False Positive Rate** | Alerts that don't correspond to real changes | Historical validation |

A good sensor adds information. A bad sensor adds noise.

### 4. Regime Behavior

How does the sensor perform during stress periods?

| Regime | What We Look For |
|--------|------------------|
| **Stable** | Low, consistent output; minimal false alerts |
| **Transitioning** | Early detection; clear signal increase |
| **Volatile** | Accurate tracking; appropriate uncertainty |
| **Tail** | Reliable behavior at extremes; no breakdown |

Sensors are tested against historical regime transitions:
- Elections (sudden probability swings)
- Black swan events (rapid belief revision)
- Slow consensus formation (gradual convergence)
- False breakouts (noise that looks like signal)

### 5. Cross-Sensor Correlation

How does this sensor relate to others?

| Consideration | Implication |
|---------------|-------------|
| **High correlation with existing sensor** | May be redundant |
| **Negative correlation** | Potentially valuable for ensemble |
| **Unique signal** | High value if reliable |
| **Complementary timing** | Valuable for different phases |

We value diversity in the sensor ecosystem.

---

## Scoring

Each sensor receives scores on a 0-100 scale:

```
Overall Score =
    (Reliability × 0.30) +
    (Consistency × 0.25) +
    (Signal Quality × 0.25) +
    (Regime Behavior × 0.20)
```

### Score Interpretation

| Score Range | Interpretation |
|-------------|----------------|
| 90-100 | Exceptional - core infrastructure quality |
| 80-89 | Strong - reliable for production use |
| 70-79 | Good - useful with caveats |
| 60-69 | Developing - needs improvement |
| Below 60 | Probationary - at risk of removal |

---

## Evaluation Cadence

| Evaluation Type | Frequency | Scope |
|-----------------|-----------|-------|
| **Real-time** | Continuous | Uptime, latency, errors |
| **Daily** | Every 24 hours | Consistency, output distribution |
| **Weekly** | Every 7 days | Signal quality, correlation |
| **Event-based** | On regime transitions | Regime behavior |
| **Quarterly** | Every 3 months | Full review, score recalculation |

---

## Public Metrics

Each sensor's public profile shows:

```
┌─────────────────────────────────────────────────────┐
│ velocity-exponential-weighted                       │
│ Author: sensor-builder                              │
│ Version: 2.1.0                                      │
├─────────────────────────────────────────────────────┤
│ Overall Score: 84/100                               │
├─────────────────────────────────────────────────────┤
│ Reliability:     ████████░░  92                     │
│ Consistency:     ████████░░  88                     │
│ Signal Quality:  ███████░░░  76                     │
│ Regime Behavior: ████████░░  82                     │
├─────────────────────────────────────────────────────┤
│ Uptime (30d):    99.7%                              │
│ Latency P50:     23ms                               │
│ Active Since:    2024-03-15                         │
│ Markets Covered: 847                                │
└─────────────────────────────────────────────────────┘
```

---

## Credibility Over Time

Sensors build credibility through consistent performance:

| Duration | Credibility Level |
|----------|-------------------|
| < 30 days | New - limited track record |
| 30-90 days | Establishing - building history |
| 90-180 days | Proven - significant track record |
| 180+ days | Veteran - extensive history |

Longer track records with consistent scores increase trust.

---

## Stress Testing

### Synthetic Scenarios

Sensors are tested against synthetic stress scenarios:

1. **Sudden Jump** - Probability moves 50% in 1 hour
2. **Gradual Drift** - Slow 20% move over 7 days
3. **Oscillation** - Rapid back-and-forth movement
4. **Flatline** - No movement for extended period
5. **Liquidity Shock** - 90% liquidity drop
6. **Data Gap** - Missing observations

### Historical Replay

Major historical events are replayed:
- 2020 Election night
- COVID market reactions
- Major sports upsets
- Geopolitical shocks

Sensors should handle these gracefully.

---

## Removal Criteria

Sensors may be removed for:

| Reason | Threshold |
|--------|-----------|
| Sustained low reliability | < 95% uptime for 30 days |
| Consistent errors | > 5% error rate for 14 days |
| Score degradation | Below 50 for 60 days |
| Non-determinism detected | Any confirmed case |
| Terms violation | Execution logic, external calls, etc. |

Authors are notified before removal and given opportunity to fix issues.

---

## Appeals

If you believe your sensor's evaluation is incorrect:

1. Open an issue with `evaluation-appeal` label
2. Provide specific examples of perceived mis-scoring
3. Include logs, data, or evidence
4. Allow 7 days for review

---

## Transparency

All evaluation code is open source. You can:
- Review the evaluation algorithms
- Propose improvements
- Challenge methodologies
- Suggest new metrics

The goal is fair, transparent evaluation that builds trust.

---

## Future Metrics

Under consideration:

- **Ensemble Value** - Contribution to multi-sensor aggregates
- **Regime Prediction** - Anticipation of phase transitions
- **Decay Tracking** - How sensor accuracy changes over time
- **Cross-Venue Correlation** - Behavior across different markets

---

**Credibility is earned through consistent, reliable measurement.**
**Not through profitability.**
