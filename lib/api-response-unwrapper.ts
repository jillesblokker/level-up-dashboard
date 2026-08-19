/**
 * Universal API Response Unwrapper Utility
 * 
 * Standardizes API payload extraction across all Thrivehaven endpoints.
 * Handles both wrapped payloads ({ success: true, data: { ... } }) and
 * direct payload objects ({ level: 46, gold: 1000 }) seamlessly.
 */

export function unwrapApiResponse<T>(result: any): T | null {
  if (!result) return null;

  // Handle string response (e.g. JSON strings or HTML 502/500 error pages)
  if (typeof result === 'string') {
    const trimmed = result.trim();
    if (trimmed.startsWith('<')) {
      return null;
    }
    try {
      result = JSON.parse(result);
    } catch {
      return null;
    }
  }

  // Handle { success: true, data: { ... } } wrapper from authenticatedSupabaseQuery
  if (typeof result === 'object' && result !== null && 'success' in result && result.data !== undefined) {
    return result.data as T;
  }

  // Handle error responses: { success: false } or { error: "..." }
  if (typeof result === 'object' && result !== null && ('error' in result || result.success === false)) {
    if (result.data === undefined) {
      return null;
    }
  }

  // Handle direct objects or arrays
  return result as T;
}
