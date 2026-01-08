import { Elysia, t } from 'elysia';
import { randomUUID } from 'crypto';
import { db, predictions, traders } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware, requireAuth } from '../middleware/auth';
import { calculateMarketSignal, calculateAllSignals } from '../services/aggregation';
import type { MarketSignalsResponse } from '@eventhorizon/shared';

export const marketPredictionsRoutes = new Elysia({ prefix: '/market-predictions' })
  // Get all signals (public)
  .get('/signals', async (): Promise<MarketSignalsResponse> => {
    const signals = await calculateAllSignals();

    return {
      data: signals,
      timestamp: Date.now(),
    };
  })

  // Get signal for specific market (public)
  .get('/signals/:marketId', async ({ params: { marketId } }) => {
    const signal = await calculateMarketSignal(marketId);

    if (!signal) {
      return {
        error: 'No predictions for this market',
        code: 'NO_PREDICTIONS',
        timestamp: Date.now(),
      };
    }

    return {
      data: signal,
      timestamp: Date.now(),
    };
  })

  // Submit prediction (requires auth)
  .use(authMiddleware)
  .post(
    '/',
    async ({ body, trader }) => {
      if (!trader) {
        return {
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
          timestamp: Date.now(),
        };
      }

      const { marketId, platform, probability, confidence, stake } = body;

      // Validate probability
      if (probability < 0 || probability > 1) {
        return {
          error: 'Probability must be between 0 and 1',
          code: 'INVALID_PROBABILITY',
          timestamp: Date.now(),
        };
      }

      // Validate confidence
      if (confidence < 0 || confidence > 1) {
        return {
          error: 'Confidence must be between 0 and 1',
          code: 'INVALID_CONFIDENCE',
          timestamp: Date.now(),
        };
      }

      // Validate stake
      if (stake <= 0) {
        return {
          error: 'Stake must be positive',
          code: 'INVALID_STAKE',
          timestamp: Date.now(),
        };
      }

      // Check if trader already has prediction for this market
      const existingPrediction = await db
        .select()
        .from(predictions)
        .where(
          and(
            eq(predictions.traderId, trader.id),
            eq(predictions.marketId, marketId),
            eq(predictions.status, 'active')
          )
        )
        .get();

      if (existingPrediction) {
        // Update existing prediction
        await db
          .update(predictions)
          .set({
            probability,
            confidence,
            stake,
            updatedAt: new Date(),
          })
          .where(eq(predictions.id, existingPrediction.id));

        // Update trader stats
        await db
          .update(traders)
          .set({
            totalStake: trader.totalStake - existingPrediction.stake + stake,
            updatedAt: new Date(),
          })
          .where(eq(traders.id, trader.id));

        const updated = await db
          .select()
          .from(predictions)
          .where(eq(predictions.id, existingPrediction.id))
          .get();

        return {
          data: updated,
          message: 'Prediction updated',
          timestamp: Date.now(),
        };
      }

      // Create new prediction
      const predictionId = randomUUID();

      await db.insert(predictions).values({
        id: predictionId,
        traderId: trader.id,
        marketId,
        platform,
        probability,
        confidence,
        stake,
        status: 'active',
      });

      // Update trader stats
      await db
        .update(traders)
        .set({
          totalStake: trader.totalStake + stake,
          predictionCount: trader.predictionCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(traders.id, trader.id));

      const newPrediction = await db
        .select()
        .from(predictions)
        .where(eq(predictions.id, predictionId))
        .get();

      return {
        data: newPrediction,
        message: 'Prediction created',
        timestamp: Date.now(),
      };
    },
    {
      body: t.Object({
        marketId: t.String(),
        platform: t.Union([t.Literal('polymarket'), t.Literal('kalshi')]),
        probability: t.Number(),
        confidence: t.Number(),
        stake: t.Number(),
      }),
    }
  )

  // Get my predictions (requires auth)
  .get('/mine', async ({ trader }) => {
    if (!trader) {
      return {
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        timestamp: Date.now(),
      };
    }

    const myPredictions = await db
      .select()
      .from(predictions)
      .where(eq(predictions.traderId, trader.id))
      .orderBy(desc(predictions.createdAt))
      .all();

    return {
      data: myPredictions,
      timestamp: Date.now(),
    };
  })

  // Cancel prediction (requires auth)
  .delete('/:predictionId', async ({ params: { predictionId }, trader }) => {
    if (!trader) {
      return {
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        timestamp: Date.now(),
      };
    }

    const prediction = await db
      .select()
      .from(predictions)
      .where(eq(predictions.id, predictionId))
      .get();

    if (!prediction) {
      return {
        error: 'Prediction not found',
        code: 'NOT_FOUND',
        timestamp: Date.now(),
      };
    }

    if (prediction.traderId !== trader.id) {
      return {
        error: 'Not authorized to cancel this prediction',
        code: 'FORBIDDEN',
        timestamp: Date.now(),
      };
    }

    if (prediction.status !== 'active') {
      return {
        error: 'Can only cancel active predictions',
        code: 'INVALID_STATUS',
        timestamp: Date.now(),
      };
    }

    await db
      .update(predictions)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(predictions.id, predictionId));

    // Update trader stats
    await db
      .update(traders)
      .set({
        totalStake: trader.totalStake - prediction.stake,
        updatedAt: new Date(),
      })
      .where(eq(traders.id, trader.id));

    return {
      message: 'Prediction cancelled',
      timestamp: Date.now(),
    };
  });
