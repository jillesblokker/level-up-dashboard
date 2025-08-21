import { createClient } from '@supabase/supabase-js';

// This client should be used ONLY in backend API routes
// Using untyped client to avoid type mismatches with missing tables
export const supabaseServer = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Test connection on startup
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabaseServer.from('challenges').select('count').limit(1);
    if (error) {
      console.error('[Supabase] Connection test failed:', error);
      return false;
    }
    console.log('[Supabase] Connection test successful');
    return true;
  } catch (error) {
    console.error('[Supabase] Connection test error:', error);
    return false;
  }
}

// Initialize connection test
if (typeof window === 'undefined') {
  testSupabaseConnection();
} 