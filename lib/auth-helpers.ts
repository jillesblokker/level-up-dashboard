/**
 * Shared authentication helpers for API calls
 * This prevents infinite loops when 401 errors occur
 */

import { authLogger } from './logger';

// Type for clerk instance from window
interface ClerkInstance {
  user: { id: string } | null;
  session: {
    getToken(options?: { skipCache?: boolean }): Promise<string | null>;
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
const CIRCUIT_BREAKER_TIMEOUT = 30 * 1000; // 30 seconds (reduced from 5 minutes)

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
export async function getClerkToken(forceRefresh = false): Promise<string> {
  if (typeof window === 'undefined') {
    return '';
  }

  // Wait for Clerk to be available with retry logic
  let attempts = 0;
  const maxAttempts = 15; // Increased attempts slightly
  const typedWindow = window as WindowWithClerk;

  while (attempts < maxAttempts) {
    try {
      // Try multiple possible Clerk properties on window
      const clerkInstance = typedWindow.__clerk || typedWindow.Clerk || typedWindow.clerk;

      if (!clerkInstance) {
        if (attempts === maxAttempts - 1) authLogger.warn('Clerk instance not found on window after max attempts');
        await new Promise(resolve => setTimeout(resolve, 150));
        attempts++;
        continue;
      }

      // Check if user is signed in
      if (!clerkInstance.user) {
        if (attempts === maxAttempts - 1) authLogger.warn('Clerk user not found in instance after max attempts');
        await new Promise(resolve => setTimeout(resolve, 150));
        attempts++;
        continue;
      }

      // Get the current session
      const session = clerkInstance.session;
      if (!session) {
        if (attempts === maxAttempts - 1) authLogger.warn('Clerk session not found in instance after max attempts');
        await new Promise(resolve => setTimeout(resolve, 150));
        attempts++;
        continue;
      }

      // Get token
      const token = await session.getToken({ skipCache: forceRefresh });

      if (!token) {
        if (attempts === maxAttempts - 1) authLogger.warn('Clerk session.getToken() returned null after max attempts');
        await new Promise(resolve => setTimeout(resolve, 150));
        attempts++;
        continue;
      }

      return token;
    } catch (error) {
      if (attempts === maxAttempts - 1) authLogger.error('Error during getClerkToken:', error);
      await new Promise(resolve => setTimeout(resolve, 150));
      attempts++;
    }
  }

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
    const source = response.headers.get('X-Auth-Source') || 'API';
    authLogger.error(`Authentication failed for ${endpoint} (${response.status}) [Source: ${source}]`);
    markAuthError(circuitKey);
    return null;
  }

  // On successful auth, clear any previous circuit breaker for this endpoint
  authErrorTimestamps.delete(circuitKey);

  return response;
}