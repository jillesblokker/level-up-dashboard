import { getUserPreference, setUserPreference, getAllUserPreferences } from './user-preferences-manager';

export interface GameSetting {
  setting_key: string;
  setting_value?: any;
}

/**
 * Loads game settings from Supabase with localStorage fallback
 */
export async function loadGameSettings(): Promise<Record<string, any>> {
  try {
    // Try to load from Supabase first using new user preferences system
    const settings = await getAllUserPreferences();
    
    // Filter for game settings (keys that start with game- or are known game keys)
    const gameSettings: Record<string, any> = {};
    const gameSettingKeys = [
      'autoSave',
      'gameMode',
      'hasVisitedRealm',
      'horsePos',
      'sheepPos',
      'horseCaught',
      'headerImages',
      'kingdom-grid-expansions',
      'realm-map-expansions',
      'onboarding-completed',
      'app-gradient',
      'character-header-image',
      'market-onboarding-shown',
      'levelup-gold-balance'
    ];

    // Extract game settings from user preferences
    Object.entries(settings).forEach(([key, value]) => {
      if (gameSettingKeys.includes(key) || key.startsWith('game-')) {
        gameSettings[key] = value;
      }
    });

    if (Object.keys(gameSettings).length > 0) {
      console.log('[Game Settings Manager] Loaded from Supabase:', gameSettings);
      return gameSettings;
    }
  } catch (error) {
    console.warn('[Game Settings Manager] Failed to load from Supabase:', error);
  }

  // Fallback to localStorage
  try {
    const settings: Record<string, any> = {};
    const settingKeys = [
      'autoSave',
      'gameMode',
      'hasVisitedRealm',
      'horsePos',
      'sheepPos',
      'horseCaught',
      'headerImages',
      'kingdom-grid-expansions',
      'realm-map-expansions',
      'onboarding-completed',
      'app-gradient',
      'character-header-image',
      'market-onboarding-shown',
      'levelup-gold-balance'
    ];

    settingKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          settings[key] = JSON.parse(value);
        } catch (e) {
          settings[key] = value; // Store as string if not JSON
        }
      }
    });

    console.log('[Game Settings Manager] Loaded from localStorage:', settings);
    return settings;
  } catch (error) {
    console.warn('[Game Settings Manager] Failed to load from localStorage:', error);
  }

  return {};
}

/**
 * Saves game settings to both Supabase and localStorage
 */
export async function saveGameSettings(settings: Record<string, any>): Promise<{ success: boolean; error?: string }> {
  let supabaseSuccess = false;
  let localStorageSuccess = false;

  // Save to Supabase using new user preferences system
  try {
    // Save each setting individually
    for (const [key, value] of Object.entries(settings)) {
      const success = await setUserPreference(key, value);
      if (!success) {
        console.warn('[Game Settings Manager] Failed to save setting to Supabase:', key);
        break;
      }
    }
    supabaseSuccess = true;
    console.log('[Game Settings Manager] Saved to Supabase:', settings);
  } catch (error) {
    console.warn('[Game Settings Manager] Supabase save error:', error);
  }

  // Save to localStorage as backup
  try {
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, String(value));
      }
    }
    localStorageSuccess = true;
    console.log('[Game Settings Manager] Saved to localStorage:', settings);
  } catch (error) {
    console.warn('[Game Settings Manager] localStorage save error:', error);
  }

  const result: { success: boolean; error?: string } = {
    success: supabaseSuccess || localStorageSuccess
  };
  
  if (!supabaseSuccess && !localStorageSuccess) {
    result.error = 'Failed to save game settings';
  }
  
  return result;
}

/**
 * Gets a specific game setting
 */
export async function getGameSetting(key: string): Promise<any> {
  try {
    // Try Supabase first
    const value = await getUserPreference(key);
    if (value !== null) {
      return value;
    }
  } catch (error) {
    console.warn('[Game Settings Manager] Failed to get setting from Supabase:', key, error);
  }

  // Fallback to localStorage
  try {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value; // Return as string if not JSON
      }
    }
  } catch (error) {
    console.warn('[Game Settings Manager] Failed to get setting from localStorage:', key, error);
  }

  return null;
}

/**
 * Sets a specific game setting
 */
export async function setGameSetting(key: string, value: any): Promise<{ success: boolean; error?: string }> {
  try {
    // Save to Supabase
    const supabaseSuccess = await setUserPreference(key, value);
    
    // Save to localStorage as backup
    try {
      if (typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, String(value));
      }
    } catch (error) {
      console.warn('[Game Settings Manager] localStorage backup save error:', error);
    }

    return { success: supabaseSuccess };
  } catch (error) {
    console.warn('[Game Settings Manager] Error setting game setting:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Gets game settings synchronously (for immediate use)
 */
export function getGameSettings(): Record<string, any> {
  try {
    const settings: Record<string, any> = {};
    const settingKeys = [
      'autoSave',
      'gameMode',
      'hasVisitedRealm',
      'horsePos',
      'sheepPos',
      'horseCaught',
      'headerImages',
      'kingdom-grid-expansions',
      'realm-map-expansions',
      'onboarding-completed',
      'app-gradient',
      'character-header-image',
      'market-onboarding-shown',
      'levelup-gold-balance'
    ];

    settingKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          settings[key] = JSON.parse(value);
        } catch (e) {
          settings[key] = value; // Store as string if not JSON
        }
      }
    });

    return settings;
  } catch (error) {
    console.warn('[Game Settings Manager] Error getting settings:', error);
    return {};
  }
}

/**
 * Sets game settings synchronously (for immediate use)
 */
export function setGameSettings(settings: Record<string, any>): void {
  try {
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, String(value));
      }
    }
    console.log('[Game Settings Manager] Set settings:', settings);
  } catch (error) {
    console.warn('[Game Settings Manager] Error setting settings:', error);
  }
}

/**
 * Gets a specific game setting synchronously
 */
export function getGameSettingSync(key: string): any {
  try {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value; // Return as string if not JSON
      }
    }
  } catch (error) {
    console.warn('[Game Settings Manager] Error getting setting:', error);
  }
  return null;
}

/**
 * Sets a specific game setting synchronously
 */
export function setGameSettingSync(key: string, value: any): void {
  try {
    if (typeof value === 'object') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, String(value));
    }
    console.log('[Game Settings Manager] Set setting:', key, value);
  } catch (error) {
    console.warn('[Game Settings Manager] Error setting setting:', error);
  }
} 