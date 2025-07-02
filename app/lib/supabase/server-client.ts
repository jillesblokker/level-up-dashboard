import { createClient } from '@supabase/supabase-js';

export function create_supabase_server_client(token?: string) {
  return createClient(
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
} 