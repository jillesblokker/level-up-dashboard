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
        title: "Iron Citadel Trial Complete",
        description: data.message,
      })

      await fetchFreshCharacterStats()
      if (onComplete) onComplete()
    } catch (err: any) {
      toast({
        title: "Trial Error",
        description: err.message || "Failed to execute prison action.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFocusPardon = async () => {
    try {
      const { getCharacterStats, addToCharacterStat } = await import('@/lib/character-stats-service');
      const stats = getCharacterStats();
      if ((stats.focus_points || 0) < 5) {
        toast({
          title: "Insufficient Focus Points 🧠",
          description: "You need 5 Focus Points for Royal Pardon!",
          variant: "destructive"
        });
        return;
      }
      setLoading(true);
      await addToCharacterStat('focus_points', -5, 'focus-royal-pardon');
      await addToCharacterStat('experience', 250, 'focus-pardon-xp');
      await addToCharacterStat('gold', 200, 'focus-pardon-gold');
      setResultMessage("Royal Pardon granted! Inmate recruited as Elite Mercenary Guard (+250 XP, +200 Gold).");
      toast({
        title: "🧠 Royal Pardon Granted!",
        description: "Spent 5 Focus Points. Recruited Elite Mercenary Guard!"
      });
      await fetchFreshCharacterStats();
      if (onComplete) onComplete();
    } catch (err: any) {
      toast({ title: "Pardon Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-amber-800/50 text-white rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="text-center flex flex-col items-center">
          <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/30 text-amber-400 mb-2 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <DialogTitle className="text-2xl font-serif font-bold text-amber-300 drop-shadow">
            Royal Dungeon & Barracks Guard
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-300">
            Dungeon Citadel & Mercenary Recruitment Post
          </DialogDescription>
        </DialogHeader>

        {inmate ? (
          <div className="space-y-4 my-2">
            <div className="p-4 bg-zinc-950/90 border border-amber-900/40 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider">Detained Captive</span>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">In Custody</span>
              </div>
              <h4 className="text-lg font-serif font-bold text-zinc-100 mt-1">{inmate.name}</h4>
              <p className="text-xs text-zinc-300 italic mt-0.5">Offense: {inmate.crime}</p>
            </div>

            {resultMessage ? (
              <div className="p-4 bg-amber-950/50 border border-amber-500/40 rounded-xl text-center space-y-2">
                <p className="text-sm font-semibold text-amber-200">{resultMessage}</p>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="mt-2 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold w-full"
                >
                  Return to Citadel
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                <Button
                  onClick={() => handleAction('recruit')}
                  disabled={loading}
                  className="h-auto py-3 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-zinc-950 font-bold border border-yellow-300/30 rounded-xl flex items-center justify-between px-4"
                >
                  <div className="flex items-center gap-2 text-left">
                    <UserCheck className="w-5 h-5 text-zinc-950 shrink-0" />
                    <div>
                      <div className="text-sm">Bail & Recruit</div>
                      <div className="text-[10px] text-zinc-900 font-normal">Recruit inmate (+100 XP to kingdom)</div>
                    </div>
                  </div>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                </Button>

                <Button
                  onClick={handleFocusPardon}
                  disabled={loading}
                  className="h-auto py-3 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-500/40 rounded-xl flex items-center justify-between px-4"
                >
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-xl">🧠</span>
                    <div>
                      <div className="text-sm font-bold">Spend 5 Focus Points: Royal Pardon</div>
                      <div className="text-[10px] text-purple-300 font-normal">Recruit Elite Mercenary (+250 XP & +200 Gold)</div>
                    </div>
                  </div>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                </Button>

                <Button
                  onClick={() => handleAction('interrogate')}
                  disabled={loading}
                  variant="outline"
                  className="h-auto py-3 bg-zinc-900 border-amber-700/50 hover:bg-zinc-800 text-amber-200 font-bold rounded-xl flex items-center justify-between px-4"
                >
                  <div className="flex items-center gap-2 text-left">
                    <Search className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-sm">Interrogate Secrets</div>
                      <div className="text-[10px] text-zinc-400 font-normal">Extract recipe or treasure clues</div>
                    </div>
                  </div>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                </Button>

                <Button
                  onClick={() => handleAction('labor')}
                  disabled={loading}
                  variant="outline"
                  className="h-auto py-3 bg-zinc-900 border-amber-700/50 hover:bg-zinc-800 text-amber-200 font-bold rounded-xl flex items-center justify-between px-4"
                >
                  <div className="flex items-center gap-2 text-left">
                    <Pickaxe className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-sm">Assign Hard Labor</div>
                      <div className="text-[10px] text-zinc-400 font-normal">Extract 10x Stone for building</div>
                    </div>
                  </div>
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
