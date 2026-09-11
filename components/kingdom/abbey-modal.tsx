"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Church, Sun, Coins, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { fetchFreshCharacterStats } from "@/lib/character-stats-service"

interface AbbeyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export function AbbeyModal({ open, onOpenChange, onComplete }: AbbeyModalProps) {
  const [loading, setLoading] = useState(false)
  const [vowState, setVowState] = useState<{ vowFulfilled: boolean; todayCompletedCount: number } | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setResultMessage(null)
      fetchVow()
    }
  }, [open])

  const fetchVow = async () => {
    try {
      const res = await fetch('/api/kingdom/abbey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_vow' })
      })
      if (res.ok) {
        const data = await res.json()
        setVowState(data)
      }
    } catch {
      // Fallback
    }
  }

  const handleClaimBenediction = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/kingdom/abbey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim_benediction' })
      })
      if (!res.ok) throw new Error('Vow of focus not yet completed today')
      const data = await res.json()
      setResultMessage(data.message)
      toast({
        title: "Benediction granted",
        description: data.message,
      })
      await fetchFreshCharacterStats()
      if (onComplete) onComplete()
    } catch (err: any) {
      toast({
        title: "Benediction error",
        description: err.message || "Fulfill your daily vow of focus first.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGiveAlms = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/kingdom/abbey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'give_alms' })
      })
      if (!res.ok) throw new Error('Failed to give alms')
      const data = await res.json()
      setResultMessage(data.message)
      toast({
        title: "Alms bestowed",
        description: data.message,
      })
      await fetchFreshCharacterStats()
      if (onComplete) onComplete()
    } catch (err: any) {
      toast({
        title: "Alms error",
        description: err.message || "Could not bestow alms.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFocusDivineBlessing = async () => {
    try {
      const { getCharacterStats, addToCharacterStat } = await import('@/lib/character-stats-service')
      const stats = getCharacterStats()
      if ((stats.focus_points || 0) < 5) {
        toast({
          title: "Insufficient focus points",
          description: "You need 5 focus points for a divine blessing.",
          variant: "destructive"
        })
        return
      }
      setLoading(true)
      await addToCharacterStat('focus_points', -5, 'focus-divine-blessing')
      await addToCharacterStat('experience', 200, 'focus-blessing-xp')
      await addToCharacterStat('gems', 10, 'focus-blessing-gems')
      setResultMessage("Divine blessing bestowed upon your kingdom (+200 exp, +10 gems).")
      toast({
        title: "Divine blessing bestowed",
        description: "Spent 5 focus points. Granted +200 exp & +10 gems.",
      })
      await fetchFreshCharacterStats()
      if (onComplete) onComplete()
    } catch (err: any) {
      toast({ title: "Blessing error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md w-full bg-zinc-950 border border-purple-900/40 text-white rounded-2xl p-5 shadow-2xl font-serif max-h-[85dvh] flex flex-col overflow-y-auto">
        <DialogHeader className="text-center flex flex-col items-center pb-2 px-8 sm:px-10">
          <div className="p-2.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 mb-1.5 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Church className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-medieval text-purple-200 tracking-tight font-bold break-words">
            Silent abbey
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Monastery of silent vows & benedictine grace
          </DialogDescription>
        </DialogHeader>

        {vowState ? (
          <div className="space-y-3 my-1">
            {/* Vow of Focus Status Banner */}
            <div className="p-3 bg-zinc-900/80 border border-purple-900/40 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-200">Vow of focus</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${vowState.vowFulfilled ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-amber-950 text-amber-300 border-amber-500/40'}`}>
                    {vowState.vowFulfilled ? 'Fulfilled ✓' : 'In progress'}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Habits completed today: {vowState.todayCompletedCount} / 1</span>
                </div>
              </div>
            </div>

            {resultMessage ? (
              <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-xl text-center space-y-3">
                <p className="text-xs font-semibold text-purple-200 leading-relaxed">{resultMessage}</p>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold w-full py-4 text-xs font-serif rounded-xl"
                >
                  Return to sanctuary
                </Button>
              </div>
            ) : (
              /* Tactile Action Cards */
              <div className="space-y-2 pt-1">
                {/* Primary: Claim Abbot's Benediction */}
                <button
                  onClick={handleClaimBenediction}
                  disabled={loading || !vowState.vowFulfilled}
                  className="w-full p-3 rounded-xl bg-gradient-to-r from-purple-950/70 via-indigo-950/50 to-zinc-900 hover:from-purple-900/80 border border-purple-500/40 text-left flex items-center justify-between transition-all shadow-xs group active:scale-[0.98] disabled:opacity-40"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-300">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-100 group-hover:text-purple-200">Abbot&apos;s benediction</div>
                      <div className="text-[10px] text-zinc-400">Claim daily vow reward</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                    +200 exp · +10 gems
                  </span>
                </button>

                {/* Secondary Actions Row: 2-col */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Focus Blessing */}
                  <button
                    onClick={handleFocusDivineBlessing}
                    disabled={loading}
                    className="p-3 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-400/50 text-left flex flex-col justify-between gap-2 transition-all shadow-xs group active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm">🧠</span>
                      <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950 border border-purple-400/30 px-1.5 py-0.2 rounded">
                        5 FP
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-purple-200">Divine blessing</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">+200 exp & +10 gems</div>
                    </div>
                  </button>

                  {/* Give Alms */}
                  <button
                    onClick={handleGiveAlms}
                    disabled={loading}
                    className="p-3 rounded-xl bg-zinc-900/90 hover:bg-amber-950/20 border border-amber-900/30 hover:border-amber-500/40 text-left flex flex-col justify-between gap-2 transition-all shadow-xs group active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between w-full">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-500/20 px-1.5 py-0.2 rounded">
                        +75 exp
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-100">Offer alms</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Receive pilgrim grace</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
