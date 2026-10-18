'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ShieldAlert, Swords, Trophy, Gift, Zap, CheckCircle2, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { TitanSiegeArsenal } from '@/components/titan-siege-arsenal'
import { TreasureChestVisual } from '@/components/ui/treasure-chest-visual'
import { playSFX, SOUNDS } from '@/lib/sound-manager'
import { getCharacterStats, addToCharacterStat } from '@/lib/character-stats-service'
import { CollectibleRune } from '@/components/runes/collectible-rune'
import { cn } from '@/lib/utils'

interface AllianceTitanRaidModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AllianceTitanRaidModal({ isOpen, onClose }: AllianceTitanRaidModalProps) {
  const carouselRef = useRef<HTMLDivElement>(null)

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const [titanHp, setTitanHp] = useState(6450)
  const maxHp = 10000
  const [userDamageToday, setUserDamageToday] = useState(14)
  const [claimedTiers, setClaimedTiers] = useState<number[]>([1])
  const [heroLevel, setHeroLevel] = useState(1)

  // Load titan raid progress from localStorage and character stats
  useEffect(() => {
    try {
      const savedHp = localStorage.getItem('thrivehaven_titan_hp')
      if (savedHp) setTitanHp(parseInt(savedHp, 10))
      const savedDmg = localStorage.getItem('thrivehaven_user_titan_dmg')
      if (savedDmg) setUserDamageToday(parseInt(savedDmg, 10))
      const stats = getCharacterStats()
      if (stats?.level) setHeroLevel(stats.level)
    } catch (err) {
      console.error('Error loading titan data:', err)
    }
  }, [isOpen])

  const hpPercent = Math.max(0, Math.min(100, Math.round((titanHp / maxHp) * 100)))

  // Scale chest gold reward by player level (+15% gold bonus per 10 levels)
  const goldBonusMult = 1 + Math.floor(heroLevel / 10) * 0.15
  const baseGoldAmounts = [150, 350, 600, 1000, 2000]
  const getGoldReward = (tier: number) => Math.round((baseGoldAmounts[tier - 1] || 150) * goldBonusMult)

  // Damage bonus multiplier based on hero level (+10% dmg every 5 levels)
  const levelDmgMultiplier = 1 + Math.floor(heroLevel / 5) * 0.1

  const CHESTS = [
    { 
      tier: 1, 
      rarity: 'common' as const,
      reqHpDamage: 2000, 
      label: 'Common alliance chest', 
      reward: `+${getGoldReward(1)} gold & 2 essences`, 
      claimed: claimedTiers.includes(1) 
    },
    { 
      tier: 2, 
      rarity: 'uncommon' as const,
      reqHpDamage: 4000, 
      label: 'Verdant alliance chest', 
      reward: `+${getGoldReward(2)} gold, 4 essences & 1 Gold potion`, 
      claimed: claimedTiers.includes(2) 
    },
    { 
      tier: 3, 
      rarity: 'rare' as const,
      reqHpDamage: 6000, 
      label: 'Sapphire alliance chest', 
      reward: `+${getGoldReward(3)} gold, 6 essences & 1 Exp potion`, 
      claimed: claimedTiers.includes(3) 
    },
    { 
      tier: 4, 
      rarity: 'epic' as const,
      reqHpDamage: 8000, 
      label: 'Amethyst alliance chest', 
      reward: `+${getGoldReward(4).toLocaleString()} gold, 10 essences & mythic blueprint`, 
      claimed: claimedTiers.includes(4) 
    },
    { 
      tier: 5, 
      rarity: 'legendary' as const,
      reqHpDamage: 10000, 
      label: 'Celestial titan chest', 
      reward: `+${getGoldReward(5).toLocaleString()} gold, 20 essences, 10 gems & astral blueprint`, 
      claimed: claimedTiers.includes(5) 
    }
  ]

