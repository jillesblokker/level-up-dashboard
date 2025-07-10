import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// This client should be used ONLY in backend API routes
export const supabaseServer = createClient<Database>(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
); 