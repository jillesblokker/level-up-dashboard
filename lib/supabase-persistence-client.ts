// Client-side only Supabase persistence functions
// This version works with existing API endpoints without server-side imports

import { getUserScopedItem, setUserScopedItem } from './user-scoped-storage';

// Generic function to save data to Supabase with localStorage fallback
export async function saveToSupabaseClient<T>(
  endpoint: string,
  data: T,
  localStorageKey: string,
  token?: string | null
): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log(`[Supabase Persistence Client] ✅ Data saved to Supabase successfully: ${endpoint}`);
      setUserScopedItem(localStorageKey, JSON.stringify(data));
      return true;
    } else {
      const errorText = await response.text();
      console.warn(`[Supabase Persistence Client] ⚠️ Failed to save to Supabase, falling back to localStorage: ${endpoint}`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      setUserScopedItem(localStorageKey, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    console.error(`[Supabase Persistence Client] Error saving to Supabase: ${endpoint}`, error);
    setUserScopedItem(localStorageKey, JSON.stringify(data));
    return false;
  }
}

// Generic function to load data from Supabase with localStorage fallback
export async function loadFromSupabaseClient<T>(
  endpoint: string,
  localStorageKey: string,
  defaultValue: T,
  token?: string | null
): Promise<T> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const result = await response.json();
      if (result.stats || result.progress || result.grid || result.timers || result.items || result.states || result.tiles) {
        console.log(`[Supabase Persistence Client] ✅ Data loaded from Supabase: ${endpoint}`);
        const data = result.stats || result.progress || result.grid || result.timers || result.items || result.states || result.tiles;
        const isVisit = endpoint.includes('userId=');
        if (!isVisit) {
          setUserScopedItem(localStorageKey, JSON.stringify(data));
        }
        return data;
      }
    }

    console.log(`[Supabase Persistence Client] ⚠️ Failed to load from Supabase, using localStorage: ${endpoint}`);
    const stored = getUserScopedItem(localStorageKey);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`[Supabase Persistence Client] Error loading from Supabase: ${endpoint}`, error);
    const stored = getUserScopedItem(localStorageKey);
    return stored ? JSON.parse(stored) : defaultValue;
  }
}

// Kingdom-specific persistence functions

// Kingdom Grid
export async function saveKingdomGrid(grid: any, token?: string | null): Promise<boolean> {
  return await saveToSupabaseClient('/api/kingdom-grid', { grid }, 'kingdom-grid', token);
}

export async function loadKingdomGrid(token?: string | null, visitUserId?: string | null): Promise<any> {
  const endpoint = visitUserId ? `/api/kingdom-grid?userId=${visitUserId}` : '/api/kingdom-grid';
  return await loadFromSupabaseClient(endpoint, 'kingdom-grid', [], token);
}

// Kingdom Timers
export async function saveKingdomTimers(timers: any, token?: string | null): Promise<boolean> {
  return await saveToSupabaseClient('/api/kingdom-timers', { timers }, 'kingdom-tile-timers', token);
}

export async function loadKingdomTimers(token?: string | null, visitUserId?: string | null): Promise<any> {
  const endpoint = visitUserId ? `/api/kingdom-timers?userId=${visitUserId}` : '/api/kingdom-timers';
  return await loadFromSupabaseClient(endpoint, 'kingdom-tile-timers', {}, token);
}

// Kingdom Items
export async function saveKingdomItems(items: any[], token?: string | null): Promise<boolean> {
  return await saveToSupabaseClient('/api/kingdom-items', { items }, 'kingdom-tile-items', token);
}

export async function loadKingdomItems(token?: string | null): Promise<any[]> {
  return await loadFromSupabaseClient('/api/kingdom-items', 'kingdom-tile-items', [], token);
}

// Kingdom Tile States
export async function saveKingdomTileStates(states: any, token?: string | null): Promise<boolean> {
  return await saveToSupabaseClient('/api/kingdom-tile-states', { states }, 'kingdom-tile-states', token);
}

export async function loadKingdomTileStates(token?: string | null): Promise<any> {
  return await loadFromSupabaseClient('/api/kingdom-tile-states', 'kingdom-tile-states', {}, token);
}

// Character Stats
export async function saveCharacterStats(stats: any, token?: string | null): Promise<boolean> {
  return await saveToSupabaseClient('/api/character-stats', { stats }, 'character-stats', token);
}

export async function loadCharacterStats(token?: string | null): Promise<any> {
  return await loadFromSupabaseClient('/api/character-stats', 'character-stats', {}, token);
}

// Quest Progress
export async function saveQuestProgress(progress: any[], token?: string | null): Promise<boolean> {
  return await saveToSupabaseClient('/api/quest-progress', { progress }, 'quest-progress', token);
}

export async function loadQuestProgress(token?: string | null): Promise<any[]> {
  return await loadFromSupabaseClient('/api/quest-progress', 'quest-progress', [], token);
}

// Challenge Progress
export async function saveChallengeProgress(progress: any[], token?: string | null): Promise<boolean> {
  return await saveToSupabaseClient('/api/challenge-progress', { progress }, 'challenge-progress', token);
}

export async function loadChallengeProgress(token?: string | null): Promise<any[]> {
  return await loadFromSupabaseClient('/api/challenge-progress', 'challenge-progress', [], token);
}

// Milestone Progress
export async function saveMilestoneProgress(progress: any[], token?: string | null): Promise<boolean> {
  return await saveToSupabaseClient('/api/milestone-progress', { progress }, 'milestone-progress', token);
}

export async function loadMilestoneProgress(token?: string | null): Promise<any[]> {
  return await loadFromSupabaseClient('/api/milestone-progress', 'milestone-progress', [], token);
}
