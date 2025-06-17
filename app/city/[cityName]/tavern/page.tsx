"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TavernPage() {
  const params = useParams()
  const cityName = params ? (params['cityName'] as string) : ''
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
      <div className="container py-10" role="main" aria-label="tavern-error-section">
        <Card aria-label="tavern-error-card">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Unable to load tavern information.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10" role="main" aria-label="tavern-content-section">
      <div className="mb-6">
        <Link href={`/city/${cityName}`}>
          <Button variant="outline" size="sm" aria-label="Back to City">
            <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to City
          </Button>
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">The Dragon&apos;s Rest</h1>
        <p className="text-muted-foreground mt-2">A cozy tavern where adventurers gather to rest and share stories.</p>
      </div>
      
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="tavern-items-loading-grid">
          {[1, 2, 3].map((i) => (
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="tavern-items-grid">
          {[
            {
              id: "health-potion",
              name: "Health Potion",
              description: "Restores 50 health points",
              price: "10 gold",
              image: "/images/items/health-potion.png"
            },
            {
              id: "mana-potion",
              name: "Mana Potion",
              description: "Restores 50 mana points",
              price: "15 gold",
              image: "/images/items/mana-potion.png"
            },
            {
              id: "stamina-potion",
              name: "Stamina Potion",
              description: "Restores 50 stamina points",
              price: "12 gold",
              image: "/images/items/stamina-potion.png"
            }
          ].map((item) => (
            <Card key={item.id} className="overflow-hidden" aria-label={`${item.name}-card`}>
              <div 
                className="h-48 bg-cover bg-center" 
                style={{ backgroundImage: `url(${item.image})` }}
                aria-label={`${item.name}-image`}
                role="img"
              />
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>{item.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{item.description}</p>
                <Button className="w-full mt-4" aria-label={`Buy ${item.name}`}>
                  Buy
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

