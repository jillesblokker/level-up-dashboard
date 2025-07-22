"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Shield, Sword, Zap, Heart, Shield as Armor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { gainGold } from '@/lib/gold-manager'
import { updateCharacterStats } from '@/lib/character-stats-manager'
import { toast } from '@/components/ui/use-toast'

interface MonsterBattleProps {
  isOpen: boolean
  onClose: () => void
  monsterType: 'dragon' | 'goblin' | 'troll' | 'wizard'
  onBattleComplete: (won: boolean, goldEarned: number, xpEarned: number) => void
}

interface Weapon {
  id: string
  name: string
  icon: React.ReactNode
  color: string
}

const weapons: Weapon[] = [
  { id: 'shield', name: 'Shield', icon: <Shield className="w-8 h-8" />, color: 'bg-blue-500' },
  { id: 'sword', name: 'Sword', icon: <Sword className="w-8 h-8" />, color: 'bg-red-500' },
  { id: 'armor', name: 'Armor', icon: <Armor className="w-8 h-8" />, color: 'bg-gray-500' },
  { id: 'artifact', name: 'Artifact', icon: <Zap className="w-8 h-8" />, color: 'bg-purple-500' },
  { id: 'potion', name: 'Potion', icon: <Heart className="w-8 h-8" />, color: 'bg-green-500' },
]

const monsterData = {
  dragon: {
    name: 'Ancient Dragon',
    image: '/images/creatures/dragon.png',
    description: 'A fearsome dragon with scales as hard as steel',
    difficulty: 'Hard'
  },
  goblin: {
    name: 'Crafty Goblin',
    image: '/images/creatures/goblin.png',
    description: 'A sneaky goblin with sharp daggers',
    difficulty: 'Easy'
  },
  troll: {
    name: 'Mountain Troll',
    image: '/images/creatures/troll.png',
    description: 'A massive troll with incredible strength',
    difficulty: 'Medium'
  },
  wizard: {
    name: 'Dark Wizard',
    image: '/images/creatures/wizard.png',
    description: 'A powerful wizard with dark magic',
    difficulty: 'Hard'
  }
}

