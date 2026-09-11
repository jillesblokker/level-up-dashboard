"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Coins, Shield, Sparkles, Heart, Users, Gift, Crown, Trophy, ArrowUpRight } from 'lucide-react';
import { getCharacterStats, addToCharacterStat } from '@/lib/character-stats-service';

interface AlliancePerkTier {
  tier: number;
  threshold: number;
  title: string;
  beneficiary: string;
  effect: string;
  icon: string;
}

const ALLIANCE_PERK_TIERS: AlliancePerkTier[] = [
  {
    tier: 1,
    threshold: 5000,
    title: 'Novice blessing',
    beneficiary: 'Novice recruits (< Lvl 10)',
    effect: '+15% bonus XP on all completed daily habits',
    icon: '🌱'
  },
  {
    tier: 2,
    threshold: 15000,
    title: 'Prosperous harvest',
    beneficiary: 'All alliance members',
    effect: '+10% bonus gold yield on kingdom tile harvests',
    icon: '🌾'
  },
  {
    tier: 3,
    threshold: 35000,
    title: 'Titan aegis',
    beneficiary: 'All raid combatants',
    effect: '+15 party HP and +5% strike power against Titan Wyrms',
    icon: '🛡️'
  },
  {
    tier: 4,
    threshold: 75000,
    title: 'Welcome treasury grant',
    beneficiary: 'Every newly joined ally',
    effect: 'Automatic 500 Gold starter coffer upon joining the fellowship',
    icon: '🎁'
  }
];

export function AllianceTreasuryCard() {
  const { toast } = useToast();
  const [vaultBalance, setVaultBalance] = useState(12450);
  const [playerGold, setPlayerGold] = useState(0);
  const [isDonating, setIsDonating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load player gold
    const stats = getCharacterStats();
    setPlayerGold(stats.gold || 0);

    // Load communal vault
    const storedVault = localStorage.getItem('thrivehaven_alliance_vault_balance');
    if (storedVault) {
      try {
        setVaultBalance(parseInt(storedVault) || 12450);
      } catch {}
    } else {
      localStorage.setItem('thrivehaven_alliance_vault_balance', '12450');
    }

    const handleStatsUpdate = () => {
      const s = getCharacterStats();
      setPlayerGold(s.gold || 0);
    };

    window.addEventListener('character-stats-update', handleStatsUpdate);
    return () => window.removeEventListener('character-stats-update', handleStatsUpdate);
  }, []);

  const handleDonate = async (amount: number) => {
    if (playerGold < amount) {
      toast({
        title: "Insufficient gold",
        description: `You have ${playerGold} Gold. You need ${amount} Gold to donate this amount.`,
        variant: "destructive"
      });
      return;
    }

    setIsDonating(true);
    try {
      await addToCharacterStat('gold', -amount, 'alliance-treasury-donation');
      const newVault = vaultBalance + amount;
      setVaultBalance(newVault);
      localStorage.setItem('thrivehaven_alliance_vault_balance', String(newVault));

      toast({
        title: "Treasury donation sealed! 🪙",
        description: `Contributed ${amount.toLocaleString()} Gold to the Alliance Vault! The entire fellowship benefits.`,
      });

      window.dispatchEvent(new Event('character-stats-update'));
    } catch {
      toast({
        title: "Donation error",
        description: "Could not transfer gold to the treasury.",
        variant: "destructive"
      });
    } finally {
      setIsDonating(false);
    }
  };

  // Find next perk milestone
  const nextMilestone = ALLIANCE_PERK_TIERS.find(t => vaultBalance < t.threshold) || ALLIANCE_PERK_TIERS[ALLIANCE_PERK_TIERS.length - 1]!;
  const prevThreshold = ALLIANCE_PERK_TIERS[nextMilestone.tier - 2]?.threshold || 0;
  const progressPercent = Math.min(
    100,
    Math.round(((vaultBalance - prevThreshold) / (nextMilestone.threshold - prevThreshold)) * 100)
  );

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-950/40 via-zinc-950 to-zinc-950 border border-amber-500/30 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-amber-900/20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-serif font-bold text-amber-200">
                Alliance treasury & fellowship perks
              </h3>
              <Badge className="bg-amber-950 border-amber-500/40 text-amber-300 text-[10px] font-mono">
                Shared vault
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 font-serif mt-0.5">
              High-level benefactors donate surplus gold to unlock active blessings for the entire alliance — especially empowering novice members.
            </p>
          </div>
        </div>

        {/* Vault Balance Display */}
        <div className="text-left sm:text-right px-3 py-2 rounded-xl bg-zinc-900/80 border border-amber-900/40 shrink-0 w-full sm:w-auto">
          <span className="text-[10px] text-zinc-400 block uppercase font-mono">Total vault balance</span>
          <span className="text-lg font-medieval font-bold text-amber-300 flex items-center gap-1.5 sm:justify-end">
            <Coins className="w-4 h-4 text-amber-400" />
            {vaultBalance.toLocaleString()} Gold
          </span>
        </div>
      </div>

      {/* Vault Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-serif text-zinc-300">
          <span>
            Next blessing: <strong className="text-amber-300">{nextMilestone.title}</strong>
          </span>
          <span className="font-mono text-zinc-400">
            {vaultBalance.toLocaleString()} / {nextMilestone.threshold.toLocaleString()} Gold ({progressPercent}%)
          </span>
        </div>
        <Progress value={progressPercent} className="h-2.5 bg-zinc-900 border border-amber-900/40" />
      </div>

      {/* Perk Tiers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ALLIANCE_PERK_TIERS.map((tier) => {
          const isUnlocked = vaultBalance >= tier.threshold;
          return (
            <div
              key={tier.tier}
              className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${
                isUnlocked
                  ? 'bg-amber-950/25 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : 'bg-zinc-900/60 border-zinc-800 opacity-65'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{tier.icon}</span>
                <Badge
                  className={`text-[9px] font-mono ${
                    isUnlocked
                      ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300 font-bold'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-700'
                  }`}
                >
                  {isUnlocked ? 'Unlocked' : `${tier.threshold.toLocaleString()}g`}
                </Badge>
              </div>

              <div>
                <h4 className="text-xs font-serif font-bold text-amber-200">
                  {tier.title}
                </h4>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Target: {tier.beneficiary}
                </div>
                <p className="text-[11px] text-zinc-300 mt-1 leading-snug font-serif">
                  {tier.effect}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Donation Action Bar */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-900/20">
        <div className="text-xs text-zinc-400 font-serif text-center sm:text-left">
          <span>Your wallet: <strong className="text-amber-300">{playerGold.toLocaleString()} Gold</strong></span>
          <span className="hidden sm:inline mx-2 text-zinc-600">•</span>
          <span className="block sm:inline text-zinc-500">Every piece of gold lifts the next generation of allies.</span>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          {[250, 1000, 5000].map((amt) => (
            <Button
              key={amt}
              size="sm"
              disabled={playerGold < amt || isDonating}
              onClick={() => handleDonate(amt)}
              className="bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-xs font-serif shadow-sm h-8"
            >
              +{amt.toLocaleString()}g
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
