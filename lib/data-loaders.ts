import { loadDataWithFallback, saveDataWithRedundancy } from '@/lib/migration-utils';

// Helper function to get auth token with retry logic
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  // Wait for Clerk to be available
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    try {
      // Try to access Clerk from window
      const clerk = (window as any).__clerk;
      if (!clerk) {
        console.log(`[Data Loaders] Clerk not available on window, attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        continue;
      }

      const session = clerk.session;
      if (!session) {
        console.log(`[Data Loaders] No active Clerk session, attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        continue;
      }

      // Try to get token with supabase template
      const token = await session.getToken({ template: 'supabase' });
      console.log('[Data Loaders] Got Clerk token:', token ? 'present' : 'null');
      return token;
    } catch (error) {
      console.error(`[Data Loaders] Error getting Clerk token (attempt ${attempts + 1}):`, error);
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }
  
  console.error('[Data Loaders] Failed to get Clerk token after all attempts');
  return null;
}

// Helper function to make authenticated API calls
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  console.log('[Data Loaders] Making API call to:', `/api/data${endpoint}`);
  const token = await getAuthToken();
  
  const response = await fetch(`/api/data${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  console.log('[Data Loaders] API response status:', response.status);
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }

  return response.json();
}

// =====================================================
// GRID/MAP DATA LOADERS
// =====================================================

export async function loadGridData(userId: string): Promise<any> {
  console.log('[Data Loaders] loadGridData called for userId:', userId);
  return loadDataWithFallback(
    async () => {
      try {
        const result = await apiCall(`?type=grid&userId=${userId}`);
        console.log('[Data Loaders] loadGridData result:', result);
        return { data: result.data, error: null };
      } catch (error) {
        console.error('[Data Loaders] loadGridData error:', error);
        return { data: null, error };
      }
    },
    'grid',
    null
  );
}

export async function saveGridData(userId: string, gridData: any): Promise<{ success: boolean; error?: string }> {
  return saveDataWithRedundancy(
    async (data) => {
      try {
        await apiCall('', {
          method: 'POST',
          body: JSON.stringify({
            type: 'grid',
            userId,
            data
          })
        });
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    'grid',
    gridData
  );
}

// =====================================================
// CHARACTER POSITION LOADERS
// =====================================================

export async function loadCharacterPosition(userId: string): Promise<{ x: number; y: number } | null> {
  const position = await loadDataWithFallback(
    async () => {
      try {
        const result = await apiCall(`?type=character&userId=${userId}`);
        return { data: result.data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    'characterPosition',
    null
  );

  return position;
}

export async function saveCharacterPosition(userId: string, position: { x: number; y: number }): Promise<{ success: boolean; error?: string }> {
  return saveDataWithRedundancy(
    async (data) => {
      try {
        await apiCall('', {
          method: 'POST',
          body: JSON.stringify({
            type: 'character',
            userId,
            data
          })
        });
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    'characterPosition',
    position
  );
}

// =====================================================
// TILE INVENTORY LOADERS
// =====================================================

export async function loadTileInventory(userId: string): Promise<Record<string, any>> {
  return loadDataWithFallback(
    async () => {
      try {
        const result = await apiCall(`?type=inventory&userId=${userId}`);
        // Convert to the expected format
        const inventory: Record<string, any> = {};
        result.data?.forEach((item: any) => {
          inventory[item.tile_type] = {
            type: item.tile_type,
            quantity: item.quantity,
            cost: item.cost
          };
        });
        return { data: inventory, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    'tileInventory',
    {}
  );
}

export async function saveTileInventory(userId: string, inventory: Record<string, any>): Promise<{ success: boolean; error?: string }> {
  return saveDataWithRedundancy(
    async (data) => {
      try {
        await apiCall('', {
          method: 'POST',
          body: JSON.stringify({
            type: 'inventory',
            userId,
            data
          })
        });
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    'tileInventory',
    inventory
  );
}

// =====================================================
// USER PREFERENCES LOADERS
// =====================================================

export async function loadUserPreferences(userId: string): Promise<Record<string, any>> {
  return loadDataWithFallback(
    async () => {
      try {
        const result = await apiCall(`?type=preferences&userId=${userId}`);
        return { data: result.data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    'userPreferences',
    {}
  );
}

export async function saveUserPreferences(userId: string, preferences: Record<string, any>): Promise<{ success: boolean; error?: string }> {
  return saveDataWithRedundancy(
    async (data) => {
      try {
        await apiCall('', {
          method: 'POST',
          body: JSON.stringify({
            type: 'preferences',
            userId,
            data
          })
        });
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    'userPreferences',
    preferences
  );
}

// =====================================================
// IMAGE DESCRIPTIONS LOADERS
// =====================================================

export async function loadImageDescriptions(userId: string): Promise<Record<string, string>> {
  return loadDataWithFallback(
    async () => {
      try {
        const result = await apiCall(`?type=descriptions&userId=${userId}`);
        return { data: result.data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    'imageDescriptions',
    {}
  );
}

export async function saveImageDescriptions(userId: string, descriptions: Record<string, string>): Promise<{ success: boolean; error?: string }> {
  return saveDataWithRedundancy(
    async (data) => {
      try {
        await apiCall('', {
          method: 'POST',
          body: JSON.stringify({
            type: 'descriptions',
            userId,
            data
          })
        });
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    'imageDescriptions',
    descriptions
  );
}

// =====================================================
// GAME SETTINGS LOADERS
// =====================================================

export async function loadGameSettings(userId: string): Promise<Record<string, any>> {
  return loadDataWithFallback(
    async () => {
      try {
        const result = await apiCall(`?type=settings&userId=${userId}`);
        return { data: result.data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    'gameSettings',
    {}
  );
}

export async function saveGameSettings(userId: string, settings: Record<string, any>): Promise<{ success: boolean; error?: string }> {
  return saveDataWithRedundancy(
    async (data) => {
      try {
        await apiCall('', {
          method: 'POST',
          body: JSON.stringify({
            type: 'settings',
            userId,
            data
          })
        });
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
    'gameSettings',
    settings
  );
}

// =====================================================
// BULK DATA LOADER
// =====================================================

export async function loadAllUserData(userId: string) {
  const [gridData, characterPosition, tileInventory, userPreferences, imageDescriptions, gameSettings] = await Promise.all([
    loadGridData(userId),
    loadCharacterPosition(userId),
    loadTileInventory(userId),
    loadUserPreferences(userId),
    loadImageDescriptions(userId),
    loadGameSettings(userId)
  ]);

  return {
    gridData,
    characterPosition,
    tileInventory,
    userPreferences,
    imageDescriptions,
    gameSettings
  };
} 