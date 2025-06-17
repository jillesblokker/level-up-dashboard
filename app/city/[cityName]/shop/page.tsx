"use client"

import React from "react"
import { useState, useEffect } from "react"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useGoldStore } from '@/stores/goldStore'
import { addToKingdomInventory } from '@/lib/inventory-manager'

export default function ShopPage() {
  const params = useParams()
  const { gold, updateGold } = useGoldStore()
  const [isLoading, setIsLoading] = useState(true)

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

  // Define shop items with cost between 40 and 100 gold
  const shopItems = [
    {
      id: "health-potion",
      name: "Health Potion",
      description: "Restores 50 health points",
      price: 40,
      image: "/images/items/potion/potion-health.png",
      emoji: "🧪"
    },
    {
      id: "mana-potion",
      name: "Mana Potion",
      description: "Restores 50 mana points",
      price: 45,
      image: "/images/items/potion/potion-mana.png",
      emoji: "🔮"
    },
    {
      id: "strength-potion",
      name: "Strength Potion",
      description: "Increases strength by 5 for 1 hour",
      price: 60,
      image: "/images/items/potion/potion-strength.png",
      emoji: "💪"
    },
    {
      id: "leather-armor",
      name: "Leather Armor",
      description: "Basic protection against physical damage",
      price: 100,
      image: "/images/items/armor/armor-leather.png",
      emoji: "🥋"
    },
    {
      id: "iron-sword",
      name: "Iron Sword",
      description: "A reliable weapon for combat",
      price: 90,
      image: "/images/items/sword/sword-iron.png",
      emoji: "⚔️"
    },
    {
      id: "magic-scroll",
      name: "Magic Scroll",
      description: "Teaches a random spell",
      price: 80,
      image: "/images/items/scroll/scroll-magic.png",
      emoji: "📜"
    }
  ]

  return (
    <div className="container py-10" role="main" aria-label="shop-content-section">
      <div className="mb-6">
        <Link href={`/city/${cityName}`}>
          <Button variant="outline" size="sm" aria-label="Back to City">
            <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to City
          </Button>
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">City Market</h1>
        <p className="text-muted-foreground mt-2">Browse wares from local merchants.</p>
      </div>
      
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="shop-items-loading-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden" aria-label={`loading-card-${i}`}>
              <div className="h-48 bg-muted animate-pulse" aria-hidden="true" />
              <CardHeader>
                <div className="h-6 w-2/3 bg-muted animate-pulse rounded" aria-hidden="true" />
                <div className="h-4 w-full bg-muted animate-pulse rounded mt-2" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted animate-pulse rounded" aria-hidden="true" />
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded mt-2" aria-hidden="true" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="shop-items-grid">
          {shopItems.map((item) => (
            <Card key={item.id} className="overflow-hidden" aria-label={`${item.name}-card`}>
              {item.image ? (
                <div
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.image})` }}
                  aria-label={`${item.name}-image`}
                  role="img"
                />
              ) : (
                <div
                  className="h-48 flex flex-col items-center justify-center bg-blue-500 text-white"
                  aria-label={`${item.name}-fallback-image`}
                >
                  <span className="text-4xl mb-2">{item.emoji}</span>
                  <span className="text-lg font-bold">{item.name}</span>
                  <span className="text-md mt-2">{item.price} gold</span>
                </div>
              )}
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>{item.price} gold</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">{item.description}</p>
                <Button
                  className="w-full"
                  aria-label={`Purchase ${item.name}`}
                  onClick={() => {
                    if (gold < item.price) {
                      toast({
                        title: "Not enough gold",
                        description: `You need ${item.price} gold to purchase ${item.name}.
Current gold: ${gold}`,
                        variant: "destructive"
                      })
                      return
                    }
                    updateGold(-item.price)
                    // Add to kingdom inventory
                    addToKingdomInventory({
                      id: item.id,
                      name: item.name,
                      description: item.description,
                      type: 'item',
                      quantity: 1,
                      image: item.image,
                      emoji: item.emoji
                    })
                    window.dispatchEvent(new Event('character-inventory-update'))
                    toast({
                      title: "Purchase successful",
                      description: `You purchased ${item.name} for ${item.price} gold.`,
                      variant: "default"
                    })
                  }}
                >
                  Purchase
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 