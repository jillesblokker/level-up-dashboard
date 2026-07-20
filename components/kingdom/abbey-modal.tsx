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
      if (!res.ok) throw new Error('Vow of Focus not yet completed today!')
      const data = await res.json()
      setResultMessage(data.message)
      toast({
        title: "Benediction Granted!",
        description: data.message,
      })
      await fetchFreshCharacterStats()
      if (onComplete) onComplete()
    } catch (err: any) {
      toast({
        title: "Benediction Error",
        description: err.message || "Fulfill your daily Vow of Focus first.",
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
        title: "Alms Bestowed",
        description: data.message,
      })
      await fetchFreshCharacterStats()
      if (onComplete) onComplete()
    } catch (err: any) {
      toast({
        title: "Alms Error",
        description: err.message || "Could not bestow alms.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-purple-800/50 text-white rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="text-center flex flex-col items-center">
          <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-500/30 text-purple-400 mb-2 shadow-inner">
            <Church className="w-8 h-8" />
          </div>
          <DialogTitle className="text-2xl font-serif font-bold text-purple-300 drop-shadow">
            Silent Abbey
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-300">
            Monastery of Silent Vows & Benedictine Grace
          </DialogDescription>
        </DialogHeader>

        {vowState ? (
          <div className="space-y-4 my-2">
            <div className="p-4 bg-zinc-950/90 border border-purple-900/40 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-purple-300 uppercase tracking-wider">Vow of Focus</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${vowState.vowFulfilled ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-amber-950 text-amber-300 border-amber-500/40'}`}>
                  {vowState.vowFulfilled ? 'Vow Fulfilled' : 'In Progress'}
                </span>
              </div>
              <h4 className="text-lg font-serif font-bold text-zinc-100 mt-1">Daily Habit Pledge</h4>
              <p className="text-xs text-zinc-300 mt-0.5">Complete at least 1 Quest or Habit today to unlock the Abbot&apos;s Benediction.</p>
              <div className="mt-2 text-xs font-mono text-purple-300 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                <span>Today&apos;s Completed Quests: {vowState.todayCompletedCount} / 1</span>
              </div>
            </div>

            {resultMessage ? (
              <div className="p-4 bg-purple-950/50 border border-purple-500/40 rounded-xl text-center space-y-2">
                <p className="text-sm font-semibold text-purple-200">{resultMessage}</p>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="mt-2 bg-purple-600 hover:bg-purple-500 text-white font-bold w-full"
                >
                  Return to Sanctuary
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                <Button
                  onClick={handleClaimBenediction}
                  disabled={loading || !vowState.vowFulfilled}
                  className="h-auto py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold border border-purple-300/30 rounded-xl flex items-center justify-between px-4 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 text-left">
                    <Sun className="w-5 h-5 text-yellow-300 shrink-0" />
                    <div>
                      <div className="text-sm">Claim Abbot&apos;s Benediction</div>
                      <div className="text-[10px] text-purple-100 font-normal">Receive +200 XP and +10 Gems</div>
                    </div>
                  </div>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                </Button>

                <Button
                  onClick={handleGiveAlms}
                  disabled={loading}
                  variant="outline"
                  className="h-auto py-3 bg-zinc-900 border-purple-700/50 hover:bg-zinc-800 text-purple-200 font-bold rounded-xl flex items-center justify-between px-4"
                >
                  <div className="flex items-center gap-2 text-left">
                    <Coins className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-sm">Offer Pilgrims&apos; Alms</div>
                      <div className="text-[10px] text-zinc-400 font-normal">Give alms to receive +75 XP grace</div>
                    </div>
                  </div>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
