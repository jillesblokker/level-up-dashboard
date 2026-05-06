import { logger } from './logger';

// User Preferences Manager - Replaces localStorage usage with Supabase persistence
// This ensures all user preferences are saved across devices

export interface UserPreference {
  key: string;
  value: unknown;
}

/**
 * Gets a user preference.
 * Checks localStorage first (instant, no auth needed) then falls back
 * to the API only if the user appears to be authenticated.
 */
export async function getUserPreference(key: string): Promise<unknown> {
  // 1. Try localStorage first — works without auth and is instant
  try {
    const local = localStorage.getItem(`pref:${key}`);
    if (local !== null) {
      try { return JSON.parse(local); } catch { return local; }
    }
  } catch { /* SSR or private browsing */ }

  // 2. Only hit the API if we believe the user is signed in
  //    (Clerk sets a __session cookie when authenticated)
  const hasSession = typeof document !== 'undefined' &&
    document.cookie.split(';').some(c => c.trim().startsWith('__session=') || c.trim().startsWith('__clerk_db_jwt='));

  if (!hasSession) return null;

  try {
    const response = await fetch(`/api/user-preferences?key=${encodeURIComponent(key)}`, {
      credentials: 'include',
    });
    if (!response.ok) return null;          // silently ignore 401/403/5xx
    const data = await response.json();
    // Cache in localStorage for next time
    if (data.value !== null && data.value !== undefined) {
      try { localStorage.setItem(`pref:${key}`, JSON.stringify(data.value)); } catch { /* ignore */ }
    }
    return data.value;
  } catch (error) {
    logger.error(`[User Preferences] Error getting preference ${key}:`, error);
    return null;
  }
}

/**
 * Sets a user preference. Writes to localStorage immediately for instant
 * reads, then persists to the API in the background.
 */
export async function setUserPreference(key: string, value: unknown): Promise<boolean> {
  // Write to localStorage immediately so reads don't need to wait
  try {
    localStorage.setItem(`pref:${key}`, JSON.stringify(value));
  } catch { /* SSR or quota */ }

  try {
    const response = await fetch('/api/user-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
      credentials: 'include',
    });

    if (response.ok) {
      logger.debug(`[User Preferences] Saved preference: ${key}`);
      return true;
    } else {
      logger.warn(`[User Preferences] API returned ${response.status} for ${key} — localStorage only`);
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