'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trophy, Sparkles, Scroll, FlaskConical, ArrowRight } from 'lucide-react'

interface BossLootChestModalProps {
  isOpen: boolean
  onClose: () => void
  roomLevel: number
  blueprintName?: string
}

export function BossLootChestModal({ isOpen, onClose, roomLevel, blueprintName = 'Astral Citadel Monument' }: BossLootChestModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-md w-full bg-gradient-to-b from-amber-950 via-zinc-950 to-zinc-950 border border-amber-500/50 text-amber-100 p-6 rounded-2xl shadow-2xl font-serif text-center relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        <DialogHeader>
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-bounce">
            <Trophy className="w-7 h-7 text-amber-300" />
          </div>
          <DialogTitle className="text-2xl font-medieval text-amber-200">
            Dungeon Boss Cleared! (Floor {roomLevel})
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 italic">
            Guaranteed Dual Drops unlocked from defeating the Keep Guardian.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3 bg-zinc-950/90 p-4 rounded-xl border border-amber-900/40 text-left">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30">
            <Scroll className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Kingdom Blueprint Drop</span>
              <p className="text-xs font-bold text-white">{blueprintName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/30">
            <FlaskConical className="w-6 h-6 text-purple-400 shrink-0" />
            <div>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Apotheca Brewing Reagents</span>
              <p className="text-xs font-bold text-white">+3x Botanical Reagents (Ember & Frost)</p>
            </div>
          </div>
        </div>

        <Button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-amber-950 font-bold uppercase tracking-wider text-xs shadow-lg flex items-center justify-center gap-2"
        >
          Claim Dual Drops <Sparkles className="w-4 h-4" />
        </Button>
      </DialogContent>
    </Dialog>
  )
}
