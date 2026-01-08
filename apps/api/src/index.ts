import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { eventsRoutes } from './routes/events';
import { predictionsRoutes } from './routes/predictions';
import { marketsRoutes } from './routes/markets';
import { authRoutes } from './routes/auth';
import { marketPredictionsRoutes } from './routes/market-predictions';
import { leaderboardRoutes } from './routes/leaderboard';
import { resolvedRoutes } from './routes/resolved';
import { initializeDatabase } from './db';

// Initialize database on startup
initializeDatabase();

const app = new Elysia()
  .use(cors())
  .get('/health', () => ({
    status: 'ok',
    timestamp: Date.now(),
    hasDomeKey: !!process.env.DOME_API_KEY,
  }))
  .use(authRoutes) // Wallet authentication
  .use(eventsRoutes) // Legacy events (seed data)
  .use(marketsRoutes) // Real markets from Dome
  .use(marketPredictionsRoutes) // Market predictions with signals
  .use(leaderboardRoutes) // Trader leaderboard
  .use(resolvedRoutes) // Resolution and scoring
  .use(predictionsRoutes) // Legacy predictions
  .listen(3000);

console.log(`🌌 EventHorizon API running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
