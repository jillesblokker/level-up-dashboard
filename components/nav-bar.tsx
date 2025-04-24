"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Map, User, Trophy, ShoppingBag, Settings, Menu, Coins, Castle, X, Palette, Bell, List, Monitor, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/logo"
import { NotificationCenter } from "@/components/notification-center"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { CharacterStats, calculateExperienceForLevel, calculateLevelFromExperience, calculateLevelProgress } from "@/types/character"
import { Progress } from "@/components/ui/progress"
import { useSession, signOut, signIn } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MainNav } from "@/components/main-nav"
import { Search } from "@/components/search"
import { UserNav } from "@/components/user-nav"

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

interface NotificationCenterProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onMarkAllAsRead: () => void
  unreadCount: number
}

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
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
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

  if (!isClient) {
    return null; // Return null on server-side to prevent hydration mismatch
  }

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

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const levelProgress = calculateLevelProgress(characterStats.experience)

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Castle className="h-6 w-6 mr-4" />
        <MainNav />
        <div className="ml-auto flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2">
            <div className="text-sm font-medium">Level {characterStats.level}</div>
            <Progress value={levelProgress} className="w-32 h-2" />
            <div className="flex items-center space-x-1">
              <Coins className="h-4 w-4" />
              <span className="text-sm font-medium">{characterStats.gold}</span>
            </div>
          </div>
          <NotificationCenter />
          <UserNav />
        </div>
      </div>
    </div>
  )
}

