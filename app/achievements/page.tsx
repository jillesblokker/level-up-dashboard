"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCreatureStore } from '@/stores/creatureStore'
import { CreatureCard } from '@/components/creature-card'
import Image from 'next/image'
import { HeaderSection } from '@/components/HeaderSection'
import { useUser, SignedIn, SignedOut, SignIn, useAuth } from '@clerk/nextjs'

import LoadingAchievements from './loading'

interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  xp_reward: number;
  gold_reward: number;
  image_url: string;
  is_hidden: boolean;
  unlock_condition: string;
}

interface DbAchievement {
  id: string;
  userId: string;
  achievement_id?: string;
  achievementId: string;
  unlocked_at: string;
  achievement_name: string;
  description?: string;
}

export default function Page() {
  const { creatures } = useCreatureStore()
  const [achievementDefinitions, setAchievementDefinitions] = useState<AchievementDefinition[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Map<string, DbAchievement>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded: isAuthLoaded } = useUser();
  const userId = user?.id;
  const [showAllUnlocked, setShowAllUnlocked] = useState(false);
  const { getToken, isLoaded: isClerkLoaded } = useAuth();

  // Fetch new monster achievement definitions (201-206)
  useEffect(() => {
    const fetchAchievementDefinitions = async () => {
      try {
        const response = await fetch('/api/achievement-definitions');
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched achievement definitions:', data);
          setAchievementDefinitions(data);
        } else {
          console.error('Failed to fetch achievement definitions:', response.status);
          // Fallback to hardcoded definitions if API fails
          const fallbackDefinitions: AchievementDefinition[] = [
            // New monster achievements (201-206)
            {
              id: '201',
              name: 'Ancient Dragon Slayer',
              description: 'Defeat Dragoni in a Simon Says battle',
              category: 'combat',
              difficulty: 'hard',
              xp_reward: 100,
              gold_reward: 100,
              image_url: '/images/achievements/201.png',
              is_hidden: false,
              unlock_condition: 'Complete Simon Says battle against Dragon'
            },
            {
              id: '202',
              name: 'Goblin Hunter',
              description: 'Defeat Orci in a Simon Says battle',
              category: 'combat',
              difficulty: 'easy',
              xp_reward: 100,
              gold_reward: 100,
              image_url: '/images/achievements/202.png',
              is_hidden: false,
              unlock_condition: 'Complete Simon Says battle against Goblin'
            },
            {
              id: '203',
              name: 'Troll Crusher',
              description: 'Defeat Trollie in a Simon Says battle',
              category: 'combat',
              difficulty: 'medium',
              xp_reward: 100,
              gold_reward: 100,
              image_url: '/images/achievements/203.png',
              is_hidden: false,
              unlock_condition: 'Complete Simon Says battle against Troll'
            },
            {
              id: '204',
              name: 'Dark Wizard Vanquisher',
              description: 'Defeat Sorcero in a Simon Says battle',
              category: 'combat',
              difficulty: 'hard',
              xp_reward: 100,
              gold_reward: 100,
              image_url: '/images/achievements/204.png',
              is_hidden: false,
              unlock_condition: 'Complete Simon Says battle against Wizard'
            },
            {
              id: '205',
              name: 'Pegasus Tamer',
              description: 'Defeat Peggie in a Simon Says battle',
              category: 'combat',
              difficulty: 'medium',
              xp_reward: 100,
              gold_reward: 100,
              image_url: '/images/achievements/205.png',
              is_hidden: false,
              unlock_condition: 'Complete Simon Says battle against Pegasus'
            },
            {
              id: '206',
              name: 'Fairy Friend',
              description: 'Defeat Fairiel in a Simon Says battle',
              category: 'combat',
              difficulty: 'easy',
              xp_reward: 100,
              gold_reward: 100,
              image_url: '/images/achievements/206.png',
              is_hidden: false,
              unlock_condition: 'Complete Simon Says battle against Fairy'
            }
          ];
          setAchievementDefinitions(fallbackDefinitions);
        }
      } catch (error) {
        console.error('Error fetching achievement definitions:', error);
        // Use fallback definitions on error too
        const fallbackDefinitions: AchievementDefinition[] = [
          // New monster achievements (201-206)
          {
            id: '201',
            name: 'Ancient Dragon Slayer',
            description: 'Defeat Dragoni in a Simon Says battle',
            category: 'combat',
            difficulty: 'hard',
            xp_reward: 100,
            gold_reward: 100,
            image_url: '/images/achievements/201.png',
            is_hidden: false,
            unlock_condition: 'Complete Simon Says battle against Dragon'
          },
          {
            id: '202',
            name: 'Goblin Hunter',
            description: 'Defeat Orci in a Simon Says battle',
            category: 'combat',
            difficulty: 'easy',
            xp_reward: 100,
            gold_reward: 100,
            image_url: '/images/achievements/202.png',
            is_hidden: false,
            unlock_condition: 'Complete Simon Says battle against Goblin'
          },
          {
            id: '203',
            name: 'Troll Crusher',
            description: 'Defeat Trollie in a Simon Says battle',
            category: 'combat',
            difficulty: 'medium',
            xp_reward: 100,
            gold_reward: 100,
            image_url: '/images/achievements/203.png',
            is_hidden: false,
            unlock_condition: 'Complete Simon Says battle against Troll'
          },
          {
            id: '204',
            name: 'Dark Wizard Vanquisher',
            description: 'Defeat Sorcero in a Simon Says battle',
            category: 'combat',
            difficulty: 'hard',
            xp_reward: 100,
            gold_reward: 100,
            image_url: '/images/achievements/204.png',
            is_hidden: false,
            unlock_condition: 'Complete Simon Says battle against Wizard'
          },
          {
            id: '205',
            name: 'Pegasus Tamer',
            description: 'Defeat Peggie in a Simon Says battle',
            category: 'combat',
            difficulty: 'medium',
            xp_reward: 100,
            gold_reward: 100,
            image_url: '/images/achievements/205.png',
            is_hidden: false,
            unlock_condition: 'Complete Simon Says battle against Pegasus'
          },
          {
            id: '206',
            name: 'Fairy Friend',
            description: 'Defeat Fairiel in a Simon Says battle',
            category: 'combat',
            difficulty: 'easy',
            xp_reward: 100,
            gold_reward: 100,
            image_url: '/images/achievements/206.png',
            is_hidden: false,
            unlock_condition: 'Complete Simon Says battle against Fairy'
          }
        ];
        setAchievementDefinitions(fallbackDefinitions);
      }
    };

    fetchAchievementDefinitions();
  }, []);

  // Fetch unlocked achievements from the API
  useEffect(() => {
    if (!isClerkLoaded || !isAuthLoaded || !userId) {
      if (isClerkLoaded && isAuthLoaded) setIsLoading(false);
      return;
    }
    const fetchAchievements = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/achievements?userId=${userId}`);
        if (response.ok) {
          const data: DbAchievement[] = await response.json();
          const achievementMap = new Map(data.filter(Boolean).map(ach => [ach.achievementId, ach]));

          console.log("Fetched achievements:", data);
          console.log("Unlocked Achievement IDs:", Array.from(achievementMap.keys()));

          setUnlockedAchievements(achievementMap);
        } else {
          setError(`Failed to fetch achievements (status: ${response.status})`);
          setUnlockedAchievements(new Map());
        }
      } catch (error) {
        setError('An error occurred while fetching achievements.');
        setUnlockedAchievements(new Map());
      } finally {
        setIsLoading(false);
      }
    };
    fetchAchievements();

    // --- Polling for achievement changes instead of real-time sync ---
    const pollInterval = setInterval(() => {
      if (userId) {
        fetchAchievements();
      }
    }, 30000); // Poll every 30 seconds instead of 5 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [isClerkLoaded, isAuthLoaded, userId, getToken]);
  
  const isUnlocked = (achievementId: string) => {
    if (showAllUnlocked) return true;
    return unlockedAchievements.has(achievementId);
  }

  const getUnlockDate = (achievementId: string) => {
    const achievement = unlockedAchievements.get(achievementId);
    return achievement ? new Date(achievement.unlocked_at).toLocaleDateString() : null;
  }

  const isCreatureUnlocked = (creatureId: string) => {
    if (showAllUnlocked) return true;
    return unlockedAchievements.has(creatureId);
  }

  if (!isClerkLoaded || !isAuthLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>Loading Clerk...</p>
      </div>
    );
  }
  if (isLoading) {
    return <LoadingAchievements />;
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-red-400">
        <p>{error}</p>
      </div>
    );
  }
  if (!creatures || creatures.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>No creatures defined.</p>
      </div>
    );
  }
  const hasAnyUnlocked = creatures.some(c => unlockedAchievements.has(c.id)) || achievementDefinitions.some(a => unlockedAchievements.has(a.id));
  return (
    <>
      <SignedIn>
        <HeaderSection
          title="Creature Collection"
          imageSrc="/images/achievements-header.jpg"
          canEdit={true}
          shouldRevealImage={true}
        />
        <main className="container mx-auto p-6" aria-label="achievements-section">
          {!hasAnyUnlocked && !showAllUnlocked && (
            <div className="text-center text-gray-400 mb-8">No achievements unlocked yet. Start exploring to discover creatures!</div>
          )}
          
          {/* Original Creatures Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-amber-400">Creatures</h2>
              <button
                type="button"
                className="px-6 py-2 rounded-lg bg-amber-500 text-white font-semibold shadow-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 transition-all duration-200"
                aria-label={showAllUnlocked ? "Hide unlocked achievements" : "Show unlocked achievements"}
                onClick={() => setShowAllUnlocked((prev) => !prev)}
              >
                {showAllUnlocked ? "Hide unlocked" : "Show unlocked"}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3" aria-label="creature-cards-grid">
              {creatures.map(creature => {
                if (!creature) return null;
                const unlocked = isCreatureUnlocked(creature.id);
                const unlockDate = getUnlockDate(creature.id);
                return (
                  <Card
                    key={creature.id}
                    className={`${unlocked ? 'medieval-card' : 'medieval-card-undiscovered'} flex flex-col items-center justify-center min-h-[640px] p-4 shadow-lg border-2 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 hover:scale-[1.02]`}
                    aria-label={`creature-card-${creature.id}`}
                  >
                    <CardHeader className="w-full flex flex-col items-center text-center">
                      <CardTitle className={`text-lg font-semibold ${unlocked ? 'text-amber-400' : 'text-white'}`}>{creature.name} {creature.number}</CardTitle>

                    </CardHeader>
                    <CardContent className="flex flex-col items-center w-full px-1">
                      <div className="relative w-full aspect-[2/3] mb-4 flex items-center justify-center">
                        {unlocked ? (
                          <div className="absolute inset-0">
                            <CreatureCard
                              creature={creature}
                              discovered={true}
                              showCard={true}
                              previewMode={false}
                            />
                          </div>
                        ) : (
                          <Image src={'/images/undiscovered.png'} alt="Undiscovered Card" fill sizes="(max-width: 768px) 100vw, 340px" className="object-cover rounded-lg opacity-50" />
                        )}
                      </div>
                      {unlocked && unlockDate && unlockDate !== "Invalid Date" && (
                        <div className="mt-2 text-sm text-gray-400" aria-label={`unlock-date-for-${creature.id}`}>
                          <span>Unlocked on {unlockDate}</span>
                        </div>
                      )}
                      {unlocked && creature.requirement && (
                        <div className="mt-2 text-center text-base text-white" aria-label={`creature-card-${creature.id}-requirement`}>
                          <span>Requirement: {creature.requirement}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* New Monster Achievements Section */}
          {achievementDefinitions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-amber-400 mb-4">Monster Battles</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3" aria-label="achievement-cards-grid">
                {achievementDefinitions
                  .filter(achievement => {
                    // Only show monster battle achievements (201-206)
                    const achievementId = parseInt(achievement.id);
                    return achievementId >= 201 && achievementId <= 206;
                  })
                  .map(achievement => {
                  if (!achievement) return null;
                  const unlocked = isUnlocked(achievement.id);
                  const unlockDate = getUnlockDate(achievement.id);
                  
                  // Map achievement IDs to monster names
                  const monsterNames: Record<string, string> = {
                    '201': 'Dragoni',
                    '202': 'Orci', 
                    '203': 'Trollie',
                    '204': 'Sorcero',
                    '205': 'Peggie',
                    '206': 'Fairiel'
                  };
                  
                  const monsterName = monsterNames[achievement.id] || achievement.name;
                  
                  return (
                    <Card
                      key={achievement.id}
                      className={`${unlocked ? 'medieval-card' : 'medieval-card-undiscovered'} flex flex-col items-center justify-start min-h-[640px] p-4 shadow-lg border-2 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 hover:scale-[1.02]`}
                      aria-label={`achievement-card-${achievement.id}`}
                    >
                      <CardHeader className="w-full flex flex-col items-center text-center mb-4">
                        <CardTitle className={`font-serif text-2xl ${unlocked ? 'text-amber-400' : 'text-white'}`}>{monsterName} #{achievement.id}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center w-full px-4 flex-1">
                        <div className="relative w-full h-80 mb-4 flex items-center justify-center">
                          {unlocked ? (
                            <div className="absolute inset-0">
                              <Image 
                                src={achievement.image_url} 
                                alt={monsterName}
                                fill
                                className="object-cover rounded-lg"
                              />
                            </div>
                          ) : (
                            <Image src={'/images/undiscovered.png'} alt="Undiscovered Achievement" fill sizes="(max-width: 768px) 100vw, 340px" className="object-cover rounded-lg opacity-50" />
                          )}
                        </div>
                        
                        {/* Content area - always present for consistent layout */}
                        <div className="flex flex-col items-center w-full">
                          {unlocked ? (
                            <>
                              <div className="text-center text-sm text-gray-300 mb-2">
                                <p>{achievement.description}</p>
                              </div>
                              {unlockDate && unlockDate !== "Invalid Date" && (
                                <div className="mt-2 text-sm text-gray-400" aria-label={`unlock-date-for-${achievement.id}`}>
                                  <span>Unlocked on {unlockDate}</span>
                                </div>
                              )}
                              <div className="mt-2 flex gap-2">
                                <Badge variant="outline" className="text-xs">
                                  +{achievement.xp_reward} XP
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  +{achievement.gold_reward} Gold
                                </Badge>
                              </div>
                            </>
                          ) : (
                            <div className="text-center text-sm text-gray-400 mb-2">
                              <p>Undiscovered</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </main>
        {/* Bottom spacing */}
        <div className="h-8 md:h-12"></div>
      </SignedIn>
      <SignedOut>
        <SignIn />
      </SignedOut>
    </>
  );
}