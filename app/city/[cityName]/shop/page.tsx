"use client"

import React from "react"
import { useState, useEffect } from "react"
import { ArrowLeft, ShoppingBag, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { CityItemManager, WeaponItem } from "@/lib/city-item-manager"
import { ItemCard } from "@/components/city/item-card"
import { addToInventory, addToKingdomInventory } from "@/lib/inventory-manager"
import { CharacterStats } from "@/types/character"

export default function ShopPage() {
  const params = useParams()
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

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
          {[
            {
              id: "health-potion",
              name: "Health Potion",
              description: "Restores 50 health points",
              price: "25 gold",
              image: "/images/items/health-potion.png"
            },
            {
              id: "mana-potion",
              name: "Mana Potion",
              description: "Restores 50 mana points",
              price: "30 gold",
              image: "/images/items/mana-potion.png"
            },
            {
              id: "strength-potion",
              name: "Strength Potion",
              description: "Increases strength by 5 for 1 hour",
              price: "45 gold",
              image: "/images/items/strength-potion.png"
            },
            {
              id: "leather-armor",
              name: "Leather Armor",
              description: "Basic protection against physical damage",
              price: "100 gold",
              image: "/images/items/leather-armor.png"
            },
            {
              id: "iron-sword",
              name: "Iron Sword",
              description: "A reliable weapon for combat",
              price: "150 gold",
              image: "/images/items/iron-sword.png"
            },
            {
              id: "magic-scroll",
              name: "Magic Scroll",
              description: "Teaches a random spell",
              price: "200 gold",
              image: "/images/items/magic-scroll.png"
            }
          ].map((item) => (
            <Card key={item.id} className="overflow-hidden" aria-label={`${item.name}-card`}>
              <div 
                className="h-48 bg-cover bg-center" 
                style={{ backgroundImage: `url(${item.image})` }}
                aria-label={`${item.name}-image`}
              />
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>{item.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">{item.description}</p>
                <Button className="w-full" aria-label={`Purchase ${item.name}`}>
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