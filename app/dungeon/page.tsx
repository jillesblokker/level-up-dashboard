"use client"

import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NavBar } from "@/components/nav-bar"
import { RiddleChallenge } from "@/components/riddle-challenge"
import { toast } from "@/components/ui/use-toast"

export default function DungeonPage() {
  const [goldBalance, setGoldBalance] = useState(1000)
  const [currentDungeon, setCurrentDungeon] = useState<any>(null)
  const [completed, setCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load gold balance
    const savedGold = localStorage.getItem("gold-balance")
    if (savedGold) {
      setGoldBalance(Number.parseInt(savedGold))
    }

    // Check if we have a current dungeon
    const dungeonData = localStorage.getItem("current-dungeon")

    if (dungeonData) {
      setCurrentDungeon(JSON.parse(dungeonData))
    }

    setIsLoading(false)
  }, [])

  const handleDungeonComplete = (success: boolean) => {
    if (success) {
      // Award gold for completing the dungeon
      const goldReward = Math.floor(Math.random() * 100) + 50 * (currentDungeon?.level || 1)
      const newGoldBalance = goldBalance + goldReward
      setGoldBalance(newGoldBalance)
      localStorage.setItem("gold-balance", String(newGoldBalance))

      toast({
        title: "Dungeon Completed!",
        description: `You successfully explored the dungeon and found ${goldReward} gold!`,
      })
    } else {
      // Lose gold for failing
      const goldLost = Math.floor(Math.random() * 30) + 10
      const newGoldBalance = Math.max(0, goldBalance - goldLost)
      setGoldBalance(newGoldBalance)
      localStorage.setItem("gold-balance", String(newGoldBalance))

      toast({
        title: "Dungeon Failed",
        description: `You were forced to retreat from the dungeon and lost ${goldLost} gold.`,
        variant: "destructive",
      })
    }

    // Clear the current dungeon
    localStorage.removeItem("current-dungeon")
    setCompleted(true)
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading dungeon...</div>
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <NavBar />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">
              {currentDungeon
                ? "Ancient Dungeon"
                : "Adventure"}
            </h1>
            <p className="text-muted-foreground">
              {currentDungeon
                ? "Explore the depths and find treasure"
                : "Face your challenges"}
            </p>
          </div>
          {completed && (
            <Link href="/map">
              <Button className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Map
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
            <CardHeader>
              <CardTitle className="font-serif">
                {currentDungeon
                  ? `Level ${currentDungeon.level} Dungeon Challenge`
                  : "Challenge"}
              </CardTitle>
              <CardDescription>
                {currentDungeon
                  ? "Solve the puzzle to navigate the dungeon safely"
                  : "Test your skills"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentDungeon && !completed && (
                <RiddleChallenge />
              )}
              {completed && (
                <div className="text-center py-8">
                  <p className="text-xl font-bold mb-4">Challenge Complete</p>
                  <p className="mb-6">You can now return to the map and continue your adventure.</p>
                  <Link href="/map">
                    <Button className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900">
                      Return to Map
                    </Button>
                  </Link>
                </div>
              )}
              {!currentDungeon && (
                <div className="text-center py-8">
                  <p className="text-xl font-bold mb-4">No Active Challenge</p>
                  <p className="mb-6">Return to the map and find a dungeon to challenge.</p>
                  <Link href="/map">
                    <Button className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900">
                      Return to Map
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

