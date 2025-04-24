import { showScrollToast } from "@/lib/toast-utils"

export interface InventoryItem {
  name: string
  quantity: number
  type: 'resource' | 'item' | 'creature' | 'scroll'
  id: string
  category?: string
  description?: string
  emoji?: string
}

const INVENTORY_KEY = 'character-inventory'

export function getInventory(): InventoryItem[] {
  if (typeof window === 'undefined') return []
  
  const savedInventory = localStorage.getItem(INVENTORY_KEY)
  if (!savedInventory) return []
  
  try {
    return JSON.parse(savedInventory)
  } catch (err) {
    console.error('Error parsing inventory:', err)
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
  
  const item = currentInventory[itemIndex]
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