import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { env } from '@/lib/env';
import {
  createBrowserClient as createBrowserClientOriginal,
  createServerClient as createServerClientOriginal,
} from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export interface UserMetadata {
  user_name?: string;
  avatar_bg_color?: string;
  avatar_text_color?: string;
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-auth-token',
      storage: {
        getItem: (key) => {
          if (typeof window === 'undefined') return null;
          return window.localStorage.getItem(key);
        },
        setItem: (key, value) => {
          if (typeof window === 'undefined') return;
          window.localStorage.setItem(key, value);
        },
        removeItem: (key) => {
          if (typeof window === 'undefined') return;
          window.localStorage.removeItem(key);
        },
      },
    },
    db: {
      schema: 'public'
    }
  }
);

// Create a browser client for client-side operations
export const createBrowserClient = () => {
  return createBrowserClientOriginal<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );
};

// Helper function to update user metadata
export async function updateUserMetadata(userId: string, metadata: UserMetadata) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ metadata })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user metadata:', error);
  }
}

// Define a function to create a Supabase client for client-side operations
// This function will be used by the SupabaseProvider
export function createClient() {
  return createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  )
}

// Higher-order function to wrap Supabase calls with token injection
export async function withToken<T>(
  supabase: SupabaseClient<Database>,
  getToken: (options: { template: string }) => Promise<string | null>,
  operation: (supabase: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  const token = await getToken({ template: 'supabase' });
  if (!token) {
    throw new Error('User not authenticated, no token found');
  }
  
  supabase.auth.setSession({
    access_token: token,
    refresh_token: '',
  });

  return operation(supabase);
}

export type SupabaseServerClient = ReturnType<typeof createServerClient>;

export const createServerClient = () => {
  const cookieStore = cookies();
  return createServerClientOriginal<Database>({
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options) {
        cookieStore.set({ name, value: '', ...options });
      },
    },
  });
}; 