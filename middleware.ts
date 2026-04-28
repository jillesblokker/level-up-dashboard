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
  // These have ?_rsc= in the URL or 'rsc' / 'next-router-prefetch' headers
  const isRscRequest = searchParams.has('_rsc') || 
                      request.headers.get('rsc') === '1' || 
                      request.headers.has('next-router-prefetch');

  // Helper to get the correct absolute URL (forces HTTPS in production)
  const getAbsoluteUrl = (path: string) => {
    const url = new URL(path, request.url);
    if (url.hostname === 'lvlup.jillesblokker.com') {
      url.protocol = 'https:';
    }
    return url;
  };

  // If user is signed in and trying to access sign-in/sign-up, redirect to kingdom
  if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(getAbsoluteUrl('/kingdom'));
  }

  // For API routes: return 401 JSON instead of redirecting (prevents CORS issues)
  if (!isPublicRoute(request) && isApiRoute(request) && !userId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { 
        status: 401,
        headers: {
          'X-Auth-Source': 'middleware'
        }
      }
    );
  }

  // For RSC prefetch requests to protected pages without auth:
  // Return 401 instead of redirecting to prevent CORS errors
  if (!isPublicRoute(request) && !userId && isRscRequest) {
    // For RSC, we want to return a response that doesn't trigger a browser redirect
    // so we can avoid CORS preflight failures.
    return new NextResponse(null, {
      status: 401,
      headers: {
        'Content-Type': 'text/plain',
        'X-Clerk-Auth-Reason': 'unauthorized',
      }
    });
  }

  // Protect all non-RSC routes except public ones
  if (!isPublicRoute(request) && !isRscRequest) {
    try {
      await auth.protect();
    } catch (error) {
      // If protect throws (redirect), we ensure it uses HTTPS
      return NextResponse.redirect(getAbsoluteUrl('/sign-in'));
    }
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
