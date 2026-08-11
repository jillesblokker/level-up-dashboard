'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { RiddleChallenge } from '@/components/riddle-challenge'
import { Scroll } from 'lucide-react'

interface TownRiddleModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TownRiddleModal({ isOpen, onClose }: TownRiddleModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(op) => { if (!op) onClose() }}>
      <DialogContent className="max-w-3xl w-full bg-zinc-950 border border-amber-900/50 text-zinc-100 p-6 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] z-[100]">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-serif text-amber-400 flex items-center gap-2">
            <Scroll className="w-5 h-5 text-amber-400 shrink-0" /> Scholar&apos;s Riddle
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Solve today&apos;s ancient riddle to earn XP and gold.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <RiddleChallenge />
        </div>
      </DialogContent>
    </Dialog>
  )
}
