'use client'

import { useState, useEffect } from "react"
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building, ShoppingBag, Swords, BookOpen, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { addToInventory, getInventory, InventoryItem } from "@/lib/inventory-manager"

interface LocationItem {
  id: string
  name: string
  description: string
  price: number
  type: string
  emoji: string
}

interface Props {
  slug: string
  locationId: string
}

const locationData: Record<string, {
  name: string
  description: string
  icon: any
  items: LocationItem[]
}> = {
  marketplace: {
    name: "Town Marketplace",
    description: "A bustling marketplace where merchants sell their wares.",
    icon: ShoppingBag,
    items: [
      { id: "health-potion", name: "Health Potion", description: "Restores 50 HP", price: 50, type: "consumable", emoji: "🧪" },
      { id: "mana-potion", name: "Mana Potion", description: "Restores 50 MP", price: 50, type: "consumable", emoji: "🔮" },
      { id: "antidote", name: "Antidote", description: "Cures poison", price: 75, type: "consumable", emoji: "💊" }
    ]
  },
  blacksmith: {
    name: "Ember's Anvil",
    description: "A forge where weapons and armor are crafted.",
    icon: Swords,
    items: [
      { id: "iron-sword", name: "Iron Sword", description: "A basic sword", price: 100, type: "weapon", emoji: "⚔️" },
      { id: "steel-armor", name: "Steel Armor", description: "Sturdy armor", price: 200, type: "armor", emoji: "🛡️" },
      { id: "iron-shield", name: "Iron Shield", description: "A basic shield", price: 150, type: "shield", emoji: "🛡️" }
    ]
  },
  inn: {
    name: "The Dragon's Rest",
    description: "A cozy place to rest and gather information.",
    icon: Home,
    items: [
      { id: "room-key", name: "Room Key", description: "Access to a private room", price: 50, type: "key", emoji: "🔑" },
      { id: "meal-token", name: "Meal Token", description: "Good for one meal", price: 25, type: "consumable", emoji: "🍖" },
      { id: "ale", name: "Dragon's Breath Ale", description: "A strong local brew", price: 15, type: "consumable", emoji: "🍺" }
    ]
  }
}

export default function LocationClient({ slug, locationId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [gold, setGold] = useState(0)
  const [inventory, setInventory] = useState<InventoryItem[]>([])

  useEffect(() => {
    // Load character stats from localStorage
    const loadStats = () => {
      try {
        const savedStats = localStorage.getItem("character-stats")
        if (savedStats) {
          const stats = JSON.parse(savedStats)
          setGold(stats.gold || 0)
        }

        setInventory(getInventory())
      } catch (error) {
        console.error("Failed to load character stats:", error)
      }
    }
    
    loadStats()

    // Listen for updates
    window.addEventListener("character-stats-update", loadStats)
    window.addEventListener("character-inventory-update", loadStats)
    
    return () => {
      window.removeEventListener("character-stats-update", loadStats)
      window.removeEventListener("character-inventory-update", loadStats)
    }
  }, [])

  const location = locationData[locationId]
  if (!location) {
    router.push(`/town/${slug}`)
    return null
  }

  const handlePurchase = (item: LocationItem) => {
    if (gold < item.price) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${item.price} gold to purchase this item.`,
        variant: "destructive"
      })
      return
    }

    // Update gold
    const newGold = gold - item.price
    const stats = JSON.parse(localStorage.getItem("character-stats") || "{}")
    stats.gold = newGold
    localStorage.setItem("character-stats", JSON.stringify(stats))
    setGold(newGold)

    // Add item to inventory
    addToInventory({
      id: item.id,
      name: item.name,
      type: item.type as 'resource' | 'item' | 'creature' | 'scroll',
      quantity: 1,
      description: item.description,
      category: item.type
    })

    // Dispatch update event
    window.dispatchEvent(new Event("character-stats-update"))

    toast({
      title: "Item Purchased!",
      description: `You have purchased ${item.name} for ${item.price} gold.`
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.push(`/town/${slug}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{location.name}</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <location.icon className="h-5 w-5" />
              <CardTitle>{location.name}</CardTitle>
            </div>
            <CardDescription>{location.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {location.items.map((item) => (
                <Card key={item.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.emoji}</span>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </div>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">Price: {item.price} gold</p>
                    <p className="text-sm text-muted-foreground">Type: {item.type}</p>
                  </CardContent>
                  <CardContent className="pt-0">
                    <Button
                      className="w-full"
                      onClick={() => handlePurchase(item)}
                      disabled={gold < item.price}
                    >
                      Purchase
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 