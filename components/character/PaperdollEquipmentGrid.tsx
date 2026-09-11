'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Shield, Sword, Shirt, Gem, Sparkles, Award, Flame, ArrowRightLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface EquippedItem {
  id: string
  name: string
  slot: 'weapon' | 'offhand' | 'armor' | 'mount' | 'relic'
  stats: { atk?: number; def?: number; spd?: number }
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  image: string
  description: string
}

const DEFAULT_EQUIPMENT: Record<'weapon' | 'offhand' | 'armor' | 'mount' | 'relic', EquippedItem | null> = {
  weapon: {
    id: 'sword-irony',
    name: 'Irony Longsword',
    slot: 'weapon',
    stats: { atk: 25, spd: 5 },
    rarity: 'rare',
    image: '/images/items/sword/sword-irony.webp',
    description: 'Flamio heated the ingot and Vulcana tempered the blade using pure habit sparks.'
  },
  offhand: {
    id: 'shield-oak',
    name: 'Sturdy Oak Shield',
    slot: 'offhand',
    stats: { def: 18 },
    rarity: 'uncommon',
    image: '/images/items/shield/shield-blockado.webp',
    description: 'Carved by Shello from ancient riverbed stone to deflect heavy dungeon blows.'
  },
  armor: {
    id: 'armor-normalo',
    name: 'Vanguard Cuirass',
    slot: 'armor',
    stats: { def: 35, atk: 10 },
    rarity: 'epic',
    image: '/images/items/armor/armor-normalo.webp',
    description: 'Forged by Buldour and fitted for champions who walk the realm.'
  },
  mount: {
    id: 'mount-goldy',
    name: 'Golden Warhorse',
    slot: 'mount',
    stats: { spd: 30, atk: 10 },
    rarity: 'epic',
    image: '/images/items/horse/horse-goldy.webp',
    description: 'A spirited wild horse reared in the green meadows, eager for long voyages.'
  },
  relic: {
    id: 'relic-astral',
    name: 'Astral crystal',
    slot: 'relic',
    stats: { atk: 15, def: 15, spd: 15 },
    rarity: 'legendary',
    image: '/images/items/materials/material-crystal.webp',
    description: 'Turtoisy found this crystal in an astral cavern, humming with virtue power.'
  }
}

export const getItemRarityStyles = (rarity: string) => {
  switch (rarity) {
    case 'legendary':
      return {
        border: 'border-amber-400/90 shadow-[0_0_16px_rgba(245,158,11,0.4)] ring-2 ring-amber-500/20',
        modalBorder: '!border-amber-500/70 shadow-[0_0_30px_rgba(245,158,11,0.35)]',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
        text: 'text-amber-400',
        thumbnailBg: 'from-amber-950/40 via-zinc-900 to-zinc-950',
      }
    case 'epic':
      return {
        border: 'border-purple-400/90 shadow-[0_0_16px_rgba(168,85,247,0.4)] ring-2 ring-purple-500/20',
        modalBorder: '!border-purple-500/70 shadow-[0_0_30px_rgba(168,85,247,0.35)]',
        badge: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
        text: 'text-purple-400',
        thumbnailBg: 'from-purple-950/40 via-zinc-900 to-zinc-950',
      }
    case 'rare':
      return {
        border: 'border-blue-400/90 shadow-[0_0_16px_rgba(59,130,246,0.4)] ring-2 ring-blue-500/20',
        modalBorder: '!border-blue-500/70 shadow-[0_0_30px_rgba(59,130,246,0.35)]',
        badge: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
        text: 'text-blue-400',
        thumbnailBg: 'from-blue-950/40 via-zinc-900 to-zinc-950',
      }
    case 'uncommon':
      return {
        border: 'border-emerald-400/90 shadow-[0_0_16px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/20',
        modalBorder: '!border-emerald-500/70 shadow-[0_0_30px_rgba(16,185,129,0.35)]',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
        text: 'text-emerald-400',
        thumbnailBg: 'from-emerald-950/40 via-zinc-900 to-zinc-950',
      }
    default:
      return {
        border: 'border-zinc-400/80 shadow-[0_0_12px_rgba(161,161,170,0.25)] ring-2 ring-zinc-500/20',
        modalBorder: '!border-zinc-700 shadow-xl',
        badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        text: 'text-zinc-300',
        thumbnailBg: 'from-zinc-900 via-zinc-900 to-zinc-950',
      }
  }
}

export interface PaperdollEquipmentGridProps {
  avatarImage?: string
  heroName?: string
  onOpenInventory?: () => void
  onStatsCalculated?: (stats: { atk: number; def: number; spd: number; gearScore: number }) => void
}

export function getEquippedGear(): Record<'weapon' | 'offhand' | 'armor' | 'mount' | 'relic', EquippedItem | null> {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('pref:equipped_gear')
      if (saved) return JSON.parse(saved)
    } catch {}
  }
  return DEFAULT_EQUIPMENT
}

