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

// Helper to get Supabase UUID from Clerk user ID
async function getSupabaseUserIdFromClerk(clerkId: string, supabase: any): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();
  if (error || !data) throw new Error('Could not find Supabase user for Clerk ID');
  return data.id;
}

// Example: uploadGridData
export async function uploadGridData(
  supabase: any,
  grid: number[][],
  clerkId: string
): Promise<{ id: string } | null> {
  if (!clerkId) throw new Error('No Clerk user ID provided');
  const userId = await getSupabaseUserIdFromClerk(clerkId, supabase);
  try {
    const { data, error } = await supabase
      .from('realm_grids')
      .insert([
        { user_id: userId, grid, version: 1 },
      ])
      .select('id')
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
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

// Example: getLatestGrid
export async function getLatestGrid(
  supabase: any,
  clerkId: string
): Promise<{ id: string; grid: number[][] } | null> {
  if (!clerkId) throw new Error('No Clerk user ID provided');
  const userId = await getSupabaseUserIdFromClerk(clerkId, supabase);
  try {
    const { data, error } = await supabase
      .from('realm_grids')
      .select('id, grid')
      .eq('user_id', userId)
      .order('version', { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    if (!data || !data.grid || !Array.isArray(data.grid)) throw new Error('Invalid grid data structure');
    return data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch grid data');
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