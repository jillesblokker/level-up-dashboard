"use client"

import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NavBar } from "@/components/nav-bar"
import { RiddleChallenge } from "@/components/riddle-challenge"
import { toast } from "@/components/ui/use-toast"
import { TEXT_CONTENT } from "@/lib/text-content"

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
        title: TEXT_CONTENT.dungeon.toasts.complete.title,
        description: TEXT_CONTENT.dungeon.toasts.complete.desc.replace("{amount}", String(goldReward)),
      })
    } else {
      // Lose gold for failing
      const goldLost = Math.floor(Math.random() * 30) + 10
      const newGoldBalance = Math.max(0, goldBalance - goldLost)
      setGoldBalance(newGoldBalance)
      localStorage.setItem("gold-balance", String(newGoldBalance))

      toast({
        title: TEXT_CONTENT.dungeon.toasts.failed.title,
        description: TEXT_CONTENT.dungeon.toasts.failed.desc.replace("{amount}", String(goldLost)),
        variant: "destructive",
      })
    }

    // Clear the current dungeon
    localStorage.removeItem("current-dungeon")
    setCompleted(true)
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">{TEXT_CONTENT.dungeon.loading}</div>
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <NavBar />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">
              {currentDungeon
                ? TEXT_CONTENT.dungeon.header.title
                : TEXT_CONTENT.dungeon.header.titleDefault}
            </h1>
            <p className="text-muted-foreground">
              {currentDungeon
                ? TEXT_CONTENT.dungeon.header.subtitle
                : TEXT_CONTENT.dungeon.header.subtitleDefault}
            </p>
          </div>
          {completed && (
            <Link href="/map">
              <Button className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {TEXT_CONTENT.dungeon.header.return}
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-gradient-to-b from-black to-gray-900 border-amber-800/20">
            <CardHeader>
              <CardTitle className="font-serif">
                {currentDungeon
                  ? TEXT_CONTENT.dungeon.challenge.title.replace("{level}", String(currentDungeon.level))
                  : TEXT_CONTENT.dungeon.challenge.titleDefault}
              </CardTitle>
              <CardDescription>
                {currentDungeon
                  ? TEXT_CONTENT.dungeon.challenge.subtitle
                  : TEXT_CONTENT.dungeon.challenge.subtitleDefault}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentDungeon && !completed && (
                <RiddleChallenge />
              )}
              {completed && (
                <div className="text-center py-8">
                  <p className="text-xl font-bold mb-4">{TEXT_CONTENT.dungeon.complete.title}</p>
                  <p className="mb-6">{TEXT_CONTENT.dungeon.complete.desc}</p>
                  <Link href="/map">
                    <Button className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900">
                      {TEXT_CONTENT.dungeon.complete.button}
                    </Button>
                  </Link>
                </div>
              )}
              {!currentDungeon && (
                <div className="text-center py-8">
                  <p className="text-xl font-bold mb-4">{TEXT_CONTENT.dungeon.noActive.title}</p>
                  <p className="mb-6">{TEXT_CONTENT.dungeon.noActive.desc}</p>
                  <Link href="/map">
                    <Button className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900">
                      {TEXT_CONTENT.dungeon.noActive.button}
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

