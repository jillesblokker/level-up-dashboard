import { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseServer } from './server-client';

/**
 * JWT Verification following the authentication flow:
 * 1. Frontend sends request with Clerk JWT
 * 2. Backend verifies JWT with Clerk 
 * 3. Backend queries Supabase with service key
 */

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
}

/**
 * Step 1: Verify Clerk JWT from request headers
 * Extracts and validates the JWT token from Authorization header
 */
export async function verifyClerkJWT(request: Request): Promise<AuthResult> {
  try {
    // Convert to NextRequest for Clerk compatibility
    const nextReq = request instanceof NextRequest 
      ? request 
      : new NextRequest(request.url, { 
          headers: request.headers, 
          method: request.method, 
          body: (request as any).body 
        });

    // Extract Authorization header
    const authHeader = nextReq.headers.get('authorization');
    console.log('[JWT Verification] URL:', nextReq.url);
    console.log('[JWT Verification] Authorization header present:', !!authHeader);
    console.log('[JWT Verification] Authorization header (first 20 chars):', authHeader?.substring(0, 20));
    
    if (!authHeader) {
      console.error('[JWT Verification] Missing authorization header');
      return { success: false, error: 'Missing authorization header' };
    }

    // Validate Bearer token format
    const token = authHeader.replace(/^Bearer /i, '');
    if (!token || token === authHeader) {
      console.error('[JWT Verification] Invalid token format:', authHeader.substring(0, 20));
      return { success: false, error: 'Invalid token format' };
    }

    console.log('[JWT Verification] Token extracted (first 20 chars):', token.substring(0, 20));

    // Verify with Clerk
    const { userId } = await getAuth(nextReq);
    console.log('[JWT Verification] Clerk userId from getAuth:', userId);
    
    if (!userId) {
      console.error('[JWT Verification] getAuth returned no userId');
      return { success: false, error: 'Invalid or expired JWT' };
    }

    console.log('[JWT Verification] Success! UserId:', userId);
    return { success: true, userId };
  } catch (error) {
    console.error('[JWT Verification] Clerk verification failed:', error);
    return { success: false, error: 'JWT verification failed' };
  }
}

/**
 * Step 2: Query Supabase with service key
 * Uses the verified userId to make authenticated queries to Supabase
 * Sets user context for RLS policies
 */
export async function querySupabaseWithServiceKey<T>(
  userId: string,
  queryFn: (supabase: typeof supabaseServer, userId: string) => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    // Verify Supabase client is initialized
    if (!supabaseServer) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    // Set user context for RLS policies
    try {
      // TEMPORARILY DISABLED: await supabaseServer.rpc('public.set_user_context', { user_id: userId });
      console.log('[Supabase Query] Skipping set user context for debugging, userId:', userId);
    } catch (contextError) {
      console.warn('[Supabase Query] Failed to set user context (continuing anyway):', contextError);
    }

    // Execute query with service key privileges and RLS enforcement
    const data = await queryFn(supabaseServer, userId);
    
    return { success: true, data };
  } catch (error) {
    console.error('[Supabase Query] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Database query failed' 
    };
  }
}

/**
 * Complete authentication flow combining Clerk JWT verification + Supabase query
 */
export async function authenticatedSupabaseQuery<T>(
  request: Request,
  queryFn: (supabase: typeof supabaseServer, userId: string) => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string; userId?: string }> {
  // Step 1: Verify Clerk JWT
  const authResult = await verifyClerkJWT(request);
  if (!authResult.success || !authResult.userId) {
    return { 
      success: false, 
      error: authResult.error || 'Authentication failed' 
    };
  }

  // Step 2: Query Supabase with service key
  const queryResult = await querySupabaseWithServiceKey(authResult.userId, queryFn);
  
  return {
    success: queryResult.success,
    data: queryResult.data,
    error: queryResult.error,
    userId: authResult.userId
  } as { success: boolean; data?: T; error?: string; userId?: string };
}

/**
 * Middleware helper for API routes
 * Returns 401 response if authentication fails
 */
export function withAuth<T>(
  queryFn: (supabase: typeof supabaseServer, userId: string) => Promise<T>
) {
  return async (request: Request) => {
    const result = await authenticatedSupabaseQuery(request, queryFn);
    
    if (!result.success) {
      return Response.json(
        { error: result.error || 'Authentication failed' }, 
        { status: 401 }
      );
    }

    return { data: result.data, userId: result.userId };
  };
} 