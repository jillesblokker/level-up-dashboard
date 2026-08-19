"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useGameStore } from '@/stores/game-store'
import { useCitizensStore } from '@/stores/citizensStore'
import { getUserPreference } from '@/lib/user-preferences-manager'
import { Heart, Sparkles, MessageSquare, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Cryptic riddle-style hints keyed by achievement ID.
// Only shown for achievements the player has NOT unlocked yet.
const CRYPTIC_ACHIEVEMENT_HINTS: Record<string, string> = {
  // Creature collection — quest milestones
  '001': "🔮 They say a tiny flame stirs in the embers when a hero proves their first resolve.",
  '002': "🔮 Some creatures only reveal themselves after a trail of ten conquered dawns.",
  '003': "🔮 A fire spirit of great power awaits those who walk the path of fifty sunrises.",
  '004': "🔮 The waters whisper of a creature born when your garden first drinks the rain.",
  '005': "🔮 Five gardens nourished... and something stirs beneath the surface.",
  '006': "🔮 A great aquatic guardian sleeps. It demands ten rivers fed by your hand.",
  '007': "🔮 The ancient woods hold secrets. Plant a single seed and something may watch.",
  '008': "🔮 Five saplings planted by steady hands... the forest spirits begin to notice.",
  '009': "🔮 A timeless protector of the grove awakens only for the most devoted foresters.",
  '010': "🔮 When the mountains crumble, something small emerges from the rubble.",
  '011': "🔮 Persistent demolishers attract stonier companions.",
  '012': "🔮 They say the mountain king only rises when ten peaks have fallen.",
  '013': "🔮 A single frost shard placed on barren ground... and a chill spirit stirs.",
  '014': "🔮 Five frozen tiles form a pattern only the cold-hearted can see.",
  '015': "🔮 The blizzard queen crowns those who master ten tiles of frozen domain.",
  '016': "🔮 The hum of a city draws a tiny spark from the ether.",
  '017': "🔮 Five cities built... the lightning grows restless.",
  '018': "🔮 Master of the grid, lord of ten cities — the storm answers your call.",

  // Dragon legends — quest volume
  '101': "🔮 A hundred conquered habits echo through the caves. Something ancient stirs.",
  '102': "🔮 Five hundred marks of discipline... a dragon of legend circles overhead.",
  '103': "🔮 Only those who etch a thousand victories may summon the supreme dragon lord.",

  // Milestone creatures
  '104': "🔮 A cheerful shell appears when you cross your very first finish line.",
  '105': "🔮 Five long journeys completed... a wiser turtle emerges from the deep.",
  '106': "🔮 Ten great milestones reached. The legendary shell-bearer has heard your name.",

  // Social — friends & quests
  '107': "🔮 A lone wolf survives, but extending your hand unlocks something more.",
  '108': "🔮 Gather a handful of trusted companions and a loyal creature will find you.",
  '109': "🔮 Ten banners united under one cause — a noble spirit takes notice.",
  '110': "🔮 Giving is its own reward. Send a challenge to another and see what awakens.",
  '111': "🔮 Five scrolls dispatched to friends... the strategist within you grows.",
  '112': "🔮 Ten quests sent forth — your command is legendary, and something knows it.",

  // Monster battle victories
  '201': "🔮 A winged beast of old awaits in the dungeon. Watch closely and strike true.",
  '202': "🔮 Shadows hide a cunning little thief. Match its moves to earn a trophy.",
  '203': "🔮 A mountain of muscle blocks your descent. Only mimicry defeats brute force.",
  '204': "🔮 Arcane patterns swirl in darkness. Memorize the sequence to break the spell.",
  '205': "🔮 A creature of the clouds soars above. Follow its grace to earn its trust.",
  '206': "🔮 Small and swift, the fae dances just out of reach. Can you keep rhythm?"
}

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
    "Send cheers to fellow friends to boost their daily habit momentum!",
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
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState<Set<string>>(new Set())

  // Settings Toggles State
  const [showNecrion, setShowNecrion] = useState(true)
  const [showGuardian, setShowGuardian] = useState(true)
  const [isUnpackOpen, setIsUnpackOpen] = useState(false)
  const [isExitingRight, setIsExitingRight] = useState(false)

  // Hide companion overlay when unpacking modal is active
  useEffect(() => {
    const handleUnpackState = (e: Event) => {
      const detail = (e as CustomEvent)?.detail
      setIsUnpackOpen(!!detail?.isOpen)
    }
    window.addEventListener('unpack-modal-state', handleUnpackState)
    return () => window.removeEventListener('unpack-modal-state', handleUnpackState)
  }, [])

  // Dynamic Randomized Layout State (Spacing, Facing Flips, Depth Offsets, Single/Dual Visibility)
  const [layoutState, setLayoutState] = useState({
    gapClass: 'gap-4',
    necrionScaleX: 1,
    guardianScaleX: 1,
    necrionY: 0,
    guardianY: 0,
    visibleNecrion: true,
    visibleGuardian: true,
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

    // Dynamic single vs dual companion visibility (40% Necrion only, 40% Guardian only, 20% Both)
    const visRoll = Math.random();
    let visNecrion = true;
    let visGuardian = true;
    if (visRoll < 0.40) {
      visNecrion = true;
      visGuardian = false;
    } else if (visRoll < 0.80) {
      visNecrion = false;
      visGuardian = true;
    } else {
      visNecrion = true;
      visGuardian = true;
    }

    setLayoutState({
      gapClass: randomGap || 'gap-4 sm:gap-6',
      necrionScaleX: necrionFlipped ? -1 : 1,
      guardianScaleX: guardianFlipped ? -1 : 1,
      necrionY: nY,
      guardianY: gY,
      visibleNecrion: visNecrion,
      visibleGuardian: visGuardian,
    })
  }, [])

  // Randomize layout on route changes
  useEffect(() => {
    randomizeLayout()
  }, [pathname, randomizeLayout])

  const [showHintsSetting, setShowHintsSetting] = useState(true)

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
      const savedHints = localStorage.getItem("show-companion-hints")
      if (savedHints !== null) {
        setShowHintsSetting(savedHints === "true")
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

  // Fetch unlocked achievements so we only show hints for locked ones
  useEffect(() => {
    const fetchUnlocked = async () => {
      try {
        const res = await fetch('/api/achievements')
        if (res.ok) {
          const data = await res.json()
          const ids = new Set<string>(
            (Array.isArray(data) ? data : data.achievements || [])
              .filter((a: any) => a.unlocked)
              .map((a: any) => String(a.achievement_id || a.id))
          )
          setUnlockedAchievementIds(ids)
        }
      } catch {
        // Silently ignore — hints will just skip achievements
      }
    }
    fetchUnlocked()
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

  // Build locked-achievement cryptic hints
  const lockedAchievementHints = useMemo(() => {
    return Object.entries(CRYPTIC_ACHIEVEMENT_HINTS)
      .filter(([id]) => !unlockedAchievementIds.has(id))
      .map(([, hint]) => hint)
  }, [unlockedAchievementIds])

  const hints = useMemo(() => {
    const routeKey = Object.keys(HINTS_BY_ROUTE).find(key => pathname?.startsWith(key))
    const routeHints = routeKey ? HINTS_BY_ROUTE[routeKey] : DEFAULT_HINTS
    const baseHints = routeHints ?? DEFAULT_HINTS

    // Mix in ~30% achievement hints by inserting one every 2-3 regular hints
    if (lockedAchievementHints.length === 0) return baseHints

    const mixed: string[] = []
    let achIdx = 0
    for (let i = 0; i < baseHints.length; i++) {
      mixed.push(baseHints[i]!)
      // After every 2nd regular hint, insert an achievement hint
      if ((i + 1) % 2 === 0 && achIdx < lockedAchievementHints.length) {
        mixed.push(lockedAchievementHints[achIdx]!)
        achIdx++
      }
    }
    // Append remaining achievement hints at the end
    while (achIdx < lockedAchievementHints.length) {
      mixed.push(lockedAchievementHints[achIdx]!)
      achIdx++
    }
    return mixed
  }, [pathname, lockedAchievementHints])

  const activeHints = hints || DEFAULT_HINTS
  const currentHint = activeHints[hintIndex % activeHints.length] || DEFAULT_HINTS[0]

  const handleTapCharacter = (speaker: 'necrion' | 'guardian') => {
    setIsAnimating(true)
    setSpeakerName(speaker)
    setHintIndex(prev => prev + 1)
    
    // Immediately hide speech bulb during transition so it never floats
    setShowSpeech(false)

    // Trigger smooth slide out right animation on click
    setIsExitingRight(true)

    // After 450ms slide out exit, randomize layout and slowly slide back in from right
    setTimeout(() => {
      randomizeLayout()
      setIsExitingRight(false)
      setIsAnimating(false)

      // ONLY show speech bulb after the slide-in transition finishes (750ms later)
      setTimeout(() => {
        setShowSpeech(true)
      }, 750)
    }, 450)
  }

  if (isUnpackOpen) return null

  // Hide completely if both toggled off or on auth pages
  if ((!showNecrion && !showGuardian) || pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up') || pathname === '/login') {
    return null
  }

  return (
    <div className="fixed bottom-[calc(76px+env(safe-area-inset-bottom,0px))] right-3 md:bottom-0 md:right-6 z-50 flex flex-col items-end pointer-events-none transition-all duration-300">
      {/* Speech Bulb Popup (Only appears AFTER slide-in animation completes) */}
      <AnimatePresence>
        {showSpeech && !isExitingRight && currentHint && showHintsSetting && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={() => handleTapCharacter(speakerName)}
            className="mb-2 bg-white text-zinc-950 border-2 border-zinc-200 p-3 rounded-2xl pointer-events-auto cursor-pointer max-w-[200px] sm:max-w-[240px] relative group"
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

            {/* Treat Feeding & Affection Quick Action */}
            <div className="pt-1.5 border-t border-zinc-200 flex items-center justify-between gap-2">
              <span className="text-[10px] text-amber-900 font-bold flex items-center gap-1 font-serif [text-shadow:none] !drop-shadow-none [filter:none]">
                ❤️ Affection Active
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  window.location.href = '/kingdom'
                }}
                className="text-[9px] font-bold font-mono bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded-full shadow-sm [text-shadow:none] !drop-shadow-none"
              >
                🥩 Feed Treat (+5%)
              </button>
            </div>

            {/* Classic White Speech Tail */}
            <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Characters Standing Side-by-Side with Slow Entry from Right & Exit Right on Click */}
      <motion.div
        initial={{ x: 120, opacity: 0 }}
        animate={{ 
          x: isExitingRight ? 180 : 0, 
          opacity: isExitingRight ? 0 : 1 
        }}
        transition={{ 
          duration: isExitingRight ? 0.45 : 0.75, 
          ease: isExitingRight ? [0.4, 0, 1, 1] : [0.16, 1, 0.3, 1] 
        }}
        className={`flex items-end ${layoutState.gapClass} pointer-events-auto`}
      >
        {/* 1. Necrion (Realm Mentor Companion) */}
        {showNecrion && (layoutState.visibleNecrion || (!layoutState.visibleGuardian && !showGuardian)) && (
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
                src="/images/creatures/Necrion.webp"
                alt="Necrion Companion"
                fill
                className="object-contain animate-float"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* 2. Guardian / Companion Pet */}
        {showGuardian && activeGuardian && (layoutState.visibleGuardian || (!layoutState.visibleNecrion && !showNecrion)) && (
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
      </motion.div>
    </div>
  )
}
