import { InventoryItem } from '@/types/core-interfaces';
export type { InventoryItem };
import { logger } from "@/lib/logger";
import { authenticatedFetch } from './auth-helpers';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { z } from 'zod';
import { getUserScopedItem, setUserScopedItem } from './user-scoped-storage';

// Helper to update cached inventory
function updateCachedInventory(item: InventoryItem) {
  try {
    const cachedJson = getUserScopedItem('offline-inventory-cache');
    let cached: InventoryItem[] = cachedJson ? JSON.parse(cachedJson) : [];

    // Check if item exists
    const existingIndex = cached.findIndex(i => i.id === item.id || (i.id === item.id.replace('-item', '')));

    if (existingIndex >= 0) {
      const existing = cached[existingIndex];
      if (existing) {
        cached[existingIndex] = { ...existing, quantity: (existing.quantity || 0) + item.quantity } as InventoryItem;
      }
    } else {
      cached.push(item);
    }

    setUserScopedItem('offline-inventory-cache', JSON.stringify(cached));
  } catch (e) {
    logger.warn('Failed to update inventory cache', e);
  }
}

// Helper to get cached inventory
function getCachedInventory(): InventoryItem[] {
  try {
    const cachedJson = getUserScopedItem('offline-inventory-cache');
    return cachedJson ? JSON.parse(cachedJson) : [];
  } catch (e) {
    return [];
  }
}


// Zod Schema for robust runtime validation
const InventoryResponseSchema = z.union([
  z.array(z.any()),
  z.object({ data: z.array(z.any()) }).transform(d => d.data)
]);

// Fetch all inventory items for the given user
export async function getInventory(userId: string): Promise<InventoryItem[]> {
  if (!userId) return [];

  try {
    const response = await fetchWithAuth('/api/inventory');

    if (!response.ok) {
      logger.warn(`[Inventory Manager] Failed to fetch inventory: ${response.status}`);
      return [];
    }

    const rawData = await response.json();
    const result = InventoryResponseSchema.safeParse(rawData);

    if (result.success) {
      return result.data as InventoryItem[];
    }

    logger.warn('[Inventory Manager] Validation failed for inventory data:', result.error);
    return [];
  } catch (error) {
    logger.error('Error fetching inventory:', error);
    return [];
  }
}

