"use client"

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Sword, Target, Flame, Crown, CheckCircle2, Zap, Trophy, Gift } from "lucide-react";
import { getCurrentMonthlyTitan, MonthlyTitan } from "@/lib/titan-bosses";

export function TitanRaidCard() {
  const { toast } = useToast();
  const [titan, setTitan] = useState<MonthlyTitan>(getCurrentMonthlyTitan());
  const [damageDealt, setDamageDealt] = useState(0);
  const [remainingHp, setRemainingHp] = useState(1000);
  const [isDefeated, setIsDefeated] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [stats, setStats] = useState({ quests: 0, challenges: 0, milestones: 0 });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const fetchRaidStatus = async () => {
      try {
        const res = await fetch('/api/alliance/titan-raid');
        if (res.ok) {
          const data = await res.json();
          if (data.titan) setTitan(data.titan);
          setDamageDealt(data.damageDealt || 0);
          setRemainingHp(data.remainingHp ?? 1000);
          setIsDefeated(!!data.isDefeated);
          setClaimed(!!data.claimed);
          if (data.stats) setStats(data.stats);
        }
      } catch (err) {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };
    fetchRaidStatus();
  }, []);

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const res = await fetch('/api/alliance/titan-raid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClaimed(true);
        toast({ title: "🏆 Titan Rewards Claimed!", description: data.message });
      } else {
        toast({ title: "Claim Error", description: data.error || "Failed to claim rewards.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to connect to server.", variant: "destructive" });
    } finally {
      setClaiming(false);
    }
  };

  const handleFocusRaidSurge = async () => {
    try {
      const { getCharacterStats, addToCharacterStat } = await import('@/lib/character-stats-service');
      const stats = getCharacterStats();
      if ((stats.focus_points || 0) < 5) {
        toast({
          title: "Insufficient Focus Points 🧠",
          description: "You need 5 Focus Points to trigger Titan Raid Surge!",
          variant: "destructive"
        });
        return;
      }
      await addToCharacterStat('focus_points', -5, 'focus-titan-surge');
      setDamageDealt(prev => prev + 500);
      setRemainingHp(prev => Math.max(0, prev - 500));
      if (remainingHp <= 500) setIsDefeated(true);
      toast({
        title: "🧠 Titan Raid Surge Unleashed!",
        description: "Spent 5 Focus Points. Dealt +500 Massive Damage to Titan!"
      });
    } catch (err: any) {
      toast({ title: "Surge Error", description: err.message, variant: "destructive" });
    }
  };

  const hpPercentage = Math.round(((titan.totalHp - remainingHp) / titan.totalHp) * 100);

  return (
    <Card className={`bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 border-purple-900/40 shadow-xl overflow-hidden relative ${isDefeated ? 'animate-card-shatter-top opacity-90' : ''}`}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[90px] pointer-events-none" />
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-900/60 text-purple-300 border border-purple-500/40 px-2.5 py-1 uppercase text-[10px] tracking-widest font-bold">
              ⚔️ Alliance Monthly Raid
            </Badge>
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px] font-bold">
              {titan.element} Element
            </Badge>
            {remainingHp < titan.totalHp / 2 && !isDefeated && (
              <Badge className="bg-red-950 text-red-300 border border-red-500/50 text-[10px] font-bold animate-pulse">
                ⚠️ Phase 2: Enraged (+30% ATK Dmg)
              </Badge>
            )}
          </div>
          {isDefeated && (
            <Badge className="bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> TITAN DEFEATED!
            </Badge>
          )}
        </div>
        <CardTitle className="text-2xl font-serif font-bold text-amber-300 mt-2 flex items-center gap-2">
          {titan.name}
        </CardTitle>
        <CardDescription className="text-zinc-400 text-xs">
          {titan.title} — {titan.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-4">
        {/* Boss Portrait & HP Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
          <div className="relative aspect-square w-full max-w-[140px] mx-auto rounded-lg overflow-hidden border-2 border-purple-500/40 shadow-md">
            <Image
              src={titan.image}
              alt={titan.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="md:col-span-2 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-400" /> Titan Health (1,000 HP)
              </span>
              <span className="text-purple-300 font-mono">
                {remainingHp} / {titan.totalHp} HP ({100 - hpPercentage}% remaining)
              </span>
            </div>

            <Progress value={hpPercentage} className="h-3.5 bg-zinc-950 border border-purple-500/30 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-amber-500" />

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <div className="text-zinc-400 text-[10px]">Quests (1 dmg)</div>
                <div className="text-amber-400 font-bold font-mono">{stats.quests}</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <div className="text-zinc-400 text-[10px]">Challenges (5 dmg)</div>
                <div className="text-purple-400 font-bold font-mono">{stats.challenges}</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <div className="text-zinc-400 text-[10px]">Milestones (10 dmg)</div>
                <div className="text-emerald-400 font-bold font-mono">{stats.milestones}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Claim Rewards Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-purple-950/30 border border-purple-800/40">
          <div className="flex items-center gap-2 text-xs">
            <Gift className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-300">Defeat Reward:</span>
            <span className="text-amber-400 font-bold">🪙 +{titan.rewardGold} Gold</span>
            <span className="text-purple-300 font-bold">💎 +{titan.rewardGems} Gems</span>
          </div>

          <div className="flex items-center gap-2">
            {!isDefeated && (
              <Button
                onClick={handleFocusRaidSurge}
                className="bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                🧠 Spend 5 Focus Points: +500 Dmg Surge
              </Button>
            )}

            <Button
              disabled={!isDefeated || claimed || claiming}
              onClick={handleClaim}
              className={claimed ? "bg-zinc-800 text-zinc-400 border border-zinc-700" : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold shadow-md"}
            >
              {claimed ? (
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Reward Claimed</span>
              ) : isDefeated ? (
                <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4" /> Claim Victory Rewards</span>
              ) : (
                <span className="flex items-center gap-1.5"><Sword className="w-4 h-4" /> Attack Titan ({damageDealt}/1000 HP)</span>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
