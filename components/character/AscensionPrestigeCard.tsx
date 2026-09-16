"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Award } from 'lucide-react';
import { getPrestigeData } from '@/lib/level-utils';
import { toast } from '@/components/ui/use-toast';

interface AscensionPrestigeCardProps {
  level: number;
  experience: number;
}

export function AscensionPrestigeCard({ level, experience }: AscensionPrestigeCardProps) {
  const prestige = getPrestigeData(level);

  const handleAscensionCelebration = () => {
    if (typeof window !== 'undefined') {
      import('canvas-confetti').then(confetti => {
        confetti.default({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      }).catch(() => {});
    }
    toast({
      title: prestige.isPrestige 
        ? `Ascension rank: ${prestige.title} (Prestige ${prestige.roman}) 👑`
        : "Ascension path: Sovereign pioneer ⭐",
      description: prestige.isPrestige
        ? `Paragon crest active! Benefiting from ${prestige.multiplierLabel} across all kingdom activities.`
        : `Reach Level 100 to achieve Prestige I and awaken the radiant Paragon avatar crest!`,
    });
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-amber-950/40 via-zinc-950 to-zinc-900 border border-amber-500/30 p-5 rounded-2xl shadow-xl space-y-4">
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-lg border ${
            prestige.isPrestige 
              ? 'bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-amber-500/20 border-amber-400 animate-pulse'
              : 'bg-zinc-900/90 border-amber-500/30'
          }`}>
            {prestige.isPrestige ? '👑' : '⭐'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base sm:text-lg font-serif font-bold text-amber-300">
                {prestige.isPrestige ? `${prestige.title} (Prestige ${prestige.roman})` : 'Ascension & prestige'}
              </h4>
              <Badge className={`text-[10px] font-mono uppercase tracking-wider ${
                prestige.isPrestige 
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}>
                {prestige.isPrestige ? `Rank ${prestige.roman}` : 'Initiate'}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 font-serif">
              {prestige.isPrestige
                ? `Active Paragon prestige blessings: ${prestige.multiplierLabel}`
                : 'Progress toward Level 100 Paragon prestige ascension'}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleAscensionCelebration}
          className="border-amber-500/30 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 hover:text-amber-200 text-xs px-3 py-1.5 h-auto rounded-xl font-serif shrink-0 flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Blessings</span>
        </Button>
      </div>

      {/* Progress Track */}
      <div className="space-y-1.5 bg-zinc-950/80 p-3.5 rounded-xl border border-amber-900/30 relative z-10 shadow-inner">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-zinc-300 font-serif flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {prestige.isPrestige 
                ? `Next prestige milestone: Level ${prestige.nextPrestigeLevel}`
                : 'Prestige I threshold: Level 100'}
            </span>
          </span>
          <span className="text-amber-300 font-bold">
            Level {prestige.currentLevel} / {prestige.nextPrestigeLevel} ({Math.round(prestige.progressToNextPrestige)}%)
          </span>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/60 p-0.5 border border-amber-900/50 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.7)] transition-all duration-500"
            style={{ width: `${prestige.progressToNextPrestige}%` }}
          />
        </div>
      </div>

      {/* Perks Breakdown / Tier Perks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-serif relative z-10">
        <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-amber-500/20">
          <span className="text-[10px] text-zinc-400 block font-mono uppercase">Gold & EXP aura</span>
          <span className="text-amber-300 font-bold text-sm">{prestige.multiplierLabel}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-amber-500/20">
          <span className="text-[10px] text-zinc-400 block font-mono uppercase">Avatar crest</span>
          <span className="text-amber-300 font-bold text-sm">{prestige.isPrestige ? 'Prismatic' : 'Standard'}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-amber-500/20">
          <span className="text-[10px] text-zinc-400 block font-mono uppercase">Floating island</span>
          <span className={`font-bold text-xs ${prestige.rank >= 1 ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {prestige.rank >= 1 ? '✨ Unlocked' : '🔒 Prestige I'}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-amber-500/20">
          <span className="text-[10px] text-zinc-400 block font-mono uppercase">Crystal cascade</span>
          <span className={`font-bold text-xs ${prestige.rank >= 2 ? 'text-cyan-400' : 'text-zinc-500'}`}>
            {prestige.rank >= 2 ? '💎 Unlocked' : '🔒 Prestige II'}
          </span>
        </div>
      </div>
    </Card>
  );
}
