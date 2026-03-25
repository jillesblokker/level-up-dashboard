import { logger } from "@/lib/logger";
// Realm Data Manager - Handles realm-specific data migration from localStorage to Supabase

export interface RealmData {
  animalPositions: {
    horse?: { x: number; y: number };
    sheep?: { x: number; y: number };
    penguin?: { x: number; y: number };
    eagle?: { x: number; y: number };
  };
  animalStates: {
    horseCaught?: boolean;
    sheepCaught?: boolean;
    penguinCaught?: boolean;
    eagleCaught?: boolean;
  };
  mysteryTiles: string[]; // Array of "x-y" coordinates
  realmExpansions: number;
  pendingTilePlacements: any[];
  completedMysteryTiles: string[];
}

// Save realm data to Supabase
export async function saveRealmData(key: string, value: any): Promise<boolean> {
  try {
    const response = await fetch('/api/realm-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });

    if (response.ok) {
      logger.debug(`[Realm Data Manager] ✅ Saved realm data: ${key}`);
      return true;
    } else {
      logger.error(`[Realm Data Manager] ❌ Failed to save realm data: ${key}`);
      return false;
    }
  } catch (error) {
    logger.error(`[Realm Data Manager] Error saving realm data ${key}:`, error);
    return false;
  }
}

// Get realm data from Supabase
export async function getRealmData(key: string): Promise<any | null> {
  try {
    const response = await fetch(`/api/realm-data?key=${encodeURIComponent(key)}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.value !== null) {
        logger.debug(`[Realm Data Manager] ✅ Retrieved realm data: ${key}`);
        return data.value;
      }
    }
    
    logger.debug(`[Realm Data Manager] ℹ️ No realm data found for: ${key}`);
    return null;
  } catch (error) {
    logger.error(`[Realm Data Manager] Error retrieving realm data ${key}:`, error);
    return null;
  }
}

// Get all realm data from Supabase
export async function getAllRealmData(): Promise<Record<string, any>> {
  try {
    const response = await fetch('/api/realm-data');
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.preferences) {
        logger.debug(`[Realm Data Manager] ✅ Retrieved all realm data`);
        return data.preferences;
      }
    }
    
    logger.debug(`[Realm Data Manager] ℹ️ No realm data found`);
    return {};
  } catch (error) {
    logger.error(`[Realm Data Manager] Error retrieving all realm data:`, error);
    return {};
  }
}

// Migrate realm data from localStorage to Supabase
export async function migrateRealmDataToSupabase(): Promise<boolean> {
  try {
    logger.debug('[Realm Data Manager] 🚀 Starting realm data migration...');
    
    if (typeof window === 'undefined') {
      logger.debug('[Realm Data Manager] Skipping migration - not in browser');
      return true;
    }

    const migrationKey = 'realm-data-migration-complete';
    const migrationDone = localStorage.getItem(migrationKey);
    
    if (migrationDone) {
      logger.debug('[Realm Data Manager] Migration already completed');
      return true;
    }

    const realmData: Partial<RealmData> = {};
    let hasData = false;

    // Animal positions
    const horsePos = localStorage.getItem('horsePos');
    if (horsePos) {
      realmData.animalPositions = { ...realmData.animalPositions, horse: JSON.parse(horsePos) };
      hasData = true;
    }

    const sheepPos = localStorage.getItem('sheepPos');
    if (sheepPos) {
      realmData.animalPositions = { ...realmData.animalPositions, sheep: JSON.parse(sheepPos) };
      hasData = true;
    }

    // Animal states
    const horseCaught = localStorage.getItem('horseCaught');
    if (horseCaught) {
      realmData.animalStates = { ...realmData.animalStates, horseCaught: horseCaught === 'true' };
      hasData = true;
    }

    // Mystery tiles
    const completedMysteryTiles = localStorage.getItem('completedMysteryTiles');
    if (completedMysteryTiles) {
      realmData.completedMysteryTiles = JSON.parse(completedMysteryTiles);
      hasData = true;
    }

    // Realm expansions
    const realmExpansions = localStorage.getItem('realm-map-expansions');
    if (realmExpansions) {
      realmData.realmExpansions = parseInt(realmExpansions, 10);
      hasData = true;
    }

    // Pending tile placements
    const pendingTilePlacements = localStorage.getItem('pendingTilePlacements');
    if (pendingTilePlacements) {
      realmData.pendingTilePlacements = JSON.parse(pendingTilePlacements);
      hasData = true;
    }

    if (!hasData) {
      logger.debug('[Realm Data Manager] No realm data to migrate');
      localStorage.setItem(migrationKey, 'true');
      return true;
    }

    // Save each piece of data to Supabase
    const savePromises: Promise<boolean>[] = [];

    if (realmData.animalPositions) {
      Object.entries(realmData.animalPositions).forEach(([animal, position]) => {
        if (position) {
          savePromises.push(saveRealmData(`animal-${animal}-position`, position));
        }
      });
    }

    if (realmData.animalStates) {
      Object.entries(realmData.animalStates).forEach(([animal, state]) => {
        if (state !== undefined) {
          savePromises.push(saveRealmData(`animal-${animal}-state`, state));
        }
      });
    }

    if (realmData.completedMysteryTiles) {
      savePromises.push(saveRealmData('mystery-completed-tiles', realmData.completedMysteryTiles));
    }

    if (realmData.realmExpansions !== undefined) {
      savePromises.push(saveRealmData('realm-expansions', realmData.realmExpansions));
    }

    if (realmData.pendingTilePlacements) {
      savePromises.push(saveRealmData('realm-pending-tiles', realmData.pendingTilePlacements));
    }

    // Wait for all saves to complete
    const results = await Promise.all(savePromises);
    const allSuccessful = results.every(result => result);

    if (allSuccessful) {
      logger.debug('[Realm Data Manager] ✅ Realm data migration completed successfully');
      localStorage.setItem(migrationKey, 'true');
      
      // Clean up localStorage after successful migration
      const keysToRemove = [
        'horsePos', 'sheepPos', 'horseCaught', 'completedMysteryTiles',
        'realm-map-expansions', 'pendingTilePlacements'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          logger.warn(`[Realm Data Manager] Could not remove localStorage key: ${key}`, error);
        }
      });
      
      return true;
    } else {
      logger.error('[Realm Data Manager] ❌ Some realm data failed to migrate');
      return false;
    }
  } catch (error) {
    logger.error('[Realm Data Manager] ❌ Realm data migration failed:', error);
    return false;
  }
}

// Sync realm data to localStorage as backup
export async function syncRealmDataToLocalStorage(): Promise<void> {
  try {
    logger.debug('[Realm Data Manager] 🔄 Syncing realm data to localStorage...');
    
    const realmData = await getAllRealmData();
    
    Object.entries(realmData).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        logger.warn(`[Realm Data Manager] Could not sync key to localStorage: ${key}`, error);
      }
    });
    
    logger.debug('[Realm Data Manager] ✅ Realm data synced to localStorage');
  } catch (error) {
    logger.error('[Realm Data Manager] Error syncing realm data to localStorage:', error);
  }
}
