# **EventHorizon IQ: Project Overview**

### **1. The Mission**

EventHorizon IQ is a **Risk Event Registry** and **Belief Sensing Layer**.
We are building "Bloomberg Terminal" infrastructure for tracking **market belief fragility** before it shows up in price.

* **What it is:** A read-only dashboard that aggregates specific "Risk Sensors" (data feeds) to visualize how market confidence is changing ahead of critical events.
* **Who it is for:** Risk managers, governance desks, and institutional researchers.
* **What it is NOT:** It is **not** a prediction market, a trading platform, or a casino. We do not facilitate bets; we observe them.

### **2. The Core Value Proposition**

Most tools show you the **Price** (what is happening now).
EventHorizon shows you the **Belief Structure** (what the market *thinks* will happen next).

We track three specific physics of belief:

1. **Probability:** The market's consensus likelihood of an event.
2. **Dispersion:** The "Cloud of Doubt." High dispersion means the market is confused or fragmented.
3. **Velocity:** How fast the market is changing its mind.

**The "Alpha":** We specifically look for **Fragile Conviction**—moments where the probability line is going UP (confidence), but the dispersion band is getting WIDER (confusion). This pattern often predicts a violent market snap.

---

### **3. Architecture: "Repo-First"**

We do not use a traditional database. The "Truth" lives in the code repository. This ensures transparency, version control, and immutability for our sensors.

* **Stack:** Next.js (App Router), Tailwind CSS, Recharts.
* **Data Source:** Local Filesystem (`fs`).
* **Contribution Model:** Users contribute data by opening a Pull Request (PR) to the repo, just like contributing code.

### **4. Data Models**

#### **A. The Event (`data/events.json`)**

The "Topic" being watched.

* **Definition:** A JSON object defining the scenario.
* **Key Fields:**
* `slug`: Unique ID (e.g., `btc-miner-capitulation`).
* `window`: The date range when the risk is active (e.g., `Jan 1 - Apr 1`).
* `category`: Macro, Regulatory, Liquidity, Protocol.



#### **B. The Sensor (`data/signals/*.csv`)**

The "Instrument" watching the topic.

* **Definition:** A CSV file containing the time-series data.
* **Resolution:** **Daily**. (Standardized format).
* **Schema:**
```csv
date,p,low,high
2025-10-01,0.45,0.30,0.60

```


* `p`: Probability (0.0 - 1.0).
* `low/high`: The confidence interval (Dispersion band).



---

### **5. Key Concepts & Terminology**

| Term | Definition |
| --- | --- |
| **Regime Risk** | A composite score (Low/Med/High) indicating how dangerous the current moment is. It combines *Velocity* (Speed) and *Dispersion* (Confusion). |
| **Velocity** | The speed of belief change. Calculated as a **3-Day Simple Moving Average** of the daily probability delta. |
| **Dispersion** | The width of the disagreement band. Measured in percentage points (`pp`). |
| **Fragility** | A specific warning state where `Probability` is rising AND `Dispersion` is widening simultaneously. |
| **Lead Time** | The gap between the "Observation" (Today) and the "Event Window" (Future). We visualize the *anticipation* of the risk. |

---

### **6. Application Structure**

* **The Registry (Home):** A "Command Center" view.
* **Goal:** Scan 50+ sensors in seconds.
* **Features:** Status Ticker, Sparklines, sorting by "Regime Risk."


* **The Sensor Detail (Page):** A deep-dive analysis view.
* **Goal:** Visualize the belief structure.
* **Features:** Unified Chart (Signal + Band), Velocity Readout, "Fragile" Warnings.



### **7. Developer Guidelines**

* **Aesthetic:** "Deep Dark Mode" (Zinc-950). Use **JetBrains Mono** for all data values. Alignment is critical.
* **Tone:** "Defensive." This is a tool for professionals. Avoid marketing fluff. Use terms like "Read-Only," "Sensor," "Signal."
* **Data Integrity:** Never interpolate blindly. If data is missing, the chart should show a gap or handle it gracefully. We prioritize accuracy over smoothness.

---

**Goal:** Ship a stable, "Institutional-Grade" artifact that risk desks can bookmark and trust.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.