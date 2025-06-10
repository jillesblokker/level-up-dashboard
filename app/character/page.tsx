"use client"

import { useState, useEffect, useRef } from "react"
import { Edit, X, Upload, Award, Sword } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { calculateExperienceForLevel, calculateLevelFromExperience, calculateLevelProgress, CharacterStats } from "@/types/character"

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
}

export default function CharacterPage() {
  const [characterStats, setCharacterStats] = useState<CharacterStats>({
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

  // Load character stats from localStorage on component mount
  useEffect(() => {
    const loadCharacterStats = () => {
      try {
        const savedStats = localStorage.getItem("character-stats");
        if (savedStats) {
          const stats = JSON.parse(savedStats) as CharacterStats;
          // Initialize with default gold if not set
          if (typeof stats.gold === 'undefined') {
            stats.gold = 1000;
            localStorage.setItem("character-stats", JSON.stringify(stats));
          }
          setCharacterStats({
            ...stats,
            level: calculateLevelFromExperience(stats.experience),
            experienceToNextLevel: calculateExperienceForLevel(calculateLevelFromExperience(stats.experience))
          });
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
          };
          localStorage.setItem("character-stats", JSON.stringify(initialStats));
          setCharacterStats(initialStats);
        }
      } catch (error) {
        console.error("Error loading character stats:", error);
      }
    };

    const loadPerks = () => {
      try {
        const savedPerks = localStorage.getItem("character-perks");
        if (savedPerks) {
          setPerks(JSON.parse(savedPerks));
        } else {
          // Initialize perks in localStorage
          localStorage.setItem("character-perks", JSON.stringify(perks));
        }
      } catch (error) {
        console.error("Error loading perks:", error);
      }
    };

    loadCharacterStats();
    loadPerks();

    // Listen for character stats updates
    const handleStatsUpdate = () => loadCharacterStats();
    window.addEventListener("character-stats-update", handleStatsUpdate);
    
    // Listen for achievement completion to unlock perks
    const handleAchievementComplete = (event: CustomEvent) => {
      const { achievementId } = event.detail;
      
      // Map achievements to perks
      const achievementPerkMap: { [key: string]: string } = {
        'defeat_100_monsters': 'p1', // Strength Mastery
        'win_50_battles': 'p1',
        'learn_20_spells': 'p4', // Quick Learner
        'read_30_scrolls': 'p4',
        'visit_all_regions': 'p3', // Gold Finder
        'discover_secret_locations': 'p3',
        'complete_50_quests': 'p2', // Endurance Training
        'max_reputation': 'p2',
        'craft_legendary': 'p5', // Nutritional Expert
        'craft_100_items': 'p5',
        'collect_all_creatures': 'p6', // Rest Master
        'collect_rare_items': 'p6'
      };

      const perkId = achievementPerkMap[achievementId];
      if (perkId) {
        setPerks(currentPerks => {
          const updatedPerks = currentPerks.map(perk => 
            perk.id === perkId ? { ...perk, unlocked: true } : perk
          );
          localStorage.setItem("character-perks", JSON.stringify(updatedPerks));
          return updatedPerks;
        });

        toast({
          title: "Perk Unlocked!",
          description: `You've unlocked a new perk through your achievements!`,
        });
      }
    };

    window.addEventListener("achievement-complete", handleAchievementComplete as EventListener);
    
    return () => {
      window.removeEventListener("character-stats-update", handleStatsUpdate);
      window.removeEventListener("achievement-complete", handleAchievementComplete as EventListener);
    };
  }, []);

  // Load perks from localStorage on mount
  useEffect(() => {
    try {
      const savedPerks = localStorage.getItem("character-perks");
      if (savedPerks) {
        setPerks(JSON.parse(savedPerks));
      }
    } catch (error) {
      console.error("Error loading perks from localStorage:", error);
    }
  }, []);

  // Whenever perks change, update localStorage
  useEffect(() => {
    try {
      localStorage.setItem("character-perks", JSON.stringify(perks));
    } catch (error) {
      console.error("Error saving perks to localStorage:", error);
    }
  }, [perks]);

  // Load titles from localStorage on mount
  useEffect(() => {
    try {
      const savedTitles = localStorage.getItem("titles");
      if (savedTitles) {
        setTitles(JSON.parse(savedTitles));
      }
    } catch (error) {
      console.error("Error loading titles from localStorage:", error);
    }
  }, []);

  // Whenever titles change, update localStorage
  useEffect(() => {
    try {
      localStorage.setItem("titles", JSON.stringify(titles));
    } catch (error) {
      console.error("Error saving titles to localStorage:", error);
    }
  }, [titles]);

  // Titles
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

  // Perks
  const [perks, setPerks] = useState<Perk[]>([
    {
      id: "p1",
      name: "Strength Mastery",
      description: "Increases XP gained from strength activities.",
      category: "Might",
      effect: "+10% XP from Might activities per level",
      level: 2,
      maxLevel: 5,
      unlocked: true,
      equipped: true,
    },
    {
      id: "p2",
      name: "Endurance Training",
      description: "Increases XP gained from cardio activities.",
      category: "Endurance",
      effect: "+10% XP from Endurance activities per level",
      level: 1,
      maxLevel: 5,
      unlocked: true,
      equipped: true,
    },
    {
      id: "p3",
      name: "Gold Finder",
      description: "Increases gold earned from all activities.",
      category: "General",
      effect: "+5% gold from all activities per level",
      level: 3,
      maxLevel: 5,
      unlocked: true,
      equipped: true,
    },
    {
      id: "p4",
      name: "Quick Learner",
      description: "Increases XP gained from knowledge activities.",
      category: "Wisdom",
      effect: "+10% XP from Wisdom activities per level",
      level: 0,
      maxLevel: 5,
      unlocked: true,
      equipped: false,
    },
    {
      id: "p5",
      name: "Nutritional Expert",
      description: "Increases benefits from tracking nutrition.",
      category: "Vitality",
      effect: "+15% XP from Vitality activities per level",
      level: 0,
      maxLevel: 3,
      unlocked: true,
      equipped: false,
    },
    {
      id: "p6",
      name: "Rest Master",
      description: "Improves recovery and sleep tracking benefits.",
      category: "Resilience",
      effect: "+10% XP from Resilience activities per level",
      level: 0,
      maxLevel: 3,
      unlocked: false,
      equipped: false,
    },
  ])

  // Function to equip a title
  const equipTitle = (titleId: string) => {
    setTitles((prev) =>
      prev.map((title) => ({
        ...title,
        equipped: title.id === titleId,
      })),
    )

    const title = titles.find((t) => t.id === titleId)
    if (title) {
      // Update characterStats with the new equipped title
      setCharacterStats((prev) => {
        const newStats = {
          ...prev,
          titles: {
            ...prev.titles,
            equipped: title.name
          }
        };
        localStorage.setItem("character-stats", JSON.stringify(newStats));
        return newStats;
      });

      toast({
        title: "Title Equipped",
        description: `You are now known as "${title.name}"`,
      })
    }
  }

  // Function to equip/unequip a perk
  const togglePerk = (perkId: string) => {
    // Check if we're trying to equip or unequip
    const perk = perks.find((p) => p.id === perkId)
    if (!perk) return

    if (perk.equipped) {
      // Unequipping is always allowed
      setPerks((prev) => {
        const updatedPerks = prev.map((p) => (p.id === perkId ? { ...p, equipped: false } : p));
        localStorage.setItem("character-perks", JSON.stringify(updatedPerks));
        return updatedPerks;
      });

      toast({
        title: "Perk Unequipped",
        description: `"${perk.name}" has been unequipped.`,
      });
    } else {
      // Check if perk is unlocked and has levels
      if (perk.unlocked && perk.level > 0) {
        // Check if we have reached the maximum number of equipped perks (3)
        const equippedPerksCount = perks.filter((p) => p.equipped).length;

        if (equippedPerksCount < 3) {
          setPerks((prev) => {
            const updatedPerks = prev.map((p) => (p.id === perkId ? { ...p, equipped: true } : p));
            localStorage.setItem("character-perks", JSON.stringify(updatedPerks));
            return updatedPerks;
          });

          toast({
            title: "Perk Equipped",
            description: `"${perk.name}" has been equipped.`,
          });
        } else {
          toast({
            title: "Maximum Perks Reached",
            description: "You can only equip 3 perks at a time. Unequip one first.",
            variant: "destructive",
          });
        }
      } else if (!perk.unlocked) {
        toast({
          title: "Perk Locked",
          description: "Complete more achievements to unlock this perk.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Perk Level Too Low",
          description: "Upgrade this perk to level 1 or higher to equip it.",
          variant: "destructive",
        });
      }
    }
  };

  // Function to upgrade a perk
  const upgradePerk = (perkId: string) => {
    const perk = perks.find((p) => p.id === perkId)
    if (!perk) return

    // Check if perk can be upgraded
    if (perk.level < perk.maxLevel) {
      // Calculate upgrade cost (100 gold per level, increasing)
      const upgradeCost = 100 * (perk.level + 1)

      // Check if user has enough gold
      if (characterStats.gold >= upgradeCost) {
        setPerks((prev) => {
          const updatedPerks = prev.map((p) => (p.id === perkId ? { ...p, level: p.level + 1 } : p));
          localStorage.setItem("character-perks", JSON.stringify(updatedPerks));
          return updatedPerks;
        });

        setCharacterStats((prev) => {
          const newStats = {
            ...prev,
            gold: prev.gold - upgradeCost
          };
          localStorage.setItem("character-stats", JSON.stringify(newStats));
          return newStats;
        });

        toast({
          title: "Perk Upgraded",
          description: `"${perk.name}" upgraded to level ${perk.level + 1}.`,
        });
      } else {
        toast({
          title: "Not Enough Gold",
          description: `You need ${upgradeCost} gold to upgrade this perk.`,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Maximum Level Reached",
        description: "This perk is already at its maximum level.",
        variant: "destructive",
      });
    }
  };

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
          {/* Character Overview */}
          <Card className="medieval-card">
            <CardHeader>
              <CardTitle className="font-serif">Character Overview</CardTitle>
              <CardDescription>Your current progress and active bonuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Level {characterStats.level}</h3>
                  <Progress value={calculateLevelProgress(characterStats.experience) * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {Math.floor(characterStats.experience)} / {characterStats.experienceToNextLevel} XP to Level {characterStats.level + 1}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Titles</h3>
                  <p className="text-sm text-muted-foreground">
                    {characterStats.titles?.unlocked ?? 0} / {characterStats.titles?.total ?? 10} Unlocked
                  </p>
                  <p className="text-sm">Currently equipped: {characterStats.titles?.equipped || "None"}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Perks</h3>
                  <p className="text-sm text-muted-foreground">
                    {characterStats.perks?.active ?? 0} / {characterStats.perks?.total ?? 5} Active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Titles and Perks */}
          <Tabs defaultValue="titles" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="titles">Titles</TabsTrigger>
              <TabsTrigger value="perks">Perks</TabsTrigger>
            </TabsList>
            <TabsContent value="titles">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {titles.map((title) => (
                  <Card
                    key={title.id}
                    className={`medieval-card ${
                      !title.unlocked
                        ? "opacity-60"
                        : title.equipped
                          ? "border-amber-500 bg-amber-50/30 dark:bg-amber-900/20"
                          : ""
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="font-serif">{title.name}</CardTitle>
                        <Badge
                          className={
                            title.rarity === "common"
                              ? "bg-gray-500"
                              : title.rarity === "uncommon"
                                ? "bg-green-500"
                                : title.rarity === "rare"
                                  ? "bg-blue-500"
                                  : title.rarity === "epic"
                                    ? "bg-purple-500"
                                    : "bg-amber-500"
                          }
                        >
                          {title.rarity.charAt(0).toUpperCase() + title.rarity.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription>{title.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Badge variant="outline" className="mr-2">
                          {title.category}
                        </Badge>
                        <span>{title.requirement}</span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      {title.unlocked ? (
                        <Button
                          className={`w-full ${
                            title.equipped
                              ? "bg-amber-200 hover:bg-amber-300 text-amber-900"
                              : "bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white"
                          }`}
                          onClick={() => equipTitle(title.id)}
                          disabled={title.equipped}
                        >
                          {title.equipped ? "Currently Equipped" : "Equip Title"}
                        </Button>
                      ) : (
                        <Button className="w-full" variant="outline" disabled>
                          Locked
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="perks">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {perks.map((perk) => (
                  <Card
                    key={perk.id}
                    className={`medieval-card ${
                      !perk.unlocked
                        ? "opacity-60"
                        : perk.equipped
                          ? "border-purple-500 bg-purple-50/30 dark:bg-purple-900/20"
                          : ""
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="font-serif">{perk.name}</CardTitle>
                        <Badge className="bg-purple-500 hover:bg-purple-600">Level {perk.level}</Badge>
                      </div>
                      <CardDescription>{perk.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Badge variant="outline" className="mr-2">
                            {perk.category}
                          </Badge>
                          <span>{perk.effect}</span>
                        </div>

                        <Progress value={(perk.level / perk.maxLevel) * 100} className="h-2" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="w-full flex gap-2">
                        {perk.unlocked ? (
                          <>
                            <Button
                              className={`flex-1 ${
                                perk.equipped
                                  ? "bg-purple-200 hover:bg-purple-300 text-purple-900"
                                  : perk.level > 0
                                    ? "bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white"
                                    : "bg-gray-300 text-gray-700"
                              }`}
                              onClick={() => togglePerk(perk.id)}
                              disabled={!perk.unlocked || (perk.level === 0 && !perk.equipped)}
                            >
                              {perk.equipped ? "Unequip" : "Equip"}
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => upgradePerk(perk.id)}
                              disabled={perk.level >= perk.maxLevel}
                              className="flex-1"
                            >
                              {perk.level < perk.maxLevel ? `Upgrade (${100 * (perk.level + 1)} Gold)` : "Max Level"}
                            </Button>
                          </>
                        ) : (
                          <Button className="w-full" variant="outline" disabled>
                            Locked
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Active Bonuses */}
          <Card className="medieval-card mt-6">
            <CardHeader>
              <CardTitle className="font-serif">Active Bonuses</CardTitle>
              <CardDescription>Your currently active perks and their effects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {perks
                  .filter((p) => p.equipped && p.level > 0)
                  .map((perk) => (
                    <Card 
                      key={perk.id} 
                      className="bg-black/50 border-amber-800/30"
                      aria-label={`active-bonus-${perk.id}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-purple-500 shrink-0" />
                          <CardTitle className="text-base font-medium">{perk.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Badge className="bg-purple-500 hover:bg-purple-600">Level {perk.level}</Badge>
                          <p className="text-sm text-muted-foreground">
                            {perk.effect.replace("per level", `(${perk.level * 10}% total)`)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {perks.filter((p) => p.equipped && p.level > 0).length === 0 && (
                  <Card className="col-span-full bg-black/50 border-amber-800/30">
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">No active perks. Equip perks to gain bonuses.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant="default"
                asChild
              >
                <Link href="/quests">
                  <Sword className="mr-2 h-4 w-4" />
                  Complete Quests to Earn More
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

