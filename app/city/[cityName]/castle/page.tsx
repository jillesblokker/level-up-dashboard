"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CastlePage() {
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
      <div className="container py-10" role="main" aria-label="castle-error-section">
        <Card aria-label="castle-error-card">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Unable to load castle information.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10" role="main" aria-label="castle-content-section">
      <div className="mb-6">
        <Link href={`/city/${cityName}`}>
          <Button variant="outline" size="sm" aria-label="Back to City">
            <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to City
          </Button>
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Royal Castle</h1>
        <p className="text-muted-foreground mt-2">Explore the grand halls and chambers.</p>
      </div>
      
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="castle-rooms-loading-grid">
          {[1, 2, 3, 4].map((i) => (
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="castle-rooms-grid">
          {[
            {
              id: "throne-room",
              name: "Throne Room",
              description: "The grand hall where the king holds court",
              image: "/images/castle/throne-room.png"
            },
            {
              id: "royal-chambers",
              name: "Royal Chambers",
              description: "Private quarters of the royal family",
              image: "/images/castle/royal-chambers.png"
            },
            {
              id: "great-hall",
              name: "Great Hall",
              description: "Where feasts and celebrations are held",
              image: "/images/castle/great-hall.png"
            },
            {
              id: "royal-garden",
              name: "Royal Garden",
              description: "A beautiful garden with rare plants and fountains",
              image: "/images/castle/royal-garden.png"
            }
          ].map((room) => (
            <Card key={room.id} className="overflow-hidden" aria-label={`${room.name}-card`}>
              <div 
                className="h-48 bg-cover bg-center" 
                style={{ backgroundImage: `url(${room.image})` }}
                aria-label={`${room.name}-image`}
                role="img"
              />
              <CardHeader>
                <CardTitle>{room.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{room.description}</p>
                <Button className="w-full" aria-label={`Enter ${room.name}`}>
                  Enter Room
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

