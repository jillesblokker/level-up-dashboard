export interface CharacterStats {
  gold: number;
  experience: number;
  level: number;
  health: number;
  max_health: number;
  build_tokens: number;
  kingdom_expansions: number;
}

/**
 * Loads character stats from Supabase with localStorage fallback
 */
export async function loadCharacterStats(): Promise<CharacterStats> {
  try {
    // Try to load from Supabase first
    const { fetchWithAuth } = await import('./fetchWithAuth');
    const response = await fetchWithAuth('/api/character-stats', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data) {
        // Loaded from Supabase
        return data.data;
      }
    }
  } catch (error) {
    console.warn('[Character Stats Manager] Failed to load from Supabase:', error);
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem('character-stats');
    if (stored) {
      const stats = JSON.parse(stored);
              // Loaded from localStorage
      return {
        gold: stats.gold || 0,
        experience: stats.experience || 0,
        level: stats.level || 1,
        health: stats.health || 100,
        max_health: stats.max_health || 100,
        build_tokens: stats.buildTokens || 0,
        kingdom_expansions: parseInt(localStorage.getItem('kingdom-grid-expansions') || '0', 10)
      };
    }
  } catch (error) {
    console.warn('[Character Stats Manager] Failed to load from localStorage:', error);
  }

  // Return default stats
  return {
    gold: 0,
    experience: 0,
    level: 1,
    health: 100,
    max_health: 100,
    build_tokens: 0,
    kingdom_expansions: 0
  };
}

/**
 * Saves character stats to both Supabase and localStorage
 */
export async function saveCharacterStats(stats: Partial<CharacterStats>): Promise<{ success: boolean; error?: string }> {
  let supabaseSuccess = false;
  let localStorageSuccess = false;

  // Save to Supabase
  try {
    const { fetchWithAuth } = await import('./fetchWithAuth');
    const response = await fetchWithAuth('/api/character-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stats),
    });

    if (response.ok) {
      supabaseSuccess = true;
              // Saved to Supabase
    } else {
      console.warn('[Character Stats Manager] Supabase save failed:', response.status);
    }
  } catch (error) {
    console.warn('[Character Stats Manager] Supabase save error:', error);
  }

  // Save to localStorage as backup
  try {
    // Use getCharacterStats() instead of loadCharacterStats() to avoid Supabase dependency
    const currentStats = getCharacterStats();
    const updatedStats = { ...currentStats, ...stats };
    
    // Convert to localStorage format
    const localStorageStats = {
      gold: updatedStats.gold,
      experience: updatedStats.experience,
      level: updatedStats.level,
      health: updatedStats.health,
      max_health: updatedStats.max_health,
      buildTokens: updatedStats.build_tokens
    };
    
    localStorage.setItem('character-stats', JSON.stringify(localStorageStats));
    
    // Save kingdom expansions separately
    if (stats.kingdom_expansions !== undefined) {
      localStorage.setItem('kingdom-grid-expansions', String(stats.kingdom_expansions));
    }
    
    localStorageSuccess = true;
    // Saved to localStorage
    
    // Dispatch update event to notify all components
    window.dispatchEvent(new Event('character-stats-update'));
  } catch (error) {
    console.warn('[Character Stats Manager] localStorage save error:', error);
  }

  const result: { success: boolean; error?: string } = {
    success: supabaseSuccess || localStorageSuccess
  };
  
  if (!supabaseSuccess && !localStorageSuccess) {
    result.error = 'Failed to save character stats';
  }
  
  return result;
}

/**
 * Updates a specific stat value
 */
export async function updateCharacterStat(stat: keyof CharacterStats, value: number): Promise<{ success: boolean; error?: string }> {
  return await saveCharacterStats({ [stat]: value });
}

/**
 * Adds to a specific stat value (for gold, experience, etc.)
 */
export async function addToCharacterStat(stat: keyof CharacterStats, amount: number): Promise<{ success: boolean; error?: string }> {
  const currentStats = await loadCharacterStats();
  const currentValue = currentStats[stat] || 0;
  return await saveCharacterStats({ [stat]: currentValue + amount });
}

/**
 * Gets character stats from localStorage
 * @returns CharacterStats object
 */
