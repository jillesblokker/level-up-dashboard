"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { Session } from '@supabase/supabase-js'
import { Castle, Coins } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { NotificationCenter } from "@/components/notification-center"
import { UserNav } from "@/components/user-nav"
import { calculateLevelFromExperience, calculateExperienceForLevel, calculateLevelProgress } from "@/types/character"

interface CustomSession {
  user?: {
    id: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface NavBarProps {
  goldBalance: number;
  session?: CustomSession | null | undefined;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "achievement" | "quest" | "friend" | "system";
  read: boolean;
  timestamp: string;
  action?: {
    label: string;
    href: string;
  };
}

// Fixed timestamps for initial notifications to prevent hydration mismatch
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "Achievement Unlocked!",
    message: "You've earned the 'Early Riser' achievement for completing 5 tasks before 9 AM.",
    type: "achievement",
    read: false,
    timestamp: "2024-03-20T09:00:00.000Z",
    action: {
      label: "View Achievement",
      href: "/character",
    },
  },
  {
    id: "n2",
    title: "Quest Completed",
    message: "You've successfully completed the 'Strength Foundation' quest and earned 50 gold!",
    type: "quest",
    read: false,
    timestamp: "2024-03-20T08:00:00.000Z",
    action: {
      label: "View Rewards",
      href: "/quests",
    },
  },
  {
    id: "n3",
    title: "Friend Request",
    message: "Michael Chen has sent you a friend request.",
    type: "friend",
    read: true,
    timestamp: "2024-03-19T09:00:00.000Z",
    action: {
      label: "View Request",
      href: "/guildhall",
    },
  },
]

export function NavBar({ goldBalance, session }: NavBarProps) {
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

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Load character stats from localStorage
    const loadCharacterStats = () => {
      try {
        const savedStats = localStorage.getItem("character-stats")
        if (savedStats) {
          const stats = JSON.parse(savedStats)
          const currentLevel = calculateLevelFromExperience(stats.experience)
          setCharacterStats({
            ...stats,
            level: currentLevel,
            experienceToNextLevel: calculateExperienceForLevel(currentLevel)
          })
        }
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
        <Castle className="h-6 w-6 mr-4" />
        {/* Desktop Navigation */}
        <div className="hidden md:flex">
          <MainNav />
        </div>
        {/* Mobile Navigation */}
        <div className="flex md:hidden flex-1">
          <MobileNav />
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2">
            <div className="text-sm font-medium">Level {characterStats.level}</div>
            <Progress value={levelProgress} className="w-32 h-2" />
            <div className="flex items-center space-x-1">
              <Coins className="h-4 w-4" />
              <span className="text-sm font-medium">{characterStats.gold}</span>
            </div>
          </div>
          <div className="relative">
            <NotificationCenter />
          </div>
          <UserNav session={session as unknown as Session | null} />
        </div>
      </div>
    </div>
  )
}

