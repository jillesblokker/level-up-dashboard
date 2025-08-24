// Client-side only Supabase persistence functions
// This version works with existing API endpoints without server-side imports

// Generic function to save data to Supabase with localStorage fallback
export async function saveToSupabaseClient<T>(
  endpoint: string,
  data: T,
  localStorageKey: string
): Promise<boolean> {
  try {
    // For client-side, we'll use the existing API endpoints
    // The API endpoints handle their own authentication
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log(`[Supabase Persistence Client] ✅ Data saved to Supabase successfully: ${endpoint}`);
      // Also save to localStorage as backup
      localStorage.setItem(localStorageKey, JSON.stringify(data));
      return true; // Indicates Supabase was used
    } else {
      console.log(`[Supabase Persistence Client] ⚠️ Failed to save to Supabase, falling back to localStorage: ${endpoint}`);
      localStorage.setItem(localStorageKey, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    console.error(`[Supabase Persistence Client] Error saving to Supabase: ${endpoint}`, error);
    console.log(`[Supabase Persistence Client] Falling back to localStorage: ${localStorageKey}`);
    localStorage.setItem(localStorageKey, JSON.stringify(data));
    return false;
  }
}

// Generic function to load data from Supabase with localStorage fallback
export async function loadFromSupabaseClient<T>(
  endpoint: string,
  localStorageKey: string,
  defaultValue: T
): Promise<T> {
  try {
    // For client-side, we'll use the existing API endpoints
    // The API endpoints handle their own authentication
    const response = await fetch(endpoint, {
      method: 'GET',
    });

    if (response.ok) {
      const result = await response.json();
      if (result.stats || result.progress || result.grid || result.timers || result.items || result.states) {
        console.log(`[Supabase Persistence Client] ✅ Data loaded from Supabase: ${endpoint}`);
        // Also save to localStorage as backup
        const data = result.stats || result.progress || result.grid || result.timers || result.items || result.states;
        localStorage.setItem(localStorageKey, JSON.stringify(data));
        return data;
      }
    }

    console.log(`[Supabase Persistence Client] ⚠️ Failed to load from Supabase, using localStorage: ${endpoint}`);
    const stored = localStorage.getItem(localStorageKey);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`[Supabase Persistence Client] Error loading from Supabase: ${endpoint}`, error);
    console.log(`[Supabase Persistence Client] Using localStorage: ${localStorageKey}`);
    const stored = localStorage.getItem(localStorageKey);
    return stored ? JSON.parse(stored) : defaultValue;
  }
}

// Kingdom-specific persistence functions

// Kingdom Grid
export async function saveKingdomGrid(grid: any): Promise<boolean> {
  return await saveToSupabaseClient('/api/kingdom-grid', { grid }, 'kingdom-grid');
}

export async function loadKingdomGrid(): Promise<any> {
  return await loadFromSupabaseClient('/api/kingdom-grid', 'kingdom-grid', []);
}

// Kingdom Timers
export async function saveKingdomTimers(timers: any): Promise<boolean> {
  return await saveToSupabaseClient('/api/kingdom-timers', { timers }, 'kingdom-tile-timers');
}

export async function loadKingdomTimers(): Promise<any> {
  return await loadFromSupabaseClient('/api/kingdom-timers', 'kingdom-tile-timers', {});
}

// Kingdom Items
export async function saveKingdomItems(items: any[]): Promise<boolean> {
  return await saveToSupabaseClient('/api/kingdom-items', { items }, 'kingdom-tile-items');
}

export async function loadKingdomItems(): Promise<any[]> {
  return await loadFromSupabaseClient('/api/kingdom-items', 'kingdom-tile-items', []);
}

// Kingdom Tile States
export async function saveKingdomTileStates(states: any): Promise<boolean> {
  return await saveToSupabaseClient('/api/kingdom-tile-states', { states }, 'kingdom-tile-states');
}

export async function loadKingdomTileStates(): Promise<any> {
  return await loadFromSupabaseClient('/api/kingdom-tile-states', 'kingdom-tile-states', {});
}

// Character Stats
export async function saveCharacterStats(stats: any): Promise<boolean> {
  return await saveToSupabaseClient('/api/character-stats', { stats }, 'character-stats');
}

export async function loadCharacterStats(): Promise<any> {
  return await loadFromSupabaseClient('/api/character-stats', 'character-stats', {});
}

// Quest Progress
export async function saveQuestProgress(progress: any[]): Promise<boolean> {
  return await saveToSupabaseClient('/api/quest-progress', { progress }, 'quest-progress');
}

export async function loadQuestProgress(): Promise<any[]> {
  return await loadFromSupabaseClient('/api/quest-progress', 'quest-progress', []);
}

// Challenge Progress
export async function saveChallengeProgress(progress: any[]): Promise<boolean> {
  return await saveToSupabaseClient('/api/challenge-progress', { progress }, 'challenge-progress');
}

export async function loadChallengeProgress(): Promise<any[]> {
  return await loadFromSupabaseClient('/api/challenge-progress', 'challenge-progress', []);
}

// Milestone Progress
export async function saveMilestoneProgress(progress: any[]): Promise<boolean> {
  return await saveToSupabaseClient('/api/milestone-progress', { progress }, 'milestone-progress');
}

export async function loadMilestoneProgress(): Promise<any[]> {
  return await loadFromSupabaseClient('/api/milestone-progress', 'milestone-progress', []);
}
