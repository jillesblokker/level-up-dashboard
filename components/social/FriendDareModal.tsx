'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sword, Trophy, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

import { addToCharacterStat } from '@/lib/character-stats-service'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

interface FriendDareModalProps {
  isOpen: boolean
  onClose: () => void
  friendName?: string
}

export function FriendDareModal({ isOpen, onClose, friendName = 'Friend' }: FriendDareModalProps) {
  const [isSending, setIsSending] = useState(false)

  const handleIssueDare = async () => {
    setIsSending(true)
    try {
      // Award virtue points and bonus gold
      await addToCharacterStat('gold', 150, 'friend-virtue-duel')

      // Unlock "Duel victor" title
      try {
        await fetchWithAuth('/api/titles/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Duel victor' })
        })
      } catch {}

      toast({
        title: "1v1 habit race dare sent! ⚔️",
        description: `Challenged ${friendName} to a 5/10 habit target race! First to reach target wins +10 House Cup virtue points to both and +150 gold!`,
      })
      onClose()
    } catch {
      toast({
        title: "Duel error",
        description: "Failed to issue habit duel dare.",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-zinc-950 border border-amber-900/50 text-white rounded-2xl p-6 shadow-2xl max-h-[88dvh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-400">
            <Sword className="w-6 h-6" />
            <DialogTitle className="text-lg font-bold text-amber-100">
              1v1 daily habit race dare
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 text-xs mt-1">
            Challenge <strong className="text-amber-300">{friendName}</strong> to a head-to-head daily habit completion race!
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3 p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs">
          {/* Side-by-Side 1v1 Habit Race Tracker Bar */}
          <div className="space-y-2 pb-2 border-b border-zinc-800">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300 font-serif">
              <span>⚔️ Live habit race progress</span>
              <span className="text-[10px] font-mono text-emerald-400">Target: 5 habits</span>
            </div>
            
            {/* You Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-300 font-bold">You (host)</span>
                <span className="text-amber-400 font-mono font-bold">4/5 habits (80%)</span>
              </div>
              <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-amber-500/30">
                <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 w-[80%] rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              </div>
            </div>

            {/* Ally Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-300 font-bold">{friendName}</span>
                <span className="text-cyan-400 font-mono font-bold">3/5 habits (60%)</span>
              </div>
              <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-cyan-500/30">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 w-[60%] rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-semibold">Virtue prize:</span>
            <span className="text-amber-300 font-mono font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> +10 House Cup points each
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-semibold">Winner bonus:</span>
            <span className="text-amber-300 font-mono font-bold flex items-center gap-1">
              +150 gold & "Duel victor" badge
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-semibold">Rivalry badge:</span>
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Habit duelist
            </span>
          </div>

          <p className="text-[11px] text-zinc-500 italic mt-2 border-t border-zinc-800/80 pt-2">
            *Both you and {friendName} earn +10 bonus virtue points upon completing your daily 5 habit sweet spot!
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="w-1/2 text-zinc-400 text-xs h-9">
            Cancel
          </Button>
          <Button
            onClick={handleIssueDare}
            disabled={isSending}
            className="w-1/2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30 text-white font-bold text-xs h-9 gap-1.5 rounded-xl shadow-md"
          >
            <Sword className="w-3.5 h-3.5" /> {isSending ? "Sending..." : "Issue dare"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
