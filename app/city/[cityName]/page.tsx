"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Building, ShoppingBag, Footprints, Home, Swords } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { HeaderSection } from "@/components/HeaderSection"
import Image from "next/image"

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
      id: "embers-anvil",
      name: "Ember's Anvil",
      description: 'A forge where weapons and armor are crafted.',
      icon: 'Swords',
      image: "/images/locations/ember's-anvil.png"
    },
    {
      id: 'kingdom-marketplace',
      name: 'Kingdom Marketplace',
      description: 'A bustling marketplace for trading and buying artifacts, scrolls, and books.',
      icon: 'ShoppingBag',
      image: '/images/locations/kingdom-marketplace.png'
    },
    {
      id: 'royal-stables',
      name: 'Royal Stables',
      description: 'Where the finest horses in the realm are kept.',
      icon: 'Footprints',
      image: '/images/locations/royal-stables.png'
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
      case 'Footprints':
        return <Footprints className="h-8 w-8 text-amber-500" />
      case 'Swords':
        return <Swords className="h-8 w-8 text-amber-500" />
      default:
        return <Building className="h-8 w-8 text-amber-500" />
    }
  }

  // Determine city image path
  const cityImage = `/images/locations/${cityData.name.toLowerCase().replace(/\s+/g, '-')}.png`;

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <HeaderSection
        title={cityData?.name || "City"}
        imageSrc="/images/locations/city.png"
        canEdit={false}
      />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cityData.locations.map((location) => (
            <div 
              key={location.id}
              className="bg-black border border-amber-800/20 rounded-lg p-4 cursor-pointer hover:bg-amber-900/10 transition-colors"
              onClick={() => handleVisitLocation(location.id)}
            >
              <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden">
                <Image src={location.image} alt={location.name} fill className="object-cover" />
              </div>
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