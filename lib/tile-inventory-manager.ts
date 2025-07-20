import { InventoryItem } from '@/lib/inventory-manager';
import { authenticatedFetch } from './auth-helpers';

export interface TileInventoryItem extends InventoryItem {
  cost?: number;
  connections?: any[];
  rotation?: number;
  last_updated?: string;
  version?: number;
}

export async function getTileInventory(userId: string): Promise<TileInventoryItem[]> {
  if (!userId) return [];
  
  try {
    const response = await authenticatedFetch('/api/tile-inventory', {}, 'Tile Inventory');
    
    if (!response) {
      return [];
    }

    if (!response.ok) {
      console.error('[Tile Inventory] Failed to fetch tile inventory:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('[Tile Inventory] Error fetching tile inventory:', error);
    return [];
  }
}

export async function addTileToInventory(userId: string, tile: TileInventoryItem) {
  if (!userId) return;
  
  try {
    const response = await authenticatedFetch('/api/tile-inventory', {
      method: 'POST',
      body: JSON.stringify({ tile }),
    }, 'Add Tile Inventory');

    if (!response) {
      return;
    }

    if (!response.ok) {
      console.error('[Tile Inventory] Failed to add tile to inventory:', response.status, response.statusText);
      return;
    }

    // Dispatch event to notify components
    window.dispatchEvent(new Event('tile-inventory-update'));
  } catch (error) {
    console.error('[Tile Inventory] Error adding tile to inventory:', error);
  }
}

export async function removeTileFromInventory(userId: string, tileId: string, quantity: number = 1) {
  if (!userId) return;
  
  try {
    const response = await authenticatedFetch(`/api/tile-inventory?tileId=${encodeURIComponent(tileId)}&quantity=${quantity}`, {
      method: 'DELETE',
    }, 'Remove Tile Inventory');

    if (!response) {
      return;
    }

    if (!response.ok) {
      console.error('[Tile Inventory] Failed to remove tile from inventory:', response.status, response.statusText);
      return;
    }

    // Dispatch event to notify components
    window.dispatchEvent(new Event('tile-inventory-update'));
  } catch (error) {
    console.error('[Tile Inventory] Error removing tile from inventory:', error);
  }
}

export async function updateTileInInventory(userId: string, tileId: string, updates: Partial<TileInventoryItem>) {
  // For now, we'll implement this as remove + add since the API doesn't have a dedicated update endpoint
  // This could be optimized later by adding a PATCH endpoint
  console.log('[Tile Inventory] updateTileInInventory called, but not fully implemented yet');
}

// Legacy functions for backward compatibility - these now use the API routes
export { getTileInventory as getTileInventoryFromSupabase };
export { addTileToInventory as addTileToSupabaseInventory };
export { removeTileFromInventory as removeTileFromSupabaseInventory }; 