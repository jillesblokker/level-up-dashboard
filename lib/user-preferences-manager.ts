// User Preferences Manager - Replaces localStorage usage with Supabase persistence
// This ensures all user preferences are saved across devices

export interface UserPreference {
  key: string;
  value: any;
}

/**
 * Gets a user preference from Supabase
 */
export async function getUserPreference(key: string): Promise<any> {
  try {
    const response = await fetch(`/api/user-preferences?key=${encodeURIComponent(key)}`);
    if (response.ok) {
      const data = await response.json();
      return data.value;
    }
    return null;
  } catch (error) {
    console.error(`[User Preferences] Error getting preference ${key}:`, error);
    return null;
  }
}

/**
 * Sets a user preference in Supabase
 */
export async function setUserPreference(key: string, value: any): Promise<boolean> {
  try {
    const response = await fetch('/api/user-preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, value }),
    });

    if (response.ok) {
      console.log(`[User Preferences] ✅ Saved preference: ${key}`);
      return true;
    } else {
      console.error(`[User Preferences] ❌ Failed to save preference: ${key}`);
      return false;
    }
  } catch (error) {
    console.error(`[User Preferences] Error setting preference ${key}:`, error);
    return false;
  }
}

/**
 * Deletes a user preference from Supabase
 */
export async function deleteUserPreference(key: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/user-preferences?key=${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      console.log(`[User Preferences] ✅ Deleted preference: ${key}`);
      return true;
    } else {
      console.error(`[User Preferences] ❌ Failed to delete preference: ${key}`);
      return false;
    }
  } catch (error) {
    console.error(`[User Preferences] Error deleting preference ${key}:`, error);
    return false;
  }
}

/**
 * Gets all user preferences from Supabase
 */
export async function getAllUserPreferences(): Promise<Record<string, any>> {
  try {
    const response = await fetch('/api/user-preferences');
    if (response.ok) {
      const data = await response.json();
      return data.preferences || {};
    }
    return {};
  } catch (error) {
    console.error('[User Preferences] Error getting all preferences:', error);
    return {};
  }
}

/**
 * Migrates localStorage data to Supabase
 */
export async function migrateLocalStorageToSupabase(): Promise<void> {
  try {
    console.log('[User Preferences] 🚀 Starting localStorage migration to Supabase...');
    
    // List of localStorage keys to migrate
    const keysToMigrate = [
      'autoSave',
      'gameMode',
      'kingdom-grid-expansions',
      'realm-map-expansions',
      'headerImages',
      'onboarding-completed',
      'hasVisitedRealm',
      'horsePos',
      'sheepPos',
      'horseCaught',
      'completedMysteryTiles',
      'pendingTilePlacements'
    ];

    let migratedCount = 0;
    let failedCount = 0;

    for (const key of keysToMigrate) {
      try {
        const value = localStorage.getItem(key);
        if (value !== null) {
          let parsedValue;
          try {
            parsedValue = JSON.parse(value);
          } catch {
            parsedValue = value; // Keep as string if not JSON
          }

          const success = await setUserPreference(key, parsedValue);
          if (success) {
            migratedCount++;
            console.log(`[User Preferences] ✅ Migrated: ${key}`);
          } else {
            failedCount++;
            console.log(`[User Preferences] ❌ Failed to migrate: ${key}`);
          }
        }
      } catch (error) {
        failedCount++;
        console.error(`[User Preferences] Error migrating ${key}:`, error);
      }
    }

    console.log(`[User Preferences] 🎉 Migration complete! Migrated: ${migratedCount}, Failed: ${failedCount}`);
    
    if (failedCount === 0) {
      console.log('[User Preferences] 🧹 Clearing migrated localStorage data...');
      keysToMigrate.forEach(key => localStorage.removeItem(key));
      console.log('[User Preferences] ✅ localStorage cleared');
    }
  } catch (error) {
    console.error('[User Preferences] Migration error:', error);
  }
}

/**
 * Syncs preferences from Supabase to localStorage (fallback)
 */
export async function syncPreferencesToLocalStorage(): Promise<void> {
  try {
    console.log('[User Preferences] 🔄 Syncing preferences to localStorage...');
    
    const preferences = await getAllUserPreferences();
    let syncedCount = 0;

    for (const [key, value] of Object.entries(preferences)) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        syncedCount++;
      } catch (error) {
        console.error(`[User Preferences] Error syncing ${key} to localStorage:`, error);
      }
    }

    console.log(`[User Preferences] ✅ Synced ${syncedCount} preferences to localStorage`);
  } catch (error) {
    console.error('[User Preferences] Sync error:', error);
  }
} 