"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingCart, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TileCard } from "@/components/tile-card"
import { toast } from "@/components/ui/use-toast"

// Sample tile data - matching the worldmap tiles but excluding city
const tiles = [
  {
    id: "grass-1",
    name: "Grassland",
    description: "A simple grassy plain.",
    price: 50,
    image: "/placeholder.svg?height=100&width=100",
    type: "grass",
    connections: [],
    rarity: "common",
  },
  {
    id: "forest-1",
    name: "Forest",
    description: "A dense forest with tall trees.",
    price: 75,
    image: "/placeholder.svg?height=100&width=100",
    type: "forest",
    connections: [],
    rarity: "common",
  },
  {
    id: "water-1",
    name: "Lake",
    description: "A serene body of water.",
    price: 100,
    image: "/placeholder.svg?height=100&width=100",
    type: "water",
    connections: [],
    rarity: "uncommon",
  },
  {
    id: "mountain-1",
    name: "Mountain",
    description: "A tall, rocky mountain.",
    price: 125,
    image: "/placeholder.svg?height=100&width=100",
    type: "mountain",
    connections: [],
    rarity: "uncommon",
  },
  {
    id: "desert-1",
    name: "Desert",
    description: "A hot, sandy desert.",
    price: 75,
    image: "/placeholder.svg?height=100&width=100",
    type: "desert",
    connections: [],
    rarity: "common",
  },
  {
    id: "special-1",
    name: "Ancient Temple",
    description: "A mysterious temple from a forgotten era.",
    price: 200,
    image: "/placeholder.svg?height=100&width=100",
    type: "special",
    connections: [],
    rarity: "rare",
  },
  {
    id: "mystery-1",
    name: "Mystery Tile",
    description: "A mysterious tile that reveals its true nature when placed next to another tile.",
    price: 100,
    image: "/placeholder.svg?height=100&width=100",
    type: "mystery",
    connections: [],
    rarity: "uncommon",
  },
]

export default function MarketplacePage() {
  const [goldBalance, setGoldBalance] = useState(1000)
  const [ownedTiles, setOwnedTiles] = useState<string[]>(["grass-1", "road-1"]) // Start with a few tiles

  const handlePurchase = (tile: (typeof tiles)[0]) => {
    if (goldBalance >= tile.price) {
      setGoldBalance((prev) => prev - tile.price)
      setOwnedTiles((prev) => [...prev, tile.id])

      // Save to localStorage
      localStorage.setItem("gold-balance", String(goldBalance - tile.price))
      localStorage.setItem("owned-tiles", JSON.stringify([...ownedTiles, tile.id]))

      toast({
        title: "Tile Purchased!",
        description: `You've acquired the ${tile.name} tile.`,
      })
    } else {
      toast({
        title: "Insufficient Gold",
        description: "You don&rsquo;t have enough gold to purchase this tile.",
        variant: "destructive",
      })
    }
  }

  const isOwned = (tileId: string) => ownedTiles.includes(tileId)

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">Marketplace</h1>
            <p className="text-muted-foreground">Purchase tiles to build your world map</p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline" className="border-amber-800/20 hover:bg-amber-900/20">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Kingdom
              </Button>
            </Link>
            <Link href="/map">
              <Button className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900">
                <ShoppingCart className="mr-2 h-4 w-4" />
                View My Tiles
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex justify-between">
            <TabsList className="bg-gray-900 border-amber-800/20">
              <TabsTrigger value="all">All Tiles</TabsTrigger>
              <TabsTrigger value="terrain">Terrain</TabsTrigger>
              <TabsTrigger value="special">Special</TabsTrigger>
              <TabsTrigger value="mystery">Mystery</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 marketplace-grid">
              {tiles.map((tile) => (
                <TileCard key={tile.id} tile={tile} owned={isOwned(tile.id)} onPurchase={() => handlePurchase(tile)} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="terrain" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 marketplace-grid">
              {tiles
                .filter((tile) => ["grass", "forest", "water", "mountain", "desert"].includes(tile.type))
                .map((tile) => (
                  <TileCard
                    key={tile.id}
                    tile={tile}
                    owned={isOwned(tile.id)}
                    onPurchase={() => handlePurchase(tile)}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="special" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 marketplace-grid">
              {tiles
                .filter((tile) => ["special"].includes(tile.type))
                .map((tile) => (
                  <TileCard
                    key={tile.id}
                    tile={tile}
                    owned={isOwned(tile.id)}
                    onPurchase={() => handlePurchase(tile)}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="mystery" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 marketplace-grid">
              {tiles
                .filter((tile) => ["mystery"].includes(tile.type))
                .map((tile) => (
                  <TileCard
                    key={tile.id}
                    tile={tile}
                    owned={isOwned(tile.id)}
                    onPurchase={() => handlePurchase(tile)}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

