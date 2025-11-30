"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sword, Brain, Crown, Castle, Hammer, Heart, Plus, Trash2, Trophy, Sun, PersonStanding, Pencil, Flame, Star } from 'lucide-react'
import { HeaderSection } from '@/components/HeaderSection'
import { useUser, useAuth } from '@clerk/nextjs'
import { Milestones } from '@/components/milestones'
import { updateCharacterStat, getCharacterStats, addToCharacterStatSync } from '@/lib/character-stats-manager'
import { toast } from '@/components/ui/use-toast'
import QuestCard from '@/components/quest-card'
import React from 'react'
import { SignedIn, SignedOut, SignIn } from '@clerk/nextjs'

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

import { KeyboardShortcutsProvider } from '@/components/keyboard-shortcuts'
import { showQuestCompletionToast } from '@/components/enhanced-reward-toast'
import { EmptyQuests } from '@/components/empty-states'
import { QuestToggleButton } from '@/components/quest-toggle-button'
import { useQuestSync } from '@/hooks/useQuestSync'
import { useOfflineSupport } from '@/hooks/useOfflineSupport'
import { SyncStatusIndicator } from '@/components/sync-status-indicator'
import { OfflineQueueIndicator } from '@/components/offline-queue-indicator'
import { ToastContainer, useQuestToasts } from '@/components/enhanced-toast-system'
import { EnhancedErrorBoundary } from '@/components/enhanced-error-boundary'
import { DailyProgressCard } from '@/components/daily-progress-card'
import { ChroniclesCard } from '@/components/chronicles-card'
import { TarotCardDisplay } from '@/components/tarot-card'
import { StreakIndicator } from "@/components/streak-indicator"

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

const categoryLabels = {
  might: 'Might',
  knowledge: 'Knowledge',
  honor: 'Honor',
  castle: 'Castle',
  craft: 'Craft',
  vitality: 'Vitality',
  wellness: 'Wellness',
  exploration: 'Exploration',
};

const questCategories = ['might', 'knowledge', 'honor', 'castle', 'craft', 'vitality', 'wellness', 'exploration'];

const categoryColorMap: Record<string, string> = {
  might: 'text-red-500 border-red-800/30 bg-red-900/10',
  knowledge: 'text-blue-500 border-blue-800/30 bg-blue-900/10',
  honor: 'text-purple-500 border-purple-800/30 bg-purple-900/10',
  castle: 'text-stone-400 border-stone-700/30 bg-stone-900/10',
  craft: 'text-orange-500 border-orange-800/30 bg-orange-900/10',
  vitality: 'text-green-500 border-green-800/30 bg-green-900/10',
  wellness: 'text-teal-500 border-teal-800/30 bg-teal-900/10',
  exploration: 'text-emerald-500 border-emerald-800/30 bg-emerald-900/10'
};

