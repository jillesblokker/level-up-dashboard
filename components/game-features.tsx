'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Achievement, 
  Challenge, 
  Collectible, 
  LeaderboardEntry,
  replayability 
} from '@/lib/replayability';
import { animations } from '@/lib/animations';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreatureCard } from '@/components/creature-card';
import { useCreatureStore } from '@/stores/creatureStore';
import Image from 'next/image';

export function GameFeatures() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams && searchParams.get('tab')) || 'achievements';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({});
  const { creatures, isCreatureDiscovered } = useCreatureStore();
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [challengesError, setChallengesError] = useState<string | null>(null);
  const [leaderboardsLoading, setLeaderboardsLoading] = useState(true);
  const [leaderboardsError, setLeaderboardsError] = useState<string | null>(null);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [achievementsError, setAchievementsError] = useState<string | null>(null);
  const dataLoadedRef = useRef(false);
  const undiscoveredImg = '/images/undiscovered.png';

  useEffect(() => {
    console.debug('[GameFeatures] mount');
    if (dataLoadedRef.current) return;
    
    const loadData = async () => {
      try {
        // Load achievements
        setAchievementsLoading(true);
        const loadedAchievements = await replayability.getAchievements();
        setAchievements(loadedAchievements);
        setAchievementsLoading(false);

        // Load challenges
        setChallengesLoading(true);
        const loadedChallenges = await replayability.getChallenges();
        setChallenges(loadedChallenges);
        setChallengesLoading(false);

        // Load leaderboards
        setLeaderboardsLoading(true);
        const categories = ['quests', 'achievements', 'collectibles', 'challenges'];
        const leaderboardData: Record<string, LeaderboardEntry[]> = {};
        for (const category of categories) {
          leaderboardData[category] = await replayability.getLeaderboard(category);
        }
        setLeaderboards(leaderboardData);
        setLeaderboardsLoading(false);

        dataLoadedRef.current = true;
        console.debug('[GameFeatures] Data loaded', {
          achievements: loadedAchievements,
          challenges: loadedChallenges,
          leaderboards: leaderboardData,
        });
      } catch (error) {
        console.error('Error loading game data:', error);
        setAchievementsError('Failed to load achievements');
        setChallengesError('Failed to load challenges');
        setLeaderboardsError('Failed to load leaderboards');
        setAchievementsLoading(false);
        setChallengesLoading(false);
        setLeaderboardsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    console.debug('[GameFeatures] activeTab changed:', activeTab);
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Animate tab change
    const tabContent = document.getElementById(`${value}-content`);
    if (tabContent) {
      animations.animate(tabContent, {
        type: 'fade',
        duration: 300,
        timing: 'ease-out'
      });
    }
    // Update URL query param for deep linking
    const params = new URLSearchParams(window.location.search);
    params.set('tab', value);
    router.replace(`/game-center?${params.toString()}`);
  };

  // Card 000 rendering as a variable, not an IIFE
  const card000 = creatures.find(c => c.id === '000');
  const achievement000 = achievements.find(a => a.id === '000');
  const discovered000 = isCreatureDiscovered('000');
  const card000Node = card000 ? (
    <div className="flex justify-center mb-8">
      <Card className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto p-6 shadow-lg border-2 border-amber-800 bg-background flex flex-col items-center justify-center" aria-label="special-card">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <CardTitle className="text-4xl font-serif">Creature 000</CardTitle>
            {!discovered000 && (
              <Badge variant="secondary" aria-label="undiscovered-badge">Undiscovered</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center w-full">
          <div className="relative w-full max-w-[340px] aspect-[5/7] mb-4 flex items-center justify-center">
            {discovered000 ? (
              <div className="absolute inset-0">
                <CreatureCard 
                  creature={card000} 
                  discovered={discovered000}
                  showCard={true}
                  previewMode={false}
                />
              </div>
            ) : (
              <Image src={undiscoveredImg} alt="Undiscovered Card" fill className="object-cover rounded-lg opacity-80" />
            )}
          </div>
          {discovered000 && card000.requirement && (
            <div className="mt-4 text-lg text-gray-700" aria-label="special-card-requirement">
              <span>Requirement: {card000.requirement}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  ) : null;

  return (
    <main className="container mx-auto p-6" aria-label="achievements-section">
      <h1 className="text-3xl font-bold mb-6">Achievements</h1>
      <div className="mb-6">
        {achievementsLoading ? (
          <div className="text-center text-gray-500">Loading achievements...</div>
        ) : achievementsError ? (
          <div className="text-center text-red-500">{achievementsError}</div>
        ) : achievements.length === 0 ? (
          <div className="text-center text-gray-500">No achievements or cards available.</div>
        ) : (
          <>
            {card000Node}
            {/* Grid of remaining cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 p-6" aria-label="cards-grid">
              {creatures
                .filter(c => c.id !== '000')
                .slice()
                .sort((a, b) => Number(!isCreatureDiscovered(a.id)) - Number(!isCreatureDiscovered(b.id)))
                .map(creature => {
                  const achievement = achievements.find(a => a.id === creature.id);
                  const discovered = isCreatureDiscovered(creature.id);
                  return (
                    <Card 
                      key={creature.id}
                      className={
                        'flex flex-col items-center justify-center min-h-[420px] p-4 shadow-md border border-amber-800 bg-background ' +
                        (!discovered ? 'opacity-60' : '')
                      }
                      aria-label={`creature-card-${creature.id}`}
                    >
                      <CardHeader className="w-full flex flex-col items-center">
                        <div className="flex justify-between items-center w-full">
                          <CardTitle className="font-serif text-2xl">Creature {creature.id}</CardTitle>
                          {!discovered && (
                            <Badge variant="secondary" aria-label={`creature-${creature.id}-undiscovered-badge`}>
                              Undiscovered
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center w-full">
                        <div className="relative w-full max-w-[340px] aspect-[5/7] mb-2 flex items-center justify-center">
                          {discovered ? (
                            <div className="absolute inset-0">
                              <CreatureCard 
                                creature={creature}
                                discovered={discovered}
                                showCard={true}
                                previewMode={false}
                              />
                            </div>
                          ) : (
                            <Image src={undiscoveredImg} alt="Undiscovered Card" fill sizes="(max-width: 768px) 100vw, 340px" className="object-cover rounded-lg opacity-80" />
                          )}
                        </div>
                        {/* Show achievement points and unlock date if available */}
                        {achievement?.isUnlocked && (
                          <div className="mt-2 text-base text-gray-500">
                            <span>Points: {achievement.points}</span><br />
                            {achievement.unlockDate && <span>Unlocked on {new Date(achievement.unlockDate).toLocaleDateString()}</span>}
                          </div>
                        )}
                        {/* Show requirement only for discovered cards */}
                        {discovered && creature.requirement && (
                          <div className="mt-4 text-base text-gray-700" aria-label={`creature-card-${creature.id}-requirement`}>
                            <span>Requirement: {creature.requirement}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </main>
  );
} 