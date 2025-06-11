"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { Sword, Brain, Crown, Castle, Hammer, Heart, PlusCircle, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuestService } from '@/lib/quest-service'
import { useSupabaseClientWithToken } from '@/lib/hooks/use-supabase-client'
import { useUser } from "@clerk/nextjs"
import { defaultQuests } from '@/lib/quest-sample-data'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from "@clerk/nextjs"
import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/types/supabase"
import { useToast } from "@/components/ui/use-toast"

interface Milestone {
  id: string;
  name: string;
  category: string;
  icon: string;
  experience: number;
  gold: number;
  frequency: string;
  progress: number;
  target: number;
  completed: boolean;
}

const milestoneCategories = [
  { key: 'might', label: 'Might', icon: Sword, iconClass: 'text-red-500' },
  { key: 'knowledge', label: 'Knowledge', icon: Brain, iconClass: 'text-blue-500' },
  { key: 'honor', label: 'Honor', icon: Crown, iconClass: 'text-yellow-500' },
  { key: 'castle', label: 'Castle', icon: Castle, iconClass: 'text-purple-500' },
  { key: 'craft', label: 'Craft', icon: Hammer, iconClass: 'text-amber-500' },
  { key: 'vitality', label: 'Vitality', icon: Heart, iconClass: 'text-green-500' },
];

const defaultMilestoneCards: Record<string, { title: string; description: string }> = {
  might: { title: '500 Push Ups in One Day', description: 'Complete 500 push ups in a single day' },
  knowledge: { title: 'Read 5 Books in a Month', description: 'Complete reading 5 books in one month' },
  honor: { title: 'Wake Up Before 6AM for 30 Days', description: 'Wake up before 6AM for 30 consecutive days' },
  castle: { title: 'Clean the Entire House in a Day', description: 'Do a full house cleaning in one day' },
  craft: { title: 'Complete a 30-Day Drawing Challenge', description: 'Draw something every day for 30 days' },
  vitality: { title: 'Run a Marathon', description: 'Complete a full marathon (42km) in one go' },
};

