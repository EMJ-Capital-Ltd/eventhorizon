# Contributing a Sensor to EventHorizon

EventHorizon accepts contributions at the **sensor layer only**. This document explains what qualifies, what's forbidden, and how attribution works.

---

## What Is a Sensor?

A sensor is a read-only module that observes belief data and outputs a measurement.

Sensors answer questions like:
- "How fast is this probability moving?"
- "Is conviction increasing or decreasing?"
- "Are markets converging or diverging?"
- "Is a regime transition forming?"

Sensors do NOT answer:
- "Should I buy or sell?"
- "What's the expected profit?"
- "How do I optimize my position?"

---

## What Qualifies as a Contribution

### Accepted

| Type | Example |
|------|---------|
| Velocity sensors | Rate of probability change over time |
| Acceleration sensors | Second derivative of belief movement |
| Conviction meters | Liquidity-weighted probability confidence |
| Divergence detectors | Cross-market or cross-outcome disagreement |
| Consensus trackers | Agreement formation across venues |
| Surprise sensors | Unexpected probability jumps |
| Regime detectors | Phase transition identification |
| Correlation observers | Cross-market belief linkages |
| Tail monitors | Extreme probability activation |
| Decay sensors | Conviction half-life measurement |

### Requirements

1. **Read-only** — No side effects, no state mutation outside the sensor
2. **Pure observation** — Input is belief data, output is measurement
3. **No execution logic** — Cannot output trade signals, positions, or recommendations
4. **Deterministic** — Same input produces same output
5. **Documented** — Clear explanation of what it measures and why

---

## What Is Forbidden

These will be rejected immediately:

| Forbidden | Why |
|-----------|-----|
| Trading strategies | EventHorizon does not trade |
| Execution logic | No position-taking |
| PnL calculations | No profit measurement |
| Buy/sell signals | No action recommendations |
| Position sizing | No capital allocation |
| Risk-reward optimization | No strategy optimization |
| Alpha extraction | No proprietary edge generation |
| External API calls | No data exfiltration |
| State persistence | Sensors are stateless per invocation |

**If your sensor outputs anything resembling "do this trade," it will not be accepted.**

---

## The Sensor Interface

All sensors implement the `Sensor` interface:

```typescript
interface Sensor<TConfig = unknown> {
  // Unique identifier for this sensor
  readonly id: string;

  // Human-readable name
  readonly name: string;

  // What this sensor measures
  readonly description: string;

  // Original author
  readonly author: string;

  // Version (semver)
  readonly version: string;

  // Process belief data and return measurements
  measure(input: SensorInput): SensorOutput;
}
```

See [docs/sensor-interface.md](./docs/sensor-interface.md) for the complete specification.

---

## Attribution

Your contributions remain attributed to you.

| What You Keep | Details |
|---------------|---------|
| **Authorship** | Your name/handle on the sensor permanently |
| **Version history** | All iterations tracked under your attribution |
| **Private use rights** | Use your sensor anywhere else, commercially or not |
| **Credit in evaluations** | Performance metrics tied to your sensor ID |

| What EventHorizon Gets | Details |
|------------------------|---------|
| **Right to run** | Execute your sensor on our infrastructure |
| **Right to display** | Show outputs and performance publicly |
| **Right to evaluate** | Compare against other sensors |

**We do not claim ownership of your sensor logic.**
**We do not trade on sensor outputs.**

---

## Submission Process

### 1. Fork the Repository

```bash
git clone https://github.com/your-org/eventhorizon.git
cd eventhorizon
```

### 2. Create Your Sensor

```bash
mkdir -p src/sensors/your-sensor-name
```

Implement the `Sensor` interface in `src/sensors/your-sensor-name/index.ts`.

### 3. Add Tests

Create `src/sensors/your-sensor-name/index.test.ts` with:
- Unit tests for edge cases
- Determinism verification
- Output format validation

### 4. Document

Add a `README.md` to your sensor directory explaining:
- What belief dynamic it measures
- Why this measurement matters
- Expected output interpretation
- Limitations and known edge cases

### 5. Submit a Pull Request

Title: `sensor: [your-sensor-name]`

Include:
- Description of what the sensor measures
- Why it adds value to the sensing layer
- Any dependencies or requirements

---

## Evaluation

Once merged, your sensor enters live evaluation:

| Metric | What It Measures |
|--------|------------------|
| **Reliability** | Uptime and error rate |
| **Consistency** | Output stability over time |
| **Regime Performance** | Behavior during stress periods |
| **Signal Quality** | Information content vs. noise |
| **Latency** | Processing time |

See [docs/evaluation-framework.md](./docs/evaluation-framework.md) for details.

---

## Questions?

Open an issue with the `question` label.

---

**Build sensors, not strategies.**
**Measure dynamics, not profits.**
**Contribute to infrastructure, not alpha.**
