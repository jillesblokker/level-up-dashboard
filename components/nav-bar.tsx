"use client"

import { logger } from "@/lib/logger";

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

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
  const [airshipCargoReady, setAirshipCargoReady] = useState(false);
  const goldRef = useRef(characterStats.gold);
  const levelRef = useRef(characterStats.level);

  useEffect(() => {
    const handleAirshipStatus = (e: Event) => {
      setAirshipCargoReady((e as CustomEvent)?.detail?.ready ?? false);
    };
    const handleOpenBag = () => {
      setIsBagOpen(true);
    };
    window.addEventListener('airship-cargo-status', handleAirshipStatus);
    window.addEventListener('open-inventory-bag', handleOpenBag);
    return () => {
      window.removeEventListener('airship-cargo-status', handleAirshipStatus);
      window.removeEventListener('open-inventory-bag', handleOpenBag);
    };
  }, []);

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
        {/* Desktop right-side notification, airship cargo, user nav */}
        <div className="ml-auto flex items-center space-x-4 hidden md:flex pr-6">
          <div className="flex items-center space-x-2">

            {airshipCargoReady && (
              <Button
                size="sm"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/kingdom?tab=airship';
                  }
                }}
                className="bg-amber-950/90 border border-amber-500/60 text-amber-300 hover:bg-amber-900 text-xs px-3 py-1 rounded-full font-serif flex items-center gap-1.5 shadow-md shadow-amber-950/40 animate-pulse transition-all"
              >
                ⛵ Claim Airship Cargo
              </Button>
            )}

            {/* Desktop right-side controls */}
          </div>
          <div className="flex items-center space-x-1 pr-2 border-r border-zinc-800">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-amber-500/10 rounded-full relative p-1 transition-transform hover:scale-105 active:scale-95"
              onClick={() => {
                audioManager.playClick();
                setIsBagOpen(true);
              }}
              title="Open Bag"
            >
              <Image
                src="/images/ui/medieval-backpack.png"
                alt="Medieval Backpack"
                width={26}
                height={26}
                className="object-contain drop-shadow"
                unoptimized
              />
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

