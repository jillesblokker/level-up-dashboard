// Shared authentication helpers for API calls
// This prevents infinite loops when 401 errors occur

import { useAuth } from '@clerk/nextjs';

// Circuit breaker to prevent infinite auth error loops
const authErrorTimestamps: Map<string, number> = new Map();
const CIRCUIT_BREAKER_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function hasRecentAuthError(endpoint: string): boolean {
  const lastError = authErrorTimestamps.get(endpoint);
  if (!lastError) return false;
  
  const timeSinceError = Date.now() - lastError;
  if (timeSinceError > CIRCUIT_BREAKER_TIMEOUT) {
    authErrorTimestamps.delete(endpoint);
    return false;
  }
  
  return true;
}

export function markAuthError(endpoint: string): void {
  authErrorTimestamps.set(endpoint, Date.now());
}

export function isAuthError(response: Response): boolean {
  return response.status === 401 || response.status === 403;
}

// FIXED: Proper Clerk token retrieval using the official Clerk hooks
export async function getClerkToken(): Promise<string> {
  if (typeof window === 'undefined') {
    console.warn('[Clerk Token] Not in browser environment');
    return '';
  }

  // Wait for Clerk to be available with retry logic
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    try {
      // Try multiple possible Clerk properties on window
      const clerkInstance = (window as any).__clerk || (window as any).Clerk || (window as any).clerk;
      
      if (!clerkInstance) {
        console.log(`[Clerk Token] Clerk instance not found on window, attempt ${attempts + 1}/${maxAttempts}`);
        console.log('[Clerk Token] Available window properties:', Object.keys(window).filter(key => key.toLowerCase().includes('clerk')));
        
        // Try alternative approach: check if we're in a Clerk context
        if (attempts === 0) {
          console.log('[Clerk Token] Trying to check if Clerk context is available...');
          // This will help debug what's available
          const availableProps = Object.keys(window).filter(key => 
            key.toLowerCase().includes('clerk') || 
            key.toLowerCase().includes('auth') ||
            key.toLowerCase().includes('user')
          );
          console.log('[Clerk Token] Potentially relevant window properties:', availableProps);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        continue;
      }

      // Check if user is signed in
      if (!clerkInstance.user) {
        console.log(`[Clerk Token] No user signed in, attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        continue;
      }

      // Get the current session
      const session = clerkInstance.session;
      if (!session) {
        console.log(`[Clerk Token] No active session, attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        continue;
      }

      // Get token WITHOUT template (for API routes, not Supabase RLS)
      const token = await session.getToken();
      
      if (!token) {
        console.log(`[Clerk Token] Failed to get token from session, attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        continue;
      }

      // Successfully retrieved token
      console.log('[Clerk Token] Successfully retrieved token');
      return token;
    } catch (error) {
      console.error(`[Clerk Token] Error getting Clerk token (attempt ${attempts + 1}):`, error);
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }
  
  console.error('[Clerk Token] Failed to get Clerk token after all attempts');
  return '';
}

// Shared fetch wrapper with authentication and circuit breaker
export async function authenticatedFetch(
  endpoint: string, 
  options: RequestInit = {}, 
  contextName: string = 'API'
): Promise<Response | null> {
  // Check circuit breaker
  const circuitKey = `${endpoint}_${options.method || 'GET'}`;
  if (hasRecentAuthError(circuitKey)) {
    console.warn(`[${contextName}] Skipping request to ${endpoint} due to recent auth error`);
    return null;
  }
  
  // Get authentication token
  const token = await getClerkToken();
  if (!token) {
    console.warn(`[${contextName}] No authentication token available, skipping request to ${endpoint}`);
    return null;
  }

      // Making authenticated request

  // Make authenticated request
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

      // Response received

  // Check for auth error and mark circuit breaker
  if (isAuthError(response)) {
    console.error(`[${contextName}] Authentication failed for ${endpoint}, marking endpoint`);
    markAuthError(circuitKey);
    return null;
  }

  return response;
} 