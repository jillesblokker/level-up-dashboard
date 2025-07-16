import { supabase } from '@/lib/supabase/client';

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
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId);
  if (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
  return (data || []).map(row => ({
    ...row,
    id: row.item_id,
    equipped: row.equipped,
    stats: row.stats || {},
  }));
}

// Add or update an inventory item
export async function addToInventory(userId: string, item: InventoryItem) {
  if (!userId) return;
  // Check if item exists
  const { data: existing, error: fetchError } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', item.id)
    .single();
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error checking inventory:', fetchError);
    return;
  }
  if (existing) {
    // Update quantity
    await supabase
      .from('inventory_items')
      .update({ quantity: existing.quantity + item.quantity })
      .eq('user_id', userId)
      .eq('item_id', item.id);
  } else {
    // Insert new item
    await supabase
      .from('inventory_items')
      .insert({
        user_id: userId,
        item_id: item.id,
        name: item.name,
        type: item.type,
        category: item.category,
        description: item.description,
        emoji: item.emoji,
        image: item.image,
        stats: item.stats,
        quantity: item.quantity,
        equipped: item.equipped || false,
        is_default: false,
      });
  }
  window.dispatchEvent(new Event('character-inventory-update'));
}

// Remove quantity or delete item
export async function removeFromInventory(userId: string, itemId: string, quantity: number = 1) {
  if (!userId) return;
  const { data: existing, error: fetchError } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .single();
  if (fetchError || !existing) return;
  if (existing.quantity > quantity) {
    await supabase
      .from('inventory_items')
      .update({ quantity: existing.quantity - quantity })
      .eq('user_id', userId)
      .eq('item_id', itemId);
  } else {
    await supabase
      .from('inventory_items')
      .delete()
      .eq('user_id', userId)
      .eq('item_id', itemId);
  }
  window.dispatchEvent(new Event('character-inventory-update'));
}

export async function clearInventory(userId: string) {
  if (!userId) return;
  await supabase
    .from('inventory_items')
    .delete()
    .eq('user_id', userId);
  window.dispatchEvent(new Event('character-inventory-update'));
}

export async function getInventoryByType(userId: string, type: string): Promise<InventoryItem[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type);
  if (error) {
    console.error('Error fetching inventory by type:', error);
    return [];
  }
  return (data || []).map(row => ({ ...row, id: row.item_id, equipped: row.equipped, stats: row.stats || {} }));
}

export async function getInventoryByCategory(userId: string, category: string): Promise<InventoryItem[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category);
  if (error) {
    console.error('Error fetching inventory by category:', error);
    return [];
  }
  return (data || []).map(row => ({ ...row, id: row.item_id, equipped: row.equipped, stats: row.stats || {} }));
}

export async function getInventoryItem(userId: string, id: string): Promise<InventoryItem | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', id)
    .single();
  if (error) {
    return null;
  }
  return { ...data, id: data.item_id, equipped: data.equipped, stats: data.stats || {} };
}

export async function hasItem(userId: string, itemId: string): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabase
    .from('inventory_items')
    .select('item_id')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .single();
  return !!data;
}

export async function getItemQuantity(userId: string, itemId: string): Promise<number> {
  if (!userId) return 0;
  const { data, error } = await supabase
    .from('inventory_items')
    .select('quantity')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .single();
  if (error || !data) return 0;
  return data.quantity;
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
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .eq('equipped', true);
  if (error) return [];
  return (data || []).map(row => ({ ...row, id: row.item_id, equipped: row.equipped, stats: row.stats || {} }));
}

export async function getStoredItems(userId: string): Promise<InventoryItem[]> {
  const allItems = await getKingdomInventory(userId);
  const equippedItems = await getEquippedItems(userId);
  return allItems.filter(item => !equippedItems.some(equipped => equipped.id === item.id));
}

export async function equipItem(userId: string, itemId: string): Promise<boolean> {
  if (!userId) return false;
  // Find the item
  const { data: item, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .single();
  if (error || !item) return false;
  // Unequip any existing item of the same category
  if (item.category) {
    await supabase
      .from('inventory_items')
      .update({ equipped: false })
      .eq('user_id', userId)
      .eq('category', item.category)
      .eq('equipped', true);
  }
  // Equip the new item
  await supabase
    .from('inventory_items')
    .update({ equipped: true })
    .eq('user_id', userId)
    .eq('item_id', itemId);
  window.dispatchEvent(new Event('character-inventory-update'));
  return true;
}

export async function unequipItem(userId: string, itemId: string): Promise<boolean> {
  if (!userId) return false;
  await supabase
    .from('inventory_items')
    .update({ equipped: false })
    .eq('user_id', userId)
    .eq('item_id', itemId);
  window.dispatchEvent(new Event('character-inventory-update'));
  return true;
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