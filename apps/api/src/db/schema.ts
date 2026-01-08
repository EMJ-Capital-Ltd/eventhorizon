import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Traders - wallet-authenticated users
export const traders = sqliteTable('traders', {
  id: text('id').primaryKey(), // UUID
  walletAddress: text('wallet_address').notNull().unique(),
  reputation: real('reputation').notNull().default(0.5), // 0-1 score
  totalStake: real('total_stake').notNull().default(0),
  predictionCount: integer('prediction_count').notNull().default(0),
  resolvedCount: integer('resolved_count').notNull().default(0),
  avgBrierScore: real('avg_brier_score').notNull().default(0.5),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Predictions - trader predictions on markets
export const predictions = sqliteTable('predictions', {
  id: text('id').primaryKey(), // UUID
  traderId: text('trader_id').notNull().references(() => traders.id),
  marketId: text('market_id').notNull(), // Dome market ID
  platform: text('platform').notNull(), // 'polymarket' | 'kalshi'
  probability: real('probability').notNull(), // 0-1
  confidence: real('confidence').notNull(), // 0-1
  stake: real('stake').notNull().default(1),
  status: text('status').notNull().default('active'), // 'active' | 'resolved' | 'cancelled'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Resolved markets - cache of resolved market outcomes
export const resolvedMarkets = sqliteTable('resolved_markets', {
  id: text('id').primaryKey(), // Market ID
  platform: text('platform').notNull(),
  title: text('title').notNull(),
  outcome: real('outcome').notNull(), // 0 or 1
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Scores - individual prediction scores after resolution
export const scores = sqliteTable('scores', {
  id: text('id').primaryKey(), // UUID
  predictionId: text('prediction_id').notNull().references(() => predictions.id),
  traderId: text('trader_id').notNull().references(() => traders.id),
  marketId: text('market_id').notNull().references(() => resolvedMarkets.id),
  predictedProbability: real('predicted_probability').notNull(),
  actualOutcome: real('actual_outcome').notNull(), // 0 or 1
  brierScore: real('brier_score').notNull(), // (predicted - actual)^2
  stake: real('stake').notNull(),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Auth nonces - for SIWE authentication
export const authNonces = sqliteTable('auth_nonces', {
  nonce: text('nonce').primaryKey(),
  walletAddress: text('wallet_address').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Type exports for use in services
export type Trader = typeof traders.$inferSelect;
export type NewTrader = typeof traders.$inferInsert;
export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;
export type ResolvedMarket = typeof resolvedMarkets.$inferSelect;
export type NewResolvedMarket = typeof resolvedMarkets.$inferInsert;
export type Score = typeof scores.$inferSelect;
export type NewScore = typeof scores.$inferInsert;
export type AuthNonce = typeof authNonces.$inferSelect;
export type NewAuthNonce = typeof authNonces.$inferInsert;
