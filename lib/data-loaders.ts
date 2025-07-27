import { loadDataWithFallback, saveDataWithRedundancy } from '@/lib/migration-utils';

// Helper function to get auth token
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  // Get the token from localStorage or wherever it's stored
  // This is a simplified version - you might need to adjust based on your auth setup
  return localStorage.getItem('auth-token') || null;
}

// Helper function to make authenticated API calls
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAuthToken();
  
  const response = await fetch(`/api/data${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }

  return response.json();
}

// =====================================================
// GRID/MAP DATA LOADERS
// =====================================================

export async function loadGridData(userId: string): Promise<any> {
  return loadDataWithFallback(
    async () => {
      try {
        const result = await apiCall(`?type=grid&userId=${userId}`);
        return { data: result.data, error: null };
      } catch (error) {
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
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preference_key, preference_value')
        .eq('user_id', userId);
      
      if (error) return { data: null, error };
      
      // Convert to the expected format
      const preferences: Record<string, any> = {};
      data?.forEach(item => {
        preferences[item.preference_key] = item.preference_value;
      });
      
      return { data: preferences, error: null };
    },
    'userPreferences',
    {}
  );
}

export async function saveUserPreferences(userId: string, preferences: Record<string, any>): Promise<{ success: boolean; error?: string }> {
  return saveDataWithRedundancy(
    async (data) => {
      const items = Object.entries(data).map(([key, value]) => ({
        user_id: userId,
        preference_key: key,
        preference_value: value
      }));

      if (items.length > 0) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert(items, { onConflict: 'user_id,preference_key' });

        return { error };
      }

      return { error: null };
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
      const { data, error } = await supabase
        .from('image_descriptions')
        .select('image_path, description')
        .eq('user_id', userId);
      
      if (error) return { data: null, error };
      
      // Convert to the expected format
      const descriptions: Record<string, string> = {};
      data?.forEach(item => {
        descriptions[item.image_path] = item.description || '';
      });
      
      return { data: descriptions, error: null };
    },
    'imageDescriptions',
    {}
  );
}

export async function saveImageDescriptions(userId: string, descriptions: Record<string, string>): Promise<{ success: boolean; error?: string }> {
  return saveDataWithRedundancy(
    async (data) => {
      const items = Object.entries(data).map(([imagePath, description]) => ({
        user_id: userId,
        image_path: imagePath,
        description: description
      }));

      if (items.length > 0) {
        const { error } = await supabase
          .from('image_descriptions')
          .upsert(items, { onConflict: 'user_id,image_path' });

        return { error };
      }

      return { error: null };
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
      const { data, error } = await supabase
        .from('game_settings')
        .select('setting_key, setting_value')
        .eq('user_id', userId);
      
      if (error) return { data: null, error };
      
      // Convert to the expected format
      const settings: Record<string, any> = {};
      data?.forEach(item => {
        settings[item.setting_key] = item.setting_value;
      });
      
      return { data: settings, error: null };
    },
    'gameSettings',
    {}
  );
}

export async function saveGameSettings(userId: string, settings: Record<string, any>): Promise<{ success: boolean; error?: string }> {
  return saveDataWithRedundancy(
    async (data) => {
      const items = Object.entries(data).map(([key, value]) => ({
        user_id: userId,
        setting_key: key,
        setting_value: value
      }));

      if (items.length > 0) {
        const { error } = await supabase
          .from('game_settings')
          .upsert(items, { onConflict: 'user_id,setting_key' });

        return { error };
      }

      return { error: null };
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