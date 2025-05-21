"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function StablesPage() {
  const params = useParams()
  if (!params) {
    return (
      <div className="container py-10" role="main" aria-label="stables-error-section">
        <Card aria-label="stables-error-card">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Unable to load stables information.
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
    <div className="container py-10" role="main" aria-label="stables-content-section">
      <div className="mb-6">
        <Link href={`/city/${cityName}`}>
          <Button variant="outline" size="sm" aria-label="Back to City">
            <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to City
          </Button>
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Royal Stables</h1>
        <p className="text-muted-foreground mt-2">Find your perfect steed.</p>
      </div>
      
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="stables-horses-loading-grid">
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="stables-horses-grid">
          {[
            {
              id: "warhorse",
              name: "Warhorse",
              description: "A powerful steed bred for battle",
              stats: {
                speed: 8,
                stamina: 7,
                strength: 9
              },
              price: "500 gold",
              image: "/images/horses/warhorse.png"
            },
            {
              id: "traveler",
              name: "Traveler's Horse",
              description: "A reliable companion for long journeys",
              stats: {
                speed: 7,
                stamina: 9,
                strength: 6
              },
              price: "300 gold",
              image: "/images/horses/traveler.png"
            },
            {
              id: "royal",
              name: "Royal Steed",
              description: "An elegant horse fit for nobility",
              stats: {
                speed: 9,
                stamina: 8,
                strength: 7
              },
              price: "800 gold",
              image: "/images/horses/royal.png"
            }
          ].map((horse) => (
            <Card key={horse.id} className="overflow-hidden" aria-label={`${horse.name}-card`}>
              <div 
                className="h-48 bg-cover bg-center" 
                style={{ backgroundImage: `url(${horse.image})` }}
                aria-label={`${horse.name}-image`}
              />
              <CardHeader>
                <CardTitle>{horse.name}</CardTitle>
                <CardDescription>{horse.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{horse.description}</p>
                <div className="grid grid-cols-3 gap-2 mb-4" aria-label={`${horse.name}-stats`}>
                  <div className="text-center">
                    <p className="text-sm font-medium">Speed</p>
                    <p className="text-lg">{horse.stats.speed}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Stamina</p>
                    <p className="text-lg">{horse.stats.stamina}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Strength</p>
                    <p className="text-lg">{horse.stats.strength}</p>
                  </div>
                </div>
                <Button className="w-full" aria-label={`Purchase ${horse.name}`}>
                  Purchase Horse
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

