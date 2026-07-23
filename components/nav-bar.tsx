"use client"

import { logger } from "@/lib/logger";

import { useState, useEffect, useRef, useCallback } from "react"
import { MainNav } from "@/components/main-nav"
import { Session } from '@supabase/supabase-js'
import { Castle, Coins, Star, Brain } from "lucide-react"
import { Logo } from "@/components/logo"
import { Progress } from "@/components/ui/progress"
import { NotificationCenter } from "@/components/notification-center"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"
import { CharacterStats, calculateExperienceForLevel, calculateLevelFromExperience, calculateLevelProgress } from "@/types/character"
import { getCharacterStats, fetchFreshCharacterStats } from "@/lib/character-stats-service"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useQuickAdd } from "@/components/quick-add-provider"
import { formatGold } from "@/lib/utils"
import { audioManager } from "@/lib/audio-manager"
import { InventoryBagOverlay } from "@/components/inventory-bag-overlay"
import { RandomEncounterModal } from "@/components/kingdom/random-encounter-modal"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FocusPointsModal } from "@/components/focus-points-modal"

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
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [characterStats, setCharacterStats] = useState({
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    gold: 1000,
    ascension_level: 0,
    focus_points: 0,
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

  const [hasActiveBuffs, setHasActiveBuffs] = useState(false);

  const checkBuffs = useCallback(async () => {
    try {
      const { getUserPreference } = await import("@/lib/user-preferences-manager");
      const prefs: any = await getUserPreference('active_alchemy_buffs') || {};
      const now = Date.now();
      let active = false;

      if (prefs.forgeLuckCharges > 0 || prefs.combatProtectionCharges > 0) active = true;
      if (prefs.doubleHarvestUntil && new Date(prefs.doubleHarvestUntil).getTime() > now) active = true;
      if (prefs.spellExpiresAt && new Date(prefs.spellExpiresAt).getTime() > now) active = true;

      if (!active) {
        const modRes = await fetch('/api/active-modifiers');
        if (modRes.ok) {
          const modData = await modRes.json();
          const mods = modData.modifiers || [];
          if (mods.some((m: any) => new Date(m.expires_at).getTime() > now)) {
            active = true;
          }
        }
      }
      setHasActiveBuffs(active);
    } catch (e) {
      // Ignore background check errors
    }
  }, []);

  useEffect(() => {
    const handleOpenBag = () => setIsBagOpen(true);
    window.addEventListener('open-inventory-bag', handleOpenBag);
    window.addEventListener('alchemy-buffs-update', checkBuffs);
    checkBuffs();
    return () => {
      window.removeEventListener('open-inventory-bag', handleOpenBag);
      window.removeEventListener('alchemy-buffs-update', checkBuffs);
    };
  }, [checkBuffs]);

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
          focus_points: localStats.focus_points || 0,
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
                gold: freshStats.gold,
                ascension_level: freshStats.ascension_level || 0,
                focus_points: freshStats.focus_points || 0
              }))
            }
          }
        }
      } catch (error) {
        logger.error("Error loading character stats:", error)
      }
    }

    // Load stats immediately (full sync)
    loadStats(true)

    // Set up periodic refresh every 5 minutes (was 30s) 
    let refreshInterval: NodeJS.Timeout | null = null;
    const startRefresh = () => {
      if (refreshInterval) clearInterval(refreshInterval);
      refreshInterval = setInterval(() => loadStats(true), 5 * 60 * 1000);
    };
    const stopRefresh = () => {
      if (refreshInterval) clearInterval(refreshInterval);
      refreshInterval = null;
    };
    const onVisibility = () => document.hidden ? stopRefresh() : startRefresh();
    document.addEventListener('visibilitychange', onVisibility);
    startRefresh();

    // Listen for character stats updates (local only)
    const handleStatsUpdate = () => loadStats(false)
    window.addEventListener("character-stats-update", handleStatsUpdate)

    return () => {
      stopRefresh()
      document.removeEventListener('visibilitychange', onVisibility)
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
  }, [])

  if (!isClient) {
    return null; // Return null on server-side to prevent hydration mismatch
  }


  const levelProgress = calculateLevelProgress(characterStats.experience)

  return (
    <>
      <div className="hidden lg:landscape:block md:border-b bg-black md:border-zinc-800 z-10 relative">
        <div className="flex h-16 items-center pt-0 md:pt-0 safe-area-inset-top">
        {/* Desktop Navigation */}
        <div className="hidden md:flex">
          <MainNav />
        </div>
        {/* Desktop right-side stats, notification, user nav */}
        <div className="ml-auto flex items-center space-x-4 hidden md:flex pr-6">
          <div className="flex items-center space-x-2">
            {(() => {
              const expForPreviousLevels = Array.from({ length: characterStats.level - 1 }, (_, i) => calculateExperienceForLevel(i + 1)).reduce((sum, exp) => sum + exp, 0);
              const expInCurrentLevel = Math.max(0, characterStats.experience - expForPreviousLevels);
              const expForCurrentLevel = calculateExperienceForLevel(characterStats.level);
              const totalNextLevelExp = expForPreviousLevels + expForCurrentLevel;
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2 cursor-help group transition-opacity hover:opacity-90">
                      <div
                        className={`text-sm font-medium transition-all duration-300 ${levelHighlight ? 'bg-amber-300/40 rounded px-2 py-1 shadow' : ''}`}
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {characterStats.ascension_level > 0 && (
                          <span className="inline-flex items-center text-amber-500 mr-2 font-bold">
                            <Star className="h-4 w-4 fill-amber-500 mr-1" />
                            {characterStats.ascension_level}
                          </span>
                        )}
                        Lvl {characterStats.level}
                      </div>
                      <Progress 
                        value={levelProgress} 
                        className="w-32 h-2" 
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-950 border-amber-900/50 text-zinc-100 p-3 rounded-lg shadow-xl text-xs space-y-1">
                    <div className="font-bold text-amber-400 font-serif">Level {characterStats.level} Progress</div>
                    <div>Level XP: <span className="font-mono font-semibold text-amber-200">{expInCurrentLevel.toLocaleString()} / {expForCurrentLevel.toLocaleString()} XP</span> ({Math.round(levelProgress)}%)</div>
                    <div className="text-[11px] text-zinc-400">Total Experience: <span className="font-mono font-medium text-zinc-300">{Math.floor(characterStats.experience).toLocaleString()} / {totalNextLevelExp.toLocaleString()} XP</span></div>
                  </TooltipContent>
                </Tooltip>
              );
            })()}
            <div
              className={`flex items-center space-x-1 transition-all duration-300 ${goldHighlight ? 'bg-amber-400/30 rounded px-2 py-1 shadow' : ''}`}
              aria-live="polite"
              aria-atomic="true"
            >
              <Coins className="h-4 w-4" />
              <AnimatedNumber 
                value={characterStats.gold} 
                formatFn={(val) => formatGold(val)} 
                className="text-sm font-medium" 
                title={`${characterStats.gold} Gold`}
              />
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowFocusModal(true)}
                  className="flex items-center space-x-1.5 bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ml-2"
                >
                  <Brain className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
                  <span>{characterStats.focus_points || 0}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-950 border-purple-900/50 text-purple-200 p-2 rounded-lg text-xs">
                Click to spend Focus Points (XP Boost, Rush Timers, Astral Rewards)
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center space-x-1 pr-2 border-r border-zinc-800">
            <Button
              variant="ghost"
              size="icon"
              className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-full text-xl relative"
              onClick={() => {
                audioManager.playClick();
                setIsBagOpen(true);
              }}
              title={hasActiveBuffs ? "Open Bag (Active Multipliers Active! ✨)" : "Open Bag"}
            >
              🎒
              {hasActiveBuffs && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-purple-500 text-[8px] font-bold text-white items-center justify-center shadow-lg">✨</span>
                </span>
              )}
            </Button>

          </div>
          <div className="relative">
            <NotificationCenter />
          </div>
          <UserNav />
        </div>
      </div>
    </div>
      <InventoryBagOverlay open={isBagOpen} onClose={() => setIsBagOpen(false)} />
      <RandomEncounterModal />
      <FocusPointsModal
        isOpen={showFocusModal}
        onClose={() => setShowFocusModal(false)}
        currentFocusPoints={characterStats.focus_points || 0}
        onStatsUpdate={() => {
          const stats = getCharacterStats();
          setCharacterStats(prev => ({ ...prev, gold: stats.gold, focus_points: stats.focus_points || 0 }));
        }}
      />
    </>
  )
}

