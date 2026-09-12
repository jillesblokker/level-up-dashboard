"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Flame, Shield, Tent, Heart, CheckCircle2, RefreshCw, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { addToCharacterStat } from '@/lib/character-stats-service';
import { HabitStoneMonumentModal } from '@/components/kingdom/habit-stone-monument-modal';

interface StreaksHubTabProps {
  currentStreak: number;
  longestStreak?: number;
  userId?: string | undefined;
  token?: string | null | undefined;
}

interface MercyQuest {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
}

const DEFAULT_MERCY_QUESTS: MercyQuest[] = [
  {
    id: 'mercy-1',
    title: 'Herbal hydration',
    description: 'Drink a tall glass of fresh water or calming herbal tea.',
    icon: '🍵',
    completed: false
  },
  {
    id: 'mercy-2',
    title: 'Mindful stroll',
    description: 'Take 5–10 minutes of gentle, device-free movement or stretching.',
    icon: '🌿',
    completed: false
  },
  {
    id: 'mercy-3',
    title: 'Honest chronicle reflection',
    description: 'Acknowledge life’s pause: write one sentence in your journal.',
    icon: '📜',
    completed: false
  }
];

export function StreaksHubTab({ currentStreak, longestStreak = 0, userId, token }: StreaksHubTabProps) {
  const { toast } = useToast();
  
  // Campfire Guard (Vacation Mode) State
  const [campfireActive, setCampfireActive] = useState(false);
  const [campfireDays, setCampfireDays] = useState(7);
  const [campfireUntil, setCampfireUntil] = useState<string | null>(null);
  const [monumentModalOpen, setMonumentModalOpen] = useState(false);

  // Mercy Quests State
  const [mercyQuests, setMercyQuests] = useState<MercyQuest[]>(DEFAULT_MERCY_QUESTS);
  const [isRepairing, setIsRepairing] = useState(false);

  // Load Campfire Guard and Mercy state from storage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load Campfire Guard
    const storedCampfire = localStorage.getItem('thrivehaven_campfire_guard');
    if (storedCampfire) {
      try {
        const parsed = JSON.parse(storedCampfire);
        if (new Date(parsed.until) > new Date()) {
          setCampfireActive(true);
          setCampfireUntil(parsed.until);
        } else {
          localStorage.removeItem('thrivehaven_campfire_guard');
          setCampfireActive(false);
        }
      } catch {}
    }

    // Load Mercy Quests
    const today = new Date().toDateString();
    const storedMercy = localStorage.getItem(`thrivehaven_mercy_quests_${today}`);
    if (storedMercy) {
      try {
        setMercyQuests(JSON.parse(storedMercy));
      } catch {}
    }
  }, []);

  // Handle Campfire Guard Toggle
  const handleToggleCampfire = (checked: boolean) => {
    if (checked) {
      const untilDate = new Date();
      untilDate.setDate(untilDate.getDate() + campfireDays);
      const isoStr = untilDate.toISOString();

      localStorage.setItem('thrivehaven_campfire_guard', JSON.stringify({
        active: true,
        days: campfireDays,
        until: isoStr,
        activatedAt: new Date().toISOString()
      }));

      setCampfireActive(true);
      setCampfireUntil(isoStr);

      const durationText = campfireDays >= 60 ? '2 months' : campfireDays >= 30 ? '1 month' : `${campfireDays} days`;
      toast({
        title: "Campfire guard lit! 🏕️",
        description: `Your streak is safely paused for ${durationText}. Citizens will tend the hearth while you rest.`,
      });
    } else {
      localStorage.removeItem('thrivehaven_campfire_guard');
      setCampfireActive(false);
      setCampfireUntil(null);

      toast({
        title: "Campfire guard extinguished",
        description: "Welcome back, King! Daily habit tracking has resumed.",
      });
    }
  };

  // Toggle Mercy Quest Completion
  const handleToggleMercyQuest = (id: string) => {
    const today = new Date().toDateString();
    const updated = mercyQuests.map(q => q.id === id ? { ...q, completed: !q.completed } : q);
    setMercyQuests(updated);
    localStorage.setItem(`thrivehaven_mercy_quests_${today}`, JSON.stringify(updated));

    const clicked = updated.find(q => q.id === id);
    if (clicked?.completed) {
      toast({
        title: `${clicked.title} completed! ✨`,
        description: "Mercy restorative step recorded.",
      });
    }
  };

  // Complete Streak Repair via Mercy Quests
  const handleCompleteMercyRepair = async () => {
    setIsRepairing(true);
    try {
      // Call streak repair endpoint if available, or update local streak state
      try {
        await fetch('/api/streaks/recovery', { method: 'POST' });
      } catch {}

      await addToCharacterStat('gold', 50, 'mercy-streak-recovery');
      
      toast({
        title: "Streak healed! 🔥",
        description: "Your mercy rituals re-kindled the sacred flame! Streak restored.",
      });

      // Clear completed mercy quests
      const today = new Date().toDateString();
      const reset = DEFAULT_MERCY_QUESTS.map(q => ({ ...q, completed: false }));
      setMercyQuests(reset);
      localStorage.setItem(`thrivehaven_mercy_quests_${today}`, JSON.stringify(reset));

      window.dispatchEvent(new Event('character-stats-update'));
    } catch {
      toast({
        title: "Repair error",
        description: "Could not finalize streak healing.",
        variant: "destructive"
      });
    } finally {
      setIsRepairing(false);
    }
  };

  const allMercyDone = mercyQuests.every(q => q.completed);
  const effectiveRecord = Math.max(longestStreak, currentStreak);

  // Flame Tier title
  const getFlameTier = (streak: number) => {
    if (streak >= 66) return { title: 'Eternal pyre', badge: 'Tier IV', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/40' };
    if (streak >= 21) return { title: 'Citadel bonfire', badge: 'Tier III', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/40' };
    if (streak >= 7) return { title: 'Campfire blaze', badge: 'Tier II', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/40' };
    return { title: 'Kindled ember', badge: 'Tier I', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40' };
  };

  const flameTier = getFlameTier(currentStreak);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Hero Streak Status Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-950/60 via-zinc-950 to-orange-950/50 border border-amber-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-amber-500/20 to-orange-950/80 border-2 border-amber-500/50 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(245,158,11,0.3)] shrink-0 animate-pulse">
              🔥
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-medieval font-bold text-amber-300">
                  {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                </span>
                <Badge className={`${flameTier.bg} ${flameTier.color} text-[10px] font-mono tracking-wider font-bold`}>
                  {flameTier.title} ({flameTier.badge})
                </Badge>
              </div>
              <p className="text-xs text-zinc-300 font-serif mt-1 flex items-center gap-2">
                <span>Longest record: <strong className="text-amber-400">{effectiveRecord} days</strong></span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">Mastery monument unlocks at 66 days</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              onClick={() => setMonumentModalOpen(true)}
              size="sm"
              className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 text-xs font-serif shadow-md"
            >
              🗿 View stone monuments
            </Button>
            <div className="px-3 py-2 rounded-xl bg-zinc-950/80 border border-amber-500/30 text-right">
              <span className="text-[10px] text-zinc-400 block uppercase font-mono">Streak status</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {campfireActive ? 'Campfire guard active' : 'Active & blazing'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Habit Stone Monument Modal */}
      <HabitStoneMonumentModal
        isOpen={monumentModalOpen}
        onClose={() => setMonumentModalOpen(false)}
      />

      {/* 2. Campfire Guard (Vacation Mode) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/90 border border-amber-900/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-amber-900/20">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
              🏕️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-serif font-bold text-amber-200">
                  Campfire guard (vacation pause)
                </h3>
                {campfireActive && (
                  <Badge className="bg-emerald-950 border-emerald-500/50 text-emerald-300 text-[10px]">
                    Shield active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mt-0.5 max-w-xl">
                Visiting the outer realms, ill, or taking a restorative break? Light the campfire guard to safely pause all habit streak decay without penalty. Your citizens tend the kingdom hearth while you rest.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <span className="text-xs font-serif text-zinc-300">
              {campfireActive ? 'Extinguish' : 'Light campfire'}
            </span>
            <Switch
              checked={campfireActive}
              onCheckedChange={handleToggleCampfire}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
        </div>

        {campfireActive ? (
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Campfire guard is protecting your streak until{' '}
              <strong className="text-amber-300">
                {campfireUntil ? new Date(campfireUntil).toLocaleDateString() : 'end of vacation'}
              </strong>
              . Complete habits whenever you wish to resume normally.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-serif">
            <span>Pause duration when lit:</span>
            {[
              { days: 3, label: '3 days' },
              { days: 7, label: '7 days' },
              { days: 14, label: '14 days' },
              { days: 30, label: '1 month' },
              { days: 60, label: '2 months' },
            ].map(opt => (
              <button
                key={opt.days}
                onClick={() => setCampfireDays(opt.days)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                  campfireDays === opt.days
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Mercy Quests (In-Theme Streak Repair Engine) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/90 border border-amber-900/40 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-center text-xl shrink-0">
              ❤️‍🩹
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-serif font-bold text-amber-200 flex items-center gap-2">
                Mercy quests (streak healing)
              </h3>
              <p className="text-xs text-zinc-400">
                Missed a day? No punitive penalties. Complete these 3 gentle restorative rituals to heal your streak flame.
              </p>
            </div>
          </div>

          <Badge className="bg-amber-950/60 border-amber-500/30 text-amber-300 text-[10px] font-mono">
            {mercyQuests.filter(q => q.completed).length}/3 completed
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {mercyQuests.map((quest) => (
            <button
              key={quest.id}
              onClick={() => handleToggleMercyQuest(quest.id)}
              className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                quest.completed
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200 shadow-sm'
                  : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-amber-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{quest.icon}</span>
                {quest.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-zinc-600" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold font-serif text-amber-200">
                  {quest.title}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  {quest.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-zinc-400 italic">
            {allMercyDone
              ? "All 3 rituals fulfilled! Ready to re-kindle the flame."
              : "Complete all 3 restorative steps to unlock streak healing."}
          </span>
          <Button
            onClick={handleCompleteMercyRepair}
            disabled={!allMercyDone || isRepairing}
            className={`w-full sm:w-auto font-serif text-xs font-bold py-2 px-5 rounded-xl border transition-all ${
              allMercyDone
                ? 'bg-amber-600 hover:bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-950/50'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
          >
            {isRepairing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <Flame className="w-3.5 h-3.5 mr-1.5" />
            )}
            Re-kindle streak
          </Button>
        </div>
      </div>
    </div>
  );
}
