// Kingdom Data Manager - Handles kingdom-specific data migration from localStorage to Supabase

export interface KingdomData {
  tileTimers: any[];
  gridState: any[];
  tileItems: any[];
  challenges: any[];
  characterStats: any;
}

// Save kingdom data to the appropriate Supabase endpoint
export async function saveKingdomData(key: string, value: any): Promise<boolean> {
  try {
    let endpoint = '/api/user-preferences';
    let body: any = { key, value };

    // Route different data types to their dedicated endpoints
    switch (key) {
      case 'challenges':
        endpoint = '/api/challenges';
        body = { challenges: value };
        break;
      case 'character-stats':
        endpoint = '/api/character-stats';
        body = { stats: value };
        break;
      case 'kingdom-grid':
        endpoint = '/api/kingdom-grid';
        body = { grid: value };
        break;
      case 'kingdom-tile-timers':
        endpoint = '/api/kingdom-timers';
        body = { timers: value };
        break;
      case 'kingdom-tile-items':
        endpoint = '/api/kingdom-items';
        body = { items: value };
        break;
      default:
        // Use user-preferences for other data
        break;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      console.log(`[Kingdom Data Manager] ✅ Saved kingdom data: ${key} to ${endpoint}`);
      return true;
    } else {
      console.error(`[Kingdom Data Manager] ❌ Failed to save kingdom data: ${key} to ${endpoint}`, response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error(`[Kingdom Data Manager] Error saving kingdom data ${key}:`, error);
    return false;
  }
}

// Get kingdom data from the appropriate Supabase endpoint
export async function getKingdomData(key: string): Promise<any | null> {
  try {
    let endpoint = `/api/user-preferences?key=${encodeURIComponent(key)}`;
    
    // Route different data types to their dedicated endpoints
    switch (key) {
      case 'challenges':
        endpoint = '/api/challenges';
        break;
      case 'character-stats':
        endpoint = '/api/character-stats';
        break;
      case 'kingdom-grid':
        endpoint = '/api/kingdom-grid';
        break;
      case 'kingdom-tile-timers':
        endpoint = '/api/kingdom-timers';
        break;
      case 'kingdom-tile-items':
        endpoint = '/api/kingdom-items';
        break;
      default:
        // Use user-preferences for other data
        break;
    }

    const response = await fetch(endpoint);
    
    if (response.ok) {
      const data = await response.json();
      
      // Handle different response formats from different endpoints
      let value = null;
      if (key === 'challenges' && data.challenges) {
        value = data.challenges;
      } else if (key === 'character-stats' && data.stats) {
        value = data.stats;
      } else if (key === 'kingdom-grid' && data.grid) {
        value = data.grid;
      } else if (key === 'kingdom-tile-timers' && data.timers) {
        value = data.timers;
      } else if (key === 'kingdom-tile-items' && data.items) {
        value = data.items;
      } else if (data.success && data.value !== null) {
        // user-preferences format
        value = data.value;
      }
      
      if (value !== null) {
        console.log(`[Kingdom Data Manager] ✅ Retrieved kingdom data: ${key} from ${endpoint}`);
        return value;
      }
    }
    
    console.log(`[Kingdom Data Manager] ℹ️ No kingdom data found for: ${key} from ${endpoint}`);
    return null;
  } catch (error) {
    console.error(`[Kingdom Data Manager] Error retrieving kingdom data ${key}:`, error);
    return null;
  }
}

// Migrate kingdom data from localStorage to Supabase
export async function migrateKingdomDataToSupabase(): Promise<boolean> {
  try {
    console.log('[Kingdom Data Manager] 🚀 Starting kingdom data migration...');
    
    if (typeof window === 'undefined') {
      console.log('[Kingdom Data Manager] Skipping migration - not in browser');
      return true;
    }

    const migrationKey = 'kingdom-data-migration-complete';
    const migrationDone = localStorage.getItem(migrationKey);
    
    if (migrationDone) {
      console.log('[Kingdom Data Manager] Migration already completed');
      return true;
    }

    const kingdomData: Partial<KingdomData> = {};
    let hasData = false;

    // Kingdom tile timers
    const tileTimers = localStorage.getItem('kingdom-tile-timers');
    if (tileTimers) {
      kingdomData.tileTimers = JSON.parse(tileTimers);
      hasData = true;
    }

    // Kingdom grid state
    const gridState = localStorage.getItem('kingdom-grid');
    if (gridState) {
      kingdomData.gridState = JSON.parse(gridState);
      hasData = true;
    }

    // Kingdom tile items
    const tileItems = localStorage.getItem('kingdom-tile-items');
    if (tileItems) {
      kingdomData.tileItems = JSON.parse(tileItems);
      hasData = true;
    }

    // Challenges data
    const challenges = localStorage.getItem('challenges');
    if (challenges) {
      kingdomData.challenges = JSON.parse(challenges);
      hasData = true;
    }

    // Character stats (used in kingdom context)
    const characterStats = localStorage.getItem('character-stats');
    if (characterStats) {
      kingdomData.characterStats = JSON.parse(characterStats);
      hasData = true;
    }

    if (!hasData) {
      console.log('[Kingdom Data Manager] No kingdom data to migrate');
      localStorage.setItem(migrationKey, 'true');
      return true;
    }

    // Save each piece of data to Supabase
    const savePromises: Promise<boolean>[] = [];

    if (kingdomData.tileTimers) {
      savePromises.push(saveKingdomData('kingdom-tile-timers', kingdomData.tileTimers));
    }

    if (kingdomData.gridState) {
      savePromises.push(saveKingdomData('kingdom-grid', kingdomData.gridState));
    }

    if (kingdomData.tileItems) {
      savePromises.push(saveKingdomData('kingdom-tile-items', kingdomData.tileItems));
    }

    if (kingdomData.challenges) {
      savePromises.push(saveKingdomData('challenges', kingdomData.challenges));
    }

    if (kingdomData.characterStats) {
      savePromises.push(saveKingdomData('character-stats', kingdomData.characterStats));
    }

    // Wait for all saves to complete
    const results = await Promise.all(savePromises);
    const allSuccessful = results.every(result => result);

    if (allSuccessful) {
      console.log('[Kingdom Data Manager] ✅ Kingdom data migration completed successfully');
      localStorage.setItem(migrationKey, 'true');
      
      // Clean up localStorage after successful migration
      const keysToRemove = [
        'kingdom-tile-timers', 'kingdom-grid', 'kingdom-tile-items', 
        'challenges', 'character-stats'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`[Kingdom Data Manager] Could not remove localStorage key: ${key}`, error);
        }
      });
      
      return true;
    } else {
      console.error('[Kingdom Data Manager] ❌ Some kingdom data failed to migrate');
      return false;
    }
  } catch (error) {
    console.error('[Kingdom Data Manager] ❌ Kingdom data migration failed:', error);
    return false;
  }
}

// Sync kingdom data to localStorage as backup
export async function syncKingdomDataToLocalStorage(): Promise<void> {
  try {
    console.log('[Kingdom Data Manager] 🔄 Syncing kingdom data to localStorage...');
    
    const kingdomKeys = [
      'kingdom-tile-timers', 'kingdom-grid', 'kingdom-tile-items', 
      'challenges', 'character-stats'
    ];
    
    for (const key of kingdomKeys) {
      try {
        const value = await getKingdomData(key);
        if (value !== null) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (error) {
        console.warn(`[Kingdom Data Manager] Could not sync key to localStorage: ${key}`, error);
      }
    }
    
    console.log('[Kingdom Data Manager] ✅ Kingdom data synced to localStorage');
  } catch (error) {
    console.error('[Kingdom Data Manager] Error syncing kingdom data to localStorage:', error);
  }
}
