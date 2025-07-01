import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/signin',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // If the route is public, let it pass through.
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // For all other (protected) routes, check for authentication.
  const { userId } = await auth();
  
  // If the user is not authenticated, redirect to the sign-in page.
  if (!userId) {
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // If the user is authenticated, allow them to access the protected route.
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
