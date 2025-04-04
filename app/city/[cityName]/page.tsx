"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Building, ShoppingBag, Footprints, Home } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface CityData {
  name: string
  description: string
  type: 'city'
  locations: {
    id: string
    name: string
    description: string
    icon: string
    image: string
  }[]
}

const defaultCityData: CityData = {
  name: "Grand Citadel",
  type: 'city',
  description: "A magnificent city with towering spires and bustling markets. The heart of commerce and culture in the realm.",
  locations: [
    {
      id: 'market-district',
      name: 'Market District',
      description: 'The bustling heart of commerce in the city.',
      icon: 'ShoppingBag',
      image: '/images/locations/market-district.png'
    },
    {
      id: 'stables',
      name: 'Royal Stables',
      description: 'Where the finest horses in the realm are kept.',
      icon: 'Horseshoe',
      image: '/images/locations/royal-stables.png'
    },
    {
      id: 'inn',
      name: "The King's Rest",
      description: 'A luxurious inn for weary travelers.',
      icon: 'Home',
      image: '/images/locations/kings-rest.png'
    }
  ]
}

export default function CityPage() {
  const params = useParams() as { cityName: string }
  const router = useRouter()
  const { toast } = useToast()
  const cityName = decodeURIComponent(params.cityName)
  const [cityData, setCityData] = useState<CityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get city data from localStorage
    const savedGrid = localStorage.getItem("realm-grid")
    if (savedGrid) {
      const grid = JSON.parse(savedGrid)
      // Find the city in the grid
      let foundCity = false
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          if (grid[y][x].type === 'city') {
            // Use default city data since we don't store individual city data yet
            setCityData(defaultCityData)
            foundCity = true
            break
          }
        }
        if (foundCity) break
      }
      if (!foundCity) {
        router.push('/realm')
      }
    } else {
      router.push('/realm')
    }
    setIsLoading(false)
  }, [cityName, router])

  useEffect(() => {
    // Track visited cities
    const visitedCities = JSON.parse(localStorage.getItem("visited-cities") || "[]");
    if (!visitedCities.includes(cityName)) {
      visitedCities.push(cityName);
      localStorage.setItem("visited-cities", JSON.stringify(visitedCities));
      
      // Dispatch event to update perks
      window.dispatchEvent(new Event("character-stats-update"));
    }
  }, [cityName]);

  const handleVisitLocation = (locationId: string) => {
    router.push(`/city/${encodeURIComponent(cityName)}/${locationId}`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!cityData) {
    return null
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag':
        return <ShoppingBag className="h-8 w-8 text-amber-500" />
      case 'Horseshoe':
        return <Footprints className="h-8 w-8 text-amber-500" />
      case 'Home':
        return <Home className="h-8 w-8 text-amber-500" />
      default:
        return <Building className="h-8 w-8 text-amber-500" />
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif text-white">{cityData.name}</h1>
            <p className="text-gray-300">{cityData.description}</p>
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
              <h2 className="text-3xl font-bold mb-2 font-serif">Welcome to {cityData.name}</h2>
              <p className="text-lg text-gray-300">A grand city with various services and opportunities.</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-medievalsharp text-amber-500 mb-4">City Locations</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cityData.locations.map((location) => (
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