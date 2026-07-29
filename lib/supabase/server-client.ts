import { logger } from "@/lib/logger";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _serverInstance: SupabaseClient | null = null;

function getSupabaseServerInstance(): SupabaseClient {
  if (!_serverInstance) {
    const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://placeholder.supabase.co';
    const key = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';
    _serverInstance = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    });
  }
  return _serverInstance;
}

// Proxy object so existing usages of `supabaseServer.from(...)` continue working without throwing during client-side module evaluation
export const supabaseServer: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop: keyof SupabaseClient) {
    const instance = getSupabaseServerInstance();
    const value = instance[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

// Test connection on startup
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabaseServer.from('challenges').select('count').limit(1);
    if (error) {
      logger.error('[Supabase] Connection test failed:', error);
      return false;
    }
    logger.debug('[Supabase] Connection test successful');
    return true;
  } catch (error) {
    logger.error('[Supabase] Connection test error:', error);
    return false;
  }
}