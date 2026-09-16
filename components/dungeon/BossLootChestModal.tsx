'use client'

import React from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trophy, Sparkles, Scroll, FlaskConical, ArrowRight } from 'lucide-react'

interface BossLootChestModalProps {
  isOpen: boolean
  onClose: () => void
  roomLevel: number
  hasBlueprintDrop?: boolean
  blueprintName?: string
}

export function BossLootChestModal({
  isOpen,
  onClose,
  roomLevel,
  hasBlueprintDrop = false,
  blueprintName = 'Serene lake'
}: BossLootChestModalProps) {
  const mythicImage = roomLevel % 20 === 0 ? '/images/Mythics/Mythic4purple.webp' : roomLevel % 15 === 0 ? '/images/Mythics/Mythic3green.webp' : roomLevel % 10 === 0 ? '/images/Mythics/Mythic2blue.webp' : '/images/Mythics/Mythic1red.webp';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-md w-full bg-gradient-to-b from-amber-950 via-zinc-950 to-zinc-950 border-2 border-amber-500/60 text-amber-100 p-6 rounded-2xl shadow-2xl font-serif text-center relative max-h-[88dvh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="sr-only">
          <DialogTitle>Boss victory chest unlocked</DialogTitle>
        </DialogHeader>
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/20 blur-3xl rounded-full pointer-events-none" />

        {/* Defeated Mythic Guardian & Chest Stage */}
        <div className="relative py-2 my-1 flex items-center justify-center gap-4">
          <div className="relative w-20 h-24 rounded-2xl border-2 border-purple-500/50 bg-zinc-950 overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Image
              src={mythicImage}
              alt="Defeated keep guardian"
              fill
              className="object-contain p-1"
              unoptimized
            />
          </div>
          <div className="text-2xl text-amber-400 font-bold">➔</div>
          <div className="relative w-20 h-24 rounded-2xl bg-gradient-to-tr from-amber-950 via-zinc-900 to-amber-900 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(245,158,11,0.6)] animate-pulse">
            <span className="animate-bounce">🎁</span>
            <Sparkles className="w-5 h-5 text-amber-300 absolute -top-2 -right-2 animate-spin-slow" />
          </div>
        </div>

        <div className="text-xs font-mono font-bold text-amber-400 tracking-wider my-1">
          ✨ Boss victory spoils ✨
        </div>

        <DialogHeader>
          <DialogTitle className="text-xl font-serif font-bold text-amber-200">
            Dungeon boss cleared (floor {roomLevel})
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 italic">
            Victory spoils unlocked from defeating the keep guardian.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3 bg-zinc-950/90 p-3.5 rounded-xl border border-amber-900/40 text-left shadow-inner">
          {hasBlueprintDrop ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 animate-pulse">
              <Scroll className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Rare kingdom blueprint discovered! (10% drop)</span>
                <p className="text-xs font-bold text-white">{blueprintName}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <Scroll className="w-6 h-6 text-zinc-400 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Citizen training scroll</span>
                <p className="text-xs font-bold text-zinc-200">+150 citizen combat EXP</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-950/40 border border-purple-500/40">
            <FlaskConical className="w-6 h-6 text-purple-400 shrink-0" />
            <div>
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Apotheca brewing reagents</span>
              <p className="text-xs font-bold text-white">+3 botanical reagents (dragon scale & astral shard)</p>
            </div>
          </div>
        </div>

        <Button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-amber-950 font-bold text-xs shadow-lg flex items-center justify-center gap-2 rounded-xl"
        >
          Claim spoils <Sparkles className="w-4 h-4" />
        </Button>
      </DialogContent>
    </Dialog>
  )
}
