"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TemplePage() {
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
      <div className="container py-10" role="main" aria-label="temple-error-section">
        <Card aria-label="temple-error-card">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Unable to load temple information.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10" role="main" aria-label="temple-content-section">
      <div className="mb-6">
        <Link href={`/city/${cityName}`}>
          <Button variant="outline" size="sm" aria-label="Back to City">
            <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to City
          </Button>
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Temple of the Gods</h1>
        <p className="text-muted-foreground mt-2">A place of worship and divine blessings.</p>
      </div>
      
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="temple-blessings-loading-grid">
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="temple-blessings-grid">
          {[
            {
              id: "healing-blessing",
              name: "Healing Blessing",
              description: "Restore your health and remove negative effects",
              duration: "24 hours",
              price: "50 gold",
              image: "/images/blessings/healing.png"
            },
            {
              id: "protection-blessing",
              name: "Protection Blessing",
              description: "Gain divine protection against harm",
              duration: "12 hours",
              price: "75 gold",
              image: "/images/blessings/protection.png"
            },
            {
              id: "wisdom-blessing",
              name: "Wisdom Blessing",
              description: "Enhance your knowledge and understanding",
              duration: "48 hours",
              price: "100 gold",
              image: "/images/blessings/wisdom.png"
            }
          ].map((blessing) => (
            <Card key={blessing.id} className="overflow-hidden" aria-label={`${blessing.name}-card`}>
              <div 
                className="h-48 bg-cover bg-center" 
                style={{ backgroundImage: `url(${blessing.image})` }}
                aria-label={`${blessing.name}-image`}
              />
              <CardHeader>
                <CardTitle>{blessing.name}</CardTitle>
                <CardDescription>{blessing.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">{blessing.description}</p>
                <p className="text-sm font-medium">Duration: {blessing.duration}</p>
                <Button className="w-full mt-4" aria-label={`Receive ${blessing.name}`}>
                  Receive Blessing
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

