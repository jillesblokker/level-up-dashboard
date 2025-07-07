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
            const token = await getToken({ template: 'supabase' });
            const client = createClient(
                process.env['NEXT_PUBLIC_SUPABASE_URL']!,
                process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
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
        };

        init();
    }, [getToken, isLoaded]);

    return { supabase, isLoading };
} 