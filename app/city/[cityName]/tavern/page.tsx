"use client"

import { useState } from "react"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { NavBar } from "@/components/nav-bar"
import { CityItemManager, FoodItem } from "@/lib/city-item-manager"
import { ItemCard } from "@/components/city/item-card"

export default function TavernPage() {
  const params = useParams() as { cityName: string }
  const cityName = params.cityName
  const [goldBalance, setGoldBalance] = useState(() => {
    // Get gold balance from localStorage
    if (typeof window !== "undefined") {
      const savedGold = localStorage.getItem("gold-balance")
      return savedGold ? Number.parseInt(savedGold) : 1000
    }
    return 1000
  })

  // Tavern items
  const [tavernItems] = useState<FoodItem[]>(CityItemManager.getTavernItems())

  // Purchase an item
  const purchaseItem = (item: FoodItem) => {
    // Check if player has enough gold
    if (goldBalance < item.price) {
      toast({
        title: "Not enough gold",
        description: `You need ${item.price} gold to purchase this item.`,
        variant: "destructive",
      })
      return
    }

    // Deduct gold
    const newGoldBalance = goldBalance - item.price
    setGoldBalance(newGoldBalance)
    localStorage.setItem("gold-balance", String(newGoldBalance))

    toast({
      title: "Item purchased",
      description: `You enjoyed a ${item.name}. ${item.effect}.`,
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">The Dragon's Rest Tavern</h1>
            <p className="text-muted-foreground">City of {cityName}</p>
          </div>
          <Link href={`/city/${encodeURIComponent(cityName)}`}>
            <Button variant="outline" className="border-amber-800/20 hover:bg-amber-900/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to City
            </Button>
          </Link>
        </div>

        {/* Tavern Image Banner */}
        <div className="relative w-full h-[250px] rounded-lg overflow-hidden border-2 border-amber-800/20 mb-8">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900/30 to-black/70">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <h2 className="text-3xl font-bold mb-2 font-serif">The Dragon's Rest</h2>
              <p className="text-lg">A warm hearth and cold ale await</p>
            </div>
          </div>
        </div>

        <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
          <CardHeader>
            <CardTitle className="font-serif flex items-center">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Available Items
            </CardTitle>
            <CardDescription>Food and drink to restore your energy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tavernItems.map((item) => (
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