export function getEquippedGearStats(): { atk: number; def: number; spd: number; gearScore: number } {
  const gear = getEquippedGear()
  const atk = Object.values(gear).reduce((acc, item) => acc + (item?.stats.atk || 0), 0)
  const def = Object.values(gear).reduce((acc, item) => acc + (item?.stats.def || 0), 0)
  const spd = Object.values(gear).reduce((acc, item) => acc + (item?.stats.spd || 0), 0)
  const gearScore = Math.round(atk * 2 + def * 1.5 + spd * 3)
  return { atk, def, spd, gearScore }
}

export function PaperdollEquipmentGrid({
  avatarImage = '/images/character/count.webp',
  heroName = 'Count',
  onOpenInventory,
  onStatsCalculated
}: PaperdollEquipmentGridProps) {
  const [equipment, setEquipment] = useState<Record<'weapon' | 'offhand' | 'armor' | 'mount' | 'relic', EquippedItem | null>>(DEFAULT_EQUIPMENT)
  const [selectedItem, setSelectedItem] = useState<EquippedItem | null>(null)

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('pref:equipped_gear')
      if (saved) {
        setEquipment(JSON.parse(saved))
      }
    } catch {}
  }, [])

  // Calculate total stats
  const totalAtk = Object.values(equipment).reduce((acc, item) => acc + (item?.stats.atk || 0), 0)
  const totalDef = Object.values(equipment).reduce((acc, item) => acc + (item?.stats.def || 0), 0)
  const totalSpd = Object.values(equipment).reduce((acc, item) => acc + (item?.stats.spd || 0), 0)
  const gearScore = totalAtk * 2 + totalDef * 1.5 + totalSpd * 3

  React.useEffect(() => {
    if (onStatsCalculated) {
      onStatsCalculated({ atk: totalAtk, def: totalDef, spd: totalSpd, gearScore: Math.round(gearScore) })
    }
  }, [totalAtk, totalDef, totalSpd, gearScore, onStatsCalculated])

  const SLOT_CONFIGS: { slot: 'weapon' | 'offhand' | 'armor' | 'mount' | 'relic'; label: string; icon: React.ReactNode }[] = [
    { slot: 'weapon', label: 'Weapon', icon: <Sword className="w-6 h-6 text-amber-400" /> },
    { slot: 'offhand', label: 'Shield', icon: <Shield className="w-6 h-6 text-blue-400" /> },
    { slot: 'armor', label: 'Armor', icon: <Shirt className="w-6 h-6 text-emerald-400" /> },
    { slot: 'mount', label: 'Mount', icon: <span className="text-xl">🐎</span> },
    { slot: 'relic', label: 'Artifact', icon: <Gem className="w-6 h-6 text-purple-400" /> }
  ]

  const getRarityBadge = (rarity: string) => getItemRarityStyles(rarity).badge

  const handleEquipmentChange = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-inventory-bag', { detail: { tab: 'stored', filter: 'equipment' } }))
    }
    if (onOpenInventory) {
      onOpenInventory()
    }
    setSelectedItem(null)
  }

  return (
    <div className="flex flex-col justify-between h-full space-y-6">
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-amber-900/30">
        <div>
          <h3 className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" /> Equipped gear & relics
          </h3>
          <p className="text-xs text-zinc-400 font-serif">
            Interactive paperdoll • Tap any slot to inspect or change gear
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <Badge variant="outline" className="border-amber-500/40 text-amber-300 bg-amber-950/40 text-xs font-mono font-bold px-3 py-1">
            ⚡ Gear score: {Math.round(gearScore)}
          </Badge>
          <Button
            type="button"
            onClick={handleEquipmentChange}
            size="sm"
            className="btn-primary-cta text-xs h-8 px-3.5 font-serif"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 mr-1" /> Open bag
          </Button>
        </div>
      </div>

      {/* Spacious 2D Paperdoll Stage */}
      <div className="relative w-full bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center shadow-inner overflow-hidden flex-1 min-h-[360px]">
        {/* Ambient Radial Aura Glow */}
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm flex items-center justify-center py-6 px-4">
          {/* Central Hero Character Avatar Showcase */}
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-3xl border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/10 via-zinc-900/90 to-zinc-950 p-2 shadow-[0_0_35px_rgba(245,158,11,0.2)] flex items-center justify-center overflow-hidden group">
            <Image
              src={avatarImage}
              alt={heroName}
              fill
              className="object-contain p-2 filter drop-shadow-[0_0_20px_rgba(245,158,11,0.3)] group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          </div>

          {/* 4 Corner Equipment Slots with Generous Breathing Room */}
          {/* Top-Left: Weapon */}
          <div className="absolute -top-3 -left-3 sm:-left-6 md:-left-8 z-20">
            <EquipmentSlotButton
              item={equipment.weapon}
              slotConfig={SLOT_CONFIGS[0]}
              onClick={() => equipment.weapon && setSelectedItem(equipment.weapon)}
            />
          </div>

          {/* Top-Right: Shield */}
          <div className="absolute -top-3 -right-3 sm:-right-6 md:-right-8 z-20">
            <EquipmentSlotButton
              item={equipment.offhand}
              slotConfig={SLOT_CONFIGS[1]}
              onClick={() => equipment.offhand && setSelectedItem(equipment.offhand)}
            />
          </div>

          {/* Bottom-Left: Armor */}
          <div className="absolute -bottom-3 -left-3 sm:-left-6 md:-left-8 z-20">
            <EquipmentSlotButton
              item={equipment.armor}
              slotConfig={SLOT_CONFIGS[2]}
              onClick={() => equipment.armor && setSelectedItem(equipment.armor)}
            />
          </div>

          {/* Bottom-Right: Mount */}
          <div className="absolute -bottom-3 -right-3 sm:-right-6 md:-right-8 z-20">
            <EquipmentSlotButton
              item={equipment.mount}
              slotConfig={SLOT_CONFIGS[3]}
              onClick={() => equipment.mount && setSelectedItem(equipment.mount)}
            />
          </div>
        </div>

        {/* Centered Relic Slot Directly Under Avatar */}
        <div className="mt-6 z-20">
          <EquipmentSlotButton
            item={equipment.relic}
            slotConfig={SLOT_CONFIGS[4]}
            onClick={() => equipment.relic && setSelectedItem(equipment.relic)}
          />
        </div>
      </div>

      {/* Equipped Gear Overview Horizontal Tray */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-serif font-bold text-amber-300/90">
            Equipped gear overview
          </span>
          <span className="text-[10px] font-mono text-zinc-400">
            5 / 5 active sockets
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SLOT_CONFIGS.map(({ slot, label, icon }) => {
            const item = equipment[slot]
            const rarityStyle = item ? getItemRarityStyles(item.rarity) : null
            return (
              <div
                key={slot}
                onClick={() => item && setSelectedItem(item)}
                className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 text-xs cursor-pointer transition-all relative overflow-hidden group ${
                  item
                    ? 'border-zinc-800 bg-zinc-950/80 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'border-zinc-900 bg-zinc-950/40 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item ? (
                    <div className={cn("relative w-7 h-7 rounded-lg border shrink-0 overflow-hidden bg-zinc-900 p-0.5", rarityStyle?.border)}>
                      <Image src={item.image} alt={item.name} fill className="object-contain" unoptimized />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-500 text-xs shrink-0">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] text-zinc-400 font-mono capitalize block leading-none">
                      {slot}
                    </span>
                    <span className="font-bold text-zinc-200 block text-[11px] truncate leading-tight mt-0.5">
                      {item ? item.name : `Empty`}
                    </span>
                  </div>
                </div>

                {item && (
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-800/80">
                    <span className="text-[9px] font-mono font-bold text-amber-300">
                      {item.stats.atk ? `+${item.stats.atk} atk` : item.stats.def ? `+${item.stats.def} def` : `+${item.stats.spd} spd`}
                    </span>
                    <Badge variant="outline" className={`text-[8px] capitalize px-1 py-0 ${getRarityBadge(item.rarity)}`}>
                      {item.rarity}
                    </Badge>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Item Inspect Dialog with RPG Stat Deltas */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        {selectedItem && (() => {
          const rarityStyle = getItemRarityStyles(selectedItem.rarity);
          return (
            <DialogContent className={cn("max-w-sm bg-zinc-950 border-2 text-white rounded-2xl p-6 shadow-2xl font-serif max-h-[88dvh] overflow-y-auto custom-scrollbar", rarityStyle.modalBorder)}>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className={cn("relative w-16 h-16 rounded-2xl bg-gradient-to-b border-2 p-2 shrink-0 shadow-lg flex items-center justify-center", rarityStyle.thumbnailBg, rarityStyle.border)}>
                    <Image
                      src={selectedItem.image}
                      alt={selectedItem.name}
                      fill
                      className="object-contain p-1 filter drop-shadow-md"
                      unoptimized
                    />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-zinc-100">{selectedItem.name}</DialogTitle>
                    <Badge variant="outline" className={`text-[10px] mt-1 font-semibold capitalize ${rarityStyle.badge}`}>
                      {selectedItem.rarity} • {selectedItem.slot}
                    </Badge>
                  </div>
                </div>
                <DialogDescription className="text-zinc-300 text-xs mt-3 leading-relaxed font-sans">
                  {selectedItem.description}
                </DialogDescription>
              </DialogHeader>

              <div className="my-4 p-3.5 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-2 text-xs font-sans">
                <span className="text-[10px] font-bold text-amber-400 block font-serif tracking-wide">
                  Equipped combat stat deltas
                </span>
                <div className="flex flex-col gap-1.5">
                  {selectedItem.stats.atk !== undefined && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/80 border border-zinc-800">
                      <span className="text-zinc-300 flex items-center gap-1.5">⚔️ Attack</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-red-300 font-bold">+{selectedItem.stats.atk}</span>
                        <Badge className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[9px] px-1.5 py-0 font-normal">
                          +{selectedItem.stats.atk} atk ▲
                        </Badge>
                      </div>
                    </div>
                  )}
                  {selectedItem.stats.def !== undefined && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/80 border border-zinc-800">
                      <span className="text-zinc-300 flex items-center gap-1.5">🛡️ Defense</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-blue-300 font-bold">+{selectedItem.stats.def}</span>
                        <Badge className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[9px] px-1.5 py-0 font-normal">
                          +{selectedItem.stats.def} def ▲
                        </Badge>
                      </div>
                    </div>
                  )}
                  {selectedItem.stats.spd !== undefined && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/80 border border-zinc-800">
                      <span className="text-zinc-300 flex items-center gap-1.5">💨 Speed</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-emerald-300 font-bold">+{selectedItem.stats.spd}</span>
                        <Badge className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[9px] px-1.5 py-0 font-normal">
                          +{selectedItem.stats.spd} spd ▲
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-zinc-900 flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={handleEquipmentChange}
                  className="btn-primary-cta w-full text-xs h-9"
                >
                  <ArrowRightLeft className="w-4 h-4" /> Open bag
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedItem(null)}
                  className="w-full text-xs text-zinc-400 hover:text-white h-8"
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          ); })()}
      </Dialog>
    </div>
  )
}

function EquipmentSlotButton({
  item,
  slotConfig,
  onClick
}: {
  item: EquippedItem | null
  slotConfig?: { slot: string; label: string; icon: React.ReactNode } | undefined
  onClick: () => void
}) {
  const label = slotConfig?.label || 'Slot'
  const icon = slotConfig?.icon || null
  const [isHovered, setIsHovered] = React.useState(false)

  const handleSlotClick = () => {
    if (item) {
      onClick();
    } else {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-inventory-bag', { detail: { tab: 'stored', filter: 'equipment' } }));
      }
    }
  };

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={handleSlotClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl transition-all duration-200 flex flex-col items-center justify-center bg-zinc-950/95 shadow-xl backdrop-blur-md relative overflow-hidden group/btn hover:scale-105 active:scale-95"
        aria-label={item ? `Inspect ${item.name}` : `Empty ${label} slot. Tap to open inventory.`}
      >
        {item ? (
          <div className="absolute inset-0 w-full h-full p-0 overflow-hidden bg-zinc-950 flex items-center justify-center rounded-[14px] transform-gpu translate-z-0">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover w-full h-full filter drop-shadow-md rounded-[14px]"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            {icon}
            <span className="text-[9px] font-bold text-zinc-500 tracking-wide capitalize">{label}</span>
          </div>
        )}

        {/* Actionable Empty-State Hover Tooltip */}
        {isHovered && !item && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap bg-zinc-900 border border-amber-500/40 text-[10px] text-amber-300 font-mono px-2 py-0.5 rounded-md shadow-lg pointer-events-none animate-in fade-in duration-200">
            ⚔️ Empty {label.toLowerCase()} — tap to open bag
          </div>
        )}

        {/* Overlay Border Frame — Sits ON TOP of the image with smooth static glow */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-2xl border-2 z-10 transition-all duration-200",
            item
              ? getItemRarityStyles(item.rarity).border
              : 'border-zinc-800/80 text-zinc-600 opacity-60'
          )}
        />
      </button>

      {/* Interactive Micro-Tooltip Card */}
      {isHovered && item && (() => {
        const rarityStyle = getItemRarityStyles(item.rarity);
        return (
          <div className={cn("absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 rounded-xl bg-zinc-950/95 border shadow-2xl z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150", rarityStyle.modalBorder)}>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className={cn("text-xs font-bold truncate", rarityStyle.text)}>{item.name}</span>
              <span className={cn("text-[9px] font-bold capitalize px-1.5 py-0.5 rounded font-mono", rarityStyle.badge)}>
                {item.rarity}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight mb-2">{item.description}</p>
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-emerald-400 pt-1 border-t border-zinc-800">
              {item.stats.atk && <span>⚔️ +{item.stats.atk} atk</span>}
              {item.stats.def && <span>🛡️ +{item.stats.def} def</span>}
              {item.stats.spd && <span>💨 +{item.stats.spd} spd</span>}
            </div>
          </div>
        );
      })()}
    </div>
  )
}
