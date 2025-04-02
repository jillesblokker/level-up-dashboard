"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCreatureStore } from "@/stores/creatureStore"

interface BattleMinigameProps {
  onClose: () => void
  onVictory: (gold: number, exp: number) => void
  onDefeat: () => void
}

type BattleAction = "fight" | "defend" | "duck" | "flee"
type BattleRound = {
  playerAction: BattleAction
  opponentAction: BattleAction
  damage: number
  description: string
}

export function BattleMinigame({ onClose, onVictory, onDefeat }: BattleMinigameProps) {
  const [playerHealth, setPlayerHealth] = useState(100)
  const [opponentHealth, setOpponentHealth] = useState(100)
  const [currentRound, setCurrentRound] = useState(1)
  const [battleLog, setBattleLog] = useState<BattleRound[]>([])
  const [isGameOver, setIsGameOver] = useState(false)
  const { creatures } = useCreatureStore()

  // Select a random creature as opponent
  const opponent = React.useMemo(() => {
    const availableCreatures = creatures.filter(c => !c.requirement)
    return availableCreatures[Math.floor(Math.random() * availableCreatures.length)]
  }, [creatures])

  const getOpponentAction = (): BattleAction => {
    const actions: BattleAction[] = ["fight", "defend", "duck", "flee"]
    return actions[Math.floor(Math.random() * actions.length)]
  }

  const calculateDamage = (attacker: "player" | "opponent", playerAction: BattleAction, opponentAction: BattleAction): number => {
    const baseDamage = Math.floor(Math.random() * 20) + 10 // 10-30 base damage

    if (attacker === "player") {
      switch (playerAction) {
        case "fight":
          if (opponentAction === "duck") return Math.floor(baseDamage * 0.5) // Half damage if opponent ducks
          if (opponentAction === "defend") return Math.floor(baseDamage * 0.7) // Reduced damage if opponent defends
          return baseDamage
        case "defend":
          return 0 // No damage when defending
        case "duck":
          return 0 // No damage when ducking
        case "flee":
          return 0 // No damage when fleeing
        default:
          return baseDamage
      }
    } else {
      switch (opponentAction) {
        case "fight":
          if (playerAction === "duck") return Math.floor(baseDamage * 0.5) // Half damage if player ducks
          if (playerAction === "defend") return Math.floor(baseDamage * 0.7) // Reduced damage if player defends
          return baseDamage
        case "defend":
          return 0 // No damage when defending
        case "duck":
          return 0 // No damage when ducking
        case "flee":
          return 0 // No damage when fleeing
        default:
          return baseDamage
      }
    }
  }

  const handleAction = (action: BattleAction) => {
    if (isGameOver) return

    const opponentAction = getOpponentAction()
    let description = ""

    // Handle flee attempt
    if (action === "flee") {
      const fleeSuccess = Math.random() < 0.4 // 40% chance to flee successfully
      if (fleeSuccess) {
        setBattleLog(prev => [...prev, {
          playerAction: action,
          opponentAction,
          damage: 0,
          description: "You successfully fled from battle!"
        }])
        onClose()
        return
      } else {
        description = "Flee attempt failed! "
      }
    }

    // Calculate damage
    const playerDamage = calculateDamage("player", action, opponentAction)
    const opponentDamage = calculateDamage("opponent", opponentAction, action)

    // Update health
    const newOpponentHealth = Math.max(0, opponentHealth - playerDamage)
    const newPlayerHealth = Math.max(0, playerHealth - opponentDamage)

    setOpponentHealth(newOpponentHealth)
    setPlayerHealth(newPlayerHealth)

    // Update battle log
    description += `You ${action}, opponent ${opponentAction}. `
    if (playerDamage > 0) description += `You deal ${playerDamage} damage. `
    if (opponentDamage > 0) description += `Opponent deals ${opponentDamage} damage.`

    setBattleLog(prev => [...prev, {
      playerAction: action,
      opponentAction,
      damage: playerDamage,
      description
    }])

    setCurrentRound(prev => prev + 1)
  }

  // Check for game over conditions
  useEffect(() => {
    if (playerHealth <= 0) {
      setIsGameOver(true)
      onDefeat()
    } else if (opponentHealth <= 0) {
      setIsGameOver(true)
      const goldReward = Math.floor(Math.random() * 301) + 200 // 200-500 gold
      const expReward = Math.floor(Math.random() * 51) + 50 // 50-100 exp
      onVictory(goldReward, expReward)
    }
  }, [playerHealth, opponentHealth, onDefeat, onVictory])

  return (
    <Card className="fixed inset-0 z-50 m-4 md:m-8 lg:m-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader>
        <CardTitle className="text-2xl">Battle vs {opponent?.name || "Unknown Creature"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span>Your Health</span>
              <span>{playerHealth}/100</span>
            </div>
            <Progress value={playerHealth} className="h-2" />
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span>Opponent Health</span>
              <span>{opponentHealth}/100</span>
            </div>
            <Progress value={opponentHealth} className="h-2" />
          </div>

          <ScrollArea className="h-[200px] rounded-md border p-4">
            {battleLog.map((round, index) => (
              <div key={index} className="mb-2">
                <span className="font-bold">Round {index + 1}:</span> {round.description}
              </div>
            ))}
          </ScrollArea>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => handleAction("fight")}
              disabled={isGameOver}
              variant="default"
            >
              Fight
            </Button>
            <Button
              onClick={() => handleAction("defend")}
              disabled={isGameOver}
              variant="secondary"
            >
              Defend
            </Button>
            <Button
              onClick={() => handleAction("duck")}
              disabled={isGameOver}
              variant="secondary"
            >
              Duck
            </Button>
            <Button
              onClick={() => handleAction("flee")}
              disabled={isGameOver}
              variant="destructive"
            >
              Flee
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 