// Helper to get Clerk token
async function getClerkToken(): Promise<string> {
  if (typeof window !== 'undefined') {
    try {
      // Try multiple approaches to get the Clerk token
      const clerkInstance = (window as any).Clerk;
      
      if (!clerkInstance) {
        console.warn('[Clerk Token] Clerk instance not found on window');
        return '';
      }

      // Check if user is signed in
      if (!clerkInstance.user) {
        console.warn('[Clerk Token] No user signed in');
        return '';
      }

      // Get the token from the session
      const session = clerkInstance.session;
      if (!session) {
        console.warn('[Clerk Token] No active session');
        return '';
      }

      const token = await session.getToken();
      
      if (!token) {
        console.warn('[Clerk Token] Failed to get token from session');
        return '';
      }

      console.log('[Clerk Token] Successfully retrieved token:', token.slice(0, 20) + '...');
      return token;
    } catch (error) {
      console.error('[Clerk Token] Error getting Clerk token:', error);
      return '';
    }
  }
  console.warn('[Clerk Token] Not in browser environment');
  return '';
}

export interface InventoryItem {
  name: string
  quantity: number
  type: 'resource' | 'item' | 'creature' | 'scroll' | 'equipment' | 'artifact' | 'book'
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

// Fetch all inventory items for the given user
export async function getInventory(userId: string): Promise<InventoryItem[]> {
  if (!userId) return [];
  
  try {
    const token = await getClerkToken();
    const response = await fetch(`/api/inventory`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
}

// Add or update an inventory item
export async function addToInventory(userId: string, item: InventoryItem) {
  if (!userId) return;
  
  try {
    const token = await getClerkToken();
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ item }),
    });
    
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
    const token = await getClerkToken();
    const response = await fetch('/api/inventory', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId, quantity }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to remove inventory item: ${response.status}`);
    }
    
    window.dispatchEvent(new Event('character-inventory-update'));
  } catch (error) {
    console.error('Error removing from inventory:', error);
  }
}

export async function clearInventory(userId: string) {
  if (!userId) return;
  
  try {
    const token = await getClerkToken();
    const response = await fetch('/api/inventory', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clearAll: true }),
    });
    
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
    const token = await getClerkToken();
    const response = await fetch(`/api/inventory?type=${encodeURIComponent(type)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
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
    const token = await getClerkToken();
    const response = await fetch(`/api/inventory?category=${encodeURIComponent(category)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory by category: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching inventory by category:', error);
    return [];
  }
}

export async function getInventoryItem(userId: string, id: string): Promise<InventoryItem | null> {
  if (!userId) return null;
  
  try {
    const token = await getClerkToken();
    const response = await fetch(`/api/inventory?itemId=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch inventory item: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return null;
  }
}

export async function hasItem(userId: string, itemId: string): Promise<boolean> {
  if (!userId) return false;
  
  const item = await getInventoryItem(userId, itemId);
  return !!item;
}

export async function getItemQuantity(userId: string, itemId: string): Promise<number> {
  if (!userId) return 0;
  
  const item = await getInventoryItem(userId, itemId);
  return item?.quantity || 0;
}

// For kingdom inventory, use the same inventory_items table but filter by type/category if needed
export async function getKingdomInventory(userId: string): Promise<InventoryItem[]> {
  return getInventory(userId);
}

export async function addToKingdomInventory(userId: string, item: InventoryItem) {
  await addToInventory(userId, item);
}

export async function removeFromKingdomInventory(userId: string, itemId: string, quantity: number = 1) {
  await removeFromInventory(userId, itemId, quantity);
}

// Equipped items: filter inventory_items where equipped = true
export async function getEquippedItems(userId: string): Promise<InventoryItem[]> {
  if (!userId) return [];
  
  try {
    const token = await getClerkToken();
    const response = await fetch(`/api/inventory?equipped=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch equipped items: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching equipped items:', error);
    return [];
  }
}

export async function getStoredItems(userId: string): Promise<InventoryItem[]> {
  const allItems = await getKingdomInventory(userId);
  const equippedItems = await getEquippedItems(userId);
  return allItems.filter(item => !equippedItems.some(equipped => equipped.id === item.id));
}

export async function equipItem(userId: string, itemId: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const token = await getClerkToken();
    const response = await fetch('/api/inventory', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'equip', itemId }),
    });
    
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
    const token = await getClerkToken();
    const response = await fetch('/api/inventory', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'unequip', itemId }),
    });
    
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

export async function getTotalStats(userId: string): Promise<{ movement: number; attack: number; defense: number }> {
  const equippedItems = await getEquippedItems(userId);
  return equippedItems.reduce((total, item) => {
    if (item.stats) {
      total.movement += item.stats.movement || 0;
      total.attack += item.stats.attack || 0;
      total.defense += item.stats.defense || 0;
    }
    return total;
  }, { movement: 0, attack: 0, defense: 0 });
} 