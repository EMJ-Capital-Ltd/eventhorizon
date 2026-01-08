import { SiweMessage } from 'siwe';
import { db, traders, authNonces, type NewTrader } from '../db';
import { eq, and, gt } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { API_CONFIG } from '../config/constants';
import { normalizeWalletAddress } from '../utils/marketHelpers';

// Generate a random nonce for SIWE
export async function generateNonce(walletAddress: string): Promise<string> {
  const nonce = randomUUID();
  const normalizedAddress = normalizeWalletAddress(walletAddress);

  // Clean up old nonces for this wallet
  await db.delete(authNonces).where(eq(authNonces.walletAddress, normalizedAddress));

  // Store new nonce
  await db.insert(authNonces).values({
    nonce,
    walletAddress: normalizedAddress,
    expiresAt: new Date(Date.now() + API_CONFIG.NONCE_EXPIRY_MS),
  });

  return nonce;
}

// Verify SIWE message and signature
export async function verifySignature(
  message: string,
  signature: string
): Promise<{ address: string; valid: boolean; error?: string }> {
  try {
    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });

    if (!fields.success) {
      return { address: '', valid: false, error: 'Invalid signature' };
    }

    const normalizedAddress = normalizeWalletAddress(siweMessage.address);

    // Verify nonce exists and hasn't expired
    const nonceRecord = await db
      .select()
      .from(authNonces)
      .where(
        and(
          eq(authNonces.nonce, siweMessage.nonce),
          eq(authNonces.walletAddress, normalizedAddress),
          gt(authNonces.expiresAt, new Date())
        )
      )
      .get();

    if (!nonceRecord) {
      return { address: '', valid: false, error: 'Invalid or expired nonce' };
    }

    // Delete used nonce
    await db.delete(authNonces).where(eq(authNonces.nonce, siweMessage.nonce));

    return { address: normalizedAddress, valid: true };
  } catch (error) {
    console.error('SIWE verification error:', error);
    return { address: '', valid: false, error: 'Verification failed' };
  }
}

// Get or create trader by wallet address
export async function getOrCreateTrader(walletAddress: string) {
  const normalizedAddress = normalizeWalletAddress(walletAddress);

  // Try to find existing trader
  let trader = await db
    .select()
    .from(traders)
    .where(eq(traders.walletAddress, normalizedAddress))
    .get();

  if (!trader) {
    // Create new trader
    const newTrader: NewTrader = {
      id: randomUUID(),
      walletAddress: normalizedAddress,
      reputation: 0.5,
      totalStake: 0,
      predictionCount: 0,
      resolvedCount: 0,
      avgBrierScore: 0.5,
    };

    await db.insert(traders).values(newTrader);
    trader = await db
      .select()
      .from(traders)
      .where(eq(traders.walletAddress, normalizedAddress))
      .get();
  }

  return trader;
}

// Get trader by ID
export async function getTraderById(traderId: string) {
  return db.select().from(traders).where(eq(traders.id, traderId)).get();
}

// Get trader by wallet address
export async function getTraderByWallet(walletAddress: string) {
  const normalizedAddress = normalizeWalletAddress(walletAddress);
  return db.select().from(traders).where(eq(traders.walletAddress, normalizedAddress)).get();
}

// Simple JWT implementation using Bun's native crypto
export async function createJWT(payload: { traderId: string; walletAddress: string }): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + API_CONFIG.JWT_EXPIRY_SECONDS;

  const jwtPayload = {
    ...payload,
    iat: now,
    exp,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');
  const data = `${encodedHeader}.${encodedPayload}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(API_CONFIG.JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const encodedSignature = Buffer.from(signature).toString('base64url');

  return `${data}.${encodedSignature}`;
}

// Verify JWT and return payload
export async function verifyJWT(token: string): Promise<{ traderId: string; walletAddress: string } | null> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return null;
    }

    // Verify signature
    const data = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(API_CONFIG.JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = Buffer.from(encodedSignature, 'base64url');
    const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));

    if (!valid) {
      return null;
    }

    // Decode and verify expiry
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return null;
    }

    return {
      traderId: payload.traderId,
      walletAddress: payload.walletAddress,
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}
