"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Coins, Diamond, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TreasuryPage() {
  const [goldBalance, setGoldBalance] = useState(1000)
  const [isChestOpen, setIsChestOpen] = useState(false)
  const [isCoinsAnimating, setIsCoinsAnimating] = useState(false)

  const openChest = () => {
    setIsChestOpen(true)
    setTimeout(() => {
      setIsCoinsAnimating(true)
    }, 500)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar goldBalance={1000} session={undefined} />

      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Kingdom
            </Button>
          </Link>
          <div className="ml-4">
            <h1 className="text-2xl font-bold tracking-tight font-serif">Royal Treasury</h1>
            <p className="text-muted-foreground">Your accumulated wealth and treasures</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 medieval-card">
            <CardHeader>
              <CardTitle className="font-serif">Treasure Chest</CardTitle>
              <CardDescription>Click the chest to see your riches</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative w-full h-[400px] bg-amber-100/30 dark:bg-amber-900/30 rounded-lg overflow-hidden flex items-center justify-center">
                {/* Treasure chest */}
                <div
                  className={`relative w-64 h-48 cursor-pointer transition-transform duration-500 ${isChestOpen ? "scale-110" : "hover:scale-105"}`}
                  onClick={!isChestOpen ? openChest : undefined}
                >
                  {/* Chest base */}
                  <div className="absolute bottom-0 w-full h-32 bg-amber-800 rounded-lg border-4 border-amber-950"></div>

                  {/* Chest lid */}
                  <div
                    className={`absolute top-0 w-full h-20 bg-amber-700 rounded-t-lg border-4 border-amber-950 transition-transform duration-500 origin-bottom ${isChestOpen ? "transform -translate-y-4 -rotate-x-70" : ""}`}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Lid details */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-500 rounded-full border-2 border-amber-950"></div>
                  </div>

                  {/* Chest contents - only visible when open */}
                  {isChestOpen && (
                    <div className="absolute top-16 left-0 w-full h-32 overflow-hidden">
                      {/* Gold coins pile */}
                      <div className="absolute top-0 left-1/4 w-32 h-20 bg-yellow-500 rounded-full transform -translate-x-1/2"></div>

                      {/* Gems scattered */}
                      <div
                        className={`absolute top-2 left-1/3 w-6 h-6 bg-blue-500 rounded-md transform rotate-45 ${isCoinsAnimating ? "animate-bounce" : ""}`}
                      ></div>
                      <div
                        className={`absolute top-4 right-1/3 w-4 h-4 bg-red-500 rounded-md transform rotate-12 ${isCoinsAnimating ? "animate-bounce delay-100" : ""}`}
                      ></div>
                      <div
                        className={`absolute top-6 left-1/2 w-5 h-5 bg-green-500 rounded-md transform -rotate-12 ${isCoinsAnimating ? "animate-bounce delay-200" : ""}`}
                      ></div>

                      {/* Individual coins with animation */}
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className={`absolute w-4 h-4 bg-yellow-400 rounded-full border border-yellow-600 ${
                            isCoinsAnimating ? "animate-ping" : ""
                          }`}
                          style={{
                            top: `${Math.random() * 20 + 5}px`,
                            left: `${Math.random() * 200 + 20}px`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${Math.random() * 3 + 1}s`,
                          }}
                        ></div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Instruction text */}
                {!isChestOpen && (
                  <div className="absolute bottom-4 left-0 right-0 text-center text-amber-800 dark:text-amber-200 font-medium">
                    Click the chest to open it
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="medieval-card">
              <CardHeader>
                <CardTitle className="font-serif flex items-center">
                  <Coins className="mr-2 h-5 w-5 text-yellow-500" />
                  Gold Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{goldBalance}</div>
                <p className="text-sm text-muted-foreground mt-2">Earned from quests and activities</p>
              </CardContent>
            </Card>

            <Card className="medieval-card">
              <CardHeader>
                <CardTitle className="font-serif flex items-center">
                  <Diamond className="mr-2 h-5 w-5 text-blue-500" />
                  Gems
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12</div>
                <p className="text-sm text-muted-foreground mt-2">Rare treasures from special quests</p>
              </CardContent>
            </Card>

            <Card className="medieval-card">
              <CardHeader>
                <CardTitle className="font-serif flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-green-500" />
                  Net Worth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{goldBalance + 1200}</div>
                <p className="text-sm text-muted-foreground mt-2">Total value of gold, items, and property</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

