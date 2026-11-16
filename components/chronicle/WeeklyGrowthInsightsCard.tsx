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
    <div className={cn("flex flex-col justify-between gap-4 flex-1 h-full", className)}>
      {/* 3 Large Vertical Centered Metric Cards with Prominent Icons */}
      <div className="flex flex-col gap-3.5 flex-1">
        {/* Card 1: Top domain */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col items-center justify-center text-center shadow-sm flex-1 group min-h-[135px]">
          <span className="text-xs text-zinc-400 font-sans font-medium">
            Top domain
          </span>
          <div className="w-16 h-16 rounded-2xl bg-amber-950/50 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner my-2.5 group-hover:scale-105 transition-transform">
            <Award className="w-8 h-8" />
          </div>
          <span className="text-base sm:text-lg font-serif font-bold text-amber-200 block">
            {activeData.topCategory}
          </span>
          <Badge className="bg-amber-950/60 border-amber-500/30 text-amber-300 font-mono text-[11px] px-2.5 py-0.5 mt-2">
            {activeData.topCategoryCount} {activeData.topCategoryCount === 1 ? 'habit' : 'habits'}
          </Badge>
        </div>

        {/* Card 2: Habits completed */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col items-center justify-center text-center shadow-sm flex-1 group min-h-[135px]">
          <span className="text-xs text-zinc-400 font-sans font-medium">
            Habits completed
          </span>
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner my-2.5 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-8 h-8" />
          </div>
          <span className="text-base sm:text-lg font-serif font-bold text-emerald-200 block">
            {activeData.totalCompletions} {activeData.totalCompletions === 1 ? 'habit' : 'habits'}
          </span>
          <Badge className="bg-emerald-950/60 border-emerald-500/30 text-emerald-300 font-mono text-[11px] px-2.5 py-0.5 mt-2">
            Weekly total
          </Badge>
        </div>

        {/* Card 3: Peak focus */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-yellow-500/20 hover:border-yellow-500/40 transition-all flex flex-col items-center justify-center text-center shadow-sm flex-1 group min-h-[135px]">
          <span className="text-xs text-zinc-400 font-sans font-medium">
            Peak focus
          </span>
          <div className="w-16 h-16 rounded-2xl bg-yellow-950/50 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shadow-inner my-2.5 group-hover:scale-105 transition-transform">
            <Sun className="w-8 h-8" />
          </div>
          <span className="text-base sm:text-lg font-serif font-bold text-yellow-200 block">
            {activeData.peakFocusWindow}
          </span>
          <Badge className="bg-yellow-950/60 border-yellow-500/30 text-yellow-300 font-mono text-[11px] px-2.5 py-0.5 mt-2">
            Prime flow
          </Badge>
        </div>
      </div>

      {/* Synthesis Takeaway Quote */}
      <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200/90 leading-relaxed italic font-serif flex items-start gap-2.5 shadow-inner mt-1">
        <Quote className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <span>&ldquo;{activeData.takeaway}&rdquo;</span>
      </div>
    </div>
  );
}
