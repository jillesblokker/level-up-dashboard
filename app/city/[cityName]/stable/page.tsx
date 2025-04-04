"use client"

import { useState } from "react"
import { ArrowLeft, DogIcon as Horse, Coins } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

interface MountItem {
  id: string
  name: string
  description: string
  price: number
  stats: {
    speed: number
    stamina: number
    special?: string
  }
  image?: string
}

export default function StablePage() {
  const params = useParams() as { cityName: string }
  const cityName = params.cityName
  const [goldBalance, setGoldBalance] = useState(() => {
    // Get gold balance from localStorage
    if (typeof window !== "undefined") {
      const savedGold = localStorage.getItem("gold-balance")
      return savedGold ? Number.parseInt(savedGold) : 1000
    }
    return 1000
  })

  // Stable mounts
  const [mounts] = useState<MountItem[]>([
    {
      id: "mount1",
      name: "White Noble Horse",
      description: "A majestic white steed, perfect for knights and nobles.",
      price: 200,
      stats: {
        speed: 7,
        stamina: 8,
      },
    },
    {
      id: "mount2",
      name: "War Charger",
      description: "A powerful horse bred for battle, unfazed by the chaos of combat.",
      price: 350,
      stats: {
        speed: 6,
        stamina: 10,
        special: "Fearless in battle",
      },
    },
    {
      id: "mount3",
      name: "Mountain Pony",
      description: "A sturdy pony bred for traversing difficult mountain terrain.",
      price: 150,
      stats: {
        speed: 5,
        stamina: 9,
        special: "Sure-footed on rough terrain",
      },
    },
    {
      id: "mount4",
      name: "Desert Runner",
      description: "A horse bred in the desert, able to travel long distances with little water.",
      price: 300,
      stats: {
        speed: 8,
        stamina: 9,
        special: "Resistant to heat and thirst",
      },
    },
  ])

  // Purchase a mount
  const purchaseMount = (mount: MountItem) => {
    // Check if player has enough gold
    if (goldBalance < mount.price) {
      toast({
        title: "Not enough gold",
        description: `You need ${mount.price} gold to purchase this mount.`,
        variant: "destructive",
      })
      return
    }

    // Deduct gold
    const newGoldBalance = goldBalance - mount.price
    setGoldBalance(newGoldBalance)
    localStorage.setItem("gold-balance", String(newGoldBalance))

    // Add to mounts in localStorage
    const playerMounts = JSON.parse(localStorage.getItem("player-mounts") || "[]")
    playerMounts.push(mount)
    localStorage.setItem("player-mounts", JSON.stringify(playerMounts))

    toast({
      title: "Mount purchased",
      description: `You purchased ${mount.name} for ${mount.price} gold.`,
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">Royal Stables</h1>
            <p className="text-muted-foreground">City of {cityName}</p>
          </div>
          <Link href={`/city/${encodeURIComponent(cityName)}`}>
            <Button variant="outline" className="border-amber-800/20 hover:bg-amber-900/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to City
            </Button>
          </Link>
        </div>

        {/* Stable Image Banner */}
        <div className="relative w-full h-[250px] rounded-lg overflow-hidden border-2 border-amber-800/20 mb-8">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900/30 to-black/70">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <h2 className="text-3xl font-bold mb-2 font-serif">Royal Stables</h2>
              <p className="text-lg">The finest mounts in the realm</p>
            </div>
          </div>
        </div>

        <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
          <CardHeader>
            <CardTitle className="font-serif flex items-center">
              <Horse className="mr-2 h-5 w-5" />
              Available Mounts
            </CardTitle>
            <CardDescription>Steeds for your journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mounts.map((mount) => (
                <Card key={mount.id} className="border-amber-800/20 hover:border-amber-500/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{mount.name}</CardTitle>
                    <CardDescription>{mount.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-1 mb-2">
                      <div className="flex justify-between text-sm">
                        <span>Speed</span>
                        <span className="text-green-500">{mount.stats.speed}/10</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Stamina</span>
                        <span className="text-blue-500">{mount.stats.stamina}/10</span>
                      </div>
                      {mount.stats.special && (
                        <div className="flex justify-between text-sm">
                          <span>Special</span>
                          <span className="text-amber-500">{mount.stats.special}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Coins className="h-4 w-4 text-amber-500 mr-1" />
                      <span className="font-medium text-amber-500">{mount.price} Gold</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900"
                      onClick={() => purchaseMount(mount)}
                    >
                      Purchase
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

