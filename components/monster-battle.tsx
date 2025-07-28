"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Shield, Sword, Zap, Heart, Shield as Armor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { gainGold } from '@/lib/gold-manager'
import { updateCharacterStat } from '@/lib/character-stats-manager'
import { toast } from '@/components/ui/use-toast'
import Image from 'next/image'

interface MonsterBattleProps {
  isOpen: boolean
  onClose: () => void
  monsterType: 'dragon' | 'goblin' | 'troll' | 'wizard' | 'pegasus' | 'fairy'
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
    name: 'Dragoni',
    image: '/images/achievements/201.png',
    description: 'A fearsome dragon with scales as hard as steel',
    difficulty: 'Hard',
    achievementId: '201'
  },
  goblin: {
    name: 'Orci',
    image: '/images/achievements/202.png',
    description: 'A sneaky goblin with sharp daggers',
    difficulty: 'Easy',
    achievementId: '202'
  },
  troll: {
    name: 'Trollie',
    image: '/images/achievements/203.png',
    description: 'A massive troll with incredible strength',
    difficulty: 'Medium',
    achievementId: '203'
  },
  wizard: {
    name: 'Sorceror',
    image: '/images/achievements/204.png',
    description: 'A powerful wizard with dark magic',
    difficulty: 'Hard',
    achievementId: '204'
  },
  pegasus: {
    name: 'Peggie',
    image: '/images/achievements/205.png',
    description: 'A majestic winged horse with divine powers',
    difficulty: 'Medium',
    achievementId: '205'
  },
  fairy: {
    name: 'Fairiel',
    image: '/images/achievements/206.png',
    description: 'A magical fairy with nature magic',
    difficulty: 'Easy',
    achievementId: '206'
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
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0)

  const monster = monsterData[monsterType]
  
  // Debug logging
  console.log('Monster battle props:', { isOpen, monsterType, monster })
  console.log('Monster image path:', monster?.image)
  console.log('Monster data:', monsterData)
  console.log('Monster type:', monsterType)
  console.log('Sequence state:', { sequence, highlightedWeapon, isShowingSequence, isPlayerTurn, currentSequenceIndex })

  // Generate new sequence for current round
  const generateSequence = useCallback((round: number) => {
    const roundLength = 2 + round // Starts with 3 items, adds 1 each round
    const newSequence: string[] = []
    
    for (let i = 0; i < roundLength; i++) {
      const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)]
      if (randomWeapon) {
        newSequence.push(randomWeapon.id)
      }
    }
    
    return newSequence
  }, [])

  // Show sequence to player
  const showSequence = useCallback(async (sequenceToShow: string[]) => {
    setIsShowingSequence(true)
    setIsPlayerTurn(false)
    setCurrentSequenceIndex(0)
    
    for (let i = 0; i < sequenceToShow.length; i++) {
      const weaponId = sequenceToShow[i]
      if (weaponId) {
        setHighlightedWeapon(weaponId)
        setCurrentSequenceIndex(i + 1)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Show each weapon for 1 second
        setHighlightedWeapon(null)
        await new Promise(resolve => setTimeout(resolve, 300)) // Brief pause between weapons
      }
    }
    
    setIsShowingSequence(false)
    setIsPlayerTurn(true)
    setCurrentSequenceIndex(0)
  }, [])

  // Initialize game
  useEffect(() => {
    if (isOpen) {
      setCurrentRound(1)
      setGameState('playing')
      setGoldLost(0)
      setPlayerSequence([])
      setCurrentSequenceIndex(0)
      
      // Generate initial sequence
      const initialSequence = generateSequence(1)
      setSequence(initialSequence)
      
      // Show sequence after a brief delay
      const timer = setTimeout(() => {
        showSequence(initialSequence)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
    // Return empty cleanup function when modal is not open
    return () => {}
  }, [isOpen, generateSequence, showSequence])

  // Handle weapon click
  const handleWeaponClick = (weaponId: string) => {
    if (!isPlayerTurn || isShowingSequence || gameState !== 'playing') return
    
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
        const nextRound = currentRound + 1
        setCurrentRound(nextRound)
        setPlayerSequence([])
        
        // Generate new sequence for next round
        const newSequence = generateSequence(nextRound)
        setSequence(newSequence)
        
        // Show new sequence after a delay
        setTimeout(() => {
          showSequence(newSequence)
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
      const nextRound = currentRound + 1
      setCurrentRound(nextRound)
      setPlayerSequence([])
      
      // Generate new sequence for next round
      const newSequence = generateSequence(nextRound)
      setSequence(newSequence)
      
      // Show new sequence after a delay
      setTimeout(() => {
        showSequence(newSequence)
      }, 1000)
    }
  }

  const handleGameWin = () => {
    const earnedGold = 100
    const earnedXP = 100
    
    setGameState('won')
    gainGold(earnedGold, 'monster-battle-win')
            updateCharacterStat('experience', earnedXP)
    
    // Add success animation class
    const battleContainer = document.querySelector('.monster-battle-container')
    if (battleContainer) {
      battleContainer.classList.add('animate-pulse', 'bg-green-500/20', 'border-green-500')
      setTimeout(() => {
        battleContainer.classList.remove('animate-pulse', 'bg-green-500/20', 'border-green-500')
      }, 1000)
    }
    
    // Unlock achievement for defeating this monster
    if (monster.achievementId) {
      console.log('Attempting to unlock monster achievement:', monster.achievementId, 'for monster:', monster.name)
      fetch('/api/achievements/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementId: monster.achievementId })
      }).then(response => {
        console.log('Achievement unlock response status:', response.status)
        return response.json()
      }).then(data => {
        console.log('Achievement unlock response data:', data)
      }).catch(error => {
        console.error('Failed to unlock achievement:', error)
      })
    }
    
    toast({
      title: "Victory!",
      description: `You defeated the ${monster.name}! Earned ${earnedGold} gold and ${earnedXP} XP! Achievement unlocked!`,
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

  if (!isOpen) return null

  return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm">
      <Card className="monster-battle-container w-full max-w-2xl bg-gray-900 border-amber-800/30 text-white transition-all duration-300">
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
                      <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg border border-amber-800">
            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src={monster.image} 
                alt={monster.name}
                className="w-full h-full object-cover"
                onLoad={() => {
                  console.log('Monster image loaded successfully:', monster.image);
                }}
                onError={(e) => {
                  console.error('Failed to load monster image:', monster.image);
                  console.error('Error details:', e);
                  // Try to show a fallback
                  e.currentTarget.src = '/images/placeholders/item-placeholder.svg';
                }}
              />
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
              <div className="text-amber-400 font-bold text-lg animate-pulse">
                👀 Watch the sequence carefully... ({currentSequenceIndex}/{sequence.length})
              </div>
            )}
            {isPlayerTurn && !isShowingSequence && (
              <div className="text-green-400 font-bold">
                Your turn! Repeat the sequence ({playerSequence.length}/{sequence.length})
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
                  "h-20 flex flex-col items-center justify-center gap-2 transition-all duration-300",
                  highlightedWeapon === weapon.id && "ring-4 ring-orange-500 bg-orange-600 scale-125 shadow-xl animate-pulse",
                  isPlayerTurn && !isShowingSequence && "hover:bg-opacity-80",
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
              className="border-amber-800 text-amber-400 hover:bg-amber-800"
            >
              Close Battle
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 