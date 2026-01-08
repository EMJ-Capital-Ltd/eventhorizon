import { Elysia, t } from 'elysia';
import type { Market, MarketsResponse, MarketResponse, Platform } from '@eventhorizon/shared';
import { getAllMarkets, getMarketHistory, enrichMarket } from '../services/dome';

export const marketsRoutes = new Elysia({ prefix: '/markets' })
  .get(
    '/',
    async ({ query }): Promise<MarketsResponse> => {
      const {
        platform,
        status,
        minVolume,
        limit = 50,
        offset = 0,
        category,
      } = query;

      let markets = await getAllMarkets({
        platform: platform as Platform | undefined,
        status: status as 'open' | 'closed' | undefined,
        minVolume: minVolume ? Number(minVolume) : undefined,
        limit: Number(limit),
        offset: Number(offset),
      });

      // Filter by category if specified
      if (category) {
        markets = markets.filter(m => m.category === category);
      }

      return {
        data: markets,
        timestamp: Date.now(),
      };
    },
    {
      query: t.Object({
        platform: t.Optional(t.Union([t.Literal('polymarket'), t.Literal('kalshi')])),
        status: t.Optional(t.Union([t.Literal('open'), t.Literal('closed')])),
        minVolume: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
        category: t.Optional(t.String()),
      }),
    }
  )
  .get(
    '/:id',
    async ({ params: { id } }): Promise<MarketResponse | { error: string; code: string; timestamp: number }> => {
      // Try to find market by ID
      const allMarkets = await getAllMarkets({ limit: 200 });
      const market = allMarkets.find(
        m => m.id === id || m.conditionId === id || m.ticker === id
      );

      if (!market) {
        return {
          error: 'Market not found',
          code: 'NOT_FOUND',
          timestamp: Date.now(),
        };
      }

      // Enrich with trajectory data
      const enrichedMarket = await enrichMarket(market);

      return {
        data: enrichedMarket,
        timestamp: Date.now(),
      };
    }
  )
  .get(
    '/:id/history',
    async ({ params: { id }, query }): Promise<{ data: Market['trajectory']; timestamp: number } | { error: string; code: string; timestamp: number }> => {
      const { days = '7' } = query;

      // Find market to get platform info
      const allMarkets = await getAllMarkets({ limit: 200 });
      const market = allMarkets.find(
        m => m.id === id || m.conditionId === id || m.ticker === id
      );

      if (!market) {
        return {
          error: 'Market not found',
          code: 'NOT_FOUND',
          timestamp: Date.now(),
        };
      }

      const history = await getMarketHistory(
        market.platform,
        market.platform === 'polymarket' ? market.conditionId : market.ticker!,
        Number(days)
      );

      return {
        data: history,
        timestamp: Date.now(),
      };
    },
    {
      query: t.Object({
        days: t.Optional(t.String()),
      }),
    }
  );
