"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { 
  Crown, 
  MapIcon,
  Trophy,
  ClipboardCheck,
  Menu,
  X,
  User,
  Building,
  Compass,
  Palette,
  ChevronDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { CharacterStats, calculateExperienceForLevel, calculateLevelFromExperience } from "@/types/character"

interface MobileNavProps {
  tabs?: { value: string; label: string }[]
  activeTab?: string
  onTabChange?: (value: string) => void
}

export function MobileNav({ tabs, activeTab, onTabChange }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [characterStats, setCharacterStats] = useState<CharacterStats>({
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    gold: 0,
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
    // Load character stats from localStorage
    const loadCharacterStats = () => {
      try {
        const savedStats = localStorage.getItem("character-stats")
        if (savedStats) {
          const stats = JSON.parse(savedStats) as CharacterStats
          // Initialize with default gold if not set
          if (typeof stats.gold === 'undefined') {
            stats.gold = 1000
            localStorage.setItem("character-stats", JSON.stringify(stats))
          }
          const currentLevel = calculateLevelFromExperience(stats.experience)
          setCharacterStats({
            ...stats,
            level: currentLevel,
            experienceToNextLevel: calculateExperienceForLevel(currentLevel)
          })
        } else {
          // If no stats exist, create initial stats
          const initialStats: CharacterStats = {
            level: 1,
            experience: 0,
            experienceToNextLevel: 100,
            gold: 1000,
            titles: {
              equipped: "Novice Adventurer",
              unlocked: 5,
              total: 20
            },
            perks: {
              active: 3,
              total: 10
            }
          }
          localStorage.setItem("character-stats", JSON.stringify(initialStats))
          setCharacterStats(initialStats)
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
  
  const mainNavItems = [
    { href: "/kingdom", label: "Kingdom", icon: Crown },
    { href: "/quests", label: "Quests", icon: Compass },
    { href: "/realm", label: "Realm", icon: MapIcon },
    { href: "/achievements", label: "Achievements", icon: Trophy },
    { href: "/character", label: "Character", icon: User },
  ]

  const accountItems = [
    { href: "/profile", label: "Profile", icon: User },
    { href: "/requirements", label: "Requirements", icon: ClipboardCheck },
    { href: "/design-system", label: "Design System", icon: Palette },
  ]
  
  const isActive = (path: string) => pathname === path
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800 h-16 flex items-center justify-between px-2">
      {/* Mobile nav bar: logo, notification, avatar, hamburger */}
      <div className="flex flex-1 items-center justify-between gap-2">
        {/* Logo (left) */}
        <span className="text-lg md:text-2xl font-cardo text-amber-400 pl-2">Thrivehaven</span>
        {/* Notification icon (center) */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {/* Import and use NotificationCenter here */}
            {/* @ts-ignore-next-line */}
            {typeof window !== 'undefined' && require('@/components/notification-center').NotificationCenter && (
              require('@/components/notification-center').NotificationCenter()
            )}
          </div>
        </div>
        {/* Avatar (right) */}
        <div className="flex items-center">
          {/* Import and use UserNav here */}
          {/* @ts-ignore-next-line */}
          {typeof window !== 'undefined' && require('@/components/user-nav').UserNav && (
            require('@/components/user-nav').UserNav()
          )}
        </div>
        {/* Hamburger menu (far right) */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 p-0"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6 text-amber-400" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="right" 
            className="w-full max-w-[90vw] sm:max-w-[320px] p-2 bg-gray-900 border-gray-800"
            aria-modal="true"
            aria-label="main-menu-sheet"
          >
            <div className="flex flex-col h-full">
              {/* Stats section */}
              <div className="flex items-center justify-center gap-6 py-4 border-b border-gray-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm md:text-base text-gray-400">Level</span>
                  <span className="text-amber-400 font-bold text-sm md:text-base">{characterStats.level}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icons.coins className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                  <span className="text-gray-100 text-sm md:text-base">{characterStats.gold}</span>
                </div>
              </div>
              {/* Tabs Dropdown (if tabs are provided) */}
              {tabs && tabs.length > 0 && (
                <div className="px-4 py-2 border-b border-gray-800">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full flex justify-between items-center">
                        {tabs.find(tab => tab.value === activeTab)?.label || "Select"}
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-full">
                      {tabs.map((tab) => (
                        <DropdownMenuItem
                          key={tab.value}
                          onClick={() => onTabChange?.(tab.value)}
                          className={cn(
                            activeTab === tab.value && "bg-accent"
                          )}
                        >
                          {tab.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {/* Main Navigation */}
              <div className="py-2">
                <div className="px-6 py-2">
                  <h2 className="text-sm font-semibold text-gray-400">Navigation</h2>
                </div>
                {mainNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-4 text-gray-400 hover:bg-gray-800/50 transition-colors border-b border-gray-800",
                      isActive(item.href) && "text-amber-400 bg-gray-800/50"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-cardo">{item.label}</span>
                  </Link>
                ))}
              </div>
              {/* Account Section */}
              <div className="py-2">
                <div className="px-6 py-2">
                  <h2 className="text-sm font-semibold text-gray-400">Account</h2>
                </div>
                {accountItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-4 text-gray-400 hover:bg-gray-800/50 transition-colors border-b border-gray-800",
                      isActive(item.href) && "text-amber-400 bg-gray-800/50"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-cardo">{item.label}</span>
                  </Link>
                ))}
              </div>
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 min-w-[44px] min-h-[44px]"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
} 