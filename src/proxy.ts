import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth0, isAuthorizedEmail } from '@/lib/auth0';

/**
 * Conditional Proxy for UAT Authentication
 *
 * Next.js 16 uses proxy.ts instead of the deprecated middleware.ts
 *
 * BEHAVIOR:
 * - When NEXT_PUBLIC_APP_ENV=uat: All routes protected by Auth0
 * - Otherwise (production, development): All routes publicly accessible
 *
 * The Auth0 middleware automatically:
 * 1. Protects all routes (redirects unauthenticated users to login)
 * 2. Serves auth endpoints (/api/auth/login, /api/auth/logout, /api/auth/callback, /api/auth/me)
 * 3. Manages session cookies
 */

export default async function proxy(request: NextRequest) {
  const isUATEnvironment = process.env.NEXT_PUBLIC_APP_ENV === 'uat';

  if (!isUATEnvironment) {
    // Production/Development: Allow all requests through
    return NextResponse.next();
  }

  // UAT mode
  const { pathname } = request.nextUrl;
  console.log('[Proxy] UAT mode - Path:', pathname);

  // Let Auth0 middleware handle callback, logout, and me routes
  if (pathname === '/api/auth/callback' || pathname === '/api/auth/logout' || pathname === '/api/auth/me') {
    console.log('[Proxy] Auth0 route - delegating to middleware');
    return await auth0.middleware(request);
  }

  // Let login route go to route handler (uses startInteractiveLogin)
  if (pathname === '/api/auth/login') {
    console.log('[Proxy] Login route - bypassing to route handler');
    return NextResponse.next();
  }

  // Allow unauthorized page without authentication
  if (pathname === '/unauthorized') {
    console.log('[Proxy] Unauthorized page - allowing access');
    return NextResponse.next();
  }

  // For all other routes, check session
  try {
    const session = await auth0.getSession(request);
    console.log('[Proxy] Session check:', session ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');

    if (!session) {
      // No session - redirect to login
      const loginUrl = new URL('/api/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      console.log('[Proxy] Redirecting to:', loginUrl.toString());
      return NextResponse.redirect(loginUrl);
    }

    // Validate email domain
    const email = session.user?.email;
    if (!isAuthorizedEmail(email)) {
      console.error(`[Proxy] Unauthorized email domain: ${email}`);
      // Clear the session and redirect to unauthorized page
      const response = NextResponse.redirect(new URL('/unauthorized', request.url));
      // Delete the session cookie
      response.cookies.delete('appSession');
      return response;
    }

    // User is authenticated and authorized
    console.log('[Proxy] User authenticated and authorized, allowing access');
    return NextResponse.next();
  } catch (error) {
    console.error('[Proxy] Error checking session:', error);
    return NextResponse.next();
  }
}

/**
 * Configure which routes the proxy runs on
 * Excludes static assets and Next.js internal files for performance
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static files (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
