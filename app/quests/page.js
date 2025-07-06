"use client";
import { useEffect, useState } from 'react';
import CardWithProgress from '../../components/quest-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Milestones } from '../../components/milestones';
import RiddleChallenge from '../../components/riddle-challenge';
import DungeonChallenge from '../../components/dungeon-challenge';

export default function QuestsPage() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = "user_2z5XXhrBfLdbU0P6AUCBco0CJWC"; // Use your actual userId

  useEffect(() => {
    async function fetchQuests() {
      try {
        const response = await fetch(`/api/quests-static?userId=${userId}`);
        const data = await response.json();
        setQuests(data.quests || data || []);
      } catch (error) {
        console.error('Error fetching quests:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuests();
  }, []);

  return (
    <div className="quests-container">
      <h1>Quests</h1>
      <Tabs defaultValue="quests" className="w-full">
        <TabsList aria-label="quest-tabs" className="mb-4">
          <TabsTrigger value="quests" aria-label="quests-tab">Quests</TabsTrigger>
          <TabsTrigger value="challenges" aria-label="challenges-tab">Challenges</TabsTrigger>
          <TabsTrigger value="milestones" aria-label="milestones-tab">Milestones</TabsTrigger>
        </TabsList>
        <TabsContent value="quests">
          {loading ? (
            <p>Loading quests...</p>
          ) : (
            <div className="quests-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quests.map(quest => (
                <CardWithProgress
                  key={quest.id}
                  title={quest.title || quest.name}
                  description={quest.description}
                  completed={quest.completed}
                  onToggle={() => {
                    setQuests(prevQuests => prevQuests.map(q =>
                      q.id === quest.id ? { ...q, completed: !q.completed } : q
                    ));
                  }}
                  xp={quest.xp_reward || quest.points || quest.xp}
                  gold={quest.gold_reward || quest.gold}
                  // Add more props as needed
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="challenges">
          <div className="space-y-6">
            <RiddleChallenge />
            <DungeonChallenge />
          </div>
        </TabsContent>
        <TabsContent value="milestones">
          <Milestones />
        </TabsContent>
      </Tabs>
    </div>
  );
} 