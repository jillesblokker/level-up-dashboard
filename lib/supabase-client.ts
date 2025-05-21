import { createBrowserClient } from '@supabase/ssr'
import { TileType } from '@/types/tiles'
import { Database } from '@/types/supabase'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a single instance of the Supabase client
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

// Types
export interface GridData {
  id: string
  grid: number[][]
  created_at: string
  updated_at: string
  user_id: string
  version: number
}

// Error handling wrapper
const handleSupabaseError = (error: any): never => {
  console.error('Supabase operation failed:', error)
  throw new Error(error.message || 'An error occurred while accessing the database')
}

// Grid operations with error handling
export async function uploadGridData(grid: number[][], userId: string): Promise<GridData> {
  try {
    const { data, error } = await supabase
      .from('realm_grids')
      .insert([
        {
          grid,
          user_id: userId,
          version: 1
        }
      ])
      .select()

    if (error) throw error
    if (!data || data.length === 0) throw new Error('No data returned after insert')
    
    return data[0]
  } catch (error) {
    return handleSupabaseError(error)
  }
}

export async function getLatestGrid(userId: string): Promise<GridData | null> {
  try {
    const { data, error } = await supabase
      .from('realm_grids')
      .select('*')
      .eq('user_id', userId)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    return handleSupabaseError(error)
  }
}

export async function updateGridData(gridId: string, grid: number[][], userId: string): Promise<GridData> {
  try {
    const { data: existingGrid, error: fetchError } = await supabase
      .from('realm_grids')
      .select('version')
      .eq('id', gridId)
      .single()

    if (fetchError) throw fetchError

    const newVersion = existingGrid ? existingGrid.version + 1 : 1

    const { data, error } = await supabase
      .from('realm_grids')
      .update({
        grid,
        version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', gridId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('No data returned after update')

    return data
  } catch (error) {
    return handleSupabaseError(error)
  }
}

// Auth helper functions
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    return handleSupabaseError(error)
  }
}

// Session helper
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    return handleSupabaseError(error)
  }
}

// Real-time subscription helper
export const subscribeToGridChanges = (
  userId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel('grid-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'realm_grids',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
} 