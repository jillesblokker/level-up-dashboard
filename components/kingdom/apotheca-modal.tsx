"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FlaskConical, Sparkles, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { fetchFreshCharacterStats } from "@/lib/character-stats-service"

interface ApothecaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export function ApothecaModal({ open, onOpenChange, onComplete }: ApothecaModalProps) {
  const [loading, setLoading] = useState(false)
  const [brew, setBrew] = useState<{ id: string; name: string; effect: string } | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setResultMessage(null)
      fetchStatus()
    }
  }, [open])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/kingdom/apotheca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_status' })
      })
      if (res.ok) {
        const data = await res.json()
        setBrew(data.brew)
      }
    } catch {
      // Fallback
    }
  }

  const handleDrink = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/kingdom/apotheca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'drink_brew' })
      })
      if (!res.ok) throw new Error('Failed to drink brew')
      const data = await res.json()
      setResultMessage(data.message)
      toast({
        title: "Apothecary Decoction Consumed!",
        description: data.message,
      })
      await fetchFreshCharacterStats()
      if (onComplete) onComplete()
    } catch (err: any) {
      toast({
        title: "Brew Error",
        description: err.message || "Failed to drink daily decoction.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTrade = async (item: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/kingdom/apotheca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'botanical_trade', tradeItem: item })
      })
      if (!res.ok) throw new Error('Insufficient materials')
      const data = await res.json()
      setResultMessage(data.message)
      toast({
        title: "Botanical Distillation Complete",
        description: data.message,
      })
      await fetchFreshCharacterStats()
      if (onComplete) onComplete()
    } catch (err: any) {
      toast({
        title: "Trade Error",
        description: err.message || "Failed to trade botanical material.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-emerald-800/50 text-white rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="text-center flex flex-col items-center">
          <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 mb-2 shadow-inner">
            <FlaskConical className="w-8 h-8" />
          </div>
          <DialogTitle className="text-2xl font-serif font-bold text-emerald-300 drop-shadow">
            Grand Apotheca
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-300">
            Botanical Glasshouse & Daily Decoction Sanctuary
          </DialogDescription>
        </DialogHeader>

        {brew ? (
          <div className="space-y-4 my-2">
            <div className="p-4 bg-zinc-950/90 border border-emerald-900/40 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider">Daily Master Brew</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">Ready</span>
              </div>
              <h4 className="text-lg font-serif font-bold text-zinc-100 mt-1">{brew.name}</h4>
              <p className="text-xs text-zinc-300 italic mt-0.5">{brew.effect}</p>
            </div>

            {resultMessage ? (
              <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-center space-y-2">
                <p className="text-sm font-semibold text-emerald-200">{resultMessage}</p>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold w-full"
                >
                  Close Apotheca
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                <Button
                  onClick={handleDrink}
                  disabled={loading}
                  className="h-auto py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-zinc-950 font-bold border border-emerald-300/30 rounded-xl flex items-center justify-between px-4"
                >
                  <div className="flex items-center gap-2 text-left">
                    <Sparkles className="w-5 h-5 text-zinc-950 shrink-0" />
                    <div>
                      <div className="text-sm">Drink Master Decoction</div>
                      <div className="text-[10px] text-zinc-900 font-normal">Claim free daily elixir potion effect</div>
                    </div>
                  </div>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                </Button>

                <Button
                  onClick={() => handleTrade('material-water')}
                  disabled={loading}
                  variant="outline"
                  className="h-auto py-3 bg-zinc-900 border-emerald-700/50 hover:bg-zinc-800 text-emerald-200 font-bold rounded-xl flex items-center justify-between px-4"
                >
                  <div className="flex items-center gap-2 text-left">
                    <RefreshCw className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-sm">Distill Water Element</div>
                      <div className="text-[10px] text-zinc-400 font-normal">Trade 1 Water for 1x Crystal Essence</div>
                    </div>
                  </div>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