export function getCharacterStats(): CharacterStats {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    return {
      gold: 0,
      experience: 0,
      level: 1,
      health: 100,
      max_health: 100,
      build_tokens: 0,
      kingdom_expansions: 0
    };
  }

  try {
    const stored = localStorage.getItem('character-stats');
    if (stored) {
      const stats = JSON.parse(stored);
      return {
        gold: stats.gold || 0,
        experience: stats.experience || 0,
        level: stats.level || 1,
        health: stats.health || 100,
        max_health: stats.max_health || 100,
        build_tokens: stats.buildTokens || 0,
        kingdom_expansions: parseInt(localStorage.getItem('kingdom-grid-expansions') || '0', 10)
      };
    }
  } catch (error) {
    console.warn('[Character Stats Manager] Error getting stats from localStorage:', error);
  }

  return {
    gold: 0,
    experience: 0,
    level: 1,
    health: 100,
    max_health: 100,
    build_tokens: 0,
    kingdom_expansions: 0
  };
}

/**
 * Fetches fresh character stats from the API and updates localStorage
 * This is the primary data source for real-time updates
 */
export async function fetchFreshCharacterStats(): Promise<CharacterStats | null> {
  try {
    const { fetchWithAuth } = await import('./fetchWithAuth');
    const response = await fetchWithAuth('/api/character-stats', {
      method: 'GET',
    });
    
    if (response.ok) {
      const result = await response.json();
      const characterData = result.data?.data || result.data;
      
      if (characterData) {
        // Update localStorage with fresh data
        const freshStats = {
          gold: characterData.gold || 0,
          experience: characterData.experience || 0,
          level: characterData.level || 1,
          health: characterData.health || 100,
          max_health: characterData.max_health || 100,
          build_tokens: characterData.build_tokens || 0,
          kingdom_expansions: characterData.kingdom_expansions || 0
        };
        
        localStorage.setItem('character-stats', JSON.stringify(freshStats));
        
        // Dispatch update event to notify all components
        window.dispatchEvent(new Event('character-stats-update'));
        
        // Fresh stats fetched from API
        return freshStats;
      }
    }
    
    console.warn('[Character Stats Manager] API fetch failed or no data returned');
    return null;
  } catch (error) {
    console.error('[Character Stats Manager] Error fetching fresh stats:', error);
    return null;
  }
}

/**
 * Sets character stats synchronously (for immediate use)
 */
export function setCharacterStats(stats: Partial<CharacterStats>): void {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    console.warn('[Character Stats Manager] Cannot set stats on server side');
    return;
  }

  try {
    const currentStats = getCharacterStats();
    const updatedStats = { ...currentStats, ...stats };
    
    // Setting stats
    
    // Always calculate level from experience to ensure consistency
    if (stats.experience !== undefined) {
      const { calculateLevelFromExperience } = require('@/types/character');
      updatedStats.level = calculateLevelFromExperience(stats.experience);
      // Level calculated from experience
    }
    
    // Convert to localStorage format
    const localStorageStats = {
      gold: updatedStats.gold,
      experience: updatedStats.experience,
      level: updatedStats.level,
      health: updatedStats.health,
      max_health: updatedStats.max_health,
      buildTokens: updatedStats.build_tokens
    };
    
    localStorage.setItem('character-stats', JSON.stringify(localStorageStats));
    
    // Save kingdom expansions separately
    if (stats.kingdom_expansions !== undefined) {
      localStorage.setItem('kingdom-grid-expansions', String(stats.kingdom_expansions));
    }
    
    // Saved to localStorage
    
    // Dispatch update event to notify all components
    window.dispatchEvent(new Event('character-stats-update'));
  } catch (error) {
    console.warn('[Character Stats Manager] Error setting stats:', error);
  }
}

/**
 * Updates a specific stat value synchronously (for immediate use)
 */
export function updateCharacterStatSync(stat: keyof CharacterStats, value: number): void {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    console.warn('[Character Stats Manager] Cannot update stats on server side');
    return;
  }

  // If we're updating experience, we need to recalculate level
  if (stat === 'experience') {
    const { calculateLevelFromExperience } = require('@/types/character');
    const newLevel = calculateLevelFromExperience(value);
    setCharacterStats({ [stat]: value, level: newLevel });
  } else {
    setCharacterStats({ [stat]: value });
  }
}

/**
 * Adds to a specific stat value synchronously (for immediate use)
 */
export function addToCharacterStatSync(stat: keyof CharacterStats, amount: number): void {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    console.warn('[Character Stats Manager] Cannot add to stats on server side');
    return;
  }

  const currentStats = getCharacterStats();
  const currentValue = currentStats[stat] || 0;
  const newValue = currentValue + amount;
  
  // Adding to stat
  
  // If we're updating experience, we need to recalculate level
  if (stat === 'experience') {
    const { calculateLevelFromExperience } = require('@/types/character');
    const newLevel = calculateLevelFromExperience(newValue);
    // Experience update
    setCharacterStats({ [stat]: newValue, level: newLevel });
  } else {
    setCharacterStats({ [stat]: newValue });
  }
} 