"use client"

import { useState, useEffect, useRef } from "react"
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { Session } from '@supabase/supabase-js'
import { Castle, Coins } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { NotificationCenter } from "@/components/notification-center"
import { UserNav } from "@/components/user-nav"
import { calculateLevelFromExperience, calculateExperienceForLevel, calculateLevelProgress } from "@/types/character"
import { initializeCharacterStats, getCharacterStats } from "@/lib/character-stats-manager"

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
  const [isClient, setIsClient] = useState(false)
  const [characterStats, setCharacterStats] = useState({
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    gold: 1000,
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
    // Initialize character stats and load them
    const loadCharacterStats = () => {
      try {
        // Initialize character stats if they don't exist
        initializeCharacterStats()
        
        // Get current stats
        const stats = getCharacterStats()
        const currentLevel = calculateLevelFromExperience(stats.experience)
        setCharacterStats({
          ...stats,
          level: currentLevel,
          experienceToNextLevel: calculateExperienceForLevel(currentLevel)
        })
      } catch (error) {
        console.error("Error loading character stats:", error)
      }
    }
    loadCharacterStats()

    // Listen for character stats updates
    const handleStatsUpdate = () => loadCharacterStats()
    window.addEventListener("character-stats-update", handleStatsUpdate)
    
    return () => {
      window.removeEventListener("character-stats-update", handleStatsUpdate)
    }
  }, [])

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
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        {/* White castle logo always left */}
        <Castle className="h-6 w-6 mr-4 text-white" />
        {/* Desktop Navigation */}
        <div className="hidden md:flex">
          <MainNav />
        </div>
        {/* Mobile Navigation: only hamburger menu on right, no notification or user nav */}
        <div className="flex md:hidden flex-1 justify-end">
          <MobileNav />
        </div>
        {/* Desktop right-side stats, notification, user nav */}
        <div className="ml-auto flex items-center space-x-4 hidden md:flex">
          <div className="flex items-center space-x-2">
            <div
              className={`text-sm font-medium transition-all duration-300 ${levelHighlight ? 'bg-amber-300/40 rounded px-2 py-1 shadow' : ''}`}
              aria-live="polite"
              aria-atomic="true"
            >
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
          <div className="relative">
            <NotificationCenter />
          </div>
          <UserNav />
        </div>
      </div>
    </div>
  )
}

