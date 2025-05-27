"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Award, Calendar, CheckCircle, Clock, Coins, Sword, Trophy, XCircle, PlusCircle, Upload, Edit, X, Save, Settings, RefreshCw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { compressImage } from "@/lib/image-utils"
import { toast } from "@/components/ui/use-toast"
import { showScrollToast } from "@/lib/toast-utils"
import { emitQuestCompletedWithRewards, emitGoldGained, emitExperienceGained } from "@/lib/kingdom-events"
import { supabase } from '@/lib/supabase-client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DailyQuests } from "@/components/daily-quests"
import { Milestones } from "@/components/milestones"
import { Checkbox } from "@/components/ui/checkbox"
import { HeaderSection } from "@/components/HeaderSection"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Quest types
interface Quest {
  id: string
  title: string
  description: string
  category: string
  difficulty: "easy" | "medium" | "hard" | "epic"
  rewards: {
    xp: number
    gold: number
    items?: string[]
  }
  progress: number
  completed: boolean
  deadline?: string
  isNew?: boolean
  isAI?: boolean
}

// TypeScript: Add window.ethereum type to avoid TS error
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function QuestsPage() {
  const [goldBalance, setGoldBalance] = useState(1000)
  const [newQuestName, setNewQuestName] = useState("")
  const [newQuestDescription, setNewQuestDescription] = useState("")
  
  // Enhanced quest state with persistence
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isQuestsLoaded, setIsQuestsLoaded] = useState(false)
  
  // Add save status state (similar to realm)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Default quest data (fallback when no saved data exists)
  const defaultQuests: Quest[] = [
    {
      id: "q1",
      title: "Strength Foundation",
      description: "Complete 100 push-ups in a single day.",
      category: "Might",
      difficulty: "medium",
      rewards: {
        xp: 100,
        gold: 50,
      },
      progress: 75,
      completed: false,
    },
    {
      id: "q2",
      title: "Endurance Builder",
      description: "Run a total of 10km this week.",
      category: "Endurance",
      difficulty: "medium",
      rewards: {
        xp: 150,
        gold: 75,
      },
      progress: 40,
      completed: false,
      deadline: "2025-03-20",
    },
    {
      id: "q3",
      title: "Knowledge Seeker",
      description: "Read for at least 30 minutes every day for a week.",
      category: "Wisdom",
      difficulty: "easy",
      rewards: {
        xp: 75,
        gold: 40,
      },
      progress: 100,
      completed: true,
    },
    {
      id: "q4",
      title: "Nutrition Master",
      description: "Track your macros for 5 consecutive days.",
      category: "Vitality",
      difficulty: "hard",
      rewards: {
        xp: 200,
        gold: 100,
      },
      progress: 60,
      completed: false,
    },
    {
      id: "q5",
      title: "Epic Challenge: Iron Will",
      description: "Complete a 30-day workout streak without missing a day.",
      category: "Resilience",
      difficulty: "epic",
      rewards: {
        xp: 500,
        gold: 250,
        items: ["Epic Armor Piece", "Legendary Title: Iron-Willed"],
      },
      progress: 10,
      completed: false,
      deadline: "2025-04-15",
    },
    {
      id: "q6",
      title: "Winter Warrior",
      description: "Complete 20 outdoor workouts during the winter season.",
      category: "Endurance",
      difficulty: "hard",
      rewards: {
        xp: 250,
        gold: 125,
        items: ["Winter Warrior Title", "Frost Resistance +10"],
      },
      progress: 25,
      completed: false,
      isNew: true,
    },
  ]

  // Daily quests
  const dailyQuests: Quest[] = [
    {
      id: "d1",
      title: "Daily Strength",
      description: "Complete 50 push-ups today.",
      category: "Might",
      difficulty: "easy",
      rewards: {
        xp: 25,
        gold: 15,
      },
      progress: 0,
      completed: false,
    },
    {
      id: "d2",
      title: "Daily Cardio",
      description: "Get 30 minutes of cardio exercise.",
      category: "Endurance",
      difficulty: "easy",
      rewards: {
        xp: 25,
        gold: 15,
      },
      progress: 0,
      completed: false,
    },
    {
      id: "d3",
      title: "Daily Learning",
      description: "Read or study for 20 minutes.",
      category: "Wisdom",
      difficulty: "easy",
      rewards: {
        xp: 25,
        gold: 15,
      },
      progress: 100,
      completed: true,
    },
  ]

  // Weekly challenges
  const weeklyQuests: Quest[] = [
    {
      id: "w1",
      title: "Weekly Strength Challenge",
      description: "Complete 200 push-ups this week.",
      category: "Might",
      difficulty: "medium",
      rewards: {
        xp: 100,
        gold: 50,
      },
      progress: 35,
      completed: false,
      deadline: "2025-03-22",
    },
    {
      id: "w2",
      title: "Weekly Cardio Challenge",
      description: "Run or walk a total of 15km this week.",
      category: "Endurance",
      difficulty: "medium",
      rewards: {
        xp: 100,
        gold: 50,
      },
      progress: 60,
      completed: false,
      deadline: "2025-03-22",
    },
  ]

  // Seasonal event
  const seasonalQuests: Quest[] = [
    {
      id: "s1",
      title: "Spring Challenge: Renewal",
      description: "Complete 30 days of consistent exercise as spring begins.",
      category: "Vitality",
      difficulty: "hard",
      rewards: {
        xp: 300,
        gold: 150,
        items: ["Spring Champion Title", "Seasonal Gear"],
      },
      progress: 20,
      completed: false,
      deadline: "2025-04-21",
      isNew: true,
    },
  ]

  // Function to handle quest progress update with immediate save
  const updateQuestProgress = async (questId: string, newProgress: number) => {
    console.log('=== QUEST PROGRESS UPDATE STARTED ===', { questId, newProgress })
    
    // Find the quest being updated
    const questToUpdate = quests.find((q) => q.id === questId)
    if (!questToUpdate) {
      console.warn('Quest not found:', questId)
      return
    }

    // Update the quest progress
    const updatedQuests = quests.map((quest) =>
      quest.id === questId
        ? {
            ...quest,
            progress: newProgress,
            completed: newProgress >= 100,
          }
        : quest,
    )

    // Update state
    setQuests(updatedQuests)

    // IMMEDIATE SAVE: Save the quests right after updating progress
    console.log('Quest progress updated, triggering immediate save')
    await saveQuestsImmediately(updatedQuests, 0)

    // If quest is completed, give rewards
    if (newProgress >= 100 && !questToUpdate.completed) {
      // Add gold to balance
      setGoldBalance((prev) => {
        const newBalance = prev + questToUpdate.rewards.gold
        localStorage.setItem("levelup-gold-balance", newBalance.toString())
        return newBalance
      })

      // Show completion toast with save status
      const completionMessage = 
        `You've completed: ${questToUpdate.title}\n` +
        `+${questToUpdate.rewards.xp} XP\n` +
        `+${questToUpdate.rewards.gold} Gold` +
        (questToUpdate.rewards.items ? `\nItems: ${questToUpdate.rewards.items.join(", ")}` : '')

      if (saveStatus === 'saved') {
        showScrollToast(
          toast,
          'Quest Complete & Saved ✓',
          completionMessage
        )
      } else if (saveStatus === 'error') {
        showScrollToast(
          toast,
          'Quest Complete (Save Error)',
          completionMessage + '\n⚠️ Progress saved locally'
        )
      } else {
        showScrollToast(
          toast,
          'Quest Complete!',
          completionMessage
        )
      }

      // Emit quest completed event
      emitQuestCompletedWithRewards(
        questToUpdate.title, 
        questToUpdate.rewards.gold, 
        questToUpdate.rewards.xp, 
        'quests-page'
      )
    } else if (newProgress < 100) {
      // Show progress update toast
      toast({
        title: "Progress Updated",
        description: `${questToUpdate.title}: ${newProgress}% complete`,
        duration: 2000
      })
    }
  }

  // Tabs configuration
  interface TabOption {
    value: string;
    label: string;
  }
  
  const tabOptions: TabOption[] = [
    { value: "active", label: "Active Quests" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "seasonal", label: "Seasonal" },
    { value: "completed", label: "Completed" },
    { value: "goals", label: "My Goals" }
  ];
  
  const [activeTab, setActiveTab] = useState("active");
  
  // Pass the tab information to ClientLayout via a custom window property
  useEffect(() => {
    // @ts-ignore - Add a custom property to window for the MobileNav component
    window.mobileNavProps = {
      tabs: tabOptions.map(tab => tab.value),
      activeTab: activeTab,
      onTabChange: setActiveTab
    };
    
    return () => {
      // @ts-ignore - Clean up when component unmounts
      delete window.mobileNavProps;
    };
  }, [activeTab, tabOptions]);
  
  // Load gold balance from localStorage
  useEffect(() => {
    const savedGold = localStorage.getItem("levelup-gold-balance")
    if (savedGold) {
      setGoldBalance(Number.parseInt(savedGold, 10))
    }
    // Check if window.ethereum is defined before accessing it
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      console.log('Ethereum provider detected:', (window as any).ethereum.selectedAddress);
    }
  }, [])

  const [isHovering, setIsHovering] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [coverImage, setCoverImage] = useState("/images/quests-header.jpg")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load header image from localStorage on client side only
  useEffect(() => {
    const savedImage = localStorage.getItem("quests-header-image")
    if (savedImage) {
      setCoverImage(savedImage)
    }
    // Also check window.headerImages if it exists
    if (typeof window !== 'undefined' && window.headerImages?.quests) {
      setCoverImage(window.headerImages.quests)
    }
  }, [])

  // Load quests from localStorage on component mount
  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const { data, error } = await supabase.from('quests').select('*');
        if (error) throw error;
        setQuests(data || []);
      } catch (err) {
        setError('Failed to load quests');
        console.error(err);
      } finally {
        setLoading(false);
        setIsQuestsLoaded(true);
      }
    };

    fetchQuests();
  }, []);

  // Real-time sync for quests
  useEffect(() => {
    // Subscribe to all changes on the quests table
    const channel = supabase
      .channel('public:quests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quests' },
        (payload) => {
          // Refetch quests on any change
          supabase.from('quests').select('*').then(({ data, error }) => {
            if (!error) setQuests(data || []);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Enhanced save function with detailed error handling
  const saveQuestsImmediately = async (questsToSave: Quest[], retryAttempt = 0) => {
    console.log('=== IMMEDIATE QUEST SAVE STARTED ===', { retryAttempt, questCount: questsToSave.length })
    
    try {
      setSaveStatus('saving')
      setSaveError(null)
      setRetryCount(retryAttempt)
      
      // Save to localStorage
      localStorage.setItem('main-quests', JSON.stringify(questsToSave))
      console.log('=== QUEST SAVE SUCCESSFUL ===', { timestamp: new Date(), questCount: questsToSave.length })
      
      setSaveStatus('saved')
      setLastSaveTime(new Date())
      setRetryCount(0)
      
      // Auto-hide success status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)

    } catch (error: any) {
      console.error('=== QUEST SAVE FAILED ===', error)
      
      const errorMessage = error?.message || 'Unknown error'
      setSaveError(errorMessage)
      
      // Retry logic for errors
      if (retryAttempt < 3) {
        const delay = Math.pow(2, retryAttempt) * 1000 // Exponential backoff
        console.log(`Retrying quest save in ${delay}ms...`)
        
        setTimeout(() => {
          saveQuestsImmediately(questsToSave, retryAttempt + 1)
        }, delay)
      } else {
        setSaveStatus('error')
        setRetryCount(3)
        toast({
          title: "Save Failed",
          description: `Quest save failed after ${retryAttempt + 1} attempts.`,
          variant: "destructive"
        })
        
        // Clear error status after 5 seconds
        setTimeout(() => {
          setSaveStatus('idle')
          setRetryCount(0)
        }, 5000)
      }
    }
  }

  // Auto-save quests when they change (but only after initial load)
  useEffect(() => {
    if (isQuestsLoaded && quests.length > 0) {
      const timeoutId = setTimeout(() => {
        saveQuestsImmediately(quests, 0)
      }, 1000) // Debounce saves by 1 second

      return () => clearTimeout(timeoutId)
    }
  }, [quests, isQuestsLoaded])

  // Add keyboard shortcut support for manual save
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Manual save shortcut (Ctrl+S or Cmd+S)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        console.log('Manual quest save triggered by keyboard shortcut')
        
        saveQuestsImmediately(quests, 0);
        toast({
          title: "Manual Save",
          description: "Quest progress saved using keyboard shortcut (Ctrl+S)"
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [quests]); // Removed saveQuestsImmediately and toast from dependencies since they don't change

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    
    try {
      // Compress the image before storing
      const compressedImage = await compressImage(file)
      
      setCoverImage(compressedImage)
      try {
        localStorage.setItem("quests-header-image", compressedImage)
        // Update global state
        if (typeof window !== 'undefined') {
          // @ts-ignore
          window.headerImages.quests = compressedImage
        }
      } catch (storageError) {
        console.error("Error storing image:", storageError)
        toast({
          title: "Error",
          description: "Failed to save image. The image might still be too large.",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error("Error processing image:", err)
      toast({
        title: "Error",
        description: "Failed to process image. Please try a smaller image.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      setShowUploadModal(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleQuestToggle = async (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;
    const newCompleted = !quest.completed;
    const updatedQuests = quests.map(q => 
      q.id === questId ? { ...q, completed: newCompleted } : q
    );
    setQuests(updatedQuests);

    try {
      const { error } = await supabase
        .from('quests')
        .update({ completed: newCompleted })
        .eq('id', questId);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to update quest:', err);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-black text-white">
      {/* Add save status indicator */}
      <div className="absolute top-20 right-4 flex items-center gap-2 z-50">
        {/* Enhanced Save status indicator */}
        {saveStatus === 'saving' && (
          <div className="text-amber-500 text-sm flex items-center gap-1">
            <div className="animate-spin h-4 w-4 border-2 border-amber-500 rounded-full border-t-transparent"></div>
            Saving...
            {retryCount > 0 && <span className="text-xs">(retry {retryCount})</span>}
          </div>
        )}
        {saveStatus === 'saved' && lastSaveTime && (
          <div className="text-green-500 text-sm flex items-center gap-1">
            ✓ Saved {lastSaveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="text-red-500 text-sm flex items-center gap-1" title={saveError || 'Save failed'}>
            ⚠️ Save failed {retryCount > 0 && <span>({retryCount} attempts)</span>}
          </div>
        )}
      </div>

      <HeaderSection
        title="QUESTS"
        imageSrc={coverImage}
        canEdit={true}
        onImageUpload={async (file) => {
          setIsUploading(true);
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            setCoverImage(result);
            localStorage.setItem("quests-header-image", result);
            if (typeof window !== 'undefined') {
              // @ts-ignore
              window.headerImages.quests = result;
            }
            toast({
              title: "Banner Updated",
              description: "Your quests banner has been updated successfully.",
            });
            setIsUploading(false);
            setShowUploadModal(false);
          };
          reader.readAsDataURL(file);
        }}
      />

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 relative">
        {/* Add quest management controls */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">Quest Management</h2>
            <div className="text-sm text-gray-400">
              {quests.filter(q => q.completed).length} / {quests.length} completed
            </div>
          </div>
          
          {/* Settings Dropdown with Manual Save */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Quest settings menu">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  console.log('Manual quest save triggered from settings menu')
                  saveQuestsImmediately(quests, 0);
                  toast({
                    title: "Manual Save",
                    description: "Quest progress saved manually"
                  });
                }}
                aria-label="Save Now"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Now
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (confirm('Are you sure you want to reset all quest progress? This cannot be undone.')) {
                    setQuests(defaultQuests)
                    localStorage.removeItem('main-quests')
                    toast({
                      title: "Quests Reset",
                      description: "All quest progress has been reset to default state."
                    });
                  }
                }}
                aria-label="Reset Quests"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset All Quests
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tabs defaultValue="daily" className="space-y-8">
          <TabsList>
            <TabsTrigger value="daily">Daily Quests</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-8">
            <DailyQuests />
          </TabsContent>

          <TabsContent value="milestones" className="space-y-8">
            <Milestones />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Quest Card Component
function QuestCard({ quest, onProgressUpdate }: { quest: Quest; onProgressUpdate: (progress: number) => void }) {
  const [progress, setProgress] = useState(quest.progress)

  // Update progress and sync with Supabase
  const handleProgressChange = async (newProgress: number) => {
    setProgress(newProgress)
    onProgressUpdate(newProgress)
    try {
      const { error } = await supabase
        .from('quests')
        .update({ progress: newProgress, completed: newProgress >= 100 })
        .eq('id', quest.id);
      if (error) throw error;
      // Refetch quests for real-time sync
      const { data, error: fetchError } = await supabase.from('quests').select('*');
      if (!fetchError) {
        // Optionally update parent state if needed
      }
    } catch (err) {
      console.error('Failed to update quest progress:', err);
    }
  }

  // Calculate days remaining
  const getDaysRemaining = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const questData = {
    id: quest.id,
    title: typeof quest.title === 'string' ? quest.title : '',
    difficulty: (['easy', 'medium', 'hard', 'epic'].includes(quest.difficulty) ? quest.difficulty : 'easy') as 'easy' | 'medium' | 'hard' | 'epic',
    rewards: {
      xp: typeof quest.rewards?.xp === 'number' ? quest.rewards.xp : 0,
      gold: typeof quest.rewards?.gold === 'number' ? quest.rewards.gold : 0,
      items: Array.isArray(quest.rewards?.items) ? quest.rewards.items : [],
    },
  };

  return (
    <Card 
      className={`relative bg-gradient-to-b from-black to-gray-900 border-amber-800/20 ${quest.isNew ? "border-amber-500" : ""} ${quest.completed ? "bg-amber-50/30 dark:bg-amber-900/10" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={`${quest.title} quest card`}
      onClick={() => !quest.completed && handleProgressChange(100)}
      onKeyDown={(e) => e.key === 'Enter' && !quest.completed && handleProgressChange(100)}
    >
      {/* Checkbox positioned absolutely in the top right */}
      <div className="absolute top-4 right-4 z-10">
        <Checkbox
          checked={quest.completed}
          onCheckedChange={() => handleProgressChange(quest.completed ? 0 : 100)}
          aria-label={`Mark ${quest.title} as ${quest.completed ? 'incomplete' : 'complete'}`}
          className="h-6 w-6 border-2 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500"
        />
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1 pr-8">
            <CardTitle className="font-serif text-white">{quest.title}</CardTitle>
            <CardDescription className="text-gray-300">{quest.description}</CardDescription>
          </div>
          <div className="flex gap-2">
            {quest.isNew && <Badge className="bg-amber-500 text-white">New</Badge>}
            {quest.isAI && <Badge className="bg-purple-500 text-white">AI</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge
            className={
              quest.difficulty === "easy"
                ? "bg-green-500 text-white"
                : quest.difficulty === "medium"
                  ? "bg-blue-500 text-white"
                  : quest.difficulty === "hard"
                    ? "bg-amber-500 text-white"
                    : "bg-red-500 text-white"
            }
          >
            {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
          </Badge>
          <Badge className="text-amber-300 border-amber-800/20">{quest.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" aria-label={`Quest progress: ${progress}%`} />
          </div>

          <div className="flex flex-wrap gap-4 text-white">
            <div className="flex items-center gap-1 text-sm">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>{quest.rewards.xp} XP</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span>{quest.rewards.gold} Gold</span>
            </div>
            {quest.rewards.items &&
              quest.rewards.items.map((item, i) => (
                <div key={i} className="flex items-center gap-1 text-sm">
                  <Award className="h-4 w-4 text-purple-500" />
                  <span>{item}</span>
                </div>
              ))}
          </div>

          {quest.deadline && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Clock className="h-4 w-4" />
              <span>
                {getDaysRemaining(quest.deadline) > 0
                  ? `${getDaysRemaining(quest.deadline)} days remaining`
                  : "Due today!"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {quest.completed ? (
          <Button className="w-full text-white" variant="outline" disabled aria-label="Quest completed">
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Completed
          </Button>
        ) : (
          <div className="w-full flex gap-2">
            <Button
              className="flex-1 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white"
              onClick={(e) => {
                e.stopPropagation();
                handleProgressChange(Math.min(100, progress + 25));
              }}
              aria-label="Update quest progress"
            >
              Update Progress
            </Button>
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                handleProgressChange(100);
              }} 
              className="text-white"
              aria-label="Mark quest as complete"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark Complete
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
