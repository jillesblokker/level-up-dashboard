"use client"

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { SeasonalHuntManager, SEASONAL_EVENTS, SEASONAL_ITEM_POSITIONS, SeasonalProgress, SeasonalEvent } from '@/lib/seasonal-hunt-manager'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Sparkles, HelpCircle, MapPin, CheckCircle2, RotateCcw, Trophy, Gift, Egg, Circle, Heart, Clover, Shield, Sun, Hammer, Wheat, Scroll } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

export function SeasonalHuntLedger() {
  const { user } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [revealedClues, setRevealedClues] = useState<Record<number, boolean>>({})
  const [progress, setProgress] = useState<SeasonalProgress | null>(null)
  const [items, setItems] = useState<any[]>([])

  const currentEventKey = SeasonalHuntManager.getCurrentEvent()
  const fallbackEvent = Object.values(SEASONAL_EVENTS)[0] as SeasonalEvent
  const eventConfig: SeasonalEvent = (SEASONAL_EVENTS[currentEventKey] || fallbackEvent) as SeasonalEvent

  const loadProgress = async () => {
    if (!user?.id) return
    try {
      await SeasonalHuntManager.initialize(user.id)
      const currentProgress = SeasonalHuntManager.getProgress()
      setProgress(currentProgress)
      // Access private items via getProgress / internal state sync
      const internalItems = (SeasonalHuntManager as any).items || []
      setItems(internalItems)
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    loadProgress()
    const handleProgressUpdate = () => loadProgress()
    const handleOpenLedger = () => setOpen(true)

    window.addEventListener('seasonal-hunt:updated', handleProgressUpdate)
    window.addEventListener('open-seasonal-hunt-ledger', handleOpenLedger)
    return () => {
      window.removeEventListener('seasonal-hunt:updated', handleProgressUpdate)
      window.removeEventListener('open-seasonal-hunt-ledger', handleOpenLedger)
    }
  }, [user?.id, pathname])

  const handleToggleClue = (itemId: number) => {
    setRevealedClues(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const handleResetHunt = async () => {
    if (!user?.id) return
    try {
      await SeasonalHuntManager.resetItems(user.id)
      toast({
        title: "🔄 Hide & Seek Reset!",
        description: `All 10 ${eventConfig.name} items have been hidden again. Good luck hunting!`,
      })
      loadProgress()
      window.dispatchEvent(new CustomEvent('seasonal-hunt:updated'))
    } catch {
      toast({
        title: "Error",
        description: "Failed to reset hunt items.",
        variant: "destructive",
      })
    }
  }

  const getEventIcon = () => {
    switch (currentEventKey) {
      case 'easter': return <Egg className="h-5 w-5 text-yellow-400" />
      case 'christmas': return <Gift className="h-5 w-5 text-red-400" />
      case 'halloween': return <Circle className="h-5 w-5 text-orange-400" />
      case 'valentine': return <Heart className="h-5 w-5 text-pink-400" />
      case 'spring': return <Clover className="h-5 w-5 text-emerald-400" />
      case 'shield_joust': return <Shield className="h-5 w-5 text-amber-400" />
      case 'solstice': return <Sun className="h-5 w-5 text-amber-300" />
      case 'forge_fire': return <Hammer className="h-5 w-5 text-orange-300" />
      case 'harvest': return <Wheat className="h-5 w-5 text-amber-400" />
      case 'remembrance': return <Scroll className="h-5 w-5 text-yellow-300" />
      default: return <Sparkles className="h-5 w-5 text-amber-400" />
    }
  }

  const foundCount = progress?.found || 0
  const totalCount = progress?.total || 10

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-[95vw] sm:w-96 !bg-black border-r border-amber-800/30 text-white p-0 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-amber-800/30 bg-gradient-to-r from-zinc-900 via-amber-950/30 to-zinc-900 shrink-0 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center shrink-0">
              {getEventIcon()}
            </div>
            <div>
              <SheetTitle className="text-lg font-bold text-amber-400 font-serif tracking-wide">
                {eventConfig.name}
              </SheetTitle>
              <p className="text-xs text-zinc-400">Hide & Seek Seasonal Event Clue Radar</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pt-2 space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-300">Items Collected</span>
              <span className="text-amber-400 font-bold">{foundCount} / {totalCount}</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-amber-900/30">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${(foundCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* List of Hidden Items with Riddles & Shortcuts */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 !bg-black">
          <p className="text-xs text-zinc-400 leading-relaxed italic">
            💡 {eventConfig.description} Explore the kingdom and tap hidden objects peeking from screen edges to earn gold & essences!
          </p>

          {SEASONAL_ITEM_POSITIONS.map((spot) => {
            const itemData = items.find(i => i.item_id === spot.itemId)
            const isFound = itemData ? itemData.found : false
            const isClueRevealed = revealedClues[spot.itemId]

            return (
              <div
                key={spot.itemId}
                className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                  isFound
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-amber-400">
                      #{spot.itemId}
                    </span>
                    <span className="font-bold text-sm text-white">{spot.pageName}</span>
                  </div>

                  {isFound ? (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Found
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-500/80 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" /> Hidden
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400">
                  <span className="text-zinc-500">Location:</span> {spot.locationName}
                </p>

                {/* Clue Text Accordion */}
                {isClueRevealed && (
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-amber-500/30 text-xs text-amber-200/90 italic animate-in fade-in-50">
                    💡 <span className="font-semibold text-amber-300">Riddle:</span> &quot;{spot.clue}&quot;
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {!isFound && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleClue(spot.itemId)}
                        className="h-7 text-[11px] border-amber-500/30 text-amber-300 hover:bg-amber-950/50 flex items-center gap-1 font-bold"
                      >
                        <HelpCircle className="w-3 h-3" />
                        {isClueRevealed ? 'Hide Riddle' : 'Show Riddle 💡'}
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => {
                          setOpen(false)
                          router.push(spot.page)
                        }}
                        className="h-7 text-[11px] bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 font-bold ml-auto"
                      >
                        <MapPin className="w-3 h-3" />
                        Go to Page
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-amber-800/30 bg-zinc-950 shrink-0 flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetHunt}
            className="text-xs border-amber-500/30 text-amber-300 hover:bg-amber-950/50 font-bold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Hunt 🔄
          </Button>

          {foundCount === totalCount && (
            <Button
              size="sm"
              onClick={() => {
                setOpen(false)
                window.dispatchEvent(new CustomEvent('open-seasonal-hunt-completion'))
              }}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1"
            >
              <Trophy className="w-4 h-4 text-yellow-300" /> View Victory! 🎉
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
