"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Coins, Filter, Search, ShoppingCart, Store, Gavel, Tag, User } from "lucide-react"
import Link from "next/link"
import { getCharacterStats, addToCharacterStat, fetchFreshCharacterStats } from "@/lib/character-stats-service"
import { addTileToInventory } from "@/lib/tile-inventory-manager"
import { useUser } from "@clerk/nextjs"
import { setUserPreference } from "@/lib/user-preferences-manager"
import { TEXT_CONTENT } from "@/lib/text-content"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TileCard } from "@/components/tile-card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { OnboardingGuide } from "@/components/onboarding-guide"
import { useRealmInventory } from '@/hooks/use-realm-inventory'

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

interface MarketListing {
  id: string;
  seller_id: string;
  item_type: string;
  item_id: string;
  quantity: number;
  price: number;
  created_at: string;
}

export default function MarketPage() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("system-shop")
  const [goldBalance, setGoldBalance] = useState(1000)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null)
  const [cart, setCart] = useState<Tile[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Player Market State
  const [playerListings, setPlayerListings] = useState<MarketListing[]>([])
  const [isLoadingListings, setIsLoadingListings] = useState(false)
  const [sellPrice, setSellPrice] = useState<string>('')
  const [sellQuantity, setSellQuantity] = useState<string>('1')
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<string | null>(null)

  // Inventory Hook for 'Sell' tab
  const { inventoryAsItems } = useRealmInventory(user?.id, true)

  // System Shop Available Tiles
  const availableTiles: Tile[] = TEXT_CONTENT.market.data.tiles.map(tile => ({
    ...tile,
  })) as Tile[];

  useEffect(() => {
    // Onboarding Logic
    const allOnboardingDisabled = localStorage.getItem("all-onboarding-disabled")
    if (allOnboardingDisabled) {
      setShowOnboarding(false)
      return
    }
    const onboardingShown = localStorage.getItem("market-onboarding-shown")
    if (!onboardingShown) setShowOnboarding(true)

    if (user) setUserPreference('onboarding_market_visited', true)

    // Stats Logic
    const stats = getCharacterStats()
    setGoldBalance(stats.gold)
    fetchFreshCharacterStats().then(fresh => {
      if (fresh) setGoldBalance(fresh.gold)
    })

    const handleStatsUpdate = () => {
      const updated = getCharacterStats()
      setGoldBalance(updated.gold)
    }
    window.addEventListener('character-stats-update', handleStatsUpdate)

    // Fetch Player Listings
    fetchPlayerListings();

    return () => window.removeEventListener('character-stats-update', handleStatsUpdate)
  }, [user])

  const fetchPlayerListings = async () => {
    setIsLoadingListings(true);
    try {
      const res = await fetch('/api/market');
      const data = await res.json();
      if (res.ok) {
        setPlayerListings(data.listings || []);
      }
    } catch (e) {
      console.error("Failed to fetch market listings", e);
    } finally {
      setIsLoadingListings(false);
    }
  }

  const handleCreateListing = async () => {
    if (!selectedInventoryItem || !sellPrice || parseInt(sellPrice) <= 0) {
      toast({ title: "Invalid Listing", description: "Please select an item and a valid price.", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch('/api/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: 'tile', // Currently we only support selling tiles
          item_id: selectedInventoryItem,
          price: parseInt(sellPrice),
          quantity: parseInt(sellQuantity)
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: "Listing Created!", description: "Your item is now on the market." });
        setSellPrice('');
        setSelectedInventoryItem(null);
        fetchPlayerListings(); // Refresh
      } else {
        toast({ title: "Error", description: data.error || "Failed to create listing", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  }

  const handleCloseOnboarding = (dontShowAgain: boolean) => {
    setShowOnboarding(false)
    if (dontShowAgain) localStorage.setItem("market-onboarding-shown", "true")
  }

  // System Shop Logic
  const filteredTiles = availableTiles.filter((tile) => {
    const matchesSearch = tile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tile.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory ? tile.category === selectedCategory : true
    const matchesRarity = selectedRarity ? tile.rarity === selectedRarity : true
    return matchesSearch && matchesCategory && matchesRarity
  })

  const addToCart = (tile: Tile) => {
    setCart([...cart, tile])
    toast({ title: TEXT_CONTENT.market.toasts.added.title, description: TEXT_CONTENT.market.toasts.added.desc.replace("{name}", tile.name) })
  }

  const removeFromCart = (tileId: string) => {
    const index = cart.findIndex((item) => item.id === tileId)
    if (index !== -1) {
      const newCart = [...cart]
      newCart.splice(index, 1)
      setCart(newCart)
      toast({ title: TEXT_CONTENT.market.toasts.removed.title, description: TEXT_CONTENT.market.toasts.removed.desc })
    }
  }

  const totalCost = cart.reduce((total, item) => total + item.cost, 0)

  const purchaseTiles = () => {
    if (cart.length === 0 || goldBalance < totalCost) return // Validation logic handled in earlier steps or UI
    addToCharacterStat('gold', -totalCost, 'market-purchase')
    if (user?.id) {
      cart.forEach(tile => addTileToInventory(user.id, {
        id: tile.id,
        name: tile.name,
        type: tile.type as any,
        quantity: 1,
        cost: tile.cost,
        rarity: tile.rarity as any,
        category: tile.category as any,
        connections: tile.connections
      }))
    }
    setCart([])
    toast({ title: TEXT_CONTENT.market.toasts.success.title, description: "Purchase successful!" })
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">{TEXT_CONTENT.market.header.title}</h1>
            <p className="text-muted-foreground">{TEXT_CONTENT.market.header.subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-900/50 px-4 py-2 rounded-full border border-amber-800/20">
              <Coins className="w-5 h-5 text-yellow-500 mr-2" />
              <span className="text-xl font-bold text-yellow-500">{goldBalance.toLocaleString()}</span>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-amber-800/20 hover:bg-amber-900/20">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="system-shop" className="gap-2"><Store className="w-4 h-4" /> System Shop</TabsTrigger>
            <TabsTrigger value="player-market" className="gap-2"><Gavel className="w-4 h-4" /> Player Market</TabsTrigger>
          </TabsList>

          {/* SYSTEM SHOP TAB */}
          <TabsContent value="system-shop" className="space-y-6">
            <div className="flex justify-end mb-4">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black" onClick={purchaseTiles} disabled={cart.length === 0}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Checkout ({cart.length}) - {totalCost} G
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* FILTERS SIDEBAR */}
              <div className="space-y-4">
                <Card className="medieval-card">
                  <CardHeader>
                    <CardTitle className="font-serif">Search & Filter</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search..." className="pl-8 bg-gray-900 border-amber-800/20" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={selectedCategory === null ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedCategory(null)}>All</Badge>
                        <Badge variant={selectedCategory === "terrain" ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedCategory("terrain")}>Terrain</Badge>
                        <Badge variant={selectedCategory === "special" ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedCategory("special")}>Special</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* TILES GRID */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTiles.map((tile) => (
                  <Card key={tile.id} className="bg-black border-amber-800/20 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="aspect-square w-full rounded-md overflow-hidden mb-3 bg-gray-900/50 flex items-center justify-center">
                        {/* Simplified Tile View */}
                        <div className="text-center">
                          <div className="text-2xl mb-1">{tile.type === 'grass' ? '🌿' : tile.type === 'forest' ? '🌲' : tile.type === 'water' ? '💧' : tile.type === 'mountain' ? '🏔️' : '❓'}</div>
                          <p className="font-bold">{tile.name}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-amber-500 font-bold">{tile.cost} G</span>
                        <Button size="sm" variant="outline" onClick={() => addToCart(tile)}>Add to Cart</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* PLAYER MARKET TAB */}
          <TabsContent value="player-market" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* SELL SECTION */}
              <Card className="medieval-card h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5 text-green-500" /> Sell Your Items</CardTitle>
                  <CardDescription>List items for other players to buy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Item</label>
                    <select
                      className="w-full bg-gray-900 border border-amber-800/20 rounded-md p-2 text-sm"
                      onChange={(e) => setSelectedInventoryItem(e.target.value)}
                      value={selectedInventoryItem || ''}
                    >
                      <option value="">-- Choose an Item --</option>
                      {inventoryAsItems.filter(i => (i.quantity || 0) > 0).map(item => (
                        <option key={item.type} value={item.type}>
                          {item.name} ({item.quantity} owned)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price (Gold)</label>
                    <Input type="number" placeholder="100" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} />
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleCreateListing} disabled={!selectedInventoryItem}>
                    List Item
                  </Button>
                </CardContent>
              </Card>

              {/* BROWSE SECTION */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold font-serif">Active Listings</h2>
                  <Button variant="ghost" size="sm" onClick={fetchPlayerListings}>Refresh</Button>
                </div>

                {isLoadingListings ? (
                  <div className="text-center py-10 text-muted-foreground">Loading marketplace...</div>
                ) : playerListings.length === 0 ? (
                  <Card className="bg-gray-900/20 border-dashed border-gray-700 p-8 text-center text-muted-foreground">
                    No active listings found. Be the first to sell something!
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {playerListings.map(listing => (
                      <Card key={listing.id} className="bg-black border-amber-800/20">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-800 rounded-md flex items-center justify-center text-xl">
                              📦
                            </div>
                            <div>
                              <h4 className="font-bold text-amber-100 capitalize">{listing.item_id}</h4>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <User className="w-3 h-3" /> Seller {listing.seller_id.slice(0, 6)}...
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-yellow-500">{listing.price} G</div>
                            {user && listing.seller_id === user.id ? (
                              <Badge variant="secondary" className="mt-1">Yours</Badge>
                            ) : (
                              <Button size="sm" className="mt-1 h-7">Buy Now</Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <OnboardingGuide open={showOnboarding} onClose={handleCloseOnboarding} />
    </div>
  )
}
