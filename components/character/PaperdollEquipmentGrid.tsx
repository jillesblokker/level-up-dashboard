'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Shield, Sword, Shirt, Gem, Sparkles, Zap, Award, Flame } from 'lucide-react'

export interface EquippedItem {
  id: string
  name: string
  slot: 'weapon' | 'offhand' | 'armor' | 'relic'
  stats: { atk?: number; def?: number; spd?: number }
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  image: string
  description: string
}

const DEFAULT_EQUIPMENT: Record<'weapon' | 'offhand' | 'armor' | 'relic', EquippedItem | null> = {
  weapon: {
    id: 'sword-irony',
    name: 'Irony Longsword',
    slot: 'weapon',
    stats: { atk: 25, spd: 5 },
    rarity: 'rare',
    image: '/images/items/sword/sword-irony.webp',
    description: 'Forged in blacksmith fire from habit essences.'
  },
  offhand: {
    id: 'shield-oak',
    name: 'Sturdy Oak Aegis',
    slot: 'offhand',
    stats: { def: 18 },
    rarity: 'uncommon',
    image: '/images/items/armor/armor-blanko.webp',
    description: 'Reinforced aegis shield built to block dungeon strikes.'
  },
  armor: {
    id: 'armor-normalo',
    name: 'Vanguard Cuirass',
    slot: 'armor',
    stats: { def: 35, atk: 10 },
    rarity: 'epic',
    image: '/images/items/armor/armor-normalo.webp',
    description: 'Majestic plate armor worn by realm champions.'
  },
  relic: {
    id: 'relic-astral',
    name: 'Astral Crown Crystal',
    slot: 'relic',
    stats: { atk: 15, def: 15, spd: 15 },
    rarity: 'legendary',
    image: '/images/items/materials/material-crystal.webp',
    description: 'Glowing celestial shard yielding virtue energy.'
  }
}

interface PaperdollEquipmentGridProps {
  avatarImage?: string
  heroName?: string
}

