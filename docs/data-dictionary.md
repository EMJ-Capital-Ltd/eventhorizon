# 📂 Data Dictionary: EventHorizon Signal Schema

**Version:** 1.0 (Comprehensive)
**Format:** CSV (Daily Resolution)
**Location:** `data/signals/*.csv`

## **Overview**

The core of EventHorizon IQ is the **Signal Series**. Unlike traditional financial charts that track Price (OHLC), we track **Belief Physics**—specifically the consensus probability, the uncertainty surrounding it, and the quality of the market structure backing it.

Each CSV file represents a single **Risk Sensor** observing a specific event (e.g., *"BTC Miner Capitulation"*).

---

## **1. Core Columns (Required)**

These fields are mandatory for every sensor to render the primary "Unified Chart."

| Column | Type | Range | Definition | Visual Mapping |
| --- | --- | --- | --- | --- |
| **`date`** | Date | `YYYY-MM-DD` | The observation date. Must be continuous (no missing days). | **X-Axis** |
| **`p`** | Float | `0.0` - `1.0` | **Probability (Consensus).** The aggregated market probability of the event occurring. | **The Signal Line** (Primary color) |
| **`low`** | Float | `0.0` - `1.0` | **Lower Bound.** The lowest conviction level in the active participant pool (e.g., 5th percentile). | **The Shaded Band** (Bottom edge) |
| **`high`** | Float | `0.0` - `1.0` | **Upper Bound.** The highest conviction level in the active participant pool (e.g., 95th percentile). | **The Shaded Band** (Top edge) |

---

## **2. Metadata Columns (Optional)**

These fields add context to the core signal, describing the "Quality" and "Reasoning" behind the numbers.

| Column | Type | Range | Definition | Visual Mapping |
| --- | --- | --- | --- | --- |
| **`liquidity`** | Float | `0.0` - `1.0` | **Conviction Weight.** Normalized value representing capital depth. `1.0` = Highly Liquid, `0.0` = Illiquid. | **Line Opacity / Stroke Weight** |
| **`n`** | Int | `0` - `∞` | **Sample Size.** The number of distinct trades or signals backing the probability. | **Tooltip Metadata** |
| **`sentiment`** | String | Text | **Regime Label.** A human-readable tag describing the market driver (e.g., "panic", "rumor", "fed_speech"). | **Timeline Annotations** |

---

## **3. Advanced Market Structure (Future-Proofing)**

These fields track **Game Theoretic Security** and **Reflexivity**. They allow the system to filter out "Whale Manipulation" and spot "Belief/Price Divergence."

| Column | Type | Range | Definition | Strategic Value |
| --- | --- | --- | --- | --- |
| **`ref_value`** | Float | `$` Value | **Reference Price.** The price of the underlying asset (e.g., BTC, SPX) at the time of observation. | Enables **Reflexivity Analysis** (Dual-Axis Chart: Belief vs. Price). |
| **`concentration`** | Float | `0.0` - `1.0` | **Herfindahl Index.** Measures how distributed the belief is. `0.9` = One Whale (Fragile). `0.1` = Broad Consensus (Robust). | Flags **Manipulation Risk**. High concentration = Low Trust. |
| **`cost_to_move`** | Float | `$` USD | **Resilience / Market Depth.** The capital cost required to shift the probability by 1%. | Measures **Signal Hardness**. Low cost = Easy to attack. |

---

## **4. Derived Metrics (Calculated Frontend-Side)**

The application uses the columns above to calculate the "Physics" of belief in real-time.

### **A. Dispersion (The "Confusion" Metric)**

* **Formula:** `high - low`
* **Unit:** Percentage Points (`pp`)
* **Meaning:** Represents the width of the shaded band.
* **Low Dispersion (<10pp):** Strong Consensus. The market agrees.
* **High Dispersion (>30pp):** High Uncertainty. The market is fragmented.



### **B. Velocity (The "Speed" Metric)**

* **Formula:** 3-Day Simple Moving Average (SMA) of the daily change in `p`.
* **Meaning:** How fast is the market changing its mind?
* **High Velocity:** Indicates a "Shock" or sudden repricing event.



### **C. Fragility (The "Danger" Signal)**

* **Formula:** `(p is Rising)` AND `(Dispersion is Widening)`
* **Visual:** The line goes UP, but the shadow gets WIDER.
* **Interpretation:** "The market is betting the event will happen, but they are becoming *less* sure about it." This pattern often precedes volatility.

### **D. Reflexivity (The "Divergence" Signal)**

* **Formula:** Correlation between `p` (Probability) and `ref_value` (Price).
* **Interpretation:**
* **Convergent:** Price and Belief move together (Normal).
* **Divergent:** Belief spikes (Panic) while Price stays flat. **This is the Alpha signal.**