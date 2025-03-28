"use client"

import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NavBar } from "@/components/nav-bar"
import { DungeonChallenge } from "@/components/dungeon-challenge"
import { MonsterBattle } from "@/components/monster-battle"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"

export default function DungeonPage() {
  const router = useRouter()
  const [goldBalance, setGoldBalance] = useState(1000)
  const [currentDungeon, setCurrentDungeon] = useState<any>(null)
  const [currentMonster, setCurrentMonster] = useState<any>(null)
  const [completed, setCompleted] = useState(false)
  const [monsterHealth, setMonsterHealth] = useState(100)
  const [playerHealth, setPlayerHealth] = useState(100)
  const [isLoading, setIsLoading] = useState(true)
  const [isBattleOver, setIsBattleOver] = useState(false)

  useEffect(() => {
    // Load gold balance
    const savedGold = localStorage.getItem("gold-balance")
    if (savedGold) {
      setGoldBalance(Number.parseInt(savedGold))
    }

    // Check if we have a current dungeon or monster
    const dungeonData = localStorage.getItem("current-dungeon")
    const monsterData = localStorage.getItem("current-monster")

    if (dungeonData) {
      setCurrentDungeon(JSON.parse(dungeonData))
    } else if (monsterData) {
      setCurrentMonster(JSON.parse(monsterData))
    }

    if (monsterData) {
      setMonsterHealth(100)
      setPlayerHealth(100)
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

  const handleMonsterBattleComplete = (success: boolean) => {
    if (success) {
      // Award gold for defeating the monster
      const goldReward = Math.floor(Math.random() * 50) + 20 * (currentMonster?.level || 1)
      const newGoldBalance = goldBalance + goldReward
      setGoldBalance(newGoldBalance)
      localStorage.setItem("gold-balance", String(newGoldBalance))

      toast({
        title: "Victory!",
        description: `You defeated the ${currentMonster?.type || "monster"} and found ${goldReward} gold!`,
      })
    } else {
      // Lose gold for being defeated
      const goldLost = Math.floor(Math.random() * 20) + 5
      const newGoldBalance = Math.max(0, goldBalance - goldLost)
      setGoldBalance(newGoldBalance)
      localStorage.setItem("gold-balance", String(newGoldBalance))

      toast({
        title: "Defeat!",
        description: `You were defeated by the ${currentMonster?.type || "monster"} and lost ${goldLost} gold.`,
        variant: "destructive",
      })
    }

    // Clear the current monster
    localStorage.removeItem("current-monster")
    setCompleted(true)
  }

  const attack = () => {
    if (isBattleOver) return

    // Player attacks monster
    const playerDamage = Math.floor(Math.random() * 20) + 10
    const newMonsterHealth = Math.max(0, monsterHealth - playerDamage)
    setMonsterHealth(newMonsterHealth)

    // Check if monster is defeated
    if (newMonsterHealth <= 0) {
      handleVictory()
      return
    }

    // Monster counter-attacks
    const monsterDamage = Math.floor(Math.random() * 15) + 5
    const newPlayerHealth = Math.max(0, playerHealth - monsterDamage)
    setPlayerHealth(newPlayerHealth)

    // Check if player is defeated
    if (newPlayerHealth <= 0) {
      handleDefeat()
    }
  }

  const handleVictory = () => {
    setIsBattleOver(true)
    const goldWon = Math.floor(Math.random() * 30) + 20
    const expWon = Math.floor(Math.random() * 50) + 30
    
    // Update player's gold
    const currentGold = Number(localStorage.getItem("gold-balance") || "0")
    localStorage.setItem("gold-balance", String(currentGold + goldWon))

    // Clean up monster/dungeon data
    localStorage.removeItem("current-monster")
    localStorage.removeItem("current-dungeon")

    toast({
      title: "Victory!",
      description: `You defeated the ${currentMonster?.type}! Earned ${goldWon} gold and ${expWon} exp.`,
      variant: "default",
    })

    // Update the grid to remove the monster/dungeon
    const position = currentMonster?.position || currentDungeon?.position
    if (position) {
      const grid = JSON.parse(localStorage.getItem("realm-grid") || "[]")
      if (grid[position.y] && grid[position.y][position.x]) {
        grid[position.y][position.x] = {
          id: `tile-${position.y}-${position.x}`,
          type: "grass",
          connections: [],
          rotation: 0,
          revealed: true
        }
        localStorage.setItem("realm-grid", JSON.stringify(grid))
      }
    }

    setTimeout(() => {
      router.push("/realm")
    }, 2000)
  }

  const handleDefeat = () => {
    setIsBattleOver(true)
    // Deduct gold for losing
    const currentGold = Number(localStorage.getItem("gold-balance") || "0")
    localStorage.setItem("gold-balance", String(Math.max(0, currentGold - 20)))

    // Clean up monster/dungeon data
    localStorage.removeItem("current-monster")
    localStorage.removeItem("current-dungeon")

    // Update the grid to remove the monster/dungeon
    const position = currentMonster?.position || currentDungeon?.position
    if (position) {
      const grid = JSON.parse(localStorage.getItem("realm-grid") || "[]")
      if (grid[position.y] && grid[position.y][position.x]) {
        grid[position.y][position.x] = {
          id: `tile-${position.y}-${position.x}`,
          type: "grass",
          connections: [],
          rotation: 0,
          revealed: true
        }
        localStorage.setItem("realm-grid", JSON.stringify(grid))
      }
    }

    toast({
      title: "Defeat!",
      description: "You were defeated and lost 20 gold.",
      variant: "destructive",
    })

    setTimeout(() => {
      router.push("/realm")
    }, 2000)
  }

  const flee = () => {
    if (isBattleOver) return

    // 70% chance to successfully flee
    if (Math.random() < 0.7) {
      // Clean up monster/dungeon data
      localStorage.removeItem("current-monster")
      localStorage.removeItem("current-dungeon")

      // Update the grid to remove the monster/dungeon
      const position = currentMonster?.position || currentDungeon?.position
      if (position) {
        const grid = JSON.parse(localStorage.getItem("realm-grid") || "[]")
        if (grid[position.y] && grid[position.y][position.x]) {
          grid[position.y][position.x] = {
            id: `tile-${position.y}-${position.x}`,
            type: "grass",
            connections: [],
            rotation: 0,
            revealed: true
          }
          localStorage.setItem("realm-grid", JSON.stringify(grid))
        }
      }

      toast({
        title: "Escaped!",
        description: "You successfully fled from battle.",
        variant: "default",
      })
      setTimeout(() => {
        router.push("/realm")
      }, 1000)
    } else {
      // Take damage for failed flee attempt
      const fleeDamage = Math.floor(Math.random() * 20) + 10
      const newPlayerHealth = Math.max(0, playerHealth - fleeDamage)
      setPlayerHealth(newPlayerHealth)
      
      toast({
        title: "Failed to Escape!",
        description: `The ${currentMonster?.type} caught you! Took ${fleeDamage} damage.`,
        variant: "destructive",
      })

      if (newPlayerHealth <= 0) {
        handleDefeat()
      }
    }
  }

  if (isLoading || !currentMonster) {
    return <div className="flex min-h-screen items-center justify-center">Loading battle...</div>
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
                : currentMonster
                  ? `Monster Battle: ${currentMonster.type}`
                  : "Adventure"}
            </h1>
            <p className="text-muted-foreground">
              {currentDungeon
                ? "Explore the depths and find treasure"
                : currentMonster
                  ? "Defeat the monster to continue"
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
                  : currentMonster
                    ? `Level ${currentMonster.level} ${currentMonster.type.charAt(0).toUpperCase() + currentMonster.type.slice(1)} Battle`
                    : "Challenge"}
              </CardTitle>
              <CardDescription>
                {currentDungeon
                  ? "Solve the puzzle to navigate the dungeon safely"
                  : currentMonster
                    ? "Match pairs to attack and defend against the monster"
                    : "Test your skills"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentDungeon && !completed && (
                <DungeonChallenge
                  difficulty={currentDungeon.level <= 1 ? "easy" : currentDungeon.level === 2 ? "medium" : "hard"}
                  onComplete={handleDungeonComplete}
                />
              )}
              {currentMonster && !completed && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Monster Health</span>
                      <span>{monsterHealth}/100</span>
                    </div>
                    <Progress value={monsterHealth} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Your Health</span>
                      <span>{playerHealth}/100</span>
                    </div>
                    <Progress value={playerHealth} />
                  </div>
                </div>
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
              {!currentDungeon && !currentMonster && (
                <div className="text-center py-8">
                  <p className="text-xl font-bold mb-4">No Active Challenge</p>
                  <p className="mb-6">Return to the map and find a dungeon or monster to challenge.</p>
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

        <div className="flex gap-4">
          <Button onClick={attack} className="flex-1" disabled={isBattleOver}>
            Attack
          </Button>
          <Button onClick={flee} className="flex-1" disabled={isBattleOver} variant="outline">
            Flee
          </Button>
        </div>
      </main>
    </div>
  )
}

