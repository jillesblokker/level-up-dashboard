import { showScrollToast } from "@/lib/toast-utils"

export interface InventoryItem {
  id: string
  name: string
  type: string
  description: string
  quantity: number
  category?: string
  content?: string
}

export function addItemToInventory(item: Partial<InventoryItem>) {
  try {
    // Get current inventory
    const savedInventory = localStorage.getItem("character-inventory")
    const currentInventory: InventoryItem[] = savedInventory ? JSON.parse(savedInventory) : []

    // Check if item already exists
    const existingItemIndex = currentInventory.findIndex(i => i.id === item.id)

    if (existingItemIndex >= 0) {
      // Update quantity
      currentInventory[existingItemIndex].quantity = (currentInventory[existingItemIndex].quantity || 1) + 1
    } else {
      // Add new item
      currentInventory.push({
        id: item.id || `item-${Date.now()}`,
        name: item.name || "Unknown Item",
        type: item.type || "misc",
        description: item.description || "",
        quantity: item.quantity || 1,
        category: item.category,
        content: item.content
      })
    }

    // Save updated inventory
    localStorage.setItem("character-inventory", JSON.stringify(currentInventory))

    // Dispatch event to notify components
    window.dispatchEvent(new Event("character-inventory-update"))

    // Show toast notification
    showScrollToast(
      'discovery',
      'Item Added to Inventory',
      `Added ${item.quantity}x ${item.name} to inventory`
    )

    return currentInventory
  } catch (error) {
    console.error("Error managing inventory:", error)
    return null
  }
}

export function removeItemFromInventory(itemId: string, quantity: number = 1) {
  try {
    // Get current inventory
    const savedInventory = localStorage.getItem("character-inventory")
    if (!savedInventory) return null

    const currentInventory: InventoryItem[] = JSON.parse(savedInventory)
    const itemIndex = currentInventory.findIndex(i => i.id === itemId)

    if (itemIndex < 0) return null

    // Update quantity
    currentInventory[itemIndex].quantity -= quantity

    // Remove item if quantity is 0 or less
    if (currentInventory[itemIndex].quantity <= 0) {
      currentInventory.splice(itemIndex, 1)
    }

    // Save updated inventory
    localStorage.setItem("character-inventory", JSON.stringify(currentInventory))

    // Dispatch event to notify components
    window.dispatchEvent(new Event("character-inventory-update"))

    return currentInventory
  } catch (error) {
    console.error("Error managing inventory:", error)
    return null
  }
}

export function getInventory(): InventoryItem[] {
  try {
    const savedInventory = localStorage.getItem("character-inventory")
    return savedInventory ? JSON.parse(savedInventory) : []
  } catch (error) {
    console.error("Error getting inventory:", error)
    return []
  }
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