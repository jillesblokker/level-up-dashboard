import { supabase } from '@/lib/supabase/client';

export interface MigrationData {
  gridData?: any;
  characterPosition?: { x: number; y: number };
  tileInventory?: Record<string, any>;
  userPreferences?: Record<string, any>;
  imageDescriptions?: Record<string, string>;
  gameSettings?: Record<string, any>;
}

export interface MigrationResult {
  success: boolean;
  migrated: string[];
  errors: string[];
  data?: any;
}

/**
 * Collects all localStorage data that should be migrated to Supabase
 */
export function collectLocalStorageData(): MigrationData {
  const data: MigrationData = {};

  // Check if we're on the client side
  if (typeof window === 'undefined') {
    console.warn('localStorage is not available on server side');
    return data;
  }

  try {
    // Grid data
    const gridData = localStorage.getItem('grid');
    if (gridData) {
      data.gridData = JSON.parse(gridData);
    }

    // Character position
    const characterPosition = localStorage.getItem('characterPosition');
    if (characterPosition) {
      data.characterPosition = JSON.parse(characterPosition);
    }

    // Tile inventory
    const tileInventory = localStorage.getItem('tileInventory');
    if (tileInventory) {
      data.tileInventory = JSON.parse(tileInventory);
    }

    // User preferences
    const userPreferences: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pref_')) {
        try {
          userPreferences[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch (e) {
          console.warn(`Failed to parse preference ${key}:`, e);
        }
      }
    }
    if (Object.keys(userPreferences).length > 0) {
      data.userPreferences = userPreferences;
    }

    // Image descriptions
    const imageDescriptions = localStorage.getItem('imageDescriptions');
    if (imageDescriptions) {
      data.imageDescriptions = JSON.parse(imageDescriptions);
    }

    // Game settings
    const gameSettings: Record<string, any> = {};
    const settingKeys = [
      'autoSave',
      'gameMode',
      'hasVisitedRealm',
      'horsePos',
      'sheepPos',
      'horseCaught',
      'character-stats',
      'gold-storage',
      'creature-store',
      'achievement-store'
    ];

    settingKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          gameSettings[key] = JSON.parse(value);
        } catch (e) {
          gameSettings[key] = value; // Store as string if not JSON
        }
      }
    });

    if (Object.keys(gameSettings).length > 0) {
      data.gameSettings = gameSettings;
    }

  } catch (error) {
    console.error('Error collecting localStorage data:', error);
  }

  return data;
}

/**
 * Migrates localStorage data to Supabase for the current user
 */
export async function migrateLocalStorageToSupabase(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migrated: [],
    errors: []
  };

  try {
    // Collect all localStorage data
    const migrationData = collectLocalStorageData();
    
    // Check if there's any data to migrate
    const hasData = Object.values(migrationData).some(data => data !== undefined);
    if (!hasData) {
      result.success = true;
      result.migrated.push('no-data-to-migrate');
      return result;
    }

    // Call the migration function
    const { data, error } = await supabase.rpc('migrate_user_local_storage_data', {
      p_user_id: userId,
      p_grid_data: migrationData.gridData,
      p_character_position: migrationData.characterPosition,
      p_tile_inventory: migrationData.tileInventory,
      p_user_preferences: migrationData.userPreferences,
      p_image_descriptions: migrationData.imageDescriptions,
      p_game_settings: migrationData.gameSettings
    });

    if (error) {
      result.errors.push(`Migration failed: ${error.message}`);
      return result;
    }

    // Track what was migrated
    if (data) {
      Object.keys(data).forEach(key => {
        if (data[key] === true) {
          result.migrated.push(key);
        }
      });
    }

    result.success = true;
    result.data = data;

    // Clear migrated data from localStorage (optional)
    if (result.success && result.migrated.length > 0) {
      clearMigratedLocalStorageData();
    }

  } catch (error) {
    result.errors.push(`Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Clears localStorage data that has been successfully migrated to Supabase
 */
export function clearMigratedLocalStorageData(): void {
  try {
    const keysToRemove = [
      'grid',
      'characterPosition',
      'tileInventory',
      'imageDescriptions',
      'autoSave',
      'gameMode',
      'hasVisitedRealm',
      'horsePos',
      'sheepPos',
      'horseCaught',
      'character-stats',
      'gold-storage',
      'creature-store',
      'achievement-store'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Remove preference keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pref_')) {
        localStorage.removeItem(key);
      }
    }

    console.log('Cleared migrated localStorage data');
  } catch (error) {
    console.error('Error clearing localStorage data:', error);
  }
}

/**
 * Loads data from Supabase with localStorage fallback
 */
export async function loadDataWithFallback<T>(
  supabaseQuery: () => Promise<{ data: T | null; error: any }>,
  localStorageKey: string,
  defaultValue: T
): Promise<T> {
  try {
    // Try to load from Supabase first
    const { data, error } = await supabaseQuery();
    
    if (!error && data) {
      return data;
    }
  } catch (error) {
    console.warn(`Failed to load from Supabase for ${localStorageKey}:`, error);
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(localStorageKey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn(`Failed to load from localStorage for ${localStorageKey}:`, error);
  }

  return defaultValue;
}

/**
 * Saves data to both Supabase and localStorage for redundancy
 */
export async function saveDataWithRedundancy<T>(
  supabaseSave: (data: T) => Promise<{ error: any }>,
  localStorageKey: string,
  data: T
): Promise<{ success: boolean; error?: string }> {
  let supabaseSuccess = false;
  let localStorageSuccess = false;

  // Save to Supabase
  try {
    const { error } = await supabaseSave(data);
    if (!error) {
      supabaseSuccess = true;
    } else {
      console.warn('Supabase save failed:', error);
    }
  } catch (error) {
    console.warn('Supabase save error:', error);
  }

  // Save to localStorage as backup
  try {
    localStorage.setItem(localStorageKey, JSON.stringify(data));
    localStorageSuccess = true;
  } catch (error) {
    console.warn('localStorage save error:', error);
  }

  const result: { success: boolean; error?: string } = {
    success: supabaseSuccess || localStorageSuccess
  };
  
  if (!supabaseSuccess && !localStorageSuccess) {
    result.error = 'Failed to save data';
  }
  
  return result;
}

/**
 * Checks if user has migrated data
 */
export async function checkMigrationStatus(userId: string): Promise<{
  hasMigrated: boolean;
  hasLocalData: boolean;
  migrationData?: MigrationData;
}> {
  const result: {
    hasMigrated: boolean;
    hasLocalData: boolean;
    migrationData?: MigrationData;
  } = {
    hasMigrated: false,
    hasLocalData: false
  };

  try {
    // Check if user has data in Supabase
    const { data: gridData } = await supabase
      .from('realm_grids')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (gridData && gridData.length > 0) {
      result.hasMigrated = true;
    }

    // Check if user has data in localStorage
    const migrationData = collectLocalStorageData();
    const hasLocalData = Object.values(migrationData).some(data => data !== undefined);
    
    result.hasLocalData = hasLocalData;
    if (hasLocalData) {
      result.migrationData = migrationData;
    }

  } catch (error) {
    console.error('Error checking migration status:', error);
  }

  return result;
}

/**
 * Shows migration prompt to user
 */
export function showMigrationPrompt(): boolean {
  const hasShownPrompt = localStorage.getItem('migration-prompt-shown');
  if (hasShownPrompt) {
    return false;
  }

  const hasLocalData = Object.keys(collectLocalStorageData()).length > 0;
  if (!hasLocalData) {
    return false;
  }

  localStorage.setItem('migration-prompt-shown', 'true');
  return true;
} 