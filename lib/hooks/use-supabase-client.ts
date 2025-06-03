import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createSupabaseClientWithToken } from '@/lib/supabase-client';
import { Database } from '@/types/supabase';

export function useSupabaseClientWithToken() {
  const { getToken } = useAuth();
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseClientWithToken> | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      const token = await getToken();
      console.log('[Clerk JWT]', token);
      const client = createSupabaseClientWithToken(token || undefined);
      if (isMounted) setSupabase(client);
    }
    init();
    return () => { isMounted = false; };
  }, [getToken]);

  return supabase;
} 