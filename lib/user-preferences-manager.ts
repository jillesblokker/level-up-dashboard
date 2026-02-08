import { logger } from './logger';

// User Preferences Manager - Replaces localStorage usage with Supabase persistence
// This ensures all user preferences are saved across devices

export interface UserPreference {
  key: string;
  value: unknown;
}

/**
 * Gets a user preference from Supabase
 */
export async function getUserPreference(key: string): Promise<unknown> {
  try {
    const response = await fetch(`/api/user-preferences?key=${encodeURIComponent(key)}`);
    if (response.ok) {
      const data = await response.json();
      return data.value;
    }
    return null;
  } catch (error) {
    logger.error(`[User Preferences] Error getting preference ${key}:`, error);
    return null;
  }
}

/**
 * Sets a user preference in Supabase
 */
export async function setUserPreference(key: string, value: unknown): Promise<boolean> {
  try {
    const response = await fetch('/api/user-preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, value }),
    });

    if (response.ok) {
      logger.debug(`[User Preferences] Saved preference: ${key}`);
      return true;
    } else {
      logger.error(`[User Preferences] Failed to save preference: ${key}`);
      return false;
    }
  } catch (error) {
    logger.error(`[User Preferences] Error setting preference ${key}:`, error);
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
      logger.debug(`[User Preferences] Deleted preference: ${key}`);
      return true;
    } else {
      logger.error(`[User Preferences] Failed to delete preference: ${key}`);
      return false;
    }
  } catch (error) {
    logger.error(`[User Preferences] Error deleting preference ${key}:`, error);
    return false;
  }
}

/**
 * Gets all user preferences from Supabase
 */
export async function getAllUserPreferences(): Promise<Record<string, unknown>> {
  try {
    const response = await fetch('/api/user-preferences');
    if (response.ok) {
      const data = await response.json();
      return data.preferences || {};
    }
    return {};
  } catch (error) {
    logger.error('[User Preferences] Error getting all preferences:', error);
    return {};
  }
}

/**
 * Migrates localStorage data to Supabase
 */
export async function migrateLocalStorageToSupabase(): Promise<void> {
  try {
    logger.info('[User Preferences] Starting localStorage migration to Supabase...');

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
            logger.debug(`[User Preferences] Migrated: ${key}`);
          } else {
            failedCount++;
            logger.warn(`[User Preferences] Failed to migrate: ${key}`);
          }
        }
      } catch (error) {
        failedCount++;
        logger.error(`[User Preferences] Error migrating ${key}:`, error);
      }
    }

    logger.info(`[User Preferences] Migration complete! Migrated: ${migratedCount}, Failed: ${failedCount}`);

    if (failedCount === 0) {
      logger.debug('[User Preferences] Clearing migrated localStorage data...');
      keysToMigrate.forEach(key => localStorage.removeItem(key));
      logger.debug('[User Preferences] localStorage cleared');
    }
  } catch (error) {
    logger.error('[User Preferences] Migration error:', error);
  }
}

/**
 * Syncs preferences from Supabase to localStorage (fallback)
 */
export async function syncPreferencesToLocalStorage(): Promise<void> {
  try {
    logger.info('[User Preferences] Syncing preferences to localStorage...');

    const preferences = await getAllUserPreferences();
    let syncedCount = 0;

    for (const [key, value] of Object.entries(preferences)) {
      try {
        // localStorage stores strings, but value might be any type. 
        // JSON.stringify handles booleans correctly ("true"/"false")
        const newValue = typeof value === 'string' ? value : JSON.stringify(value);

        localStorage.setItem(key, newValue);
        syncedCount++;

        // Special handling for Day/Night cycle to trigger immediate update
        if (key === 'day-night-cycle-enabled') {
          // Dispatch event to update DayNightCycle component immediately
          // The event expects { enabled: boolean }
          const isEnabled = value === true || value === "true";
          window.dispatchEvent(new CustomEvent('settings:dayNightChanged', { detail: { enabled: isEnabled } }));
        }
      } catch (error) {
        logger.error(`[User Preferences] Error syncing ${key} to localStorage:`, error);
      }
    }

    logger.info(`[User Preferences] Synced ${syncedCount} preferences to localStorage`);
  } catch (error) {
    logger.error('[User Preferences] Sync error:', error);
  }
}