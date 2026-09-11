"use client"

import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";

import { useState, useEffect, useRef, useCallback } from "react"
import { Edit, X, Upload, Sword, Lock, Brain, Crown, Castle as CastleIcon, Hammer, Heart, AlertCircle, Loader2, Sparkles, AlertTriangle, Star, Coins, Clock, Check, ChevronDown, Utensils, Compass, Shield, FlaskConical, Zap } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { ChroniclesCard } from '@/components/chronicles-card'
import { ElementalAura } from '@/components/character/elemental-aura'
import { LegacyRoadmap } from "@/components/character/legacy-roadmap"
import { playSFX } from "@/lib/sound-manager";
import dynamic from 'next/dynamic';

const ApothecaModal = dynamic(
  () => import('@/components/kingdom/apotheca-modal').then((mod) => mod.ApothecaModal),
  { ssr: false }
);
import { CollectibleRune } from '@/components/runes/collectible-rune';
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { calculateLevelProgress, CharacterStats, calculateLevelFromExperience, calculateExperienceForLevel } from "@/types/character"
import { getCharacterStats, characterStatsService } from "@/lib/character-stats-service"
import { storageService } from '@/lib/storage-service'
import { getTitleProgress, TITLES } from '@/lib/title-manager'
import { getStrengths, calculateStrengthProgress, Strength } from '@/lib/strength-manager'
import { AnimatedCounter } from '@/components/ui/animated-counter'

import { HeaderSection } from '@/components/HeaderSection'
import { PageGuide } from '@/components/page-guide'
import { TEXT_CONTENT } from '@/lib/text-content'
import { gainGold } from '@/lib/gold-manager'
import { FocusPointsModal } from '@/components/focus-points-modal'
import { SigilCrestEditor } from '@/components/character/sigil-crest'
import { PaperdollEquipmentGrid } from '@/components/character/PaperdollEquipmentGrid'
import { SwordStaffOrbCard, SwordStaffSectionHeader } from '@/components/ui/sword-staff-orb-card'
import { getUserPreference, setUserPreference } from '@/lib/user-preferences-manager'


// Character progression types
interface Title {
  id: string
  name: string
  description: string
  category: string
  requirement: string
  unlocked: boolean
  equipped: boolean
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
}

interface Perk {
  id: string
  name: string
  description: string
  category: string
  effect: string
  level: number
  maxLevel: number
  unlocked: boolean
  equipped: boolean
  active: boolean
  lastActivated?: string // ISO date string
  expiresAt?: string // ISO date string
  upgradeCost: number // Gold cost to upgrade
  activationCost: number // Gold cost to activate
  requiredLevel: number
}

const categoryMeta = {
  might: { icon: Sword, iconClass: 'text-red-500' },
  knowledge: { icon: Brain, iconClass: 'text-blue-500' },
  honor: { icon: Crown, iconClass: 'text-yellow-500' },
  castle: { icon: CastleIcon, iconClass: 'text-purple-500' },
  craft: { icon: Hammer, iconClass: 'text-amber-500' },
  vitality: { icon: Heart, iconClass: 'text-green-500' },
};

