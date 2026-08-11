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
          {/* Boss Banner */}
          <div className="relative rounded-xl border border-red-900/40 p-4 bg-gradient-to-r from-red-950/80 via-zinc-900 to-zinc-950 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-red-900/30 border border-red-500/40 flex items-center justify-center shrink-0 shadow-inner">
              <Swords className="w-8 h-8 text-red-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-red-200">Titan Wyrm of Gluttony</span>
                <span className="text-xs font-mono text-zinc-400">{titanHp.toLocaleString()} / {maxHp.toLocaleString()} HP</span>
              </div>
              <Progress value={hpPercent} className="h-3 bg-zinc-800" />
              <p className="text-[11px] text-zinc-400 mt-2">
                Your personal contribution today: <span className="text-amber-400 font-bold">{userDamageToday} raid damage</span>
              </p>
            </div>
          </div>

          {/* Damage Rules Box */}
          <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
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

          {/* Fellowship Tier Chests */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" /> Fellowship raid victory tier chests
            </h4>

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
                  <span className="font-mono font-bold text-red-400">{contributor.damage} DMG</span>
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
