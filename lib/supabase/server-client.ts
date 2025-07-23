import { createClient } from '@supabase/supabase-js';

// This client should be used ONLY in backend API routes
// Using untyped client to avoid type mismatches with missing tables
export const supabaseServer = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
); 