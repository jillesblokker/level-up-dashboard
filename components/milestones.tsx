"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { Sword, Brain, Crown, Castle, Hammer, Heart, PlusCircle, Trash2, Pencil, Sun, PersonStanding, CheckCircle } from "lucide-react"
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useUser } from "@clerk/nextjs"
import { defaultQuests } from '@/lib/quest-sample-data'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from "@clerk/nextjs"
import { useToast } from "@/components/ui/use-toast"
import { storageService } from '@/lib/storage-service'
import { Quest } from '@/lib/quest-types'
import { updateCharacterStat, getCharacterStats, addToCharacterStatSync, updateCharacterStatSync } from '@/lib/character-stats-manager'
import QuestCard from './quest-card'
import { pollingService, createPollingConfig } from '@/lib/polling-service';
import { errorHandler, ErrorHandler } from '@/lib/error-handler';
import { gainExperience } from '@/lib/experience-manager'
import { gainGold } from '@/lib/gold-manager'
import { cn } from '@/lib/utils'


interface Milestone {
  id: string;
  name: string;
  description?: string;
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
  { key: 'wellness', label: 'Wellness', icon: Sun, iconClass: 'text-amber-400' },
  { key: 'exploration', label: 'Exploration', icon: PersonStanding, iconClass: 'text-blue-400' },
];

const defaultMilestoneCards: Record<string, { title: string; description: string }> = {
  might:    { title: '300 Pushups in One Day', description: 'Complete 300 pushups in a single day' },
  knowledge:{ title: '365 Days of Spanish', description: 'Practice Spanish every day for a year' },
  honor:    { title: 'Wake Up Before 6AM for 100 Days', description: 'Wake up before 6AM for 100 consecutive days' },
  castle:   { title: 'Host 50 Dinners for Friends', description: 'Host 50 dinners or gatherings at your home' },
  craft:    { title: 'Complete a 365-Day Drawing Challenge', description: 'Draw something every day for a year' },
  vitality: { title: 'Plank 3:00', description: 'Hold a plank for 3 minutes straight' },
  wellness: { title: 'Do a Yoga Session', description: 'Stretch to avoid a stretcher. Keep those shoulders down' },
  exploration: { title: 'Hike 2km', description: 'Why are you running' },
};

// Add localStorage keys
const CUSTOM_MILESTONES_KEY = 'custom-milestones-v2';
const MILESTONE_PROGRESS_KEY = 'milestone-progress-v2';
const MILESTONE_STREAKS_KEY = 'milestone-streaks-v2';

interface MilestonesProps {
  token: string | null;
  onUpdateProgress?: (milestoneId: string, currentCompleted: boolean) => Promise<void>;
  category?: string | undefined;
}

