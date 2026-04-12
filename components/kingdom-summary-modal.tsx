"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Coins, Gift, Sparkles, Trophy, Star, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SummaryReward {
  tileName: string
  goldEarned: number
  experienceEarned: number
  itemFound?: {
    image: string
    name: string
    type: string
  }
  isLucky: boolean
}

interface KingdomSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  rewards: SummaryReward[]
}

export function KingdomSummaryModal({ isOpen, onClose, rewards }: KingdomSummaryModalProps) {
  const totalGold = rewards.reduce((sum, r) => sum + r.goldEarned, 0)
  const totalExp = rewards.reduce((sum, r) => sum + r.experienceEarned, 0)
  const itemsFound = rewards.filter(r => r.itemFound).map(r => r.itemFound!)
  const luckyCount = rewards.filter(r => r.isLucky).length

  if (rewards.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-amber-600/20 bg-zinc-950 p-0 overflow-hidden shadow-2xl flex flex-col h-[80vh]">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />
        
        <DialogHeader className="p-6 pb-2 text-center items-center">
            <div className="flex items-center justify-center gap-3 mb-2">
                <Trophy className="h-6 w-6 text-amber-500 animate-pulse" />
                <DialogTitle className="font-serif text-2xl text-amber-100 tracking-tight">
                    Kingdom Harvest Report
                </DialogTitle>
                <Trophy className="h-6 w-6 text-amber-500 animate-pulse" />
            </div>
          <DialogDescription className="text-zinc-400 text-sm italic">
            Your subjects have gathered resources from across the realm.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
            {/* Totals Banner */}
            <div className="px-6 py-4 grid grid-cols-2 gap-4">
                <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-3 flex flex-col items-center">
                    <div className="flex items-center gap-2 text-amber-400 mb-1">
                        <Coins className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Total Gold</span>
                    </div>
                    <span className="text-2xl font-bold font-serif text-amber-200">+{totalGold}</span>
                </div>
                <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-3 flex flex-col items-center">
                    <div className="flex items-center gap-2 text-blue-400 mb-1">
                        <Star className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Total XP</span>
                    </div>
                    <span className="text-2xl font-bold font-serif text-blue-200">+{totalExp}</span>
                </div>
            </div>

            <ScrollArea className="flex-1 px-6">
                <div className="space-y-3 pb-6">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Detailed Breakdown</h3>
                    {rewards.map((reward, idx) => (
                        <div key={idx} className={cn(
                            "group relative rounded-lg p-3 border transition-all hover:bg-zinc-900/50",
                            reward.isLucky ? "bg-amber-900/10 border-amber-500/30" : "bg-zinc-900/30 border-zinc-800"
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-8 h-8 rounded bg-zinc-800 flex items-center justify-center">
                                       <Sparkles className={cn("h-4 w-4", reward.isLucky ? "text-amber-400" : "text-zinc-600")} />
                                       {reward.isLucky && (
                                           <div className="absolute -top-1 -right-1">
                                               <div className="h-2 w-2 bg-amber-500 rounded-full animate-ping" />
                                           </div>
                                       )}
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-zinc-100 block">{reward.tileName}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-amber-400 font-mono">+{reward.goldEarned}g</span>
                                            <span className="text-[10px] text-blue-400 font-mono">+{reward.experienceEarned}xp</span>
                                        </div>
                                    </div>
                                </div>
                                {reward.itemFound && (
                                    <div className="flex items-center gap-2">
                                        <div className="text-[10px] text-zinc-500 italic max-w-[60px] truncate">{reward.itemFound.name}</div>
                                        <div className="w-10 h-10 relative rounded bg-blue-500/10 border border-blue-500/20 overflow-hidden">
                                            <Image 
                                                src={reward.itemFound.image} 
                                                alt={reward.itemFound.name} 
                                                fill 
                                                className="object-contain p-1"
                                                unoptimized
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>

        <div className="p-6 bg-zinc-900/50 border-t border-white/5">
            <Button 
                onClick={onClose}
                className="w-full py-6 font-serif text-lg bg-amber-600 hover:bg-amber-500 text-white shadow-xl shadow-amber-900/20"
            >
                Excellent!
            </Button>
            {luckyCount > 0 && (
                <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-amber-400/60 uppercase tracking-widest font-bold">
                    <Sparkles className="h-3 w-3" />
                    Includes {luckyCount} Lucky Bonuses
                    <Sparkles className="h-3 w-3" />
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
