"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { Sword, Brain, Crown, Castle, Hammer, Heart, PlusCircle, Trash2, Pencil } from "lucide-react"
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useUser } from "@clerk/nextjs"
import { defaultQuests } from '@/lib/quest-sample-data'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from "@clerk/nextjs"
import { useToast } from "@/components/ui/use-toast"
import { storageService } from '@/lib/storage-service'
import { Quest } from '@/lib/quest-types'
import { updateCharacterStats, getCharacterStats } from '@/lib/character-stats-manager'

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

interface QuestResponse {
  name: string;
  category: string;
  completed: boolean;
  date: Date;
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
  might:    { title: '300 Pushups in One Day', description: 'Complete 300 pushups in a single day' },
  knowledge:{ title: '365 Days of Spanish', description: 'Practice Spanish every day for a year' },
  honor:    { title: 'Wake Up Before 6AM for 100 Days', description: 'Wake up before 6AM for 100 consecutive days' },
  castle:   { title: 'Host 50 Dinners for Friends', description: 'Host 50 dinners or gatherings at your home' },
  craft:    { title: 'Complete a 365-Day Drawing Challenge', description: 'Draw something every day for a year' },
  vitality: { title: 'Plank 3:00', description: 'Hold a plank for 3 minutes straight' },
};