// Add or update an inventory item
export async function addToInventory(userId: string, partialItem: Partial<InventoryItem>) {
  if (!userId) {
    logger.error('[Inventory Manager] addToInventory called without userId!');
    return;
  }

  // Ensure item has required fields or defaults
  const item: InventoryItem = {
    id: partialItem.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: partialItem.name || 'Unknown Item',
    description: partialItem.description || 'A mysterious item found in your travels.',
    type: partialItem.type || 'item',
    category: partialItem.category || partialItem.type || 'item',
    stats: partialItem.stats || {},
    emoji: partialItem.emoji || '📦',
    quantity: partialItem.quantity || 1,
    image: partialItem.image || '/images/items/item-placeholder.webp',
    rarity: partialItem.rarity || 'common',
    ...partialItem
  } as InventoryItem;

  try {
    // Update local cache first for immediate feedback
    updateCachedInventory(item);
    logger.debug('[Inventory Manager] Added to cache:', item.id, item.name);

    const response = await authenticatedFetch('/api/inventory', {
      method: 'POST',
      body: JSON.stringify({ item }),
    }, 'Add Inventory');

    if (!response) {
      logger.error(`[Inventory Manager] Request for ${item.name} (${item.id}) was skipped by circuit breaker or failed authentication.`);
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[Inventory Manager] Failed to save ${item.name} to database: ${response.status}`, errorText);
      throw new Error(`Failed to add inventory item: ${response.status}`);
    }

    logger.debug('[Inventory Manager] Successfully saved to database:', item.id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('character-inventory-update'));
    }
  } catch (error) {
    logger.error('[Inventory Manager] Error adding to inventory:', error);
  }
}

// Remove quantity or delete item
export async function removeFromInventory(userId: string, itemId: string, quantity: number = 1) {
  if (!userId) return;

  try {
    // Update local cache
    removeCachedInventoryItem(itemId, quantity);

    const response = await authenticatedFetch('/api/inventory', {
      method: 'DELETE',
      body: JSON.stringify({ itemId, quantity }),
    }, 'Remove Inventory');

    if (!response) {
      return;
    }

    if (!response.ok) {
      throw new Error(`Failed to remove inventory item: ${response.status}`);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('character-inventory-update'));
    }
  } catch (error) {
    logger.error('Error removing from inventory:', error);
  }
}

// Helper to remove from cache
function removeCachedInventoryItem(itemId: string, quantity: number) {
  try {
    const cachedJson = getUserScopedItem('offline-inventory-cache');
    let cached: InventoryItem[] = cachedJson ? JSON.parse(cachedJson) : [];

    const existingIndex = cached.findIndex(i => i.id === itemId);
    if (existingIndex >= 0) {
      const existing = cached[existingIndex];
      if (existing) {
        existing.quantity -= quantity;
        if (existing.quantity <= 0) {
          cached.splice(existingIndex, 1);
        }
        setUserScopedItem('offline-inventory-cache', JSON.stringify(cached));
      }
    }
  } catch (e) { }
}

export async function clearInventory(userId: string) {
  if (!userId) return;

  try {
    const response = await authenticatedFetch('/api/inventory', {
      method: 'DELETE',
      body: JSON.stringify({ clearAll: true }),
    }, 'Clear Inventory');

    if (!response) {
      return;
    }

    if (!response.ok) {
      throw new Error(`Failed to clear inventory: ${response.status}`);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('character-inventory-update'));
    }
  } catch (error) {
    logger.error('Error clearing inventory:', error);
  }
}

export async function getInventoryByType(userId: string, type: string): Promise<InventoryItem[]> {
  if (!userId) return [];

  try {
    const response = await authenticatedFetch(`/api/inventory?type=${encodeURIComponent(type)}`, {}, 'Inventory By Type');

    if (!response) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch inventory by type: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching inventory by type:', error);
    return [];
  }
}

export async function getInventoryByCategory(userId: string, category: string): Promise<InventoryItem[]> {
  if (!userId) return [];

  try {
    const response = await authenticatedFetch(`/api/inventory?category=${encodeURIComponent(category)}`, {}, 'Inventory By Category');

    if (!response) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch inventory by category: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching inventory by category:', error);
    return [];
  }
}

export async function equipItem(userId: string, itemId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const response = await authenticatedFetch('/api/inventory', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'equip', itemId }),
    }, 'Equip Item');

    if (!response) {
      return false;
    }

    if (!response.ok) {
      throw new Error(`Failed to equip item: ${response.status}`);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('character-inventory-update'));
    }
    return true;
  } catch (error) {
    logger.error('Error equipping item:', error);
    return false;
  }
}

export async function unequipItem(userId: string, itemId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const response = await authenticatedFetch('/api/inventory', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'unequip', itemId }),
    }, 'Unequip Item');

    if (!response) {
      return false;
    }

    if (!response.ok) {
      throw new Error(`Failed to unequip item: ${response.status}`);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('character-inventory-update'));
    }
    return true;
  } catch (error) {
    logger.error('Error unequipping item:', error);
    return false;
  }
}

// Check if user has specific item
export async function hasItem(userId: string, itemId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const response = await authenticatedFetch(`/api/inventory?itemId=${encodeURIComponent(itemId)}`, {}, 'Has Item Check');

    if (!response) {
      return false;
    }

    if (!response.ok) {
      return false;
    }

    const item = await response.json();
    return !!item;
  } catch (error) {
    logger.error('Error checking for item:', error);
    return false;
  }
}

// Get equipped items: filter inventory_items where equipped = true
export async function getEquippedItems(userId: string): Promise<InventoryItem[]> {
  if (!userId) return [];

  try {
    const response = await authenticatedFetch('/api/inventory?equipped=true', {}, 'Equipped Items');

    if (!response) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch equipped items: ${response.status}`);
    }

    const data = await response.json();

    // Handle API response format: {success: true, data: Array}
    if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
      return data.data;
    }

    // Handle direct array response
    if (Array.isArray(data)) {
      return data;
    }

    logger.warn('[Inventory Manager] getEquippedItems: Unexpected response format:', data);
    return [];
  } catch (error) {
    logger.error('Error fetching equipped items:', error);
    return [];
  }
}

