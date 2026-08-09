"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ShieldAlert, Flame, CheckCircle2, RefreshCw } from 'lucide-react';

export function StreakRecoveryCard() {
  const [data, setData] = useState<{
    eligible: boolean;
    completedTodayCount: number;
    requiredCount: number;
    isCompleted: boolean;
    atRiskCount: number;
  } | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/streaks/recovery');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Ignore errors silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (isLoading || !data || !data.eligible) {
    return null;
  }

  const handleRepair = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/streaks/recovery', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        toast({ title: "Streak Repaired! 🔥", description: "Streak successfully repaired! Overdrive Recovery bonus granted." });
        fetchStatus();
      } else {
        toast({ title: "Repair failed", description: json.error || 'Failed to repair streak.', variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: 'An error occurred while repairing your streak.', variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-background shadow-lg mb-4">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-amber-200 text-sm">Overdrive Streak Recovery</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                24h Quest
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your habit streak is at risk! Complete <span className="font-semibold text-amber-300">2 habits today</span> ({data.completedTodayCount}/{data.requiredCount}) to repair your streak.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto flex justify-end shrink-0">
          {data.isCompleted ? (
            <Button
              onClick={handleRepair}
              disabled={isSubmitting}
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-md w-full sm:w-auto"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
              )}
              Repair Streak
            </Button>
          ) : (
            <Button
              disabled
              size="sm"
              variant="outline"
              className="border-amber-500/30 text-amber-300/60 bg-amber-950/30 w-full sm:w-auto"
            >
              <Flame className="w-4 h-4 mr-1.5 opacity-60" />
              {data.completedTodayCount}/2 Habits Completed
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
