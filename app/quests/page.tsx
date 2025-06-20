"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { X, Trophy } from 'lucide-react'
import { HeaderSection } from '@/components/HeaderSection'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useUser } from '@clerk/nextjs'
import { withToken } from '@/lib/supabase/client'
import { Quest } from '@/lib/quest-types'

// You would ideally move these to their own files, but since I can't create them,
// they are here for now.
const defaultQuests: Quest[] = [
  {
    id: 'might-1',
    title: 'First Steps of Power',
    description: 'Complete 1 workout session.',
    category: 'might',
    difficulty: 'easy',
    rewards: { xp: 50, gold: 10 },
    completed: false, progress: 0, userId: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
    {
    id: 'knowledge-1',
    title: 'A Spark of Wisdom',
    description: 'Read one chapter of a book.',
    category: 'knowledge',
    difficulty: 'easy',
    rewards: { xp: 50, gold: 10 },
    completed: false, progress: 0, userId: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
];

async function fetchQuests(supabase: any) {
    const { data, error } = await supabase.from('quests').select('*');
    if (error) {
        console.error("Error fetching quests, returning default.", error);
        return defaultQuests;
    }
    return data.map((q: any) => ({ ...q, id: q.id.toString() }));
}

async function fetchCheckedQuests(supabase: any, userId: string) {
    const { data, error } = await supabase.from('checked_quests').select('quest_id').eq('user_id', userId);
    if (error) {
        console.error("Error fetching checked quests:", error);
        return [];
    }
    return data.map((item: any) => item.quest_id);
}

async function updateCheckedQuest(supabase: any, userId: string, questId: string, isCompleted: boolean) {
    if (isCompleted) {
        await supabase.from('checked_quests').upsert({ user_id: userId, quest_id: questId });
    } else {
        await supabase.from('checked_quests').delete().match({ user_id: userId, quest_id: questId });
    }
}


export default function QuestsPage() {
  const { user, isLoaded: isAuthLoaded } = useUser();
  const userId = user?.id;
  const isGuest = !user;
  const { supabase, getToken, isLoading: isSupabaseLoading } = useSupabase();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [checkedQuests, setCheckedQuests] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!isAuthLoaded || isSupabaseLoading || !supabase) return;
      setLoading(true);

      if (!isGuest && userId) {
        try {
          const [questsData, checkedData] = await withToken(supabase, getToken, async (client) => {
            return Promise.all([
              fetchQuests(client),
              fetchCheckedQuests(client, userId)
            ]);
          });
          setQuests(questsData);
          setCheckedQuests(new Set(checkedData));
        } catch (err: any) {
          setError('Failed to load quest data from server.');
          console.error(err);
        }
      } else {
        setQuests(defaultQuests);
      }
      setLoading(false);
    };

    loadData();
  }, [isAuthLoaded, isSupabaseLoading, supabase, userId, isGuest, getToken]);

  const handleQuestToggle = async (questId: string) => {
    if (!supabase || !userId) return;

    const isNowCompleted = !checkedQuests.has(questId);
    const newChecked = new Set(checkedQuests);
    if (isNowCompleted) newChecked.add(questId);
    else newChecked.delete(questId);
    setCheckedQuests(newChecked);

    try {
        await withToken(supabase, getToken, (client) =>
          updateCheckedQuest(client, userId, questId, isNowCompleted)
        );
    } catch(e) {
        setError("Failed to sync quest progress.");
        // revert
        const revertedChecked = new Set(checkedQuests);
        if(isNowCompleted) revertedChecked.delete(questId);
        else revertedChecked.add(questId);
        setCheckedQuests(revertedChecked);
    }
  };
  
  const categories = Array.from(new Set(quests.map(q => q.category)));

  if (loading) {
    return <div className="text-center p-8">Loading Quests...</div>;
  }

  return (
    <div className="h-full">
      <HeaderSection
          title="Quest Log"
          subtitle="Embark on epic journeys and complete tasks to earn rewards."
          imageSrc="/images/quests-header.jpg"
          defaultBgColor="bg-amber-900"
        />
        <div className="p-4 md:p-8">
          {error && <p className="text-red-500 bg-red-900/20 p-4 rounded-md mb-4">{error}</p>}
           <Tabs defaultValue={categories[0] || 'might'} className="space-y-4">
            <TabsList>
              {categories.map(category => (
                <TabsTrigger key={category} value={category} className="capitalize">{category}</TabsTrigger>
              ))}
            </TabsList>
            {categories.map(category => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {quests.filter(q => q.category === category).map(quest => (
                    <Card key={quest.id} className="cursor-pointer" onClick={() => handleQuestToggle(quest.id)}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            {quest.title}
                            <Checkbox checked={checkedQuests.has(quest.id)} className="ml-4" />
                        </CardTitle>
                        <CardDescription>{quest.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
    </div>
  )
}