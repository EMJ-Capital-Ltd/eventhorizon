import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';
import type { EventDefinition, SignalPoint, StressResult } from './types';

const DATA_DIR = path.join(process.cwd(), 'src/data');

export async function getEvents(): Promise<EventDefinition[]> {
  const filePath = path.join(DATA_DIR, 'events.json');
  const fileContents = await fs.readFile(filePath, 'utf-8');
  const events: EventDefinition[] = JSON.parse(fileContents);
  return events.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getEvent(slug: string): Promise<EventDefinition | undefined> {
  const events = await getEvents();
  return events.find((e) => e.slug === slug);
}

interface RawSignalRow {
  date: string;
  p: string;
  low?: string;
  high?: string;
  // Phase 3: Signal Fidelity
  liquidity?: string;
  sentiment?: string;
  // Phase 4: Advanced Market Structure
  ref_value?: string;
  concentration?: string;
  cost_to_move?: string;
}

export async function loadSignal(slug: string): Promise<SignalPoint[]> {
  const filePath = path.join(DATA_DIR, 'signals', `${slug}.csv`);

  try {
    const fileContents = await fs.readFile(filePath, 'utf-8');

    const result = Papa.parse<RawSignalRow>(fileContents, {
      header: true,
      skipEmptyLines: true,
    });

    const points: SignalPoint[] = result.data.map((row) => {
      const p = clamp(parseFloat(row.p) || 0, 0, 1);
      const low = row.low ? clamp(parseFloat(row.low), 0, 1) : undefined;
      const high = row.high ? clamp(parseFloat(row.high), 0, 1) : undefined;

      // Phase 3: Signal Fidelity
      const liquidity = row.liquidity ? clamp(parseFloat(row.liquidity), 0, 1) : 1.0;
      const sentiment = row.sentiment ? row.sentiment.trim() : undefined;

      // Phase 4: Advanced Market Structure (parse but don't display yet)
      const ref_value = row.ref_value ? parseFloat(row.ref_value) : undefined;
      const concentration = row.concentration ? clamp(parseFloat(row.concentration), 0, 1) : undefined;
      const cost_to_move = row.cost_to_move ? parseFloat(row.cost_to_move) : undefined;

      return {
        date: row.date,
        p,
        low,
        high,
        liquidity,
        sentiment,
        ref_value,
        concentration,
        cost_to_move,
      };
    });

    return points.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate velocity using 3-day Simple Moving Average (SMA)
 * Returns the average rate of probability change over the last 3 days
 *
 * @param points Signal data points (must be sorted by date ascending)
 * @returns Velocity in decimal form (e.g., 0.004 = +0.4pp/d)
 */
export function calculateVelocity(points: SignalPoint[]): number {
  if (points.length < 4) return 0;

  const t0 = points[points.length - 1]; // Today
  const t1 = points[points.length - 2]; // Yesterday
  const t2 = points[points.length - 3]; // 2 days ago
  const t3 = points[points.length - 4]; // 3 days ago

  // Calculate daily deltas (directional, can be negative)
  const delta1 = t0.p - t1.p;
  const delta2 = t1.p - t2.p;
  const delta3 = t2.p - t3.p;

  // 3-day Simple Moving Average
  const velocity = (delta1 + delta2 + delta3) / 3;

  return velocity;
}

/**
 * Detect "Fragile Conviction" - when probability rises alongside widening uncertainty
 * Uses 1-day sensitivity check (today vs yesterday)
 *
 * @param points Signal data points (must be sorted by date ascending)
 * @returns true if fragility detected, false otherwise
 */
export function detectFragility(points: SignalPoint[]): boolean {
  if (points.length < 2) return false;

  const current = points[points.length - 1];
  const previous = points[points.length - 2];

  // Check if probability is rising
  const probRising = current.p > previous.p;

  // Calculate current and previous dispersion
  const currentDispersion = (current.high !== undefined && current.low !== undefined)
    ? (current.high - current.low)
    : 0;
  const previousDispersion = (previous.high !== undefined && previous.low !== undefined)
    ? (previous.high - previous.low)
    : 0;

  // Check if dispersion is widening
  const dispersionWidening = currentDispersion > previousDispersion;

  // Fragility: Probability goes UP but Consensus BREAKS
  return probRising && dispersionWidening;
}

/**
 * Compute Regime Risk level based on belief velocity and dispersion
 * Updated for daily data resolution with 3-day SMA velocity
 *
 * @param points Signal data points (must be sorted by date ascending)
 * @returns StressResult with level (high/med/low) and rationale
 */
export function computeStress(points: SignalPoint[]): StressResult {
  if (points.length < 4) {
    return { level: 'med', rationale: 'Insufficient history; defaulting to Elevated.' };
  }

  const last = points[points.length - 1];

  // Use 3-day SMA velocity (absolute value for stress calculation)
  const velocity = Math.abs(calculateVelocity(points));

  // Band width (dispersion)
  const band = (last.high !== undefined && last.low !== undefined)
    ? (last.high - last.low)
    : 0.18;

  // Daily data scaling: velocity multiplier increased from 1.6x to 4.0x
  const score = (velocity * 4.0) + (band * 1.2);

  // Convert to percentage points for display
  const velocityPP = (velocity * 100).toFixed(2);
  const dispersionPP = (band * 100).toFixed(1);

  if (score >= 0.45) {
    return {
      level: 'high',
      rationale: `Transitioning regime (velocity=${velocityPP}pp/d, dispersion=${dispersionPP}pp). Regime Risk measures belief instability and consensus breakdown, not outcome certainty.`
    };
  }
  if (score >= 0.28) {
    return {
      level: 'med',
      rationale: `Elevated regime risk (velocity=${velocityPP}pp/d, dispersion=${dispersionPP}pp). Regime Risk measures belief instability and consensus breakdown, not outcome certainty.`
    };
  }
  return {
    level: 'low',
    rationale: `Stable regime (velocity=${velocityPP}pp/d, dispersion=${dispersionPP}pp). Regime Risk measures belief instability and consensus breakdown, not outcome certainty.`
  };
}
