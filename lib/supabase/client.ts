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
