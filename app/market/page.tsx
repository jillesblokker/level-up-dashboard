"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Coins, Filter, Search, ShoppingCart } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TileCard } from "@/components/tile-card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { OnboardingGuide } from "@/components/onboarding-guide"

// Tile types
type TileType = "grass" | "forest" | "water" | "mountain" | "desert" | "special"

interface Tile {
  id: string
  type: TileType
  name: string
  description: string
  cost: number
  rarity: "common" | "uncommon" | "rare" | "epic"
  category: "terrain" | "special"
  connections: string[]
}

export default function MarketPage() {
  const [goldBalance, setGoldBalance] = useState(1000)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null)
  const [cart, setCart] = useState<Tile[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Available tiles
  const availableTiles: Tile[] = [
    {
      id: "grass-1",
      type: "grass",
      name: "Grassland",
      description: "A simple grassy plain.",
      cost: 10,
      rarity: "common",
      category: "terrain",
      connections: [],
    },
    {
      id: "forest-1",
      type: "forest",
      name: "Forest",
      description: "A dense forest with tall trees.",
      cost: 20,
      rarity: "common",
      category: "terrain",
      connections: [],
    },
    {
      id: "water-1",
      type: "water",
      name: "Lake",
      description: "A serene body of water with gentle waves.",
      cost: 30,
      rarity: "uncommon",
      category: "terrain",
      connections: [],
    },
    {
      id: "mountain-1",
      type: "mountain",
      name: "Mountain",
      description: "A tall, rocky mountain peak.",
      cost: 40,
      rarity: "uncommon",
      category: "terrain",
      connections: [],
    },
    {
      id: "desert-1",
      type: "desert",
      name: "Desert",
      description: "A hot, sandy desert landscape.",
      cost: 25,
      rarity: "uncommon",
      category: "terrain",
      connections: [],
    },
    {
      id: "special-1",
      type: "special",
      name: "Ancient Temple",
      description: "A mysterious temple from a forgotten era.",
      cost: 100,
      rarity: "rare",
      category: "special",
      connections: [],
    },
    {
      id: "special-2",
      type: "special",
      name: "Desert Oasis",
      description: "A lush oasis in the middle of the desert.",
      cost: 120,
      rarity: "rare",
      category: "special",
      connections: [],
    },
    {
      id: "special-3",
      type: "special",
      name: "Coastal Village",
      description: "A small fishing village by the sea.",
      cost: 150,
      rarity: "epic",
      category: "special",
      connections: [],
    },
  ]

  // Check if onboarding has been shown before
  useEffect(() => {
    const allOnboardingDisabled = localStorage.getItem("all-onboarding-disabled")
    if (allOnboardingDisabled) {
      setShowOnboarding(false)
      return
    }

    const onboardingShown = localStorage.getItem("market-onboarding-shown")
    if (!onboardingShown) {
      setShowOnboarding(true)
    }

    // Load gold balance from localStorage
    const savedGold = localStorage.getItem("levelup-gold-balance")
    if (savedGold) {
      setGoldBalance(Number.parseInt(savedGold, 10))
    }
  }, [])

  const handleCloseOnboarding = (dontShowAgain: boolean) => {
    setShowOnboarding(false)
    if (dontShowAgain) {
      localStorage.setItem("market-onboarding-shown", "true")
    }
  }

  // Filter tiles based on search query and filters
  const filteredTiles = availableTiles.filter((tile) => {
    const matchesSearch =
      tile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tile.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory ? tile.category === selectedCategory : true
    const matchesRarity = selectedRarity ? tile.rarity === selectedRarity : true

    return matchesSearch && matchesCategory && matchesRarity
  })

  // Add tile to cart
  const addToCart = (tile: Tile) => {
    setCart([...cart, tile])
    toast({
      title: "Added to cart",
      description: `${tile.name} has been added to your cart.`,
    })
  }

  // Remove tile from cart
  const removeFromCart = (tileId: string) => {
    const index = cart.findIndex((item) => item.id === tileId)
    if (index !== -1) {
      const newCart = [...cart]
      newCart.splice(index, 1)
      setCart(newCart)

      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart.",
      })
    }
  }

  // Calculate total cost
  const totalCost = cart.reduce((total, item) => total + item.cost, 0)

  // Purchase tiles
  const purchaseTiles = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some tiles to your cart before checking out.",
        variant: "destructive",
      })
      return
    }

    if (goldBalance < totalCost) {
      toast({
        title: "Not enough gold",
        description: `You need ${totalCost} gold to purchase these tiles.`,
        variant: "destructive",
      })
      return
    }

    // Deduct gold
    setGoldBalance(goldBalance - totalCost)

    // Save to localStorage
    localStorage.setItem("levelup-gold-balance", (goldBalance - totalCost).toString())

    // Clear cart
    setCart([])

    toast({
      title: "Purchase successful",
      description: `You've purchased ${cart.length} tiles for ${totalCost} gold.`,
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">Market</h1>
            <p className="text-muted-foreground">Purchase tiles to expand your kingdom</p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline" className="border-amber-800/20 hover:bg-amber-900/20">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Kingdom
              </Button>
            </Link>
            <Button
              className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900"
              onClick={purchaseTiles}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Checkout ({cart.length})
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          <div className="space-y-4">
            <Card className="medieval-card">
              <CardHeader>
                <CardTitle className="font-serif">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tiles..."
                      className="pl-8 bg-gray-900 border-amber-800/20"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={selectedCategory === null ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory(null)}
                    >
                      All
                    </Badge>
                    <Badge
                      variant={selectedCategory === "terrain" ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory("terrain")}
                    >
                      Terrain
                    </Badge>
                    <Badge
                      variant={selectedCategory === "special" ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory("special")}
                    >
                      Special
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rarity</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={selectedRarity === null ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedRarity(null)}
                    >
                      All
                    </Badge>
                    <Badge
                      variant={selectedRarity === "common" ? "default" : "outline"}
                      className="cursor-pointer bg-gray-500/50"
                      onClick={() => setSelectedRarity("common")}
                    >
                      Common
                    </Badge>
                    <Badge
                      variant={selectedRarity === "uncommon" ? "default" : "outline"}
                      className="cursor-pointer bg-green-500/50"
                      onClick={() => setSelectedRarity("uncommon")}
                    >
                      Uncommon
                    </Badge>
                    <Badge
                      variant={selectedRarity === "rare" ? "default" : "outline"}
                      className="cursor-pointer bg-blue-500/50"
                      onClick={() => setSelectedRarity("rare")}
                    >
                      Rare
                    </Badge>
                    <Badge
                      variant={selectedRarity === "epic" ? "default" : "outline"}
                      className="cursor-pointer bg-purple-500/50"
                      onClick={() => setSelectedRarity("epic")}
                    >
                      Epic
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="medieval-card">
              <CardHeader>
                <CardTitle className="font-serif">Cart</CardTitle>
                <CardDescription>{cart.length} items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Your cart is empty</p>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-2 border border-amber-800/20 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-sm overflow-hidden">
                            <TileCard 
                              tile={{
                                id: item.id,
                                name: item.name,
                                description: item.description,
                                price: item.cost,
                                type: item.type,
                                connections: item.connections,
                                rarity: item.rarity
                              }} 
                              owned={false}
                              onPurchase={() => {}}
                            />
                          </div>
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-amber-500">{item.cost} G</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500"
                            onClick={() => removeFromCart(item.id)}
                          >
                            &times;
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-lg font-bold text-amber-500">{totalCost} Gold</p>
                </div>
                <Button
                  className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900"
                  onClick={purchaseTiles}
                  disabled={cart.length === 0}
                >
                  Purchase
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">Available Tiles</h2>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{filteredTiles.length} tiles</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTiles.map((tile) => (
                <Card key={tile.id} className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
                  <CardContent className="p-4">
                    <div className="aspect-square w-full rounded-md overflow-hidden mb-3">
                      <TileCard 
                        tile={{
                          id: tile.id,
                          name: tile.name,
                          description: tile.description,
                          price: tile.cost,
                          type: tile.type,
                          connections: tile.connections,
                          rarity: tile.rarity
                        }} 
                        owned={false}
                        onPurchase={() => {}}
                      />
                    </div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{tile.name}</h3>
                      <Badge
                        className={`
                          ${tile.rarity === "common" ? "bg-gray-500/50" : ""}
                          ${tile.rarity === "uncommon" ? "bg-green-500/50" : ""}
                          ${tile.rarity === "rare" ? "bg-blue-500/50" : ""}
                          ${tile.rarity === "epic" ? "bg-purple-500/50" : ""}
                        `}
                      >
                        {tile.rarity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{tile.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Coins className="h-4 w-4 text-amber-500 mr-1" />
                        <span className="font-bold">{tile.cost}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-800/20 hover:bg-amber-900/20"
                        onClick={() => addToCart(tile)}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Onboarding Guide */}
      <OnboardingGuide open={showOnboarding} onClose={handleCloseOnboarding} />
    </div>
  )
}

