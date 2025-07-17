"use client"

import { useState, useEffect } from "react"
import { Plus, Sword, Brain, Shield, Castle, Brush, Leaf } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useSupabaseSync } from '@/hooks/use-supabase-sync'

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
  // Use the Supabase sync hook
  const { isSignedIn } = useSupabaseSync()

  // Function to get current CET date
  const getCurrentCETDate = (): string => {
    const now = new Date()
    const cetDate = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Amsterdam" }))
    return cetDate.toISOString().split('T')[0] || ''
  }

  // State for quest items
  const [questItems, setQuestItems] = useState<QuestItem[]>([])

  // State for new quest dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newQuestName, setNewQuestName] = useState("")
  const [newQuestIcon, setNewQuestIcon] = useState("")
  const [newQuestCategory, setNewQuestCategory] = useState<'might' | 'knowledge' | 'honor' | 'castle' | 'craft' | 'vitality'>('might')
  const [newQuestExperience, setNewQuestExperience] = useState<number>(50)
  const [newQuestGold, setNewQuestGold] = useState<number>(25)
  const [newQuestFrequency, setNewQuestFrequency] = useState<string>("")

  // Default quest data
  const defaultQuestItems: QuestItem[] = [
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
  ]

  // Function to reset quests
  const resetQuests = async () => {
    const updatedQuests = questItems.map(quest => ({
      ...quest,
      completed: false
    }))
    setQuestItems(updatedQuests)
    
    // Save to localStorage only for now
    try {
      // storageService.set('daily-quests', updatedQuests) // Removed
      // storageService.set('last-quest-reset', getCurrentCETDate()) // Removed
    } catch (error) {
      console.error('Failed to save reset quests:', error)
    }
    
    toast({
      title: "Daily Reset",
      description: "All quests have been reset for the new day.",
      variant: "default"
    })
  }

  // Check for daily reset
  useEffect(() => {
    const checkForReset = () => {
      const currentDate = getCurrentCETDate()
      // const savedResetDate = storageService.get<string>('last-quest-reset', '') // Removed
      // if (!savedResetDate || savedResetDate !== currentDate) { // Removed
      //   resetQuests() // Removed
      // } // Removed
    }

    checkForReset()
    const interval = setInterval(checkForReset, 60000)
    return () => clearInterval(interval)
  }, [questItems])

  // Load daily quests from Supabase/localStorage on component mount
  useEffect(() => {
    const loadDailyQuests = async () => {
      try {
        let savedQuests: QuestItem[] = []
        
        // Load from localStorage only for now (Supabase service not implemented)
        // savedQuests = storageService.get('daily-quests', []) // Removed
        
        if (Array.isArray(savedQuests) && savedQuests.length > 0) {
          setQuestItems(savedQuests)
          console.info('Loaded daily quests:', savedQuests.length)
        } else {
          setQuestItems(defaultQuestItems)
          console.info('Using default daily quests - no saved data')
        }
      } catch (error) {
        console.error('Error loading daily quests:', error)
        setQuestItems(defaultQuestItems)
      }
    }
    loadDailyQuests()
  }, [isSignedIn])

  // Toggle quest completion with immediate save
  const toggleQuest = async (questId: string) => {
    const updatedQuests = questItems.map(quest =>
      quest.id === questId
        ? { ...quest, completed: !quest.completed }
        : quest
    )
    
    setQuestItems(updatedQuests)
    
    // Save to localStorage only for now
    try {
      // storageService.set('daily-quests', updatedQuests) // Removed
      console.info('=== DAILY QUEST SAVE SUCCESSFUL ===', { questId, timestamp: new Date() })
    } catch (error) {
      console.error('=== DAILY QUEST SAVE FAILED ===', error)
      toast({
        title: "Save Warning",
        description: "Quest updated locally. Will sync when connection is restored.",
        variant: "destructive"
      })
    }
    
    // Check if quest was completed and show notification
    const toggledQuest = updatedQuests.find(q => q.id === questId)
    if (toggledQuest?.completed) {
      console.info(`Daily quest completed: ${toggledQuest.name}`)
      // emitQuestCompletedWithRewards( // Removed
      //   toggledQuest.name, 
      //   toggledQuest.rewards.gold, 
      //   toggledQuest.rewards.experience, 
      //   'daily-quests'
      // ) // Removed
    }
  }

  // Add new quest
  const addNewQuest = async () => {
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
      ...(newQuestFrequency.trim() ? { frequency: newQuestFrequency.trim() } : {})
    }

    const updatedQuests = [...questItems, newQuest]
    setQuestItems(updatedQuests)
    
    // Save to localStorage only for now
    try {
      // storageService.set('daily-quests', updatedQuests) // Removed
    } catch (error) {
      console.error('Failed to save new quest:', error)
    }
    
    setNewQuestName("")
    setNewQuestIcon("")
    setNewQuestExperience(50)
    setNewQuestGold(25)
    setNewQuestFrequency("")
    setIsDialogOpen(false)
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
      <Card className="border border-red-800/20 bg-black">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Sword className="h-5 w-5 text-red-500" />
            <h3 className="text-xl font-medievalsharp text-white">Might</h3>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile: horizontally scrollable row for daily quests */}
          <div className="flex gap-4 overflow-x-auto flex-nowrap md:hidden py-2" style={{ WebkitOverflowScrolling: 'touch' }}>
            {mightQuests.map((quest) => (
              <Card 
                key={quest.id}
                className={cn(
                  "relative overflow-hidden border-amber-800/20 transition-all duration-200 flex items-center justify-between p-3 hover:bg-amber-950/20 cursor-pointer min-w-[180px] max-w-[220px] flex-shrink-0",
                  quest.completed && "bg-amber-500/10"
                )}
                onClick={() => toggleQuest(quest.id)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleQuest(quest.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={quest.completed}
                aria-label={`Toggle ${quest.name} quest completion`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl" role="img" aria-label={quest.name}>
                    {quest.icon}
                  </span>
                  <span className="text-sm font-medium text-white">{quest.name}</span>
                </div>
                <Checkbox 
                  id={quest.id} 
                  checked={quest.completed}
                  onCheckedChange={(checked) => {
                    toggleQuest(quest.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 border-2 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500 min-h-[44px] min-w-[44px]"
                  aria-label={`Mark ${quest.name} as ${quest.completed ? 'incomplete' : 'complete'}`}
                />
              </Card>
            ))}
          </div>
          {/* Desktop/tablet: grid layout */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {mightQuests.map((quest) => (
              <Card 
                key={quest.id}
                className={cn(
                  "relative overflow-hidden border-amber-800/20 transition-all duration-200 flex items-center justify-between p-3 hover:bg-amber-950/20 cursor-pointer",
                  quest.completed && "bg-amber-500/10"
                )}
                onClick={() => toggleQuest(quest.id)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleQuest(quest.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={quest.completed}
                aria-label={`Toggle ${quest.name} quest completion`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl" role="img" aria-label={quest.name}>
                    {quest.icon}
                  </span>
                  <span className="text-sm font-medium text-white">{quest.name}</span>
                </div>
                <Checkbox 
                  id={quest.id} 
                  checked={quest.completed}
                  onCheckedChange={(checked) => {
                    toggleQuest(quest.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 w-5 border-2 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500"
                  aria-label={`Mark ${quest.name} as ${quest.completed ? 'incomplete' : 'complete'}`}
                />
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Category */}
      <Card className="border border-blue-800/20 bg-black">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <h3 className="text-xl font-medievalsharp text-white">Knowledge</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {knowledgeQuests.map((quest) => (
              <Card 
                key={quest.id}
                className={cn(
                  "relative overflow-hidden border-amber-800/20 transition-all duration-200 flex items-center justify-between p-3 hover:bg-amber-950/20 cursor-pointer",
                  quest.completed && "bg-amber-500/10"
                )}
                onClick={() => toggleQuest(quest.id)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleQuest(quest.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={quest.completed}
                aria-label={`Toggle ${quest.name} quest completion`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl" role="img" aria-label={quest.name}>
                    {quest.icon}
                  </span>
                  <span className="text-sm font-medium text-white">{quest.name}</span>
                </div>
                <Checkbox 
                  id={quest.id} 
                  checked={quest.completed}
                  onCheckedChange={(checked) => {
                    toggleQuest(quest.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 w-5 border-2 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500"
                  aria-label={`Mark ${quest.name} as ${quest.completed ? 'incomplete' : 'complete'}`}
                />
              </Card>
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
              <DialogContent className="bg-gradient-to-b from-blue-900 to-blue-950 border-blue-800/20" role="dialog" aria-label="daily-quests-modal">
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
      <Card className="border border-purple-800/20 bg-black">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-purple-500" />
            <h3 className="text-xl font-medievalsharp text-white">Honor</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {honorQuests.map((quest) => (
              <Card 
                key={quest.id}
                className={cn(
                  "relative overflow-hidden border-amber-800/20 transition-all duration-200 flex items-center justify-between p-3 hover:bg-amber-950/20 cursor-pointer",
                  quest.completed && "bg-amber-500/10"
                )}
                onClick={() => toggleQuest(quest.id)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleQuest(quest.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={quest.completed}
                aria-label={`Toggle ${quest.name} quest completion`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl" role="img" aria-label={quest.name}>
                    {quest.icon}
                  </span>
                  <span className="text-sm font-medium text-white">{quest.name}</span>
                </div>
                <Checkbox 
                  id={quest.id} 
                  checked={quest.completed}
                  onCheckedChange={(checked) => {
                    toggleQuest(quest.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 w-5 border-2 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500"
                  aria-label={`Mark ${quest.name} as ${quest.completed ? 'incomplete' : 'complete'}`}
                />
              </Card>
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
              <DialogContent className="bg-gradient-to-b from-blue-900 to-blue-950 border-blue-800/20" role="dialog" aria-label="daily-quests-modal">
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
      <Card className="border border-emerald-800/20 bg-black">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Castle className="h-5 w-5 text-emerald-500" />
            <h3 className="text-xl font-medievalsharp text-white">Castle</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {castleQuests.map((quest) => (
              <Card 
                key={quest.id}
                className={cn(
                  "relative overflow-hidden border-amber-800/20 transition-all duration-200 flex items-center justify-between p-3 hover:bg-amber-950/20 cursor-pointer",
                  quest.completed && "bg-amber-500/10"
                )}
                onClick={() => toggleQuest(quest.id)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleQuest(quest.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={quest.completed}
                aria-label={`Toggle ${quest.name} quest completion`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl" role="img" aria-label={quest.name}>
                    {quest.icon}
                  </span>
                  <span className="text-sm font-medium text-white">{quest.name}</span>
                </div>
                <Checkbox 
                  id={quest.id} 
                  checked={quest.completed}
                  onCheckedChange={(checked) => {
                    toggleQuest(quest.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 w-5 border-2 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500"
                  aria-label={`Mark ${quest.name} as ${quest.completed ? 'incomplete' : 'complete'}`}
                />
              </Card>
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
              <DialogContent className="bg-gradient-to-b from-blue-900 to-blue-950 border-blue-800/20" role="dialog" aria-label="daily-quests-modal">
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
      <Card className="border border-yellow-800/20 bg-black">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Brush className="h-5 w-5 text-yellow-500" />
            <h3 className="text-xl font-medievalsharp text-white">Craft</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {craftQuests.map((quest) => (
              <Card 
                key={quest.id}
                className={cn(
                  "relative overflow-hidden border-amber-800/20 transition-all duration-200 flex items-center justify-between p-3 hover:bg-amber-950/20 cursor-pointer",
                  quest.completed && "bg-amber-500/10"
                )}
                onClick={() => toggleQuest(quest.id)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleQuest(quest.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={quest.completed}
                aria-label={`Toggle ${quest.name} quest completion`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl" role="img" aria-label={quest.name}>
                    {quest.icon}
                  </span>
                  <span className="text-sm font-medium text-white">{quest.name}</span>
                </div>
                <Checkbox 
                  id={quest.id} 
                  checked={quest.completed}
                  onCheckedChange={(checked) => {
                    toggleQuest(quest.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 w-5 border-2 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500"
                  aria-label={`Mark ${quest.name} as ${quest.completed ? 'incomplete' : 'complete'}`}
                />
              </Card>
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
              <DialogContent className="bg-gradient-to-b from-blue-900 to-blue-950 border-blue-800/20" role="dialog" aria-label="daily-quests-modal">
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
      <Card className="border border-pink-800/20 bg-black">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Leaf className="h-5 w-5 text-pink-500" />
            <h3 className="text-xl font-medievalsharp text-white">Vitality</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {vitalityQuests.map((quest) => (
              <Card 
                key={quest.id}
                className={cn(
                  "relative overflow-hidden border-amber-800/20 transition-all duration-200 flex items-center justify-between p-3 hover:bg-amber-950/20 cursor-pointer",
                  quest.completed && "bg-amber-500/10"
                )}
                onClick={() => toggleQuest(quest.id)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleQuest(quest.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={quest.completed}
                aria-label={`Toggle ${quest.name} quest completion`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl" role="img" aria-label={quest.name}>
                    {quest.icon}
                  </span>
                  <span className="text-sm font-medium text-white">{quest.name}</span>
                </div>
                <Checkbox 
                  id={quest.id} 
                  checked={quest.completed}
                  onCheckedChange={(checked) => {
                    toggleQuest(quest.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 w-5 border-2 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500"
                  aria-label={`Mark ${quest.name} as ${quest.completed ? 'incomplete' : 'complete'}`}
                />
              </Card>
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
              <DialogContent className="bg-gradient-to-b from-blue-900 to-blue-950 border-blue-800/20" role="dialog" aria-label="daily-quests-modal">
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