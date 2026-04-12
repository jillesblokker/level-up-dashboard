"use client"

import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getCityData } from "@/lib/city-data"
import { HeaderSection } from "@/components/HeaderSection"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Users, Trophy, UserPlus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from 'next/dynamic'

function TavernBannerIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      </svg>
    )
  }

// Import Social Components dynamically to avoid initialization order issues
const AllianceDashboard = dynamic(() => import("@/components/alliance-dashboard").then(mod => mod.AllianceDashboard), { 
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center text-amber-500/50 animate-pulse">Loading Alliance Data...</div>
})
const Leaderboard = dynamic(() => import("@/components/leaderboard").then(mod => mod.Leaderboard), { 
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center text-amber-500/50 animate-pulse">Loading Leaderboards...</div>
})
const AlliesDashboard = dynamic(() => import("@/components/allies-dashboard").then(mod => mod.AlliesDashboard), { 
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center text-amber-500/50 animate-pulse">Loading Allies...</div>
})

export default function CityLocationPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const initialTab = searchParams?.get('tab') || 'alliances'
  
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const tabAtUrl = searchParams?.get('tab')
    if (tabAtUrl && tabAtUrl !== activeTab) {
      setActiveTab(tabAtUrl)
    }
  }, [searchParams, activeTab])

  if (!mounted || !params) {
    return (
      <div className="flex min-h-screen bg-black items-center justify-center">
        <div className="text-amber-500 animate-pulse font-medieval tracking-widest uppercase">Approaching the City Gates...</div>
      </div>
    )
  }

  const cityName = params['cityName'] as string
  const locationId = params['locationId'] as string
  const cityData = getCityData(cityName)
  const location = cityData?.locations.find(l => l.id === locationId)

  if (!cityData || !location) {
    return (
      <div className="p-20 text-center text-white bg-black min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-medieval mb-6 text-amber-950/80 italic">The mists obscure this path... {locationId}</h1>
        <Link href="/realm">
          <Button variant="outline" className="border-amber-800/40 text-amber-500 hover:bg-amber-950/20">
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
        defaultBgColor="bg-amber-950"
      />

      <main className="flex-1 p-4 md:p-6 pb-24 lg:landscape:pb-8 max-w-6xl mx-auto w-full relative">
        <div className="flex items-center justify-between mb-8 relative z-10">
          <Link href={`/city/${cityName}`}>
            <Button variant="ghost" className="text-amber-500 hover:text-amber-400 font-medieval group">
              <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Return to {cityData.name}
            </Button>
          </Link>
        </div>

        {isTavern ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex h-14 bg-black/40 border border-amber-900/20 p-1.5 rounded-2xl mb-12 w-full md:w-auto overflow-x-auto justify-start no-scrollbar backdrop-blur-md gap-2 md:gap-0">
                <TabsTrigger value="alliances" className="flex items-center gap-2 py-3 h-full px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap min-h-[44px]">
                  <Users className="w-4 h-4" />
                  Alliances
                </TabsTrigger>
                <TabsTrigger value="allies" className="flex items-center gap-2 py-3 h-full px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap min-h-[44px]">
                  <UserPlus className="w-4 h-4" />
                  Ally Board
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex items-center gap-2 py-3 h-full px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap min-h-[44px]">
                  <Trophy className="w-4 h-4" />
                  Legends
                </TabsTrigger>
              </TabsList>

              
              <TabsContent value="alliances" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <AllianceDashboard />
              </TabsContent>
              
              <TabsContent value="allies" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <AlliesDashboard />
              </TabsContent>
              
              <TabsContent value="leaderboard" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <Leaderboard />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 border border-dashed border-amber-900/30 rounded-3xl bg-amber-950/5 text-center space-y-6">
             <div className="p-6 bg-amber-900/10 rounded-full">
                <TavernBannerIcon className="w-12 h-12 text-amber-900/40" />
             </div>
            <h2 className="text-3xl font-medieval text-amber-500">{location.name}</h2>
            <p className="text-gray-500 max-w-sm font-serif leading-relaxed italic">
              {location.description}
            </p>
            <div className="pt-8 flex flex-col items-center gap-1">
               <span className="text-amber-500/30 font-medieval text-xs tracking-widest uppercase">The builders are hard at work</span>
               <div className="w-32 h-1 bg-amber-900/20 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-700/40 w-1/3 animate-pulse" />
               </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Decorative side vignetting */}
      <div className="fixed inset-y-0 left-0 w-32 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
      <div className="fixed inset-y-0 right-0 w-32 bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
    </div>
  )
}
