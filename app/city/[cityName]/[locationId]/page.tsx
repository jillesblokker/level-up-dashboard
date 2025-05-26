"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Building, ShoppingBag, Swords, BookOpen, Home } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { addToInventory, getInventory, addToKingdomInventory } from "@/lib/inventory-manager"
import { HeaderSection } from "@/components/HeaderSection"

interface LocationItem {
  id: string
  name: string
  description: string
  price: number
  type: "item" | "resource" | "creature" | "scroll" | "equipment" | "artifact" | "book"
  emoji?: string
}

const locationData: Record<string, any> = {
  marketplace: {
    name: "Marketplace",
    description: "A bustling marketplace where merchants sell their wares.",
    icon: ShoppingBag,
    items: [
      { id: "health-potion", name: "Health Potion", description: "Restores 50 HP", price: 50, type: "item" },
      { id: "mana-potion", name: "Mana Potion", description: "Restores 50 MP", price: 50, type: "item" },
      { id: "antidote", name: "Antidote", description: "Cures poison", price: 75, type: "item" }
    ]
  },
  blacksmith: {
    name: "Blacksmith",
    description: "A forge where weapons and armor are crafted.",
    icon: Swords,
    items: [
      { id: "iron-sword", name: "Iron Sword", description: "A basic sword", price: 100, type: "item" },
      { id: "steel-armor", name: "Steel Armor", description: "Sturdy armor", price: 200, type: "item" },
      { id: "iron-shield", name: "Iron Shield", description: "A basic shield", price: 150, type: "item" }
    ]
  },
  library: {
    name: "Library",
    description: "A place of knowledge and learning.",
    icon: BookOpen,
    items: [
      { id: "spell-book", name: "Spell Book", description: "Contains basic spells", price: 300, type: "item" },
      { id: "skill-scroll", name: "Skill Scroll", description: "Teaches a new skill", price: 500, type: "scroll" }
    ]
  },
  townhall: {
    name: "Town Hall",
    description: "The center of city administration.",
    icon: Building,
    items: [
      { id: "city-pass", name: "City Pass", description: "Grants access to restricted areas", price: 1000, type: "item" },
      { id: "trade-license", name: "Trade License", description: "Allows trading in the city", price: 750, type: "item" }
    ]
  },
  inn: {
    name: "Inn",
    description: "A cozy place to rest and gather information.",
    icon: Home,
    items: [
      { id: "room-key", name: "Room Key", description: "Access to a private room", price: 50, type: "item" },
      { id: "meal-token", name: "Meal Token", description: "Good for one meal", price: 25, type: "item" }
    ]
  },
  "embers-anvil": {
    name: "Ember's Anvil",
    description: "Buy equipment: sword, shield, and armor set.",
    icon: Swords,
    items: [
      { id: "sword", name: "Sword", description: "A sharp blade for battle.", price: 120, type: "equipment", emoji: "⚔️" },
      { id: "shield", name: "Shield", description: "Protects you from attacks.", price: 100, type: "equipment", emoji: "🛡️" },
      { id: "armor-set", name: "Armor Set", description: "Full body protection.", price: 250, type: "equipment", emoji: "🥋" }
    ]
  },
  "kingdom-marketplace": {
    name: "Kingdom Marketplace",
    description: "Trade/sell your artifacts for gold and buy artifacts, scrolls, or books.",
    icon: ShoppingBag,
    items: [
      { id: "ancient-artifact", name: "Ancient Artifact", description: "A mysterious artifact.", price: 300, type: "artifact", emoji: "🏺" },
      { id: "magic-scroll", name: "Magic Scroll", description: "A scroll containing a spell.", price: 200, type: "scroll", emoji: "📜" },
      { id: "tome-of-knowledge", name: "Tome of Knowledge", description: "A book of wisdom.", price: 400, type: "book", emoji: "📚" }
    ]
  },
  "royal-stables": {
    name: "Royal Stables",
    description: "Buy horses with unique movement stats.",
    icon: Home,
    horses: [
      { id: "swift-horse", name: "Sally Swift Horse", description: "Fast and agile.", price: 500, movement: 6, emoji: "🐎", type: "creature" },
      { id: "endurance-horse", name: "Buster Endurance Horse", description: "Can travel long distances.", price: 600, movement: 8, emoji: "🐴", type: "creature" },
      { id: "war-horse", name: "Shadow War Horse", description: "Strong and brave.", price: 800, movement: 10, emoji: "🦄", type: "creature" }
    ]
  }
}

export default function CityLocationPage() {
  const params = useParams() as { cityName: string; locationId: string }
  const router = useRouter()
  const { toast } = useToast()
  const [gold, setGold] = useState(0)

  useEffect(() => {
    // Load character stats from localStorage
    const loadStats = () => {
      try {
        const savedStats = localStorage.getItem("character-stats")
        if (savedStats) {
          const stats = JSON.parse(savedStats)
          setGold(stats.gold || 0)
        }

        // Load inventory but don't store in state since it's not used
        getInventory()
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
      type: item.type as any,
      description: item.description,
      quantity: 1
    })
    addToKingdomInventory({
      id: item.id,
      name: item.name,
      type: item.type as any,
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

  const locationImage = params.locationId === "royal-stables"
    ? "/images/locations/royal-stables.png"
    : `/images/locations/${location.name.toLowerCase().replace(/\s+/g, '-')}.png`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.push(`/city/${params.cityName}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{location.name}</h1>
        </div>

        <HeaderSection
          title={location.name}
          imageSrc={locationImage}
          canEdit={false}
        />

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <location.icon className="h-5 w-5" />
              <CardTitle>{location.name}</CardTitle>
            </div>
            <CardDescription>{location.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {params.locationId === "royal-stables" ? (
              <>
                <h2 className="text-xl font-bold mb-4">Horses for Sale</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {location.horses.map((horse: LocationItem & { movement: number }) => (
                    <Card key={horse.id} className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-lg">{horse.name}</CardTitle>
                        <CardDescription>{horse.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground">Price: {horse.price} gold</p>
                        <p className="text-sm text-muted-foreground">Movement: +{horse.movement}</p>
                      </CardContent>
                      <CardContent className="pt-0">
                        <Button
                          className="w-full"
                          onClick={() => handlePurchase(horse as LocationItem)}
                          disabled={gold < horse.price}
                        >
                          Purchase
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {location.items.map((item: LocationItem) => (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 