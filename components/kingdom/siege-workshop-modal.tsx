"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ShieldAlert, Sword, Zap, Trophy, CheckCircle2, Hammer, Flame, Lock, Sparkles } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"

interface SiegeWorkshopModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export interface SiegeWeaponDef {
  id: string
  name: string
  category: string
  icon: any
  emoji: string
  threshold: number
  perk: string
  image: string
  tileId: string
}

export const SIEGE_WEAPONS: SiegeWeaponDef[] = [
  {
    id: 'siege_catapult',
    name: 'Woodland Catapult',
    category: 'Might',
    icon: Sword,
    emoji: '🗡️',
    threshold: 100,
    perk: '+20% Might & Fire Siege damage in Titan Raids',
    image: '/images/kingdom-tiles/siege_catapult.webp',
    tileId: 'siege_catapult'
  },
  {
    id: 'siege_scorpion',
    name: 'Iron Scorpion Ballista',
    category: 'Knowledge',
    icon: Zap,
    emoji: '🧠',
    threshold: 100,
    perk: '+20% Precision Siege damage in Titan Raids',
    image: '/images/kingdom-tiles/siege_scorpion.webp',
    tileId: 'siege_scorpion'
  },
  {
    id: 'siege_battering_ram',
    name: 'Heavy Battering Ram',
    category: 'Honor',
    icon: ShieldAlert,
    emoji: '🛡️',
    threshold: 100,
    perk: '+20% Armor Break & Defense penetration on Titan Wyrm',
    image: '/images/kingdom-tiles/siege_battering_ram.webp',
    tileId: 'siege_battering_ram'
  },
  {
    id: 'siege_tower',
    name: 'Fortress Siege Tower',
    category: 'Castle',
    icon: Hammer,
    emoji: '🏰',
    threshold: 100,
    perk: '+20% Fortification Breach & Shield penetration in Titan Raids',
    image: '/images/kingdom-tiles/siege_tower.webp',
    tileId: 'siege_tower'
  },
  {
    id: 'siege_flame_ballista',
    name: 'Repeating Flame Ballista',
    category: 'Craft',
    icon: Flame,
    emoji: '🔧',
    threshold: 100,
    perk: '+20% Craft & Burning Siege Bolt damage in Titan Raids',
    image: '/images/kingdom-tiles/siege_flame_ballista.webp',
    tileId: 'siege_flame_ballista'
  },
  {
    id: 'siege_trebuchet',
    name: 'War Trebuchet',
    category: 'Vitality',
    icon: Trophy,
    emoji: '❤️',
    threshold: 100,
    perk: '+25% Heavy Siege Splash damage in Titan Raids',
    image: '/images/kingdom-tiles/siege_trebuchet.webp',
    tileId: 'siege_trebuchet'
  },
  {
    id: 'siege_spring_cannon',
    name: 'Serene Spring Cannon',
    category: 'Wellness',
    icon: Sparkles,
    emoji: '🌿',
    threshold: 100,
    perk: '+20% Wellness Healing & Squad Regeneration in Titan Raids',
    image: '/images/kingdom-tiles/siege_spring_cannon.webp',
    tileId: 'siege_spring_cannon'
  },
  {
    id: 'siege_ether_mortar',
    name: 'Ether Long-Range Mortar',
    category: 'Exploration',
    icon: Scroll,
    emoji: '🧭',
    threshold: 100,
    perk: '+20% Long-Range Ether Bombardment damage in Titan Raids',
    image: '/images/kingdom-tiles/siege_ether_mortar.webp',
    tileId: 'siege_ether_mortar'
  },
  {
    id: 'siege_dragon_mortar',
    name: 'Mythic Dragon Mortar',
    category: 'Conquest',
    icon: Flame,
    emoji: '⚔️',
    threshold: 100,
    perk: '+25% Conquest Mythic Fire Blast damage in Titan Raids',
    image: '/images/kingdom-tiles/siege_dragon_mortar.webp',
    tileId: 'siege_dragon_mortar'
  },
  {
    id: 'siege_astral_projector',
    name: 'Astral Ray Projector',
    category: 'Spirit',
    icon: Sparkles,
    emoji: '✨',
    threshold: 100,
    perk: '+25% Holy Energy Surge & Critical Multiplier in Titan Raids',
    image: '/images/kingdom-tiles/siege_astral_projector.webp',
    tileId: 'siege_astral_projector'
  }
]

