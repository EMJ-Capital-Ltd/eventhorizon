export interface ProbabilityPoint {
  timestamp: number;
  probability: number;
  liquidity: number;
}

export type EventCategory = 'regulatory' | 'macro' | 'crypto' | 'geopolitical';
export type EventRegime = 'stable' | 'transitioning' | 'volatile' | 'tail';

export interface Event {
  id: string;
  title: string;
  category: EventCategory;
  description: string;
  currentProbability: number;
  previousProbability: number;
  velocity: number; // prob/hour
  liquidity: number;
  trajectory: ProbabilityPoint[];
  regime: EventRegime;
}

export function calculateStressIndex(events: Event[]): number {
  const volatileCount = events.filter(e => e.regime === 'volatile' || e.regime === 'tail').length;
  const transitioningCount = events.filter(e => e.regime === 'transitioning').length;
  const avgAbsVelocity = events.reduce((sum, e) => sum + Math.abs(e.velocity), 0) / events.length;

  const regimeStress = (volatileCount * 0.4 + transitioningCount * 0.2) / events.length;
  const velocityStress = Math.min(1, avgAbsVelocity / 0.02);

  return regimeStress * 0.6 + velocityStress * 0.4;
}
