'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { Shield, Sword, Shirt, Gem, Plus, Trash2, Sparkles, ArrowRightLeft } from 'lucide-react'
import { Citizen, useCitizensStore, getCitizenImageSrc } from '@/stores/citizensStore'
import { getItemRarityStyles } from '@/components/character/PaperdollEquipmentGrid'
import { getItemSlot } from '@/lib/hero-equipment'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { cn } from '@/lib/utils'

interface CitizenEquipmentModalProps {
  citizen: Citizen | null
  open: boolean
  onClose: () => void
  userId?: string | undefined
}

const SLOT_CONFIGS: { slot: 'weapon' | 'offhand' | 'armor' | 'relic'; label: string; icon: React.ReactNode }[] = [
  { slot: 'weapon', label: 'Weapon', icon: <Sword className="w-5 h-5 text-amber-400" /> },
  { slot: 'offhand', label: 'Offhand / Shield', icon: <Shield className="w-5 h-5 text-blue-400" /> },
  { slot: 'armor', label: 'Armor', icon: <Shirt className="w-5 h-5 text-emerald-400" /> },
  { slot: 'relic', label: 'Relic / Artifact', icon: <Gem className="w-5 h-5 text-purple-400" /> }
]

export function CitizenEquipmentModal({ citizen, open, onClose, userId }: CitizenEquipmentModalProps) {
  const equipCitizen = useCitizensStore(state => state.equipCitizen)
  const unequipCitizen = useCitizensStore(state => state.unequipCitizen)
  const getCitizenEffectiveStats = useCitizensStore(state => state.getCitizenEffectiveStats)

  const [activeSlotToEquip, setActiveSlotToEquip] = useState<'weapon' | 'offhand' | 'armor' | 'relic' | null>(null)
  const [availableInventory, setAvailableInventory] = useState<any[]>([])
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)

  // Fetch unequipped inventory items when equipping
  useEffect(() => {
    if (open) {
      setIsLoadingInventory(true)
      fetchWithAuth('/api/inventory')
        .then(res => res.json())
        .then(res => {
          const list = res?.data || res || []
          setAvailableInventory(Array.isArray(list) ? list : [])
        })
        .catch(() => setAvailableInventory([]))
        .finally(() => setIsLoadingInventory(false))
    }
  }, [open])

  if (!citizen) return null

  const stats = getCitizenEffectiveStats(citizen)
  const equipment: Record<string, any> = citizen.equipment || {}

  // Filter inventory items matching the selected slot
  const matchingInventoryItems = availableInventory.filter(item => {
    const slot = getItemSlot(item)
    return slot === activeSlotToEquip
  })

  const handleEquipItem = async (item: any) => {
    if (!userId || !activeSlotToEquip) return
    const formattedItem = {
      id: item.id,
      name: item.name,
      image: item.image,
      rarity: item.rarity || 'common',
      description: item.description || '',
      stats: item.stats || {}
    }

    await equipCitizen(userId, citizen.id, activeSlotToEquip, formattedItem)
    toast({
      title: "Gear equipped! ⚔️",
      description: `Equipped ${item.name} on ${citizen.name}.`
    })
    setActiveSlotToEquip(null)
  }

  const handleUnequipItem = async (slot: 'weapon' | 'offhand' | 'armor' | 'relic') => {
    if (!userId) return
    const currentItem = equipment[slot]
    await unequipCitizen(userId, citizen.id, slot)
    toast({
      title: "Gear unequipped",
      description: `Removed ${currentItem?.name || 'item'} from ${citizen.name}.`
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-zinc-950 border border-amber-500/30 text-white rounded-2xl p-6 shadow-2xl font-serif max-h-[90dvh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-2xl bg-zinc-900 border border-amber-500/40 p-1 shrink-0 overflow-hidden">
              <Image
                src={getCitizenImageSrc(citizen)}
                alt={citizen.name}
                fill
                className="object-contain p-0.5"
                unoptimized
              />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-amber-300 flex items-center gap-2">
                {citizen.name}
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/40 font-mono">
                  Lv. {citizen.level}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs mt-0.5 font-sans flex items-center gap-2">
                <span>Class: {citizen.specialization || 'Adventurer'}</span>
                <span>•</span>
                <span className="text-amber-400 font-bold font-mono">Gear score: {stats.gearScore}</span>
              </DialogDescription>
            </div>
          </div>

          {/* Citizen Live Combat Stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 font-mono text-center">
            <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">⚔️ Attack</span>
              <span className="text-sm font-bold text-red-400">{stats.atk}</span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">🛡️ Defense</span>
              <span className="text-sm font-bold text-blue-400">{stats.def}</span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block">💨 Speed</span>
              <span className="text-sm font-bold text-emerald-400">{stats.spd}</span>
            </div>
          </div>
        </DialogHeader>

        {/* Slot Selection or Equipment List */}
        {activeSlotToEquip ? (
          <div className="mt-4 space-y-3 font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-amber-300 font-serif">
                Select {activeSlotToEquip} to equip:
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActiveSlotToEquip(null)}
                className="text-xs text-zinc-400 hover:text-white h-7 px-2"
              >
                Back to loadout
              </Button>
            </div>

            {isLoadingInventory ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono animate-pulse">
                Opening kingdom armory...
              </div>
            ) : matchingInventoryItems.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-zinc-400">No matching {activeSlotToEquip} items in your bag.</p>
                <p className="text-[11px] text-zinc-500">Collect taxes or explore dungeons to acquire gear!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {matchingInventoryItems.map((item) => {
                  const rarityStyle = getItemRarityStyles(item.rarity || 'common')
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-3 hover:border-amber-500/50 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn("relative w-10 h-10 rounded-lg bg-zinc-950 border shrink-0 overflow-hidden p-0.5", rarityStyle.border)}>
                          <Image src={item.image} alt={item.name} fill className="object-contain" unoptimized />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 mt-0.5">
                            {item.stats?.attack && <span className="text-red-400">+{item.stats.attack} atk</span>}
                            {item.stats?.defense && <span className="text-blue-400">+{item.stats.defense} def</span>}
                            {item.stats?.movement && <span className="text-emerald-400">+{item.stats.movement} spd</span>}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleEquipItem(item)}
                        className="btn-rpg-emerald text-[11px] h-8 px-3 font-serif font-bold shrink-0"
                      >
                        Equip
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3 font-sans">
            <span className="text-xs font-serif font-bold text-amber-300 block">
              Citizen loadout sockets
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SLOT_CONFIGS.map(({ slot, label, icon }) => {
                const item = equipment[slot]
                const rarityStyle = item ? getItemRarityStyles(item.rarity) : null
                return (
                  <div
                    key={slot}
                    className={cn(
                      "p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all",
                      item
                        ? "bg-zinc-900/90 border-zinc-800"
                        : "bg-zinc-950/60 border-zinc-900 border-dashed"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        {icon} {label}
                      </span>
                      {item && (
                        <Badge variant="outline" className={cn("text-[8px] capitalize px-1 py-0", rarityStyle?.badge)}>
                          {item.rarity}
                        </Badge>
                      )}
                    </div>

                    {item ? (
                      <div className="flex items-center gap-2.5">
                        <div className={cn("relative w-10 h-10 rounded-lg bg-zinc-950 border shrink-0 overflow-hidden p-0.5", rarityStyle?.border)}>
                          <Image src={item.image} alt={item.name} fill className="object-contain" unoptimized />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-white block truncate">{item.name}</span>
                          <span className="text-[10px] font-mono text-amber-300 block mt-0.5">
                            {item.stats?.atk ? `+${item.stats.atk} atk ` : ''}
                            {item.stats?.def ? `+${item.stats.def} def ` : ''}
                            {item.stats?.spd ? `+${item.stats.spd} spd` : ''}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-center text-xs text-zinc-500 font-mono">
                        Empty socket
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/80">
                      {item ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActiveSlotToEquip(slot)}
                            className="flex-1 h-7 text-[11px] text-zinc-300 hover:text-white"
                          >
                            <ArrowRightLeft className="w-3 h-3 mr-1" /> Swap
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUnequipItem(slot)}
                            className="h-7 px-2 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setActiveSlotToEquip(slot)}
                          className="w-full h-7 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-serif"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Equip gear
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
