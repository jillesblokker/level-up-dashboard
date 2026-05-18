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
  const { userId } = await auth();
  const { pathname, searchParams } = request.nextUrl;

  const acceptHeader = request.headers.get('accept') || '';
  const isNavigational = request.mode === 'navigate' && acceptHeader.includes('text/html');

  // If user is signed in and trying to access sign-in/sign-up, redirect to kingdom
  if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/kingdom', request.url));
  }

  // Return 401 for non-navigational requests (prefetch, RSC, XHR, etc.) to protected routes when signed out
  // This prevents CORS preflight errors from Clerk redirecting these requests
  if (!isPublicRoute(request) && !userId && !isNavigational) {
    return new NextResponse(null, {
      status: 401,
      headers: {
        'Content-Type': 'text/plain',
        'X-Clerk-Auth-Reason': 'unauthorized-fetch',
      }
    });
  }

  // Protect all non-public routes
  if (!isPublicRoute(request)) {
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
      'connect-src': [
        "'self'",
        "https://clerk-telemetry.com",
        "https://*.clerk-telemetry.com",
        "https://api.stripe.com",
        "https://maps.googleapis.com",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://*.clerk.com",
        "https://clerk.jillesblokker.com"
      ],
    },
  },
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|wav|mp3|ogg|mp4|webm)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
