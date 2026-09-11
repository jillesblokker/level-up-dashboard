import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/challenges-ultra-simple',
  '/manifest.json',
]);

export default clerkMiddleware(async (auth, request) => {
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (error) {
    console.error('[Middleware] Clerk auth() threw an error:', error);
  }
  const { pathname, searchParams } = request.nextUrl;

  const secFetchMode = request.headers.get('sec-fetch-mode');
  const acceptHeader = request.headers.get('accept') || '';
  const isRsc = searchParams.has('_rsc') || request.headers.get('rsc') === '1' || request.headers.has('next-router-state-tree');
  const isPrefetch = 
    request.headers.get('purpose') === 'prefetch' || 
    request.headers.get('x-middleware-prefetch') === '1' ||
    request.headers.get('next-router-prefetch') === '1' ||
    isRsc;

  // Bypass broken Next.js image optimizer on the live server
  if (pathname.startsWith('/_next/image')) {
    const imageUrl = searchParams.get('url');
    if (imageUrl) {
      return NextResponse.redirect(new URL(imageUrl, request.url));
    }
  }

  // If user is signed in and trying to access sign-in/sign-up, redirect to kingdom
  if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/kingdom', request.url));
  }

  // Handle unauthorized non-public routes
  if (!isPublicRoute(request) && !userId) {
    if (pathname.startsWith('/api/')) {
      // Allow API route handlers to perform multi-tier authentication (cookies + Bearer tokens)
      return NextResponse.next();
    }
    // For RSC fetches and link prefetches, return a clean 401 with CORS headers instead of a 307 redirect
    // This prevents Safari and WebKit from failing with "access control checks" and crashing the client router
    if (isPrefetch || isRsc) {
      return new NextResponse(null, {
        status: 401,
        headers: {
          'Content-Type': 'text/plain',
          'X-Clerk-Auth-Reason': 'unauthorized-prefetch',
          'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }
    const signInUrl = new URL('/sign-in', request.url);
    const searchString = searchParams.toString();
    signInUrl.searchParams.set('redirect_url', pathname + (searchString ? `?${searchString}` : ''));
    return NextResponse.redirect(signInUrl);
  }

  // Allow the request to continue with CORS headers for RSC requests
  const response = NextResponse.next();
  if (isRsc || isPrefetch) {
    const origin = request.headers.get('origin') || '*';
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url, Accept');
  }
  return response;
}, {
  // Use Clerk's CSP configuration with custom directives
  contentSecurityPolicy: {
    directives: {
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", "https://img.clerk.com", "data:"],
      'connect-src': [
        "'self'",
        "https://clerk-telemetry.com",
        "https://*.clerk-telemetry.com",
        "https://api.stripe.com",
        "https://maps.googleapis.com",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://*.clerk.com",
        "https://clerk.jillesblokker.com",
        "https://*.jillesblokker.com",
        "https://*.clerk.accounts.dev",
        "https://clerk.accounts.dev"
      ],
    },
  },
});

export const config = {
  matcher: [
    '/_next/image',
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|wav|mp3|ogg|mp4|webm)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
