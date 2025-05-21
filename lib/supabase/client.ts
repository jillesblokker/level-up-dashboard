import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

interface UserMetadata {
  user_name?: string;
  avatar_bg_color?: string;
  avatar_text_color?: string;
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

// Helper function to update user metadata
export async function updateUserMetadata(userId: string, metadata: any) {
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