"use client"

import { logger } from "@/lib/logger";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCharacterStats, updateCharacterStats } from '@/lib/character-stats-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { Shield, RotateCcw, Heart, Zap, Award, AlertTriangle } from 'lucide-react';

interface StreakRecoveryProps {
  token: string;
  category: string;
  streakData: {
    streak_days: number;
    resilience_points?: number;
    safety_net_used?: boolean;
    missed_days_this_week?: number;
    streak_broken_date?: string | null;
    max_streak_achieved?: number;
    consecutive_weeks_completed?: number;
  };
  onStreakUpdate: () => void;
}

interface ComebackChallenge {
  name: string;
  description: string;
  xp: number;
  gold: number;
  difficulty: string;
}

export function StreakRecovery({ token, category, streakData, onStreakUpdate }: StreakRecoveryProps) {
  const [comebackChallenges, setComebackChallenges] = useState<ComebackChallenge[]>([]);
  const [qualifiesForComeback, setQualifiesForComeback] = useState(false);
  const [comebackReason, setComebackReason] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [buildTokens, setBuildTokens] = useState(0);

  // Load build tokens from service
  useEffect(() => {
    (async () => {
      try {
        const stats = getCharacterStats();
        setBuildTokens(stats.build_tokens || 0);
      } catch {
        setBuildTokens(0);
      }
    })();
  }, []);

  // Fetch comeback challenges
  useEffect(() => {
    if (!token || !category) {
      // Removed debugging log
      return;
    }

    async function fetchComebackChallenges() {
      try {
        // Removed debugging log
        const res = await fetch(`/api/comeback-challenges?category=${encodeURIComponent(category)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            setComebackChallenges(data.challenges || []);
            setQualifiesForComeback(data.qualifiesForComeback || false);
            setComebackReason(data.reason || '');
          } else {
            logger.error('Comeback challenges API returned non-JSON response');
          }
        } else {
          logger.error('Comeback challenges API error:', res.status, res.statusText);
        }
      } catch (error) {
        logger.error('Failed to fetch comeback challenges:', error);
      }
    }

    fetchComebackChallenges();
  }, [token, category, streakData]);

  const handleUseSafetyNet = async () => {
    if (!token) {
      // Removed debugging log
      return;
    }

    setLoadingAction('safety_net');
    try {
      const res = await fetch('/api/streaks-direct', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          action: 'use_safety_net'
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Safety Net Activated! 🛡️',
          description: data.message,
        });
        onStreakUpdate();
      } else {
        toast({
          title: 'Cannot Use Safety Net',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to activate safety net',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReconstructStreak = async () => {
    if (!token) {
      // Removed debugging log
      return;
    }

    if (buildTokens < 5) {
      toast({
        title: 'Insufficient Build Tokens',
        description: 'You need 5 build tokens to reconstruct your streak',
        variant: 'destructive',
      });
      return;
    }

    setLoadingAction('reconstruct');
    try {
      const res = await fetch('/api/streaks-direct', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          action: 'reconstruct_streak',
          cost: 5
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Deduct build tokens and persist
        setBuildTokens(prev => {
          const newVal = Math.max(0, (prev || 0) - 5);
          updateCharacterStats({ build_tokens: newVal }, 'streak-reconstruction');
          return newVal;
        });

        // Trigger character stats update
        window.dispatchEvent(new Event('character-stats-update'));

        toast({
          title: 'Streak reconstructed! ⚡',
          description: "Sparky sparks the broken chain back together: your habit streak is renewed and safe from Necrion's cold touch!",
        });
        onStreakUpdate();
      } else {
        toast({
          title: 'Cannot Reconstruct Streak',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reconstruct streak',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReconstructStreakWithResilience = async () => {
    if (!token) {
      return;
    }

    if (resiliencePoints < 20) {
      toast({
        title: 'Insufficient Resilience Points',
        description: 'You need 20 resilience points to reconstruct your streak',
        variant: 'destructive',
      });
      return;
    }

    setLoadingAction('reconstruct_resilience');
    try {
      const res = await fetch('/api/streaks-direct', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          action: 'reconstruct_streak_with_resilience'
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Streak reconstructed! ⚡',
          description: "Sparky sparks the broken chain back together: your habit streak is renewed and safe from Necrion's cold touch!",
        });
        onStreakUpdate();
      } else {
        toast({
          title: 'Cannot Reconstruct Streak',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reconstruct streak',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleComebackChallenge = async (challengeName: string) => {
    if (!token) {
      // Removed debugging log
      return;
    }

    setLoadingAction(`comeback_${challengeName}`);
    try {
      const res = await fetch('/api/comeback-challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          challengeName,
          completed: true
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Comeback Challenge Complete! 🎉',
          description: data.message,
        });
        onStreakUpdate();

        // Refresh comeback challenges
        const refreshRes = await fetch(`/api/comeback-challenges?category=${encodeURIComponent(category)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setComebackChallenges(refreshData.challenges || []);
          setQualifiesForComeback(refreshData.qualifiesForComeback || false);
        }
      } else {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete comeback challenge',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const resiliencePoints = streakData.resilience_points || 0;
  const safetyNetUsed = streakData.safety_net_used || false;
  const missedDaysThisWeek = streakData.missed_days_this_week || 0;
  const isStreakBroken = !!streakData.streak_broken_date;
  const maxStreakAchieved = streakData.max_streak_achieved || streakData.streak_days || 0;

  // Check if recovery features are available (new database fields exist)
  const recoveryFeaturesAvailable = streakData.hasOwnProperty('resilience_points');

  return (
    <div className="space-y-4">
      {/* Migration Notice */}
      {!recoveryFeaturesAvailable && (
        <Card className="border-yellow-800/30 bg-yellow-900/10" aria-label="migration-notice-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-yellow-200">
              <AlertTriangle className="w-5 h-5" />
              <div className="flex-1">
                <h3 className="font-medium">Recovery Features Not Available</h3>
                <p className="text-sm text-yellow-300/80 mt-1">
                  Run the database migration to enable streak recovery features.
                </p>
              </div>
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/migrate-streak-recovery', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                    });
                    const result = await response.json();

                    if (result.success) {
                      if (result.alreadyMigrated) {
                        toast({
                          title: "Already Migrated! 🎉",
                          description: "Streak recovery features are already enabled.",
                          duration: 3000,
                        });
                      } else {
                        toast({
                          title: "Migration Successful! 🎉",
                          description: "Streak recovery features are now enabled. Please refresh the page.",
                          duration: 5000,
                        });
                        // Trigger a page refresh to reload the component with new features
                        setTimeout(() => window.location.reload(), 2000);
                      }
                    } else if (result.manualInstructions) {
                      // Show manual migration instructions
                      const instructions = result.manualInstructions;
                      const sqlCode = instructions.sql.replace(/^\s+/gm, ''); // Remove leading whitespace

                      toast({
                        title: "Manual Migration Required",
                        description: "Automated migration failed. Check the console for manual instructions.",
                        duration: 8000,
                      });

                      // Log detailed instructions to console
                      logger.debug('🔧 MANUAL MIGRATION REQUIRED');
                      logger.debug('=====================================');
                      logger.debug('📋 Steps:');
                      instructions.steps.forEach((step: string, index: number) => {
                        logger.debug(`   ${step}`);
                      });
                      logger.debug('');
                      logger.debug('📝 SQL to run:');
                      logger.debug(sqlCode);
                      logger.debug('');
                      logger.debug('ℹ️ Note:', instructions.note);
                      logger.debug('=====================================');

                      // Copy SQL to clipboard if possible
                      if (navigator.clipboard) {
                        try {
                          await navigator.clipboard.writeText(sqlCode);
                          logger.debug('✅ SQL copied to clipboard!');
                        } catch (clipboardError) {
                          logger.debug('❌ Could not copy to clipboard');
                        }
                      }
                    } else {
                      toast({
                        title: "Migration Failed",
                        description: result.error || "Unknown error occurred",
                        variant: "destructive",
                        duration: 5000,
                      });
                    }
                  } catch (error) {
                    logger.error('Migration error:', error);
                    toast({
                      title: "Migration Error",
                      description: "Failed to run migration. Please try again.",
                      variant: "destructive",
                      duration: 5000,
                    });
                  }
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 text-sm font-medium"
                aria-label="Run streak recovery migration"
              >
                Run Migration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Recovery Section - Side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Streak Recovery System - Takes 2/3 width on desktop */}
        <div className="lg:col-span-2">
          <Card className="medieval-card-royal h-full shadow-lg" aria-label="streak-recovery-status-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-blue-200">
                <Heart className="w-6 h-6 text-blue-400" />
                Streak recovery system
              </CardTitle>
              <CardDescription className="text-blue-300/80 text-base leading-relaxed">
                Build resilience and protect your streaks with recovery tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sparky's Resilience Points Slab */}
                <div className="text-center p-4 rounded-2xl bg-gradient-to-b from-[#1b1510] to-[#0d0905] border border-amber-600/40 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
                  <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
                    <span className="text-base">⚡</span>
                    <span className="text-xs font-serif font-bold text-amber-200">Resilience points</span>
                  </div>
                  <div className="text-3xl font-serif font-bold text-amber-300 mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] relative z-10">{resiliencePoints}</div>
                  <div className="text-[11px] text-amber-200/70 leading-snug relative z-10 font-sans">Sparky gathers sparks from completed weeks</div>
                </div>

                {/* Sage Owl's Safety Net Ward Slab */}
                <div className="text-center p-4 rounded-2xl bg-gradient-to-b from-[#101912] to-[#070f09] border border-emerald-600/40 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
                  <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
                    <span className="text-base">🛡️</span>
                    <span className="text-xs font-serif font-bold text-emerald-200">Sage Owl ward</span>
                  </div>
                  <div className="mb-2 relative z-10">
                    <Badge variant={safetyNetUsed ? 'outline' : 'default'} className={`text-[10px] font-serif font-semibold px-2.5 py-0.5 rounded-lg ${safetyNetUsed ? 'text-zinc-400 border-zinc-700 bg-zinc-900/50' : 'text-emerald-200 bg-emerald-950/80 border-emerald-500/50 shadow-sm'}`}>
                      {safetyNetUsed ? 'Ward expended' : 'Ward active'}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-emerald-200/70 leading-snug relative z-10 font-sans">
                    Forgives missed day: {missedDaysThisWeek}/1
                  </div>
                </div>

                {/* Flamio's Brazier of Best Streak */}
                <div className="text-center p-4 rounded-2xl bg-gradient-to-b from-[#1c120c] to-[#0d0704] border border-orange-600/40 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-radial from-orange-500/10 via-transparent to-transparent pointer-events-none" />
                  <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
                    <span className="text-base">🔥</span>
                    <span className="text-xs font-serif font-bold text-orange-200">Best streak</span>
                  </div>
                  <div className="text-3xl font-serif font-bold text-orange-300 mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] relative z-10">{maxStreakAchieved}</div>
                  <div className="text-[11px] text-orange-200/70 leading-snug relative z-10 font-sans">Flamio keeps your flame burning</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Safety Net Action - Takes 1/3 width on desktop */}
        {recoveryFeaturesAvailable && !safetyNetUsed && missedDaysThisWeek === 0 && (
          <div className="lg:col-span-1">
            <Card className="medieval-card-deep h-full shadow-xl border-emerald-600/40" aria-label="safety-net-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-lg font-serif font-bold text-emerald-200">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  Safety net available
                </CardTitle>
                <CardDescription className="text-emerald-300/80 text-xs leading-relaxed font-sans">
                  Sage Owl spreads a protective wing over your calendar to forgive your first missed day this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleUseSafetyNet}
                  disabled={loadingAction === 'safety_net'}
                  className="w-full btn-primary-cta text-xs py-3 h-auto shadow-lg hover:shadow-xl font-serif font-bold flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  {loadingAction === 'safety_net' ? 'Activating ward...' : 'Activate safety net'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Additional Recovery Actions - Full width below */}
      {(recoveryFeaturesAvailable && isStreakBroken && maxStreakAchieved > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Streak Reconstruction */}
          <Card className="border-purple-800/30 bg-purple-900/10" aria-label="streak-reconstruction-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <RotateCcw className="w-5 h-5" />
                Streak reconstruction
              </CardTitle>
              <CardDescription>
                Restore your broken streak to {maxStreakAchieved} days using build tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-zinc-400">Cost: 5 build tokens</span>
                <span className="text-sm text-zinc-300">You have: {buildTokens}</span>
              </div>
              <Button
                onClick={handleReconstructStreak}
                disabled={loadingAction === 'reconstruct' || buildTokens < 5}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                {loadingAction === 'reconstruct' ? 'Reconstructing...' :
                  buildTokens < 5 ? 'Need 5 build tokens' : 'Reconstruct streak'}
              </Button>
            </CardContent>
          </Card>

          {/* Streak Reconstruction with Resilience */}
          <Card className="border-blue-800/30 bg-blue-900/10" aria-label="streak-reconstruction-resilience-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Zap className="w-5 h-5 text-yellow-400" />
                Resilience restoration
              </CardTitle>
              <CardDescription>
                Restore your broken streak to {maxStreakAchieved} days using resilience points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-zinc-400">Cost: 20 Resilience Points</span>
                <span className="text-sm text-zinc-300">You have: {resiliencePoints}</span>
              </div>
              <Button
                onClick={handleReconstructStreakWithResilience}
                disabled={loadingAction === 'reconstruct_resilience' || resiliencePoints < 20}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingAction === 'reconstruct_resilience' ? 'Reconstructing...' :
                  resiliencePoints < 20 ? 'Need 20 Resilience Points' : 'Restore Streak'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comeback Challenges */}
      {recoveryFeaturesAvailable && qualifiesForComeback && comebackChallenges.length > 0 && (
        <Card className="medieval-card-earth shadow-lg" aria-label="comeback-challenges-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-orange-200">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              Comeback Challenges
            </CardTitle>
            <CardDescription className="text-orange-300/80 text-base leading-relaxed">
              {comebackReason}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {comebackChallenges.map((challenge) => (
                <div key={challenge.name} className="border-2 border-orange-800/40 rounded-xl p-4 bg-orange-900/10 hover:bg-orange-900/20 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-200 text-lg mb-1">{challenge.name}</h4>
                      <p className="text-sm text-orange-300/80 leading-relaxed">{challenge.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-orange-300 bg-orange-900/30 px-3 py-1 rounded-lg">
                        {challenge.xp} XP • {challenge.gold} Gold
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleComebackChallenge(challenge.name)}
                    disabled={loadingAction === `comeback_${challenge.name}`}
                    size="default"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 text-base transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {loadingAction === `comeback_${challenge.name}` ? 'Completing...' : 'Complete Challenge'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 