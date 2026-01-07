"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Sword, Brain, Shield, Castle, Brush, Leaf, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useSupabaseSync } from '@/hooks/use-supabase-sync'
import { questCache } from '@/lib/cache-manager';

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
  const checkForReset = useCallback(() => {
    const currentDate = new Date().toISOString().slice(0, 10);
    const lastReset = localStorage.getItem('daily-quests-reset-date');

    console.log('[🔍 DAILY QUESTS DEBUG] Checking for daily reset:', {
      currentDate,
      questItemsLength: questItems.length,
      completedQuests: questItems.filter(q => q.completed).length
    });

    if (lastReset !== currentDate) {
      console.log('[🔍 DAILY QUESTS DEBUG] Daily reset detected, clearing quests and cache');

      // Clear quest cache when resetting
      questCache.clear();

      // Reset quests - force all quests to show as incomplete after daily reset
      setQuestItems(prevQuests =>
        prevQuests.map(quest => ({
          ...quest,
          completed: false // Force all quests to show as incomplete after reset
        }))
      );
      localStorage.setItem('daily-quests-reset-date', currentDate);

      console.log('[🔍 DAILY QUESTS DEBUG] Daily quests reset completed');
    } else {
      console.log('[🔍 DAILY QUESTS DEBUG] No reset needed, using existing quests');
    }
  }, [questItems.length]);

  // Check for daily reset
  useEffect(() => {
    checkForReset()
    const interval = setInterval(checkForReset, 60000)
    return () => clearInterval(interval)
  }, [questItems, checkForReset])

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

  // Toggle quest completion with smart system integration
  const toggleQuest = async (questId: string) => {
    const updatedQuests = questItems.map(quest =>
      quest.id === questId
        ? { ...quest, completed: !quest.completed }
        : quest
    )

    setQuestItems(updatedQuests)

    // Find the quest to get its details
    const toggledQuest = updatedQuests.find(q => q.id === questId)
    if (!toggledQuest) return

    // If user is signed in, use smart quest completion system
    if (isSignedIn) {
      try {
        console.log('[Daily Quests] Using smart quest completion system...')

        const response = await fetch('/api/quests/smart-completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questId: questId,
            completed: toggledQuest.completed,
            xpReward: toggledQuest.rewards.experience,
            goldReward: toggledQuest.rewards.gold
          }),
        })

        if (!response.ok) {
          console.error('[Daily Quests] Smart completion failed:', response.status)
          toast({
            title: "Sync Warning",
            description: "Quest updated locally. Will retry sync later.",
            variant: "destructive"
          })
        } else {
          const result = await response.json()
          console.log('[Daily Quests] Smart completion result:', result)

          if (toggledQuest.completed) {
            console.info(`Daily quest completed: ${toggledQuest.name}`)
            toast({
              title: "Quest Completed! 🎉",
              description: `Earned ${toggledQuest.rewards.experience} XP and ${toggledQuest.rewards.gold} Gold!`,
            })
          }
        }
      } catch (error) {
        console.error('[Daily Quests] Smart completion error:', error)
        toast({
          title: "Sync Warning",
          description: "Quest updated locally. Will retry sync later.",
          variant: "destructive"
        })
      }
    } else {
      // Fallback to localStorage for non-signed-in users
      try {
        console.info('=== DAILY QUEST SAVE SUCCESSFUL (local) ===', { questId, timestamp: new Date() })
      } catch (error) {
        console.error('=== DAILY QUEST SAVE FAILED ===', error)
        toast({
          title: "Save Warning",
          description: "Quest updated locally. Will sync when connection is restored.",
          variant: "destructive"
        })
      }
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
              <DialogContent className="sm:max-w-md max-h-[90vh] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden flex flex-col shadow-2xl" role="dialog" aria-label="daily-quests-modal">
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-[100px] animate-pulse" />
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide">
                  <DialogHeader className="text-center items-center pb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold uppercase tracking-widest mb-4 text-red-500 shadow-sm">
                      <Plus className="w-3 h-3" />
                      Warrior&apos;s Scroll
                    </div>
                    <DialogTitle className="text-3xl font-serif text-white tracking-tight">Draft Might Quest</DialogTitle>
                    <DialogDescription className="text-zinc-500 mt-2">
                      A challenge of strength and physical endurance.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="quest-name-might" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Quest Title</Label>
                      <Input
                        id="quest-name-might"
                        value={newQuestName}
                        onChange={(e) => setNewQuestName(e.target.value)}
                        placeholder="e.g., Slay the giant (300 pushups)..."
                        className="bg-zinc-900/60 border-white/5 focus:border-red-500/50 h-12 rounded-xl px-4 text-zinc-200 placeholder:text-zinc-600 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quest-icon-might" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Icon (Emoji)</Label>
                        <Input
                          id="quest-icon-might"
                          value={newQuestIcon}
                          onChange={(e) => setNewQuestIcon(e.target.value)}
                          className="bg-zinc-900/60 border-white/5 focus:border-red-500/50 h-12 rounded-xl px-4 text-zinc-200"
                          placeholder="🏋️"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quest-frequency-might" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Frequency</Label>
                        <Input
                          id="quest-frequency-might"
                          value={newQuestFrequency}
                          onChange={(e) => setNewQuestFrequency(e.target.value)}
                          className="bg-zinc-900/60 border-white/5 focus:border-red-500/50 h-12 rounded-xl px-4 text-zinc-200"
                          placeholder="Daily"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quest-experience-might" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">XP Reward</Label>
                        <Input
                          id="quest-experience-might"
                          type="number"
                          value={newQuestExperience}
                          onChange={(e) => setNewQuestExperience(Number(e.target.value))}
                          className="bg-zinc-900/60 border-white/5 focus:border-red-500/50 h-12 rounded-xl px-4 text-zinc-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quest-gold-might" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Gold Reward</Label>
                        <Input
                          id="quest-gold-might"
                          type="number"
                          value={newQuestGold}
                          onChange={(e) => setNewQuestGold(Number(e.target.value))}
                          className="bg-zinc-900/60 border-white/5 focus:border-red-500/50 h-12 rounded-xl px-4 text-zinc-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border-t border-white/5 flex flex-row gap-3">
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12 rounded-xl text-zinc-500 hover:text-zinc-200">Cancel</Button>
                  <Button onClick={addNewQuest} className="flex-[2] h-12 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg border-t border-white/10" aria-label="Add new quest">
                    Enshrine Quest
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
              <DialogContent className="sm:max-w-md max-h-[90vh] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden flex flex-col shadow-2xl" role="dialog" aria-label="daily-quests-modal">
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide">
                  <DialogHeader className="text-center items-center pb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest mb-4 text-blue-500 shadow-sm">
                      <Plus className="w-3 h-3" />
                      Scholar&apos;s Ledger
                    </div>
                    <DialogTitle className="text-3xl font-serif text-white tracking-tight">Draft Knowledge Quest</DialogTitle>
                    <DialogDescription className="text-zinc-500 mt-2">
                      Record a new pursuit of wisdom and intellect.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="quest-name" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Quest Title</Label>
                      <Input
                        id="quest-name"
                        value={newQuestName}
                        onChange={(e) => setNewQuestName(e.target.value)}
                        placeholder="e.g., Decipher the ancient scripts (30m reading)..."
                        className="bg-zinc-900/60 border-white/5 focus:border-blue-500/50 h-12 rounded-xl px-4 text-zinc-200 placeholder:text-zinc-600 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quest-icon" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Icon (Emoji)</Label>
                        <Input
                          id="quest-icon"
                          value={newQuestIcon}
                          onChange={(e) => setNewQuestIcon(e.target.value)}
                          className="bg-zinc-900/60 border-white/5 focus:border-blue-500/50 h-12 rounded-xl px-4 text-zinc-200"
                          placeholder="📚"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quest-frequency" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Frequency</Label>
                        <Input
                          id="quest-frequency"
                          value={newQuestFrequency}
                          onChange={(e) => setNewQuestFrequency(e.target.value)}
                          className="bg-zinc-900/60 border-white/5 focus:border-blue-500/50 h-12 rounded-xl px-4 text-zinc-200"
                          placeholder="Daily"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quest-experience" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">XP Reward</Label>
                        <Input
                          id="quest-experience"
                          type="number"
                          value={newQuestExperience}
                          onChange={(e) => setNewQuestExperience(Number(e.target.value))}
                          className="bg-zinc-900/60 border-white/5 focus:border-blue-500/50 h-12 rounded-xl px-4 text-zinc-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quest-gold" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Gold Reward</Label>
                        <Input
                          id="quest-gold"
                          type="number"
                          value={newQuestGold}
                          onChange={(e) => setNewQuestGold(Number(e.target.value))}
                          className="bg-zinc-900/60 border-white/5 focus:border-blue-500/50 h-12 rounded-xl px-4 text-zinc-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border-t border-white/5 flex flex-row gap-3">
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12 rounded-xl text-zinc-500 hover:text-zinc-200">Cancel</Button>
                  <Button onClick={addNewQuest} className="flex-[2] h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg border-t border-white/10" aria-label="Add new quest">
                    Enshrine Quest
                  </Button>
                </div>
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
              <DialogContent className="sm:max-w-md max-h-[90vh] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden flex flex-col shadow-2xl" role="dialog" aria-label="daily-quests-modal">
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] animate-pulse" />
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide">
                  <DialogHeader className="text-center items-center pb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold uppercase tracking-widest mb-4 text-purple-500 shadow-sm">
                      <Plus className="w-3 h-3" />
                      Knight&apos;s Code
                    </div>
                    <DialogTitle className="text-3xl font-serif text-white tracking-tight">Draft Honor Quest</DialogTitle>
                    <DialogDescription className="text-zinc-500 mt-2">
                      A new deed of discipline and integrity for your character.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="quest-name" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Quest Title</Label>
                      <Input
                        id="quest-name"
                        value={newQuestName}
                        onChange={(e) => setNewQuestName(e.target.value)}
                        placeholder="e.g., Hold the line (Wake up before 7am)..."
                        className="bg-zinc-900/60 border-white/5 focus:border-purple-500/50 h-12 rounded-xl px-4 text-zinc-200 placeholder:text-zinc-600 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quest-icon" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Icon (Emoji)</Label>
                        <Input
                          id="quest-icon"
                          value={newQuestIcon}
                          onChange={(e) => setNewQuestIcon(e.target.value)}
                          className="bg-zinc-900/60 border-white/5 focus:border-purple-500/50 h-12 rounded-xl px-4 text-zinc-200"
                          placeholder="🛡️"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quest-frequency" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Frequency</Label>
                        <Input
                          id="quest-frequency"
                          value={newQuestFrequency}
                          onChange={(e) => setNewQuestFrequency(e.target.value)}
                          className="bg-zinc-900/60 border-white/5 focus:border-purple-500/50 h-12 rounded-xl px-4 text-zinc-200"
                          placeholder="Daily"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quest-experience" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">XP Reward</Label>
                        <Input
                          id="quest-experience"
                          type="number"
                          value={newQuestExperience}
                          onChange={(e) => setNewQuestExperience(Number(e.target.value))}
                          className="bg-zinc-900/60 border-white/5 focus:border-purple-500/50 h-12 rounded-xl px-4 text-zinc-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quest-gold" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Gold Reward</Label>
                        <Input
                          id="quest-gold"
                          type="number"
                          value={newQuestGold}
                          onChange={(e) => setNewQuestGold(Number(e.target.value))}
                          className="bg-zinc-900/60 border-white/5 focus:border-purple-500/50 h-12 rounded-xl px-4 text-zinc-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border-t border-white/5 flex flex-row gap-3">
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12 rounded-xl text-zinc-500 hover:text-zinc-200">Cancel</Button>
                  <Button onClick={addNewQuest} className="flex-[2] h-12 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg border-t border-white/10" aria-label="Add new quest">
                    Enshrine Quest
                  </Button>
                </div>
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
              <DialogContent className="sm:max-w-md max-h-[90vh] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden flex flex-col shadow-2xl" role="dialog" aria-label="daily-quests-modal">
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" />
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide">
                  <DialogHeader className="text-center items-center pb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest mb-4 text-emerald-500 shadow-sm">
                      <Plus className="w-3 h-3" />
                      Castle Manifest
                    </div>
                    <DialogTitle className="text-3xl font-serif text-white tracking-tight">Draft Castle Quest</DialogTitle>
                    <DialogDescription className="text-zinc-500 mt-2">
                      A task of maintenance and improvement for your sanctuary.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="quest-name" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Quest Title</Label>
                      <Input
                        id="quest-name"
                        value={newQuestName}
                        onChange={(e) => setNewQuestName(e.target.value)}
                        placeholder="e.g., Fortify the kitchen (Wash dishes)..."
                        className="bg-zinc-900/60 border-white/5 focus:border-emerald-500/50 h-12 rounded-xl px-4 text-zinc-200 placeholder:text-zinc-600 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quest-icon" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Icon (Emoji)</Label>
                        <Input
                          id="quest-icon"
                          value={newQuestIcon}
                          onChange={(e) => setNewQuestIcon(e.target.value)}
                          className="bg-zinc-900/60 border-white/5 focus:border-emerald-500/50 h-12 rounded-xl px-4 text-zinc-200"
                          placeholder="🏰"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quest-frequency" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Frequency</Label>
                        <Input
                          id="quest-frequency"
                          value={newQuestFrequency}
                          onChange={(e) => setNewQuestFrequency(e.target.value)}
                          className="bg-zinc-900/60 border-white/5 focus:border-emerald-500/50 h-12 rounded-xl px-4 text-zinc-200"
                          placeholder="Daily"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quest-experience" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">XP Reward</Label>
                        <Input
                          id="quest-experience"
                          type="number"
                          value={newQuestExperience}
                          onChange={(e) => setNewQuestExperience(Number(e.target.value))}
                          className="bg-zinc-900/60 border-white/5 focus:border-emerald-500/50 h-12 rounded-xl px-4 text-zinc-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quest-gold" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Gold Reward</Label>
                        <Input
                          id="quest-gold"
                          type="number"
                          value={newQuestGold}
                          onChange={(e) => setNewQuestGold(Number(e.target.value))}
                          className="bg-zinc-900/60 border-white/5 focus:border-emerald-500/50 h-12 rounded-xl px-4 text-zinc-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border-t border-white/5 flex flex-row gap-3">
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12 rounded-xl text-zinc-500 hover:text-zinc-200">Cancel</Button>
                  <Button onClick={addNewQuest} className="flex-[2] h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg border-t border-white/10" aria-label="Add new quest">
                    Enshrine Quest
                  </Button>
                </div>
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
              <DialogContent className="sm:max-w-md max-h-[90vh] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden flex flex-col shadow-2xl" role="dialog" aria-label="daily-quests-modal">
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] animate-pulse" />
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide">
                  <DialogHeader className="text-center items-center pb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold uppercase tracking-widest mb-4 text-amber-500 shadow-sm">
                      <Plus className="w-3 h-3" />
                      Artisan&apos;s Scroll
                    </div>
                    <DialogTitle className="text-3xl font-serif text-white tracking-tight">Draft Craft Quest</DialogTitle>
                    <DialogDescription className="text-zinc-500 mt-2">
                      A task for your inner creator and master builder.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="quest-name" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Quest Title</Label>
                      <Input
                        id="quest-name"
                        value={newQuestName}
                        onChange={(e) => setNewQuestName(e.target.value)}
                        placeholder="e.g., Forge a new vision (1 hr drawing)..."
                        className="bg-zinc-900/60 border-white/5 focus:border-amber-500/50 h-12 rounded-xl px-4 text-zinc-200 placeholder:text-zinc-600 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quest-icon" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Icon (Emoji)</Label>
                        <Input
                          id="quest-icon"
                          value={newQuestIcon}
                          onChange={(e) => setNewQuestIcon(e.target.value)}
                          className="bg-zinc-900/60 border-white/5 focus:border-amber-500/50 h-12 rounded-xl px-4 text-zinc-200"
                          placeholder="🎨"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quest-frequency" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Frequency</Label>
                        <Input
                          id="quest-frequency"
                          value={newQuestFrequency}
                          onChange={(e) => setNewQuestFrequency(e.target.value)}
                          className="bg-zinc-900/60 border-white/5 focus:border-amber-500/50 h-12 rounded-xl px-4 text-zinc-200"
                          placeholder="Daily"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quest-experience" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">XP Reward</Label>
                        <Input
                          id="quest-experience"
                          type="number"
                          value={newQuestExperience}
                          onChange={(e) => setNewQuestExperience(Number(e.target.value))}
                          className="bg-zinc-900/60 border-white/5 focus:border-amber-500/50 h-12 rounded-xl px-4 text-zinc-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quest-gold" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Gold Reward</Label>
                        <Input
                          id="quest-gold"
                          type="number"
                          value={newQuestGold}
                          onChange={(e) => setNewQuestGold(Number(e.target.value))}
                          className="bg-zinc-900/60 border-white/5 focus:border-amber-500/50 h-12 rounded-xl px-4 text-zinc-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border-t border-white/5 flex flex-row gap-3">
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12 rounded-xl text-zinc-500 hover:text-zinc-200">Cancel</Button>
                  <Button onClick={addNewQuest} className="flex-[2] h-12 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg border-t border-white/10" aria-label="Add new quest">
                    Enshrine Quest
                  </Button>
                </div>
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
              <DialogContent className="sm:max-w-md max-h-[90vh] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden flex flex-col shadow-2xl" role="dialog" aria-label="daily-quests-modal">
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-[100px] animate-pulse" />
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide">
                  <DialogHeader className="text-center items-center pb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-[10px] font-bold uppercase tracking-widest mb-4 text-pink-500 shadow-sm">
                      <Plus className="w-3 h-3" />
                      Vitality Journal
                    </div>
                    <DialogTitle className="text-3xl font-serif text-white tracking-tight">Draft Vitality Quest</DialogTitle>
                    <DialogDescription className="text-zinc-500 mt-2">
                      A task for your long-term health and vibrant energy.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="quest-name" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Quest Title</Label>
                      <Input
                        id="quest-name"
                        value={newQuestName}
                        onChange={(e) => setNewQuestName(e.target.value)}
                        placeholder="e.g., Elixir of Life (Drink 2L water)..."
                        className="bg-zinc-900/60 border-white/5 focus:border-pink-500/50 h-12 rounded-xl px-4 text-zinc-200 placeholder:text-zinc-600 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quest-icon" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Icon (Emoji)</Label>
                        <Input
                          id="quest-icon"
                          value={newQuestIcon}
                          onChange={(e) => setNewQuestIcon(e.target.value)}
                          className="bg-zinc-900/60 border-white/5 focus:border-pink-500/50 h-12 rounded-xl px-4 text-zinc-200"
                          placeholder="💧"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quest-frequency" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Frequency</Label>
                        <Input
                          id="quest-frequency"
                          value={newQuestFrequency}
                          onChange={(e) => setNewQuestFrequency(e.target.value)}
                          className="bg-zinc-900/60 border-white/5 focus:border-pink-500/50 h-12 rounded-xl px-4 text-zinc-200"
                          placeholder="Daily"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quest-experience" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">XP Reward</Label>
                        <Input
                          id="quest-experience"
                          type="number"
                          value={newQuestExperience}
                          onChange={(e) => setNewQuestExperience(Number(e.target.value))}
                          className="bg-zinc-900/60 border-white/5 focus:border-pink-500/50 h-12 rounded-xl px-4 text-zinc-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quest-gold" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Gold Reward</Label>
                        <Input
                          id="quest-gold"
                          type="number"
                          value={newQuestGold}
                          onChange={(e) => setNewQuestGold(Number(e.target.value))}
                          className="bg-zinc-900/60 border-white/5 focus:border-pink-500/50 h-12 rounded-xl px-4 text-zinc-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border-t border-white/5 flex flex-row gap-3">
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 h-12 rounded-xl text-zinc-500 hover:text-zinc-200">Cancel</Button>
                  <Button onClick={addNewQuest} className="flex-[2] h-12 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl shadow-lg border-t border-white/10" aria-label="Add new quest">
                    Enshrine Quest
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 