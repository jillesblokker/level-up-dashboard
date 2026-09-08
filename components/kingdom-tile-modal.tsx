"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Coins, Gift, Sparkles, Crown } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface KingdomTileReward {
  tileName: string
  goldEarned: number
  itemFound?: {
    image: string
    name: string
    type: string
  } | undefined
  isLucky: boolean
  message: string
}

interface KingdomTileModalProps {
  isOpen: boolean
  onClose: () => void
  reward: KingdomTileReward | null
  onCollectAll?: () => void
  hasBatchReady?: boolean
}

export function KingdomTileModal({ isOpen, onClose, reward }: KingdomTileModalProps) {
  if (!reward) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-xs sm:max-w-sm w-full border-amber-600/30 overflow-hidden shadow-2xl p-5 bg-zinc-950 flex flex-col rounded-2xl font-serif max-h-[85dvh]",
          reward.isLucky && "bg-gradient-to-b from-amber-950/70 via-zinc-950 to-zinc-950 shadow-amber-500/10"
        )}
        aria-describedby="kingdom-tile-modal-description"
      >
        {/* Background Glow for Lucky */}
        {reward.isLucky && (
          <div className="absolute inset-x-0 top-0 pointer-events-none -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-amber-400/10 rounded-full blur-2xl animate-pulse" />
          </div>
        )}

        <DialogHeader className="text-center pb-2 items-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            {reward.isLucky ? (
              <Crown className="h-5 w-5 text-amber-400 animate-bounce" />
            ) : (
              <Sparkles className="h-5 w-5 text-amber-400" />
            )}
            <DialogTitle className={cn(
              "font-medieval text-xl sm:text-2xl tracking-tight font-bold",
              reward.isLucky ? "text-amber-300" : "text-amber-100"
            )}>
              {reward.isLucky ? 'Fortune smiles upon you' : "The day's harvest"}
            </DialogTitle>
          </div>
          <DialogDescription id="kingdom-tile-modal-description" className="text-zinc-400 text-xs italic">
            {reward.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 my-2">
          {/* Gold Reward Card */}
          <div className={cn(
            "rounded-xl p-3 border transition-all flex items-center justify-between",
            reward.isLucky
              ? "bg-amber-900/30 border-amber-500/40 shadow-xs"
              : "bg-zinc-900/80 border-amber-900/30"
          )}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/10 text-amber-400">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-amber-100 block">Gold earned</span>
                <span className="text-[10px] text-zinc-400">From {reward.tileName}</span>
              </div>
            </div>
            <span className="text-2xl font-black font-mono text-amber-300 tabular-nums">
              +{reward.goldEarned}
            </span>
          </div>

          {/* Item Found Card */}
          {reward.itemFound && (
            <div className="rounded-xl p-3 border bg-zinc-900/80 border-blue-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10 text-blue-400">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-blue-100 block">{reward.itemFound.name}</span>
                  <span className="text-[10px] text-zinc-400 capitalize">{reward.itemFound.type}</span>
                </div>
              </div>
              <div className="relative w-10 h-10 rounded-lg bg-zinc-950 border border-blue-500/30 overflow-hidden flex items-center justify-center shrink-0">
                <Image
                  src={reward.itemFound.image}
                  alt={reward.itemFound.name}
                  fill
                  className="object-contain p-1"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement
                    target.src = '/images/items/placeholder.webp'
                  }}
                />
              </div>
            </div>
          )}

          {/* Lucky Bonus Pill */}
          {reward.isLucky && (
            <div className="rounded-lg p-2 bg-amber-950/40 border border-amber-500/30 text-center flex items-center justify-center gap-1.5 text-xs text-amber-300 font-mono">
              <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span className="font-bold">Lucky windfall bonus active</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            onClick={onClose}
            className="w-full py-5 font-serif text-sm font-bold bg-amber-600 hover:bg-amber-500 text-zinc-950 rounded-xl shadow-lg shadow-amber-950/30 transition-all active:scale-[0.98]"
          >
            Collect & continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
