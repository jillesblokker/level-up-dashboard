"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Map, User, Trophy, ShoppingBag, Settings, Menu, Coins, Castle, X, Palette, Bell, List } from "lucide-react"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { Logo } from "./logo"
import { NotificationCenter } from "./notification-center"
import { cn } from "../lib/utils"
import { Icons } from "./icons"
import { CharacterStats, calculateExperienceForLevel, calculateLevelFromExperience, calculateLevelProgress } from "./types/character"
import { Progress } from "./ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

interface NavBarProps {
  goldBalance: number
}

interface Notification {
  id: string
  title: string
  message: string
  type: "achievement" | "quest" | "friend" | "system"
  read: boolean
  timestamp: string
  action?: {
    label: string
    href: string
  }
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

const mainLinks = [
  { href: "/kingdom", label: "Kingdom" },
  { href: "/realm", label: "Realm" },
  { href: "/character", label: "Character" },
  { href: "/quests", label: "Quests" },
  { href: "/guildhall", label: "Guildhall" },
]

const settingsLinks = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/design-system", label: "Design System", icon: Palette },
  { href: "/settings/requirements", label: "Requirements", icon: List },
]

const navigation = [
  { name: "Kingdom", href: "/kingdom" },
  { name: "Character", href: "/character" },
  { name: "Inventory", href: "/inventory" },
  { name: "Quests", href: "/quests" },
  { name: "Achievements", href: "/achievements" },
  { name: "Realm", href: "/realm" },
];

export function NavBar() {
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  const [characterStats, setCharacterStats] = useState<CharacterStats>({
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false)
  const settingsMenuRef = useRef<HTMLDivElement>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setIsClient(true)
    // Load character stats from localStorage
    const loadCharacterStats = () => {
      try {
        const savedStats = localStorage.getItem("character-stats")
        if (savedStats) {
          const stats = JSON.parse(savedStats) as CharacterStats
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
    setNotifications(INITIAL_NOTIFICATIONS)
  }, [])

  // Handle clicks outside the settings menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        settingsMenuRef.current && 
        settingsButtonRef.current && 
        !settingsMenuRef.current.contains(event.target as Node) &&
        !settingsButtonRef.current.contains(event.target as Node)
      ) {
        setIsSettingsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleSettingsMenu = () => {
    setIsSettingsMenuOpen(!isSettingsMenuOpen);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev])
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/kingdom" className="mr-6">
          <span className="text-lg font-semibold text-amber-400">Thrivehaven</span>
        </Link>

        <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
          <Link
            href="/kingdom"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === "/kingdom" ? "text-foreground" : "text-foreground/60"
            )}
          >
            Kingdom
          </Link>
          <Link
            href="/realm"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname?.startsWith("/realm") ? "text-foreground" : "text-foreground/60"
            )}
          >
            Realm
          </Link>
          <Link
            href="/character"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname?.startsWith("/character") ? "text-foreground" : "text-foreground/60"
            )}
          >
            Character
          </Link>
          <Link
            href="/quests"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname?.startsWith("/quests") ? "text-foreground" : "text-foreground/60"
            )}
          >
            Quests
          </Link>
          <Link
            href="/guildhall"
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname?.startsWith("/guildhall") ? "text-foreground" : "text-foreground/60"
            )}
          >
            Guildhall
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="text-sm">
              Level {characterStats.level}
              <div className="w-32">
                <Progress value={calculateLevelProgress(characterStats.experience) * 100} className="h-2" />
              </div>
              <div className="text-xs text-muted-foreground">
                {(() => {
                  // Calculate total XP needed for previous levels
                  let expForPreviousLevels = 0;
                  for (let i = 1; i < characterStats.level; i++) {
                    expForPreviousLevels += calculateExperienceForLevel(i);
                  }
                  
                  // Calculate current level XP
                  const currentLevelXP = characterStats.experience - expForPreviousLevels;
                  const neededForCurrentLevel = calculateExperienceForLevel(characterStats.level);
                  
                  return `${Math.min(currentLevelXP, neededForCurrentLevel)} / ${neededForCurrentLevel} XP`;
                })()}
              </div>
            </div>
            <div className="text-sm">
              Gold: {characterStats.gold}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <User className="h-5 w-5" />
                <span className="sr-only">Account menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/design-system" className="flex items-center">
                  <Palette className="mr-2 h-4 w-4" />
                  Design System
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/requirements" className="flex items-center">
                  <List className="mr-2 h-4 w-4" />
                  Requirements
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

