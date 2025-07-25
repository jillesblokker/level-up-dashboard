import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { clientEnv } from '@/lib/client-env';
import {
  createBrowserClient as createBrowserClientOriginal,
} from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';

export interface UserMetadata {
  user_name?: string;
  avatar_bg_color?: string;
  avatar_text_color?: string;
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

// Helper function to update user metadata
export async function updateUserMetadata(
  client: SupabaseClient<Database>,
  metadata: UserMetadata
) {
  const { error } = await client.auth.updateUser({
    data: metadata,
  });
  if (error) {
    console.error('Error updating user metadata:', error);
  }
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

  // Set the session for this specific operation
  supabase.auth.setSession({
    access_token: token,
    refresh_token: '',
  });

  return operation(supabase);
}

if (!clientEnv.NEXT_PUBLIC_SUPABASE_URL || !clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or ANON KEY is missing in environment variables.');
}

// Warn if multiple clients are created in the browser
if (typeof window !== 'undefined') {
  if ((window as any)._supabaseClientCreated) {
    console.warn('Multiple Supabase clients detected in the browser. This may cause auth/session issues.');
  } else {
    (window as any)._supabaseClientCreated = true;
  }
}
