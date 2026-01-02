// Client-side safe helper to include Clerk Authorization header when available
export async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  try {
    // Try client-side Clerk first
    const clerk = (typeof window !== 'undefined') ? ((window as any).__clerk || (window as any).Clerk) : undefined;
    const token = await clerk?.session?.getToken?.();
    const headers = new Headers(init.headers || {});
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
    return fetch(input, {
      ...init,
      headers,
      credentials: init.credentials ?? 'include',
      cache: init.cache ?? 'no-store'
    });
  } catch {
    // Fallback without token
    return fetch(input, { ...init, cache: init.cache ?? 'no-store' });
  }
}

