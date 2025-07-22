"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Load build tokens from localStorage
  useEffect(() => {
    try {
      const stats = JSON.parse(localStorage.getItem('character-stats') || '{}');
      setBuildTokens(stats.buildTokens || 0);
    } catch {
      setBuildTokens(0);
    }
  }, []);

  // Fetch comeback challenges
  useEffect(() => {
    if (!token || !category) return;
    
    async function fetchComebackChallenges() {
      try {
        const res = await fetch(`/api/comeback-challenges?category=${encodeURIComponent(category)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setComebackChallenges(data.challenges || []);
          setQualifiesForComeback(data.qualifiesForComeback || false);
          setComebackReason(data.reason || '');
        }
      } catch (error) {
        console.error('Failed to fetch comeback challenges:', error);
      }
    }

    fetchComebackChallenges();
  }, [token, category, streakData]);

  const handleUseSafetyNet = async () => {
    if (!token) return;
    
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
    if (!token || buildTokens < 5) return;
    
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
        // Deduct build tokens from localStorage
        const stats = JSON.parse(localStorage.getItem('character-stats') || '{}');
        stats.buildTokens = (stats.buildTokens || 0) - 5;
        localStorage.setItem('character-stats', JSON.stringify(stats));
        setBuildTokens(stats.buildTokens);
        
        // Trigger character stats update
        window.dispatchEvent(new Event('character-stats-update'));
        
        toast({
          title: 'Streak Reconstructed! ⚡',
          description: data.message,
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
    if (!token) return;
    
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
              <div>
                <h3 className="font-medium">Recovery Features Not Available</h3>
                <p className="text-sm text-yellow-300/80 mt-1">
                  Run the database migration to enable streak recovery features. Check the README for migration instructions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Main Recovery Section - Side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Streak Recovery System - Takes 2/3 width on desktop */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-800/30 h-full" aria-label="streak-recovery-status-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="w-5 h-5 text-blue-400" />
                Streak Recovery System
              </CardTitle>
              <CardDescription>
                Build resilience and protect your streaks with recovery tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Resilience Points */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-300">Resilience Points</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{resiliencePoints}</div>
                  <div className="text-xs text-gray-400">Earned by completing weeks</div>
                </div>

                {/* Safety Net Status */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Shield className={`w-4 h-4 ${safetyNetUsed ? 'text-gray-400' : 'text-green-400'}`} />
                    <span className="text-sm font-medium text-gray-300">Safety Net</span>
                  </div>
                  <Badge variant={safetyNetUsed ? 'outline' : 'default'} className={safetyNetUsed ? 'text-gray-400' : 'text-green-400'}>
                    {safetyNetUsed ? 'Used This Week' : 'Available'}
                  </Badge>
                  <div className="text-xs text-gray-400 mt-1">
                    Missed days: {missedDaysThisWeek}/1
                  </div>
                </div>

                {/* Max Streak */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-gray-300">Best Streak</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-400">{maxStreakAchieved}</div>
                  <div className="text-xs text-gray-400">days achieved</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Safety Net Action - Takes 1/3 width on desktop */}
        {recoveryFeaturesAvailable && !safetyNetUsed && missedDaysThisWeek === 0 && (
          <div className="lg:col-span-1">
            <Card className="border-green-800/30 bg-green-900/10 h-full" aria-label="safety-net-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <Shield className="w-5 h-5" />
                  Safety Net Available
                </CardTitle>
                <CardDescription>
                  Protect your streak from the first missed day this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleUseSafetyNet}
                  disabled={loadingAction === 'safety_net'}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loadingAction === 'safety_net' ? 'Activating...' : 'Use Safety Net'}
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
                Streak Reconstruction
              </CardTitle>
              <CardDescription>
                Restore your broken streak to {maxStreakAchieved} days using build tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Cost: 5 Build Tokens</span>
                <span className="text-sm text-gray-300">You have: {buildTokens}</span>
              </div>
              <Button
                onClick={handleReconstructStreak}
                disabled={loadingAction === 'reconstruct' || buildTokens < 5}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                {loadingAction === 'reconstruct' ? 'Reconstructing...' : 
                 buildTokens < 5 ? 'Need 5 Build Tokens' : 'Reconstruct Streak'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comeback Challenges */}
      {recoveryFeaturesAvailable && qualifiesForComeback && comebackChallenges.length > 0 && (
        <Card className="border-orange-800/30 bg-orange-900/10" aria-label="comeback-challenges-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="w-5 h-5" />
              Comeback Challenges
            </CardTitle>
            <CardDescription>
              {comebackReason}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {comebackChallenges.map((challenge) => (
                <div key={challenge.name} className="border border-orange-800/30 rounded-lg p-3 bg-orange-900/5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-orange-200">{challenge.name}</h4>
                      <p className="text-sm text-gray-400">{challenge.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">
                        {challenge.xp} XP • {challenge.gold} Gold
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleComebackChallenge(challenge.name)}
                    disabled={loadingAction === `comeback_${challenge.name}`}
                    size="sm"
                    className="w-full bg-orange-600 hover:bg-orange-700"
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