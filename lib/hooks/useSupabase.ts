"use client"

import { useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';

// Singleton to prevent multiple client instances
let supabaseInstance: SupabaseClient | null = null;
let currentToken: string | null = null;

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
                // Removed debugging log
                const token = await getToken({ template: 'supabase' });
                // Removed debugging log
                // Removed debugging log
                
                const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
                const anon = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
                // Removed debugging logs
                
                if (!url || !anon) {
                    console.error('[useSupabase] Supabase env vars missing!');
                    setIsLoading(false);
                    return;
                }

                // Only create a new client if we don't have one or if the token changed
                if (!supabaseInstance || currentToken !== token) {
                    if (supabaseInstance) {
                        // Removed debugging log
                    }
                    
                    supabaseInstance = createClient(
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
                    currentToken = token;
                    // Removed debugging log
                }
                
                setSupabase(supabaseInstance);
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