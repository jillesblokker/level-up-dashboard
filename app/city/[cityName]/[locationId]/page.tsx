"use client"

import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getCityData } from "@/lib/city-data"
import { HeaderSection } from "@/components/HeaderSection"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Users, Trophy, UserPlus, Coins, Shield, Sword, ShoppingBag, Plus, Minus, Info, Flame, Sparkles, Package } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import dynamic from 'next/dynamic'
import { useUser } from "@clerk/nextjs"
import { getCharacterStats, addToCharacterStat, fetchFreshCharacterStats } from "@/lib/character-stats-service"
import { addToKingdomInventory } from "@/lib/inventory-manager"
import { spendGold } from "@/lib/gold-manager"
import { useRealmInventory } from "@/hooks/use-realm-inventory"
import { TileType } from "@/types/tiles"
import { PACK_TYPES, generatePack } from "@/lib/pack-generator"
import { PackOpeningModal } from "@/components/pack-opening-modal"
import { formatGold } from "@/lib/utils"

function TavernBannerIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
}

// Import Social Components dynamically to avoid initialization order issues
const AllianceDashboard = dynamic(() => import("@/components/alliance-dashboard"), { 
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center text-amber-500/50 animate-pulse">Loading Alliance Data...</div>
})
const Leaderboard = dynamic(() => import("@/components/leaderboard"), { 
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center text-amber-500/50 animate-pulse">Loading Leaderboards...</div>
})
const AlliesDashboard = dynamic(() => import("@/components/allies-dashboard"), { 
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center text-amber-500/50 animate-pulse">Loading Allies...</div>
})

// Define available materials for trade
const MATERIALS = [
  { id: 'material-water', name: 'Water', icon: '💧', buyPrice: 200, sellPrice: 100, description: 'Essential for life and growth.' },
  { id: 'material-logs', name: 'Logs', icon: '🪵', buyPrice: 300, sellPrice: 150, description: 'Raw wood for construction.' },
  { id: 'material-stone', name: 'Stone', icon: '🪨', buyPrice: 400, sellPrice: 200, description: 'Heavy stone for foundations.' },
  { id: 'material-planks', name: 'Planks', icon: '🪚', buyPrice: 550, sellPrice: 275, description: 'Refined wood for structures.' },
  { id: 'material-stone-block', name: 'Blocks', icon: '🧱', buyPrice: 700, sellPrice: 350, description: 'Cut stone for walls.' },
  { id: 'material-steel', name: 'Steel', icon: '⚔️', buyPrice: 850, sellPrice: 425, description: 'Strong metal for reinforcements.' },
  { id: 'material-crystal', name: 'Crystal', icon: '🔮', buyPrice: 1000, sellPrice: 500, description: 'Rare magical resource.' },
]

