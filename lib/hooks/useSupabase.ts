"use client"

import { useAuth, useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// This hook provides a Supabase client instance that is safe to use on the client-side.
// It handles authentication through Clerk without requiring JWT templates.
export function useSupabase() {
    const [supabase, setSupabase] = useState<SupabaseClient<Database> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { getToken, isLoaded } = useAuth();
    const { user } = useUser();

    useEffect(() => {
        if (isLoaded) {
            const client = createBrowserClient();
            setSupabase(client);
            setIsLoading(false);
        }
    }, [isLoaded]);

    // Helper function to get authenticated Supabase client
    const getAuthenticatedSupabase = async () => {
        if (!supabase || !user) return null;
        
        try {
            // Try to get a token, but don't fail if template doesn't exist
            const token = await getToken({ template: 'supabase' }).catch(() => null);
            
            if (token) {
                // If we have a token, set it on the client
                await supabase.auth.setSession({
                    access_token: token,
                    refresh_token: '',
                });
            }
            
            return supabase;
        } catch (error) {
            console.warn('Could not get JWT token, using unauthenticated client:', error);
            return supabase;
        }
    };

    return { 
        supabase, 
        getAuthenticatedSupabase,
        getToken, 
        isLoading,
        user 
    };
} 