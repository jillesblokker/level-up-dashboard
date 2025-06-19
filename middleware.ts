import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude API routes and static assets from Clerk middleware
    '/((?!api|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 