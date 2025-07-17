import { GameState } from '../types/game'
// Replaced all Supabase direct calls with API routes for authentication flow
// All database logic now uses authenticated API routes

export type GameData = GameState

async function getClerkToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    console.error('[Game Data Sync] getClerkToken called on server side');
    return null;
  }

  try {
    // Access Clerk from window if available
    const clerk = (window as any).__clerk;
    if (!clerk) {
      console.error('[Game Data Sync] Clerk not available on window');
      return null;
    }

    const session = clerk.session;
    if (!session) {
      console.error('[Game Data Sync] No active Clerk session');
      return null;
    }

    const token = await session.getToken();
    console.log('[Game Data Sync] Got Clerk token:', token ? 'present' : 'null');
    return token;
  } catch (error) {
    console.error('[Game Data Sync] Error getting Clerk token:', error);
    return null;
  }
}

export async function syncGameData(
  localData: GameData,
  userId: string
): Promise<void> {
  if (!userId) {
    console.error('[Game Data Sync] No user ID provided');
    return;
  }

  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Game Data Sync] No authentication token available');
      return;
    }

    // First, get existing data
    const getResponse = await fetch('/api/game-data', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    let existingData = {};
    if (getResponse.ok) {
      const responseData = await getResponse.json();
      existingData = responseData?.realmMap || {};
    }

    // Merge local data with existing data
    const mergedData = {
      ...existingData,
      ...localData,
      last_sync: new Date().toISOString(),
    };

    // Update the database
    const saveResponse = await fetch('/api/game-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        realmMap: mergedData,
      }),
    });

    if (!saveResponse.ok) {
      console.error('[Game Data Sync] Failed to sync game data:', saveResponse.status, saveResponse.statusText);
      throw new Error('Failed to sync game data');
    }

    console.log('[Game Data Sync] Successfully synced game data');
  } catch (error) {
    console.error('[Game Data Sync] Error syncing game data:', error);
    throw error;
  }
}

export async function loadGameData(userId: string): Promise<GameData | null> {
  if (!userId) {
    console.error('[Game Data Sync] No user ID provided');
    return null;
  }

  try {
    const token = await getClerkToken();
    if (!token) {
      console.error('[Game Data Sync] No authentication token available');
      return null;
    }

    const response = await fetch('/api/game-data', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('[Game Data Sync] Failed to load game data:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data?.realmMap || null;
  } catch (error) {
    console.error('[Game Data Sync] Error loading game data:', error);
    throw error;
  }
}

export function getLocalGameData(): GameData {
  try {
    const grid = localStorage.getItem('grid')
    const inventory = localStorage.getItem('inventory')
    const character = localStorage.getItem('character')
    const quests = localStorage.getItem('quests')

    return {
      grid: grid ? JSON.parse(grid) : undefined,
      inventory: inventory ? JSON.parse(inventory) : {},
      character: character ? JSON.parse(character) : undefined,
      quests: quests ? JSON.parse(quests) : undefined,
      selectedTile: null
    }
  } catch (error) {
    console.error('Error getting local game data:', error)
    return {
      inventory: {},
      selectedTile: null
    }
  }
}

export function saveLocalGameData(data: GameData): void {
  try {
    if (data.grid) localStorage.setItem('grid', JSON.stringify(data.grid))
    if (data.inventory) localStorage.setItem('inventory', JSON.stringify(data.inventory))
    if (data.character) localStorage.setItem('character', JSON.stringify(data.character))
    if (data.quests) localStorage.setItem('quests', JSON.stringify(data.quests))
  } catch (error) {
    console.error('Error saving local game data:', error)
  }
} 