export default function CityLocationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const initialTab = searchParams?.get('tab') || 'alliances'
  
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [goldBalance, setGoldBalance] = useState(0)
  const [tradeQuantities, setTradeQuantities] = useState<Record<string, number>>({})
  const [openingPack, setOpeningPack] = useState<any>(null)

  // Fetch materials inventory
  const { inventoryAsItems, updateTileQuantity } = useRealmInventory(user?.id, true)

  useEffect(() => {
    setMounted(true)
    
    // Initial stats fetch
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
    return () => window.removeEventListener('character-stats-update', handleStatsUpdate)
  }, [user])

  useEffect(() => {
    const tabAtUrl = searchParams?.get('tab')
    if (tabAtUrl && tabAtUrl !== activeTab) {
      setActiveTab(tabAtUrl)
    }
  }, [searchParams, activeTab])

  if (!mounted || !params) {
    return (
      <div className="flex min-h-screen bg-black items-center justify-center">
        <div className="text-amber-500 animate-pulse font-medieval tracking-widest uppercase">Approaching the City Gates...</div>
      </div>
    )
  }

  const cityName = params['cityName'] as string
  const locationId = params['locationId'] as string
  const cityData = getCityData(cityName)
  const location = cityData?.locations.find(l => l.id === locationId)

  if (!cityData || !location) {
    return (
      <div className="p-20 text-center text-white bg-black min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-medieval mb-6 text-amber-950/80 italic">The mists obscure this path... {locationId}</h1>
        <Link href="/realm">
          <Button variant="outline" className="border-amber-800/40 text-amber-500 hover:bg-amber-950/20">
            Return to Map
          </Button>
        </Link>
      </div>
    )
  }

  const isTavern = locationId === 'tavern' || locationId === 'dragons-rest'

  // Items for Kingdom Marketplace
  const marketplaceWares = [
    { id: "tome-knowledge", name: "Tome of Knowledge", description: "Contains ancient wisdom to gain experience.", price: 150, emoji: "📖", category: "book" },
    { id: "magic-scroll", name: "Magic Scroll", description: "A parchment containing raw magical energy.", price: 80, emoji: "📜", category: "scroll" },
    { id: "ancient-artifact", name: "Ancient Artifact", description: "A mysterious relic from a bygone era.", price: 250, emoji: "👑", category: "artifact" },
    { id: "merchants-charm", name: "Merchant's Charm", description: "Boosts your luck in gaining extra gold.", price: 120, emoji: "🧿", category: "charm" }
  ]

  // Items for Blacksmith (Ember's Anvil)
  const blacksmithWares = [
    { id: "iron-sword", name: "Iron Sword", description: "A sturdy blade forged in dragonfire.", price: 90, emoji: "⚔️", stats: { attack: 5 } },
    { id: "steel-shield", name: "Steel Shield", description: "Provides excellent protection against enemy attacks.", price: 110, emoji: "🛡️", stats: { defense: 6 } },
    { id: "leather-armor", name: "Leather Armor", description: "Lightweight and flexible protection.", price: 100, emoji: "🥋", stats: { defense: 4 } },
    { id: "dragonscale-mail", name: "Dragonscale Mail", description: "Extremely rare armor forged from real dragon scales.", price: 450, emoji: "🎴", stats: { defense: 15, fireResistance: 50 } }
  ]

  // Items for Royal Stables
  const stablesWares = [
    { id: "draft-horse", name: "Draft Horse", description: "A strong and reliable horse for travel.", price: 150, emoji: "🐎", stats: { movement: 3 } },
    { id: "war-steed", name: "War Steed", description: "A trained combat steed that increases speed.", price: 300, emoji: "🏇", stats: { movement: 5, attack: 2 } },
    { id: "swift-pegasus", name: "Swift Pegasus", description: "A mythical winged horse that can fly across realms.", price: 600, emoji: "🦄", stats: { movement: 8 } }
  ]

  // Helpers for resource quantity tracking
  const getInventoryQuantity = (materialId: string) => {
    const item = inventoryAsItems.find(i => i.id === materialId || i.id === materialId.replace('material-', ''))
    if (!item) {
      const byType = inventoryAsItems.find(i => i.type === materialId as any);
      return byType?.quantity || 0;
    }
    return item ? (item.quantity || 0) : 0
  }

  const handleQuantityChange = (id: string, value: number) => {
    setTradeQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, value)
    }))
  }

  // Handle generic shop item purchase
  const handleItemPurchase = async (item: any) => {
    if (goldBalance < item.price) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${item.price} gold to purchase this item.`,
        variant: "destructive"
      })
      return
    }

    const success = await spendGold(item.price, `purchase-${item.id}`);
    if (success) {
      if (user?.id) {
        addToKingdomInventory(user.id, {
          id: item.id,
          name: item.name,
          description: item.description,
          type: item.stats ? 'equipment' : 'item',
          category: item.category || 'item',
          quantity: 1,
          emoji: item.emoji,
          stats: item.stats || {}
        })
      }
      setGoldBalance(prev => prev - item.price)
      toast({
        title: "Purchase Successful",
        description: `Bought 1x ${item.name} for ${item.price} gold. Item added to your inventory!`,
      })
      window.dispatchEvent(new Event('character-inventory-update'))
      window.dispatchEvent(new Event('character-stats-update'))
    }
  }

  // Materials trading flows
  const handleBuyMaterial = async (material: typeof MATERIALS[0]) => {
    const qty = tradeQuantities[material.id] || 1
    const totalCost = qty * material.buyPrice

    if (qty <= 0) return

    if (goldBalance < totalCost) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${totalCost} gold for this purchase.`,
        variant: "destructive"
      })
      return
    }

    // Process transaction
    addToCharacterStat('gold', -totalCost, 'market-buy-material')
    updateTileQuantity(material.id as TileType, qty)
    setGoldBalance(prev => prev - totalCost)

    toast({
      title: "Purchase Successful",
      description: `Bought ${qty} ${material.name} for ${totalCost} gold.`
    })
    setTradeQuantities(prev => ({ ...prev, [material.id]: 0 }))
    window.dispatchEvent(new Event('character-stats-update'))
  }

  const handleSellMaterial = async (material: typeof MATERIALS[0]) => {
    const qty = tradeQuantities[material.id] || 1
    const totalValue = qty * material.sellPrice
    const currentOwned = getInventoryQuantity(material.id)

    if (qty <= 0) return

    if (currentOwned < qty) {
      toast({
        title: "Insufficient Materials",
        description: `You only have ${currentOwned} ${material.name}.`,
        variant: "destructive"
      })
      return
    }

    // Process transaction
    updateTileQuantity(material.id as TileType, -qty)
    addToCharacterStat('gold', totalValue, 'market-sell-material')
    setGoldBalance(prev => prev + totalValue)

    toast({
      title: "Sale Successful",
      description: `Sold ${qty} ${material.name} for ${totalValue} gold.`
    })
    setTradeQuantities(prev => ({ ...prev, [material.id]: 0 }))
    window.dispatchEvent(new Event('character-stats-update'))
  }

  // Pack buying flow
  const handleBuyPack = (packType: typeof PACK_TYPES[0]) => {
    if (goldBalance < packType.price) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${packType.price} gold to buy this pack.`,
        variant: "destructive"
      })
      return
    }

    // Deduct gold
    addToCharacterStat('gold', -packType.price, `market-buy-${packType.id}`)
    setGoldBalance(prev => prev - packType.price)
    
    // Generate and open pack
    const pack = generatePack(packType.id)
    setOpeningPack(pack)
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <HeaderSection
        title={location.name}
        subtitle={location.subtitle}
        imageSrc={location.image}
        shouldRevealImage={true}
        defaultBgColor="bg-amber-950"
      />

      <main className="flex-1 p-4 md:p-6 pb-24 lg:landscape:pb-8 max-w-6xl mx-auto w-full relative">
        <div className="flex items-center justify-between mb-8 relative z-10">
          <Link href={`/city/${cityName}`}>
            <Button variant="ghost" className="text-amber-500 hover:text-amber-400 font-medieval group">
              <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Return to {cityData.name}
            </Button>
          </Link>

          {/* Current Gold HUD */}
          <div className="flex items-center gap-3 bg-zinc-950 border border-amber-900/50 p-2.5 px-4 rounded-xl shadow-lg ">
            <Coins className="h-5 w-5 text-amber-400 animate-pulse" />
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Your Treasury</p>
              <p className="text-base font-serif font-bold text-amber-200" title={`${goldBalance.toLocaleString()} Gold`}>
                {formatGold(goldBalance)} <span className="text-xs text-amber-600">Gold</span>
              </p>
            </div>
          </div>
        </div>

        {isTavern ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full md:w-auto mb-12">
                <TabsTrigger value="alliances">
                  <Users className="w-4 h-4" />
                  Alliances
                </TabsTrigger>
                <TabsTrigger value="allies">
                  <UserPlus className="w-4 h-4" />
                  Ally Board
                </TabsTrigger>
                <TabsTrigger value="leaderboard">
                  <Trophy className="w-4 h-4" />
                  Legends
                </TabsTrigger>
              </TabsList>

              <TabsContent value="alliances" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <AllianceDashboard />
              </TabsContent>
              
              <TabsContent value="allies" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <AlliesDashboard />
              </TabsContent>
              
              <TabsContent value="leaderboard" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <Leaderboard />
              </TabsContent>
            </Tabs>
          </div>
        ) : locationId === 'marketplace' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="border border-amber-900/10 bg-gradient-to-br from-zinc-950 to-zinc-900/50 rounded-3xl p-6 md:p-8 relative overflow-hidden mb-8 shadow-2xl">
              <div className="absolute top-0 right-0 p-8 text-amber-500/10 pointer-events-none">
                <ShoppingBag className="w-40 h-40" />
              </div>
              <h2 className="text-3xl font-serif text-amber-400 mb-2">Grand City Bazaar</h2>
              <p className="text-zinc-400 max-w-2xl font-serif">Trade construction supplies, purchase ancient magic relics, or try your luck with premium reward packs.</p>
            </div>

            <Tabs defaultValue="wares" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="wares">relics & wares</TabsTrigger>
                <TabsTrigger value="resources">resource trading</TabsTrigger>
                <TabsTrigger value="packs" className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  scratch packs
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Relics & Wares */}
              <TabsContent value="wares" className="mt-0 outline-none">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {marketplaceWares.map((item) => (
                    <Card key={item.id} className="border-amber-900/20 bg-zinc-950 hover:bg-zinc-950 transition-all hover:border-amber-500/30 flex flex-col group relative overflow-hidden shadow-lg">
                      <div className="h-44 flex items-center justify-center bg-zinc-950 text-6xl relative border-b border-amber-900/10 group-hover:scale-105 transition-transform duration-300">
                        {item.emoji}
                      </div>
                      <CardHeader className="p-4 flex-1">
                        <CardTitle className="text-amber-200 text-lg group-hover:text-amber-400 transition-colors">{item.name}</CardTitle>
                        <CardDescription className="text-zinc-400 text-xs mt-1 leading-relaxed">{item.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="p-4 border-t border-amber-900/10 bg-zinc-950 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-amber-500" />
                          <span className="font-bold font-serif text-amber-200 text-sm">{item.price}</span>
                        </div>
                        <Button 
                          onClick={() => handleItemPurchase(item)}
                          disabled={goldBalance < item.price}
                          className="bg-amber-950 border border-amber-800/40 text-amber-400 hover:bg-amber-900 hover:text-white rounded-lg px-4 text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                          Buy
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* TAB 2: Resource Trading */}
              <TabsContent value="resources" className="mt-0 outline-none">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {MATERIALS.map((material) => {
                    const owned = getInventoryQuantity(material.id)
                    const qty = tradeQuantities[material.id] || 0
                    const isQtyValid = qty > 0

                    return (
                      <Card key={material.id} className="border-amber-900/20 bg-zinc-950 flex flex-col shadow-lg">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{material.icon}</span>
                              <CardTitle className="text-amber-200 text-base">{material.name}</CardTitle>
                            </div>
                            <Badge className="bg-amber-950/80 border-amber-900/50 text-amber-400 text-[10px] font-bold uppercase tracking-widest px-2.5">
                              Owned: {owned}
                            </Badge>
                          </div>
                          <CardDescription className="text-zinc-400 text-xs mt-1">{material.description}</CardDescription>
                        </CardHeader>
                        
                        <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-end space-y-4">
                          <div className="flex items-center justify-between bg-zinc-950 border border-amber-900/10 p-2 rounded-xl">
                            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider pl-2">Quantity</span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuantityChange(material.id, qty - 1)}
                                className="h-8 w-8 text-zinc-400 hover:text-white"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </Button>
                              <Input
                                type="number"
                                min="0"
                                value={qty || ""}
                                onChange={(e) => handleQuantityChange(material.id, parseInt(e.target.value) || 0)}
                                className="h-8 w-12 text-center bg-black border-amber-900/30 text-white p-0 text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuantityChange(material.id, qty + 1)}
                                className="h-8 w-8 text-zinc-400 hover:text-white"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              onClick={() => handleBuyMaterial(material)}
                              disabled={!isQtyValid || goldBalance < (qty * material.buyPrice)}
                              className="bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-800/40 rounded-xl py-5 font-bold uppercase text-[11px] tracking-wider transition-all"
                            >
                              Buy ({qty * material.buyPrice}g)
                            </Button>
                            <Button
                              onClick={() => handleSellMaterial(material)}
                              disabled={!isQtyValid || owned < qty}
                              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl py-5 font-bold uppercase text-[11px] tracking-wider transition-all"
                            >
                              Sell ({qty * material.sellPrice}g)
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>

              {/* TAB 3: Scratch Cards */}
              <TabsContent value="packs" className="mt-0 outline-none">
                <div className="grid gap-6 sm:grid-cols-3">
                  {PACK_TYPES.map((pack) => (
                    <Card key={pack.id} className="border-amber-900/30 bg-gradient-to-b from-zinc-950/80 to-zinc-950/40 flex flex-col relative overflow-hidden shadow-2xl group">
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-amber-900 opacity-60" />
                      <CardHeader className="p-6 text-center">
                        <div className="w-14 h-14 bg-amber-950/50 border border-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-amber-400 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                          <Package className="w-6 h-6" />
                        </div>
                        <Badge className="bg-amber-950 text-amber-500 border border-amber-900/30 text-[9px] font-bold tracking-widest px-2 uppercase mb-2">
                          {pack.shortLabel}
                        </Badge>
                        <CardTitle className="text-amber-200 text-xl font-serif">{pack.title}</CardTitle>
                        <CardDescription className="text-zinc-500 text-xs mt-1">{pack.subtitle}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="px-6 pb-6 text-center flex-1">
                        <p className="text-zinc-400 text-xs leading-relaxed italic">{pack.description}</p>
                      </CardContent>

                      <CardFooter className="p-6 border-t border-amber-900/10 bg-zinc-950 flex flex-col gap-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span className="font-serif font-bold text-amber-200 text-lg">{pack.price}</span>
                          <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold">Gold</span>
                        </div>
                        <Button
                          onClick={() => handleBuyPack(pack)}
                          disabled={goldBalance < pack.price}
                          className="w-full bg-gradient-to-r from-amber-800 to-amber-950 text-amber-100 hover:from-amber-700 hover:to-amber-900 border border-amber-700/50 rounded-xl py-6 font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-950/20"
                        >
                          Purchase Pack
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : locationId === 'embers-anvil' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="border border-red-900/20 bg-gradient-to-br from-zinc-950 via-zinc-950 to-red-950/10 rounded-3xl p-6 md:p-8 relative overflow-hidden mb-8 shadow-2xl">
              <div className="absolute top-0 right-0 p-8 text-red-500/5 pointer-events-none">
                <Flame className="w-40 h-40 animate-pulse" />
              </div>
              <h2 className="text-3xl font-serif text-red-400 mb-2">Ember&apos;s Forge</h2>
              <p className="text-zinc-400 max-w-2xl font-serif">Equip your character with powerful swords, armor, and shields forged from dragonfire. Prepare for battles and expeditions in the dungeons.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {blacksmithWares.map((item) => (
                <Card key={item.id} className="border-red-900/20 bg-zinc-950 hover:bg-zinc-950 transition-all hover:border-red-500/30 flex flex-col group relative overflow-hidden shadow-lg">
                  <div className="h-44 flex items-center justify-center bg-zinc-950 text-6xl relative border-b border-red-900/10 group-hover:scale-105 transition-transform duration-300">
                    {item.emoji}
                  </div>
                  <CardHeader className="p-4 flex-1">
                    <CardTitle className="text-red-200 text-lg group-hover:text-red-400 transition-colors">{item.name}</CardTitle>
                    <CardDescription className="text-zinc-400 text-xs mt-1 leading-relaxed">{item.description}</CardDescription>
                    
                    <div className="flex items-center gap-1.5 mt-3">
                      {item.stats.attack && (
                        <Badge className="bg-red-950 border-red-900 text-red-400 text-[9px] font-bold tracking-widest px-2 py-0.5">
                          ATK +{item.stats.attack}
                        </Badge>
                      )}
                      {item.stats.defense && (
                        <Badge className="bg-blue-950 border-blue-900 text-blue-400 text-[9px] font-bold tracking-widest px-2 py-0.5">
                          DEF +{item.stats.defense}
                        </Badge>
                      )}
                      {item.stats.fireResistance && (
                        <Badge className="bg-orange-950 border-orange-900 text-orange-400 text-[9px] font-bold tracking-widest px-2 py-0.5">
                          FIRE RESIST +{item.stats.fireResistance}%
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardFooter className="p-4 border-t border-red-900/10 bg-zinc-950 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span className="font-bold font-serif text-amber-200 text-sm">{item.price}</span>
                    </div>
                    <Button 
                      onClick={() => handleItemPurchase(item)}
                      disabled={goldBalance < item.price}
                      className="bg-red-950 border border-red-800/40 text-red-400 hover:bg-red-900 hover:text-white rounded-lg px-4 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Forge
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ) : locationId === 'royal-stables' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="border border-amber-900/20 bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/10 rounded-3xl p-6 md:p-8 relative overflow-hidden mb-8 shadow-2xl">
              <h2 className="text-3xl font-serif text-amber-500 mb-2">Royal Stables</h2>
              <p className="text-zinc-400 max-w-2xl font-serif">Purchase majestic steeds and mounts to explore the realm. Stables offer mounts that increase your overland movement speed and stats.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {stablesWares.map((item) => (
                <Card key={item.id} className="border-amber-900/20 bg-zinc-950 hover:bg-zinc-950 transition-all hover:border-amber-500/30 flex flex-col group relative overflow-hidden shadow-lg">
                  <div className="h-48 flex items-center justify-center bg-zinc-950 text-7xl relative border-b border-amber-900/10 group-hover:scale-105 transition-transform duration-300">
                    {item.emoji}
                  </div>
                  <CardHeader className="p-5 flex-1">
                    <CardTitle className="text-amber-200 text-xl group-hover:text-amber-400 transition-colors">{item.name}</CardTitle>
                    <CardDescription className="text-zinc-400 text-xs mt-1.5 leading-relaxed">{item.description}</CardDescription>
                    
                    <div className="flex items-center gap-1.5 mt-3">
                      {item.stats.movement && (
                        <Badge className="bg-amber-950 border-amber-900 text-amber-400 text-[10px] font-bold tracking-widest px-2.5 py-1">
                          MOVEMENT +{item.stats.movement}
                        </Badge>
                      )}
                      {item.stats.attack && (
                        <Badge className="bg-red-950 border-red-900 text-red-400 text-[10px] font-bold tracking-widest px-2.5 py-1">
                          ATK +{item.stats.attack}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardFooter className="p-5 border-t border-amber-900/10 bg-zinc-950 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span className="font-bold font-serif text-amber-200 text-base">{item.price}</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Gold</span>
                    </div>
                    <Button 
                      onClick={() => handleItemPurchase(item)}
                      disabled={goldBalance < item.price}
                      className="bg-amber-950 border border-amber-800/40 text-amber-400 hover:bg-amber-900 hover:text-white rounded-lg px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Acquire
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 border border-dashed border-amber-900/30 rounded-3xl bg-amber-950/5 text-center space-y-6">
            <div className="p-6 bg-amber-900/10 rounded-full">
              <TavernBannerIcon className="w-12 h-12 text-amber-900/40" />
            </div>
            <h2 className="text-3xl font-medieval text-amber-500">{location.name}</h2>
            <p className="text-zinc-500 max-w-sm font-serif leading-relaxed italic">
              {location.description}
            </p>
            <div className="pt-8 flex flex-col items-center gap-1">
              <span className="text-amber-500/30 font-medieval text-xs tracking-widest uppercase">The builders are hard at work</span>
              <div className="w-32 h-1 bg-amber-900/20 rounded-full overflow-hidden">
                <div className="h-full bg-amber-700/40 w-1/3 animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Dynamic Pack Opening Overlay */}
      {openingPack && (
        <PackOpeningModal
          packData={openingPack}
          onClose={() => {
            setOpeningPack(null)
            // Trigger stats/inventory updates
            window.dispatchEvent(new Event('character-stats-update'))
            window.dispatchEvent(new Event('character-inventory-update'))
          }}
          onClaimed={() => {
            toast({
              title: "Card Claimed!",
              description: "It has been added to your Mythics collection."
            })
          }}
        />
      )}

      {/* Decorative side vignetting */}
      <div className="fixed inset-y-0 left-0 w-32 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
      <div className="fixed inset-y-0 right-0 w-32 bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
    </div>
  )
}
