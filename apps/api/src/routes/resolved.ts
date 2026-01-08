import { Elysia, t } from 'elysia';
import { checkForResolutions, getResolvedMarkets, manuallyResolveMarket } from '../services/resolution';
import { getTraderScores, getMarketScores } from '../services/scoring';
import { authMiddleware } from '../middleware/auth';

export const resolvedRoutes = new Elysia({ prefix: '/resolved' })
  // Get all resolved markets
  .get('/', async ({ query }) => {
    const { limit = '50' } = query;

    const markets = await getResolvedMarkets(Number(limit));

    return {
      data: markets,
      timestamp: Date.now(),
    };
  }, {
    query: t.Object({
      limit: t.Optional(t.String()),
    }),
  })

  // Get scores for a specific market
  .get('/:marketId/scores', async ({ params: { marketId } }) => {
    const marketScores = await getMarketScores(marketId);

    return {
      data: marketScores,
      timestamp: Date.now(),
    };
  })

  // Trigger resolution check (could be called by cron)
  .post('/check', async () => {
    const result = await checkForResolutions();

    return {
      data: result,
      message: `Checked ${result.checked} markets, resolved ${result.resolved}, scored ${result.scored} predictions`,
      timestamp: Date.now(),
    };
  })

  // Manual resolution (admin only - for testing)
  .post(
    '/manual',
    async ({ body }) => {
      try {
        const result = await manuallyResolveMarket(
          body.marketId,
          body.platform,
          body.title,
          body.outcome
        );

        return {
          data: result,
          message: `Market resolved, scored ${result.scored} predictions`,
          timestamp: Date.now(),
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Resolution failed',
          code: 'RESOLUTION_FAILED',
          timestamp: Date.now(),
        };
      }
    },
    {
      body: t.Object({
        marketId: t.String(),
        platform: t.String(),
        title: t.String(),
        outcome: t.Number(),
      }),
    }
  )

  // Get my scores (requires auth)
  .use(authMiddleware)
  .get('/scores/mine', async ({ trader }) => {
    if (!trader) {
      return {
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        timestamp: Date.now(),
      };
    }

    const myScores = await getTraderScores(trader.id);

    // Calculate summary stats
    const totalScores = myScores.length;
    const avgBrierScore = totalScores > 0
      ? myScores.reduce((sum, s) => sum + s.brierScore, 0) / totalScores
      : 0;
    const totalStake = myScores.reduce((sum, s) => sum + s.stake, 0);

    return {
      data: {
        scores: myScores,
        summary: {
          totalScores,
          avgBrierScore,
          totalStake,
          accuracy: 1 - avgBrierScore, // Inverse of Brier score
        },
      },
      timestamp: Date.now(),
    };
  });
