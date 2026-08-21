"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Lock, Sparkles, Flame, Hammer, ChevronRight } from "lucide-react"

export interface TitanSiegeWeapon {
  id: string
  name: string
  category: string
  emoji: string
  threshold: number
  perk: string
  image: string
  attackPower: number
}

export const TITAN_SIEGE_WEAPONS: TitanSiegeWeapon[] = [
  {
    id: 'siege_catapult',
    name: 'Catapult',
    category: 'Might',
    emoji: '🗡️',
    threshold: 100,
    perk: '+20% Might & Fire Siege damage in Titan Raids',
    image: '/images/kingdom-tiles/siege_catapult.webp',
    attackPower: 20
  },
  {
    id: 'siege_scorpion',
    name: 'Scorpion',
    category: 'Knowledge',
    emoji: '🧠',
    threshold: 100,
    perk: '+20% Precision Siege damage in Titan Raids',
    image: '/images/kingdom-tiles/siege_scorpion.webp',
    attackPower: 20
  },
  {
    id: 'siege_battering_ram',
    name: 'Battering ram',
    category: 'Honor',
    emoji: '🛡️',
    threshold: 100,
    perk: '+20% Armor Break & Defense penetration on Titan Wyrm',
    image: '/images/kingdom-tiles/siege_battering_ram.webp',
    attackPower: 20
  },
  {
    id: 'siege_tower',
    name: 'Siegetower',
    category: 'Castle',
    emoji: '🏰',
    threshold: 100,
    perk: '+20% Fortification Breach & Shield penetration in Titan Raids',
    image: '/images/kingdom-tiles/siege_tower.webp',
    attackPower: 20
  },
  {
    id: 'siege_flame_ballista',
    name: 'Balista',
    category: 'Craft',
    emoji: '🔧',
    threshold: 100,
    perk: '+20% Craft & Burning Siege Bolt damage in Titan Raids',
    image: '/images/kingdom-tiles/siege_flame_ballista.webp',
    attackPower: 20
  },
  {
    id: 'siege_trebuchet',
    name: 'Trebuchet',
    category: 'Vitality',
    emoji: '❤️',
    threshold: 100,
    perk: '+25% Heavy Siege Splash damage in Titan Raids',
    image: '/images/kingdom-tiles/siege_trebuchet.webp',
    attackPower: 25
  },
  {
    id: 'siege_spring_cannon',
    name: 'Canon',
    category: 'Wellness',
    emoji: '🌿',
    threshold: 100,
    perk: '+20% Wellness Healing & Squad Regeneration in Titan Raids',
    image: '/images/kingdom-tiles/siege_spring_cannon.webp',
    attackPower: 20
  },
  {
    id: 'siege_ether_mortar',
    name: 'Flaming catapult',
    category: 'Exploration',
    emoji: '🧭',
    threshold: 100,
    perk: '+20% Long-Range Ether Bombardment damage in Titan Raids',
    image: '/images/kingdom-tiles/siege_ether_mortar.webp',
    attackPower: 20
  },
  {
    id: 'siege_dragon_mortar',
    name: 'Flaming scorpion',
    category: 'Conquest',
    emoji: '⚔️',
    threshold: 100,
    perk: '+25% Conquest Mythic Fire Blast damage in Titan Raids',
    image: '/images/kingdom-tiles/siege_dragon_mortar.webp',
    attackPower: 25
  },
  {
    id: 'siege_astral_projector',
    name: 'Flaming trebuchet',
    category: 'Spirit',
    emoji: '✨',
    threshold: 100,
    perk: '+25% Holy Energy Surge & Critical Multiplier in Titan Raids',
    image: '/images/kingdom-tiles/siege_astral_projector.webp',
    attackPower: 25
  }
]

interface TitanSiegeArsenalProps {
  onOpenWorkshop?: () => void
  className?: string
}

