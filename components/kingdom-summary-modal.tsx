"use client"

import { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Coins, Sparkles, Star } from 'lucide-react'
import Image from 'next/image'

export interface SummaryReward {
  tileName: string
  goldEarned: number
  experienceEarned: number
  itemFound?: {
    image: string
    name: string
    type?: string
  }
  isLucky: boolean
}

export interface KingdomSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  rewards: SummaryReward[]
  title?: string
  description?: string
}

interface AggregatedItem {
  id: string
  name: string
  image: string
  count: number
}

export function KingdomSummaryModal({
  isOpen,
  onClose,
  rewards,
  title = "Royal treasury tax receipt",
  description
}: KingdomSummaryModalProps) {
  const totalGold = useMemo(() => rewards.reduce((sum, r) => sum + (r.goldEarned || 0), 0), [rewards])
  const totalExp = useMemo(() => rewards.reduce((sum, r) => sum + (r.experienceEarned || 0), 0), [rewards])
  const luckyCount = useMemo(() => rewards.filter(r => r.isLucky).length, [rewards])

  // Aggregate items into unique slots with quantity counters
  const aggregatedItems = useMemo<AggregatedItem[]>(() => {
    const map = new Map<string, AggregatedItem>()
    rewards.forEach(r => {
      if (!r.itemFound?.name && !r.itemFound?.image) return
      const key = r.itemFound.name || r.itemFound.image
      const existing = map.get(key)
      if (existing) {
        existing.count += 1
      } else {
        map.set(key, {
          id: key,
          name: r.itemFound.name || 'Harvested material',
          image: r.itemFound.image || '/images/items/placeholder.webp',
          count: 1
        })
      }
    })
    return Array.from(map.values())
  }, [rewards])

  if (rewards.length === 0) return null

  // Ensure title adheres to strict sentence case and strips emojis
  const cleanTitle = (title || "Royal treasury tax receipt")
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z]/, (c) => c.toUpperCase())

  const totalItemCount = aggregatedItems.reduce((sum, item) => sum + item.count, 0)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm sm:max-w-md w-full bg-zinc-950 border border-amber-900/40 text-white rounded-2xl p-0 overflow-hidden shadow-2xl font-serif max-h-[85dvh] flex flex-col">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <DialogHeader className="pt-5 pb-2 px-8 sm:px-10 text-center flex flex-col items-center relative z-10">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Coins className="w-5 h-5" />
          </div>
          <DialogTitle className="font-serif text-xl sm:text-2xl text-amber-100 tracking-tight font-bold break-words">
            {cleanTitle}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs mt-1 italic">
            {description || `Harvested taxes and goods from ${rewards.length} realm ${rewards.length === 1 ? 'property' : 'properties'}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-y-auto px-5 py-2 space-y-3 relative z-10">
          {/* Totals Banner */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-gradient-to-br from-amber-950/40 to-zinc-900 border border-amber-500/30 rounded-xl p-3 flex flex-col items-center shadow-xs">
              <div className="flex items-center gap-1.5 text-amber-400 mb-0.5">
                <Coins className="h-4 w-4" />
                <span className="text-[11px] font-mono font-bold text-amber-400/90">Total gold</span>
              </div>
              <span className="text-2xl font-black font-mono text-amber-200">+{totalGold.toLocaleString()}</span>
            </div>
            <div className="bg-gradient-to-br from-blue-950/40 to-zinc-900 border border-blue-500/30 rounded-xl p-3 flex flex-col items-center shadow-xs">
              <div className="flex items-center gap-1.5 text-blue-400 mb-0.5">
                <Star className="h-4 w-4" />
                <span className="text-[11px] font-mono font-bold text-blue-400/90">Total exp</span>
              </div>
              <span className="text-2xl font-black font-mono text-blue-200">+{totalExp.toLocaleString()}</span>
            </div>
          </div>

          {/* Citizen Loyalty Multiplier Pill */}
          <div className="bg-amber-950/30 border border-amber-500/20 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs font-mono">
            <span className="text-amber-300/90 font-medium flex items-center gap-1.5">
              👑 Citizen loyalty bonus:
            </span>
            <span className="text-emerald-400 font-bold">+15% tax multiplier</span>
          </div>

          {/* Items Discovered Grid (Loot Cache) */}
          {aggregatedItems.length > 0 ? (
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-amber-400/90">
                  Discovered goods ({totalItemCount})
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  Stored in inventory
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {aggregatedItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative aspect-square rounded-xl bg-zinc-900/90 border border-amber-900/40 p-1.5 flex flex-col items-center justify-center group hover:border-amber-500/60 transition-all shadow-inner"
                    title={`${item.name} (x${item.count})`}
                  >
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain p-1 drop-shadow-md group-hover:scale-110 transition-transform"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement
                          target.src = '/images/items/placeholder.webp'
                        }}
                      />
                    </div>
                    {/* Item count badge in corner */}
                    <div className="absolute bottom-1 right-1 bg-amber-500 text-zinc-950 text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md shadow leading-none">
                      ×{item.count}
                    </div>
                    {/* Hover tooltip label */}
                    <div className="absolute -top-7 bg-zinc-950 border border-amber-500/40 text-amber-200 text-[10px] px-2 py-0.5 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap">
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-2 text-center">
              <p className="text-xs text-zinc-500 italic">
                All coins and taxes securely deposited in your royal treasury.
              </p>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 bg-zinc-900/80 border-t border-amber-900/20 flex flex-col gap-2 relative z-10">
          <Button
            onClick={onClose}
            className="w-full py-5 font-serif text-base bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded-xl shadow-lg shadow-amber-950/30 transition-all active:scale-[0.98]"
          >
            Collect & return
          </Button>
          {luckyCount > 0 && (
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-amber-400/80 font-medium">
              <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
              <span>Includes {luckyCount} lucky windfall {luckyCount === 1 ? 'bonus' : 'bonuses'}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
