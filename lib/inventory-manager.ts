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
    console.warn('Failed to update inventory cache', e);
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

export interface InventoryItem {
  name: string
  quantity: number
  type: 'resource' | 'item' | 'creature' | 'scroll' | 'equipment' | 'artifact' | 'book' | 'building'
  id: string
  category?: string
  description?: string
  emoji?: string
  image?: string
  stats?: {
    movement?: number
    attack?: number
    defense?: number
  }
  equipped?: boolean
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
      console.warn(`[Inventory Manager] Failed to fetch inventory: ${response.status}`);
      return [];
    }

    const rawData = await response.json();
    const result = InventoryResponseSchema.safeParse(rawData);

    if (result.success) {
      return result.data as InventoryItem[];
    }

    console.warn('[Inventory Manager] Validation failed for inventory data:', result.error);
    return [];
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
}

// Add or update an inventory item
export async function addToInventory(userId: string, item: InventoryItem) {
  if (!userId) return;

  try {
    // Update local cache first for immediate feedback
    updateCachedInventory(item);

    const response = await authenticatedFetch('/api/inventory', {
      method: 'POST',
      body: JSON.stringify({ item }),
    }, 'Add Inventory');

    if (!response) {
      return;
    }

    if (!response.ok) {
      throw new Error(`Failed to add inventory item: ${response.status}`);
    }

    window.dispatchEvent(new Event('character-inventory-update'));
  } catch (error) {
    console.error('Error adding to inventory:', error);
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

    window.dispatchEvent(new Event('character-inventory-update'));
  } catch (error) {
    console.error('Error removing from inventory:', error);
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

    window.dispatchEvent(new Event('character-inventory-update'));
  } catch (error) {
    console.error('Error clearing inventory:', error);
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
    console.error('Error fetching inventory by type:', error);
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
    console.error('Error fetching inventory by category:', error);
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

    window.dispatchEvent(new Event('character-inventory-update'));
    return true;
  } catch (error) {
    console.error('Error equipping item:', error);
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

    window.dispatchEvent(new Event('character-inventory-update'));
    return true;
  } catch (error) {
    console.error('Error unequipping item:', error);
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
    console.error('Error checking for item:', error);
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

    console.warn('[Inventory Manager] getEquippedItems: Unexpected response format:', data);
    return [];
  } catch (error) {
    console.error('Error fetching equipped items:', error);
    return [];
  }
}

// Get stored (non-equipped) items
export async function getStoredItems(userId: string): Promise<InventoryItem[]> {
  if (!userId) return [];

  try {
    const response = await authenticatedFetch('/api/inventory?equipped=false', {}, 'Stored Items');

    if (!response) {
      // Fallback to cache if API skipped (circuit breaker)
      console.warn('[Inventory Manager] API skipped, using cached inventory');
      return getCachedInventory();
    }

    if (!response.ok) {
      // Fallback to cache if API fails
      console.warn('[Inventory Manager] API failed, using cached inventory');
      return getCachedInventory();
    }

    const data = await response.json();

    // Handle API response format: {success: true, data: Array}
    let items: InventoryItem[] = [];
    if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
      items = data.data;
    } else if (Array.isArray(data)) {
      items = data;
    } else {
      console.warn('[Inventory Manager] getStoredItems: Unexpected response format:', data);
      items = [];
    }

    // Update cache with fresh data
    setUserScopedItem('offline-inventory-cache', JSON.stringify(items));
    return items;
  } catch (error) {
    console.error('Error fetching stored items:', error);
    return [];
  }
}

// Calculate total stats from equipped items
export async function getTotalStats(userId: string): Promise<{ movement: number; attack: number; defense: number }> {
  try {
    const equippedItems = await getEquippedItems(userId);

    // Ensure equippedItems is an array
    if (!Array.isArray(equippedItems)) {
      console.warn('[Inventory Manager] getTotalStats: equippedItems is not an array:', equippedItems);
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
          console.warn('[Inventory Manager] getTotalStats: Error processing item:', item, error);
          return totals; // Return unchanged totals on error
        }
      },
      { movement: 0, attack: 0, defense: 0 }
    );
  } catch (error) {
    console.error('[Inventory Manager] getTotalStats: Error:', error);
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