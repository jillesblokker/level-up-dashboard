"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback } from "react"
import { Sparkles, Gift, ShieldAlert, Award, RefreshCw, Star, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { getUserPreference, setUserPreference } from "@/lib/user-preferences-manager";

interface Quest {
  id: string
  name: string
  description: string
  category: string
  completed: boolean
}

interface HabitGuardianProps {
  favoritedQuests: Quest[]
}

interface GuardianState {
  selectedId: string;
  level: number;
  experience: number;
  lastBountyClaimedAt: string | null;
}

const GUARDIANS = [
  {
    id: 'ember-drake',
    name: 'Ember Drake',
    emoji: '🐉',
    description: 'A fierce baby dragon that feeds on the fire of your might and craft habits.',
    focus: 'Might & Craft',
    focusCategories: ['might', 'agility'],
    themeColor: 'from-orange-500/20 to-red-500/25 border-orange-500/30 text-orange-400',
    perkIcon: '🔥',
    lines: [
      "Rrarr! Your daily momentum stokes the furnace of our town. We cleared the rubble of the north tower!",
      "I want to see the fire of your strength habits rebuild our castle walls!",
      "Temple fires burn bright when you complete your daily habits!",
      "Mmm, victory smells like fresh iron and clean stone in Thrivehaven!",
      "Rawr! Keep going, our kingdom's fire grows stronger every day!"
    ]
  },
  {
    id: 'sage-owl',
    name: 'Sage Owl',
    emoji: '🦉',
    description: 'A wise scholar owl that thrives on reading, studying, and honoring others.',
    focus: 'Knowledge & Honor',
    focusCategories: ['knowledge', 'intelligence'],
    themeColor: 'from-cyan-500/20 to-blue-500/25 border-cyan-500/30 text-cyan-400',
    perkIcon: '📖',
    lines: [
      "Hoot! Knowledge is the strength of our town. The library shines anew!",
      "A focused mind repairs what was lost. I record your daily progress!",
      "Have you studied your books and finished your routines today?",
      "Wisdom lies not in thinking, but in daily action.",
      "With every habit finished, ancient secrets return to Thrivehaven!"
    ]
  },
  {
    id: 'spirit-sprite',
    name: 'Spirit Sprite',
    emoji: '🧚',
    description: 'A playful forest sprite fueled by nature, castle building, and vitality.',
    focus: 'Vitality & Castle',
    focusCategories: ['vitality', 'spiritual', 'wellness'],
    themeColor: 'from-emerald-500/20 to-green-500/25 border-emerald-500/30 text-emerald-400',
    perkIcon: '🌿',
    lines: [
      "Sparkle sparkle! Nature blooms as you finish your habits!",
      "Take a deep breath. You dusted off the dungeon floor and fixed up the town!",
      "Let's make today full of life and clean energy!",
      "Every step you take brings green trees back to our woodlands!",
      "Wheee! Your daily momentum keeps Thrivehaven bright and alive!"
    ]
  }
];

export function HabitGuardian({ favoritedQuests }: HabitGuardianProps) {
  const [guardianState, setGuardianState] = useState<GuardianState | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [speechBubble, setSpeechBubble] = useState("");
  const [isCollecting, setIsCollecting] = useState(false);

  const activeGuardian = GUARDIANS.find(g => g.id === guardianState?.selectedId);

  const loadState = useCallback(async () => {
    try {
      const state = await getUserPreference('habit_guardian_state') as any;
      if (state && state.selectedId) {
        setGuardianState(state);
      } else {
        setGuardianState(null);
      }
    } catch (err) {
      logger.error('[Guardian] Load state failed:', err);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // Set up speech lines cycle
  useEffect(() => {
    if (!activeGuardian) return;
    const updateSpeech = () => {
      const randomLine = activeGuardian.lines[Math.floor(Math.random() * activeGuardian.lines.length)]!;
      setSpeechBubble(randomLine);
    };
    updateSpeech();
    const interval = setInterval(updateSpeech, 15000);
    return () => clearInterval(interval);
  }, [activeGuardian]);

  const selectGuardian = async (id: string) => {
    try {
      const newState: GuardianState = {
        selectedId: id,
        level: 1,
        experience: 0,
        lastBountyClaimedAt: null
      };
      await setUserPreference('habit_guardian_state', newState);
      setGuardianState(newState);
      setShowPicker(false);
      toast({
        title: "Companion Summoned! ✨",
        description: `Your new Habit Guardian has arrived in the Daily Hub.`
      });
    } catch (err) {
      toast({
        title: "Summon failed",
        description: "Failed to save guardian companion.",
        variant: "destructive"
      });
    }
  };

  const claimBounty = async () => {
    if (!guardianState || isCollecting) return;

    const todayStr = new Date().toDateString();
    if (guardianState.lastBountyClaimedAt === todayStr) {
      toast({
        title: "Bounty Claimed",
        description: "Your Guardian already gave you their bounty today. Return tomorrow!",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCollecting(true);
      const petLevel = guardianState.level || 1;
      
      // Scale bounty gold with pet level: 50 base + 10 per level
      const bountyGold = 50 + (petLevel * 10);
      await fetch('/api/character-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gold: bountyGold })
      });

      // Scale reagent count: 1 base, +1 at level 5, +1 at level 10
      const reagentCount = 1 + (petLevel >= 5 ? 1 : 0) + (petLevel >= 10 ? 1 : 0);
      const reagents = ['material-steel', 'material-crystal', 'material-planks', 'material-water', 'material-stone', 'material-gold', 'material-silver'];
      for (let i = 0; i < reagentCount; i++) {
        const reward = reagents[Math.floor(Math.random() * reagents.length)]!;
        await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: { id: reward, quantity: 1 } })
        });
      }

      // Update state in database
      const updatedState = {
        ...guardianState,
        lastBountyClaimedAt: todayStr
      };
      await setUserPreference('habit_guardian_state', updatedState);
      setGuardianState(updatedState);

      toast({
        title: "Guardian Bounty Claimed! 🪙🎁",
        description: `Your Lvl ${petLevel} Guardian rewarded ${bountyGold} Gold and ${reagentCount} crafting reagent${reagentCount > 1 ? 's' : ''}!`
      });

      window.dispatchEvent(new Event('character-stats-update'));
      window.dispatchEvent(new Event('character-inventory-update'));
    } catch (err) {
      toast({
        title: "Claim failed",
        description: "Failed to claim Guardian Bounty.",
        variant: "destructive"
      });
    } finally {
      setIsCollecting(false);
    }
  };

  // Check if all favorited habits are completed
  const allHabitsCompleted = favoritedQuests.length > 0 && favoritedQuests.every(q => q.completed);
  const todayStr = new Date().toDateString();
  const bountyClaimedToday = guardianState?.lastBountyClaimedAt === todayStr;

  return (
    <Card className="bg-[#0f1115] border border-amber-950/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

      {!guardianState ? (
        /* Invitation / First selection State */
        <div className="space-y-5 animate-in fade-in duration-500 text-center py-6">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-950/20 border border-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h3 className="font-cardo font-bold text-white text-base">Summon your Habit Guardian</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-2 leading-relaxed">
              Unlock a loyal companion that lives in your Daily Hub, reacts as you complete tasks, levels up alongside you, and awards daily treasure chests!
            </p>
          </div>
          <Button
            onClick={() => setShowPicker(true)}
            className="px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-extrabold rounded-xl uppercase tracking-wider hover:brightness-110"
          >
            Choose a Guardian
          </Button>

          {showPicker && (
            /* Picker Selection Modal Inner Content */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
              {GUARDIANS.map(g => (
                <div
                  key={g.id}
                  onClick={() => selectGuardian(g.id)}
                  className="p-4 rounded-2xl bg-zinc-950 border border-white/5 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col items-center text-center space-y-2.5"
                >
                  <span className="text-4xl animate-bounce" style={{ animationDuration: '3s' }}>{g.emoji}</span>
                  <div>
                    <h4 className="font-bold text-white text-sm">{g.name}</h4>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-500 block mt-0.5">{g.focus} focus</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-normal">{g.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Active Guardian Panel */
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 animate-in fade-in duration-500">
          
          {/* Avatar and speech area */}
          <div className="flex flex-col items-center space-y-3 shrink-0 relative">
            <div className="text-6xl select-none animate-bounce relative cursor-pointer" style={{ animationDuration: '4s' }} title="Click to speak">
              {activeGuardian?.emoji}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPicker(true)}
              className="text-[9px] font-extrabold text-zinc-500 hover:text-amber-500 uppercase tracking-widest"
            >
              Switch Pet
            </Button>
          </div>

          {/* Interactive details */}
          <div className="flex-1 w-full space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="font-cardo font-bold text-lg text-white flex items-center gap-2">
                  {activeGuardian?.name}
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
                    Lvl {guardianState.level}
                  </span>
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                  Focus: {activeGuardian?.focus}
                </p>
              </div>

              {/* Speech Bubble */}
              {speechBubble && (
                <div className="relative bg-zinc-950 border border-amber-900/30 rounded-2xl px-3 py-2 text-xs text-zinc-300 font-serif italic max-w-sm mt-3 sm:mt-0 animate-in fade-in zoom-in duration-500 shadow-md">
                  <div className="absolute left-4 -bottom-1.5 w-3 h-3 bg-zinc-950 border-r border-b border-amber-900/30 transform rotate-45 hidden sm:block" />
                  &ldquo;{speechBubble}&rdquo;
                </div>
              )}
            </div>

            {/* Level and XP */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-zinc-500">
                <span>Guardian Experience</span>
                <span className="text-amber-500">{guardianState.experience} / {guardianState.level * 100} XP</span>
              </div>
              <Progress value={(guardianState.experience / (guardianState.level * 100)) * 100} className="h-2 bg-zinc-950 border border-white/5" indicatorClassName="bg-gradient-to-r from-amber-600 to-amber-400" />
            </div>

            {/* Guardian Level Perk */}
            {activeGuardian && guardianState.level >= 1 && (
              <div className="p-3 bg-gradient-to-r from-amber-950/20 to-transparent border border-amber-500/10 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-lg">
                  {activeGuardian.perkIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-[10px] uppercase tracking-wider text-amber-500">Guardian Perk — Level {guardianState.level}</h5>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    +{guardianState.level}% XP on <span className="font-bold text-white">{activeGuardian.focus}</span> quests
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Bounty: {50 + (guardianState.level * 10)}g + {1 + (guardianState.level >= 5 ? 1 : 0) + (guardianState.level >= 10 ? 1 : 0)} reagent{(1 + (guardianState.level >= 5 ? 1 : 0) + (guardianState.level >= 10 ? 1 : 0)) > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Daily bounty chest */}
            <div className="flex items-center justify-between bg-zinc-950/60 p-3.5 rounded-2xl border border-white/5">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-500">Daily Guardian Reward</span>
                <h4 className="font-bold text-white text-xs">Guardian&apos;s Bounty</h4>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  {bountyClaimedToday 
                    ? "Bounty claimed for today! Return tomorrow."
                    : allHabitsCompleted
                      ? "Bounty unlocked! Open the chest to retrieve your loot."
                      : "Complete all favorited daily habits to unlock."}
                </p>
              </div>
              <Button
                disabled={!allHabitsCompleted || bountyClaimedToday || isCollecting}
                onClick={claimBounty}
                className={`p-3 w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
                  bountyClaimedToday
                    ? "bg-zinc-950 border-zinc-900 text-zinc-700 cursor-not-allowed"
                    : allHabitsCompleted
                      ? "bg-amber-600 hover:bg-amber-700 border-amber-500 text-black shadow-lg hover:shadow-amber-500/50 animate-bounce"
                      : "bg-zinc-900/40 border-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
                style={{ animationDuration: '2s' }}
              >
                <Gift className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Setup Modal selection list overlay */}
          {showPicker && (
            <div className="absolute inset-0 bg-[#0f1115] p-6 z-20 flex flex-col justify-center animate-in fade-in duration-300">
              <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-4">
                <h4 className="font-cardo font-bold text-white text-sm">Choose Your Companion</h4>
                <Button variant="ghost" size="sm" onClick={() => setShowPicker(false)} className="text-xs text-zinc-500 font-bold">
                  Close
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {GUARDIANS.map(g => (
                  <div
                    key={g.id}
                    onClick={() => selectGuardian(g.id)}
                    className="p-4 rounded-2xl bg-zinc-950 border border-white/5 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col items-center text-center space-y-2.5"
                  >
                    <span className="text-4xl animate-bounce" style={{ animationDuration: '3s' }}>{g.emoji}</span>
                    <div>
                      <h5 className="font-bold text-white text-xs">{g.name}</h5>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-500 block mt-0.5">{g.focus} focus</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-normal">{g.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </Card>
  );
}
