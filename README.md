# EventHorizon

**A belief-risk sensing layer that detects regime shifts before price — built for governance, not trading.**

---

## What EventHorizon Does

EventHorizon is read-only infrastructure for measuring how beliefs change across prediction markets. We export measurements, not decisions.

- **Aggregates prediction-market probabilities** across venues
- **Tracks belief velocity and acceleration** — how fast are probabilities moving?
- **Weights conviction by liquidity** — separate noise from signal
- **Detects consensus, divergence, and tail activation** — where is the market agreeing or splitting?
- **Flags regime transitions** — catch the phase shift before it hits price

---

## What EventHorizon Does NOT Do

This matters. Read it.

| We Do NOT | Why |
|-----------|-----|
| Trade | No execution, ever |
| Optimize | No strategy generation |
| Recommend actions | No signals, no calls |
| Front-run | No position-taking on observed data |
| Extract alpha | No proprietary trading on sensor outputs |
| Compete with builders | Your edge stays yours |

**EventHorizon is infrastructure, not a trading desk.**

If you're looking for a place to trade outcomes, use Polymarket or Kalshi.
If you're looking to understand how beliefs are changing, you're in the right place.

---

## How This Differs from Prediction Markets

| Polymarket / Kalshi | EventHorizon |
|---------------------|--------------|
| Places to place bets | Does not accept bets |
| Capital at risk | No capital involved |
| Prices reflect incentives + positioning | Observes price dynamics only |
| Built for trading outcomes | Built for risk awareness |
| Where beliefs are expressed | Where belief dynamics are understood |

**They are where beliefs are expressed.**
**EventHorizon is where belief dynamics are understood.**

---

## For Builders

EventHorizon is designed for contribution at the sensor layer.

Think Android's explosion of sensors — accelerometers, gyroscopes, barometers — each measuring something different, all feeding into a unified awareness layer.

We want the same for belief dynamics.

### What You Can Contribute

**Sensors** — new ways of observing belief changes:

- Probability velocity detectors
- Probability acceleration monitors
- Liquidity-weighted conviction meters
- Divergence vs. consensus trackers
- Surprise formation sensors
- Regime transition detectors
- Cross-market correlation observers
- Tail activation monitors

The question is always:

> "Here's a better way to see something changing."

Never:

> "Here's how to make money from it."

### What You Cannot Contribute

- Trading strategies
- Execution logic
- PnL optimization
- Position recommendations
- Alpha extraction methods
- Anything that outputs "buy" or "sell"

**No strategies. No execution. No PnL.**

---

## Why Contribute?

| Benefit | What It Means |
|---------|---------------|
| **Distribution** | Your sensor runs on real belief data at scale |
| **Credibility** | Live evaluation against other sensors |
| **Fair Evaluation** | Standardized metrics, transparent performance |
| **Institutional Visibility** | Serious players see what you've built |
| **Attribution** | Your name stays on your sensor |
| **No Alpha Extraction** | We don't trade on your outputs |
| **Private Use** | You can still use your sensor privately elsewhere |

You build a read-only module.
We provide standardized interfaces + belief data.
Your sensor is evaluated live alongside others.
You keep attribution and can use it anywhere else.

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/eventhorizon.git

# Install dependencies
npm install

# Build
npm run build
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for sensor contribution guidelines.
See [docs/sensor-interface.md](./docs/sensor-interface.md) for the technical specification.

---

## Architecture

```
eventhorizon/
├── src/
│   ├── interfaces/       # Sensor interfaces and types
│   ├── sensors/          # Community-contributed sensors
│   ├── data/             # Belief data adapters
│   └── evaluation/       # Sensor credibility framework
├── docs/
│   ├── sensor-interface.md
│   ├── evaluation-framework.md
│   └── examples/
└── CONTRIBUTING.md
```

---

## License

MIT — Build freely, contribute openly.

---

**EventHorizon: The place serious builders go when they want their signals to be seen, tested, and trusted.**
