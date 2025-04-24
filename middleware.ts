import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of paths that don't require authentication
const publicPaths = ['/auth/signin', '/auth/error']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow access to public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Skip auth check for API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check for skip-auth cookie (logged out version)
  const skipAuth = request.cookies.get('skip-auth')
  if (skipAuth?.value === 'true') {
    return NextResponse.next()
  }

  // Check for authentication
  const authCookie = request.cookies.get('next-auth.session-token')
  if (!authCookie) {
    // Store the original URL to redirect back after login
    const callbackUrl = request.nextUrl.pathname
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', callbackUrl)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
} 