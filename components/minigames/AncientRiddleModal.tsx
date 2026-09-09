'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BookOpen, Sparkles, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { addToCharacterStat } from '@/lib/character-stats-service'

import Image from 'next/image'

interface AncientRiddleModalProps {
  isOpen: boolean
  onClose: () => void
}

const TOWN_RIDDLES = [
  {
    id: 'r-1',
    question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    options: ["An echo", "A ghost", "A thought", "A shadow"],
    correctIndex: 0,
    rewardDesc: "+150 gold & 1x blueprint scroll"
  },
  {
    id: 'r-2',
    question: "The more you take, the more you leave behind. What am I?",
    options: ["Footsteps", "Memories", "Time", "Breath"],
    correctIndex: 0,
    rewardDesc: "+200 gold & 2x steel blocks"
  },
  {
    id: 'r-3',
    question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
    options: ["A map", "A globe", "A tapestry", "A mirror"],
    correctIndex: 0,
    rewardDesc: "+180 gold & 1x streak freeze shield"
  },
  {
    id: 'r-4',
    question: "I'm light as a feather, yet the strongest knight cannot hold me for much more than a minute. What am I?",
    options: ["Breath", "A whisper", "A feather", "Gold coins"],
    correctIndex: 0,
    rewardDesc: "+250 gold & 1x monument blueprint"
  },
  {
    id: 'r-5',
    question: "What has roots as nobody sees, is taller than trees, up, up it goes, and yet never grows?",
    options: ["A mountain", "A castle", "The sky", "A river"],
    correctIndex: 0,
    rewardDesc: "+220 gold & 3x botanical reagents"
  },
  {
    id: 'r-6',
    question: "Voiceless it cries, wingless flutters, toothless bites, mouthless mutters. What is it?",
    options: ["The wind", "A brook", "Thunder", "A shadow"],
    correctIndex: 0,
    rewardDesc: "+200 gold & 1x serene lake blueprint"
  },
  {
    id: 'r-7',
    question: "What can travel around the world while staying in a single corner?",
    options: ["A stamp", "A compass", "A star", "A sparrow"],
    correctIndex: 0,
    rewardDesc: "+175 gold & 100 character XP"
  },
  {
    id: 'r-8',
    question: "What has many keys but cannot open a single lock?",
    options: ["A piano", "A lockbox", "A skeleton", "A chest"],
    correctIndex: 0,
    rewardDesc: "+210 gold & 2x crystal shards"
  },
  {
    id: 'r-9',
    question: "I protect your streak when a day is missed, freezing decay until you check in. What am I?",
    options: ["A Streak Scroll Shield", "A Health Elixir", "A City Tax Token", "A Paragon Crest"],
    correctIndex: 0,
    rewardDesc: "+190 Gold & 1x Streak Scroll"
  },
  {
    id: 'r-10',
    question: "I carry 7 virtue hourglasses measuring Might, Knowledge, Honor, Castle, Craft, Vitality, and Wellness. What am I?",
    options: ["The House Cup", "The Town Clock", "The Dungeon Altar", "The Market Scale"],
    correctIndex: 0,
    rewardDesc: "+300 Gold & +10 Virtue Points"
  },
  {
    id: 'r-11',
    question: "I am the ancient shadow slumbering deep below, feeding on broken vows and idle promises until habit fires drive me back. Who am I?",
    options: ["Necrion the Shadow Lord", "The Red Cyclops", "The Abyssal Kraken", "The Stone Golem"],
    correctIndex: 0,
    rewardDesc: "+250 Gold & 150 Character XP"
  },
  {
    id: 'r-12',
    question: "I wander from kingdom to kingdom with a lute in hand, singing ballads of brave rulers and playing soothing melodies. Who am I?",
    options: ["Alistair the Traveling Bard", "Archmage Turtoisy", "Ignisio the Sprite", "Barnaby the Scholar"],
    correctIndex: 0,
    rewardDesc: "+180 Gold & 5 Focus Points"
  },
  {
    id: 'r-13',
    question: "I am the wise sage who counsels patience, reminding runners that sprinting too soon snuffs out your sparks. Who am I?",
    options: ["Archmage Turtoisy", "Sparky the Drake", "Oaky the Guardian", "Flippur the Otter"],
    correctIndex: 0,
    rewardDesc: "+200 Gold & 1x Ancient Blueprint"
  },
  {
    id: 'r-14',
    question: "I am the proud monarch of the Sunspire Empire who rides from the Iron Peaks with imperial guards to forge an alliance. Who am I?",
    options: ["Queen Valandriel", "Princess Beatrice", "Lady Seraphina", "Empress Morgana"],
    correctIndex: 0,
    rewardDesc: "+240 Gold & +15 House Cup Points"
  }
];

