"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FlaskConical, Sparkles, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { fetchFreshCharacterStats, getCharacterStats } from "@/lib/character-stats-service"
import { CollectibleRune } from "@/components/runes/collectible-rune"

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
        title: "Decoction consumed",
        description: data.message,
      })
      await fetchFreshCharacterStats()
      if (onComplete) onComplete()
    } catch (err: any) {
      toast({
        title: "Brew error",
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
        title: "Distillation complete",
        description: data.message,
      })
      await fetchFreshCharacterStats()
      if (onComplete) onComplete()
    } catch (err: any) {
      toast({
        title: "Trade error",
        description: err.message || "Failed to trade botanical material.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFocusDoubleBrew = async () => {
    const stats = getCharacterStats()
    if ((stats.focus_points || 0) < 5) {
      toast({
        title: "Insufficient focus points",
        description: "You need 5 focus points to double brew.",
        variant: "destructive"
      })
      return
    }
    setLoading(true)
    try {
      const { addToCharacterStat } = await import('@/lib/character-stats-service')
      await addToCharacterStat('focus_points', -5, 'focus-double-brew')
      await addToCharacterStat('gold', 300, 'focus-double-brew-gold')
      toast({
        title: "Double elixir distilled",
        description: "Spent 5 focus points. Granted +300 gold & double potion effect.",
      })
      await fetchFreshCharacterStats()
      if (onComplete) onComplete()
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: "Brew error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md w-full bg-zinc-950 border border-emerald-900/40 text-white rounded-2xl p-5 shadow-2xl font-serif max-h-[85dvh] flex flex-col overflow-y-auto">
        <DialogHeader className="text-center flex flex-col items-center pb-2 px-8 sm:px-10">
          <div className="p-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <FlaskConical className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-medieval text-emerald-200 tracking-tight font-bold flex items-center justify-center gap-2 flex-wrap break-words">
            <span>Grand apotheca</span>
            <CollectibleRune
              id="berkano_apotheca"
              runeId="berkano"
              symbol="ᛒ"
              name="Berkano"
              meaning="The birch goddess, botanical vitality, and healing growth"
              className="text-emerald-400 ml-1"
            />
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Botanical glasshouse & daily decoction sanctuary
          </DialogDescription>
        </DialogHeader>

        {brew ? (
          <div className="space-y-3 my-1">
            {/* Compact Cauldron Brew Display */}
            <div className="p-3.5 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-500/30 rounded-xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-400/50 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                🧪
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    Today&apos;s brew
                  </span>
                  <span className="text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                    Active
                  </span>
                </div>
                <h4 className="text-sm font-bold text-emerald-100 font-serif truncate mt-0.5">{brew.name}</h4>
                <p className="text-[11px] text-zinc-400 truncate">{brew.effect}</p>
              </div>
            </div>

            {resultMessage ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center space-y-3">
                <p className="text-xs font-semibold text-emerald-200 leading-relaxed">{resultMessage}</p>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold w-full py-4 text-xs font-serif rounded-xl"
                >
                  Close apotheca
                </Button>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {/* Primary CTA: Drink Daily Brew */}
                <button
                  onClick={handleDrink}
                  disabled={loading}
                  className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-950/70 via-teal-950/50 to-zinc-900 hover:from-emerald-900/80 border border-emerald-500/40 text-left flex items-center justify-between transition-all shadow-xs group active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-300">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-100 group-hover:text-emerald-200">Drink decoction</div>
                      <div className="text-[10px] text-zinc-400">Claim free daily elixir perk</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                    Free daily
                  </span>
                </button>

                {/* Secondary Actions: 2-col */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Focus Double Brew */}
                  <button
                    onClick={handleFocusDoubleBrew}
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
                      <div className="text-xs font-bold text-purple-200">Double brew</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">+300g & 2x elixir</div>
                    </div>
                  </button>

                  {/* Trade Water */}
                  <button
                    onClick={() => handleTrade('material-water')}
                    disabled={loading}
                    className="p-3 rounded-xl bg-zinc-900/90 hover:bg-emerald-950/20 border border-emerald-900/30 hover:border-emerald-500/40 text-left flex flex-col justify-between gap-2 transition-all shadow-xs group active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between w-full">
                      <RefreshCw className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-950/50 border border-teal-500/20 px-1.5 py-0.2 rounded">
                        Trade 1💧
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-100">Distill water</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Yields crystal essence</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
