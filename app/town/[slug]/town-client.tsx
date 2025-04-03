'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Building, ShoppingBag, Swords, Home } from "lucide-react"

interface TownData {
  name: string
  description: string
  type: 'town'
  locations: {
    id: string
    name: string
    description: string
    icon: string
    image: string
  }[]
}

const defaultTownData: TownData = {
  name: "Riverside Haven",
  type: 'town',
  description: "A peaceful town nestled by the river. Known for its friendly inhabitants and local crafts.",
  locations: [
    {
      id: 'marketplace',
      name: 'Marketplace',
      description: 'Buy and sell goods at the local market.',
      icon: 'ShoppingBag',
      image: '/images/locations/kingdom-marketplace.png'
    },
    {
      id: 'inn',
      name: "The Dragon's Rest",
      description: 'Rest and recover while listening to local gossip.',
      icon: 'Home',
      image: '/images/locations/The-dragon\'s-rest-tavern.png'
    },
    {
      id: 'blacksmith',
      name: "Ember's Anvil",
      description: 'Purchase weapons and armor from the local smith.',
      icon: 'Swords',
      image: '/images/locations/ember\'s-anvil.png'
    }
  ]
}

interface Props {
  slug: string
}

export default function TownClient({ slug }: Props) {
  const router = useRouter()
  const [townData, setTownData] = useState<TownData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get town data from localStorage
    const savedGrid = localStorage.getItem("realm-grid")
    if (savedGrid) {
      const grid = JSON.parse(savedGrid)
      // Find the town in the grid
      let foundTown = false
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          if (grid[y][x].type === 'town') {
            // Use default town data since we don't store individual town data yet
            setTownData(defaultTownData)
            foundTown = true
            break
          }
        }
        if (foundTown) break
      }
      if (!foundTown) {
        router.push('/realm')
      }
    } else {
      router.push('/realm')
    }
    setIsLoading(false)
  }, [slug, router])

  const handleVisitLocation = (locationId: string) => {
    router.push(`/town/${slug}/${locationId}`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!townData) {
    return null
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag':
        return <ShoppingBag className="h-8 w-8 text-amber-500" />
      case 'Home':
        return <Home className="h-8 w-8 text-amber-500" />
      case 'Swords':
        return <Swords className="h-8 w-8 text-amber-500" />
      default:
        return <Building className="h-8 w-8 text-amber-500" />
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif text-white">{townData.name}</h1>
            <p className="text-gray-300">{townData.description}</p>
          </div>
          <Button 
            onClick={() => router.push('/realm')}
            variant="outline"
            className="border-amber-800/20 text-amber-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Realm
          </Button>
        </div>

        <div className="relative w-full h-[300px] rounded-lg overflow-hidden border-2 border-amber-800/20 mb-8">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 to-black/70">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <h2 className="text-3xl font-bold mb-2 font-serif">Welcome to {townData.name}</h2>
              <p className="text-lg text-gray-300">A peaceful town with various services.</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-medievalsharp text-amber-500 mb-4">Town Locations</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {townData.locations.map((location) => (
            <div 
              key={location.id}
              className="bg-black border border-amber-800/20 rounded-lg p-4 cursor-pointer hover:bg-amber-900/10 transition-colors"
              onClick={() => handleVisitLocation(location.id)}
            >
              <div className="flex items-start mb-3">
                <div className="mr-3">{getIcon(location.icon)}</div>
                <div>
                  <h3 className="text-xl font-medievalsharp text-white">{location.name}</h3>
                  <p className="text-gray-400">{location.description}</p>
                </div>
              </div>
              <Button className="w-full bg-amber-700 hover:bg-amber-600">
                Visit Location
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
} 