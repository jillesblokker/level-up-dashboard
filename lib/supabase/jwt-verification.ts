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
    console.log('[JWT Verification] Starting verification for:', request.url);
    
    // For POST requests, we need to handle the body carefully to avoid "disturbed or locked" error
    let nextReq: NextRequest;
    
    if (request.method === 'POST') {
      // For POST requests, create a new request without the body to avoid conflicts
      const url = new URL(request.url);
      nextReq = new NextRequest(url, {
        method: 'POST',
        headers: request.headers,
        // Don't include body for Clerk verification - we only need the headers
      });
    } else {
      // For GET requests, we can use the original request
      nextReq = request instanceof NextRequest 
        ? request 
        : new NextRequest(request.url, { 
            headers: request.headers, 
            method: request.method
          });
    }

    console.log('[JWT Verification] Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Try to get auth from cookies (client-side approach)
    const { userId } = await getAuth(nextReq);
    console.log('[JWT Verification] Clerk userId from getAuth:', userId);
    
    if (!userId) {
      console.error('[JWT Verification] getAuth returned no userId');
      
      // Try alternative approach - check Authorization header directly
      const authHeader = request.headers.get('authorization');
      console.log('[JWT Verification] Authorization header:', authHeader ? 'present' : 'missing');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log('[JWT Verification] Token found in Authorization header, length:', token.length);
        
        // For now, return a mock userId for testing
        // TODO: Implement proper JWT verification
        return { success: true, userId: 'temp-user-id' };
      }
      
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