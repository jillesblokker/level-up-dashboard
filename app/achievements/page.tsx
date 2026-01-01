"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCreatureStore } from '@/stores/creatureStore'
import { CreatureCard } from '@/components/creature-card'
import Image from 'next/image'
import { HeaderSection } from '@/components/HeaderSection'
import { PageGuide } from '@/components/page-guide'
import { Trophy, Users, Sword, Crosshair } from 'lucide-react'
import { useUser, SignedIn, SignedOut, SignIn, useAuth } from '@clerk/nextjs'
import { TEXT_CONTENT } from '@/lib/text-content'

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
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const { getToken, isLoaded: isClerkLoaded } = useAuth();


  // Fetch new monster achievement definitions (201-206)
  useEffect(() => {
    const fetchAchievementDefinitions = async () => {
      try {
        const response = await fetch('/api/achievement-definitions');
        if (response.ok) {
          let data: AchievementDefinition[] = await response.json();

          // Ensure alliance achievements (107-112) are present
          const allianceIds = ['107', '108', '109', '110', '111', '112'];
          const missingAlliance = allianceIds.some(id => !data.find(a => a.id === id));

          if (missingAlliance) {
            console.log('Missing alliance achievements in DB, merging fallback definitions');
            // Hardcoded alliance achievements to merge
            const allianceAchievements: AchievementDefinition[] = [
              {
                id: '107',
                name: 'First Alliance',
                description: 'A lone wolf survives, but a pack thrives. Extend a hand to another.',
                category: 'social',
                difficulty: 'easy',
                xp_reward: 50,
                gold_reward: 10,
                image_url: '/images/achievements/107.png',
                is_hidden: false,
                unlock_condition: 'Add your first friend'
              },
              {
                id: '108',
                name: 'Guild Founder',
                description: 'A small party can accomplish great things. Expand your circle of trust to a hand\'s count.',
                category: 'social',
                difficulty: 'medium',
                xp_reward: 100,
                gold_reward: 50,
                image_url: '/images/achievements/108.png',
                is_hidden: false,
                unlock_condition: 'Add 5 friends'
              },
              {
                id: '109',
                name: 'Fellowship Leader',
                description: 'Your banner attracts many. Lead a party of ten brave souls.',
                category: 'social',
                difficulty: 'hard',
                xp_reward: 200,
                gold_reward: 100,
                image_url: '/images/achievements/109.png',
                is_hidden: false,
                unlock_condition: 'Add 10 friends'
              },
              {
                id: '110',
                name: 'Quest Giver',
                description: 'It is better to give than to receive. Challenge an ally to grow.',
                category: 'social',
                difficulty: 'easy',
                xp_reward: 50,
                gold_reward: 10,
                image_url: '/images/achievements/110.png',
                is_hidden: false,
                unlock_condition: 'Send your first quest to a friend'
              },
              {
                id: '111',
                name: 'Master Strategist',
                description: 'A true leader pushes their allies to greatness. Issue five challenges.',
                category: 'social',
                difficulty: 'hard',
                xp_reward: 150,
                gold_reward: 75,
                image_url: '/images/achievements/111.png',
                is_hidden: false,
                unlock_condition: 'Send 5 quests to friends'
              },
              {
                id: '112',
                name: 'Grand Questmaster',
                description: 'Your command over challenges is legendary. Ten allies have been tested by your hand.',
                category: 'social',
                difficulty: 'hard',
                xp_reward: 500,
                gold_reward: 100,
                image_url: '/images/achievements/112.png',
                is_hidden: false,
                unlock_condition: 'Send 10 quests to friends'
              }
            ];

            // Merge unique definitions
            const existingIds = new Set(data.map(a => a.id));
            const toAdd = allianceAchievements.filter(a => !existingIds.has(a.id));
            data = [...data, ...toAdd];
          }

          // Deduplicate all achievements by ID just in case
          const uniqueData = Array.from(new Map(data.map(item => [item.id, item])).values());

          // Fetched achievement definitions
          setAchievementDefinitions(uniqueData);
        } else {
          console.error('Failed to fetch achievement definitions:', response.status);
          // Fallback to hardcoded definitions if API fails
          const fallbackDefinitions: AchievementDefinition[] = [
            // New monster achievements (201-206)
            {
              id: '201',
              name: 'Ancient Dragon Slayer',
              description: 'Face the ancient winged beast. Watch its movements closely and strike true.',
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
              description: 'The crafty looting menace hides in the shadows. Match its cunning moves.',
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
              description: 'A mountain of muscle blocks your path. Mimic its brute force to bring it down.',
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
              description: 'Magic swirls in complex patterns. Memorize the arcane sequence to dispel the darkness.',
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
              description: 'A majestic creature of the clouds. Follow its graceful flight to earn its trust.',
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
              description: 'Small and swift, dancing in the light. Keep up with the fae\'s rhythm.',
              category: 'combat',
              difficulty: 'easy',
              xp_reward: 100,
              gold_reward: 100,
              image_url: '/images/achievements/206.png',
              is_hidden: false,
              unlock_condition: 'Complete Simon Says battle against Fairy'
            },
            // Ally achievements (107-111)
            {
              id: '107',
              name: 'First Alliance',
              description: 'A lone wolf survives, but a pack thrives. Extend a hand to another.',
              category: 'social',
              difficulty: 'easy',
              xp_reward: 50,
              gold_reward: 10,
              image_url: '/images/achievements/107.png',
              is_hidden: false,
              unlock_condition: 'Add your first friend'
            },
            {
              id: '108',
              name: 'Guild Founder',
              description: 'A small party can accomplish great things. Expand your circle of trust to a hand\'s count.',
              category: 'social',
              difficulty: 'medium',
              xp_reward: 100,
              gold_reward: 50,
              image_url: '/images/achievements/108.png',
              is_hidden: false,
              unlock_condition: 'Add 5 friends'
            },
            {
              id: '109',
              name: 'Fellowship Leader',
              description: 'Your banner attracts many. Lead a party of ten brave souls.',
              category: 'social',
              difficulty: 'hard',
              xp_reward: 200,
              gold_reward: 100,
              image_url: '/images/achievements/109.png',
              is_hidden: false,
              unlock_condition: 'Add 10 friends'
            },
            {
              id: '110',
              name: 'Quest Giver',
              description: 'It is better to give than to receive. Challenge an ally to grow.',
              category: 'social',
              difficulty: 'easy',
              xp_reward: 50,
              gold_reward: 10,
              image_url: '/images/achievements/110.png',
              is_hidden: false,
              unlock_condition: 'Send your first quest to a friend'
            },
            {
              id: '111',
              name: 'Master Strategist',
              description: 'A true leader pushes their allies to greatness. Issue five challenges.',
              category: 'social',
              difficulty: 'hard',
              xp_reward: 150,
              gold_reward: 75,
              image_url: '/images/achievements/111.png',
              is_hidden: false,
              unlock_condition: 'Send 5 quests to friends'
            },
            {
              id: '112',
              name: 'Grand Questmaster',
              description: 'Your command over challenges is legendary. Ten allies have been tested by your hand.',
              category: 'social',
              difficulty: 'hard',
              xp_reward: 500,
              gold_reward: 100,
              image_url: '/images/achievements/112.png',
              is_hidden: false,
              unlock_condition: 'Send 10 quests to friends'
            },
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

          // Fetched achievements
          console.log("Unlocked Achievement IDs:", Array.from(achievementMap.keys()));

          setUnlockedAchievements(achievementMap);
        } else {
          setError(TEXT_CONTENT.achievements.ui.error.replace('{status}', String(response.status)));
          setUnlockedAchievements(new Map());
        }
      } catch (error) {
        setError(TEXT_CONTENT.achievements.ui.genericError);
        setUnlockedAchievements(new Map());
      } finally {
        setIsLoading(false);
      }
    };
    fetchAchievements();
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
        <p>{TEXT_CONTENT.achievements.ui.loading}</p>
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
        <p>{TEXT_CONTENT.achievements.ui.noCreatures}</p>
      </div>
    );
  }
  const hasAnyUnlocked = creatures.some(c => unlockedAchievements.has(c.id)) || achievementDefinitions.some(a => unlockedAchievements.has(a.id));
  return (
    <>
      <SignedIn>
        <HeaderSection
          title={TEXT_CONTENT.achievements.header.title}
          imageSrc="/images/achievements-header.jpg"
          canEdit={true}
          shouldRevealImage={true}
          guideComponent={
            <PageGuide
              title={TEXT_CONTENT.achievements.header.guide.title}
              subtitle={TEXT_CONTENT.achievements.header.guide.subtitle}
              sections={[
                {
                  title: TEXT_CONTENT.achievements.header.guide.sections.collection.title,
                  icon: Crosshair,
                  content: TEXT_CONTENT.achievements.header.guide.sections.collection.content
                },
                {
                  title: TEXT_CONTENT.achievements.header.guide.sections.battles.title,
                  icon: Sword,
                  content: TEXT_CONTENT.achievements.header.guide.sections.battles.content
                },
                {
                  title: TEXT_CONTENT.achievements.header.guide.sections.social.title,
                  icon: Users,
                  content: TEXT_CONTENT.achievements.header.guide.sections.social.content
                }
              ]}
            />
          }
        />
        <main className="container mx-auto p-6" aria-label="achievements-section">
          {!hasAnyUnlocked && !showAllUnlocked && (
            <div className="text-center text-gray-400 mb-8">{TEXT_CONTENT.achievements.ui.empty}</div>
          )}

          {/* Original Creatures Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-amber-400">{TEXT_CONTENT.achievements.sections.creatures}</h2>
              <button
                type="button"
                className="px-6 py-2 rounded-lg bg-amber-500 text-white font-semibold shadow-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 transition-all duration-200"
                aria-label={showAllUnlocked ? TEXT_CONTENT.achievements.ui.hideUnlocked : TEXT_CONTENT.achievements.ui.showUnlocked}
                onClick={() => setShowAllUnlocked((prev) => !prev)}
              >
                {showAllUnlocked ? TEXT_CONTENT.achievements.ui.hideUnlocked : TEXT_CONTENT.achievements.ui.showUnlocked}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="creature-cards-grid">
              {creatures
                .filter(creature => parseInt(creature.id) < 107) // Exclude alliance achievements from creature grid
                .map(creature => {
                  if (!creature) return null;
                  const unlocked = isCreatureUnlocked(creature.id);
                  const unlockDate = getUnlockDate(creature.id);
                  const isFlipped = flippedCardId === creature.id;
                  return (
                    <Card
                      key={creature.id}
                      className={`${unlocked ? 'medieval-card' : 'medieval-card-undiscovered'} relative shadow-lg border-2 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 hover:scale-[1.02] h-[600px] p-0`}
                      aria-label={`creature-card-${creature.id}`}
                    >
                      {/* Full-width/height image only */}
                      <div className="absolute inset-0 w-full h-full">
                        {unlocked ? (
                          <div className="relative w-full h-full cursor-pointer" onClick={() => setFlippedCardId(isFlipped ? null : creature.id)}>
                            <Image
                              src={creature.image}
                              alt={creature.name}
                              fill
                              className="object-cover"
                            />
                            {/* Stats Overlay */}
                            {isFlipped && (
                              <div className="absolute inset-0 bg-[#0a192f] p-10 flex flex-col z-30">
                                <h3 className="text-xl font-bold text-amber-500 mb-4">{creature.name}</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-300 mb-1">{TEXT_CONTENT.achievements.card.hp}</p>
                                    <p className="text-white font-medium">{creature.stats.hp}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-300 mb-1">{TEXT_CONTENT.achievements.card.attack}</p>
                                    <p className="text-white font-medium">{creature.stats.attack}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-300 mb-1">{TEXT_CONTENT.achievements.card.defense}</p>
                                    <p className="text-white font-medium">{creature.stats.defense}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-300 mb-1">{TEXT_CONTENT.achievements.card.speed}</p>
                                    <p className="text-white font-medium">{creature.stats.speed}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-gray-300 mb-1">{TEXT_CONTENT.achievements.card.type}</p>
                                    <p className="text-white font-medium">{creature.stats.type}</p>
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <p className="text-gray-300 mb-1">{TEXT_CONTENT.achievements.card.description}</p>
                                  <p className="text-white text-sm leading-relaxed">{creature.description}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <Image
                            src={'/images/undiscovered.png'}
                            alt={TEXT_CONTENT.achievements.card.undiscovered}
                            fill
                            className="object-cover opacity-50"
                          />
                        )}
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>

          {/* Alliance Achievements Section */}
          {achievementDefinitions.length > 0 && (
            <div className="mb-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="alliance-achievement-cards-grid">
                {achievementDefinitions
                  .filter(achievement => {
                    // Only show alliance achievements (107-112)
                    const achievementId = parseInt(achievement.id);
                    return achievementId >= 107 && achievementId <= 112;
                  })
                  .map(achievement => {
                    if (!achievement) return null;
                    const unlocked = isUnlocked(achievement.id);
                    const unlockDate = getUnlockDate(achievement.id);

                    return (
                      <Card
                        key={achievement.id}
                        className={`${unlocked ? 'medieval-card' : 'medieval-card-undiscovered'} relative shadow-lg border-2 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 hover:scale-[1.02] h-[600px] p-0`}
                        aria-label={`alliance-achievement-card-${achievement.id}`}
                      >
                        {/* Full-width/height image only */}
                        <div className="absolute inset-0 w-full h-full">
                          {unlocked ? (
                            <Image
                              src={achievement.image_url}
                              alt={achievement.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Image
                              src={'/images/undiscovered.png'}
                              alt={TEXT_CONTENT.achievements.card.undiscovered}
                              fill
                              className="object-cover opacity-50"
                            />
                          )}
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}

          {/* New Monster Achievements Section */}
          {achievementDefinitions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-amber-400 mb-4">{TEXT_CONTENT.achievements.sections.monsterBattles}</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="achievement-cards-grid">
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
                        className={`${unlocked ? 'medieval-card' : 'medieval-card-undiscovered'} relative shadow-lg border-2 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 hover:scale-[1.02] h-[600px] p-0`}
                        aria-label={`achievement-card-${achievement.id}`}
                      >
                        {/* Full-width/height image only */}
                        <div className="absolute inset-0 w-full h-full">
                          {unlocked ? (
                            <Image
                              src={achievement.image_url}
                              alt={monsterName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Image
                              src={'/images/undiscovered.png'}
                              alt={TEXT_CONTENT.achievements.card.undiscovered}
                              fill
                              className="object-cover opacity-50"
                            />
                          )}
                        </div>
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