"use client"

import { useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';

// Global singleton to prevent multiple client instances
let globalSupabaseInstance: SupabaseClient | null = null;
let globalCurrentToken: string | null = null;

// This hook provides a Supabase client instance that is safe to use on the client-side.
// It is aware of the Clerk authentication token and ensures the client is ready.
export function useSupabase() {
    const { getToken, isLoaded } = useAuth();
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded) {
            return;
        }

        const init = async () => {
            try {
                const token = await getToken({ template: 'supabase' });
                
                const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
                const anon = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
                
                if (!url || !anon) {
                    console.error('[useSupabase] Supabase env vars missing!');
                    setIsLoading(false);
                    return;
                }

                // Only create a new client if we don't have one or if the token changed
                if (!globalSupabaseInstance || globalCurrentToken !== token) {
                    if (globalSupabaseInstance) {
                        // Clean up old instance if token changed
                        globalSupabaseInstance.auth.signOut();
                    }
                    
                    globalSupabaseInstance = createClient(
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
                    globalCurrentToken = token;
                }
                
                setSupabase(globalSupabaseInstance);
                setIsLoading(false);
            } catch (err) {
                console.error('[useSupabase] Error initializing Supabase:', err);
                setIsLoading(false);
            }
        };

        init();
    }, [getToken, isLoaded]);

    return { supabase, isLoading };
} 