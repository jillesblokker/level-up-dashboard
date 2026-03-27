"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getCityData, type CityLocation } from "@/lib/city-data"
import { HeaderSection } from "@/components/HeaderSection"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default function CityLocationPage() {
  const params = useParams()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !params) {
    return (
      <div className="flex min-h-screen bg-black items-center justify-center">
        <div className="text-amber-500 animate-pulse">Entering Realm...</div>
      </div>
    )
  }

  const cityName = params['cityName'] as string
  const locationId = params['locationId'] as string
  const cityData = getCityData(cityName)
  const location = cityData?.locations.find(l => l.id === locationId)

  if (!cityData || !location) {
    return (
      <div className="p-20 text-center text-white bg-black min-h-screen">
        <h1 className="text-2xl mb-4 italic">The mists obscure this path...</h1>
        <Link href="/realm">
          <Button variant="outline" className="border-amber-800/20 text-amber-500">
            Return to Map
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <HeaderSection
        title={location.name}
        subtitle={location.subtitle}
        imageSrc={location.image}
        shouldRevealImage={true}
      />

      <main className="flex-1 p-4 md:p-6 pb-24 lg:landscape:pb-6">
        <div className="flex items-center justify-between mb-8">
          <Link href={`/city/${cityName}`}>
            <Button variant="ghost" className="text-amber-500 hover:text-amber-400">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to {cityData.name}
            </Button>
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-amber-900/30 rounded-xl bg-amber-950/5">
          <h2 className="text-2xl font-serif text-amber-500 mb-2">{location.name}</h2>
          <p className="text-gray-400 text-center max-w-md">
            {location.description}
          </p>
          <div className="mt-8 text-amber-500/50 italic text-sm">
             The locals are preparing the hearth... Reconstruction in progress.
          </div>
        </div>
      </main>
    </div>
  )
}