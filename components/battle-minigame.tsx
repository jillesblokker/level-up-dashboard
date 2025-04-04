"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCreatureStore } from "@/stores/creatureStore"
import { cn } from "@/lib/utils"

interface BattleMinigameProps {
  onClose: () => void
  onVictory: (gold: number, exp: number) => void
  onDefeat: () => void
  enemyName: string
  enemyLevel: number
}

export function BattleMinigame({ onClose, onVictory, onDefeat, enemyName, enemyLevel }: BattleMinigameProps) {
  const [playerHealth, setPlayerHealth] = useState(100)
  const [playerMana, setPlayerMana] = useState(100)
  const [enemyHealth, setEnemyHealth] = useState(100)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [battleLog, setBattleLog] = useState<string[]>([`A level ${enemyLevel} ${enemyName} appears!`])
  const [isGameOver, setIsGameOver] = useState(false)
  const { creatures } = useCreatureStore()

  // Select a random creature as opponent
  const opponent = React.useMemo(() => {
    const availableCreatures = creatures.filter(c => !c.requirement)
    return availableCreatures[Math.floor(Math.random() * availableCreatures.length)]
  }, [creatures])

  const addToBattleLog = (message: string) => {
    setBattleLog(prev => [...prev, message])
  }

  const handleEnemyTurn = () => {
    const attacks = [
      { name: 'Slash', damage: 15, chance: 0.4 },
      { name: 'Bite', damage: 20, chance: 0.3 },
      { name: 'Fierce Attack', damage: 25, chance: 0.3 }
    ]

    const roll = Math.random()
    let selectedAttack = attacks[0]
    let cumulative = 0

    for (const attack of attacks) {
      cumulative += attack.chance
      if (roll <= cumulative) {
        selectedAttack = attack
        break
      }
    }

    const damage = Math.floor(selectedAttack.damage * (0.9 + Math.random() * 0.2))
    setPlayerHealth(prev => Math.max(0, prev - damage))
    addToBattleLog(`${enemyName} uses ${selectedAttack.name} and deals ${damage} damage!`)

    if (playerHealth - damage <= 0) {
      setIsGameOver(true)
      addToBattleLog('You have been defeated!')
      setTimeout(onDefeat, 1500)
    } else {
      setIsPlayerTurn(true)
    }
  }

  useEffect(() => {
    if (!isPlayerTurn && !isGameOver) {
      const timer = setTimeout(handleEnemyTurn, 1000)
      return () => clearTimeout(timer)
    }
  }, [isPlayerTurn, isGameOver])

  const handlePlayerAction = (action: string) => {
    if (!isPlayerTurn || isGameOver) return

    let damage = 0
    let manaCost = 0

    switch (action) {
      case 'attack':
        damage = Math.floor(15 * (0.9 + Math.random() * 0.2))
        addToBattleLog(`You attack and deal ${damage} damage!`)
        break
      case 'heavy':
        damage = Math.floor(25 * (0.9 + Math.random() * 0.2))
        manaCost = 20
        addToBattleLog(`You use Heavy Strike and deal ${damage} damage!`)
        break
      case 'special':
        damage = Math.floor(35 * (0.9 + Math.random() * 0.2))
        manaCost = 40
        addToBattleLog(`You use Special Attack and deal ${damage} damage!`)
        break
      case 'heal':
        const healing = Math.floor(30 * (0.9 + Math.random() * 0.2))
        manaCost = 30
        setPlayerHealth(prev => Math.min(100, prev + healing))
        addToBattleLog(`You heal for ${healing} health!`)
        break
    }

    if (playerMana >= manaCost) {
      setPlayerMana(prev => prev - manaCost)
      setEnemyHealth(prev => Math.max(0, prev - damage))

      if (enemyHealth - damage <= 0) {
        setIsGameOver(true)
        addToBattleLog('Victory! You defeated the enemy!')
        setTimeout(() => {
          const goldReward = Math.floor(Math.random() * 301) + 200 // 200-500 gold
          const expReward = Math.floor(Math.random() * 51) + 50 // 50-100 exp
          onVictory(goldReward, expReward)
        }, 1500)
      } else {
        setIsPlayerTurn(false)
      }
    } else if (manaCost > 0) {
      addToBattleLog('Not enough mana!')
    }
  }

  return (
    <Card className="fixed inset-0 z-50 m-4 md:m-8 lg:m-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader>
        <CardTitle className="text-2xl">Battle vs {enemyName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span>Your Health</span>
              <span>{playerHealth}/100</span>
            </div>
            <Progress value={playerHealth} className="h-2" />
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span>Your Mana</span>
              <span>{playerMana}/100</span>
            </div>
            <Progress value={playerMana} className={cn("h-2", "bg-blue-500")} />
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span>{enemyName}'s Health</span>
              <span>{enemyHealth}/100</span>
            </div>
            <Progress value={enemyHealth} className={cn("h-2", "bg-red-500")} />
          </div>

          <ScrollArea className="h-[200px] rounded-md border p-4">
            {battleLog.map((log, index) => (
              <div key={index} className="mb-2">
                {log}
              </div>
            ))}
          </ScrollArea>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => handlePlayerAction('attack')}
              disabled={!isPlayerTurn || isGameOver}
              variant="default"
            >
              Attack
            </Button>
            <Button
              onClick={() => handlePlayerAction('heavy')}
              disabled={!isPlayerTurn || isGameOver || playerMana < 20}
              variant="default"
            >
              Heavy Strike (20 MP)
            </Button>
            <Button
              onClick={() => handlePlayerAction('special')}
              disabled={!isPlayerTurn || isGameOver || playerMana < 40}
              variant="default"
            >
              Special Attack (40 MP)
            </Button>
            <Button
              onClick={() => handlePlayerAction('heal')}
              disabled={!isPlayerTurn || isGameOver || playerMana < 30}
              variant="default"
            >
              Heal (30 MP)
            </Button>
          </div>

          <div className="text-center text-sm">
            {isPlayerTurn ? "Your turn!" : `${enemyName}'s turn...`}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 