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
          <DialogTitle className="text-2xl font-medieval text-amber-400 flex items-center gap-2">
            <Scroll className="w-6 h-6 text-amber-400" /> Scholar&apos;s Ancient Riddle Challenge
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Test your medieval knowledge to earn XP, gold, and daily virtue points.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <RiddleChallenge />
        </div>
      </DialogContent>
    </Dialog>
  )
}