export default function CharacterPage() {
  const { user } = useUser()

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [strengths, setStrengths] = useState<Strength[]>(getStrengths());

  const [perks, setPerks] = useState<Perk[]>(
    TEXT_CONTENT.character.data.perks.map(p => ({
      ...p,
      level: 0,
      maxLevel: 5,
      unlocked: false,
      equipped: false,
      active: false,
      upgradeCost: 100,
      activationCost: 50,
    } as Perk))
  )

  const [characterStats, setCharacterStats] = useState<CharacterStats>({
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    gold: 1000,
    ascension_level: 0,
    titles: {
      equipped: "Novice Adventurer",
      unlocked: 0,
      total: 0
    },
    perks: {
      active: 0,
      total: 6
    }
  });

  const [titlesList, setTitlesList] = useState<any[]>([]);


  const [isHovering, setIsHovering] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [coverImage, setCoverImage] = useState(() => {
    if (typeof window !== 'undefined' && window.headerImages) {
      return window.headerImages.character || "/images/headers/character-header.webp"
    }
    return "/images/headers/character-header.webp"
  })
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showFocusModal, setShowFocusModal] = useState(false)
  const [showApothecaModal, setShowApothecaModal] = useState(false)
  const [activePotionPerks, setActivePotionPerks] = useState<{ name: string, effect: string, expiresAt: string }[]>([])
  const [activeTab, setActiveTab] = useState("titles")

  // Guardian Pet Affections State & Persistence
  const [petAffections, setPetAffections] = useState<Record<string, number>>({
    'ember-drake': 85,
    'sage-owl': 70,
    'spirit-sprite': 60,
    'grove-fox': 50,
  });

  useEffect(() => {
    const loadPetAffections = async () => {
      try {
        const stored = (await getUserPreference('thrivehaven_pet_affections')) as Record<string, number> | null;
        const gPref = (await getUserPreference('habit_guardian_state')) as any;
        setPetAffections((prev) => {
          const merged = { ...prev, ...(stored || {}) };
          if (gPref && gPref.selectedId && typeof gPref.affection === 'number') {
            merged[gPref.selectedId] = gPref.affection;
          }
          return merged;
        });
      } catch (err) {
        logger.error('[Character] Failed to load pet affections:', err);
      }
    };
    loadPetAffections();
    window.addEventListener('pet-affection-update', loadPetAffections);
    return () => window.removeEventListener('pet-affection-update', loadPetAffections);
  }, []);

  const handleFeedPet = async (pet: { id: string; name: string }) => {
    const currentAffection = petAffections[pet.id] ?? 50;
    if (currentAffection >= 100) {
      toast({
        title: "❤️ Max Affection Reached!",
        description: `${pet.name} is already at 100% affection and completely full!`,
      });
      return;
    }

    const updatedAffection = Math.min(100, currentAffection + 5);
    const updatedAffections = {
      ...petAffections,
      [pet.id]: updatedAffection,
    };

    setPetAffections(updatedAffections);
    playSFX('petFeed');
    gainGold(10, 'pet-treat');

    try {
      await setUserPreference('thrivehaven_pet_affections', updatedAffections);

      // If this pet is the active habit guardian, sync with habit_guardian_state too!
      const gPref = (await getUserPreference('habit_guardian_state')) as any;
      if (gPref && gPref.selectedId === pet.id) {
        const updatedGuardian = {
          ...gPref,
          affection: updatedAffection,
          experience: (gPref.experience || 0) + 25,
        };
        await setUserPreference('habit_guardian_state', updatedGuardian);
      }

      window.dispatchEvent(new CustomEvent('pet-affection-update', { detail: { petId: pet.id, affection: updatedAffection } }));
      window.dispatchEvent(new Event('character-stats-update'));
    } catch (err) {
      logger.error('[Character] Failed to save pet affection:', err);
    }

    toast({
      title: `🍎 Fed ${pet.name}!`,
      description: `Increased pet affection to ${updatedAffection}%! (+5% boost, passive yield strengthened)`,
    });
  };

  // Check and unlock perks based on character level
  const checkAndUnlockPerks = useCallback((level: number) => {
    setPerks(prevPerks => {
      let hasChanges = false;

      const updatedPerks = prevPerks.map(perk => {
        const shouldBeUnlocked = perk.requiredLevel ? level >= perk.requiredLevel : perk.unlocked;

        if (shouldBeUnlocked !== perk.unlocked) {
          hasChanges = true;
          return { ...perk, unlocked: shouldBeUnlocked };
        }
        return perk;
      });

      if (!hasChanges) return prevPerks;

      // Save updated perks to localStorage for database
      localStorage.setItem('character-perks', JSON.stringify(updatedPerks));

      return updatedPerks;
    });
  }, []);

  // Check for perk unlocks when character level changes
  useEffect(() => {
    checkAndUnlockPerks(characterStats.level);
  }, [characterStats.level, checkAndUnlockPerks]);

  // Load character stats and perks (Supabase first, then localStorage)
  useEffect(() => {
    const loadCharacterStats = () => {
      try {
        const stats = getCharacterStats()
        const calculatedLevel = calculateLevelFromExperience(stats.experience)
        setCharacterStats({
          level: calculatedLevel,
          experience: stats.experience,
          experienceToNextLevel: calculateExperienceForLevel(calculatedLevel),
          gold: stats.gold,
          ascension_level: stats.ascension_level || 0,
          titles: { equipped: '', unlocked: 0, total: 0 },
          perks: { active: 0, total: 0 },
          ember_essence: stats.ember_essence || 0,
          frost_essence: stats.frost_essence || 0,
          tide_essence: stats.tide_essence || 0,
          verdant_essence: stats.verdant_essence || 0,
          focus_points: stats.focus_points || 0,
        })
      } catch (error) {
        logger.error('Error loading character stats:', error)
      }
    }

    const loadPerks = async () => {
      try {
        // Try Supabase user preference
        try {
          const { getUserPreference } = await import('@/lib/user-preferences-manager')
          const uid = user?.id

          if (uid) {
            const pref = await getUserPreference('character-perks')
            if (pref) {
              if (typeof pref === 'string') {
                setPerks(JSON.parse(pref))
              } else if (Array.isArray(pref)) {
                setPerks(pref as Perk[])
              }
              return
            }
          }
        } catch { }
        // Fallback localStorage
        const savedPerks = localStorage.getItem('character-perks')
        if (savedPerks) {
          const parsedPerks = JSON.parse(savedPerks)
          setPerks(parsedPerks)
        }
      } catch (error) {
        logger.error('Error loading perks:', error)
        throw new Error('Failed to load perks');
      }
    }

    const loadStrengths = async () => {
      try {
        // Try to fetch from server API first (Source of Truth)
        try {
          const { fetchWithAuth } = await import('@/lib/fetchWithAuth');
          const response = await fetchWithAuth('/api/character-strengths');
          if (response.ok) {
            const result = await response.json();
            if (result.strengths && Array.isArray(result.strengths)) {
              setStrengths(result.strengths);
              // Also save to local storage for offline fallback correctness
              localStorage.setItem('character-strengths', JSON.stringify(result.strengths));
              return;
            }
          }
        } catch (err) {
          logger.error('Failed to fetch strengths from API', err);
        }

        // Fallback to local storage logic
        const strengths = getStrengths();
        // Ensure all 8 categories are present (including wellness and exploration)
        const defaultStrengths = TEXT_CONTENT.character.data.strengths.map(s => ({
          ...s,
          level: 1,
          experience: 0,
          experienceToNextLevel: 100
        }));

        // Merge saved strengths with defaults to ensure all categories are present
        const mergedStrengths = defaultStrengths.map(defaultStrength => {
          const savedStrength = strengths.find(s => s.category === defaultStrength.category);
          return savedStrength || defaultStrength;
        });

        setStrengths(mergedStrengths);
      } catch (error) {
        logger.error('Error loading strengths:', error)
        throw new Error('Failed to load strengths');
      }
    }

    const loadActivePotionPerks = async () => {
      try {
        const { fetchWithAuth } = await import('@/lib/fetchWithAuth');
        const response = await fetchWithAuth('/api/active-modifiers');
        if (response.ok) {
          const data = await response.json();
          if (data.modifiers) {
            const mapped = data.modifiers.map((m: any) => ({
              name: m.name,
              effect: m.effect || "Active Potion",
              expiresAt: m.expires_at
            }));
            setActivePotionPerks(mapped);

            // Sync to local storage for offline/fallback
            const localMap: Record<string, any> = {};
            mapped.forEach((m: any) => localMap[m.name] = { effect: m.effect, expiresAt: m.expiresAt });
            localStorage.setItem('active-potion-perks', JSON.stringify(localMap));
          }
        }
      } catch (e) {
        logger.error('Error loading active potion perks from API, falling back to local:', e)
        try {
          const perksObj = JSON.parse(localStorage.getItem('active-potion-perks') || '{}')
          const now = new Date()
          const perksArr = Object.entries(perksObj)
            .map(([name, value]) => {
              if (typeof value === 'object' && value !== null && 'effect' in value && 'expiresAt' in value) {
                const { effect, expiresAt } = value as { effect: string, expiresAt: string }
                return { name, effect, expiresAt }
              }
              return null
            })
            .filter((perk): perk is { name: string, effect: string, expiresAt: string } => !!perk && new Date(perk.expiresAt) > now)
          setActivePotionPerks(perksArr)
        } catch (localErr) { logger.error(localErr) }
      }
    }

    const loadTitles = async () => {
      try {
        const { fetchWithAuth } = await import('@/lib/fetchWithAuth');
        const response = await fetchWithAuth('/api/titles');
        if (response.ok) {
          const data = await response.json();
          if (data.titles) {
            const mapped = data.titles.map((t: any) => ({
              ...t,
              level: t.required_level // Map for compatibility
            }));
            setTitlesList(mapped);

            const unlockedCount = mapped.filter((t: any) => t.is_unlocked).length;
            const equippedTitle = mapped.find((t: any) => t.is_equipped);

            setCharacterStats(prev => ({
              ...prev,
              titles: {
                equipped: equippedTitle ? equippedTitle.name : (prev.titles.equipped || "Novice Adventurer"),
                unlocked: unlockedCount,
                total: mapped.length
              }
            }));
          }
        }
      } catch (e) {
        logger.error("Error loading titles", e);
      }
    }

    const loadAllData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        loadCharacterStats()
        await loadPerks() // Wait for perks
        await loadStrengths() // Wait for strengths
        await loadTitles() // SQL-based titles
        loadActivePotionPerks()

      } catch (error) {
        logger.error('Character page error:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();

    // Listen for updates
    window.addEventListener('character-stats-update', loadCharacterStats)
    window.addEventListener('global-sync-tick', loadCharacterStats)
    window.addEventListener('character-perks-update', loadPerks)
    window.addEventListener('character-strengths-update', loadStrengths)
    window.addEventListener('character-inventory-update', loadActivePotionPerks)

    return () => {
      window.removeEventListener('character-stats-update', loadCharacterStats)
      window.removeEventListener('global-sync-tick', loadCharacterStats)
      window.removeEventListener('character-perks-update', loadPerks)
      window.removeEventListener('character-strengths-update', loadStrengths)
      window.removeEventListener('character-inventory-update', loadActivePotionPerks)
    }
  }, [user?.id])

  // Polling for character data changes instead of real-time sync - DISABLED TO PREVENT INFINITE LOOPS
  useEffect(() => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : undefined;
    if (!userId) return;

    // Disable polling to prevent infinite loops and page reloads
    // logger.debug('[Character Page] Polling disabled to prevent infinite loops');

    // Only load data once on mount
    // Data will be updated via event listeners instead
  }, []);

  // Auto-unlock titles when level changes
  useEffect(() => {
    const unlockTitles = async () => {
      if (characterStats.level > 0) {
        try {
          const { fetchWithAuth } = await import('@/lib/fetchWithAuth');
          await fetchWithAuth('/api/titles/unlock', {
            method: 'POST',
            body: JSON.stringify({ level: characterStats.level })
          });

          const response = await fetchWithAuth('/api/titles');
          if (response.ok) {
            const data = await response.json();
            if (data.titles) {
              const mapped = data.titles.map((t: any) => ({ ...t, level: t.required_level }));
              setTitlesList(mapped);

              const unlockedCount = mapped.filter((t: any) => t.is_unlocked).length;
              const equippedTitle = mapped.find((t: any) => t.is_equipped);

              setCharacterStats(prev => ({
                ...prev,
                titles: {
                  equipped: equippedTitle ? equippedTitle.name : (prev.titles.equipped || "Novice Adventurer"),
                  unlocked: unlockedCount,
                  total: mapped.length
                }
              }));
            }
          }
        } catch (e) {
          logger.error("Error auto-unlocking titles:", e);
        }
      }
    };

    const timer = setTimeout(unlockTitles, 1000);
    return () => clearTimeout(timer);
  }, [characterStats.level]);

  const equipTitle = async (titleId: string) => {
    // Optimistic Update
    const newTitles = titlesList.map(t => ({
      ...t,
      is_equipped: t.id === titleId
    }));
    setTitlesList(newTitles);

    const equipped = newTitles.find(t => t.is_equipped);
    if (equipped) {
      setCharacterStats(prev => ({
        ...prev,
        titles: { ...prev.titles, equipped: equipped.name }
      }));

      toast({
        title: "Title Equipped",
        description: `You are now known as ${equipped.name}`,
      });
    }

    try {
      const { fetchWithAuth } = await import('@/lib/fetchWithAuth');
      await fetchWithAuth('/api/titles', {
        method: 'POST',
        body: JSON.stringify({ action: 'equip', titleId })
      });
    } catch (e) {
      logger.error("Error equipping title:", e);
      toast({
        title: "Error",
        description: "Failed to save title selection.",
        variant: "destructive"
      });
    }
  };

  const handleAscension = async () => {
    try {
      const { fetchWithAuth } = await import('@/lib/fetchWithAuth');
      const response = await fetchWithAuth('/api/ascension', { method: 'POST' });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Ascension Successful!",
          description: "You have been reborn with new power. Level reset to 1.",
        });

        // Dynamically re-hydrate stats & perks without forced page reload
        await characterStatsService.fetchAndMerge();
        const freshStats = getCharacterStats();
        const calculatedLevel = calculateLevelFromExperience(freshStats.experience || 0);
        setCharacterStats(prev => ({
          ...prev,
          level: calculatedLevel,
          experience: freshStats.experience || 0,
          experienceToNextLevel: calculateExperienceForLevel(calculatedLevel),
          gold: freshStats.gold || 0,
          ascension_level: freshStats.ascension_level || 0,
          ember_essence: freshStats.ember_essence || 0,
          frost_essence: freshStats.frost_essence || 0,
          tide_essence: freshStats.tide_essence || 0,
          verdant_essence: freshStats.verdant_essence || 0,
          focus_points: freshStats.focus_points || 0,
        }));
      } else {
        toast({
          title: "Ascension Failed",
          description: data.error || "Could not process ascension.",
          variant: "destructive"
        });
      }
    } catch (e) {
      logger.error("Ascension error:", e);
      toast({
        title: "Error",
        description: "Network error occurred.",
        variant: "destructive"
      });
    }
  };

  // Helper function to check if perk can be activated (weekly cooldown)
  const canActivatePerk = (perk: Perk): boolean => {
    if (!perk.unlocked || perk.active) return false;

    if (!perk.lastActivated) return true;

    const lastActivated = new Date(perk.lastActivated);
    const now = new Date();
    const weekInMs = 7 * 24 * 60 * 60 * 1000;

    return (now.getTime() - lastActivated.getTime()) >= weekInMs;
  };

  // Helper function to check if perk is expired
  const isPerkExpired = (perk: Perk): boolean => {
    if (!perk.expiresAt) return false;
    return new Date() > new Date(perk.expiresAt);
  };

  // Helper function to get time until perk expires
  const getTimeUntilExpiry = (perk: Perk): string => {
    if (!perk.active || !perk.expiresAt) return "";

    const expiresAt = new Date(perk.expiresAt);
    const now = new Date();
    const timeRemaining = expiresAt.getTime() - now.getTime();

    if (timeRemaining <= 0) return "Expired";

    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));

    return `${hours}h ${minutes}${TEXT_CONTENT.character.perks.remaining}`;
  };

  // Activate perk
  const activatePerk = async (perkId: string) => {
    const perk = perks.find(p => p.id === perkId);
    if (!perk) return;

    if (!perk.unlocked) {
      toast({
        title: TEXT_CONTENT.character.toasts.perkLocked.title,
        description: TEXT_CONTENT.character.toasts.perkLocked.desc.replace("{level}", String(perk.requiredLevel)),
        variant: "destructive"
      });
      return;
    }

    if (!canActivatePerk(perk)) {
      toast({
        title: TEXT_CONTENT.character.toasts.activateLimit.title,
        description: TEXT_CONTENT.character.toasts.activateLimit.desc,
        variant: "destructive"
      });
      return;
    }

    if (characterStats.gold < perk.activationCost) {
      toast({
        title: TEXT_CONTENT.character.toasts.insufficientGold.title,
        description: TEXT_CONTENT.character.toasts.insufficientGold.desc.replace("{amount}", String(perk.activationCost)),
        variant: "destructive"
      });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const updatedPerks = perks.map(p =>
      p.id === perkId
        ? {
          ...p,
          active: true,
          lastActivated: now.toISOString(),
          expiresAt: expiresAt.toISOString()
        } as Perk
        : p
    );

    setPerks(updatedPerks);

    // Update character stats (deduct gold)
    const newStats = {
      ...characterStats,
      gold: characterStats.gold - perk.activationCost
    };
    setCharacterStats(newStats);

    // Persist perks to Supabase; fallback local
    try {
      const { setUserPreference } = await import('@/lib/user-preferences-manager')
      const uid = user?.id
      if (uid) await setUserPreference('character-perks', JSON.stringify(updatedPerks))
    } catch { }
    localStorage.setItem('character-perks', JSON.stringify(updatedPerks))

    toast({
      title: TEXT_CONTENT.character.toasts.perkActivated.title,
      description: TEXT_CONTENT.character.toasts.perkActivated.desc.replace("{name}", perk.name),
    });
  };

  // Deactivate perk
  const deactivatePerk = async (perkId: string) => {
    const updatedPerks = perks.map(p =>
      p.id === perkId
        ? { ...p, active: false, expiresAt: undefined as string | undefined } as Perk
        : p
    );

    setPerks(updatedPerks);
    try {
      const { setUserPreference } = await import('@/lib/user-preferences-manager')
      const uid = user?.id
      if (uid) await setUserPreference('character-perks', JSON.stringify(updatedPerks))
    } catch { }
    localStorage.setItem('character-perks', JSON.stringify(updatedPerks));

    const perk = perks.find(p => p.id === perkId);
    if (perk) {
      toast({
        title: TEXT_CONTENT.character.toasts.perkDeactivated.title,
        description: TEXT_CONTENT.character.toasts.perkDeactivated.desc.replace("{name}", perk.name),
      });
    }
  };

  // Upgrade perk
  const upgradePerk = async (perkId: string) => {
    const perk = perks.find(p => p.id === perkId);
    if (!perk) return;

    if (!perk.unlocked) {
      toast({
        title: TEXT_CONTENT.character.toasts.perkLocked.title,
        description: TEXT_CONTENT.character.toasts.perkLocked.desc.replace("{level}", String(perk.requiredLevel)),
        variant: "destructive"
      });
      return;
    }

    if (perk.level >= perk.maxLevel) {
      toast({
        title: TEXT_CONTENT.character.toasts.maxLevel.title,
        description: TEXT_CONTENT.character.toasts.maxLevel.desc,
        variant: "destructive"
      });
      return;
    }

    if (characterStats.gold < perk.upgradeCost) {
      toast({
        title: TEXT_CONTENT.character.toasts.insufficientGoldUpgrade.title,
        description: TEXT_CONTENT.character.toasts.insufficientGoldUpgrade.desc.replace("{amount}", String(perk.upgradeCost)),
        variant: "destructive"
      });
      return;
    }

    const updatedPerks = perks.map(p =>
      p.id === perkId
        ? { ...p, level: p.level + 1 } as Perk
        : p
    );

    setPerks(updatedPerks);

    // Update character stats (deduct gold)
    const newStats = {
      ...characterStats,
      gold: characterStats.gold - perk.upgradeCost
    };
    setCharacterStats(newStats);

    // Persist perks to Supabase; fallback local
    try {
      const { setUserPreference } = await import('@/lib/user-preferences-manager')
      const uid = user?.id
      if (uid) await setUserPreference('character-perks', JSON.stringify(updatedPerks))
    } catch { }
    localStorage.setItem('character-perks', JSON.stringify(updatedPerks));

    toast({
      title: TEXT_CONTENT.character.toasts.perkUpgraded.title,
      description: TEXT_CONTENT.character.toasts.perkUpgraded.desc.replace("{name}", perk.name).replace("{level}", String(perk.level + 1)),
    });
  };

  // Check for expired perks on component mount and periodically
  useEffect(() => {
    const checkExpiredPerks = () => {
      const updatedPerks = perks.map(perk => {
        if (perk.active && isPerkExpired(perk)) {
          return { ...perk, active: false, expiresAt: undefined as string | undefined } as Perk;
        }
        return perk;
      });

      if (JSON.stringify(updatedPerks) !== JSON.stringify(perks)) {
        setPerks(updatedPerks);
      }
    };

    checkExpiredPerks();
    const interval = setInterval(checkExpiredPerks, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [perks]);

  const handleImageUpload = (file: File) => {
    setIsUploading(true)

    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const result = event.target?.result as string
          setCoverImage(result)
          localStorage.setItem("character-header-image", result)
          // Update global state
          if (typeof window !== 'undefined' && window.headerImages) {
            window.headerImages.character = result
          }
          setIsUploading(false)
          setShowUploadModal(false)
        } catch (err) {
          logger.error("Error processing file:", err)
          setIsUploading(false)
        }
      }
      reader.onerror = () => {
        logger.error("Error reading file")
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      logger.error("Error initiating file read:", err)
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }



  return (
    <div className="min-h-screen bg-black">
      <HeaderSection
        title={TEXT_CONTENT.character.header.title}
        imageSrc={coverImage}
        canEdit={true}
        onImageUpload={handleImageUpload}
        defaultBgColor="bg-amber-900"
        shouldRevealImage={true}
        guideComponent={
          <PageGuide
            title={TEXT_CONTENT.character.header.guide.title}
            subtitle={TEXT_CONTENT.character.header.guide.subtitle}
            sections={[
              {
                title: TEXT_CONTENT.character.header.guide.sections.titles.title,
                icon: Crown,
                content: TEXT_CONTENT.character.header.guide.sections.titles.content
              },
              {
                title: TEXT_CONTENT.character.header.guide.sections.perks.title,
                icon: Heart,
                content: TEXT_CONTENT.character.header.guide.sections.perks.content
              },
              {
                title: TEXT_CONTENT.character.header.guide.sections.strengths.title,
                icon: Sword,
                content: TEXT_CONTENT.character.header.guide.sections.strengths.content
              },
              {
                title: TEXT_CONTENT.character.header.guide.sections.inventory.title,
                icon: Crown,
                content: TEXT_CONTENT.character.header.guide.sections.inventory.content
              }
            ]}
          />
        }
      />

      {/* Error Display */}
      {error && (
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Card className="border-red-600 bg-red-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">{TEXT_CONTENT.character.ui.error}</h3>
                  <p className="text-sm">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    {TEXT_CONTENT.character.ui.reload}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading Display */}
      {isLoading && !error && (
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{TEXT_CONTENT.character.ui.loading}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-6">
          {/* BENTO ROW 1 — Hero Identity & Paperdoll Equipment Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Bento Tile 1A: Hero Identity Card */}
            <div className="lg:col-span-5 flex flex-col justify-between medieval-card p-6 rounded-2xl shadow-xl">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold font-medieval text-amber-400">
                        {TEXT_CONTENT.character.ui.overview.level.replace("{level}", String(characterStats.level))}
                      </h3>
                      <SigilCrestEditor userId={user?.id} />
                      <CollectibleRune
                        id="ingwaz_vault"
                        runeId="ingwaz"
                        symbol="ᛜ"
                        name="Ingwaz"
                        meaning="The sacred seed, inner potential, and fruition of character growth"
                        className="ml-1"
                      />
                    </div>
                    <p className="text-xs text-zinc-400 font-serif mt-0.5">Hero progression & alchemy</p>
                  </div>
                  {(characterStats.ascension_level || 0) > 0 && (
                    <Badge variant="outline" className="text-amber-400 border-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Ascension {characterStats.ascension_level}
                    </Badge>
                  )}
                </div>

                {/* Glowing Paragon Avatar Ring */}
                <div className="relative inline-block my-1">
                  <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-500 via-purple-500 to-amber-500 blur-md opacity-75 animate-pulse" />
                  <Badge className="relative bg-gradient-to-r from-amber-950 via-zinc-950 to-amber-950 border border-amber-400 text-amber-300 px-4 py-1.5 rounded-full font-medieval text-xs tracking-wider shadow-xl">
                    👑 Paragon champion rank: Level {characterStats.level} King
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <Progress value={calculateLevelProgress(characterStats.experience)} className="h-2" />
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    {(() => {
                      const expForPreviousLevels = Array.from({ length: characterStats.level - 1 }, (_, i) => calculateExperienceForLevel(i + 1)).reduce((sum, exp) => sum + exp, 0);
                      const expInCurrentLevel = Math.max(0, Math.floor(characterStats.experience - expForPreviousLevels));
                      const expForCurrentLevel = calculateExperienceForLevel(characterStats.level);
                      return (
                        <p>
                          <AnimatedCounter value={expInCurrentLevel} duration={800} /> / {expForCurrentLevel.toLocaleString()} XP to Level {characterStats.level + 1}
                        </p>
                      );
                    })()}

                    {characterStats.level >= 100 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="h-6 text-xs bg-amber-600 hover:bg-amber-700 text-white border-amber-800">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Ascend
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-900 border-amber-700 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-amber-500 font-serif text-xl flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5" />
                              Perform ascension?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-300">
                              This action will reset your Level to 1 and Experience to 0.
                              You will keep your items, gold, and titles.
                              <br /><br />
                              Ascending grants you a permanent <strong>Ascension Level</strong> which boosts your prestige.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-600">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleAscension} className="bg-amber-600 text-white hover:bg-amber-700 border-amber-800">
                              Confirm ascension
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>

              {/* Essence Inventory */}
              <div className="pt-4 mt-5 border-t border-amber-900/30">
                <h4 className="text-xs font-serif font-bold text-amber-300 normal-case tracking-wide mb-3 flex items-center gap-1.5">
                  <span>🧪</span> Alchemy essences vault
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2.5 text-xs font-serif">
                  <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-red-950/60 via-[#181124] to-[#0f1526] rounded-xl border border-red-500/40 shadow-inner min-w-0">
                    <span className="w-7 h-7 rounded-full border border-red-400 bg-radial from-rose-500 to-red-950 flex items-center justify-center text-xs shadow-[0_0_10px_rgba(239,68,68,0.5)] shrink-0">🔥</span>
                    <span className="text-slate-200 font-bold truncate flex-1 min-w-0">Ember</span>
                    <span className="font-bold font-mono text-amber-300 text-xs px-2 py-0.5 rounded bg-zinc-950/80 border border-amber-500/30 shrink-0">{characterStats.ember_essence || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-cyan-950/60 via-[#111c2e] to-[#0f1526] rounded-xl border border-cyan-500/40 shadow-inner min-w-0">
                    <span className="w-7 h-7 rounded-full border border-cyan-400 bg-radial from-cyan-400 to-cyan-950 flex items-center justify-center text-xs shadow-[0_0_10px_rgba(6,182,212,0.5)] shrink-0">❄️</span>
                    <span className="text-slate-200 font-bold truncate flex-1 min-w-0">Frost</span>
                    <span className="font-bold font-mono text-cyan-300 text-xs px-2 py-0.5 rounded bg-zinc-950/80 border border-cyan-500/30 shrink-0">{characterStats.frost_essence || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-blue-950/60 via-[#0d1c33] to-[#0f1526] rounded-xl border border-blue-500/40 shadow-inner min-w-0">
                    <span className="w-7 h-7 rounded-full border border-blue-400 bg-radial from-blue-500 to-blue-950 flex items-center justify-center text-xs shadow-[0_0_10px_rgba(59,130,246,0.5)] shrink-0">💧</span>
                    <span className="text-slate-200 font-bold truncate flex-1 min-w-0">Tide</span>
                    <span className="font-bold font-mono text-blue-300 text-xs px-2 py-0.5 rounded bg-zinc-950/80 border border-blue-500/30 shrink-0">{characterStats.tide_essence || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-emerald-950/60 via-[#0b241c] to-[#0f1526] rounded-xl border border-emerald-500/40 shadow-inner min-w-0">
                    <span className="w-7 h-7 rounded-full border border-emerald-400 bg-radial from-emerald-500 to-emerald-950 flex items-center justify-center text-xs shadow-[0_0_10px_rgba(34,197,94,0.5)] shrink-0">🍃</span>
                    <span className="text-slate-200 font-bold truncate flex-1 min-w-0">Verdant</span>
                    <span className="font-bold font-mono text-emerald-300 text-xs px-2 py-0.5 rounded bg-zinc-950/80 border border-emerald-500/30 shrink-0">{characterStats.verdant_essence || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Tile 1B: Paperdoll Equipment Grid */}
            <div className="lg:col-span-7 flex flex-col justify-between medieval-card p-6 rounded-2xl shadow-xl">
              <PaperdollEquipmentGrid
                avatarImage={`/images/character/${((characterStats as any).title || 'count').toLowerCase()}.webp`}
                heroName={(characterStats as any).title || 'Count'}
                heroDescription="A powerful noble, ruling over a large county in Thrivehaven."
                nextTitle="Marquis (Level 50)"
                titleProgress={Math.round(calculateLevelProgress(characterStats.experience))}
              />
            </div>
          </div>

          {/* BENTO ROW 2 — Blessings, Altar & Empowerments */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Bento Tile 2A: Active Blessings & Altar */}
            <div className="lg:col-span-6 flex flex-col justify-between medieval-card p-6 rounded-2xl shadow-xl">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-lg font-bold font-medieval text-amber-400">
                      Altar of blessings
                    </h3>
                    <p className="text-xs text-zinc-400 font-serif">Sanctuary of consecrated buffs & active rites</p>
                  </div>
                  {perks.filter((p) => p.active && p.unlocked).length > 0 || activePotionPerks.length > 0 ? (
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 text-xs bg-emerald-950/30">
                      {perks.filter((p) => p.active && p.unlocked).length + activePotionPerks.length} active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-400/80 border-amber-500/30 text-xs font-serif bg-amber-950/20">
                      Sanctuary dormant
                    </Badge>
                  )}
                </div>

                {/* Active Perks List */}
                {perks.filter((p) => p.active && p.unlocked).length > 0 && (
                  <div className="space-y-3">
                    {perks
                      .filter((p) => p.active && p.unlocked)
                      .map((perk) => (
                        <Card
                          key={perk.id}
                          className="bg-zinc-950 border-amber-800/30"
                          aria-label={`active-bonus-${perk.id}`}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const meta = categoryMeta[perk.category as keyof typeof categoryMeta];
                                  if (meta) {
                                    const Icon = meta.icon;
                                    return <Icon className={`h-5 w-5 shrink-0 ${meta.iconClass}`} />;
                                  }
                                  return null;
                                })()}
                                <CardTitle className="text-base font-medium">{perk.name}</CardTitle>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deactivatePerk(perk.id)}
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                aria-label={TEXT_CONTENT.character.perks.deactivate + ` ${perk.name}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <Badge className="bg-purple-500 hover:bg-purple-600">Level {perk.level}</Badge>
                              <p className="text-sm text-muted-foreground">
                                {perk.effect.replace("per level", `(${perk.level * 10}% total)`)}
                              </p>
                              <p className="text-xs text-amber-400">
                                {getTimeUntilExpiry(perk)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}

                {/* Active Potion Perks */}
                {activePotionPerks.length > 0 && (
                  <div className="space-y-3">
                    {activePotionPerks.map((perk) => (
                      <Card key={perk.name} className="bg-black border-amber-800" aria-label={`active-bonus-potion-${perk.name}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-medium">{TEXT_CONTENT.character.activePerkCard.potionPerkObs.replace("{name}", perk.name)}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">{perk.effect}</p>
                            <p className="text-xs text-amber-400">
                              {(() => {
                                const expires = new Date(perk.expiresAt)
                                const now = new Date()
                                const diff = expires.getTime() - now.getTime()
                                if (diff <= 0) return "Expired"
                                const hours = Math.floor(diff / (60 * 60 * 1000))
                                const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
                                return `${hours}h ${minutes}m remaining`
                              })()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* State: Archmage Turtoisy Sanctuary & Potential Rites */}
                {perks.filter((p) => p.active && p.unlocked).length === 0 && activePotionPerks.length === 0 && (
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/25 via-[#14121a] to-[#0c0f17] p-4 shadow-lg">
                      <div className="flex items-start gap-4">
                        {/* Turtoisy Creature Avatar */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-b from-amber-500/20 to-zinc-950 p-1 shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0 overflow-hidden">
                          <Image
                            src="/images/creatures/Turtoisy.webp"
                            alt="Archmage Turtoisy"
                            fill
                            className="object-cover rounded-xl"
                          />
                        </div>

                        {/* Dialogue quote */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-xs font-bold text-amber-300 tracking-wide flex items-center gap-1.5 font-serif">
                              <span>🐢</span> Archmage Turtoisy
                            </span>
                            <span className="text-[11px] text-zinc-400">• Sacred altar</span>
                          </div>
                          <p
                            style={{ fontFamily: 'var(--font-libre-baskerville), Georgia, serif' }}
                            className="text-xs sm:text-[13px] text-zinc-300 italic leading-relaxed normal-case border-l-2 border-amber-500/40 pl-2.5 py-0.5"
                          >
                            &ldquo;No blessings active right now. Activate a perk or brew an elixir to empower your stats.&rdquo;
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sanctuary Rites Preview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div className="p-3 rounded-xl bg-zinc-950/70 border border-purple-500/20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg">✨</span>
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-purple-200 truncate">Class blessing</h5>
                            <p className="text-[10px] text-zinc-400 truncate">Empower permanent trait</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setActiveTab("perks");
                            const el = document.getElementById("character-vault-tabs");
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="h-7 px-2 text-[11px] text-purple-300 hover:text-purple-100 hover:bg-purple-950/40 shrink-0"
                        >
                          Select →
                        </Button>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-950/70 border border-emerald-500/20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg">🧪</span>
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-emerald-200 truncate">Apotheca draught</h5>
                            <p className="text-[10px] text-zinc-400 truncate">Brew herbal bonuses</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowApothecaModal(true)}
                          className="h-7 px-2 text-[11px] text-emerald-300 hover:text-emerald-100 hover:bg-emerald-950/40 shrink-0"
                        >
                          Brew →
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bento Tile 2B: Available Empowerments & Focus Surge */}
            <div className="lg:col-span-6 flex flex-col gap-4 medieval-card p-6 rounded-2xl shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-serif font-bold text-amber-300 normal-case flex items-center gap-1.5">
                      <span>⚡</span> Available empowerments
                    </h4>
                    <p className="text-[11px] text-zinc-400">Quick-access conduits to enhance hero performance</p>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono bg-zinc-900 border border-white/5 px-2 py-0.5 rounded-full">2 sockets</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-serif">
                  {/* Perk Socket */}
                  <div className="flex flex-col justify-between p-3.5 bg-gradient-to-r from-purple-950/40 via-[#181124] to-[#0f1526] rounded-xl border border-purple-500/30 shadow-inner space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl border border-purple-400 bg-radial from-purple-500 to-purple-950 flex items-center justify-center text-sm shadow-[0_0_8px_rgba(168,85,247,0.4)] shrink-0">✨</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-slate-200 font-bold truncate">Class perk</div>
                        <div className="text-[10px] text-purple-300/80">{perks.filter((p) => p.unlocked).length} unlocked</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveTab("perks");
                        const el = document.getElementById("character-vault-tabs");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="h-8 text-xs bg-purple-950/60 hover:bg-purple-900 text-purple-200 border-purple-500/40 font-serif w-full px-2"
                    >
                      Activate perk →
                    </Button>
                  </div>

                  {/* Apotheca Elixir Socket */}
                  <div className="flex flex-col justify-between p-3.5 bg-gradient-to-r from-emerald-950/40 via-[#0b241c] to-[#0f1526] rounded-xl border border-emerald-500/30 shadow-inner space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl border border-emerald-400 bg-radial from-emerald-500 to-emerald-950 flex items-center justify-center text-sm shadow-[0_0_8px_rgba(34,197,94,0.4)] shrink-0">🧪</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-slate-200 font-bold truncate">Apotheca elixir</div>
                        <div className="text-[10px] text-emerald-300/80">Herbal stats buff</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowApothecaModal(true)}
                      className="h-8 text-xs bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 border-emerald-500/40 font-serif w-full px-2"
                    >
                      Brew elixir →
                    </Button>
                  </div>
                </div>
              </div>

              {/* Focus Points & Surge */}
              <div className="pt-3 mt-1 border-t border-purple-900/30 bg-gradient-to-r from-purple-950/20 via-zinc-950 to-zinc-900 p-3.5 rounded-xl border border-purple-500/20">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
                    <h4 className="text-xs font-bold text-purple-300 font-serif normal-case">Focus points</h4>
                  </div>
                  <Button
                    onClick={() => setShowFocusModal(true)}
                    size="sm"
                    className="h-7 text-xs bg-purple-900 hover:bg-purple-800 text-purple-200 border border-purple-500/40 font-bold px-3 shrink-0"
                  >
                    🧠 Use focus ({characterStats.focus_points || 0})
                  </Button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Earned by completing daily habits. Spend points to activate XP boosts, rush kingdom timers, or claim rewards.
                </p>
              </div>

              {/* Modals */}
              <FocusPointsModal
                isOpen={showFocusModal}
                onClose={() => setShowFocusModal(false)}
                currentFocusPoints={characterStats.focus_points || 0}
                onStatsUpdate={() => {
                  const stats = getCharacterStats();
                  setCharacterStats(prev => ({ ...prev, gold: stats.gold, focus_points: stats.focus_points || 0 }));
                }}
              />

              <ApothecaModal
                open={showApothecaModal}
                onOpenChange={setShowApothecaModal}
                onComplete={() => {
                  const stats = getCharacterStats();
                  setCharacterStats(prev => ({ ...prev, gold: stats.gold, focus_points: stats.focus_points || 0 }));
                }}
              />
            </div>
          </div>

          {/* Responsive Character Vault Tabs (Horizontal Touch Snap Carousel) */}
          <div id="character-vault-tabs" className="flex justify-center w-full">
            <Tabs defaultValue="titles" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 pb-2 custom-scrollbar mobile-scroll-hide w-full mb-6">
                <TabsList className="flex shrink-0 snap-start space-x-1 p-1.5 bg-zinc-950/90 border border-amber-900/40 rounded-2xl w-full max-w-2xl mx-auto shadow-lg">
                  <TabsTrigger value="titles" className="snap-start flex-1 rounded-xl px-3 sm:px-4 py-2 text-xs font-bold tracking-wide">
                    👑 {TEXT_CONTENT.character.ui.tabs.titles}
                  </TabsTrigger>
                  <TabsTrigger value="perks" className="snap-start flex-1 rounded-xl px-3 sm:px-4 py-2 text-xs font-bold tracking-wide">
                    ✨ {TEXT_CONTENT.character.ui.tabs.perks}
                  </TabsTrigger>
                  <TabsTrigger value="strengths" className="snap-start flex-1 rounded-xl px-3 sm:px-4 py-2 text-xs font-bold tracking-wide">
                    ⚡ {TEXT_CONTENT.character.ui.tabs.strengths}
                  </TabsTrigger>
                  <TabsTrigger value="pets" className="snap-start flex-1 rounded-xl px-3 sm:px-4 py-2 text-xs font-bold text-amber-400 tracking-wide">
                    🐾 Pets
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="titles" className="mt-6">
                <div className="max-w-7xl mx-auto w-full">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {titlesList.length > 0 ? (
                      titlesList.map((title) => {
                        const isUnlocked = title.is_unlocked;
                        const isEquipped = title.is_equipped;
                        const rarity = title.level <= 20 ? "common" :
                          title.level <= 40 ? "uncommon" :
                            title.level <= 60 ? "rare" :
                              title.level <= 80 ? "epic" :
                                title.level <= 90 ? "legendary" : "mythic";

                        return (
                          <Card
                            key={title.id}
                            className={`h-full flex flex-col ${!isUnlocked
                              ? "medieval-card-undiscovered"
                              : isEquipped
                                ? "medieval-card border-amber-500 shadow-amber-500/20 shadow-lg"
                                : "medieval-card"
                              }`}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  {/* Character image */}
                                  <div className="relative w-16 h-16 flex-shrink-0">
                                    <Image
                                      src={`/images/character/${title.id}.webp`}
                                      alt={`${title.name} character`}
                                      fill
                                      className="object-contain"
                                      onError={(e) => {
                                        // Fallback to squire image if specific image not found
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/images/character/squire.webp';
                                      }}
                                    />
                                  </div>
                                  <CardTitle className="font-serif">{title.name}</CardTitle>
                                </div>
                                <Badge
                                  className={
                                    rarity === "common"
                                      ? "bg-zinc-500 h-fit"
                                      : rarity === "uncommon"
                                        ? "bg-green-500 h-fit"
                                        : rarity === "rare"
                                          ? "bg-blue-500 h-fit"
                                          : rarity === "epic"
                                            ? "bg-purple-500 h-fit"
                                            : rarity === "legendary"
                                              ? "bg-amber-500 h-fit"
                                              : "bg-red-500 h-fit"
                                  }
                                >
                                  {rarity}
                                </Badge>
                              </div>
                              <CardDescription className="min-h-[4.5rem] text-sm leading-relaxed">
                                {title.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2 flex-grow">
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Badge variant="outline" className="mr-2">
                                  {TEXT_CONTENT.character.ui.overview.level.replace("{level}", String(title.level))}
                                </Badge>
                                <span>{isUnlocked ? TEXT_CONTENT.character.titles.unlocked : TEXT_CONTENT.character.titles.requires.replace("{level}", String(title.level))}</span>
                              </div>
                            </CardContent>
                            <CardFooter className="mt-auto pt-0">
                              {isUnlocked ? (
                                <Button
                                  className={`w-full ${isEquipped
                                    ? "bg-amber-200 hover:bg-amber-300 text-amber-900"
                                    : "bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white"
                                    }`}
                                  disabled={isEquipped}
                                  onClick={() => equipTitle(title.id)}
                                >
                                  {isEquipped ? TEXT_CONTENT.character.titles.current : "Equip title"}
                                </Button>
                              ) : (
                                <Button className="w-full" variant="outline" disabled>
                                  {TEXT_CONTENT.character.titles.locked}
                                </Button>
                              )}
                            </CardFooter>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500 mb-2" />
                        <p className="text-zinc-400">Loading titles...</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="perks" className="mt-6">
                <div className="max-w-7xl mx-auto w-full">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {perks.map((perk) => (
                      <Card
                        key={perk.id}
                        className={`h-full flex flex-col ${!perk.unlocked
                          ? "medieval-card-undiscovered"
                          : perk.active
                            ? "medieval-card border-purple-500 shadow-purple-500/10 shadow-lg"
                            : "medieval-card"
                          }`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const meta = categoryMeta[perk.category as keyof typeof categoryMeta];
                                if (meta) {
                                  const Icon = meta.icon;
                                  return <Icon className={`h-5 w-5 shrink-0 ${meta.iconClass}`} />;
                                }
                                return null;
                              })()}
                              <CardTitle className="font-serif">{perk.name}</CardTitle>
                            </div>
                            <Badge
                              variant={perk.unlocked ? "default" : "secondary"}
                              className={perk.unlocked ? "" : "bg-zinc-500"}
                            >
                              {perk.unlocked ? TEXT_CONTENT.character.perks.levelMax.replace("{level}", String(perk.level)).replace("{max}", String(perk.maxLevel)) : TEXT_CONTENT.character.perks.levelReq.replace("{level}", String(perk.requiredLevel))}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm min-h-[2.5rem] line-clamp-2">
                            {perk.description}
                          </CardDescription>
                          {!perk.unlocked && (
                            <div className="mt-2 text-amber-500 font-medium">
                              {TEXT_CONTENT.character.perks.requires.replace("{level}", String(perk.requiredLevel))}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3 flex-grow">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">{perk.effect}</p>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{TEXT_CONTENT.character.perks.category.replace("{category}", perk.category)}</span>
                              <span>{TEXT_CONTENT.character.perks.cost.replace("{cost}", String(perk.activationCost))}</span>
                            </div>
                          </div>

                          {perk.unlocked ? (
                            <div className="space-y-2">
                              {perk.active ? (
                                <div className="space-y-2">
                                  <Badge className="bg-green-500 hover:bg-green-600">{TEXT_CONTENT.character.perks.active}</Badge>
                                  <p className="text-xs text-amber-400">
                                    {getTimeUntilExpiry(perk)}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <Lock className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
                              <p className="text-sm text-zinc-500">
                                {TEXT_CONTENT.character.perks.locked.replace("{level}", String(perk.requiredLevel))}
                              </p>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="mt-auto flex flex-col gap-2 pt-0">
                          {perk.unlocked && (
                            <div className="w-full space-y-2">
                              {perk.active ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deactivatePerk(perk.id)}
                                  className="w-full"
                                >
                                  {TEXT_CONTENT.character.perks.deactivate}
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    onClick={() => activatePerk(perk.id)}
                                    disabled={!canActivatePerk(perk) || characterStats.gold < perk.activationCost}
                                    className="w-full"
                                  >
                                    {TEXT_CONTENT.character.perks.activate.replace("{cost}", String(perk.activationCost))}
                                  </Button>
                                  {perk.level < perk.maxLevel && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => upgradePerk(perk.id)}
                                      disabled={characterStats.gold < perk.upgradeCost}
                                      className="w-full"
                                    >
                                      {TEXT_CONTENT.character.perks.upgrade.replace("{cost}", String(perk.upgradeCost))}
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="strengths" className="mt-6">
                <div className="max-w-7xl mx-auto w-full space-y-4">
                  <SwordStaffSectionHeader title="Hero Virtues & Combat Masteries" />
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {strengths.map((strength) => {
                      const categoryMap: Record<string, { icon: any; category: any }> = {
                        might: { icon: Sword, category: 'orange' },
                        knowledge: { icon: Brain, category: 'blue' },
                        honor: { icon: Crown, category: 'gold' },
                        castle: { icon: CastleIcon, category: 'slate' },
                        craft: { icon: Hammer, category: 'slate' },
                        vitality: { icon: Heart, category: 'red' },
                        wellness: { icon: Sparkles, category: 'green' },
                        exploration: { icon: Compass, category: 'purple' },
                        conquest: { icon: Shield, category: 'cyan' },
                      };
                      const config = categoryMap[strength.category?.toLowerCase()] || { icon: Sparkles, category: 'gold' };

                      return (
                        <SwordStaffOrbCard
                          key={strength.id}
                          title={`${strength.name} (Lvl ${strength.level})`}
                          description={`${strength.description} — ${strength.experience}/${strength.experienceToNextLevel} XP to Lvl ${strength.level + 1}`}
                          icon={config.icon}
                          category={config.category}
                          badge={`Lvl ${strength.level}`}
                          isActive={strength.level >= 5}
                        />
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="pets" className="mt-6">
                <div className="max-w-7xl mx-auto w-full space-y-6">
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    {[
                      { id: 'ember-drake', name: 'Ember Drake', type: 'Fire', focus: 'Might & Craft', yield: '+10% Gold Yield', skill: 'Ember Strike (45 AOE Fire DMG)', image: '/images/creatures/EmberDrake.webp', borderColor: 'border-orange-500/50', glowColor: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]', badgeBg: 'bg-orange-950/80 text-orange-300 border-orange-500/40' },
                      { id: 'sage-owl', name: 'Sage Owl', type: 'Water', focus: 'Knowledge & Wisdom', yield: '+10% Essence Yield', skill: 'Arcane Gust (+35 Team Heal)', image: '/images/creatures/SageOwl.webp', borderColor: 'border-blue-500/50', glowColor: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]', badgeBg: 'bg-blue-950/80 text-blue-300 border-blue-500/40' },
                      { id: 'spirit-sprite', name: 'Spirit Sprite', type: 'Verdant', focus: 'Vitality & Wellness', yield: '+10% XP Yield', skill: 'Floral Blessing (+40 Def Shield)', image: '/images/creatures/SpiritSprite.webp', borderColor: 'border-emerald-500/50', glowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]', badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' },
                      { id: 'grove-fox', name: 'Grove Fox', type: 'Nature', focus: 'Exploration & Castle', yield: '+10% Speed & Luck', skill: 'Swift Pounce (+30 Crit Strike)', image: '/images/creatures/GroveFox.webp?v=2', borderColor: 'border-amber-500/50', glowColor: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]', badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/40' }
                    ].map((pet) => (
                      <Card key={pet.id} className={cn("medieval-card bg-zinc-950 flex flex-col justify-between p-4 space-y-3 transition-all duration-300 hover:scale-[1.02]", pet.borderColor, pet.glowColor)}>
                        <div className="space-y-3">
                          {/* Top Header */}
                          <div className="flex justify-between items-center">
                            <h4 className="font-serif font-bold text-base text-amber-200 truncate">
                              {pet.name}
                            </h4>
                            <Badge variant="outline" className={cn("text-[9px] font-mono px-2 py-0.5 uppercase tracking-wider", pet.badgeBg)}>
                              {pet.type}
                            </Badge>
                          </div>

                          {/* Pet Portrait Artwork Frame */}
                          <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-amber-900/40 bg-gradient-to-b from-zinc-900 via-zinc-950 to-amber-950/30 group">
                            <Image
                              src={pet.image}
                              alt={pet.name}
                              fill
                              className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                              unoptimized
                            />
                            <div className="absolute bottom-2 left-2 right-2 bg-zinc-950/90 backdrop-blur-md rounded-lg p-1.5 border border-amber-500/30 text-center">
                              <span className="text-[10px] text-amber-300 font-mono font-bold">Focus: {pet.focus}</span>
                            </div>
                          </div>

                          {/* Stats & Skills */}
                          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5 text-xs">
                            <p className="text-zinc-200 font-bold text-[11px]">✨ Passive: <span className="text-amber-400">{pet.yield}</span></p>
                            <p className="text-zinc-400 font-mono text-[10px] leading-tight">⚔️ Striker: {pet.skill}</p>
                          </div>
                        </div>

                        {/* Treat Feeding & Affection Progress */}
                        {(() => {
                          const affection = petAffections[pet.id] ?? 50;
                          const isMax = affection >= 100;
                          return (
                            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                                  <span>Affection Level</span>
                                  <span className={cn("font-bold", isMax ? "text-emerald-400" : "text-amber-300")}>
                                    {affection}% {isMax ? "(Max ❤️)" : ""}
                                  </span>
                                </div>
                                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-amber-900/30">
                                  <div
                                    className={cn(
                                      "h-full transition-all duration-500",
                                      isMax
                                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                                        : "bg-gradient-to-r from-amber-600 to-amber-400"
                                    )}
                                    style={{ width: `${affection}%` }}
                                  />
                                </div>
                              </div>

                              <Button
                                size="sm"
                                disabled={isMax}
                                onClick={() => handleFeedPet(pet)}
                                className={cn(
                                  "w-full font-bold text-xs h-8 rounded-lg shadow-md transition-all",
                                  isMax
                                    ? "bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700 hover:bg-zinc-800"
                                    : "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white"
                                )}
                              >
                                {isMax ? "❤️ Fully Fed (100%)" : "🍎 Feed Treat (+5% Affection)"}
                              </Button>
                            </div>
                          );
                        })()}
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      {/* Bottom spacing */}
      <div className="h-8 md:h-12"></div>
    </div>
  )
}

