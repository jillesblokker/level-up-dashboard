"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { X, Trophy, Sword, Brain, Crown, Castle, Hammer, Heart } from 'lucide-react'
import { HeaderSection } from '@/components/HeaderSection'
import { useUser } from '@clerk/nextjs'
import { Milestones } from '@/components/milestones'

interface QuestResponse {
  name: string;
  category: string;
  completed: boolean;
  date: Date;
}

// Default quests for all 6 categories
const defaultQuests = [
  // Might
  { name: 'First Steps of Power', description: 'Complete 1 workout session.', category: 'might', icon: Sword },
  { name: 'Strength Training', description: 'Complete 3 workout sessions this week.', category: 'might', icon: Sword },
  { name: 'Push-up Challenge', description: 'Do 50 push-ups in one session.', category: 'might', icon: Sword },
  
  // Knowledge
  { name: 'A Spark of Wisdom', description: 'Read one chapter of a book.', category: 'knowledge', icon: Brain },
  { name: 'Knowledge Seeker', description: 'Read 3 chapters this week.', category: 'knowledge', icon: Brain },
  { name: 'Vitamin D', description: 'Learn something new about health.', category: 'knowledge', icon: Brain },
  { name: 'Study Session', description: 'Complete a focused study session.', category: 'knowledge', icon: Brain },
  
  // Honor
  { name: 'Honor Among Thieves', description: 'Help someone in need today.', category: 'honor', icon: Crown },
  { name: 'Wake Up Before 10', description: 'Start your day early and honorably.', category: 'honor', icon: Crown },
  { name: 'Toothbrushing', description: 'Maintain personal hygiene.', category: 'honor', icon: Crown },
  
  // Castle
  { name: 'Castle Foundations', description: 'Organize your workspace.', category: 'castle', icon: Castle },
  { name: 'Clean the Entire House', description: 'Do a full house cleaning in one day.', category: 'castle', icon: Castle },
  { name: 'Build a Foundation', description: 'Create a solid foundation for your goals.', category: 'castle', icon: Castle },
  
  // Craft
  { name: 'Craft Mastery', description: 'Learn a new skill or hobby.', category: 'craft', icon: Hammer },
  { name: 'Complete a 30-Day Drawing Challenge', description: 'Draw something every day for 30 days.', category: 'craft', icon: Hammer },
  { name: 'Craft a Simple Tool', description: 'Create something useful with your hands.', category: 'craft', icon: Hammer },
  
  // Vitality
  { name: 'Vitality Boost', description: 'Take a 30-minute walk.', category: 'vitality', icon: Heart },
  { name: 'Run a Marathon', description: 'Complete a full marathon (42km) in one go.', category: 'vitality', icon: Heart },
  { name: 'Get a Good Night\'s Sleep', description: 'Ensure 8 hours of quality sleep.', category: 'vitality', icon: Heart },
];

const categoryIcons = {
  might: Sword,
  knowledge: Brain,
  honor: Crown,
  castle: Castle,
  craft: Hammer,
  vitality: Heart,
};

const categoryLabels = {
  might: 'Might',
  knowledge: 'Knowledge', 
  honor: 'Honor',
  castle: 'Castle',
  craft: 'Craft',
  vitality: 'Vitality',
};

export default function QuestsPage() {
  const { user, isLoaded: isAuthLoaded } = useUser();
  const userId = user?.id;
  const isGuest = !user;

  const [quests, setQuests] = useState<QuestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuests = async () => {
      if (!isAuthLoaded) return;
      setLoading(true);

      if (!isGuest && userId) {
        try {
          const response = await fetch('/api/quests');
          if (!response.ok) {
            throw new Error('Failed to fetch quests');
          }
          const data = await response.json();
          setQuests(data);
        } catch (err: any) {
          setError('Failed to load quest data from server.');
          console.error(err);
          // Fallback to default quests
          setQuests([]);
        }
      } else {
        setQuests([]);
      }
      setLoading(false);
    };

    loadQuests();
  }, [isAuthLoaded, userId, isGuest]);

  const handleQuestToggle = async (questName: string, currentCompleted: boolean) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/quests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questName,
          completed: !currentCompleted,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quest');
      }

      // Update local state
      setQuests(prev => prev.map(q => 
        q.name === questName ? { ...q, completed: !currentCompleted } : q
      ));
    } catch (err) {
      setError("Failed to sync quest progress.");
      console.error(err);
    }
  };

  const createQuest = async (name: string, category: string) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          category,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create quest');
      }

      const newQuest = await response.json();
      setQuests(prev => [...prev, newQuest]);
    } catch (err) {
      setError("Failed to create quest.");
      console.error(err);
    }
  };

  const categories = ['might', 'knowledge', 'honor', 'castle', 'craft', 'vitality'];

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
        
        <Tabs defaultValue="milestones" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="milestones" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Milestones
            </TabsTrigger>
            {categories.map(category => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons];
              return (
                <TabsTrigger key={category} value={category} className="flex items-center gap-2 capitalize">
                  <Icon className="w-4 h-4" />
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="milestones" className="space-y-4">
            <Milestones />
          </TabsContent>

          {categories.map(category => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold capitalize">{categoryLabels[category as keyof typeof categoryLabels]} Quests</h3>
                <Button 
                  onClick={() => {
                    const categoryQuests = defaultQuests.filter(q => q.category === category);
                    if (categoryQuests.length > 0) {
                      const randomQuest = categoryQuests[Math.floor(Math.random() * categoryQuests.length)];
                      if (randomQuest) {
                        createQuest(randomQuest.name, category);
                      }
                    }
                  }}
                  size="sm"
                >
                  Add Random Quest
                </Button>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Show existing quests for this category */}
                {quests.filter(q => q.category === category).map(quest => (
                  <Card key={quest.name} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-sm">{quest.name}</span>
                        <Checkbox 
                          checked={quest.completed} 
                          onCheckedChange={() => handleQuestToggle(quest.name, quest.completed)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </CardTitle>
                      <CardDescription>
                        {defaultQuests.find(dq => dq.name === quest.name)?.description || 'Complete this quest to earn rewards!'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress value={quest.completed ? 100 : 0} className="w-full" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {quest.completed ? 'Completed!' : 'In Progress'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Show default quests that haven't been created yet */}
                {defaultQuests
                  .filter(q => q.category === category)
                  .filter(q => !quests.some(existing => existing.name === q.name))
                  .map(quest => (
                    <Card key={quest.name} className="cursor-pointer hover:shadow-lg transition-shadow border-dashed">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <quest.icon className="w-4 h-4" />
                          <span className="text-sm">{quest.name}</span>
                        </CardTitle>
                        <CardDescription>{quest.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={() => createQuest(quest.name, quest.category)}
                          size="sm"
                          className="w-full"
                        >
                          Start Quest
                        </Button>
                      </CardContent>
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