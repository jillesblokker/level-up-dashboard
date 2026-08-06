import { logger } from "@/lib/logger";
import { Tile } from '@/types/core-interfaces';
import { fetchWithAuth } from './fetchWithAuth';

export async function getTileInventory(userId: string): Promise<Tile[]> {
    if (!userId) return [];

    try {
        const response = await fetchWithAuth('/api/tile-inventory');

        if (!response || !response.ok) {
            logger.error('[Tile Inventory] Failed to fetch tile inventory:', response?.status);
            return [];
        }

        const data = await response.json();
        return data || [];
    } catch (error) {
        logger.error('[Tile Inventory] Error fetching tile inventory:', error);
        return [];
    }
}

export async function addTileToInventory(userId: string, tile: Partial<Tile>) {
    if (!userId) {
        logger.error('[Tile Inventory Manager] No userId provided');
        return;
    }

    try {
        const response = await fetchWithAuth('/api/tile-inventory', {
            method: 'POST',
            body: JSON.stringify({ tile }),
        });

        if (!response || !response.ok) {
            logger.error('[Tile Inventory Manager] Failed to add tile to inventory:', response?.status);
            return;
        }

        // Dispatch events to notify all kingdom UI components
        window.dispatchEvent(new Event('tile-inventory-update'));
        window.dispatchEvent(new Event('character-stats-update'));
    } catch (error) {
        logger.error('[Tile Inventory] Error adding tile to inventory:', error);
    }
}

export async function removeTileFromInventory(userId: string, tileId: string, quantity: number = 1) {
    if (!userId) return;

    try {
        const response = await fetchWithAuth(`/api/tile-inventory?tileId=${encodeURIComponent(tileId)}&quantity=${quantity}`, {
            method: 'DELETE',
        });

        if (!response || !response.ok) {
            logger.error('[Tile Inventory] Failed to remove tile from inventory:', response?.status);
            return;
        }

        // Dispatch events to notify all kingdom UI components
        window.dispatchEvent(new Event('tile-inventory-update'));
        window.dispatchEvent(new Event('character-stats-update'));
    } catch (error) {
        logger.error('[Tile Inventory] Error removing tile from inventory:', error);
    }
}

export async function updateTileInInventory(userId: string, tileId: string, updates: Partial<Tile>) {
    // Legacy placeholder
}

// Legacy functions for backward compatibility
export { getTileInventory as getTileInventoryFromSupabase };
export { addTileToInventory as addTileToSupabaseInventory };
export { removeTileFromInventory as removeTileFromSupabaseInventory };
