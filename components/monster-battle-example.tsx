"use client"

import React, { useState } from 'react'
import { MonsterBattle } from './monster-battle'
import { Button } from '@/components/ui/button'
import { Sword } from 'lucide-react'

// Example component showing how to integrate monster battles
export function MonsterBattleExample() {
  const [battleOpen, setBattleOpen] = useState(false)
  const [monsterType, setMonsterType] = useState<'dragon' | 'goblin' | 'troll' | 'wizard'>('dragon')

  const handleBattleComplete = (won: boolean, goldEarned: number, xpEarned: number) => {
    console.log(`Battle ${won ? 'won' : 'lost'}! Gold: ${goldEarned}, XP: ${xpEarned}`)
    // Here you would update the game state, remove the monster tile, etc.
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Monster Battle Test</h2>
      
      <div className="flex gap-2">
        <Button onClick={() => { setMonsterType('dragon'); setBattleOpen(true) }}>
          <Sword className="w-4 h-4 mr-2" />
          Fight Dragon
        </Button>
        <Button onClick={() => { setMonsterType('goblin'); setBattleOpen(true) }}>
          <Sword className="w-4 h-4 mr-2" />
          Fight Goblin
        </Button>
        <Button onClick={() => { setMonsterType('troll'); setBattleOpen(true) }}>
          <Sword className="w-4 h-4 mr-2" />
          Fight Troll
        </Button>
        <Button onClick={() => { setMonsterType('wizard'); setBattleOpen(true) }}>
          <Sword className="w-4 h-4 mr-2" />
          Fight Wizard
        </Button>
      </div>

      <MonsterBattle
        isOpen={battleOpen}
        onClose={() => setBattleOpen(false)}
        monsterType={monsterType}
        onBattleComplete={handleBattleComplete}
      />
    </div>
  )
} 