export function AncientRiddleModal({ isOpen, onClose }: AncientRiddleModalProps) {
  const { toast } = useToast()
  const [riddle, setRiddle] = useState(TOWN_RIDDLES[0]!)
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [strikes, setStrikes] = useState(3)

  useEffect(() => {
    if (!isOpen) return
    const today = new Date().toDateString()
    const lastRiddle = localStorage.getItem('town_riddle_solve_date')
    
    // Pick a random unique riddle each day
    const dayHash = (new Date().getFullYear() * 365 + new Date().getMonth() * 30 + new Date().getDate()) % TOWN_RIDDLES.length
    const todaysRiddle = TOWN_RIDDLES[dayHash] || TOWN_RIDDLES[0]!
    setRiddle(todaysRiddle)
    setShowHint(false)
    setStrikes(3)

    if (lastRiddle === today) {
      setIsAnswered(true)
      setIsCorrect(true)
    } else {
      setIsAnswered(false)
      setIsCorrect(false)
      setSelectedOpt(null)
    }
  }, [isOpen])

  const handleSelectOption = async (index: number) => {
    if (isAnswered) return
    setSelectedOpt(index)
    setIsAnswered(true)

    if (index === riddle.correctIndex) {
      setIsCorrect(true)
      const today = new Date().toDateString()
      localStorage.setItem('town_riddle_solve_date', today)
      await addToCharacterStat('gold', 200, 'town-riddle-solve')
      toast({
        title: "📜 Town riddle solved!",
        description: `Correct! Awarded ${riddle.rewardDesc}.`,
      })
    } else {
      setIsCorrect(false)
      toast({
        title: "❌ Incorrect answer",
        description: "The town scholar's scroll remains sealed today. Return tomorrow!",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(op) => { if (!op) onClose() }}>
      <DialogContent className="max-w-md w-full bg-gradient-to-b from-blue-950 via-zinc-950 to-zinc-950 border border-blue-500/40 text-blue-100 p-6 rounded-2xl shadow-2xl font-serif text-center max-h-[88dvh] overflow-y-auto custom-scrollbar z-[100]">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            <BookOpen className="w-6 h-6 text-blue-300 animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-medieval text-blue-200">
            Town scholar&apos;s ancient riddle
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 italic">
            Solve today&apos;s unique town lore riddle to unearth blueprints, virtue points, and gold.
          </DialogDescription>
        </DialogHeader>

        {/* Sage Owl Avatar & Story Banner */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-950/50 via-zinc-950 to-zinc-950 border border-blue-500/30 p-2.5 rounded-2xl shadow-md my-1">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-blue-400/60 shadow-[0_0_10px_rgba(59,130,246,0.3)] shrink-0 bg-blue-950 flex items-center justify-center">
            <Image
              src="/images/creatures/SageOwl.webp"
              alt="Sage Owl"
              fill
              className="object-cover"
            />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-xs font-bold font-serif text-blue-300 flex items-center gap-1.5">
              <span>Sage Owl</span>
              <span className="text-[10px] font-mono text-blue-400/90 font-bold bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-500/30">Stargazing astronomer</span>
            </div>
            <p className="text-xs text-zinc-200 font-serif italic leading-snug pt-0.5">
              {isAnswered ? (
                isCorrect ? (
                  <span>&ldquo;Wisely deduced, champion! The archives open to sharp minds. May this knowledge guide your kingdom today!&rdquo;</span>
                ) : (
                  <span>&ldquo;Hoot... Not quite, friend. The constellations will realign tomorrow. Rest your thoughts and return at dawn!&rdquo;</span>
                )
              ) : (
                <span>&ldquo;Hoot! The stars and scrolls whisper ancient secrets to those who look closely. Ponder today&apos;s lore riddle carefully, traveler!&rdquo;</span>
              )}
            </p>
          </div>
        </div>

        <div className="my-4 p-4 bg-zinc-950/90 rounded-2xl border border-blue-900/40 space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-blue-900/30 pb-2">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Scholar attempts:</span>
            <div className="flex gap-1 text-xs">
              <span className="text-red-400 font-mono font-bold">❤️ ❤️ ❤️</span>
            </div>
          </div>

          <p className="text-sm font-bold text-amber-200 leading-relaxed italic border-b border-blue-900/30 pb-3">
            &ldquo;{riddle.question}&rdquo;
          </p>

          {!showHint ? (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="text-[10px] text-amber-400 hover:text-amber-300 font-mono font-bold flex items-center gap-1 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all"
            >
              📜 Read clue scroll (realm lore hint)
            </button>
          ) : (
            <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-[11px] text-amber-300 italic font-serif">
              ✨ <strong>Scholar hint:</strong> Reflect on your daily habit routines and kingdom tile buildings!
            </div>
          )}

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
                  className={`w-full p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {isAnswered && idx === riddle.correctIndex && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {isAnswered && selectedOpt === idx && idx !== riddle.correctIndex && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                </button>
              )
            })}
          </div>

          {isAnswered && isCorrect && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold text-center animate-in fade-in">
              ✨ Reward unlocked: {riddle.rewardDesc}
            </div>
          )}
        </div>

        <Button
          onClick={onClose}
          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs shadow-lg"
        >
          {isAnswered ? 'Close scroll' : 'Cancel'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
