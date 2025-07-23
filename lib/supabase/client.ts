import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Singleton pattern to prevent multiple client instances
let supabaseInstance: SupabaseClient<Database> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    )
  }
  return supabaseInstance
})()

// Export the instance directly for backward compatibility
export { supabase as default }

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
