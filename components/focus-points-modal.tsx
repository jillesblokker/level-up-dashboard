"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Zap, Sparkles, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { addToCharacterStat } from "@/lib/character-stats-service"

interface FocusPointsModalProps {
  isOpen: boolean
  onClose: () => void
  currentFocusPoints: number
  onStatsUpdate: () => void
}

export function FocusPointsModal({
  isOpen,
  onClose,
  currentFocusPoints,
  onStatsUpdate
}: FocusPointsModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSpendPoints = async (cost: number, actionType: 'xp_boost' | 'rush_timers' | 'astral_reward') => {
    if (currentFocusPoints < cost) {
      toast({
        title: "Insufficient focus points",
        description: `You need ${cost} focus points to unlock this power. Complete daily habits to earn more.`,
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)

    try {
      if (actionType === 'xp_boost') {
        const expiry = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        const stored = localStorage.getItem('active-potion-perks')
        const perks = stored ? JSON.parse(stored) : {}
        perks['Deep Focus Stance'] = {
          effect: '+20% XP boost on habit completion',
          expiresAt: expiry
        }
        localStorage.setItem('active-potion-perks', JSON.stringify(perks))
        await addToCharacterStat('focus_points', -cost, 'focus-spend-xp-boost')

        toast({
          title: "Deep focus stance activated",
          description: "Gained +20% experience boost on all habit completions for 2 hours.",
        })
      } else if (actionType === 'rush_timers') {
        const res = await fetch('/api/property-timers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'rush', minutes: 15 })
        })

        if (res.ok) {
          await addToCharacterStat('focus_points', -cost, 'focus-spend-rush-timers')
          window.dispatchEvent(new CustomEvent('property-timers-update'))

          toast({
            title: "Time accelerated",
            description: "Advanced all active kingdom property timers by 15 minutes.",
          })
        } else {
          throw new Error('Failed to accelerate timers')
        }
      } else if (actionType === 'astral_reward') {
        await addToCharacterStat('gold', 500, 'focus-spend-astral-gold')
        await addToCharacterStat('focus_points', -cost, 'focus-spend-astral')
        await addToCharacterStat('build_tokens', 1, 'focus-spend-astral-token')

        toast({
          title: "Astral insight unlocked",
          description: "Received +500 gold and 1 build token.",
        })
      }

      onStatsUpdate()
      onClose()
    } catch (err) {
      toast({
        title: "Action failed",
        description: err instanceof Error ? err.message : "Could not spend focus points.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-950 border border-purple-900/40 text-white max-w-sm sm:max-w-xl shadow-2xl p-5 rounded-2xl font-serif max-h-[85dvh] flex flex-col overflow-y-auto">
        <DialogHeader className="text-center flex flex-col items-center pb-2">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-1.5 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Brain className="w-5 h-5" />
          </div>
          <DialogTitle className="font-medieval text-xl sm:text-2xl text-amber-200 tracking-tight font-bold">
            Focus point powers
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs mt-0.5">
            Earned from daily habits and meditation. Spend to accelerate kingdom growth.
          </DialogDescription>
        </DialogHeader>

        {/* Current Balance Bar */}
        <div className="bg-gradient-to-r from-purple-950/50 via-zinc-900 to-amber-950/50 p-3 rounded-xl border border-purple-500/30 flex items-center justify-between my-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🧠</span>
            <div>
              <p className="text-[10px] text-purple-300 font-mono font-bold uppercase tracking-wider">Focus balance</p>
              <p className="text-base font-black text-white font-mono leading-none mt-0.5">
                {currentFocusPoints} <span className="text-xs text-purple-300/80 font-normal">points</span>
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] border-purple-500/40 text-purple-300 font-mono">
            +1 per habit completed
          </Badge>
        </div>

        {/* 3-Column Power Cards Deck */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          {/* Power 1: Deep Focus Stance */}
          <button
            onClick={() => handleSpendPoints(5, 'xp_boost')}
            disabled={currentFocusPoints < 5 || isProcessing}
            className="p-3.5 rounded-xl bg-zinc-900/90 hover:bg-purple-950/30 border border-white/10 hover:border-purple-500/40 text-left flex flex-col justify-between gap-3 transition-all shadow-xs group active:scale-[0.98] disabled:opacity-40"
          >
            <div className="flex items-center justify-between w-full">
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950 border border-purple-400/30 px-1.5 py-0.5 rounded">
                5 FP
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-100 group-hover:text-amber-200">Deep focus stance</h4>
              <p className="text-[10px] text-zinc-400 mt-1 leading-snug">+20% exp bonus on all habits for 2 hours.</p>
            </div>
            <div className="w-full py-1.5 rounded-lg bg-purple-950/80 group-hover:bg-purple-900 text-purple-200 text-center text-[10px] font-mono font-bold border border-purple-500/30 transition-colors">
              Activate power
            </div>
          </button>

          {/* Power 2: Rush Property Timers */}
          <button
            onClick={() => handleSpendPoints(10, 'rush_timers')}
            disabled={currentFocusPoints < 10 || isProcessing}
            className="p-3.5 rounded-xl bg-zinc-900/90 hover:bg-blue-950/30 border border-white/10 hover:border-blue-500/40 text-left flex flex-col justify-between gap-3 transition-all shadow-xs group active:scale-[0.98] disabled:opacity-40"
          >
            <div className="flex items-center justify-between w-full">
              <Zap className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-950 border border-blue-400/30 px-1.5 py-0.5 rounded">
                10 FP
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-100 group-hover:text-blue-200">Rush property timers</h4>
              <p className="text-[10px] text-zinc-400 mt-1 leading-snug">Accelerates active kingdom timers by 15 min.</p>
            </div>
            <div className="w-full py-1.5 rounded-lg bg-blue-950/80 group-hover:bg-blue-900 text-blue-200 text-center text-[10px] font-mono font-bold border border-blue-500/30 transition-colors">
              Activate power
            </div>
          </button>

          {/* Power 3: Astral Insight */}
          <button
            onClick={() => handleSpendPoints(15, 'astral_reward')}
            disabled={currentFocusPoints < 15 || isProcessing}
            className="p-3.5 rounded-xl bg-zinc-900/90 hover:bg-amber-950/30 border border-white/10 hover:border-amber-500/40 text-left flex flex-col justify-between gap-3 transition-all shadow-xs group active:scale-[0.98] disabled:opacity-40"
          >
            <div className="flex items-center justify-between w-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950 border border-amber-400/30 px-1.5 py-0.5 rounded">
                15 FP
              </span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-100 group-hover:text-amber-200">Astral insight</h4>
              <p className="text-[10px] text-zinc-400 mt-1 leading-snug">Instantly grants +500 gold and 1 build token.</p>
            </div>
            <div className="w-full py-1.5 rounded-lg bg-amber-950/80 group-hover:bg-amber-900 text-amber-200 text-center text-[10px] font-mono font-bold border border-amber-500/30 transition-colors">
              Activate power
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
