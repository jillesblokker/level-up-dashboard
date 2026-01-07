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
}

export function KingdomTileModal({ isOpen, onClose, reward }: KingdomTileModalProps) {
  if (!reward) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-sm border-amber-600/20 overflow-hidden shadow-2xl p-0 bg-zinc-950",
          reward.isLucky && "bg-gradient-to-b from-amber-950/80 via-zinc-950 to-zinc-950 shadow-amber-500/20"
        )}
        aria-describedby="kingdom-tile-modal-description"
      >
        {/* Background Glow for Lucky */}
        {reward.isLucky && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl animate-pulse" />
          </div>
        )}

        <div className="p-6">
          <DialogHeader className="relative z-10 text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              {reward.isLucky ? (
                <Crown className="h-6 w-6 text-amber-400 animate-bounce" />
              ) : (
                <Sparkles className="h-5 w-5 text-amber-500/70" />
              )}
              <DialogTitle className={cn(
                "font-serif text-2xl tracking-tight",
                reward.isLucky ? "text-amber-300" : "text-zinc-100"
              )}>
                {reward.isLucky ? 'Fortune Smiles Upon You!' : "The Day's Harvest"}
              </DialogTitle>
              {reward.isLucky && (
                <Crown className="h-6 w-6 text-amber-400 animate-bounce" />
              )}
            </div>
            <DialogDescription id="kingdom-tile-modal-description" className="text-zinc-400 text-sm italic font-light leading-relaxed">
              {reward.message}
            </DialogDescription>
          </DialogHeader>

          <div className="relative z-10 space-y-4">
            {/* Gold Reward Card */}
            <div className={cn(
              "relative rounded-xl p-4 border transition-all duration-300",
              reward.isLucky
                ? "bg-gradient-to-r from-amber-900/40 to-amber-800/20 border-amber-500/50 shadow-lg shadow-amber-500/10"
                : "bg-zinc-900/50 border-amber-700/20"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2.5 rounded-full shadow-inner",
                    reward.isLucky ? "bg-amber-400/20" : "bg-amber-500/10"
                  )}>
                    <Coins className={cn(
                      "h-6 w-6",
                      reward.isLucky ? "text-amber-300" : "text-amber-400"
                    )} />
                  </div>
                  <div>
                    <span className="font-medium text-amber-100 block">Gold Earned</span>
                    <span className="text-xs text-amber-300/40">From {reward.tileName}</span>
                  </div>
                </div>
                <div className={cn(
                  "text-3xl font-bold font-serif tabular-nums",
                  reward.isLucky ? "text-amber-300" : "text-amber-400"
                )}>
                  +{reward.goldEarned}
                </div>
              </div>
            </div>

            {/* Item Found Card */}
            {reward.itemFound && (
              <div className="relative rounded-xl p-4 border bg-gradient-to-r from-blue-900/20 to-indigo-900/10 border-blue-500/20 shadow-lg shadow-blue-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-full bg-blue-500/10 shadow-inner">
                      <Gift className="h-6 w-6 text-blue-300" />
                    </div>
                    <div>
                      <span className="font-medium text-blue-100 block">Treasure Found</span>
                      <span className="text-xs text-blue-300/40 capitalize">{reward.itemFound.type}</span>
                    </div>
                  </div>

                  {/* Improved Image Container */}
                  <div className="relative w-16 h-16 rounded-lg bg-zinc-900 border border-blue-500/30 overflow-hidden shadow-inner group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                    <Image
                      src={reward.itemFound.image}
                      alt={reward.itemFound.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = '/images/placeholders/item-placeholder.svg'
                      }}
                    />
                    <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-lg" />
                  </div>
                </div>
              </div>
            )}

            {/* Lucky Bonus Banner */}
            {reward.isLucky && (
              <div className="relative rounded-xl p-4 bg-gradient-to-r from-emerald-900/30 to-teal-900/10 border border-emerald-500/20 text-center overflow-hidden">
                <div className="absolute top-0 right-0 p-1 opacity-20">
                  <Sparkles className="h-8 w-8 text-emerald-300" />
                </div>
                <div className="flex items-center justify-center gap-2 relative z-10">
                  <Sparkles className="h-4 w-4 text-emerald-300 animate-pulse" />
                  <span className="text-sm font-semibold text-emerald-100 tracking-wide uppercase">Luck Bonus Active!</span>
                  <Sparkles className="h-4 w-4 text-emerald-300 animate-pulse" />
                </div>
                <p className="text-xs text-emerald-300/60 mt-1 font-light italic">
                  The spirits have blessed your harvest today
                </p>
              </div>
            )}

            {/* Continue Button */}
            <Button
              onClick={onClose}
              className={cn(
                "w-full py-6 font-serif text-lg tracking-wide transition-all duration-300 rounded-xl",
                reward.isLucky
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/30 border-t border-white/10"
                  : "bg-amber-700/90 hover:bg-amber-600 text-amber-50 border-t border-white/5 shadow-xl shadow-black/40"
              )}
            >
              Collect & Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
