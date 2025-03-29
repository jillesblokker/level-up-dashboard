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
import { Sword, Brain, Crown, Castle, Hammer, Heart } from "lucide-react"
import { cn } from "@/lib/utils"

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

export function Milestones() {
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
    // Load milestones from localStorage
    const savedMilestones = localStorage.getItem("milestones")
    if (savedMilestones) {
      setMilestones(JSON.parse(savedMilestones))
    }
  }, [])

  const saveMilestones = (updatedMilestones: Milestone[]) => {
    localStorage.setItem("milestones", JSON.stringify(updatedMilestones))
    setMilestones(updatedMilestones)
  }

  const handleAddMilestone = () => {
    if (!newMilestone.name || !newQuestCategory) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const milestone: Milestone = {
      id: Date.now().toString(),
      name: newMilestone.name,
      category: newQuestCategory,
      icon: newMilestone.icon,
      experience: newMilestone.experience,
      gold: newMilestone.gold,
      frequency: "once",
      progress: 0,
      target: newMilestone.target,
      completed: false,
    }

    const updatedMilestones = [...milestones, milestone]
    saveMilestones(updatedMilestones)

    setNewMilestone({
      name: "",
      icon: "🎯",
      experience: 500,
      gold: 250,
      target: 1,
    })
    setIsDialogOpen(false)
    setNewQuestCategory("")

    toast({
      title: "Milestone Added",
      description: "Your new milestone has been added successfully!",
    })
  }

  const updateProgress = (id: string, increment: boolean) => {
    const updatedMilestones = milestones.map((milestone) => {
      if (milestone.id === id) {
        const newProgress = increment
          ? Math.min(milestone.progress + 1, milestone.target)
          : Math.max(milestone.progress - 1, 0)
        
        const completed = newProgress >= milestone.target
        if (completed && !milestone.completed) {
          // Trigger completion rewards
          const event = new CustomEvent("milestone-completed", {
            detail: {
              experience: milestone.experience,
              gold: milestone.gold,
            },
          })
          window.dispatchEvent(event)
          
          toast({
            title: "Milestone Completed! 🎉",
            description: `You've earned ${milestone.experience} XP and ${milestone.gold} gold!`,
          })
        }
        
        return {
          ...milestone,
          progress: newProgress,
          completed,
        }
      }
      return milestone
    })

    saveMilestones(updatedMilestones)
  }

  const deleteMilestone = (id: string) => {
    const updatedMilestones = milestones.filter((milestone) => milestone.id !== id)
    saveMilestones(updatedMilestones)
    
    toast({
      title: "Milestone Deleted",
      description: "The milestone has been removed.",
    })
  }

  return (
    <div className="space-y-8">
      {/* Might Category */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sword className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold">Might</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewQuestCategory("might")
              setIsDialogOpen(true)
            }}
          >
            Add Milestone
          </Button>
        </div>
        <div className="grid gap-4">
          {milestones
            .filter((milestone) => milestone.category === "might")
            .map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                onDelete={deleteMilestone}
                onUpdateProgress={updateProgress}
              />
            ))}
        </div>
      </div>

      {/* Knowledge Category */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Knowledge</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewQuestCategory("knowledge")
              setIsDialogOpen(true)
            }}
          >
            Add Milestone
          </Button>
        </div>
        <div className="grid gap-4">
          {milestones
            .filter((milestone) => milestone.category === "knowledge")
            .map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                onDelete={deleteMilestone}
                onUpdateProgress={updateProgress}
              />
            ))}
        </div>
      </div>

      {/* Honor Category */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Honor</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewQuestCategory("honor")
              setIsDialogOpen(true)
            }}
          >
            Add Milestone
          </Button>
        </div>
        <div className="grid gap-4">
          {milestones
            .filter((milestone) => milestone.category === "honor")
            .map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                onDelete={deleteMilestone}
                onUpdateProgress={updateProgress}
              />
            ))}
        </div>
      </div>

      {/* Vitality Category */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">Vitality</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewQuestCategory("vitality")
              setIsDialogOpen(true)
            }}
          >
            Add Milestone
          </Button>
        </div>
        <div className="grid gap-4">
          {milestones
            .filter((milestone) => milestone.category === "vitality")
            .map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                onDelete={deleteMilestone}
                onUpdateProgress={updateProgress}
              />
            ))}
        </div>
      </div>

      {/* Resilience Category */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Castle className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Resilience</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewQuestCategory("resilience")
              setIsDialogOpen(true)
            }}
          >
            Add Milestone
          </Button>
        </div>
        <div className="grid gap-4">
          {milestones
            .filter((milestone) => milestone.category === "resilience")
            .map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                onDelete={deleteMilestone}
                onUpdateProgress={updateProgress}
              />
            ))}
        </div>
      </div>

      {/* Dexterity Category */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Hammer className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold">Dexterity</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewQuestCategory("dexterity")
              setIsDialogOpen(true)
            }}
          >
            Add Milestone
          </Button>
        </div>
        <div className="grid gap-4">
          {milestones
            .filter((milestone) => milestone.category === "dexterity")
            .map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                onDelete={deleteMilestone}
                onUpdateProgress={updateProgress}
              />
            ))}
        </div>
      </div>

      {/* Add Milestone Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Milestone</DialogTitle>
            <DialogDescription>
              Create a new milestone to track your long-term goals
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter milestone name"
                value={newMilestone.name}
                onChange={(e) =>
                  setNewMilestone({ ...newMilestone, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Input
                id="icon"
                placeholder="Enter an emoji icon"
                value={newMilestone.icon}
                onChange={(e) =>
                  setNewMilestone({ ...newMilestone, icon: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Target Amount</Label>
              <Input
                id="target"
                type="number"
                min="1"
                value={newMilestone.target}
                onChange={(e) =>
                  setNewMilestone({ ...newMilestone, target: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Experience Points</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={newMilestone.experience}
                onChange={(e) =>
                  setNewMilestone({ ...newMilestone, experience: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gold">Gold Reward</Label>
              <Input
                id="gold"
                type="number"
                min="0"
                value={newMilestone.gold}
                onChange={(e) =>
                  setNewMilestone({ ...newMilestone, gold: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMilestone}>Add Milestone</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// MilestoneCard Component
function MilestoneCard({ milestone, onDelete, onUpdateProgress }: { 
  milestone: Milestone; 
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, increment: boolean) => void;
}) {
  return (
    <Card key={milestone.id}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{milestone.name}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            onClick={() => onDelete(milestone.id)}
          >
            Delete
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-2xl">{milestone.icon}</span>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress: {milestone.progress}/{milestone.target}</span>
              <span>{Math.round((milestone.progress / milestone.target) * 100)}%</span>
            </div>
            <Progress value={(milestone.progress / milestone.target) * 100} />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateProgress(milestone.id, false)}
              disabled={milestone.progress <= 0}
            >
              -
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateProgress(milestone.id, true)}
              disabled={milestone.completed}
            >
              +
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{milestone.experience} XP</span>
            <span>{milestone.gold} Gold</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 