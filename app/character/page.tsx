"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Edit, X, Upload, Sword, Lock, Brain, Crown, Castle as CastleIcon, Hammer, Heart, AlertCircle, Loader2, Sparkles, AlertTriangle } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
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
import { getCharacterStats } from "@/lib/character-stats-service"
import { storageService } from '@/lib/storage-service'
import { getTitleProgress, TITLES } from '@/lib/title-manager'
import { getStrengths, calculateStrengthProgress, Strength } from '@/lib/strength-manager'
import { AnimatedCounter } from '@/components/ui/animated-counter'

import { HeaderSection } from '@/components/HeaderSection'
import { PageGuide } from '@/components/page-guide'
import { TEXT_CONTENT } from '@/lib/text-content'

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



  const [strengths, setStrengths] = useState<Strength[]>(getStrengths())

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
      return window.headerImages.character || "/images/character-header.jpg"
    }
    return "/images/character-header.jpg"
  })
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activePotionPerks, setActivePotionPerks] = useState<{ name: string, effect: string, expiresAt: string }[]>([])
  const [activeTab, setActiveTab] = useState("titles")

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

  // Check for perk unlocks when character level changes or perks are loaded
  useEffect(() => {
    checkAndUnlockPerks(characterStats.level);
  }, [characterStats.level, perks, checkAndUnlockPerks]);

  // Load character stats and perks (Supabase first, then localStorage)
  useEffect(() => {
    const loadCharacterStats = () => {
      try {
        // Use the unified character stats manager
        const stats = getCharacterStats()
        // Calculate level from experience to ensure consistency with navigation bar
        const calculatedLevel = calculateLevelFromExperience(stats.experience)
        setCharacterStats({
          level: calculatedLevel,
          experience: stats.experience,
          experienceToNextLevel: calculateExperienceForLevel(calculatedLevel),
          gold: stats.gold,
          ascension_level: stats.ascension_level || 0,
          titles: { equipped: '', unlocked: 0, total: 0 },
          perks: { active: 0, total: 0 }
        })
      } catch (error) {
        console.error('Error loading character stats:', error)
        throw new Error('Failed to load character stats');
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
        console.error('Error loading perks:', error)
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
          console.error('Failed to fetch strengths from API', err);
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
        console.error('Error loading strengths:', error)
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
        console.error('Error loading active potion perks from API, falling back to local:', e)
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
        } catch (localErr) { console.error(localErr) }
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
        console.error("Error loading titles", e);
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
        console.error('Character page error:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();

    // Listen for updates
    window.addEventListener('character-stats-update', loadCharacterStats)
    window.addEventListener('character-perks-update', loadPerks)
    window.addEventListener('character-strengths-update', loadStrengths)
    window.addEventListener('character-inventory-update', loadActivePotionPerks)

    return () => {
      window.removeEventListener('character-stats-update', loadCharacterStats)
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
    // console.log('[Character Page] Polling disabled to prevent infinite loops');

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
          console.error("Error auto-unlocking titles:", e);
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
      console.error("Error equipping title:", e);
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

        // Reload page to reflect deep changes
        window.location.reload();
      } else {
        toast({
          title: "Ascension Failed",
          description: data.error || "Could not process ascension.",
          variant: "destructive"
        });
      }
    } catch (e) {
      console.error("Ascension error:", e);
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
          console.error("Error processing file:", err)
          setIsUploading(false)
        }
      }
      reader.onerror = () => {
        console.error("Error reading file")
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Error initiating file read:", err)
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
          {/* Combined Character Overview & Active Bonuses */}
          <Card className="medieval-card">
            <CardHeader>
              <CardTitle className="font-serif">{TEXT_CONTENT.character.ui.overview.title}</CardTitle>
              <CardDescription>{TEXT_CONTENT.character.ui.overview.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Level, XP, Title */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">{TEXT_CONTENT.character.ui.overview.level.replace("{level}", String(characterStats.level))}</h3>
                      {(characterStats.ascension_level || 0) > 0 && (
                        <Badge variant="outline" className="text-amber-400 border-amber-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Ascension {characterStats.ascension_level}
                        </Badge>
                      )}
                    </div>
                    <Progress value={calculateLevelProgress(characterStats.experience)} className="h-2" />
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <p>
                        <AnimatedCounter value={Math.floor(characterStats.experience)} duration={800} /> / {TEXT_CONTENT.character.ui.overview.xpProgress.replace("{current}", "").replace("{next}", String(characterStats.experienceToNextLevel)).replace("{nextLevel}", String(characterStats.level + 1))}
                      </p>

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
                                Perform Ascension?
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
                                Confirm Ascension
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">{TEXT_CONTENT.character.ui.overview.titleHeader}</h3>
                    {(() => {
                      // Use equipped title for visual, fall back to level-based calculation if nothing found
                      const currentTitleName = characterStats.titles.equipped;
                      // Determine image from ID (we need to find the ID corresponding to the name or use the equipped Item)
                      const equippedItem = titlesList.find(t => t.is_equipped);
                      const titleId = equippedItem ? equippedItem.id : TITLES.find(t => t.name === currentTitleName)?.id || 'squire';

                      // Calculate next title progress based on level still (level progression logic remains valid)
                      const titleInfo = getTitleProgress(characterStats.level);

                      return (
                        <>
                          {/* Current title character image and info side by side */}
                          <div className="flex items-start gap-4">
                            {/* Character image on the left */}
                            <div className="relative w-24 h-24 flex-shrink-0 group">
                              <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl animate-pulse" />
                              <div className="relative w-full h-full rounded-full border-2 border-amber-500/20 bg-zinc-900/80 p-2 overflow-hidden shadow-lg transition-all duration-500 group-hover:border-amber-500/40">
                                <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-amber-500/5 to-transparent">
                                  <Image
                                    src={`/images/character/${titleInfo.current.id}.png`}
                                    alt={`${titleInfo.current.name} character`}
                                    fill
                                    className="object-contain p-2"
                                    onError={(e) => {
                                      // Fallback to squire image if specific image not found
                                      const target = e.target as HTMLImageElement;
                                      target.src = '/images/character/squire.png';
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            {/* Title info on the right */}
                            <div className="flex-1 space-y-2">
                              <p className="text-lg font-bold text-amber-600">{currentTitleName}</p>
                              <p className="text-sm text-muted-foreground">{equippedItem ? equippedItem.description : titleInfo.current.description}</p>
                              {titleInfo.next && (
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground">{TEXT_CONTENT.character.ui.overview.nextTitle.replace("{name}", titleInfo.next.name).replace("{level}", String(titleInfo.next.level))}</p>
                                  <Progress value={titleInfo.progress} className="h-1 mt-1" />
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                {/* Right: Active Bonuses */}
                <div>
                  <h3 className="text-lg font-medium mb-2">{TEXT_CONTENT.character.ui.overview.activeBonuses}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {perks.filter((p) => p.active && p.unlocked).length === 0 && (
                      <Card className="bg-black border-amber-800 h-full min-h-[200px] flex items-center justify-center">
                        <CardContent className="pt-6 flex items-center justify-center h-full">
                          <div className="flex items-center gap-4 text-center">
                            {/* Blessing image */}
                            <div className="relative w-32 h-32 flex-shrink-0">
                              <Image
                                src="/images/blessing.png"
                                alt={TEXT_CONTENT.character.ui.overview.noBonuses}
                                fill
                                className="object-contain opacity-50 rounded"
                              />
                            </div>
                            <p className="text-muted-foreground font-serif">{TEXT_CONTENT.character.ui.overview.noBonuses}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {perks
                      .filter((p) => p.active && p.unlocked)
                      .map((perk) => (
                        <Card
                          key={perk.id}
                          className="bg-black/50 border-amber-800/30"
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
                    {activePotionPerks.length > 0 && activePotionPerks.map((perk) => (
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Titles and Perks */}
          <div className="flex justify-center">
            <Tabs defaultValue="titles" value={activeTab} onValueChange={setActiveTab} className="w-auto">
              {/* Mobile tab selector */}
              <div className="mb-4 md:hidden">
                <label htmlFor="character-tab-select" className="sr-only">Select character tab</label>
                <select
                  id="character-tab-select"
                  aria-label="Character tab selector"
                  className="w-full rounded-md border border-amber-800/20 bg-black text-white p-2"
                  value={activeTab}
                  onChange={e => setActiveTab(e.target.value)}
                >
                  <option value="titles">{TEXT_CONTENT.character.ui.tabs.titles}</option>
                  <option value="perks">{TEXT_CONTENT.character.ui.tabs.perks}</option>
                  <option value="strengths">{TEXT_CONTENT.character.ui.tabs.strengths}</option>
                </select>
              </div>
              <TabsList className="grid w-auto grid-cols-3 hidden md:grid">
                <TabsTrigger value="titles">{TEXT_CONTENT.character.ui.tabs.titles}</TabsTrigger>
                <TabsTrigger value="perks">{TEXT_CONTENT.character.ui.tabs.perks}</TabsTrigger>
                <TabsTrigger value="strengths">{TEXT_CONTENT.character.ui.tabs.strengths}</TabsTrigger>
              </TabsList>
              <TabsContent value="titles" className="mt-6">
                <div className="max-w-6xl mx-auto w-full">
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
                                      src={`/images/character/${title.id}.png`}
                                      alt={`${title.name} character`}
                                      fill
                                      className="object-contain"
                                      onError={(e) => {
                                        // Fallback to squire image if specific image not found
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/images/character/squire.png';
                                      }}
                                    />
                                  </div>
                                  <CardTitle className="font-serif">{title.name}</CardTitle>
                                </div>
                                <Badge
                                  className={
                                    rarity === "common"
                                      ? "bg-gray-500 h-fit"
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
                                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                                </Badge>
                              </div>
                              <CardDescription className="min-h-[3rem] line-clamp-2">{title.description}</CardDescription>
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
                                  {isEquipped ? TEXT_CONTENT.character.titles.current : "Equip Title"}
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
                        <p className="text-gray-400">Loading titles...</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="perks" className="mt-6">
                <div className="max-w-6xl mx-auto w-full">
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
                              className={perk.unlocked ? "" : "bg-gray-500"}
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
                              <Lock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500">
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
                <div className="max-w-6xl mx-auto w-full">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {strengths.map((strength) => (
                      <Card
                        key={strength.id}
                        className="medieval-card h-full flex flex-col w-full shadow-inner"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{strength.icon}</span>
                              <CardTitle className="font-serif">{strength.name}</CardTitle>
                            </div>
                            <Badge className={strength.color.replace('text-', 'bg-')}>
                              Lvl {strength.level}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm line-clamp-2 min-h-[2.5rem]">
                            {strength.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 flex-grow">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{TEXT_CONTENT.character.strengths.experience}</span>
                              <span>{strength.experience} / {strength.experienceToNextLevel}</span>
                            </div>
                            <Progress value={calculateStrengthProgress(strength)} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {TEXT_CONTENT.character.strengths.xpToNext.replace("{amount}", String(strength.experienceToNextLevel - strength.experience)).replace("{level}", String(strength.level + 1))}
                            </p>
                          </div>
                        </CardContent>
                        <CardFooter className="mt-auto pt-2">
                          <div className="w-full text-center">
                            <Badge variant="outline" className="w-full justify-center">
                              {TEXT_CONTENT.character.strengths.mastery.replace("{category}", strength.category.charAt(0).toUpperCase() + strength.category.slice(1))}
                            </Badge>
                          </div>
                        </CardFooter>
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

