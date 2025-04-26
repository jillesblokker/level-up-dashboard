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

  // Check for skip-auth cookie (logged out version)
  const skipAuth = request.cookies.get('skip-auth')
  if (skipAuth?.value === 'true') {
    return NextResponse.next()
  }

  // Check for authentication
  const authCookie = request.cookies.get('next-auth.session-token')
  if (!authCookie) {
    // Redirect to sign in page if not authenticated
    return NextResponse.redirect(new URL('/auth/signin', request.url))
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
} 