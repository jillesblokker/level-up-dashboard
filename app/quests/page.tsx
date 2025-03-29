"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Award, Calendar, CheckCircle, Clock, Coins, Sword, Trophy, XCircle, PlusCircle, Upload, Edit, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { compressImage } from "@/lib/image-utils"
import { toast } from "@/components/ui/use-toast"
import { showScrollToast } from "@/lib/toast-utils"

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

// Add this type declaration at the top of the file, after the imports
declare global {
  interface Window {
    headerImages?: {
      quests?: string;
    };
  }
}

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

// AI Quest Generator
function generateAIQuest(userGoals: string[]): Quest {
  // Sample categories and templates
  const categories = ["Might", "Endurance", "Wisdom", "Vitality", "Resilience", "Dexterity"]
  const difficultyLevels: ("easy" | "medium" | "hard" | "epic")[] = ["easy", "medium", "hard", "epic"]

  const templates = [
    { title: "Master of {skill}", description: "Complete {count} {activity} sessions this week." },
    { title: "{skill} Champion", description: "Reach a streak of {count} days doing {activity}." },
    { title: "The {adjective} {role}", description: "Perform {activity} for {count} minutes each day." },
    { title: "{skill} Explorer", description: "Try {count} different types of {activity} this month." },
  ]

  const activities = {
    Might: ["strength training", "push-ups", "pull-ups", "weight lifting", "bodyweight exercises"],
    Endurance: ["running", "cycling", "swimming", "cardio", "HIIT workouts"],
    Wisdom: ["reading", "learning", "studying", "meditation", "problem-solving"],
    Vitality: ["meal prep", "healthy eating", "hydration", "nutrition tracking", "cooking"],
    Resilience: ["sleep tracking", "stress management", "recovery", "stretching", "rest days"],
    Dexterity: ["task completion", "project work", "skill practice", "time management", "focus sessions"],
  }

  const adjectives = ["Mighty", "Swift", "Wise", "Vital", "Resilient", "Agile", "Focused", "Disciplined"]
  const roles = ["Warrior", "Runner", "Sage", "Alchemist", "Guardian", "Artisan", "Ranger", "Knight"]

  // Select random elements
  const category = categories[Math.floor(Math.random() * categories.length)]
  const template = templates[Math.floor(Math.random() * templates.length)]
  const activity =
    activities[category as keyof typeof activities][
      Math.floor(Math.random() * activities[category as keyof typeof activities].length)
    ]
  const count = Math.floor(Math.random() * 5) + 3 // 3-7
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const role = roles[Math.floor(Math.random() * roles.length)]
  const difficulty = difficultyLevels[Math.floor(Math.random() * difficultyLevels.length)]

  // Calculate rewards based on difficulty
  const baseXP = difficulty === "easy" ? 50 : difficulty === "medium" ? 100 : difficulty === "hard" ? 200 : 500
  const baseGold = difficulty === "easy" ? 25 : difficulty === "medium" ? 50 : difficulty === "hard" ? 100 : 250

  // Generate title and description
  const title = template.title.replace("{skill}", category).replace("{adjective}", adjective).replace("{role}", role)

  let description = template.description.replace("{count}", count.toString()).replace("{activity}", activity)

  // Add user goal context if available
  if (userGoals.length > 0) {
    const randomGoal = userGoals[Math.floor(Math.random() * userGoals.length)]
    description += ` This will help you achieve your goal: "${randomGoal}".`
  }

  // Create deadline (7-14 days from now)
  const daysToAdd = Math.floor(Math.random() * 7) + 7
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + daysToAdd)

  return {
    id: `ai-quest-${Date.now()}`,
    title,
    description,
    category,
    difficulty,
    rewards: {
      xp: baseXP,
      gold: baseGold,
      items: difficulty === "epic" ? ["Epic Gear Piece"] : undefined,
    },
    progress: 0,
    completed: false,
    deadline: deadline.toISOString().split("T")[0],
    isNew: true,
    isAI: true,
  }
}

