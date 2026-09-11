"use client"

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, ScrollText, CheckSquare, Gift, ArrowRight, Flame, Shield, Sun } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { addToCharacterStat } from '@/lib/character-stats-service';
import { getUserScopedItem } from "@/lib/user-scoped-storage";

interface DailyRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  yesterdayStats?: {
    questsCompleted: number;
    streak: number;
    goldEarned: number;
    xpEarned?: number | undefined;
    milestonesUnlocked?: number | undefined;
    archetype?: string | undefined;
  } | undefined;
  loreSummary?: string | undefined;
  activePartnerName?: string | undefined;
  activePartnerBond?: number | undefined;
  citizensReadyCount?: number | undefined;
}

const MORNING_CHRONICLE_FALLBACKS = [
  "Leaf peeks through the morning dew: Yesterday was peaceful across the meadows. All our creatures slept soundly.",
  "Leaf flutters through the sunrise mist: The eastern bell chimed softly as morning light painted the stone ramparts gold.",
  "Leaf dances in a gentle breeze: The town fountain sparkled under dawn rays. Yesterday's momentum echoed through the valley.",
  "Leaf nestles by the herb garden: Fragrant lavender and mint filled the waking air. The kingdom awakens fresh and renewed.",
  "Leaf gazes across the peaceful square: Quiet watchmen exchanged morning salutes as tavern hearth fires rekindled.",
  "Leaf glides over the starlight pond: Shimmering ripples mirror the clearing skies. A new chapter unfolds today.",
  "Leaf perches on the old watchstone: Dewdrops cling to the ivy vines. The morning air is crisp, calm, and full of possibility."
];

const DIVERO_TARGET_QUOTES = [
  "Divero surfaces with a cool splash: \"Aim for at least 5 habits today to find your flow, 10 for awesome speed, and 15+ for peak form!\"",
  "Divero ripples across the fountain: \"Every big waterfall begins with five clear drops. Knock out 5 habits today to build real momentum!\"",
  "Divero leaps gracefully: \"Consistency is your greatest spell. Hit 5 habits for solid progress, or push to 10 to surge ahead!\"",
  "Divero glides through morning waters: \"Start with the low-hanging fruit. 5 habits unlock your focus, 10 make you unstoppable!\"",
  "Divero blows gentle silver bubbles: \"Steady rhythm beats hasty bursts. Target 5 habits today and watch your kingdom flourish!\"",
  "Divero smiles through the spray: \"Keep the daily chain unbroken! 5 habits keeps your streak blazing, 10 sets a personal best!\"",
  "Divero bobs happily in the sun: \"Take a deep breath and jump in. Complete 5 habits today to earn your daily laurels!\""
];

const ROCKIE_REPORTS = [
  "Rockie grunts happily: citizens are out gathering sturdy timber and granite blocks across the settlement.",
  "Rockie nods with satisfaction: quarry crews have their chisels sharp and ready for today's expansion.",
  "Rockie taps his stone hammer: the workshops are buzzing with fresh charcoal and eager craftsmen.",
  "Rockie scans the ramparts: the masonry holds rock-solid. Citizens are clearing stones along the trade route.",
  "Rockie chuckles warmly: the town square is sweeping clean. Everyone is gearing up for a productive day.",
  "Rockie stretches his rocky shoulders: another solid foundation laid. The kingdom builds higher stone by stone.",
  "Rockie gives a thumbs up: morning deliveries arrived smoothly at the granary and the market stalls."
];

