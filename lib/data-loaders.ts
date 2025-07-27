import { supabase } from '@/lib/supabase/client';
import { loadDataWithFallback, saveDataWithRedundancy } from '@/lib/migration-utils';

// =====================================================
// GRID/MAP DATA LOADERS
// =====================================================

export async function loadGridData(userId: string): Promise<any> {
  return loadDataWithFallback(
    async () => {
      const { data, error } = await supabase
        .from('realm_grids')
        .select('grid_data')
        .eq('user_id', userId)
        .eq('is_current', true)
        .single();
      
      return { data: data?.grid_data || null, error };
    },
    'grid',
    null
  );
}

export async function saveGridData(userId: string, gridData: any): Promise<{ success: boolean; error?: string }> {
  return saveDataWithRedundancy(
    async (data) => {
      // Mark all existing grids as not current
      await supabase
        .from('realm_grids')
        .update({ is_current: false })
        .eq('user_id', userId);

      // Insert new grid data
      const { error } = await supabase
        .from('realm_grids')
        .insert({
          user_id: userId,
          grid_data: data,
          is_current: true
        });

      return { error };
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
      const { data, error } = await supabase
        .from('character_positions')
        .select('position_x, position_y')
        .eq('user_id', userId)
        .single();
      
      return { 
        data: data ? { x: data.position_x, y: data.position_y } : null, 
        error 
      };
    },
    'characterPosition',
    null
  );

  return position;
}

export async function saveCharacterPosition(userId: string, position: { x: number; y: number }): Promise<{ success: boolean; error?: string }> {
  return saveDataWithRedundancy(
    async (data) => {
      const { error } = await supabase
        .from('character_positions')
        .upsert({
          user_id: userId,
          position_x: data.x,
          position_y: data.y,
          last_moved_at: new Date().toISOString()
        });

      return { error };
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
      const { data, error } = await supabase
        .from('tile_inventory')
        .select('*')
        .eq('user_id', userId);
      
      if (error) return { data: null, error };
      
      // Convert to the expected format
      const inventory: Record<string, any> = {};
      data?.forEach(item => {
        inventory[item.tile_id] = {
          type: item.tile_type,
          quantity: item.quantity,
          cost: item.cost,
          connections: item.connections || [],
          rotation: item.rotation
        };
      });
      
      return { data: inventory, error: null };
    },
    'tileInventory',
    {}
  );
}

export async function saveTileInventory(userId: string, inventory: Record<string, any>): Promise<{ success: boolean; error?: string }> {
  return saveDataWithRedundancy(
    async (data) => {
      // Clear existing inventory
      await supabase
        .from('tile_inventory')
        .delete()
        .eq('user_id', userId);

      // Insert new inventory items
      const items = Object.entries(data).map(([tileId, item]) => ({
        user_id: userId,
        tile_id: tileId,
        tile_type: item.type,
        quantity: item.quantity || 1,
        cost: item.cost || 0,
        connections: item.connections || [],
        rotation: item.rotation || 0
      }));

      if (items.length > 0) {
        const { error } = await supabase
          .from('tile_inventory')
          .insert(items);

        return { error };
      }

      return { error: null };
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