/**
 * Universal API Response Unwrapper Utility
 * 
 * Standardizes API payload extraction across all Thrivehaven endpoints.
 * Handles both wrapped payloads ({ success: true, data: { ... } }) and
 * direct payload objects ({ level: 46, gold: 1000 }) seamlessly.
 */

export function unwrapApiResponse<T>(result: any): T {
  if (!result) return result;

  // Handle string response (e.g. JSON strings or HTML 502 error pages)
  if (typeof result === 'string') {
    try {
      result = JSON.parse(result);
    } catch {
      return [] as unknown as T;
    }
  }

  // Handle { success: true, data: { ... } } wrapper from authenticatedSupabaseQuery
  if (typeof result === 'object' && result !== null && 'success' in result && result.data !== undefined) {
    return result.data as T;
  }

  // Handle direct objects or arrays
  return result as T;
}
