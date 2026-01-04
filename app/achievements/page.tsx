"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useCreatureStore } from '@/stores/creatureStore'
import { CreatureCard } from '@/components/creature-card'
import Image from 'next/image'
import { HeaderSection } from '@/components/HeaderSection'
import { PageGuide } from '@/components/page-guide'
import { Trophy, Users, Sword, Crosshair, Coins, Star, Shield, Zap } from 'lucide-react'
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
          },
          // Progress Achievements (301-312)
          {
            id: '301',
            name: 'Quest Apprentice',
            description: 'Every journey begins with a single step. Complete your first 10 quests.',
            category: 'progress',
            difficulty: 'easy',
            xp_reward: 100,
            gold_reward: 50,
            image_url: '/images/achievements/301.png',
            is_hidden: false,
            unlock_condition: 'Complete 10 quests'
          },
          {
            id: '302',
            name: 'Quest Journeyman',
            description: 'Your dedication to duty grows stronger. Complete 25 quests.',
            category: 'progress',
            difficulty: 'medium',
            xp_reward: 250,
            gold_reward: 125,
            image_url: '/images/achievements/302.png',
            is_hidden: false,
            unlock_condition: 'Complete 25 quests'
          },
          {
            id: '303',
            name: 'Quest Master',
            description: 'Legendary heroes are forged through countless trials. Complete 50 quests.',
            category: 'progress',
            difficulty: 'hard',
            xp_reward: 500,
            gold_reward: 250,
            image_url: '/images/achievements/303.png',
            is_hidden: false,
            unlock_condition: 'Complete 50 quests'
          },
          {
            id: '304',
            name: 'Rising Hero',
            description: 'Your power grows. Reach level 5.',
            category: 'progress',
            difficulty: 'easy',
            xp_reward: 150,
            gold_reward: 75,
            image_url: '/images/achievements/304.png',
            is_hidden: false,
            unlock_condition: 'Reach level 5'
          },
          {
            id: '305',
            name: 'Seasoned Adventurer',
            description: 'Experience has made you wise. Reach level 10.',
            category: 'progress',
            difficulty: 'medium',
            xp_reward: 300,
            gold_reward: 150,
            image_url: '/images/achievements/305.png',
            is_hidden: false,
            unlock_condition: 'Reach level 10'
          },
          {
            id: '306',
            name: 'Legendary Champion',
            description: 'Few reach such heights. Reach level 25.',
            category: 'progress',
            difficulty: 'hard',
            xp_reward: 750,
            gold_reward: 400,
            image_url: '/images/achievements/306.png',
            is_hidden: false,
            unlock_condition: 'Reach level 25'
          },
          {
            id: '307',
            name: 'Challenge Seeker',
            description: 'Embrace difficulty. Complete 5 challenges.',
            category: 'progress',
            difficulty: 'easy',
            xp_reward: 100,
            gold_reward: 50,
            image_url: '/images/achievements/307.png',
            is_hidden: false,
            unlock_condition: 'Complete 5 challenges'
          },
          {
            id: '308',
            name: 'Challenge Conqueror',
            description: 'Obstacles fuel your resolve. Complete 15 challenges.',
            category: 'progress',
            difficulty: 'medium',
            xp_reward: 250,
            gold_reward: 125,
            image_url: '/images/achievements/308.png',
            is_hidden: false,
            unlock_condition: 'Complete 15 challenges'
          },
          {
            id: '309',
            name: 'Challenge Legend',
            description: 'Nothing stands in your way. Complete 30 challenges.',
            category: 'progress',
            difficulty: 'hard',
            xp_reward: 500,
            gold_reward: 250,
            image_url: '/images/achievements/309.png',
            is_hidden: false,
            unlock_condition: 'Complete 30 challenges'
          },
          {
            id: '310',
            name: 'Coin Collector',
            description: 'A growing treasury. Accumulate 1,000 gold total.',
            category: 'wealth',
            difficulty: 'easy',
            xp_reward: 100,
            gold_reward: 100,
            image_url: '/images/achievements/310.png',
            is_hidden: false,
            unlock_condition: 'Accumulate 1000 gold'
          },
          {
            id: '311',
            name: 'Wealthy Merchant',
            description: 'Your coffers overflow. Accumulate 5,000 gold total.',
            category: 'wealth',
            difficulty: 'medium',
            xp_reward: 250,
            gold_reward: 250,
            image_url: '/images/achievements/311.png',
            is_hidden: false,
            unlock_condition: 'Accumulate 5000 gold'
          },
          {
            id: '312',
            name: 'Golden Sovereign',
            description: 'A fortune fit for royalty. Accumulate 10,000 gold total.',
            category: 'wealth',
            difficulty: 'hard',
            xp_reward: 500,
            gold_reward: 500,
            image_url: '/images/achievements/312.png',
            is_hidden: false,
            unlock_condition: 'Accumulate 10000 gold'
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

    const runCatchUpAndFetch = async () => {
      setIsLoading(true);
      setError(null);

      // First, run catch-up to unlock any achievements based on current state
      try {
        console.log('[Achievements Page] Running catch-up...');
        const catchUpResponse = await fetch('/api/achievements/catch-up', { method: 'POST' });
        if (catchUpResponse.ok) {
          const catchUpResult = await catchUpResponse.json();
          console.log('[Achievements Page] Catch-up result:', catchUpResult);
        } else {
          console.warn('[Achievements Page] Catch-up failed:', catchUpResponse.status);
        }
      } catch (catchUpError) {
        console.error('[Achievements Page] Catch-up error:', catchUpError);
      }

      // Then fetch all achievements (including newly unlocked ones)
      try {
        const response = await fetch(`/api/achievements?userId=${userId}`);
        if (response.ok) {
          const data: DbAchievement[] = await response.json();
          // Map by both achievementId and achievement_id for compatibility
          const achievementMap = new Map<string, DbAchievement>();
          data.filter(Boolean).forEach(ach => {
            if (ach.achievementId) achievementMap.set(ach.achievementId, ach);
            if (ach.achievement_id) achievementMap.set(ach.achievement_id, ach);
          });

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

    runCatchUpAndFetch();
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

  // Stats Calculations
  const creatureAchievements = creatures.filter(c => parseInt(c.id) < 107);
  const totalCreatures = creatureAchievements.length;
  const unlockedCreaturesCount = creatureAchievements.filter(c => isCreatureUnlocked(c.id)).length;
  const creatureProgress = totalCreatures > 0 ? (unlockedCreaturesCount / totalCreatures) * 100 : 0;

  const allianceAchievementsList = achievementDefinitions.filter(a => { const id = parseInt(a.id); return id >= 107 && id <= 112; });
  const totalAlliance = allianceAchievementsList.length;
  const unlockedAllianceCount = allianceAchievementsList.filter(a => isUnlocked(a.id)).length;
  const allianceProgress = totalAlliance > 0 ? (unlockedAllianceCount / totalAlliance) * 100 : 0;

  const combatAchievements = achievementDefinitions.filter(a => { const id = parseInt(a.id); return id >= 201 && id <= 206; });
  const totalCombat = combatAchievements.length;
  const unlockedCombatCount = combatAchievements.filter(a => isUnlocked(a.id)).length;
  const combatProgress = totalCombat > 0 ? (unlockedCombatCount / totalCombat) * 100 : 0;

  // Progress Achievements (301-312)
  const progressAchievementsList = achievementDefinitions.filter(a => { const id = parseInt(a.id); return id >= 301 && id <= 312; });
  const totalProgress = progressAchievementsList.length;
  const unlockedProgressCount = progressAchievementsList.filter(a => isUnlocked(a.id)).length;
  const progressProgress = totalProgress > 0 ? (unlockedProgressCount / totalProgress) * 100 : 0;
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
          <div className="mb-16">
            <div className="flex flex-col gap-3 mb-8">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-inner">
                    <Crosshair className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-amber-400 leading-none mb-1">{TEXT_CONTENT.achievements.sections.creatures}</h2>
                    <span className="text-sm text-muted-foreground font-medium">Discover and collect mythological beasts</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="text-right hidden sm:block">
                    <div className="text-lg font-bold text-amber-500 leading-none">{unlockedCreaturesCount} <span className="text-sm text-muted-foreground font-normal">/ {totalCreatures}</span></div>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-4 transition-colors"
                    onClick={() => setShowAllUnlocked((prev) => !prev)}
                  >
                    {showAllUnlocked ? TEXT_CONTENT.achievements.ui.hideUnlocked : TEXT_CONTENT.achievements.ui.showUnlocked}
                  </button>
                </div>
              </div>
              <Progress value={creatureProgress} className="h-2.5 bg-secondary/30" indicatorClassName="bg-gradient-to-r from-amber-600 to-amber-400" />
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="creature-cards-grid">
              {creatures
                .filter(creature => parseInt(creature.id) < 107) // Exclude alliance achievements from creature grid
                .map(creature => {
                  if (!creature) return null;
                  const unlocked = isCreatureUnlocked(creature.id);
                  const isFlipped = flippedCardId === creature.id;

                  return (
                    <div
                      key={creature.id}
                      role="listitem"
                      aria-label={`${creature.name} - ${unlocked ? 'Unlocked' : 'Locked'}`}
                      className="relative h-[600px] w-full [perspective:1000px] group cursor-pointer"
                      onClick={() => unlocked && setFlippedCardId(isFlipped ? null : creature.id)}
                    >
                      <div className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                        {/* FRONT FACE */}
                        <Card className={`absolute inset-0 w-full h-full [backface-visibility:hidden] overflow-hidden border-2 flex flex-col transition-all duration-300 ${unlocked ? 'border-amber-500/30 shadow-2xl shadow-black/40 group-hover:border-amber-500/60 group-hover:scale-[1.02]' : 'border-dashed border-gray-800 bg-black/40 grayscale opacity-80'}`}>
                          <div className="relative w-full h-full">
                            <Image
                              src={unlocked ? creature.image : '/images/undiscovered.png'}
                              alt={creature.name}
                              fill
                              className={`object-cover ${!unlocked && 'opacity-20 blur-sm scale-90'}`}
                              key={unlocked ? 'unlocked' : 'locked'}
                            />
                            {/* Overlay for Name/Rewards */}
                            <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6 pt-32 text-center flex flex-col items-center transition-all duration-500 ${unlocked ? 'opacity-0 group-hover:opacity-100' : ''}`}>
                              {unlocked ? (
                                <>
                                  <Badge className="mb-3 bg-amber-500 text-black hover:bg-amber-400 font-bold border-none shadow-lg px-3 py-1">UNLOCKED</Badge>
                                  <h3 className="text-3xl font-black text-white uppercase tracking-wider mb-2 drop-shadow-md">{creature.name}</h3>
                                  <div className="flex items-center justify-center gap-4 text-xs font-mono text-amber-200/90 mt-1">
                                    <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> {creature.stats.type}</span>
                                    <span className="w-1 h-1 rounded-full bg-amber-500/50" />
                                    <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> DEF: {creature.stats.defense}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="mb-4 p-4 rounded-full bg-white/5 border border-white/10"><Crosshair className="w-8 h-8 text-gray-500" /></div>
                                  <h3 className="text-xl font-bold text-gray-500 uppercase tracking-widest mb-1">{creature.name}</h3>
                                  <p className="text-[10px] text-gray-600 font-mono uppercase tracking-[0.2em]">LOCKED CONTENT</p>
                                </>
                              )}
                            </div>
                          </div>
                        </Card>

                        {/* BACK FACE */}
                        {unlocked && (
                          <Card className="absolute inset-0 w-full h-full [transform:rotateY(180deg)] [backface-visibility:hidden] bg-slate-950 border-2 border-amber-500/50 overflow-hidden flex flex-col shadow-2xl">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-slate-950 to-slate-950" />

                            <div className="relative z-10 flex flex-col h-full p-8">
                              <div className="flex items-center justify-between mb-8 border-b border-amber-500/10 pb-6">
                                <h3 className="text-2xl font-black text-amber-500 uppercase">{creature.name}</h3>
                                <Badge variant="outline" className="text-amber-200 border-amber-500/30 px-3 py-1">{creature.stats.type}</Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-y-8 gap-x-6 mb-8">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Health</div>
                                  <div className="text-2xl font-mono text-white flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />{creature.stats.hp}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Attack</div>
                                  <div className="text-2xl font-mono text-white flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />{creature.stats.attack}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Defense</div>
                                  <div className="text-2xl font-mono text-white flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />{creature.stats.defense}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Speed</div>
                                  <div className="text-2xl font-mono text-white flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />{creature.stats.speed}</div>
                                </div>
                              </div>

                              <div className="bg-black/30 p-6 rounded-xl border border-white/5 mb-auto relative overflow-hidden">
                                <div className="absolute top-0 left-0 text-6xl text-white/5 font-serif transform -translate-x-2 -translate-y-4">“</div>
                                <p className="text-base text-gray-300 italic leading-relaxed relative z-10 font-serif text-center">
                                  {creature.description}
                                </p>
                              </div>

                              <div className="mt-8 pt-4 border-t border-white/5 text-center flex flex-col items-center gap-2">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Tap to flip back</p>
                              </div>
                            </div>
                          </Card>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Alliance Achievements Section */}
          {achievementDefinitions.length > 0 && (
            <div className="mb-16">
              <div className="flex flex-col gap-3 mb-8">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
                      <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-blue-400 leading-none mb-1">Alliance Achievements</h2>
                      <span className="text-sm text-muted-foreground font-medium">Build your guild and expand your influence</span>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-lg font-bold text-blue-500 leading-none">{unlockedAllianceCount} <span className="text-sm text-muted-foreground font-normal">/ {totalAlliance}</span></div>
                  </div>
                </div>
                <Progress value={allianceProgress} className="h-2.5 bg-secondary/30" indicatorClassName="bg-gradient-to-r from-blue-600 to-blue-400" />
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="alliance-achievement-cards-grid">
                {achievementDefinitions
                  .filter(achievement => {
                    const achievementId = parseInt(achievement.id);
                    return achievementId >= 107 && achievementId <= 112;
                  })
                  .map(achievement => {
                    if (!achievement) return null;
                    const unlocked = isUnlocked(achievement.id);
                    const isFlipped = flippedCardId === achievement.id;

                    return (
                      <div
                        key={achievement.id}
                        role="listitem"
                        aria-label={`${achievement.name} - ${unlocked ? 'Unlocked' : 'Locked'}`}
                        className="relative h-[600px] w-full [perspective:1000px] group cursor-pointer"
                        onClick={() => unlocked && setFlippedCardId(isFlipped ? null : achievement.id)}
                      >
                        <div className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                          {/* FRONT FACE */}
                          <Card className={`absolute inset-0 w-full h-full [backface-visibility:hidden] overflow-hidden border-2 flex flex-col transition-all duration-300 ${unlocked ? 'border-blue-500/30 shadow-2xl shadow-black/40 group-hover:border-blue-500/60 group-hover:scale-[1.02]' : 'border-dashed border-gray-800 bg-black/40 grayscale opacity-80'}`}>
                            <div className="relative w-full h-full">
                              <Image
                                src={unlocked ? achievement.image_url : '/images/undiscovered.png'}
                                alt={achievement.name}
                                fill
                                className={`object-cover ${!unlocked && 'opacity-20 blur-sm scale-90'}`}
                              />
                              <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6 pt-32 text-center flex flex-col items-center transition-all duration-500 ${unlocked ? 'opacity-0 group-hover:opacity-100' : ''}`}>
                                {unlocked ? (
                                  <>
                                    <Badge className="mb-3 bg-blue-500 text-white font-bold border-none shadow-lg px-3 py-1">UNLOCKED</Badge>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-3 drop-shadow-md">{achievement.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                      <Badge variant="secondary" className="bg-black/40 border border-amber-500/30 text-amber-400 flex items-center gap-1.5 px-2">
                                        <Zap className="w-3 h-3" /> +{achievement.xp_reward} XP
                                      </Badge>
                                      <Badge variant="secondary" className="bg-black/40 border border-yellow-500/30 text-yellow-400 flex items-center gap-1.5 px-2">
                                        <Coins className="w-3 h-3" /> +{achievement.gold_reward} G
                                      </Badge>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="mb-4 p-4 rounded-full bg-white/5 border border-white/10"><Users className="w-8 h-8 text-gray-500" /></div>
                                    <h3 className="text-xl font-bold text-gray-500 uppercase tracking-widest mb-1">{achievement.name}</h3>
                                    <p className="text-[10px] text-gray-600 font-mono uppercase tracking-[0.2em]">{achievement.unlock_condition}</p>
                                    <p className="text-[10px] text-red-900/40 font-mono uppercase tracking-[0.2em] mt-1">LOCKED</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </Card>

                          {/* BACK FACE */}
                          {unlocked && (
                            <Card className="absolute inset-0 w-full h-full [transform:rotateY(180deg)] [backface-visibility:hidden] bg-slate-950 border-2 border-blue-500/50 overflow-hidden flex flex-col shadow-2xl">
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950" />

                              <div className="relative z-10 flex flex-col h-full p-8">
                                <div className="flex items-center justify-between mb-8 border-b border-blue-500/10 pb-6">
                                  <h3 className="text-xl font-black text-blue-500 uppercase">{achievement.name}</h3>
                                  <Users className="w-5 h-5 text-blue-500/50" />
                                </div>

                                <div className="bg-white/5 p-6 rounded-xl border border-white/5 backdrop-blur-sm mb-6">
                                  <p className="text-sm font-semibold text-blue-200 uppercase tracking-widest mb-2">Condition Met</p>
                                  <p className="text-lg text-white font-medium">{achievement.unlock_condition}</p>
                                </div>

                                <div className="bg-black/30 p-6 rounded-xl border border-white/5 mb-auto relative overflow-hidden">
                                  <div className="absolute top-0 left-0 text-6xl text-white/5 font-serif transform -translate-x-2 -translate-y-4">“</div>
                                  <p className="text-base text-gray-300 italic leading-relaxed relative z-10 font-serif text-center">
                                    {achievement.description}
                                  </p>
                                </div>

                                <div className="mt-8 pt-4 border-t border-white/5 text-center flex flex-col items-center gap-2">
                                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Tap to flip back</p>
                                </div>
                              </div>
                            </Card>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* New Monster Achievements Section */}
          {achievementDefinitions.length > 0 && (
            <div className="mb-16">
              <div className="flex flex-col gap-3 mb-8">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 shadow-inner">
                      <Sword className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-red-400 leading-none mb-1">{TEXT_CONTENT.achievements.sections.monsterBattles}</h2>
                      <span className="text-sm text-muted-foreground font-medium">Prove your might in legendary combat</span>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-lg font-bold text-red-500 leading-none">{unlockedCombatCount} <span className="text-sm text-muted-foreground font-normal">/ {totalCombat}</span></div>
                  </div>
                </div>
                <Progress value={combatProgress} className="h-2.5 bg-secondary/30" indicatorClassName="bg-gradient-to-r from-red-600 to-red-400" />
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="achievement-cards-grid">
                {achievementDefinitions
                  .filter(achievement => {
                    const achievementId = parseInt(achievement.id);
                    return achievementId >= 201 && achievementId <= 206;
                  })
                  .map(achievement => {
                    if (!achievement) return null;
                    const unlocked = isUnlocked(achievement.id);
                    const isFlipped = flippedCardId === achievement.id;

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
                      <div
                        key={achievement.id}
                        role="listitem"
                        aria-label={`${monsterName} - ${unlocked ? 'Unlocked' : 'Locked'}`}
                        className="relative h-[600px] w-full [perspective:1000px] group cursor-pointer"
                        onClick={() => unlocked && setFlippedCardId(isFlipped ? null : achievement.id)}
                      >
                        <div className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                          {/* FRONT FACE */}
                          <Card className={`absolute inset-0 w-full h-full [backface-visibility:hidden] overflow-hidden border-2 flex flex-col transition-all duration-300 ${unlocked ? 'border-red-500/30 shadow-2xl shadow-black/40 group-hover:border-red-500/60 group-hover:scale-[1.02]' : 'border-dashed border-gray-800 bg-black/40 grayscale opacity-80'}`}>
                            <div className="relative w-full h-full">
                              <Image
                                src={unlocked ? achievement.image_url : '/images/undiscovered.png'}
                                alt={monsterName}
                                fill
                                className={`object-cover ${!unlocked && 'opacity-20 blur-sm scale-90'}`}
                              />
                              <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6 pt-32 text-center flex flex-col items-center transition-all duration-500 ${unlocked ? 'opacity-0 group-hover:opacity-100' : ''}`}>
                                {unlocked ? (
                                  <>
                                    <Badge className="mb-3 bg-red-500 text-white font-bold border-none shadow-lg px-3 py-1">UNLOCKED</Badge>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-3 drop-shadow-md">{monsterName}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                      <Badge variant="secondary" className="bg-black/40 border border-amber-500/30 text-amber-400 flex items-center gap-1.5 px-2">
                                        <Zap className="w-3 h-3" /> +{achievement.xp_reward} XP
                                      </Badge>
                                      <Badge variant="secondary" className="bg-black/40 border border-yellow-500/30 text-yellow-400 flex items-center gap-1.5 px-2">
                                        <Coins className="w-3 h-3" /> +{achievement.gold_reward} G
                                      </Badge>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="mb-4 p-4 rounded-full bg-white/5 border border-white/10"><Sword className="w-8 h-8 text-gray-500" /></div>
                                    <h3 className="text-xl font-bold text-gray-500 uppercase tracking-widest mb-1">{monsterName}</h3>
                                    <p className="text-[10px] text-gray-600 font-mono uppercase tracking-[0.2em]">DEFEAT TO UNLOCK</p>
                                    <p className="text-[10px] text-red-900/40 font-mono uppercase tracking-[0.2em] mt-1">LOCKED</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </Card>

                          {/* BACK FACE */}
                          {unlocked && (
                            <Card className="absolute inset-0 w-full h-full [transform:rotateY(180deg)] [backface-visibility:hidden] bg-slate-950 border-2 border-red-500/50 overflow-hidden flex flex-col shadow-2xl">
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-slate-950 to-slate-950" />

                              <div className="relative z-10 flex flex-col h-full p-8">
                                <div className="flex items-center justify-between mb-8 border-b border-red-500/10 pb-6">
                                  <h3 className="text-xl font-black text-red-500 uppercase">{monsterName}</h3>
                                  <Sword className="w-5 h-5 text-red-500/50" />
                                </div>

                                <div className="bg-white/5 p-6 rounded-xl border border-white/5 backdrop-blur-sm mb-6">
                                  <p className="text-sm font-semibold text-red-200 uppercase tracking-widest mb-2">Victory Condition</p>
                                  <p className="text-lg text-white font-medium">{achievement.unlock_condition}</p>
                                </div>

                                <div className="bg-black/30 p-6 rounded-xl border border-white/5 mb-auto relative overflow-hidden">
                                  <div className="absolute top-0 left-0 text-6xl text-white/5 font-serif transform -translate-x-2 -translate-y-4">“</div>
                                  <p className="text-base text-gray-300 italic leading-relaxed relative z-10 font-serif text-center">
                                    {achievement.description}
                                  </p>
                                </div>

                                <div className="mt-8 pt-4 border-t border-white/5 text-center flex flex-col items-center gap-2">
                                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Tap to flip back</p>
                                </div>
                              </div>
                            </Card>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Progress Achievements Section */}
          {progressAchievementsList.length > 0 && (
            <div className="mb-16">
              <div className="flex flex-col gap-3 mb-8">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                      <Trophy className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-emerald-400 leading-none mb-1">Progress Achievements</h2>
                      <span className="text-sm text-muted-foreground font-medium">Track your journey milestones</span>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-lg font-bold text-emerald-500 leading-none">{unlockedProgressCount} <span className="text-sm text-muted-foreground font-normal">/ {totalProgress}</span></div>
                  </div>
                </div>
                <Progress value={progressProgress} className="h-2.5 bg-secondary/30" indicatorClassName="bg-gradient-to-r from-emerald-600 to-emerald-400" />
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="progress-achievement-cards-grid">
                {progressAchievementsList.map(achievement => {
                  if (!achievement) return null;
                  const unlocked = isUnlocked(achievement.id);
                  const isFlipped = flippedCardId === achievement.id;

                  return (
                    <div
                      key={achievement.id}
                      role="listitem"
                      aria-label={`${achievement.name} - ${unlocked ? 'Unlocked' : 'Locked'}`}
                      className="relative h-[600px] w-full [perspective:1000px] group cursor-pointer"
                      onClick={() => unlocked && setFlippedCardId(isFlipped ? null : achievement.id)}
                    >
                      <div className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                        {/* FRONT FACE */}
                        <Card className={`absolute inset-0 w-full h-full [backface-visibility:hidden] overflow-hidden border-2 flex flex-col transition-all duration-300 ${unlocked ? 'border-emerald-500/30 shadow-2xl shadow-black/40 group-hover:border-emerald-500/60 group-hover:scale-[1.02]' : 'border-dashed border-gray-800 bg-black/40 grayscale opacity-80'}`}>
                          <div className="relative w-full h-full">
                            <Image
                              src={unlocked ? achievement.image_url : '/images/undiscovered.png'}
                              alt={achievement.name}
                              fill
                              className={`object-cover ${!unlocked && 'opacity-20 blur-sm scale-90'}`}
                            />
                            <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6 pt-32 text-center flex flex-col items-center transition-all duration-500 ${unlocked ? 'opacity-0 group-hover:opacity-100' : ''}`}>
                              {unlocked ? (
                                <>
                                  <Badge className="mb-3 bg-emerald-500 text-white font-bold border-none shadow-lg px-3 py-1">UNLOCKED</Badge>
                                  <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-3 drop-shadow-md">{achievement.name}</h3>
                                  <div className="flex items-center gap-3 mt-1">
                                    <Badge variant="secondary" className="bg-black/40 border border-amber-500/30 text-amber-400 flex items-center gap-1.5 px-2">
                                      <Zap className="w-3 h-3" /> +{achievement.xp_reward} XP
                                    </Badge>
                                    <Badge variant="secondary" className="bg-black/40 border border-yellow-500/30 text-yellow-400 flex items-center gap-1.5 px-2">
                                      <Coins className="w-3 h-3" /> +{achievement.gold_reward} G
                                    </Badge>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="mb-4 p-4 rounded-full bg-white/5 border border-white/10"><Trophy className="w-8 h-8 text-gray-500" /></div>
                                  <h3 className="text-xl font-bold text-gray-500 uppercase tracking-widest mb-1">{achievement.name}</h3>
                                  <p className="text-[10px] text-gray-600 font-mono uppercase tracking-[0.2em]">{achievement.unlock_condition}</p>
                                  <p className="text-[10px] text-red-900/40 font-mono uppercase tracking-[0.2em] mt-1">LOCKED</p>
                                </>
                              )}
                            </div>
                          </div>
                        </Card>

                        {/* BACK FACE */}
                        {unlocked && (
                          <Card className="absolute inset-0 w-full h-full [transform:rotateY(180deg)] [backface-visibility:hidden] bg-slate-950 border-2 border-emerald-500/50 overflow-hidden flex flex-col shadow-2xl">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-slate-950 to-slate-950" />

                            <div className="relative z-10 flex flex-col h-full p-8">
                              <div className="flex items-center justify-between mb-8 border-b border-emerald-500/10 pb-6">
                                <h3 className="text-xl font-black text-emerald-500 uppercase">{achievement.name}</h3>
                                <Trophy className="w-5 h-5 text-emerald-500/50" />
                              </div>

                              <div className="bg-white/5 p-6 rounded-xl border border-white/5 backdrop-blur-sm mb-6">
                                <p className="text-sm font-semibold text-emerald-200 uppercase tracking-widest mb-2">Milestone Reached</p>
                                <p className="text-lg text-white font-medium">{achievement.unlock_condition}</p>
                              </div>

                              <div className="bg-black/30 p-6 rounded-xl border border-white/5 mb-auto relative overflow-hidden">
                                <div className="absolute top-0 left-0 text-6xl text-white/5 font-serif transform -translate-x-2 -translate-y-4">&ldquo;</div>
                                <p className="text-base text-gray-300 italic leading-relaxed relative z-10 font-serif text-center">
                                  {achievement.description}
                                </p>
                              </div>

                              <div className="mt-8 pt-4 border-t border-white/5 text-center flex flex-col items-center gap-2">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Tap to flip back</p>
                              </div>
                            </div>
                          </Card>
                        )}
                      </div>
                    </div>
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