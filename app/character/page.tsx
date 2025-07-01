"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Edit, X, Upload, Sword, Lock, Brain, Crown, Castle as CastleIcon, Hammer, Heart } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { calculateLevelProgress, CharacterStats } from "@/types/character"
import { storageService } from '@/lib/storage-service'
import { getTitleProgress, TITLES } from '@/lib/title-manager'
import { getStrengths, calculateStrengthProgress, Strength } from '@/lib/strength-manager'
import { useSupabaseRealtimeSync } from '@/hooks/useSupabaseRealtimeSync'

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
  const [titles, setTitles] = useState<Title[]>([
    {
      id: "t1",
      name: "Novice Adventurer",
      description: "A beginner on the path to greatness.",
      category: "General",
      requirement: "Reach level 5",
      unlocked: true,
      equipped: true,
      rarity: "common",
    },
    {
      id: "t2",
      name: "Iron-Willed",
      description: "One who has shown exceptional determination.",
      category: "Resilience",
      requirement: "Complete a 30-day streak",
      unlocked: true,
      equipped: false,
      rarity: "rare",
    },
    {
      id: "t3",
      name: "Strength Seeker",
      description: "A dedicated practitioner of physical power.",
      category: "Might",
      requirement: "Reach level 10 in Might",
      unlocked: true,
      equipped: false,
      rarity: "uncommon",
    },
    {
      id: "t4",
      name: "Knowledge Keeper",
      description: "A scholar who values wisdom above all.",
      category: "Wisdom",
      requirement: "Read 10 books",
      unlocked: true,
      equipped: false,
      rarity: "uncommon",
    },
    {
      id: "t5",
      name: "Winter Warrior",
      description: "One who thrives in the coldest season.",
      category: "Seasonal",
      requirement: "Complete the Winter Challenge",
      unlocked: true,
      equipped: false,
      rarity: "epic",
    },
    {
      id: "t6",
      name: "Legendary Hero",
      description: "A true legend whose deeds will be remembered.",
      category: "General",
      requirement: "Reach level 50",
      unlocked: false,
      equipped: false,
      rarity: "legendary",
    },
  ])

  const [strengths, setStrengths] = useState<Strength[]>(getStrengths())

  const [perks, setPerks] = useState<Perk[]>([
    {
      id: "perk-might",
      name: "Might Mastery",
      description: "Increase XP and gold from Might quests and milestones.",
      category: "might",
      effect: "+10% XP & gold from Might activities per level",
      level: 0,
      maxLevel: 5,
      unlocked: false,
      equipped: false,
      active: false,
      upgradeCost: 100,
      activationCost: 50,
      requiredLevel: 20,
    },
    {
      id: "perk-knowledge",
      name: "Knowledge Seeker",
      description: "Increase XP and gold from Knowledge quests and milestones.",
      category: "knowledge",
      effect: "+10% XP & gold from Knowledge activities per level",
      level: 0,
      maxLevel: 5,
      unlocked: false,
      equipped: false,
      active: false,
      upgradeCost: 100,
      activationCost: 50,
      requiredLevel: 25,
    },
    {
      id: "perk-honor",
      name: "Honor Guard",
      description: "Increase XP and gold from Honor quests and milestones.",
      category: "honor",
      effect: "+10% XP & gold from Honor activities per level",
      level: 0,
      maxLevel: 5,
      unlocked: false,
      equipped: false,
      active: false,
      upgradeCost: 100,
      activationCost: 50,
      requiredLevel: 30,
    },
    {
      id: "perk-castle",
      name: "Castle Steward",
      description: "Increase XP and gold from Castle quests and milestones.",
      category: "castle",
      effect: "+10% XP & gold from Castle activities per level",
      level: 0,
      maxLevel: 5,
      unlocked: false,
      equipped: false,
      active: false,
      upgradeCost: 100,
      activationCost: 50,
      requiredLevel: 35,
    },
    {
      id: "perk-craft",
      name: "Craft Artisan",
      description: "Increase XP and gold from Craft quests and milestones.",
      category: "craft",
      effect: "+10% XP & gold from Craft activities per level",
      level: 0,
      maxLevel: 5,
      unlocked: false,
      equipped: false,
      active: false,
      upgradeCost: 100,
      activationCost: 50,
      requiredLevel: 40,
    },
    {
      id: "perk-vitality",
      name: "Vitality Sage",
      description: "Increase XP and gold from Vitality quests and milestones.",
      category: "vitality",
      effect: "+10% XP & gold from Vitality activities per level",
      level: 0,
      maxLevel: 5,
      unlocked: false,
      equipped: false,
      active: false,
      upgradeCost: 100,
      activationCost: 50,
      requiredLevel: 45,
    },
  ])

  const [characterStats, setCharacterStats] = useState<CharacterStats>({
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    gold: 1000,
    titles: {
      equipped: "Novice Adventurer",
      unlocked: 1,
      total: 6
    },
    perks: {
      active: 0,
      total: 6
    }
  });

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
      const updatedPerks = prevPerks.map(perk => ({
        ...perk,
        unlocked: perk.requiredLevel ? level >= perk.requiredLevel : perk.unlocked
      }));
      
      // Save updated perks to localStorage for database
      localStorage.setItem('character-perks', JSON.stringify(updatedPerks));
      
      return updatedPerks;
    });
  }, []);

  // Check for perk unlocks when character level changes
  useEffect(() => {
    checkAndUnlockPerks(characterStats.level);
  }, [characterStats.level, checkAndUnlockPerks]);

  // Load character stats and perks from localStorage
  useEffect(() => {
    const loadCharacterStats = () => {
      try {
        const savedStats = localStorage.getItem('character-stats')
        if (savedStats) {
          const stats = JSON.parse(savedStats)
          setCharacterStats(stats)
        }
      } catch (error) {
        console.error('Error loading character stats:', error)
        // Set default stats if loading fails
        setCharacterStats({
          level: 1,
          experience: 0,
          experienceToNextLevel: 100,
          gold: 1000,
          titles: {
            equipped: "Novice Adventurer",
            unlocked: 1,
            total: 6
          },
          perks: {
            active: 0,
            total: 6
          }
        })
      }
    }

    const loadPerks = () => {
      try {
        const savedPerks = localStorage.getItem('character-perks')
        if (savedPerks) {
          const parsedPerks = JSON.parse(savedPerks)
          setPerks(parsedPerks)
        }
      } catch (error) {
        console.error('Error loading perks:', error)
      }
    }

    const loadStrengths = () => {
      setStrengths(getStrengths())
    }

    // Load active potion perks
    const loadActivePotionPerks = () => {
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
      } catch (e) {
        setActivePotionPerks([])
      }
    }

    loadCharacterStats()
    loadPerks()
    loadStrengths()
    loadActivePotionPerks()

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
  }, [])

  // --- Supabase real-time sync for character_stats ---
  useSupabaseRealtimeSync({
    table: 'character_stats',
    userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : undefined,
    onChange: () => {
      // Re-fetch character stats from API or Supabase and update state
      // (Replace with your actual fetch logic if needed)
      fetch('/api/character-stats').then(async (response) => {
        if (response.ok) {
          const stats = await response.json();
          setCharacterStats(stats);
        }
      });
    }
  });

  // --- Supabase real-time sync for character_perks ---
  useSupabaseRealtimeSync({
    table: 'character_perks',
    userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : undefined,
    onChange: () => {
      // Re-fetch perks from API or Supabase and update state
      // (Replace with your actual fetch logic if needed)
      fetch('/api/character-perks').then(async (response) => {
        if (response.ok) {
          const perks = await response.json();
          setPerks(perks);
        }
      });
    }
  });

  // Load titles from localStorage on mount
  useEffect(() => {
    const savedTitles = storageService.get("titles", []);
    setTitles(Array.isArray(savedTitles) ? savedTitles : []);
  }, []);

  // Whenever titles change, update localStorage
  useEffect(() => {
    storageService.set("titles", titles);
  }, [titles]);

  // --- Supabase real-time sync for character_titles ---
  useSupabaseRealtimeSync({
    table: 'character_titles',
    userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : undefined,
    onChange: () => {
      // Re-fetch titles from API or Supabase and update state
      // (Replace with your actual fetch logic if needed)
      fetch('/api/character-titles').then(async (response) => {
        if (response.ok) {
          const titles = await response.json();
          setTitles(titles);
        }
      });
    }
  });

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
    
    return `${hours}h ${minutes}m remaining`;
  };

  // Activate perk
  const activatePerk = (perkId: string) => {
    const perk = perks.find(p => p.id === perkId);
    if (!perk) return;

    if (!perk.unlocked) {
      toast({
        title: "Perk Locked",
        description: `This perk requires level ${perk.requiredLevel} to unlock.`,
        variant: "destructive"
      });
      return;
    }

    if (!canActivatePerk(perk)) {
      toast({
        title: "Cannot Activate",
        description: "This perk can only be activated once per week.",
        variant: "destructive"
      });
      return;
    }

    if (characterStats.gold < perk.activationCost) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${perk.activationCost} gold to activate this perk.`,
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
    storageService.set("character-stats", newStats);
    
    // Save perks to localStorage for database
    localStorage.setItem('character-perks', JSON.stringify(updatedPerks));
    
    toast({
      title: "Perk Activated",
      description: `${perk.name} is now active for 24 hours!`,
    });
  };

  // Deactivate perk
  const deactivatePerk = (perkId: string) => {
    const updatedPerks = perks.map(p => 
      p.id === perkId 
        ? { ...p, active: false, expiresAt: undefined as string | undefined } as Perk
        : p
    );
    
    setPerks(updatedPerks);
    
    // Save perks to localStorage for database
    localStorage.setItem('character-perks', JSON.stringify(updatedPerks));
    
    const perk = perks.find(p => p.id === perkId);
    if (perk) {
      toast({
        title: "Perk Deactivated",
        description: `${perk.name} has been deactivated.`,
      });
    }
  };

  // Upgrade perk
  const upgradePerk = (perkId: string) => {
    const perk = perks.find(p => p.id === perkId);
    if (!perk) return;

    if (!perk.unlocked) {
      toast({
        title: "Perk Locked",
        description: `This perk requires level ${perk.requiredLevel} to unlock.`,
        variant: "destructive"
      });
      return;
    }

    if (perk.level >= perk.maxLevel) {
      toast({
        title: "Max Level Reached",
        description: "This perk is already at maximum level.",
        variant: "destructive"
      });
      return;
    }

    if (characterStats.gold < perk.upgradeCost) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${perk.upgradeCost} gold to upgrade this perk.`,
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
    storageService.set("character-stats", newStats);
    
    // Save perks to localStorage for database
    localStorage.setItem('character-perks', JSON.stringify(updatedPerks));
    
    toast({
      title: "Perk Upgraded",
      description: `${perk.name} is now level ${perk.level + 1}!`,
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
      {/* Hero Section with Image */}
      <div 
        className="relative h-[300px] md:h-[400px] lg:h-[600px] w-full max-w-full overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Image
          src={coverImage}
          alt="Character Profile"
          fill
          className="object-cover"
          priority
          quality={100}
          onError={() => {
            setCoverImage("/images/default-character-header.jpg")
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
        
        {/* Edit button that appears on hover */}
        {isHovering && !showUploadModal && (
          <div className="absolute top-4 right-4 z-20">
            <Button 
              onClick={() => setShowUploadModal(true)}
              className="bg-amber-700 hover:bg-amber-600 text-white rounded-full h-12 w-12 flex items-center justify-center"
              size="icon"
            >
              <Edit size={20} />
            </Button>
          </div>
        )}
        
        {/* Image upload modal */}
        {showUploadModal && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 z-10">
            <div className="bg-black/90 p-6 rounded-lg border border-amber-500/50 backdrop-blur-md max-w-md relative">
              <Button 
                onClick={() => setShowUploadModal(false)}
                className="absolute top-2 right-2 rounded-full h-8 w-8 p-0 bg-transparent hover:bg-gray-800"
                size="icon"
              >
                <X size={16} className="text-gray-400" />
              </Button>
              
              <h3 className="text-xl text-amber-500 mb-4 font-medieval text-center">Change Character Banner</h3>
              
              <Button 
                onClick={triggerFileInput}
                className="w-full mb-3 bg-amber-700 hover:bg-amber-600 text-white flex items-center justify-center gap-2"
                disabled={isUploading}
              >
                <Upload size={18} />
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </Button>
              
              <p className="text-gray-400 text-sm text-center">
                Upload a JPG, PNG or GIF image for your character banner
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/gif" 
                onChange={handleImageUpload}
                placeholder="Enter value"
              />
            </div>
          </div>
        )}
        
        <div className="absolute inset-0 flex items-center justify-center z-[5]">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-widest drop-shadow-lg font-medieval text-amber-500 text-center">
            CHARACTER
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-6">
          {/* Combined Character Overview & Active Bonuses */}
          <Card className="medieval-card">
            <CardHeader>
              <CardTitle className="font-serif">Character Overview</CardTitle>
              <CardDescription>Your current progress, title, and active bonuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Level, XP, Title */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Level {characterStats.level}</h3>
                    <Progress value={calculateLevelProgress(characterStats.experience) * 100} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {Math.floor(characterStats.experience)} / {characterStats.experienceToNextLevel} XP to Level {characterStats.level + 1}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Title</h3>
                    {(() => {
                      const titleInfo = getTitleProgress(characterStats.level);
                      return (
                        <>
                          <p className="text-lg font-bold text-amber-600">{titleInfo.current.name}</p>
                          <p className="text-sm text-muted-foreground">{titleInfo.current.description}</p>
                          {titleInfo.next && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground">Next: {titleInfo.next.name} (Level {titleInfo.next.level})</p>
                              <Progress value={titleInfo.progress} className="h-1 mt-1" />
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                {/* Right: Active Bonuses */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Active Bonuses</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {perks.filter((p) => p.active && p.unlocked).length === 0 && (
                      <Card className="bg-black/50 border-amber-800/30 h-full min-h-[200px] flex items-center justify-center">
                        <CardContent className="pt-6 flex items-center justify-center h-full">
                          <p className="text-center text-muted-foreground">No active perks. Activate perks to gain bonuses.</p>
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
                                aria-label={`Deactivate ${perk.name}`}
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
                      <Card key={perk.name} className="bg-black/50 border-amber-800/30" aria-label={`active-bonus-potion-${perk.name}`}> 
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-medium">{perk.name} (Potion Perk)</CardTitle>
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
                  <option value="titles">Titles</option>
                  <option value="perks">Perks</option>
                  <option value="strengths">Strengths</option>
                </select>
              </div>
              <TabsList className="grid w-auto grid-cols-3 hidden md:grid">
                <TabsTrigger value="titles">Titles</TabsTrigger>
                <TabsTrigger value="perks">Perks</TabsTrigger>
                <TabsTrigger value="strengths">Strengths</TabsTrigger>
              </TabsList>
              <TabsContent value="titles" className="mt-6">
                <div className="max-w-6xl mx-auto w-full">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {TITLES.map((title) => {
                      const isUnlocked = characterStats.level >= title.level;
                      const isCurrent = characterStats.level === title.level;
                      const rarity = title.level <= 20 ? "common" : 
                                    title.level <= 40 ? "uncommon" : 
                                    title.level <= 60 ? "rare" : 
                                    title.level <= 80 ? "epic" : 
                                    title.level <= 90 ? "legendary" : "mythic";
                      
                      return (
                        <Card
                          key={title.id}
                          className={`medieval-card w-full ${
                            !isUnlocked
                              ? "opacity-60"
                              : isCurrent
                                ? "border-amber-500 bg-amber-50/30 dark:bg-amber-900/20"
                                : ""
                          }`}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <CardTitle className="font-serif">{title.name}</CardTitle>
                              <Badge
                                className={
                                  rarity === "common"
                                    ? "bg-gray-500"
                                    : rarity === "uncommon"
                                      ? "bg-green-500"
                                      : rarity === "rare"
                                        ? "bg-blue-500"
                                        : rarity === "epic"
                                          ? "bg-purple-500"
                                          : rarity === "legendary"
                                            ? "bg-amber-500"
                                            : "bg-red-500"
                                }
                              >
                                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                              </Badge>
                            </div>
                            <CardDescription>{title.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Badge variant="outline" className="mr-2">
                                Level {title.level}
                              </Badge>
                              <span>{isUnlocked ? "Unlocked" : `Requires Level ${title.level}`}</span>
                            </div>
                          </CardContent>
                          <CardFooter>
                            {isUnlocked ? (
                              <Button
                                className={`w-full ${
                                  isCurrent
                                    ? "bg-amber-200 hover:bg-amber-300 text-amber-900"
                                    : "bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white"
                                }`}
                                disabled={isCurrent}
                              >
                                {isCurrent ? "Current Title" : "Achieved"}
                              </Button>
                            ) : (
                              <Button className="w-full" variant="outline" disabled>
                                Locked
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="perks" className="mt-6">
                <div className="max-w-6xl mx-auto w-full">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {perks.map((perk) => (
                      <Card
                        key={perk.id}
                        className={`medieval-card w-full ${
                          !perk.unlocked
                            ? "opacity-60 border-gray-500"
                            : perk.active
                              ? "border-purple-500 bg-purple-50/30 dark:bg-purple-900/20"
                              : ""
                        }`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
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
                              {perk.unlocked ? `Level ${perk.level}/${perk.maxLevel}` : `Level ${perk.requiredLevel}+`}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm">
                            {perk.description}
                          </CardDescription>
                          {!perk.unlocked && (
                            <div className="mt-2 text-amber-500 font-medium">
                              Requires Level {perk.requiredLevel}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">{perk.effect}</p>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Category: {perk.category}</span>
                              <span>Cost: {perk.activationCost} gold</span>
                            </div>
                          </div>
                          
                          {perk.unlocked ? (
                            <div className="space-y-2">
                              {perk.active ? (
                                <div className="space-y-2">
                                  <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                                  <p className="text-xs text-amber-400">
                                    {getTimeUntilExpiry(perk)}
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deactivatePerk(perk.id)}
                                    className="w-full"
                                  >
                                    Deactivate
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Button
                                    onClick={() => activatePerk(perk.id)}
                                    disabled={!canActivatePerk(perk) || characterStats.gold < perk.activationCost}
                                    className="w-full"
                                  >
                                    Activate ({perk.activationCost} gold)
                                  </Button>
                                  {perk.level < perk.maxLevel && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => upgradePerk(perk.id)}
                                      disabled={characterStats.gold < perk.upgradeCost}
                                      className="w-full"
                                    >
                                      Upgrade ({perk.upgradeCost} gold)
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <Lock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500">
                                Reach Level {perk.requiredLevel} to unlock
                              </p>
                            </div>
                          )}
                        </CardContent>
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
                        className="medieval-card w-full"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{strength.icon}</span>
                              <CardTitle className="font-serif">{strength.name}</CardTitle>
                            </div>
                            <Badge className={strength.color.replace('text-', 'bg-')}>
                              Level {strength.level}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm">
                            {strength.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Experience</span>
                              <span>{strength.experience} / {strength.experienceToNextLevel}</span>
                            </div>
                            <Progress value={calculateStrengthProgress(strength)} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {strength.experienceToNextLevel - strength.experience} XP to Level {strength.level + 1}
                            </p>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-2">
                          <div className="w-full text-center">
                            <Badge variant="outline" className="w-full justify-center">
                              {strength.category.charAt(0).toUpperCase() + strength.category.slice(1)} Mastery
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
    </div>
  )
}

