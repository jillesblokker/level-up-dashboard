"use client"

import { useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';

// Global singleton to prevent multiple client instances
let globalSupabaseInstance: SupabaseClient | null = null;
let globalCurrentToken: string | null = null;

/**
 * Safe storage adapter that handles iOS Safari "The operation is insecure" errors.
 * Falls back to in-memory storage when localStorage is unavailable.
 */
function createSafeStorageAdapter() {
    const memoryStorage: Record<string, string> = {};

    // Check if localStorage is available
    const isLocalStorageAvailable = () => {
        try {
            if (typeof window === 'undefined') return false;
            const testKey = '__supabase_storage_test__';
            window.localStorage.setItem(testKey, 'test');
            window.localStorage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    };

    const canUseLocalStorage = isLocalStorageAvailable();

    return {
        getItem: (key: string): string | null => {
            try {
                if (canUseLocalStorage) {
                    return window.localStorage.getItem(key);
                }
                return memoryStorage[key] || null;
            } catch {
                return memoryStorage[key] || null;
            }
        },
        setItem: (key: string, value: string): void => {
            try {
                if (canUseLocalStorage) {
                    window.localStorage.setItem(key, value);
                } else {
                    memoryStorage[key] = value;
                }
            } catch {
                memoryStorage[key] = value;
            }
        },
        removeItem: (key: string): void => {
            try {
                if (canUseLocalStorage) {
                    window.localStorage.removeItem(key);
                }
                delete memoryStorage[key];
            } catch {
                delete memoryStorage[key];
            }
        },
    };
}

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
                        try {
                            globalSupabaseInstance.auth.signOut();
                        } catch {
                            // Ignore signOut errors
                        }
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
                            auth: {
                                // Use safe storage adapter to prevent iOS Safari crashes
                                storage: createSafeStorageAdapter(),
                                // Disable session persistence - we use Clerk for auth
                                persistSession: false,
                                autoRefreshToken: false,
                                detectSessionInUrl: false,
                            },
                            realtime: {
                                // Add timeout and error handling for realtime connections
                                timeout: 10000,
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