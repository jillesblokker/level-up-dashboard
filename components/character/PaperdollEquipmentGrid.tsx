'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Shield, Sword, Shirt, Gem, Sparkles, Info } from 'lucide-react'

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
    description: 'Forged in the blacksmith fire from habit essences.'
  },
  offhand: {
    id: 'shield-oak',
    name: 'Sturdy Oak Aegis',
    slot: 'offhand',
    stats: { def: 18 },
    rarity: 'uncommon',
    image: '/images/items/armor/armor-blanko.webp',
    description: 'Reinforced shield crafted to block dungeon strikes.'
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
  avatarImage = '/images/avatar.webp',
  heroName = 'Sovereign Champion'
}: PaperdollEquipmentGridProps) {
  const [equipment] = useState(DEFAULT_EQUIPMENT)
  const [selectedItem, setSelectedItem] = useState<EquippedItem | null>(null)

  const SLOT_CONFIGS: { slot: 'weapon' | 'offhand' | 'armor' | 'relic'; label: string; icon: React.ReactNode; pos: string }[] = [
    { slot: 'weapon', label: 'Mainhand Weapon', icon: <Sword className="w-4 h-4 text-amber-400" />, pos: 'left-2 top-4 sm:left-4 sm:top-8' },
    { slot: 'offhand', label: 'Offhand Shield', icon: <Shield className="w-4 h-4 text-blue-400" />, pos: 'right-2 top-4 sm:right-4 sm:top-8' },
    { slot: 'armor', label: 'Chest Armor', icon: <Shirt className="w-4 h-4 text-emerald-400" />, pos: 'left-2 bottom-4 sm:left-4 sm:bottom-8' },
    { slot: 'relic', label: 'Astral Relic', icon: <Gem className="w-4 h-4 text-purple-400" />, pos: 'right-2 bottom-4 sm:right-4 sm:bottom-8' }
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
    <Card className="bg-zinc-950 border-amber-900/40 text-white rounded-2xl overflow-hidden shadow-2xl relative">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold text-sm sm:text-base tracking-wide">Hero Equipment Paperdoll</h3>
          </div>
          <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400 bg-amber-950/30">
            2D Gear Slots
          </Badge>
        </div>

        {/* Central Character Paperdoll Stage */}
        <div className="relative w-full max-w-md mx-auto aspect-square rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800/80 flex items-center justify-center p-4 shadow-inner">
          {/* Background Ambient Glow */}
          <div className="absolute inset-0 bg-radial from-amber-500/10 to-transparent blur-xl pointer-events-none" />

          {/* Central Hero Avatar */}
          <div className="relative z-10 w-44 h-44 sm:w-56 sm:h-56 rounded-full border-2 border-amber-500/40 overflow-hidden shadow-2xl bg-zinc-900">
            <Image
              src={avatarImage}
              alt={heroName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* 4 Interactive Equipment Slots around Avatar */}
          {SLOT_CONFIGS.map(({ slot, label, icon, pos }) => {
            const item = equipment[slot]
            return (
              <button
                key={slot}
                type="button"
                onClick={() => item && setSelectedItem(item)}
                className={`absolute ${pos} z-20 w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center bg-zinc-950/90 shadow-xl backdrop-blur-md ${
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
                  icon
                )}
              </button>
            )
          })}
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