export function SiegeWorkshopModal({ open, onOpenChange, onComplete }: SiegeWorkshopModalProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<Record<string, number>>({
    Might: 0,
    Knowledge: 0,
    Honor: 0,
    Vitality: 0
  })
  const [claimedWeapons, setClaimedWeapons] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      fetchWorkshopData()
    }
  }, [open])

  const fetchWorkshopData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/kingdom/siege-workshop')
      if (res.ok) {
        const data = await res.json()
        setProgress(data.progress || { Might: 0, Knowledge: 0, Honor: 0, Vitality: 0 })
        setClaimedWeapons(data.claimedWeapons || [])
      }
    } catch {
      // Local fallback calculation from stored quests
      try {
        const cached = localStorage.getItem('quests-cache')
        if (cached) {
          const quests = JSON.parse(cached)
          const completed = quests.filter((q: any) => q.completed)
          const counts: Record<string, number> = { Might: 0, Knowledge: 0, Honor: 0, Vitality: 0 }
          completed.forEach((q: any) => {
            const cat = q.category || 'Might'
            if (counts[cat] !== undefined) counts[cat] += 1
            else counts.Might += 1
          })
          setProgress(counts)
        }
      } catch {
        // Fallback
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClaimWeapon = async (weapon: SiegeWeaponDef) => {
    const currentProgress = progress[weapon.category] || 0
    if (currentProgress < weapon.threshold) {
      toast({
        title: "Milestone Threshold Not Met",
        description: `Requires ${weapon.threshold} ${weapon.category} habit completions (Current: ${currentProgress}/${weapon.threshold}).`,
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/kingdom/siege-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim_weapon', weaponId: weapon.id })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to claim weapon')
      }

      setClaimedWeapons(prev => [...prev, weapon.id])

      // Store in local sandbox inventory
      const existingInventory = JSON.parse(localStorage.getItem('sandbox-inventory') || '{}')
      existingInventory[weapon.tileId] = (existingInventory[weapon.tileId] || 0) + 1
      localStorage.setItem('sandbox-inventory', JSON.stringify(existingInventory))
      window.dispatchEvent(new Event('inventory-updated'))

      toast({
        title: `🏆 ${weapon.name} Unlocked!`,
        description: `${weapon.name} added to your Sandbox Inventory! You can now place it anywhere on your Realm Map!`,
      })

      if (onComplete) onComplete()
    } catch (err: any) {
      toast({
        title: "Claim Error",
        description: err.message || "Failed to claim siege weapon.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-[620px] bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-amber-800/60 text-white rounded-2xl p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="text-center flex flex-col items-center">
          <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-400 mb-2 shadow-inner">
            <Hammer className="w-8 h-8" />
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-serif font-bold text-amber-400 drop-shadow">
            Siege Engine Workshop
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-300 max-w-md mx-auto">
            Commit daily habit achievements with your allies to craft Catapults, Scorpions, and Trebuchets for Titan Wyrm battles!
          </DialogDescription>
          <div className="mt-2 inline-flex items-center gap-2 bg-amber-950/90 border border-amber-500/40 text-amber-300 px-3.5 py-1 rounded-full text-xs font-mono font-bold shadow-md">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Co-Op Threshold: 100 Quests per Engine</span>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {SIEGE_WEAPONS.map(weapon => {
            const currentProgress = progress[weapon.category] || 0
            const isUnlocked = currentProgress >= weapon.threshold
            const isClaimed = claimedWeapons.includes(weapon.id)
            const pct = Math.min(100, Math.round((currentProgress / weapon.threshold) * 100))

            return (
              <div
                key={weapon.id}
                className="relative p-4 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-amber-900/40 rounded-2xl overflow-hidden shadow-lg hover:border-amber-500/40 transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Weapon Image / Icon Box */}
                  <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-amber-800/40 bg-black/60 flex items-center justify-center">
                    <Image
                      src={weapon.image}
                      alt={weapon.name}
                      fill
                      className="object-cover"
                    />
                    {isUnlocked && (
                      <div className="absolute top-1 right-1 bg-amber-500 text-zinc-950 rounded-full p-0.5 shadow-md">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Info & Progress */}
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold font-serif text-amber-300">{weapon.name}</span>
                        <span className="text-[10px] bg-zinc-900 border border-amber-800/30 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                          {weapon.emoji} {weapon.category}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-zinc-400">
                        {currentProgress} / {weapon.threshold}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {weapon.perk}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <Progress value={pct} className="h-2 bg-zinc-950 border border-amber-900/30" />
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                        <span>{pct}% Completed</span>
                        <span>{isUnlocked ? 'Ready to Deploy!' : `${weapon.threshold - currentProgress} quests remaining`}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="mt-3 pt-3 border-t border-amber-900/20 flex justify-end">
                  {isClaimed ? (
                    <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Deployed to Sandbox Inventory!</span>
                    </div>
                  ) : isUnlocked ? (
                    <Button
                      onClick={() => handleClaimWeapon(weapon)}
                      disabled={loading}
                      className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-bold px-4 py-2 text-xs rounded-xl shadow-lg border border-amber-400/40"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Claim & Deploy to Realm Map
                    </Button>
                  ) : (
                    <div className="inline-flex items-center gap-1 text-xs text-zinc-500 font-bold bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Locked ({pct}%)</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
