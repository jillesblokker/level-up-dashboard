"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Award, Calendar, CheckCircle, Clock, Coins, Sword, Trophy, XCircle, PlusCircle, Upload, Edit, X, Save, Settings, RefreshCw } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { showScrollToast } from "@/lib/toast-utils"
import { emitQuestCompletedWithRewards } from "@/lib/kingdom-events"
import { useAuth } from '@/components/providers'
import { logger } from "@/lib/logger"
import { QuestService } from '@/lib/quest-service'
import { Quest } from '@/lib/quest-types'
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { HeaderSection } from "@/components/HeaderSection"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

// Add logging function
const logQuestAction = async (action: string, questId: string, details: any, userId: string) => {
  try {
    await logger.info('Quest Action', JSON.stringify({
      action,
      questId,
      userId,
      details,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Failed to log quest action:', error);
  }
};

export default function QuestsPage() {
  const { user } = useUser();
  const userId = user?.id;
  const [goldBalance, setGoldBalance] = useState(1000)
  
  // Enhanced quest state
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isQuestsLoaded, setIsQuestsLoaded] = useState(false)
  
  // Add save status state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Load quests on component mount
  useEffect(() => {
    const fetchQuests = async () => {
      if (!userId) {
        console.log('No user ID available, skipping quest fetch');
        setLoading(false);
        setIsQuestsLoaded(true);
        return;
      }

      try {
        console.log('Fetching quests for user:', userId); // Debug log
        const quests = await QuestService.getQuests(userId);
        console.log('Fetched quests:', quests); // Debug log
        setQuests(quests);
      } catch (err) {
        let message = 'Failed to load quests';
        if (err instanceof Error) {
          message = err.message;
          console.error('Quests fetch error:', err);
        }
        setError(message);
      } finally {
        setLoading(false);
        setIsQuestsLoaded(true);
      }
    };

    fetchQuests();
  }, [userId]);

  // Update quest progress
  const updateQuestProgress = async (questId: string, newProgress: number) => {
    if (!userId) {
      console.error('No userId found in session. Cannot update quest progress.');
      toast({
        title: "Error",
        description: "Please sign in to update quest progress.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Log the progress update
      await logQuestAction('progress_update', questId, {
        newProgress,
        completed: newProgress >= 100
      }, userId);

      // Update the quest in Supabase
      const updatedQuest = await QuestService.updateQuestProgress(questId, newProgress);

      // Update local state
      setQuests(prevQuests => 
        prevQuests.map(quest => 
          quest.id === questId ? updatedQuest : quest
        )
      );

      // If quest is completed, give rewards
      if (newProgress >= 100 && !updatedQuest.completed) {
        // Log quest completion
        await logQuestAction('quest_completed', questId, {
          rewards: updatedQuest.rewards,
          completionTime: new Date().toISOString()
        }, userId);

        // Add gold to balance
        setGoldBalance(prev => {
          const newBalance = prev + updatedQuest.rewards.gold;
          localStorage.setItem("levelup-gold-balance", newBalance.toString());
          return newBalance;
        });

        // Show completion toast
        const completionMessage = 
          `You've completed: ${updatedQuest.title}\n` +
          `+${updatedQuest.rewards.xp} XP\n` +
          `+${updatedQuest.rewards.gold} Gold` +
          (updatedQuest.rewards.items ? `\nItems: ${updatedQuest.rewards.items.join(", ")}` : '');

        showScrollToast(
          toast,
          'Quest Complete!',
          completionMessage
        );

        // Emit quest completed event
        emitQuestCompletedWithRewards(
          updatedQuest.title, 
          updatedQuest.rewards.gold, 
          updatedQuest.rewards.xp, 
          'quests-page'
        );
      } else if (newProgress < 100) {
        // Show progress update toast
        toast({
          title: "Progress Updated",
          description: `${updatedQuest.title}: ${newProgress}% complete`,
          duration: 2000
        });
      }
    } catch (err) {
      console.error('Failed to update quest progress:', err);
      toast({
        title: "Error",
        description: "Failed to update quest progress. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Toggle quest completion
  const handleQuestToggle = async (questId: string) => {
    if (!userId) {
      console.error('No userId found in session. Cannot update quest.');
      toast({
        title: "Error",
        description: "Please sign in to update quest status.",
        variant: "destructive"
      });
      return;
    }

    try {
      const quest = quests.find(q => q.id === questId);
      if (!quest) return;

      // Log the toggle action
      await logQuestAction('quest_toggle', questId, {
        oldStatus: quest.completed,
        newStatus: !quest.completed
      }, userId);

      // Update the quest in Supabase
      const updatedQuest = await QuestService.toggleQuestCompletion(questId);

      // Update local state
      setQuests(prevQuests => 
        prevQuests.map(q => 
          q.id === questId ? updatedQuest : q
        )
      );

      // Show toast
      toast({
        title: updatedQuest.completed ? "Quest Completed" : "Quest Reopened",
        description: `${updatedQuest.title} has been ${updatedQuest.completed ? 'completed' : 'reopened'}.`,
        duration: 2000
      });
    } catch (err) {
      console.error('Failed to toggle quest:', err);
      toast({
        title: "Error",
        description: "Failed to update quest status. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Load gold balance from localStorage
  useEffect(() => {
    const savedGold = localStorage.getItem("levelup-gold-balance");
    if (savedGold) {
      setGoldBalance(Number.parseInt(savedGold, 10));
    }
  }, []);

  // Group quests by category
  const questsByCategory = quests.reduce((acc, quest) => {
    if (!acc[quest.category]) {
      acc[quest.category] = [];
    }
    acc[quest.category].push(quest);
    return acc;
  }, {} as Record<string, Quest[]>);

  return (
    <div className="pt-16 min-h-screen bg-black text-white">
      <HeaderSection
        title="QUESTS"
        imageSrc="/images/quests-header.jpg"
        canEdit={true}
      />

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 relative">
        {/* Quest management controls */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">Quest Management</h2>
            <div className="text-sm text-gray-400">
              {quests.filter(q => q.completed).length} / {quests.length} completed
            </div>
          </div>
          
          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Quest settings menu">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={async () => {
                  if (!userId) {
                    toast({
                      title: "Error",
                      description: "Please sign in to refresh quests.",
                      variant: "destructive"
                    });
                    return;
                  }
                  setLoading(true);
                  try {
                    console.log('Refreshing quests for user:', userId); // Debug log
                    const refreshedQuests = await QuestService.getQuests(userId);
                    console.log('Refreshed quests:', refreshedQuests); // Debug log
                    setQuests(refreshedQuests);
                    toast({
                      title: "Quests Refreshed",
                      description: "Your quests have been updated",
                    });
                  } catch (err) {
                    console.error('Failed to refresh quests:', err);
                    toast({
                      title: "Error",
                      description: "Failed to refresh quests. Please try again.",
                      variant: "destructive"
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
                aria-label="Refresh Quests"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Quests
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Show loading state */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <span className="ml-2 text-amber-500">Loading quests...</span>
          </div>
        )}

        {/* Show error state */}
        {error && !loading && (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <Button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchQuests();
              }}
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Show no quests state */}
        {!loading && !error && quests.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>No quests available</p>
            <p className="text-sm mt-2">Please sign in to view your quests</p>
          </div>
        )}

        {/* Tabs */}
        {!loading && !error && quests.length > 0 && (
          <Tabs defaultValue="quests" className="w-full" aria-label="Quest and milestone tabs">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quests" aria-label="Quests tab">Quests</TabsTrigger>
              <TabsTrigger value="milestones" aria-label="Milestones tab">Milestones</TabsTrigger>
            </TabsList>

            {/* Quests Tab */}
            <TabsContent value="quests" className="mt-6">
              <ScrollArea className="h-[calc(100vh-300px)]" aria-label="quests-scroll-area">
                <div className="grid gap-4">
                  {Object.entries(questsByCategory).map(([category, categoryQuests]) => (
                    <div key={category} className="space-y-4">
                      <h3 className="text-xl font-bold text-amber-500 capitalize">{category}</h3>
                      <div className="grid gap-4">
                        {categoryQuests.map(quest => (
                          <QuestCard
                            key={quest.id}
                            quest={quest}
                            onProgressUpdate={(progress) => updateQuestProgress(quest.id, progress)}
                            onToggle={() => handleQuestToggle(quest.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Milestones Tab */}
            <TabsContent value="milestones" className="mt-6">
              <ScrollArea className="h-[calc(100vh-300px)]" aria-label="milestones-scroll-area">
                <div className="grid gap-4">
                  <Card className="bg-black/80 border-amber-800/50">
                    <CardHeader>
                      <CardTitle className="text-amber-500">Coming Soon</CardTitle>
                      <CardDescription>Milestones feature is under development</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

// Quest Card Component
function QuestCard({ 
  quest, 
  onProgressUpdate,
  onToggle 
}: { 
  quest: Quest; 
  onProgressUpdate: (progress: number) => void;
  onToggle: () => void;
}) {
  return (
    <Card 
      className={`relative bg-gradient-to-b from-black to-gray-900 border-amber-800/20 ${quest.isNew ? "border-amber-500" : ""} ${quest.completed ? "bg-amber-50/30 dark:bg-amber-900/10" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={`${quest.title} quest card`}
    >
      {/* Checkbox positioned absolutely in the top right */}
      <div className="absolute top-4 right-4 z-10">
        <Checkbox
          checked={quest.completed}
          onCheckedChange={onToggle}
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
              <span>{quest.progress}%</span>
            </div>
            <Progress value={quest.progress} className="h-2" aria-label={`Quest progress: ${quest.progress}%`} />
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
              quest.rewards.items.map((item: string, i: number) => (
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
              onClick={() => onProgressUpdate(Math.min(100, quest.progress + 25))}
              aria-label="Update quest progress"
            >
              Update Progress
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onProgressUpdate(100)}
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

// Helper function to calculate days remaining
function getDaysRemaining(deadline: string): number {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
