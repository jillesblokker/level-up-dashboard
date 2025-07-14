"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Sword, Brain, Crown, Castle, Hammer, Heart, Plus, Trash2, Trophy, Sun, PersonStanding, Pencil, Flame } from 'lucide-react'
import { HeaderSection } from '@/components/HeaderSection'
import { useUser, useAuth } from '@clerk/nextjs'
import { Milestones } from '@/components/milestones'
import { updateCharacterStats, getCharacterStats } from '@/lib/character-stats-manager'
import { toast } from '@/components/ui/use-toast'
import CardWithProgress from '@/components/quest-card'
import React from 'react'
import { SignedIn, SignedOut, SignIn } from '@clerk/nextjs'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { gainGold } from '@/lib/gold-manager';

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
  might: 'text-red-500 border-red-800',
  knowledge: 'text-blue-500 border-blue-800',
  honor: 'text-yellow-500 border-yellow-800',
  castle: 'text-purple-500 border-purple-800',
  craft: 'text-amber-500 border-amber-800',
  vitality: 'text-green-500 border-green-800',
  wellness: 'text-amber-400 border-amber-600',
  exploration: 'text-blue-400 border-blue-600'
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
  // All hooks must be at the top
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isClerkLoaded } = useAuth();
  const userId = user?.id;
  const isGuest = !user;

  // Debug: log auth and supabase loading states
  console.log('[Quests Debug] isClerkLoaded:', isClerkLoaded, 'isUserLoaded:', isUserLoaded);

  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>(questCategories);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [mainTab, setMainTab] = useState<'quests' | 'challenges' | 'milestones'>('quests');
  const [questCategory, setQuestCategory] = useState(questCategories[0]);
  const [challengeCategory, setChallengeCategory] = useState<string>(
    workoutPlan[0]?.category ?? ""
  );
  const [milestoneCategory, setMilestoneCategory] = useState(questCategories[0]);
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean[]>>({});
  const [addChallengeModalOpen, setAddChallengeModalOpen] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    name: '',
    instructions: '',
    setsReps: '',
    tips: '',
    weight: '',
  });
  const [customChallenges, setCustomChallenges] = useState<Record<string, any[]>>({});
  const [challengeStreaks, setChallengeStreaks] = useState<Record<string, number[]>>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem(CHALLENGE_STREAKS_KEY) || '{}');
      } catch {
        return {};
      }
    }
    return {};
  });
  const [challengeLastCompleted, setChallengeLastCompleted] = useState<Record<string, string[]>>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem(CHALLENGE_LAST_COMPLETED_KEY) || '{}');
      } catch {
        return {};
      }
    }
    return {};
  });
  const [editCustomChallengeIdx, setEditCustomChallengeIdx] = useState<number | null>(null);
  const [editCustomChallengeData, setEditCustomChallengeData] = useState<any | null>(null);
  const [addQuestModalOpen, setAddQuestModalOpen] = useState(false);
  const [newQuest, setNewQuest] = useState({
    name: '',
    description: '',
    category: questCategory,
    difficulty: '',
    xp: 0,
    gold: 0,
  });
  const [addQuestError, setAddQuestError] = useState<string | null>(null);
  const [addQuestLoading, setAddQuestLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questToDelete, setQuestToDelete] = useState<Quest | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  // --- Quest Streak Logic ---
  const QUEST_STREAK_KEY = 'quest-streak-v1';
  const QUEST_HISTORY_KEY = 'quest-history-v1';
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
    const streak = Number(localStorage.getItem(QUEST_STREAK_KEY) || '0');
    setQuestStreak(streak);
    const hist = JSON.parse(localStorage.getItem(QUEST_HISTORY_KEY) || '[]');
    setQuestHistory(hist);
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
      localStorage.setItem(QUEST_HISTORY_KEY, JSON.stringify(newHistory));
      // Update streak
      let streak = 0;
      for (let i = newHistory.length - 1; i >= 0; i--) {
        if (newHistory[i]?.completed) streak++;
        else break;
      }
      setQuestStreak(streak);
      localStorage.setItem(QUEST_STREAK_KEY, String(streak));
    }
  }, [todaysCompleted, todaysTotal, userId]);

  // Acquire token only when Clerk is loaded and user is loaded
  useEffect(() => {
    let cancelled = false;
    async function getClerkToken() {
      if (!isClerkLoaded || !isUserLoaded) return;
      let t = await getToken();
      let attempts = 0;
      while (!t && attempts < 2) {
        await new Promise(res => setTimeout(res, 200));
        t = await getToken();
        attempts++;
      }
      if (!cancelled) setToken(t || null);
    }
    getClerkToken();
    return () => { cancelled = true; };
  }, [isClerkLoaded, isUserLoaded, getToken]);

  // Fetch quests when token is present
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    async function fetchQuests() {
      try {
        if (!token) return; // Guard for linter
        console.log('[Quests Debug] Fetching /api/quests with token:', token.slice(0, 10), '...');
        const res = await fetch('/api/quests', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch quests');
        const data = await res.json();
        console.log('[Quests Debug] fetched quests:', data);
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
  }, [token]);

  // Daily reset logic for non-milestone quests and challenges (persisted in DB)
  useEffect(() => {
    if (!loading && quests.length > 0 && userId) {
      const lastReset = localStorage.getItem('last-quest-reset-date');
      const today = new Date().toISOString().slice(0, 10);
      if (lastReset !== today) {
        // Call backend to reset quests and challenges
        fetch('/api/quests/reset-daily', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
          .then(res => res.json())
          .then(() => {
            // After reset, refetch quests
            setQuests(prev => prev.map(q => ({ ...q, completed: false })));
            // Optionally, refetch challenges if needed
            localStorage.setItem('last-quest-reset-date', today);
            toast({
              title: 'Daily Reset',
              description: 'Your daily quests and challenges have been reset! Time to build new habits.',
            });
          });
      }
    }
  }, [loading, quests.length, userId]);

  // Persist streaks and last completed
  useEffect(() => {
    localStorage.setItem(CHALLENGE_STREAKS_KEY, JSON.stringify(challengeStreaks));
  }, [challengeStreaks]);
  useEffect(() => {
    localStorage.setItem(CHALLENGE_LAST_COMPLETED_KEY, JSON.stringify(challengeLastCompleted));
  }, [challengeLastCompleted]);

  // Reset streaks if a day is missed (run on mount)
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setChallengeStreaks(prevStreaks => {
      const updated: Record<string, number[]> = { ...prevStreaks };
      Object.keys(prevStreaks).forEach(category => {
        const streakArr = prevStreaks[category] || [];
        const lastArr = (challengeLastCompleted[category] || []);
        updated[category] = streakArr.map((streak, idx) => {
          const last = lastArr[idx];
          if (!last) return 0;
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          if (last === today || last === yesterday) return streak;
          // Missed a day: forgiveness mechanic
          const scrolls = getStreakScrollCount();
          if (scrolls > 0 && window.confirm('You missed a day! Use a Streak Scroll to save your streak?')) {
            // Consume a scroll
            const inv = JSON.parse(localStorage.getItem('tileInventory') || '{}');
            inv['streak-scroll'].quantity = Math.max(0, (inv['streak-scroll']?.quantity || 1) - 1);
            localStorage.setItem('tileInventory', JSON.stringify(inv));
            // Show toast
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('toast', { detail: { title: 'Streak Saved!', description: 'You used a Streak Scroll to save your streak.' } }));
            }
            return streak;
          }
          return 0; // missed a day, no scroll
        });
      });
      return updated;
    });
  }, []);

  // Mark quest as complete (sync with backend)
  const handleQuestToggle = async (questId: string, currentCompleted: boolean) => {
    // Find the quest object
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error('No Clerk token');
      // Call the backend to upsert quest completion
      const res = await fetch('/api/quests/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questId: quest.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: 'Error', description: `Failed to update quest: ${err.error || res.statusText}` });
        setLoading(false);
        return;
      }
      // Now update the completed status (toggle)
      const updateRes = await fetch('/api/quests/completion', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questId: quest.id, completed: !currentCompleted }),
      });
      if (!updateRes.ok) {
        const err = await updateRes.json();
        toast({ title: 'Error', description: `Failed to update quest: ${err.error || updateRes.statusText}` });
        setLoading(false);
        return;
      }
      // Re-fetch quests from backend
      const fetchRes = await fetch('/api/quests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (fetchRes.ok) {
        const data = await fetchRes.json();
        setQuests(data || []);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update quest' });
    } finally {
      setLoading(false);
    }
  };

  // Mark milestone as complete (sync with backend)
  const handleMilestoneToggle = async (milestoneId: string, currentCompleted: boolean) => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error('No Clerk token');
      console.log('[Milestones Debug] POST /api/milestones/completion', { milestoneId });
      const res = await fetch('/api/milestones/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ milestoneId }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: 'Error', description: `[Milestones Debug] Failed to update milestone: ${err.error || res.statusText}` });
        setLoading(false);
        return;
      }
      console.log('[Milestones Debug] PUT /api/milestones/completion', { milestoneId, completed: !currentCompleted });
      const updateRes = await fetch('/api/milestones/completion', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ milestoneId, completed: !currentCompleted }),
      });
      if (!updateRes.ok) {
        const err = await updateRes.json();
        toast({ title: 'Error', description: `[Milestones Debug] Failed to update milestone: ${err.error || updateRes.statusText}` });
        setLoading(false);
        return;
      }
      console.log('[Milestones Debug] Fetching /api/milestones');
      const fetchRes = await fetch('/api/milestones', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (fetchRes.ok) {
        const data = await fetchRes.json();
        console.log('[Milestones Debug] fetched milestones:', data);
        setMilestones(data || []);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: '[Milestones Debug] ' + (err.message || 'Failed to update milestone') });
      console.error('[Milestones Debug] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark challenge as complete (sync with backend)
  const handleChallengeToggle = async (challengeId: string, currentCompleted: boolean) => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error('No Clerk token');
      console.log('[Challenges Debug] POST /api/challenges/completion', { challengeId });
      const res = await fetch('/api/challenges/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ challengeId }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: 'Error', description: `[Challenges Debug] Failed to update challenge: ${err.error || res.statusText}` });
        setLoading(false);
        return;
      }
      console.log('[Challenges Debug] PUT /api/challenges/completion', { challengeId, completed: !currentCompleted });
      const updateRes = await fetch('/api/challenges/completion', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ challengeId, completed: !currentCompleted }),
      });
      if (!updateRes.ok) {
        const err = await updateRes.json();
        toast({ title: 'Error', description: `[Challenges Debug] Failed to update challenge: ${err.error || updateRes.statusText}` });
        setLoading(false);
        return;
      }
      console.log('[Challenges Debug] Fetching /api/challenges');
      const fetchRes = await fetch('/api/challenges', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (fetchRes.ok) {
        const data = await fetchRes.json();
        console.log('[Challenges Debug] fetched challenges:', data);
        setChallenges(data || []);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: '[Challenges Debug] ' + (err.message || 'Failed to update challenge') });
      console.error('[Challenges Debug] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Edit quest (open modal)
  const handleEditQuest = (quest: Quest) => {
    setEditingQuest(quest);
    setEditModalOpen(true);
  };

  // Save edited quest
  const handleEditQuestSubmit = (updatedQuest: Quest) => {
    setQuests(prev => prev.map(q =>
      q.id === updatedQuest.id ? { ...q, ...updatedQuest } : q
    ));
    setEditModalOpen(false);
    setEditingQuest(null);
  };

  // Delete quest (UI only, confirmation modal)
  const handleDeleteQuest = (questId: string) => {
    setQuestToDelete(quests.find(q => q.id === questId) || null);
    setDeleteConfirmOpen(true);
  };
  const confirmDeleteQuest = () => {
    if (questToDelete) {
      setQuests(prev => prev.filter(q => q.id !== questToDelete.id));
      setDeleteConfirmOpen(false);
      setQuestToDelete(null);
    }
  };
  const cancelDeleteQuest = () => {
    setDeleteConfirmOpen(false);
    setQuestToDelete(null);
  };

  // Add quest (open modal)
  const handleAddQuest = () => {
    setAddQuestModalOpen(true);
  };
  const handleAddQuestSubmit = (quest: Quest) => {
    setQuests(prev => [{ ...quest, id: Date.now().toString(), completed: false, isNew: true, category: String(quest.category || questCategories[0]) }, ...prev]);
    setAddQuestModalOpen(false);
  };

  // Fetch milestones when token is present
  useEffect(() => {
    if (!token) return;
    async function fetchMilestones() {
      try {
        if (!token) return; // Guard for linter
        console.log('[Milestones Debug] Fetching /api/milestones with token:', token.slice(0, 10), '...');
        const res = await fetch('/api/milestones', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch milestones');
        const data = await res.json();
        console.log('[Milestones Debug] fetched milestones:', data);
        setMilestones(data || []);
      } catch (err: any) {
        setError('[Milestones Debug] Error fetching milestones: ' + (err.message || 'Failed to fetch milestones'));
        setMilestones([]);
        console.error('[Milestones Debug] Error fetching milestones:', err);
      }
    }
    fetchMilestones();
  }, [token]);

  // Fetch challenges when token is present
  useEffect(() => {
    if (!token) return;
    async function fetchChallenges() {
      try {
        if (!token) return; // Guard for linter
        console.log('[Challenges Debug] Fetching /api/challenges with token:', token.slice(0, 10), '...');
        const res = await fetch('/api/challenges', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch challenges');
        const data = await res.json();
        console.log('[Challenges Debug] fetched challenges:', data);
        setChallenges(data || []);
      } catch (err: any) {
        setError('[Challenges Debug] Error fetching challenges: ' + (err.message || 'Failed to fetch challenges'));
        setChallenges([]);
        console.error('[Challenges Debug] Error fetching challenges:', err);
      }
    }
    fetchChallenges();
  }, [token]);

  if (!isClerkLoaded || !isUserLoaded) {
    console.log('Waiting for auth and Clerk client...');
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Quests</h1>
        <div className="text-yellow-500 bg-yellow-900/20 p-4 rounded-md mb-4">
          Waiting for authentication and Clerk client to load...<br />
          <span>isClerkLoaded: {String(isClerkLoaded)}, isUserLoaded: {String(isUserLoaded)}</span>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Quests</h1>
        <div className="text-red-500 bg-red-900/20 p-4 rounded-md mb-4">No userId found. Please sign in to view your quests.</div>
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
    <div className="h-full">
      <HeaderSection
        title="Quest Log"
        subtitle="Embark on epic journeys and complete tasks to earn rewards."
        imageSrc="/images/quests-header.jpg"
        defaultBgColor="bg-amber-900"
      />
      <div className="p-4 md:p-8">
        {error && <p className="text-red-500 bg-red-900/20 p-4 rounded-md mb-4">{error}</p>}
        <Tabs value={mainTab} onValueChange={v => setMainTab(v as 'quests' | 'challenges' | 'milestones')} className="space-y-4">
          <TabsList className="mb-4 w-full grid grid-cols-3">
            <TabsTrigger value="quests">Quests</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          </TabsList>

          {/* Quests Tab */}
          <TabsContent value="quests">
            <div className="mb-4">
              <label htmlFor="quest-category-select" className="sr-only">Select quest category</label>
              <select
                id="quest-category-select"
                className="w-full rounded border p-2 bg-black text-white"
                aria-label="Quest category dropdown"
                value={questCategory}
                onChange={e => setQuestCategory(e.target.value)}
              >
                {questCategories.map((category: string) => (
                  <option key={category} value={category}>{getCategoryLabel(category)}</option>
                ))}
              </select>
            </div>
            {/* Quest Streak Summary Card */}
            <div className="mb-6">
              <Card className="flex flex-col md:flex-row items-center gap-6 p-6 bg-gradient-to-r from-amber-900/80 to-yellow-900/60 border-amber-500 shadow-lg" aria-label="quest-streak-summary-card">
                <div className="flex flex-col items-center justify-center bg-black/40 rounded-2xl p-6 min-w-[120px]">
                  <Flame className="w-14 h-14 text-pink-400 drop-shadow-glow animate-pulse" aria-hidden="true" />
                  <div className="text-3xl font-extrabold text-white mt-2" aria-label="quest-streak-value">{questStreak} days</div>
                  <div className="text-base text-gray-300">Day streak</div>
                </div>
                <div className="flex-1 flex flex-col gap-2 w-full max-w-xl">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{todaysCompleted}</span>
                    <span className="text-lg text-gray-300">/ {todaysTotal} quests</span>
                  </div>
                  <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden relative">
                    <div className="h-full bg-gradient-to-r from-pink-400 to-pink-600 rounded-full transition-all duration-500" style={{ width: `${todaysTotal ? (todaysCompleted / todaysTotal) * 100 : 0}%` }} />
                  </div>
                  <div className="flex gap-2 mt-2 justify-between">
                    {paddedHistory.map((h, i) => (
                      <div key={h.date} className={`flex flex-col items-center w-8`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${h.completed ? 'bg-pink-500' : 'bg-gray-800 border border-gray-700'}`}
                          aria-label={h.completed ? `Completed on ${weekDays[i]}` : `Not completed on ${weekDays[i]}`}
                        >
                          {h.completed ? <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 10.5L9 14.5L15 7.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> : null}
                        </div>
                        <span className="text-xs text-gray-400 mt-1">{weekDays[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(questsByCategorySafe[safeQuestCategory] ?? []).map((quest: Quest) => {
                  const categoryKey: string = String(quest.category ?? '');
                  const categoryColor = Object.prototype.hasOwnProperty.call(categoryColorMap, categoryKey)
                    ? categoryColorMap[categoryKey]
                    : 'text-amber-500 border-amber-800';
                  console.log('[Quests Debug] rendering quest:', quest.name, 'completed:', quest.completed);
                  return (
                    <CardWithProgress
                      key={quest.id}
                      title={quest.name || quest.title || 'Untitled Quest'}
                      description={quest.description}
                      icon={React.createElement(getCategoryIcon(quest.category))}
                      completed={quest.completed}
                      onToggle={() => handleQuestToggle(quest.id, quest.completed)}
                      onEdit={() => handleEditQuest(quest)}
                      onDelete={() => handleDeleteQuest(quest.id)}
                      progress={quest.completed ? 100 : 5}
                      xp={quest.xp ?? 0}
                      gold={quest.gold ?? 0}
                    />
                  );
                })}
                {(questsByCategorySafe[safeQuestCategory] ?? []).length === 0 && (
                  <div className="text-center text-gray-400">No quests found for this category.</div>
                )}
                <Card className="border-2 border-dashed border-gray-700 hover:border-amber-500 transition-colors cursor-pointer flex items-center justify-center min-h-[160px]" onClick={() => setAddQuestModalOpen(true)} tabIndex={0} role="button" aria-label="add-custom-quest-card" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAddQuestModalOpen(true); } }}>
                  <div className="text-center text-gray-500">
                    <Plus className="w-8 h-8 mx-auto mb-2" />
                    <p>Add Custom Quest</p>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            <div className="mb-4">
              <label htmlFor="challenge-category-select" className="sr-only">Select workout day</label>
              <select
                id="challenge-category-select"
                className="w-full rounded border p-2 bg-black text-white"
                aria-label="Workout day dropdown"
                value={challengeCategory}
                onChange={e => setChallengeCategory(e.target.value)}
              >
                {workoutPlan.map(day => (
                  <option key={day.category} value={day.category}>{day.category}</option>
                ))}
              </select>
            </div>
            {/* Challenge Streak Summary Card (new style) */}
            <div className="mb-6">
              <Card className="flex flex-col md:flex-row items-center gap-6 p-6 bg-gradient-to-r from-amber-900/80 to-yellow-900/60 border-amber-500 shadow-lg" aria-label="challenge-streak-summary-card">
                <div className="flex flex-col items-center justify-center bg-black/40 rounded-2xl p-6 min-w-[120px]">
                  <Flame className="w-14 h-14 text-pink-400 drop-shadow-glow animate-pulse" aria-hidden="true" />
                  <div className="text-3xl font-extrabold text-white mt-2" aria-label="challenge-streak-value">{challengeStreaks[challengeCategory]?.length || 0} days</div>
                  <div className="text-base text-gray-300">Day streak</div>
                </div>
                <div className="flex-1 flex flex-col gap-2 w-full max-w-xl">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">{challenges.filter(c => c.category === challengeCategory && c.completed).length}</span>
                    <span className="text-lg text-gray-300">/ {challenges.filter(c => c.category === challengeCategory).length} challenges</span>
                  </div>
                  <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden relative">
                    <div className="h-full bg-gradient-to-r from-pink-400 to-pink-600 rounded-full transition-all duration-500" style={{ width: `${challenges.filter(c => c.category === challengeCategory).length ? (challenges.filter(c => c.category === challengeCategory && c.completed).length / challenges.filter(c => c.category === challengeCategory).length) * 100 : 0}%` }} />
                  </div>
                  {/* 7-day history for challenges (reuse questHistory logic if available, or skip for now) */}
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <div className="text-lg font-bold text-yellow-300" aria-label="streak-bonus-label">Streak Bonus:</div>
                  <div className="text-xl font-bold text-yellow-200" aria-label="streak-bonus-value">+{getStreakBonus(challengeStreaks[challengeCategory]?.length || 0)} gold/day</div>
                  <div className="text-xs text-yellow-100">(Max 50 gold/day)</div>
                  <div className="text-lg font-bold text-blue-200 mt-4" aria-label="streak-scrolls-label">Streak Scrolls:</div>
                  <div className="text-xl font-bold text-blue-100" aria-label="streak-scrolls-value">{getStreakScrollCount()}</div>
                  <div className="text-xs text-blue-100">(Use to save a missed streak)</div>
                </div>
              </Card>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {challenges.filter(c => c.category === challengeCategory).map((challenge) => {
                  // Remove streakBonus/gainGold/toast logic from here
                  return (
                    <CardWithProgress
                      key={challenge.id}
                      title={challenge.name}
                      description={challenge.description}
                      icon={React.createElement(getCategoryIcon(challenge.category))}
                      completed={challenge.completed}
                      onToggle={() => handleChallengeToggle(challenge.id, challenge.completed)}
                      progress={challenge.completed ? 100 : 5}
                      xp={challenge.xp ?? 0}
                      gold={challenge.gold ?? 0}
                    />
                  );
                })}
                {challenges.filter(c => c.category === challengeCategory).length === 0 && (
                  <div className="text-center text-gray-400">No challenges found for this category.</div>
                )}
                <Card
                  key="add-custom-challenge"
                  className="border-2 border-dashed border-gray-700 hover:border-amber-500 transition-colors cursor-pointer flex items-center justify-center min-h-[160px]"
                  onClick={() => setAddChallengeModalOpen(true)}
                  tabIndex={0}
                  role="button"
                  aria-label="add-custom-challenge-card"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAddChallengeModalOpen(true); } }}
                >
                  <div className="text-center text-gray-500">
                    <Plus className="w-8 h-8 mx-auto mb-2" />
                    <p>Add Custom Challenge</p>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones">
            <div className="mb-4">
              <label htmlFor="milestone-category-select" className="sr-only">Select milestone category</label>
              <select
                id="milestone-category-select"
                className="w-full rounded border p-2 bg-black text-white"
                aria-label="Milestone category dropdown"
                value={milestoneCategory}
                onChange={e => setMilestoneCategory(e.target.value)}
              >
                {questCategories.map((category: string) => (
                  <option key={category} value={category}>{getCategoryLabel(category)}</option>
                ))}
              </select>
            </div>
            <Milestones key={milestoneCategory} token={token} category={milestoneCategory} onUpdateProgress={handleMilestoneToggle} />
          </TabsContent>
        </Tabs>
      </div>
      {/* Edit Quest Modal (simple version) */}
      {editModalOpen && editingQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setEditModalOpen(false); setEditingQuest(null); }} />
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
              />
              <label className="block mb-2 text-sm font-medium">Description</label>
              <textarea
                className="w-full mb-4 p-2 border rounded"
                value={editingQuest.description}
                onChange={e => setEditingQuest({ ...editingQuest, description: e.target.value })}
                placeholder="Quest description"
                title="Quest description"
                aria-label="Quest description"
              />
              {/* Add more fields as needed */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => { setEditModalOpen(false); setEditingQuest(null); }}>Cancel</Button>
                <Button type="submit" variant="default">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Custom Challenge Modal */}
      {addChallengeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAddChallengeModalOpen(false)} />
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setEditCustomChallengeIdx(null); setEditCustomChallengeData(null); }} />
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
                className="w-full mb-4 p-2 border rounded"
                value={editCustomChallengeData.instructions}
                onChange={e => setEditCustomChallengeData({ ...editCustomChallengeData, instructions: e.target.value })}
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAddQuestModalOpen(false)} />
          <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Add Custom Quest</h2>
            <form onSubmit={e => { e.preventDefault(); handleAddQuestSubmit({ ...newQuest, id: Date.now().toString(), completed: false, isNew: true, category: String(newQuest.category || questCategories[0]) }); }}>
              {addQuestError && <div className="mb-4 text-red-500 bg-red-900/20 p-2 rounded">{addQuestError}</div>}
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelDeleteQuest} />
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
    </div>
  );
}