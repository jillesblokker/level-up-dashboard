import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    // Exclude API routes and static assets from Clerk middleware
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 