export function Milestones() {
  const { userId } = useAuth();
  const { supabase, isLoading: isSupabaseLoading, error: supabaseError } = useSupabaseClientWithToken();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newQuestCategory, setNewQuestCategory] = useState<string>("");
  const [newMilestone, setNewMilestone] = useState<{
    name: string;
    icon: string;
    experience: number;
    gold: number;
    target: number;
  }>({
    name: "",
    icon: "🎯",
    experience: 500,
    gold: 250,
    target: 1,
  });
  const { toast } = useToast();
  const [checkedMilestones, setCheckedMilestones] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('checked-milestones') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!userId || !supabase || isSupabaseLoading) {
      console.log('Waiting for auth and Supabase client...');
      return;
    }

    if (supabaseError) {
      console.error('Supabase client error:', supabaseError);
      toast({
        title: 'Error',
        description: 'Failed to initialize database connection. Please try again.',
        variant: 'destructive'
      });
      return;
    }

    const fetchMilestones = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching milestones...');
        // Get all milestones for the user
        if (!supabase) return;
        const data = await QuestService.getQuests(supabase as SupabaseClient<Database>, userId, { category: newQuestCategory });
        console.log('Fetched milestones:', data);
        // If none exist for this category, insert a default one
        if ((data.length === 0) && newQuestCategory) {
          // Find a random quest from this category
          const categoryQuests = defaultQuests.filter(q => q.category === newQuestCategory);
          if (categoryQuests.length > 0) {
            const randomQuest = categoryQuests[Math.floor(Math.random() * categoryQuests.length)];
            if (randomQuest) {
              try {
                if (!supabase) return;
                // Insert as a milestone (make it bigger: multiply xp/gold/target)
                const newMilestoneQuest = await QuestService.createQuest(supabase as SupabaseClient<Database>, {
                  title: `Milestone: ${randomQuest.title}`,
                  description: randomQuest.description || `Milestone based on quest: ${randomQuest.title}`,
                  category: newQuestCategory,
                  difficulty: 'hard',
                  rewards: { xp: randomQuest.rewards.xp * 5, gold: randomQuest.rewards.gold * 5, items: [] },
                  progress: 0,
                  completed: false,
                  deadline: '',
                  isNew: true,
                  isAI: false,
                  userId
                });
                if (newMilestoneQuest) {
                  setMilestones([{
                    id: newMilestoneQuest.id,
                    name: newMilestoneQuest.title,
                    category: newMilestoneQuest.category,
                    icon: '🎯',
                    experience: newMilestoneQuest.rewards.xp,
                    gold: newMilestoneQuest.rewards.gold,
                    frequency: 'once',
                    progress: 0,
                    target: 10,
                    completed: false
                  }]);
                  return;
                }
              } catch (err) {
                console.error('Failed to create default milestone:', err);
                toast({
                  title: 'Error',
                  description: 'Failed to create default milestone. Please try again.',
                  variant: 'destructive'
                });
              }
            }
          }
        }
        setMilestones(data.map(q => ({
          id: q.id,
          name: q.title,
          category: q.category,
          icon: '🎯',
          experience: q.rewards.xp,
          gold: q.rewards.gold,
          frequency: 'once',
          progress: q.progress,
          target: 1,
          completed: q.completed
        })));
      } catch (err) {
        console.error('Failed to fetch milestones:', err);
        toast({
          title: 'Error',
          description: 'Failed to load milestones. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchMilestones();
  }, [userId, supabase, isSupabaseLoading, supabaseError, newQuestCategory, toast]);

  // When milestones are loaded, sync checkedMilestones with completed milestones
  useEffect(() => {
    if (milestones && milestones.length > 0) {
      const completedIds = milestones.filter(m => m.completed).map(m => m.id);
      setCheckedMilestones(completedIds);
      localStorage.setItem('checked-milestones', JSON.stringify(completedIds));
    }
  }, [milestones]);

  // When checkedMilestones changes, update localStorage
  useEffect(() => {
    localStorage.setItem('checked-milestones', JSON.stringify(checkedMilestones));
  }, [checkedMilestones]);

  const handleAddMilestone = async () => {
    if (!userId || !newMilestone.name || !newQuestCategory || !supabase) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    try {
      if (!supabase) return;
      const newQuest = await QuestService.createQuest(supabase as SupabaseClient<Database>, {
        title: newMilestone.name,
        description: "",
        category: newQuestCategory,
        difficulty: "medium",
        rewards: { xp: newMilestone.experience, gold: newMilestone.gold, items: [] },
        progress: 0,
        completed: false,
        deadline: "",
        isNew: true,
        isAI: false,
        userId
      });
      if (newQuest) {
        setMilestones(prev => [...prev, {
          id: newQuest.id,
          name: newQuest.title,
          category: newQuest.category,
          icon: newMilestone.icon,
          experience: newQuest.rewards.xp,
          gold: newQuest.rewards.gold,
          frequency: "once",
          progress: 0,
          target: newMilestone.target,
          completed: false
        }]);
        setNewMilestone({
          name: "",
          icon: "🎯",
          experience: 500,
          gold: 250,
          target: 1,
        });
        setIsDialogOpen(false);
        setNewQuestCategory("");
        toast({
          title: "Milestone Added",
          description: "Your new milestone has been added successfully!",
        });
      }
    } catch (err) {
      console.error('Failed to add milestone:', err);
      toast({
        title: "Error",
        description: "Failed to add milestone. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!userId || !supabase) {
      toast({
        title: "Error",
        description: "Database connection not available",
        variant: "destructive",
      });
      return;
    }
    try {
      if (!supabase) return;
      await QuestService.deleteQuest(supabase as SupabaseClient<Database>, id);
      setMilestones(prev => prev.filter(m => m.id !== id));
      toast({
        title: "Milestone Deleted",
        description: "The milestone has been removed.",
      });
    } catch (err) {
      console.error('Failed to delete milestone:', err);
      toast({
        title: "Error",
        description: "Failed to delete milestone. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Update milestone completion and checkedMilestones together
  const handleToggleCompletion = async (id: string, completed: boolean) => {
    // Check if the id is a valid database id (UUID or cuid)
    const isDbId = /^[a-z0-9]{20,}$|^[0-9a-fA-F-]{36}$/.test(id);
    if (!isDbId) {
      setMilestones(prev => prev.map(m =>
        m.id === id ? { ...m, completed: !m.completed, progress: !m.completed ? 100 : 0 } : m
      ));
      toast({
        title: !completed ? "Milestone Completed" : "Milestone Uncompleted",
        description: !completed ? "Great job completing this milestone!" : "Milestone marked as incomplete.",
      });
      setCheckedMilestones(prev =>
        !completed
          ? [...prev, id]
          : prev.filter(mid => mid !== id)
      );
      return;
    }
    if (!userId || !supabase) {
      toast({
        title: "Error",
        description: "Database connection not available",
        variant: "destructive",
      });
      return;
    }
    try {
      if (!supabase) return;
      const updatedQuest = await QuestService.toggleQuestCompletion(supabase as SupabaseClient<Database>, id, completed);
      setMilestones(prev => prev.map(m => 
        m.id === id ? { ...m, completed: updatedQuest.completed } : m
      ));
      toast({
        title: updatedQuest.completed ? "Milestone Completed" : "Milestone Uncompleted",
        description: updatedQuest.completed ? "Great job completing this milestone!" : "Milestone marked as incomplete.",
      });
      setCheckedMilestones(prev =>
        !updatedQuest.completed
          ? [...prev, id]
          : prev.filter(mid => mid !== id)
      );
    } catch (err) {
      console.error('Failed to toggle milestone completion:', err);
      toast({
        title: "Error",
        description: "Failed to update milestone status. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      {milestoneCategories.map(category => (
        <div key={category.key}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <category.icon className={`h-5 w-5 ${category.iconClass}`} />
              <h3 className="text-lg font-semibold">{category.label}</h3>
            </div>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {/* Default Milestone Card - now interactive */}
            {(() => {
              // Check if user already has a milestone for this category
              const userMilestone = milestones.find(m => m.category === category.key);
              if (!userMilestone) {
                // Render an interactive default card
                const defaultCard = defaultMilestoneCards[category.key];
                if (!defaultCard) return null;
                // Fake milestone object for UI
                const fakeMilestone = {
                  id: `default-${category.key}`,
                  name: defaultCard.title,
                  category: category.key,
                  icon: '🎯',
                  experience: 500,
                  gold: 250,
                  frequency: 'once',
                  progress: 0,
                  target: 1,
                  completed: false,
                };
                // Handler to "adopt" the default card as a real milestone
                const adoptDefaultMilestone = async (action: 'toggle' | 'delete') => {
                  if (!userId) return;
                  // If Supabase is not ready, just update local state
                  if (!supabase || isSupabaseLoading) {
                    setMilestones(prev => [
                      ...prev,
                      {
                        ...fakeMilestone,
                        id: `local-${category.key}`,
                        completed: action === 'toggle',
                      },
                    ]);
                    toast({
                      title: action === 'toggle' ? 'Milestone Checked Off (Local Only)' : 'Milestone Deleted (Local Only)',
                      description: action === 'toggle'
                        ? 'This milestone was checked off locally and will sync when online.'
                        : 'This milestone was deleted locally.',
                    });
                    setCheckedMilestones(prev =>
                      action === 'toggle'
                        ? [...prev, `local-${category.key}`]
                        : prev.filter(mid => mid !== `local-${category.key}`)
                    );
                    return;
                  }
                  try {
                    // Create the milestone in Supabase
                    const newQuest = await QuestService.createQuest(supabase as SupabaseClient<Database>, {
                      title: fakeMilestone.name,
                      description: defaultCard.description,
                      category: fakeMilestone.category,
                      difficulty: 'hard',
                      rewards: { xp: fakeMilestone.experience, gold: fakeMilestone.gold, items: [] },
                      progress: 0,
                      completed: action === 'toggle',
                      deadline: '',
                      isNew: true,
                      isAI: false,
                      userId
                    });

                    if (!newQuest) {
                      throw new Error('Failed to create milestone');
                    }

                    // Add to local state
                    setMilestones(prev => [...prev, {
                      ...fakeMilestone,
                      id: newQuest.id,
                      completed: action === 'toggle',
                    }]);

                    // If delete, immediately delete after creation
                    if (action === 'delete') {
                      await QuestService.deleteQuest(supabase as SupabaseClient<Database>, newQuest.id);
                      setMilestones(prev => prev.filter(m => m.id !== newQuest.id));
                    }

                    toast({
                      title: action === 'toggle' ? 'Milestone Created' : 'Milestone Deleted',
                      description: action === 'toggle' ? 'Your milestone has been created and marked as complete!' : 'The milestone has been removed.',
                    });

                    setCheckedMilestones(prev =>
                      action === 'toggle'
                        ? [...prev, newQuest.id]
                        : prev.filter(mid => mid !== newQuest.id)
                    );
                  } catch (err) {
                    console.error('Failed to update milestone:', err);
                    toast({
                      title: 'Error',
                      description: 'Failed to update milestone. Please try again.',
                      variant: 'destructive',
                    });
                  }
                };
                return (
                  <Card
                    className="bg-black/80 border-amber-800/50 cursor-pointer"
                    tabIndex={0}
                    role="region"
                    aria-label={`${fakeMilestone.name} milestone card`}
                    onClick={() => adoptDefaultMilestone('toggle')}
                    onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); adoptDefaultMilestone('toggle'); } }}
                  >
                    <CardHeader>
                      <CardTitle className="text-amber-500 flex items-center justify-between">
                        <span>{fakeMilestone.name}</span>
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => adoptDefaultMilestone('toggle')}
                          aria-label={`Mark ${fakeMilestone.name} as complete`}
                          className="h-5 w-5 border-2 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500 mt-1"
                          tabIndex={-1}
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                        />
                      </CardTitle>
                      <CardDescription>{defaultCard.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <Progress value={0} className="h-1.5" aria-label={`Milestone progress: 0%`} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-red-500"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); adoptDefaultMilestone('delete'); }}
                          aria-label={`Delete ${fakeMilestone.name} milestone`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return null;
            })()}
            {/* User-created Milestone Cards */}
            {milestones
              .filter((milestone) => milestone.category === category.key)
              .map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onDelete={handleDeleteMilestone}
                  onUpdateProgress={handleToggleCompletion}
                />
              ))}
            {/* Add Milestone Card */}
            <Card 
              className="relative bg-gradient-to-b from-black to-gray-900 border-amber-800/20 p-3 min-h-[140px] flex flex-col justify-between cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`${category.key}-add-milestone-card`}
              onClick={() => {
                setNewQuestCategory(category.key)
                setIsDialogOpen(true)
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setNewQuestCategory(category.key); setIsDialogOpen(true); } }}
            >
              <div className="flex justify-center items-center h-full">
                <PlusCircle className="h-8 w-8 text-amber-500" />
              </div>
            </Card>
          </div>
        </div>
      ))}

      {/* Add Milestone Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Milestone</DialogTitle>
            <DialogDescription>Create a new milestone for your journey</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Milestone Name</Label>
              <Input
                id="name"
                value={newMilestone.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                placeholder="Enter milestone name"
              />
            </div>
            <div>
              <Label htmlFor="experience">Experience Points</Label>
              <Input
                id="experience"
                type="number"
                value={newMilestone.experience}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMilestone({ ...newMilestone, experience: Number(e.target.value) })}
                placeholder="Enter experience points"
              />
            </div>
            <div>
              <Label htmlFor="gold">Gold</Label>
              <Input
                id="gold"
                type="number"
                value={newMilestone.gold}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMilestone({ ...newMilestone, gold: Number(e.target.value) })}
                placeholder="Enter gold amount"
              />
            </div>
            <div>
              <Label htmlFor="target">Target</Label>
              <Input
                id="target"
                type="number"
                value={newMilestone.target}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMilestone({ ...newMilestone, target: Number(e.target.value) })}
                placeholder="Enter target value"
              />
            </div>
            <Button onClick={handleAddMilestone}>Add Milestone</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MilestoneCard({ milestone, onDelete, onUpdateProgress }: { milestone: Milestone; onDelete: (id: string) => void; onUpdateProgress: (id: string, completed: boolean) => void; }) {
  const { user } = useUser();
  const { supabase } = useSupabaseClientWithToken();
  const [completed, setCompleted] = useState(milestone.completed);
  const [isUpdating, setIsUpdating] = useState(false);

  // Handler for card click (toggles completion)
  const handleCardClick = async (e: React.MouseEvent) => {
    // Prevent toggling if clicking on the checkbox directly
    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
    await toggleCompletion();
  };

  const toggleCompletion = async () => {
    if (!user?.id || !supabase || isUpdating) return;
    
    setIsUpdating(true);
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('quests')
        .update({ completed: !completed })
        .eq('id', milestone.id);

      if (error) throw error;

      setCompleted(!completed);
      toast({
        title: !completed ? 'Milestone Completed' : 'Milestone Uncompleted',
        description: !completed ? 'Great job completing this milestone!' : 'Milestone marked as incomplete.',
      });
    } catch (err) {
      console.error('Failed to toggle milestone completion:', err);
      toast({
        title: 'Error',
        description: 'Failed to update milestone status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card
      className={`bg-black/80 border-amber-800/50 cursor-pointer ${completed ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}
      onClick={handleCardClick}
      tabIndex={0}
      role="region"
      aria-label={`${milestone.name} milestone card`}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCompletion(); } }}
    >
      <CardHeader>
        <CardTitle className="text-amber-500 flex items-center justify-between">
          <span>{milestone.name}</span>
          <Checkbox
            checked={completed}
            onCheckedChange={toggleCompletion}
            aria-label={`Mark ${milestone.name} as ${completed ? 'incomplete' : 'complete'}`}
            className="h-5 w-5 border-2 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500 mt-1"
            tabIndex={-1}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
            disabled={isUpdating}
          />
        </CardTitle>
        <CardDescription>{milestone.icon} {milestone.experience} XP, {milestone.gold} Gold</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <Progress value={milestone.progress} className="h-1.5" aria-label={`Milestone progress: ${milestone.progress}%`} />
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-red-500"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDelete(milestone.id); }}
            aria-label={`Delete ${milestone.name} milestone`}
            disabled={isUpdating}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 