"use client"

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useGameStore } from '@/stores/game-store'
import { useCitizensStore } from '@/stores/citizensStore'
import { Heart, Sparkles, MessageSquare, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const HINTS_BY_ROUTE: Record<string, string[]> = {
  '/quests': [
    "Focus on your daily habits! Completing them damages the monthly Titan Wyrm.",
    "Check off tasks to earn gold and level up your character attributes.",
    "Favorite your key habits to keep them right at the top of your list!"
  ],
  '/kingdom': [
    "Feed your wandering citizens to keep them producing daily gold taxes!",
    "Expand your kingdom grid to build libraries, barracks, and zen gardens.",
    "Visit the Apotheca or Abbey to brew potions and claim spiritual blessings!"
  ],
  '/chronicle': [
    "Your logbook records your daily progress and sovereign reflections.",
    "Consistency in habit tracking writes the heroic history of Valoreth!"
  ],
  '/character': [
    "Refine your character attributes and unlock legendary titles!",
    "Equip your favorite crest sigil to show your alliance pride."
  ],
  '/social': [
    "Send cheers to fellow allies to boost their daily habit momentum!",
    "Check the realm leaderboards to see where your kingdom ranks."
  ],
  '/profile': [
    "Review your achievement trophies, unlock mythic cards, and tune preferences."
  ],
  '/daily-hub': [
    "Complete your daily routine to maintain your streak and claim rewards!"
  ],
  '/market': [
    "Browse local merchants for rare tiles, materials, and mythic card packs!"
  ]
}

const DEFAULT_HINTS = [
  "Consistency builds your kingdom, one day at a time!",
  "Necrion watches over your realm. Keep your daily streak strong!",
  "Tap your companion or pet anytime for wisdom and tips!"
]

export function CompanionOverlay() {
  const pathname = usePathname()
  const activePartnerId = useGameStore(s => s.activePartnerId)
  const citizens = useCitizensStore(s => s.citizens)
  
  const [hintIndex, setHintIndex] = useState(0)
  const [showSpeech, setShowSpeech] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Filter activePet so if activePartnerId is '000' (Necrion), we DO NOT duplicate Necrion!
  const activePet = useMemo(() => {
    if (!activePartnerId || activePartnerId === '000') return null
    return citizens.find(c => c.id === activePartnerId && c.id !== '000') || null
  }, [citizens, activePartnerId])

  const hints = useMemo(() => {
    const routeKey = Object.keys(HINTS_BY_ROUTE).find(key => pathname?.startsWith(key))
    return routeKey ? HINTS_BY_ROUTE[routeKey] : DEFAULT_HINTS
  }, [pathname])

  // Auto-show speech bubble briefly on route change or initial load
  useEffect(() => {
    setHintIndex(0)
    setShowSpeech(true)
    const timer = setTimeout(() => setShowSpeech(false), 7000)
    return () => clearTimeout(timer)
  }, [pathname])

  const activeHints = hints || DEFAULT_HINTS
  const currentHint = activeHints[hintIndex % activeHints.length] || DEFAULT_HINTS[0]

  const handleNextHint = () => {
    setIsAnimating(true)
    setHintIndex(prev => prev + 1)
    setShowSpeech(true)
    setTimeout(() => setIsAnimating(false), 300)
  }

  // Don't render on auth or full-screen gaming pages if unauthenticated
  if (pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up') || pathname === '/login') {
    return null
  }

  return (
    <div className="fixed bottom-[68px] right-2 md:bottom-4 md:right-6 z-40 flex flex-col items-end pointer-events-none transition-all duration-300">
      {/* Speech Bubble (Opens upward away from bottom nav) */}
      <AnimatePresence>
        {showSpeech && currentHint && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={handleNextHint}
            className="mb-2 bg-zinc-950/95 border border-amber-500/50 text-amber-100 p-2.5 rounded-2xl shadow-2xl pointer-events-auto cursor-pointer max-w-[200px] sm:max-w-[240px] relative group"
          >
            <div className="flex items-start justify-between gap-1.5">
              <p className="text-[10px] sm:text-[11px] font-medium leading-tight text-amber-100">
                {currentHint}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSpeech(false)
                }}
                className="text-zinc-500 hover:text-amber-400 p-0.5 rounded shrink-0"
                aria-label="Dismiss speech bubble"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="text-[8px] text-amber-400/70 font-mono mt-1 text-right">
              Tap for next tip 👉
            </div>

            {/* Speech Tail */}
            <div className="absolute -bottom-2 right-5 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-zinc-950"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Characters Standing Side-by-Side */}
      <div className="flex items-end gap-1.5 pointer-events-auto">
        {/* Toggle Speech Bubble Button */}
        {!showSpeech && (
          <button
            onClick={() => setShowSpeech(true)}
            className="mb-1 p-1.5 rounded-full bg-zinc-950/90 border border-amber-500/40 text-amber-400 shadow-md hover:scale-110 active:scale-95 transition-transform"
            title="Show mentor tip"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        )}

        {/* 1. Necrion (Realm Mentor Companion) - Rendered as a crisp circular token badge */}
        <div
          onClick={handleNextHint}
          className={`relative group cursor-pointer transition-transform duration-200 ${
            isAnimating ? 'scale-125 -translate-y-2' : 'hover:scale-110 active:scale-95'
          }`}
          title="Necrion (Realm Mentor) - Tap for guidance"
        >
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full border-2 border-emerald-500/60 bg-zinc-950/90 shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center justify-center p-0.5 overflow-hidden">
            <div className="relative w-full h-full">
              <Image
                src="/images/creatures/000.png"
                alt="Necrion Companion"
                fill
                className="object-cover scale-125 translate-y-1"
                unoptimized
              />
            </div>
          </div>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-zinc-950/90 text-[8px] text-emerald-400 font-bold px-1 rounded border border-emerald-500/40 whitespace-nowrap shadow-sm opacity-90 group-hover:opacity-100">
            Necrion
          </span>
        </div>

        {/* 2. Active Pet / Partner Creature (Standing next to Necrion - Only if NOT Necrion) */}
        {activePet && (
          <div
            onClick={handleNextHint}
            className={`relative group cursor-pointer transition-transform duration-200 ${
              isAnimating ? 'scale-125 -translate-y-2' : 'hover:scale-110 active:scale-95'
            }`}
            title={`${activePet.name} (Active Pet)`}
          >
            <div className="relative w-11 h-11 sm:w-14 sm:h-14 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]">
              <Image
                src={
                  activePet.isMythic
                    ? `/images/Mythics/${activePet.filename}?v=2`
                    : `/images/creatures/${activePet.filename}`
                }
                alt={activePet.name}
                fill
                className="object-contain animate-float"
                unoptimized
              />
            </div>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-zinc-950/90 text-[8px] text-amber-400 font-bold px-1 rounded border border-amber-500/40 whitespace-nowrap shadow-sm opacity-90 group-hover:opacity-100 flex items-center gap-0.5">
              <Heart className="w-2 h-2 fill-amber-400 text-amber-400 shrink-0" />
              {activePet.name}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
