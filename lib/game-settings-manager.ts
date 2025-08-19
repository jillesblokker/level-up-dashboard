export interface GameSetting {
  setting_key: string;
  setting_value?: any;
  settings_data?: { value: any } | any;
}

/**
 * Loads game settings from Supabase with localStorage fallback
 */
export async function loadGameSettings(): Promise<Record<string, any>> {
  try {
    // Try to load from Supabase first
    const response = await fetch('/api/game-settings', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data) {
        const settings: Record<string, any> = {};
        data.data.forEach((setting: GameSetting) => {
          // Handle both column names for compatibility
          const value = setting.setting_value || setting.settings_data?.value || setting.settings_data;
          settings[setting.setting_key] = value;
        });
        console.log('[Game Settings Manager] Loaded from Supabase:', settings);
        return settings;
      }
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
      'kingdom-grid-expansions'
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

  // Save to Supabase
  try {
    // Save each setting individually
    for (const [key, value] of Object.entries(settings)) {
      const response = await fetch('/api/game-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setting_key: key,
          setting_value: value
        }),
      });

      if (!response.ok) {
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
  const settings = await loadGameSettings();
  return settings[key];
}

/**
 * Sets a specific game setting
 */
export async function setGameSetting(key: string, value: any): Promise<{ success: boolean; error?: string }> {
  const settings = await loadGameSettings();
  settings[key] = value;
  return await saveGameSettings(settings);
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
      'kingdom-grid-expansions'
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