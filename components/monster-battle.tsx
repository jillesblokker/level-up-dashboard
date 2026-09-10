"use client"

import { logger } from "@/lib/logger";

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Shield, Sword, Zap, Heart, Shield as Armor, Users, Trophy, Sparkles, Play, Skull } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { gainGold } from '@/lib/gold-manager'
import { addToCharacterStat } from '@/lib/character-stats-service'
import { toast } from '@/components/ui/use-toast'
import Image from 'next/image'
import { TEXT_CONTENT } from '@/lib/text-content'
import { useUser } from "@clerk/nextjs"
import { useCitizensStore } from "@/stores/citizensStore"
import { getUserPreference, setUserPreference } from "@/lib/user-preferences-manager"
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { recordDungeonBattleWin } from "@/lib/tile-quest-service"
import { unwrapApiResponse } from "@/lib/api-response-unwrapper"

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
  { id: 'shield', name: 'Shield', icon: <Shield className="w-7 h-7" />, color: 'bg-blue-500 hover:bg-blue-600' },
  { id: 'sword', name: 'Sword', icon: <Sword className="w-7 h-7" />, color: 'bg-red-500 hover:bg-red-600' },
  { id: 'armor', name: 'Armor', icon: <Armor className="w-7 h-7" />, color: 'bg-zinc-500 hover:bg-zinc-600' },
  { id: 'artifact', name: 'Artifact', icon: <Zap className="w-7 h-7" />, color: 'bg-purple-500 hover:bg-purple-600' },
  { id: 'potion', name: 'Potion', icon: <Heart className="w-7 h-7" />, color: 'bg-green-500 hover:bg-green-600' },
]

