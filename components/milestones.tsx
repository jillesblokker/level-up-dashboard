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
  const { user } = useUser();
  const userId = user?.id;
  const supabase = useSupabaseClientWithToken();
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newQuestCategory, setNewQuestCategory] = useState("")
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [newMilestone, setNewMilestone] = useState({
    name: "",
    icon: "🎯",
    experience: 500,
    gold: 250,
    target: 1,
  })

  useEffect(() => {
    if (!userId) return;
    const fetchMilestones = async () => {
      try {
        // Get all milestones for the user
        const data = await QuestService.getQuests(supabase, userId, { category: newQuestCategory });
        // If none exist for this category, insert a default one
        if ((data.length === 0) && newQuestCategory) {
          // Find a random quest from this category
          const categoryQuests = defaultQuests.filter(q => q.category === newQuestCategory);
          if (categoryQuests.length > 0) {
            const randomQuest = categoryQuests[Math.floor(Math.random() * categoryQuests.length)];
            if (randomQuest) {
              // Insert as a milestone (make it bigger: multiply xp/gold/target)
              const newMilestoneQuest = await QuestService.createQuest(supabase, {
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
      }
    };
    fetchMilestones();
  }, [userId, supabase, newQuestCategory]);

  const handleAddMilestone = async () => {
    if (!userId || !newMilestone.name || !newQuestCategory) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const newQuest = await QuestService.createQuest(supabase, {
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
    } catch (err) {
      console.error('Failed to add milestone:', err);
      toast({
        title: "Error",
        description: "Failed to add milestone. Please try again.",
        variant: "destructive"
      });
    }
  }

  const handleDeleteMilestone = async (id: string) => {
    if (!userId) return;
    try {
      await QuestService.deleteQuest(supabase, id);
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
  }

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
            {/* Default Milestone Card */}
            <Card className="bg-black/80 border-amber-800/50">
              <CardHeader>
                <CardTitle className="text-amber-500">{defaultMilestoneCards[category.key]?.title}</CardTitle>
                <CardDescription>{defaultMilestoneCards[category.key]?.description}</CardDescription>
              </CardHeader>
            </Card>
            {milestones
              .filter((milestone) => milestone.category === category.key)
              .map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onDelete={handleDeleteMilestone}
                  onUpdateProgress={(id, increment) => {
                    // Update progress logic here if needed
                  }}
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
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setNewQuestCategory(category.key); setIsDialogOpen(true); } }}
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
                onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                placeholder="Enter milestone name"
              />
            </div>
            <div>
              <Label htmlFor="experience">Experience Points</Label>
              <Input
                id="experience"
                type="number"
                value={newMilestone.experience}
                onChange={(e) => setNewMilestone({ ...newMilestone, experience: Number(e.target.value) })}
                placeholder="Enter experience points"
              />
            </div>
            <div>
              <Label htmlFor="gold">Gold</Label>
              <Input
                id="gold"
                type="number"
                value={newMilestone.gold}
                onChange={(e) => setNewMilestone({ ...newMilestone, gold: Number(e.target.value) })}
                placeholder="Enter gold amount"
              />
            </div>
            <div>
              <Label htmlFor="target">Target</Label>
              <Input
                id="target"
                type="number"
                value={newMilestone.target}
                onChange={(e) => setNewMilestone({ ...newMilestone, target: Number(e.target.value) })}
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

function MilestoneCard({ milestone, onDelete, onUpdateProgress }: { milestone: Milestone; onDelete: (id: string) => void; onUpdateProgress: (id: string, increment: boolean) => void; }) {
  return (
    <Card className="bg-black/80 border-amber-800/50">
      <CardHeader>
        <CardTitle className="text-amber-500">{milestone.name}</CardTitle>
        <CardDescription>{milestone.icon} {milestone.experience} XP, {milestone.gold} Gold</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <Progress value={milestone.progress} className="h-1.5" aria-label={`Milestone progress: ${milestone.progress}%`} />
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-red-500"
            onClick={() => onDelete(milestone.id)}
            aria-label={`Delete ${milestone.name} milestone`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 