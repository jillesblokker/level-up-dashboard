"use client"

import React from "react"
import { useState, useEffect } from "react"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { addToKingdomInventory } from '@/lib/inventory-manager'
import { getCharacterStats } from '@/lib/character-stats-manager'
import { spendGold, hasEnoughGold } from '@/lib/gold-manager'

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

  // Get the specific location image based on cityName
  const getLocationImage = (cityName: string) => {
    // Map city names to their specific images
    const locationImageMap: Record<string, string> = {
      'embers-anvil': '/images/locations/embers-anvil.png',
      'kingdom-marketplace': '/images/locations/kingdom-marketplace.png',
      'royal-stables': '/images/locations/royal-stables.png',
      'the-dragons-rest': '/images/locations/the-dragons-rest-tavern.png',
      'blacksmith': '/images/locations/embers-anvil.png',
      'marketplace': '/images/locations/kingdom-marketplace.png',
      'library': '/images/locations/library.png',
      'inn': '/images/locations/inn.png'
    }
    
    return locationImageMap[cityName] || '/images/locations/market.png'
  }

  const locationImage = getLocationImage(cityName)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => window.history.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">City Market</h1>
        </div>

        {/* Cover Image Banner */}
        <div className="relative w-full h-[300px] rounded-lg overflow-hidden border-2 border-amber-800/20 mb-8">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${locationImage})` }}
            aria-label="shop-cover-image"
            role="img"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900/30 to-black/70">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <h2 className="text-4xl font-bold mb-2 font-serif text-amber-500 drop-shadow-lg">City Market</h2>
              <p className="text-lg text-gray-300 max-w-2xl text-center">Browse wares from local merchants in {cityName}</p>
            </div>
          </div>
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" aria-label="shop-cards-grid">
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
                  className="w-full min-h-[44px]"
                  aria-label={`Purchase ${item.name}`}
                  onClick={async () => {
                    try {
                      // Use the unified gold spending system
                      const success = await spendGold(item.price, `purchase-${item.name}`);
                      if (success) {
                        // Add to kingdom inventory
                        if (user?.id) {
                          addToKingdomInventory(user.id, {
                            id: item.id,
                            name: item.name,
                            description: item.description,
                            type: 'item',
                            quantity: 1,
                            image: item.image,
                            emoji: item.emoji
                          })
                        }
                        window.dispatchEvent(new Event('character-inventory-update'))
                      }
                    } catch (error) {
                      console.error('Error purchasing item:', error);
                    }
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
    </div>
  )
} 