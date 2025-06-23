"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCreatureStore } from '@/stores/creatureStore'
import { CreatureCard } from '@/components/creature-card'
import Image from 'next/image'
import { HeaderSection } from '@/components/HeaderSection'
import { useUser } from '@clerk/nextjs'

interface DbAchievement {
  id: string;
  userId: string;
  achievementId: string; // This corresponds to the creature ID
  unlocked: boolean;
  unlockedAt: string;
}

export default function Page() {
  const { creatures } = useCreatureStore()
  const [unlockedAchievements, setUnlockedAchievements] = useState<Map<string, DbAchievement>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoaded: isAuthLoaded } = useUser();
  const userId = user?.id;
  const [showAllUnlocked, setShowAllUnlocked] = useState(false);

  // Fetch unlocked achievements from the API
  useEffect(() => {
    if (!isAuthLoaded || !userId) {
      // If auth is loaded but there's no user, we're not loading.
      if (isAuthLoaded) setIsLoading(false);
      return;
    };
    
    const fetchAchievements = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/achievements');
        if (response.ok) {
          const data: DbAchievement[] = await response.json();
          const achievementMap = new Map(data.map(ach => [ach.achievementId, ach]));
          setUnlockedAchievements(achievementMap);
        } else {
          // Handle non-ok responses if needed
          console.error('Failed to fetch achievements with status:', response.status);
          setUnlockedAchievements(new Map()); // Clear previous data on error
        }
      } catch (error) {
        console.error('An error occurred while fetching achievements:', error);
        setUnlockedAchievements(new Map()); // Clear previous data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
  }, [isAuthLoaded, userId]);
  
  const isUnlocked = (creatureId: string) => {
    if (showAllUnlocked) return true;
    return unlockedAchievements.has(creatureId);
  }

  const getUnlockDate = (creatureId: string) => {
    const achievement = unlockedAchievements.get(creatureId);
    return achievement ? new Date(achievement.unlockedAt).toLocaleDateString() : null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>Loading achievements...</p>
      </div>
    );
  }

  return (
    <>
      <HeaderSection
        title="Creature Collection"
        imageSrc="/images/achievements-header.jpg"
        canEdit={true}
      />
      <main className="container mx-auto p-6" aria-label="achievements-section">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="creature-cards-grid">
          {creatures.map(creature => {
            const unlocked = isUnlocked(creature.id);
            const unlockDate = getUnlockDate(creature.id);

            return (
              <Card
                key={creature.id}
                className={`medieval-card flex flex-col items-center justify-center min-h-[420px] p-4 shadow-lg border-2 rounded-xl transition-all duration-300 ${unlocked ? 'border-amber-500 bg-gray-800' : 'border-gray-700 bg-gray-900 opacity-70'}`}
                aria-label={`creature-card-${creature.id}`}
              >
                <CardHeader className="w-full flex flex-col items-center text-center">
                  <CardTitle className="font-serif text-2xl text-amber-400">{creature.name}</CardTitle>
                  {!unlocked && (
                    <Badge variant="secondary" className="mt-2" aria-label={`creature-${creature.id}-undiscovered-badge`}>
                      Undiscovered
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col items-center w-full">
                  <div className="relative w-full aspect-[5/7] mb-4 flex items-center justify-center">
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
                  {unlocked && unlockDate && (
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
    </>
  );
}