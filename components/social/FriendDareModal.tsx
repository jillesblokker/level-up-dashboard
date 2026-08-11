'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sword, Trophy, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface FriendDareModalProps {
  isOpen: boolean
  onClose: () => void
  friendName?: string
}

export function FriendDareModal({ isOpen, onClose, friendName = 'Friend' }: FriendDareModalProps) {
  const [isSending, setIsSending] = useState(false)

  const handleIssueDare = async () => {
    setIsSending(true)
    setTimeout(() => {
      setIsSending(false)
      toast({
        title: "⚔️ 1v1 Habit Race Dare Sent!",
        description: `Challenged ${friendName} to a 5/10 habit target race! First to reach target wins +10 House Cup virtue points to both!`,
      })
      onClose()
    }, 600)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-zinc-950 border border-amber-900/50 text-white rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-400">
            <Sword className="w-6 h-6" />
            <DialogTitle className="text-lg font-bold text-amber-100">
              1v1 Daily Habit Race Dare
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 text-xs mt-1">
            Challenge <strong className="text-amber-300">{friendName}</strong> to a head-to-head daily habit completion race!
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3 p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-semibold">Race Target:</span>
            <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-950/30">
              5 Daily Habits
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-semibold">Virtue Prize:</span>
            <span className="text-amber-300 font-mono font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> +10 House Cup Points
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-semibold">Rivalry Badge:</span>
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Habit Duelist Badge
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
            className="w-1/2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs h-9 gap-1.5"
          >
            <Sword className="w-3.5 h-3.5" /> Issue Dare
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
