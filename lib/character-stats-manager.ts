import { saveToSupabaseClient, loadFromSupabaseClient } from './supabase-persistence-client';

export interface CharacterStats {
  gold: number;
  experience: number;
  level: number;
  health: number;
  max_health: number;
  build_tokens: number;
  kingdom_expansions: number;
  updated_at?: string;
}

/**
 * Loads character stats from Supabase with localStorage fallback
 */
export async function loadCharacterStats(): Promise<CharacterStats> {
  const defaultStats: CharacterStats = {
    health: 100,
    max_health: 100,
    gold: 0,
    experience: 0,
    level: 1,
    build_tokens: 0,
    kingdom_expansions: 0
  };

  return await loadFromSupabaseClient('/api/character-stats', 'character-stats', defaultStats);
}

/**
 * Saves character stats to both Supabase and localStorage
 */
export async function saveCharacterStats(stats: Partial<CharacterStats>): Promise<boolean> {
  // Load existing stats and merge with new stats
  const existingStats = await loadCharacterStats();
  const rawMergedStats = { ...existingStats, ...stats };

  // Sanitize stats to ensure no NaNs are sent
  const ensureNumber = (val: any, fallback: number = 0) => {
    const num = Number(val);
    return isNaN(num) ? fallback : num;
  };

  const mergedStats = {
    ...rawMergedStats,
    gold: ensureNumber(rawMergedStats.gold, 0),
    experience: ensureNumber(rawMergedStats.experience, 0),
    level: ensureNumber(rawMergedStats.level, 1),
    health: ensureNumber(rawMergedStats.health, 100),
    max_health: ensureNumber(rawMergedStats.max_health, 100),
    build_tokens: ensureNumber(rawMergedStats.build_tokens, 0),
    kingdom_expansions: ensureNumber(rawMergedStats.kingdom_expansions, 0)
  };

  // Update local timestamp
  if (typeof window !== 'undefined') {
    localStorage.setItem('character-stats-last-local-update', Date.now().toString());
  }

  return await saveToSupabaseClient('/api/character-stats', { stats: mergedStats }, 'character-stats');
}

/**
 * Updates a specific stat value
 */
export async function updateCharacterStat(stat: keyof CharacterStats, value: number): Promise<boolean> {
  const currentStats = await loadCharacterStats();
  const updatedStats = { ...currentStats, [stat]: value };
  return await saveCharacterStats(updatedStats);
}

/**
 * Adds to a specific stat value (for gold, experience, etc.)
 */
