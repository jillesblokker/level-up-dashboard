"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Sword, Brain, Crown, Castle, Hammer, Heart, Plus, Trash2, Trophy, Sun, PersonStanding, Pencil } from 'lucide-react'
import { HeaderSection } from '@/components/HeaderSection'
import { useUser } from '@clerk/nextjs'
import { Milestones } from '@/components/milestones'
import { updateCharacterStats, getCharacterStats } from '@/lib/character-stats-manager'
import { toast } from '@/components/ui/use-toast'

interface Quest {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: number;
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
      { name: 'Lunges (left & right)', instructions: 'Step forward deeply, bend your back knee toward the floor, alternate legs.', setsReps: '3x10 per leg', tips: 'Don't let your front knee pass your toes.', weight: '0' },
      { name: 'Crunch', instructions: 'Lie on your back, feet flat, curl up toward your knees.', setsReps: '3x25', tips: 'Look up, roll slowly, don't pull your neck.', weight: '0' },
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

export default function QuestsPage() {
  const { user, isLoaded: isAuthLoaded } = useUser();
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
  const [challengeCategory, setChallengeCategory] = useState(workoutPlan[0].category);
  const [milestoneCategory, setMilestoneCategory] = useState(questCategories[0]);
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean[]>>({});

  useEffect(() => {
    const loadQuests = async () => {
      if (!isAuthLoaded) return;
      setLoading(true);

      if (!isGuest && userId) {
        try {
          const response = await fetch('/api/quests');
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
  }, [isAuthLoaded, userId, isGuest]);

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

  const handleQuestToggle = async (questName: string, currentCompleted: boolean) => {
    if (!userId) return;

    // Find the quest and parse rewards
    const quest = quests.find(q => q.name === questName);
    const rewards = quest && quest.rewards ? JSON.parse(quest.rewards) : { xp: 0, gold: 0 };
    const xpDelta = rewards.xp || 0;
    const goldDelta = rewards.gold || 0;

    try {
      const response = await fetch('/api/quests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questName,
          completed: !currentCompleted,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quest');
      }

      // Update local state
      setQuests(prev => prev.map(q =>
        q.name === questName ? { ...q, completed: !currentCompleted, date: new Date() } : q
      ));

      // Update character stats and fire events
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
      // Fire kingdom events for live updates
      if (!currentCompleted) {
        window.dispatchEvent(new CustomEvent('kingdom:goldGained', { detail: goldDelta }));
        window.dispatchEvent(new CustomEvent('kingdom:experienceGained', { detail: xpDelta }));
      } else {
        window.dispatchEvent(new CustomEvent('kingdom:goldGained', { detail: -goldDelta }));
        window.dispatchEvent(new CustomEvent('kingdom:experienceGained', { detail: -xpDelta }));
      }
    } catch (err) {
      setError("Failed to sync quest progress.");
      console.error(err);
    }
  };
  
  const handleChallengeComplete = (idx: number) => {
    setCompletedChallenges(prev => {
      const current = prev[challengeCategory] || Array(workoutPlan.find(day => day.category === challengeCategory)?.exercises.length || 0).fill(false);
      const updated = [...current];
      updated[idx] = !updated[idx];
      return { ...prev, [challengeCategory]: updated };
    });
  };

  if (loading) {
    return <div className="text-center p-8">Loading Quests...</div>;
  }

  const questsByCategory = quests.reduce((acc, quest) => {
    (acc[quest.category] = acc[quest.category] || []).push(quest);
    return acc;
  }, {} as Record<string, Quest[]>);

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
                {(questsByCategory[questCategory] || []).map((quest: Quest) => {
                  const rewards = quest.rewards ? JSON.parse(quest.rewards) : { xp: 0, gold: 0 };
                  const CategoryIcon = getCategoryIcon(quest.category);
                  const categoryKey: string = String(quest.category ?? '');
                  const categoryColor = Object.prototype.hasOwnProperty.call(categoryColorMap, categoryKey)
                    ? categoryColorMap[categoryKey]
                    : 'text-amber-500 border-amber-800';
                  return (
                    <Card
                      key={quest.id}
                      className={`flex flex-col border-2 ${categoryColor} ${quest.completed ? 'bg-green-900/30' : 'bg-black/30'} shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500`}
                      aria-label={`${quest.name}-quest-card`}
                      tabIndex={0}
                      role="button"
                      aria-pressed={quest.completed}
                      onClick={e => {
                        if ((e.target as HTMLElement).closest('[data-delete-button],[data-edit-button]')) return;
                        handleQuestToggle(quest.name, quest.completed);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleQuestToggle(quest.name, quest.completed);
                        }
                      }}
                    >
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full p-2 bg-black/40 border ${categoryColor}`} aria-label={`${quest.category}-icon`}>
                            <CategoryIcon className={`w-6 h-6 ${categoryColor}`} />
                          </span>
                          <CardTitle className="text-lg font-semibold text-amber-300">{quest.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 text-gray-500 hover:text-amber-500"
                            aria-label={`edit-${quest.name}-quest`}
                            data-edit-button
                            onClick={e => {
                              e.stopPropagation();
                              handleEditQuest(quest);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Checkbox
                            checked={quest.completed}
                            onCheckedChange={() => handleQuestToggle(quest.name, quest.completed)}
                            className="border-amber-400 data-[state=checked]:bg-amber-500 scale-125"
                            aria-label={`complete-${quest.name}-quest`}
                            tabIndex={-1}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <CardDescription className="mb-4 text-gray-400">
                          {quest.description}
                        </CardDescription>
                        <Progress value={quest.completed ? 100 : 5} className="w-full h-2 bg-gray-700" />
                      </CardContent>
                      <CardFooter className="flex justify-between items-center text-xs text-gray-500 pt-2">
                        <div className="flex items-center gap-2">
                          <span>XP: {rewards.xp}</span>
                          <span>Gold: {rewards.gold}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="w-6 h-6 text-gray-500 hover:text-red-500" aria-label={`delete-${quest.name}-quest`} data-delete-button>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardFooter>
                    </Card>
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
              {workoutPlan.find(day => day.category === challengeCategory)?.exercises.map((exercise, idx) => (
                <div
                  key={exercise.name}
                  className="border-2 border-amber-800 bg-black/40 rounded-lg p-4 flex flex-col gap-2 shadow-md"
                  aria-label={`challenge-card-${exercise.name}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-lg text-amber-300">{exercise.name}</div>
                    <input
                      type="checkbox"
                      aria-label={`Mark ${exercise.name} as complete`}
                      checked={completedChallenges[challengeCategory]?.[idx] || false}
                      onChange={() => handleChallengeComplete(idx)}
                      className="w-5 h-5 accent-amber-500 border-amber-400 rounded focus:ring-amber-500"
                    />
                  </div>
                  <div className="text-gray-300 text-sm">{exercise.instructions}</div>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="bg-amber-900/40 text-amber-400 px-2 py-1 rounded text-xs" aria-label="sets-reps">{exercise.setsReps}</span>
                    {exercise.weight !== '0' && (
                      <span className="bg-amber-900/40 text-amber-400 px-2 py-1 rounded text-xs" aria-label="weight">{exercise.weight}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1" aria-label="tips">{exercise.tips}</div>
                </div>
              ))}
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
    </div>
  );
}