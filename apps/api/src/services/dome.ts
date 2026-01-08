import { DomeClient } from '@dome-api/sdk';
import type {
  Market,
  PricePoint,
  MarketCategory,
  MarketStatus,
  Platform,
  detectRegime,
  calculateVelocity,
} from '@eventhorizon/shared';
import { API_CONFIG, DOME_API_CONFIG } from '../config/constants';
import { ServiceError, handleServiceError } from '../config/errors';
import {
  calculateKalshiPrice,
  estimateDailyVolumeFromWeekly,
  determinePolymarketStatus,
  determineKalshiStatus,
  determinePolymarketOutcome,
  determineKalshiOutcome,
  convertTimestampToMs,
} from '../utils/marketHelpers';

// Initialize Dome client
const dome = new DomeClient({
  apiKey: DOME_API_CONFIG.API_KEY,
});

const POLYMARKET_TAG_TO_CATEGORY: Record<string, MarketCategory> = {
  politics: 'politics',
  election: 'politics',
  government: 'politics',
  crypto: 'crypto',
  bitcoin: 'crypto',
  ethereum: 'crypto',
  defi: 'crypto',
  economics: 'economics',
  finance: 'economics',
  fed: 'economics',
  inflation: 'economics',
  sports: 'sports',
  nfl: 'sports',
  nba: 'sports',
  mlb: 'sports',
  entertainment: 'entertainment',
  movies: 'entertainment',
  music: 'entertainment',
  science: 'science',
  tech: 'science',
  ai: 'science',
};

function inferMarketCategory(title?: string, tags?: string[]): MarketCategory {
  if (tags) {
    for (const tag of tags) {
      const category = POLYMARKET_TAG_TO_CATEGORY[tag.toLowerCase()];
      if (category) return category;
    }
  }

  if (title) {
    const normalizedTitle = title.toLowerCase();
    for (const [keyword, category] of Object.entries(POLYMARKET_TAG_TO_CATEGORY)) {
      if (normalizedTitle.includes(keyword)) return category;
    }
  }

  return 'other';
}

export interface GetMarketsOptions {
  platform?: Platform;
  status?: 'open' | 'closed';
  minVolume?: number;
  limit?: number;
  offset?: number;
  tags?: string[];
  search?: string;
}

export interface DomeService {
  getPolymarketMarkets(options?: GetMarketsOptions): Promise<Market[]>;
  getKalshiMarkets(options?: GetMarketsOptions): Promise<Market[]>;
  getAllMarkets(options?: GetMarketsOptions): Promise<Market[]>;
  getMarket(platform: Platform, id: string): Promise<Market | null>;
  getMarketHistory(platform: Platform, id: string, days?: number): Promise<PricePoint[]>;
}

