'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ShieldAlert, Swords, Trophy, Gift, Zap } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface AllianceTitanRaidModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AllianceTitanRaidModal({ isOpen, onClose }: AllianceTitanRaidModalProps) {
  const [titanHp, setTitanHp] = useState(6450)
  const maxHp = 10000
  const [userDamageToday, setUserDamageToday] = useState(14)
  const [claimedTiers, setClaimedTiers] = useState<number[]>([1])

  // Load titan raid progress from localStorage
  useEffect(() => {
    try {
      const savedHp = localStorage.getItem('thrivehaven_titan_hp')
      if (savedHp) setTitanHp(parseInt(savedHp, 10))
      const savedDmg = localStorage.getItem('thrivehaven_user_titan_dmg')
      if (savedDmg) setUserDamageToday(parseInt(savedDmg, 10))
    } catch (err) {
      console.error('Error loading titan data:', err)
    }
  }, [isOpen])

  const hpPercent = Math.max(0, Math.min(100, Math.round((titanHp / maxHp) * 100)))

  const [deployedEngines, setDeployedEngines] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const sandbox = JSON.parse(localStorage.getItem('sandbox-inventory') || '{}');
      const claimed = JSON.parse(localStorage.getItem('claimed-siege-weapons') || '[]');
      const grid = JSON.parse(localStorage.getItem('kingdom-grid') || '[]');
      
      const found = new Set<string>();
      
      if (Array.isArray(grid)) {
        grid.forEach((row: any) => {
          if (Array.isArray(row)) {
            row.forEach((tile: any) => {
              if (tile?.placedSiegeEngine?.id) {
                found.add(tile.placedSiegeEngine.id);
              }
            });
          }
        });
      }
      
      claimed.forEach((id: string) => found.add(id));
      Object.keys(sandbox).forEach((id: string) => {
        if (sandbox[id] > 0) found.add(id);
      });

      const siegeNameMap: Record<string, string> = {
        siege_catapult: 'Catapult',
        siege_scorpion: 'Scorpion',
        siege_battering_ram: 'Battering ram',
        siege_trebuchet: 'Trebuchet',
        siege_tower: 'Siegetower',
        siege_flame_ballista: 'Balista',
        siege_spring_cannon: 'Canon',
        siege_ether_mortar: 'Flaming catapult',
        siege_dragon_mortar: 'Flaming scorpion',
        siege_astral_projector: 'Flaming trebuchet',
      };

      const enginesList = Array.from(found).map(id => ({
        id,
        name: siegeNameMap[id] || id.replace('siege_', '')
      }));

      setDeployedEngines(enginesList);
    } catch {
      setDeployedEngines([]);
    }
  }, [isOpen]);

  const CHESTS = [
    { tier: 1, reqHpDamage: 2500, label: 'Bronze alliance chest', reward: '+100 Gold & 2 Essences', claimed: claimedTiers.includes(1) },
    { tier: 2, reqHpDamage: 5000, label: 'Silver alliance chest', reward: '+250 Gold & 5 Essences', claimed: claimedTiers.includes(2) },
    { tier: 3, reqHpDamage: 7500, label: 'Gold alliance chest', reward: '+500 Gold & Mythic Blueprint', claimed: claimedTiers.includes(3) }
  ]

  const handleClaimChest = (tier: number) => {
    if (!claimedTiers.includes(tier)) {
      setClaimedTiers([...claimedTiers, tier])
      const chestObj = CHESTS.find(c => c.tier === tier)
      toast({
        title: "🏆 Victory Chest Claimed!",
        description: `Unlocked ${chestObj?.label || 'Fellowship Chest'}: ${chestObj?.reward || 'Rewards'}!`,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-zinc-950 border border-amber-900/50 text-white rounded-2xl p-6 shadow-2xl overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <DialogTitle className="text-xl font-bold tracking-wide text-red-100">
                Fellowship Titan Wyrm Raid
              </DialogTitle>
            </div>
            <Badge variant="outline" className="border-red-500/40 text-red-400 bg-red-950/30 text-xs">
              Weekly raid boss
            </Badge>
          </div>
          <DialogDescription className="text-zinc-400 text-xs mt-1">
            Complete daily quests (1 dmg), weekly challenges (10 dmg), and cumulative milestones (100 dmg) to slay the Titan Wyrm!
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
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
                  ⚔️ Your Habits Dealt {userDamageToday} DMG Today!
                </Badge>
                <span className="text-emerald-400 font-mono font-bold text-[10px]">⚡ Active Fellowship Raid</span>
              </div>
            </div>
          </div>

          {/* Fellowship Combo & Siege Arsenal Multiplier Banner */}
          <div className="space-y-2">
            <div className="p-2.5 bg-gradient-to-r from-red-950 via-zinc-950 to-red-950 rounded-xl border border-red-500/40 flex items-center justify-between text-xs font-serif shadow-md">
              <span className="text-red-300 font-bold flex items-center gap-1.5">
                🔥 5-Hit Fellowship Raid Combo Active!
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-300">1.5x Boss Damage Multiplier</span>
            </div>

            {/* Active Siege Engines & Potion Oils Banner */}
            <div className="p-3 bg-gradient-to-r from-amber-950/60 via-zinc-900 to-amber-950/60 rounded-xl border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-lg">🪵</span>
                <div>
                  <div className="font-bold text-amber-300 font-serif">Deployed Siege Weapons & Oils</div>
                  <div className="text-[10px] text-zinc-400">Catapults, Scorpions & Greek Fire Oils boost all raid strikes</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {deployedEngines.length > 0 ? (
                  deployedEngines.map(e => (
                    <span key={e.id} className="text-[10px] font-mono font-bold bg-amber-950 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full">
                      🎯 {e.name} +20%
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] font-mono text-zinc-400 italic">
                    Claim engines in Siege Workshop to activate raid perks!
                  </span>
                )}
                <span className="text-[10px] font-mono font-bold bg-amber-950 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full">
                  🔥 Greek Fire Oil +25%
                </span>
              </div>
            </div>
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

          {/* Fellowship Tier Chests */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 font-serif">
                <Trophy className="w-4 h-4 text-amber-400" /> Fellowship Raid Victory Tier Chests
              </h4>
              <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                ⏱️ Reset: <strong className="text-amber-300">4d 18h</strong>
              </span>
            </div>

            {/* Fellowship Raid Victory Co-op Damage Progress Bar */}
            <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-3 space-y-1.5 shadow-md">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                <span className="text-amber-300">⚔️ Total Raid Damage: {maxHp - titanHp} / 2,000 DMG</span>
                <span className="text-emerald-400 font-bold">{Math.round(((maxHp - titanHp) / 2000) * 100)}% to Mythic Victory Chest</span>
              </div>
              <Progress value={Math.min(100, Math.round(((maxHp - titanHp) / 2000) * 100))} className="h-2 bg-zinc-900" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {CHESTS.map(chest => {
                const totalDmgDealt = maxHp - titanHp
                const unlocked = totalDmgDealt >= chest.reqHpDamage
                return (
                  <div
                    key={chest.tier}
                    className={`rounded-xl border p-3 flex flex-col justify-between transition-all ${
                      unlocked ? 'border-amber-500/40 bg-amber-950/20' : 'border-zinc-800 bg-zinc-900/30 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Gift className={`w-4 h-4 ${unlocked ? 'text-amber-400' : 'text-zinc-500'}`} />
                        <span className="font-bold text-xs text-zinc-200">{chest.label}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400">{chest.reward}</p>
                    </div>

                    <div className="mt-3">
                      {chest.claimed ? (
                        <Badge variant="outline" className="w-full justify-center bg-zinc-800 text-zinc-400 text-[10px]">
                          Claimed
                        </Badge>
                      ) : (
                        <Button
                          disabled={!unlocked}
                          onClick={() => handleClaimChest(chest.tier)}
                          className="w-full h-7 text-[11px] font-bold bg-amber-600 hover:bg-amber-500 text-white"
                        >
                          {unlocked ? 'Claim reward' : `${chest.reqHpDamage} DMG req.`}
                        </Button>
                      )}
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
                { rank: 1, name: 'You (Sovereign)', damage: Math.max(120, userDamageToday * 15), badge: '🥇 Raid Vanguard' },
                { rank: 2, name: 'Fellowship Allies', damage: 340, badge: '🥈 Support Squad' }
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast({ title: "🍻 Fellowship Cheers Sent!", description: `Sent a celebratory cheers toast to ${contributor.name}!` })}
                      className="h-6 text-[9px] px-2 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-bold rounded"
                    >
                      🍻 Cheers
                    </Button>
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
