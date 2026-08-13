'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Hammer, Sparkles, Trophy, CheckCircle2, RotateCcw, Footprints } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { addToCharacterStat } from '@/lib/character-stats-service'

interface PlankLabyrinthModalProps {
  isOpen: boolean
  onClose: () => void
}

const PATH_STEPS = [
  { id: 0, label: 'Town Square', icon: '🏛️' },
  { id: 1, label: 'Craftsmen Bridge', icon: '🌁' },
  { id: 2, label: 'Market Bazaar', icon: '🏪' },
  { id: 3, label: 'Citadel Gate', icon: '🏰' },
  { id: 4, label: 'Sovereign Shrine', icon: '⛩️' }
]

export function PlankLabyrinthModal({ isOpen, onClose }: PlankLabyrinthModalProps) {
  const { toast } = useToast()
  const [planksPlaced, setPlanksPlaced] = useState<number[]>([])
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
        toast({
          title: "🧱 Plank Labyrinth Mastered!",
          description: "King’s path paved! Awarded +250 Gold & 3x Crafting Blocks.",
        })
      }
    } else if (!visitedNodes.includes(id)) {
      toast({
        title: "⚡ Path Blocked",
        description: `Follow the sequential path! Step on node ${nextExpected} next.`,
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(op) => { if (!op) onClose() }}>
      <DialogContent className="max-w-md w-full bg-[#120e0b] border border-amber-800/40 text-amber-100 p-6 rounded-2xl shadow-2xl font-serif text-center overflow-hidden z-[100]">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-950 border border-amber-500/40 flex items-center justify-center mb-2 shadow-lg">
            <Footprints className="w-6 h-6 text-amber-400 animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-medieval text-amber-300">
            Plank Labyrinth Trail
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 italic">
            Tap the town tiles sequentially (1 → 2 → 3 → 4 → 5) to pave the road to the King’s Altar!
          </DialogDescription>
        </DialogHeader>

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
            <div className="p-3 bg-amber-500/20 border border-amber-400/50 rounded-xl text-xs font-bold text-amber-300 animate-in fade-in">
              ✨ King’s Path Connected! +250 Gold & 3x Building Blocks awarded.
            </div>
          )}
        </div>

        <Button
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-amber-950 font-bold uppercase tracking-wider text-xs shadow-lg"
        >
          {isCompleted ? 'Path Cross Completed ✓' : 'Cancel'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
