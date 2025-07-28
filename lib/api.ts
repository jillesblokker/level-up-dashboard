import { TileType } from '@/types/tiles';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Helper function to get auth token with retry logic
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  // Wait for Clerk to be available
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    try {
      // Try to access Clerk from window
      const clerk = (window as any).__clerk;
      if (!clerk) {
        console.log(`[API] Clerk not available on window, attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        continue;
      }

      const session = clerk.session;
      if (!session) {
        console.log(`[API] No active Clerk session, attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        continue;
      }

      // Try to get token with supabase template
      const token = await session.getToken({ template: 'supabase' });
      console.log('[API] Got Clerk token:', token ? 'present' : 'null');
      return token;
    } catch (error) {
      console.error(`[API] Error getting Clerk token (attempt ${attempts + 1}):`, error);
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }
  
  console.error('[API] Failed to get Clerk token after all attempts');
  return null;
}

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

export async function uploadGridData(
  supabase: SupabaseClient<Database>,
  grid: number[][],
  clerkId: string
): Promise<{ id: string } | null> {
  if (!clerkId) throw new Error('No Clerk user ID provided');
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No Clerk token available');
    
    const response = await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        action: 'uploadGrid',
        grid: grid,
        version: 1 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload grid data');
    }

    const data = await response.json();
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
    const token = await getAuthToken();
    if (!token) throw new Error('No Clerk token available');
    
    const response = await fetch('/api/data', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        action: 'updateGrid',
        gridId: gridId,
        grid: grid,
        version: Date.now() 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update grid data');
    }
  } catch (error) {
    console.error('Failed to update grid data:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update grid data');
  }
}

export async function getLatestGrid(
  supabase: SupabaseClient<Database>,
  clerkId: string
): Promise<{ id: string; grid: number[][] } | null> {
  if (!clerkId) throw new Error('No Clerk user ID provided');
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No Clerk token available');
    
    const response = await fetch(`/api/data?type=grid&userId=${clerkId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch grid data');
    }

    const data = await response.json();
    if (!data || !data.grid || !Array.isArray(data.grid)) {
      throw new Error('Invalid grid data structure');
    }
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
  console.log('Setting up grid change subscription for user:', userId);
  
  // For now, we'll use polling instead of real-time subscription
  // This can be enhanced later with WebSocket or Server-Sent Events
  const interval = setInterval(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      
      const response = await fetch(`/api/data?type=grid&userId=${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.grid) {
          callback({
            new: { id: data.id || 'latest', grid: data.grid },
            eventType: 'UPDATE',
            old: null
          });
        }
      }
    } catch (error) {
      console.error('Error polling grid data:', error);
    }
  }, 5000); // Poll every 5 seconds

  return {
    unsubscribe: () => {
      clearInterval(interval);
    }
  };
} 