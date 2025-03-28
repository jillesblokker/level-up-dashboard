"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Building, ShoppingBag, Swords, BookOpen, Home } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NavBar } from "@/components/nav-bar"
import { db } from "@/lib/database"
import { updateKingdomStats } from "@/components/map-grid"

export default function CityLocationPage() {
  const params = useParams() as { cityName: string; locationName: string }
  const router = useRouter()
  const cityName = decodeURIComponent(params.cityName)
  const locationName = decodeURIComponent(params.locationName)
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
  
  // Award XP for visiting location
  useEffect(() => {
    const awardVisitXp = () => {
      // Award XP for visiting specific locations
      updateKingdomStats.dispatchEvent(new CustomEvent('expUpdate', { 
        detail: { amount: 3 } 
      }))
    }
    
    awardVisitXp()
  }, [])

  const handleReturnToCity = () => {
    router.push(`/city/${encodeURIComponent(cityName)}`)
  }

  // Get location icon and description
  const getLocationInfo = () => {
    switch (locationName) {
      case 'marketplace':
        return {
          title: "Marketplace",
          description: "Buy and sell goods at the busy market square.",
          icon: <ShoppingBag className="h-8 w-8 text-amber-500" />,
          content: (
            <div className="space-y-4">
              <p>The marketplace is bustling with activity. Merchants from all over the kingdom have set up their stalls, selling everything from fresh produce to exotic trinkets.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-black border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="text-amber-500">General Goods</CardTitle>
                    <CardDescription>Basic supplies and equipment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Browse a selection of everyday items and adventuring gear.</p>
                  </CardContent>
                </Card>
                <Card className="bg-black border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="text-amber-500">Rare Imports</CardTitle>
                    <CardDescription>Exotic goods from distant lands</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Discover unique items that can't be found elsewhere in the kingdom.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        }
      case 'blacksmith':
        return {
          title: "Blacksmith",
          description: "Purchase weapons and armor from the master smith.",
          icon: <Swords className="h-8 w-8 text-amber-500" />,
          content: (
            <div className="space-y-4">
              <p>The blacksmith's forge glows hot as the master smith hammers away at his latest creation. Racks of well-crafted weapons and armor line the walls.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-black border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="text-amber-500">Weapons</CardTitle>
                    <CardDescription>Tools of war and defense</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Browse a selection of finely crafted weapons for any fighting style.</p>
                  </CardContent>
                </Card>
                <Card className="bg-black border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="text-amber-500">Armor</CardTitle>
                    <CardDescription>Protection for adventurers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Find the perfect armor to keep you safe on your journeys.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        }
      case 'library':
        return {
          title: "Library",
          description: "Study ancient tomes and learn new skills.",
          icon: <BookOpen className="h-8 w-8 text-amber-500" />,
          content: (
            <div className="space-y-4">
              <p>The library is quiet and peaceful, with tall shelves filled with books on every subject imaginable. Scholars and mages study at tables scattered throughout the room.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-black border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="text-amber-500">Historical Archives</CardTitle>
                    <CardDescription>Records of the kingdom's past</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Learn about the rich history of the realm and its legendary heroes.</p>
                  </CardContent>
                </Card>
                <Card className="bg-black border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="text-amber-500">Magical Texts</CardTitle>
                    <CardDescription>Arcane knowledge and spells</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Study the mystical arts from rare and valuable manuscripts.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        }
      case 'townhall':
        return {
          title: "Town Hall",
          description: "Meet with city officials and take on quests.",
          icon: <Building className="h-8 w-8 text-amber-500" />,
          content: (
            <div className="space-y-4">
              <p>The town hall is a hub of activity as officials manage the affairs of the city. A notice board displays various quests and announcements.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-black border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="text-amber-500">Quest Board</CardTitle>
                    <CardDescription>Opportunities for brave adventurers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Take on quests to earn gold, experience, and reputation in the kingdom.</p>
                  </CardContent>
                </Card>
                <Card className="bg-black border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="text-amber-500">City Registry</CardTitle>
                    <CardDescription>Official records and services</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Register property, pay taxes, and handle other administrative matters.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        }
      case 'inn':
        return {
          title: "Inn",
          description: "Rest and recover while listening to local gossip.",
          icon: <Home className="h-8 w-8 text-amber-500" />,
          content: (
            <div className="space-y-4">
              <p>The inn is warm and welcoming, with a roaring fire in the hearth and the smell of good food in the air. Travelers and locals alike share drinks and stories.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-black border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="text-amber-500">Tavern</CardTitle>
                    <CardDescription>Food, drinks, and gossip</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Enjoy a hearty meal and listen to the latest rumors from around the kingdom.</p>
                  </CardContent>
                </Card>
                <Card className="bg-black border-amber-800/20">
                  <CardHeader>
                    <CardTitle className="text-amber-500">Lodging</CardTitle>
                    <CardDescription>A place to rest and recover</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Rent a room to restore your energy and prepare for your next adventure.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        }
      default:
        return {
          title: "Unknown Location",
          description: "This place doesn't seem to exist.",
          icon: <Building className="h-8 w-8 text-amber-500" />,
          content: (
            <div className="space-y-4">
              <p>You've wandered into an unknown part of the city. Perhaps you should return to the main square and try again.</p>
            </div>
          )
        }
    }
  }

  const locationInfo = getLocationInfo()

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <NavBar />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif text-white">{locationInfo.title}</h1>
            <p className="text-gray-300">{locationInfo.description}</p>
          </div>
          <Button 
            onClick={handleReturnToCity}
            variant="outline"
            className="border-amber-800/20 text-amber-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to City
          </Button>
        </div>

        <div className="relative w-full h-[200px] rounded-lg overflow-hidden border-2 border-amber-800/20 mb-8">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 to-black/70 flex items-center justify-center">
            <div className="p-12 bg-black/50 rounded-full border border-amber-800/20">
              {locationInfo.icon}
            </div>
          </div>
        </div>

        <Card className="bg-black border-amber-800/20">
          <CardHeader>
            <CardTitle className="text-amber-500 text-xl">{locationInfo.title} in {cityName}</CardTitle>
            <CardDescription>{locationInfo.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {locationInfo.content}
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 