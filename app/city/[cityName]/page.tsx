"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Building, Beer, Crown, Sun, ShoppingBag, Swords, BookOpen, Home } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { NavBar } from "@/components/nav-bar"
import { db } from "@/lib/database"
import { updateKingdomStats } from "@/components/map-grid"

export default function CityPage() {
  const params = useParams() as { cityName: string }
  const router = useRouter()
  const cityName = decodeURIComponent(params.cityName)
  const [gold, setGold] = useState(() => {
    // Get gold balance from localStorage
    if (typeof window !== "undefined") {
      const savedStats = localStorage.getItem("character-stats")
      return savedStats ? JSON.parse(savedStats).gold : 500
    }
    return 500
  })

  // Load player stats
  useEffect(() => {
    const loadStats = () => {
      try {
        const savedStats = localStorage.getItem("character-stats")
        if (savedStats) {
          const stats = JSON.parse(savedStats)
          if (stats && stats.gold !== undefined) {
            setGold(stats.gold)
          }
        }
      } catch (error) {
        console.error("Failed to load player stats:", error)
      }
    }
    
    loadStats()

    // Listen for character stats updates
    const handleStatsUpdate = () => loadStats()
    window.addEventListener("character-stats-update", handleStatsUpdate)
    
    return () => {
      window.removeEventListener("character-stats-update", handleStatsUpdate)
    }
  }, [])
  
  // Award XP for visiting
  useEffect(() => {
    const awardVisitXp = () => {
      // Award 5 XP for visiting the city page
      updateKingdomStats.dispatchEvent(new CustomEvent('expUpdate', { 
        detail: { amount: 5 } 
      }))
    }
    
    awardVisitXp()
  }, [])

  const handleReturnToRealm = () => {
    router.push('/realm')
  }

  const handleVisitLocation = (location: string) => {
    router.push(`/city/${encodeURIComponent(cityName)}/${location}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <NavBar />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif text-white">City of {cityName}</h1>
            <p className="text-gray-300">Explore and interact with buildings</p>
          </div>
          <Button 
            onClick={handleReturnToRealm}
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
              <h2 className="text-3xl font-bold mb-2 font-serif">Welcome to {cityName}</h2>
              <p className="text-lg text-gray-300">A bustling city with various services and opportunities.</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-medievalsharp text-amber-500 mb-4">City Locations</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <LocationCard 
            title="Marketplace"
            description="Buy and sell goods at the busy market square."
            icon={<ShoppingBag className="h-8 w-8 text-amber-500" />}
            onClick={() => handleVisitLocation('marketplace')}
          />
          
          <LocationCard 
            title="Blacksmith"
            description="Purchase weapons and armor from the master smith."
            icon={<Swords className="h-8 w-8 text-amber-500" />}
            onClick={() => handleVisitLocation('blacksmith')}
          />
          
          <LocationCard 
            title="Library"
            description="Study ancient tomes and learn new skills."
            icon={<BookOpen className="h-8 w-8 text-amber-500" />}
            onClick={() => handleVisitLocation('library')}
          />
          
          <LocationCard 
            title="Town Hall"
            description="Meet with city officials and take on quests."
            icon={<Building className="h-8 w-8 text-amber-500" />}
            onClick={() => handleVisitLocation('townhall')}
          />
          
          <LocationCard 
            title="Inn"
            description="Rest and recover while listening to local gossip."
            icon={<Home className="h-8 w-8 text-amber-500" />}
            onClick={() => handleVisitLocation('inn')}
          />
        </div>
      </main>
    </div>
  )
}

interface LocationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function LocationCard({ title, description, icon, onClick }: LocationCardProps) {
  return (
    <div 
      className="bg-black border border-amber-800/20 rounded-lg p-4 cursor-pointer hover:bg-amber-900/10 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start mb-3">
        <div className="mr-3">{icon}</div>
        <div>
          <h3 className="text-xl font-medievalsharp text-white">{title}</h3>
          <p className="text-gray-400">{description}</p>
        </div>
      </div>
      <Button className="w-full bg-amber-700 hover:bg-amber-600">
        Visit Location
      </Button>
    </div>
  );
}

