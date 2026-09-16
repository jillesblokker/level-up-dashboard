"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, Copy, Check, Heart, Brain, Sword, Crown } from 'lucide-react';
import { GildedCornerBrackets } from '@/components/ui/gilded-corner-brackets';
import { toast } from '@/components/ui/use-toast';

interface MonthlyReflectionDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: any[];
}

export function MonthlyReflectionDigestModal({ isOpen, onClose, entries }: MonthlyReflectionDigestModalProps) {
  const [copied, setCopied] = useState(false);

  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long' });
  const currentYear = now.getFullYear();

  // Filter entries for current month
  const monthlyEntries = entries.filter(e => {
    if (!e.entry_date) return false;
    const d = new Date(e.entry_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalWords = monthlyEntries.reduce((acc, curr) => acc + (curr.content ? curr.content.split(/\s+/).length : 0), 0);
  const avgMood = monthlyEntries.length > 0
    ? (monthlyEntries.reduce((acc, curr) => acc + (curr.mood_score || 3), 0) / monthlyEntries.length).toFixed(1)
    : '4.0';

  const getDominantMoodLabel = () => {
    const avg = parseFloat(avgMood);
    if (avg >= 4.2) return 'Radiant & Energized ⚡';
    if (avg >= 3.4) return 'Focused & Balanced 🎯';
    if (avg >= 2.6) return 'Calm & Steady 🌿';
    return 'Reflective & Resilient 🕯️';
  };

  const handleCopySummary = () => {
    const text = `# Thrivehaven Monthly Reflection — ${currentMonthName} ${currentYear}
- Inscriptions logged: ${monthlyEntries.length} reflections (${totalWords} words)
- Dominant spirit: ${getDominantMoodLabel()} (Avg ${avgMood} / 5.0)
- Growth focus: Consistent daily habit practice across Kingdom virtues

"The world of Thrivehaven grows as you grow with persistency."`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied to clipboard 📋", description: "Monthly reflection digest copied in markdown format." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[88dvh] bg-[#0f0c08] border-2 border-[#5c3e21] text-amber-50 p-0 overflow-hidden flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.98)] rounded-3xl">
        <GildedCornerBrackets size="sm" inset="inset-1.5" />

        {/* Stitched leather inner border */}
        <div className="absolute inset-2.5 rounded-2xl border border-dashed border-[#8c6d48]/30 pointer-events-none z-10" />

        <div className="relative z-10 flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-hide">
          {/* Header */}
          <DialogHeader className="text-center items-center pb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Monthly synthesis
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-serif text-amber-200 tracking-tight mt-2">
              {currentMonthName} {currentYear} reflection digest
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs sm:text-sm max-w-md font-serif italic">
              &quot;An illuminated synthesis of your mindset, habit milestones, and spirit across the realm.&quot;
            </DialogDescription>
          </DialogHeader>

          {/* 3 Stats Overview Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-amber-900/40 text-center space-y-1">
              <span className="text-[10px] text-zinc-400 font-mono uppercase block">Reflections</span>
              <span className="text-xl sm:text-2xl font-bold font-serif text-amber-300">
                {monthlyEntries.length}
              </span>
              <span className="text-[10px] text-zinc-500 block">{totalWords} total words</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-amber-900/40 text-center space-y-1">
              <span className="text-[10px] text-zinc-400 font-mono uppercase block">Spirit aura</span>
              <span className="text-xl sm:text-2xl font-bold font-serif text-emerald-400">
                {avgMood} <span className="text-xs font-normal text-zinc-500">/ 5</span>
              </span>
              <span className="text-[10px] text-emerald-400/80 block">Mood resonance</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-amber-900/40 text-center space-y-1">
              <span className="text-[10px] text-zinc-400 font-mono uppercase block">Primary state</span>
              <span className="text-xs sm:text-sm font-bold font-serif text-purple-300 line-clamp-1">
                {getDominantMoodLabel()}
              </span>
              <span className="text-[10px] text-purple-400/80 block">Dominant mood</span>
            </div>
          </div>

          {/* Synthesis Narrative Parchment */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1a130c] via-[#120d08] to-zinc-950 border border-amber-500/30 space-y-3 shadow-inner">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-serif font-bold">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Chronicler&apos;s monthly decree</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 font-serif leading-relaxed italic">
              {monthlyEntries.length >= 5
                ? `You have maintained an exceptional reflective cadence this month with ${monthlyEntries.length} recorded entries. Your spirit maintained a steady average of ${avgMood}/5, demonstrating calm focus and persistent IRL momentum.`
                : monthlyEntries.length > 0
                  ? `You have inscribed ${monthlyEntries.length} reflections into your Chronicle this month. Each entry solidifies the mental foundation required to sustain your daily habit streaks and kingdom expansion.`
                  : `Your parchment for ${currentMonthName} is ready to be written. Inscribe your first daily reflection to begin synthesizing your monthly mindset trends!`
              }
            </p>
          </div>

          {/* Habit Virtues Synergy Breakdown */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-serif font-bold text-amber-200">Virtue alignment & habits</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <Brain className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-bold text-zinc-200">Knowledge</div>
                  <div className="text-[10px] text-zinc-400">Study & reading</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <Sword className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-zinc-200">Might</div>
                  <div className="text-[10px] text-zinc-400">Workouts & physical</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <Heart className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-zinc-200">Vitality</div>
                  <div className="text-[10px] text-zinc-400">Health & sleep</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <Crown className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="font-bold text-zinc-200">Honor</div>
                  <div className="text-[10px] text-zinc-400">Social & reflection</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCopySummary}
              className="border-amber-500/40 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 text-xs rounded-xl flex items-center gap-2"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy digest'}</span>
            </Button>

            <Button
              onClick={onClose}
              className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-serif font-bold text-xs rounded-xl px-5"
            >
              Return to chronicle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
