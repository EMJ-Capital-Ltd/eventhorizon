import { auth0 } from '@/lib/auth0';

export async function GET() {
  // Force Google OAuth connection
  return auth0.startInteractiveLogin({
    authorizationParameters: {
      connection: 'google-oauth2',
    },
  });
}