export function Milestones({ token, onUpdateProgress, category }: MilestonesProps) {
  const { userId } = useAuth();
  const { supabase, isLoading: isSupabaseLoading } = useSupabase();
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
  const [checkedMilestones, setCheckedMilestones] = useState<string[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [customMilestones, setCustomMilestones] = useState<Record<string, Milestone[]>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [completionDates, setCompletionDates] = useState<Record<string, string>>({});
  const [addModalOpen, setAddModalOpen] = useState<string | null>(null);
  
  // Remove all persistence effects - components will use temporary state
  // useEffect(() => { storageService.set(CUSTOM_MILESTONES_KEY, customMilestones); }, [customMilestones]); // Removed
  // useEffect(() => { storageService.set(MILESTONE_PROGRESS_KEY, progress); }, [progress]); // Removed
  // useEffect(() => { storageService.set("milestone-completed-v2", completed); }, [completed]); // Removed
  // useEffect(() => { storageService.set(MILESTONE_STREAKS_KEY, streaks); }, [streaks]); // Removed
  // useEffect(() => { storageService.set("milestone-completion-dates-v2", completionDates); }, [completionDates]); // Removed

  useEffect(() => {
    if (!userId || !supabase || isSupabaseLoading || !token) {
      console.log('[Milestones] Skipping fetch - missing dependencies:', { userId: !!userId, supabase: !!supabase, isSupabaseLoading, token: !!token });
      return;
    }
    const fetchMilestones = async () => {
      try {
        setIsLoading(true);
        console.log('[Milestones] Fetching milestones with token:', token ? 'present' : 'missing');
        const response = await fetch('/api/milestones', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Milestones] API error:', response.status, errorText);
          throw new Error(`Failed to fetch milestones: ${response.status} ${errorText}`);
        }
        const milestoneData = await response.json();
        setMilestones(milestoneData || []);
      } catch (err) {
        console.error('[Milestones] Fetch error:', err);
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
  }, [userId, supabase, isSupabaseLoading, token, newQuestCategory, toast]);

  // When milestones are loaded, sync ALL UI state with database state
  useEffect(() => {
    if (milestones && milestones.length > 0) {
      const completedIds = milestones.filter(m => m.completed).map(m => m.id);
      setCheckedMilestones(completedIds);
      
      // Sync local completed and progress state with database state
      const completedState: Record<string, boolean> = {};
      const progressState: Record<string, number> = {};
      
      milestones.forEach(milestone => {
        completedState[milestone.id] = milestone.completed;
        progressState[milestone.id] = milestone.progress;
      });
      
      setCompleted(completedState);
      setProgress(progressState);
    }
  }, [milestones]);

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
      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newMilestone.name,
          description: newMilestone.name,
          category: newQuestCategory,
          difficulty: 'medium',
          xp: newMilestone.experience,
          gold: newMilestone.gold,
          target: newMilestone.target,
          icon: newMilestone.icon,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create milestone');
      }
      
      const newMilestoneData = await response.json();
      
      const milestone: Milestone = {
        id: newMilestoneData.id,
        name: newMilestoneData.name,
        category: newMilestoneData.category,
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
      if (!token) throw new Error('No Clerk token');
      
      // Call backend API to delete milestone
      const response = await fetch(`/api/milestones/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const err = await response.text();
        console.error('Delete error:', err);
        throw new Error(err || 'Failed to delete milestone');
      }
      
      // Set the last edit time to prevent polling from overwriting
      pollingService.setLastEditTime('milestones');
      
      // Remove from local state
      setMilestones(prev => {
        const filtered = prev.filter(m => m.id !== id);
        return filtered;
      });
      setProgress(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
      setCompleted(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
      setStreaks(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
      setCompletionDates(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
      
      toast({
        title: 'Success',
        description: 'Milestone deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete milestone. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleCompletion = async (id: string, completed: boolean) => {
    try {
      // Find the milestone to get its id
      const milestone = milestones.find(m => m.id === id);
      if (!milestone) return;
      if (!token) throw new Error('No Clerk token');
      // First, upsert the completion row
      const res = await fetch('/api/milestones/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ milestoneId: milestone.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to upsert milestone completion');
      }
      // Then, update the completed status
      const updateRes = await fetch('/api/milestones/completion', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ milestoneId: milestone.id, completed }),
      });
      if (!updateRes.ok) {
        const err = await updateRes.json();
        throw new Error(err.error || 'Failed to update milestone completion');
      }
      setMilestones(prev => prev.map(m => m.id === id ? { ...m, completed, progress: completed ? 100 : 0 } : m));
      // Update checked milestones
      if (completed) {
        setCheckedMilestones(prev => [...prev, id]);
      } else {
        setCheckedMilestones(prev => prev.filter(mId => mId !== id));
      }
      toast({
        title: 'Success',
        description: completed ? 'Milestone completed!' : 'Milestone unchecked!',
      });
    } catch (error) {
      console.error('Error toggling milestone completion:', error);
      toast({
        title: 'Error',
        description: 'Failed to update milestone. Please try again.',
        variant: 'destructive',
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
  const handleEditMilestoneSubmit = async (updatedMilestone: Milestone) => {
    try {
      if (!token) throw new Error('No Clerk token');
      
      // Call backend API to update milestone
      const response = await fetch(`/api/milestones/${updatedMilestone.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: updatedMilestone.name,
          description: updatedMilestone.description,
          experience: updatedMilestone.experience,
          gold: updatedMilestone.gold,
          // Add other fields as needed
        }),
      });
      
      if (!response.ok) {
        const err = await response.text();
        console.error('Edit error:', err);
        throw new Error(err || 'Failed to update milestone');
      }
      
      // Set the last edit time to prevent polling from overwriting
      pollingService.setLastEditTime('milestones');
      setMilestones(prev => {
        const updated = prev.map(m => m.id === updatedMilestone.id ? { ...m, ...updatedMilestone } : m);
        return updated;
      });
      
      toast({
        title: 'Success',
        description: 'Milestone updated successfully!',
      });
      setEditModalOpen(false);
      setEditingMilestone(null);
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast({
        title: 'Error',
        description: 'Failed to update milestone. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // --- Handlers ---
  const handleAddCustomMilestone = (category: string) => {
    if (!newMilestone.name.trim()) return;
    const id = `${category}-${Date.now()}`;
    const milestone: Milestone = {
      id,
      name: newMilestone.name,
      category,
      icon: newMilestone.icon,
      experience: newMilestone.experience,
      gold: newMilestone.gold,
      frequency: 'once',
      progress: 0,
      target: newMilestone.target,
      completed: false,
    };
    setCustomMilestones(prev => ({ ...prev, [category]: [...(prev[category] || []), milestone] }));
    setAddModalOpen(null);
    setNewMilestone({ name: '', target: 1, experience: 500, gold: 250, icon: '🏆' });
  };
  const handleDeleteCustomMilestone = async (category: string, id: string) => {
    try {
      if (!token) throw new Error('No Clerk token');
      
      // Call backend API to delete milestone
      const response = await fetch(`/api/milestones/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const err = await response.text();
        console.error('Delete error:', err);
        throw new Error(err || 'Failed to delete milestone');
      }
      
      // Set the last edit time to prevent polling from overwriting
      pollingService.setLastEditTime('milestones');
      
      // Update local state - remove from both milestones and customMilestones
      setMilestones(prev => prev.filter(m => m.id !== id));
      setCustomMilestones(prev => ({ ...prev, [category]: (prev[category] || []).filter(m => m.id !== id) }));
      setProgress(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
      setCompleted(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
      setStreaks(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
      setCompletionDates(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
      
      toast({
        title: 'Success',
        description: 'Milestone deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting custom milestone:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete milestone. Please try again.',
        variant: 'destructive',
      });
    }
  };
  const handleProgressChange = (id: string, value: number, target: number) => {
    setProgress(prev => ({ ...prev, [id]: value }));
    if (value >= target) {
      setCompleted(prev => ({ ...prev, [id]: true }));
      setCompletionDates(prev => ({ ...prev, [id]: new Date().toISOString().slice(0, 10) }));
      // Streak logic: increment if completed today
      const today = new Date().toISOString().slice(0, 10);
      setStreaks(prev => {
        const lastDate = completionDates[id];
        if (lastDate) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          if (lastDate === yesterday) return { ...prev, [id]: (prev[id] || 0) + 1 };
        }
        return { ...prev, [id]: 1 };
      });
    } else {
      setCompleted(prev => ({ ...prev, [id]: false }));
    }
  };
  const handleCheckboxToggle = async (id: string, target: number) => {
    const isNowComplete = !completed[id];
    setCompleted(prev => ({ ...prev, [id]: isNowComplete }));
    setProgress(prev => ({ ...prev, [id]: isNowComplete ? target : 0 }));
    if (isNowComplete) {
      setCompletionDates(prev => ({ ...prev, [id]: new Date().toISOString().slice(0, 10) }));
      // Streak logic
      const today = new Date().toISOString().slice(0, 10);
      setStreaks(prev => {
        const lastDate = completionDates[id];
        if (lastDate) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          if (lastDate === yesterday) return { ...prev, [id]: (prev[id] || 0) + 1 };
        }
        return { ...prev, [id]: 1 };
      });
    } else {
      setStreaks(prev => ({ ...prev, [id]: 0 }));
      setCompletionDates(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
    }
    // Persist to backend if milestone exists in backend
    const milestone = milestones.find(m => m.id === id);
    if (milestone && token) {
      try {
        // Upsert completion row
        await fetch('/api/milestones/completion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ milestoneId: milestone.id }),
        });
        // Update completed status
        await fetch('/api/milestones/completion', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ milestoneId: milestone.id, completed: isNowComplete }),
        });
        // Emit kingdom event for stats
        if (isNowComplete) {
          import('@/lib/kingdom-events').then(mod => {
            mod.emitQuestCompletedWithRewards(milestone.name, milestone.gold, milestone.experience, 'milestone');
          });
        }
      } catch (err) {
        console.error('Failed to persist milestone completion:', err);
      }
    }
  };

  // Polling for milestone changes using centralized service
  useEffect(() => {
    if (!userId || !token) return;
    
    const fetchMilestones = async () => {
      const response = await fetch('/api/milestones', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw await errorHandler.handleFetchError(response, 'milestones-polling');
      }
      
      const milestoneData = await ErrorHandler.safeJsonParse(response);
      return milestoneData;
    };

    const config = createPollingConfig(
      15000, // 15 seconds
      true,
      (data) => setMilestones(data || []),
      (error) => {
        // Silent error handling for polling to avoid spam
      }
    );

    pollingService.startPolling('milestones', fetchMilestones, config);
    
    return () => {
      pollingService.stopPolling('milestones');
    };
  }, [userId, token]);

  // Filter milestones by category if provided
  const filteredMilestones = category ? milestones.filter(m => m.category?.toLowerCase() === category.toLowerCase()) : milestones;

  // Find the selected category object if category is provided
  const selectedCategoryObj = category ? milestoneCategories.find(cat => cat.key === category) : null;

  return (
    <div className="space-y-8">
      {category && selectedCategoryObj ? (
        (() => {
          const defaultCard = defaultMilestoneCards[selectedCategoryObj.key];
          if (!defaultCard) return null;
          const colorClass = selectedCategoryObj.iconClass + ' border-2 ' + selectedCategoryObj.iconClass.replace('text-', 'border-');
          // Filter milestones and custom milestones by selected category
          const filteredMilestones = milestones.filter(m => m.category?.toLowerCase() === selectedCategoryObj.key.toLowerCase());
          const filteredCustomMilestones = (customMilestones[selectedCategoryObj.key] || []);
          
          // Create default milestone only if no milestones exist for this category
          const allMilestones = [...filteredMilestones, ...filteredCustomMilestones];
          if (allMilestones.length === 0) {
            const defaultMilestone: Milestone = {
              id: `local-default-${selectedCategoryObj.key}-${Date.now()}`, // Use timestamp for unique local ID
              name: defaultCard.title,
              category: selectedCategoryObj.key,
              icon: '',
              experience: 500,
              gold: 250,
              frequency: 'once',
              progress: progress[`local-default-${selectedCategoryObj.key}`] || 0,
              target: 1,
              completed: completed[`local-default-${selectedCategoryObj.key}`] || false,
            };
            allMilestones.push(defaultMilestone);
          }
          return (
            <div key={selectedCategoryObj.key}>
              <div className="flex items-center gap-2 mb-4">
                <selectedCategoryObj.icon className={`h-5 w-5 ${selectedCategoryObj.iconClass}`} />
                <h3 className="text-lg font-semibold">{selectedCategoryObj.label}</h3>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
                {allMilestones.length === 0 ? (
                  <div className="text-gray-400 col-span-full">No milestones for this category yet.</div>
                                  ) : (
                    allMilestones.map(milestone => (
                      <MilestoneCard
                        key={milestone.id}
                        milestone={milestone}
                        onDelete={handleDeleteMilestone}
                        onUpdateProgress={handleToggleCompletion}
                        onEdit={handleEditMilestone}
                      />
                    ))
                  )}
                {/* Add Custom Milestone Card */}
                <Card
                  className="flex flex-col items-center justify-center border-2 border-dashed border-amber-800 bg-black/20 shadow-md cursor-pointer hover:bg-black/30 min-h-[180px]"
                  role="button"
                  aria-label="add-custom-milestone-card"
                  tabIndex={0}
                  onClick={() => setAddModalOpen(selectedCategoryObj.key)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setAddModalOpen(selectedCategoryObj.key); }}
                >
                  <CardContent className="flex flex-col items-center justify-center flex-1 py-8">
                    <PlusCircle className="w-8 h-8 text-amber-500 mb-2" />
                    <span className="text-amber-300 font-semibold">Add Custom Milestone</span>
                  </CardContent>
                </Card>
              </div>
              {/* Add Custom Milestone Modal */}
              <Dialog open={addModalOpen === selectedCategoryObj.key} onOpenChange={open => setAddModalOpen(open ? selectedCategoryObj.key : null)}>
                <DialogContent role="dialog" aria-label="milestone-modal">
                  <DialogHeader>
                    <DialogTitle>Add Custom Milestone</DialogTitle>
                    <DialogDescription id="milestone-modal-desc">Set up a new milestone for {selectedCategoryObj.label}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="milestone-name">Milestone Name</Label>
                      <Input
                        id="milestone-name"
                        value={newMilestone.name}
                        onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })}
                        placeholder="Enter milestone name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="milestone-target">Target</Label>
                      <Input
                        id="milestone-target"
                        type="number"
                        value={newMilestone.target}
                        onChange={e => setNewMilestone({ ...newMilestone, target: Number(e.target.value) })}
                        placeholder="Enter target value"
                      />
                    </div>
                    <div>
                      <Label htmlFor="milestone-experience">Experience Points</Label>
                      <Input
                        id="milestone-experience"
                        type="number"
                        value={newMilestone.experience}
                        onChange={e => setNewMilestone({ ...newMilestone, experience: Number(e.target.value) })}
                        placeholder="Enter experience points"
                      />
                    </div>
                    <div>
                      <Label htmlFor="milestone-gold">Gold</Label>
                      <Input
                        id="milestone-gold"
                        type="number"
                        value={newMilestone.gold}
                        onChange={e => setNewMilestone({ ...newMilestone, gold: Number(e.target.value) })}
                        placeholder="Enter gold amount"
                      />
                    </div>
                    <Button onClick={() => handleAddCustomMilestone(selectedCategoryObj.key)}>Add Milestone</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          );
        })()
      ) : null}
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
              <label className="block mb-2 text-sm font-medium">Description</label>
              <textarea
                className="w-full mb-4 p-2 border rounded resize-none"
                rows={3}
                value={editingMilestone.description || ''}
                onChange={e => setEditingMilestone({ ...editingMilestone, description: e.target.value })}
                placeholder="Milestone description"
                title="Milestone description"
                aria-label="Milestone description"
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
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { toast } = useToast();
  
  // Handler for card click (toggles completion)
  const handleCardClick = async (e: React.MouseEvent) => {
    // Prevent toggling if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) return;
    await toggleCompletion();
  };

  const toggleCompletion = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await onUpdateProgress(milestone.id, !completed);
      setCompleted(!completed);
      // The API will handle granting rewards, so we don't need to do it here
      // This prevents double rewards
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

  const progressPercentage = (milestone.progress / 100) * 100;

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 cursor-pointer group",
        "bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-amber-800/20",
        "hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/20",
        "transform hover:-translate-y-1",
        completed && "opacity-75"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={handleCardClick}
      aria-label={`Milestone card: ${milestone.name}`}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Interactive Checkbox */}
      <div 
        className="absolute top-3 right-3 z-10 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          toggleCompletion();
        }}
        aria-label={`Toggle milestone completion: ${milestone.name}`}
      >
        <div className={cn(
          "w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200",
          "hover:scale-110 hover:shadow-lg",
          completed 
            ? "bg-green-500 border-green-500 text-white" 
            : "bg-transparent border-gray-400 text-transparent hover:border-amber-400"
        )}>
          {completed ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <div className="w-3 h-3 rounded border border-gray-400" />
          )}
        </div>
      </div>

      {/* Edit and Delete Buttons */}
      <div className="absolute top-3 left-3 z-10 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-amber-400 hover:bg-amber-500/20"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(milestone);
          }}
          aria-label={`Edit ${milestone.name} milestone`}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-red-400 hover:bg-red-500/20"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(milestone.id);
          }}
          aria-label={`Delete ${milestone.name} milestone`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold text-white line-clamp-2 group-hover:text-amber-400 transition-colors duration-300">
              {milestone.name}
            </CardTitle>
            <CardDescription className="text-sm text-gray-400 line-clamp-2 mt-1">
              {milestone.description || `${milestone.icon} ${milestone.experience} XP, ${milestone.gold} Gold`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className="text-amber-400 font-medium">{milestone.progress}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-gray-700" 
            aria-label={`Milestone progress: ${milestone.progress}%`}
          />
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            className={cn(
              "w-full transition-all duration-300",
              completed 
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            )}
            onClick={(e) => {
              e.stopPropagation();
              toggleCompletion();
            }}
            disabled={completed}
            aria-label={completed ? 'Milestone completed' : 'Toggle milestone completion'}
          >
            {completed && <CheckCircle className="h-4 w-4 mr-2" />}
            {completed ? 'Completed' : 'Toggle Completion'}
          </Button>
        </div>
      </CardContent>

      {/* Hover Effects */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
      )}
    </Card>
  );
}