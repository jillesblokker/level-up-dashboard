'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Hammer, Sparkles, Trophy, CheckCircle2, RotateCcw, Footprints } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { addToCharacterStat } from '@/lib/character-stats-service'

import Image from 'next/image'

interface PlankLabyrinthModalProps {
  isOpen: boolean
  onClose: () => void
}

const LABYRINTH_NODES = [
  { id: 1, label: 'Town Square', icon: '🏛️' },
  { id: 2, label: 'Craftsmen Bridge', icon: '🌁' },
  { id: 3, label: 'Market Bazaar', icon: '🏪' },
  { id: 4, label: 'Citadel Gate', icon: '🏰' },
  { id: 5, label: 'King’s Shrine', icon: '⛩️' }
]

export function PlankLabyrinthModal({ isOpen, onClose }: PlankLabyrinthModalProps) {
  const { toast } = useToast()
  const [visitedNodes, setVisitedNodes] = useState<number[]>([1])
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const today = new Date().toDateString()
    const lastLabyrinth = localStorage.getItem('plank_labyrinth_solve_date')
    if (lastLabyrinth === today) {
      setIsCompleted(true)
      setVisitedNodes([1, 2, 3, 4, 5])
    } else {
      setIsCompleted(false)
      setVisitedNodes([1])
    }
  }, [isOpen])

  const handleNodeClick = async (id: number) => {
    if (isCompleted) return
    const nextExpected = visitedNodes.length + 1
    if (id === nextExpected) {
      const nextVisited = [...visitedNodes, id]
      setVisitedNodes(nextVisited)
      if (nextVisited.length === LABYRINTH_NODES.length) {
        setIsCompleted(true)
        const today = new Date().toDateString()
        localStorage.setItem('plank_labyrinth_solve_date', today)
        await addToCharacterStat('gold', 250, 'plank-labyrinth-solve')
        await addToCharacterStat('build_tokens', 3, 'plank-labyrinth-solve')
        toast({
          title: "🧱 Plank labyrinth mastered!",
          description: "King’s path paved! Awarded +250 gold & 3x crafting blocks.",
        })
      }
    } else if (!visitedNodes.includes(id)) {
      toast({
        title: "⚡ Path blocked",
        description: `Follow the sequential path! Step on node ${nextExpected} next.`,
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(op) => { if (!op) onClose() }}>
      <DialogContent className="max-w-md w-full bg-[#120e0b] border border-amber-800/40 text-amber-100 p-6 rounded-2xl shadow-2xl font-serif text-center overflow-hidden z-[100]">
        <DialogHeader className="px-8 sm:px-10">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-950 border border-amber-500/40 flex items-center justify-center mb-2 shadow-lg">
            <Footprints className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-medieval text-amber-300 break-words">
            Plank labyrinth trail
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-300 italic leading-relaxed pt-1">
            Realign the paving stepping stones sequentially (1 → 5) without skipping ahead to reconnect the King’s Shrine!
          </DialogDescription>
        </DialogHeader>

        {/* Buldour Avatar & Story Banner */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-950/50 via-zinc-950 to-zinc-950 border border-amber-500/30 p-2.5 rounded-2xl shadow-md my-1">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)] shrink-0 bg-amber-950 flex items-center justify-center">
            <Image
              src="/images/creatures/Buldour.webp"
              alt="Buldour"
              fill
              className="object-cover"
            />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-xs font-bold font-serif text-amber-300 flex items-center gap-1.5">
              <span>Buldour</span>
              <span className="text-[10px] font-mono text-amber-400/90 font-bold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">Fortress builder</span>
            </div>
            <p className="text-xs text-zinc-200 font-serif italic leading-snug pt-0.5">
              {isCompleted ? (
                <span>&ldquo;Solid as granite! The king&apos;s path is paved true. No dungeon earthquake can crack this foundation!&rdquo;</span>
              ) : (
                <span>&ldquo;Measure thrice, chisel once! Every grand citadel is paved one stepping stone at a time. Guide our path sequentially across the labyrinth!&rdquo;</span>
              )}
            </p>
          </div>
        </div>

        <div className="my-4 p-4 bg-zinc-950/90 rounded-2xl border border-amber-950/60 space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {LABYRINTH_NODES.map((node) => {
              const isVisited = visitedNodes.includes(node.id)
              const isNext = visitedNodes.length + 1 === node.id
              return (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer ${
                    isVisited
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      : isNext
                      ? 'bg-amber-950/80 border-amber-500/50 text-amber-200 animate-bounce'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-600 opacity-60'
                  }`}
                >
                  <span className="text-lg">{node.icon}</span>
                  <span className="text-[10px] font-bold font-mono">#{node.id}</span>
                </button>
              )
            })}
          </div>

          {isCompleted && (
            <div className="p-3 bg-amber-500/20 border border-amber-400/50 rounded-xl text-xs font-bold text-amber-300 animate-in fade-in leading-relaxed">
              ✨ Master builder’s lesson proven! Stepping steadily without rushing ahead reconnected the King’s Shrine. Awarded +250 Gold & 3x Crafting Blocks.
            </div>
          )}
        </div>

        <Button
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-amber-950 font-bold text-xs shadow-lg"
        >
          {isCompleted ? 'Path cross completed ✓' : 'Cancel'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
