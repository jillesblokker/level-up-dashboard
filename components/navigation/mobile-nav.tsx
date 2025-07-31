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
  Home,
  Settings,
  BarChart3,
  BookOpen,
  Sword,
  Shield,
  Heart,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Progress } from "@/components/ui/progress"
import { Coins } from "lucide-react"
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
import { CharacterStats, calculateExperienceForLevel, calculateLevelFromExperience, calculateLevelProgress } from "@/types/character"
import { Logo } from "@/components/logo";
import { useUser } from "@clerk/nextjs";
import { getCharacterStats } from "@/lib/character-stats-manager"

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
    // Initialize character stats and load them (same as desktop)
    const loadCharacterStats = () => {
      try {
        // Get current stats
        const stats = getCharacterStats()
        const currentLevel = calculateLevelFromExperience(stats.experience)
        setCharacterStats({
          level: currentLevel,
          experience: stats.experience,
          experienceToNextLevel: calculateExperienceForLevel(currentLevel),
          gold: stats.gold,
          titles: { equipped: '', unlocked: 0, total: 0 },
          perks: { active: 0, total: 0 }
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
  
  const mainNavItems = [
    { href: "/kingdom", label: "Kingdom", icon: Crown, description: "Manage your realm" },
    { href: "/quests", label: "Tasks", icon: Compass, description: "Complete challenges" },
    { href: "/realm", label: "Realm", icon: MapIcon, description: "Explore the world" },
    { href: "/achievements", label: "Achievements", icon: Trophy, description: "Track progress" },
    { href: "/inventory", label: "Inventory", icon: Building, description: "Manage items" },
    { href: "/character", label: "Character", icon: User, description: "View stats" },
  ]

  const isActive = (path: string) => pathname === path

  const levelProgress = calculateLevelProgress(characterStats.experience)

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-14 w-14 rounded-lg border border-amber-800/20 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm hover:border-amber-500/40 active:bg-amber-500/10 transition-all duration-300 touch-manipulation"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6 text-amber-500" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-full bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border-l border-amber-800/20 pt-safe-top"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-amber-800/20">
              <Logo />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-8 w-8 p-0 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Character Stats */}
            <div className="p-4 border-b border-amber-800/20 bg-gradient-to-r from-amber-900/10 to-transparent">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-black">{characterStats.level}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Level {characterStats.level}</p>
                    <p className="text-xs text-amber-400">{characterStats.experience} / {characterStats.experienceToNextLevel} XP</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <Coins className="h-4 w-4" />
                  <span className="text-sm font-medium">{characterStats.gold}</span>
                </div>
              </div>
              <Progress value={levelProgress} className="h-2 bg-gray-700" />
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
              {mainNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg transition-all duration-300 group min-h-[48px] touch-manipulation",
                      isActive(item.href)
                        ? "bg-gradient-to-r from-amber-500/25 to-amber-600/25 border border-amber-500/40 text-amber-400 shadow-lg"
                        : "text-gray-300 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 active:bg-amber-500/15"
                    )}
                    aria-label={`Navigate to ${item.label}`}
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    <div className={cn(
                      "p-2.5 rounded-md transition-all duration-300 flex-shrink-0",
                      isActive(item.href)
                        ? "bg-amber-500/25 text-amber-400 shadow-sm"
                        : "bg-gray-800/50 text-gray-400 group-hover:bg-amber-500/20 group-hover:text-amber-400"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500 group-hover:text-gray-400 mt-0.5">{item.description}</p>
                    </div>
                    {isActive(item.href) && (
                      <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse flex-shrink-0" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Quick Stats */}
            <div className="p-4 border-t border-amber-800/20 bg-gradient-to-r from-gray-800/50 to-transparent">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400">Titles</p>
                    <p className="text-sm font-medium text-white">{characterStats.titles.unlocked}/{characterStats.titles.total}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <div>
                    <p className="text-xs text-gray-400">Perks</p>
                    <p className="text-sm font-medium text-white">{characterStats.perks.active}/{characterStats.perks.total}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div className="p-4 border-t border-amber-800/20">
              <ExpandableAccountSettings />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ExpandableAccountSettings() {
  const { user } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);

  const getAvatarInitial = () => {
    const displayName = (user?.unsafeMetadata?.['user_name'] as string) || user?.username || user?.emailAddresses?.[0]?.emailAddress || "";
    return displayName?.[0]?.toUpperCase() || '?';
  };

  const accountMenuItems = [
    { href: "/account/profile", label: "Profile", icon: User, description: "Manage your profile" },
    { href: "/account/monitoring", label: "Monitoring", icon: BarChart3, description: "View performance metrics" },
    { href: "/account/stored-data", label: "Stored Data", icon: BookOpen, description: "Manage local data" },
    { href: "/settings", label: "Settings", icon: Settings, description: "App preferences" },
  ];

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-4 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-700/50 hover:border-amber-500/30 active:bg-amber-500/10 transition-all duration-300 group touch-manipulation min-h-[48px]"
        aria-label="Toggle account settings"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-black">{getAvatarInitial()}</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Account</p>
            <p className="text-xs text-gray-400">Manage your settings</p>
          </div>
        </div>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform duration-300",
            isExpanded && "rotate-180"
          )} 
        />
      </button>

      {isExpanded && (
        <div className="space-y-1 pl-4">
          {accountMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:text-amber-400 hover:bg-amber-500/10 active:bg-amber-500/15 transition-all duration-300 group touch-manipulation min-h-[44px]"
                aria-label={`Navigate to ${item.label}`}
              >
                <Icon className="h-4 w-4 text-gray-400 group-hover:text-amber-400" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500 group-hover:text-gray-400">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
} 