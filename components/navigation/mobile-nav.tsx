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
  const [lastDataUpdate, setLastDataUpdate] = useState<Date | null>(null)
  const [dataSource, setDataSource] = useState<'supabase' | 'localStorage' | 'unknown'>('unknown')
  const [pullToRefreshState, setPullToRefreshState] = useState<'idle' | 'pulling' | 'refreshing' | 'success' | 'error'>('idle')
  const [pullStartY, setPullStartY] = useState<number | null>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [backgroundRefreshState, setBackgroundRefreshState] = useState<'idle' | 'refreshing' | 'success' | 'error'>('idle')
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState<Date | null>(null)
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

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && e.touches[0]) {
      setPullStartY(e.touches[0].clientY)
      setPullDistance(0)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY !== null && e.touches.length === 1 && e.touches[0]) {
      const currentY = e.touches[0].clientY
      const distance = Math.max(0, currentY - pullStartY)
      
      if (distance > 0 && distance < 100) {
        setPullDistance(distance)
        setPullToRefreshState('pulling')
      }
    }
  }

  const handleTouchEnd = async () => {
    if (pullStartY !== null && pullDistance > 50) {
      // Check if user is authenticated before making API calls
      if (!user || !isLoaded) {
        console.log('[Mobile Nav] User not authenticated, skipping pull-to-refresh')
        setPullToRefreshState('idle')
        setPullDistance(0)
        setPullStartY(null)
        return
      }
      
      // Trigger simple refresh with visual feedback
      console.log('[Mobile Nav] Pull-to-refresh triggered, starting refresh...')
      
      // Show immediate visual feedback
      setPullToRefreshState('refreshing')
      
      try {
        // Use the simple, reliable refresh function
        const success = await refreshCharacterStats()
        
        if (success) {
          setPullToRefreshState('success')
          console.log('[Mobile Nav] Pull-to-refresh completed successfully')
        } else {
          setPullToRefreshState('error')
          console.log('[Mobile Nav] Pull-to-refresh completed but no data received')
        }
      } catch (error) {
        console.error('[Mobile Nav] Pull-to-refresh failed:', error)
        setPullToRefreshState('error')
      }
      
      // Reset pull state and hide feedback after delay
      setPullStartY(null)
      setPullDistance(0)
      
      setTimeout(() => {
        setPullToRefreshState('idle')
      }, 1500)
    } else {
      // Reset pull state if not enough distance
      setPullStartY(null)
      setPullDistance(0)
      setPullToRefreshState('idle')
    }
  }

  // Debug effect to log state changes
  useEffect(() => {
    console.log('[Mobile Nav] State changed:', {
      isRefreshing,
      backgroundRefreshState,
      pullToRefreshState,
      user: !!user,
      isLoaded,
      dataSource,
      lastDataUpdate: lastDataUpdate?.toISOString(),
      characterStats: {
        level: characterStats.level,
        experience: characterStats.experience,
        gold: characterStats.gold
      }
    })
  }, [isRefreshing, backgroundRefreshState, pullToRefreshState, user, isLoaded, dataSource, lastDataUpdate, characterStats.level, characterStats.experience, characterStats.gold])

  // Simple, reliable refresh function
  const refreshCharacterStats = async () => {
    try {
      // Check authentication
      if (!user || !isLoaded) {
        console.log('[Mobile Nav] User not authenticated, skipping refresh')
        return false
      }

      console.log('[Mobile Nav] Starting character stats refresh...')
      
      // Fetch fresh data from API
      const response = await fetch('/api/character-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          console.log('[Mobile Nav] Refresh successful:', result.data)
          
          // Update localStorage with fresh data
          const freshStats = {
            gold: result.data.gold || 0,
            experience: result.data.experience || 0,
            level: result.data.level || 1,
            health: result.data.health || 100,
            max_health: result.data.max_health || 100,
            buildTokens: result.data.build_tokens || 0
          }
          
          localStorage.setItem('character-stats', JSON.stringify(freshStats))
          
          // Update component state
          const currentLevel = calculateLevelFromExperience(result.data.experience)
          const newStats = {
            level: currentLevel,
            experience: result.data.experience,
            experienceToNextLevel: calculateExperienceForLevel(currentLevel),
            gold: result.data.gold,
            titles: { equipped: '', unlocked: 0, total: 0 },
            perks: { active: 0, total: 0 }
          }
          
          setCharacterStats(newStats)
          setLastDataUpdate(new Date())
          setDataSource('supabase')
          
          // Dispatch update events
          window.dispatchEvent(new Event('character-stats-update'))
          window.dispatchEvent(new Event('level-update'))
          
          return true
        } else {
          console.warn('[Mobile Nav] No data in response')
          return false
        }
      } else {
        console.warn('[Mobile Nav] Refresh failed:', response.status)
        return false
      }
    } catch (error) {
      console.error('[Mobile Nav] Refresh error:', error)
      return false
    }
  }

  // Smart background refresh for pull-to-refresh (non-blocking)
  const smartBackgroundRefresh = async (showVisualFeedback = false) => {
    try {
      // Check authentication
      if (!user || !isLoaded) {
        console.log('[Mobile Nav] User not authenticated, skipping background refresh')
        return false
      }

      // Set background refresh state
      if (showVisualFeedback) {
        setBackgroundRefreshState('refreshing')
      }

      console.log('[Mobile Nav] Starting smart background refresh...')
      
      // Start background fetch without blocking UI
      const refreshPromise = fetch('/api/character-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      // Continue with UI updates while fetch happens in background
      if (showVisualFeedback) {
        // Show immediate visual feedback
        setPullToRefreshState('refreshing')
        
        // Simulate smooth pull-back animation
        setTimeout(() => {
          setPullDistance(0)
          setPullToRefreshState('success')
          
          // Hide success state after brief moment
          setTimeout(() => {
            setPullToRefreshState('idle')
          }, 800)
        }, 300)
      }

      // Wait for fetch to complete in background
      const response = await refreshPromise
      
      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          console.log('[Mobile Nav] Background refresh successful:', result.data)
          
          // Update localStorage with fresh data
          const freshStats = {
            gold: result.data.gold || 0,
            experience: result.data.experience || 0,
            level: result.data.level || 1,
            health: result.data.health || 100,
            max_health: result.data.max_health || 100,
            buildTokens: result.data.build_tokens || 0
          }
          
          localStorage.setItem('character-stats', JSON.stringify(freshStats))
          
          // Update component state smoothly
          const currentLevel = calculateLevelFromExperience(result.data.experience)
          const newStats = {
            level: currentLevel,
            experience: result.data.experience,
            experienceToNextLevel: calculateExperienceForLevel(currentLevel),
            gold: result.data.gold,
            titles: { equipped: '', unlocked: 0, total: 0 },
            perks: { active: 0, total: 0 }
          }
          
          // Smooth state update with animation
          setCharacterStats(prev => ({ ...prev, ...newStats }))
          
          // Track data freshness
          setLastDataUpdate(new Date())
          setLastRefreshAttempt(new Date())
          setDataSource('supabase')
          setBackgroundRefreshState('success')
          
          // Dispatch update events
          window.dispatchEvent(new Event('character-stats-update'))
          window.dispatchEvent(new Event('level-update'))
          
          // Show success feedback briefly
          setTimeout(() => {
            setBackgroundRefreshState('idle')
          }, 2000)
          
          return true
        } else {
          console.warn('[Mobile Nav] No data in response')
          setBackgroundRefreshState('error')
          setTimeout(() => setBackgroundRefreshState('idle'), 3000)
          return false
        }
      } else {
        console.warn('[Mobile Nav] Background refresh failed:', response.status)
        setBackgroundRefreshState('error')
        
        // Show error feedback briefly
        setTimeout(() => {
          setBackgroundRefreshState('idle')
        }, 3000)
        
        return false
      }
    } catch (error) {
      console.error('[Mobile Nav] Background refresh error:', error)
      setBackgroundRefreshState('error')
      
      // Show error feedback briefly
      setTimeout(() => {
        setBackgroundRefreshState('idle')
      }, 3000)
      
      return false
    }
  }

  useEffect(() => {
    // Initialize character stats and load them (same as desktop)
    const loadCharacterStats = () => {
      try {
        // Get current stats
        const stats = getCharacterStats()
        const currentLevel = calculateLevelFromExperience(stats.experience)
        const newStats = {
          level: currentLevel,
          experience: stats.experience,
          experienceToNextLevel: calculateExperienceForLevel(currentLevel),
          gold: stats.gold,
          titles: { equipped: '', unlocked: 0, total: 0 },
          perks: { active: 0, total: 0 }
        }
        
        console.log('[Mobile Nav] Loading stats:', newStats)
        setCharacterStats(newStats)
      } catch (error) {
        console.error("Error loading character stats:", error)
      }
    }

    // Enhanced function to fetch fresh data from Supabase
    const fetchFreshStatsFromSupabase = async () => {
      try {
        // Check if user is authenticated before making API calls
        if (!user || !isLoaded) {
          console.log('[Mobile Nav] User not authenticated, skipping Supabase fetch')
          setDataSource('localStorage')
          loadCharacterStats()
          return false
        }

        console.log('[Mobile Nav] Fetching fresh stats from Supabase...')
        
        // Fetch fresh data from Supabase API
        const response = await fetch('/api/character-stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        })

        if (response.ok) {
          const result = await response.json()
          if (result.data) {
            console.log('[Mobile Nav] Fresh Supabase data received:', result.data)
            
            // Update localStorage with fresh data
            const freshStats = {
              gold: result.data.gold || 0,
              experience: result.data.experience || 0,
              level: result.data.level || 1,
              health: result.data.health || 100,
              max_health: result.data.max_health || 100,
              buildTokens: result.data.build_tokens || 0
            }
            
            localStorage.setItem('character-stats', JSON.stringify(freshStats))
            console.log('[Mobile Nav] Updated localStorage with fresh data:', freshStats)
            
            // Update component state
            const currentLevel = calculateLevelFromExperience(result.data.experience)
            const newStats = {
              level: currentLevel,
              experience: result.data.experience,
              experienceToNextLevel: calculateExperienceForLevel(currentLevel),
              gold: result.data.gold,
              titles: { equipped: '', unlocked: 0, total: 0 },
              perks: { active: 0, total: 0 }
            }
            
            console.log('[Mobile Nav] Setting fresh stats in component:', newStats)
            setCharacterStats(newStats)
            
            // Track data freshness
            setLastDataUpdate(new Date())
            setDataSource('supabase')
            
            // Dispatch update event to notify other components
            window.dispatchEvent(new Event('character-stats-update'))
            window.dispatchEvent(new Event('level-update'))
            
            return true
          } else {
            console.warn('[Mobile Nav] No data in Supabase response')
          }
        } else {
          console.warn('[Mobile Nav] Supabase fetch failed:', response.status, response.statusText)
          // If it's an authentication error, don't retry
          if (response.status === 401 || response.status === 403) {
            console.log('[Mobile Nav] Authentication error, falling back to localStorage')
            setDataSource('localStorage')
            loadCharacterStats()
            return false
          }
        }
      } catch (error) {
        console.error('[Mobile Nav] Error fetching from Supabase:', error)
        // Don't crash the app, just log the error and continue
      }
      
      // Fallback to localStorage if Supabase fails
      console.log('[Mobile Nav] Falling back to localStorage data')
      setDataSource('localStorage')
      loadCharacterStats()
      return false
    }

    // Load stats immediately (try Supabase first, fallback to localStorage)
    if (user && isLoaded) {
      console.log('[Mobile Nav] User authenticated, loading fresh stats from API...')
      // Use the reliable refresh function to get fresh data
      refreshCharacterStats().then(success => {
        if (success) {
          console.log('[Mobile Nav] Initial API load successful')
        } else {
          console.log('[Mobile Nav] Initial API load failed, falling back to localStorage')
          loadCharacterStats()
        }
      }).catch(error => {
        console.error('[Mobile Nav] Initial API load error:', error)
        loadCharacterStats()
      })
    } else {
      console.log('[Mobile Nav] User not authenticated, loading from localStorage only')
      loadCharacterStats()
    }
    
    // Mark as initialized to prevent premature API calls
    setIsInitialized(true)

    // Set up interval to actively sync stats every 30 seconds (reduced frequency)
    const syncInterval = setInterval(() => {
      console.log('[Mobile Nav] Periodic sync - checking for stat updates...')
      if (user && isLoaded) {
        // Use simple refresh for periodic sync
        refreshCharacterStats().catch(error => {
          console.error('[Mobile Nav] Periodic sync failed:', error)
        })
      } else {
        console.log('[Mobile Nav] User not authenticated, skipping periodic sync')
      }
    }, 30000) // 30 seconds instead of 2 seconds

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
      clearInterval(syncInterval)
      window.removeEventListener("character-stats-update", handleStatsUpdate)
      window.removeEventListener("level-update", handleLevelUpdate)
    }
  }, [user, isLoaded]) // Add dependencies so it re-runs when auth changes
  
  // Force refresh on mount to ensure fresh data
  useEffect(() => {
    if (user && isLoaded && isInitialized) {
      console.log('[Mobile Nav] Component mounted with user, forcing refresh...')
      // Force a refresh to get the latest data
      refreshCharacterStats().then(success => {
        if (success) {
          console.log('[Mobile Nav] Force refresh successful')
        } else {
          console.log('[Mobile Nav] Force refresh failed, using cached data')
        }
      }).catch(error => {
        console.error('[Mobile Nav] Force refresh error:', error)
      })
    }
  }, [user, isLoaded, isInitialized])

  // Cleanup effect to reset refresh states
  useEffect(() => {
    return () => {
      // Reset all refresh states on cleanup
      setIsRefreshing(false)
      setBackgroundRefreshState('idle')
      setPullToRefreshState('idle')
      setPullDistance(0)
      setPullStartY(null)
    }
  }, [])
  
  // Reset refresh states when authentication changes
  useEffect(() => {
    if (!user || !isLoaded) {
      setIsRefreshing(false)
      setBackgroundRefreshState('idle')
      setPullToRefreshState('idle')
    }
  }, [user, isLoaded])

  // Global error handler for refresh states
  useEffect(() => {
    const handleGlobalError = () => {
      console.log('[Mobile Nav] Global error detected, resetting refresh states')
      setIsRefreshing(false)
      setBackgroundRefreshState('idle')
      setPullToRefreshState('idle')
    }

    // Listen for global errors
    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleGlobalError)
    
    // Listen for page visibility changes to reset stuck states
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[Mobile Nav] Page hidden, resetting refresh states')
        setIsRefreshing(false)
        setBackgroundRefreshState('idle')
        setPullToRefreshState('idle')
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleGlobalError)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
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
      <ErrorBoundary fallback={MobileErrorFallback}>
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
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Subtle pull progress indicator */}
            {pullDistance > 0 && pullDistance < 50 && (
              <div className="absolute top-0 left-0 right-0 z-30">
                <div className="flex justify-center">
                  <div className="w-16 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full opacity-60 transform transition-all duration-200"
                       style={{
                         width: `${Math.min(pullDistance * 2, 64)}px`,
                         opacity: Math.min(pullDistance / 50, 0.8)
                       }}>
                  </div>
                </div>
              </div>
            )}
            
            {/* Enhanced Pull-to-refresh indicator with smart states */}
            {pullToRefreshState !== 'idle' && (
              <div className="absolute top-0 left-0 right-0 z-50 flex justify-center">
                <div className={cn(
                  "px-4 py-2 rounded-b-lg text-sm font-medium transition-all duration-300 transform",
                  pullToRefreshState === 'pulling' && "bg-yellow-500/90 text-yellow-900 scale-100",
                  pullToRefreshState === 'refreshing' && "bg-blue-500/90 text-blue-900 scale-100",
                  pullToRefreshState === 'success' && "bg-green-500/90 text-green-900 scale-105",
                  pullToRefreshState === 'error' && "bg-red-500/90 text-red-900 scale-100"
                )}>
                  {pullToRefreshState === 'pulling' && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-yellow-700 border-t-transparent rounded-full animate-spin" />
                      <span>Pull down to refresh ({Math.round(pullDistance)}px)</span>
                    </div>
                  )}
                  {pullToRefreshState === 'refreshing' && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                      <span>Refreshing data...</span>
                    </div>
                  )}
                  {pullToRefreshState === 'success' && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 text-green-700">✓</div>
                      <span>Data refreshed successfully!</span>
                    </div>
                  )}
                  {pullToRefreshState === 'error' && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 text-red-700">⚠</div>
                      <span>Refresh failed, using cached data</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Background refresh status indicator */}
            {backgroundRefreshState !== 'idle' && (
              <div className="absolute top-16 left-4 right-4 z-40">
                <div className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 transform",
                  backgroundRefreshState === 'refreshing' && "bg-blue-500/80 text-blue-900 scale-100",
                  backgroundRefreshState === 'success' && "bg-green-500/80 text-green-900 scale-105",
                  backgroundRefreshState === 'error' && "bg-red-500/80 text-red-900 scale-100"
                )}>
                  {backgroundRefreshState === 'refreshing' && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                      <span>Syncing data in background...</span>
                    </div>
                  )}
                  {backgroundRefreshState === 'success' && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 text-green-700">✓</div>
                      <span>Data synced successfully!</span>
                    </div>
                  )}
                  {backgroundRefreshState === 'error' && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 text-red-700">⚠</div>
                      <span>Sync failed, using cached data</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex flex-col h-full">
              {/* Show loading state until initialized */}
              {!isInitialized ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-amber-400 text-sm">Loading navigation...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Enhanced Header */}
                  <div className="flex items-center justify-between p-5 border-b border-amber-800/20 bg-gradient-to-r from-amber-900/10 to-transparent">
                    <Logo />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (isRefreshing) return; // Prevent multiple clicks
                          
                          // Check if user is authenticated before making API calls
                          if (!user || !isLoaded) {
                            console.log('[Mobile Nav] User not authenticated, skipping refresh')
                            setIsRefreshing(false)
                            return
                          }
                          
                          console.log('[Mobile Nav] Manual refresh clicked, starting refresh...')
                          setIsRefreshing(true)
                          
                          try {
                            // Use the simple, reliable refresh function
                            const success = await refreshCharacterStats()
                            
                            if (success) {
                              console.log('[Mobile Nav] Manual refresh completed successfully')
                            } else {
                              console.log('[Mobile Nav] Manual refresh completed but no data received')
                            }
                          } catch (error) {
                            console.error('[Mobile Nav] Manual refresh failed:', error)
                          } finally {
                            // Always reset the loading state
                            setIsRefreshing(false)
                          }
                        }}
                        onDoubleClick={() => {
                          // Emergency reset on double-click if button gets stuck
                          console.log('[Mobile Nav] Emergency reset triggered by double-click')
                          setIsRefreshing(false)
                          setBackgroundRefreshState('idle')
                          setPullToRefreshState('idle')
                        }}
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
                    
                    {/* Data Freshness Indicator */}
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full transition-all duration-300",
                          dataSource === 'supabase' ? "bg-green-500" : 
                          dataSource === 'localStorage' ? "bg-yellow-500" : 
                          "bg-gray-500"
                        )} />
                        <span className={cn(
                          "text-xs transition-colors duration-300",
                          dataSource === 'supabase' ? "text-green-400" : 
                          dataSource === 'localStorage' ? "text-yellow-400" : 
                          "text-gray-400"
                        )}>
                          {dataSource === 'supabase' ? 'Live Data' : 
                           dataSource === 'localStorage' ? 'Cached Data' : 
                           'Unknown Source'}
                        </span>
                        
                        {/* Smart refresh status indicator */}
                        {backgroundRefreshState === 'refreshing' && (
                          <div className="flex items-center gap-1 text-blue-400">
                            <div className="w-2 h-2 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Syncing...</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        {lastDataUpdate && (
                          <span className="text-gray-400 text-xs">
                            Updated: {lastDataUpdate.toLocaleTimeString()}
                          </span>
                        )}
                        {lastRefreshAttempt && (
                          <span className="text-gray-500 text-xs">
                            Last sync: {lastRefreshAttempt.toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
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
                </>
              )}
            </div>
          </SheetContentWithoutClose>
        </Sheet>
      </ErrorBoundary>
    </div>
  )
}

 