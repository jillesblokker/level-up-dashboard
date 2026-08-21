"use client"

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Sword, Target, Flame, Crown, CheckCircle2, Zap, Trophy, Gift, Lock } from "lucide-react";
import { getCurrentMonthlyTitan, MonthlyTitan } from "@/lib/titan-bosses";
import { motion } from "framer-motion";
import { TitanSiegeArsenal } from "@/components/titan-siege-arsenal";
import { TreasureChestVisual } from "@/components/ui/treasure-chest-visual";

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

  const hpPercentage = Math.round(((titan.totalHp - remainingHp) / titan.totalHp) * 100);

  return (
    <Card className="bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 border-purple-900/40 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[90px] pointer-events-none" />
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-900/60 text-purple-300 border border-purple-500/40 px-2.5 py-1 uppercase text-[10px] tracking-widest font-bold">
              ⚔️ Monthly raid
            </Badge>
            {remainingHp < titan.totalHp / 2 && !isDefeated && (
              <Badge className="bg-red-950 text-red-300 border border-red-500/50 text-[10px] font-bold animate-pulse">
                ⚠️ Angry (+30% dmg)
              </Badge>
            )}
          </div>
          {isDefeated && (
            <Badge className="bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Boss defeated!
            </Badge>
          )}
        </div>
        <CardTitle className="text-2xl font-serif font-bold text-amber-300 flex items-center gap-2">
          {titan.name}
        </CardTitle>
        <CardDescription className="text-zinc-400 text-xs">
          {titan.title}: {titan.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 pt-0">
        <div className="flex flex-col md:grid md:grid-cols-12 md:gap-6 md:items-start space-y-4 md:space-y-0">
          {/* Left Column (Desktop): Boss Image Banner, Health Section & Vertical Stats */}
          <div className="md:col-span-5 space-y-4">
            <motion.div 
              initial={{ scale: 0.98, opacity: 0.9 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-full rounded-2xl overflow-hidden border border-purple-500/40 shadow-2xl bg-zinc-950 p-2 flex items-center justify-center group"
            >
              <Image
                src={titan.image}
                alt={titan.name}
                width={500}
                height={500}
                className={`w-full max-h-[220px] md:max-h-[260px] object-contain rounded-xl transition-all duration-700 ${isDefeated ? 'opacity-70 filter drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]' : 'group-hover:scale-102'}`}
                unoptimized
              />

              {/* Victory Overlay when Defeated */}
              {isDefeated && (
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-amber-950/40 flex flex-col items-center justify-center text-center p-4 rounded-xl space-y-2 border-2 border-amber-500/50">
                  <Trophy className="w-10 h-10 text-amber-400 animate-bounce drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                  <h3 className="text-lg font-serif font-extrabold text-amber-300 drop-shadow-md">
                    🏆 Titan Defeated!
                  </h3>
                  <p className="text-xs text-zinc-300 max-w-md font-medium">
                    Victory achieved through team habit momentum!
                  </p>
                </div>
              )}
            </motion.div>

            {/* Boss HP Progress & Vertically Stacked Stats Section (Below Boss Image) */}
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-purple-900/40 space-y-3.5 shadow-md">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-purple-400" /> Boss health
                </span>
                <span className="text-purple-300 font-mono">
                  {remainingHp} / {titan.totalHp} HP ({100 - hpPercentage}% left)
                </span>
              </div>

              <Progress value={hpPercentage} className="h-3.5 bg-zinc-950 border border-purple-500/30 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-amber-500" />

              {/* Vertically Stacked Quest, Task & Goal Stats */}
              <div className="flex flex-col gap-2 pt-1 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
                  <span className="text-zinc-300 font-medium">Daily quests (+1 HP)</span>
                  <span className="text-amber-400 font-bold font-mono text-sm">{stats.quests}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
                  <span className="text-zinc-300 font-medium">Weekly challenges (+5 HP)</span>
                  <span className="text-purple-400 font-bold font-mono text-sm">{stats.challenges}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
                  <span className="text-zinc-300 font-medium">Milestones (+10 HP)</span>
                  <span className="text-emerald-400 font-bold font-mono text-sm">{stats.milestones}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Desktop): Guidance, Arsenal & Loot Claiming */}
          <div className="md:col-span-7 space-y-4">
            {/* Habit Building Guidance Banner */}
            <div className="bg-purple-950/40 p-3 rounded-xl border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Habit Raid Damage:</span> Completing real-life habits damages the boss! Quests (+1 HP), Tasks (+5 HP), and Goals (+10 HP).
              </div>
            </div>

            {/* 10 Siege Engine Slots Arsenal */}
            <TitanSiegeArsenal />

            {/* Claim Rewards Footer with Animated Treasure Chest */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-gradient-to-b from-purple-950/40 via-zinc-950 to-zinc-950 border border-purple-800/40 shadow-lg text-center">
              <TreasureChestVisual
                state={claimed ? 'claimed' : (isDefeated ? 'ready' : 'locked')}
                tierLabel="Titan Victory Chest"
                tierColor="from-purple-800 via-amber-900 to-zinc-950"
                className="w-full max-w-xs h-32 mb-2"
                onClick={() => isDefeated && !claimed && handleClaim()}
              />

              <div className="w-full space-y-2">
                <div className="font-serif font-bold text-sm text-amber-300">Titan Raid Victory Loot</div>
                <div className="flex items-center justify-center gap-3 text-xs font-mono font-bold">
                  <span className="text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-full">
                    🪙 +{titan.rewardGold} Gold
                  </span>
                  <span className="text-purple-300 bg-purple-950/60 border border-purple-500/40 px-2.5 py-1 rounded-full">
                    💎 +{titan.rewardGems} Gems
                  </span>
                </div>

                <div className="pt-2">
                  <Button
                    disabled={!isDefeated || claimed || claiming}
                    onClick={handleClaim}
                    className={claimed 
                      ? "w-full bg-zinc-900 text-zinc-400 border border-zinc-800 py-3 rounded-xl min-h-[44px]" 
                      : isDefeated 
                        ? "w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black shadow-[0_0_25px_rgba(245,158,11,0.4)] py-3 rounded-xl min-h-[44px] animate-bounce" 
                        : "w-full bg-zinc-900 text-zinc-500 border border-zinc-800 py-3 rounded-xl min-h-[44px]"
                    }
                  >
                    {claimed ? (
                      <span className="flex items-center justify-center gap-1.5 font-bold"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Monthly Reward Claimed</span>
                    ) : isDefeated ? (
                      <span className="flex items-center justify-center gap-1.5 font-extrabold text-base"><Trophy className="w-5 h-5" /> Claim Victory Loot</span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5 font-bold font-mono text-xs"><Lock className="w-4 h-4" /> Defeat Titan Wyrm to Unlock</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
        </div>
      </div>
    </CardContent>
    </Card>
  );
}
