'use client'

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building, ShoppingBag, Swords, BookOpen, Home, Footprints } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { getCharacterStats } from "@/lib/character-stats-service"
import { HeaderSection } from "@/components/HeaderSection"
import { PageGuide } from "@/components/page-guide"
import Image from "next/image"

interface LocationItem {
  id: string
  name: string
  description: string
  price: number
  type: string
  emoji: string
}

interface InventoryItem {
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

interface Props {
  slug: string
  locationId: string
}

const locationData: Record<string, {
  name: string
  description: string
  icon: any
  items?: LocationItem[]
  horses?: { id: string, name: string, description: string, price: number, movement: number, emoji: string, type: string }[]
}> = {
  "the-dragons-rest": {
    name: "The Dragon's Rest",
    description: "A tavern where you can buy potions.",
    icon: Home,
    items: [
      { id: "health-potion", name: "Health Potion", description: "Restores 50 HP", price: 50, type: "consumable", emoji: "🧪" },
      { id: "mana-potion", name: "Mana Potion", description: "Restores 50 MP", price: 50, type: "consumable", emoji: "🔮" },
      { id: "antidote", name: "Antidote", description: "Cures poison", price: 75, type: "consumable", emoji: "💊" }
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
    icon: Footprints,
    horses: [
      { id: "swift-horse", name: "Sally Swift Horse", description: "Fast and agile.", price: 500, movement: 6, emoji: "🐎", type: "creature" },
      { id: "endurance-horse", name: "Buster Endurance Horse", description: "Can travel long distances.", price: 600, movement: 8, emoji: "🐴", type: "creature" },
      { id: "war-horse", name: "Shadow War Horse", description: "Strong and brave.", price: 800, movement: 10, emoji: "🦄", type: "creature" }
    ]
  }
}

export default function LocationClient({ slug, locationId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useUser()
  const [gold, setGold] = useState(0)
  const [inventory, setInventory] = useState<InventoryItem[]>([])

  useEffect(() => {
    const loadStats = async () => {
      try {
        if (user?.id) {
          const stats = getCharacterStats()
          setGold(stats?.gold || 0)

          try {
            const response = await fetch('/api/inventory', {
              credentials: 'include'
            });
            if (response.ok) {
              const inventoryItems = await response.json();
              setInventory(Array.isArray(inventoryItems) ? inventoryItems : []);
            }
          } catch (error) {
            console.error('Failed to load inventory:', error);
          }
        }
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
  }, [user?.id])

  const location = locationData[locationId]
  useEffect(() => {
    if (!location) {
      router.push(`/town/${slug}`)
    }
  }, [location, router, slug])
  if (!location) {
    return null
  }

  const locationImage = locationId === "the-dragons-rest"
    ? "/images/locations/the-dragons-rest-tavern.png"
    : locationId === "royal-stables"
      ? "/images/locations/royal-stables.png"
      : `/images/locations/${location.name.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')}.png`;

  const handlePurchase = async (item: LocationItem) => {
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
    if (user?.id) {
      try {
        const response = await fetch('/api/character-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stats: { gold: newGold } }),
          credentials: 'include'
        });
        if (!response.ok) {
          console.error('Failed to update character stats:', response.status);
        }
      } catch (error) {
        console.error('Failed to update character stats:', error);
      }
    }
    setGold(newGold)

    // Add item to inventory
    if (user?.id) {
      try {
        const inventoryItem = {
          ...item,
          type: item.type as "artifact" | "scroll" | "book" | "creature" | "resource" | "item" | "equipment",
          quantity: 1,
          image: `/images/items/${item.type}/${item.id}.png`,
        };

        const response = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: inventoryItem }),
          credentials: 'include'
        });

        if (!response.ok) {
          console.error('Failed to add item to inventory:', response.status);
        }
      } catch (error) {
        console.error('Failed to add item to inventory:', error);
      }
    }

    // Dispatch update event
    window.dispatchEvent(new Event("character-stats-update"))

    toast({
      title: "Item Purchased!",
      description: `You have purchased ${item.name} for ${item.price} gold.`
    })
  }

