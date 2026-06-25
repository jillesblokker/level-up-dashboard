"use client"

import { logger } from "@/lib/logger";

import React from "react"
import { useState, useEffect } from "react"
import { ChevronLeft, Coins } from "lucide-react"
import { useParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { addToKingdomInventory } from '@/lib/inventory-manager'
import { getCharacterStats } from '@/lib/character-stats-service'
import { spendGold } from '@/lib/gold-manager'
import { ShopItemCard } from "@/components/shop-item-card"
import {
  POTION_ITEMS, SCROLL_ITEMS, FOOD_ITEMS, ARTIFACT_ITEMS,
  BLACKSMITH_WEAPONS, BLACKSMITH_SHIELDS, BLACKSMITH_ARMOR,
  STABLE_ITEMS,
  type ShopItem,
} from "@/lib/shop-items"
import { formatGold } from "@/lib/utils"

export default function ShopPage() {
  const params = useParams()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [gold, setGold] = useState(0)

  useEffect(() => {
    // Load gold from character stats
    const stats = getCharacterStats()
    setGold(stats.gold)
    
    // Listen for gold updates
    const handleGoldUpdate = () => {
      const updatedStats = getCharacterStats()
      setGold(updatedStats.gold)
    }
    
    window.addEventListener('character-stats-update', handleGoldUpdate)
    return () => window.removeEventListener('character-stats-update', handleGoldUpdate)
  }, [])

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (!params) {
    return (
      <div className="container py-10" role="main" aria-label="shop-error-section">
        <Card aria-label="shop-error-card">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Unable to load shop information.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const cityName = params['cityName'] as string

  // Handle item purchase using the ShopItem type from comprehensive-items
  const handlePurchase = async (item: ShopItem) => {
    try {
      const success = await spendGold(item.cost, `purchase-${item.id}`);
      if (success) {
        if (user?.id) {
          addToKingdomInventory(user.id, {
            id: item.id,
            name: item.name,
            description: item.description,
            type: item.isEquippable ? 'equipment' : 'item',
            category: item.category || 'item',
            quantity: 1,
            image: item.image,
            emoji: item.emoji,
            stats: item.stats || {}
          })
        }
        setGold(prev => prev - item.cost)
        toast({
          title: "Purchase Successful",
          description: `Bought 1x ${item.name} for ${item.cost} gold!`,
        })
        window.dispatchEvent(new Event('character-inventory-update'))
        window.dispatchEvent(new Event('character-stats-update'))
      }
    } catch (error) {
      logger.error('Error purchasing item:', error);
    }
  }

  // Get the specific location image based on cityName
  const getLocationImage = (cityName: string) => {
    const locationImageMap: Record<string, string> = {
      'embers-anvil': '/images/locations/embers-anvil.webp',
      'kingdom-marketplace': '/images/locations/kingdom-marketplace.webp',
      'royal-stables': '/images/locations/royal-stables.webp',
      'the-dragons-rest': '/images/locations/the-dragons-rest-tavern.webp',
      'blacksmith': '/images/locations/embers-anvil.webp',
      'marketplace': '/images/locations/kingdom-marketplace.webp',
      'library': '/images/locations/library.webp',
      'inn': '/images/locations/inn.webp'
    }
    
    return locationImageMap[cityName] || '/images/locations/market.webp'
  }

  const locationImage = getLocationImage(cityName)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => window.history.back()} className="border-amber-900/40 text-amber-500 hover:bg-amber-950/30">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-serif font-bold text-amber-400">City Market</h1>
          </div>

          {/* Gold HUD */}
          <div className="flex items-center gap-3 bg-zinc-950 border border-amber-900/50 p-2.5 px-4 rounded-xl shadow-lg">
            <Coins className="h-5 w-5 text-amber-400 animate-pulse" />
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Treasury</p>
              <p className="text-base font-serif font-bold text-amber-200">
                {formatGold(gold)} <span className="text-xs text-amber-600">Gold</span>
              </p>
            </div>
          </div>
        </div>

        {/* Cover Image Banner */}
        <div className="relative w-full h-[250px] rounded-2xl overflow-hidden border border-amber-900/20 mb-8 shadow-2xl">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${locationImage})` }}
            aria-label="shop-cover-image"
            role="img"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-black/80">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <h2 className="text-4xl font-bold mb-2 font-serif text-amber-500 drop-shadow-lg">City Market</h2>
              <p className="text-lg text-zinc-300 max-w-2xl text-center">Browse wares from local merchants in {cityName}</p>
            </div>
          </div>
        </div>
      
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" aria-label="shop-items-loading-grid">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="overflow-hidden bg-zinc-950 border-zinc-800/50" aria-label={`loading-card-${i}`}>
              <div className="h-48 bg-zinc-900 animate-pulse" aria-hidden="true" />
              <CardHeader>
                <div className="h-6 w-2/3 bg-zinc-800 animate-pulse rounded" aria-hidden="true" />
                <div className="h-4 w-full bg-zinc-800 animate-pulse rounded mt-2" aria-hidden="true" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="potions" className="w-full">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="potions">Potions</TabsTrigger>
            <TabsTrigger value="scrolls">Scrolls</TabsTrigger>
            <TabsTrigger value="food">Food</TabsTrigger>
            <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
            <TabsTrigger value="weapons">Weapons</TabsTrigger>
            <TabsTrigger value="shields">Shields</TabsTrigger>
            <TabsTrigger value="armor">Armor</TabsTrigger>
            <TabsTrigger value="mounts">Mounts</TabsTrigger>
          </TabsList>

          <TabsContent value="potions" className="mt-0 outline-none">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label="shop-cards-grid">
              {POTION_ITEMS.map((item) => (
                <ShopItemCard key={item.id} item={item} onPurchase={handlePurchase} disabled={gold < item.cost} accentColor="amber" actionLabel="Purchase" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scrolls" className="mt-0 outline-none">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {SCROLL_ITEMS.map((item) => (
                <ShopItemCard key={item.id} item={item} onPurchase={handlePurchase} disabled={gold < item.cost} accentColor="purple" actionLabel="Purchase" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="food" className="mt-0 outline-none">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {FOOD_ITEMS.map((item) => (
                <ShopItemCard key={item.id} item={item} onPurchase={handlePurchase} disabled={gold < item.cost} accentColor="emerald" actionLabel="Purchase" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="artifacts" className="mt-0 outline-none">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {ARTIFACT_ITEMS.map((item) => (
                <ShopItemCard key={item.id} item={item} onPurchase={handlePurchase} disabled={gold < item.cost} accentColor="purple" actionLabel="Purchase" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="weapons" className="mt-0 outline-none">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {BLACKSMITH_WEAPONS.map((item) => (
                <ShopItemCard key={item.id} item={item} onPurchase={handlePurchase} disabled={gold < item.cost} accentColor="red" actionLabel="Purchase" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="shields" className="mt-0 outline-none">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {BLACKSMITH_SHIELDS.map((item) => (
                <ShopItemCard key={item.id} item={item} onPurchase={handlePurchase} disabled={gold < item.cost} accentColor="blue" actionLabel="Purchase" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="armor" className="mt-0 outline-none">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {BLACKSMITH_ARMOR.map((item) => (
                <ShopItemCard key={item.id} item={item} onPurchase={handlePurchase} disabled={gold < item.cost} accentColor="red" actionLabel="Purchase" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mounts" className="mt-0 outline-none">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {STABLE_ITEMS.map((item) => (
                <ShopItemCard key={item.id} item={item} onPurchase={handlePurchase} disabled={gold < item.cost} accentColor="amber" actionLabel="Acquire" />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
      </div>
    </div>
  )
} 