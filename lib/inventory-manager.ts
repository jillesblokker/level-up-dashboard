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

const INVENTORY_KEY = 'character-inventory'
const KINGDOM_INVENTORY_KEY = 'kingdom-inventory'
const EQUIPPED_ITEMS_KEY = 'kingdom-equipped-items'

export function getInventory(): InventoryItem[] {
  if (typeof window === 'undefined') return []
  
  const savedInventory = localStorage.getItem(INVENTORY_KEY)
  if (!savedInventory) return []
  
  try {
    return JSON.parse(savedInventory)
  } catch (err) {
    console.error('Error parsing inventory:', err)
    localStorage.removeItem(INVENTORY_KEY)
    return []
  }
}

export function addToInventory(item: InventoryItem) {
  if (typeof window === 'undefined') return
  
  const currentInventory = getInventory()
  const existingItem = currentInventory.find(i => i.id === item.id)
  
  if (existingItem) {
    existingItem.quantity += item.quantity
  } else {
    currentInventory.push(item)
  }
  
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(currentInventory))
  window.dispatchEvent(new Event('character-inventory-update'))
}

export function removeFromInventory(itemId: string, quantity: number = 1) {
  if (typeof window === 'undefined') return
  
  const currentInventory = getInventory()
  const itemIndex = currentInventory.findIndex(i => i.id === itemId)
  
  if (itemIndex === -1) return
  
  const item = currentInventory[itemIndex]!
  item.quantity -= quantity
  
  if (item.quantity <= 0) {
    currentInventory.splice(itemIndex, 1)
  }
  
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(currentInventory))
  window.dispatchEvent(new Event('character-inventory-update'))
}

export function clearInventory() {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem(INVENTORY_KEY)
  window.dispatchEvent(new Event('character-inventory-update'))
}

export function getInventoryByType(type: string): InventoryItem[] {
  try {
    const inventory = getInventory()
    return inventory.filter(item => item.type === type)
  } catch (error) {
    console.error("Error getting inventory by type:", error)
    return []
  }
}

export function getInventoryByCategory(category: string): InventoryItem[] {
  try {
    const inventory = getInventory()
    return inventory.filter(item => item.category === category)
  } catch (error) {
    console.error("Error getting inventory by category:", error)
    return []
  }
}

export function getInventoryItem(id: string): InventoryItem | null {
  try {
    const inventory = getInventory()
    return inventory.find(item => item.id === id) || null
  } catch (error) {
    console.error("Error getting inventory item:", error)
    return null
  }
}

export function hasItem(itemId: string): boolean {
  const inventory = getInventory()
  return inventory.some(item => item.id === itemId)
}

export function getItemQuantity(itemId: string): number {
  const inventory = getInventory()
  const item = inventory.find(i => i.id === itemId)
  return item?.quantity || 0
}

export function getKingdomInventory(): InventoryItem[] {
  if (typeof window === 'undefined') return []
  
  const savedInventory = localStorage.getItem(KINGDOM_INVENTORY_KEY)
  let inventory: InventoryItem[] = []
  if (savedInventory) {
    try {
      inventory = JSON.parse(savedInventory)
    } catch (err) {
      console.error('Error parsing kingdom inventory:', err)
      localStorage.removeItem(KINGDOM_INVENTORY_KEY)
      inventory = []
    }
  }

  // Only add default items if inventory is empty
  if (inventory.length === 0) {
    inventory = getDefaultKingdomInventory()
    localStorage.setItem(KINGDOM_INVENTORY_KEY, JSON.stringify(inventory))
    
    // Auto-equip default items on first load
    const defaultItems = getDefaultKingdomInventory()
    const equippedItems = defaultItems.map(item => ({ ...item, equipped: true }))
    localStorage.setItem(EQUIPPED_ITEMS_KEY, JSON.stringify(equippedItems))
  }

  return inventory
}

export function addToKingdomInventory(item: InventoryItem) {
  if (typeof window === 'undefined') return
  
  const currentInventory = getKingdomInventory()
  const existingItem = currentInventory.find(i => i.id === item.id)
  
  if (existingItem) {
    existingItem.quantity += item.quantity
  } else {
    // Get default inventory items
    const defaultInventory = getDefaultKingdomInventory()
    const defaultItem = defaultInventory.find(i => i.id === item.id)
    
    if (defaultItem) {
      // If item exists in default inventory, add to its quantity
      const existingDefaultItem = currentInventory.find(i => i.id === defaultItem.id)
      if (existingDefaultItem) {
        existingDefaultItem.quantity += item.quantity
      } else {
        currentInventory.push({
          ...defaultItem,
          quantity: item.quantity
        })
      }
    } else {
      // If item doesn't exist in default inventory, add it as new
      currentInventory.push(item)
    }
  }
  
  localStorage.setItem(KINGDOM_INVENTORY_KEY, JSON.stringify(currentInventory))
  window.dispatchEvent(new Event('character-inventory-update'))
}