export async function addToCharacterStat(stat: keyof CharacterStats, amount: number): Promise<boolean> {
  const currentStats = await loadCharacterStats();
  const currentValue = (currentStats[stat] as number) || 0;
  const updatedStats = { ...currentStats, [stat]: currentValue + amount };
  return await saveCharacterStats(updatedStats);
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
        build_tokens: stats.build_tokens || stats.buildTokens || 0,
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

// Smart Rate Limiting System
class SmartRateLimiter {
  private lastUpdate = 0;
  private updateCount = 0;
  private context = 'idle';
  private actionHistory: Array<{ action: string, timestamp: number }> = [];
  private readonly MAX_HISTORY = 10;

  // Context-aware rate limits (in milliseconds)
  private readonly limits: Record<string, number> = {
    'quest-completion': 2000,   // 2 seconds - fast for quest actions
    'level-up': 1000,          // 1 second - immediate for level ups
    'gold-earned': 2000,       // 2 seconds - fast for gold (reduced from 3s)
    'experience-earned': 2000, // 2 seconds - fast for XP (reduced from 3s)
    'idle': 30000,             // 30 seconds - slow when idle
    'active': 10000,           // 10 seconds - moderate when active
    'kingdom-action': 2000,    // 2 seconds - fast for kingdom (reduced from 5s)
    'background-sync': 15000   // 15 seconds - slow for background
  };

  shouldUpdate(action: string): boolean {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdate;

    // Add action to history
    this.addToHistory(action, now);

    // Determine current context
    this.updateContext();

    // Get appropriate limit for current context
    const limit = this.limits[this.context] || this.limits['idle'] || 30000; // Default to 30 seconds

    // Check if enough time has passed
    if (timeSinceLastUpdate < limit) {
      console.log(`[Smart Rate Limiter] Skipping update - ${timeSinceLastUpdate}ms < ${limit}ms (context: ${this.context})`);
      return false;
    }

    // Allow update
    this.lastUpdate = now;
    this.updateCount++;
    console.log(`[Smart Rate Limiter] Allowing update - context: ${this.context}, count: ${this.updateCount}`);
    return true;
  }

  private addToHistory(action: string, timestamp: number): void {
    this.actionHistory.push({ action, timestamp });

    // Keep only recent history
    if (this.actionHistory.length > this.MAX_HISTORY) {
      this.actionHistory = this.actionHistory.slice(-this.MAX_HISTORY);
    }
  }

  private updateContext(): void {
    const now = Date.now();
    const recentActions = this.actionHistory.filter(
      entry => now - entry.timestamp < 10000 // Last 10 seconds
    );

    // Determine context based on recent actions
    if (recentActions.some(a => a.action === 'quest-completion')) {
      this.context = 'quest-completion';
    } else if (recentActions.some(a => a.action === 'level-up')) {
      this.context = 'level-up';
    } else if (recentActions.some(a => a.action.includes('kingdom'))) {
      this.context = 'kingdom-action';
    } else if (recentActions.length > 0) {
      this.context = 'active';
    } else {
      this.context = 'idle';
    }
  }

  getContext(): string {
    return this.context;
  }

  getStats(): { updateCount: number, context: string, lastUpdate: number } {
    return {
      updateCount: this.updateCount,
      context: this.context,
      lastUpdate: this.lastUpdate
    };
  }
}

// Global smart rate limiter instance
const smartRateLimiter = new SmartRateLimiter();

// ... (skip unchanged functions) ...

/**
 * Fetches fresh character stats from the API and updates localStorage
 * This is the primary data source for real-time updates
 */
export async function fetchFreshCharacterStats(action: string = 'background-sync'): Promise<CharacterStats | null> {
  // Use smart rate limiter to determine if we should fetch
  if (!smartRateLimiter.shouldUpdate(action)) {
    console.log('[Character Stats Manager] Skipping API fetch - smart rate limiter blocked');
    return getCharacterStats(); // Return cached data instead
  }

  try {
    const { fetchWithAuth } = await import('./fetchWithAuth');
    const response = await fetchWithAuth('/api/character-stats', {
      method: 'GET',
    });

    if (response.ok) {
      const result = await response.json();
      const characterData = result.stats;

      if (characterData) {
        // Get current local stats to compare
        const currentLocalStats = getCharacterStats();

        // Timestamp check for race condition prevention
        const lastLocalUpdate = parseInt(localStorage.getItem('character-stats-last-local-update') || '0');
        const serverUpdateTime = characterData.updated_at ? new Date(characterData.updated_at).getTime() : 0;

        // If server data is significantly older than our last local update (allowing 2s buffer),
        // we assume we have pending local changes that haven't synced yet.
        // In this case, we trust our local data for volatile stats like Gold.
        const isServerStale = serverUpdateTime < (lastLocalUpdate - 2000);

        if (isServerStale) {
          console.log('[Character Stats Manager] Server data appears stale, favoring local stats', {
            serverTime: new Date(serverUpdateTime).toISOString(),
            localTime: new Date(lastLocalUpdate).toISOString(),
            diff: serverUpdateTime - lastLocalUpdate
          });
        }

        // Merge logic: Keep the highest value for progressive stats
        const freshStats = {
          // For Gold: If server is stale, keep local. If server is fresh, use server.
          gold: isServerStale ? currentLocalStats.gold : (characterData.gold || 0),

          experience: Math.max(characterData.experience || 0, currentLocalStats.experience || 0),
          level: Math.max(characterData.level || 1, currentLocalStats.level || 1),
          health: characterData.health || 100, // Health is volatile
          max_health: characterData.max_health || 100,
          build_tokens: characterData.build_tokens || 0,
          kingdom_expansions: Math.max(characterData.kingdom_expansions || 0, currentLocalStats.kingdom_expansions || 0),
          updated_at: characterData.updated_at
        };

        localStorage.setItem('character-stats', JSON.stringify(freshStats));

        // If local stats were higher (and server wasn't stale), sync back to server
        // But if server IS stale, we definitely want to sync back eventually, but maybe not immediately to avoid loops
        if (!isServerStale && (freshStats.level > (characterData.level || 1) || freshStats.experience > (characterData.experience || 0))) {
          console.log('[Character Stats Manager] Local stats ahead of server, syncing back...', {
            serverLevel: characterData.level,
            localLevel: freshStats.level
          });
          saveCharacterStats(freshStats);
        }

        // Dispatch update event to notify all components
        window.dispatchEvent(new Event('character-stats-update'));

        // Fresh stats fetched from API (merged)
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

    console.log('[Character Stats Manager] setCharacterStats:', {
      current: currentStats,
      updates: stats,
      result: updatedStats
    });

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
      build_tokens: updatedStats.build_tokens
    };

    localStorage.setItem('character-stats', JSON.stringify(localStorageStats));

    // Save kingdom expansions separately
    if (stats.kingdom_expansions !== undefined) {
      localStorage.setItem('kingdom-grid-expansions', String(stats.kingdom_expansions));
    }

    console.log('[Character Stats Manager] Saved to localStorage:', localStorageStats);

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
  const currentValue = (currentStats[stat] as number) || 0;
  const newValue = currentValue + amount;

  console.log('[Character Stats Manager] addToCharacterStatSync:', { stat, currentValue, amount, newValue });

  // If we're updating experience, we need to recalculate level
  if (stat === 'experience') {
    const { calculateLevelFromExperience } = require('@/types/character');
    const newLevel = calculateLevelFromExperience(newValue);
    // Experience update
    setCharacterStats({ [stat]: newValue, level: newLevel });
  } else {
    setCharacterStats({ [stat]: newValue });
  }

  // Smart debounced Supabase saves with context awareness
  if (typeof window !== 'undefined') {
    const debounceKey = `save-stats-${stat}`;
    const existingTimeout = (window as any)[debounceKey];
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Determine context for smart rate limiting
    let context = 'background-sync';
    if (stat === 'gold') context = 'gold-earned';
    if (stat === 'experience') context = 'experience-earned';
    if (stat === 'level') context = 'level-up';

    (window as any)[debounceKey] = setTimeout(() => {
      // Use smart rate limiter for the actual save
      if (smartRateLimiter.shouldUpdate(context)) {
        saveCharacterStats({ [stat]: newValue }).catch(error => {
          console.warn('[Character Stats Manager] Failed to save to Supabase, but continuing:', error);
        });
      } else {
        console.log(`[Character Stats Manager] Skipping Supabase save for ${stat} - rate limited`);
      }
      delete (window as any)[debounceKey];
    }, 2000); // Reduced to 2 seconds for better responsiveness
  }
}

/**
 * Gets the current smart rate limiter statistics for debugging
 */
export function getRateLimiterStats(): { updateCount: number, context: string, lastUpdate: number } {
  return smartRateLimiter.getStats();
}

/**
 * Forces a context update for the smart rate limiter
 */
export function updateRateLimiterContext(action: string): void {
  smartRateLimiter.shouldUpdate(action);
} 