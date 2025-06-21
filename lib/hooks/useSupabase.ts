"use client"

import { useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// This hook provides a Supabase client instance that is safe to use on the client-side.
// It is aware of the Clerk authentication token and ensures the client is ready.
export function useSupabase() {
    const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { getToken, isLoaded } = useAuth();

    useEffect(() => {
        if (isLoaded) {
            const client = createBrowserClient();
            setSupabase(client);
            setIsLoading(false);
        }
    }, [isLoaded]);

    return { supabase, getToken, isLoading };
} 