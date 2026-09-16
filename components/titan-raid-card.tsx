"use client"

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Sword, Target, Flame, Crown, CheckCircle2, Zap, Trophy, Gift, Lock, BookOpen } from "lucide-react";
import { getCurrentMonthlyTitan, MonthlyTitan, MONTHLY_TITANS, MONTH_NAMES } from "@/lib/titan-bosses";
import { motion } from "framer-motion";
import { TitanSiegeArsenal } from "@/components/titan-siege-arsenal";
import { TreasureChestVisual } from "@/components/ui/treasure-chest-visual";
import { CollectibleRune } from "@/components/runes/collectible-rune";
import { cn } from "@/lib/utils";

export function TitanRaidCard() {
  const { toast } = useToast();
  const [titan, setTitan] = useState<MonthlyTitan>(getCurrentMonthlyTitan());
  const [damageDealt, setDamageDealt] = useState(0);
  const [remainingHp, setRemainingHp] = useState(1000);
  const [isDefeated, setIsDefeated] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimedTiers, setClaimedTiers] = useState<string[]>([]);
  const [stats, setStats] = useState({ quests: 0, challenges: 0, milestones: 0, petitions: 0 });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showLoreModal, setShowLoreModal] = useState(false);

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
          if (Array.isArray(data.claimedTiers)) setClaimedTiers(data.claimedTiers);
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

  const handleClaimTier = async (tier: 'bronze' | 'silver' | 'gold' | 'mythic') => {
    if (claiming) return;
    setClaiming(true);
    try {
      const res = await fetch('/api/alliance/titan-raid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim_tier', tier })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (Array.isArray(data.claimedTiers)) setClaimedTiers(data.claimedTiers);
        if (tier === 'mythic' || data.claimedTiers?.length === 4) setClaimed(true);
        if (typeof window !== 'undefined') {
          import('canvas-confetti').then(c => c.default({ particleCount: 80, spread: 70, origin: { y: 0.6 } })).catch(() => {});
        }
        toast({ title: "🏆 Victory chest claimed!", description: data.message });
      } else {
        toast({ title: "Claim failed", description: data.error || "Failed to claim rewards.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to connect to server.", variant: "destructive" });
    } finally {
      setClaiming(false);
    }
  };

  const handleClaim = () => handleClaimTier('mythic');

  const hpPercentage = Math.round(((titan.totalHp - remainingHp) / titan.totalHp) * 100);

  const getElementalBiomeStyle = (element: string) => {
    const el = element.toLowerCase();
    if (el.includes('fire')) {
      return {
        gradient: 'from-amber-950/90 via-red-950/70 to-zinc-950',
        border: 'border-orange-500/50',
        glow: 'shadow-[0_0_30px_rgba(249,115,22,0.35)]',
        accentText: 'text-orange-400',
        auraDot: 'bg-orange-500/20'
      };
    }
    if (el.includes('ice') || el.includes('water')) {
      return {
        gradient: 'from-cyan-950/90 via-blue-950/70 to-zinc-950',
        border: 'border-cyan-500/50',
        glow: 'shadow-[0_0_30px_rgba(6,182,212,0.35)]',
        accentText: 'text-cyan-400',
        auraDot: 'bg-cyan-500/20'
      };
    }
    if (el.includes('cosmic') || el.includes('undead')) {
      return {
        gradient: 'from-purple-950/90 via-indigo-950/70 to-zinc-950',
        border: 'border-purple-500/50',
        glow: 'shadow-[0_0_30px_rgba(168,85,247,0.35)]',
        accentText: 'text-purple-400',
        auraDot: 'bg-purple-500/20'
      };
    }
    if (el.includes('nature') || el.includes('earth')) {
      return {
        gradient: 'from-emerald-950/90 via-amber-950/70 to-zinc-950',
        border: 'border-emerald-500/50',
        glow: 'shadow-[0_0_30px_rgba(16,185,129,0.35)]',
        accentText: 'text-emerald-400',
        auraDot: 'bg-emerald-500/20'
      };
    }
    return {
      gradient: 'from-amber-950/90 via-yellow-950/70 to-zinc-950',
      border: 'border-amber-500/50',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.35)]',
      accentText: 'text-amber-400',
      auraDot: 'bg-amber-500/20'
    };
  };

  const biome = getElementalBiomeStyle(titan.element);

  return (
    <>
    <Card className="bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 border-purple-900/40 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[90px] pointer-events-none" />
      <CardHeader className="p-5 pb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-purple-900/60 text-purple-300 border border-purple-500/40 px-2.5 py-1 text-xs font-medium">
              ⚔️ Monthly raid
            </Badge>
            <CollectibleRune
              id="thurisaz_raid"
              runeId="thurisaz"
              symbol="ᚦ"
              name="Thurisaz"
              meaning="Thor's hammer, giant-slayer & primal force"
              className="text-red-400"
            />
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-300/90 bg-amber-950/30 font-medium">
              {MONTH_NAMES[titan.monthIndex]}
            </Badge>
            {remainingHp < titan.totalHp / 2 && !isDefeated && (
              <Badge className="bg-red-950 text-red-300 border border-red-500/50 text-[10px] font-bold animate-pulse">
                ⚠️ Angry (+30% dmg)
              </Badge>
            )}
            {isDefeated && (
              <Badge className="bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 font-bold text-[10px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Boss defeated!
              </Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLoreModal(true)}
            className="h-7 text-xs text-amber-300/90 border-amber-900/50 bg-amber-950/20 hover:bg-amber-900/40 hover:text-amber-200 rounded-lg flex items-center gap-1.5 px-2.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>All 12 titans</span>
          </Button>
        </div>

        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <CardTitle className="text-xl sm:text-2xl font-serif font-bold text-amber-300">
              {titan.name}
            </CardTitle>
            <span className="text-xs font-serif text-amber-400/80 italic font-medium">
              • {titan.title}
            </span>
          </div>
        </div>

        {/* Narrative Threat Intro Banner */}
        <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-zinc-950/90 to-purple-950/40 p-3 sm:p-3.5 shadow-inner">
          <div className="flex items-start gap-2.5">
            <span className="text-base sm:text-lg select-none shrink-0 mt-0.5">📜</span>
            <div className="space-y-1">
              <div className="text-xs font-medium text-amber-400/90 flex items-center gap-1.5">
                <span>Realm threat dispatch</span>
                <span className="text-zinc-500">•</span>
                <span className="font-normal text-zinc-400 font-sans capitalize">{titan.element} elemental threat</span>
              </div>
              <p className="text-xs sm:text-[13px] text-zinc-200 font-serif italic leading-relaxed">
                &ldquo;{titan.storyIntro || titan.description}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0">
        {/* 2x2 Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Bento Card 1: Titan Image & Elemental Arena (Top Left, col-span-5) */}
          <div className="lg:col-span-5 flex flex-col">
            <motion.div 
              initial={{ scale: 0.98, opacity: 0.9 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={cn(
                "relative w-full h-full min-h-[320px] sm:min-h-[360px] rounded-2xl overflow-hidden border-2 shadow-2xl p-6 sm:p-8 flex flex-col items-center justify-center group bg-gradient-to-b",
                biome.gradient,
                biome.border,
                biome.glow
              )}
            >
              {/* Radial Aura Glow */}
              <div className={cn("absolute inset-0 rounded-2xl blur-2xl opacity-40 pointer-events-none animate-pulse", biome.auraDot)} />
              
              {/* Elemental Realm Badge */}
              <div className="absolute top-3 right-3 z-20">
                <Badge variant="outline" className={cn("text-xs font-mono font-medium border", biome.border, biome.accentText, "bg-zinc-950/80")}>
                  {titan.element} realm
                </Badge>
              </div>

              <Image
                src={titan.image}
                alt={titan.name}
                width={500}
                height={500}
                className={`relative z-10 w-auto max-h-[240px] sm:max-h-[270px] object-contain rounded-xl transition-all duration-700 drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)] my-auto ${isDefeated ? 'opacity-70 filter drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]' : 'group-hover:scale-105'}`}
                unoptimized
              />

              {/* Victory Overlay when Defeated */}
              {isDefeated && (
                <div className="absolute inset-0 z-30 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-amber-950/40 flex flex-col items-center justify-center text-center p-4 rounded-xl space-y-2 border-2 border-amber-500/50">
                  <Trophy className="w-10 h-10 text-amber-400 animate-bounce drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                  <h3 className="text-lg font-serif font-extrabold text-amber-300 drop-shadow-md">
                    🏆 Titan defeated!
                  </h3>
                  <p className="text-xs text-zinc-300 max-w-md font-medium">
                    Victory achieved through team habit momentum!
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Bento Card 2: Siege Weapons (Top Right, col-span-7) */}
          <div className="lg:col-span-7 flex flex-col">
            <TitanSiegeArsenal className="h-full flex flex-col justify-between" />
          </div>

          {/* Bento Card 3: Boss Health, Habit Contributions & Raid Guide (Bottom Left, col-span-5) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-zinc-900/60 border border-purple-900/40 shadow-lg space-y-4">
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-zinc-300 flex items-center gap-1.5">
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
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
                  <span className="text-zinc-300 font-medium">Royal petitions (+15 HP)</span>
                  <span className="text-rose-400 font-bold font-mono text-sm">{stats.petitions || 0}</span>
                </div>
              </div>
            </div>

            {/* Habit Building Guidance Banner */}
            <div className="bg-purple-950/40 p-3 rounded-xl border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2.5 mt-auto">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Raid strikes:</span> Completing habits and decrees damages the boss! Quests (+1 HP), challenges (+5 HP), milestones (+10 HP), and royal petitions (+15 HP).
              </div>
            </div>
          </div>

          {/* Bento Card 4: Titan Raid Milestone Victory Loot (Bottom Right, col-span-7) */}
          <div className="lg:col-span-7 flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-purple-950/40 via-zinc-950 to-zinc-950 border border-purple-800/40 shadow-xl space-y-4">
            <div className="text-center space-y-1">
              <div className="font-serif font-bold text-base sm:text-lg text-amber-300">
                Milestone victory chests
              </div>
              <p className="text-xs text-zinc-400 font-sans">
                Unlock 4 reward tiers as your fellowship inflicts cumulative habit damage
              </p>
            </div>

            {/* 4-Tier Milestone Chest Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { key: 'bronze', label: 'Bronze chest', threshold: 25, gold: 250, gems: 5, icon: '🥉' },
                { key: 'silver', label: 'Silver chest', threshold: 50, gold: 500, gems: 10, icon: '🥈' },
                { key: 'gold', label: 'Gold chest', threshold: 75, gold: 1000, gems: 20, icon: '🥇' },
                { key: 'mythic', label: 'Mythic chest', threshold: 100, gold: titan.rewardGold, gems: titan.rewardGems, icon: '👑' }
              ].map((tier) => {
                const isUnlocked = hpPercentage >= tier.threshold;
                const isClaimed = claimedTiers.includes(tier.key);

                return (
                  <div
                    key={tier.key}
                    className={cn(
                      "flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center space-y-2",
                      isClaimed
                        ? "bg-zinc-900/60 border-zinc-800 opacity-80"
                        : isUnlocked
                          ? "bg-amber-950/40 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse"
                          : "bg-zinc-950/80 border-zinc-800/80 opacity-60"
                    )}
                  >
                    <div className="text-2xl">{tier.icon}</div>
                    <div>
                      <div className="font-serif font-bold text-xs text-amber-200">{tier.label}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{tier.threshold}% HP</div>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-amber-400">
                      +{tier.gold}g / +{tier.gems}💎
                    </div>
                    <Button
                      size="sm"
                      variant={isClaimed ? "secondary" : isUnlocked ? "default" : "outline"}
                      disabled={!isUnlocked || isClaimed || claiming}
                      onClick={() => handleClaimTier(tier.key as any)}
                      className={cn(
                        "w-full text-[10px] font-serif py-1 h-7 rounded-lg",
                        isClaimed
                          ? "bg-zinc-800 text-zinc-400 cursor-default"
                          : isUnlocked
                            ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shadow-sm"
                            : "border-zinc-800 text-zinc-500"
                      )}
                    >
                      {isClaimed ? 'Claimed' : isUnlocked ? 'Claim' : 'Locked'}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Overall Defeat Status / Notice */}
            <div className="pt-2 text-center text-xs text-zinc-400">
              {isDefeated ? (
                <span className="text-emerald-400 font-medium">✨ Titan Wyrm repelled! Claim any remaining victory chests above.</span>
              ) : (
                <span>Complete daily habits to deal strike damage and unlock the next milestone chest!</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* 12 Monthly Titans Threat Lore Modal */}
    <Dialog open={showLoreModal} onOpenChange={setShowLoreModal}>
      <DialogContent className="max-w-2xl bg-zinc-950 border border-amber-900/60 text-white rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-amber-400">
            <BookOpen className="w-5 h-5" />
            <DialogTitle className="text-lg sm:text-xl font-serif font-bold text-amber-300">
              Monthly titan raid chronicle
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Twelve primal titans threaten the realm across the year. Rally with your fellowship allies to repel each sovereign!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-3">
          {MONTHLY_TITANS.map((t) => {
            const isCurrent = t.monthIndex === titan.monthIndex;
            return (
              <div
                key={t.monthIndex}
                className={cn(
                  "rounded-xl border p-3.5 transition-all flex flex-col sm:flex-row items-start gap-3.5",
                  isCurrent
                    ? "bg-gradient-to-r from-amber-950/50 via-zinc-900 to-purple-950/40 border-amber-500/60 shadow-lg shadow-amber-950/30"
                    : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                )}
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 flex items-center justify-center self-center sm:self-start">
                  <Image
                    src={t.image}
                    alt={t.name}
                    width={80}
                    height={80}
                    className="object-contain w-full h-full"
                    unoptimized
                  />
                  {isCurrent && (
                    <span className="absolute top-1 right-1 bg-amber-500 text-zinc-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                      Current
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-1.5 w-full">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-300 bg-amber-950/40 font-semibold">
                        {MONTH_NAMES[t.monthIndex]}
                      </Badge>
                      <span className="text-sm font-serif font-bold text-zinc-100">
                        {t.name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[9px] text-zinc-400 border-zinc-700 bg-zinc-950">
                      {t.element} realm
                    </Badge>
                  </div>

                  <div className="text-[11px] text-amber-400/80 font-serif italic">
                    • {t.title}
                  </div>

                  <p className="text-xs text-zinc-200 font-serif italic leading-relaxed bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                    &ldquo;{t.storyIntro}&rdquo;
                  </p>

                  <div className="flex items-center justify-between pt-0.5 text-[10px] text-zinc-400 font-mono flex-wrap gap-2">
                    <span className="text-zinc-500">HP: {t.totalHp.toLocaleString()}</span>
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-amber-400">🪙 +{t.rewardGold} gold</span>
                      <span className="text-purple-400">💎 +{t.rewardGems} gems</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
