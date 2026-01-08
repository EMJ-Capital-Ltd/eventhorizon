export const API_CONFIG = {
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'eventhorizon-dev-secret',
  NONCE_EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
  JWT_EXPIRY_SECONDS: 7 * 24 * 60 * 60, // 7 days

  // Market data
  DEFAULT_MARKET_LIMIT: 50,
  DEFAULT_HISTORY_DAYS: 7,
  CANDLESTICK_INTERVAL: 60, // 1 hour
  TRADE_HISTORY_LIMIT: 100,

  // Platform-specific
  KALSHI_PRICE_DIVISOR: 100, // Kalshi prices are in cents

  // Volume calculations
  WEEKLY_TO_DAILY_VOLUME_DIVISOR: 7,
} as const;

export const DOME_API_CONFIG = {
  API_KEY: process.env.DOME_API_KEY || '',
  BASE_URL: 'https://api.dome.com',
} as const;