  return (
    <>
      <HeaderSection
        title={location.name}
        subtitle={location.description}
        imageSrc={locationImage}
        canEdit={true}
        defaultBgColor="bg-green-900"
        shouldRevealImage={true}
        guideComponent={
          <PageGuide
            title={location.name}
            subtitle="Local services and lore"
            sections={[
              {
                title: "Town Services",
                icon: Building,
                content: "Each town offers unique services, from the local tavern to specialized shops and traders."
              },
              {
                title: "Royal Stables",
                icon: Footprints,
                content: "Acquire trusty steeds with unique movement bonuses to speed up your travel across the realm."
              },
              {
                title: "Marketplace",
                icon: ShoppingBag,
                content: "Trade your artifacts for gold or buy rare items, scrolls, and books to aid your journey."
              }
            ]}
          />
        }
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" onClick={() => router.push(`/town/${slug}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
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
              {locationId === "royal-stables" && (
                <>
                  <h2 className="text-xl font-bold mb-4">Horses for Sale</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {location.horses?.map((horse) => {
                      let imagePath = "/images/items/placeholder.png";
                      if (horse.name === "Sally Swift Horse") imagePath = "/images/items/horse/horse-stelony.png";
                      if (horse.name === "Buster Endurance Horse") imagePath = "/images/items/horse/horse-perony.png";
                      if (horse.name === "Shadow War Horse") imagePath = "/images/items/horse/horse-felony.png";
                      return (
                        <Card key={horse.id} className="flex flex-col">
                          <div className="w-full aspect-[4/3] relative bg-black">
                            <Image
                              src={imagePath}
                              alt={`${horse.name} image`}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, 33vw"
                              aria-label={`${horse.name}-image`}
                              onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).src = "/images/items/placeholder.png"; }}
                            />
                          </div>
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
                      );
                    })}
                  </div>
                </>
              )}
              {locationId === "kingdom-marketplace" && (
                <>
                  <h2 className="text-xl font-bold mb-4">Sell Artifacts</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {location.items?.filter((artifact) =>
                      Array.isArray(inventory) && inventory.some(inv => inv.id === artifact.id && artifact.type === "artifact")
                    ).map((artifact) => {
                      const invItem = Array.isArray(inventory) ? inventory.find(inv => inv.id === artifact.id) : null
                      if (!invItem) return null

                      // Get artifact image from the artifact folder
                      let imagePath = "/images/items/placeholder.png";
                      if (artifact.name === "Ancient Artifact") imagePath = "/images/items/artifact/crown/artifact-crowny.png";
                      if (artifact.name === "Merchant's Charm") imagePath = "/images/items/artifact/ring/artifact-ringo.png";
                      if (artifact.name === "Restful Charm") imagePath = "/images/items/artifact/ring/artifact-ringo.png";
                      if (artifact.name === "Mystic Brew") imagePath = "/images/items/artifact/potion/artifact-potion.png";
                      // Add more artifact mappings as needed

                      return (
                        <Card key={artifact.id} className="flex flex-col">
                          <div className="w-full aspect-[4/3] relative bg-black">
                            <Image
                              src={imagePath}
                              alt={`${artifact.name} image`}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, 33vw"
                              aria-label={`${artifact.name}-image`}
                              onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).src = "/images/items/placeholder.png"; }}
                            />
                          </div>
                          <CardHeader>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{artifact.name}</CardTitle>
                            </div>
                            <CardDescription>{artifact.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1">
                            <p className="text-sm text-muted-foreground">Sell Price: {artifact.price} gold</p>
                            <p className="text-sm text-muted-foreground">Type: {artifact.type}</p>
                          </CardContent>
                          <CardContent className="pt-0">
                            <Button
                              className="w-full"
                              onClick={() => handlePurchase(artifact)}
                              disabled={gold < artifact.price}
                            >
                              Sell
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                  <h2 className="text-xl font-bold mt-4 mb-4">Buy Items</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {location.items?.map((item) => {
                      let imagePath = "/images/items/placeholder.png";
                      if (item.name === "Ancient Artifact") imagePath = "/images/items/artifact/crown/artifact-crowny.png";
                      if (item.name === "Magic Scroll") imagePath = "/images/items/scroll/scroll-scrolly.png";
                      if (item.name === "Tome of Knowledge") imagePath = "/images/items/scroll/scroll-perkamento.png";
                      // Add more mappings as needed
                      return (
                        <Card key={item.id} className="flex flex-col">
                          <div className="w-full aspect-[4/3] relative bg-black">
                            <Image
                              src={imagePath}
                              alt={`${item.name} image`}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, 33vw"
                              aria-label={`${item.name}-image`}
                              onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).src = "/images/items/placeholder.png"; }}
                            />
                          </div>
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
                      );
                    })}
                  </div>
                </>
              )}
              {locationId === "the-dragons-rest" && (
                <>
                  <h2 className="text-xl font-bold mb-4">Potions for Sale</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {location.items?.map((item) => {
                      let imagePath = "/images/items/placeholder.png";
                      if (item.name === "Health Potion") imagePath = "/images/items/potion/potion-health.png";
                      if (item.name === "Mana Potion") imagePath = "/images/items/potion/potion-gold.png";
                      if (item.name === "Antidote") imagePath = "/images/items/potion/potion-exp.png";
                      // Add more mappings as needed
                      return (
                        <Card key={item.id} className="flex flex-col">
                          <div className="w-full aspect-[4/3] relative bg-black">
                            <Image
                              src={imagePath}
                              alt={`${item.name} image`}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, 33vw"
                              aria-label={`${item.name}-image`}
                              onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).src = "/images/items/placeholder.png"; }}
                            />
                          </div>
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
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
} 