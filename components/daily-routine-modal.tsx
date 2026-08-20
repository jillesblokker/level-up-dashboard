"use client"

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, Calendar, CheckSquare, Gift, ArrowRight, Flame, Shield, Sun } from "lucide-react";
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
    xpEarned?: number;
    milestonesUnlocked?: number;
    archetype?: string;
  };
  loreSummary?: string;
  activePartnerName?: string;
  activePartnerBond?: number;
  citizensReadyCount?: number;
}

export function DailyRoutineModal({
  isOpen,
  onClose,
  yesterdayStats: propStats,
  loreSummary,
  activePartnerName,
  activePartnerBond,
  citizensReadyCount = 0,
}: DailyRoutineModalProps) {
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
          <DialogTitle>Daily Opening Sequence & Overnight Chronicle</DialogTitle>
          <DialogDescription>Daily habit focus and opening routine</DialogDescription>
        </DialogHeader>

        {/* Header & Step Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/30 text-xs text-amber-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-400 animate-spin" />
            Daily Opening Ritual
          </span>
          <span>Step {step} of 2</span>
        </div>

        {/* Step 1: Yesterday's Sovereign Recap & Overnight Chronicle */}
        {step === 1 && (
          <div className="space-y-4 py-2 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <div className="mx-auto w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-1">
                <Calendar className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-medieval text-xl text-amber-200">1. Sovereign Recap & Chronicle</h3>
              <p className="text-xs text-zinc-400 italic">Reviewing yesterday&apos;s momentum & overnight realm events.</p>
            </div>

            {/* Yesterday's Stats Grid */}
            <div className="grid grid-cols-4 gap-2 text-center bg-zinc-950/90 p-3 rounded-xl border border-amber-900/30">
              <div className="p-1">
                <div className="text-[9px] text-zinc-400 uppercase font-bold">Habits</div>
                <div className="font-medieval text-sm text-amber-300 mt-0.5">⚔️ {yesterdayStats.questsCompleted}</div>
              </div>
              <div className="p-1 border-x border-amber-900/30">
                <div className="text-[9px] text-zinc-400 uppercase font-bold">Streak</div>
                <div className="font-medieval text-sm text-orange-400 mt-0.5">🔥 {yesterdayStats.streak}d</div>
              </div>
              <div className="p-1 border-r border-amber-900/30">
                <div className="text-[9px] text-zinc-400 uppercase font-bold">Gold</div>
                <div className="font-medieval text-sm text-amber-300 mt-0.5">🪙 +{yesterdayStats.goldEarned}</div>
              </div>
              <div className="p-1">
                <div className="text-[9px] text-zinc-400 uppercase font-bold">XP</div>
                <div className="font-medieval text-sm text-blue-300 mt-0.5">⭐ +{yesterdayStats.xpEarned || (yesterdayStats.questsCompleted * 15)}</div>
              </div>
            </div>

            {/* Overnight Chronicle Journal Card */}
            <div className="p-3 bg-zinc-950/80 rounded-xl border border-amber-900/30 space-y-2.5 text-xs">
              <div className="text-[10px] text-amber-400 font-mono uppercase tracking-widest text-center font-bold pb-1 border-b border-amber-900/20">
                📜 Overnight Chronicle
              </div>

              {loreSummary ? (
                <div className="flex items-start gap-2.5 text-amber-200/90 italic">
                  <span className="text-base shrink-0">📜</span>
                  <p className="leading-relaxed">&quot;{loreSummary}&quot;</p>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-zinc-400 italic">
                  <span className="text-base shrink-0">💤</span>
                  <p>&quot;Yesterday was a peaceful day in the realm. All citizens slept soundly.&quot;</p>
                </div>
              )}

              {activePartnerName && (
                <div className="flex items-center gap-2 pt-1 border-t border-amber-900/20">
                  <span className="text-base shrink-0">💖</span>
                  <p className="text-zinc-300">
                    Companion <strong className="text-purple-400">{activePartnerName}</strong> is at <strong className="text-purple-400">Bond Level {activePartnerBond || 1}</strong>.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 border-t border-amber-900/20">
                <span className="text-base shrink-0">🪙</span>
                <p className="text-zinc-300">
                  {citizensReadyCount > 0 ? (
                    <span>You have <strong className="text-amber-400">{citizensReadyCount} {citizensReadyCount === 1 ? 'Citizen' : 'Citizens'}</strong> ready for tax harvest today!</span>
                  ) : (
                    <span className="text-zinc-400">Citizens are gathering resources in the settlement.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview Today's Habit Focus */}
        {step === 2 && (
          <div className="space-y-4 py-2 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <div className="mx-auto w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-1">
                <CheckSquare className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-medieval text-xl text-amber-200">2. Today&apos;s Morning Focus & Target</h3>
              <p className="text-xs text-zinc-400 italic">A fresh day begins! All daily habits are reset and ready.</p>
            </div>

            <div className="p-4 bg-zinc-950/90 rounded-xl border border-amber-900/30 text-center space-y-2">
              <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                🎯 Sovereign Habit Target
              </div>
              <p className="text-xs text-zinc-300 leading-normal">
                Aim for <strong className="text-amber-400 font-bold">5 completed habits</strong> today for a Great score, 10 for Awesome, 15+ for Super!
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
          className="w-full py-3 mt-2 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-amber-950 font-bold uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2"
        >
          {step < 2 ? (
            <>
              Continue to Morning Target <ArrowRight className="w-4 h-4" />
            </>
          ) : claimed ? (
            "Focus Locked ✓"
          ) : (
            <>
              Lock Morning Focus (+25 Gold) <Sparkles className="w-4 h-4" />
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