export function DailyRoutineModal({
  isOpen,
  onClose,
  yesterdayStats: propStats,
  loreSummary,
  activePartnerName,
  activePartnerBond,
  citizensReadyCount = 0,
}: DailyRoutineModalProps) {
  const dayIndex = typeof window !== 'undefined' ? new Date().getDay() : 0;
  const morningFallback = MORNING_CHRONICLE_FALLBACKS[dayIndex % MORNING_CHRONICLE_FALLBACKS.length]!;
  const diveroQuote = DIVERO_TARGET_QUOTES[dayIndex % DIVERO_TARGET_QUOTES.length]!;
  const rockieReport = ROCKIE_REPORTS[dayIndex % ROCKIE_REPORTS.length]!;

  const [cachedStats] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = getUserScopedItem('yesterday-activity-summary');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return null;
  });

  const yesterdayStats = propStats || cachedStats || { questsCompleted: 5, streak: 7, goldEarned: 120, xpEarned: 1205, milestonesUnlocked: 0 };
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [claimed, setClaimed] = useState(false);

  const handleNext = () => {
    if (step < 2) {
      setStep(2);
    } else {
      handleFinalize();
    }
  };

  const handleModalClose = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('global-sync-tick'));
      window.dispatchEvent(new Event('character-stats-update'));
      window.dispatchEvent(new Event('quest-added'));
    }
    onClose();
  };

  const handleFinalize = async () => {
    try {
      // Award daily routine completion gift
      await addToCharacterStat('gold', 25, 'daily-routine');
      toast({
        title: "Daily Opening Sequence Complete! ☀️",
        description: "Focus locked! +25 Gold awarded.",
      });
      setClaimed(true);
      setTimeout(() => {
        handleModalClose();
      }, 800);
    } catch {
      handleModalClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(op) => { if (!op) handleModalClose(); }}>
      <DialogContent className="max-w-md w-full bg-gradient-to-b from-amber-950 via-zinc-950 to-zinc-950 border border-amber-500/40 text-amber-100 p-5 sm:p-6 rounded-2xl shadow-2xl overflow-hidden font-serif max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Daily opening ritual</DialogTitle>
          <DialogDescription>Daily habit focus and opening routine</DialogDescription>
        </DialogHeader>

        {/* Header & Step Indicator with pr-10 so Close X never overlaps text */}
        <div className="flex items-center justify-between pb-3 pr-10 border-b border-amber-900/30 text-xs text-amber-400 font-bold tracking-wider">
          <span className="flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-400 animate-spin" />
            Daily opening ritual
          </span>
          <span className="text-amber-300/80 font-normal">Step {step} of 2</span>
        </div>

        {/* Step 1: Yesterday's Recap & Overnight Chronicle */}
        {step === 1 && (
          <div className="space-y-4 py-2 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <div className="mx-auto w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-1">
                <ScrollText className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-medieval text-xl text-amber-200">1. Yesterday&apos;s recap</h3>
              <p className="text-xs text-zinc-400 italic">Reviewing your momentum & overnight realm events.</p>
            </div>

            {/* Yesterday's Stats Grid */}
            <div className="grid grid-cols-4 gap-2 text-center bg-zinc-950/90 p-3 rounded-xl border border-amber-900/30">
              <div className="p-1">
                <div className="text-[9px] text-zinc-400 font-bold">Habits</div>
                <div className="font-medieval text-sm text-amber-300 mt-0.5">⚔️ {yesterdayStats.questsCompleted}</div>
              </div>
              <div className="p-1 border-x border-amber-900/30">
                <div className="text-[9px] text-zinc-400 font-bold">Streak</div>
                <div className="font-medieval text-sm text-orange-400 mt-0.5">🔥 {yesterdayStats.streak}d</div>
              </div>
              <div className="p-1 border-r border-amber-900/30">
                <div className="text-[9px] text-zinc-400 font-bold">Gold</div>
                <div className="font-medieval text-sm text-amber-300 mt-0.5">🪙 +{yesterdayStats.goldEarned}</div>
              </div>
              <div className="p-1">
                <div className="text-[9px] text-zinc-400 font-bold">XP</div>
                <div className="font-medieval text-sm text-blue-300 mt-0.5">⭐ +{yesterdayStats.xpEarned || (yesterdayStats.questsCompleted * 15)}</div>
              </div>
            </div>

            {/* Overnight Chronicle Journal Card */}
            <div className="p-3 bg-zinc-950/80 rounded-xl border border-amber-900/30 space-y-2.5 text-xs">
              <div className="text-[10px] text-amber-400 font-mono tracking-widest text-center font-bold pb-1 border-b border-amber-900/20">
                📜 Overnight chronicle
              </div>

              {loreSummary ? (
                <div className="flex items-start gap-2.5 text-amber-200/90 italic">
                  <span className="text-base shrink-0">📜</span>
                  <p className="leading-relaxed">&quot;{loreSummary}&quot;</p>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-zinc-400 italic">
                  <span className="text-base shrink-0">🌿</span>
                  <p>&quot;{morningFallback}&quot;</p>
                </div>
              )}

              {activePartnerName && (
                <div className="flex items-center gap-2 pt-1 border-t border-amber-900/20">
                  <span className="text-base shrink-0">💖</span>
                  <p className="text-zinc-300">
                    Companion <strong className="text-purple-400">{activePartnerName}</strong> is at <strong className="text-purple-400">bond level {activePartnerBond || 1}</strong>.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 border-t border-amber-900/20">
                <span className="text-base shrink-0">⛰️</span>
                <p className="text-zinc-300">
                  {citizensReadyCount > 0 ? (
                    <span>Rockie grunts happily: <strong className="text-amber-400">{citizensReadyCount} wandering {citizensReadyCount === 1 ? 'citizen is' : 'citizens are'}</strong> waiting at the town square with your gold!</span>
                  ) : (
                    <span className="text-zinc-400">{rockieReport}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Today's Habit Target & Goal */}
        {step === 2 && (
          <div className="space-y-4 py-2 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <div className="mx-auto w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-1">
                <CheckSquare className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-medieval text-xl text-amber-200">2. Today&apos;s goal</h3>
              <p className="text-xs text-zinc-400 italic">A fresh day begins! All daily habits are reset and ready.</p>
            </div>

            <div className="p-4 bg-zinc-950/90 rounded-xl border border-amber-900/30 text-center space-y-2">
              <div className="text-xs text-amber-300 font-bold tracking-wider">
                🎯 Today&apos;s target
              </div>
              <p className="text-xs text-zinc-300 leading-normal">
                {diveroQuote}
              </p>
              <div className="text-[11px] text-zinc-400 italic pt-1 border-t border-amber-900/20">
                Tip: Mix simple habits (brushing teeth) with aspirational ones (10 push-ups).
              </div>
            </div>
          </div>
        )}

        {/* Next / Complete Button */}
        <Button
          onClick={handleNext}
          disabled={claimed}
          className="w-full py-3 mt-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-amber-950 font-bold tracking-wider text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2"
        >
          {step < 2 ? (
            <>
              Continue to today&apos;s goal <ArrowRight className="w-4 h-4" />
            </>
          ) : claimed ? (
            "Focus locked ✓"
          ) : (
            <>
              Lock morning focus (+25 gold) <Sparkles className="w-4 h-4" />
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
