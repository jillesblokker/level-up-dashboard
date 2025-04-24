"use client"

import React from "react"
import { useState, useEffect } from "react"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { CityItemManager, WeaponItem } from "@/lib/city-item-manager"
import { ItemCard } from "@/components/city/item-card"
import { addToInventory } from "@/lib/inventory-manager"
import { CharacterStats } from "@/types/character"

export default function ShopPage() {
  const params = useParams() as { cityName: string }
  const cityName = params.cityName
  const [goldBalance, setGoldBalance] = useState(0)

  // Load character stats from localStorage
  useEffect(() => {
    const loadStats = () => {
      try {
        const savedStats = localStorage.getItem("character-stats")
        if (savedStats) {
          const stats = JSON.parse(savedStats) as CharacterStats
          setGoldBalance(stats.gold || 0)
        }
      } catch (error) {
        console.error("Failed to load character stats:", error)
      }
    }
    
    loadStats()

    // Listen for updates
    window.addEventListener("character-stats-update", loadStats)
    
    return () => {
      window.removeEventListener("character-stats-update", loadStats)
    }
  }, [])

  // Shop items
  const [shopItems] = useState<WeaponItem[]>(CityItemManager.getShopItems())

  // Purchase an item
  const purchaseItem = (item: WeaponItem) => {
    // Check if player has enough gold
    if (goldBalance < item.price) {
      toast({
        title: "Not enough gold",
        description: `You need ${item.price} gold to purchase this item.`,
        variant: "destructive",
      })
      return
    }

    try {
      // Update gold in character stats
      const savedStats = localStorage.getItem("character-stats")
      if (!savedStats) {
        throw new Error("No character stats found")
      }

      const stats = JSON.parse(savedStats) as CharacterStats
      const newGoldBalance = stats.gold - item.price
      stats.gold = newGoldBalance
      localStorage.setItem("character-stats", JSON.stringify(stats))
      setGoldBalance(newGoldBalance)

      // Add item to inventory
      addToInventory({
        id: item.id,
        name: item.name,
        type: "item",
        description: item.description,
        quantity: 1
      })

      // Dispatch update event
      window.dispatchEvent(new Event("character-stats-update"))

      toast({
        title: "Item purchased",
        description: `You purchased ${item.name} for ${item.price} gold.`,
      })
    } catch (error) {
      console.error("Error purchasing item:", error)
      toast({
        title: "Purchase failed",
        description: "There was an error processing your purchase.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">Blacksmith & General Store</h1>
            <p className="text-muted-foreground">City of {cityName}</p>
          </div>
          <Link href={`/city/${encodeURIComponent(cityName)}`}>
            <Button variant="outline" className="border-amber-800/20 hover:bg-amber-900/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to City
            </Button>
          </Link>
        </div>

        {/* Shop Image Banner */}
        <div className="relative w-full h-[250px] rounded-lg overflow-hidden border-2 border-amber-800/20 mb-8">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900/30 to-black/70">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <h2 className="text-3xl font-bold mb-2 font-serif">The Forge & Emporium</h2>
              <p className="text-lg">Quality goods for adventurers</p>
            </div>
          </div>
        </div>

        <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
          <CardHeader>
            <CardTitle className="font-serif flex items-center">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Available Items
            </CardTitle>
            <CardDescription>Equipment and supplies for your journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shopItems.map((item) => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  onPurchase={purchaseItem} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 