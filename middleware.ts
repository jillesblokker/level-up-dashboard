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

const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const { pathname, searchParams } = request.nextUrl;

  // Detect RSC (React Server Component) prefetch requests
  // These have ?_rsc= in the URL and should NOT be redirected to external auth
  const isRscRequest = searchParams.has('_rsc');

  // If user is signed in and trying to access sign-in/sign-up, redirect to kingdom
  if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/kingdom', request.url));
  }

  // For API routes: return 401 JSON instead of redirecting (prevents CORS issues)
  if (!isPublicRoute(request) && isApiRoute(request) && !userId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }

  // For RSC prefetch requests to protected pages without auth:
  // Return 401 instead of redirecting to prevent CORS errors
  // The client-side will handle the redirect properly
  if (!isPublicRoute(request) && !userId && isRscRequest) {
    return NextResponse.json(
      { error: 'Unauthorized', redirect: '/sign-in' },
      { status: 401 }
    );
  }

  // Protect all non-RSC routes except public ones
  if (!isPublicRoute(request) && !isRscRequest) {
    await auth.protect();
  }

  // Allow the request to continue
  return NextResponse.next();
}, {
  // Use Clerk's CSP configuration with custom directives
  contentSecurityPolicy: {
    directives: {
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", "https://img.clerk.com", "data:"],
    },
  },
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
