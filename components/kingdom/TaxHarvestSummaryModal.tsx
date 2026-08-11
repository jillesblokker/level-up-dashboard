'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Coins, Sparkles, Home, Trophy } from 'lucide-react'

interface TaxHarvestSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  harvestStats: {
    propertiesHarvested: number
    goldHarvested: number
    essencesHarvested: number
  }
}

export function TaxHarvestSummaryModal({ isOpen, onClose, harvestStats }: TaxHarvestSummaryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm w-full bg-gradient-to-b from-amber-950 via-zinc-950 to-zinc-950 border border-amber-500/40 text-amber-100 p-6 rounded-2xl shadow-2xl font-serif text-center">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center mb-2">
            <Coins className="w-6 h-6 text-amber-400 animate-bounce" />
          </div>
          <DialogTitle className="text-2xl font-medieval text-amber-200">
            Kingdom Tax Harvested!
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 italic">
            Your citizens have paid their daily dues to the realm treasury.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-2 bg-zinc-950/80 p-4 rounded-xl border border-amber-900/30">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-1.5"><Home className="w-4 h-4 text-amber-400" /> Properties Harvested:</span>
            <span className="font-bold text-amber-300">{harvestStats.propertiesHarvested}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-300 border-t border-amber-900/20 pt-2">
            <span className="flex items-center gap-1.5"><Coins className="w-4 h-4 text-yellow-400" /> Gold Collected:</span>
            <span className="font-bold text-yellow-400">+{harvestStats.goldHarvested}g</span>
          </div>
          {harvestStats.essencesHarvested > 0 && (
            <div className="flex items-center justify-between text-xs text-zinc-300 border-t border-amber-900/20 pt-2">
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-purple-400" /> Essences Harvested:</span>
              <span className="font-bold text-purple-400">+{harvestStats.essencesHarvested}</span>
            </div>
          )}
        </div>

        <Button
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-amber-950 font-bold uppercase tracking-wider text-xs shadow-lg flex items-center justify-center gap-2"
        >
          Deposit to Treasury <Sparkles className="w-4 h-4" />
        </Button>
      </DialogContent>
    </Dialog>
  )
}
