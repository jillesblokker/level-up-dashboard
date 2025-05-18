import { createClient } from '@supabase/supabase-js'
import { TileType } from '@/types/tiles'

// For now, let's define a minimal Database type here until we fix the module issue
interface Database {
  public: {
    Tables: {
      realm_grids: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          grid: number[][]
          user_id: string
          version: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          grid: number[][]
          user_id: string
          version: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          grid?: number[][]
          user_id?: string
          version?: number
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Debug logging for environment variables
console.log('Environment variables check:')
console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
console.log('NEXT_PUBLIC_SUPABASE_URL value:', process.env.NEXT_PUBLIC_SUPABASE_URL)

// Initialize Supabase client with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env file')
  throw new Error('Missing Supabase environment variables')
}

// Validate URL format
try {
  const url = new URL(supabaseUrl)
  console.log('Valid Supabase URL:', url.toString())
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl)
  console.error('URL should be in the format: https://your-project-id.supabase.co')
  console.error('Error details:', error)
  throw new Error('Invalid Supabase URL format')
}

// Create a single instance of the Supabase client to be used throughout the app
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
})

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