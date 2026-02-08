"use client"

import { useState, useEffect, useCallback } from "react"
import { Sword, Brain, Shield, Castle, Brush, Leaf } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useSupabaseSync } from '@/hooks/use-supabase-sync'
import { questCache } from '@/lib/cache-manager'
import { CategoryQuestSection, type QuestItem } from "./category-quest-section"
import { type QuestCategory } from "./quest-form-dialog"

// Default quest data - organized by category
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

// Category configuration for rendering
const categories: Array<{
  key: QuestCategory
  icon: typeof Sword
}> = [
    { key: 'might', icon: Sword },
    { key: 'knowledge', icon: Brain },
    { key: 'honor', icon: Shield },
    { key: 'castle', icon: Castle },
    { key: 'craft', icon: Brush },
    { key: 'vitality', icon: Leaf },
  ]

export function DailyQuests() {
  const { isSignedIn } = useSupabaseSync()

  // Quest state
  const [questItems, setQuestItems] = useState<QuestItem[]>([])

  // New quest form state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogCategory, setDialogCategory] = useState<QuestCategory>('might')
  const [newQuestName, setNewQuestName] = useState("")
  const [newQuestIcon, setNewQuestIcon] = useState("")
  const [newQuestExperience, setNewQuestExperience] = useState(50)
  const [newQuestGold, setNewQuestGold] = useState(25)
  const [newQuestFrequency, setNewQuestFrequency] = useState("")

  // Check for daily reset
  const checkForReset = useCallback(() => {
    const currentDate = new Date().toISOString().slice(0, 10)
    const lastReset = localStorage.getItem('daily-quests-reset-date')

    if (lastReset !== currentDate) {
      questCache.clear()
      setQuestItems(prevQuests =>
        prevQuests.map(quest => ({ ...quest, completed: false }))
      )
      localStorage.setItem('daily-quests-reset-date', currentDate)
    }
  }, [])

  // Check for daily reset on mount and interval
  useEffect(() => {
    checkForReset()
    const interval = setInterval(checkForReset, 60000)
    return () => clearInterval(interval)
  }, [checkForReset])

  // Load quests on mount
  useEffect(() => {
    setQuestItems(defaultQuestItems)
  }, [isSignedIn])

  // Toggle quest completion
  const toggleQuest = useCallback(async (questId: string) => {
    setQuestItems(prev => prev.map(quest =>
      quest.id === questId ? { ...quest, completed: !quest.completed } : quest
    ))

    const toggledQuest = questItems.find(q => q.id === questId)
    if (!toggledQuest) return

    const newCompletedState = !toggledQuest.completed

    if (isSignedIn) {
      try {
        const response = await fetch('/api/quests/smart-completion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questId,
            completed: newCompletedState,
            xpReward: toggledQuest.rewards.experience,
            goldReward: toggledQuest.rewards.gold
          }),
        })

        if (!response.ok) {
          toast({
            title: "Sync Warning",
            description: "Quest updated locally. Will retry sync later.",
            variant: "destructive"
          })
        } else if (newCompletedState) {
          toast({
            title: "Quest Completed! 🎉",
            description: `Earned ${toggledQuest.rewards.experience} XP and ${toggledQuest.rewards.gold} Gold!`,
          })
        }
      } catch {
        toast({
          title: "Sync Warning",
          description: "Quest updated locally. Will retry sync later.",
          variant: "destructive"
        })
      }
    }
  }, [questItems, isSignedIn])

  // Add new quest
  const addNewQuest = useCallback(() => {
    if (newQuestName.trim() === "") return

    const newQuest: QuestItem = {
      id: Date.now().toString(),
      name: newQuestName,
      icon: newQuestIcon || "❓",
      category: dialogCategory,
      completed: false,
      rewards: {
        experience: newQuestExperience,
        gold: newQuestGold
      },
      ...(newQuestFrequency.trim() ? { frequency: newQuestFrequency.trim() } : {})
    }

    setQuestItems(prev => [...prev, newQuest])

    // Reset form
    setNewQuestName("")
    setNewQuestIcon("")
    setNewQuestExperience(50)
    setNewQuestGold(25)
    setNewQuestFrequency("")
    setIsDialogOpen(false)
  }, [newQuestName, newQuestIcon, dialogCategory, newQuestExperience, newQuestGold, newQuestFrequency])

  // Dialog open handler
  const handleDialogOpenChange = useCallback((open: boolean, category: QuestCategory) => {
    setIsDialogOpen(open)
    if (open) setDialogCategory(category)
  }, [])

  // Filter quests by category
  const getQuestsByCategory = (category: QuestCategory) =>
    questItems.filter(item => item.category === category)

  // Calculate stats
  const completedCount = questItems.filter(item => item.completed).length
  const totalCount = questItems.length
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <Card className="bg-black/80 border-amber-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-amber-500 flex items-center justify-between">
            <span>Daily Quests</span>
            <span className="text-sm font-normal">{completedCount}/{totalCount} ({completionPercentage}%)</span>
          </CardTitle>
          <CardDescription>Track your daily tasks by category</CardDescription>
        </CardHeader>
      </Card>

      {/* Category Sections */}
      {categories.map(({ key, icon }) => (
        <CategoryQuestSection
          key={key}
          category={key}
          icon={icon}
          quests={getQuestsByCategory(key)}
          onToggleQuest={toggleQuest}
          isDialogOpen={isDialogOpen}
          currentDialogCategory={dialogCategory}
          onDialogOpenChange={handleDialogOpenChange}
          questName={newQuestName}
          onQuestNameChange={setNewQuestName}
          questIcon={newQuestIcon}
          onQuestIconChange={setNewQuestIcon}
          questFrequency={newQuestFrequency}
          onQuestFrequencyChange={setNewQuestFrequency}
          questExperience={newQuestExperience}
          onQuestExperienceChange={setNewQuestExperience}
          questGold={newQuestGold}
          onQuestGoldChange={setNewQuestGold}
          onAddQuest={addNewQuest}
        />
      ))}
    </div>
  )
}