export function Milestones() {
  const { userId } = useAuth();
  const { supabase, getToken, isLoading: isSupabaseLoading } = useSupabase();
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
    return storageService.get<string[]>('checked-milestones', []);
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    if (!userId || !supabase || isSupabaseLoading) {
      console.log('Waiting for auth and Supabase client...');
      return;
    }

    const fetchMilestones = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching milestones...');
        
        // Fetch quests from the API
        const response = await fetch('/api/quests');
        if (!response.ok) {
          throw new Error('Failed to fetch quests');
        }
        
        const questData: QuestResponse[] = await response.json();
        console.log('Fetched quests:', questData);
        
        // Filter quests by category if specified
        const filteredQuests = newQuestCategory 
          ? questData.filter(q => q.category === newQuestCategory)
          : questData;
        
        // If none exist for this category, create a default one
        if (filteredQuests.length === 0 && newQuestCategory) {
          const categoryQuests = defaultQuests.filter((q: Quest) => q.category === newQuestCategory);
          if (categoryQuests.length > 0) {
            const randomQuest = categoryQuests[Math.floor(Math.random() * categoryQuests.length)];
            if (randomQuest) {
              try {
                // Create a new quest completion
                const createResponse = await fetch('/api/quests', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    name: `Milestone: ${randomQuest.title}`,
                    category: newQuestCategory,
                  }),
                });
                
                if (createResponse.ok) {
                  const newQuest = await createResponse.json();
                  setMilestones([{
                    id: newQuest.name, // Use name as ID since that's what we have
                    name: newQuest.name,
                    category: newQuest.category,
                    icon: '🎯',
                    experience: 500, // Default milestone rewards
                    gold: 250,
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
        
        setMilestones(filteredQuests.map(q => ({
          id: q.name, // Use name as ID
          name: q.name,
          category: q.category,
          icon: '🎯',
          experience: 500, // Default milestone rewards
          gold: 250,
          frequency: 'once',
          progress: q.completed ? 100 : 0,
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
  }, [userId, supabase, isSupabaseLoading, newQuestCategory, toast]);

  // When milestones are loaded, sync checkedMilestones with completed milestones
  useEffect(() => {
    if (milestones && milestones.length > 0) {
      const completedIds = milestones.filter(m => m.completed).map(m => m.id);
      setCheckedMilestones(completedIds);
      storageService.set('checked-milestones', completedIds);
    }
  }, [milestones]);

  // When checkedMilestones changes, update localStorage
  useEffect(() => {
    storageService.set('checked-milestones', checkedMilestones);
  }, [checkedMilestones]);

  const handleAddMilestone = async () => {
    if (!userId || !newMilestone.name || !newQuestCategory) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newMilestone.name,
          category: newQuestCategory,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create milestone');
      }
      
      const newQuest = await response.json();
      
      const milestone: Milestone = {
        id: newQuest.name,
        name: newQuest.name,
        category: newQuest.category,
        icon: newMilestone.icon,
        experience: newMilestone.experience,
        gold: newMilestone.gold,
        frequency: 'once',
        progress: 0,
        target: newMilestone.target,
        completed: false
      };
      
      setMilestones(prev => [...prev, milestone]);
      setNewMilestone({
        name: "",
        icon: "🎯",
        experience: 500,
        gold: 250,
        target: 1,
      });
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Milestone created successfully!",
      });
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast({
        title: "Error",
        description: "Failed to create milestone. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    try {
      // Find the milestone to get its name
      const milestone = milestones.find(m => m.id === id);
      if (!milestone) return;
      
      // Note: The current API doesn't support deletion, so we'll just remove from local state
      // In a real implementation, you'd want to add a DELETE endpoint
      setMilestones(prev => prev.filter(m => m.id !== id));
      
      toast({
        title: "Success",
        description: "Milestone removed successfully!",
      });
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast({
        title: "Error",
        description: "Failed to delete milestone. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleCompletion = async (id: string, completed: boolean) => {
    try {
      // Find the milestone to get its name
      const milestone = milestones.find(m => m.id === id);
      if (!milestone) return;
      
      const response = await fetch('/api/quests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questName: milestone.name,
          completed: completed,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update milestone');
      }
      
      setMilestones(prev => prev.map(m => 
        m.id === id 
          ? { ...m, completed, progress: completed ? 100 : 0 }
          : m
      ));
      
      // Update checked milestones
      if (completed) {
        setCheckedMilestones(prev => [...prev, id]);
      } else {
        setCheckedMilestones(prev => prev.filter(mId => mId !== id));
      }
      
      toast({
        title: "Success",
        description: completed ? "Milestone completed!" : "Milestone unchecked!",
      });
    } catch (error) {
      console.error('Error toggling milestone completion:', error);
      toast({
        title: "Error",
        description: "Failed to update milestone. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handler to open the edit modal with milestone data
  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setEditModalOpen(true);
  };

  // Handler to close the modal
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingMilestone(null);
  };

  // Handler to submit the edited milestone (for now, just closes the modal)
  const handleEditMilestoneSubmit = (updatedMilestone: Milestone) => {
    // TODO: Implement update logic (API call, state update)
    setEditModalOpen(false);
    setEditingMilestone(null);
  };

  return (
    <div className="space-y-8">
      {milestoneCategories.map(category => {
        const defaultCard = defaultMilestoneCards[category.key];
        if (!defaultCard) return null;
        return (
          <div key={category.key}>
            <div className="flex items-center gap-2 mb-4">
              <category.icon className={`h-5 w-5 ${category.iconClass}`} />
              <h3 className="text-lg font-semibold">{category.label}</h3>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <Card className="flex flex-col border-2 border-amber-800 bg-black/30 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full p-2 bg-black/40 border border-amber-800" aria-label={`${category.label}-icon`}>
                      <category.icon className={`w-6 h-6 ${category.iconClass}`} />
                    </span>
                    <CardTitle className="text-lg font-semibold text-amber-300">{defaultCard.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="mb-4 text-gray-400">
                    {defaultCard.description}
                  </CardDescription>
                  <Progress value={0} className="w-full h-2 bg-gray-700" />
                </CardContent>
                <CardFooter className="flex justify-between items-center text-xs text-gray-500 pt-2">
                  <div className="flex items-center gap-2">
                    <span>XP: 500</span>
                    <span>Gold: 250</span>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        );
      })}

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

      {/* Edit Milestone Modal (simple version) */}
      {editModalOpen && editingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseEditModal} />
          <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Edit Milestone</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                // For now, just close the modal
                handleEditMilestoneSubmit(editingMilestone);
              }}
            >
              <label className="block mb-2 text-sm font-medium">Name</label>
              <input
                className="w-full mb-4 p-2 border rounded"
                value={editingMilestone.name}
                onChange={e => setEditingMilestone({ ...editingMilestone, name: e.target.value })}
                placeholder="Milestone name"
                title="Milestone name"
                aria-label="Milestone name"
              />
              <label className="block mb-2 text-sm font-medium">Experience</label>
              <input
                className="w-full mb-4 p-2 border rounded"
                type="number"
                value={editingMilestone.experience}
                onChange={e => setEditingMilestone({ ...editingMilestone, experience: Number(e.target.value) })}
                placeholder="Experience points"
                title="Experience points"
                aria-label="Experience points"
              />
              <label className="block mb-2 text-sm font-medium">Gold</label>
              <input
                className="w-full mb-4 p-2 border rounded"
                type="number"
                value={editingMilestone.gold}
                onChange={e => setEditingMilestone({ ...editingMilestone, gold: Number(e.target.value) })}
                placeholder="Gold amount"
                title="Gold amount"
                aria-label="Gold amount"
              />
              <label className="block mb-2 text-sm font-medium">Target</label>
              <input
                className="w-full mb-4 p-2 border rounded"
                type="number"
                value={editingMilestone.target}
                onChange={e => setEditingMilestone({ ...editingMilestone, target: Number(e.target.value) })}
                placeholder="Target value"
                title="Target value"
                aria-label="Target value"
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

function MilestoneCard({ milestone, onDelete, onUpdateProgress, onEdit }: { milestone: Milestone; onDelete: (id: string) => void; onUpdateProgress: (id: string, completed: boolean) => void; onEdit: (milestone: Milestone) => void; }) {
  const { user } = useUser();
  const { supabase } = useSupabase();
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
      const response = await fetch('/api/quests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questName: milestone.name,
          completed: !completed,
        }),
      });

      if (!response.ok) throw new Error('Failed to update milestone');

      setCompleted(!completed);
      toast({
        title: !completed ? 'Milestone Completed' : 'Milestone Uncompleted',
        description: !completed ? 'Great job completing this milestone!' : 'Milestone marked as incomplete.',
      });

      // Live update character stats and fire events
      const stats = getCharacterStats();
      let newXP = stats.experience;
      let newGold = stats.gold;
      const xpDelta = milestone.experience || 0;
      const goldDelta = milestone.gold || 0;
      if (!completed) {
        newXP += xpDelta;
        newGold += goldDelta;
      } else {
        newXP = Math.max(0, newXP - xpDelta);
        newGold = Math.max(0, newGold - goldDelta);
      }
      updateCharacterStats({ experience: newXP, gold: newGold });
      if (!completed) {
        window.dispatchEvent(new CustomEvent('kingdom:goldGained', { detail: goldDelta }));
        window.dispatchEvent(new CustomEvent('kingdom:experienceGained', { detail: xpDelta }));
      } else {
        window.dispatchEvent(new CustomEvent('kingdom:goldGained', { detail: -goldDelta }));
        window.dispatchEvent(new CustomEvent('kingdom:experienceGained', { detail: -xpDelta }));
      }
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-gray-500 hover:text-amber-500"
              aria-label={`edit-${milestone.name}-milestone`}
              data-edit-button
              onClick={e => {
                e.stopPropagation();
                onEdit(milestone);
              }}
              tabIndex={-1}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Checkbox
              checked={completed}
              onCheckedChange={toggleCompletion}
              aria-label={`Mark ${milestone.name} as ${completed ? 'incomplete' : 'complete'}`}
              className="h-5 w-5 border-2 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500 mt-1"
              tabIndex={-1}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
              disabled={isUpdating}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-red-500"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDelete(milestone.id); }}
              aria-label={`Delete ${milestone.name} milestone`}
              disabled={isUpdating}
              tabIndex={-1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>{milestone.icon} {milestone.experience} XP, {milestone.gold} Gold</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <Progress value={milestone.progress} className="h-1.5" aria-label={`Milestone progress: ${milestone.progress}%`} />
        </div>
      </CardContent>
    </Card>
  );
} 