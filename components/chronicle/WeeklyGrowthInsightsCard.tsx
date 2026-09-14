"use client";

import { useEffect, useState } from 'react';
import { Award, TrendingUp, Sun, Quote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function WeeklyGrowthInsightsCard({ className }: { className?: string } = {}) {
  const [data, setData] = useState<{
    totalCompletions: number;
    topCategory: string;
    topCategoryCount: number;
    peakFocusWindow: string;
    takeaway: string;
  } | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await fetch('/api/chronicle/insights');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Silently ignore
      }
    };

    fetchInsights();
  }, []);

  const fallbackData = {
    totalCompletions: 0,
    topCategory: 'Might',
    topCategoryCount: 0,
    peakFocusWindow: 'Morning 8 AM - 11 AM',
    takeaway: 'Maintain your momentum! Building daily habits creates long-term persistency.'
  };

  const activeData = data || fallbackData;

  return (
    <div className={cn("space-y-3.5", className)}>
      {/* 3 Vertically Stacked Metric Cards */}
      <div className="flex flex-col gap-3">
        {/* Card 1: Top domain */}
        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-amber-500/20 hover:border-amber-500/40 transition-colors flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block tracking-wider">
                Top domain
              </span>
              <span className="text-sm font-serif font-bold text-amber-200 truncate block">
                {activeData.topCategory}
              </span>
            </div>
          </div>
          <Badge className="bg-amber-950/70 border-amber-500/40 text-amber-300 font-mono text-[11px] px-2.5 py-0.5 shrink-0">
            {activeData.topCategoryCount} {activeData.topCategoryCount === 1 ? 'habit' : 'habits'}
          </Badge>
        </div>

        {/* Card 2: Habits done */}
        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400 shadow-inner">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block tracking-wider">
                Habits completed
              </span>
              <span className="text-sm font-serif font-bold text-emerald-200 truncate block">
                {activeData.totalCompletions} {activeData.totalCompletions === 1 ? 'habit' : 'habits'}
              </span>
            </div>
          </div>
          <Badge className="bg-emerald-950/70 border-emerald-500/40 text-emerald-300 font-mono text-[11px] px-2.5 py-0.5 shrink-0">
            Weekly total
          </Badge>
        </div>

        {/* Card 3: Peak focus */}
        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-yellow-950/50 border border-yellow-500/40 flex items-center justify-center shrink-0 text-yellow-400 shadow-inner">
              <Sun className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-400 uppercase font-mono block tracking-wider">
                Peak focus
              </span>
              <span className="text-sm font-serif font-bold text-yellow-200 truncate block">
                {activeData.peakFocusWindow}
              </span>
            </div>
          </div>
          <Badge className="bg-yellow-950/70 border-yellow-500/40 text-yellow-300 font-mono text-[11px] px-2.5 py-0.5 shrink-0">
            Prime flow
          </Badge>
        </div>
      </div>

      {/* Synthesis Takeaway Quote */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/30 via-zinc-900/60 to-purple-950/20 border border-purple-500/30 text-xs text-purple-200/90 leading-relaxed italic font-serif flex items-start gap-2.5 shadow-inner">
        <Quote className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <span>&ldquo;{activeData.takeaway}&rdquo;</span>
      </div>
    </div>
  );
}
