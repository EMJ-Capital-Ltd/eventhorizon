import { db, predictions, resolvedMarkets, type NewResolvedMarket } from '../db';
import { eq, and, isNull } from 'drizzle-orm';
import { getAllMarkets } from './dome';
import { scoreMarketPredictions } from './scoring';
import type { Market } from '@eventhorizon/shared';

// Check for newly resolved markets and score predictions
export async function checkForResolutions(): Promise<{
  checked: number;
  resolved: number;
  scored: number;
}> {
  // Get all markets with active predictions
  const activePredictions = await db
    .select({ marketId: predictions.marketId })
    .from(predictions)
    .where(eq(predictions.status, 'active'))
    .groupBy(predictions.marketId)
    .all();

  if (activePredictions.length === 0) {
    return { checked: 0, resolved: 0, scored: 0 };
  }

  const marketIds = activePredictions.map(p => p.marketId);

  // Check which markets are already resolved in our DB
  const alreadyResolved = await db
    .select({ id: resolvedMarkets.id })
    .from(resolvedMarkets)
    .all();

  const alreadyResolvedIds = new Set(alreadyResolved.map(m => m.id));

  // Fetch current market data from Dome
  const markets = await getAllMarkets({ limit: 200 });

  let resolved = 0;
  let scored = 0;

  for (const market of markets) {
    // Skip if not in our active predictions
    if (!marketIds.includes(market.id)) continue;

    // Skip if already resolved
    if (alreadyResolvedIds.has(market.id)) continue;

    // Check if market is resolved
    if (market.status === 'resolved' && market.outcome !== undefined) {
      // Store resolved market
      const resolvedMarket: NewResolvedMarket = {
        id: market.id,
        platform: market.platform,
        title: market.title,
        outcome: market.outcome,
        resolvedAt: market.resolvedAt ? new Date(market.resolvedAt) : new Date(),
      };

      await db.insert(resolvedMarkets).values(resolvedMarket);
      resolved++;

      // Score all predictions for this market
      const predictionsScored = await scoreMarketPredictions(market.id, market.outcome);
      scored += predictionsScored;

      console.log(`📊 Resolved market "${market.title}" - scored ${predictionsScored} predictions`);
    }
  }

  return {
    checked: marketIds.length,
    resolved,
    scored,
  };
}

// Get all resolved markets
export async function getResolvedMarkets(limit: number = 50) {
  return db
    .select()
    .from(resolvedMarkets)
    .orderBy(resolvedMarkets.resolvedAt)
    .limit(limit)
    .all();
}

// Manually resolve a market (for testing or manual intervention)
export async function manuallyResolveMarket(
  marketId: string,
  platform: string,
  title: string,
  outcome: number
): Promise<{ scored: number }> {
  // Check if already resolved
  const existing = await db
    .select()
    .from(resolvedMarkets)
    .where(eq(resolvedMarkets.id, marketId))
    .get();

  if (existing) {
    throw new Error('Market already resolved');
  }

  // Validate outcome
  if (outcome !== 0 && outcome !== 1) {
    throw new Error('Outcome must be 0 or 1');
  }

  // Store resolved market
  await db.insert(resolvedMarkets).values({
    id: marketId,
    platform,
    title,
    outcome,
    resolvedAt: new Date(),
  });

  // Score predictions
  const scored = await scoreMarketPredictions(marketId, outcome);

  return { scored };
}
