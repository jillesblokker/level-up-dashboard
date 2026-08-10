import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Sparkles, CheckCircle2, Zap, Shield, HelpCircle } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { unwrapApiResponse } from '@/lib/api-response-unwrapper';
import { logger } from '@/lib/logger';

interface CategoryBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string | null;
  userId?: string | undefined;
  categoryName?: string | undefined;
  emoji?: string | undefined;
  color?: string | undefined;
  points?: number | undefined;
}

export function CategoryBreakdownModal({
  isOpen,
  onClose,
  categoryId,
  userId,
  categoryName,
  emoji,
  color,
  points,
}: CategoryBreakdownModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !categoryId) return;

    const fetchBreakdown = async () => {
      try {
        setLoading(true);
        let url = `/api/house-cup/category-breakdown?category=${categoryId}`;
        if (userId) url += `&userId=${userId}`;

        const res = await fetchWithAuth(url);
        if (res.ok) {
          const raw = await res.json();
          const parsed = unwrapApiResponse<any>(raw);
          setData(parsed);
        }
      } catch (err) {
        logger.error('[CategoryBreakdownModal] Error fetching breakdown:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [isOpen, categoryId, userId]);

  if (!categoryId) return null;

  const displayName = data?.categoryName || categoryName || 'Virtue';
  const displayEmoji = data?.emoji || emoji || '✨';
  const displayColor = data?.color || color || '#eab308';
  const totalPts = data?.totalPoints !== undefined ? data.totalPoints : (points || 0);
  const fillPct = data?.fillPercentage || Math.min(100, Math.round((totalPts / 50000) * 100));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-amber-900/50 text-zinc-100 max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg border border-white/10"
              style={{ backgroundColor: `${displayColor}20`, borderColor: displayColor }}
            >
              {displayEmoji}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-amber-300 flex items-center gap-2">
                {displayName} Virtue Breakdown
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs">
                Detailed House Cup point accumulation & source guide
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Main Total Stat Card */}
          <div
            className="p-4 rounded-xl border relative overflow-hidden space-y-3"
            style={{ backgroundColor: `${displayColor}10`, borderColor: `${displayColor}40` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">Total Virtue Energy</span>
              <span className="text-2xl font-extrabold text-amber-300">{totalPts.toLocaleString()} pts</span>
            </div>

            {/* Hourglass Fill Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Hourglass fill level</span>
                <span className="font-bold text-amber-400">{fillPct}% full</span>
              </div>
              <Progress value={fillPct} className="h-2 bg-zinc-900" />
            </div>

            {data?.description && (
              <p className="text-xs text-zinc-300 leading-relaxed pt-1 border-t border-white/10">
                {data.description}
              </p>
            )}
          </div>

          {/* Point Sources Breakdown Grid */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Point sources breakdown</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-400 block font-medium">Daily Quests</span>
                <span className="font-bold text-amber-300">
                  {loading ? '...' : (data?.breakdown?.questsPoints || 0).toLocaleString()} pts
                </span>
              </div>

              <div className="p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-400 block font-medium">Challenges</span>
                <span className="font-bold text-amber-300">
                  {loading ? '...' : (data?.breakdown?.challengesPoints || 0).toLocaleString()} pts
                </span>
              </div>

              <div className="p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-400 block font-medium">
                  {categoryId === 'conquest' ? 'Dungeon Battles' : 'Milestones'}
                </span>
                <span className="font-bold text-amber-300">
                  {loading ? '...' : (data?.breakdown?.milestonesPoints || 0).toLocaleString()} pts
                </span>
              </div>
            </div>
          </div>

          {/* How To Earn Guidance Section */}
          {data?.howToEarn && data.howToEarn.length > 0 && (
            <div className="space-y-2 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/80">
              <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>How to earn more {displayName} virtue energy</span>
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {data.howToEarn.map((tip: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dismiss Button */}
          <Button
            onClick={onClose}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs h-9 rounded-lg"
          >
            Close virtue breakdown
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