// Get stored (non-equipped) items
export async function getStoredItems(userId: string): Promise<InventoryItem[]> {
  if (!userId) return [];

  const cached = getCachedInventory();

  try {
    const response = await authenticatedFetch('/api/inventory?equipped=false', {}, 'Stored Items');

    if (!response) {
      // Fallback to cache if API skipped (circuit breaker)
      logger.warn('[Inventory Manager] API skipped, using cached inventory');
      return cached;
    }

    if (!response.ok) {
      // Fallback to cache if API fails
      logger.warn('[Inventory Manager] API failed, using cached inventory');
      return cached;
    }

    const data = await response.json();

    // Handle API response format: {success: true, data: Array}
    let items: InventoryItem[] = [];
    if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
      items = data.data;
    } else if (Array.isArray(data)) {
      items = data;
    } else {
      logger.warn('[Inventory Manager] getStoredItems: Unexpected response format:', data);
      return cached; // Return cache on unexpected format
    }

    // Only update cache if we got actual data from API
    // If API returned empty but cache has items, we keep the cache
    if (items.length > 0) {
      setUserScopedItem('offline-inventory-cache', JSON.stringify(items));
      return items;
    } else if (cached.length > 0) {
      // API returned empty, but we have cached items - something might be wrong with the API
      // Return cached items but don't overwrite the cache
      logger.warn('[Inventory Manager] API returned empty but cache has items, using cache');
      return cached;
    }

    // Both empty
    return items;
  } catch (error) {
    logger.error('Error fetching stored items:', error);
    // Return cache on any error
    return cached;
  }
}

// Calculate total stats from equipped items
export async function getTotalStats(userId: string): Promise<{ movement: number; attack: number; defense: number }> {
  try {
    const equippedItems = await getEquippedItems(userId);

    // Ensure equippedItems is an array
    if (!Array.isArray(equippedItems)) {
      logger.warn('[Inventory Manager] getTotalStats: equippedItems is not an array:', equippedItems);
      return { movement: 0, attack: 0, defense: 0 };
    }

    return equippedItems.reduce(
      (totals, item) => {
        try {
          const stats = item?.stats || {};
          return {
            movement: totals.movement + (stats.movement || 0),
            attack: totals.attack + (stats.attack || 0),
            defense: totals.defense + (stats.defense || 0),
          };
        } catch (error) {
          logger.warn('[Inventory Manager] getTotalStats: Error processing item:', item, error);
          return totals; // Return unchanged totals on error
        }
      },
      { movement: 0, attack: 0, defense: 0 }
    );
  } catch (error) {
    logger.error('[Inventory Manager] getTotalStats: Error:', error);
    return { movement: 0, attack: 0, defense: 0 };
  }
}

// Filter items by whether they can be equipped
export function isEquippable(item: InventoryItem): boolean {
  return item.type === 'equipment' || item.type === 'artifact';
}

// Kingdom inventory wrapper functions (for backwards compatibility)
export async function getKingdomInventory(userId: string): Promise<InventoryItem[]> {
  return getInventory(userId);
}

export async function addToKingdomInventory(userId: string, item: InventoryItem) {
  await addToInventory(userId, item);
}

export async function removeFromKingdomInventory(userId: string, itemId: string, quantity: number = 1) {
  await removeFromInventory(userId, itemId, quantity);
} 