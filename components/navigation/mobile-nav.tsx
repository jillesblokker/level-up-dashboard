"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useCallback, useMemo } from "react"
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
import { cn } from "@/lib/utils"
import { CharacterStats, calculateExperienceForLevel, calculateLevelFromExperience, calculateLevelProgress } from "@/types/character"
import { Logo } from "@/components/logo";
import { useUser } from "@clerk/nextjs";
import { getCharacterStats, fetchFreshCharacterStats } from "@/lib/character-stats-manager"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { MobileErrorFallback } from "@/components/MobileErrorFallback"

interface MobileNavProps {
  tabs?: { value: string; label: string }[]
  activeTab?: string
  onTabChange?: (value: string) => void
}

export function MobileNav({ tabs, activeTab, onTabChange }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [open, setOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dataSource, setDataSource] = useState<'supabase' | 'localStorage' | 'unknown'>('unknown')
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
      total: 0
    }
  })

  // Memoized calculations
  const levelProgress = useMemo(() => 
    calculateLevelProgress(characterStats.experience), 
    [characterStats.experience]
  )

  // Simplified navigation items
  const mainNavItems = useMemo(() => [
    { href: "/kingdom", label: "Kingdom", icon: Crown, description: "Manage your realm" },
    { href: "/quests", label: "Tasks", icon: Compass, description: "Complete challenges" },
    { href: "/realm", label: "Realm", icon: MapIcon, description: "Explore the world" },
    { href: "/achievements", label: "Achievements", icon: Trophy, description: "Track progress" },
    { href: "/inventory", label: "Inventory", icon: Building, description: "Manage items" },
    { href: "/character", label: "Character", icon: User, description: "View stats" },
  ], [])

  const isActive = useCallback((path: string) => pathname === path, [pathname])

  // Simple load function
  const loadCharacterStats = useCallback(() => {
    try {
      console.log('[Mobile Nav] Loading character stats from localStorage...');
      const stats = getCharacterStats();
      const currentLevel = calculateLevelFromExperience(stats.experience);
      const newStats = {
        level: currentLevel,
        experience: stats.experience,
        experienceToNextLevel: calculateExperienceForLevel(currentLevel),
        gold: stats.gold,
        titles: { equipped: '', unlocked: 0, total: 0 },
        perks: { active: 0, total: 0 }
      }
      setCharacterStats(newStats);
      setDataSource('localStorage');
      console.log('[Mobile Nav] Loaded stats from localStorage:', newStats);
    } catch (error) {
      console.error("Error loading character stats:", error);
      // Set default stats if loading fails
      const defaultStats = {
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        gold: 0,
        titles: { equipped: '', unlocked: 0, total: 0 },
        perks: { active: 0, total: 0 }
      };
      setCharacterStats(defaultStats);
      setDataSource('unknown');
    }
  }, [])

  // Simple click handler
  const handleRefreshClick = useCallback(async () => {
    if (isRefreshing) return;
    
    console.log('[Mobile Nav] Refresh button clicked');
    setIsRefreshing(true);
    
    try {
      // Use the new real-time data fetching system
      const freshStats = await fetchFreshCharacterStats();
      if (freshStats) {
        const currentLevel = calculateLevelFromExperience(freshStats.experience);
        const newStats = {
          level: currentLevel,
          experience: freshStats.experience,
          experienceToNextLevel: calculateExperienceForLevel(currentLevel),
          gold: freshStats.gold,
          titles: { equipped: '', unlocked: 0, total: 0 },
          perks: { active: 0, total: 0 }
        };
        
        setCharacterStats(newStats);
        setDataSource('supabase');
        console.log('[Mobile Nav] Successfully refreshed stats from API:', newStats);
      } else {
        console.log('[Mobile Nav] API refresh failed, falling back to localStorage');
        loadCharacterStats();
      }
    } catch (error) {
      console.error('[Mobile Nav] Refresh failed:', error);
      // Fallback to localStorage on error
      loadCharacterStats();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  }, [isRefreshing, loadCharacterStats])

  // Simple effect for data loading
  useEffect(() => {
    console.log('[Mobile Nav] useEffect triggered - user:', !!user, 'isLoaded:', isLoaded);
    
    if (!user || !isLoaded) return;
    
    // Load initial data from localStorage for immediate display
    loadCharacterStats();
    
    // Then fetch fresh data from API
    const fetchInitialData = async () => {
      try {
        const freshStats = await fetchFreshCharacterStats();
        if (freshStats) {
          const currentLevel = calculateLevelFromExperience(freshStats.experience);
          const newStats = {
            level: currentLevel,
            experience: freshStats.experience,
            experienceToNextLevel: calculateExperienceForLevel(currentLevel),
            gold: freshStats.gold,
            titles: { equipped: '', unlocked: 0, total: 0 },
            perks: { active: 0, total: 0 }
          };
          
          setCharacterStats(newStats);
          setDataSource('supabase');
          console.log('[Mobile Nav] Initial fresh stats loaded from API:', newStats);
        }
      } catch (error) {
        console.error('[Mobile Nav] Error fetching initial fresh stats:', error);
      }
    };
    
    fetchInitialData();
  }, [user, isLoaded, loadCharacterStats])

  // Don't render anything until Clerk is loaded to prevent crashes
  if (!isLoaded) {
    return (
      <div className="lg:hidden">
        <Button
          variant="ghost"
          className="relative h-14 w-14 rounded-lg border border-amber-800/20 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm transition-all duration-300 touch-manipulation min-h-[44px]"
          aria-label="Loading navigation menu"
          disabled
        >
          <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </Button>
      </div>
    );
  }

  return (
    <div className="lg:hidden">
      <ErrorBoundary fallback={MobileErrorFallback}>
        <Sheet open={open} onOpenChange={(newOpen) => {
          console.log('[Mobile Nav] Sheet open state changing from', open, 'to', newOpen);
          setOpen(newOpen);
        }}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-14 w-14 rounded-lg border border-amber-800/20 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm hover:border-amber-500/40 active:bg-amber-500/10 transition-all duration-300 touch-manipulation min-h-[44px]"
              aria-label="Open navigation menu"
              onClick={() => {
                console.log('[Mobile Nav] Menu button clicked, current open state:', open);
              }}
            >
              <Menu className="h-6 w-6 text-amber-500" />
            </Button>
          </SheetTrigger>
          <SheetContentWithoutClose 
            side="right" 
            className="w-full bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border-l border-amber-800/20 pt-safe-top pb-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-amber-800/20 bg-gradient-to-r from-amber-900/10 to-transparent">
              <Logo />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshClick}
                  disabled={isRefreshing}
                  className={cn(
                    "h-8 w-8 p-0 touch-manipulation min-h-[32px] transition-all duration-200",
                    isRefreshing 
                      ? "text-green-500 bg-green-500/10" 
                      : "text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                  )}
                  aria-label={isRefreshing ? "Refreshing..." : "Refresh character stats from server"}
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

            {/* Character Stats */}
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
              
              {/* Data Source Indicator */}
              <div className="mt-3 flex items-center gap-2 text-xs">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  dataSource === 'supabase' ? "bg-green-500" : 
                  dataSource === 'localStorage' ? "bg-yellow-500" : 
                  "bg-gray-500"
                )} />
                <span className={cn(
                  "text-xs",
                  dataSource === 'supabase' ? "text-green-400" : 
                  dataSource === 'localStorage' ? "text-yellow-400" : 
                  "text-gray-400"
                )}>
                  {dataSource === 'supabase' ? 'Live Data' : 
                   dataSource === 'localStorage' ? 'Cached Data' : 
                   'Unknown Source'}
                </span>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="space-y-2 px-4">
                {mainNavItems.map((item) => {
                  const Icon = item.icon
                  console.log('[Mobile Nav] Rendering navigation item:', item.href, item.label);
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
                      onClick={() => {
                        console.log('[Mobile Nav] Navigation item clicked:', item.href);
                        setOpen(false);
                      }}
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
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Quick Stats */}
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

            {/* Account Section */}
            <div className="p-5 border-t border-amber-800/20">
              <button
                onClick={() => {
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
          </SheetContentWithoutClose>
        </Sheet>
      </ErrorBoundary>
    </div>
  )
}

 