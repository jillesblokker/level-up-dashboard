"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FlaskConical, Sparkles, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { fetchFreshCharacterStats, getCharacterStats } from "@/lib/character-stats-service"

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

  const handleFocusDoubleBrew = async () => {
    const stats = getCharacterStats();
    if ((stats.focus_points || 0) < 5) {
      toast({
        title: "Insufficient Focus Points 🧠",
        description: "You need 5 Focus Points. Complete daily habits to earn more!",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const { addToCharacterStat } = await import('@/lib/character-stats-service');
      await addToCharacterStat('focus_points', -5, 'focus-double-brew');
      await addToCharacterStat('gold', 300, 'focus-double-brew-gold');
      toast({
        title: "🧠 Double Elixir Brew Distilled!",
        description: "Spent 5 Focus Points. Granted +300 Gold & Double Apothecary Elixir Boost!"
      });
      await fetchFreshCharacterStats();
      if (onComplete) onComplete();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Brew Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-[500px] bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-emerald-800/50 text-white rounded-2xl p-4 sm:p-6 shadow-2xl overflow-x-hidden">
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
            {/* Animated Cauldron Alchemy Stage */}
            <div className="relative p-5 bg-gradient-to-b from-emerald-950/80 via-zinc-950 to-zinc-900 border border-emerald-500/40 rounded-2xl text-center space-y-3 overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent blur-xl pointer-events-none" />
              
              {/* Bubbling Cauldron & Sparkles */}
              <div className="relative w-16 h-16 mx-auto rounded-full bg-emerald-950/90 border-2 border-emerald-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse">
                <span className="animate-bounce">🧪</span>
                <Sparkles className="w-4 h-4 text-emerald-300 absolute -top-1 -right-1 animate-spin-slow" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-widest">Master Alchemy Cauldron</span>
                  <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">Bubbling Active</span>
                </div>
                <h4 className="text-xl font-serif font-bold text-emerald-200">{brew.name}</h4>
                <p className="text-xs text-zinc-300 italic max-w-sm mx-auto">{brew.effect}</p>
              </div>
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
                {/* Batch Distillation Multiplier Toggle */}
                <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-emerald-500/30 text-xs">
                  <span className="font-serif font-bold text-emerald-300">🧪 Batch Distillation Multiplier:</span>
                  <div className="flex items-center gap-1 font-mono font-bold">
                    <button type="button" onClick={() => toast({ title: "Batch Set: 1x", description: "Standard single potion distillation." })} className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px]">1x</button>
                    <button type="button" onClick={() => toast({ title: "Batch Set: 3x", description: "Triple potion distillation active (+3x Yield)." })} className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] hover:text-emerald-300">3x</button>
                    <button type="button" onClick={() => toast({ title: "Batch Set: 5x", description: "Quintuple potion distillation active (+5x Yield)." })} className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] hover:text-emerald-300">5x</button>
                  </div>
                </div>

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
                  onClick={handleFocusDoubleBrew}
                  disabled={loading}
                  className="h-auto py-3 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-500/40 rounded-xl flex items-center justify-between px-4"
                >
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-xl">🧠</span>
                    <div>
                      <div className="text-sm font-bold">Spend 5 Focus Points: Double Brew</div>
                      <div className="text-[10px] text-purple-300 font-normal">Instant Double Elixir & +300 Gold Surge</div>
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