// Polymarket market response type (from Dome SDK)
interface PolymarketMarketResponse {
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

// Kalshi market response type
interface KalshiMarketResponse {
  market_ticker: string;
  event_ticker: string;
  title: string;
  subtitle?: string;
  last_price?: number;
  volume?: number;
  volume_24h?: number;
  close_time?: number;
  end_time?: number;
  status?: string;
  result?: string | null;
}

export async function getPolymarketMarkets(options: GetMarketsOptions = {}): Promise<Market[]> {
  try {
    const response = await dome.polymarket.markets.getMarkets({
      status: options.status,
      min_volume: options.minVolume,
      limit: options.limit || API_CONFIG.DEFAULT_MARKET_LIMIT,
      offset: options.offset || 0,
      tags: options.tags,
    });

    const markets = (response as { markets?: PolymarketMarketResponse[] }).markets || [];
    if (!markets.length) {
      return [];
    }

    return markets.map((m: PolymarketMarketResponse) => {
      // Use side_a price if available, otherwise default to 0.5
      const currentPrice = m.side_a?.price || 0.5;

      const status = determinePolymarketStatus(m.completed_time, m.status, m.close_time);
      const outcome = determinePolymarketOutcome(m.winning_side, m.side_a?.label);

      return {
        id: `poly_${m.condition_id}`,
        platform: 'polymarket' as Platform,
        conditionId: m.condition_id,
        tokenId: m.side_a?.id,
        title: m.title,
        description: m.resolution_source || '',
        category: inferMarketCategory(m.title, m.tags),
        currentPrice,
        previousPrice: currentPrice, // Will be updated with history
        velocity: 0, // Will be calculated from history
        liquidity: 0, // Dome doesn't expose liquidity directly
        volume24h: estimateDailyVolumeFromWeekly(m.volume_1_week),
        trajectory: [],
        status,
        regime: 'stable', // Will be calculated from trajectory
        endDate: convertTimestampToMs(m.end_time),
        outcome,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        slug: m.market_slug,
        image: m.image,
      } satisfies Market;
    });
  } catch (error) {
    throw new ServiceError(
      `Failed to fetch Polymarket markets: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'POLYMARKET_FETCH_ERROR'
    );
  }
}

export async function getKalshiMarkets(options: GetMarketsOptions = {}): Promise<Market[]> {
  try {
    const response = await dome.kalshi.markets.getMarkets({
      status: options.status,
      min_volume: options.minVolume,
      limit: options.limit || API_CONFIG.DEFAULT_MARKET_LIMIT,
      offset: options.offset || 0,
    });

    const markets = (response as { markets?: KalshiMarketResponse[] }).markets || [];

    return markets.map((m: KalshiMarketResponse) => {
      const currentPrice = calculateKalshiPrice(m.last_price);
      const status = determineKalshiStatus(m.status, m.result);
      const outcome = determineKalshiOutcome(m.result);
      const endDate = convertTimestampToMs(m.close_time || m.end_time);

      return {
        id: `kalshi_${m.market_ticker}`,
        platform: 'kalshi' as Platform,
        conditionId: m.event_ticker,
        ticker: m.market_ticker,
        title: m.title,
        description: m.subtitle || '',
        category: inferMarketCategory(m.title),
        currentPrice,
        previousPrice: currentPrice,
        velocity: 0,
        liquidity: 0,
        volume24h: m.volume_24h || 0,
        trajectory: [],
        status,
        regime: 'stable',
        endDate,
        outcome,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } satisfies Market;
    });
  } catch (error) {
    throw new ServiceError(
      `Failed to fetch Kalshi markets: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'KALSHI_FETCH_ERROR'
    );
  }
}

export async function getAllMarkets(options: GetMarketsOptions = {}): Promise<Market[]> {
  const [polymarkets, kalshiMarkets] = await Promise.all([
    options.platform !== 'kalshi' ? getPolymarketMarkets(options) : Promise.resolve([]),
    options.platform !== 'polymarket' ? getKalshiMarkets(options) : Promise.resolve([]),
  ]);

  // Combine and sort by volume
  const all = [...polymarkets, ...kalshiMarkets];
  all.sort((a, b) => b.volume24h - a.volume24h);

  return all;
}

export async function getMarketPrice(platform: Platform, tokenIdOrTicker: string): Promise<number | null> {
  try {
    if (platform === 'polymarket') {
      const response = await dome.polymarket.markets.getMarketPrice({
        token_id: tokenIdOrTicker,
      });
      return (response as { price?: number }).price || null;
    } else {
      // For Kalshi, we need to get the market data
      const response = await dome.kalshi.markets.getMarkets({
        market_ticker: [tokenIdOrTicker],
        limit: 1,
      });
      const markets = (response as { markets?: KalshiMarketResponse[] }).markets || [];
      if (markets.length > 0 && markets[0].last_price !== undefined) {
        return calculateKalshiPrice(markets[0].last_price);
      }
      return null;
    }
  } catch (error) {
    throw new ServiceError(
      `Failed to fetch price for ${platform}:${tokenIdOrTicker}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PRICE_FETCH_ERROR'
    );
  }
}

export async function getMarketHistory(
  platform: Platform,
  conditionIdOrTicker: string,
  days: number = API_CONFIG.DEFAULT_HISTORY_DAYS
): Promise<PricePoint[]> {
  try {
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (days * 24 * 60 * 60);

    if (platform === 'polymarket') {
       const response = await dome.polymarket.markets.getCandlesticks({
         condition_id: conditionIdOrTicker,
         start_time: startTime,
         end_time: endTime,
         interval: API_CONFIG.CANDLESTICK_INTERVAL,
       });

      const candles = (response as { candlesticks?: Array<{ timestamp: number; close: number; volume?: number }> }).candlesticks || [];

      return candles.map((c) => ({
        timestamp: convertTimestampToMs(c.timestamp),
        price: c.close,
        volume: c.volume,
      }));
    } else {
      // For Kalshi, use trades to build history
      const response = await dome.kalshi.markets.getTrades({
        ticker: conditionIdOrTicker,
        start_time: startTime,
        end_time: endTime,
         limit: API_CONFIG.TRADE_HISTORY_LIMIT,
      });

      const trades = (response as { trades?: Array<{ created_time: number; yes_price: number; count: number }> }).trades || [];

      return trades.map((t) => ({
        timestamp: convertTimestampToMs(t.created_time),
        price: calculateKalshiPrice(t.yes_price),
        volume: t.count,
      }));
    }
  } catch (error) {
    throw new ServiceError(
      `Failed to fetch history for ${platform}:${conditionIdOrTicker}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'HISTORY_FETCH_ERROR'
    );
  }
}

// Enrich market with trajectory and calculated fields
export async function enrichMarket(market: Market): Promise<Market> {
  const { detectRegime, calculateVelocity } = await import('@eventhorizon/shared');

  const trajectory = await getMarketHistory(
    market.platform,
    market.platform === 'polymarket' ? market.conditionId : market.ticker!,
    API_CONFIG.DEFAULT_HISTORY_DAYS
  );

  if (trajectory.length > 0) {
    const previousPrice = trajectory.length > 1
      ? trajectory[trajectory.length - 2].price
      : market.currentPrice;

    return {
      ...market,
      trajectory,
      previousPrice,
      velocity: calculateVelocity(trajectory),
      regime: detectRegime(trajectory),
      updatedAt: Date.now(),
    };
  }

  return market;
}

export const domeService: DomeService = {
  getPolymarketMarkets,
  getKalshiMarkets,
  getAllMarkets,
  getMarket: async (platform: Platform, id: string): Promise<Market | null> => {
    const markets = await getAllMarkets({ platform, limit: 100 });
    return markets.find(m => m.id === id || m.conditionId === id || m.ticker === id) || null;
  },
  getMarketHistory,
};

export default domeService;
