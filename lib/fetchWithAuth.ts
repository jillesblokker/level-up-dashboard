// Client-side safe helper to include Clerk Authorization header when available with 5xx retry protection
export async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  const doFetch = async () => {
    try {
      let clerk = (typeof window !== 'undefined') ? ((window as any).__clerk || (window as any).Clerk || (window as any).clerk) : undefined;
      let token = await clerk?.session?.getToken?.();
      
      // If token is missing, poll briefly (up to 1.5s) while Clerk finishes initializing (crucial for Brave browser)
      if (!token && typeof window !== 'undefined') {
        for (let attempt = 0; attempt < 15; attempt++) {
          clerk = (window as any).__clerk || (window as any).Clerk || (window as any).clerk;
          token = await clerk?.session?.getToken?.();
          if (token) break;
          await new Promise(r => setTimeout(r, 100));
        }
      }

      const headers = new Headers(init.headers || {});
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
      if (typeof window !== 'undefined') {
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (tz) headers.set('x-timezone', tz);
        } catch {}
      }
      return fetch(input, {
        ...init,
        headers,
        credentials: init.credentials ?? 'include',
        cache: init.cache ?? 'no-store'
      });
    } catch {
      return fetch(input, { ...init, cache: init.cache ?? 'no-store' });
    }
  };

  const res = await doFetch();
  if (res && res.status >= 500) {
    // Retry once after 250ms delay for transient 502/503 Nginx gateway drops
    await new Promise(r => setTimeout(r, 250));
    return doFetch();
  }
  return res;
}

