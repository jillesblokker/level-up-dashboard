'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BookOpen, Sparkles, CheckCircle2, HelpCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { addToCharacterStat } from '@/lib/character-stats-service'

interface AncientRiddleModalProps {
  isOpen: boolean
  onClose: () => void
}

const RIDDLES = [
  {
    question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
    options: ["A Map", "A Globe", "A Painting", "A Mirror"],
    correctIndex: 0,
    rewardDesc: "+150 Gold & 1x Kingdom Blueprint Scroll"
  },
  {
    question: "The more of me you complete each day, the stronger your town grows. What am I?",
    options: ["Daily Habits", "Dungeon Traps", "Tax Coins", "Night Spells"],
    correctIndex: 0,
    rewardDesc: "+200 Gold & 2x Essence Orbs"
  },
  {
    question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    options: ["An Echo", "A Shadow", "A Whisper", "A Bell"],
    correctIndex: 0,
    rewardDesc: "+180 Gold & 1x Arcane Scroll"
  }
]

export function AncientRiddleModal({ isOpen, onClose }: AncientRiddleModalProps) {
  const { toast } = useToast()
  const [riddle, setRiddle] = useState(RIDDLES[0]!)
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const today = new Date().toDateString()
    const lastRiddle = localStorage.getItem('riddle_solve_date')
    if (lastRiddle === today) {
      setIsAnswered(true)
      setIsCorrect(true)
    } else {
      setIsAnswered(false)
      setIsCorrect(false)
      setSelectedOpt(null)
      setRiddle(RIDDLES[Math.floor(Math.random() * RIDDLES.length)]!)
    }
  }, [isOpen])

  const handleSelectOption = async (index: number) => {
    if (isAnswered) return
    setSelectedOpt(index)
    setIsAnswered(true)

    if (index === riddle.correctIndex) {
      setIsCorrect(true)
      const today = new Date().toDateString()
      localStorage.setItem('riddle_solve_date', today)
      await addToCharacterStat('gold', 150, 'ancient-riddle')
      toast({
        title: "📜 Riddle Solved!",
        description: `Correct! Awarded ${riddle.rewardDesc}.`,
      })
    } else {
      setIsCorrect(false)
      toast({
        title: "❌ Incorrect Answer",
        description: "The ancient scroll remains sealed today. Return tomorrow!",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(op) => { if (!op) onClose() }}>
      <DialogContent className="max-w-md w-full bg-gradient-to-b from-blue-950 via-zinc-950 to-zinc-950 border border-blue-500/40 text-blue-100 p-6 rounded-2xl shadow-2xl font-serif text-center relative overflow-hidden">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            <BookOpen className="w-6 h-6 text-blue-300 animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-medieval text-blue-200">
            Scholars Ancient Riddle
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 italic">
            Solve the daily scholar riddle to unearth lost realm blueprints and gold.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-4 bg-zinc-950/90 rounded-2xl border border-blue-900/40 space-y-4 text-left">
          <p className="text-sm font-bold text-amber-200 leading-relaxed italic border-b border-blue-900/30 pb-3">
            &ldquo;{riddle.question}&rdquo;
          </p>

          <div className="space-y-2">
            {riddle.options.map((opt, idx) => {
              let btnStyle = "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-blue-500/50"
              if (isAnswered) {
                if (idx === riddle.correctIndex) btnStyle = "bg-emerald-950 border-emerald-500 text-emerald-200"
                else if (selectedOpt === idx) btnStyle = "bg-red-950 border-red-500 text-red-200"
              }
              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {isAnswered && idx === riddle.correctIndex && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        <Button
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold uppercase tracking-wider text-xs shadow-lg"
        >
          {isAnswered ? 'Close Scroll' : 'Cancel'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
