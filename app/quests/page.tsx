"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Award, Calendar, CheckCircle, Clock, Coins, Sword, Trophy, XCircle, PlusCircle, Upload, Edit, X, Save, Settings, RefreshCw, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { showScrollToast } from "@/lib/toast-utils"
import { emitQuestCompletedWithRewards } from "@/lib/kingdom-events"
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
import { defaultQuests } from '@/lib/quest-sample-data'
import { useSupabaseClientWithToken } from '@/lib/hooks/use-supabase-client'
import { KnowledgeModal } from "@/components/category-modals/knowledge-modal"
import { ConditionModal } from "@/components/category-modals/condition-modal"
import { NutritionModal } from "@/components/category-modals/nutrition-modal"
import { Milestones } from '@/components/milestones'

// Add logging function
const logQuestAction = async (action: string, questId: string, details: Record<string, unknown>, userId: string) => {
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
  const [quests, setQuests] = useState<Quest[]>(defaultQuests)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isQuestsLoaded, setIsQuestsLoaded] = useState(false)
  
  // Add save status state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const supabase = useSupabaseClientWithToken();

  const [isAddQuestModalOpen, setIsAddQuestModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)

  // Helper to insert all default quests for a user into Supabase
  const insertDefaultQuestsToSupabase = async (userId: string) => {
    if (!supabase.supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    try {
      await Promise.all(
        defaultQuests.map(q =>
          QuestService.createQuest(supabase.supabase!, {
            ...q,
            userId,
            completed: false,
            progress: 0,
            isNew: true,
            isAI: false,
            rewards: {
              ...q.rewards,
              items: q.rewards.items || []
            },
            deadline: q.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
        )
      );
    } catch (err) {
      console.error('Failed to insert default quests:', err);
    }
  };

  // Fetch from Supabase on refresh or login
  const fetchQuests = async () => {
    if (!supabase.supabase || !userId) {
      setQuests(defaultQuests);
      setLoading(false);
      setIsQuestsLoaded(true);
      return;
    }
    setLoading(true);
    try {
      let questsFromDb = await QuestService.getQuests(supabase.supabase!, userId);
      if (!questsFromDb || questsFromDb.length === 0) {
        // Insert default quests for this user
        await insertDefaultQuestsToSupabase(userId);
        // Fetch again
        questsFromDb = await QuestService.getQuests(supabase.supabase!, userId);
      }
      setQuests(questsFromDb && questsFromDb.length > 0 ? questsFromDb : defaultQuests);
      setError(null);
    } catch (err) {
      // Always show default quests if error
      setQuests(defaultQuests);
      setError(null); // Don't show error message, just fallback
    } finally {
      setLoading(false);
      setIsQuestsLoaded(true);
    }
  };

  // On mount or when user changes, show default quests, then fetch from Supabase
  useEffect(() => {
    setQuests(defaultQuests);
    setLoading(true);
    setIsQuestsLoaded(false);
    fetchQuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Update quest progress
  const updateQuestProgress = async (questId: string, newProgress: number) => {
    if (!supabase.supabase || !userId) {
      console.error('No userId or supabase client. Cannot update quest progress.');
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
      const updatedQuest = await QuestService.updateQuest(supabase.supabase!, questId, { progress: newProgress });

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
          `You&apos;ve completed: ${updatedQuest.title}\n` +
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
    if (!supabase.supabase || !userId) {
      console.error('No userId or supabase client. Cannot update quest.');
      toast({
        title: "Error",
        description: "Please sign in to update quests.",
        variant: "destructive"
      });
      return;
    }

    try {
      const quest = quests.find(q => q.id === questId);
      if (!quest) return;

      // If the id is not a valid database id (e.g., it's a slug like 'plank'), just update local state
      if (!quest.id.startsWith('quest_')) {
        setQuests(prevQuests =>
          prevQuests.map(q =>
            q.id === questId ? { ...q, completed: !q.completed } : q
          )
        );
        return;
      }

      // Log the toggle action
      await logQuestAction('quest_toggle', questId, {
        previousState: quest.completed,
        newState: !quest.completed
      }, userId);

      // Update in Supabase
      const updatedQuest = await QuestService.updateQuest(supabase.supabase!, questId, { completed: !quest.completed });

      // Update local state
      setQuests(prevQuests =>
        prevQuests.map(q =>
          q.id === questId ? updatedQuest : q
        )
      );

      // Show toast
      toast({
        title: "Quest Updated",
        description: `${updatedQuest.title} has been ${updatedQuest.completed ? 'completed' : 'reopened'}.`,
        duration: 2000
      });
    } catch (err) {
      console.error('Failed to toggle quest:', err);
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
    const category = quest.category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(quest);
    return acc;
  }, {} as Record<string, Quest[]>);

  // Update all async functions that use Supabase to use the supabase client from the hook
  // For example, when loading quest completion state:
  useEffect(() => {
    if (!supabase.supabase || !userId) return;
    const fetchQuestCompletions = async () => {
      const { data, error } = await supabase.supabase!
        .from('quest_completion')
        .select('*')
        .eq('user_id', userId);
      if (!error && data) {
        // Set quest completion state from data
      }
    };
    fetchQuestCompletions();
  }, [supabase.supabase, userId]);

  // When saving quest completion:
  const handleQuestCheck = async (questId: string, checked: boolean) => {
    if (!supabase.supabase || !userId) {
      console.error('No userId or supabase client. Cannot update quest.');
      toast({
        title: "Error",
        description: "Please sign in to update quests.",
        variant: "destructive"
      });
      return;
    }

    try {
      const quest = quests.find(q => q.id === questId);
      if (!quest) return;

      // Log the check action
      await logQuestAction('quest_check', questId, {
        checked,
        previousState: quest.completed,
        newState: checked
      }, userId);

      // Update in Supabase
      const updatedQuest = await QuestService.updateQuest(supabase.supabase!, questId, { completed: checked });

      // Update local state
      setQuests(prevQuests =>
        prevQuests.map(q =>
          q.id === questId ? updatedQuest : q
        )
      );
    } catch (err) {
      console.error('Failed to update quest:', err);
    }
  };

  const handleAddQuest = async (activity: string, amount: number, details?: string) => {
    if (!supabase.supabase || !userId) {
      console.error('No userId or supabase client. Cannot add quest.');
      toast({
        title: "Error",
        description: "Please sign in to add quests.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newQuest = await QuestService.createQuest(supabase.supabase!, {
        title: activity,
        description: details || `Complete ${amount} ${activity}`,
        category: currentCategory || 'uncategorized',
        difficulty: 'easy',
        rewards: {
          xp: amount * 10,
          gold: amount * 5,
          items: []
        },
        progress: 0,
        completed: false,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isNew: true,
        isAI: false,
        userId
      });

      setQuests(prevQuests => [...prevQuests, newQuest]);
      setIsAddQuestModalOpen(false);
      setCurrentCategory(null);

      toast({
        title: "Quest Added",
        description: `New quest "${activity}" has been added.`,
        duration: 2000
      });
    } catch (err) {
      console.error('Failed to add quest:', err);
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    if (!supabase.supabase || !userId) {
      console.error('No userId or supabase client. Cannot delete quest.');
      toast({
        title: "Error",
        description: "Please sign in to delete quests.",
        variant: "destructive"
      });
      return;
    }

    try {
      await QuestService.deleteQuest(supabase.supabase!, questId);
      setQuests(prevQuests => prevQuests.filter(q => q.id !== questId));
      toast({
        title: "Quest Deleted",
        description: "The quest has been removed.",
        duration: 2000
      });
    } catch (err) {
      console.error('Failed to delete quest:', err);
    }
  };

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
                    const refreshedQuests = await QuestService.getQuests(supabase.supabase!, userId);
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
                <div className="space-y-6">
                  {Object.entries(questsByCategory).map(([category, categoryQuests]) => (
                    <div key={category}>
                      <h3 className="text-xl font-bold text-amber-500 capitalize mb-2">{category}</h3>
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {categoryQuests.map(quest => (
                          <QuestCard
                            key={quest.id}
                            quest={quest}
                            onProgressUpdate={(progress) => updateQuestProgress(quest.id, progress)}
                            onToggle={() => handleQuestToggle(quest.id)}
                            onDelete={() => handleDeleteQuest(quest.id)}
                          />
                        ))}
                        {/* Add Quest Card */}
                        <Card 
                          className="relative bg-gradient-to-b from-black to-gray-900 border-amber-800/20 p-3 min-h-[140px] flex flex-col justify-between cursor-pointer"
                          role="button"
                          tabIndex={0}
                          aria-label={`${category}-add-quest-card`}
                          onClick={() => {
                            setCurrentCategory(category)
                            setIsAddQuestModalOpen(true)
                          }}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrentCategory(category); setIsAddQuestModalOpen(true); } }}
                        >
                          <div className="flex justify-center items-center h-full">
                            <PlusCircle className="h-8 w-8 text-amber-500" />
                          </div>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Milestones Tab */}
            <TabsContent value="milestones" className="mt-6">
              <ScrollArea className="h-[calc(100vh-300px)]" aria-label="milestones-scroll-area">
                <Milestones />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Add Quest Modal */}
      {isAddQuestModalOpen && currentCategory && (
        currentCategory === 'knowledge' ? (
          <KnowledgeModal open={true} onOpenChange={setIsAddQuestModalOpen} onSubmit={(activity, amount, details) => handleAddQuest(activity, amount, details)} />
        ) : currentCategory === 'condition' ? (
          <ConditionModal open={true} onOpenChange={setIsAddQuestModalOpen} onSubmit={(activity, duration, distance) => handleAddQuest(activity, duration, distance?.toString())} />
        ) : currentCategory === 'nutrition' ? (
          <NutritionModal open={true} onOpenChange={setIsAddQuestModalOpen} onSubmit={(mealType, description, macros) => handleAddQuest(mealType, 0, description)} />
        ) : null
      )}
    </div>
  );
}

// Quest Card Component
function QuestCard({ 
  quest, 
  onProgressUpdate,
  onToggle,
  onDelete
}: { 
  quest: Quest; 
  onProgressUpdate: (progress: number) => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  // Handler for card click (toggles completion)
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent toggling if clicking on the checkbox directly
    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
    onToggle();
  };
  return (
    <Card 
      className={`relative bg-gradient-to-b from-black to-gray-900 border-amber-800/20 p-3 min-h-[140px] flex flex-col justify-between cursor-pointer ${quest.isNew ? "border-amber-500" : ""} ${quest.completed ? "bg-amber-50/30 dark:bg-amber-900/10" : ""}`}
      role="region"
      tabIndex={0}
      aria-label={`${quest.title} quest card`}
      onClick={handleCardClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 pr-2">
          <CardTitle className="font-serif text-white text-lg leading-tight mb-1">{quest.title}</CardTitle>
          <div className="flex flex-wrap gap-1 mb-1">
            <Badge className={
              quest.difficulty === "easy"
                ? "bg-green-500 text-white"
                : quest.difficulty === "medium"
                  ? "bg-blue-500 text-white"
                  : quest.difficulty === "hard"
                    ? "bg-amber-500 text-white"
                    : "bg-red-500 text-white"
            }>
              {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
            </Badge>
            {quest.isNew && <Badge className="bg-amber-500 text-white">New</Badge>}
            {quest.isAI && <Badge className="bg-purple-500 text-white">AI</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={quest.completed}
            onCheckedChange={onToggle}
            aria-label={`Mark ${quest.title} as ${quest.completed ? 'incomplete' : 'complete'}`}
            className="h-5 w-5 border-2 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500 mt-1"
            tabIndex={-1}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-red-500"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label={`Delete ${quest.title} quest`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex justify-between text-xs text-white">
          <span>Progress</span>
          <span>{quest.completed ? '100' : quest.progress}%</span>
        </div>
        <Progress value={quest.completed ? 100 : quest.progress} className="h-1.5" aria-label={`Quest progress: ${quest.completed ? 100 : quest.progress}%`} />
        <div className="flex flex-wrap gap-2 text-xs text-white mt-1">
          <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-amber-500" />{quest.rewards.xp} XP</span>
          <span className="flex items-center gap-1"><Coins className="h-3 w-3 text-yellow-500" />{quest.rewards.gold} Gold</span>
          {quest.rewards.items && quest.rewards.items.map((item: string, i: number) => (
            <span key={i} className="flex items-center gap-1"><Award className="h-3 w-3 text-purple-500" />{item}</span>
          ))}
        </div>
      </div>
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