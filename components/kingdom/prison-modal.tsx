"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldAlert, Key, Pickaxe, UserCheck, Search, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { fetchFreshCharacterStats } from "@/lib/character-stats-service"

interface PrisonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export function PrisonModal({ open, onOpenChange, onComplete }: PrisonModalProps) {
  const [loading, setLoading] = useState(false)
  const [inmate, setInmate] = useState<{ id: string; name: string; crime: string; hint: string } | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setResultMessage(null)
      fetchInmate()
    }
  }, [open])

  const fetchInmate = async () => {
    try {
      const res = await fetch('/api/kingdom/prison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_inmate' })
      })
      if (res.ok) {
        const data = await res.json()
        setInmate(data.inmate)
      }
    } catch {
      // Fallback
    }
  }

  const handleAction = async (action: 'recruit' | 'interrogate' | 'labor') => {
    setLoading(true)
    try {
      const res = await fetch('/api/kingdom/prison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (!res.ok) throw new Error('Failed to complete action')
      const data = await res.json()

      setResultMessage(data.message)
      toast({
        title: "Citadel trial complete",
        description: data.message,
      })

      await fetchFreshCharacterStats()
      if (onComplete) onComplete()
    } catch (err: any) {
      toast({
        title: "Trial error",
        description: err.message || "Failed to execute prison action.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFocusPardon = async () => {
    try {
      const { getCharacterStats, addToCharacterStat } = await import('@/lib/character-stats-service')
      const stats = getCharacterStats()
      if ((stats.focus_points || 0) < 5) {
        toast({
          title: "Insufficient focus points",
          description: "You need 5 focus points for a royal pardon.",
          variant: "destructive"
        })
        return
      }
      setLoading(true)
      await addToCharacterStat('focus_points', -5, 'focus-royal-pardon')
      await addToCharacterStat('experience', 250, 'focus-pardon-xp')
      await addToCharacterStat('gold', 200, 'focus-pardon-gold')
      setResultMessage("Royal pardon granted! Inmate recruited as elite mercenary guard (+250 exp, +200 gold).")
      toast({
        title: "Royal pardon granted",
        description: "Spent 5 focus points. Recruited elite mercenary guard.",
      })
      await fetchFreshCharacterStats()
      if (onComplete) onComplete()
    } catch (err: any) {
      toast({ title: "Pardon error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md w-full bg-zinc-950 border border-amber-900/40 text-white rounded-2xl p-5 shadow-2xl font-serif max-h-[85dvh] flex flex-col overflow-y-auto">
        <DialogHeader className="text-center flex flex-col items-center pb-2 px-8 sm:px-10">
          <div className="p-2.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-medieval text-amber-200 tracking-tight font-bold break-words">
            Royal dungeon & barracks
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Mercenary recruitment & captive trial post
          </DialogDescription>
        </DialogHeader>

        {inmate ? (
          <div className="space-y-3 my-1">
            {/* Captive Dossier Card */}
            <div className="p-3 bg-zinc-900/80 border border-amber-900/40 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-200">{inmate.name}</span>
                  <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                    In custody
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 italic mt-0.5 truncate max-w-[240px]">
                  Offense: {inmate.crime}
                </p>
              </div>
              <Key className="w-4 h-4 text-amber-400/60 shrink-0" />
            </div>

            {resultMessage ? (
              <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl text-center space-y-3">
                <p className="text-xs font-semibold text-amber-200 leading-relaxed">{resultMessage}</p>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold w-full py-4 text-xs font-serif rounded-xl"
                >
                  Return to citadel
                </Button>
              </div>
            ) : (
              /* 2x2 Tactile Action Tray */
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* Action 1: Bail & Recruit */}
                <button
                  onClick={() => handleAction('recruit')}
                  disabled={loading}
                  className="p-3 rounded-xl bg-zinc-900/90 hover:bg-amber-950/30 border border-amber-900/40 hover:border-amber-500/60 text-left flex flex-col justify-between gap-2 transition-all shadow-xs group active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex items-center justify-between w-full">
                    <UserCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                      +100 exp
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-100 group-hover:text-amber-200">Bail & recruit</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Kingdom guard recruit</div>
                  </div>
                </button>

                {/* Action 2: Royal Pardon (Focus Points) */}
                <button
                  onClick={handleFocusPardon}
                  disabled={loading}
                  className="p-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 hover:border-purple-400/60 text-left flex flex-col justify-between gap-2 transition-all shadow-xs group active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm">🧠</span>
                    <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950 border border-purple-400/40 px-1.5 py-0.2 rounded">
                      5 FP · Elite
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-200 group-hover:text-purple-100">Royal pardon</div>
                    <div className="text-[10px] text-purple-300/70 mt-0.5">+250 exp & +200g</div>
                  </div>
                </button>

                {/* Action 3: Interrogate Secrets */}
                <button
                  onClick={() => handleAction('interrogate')}
                  disabled={loading}
                  className="p-3 rounded-xl bg-zinc-900/90 hover:bg-amber-950/30 border border-amber-900/40 hover:border-amber-500/60 text-left flex flex-col justify-between gap-2 transition-all shadow-xs group active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex items-center justify-between w-full">
                    <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.2 rounded">
                      Clue
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-100 group-hover:text-amber-200">Interrogate</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Extract recipe clue</div>
                  </div>
                </button>

                {/* Action 4: Hard Labor */}
                <button
                  onClick={() => handleAction('labor')}
                  disabled={loading}
                  className="p-3 rounded-xl bg-zinc-900/90 hover:bg-amber-950/30 border border-amber-900/40 hover:border-amber-500/60 text-left flex flex-col justify-between gap-2 transition-all shadow-xs group active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex items-center justify-between w-full">
                    <Pickaxe className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.2 rounded">
                      +10 stone
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-100 group-hover:text-amber-200">Hard labor</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Quarry building stone</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