// --- 4-Day Workout Plan Data ---
const workoutPlan = [
  {
    category: 'Push/Legs/Core',
    exercises: [
      { name: 'Squat (Barbell/Dumbbell)', instructions: 'Feet shoulder-width, chest up, lower hips back and down.', setsReps: '3x10', tips: 'Keep knees in line with toes.', weight: '2x10kg' },
      { name: 'Push-up', instructions: 'Hands shoulder-width, body in straight line, lower chest to floor.', setsReps: '3x12', tips: 'Engage core, don\'t sag hips.', weight: '0' },
      { name: 'Lunge (Walking/Static)', instructions: 'Step forward, lower back knee, keep torso upright.', setsReps: '3x10 per leg', tips: '90-degree angle at knees.', weight: '2x8kg' },
      { name: 'Dumbbell Shoulder Press', instructions: 'Seated or standing, press weights overhead.', setsReps: '3x10', tips: 'Don\'t arch back excessively.', weight: '2x8kg' },
      { name: 'Plank', instructions: 'Forearms on ground, body straight, hold.', setsReps: '3x45 sec', tips: 'Squeeze glutes and core.', weight: '0' },
      { name: 'Leg Raise', instructions: 'Lying on back, lift legs to 90 degrees, lower slowly.', setsReps: '3x12', tips: 'Keep lower back pressed to floor.', weight: '0' }
    ]
  },
  {
    category: 'Pull/Shoulder/Core',
    exercises: [
      { name: 'Deadlift (Dumbbell/Kettlebell)', instructions: 'Hinge at hips, keep back flat, lift weight.', setsReps: '3x10', tips: 'Drive through heels.', weight: '2x12kg' },
      { name: 'Dumbbell Row', instructions: 'Hand on bench, pull weight to hip.', setsReps: '3x10 per arm', tips: 'Squeeze shoulder blade.', weight: '12kg' },
      { name: 'Lateral Raise', instructions: 'Lift weights to side until shoulder height.', setsReps: '3x12', tips: 'Lead with elbows.', weight: '2x4kg' },
      { name: 'Bicep Curl', instructions: 'Curl weights up, keep elbows pinned.', setsReps: '3x12', tips: 'Control the descent.', weight: '2x8kg' },
      { name: 'Russian Twist', instructions: 'Seated, lean back, twist torso side to side.', setsReps: '3x20 total', tips: 'Follow hands with eyes.', weight: '5kg' },
      { name: 'Superman', instructions: 'Lying on stomach, lift arms and legs.', setsReps: '3x12', tips: 'Squeeze lower back and glutes.', weight: '0' }
    ]
  },
  {
    category: 'Legs/Arms/Core',
    exercises: [
      { name: 'Goblet Squat', instructions: 'Hold weight at chest, squat down.', setsReps: '3x12', tips: 'Keep chest up.', weight: '12kg' },
      { name: 'Glute Bridge', instructions: 'Lying on back, lift hips up.', setsReps: '3x15', tips: 'Squeeze glutes at top.', weight: '0' },
      { name: 'Tricep Dip (Chair/Bench)', instructions: 'Lower body using arms, push back up.', setsReps: '3x12', tips: 'Keep elbows close to body.', weight: '0' },
      { name: 'Hammer Curl', instructions: 'Curl weights with palms facing each other.', setsReps: '3x12', tips: 'Focus on forearms/biceps.', weight: '2x8kg' },
      { name: 'Bicycle Crunch', instructions: 'Opposite elbow to opposite knee.', setsReps: '3x20 total', tips: 'Slow and controlled.', weight: '0' },
      { name: 'Calf Raise', instructions: 'Lift heels off ground, pause at top.', setsReps: '3x20', tips: 'Full range of motion.', weight: '0' }
    ]
  },
  {
    category: 'Core & Flexibility',
    exercises: [
      { name: 'Sun Salutation A', instructions: 'Flow through yoga poses.', setsReps: '5 rounds', tips: 'Match breath to movement.', weight: '0' },
      { name: 'Cat-Cow Stretch', instructions: 'Arch and round spine on all fours.', setsReps: '10 reps', tips: 'Move with breath.', weight: '0' },
      { name: 'Bird-Dog', instructions: 'Extend opposite arm and leg, hold.', setsReps: '3x10 per side', tips: 'Keep hips level.', weight: '0' },
      { name: 'Child\'s Pose', instructions: 'Kneel, sit back on heels, stretch arms forward.', setsReps: 'Hold 1 min', tips: 'Relax into the stretch.', weight: '0' },
      { name: 'Hip Flexor Stretch', instructions: 'Lunge position, push hips forward.', setsReps: '30 sec per side', tips: 'Tuck tailbone.', weight: '0' },
      { name: 'Seated Forward Fold', instructions: 'Legs straight, reach for toes.', setsReps: 'Hold 1 min', tips: 'Hinge from hips.', weight: '0' }
    ]
  },
  {
    category: 'HIIT & Full Body',
    exercises: [
      { name: 'Burpee', instructions: 'Squat, jump to plank, jump in, explode up – repeat.', setsReps: '3x15', tips: 'Jump high, move smoothly.', weight: '0' },
      { name: 'Mountain Climber', instructions: 'Start in high plank, run knees to chest quickly.', setsReps: '3x30 sec', tips: 'Maintain core tension, move fast.', weight: '0' },
      { name: 'Jump Squat', instructions: 'Squat down then jump explosively, land softly.', setsReps: '3x20', tips: 'Depth first, then power.', weight: '0' },
      { name: 'Dumbbell Row (repeat)', instructions: 'Same as bent-over row – hinge and pull dumbbells to sides.', setsReps: '3x12', tips: 'Same tips apply as before.', weight: '2x8kg' },
      { name: 'Lunge (with dumbbells)', instructions: 'Step forward, keep torso upright, push back up.', setsReps: '3x10 per leg', tips: 'Control each step.', weight: '2x8kg' },
      { name: 'Push-up (your choice of board color)', instructions: 'Choose board color to target chest/triceps/shoulders.', setsReps: '3x12', tips: 'Focus on form for chosen variation.', weight: '0' }
    ]
  }
];

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
  const userId = user?.id;
  const isUserLoaded = isClerkLoaded;

  console.log('[Challenges Frontend] Component rendered, isClerkLoaded:', isClerkLoaded, 'userId:', userId, 'user:', !!user);

  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>(questCategories);
  const [mainTab, setMainTab] = useState<'quests' | 'challenges' | 'milestones' | 'recovery'>('quests');
  const [questCategory, setQuestCategory] = useState(questCategories[0]);
  const [challengeCategory, setChallengeCategory] = useState<string>("all");
  const [milestoneCategory, setMilestoneCategory] = useState(questCategories[0]);
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean[]>>({});
  const [newChallenge, setNewChallenge] = useState({
    name: '',
    instructions: '',
    setsReps: '',
    tips: '',
    weight: '',
  });
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

  // Add missing state variables
  const [streakData, setStreakData] = useState<{ streak_days: number; week_streaks: number }>({ streak_days: 0, week_streaks: 0 });
  const [challengeStreakData, setChallengeStreakData] = useState<{ streak_days: number; week_streaks: number }>({ streak_days: 0, week_streaks: 0 });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [editChallengeModalOpen, setEditChallengeModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<any | null>(null);
  const [editMilestoneModalOpen, setEditMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<any | null>(null);
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
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    category: 'might',
    difficulty: 'medium',
    xp: 100,
    gold: 50
  });
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

  // --- Realtime Sync ---
  const [syncError, setSyncError] = useState<string | null>(null);

  const { syncNow, isSyncing, lastSync } = useQuestSync({
    onQuestsUpdate: async () => {
      console.log('[Quest Sync] Syncing quests...');
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
        console.log('[Quest Sync] Quests synced successfully');
      } catch (error) {
        console.error('[Quest Sync] Error syncing quests:', error);
        throw error;
      }
    },
    onCharacterStatsUpdate: async () => {
      console.log('[Quest Sync] Syncing character stats...');
      // Trigger character stats update
      window.dispatchEvent(new Event('character-stats-update'));
    },
    onError: (error) => {
      console.error('[Quest Sync] Sync error:', error);
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
  console.log('[Quest Filter Debug]', {
    totalQuests: quests.length,
    currentCategory: safeQuestCategory,
    questsInCategory: todaysTotal,
    availableCategories: Object.keys(questsByCategorySafe),
    categoryCounts: Object.entries(questsByCategorySafe).map(([cat, quests]) => ({ category: cat, count: quests.length }))
  });
  // 7-day history (Mon-Sun, most recent last)
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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
        console.error('[Character Stats] Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [userId]);

  // Fetch quests when token is present and user is authenticated
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
        console.log('[Quests Debug] Fetching /api/quests with token:', token.slice(0, 10), '... (attempt', retryCount + 1, ')');
        const res = await fetch(`/api/quests?t=${Date.now()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('[Quests Debug] Response status:', res.status, 'ok:', res.ok);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('[Quests Debug] Error response:', errorText);
          throw new Error(`Failed to fetch quests: ${res.status} ${errorText}`);
        }
        // Check if response is HTML (error page) instead of JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const htmlText = await res.text();
          console.error('[Quests Debug] Received HTML instead of JSON:', htmlText.substring(0, 200));

          // Retry once if we get HTML (might be a temporary auth issue)
          if (retryCount < 1) {
            console.log('[Quests Debug] Retrying after HTML response...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            return fetchQuests(retryCount + 1);
          }

          throw new Error(`API returned HTML instead of JSON. Status: ${res.status}`);
        }

        const data = await res.json();
        console.log('[Quests Debug] Data received:', {
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
          console.log('[Quests Debug] Found completed quests:', completedQuests.map((q: any) => ({ id: q.id, name: q.name, completed: q.completed })));
        }

        setQuests(data || []);
      } catch (err: any) {
        setError('[Quests Debug] Error fetching quests: ' + (err.message || 'Failed to fetch quests'));
        setQuests([]);
        console.error('[Quests Debug] Error fetching quests:', err);
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
        console.log('[Favorites] No token available');
        return;
      }

      console.log('[Favorites] Fetching favorites from API...');
      const response = await fetch('/api/quests/favorites', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Favorites] API response:', data);
        setFavoritedQuests(new Set(data.favorites || []));
        console.log('[Favorites] Set favorited quests:', data.favorites || []);
      } else {
        console.error('[Favorites] API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
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
      console.log('[Daily Reset] Timezone debug:', {
        utcTime: now.toISOString(),
        netherlandsDate: netherlandsDate,
        today: today,
        lastReset: lastReset
      });

      console.log('[Daily Reset] Checking reset conditions:', {
        lastReset,
        today,
        shouldReset: lastReset !== today,
        dailyResetInitiated: dailyResetInitiated.current,
        token: !!token
      });

      // Debug: Show if we're skipping due to localStorage
      if (lastReset === today) {
        console.log('[Daily Reset] ⚠️ Skipping reset because localStorage shows reset already processed today');
        console.log('[Daily Reset] 💡 To force a reset, clear localStorage: localStorage.removeItem("last-quest-reset-date")');
      }

      // Only reset if we haven't processed today's reset AND we have a valid token
      // Remove the dailyResetInitiated check to allow manual resets
      if (lastReset !== today && token) {
        console.log('[Daily Reset] Starting daily reset for date:', today);
        console.log('[Daily Reset] Last reset was:', lastReset, 'Today is:', today);

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
              console.error('[Daily Reset] API error:', res.status, err);
              toast({
                title: 'Daily Reset Error',
                description: `Failed to reset daily quests: ${err || res.statusText}`,
                variant: 'destructive',
              });
              return;
            }

            // Only parse JSON if response is OK
            const result = await res.json();
            console.log('[Daily Reset] Success:', result);

            // Mark that we've processed today's reset
            localStorage.setItem('last-quest-reset-date', today);

            // Reset the daily reset flag to allow future resets
            dailyResetInitiated.current = false;

            // 🔍 DEBUG: Log the quest state after reset
            console.log('[Daily Reset] Quest state after reset:', quests.map(q => ({ id: q.id, name: q.name, completed: q.completed })));

            // IMPORTANT: DO NOT manually reset quest state - this causes data loss!
            // The quest completion logic will naturally show quests as incomplete
            // if there's no completed=true record for today
            console.log('[Daily Reset] ✅ Preserving quest state - no manual reset to prevent data loss');

            // Optimized delay before refreshing to ensure reset completion
            setTimeout(() => {
              console.log('[Daily Reset] Refreshing quest data after reset...');
              setRefreshTrigger(prev => prev + 1);
            }, 1500); // Reduced delay since UI-only reset is instant

            toast({
              title: 'Daily Reset',
              description: 'Your daily quests and challenges have been reset! Time to build new habits.',
            });
          })
          .catch(err => {
            console.error('[Daily Reset] Network error:', err);
            toast({
              title: 'Daily Reset Error',
              description: `Network or server error: ${err.message || err}`,
              variant: 'destructive',
            });
          });
      } else {
        console.log('[Daily Reset] Skipping reset - already processed today or conditions not met');
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
      console.log('[Daily Reset] Date changed, resetting daily reset flag');
    }
  }, []);

  // Persist streaks and last completed
  useEffect(() => {
    localStorage.setItem(CHALLENGE_STREAKS_KEY, JSON.stringify(challengeStreaks));
  }, [challengeStreaks]);
  useEffect(() => {
    localStorage.setItem(CHALLENGE_LAST_COMPLETED_KEY, JSON.stringify(challengeLastCompleted));
  }, [challengeLastCompleted]);

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
          console.error('[Streaks] Failed to fetch streak:', res.status, res.statusText);
          throw new Error('Failed to fetch streak');
        }
        const data = await res.json();
        if (!cancelled) setStreakData(data);
      } catch (error) {
        console.error('[Streaks] Error fetching streak:', error);
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
    console.log('[Streaks Poll] Polling disabled to prevent infinite loops');

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
              console.error('[Streaks Poll] Non-JSON response received');
            }
          } else {
            console.error('[Streaks Poll] HTTP error:', res.status, res.statusText);
          }
        } catch (error) {
          console.error('[Streaks Poll] Error fetching streak:', error);
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
      console.error('Failed to update challenge streak:', error);
    }
  };

  // --- Automatically trigger updateStreak in quest completion logic ---
  const [questStreakUpdatedToday, setQuestStreakUpdatedToday] = useState<Record<string, string>>({});

  useEffect(() => {
    // console.log('[Quest Streak Debug] Effect triggered:', {
    //   userId,
    //   todaysTotal,
    //   todaysCompleted,
    //   questCategory,
    //   questHistory: questHistory.length,
    //   questStreakUpdatedToday
    // });

    if (!userId || todaysTotal === 0) {
      // console.log('[Quest Streak Debug] Bailing early - no userId or no quests');
      return;
    }
    if (typeof window === 'undefined') return;

    const today = new Date().toISOString().slice(0, 10);
    const allQuestsCompleted = todaysCompleted === todaysTotal && todaysTotal > 0;
    // console.log('[Quest Streak Debug] All quests completed?', allQuestsCompleted);

    // 🎯 SIMPLIFIED: Just check if all quests are completed and we haven't updated today
    const alreadyUpdatedToday = questCategory ? questStreakUpdatedToday[questCategory] === today : false;
    // console.log('[Quest Streak Debug] Already updated today?', alreadyUpdatedToday);

    if (allQuestsCompleted && !alreadyUpdatedToday && questCategory) {
      // console.log('[Quest Streak Debug] 🎉 ALL QUESTS COMPLETED! Updating streak...');

      // Mark as updated today to prevent infinite loop
      setQuestStreakUpdatedToday(prev => ({ ...prev, [questCategory]: today }));

      // Get current streak from state and increment
      const currentStreak = streakData?.streak_days ?? 0;
      const newStreak = currentStreak + 1;
      // console.log('[Quest Streak Debug] Updating from', currentStreak, 'to', newStreak);

      updateStreak(newStreak, 0);

      // 🎯 AWARD BUILD TOKENS for completing all quests + streak achievements
      let buildTokensEarned = 1; // 1 token for completing all quests in category

      // Bonus tokens for streak milestones (every 5 streak days)
      if (newStreak % 5 === 0) {
        buildTokensEarned += 1; // Extra token for streak milestone
      }

      // Removed debugging log

      // Update build tokens in Supabase
      import('@/lib/character-stats-manager').then(({ loadCharacterStats, saveCharacterStats }) => {
        loadCharacterStats().then(current => {
          const currentBuildTokens = current.build_tokens || 0;
          saveCharacterStats({ build_tokens: currentBuildTokens + buildTokensEarned });
        });
      });

      // Trigger kingdom update for build tokens
      window.dispatchEvent(new CustomEvent('kingdom:buildTokensGained', { detail: buildTokensEarned }));
      window.dispatchEvent(new Event('character-stats-update'));

      toast({
        title: 'Quest Streak',
        description: `You completed all quests for ${questCategory}! Streak increased to ${newStreak} days. Earned ${buildTokensEarned} build token(s)!`,
      });
    }
  }, [todaysCompleted, todaysTotal, userId, questCategory, streakData]);

  // --- Automatically trigger updateStreak in challenge completion logic ---
  const [streakUpdatedToday, setStreakUpdatedToday] = useState<Record<string, string>>({});

  useEffect(() => {
    // console.log('[Streak Debug] Effect triggered:', {
    //   challengesLength: challenges.length,
    //   challengeCategory,
    //   challengeStreakData,
    //   challenges: challenges.map(c => ({ id: c.id, category: c.category, completed: c.completed }))
    // });

    if (!challenges.length) {
      // console.log('[Streak Debug] No challenges loaded yet');
      return;
    }

    const challengesForCategory = challenges.filter(c => c.category === challengeCategory);
    // console.log('[Streak Debug] Challenges for category:', {
    //   category: challengeCategory,
    //   total: challengesForCategory.length,
    //   completed: challengesForCategory.filter(c => c.completed).length,
    //   challengesForCategory: challengesForCategory.map(c => ({ id: c.id, name: c.name, completed: c.completed }))
    // });

    const allChallengesCompleted = challengesForCategory.length > 0 && challengesForCategory.every(c => c.completed);
    // console.log('[Streak Debug] All challenges completed?', allChallengesCompleted);

    // 🎯 PREVENT INFINITE LOOP: Check if we already updated streak today
    const today = new Date().toISOString().slice(0, 10);
    const alreadyUpdatedToday = challengeCategory ? streakUpdatedToday[challengeCategory] === today : false;
    // console.log('[Streak Debug] Already updated today?', alreadyUpdatedToday);

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

      // Update build tokens in Supabase
      import('@/lib/character-stats-manager').then(({ loadCharacterStats, saveCharacterStats }) => {
        loadCharacterStats().then(current => {
          const currentBuildTokens = current.build_tokens || 0;
          saveCharacterStats({ build_tokens: currentBuildTokens + buildTokensEarned });
        });
      });

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
        title: 'Challenge Streak',
        description: `You completed all challenges for ${challengeCategory}! Streak increased to ${newStreak + 1} days. Earned ${buildTokensEarned} build token(s)!`,
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
      console.error('Error updating streak:', error);
      toast({
        title: "Error",
        description: "Failed to update streak. Please try again.",
        duration: 3000,
      });
    }
  };

  const handleQuestToggle = async (questId: string, newCompleted: boolean) => {
    if (!token || !userId) return;

    // Find the quest object
    const questObj = quests.find(q => q.id === questId);
    if (!questObj) {
      console.error('[QUEST-TOGGLE] Quest not found:', questId);
      return;
    }

    console.log('[QUEST-TOGGLE] Updating quest state:', { questId, newCompleted, questName: questObj.name });

    // Update the quest in the local state (optimistic update)
    setQuests(prevQuests =>
      prevQuests.map(q =>
        q.id === questId
          ? { ...q, completed: newCompleted }
          : q
      )
    );

    // 🎯 CRITICAL FIX: Apply rewards when completing quest
    if (newCompleted) {
      const goldReward = questObj.gold || 50;
      const xpReward = questObj.xp || 25;

      console.log('[QUEST-TOGGLE] Applying rewards:', { gold: goldReward, xp: xpReward });

      // Import and use character stats manager to apply rewards
      import('@/lib/character-stats-manager').then(({ addToCharacterStatSync, getCharacterStats }) => {
        // Get current stats for logging
        const currentStats = getCharacterStats();
        console.log('[QUEST-TOGGLE] Current stats before reward:', currentStats);

        // Apply rewards synchronously
        addToCharacterStatSync('gold', goldReward);
        addToCharacterStatSync('experience', xpReward);

        // Get updated stats for logging
        const updatedStats = getCharacterStats();
        console.log('[QUEST-TOGGLE] Updated stats after reward:', updatedStats);

        // Show success toast with rewards
        toast({
          title: "⚔️ Quest Complete!",
          description: `${questObj.name}\n+${goldReward} Gold  •  +${xpReward} XP`,
          duration: 4000,
        });
      }).catch(error => {
        console.error('[QUEST-TOGGLE] Error applying rewards:', error);
        toast({
          title: "Warning",
          description: "Quest completed but rewards may not have been applied. Please refresh the page.",
          duration: 5000,
        });
      });
    } else {
      // Quest uncompleted - just show toast
      toast({
        title: "Quest Uncompleted",
        description: `${questObj.name} marked as incomplete.`,
        duration: 2000,
      });
    }

    // Persist quest completion to backend
    try {
      const response = await fetch('/api/quests-complete', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          questId,
          completed: newCompleted,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update quest: ${response.status}`);
      }

      console.log('[QUEST-TOGGLE] Quest persisted to backend successfully');
    } catch (error) {
      console.error('[QUEST-TOGGLE] Error persisting quest:', error);
      // Don't show error toast as rewards were already applied
      // Just log for debugging
    }
  };


  const handleQuestFavorite = async (questId: string) => {
    if (!token || !userId) return;

    try {
      // Toggle favorite status in local state
      setFavoritedQuests(prev => {
        const newFavorites = new Set(prev);
        if (newFavorites.has(questId)) {
          newFavorites.delete(questId);
        } else {
          newFavorites.add(questId);
        }
        return newFavorites;
      });

      // Update in Supabase (if you have a favorites table)
      // For now, we'll just use local state

      toast({
        title: "Favorite Updated",
        description: "Quest favorite status updated.",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorite status.",
        duration: 3000,
      });
    }
  };

  const handleEditQuest = (quest: Quest) => {
    setEditingQuest(quest);
    setEditModalOpen(true);
  };

  const handleDeleteQuest = async (questId: string) => {
    if (!token || !userId) return;

    try {
      // Remove from local state
      setQuests(prevQuests => prevQuests.filter(q => q.id !== questId));

      // Delete from Supabase
      const response = await fetch('/api/quests-complete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete quest');
      }

      toast({
        title: "Quest Deleted",
        description: "Quest has been successfully deleted.",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error deleting quest:', error);
      toast({
        title: "Error",
        description: "Failed to delete quest. Please try again.",
        duration: 3000,
      });
    }
  };

  const handleChallengeToggle = async (challengeId: string, newCompleted: boolean) => {
    if (!token || !userId) return;

    // Find the challenge object
    const challengeObj = challenges.find(c => c.id === challengeId);
    if (!challengeObj) {
      console.error('[CHALLENGE-TOGGLE] Challenge not found:', challengeId);
      return;
    }

    console.log('[CHALLENGE-TOGGLE] Updating challenge state:', { challengeId, newCompleted, challengeName: challengeObj.name });

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

      console.log('[CHALLENGE-TOGGLE] Applying rewards:', { gold: goldReward, xp: xpReward });

      // Import and use character stats manager to apply rewards
      import('@/lib/character-stats-manager').then(({ addToCharacterStatSync, getCharacterStats }) => {
        // Get current stats for logging
        const currentStats = getCharacterStats();
        console.log('[CHALLENGE-TOGGLE] Current stats before reward:', currentStats);

        // Apply rewards synchronously
        addToCharacterStatSync('gold', goldReward);
        addToCharacterStatSync('experience', xpReward);

        // Get updated stats for logging
        const updatedStats = getCharacterStats();
        console.log('[CHALLENGE-TOGGLE] Updated stats after reward:', updatedStats);

        // Show success toast with rewards
        toast({
          title: "⚔️ Challenge Complete!",
          description: `${challengeObj.name}\n+${goldReward} Gold  •  +${xpReward} XP`,
          duration: 4000,
        });
      }).catch(error => {
        console.error('[CHALLENGE-TOGGLE] Error applying rewards:', error);
        toast({
          title: "Warning",
          description: "Challenge completed but rewards may not have been applied. Please refresh the page.",
          duration: 5000,
        });
      });
    } else {
      // Challenge uncompleted - just show toast
      toast({
        title: "Challenge Uncompleted",
        description: `${challengeObj.name} marked as incomplete.`,
        duration: 2000,
      });
    }

    // Persist challenge completion to backend
    try {
      const response = await fetch('/api/challenges-ultra-simple', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          challengeId,
          completed: newCompleted
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CHALLENGE-TOGGLE] API Error:', errorText);
        throw new Error(`Failed to update challenge: ${response.status} - ${errorText}`);
      }

      console.log('[CHALLENGE-TOGGLE] Challenge persisted to backend successfully');
    } catch (error) {
      console.error('[CHALLENGE-TOGGLE] Error persisting challenge:', error);
      // Don't show error toast as rewards were already applied
      // Just log for debugging
    }
  };

  const handleEditChallenge = (challenge: any) => {
    setEditingChallenge(challenge);
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
        title: "Challenge Deleted",
        description: "Challenge has been successfully deleted.",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast({
        title: "Error",
        description: "Failed to delete challenge. Please try again.",
        duration: 3000,
      });
    }
  };

  const handleBulkCompleteFavorites = async () => {
    if (!token) return;

    try {
      const favoritedQuestsInCategory = quests.filter(q =>
        q.category === questCategory &&
        favoritedQuests.has(q.id) &&
        !q.completed
      );

      if (favoritedQuestsInCategory.length === 0) return;

      // Complete each favorited quest in the current category
      for (const quest of favoritedQuestsInCategory) {
        // Update local state first (optimistic update)
        setQuests(prevQuests =>
          prevQuests.map(q =>
            q.id === quest.id
              ? { ...q, completed: true }
              : q
          )
        );

        // Save to database using smart completion API
        try {
          // Apply tarot buffs to rewards
          const { applyTarotBuffs } = await import('@/lib/tarot-buffs');
          const baseXp = quest.xp || 50;
          const baseGold = quest.gold || 25;
          const buffedRewards = applyTarotBuffs(baseXp, baseGold, quest.category);

          // Log if buff was applied
          if (buffedRewards.buffApplied) {
            console.log(`[Bulk Complete] Tarot buff applied to ${quest.name}:`, {
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
            },
            body: JSON.stringify({
              questId: quest.id,
              completed: true,
              xpReward: buffedRewards.xp,
              goldReward: buffedRewards.gold,
            }),
          });

          if (!response.ok) {
            console.error(`[Bulk Complete] Failed to complete quest ${quest.id}:`, response.status);
            // Revert optimistic update on failure
            setQuests(prevQuests =>
              prevQuests.map(q =>
                q.id === quest.id
                  ? { ...q, completed: false }
                  : q
              )
            );
          } else {
            console.log(`[Bulk Complete] Successfully completed quest: ${quest.name}`);
          }
        } catch (apiError) {
          console.error(`[Bulk Complete] API error for quest ${quest.id}:`, apiError);
          // Revert optimistic update on error
          setQuests(prevQuests =>
            prevQuests.map(q =>
              q.id === quest.id
                ? { ...q, completed: false }
                : q
            )
          );
        }
      }

      toast({
        title: "Bulk Complete Successful!",
        description: `Completed ${favoritedQuestsInCategory.length} favorited quests in ${getCategoryLabel(questCategory || '')} category.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error bulk completing favorites:', error);
      toast({
        title: "Error",
        description: "Failed to complete favorited quests. Please try again.",
        duration: 3000,
      });
    }
  };

  const handleBulkCompleteAllFavorites = async () => {
    if (!token) return;

    try {
      const allFavoritedQuests = quests.filter(q =>
        favoritedQuests.has(q.id) &&
        !q.completed
      );

      if (allFavoritedQuests.length === 0) return;

      // Complete each favorited quest across all categories
      for (const quest of allFavoritedQuests) {
        // Update local state first (optimistic update)
        setQuests(prevQuests =>
          prevQuests.map(q =>
            q.id === quest.id
              ? { ...q, completed: true }
              : q
          )
        );

        // Save to database using smart completion API
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
            console.error(`[Bulk Complete All] Failed to complete quest ${quest.id}:`, response.status, errorText);
            // Revert optimistic update on failure
            setQuests(prevQuests =>
              prevQuests.map(q =>
                q.id === quest.id
                  ? { ...q, completed: false }
                  : q
              )
            );
          } else {
            const responseData = await response.json();
            console.log(`[Bulk Complete All] Successfully completed quest: ${quest.name}`, responseData);
          }
        } catch (apiError) {
          console.error(`[Bulk Complete All] API error for quest ${quest.id}:`, apiError);
          // Revert optimistic update on error
          setQuests(prevQuests =>
            prevQuests.map(q =>
              q.id === quest.id
                ? { ...q, completed: false }
                : q
            )
          );
        }
      }

      // Wait a moment for database to update, then refresh quest data
      setTimeout(async () => {
        try {
          console.log('[Bulk Complete All] Refreshing quest data after completion...');
          const response = await fetch(`/api/quests?t=${Date.now()}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log('[Bulk Complete All] Refreshed quest data:', data);
            setQuests(data);
          }
        } catch (error) {
          console.error('[Bulk Complete All] Error refreshing quest data:', error);
        }
      }, 1000);

      toast({
        title: "Bulk Complete Successful!",
        description: `Completed ${allFavoritedQuests.length} favorited quests across all categories.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error bulk completing all favorites:', error);
      toast({
        title: "Error",
        description: "Failed to complete favorited quests. Please try again.",
        duration: 3000,
      });
    }
  };

  // Manual reset function for immediate control
  const handleManualReset = async () => {
    if (!token) return;

    setManualResetLoading(true);
    console.log('[Manual Reset] Starting manual reset...');

    try {
      const res = await fetch('/api/quests/reset-daily-ui-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('[Manual Reset] API error:', res.status, err);
        toast({
          title: 'Manual Reset Error',
          description: `Failed to reset quests: ${err || res.statusText}`,
          variant: 'destructive',
        });
        return;
      }

      const result = await res.json();
      console.log('[Manual Reset] Success:', result);

      // Force all quests to show as incomplete
      setQuests(prevQuests =>
        prevQuests.map(quest => ({
          ...quest,
          completed: false
        }))
      );

      // Add a small delay before refreshing to ensure the reset has completed
      setTimeout(() => {
        console.log('[Manual Reset] Refreshing quest data after reset...');
        setRefreshTrigger(prev => prev + 1);
      }, 1000);

      // Reset the daily reset flag (but don't update localStorage for manual resets)
      dailyResetInitiated.current = false; // Allow future resets

      toast({
        title: 'Manual Reset Complete',
        description: 'All quests have been reset successfully!',
      });

    } catch (err) {
      console.error('[Manual Reset] Error:', err);
      toast({
        title: 'Manual Reset Error',
        description: `Error: ${err instanceof Error ? err.message : String(err)}`,
        variant: 'destructive',
      });
    } finally {
      setManualResetLoading(false);
    }
  };


  // Initialize challenges and milestones data - must be before early returns
  useEffect(() => {
    console.log('[Challenges Frontend] useEffect triggered, user:', !!user);

    // Fetch challenges and milestones from Supabase instead of using predefined data
    const fetchChallengesAndMilestones = async () => {
      if (!user) {
        console.log('[Challenges Frontend] No user available, skipping fetch');
        return;
      }

      // Get token directly instead of depending on token state
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        console.log('[Challenges Frontend] No token available, skipping fetch');
        return;
      }

      console.log('[Challenges Frontend] Starting to fetch challenges and milestones...');

      try {
        // Fetch challenges
        console.log('[Challenges Frontend] Fetching challenges from /api/challenges-ultra-simple...');
        const challengesRes = await fetch(`/api/challenges-ultra-simple?t=${Date.now()}&r=${Math.random()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
        });
        console.log('[Challenges Frontend] Challenges response:', { status: challengesRes.status, ok: challengesRes.ok });

        if (challengesRes.ok) {
          const challengesData = await challengesRes.json();
          const completedChallenges = challengesData?.filter((c: any) => c.completed === true) || [];
          console.log('[Challenges Frontend] Challenges data received:', {
            count: challengesData?.length || 0,
            completedCount: completedChallenges.length,
            sample: challengesData?.slice(0, 2)?.map((c: any) => ({ id: c.id, name: c.name, completed: c.completed, date: c.date }))
          });
          console.log('[Challenges Frontend] Detailed completion debug:', challengesData.map((c: any) => ({
            id: c.id,
            name: c.name,
            completed: c.completed,
            date: c.date,
            debug: c.completion_debug
          })));

          console.log('[Challenges Frontend] ✅ COMPLETED challenges:', completedChallenges.map((c: any) => ({ name: c.name, completed: c.completed, date: c.date, completionId: c.completionId })));
          console.log('[Challenges Frontend] All challenges completion status:', challengesData?.map((c: any) => ({ name: c.name, completed: c.completed, date: c.date })));
          setChallenges(challengesData || []);
        } else {
          console.error('[Challenges Frontend] Challenges fetch failed:', challengesRes.status, challengesRes.statusText);
        }

        // Fetch milestones
        console.log('[Challenges Frontend] Fetching milestones from /api/milestones...');
        const milestonesRes = await fetch(`/api/milestones?t=${Date.now()}&r=${Math.random()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
        });
        console.log('[Challenges Frontend] Milestones response:', { status: milestonesRes.status, ok: milestonesRes.ok });

        if (milestonesRes.ok) {
          const milestonesData = await milestonesRes.json();
          console.log('[Challenges Frontend] Milestones data received:', {
            count: milestonesData?.length || 0,
            sample: milestonesData?.slice(0, 2)?.map((m: any) => ({ id: m.id, name: m.name, completed: m.completed, date: m.date }))
          });
          console.log('[Challenges Frontend] All milestones completion status:', milestonesData?.map((m: any) => ({ name: m.name, completed: m.completed, date: m.date })));
          setMilestones(milestonesData || []);
        } else {
          console.error('[Challenges Frontend] Milestones fetch failed:', milestonesRes.status, milestonesRes.statusText);
        }
      } catch (error) {
        console.error('[Challenges Frontend] Error fetching challenges and milestones:', error);
      }
    };

    fetchChallengesAndMilestones();
  }, [user, getToken]);

  const handleMilestoneToggle = async (milestoneId: string, newCompleted: boolean) => {
    if (!token || !userId) return;

    // Find the milestone object
    const milestoneObj = milestones.find(m => m.id === milestoneId);
    if (!milestoneObj) {
      console.error('[MILESTONE-TOGGLE] Milestone not found:', milestoneId);
      return;
    }

    console.log('[MILESTONE-TOGGLE] Updating milestone state:', { milestoneId, newCompleted, milestoneName: milestoneObj.name });

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

      console.log('[MILESTONE-TOGGLE] Applying rewards:', { gold: goldReward, xp: xpReward });

      // Import and use character stats manager to apply rewards
      import('@/lib/character-stats-manager').then(({ addToCharacterStatSync, getCharacterStats }) => {
        // Get current stats for logging
        const currentStats = getCharacterStats();
        console.log('[MILESTONE-TOGGLE] Current stats before reward:', currentStats);

        // Apply rewards synchronously
        addToCharacterStatSync('gold', goldReward);
        addToCharacterStatSync('experience', xpReward);

        // Get updated stats for logging
        const updatedStats = getCharacterStats();
        console.log('[MILESTONE-TOGGLE] Updated stats after reward:', updatedStats);

        // Show success toast with rewards
        toast({
          title: "🏆 Milestone Complete!",
          description: `${milestoneObj.name}\n+${goldReward} Gold  •  +${xpReward} XP`,
          duration: 4000,
        });
      }).catch(error => {
        console.error('[MILESTONE-TOGGLE] Error applying rewards:', error);
        toast({
          title: "Warning",
          description: "Milestone completed but rewards may not have been applied. Please refresh the page.",
          duration: 5000,
        });
      });
    } else {
      // Milestone uncompleted - just show toast
      toast({
        title: "Milestone Uncompleted",
        description: `${milestoneObj.name} marked as incomplete.`,
        duration: 2000,
      });
    }

    // Persist milestone completion to backend
    try {
      const response = await fetch('/api/milestones', {
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
        throw new Error('Failed to update milestone');
      }

      console.log('[MILESTONE-TOGGLE] Milestone persisted to backend successfully');
    } catch (error) {
      console.error('[MILESTONE-TOGGLE] Error persisting milestone:', error);
      // Don't show error toast as rewards were already applied
      // Just log for debugging
    }
  };

  const handleMilestoneEdit = (milestone: any) => {
    setEditingMilestone(milestone);
    setEditMilestoneModalOpen(true);
  };

  const handleMilestoneDelete = async (milestoneId: string) => {
    if (!token || !userId) return;

    try {
      // Remove from local state
      setMilestones(prevMilestones => prevMilestones.filter(m => m.id !== milestoneId));

      // Delete from Supabase
      const response = await fetch('/api/milestones', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          milestoneId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete milestone');
      }

      toast({
        title: "Milestone Deleted",
        description: "Milestone has been successfully deleted.",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast({
        title: "Error",
        description: "Failed to delete milestone. Please try again.",
        duration: 3000,
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
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quest');
      }

      const result = await response.json();
      console.log('[Quest Edit] Update successful:', result);

      toast({
        title: "Quest Updated",
        description: "Quest has been successfully updated.",
        duration: 2000,
      });

      setEditModalOpen(false);
      setEditingQuest(null);
    } catch (error) {
      console.error('Error updating quest:', error);

      // Revert optimistic update on error
      setQuests(prevQuests =>
        prevQuests.map(q =>
          q.id === updatedQuest.id
            ? editingQuest || q
            : q
        )
      );

      toast({
        title: "Error",
        description: `Failed to update quest: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          gold: updatedChallenge.gold
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
        title: "Challenge Updated",
        description: `${updatedChallenge.name} has been updated successfully!`,
        duration: 3000,
      });

      setEditChallengeModalOpen(false);
      setEditingChallenge(null);
    } catch (error) {
      console.error('Error updating challenge:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update challenge. Please try again.",
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
          gold: updatedMilestone.gold
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
        title: "Milestone Updated",
        description: `${updatedMilestone.name} has been updated successfully!`,
        duration: 3000,
      });

      setEditMilestoneModalOpen(false);
      setEditingMilestone(null);
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update milestone. Please try again.",
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
      const response = await fetch('/api/quests-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quest)
      });

      if (!response.ok) {
        throw new Error('Failed to add quest');
      }

      toast({
        title: "Quest Added",
        description: "New quest has been successfully added.",
        duration: 2000,
      });

      setAddQuestModalOpen(false);
    } catch (error) {
      console.error('Error adding quest:', error);
      toast({
        title: "Error",
        description: "Failed to add quest. Please try again.",
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
    console.log('[Challenges Frontend] Early return - Waiting for auth and Clerk client...', { isClerkLoaded, isUserLoaded, user: !!user });
    return <FullPageLoading message="Loading authentication..." />;
  }

  if (!userId) {
    console.log('[Challenges Frontend] Early return - No userId found', { userId, user: !!user });
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Quests</h1>
        <div className="text-red-500 bg-red-900 p-4 rounded-md mb-4">No userId found. Please sign in to view your quests.</div>
      </main>
    );
  }

  const getCategoryIcon = (category: string) => {
    return categoryIcons[category as keyof typeof categoryIcons] || Trophy;
  }
  const getCategoryLabel = (category: string) => {
    return categoryLabels[category as keyof typeof categoryLabels] || category.charAt(0).toUpperCase() + category.slice(1);
  }



  return (
    <EnhancedErrorBoundary>
      <div className="min-h-full quests-page-container scroll-prevent pb-20" style={{ overscrollBehavior: 'none' }}>
        {/* Keyboard Shortcuts Provider */}
        <KeyboardShortcutsProvider
          onNavigate={(route) => {
            // TODO: Implement navigation
            // Navigate to route
          }}
          onAddQuest={() => setAddQuestModalOpen(true)}
          onAddChallenge={() => setAddChallengeModalOpen(true)}
          onAddMilestone={() => setAddMilestoneModalOpen(true)}
          onBuyTile={() => {
            // TODO: Navigate to kingdom and open tile purchase
            // Buy tile
          }}
          onShowHelp={() => {
            // TODO: Show help modal
            // Show help
          }}
        />

        <HeaderSection
          title="Message Board"
          subtitle="Complete daily quests to earn gold and experience. Build your legend!"
          imageSrc="/images/quests-header.jpg"
          defaultBgColor="bg-amber-900"
          shouldRevealImage={true}
        />
        <MobileLayoutWrapper className="quests-page-container">
          <MobileContentWrapper>
            {error && <p className="text-red-500 bg-red-900 p-4 rounded-md mb-4">{error}</p>}

            <Tabs value={mainTab} onValueChange={v => setMainTab(v as 'quests' | 'challenges' | 'milestones' | 'recovery')} className="space-y-6">
              <TabsList className="mb-6 w-full grid grid-cols-4">
                <TabsTrigger value="quests">Tasks</TabsTrigger>
                <TabsTrigger value="challenges">Challenges</TabsTrigger>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                <TabsTrigger value="recovery">Recovery</TabsTrigger>
              </TabsList>

              {/* Quests Tab */}
              <TabsContent value="quests">
                {/* Nested Tabs for Errands and Progression */}
                <Tabs defaultValue="errands" className="space-y-6">
                  <TabsList className="mb-6 w-full grid grid-cols-2">
                    <TabsTrigger value="errands">Errands</TabsTrigger>
                    <TabsTrigger value="progression">Progression</TabsTrigger>
                  </TabsList>

                  {/* Errands Tab - Quest Filters and Cards */}
                  <TabsContent value="errands" className="space-y-6">
                    <div className="space-y-6">
                      {/* Bulk Complete Favorites Button */}
                      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                        <Button
                          onClick={handleBulkCompleteFavorites}
                          disabled={loading || quests.filter(q => q.category === questCategory && favoritedQuests.has(q.id) && !q.completed).length === 0}
                          className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-800/50 disabled:text-gray-300 text-white px-4 py-3 font-bold rounded-lg shadow-lg"
                          aria-label="Complete all favorited quests in this category"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Complete {quests.filter(q => q.category === questCategory && favoritedQuests.has(q.id) && !q.completed).length} Favorites
                        </Button>
                        <Button
                          onClick={handleBulkCompleteAllFavorites}
                          disabled={loading || quests.filter(q => favoritedQuests.has(q.id) && !q.completed).length === 0}
                          className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-800/50 disabled:text-gray-400 text-white px-4 py-3 font-bold rounded-lg shadow-lg"
                          aria-label="Complete all favorited quests across all categories"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Complete {quests.filter(q => favoritedQuests.has(q.id) && !q.completed).length} Total Favorites
                        </Button>
                        <Button
                          onClick={handleManualReset}
                          disabled={manualResetLoading || !token}
                          className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800/50 disabled:text-gray-400 text-white px-4 py-3 font-bold rounded-lg shadow-lg border border-gray-500"
                          aria-label="Manually reset today's quests"
                        >
                          {manualResetLoading ? (
                            <>
                              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Resetting...
                            </>
                          ) : (
                            <>
                              🔄 Reset Today&apos;s Quests
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Enhanced Quest Organization */}
                      <QuestOrganization
                        quests={quests}
                        onQuestToggle={handleQuestToggle}
                        onQuestFavorite={handleQuestFavorite}
                        onQuestEdit={handleEditQuest}
                        onQuestDelete={handleDeleteQuest}
                        onAddQuest={() => setAddQuestModalOpen(true)}
                        showCategoryFilter={true}
                        context="quests"
                        hideOverview={true}
                        hideCategoryOverview={true}
                      />
                    </div>
                  </TabsContent>

                  {/* Progression Tab - Sync Status, Streak, Chronicles, etc. */}
                  <TabsContent value="progression" className="space-y-6">
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
                        <h2 className="text-xl font-bold text-amber-500 font-medieval">Your Journey</h2>
                        <StreakIndicator
                          currentStreak={questStreak}
                          isCompletedToday={quests.some(q => q.completed)}
                        />
                      </div>
                      <GameplayLoopIndicator
                        questsCompleted={quests.filter(q => q.completed).length}
                        goldEarned={quests.reduce((sum, q) => sum + (q.completed ? (q.gold || 0) : 0), 0)}
                        kingdomTiles={0} // TODO: Get from kingdom state
                      />
                    </div>

                    {/* Quest Overview and Categories - Moved from Errands */}
                    <QuestOrganization
                      quests={quests}
                      onQuestToggle={handleQuestToggle}
                      onQuestFavorite={handleQuestFavorite}
                      onQuestEdit={handleEditQuest}
                      onQuestDelete={handleDeleteQuest}
                      onAddQuest={() => setAddQuestModalOpen(true)}
                      showCategoryFilter={false}
                      context="quests"
                      hideOverview={false}
                      hideCategoryOverview={false}
                      onlyShowOverviews={true}
                    />

                    {/* Quest Streak Summary Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ChroniclesCard currentLevel={characterStats.level} />
                      <TarotCardDisplay />
                    </div>

                    {/* Daily Progress Card */}
                    <DailyProgressCard
                      completedCount={challenges.filter(c => c.completed).length}
                      totalCount={challenges.length}
                      currentLevel={characterStats.level}
                      currentXP={characterStats.experience}
                      xpToNextLevel={characterStats.xpToNextLevel}
                      currentGold={characterStats.gold}
                    />

                    {/* Quest Streak Summary Card */}
                    <div className="mb-6 w-full">
                      <Card className="medieval-card-primary w-full" style={{ height: 'auto', minHeight: '226px' }} aria-label="quest-streak-summary-card">
                        {/* Desktop/Tablet Layout - Horizontal 3-Column */}
                        <div className="hidden md:flex items-center gap-6 w-full">
                          {/* Left: Streak Badge - Vertical Layout */}
                          <div className="flex flex-col items-center justify-center bg-black rounded-2xl p-6 flex-shrink-0">
                            <Flame className="w-14 h-14 text-[#0D7200] mb-2" aria-hidden="true" />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-4xl font-extrabold text-white text-center truncate" aria-label="quest-streak-value">{streakData?.streak_days ?? 0} days</div>
                              </TooltipTrigger>
                              <TooltipContent>{streakData?.streak_days ?? 0} days</TooltipContent>
                            </Tooltip>
                            <div className="text-lg text-gray-300 text-center">Day streak</div>
                          </div>

                          {/* Middle: Quest Progress Section */}
                          <div className="flex-1 flex flex-col gap-3">
                            <div className="flex items-baseline gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-4xl font-bold text-white truncate">{todaysCompleted}</span>
                                </TooltipTrigger>
                                <TooltipContent>{todaysCompleted}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-lg text-gray-300 truncate">/ {todaysTotal} quests</span>
                                </TooltipTrigger>
                                <TooltipContent>/ {todaysTotal} quests</TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="w-full h-5 bg-black rounded-full overflow-hidden relative">
                              <div className="h-full bg-[#0D7200] rounded-full transition-all duration-500" style={{ width: `${todaysTotal ? (todaysCompleted / todaysTotal) * 100 : 0}%` }} />
                            </div>
                            {/* Days of the week with styled circles */}
                            <div className="flex justify-between text-sm text-gray-300 mt-3">
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Mon</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Tue</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Wed</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Thu</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Fri</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Sat</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Sun</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Bonus and Scrolls */}
                          <div className="flex gap-4 flex-shrink-0">
                            <div className="text-center p-4 bg-black/20 rounded-xl">
                              <div className="text-sm font-bold text-[#F0F0F0] mb-1">Streak Bonus:</div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-lg sm:text-xl font-bold text-[#F0F0F0] mb-1 truncate">+{getStreakBonus(streakData?.streak_days ?? 0)} gold/day</div>
                                </TooltipTrigger>
                                <TooltipContent>+{getStreakBonus(streakData?.streak_days ?? 0)} gold/day</TooltipContent>
                              </Tooltip>
                              <div className="text-xs text-[#F0F0F0]">(Max 50 gold/day)</div>
                            </div>
                            <div className="text-center p-4 bg-black/20 rounded-xl">
                              <div className="text-sm font-bold text-[#F0F0F0] mb-1">Streak Scrolls:</div>
                              <div className="text-xl font-bold text-[#F0F0F0] mb-1">{getStreakScrollCount()}</div>
                              <div className="text-xs text-[#F0F0F0]">(Use to save a missed streak)</div>
                            </div>
                          </div>
                        </div>



                        {/* Mobile Layout - Responsive (same component, smaller elements) */}
                        <div className="md:hidden flex flex-col w-full gap-6 p-6">
                          {/* Streak Badge - Mobile (same layout as desktop but smaller) */}
                          <div className="flex flex-col items-center justify-center bg-black rounded-xl p-4">
                            <Flame className="w-8 h-8 text-[#0D7200] mb-1" aria-hidden="true" />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-xl font-extrabold text-white text-center truncate" aria-label="quest-streak-value">{streakData?.streak_days ?? 0} days</div>
                              </TooltipTrigger>
                              <TooltipContent>{streakData?.streak_days ?? 0} days</TooltipContent>
                            </Tooltip>
                            <div className="text-sm text-gray-300 text-center">Day streak</div>
                          </div>

                          {/* Quest Progress Section - Mobile */}
                          <div className="flex flex-col gap-3">
                            <div className="flex items-baseline gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-2xl font-bold text-white truncate">{todaysCompleted}</span>
                                </TooltipTrigger>
                                <TooltipContent>{todaysCompleted}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-lg text-gray-300 truncate">/ {todaysTotal} quests</span>
                                </TooltipTrigger>
                                <TooltipContent>/ {todaysTotal} quests</TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="w-full h-4 bg-black rounded-full overflow-hidden relative">
                              <div className="h-full bg-[#0D7200] rounded-full transition-all duration-500" style={{ width: `${todaysTotal ? (todaysCompleted / todaysTotal) * 100 : 0}%` }} />
                            </div>
                            {/* Days of the week with smaller circles */}
                            <div className="flex justify-between text-xs text-gray-300 mt-3">
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Mon</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Tue</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Wed</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Thu</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Fri</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Sat</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Sun</span>
                              </div>
                            </div>
                          </div>

                          {/* Bonus and Scrolls - Mobile Stacked */}
                          <div className="flex flex-col gap-3">
                            <div className="text-center p-3 bg-black/20 rounded-lg">
                              <div className="text-sm font-bold text-[#F0F0F0] mb-1">Streak Bonus:</div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-lg sm:text-xl font-bold text-[#F0F0F0] mb-1 truncate">+{getStreakBonus(streakData?.streak_days ?? 0)} gold/day</div>
                                </TooltipTrigger>
                                <TooltipContent>+{getStreakBonus(streakData?.streak_days ?? 0)} gold/day</TooltipContent>
                              </Tooltip>
                              <div className="text-xs text-[#F0F0F0]">(Max 50 gold/day)</div>
                            </div>
                            <div className="text-center p-3 bg-black/20 rounded-lg">
                              <div className="text-sm font-bold text-[#F0F0F0] mb-1">Streak Scrolls:</div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-lg font-bold text-[#F0F0F0] mb-1 truncate">{getStreakScrollCount()}</div>
                                </TooltipTrigger>
                                <TooltipContent>{getStreakScrollCount()}</TooltipContent>
                              </Tooltip>
                              <div className="text-xs text-[#F0F0F0]">(Use to save a missed streak)</div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Challenges Tab */}
              <TabsContent value="challenges">
                {/* Nested Tabs for Errands and Progression */}
                <Tabs defaultValue="errands" className="space-y-6">
                  <TabsList className="mb-6 w-full grid grid-cols-2">
                    <TabsTrigger value="errands">Errands</TabsTrigger>
                    <TabsTrigger value="progression">Progression</TabsTrigger>
                  </TabsList>

                  {/* Errands Tab - Challenge List */}
                  <TabsContent value="errands" className="space-y-6">
                    {/* Enhanced Challenge Organization */}
                    <QuestOrganization
                      quests={challenges}
                      onQuestToggle={handleChallengeToggle}
                      onQuestFavorite={() => { }} // Challenges don't have favorites
                      onQuestEdit={handleEditChallenge}
                      onQuestDelete={(challengeId) => handleDeleteChallenge(challengeId)}
                      onAddQuest={() => setAddChallengeModalOpen(true)}
                      showCategoryFilter={true}
                      context="challenges"
                      hideOverview={true}
                      hideCategoryOverview={true}
                    />
                  </TabsContent>

                  {/* Progression Tab - Streak Summary and Overview */}
                  <TabsContent value="progression" className="space-y-6">
                    {/* Challenge Streak Summary Card */}
                    <div className="mb-6 w-full">
                      <Card className="medieval-card-primary w-full" style={{ height: 'auto', minHeight: '226px' }} aria-label="challenge-streak-summary-card">
                        {/* Desktop/Tablet Layout - Horizontal 3-Column */}
                        <div className="hidden md:flex items-center gap-6 w-full">
                          {/* Left: Streak Badge - Vertical Layout */}
                          <div className="flex flex-col items-center justify-center bg-black rounded-2xl p-6 flex-shrink-0">
                            <Flame className="w-14 h-14 text-[#0D7200] mb-2" aria-hidden="true" />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-4xl font-extrabold text-white text-center truncate" aria-label="challenge-streak-value">{challengeStreakData?.streak_days ?? 0} days</div>
                              </TooltipTrigger>
                              <TooltipContent>{challengeStreakData?.streak_days ?? 0} days</TooltipContent>
                            </Tooltip>
                            <div className="text-lg text-gray-300 text-center">Day streak</div>
                          </div>

                          {/* Middle: Challenge Progress Section */}
                          <div className="flex-1 flex flex-col gap-3">
                            <div className="flex items-baseline gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-4xl font-bold text-white truncate">{challenges.filter(c => c.category === challengeCategory && c.completed).length}</span>
                                </TooltipTrigger>
                                <TooltipContent>{challenges.filter(c => c.category === challengeCategory && c.completed).length}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-lg text-gray-300 truncate">/ {challenges.filter(c => c.category === challengeCategory).length} challenges</span>
                                </TooltipTrigger>
                                <TooltipContent>/ {challenges.filter(c => c.category === challengeCategory).length} challenges</TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="w-full h-5 bg-black rounded-full overflow-hidden relative">
                              <div className="h-full bg-[#0D7200] rounded-full transition-all duration-500" style={{ width: `${challenges.filter(c => c.category === challengeCategory).length ? (challenges.filter(c => c.category === challengeCategory && c.completed).length / challenges.filter(c => c.category === challengeCategory).length) * 100 : 0}%` }} />
                            </div>
                            {/* Days of the week with styled circles */}
                            <div className="flex justify-between text-sm text-gray-300 mt-3">
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Mon</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Tue</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Wed</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Thu</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Fri</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Sat</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-7 h-7 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>Sun</span>
                              </div>
                            </div>
                          </div>

                          {/* Bonus and Scrolls - Desktop Layout */}
                          <div className="flex flex-col gap-3">
                            <div className="text-center p-3 bg-black/20 rounded-lg">
                              <div className="text-sm font-bold text-[#F0F0F0] mb-1">Streak Bonus:</div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-lg sm:text-xl font-bold text-[#F0F0F0] mb-1 truncate">+{getStreakBonus(challengeStreakData?.streak_days ?? 0)} gold/day</div>
                                </TooltipTrigger>
                                <TooltipContent>+{getStreakBonus(challengeStreakData?.streak_days ?? 0)} gold/day</TooltipContent>
                              </Tooltip>
                              <div className="text-xs text-[#F0F0F0]">(Max 50 gold/day)</div>
                            </div>
                            <div className="text-center p-3 bg-black/20 rounded-lg">
                              <div className="text-sm font-bold text-[#F0F0F0] mb-1">Streak Scrolls:</div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-lg font-bold text-[#F0F0F0] mb-1 truncate">{getStreakScrollCount()}</div>
                                </TooltipTrigger>
                                <TooltipContent>{getStreakScrollCount()}</TooltipContent>
                              </Tooltip>
                              <div className="text-xs text-[#F0F0F0]">(Use to save a missed streak)</div>
                            </div>
                          </div>
                        </div>

                        {/* Mobile Layout - Vertical Stack */}
                        <div className="md:hidden flex flex-col gap-4 w-full">
                          {/* Streak Badge - Mobile */}
                          <div className="flex flex-col items-center justify-center bg-black rounded-xl p-4">
                            <Flame className="w-10 h-10 text-[#0D7200] mb-2" aria-hidden="true" />
                            <div className="text-2xl font-extrabold text-white text-center truncate" aria-label="challenge-streak-value-mobile">{challengeStreakData?.streak_days ?? 0} days</div>
                            <div className="text-sm text-gray-300 text-center">Day streak</div>
                          </div>

                          {/* Challenge Progress Section - Mobile */}
                          <div className="flex flex-col gap-3">
                            <div className="flex items-baseline gap-2 justify-center">
                              <span className="text-2xl font-bold text-white truncate">{challenges.filter(c => c.category === challengeCategory && c.completed).length}</span>
                              <span className="text-base text-gray-300 truncate">/ {challenges.filter(c => c.category === challengeCategory).length} challenges</span>
                            </div>
                            <div className="w-full h-4 bg-black rounded-full overflow-hidden relative">
                              <div className="h-full bg-[#0D7200] rounded-full transition-all duration-500" style={{ width: `${challenges.filter(c => c.category === challengeCategory).length ? (challenges.filter(c => c.category === challengeCategory && c.completed).length / challenges.filter(c => c.category === challengeCategory).length) * 100 : 0}%` }} />
                            </div>
                            {/* Days of the week with styled circles - Mobile */}
                            <div className="flex justify-between text-xs text-gray-300 mt-2">
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>M</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>T</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>W</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>T</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>F</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>S</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-5 h-5 bg-black border-2 border-gray-300 rounded-full mb-1"></div>
                                <span>S</span>
                              </div>
                            </div>
                          </div>

                          {/* Bonus and Scrolls - Mobile Stacked */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-3 bg-black/20 rounded-lg">
                              <div className="text-xs font-bold text-[#F0F0F0] mb-1">Streak Bonus:</div>
                              <div className="text-sm font-bold text-[#F0F0F0] mb-1 truncate">+{getStreakBonus(challengeStreakData?.streak_days ?? 0)} gold/day</div>
                              <div className="text-xs text-[#F0F0F0]">(Max 50)</div>
                            </div>
                            <div className="text-center p-3 bg-black/20 rounded-lg">
                              <div className="text-xs font-bold text-[#F0F0F0] mb-1">Streak Scrolls:</div>
                              <div className="text-sm font-bold text-[#F0F0F0] mb-1 truncate">{getStreakScrollCount()}</div>
                              <div className="text-xs text-[#F0F0F0]">(Save streak)</div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Challenge Overview and Categories */}
                    <QuestOrganization
                      quests={challenges}
                      onQuestToggle={handleChallengeToggle}
                      onQuestFavorite={() => { }}
                      onQuestEdit={handleEditChallenge}
                      onQuestDelete={(challengeId) => handleDeleteChallenge(challengeId)}
                      onAddQuest={() => setAddChallengeModalOpen(true)}
                      showCategoryFilter={true}
                      context="challenges"
                      onlyShowOverviews={true}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Milestones Tab */}
              <TabsContent value="milestones">
                {/* Nested Tabs for Errands and Progression */}
                <Tabs defaultValue="errands" className="space-y-6">
                  <TabsList className="mb-6 w-full grid grid-cols-2">
                    <TabsTrigger value="errands">Errands</TabsTrigger>
                    <TabsTrigger value="progression">Progression</TabsTrigger>
                  </TabsList>

                  {/* Errands Tab - Milestone List */}
                  <TabsContent value="errands" className="space-y-6">
                    {/* Enhanced Milestone Organization */}
                    <QuestOrganization
                      quests={milestones}
                      onQuestToggle={handleMilestoneToggle}
                      onQuestFavorite={() => { }} // Milestones don't have favorites
                      onQuestEdit={handleMilestoneEdit}
                      onQuestDelete={handleMilestoneDelete}
                      onAddQuest={handleAddMilestone}
                      showCategoryFilter={true}
                      context="milestones"
                      hideOverview={true}
                      hideCategoryOverview={true}
                    />
                  </TabsContent>

                  {/* Progression Tab - Milestone Overview */}
                  <TabsContent value="progression" className="space-y-6">
                    {/* Milestone Overview and Categories */}
                    <QuestOrganization
                      quests={milestones}
                      onQuestToggle={handleMilestoneToggle}
                      onQuestFavorite={() => { }} // Milestones don't have favorites
                      onQuestEdit={handleMilestoneEdit}
                      onQuestDelete={handleMilestoneDelete}
                      onAddQuest={handleAddMilestone}
                      showCategoryFilter={true}
                      context="milestones"
                      onlyShowOverviews={true}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Recovery Tab */}
              <TabsContent value="recovery">
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
                      // Refetch streak data when recovery actions are taken
                      if (token && challengeCategory) {
                        fetch(`/api/streaks-direct?category=${encodeURIComponent(challengeCategory)}`, {
                          headers: { Authorization: `Bearer ${token}` },
                        })
                          .then(res => {
                            if (res.ok) return res.json();
                            throw new Error('Failed to refetch');
                          })
                          .then(data => setChallengeStreakData(data))
                          .catch(error => console.error('Error refetching streak:', error));
                      }
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </MobileContentWrapper>
        </MobileLayoutWrapper>
        {/* Bottom spacing */}
        <div className="h-8 md:h-12"></div>
        {/* Edit Quest Modal */}
        {editModalOpen && editingQuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black backdrop-blur-sm" onClick={() => { setEditModalOpen(false); setEditingQuest(null); }} />
            <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Edit Quest</h2>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleEditQuestSubmit(editingQuest);
                }}
              >
                <label className="block mb-2 text-sm font-medium">Name</label>
                <input
                  className="w-full mb-4 p-2 border rounded"
                  value={editingQuest.name}
                  onChange={e => setEditingQuest({ ...editingQuest, name: e.target.value })}
                  placeholder="Quest name"
                  title="Quest name"
                  aria-label="Quest name"
                  required
                />
                <label className="block mb-2 text-sm font-medium">Description</label>
                <textarea
                  className="w-full mb-4 p-2 border rounded resize-none"
                  rows={3}
                  value={editingQuest.description}
                  onChange={e => setEditingQuest({ ...editingQuest, description: e.target.value })}
                  placeholder="Quest description"
                  title="Quest description"
                  aria-label="Quest description"
                />
                <label className="block mb-2 text-sm font-medium">Category</label>
                <select
                  className="w-full mb-4 p-2 border rounded"
                  value={editingQuest.category}
                  onChange={e => setEditingQuest({ ...editingQuest, category: e.target.value })}
                  aria-label="Quest category"
                >
                  {questCategories.map((category: string) => (
                    <option key={category} value={category}>{getCategoryLabel(category)}</option>
                  ))}
                </select>
                <label className="block mb-2 text-sm font-medium">Difficulty</label>
                <input
                  className="w-full mb-4 p-2 border rounded"
                  value={editingQuest.difficulty}
                  onChange={e => setEditingQuest({ ...editingQuest, difficulty: e.target.value })}
                  placeholder="Difficulty"
                  title="Difficulty"
                  aria-label="Difficulty"
                />
                <label className="block mb-2 text-sm font-medium">XP Reward</label>
                <input
                  type="number"
                  className="w-full mb-4 p-2 border rounded"
                  value={editingQuest.xp || 0}
                  onChange={e => setEditingQuest({ ...editingQuest, xp: Number(e.target.value) })}
                  placeholder="XP"
                  title="XP"
                  aria-label="XP"
                />
                <label className="block mb-2 text-sm font-medium">Gold Reward</label>
                <input
                  type="number"
                  className="w-full mb-4 p-2 border rounded"
                  value={editingQuest.gold || 0}
                  onChange={e => setEditingQuest({ ...editingQuest, gold: Number(e.target.value) })}
                  placeholder="Gold"
                  title="Gold"
                  aria-label="Gold"
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => { setEditModalOpen(false); setEditingQuest(null); }}>Cancel</Button>
                  <Button type="submit" variant="default">Save</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Challenge Modal */}
        {editChallengeModalOpen && editingChallenge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black backdrop-blur-sm" onClick={() => { setEditChallengeModalOpen(false); setEditingChallenge(null); }} />
            <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Edit Challenge</h2>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleEditChallengeSubmit(editingChallenge);
                }}
              >
                <label className="block mb-2 text-sm font-medium">Name</label>
                <input
                  className="w-full mb-4 p-2 border rounded"
                  value={editingChallenge.name}
                  onChange={e => setEditingChallenge({ ...editingChallenge, name: e.target.value })}
                  placeholder="Challenge name"
                  title="Challenge name"
                  aria-label="Challenge name"
                  required
                />
                <label className="block mb-2 text-sm font-medium">Description</label>
                <textarea
                  className="w-full mb-4 p-2 border rounded resize-none"
                  rows={3}
                  value={editingChallenge.description}
                  onChange={e => setEditingChallenge({ ...editingChallenge, description: e.target.value })}
                  placeholder="Challenge description"
                  title="Challenge description"
                  aria-label="Challenge description"
                />
                <label className="block mb-2 text-sm font-medium">Category</label>
                <select
                  className="w-full mb-4 p-2 border rounded"
                  value={editingChallenge.category}
                  onChange={e => setEditingChallenge({ ...editingChallenge, category: e.target.value })}
                  aria-label="Challenge category"
                >
                  <option value="HIIT & Full Body">HIIT & Full Body</option>
                </select>
                <label className="block mb-2 text-sm font-medium">Difficulty</label>
                <select
                  className="w-full mb-4 p-2 border rounded"
                  value={editingChallenge.difficulty}
                  onChange={e => setEditingChallenge({ ...editingChallenge, difficulty: e.target.value })}
                  aria-label="Challenge difficulty"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <label className="block mb-2 text-sm font-medium">XP Reward</label>
                <input
                  type="number"
                  className="w-full mb-4 p-2 border rounded"
                  value={editingChallenge.xp || 0}
                  onChange={e => setEditingChallenge({ ...editingChallenge, xp: Number(e.target.value) })}
                  placeholder="XP"
                  title="XP"
                  aria-label="XP"
                />
                <label className="block mb-2 text-sm font-medium">Gold Reward</label>
                <input
                  type="number"
                  className="w-full mb-4 p-2 border rounded"
                  value={editingChallenge.gold || 0}
                  onChange={e => setEditingChallenge({ ...editingChallenge, gold: Number(e.target.value) })}
                  placeholder="Gold"
                  title="Gold"
                  aria-label="Gold"
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => { setEditChallengeModalOpen(false); setEditingChallenge(null); }}>Cancel</Button>
                  <Button type="submit" variant="default">Save</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Milestone Modal */}
        {editMilestoneModalOpen && editingMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black backdrop-blur-sm" onClick={() => { setEditMilestoneModalOpen(false); setEditingMilestone(null); }} />
            <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Edit Milestone</h2>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleEditMilestoneSubmit(editingMilestone);
                }}
              >
                <label className="block mb-2 text-sm font-medium">Name</label>
                <input
                  className="w-full mb-4 p-2 border rounded"
                  value={editingMilestone.name}
                  onChange={e => setEditingMilestone({ ...editingMilestone, name: e.target.value })}
                  placeholder="Milestone name"
                  title="Milestone name"
                  aria-label="Milestone name"
                  required
                />
                <label className="block mb-2 text-sm font-medium">Description</label>
                <textarea
                  className="w-full mb-4 p-2 border rounded resize-none"
                  rows={3}
                  value={editingMilestone.description}
                  onChange={e => setEditingMilestone({ ...editingMilestone, description: e.target.value })}
                  placeholder="Milestone description"
                  title="Milestone description"
                  aria-label="Milestone description"
                />
                <label className="block mb-2 text-sm font-medium">Category</label>
                <select
                  className="w-full mb-4 p-2 border rounded"
                  value={editingMilestone.category}
                  onChange={e => setEditingMilestone({ ...editingMilestone, category: e.target.value })}
                  aria-label="Milestone category"
                >
                  <option value="HIIT & Full Body">HIIT & Full Body</option>
                </select>
                <label className="block mb-2 text-sm font-medium">Difficulty</label>
                <select
                  className="w-full mb-4 p-2 border rounded"
                  value={editingMilestone.difficulty}
                  onChange={e => setEditingMilestone({ ...editingMilestone, difficulty: e.target.value })}
                  aria-label="Milestone difficulty"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <label className="block mb-2 text-sm font-medium">XP Reward</label>
                <input
                  type="number"
                  className="w-full mb-4 p-2 border rounded"
                  value={editingMilestone.xp || 0}
                  onChange={e => setEditingMilestone({ ...editingMilestone, xp: Number(e.target.value) })}
                  placeholder="XP"
                  title="XP"
                  aria-label="XP"
                />
                <label className="block mb-2 text-sm font-medium">Gold Reward</label>
                <input
                  type="number"
                  className="w-full mb-4 p-2 border rounded"
                  value={editingMilestone.gold || 0}
                  onChange={e => setEditingMilestone({ ...editingMilestone, gold: Number(e.target.value) })}
                  placeholder="Gold"
                  title="Gold"
                  aria-label="Gold"
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => { setEditMilestoneModalOpen(false); setEditingMilestone(null); }}>Cancel</Button>
                  <Button type="submit" variant="default">Save</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Milestone Modal */}
        {addMilestoneModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black backdrop-blur-sm" onClick={() => setAddMilestoneModalOpen(false)} />
            <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Add Milestone</h2>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  // TODO: Implement milestone creation
                  // Add milestone
                  setAddMilestoneModalOpen(false);
                }}
              >
                <label className="block mb-2 text-sm font-medium">Name</label>
                <input
                  className="w-full mb-4 p-2 border rounded"
                  value={newMilestone.name}
                  onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })}
                  placeholder="Milestone name"
                  title="Milestone name"
                  aria-label="Milestone name"
                  required
                />
                <label className="block mb-2 text-sm font-medium">Description</label>
                <textarea
                  className="w-full mb-4 p-2 border rounded resize-none"
                  rows={3}
                  value={newMilestone.description}
                  onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  placeholder="Milestone description"
                  title="Milestone description"
                  aria-label="Milestone description"
                />
                <label className="block mb-2 text-sm font-medium">Category</label>
                <select
                  className="w-full mb-4 p-2 border rounded"
                  value={newMilestone.category}
                  onChange={e => setNewMilestone({ ...newMilestone, category: e.target.value })}
                  aria-label="Milestone category"
                >
                  {questCategories.map((category: string) => (
                    <option key={category} value={category}>{getCategoryLabel(category)}</option>
                  ))}
                </select>
                <label className="block mb-2 text-sm font-medium">Difficulty</label>
                <input
                  className="w-full mb-4 p-2 border rounded"
                  value={newMilestone.difficulty}
                  onChange={e => setNewMilestone({ ...newMilestone, difficulty: e.target.value })}
                  placeholder="Difficulty"
                  title="Difficulty"
                  aria-label="Difficulty"
                />
                <label className="block mb-2 text-sm font-medium">XP Reward</label>
                <input
                  type="number"
                  className="w-full mb-4 p-2 border rounded"
                  value={newMilestone.xp}
                  onChange={e => setNewMilestone({ ...newMilestone, xp: Number(e.target.value) })}
                  placeholder="XP"
                  title="XP"
                  aria-label="XP"
                />
                <label className="block mb-2 text-sm font-medium">Gold Reward</label>
                <input
                  type="number"
                  className="w-full mb-4 p-2 border rounded"
                  value={newMilestone.gold}
                  onChange={e => setNewMilestone({ ...newMilestone, gold: Number(e.target.value) })}
                  placeholder="Gold"
                  title="Gold"
                  aria-label="Gold"
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setAddMilestoneModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="default">Add Milestone</Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Add Custom Challenge Modal */}
        {addChallengeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black backdrop-blur-sm" onClick={() => setAddChallengeModalOpen(false)} />
            <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Add Custom Challenge</h2>
              <form
                onSubmit={e => e.preventDefault()}
              >
                <label className="block mb-2 text-sm font-medium">Name</label>
                <input
                  className="w-full mb-4 p-2 border rounded"
                  value={newChallenge.name}
                  onChange={e => setNewChallenge({ ...newChallenge, name: e.target.value })}
                  placeholder="Challenge name"
                  title="Challenge name"
                  aria-label="Challenge name"
                  required
                />
                <label className="block mb-2 text-sm font-medium">Instructions</label>
                <textarea
                  className="w-full mb-4 p-2 border rounded"
                  value={newChallenge.instructions}
                  onChange={e => setNewChallenge({ ...newChallenge, instructions: e.target.value })}
                  placeholder="Instructions"
                  title="Instructions"
                  aria-label="Instructions"
                />
                <label className="block mb-2 text-sm font-medium">Sets/Reps</label>
                <input
                  className="w-full mb-4 p-2 border rounded"
                  value={newChallenge.setsReps}
                  onChange={e => setNewChallenge({ ...newChallenge, setsReps: e.target.value })}
                  placeholder="e.g. 3x12"
                  title="Sets/Reps"
                  aria-label="Sets/Reps"
                />
                <label className="block mb-2 text-sm font-medium">Tips</label>
                <input
                  className="w-full mb-4 p-2 border rounded"
                  value={newChallenge.tips}
                  onChange={e => setNewChallenge({ ...newChallenge, tips: e.target.value })}
                  placeholder="Tips"
                  title="Tips"
                  aria-label="Tips"
                />
                <label className="block mb-2 text-sm font-medium">Weight</label>
                <input
                  className="w-full mb-4 p-2 border rounded"
                  value={newChallenge.weight}
                  onChange={e => setNewChallenge({ ...newChallenge, weight: e.target.value })}
                  placeholder="e.g. 8kg"
                  title="Weight"
                  aria-label="Weight"
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setAddChallengeModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="default">Add</Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Edit Custom Challenge Modal */}
        {editCustomChallengeIdx !== null && editCustomChallengeData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black backdrop-blur-sm" onClick={() => { setEditCustomChallengeIdx(null); setEditCustomChallengeData(null); }} />
            <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Edit Custom Challenge</h2>
              <form
                onSubmit={e => e.preventDefault()}
              >
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
                  aria-label="Weight"
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => { setEditCustomChallengeIdx(null); setEditCustomChallengeData(null); }}>Cancel</Button>
                  <Button type="submit" variant="default">Save</Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Add Custom Quest Modal */}
        {addQuestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setAddQuestModalOpen(false)} />
            <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg w-full max-w-md shadow-lg max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold">Add Custom Quest</h2>
              </div>
              <form onSubmit={e => { e.preventDefault(); handleAddQuestSubmit({ ...newQuest, id: Date.now().toString(), completed: false, isNew: true, category: String(newQuest.category || questCategories[0]) }); }} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-6">
                  {addQuestError && <div className="mb-4 text-red-500 bg-red-900 p-2 rounded">{addQuestError}</div>}
                  <label className="block mb-2 text-sm font-medium">Name</label>
                  <input className="w-full mb-4 p-2 border rounded" value={newQuest.name} onChange={e => setNewQuest({ ...newQuest, name: e.target.value })} placeholder="Quest name" title="Quest name" aria-label="Quest name" required />
                  <label className="block mb-2 text-sm font-medium">Description</label>
                  <textarea className="w-full mb-4 p-2 border rounded" value={newQuest.description} onChange={e => setNewQuest({ ...newQuest, description: e.target.value })} placeholder="Quest description" title="Quest description" aria-label="Quest description" />
                  <label className="block mb-2 text-sm font-medium">Category</label>
                  <select className="w-full mb-4 p-2 border rounded" value={newQuest.category} onChange={e => setNewQuest({ ...newQuest, category: e.target.value })} aria-label="Quest category">
                    {questCategories.map((category: string) => (
                      <option key={category} value={category}>{getCategoryLabel(category)}</option>
                    ))}
                  </select>
                  <label className="block mb-2 text-sm font-medium">Difficulty</label>
                  <input className="w-full mb-4 p-2 border rounded" value={newQuest.difficulty} onChange={e => setNewQuest({ ...newQuest, difficulty: e.target.value })} placeholder="Difficulty" title="Difficulty" aria-label="Difficulty" />
                  <label className="block mb-2 text-sm font-medium">XP Reward</label>
                  <input type="number" className="w-full mb-4 p-2 border rounded" value={newQuest.xp} onChange={e => setNewQuest({ ...newQuest, xp: Number(e.target.value) })} placeholder="XP" title="XP" aria-label="XP" />
                  <label className="block mb-2 text-sm font-medium">Gold Reward</label>
                  <input type="number" className="w-full mb-4 p-2 border rounded" value={newQuest.gold} onChange={e => setNewQuest({ ...newQuest, gold: Number(e.target.value) })} placeholder="Gold" title="Gold" aria-label="Gold" />
                </div>
                <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setAddQuestModalOpen(false)} disabled={addQuestLoading}>Cancel</Button>
                  <Button type="submit" variant="default" disabled={addQuestLoading}>{addQuestLoading ? 'Adding...' : 'Add'}</Button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {deleteConfirmOpen && questToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black backdrop-blur-sm" onClick={cancelDeleteQuest} />
            <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Delete Quest</h2>
              <p>Are you sure you want to delete the quest &quot;{questToDelete.name}&quot;?</p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={cancelDeleteQuest}>Cancel</Button>
                <Button type="button" variant="destructive" onClick={confirmDeleteQuest}>Delete</Button>
              </div>
            </div>
          </div>
        )}
        {/* Add Challenge Type Modal */}
        {showAddChallengeTypeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black backdrop-blur-sm" onClick={() => setShowAddChallengeTypeModal(false)} />
            <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Add Challenge Type</h2>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleAddChallengeType();
                }}
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
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setShowAddChallengeTypeModal(false)}>Cancel</Button>
                  <Button type="submit" variant="default">Add</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Enhanced Toast Container */}
        <ToastContainer
          toasts={questToasts.toasts}
          onDismiss={questToasts.dismissToast}
        />
      </div>
    </EnhancedErrorBoundary>
  );
}