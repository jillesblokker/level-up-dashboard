"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ReplayabilityManager, Achievement } from "@/lib/replayability"
import { useCreatureStore } from '@/stores/creatureStore'
import { CreatureCard } from '@/components/creature-card'
import Image from 'next/image'
import { HeaderSection } from '@/components/HeaderSection'
import { useSupabaseClientWithToken } from '@/lib/hooks/use-supabase-client'
import { useUser } from '@clerk/nextjs'

export default function Page() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const { creatures, isCreatureDiscovered } = useCreatureStore()
  const [showAllDiscovered, setShowAllDiscovered] = useState(false)
  const undiscoveredImg = '/images/undiscovered.png'
  const supabase = useSupabaseClientWithToken();
  const { user } = useUser();
  const userId = user?.id;
  const [milestoneCount, setMilestoneCount] = useState(0);

  useEffect(() => {
    const loadAchievements = () => {
      const items = ReplayabilityManager.getInstance().getAchievements()
      setAchievements(items)
    }
    loadAchievements()
    const handleAchievementUpdate = () => loadAchievements()
    window.addEventListener("achievement-update", handleAchievementUpdate)
    return () => {
      window.removeEventListener("achievement-update", handleAchievementUpdate)
    }
  }, [])

  useEffect(() => {
    // Fetch completed milestone count from Supabase
    if (!userId || !supabase) return;
    const fetchMilestoneCount = async () => {
      // Milestones are quests with categories: might, knowledge, honor, castle, craft, vitality
      const milestoneCategories = ['might', 'knowledge', 'honor', 'castle', 'craft', 'vitality'];
      const { data, error } = await supabase
        .from('quests')
        .select('id, completed, category')
        .eq('userId', userId)
        .in('category', milestoneCategories);
      if (!error && data) {
        setMilestoneCount(data.filter((m: any) => m.completed).length);
      } else {
        setMilestoneCount(0);
      }
    };
    fetchMilestoneCount();
  }, [userId, supabase]);

  // Custom discovery logic for milestone creatures
  const isDiscovered = (id: string) => {
    if (showAllDiscovered) return true;
    if (id === '104') return milestoneCount >= 1;
    if (id === '105') return milestoneCount >= 5;
    if (id === '106') return milestoneCount >= 10;
    return isCreatureDiscovered(id);
  }

  return (
    <>
      <HeaderSection
        title="Creature Collection"
        imageSrc="/images/achievements-header.jpg"
        canEdit={true}
      />
      <main className="container mx-auto p-6" aria-label="achievements-section">
        <div className="flex items-center justify-center mb-6">
          <button
            className="w-full max-w-xs bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white rounded-lg py-3 text-lg font-semibold shadow transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            aria-label={showAllDiscovered ? "Show only real discovered cards" : "Show all cards as discovered"}
            onClick={() => setShowAllDiscovered(v => !v)}
          >
            {showAllDiscovered ? "Show Real Progress" : "Show All Discovered"}
          </button>
        </div>
        {/* First card centered with invisible cards for grid alignment */}
        {creatures.length > 0 && creatures[0] && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="invisible" />
            <Card
              key={creatures[0]!.id}
              className={
                'medieval-card flex flex-col items-center justify-center min-h-[420px] p-4 shadow-md border border-amber-800 bg-background ' +
                (!isDiscovered(creatures[0]!.id) ? 'opacity-60' : '')
              }
              aria-label={`creature-card-${creatures[0]!.id}`}
            >
              <CardHeader className="w-full flex flex-col items-center">
                <div className="flex justify-between items-center w-full">
                  <CardTitle className="font-serif text-2xl">{creatures[0]!.name}</CardTitle>
                  {!isDiscovered(creatures[0]!.id) && (
                    <Badge variant="secondary" aria-label={`creature-${creatures[0]!.id}-undiscovered-badge`}>
                      Undiscovered
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center w-full">
                <div className="relative w-full aspect-[5/7] mb-2 flex items-center justify-center">
                  {isDiscovered(creatures[0]!.id) ? (
                    <div className="absolute inset-0">
                      <CreatureCard
                        creature={creatures[0]!}
                        discovered={isDiscovered(creatures[0]!.id)}
                        showCard={true}
                        previewMode={false}
                      />
                    </div>
                  ) : (
                    <Image src={undiscoveredImg} alt="Undiscovered Card" fill sizes="(max-width: 768px) 100vw, 340px" className="object-cover rounded-lg opacity-80" />
                  )}
                </div>
                {achievements.find(a => a.id === creatures[0]!.id)?.isUnlocked && (
                  <div className="mt-2 text-base text-gray-500">
                    <span>Points: {achievements.find(a => a.id === creatures[0]!.id)?.points}</span><br />
                    {achievements.find(a => a.id === creatures[0]!.id)?.unlockDate && <span>Unlocked on {new Date(achievements.find(a => a.id === creatures[0]!.id)?.unlockDate!).toLocaleDateString()}</span>}
                  </div>
                )}
                {isDiscovered(creatures[0]!.id) && creatures[0]!.requirement && (
                  <div className="mt-4 text-base text-gray-700" aria-label={`creature-card-${creatures[0]!.id}-requirement`}>
                    <span>Requirement: {creatures[0]!.requirement}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="invisible" />
          </div>
        )}
        {/* Grid of remaining cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="cards-grid">
          {creatures.slice(1).map(creature => {
            const achievement = achievements.find(a => a.id === creature.id)
            const discovered = isDiscovered(creature.id)
            return (
              <Card
                key={creature.id}
                className={
                  'medieval-card flex flex-col items-center justify-center min-h-[420px] p-4 shadow-md border border-amber-800 bg-background ' +
                  (!discovered ? 'opacity-60' : '')
                }
                aria-label={`creature-card-${creature.id}`}
              >
                <CardHeader className="w-full flex flex-col items-center">
                  <div className="flex justify-between items-center w-full">
                    <CardTitle className="font-serif text-2xl">{creature.name}</CardTitle>
                    {!discovered && (
                      <Badge variant="secondary" aria-label={`creature-${creature.id}-undiscovered-badge`}>
                        Undiscovered
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center w-full">
                  <div className="relative w-full aspect-[5/7] mb-2 flex items-center justify-center">
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
                  {achievement?.isUnlocked && (
                    <div className="mt-2 text-base text-gray-500">
                      <span>Points: {achievement.points}</span><br />
                      {achievement.unlockDate && <span>Unlocked on {new Date(achievement.unlockDate).toLocaleDateString()}</span>}
                    </div>
                  )}
                  {discovered && creature.requirement && (
                    <div className="mt-4 text-base text-gray-700" aria-label={`creature-card-${creature.id}-requirement`}>
                      <span>Requirement: {creature.requirement}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </>
  )
}