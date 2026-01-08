// Dome API unified market types

export type Platform = 'polymarket' | 'kalshi';

export interface Market {
  id: string;
  platform: Platform;
  conditionId: string; // Platform-specific ID
  tokenId?: string; // For Polymarket
  ticker?: string; // For Kalshi

  title: string;
  description: string;
  category: MarketCategory;

  // Price/Probability
  currentPrice: number; // 0-1 (probability)
  previousPrice: number;
  velocity: number; // price change per hour

  // Liquidity & Volume
  liquidity: number;
  volume24h: number;

  // Time series
  trajectory: PricePoint[];

  // Status
  status: MarketStatus;
  regime: MarketRegime;
  endDate?: number;
  resolvedAt?: number;
  outcome?: number; // 0 or 1 when resolved

  // Metadata
  createdAt: number;
  updatedAt: number;

  // Optional platform-specific fields
  slug?: string; // Polymarket market slug
  image?: string; // Market image URL
}

export interface PricePoint {
  timestamp: number;
  price: number;
  volume?: number;
}

export type MarketCategory =
  | 'politics'
  | 'crypto'
  | 'economics'
  | 'sports'
  | 'entertainment'
  | 'science'
  | 'other';

export type MarketStatus = 'active' | 'closed' | 'resolved';

export type MarketRegime = 'stable' | 'transitioning' | 'volatile' | 'tail';

// API Response types
export interface MarketsResponse {
  data: Market[];
  timestamp: number;
  nextCursor?: string;
}

export interface MarketResponse {
  data: Market;
  timestamp: number;
}

// Dome raw types (for mapping)
export interface DomePolymarketMarket {
  condition_id: string;
  title: string;
  market_slug: string;
  tags?: string[];
  side_a?: {
    id: string;
    label: string;
    price?: number;
  };
  side_b?: {
    id: string;
    label: string;
    price?: number;
  };
  volume_total?: number;
  volume_1_week?: number;
  end_time?: number;
  start_time?: number;
  close_time?: number | null;
  completed_time?: number | null;
  status?: string;
  winning_side?: string | null;
  resolution_source?: string;
  image?: string;
}

export interface DomeKalshiMarket {
  ticker: string;
  title: string;
  subtitle: string;
  yes_bid: number;
  yes_ask: number;
  volume: number;
  open_interest: number;
  close_time?: string;
  status: string;
  result?: string;
}

export interface DomeCandlestick {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Helper to detect regime from price trajectory
export function detectRegime(trajectory: PricePoint[]): MarketRegime {
  if (trajectory.length < 10) return 'stable';

  const recent = trajectory.slice(-24); // Last 24 points
  const prices = recent.map(p => p.price);

  const mean = prices.reduce((a, b) => a + b) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  // Calculate velocity
  const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
  const secondHalf = prices.slice(Math.floor(prices.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
  const trend = Math.abs(secondAvg - firstAvg);

  // Classify
  if (stdDev > 0.15 || (prices.some(p => p > 0.9) && prices.some(p => p < 0.1))) {
    return 'tail';
  }
  if (stdDev > 0.08) {
    return 'volatile';
  }
  if (trend > 0.1) {
    return 'transitioning';
  }
  return 'stable';
}

// Calculate velocity (price change per hour)
export function calculateVelocity(trajectory: PricePoint[]): number {
  if (trajectory.length < 2) return 0;

  const recent = trajectory.slice(-12); // Last 12 hours
  if (recent.length < 2) return 0;

  const first = recent[0];
  const last = recent[recent.length - 1];
  const hoursDiff = (last.timestamp - first.timestamp) / (1000 * 60 * 60);

  if (hoursDiff === 0) return 0;
  return (last.price - first.price) / hoursDiff;
}
