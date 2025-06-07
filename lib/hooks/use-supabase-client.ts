import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createSupabaseClientWithToken } from '@/lib/supabase-client';
import { Database } from '@/types/supabase';

export function useSupabaseClientWithToken() {
  const { getToken } = useAuth();
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseClientWithToken> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        setIsLoading(true);
        setError(null);
        const token = await getToken();
        if (!token) {
          console.warn('No token available from Clerk');
          if (isMounted) {
            setSupabase(null);
            setError(new Error('No authentication token available'));
          }
          return;
        }
        console.log('[Clerk JWT] Token received');
        const client = createSupabaseClientWithToken(token);
        if (isMounted) {
          setSupabase(client);
          setError(null);
        }
      } catch (err) {
        console.error('[Supabase Client] Initialization error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize Supabase client'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    init();
    return () => { isMounted = false; };
  }, [getToken]);

  return { supabase, isLoading, error };
} 