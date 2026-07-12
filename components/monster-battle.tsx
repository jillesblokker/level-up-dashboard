"use client"

import { logger } from "@/lib/logger";

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Shield, Sword, Zap, Heart, Shield as Armor, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { gainGold } from '@/lib/gold-manager'
import { addToCharacterStat } from '@/lib/character-stats-service'
import { toast } from '@/components/ui/use-toast'
import Image from 'next/image'
import { TEXT_CONTENT } from '@/lib/text-content'
import { useUser } from "@clerk/nextjs"
import { useCitizensStore } from "@/stores/citizensStore"

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
  { id: 'armor', name: 'Armor', icon: <Armor className="w-8 h-8" />, color: 'bg-zinc-500' },
  { id: 'artifact', name: 'Artifact', icon: <Zap className="w-8 h-8" />, color: 'bg-purple-500' },
  { id: 'potion', name: 'Potion', icon: <Heart className="w-8 h-8" />, color: 'bg-green-500' },
]

const monsterData = {
  dragon: {
    name: 'Dragoni',
    image: '/images/achievements/201.webp',
    description: 'A fearsome dragon with scales as hard as steel',
    difficulty: 'Hard',
    achievementId: '201'
  },
  goblin: {
    name: 'Orci',
    image: '/images/achievements/202.webp',
    description: 'A sneaky goblin with sharp daggers',
    difficulty: 'Easy',
    achievementId: '202'
  },
  troll: {
    name: 'Trollie',
    image: '/images/achievements/203.webp',
    description: 'A massive troll with incredible strength',
    difficulty: 'Medium',
    achievementId: '203'
  },
  wizard: {
    name: 'Sorceror',
    image: '/images/achievements/204.webp',
    description: 'A powerful wizard with dark magic',
    difficulty: 'Hard',
    achievementId: '204'
  },
  pegasus: {
    name: 'Peggie',
    image: '/images/achievements/205.webp',
    description: 'A majestic winged horse with divine powers',
    difficulty: 'Medium',
    achievementId: '205'
  },
  fairy: {
    name: 'Fairiel',
    image: '/images/achievements/206.webp',
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
  const [stats, setStats] = useState({ attack: 0, defense: 0 })
  const [playerLevel, setPlayerLevel] = useState<number>(1)

  const { user } = useUser();
  const loadCitizens = useCitizensStore(state => state.loadCitizens);
  const citizens = useCitizensStore(state => state.citizens);
  const combatSupporters = useCitizensStore(state => state.combatSupporters);

  const activeSupporters = citizens.filter(c => combatSupporters.includes(c.id));
  const natureSupporter = activeSupporters.find(c => c.type === 'nature');
  const fireSupporter = activeSupporters.find(c => c.type === 'fire');
  const waterSupporter = activeSupporters.find(c => c.type === 'water');
  const earthSupporter = activeSupporters.find(c => c.type === 'earth');
  const iceSupporter = activeSupporters.find(c => c.type === 'ice');

  const effectiveAttack = Math.floor(stats.attack * (fireSupporter ? 1 + (fireSupporter.level || 1) * 0.03 : 1));
  const effectiveDefense = Math.floor(stats.defense * (waterSupporter ? 1 + (waterSupporter.level || 1) * 0.03 : 1));

  const monster = monsterData[monsterType]

  useEffect(() => {
    const fetchEquippedStats = async () => {
      try {
        if (user?.id) {
          loadCitizens(user.id).catch(console.error);
        }
        const [invRes, statsRes] = await Promise.all([
          fetch('/api/inventory?equipped=true'),
          fetch('/api/character-stats')
        ]);

        if (invRes.ok) {
          const items = await invRes.json();
          let attack = 0;
          let defense = 0;
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              const itemStats = item.stats || {};
              if (itemStats.attack) attack += itemStats.attack;
              if (itemStats.defense) defense += itemStats.defense;
            });
          }
          setStats({ attack, defense });
        }

        if (statsRes.ok) {
          const charStats = await statsRes.json();
          if (charStats && charStats.level) {
            setPlayerLevel(charStats.level);
          }
        }
      } catch (err) {
        logger.error('Failed to load equipped stats and level:', err);
      }
    };
    if (isOpen) {
      fetchEquippedStats();
    }
  }, [isOpen]);

  // Generate new sequence for current round
  const generateSequence = useCallback((round: number) => {
    const isEasy = ['goblin', 'fairy'].includes(monsterType);
    const isMedium = ['troll', 'pegasus'].includes(monsterType);
    const baseSteps = isEasy ? 4 : isMedium ? 5 : 6;
    
    const gearScore = effectiveAttack + effectiveDefense;
    const levelModifier = Math.floor(playerLevel / 10);
    const gearBonus = Math.floor(gearScore / 15);
    
    // Steps required: base steps + current round modifier, scaled by level and mitigated by gear score
    const roundLength = Math.max(3, Math.min(10, baseSteps + round - 1 + levelModifier - gearBonus));
    const newSequence: string[] = []

    for (let i = 0; i < roundLength; i++) {
      const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)]
      if (randomWeapon) {
        newSequence.push(randomWeapon.id)
      }
    }

    return newSequence
  }, [effectiveAttack, effectiveDefense, playerLevel, monsterType])

  // Show sequence to player
  const showSequence = useCallback(async (sequenceToShow: string[]) => {
    setIsShowingSequence(true)
    setIsPlayerTurn(false)
    setCurrentSequenceIndex(0)

    const natureLvl = natureSupporter ? natureSupporter.level || 1 : 0;
    const showDuration = 1000 + (natureLvl * 500); // add 0.5s per level

    for (let i = 0; i < sequenceToShow.length; i++) {
      const weaponId = sequenceToShow[i]
      if (weaponId) {
        setHighlightedWeapon(weaponId)
        setCurrentSequenceIndex(i + 1)
        await new Promise(resolve => setTimeout(resolve, showDuration)) // Show each weapon longer based on Nature supporter level
        setHighlightedWeapon(null)
        await new Promise(resolve => setTimeout(resolve, 300)) // Brief pause between weapons
      }
    }

    setIsShowingSequence(false)
    setIsPlayerTurn(true)
    setCurrentSequenceIndex(0)
  }, [natureSupporter])

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
    return () => { }
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
    } else {
      // Roll for Tactical Supporter Strike
      const tacticalSupporter = activeSupporters.find(s => !['nature', 'fire', 'water', 'earth', 'ice'].includes(s.type));
      if (tacticalSupporter) {
        const lvl = tacticalSupporter.level || 1;
        const chance = lvl * 0.05; // 5% chance per level
        if (Math.random() < chance) {
          const nextCorrectWeaponId = sequence[newPlayerSequence.length];
          if (nextCorrectWeaponId) {
            setIsPlayerTurn(false);
            setTimeout(() => {
              toast({
                title: "🎯 Supporter Strike!",
                description: `${tacticalSupporter.name} auto-inputs the next weapon!`,
              });
              setIsPlayerTurn(true);
              handleWeaponClick(nextCorrectWeaponId);
            }, 600);
          }
        }
      }
    }
  }

  const handleRoundLoss = () => {
    const basePenalty = 10 * (1 + playerLevel / 10);
    const lostGold = Math.max(5, Math.floor(basePenalty / (1 + effectiveDefense * 0.05)));
    setGoldLost(prev => prev + lostGold)
    gainGold(-lostGold, 'monster-battle-loss')

    toast({
      title: TEXT_CONTENT.monsterBattle.roundFailed.title,
      description: TEXT_CONTENT.monsterBattle.roundFailed.description.replace('{lostGold}', lostGold.toString()),
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
    const isEasy = ['goblin', 'fairy'].includes(monsterType);
    const isMedium = ['troll', 'pegasus'].includes(monsterType);
    const baseGold = isEasy ? 100 : isMedium ? 180 : 300;
    const baseXP = isEasy ? 50 : isMedium ? 80 : 120;

    const gearScore = effectiveAttack + effectiveDefense;
    const scaleFactor = 1 + playerLevel / 15 + gearScore / 20;

    const iceBonus = iceSupporter ? 1 + (iceSupporter.level || 1) * 0.03 : 1;
    const earthBonus = earthSupporter ? 1 + (earthSupporter.level || 1) * 0.03 : 1;

    const earnedGold = Math.floor(baseGold * scaleFactor * iceBonus);
    const earnedXP = Math.floor(baseXP * scaleFactor * earthBonus);

    setGameState('won')
    gainGold(earnedGold, 'monster-battle-win')
    addToCharacterStat('experience', earnedXP, 'monster-battle-win')

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
      logger.debug('Attempting to unlock monster achievement:', monster.achievementId, 'for monster:', monster.name)
      fetch('/api/achievements/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementId: monster.achievementId })
      }).then(response => {
        logger.debug('Achievement unlock response status:', response.status)
        return response.json()
      }).then(data => {
        logger.debug('Achievement unlock response data:', data)
      }).catch(error => {
        logger.error('Failed to unlock achievement:', error)
      })
    }

    // Show improved thematic victory message based on monster type
    const message = TEXT_CONTENT.monsterBattle.victories[monster.achievementId as keyof typeof TEXT_CONTENT.monsterBattle.victories];

    if (message) {
      toast({
        title: message.title,
        description: message.description.replace('{earnedGold}', earnedGold.toString()).replace('{earnedXP}', earnedXP.toString()),
      });
    } else {
      // Fallback for unknown monsters
      toast({
        title: TEXT_CONTENT.monsterBattle.genericVictory.title,
        description: TEXT_CONTENT.monsterBattle.genericVictory.description
          .replace('{monsterName}', monster.name)
          .replace('{earnedGold}', earnedGold.toString())
          .replace('{earnedXP}', earnedXP.toString()),
      });
    }

    setTimeout(() => {
      onBattleComplete(true, earnedGold, earnedXP)
      onClose()
    }, 2000)
  }

  const handleGameLoss = () => {
    setGameState('lost')

    toast({
      title: TEXT_CONTENT.monsterBattle.defeat.title,
      description: TEXT_CONTENT.monsterBattle.defeat.description
        .replace('{monsterName}', monster.name)
        .replace('{goldLost}', goldLost.toString()),
      variant: "destructive",
    })

    setTimeout(() => {
      onBattleComplete(false, -goldLost, 0)
      onClose()
    }, 2000)
  }

  const getPassiveShortLabel = (c: any) => {
    const lvl = c.level || 1;
    switch (c.type) {
      case 'nature': return `+${(lvl * 0.5).toFixed(1)}s Memory`;
      case 'fire': return `+${lvl * 3}% Attack`;
      case 'water': return `+${lvl * 3}% Defense`;
      case 'earth': return `+${lvl * 3}% XP`;
      case 'ice': return `+${lvl * 3}% Gold`;
      default: return `+${lvl * 5}% Tactical Strike`;
    }
  };

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black ">
      <Card className="monster-battle-container w-full max-w-2xl bg-zinc-900 border-amber-800/30 text-white transition-all duration-300">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-amber-400">
            {TEXT_CONTENT.monsterBattle.ui.battleAgainst.replace('{monsterName}', monster.name)}
          </CardTitle>
          <div className="text-sm text-zinc-400">
            {TEXT_CONTENT.monsterBattle.ui.roundDifficulty
              .replace('{round}', currentRound.toString())
              .replace('{difficulty}', monster.difficulty)}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Monster Card */}
          <div className="flex items-center gap-4 p-4 bg-zinc-800 rounded-lg border border-amber-800">
            <div className="w-16 h-16 bg-zinc-700 rounded-lg flex items-center justify-center overflow-hidden relative">
              <Image
                src={monster.image}
                alt={monster.name}
                fill
                sizes="64px"
                className="object-cover"
                onLoad={() => {
                  logger.debug('Monster image loaded successfully:', monster.image);
                }}
                onError={() => {
                  logger.error('Failed to load monster image:', monster.image);
                }}
              />
            </div>
            <div>
              <h3 className="font-bold text-lg">{monster.name}</h3>
              <p className="text-sm text-zinc-400">{monster.description}</p>
            </div>
          </div>

          {/* Gear Bonus Info */}
          {stats.attack > 0 && (
            <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-2.5 flex items-center justify-between text-xs text-red-200">
              <div className="flex items-center gap-2">
                <Sword className="w-4 h-4 text-red-500 animate-pulse" />
                <span>
                  Weapon Attack bonus +{stats.attack}: Enemy matching sequence length reduced by {Math.min(2, Math.floor(stats.attack / 8))}!
                </span>
              </div>
            </div>
          )}

          {/* Active Battle Squad Support */}
          {activeSupporters.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-3 space-y-2">
              <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Active Battle Squad Support
              </h5>
              <div className="flex flex-col sm:flex-row gap-3">
                {activeSupporters.map(c => (
                  <div key={c.id} className="flex items-center gap-2 text-xs text-amber-200">
                    <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-amber-500/30 flex items-center justify-center shrink-0 relative overflow-hidden">
                      <Image
                        src={c.filename ? `/images/creatures/${c.filename}` : '/images/placeholders/creature.webp'}
                        alt={c.name}
                        width={28}
                        height={28}
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-[10px] text-white leading-none">{c.name}</p>
                      <p className="text-[9px] text-zinc-400 mt-1">Level {c.level || 1} • {getPassiveShortLabel(c)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{TEXT_CONTENT.monsterBattle.ui.progress}</span>
              <span>{currentRound}/5</span>
            </div>
            <Progress value={(currentRound / 5) * 100} className="h-2" />
          </div>

          {/* Game Status */}
          <div className="text-center">
            {isShowingSequence && (
              <div className="text-amber-400 font-bold text-lg animate-pulse">
                {TEXT_CONTENT.monsterBattle.ui.watchSequence} ({currentSequenceIndex}/{sequence.length})
              </div>
            )}
            {isPlayerTurn && !isShowingSequence && (
              <div className="text-amber-400 font-bold">
                {TEXT_CONTENT.monsterBattle.ui.yourTurn} ({playerSequence.length}/{sequence.length})
              </div>
            )}
            {gameState === 'won' && (
              <div className="text-amber-400 font-bold text-xl">
                {TEXT_CONTENT.monsterBattle.ui.victory}
              </div>
            )}
            {gameState === 'lost' && (
              <div className="text-red-400 font-bold text-xl">
                {TEXT_CONTENT.monsterBattle.ui.defeat}
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
              <div className="text-sm text-zinc-400 mb-2">
                {TEXT_CONTENT.monsterBattle.ui.yourSequence
                  .replace('{current}', playerSequence.length.toString())
                  .replace('{total}', sequence.length.toString())}
              </div>
              <div className="flex justify-center gap-2">
                {playerSequence.map((item, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full bg-amber-500"
                    aria-label={`Correct item ${index + 1}`}
                  />
                ))}
                {Array.from({ length: sequence.length - playerSequence.length }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="w-4 h-4 rounded-full bg-zinc-600"
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
              {TEXT_CONTENT.monsterBattle.ui.closeBattle}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 