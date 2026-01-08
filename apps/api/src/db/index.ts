import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

// Get database path from env or use default
const dbPath = process.env.DATABASE_URL || './data/eventhorizon.db';

// Create SQLite connection using Bun's native driver
const sqlite = new Database(dbPath, { create: true });

// Enable WAL mode for better performance
sqlite.exec('PRAGMA journal_mode = WAL');

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Initialize tables
export function initializeDatabase() {
  // Create traders table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS traders (
      id TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL UNIQUE,
      reputation REAL NOT NULL DEFAULT 0.5,
      total_stake REAL NOT NULL DEFAULT 0,
      prediction_count INTEGER NOT NULL DEFAULT 0,
      resolved_count INTEGER NOT NULL DEFAULT 0,
      avg_brier_score REAL NOT NULL DEFAULT 0.5,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Create predictions table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      trader_id TEXT NOT NULL REFERENCES traders(id),
      market_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      probability REAL NOT NULL,
      confidence REAL NOT NULL,
      stake REAL NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Create resolved_markets table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS resolved_markets (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      outcome REAL NOT NULL,
      resolved_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // Create scores table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY,
      prediction_id TEXT NOT NULL REFERENCES predictions(id),
      trader_id TEXT NOT NULL REFERENCES traders(id),
      market_id TEXT NOT NULL REFERENCES resolved_markets(id),
      predicted_probability REAL NOT NULL,
      actual_outcome REAL NOT NULL,
      brier_score REAL NOT NULL,
      stake REAL NOT NULL,
      resolved_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // Create auth_nonces table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS auth_nonces (
      nonce TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // Create indexes
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_traders_wallet ON traders(wallet_address)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_predictions_trader ON predictions(trader_id)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_predictions_market ON predictions(market_id)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_scores_trader ON scores(trader_id)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_scores_market ON scores(market_id)`);
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_auth_nonces_wallet ON auth_nonces(wallet_address)`);

  console.log('📦 Database initialized');
}

// Export schema for use elsewhere
export * from './schema';
