"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, Sun, Smile, Award } from 'lucide-react';

export function WeeklyGrowthInsightsCard() {
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

  if (!data) return null;

  return (
    <Card className="border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-background shadow-lg mb-6">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-base text-purple-200 font-semibold">Weekly Growth Synthesis</CardTitle>
            <p className="text-xs text-muted-foreground">7-Day Habit & Mood Intelligence</p>
          </div>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
          7-Day Snapshot
        </span>
      </CardHeader>
      <CardContent className="pt-2 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-black/30 border border-purple-500/20 flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Top Domain</span>
              <span className="text-xs font-bold text-amber-200">{data.topCategory} ({data.topCategoryCount})</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/30 border border-purple-500/20 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Habits Done</span>
              <span className="text-xs font-bold text-emerald-200">{data.totalCompletions} Habits</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/30 border border-purple-500/20 flex items-center gap-3">
            <Sun className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Peak Focus</span>
              <span className="text-xs font-bold text-yellow-200">{data.peakFocusWindow}</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-purple-900/20 border border-purple-500/20 text-xs text-purple-200/90 leading-relaxed italic">
          &quot;{data.takeaway}&quot;
        </div>
      </CardContent>
    </Card>
  );
}
