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
  const [showSpeech, setShowSpeech] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  const activePartner = useMemo(() => {
    return citizens.find(c => c.id === activePartnerId)
  }, [citizens, activePartnerId])

  const hints = useMemo(() => {
    const routeKey = Object.keys(HINTS_BY_ROUTE).find(key => pathname?.startsWith(key))
    return routeKey ? HINTS_BY_ROUTE[routeKey] : DEFAULT_HINTS
  }, [pathname])

  // Reset hint index on route change
  useEffect(() => {
    setHintIndex(0)
    setShowSpeech(true)
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
    <div className="fixed bottom-[72px] right-3 md:bottom-5 md:right-6 z-40 flex flex-col items-end pointer-events-none transition-all duration-300">
      {/* Speech Bubble */}
      <AnimatePresence>
        {showSpeech && currentHint && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={handleNextHint}
            className="mb-2 bg-zinc-950/95 border border-amber-500/40 text-amber-100 p-3 rounded-2xl shadow-2xl pointer-events-auto cursor-pointer max-w-[220px] sm:max-w-[260px] relative group"
          >
            <div className="flex items-start justify-between gap-1.5">
              <p className="text-[11px] font-medium leading-tight text-amber-100">
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
            <div className="text-[9px] text-amber-400/60 font-mono mt-1 text-right flex items-center justify-end gap-1">
              <span>Tap for tip</span>
              <span>👉</span>
            </div>

            {/* Speech Tail */}
            <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-zinc-950"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Characters Standing Side-by-Side */}
      <div className="flex items-end gap-2 pointer-events-auto">
        {/* 1. Necrion (Realm Mentor Companion) */}
        <div
          onClick={handleNextHint}
          className={`relative group cursor-pointer transition-transform duration-200 ${
            isAnimating ? 'scale-125 -translate-y-2' : 'hover:scale-110 active:scale-95'
          }`}
          title="Necrion (Realm Companion) - Tap for guidance"
        >
          <div className="relative w-13 h-13 sm:w-16 sm:h-16 drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]">
            <Image
              src="/images/creatures/000.png"
              alt="Necrion Companion"
              fill
              className="object-contain animate-float"
              unoptimized
            />
          </div>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-zinc-950/90 text-[8px] text-emerald-400 font-bold px-1 rounded border border-emerald-500/30 whitespace-nowrap shadow-sm opacity-90 group-hover:opacity-100">
            Necrion
          </span>
        </div>

        {/* 2. Active Pet / Partner Creature (Standing next to Necrion) */}
        {activePartner && (
          <div
            onClick={handleNextHint}
            className={`relative group cursor-pointer transition-transform duration-200 ${
              isAnimating ? 'scale-125 -translate-y-2' : 'hover:scale-110 active:scale-95'
            }`}
            title={`${activePartner.name} (Active Pet)`}
          >
            <div className="relative w-11 h-11 sm:w-14 sm:h-14 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]">
              <Image
                src={
                  activePartner.isMythic
                    ? `/images/Mythics/${activePartner.filename}?v=2`
                    : `/images/creatures/${activePartner.filename}`
                }
                alt={activePartner.name}
                fill
                className="object-contain animate-float"
                unoptimized
              />
            </div>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-zinc-950/90 text-[8px] text-amber-400 font-bold px-1 rounded border border-amber-500/30 whitespace-nowrap shadow-sm opacity-90 group-hover:opacity-100 flex items-center gap-0.5">
              <Heart className="w-2 h-2 fill-amber-400 text-amber-400 shrink-0" />
              {activePartner.name}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
