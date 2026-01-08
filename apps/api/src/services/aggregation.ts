import { db, predictions, traders } from '../db';
import { eq, and, inArray } from 'drizzle-orm';
import type { MarketSignal } from '@eventhorizon/shared';

// Get all active predictions for a market
export async function getMarketPredictions(marketId: string) {
  return db
    .select()
    .from(predictions)
    .where(and(eq(predictions.marketId, marketId), eq(predictions.status, 'active')))
    .all();
}

// Get predictions for multiple markets
export async function getPredictionsForMarkets(marketIds: string[]) {
  if (marketIds.length === 0) return [];

  return db
    .select()
    .from(predictions)
    .where(and(inArray(predictions.marketId, marketIds), eq(predictions.status, 'active')))
    .all();
}

// Get trader reputations as a map
export async function getTraderReputations(traderIds: string[]): Promise<Map<string, number>> {
  if (traderIds.length === 0) return new Map();

  const traderRecords = await db
    .select({ id: traders.id, reputation: traders.reputation })
    .from(traders)
    .where(inArray(traders.id, traderIds))
    .all();

  return new Map(traderRecords.map(t => [t.id, t.reputation]));
}

// Calculate aggregated signal for a single market
export async function calculateMarketSignal(marketId: string): Promise<MarketSignal | null> {
  const marketPredictions = await getMarketPredictions(marketId);

  if (marketPredictions.length === 0) return null;

  const traderIds = [...new Set(marketPredictions.map(p => p.traderId))];
  const reputations = await getTraderReputations(traderIds);

  let weightedProbSum = 0;
  let weightedConfSum = 0;
  let totalWeight = 0;
  let totalStake = 0;

  marketPredictions.forEach(pred => {
    const reputation = reputations.get(pred.traderId) || 0.5;
    const weight = pred.stake * reputation * pred.confidence;

    weightedProbSum += pred.probability * weight;
    weightedConfSum += pred.confidence * weight;
    totalWeight += weight;
    totalStake += pred.stake;
  });

  return {
    marketId,
    probability: totalWeight > 0 ? weightedProbSum / totalWeight : 0.5,
    confidence: totalWeight > 0 ? weightedConfSum / totalWeight : 0,
    contributorCount: marketPredictions.length,
    totalStake,
    updatedAt: Date.now(),
  };
}

// Calculate signals for all active markets
export async function calculateAllSignals(): Promise<MarketSignal[]> {
  // Get all active predictions
  const allPredictions = await db
    .select()
    .from(predictions)
    .where(eq(predictions.status, 'active'))
    .all();

  if (allPredictions.length === 0) return [];

  // Group by market
  const byMarket = new Map<string, typeof allPredictions>();
  allPredictions.forEach(pred => {
    const existing = byMarket.get(pred.marketId) || [];
    existing.push(pred);
    byMarket.set(pred.marketId, existing);
  });

  // Get all trader reputations
  const traderIds = [...new Set(allPredictions.map(p => p.traderId))];
  const reputations = await getTraderReputations(traderIds);

  // Calculate signal for each market
  const signals: MarketSignal[] = [];

  for (const [marketId, marketPredictions] of byMarket) {
    let weightedProbSum = 0;
    let weightedConfSum = 0;
    let totalWeight = 0;
    let totalStake = 0;

    marketPredictions.forEach(pred => {
      const reputation = reputations.get(pred.traderId) || 0.5;
      const weight = pred.stake * reputation * pred.confidence;

      weightedProbSum += pred.probability * weight;
      weightedConfSum += pred.confidence * weight;
      totalWeight += weight;
      totalStake += pred.stake;
    });

    signals.push({
      marketId,
      probability: totalWeight > 0 ? weightedProbSum / totalWeight : 0.5,
      confidence: totalWeight > 0 ? weightedConfSum / totalWeight : 0,
      contributorCount: marketPredictions.length,
      totalStake,
      updatedAt: Date.now(),
    });
  }

  return signals;
}
