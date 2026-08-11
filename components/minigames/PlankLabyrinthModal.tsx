'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Hammer, Sparkles, Trophy, CheckCircle2, RotateCcw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { addToCharacterStat } from '@/lib/character-stats-service'

interface PlankLabyrinthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PlankLabyrinthModal({ isOpen, onClose }: PlankLabyrinthModalProps) {
  const { toast } = useToast()
  const [planksPlaced, setPlanksPlaced] = useState<number[]>([])
  const [isCompleted, setIsCompleted] = useState(false)

  const TARGET_PATH = [0, 1, 2, 3]

  useEffect(() => {
    if (!isOpen) return
    const today = new Date().toDateString()
    const lastLabyrinth = localStorage.getItem('labyrinth_solve_date')
    if (lastLabyrinth === today) {
      setIsCompleted(true)
      setPlanksPlaced(TARGET_PATH)
    } else {
      setIsCompleted(false)
      setPlanksPlaced([])
    }
  }, [isOpen])

  const handleStepClick = async (stepIndex: number) => {
    if (isCompleted) return
    if (planksPlaced.length === stepIndex) {
      const nextPlaced = [...planksPlaced, stepIndex]
      setPlanksPlaced(nextPlaced)

      if (nextPlaced.length === TARGET_PATH.length) {
        setIsCompleted(true)
        const today = new Date().toDateString()
        localStorage.setItem('labyrinth_solve_date', today)
        await addToCharacterStat('gold', 250, 'plank-labyrinth')
        toast({
          title: "🧩 Plank Labyrinth Solved!",
          description: "Path connected! Awarded +250 Gold & 3x Crafting Planks.",
        })
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(op) => { if (!op) onClose() }}>
      <DialogContent className="max-w-md w-full bg-gradient-to-b from-amber-950 via-zinc-950 to-zinc-950 border border-amber-500/40 text-amber-100 p-6 rounded-2xl shadow-2xl font-serif text-center relative overflow-hidden">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            <Hammer className="w-6 h-6 text-amber-300 animate-bounce" />
          </div>
          <DialogTitle className="text-2xl font-medieval text-amber-200">
            Craftsman Plank Labyrinth
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 italic">
            Lay the wooden planks in sequential order (1 → 2 → 3 → 4) to span the chasm!
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-5 bg-zinc-950/90 rounded-2xl border border-amber-900/40 space-y-4">
          <div className="grid grid-cols-4 gap-2.5">
            {[0, 1, 2, 3].map((step) => {
              const isPlaced = planksPlaced.includes(step)
              return (
                <button
                  key={step}
                  disabled={isCompleted || planksPlaced.length !== step}
                  onClick={() => handleStepClick(step)}
                  className={`h-20 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                    isPlaced
                      ? 'bg-amber-600/30 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : planksPlaced.length === step
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 animate-pulse cursor-pointer'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-600 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span className="text-xl">{isPlaced ? '🪵' : '🪚'}</span>
                  <span className="text-[10px] font-bold uppercase">Step {step + 1}</span>
                </button>
              )
            })}
          </div>

          {isCompleted && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold animate-in fade-in">
              ✨ Bridge Complete! +250 Gold & 3x Planks awarded.
            </div>
          )}
        </div>

        <Button
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-amber-950 font-bold uppercase tracking-wider text-xs shadow-lg"
        >
          {isCompleted ? 'Bridge Crossed ✓' : 'Cancel'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
