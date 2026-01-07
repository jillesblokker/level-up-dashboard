"use client"

import { useState, useEffect, useRef } from "react"
import { MainNav } from "@/components/main-nav"
import { Session } from '@supabase/supabase-js'
import { Castle, Coins, Star } from "lucide-react"
import { Logo } from "@/components/logo"
import { Progress } from "@/components/ui/progress"
import { NotificationCenter } from "@/components/notification-center"
import { UserNav } from "@/components/user-nav"
import { CharacterStats, calculateExperienceForLevel, calculateLevelFromExperience, calculateLevelProgress } from "@/types/character"
import { getCharacterStats, fetchFreshCharacterStats } from "@/lib/character-stats-service"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useQuickAdd } from "@/components/quick-add-provider"

interface CustomSession {
  user?: {
    id: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface NavBarProps {
  session?: CustomSession | null | undefined;
}

export function NavBar({ session }: NavBarProps) {
  const { isSignedIn, isLoaded } = useUser()
  const { openQuickAdd } = useQuickAdd()
  const [isClient, setIsClient] = useState(false)
  const [characterStats, setCharacterStats] = useState({
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    gold: 1000,
    ascension_level: 0,
    titles: {
      equipped: "",
      unlocked: 0,
      total: 10
    },
    perks: {
      active: 0,
      total: 5
    }
  })
  const [goldHighlight, setGoldHighlight] = useState(false);
  const [levelHighlight, setLevelHighlight] = useState(false);
  const goldRef = useRef(characterStats.gold);
  const levelRef = useRef(characterStats.level);

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Only load stats if user is authenticated and Clerk is loaded
    if (!isLoaded || !isSignedIn) {
      return
    }

    // Load character stats
    const loadStats = async (fetchServer = true) => {
      try {
        // Get current stats from localStorage first (for immediate display)
        const localStats = getCharacterStats()
        const currentLevel = calculateLevelFromExperience(localStats.experience)
        setCharacterStats({
          level: currentLevel,
          experience: localStats.experience,
          experienceToNextLevel: calculateExperienceForLevel(currentLevel),
          gold: localStats.gold,
          ascension_level: localStats.ascension_level || 0,
          titles: { equipped: '', unlocked: 0, total: 0 },
          perks: { active: 0, total: 0 }
        })

        // Only fetch fresh data from Supabase if requested
        if (fetchServer) {
          const freshStats = await fetchFreshCharacterStats()
          if (freshStats) {
            const currentLevel = calculateLevelFromExperience(freshStats.experience)
            // Only update if server has more experience (to prevent regression)
            // For gold, we trust local state more if we just updated it
            if (freshStats.experience >= localStats.experience) {
              setCharacterStats(prev => ({
                ...prev,
                level: currentLevel,
                experience: freshStats.experience,
                experienceToNextLevel: calculateExperienceForLevel(currentLevel),
                // Only update gold if we are doing a full sync, but even then, 
                // if local is ahead (due to recent action), we might want to keep local.
                // But for now, let's assume periodic sync is safe.
                gold: freshStats.gold,
                ascension_level: freshStats.ascension_level || 0
              }))
            }
          }
        }
      } catch (error) {
        console.error("Error loading character stats:", error)
      }
    }

    // Load stats immediately (full sync)
    loadStats(true)

    // Set up periodic refresh every 30 seconds (full sync)
    const refreshInterval = setInterval(() => loadStats(true), 30000)

    // Listen for character stats updates (local only)
    const handleStatsUpdate = () => loadStats(false)
    window.addEventListener("character-stats-update", handleStatsUpdate)

    return () => {
      clearInterval(refreshInterval)
      window.removeEventListener("character-stats-update", handleStatsUpdate)
    }
  }, [isLoaded, isSignedIn])

  useEffect(() => {
    if (characterStats.gold !== goldRef.current) {
      setGoldHighlight(true);
      goldRef.current = characterStats.gold;
      setTimeout(() => setGoldHighlight(false), 600);
    }
  }, [characterStats.gold]);

  useEffect(() => {
    if (characterStats.level !== levelRef.current) {
      setLevelHighlight(true);
      levelRef.current = characterStats.level;
      setTimeout(() => setLevelHighlight(false), 600);
    }
  }, [characterStats.level]);

  // Load initial notifications
  useEffect(() => {
    // No need to set notifications as they are already set in the INITIAL_NOTIFICATIONS constant
  }, [])

  if (!isClient) {
    return null; // Return null on server-side to prevent hydration mismatch
  }

  const levelProgress = calculateLevelProgress(characterStats.experience)

  return (
    <div className="hidden lg:landscape:block md:border-b bg-black md:border-gray-800 z-10 relative">
      <div className="flex h-16 items-center pt-0 md:pt-0 safe-area-inset-top">
        {/* Desktop Navigation */}
        <div className="hidden md:flex">
          <MainNav />
        </div>
        {/* Desktop right-side stats, notification, user nav */}
        <div className="ml-auto flex items-center space-x-4 hidden md:flex pr-6">
          <div className="flex items-center space-x-2">
            <div
              className={`text-sm font-medium transition-all duration-300 ${levelHighlight ? 'bg-amber-300/40 rounded px-2 py-1 shadow' : ''}`}
              aria-live="polite"
              aria-atomic="true"
            >
              {characterStats.ascension_level > 0 && (
                <span className="flex items-center text-amber-500 mr-2 font-bold">
                  <Star className="h-4 w-4 fill-amber-500 mr-1" />
                  {characterStats.ascension_level}
                </span>
              )}
              Level {characterStats.level}
            </div>
            <Progress value={levelProgress} className="w-32 h-2" />
            <div
              className={`flex items-center space-x-1 transition-all duration-300 ${goldHighlight ? 'bg-amber-400/30 rounded px-2 py-1 shadow' : ''}`}
              aria-live="polite"
              aria-atomic="true"
            >
              <Coins className="h-4 w-4" />
              <span className="text-sm font-medium">{characterStats.gold}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 pr-2 border-r border-gray-800">
            <Button
              variant="ghost"
              size="icon"
              className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-full"
              onClick={() => {
                console.log('[NavBar] Quick Add clicked')
                openQuickAdd()
              }}
              title="Quick Add Quest (N)"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <NotificationCenter />
          </div>
          <UserNav />
        </div>
      </div>
    </div>
  )
}