// Helper function to get default kingdom inventory
function getDefaultKingdomInventory(): InventoryItem[] {
  return [
    {
      id: "stelony",
      name: "Stelony",
      type: "creature",
      quantity: 1,
      description: "A sturdy pony with basic armor - your trusty starter mount",
      emoji: "🐴",
      image: "/images/items/horse/horse-stelony.png",
      category: "mount",
      stats: { movement: 5 },
    },
    {
      id: "twig",
      name: "Twig",
      type: "item",
      quantity: 1,
      description: "A simple wooden sword - every adventurer starts somewhere",
      emoji: "🪵",
      image: "/images/items/sword/sword-twig.png",
      category: "weapon",
      stats: { attack: 2 },
    },
    {
      id: "reflecto",
      name: "Reflecto",
      type: "item",
      quantity: 1,
      description: "A basic wooden shield - it may not look like much, but it gets the job done",
      emoji: "🛡️",
      image: "/images/items/shield/shield-reflecto.png",
      category: "shield",
      stats: { defense: 2 },
    },
    {
      id: "normalo",
      name: "Normalo",
      type: "item",
      quantity: 1,
      description: "Standard issue armor for new adventurers",
      emoji: "🥋",
      image: "/images/items/armor/armor-normalo.png",
      category: "armor",
      stats: { defense: 1 },
    }
  ]
}

export function getEquippedItems(): InventoryItem[] {
  if (typeof window === 'undefined') return []
  
  const savedEquipped = localStorage.getItem(EQUIPPED_ITEMS_KEY)
  if (!savedEquipped) {
    // If no equipped items are saved, auto-equip default items
    const defaultItems = getDefaultKingdomInventory()
    const equippedItems = defaultItems.map(item => ({ ...item, equipped: true }))
    localStorage.setItem(EQUIPPED_ITEMS_KEY, JSON.stringify(equippedItems))
    return equippedItems
  }
  
  try {
    return JSON.parse(savedEquipped)
  } catch (err) {
    console.error('Error parsing equipped items:', err)
    localStorage.removeItem(EQUIPPED_ITEMS_KEY)
    // Auto-equip default items if there's an error
    const defaultItems = getDefaultKingdomInventory()
    const equippedItems = defaultItems.map(item => ({ ...item, equipped: true }))
    localStorage.setItem(EQUIPPED_ITEMS_KEY, JSON.stringify(equippedItems))
    return equippedItems
  }
}

export function getStoredItems(): InventoryItem[] {
  const allItems = getKingdomInventory()
  const equippedItems = getEquippedItems()
  
  // Filter out equipped items and return the rest
  return allItems.filter(item => 
    !equippedItems.some(equipped => equipped.id === item.id)
  )
}

export function equipItem(itemId: string): boolean {
  if (typeof window === 'undefined') return false
  
  const allItems = getKingdomInventory()
  const item = allItems.find(i => i.id === itemId)
  
  if (!item) return false
  
  // Check if item is consumable (artifacts, scrolls, potions)
  const isConsumable = item.type === 'artifact' || item.type === 'scroll' || 
                      (item.type === 'item' && !item.category)
  
  if (isConsumable) {
    // For consumables, just remove them from inventory (use them)
    removeFromKingdomInventory(itemId, 1)
    return true
  }
  
  // For equipment, check category restrictions
  let equippedItems = getEquippedItems()
  const category = item.category
  let updatedEquippedItems = [...equippedItems]
  if (category) {
    // Unequip any existing item of the same category
    const existingIndex = equippedItems.findIndex(i => i.category === category)
    if (existingIndex !== -1) {
      // Move the old equipped item to stored (do not remove from inventory, just unequip)
      updatedEquippedItems.splice(existingIndex, 1)
    }
  }
  // Add to equipped items
  updatedEquippedItems.push({ ...item, equipped: true })
  localStorage.setItem(EQUIPPED_ITEMS_KEY, JSON.stringify(updatedEquippedItems))
  window.dispatchEvent(new Event('character-inventory-update'))
  return true
}

export function unequipItem(itemId: string): boolean {
  if (typeof window === 'undefined') return false
  
  const equippedItems = getEquippedItems()
  const itemIndex = equippedItems.findIndex(i => i.id === itemId)
  
  if (itemIndex === -1) return false
  
  // Remove from equipped items
  equippedItems.splice(itemIndex, 1)
  localStorage.setItem(EQUIPPED_ITEMS_KEY, JSON.stringify(equippedItems))
  window.dispatchEvent(new Event('character-inventory-update'))
  
  return true
}

export function removeFromKingdomInventory(itemId: string, quantity: number = 1) {
  if (typeof window === 'undefined') return
  
  const currentInventory = getKingdomInventory()
  const itemIndex = currentInventory.findIndex(i => i.id === itemId)
  
  if (itemIndex === -1) return
  
  const item = currentInventory[itemIndex]!
  item.quantity -= quantity
  
  if (item.quantity <= 0) {
    currentInventory.splice(itemIndex, 1)
  }
  
  localStorage.setItem(KINGDOM_INVENTORY_KEY, JSON.stringify(currentInventory))
  window.dispatchEvent(new Event('character-inventory-update'))
}

export function getTotalStats(): { movement: number; attack: number; defense: number } {
  const equippedItems = getEquippedItems()
  
  return equippedItems.reduce((total, item) => {
    if (item.stats) {
      total.movement += item.stats.movement || 0
      total.attack += item.stats.attack || 0
      total.defense += item.stats.defense || 0
    }
    return total
  }, { movement: 0, attack: 0, defense: 0 })
} 