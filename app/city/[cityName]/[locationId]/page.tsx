"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getCityData } from "@/lib/city-data"
import { HeaderSection } from "@/components/HeaderSection"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

// Import Social Components
import { AllianceDashboard } from "@/components/alliance-dashboard"
import { Leaderboard } from "@/components/leaderboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Trophy, Scroll } from "lucide-react"
// Note: We will eventually move the full Allies logic here as a component

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
        <h1 className="text-2xl mb-4 italic">The mists obscure this path... {locationId}</h1>
        <Link href="/realm">
          <Button variant="outline" className="border-amber-800/20 text-amber-500">
            Return to Map
          </Button>
        </Link>
      </div>
    )
  }

  const isTavern = locationId === 'tavern' || locationId === 'dragons-rest'

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <HeaderSection
        title={location.name}
        subtitle={location.subtitle}
        imageSrc={location.image}
        shouldRevealImage={true}
      />

      <main className="flex-1 p-4 md:p-6 pb-24 lg:landscape:pb-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <Link href={`/city/${cityName}`}>
            <Button variant="ghost" className="text-amber-500 hover:text-amber-400">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to {cityData.name}
            </Button>
          </Link>
        </div>

        {isTavern ? (
          <div className="space-y-8">
            <Tabs defaultValue="alliances" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-amber-950/20 border border-amber-900/40 mb-8">
                <TabsTrigger value="alliances" className="data-[state=active]:bg-amber-900/40 text-amber-100">
                  <Users className="w-4 h-4 mr-2" />
                  Alliances
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="data-[state=active]:bg-amber-900/40 text-amber-100">
                  <Trophy className="w-4 h-4 mr-2" />
                  Legends
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="alliances" className="mt-0">
                <AllianceDashboard />
              </TabsContent>
              
              <TabsContent value="leaderboard" className="mt-0">
                <Leaderboard />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-amber-900/30 rounded-xl bg-amber-950/5">
            <h2 className="text-2xl font-serif text-amber-500 mb-2">{location.name}</h2>
            <p className="text-gray-400 text-center max-w-md">
              {location.description}
            </p>
            <div className="mt-8 text-amber-500/50 italic text-sm">
               The locals are preparing the hearth... Reconstruction in progress.
            </div>
          </div>
        )}
      </main>
    </div>
  )
}