const monsterData = {
  dragon: {
    name: 'Dragoni',
    image: '/images/achievements/201.webp',
    description: 'A shadow beast of Necrion with scales forged in the Void Drift.',
    difficulty: 'Hard',
    achievementId: '201',
    achievementTitle: 'Ancient Dragon Slayer',
    achievementDesc: 'Face the ancient winged beast. Watch its movements closely and strike true.',
  },
  goblin: {
    name: 'Goblino',
    image: '/images/achievements/202.webp',
    description: 'A mischievous shadow creature feeding on broken streaks.',
    difficulty: 'Easy',
    achievementId: '202',
    achievementTitle: 'Goblin Hunter',
    achievementDesc: 'The crafty looting menace hides in the shadows. Match its cunning moves.',
  },
  troll: {
    name: 'Trollie',
    image: '/images/achievements/203.webp',
    description: 'A massive troll with incredible strength.',
    difficulty: 'Medium',
    achievementId: '203',
    achievementTitle: 'Troll Crusher',
    achievementDesc: 'A mountain of muscle blocks your path. Mimic its brute force to bring it down.',
  },
  wizard: {
    name: 'Sorceror',
    image: '/images/achievements/204.webp',
    description: 'A powerful wizard with dark magic.',
    difficulty: 'Hard',
    achievementId: '204',
    achievementTitle: 'Dark Wizard Vanquisher',
    achievementDesc: 'Magic swirls in complex patterns. Memorize the arcane sequence to dispel the darkness.',
  },
  pegasus: {
    name: 'Peggie',
    image: '/images/achievements/205.webp',
    description: 'A majestic winged horse with divine powers.',
    difficulty: 'Medium',
    achievementId: '205',
    achievementTitle: 'Pegasus Tamer',
    achievementDesc: 'A majestic creature of the clouds. Follow its graceful flight to earn its trust.',
  },
  fairy: {
    name: 'Fairiel',
    image: '/images/achievements/206.webp',
    description: 'A magical fairy with nature magic.',
    difficulty: 'Easy',
    achievementId: '206',
    achievementTitle: 'Fairy Friend',
    achievementDesc: 'Small and swift, dancing in the light. Keep up with the fae\'s rhythm.',
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
  const [stats, setStats] = useState({ attack: 0, defense: 0 })
  const [playerLevel, setPlayerLevel] = useState<number>(1)
  const [protectionCharges, setProtectionCharges] = useState<number>(0)

  // Health System: 100 HP each
  const [playerHp, setPlayerHp] = useState(100)
  const [monsterHp, setMonsterHp] = useState(100)

  // Explicit Start Button state so sequence doesn't play before player is ready/scrolled down
  const [roundReady, setRoundReady] = useState(false)

  // Rewards summary when won
  const [finalRewards, setFinalRewards] = useState<{
    gold: number;
    xp: number;
    virtuePoints: number;
    achievementUnlocked: boolean;
  } | null>(null)

  // Combat Log Feed
  const [combatLog, setCombatLog] = useState<string[]>([])

  const battleAreaRef = useRef<HTMLDivElement>(null)

  const { user } = useUser()
  const loadCitizens = useCitizensStore(state => state.loadCitizens)
  const citizens = useCitizensStore(state => state.citizens)
  const combatSupporters = useCitizensStore(state => state.combatSupporters)

  const activeSupporters = citizens.filter(c => combatSupporters.includes(c.id) && c.lockedReason !== 'expedition')
  const natureSupporter = activeSupporters.find(c => c.type === 'nature')
  const fireSupporter = activeSupporters.find(c => c.type === 'fire')
  const waterSupporter = activeSupporters.find(c => c.type === 'water')
  const earthSupporter = activeSupporters.find(c => c.type === 'earth')
  const iceSupporter = activeSupporters.find(c => c.type === 'ice')

  const effectiveAttack = Math.floor(stats.attack * (fireSupporter ? 1 + (fireSupporter.level || 1) * 0.03 : 1))
  const effectiveDefense = Math.floor(stats.defense * (waterSupporter ? 1 + (waterSupporter.level || 1) * 0.03 : 1))

  const monster = monsterData[monsterType] || monsterData.goblin

  useEffect(() => {
    const fetchEquippedStats = async () => {
      try {
        if (user?.id) {
          loadCitizens(user.id).catch(console.error)
          getUserPreference('active_alchemy_buffs').then((buffs: any) => {
            if (buffs && buffs.combatProtectionCharges) {
              setProtectionCharges(buffs.combatProtectionCharges)
            }
          }).catch(console.error)
        }
        const [invRes, statsRes] = await Promise.all([
          fetch('/api/inventory?equipped=true'),
          fetch('/api/character-stats')
        ])

        if (invRes.ok) {
          const invJson = await invRes.json()
          const items = unwrapApiResponse<any[]>(invJson) || []
          let attack = 0
          let defense = 0
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              const itemStats = item.stats || {}
              if (itemStats.attack) attack += itemStats.attack
              if (itemStats.atk) attack += itemStats.atk
              if (itemStats.defense) defense += itemStats.defense
              if (itemStats.def) defense += itemStats.def
            })
          }
          setStats({ attack, defense })
        }

        if (statsRes.ok) {
          const statsJson = await statsRes.json()
          const charStats = unwrapApiResponse<any>(statsJson)
          const lvl = charStats?.level ?? charStats?.stats?.level
          if (lvl) {
            setPlayerLevel(lvl)
          }
        }
      } catch (err) {
        logger.error('Failed to load equipped stats and level:', err)
      }
    }
    if (isOpen) {
      fetchEquippedStats()
    }
  }, [isOpen, user?.id, loadCitizens])

  // Strictly capped sequence: maximum 5 blocks popup
  // Round 1: 3 blocks | Round 2: 3 blocks | Round 3: 4 blocks | Round 4: 4 blocks | Round 5: 5 blocks
  const generateSequence = useCallback((round: number) => {
    const targetLength = Math.min(5, Math.max(3, round <= 2 ? 3 : round <= 4 ? 4 : 5))
    const newSequence: string[] = []

    for (let i = 0; i < targetLength; i++) {
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

    const natureLvl = natureSupporter ? natureSupporter.level || 1 : 0
    const showDuration = 900 + (natureLvl * 300)

    for (let i = 0; i < sequenceToShow.length; i++) {
      const weaponId = sequenceToShow[i]
      if (weaponId) {
        setHighlightedWeapon(weaponId)
        setCurrentSequenceIndex(i + 1)
        await new Promise(resolve => setTimeout(resolve, showDuration))
        setHighlightedWeapon(null)
        await new Promise(resolve => setTimeout(resolve, 250))
      }
    }

    setIsShowingSequence(false)
    setIsPlayerTurn(true)
    setCurrentSequenceIndex(0)
  }, [natureSupporter])

  // Initialize game on open — waits for player to click "Start battle"
  useEffect(() => {
    if (isOpen) {
      setCurrentRound(1)
      setGameState('playing')
      setGoldLost(0)
      setPlayerSequence([])
      setCurrentSequenceIndex(0)
      setPlayerHp(100)
      setMonsterHp(100)
      setRoundReady(false)
      setFinalRewards(null)
      setCombatLog([
        `⚔️ Encountered ${monster.name}! Health: 100 HP vs 100 HP.`,
        `Click "Start battle" below when ready to observe the sequence.`
      ])

      const initialSequence = generateSequence(1)
      setSequence(initialSequence)
    }
  }, [isOpen, generateSequence, monster.name])

  // Player explicitly presses "Start battle" / "Start round"
  const handleStartRound = () => {
    setRoundReady(true)
    // Smoothly ensure battle area is scrolled into view
    setTimeout(() => {
      battleAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
    showSequence(sequence)
  }

  // Handle weapon click
  const handleWeaponClick = (weaponId: string) => {
    if (!isPlayerTurn || isShowingSequence || gameState !== 'playing') return

    const newPlayerSequence = [...playerSequence, weaponId]
    setPlayerSequence(newPlayerSequence)

    // Check if sequence is correct so far
    const isCorrect = newPlayerSequence.every((item, index) => item === sequence[index])

    if (!isCorrect) {
      handleRoundLoss()
      return
    }

    // Check if round is complete
    if (newPlayerSequence.length === sequence.length) {
      setIsPlayerTurn(false)
      
      // Damage monster: 20 HP per successful round (100 -> 80 -> 60 -> 40 -> 20 -> 0)
      const nextMonsterHp = Math.max(0, 100 - (currentRound * 20))
      setMonsterHp(nextMonsterHp)

      setCombatLog(prev => [
        `⚔️ Round ${currentRound} triumph: Struck ${monster.name} for 20 DMG! (${nextMonsterHp}/100 HP left)`,
        ...prev.slice(0, 4)
      ])

      if (currentRound === 5 || nextMonsterHp === 0) {
        handleGameWin()
      } else {
        const nextRound = currentRound + 1
        setCurrentRound(nextRound)
        setPlayerSequence([])
        setRoundReady(false) // Wait for user to click "Start round X"

        const nextSequence = generateSequence(nextRound)
        setSequence(nextSequence)
      }
    } else {
      // Tactical Supporter Strike chance
      const tacticalSupporter = activeSupporters.find(s => !['nature', 'fire', 'water', 'earth', 'ice'].includes(s.type))
      if (tacticalSupporter) {
        const lvl = tacticalSupporter.level || 1
        const chance = lvl * 0.05
        if (Math.random() < chance) {
          const nextCorrectWeaponId = sequence[newPlayerSequence.length]
          if (nextCorrectWeaponId) {
            setIsPlayerTurn(false)
            setTimeout(() => {
              toast({
                title: "🎯 Supporter strike!",
                description: `${tacticalSupporter.name} auto-inputs the next weapon!`,
              })
              setIsPlayerTurn(true)
              handleWeaponClick(nextCorrectWeaponId)
            }, 600)
          }
        }
      }
    }
  }

  const handleRoundLoss = () => {
    const basePenalty = 10 * (1 + playerLevel / 10)
    let lostGold = Math.max(5, Math.floor(basePenalty / (1 + effectiveDefense * 0.05)))
    
    const isProtected = protectionCharges > 0
    let dmgTaken = 20

    if (isProtected) {
      lostGold = 0
      dmgTaken = 0
      setProtectionCharges(prev => Math.max(0, prev - 1))
      
      getUserPreference('active_alchemy_buffs').then((current: any) => {
        const updated = {
          ...current,
          combatProtectionCharges: Math.max(0, (current?.combatProtectionCharges || 1) - 1)
        }
        setUserPreference('active_alchemy_buffs', updated)
      }).catch(console.error)

      toast({
        title: "🛡️ Barrier protected!",
        description: "Your potion absorbed the blow and penalty!",
      })
      setCombatLog(prev => [
        `🛡️ Round ${currentRound} mishap: Alchemy barrier absorbed ${monster.name}'s counterattack!`,
        ...prev.slice(0, 4)
      ])
    } else {
      setGoldLost(prev => prev + lostGold)
      gainGold(-lostGold, 'monster-battle-loss')

      // Player takes 20 HP damage
      const nextPlayerHp = Math.max(0, playerHp - dmgTaken)
      setPlayerHp(nextPlayerHp)

      setCombatLog(prev => [
        `💥 Round ${currentRound} mistake: ${monster.name} strikes back for 20 DMG! (${nextPlayerHp}/100 HP left)`,
        ...prev.slice(0, 4)
      ])

      toast({
        title: "Round failed!",
        description: `Lost ${dmgTaken} HP and ${lostGold} gold. Watch the next pattern carefully!`,
        variant: "destructive",
      })

      if (nextPlayerHp <= 0) {
        handleGameLoss()
        return
      }
    }

    if (currentRound === 5) {
      handleGameLoss()
    } else {
      const nextRound = currentRound + 1
      setCurrentRound(nextRound)
      setPlayerSequence([])
      setRoundReady(false)

      const nextSequence = generateSequence(nextRound)
      setSequence(nextSequence)
    }
  }

  const handleGameWin = () => {
    const isEasy = ['goblin', 'fairy'].includes(monsterType)
    const isMedium = ['troll', 'pegasus'].includes(monsterType)
    const baseGold = isEasy ? 150 : isMedium ? 250 : 400
    const baseXP = isEasy ? 80 : isMedium ? 150 : 250

    const gearScore = effectiveAttack + effectiveDefense
    const scaleFactor = 1 + playerLevel / 15 + gearScore / 20

    const iceBonus = iceSupporter ? 1 + (iceSupporter.level || 1) * 0.03 : 1
    const earthBonus = earthSupporter ? 1 + (earthSupporter.level || 1) * 0.03 : 1

    const earnedGold = Math.floor(baseGold * scaleFactor * iceBonus)
    const earnedXP = Math.floor(baseXP * scaleFactor * earthBonus)
    const virtuePoints = currentRound * 15

    setGameState('won')
    setMonsterHp(0)

    // Apply currency and XP
    gainGold(earnedGold, 'monster-battle-win')
    addToCharacterStat('gold', earnedGold, 'monster-battle-win')
    addToCharacterStat('experience', earnedXP, 'monster-battle-win')

    // Track quest progress
    recordDungeonBattleWin().catch(err => {
      logger.warn('Dungeon battle quest track error:', err)
    })

    // Unlock achievement for defeating this monster
    if (monster.achievementId) {
      fetchWithAuth('/api/achievements/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementId: monster.achievementId })
      }).then(() => {
        toast({
          title: `🏆 Achievement unlocked: ${monster.achievementTitle}`,
          description: monster.achievementDesc,
        })
      }).catch((error: any) => {
        logger.error('Failed to unlock achievement:', error)
      })
    }

    // Award House Cup Virtue
    fetchWithAuth('/api/house-cup/dungeon-virtue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        floor: currentRound,
        difficulty: monster.difficulty.toLowerCase(),
        primaryCategory: 'might',
        petStrikerUsed: activeSupporters.length > 0,
      })
    }).catch(err => logger.error('House cup error:', err))

    setFinalRewards({
      gold: earnedGold,
      xp: earnedXP,
      virtuePoints,
      achievementUnlocked: true,
    })
  }

  const handleGameLoss = () => {
    setGameState('lost')
    setPlayerHp(0)
    toast({
      title: "Defeat!",
      description: `${monster.name} was too strong this time. Train your focus and try again!`,
      variant: "destructive",
    })
  }

  const handleClaimVictory = () => {
    if (finalRewards) {
      onBattleComplete(true, finalRewards.gold, finalRewards.xp)
    } else {
      onBattleComplete(true, 100, 50)
    }
    onClose()
  }

  const handleDefeatClose = () => {
    onBattleComplete(false, -goldLost, 0)
    onClose()
  }

  const getPassiveShortLabel = (c: any) => {
    const lvl = c.level || 1
    switch (c.type) {
      case 'nature': return `+${(lvl * 0.3).toFixed(1)}s Memory`
      case 'fire': return `+${lvl * 3}% Attack`
      case 'water': return `+${lvl * 3}% Defense`
      case 'earth': return `+${lvl * 3}% XP`
      case 'ice': return `+${lvl * 3}% Gold`
      default: return `+${lvl * 5}% Tactical Strike`
    }
  }

  if (!isOpen) return null

  // Winning status comparison
  const isWinning = playerHp > monsterHp
  const isTied = playerHp === monsterHp

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-6 overflow-y-auto">
      <Card className="monster-battle-container w-full max-w-2xl bg-zinc-950 border-amber-800/40 text-white shadow-2xl transition-all duration-300 max-h-[92dvh] overflow-y-auto custom-scrollbar">
        <CardHeader className="text-center pb-2 pt-4 sm:pt-6">
          <div className="flex items-center justify-between gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] border-amber-600/40 text-amber-300 bg-amber-950/40 font-mono">
              Round {currentRound}/5
            </Badge>
            <CardTitle className="text-lg sm:text-2xl font-serif font-bold text-amber-300">
              Battle with {monster.name}
            </CardTitle>
            <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-300 font-mono">
              {monster.difficulty}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
          {/* Monster Banner */}
          <div className="flex items-center gap-3 sm:gap-4 p-3 bg-zinc-900/90 rounded-xl border border-amber-900/30">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-zinc-950 rounded-xl flex items-center justify-center overflow-hidden relative shrink-0 border border-amber-500/30 shadow-inner">
              <Image
                src={monster.image}
                alt={monster.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-base sm:text-lg text-amber-200">{monster.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 border border-red-500/40 text-red-300 font-mono">
                  {monster.difficulty} opponent
                </span>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2">{monster.description}</p>
            </div>
          </div>

          {/* DUAL HEALTH BARS: PLAYER VS MONSTER */}
          <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-3.5 space-y-3 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="font-serif font-bold text-amber-300 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400/20" /> Hero combat balance
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-mono font-bold px-2 py-0.5",
                  isWinning && "border-emerald-500/50 bg-emerald-950/60 text-emerald-300",
                  isTied && "border-amber-500/50 bg-amber-950/60 text-amber-300",
                  !isWinning && !isTied && "border-rose-500/50 bg-rose-950/60 text-rose-300"
                )}
              >
                {isWinning ? "🏆 Winning (Ahead)" : isTied ? "⚖️ Even match" : "⚠️ Behind (Danger)"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Player Health Bar */}
              <div className="space-y-1.5 bg-zinc-950/80 p-2.5 rounded-xl border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300 font-medium flex items-center gap-1">
                    🛡️ Hero HP
                  </span>
                  <span className={cn(
                    "font-mono font-bold text-xs",
                    playerHp > 50 ? "text-emerald-400" : playerHp > 25 ? "text-amber-400" : "text-rose-400"
                  )}>
                    {playerHp} / 100 HP
                  </span>
                </div>
                <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 shadow-sm",
                      playerHp > 50
                        ? "bg-gradient-to-r from-emerald-600 to-green-400"
                        : playerHp > 25
                        ? "bg-gradient-to-r from-amber-600 to-yellow-400"
                        : "bg-gradient-to-r from-rose-700 to-red-500"
                    )}
                    style={{ width: `${Math.max(0, Math.min(100, playerHp))}%` }}
                  />
                </div>
              </div>

              {/* Monster Health Bar */}
              <div className="space-y-1.5 bg-zinc-950/80 p-2.5 rounded-xl border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300 font-medium flex items-center gap-1">
                    <Skull className="w-3.5 h-3.5 text-rose-400" /> {monster.name} HP
                  </span>
                  <span className="font-mono font-bold text-xs text-rose-400">
                    {monsterHp} / 100 HP
                  </span>
                </div>
                <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-700 to-red-500 transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.max(0, Math.min(100, monsterHp))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ACTIVE SUPPORTER STRIKERS (COMPACT) */}
          {activeSupporters.length > 0 && (
            <div className="bg-zinc-900/60 border border-amber-900/20 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
              <span className="text-amber-400 text-[11px] font-bold flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Guardian pet striker ready
              </span>
              <div className="flex items-center gap-1.5">
                {activeSupporters.map(c => (
                  <Badge key={c.id} variant="outline" className="text-[9px] border-cyan-500/40 text-cyan-300 bg-cyan-950/50 py-0.5">
                    {c.name}: {getPassiveShortLabel(c)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* BATTLE INTERACTION AREA */}
          <div ref={battleAreaRef} className="space-y-4 pt-1">
            {/* START BUTTON / ROUND READY BANNER */}
            {!roundReady && gameState === 'playing' && (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/60 to-zinc-950 border border-amber-500/40 text-center space-y-3 shadow-xl">
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-amber-300 text-sm sm:text-base">
                    {currentRound === 1 ? "Ready to begin monster battle?" : `Ready for Round ${currentRound}?`}
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Memorize the <strong>5-block sequence</strong> that flashes and repeat it using the buttons below!
                  </p>
                </div>
                <Button
                  onClick={handleStartRound}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold font-serif text-sm px-6 py-2.5 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all mx-auto flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current text-black" />
                  {currentRound === 1 ? "Start battle" : `Start round ${currentRound}`}
                </Button>
              </div>
            )}

            {/* SEQUENCE STATUS INDICATOR */}
            {roundReady && gameState === 'playing' && (
              <div className="text-center py-1">
                {isShowingSequence && (
                  <div className="text-amber-300 font-serif font-bold text-base sm:text-lg animate-pulse">
                    👀 Watch the sequence... ({currentSequenceIndex}/{sequence.length})
                  </div>
                )}
                {isPlayerTurn && !isShowingSequence && (
                  <div className="text-emerald-400 font-serif font-bold text-sm sm:text-base">
                    ⚔️ Your turn! Repeat the 5 blocks ({playerSequence.length}/{sequence.length})
                  </div>
                )}
              </div>
            )}

            {/* 5 WEAPON BLOCKS (MAX 5 BLOCKS) */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-3 w-full">
              {weapons.map((weapon) => (
                <Button
                  key={weapon.id}
                  onClick={() => handleWeaponClick(weapon.id)}
                  disabled={!isPlayerTurn || isShowingSequence || gameState !== 'playing' || !roundReady}
                  className={cn(
                    "h-16 sm:h-20 p-1 sm:p-2 flex flex-col items-center justify-center gap-1 sm:gap-2 transition-all duration-150 active:scale-95 transform-gpu shadow-md min-w-0 rounded-xl",
                    highlightedWeapon === weapon.id && "ring-4 ring-amber-400 scale-110 shadow-2xl animate-pulse z-10",
                    isPlayerTurn && !isShowingSequence && "hover:scale-102 cursor-pointer",
                    weapon.color
                  )}
                  aria-label={`Select ${weapon.name}`}
                >
                  {weapon.icon}
                  <span className="text-[10px] sm:text-xs font-bold truncate max-w-full font-serif">{weapon.name}</span>
                </Button>
              ))}
            </div>

            {/* SEQUENCE DOTS */}
            {roundReady && isPlayerTurn && (
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-zinc-400 font-mono">
                  Input: {playerSequence.length} / {sequence.length}
                </span>
                <div className="flex justify-center gap-2">
                  {playerSequence.map((_, index) => (
                    <div
                      key={index}
                      className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                    />
                  ))}
                  {Array.from({ length: Math.max(0, sequence.length - playerSequence.length) }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="w-3.5 h-3.5 rounded-full bg-zinc-700 border border-zinc-600"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COMBAT LOG */}
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3 space-y-1 min-h-[76px] max-h-[110px] overflow-y-auto text-xs font-mono custom-scrollbar">
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center justify-between border-b border-zinc-800/80 pb-1 mb-1 font-serif">
              <span>⚔️ Battle combat log</span>
              <span className="text-zinc-500 text-[9px]">Round {currentRound}/5</span>
            </div>
            {combatLog.map((log, idx) => (
              <p key={idx} className={idx === 0 ? "text-amber-200" : "text-zinc-400 text-[11px]"}>
                {log}
              </p>
            ))}
          </div>

          {/* VICTORY SCREEN OVERLAY */}
          {gameState === 'won' && finalRewards && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-950/90 via-zinc-950 to-black border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)] text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="space-y-1">
                <span className="text-3xl">🎉</span>
                <h3 className="text-2xl font-serif font-bold text-amber-300">
                  Victory! {monster.name} Defeated!
                </h3>
                <p className="text-xs text-zinc-300">
                  You successfully mastered all 5 combat sequences and banished the monster!
                </p>
              </div>

              {/* UNLOCKED ACHIEVEMENT CARD */}
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 border border-amber-300 flex items-center justify-center text-xl shrink-0 shadow-md">
                  🏆
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif font-bold text-amber-200 text-sm truncate">
                      {monster.achievementTitle}
                    </h4>
                    <Badge className="bg-emerald-950 text-emerald-300 border-emerald-500/40 text-[9px] py-0">
                      Unlocked ✓
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-300 leading-snug mt-0.5">
                    {monster.achievementDesc}
                  </p>
                </div>
              </div>

              {/* REWARDS GRID */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-zinc-900/90 border border-amber-500/30 p-2.5 rounded-xl">
                  <span className="text-xs text-zinc-400 block font-mono">Gold gained</span>
                  <span className="text-base font-serif font-bold text-amber-400">+{finalRewards.gold} 🪙</span>
                </div>
                <div className="bg-zinc-900/90 border border-blue-500/30 p-2.5 rounded-xl">
                  <span className="text-xs text-zinc-400 block font-mono">Experience</span>
                  <span className="text-base font-serif font-bold text-blue-400">+{finalRewards.xp} ⭐</span>
                </div>
                <div className="bg-zinc-900/90 border border-emerald-500/30 p-2.5 rounded-xl">
                  <span className="text-xs text-zinc-400 block font-mono">Virtue energy</span>
                  <span className="text-base font-serif font-bold text-emerald-400">+{finalRewards.virtuePoints} 🏆</span>
                </div>
              </div>

              <Button
                onClick={handleClaimVictory}
                className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-bold font-serif py-3 rounded-xl shadow-xl active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4 fill-current text-black" /> Claim rewards & continue
              </Button>
            </div>
          )}

          {/* DEFEAT SCREEN */}
          {gameState === 'lost' && (
            <div className="p-5 rounded-2xl bg-zinc-950 border-2 border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.3)] text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="space-y-1">
                <span className="text-3xl">💀</span>
                <h3 className="text-xl font-serif font-bold text-red-400">
                  Defeated by {monster.name}
                </h3>
                <p className="text-xs text-zinc-400">
                  The monster overwhelmed your defenses. Practice your focus or craft protective alchemy potions to safeguard your gold!
                </p>
              </div>

              {goldLost > 0 && (
                <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 font-mono">
                  Gold lost: -{goldLost} 🪙
                </div>
              )}

              <Button
                onClick={handleDefeatClose}
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-900 font-serif"
              >
                Return to realm
              </Button>
            </div>
          )}

          {/* FOOTER CLOSE BUTTON WHEN STILL PLAYING */}
          {gameState === 'playing' && (
            <div className="flex justify-center pt-2">
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Flee battle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}