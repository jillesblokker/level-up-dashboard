"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Zap, Sparkles, CheckCircle2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { addToCharacterStat, updateCharacterStats } from "@/lib/character-stats-service"

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
        title: "Insufficient Focus Points 🧠",
        description: `You need ${cost} Focus Points to unlock this power. Complete daily habits to earn more!`,
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
          title: "🧠 Deep Focus Stance Activated!",
          description: "Gained +20% Experience boost on all habit completions for 2 hours!"
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
            title: "⚡ Time Accelerated!",
            description: "Advanced all active kingdom property timers by 15 minutes!"
          })
        } else {
          throw new Error('Failed to accelerate timers')
        }
      } else if (actionType === 'astral_reward') {
        await addToCharacterStat('gold', 500, 'focus-spend-astral-gold')
        await addToCharacterStat('focus_points', -cost, 'focus-spend-astral')
        await addToCharacterStat('build_tokens', 1, 'focus-spend-astral-token')

        toast({
          title: "🔮 Astral Insight Unlocked!",
          description: "Received +500 Gold and 1 Build Token!"
        })
      }

      onStatsUpdate()
      onClose()
    } catch (err) {
      toast({
        title: "Action Failed",
        description: err instanceof Error ? err.message : "Could not spend Focus Points.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-950 border-amber-800/40 text-white max-w-lg shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-amber-400 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
            Focus Point Powers
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            Earn Focus Points by completing daily habits & meditation sessions. Spend them to accelerate kingdom growth!
          </DialogDescription>
        </DialogHeader>

        {/* Current Balance Bar */}
        <div className="bg-gradient-to-r from-purple-950/60 via-zinc-900 to-amber-950/60 p-3.5 rounded-xl border border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <div>
              <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Your Focus Balance</p>
              <p className="text-lg font-black text-white font-mono">{currentFocusPoints} <span className="text-xs text-purple-300 font-normal">Points</span></p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-purple-500/40 text-purple-300 font-bold">
            +1 per Habit Completed
          </Badge>
        </div>

        {/* Powers Menu */}
        <div className="space-y-3 pt-2">
          
          {/* Power 1: Deep Focus Stance */}
          <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-white/10 hover:border-purple-500/40 transition-all flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Deep Focus Stance
              </h4>
              <p className="text-[11px] text-zinc-400">Activates +20% XP bonus on all habits for 2 hours.</p>
            </div>
            <Button
              onClick={() => handleSpendPoints(5, 'xp_boost')}
              disabled={currentFocusPoints < 5 || isProcessing}
              className="bg-purple-900 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-xs font-bold shrink-0"
            >
              🧠 5 Points
            </Button>
          </div>

          {/* Power 2: Rush Kingdom Timers */}
          <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-white/10 hover:border-blue-500/40 transition-all flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-400" />
                Rush Property Timers
              </h4>
              <p className="text-[11px] text-zinc-400">Accelerates all active kingdom property timers by 15 minutes.</p>
            </div>
            <Button
              onClick={() => handleSpendPoints(10, 'rush_timers')}
              disabled={currentFocusPoints < 10 || isProcessing}
              className="bg-blue-900 hover:bg-blue-800 text-blue-200 border border-blue-500/40 text-xs font-bold shrink-0"
            >
              ⚡ 10 Points
            </Button>
          </div>

          {/* Power 3: Astral Insight */}
          <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-white/10 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Astral Insight Reward
              </h4>
              <p className="text-[11px] text-zinc-400">Instantly grants +500 Gold and 1 Build Token.</p>
            </div>
            <Button
              onClick={() => handleSpendPoints(15, 'astral_reward')}
              disabled={currentFocusPoints < 15 || isProcessing}
              className="bg-amber-900 hover:bg-amber-800 text-amber-200 border border-amber-500/40 text-xs font-bold shrink-0"
            >
              🔮 15 Points
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
