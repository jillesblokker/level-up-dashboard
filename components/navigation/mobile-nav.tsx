"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  RotateCcw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Progress } from "@/components/ui/progress"
import { Coins } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetContentWithoutClose,
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
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
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
    const handleStatsUpdate = () => {
      console.log('[Mobile Nav] Character stats update event received, refreshing stats...')
      loadCharacterStats()
    }
    window.addEventListener("character-stats-update", handleStatsUpdate)
    
    // Also listen for level-specific updates
    const handleLevelUpdate = () => {
      console.log('[Mobile Nav] Level update event received, refreshing stats...')
      loadCharacterStats()
    }
    window.addEventListener("level-update", handleLevelUpdate)
    
    return () => {
      window.removeEventListener("character-stats-update", handleStatsUpdate)
      window.removeEventListener("level-update", handleLevelUpdate)
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
            className="relative h-14 w-14 rounded-lg border border-amber-800/20 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm hover:border-amber-500/40 active:bg-amber-500/10 transition-all duration-300 touch-manipulation min-h-[44px]"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6 text-amber-500" />
          </Button>
        </SheetTrigger>
        <SheetContentWithoutClose 
          side="right" 
          className="w-full bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border-l border-amber-800/20 pt-safe-top pb-5"
        >
          <div className="flex flex-col h-full">
            {/* Enhanced Header */}
            <div className="flex items-center justify-between p-5 border-b border-amber-800/20 bg-gradient-to-r from-amber-900/10 to-transparent">
              <Logo />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isRefreshing) return; // Prevent multiple clicks
                    
                    console.log('[Mobile Nav] Manual refresh clicked, reloading stats...')
                    setIsRefreshing(true)
                    
                    try {
                      // Force reload from localStorage
                      const stats = getCharacterStats()
                      console.log('[Mobile Nav] Raw stats from localStorage:', stats)
                      
                      // Calculate new level
                      const currentLevel = calculateLevelFromExperience(stats.experience)
                      console.log('[Mobile Nav] Calculated level:', currentLevel, 'from experience:', stats.experience)
                      
                      // Calculate experience needed for next level
                      const expToNext = calculateExperienceForLevel(currentLevel)
                      console.log('[Mobile Nav] Experience to next level:', expToNext)
                      
                      // Update state with new values
                      const newStats = {
                        level: currentLevel,
                        experience: stats.experience,
                        experienceToNextLevel: expToNext,
                        gold: stats.gold,
                        titles: { equipped: '', unlocked: 0, total: 0 },
                        perks: { active: 0, total: 0 }
                      }
                      
                      console.log('[Mobile Nav] Setting new stats:', newStats)
                      setCharacterStats(newStats)
                      
                      // Force a re-render by dispatching an event
                      window.dispatchEvent(new Event('character-stats-update'))
                      
                      console.log('[Mobile Nav] Refresh completed successfully')
                      
                      // Show success feedback
                      setTimeout(() => setIsRefreshing(false), 1000)
                    } catch (error) {
                      console.error('[Mobile Nav] Error during refresh:', error)
                      setIsRefreshing(false)
                    }
                  }}
                  disabled={isRefreshing}
                  className={cn(
                    "h-8 w-8 p-0 touch-manipulation min-h-[32px] transition-all duration-200",
                    isRefreshing 
                      ? "text-green-500 bg-green-500/10" 
                      : "text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                  )}
                  aria-label={isRefreshing ? "Refreshing..." : "Refresh character stats"}
                >
                  {isRefreshing ? (
                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="h-10 w-10 p-0 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 touch-manipulation min-h-[44px]"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Enhanced Character Stats */}
            <div className="p-5 border-b border-amber-800/20 bg-gradient-to-r from-amber-900/10 to-transparent">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-black">{characterStats.level}</span>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">Level {characterStats.level}</p>
                    <p className="text-sm text-amber-400">{characterStats.experience} / {characterStats.experienceToNextLevel} XP</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-2 rounded-lg">
                  <Coins className="h-5 w-5" />
                  <span className="text-base font-semibold">{characterStats.gold}</span>
                </div>
              </div>
              <Progress value={levelProgress} className="h-3 bg-gray-700" />
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="space-y-2 px-4">
                {mainNavItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg transition-all duration-200 touch-manipulation min-h-[44px]",
                        "bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-amber-800/20",
                        "hover:from-amber-800/20 hover:to-amber-700/20 hover:border-amber-500/40",
                        "active:from-amber-600/30 active:to-amber-500/30",
                        isActive(item.href) && "from-amber-700/30 to-amber-600/30 border-amber-500/50 shadow-lg shadow-amber-500/20"
                      )}
                      onClick={() => setOpen(false)}
                      aria-label={`Navigate to ${item.label}`}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-amber-600/20 rounded-lg flex items-center justify-center border border-amber-500/30">
                        <Icon className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-base truncate">
                          {item.label}
                        </div>
                        <div className="text-gray-400 text-sm truncate">
                          {item.description}
                        </div>
                      </div>
                      {isActive(item.href) && (
                        <div className="flex-shrink-0 w-2 h-2 bg-amber-400 rounded-full" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Enhanced Quick Stats */}
            <div className="p-5 border-t border-amber-800/20 bg-gradient-to-r from-gray-800/50 to-transparent">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Titles</p>
                    <p className="text-base font-semibold text-white">{characterStats.titles.unlocked}/{characterStats.titles.total}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="text-sm text-gray-400">Perks</p>
                    <p className="text-base font-semibold text-white">{characterStats.perks.active}/{characterStats.perks.total}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Account Section */}
            <div className="p-5 border-t border-amber-800/20">
              <button
                onClick={() => {
                  console.log('Account settings clicked - navigating to /account')
                  setOpen(false)
                  router.push('/account')
                }}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-700/50 hover:border-amber-500/30 active:bg-amber-500/10 transition-all duration-300 group touch-manipulation min-h-[52px] w-full text-left"
                aria-label="Account settings"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 text-black" />
                </div>
                <div className="text-left">
                  <p className="text-base font-semibold text-white">Account Settings</p>
                  <p className="text-sm text-gray-400">Manage your profile and preferences</p>
                </div>
              </button>
            </div>
          </div>
        </SheetContentWithoutClose>
      </Sheet>
    </div>
  )
}

 