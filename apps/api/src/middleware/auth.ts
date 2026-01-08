import { Elysia } from 'elysia';
import { verifyJWT, getTraderById } from '../services/auth';
import type { Trader } from '../db/schema';

// Derive type for authenticated context
export interface AuthContext {
  trader: Trader;
}

// Auth middleware that extracts and verifies JWT
export const authMiddleware = new Elysia({ name: 'auth' })
  .derive(async ({ headers }) => {
    const authHeader = headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return { trader: null as Trader | null };
    }

    const token = authHeader.slice(7);
    const payload = await verifyJWT(token);

    if (!payload) {
      return { trader: null as Trader | null };
    }

    const trader = await getTraderById(payload.traderId);
    return { trader: trader || null };
  });

// Guard that requires authentication
export const requireAuth = new Elysia({ name: 'requireAuth' })
  .use(authMiddleware)
  .onBeforeHandle(({ trader, set }) => {
    if (!trader) {
      set.status = 401;
      return {
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        timestamp: Date.now(),
      };
    }
  });
