import NextAuth from "next-auth"
import { authOptions } from "@/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

// Export all HTTP methods that NextAuth might need
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const HEAD = handler

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// Force dynamic runtime to prevent caching
export const dynamic = "force-dynamic"
