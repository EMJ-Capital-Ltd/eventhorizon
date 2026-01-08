// Scoring and prediction types for market predictions

export interface MarketPrediction {
  id: string;
  traderId: string;
  marketId: string;
  probability: number; // 0-1
  confidence: number; // 0-1
  stake: number;
  createdAt: number;
  updatedAt: number;
}

export interface MarketPredictionSubmission {
  marketId: string;
  probability: number;
  confidence: number;
  stake: number;
}

export interface Score {
  id: string;
  predictionId: string;
  traderId: string;
  marketId: string;
  predictedProbability: number;
  actualOutcome: number; // 0 or 1
  brierScore: number; // (predicted - actual)^2
  stake: number;
  resolvedAt: number;
}

export interface MarketSignal {
  marketId: string;
  probability: number; // Weighted average prediction
  confidence: number;
  contributorCount: number;
  totalStake: number;
  updatedAt: number;
}

export interface MarketSignalsResponse {
  data: MarketSignal[];
  timestamp: number;
}

// Brier score calculation
// Lower is better: 0 = perfect, 1 = worst possible
export function calculateBrierScore(prediction: number, outcome: number): number {
  return Math.pow(prediction - outcome, 2);
}

// Reputation calculation based on historical scores
// Uses exponential weighted average with decay for older predictions
export function calculateReputation(scores: Score[], decayFactor: number = 0.95): number {
  if (scores.length === 0) return 0.5; // Default neutral reputation

  // Sort by resolved time (most recent first)
  const sorted = [...scores].sort((a, b) => b.resolvedAt - a.resolvedAt);

  let weightedSum = 0;
  let totalWeight = 0;

  sorted.forEach((score, index) => {
    const weight = Math.pow(decayFactor, index) * score.stake;
    // Convert Brier score to accuracy (1 - brierScore)
    const accuracy = 1 - score.brierScore;
    weightedSum += accuracy * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
}

// Aggregate predictions into a single signal
export function aggregateMarketPredictions(
  predictions: MarketPrediction[],
  traderReputations: Map<string, number>
): MarketSignal | null {
  if (predictions.length === 0) return null;

  const marketId = predictions[0].marketId;
  let weightedProbSum = 0;
  let weightedConfSum = 0;
  let totalWeight = 0;
  let totalStake = 0;

  predictions.forEach(pred => {
    const reputation = traderReputations.get(pred.traderId) || 0.5;
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
    contributorCount: predictions.length,
    totalStake,
    updatedAt: Date.now(),
  };
}
