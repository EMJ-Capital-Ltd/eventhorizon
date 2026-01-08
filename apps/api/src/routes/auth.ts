import { Elysia, t } from 'elysia';
import {
  generateNonce,
  verifySignature,
  getOrCreateTrader,
  createJWT,
  getTraderById,
} from '../services/auth';

export const authRoutes = new Elysia({ prefix: '/auth' })
  // Get nonce for SIWE
  .get(
    '/nonce',
    async ({ query }) => {
      const { address } = query;

      if (!address) {
        return {
          error: 'Wallet address required',
          code: 'MISSING_ADDRESS',
          timestamp: Date.now(),
        };
      }

      const nonce = await generateNonce(address);

      return {
        data: { nonce },
        timestamp: Date.now(),
      };
    },
    {
      query: t.Object({
        address: t.String(),
      }),
    }
  )

  // Verify SIWE signature and return JWT
  .post(
    '/verify',
    async ({ body }) => {
      const { message, signature } = body;

      const result = await verifySignature(message, signature);

      if (!result.valid) {
        return {
          error: result.error || 'Verification failed',
          code: 'VERIFICATION_FAILED',
          timestamp: Date.now(),
        };
      }

      // Get or create trader
      const trader = await getOrCreateTrader(result.address);

      if (!trader) {
        return {
          error: 'Failed to create trader account',
          code: 'TRADER_CREATION_FAILED',
          timestamp: Date.now(),
        };
      }

      // Create JWT
      const token = await createJWT({
        traderId: trader.id,
        walletAddress: trader.walletAddress,
      });

      return {
        data: {
          token,
          trader: {
            id: trader.id,
            walletAddress: trader.walletAddress,
            reputation: trader.reputation,
            predictionCount: trader.predictionCount,
            resolvedCount: trader.resolvedCount,
            avgBrierScore: trader.avgBrierScore,
          },
        },
        timestamp: Date.now(),
      };
    },
    {
      body: t.Object({
        message: t.String(),
        signature: t.String(),
      }),
    }
  )

  // Get current user info (requires auth)
  .get('/me', async ({ headers }) => {
    const authHeader = headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return {
        error: 'Authorization required',
        code: 'UNAUTHORIZED',
        timestamp: Date.now(),
      };
    }

    const token = authHeader.slice(7);
    const { verifyJWT } = await import('../services/auth');
    const payload = await verifyJWT(token);

    if (!payload) {
      return {
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
        timestamp: Date.now(),
      };
    }

    const trader = await getTraderById(payload.traderId);

    if (!trader) {
      return {
        error: 'Trader not found',
        code: 'TRADER_NOT_FOUND',
        timestamp: Date.now(),
      };
    }

    return {
      data: {
        id: trader.id,
        walletAddress: trader.walletAddress,
        reputation: trader.reputation,
        totalStake: trader.totalStake,
        predictionCount: trader.predictionCount,
        resolvedCount: trader.resolvedCount,
        avgBrierScore: trader.avgBrierScore,
        createdAt: trader.createdAt,
      },
      timestamp: Date.now(),
    };
  });
