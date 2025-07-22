"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from 'next/image'
import { HeaderSection } from '@/components/HeaderSection'
import { useUser, SignedIn, SignedOut, SignIn, useAuth } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase/client'
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
  const [achievementDefinitions, setAchievementDefinitions] = useState<AchievementDefinition[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Map<string, DbAchievement>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded: isAuthLoaded } = useUser();
  const userId = user?.id;
  const [showAllUnlocked, setShowAllUnlocked] = useState(false);
  const { getToken, isLoaded: isClerkLoaded } = useAuth();

  // Fetch achievement definitions
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
        const token = await getToken();
        if (!token) throw new Error('No Clerk token');
        const response = await fetch(`/api/achievements?userId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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

    // --- Supabase real-time subscription ---
    const channel = supabase.channel('achievements-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'achievements',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          fetchAchievements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
  if (!achievementDefinitions || achievementDefinitions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>No achievements defined.</p>
      </div>
    );
  }
  const hasAnyUnlocked = achievementDefinitions.some(a => unlockedAchievements.has(a.id));
  return (
    <>
      <SignedIn>
        <HeaderSection
          title="Achievement Collection"
          imageSrc="/images/achievements-header.jpg"
          canEdit={true}
        />
        <main className="container mx-auto p-6" aria-label="achievements-section">
          {!hasAnyUnlocked && !showAllUnlocked && (
            <div className="text-center text-gray-400 mb-8">No achievements unlocked yet. Start exploring to discover achievements!</div>
          )}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3" aria-label="achievement-cards-grid">
            {achievementDefinitions.map(achievement => {
              if (!achievement) return null;
              const unlocked = isUnlocked(achievement.id);
              const unlockDate = getUnlockDate(achievement.id);
              return (
                <Card
                  key={achievement.id}
                  className={`medieval-card flex flex-col items-center justify-center min-h-[420px] p-4 shadow-lg border-2 rounded-xl transition-all duration-300 ${unlocked ? 'border-amber-500 bg-gray-800' : 'border-gray-700 bg-gray-900 opacity-70'}`}
                  aria-label={`achievement-card-${achievement.id}`}
                >
                  <CardHeader className="w-full flex flex-col items-center text-center">
                    <CardTitle className="font-serif text-2xl text-amber-400">{achievement.name}</CardTitle>
                    {!unlocked && (
                      <Badge variant="secondary" className="mt-2" aria-label={`achievement-${achievement.id}-undiscovered-badge`}>
                        Undiscovered
                      </Badge>
                    )}
                    <Badge variant="outline" className="mt-1 text-xs">
                      {achievement.difficulty} • {achievement.category}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center w-full">
                    <div className="relative w-full aspect-[5/7] mb-4 flex items-center justify-center">
                      {unlocked ? (
                        <div className="absolute inset-0">
                          <Image 
                            src={achievement.image_url} 
                            alt={achievement.name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                      ) : (
                        <Image src={'/images/undiscovered.png'} alt="Undiscovered Achievement" fill sizes="(max-width: 768px) 100vw, 340px" className="object-cover rounded-lg opacity-50" />
                      )}
                    </div>
                    <div className="text-center text-sm text-gray-300 mb-2">
                      <p>{achievement.description}</p>
                    </div>
                    {unlocked && unlockDate && unlockDate !== "Invalid Date" && (
                      <div className="mt-2 text-sm text-gray-400" aria-label={`unlock-date-for-${achievement.id}`}>
                        <span>Unlocked on {unlockDate}</span>
                      </div>
                    )}
                    {achievement.unlock_condition && (
                      <div className="mt-2 text-center text-xs text-amber-400" aria-label={`achievement-card-${achievement.id}-requirement`}>
                        <span>{achievement.unlock_condition}</span>
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
        <div className="flex justify-center mt-8" aria-label="achievements-toggle-container">
          <button
            type="button"
            className="px-6 py-2 rounded-lg bg-amber-500 text-white font-semibold shadow-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 transition-all duration-200"
            aria-label={showAllUnlocked ? "Hide unlocked achievements" : "Show unlocked achievements"}
            onClick={() => setShowAllUnlocked((prev) => !prev)}
          >
            {showAllUnlocked ? "Hide unlocked" : "Show unlocked"}
          </button>
        </div>
      </SignedIn>
      <SignedOut>
        <SignIn />
      </SignedOut>
    </>
  );
}