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

// Define CSP policy that allows eval for development/libraries that need it
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://challenges.cloudflare.com https://js.stripe.com https://*.stripe.com https://maps.googleapis.com https://cdn.jsdelivr.net https://js.sentry-cdn.com https://browser.sentry-cdn.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://*.supabase.co https://img.clerk.com https://images.clerk.dev https://images.clerkstage.dev https://*.jillesblokker.com https://*.stripe.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co https://*.clerk.com https://clerk.com https://api.stripe.com https://*.sentry.io https://clerk-telemetry.com wss://*.supabase.co;
  frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com https://*.stripe.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const { pathname } = request.nextUrl;

  // If user is signed in and trying to access sign-in/sign-up, redirect to kingdom
  if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    const response = NextResponse.redirect(new URL('/kingdom', request.url));
    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  }

  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Allow the request to continue with CSP headers
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', cspHeader);
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
