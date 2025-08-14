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
            console.error('Comeback challenges API returned non-JSON response');
          }
        } else {
          console.error('Comeback challenges API error:', res.status, res.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch comeback challenges:', error);
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Streak Recovery System - Takes 2/3 width on desktop */}
        <div className="lg:col-span-2">
                          <Card className="medieval-card-royal h-full shadow-lg" aria-label="streak-recovery-status-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-blue-200">
                <Heart className="w-6 h-6 text-blue-400" />
                Streak Recovery System
              </CardTitle>
              <CardDescription className="text-blue-300/80 text-base leading-relaxed">
                Build resilience and protect your streaks with recovery tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Resilience Points */}
                <div className="text-center p-4 rounded-lg bg-blue-900/20 border border-blue-800/30">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm font-semibold text-blue-200">Resilience Points</span>
                  </div>
                  <div className="text-3xl font-bold text-yellow-400 mb-2">{resiliencePoints}</div>
                  <div className="text-xs text-blue-300/70 leading-relaxed">Earned by completing weeks</div>
                </div>

                {/* Safety Net Status */}
                <div className="text-center p-4 rounded-lg bg-green-900/20 border border-green-800/30">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Shield className={`w-5 h-5 ${safetyNetUsed ? 'text-gray-400' : 'text-green-400'}`} />
                    <span className="text-sm font-semibold text-green-200">Safety Net</span>
                  </div>
                  <Badge variant={safetyNetUsed ? 'outline' : 'default'} className={`mb-2 ${safetyNetUsed ? 'text-gray-400 border-gray-600' : 'text-green-400 bg-green-900/50 border-green-600'}`}>
                    {safetyNetUsed ? 'Used This Week' : 'Available'}
                  </Badge>
                  <div className="text-xs text-green-300/70 leading-relaxed">
                    Missed days: {missedDaysThisWeek}/1
                  </div>
                </div>

                {/* Max Streak */}
                <div className="text-center p-4 rounded-lg bg-purple-900/20 border border-purple-800/30">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Award className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-semibold text-purple-200">Best Streak</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-400 mb-2">{maxStreakAchieved}</div>
                  <div className="text-xs text-purple-300/70 leading-relaxed">days achieved</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Safety Net Action - Takes 1/3 width on desktop */}
        {recoveryFeaturesAvailable && !safetyNetUsed && missedDaysThisWeek === 0 && (
          <div className="lg:col-span-1">
                            <Card className="medieval-card-deep h-full shadow-lg" aria-label="safety-net-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-green-200">
                  <Shield className="w-6 h-6 text-green-400" />
                  Safety Net Available
                </CardTitle>
                <CardDescription className="text-green-300/80 text-base leading-relaxed">
                  Protect your streak from the first missed day this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleUseSafetyNet}
                  disabled={loadingAction === 'safety_net'}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base transition-all duration-200 shadow-lg hover:shadow-xl"
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