export function PaperdollEquipmentGrid({
  avatarImage = '/images/character/count.webp',
  heroName = 'Count'
}: PaperdollEquipmentGridProps) {
  const [equipment] = useState(DEFAULT_EQUIPMENT)
  const [selectedItem, setSelectedItem] = useState<EquippedItem | null>(null)

  // Calculate total stats
  const totalAtk = Object.values(equipment).reduce((acc, item) => acc + (item?.stats.atk || 0), 0)
  const totalDef = Object.values(equipment).reduce((acc, item) => acc + (item?.stats.def || 0), 0)
  const totalSpd = Object.values(equipment).reduce((acc, item) => acc + (item?.stats.spd || 0), 0)
  const gearScore = totalAtk * 2 + totalDef * 1.5 + totalSpd * 3

  const SLOT_CONFIGS: { slot: 'weapon' | 'offhand' | 'armor' | 'relic'; label: string; icon: React.ReactNode }[] = [
    { slot: 'weapon', label: 'Weapon', icon: <Sword className="w-5 h-5 text-amber-400" /> },
    { slot: 'offhand', label: 'Offhand', icon: <Shield className="w-5 h-5 text-blue-400" /> },
    { slot: 'armor', label: 'Chest Armor', icon: <Shirt className="w-5 h-5 text-emerald-400" /> },
    { slot: 'relic', label: 'Relic', icon: <Gem className="w-5 h-5 text-purple-400" /> }
  ]

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-amber-500/20 text-amber-300 border-amber-500/50'
      case 'epic': return 'bg-purple-500/20 text-purple-300 border-purple-500/50'
      case 'rare': return 'bg-blue-500/20 text-blue-300 border-blue-500/50'
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-700'
    }
  }

  return (
    <Card className="bg-zinc-950 border border-amber-900/40 text-white rounded-2xl overflow-hidden shadow-2xl">
      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5 text-amber-400">
            <Sparkles className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-base tracking-wide text-zinc-100">Hero Equipment Vault</h3>
              <p className="text-xs text-zinc-400">Equipped gear combat attributes & 2D paperdoll</p>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-950/30 text-xs px-3 py-1 font-mono">
            ⚡ Power Score: {Math.round(gearScore)}
          </Badge>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: 2D Paperdoll Stage (7 Cols on LG) */}
          <div className="lg:col-span-7 relative bg-gradient-to-b from-zinc-900/80 via-zinc-950 to-zinc-900 border border-zinc-800/90 rounded-2xl p-6 flex flex-col items-center justify-center shadow-inner overflow-hidden min-h-[340px]">
            {/* Background Ambient Glow */}
            <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent blur-2xl pointer-events-none" />

            {/* Stage Title Header */}
            <div className="absolute top-3 left-4 z-10">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> {heroName} Paperdoll
              </span>
            </div>

            {/* Central Stage Container */}
            <div className="relative w-full max-w-sm flex items-center justify-center my-4">
              {/* Central Character Avatar Frame */}
              <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-2xl border-2 border-amber-500/50 bg-zinc-900/90 p-2 shadow-2xl flex items-center justify-center overflow-hidden group">
                <Image
                  src={avatarImage}
                  alt={heroName}
                  fill
                  className="object-contain p-2 filter drop-shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>

              {/* 4 Interactive Equipment Slots around Avatar */}
              {/* Top-Left: Weapon */}
              <div className="absolute -top-2 -left-2 sm:left-2 z-20">
                <EquipmentSlotButton
                  item={equipment.weapon}
                  slotConfig={SLOT_CONFIGS[0]}
                  onClick={() => equipment.weapon && setSelectedItem(equipment.weapon)}
                />
              </div>

              {/* Top-Right: Offhand */}
              <div className="absolute -top-2 -right-2 sm:right-2 z-20">
                <EquipmentSlotButton
                  item={equipment.offhand}
                  slotConfig={SLOT_CONFIGS[1]}
                  onClick={() => equipment.offhand && setSelectedItem(equipment.offhand)}
                />
              </div>

              {/* Bottom-Left: Armor */}
              <div className="absolute -bottom-2 -left-2 sm:left-2 z-20">
                <EquipmentSlotButton
                  item={equipment.armor}
                  slotConfig={SLOT_CONFIGS[2]}
                  onClick={() => equipment.armor && setSelectedItem(equipment.armor)}
                />
              </div>

              {/* Bottom-Right: Relic */}
              <div className="absolute -bottom-2 -right-2 sm:right-2 z-20">
                <EquipmentSlotButton
                  item={equipment.relic}
                  slotConfig={SLOT_CONFIGS[3]}
                  onClick={() => equipment.relic && setSelectedItem(equipment.relic)}
                />
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 mt-2 text-center">
              Click any equipment slot to view combat stats and item details
            </p>
          </div>

          {/* Right Column: Hero Combat Stats Summary Panel (5 Cols on LG) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" /> Equipped Combat Attributes
              </h4>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-red-900/40">
                  <span className="text-[10px] text-zinc-400 block font-semibold">ATTACK</span>
                  <span className="text-sm font-mono font-bold text-red-400">⚔️ +{totalAtk}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-blue-900/40">
                  <span className="text-[10px] text-zinc-400 block font-semibold">DEFENSE</span>
                  <span className="text-sm font-mono font-bold text-blue-400">🛡️ +{totalDef}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-emerald-900/40">
                  <span className="text-[10px] text-zinc-400 block font-semibold">SPEED</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">💨 +{totalSpd}</span>
                </div>
              </div>
            </div>

            {/* Equipped Gear List */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
              <h4 className="text-xs font-bold text-zinc-300">Equipped Gear List</h4>
              <div className="space-y-1.5">
                {SLOT_CONFIGS.map(({ slot, label }) => {
                  const item = equipment[slot]
                  return (
                    <div
                      key={slot}
                      onClick={() => item && setSelectedItem(item)}
                      className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        item
                          ? 'border-zinc-800 bg-zinc-950/80 hover:border-amber-500/40'
                          : 'border-zinc-900 bg-zinc-950/40 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item ? (
                          <div className="relative w-6 h-6 shrink-0">
                            <Image src={item.image} alt={item.name} fill className="object-contain" unoptimized />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800" />
                        )}
                        <div>
                          <span className="font-bold text-zinc-200 block text-[11px]">{item ? item.name : `Empty ${label}`}</span>
                          <span className="text-[9px] text-zinc-500 uppercase">{slot}</span>
                        </div>
                      </div>

                      {item && (
                        <Badge variant="outline" className={`text-[9px] ${getRarityBadge(item.rarity)}`}>
                          {item.rarity.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Inspect Item Popover Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          {selectedItem && (
            <DialogContent className="max-w-xs bg-zinc-950 border border-amber-900/50 text-white rounded-2xl p-5 shadow-2xl">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 p-1 shrink-0">
                    <Image
                      src={selectedItem.image}
                      alt={selectedItem.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <div>
                    <DialogTitle className="text-sm font-bold text-zinc-100">{selectedItem.name}</DialogTitle>
                    <Badge variant="outline" className={`text-[9px] mt-1 ${getRarityBadge(selectedItem.rarity)}`}>
                      {selectedItem.rarity.toUpperCase()} {selectedItem.slot.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <DialogDescription className="text-zinc-400 text-xs mt-3 leading-relaxed">
                  {selectedItem.description}
                </DialogDescription>
              </DialogHeader>

              <div className="my-3 p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-1 text-xs">
                <span className="text-[10px] font-bold text-amber-400 block uppercase tracking-wider">Combat Stat Bonus</span>
                {selectedItem.stats.atk && <p className="text-red-300 font-mono">⚔️ Attack: +{selectedItem.stats.atk}</p>}
                {selectedItem.stats.def && <p className="text-blue-300 font-mono">🛡️ Defense: +{selectedItem.stats.def}</p>}
                {selectedItem.stats.spd && <p className="text-emerald-300 font-mono">💨 Speed: +{selectedItem.stats.spd}</p>}
              </div>
            </DialogContent>
          )}
        </Dialog>
      </CardContent>
    </Card>
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center bg-zinc-950/95 shadow-xl backdrop-blur-md ${
        item
          ? 'border-amber-500/60 hover:scale-110 hover:border-amber-400 active:scale-95'
          : 'border-zinc-800 text-zinc-600 opacity-60'
      }`}
      aria-label={`Inspect ${label}`}
    >
      {item ? (
        <div className="relative w-10 h-10 sm:w-12 sm:h-12">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-contain filter drop-shadow-md"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0.5">
          {icon}
          <span className="text-[8px] font-bold text-zinc-500 uppercase">{label}</span>
        </div>
      )}
    </button>
  )
}
