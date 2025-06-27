"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Sword, Brain, Crown, Castle, Hammer, Heart, Plus, Trash2, Trophy, Sun, PersonStanding, Pencil } from 'lucide-react'
import { HeaderSection } from '@/components/HeaderSection'
import { useUser } from '@clerk/nextjs'
import { Milestones } from '@/components/milestones'
import { updateCharacterStats, getCharacterStats } from '@/lib/character-stats-manager'
import { toast } from '@/components/ui/use-toast'

interface Quest {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: number;
  rewards: string;
  completed: boolean;
  date?: Date;
  isNew: boolean;
  completionId?: string;
}

const categoryIcons = {
  might: Sword,
  knowledge: Brain,
  honor: Crown,
  castle: Castle,
  craft: Hammer,
  vitality: Heart,
  wellness: Sun,
  exploration: PersonStanding,
};

const categoryLabels = {
  might: 'Might',
  knowledge: 'Knowledge', 
  honor: 'Honor',
  castle: 'Castle',
  craft: 'Craft',
  vitality: 'Vitality',
  wellness: 'Wellness',
  exploration: 'Exploration',
};

const defaultQuestCategories = ['might', 'knowledge', 'honor', 'castle', 'craft', 'vitality', 'wellness', 'exploration'];

export default function QuestsPage() {
  const { user, isLoaded: isAuthLoaded } = useUser();
  const userId = user?.id;
  const isGuest = !user;

  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>(defaultQuestCategories);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [activeTab, setActiveTab] = useState(allCategories[0] || 'might');

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
          const data: Quest[] = await response.json();
          setQuests(data);
          
          const uniqueCategories = [...new Set(data.map(q => q.category))];
          const combined = [...new Set([...defaultQuestCategories, ...uniqueCategories])];
          setAllCategories(combined);

        } catch (err: any) {
          setError('Failed to load quest data from server.');
          console.error(err);
          setQuests([]);
        }
      } else {
        setQuests([]);
      }
      setLoading(false);
    };

    loadQuests();
  }, [isAuthLoaded, userId, isGuest]);

  // Daily reset logic for non-milestone quests
  useEffect(() => {
    if (!loading && quests.length > 0) {
      const lastReset = localStorage.getItem('last-quest-reset-date');
      const today = new Date().toISOString().slice(0, 10);
      if (lastReset !== today) {
        // Reset all non-milestone quests
        setQuests(prev => prev.map(q =>
          q.category !== 'milestones' ? { ...q, completed: false } : q
        ));
        localStorage.setItem('last-quest-reset-date', today);
        toast({
          title: 'Daily Reset',
          description: 'Your daily quests have been reset! Time to build new habits.',
        });
      }
    }
  }, [loading, quests.length]);

  const handleQuestToggle = async (questName: string, currentCompleted: boolean) => {
    if (!userId) return;

    // Find the quest and parse rewards
    const quest = quests.find(q => q.name === questName);
    const rewards = quest && quest.rewards ? JSON.parse(quest.rewards) : { xp: 0, gold: 0 };
    const xpDelta = rewards.xp || 0;
    const goldDelta = rewards.gold || 0;

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
        q.name === questName ? { ...q, completed: !currentCompleted, date: new Date() } : q
      ));

      // Update character stats and fire events
      const stats = getCharacterStats();
      let newXP = stats.experience;
      let newGold = stats.gold;
      if (!currentCompleted) {
        newXP += xpDelta;
        newGold += goldDelta;
      } else {
        newXP = Math.max(0, newXP - xpDelta);
        newGold = Math.max(0, newGold - goldDelta);
      }
      updateCharacterStats({ experience: newXP, gold: newGold });
      // Fire kingdom events for live updates
      if (!currentCompleted) {
        window.dispatchEvent(new CustomEvent('kingdom:goldGained', { detail: goldDelta }));
        window.dispatchEvent(new CustomEvent('kingdom:experienceGained', { detail: xpDelta }));
      } else {
        window.dispatchEvent(new CustomEvent('kingdom:goldGained', { detail: -goldDelta }));
        window.dispatchEvent(new CustomEvent('kingdom:experienceGained', { detail: -xpDelta }));
      }
    } catch (err) {
      setError("Failed to sync quest progress.");
      console.error(err);
    }
  };
  
  if (loading) {
    return <div className="text-center p-8">Loading Quests...</div>;
  }

  const questsByCategory = quests.reduce((acc, quest) => {
    (acc[quest.category] = acc[quest.category] || []).push(quest);
    return acc;
  }, {} as Record<string, Quest[]>);

  const getCategoryIcon = (category: string) => {
    return categoryIcons[category as keyof typeof categoryIcons] || Trophy;
  }

  const getCategoryLabel = (category: string) => {
    return categoryLabels[category as keyof typeof categoryLabels] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  // Handler to open the edit modal with quest data
  const handleEditQuest = (quest: Quest) => {
    setEditingQuest(quest);
    setEditModalOpen(true);
  };

  // Handler to close the modal
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingQuest(null);
  };

  // Handler to submit the edited quest (for now, just closes the modal)
  const handleEditQuestSubmit = (updatedQuest: Quest) => {
    // TODO: Implement update logic (API call, state update)
    setEditModalOpen(false);
    setEditingQuest(null);
  };

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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Mobile Dropdown */}
          <div className="block md:hidden mb-4">
            <label htmlFor="quest-category-select" className="sr-only">Select quest category</label>
            <select
              id="quest-category-select"
              className="w-full rounded border p-2 bg-black text-white"
              aria-label="Quest category dropdown"
              value={activeTab}
              onChange={e => setActiveTab(e.target.value)}
            >
              {allCategories.map(category => (
                <option key={category} value={category}>{getCategoryLabel(category)}</option>
              ))}
              <option value="milestones">Milestones</option>
            </select>
          </div>
          {/* Desktop Tabs */}
          <TabsList className="hidden md:grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8" aria-label="Quest categories tab list">
            {allCategories.map(category => {
              const Icon = getCategoryIcon(category);
              return (
                <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {getCategoryLabel(category)}
                </TabsTrigger>
              )
            })}
            <TabsTrigger value="milestones" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Milestones
            </TabsTrigger>
          </TabsList>

          {allCategories.map(category => {
            const categoryQuests = questsByCategory[category] || [];
            const CategoryIcon = getCategoryIcon(category);
            const categoryColor = {
              might: 'text-red-500 border-red-800',
              knowledge: 'text-blue-500 border-blue-800',
              honor: 'text-yellow-500 border-yellow-800',
              castle: 'text-purple-500 border-purple-800',
              craft: 'text-amber-500 border-amber-800',
              vitality: 'text-green-500 border-green-800',
            }[category] || 'text-amber-500 border-amber-800';
            return (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {categoryQuests.map((quest) => {
                    const rewards = quest.rewards ? JSON.parse(quest.rewards) : { xp: 0, gold: 0 };
                    return (
                      <Card
                        key={quest.id}
                        className={`flex flex-col border-2 ${categoryColor} ${quest.completed ? 'bg-green-900/30' : 'bg-black/30'} shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500`}
                        aria-label={`${quest.name}-quest-card`}
                        tabIndex={0}
                        role="button"
                        aria-pressed={quest.completed}
                        onClick={e => {
                          if ((e.target as HTMLElement).closest('[data-delete-button],[data-edit-button]')) return;
                          handleQuestToggle(quest.name, quest.completed);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleQuestToggle(quest.name, quest.completed);
                          }
                        }}
                      >
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full p-2 bg-black/40 border ${categoryColor}`} aria-label={`${category}-icon`}>
                              <CategoryIcon className={`w-6 h-6 ${categoryColor}`} />
                            </span>
                            <CardTitle className="text-lg font-semibold text-amber-300">{quest.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-6 h-6 text-gray-500 hover:text-amber-500"
                              aria-label={`edit-${quest.name}-quest`}
                              data-edit-button
                              onClick={e => {
                                e.stopPropagation();
                                handleEditQuest(quest);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Checkbox
                              checked={quest.completed}
                              onCheckedChange={() => handleQuestToggle(quest.name, quest.completed)}
                              className="border-amber-400 data-[state=checked]:bg-amber-500 scale-125"
                              aria-label={`complete-${quest.name}-quest`}
                              tabIndex={-1}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <CardDescription className="mb-4 text-gray-400">
                            {quest.description}
                          </CardDescription>
                          <Progress value={quest.completed ? 100 : 5} className="w-full h-2 bg-gray-700" />
                        </CardContent>
                        <CardFooter className="flex justify-between items-center text-xs text-gray-500 pt-2">
                          <div className="flex items-center gap-2">
                            <span>XP: {rewards.xp}</span>
                            <span>Gold: {rewards.gold}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="w-6 h-6 text-gray-500 hover:text-red-500" aria-label={`delete-${quest.name}-quest`} data-delete-button>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                  <Card className="border-2 border-dashed border-gray-700 hover:border-amber-500 transition-colors cursor-pointer flex items-center justify-center min-h-[160px]">
                    <div className="text-center text-gray-500">
                      <Plus className="w-8 h-8 mx-auto mb-2" />
                      <p>Add Custom Quest</p>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            )
          })}

          <TabsContent value="milestones" className="space-y-4">
            <Milestones />
          </TabsContent>
        </Tabs>
      </div>
      {/* Edit Quest Modal (simple version) */}
      {editModalOpen && editingQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseEditModal} />
          <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Edit Quest</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                // For now, just close the modal
                handleEditQuestSubmit(editingQuest);
              }}
            >
              <label className="block mb-2 text-sm font-medium">Name</label>
              <input
                className="w-full mb-4 p-2 border rounded"
                value={editingQuest.name}
                onChange={e => setEditingQuest({ ...editingQuest, name: e.target.value })}
                placeholder="Quest name"
                title="Quest name"
                aria-label="Quest name"
              />
              <label className="block mb-2 text-sm font-medium">Description</label>
              <textarea
                className="w-full mb-4 p-2 border rounded"
                value={editingQuest.description}
                onChange={e => setEditingQuest({ ...editingQuest, description: e.target.value })}
                placeholder="Quest description"
                title="Quest description"
                aria-label="Quest description"
              />
              {/* Add more fields as needed */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={handleCloseEditModal}>Cancel</Button>
                <Button type="submit" variant="default">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}