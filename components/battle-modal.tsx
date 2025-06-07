"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Shield, Sword, Target, Zap } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"

interface BattleModalProps {
  isOpen: boolean
  onClose: () => void
  enemyName: string
  enemyLevel: number
  onBattleEnd: (won: boolean) => void
}

interface CombatState {
  playerHealth: number
  enemyHealth: number
  playerDefense: number
  enemyDefense: number
}

export function BattleModal({ isOpen, onClose, enemyName, enemyLevel, onBattleEnd }: BattleModalProps) {
  const [state, setState] = useState<CombatState>({
    playerHealth: 100,
    enemyHealth: 100,
    playerDefense: 0,
    enemyDefense: 0
  })
  const [isBattleOver, setIsBattleOver] = useState(false)
  const [turnCount, setTurnCount] = useState(0)

  useEffect(() => {
    if (isOpen) {
      // Reset battle state when modal opens
      setState({
        playerHealth: 100,
        enemyHealth: 100,
        playerDefense: 0,
        enemyDefense: 0
      })
      setIsBattleOver(false)
      setTurnCount(0)
    }
  }, [isOpen])

  const handlePlayerAction = (action: 'attack' | 'defend' | 'special' | 'focus') => {
    if (isBattleOver) return

    let damage = 0
    let newEnemyHealth = state.enemyHealth
    let newPlayerHealth = state.playerHealth
    let newPlayerDefense = state.playerDefense
    let newEnemyDefense = state.enemyDefense

    // Player turn
    switch (action) {
      case 'attack':
        damage = Math.max(0, 20 - newEnemyDefense)
        newEnemyHealth -= damage
        toast({
          title: "Attack!",
          description: `You deal ${damage} damage to ${enemyName}!`
        })
        break
      case 'defend':
        newPlayerDefense = 15
        toast({
          title: "Defend!",
          description: "You raise your defenses!"
        })
        break
      case 'special':
        if (turnCount >= 3) {
          damage = Math.max(0, 35 - newEnemyDefense)
          newEnemyHealth -= damage
          toast({
            title: "Special Attack!",
            description: `You unleash a powerful attack dealing ${damage} damage!`
          })
        } else {
          toast({
            title: "Not Ready!",
            description: "Special attack will be ready in " + (3 - turnCount) + " turns!"
          })
          return
        }
        break
      case 'focus':
        newPlayerDefense = 5
        newPlayerHealth = Math.min(100, newPlayerHealth + 15)
        toast({
          title: "Focus!",
          description: "You recover some health and maintain a defensive stance!"
        })
        break
    }

    // Enemy turn
    const enemyAction = Math.random()
    if (enemyAction > 0.7) {
      newEnemyDefense = 10
      toast({
        title: "Enemy Defends!",
        description: `${enemyName} takes a defensive stance!`
      })
    } else {
      const enemyDamage = Math.max(0, (15 + enemyLevel * 2) - newPlayerDefense)
      newPlayerHealth -= enemyDamage
      toast({
        title: "Enemy Attacks!",
        description: `${enemyName} deals ${enemyDamage} damage to you!`
      })
    }

    // Update state
    setState({
      playerHealth: newPlayerHealth,
      enemyHealth: newEnemyHealth,
      playerDefense: newPlayerDefense,
      enemyDefense: newEnemyDefense
    })
    setTurnCount(prev => prev + 1)

    // Check for battle end
    if (newPlayerHealth <= 0 || newEnemyHealth <= 0) {
      setIsBattleOver(true)
      const won = newEnemyHealth <= 0
      onBattleEnd(won)
      
      if (won) {
        const goldReward = Math.floor(Math.random() * 21) + 30 // 30-50 gold
        const expReward = Math.floor(Math.random() * 21) + 30 // 30-50 exp
        
        // Update gold
        const currentGold = parseInt(localStorage.getItem('goldBalance') || '0')
        const newGold = currentGold + goldReward
        localStorage.setItem('goldBalance', newGold.toString())
        window.dispatchEvent(new CustomEvent('gold-update', { detail: { gold: newGold } }))
        
        // Update experience
        const characterStats = JSON.parse(localStorage.getItem('character-stats') || '{"experience": 0}')
        characterStats.experience += expReward
        localStorage.setItem('character-stats', JSON.stringify(characterStats))
        window.dispatchEvent(new Event('character-stats-update'))
        
        toast({
          title: "Victory!",
          description: `You defeated ${enemyName} and earned ${goldReward} gold and ${expReward} experience!`
        })
      } else {
        const goldLoss = Math.floor(Math.random() * 11) + 10 // 10-20 gold loss
        const currentGold = parseInt(localStorage.getItem('goldBalance') || '0')
        const newGold = Math.max(0, currentGold - goldLoss)
        localStorage.setItem('goldBalance', newGold.toString())
        window.dispatchEvent(new CustomEvent('gold-update', { detail: { gold: newGold } }))
        
        toast({
          title: "Defeat!",
          description: `${enemyName} defeated you! You lost ${goldLoss} gold fleeing the battle.`,
          variant: "destructive"
        })
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => !isBattleOver && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Battle with {enemyName}</DialogTitle>
          <DialogDescription>
            Level {enemyLevel} Enemy
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Your Health</span>
              <span>{Math.max(0, Math.floor(state.playerHealth))}%</span>
            </div>
            <Progress value={Math.max(0, state.playerHealth)} className="h-3" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>{enemyName}&apos;s Health</span>
              <span>{Math.max(0, Math.floor(state.enemyHealth))}%</span>
            </div>
            <Progress value={Math.max(0, state.enemyHealth)} className="h-3" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => handlePlayerAction('attack')} disabled={isBattleOver}>
              <Sword className="mr-2 h-4 w-4" />
              Attack
            </Button>
            <Button onClick={() => handlePlayerAction('defend')} disabled={isBattleOver}>
              <Shield className="mr-2 h-4 w-4" />
              Defend
            </Button>
            <Button 
              onClick={() => handlePlayerAction('special')} 
              disabled={isBattleOver || turnCount < 3}
              variant={turnCount >= 3 ? "default" : "secondary"}
            >
              <Zap className="mr-2 h-4 w-4" />
              Special
            </Button>
            <Button onClick={() => handlePlayerAction('focus')} disabled={isBattleOver}>
              <Target className="mr-2 h-4 w-4" />
              Focus
            </Button>
          </div>
          {isBattleOver && (
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 