export function MonsterBattle({ isOpen, onClose, monsterType, onBattleComplete }: MonsterBattleProps) {
  const [currentRound, setCurrentRound] = useState(1)
  const [sequence, setSequence] = useState<string[]>([])
  const [playerSequence, setPlayerSequence] = useState<string[]>([])
  const [isShowingSequence, setIsShowingSequence] = useState(false)
  const [isPlayerTurn, setIsPlayerTurn] = useState(false)
  const [highlightedWeapon, setHighlightedWeapon] = useState<string | null>(null)
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing')
  const [goldLost, setGoldLost] = useState(0)

  const monster = monsterData[monsterType]

  // Generate new sequence for current round
  const generateSequence = useCallback(() => {
    const roundLength = 2 + currentRound // Starts with 3 items, adds 1 each round
    const newSequence: string[] = []
    
    for (let i = 0; i < roundLength; i++) {
      const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)]
      if (randomWeapon) {
        newSequence.push(randomWeapon.id)
      }
    }
    
    setSequence(newSequence)
    setPlayerSequence([])
  }, [currentRound])

  // Show sequence to player
  const showSequence = useCallback(async () => {
    setIsShowingSequence(true)
    setIsPlayerTurn(false)
    
    for (let i = 0; i < sequence.length; i++) {
      const weaponId = sequence[i]
      if (weaponId) {
        setHighlightedWeapon(weaponId)
        await new Promise(resolve => setTimeout(resolve, 800))
        setHighlightedWeapon(null)
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    setIsShowingSequence(false)
    setIsPlayerTurn(true)
  }, [sequence])

  // Handle weapon click
  const handleWeaponClick = (weaponId: string) => {
    if (!isPlayerTurn || isShowingSequence) return
    
    const newPlayerSequence = [...playerSequence, weaponId]
    setPlayerSequence(newPlayerSequence)
    
    // Check if sequence is correct so far
    const isCorrect = newPlayerSequence.every((item, index) => item === sequence[index])
    
    if (!isCorrect) {
      // Player made a mistake
      handleRoundLoss()
      return
    }
    
    // Check if round is complete
    if (newPlayerSequence.length === sequence.length) {
      if (currentRound === 5) {
        // Game won!
        handleGameWin()
      } else {
        // Next round
        setCurrentRound(prev => prev + 1)
        setTimeout(() => {
          generateSequence()
          setTimeout(showSequence, 1000)
        }, 1000)
      }
    }
  }

  const handleRoundLoss = () => {
    const lostGold = 10
    setGoldLost(prev => prev + lostGold)
    gainGold(-lostGold, 'monster-battle-loss')
    
    toast({
      title: "Round Failed!",
      description: `You lost ${lostGold} gold! Try to remember the sequence better.`,
      variant: "destructive",
    })
    
    // Continue to next round or end game
    if (currentRound === 5) {
      handleGameLoss()
    } else {
      setCurrentRound(prev => prev + 1)
      setTimeout(() => {
        generateSequence()
        setTimeout(showSequence, 1000)
      }, 1000)
    }
  }

  const handleGameWin = () => {
    const earnedGold = 100
    const earnedXP = 100
    
    setGameState('won')
    gainGold(earnedGold, 'monster-battle-win')
    updateCharacterStats({ experience: earnedXP })
    
    toast({
      title: "Victory!",
      description: `You defeated the ${monster.name}! Earned ${earnedGold} gold and ${earnedXP} XP!`,
    })
    
    setTimeout(() => {
      onBattleComplete(true, earnedGold, earnedXP)
      onClose()
    }, 2000)
  }

  const handleGameLoss = () => {
    setGameState('lost')
    
    toast({
      title: "Defeat!",
      description: `The ${monster.name} was too strong! You lost ${goldLost} gold total.`,
      variant: "destructive",
    })
    
    setTimeout(() => {
      onBattleComplete(false, -goldLost, 0)
      onClose()
    }, 2000)
  }

  // Initialize game
  useEffect(() => {
    if (isOpen) {
      setCurrentRound(1)
      setGameState('playing')
      setGoldLost(0)
      generateSequence()
      setTimeout(showSequence, 1000)
    }
  }, [isOpen, generateSequence, showSequence])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-2xl bg-gray-900 border-amber-800/30 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-amber-400">
            Battle Against {monster.name}
          </CardTitle>
          <div className="text-sm text-gray-400">
            Round {currentRound}/5 • Difficulty: {monster.difficulty}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Monster Card */}
          <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg border border-amber-800/20">
            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🐉</span>
            </div>
            <div>
              <h3 className="font-bold text-lg">{monster.name}</h3>
              <p className="text-sm text-gray-400">{monster.description}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{currentRound}/5</span>
            </div>
            <Progress value={(currentRound / 5) * 100} className="h-2" />
          </div>

          {/* Game Status */}
          <div className="text-center">
            {isShowingSequence && (
              <div className="text-amber-400 font-bold">
                Watch the sequence carefully...
              </div>
            )}
            {isPlayerTurn && !isShowingSequence && (
              <div className="text-green-400 font-bold">
                Your turn! Repeat the sequence
              </div>
            )}
            {gameState === 'won' && (
              <div className="text-green-400 font-bold text-xl">
                🎉 Victory! You defeated the monster!
              </div>
            )}
            {gameState === 'lost' && (
              <div className="text-red-400 font-bold text-xl">
                💀 Defeat! The monster was too strong!
              </div>
            )}
          </div>

          {/* Weapons Grid */}
          <div className="grid grid-cols-5 gap-3">
            {weapons.map((weapon) => (
              <Button
                key={weapon.id}
                onClick={() => handleWeaponClick(weapon.id)}
                disabled={!isPlayerTurn || isShowingSequence || gameState !== 'playing'}
                className={cn(
                  "h-20 flex flex-col items-center justify-center gap-2 transition-all duration-200",
                  highlightedWeapon === weapon.id && "scale-110 ring-4 ring-yellow-400",
                  isPlayerTurn && !isShowingSequence && "hover:scale-105",
                  weapon.color
                )}
                aria-label={`Select ${weapon.name}`}
              >
                {weapon.icon}
                <span className="text-xs font-medium">{weapon.name}</span>
              </Button>
            ))}
          </div>

          {/* Player Progress */}
          {isPlayerTurn && (
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">
                Your sequence: {playerSequence.length}/{sequence.length}
              </div>
              <div className="flex justify-center gap-2">
                {playerSequence.map((item, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full bg-green-500"
                    aria-label={`Correct item ${index + 1}`}
                  />
                ))}
                {Array.from({ length: sequence.length - playerSequence.length }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="w-4 h-4 rounded-full bg-gray-600"
                    aria-label={`Remaining item ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-center">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-amber-800/30 text-amber-400 hover:bg-amber-800/20"
            >
              Close Battle
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 