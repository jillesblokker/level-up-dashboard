"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Coins, Filter, Search, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { getCharacterStats, addToCharacterStat, fetchFreshCharacterStats } from "@/lib/character-stats-service"
import { addTileToInventory } from "@/lib/tile-inventory-manager"
import { useUser } from "@clerk/nextjs"
import { setUserPreference } from "@/lib/user-preferences-manager"
import { TEXT_CONTENT } from "@/lib/text-content"

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
  const { user } = useUser()
  const [goldBalance, setGoldBalance] = useState(1000)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null)
  const [cart, setCart] = useState<Tile[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Available tiles
  const availableTiles: Tile[] = TEXT_CONTENT.market.data.tiles.map(tile => ({
    ...tile,
    // Ensure type compatibility if needed, though structure matches
  })) as Tile[];

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

    // Track visit for New Player Checklist
    if (user) {
      setUserPreference('onboarding_market_visited', true)
    }

    // Load initial stats
    const stats = getCharacterStats()
    setGoldBalance(stats.gold)

    // Fetch fresh stats and sync
    fetchFreshCharacterStats().then(fresh => {
      if (fresh) setGoldBalance(fresh.gold)
    })

    // Listen for stats updates
    const handleStatsUpdate = () => {
      const updated = getCharacterStats()
      setGoldBalance(updated.gold)
    }

    window.addEventListener('character-stats-update', handleStatsUpdate)
    return () => window.removeEventListener('character-stats-update', handleStatsUpdate)
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
      title: TEXT_CONTENT.market.toasts.added.title,
      description: TEXT_CONTENT.market.toasts.added.desc.replace("{name}", tile.name),
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
        title: TEXT_CONTENT.market.toasts.removed.title,
        description: TEXT_CONTENT.market.toasts.removed.desc,
      })
    }
  }

  // Calculate total cost
  const totalCost = cart.reduce((total, item) => total + item.cost, 0)

  // Purchase tiles
  const purchaseTiles = () => {
    if (cart.length === 0) {
      toast({
        title: TEXT_CONTENT.market.toasts.empty.title,
        description: TEXT_CONTENT.market.toasts.empty.desc,
        variant: "destructive",
      })
      return
    }

    if (goldBalance < totalCost) {
      toast({
        title: TEXT_CONTENT.market.toasts.insufficient.title,
        description: TEXT_CONTENT.market.toasts.insufficient.desc.replace("{amount}", String(totalCost)),
        variant: "destructive",
      })
      return
    }

    // Deduct gold via unified service
    addToCharacterStat('gold', -totalCost, 'market-purchase')

    // Add tiles to inventory
    if (user?.id) {
      cart.forEach(tile => {
        addTileToInventory(user.id, {
          id: tile.id,
          name: tile.name,
          type: tile.type as any,
          quantity: 1,
          cost: tile.cost,
          rarity: tile.rarity as any,
          category: tile.category as any,
          connections: tile.connections
        })
      })
    }

    // Clear cart
    setCart([])

    toast({
      title: TEXT_CONTENT.market.toasts.success.title,
      description: TEXT_CONTENT.market.toasts.success.desc.replace("{count}", String(cart.length)).replace("{amount}", String(totalCost)),
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">{TEXT_CONTENT.market.header.title}</h1>
            <p className="text-muted-foreground">{TEXT_CONTENT.market.header.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline" className="border-amber-800/20 hover:bg-amber-900/20">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {TEXT_CONTENT.market.header.back}
              </Button>
            </Link>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black"
              onClick={purchaseTiles}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {TEXT_CONTENT.market.header.checkout.replace("{count}", String(cart.length))}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          <div className="space-y-4">
            <Card className="medieval-card">
              <CardHeader>
                <CardTitle className="font-serif">{TEXT_CONTENT.market.filters.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{TEXT_CONTENT.market.filters.search}</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={TEXT_CONTENT.market.filters.searchPlaceholder}
                      className="pl-8 bg-gray-900 border-amber-800/20"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{TEXT_CONTENT.market.filters.category}</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={selectedCategory === null ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory(null)}
                    >
                      {TEXT_CONTENT.market.filters.categories.all}
                    </Badge>
                    <Badge
                      variant={selectedCategory === "terrain" ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory("terrain")}
                    >
                      {TEXT_CONTENT.market.filters.categories.terrain}
                    </Badge>
                    <Badge
                      variant={selectedCategory === "special" ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory("special")}
                    >
                      {TEXT_CONTENT.market.filters.categories.special}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{TEXT_CONTENT.market.filters.rarity}</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={selectedRarity === null ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSelectedRarity(null)}
                    >
                      {TEXT_CONTENT.market.filters.rarities.all}
                    </Badge>
                    <Badge
                      variant={selectedRarity === "common" ? "default" : "outline"}
                      className="cursor-pointer bg-gray-500/50"
                      onClick={() => setSelectedRarity("common")}
                    >
                      {TEXT_CONTENT.market.filters.rarities.common}
                    </Badge>
                    <Badge
                      variant={selectedRarity === "uncommon" ? "default" : "outline"}
                      className="cursor-pointer bg-green-500/50"
                      onClick={() => setSelectedRarity("uncommon")}
                    >
                      {TEXT_CONTENT.market.filters.rarities.uncommon}
                    </Badge>
                    <Badge
                      variant={selectedRarity === "rare" ? "default" : "outline"}
                      className="cursor-pointer bg-blue-500/50"
                      onClick={() => setSelectedRarity("rare")}
                    >
                      {TEXT_CONTENT.market.filters.rarities.rare}
                    </Badge>
                    <Badge
                      variant={selectedRarity === "epic" ? "default" : "outline"}
                      className="cursor-pointer bg-purple-500/50"
                      onClick={() => setSelectedRarity("epic")}
                    >
                      {TEXT_CONTENT.market.filters.rarities.epic}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="medieval-card">
              <CardHeader>
                <CardTitle className="font-serif">{TEXT_CONTENT.market.cart.title}</CardTitle>
                <CardDescription>{TEXT_CONTENT.market.cart.items.replace("{count}", String(cart.length))}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{TEXT_CONTENT.market.cart.empty}</p>
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
                              onPurchase={() => { }}
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
                  <p className="text-sm font-medium">{TEXT_CONTENT.market.cart.total}</p>
                  <p className="text-lg font-bold text-amber-500">{TEXT_CONTENT.market.cart.gold.replace("{amount}", String(totalCost))}</p>
                </div>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                  onClick={purchaseTiles}
                  disabled={cart.length === 0}
                >
                  {TEXT_CONTENT.market.cart.purchase}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">{TEXT_CONTENT.market.list.title}</h2>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{TEXT_CONTENT.market.list.count.replace("{count}", String(filteredTiles.length))}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTiles.map((tile) => (
                <Card key={tile.id} className="bg-black border-amber-800/20 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200">
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
                        onPurchase={() => { }}
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
                        {TEXT_CONTENT.market.list.addToCart}
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

