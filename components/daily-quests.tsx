"use client"

import { useState } from "react"
import { Plus, Sword, Brain, Shield, Castle, Brush, Leaf } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { gainExperience } from '@/lib/experience-manager'
import { toast } from "@/components/ui/use-toast"

// Quest item definitions with icons and categories
interface QuestItem {
  id: string
  name: string
  icon: string
  category: 'might' | 'knowledge' | 'honor' | 'castle' | 'craft' | 'vitality'
  completed: boolean
  rewards: {
    experience: number
    gold: number
  }
  frequency?: string
}

export function DailyQuests() {
  // State for quest items
  const [questItems, setQuestItems] = useState<QuestItem[]>([
    // Might category
    { id: "pushups", name: "300x Pushups", icon: "🏋️", category: "might", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "plank", name: "Plank 3:00", icon: "🧎", category: "might", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "walk", name: "Walk", icon: "🚶", category: "might", completed: false, rewards: { experience: 50, gold: 25 } },
    
    // Knowledge category
    { id: "spanish", name: "Spanish", icon: "🇪🇸", category: "knowledge", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "piano", name: "Duo Piano", icon: "🎹", category: "knowledge", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "mindpal", name: "Mindpal", icon: "🧠", category: "knowledge", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "typing", name: "Quick Typing", icon: "⌨️", category: "knowledge", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "read", name: "Read 5 Minutes", icon: "📚", category: "knowledge", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "vitamind", name: "Vitamin D", icon: "☀️", category: "knowledge", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "draw", name: "24 Draw Lesson", icon: "🖼️", category: "knowledge", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "academy", name: "Daily Hype 4 Academy", icon: "🎓", category: "knowledge", completed: false, rewards: { experience: 50, gold: 25 } },
    
    // Honor category
    { id: "wake", name: "Wake Up Before 10", icon: "⏰", category: "honor", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "toothbrushing", name: "Toothbrushing", icon: "🪥", category: "honor", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "handwriting", name: "Handwriting", icon: "✍️", category: "honor", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "shave", name: "Shave", icon: "🪒", category: "honor", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "barber", name: "Barber", icon: "💇", category: "honor", completed: false, rewards: { experience: 50, gold: 25 } },
    
    // Castle category
    { id: "dishwasher", name: "Dishwasher", icon: "🍽️", category: "castle", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "diaper", name: "Diaper Bin", icon: "🗑️", category: "castle", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "vacuum", name: "Vacuuming", icon: "🧹", category: "castle", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "plants", name: "Water Plants", icon: "🪴", category: "castle", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "laundry", name: "Bed Laundry", icon: "🧺", category: "castle", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "trash", name: "Trash Bin at the Road", icon: "🗑️", category: "castle", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "paper", name: "Paper on the Road", icon: "📄", category: "castle", completed: false, rewards: { experience: 50, gold: 25 } },
    
    // Craft category
    { id: "doodle", name: "Doodle", icon: "🖌️", category: "craft", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "animate", name: "Animate", icon: "🎬", category: "craft", completed: false, rewards: { experience: 50, gold: 25 } },
    
    // Vitality category
    { id: "battubby", name: "Battubby", icon: "🛁", category: "vitality", completed: false, rewards: { experience: 50, gold: 25 } },
    { id: "mango", name: "Mango Food Fill", icon: "🥭", category: "vitality", completed: false, rewards: { experience: 50, gold: 25 } },
  ])

  // State for new quest dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newQuestName, setNewQuestName] = useState("")
  const [newQuestIcon, setNewQuestIcon] = useState("")
  const [newQuestCategory, setNewQuestCategory] = useState<'might' | 'knowledge' | 'honor' | 'castle' | 'craft' | 'vitality'>('might')
  const [newQuestExperience, setNewQuestExperience] = useState<number>(50)
  const [newQuestGold, setNewQuestGold] = useState<number>(25)
  const [newQuestFrequency, setNewQuestFrequency] = useState<string>("")

  // Toggle quest completion
  const toggleQuestCompletion = (id: string) => {
    const quest = questItems.find((q) => q.id === id)
    if (!quest) return

    const updatedQuests = questItems.map((q) => {
      if (q.id === id) {
        const newCompletionStatus = !q.completed
        
        if (newCompletionStatus) {
          // Grant experience with quest category
          gainExperience(quest.rewards.experience, quest.category || 'general')
          
          // Calculate gold bonus from perks
          const perksString = localStorage.getItem('character-perks')
          const equippedPerks = perksString ? JSON.parse(perksString).filter((p: any) => p.equipped) : []
          
          let goldBonus = 0
          equippedPerks.forEach((perk: any) => {
            if (perk.category === quest.category) {
              goldBonus += (perk.level * 0.1) * quest.rewards.gold // 10% per level for matching category
            } else if (perk.category === 'general') {
              goldBonus += (perk.level * 0.05) * quest.rewards.gold // 5% per level for general perks
            }
          })

          const totalGold = quest.rewards.gold + Math.floor(goldBonus)
          
          // Update character gold
          const statsString = localStorage.getItem('character-stats')
          if (statsString) {
            const stats = JSON.parse(statsString)
            stats.gold += totalGold
            localStorage.setItem('character-stats', JSON.stringify(stats))
            window.dispatchEvent(new CustomEvent('character-stats-update'))
          }

          // Show toast with gold earned
          toast({
            title: "Quest Completed!",
            description: `You earned ${totalGold} gold (${Math.floor(goldBonus)} from perks)`,
          })
        }

        return { ...q, completed: newCompletionStatus }
      }
      return q
    })

    setQuestItems(updatedQuests)
    localStorage.setItem('daily-quests', JSON.stringify(updatedQuests))
  }

  // Add new quest
  const addNewQuest = () => {
    if (newQuestName.trim() === "") return

    const newQuest: QuestItem = {
      id: Date.now().toString(),
      name: newQuestName,
      icon: newQuestIcon || "❓",
      category: newQuestCategory,
      completed: false,
      rewards: {
        experience: newQuestExperience,
        gold: newQuestGold
      },
      frequency: newQuestFrequency.trim() || undefined
    }

    setQuestItems([...questItems, newQuest])
    setNewQuestName("")
    setNewQuestIcon("")
    setNewQuestExperience(50)
    setNewQuestGold(25)
    setNewQuestFrequency("")
    setIsDialogOpen(false)
    localStorage.setItem('daily-quests', JSON.stringify([...questItems, newQuest]))
  }

  // Filter quests by category
  const mightQuests = questItems.filter((item) => item.category === "might")
  const knowledgeQuests = questItems.filter((item) => item.category === "knowledge")
  const honorQuests = questItems.filter((item) => item.category === "honor")
  const castleQuests = questItems.filter((item) => item.category === "castle")
  const craftQuests = questItems.filter((item) => item.category === "craft")
  const vitalityQuests = questItems.filter((item) => item.category === "vitality")

  // Calculate completion stats
  const completedCount = questItems.filter((item) => item.completed).length
  const totalCount = questItems.length
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6">
      <Card className="bg-black/80 border-amber-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-amber-500 flex items-center justify-between">
            <span>Daily Quests</span>
            <span className="text-sm font-normal">{completedCount}/{totalCount} ({completionPercentage}%)</span>
          </CardTitle>
          <CardDescription>Track your daily tasks by category</CardDescription>
        </CardHeader>
      </Card>

      {/* Might Category */}
      <Card className="border border-amber-800/20 bg-black">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Sword className="h-5 w-5 text-amber-500" />
            <h3 className="text-xl font-medievalsharp text-white">Might</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {mightQuests.map((quest) => (
              <div key={quest.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-900/50">
                <Checkbox 
                  id={quest.id} 
                  checked={quest.completed} 
                  onCheckedChange={() => toggleQuestCompletion(quest.id)}
                />
                <Label htmlFor={quest.id} className="flex items-center cursor-pointer">
                  <span className="mr-2">{quest.icon}</span>
                  <span className={quest.completed ? "line-through text-gray-500" : ""}>{quest.name}</span>
                </Label>
              </div>
            ))}
            <Dialog open={isDialogOpen && newQuestCategory === "might"} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (open) setNewQuestCategory("might");
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-dashed border-gray-700 justify-start h-auto py-2 px-3">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Add Might Quest</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-b from-blue-900 to-blue-950 border-blue-800/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Might Quest</DialogTitle>
                  <DialogDescription className="text-gray-400">Create a new daily quest for strength and physical power.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-name" className="text-right text-white">Name</Label>
                    <Input 
                      id="quest-name" 
                      value={newQuestName} 
                      onChange={(e) => setNewQuestName(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-icon" className="text-right text-white">Icon</Label>
                    <Input 
                      id="quest-icon" 
                      value={newQuestIcon} 
                      onChange={(e) => setNewQuestIcon(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      placeholder="Emoji or icon" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-experience" className="text-right text-white">Experience</Label>
                    <Input 
                      id="quest-experience" 
                      type="number"
                      value={newQuestExperience} 
                      onChange={(e) => setNewQuestExperience(Number(e.target.value))} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      min={0}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-gold" className="text-right text-white">Gold</Label>
                    <Input 
                      id="quest-gold" 
                      type="number"
                      value={newQuestGold} 
                      onChange={(e) => setNewQuestGold(Number(e.target.value))} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      min={0}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-frequency" className="text-right text-white">Frequency</Label>
                    <Input 
                      id="quest-frequency" 
                      value={newQuestFrequency} 
                      onChange={(e) => setNewQuestFrequency(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      placeholder="e.g. 3x, 5 minutes, twice daily" 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addNewQuest} className="bg-blue-600 hover:bg-blue-700 text-white">Add Quest</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Category */}
      <Card className="border border-amber-800/20 bg-black">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-amber-500" />
            <h3 className="text-xl font-medievalsharp text-white">Knowledge</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {knowledgeQuests.map((quest) => (
              <div key={quest.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-900/50">
                <Checkbox 
                  id={quest.id} 
                  checked={quest.completed} 
                  onCheckedChange={() => toggleQuestCompletion(quest.id)}
                />
                <Label htmlFor={quest.id} className="flex items-center cursor-pointer">
                  <span className="mr-2">{quest.icon}</span>
                  <span className={quest.completed ? "line-through text-gray-500" : ""}>{quest.name}</span>
                </Label>
              </div>
            ))}
            <Dialog open={isDialogOpen && newQuestCategory === "knowledge"} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (open) setNewQuestCategory("knowledge");
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-dashed border-gray-700 justify-start h-auto py-2 px-3">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Add Knowledge Quest</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-b from-blue-900 to-blue-950 border-blue-800/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Knowledge Quest</DialogTitle>
                  <DialogDescription className="text-gray-400">Create a new daily quest for learning and wisdom.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-name" className="text-right text-white">Name</Label>
                    <Input 
                      id="quest-name" 
                      value={newQuestName} 
                      onChange={(e) => setNewQuestName(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-icon" className="text-right text-white">Icon</Label>
                    <Input 
                      id="quest-icon" 
                      value={newQuestIcon} 
                      onChange={(e) => setNewQuestIcon(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      placeholder="Emoji or icon" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-experience" className="text-right text-white">Experience</Label>
                    <Input 
                      id="quest-experience" 
                      type="number"
                      value={newQuestExperience} 
                      onChange={(e) => setNewQuestExperience(Number(e.target.value))} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      min={0}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-gold" className="text-right text-white">Gold</Label>
                    <Input 
                      id="quest-gold" 
                      type="number"
                      value={newQuestGold} 
                      onChange={(e) => setNewQuestGold(Number(e.target.value))} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      min={0}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-frequency" className="text-right text-white">Frequency</Label>
                    <Input 
                      id="quest-frequency" 
                      value={newQuestFrequency} 
                      onChange={(e) => setNewQuestFrequency(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      placeholder="e.g. 3x, 5 minutes, twice daily" 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addNewQuest} className="bg-blue-600 hover:bg-blue-700 text-white">Add Quest</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Honor Category */}
      <Card className="border border-amber-800/20 bg-black">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <h3 className="text-xl font-medievalsharp text-white">Honor</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {honorQuests.map((quest) => (
              <div key={quest.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-900/50">
                <Checkbox 
                  id={quest.id} 
                  checked={quest.completed} 
                  onCheckedChange={() => toggleQuestCompletion(quest.id)}
                />
                <Label htmlFor={quest.id} className="flex items-center cursor-pointer">
                  <span className="mr-2">{quest.icon}</span>
                  <span className={quest.completed ? "line-through text-gray-500" : ""}>{quest.name}</span>
                </Label>
              </div>
            ))}
            <Dialog open={isDialogOpen && newQuestCategory === "honor"} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (open) setNewQuestCategory("honor");
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-dashed border-gray-700 justify-start h-auto py-2 px-3">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Add Honor Quest</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-b from-blue-900 to-blue-950 border-blue-800/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Honor Quest</DialogTitle>
                  <DialogDescription className="text-gray-400">Create a new daily quest for personal discipline and honor.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-name" className="text-right text-white">Name</Label>
                    <Input 
                      id="quest-name" 
                      value={newQuestName} 
                      onChange={(e) => setNewQuestName(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-icon" className="text-right text-white">Icon</Label>
                    <Input 
                      id="quest-icon" 
                      value={newQuestIcon} 
                      onChange={(e) => setNewQuestIcon(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      placeholder="Emoji or icon" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-experience" className="text-right text-white">Experience</Label>
                    <Input 
                      id="quest-experience" 
                      type="number"
                      value={newQuestExperience} 
                      onChange={(e) => setNewQuestExperience(Number(e.target.value))} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      min={0}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-gold" className="text-right text-white">Gold</Label>
                    <Input 
                      id="quest-gold" 
                      type="number"
                      value={newQuestGold} 
                      onChange={(e) => setNewQuestGold(Number(e.target.value))} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      min={0}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-frequency" className="text-right text-white">Frequency</Label>
                    <Input 
                      id="quest-frequency" 
                      value={newQuestFrequency} 
                      onChange={(e) => setNewQuestFrequency(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      placeholder="e.g. 3x, 5 minutes, twice daily" 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addNewQuest} className="bg-blue-600 hover:bg-blue-700 text-white">Add Quest</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Castle Category */}
      <Card className="border border-amber-800/20 bg-black">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Castle className="h-5 w-5 text-amber-500" />
            <h3 className="text-xl font-medievalsharp text-white">Castle</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {castleQuests.map((quest) => (
              <div key={quest.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-900/50">
                <Checkbox 
                  id={quest.id} 
                  checked={quest.completed} 
                  onCheckedChange={() => toggleQuestCompletion(quest.id)}
                />
                <Label htmlFor={quest.id} className="flex items-center cursor-pointer">
                  <span className="mr-2">{quest.icon}</span>
                  <span className={quest.completed ? "line-through text-gray-500" : ""}>{quest.name}</span>
                </Label>
              </div>
            ))}
            <Dialog open={isDialogOpen && newQuestCategory === "castle"} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (open) setNewQuestCategory("castle");
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-dashed border-gray-700 justify-start h-auto py-2 px-3">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Add Castle Quest</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-b from-blue-900 to-blue-950 border-blue-800/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Castle Quest</DialogTitle>
                  <DialogDescription className="text-gray-400">Create a new daily quest for maintaining your castle.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-name" className="text-right text-white">Name</Label>
                    <Input 
                      id="quest-name" 
                      value={newQuestName} 
                      onChange={(e) => setNewQuestName(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-icon" className="text-right text-white">Icon</Label>
                    <Input 
                      id="quest-icon" 
                      value={newQuestIcon} 
                      onChange={(e) => setNewQuestIcon(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      placeholder="Emoji or icon" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-experience" className="text-right text-white">Experience</Label>
                    <Input 
                      id="quest-experience" 
                      type="number"
                      value={newQuestExperience} 
                      onChange={(e) => setNewQuestExperience(Number(e.target.value))} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      min={0}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-gold" className="text-right text-white">Gold</Label>
                    <Input 
                      id="quest-gold" 
                      type="number"
                      value={newQuestGold} 
                      onChange={(e) => setNewQuestGold(Number(e.target.value))} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      min={0}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-frequency" className="text-right text-white">Frequency</Label>
                    <Input 
                      id="quest-frequency" 
                      value={newQuestFrequency} 
                      onChange={(e) => setNewQuestFrequency(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      placeholder="e.g. 3x, 5 minutes, twice daily" 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addNewQuest} className="bg-blue-600 hover:bg-blue-700 text-white">Add Quest</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Craft Category */}
      <Card className="border border-amber-800/20 bg-black">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Brush className="h-5 w-5 text-amber-500" />
            <h3 className="text-xl font-medievalsharp text-white">Craft</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {craftQuests.map((quest) => (
              <div key={quest.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-900/50">
                <Checkbox 
                  id={quest.id} 
                  checked={quest.completed} 
                  onCheckedChange={() => toggleQuestCompletion(quest.id)}
                />
                <Label htmlFor={quest.id} className="flex items-center cursor-pointer">
                  <span className="mr-2">{quest.icon}</span>
                  <span className={quest.completed ? "line-through text-gray-500" : ""}>{quest.name}</span>
                </Label>
              </div>
            ))}
            <Dialog open={isDialogOpen && newQuestCategory === "craft"} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (open) setNewQuestCategory("craft");
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-dashed border-gray-700 justify-start h-auto py-2 px-3">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Add Craft Quest</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-b from-blue-900 to-blue-950 border-blue-800/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Craft Quest</DialogTitle>
                  <DialogDescription className="text-gray-400">Create a new daily quest for creative activities.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-name" className="text-right text-white">Name</Label>
                    <Input 
                      id="quest-name" 
                      value={newQuestName} 
                      onChange={(e) => setNewQuestName(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-icon" className="text-right text-white">Icon</Label>
                    <Input 
                      id="quest-icon" 
                      value={newQuestIcon} 
                      onChange={(e) => setNewQuestIcon(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      placeholder="Emoji or icon" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-experience" className="text-right text-white">Experience</Label>
                    <Input 
                      id="quest-experience" 
                      type="number"
                      value={newQuestExperience} 
                      onChange={(e) => setNewQuestExperience(Number(e.target.value))} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      min={0}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-gold" className="text-right text-white">Gold</Label>
                    <Input 
                      id="quest-gold" 
                      type="number"
                      value={newQuestGold} 
                      onChange={(e) => setNewQuestGold(Number(e.target.value))} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      min={0}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-frequency" className="text-right text-white">Frequency</Label>
                    <Input 
                      id="quest-frequency" 
                      value={newQuestFrequency} 
                      onChange={(e) => setNewQuestFrequency(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      placeholder="e.g. 3x, 5 minutes, twice daily" 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addNewQuest} className="bg-blue-600 hover:bg-blue-700 text-white">Add Quest</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Vitality Category */}
      <Card className="border border-amber-800/20 bg-black">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Leaf className="h-5 w-5 text-amber-500" />
            <h3 className="text-xl font-medievalsharp text-white">Vitality</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {vitalityQuests.map((quest) => (
              <div key={quest.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-900/50">
                <Checkbox 
                  id={quest.id} 
                  checked={quest.completed} 
                  onCheckedChange={() => toggleQuestCompletion(quest.id)}
                />
                <Label htmlFor={quest.id} className="flex items-center cursor-pointer">
                  <span className="mr-2">{quest.icon}</span>
                  <span className={quest.completed ? "line-through text-gray-500" : ""}>{quest.name}</span>
                </Label>
              </div>
            ))}
            <Dialog open={isDialogOpen && newQuestCategory === "vitality"} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (open) setNewQuestCategory("vitality");
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-dashed border-gray-700 justify-start h-auto py-2 px-3">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Add Vitality Quest</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-to-b from-blue-900 to-blue-950 border-blue-800/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Vitality Quest</DialogTitle>
                  <DialogDescription className="text-gray-400">Create a new daily quest for health and well-being.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-name" className="text-right text-white">Name</Label>
                    <Input 
                      id="quest-name" 
                      value={newQuestName} 
                      onChange={(e) => setNewQuestName(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-icon" className="text-right text-white">Icon</Label>
                    <Input 
                      id="quest-icon" 
                      value={newQuestIcon} 
                      onChange={(e) => setNewQuestIcon(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      placeholder="Emoji or icon" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-experience" className="text-right text-white">Experience</Label>
                    <Input 
                      id="quest-experience" 
                      type="number"
                      value={newQuestExperience} 
                      onChange={(e) => setNewQuestExperience(Number(e.target.value))} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      min={0}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-gold" className="text-right text-white">Gold</Label>
                    <Input 
                      id="quest-gold" 
                      type="number"
                      value={newQuestGold} 
                      onChange={(e) => setNewQuestGold(Number(e.target.value))} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      min={0}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quest-frequency" className="text-right text-white">Frequency</Label>
                    <Input 
                      id="quest-frequency" 
                      value={newQuestFrequency} 
                      onChange={(e) => setNewQuestFrequency(e.target.value)} 
                      className="col-span-3 bg-blue-900/50 border-blue-800/20 text-white" 
                      placeholder="e.g. 3x, 5 minutes, twice daily" 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addNewQuest} className="bg-blue-600 hover:bg-blue-700 text-white">Add Quest</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 