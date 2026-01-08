import { Elysia, t } from 'elysia';
import { db, traders, scores } from '../db';
import { desc, eq, count } from 'drizzle-orm';
import type { LeaderboardResponse } from '@eventhorizon/shared';

export const leaderboardRoutes = new Elysia({ prefix: '/leaderboard' })
  // Get top traders by reputation
  .get(
    '/',
    async ({ query }): Promise<LeaderboardResponse> => {
      const { limit = '50', offset = '0' } = query;

      const topTraders = await db
        .select()
        .from(traders)
        .orderBy(desc(traders.reputation))
        .limit(Number(limit))
        .offset(Number(offset))
        .all();

      const totalCount = await db
        .select({ count: count() })
        .from(traders)
        .get();

      return {
        data: topTraders.map((t, index) => ({
          rank: Number(offset) + index + 1,
          walletAddress: t.walletAddress,
          reputation: t.reputation,
          totalStake: t.totalStake,
          predictionCount: t.predictionCount,
          avgBrierScore: t.avgBrierScore,
        })),
        totalTraders: totalCount?.count || 0,
        timestamp: Date.now(),
      };
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  // Get trader stats by wallet
  .get('/trader/:wallet', async ({ params: { wallet } }) => {
    const normalizedWallet = wallet.toLowerCase();

    const trader = await db
      .select()
      .from(traders)
      .where(eq(traders.walletAddress, normalizedWallet))
      .get();

    if (!trader) {
      return {
        error: 'Trader not found',
        code: 'NOT_FOUND',
        timestamp: Date.now(),
      };
    }

    // Get rank
    const tradersAbove = await db
      .select({ count: count() })
      .from(traders)
      .where(desc(traders.reputation))
      .get();

    // Get recent scores
    const recentScores = await db
      .select()
      .from(scores)
      .where(eq(scores.traderId, trader.id))
      .orderBy(desc(scores.resolvedAt))
      .limit(10)
      .all();

    return {
      data: {
        trader: {
          id: trader.id,
          walletAddress: trader.walletAddress,
          reputation: trader.reputation,
          totalStake: trader.totalStake,
          predictionCount: trader.predictionCount,
          resolvedCount: trader.resolvedCount,
          avgBrierScore: trader.avgBrierScore,
          createdAt: trader.createdAt,
        },
        recentScores: recentScores.map(s => ({
          marketId: s.marketId,
          predictedProbability: s.predictedProbability,
          actualOutcome: s.actualOutcome,
          brierScore: s.brierScore,
          stake: s.stake,
          resolvedAt: s.resolvedAt,
        })),
      },
      timestamp: Date.now(),
    };
  });
