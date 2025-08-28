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
  might: 'text-amber-500 border-amber-800/30 bg-amber-900/10',
  knowledge: 'text-amber-500 border-amber-800/30 bg-amber-900/10',
  honor: 'text-amber-500 border-amber-800/30 bg-amber-900/10',
  castle: 'text-amber-500 border-amber-800/30 bg-amber-900/10',
  craft: 'text-amber-500 border-amber-800/30 bg-amber-900/10',
  vitality: 'text-amber-500 border-amber-800/30 bg-amber-900/10',
  wellness: 'text-amber-500 border-amber-800/30 bg-amber-900/10',
  exploration: 'text-amber-500 border-amber-800/30 bg-amber-900/10'
};

// --- 4-Day Workout Plan Data ---
const workoutPlan = [
  {
    category: 'Push/Legs/Core',
    exercises: [
      { name: 'Push-up (blue – chest, push-up board, 3 positions)', instructions: 'Place hands on the blue slots (left, middle, right), perform 12 push-ups per position.', setsReps: '3x12 per position', tips: 'Engage your core, lower chest close to the board.', weight: '0' },
      { name: 'Push-up (green – triceps, push-up board, 3 positions)', instructions: 'Place hands on the green slots and perform 10 triceps push-ups per position.', setsReps: '3x10 per position', tips: 'Elbows close to body, push up explosively.', weight: '0' },
      { name: 'Goblet Squat (with dumbbell/barbell)', instructions: 'Hold a dumbbell in front of your chest, squat deeply with control.', setsReps: '3x15', tips: 'Keep your chest upright, go deep.', weight: '8kg' },
      { name: 'Lunges (left & right)', instructions: 'Step forward deeply, bend your back knee toward the floor, alternate legs.', setsReps: '3x10 per leg', tips: 'Don\'t let your front knee pass your toes.', weight: '0' },
      { name: 'Crunch', instructions: 'Lie on your back, feet flat, curl up toward your knees.', setsReps: '3x25', tips: 'Look up, roll slowly, don\'t pull your neck.', weight: '0' },
      { name: 'Plank', instructions: 'Support on forearms and toes, hold your body straight and core tight.', setsReps: '1x max time', tips: 'Keep hips in line, brace your abs.', weight: '0' }
    ]
  },
  {
    category: 'Pull/Shoulder/Core',
    exercises: [
      { name: 'Australian Pull-up (under table)', instructions: 'Grip the table edge, pull chest to the edge, lower with control.', setsReps: '3x max', tips: 'Squeeze your shoulder blades at the top.', weight: '0' },
      { name: 'Dumbbell Bent-Over Row', instructions: 'Lean forward, keep back straight, row dumbbells to your ribs.', setsReps: '3x10-12', tips: 'Pull with your back, not your arms.', weight: '2x8kg' },
      { name: 'Push-up (yellow – shoulders, 3 positions)', instructions: 'Place hands on yellow slots, lower your head between your hands.', setsReps: '3x10 per position', tips: 'Hips up, form a pike shape.', weight: '0' },
      { name: 'Push-up (red – shoulders, 3 positions)', instructions: 'Use red slots, perform push-ups targeting shoulders.', setsReps: '3x10 per position', tips: 'Lower with control, keep core tight.', weight: '0' },
      { name: 'Side Plank (left & right)', instructions: 'Support on one forearm, lift hips high and hold – do both sides.', setsReps: '1x max per side', tips: 'Shoulder over elbow, body in straight line.', weight: '0' },
      { name: 'Lying Leg Raise', instructions: 'Lie flat, raise legs up, lower slowly while keeping back flat.', setsReps: '3x20', tips: 'Avoid arching your lower back.', weight: '0' }
    ]
  },
  {
    category: 'Legs/Arms/Core',
    exercises: [
      { name: 'Squat (barbell or 2 dumbbells)', instructions: 'Hold weight on shoulders, squat deep with control.', setsReps: '3x15', tips: 'Keep back straight, thighs parallel to floor.', weight: '2x8kg' },
      { name: 'Dumbbell Deadlift', instructions: 'Stand tall, bend at hips, lower dumbbells close to legs and lift.', setsReps: '3x10-12', tips: 'Back flat, hinge at hips.', weight: '2x8kg' },
      { name: 'Dumbbell Bicep Curl', instructions: 'Stand tall, curl dumbbells to shoulders, lower slowly.', setsReps: '3x12', tips: 'Avoid swinging, keep elbows close.', weight: '2x8kg' },
      { name: 'Dumbbell Shoulder Press', instructions: 'Press dumbbells overhead while standing or seated.', setsReps: '3x10', tips: 'Keep wrists straight, full range of motion.', weight: '2x8kg' },
      { name: 'Reverse Plank', instructions: 'Sit with legs extended, lift hips, support on heels and hands.', setsReps: '1x 30–60 sec', tips: 'Keep body straight, squeeze glutes.', weight: '0' },
      { name: 'Crunch', instructions: 'Lie back, feet flat, lift shoulders off the floor.', setsReps: '3x25', tips: 'Controlled movement, no neck pulling.', weight: '0' }
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

  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>(questCategories);
  const [mainTab, setMainTab] = useState<'quests' | 'challenges' | 'milestones' | 'recovery'>('quests');
  const [questCategory, setQuestCategory] = useState(questCategories[0]);
  const [challengeCategory, setChallengeCategory] = useState<string>(
    workoutPlan[0]?.category ?? ""
  );
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questToDelete, setQuestToDelete] = useState<Quest | null>(null);
  const [addChallengeModalOpen, setAddChallengeModalOpen] = useState(false);
  const [showAddChallengeTypeModal, setShowAddChallengeTypeModal] = useState(false);
  const [newChallengeTypeName, setNewChallengeTypeName] = useState('');
  const [editCustomChallengeIdx, setEditCustomChallengeIdx] = useState<number | null>(null);
  const [editCustomChallengeData, setEditCustomChallengeData] = useState<any>(null);
  const [addQuestModalOpen, setAddQuestModalOpen] = useState(false);
  const [addQuestLoading, setAddQuestLoading] = useState(false);
  const [favoritedQuests, setFavoritedQuests] = useState<Set<string>>(new Set());
  // const [milestones, setMilestones] = useState<any[]>([]);
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
  // --- Quest Streak Logic ---
  // Remove localStorage fallback for streak/history
  const [questStreak, setQuestStreak] = useState(0);
  const [questHistory, setQuestHistory] = useState<{date: string, completed: boolean}[]>([]);
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

  // Fetch quests when token is present and user is authenticated
  useEffect(() => {
    // Removed debugging log
    if (!token || !user) {
      // Removed debugging log
      return;
    }
    // Removed debugging log
    setLoading(true);
    async function fetchQuests() {
      try {
        if (!token) return; // Guard for linter
        // console.log('[Quests Debug] Fetching /api/quests-complete with token:', token.slice(0, 10), '...');
        const res = await fetch('/api/quests-complete', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch quests');
        const data = await res.json();
        // Removed debugging log
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
  }, [token, user]);

  // Fetch user's favorited quests
  const fetchFavorites = async () => {
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) return;

      const response = await fetch('/api/quests/favorites', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFavoritedQuests(new Set(data.favorites || []));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  // Daily reset logic for non-milestone quests and challenges (persisted in DB)
  useEffect(() => {
    if (!loading && quests.length > 0 && userId && token) {
      const lastReset = localStorage.getItem('last-quest-reset-date');
      const today = new Date().toISOString().slice(0, 10);
      
      // Only reset if we haven't reset today AND we have a valid token
      if (lastReset !== today && token) {
        console.log('[Daily Reset] Starting daily reset for date:', today);
        
        // Call backend to reset quests and challenges
        fetch('/api/quests/reset-daily', {
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
            
            // Update local state and localStorage
            setQuests(prev => prev.map(q => ({ ...q, completed: false })));
            localStorage.setItem('last-quest-reset-date', today);
            
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
      }
    }
  }, [loading, quests.length, userId, token]);

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

  // Polling for streak changes instead of real-time sync
  useEffect(() => {
    if (!userId || !questCategory) return;
    
    const pollInterval = setInterval(async () => {
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
          console.error('[Streaks Poll] Error polling streak:', error);
        }
      }
    }, 15000); // Poll every 15 seconds instead of 10
    
    return () => clearInterval(pollInterval);
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

  const handleQuestToggle = async (questId: string, currentCompleted: boolean) => {
    if (!token || !userId) return;
    
    try {
      const newCompleted = !currentCompleted;
      console.log('[QUEST-TOGGLE] Starting quest toggle:', { questId, currentCompleted, newCompleted, userId });
      
      // Find the quest object
      const questObj = quests.find(q => q.id === questId);
      if (!questObj) {
        throw new Error('Quest not found');
      }
      
      console.log('[QUEST-TOGGLE] Quest object found:', { questId, name: questObj.name, xp: questObj.xp, gold: questObj.gold });
      
      // Update the quest in the local state
      setQuests(prevQuests => 
        prevQuests.map(q => 
          q.id === questId 
            ? { ...q, completed: newCompleted }
            : q
        )
      );
      
      // Update in Supabase
      console.log('[QUEST-TOGGLE] Sending quest update to /api/quests-complete');
      const response = await fetch('/api/quests-complete', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: questObj.name,
          completed: newCompleted
        })
      });
      
      console.log('[QUEST-TOGGLE] Response received:', { status: response.status, ok: response.ok });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[QUEST-TOGGLE] Response error:', { status: response.status, errorText });
        throw new Error(`Failed to update quest: ${response.status} - ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('[QUEST-TOGGLE] Response data:', responseData);
      
      // Show success toast
      const quest = quests.find(q => q.id === questId);
      if (quest) {
        if (newCompleted) {
          // Quest completed
          const goldEarned = quest.gold || 0;
          const xpEarned = quest.xp || 0;
          
          console.log('[QUEST-TOGGLE] Quest completed, showing toast and updating stats:', { goldEarned, xpEarned });
          showQuestCompletionToast(quest.name, goldEarned, xpEarned);
          
          // Update character stats
          console.log('[QUEST-TOGGLE] Updating character stats...');
          await gainGold(goldEarned, 'quest-completion');
          await gainExperience(xpEarned, 'quest-completion', 'general');
          await gainStrengthFromQuest(quest.category, 1);
          console.log('[QUEST-TOGGLE] Character stats updated successfully');
        } else {
          // Quest uncompleted
          console.log('[QUEST-TOGGLE] Quest uncompleted');
          toast({
            title: "Quest Uncompleted",
            description: `${quest.name} has been marked as incomplete.`,
            duration: 2000,
          });
        }
      }
      
      console.log('[QUEST-TOGGLE] Quest toggle completed successfully');
      // Local state is already updated, no need to refetch
      
    } catch (error) {
      console.error('[QUEST-TOGGLE] Error toggling quest:', error);
      
      // Revert local state on error
      setQuests(prevQuests => 
        prevQuests.map(quest => 
          quest.id === questId 
            ? { ...quest, completed: currentCompleted }
            : quest
        )
      );
      
      toast({
        title: "Error",
        description: "Failed to update quest. Please try again.",
        duration: 3000,
      });
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

  const handleChallengeToggle = async (challengeId: string, currentCompleted: boolean) => {
    if (!token || !userId) return;
    
    try {
      const newCompleted = !currentCompleted;
      
      // Update local state
      setChallenges(prevChallenges => 
        prevChallenges.map(challenge => 
          challenge.id === challengeId 
            ? { ...challenge, completed: newCompleted }
            : challenge
        )
      );
      
      // Update in Supabase
      const response = await fetch('/api/challenges', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId,
          completed: newCompleted
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update challenge');
      }
      
      const challenge = challenges.find(c => c.id === challengeId);
      if (challenge) {
        if (newCompleted) {
          toast({
            title: "Challenge Completed!",
            description: `${challenge.name} has been completed!`,
            duration: 3000,
          });
        } else {
          toast({
            title: "Challenge Uncompleted",
            description: `${challenge.name} has been marked as incomplete.`,
            duration: 2000,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling challenge:', error);
      toast({
        title: "Error",
        description: "Failed to update challenge. Please try again.",
        duration: 3000,
      });
    }
  };

  const handleEditChallenge = (challenge: any) => {
    toast({
      title: "Edit Challenge",
      description: "Challenge editing functionality coming soon!",
      duration: 2000,
    });
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
        await handleQuestToggle(quest.id, false); // false = currently not completed, so this will complete it
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
        await handleQuestToggle(quest.id, false); // false = currently not completed, so this will complete it
      }
      
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

  // Add remaining missing variables and functions
  const [milestones, setMilestones] = useState<any[]>([]);
  const [addQuestError, setAddQuestError] = useState<string | null>(null);

  const handleMilestoneToggle = async (milestoneId: string, currentCompleted: boolean) => {
    if (!token || !userId) return;
    
    try {
      const newCompleted = !currentCompleted;
      
      // Update local state
      setMilestones(prevMilestones => 
        prevMilestones.map(milestone => 
          milestone.id === milestoneId 
            ? { ...milestone, completed: newCompleted }
            : milestone
        )
      );
      
      // Update in Supabase
      const response = await fetch('/api/milestones', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          milestoneId,
          completed: newCompleted
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update milestone');
      }
      
      const milestone = milestones.find(m => m.id === milestoneId);
      if (milestone) {
        if (newCompleted) {
          toast({
            title: "Milestone Completed!",
            description: `${milestone.name} has been completed!`,
            duration: 3000,
          });
        } else {
          toast({
            title: "Milestone Uncompleted",
            description: `${milestone.name} has been marked as incomplete.`,
            duration: 2000,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling milestone:', error);
      toast({
        title: "Error",
        description: "Failed to update milestone. Please try again.",
        duration: 3000,
      });
    }
  };

  const handleMilestoneEdit = (milestone: any) => {
    toast({
      title: "Edit Milestone",
      description: "Milestone editing functionality coming soon!",
      duration: 2000,
    });
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
      // Update local state
      setQuests(prevQuests => 
        prevQuests.map(q => 
          q.id === updatedQuest.id 
            ? updatedQuest
            : q
        )
      );
      
      // Update in Supabase
      const response = await fetch('/api/quests-complete', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedQuest)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update quest');
      }
      
      toast({
        title: "Quest Updated",
        description: "Quest has been successfully updated.",
        duration: 2000,
      });
      
      setEditModalOpen(false);
      setEditingQuest(null);
    } catch (error) {
      console.error('Error updating quest:', error);
      toast({
        title: "Error",
        description: "Failed to update quest. Please try again.",
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

  // Initialize predefined data - must be before any early returns
  useEffect(() => {
    // Fetch challenges and milestones from Supabase instead of using predefined data
    const fetchChallengesAndMilestones = async () => {
      if (!token) return;
      
      try {
        // Fetch challenges
        const challengesRes = await fetch('/api/challenges', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (challengesRes.ok) {
          const challengesData = await challengesRes.json();
          setChallenges(challengesData || []);
        }

        // Fetch milestones
        const milestonesRes = await fetch('/api/milestones', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (milestonesRes.ok) {
          const milestonesData = await milestonesRes.json();
          setMilestones(milestonesData || []);
        }
      } catch (error) {
        console.error('Error fetching challenges and milestones:', error);
      }
    };

    fetchChallengesAndMilestones();
  }, [token]);

  if (!isClerkLoaded || !isUserLoaded) {
    console.log('Waiting for auth and Clerk client...');
    return <FullPageLoading message="Loading authentication..." />;
  }

  if (!userId) {
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
    <div className="min-h-full quests-page-container scroll-prevent" style={{ overscrollBehavior: 'none' }}>
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
        subtitle="Embark on epic journeys and complete tasks to earn rewards."
        imageSrc="/images/quests-header.jpg"
        defaultBgColor="bg-amber-900"
        shouldRevealImage={true}
      />
      <MobileLayoutWrapper className="quests-page-container">
        <MobileContentWrapper>
          {error && <p className="text-red-500 bg-red-900 p-4 rounded-md mb-4">{error}</p>}
          
          {/* Gameplay Loop Indicator */}
          <div className="mb-6">
            <GameplayLoopIndicator 
              questsCompleted={quests.filter(q => q.completed).length}
              goldEarned={quests.reduce((sum, q) => sum + (q.completed ? (q.gold || 0) : 0), 0)}
              kingdomTiles={0} // TODO: Get from kingdom state
            />
          </div>
          
          <Tabs value={mainTab} onValueChange={v => setMainTab(v as 'quests' | 'challenges' | 'milestones' | 'recovery')} className="space-y-6">
          <TabsList className="mb-6 w-full grid grid-cols-4">
            <TabsTrigger value="quests">Tasks</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="recovery">Recovery</TabsTrigger>
          </TabsList>

          {/* Quests Tab */}
          <TabsContent value="quests">
            <div className="mb-6 space-y-6">
              {/* Bulk Complete Favorites Button */}
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                <Button
                  onClick={handleBulkCompleteFavorites}
                  disabled={loading || quests.filter(q => q.category === questCategory && favoritedQuests.has(q.id) && !q.completed).length === 0}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-800/50 disabled:text-gray-300 text-black px-4 py-3 font-bold rounded-lg shadow-lg"
                  aria-label="Complete all favorited quests in this category"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Complete {quests.filter(q => q.category === questCategory && favoritedQuests.has(q.id) && !q.completed).length} Favorites
                </Button>
                <Button
                  onClick={handleBulkCompleteAllFavorites}
                  disabled={loading || quests.filter(q => favoritedQuests.has(q.id) && !q.completed).length === 0}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-800/50 disabled:text-gray-400 text-black px-4 py-3 font-bold rounded-lg shadow-lg"
                  aria-label="Complete all favorited quests across all categories"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Complete {quests.filter(q => favoritedQuests.has(q.id) && !q.completed).length} Total Favorites
                </Button>
              </div>
              
              {/* Category Dropdown - REMOVED for Tasks tab */}
            </div>
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
            />
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            {/* Challenge Streak Summary Card (updated to match Tasks tab) */}
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
            {/* Enhanced Challenge Organization */}
            <QuestOrganization
              quests={challenges}
              onQuestToggle={handleChallengeToggle}
              onQuestFavorite={() => {}} // Challenges don't have favorites
              onQuestEdit={handleEditChallenge}
              onQuestDelete={(challengeId) => handleDeleteChallenge(challengeId)}
              onAddQuest={() => setAddChallengeModalOpen(true)}
              showCategoryFilter={true}
              context="challenges"
            />
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones">
            {/* Enhanced Milestone Organization */}
            <QuestOrganization
              quests={milestones}
              onQuestToggle={handleMilestoneToggle}
              onQuestFavorite={() => {}} // Milestones don't have favorites
              onQuestEdit={handleMilestoneEdit}
              onQuestDelete={handleMilestoneDelete}
              onAddQuest={handleAddMilestone}
              showCategoryFilter={true}
              context="milestones"
            />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black backdrop-blur-sm" onClick={() => setAddQuestModalOpen(false)} />
          <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Add Custom Quest</h2>
            <form onSubmit={e => { e.preventDefault(); handleAddQuestSubmit({ ...newQuest, id: Date.now().toString(), completed: false, isNew: true, category: String(newQuest.category || questCategories[0]) }); }}>
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
              <div className="flex justify-end gap-2">
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
    </div>
  );
}