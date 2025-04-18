"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Building, ShoppingBag, Swords, BookOpen, Home } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { addToInventory, getInventory, InventoryItem } from "@/lib/inventory-manager"

interface LocationItem {
  id: string
  name: string
  description: string
  price: number
  type: string
}

interface LocationData {
  name: string
  description: string
  icon: any
  items: LocationItem[]
}

const locationData: Record<string, LocationData> = {
  marketplace: {
    name: "Marketplace",
    description: "A bustling marketplace where merchants sell their wares.",
    icon: ShoppingBag,
    items: [
      { id: "health-potion", name: "Health Potion", description: "Restores 50 HP", price: 50, type: "consumable" },
      { id: "mana-potion", name: "Mana Potion", description: "Restores 50 MP", price: 50, type: "consumable" },
      { id: "antidote", name: "Antidote", description: "Cures poison", price: 75, type: "consumable" }
    ]
  },
  blacksmith: {
    name: "Blacksmith",
    description: "A forge where weapons and armor are crafted.",
    icon: Swords,
    items: [
      { id: "iron-sword", name: "Iron Sword", description: "A basic sword", price: 100, type: "weapon" },
      { id: "steel-armor", name: "Steel Armor", description: "Sturdy armor", price: 200, type: "armor" },
      { id: "iron-shield", name: "Iron Shield", description: "A basic shield", price: 150, type: "shield" }
    ]
  },
  library: {
    name: "Library",
    description: "A place of knowledge and learning.",
    icon: BookOpen,
    items: [
      { id: "spell-book", name: "Spell Book", description: "Contains basic spells", price: 300, type: "book" },
      { id: "skill-scroll", name: "Skill Scroll", description: "Teaches a new skill", price: 500, type: "scroll" }
    ]
  },
  townhall: {
    name: "Town Hall",
    description: "The center of city administration.",
    icon: Building,
    items: [
      { id: "city-pass", name: "City Pass", description: "Grants access to restricted areas", price: 1000, type: "key" },
      { id: "trade-license", name: "Trade License", description: "Allows trading in the city", price: 750, type: "document" }
    ]
  },
  inn: {
    name: "Inn",
    description: "A cozy place to rest and gather information.",
    icon: Home,
    items: [
      { id: "room-key", name: "Room Key", description: "Access to a private room", price: 50, type: "key" },
      { id: "meal-token", name: "Meal Token", description: "Good for one meal", price: 25, type: "consumable" }
    ]
  }
}

export default function CityLocationPage() {
  const params = useParams() as { cityName: string; locationId: string }
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

  const location = locationData[params.locationId]
  if (!location) {
    router.push(`/city/${params.cityName}`)
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
      type: item.type,
      description: item.description,
      quantity: 1
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
          <Button variant="outline" size="icon" onClick={() => router.push(`/city/${params.cityName}`)}>
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
                    <CardTitle className="text-lg">{item.name}</CardTitle>
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