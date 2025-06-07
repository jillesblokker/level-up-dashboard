import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { env } from '@/lib/env';

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
  return createClient<Database>(
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