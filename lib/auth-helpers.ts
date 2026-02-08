/**
 * Shared authentication helpers for API calls
 * This prevents infinite loops when 401 errors occur
 */

import { authLogger } from './logger';

// Type for clerk instance from window
interface ClerkInstance {
  user: { id: string } | null;
  session: {
    getToken(): Promise<string | null>;
  } | null;
}

// Type for window with clerk
interface WindowWithClerk extends Window {
  __clerk?: ClerkInstance;
  Clerk?: ClerkInstance;
  clerk?: ClerkInstance;
}

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

/**
 * Get Clerk authentication token
 * Uses retry logic to wait for Clerk to be available
 */
export async function getClerkToken(): Promise<string> {
  if (typeof window === 'undefined') {
    authLogger.warn('Not in browser environment');
    return '';
  }

  // Wait for Clerk to be available with retry logic
  let attempts = 0;
  const maxAttempts = 10;
  const typedWindow = window as WindowWithClerk;

  while (attempts < maxAttempts) {
    try {
      // Try multiple possible Clerk properties on window
      const clerkInstance = typedWindow.__clerk || typedWindow.Clerk || typedWindow.clerk;

      if (!clerkInstance) {
        authLogger.debug(`Clerk instance not found, attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        continue;
      }

      // Check if user is signed in
      if (!clerkInstance.user) {
        authLogger.debug(`No user signed in, attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        continue;
      }

      // Get the current session
      const session = clerkInstance.session;
      if (!session) {
        authLogger.debug(`No active session, attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        continue;
      }

      // Get token WITHOUT template (for API routes, not Supabase RLS)
      const token = await session.getToken();

      if (!token) {
        authLogger.debug(`Failed to get token from session, attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        continue;
      }

      // Successfully retrieved token
      return token;
    } catch (error) {
      authLogger.debug(`Error getting Clerk token (attempt ${attempts + 1}):`, error);
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  authLogger.error('Failed to get Clerk token after all attempts');
  return '';
}

/**
 * Shared fetch wrapper with authentication and circuit breaker
 */
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {},
  contextName: string = 'API'
): Promise<Response | null> {
  // Check circuit breaker
  const circuitKey = `${endpoint}_${options.method || 'GET'}`;
  if (hasRecentAuthError(circuitKey)) {
    authLogger.warn(`Skipping request to ${endpoint} due to circuit breaker`);
    return null;
  }

  // Get authentication token
  const token = await getClerkToken();
  if (!token) {
    authLogger.warn(`No authentication token available for ${endpoint}`);
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
    authLogger.error(`Authentication failed for ${endpoint} (${response.status})`);
    markAuthError(circuitKey);
    return null;
  }

  // On successful auth, clear any previous circuit breaker for this endpoint
  authErrorTimestamps.delete(circuitKey);

  return response;
}