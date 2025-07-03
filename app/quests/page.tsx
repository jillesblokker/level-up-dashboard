"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Sword, Brain, Crown, Castle, Hammer, Heart, Plus, Trash2, Trophy, Sun, PersonStanding, Pencil } from 'lucide-react'
import { HeaderSection } from '@/components/HeaderSection'
import { useUser, useAuth } from '@clerk/nextjs'
import { Milestones } from '@/components/milestones'
import { updateCharacterStats, getCharacterStats } from '@/lib/character-stats-manager'
import { toast } from '@/components/ui/use-toast'
import CardWithProgress from '@/components/quest-card'
import React from 'react'
import { useSupabaseRealtimeSync } from '@/hooks/useSupabaseRealtimeSync'
import { SignedIn, SignedOut, SignIn } from '@clerk/nextjs'

interface Quest {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  rewards: string;
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

export default function QuestsPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isClerkLoaded } = useAuth();
  const userId = user?.id;
  const isGuest = !user;

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

  useEffect(() => {
    const loadQuests = async () => {
      if (!isClerkLoaded || !isUserLoaded) return;
      setLoading(true);
      if (!isGuest && userId) {
        try {
          const token = await getToken();
          if (!token) throw new Error('No Clerk token');
          const response = await fetch(`/api/quests?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch quests');
          }
          const data: Quest[] = await response.json();
          setQuests(data);
          const uniqueCategories = [...new Set(data.map(q => q.category))];
          const combined = [...new Set([...questCategories, ...uniqueCategories])];
          setAllCategories(combined);
        } catch (err: any) {
          setError('Failed to load quest data from server.');
          console.error(err);
          setQuests([]);
        }
      } else {
        setQuests([]);
      }
      setLoading(false);
    };
    loadQuests();
  }, [isClerkLoaded, isUserLoaded, userId, isGuest, getToken]);

  // --- Supabase real-time sync for quest_completions ---
  useSupabaseRealtimeSync({
    table: 'quest_completions',
    userId,
    onChange: async () => {
      if (!isGuest && userId) {
        const token = await getToken();
        if (!token) return;
        fetch(`/api/quests?userId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(async (response) => {
          if (response.ok) {
            const data = await response.json();
            setQuests(data);
          }
        });
      }
    }
  });

  // Daily reset logic for non-milestone quests
  useEffect(() => {
    if (!loading && quests.length > 0) {
      const lastReset = localStorage.getItem('last-quest-reset-date');
      const today = new Date().toISOString().slice(0, 10);
      if (lastReset !== today) {
        // Reset all non-milestone quests
        setQuests(prev => prev.map(q =>
          q.category !== 'milestones' ? { ...q, completed: false } : q
        ));
        localStorage.setItem('last-quest-reset-date', today);
        toast({
          title: 'Daily Reset',
          description: 'Your daily quests have been reset! Time to build new habits.',
        });
      }
    }
  }, [loading, quests.length]);

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
          return 0; // missed a day
        });
      });
      return updated;
    });
  }, []);

  const handleQuestToggle = async (questId: number, currentCompleted: boolean) => {
    if (!userId) return;
    const quest = quests.find(q => Number(q.id) === questId);
    if (!quest) return;
    const rewards = quest && quest.rewards ? JSON.parse(quest.rewards) : { xp: 0, gold: 0 };
    const xpDelta = rewards.xp || 0;
    const goldDelta = rewards.gold || 0;
    try {
      const token = await getToken();
      if (!token) throw new Error('No Clerk token');
      const response = await fetch('/api/quests/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questId }),
      });
      if (!response.ok) {
        throw new Error('Failed to update quest');
      }
      setQuests(prev => prev.map(q =>
        Number(q.id) === questId ? { ...q, completed: !currentCompleted, date: new Date() } : q
      ));
      const stats = getCharacterStats();
      let newXP = stats.experience;
      let newGold = stats.gold;
      if (!currentCompleted) {
        newXP += xpDelta;
        newGold += goldDelta;
      } else {
        newXP = Math.max(0, newXP - xpDelta);
        newGold = Math.max(0, newGold - goldDelta);
      }
      updateCharacterStats({ experience: newXP, gold: newGold });
      if (!currentCompleted) {
        window.dispatchEvent(new CustomEvent('kingdom:goldGained', { detail: goldDelta }));
        window.dispatchEvent(new CustomEvent('kingdom:experienceGained', { detail: xpDelta }));
      } else {
        window.dispatchEvent(new CustomEvent('kingdom:goldGained', { detail: -goldDelta }));
        window.dispatchEvent(new CustomEvent('kingdom:experienceGained', { detail: -xpDelta }));
      }
    } catch (err) {
      setError('Failed to sync quest progress.');
      console.error(err);
    }
  };
  
  const safeChallengeCategory = typeof challengeCategory === 'string' ? challengeCategory : '';
  // Helper to guarantee prev is always a valid object
  const getSafePrev = (obj: unknown): Record<string, boolean[]> => {
    return typeof obj === 'object' && obj !== null ? (obj as Record<string, boolean[]>) : {};
  };
  const handleChallengeComplete = (idx: number) => {
    setCompletedChallenges(prevObj => {
      const prev = getSafePrev(prevObj);
      const foundDay = workoutPlan.find(day => day.category === safeChallengeCategory);
      const exercisesLength = foundDay && Array.isArray(foundDay.exercises) ? foundDay.exercises.length : 0;
      const current: boolean[] = (prev[safeChallengeCategory] ?? Array(exercisesLength).fill(false)) as boolean[];
      const updated = [...current];
      updated[idx] = !updated[idx];
      // --- Streak logic for custom challenges ---
      if (idx >= (foundDay?.exercises.length || 0)) { // custom challenge
        setChallengeStreaks(prevStreaks => {
          const arr = prevStreaks[safeChallengeCategory] ?? [];
          const streakArr = [...arr];
          const lastArr = challengeLastCompleted[safeChallengeCategory] ?? [];
          const today = new Date().toISOString().slice(0, 10);
          if (updated[idx]) { // just completed
            const last = lastArr[idx];
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            if (last === yesterday) {
              streakArr[idx] = (streakArr[idx] || 0) + 1;
            } else if (last === today) {
              // already completed today, do not increment
              streakArr[idx] = streakArr[idx] || 1;
            } else {
              streakArr[idx] = 1;
            }
          } else {
            streakArr[idx] = 0;
          }
          return { ...prevStreaks, [safeChallengeCategory]: streakArr };
        });
        setChallengeLastCompleted(prevLast => {
          const arr = prevLast[safeChallengeCategory] ?? [];
          const lastArr = [...arr];
          if (updated[idx]) {
            lastArr[idx] = new Date().toISOString().slice(0, 10);
          } else {
            lastArr[idx] = '';
          }
          return { ...prevLast, [safeChallengeCategory]: lastArr };
        });
      }
      return { ...prev, [safeChallengeCategory]: updated };
    });
  };

  const handleAddCustomChallenge = () => {
    setCustomChallenges(prev => {
      const prevArr = prev[challengeCategory] ?? [];
      return {
        ...prev,
        [challengeCategory]: [...prevArr, { ...newChallenge }],
      };
    });
    setAddChallengeModalOpen(false);
    setNewChallenge({ name: '', instructions: '', setsReps: '', tips: '', weight: '' });
  };

  // Edit handler for custom challenges
  const handleEditCustomChallenge = (idx: number) => {
    if (!customChallenges[challengeCategory] || !customChallenges[challengeCategory][idx]) return;
    setEditCustomChallengeIdx(idx);
    setEditCustomChallengeData({ ...customChallenges[challengeCategory][idx] });
  };
  const handleEditCustomChallengeSubmit = () => {
    if (editCustomChallengeIdx === null || !editCustomChallengeData) return;
    setCustomChallenges(prev => {
      const arr = [...(prev[challengeCategory] ?? [])];
      arr[editCustomChallengeIdx] = { ...editCustomChallengeData };
      return { ...prev, [challengeCategory]: arr };
    });
    setEditCustomChallengeIdx(null);
    setEditCustomChallengeData(null);
  };
  const handleDeleteCustomChallenge = (idx: number) => {
    setCustomChallenges(prev => {
      const arr = [...(prev[challengeCategory] ?? [])];
      arr.splice(idx, 1);
      // Remove streak and last-completed for this challenge
      setChallengeStreaks(streaksPrev => {
        const arr2 = [...(streaksPrev[challengeCategory] ?? [])];
        arr2.splice(idx, 1);
        return { ...streaksPrev, [challengeCategory]: arr2 };
      });
      setChallengeLastCompleted(lastPrev => {
        const arr2 = [...(lastPrev[challengeCategory] ?? [])];
        arr2.splice(idx, 1);
        return { ...lastPrev, [challengeCategory]: arr2 };
      });
      return { ...prev, [challengeCategory]: arr };
    });
  };

  if (!isClerkLoaded || !isUserLoaded) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">Quests</h1>
        <div>Loading Clerk...</div>
      </main>
    );
  }

  const questsByCategory = quests.reduce((acc, quest) => {
    const safeQuestCategory = typeof quest.category === 'string' ? quest.category : '';
    (acc[safeQuestCategory] = acc[safeQuestCategory] || []).push(quest);
    return acc;
  }, {} as Record<string, Quest[]>);

  const questsByCategorySafe = typeof questsByCategory === 'object' && questsByCategory !== null ? questsByCategory : {};

  const getCategoryIcon = (category: string) => {
    return categoryIcons[category as keyof typeof categoryIcons] || Trophy;
  }

  const getCategoryLabel = (category: string) => {
    return categoryLabels[category as keyof typeof categoryLabels] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  // Handler to open the edit modal with quest data
  const handleEditQuest = (quest: Quest) => {
    setEditingQuest(quest);
    setEditModalOpen(true);
  };

  // Handler to close the modal
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingQuest(null);
  };

  // Handler to submit the edited quest (for now, just closes the modal)
  const handleEditQuestSubmit = (updatedQuest: Quest) => {
    // TODO: Implement update logic (API call, state update)
    setEditModalOpen(false);
    setEditingQuest(null);
  };

  const safeQuestCategory = typeof questCategory === 'string' ? questCategory : '';

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
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(questsByCategorySafe[safeQuestCategory] ?? []).map((quest: Quest) => {
                  const rewards = quest.rewards ? JSON.parse(quest.rewards) : { xp: 0, gold: 0 };
                  const categoryKey: string = String(quest.category ?? '');
                  const categoryColor = Object.prototype.hasOwnProperty.call(categoryColorMap, categoryKey)
                    ? categoryColorMap[categoryKey]
                    : 'text-amber-500 border-amber-800';
                  return (
                    <CardWithProgress
                      key={quest.id}
                      title={quest.name}
                      description={quest.description}
                      icon={React.createElement(getCategoryIcon(quest.category))}
                      completed={quest.completed}
                      onToggle={() => handleQuestToggle(Number(quest.id), quest.completed)}
                      onEdit={() => handleEditQuest(quest)}
                      onDelete={() => handleQuestToggle(Number(quest.id), quest.completed)}
                      progress={quest.completed ? 100 : 5}
                      xp={rewards.xp}
                      gold={rewards.gold}
                    />
                  );
                })}
                <Card className="border-2 border-dashed border-gray-700 hover:border-amber-500 transition-colors cursor-pointer flex items-center justify-center min-h-[160px]">
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
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* Render built-in and custom challenges */}
                {(() => {
                  const builtIn = workoutPlan.find(day => day.category === challengeCategory)?.exercises ?? [];
                  const custom = customChallenges[challengeCategory] ?? [];
                  if (builtIn.length + custom.length === 0) {
                    return (
                      <Card
                        key="start-your-first-challenge"
                        className="border-2 border-dashed border-amber-500 bg-black/40 flex items-center justify-center min-h-[160px] focus:ring-2 focus:ring-amber-500 cursor-pointer"
                        tabIndex={0}
                        role="button"
                        aria-label="start-your-first-challenge-cta"
                        onClick={() => setAddChallengeModalOpen(true)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAddChallengeModalOpen(true); } }}
                      >
                        <div className="text-center text-amber-400">
                          <Plus className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-lg font-semibold">Start your first challenge</p>
                          <p className="text-sm text-amber-200 mt-1">Add a custom challenge to begin your streak!</p>
                        </div>
                      </Card>
                    );
                  }
                  return React.Children.toArray([
                    ...builtIn.map((exercise, idx) => {
                      const cardProps: any = {
                        title: exercise.name,
                        description: exercise.instructions,
                        icon: React.createElement(getCategoryIcon(safeChallengeCategory)),
                        completed: completedChallenges[safeChallengeCategory]?.[idx] || false,
                        onToggle: () => handleChallengeComplete(idx),
                        progress: completedChallenges[safeChallengeCategory]?.[idx] ? 100 : 5,
                        xp: 0,
                        gold: 0,
                        streak: 0,
                      };
                      return <CardWithProgress key={exercise.name + idx} {...cardProps} />;
                    }),
                    ...custom.map((exercise, idx) => {
                      const builtInLength = builtIn.length;
                      const cardProps: any = {
                        title: exercise.name,
                        description: exercise.instructions,
                        icon: React.createElement(getCategoryIcon(safeChallengeCategory)),
                        completed: completedChallenges[safeChallengeCategory]?.[idx + builtInLength] || false,
                        onToggle: () => handleChallengeComplete(idx + builtInLength),
                        progress: completedChallenges[safeChallengeCategory]?.[idx + builtInLength] ? 100 : 5,
                        xp: 0,
                        gold: 0,
                        streak: challengeStreaks[challengeCategory]?.[idx + builtInLength] || 0,
                        onEdit: () => handleEditCustomChallenge(idx),
                        onDelete: () => handleDeleteCustomChallenge(idx),
                      };
                      return <CardWithProgress key={exercise.name + (idx + builtInLength)} {...cardProps} />;
                    })
                  ]);
                })()}
                {/* Add Custom Challenge Card */}
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
            <Milestones key={milestoneCategory} />
          </TabsContent>
        </Tabs>
      </div>
      {/* Edit Quest Modal (simple version) */}
      {editModalOpen && editingQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseEditModal} />
          <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Edit Quest</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                // For now, just close the modal
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
                <Button type="button" variant="secondary" onClick={handleCloseEditModal}>Cancel</Button>
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
              onSubmit={e => { e.preventDefault(); handleAddCustomChallenge(); }}
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
              onSubmit={e => { e.preventDefault(); handleEditCustomChallengeSubmit(); }}
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
    </div>
  );
}