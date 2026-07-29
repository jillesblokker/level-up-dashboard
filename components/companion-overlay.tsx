"use client"

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useGameStore } from '@/stores/game-store'
import { useCitizensStore } from '@/stores/citizensStore'
import { getUserPreference } from '@/lib/user-preferences-manager'
import { Heart, Sparkles, MessageSquare, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const HINTS_BY_ROUTE: Record<string, string[]> = {
  '/quests': [
    "Looking for a quest to add to your list? Here is some inspiration: visit a local market or take a new route home!",
    "Need quest inspiration? Try: drink 2 full glasses of fresh water before noon or step outside for 5 minutes of quiet sunlight.",
    "Searching for habit inspiration? How about: do 15 push-ups or stretch for 3 minutes after waking up!",
    "Here is some daily quest inspiration: clean and organize your main desk area or write down 3 things you are grateful for today.",
    "Focus on your daily habits! Completing them damages the monthly Titan Wyrm.",
    "Favorite your key habits to keep them right at the top of your list!"
  ],
  '/kingdom': [
    "Looking for a quest to add to your list? Here is some inspiration: visit a local market or take a new route home!",
    "Feed your wandering citizens to keep them producing daily gold taxes!",
    "Expand your kingdom grid to build libraries, barracks, and zen gardens.",
    "Visit the Apotheca or Abbey to brew potions and claim spiritual blessings!"
  ],
  '/chronicle': [
    "Your logbook records your daily progress and sovereign reflections.",
    "Consistency in habit tracking writes the heroic history of Valoreth!",
    "Quest inspiration for your logbook: call or text an old friend to catch up, or go for a 15-minute evening walk."
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
    "Looking for a quest to add to your list? Here is some inspiration: visit a local market or take a new route home!",
    "Complete your daily routine to maintain your streak and claim rewards!"
  ],
  '/market': [
    "Browse local merchants for rare tiles, materials, and mythic card packs!",
    "Daily quest inspiration: visit a local market or take a new route home!"
  ]
}

const DEFAULT_HINTS = [
  "Looking for a quest to add to your list? Here is some inspiration: visit a local market or take a new route home!",
  "Consistency builds your kingdom, one day at a time!",
  "Need quest inspiration? Try: drink 2 full glasses of fresh water before noon or step outside for 5 minutes of quiet sunlight.",
  "Necrion watches over your realm. Keep your daily streak strong!",
  "Tap your companion or pet anytime for wisdom and tips!"
]

export function CompanionOverlay() {
  const pathname = usePathname()
  const activePartnerId = useGameStore(s => s.activePartnerId)
  const citizens = useCitizensStore(s => s.citizens)
  
  const [hintIndex, setHintIndex] = useState(0)
  const [showSpeech, setShowSpeech] = useState(false)
  const [speakerName, setSpeakerName] = useState<'necrion' | 'guardian'>('necrion')
  const [isAnimating, setIsAnimating] = useState(false)
  const [guardianId, setGuardianId] = useState<string>('ember-drake')

  // Settings Toggles State
  const [showNecrion, setShowNecrion] = useState(true)
  const [showGuardian, setShowGuardian] = useState(true)

  // Dynamic Randomized Layout State (Spacing, Facing Flips, Depth Offsets)
  const [layoutState, setLayoutState] = useState({
    gapClass: 'gap-4',
    necrionScaleX: 1,
    guardianScaleX: 1,
    necrionY: 0,
    guardianY: 0
  })

  const randomizeLayout = React.useCallback(() => {
    const gaps = ['gap-2 sm:gap-3', 'gap-4 sm:gap-6', 'gap-6 sm:gap-8', 'gap-3 sm:gap-5']
    const randomGap = gaps[Math.floor(Math.random() * gaps.length)]
    
    // 50% chance Necrion faces right towards Guardian, 50% faces left
    const necrionFlipped = Math.random() > 0.5
    
    // 50% chance Guardian faces left towards Necrion, 50% faces right
    const guardianFlipped = Math.random() > 0.5

    // Subtle depth offset (-2px to +3px vertical shift)
    const nY = Math.floor(Math.random() * 6) - 3
    const gY = Math.floor(Math.random() * 6) - 3

    setLayoutState({
      gapClass: randomGap || 'gap-4 sm:gap-6',
      necrionScaleX: necrionFlipped ? -1 : 1,
      guardianScaleX: guardianFlipped ? -1 : 1,
      necrionY: nY,
      guardianY: gY
    })
  }, [])

  // Randomize layout on route changes
  useEffect(() => {
    randomizeLayout()
  }, [pathname, randomizeLayout])

  // Load Settings and Guardian State
  const loadVisibilitySettings = async () => {
    try {
      const savedCompanion = localStorage.getItem("show-companion-necrion")
      if (savedCompanion !== null) {
        setShowNecrion(savedCompanion === "true")
      }
      const savedGuardian = localStorage.getItem("show-guardian-partner")
      if (savedGuardian !== null) {
        setShowGuardian(savedGuardian === "true")
      }

      // Check user preferences & local storage for active guardian
      const gPref = await getUserPreference('habit_guardian_state') as any
      if (gPref && gPref.selectedId) {
        setGuardianId(gPref.selectedId)
        return
      }

      const savedGuardianState = localStorage.getItem('pref:habit_guardian_state') || localStorage.getItem('thrivehaven_guardian_state')
      if (savedGuardianState) {
        const parsed = JSON.parse(savedGuardianState)
        if (parsed.selectedId) {
          setGuardianId(parsed.selectedId)
          return
        }
      }
    } catch {
      // ignore error
    }
  }

  useEffect(() => {
    loadVisibilitySettings()
    
    const handleGuardianChange = (e: any) => {
      if (e?.detail?.selectedId) {
        setGuardianId(e.detail.selectedId)
      } else {
        loadVisibilitySettings()
      }
    }

    window.addEventListener('settings:companionVisibilityChanged', loadVisibilitySettings)
    window.addEventListener('guardianChanged', handleGuardianChange)
    return () => {
      window.removeEventListener('settings:companionVisibilityChanged', loadVisibilitySettings)
      window.removeEventListener('guardianChanged', handleGuardianChange)
    }
  }, [])

  // Listen to quest completions to trigger companion speech
  useEffect(() => {
    const handleQuestCompleted = () => {
      setShowSpeech(true)
      const timer = setTimeout(() => setShowSpeech(false), 5000)
      return () => clearTimeout(timer)
    }

    window.addEventListener('questCompleted', handleQuestCompleted as EventListener)
    window.addEventListener('challengeCompleted', handleQuestCompleted as EventListener)
    return () => {
      window.removeEventListener('questCompleted', handleQuestCompleted as EventListener)
      window.removeEventListener('challengeCompleted', handleQuestCompleted as EventListener)
    }
  }, [])

  // Resolve active Guardian or partner creature PNG
  const activeGuardian = useMemo(() => {
    // 1. Check partner citizen from game store (e.g. Leaf, Dolphio, Flamio) if active and NOT Necrion ('000')
    if (activePartnerId && activePartnerId !== '000') {
      const citizen = citizens.find(c => c.id === activePartnerId && c.id !== '000')
      if (citizen) {
        const img = citizen.isMythic 
          ? `/images/Mythics/${citizen.filename}?v=2`
          : `/images/creatures/${citizen.filename}`
        return { name: citizen.name, image: img }
      }
    }

    // 2. Check selected Guardian (e.g. Ember Drake, Sage Owl, Spirit Sprite, Grove Fox)
    if (guardianId === 'ember-drake') return { name: 'Ember Drake', image: '/images/creatures/EmberDrake.webp' }
    if (guardianId === 'sage-owl') return { name: 'Sage Owl', image: '/images/creatures/SageOwl.webp' }
    if (guardianId === 'spirit-sprite') return { name: 'Spirit Sprite', image: '/images/creatures/SpiritSprite.webp' }
    if (guardianId === 'grove-fox') return { name: 'Grove Fox', image: '/images/creatures/SpiritSprite.webp' }

    // Fallback active Guardian (Ember Drake)
    return { name: 'Ember Drake', image: '/images/creatures/EmberDrake.webp' }
  }, [citizens, activePartnerId, guardianId])

  const hints = useMemo(() => {
    const routeKey = Object.keys(HINTS_BY_ROUTE).find(key => pathname?.startsWith(key))
    return routeKey ? HINTS_BY_ROUTE[routeKey] : DEFAULT_HINTS
  }, [pathname])

  const activeHints = hints || DEFAULT_HINTS
  const currentHint = activeHints[hintIndex % activeHints.length] || DEFAULT_HINTS[0]

  const handleTapCharacter = (speaker: 'necrion' | 'guardian') => {
    setIsAnimating(true)
    setSpeakerName(speaker)
    setHintIndex(prev => prev + 1)
    setShowSpeech(true)
    randomizeLayout()
    setTimeout(() => setIsAnimating(false), 300)
  }

  // Hide completely if both toggled off or on auth pages
  if ((!showNecrion && !showGuardian) || pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up') || pathname === '/login') {
    return null
  }

  return (
    <div className="fixed bottom-[68px] right-3 md:bottom-0 md:right-6 z-40 flex flex-col items-end pointer-events-none transition-all duration-300">
      {/* Speech Bulb Popup (Only appears on tap or quest completion) */}
      <AnimatePresence>
        {showSpeech && currentHint && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={() => handleTapCharacter(speakerName)}
            className="mb-2 bg-white text-zinc-950 border-2 border-zinc-200 p-3 rounded-2xl shadow-2xl pointer-events-auto cursor-pointer max-w-[200px] sm:max-w-[240px] relative group"
          >
            <div className="flex items-start justify-between gap-1.5">
              <p className="text-[11px] font-medium text-zinc-900 leading-snug">
                {currentHint}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSpeech(false)
                }}
                className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded shrink-0"
                aria-label="Dismiss speech bulb"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Classic White Speech Tail */}
            <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Characters Standing Side-by-Side with Dynamic Spacing & Facing Directions */}
      <div className={`flex items-end ${layoutState.gapClass} pointer-events-auto transition-all duration-500`}>
        {/* 1. Necrion (Realm Mentor Companion) - Subtle Floating Levitation & Facing Flip */}
        {showNecrion && (
          <div
            onClick={() => handleTapCharacter('necrion')}
            style={{
              transform: `translateY(${layoutState.necrionY}px) scaleX(${layoutState.necrionScaleX})`
            }}
            className={`relative group cursor-pointer transition-all duration-300 ${
              isAnimating && speakerName === 'necrion' ? 'scale-115 -translate-y-1' : 'hover:scale-105 active:scale-95'
            }`}
            title="Necrion (Realm Companion)"
          >
            <div className="relative w-12 h-16 sm:w-16 sm:h-22 drop-shadow-[0_6px_10px_rgba(0,0,0,0.8)]">
              <Image
                src="/images/creatures/Necrion.png"
                alt="Necrion Companion"
                fill
                className="object-contain animate-float"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* 2. Guardian / Companion Pet - Gentle Breathing Sway & Facing Flip */}
        {showGuardian && activeGuardian && (
          <div
            onClick={() => handleTapCharacter('guardian')}
            style={{
              transform: `translateY(${layoutState.guardianY}px) scaleX(${layoutState.guardianScaleX})`
            }}
            className={`relative group cursor-pointer transition-all duration-300 ${
              isAnimating && speakerName === 'guardian' ? 'scale-115 -translate-y-1' : 'hover:scale-105 active:scale-95'
            }`}
            title={`${activeGuardian.name} (Active Guardian)`}
          >
            <div className="relative w-11 h-14 sm:w-14 sm:h-18 drop-shadow-[0_6px_10px_rgba(0,0,0,0.8)]">
              <Image
                src={activeGuardian.image}
                alt={activeGuardian.name}
                fill
                className="object-contain animate-pulse"
                unoptimized
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
