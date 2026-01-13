import { Auth0Client } from '@auth0/nextjs-auth0/server';

/**
 * Auth0 Client for UAT environment protection
 *
 * This client is used to handle authentication in the UAT environment.
 * When NEXT_PUBLIC_APP_ENV=uat, the proxy will use this client to protect all routes.
 *
 * Required environment variables (UAT only):
 * - AUTH0_SECRET: Random secret for encrypting cookies (generate with: openssl rand -hex 32)
 * - APP_BASE_URL: Your Next.js app's URL (e.g., https://uat.yourapp.com or http://localhost:3000)
 * - AUTH0_DOMAIN: Your Auth0 tenant domain (e.g., dev-abc123.us.auth0.com)
 * - AUTH0_CLIENT_ID: From Auth0 dashboard → Applications → Your App → Client ID
 * - AUTH0_CLIENT_SECRET: From Auth0 dashboard → Applications → Your App → Client Secret
 *
 * Access Control:
 * - Only Google OAuth is enabled
 * - Only @emjx.ai email domains are allowed
 */

export const ALLOWED_EMAIL_DOMAIN = 'emjx.ai';

export const auth0 = new Auth0Client({
  routes: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    callback: '/api/auth/callback',
  },
});

/**
 * Validates if a user's email domain is authorized
 */
export function isAuthorizedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const emailDomain = email.split('@')[1];
  return emailDomain === ALLOWED_EMAIL_DOMAIN;
}
