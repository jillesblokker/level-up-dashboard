import { TileType } from '@/types/tiles';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { getSupabaseClient } from './supabase/client';

// API response types
interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: string;
}

interface TilePlacement {
  id: string;
  tileType: TileType;
  posX: number;
  posY: number;
  createdAt: string;
  updatedAt: string;
}

interface QuestCompletion {
  id: string;
  category: string;
  questName: string;
  completed: boolean;
  date: string;
  createdAt: string;
  updatedAt: string;
}

// API utility functions for tile placements and quest completions
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Unknown error' })) as ApiResponse<T>;
    const errorMessage = errorBody.details || errorBody.error || 'Unknown API error';
    const apiError = new Error(`API Error: ${response.status} - ${errorMessage}`);
    (apiError as any).status = response.status; // Attach status to error object
    throw apiError;
  }

  const data = await response.json() as ApiResponse<T>;
  if (data.error) {
    throw new Error(data.details || data.error);
  }

  return data as T;
}

export async function createTilePlacement(
  tileType: TileType,
  posX: number,
  posY: number
): Promise<TilePlacement> {
  try {
    const response = await fetch('/api/tiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ tileType, posX, posY }),
    });

    return handleApiResponse<TilePlacement>(response);
  } catch (error) {
    console.error('Failed to create tile placement:', error);
    const errorToThrow = error instanceof Error ? error : new Error('Failed to create tile placement');
    if ((error as any).status) {
      (errorToThrow as any).status = (error as any).status;
    }
    throw errorToThrow;
  }
}

export async function getTilePlacements(
  supabase: SupabaseClient<Database>
): Promise<TilePlacement[]> {
  try {
    // Reverting to original client-side fetch, as the API route now handles auth.
    const response = await fetch('/api/tiles', {
      credentials: 'include'
    });

    return handleApiResponse<TilePlacement[]>(response);
  } catch (error) {
    console.error('Failed to fetch tile placements:', error);
    const errorToThrow = error instanceof Error ? error : new Error('Failed to fetch tile placements');
    if ((error as any).status) {
      (errorToThrow as any).status = (error as any).status;
    }
    throw errorToThrow;
  }
}

export async function createQuestCompletion(
  supabase: SupabaseClient<Database>,
  category: string,
  questName: string
): Promise<QuestCompletion> {
  try {
    const { data, error } = await supabase.from('quest_completions').insert({
      category,
      quest_name: questName,
      completed: true,
      date: new Date().toISOString().split('T')[0],
      user_id: (await supabase.auth.getSession()).data.session?.user.id,
    }).select().single();

    if (error) {
      console.error('Supabase error creating quest completion:', error);
      throw new Error(error.message);
    }

    const questCompletion: QuestCompletion = {
      id: data.id,
      category: data.category,
      questName: data.quest_name,
      completed: data.completed,
      date: data.date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return questCompletion;
  } catch (error) {
    console.error('Failed to create quest completion:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create quest completion');
  }
}

export async function getQuestCompletions(supabase: SupabaseClient<Database>): Promise<QuestCompletion[]> {
  try {
    const { data, error } = await supabase.from('quest_completions').select('*');

    if (error) {
      console.error('Supabase error fetching quest completions:', error);
      throw new Error(error.message);
    }

    const questCompletions: QuestCompletion[] = data.map(item => ({
      id: item.id,
      category: item.category,
      questName: item.quest_name,
      completed: item.completed,
      date: item.date,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return questCompletions;
  } catch (error) {
    console.error('Failed to fetch quest completions:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch quest completions');
  }
}

export async function uploadGridData(
  supabase: SupabaseClient<Database>,
  grid: number[][],
  userId: string
): Promise<{ id: string } | null> {
  if (!userId) {
    console.error('No user ID provided for grid upload');
    throw new Error('Authentication required to upload grid data');
  }

  try {
    // First verify the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error checking session:', sessionError);
      throw new Error('Failed to verify authentication');
    }

    if (!session) {
      console.error('No active session found');
      throw new Error('Authentication required to upload grid data');
    }

    const { data, error } = await supabase
      .from('realm_grids')
      .insert([
        {
          user_id: userId,
          grid: grid,
          version: 1
        },
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error uploading grid data:', error);
      if (error.code === '42501') {
        throw new Error('Permission denied: You do not have access to upload grid data');
      } else if (error.code === '23505') {
        throw new Error('A grid already exists for this user');
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to upload grid data:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to upload grid data');
  }
}

export async function updateGridData(
  supabase: SupabaseClient<Database>,
  gridId: string,
  grid: number[][],
  userId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('realm_grids')
      .update({ grid: grid, version: Date.now() })
      .eq('id', gridId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating grid data:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to update grid data:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update grid data');
  }
}

export async function getLatestGrid(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ id: string; grid: number[][] } | null> {
  if (!userId) {
    console.error('No user ID provided for grid fetch');
    throw new Error('Authentication required to fetch grid data');
  }

  try {
    // First verify the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error checking session:', {
        code: sessionError.code,
        message: sessionError.message
      });
      throw new Error('Failed to verify authentication');
    }

    if (!session) {
      console.error('No active session found for user:', userId);
      throw new Error('Authentication required to fetch grid data');
    }

    // Fetch the latest grid directly - the RLS policies will handle access control
    const { data, error } = await supabase
      .from('realm_grids')
      .select('id, grid')
      .eq('user_id', userId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - this is not an error
        return null;
      }
      
      console.error('Error fetching latest grid:', {
        code: error.code,
        message: error.message,
        hint: error.hint,
        details: error.details,
        userId
      });

      if (error.code === '42501') {
        throw new Error('Permission denied: Please ensure you have the correct permissions');
      } else if (error.code === '42P01') {
        throw new Error('Table not found: Please contact support');
      } else {
        throw new Error(`Failed to fetch grid data: ${error.message}`);
      }
    }

    // Validate grid data structure
    if (!data || !data.grid || !Array.isArray(data.grid)) {
      console.error('Invalid grid data structure:', {
        data,
        userId
      });
      throw new Error('Invalid grid data structure');
    }

    // Ensure grid is a 2D array of numbers
    const validatedGrid = data.grid.map((row: any) => {
      if (!Array.isArray(row)) {
        throw new Error('Invalid grid row structure');
      }
      return row.map((cell: any) => {
        const num = Number(cell);
        if (isNaN(num)) {
          throw new Error('Invalid grid cell value');
        }
        return num;
      });
    });

    return {
      id: data.id,
      grid: validatedGrid
    };
  } catch (error) {
    console.error('Failed to fetch latest grid:', {
      name: error instanceof Error ? error.name : 'Unknown error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId
    });
    throw error instanceof Error ? error : new Error('Failed to fetch latest grid');
  }
}

export function subscribeToGridChanges(
  supabase: SupabaseClient<Database>,
  userId: string,
  callback: (payload: { new: { id: string; grid: number[][] }, eventType: string, old: { id: string } | null }) => void
): { unsubscribe: () => void } {
  console.log('Setting up Supabase real-time subscription for user:', userId);
  const subscription = supabase
    .channel(`realm_grids:user_id=eq.${userId}`)
    .on('postgres_changes',
      { event: '*' , schema: 'public', table: 'realm_grids', filter: `user_id=eq.${userId}` },
      callback
    )
    .subscribe();

  return subscription;
} 