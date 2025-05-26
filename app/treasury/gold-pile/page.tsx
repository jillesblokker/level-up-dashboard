"use client"

import { useState, useEffect } from "react"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Coins, Plus } from "lucide-react"
import Link from "next/link"

export default function GoldPilePage() {
  const [goldBalance, setGoldBalance] = useState(1000)
  const [dragonAwake, setDragonAwake] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [showDragonWarning, setShowDragonWarning] = useState(false)

  // Load gold balance from localStorage
  useEffect(() => {
    const savedGold = localStorage.getItem("gold-balance")
    if (savedGold) {
      setGoldBalance(Number.parseInt(savedGold))
    }
  }, [])

  // Handle gold pile click
  const handleGoldPileClick = () => {
    // Increment click count
    const newClickCount = clickCount + 1
    setClickCount(newClickCount)

    // Add gold
    const goldToAdd = Math.floor(Math.random() * 5) + 1
    const newGoldBalance = goldBalance + goldToAdd
    setGoldBalance(newGoldBalance)
    localStorage.setItem("gold-balance", String(newGoldBalance))

    // Add notification
    addNotification({
      title: "Gold Collected",
      message: `You collected ${goldToAdd} gold from the pile.`,
      type: "success",
    })

    // Check if dragon should wake up
    if (newClickCount > 10 && Math.random() < 0.3) {
      setDragonAwake(true)
      setShowDragonWarning(true)

      // Add notification
      addNotification({
        title: "Dragon Awakened!",
        message: "The dragon has awakened! Be careful not to disturb it further.",
        type: "danger",
      })

      // Reset after 5 seconds
      setTimeout(() => {
        setDragonAwake(false)
        setClickCount(0)
      }, 5000)
    }
  }

  // Add notification to localStorage for the notification center
  const addNotification = (notification: { title: string; message: string; type: string }) => {
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]")
    const newNotification = {
      id: Date.now().toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: false,
      timestamp: new Date().toISOString(),
    }

    notifications.unshift(newNotification)
    localStorage.setItem("notifications", JSON.stringify(notifications))

    // Dispatch custom event to notify the notification center
    const event = new CustomEvent("newNotification", { detail: newNotification })
    window.dispatchEvent(event)
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <NavBar goldBalance={1000} session={undefined} />

      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">Treasury</h1>
            <p className="text-muted-foreground">Your gold pile grows with each adventure</p>
          </div>
          <Link href="/treasury">
            <Button variant="outline" className="border-amber-800/20 hover:bg-amber-900/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Treasury
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
            <CardHeader>
              <CardTitle className="font-serif flex items-center">
                <Coins className="mr-2 h-5 w-5 text-amber-500" />
                Gold Pile
              </CardTitle>
              <CardDescription>Click to collect gold from your treasure hoard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Gold pile */}
                <div
                  className="w-full aspect-video bg-amber-900/20 rounded-lg overflow-hidden cursor-pointer relative"
                  onClick={handleGoldPileClick}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1/2 h-1/2 bg-amber-500 rounded-full transform -translate-y-1/4"></div>
                    <div className="absolute w-2/3 h-1/3 bg-amber-400 rounded-full bottom-1/4"></div>
                    <div className="absolute w-1/2 h-1/4 bg-amber-300 rounded-full bottom-1/6"></div>

                    {/* Gold coins scattered */}
                    <div className="absolute w-6 h-6 bg-yellow-400 rounded-full top-1/3 left-1/4"></div>
                    <div className="absolute w-4 h-4 bg-yellow-300 rounded-full top-1/2 left-1/3"></div>
                    <div className="absolute w-5 h-5 bg-yellow-500 rounded-full bottom-1/4 right-1/3"></div>
                    <div className="absolute w-3 h-3 bg-yellow-200 rounded-full bottom-1/3 right-1/4"></div>
                  </div>

                  {/* Sleeping dragon */}
                  <div
                    className={`absolute right-0 bottom-0 transition-all duration-500 ${dragonAwake ? "scale-110" : "scale-100"}`}
                  >
                    <svg width="200" height="120" viewBox="0 0 200 120" className="transform -scale-x-100">
                      {/* Dragon body */}
                      <path
                        d="M40,80 Q60,60 80,80 Q100,100 120,80 Q140,60 160,80 Q180,100 190,90"
                        fill={dragonAwake ? "#8B0000" : "#A52A2A"}
                        stroke="#000"
                        strokeWidth="2"
                      />

                      {/* Dragon head */}
                      <path
                        d="M30,70 Q20,60 30,50 Q40,40 50,50 Q55,55 50,60 L40,70 Z"
                        fill={dragonAwake ? "#8B0000" : "#A52A2A"}
                        stroke="#000"
                        strokeWidth="2"
                      />

                      {/* Dragon eye */}
                      <circle cx="35" cy="55" r="2" fill={dragonAwake ? "#FF0000" : "#000"} />

                      {/* Dragon nostrils */}
                      <circle cx="25" cy="55" r="1" fill="#000" />
                      <circle cx="28" cy="55" r="1" fill="#000" />

                      {/* Dragon spikes */}
                      <path
                        d="M50,50 L55,40 L60,50 L65,35 L70,50 L75,40 L80,50 L85,35 L90,50 L95,40 L100,50"
                        fill="none"
                        stroke="#000"
                        strokeWidth="2"
                      />

                      {/* Dragon tail */}
                      <path d="M190,90 Q200,80 195,70" fill="none" stroke="#000" strokeWidth="2" />
                    </svg>
                  </div>

                  {/* Click instruction */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 px-4 py-2 rounded-full">
                      <p className="text-white flex items-center">
                        <Plus className="mr-1 h-4 w-4" />
                        Click to collect gold
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dragon warning */}
                {showDragonWarning && (
                  <div className="absolute top-1/4 left-0 right-0 text-center">
                    <div className="bg-red-900/80 text-white px-4 py-2 rounded-md inline-block animate-pulse">
                      <p className="font-bold">The dragon is awake!</p>
                      <p className="text-sm">Be careful not to disturb it further</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-amber-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Current Gold</h3>
                  <div className="flex items-center">
                    <Coins className="h-4 w-4 text-amber-500 mr-2" />
                    <span className="font-bold text-amber-500">{goldBalance}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Click the gold pile to collect more gold. But be careful not to wake the dragon!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
            <CardHeader>
              <CardTitle className="font-serif">Treasury Upgrades</CardTitle>
              <CardDescription>Improve your gold storage and collection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-amber-800/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Reinforced Vault</h3>
                    <p className="text-sm text-muted-foreground">Increases maximum gold storage by 1000</p>
                  </div>
                  <Button className="bg-amber-900 hover:bg-amber-800">
                    <Coins className="mr-2 h-4 w-4" />
                    500 Gold
                  </Button>
                </div>
              </div>

              <div className="p-4 border border-amber-800/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Dragon Tamer</h3>
                    <p className="text-sm text-muted-foreground">Reduces chance of waking the dragon</p>
                  </div>
                  <Button className="bg-amber-900 hover:bg-amber-800">
                    <Coins className="mr-2 h-4 w-4" />
                    750 Gold
                  </Button>
                </div>
              </div>

              <div className="p-4 border border-amber-800/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Golden Touch</h3>
                    <p className="text-sm text-muted-foreground">Increases gold collected per click</p>
                  </div>
                  <Button className="bg-amber-900 hover:bg-amber-800">
                    <Coins className="mr-2 h-4 w-4" />
                    1000 Gold
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

