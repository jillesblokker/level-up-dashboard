"use client"

import { logger } from "@/lib/logger";

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { AddMilestoneForm } from "@/components/add-milestone-form"
import { AddChallengeForm } from "@/components/add-challenge-form"
import { MasteryLedger } from "@/components/mastery-ledger"
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sword, Brain, Crown, Castle, Hammer, Heart, Plus, Trash2, Trophy, Sun, PersonStanding, Pencil, Flame, Star, CheckCircle2, Zap } from 'lucide-react'
import { HeaderSection } from '@/components/HeaderSection'
import { PageGuide } from '@/components/page-guide'
import { useUser, useAuth } from '@clerk/nextjs'
import { Milestones } from '@/components/milestones'
import { updateCharacterStats, getCharacterStats, addToCharacterStat } from '@/lib/character-stats-service'
import { useCharacterStats } from '@/hooks/use-character-stats'
import { toast } from '@/components/ui/use-toast'
import QuestCard from '@/components/quest-card'
import React from 'react'
import { SignedIn, SignedOut, SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

import { gainGold } from '@/lib/gold-manager';
import { useRef } from 'react';
import { StreakRecovery } from '@/components/streak-recovery';
import { FullPageLoading, DataLoadingState } from '@/components/ui/loading-states';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { gainExperience } from '@/lib/experience-manager'
import { gainStrengthFromQuest } from '@/lib/strength-manager'
import { MobileLayoutWrapper, MobileScrollContainer, MobileContentWrapper } from '@/components/mobile-layout-wrapper'

import { QuestOrganization } from '@/components/quest-organization'
import { GameplayLoopIndicator } from '@/components/gameplay-loop-indicator'
import { removeTileFromInventory } from '@/lib/tile-inventory-manager'

import { KeyboardShortcutsProvider } from '@/components/keyboard-shortcuts'
import { showQuestCompletionToast } from '@/components/enhanced-reward-toast'
import { EmptyQuests } from '@/components/empty-states'
import { QuestToggleButton } from '@/components/quest-toggle-button'
import TasksLoading from './loading'

import { useQuestSync } from '@/hooks/useQuestSync'
import { useOfflineSupport } from '@/hooks/useOfflineSupport'
import { SyncStatusIndicator } from '@/components/sync-status-indicator'
import { OfflineQueueIndicator } from '@/components/offline-queue-indicator'
import { ToastContainer, useQuestToasts } from '@/components/enhanced-toast-system'
import { MedievalErrorBoundary as EnhancedErrorBoundary } from '@/components/medieval-error-boundary'
import { ActivityRingsCard } from '@/components/activity-rings-card'
import { ChroniclesCard } from '@/components/chronicles-card'
import dynamic from 'next/dynamic';
const TarotCardDisplay = dynamic(() => import('@/components/tarot-card').then(m => ({ default: m.TarotCardDisplay })), {
  loading: () => <div className="animate-pulse h-40 bg-zinc-900 rounded-xl border border-zinc-800" />,
  ssr: false,
});
import { StreakIndicator } from "@/components/streak-indicator"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { useQuickAdd } from "@/components/quick-add-provider"
import { LoadingScreen } from "@/components/loading-screen"
import { TEXT_CONTENT } from '@/lib/text-content'

import { useCitizensStore } from '@/stores/citizensStore'
import { useGameStore } from '@/stores/game-store'

interface Quest {
  id: string;
  name: string;
  title?: string;
  description: string;
  category: string;
  difficulty: string;
  xp?: number;
  gold?: number;
  completed: boolean;
  favorited?: boolean;
  date?: Date;
  isNew: boolean;
  completionId?: string;
  mandate_period?: string;
  mandate_count?: number;
}

const categoryIcons = {
  might: Sword,
  knowledge: Brain,
  honor: Crown,
  castle: Castle,
  craft: Hammer,
  vitality: Heart,
  wellness: Sun,
  exploration: PersonStanding,
};

const categoryLabels = TEXT_CONTENT.quests.categories;

function getEssenceTypeForCategory(category: string): 'ember_essence' | 'frost_essence' | 'tide_essence' | 'verdant_essence' {
  switch (category.toLowerCase()) {
    case 'might':
    case 'vitality':
      return 'ember_essence';
    case 'knowledge':
    case 'exploration':
      return 'frost_essence';
    case 'wellness':
    case 'honor':
      return 'tide_essence';
    case 'craft':
    case 'castle':
    default:
      return 'verdant_essence';
  }
}

const questCategories = ['might', 'knowledge', 'honor', 'castle', 'craft', 'vitality', 'wellness', 'exploration'];

const categoryColorMap: Record<string, string> = {
  might: 'text-red-500 border-red-800/30 bg-red-900/10',
  knowledge: 'text-blue-500 border-blue-800/30 bg-blue-900/10',
  honor: 'text-purple-500 border-purple-800/30 bg-purple-900/10',
  castle: 'text-zinc-400 border-zinc-700/30 bg-zinc-900/10',
  craft: 'text-orange-500 border-orange-800/30 bg-orange-900/10',
  vitality: 'text-green-500 border-green-800/30 bg-green-900/10',
  wellness: 'text-teal-500 border-teal-800/30 bg-teal-900/10',
  exploration: 'text-emerald-500 border-emerald-800/30 bg-emerald-900/10'
};

const difficultySettings = {
  easy: { label: TEXT_CONTENT.quests.difficulties.easy, color: 'text-green-400', gold: 10, xp: 20, icon: <Zap className="w-4 h-4" /> },
  medium: { label: TEXT_CONTENT.quests.difficulties.medium, color: 'text-blue-400', gold: 25, xp: 50, icon: <Zap className="w-4 h-4" /> },
  hard: { label: TEXT_CONTENT.quests.difficulties.hard, color: 'text-orange-400', gold: 60, xp: 120, icon: <Flame className="w-4 h-4" /> },
  epic: { label: TEXT_CONTENT.quests.difficulties.epic, color: 'text-purple-400', gold: 150, xp: 300, icon: <Trophy className="w-4 h-4" /> },
};

// --- 4-Day Workout Plan Data ---
const workoutPlan = TEXT_CONTENT.workouts;

const CHALLENGE_STREAKS_KEY = 'challenge-streaks-v1';
const CHALLENGE_LAST_COMPLETED_KEY = 'challenge-last-completed-v1';

// Helper to get streak scrolls from inventory
function getStreakScrollCount() {
  try {
    const inv = JSON.parse(localStorage.getItem('tileInventory') || '{}');
    return inv['streak-scroll']?.quantity || 0;
  } catch {
    return 0;
  }
}
function getStreakBonus(streak: number) {
  // 5 gold per day, capped at 50
  return Math.min(streak * 5, 50);
}

export default function QuestsPage() {
  const { isLoaded: isClerkLoaded, user } = useUser();
  const { getToken } = useAuth();
  const { openQuickAdd } = useQuickAdd();
  const searchParams = useSearchParams();
  const { stats } = useCharacterStats();
  const activePartnerId = useGameStore(s => s.activePartnerId);
  const citizens = useCitizensStore(s => s.citizens);
  const loadCitizens = useCitizensStore(s => s.loadCitizens);
  const userId = user?.id;
  const isUserLoaded = isClerkLoaded;

  useEffect(() => {
    if (userId) {
      loadCitizens(userId);
    }
  }, [userId, loadCitizens]);

  logger.debug('[Challenges Frontend] Component rendered, isClerkLoaded:', isClerkLoaded, 'userId:', userId, 'user:', !!user);

  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeView, setActiveView] = useState<'forge' | 'ledger' | 'sanctuary' | 'recovery'>('forge');
  const [forgeTab, setForgeTab] = useState<'quests' | 'challenges'>('quests'); // New toggle for Forge
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>(questCategories);
  const [mainTab, setMainTab] = useState<'quests' | 'challenges' | 'milestones' | 'recovery'>('quests');

  // Sync tab with URL query param
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab && ['forge', 'ledger', 'sanctuary', 'recovery'].includes(tab)) {
      setActiveView(tab as any);
    }
  }, [searchParams]);

  const [questCategory, setQuestCategory] = useState(questCategories[0]);
  const [challengeCategory, setChallengeCategory] = useState<string>("all");
  const [milestoneCategory, setMilestoneCategory] = useState(questCategories[0]);
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean[]>>({});
  const [customChallenges, setCustomChallenges] = useState<Record<string, any[]>>({});
  const [challengeStreaks, setChallengeStreaks] = useState<Record<string, number[]>>({});
  const [challengeLastCompleted, setChallengeLastCompleted] = useState<Record<string, string[]>>({});
  const [newQuest, setNewQuest] = useState({
    name: '',
    description: '',
    category: questCategories[0],
    difficulty: 'medium',
    xp: 0,
    gold: 0,
  });

  const activePartner = citizens.find(c => c.id === activePartnerId);
  const [isPartnerAnimating, setIsPartnerAnimating] = useState(false);
  const [partnerSpeech, setPartnerSpeech] = useState<string | null>(null);
  const [bossQuestId, setBossQuestId] = useState<string | undefined>();

  // Add missing state variables
  const [streakData, setStreakData] = useState<{ streak_days: number; week_streaks: number }>({ streak_days: 0, week_streaks: 0 });
  const [challengeStreakData, setChallengeStreakData] = useState<{ streak_days: number; week_streaks: number }>({ streak_days: 0, week_streaks: 0 });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [editChallengeModalOpen, setEditChallengeModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<any | null>(null);
  const [editMilestoneModalOpen, setEditMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<any | null>(null);
  const [deleteMilestoneConfirmOpen, setDeleteMilestoneConfirmOpen] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<any | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questToDelete, setQuestToDelete] = useState<Quest | null>(null);
  const [addChallengeModalOpen, setAddChallengeModalOpen] = useState(false);
  const [showAddChallengeTypeModal, setShowAddChallengeTypeModal] = useState(false);
  const [newChallengeTypeName, setNewChallengeTypeName] = useState('');
  const [editCustomChallengeIdx, setEditCustomChallengeIdx] = useState<number | null>(null);
  const [editCustomChallengeData, setEditCustomChallengeData] = useState<any>(null);
  const [addQuestModalOpen, setAddQuestModalOpen] = useState(false);
  const [addQuestLoading, setAddQuestLoading] = useState(false);
  const [addQuestError, setAddQuestError] = useState<string | null>(null);
  const [favoritedQuests, setFavoritedQuests] = useState<Set<string>>(new Set());
  const [milestones, setMilestones] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [addMilestoneModalOpen, setAddMilestoneModalOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const dailyResetInitiated = useRef(false);
  const [manualResetLoading, setManualResetLoading] = useState(false);
  const [characterStats, setCharacterStats] = useState({
    level: 1,
    experience: 0,
    gold: 0,
    xpToNextLevel: 100
  });

  // User preferences for gamification
  const [dailyGoal, setDailyGoal] = useState<number>(3);
  const [prDailyQuests, setPrDailyQuests] = useState<number>(0);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState<number>(3);


  // --- Realtime Sync ---
  const [syncError, setSyncError] = useState<string | null>(null);

  const { syncNow, isSyncing, lastSync } = useQuestSync({
    onQuestsUpdate: async () => {
      logger.debug('[Quest Sync] Syncing quests...');
      // Refetch quests from the server
      if (!token) return;

      try {
        const res = await fetch(`/api/quests?t=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch quests: ${res.status}`);
        }

        const data = await res.json();
        setQuests(data || []);
        logger.debug('[Quest Sync] Quests synced successfully');
      } catch (error) {
        logger.error('[Quest Sync] Error syncing quests:', error);
        throw error;
      }
    },
    onCharacterStatsUpdate: async () => {
      logger.debug('[Quest Sync] Syncing character stats...');
      // Trigger character stats update
      window.dispatchEvent(new Event('character-stats-update'));
    },
    onError: (error) => {
      logger.error('[Quest Sync] Sync error:', error);
      setSyncError(error.message);
      // Clear error after 5 seconds
      setTimeout(() => setSyncError(null), 5000);
    },
  });

  // --- Offline Support ---
  const {
    isOnline,
    queue,
    isProcessing: isQueueProcessing,
    processQueue,
    clearQueue,
    getQueueStats
  } = useOfflineSupport();

  const queueStats = getQueueStats();

  // --- Enhanced Toast System ---
  const questToasts = useQuestToasts();

  // --- Quest Streak Logic ---
  // Remove localStorage fallback for streak/history
  const [questStreak, setQuestStreak] = useState(0);
  const [questHistory, setQuestHistory] = useState<{ date: string, completed: boolean }[]>([]);
  const today = new Date().toISOString().slice(0, 10);
  // Calculate today's quest completion
  // eslint-disable-next-line
  const questsByCategory = quests.reduce((acc, quest) => {
    const safeQuestCategory = typeof quest.category === 'string' ? quest.category : '';
    (acc[safeQuestCategory] = acc[safeQuestCategory] || []).push(quest);
    return acc;
  }, {} as Record<string, Quest[]>);
  const questsByCategorySafe = typeof questsByCategory === 'object' && questsByCategory !== null ? questsByCategory : {};
  const safeQuestCategory = typeof questCategory === 'string' ? questCategory : '';
  const todaysQuests = questsByCategorySafe[safeQuestCategory] ?? [];
  const todaysCompleted = todaysQuests.filter(q => q.completed).length;
  const todaysTotal = todaysQuests.length;

  // Debug quest filtering
  logger.debug('[Quest Filter Debug]', {
    totalQuests: quests.length,
    currentCategory: safeQuestCategory,
    questsInCategory: todaysTotal,
    availableCategories: Object.keys(questsByCategorySafe),
    categoryCounts: Object.entries(questsByCategorySafe).map(([cat, quests]) => ({ category: cat, count: quests.length }))
  });
  // 7-day history (Mon-Sun, most recent last)
  const weekDays = TEXT_CONTENT.questBoard.weekDays;
  const paddedHistory = Array(7).fill(null).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const entry = questHistory.find(h => h.date === dateStr);
    return { date: dateStr, completed: entry?.completed || false };
  });
  // On mount/load, load streak and history from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Only use Supabase for streak/history
  }, [userId]);
  // On quest completion change, update streak/history
  useEffect(() => {
    if (!userId || todaysTotal === 0) return;
    if (typeof window === 'undefined') return;
    // Only update if today is not already in history
    if (!questHistory.find(h => h.date === today)) {
      const completed = todaysCompleted === todaysTotal && todaysTotal > 0;
      const newHistory = [...questHistory, { date: today, completed }].slice(-14); // keep 2 weeks
      setQuestHistory(newHistory);
      // localStorage.setItem(QUEST_HISTORY_KEY, JSON.stringify(newHistory)); // Removed localStorage
      // Update streak
      let streak = 0;
      for (let i = newHistory.length - 1; i >= 0; i--) {
        if (newHistory[i]!.completed) streak++;
        else break;
      }
      setQuestStreak(streak);
      // localStorage.setItem(QUEST_STREAK_KEY, String(streak)); // Removed localStorage
    }
  }, [todaysCompleted, todaysTotal, userId]);

  // Acquire token only when Clerk is loaded and user is loaded
  useEffect(() => {
    let cancelled = false;
    async function getClerkToken() {
      // Removed debugging log
      if (!isClerkLoaded || !isUserLoaded || !user) {
        // Removed debugging log
        return;
      }
      // Removed debugging log
      let t = await getToken({ template: 'supabase' });
      let attempts = 0;
      while (!t && attempts < 2) {
        await new Promise(res => setTimeout(res, 200));
        t = await getToken({ template: 'supabase' });
        attempts++;
      }
      // Removed debugging log
      if (!cancelled) setToken(t || null);
    }
    getClerkToken();
    return () => { cancelled = true; };
  }, [isClerkLoaded, isUserLoaded, getToken]);

  // Fetch character stats for progress card
  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      try {
        const stats = await getCharacterStats(); // No userId needed, uses localStorage
        if (stats) {
          setCharacterStats({
            level: stats.level || 1,
            experience: stats.experience || 0,
            gold: stats.gold || 0,
            xpToNextLevel: ((stats.level || 1) * 100) // Simple formula: level * 100
          });
        }
      } catch (error) {
        logger.error('[Character Stats] Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [userId]);

  // Fetch gamification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!token || !userId) return;
      try {
        const res = await fetch('/api/user-preferences', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            if (data.preferences['daily_goal']) {
              const g = Number(data.preferences['daily_goal']);
              setDailyGoal(g);
              setTempGoal(g);
            }
            if (data.preferences['pr_daily_quests']) {
              setPrDailyQuests(Number(data.preferences['pr_daily_quests']));
            }
          }
        }
      } catch (err) {
        logger.error('Error fetching preferences:', err);
      }
    };
    fetchPreferences();
  }, [token, userId]);

  // Fetch quests when token is present and user is authenticated
  useEffect(() => {
    const handleQuestAdded = (event: any) => {
      logger.debug('[QuestsPage] Global quest added event received, refreshing...', event.detail);

      // Auto-switch to the new quest's category if provided
      if (event.detail?.category) {
        setQuestCategory(event.detail.category);
        // Ensure we're viewing quests, not challenges
        if (forgeTab !== 'quests') {
          setForgeTab('quests');
        }
        // Ensure we are in the Forge view (where quests are listed)
        if (activeView !== 'forge') {
          setActiveView('forge');
        }
      }

      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('quest-added', handleQuestAdded);
    return () => window.removeEventListener('quest-added', handleQuestAdded);
  }, []);

  useEffect(() => {
    // Removed debugging log
    if (!token || !user) {
      // Removed debugging log
      return;
    }
    // Removed debugging log
    setLoading(true);
    async function fetchQuests(retryCount = 0) {
      try {
        if (!token) return; // Guard for linter
        logger.debug('[Quests Debug] Fetching /api/quests with token:', token.slice(0, 10), '... (attempt', retryCount + 1, ')');
        const res = await fetch(`/api/quests?t=${Date.now()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        logger.debug('[Quests Debug] Response status:', res.status, 'ok:', res.ok);
        if (!res.ok) {
          const errorText = await res.text();
          logger.error('[Quests Debug] Error response:', errorText);
          throw new Error(`Failed to fetch quests: ${res.status} ${errorText}`);
        }
        // Check if response is HTML (error page) instead of JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const htmlText = await res.text();
          logger.error('[Quests Debug] Received HTML instead of JSON:', htmlText.substring(0, 200));

          // Retry once if we get HTML (might be a temporary auth issue)
          if (retryCount < 1) {
            logger.debug('[Quests Debug] Retrying after HTML response...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            return fetchQuests(retryCount + 1);
          }

          throw new Error(`API returned HTML instead of JSON. Status: ${res.status}`);
        }

        const data = await res.json();
        logger.debug('[Quests Debug] Data received:', {
          dataType: typeof data,
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 'N/A',
          sample: Array.isArray(data) ? data.slice(0, 2) : data,
          categories: Array.isArray(data) ? [...new Set(data.map(q => q.category))] : 'N/A',
          currentFilter: questCategory
        });

        // Debug: Check for quests that are completed
        const completedQuests = data?.filter((q: any) => q.completed) || [];
        if (completedQuests.length > 0) {
          logger.debug('[Quests Debug] Found completed quests:', completedQuests.map((q: any) => ({ id: q.id, name: q.name, completed: q.completed })));
        }

        setQuests(data || []);
      } catch (err: any) {
        setError('[Quests Debug] Error fetching quests: ' + (err.message || 'Failed to fetch quests'));
        setQuests([]);
        logger.error('[Quests Debug] Error fetching quests:', err);
    } finally {
        setLoading(false);
      }
    }
    fetchQuests();
    fetchFavorites();
  }, [token, user, refreshTrigger]);

  // Fetch user's favorited quests
  const fetchFavorites = async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        logger.debug('[Favorites] No token available');
        return;
      }

      logger.debug('[Favorites] Fetching favorites from API...');
      const response = await fetch('/api/quests/favorites', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        logger.debug('[Favorites] API response:', data);
        setFavoritedQuests(new Set(data.favorites || []));
        logger.debug('[Favorites] Set favorited quests:', data.favorites || []);
      } else {
        logger.error('[Favorites] API error:', response.status, response.statusText);
      }
    } catch (error) {
      logger.error('Error fetching favorites:', error);
    }
  };

  // Daily reset logic for non-milestone quests and challenges (persisted in DB)
  useEffect(() => {
    if (!loading && quests && quests.length > 0 && userId && token) {
      const lastReset = localStorage.getItem('last-quest-reset-date');
      // Use Netherlands timezone (Europe/Amsterdam) for daily reset
      const now = new Date();
      // Use Intl.DateTimeFormat for reliable timezone conversion
      const netherlandsDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Amsterdam',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(now);
      const today = netherlandsDate; // Format: YYYY-MM-DD

      // Debug timezone conversion
      logger.debug('[Daily Reset] Timezone debug:', {
        utcTime: now.toISOString(),
        netherlandsDate: netherlandsDate,
        today: today,
        lastReset: lastReset
      });

      logger.debug('[Daily Reset] Checking reset conditions:', {
        lastReset,
        today,
        shouldReset: lastReset !== today,
        dailyResetInitiated: dailyResetInitiated.current,
        token: !!token
      });

      // Debug: Show if we're skipping due to localStorage
      if (lastReset === today) {
        logger.debug('[Daily Reset] ⚠️ Skipping reset because localStorage shows reset already processed today');
        logger.debug('[Daily Reset] 💡 To force a reset, clear localStorage: localStorage.removeItem("last-quest-reset-date")');
      }

      // Only reset if we haven't processed today's reset AND we have a valid token
      // Remove the dailyResetInitiated check to allow manual resets
      if (lastReset !== today && token) {
        logger.debug('[Daily Reset] Starting daily reset for date:', today);
        logger.debug('[Daily Reset] Last reset was:', lastReset, 'Today is:', today);

        // Mark that we've initiated a reset to prevent multiple calls
        dailyResetInitiated.current = true;

        // Call backend to reset quests and challenges
        fetch('/api/quests/reset-daily-ui-only', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.text();
              logger.error('[Daily Reset] API error:', res.status, err);
              toast({
                title: 'Daily Reset Error',
                description: `Failed to reset daily quests: ${err || res.statusText}`,
                variant: 'destructive',
              });
              return;
            }

            // Only parse JSON if response is OK
            const result = await res.json();
            logger.debug('[Daily Reset] Success:', result);

            // Mark that we've processed today's reset
            localStorage.setItem('last-quest-reset-date', today);

            // Reset the daily reset flag to allow future resets
            dailyResetInitiated.current = false;

            // 🔍 DEBUG: Log the quest state after reset
            logger.debug('[Daily Reset] Quest state after reset:', quests.map(q => ({ id: q.id, name: q.name, completed: q.completed })));

            // IMPORTANT: DO NOT manually reset quest state - this causes data loss!
            // The quest completion logic will naturally show quests as incomplete
            // if there's no completed=true record for today
            logger.debug('[Daily Reset] ✅ Preserving quest state - no manual reset to prevent data loss');

            // Optimized delay before refreshing to ensure reset completion
            setTimeout(() => {
              logger.debug('[Daily Reset] Refreshing quest data after reset...');
              setRefreshTrigger(prev => prev + 1);
            }, 1500); // Reduced delay since UI-only reset is instant

            toast({
              title: 'Daily Reset',
              description: 'Your daily quests and challenges have been reset! Time to build new habits.',
            });
          })
          .catch(err => {
            logger.error('[Daily Reset] Network error:', err);
            toast({
              title: 'Daily Reset Error',
              description: `Network or server error: ${err.message || err}`,
              variant: 'destructive',
            });
          });
      } else {
        logger.debug('[Daily Reset] Skipping reset - already processed today or conditions not met');
      }
    }
  }, [loading, userId, token]); // Remove quests.length to prevent reset from running after every quest completion

  // Reset the daily reset flag when the date changes (at midnight Netherlands time)
  useEffect(() => {
    // Use Netherlands timezone (Europe/Amsterdam) for date change detection
    const now = new Date();
    // Use Intl.DateTimeFormat for reliable timezone conversion
    const netherlandsDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Amsterdam',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    const today = netherlandsDate; // Format: YYYY-MM-DD
    const lastReset = localStorage.getItem('last-quest-reset-date');

    // If the date has changed, reset the flag
    if (lastReset !== today) {
      dailyResetInitiated.current = false;
      logger.debug('[Daily Reset] Date changed, resetting daily reset flag');
    }
  }, []);

  // Persist streaks and last completed
  useEffect(() => {
    localStorage.setItem(CHALLENGE_STREAKS_KEY, JSON.stringify(challengeStreaks));
  }, [challengeStreaks]);
  useEffect(() => {
    localStorage.setItem(CHALLENGE_LAST_COMPLETED_KEY, JSON.stringify(challengeLastCompleted));
  }, [challengeLastCompleted]);

  useEffect(() => {
    if (bossQuestId) {
      localStorage.setItem('boss-quest-id-v1', bossQuestId);
    } else {
      localStorage.removeItem('boss-quest-id-v1');
    }
  }, [bossQuestId]);

  // Fetch streak from Supabase (now via API route)
  useEffect(() => {
    if (!token || !userId || !questCategory) return;
    let cancelled = false;
    const fetchStreak = async () => {
      try {
        const res = await fetch(`/api/streaks-direct?category=${encodeURIComponent(questCategory)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          logger.error('[Streaks] Failed to fetch streak:', res.status, res.statusText);
          throw new Error('Failed to fetch streak');
        }
        const data = await res.json();
        if (!cancelled) {
          setStreakData(data);

          // Check for missed days and apply Streak Freeze if available
          if (data.last_check_in && data.streak_days > 0) {
            const lastCheckIn = new Date(data.last_check_in);
            const today = new Date();
            // Reset hours to compare dates only
            lastCheckIn.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            const diffTime = Math.abs(today.getTime() - lastCheckIn.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // If missed more than 1 day (meaning yesterday was missed)
            if (diffDays > 1) {
              const scrollCount = getStreakScrollCount();

              if (scrollCount > 0) {
                // RESCUE!
                await removeTileFromInventory(userId, 'streak-scroll', 1);

                // Update streak (don't reset, just update check-in time)
                // We call updateStreak with CURRENT streak to refresh the timestamp
                await updateStreak(data.streak_days, 0); // 0 added for quest count, keeps streak same

                toast({
                  title: TEXT_CONTENT.questBoard.toasts.streak.frozen.title,
                  description: TEXT_CONTENT.questBoard.toasts.streak.frozen.desc.replace('{category}', questCategory ? getCategoryLabel(questCategory) : 'activity'),
                  className: "bg-blue-900 border-blue-500 text-blue-100"
                });

                // Update local state to reflect consumption
                const currentInv = JSON.parse(localStorage.getItem('tileInventory') || '{}');
                if (currentInv['streak-scroll']) {
                  currentInv['streak-scroll'].quantity = Math.max(0, currentInv['streak-scroll'].quantity - 1);
                  localStorage.setItem('tileInventory', JSON.stringify(currentInv));
                }

              } else {
                // RESET :(
                await updateStreak(0, 0);
                toast({
                  title: TEXT_CONTENT.questBoard.toasts.streak.lost.title,
                  description: TEXT_CONTENT.questBoard.toasts.streak.lost.desc.replace('{category}', questCategory ? getCategoryLabel(questCategory) : 'activity'),
                  variant: "destructive"
                });
              }
            }
          }
        }
      } catch (error) {
        logger.error('[Streaks] Error fetching streak:', error);
        if (!cancelled) setStreakData({ streak_days: 0, week_streaks: 0 });
      }
    };
    fetchStreak();
    return () => { cancelled = true; };
  }, [token, userId, questCategory]);

  // Polling for streak changes instead of real-time sync - DISABLED TO PREVENT INFINITE LOOPS
  useEffect(() => {
    if (!userId || !questCategory) return;

    // Disable polling to prevent infinite loops
    logger.debug('[Streaks Poll] Polling disabled to prevent infinite loops');

    // Only fetch once on mount
    const fetchStreakOnce = async () => {
      if (token) {
        try {
          const res = await fetch(`/api/streaks-direct?category=${encodeURIComponent(questCategory)}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await res.json();
              setStreakData(data);
            } else {
              logger.error('[Streaks Poll] Non-JSON response received');
            }
          } else {
            logger.error('[Streaks Poll] HTTP error:', res.status, res.statusText);
          }
        } catch (error) {
          logger.error('[Streaks Poll] Error fetching streak:', error);
        }
      }
    };

    fetchStreakOnce();
  }, [userId, questCategory, token]);

  // Update challenge streak via API route when all challenges completed for today
  const updateChallengeStreak = async (newStreak: number, newWeekStreaks: number) => {
    if (!token || !userId || !challengeCategory) return;
    try {
      // Removed debugging log
      await fetch('/api/streaks-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: challengeCategory,
          streak_days: newStreak,
          week_streaks: newWeekStreaks,
        }),
      });

      // ⭐ IMMEDIATELY REFETCH the updated streak to refresh UI
      // Removed debugging log
      const res = await fetch(`/api/streaks-direct?category=${encodeURIComponent(challengeCategory)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const updatedData = await res.json();
        // Removed debugging log
        setChallengeStreakData(updatedData);
      }
    } catch (error) {
      logger.error('Failed to update challenge streak:', error);
    }
  };

  // --- Automatically trigger updateStreak in quest completion logic ---
  const [questStreakUpdatedToday, setQuestStreakUpdatedToday] = useState<Record<string, string>>({});

  useEffect(() => {
    // logger.debug('[Quest Streak Debug] Effect triggered:', {
    //   userId,
    //   todaysTotal,
    //   todaysCompleted,
    //   questCategory,
    //   questHistory: questHistory.length,
    //   questStreakUpdatedToday
    // });

    if (!userId || todaysTotal === 0) {
      // logger.debug('[Quest Streak Debug] Bailing early - no userId or no quests');
      return;
    }
    if (typeof window === 'undefined') return;

    const today = new Date().toISOString().slice(0, 10);
    const allQuestsCompleted = todaysCompleted === todaysTotal && todaysTotal > 0;
    // logger.debug('[Quest Streak Debug] All quests completed?', allQuestsCompleted);

    // 🎯 SIMPLIFIED: Just check if all quests are completed and we haven't updated today
    const alreadyUpdatedToday = questCategory ? questStreakUpdatedToday[questCategory] === today : false;
    // logger.debug('[Quest Streak Debug] Already updated today?', alreadyUpdatedToday);

    if (allQuestsCompleted && !alreadyUpdatedToday && questCategory) {
      // logger.debug('[Quest Streak Debug] 🎉 ALL QUESTS COMPLETED! Updating streak...');

      // Mark as updated today to prevent infinite loop
      setQuestStreakUpdatedToday(prev => ({ ...prev, [questCategory]: today }));

      // Get current streak from state and increment
      const currentStreak = streakData?.streak_days ?? 0;
      const newStreak = currentStreak + 1;
      // logger.debug('[Quest Streak Debug] Updating from', currentStreak, 'to', newStreak);

      updateStreak(newStreak, 0);

      // 🎯 AWARD BUILD TOKENS for completing all quests + streak achievements
      let buildTokensEarned = 1; // 1 token for completing all quests in category

      // Bonus tokens for streak milestones (every 5 streak days)
      if (newStreak % 5 === 0) {
        buildTokensEarned += 1; // Extra token for streak milestone
      }

      // Removed debugging log

      // Update build tokens using unified service
      addToCharacterStat('build_tokens', buildTokensEarned, 'quest-streak-completion');

      // Trigger kingdom update for build tokens
      window.dispatchEvent(new CustomEvent('kingdom:buildTokensGained', { detail: buildTokensEarned }));
      window.dispatchEvent(new Event('character-stats-update'));

      toast({
        title: TEXT_CONTENT.questBoard.toasts.streak.quest.title,
        description: TEXT_CONTENT.questBoard.toasts.streak.quest.desc
          .replace('{category}', questCategory)
          .replace('{streak}', String(newStreak))
          .replace('{tokens}', String(buildTokensEarned)),
      });
    }
  }, [todaysCompleted, todaysTotal, userId, questCategory, streakData]);

  // --- Automatically trigger updateStreak in challenge completion logic ---
  const [streakUpdatedToday, setStreakUpdatedToday] = useState<Record<string, string>>({});

  useEffect(() => {
    // logger.debug('[Streak Debug] Effect triggered:', {
    //   challengesLength: challenges.length,
    //   challengeCategory,
    //   challengeStreakData,
    //   challenges: challenges.map(c => ({ id: c.id, category: c.category, completed: c.completed }))
    // });

    if (!challenges.length) {
      // logger.debug('[Streak Debug] No challenges loaded yet');
      return;
    }

    const challengesForCategory = challenges.filter(c => c.category === challengeCategory);
    // logger.debug('[Streak Debug] Challenges for category:', {
    //   category: challengeCategory,
    //   total: challengesForCategory.length,
    //   completed: challengesForCategory.filter(c => c.completed).length,
    //   challengesForCategory: challengesForCategory.map(c => ({ id: c.id, name: c.name, completed: c.completed }))
    // });

    const allChallengesCompleted = challengesForCategory.length > 0 && challengesForCategory.every(c => c.completed);
    // logger.debug('[Streak Debug] All challenges completed?', allChallengesCompleted);

    // 🎯 PREVENT INFINITE LOOP: Check if we already updated streak today
    const today = new Date().toISOString().slice(0, 10);
    const alreadyUpdatedToday = challengeCategory ? streakUpdatedToday[challengeCategory] === today : false;
    // logger.debug('[Streak Debug] Already updated today?', alreadyUpdatedToday);

    if (allChallengesCompleted && !alreadyUpdatedToday && challengeCategory) {
      // Removed debugging log
      const newStreak = challengeStreakData?.streak_days ?? 0;
      const newWeekStreaks = challengeStreakData?.week_streaks ?? 0;
      updateChallengeStreak(newStreak + 1, newWeekStreaks + 1);

      // Mark as updated today to prevent infinite loop
      setStreakUpdatedToday(prev => ({ ...prev, [challengeCategory]: today }));

      // 🎯 AWARD BUILD TOKENS for completing all challenges + streak achievements
      let buildTokensEarned = 1; // 1 token for completing all challenges in category

      // Bonus tokens for streak milestones (every 5 streak days)
      if ((newStreak + 1) % 5 === 0) {
        buildTokensEarned += 1; // Extra token for streak milestone
      }

      // Removed debugging log

      // Update build tokens using unified service
      addToCharacterStat('build_tokens', buildTokensEarned, 'challenge-streak-completion');

      // Trigger kingdom update for build tokens
      window.dispatchEvent(new CustomEvent('kingdom:buildTokensGained', { detail: buildTokensEarned }));
      window.dispatchEvent(new Event('character-stats-update'));

      // Update state without causing infinite loop
      const newStreakData = { [challengeCategory]: [...(challengeStreaks[challengeCategory] || []), newStreak + 1] };
      const newLastCompletedData = { [challengeCategory]: [...(challengeLastCompleted[challengeCategory] || []), new Date().toISOString()] };

      setChallengeStreaks(prev => ({ ...prev, ...newStreakData }));
      setChallengeLastCompleted(prev => ({ ...prev, ...newLastCompletedData }));
      localStorage.setItem(CHALLENGE_STREAKS_KEY, JSON.stringify({ ...challengeStreaks, ...newStreakData }));
      localStorage.setItem(CHALLENGE_LAST_COMPLETED_KEY, JSON.stringify({ ...challengeLastCompleted, ...newLastCompletedData }));

      toast({
        title: TEXT_CONTENT.questBoard.toasts.streak.challenge.title,
        description: TEXT_CONTENT.questBoard.toasts.streak.challenge.desc
          .replace('{category}', challengeCategory)
          .replace('{streak}', String(newStreak + 1))
          .replace('{tokens}', String(buildTokensEarned)),
      });
    }
  }, [challenges.length, challengeCategory, challengeStreakData]);

  // Add missing functions
  const updateStreak = async (newStreak: number, newWeekStreaks: number) => {
    if (!token || !userId) return;

    try {
      // Update local state
      setStreakData(prev => ({
        ...prev,
        currentStreak: newStreak,
        weekStreaks: newWeekStreaks
      }));

      // Update in Supabase
      const response = await fetch('/api/streaks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          currentStreak: newStreak,
          weekStreaks: newWeekStreaks
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update streak');
      }

      toast({
        title: "Streak Updated",
        description: `Your streak is now ${newStreak} days!`,
        duration: 2000,
      });
    } catch (error) {
      logger.error('Error updating streak:', error);
      toast({
        title: TEXT_CONTENT.questBoard.toasts.streak.error.title,
        description: TEXT_CONTENT.questBoard.toasts.streak.error.desc,
        duration: 3000,
      });
    }
  };

  const handleQuestToggle = async (questId: string, newCompleted: boolean) => {
    if (!token || !userId) return;

    // Find the quest object
    const questObj = quests.find(q => q.id === questId);
    if (!questObj) {
      logger.error('[QUEST-TOGGLE] Quest not found:', questId);
      return;
    }

    logger.debug('[QUEST-TOGGLE] Updating quest state:', { questId, newCompleted, questName: questObj.name });

    // Update the quest in the local state (optimistic update)
    setQuests(prevQuests =>
      prevQuests.map(q =>
        q.id === questId
          ? { ...q, completed: newCompleted }
          : q
      )
    );

    const isBossHabit = questId === bossQuestId;
    const goldReward = (questObj.gold || 50) * (isBossHabit ? 3 : 1);
    const xpReward = (questObj.xp || 25) * (isBossHabit ? 3 : 1);

    if (newCompleted) {
      logger.debug('[QUEST-TOGGLE] Applying rewards:', { gold: goldReward, xp: xpReward });

      // Trigger partner animation
      if (activePartner) {
        setIsPartnerAnimating(true);
        setPartnerSpeech(Math.random() > 0.5 ? "Woohoo!" : "Yeah!");
        setTimeout(() => {
          setIsPartnerAnimating(false);
          setPartnerSpeech(null);
        }, 2000);

        // Companion Bonus Loot
        if (Math.random() < 0.25) { // 25% chance for companion loot
          if (Math.random() > 0.5) {
            // Standard Item Drop
            const extraGold = Math.floor(Math.random() * 20) + 10;
            addToCharacterStat('gold', extraGold, 'companion-bonus');
            toast({
              title: `${activePartner.name} found something!`,
              description: `Your companion found an extra ${extraGold} Gold!`,
              duration: 3000,
            });
          } else {
            // Companion Gift (Affection boost)
            useCitizensStore.getState().increaseAffection(userId, activePartner.id, 5);
            toast({
              title: "Companion Gift! 🎁",
              description: `${activePartner.name} gave you a gift! Affection +5`,
              duration: 3000,
            });
          }
        }
      }

      // Apply rewards using unified service
      addToCharacterStat('gold', goldReward, `quest-completion:${questId}`);
      addToCharacterStat('experience', xpReward, `quest-completion:${questId}`);

      if (isBossHabit) {
        toast({
          title: "👑 Boss Habit Defeated! 👑",
          description: "Massive rewards earned! +3x Gold, EXP, and Essence!",
          duration: 4000,
        });
      }

      // Award Specific Essence based on category
      const essenceType = getEssenceTypeForCategory(questObj.category);
      const essenceReward = Math.max(5, Math.floor(xpReward / 2)); // Give essence proportional to XP
      addToCharacterStat(essenceType, essenceReward, `quest-completion-essence:${questId}`);

      // Check Personal Records
      // We calculate new completion count optimistically
      const todaysOverallCompleted = quests.filter(q => q.completed).length + 1;
      if (todaysOverallCompleted > prDailyQuests) {
        setPrDailyQuests(todaysOverallCompleted);
        questToasts.showPersonalRecord("Most Quests in a Day", String(todaysOverallCompleted));
        fetch('/api/user-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ key: 'pr_daily_quests', value: todaysOverallCompleted })
        }).catch(err => logger.error('Failed to save PR', err));
      }
    }

    // Persist quest completion to backend using the smart-completion API
    try {
      const response = await fetch('/api/quests/smart-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          questId,
          completed: newCompleted,
          xpReward,
          goldReward
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to update quest: ${response.status} ${errorData.error || ''}`);
      }

      const responseData = await response.json();
      logger.debug('[QUEST-TOGGLE] Quest persisted to backend successfully', responseData);

      // 🎯 Display enhanced feedback if quest was completed
      if (newCompleted) {
        showQuestCompletionToast(
          questObj.name, 
          responseData.rewards?.gold || goldReward, 
          responseData.rewards?.xp || xpReward,
          responseData.scavengedMaterial ? `${responseData.scavengedMaterial.emoji} ${responseData.scavengedMaterial.name}` : undefined,
          responseData.droppedGems
        );
      } else {
        toast({
          title: TEXT_CONTENT.questBoard.toasts.completion.questUncompleted.title,
          description: TEXT_CONTENT.questBoard.toasts.completion.questUncompleted.desc.replace('{name}', questObj.name),
          duration: 2000,
        });
      }

      // 🎯 Display character-based milestone message if received
      if (responseData.milestoneMessage) {
        toast({
          title: responseData.milestoneMessage.character,
          description: responseData.milestoneMessage.message,
          duration: 6000,
        });
      }
    } catch (error) {
      logger.error('[QUEST-TOGGLE] Error persisting quest:', error);
      // Don't show error toast as rewards were already applied
      // Just log for debugging
    }
  };


  const handleQuestFavorite = async (questId: string) => {
    if (!token || !userId) return;

    const isCurrentlyFavorited = favoritedQuests.has(questId);

    // Optimistic local update first
    setFavoritedQuests(prev => {
      const newFavorites = new Set(prev);
      if (isCurrentlyFavorited) {
        newFavorites.delete(questId);
      } else {
        newFavorites.add(questId);
      }
      return newFavorites;
    });

    try {
      // Persist to API so favorites survive reload and work with bulk complete
      const response = await fetch('/api/quests/favorites', {
        method: isCurrentlyFavorited ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ questId }),
      });

      if (!response.ok) {
        // Revert on failure
        setFavoritedQuests(prev => {
          const revert = new Set(prev);
          if (isCurrentlyFavorited) {
            revert.add(questId);
          } else {
            revert.delete(questId);
          }
          return revert;
        });
        throw new Error(`API error: ${response.status}`);
      }

      toast({
        title: isCurrentlyFavorited ? "Removed from Favorites" : "Added to Favorites ⭐",
        description: isCurrentlyFavorited
          ? "Quest removed from your bulk-complete list."
          : "Quest starred — it will be included in bulk complete!",
        duration: 2000,
      });
    } catch (error) {
      logger.error('Error updating favorite:', error);
      toast({
        title: TEXT_CONTENT.questBoard.toasts.favorites.error.title,
        description: TEXT_CONTENT.questBoard.toasts.favorites.error.desc,
        duration: 3000,
      });
    }
  };

  const handleEditQuest = (quest: Quest) => {
    setEditingQuest({
      ...quest,
      mandate_period: quest.mandate_period || 'daily',
      mandate_count: quest.mandate_count || 1
    });
    setEditModalOpen(true);
  };

  const handleDeleteQuest = async (questId: string) => {
    if (!token || !userId) return;

    try {
      // Remove from local state
      setQuests(prevQuests => prevQuests.filter(q => q.id !== questId));

      // Delete from Supabase
      const response = await fetch(`/api/quests/${questId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete quest');
      }

      toast({
        title: TEXT_CONTENT.questBoard.toasts.deletion.quest.title,
        description: TEXT_CONTENT.questBoard.toasts.deletion.quest.desc,
        duration: 2000,
      });
    } catch (error) {
      logger.error('Error deleting quest:', error);
      toast({
        title: TEXT_CONTENT.questBoard.toasts.deletion.questError.title,
        description: TEXT_CONTENT.questBoard.toasts.deletion.questError.desc,
        duration: 3000,
      });
    }
  };

  const handleChallengeToggle = async (challengeId: string, newCompleted: boolean) => {
    if (!token || !userId) return;

    // Find the challenge object
    const challengeObj = challenges.find(c => c.id === challengeId);
    if (!challengeObj) {
      logger.error('[CHALLENGE-TOGGLE] Challenge not found:', challengeId);
      return;
    }

    logger.debug('[CHALLENGE-TOGGLE] Updating challenge state:', { challengeId, newCompleted, challengeName: challengeObj.name });

    // Update local state (optimistic update)
    setChallenges(prevChallenges =>
      prevChallenges.map(challenge =>
        challenge.id === challengeId
          ? { ...challenge, completed: newCompleted }
          : challenge
      )
    );

    // 🎯 CRITICAL FIX: Apply rewards when completing challenge
    if (newCompleted) {
      const goldReward = challengeObj.gold || 50;
      const xpReward = challengeObj.xp || 25;

      logger.debug('[CHALLENGE-TOGGLE] Applying rewards:', { gold: goldReward, xp: xpReward });

      // Apply rewards using unified service
      addToCharacterStat('gold', goldReward, `challenge-completion:${challengeId}`);
      addToCharacterStat('experience', xpReward, `challenge-completion:${challengeId}`);

      // Show success toast with rewards
      toast({
        title: TEXT_CONTENT.questBoard.toasts.completion.challenge.title,
        description: TEXT_CONTENT.questBoard.toasts.completion.challenge.desc
          .replace('{name}', challengeObj.name)
          .replace('{gold}', String(goldReward))
          .replace('{xp}', String(xpReward)),
        duration: 4000,
      });
    } else {
      // Challenge uncompleted - just show toast
      toast({
        title: TEXT_CONTENT.questBoard.toasts.completion.challengeUncompleted.title,
        description: TEXT_CONTENT.questBoard.toasts.completion.challengeUncompleted.desc.replace('{name}', challengeObj.name),
        duration: 2000,
      });
    }

    // Persist challenge completion to backend using the standardized challenges API
    try {
      const response = await fetch('/api/challenges', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          challengeId: challengeId,
          completed: newCompleted
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to update challenge: ${response.status} ${errorData.error || ''}`);
      }

      logger.debug('[CHALLENGE-TOGGLE] Challenge persisted to backend successfully');
    } catch (error) {
      logger.error('[CHALLENGE-TOGGLE] Error persisting challenge:', error);
      // Don't show error toast as rewards were already applied
      // Just log for debugging
    }
  };

  const handleEditChallenge = (challenge: any) => {
    setEditingChallenge({
      ...challenge,
      mandate_period: challenge.mandate_period || 'daily',
      mandate_count: challenge.mandate_count || 1
    });
    setEditChallengeModalOpen(true);
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!token || !userId) return;

    try {
      // Remove from local state
      setChallenges(prevChallenges => prevChallenges.filter(c => c.id !== challengeId));

      // Delete from Supabase
      const response = await fetch('/api/challenges', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete challenge');
      }

      toast({
        title: TEXT_CONTENT.questBoard.toasts.deletion.challenge.title,
        description: TEXT_CONTENT.questBoard.toasts.deletion.challenge.desc,
        duration: 2000,
      });
    } catch (error) {
      logger.error('Error deleting challenge:', error);
      toast({
        title: TEXT_CONTENT.questBoard.toasts.deletion.challengeError.title,
        description: TEXT_CONTENT.questBoard.toasts.deletion.challengeError.desc,
        duration: 3000,
      });
    }
  };

  const handleBulkCompleteFavorites = async () => {
    if (!token) return;

    try {
      if (forgeTab === 'quests') {
        const favoritedQuestsInCategory = quests.filter(q =>
          q.category === questCategory &&
          favoritedQuests.has(q.id) &&
          !q.completed
        );

        if (favoritedQuestsInCategory.length === 0) return;

        // Optimistic update all at once
        const questIdsToComplete = new Set(favoritedQuestsInCategory.map(q => q.id));
        setQuests(prevQuests =>
          prevQuests.map(q =>
            questIdsToComplete.has(q.id)
              ? { ...q, completed: true }
              : q
          )
        );

        const failedIds: string[] = [];

        // Complete each favorited quest in the current category
        for (const quest of favoritedQuestsInCategory) {
          try {
            // Apply tarot buffs to rewards
            const { applyTarotBuffs } = await import('@/lib/tarot-buffs');
            const baseXp = quest.xp || 50;
            const baseGold = quest.gold || 25;
            const buffedRewards = applyTarotBuffs(baseXp, baseGold, quest.category);

            if (buffedRewards.buffApplied) {
              logger.debug(`[Bulk Complete] Tarot buff applied to ${quest.name}:`, {
                baseXp,
                baseGold,
                buffedXp: buffedRewards.xp,
                buffedGold: buffedRewards.gold,
                message: buffedRewards.buffMessage
              });
            }

            const response = await fetch('/api/quests/smart-completion', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                questId: quest.id,
                completed: true,
                xpReward: buffedRewards.xp,
                goldReward: buffedRewards.gold,
              }),
            });

            if (!response.ok) {
              logger.error(`[Bulk Complete] Failed to complete quest ${quest.id}:`, response.status);
              failedIds.push(quest.id);
            } else {
              logger.debug(`[Bulk Complete] Successfully completed quest: ${quest.name}`);
            }
          } catch (apiError) {
            logger.error(`[Bulk Complete] API error for quest ${quest.id}:`, apiError);
            failedIds.push(quest.id);
          }
        }

        // Revert failed ones if any
        if (failedIds.length > 0) {
          const failedSet = new Set(failedIds);
          setQuests(prevQuests =>
            prevQuests.map(q =>
              failedSet.has(q.id)
                ? { ...q, completed: false }
                : q
            )
          );
        }

        toast({
          title: TEXT_CONTENT.questBoard.toasts.completion.bulkFavorites.title,
          description: TEXT_CONTENT.questBoard.toasts.completion.bulkFavorites.desc
            .replace('{count}', String(favoritedQuestsInCategory.length - failedIds.length))
            .replace('{category}', getCategoryLabel(questCategory || '')),
          duration: 3000,
        });

      } else {
        // Complete favorited challenges/tasks in this category
        const favoritedChallengesInCategory = challenges.filter(c =>
          c.category === questCategory &&
          favoritedQuests.has(c.id) &&
          !c.completed
        );

        if (favoritedChallengesInCategory.length === 0) return;

        // Optimistic update all at once
        const challengeIdsToComplete = new Set(favoritedChallengesInCategory.map(c => c.id));
        setChallenges(prevChallenges =>
          prevChallenges.map(c =>
            challengeIdsToComplete.has(c.id)
              ? { ...c, completed: true }
              : c
          )
        );

        const failedIds: string[] = [];

        // Complete each favorited challenge
        for (const challenge of favoritedChallengesInCategory) {
          try {
            const goldReward = challenge.gold || 50;
            const xpReward = challenge.xp || 25;

            // Apply rewards locally
            addToCharacterStat('gold', goldReward, `challenge-completion:${challenge.id}`);
            addToCharacterStat('experience', xpReward, `challenge-completion:${challenge.id}`);

            const response = await fetch('/api/challenges', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                challengeId: challenge.id,
                completed: true
              })
            });

            if (!response.ok) {
              logger.error(`[Bulk Complete Challenges] Failed to complete challenge ${challenge.id}`);
              failedIds.push(challenge.id);
            } else {
              logger.debug(`[Bulk Complete Challenges] Successfully completed challenge: ${challenge.name}`);
            }
          } catch (apiError) {
            logger.error(`[Bulk Complete Challenges] API error for challenge ${challenge.id}:`, apiError);
            failedIds.push(challenge.id);
          }
        }

        // Revert failed ones if any
        if (failedIds.length > 0) {
          const failedSet = new Set(failedIds);
          setChallenges(prevChallenges =>
            prevChallenges.map(c =>
              failedSet.has(c.id)
                ? { ...c, completed: false }
                : c
            )
          );
        }

        toast({
          title: "Tasks Completed",
          description: `Successfully completed ${favoritedChallengesInCategory.length - failedIds.length} favorited tasks in ${getCategoryLabel(questCategory || '')}!`,
          duration: 3000,
        });
      }

    } catch (error) {
      logger.error('Error bulk completing favorites:', error);
      toast({
        title: TEXT_CONTENT.questBoard.toasts.completion.bulkError.title,
        description: TEXT_CONTENT.questBoard.toasts.completion.bulkError.desc,
        duration: 3000,
      });
    }
  };

  const handleBulkCompleteAllFavorites = async () => {
    if (!token) return;

    try {
      if (forgeTab === 'quests') {
        const allFavoritedQuests = quests.filter(q =>
          favoritedQuests.has(q.id) &&
          !q.completed
        );

        if (allFavoritedQuests.length === 0) return;

        // Optimistic update all at once
        const questIdsToComplete = new Set(allFavoritedQuests.map(q => q.id));
        setQuests(prevQuests =>
          prevQuests.map(q =>
            questIdsToComplete.has(q.id)
              ? { ...q, completed: true }
              : q
          )
        );

        const failedIds: string[] = [];

        // Complete each favorited quest across all categories
        for (const quest of allFavoritedQuests) {
          try {
            const response = await fetch('/api/quests/smart-completion', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                questId: quest.id,
                completed: true,
                xpReward: quest.xp || 50,
                goldReward: quest.gold || 25,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              logger.error(`[Bulk Complete All] Failed to complete quest ${quest.id}:`, response.status, errorText);
              failedIds.push(quest.id);
            } else {
              const responseData = await response.json();
              logger.debug(`[Bulk Complete All] Successfully completed quest: ${quest.name}`, responseData);
            }
          } catch (apiError) {
            logger.error(`[Bulk Complete All] API error for quest ${quest.id}:`, apiError);
            failedIds.push(quest.id);
          }
        }

        // Revert failed ones if any
        if (failedIds.length > 0) {
          const failedSet = new Set(failedIds);
          setQuests(prevQuests =>
            prevQuests.map(q =>
              failedSet.has(q.id)
                ? { ...q, completed: false }
                : q
            )
          );
        }

        // Wait a moment for database to update, then refresh quest data
        setTimeout(async () => {
          try {
            logger.debug('[Bulk Complete All] Refreshing quest data after completion...');
            const response = await fetch(`/api/quests?t=${Date.now()}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              logger.debug('[Bulk Complete All] Refreshed quest data:', data);
              setQuests(data);
            }
          } catch (error) {
            logger.error('[Bulk Complete All] Error refreshing quest data:', error);
          }
        }, 1000);

        toast({
          title: TEXT_CONTENT.questBoard.toasts.completion.bulkAllFavorites.title,
          description: TEXT_CONTENT.questBoard.toasts.completion.bulkAllFavorites.desc.replace('{count}', String(allFavoritedQuests.length - failedIds.length)),
          duration: 3000,
        });

      } else {
        // Complete all favorited challenges/tasks across all categories
        const allFavoritedChallenges = challenges.filter(c =>
          favoritedQuests.has(c.id) &&
          !c.completed
        );

        if (allFavoritedChallenges.length === 0) return;

        // Optimistic update all at once
        const challengeIdsToComplete = new Set(allFavoritedChallenges.map(c => c.id));
        setChallenges(prevChallenges =>
          prevChallenges.map(c =>
            challengeIdsToComplete.has(c.id)
              ? { ...c, completed: true }
              : c
          )
        );

        const failedIds: string[] = [];

        // Complete each favorited challenge
        for (const challenge of allFavoritedChallenges) {
          try {
            const goldReward = challenge.gold || 50;
            const xpReward = challenge.xp || 25;

            // Apply rewards locally
            addToCharacterStat('gold', goldReward, `challenge-completion:${challenge.id}`);
            addToCharacterStat('experience', xpReward, `challenge-completion:${challenge.id}`);

            const response = await fetch('/api/challenges', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                challengeId: challenge.id,
                completed: true
              })
            });

            if (!response.ok) {
              logger.error(`[Bulk Complete All Challenges] Failed to complete challenge ${challenge.id}`);
              failedIds.push(challenge.id);
            } else {
              logger.debug(`[Bulk Complete All Challenges] Successfully completed challenge: ${challenge.name}`);
            }
          } catch (apiError) {
            logger.error(`[Bulk Complete All Challenges] API error for challenge ${challenge.id}:`, apiError);
            failedIds.push(challenge.id);
          }
        }

        // Revert failed ones if any
        if (failedIds.length > 0) {
          const failedSet = new Set(failedIds);
          setChallenges(prevChallenges =>
            prevChallenges.map(c =>
              failedSet.has(c.id)
                ? { ...c, completed: false }
                : c
            )
          );
        }

        toast({
          title: "All Tasks Completed",
          description: `Successfully completed ${allFavoritedChallenges.length - failedIds.length} favorited tasks across all categories!`,
          duration: 3000,
        });
      }

    } catch (error) {
      logger.error('Error bulk completing all favorites:', error);
      toast({
        title: TEXT_CONTENT.questBoard.toasts.completion.bulkError.title,
        description: TEXT_CONTENT.questBoard.toasts.completion.bulkError.desc,
        duration: 3000,
      });
    }
  };

  // Manual reset function for immediate control
  const handleManualReset = async () => {
    if (!token) return;

    setManualResetLoading(true);
    logger.debug('[Manual Reset] Starting manual reset...');

    try {
      const res = await fetch('/api/quests/reset-daily-ui-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.text();
        logger.error('[Manual Reset] API error:', res.status, err);
        toast({
          title: TEXT_CONTENT.questBoard.toasts.manualReset.error.title,
          description: TEXT_CONTENT.questBoard.toasts.manualReset.error.desc.replace('{error}', err || res.statusText),
          variant: 'destructive',
        });
        return;
      }

      const result = await res.json();
      logger.debug('[Manual Reset] Success:', result);

      // Force all quests to show as incomplete
      setQuests(prevQuests =>
        prevQuests.map(quest => ({
          ...quest,
          completed: false
        }))
      );

      // Add a small delay before refreshing to ensure the reset has completed
      setTimeout(() => {
        logger.debug('[Manual Reset] Refreshing quest data after reset...');
        setRefreshTrigger(prev => prev + 1);
      }, 1000);

      // Reset the daily reset flag (but don't update localStorage for manual resets)
      dailyResetInitiated.current = false; // Allow future resets

      toast({
        title: TEXT_CONTENT.questBoard.toasts.manualReset.complete.title,
        description: TEXT_CONTENT.questBoard.toasts.manualReset.complete.desc,
      });

    } catch (err) {
      logger.error('[Manual Reset] Error:', err);
      toast({
        title: 'Manual Reset Error',
        description: `Error: ${err instanceof Error ? err.message : String(err)}`,
        variant: 'destructive',
      });
    } finally {
      setManualResetLoading(false);
    }
  };


  // Fetch challenges and milestones from Supabase instead of using predefined data
  const fetchChallengesAndMilestones = React.useCallback(async () => {
    if (!user) {
      logger.debug('[Challenges Frontend] No user available, skipping fetch');
      return;
    }

    // Get token directly instead of depending on token state
    const token = await getToken({ template: 'supabase' });
    if (!token) {
      logger.debug('[Challenges Frontend] No token available, skipping fetch');
      return;
    }

    logger.debug('[Challenges Frontend] Starting to fetch challenges and milestones...');

    try {
      // Fetch challenges
      logger.debug('[Challenges Frontend] Fetching challenges from /api/challenges-ultra-simple...');
      const challengesRes = await fetch(`/api/challenges-ultra-simple?t=${Date.now()}&r=${Math.random()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });
      logger.debug('[Challenges Frontend] Challenges response:', { status: challengesRes.status, ok: challengesRes.ok });

      if (challengesRes.ok) {
        const challengesData = await challengesRes.json();
        const completedChallenges = challengesData?.filter((c: any) => c.completed === true) || [];
        logger.debug('[Challenges Frontend] Challenges data received:', {
          count: challengesData?.length || 0,
          completedCount: completedChallenges.length,
          sample: challengesData?.slice(0, 2)?.map((c: any) => ({ id: c.id, name: c.name, completed: c.completed, date: c.date }))
        });
        logger.debug('[Challenges Frontend] Detailed completion debug:', challengesData.map((c: any) => ({
          id: c.id,
          name: c.name,
          completed: c.completed,
          date: c.date,
          debug: c.completion_debug
        })));

        logger.debug('[Challenges Frontend] ✅ COMPLETED challenges:', completedChallenges.map((c: any) => ({ name: c.name, completed: c.completed, date: c.date, completionId: c.completionId })));
        logger.debug('[Challenges Frontend] All challenges completion status:', challengesData?.map((c: any) => ({ name: c.name, completed: c.completed, date: c.date })));
        setChallenges(challengesData || []);
      } else {
        logger.error('[Challenges Frontend] Challenges fetch failed:', challengesRes.status, challengesRes.statusText);
        toast({
          title: 'Error loading challenges',
          description: `Failed to load challenges: ${challengesRes.status} ${challengesRes.statusText}`,
          variant: 'destructive'
        });

        try {
          const errorJson = await challengesRes.json();
          const errorDetails = errorJson.details || errorJson.error;
          if (errorDetails) {
            toast({
              title: 'Server Error Details',
              description: errorDetails,
              variant: 'destructive'
            });
          }
        } catch (e) { logger.error('Error parsing error response', e); }
      }

      // Fetch milestones
      logger.debug('[Challenges Frontend] Fetching milestones from /api/milestones...');
      const milestonesRes = await fetch(`/api/milestones?t=${Date.now()}&r=${Math.random()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });
      logger.debug('[Challenges Frontend] Milestones response:', { status: milestonesRes.status, ok: milestonesRes.ok });

      if (milestonesRes.ok) {
        const milestonesData = await milestonesRes.json();
        logger.debug('[Challenges Frontend] Milestones data received:', {
          count: milestonesData?.length || 0,
          sample: milestonesData?.slice(0, 2)?.map((m: any) => ({ id: m.id, name: m.name, completed: m.completed, date: m.date }))
        });
        logger.debug('[Challenges Frontend] All milestones completion status:', milestonesData?.map((m: any) => ({ name: m.name, completed: m.completed, date: m.date })));
        setMilestones(milestonesData || []);
      } else {
        logger.error('[Challenges Frontend] Milestones fetch failed:', milestonesRes.status, milestonesRes.statusText);
      }
    } catch (error) {
      logger.error('[Challenges Frontend] Error fetching challenges and milestones:', error);
    }
  }, [user, getToken]);

  // Initialize challenges and milestones data - must be before early returns
  useEffect(() => {
    logger.debug('[Challenges Frontend] useEffect triggered, user:', !!user);
    fetchChallengesAndMilestones();
  }, [user, fetchChallengesAndMilestones]);

  const handleMilestoneToggle = async (milestoneId: string, newCompleted: boolean) => {
    if (!token || !userId) return;

    // Find the milestone object
    const milestoneObj = milestones.find(m => m.id === milestoneId);
    if (!milestoneObj) {
      logger.error('[MILESTONE-TOGGLE] Milestone not found:', milestoneId);
      return;
    }

    logger.debug('[MILESTONE-TOGGLE] Updating milestone state:', { milestoneId, newCompleted, milestoneName: milestoneObj.name });

    // Update local state (optimistic update)
    setMilestones(prevMilestones =>
      prevMilestones.map(milestone =>
        milestone.id === milestoneId
          ? { ...milestone, completed: newCompleted }
          : milestone
      )
    );

    // 🎯 CRITICAL FIX: Apply rewards when completing milestone
    if (newCompleted) {
      const goldReward = milestoneObj.gold || 100; // Milestones typically have higher rewards
      const xpReward = milestoneObj.xp || 100;

      logger.debug('[MILESTONE-TOGGLE] Applying rewards:', { gold: goldReward, xp: xpReward });

      // Apply rewards using unified service
      addToCharacterStat('gold', goldReward, `milestone-completion:${milestoneId}`);
      addToCharacterStat('experience', xpReward, `milestone-completion:${milestoneId}`);

      // Apply essence reward based on category
      const category = (milestoneObj.category || '').toLowerCase();
      let essenceType: 'ember_essence' | 'frost_essence' | 'tide_essence' | 'verdant_essence';
      switch (category) {
        case 'might':
        case 'vitality':
          essenceType = 'ember_essence';
          break;
        case 'knowledge':
        case 'exploration':
          essenceType = 'frost_essence';
          break;
        case 'wellness':
        case 'honor':
          essenceType = 'tide_essence';
          break;
        case 'craft':
        case 'castle':
        default:
          essenceType = 'verdant_essence';
          break;
      }
      addToCharacterStat(essenceType, 1, `milestone-completion:${milestoneId}`);

      // Show success toast with rewards
      toast({
        title: TEXT_CONTENT.questBoard.toasts.completion.milestone.title,
        description: TEXT_CONTENT.questBoard.toasts.completion.milestone.desc
          .replace('{name}', milestoneObj.name)
          .replace('{gold}', String(goldReward))
          .replace('{xp}', String(xpReward)),
        duration: 4000,
      });
    } else {
      // Milestone uncompleted - just show toast
      toast({
        title: TEXT_CONTENT.questBoard.toasts.completion.milestoneUncompleted.title,
        description: TEXT_CONTENT.questBoard.toasts.completion.milestoneUncompleted.desc.replace('{name}', milestoneObj.name),
        duration: 2000,
      });
    }

    // Persist milestone completion to backend
    try {
      // First ensure the completion row exists
      await fetch('/api/milestones/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ milestoneId }),
      });
      
      // Then update the completion status (this grants rewards on the server)
      const response = await fetch('/api/milestones/completion', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          milestoneId,
          completed: newCompleted
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update milestone completion');
      }

      logger.debug('[MILESTONE-TOGGLE] Milestone persisted to backend successfully');
    } catch (error) {
      logger.error('[MILESTONE-TOGGLE] Error persisting milestone:', error);
      // Don't show error toast as rewards were already applied
      // Just log for debugging
    }
  };

  const handleMilestoneEdit = (milestone: any) => {
    setEditingMilestone(milestone);
    setEditMilestoneModalOpen(true);
  };

  const handleMilestoneDelete = (milestoneId: string) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (milestone) {
      setMilestoneToDelete(milestone);
      setDeleteMilestoneConfirmOpen(true);
    }
  };

  const confirmDeleteMilestone = async () => {
    if (!token || !userId || !milestoneToDelete) return;

    try {
      // Remove from local state
      setMilestones(prevMilestones => prevMilestones.filter(m => m.id !== milestoneToDelete.id));

      // Delete from Supabase
      const response = await fetch(`/api/milestones?id=${milestoneToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete milestone');
      }

      toast({
        title: TEXT_CONTENT.questBoard.toasts.deletion.milestone.title,
        description: TEXT_CONTENT.questBoard.toasts.deletion.milestone.desc.replace('{name}', milestoneToDelete.name),
      });

      setDeleteMilestoneConfirmOpen(false);
      setMilestoneToDelete(null);
    } catch (error) {
      logger.error('Error deleting milestone:', error);
      toast({
        title: TEXT_CONTENT.questBoard.toasts.deletion.milestoneError.title,
        description: TEXT_CONTENT.questBoard.toasts.deletion.milestoneError.desc,
        variant: "destructive"
      });
    }
  };

  const handleAddMilestone = () => {
    setAddMilestoneModalOpen(true);
  };




  const handleChallengeCategoryChange = (value: string) => {
    setChallengeCategory(value);
  };

  const handleEditQuestSubmit = async (updatedQuest: Quest) => {
    if (!token || !userId) return;

    try {
      // Update local state first (optimistic update)
      setQuests(prevQuests =>
        prevQuests.map(q =>
          q.id === updatedQuest.id
            ? updatedQuest
            : q
        )
      );

      // Update in Supabase using the correct API endpoint
      const response = await fetch(`/api/quests/${updatedQuest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: updatedQuest.name,
          description: updatedQuest.description,
          category: updatedQuest.category,
          difficulty: updatedQuest.difficulty,
          xp_reward: updatedQuest.xp || 50,
          gold_reward: updatedQuest.gold || 25,
          mandate_period: updatedQuest.mandate_period || 'daily',
          mandate_count: updatedQuest.mandate_count || 1,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quest');
      }

      const result = await response.json();
      logger.debug('[Quest Edit] Update successful:', result);

      toast({
        title: TEXT_CONTENT.questBoard.toasts.updates.quest.title,
        description: TEXT_CONTENT.questBoard.toasts.updates.quest.desc,
        duration: 2000,
      });

      setEditModalOpen(false);
      setEditingQuest(null);
    } catch (error) {
      logger.error('Error updating quest:', error);

      // Revert optimistic update on error
      setQuests(prevQuests =>
        prevQuests.map(q =>
          q.id === updatedQuest.id
            ? editingQuest || q
            : q
        )
      );

      toast({
        title: TEXT_CONTENT.questBoard.toasts.updates.questError.title,
        description: TEXT_CONTENT.questBoard.toasts.updates.questError.desc.replace('{error}', error instanceof Error ? error.message : 'Unknown error'),
        duration: 3000,
      });
    }
  };

  const handleEditChallengeSubmit = async (updatedChallenge: any) => {
    if (!token || !userId) return;

    try {
      // Call API to update challenge
      const response = await fetch('/api/challenges', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: updatedChallenge.id,
          name: updatedChallenge.name,
          description: updatedChallenge.description,
          category: updatedChallenge.category,
          difficulty: updatedChallenge.difficulty,
          xp: updatedChallenge.xp,
          gold: updatedChallenge.gold,
          mandate_period: updatedChallenge.mandate_period || 'daily',
          mandate_count: updatedChallenge.mandate_count || 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update challenge');
      }

      // Update local state
      setChallenges(prevChallenges =>
        prevChallenges.map(c =>
          c.id === updatedChallenge.id
            ? { ...c, ...updatedChallenge }
            : c
        )
      );

      toast({
        title: TEXT_CONTENT.questBoard.toasts.updates.challenge.title,
        description: TEXT_CONTENT.questBoard.toasts.updates.challenge.desc.replace('{name}', updatedChallenge.name),
        duration: 3000,
      });

      setEditChallengeModalOpen(false);
      setEditingChallenge(null);
    } catch (error) {
      logger.error('Error updating challenge:', error);
      toast({
        title: TEXT_CONTENT.questBoard.toasts.updates.challengeError.title,
        description: TEXT_CONTENT.questBoard.toasts.updates.challengeError.desc,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleEditMilestoneSubmit = async (updatedMilestone: any) => {
    if (!token || !userId) return;

    try {
      // Call API to update milestone
      const response = await fetch('/api/milestones', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: updatedMilestone.id,
          name: updatedMilestone.name,
          description: updatedMilestone.description,
          category: updatedMilestone.category,
          difficulty: updatedMilestone.difficulty,
          xp: updatedMilestone.xp,
          gold: updatedMilestone.gold,
          target: updatedMilestone.target,
          unit: updatedMilestone.unit
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update milestone');
      }

      // Update local state
      setMilestones(prevMilestones =>
        prevMilestones.map(m =>
          m.id === updatedMilestone.id
            ? { ...m, ...updatedMilestone }
            : m
        )
      );

      toast({
        title: TEXT_CONTENT.questBoard.toasts.updates.milestone.title,
        description: TEXT_CONTENT.questBoard.toasts.updates.milestone.desc.replace('{name}', updatedMilestone.name),
        duration: 3000,
      });

      setEditMilestoneModalOpen(false);
      setEditingMilestone(null);
    } catch (error) {
      logger.error('Error updating milestone:', error);
      toast({
        title: TEXT_CONTENT.questBoard.toasts.updateFailed.title,
        description: TEXT_CONTENT.questBoard.toasts.updateFailed.desc,
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleAddQuestSubmit = async (quest: Quest) => {
    if (!token || !userId) return;

    try {
      // Add to local state
      const newQuest = { ...quest, id: Date.now().toString(), isNew: false };
      setQuests(prevQuests => [...prevQuests, newQuest]);

      // Add to Supabase
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(quest)
      });

      if (!response.ok) {
        throw new Error('Failed to add quest');
      }

      toast({
        title: TEXT_CONTENT.questBoard.toasts.questAdded.title,
        description: TEXT_CONTENT.questBoard.toasts.questAdded.desc,
        duration: 2000,
      });

      setAddQuestModalOpen(false);
    } catch (error) {
      logger.error('Error adding quest:', error);
      toast({
        title: TEXT_CONTENT.questBoard.toasts.error.title,
        description: TEXT_CONTENT.questBoard.toasts.error.desc,
        duration: 3000,
      });
    }
  };

  const confirmDeleteQuest = () => {
    if (questToDelete) {
      handleDeleteQuest(questToDelete.id);
      setQuestToDelete(null);
    }
  };

  const cancelDeleteQuest = () => {
    setQuestToDelete(null);
  };

  const handleAddChallengeType = () => {
    setAddChallengeModalOpen(true);
  };


  if (!isClerkLoaded || !isUserLoaded) {
    logger.debug('[Challenges Frontend] Early return - Waiting for auth and Clerk client...', { isClerkLoaded, isUserLoaded, user: !!user });
    return <TasksLoading />;
  }

  if (!userId) {
    logger.debug('[Challenges Frontend] Early return - No userId found', { userId, user: !!user });
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">{TEXT_CONTENT.questBoard.header.guide.title}</h1>
        <div className="text-red-500 bg-red-900 p-4 rounded-md mb-4">{TEXT_CONTENT.questBoard.noUser}</div>
      </main>
    );
  }

  const getCategoryIcon = (category: string) => {
    return categoryIcons[category as keyof typeof categoryIcons] || Trophy;
  }
  const getCategoryLabel = (category: string) => {
    return categoryLabels[category as keyof typeof categoryLabels] || category.charAt(0).toUpperCase() + category.slice(1);
  }



  if (loading) {
    return (
      <LoadingScreen
        title="Seeking Your Quests"
        icon={<Sword className="w-12 h-12" />}
        content={
          <div className="space-y-4">
            <p className="border-t border-blue-500/20 pt-4 px-12 italic">
              &quot;The path to greatness is paved with daily devotion. Your legend begins with a single task.&quot;
            </p>
          </div>
        }
      />
    );
  }

  return (
    <EnhancedErrorBoundary>
    <div className="min-h-screen quests-page-container pb-20">


        <MobileLayoutWrapper className="quests-page-container" enableScroll={false}>
          <HeaderSection
            title={TEXT_CONTENT.questBoard.header.title}
            subtitle={TEXT_CONTENT.questBoard.header.subtitle}
            imageSrc="/images/quests-header.webp"
            defaultBgColor="bg-amber-900"
            shouldRevealImage={true}
            guideComponent={
              <PageGuide
                title={TEXT_CONTENT.questBoard.header.guide.title}
                subtitle={TEXT_CONTENT.questBoard.header.guide.subtitle}
                sections={[
                  {
                    title: TEXT_CONTENT.questBoard.header.guide.sections.daily.title,
                    icon: CheckCircle2,
                    content: TEXT_CONTENT.questBoard.header.guide.sections.daily.content
                  },
                  {
                    title: TEXT_CONTENT.questBoard.header.guide.sections.epic.title,
                    icon: Zap,
                    content: TEXT_CONTENT.questBoard.header.guide.sections.epic.content
                  },
                  {
                    title: TEXT_CONTENT.questBoard.header.guide.sections.milestones.title,
                    icon: Trophy,
                    content: TEXT_CONTENT.questBoard.header.guide.sections.milestones.content
                  }
                ]}
              />
            }
          />
          <MobileContentWrapper>
            {error && <p className="text-red-500 bg-red-900 p-4 rounded-md mb-4">{error}</p>}

            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)} className="w-full mb-8">
              <TabsList className="w-full md:w-auto mb-8">
                <TabsTrigger value="forge">
                  <Sword className="w-4 h-4" />
                  <span>The Forge</span>
                </TabsTrigger>
                <TabsTrigger value="ledger" disabled={stats.level < 10}>
                  <Flame className="w-4 h-4" />
                  <span>{stats.level < 10 ? 'Ledger (Lvl 10)' : 'The Ledger'}</span>
                </TabsTrigger>
                <TabsTrigger value="sanctuary" disabled={stats.level < 20}>
                  <Trophy className="w-4 h-4" />
                  <span>{stats.level < 20 ? 'Sanctuary (Lvl 20)' : 'The Sanctuary'}</span>
                </TabsTrigger>
                <TabsTrigger value="recovery">
                  <Heart className="w-4 h-4" />
                  <span>Recovery</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* THE LEDGER - Mastery Tracking */}
            {
              activeView === 'ledger' && (
                <MasteryLedger />
              )
            }

            {/* THE FORGE - Unified Active Board */}
            {
              activeView === 'forge' && (
                <div className="space-y-8">
                  {/* Bulk Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                    <Button
                      onClick={handleBulkCompleteFavorites}
                      disabled={loading || (forgeTab === 'quests' ? quests : challenges).filter(q => q.category === questCategory && favoritedQuests.has(q.id) && !q.completed).length === 0}
                      className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-800/50 disabled:text-zinc-300 text-white px-4 py-3 font-bold rounded-lg shadow-lg"
                      aria-label={forgeTab === 'quests' ? "Complete all favorited quests in this category" : "Complete all favorited tasks in this category"}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      {(forgeTab === 'quests' 
                        ? TEXT_CONTENT.questBoard.buttons.completeFavorites 
                        : "Complete {count} Starred Tasks"
                      ).replace('{count}', String((forgeTab === 'quests' ? quests : challenges).filter(q => q.category === questCategory && favoritedQuests.has(q.id) && !q.completed).length))}
                    </Button>
                    <Button
                      onClick={handleBulkCompleteAllFavorites}
                      disabled={loading || (forgeTab === 'quests' ? quests : challenges).filter(q => favoritedQuests.has(q.id) && !q.completed).length === 0}
                      className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-800/50 disabled:text-zinc-400 text-white px-4 py-3 font-bold rounded-lg shadow-lg"
                      aria-label={forgeTab === 'quests' ? "Complete all favorited quests across all categories" : "Complete all favorited tasks across all categories"}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      {(forgeTab === 'quests'
                        ? TEXT_CONTENT.questBoard.buttons.completeAllFavorites
                        : "Complete All {count} Starred Tasks"
                      ).replace('{count}', String((forgeTab === 'quests' ? quests : challenges).filter(q => favoritedQuests.has(q.id) && !q.completed).length))}
                    </Button>
                    <Button
                      onClick={handleManualReset}
                      disabled={manualResetLoading || !token}
                      className="bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800/50 disabled:text-zinc-400 text-white px-4 py-3 font-bold rounded-lg shadow-lg border border-zinc-500"
                      aria-label="Manually reset today's quests"
                    >
                      {manualResetLoading ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {TEXT_CONTENT.questBoard.buttons.resetting}
                        </>
                      ) : (
                        <>
                          🔄 {TEXT_CONTENT.questBoard.buttons.reset}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Simple Toggle for Daily Quests / Challenges */}
                  <div className="space-y-6">
                    {/* Toggle Buttons */}
                    <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg border border-zinc-800 w-fit">
                      <button
                        onClick={() => setForgeTab('quests')}
                        className={cn(
                          "px-6 py-2 rounded-md text-sm font-bold transition-all",
                          forgeTab === 'quests'
                            ? "bg-orange-500 text-white shadow-lg"
                            : "text-zinc-400 hover:text-zinc-200"
                        )}
                      >
                        Daily Quests
                      </button>
                      <button
                        onClick={() => setForgeTab('challenges')}
                        className={cn(
                          "px-6 py-2 rounded-md text-sm font-bold transition-all",
                          forgeTab === 'challenges'
                            ? "bg-blue-500 text-white shadow-lg"
                            : "text-zinc-400 hover:text-zinc-200"
                        )}
                      >
                        Challenges
                      </button>
                    </div>

                    {/* Conditional Content */}
                    {forgeTab === 'quests' ? (
                      <QuestOrganization
                        quests={quests}
                        onQuestToggle={handleQuestToggle}
                        onQuestFavorite={handleQuestFavorite}
                        onQuestEdit={handleEditQuest}
                        onQuestDelete={handleDeleteQuest}
                        onAddQuest={() => openQuickAdd()}
                        showCategoryFilter={true}
                        context="quests"
                        hideOverview={true}
                        hideCategoryOverview={true}
                        isLoading={loading}
                        bossQuestId={bossQuestId}
                        onToggleBossQuest={(id) => setBossQuestId(prev => prev === id ? undefined : id)}
                      />
                    ) : (
                      <QuestOrganization
                        quests={challenges}
                        onQuestToggle={handleChallengeToggle}
                        onQuestFavorite={handleQuestFavorite}
                        onQuestEdit={handleEditChallenge}
                        onQuestDelete={handleDeleteChallenge}
                        onAddQuest={handleAddChallengeType}
                        showCategoryFilter={true}
                        context="challenges"
                        hideOverview={true}
                        hideCategoryOverview={true}
                        isLoading={loading}
                      />
                    )}
                  </div>

                  {/* Journey Progress Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-b border-amber-900/20 pb-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Zap className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-amber-400 font-serif">Journey Progress</h2>
                        <p className="text-xs text-zinc-500">Track your path and achievements</p>
                      </div>
                    </div>

                    {/* Sync Status Indicators */}
                    <div className="flex justify-between items-center">
                      <OfflineQueueIndicator
                        isOnline={isOnline}
                        queueStats={queueStats}
                        isProcessing={isQueueProcessing}
                        onProcessQueue={processQueue}
                        onClearQueue={clearQueue}
                      />
                      <SyncStatusIndicator
                        isSyncing={isSyncing}
                        lastSync={lastSync}
                        error={syncError}
                      />
                    </div>

                    {/* Gameplay Loop Indicator */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-amber-500 font-medieval">{TEXT_CONTENT.questBoard.journey.title}</h3>
                        <div className="flex items-center gap-4">
                          {isEditingGoal ? (
                            <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-lg border border-amber-900/30">
                              <span className="text-xs text-amber-200/70">Goal:</span>
                              <input 
                                type="number" 
                                min="1" max="50" 
                                value={tempGoal} 
                                onChange={e => setTempGoal(Number(e.target.value) || 1)}
                                className="w-12 bg-zinc-900 text-white text-center text-sm border-none rounded"
                              />
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 px-2 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                onClick={async () => {
                                  setDailyGoal(tempGoal);
                                  setIsEditingGoal(false);
                                  if (token) {
                                    fetch('/api/user-preferences', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({ key: 'daily_goal', value: tempGoal })
                                    });
                                  }
                                }}
                              >
                                Save
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs font-bold bg-zinc-950 px-3 py-1.5 rounded-lg border border-amber-900/30">
                              <span className="text-amber-500">Goal: {dailyGoal}/day</span>
                              <button onClick={() => setIsEditingGoal(true)} className="text-amber-200/50 hover:text-amber-300 transition-colors">
                                <Pencil className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <StreakIndicator
                            currentStreak={streakData?.streak_days || 0}
                            isCompletedToday={quests.filter(q => q.completed).length >= dailyGoal}
                          />
                        </div>
                      </div>
                      <GameplayLoopIndicator />
                    </div>

                    {/* Activity Rings Card */}
                    <ActivityRingsCard
                      completedCount={quests.filter(q => q.completed).length}
                      dailyGoal={dailyGoal}
                      xpEarnedToday={quests.filter(q => q.completed).reduce((sum, q) => sum + (q.xp || 25), 0)}
                      xpDailyTarget={dailyGoal * 25}
                      categoriesTouched={new Set(quests.filter(q => q.completed).map(q => q.category)).size}
                      totalCategories={8}
                    />

                    {/* Chronicles Card */}
                    <ChroniclesCard currentLevel={stats.level} />

                    {/* Tarot Card Display */}
                    <TarotCardDisplay />
                  </div>
                </div>
              )
            }

            {/* THE SANCTUARY - Milestones */}
            {
              activeView === 'sanctuary' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-blue-900/20 pb-4 mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <Trophy className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-blue-400 font-serif">The Sanctuary</h2>
                      <p className="text-sm text-zinc-500">Epic milestones and legendary achievements</p>
                    </div>
                  </div>
                  <QuestOrganization
                    quests={milestones}
                    onQuestToggle={handleMilestoneToggle}
                    onQuestFavorite={() => { }}
                    onQuestEdit={handleMilestoneEdit}
                    onQuestDelete={handleMilestoneDelete}
                    onAddQuest={handleAddMilestone}
                    showCategoryFilter={true}
                    context="milestones"
                    hideOverview={true}
                    hideCategoryOverview={true}
                    isLoading={loading}
                  />
                </div>
              )
            }

            {/* RECOVERY - Streak Management */}
            {
              activeView === 'recovery' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-green-900/20 pb-4 mb-6">
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <Heart className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-green-400 font-serif">Recovery</h2>
                      <p className="text-sm text-zinc-500">Restore your streaks and momentum</p>
                    </div>
                  </div>
                  <div className="mb-6">
                    <label htmlFor="recovery-category-select" className="block text-sm font-medium text-amber-300 mb-2">
                      Select Workout Category
                    </label>
                    <Select value={challengeCategory || ''} onValueChange={handleChallengeCategoryChange}>
                      <SelectTrigger className="w-full rounded-lg border border-[#F59E0B] bg-black text-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500 transition-colors" aria-label="Recovery category dropdown">
                        <SelectValue placeholder="Select workout category" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border border-[#F59E0B]">
                        <SelectItem value="all">All Categories</SelectItem>
                        {workoutPlan.map(day => (
                          <SelectItem key={day.category} value={day.category}>
                            {day.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {token && (
                    <StreakRecovery
                      token={token}
                      category={challengeCategory}
                      streakData={challengeStreakData}
                      onStreakUpdate={() => {
                        if (token && challengeCategory) {
                          fetch(`/api/streaks-direct?category=${encodeURIComponent(challengeCategory)}`, {
                            headers: { Authorization: `Bearer ${token}` },
                          })
                            .then(res => {
                              if (res.ok) return res.json();
                              throw new Error('Failed to refetch');
                            })
                            .then(data => setChallengeStreakData(data))
                            .catch(error => logger.error('Error refetching streak:', error));
                        }
                      }}
                    />
                  )}
                </div>
              )
            }

          </MobileContentWrapper>
        </MobileLayoutWrapper>

        {/* Partner Creature Display */}
        {activePartner && (
          <div 
            className={`fixed bottom-24 left-4 z-[9999] transition-transform duration-300 pointer-events-none ${isPartnerAnimating ? 'scale-125 -translate-y-4' : 'scale-100 hover:scale-110'} md:bottom-8 md:left-8 flex flex-col items-center`}
          >
            {partnerSpeech && (
              <div className="mb-2 bg-white text-black px-3 py-1 rounded-2xl shadow-lg relative animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300">
                <p className="text-sm font-bold text-black">{partnerSpeech}</p>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white"></div>
              </div>
            )}
            <div className="relative w-24 h-24 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Image
                src={activePartner.isMythic ? `/images/Mythics/${activePartner.filename}?v=2` : `/images/creatures/${activePartner.filename}`}
                alt={activePartner.name}
                fill
                className={`object-contain ${isPartnerAnimating ? 'animate-bounce' : 'animate-float'}`}
              />
            </div>
          </div>
        )}

        {/* Bottom spacing */}
        <div className="h-8 md:h-12"></div>
        {/* Edit Quest Modal */}
        <ResponsiveModal
          isOpen={editModalOpen && !!editingQuest}
          onClose={() => { setEditModalOpen(false); setEditingQuest(null); }}
          title={TEXT_CONTENT.questBoard.modals.editQuest.title}
        >
          {editingQuest && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-amber-500/80 ml-1">Name</label>
                <input
                  className="w-full p-4 bg-zinc-950 border-2 border-amber-900/10 rounded-xl focus:border-amber-500/30 focus:bg-zinc-900 outline-none transition-all duration-300 text-white placeholder:text-zinc-700"
                  value={editingQuest.name}
                  onChange={e => setEditingQuest({ ...editingQuest, name: e.target.value })}
                  placeholder="Quest name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-amber-500/80 ml-1">Description</label>
                <textarea
                  className="w-full p-4 bg-zinc-950 border-2 border-amber-900/10 rounded-xl focus:border-amber-500/30 focus:bg-zinc-900 outline-none transition-all duration-300 min-h-[100px] resize-none text-zinc-200 placeholder:text-zinc-700"
                  value={editingQuest.description}
                  onChange={e => setEditingQuest({ ...editingQuest, description: e.target.value })}
                  placeholder="Quest description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-amber-500/80 ml-1">{TEXT_CONTENT.quests.form.categoryLabel}</label>
                  <Select
                    value={editingQuest.category}
                    onValueChange={(val) => setEditingQuest({ ...editingQuest, category: val })}
                  >
                    <SelectTrigger className="h-14 bg-zinc-950 border-2 border-amber-900/20 rounded-xl transition-all hover:border-amber-500/30 w-full text-white">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent side="top" className="bg-zinc-900 border-amber-900/50">
                      {questCategories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="focus:bg-amber-500/10 focus:text-amber-200">
                          <div className="flex items-center gap-3 py-1">
                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                              {React.createElement(categoryIcons[cat as keyof typeof categoryIcons] || Sword, { className: "w-4 h-4" })}
                            </div>
                            <span className="font-medium">{categoryLabels[cat as keyof typeof categoryLabels] || cat}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-amber-500/80 ml-1">{TEXT_CONTENT.quests.form.difficultyLabel}</label>
                  <Select
                    value={editingQuest.difficulty}
                    onValueChange={(val) => setEditingQuest({ ...editingQuest, difficulty: val })}
                  >
                    <SelectTrigger className="h-14 bg-zinc-950 border-2 border-amber-900/20 rounded-xl transition-all hover:border-amber-500/30 w-full text-white">
                      <SelectValue placeholder="Select Difficulty" />
                    </SelectTrigger>
                    <SelectContent side="top" className="bg-zinc-900 border-amber-900/50">
                      {Object.entries(difficultySettings).map(([key, value]) => (
                        <SelectItem key={key} value={key} className="focus:bg-amber-500/10 focus:text-amber-200">
                          <div className="flex items-center gap-3 py-1">
                            <div className={`p-2 bg-zinc-800 rounded-lg ${value.color}`}>
                              {value.icon}
                            </div>
                            <div>
                              <div className="font-bold text-zinc-200">{value.label}</div>
                              <div className="text-[10px] text-zinc-500 uppercase flex gap-2">
                                <span>+{value.gold} Gold</span>
                                <span>+{value.xp} XP</span>
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Strategic Mandate Section */}
              <div className="space-y-4 p-5 bg-zinc-950 border-2 border-amber-900/20 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold uppercase tracking-wider text-amber-500/80">{TEXT_CONTENT.quests.mastery.form.sectionTitle}</label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">{TEXT_CONTENT.quests.mastery.form.periodLabel}</label>
                    <Select
                      value={editingQuest.mandate_period || 'daily'}
                      onValueChange={(val) => setEditingQuest({ ...editingQuest, mandate_period: val as any })}
                    >
                      <SelectTrigger className="h-12 bg-zinc-900 border border-amber-900/30 rounded-xl transition-all hover:border-amber-500/30 text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent side="top" className="bg-zinc-900 border-amber-900/50">
                        <SelectItem value="daily">{TEXT_CONTENT.quests.mastery.form.periods.daily}</SelectItem>
                        <SelectItem value="weekly">{TEXT_CONTENT.quests.mastery.form.periods.weekly}</SelectItem>
                        <SelectItem value="monthly">{TEXT_CONTENT.quests.mastery.form.periods.monthly}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">{TEXT_CONTENT.quests.mastery.form.countLabel}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={editingQuest.mandate_period === 'weekly' ? 7 : 31}
                        className="h-12 w-full bg-zinc-900 border border-amber-900/30 rounded-xl px-4 focus:border-amber-500/50 outline-none transition-all text-white text-sm"
                        value={editingQuest.mandate_count || 1}
                        onChange={(e) => setEditingQuest({ ...editingQuest, mandate_count: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 px-6 rounded-xl border-amber-900/30 text-amber-500 hover:bg-amber-500/10 transition-all font-bold uppercase tracking-widest text-[10px]"
                  onClick={() => { setEditModalOpen(false); setEditingQuest(null); }}
                >
                  {TEXT_CONTENT.questBoard.modals.editQuest.cancel}
                </Button>
                <Button
                  type="button"
                  className="h-12 px-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all font-bold uppercase tracking-widest text-[10px]"
                  onClick={() => handleEditQuestSubmit(editingQuest)}
                >
                  {TEXT_CONTENT.questBoard.modals.editQuest.save}
                </Button>
              </div>
            </div>
          )}
        </ResponsiveModal>

        {/* Edit Challenge Modal */}
        <ResponsiveModal
          isOpen={editChallengeModalOpen && !!editingChallenge}
          onClose={() => { setEditChallengeModalOpen(false); setEditingChallenge(null); }}
          title={TEXT_CONTENT.questBoard.modals.editChallenge.title}
        >
          {editingChallenge && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-red-500/80 ml-1">Name</label>
                <input
                  className="w-full p-4 bg-zinc-950 border-2 border-red-900/10 rounded-xl focus:border-red-500/30 focus:bg-zinc-900 outline-none transition-all duration-300 text-white placeholder:text-zinc-800"
                  value={editingChallenge.name}
                  onChange={e => setEditingChallenge({ ...editingChallenge, name: e.target.value })}
                  placeholder="Challenge name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-red-500/80 ml-1">Description</label>
                <textarea
                  className="w-full p-4 bg-zinc-950 border-2 border-red-900/10 rounded-xl focus:border-red-500/30 focus:bg-zinc-900 outline-none transition-all duration-300 min-h-[100px] resize-none text-zinc-200 placeholder:text-zinc-800"
                  value={editingChallenge.description}
                  onChange={e => setEditingChallenge({ ...editingChallenge, description: e.target.value })}
                  placeholder="Challenge description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-red-500/80 ml-1">Category</label>
                  <Select
                    value={editingChallenge.category}
                    onValueChange={(val) => setEditingChallenge({ ...editingChallenge, category: val })}
                  >
                    <SelectTrigger className="h-14 bg-zinc-950 border-2 border-red-900/20 rounded-xl transition-all hover:border-red-500/30 w-full text-white">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent side="top" className="bg-zinc-900 border-red-900/50">
                      <SelectItem value="Might">Might</SelectItem>
                      <SelectItem value="Knowledge">Knowledge</SelectItem>
                      <SelectItem value="Spirit">Spirit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-red-500/80 ml-1">Difficulty</label>
                  <Select
                    value={editingChallenge.difficulty}
                    onValueChange={(val) => setEditingChallenge({ ...editingChallenge, difficulty: val })}
                  >
                    <SelectTrigger className="h-14 bg-zinc-950 border-2 border-red-900/20 rounded-xl transition-all hover:border-red-500/30 w-full text-white">
                      <SelectValue placeholder="Select Difficulty" />
                    </SelectTrigger>
                    <SelectContent side="top" className="bg-zinc-900 border-red-900/50">
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Strategic Mandate Section */}
              <div className="space-y-4 p-5 bg-red-950/10 border-2 border-red-900/20 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold uppercase tracking-wider text-red-500/80">{TEXT_CONTENT.quests.mastery.form.sectionTitle}</label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">{TEXT_CONTENT.quests.mastery.form.periodLabel}</label>
                    <Select
                      value={editingChallenge.mandate_period || 'daily'}
                      onValueChange={(val) => setEditingChallenge({ ...editingChallenge, mandate_period: val as any })}
                    >
                      <SelectTrigger className="h-12 bg-zinc-900 border border-red-900/30 rounded-xl transition-all hover:border-red-500/30 text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent side="top" className="bg-zinc-900 border-red-900/50">
                        <SelectItem value="daily">{TEXT_CONTENT.quests.mastery.form.periods.daily}</SelectItem>
                        <SelectItem value="weekly">{TEXT_CONTENT.quests.mastery.form.periods.weekly}</SelectItem>
                        <SelectItem value="monthly">{TEXT_CONTENT.quests.mastery.form.periods.monthly}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">{TEXT_CONTENT.quests.mastery.form.countLabel}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={editingChallenge.mandate_period === 'weekly' ? 7 : 31}
                        className="h-12 w-full bg-zinc-900 border border-red-900/30 rounded-xl px-4 focus:border-red-500/50 outline-none transition-all text-white text-sm"
                        value={editingChallenge.mandate_count || 1}
                        onChange={(e) => setEditingChallenge({ ...editingChallenge, mandate_count: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 px-6 rounded-xl border-red-900/30 text-red-500 hover:bg-red-500/10 transition-all font-bold uppercase tracking-widest text-[10px]"
                  onClick={() => { setEditChallengeModalOpen(false); setEditingChallenge(null); }}
                >
                  {TEXT_CONTENT.questBoard.modals.editChallenge.cancel}
                </Button>
                <Button
                  type="button"
                  className="h-12 px-8 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all font-bold uppercase tracking-widest text-[10px]"
                  onClick={() => handleEditChallengeSubmit(editingChallenge)}
                >
                  {TEXT_CONTENT.questBoard.modals.editChallenge.save}
                </Button>
              </div>
            </div>
          )}
        </ResponsiveModal>

        {/* Edit Milestone Modal */}
        <ResponsiveModal
          isOpen={editMilestoneModalOpen && !!editingMilestone}
          onClose={() => { setEditMilestoneModalOpen(false); setEditingMilestone(null); }}
          title={TEXT_CONTENT.questBoard.modals.editMilestone.title}
        >
          {editingMilestone && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-blue-500/80 ml-1">Name</label>
                <input
                  className="w-full p-4 bg-blue-950/10 border-2 border-blue-900/10 rounded-xl focus:border-blue-500/30 focus:bg-blue-900/20 outline-none transition-all duration-300 text-white placeholder:text-blue-900/30"
                  value={editingMilestone.name}
                  onChange={e => setEditingMilestone({ ...editingMilestone, name: e.target.value })}
                  placeholder="Milestone name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-blue-500/80 ml-1">Description</label>
                <textarea
                  className="w-full p-4 bg-blue-950/10 border-2 border-blue-900/10 rounded-xl focus:border-blue-500/30 focus:bg-blue-900/20 outline-none transition-all duration-300 min-h-[100px] resize-none text-zinc-200 placeholder:text-blue-900/30"
                  value={editingMilestone.description}
                  onChange={e => setEditingMilestone({ ...editingMilestone, description: e.target.value })}
                  placeholder="Milestone description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-blue-500/80 ml-1">{TEXT_CONTENT.quests.form.categoryLabel}</label>
                  <Select
                    value={editingMilestone.category}
                    onValueChange={(val) => setEditingMilestone({ ...editingMilestone, category: val })}
                  >
                    <SelectTrigger className="h-14 bg-blue-950/10 border-2 border-blue-900/20 rounded-xl transition-all hover:border-blue-500/30 w-full text-white">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent side="top" className="bg-zinc-900 border-blue-900/50">
                      {questCategories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="focus:bg-blue-500/10 focus:text-blue-200">
                          <div className="flex items-center gap-3 py-1">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                              {React.createElement(categoryIcons[cat as keyof typeof categoryIcons] || Sword, { className: "w-4 h-4" })}
                            </div>
                            <span className="font-medium">{categoryLabels[cat as keyof typeof categoryLabels] || cat}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-blue-500/80 ml-1">{TEXT_CONTENT.quests.form.difficultyLabel}</label>
                  <Select
                    value={editingMilestone.difficulty}
                    onValueChange={(val) => setEditingMilestone({ ...editingMilestone, difficulty: val })}
                  >
                    <SelectTrigger className="h-14 bg-blue-950/10 border-2 border-blue-900/20 rounded-xl transition-all hover:border-blue-500/30 w-full text-white">
                      <SelectValue placeholder="Select Difficulty" />
                    </SelectTrigger>
                    <SelectContent side="top" className="bg-zinc-900 border-blue-900/50">
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-blue-500/80 ml-1">Target</label>
                  <input
                    type="number"
                    className="w-full p-4 bg-blue-950/10 border-2 border-blue-900/10 rounded-xl focus:border-blue-500/30 focus:bg-blue-900/20 outline-none transition-all duration-300 text-white"
                    value={editingMilestone.target}
                    onChange={e => setEditingMilestone({ ...editingMilestone, target: Number(e.target.value) })}
                    placeholder="Target value"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-blue-500/80 ml-1">Unit</label>
                  <input
                    className="w-full p-4 bg-blue-950/10 border-2 border-blue-900/10 rounded-xl focus:border-blue-500/30 focus:bg-blue-900/20 outline-none transition-all duration-300 text-white placeholder:text-blue-900/30"
                    value={editingMilestone.unit}
                    onChange={e => setEditingMilestone({ ...editingMilestone, unit: e.target.value })}
                    placeholder="e.g. times"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 px-6 rounded-xl border-blue-900/30 text-blue-500 hover:bg-blue-500/10 transition-all font-bold uppercase tracking-widest text-[10px]"
                  onClick={() => { setEditMilestoneModalOpen(false); setEditingMilestone(null); }}
                >
                  {TEXT_CONTENT.questBoard.modals.editMilestone.cancel}
                </Button>
                <Button
                  type="button"
                  className="h-12 px-8 rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-all font-bold uppercase tracking-widest text-[10px]"
                  onClick={() => handleEditMilestoneSubmit(editingMilestone)}
                >
                  {TEXT_CONTENT.questBoard.modals.editMilestone.save}
                </Button>
              </div>
            </div>
          )}
        </ResponsiveModal>
        {/* Delete Milestone Confirmation Modal */}
        <ResponsiveModal
          isOpen={deleteMilestoneConfirmOpen && !!milestoneToDelete}
          onClose={() => { setDeleteMilestoneConfirmOpen(false); setMilestoneToDelete(null); }}
          title="Delete Milestone"
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setDeleteMilestoneConfirmOpen(false); setMilestoneToDelete(null); }}
              >
                {TEXT_CONTENT.questBoard.buttons.cancel}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDeleteMilestone}
              >
                {TEXT_CONTENT.questBoard.buttons.delete}
              </Button>
            </>
          }
        >
          <p>{TEXT_CONTENT.questBoard.modals.delete.confirmMilestone.replace('{name}', milestoneToDelete?.name)}</p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {TEXT_CONTENT.questBoard.modals.delete.warning}
          </p>
        </ResponsiveModal>
        {/* Add Milestone Modal */}
        <ResponsiveModal
          isOpen={addMilestoneModalOpen}
          onClose={() => setAddMilestoneModalOpen(false)}
          title={TEXT_CONTENT.questBoard.modals.addMilestone.title}
        >
          <AddMilestoneForm
            userId={userId}
            onSuccess={() => {
              setAddMilestoneModalOpen(false);
              fetchChallengesAndMilestones();
            }}
            onCancel={() => setAddMilestoneModalOpen(false)}
          />
        </ResponsiveModal>
        {/* Add Custom Challenge Modal */}
        <ResponsiveModal
          isOpen={addChallengeModalOpen}
          onClose={() => setAddChallengeModalOpen(false)}
          title="Add Custom Challenge"
        >
          <AddChallengeForm
            onSuccess={() => {
              setAddChallengeModalOpen(false);
              fetchChallengesAndMilestones();
            }}
            onCancel={() => setAddChallengeModalOpen(false)}
          />
        </ResponsiveModal>
        {/* Edit Custom Challenge Modal */}
        <ResponsiveModal
          isOpen={editCustomChallengeIdx !== null && !!editCustomChallengeData}
          onClose={() => { setEditCustomChallengeIdx(null); setEditCustomChallengeData(null); }}
          title="Edit Custom Challenge"
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setEditCustomChallengeIdx(null); setEditCustomChallengeData(null); }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  // TODO: Implement save logic
                  setEditCustomChallengeIdx(null);
                  setEditCustomChallengeData(null);
                }}
              >
                Save
              </Button>
            </>
          }
        >
          {editCustomChallengeData && (
            <>
              <label className="block mb-2 text-sm font-medium">Name</label>
              <input
                className="w-full mb-4 p-2 border rounded"
                value={editCustomChallengeData.name}
                onChange={e => setEditCustomChallengeData({ ...editCustomChallengeData, name: e.target.value })}
                placeholder="Challenge name"
                title="Challenge name"
                aria-label="Challenge name"
                required
              />
              <label className="block mb-2 text-sm font-medium">Instructions</label>
              <textarea
                className="w-full mb-4 p-2 border rounded resize-none"
                rows={3}
                value={editCustomChallengeData.description || editCustomChallengeData.instructions || ''}
                onChange={e => setEditCustomChallengeData({
                  ...editCustomChallengeData,
                  description: e.target.value,
                  instructions: e.target.value
                })}
                placeholder="Instructions"
                title="Instructions"
                aria-label="Instructions"
              />
              <label className="block mb-2 text-sm font-medium">Sets/Reps</label>
              <input
                className="w-full mb-4 p-2 border rounded"
                value={editCustomChallengeData.setsReps}
                onChange={e => setEditCustomChallengeData({ ...editCustomChallengeData, setsReps: e.target.value })}
                placeholder="e.g. 3x12"
                title="Sets/Reps"
                aria-label="Sets/Reps"
              />
              <label className="block mb-2 text-sm font-medium">Tips</label>
              <input
                className="w-full mb-4 p-2 border rounded"
                value={editCustomChallengeData.tips}
                onChange={e => setEditCustomChallengeData({ ...editCustomChallengeData, tips: e.target.value })}
                placeholder="Tips"
                title="Tips"
                aria-label="Tips"
              />
              <label className="block mb-2 text-sm font-medium">Weight</label>
              <input
                className="w-full mb-4 p-2 border rounded"
                value={editCustomChallengeData.weight}
                onChange={e => setEditCustomChallengeData({ ...editCustomChallengeData, weight: e.target.value })}
                placeholder="e.g. 8kg"
                title="Weight"
                aria-label="Difficulty"
              />
            </>
          )}
        </ResponsiveModal>
        {/* Delete Confirmation Modal */}
        <ResponsiveModal
          isOpen={deleteConfirmOpen && !!questToDelete}
          onClose={cancelDeleteQuest}
          title={TEXT_CONTENT.questBoard.modals.delete.questTitle}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={cancelDeleteQuest}>
                {TEXT_CONTENT.questBoard.buttons.cancel}
              </Button>
              <Button type="button" variant="destructive" onClick={confirmDeleteQuest}>
                {TEXT_CONTENT.questBoard.buttons.delete}
              </Button>
            </>
          }
        >
          <p>{TEXT_CONTENT.questBoard.modals.delete.confirm.replace('{name}', questToDelete?.name || '')}</p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {TEXT_CONTENT.questBoard.modals.delete.warning}
          </p>
        </ResponsiveModal>
        {/* Add Challenge Type Modal */}
        <ResponsiveModal
          isOpen={showAddChallengeTypeModal}
          onClose={() => setShowAddChallengeTypeModal(false)}
          title={TEXT_CONTENT.questBoard.modals.addType.title}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddChallengeTypeModal(false)}
              >
                {TEXT_CONTENT.questBoard.buttons.cancel}
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  handleAddChallengeType();
                  setShowAddChallengeTypeModal(false);
                }}
              >
                {TEXT_CONTENT.questBoard.buttons.add}
              </Button>
            </>
          }
        >
          <label className="block mb-2 text-sm font-medium">Name</label>
          <input
            className="w-full mb-4 p-2 border rounded"
            value={newChallengeTypeName}
            onChange={e => setNewChallengeTypeName(e.target.value)}
            placeholder="Challenge type name"
            title="Challenge type name"
            aria-label="Challenge type name"
            required
          />
        </ResponsiveModal>

        {/* Enhanced Toast Container */}
        <ToastContainer
          toasts={questToasts.toasts}
          onDismiss={questToasts.dismissToast}
        />
      </div>
    </EnhancedErrorBoundary >
  );
}