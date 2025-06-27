"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InventoryItem } from "@/lib/inventory-manager"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { storageService } from '@/lib/storage-service'

// Emoji mappings for different item types and specific items
const typeEmojis: Record<string, string> = {
  weapon: "⚔️",
  armor: "🛡️",
  potion: "🧪",
  scroll: "📜",
  food: "🍖",
  material: "🪨",
  gem: "💎",
  book: "📚",
  key: "🔑",
  tool: "🔨",
  artifact: "✨",
  misc: "🔮"
}

// Specific item name to emoji mappings
const itemEmojis: Record<string, string> = {
  // Weapons
  "Wooden Sword": "🗡️",
  "Iron Sword": "⚔️",
  "Battle Axe": "🪓",
  "Bow": "🏹",
  // Armor
  "Leather Armor": "🥋",
  "Chain Mail": "🔗",
  "Iron Armor": "🛡️",
  // Potions
  "Health Potion": "❤️",
  "Mana Potion": "🌀",
  "Strength Potion": "💪",
  // Food
  "Bread": "🍞",
  "Apple": "🍎",
  "Meat": "🍖",
  "Fish": "🐟",
  // Materials
  "Wood": "🪵",
  "Stone": "🪨",
  "Iron Ore": "⛰️",
  "Gold": "🪙",
  // Scrolls
  "Magic Scroll": "📜",
  "Teleport Scroll": "🌀",
  // Gems
  "Ruby": "❤️",
  "Sapphire": "💙",
  "Emerald": "💚",
  "Diamond": "💎",
}

// Function to get emoji for an item
function getItemEmoji(item: InventoryItem): string {
  // First check for specific item emoji
  const itemName = item.name || ''
  if (itemName && itemEmojis[itemName]) {
    return itemEmojis[itemName]
  }
  // Fallback to type emoji
  return typeEmojis[item.type.toLowerCase()] || "🔮"
}

export function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [selectedType, setSelectedType] = useState<string>("all")

  useEffect(() => {
    // Load inventory from localStorage
    const loadInventory = () => {
      const savedInventory = storageService.get<InventoryItem[]>('kingdom-inventory', [])
      setInventory(savedInventory)
    }

    loadInventory()

    // Listen for inventory updates
    window.addEventListener("character-inventory-update", loadInventory)
    
    return () => {
      window.removeEventListener("character-inventory-update", loadInventory)
    }
  }, [])

  // Group items by type
  const itemsByType = inventory.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = []
    }
    acc[item.type]!.push(item)
    return acc
  }, {} as Record<string, InventoryItem[]>)

  const types = ["all", ...Object.keys(itemsByType)]

  const filteredItems = selectedType === "all" 
    ? inventory 
    : inventory.filter(item => item.type === selectedType)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory</CardTitle>
        <CardDescription>Your collected items and equipment</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Mobile tab selector */}
        <div className="mb-4 md:hidden">
          <label htmlFor="inventory-tab-select" className="sr-only">Select inventory tab</label>
          <select
            id="inventory-tab-select"
            aria-label="Inventory tab selector"
            className="w-full rounded-md border border-amber-800/20 bg-black text-white p-2"
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
          >
            {types.map((type: string) => (
              <option key={type} value={type}>
                {type !== "all" ? `${typeEmojis[type.toLowerCase()] || "🔮"} ${type}` : "All Items"}
              </option>
            ))}
          </select>
        </div>
        <Tabs defaultValue="all" value={selectedType} onValueChange={setSelectedType}>
          <TabsList className="mb-4 hidden md:flex">
            {types.map((type: string) => (
              <TabsTrigger key={type} value={type} className="capitalize">
                {type !== "all" ? `${typeEmojis[type.toLowerCase()] || "🔮"} ${type}` : "All Items"}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={selectedType}>
            <ScrollArea className="h-[400px]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-xl">{getItemEmoji(item)}</span>
                        {item.name ?? ''}
                      </CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>Type: {typeEmojis[item.type.toLowerCase()] || "🔮"} {item.type}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 