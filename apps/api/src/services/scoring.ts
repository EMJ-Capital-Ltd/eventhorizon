import { db, predictions, traders, scores, resolvedMarkets, type NewScore } from '../db';
import { eq, and, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { calculateBrierScore } from '@eventhorizon/shared';

// Score all predictions for a resolved market
export async function scoreMarketPredictions(
  marketId: string,
  outcome: number // 0 or 1
): Promise<number> {
  // Get all active predictions for this market
  const marketPredictions = await db
    .select()
    .from(predictions)
    .where(and(eq(predictions.marketId, marketId), eq(predictions.status, 'active')))
    .all();

  if (marketPredictions.length === 0) {
    return 0;
  }

  const now = new Date();
  const scoresToInsert: NewScore[] = [];

  // Calculate scores for each prediction
  for (const prediction of marketPredictions) {
    const brierScore = calculateBrierScore(prediction.probability, outcome);

    scoresToInsert.push({
      id: randomUUID(),
      predictionId: prediction.id,
      traderId: prediction.traderId,
      marketId,
      predictedProbability: prediction.probability,
      actualOutcome: outcome,
      brierScore,
      stake: prediction.stake,
      resolvedAt: now,
    });
  }

  // Insert all scores
  await db.insert(scores).values(scoresToInsert);

  // Update predictions to resolved
  const predictionIds = marketPredictions.map(p => p.id);
  await db
    .update(predictions)
    .set({
      status: 'resolved',
      updatedAt: now,
    })
    .where(inArray(predictions.id, predictionIds));

  // Update trader stats
  const traderIds = [...new Set(marketPredictions.map(p => p.traderId))];

  for (const traderId of traderIds) {
    await updateTraderStats(traderId);
  }

  return marketPredictions.length;
}

// Update a trader's stats based on their scores
export async function updateTraderStats(traderId: string): Promise<void> {
  // Get all scores for this trader
  const traderScores = await db
    .select()
    .from(scores)
    .where(eq(scores.traderId, traderId))
    .all();

  if (traderScores.length === 0) {
    return;
  }

  // Calculate average Brier score (weighted by stake)
  let totalWeightedScore = 0;
  let totalStake = 0;

  traderScores.forEach(score => {
    totalWeightedScore += score.brierScore * score.stake;
    totalStake += score.stake;
  });

  const avgBrierScore = totalStake > 0 ? totalWeightedScore / totalStake : 0.5;

  // Calculate reputation using exponential decay
  // Sort by resolved time (most recent first)
  const sorted = [...traderScores].sort(
    (a, b) => new Date(b.resolvedAt).getTime() - new Date(a.resolvedAt).getTime()
  );

  const decayFactor = 0.95;
  let weightedSum = 0;
  let decayWeight = 0;

  sorted.forEach((score, index) => {
    const weight = Math.pow(decayFactor, index) * score.stake;
    // Convert Brier score to accuracy (1 - brierScore)
    const accuracy = 1 - score.brierScore;
    weightedSum += accuracy * weight;
    decayWeight += weight;
  });

  const reputation = decayWeight > 0 ? weightedSum / decayWeight : 0.5;

  // Update trader
  await db
    .update(traders)
    .set({
      reputation,
      avgBrierScore,
      resolvedCount: traderScores.length,
      updatedAt: new Date(),
    })
    .where(eq(traders.id, traderId));
}

// Get trader's scoring history
export async function getTraderScores(traderId: string, limit: number = 50) {
  return db
    .select()
    .from(scores)
    .where(eq(scores.traderId, traderId))
    .orderBy(scores.resolvedAt)
    .limit(limit)
    .all();
}

// Get all scores for a market
export async function getMarketScores(marketId: string) {
  return db
    .select()
    .from(scores)
    .where(eq(scores.marketId, marketId))
    .all();
}
