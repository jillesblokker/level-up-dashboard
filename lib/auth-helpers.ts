// Shared authentication helpers for API calls
// This prevents infinite loops when 401 errors occur

// Helper to get Clerk token
export async function getClerkToken(): Promise<string> {
  if (typeof window !== 'undefined') {
    try {
      // Try multiple approaches to get the Clerk token
      const clerkInstance = (window as any).Clerk;
      
      if (!clerkInstance) {
        console.warn('[Clerk Token] Clerk instance not found on window');
        return '';
      }

      // Check if user is signed in
      if (!clerkInstance.user) {
        console.warn('[Clerk Token] No user signed in');
        return '';
      }

      // Get the token from the session
      const session = clerkInstance.session;
      if (!session) {
        console.warn('[Clerk Token] No active session');
        return '';
      }

      const token = await session.getToken();
      
      if (!token) {
        console.warn('[Clerk Token] Failed to get token from session');
        return '';
      }

      console.log('[Clerk Token] Successfully retrieved token:', token.slice(0, 20) + '...');
      return token;
    } catch (error) {
      console.error('[Clerk Token] Error getting Clerk token:', error);
      return '';
    }
  }
  console.warn('[Clerk Token] Not in browser environment');
  return '';
}

// Authentication error tracker to prevent infinite loops
const authErrors = new Set<string>();

export function isAuthError(response: Response): boolean {
  return response.status === 401;
}

export function markAuthError(endpoint: string): void {
  authErrors.add(endpoint);
  console.warn(`[Auth Circuit Breaker] Marking ${endpoint} as failed, will retry in 5 minutes`);
  // Clear the error after 5 minutes to allow retry
  setTimeout(() => {
    authErrors.delete(endpoint);
    console.log(`[Auth Circuit Breaker] Cleared auth error for ${endpoint}, allowing retries`);
  }, 5 * 60 * 1000);
}

export function hasRecentAuthError(endpoint: string): boolean {
  return authErrors.has(endpoint);
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

  // Make authenticated request
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Check for auth error and mark circuit breaker
  if (isAuthError(response)) {
    console.error(`[${contextName}] Authentication failed for ${endpoint}, marking endpoint`);
    markAuthError(circuitKey);
    return null;
  }

  return response;
} 