import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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
 * Step 1: Verify Clerk JWT using official Clerk auth() helper
 * This replaces the fragile manual JWT parsing which was causing 401 errors
 */
export async function verifyClerkJWT(request: Request): Promise<AuthResult> {
  try {
    // SECURITY UPGRADE: Use official Clerk auth() helper
    // This handles all edge cases (Bearer tokens, cookies, etc.) robustly
    const { userId } = await auth();

    if (userId) {
      console.log('[JWT Verification] Success via Clerk auth(), userId:', userId);
      return { success: true, userId };
    }

    // If auth() fails, try checking the header manually just for logging purposes
    // but relying on auth() is the primary source of truth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('[JWT Verification] No Authorization header found');
    } else {
      console.log('[JWT Verification] Authorization header present but auth() returned null');
    }

    console.log('[JWT Verification] Authentication failed');
    return { success: false, error: 'Authentication failed: No valid session.' };
  } catch (error) {
    console.error('[JWT Verification] Clerk auth() failed:', error);
    return { success: false, error: 'Internal authentication error' };
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
      // SECURITY UPGRADE ENABLED
      // Row Level Security (RLS) policies now enforce access control via this context
      await supabaseServer.rpc('public.set_user_context', { user_id: userId });

      // console.log('[Supabase Query] Skipping set user context for debugging, userId:', userId);
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
      error: error && typeof error === 'object' && 'message' in error
        ? (error as any).message
        : error instanceof Error
          ? error.message
          : 'Database query failed'
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
  console.log('[AuthenticatedSupabaseQuery] Starting authentication for:', request.url);

  // Step 1: Verify Clerk JWT
  const authResult = await verifyClerkJWT(request);
  console.log('[AuthenticatedSupabaseQuery] Auth result:', authResult);

  if (!authResult.success || !authResult.userId) {
    console.log('[AuthenticatedSupabaseQuery] Authentication failed:', authResult.error);
    return {
      success: false,
      error: authResult.error || 'Authentication failed'
    };
  }

  // Step 2: Query Supabase with service key
  console.log('[AuthenticatedSupabaseQuery] Proceeding to Supabase query with userId:', authResult.userId);
  const queryResult = await querySupabaseWithServiceKey(authResult.userId, queryFn);
  console.log('[AuthenticatedSupabaseQuery] Query result:', queryResult);

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

/**
 * Complete authentication flow for visiting another user's data (friends only)
 */
export async function authenticatedFriendQuery<T>(
  request: Request,
  targetUserId: string,
  queryFn: (supabase: typeof supabaseServer, targetId: string) => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string; userId?: string }> {
  console.log(`[AuthenticatedFriendQuery] Requesting data for ${targetUserId} by ${request.url}`);

  // Step 1: Verify requester's JWT
  const authResult = await verifyClerkJWT(request);
  if (!authResult.success || !authResult.userId) {
    return { success: false, error: 'Authentication failed' };
  }
  const currentUserId = authResult.userId;

  // Step 2: If visiting self, proceed directly
  if (currentUserId === targetUserId) {
    const queryResult = await querySupabaseWithServiceKey(targetUserId, queryFn);
    return { ...queryResult, userId: currentUserId };
  }

  // Step 3: Check friendship status
  try {
    const { data: friendship, error } = await supabaseServer
      .from('friends')
      .select('status')
      .or(`and(user_id.eq.${currentUserId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserId})`)
      .single();

    if (error || !friendship || friendship.status !== 'accepted') {
      console.log(`[AuthenticatedFriendQuery] Forbidden: Users ${currentUserId} and ${targetUserId} are not allies.`);
      return { success: false, error: 'Forbidden: You are not allies with this player.' };
    }

    // Step 4: Proceed with query on targetUserId
    const queryResult = await querySupabaseWithServiceKey(targetUserId, queryFn);
    return { ...queryResult, userId: currentUserId };
  } catch (err) {
    console.error('[AuthenticatedFriendQuery] Friendship check failed:', err);
    return { success: false, error: 'Internal server error during friendship verification' };
  }
}
