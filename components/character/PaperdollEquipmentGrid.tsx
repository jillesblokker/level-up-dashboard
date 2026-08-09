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
    description: 'Forged in blacksmith fire from habit essences.'
  },
  offhand: {
    id: 'shield-oak',
    name: 'Sturdy Oak Shield',
    slot: 'offhand',
    stats: { def: 18 },
    rarity: 'uncommon',
    image: '/images/items/shield/shield-blockado.webp',
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
  mount: {
    id: 'mount-goldy',
    name: 'Golden Warhorse',
    slot: 'mount',
    stats: { spd: 30, atk: 10 },
    rarity: 'epic',
    image: '/images/items/horse/horse-goldy.webp',
    description: 'Noble armored steed propelling realm travel.'
  },
  relic: {
    id: 'relic-astral',
    name: 'Astral crystal',
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
  heroDescription?: string
  nextTitle?: string
  titleProgress?: number
  onOpenInventory?: () => void
}

export function PaperdollEquipmentGrid({
  avatarImage = '/images/character/count.webp',
  heroName = 'Count',
  heroDescription = 'A powerful noble, ruling over a large county.',
  nextTitle = 'Marquis (Level 50)',
  titleProgress = 42,
  onOpenInventory
}: PaperdollEquipmentGridProps) {
  const [equipment, setEquipment] = useState<Record<'weapon' | 'offhand' | 'armor' | 'mount' | 'relic', EquippedItem | null>>(DEFAULT_EQUIPMENT)
  const [selectedItem, setSelectedItem] = useState<EquippedItem | null>(null)
  const router = useRouter()

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

  const SLOT_CONFIGS: { slot: 'weapon' | 'offhand' | 'armor' | 'mount' | 'relic'; label: string; icon: React.ReactNode }[] = [
    { slot: 'weapon', label: 'Weapon', icon: <Sword className="w-7 h-7 text-amber-400" /> },
    { slot: 'offhand', label: 'Shield', icon: <Shield className="w-7 h-7 text-blue-400" /> },
    { slot: 'armor', label: 'Armor', icon: <Shirt className="w-7 h-7 text-emerald-400" /> },
    { slot: 'mount', label: 'Mount', icon: <span className="text-xl">🐎</span> },
    { slot: 'relic', label: 'Artifact', icon: <Gem className="w-7 h-7 text-purple-400" /> }
  ]

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-amber-500/20 text-amber-300 border-amber-500/50'
      case 'epic': return 'bg-purple-500/20 text-purple-300 border-purple-500/50'
      case 'rare': return 'bg-blue-500/20 text-blue-300 border-blue-500/50'
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-700'
    }
  }

  const handleEquipmentChange = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('open-inventory-bag'))
    }
    if (onOpenInventory) {
      onOpenInventory()
    }
    setSelectedItem(null)
  }

  return (
    <Card className="bg-zinc-950 border border-amber-900/40 text-white rounded-2xl overflow-hidden shadow-2xl">
      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Integrated Title & Progress Header Banner */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/50 via-zinc-900 to-zinc-950 p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-amber-500/50 bg-zinc-900 shrink-0 overflow-hidden shadow-md">
              <Image
                src={avatarImage}
                alt={heroName}
                fill
                className="object-contain p-1"
                unoptimized
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-300">{heroName}</h2>
                <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400 bg-amber-950/40 font-mono">
                  Current Title
                </Badge>
              </div>
              <p className="text-xs text-zinc-300 mt-1 leading-snug">{heroDescription}</p>
            </div>
          </div>

          {/* Title Progress Gauge */}
          <div className="w-full md:w-64 space-y-1.5 shrink-0 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-bold">Next: {nextTitle}</span>
              <span className="text-amber-400 font-mono font-bold">{titleProgress}%</span>
            </div>
            <Progress value={titleProgress} className="h-2 bg-zinc-800" />
          </div>
        </div>

        {/* 2-Column Responsive Layout - Full Height Alignment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: 2D Paperdoll Stage (7 Cols on LG) */}
          <div className="lg:col-span-7 relative bg-gradient-to-b from-zinc-900/80 via-zinc-950 to-zinc-900 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-between shadow-inner overflow-hidden h-full min-h-[440px] flex-1">
            {/* Background Ambient Glow */}
            <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent blur-2xl pointer-events-none" />

            {/* Stage Title Header */}
            <div className="w-full flex items-center justify-between z-10 mb-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Equipment
              </span>
            </div>

            {/* Central Stage Container */}
            <div className="relative w-full max-w-md flex flex-col items-center justify-center my-4 flex-1">
              <div className="relative w-full max-w-sm flex items-center justify-center py-6 px-8">
                {/* Central Character Avatar Frame (Scaled with generous padding) */}
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl border-2 border-amber-500/50 bg-zinc-900/90 p-2 shadow-2xl flex items-center justify-center overflow-hidden group">
                  <Image
                    src={avatarImage}
                    alt={heroName}
                    fill
                    className="object-contain p-2 filter drop-shadow-[0_0_20px_rgba(245,158,11,0.25)] group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                </div>

                {/* 4 Interactive Corner Equipment Slots with Generous Padding */}
                {/* Top-Left: Weapon */}
                <div className="absolute -top-4 -left-4 sm:-left-8 z-20">
                  <EquipmentSlotButton
                    item={equipment.weapon}
                    slotConfig={SLOT_CONFIGS[0]}
                    onClick={() => equipment.weapon && setSelectedItem(equipment.weapon)}
                  />
                </div>

                {/* Top-Right: Shield */}
                <div className="absolute -top-4 -right-4 sm:-right-8 z-20">
                  <EquipmentSlotButton
                    item={equipment.offhand}
                    slotConfig={SLOT_CONFIGS[1]}
                    onClick={() => equipment.offhand && setSelectedItem(equipment.offhand)}
                  />
                </div>

                {/* Bottom-Left: Armor */}
                <div className="absolute -bottom-4 -left-4 sm:-left-8 z-20">
                  <EquipmentSlotButton
                    item={equipment.armor}
                    slotConfig={SLOT_CONFIGS[2]}
                    onClick={() => equipment.armor && setSelectedItem(equipment.armor)}
                  />
                </div>

                {/* Bottom-Right: Mount */}
                <div className="absolute -bottom-4 -right-4 sm:-right-8 z-20">
                  <EquipmentSlotButton
                    item={equipment.mount}
                    slotConfig={SLOT_CONFIGS[3]}
                    onClick={() => equipment.mount && setSelectedItem(equipment.mount)}
                  />
                </div>
              </div>

              {/* Centered Artifact / Relic Slot directly below Avatar */}
              <div className="mt-8 flex flex-col items-center justify-center z-20">
                <EquipmentSlotButton
                  item={equipment.relic}
                  slotConfig={SLOT_CONFIGS[4]}
                  onClick={() => equipment.relic && setSelectedItem(equipment.relic)}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Hero Combat Stats Summary Panel (5 Cols on LG) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" /> Equipped Combat Attributes
                </h4>
                <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-950/30 text-[10px] font-mono">
                  ⚡ Gear Score: {Math.round(gearScore)}
                </Badge>
              </div>

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
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        item
                          ? 'border-zinc-800 bg-zinc-950/80 hover:border-amber-500/40'
                          : 'border-zinc-900 bg-zinc-950/40 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item ? (
                          <div className="relative w-8 h-8 shrink-0">
                            <Image src={item.image} alt={item.name} fill className="object-contain" unoptimized />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 text-xs">
                            Empty
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-zinc-200 block text-xs">{item ? item.name : `Empty ${label}`}</span>
                          <span className="text-[9px] text-zinc-500 uppercase font-mono">{slot}</span>
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

        {/* Visually Enhanced Item Inspect Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          {selectedItem && (
            <DialogContent className="max-w-sm bg-zinc-950 border-2 border-amber-500/40 text-white rounded-2xl p-6 shadow-2xl">
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-amber-500/40 p-2 shrink-0 shadow-lg flex items-center justify-center">
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
                    <Badge variant="outline" className={`text-[10px] mt-1 font-semibold ${getRarityBadge(selectedItem.rarity)}`}>
                      {selectedItem.rarity.toUpperCase()} • {selectedItem.slot.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <DialogDescription className="text-zinc-300 text-xs mt-3 leading-relaxed">
                  {selectedItem.description}
                </DialogDescription>
              </DialogHeader>

              <div className="my-4 p-3.5 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-amber-400 block font-serif">Equipped item combat stat bonus</span>
                {selectedItem.stats.atk && <p className="text-red-300 font-mono font-bold">⚔️ Attack: +{selectedItem.stats.atk}</p>}
                {selectedItem.stats.def && <p className="text-blue-300 font-mono font-bold">🛡️ Defense: +{selectedItem.stats.def}</p>}
                {selectedItem.stats.spd && <p className="text-emerald-300 font-mono font-bold">💨 Speed: +{selectedItem.stats.spd}</p>}
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
      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center bg-zinc-950/95 shadow-2xl backdrop-blur-md ${
        item
          ? 'border-amber-500/70 hover:scale-110 hover:border-amber-400 active:scale-95 ring-4 ring-amber-500/20'
          : 'border-zinc-800 text-zinc-600 opacity-60'
      }`}
      aria-label={`Inspect ${label}`}
    >
      {item ? (
        <div className="relative w-14 h-14 sm:w-16 sm:h-16">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-contain filter drop-shadow-lg"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          {icon}
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">{label}</span>
        </div>
      )}
    </button>
  )
}
