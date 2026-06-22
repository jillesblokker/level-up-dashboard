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

  const secFetchMode = request.headers.get('sec-fetch-mode');
  const acceptHeader = request.headers.get('accept') || '';
  const isPrefetch = request.headers.get('purpose') === 'prefetch' || request.headers.get('x-middleware-prefetch') === '1';
  const isNavigational = 
    secFetchMode === 'navigate' || 
    request.mode === 'navigate' || 
    (acceptHeader.includes('text/html') && !isPrefetch);

  
  // Bypass broken Next.js image optimizer on the live server
  if (pathname.startsWith('/_next/image')) {
    const imageUrl = searchParams.get('url');
    if (imageUrl) {
      return NextResponse.redirect(new URL(imageUrl, request.url));
    }
  }

  
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

  // Redirect unauthorized non-public routes to local sign-in, except for prefetches which get a 401
  if (!isPublicRoute(request) && !userId) {
    if (isPrefetch) {
      return new NextResponse(null, {
        status: 401,
        headers: {
          'Content-Type': 'text/plain',
          'X-Clerk-Auth-Reason': 'unauthorized-prefetch',
        }
      });
    }
    const signInUrl = new URL('/sign-in', request.url);
    const searchString = searchParams.toString();
    signInUrl.searchParams.set('redirect_url', pathname + (searchString ? `?${searchString}` : ''));
    return NextResponse.redirect(signInUrl);
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
    '/_next/image',

    '/_next/image',

    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|wav|mp3|ogg|mp4|webm)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
