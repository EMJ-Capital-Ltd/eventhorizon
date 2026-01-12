export type RiskCategory = 'regulatory' | 'macro' | 'liquidity' | 'protocol' | 'rwa';

export interface EventOutcome {
  key: string;
  label: string;
}

export interface EventDefinition {
  slug: string;
  title: string;
  category: RiskCategory;
  windowStart: string;
  windowEnd: string;
  outcomes: EventOutcome[];
  sources: { label: string; url: string }[];
  contributors: { name: string; handle?: string }[];
  notes?: string;
}

export interface SignalPoint {
  date: string;
  p: number;
  low?: number;
  high?: number;
  // Phase 3: Signal Fidelity
  liquidity?: number;   // 0.0-1.0, affects line opacity (default: 1.0)
  sentiment?: string;   // Narrative label for regime changes
  // Phase 4: Advanced Market Structure (future use)
  ref_value?: number;      // Price of underlying asset
  concentration?: number;  // Herfindahl Score (whale concentration)
  cost_to_move?: number;   // USD resilience metric
}

export type StressLevel = 'low' | 'med' | 'high';

export interface StressResult {
  level: StressLevel;
  rationale: string;
}
