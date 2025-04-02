import { showScrollToast } from "@/lib/toast-utils"

export interface InventoryItem {
  id: string
  name: string
  type: string
  description: string
  quantity: number
}

export function addItemToInventory(item: Omit<InventoryItem, "quantity">, quantity: number = 1) {
  try {
    // Get current inventory
    const savedInventory = localStorage.getItem("character-inventory")
    const currentInventory: InventoryItem[] = savedInventory ? JSON.parse(savedInventory) : []

    // Check if item already exists
    const existingItemIndex = currentInventory.findIndex(i => i.id === item.id)
    
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      currentInventory[existingItemIndex].quantity += quantity
    } else {
      // Add new item if it doesn't exist
      currentInventory.push({
        ...item,
        quantity
      })
    }

    // Save updated inventory
    localStorage.setItem("character-inventory", JSON.stringify(currentInventory))

    // Dispatch event to notify components
    window.dispatchEvent(new Event("character-inventory-update"))

    // Show toast notification
    showScrollToast(
      'discovery',
      undefined,
      `Added ${quantity}x ${item.name} to inventory`
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

export function hasItem(itemId: string): boolean {
  const inventory = getInventory()
  return inventory.some(item => item.id === itemId)
}

export function getItemQuantity(itemId: string): number {
  const inventory = getInventory()
  const item = inventory.find(i => i.id === itemId)
  return item?.quantity || 0
} 