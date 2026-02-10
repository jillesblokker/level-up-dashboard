"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Coins, TrendingUp, TrendingDown, Package, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { getCharacterStats, addToCharacterStat, fetchFreshCharacterStats } from "@/lib/character-stats-service"
import { useUser } from "@clerk/nextjs"
import { useRealmInventory } from '@/hooks/use-realm-inventory'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TileType } from "@/types/tiles"

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

export default function MarketPage() {
  const { user } = useUser()
  const [goldBalance, setGoldBalance] = useState(0)
  const { inventoryAsItems, updateTileQuantity } = useRealmInventory(user?.id, true)
  const [activeTab, setActiveTab] = useState("buy")

  // Transaction state
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
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

  const getInventoryQuantity = (materialId: string) => {
    const item = inventoryAsItems.find(i => i.id === materialId || i.id === materialId.replace('material-', ''))
    // Also check for type match if ID match fails (legacy support)
    if (!item) {
      const byType = inventoryAsItems.find(i => i.type === materialId as any);
      return byType?.quantity || 0;
    }
    return item ? (item.quantity || 0) : 0
  }

  const handleQuantityChange = (id: string, value: string) => {
    const qty = parseInt(value)
    if (isNaN(qty) || qty < 0) {
      setQuantities(prev => ({ ...prev, [id]: 0 }))
    } else {
      setQuantities(prev => ({ ...prev, [id]: qty }))
    }
  }

  const handleBuy = async (material: typeof MATERIALS[0]) => {
    const qty = quantities[material.id] || 1
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

    // Update inventory (add)
    // We explicitly cast to TileType as these are pseudo-tiles
    updateTileQuantity(material.id as TileType, qty)

    setGoldBalance(prev => prev - totalCost)
    toast({
      title: "Purchase Successful",
      description: `Bought ${qty} ${material.name} for ${totalCost} gold.`
    })
    setQuantities(prev => ({ ...prev, [material.id]: 0 }))
  }

  const handleSell = async (material: typeof MATERIALS[0]) => {
    const qty = quantities[material.id] || 1
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
    // Update inventory (remove)
    updateTileQuantity(material.id as TileType, -qty)

    // Add gold
    addToCharacterStat('gold', totalValue, 'market-sell-material')
    setGoldBalance(prev => prev + totalValue) // Optimistic update

    toast({
      title: "Sale Successful",
      description: `Sold ${qty} ${material.name} for ${totalValue} gold.`
    })
    setQuantities(prev => ({ ...prev, [material.id]: 0 }))
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white font-sans">
      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-amber-500 font-serif">Royal Exchange</h1>
            <p className="text-slate-400 mt-1">Trade standard construction materials and resources.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-300">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Kingdom
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full h-auto max-w-xl mx-auto grid-cols-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
            <TabsTrigger value="buy" className="text-lg data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg transition-all">
              <ShoppingBag className="w-5 h-5 mr-2" /> Buy Materials
            </TabsTrigger>
            <TabsTrigger value="sell" className="text-lg data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-lg transition-all">
              <TrendingUp className="w-5 h-5 mr-2" /> Sell Resources
            </TabsTrigger>
          </TabsList>

          {/* BUY TAB */}
          <TabsContent value="buy">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {MATERIALS.map((material) => (
                <Card key={material.id} className="bg-slate-900 border-slate-800 hover:border-amber-500/50 transition-all duration-300 shadow-lg group h-full flex flex-col">
                  <CardHeader className="pb-3 border-b border-slate-800 bg-slate-900/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Package className="w-16 h-16 text-amber-500" />
                    </div>
                    <CardTitle className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl filter drop-shadow-md">{material.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-amber-100">{material.name}</span>
                          <span className="text-xs text-slate-400 font-normal">{material.description}</span>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4 flex-1">
                    <div className="flex justify-between items-center text-sm text-slate-400 bg-black/20 p-2 rounded-lg">
                      <span>In Inventory:</span>
                      <span className="font-mono text-white font-bold">{getInventoryQuantity(material.id)}</span>
                    </div>

                    <div className="flex items-end gap-3">
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Quantity</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="bg-black/40 border-slate-700 focus:border-amber-500 text-lg font-mono text-center"
                          value={quantities[material.id] || ''}
                          onChange={(e) => handleQuantityChange(material.id, e.target.value)}
                        />
                      </div>
                      <div className="flex-1 space-y-2 text-right">
                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Cost</label>
                        <div className="text-lg font-bold text-amber-500 font-mono flex items-center justify-end gap-1 h-10">
                          {(quantities[material.id] || 0) * material.buyPrice} <Coins className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button
                      className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold h-12 shadow-lg shadow-amber-900/20"
                      onClick={() => handleBuy(material)}
                      disabled={(quantities[material.id] || 0) <= 0 || goldBalance < ((quantities[material.id] || 0) * material.buyPrice)}
                    >
                      Buy for {material.buyPrice} G / unit
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* SELL TAB */}
          <TabsContent value="sell">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {MATERIALS.map((material) => (
                <Card key={material.id} className="bg-slate-900 border-slate-800 hover:border-green-500/50 transition-all duration-300 shadow-lg group h-full flex flex-col">
                  <CardHeader className="pb-3 border-b border-slate-800 bg-slate-900/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <TrendingUp className="w-16 h-16 text-green-500" />
                    </div>
                    <CardTitle className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl filter drop-shadow-md">{material.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-slate-100">{material.name}</span>
                          <span className="text-xs text-slate-400 font-normal">{material.description}</span>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4 flex-1">
                    <div className="flex justify-between items-center text-sm text-slate-400 bg-black/20 p-2 rounded-lg">
                      <span>Available for Sale:</span>
                      <span className="font-mono text-white font-bold">{getInventoryQuantity(material.id)}</span>
                    </div>

                    <div className="flex items-end gap-3">
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Quantity</label>
                        <Input
                          type="number"
                          min="0"
                          max={getInventoryQuantity(material.id)}
                          placeholder="0"
                          className="bg-black/40 border-slate-700 focus:border-green-500 text-lg font-mono text-center"
                          value={quantities[material.id] || ''}
                          onChange={(e) => handleQuantityChange(material.id, e.target.value)}
                        />
                      </div>
                      <div className="flex-1 space-y-2 text-right">
                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Value</label>
                        <div className="text-lg font-bold text-green-400 font-mono flex items-center justify-end gap-1 h-10">
                          {(quantities[material.id] || 0) * material.sellPrice} <Coins className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button
                      className="w-full bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 text-white font-bold h-12 shadow-lg shadow-green-900/20"
                      onClick={() => handleSell(material)}
                      disabled={(quantities[material.id] || 0) <= 0 || getInventoryQuantity(material.id) < (quantities[material.id] || 0)}
                    >
                      Sell for {material.sellPrice} G / unit
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
