"use client"

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, Calendar, CheckSquare, Gift, ArrowRight, Flame, Shield, Sun } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { addToCharacterStat } from '@/lib/character-stats-service';

interface DailyRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  yesterdayStats?: {
    questsCompleted: number;
    streak: number;
    goldEarned: number;
  };
}

export function DailyRoutineModal({
  isOpen,
  onClose,
  yesterdayStats = { questsCompleted: 5, streak: 7, goldEarned: 120 }
}: DailyRoutineModalProps) {
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
      <DialogContent className="max-w-md w-full bg-gradient-to-b from-amber-950 via-zinc-950 to-zinc-950 border border-amber-500/40 text-amber-100 p-6 rounded-2xl shadow-2xl overflow-hidden font-serif">
        {/* Step Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/30 text-xs text-amber-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-400 animate-spin" />
            Daily Opening Sequence
          </span>
          <span>Step {step} of 2</span>
        </div>

        {/* Step 1: Yesterday's Recap */}
        {step === 1 && (
          <div className="space-y-4 py-2 animate-in fade-in duration-300">
            <div className="text-center space-y-1">
              <div className="mx-auto w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-1">
                <Calendar className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-medieval text-xl text-amber-200">1. Yesterday&apos;s Sovereign Recap</h3>
              <p className="text-xs text-zinc-400 italic">Reviewing your momentum from the previous day.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center bg-zinc-950/80 p-3 rounded-xl border border-amber-900/30">
              <div className="p-2">
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Habits</div>
                <div className="font-medieval text-base text-amber-300 mt-0.5">{yesterdayStats.questsCompleted}</div>
              </div>
              <div className="p-2 border-x border-amber-900/30">
                <div className="text-[10px] text-zinc-400 uppercase font-bold flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-orange-400" /> Streak
                </div>
                <div className="font-medieval text-base text-amber-300 mt-0.5">{yesterdayStats.streak} Days</div>
              </div>
              <div className="p-2">
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Gold</div>
                <div className="font-medieval text-base text-amber-300 mt-0.5">+{yesterdayStats.goldEarned}g</div>
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
              <h3 className="font-medieval text-xl text-amber-200">2. Today&apos;s Habit Focus & Target</h3>
              <p className="text-xs text-zinc-400 italic">A fresh day begins! All daily habits are reset and ready.</p>
            </div>

            <div className="p-4 bg-zinc-950/90 rounded-xl border border-amber-900/30 text-center space-y-2">
              <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                🎯 Sovereign Habit Cadence
              </div>
              <p className="text-xs text-zinc-300 leading-normal">
                Aim for <strong className="text-amber-400 font-bold">5 completed habits</strong> today for a Great score, 10 for Awesome, 15+ for Super!
              </p>
              <div className="text-[11px] text-zinc-400 italic pt-1 border-t border-amber-900/20">
                Tip: Mix simple habits (wake before 10) with aspirational ones (10 push-ups).
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
              Continue to Step 2 <ArrowRight className="w-4 h-4" />
            </>
          ) : claimed ? (
            "Focus Locked ✓"
          ) : (
            <>
              Begin Today&apos;s Journey <Sparkles className="w-4 h-4" />
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
