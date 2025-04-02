'use client'

import { useState, useEffect } from "react"
import { ArrowLeft, Building, ShoppingBag, Swords, Home } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NavBar } from "@/components/nav-bar"
import { useToast } from "@/components/ui/use-toast"
import { addItemToInventory, getInventory, InventoryItem } from "@/lib/inventory-manager"

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
    description: "A small but lively marketplace.",
    icon: ShoppingBag,
    items: [
      { id: "bread", name: "Fresh Bread", description: "Restores 20 HP", price: 10, type: "consumable" },
      { id: "water-flask", name: "Water Flask", description: "Restores 10 MP", price: 15, type: "consumable" },
      { id: "bandage", name: "Bandage", description: "Heals minor wounds", price: 25, type: "consumable" }
    ]
  },
  blacksmith: {
    name: "Blacksmith",
    description: "A modest forge for basic weapons and repairs.",
    icon: Swords,
    items: [
      { id: "wooden-sword", name: "Wooden Sword", description: "A practice sword", price: 50, type: "weapon" },
      { id: "leather-armor", name: "Leather Armor", description: "Basic protection", price: 75, type: "armor" },
      { id: "wooden-shield", name: "Wooden Shield", description: "A basic shield", price: 60, type: "shield" }
    ]
  },
  inn: {
    name: "Inn",
    description: "A humble inn offering basic amenities.",
    icon: Home,
    items: [
      { id: "simple-meal", name: "Simple Meal", description: "A filling meal", price: 15, type: "consumable" },
      { id: "room-key", name: "Room Key", description: "Access to a basic room", price: 30, type: "key" }
    ]
  }
}

export default function TownLocationPage() {
  const params = useParams() as { slug: string; locationId: string }
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
    router.push(`/town/${params.slug}`)
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
    addItemToInventory({
      id: item.id,
      name: item.name,
      type: item.type,
      description: item.description
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
      <NavBar />
      
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.push(`/town/${params.slug}`)}>
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