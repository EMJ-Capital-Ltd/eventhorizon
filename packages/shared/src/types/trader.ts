// Trader types for wallet-authenticated users

export interface Trader {
  id: string; // UUID
  walletAddress: string; // Ethereum address (lowercase)
  reputation: number; // 0-1 score based on historical accuracy
  totalStake: number; // Cumulative stake across all predictions
  predictionCount: number;
  resolvedCount: number;
  avgBrierScore: number; // Average Brier score (lower is better)
  createdAt: number;
  updatedAt: number;
}

export interface TraderStats {
  trader: Trader;
  recentPredictions: number; // Last 30 days
  recentAccuracy: number; // Recent Brier score
  rank: number;
  percentile: number;
}

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  reputation: number;
  totalStake: number;
  predictionCount: number;
  avgBrierScore: number;
}

export interface LeaderboardResponse {
  data: LeaderboardEntry[];
  totalTraders: number;
  timestamp: number;
}