export default function QuestsPage() {
  const [goldBalance, setGoldBalance] = useState(1000)
  const [showAIQuestDialog, setShowAIQuestDialog] = useState(false)
  const [userGoals, setUserGoals] = useState<string[]>([
    "Run a 5K race in under 30 minutes",
    "Read 12 books this year",
    "Learn to cook 5 new healthy recipes",
    "Meditate for 10 minutes daily",
  ])
  const [newGoal, setNewGoal] = useState("")
  const [generatedQuest, setGeneratedQuest] = useState<Quest | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newQuestName, setNewQuestName] = useState("")
  const [newQuestDescription, setNewQuestDescription] = useState("")
  const [generatingQuest, setGeneratingQuest] = useState(false)
  const [quests, setQuests] = useState<Quest[]>([
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
  ])

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

  // Function to handle quest progress update
  const updateQuestProgress = (questId: string, newProgress: number) => {
    // Update the quest progress
    setQuests((prevQuests) =>
      prevQuests.map((quest) =>
        quest.id === questId
          ? {
              ...quest,
              progress: newProgress,
              completed: newProgress >= 100,
            }
          : quest,
      ),
    )

    // If quest is completed, give rewards
    const completedQuest = quests.find((q) => q.id === questId)
    if (completedQuest && newProgress >= 100 && !completedQuest.completed) {
      // Add gold to balance
      setGoldBalance((prev) => prev + completedQuest.rewards.gold)

      // Show completion toast
      showScrollToast(
        'questComplete',
        undefined,
        `You've completed: ${completedQuest.title}\n` +
        `+${completedQuest.rewards.xp} XP\n` +
        `+${completedQuest.rewards.gold} Gold` +
        (completedQuest.rewards.items ? `\nItems: ${completedQuest.rewards.items.join(", ")}` : '')
      )
    }
  }

  // Function to generate a new AI quest
  const generateNewAIQuest = () => {
    const newQuest = generateAIQuest(userGoals)
    setGeneratedQuest(newQuest)
    setShowAIQuestDialog(true)
  }

  // Function to accept the generated quest
  const acceptGeneratedQuest = () => {
    if (generatedQuest) {
      setQuests((prev) => [generatedQuest, ...prev])
      setShowAIQuestDialog(false)
      setGeneratedQuest(null)

      toast({
        title: "New Quest Accepted!",
        description: `"${generatedQuest.title}" has been added to your quest log.`,
      })
    }
  }

  // Function to add a new user goal
  const addUserGoal = () => {
    if (newGoal.trim()) {
      setUserGoals((prev) => [...prev, newGoal.trim()])
      setNewGoal("")

      toast({
        title: "Goal Added",
        description: "Your new goal has been added. AI quests will now be tailored to this goal.",
      })
    }
  }

  // Tabs configuration
  const tabOptions = [
    { value: "active", label: "Active Quests" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "seasonal", label: "Seasonal" },
    { value: "completed", label: "Completed" },
    { value: "goals", label: "My Goals" },
  ]
  
  const [activeTab, setActiveTab] = useState("active")
  
  // Pass the tab information to ClientLayout via a custom window property
  useEffect(() => {
    // @ts-ignore - Add a custom property to window for the MobileNav component
    window.mobileNavProps = {
      tabs: tabOptions,
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Image */}
      <div 
        className="relative h-[300px] md:h-[400px] lg:h-[600px] w-full max-w-full overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Image
          src={coverImage}
          alt="Quests"
          fill
          className="object-cover"
          priority
          quality={100}
          onError={() => {
            setCoverImage("/images/default-quests-header.jpg")
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
        
        {/* Edit button that appears on hover */}
        {isHovering && !showUploadModal && (
          <div className="absolute top-4 right-4 z-20">
            <Button 
              onClick={() => setShowUploadModal(true)}
              className="bg-amber-700 hover:bg-amber-600 text-white rounded-full h-12 w-12 flex items-center justify-center"
              size="icon"
            >
              <Edit size={20} />
            </Button>
          </div>
        )}
        
        {/* Image upload modal */}
        {showUploadModal && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-300 z-10">
            <div className="bg-black/90 p-6 rounded-lg border border-amber-500/50 backdrop-blur-md max-w-md relative">
              <Button 
                onClick={() => setShowUploadModal(false)}
                className="absolute top-2 right-2 rounded-full h-8 w-8 p-0 bg-transparent hover:bg-gray-800"
                size="icon"
              >
                <X size={16} className="text-gray-400" />
              </Button>
              
              <h3 className="text-xl text-amber-500 mb-4 font-medieval text-center">Change Quests Banner</h3>
              
              <Button 
                onClick={triggerFileInput}
                className="w-full mb-3 bg-amber-700 hover:bg-amber-600 text-white flex items-center justify-center gap-2"
                disabled={isUploading}
              >
                <Upload size={18} />
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </Button>
              
              <p className="text-gray-400 text-sm text-center">
                Upload a JPG, PNG or GIF image for your quests banner
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/gif" 
                onChange={handleImageUpload}
              />
            </div>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center z-[5]">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-widest drop-shadow-lg font-medieval text-amber-500">
            QUESTS
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 relative">
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

  // Update progress
  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress)
    onProgressUpdate(newProgress)
  }

  // Calculate days remaining
  const getDaysRemaining = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <Card className={`bg-gradient-to-b from-black to-gray-900 border-amber-800/20 ${quest.isNew ? "border-amber-500" : ""} ${quest.completed ? "bg-amber-50/30 dark:bg-amber-900/10" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="font-serif text-white">{quest.title}</CardTitle>
            <CardDescription className="text-gray-300">{quest.description}</CardDescription>
          </div>
          {quest.isNew && <Badge className="bg-amber-500">New</Badge>}
          {quest.isAI && <Badge className="bg-purple-500">AI</Badge>}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge
            className={
              quest.difficulty === "easy"
                ? "bg-green-500"
                : quest.difficulty === "medium"
                  ? "bg-blue-500"
                  : quest.difficulty === "hard"
                    ? "bg-amber-500"
                    : "bg-red-500"
            }
          >
            {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
          </Badge>
          <Badge>{quest.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
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
          <Button className="w-full text-white" variant="outline" disabled>
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Completed
          </Button>
        ) : (
          <div className="w-full flex gap-2">
            <Button
              className="flex-1 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white"
              onClick={() => handleProgressChange(Math.min(100, progress + 25))}
            >
              Update Progress
            </Button>
            <Button variant="outline" onClick={() => handleProgressChange(100)} className="text-white">
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark Complete
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