  const handleClaimChest = async (tier: number) => {
    if (!claimedTiers.includes(tier)) {
      const updated = [...claimedTiers, tier]
      setClaimedTiers(updated)
      try {
        localStorage.setItem('claimed_alliance_raid_tiers', JSON.stringify(updated))
      } catch {}

      const chestObj = CHESTS.find(c => c.tier === tier)

      // Grant character stats & gold based on rarity tier with level bonus
      try {
        const goldToGrant = getGoldReward(tier)
        await addToCharacterStat('gold', goldToGrant, 'alliance-raid-chest')
        if (tier >= 4) {
          await addToCharacterStat('gems', tier === 5 ? 10 : 3, 'alliance-raid-chest')
        }
      } catch (err) {
        console.error('Failed to grant chest rewards:', err)
      }

      toast({
        title: "Victory chest claimed! 🏆",
        description: `Unlocked ${chestObj?.label || 'victory chest'}: ${chestObj?.reward || 'rewards'}!`,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full sm:max-w-2xl md:max-w-3xl bg-zinc-950 border border-amber-900/50 text-white rounded-2xl p-4 sm:p-6 shadow-2xl overflow-y-auto overflow-x-hidden max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <DialogTitle className="text-xl font-bold tracking-wide text-red-100 flex items-center gap-2">
                <span>Fellowship Titan Wyrm raid</span>
                <CollectibleRune
                  id="thurisaz_raid"
                  runeId="thurisaz"
                  symbol="ᚦ"
                  name="Thurisaz"
                  meaning="Thor's hammer, giant-slayer, and primal force against monsters"
                  className="text-red-400 ml-1"
                />
              </DialogTitle>
            </div>
            <Badge variant="outline" className="border-red-500/40 text-red-400 bg-red-950/30 text-xs">
              Weekly raid boss
            </Badge>
          </div>
          <DialogDescription className="text-zinc-400 text-xs mt-1">
            Complete daily quests (1 dmg), weekly challenges (10 dmg), cumulative milestones (100 dmg), and royal petitions (15 dmg) to slay the Titan Wyrm!
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4 min-w-0 w-full overflow-hidden">
          {/* Boss Banner & Live Damage Numbers */}
          <div className="relative rounded-2xl border border-red-500/40 p-5 bg-gradient-to-r from-red-950/90 via-zinc-900 to-zinc-950 flex flex-col sm:flex-row items-center gap-4 shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-2xl pointer-events-none" />
            <div className="w-20 h-20 rounded-2xl bg-red-950/90 border-2 border-red-500/60 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse relative">
              <span className="text-4xl">🐉</span>
              <span className="absolute -top-2 -right-2 bg-amber-500 text-zinc-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full font-mono shadow-md">
                -140 DMG
              </span>
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-red-100 font-serif">Titan Wyrm of Gluttony</span>
                <span className="text-xs font-mono font-bold text-red-400">{titanHp.toLocaleString()} / {maxHp.toLocaleString()} HP</span>
              </div>
              <div className="relative">
                <Progress value={hpPercent} className="h-3 bg-zinc-800 transition-all duration-1000 ease-out transform-gpu" />
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-[2px] animate-pulse pointer-events-none" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-300 pt-1.5 flex-wrap gap-1">
                <Badge className="bg-amber-950/80 border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold shadow-sm">
                  ⚔️ Your habits dealt {Math.round(userDamageToday * levelDmgMultiplier)} dmg today!
                  {levelDmgMultiplier > 1 && <span className="ml-1 text-emerald-400">({levelDmgMultiplier.toFixed(1)}x level {heroLevel} bonus)</span>}
                </Badge>
                {goldBonusMult > 1 ? (
                  <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-400 bg-emerald-950/30">
                    🎁 Level {heroLevel} loot bonus: +{Math.round((goldBonusMult - 1) * 100)}% gold
                  </Badge>
                ) : (
                  <span className="text-emerald-400 font-mono font-bold text-[10px]">⚡ Habits deal raid DMG</span>
                )}
              </div>
            </div>
          </div>

          {/* Fellowship Combo & Siege Arsenal Multiplier Banner */}
          <div className="space-y-2">
            <div className="p-2.5 bg-gradient-to-r from-red-950 via-zinc-950 to-red-950 rounded-xl border border-red-500/40 flex items-center justify-between text-xs font-serif shadow-md">
              <span className="text-red-300 font-bold flex items-center gap-1.5">
                🔥 5-hit fellowship raid combo active!
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-300">1.5x boss damage multiplier</span>
            </div>

            {/* 10 Siege Engine Slots Arsenal */}
            <TitanSiegeArsenal />
          </div>

          {/* Collapsible Damage Rules & Loot Rates Drawer (3-Tier Hierarchy) */}
          <details className="group border border-zinc-800 rounded-xl bg-zinc-950/60 overflow-hidden">
            <summary className="px-3 py-2 flex items-center justify-between text-xs font-bold text-amber-300 font-serif cursor-pointer hover:bg-zinc-900/60 transition-colors select-none">
              <span className="flex items-center gap-1.5">
                ⚡ Raid Damage Rules & Loot Rates
              </span>
              <span className="text-[10px] text-zinc-400 font-mono group-open:hidden">
                Show Breakdown ▾
              </span>
            </summary>
            <div className="bg-zinc-900/60 p-3 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
              <div className="space-y-0.5 p-1 bg-zinc-950/40 rounded-lg">
                <span className="text-zinc-400 block text-[10px]">Daily quest</span>
                <span className="font-bold text-amber-400 flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3" /> 1 damage
                </span>
              </div>
              <div className="space-y-0.5 p-1 bg-zinc-950/40 rounded-lg">
                <span className="text-zinc-400 block text-[10px]">Weekly challenge</span>
                <span className="font-bold text-amber-400 flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3" /> 10 damage
                </span>
              </div>
              <div className="space-y-0.5 p-1 bg-zinc-950/40 rounded-lg">
                <span className="text-zinc-400 block text-[10px]">Milestone</span>
                <span className="font-bold text-amber-400 flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3" /> 100 damage
                </span>
              </div>
            </div>
          </details>

          {/* Fellowship Tier Chests Carousel */}
          <div className="space-y-3 min-w-0 w-full">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-zinc-200 flex items-center gap-2 font-serif">
                <Trophy className="w-4 h-4 text-amber-400" /> Fellowship raid victory tier chests
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline-flex items-center gap-1">
                  ⏱️ Reset: <strong className="text-amber-300">4d 18h</strong>
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => scrollCarousel('left')}
                    className="h-7 w-7 rounded-lg border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:text-amber-300 text-zinc-400 shadow-sm"
                    aria-label="Previous chests"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => scrollCarousel('right')}
                    className="h-7 w-7 rounded-lg border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:text-amber-300 text-zinc-400 shadow-sm"
                    aria-label="Next chests"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Fellowship Raid Victory Co-op Damage Progress Bar */}
            <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-3 space-y-1.5 shadow-md">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                <span className="text-amber-300">⚔️ Total raid damage: {(maxHp - titanHp).toLocaleString()} / {maxHp.toLocaleString()} DMG</span>
                <span className="text-amber-400 font-bold">{Math.round(((maxHp - titanHp) / maxHp) * 100)}% to celestial titan chest</span>
              </div>
              <Progress value={Math.min(100, Math.round(((maxHp - titanHp) / maxHp) * 100))} className="h-2 bg-zinc-900" />
            </div>

            {/* Horizontal snap carousel - ONLY for the 5 chests */}
            <div
              ref={carouselRef}
              className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-3 pt-1 px-1 custom-scrollbar scroll-smooth w-full max-w-full touch-pan-x"
            >
              {CHESTS.map(chest => {
                const totalDmgDealt = maxHp - titanHp
                const unlocked = totalDmgDealt >= chest.reqHpDamage
                const chestState = chest.claimed ? 'claimed' : (unlocked ? 'ready' : 'locked')

                return (
                  <div
                    key={chest.tier}
                    className={cn(
                      "w-[220px] sm:w-[240px] shrink-0 snap-start flex flex-col justify-between p-3.5 rounded-2xl border shadow-lg transition-all duration-300 group",
                      chest.rarity === 'common' && 'border-amber-900/40 hover:border-amber-700/60 bg-gradient-to-b from-amber-950/20 via-zinc-950 to-zinc-950',
                      chest.rarity === 'uncommon' && 'border-emerald-900/40 hover:border-emerald-600/60 bg-gradient-to-b from-emerald-950/20 via-zinc-950 to-zinc-950',
                      chest.rarity === 'rare' && 'border-blue-900/40 hover:border-blue-600/60 bg-gradient-to-b from-blue-950/20 via-zinc-950 to-zinc-950',
                      chest.rarity === 'epic' && 'border-purple-900/40 hover:border-purple-600/60 bg-gradient-to-b from-purple-950/20 via-zinc-950 to-zinc-950',
                      chest.rarity === 'legendary' && 'border-amber-500/40 hover:border-amber-400/70 bg-gradient-to-b from-amber-950/30 via-zinc-950 to-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                    )}
                  >
                    {/* Card Header: Tier & Status */}
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                      <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 capitalize border-zinc-700 bg-zinc-900/80 text-zinc-300">
                        Tier {chest.tier} • {chest.rarity}
                      </Badge>
                      {chest.claimed ? (
                        <Badge className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Claimed
                        </Badge>
                      ) : unlocked ? (
                        <Badge className="bg-amber-500 text-zinc-950 font-bold text-[10px] font-mono animate-pulse shadow-md">
                          Ready
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-[10px] font-mono flex items-center gap-1">
                          <Lock className="w-3 h-3 text-zinc-500" /> Locked
                        </Badge>
                      )}
                    </div>

                    {/* Animated Fellowship Chest Visual */}
                    <div className="py-2 flex items-center justify-center">
                      <TreasureChestVisual
                        state={chestState}
                        rarity={chest.rarity}
                        hideLabels={true}
                        className="w-full h-32 my-1 transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                        onClick={() => unlocked && !chest.claimed && handleClaimChest(chest.tier)}
                      />
                    </div>

                    {/* Chest Info & Details */}
                    <div className="w-full space-y-2.5 mt-1">
                      <div className="text-center space-y-1">
                        <h5 className="font-bold text-xs sm:text-sm text-zinc-100 font-serif leading-tight">
                          {chest.label}
                        </h5>
                        <div className="flex items-center justify-between text-[10px] font-mono px-1">
                          <span className="text-zinc-400">Raid DMG</span>
                          <span className={unlocked ? "text-emerald-400 font-bold" : "text-amber-400/90 font-bold"}>
                            {Math.min(totalDmgDealt, chest.reqHpDamage).toLocaleString()} / {chest.reqHpDamage.toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(100, Math.round((totalDmgDealt / chest.reqHpDamage) * 100))}
                          className="h-1.5 bg-zinc-900"
                        />
                      </div>

                      {/* Loot Reward Box */}
                      <div className="p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80 text-center space-y-0.5">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block">
                          Loot contents
                        </span>
                        <p className="text-[11px] font-mono font-bold text-emerald-400 leading-tight">
                          🎁 {chest.reward}
                        </p>
                      </div>

                      {/* Action Button / Requirement */}
                      <div className="pt-1">
                        {chest.claimed ? (
                          <Badge variant="outline" className="w-full justify-center bg-zinc-900/90 text-zinc-400 text-xs py-2 border-zinc-800 font-serif">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Claimed
                          </Badge>
                        ) : unlocked ? (
                          <Button
                            onClick={() => handleClaimChest(chest.tier)}
                            className="btn-primary-cta w-full py-2 text-xs font-bold shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition-transform h-8"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            <span>Claim reward</span>
                          </Button>
                        ) : (
                          <div className="w-full py-1.5 px-2 text-center rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-500 text-[11px] font-mono font-medium flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3 text-zinc-600" />
                            <span>{(chest.reqHpDamage - totalDmgDealt).toLocaleString()} DMG to unlock</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          {/* Fellowship Contribution Leaderboard */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Top fellowship habit contributors
            </h4>
            <div className="bg-zinc-900/90 rounded-xl border border-zinc-800 p-3 space-y-2">
              {[
                { rank: 1, name: 'You (Sovereign)', damage: Math.max(120, userDamageToday * 15), badge: '🥇 Raid vanguard' },
                { rank: 2, name: 'Fellowship Allies', damage: 340, badge: '🥈 Support squad' }
              ].map(contributor => (
                <div key={contributor.rank} className="flex items-center justify-between text-xs p-2 rounded-lg bg-zinc-950/80 border border-zinc-800">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold font-mono text-amber-400">#{contributor.rank}</span>
                    <span className="font-bold text-zinc-200">{contributor.name}</span>
                    <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400 font-mono">
                      {contributor.badge}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-400">{contributor.damage} DMG</span>
                    {contributor.rank === 1 ? (
                      <span className="text-[10px] text-amber-400/80 font-serif italic px-2">Your impact</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          playSFX('button-click')
                          toast({ title: "🍻 Fellowship cheers sent!", description: `Sent a celebratory cheers toast to ${contributor.name}!` })
                        }}
                        className="h-6 text-[9px] px-2 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-bold rounded"
                      >
                        🍻 Cheers
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-zinc-900">
          <Button variant="ghost" onClick={onClose} className="text-xs text-zinc-400 hover:text-white">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
