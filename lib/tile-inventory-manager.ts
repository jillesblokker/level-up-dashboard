import { supabase } from '@/lib/supabase/client';
import { InventoryItem } from '@/lib/inventory-manager';

export interface TileInventoryItem extends InventoryItem {
  cost?: number;
  connections?: any[];
  rotation?: number;
  last_updated?: string;
  version?: number;
}

export async function getTileInventory(userId: string): Promise<TileInventoryItem[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('tile_inventory')
    .select('*')
    .eq('user_id', userId);
  if (error) {
    console.error('Error fetching tile inventory:', error);
    return [];
  }
  return (data || []).map(row => ({
    ...row,
    id: row.tile_id,
    cost: row.cost,
    connections: row.connections || [],
    rotation: row.rotation,
    last_updated: row.last_updated,
    version: row.version,
    quantity: row.quantity,
    type: row.tile_type,
  }));
}

export async function addTileToInventory(userId: string, tile: TileInventoryItem) {
  if (!userId) return;
  // Check if tile exists
  const { data: existing, error: fetchError } = await supabase
    .from('tile_inventory')
    .select('*')
    .eq('user_id', userId)
    .eq('tile_id', tile.id)
    .single();
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error checking tile inventory:', fetchError);
    return;
  }
  if (existing) {
    // Update quantity
    await supabase
      .from('tile_inventory')
      .update({ quantity: existing.quantity + (tile.quantity || 1) })
      .eq('user_id', userId)
      .eq('tile_id', tile.id);
  } else {
    // Insert new tile
    await supabase
      .from('tile_inventory')
      .insert({
        user_id: userId,
        tile_id: tile.id,
        tile_type: tile.type,
        name: tile.name,
        quantity: tile.quantity || 1,
        cost: tile.cost || 0,
        connections: tile.connections || [],
        rotation: tile.rotation || 0,
        last_updated: new Date().toISOString(),
        version: tile.version || 1,
      });
  }
  window.dispatchEvent(new Event('tile-inventory-update'));
}

export async function removeTileFromInventory(userId: string, tileId: string, quantity: number = 1) {
  if (!userId) return;
  const { data: existing, error: fetchError } = await supabase
    .from('tile_inventory')
    .select('*')
    .eq('user_id', userId)
    .eq('tile_id', tileId)
    .single();
  if (fetchError || !existing) return;
  if (existing.quantity > quantity) {
    await supabase
      .from('tile_inventory')
      .update({ quantity: existing.quantity - quantity })
      .eq('user_id', userId)
      .eq('tile_id', tileId);
  } else {
    await supabase
      .from('tile_inventory')
      .delete()
      .eq('user_id', userId)
      .eq('tile_id', tileId);
  }
  window.dispatchEvent(new Event('tile-inventory-update'));
}

export async function updateTileQuantity(userId: string, tileId: string, quantity: number) {
  if (!userId) return;
  await supabase
    .from('tile_inventory')
    .update({ quantity })
    .eq('user_id', userId)
    .eq('tile_id', tileId);
  window.dispatchEvent(new Event('tile-inventory-update'));
}

export async function clearTileInventory(userId: string) {
  if (!userId) return;
  await supabase
    .from('tile_inventory')
    .delete()
    .eq('user_id', userId);
  window.dispatchEvent(new Event('tile-inventory-update'));
} 