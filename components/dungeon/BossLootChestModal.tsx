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
      <DialogContent className="max-w-md w-full bg-gradient-to-b from-amber-950 via-zinc-950 to-zinc-950 border-2 border-amber-500/60 text-amber-100 p-6 rounded-2xl shadow-2xl font-serif text-center relative overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Boss Victory Chest Unlocked</DialogTitle>
        </DialogHeader>
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/20 blur-3xl rounded-full pointer-events-none" />

        {/* Glowing 3D Treasure Chest Opening Animation Stage */}
        <div className="relative py-4 my-2">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-950 via-zinc-900 to-amber-900 border-2 border-amber-400 flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(245,158,11,0.6)] animate-pulse relative">
            <span className="animate-bounce">🎁</span>
            <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-spin-slow" />
          </div>
          <div className="text-xs font-mono font-bold text-amber-400 mt-2 uppercase tracking-widest">
            ✨ Boss Dual Drops Unlocked ✨
          </div>
        </div>

        <DialogHeader>
          <DialogTitle className="text-2xl font-serif font-bold text-amber-200">
            Dungeon Boss Cleared! (Floor {roomLevel})
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 italic">
            Guaranteed Dual Drops unlocked from defeating the Keep Guardian.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3 bg-zinc-950/90 p-4 rounded-xl border border-amber-900/40 text-left shadow-inner">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40">
            <Scroll className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Kingdom Blueprint Drop</span>
              <p className="text-xs font-bold text-white">{blueprintName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-950/40 border border-purple-500/40">
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