export function TitanSiegeArsenal({ onOpenWorkshop, className = "" }: TitanSiegeArsenalProps) {
  const [unlockedEngineIds, setUnlockedEngineIds] = useState<string[]>([])
  const [selectedMobileEngine, setSelectedMobileEngine] = useState<TitanSiegeWeapon | null>(null)

  useEffect(() => {
    try {
      const found = new Set<string>()
      
      // 1. Check local claimed array
      const claimed = JSON.parse(localStorage.getItem('claimed-siege-weapons') || '[]')
      if (Array.isArray(claimed)) claimed.forEach((id: string) => found.add(id))

      // 2. Check sandbox inventory
      const sandbox = JSON.parse(localStorage.getItem('sandbox-inventory') || '{}')
      Object.keys(sandbox).forEach((id: string) => {
        if (sandbox[id] > 0) found.add(id)
      })

      // 3. Check kingdom grid for placed engines
      const grid = JSON.parse(localStorage.getItem('kingdom-grid') || '[]')
      if (Array.isArray(grid)) {
        grid.forEach((row: any) => {
          if (Array.isArray(row)) {
            row.forEach((tile: any) => {
              if (tile?.placedSiegeEngine?.id) found.add(tile.placedSiegeEngine.id)
              if (tile?.placedSiegeEngine?.type) found.add(tile.placedSiegeEngine.type)
              if (tile?.type?.startsWith('siege_')) found.add(tile.type)
            })
          }
        })
      }

      setUnlockedEngineIds(Array.from(found))
    } catch {
      setUnlockedEngineIds([])
    }
  }, [])

  const unlockedCount = TITAN_SIEGE_WEAPONS.filter(w => unlockedEngineIds.includes(w.id)).length
  const totalPowerBoost = TITAN_SIEGE_WEAPONS
    .filter(w => unlockedEngineIds.includes(w.id))
    .reduce((sum, w) => sum + w.attackPower, 0)

  const handleSlotClick = (weapon: TitanSiegeWeapon) => {
    // Open mobile detail modal on touch viewports or click
    setSelectedMobileEngine(weapon)
  }

  return (
    <div className={`p-4 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-900/50 rounded-2xl shadow-xl space-y-3 ${className}`}>
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-900/30 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-950 border border-amber-500/40 text-amber-400">
            <Hammer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-serif text-amber-300">
              Titan Raid siege arsenal (10 slots)
            </h3>
            <p className="text-[11px] text-zinc-400">
              {unlockedCount}/10 Siege engines unlocked for Titan Wyrm battles
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full text-xs font-mono font-bold">
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Total Siege Power: +{totalPowerBoost}%</span>
        </div>
      </div>

      {/* Desktop Layout: 2 Rows of 5 Slots (5x2 Grid) */}
      <TooltipProvider delayDuration={150}>
        <div className="hidden sm:grid grid-cols-5 gap-3">
          {TITAN_SIEGE_WEAPONS.map((weapon) => {
            const isUnlocked = unlockedEngineIds.includes(weapon.id)

            return (
              <Tooltip key={weapon.id}>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => handleSlotClick(weapon)}
                    className={`relative h-24 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 flex flex-col items-center justify-center p-2 border ${
                      isUnlocked
                        ? "border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:scale-105 hover:border-amber-400"
                        : "border-zinc-800/80 opacity-70 hover:opacity-100 hover:border-zinc-700"
                    }`}
                    style={{
                      backgroundImage: "url('/images/tiles/grass-tile.webp')",
                      backgroundSize: "cover",
                      backgroundPosition: "center"
                    }}
                  >
                    {/* Dark gradient overlay for contrast */}
                    <div className="absolute inset-0 bg-black/40 backdrop-brightness-90" />

                    {isUnlocked ? (
                      <>
                        <div className="relative w-12 h-12 z-10 drop-shadow-md">
                          <Image
                            src={weapon.image}
                            alt={weapon.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <div className="absolute top-1 right-1 z-20 bg-emerald-500 text-zinc-950 rounded-full p-0.5 shadow-md">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                        <span className="relative z-10 text-[10px] font-mono font-bold text-amber-300 bg-black/70 border border-amber-500/40 px-1.5 py-0.5 rounded-full mt-1">
                          +{weapon.attackPower}% ATK
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="relative z-10 p-2 rounded-full bg-black/70 border border-zinc-700 text-zinc-400">
                          <Lock className="w-5 h-5" />
                        </div>
                        <span className="relative z-10 text-[9px] font-mono font-bold text-zinc-400 bg-black/70 px-1.5 py-0.5 rounded-full mt-1">
                          Locked
                        </span>
                      </>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-xs bg-zinc-950 border border-amber-800/60 text-white p-3 shadow-2xl rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1">
                    <span className="font-serif font-bold text-xs text-amber-300">{weapon.name}</span>
                    <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
                      {weapon.emoji} {weapon.category}
                    </Badge>
                  </div>
                  {isUnlocked ? (
                    <div className="space-y-1">
                      <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked & active in Titan Raids!
                      </p>
                      <p className="text-xs text-zinc-300 leading-snug">{weapon.perk}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-amber-400 font-bold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Locked Siege Engine
                      </p>
                      <p className="text-xs text-zinc-300 leading-snug">
                        Complete {weapon.threshold} {weapon.category} daily quests with your alliance members in the Siege Engine Workshop to unlock {weapon.name}!
                      </p>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>

      {/* Mobile Layout: Swipeable Horizontal Carousel */}
      <div className="sm:hidden flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-2.5 pb-2 -mx-1 px-1">
        {TITAN_SIEGE_WEAPONS.map((weapon) => {
          const isUnlocked = unlockedEngineIds.includes(weapon.id)

          return (
            <div
              key={weapon.id}
              onClick={() => handleSlotClick(weapon)}
              className={`w-24 shrink-0 snap-center h-24 rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col items-center justify-center p-2 border relative ${
                isUnlocked
                  ? "border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                  : "border-zinc-800 opacity-70"
              }`}
              style={{
                backgroundImage: "url('/images/tiles/grass-tile.webp')",
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            >
              <div className="absolute inset-0 bg-black/40 backdrop-brightness-90" />

              {isUnlocked ? (
                <>
                  <div className="relative w-10 h-10 z-10">
                    <Image
                      src={weapon.image}
                      alt={weapon.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="absolute top-1 right-1 z-20 bg-emerald-500 text-zinc-950 rounded-full p-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <span className="relative z-10 text-[9px] font-mono font-bold text-amber-300 bg-black/70 border border-amber-500/40 px-1 py-0.5 rounded-full mt-1">
                    +{weapon.attackPower}%
                  </span>
                </>
              ) : (
                <>
                  <div className="relative z-10 p-1.5 rounded-full bg-black/70 border border-zinc-700 text-zinc-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="relative z-10 text-[9px] font-mono font-bold text-zinc-400 bg-black/70 px-1 py-0.5 rounded-full mt-1">
                    Locked
                  </span>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile Swipe Guidance Indicator */}
      <div className="sm:hidden flex items-center justify-between text-[10px] text-zinc-400 px-1">
        <span>👈 Swipe to view all 10 engines</span>
        <span>Tap any slot for details</span>
      </div>

      {/* Mobile Slot Detail Modal */}
      <Dialog open={!!selectedMobileEngine} onOpenChange={(open) => !open && setSelectedMobileEngine(null)}>
        {selectedMobileEngine && (
          <DialogContent className="max-w-xs bg-zinc-950 border border-amber-800/60 text-white rounded-2xl p-5 shadow-2xl">
            <DialogHeader className="flex flex-col items-center text-center">
              {/* Slot Preview */}
              <div
                className="relative w-20 h-20 rounded-2xl border-2 border-amber-500/60 overflow-hidden flex items-center justify-center mb-3 shadow-lg"
                style={{
                  backgroundImage: "url('/images/tiles/grass-tile.webp')",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                <div className="absolute inset-0 bg-black/30" />
                {unlockedEngineIds.includes(selectedMobileEngine.id) ? (
                  <div className="relative w-14 h-14 z-10">
                    <Image
                      src={selectedMobileEngine.image}
                      alt={selectedMobileEngine.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="relative z-10 p-2.5 rounded-full bg-black/80 border border-zinc-700 text-zinc-400">
                    <Lock className="w-6 h-6" />
                  </div>
                )}
              </div>

              <DialogTitle className="text-xl font-serif font-bold text-amber-300">
                {selectedMobileEngine.name}
              </DialogTitle>
              <Badge variant="outline" className="mt-1 border-amber-500/40 text-amber-400 text-xs">
                {selectedMobileEngine.emoji} {selectedMobileEngine.category}
              </Badge>
            </DialogHeader>

            <div className="my-3 space-y-2 text-center text-xs">
              {unlockedEngineIds.includes(selectedMobileEngine.id) ? (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl space-y-1">
                  <p className="font-bold text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Unlocked & active in Titan Raids!
                  </p>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {selectedMobileEngine.perk}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl space-y-1.5">
                  <p className="font-bold text-amber-400 flex items-center justify-center gap-1">
                    <Lock className="w-4 h-4" /> Locked Siege Engine
                  </p>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    Complete <strong className="text-amber-300">{selectedMobileEngine.threshold} {selectedMobileEngine.category}</strong> daily habits with your alliance members in the Siege Engine Workshop to unlock this weapon!
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              {onOpenWorkshop && !unlockedEngineIds.includes(selectedMobileEngine.id) ? (
                <Button
                  onClick={() => {
                    setSelectedMobileEngine(null)
                    onOpenWorkshop()
                  }}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-zinc-950 font-bold text-xs rounded-xl"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Open Siege Engine Workshop
                </Button>
              ) : (
                <Button
                  onClick={() => setSelectedMobileEngine(null)}
                  variant="outline"
                  className="w-full border-zinc-700 text-zinc-300 text-xs rounded-xl"
                >
                  Close
                </Button>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
