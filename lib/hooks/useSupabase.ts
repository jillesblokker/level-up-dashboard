"use client"

import { useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';

// This hook provides a Supabase client instance that is safe to use on the client-side.
// It is aware of the Clerk authentication token and ensures the client is ready.
export function useSupabase() {
    const { getToken, isLoaded } = useAuth();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded) {
            setIsLoading(true);
            return;
        }

        const init = async () => {
            try {
                console.log('[useSupabase] Calling getToken...');
                const token = await getToken({ template: 'supabase' });
                console.log('[Clerk Supabase JWT]', token);
                console.log('[useSupabase] getToken result:', token);
                const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
                const anon = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
                console.log('[useSupabase] Env URL:', url);
                console.log('[useSupabase] Env ANON:', anon ? 'set' : 'not set');
                if (!url || !anon) {
                    console.error('[useSupabase] Supabase env vars missing!');
                    setIsLoading(false);
                    return;
                }
                const client = createClient(
                    url,
                    anon,
                    {
                        global: {
                            headers: {
                                Authorization: token ? `Bearer ${token}` : '',
                            },
                        },
                    }
                );
                setSupabase(client);
                setIsLoading(false);
                console.log('[useSupabase] Supabase client created!');
            } catch (err) {
                console.error('[useSupabase] Error initializing Supabase:', err);
                setIsLoading(false);
            }
        };

        init();
    }, [getToken, isLoaded]);

    return { supabase, isLoading };
} 