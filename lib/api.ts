import { TileType } from '@/types/tiles';

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
    const error = await response.json().catch(() => ({ error: 'Unknown error' })) as ApiResponse<T>;
    throw new Error(error.details || error.error || `API Error: ${response.status}`);
  }

  const data = await response.json() as ApiResponse<T>;
  if (data.error) {
    throw new Error(data.details || data.error);
  }

  return data as T;
}

export async function createTilePlacement(tileType: TileType, posX: number, posY: number): Promise<TilePlacement> {
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
    throw new Error(error instanceof Error ? error.message : 'Failed to create tile placement');
  }
}

export async function getTilePlacements(): Promise<TilePlacement[]> {
  try {
    const response = await fetch('/api/tiles', {
      credentials: 'include'
    });

    return handleApiResponse<TilePlacement[]>(response);
  } catch (error) {
    console.error('Failed to fetch tile placements:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch tile placements');
  }
}

export async function createQuestCompletion(category: string, questName: string): Promise<QuestCompletion> {
  try {
    const response = await fetch('/api/quests/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ category, questName }),
    });

    return handleApiResponse<QuestCompletion>(response);
  } catch (error) {
    console.error('Failed to create quest completion:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create quest completion');
  }
}

export async function getQuestCompletions(): Promise<QuestCompletion[]> {
  try {
    const response = await fetch('/api/quests/completion', {
      credentials: 'include'
    });

    return handleApiResponse<QuestCompletion[]>(response);
  } catch (error) {
    console.error('Failed to fetch quest completions:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch quest completions');
  }
} 