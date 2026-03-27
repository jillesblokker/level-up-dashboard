"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Coffee } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingScreen } from "@/components/loading-screen"

const TAVERN_ITEMS = [
  {
    id: "health-potion",
    name: "Health Potion",
    description: "Restores 50 health points",
    price: "10 gold",
    image: "/images/items/health-potion.webp"
  },
  {
    id: "mana-potion",
    name: "Mana Potion",
    description: "Restores 50 mana points",
    price: "15 gold",
    image: "/images/items/mana-potion.webp"
  },
  {
    id: "stamina-potion",
    name: "Stamina Potion",
    description: "Restores 50 stamina points",
    price: "12 gold",
    image: "/images/items/stamina-potion.webp"
  }
];

export default function TavernPage() {
  const params = useParams()
  const cityName = params ? (params['cityName'] as string) : ''
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <LoadingScreen
        title="Resting at The Dragon's Rest"
        icon={<Coffee className="w-12 h-12" />}
        content={
          <div className="space-y-4">
            <p className="border-t border-amber-500/20 pt-4 px-12 italic">
              &quot;The hearth fire crackles as you step into the warm, dimly lit room. Tavern tales and fresh potions await the weary adventurer.&quot;
            </p>
          </div>
        }
      />
    );
  }

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
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="tavern-items-grid">
        {TAVERN_ITEMS.map((item) => (
          <Card key={item.id} className="overflow-hidden bg-gray-950/50 border-amber-900/20 hover:border-amber-500/30 transition-all group" aria-label={`${item.name}-card`}>
            <div 
              className="h-48 bg-cover bg-center transition-transform group-hover:scale-105" 
              style={{ backgroundImage: `url(${item.image})` }}
              aria-label={`${item.name}-image`}
              role="img"
            />
            <CardHeader className="bg-gradient-to-b from-transparent to-black/60 pt-4">
              <CardTitle className="text-amber-500">{item.name}</CardTitle>
              <CardDescription className="text-amber-400 font-numeric">{item.price}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300 min-h-[40px]">{item.description}</p>
              <Button className="w-full mt-4 bg-amber-600 hover:bg-amber-500 text-black font-semibold" aria-label={`Buy ${item.name}`}>
                Purchase Item
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

