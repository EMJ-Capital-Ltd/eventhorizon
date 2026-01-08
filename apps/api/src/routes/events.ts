import { Elysia } from 'elysia';
import type { Event, EventsResponse, ProbabilityPoint } from '@eventhorizon/shared';

// Seed data - will be replaced with database
function generateTrajectory(
  startProb: number,
  endProb: number,
  volatility: number,
  hours: number = 168
): ProbabilityPoint[] {
  const points: ProbabilityPoint[] = [];
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;

  let prob = startProb;
  const drift = (endProb - startProb) / hours;

  for (let i = hours; i >= 0; i--) {
    const noise = (Math.random() - 0.5) * volatility;
    prob = Math.max(0.01, Math.min(0.99, prob + drift + noise));

    points.push({
      timestamp: now - i * hourMs,
      probability: prob,
      liquidity: 50000 + Math.random() * 200000,
    });
  }

  points[points.length - 1].probability = endProb;
  return points;
}

function generateSharpMove(
  startProb: number,
  midProb: number,
  endProb: number,
  sharpPoint: number = 0.7,
  hours: number = 168
): ProbabilityPoint[] {
  const points: ProbabilityPoint[] = [];
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const sharpHour = Math.floor(hours * (1 - sharpPoint));

  for (let i = hours; i >= 0; i--) {
    let prob: number;

    if (i > sharpHour) {
      const progress = (hours - i) / (hours - sharpHour);
      prob = startProb + (midProb - startProb) * progress;
    } else {
      const progress = (sharpHour - i) / sharpHour;
      prob = midProb + (endProb - midProb) * progress;
    }

    const noise = (Math.random() - 0.5) * 0.02;
    prob = Math.max(0.01, Math.min(0.99, prob + noise));

    points.push({
      timestamp: now - i * hourMs,
      probability: prob,
      liquidity: 50000 + Math.random() * 200000,
    });
  }

  points[points.length - 1].probability = endProb;
  return points;
}

const seedEvents: Event[] = [
  {
    id: 'btc-reserve',
    title: 'US Strategic Bitcoin Reserve by 2026',
    category: 'crypto',
    description: 'Will the US establish a strategic Bitcoin reserve before end of 2026?',
    currentProbability: 0.34,
    previousProbability: 0.28,
    velocity: 0.008,
    liquidity: 2_400_000,
    trajectory: generateSharpMove(0.22, 0.26, 0.34, 0.6),
    regime: 'transitioning',
  },
  {
    id: 'fed-rate-cut',
    title: 'Fed Cuts Rates by March 2025',
    category: 'macro',
    description: 'Will the Federal Reserve cut interest rates by at least 25bps before March 2025?',
    currentProbability: 0.67,
    previousProbability: 0.71,
    velocity: -0.003,
    liquidity: 890_000,
    trajectory: generateTrajectory(0.82, 0.67, 0.03),
    regime: 'stable',
  },
  {
    id: 'eth-etf-staking',
    title: 'ETH ETF Staking Approved 2025',
    category: 'regulatory',
    description: 'Will US spot ETH ETFs be allowed to stake by end of 2025?',
    currentProbability: 0.41,
    previousProbability: 0.35,
    velocity: 0.012,
    liquidity: 1_200_000,
    trajectory: generateSharpMove(0.28, 0.32, 0.41, 0.5),
    regime: 'transitioning',
  },
  {
    id: 'china-taiwan',
    title: 'China Military Action Taiwan 2025',
    category: 'geopolitical',
    description: 'Will China take direct military action against Taiwan in 2025?',
    currentProbability: 0.08,
    previousProbability: 0.09,
    velocity: -0.001,
    liquidity: 340_000,
    trajectory: generateTrajectory(0.12, 0.08, 0.015),
    regime: 'stable',
  },
  {
    id: 'sol-etf',
    title: 'Solana ETF Approved 2025',
    category: 'regulatory',
    description: 'Will a spot Solana ETF be approved in the US by end of 2025?',
    currentProbability: 0.72,
    previousProbability: 0.58,
    velocity: 0.021,
    liquidity: 980_000,
    trajectory: generateSharpMove(0.35, 0.52, 0.72, 0.4),
    regime: 'volatile',
  },
  {
    id: 'recession-2025',
    title: 'US Recession by Q4 2025',
    category: 'macro',
    description: 'Will the US officially enter a recession by Q4 2025?',
    currentProbability: 0.23,
    previousProbability: 0.19,
    velocity: 0.004,
    liquidity: 560_000,
    trajectory: generateTrajectory(0.15, 0.23, 0.025),
    regime: 'stable',
  },
  {
    id: 'defi-regulation',
    title: 'Major DeFi Protocol Enforcement 2025',
    category: 'regulatory',
    description: 'Will SEC/DOJ bring enforcement action against a top-10 DeFi protocol in 2025?',
    currentProbability: 0.56,
    previousProbability: 0.61,
    velocity: -0.006,
    liquidity: 420_000,
    trajectory: generateSharpMove(0.71, 0.65, 0.56, 0.5),
    regime: 'transitioning',
  },
];

export const eventsRoutes = new Elysia({ prefix: '/events' })
  .get('/', (): EventsResponse => ({
    data: seedEvents,
    timestamp: Date.now(),
  }))
  .get('/:id', ({ params: { id } }) => {
    const event = seedEvents.find(e => e.id === id);
    if (!event) {
      return { error: 'Event not found', code: 'NOT_FOUND', timestamp: Date.now() };
    }
    return { data: event, timestamp: Date.now() };
  });
