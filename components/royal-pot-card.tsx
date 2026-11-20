"use client";

import React, { useState, useEffect, useCallback } from "react";
import NextImage from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { unwrapApiResponse } from "@/lib/api-response-unwrapper";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { formatGold } from "@/lib/utils";
import { hapticMedium, hapticHeavy } from "@/lib/haptics";
import { toast } from "sonner";
import { Crown, Sparkles, Clock, ShieldCheck, Trophy, HelpCircle, ArrowRight, CheckCircle2, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface Champion {
  id: string;
  name: string;
  avatar: string;
  habitsCount: number;
  sharePercent: number;
  projectedGold: number;
  isCurrentUser?: boolean;
}

interface RoyalPotData {
  currentMonthKey: string;
  monthName: string;
  year: number;
  daysRemaining: number;
  hoursRemaining: number;
  totalPotGold: number;
  championsPool: number;
  dividendPool: number;
  baseTreasuryGold: number;
  userStats: {
    isPledged: boolean;
    hasClaimed: boolean;
    userHabits: number;
    activeDays: number;
    targetDays: number;
    isDividendEligible: boolean;
    userRank: number;
    isInTop5: boolean;
    projectedTop5Gold: number;
    projectedDividendGold: number;
  };
  top5: Champion[];
}

export function RoyalPotCard() {
  const [data, setData] = useState<RoyalPotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPledging, setIsPledging] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  const fetchPotData = useCallback(async () => {
    try {
      const res = await fetch("/api/royal-pot");
      if (res.ok) {
        const json = await res.json();
        const unwrapped = unwrapApiResponse(json) as RoyalPotData;
        if (unwrapped) {
          setData(unwrapped);
        }
      }
    } catch (err) {
      console.warn("Error fetching royal pot status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPotData();
  }, [fetchPotData]);

  const handlePledge = async () => {
    if (isPledging || data?.userStats.isPledged) return;
    setIsPledging(true);

    try {
      hapticMedium();
      const res = await fetch("/api/royal-pot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pledge" }),
      });

      if (res.ok) {
        import("canvas-confetti").then((m) =>
          m.default({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#f59e0b", "#fbbf24", "#d97706", "#ffffff"],
          })
        ).catch(() => {});

        toast.success("Pledge accepted", {
          description: "You joined this month's royal pot!",
        });

        // Trigger character stats reload to update treasury gold
        window.dispatchEvent(new CustomEvent("character-stats-update"));
        await fetchPotData();
      } else {
        toast.error("Pledge failed", {
          description: "Could not record pledge. Please try again.",
        });
      }
    } catch {
      toast.error("Pledge failed");
    } finally {
      setIsPledging(false);
    }
  };

  const handleClaim = async () => {
    if (isClaiming || data?.userStats.hasClaimed) return;
    setIsClaiming(true);

    try {
      hapticHeavy();
      const res = await fetch("/api/royal-pot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim" }),
      });

      if (res.ok) {
        import("canvas-confetti").then((m) =>
          m.default({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5 },
            colors: ["#f59e0b", "#10b981", "#3b82f6", "#ffffff"],
          })
        ).catch(() => {});

        toast.success("Royal dividend claimed", {
          description: "Gold added to your kingdom treasury!",
        });

        window.dispatchEvent(new CustomEvent("character-stats-update"));
        await fetchPotData();
      }
    } catch {
      toast.error("Claim failed");
    } finally {
      setIsClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full rounded-2xl bg-zinc-950/80 border border-amber-900/30 p-8 flex items-center justify-center animate-pulse">
        <div className="flex items-center gap-3 text-amber-400 font-serif text-sm">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Opening the royal vault...</span>
        </div>
      </div>
    );
  }

  const pot = data || {
    currentMonthKey: "current",
    monthName: "This month",
    year: 2026,
    daysRemaining: 10,
    hoursRemaining: 14,
    totalPotGold: 7450,
    championsPool: 4470,
    dividendPool: 2980,
    baseTreasuryGold: 5000,
    userStats: {
      isPledged: false,
      hasClaimed: false,
      userHabits: 12,
      activeDays: 6,
      targetDays: 15,
      isDividendEligible: false,
      userRank: 4,
      isInTop5: true,
      projectedTop5Gold: 223,
      projectedDividendGold: 248,
    },
    top5: [
      { id: "1", name: "Lyra Moonwhisper", avatar: "/images/creatures/AstralWolf.webp", habitsCount: 42, sharePercent: 25, projectedGold: 1118 },
      { id: "2", name: "Torin Ironheart", avatar: "/images/creatures/ArmoredBear.webp", habitsCount: 36, sharePercent: 15, projectedGold: 671 },
      { id: "3", name: "Elena Sunstrider", avatar: "/images/creatures/GoldenGriffon.webp", habitsCount: 30, sharePercent: 10, projectedGold: 447 },
      { id: "4", name: "You", avatar: "/images/character/hero-portrait.webp", habitsCount: 12, sharePercent: 5, projectedGold: 223, isCurrentUser: true },
      { id: "5", name: "Rowan Silverbranch", avatar: "/images/creatures/SpiritSprite.webp", habitsCount: 9, sharePercent: 5, projectedGold: 223 },
    ],
  };

  const { userStats } = pot;
  const daysProgress = Math.min(100, Math.round((userStats.activeDays / userStats.targetDays) * 100));

  return (
    <div className="w-full space-y-4">
      {/* Main Bento Tile Container */}
      <div className="rounded-2xl bg-zinc-950/95 border border-amber-900/40 shadow-2xl overflow-hidden relative group">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Banner with Royal Pot Artwork */}
        <div className="relative h-36 sm:h-44 md:h-48 w-full overflow-hidden border-b border-amber-900/30">
          <NextImage
            src="/images/headers/royal-pot-header.webp"
            alt="Royal pot"
            fill
            priority
            className="object-cover object-center filter brightness-90 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-transparent to-zinc-950/90" />

          {/* Banner Overlays & Live Indicators */}
          <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-500/40 bg-black/60 shadow-inner flex items-center justify-center shrink-0">
                  <NextImage
                    src="/images/items/materials/royal-token.webp"
                    alt="Royal token"
                    width={28}
                    height={28}
                    className="object-contain p-0.5"
                  />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-serif text-amber-300 drop-shadow-md">
                    Royal pot
                  </h3>
                  <p className="text-[11px] text-amber-200/80 font-sans">
                    {pot.monthName} {pot.year} shared bounty
                  </p>
                </div>
              </div>

              {/* Time Remaining Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-amber-500/40 text-[11px] font-mono text-amber-300 font-bold shadow-lg backdrop-blur-md">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: "8s" }} />
                <span>
                  {pot.daysRemaining}d {pot.hoursRemaining}h left
                </span>
              </div>
            </div>

            {/* Live Pot Counter Display */}
            <div className="flex items-baseline gap-2">
              <div className="text-2xl sm:text-4xl font-extrabold text-white font-mono tracking-tight drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
                <AnimatedNumber value={pot.totalPotGold} formatFn={formatGold} />
              </div>
              <span className="text-xs sm:text-sm text-amber-400 font-serif font-bold uppercase tracking-wider">
                gold in vault
              </span>
              <span className="hidden sm:inline-block text-[11px] text-zinc-400 font-sans ml-2">
                (Crown seed: {pot.baseTreasuryGold} gold)
              </span>
            </div>
          </div>
        </div>

        {/* Bento Content Grid: Left Command + Right Top 5 Leaderboard */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Column (7 cols): User status, pledge, and consistency dividend */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            {/* Split Information Banner */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                  <NextImage
                    src="/images/items/artifacts/royal-pot-chest.webp"
                    alt="Royal pot chest"
                    width={44}
                    height={44}
                    className="object-contain p-1 animate-pulse"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-300 font-serif text-xs">
                      Shared bounty rules
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowRulesModal(true)}
                      className="text-zinc-400 hover:text-amber-300 transition-colors inline-flex items-center"
                      title="View pot rules"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug">
                    <strong className="text-amber-400">60%</strong> shared by the top 5 habit champions •{" "}
                    <strong className="text-emerald-400">40%</strong> split by all active champions (15+ days).
                  </p>
                </div>
              </div>
            </div>

            {/* Consistency Goal: 15 Active Days */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">{userStats.isDividendEligible ? "🛡️" : "🎯"}</span>
                  <span className="font-bold text-white font-serif">
                    Monthly consistency dividend
                  </span>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border",
                    userStats.isDividendEligible
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                      : "bg-amber-950/40 text-amber-300 border-amber-500/30"
                  )}
                >
                  {userStats.activeDays} / {userStats.targetDays} days active
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                  <div
                    className={cn(
                      "h-full transition-all duration-700 ease-out",
                      userStats.isDividendEligible
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                        : "bg-gradient-to-r from-amber-600 to-yellow-400"
                    )}
                    style={{ width: `${daysProgress}%` }}
                  />
                </div>
                <span className="font-mono text-xs font-bold text-amber-400 shrink-0">
                  {daysProgress}%
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                <span>
                  {userStats.isDividendEligible
                    ? "✓ Qualified for 40% dividend distribution"
                    : `${userStats.targetDays - userStats.activeDays} more active days to qualify for dividend`}
                </span>
                <span className="text-emerald-400 font-mono font-bold shrink-0">
                  ~+{pot.userStats.projectedDividendGold} gold
                </span>
              </div>
            </div>

            {/* Action Buttons: Pledge & Modal Trigger */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <Button
                onClick={handlePledge}
                disabled={userStats.isPledged || isPledging}
                className={cn(
                  "w-full sm:w-auto flex-1 h-11 text-xs font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2",
                  userStats.isPledged
                    ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 cursor-default"
                    : "btn-primary-cta"
                )}
              >
                {userStats.isPledged ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Pledged to royal pot</span>
                  </>
                ) : isPledging ? (
                  <span>Pledging 50 gold...</span>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    <span>Pledge entry (50 gold)</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowRulesModal(true)}
                className="w-full sm:w-auto h-11 px-4 text-xs font-serif font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 border-amber-900/40 text-amber-300 hover:text-amber-200 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Vault rules</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Right Column (5 cols): Top 5 Leaderboard Preview */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-zinc-900/60 border border-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-xs text-white font-serif">
                  Top 5 pot contenders
                </h4>
              </div>
              <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
                60% pool: {pot.championsPool} gold
              </span>
            </div>

            {/* Contenders Roster List */}
            <div className="space-y-2">
              {pot.top5.map((champion, idx) => {
                const rank = idx + 1;
                const isUser = !!champion.isCurrentUser;

                return (
                  <div
                    key={champion.id || idx}
                    className={cn(
                      "p-2 rounded-xl flex items-center justify-between gap-2.5 transition-all text-xs border",
                      isUser
                        ? "bg-amber-950/50 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                        : "bg-zinc-950/60 border-transparent hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0",
                          rank === 1
                            ? "bg-yellow-500 text-black font-extrabold"
                            : rank === 2
                            ? "bg-zinc-300 text-black font-extrabold"
                            : rank === 3
                            ? "bg-amber-700 text-white font-extrabold"
                            : "bg-zinc-800 text-zinc-400"
                        )}
                      >
                        {rank}
                      </span>

                      <div className="relative w-7 h-7 rounded-full overflow-hidden border border-amber-500/30 bg-black shrink-0">
                        <NextImage
                          src={champion.avatar}
                          alt={champion.name}
                          fill
                          className="object-contain p-0.5"
                        />
                      </div>

                      <div className="min-w-0 truncate">
                        <span
                          className={cn(
                            "font-bold truncate block text-xs",
                            isUser ? "text-amber-300 font-serif" : "text-zinc-200"
                          )}
                        >
                          {champion.name} {isUser && "(You)"}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {champion.habitsCount} habits
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-amber-400 text-xs block">
                        +{champion.projectedGold} gold
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {champion.sharePercent}% share
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Player Rank Summary Footer */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400 font-sans">
              <span>
                Your rank: <strong className="text-white">#{userStats.userRank}</strong> ({userStats.userHabits} habits)
              </span>
              <span className="text-amber-400 font-mono font-bold">
                {userStats.isInTop5 ? "In top 5! 👑" : "Climb to top 5!"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rules & Treasury Vault Breakdown Modal */}
      <Dialog open={showRulesModal} onOpenChange={setShowRulesModal}>
        <DialogContent className="max-w-lg bg-zinc-950 border border-amber-900/50 text-white p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-amber-950/40 border border-amber-500/30 flex items-center justify-center shrink-0">
                <NextImage
                  src="/images/items/artifacts/royal-pot-chest.webp"
                  alt="Vault"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold font-serif text-amber-300">
                  Royal pot rules
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  How monthly communal treasury dividends are calculated
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Empty Vault Preview Illustration */}
          <div className="relative h-32 w-full rounded-xl overflow-hidden border border-amber-900/30 bg-black my-2">
            <NextImage
              src="/images/empty-states/empty-vault.webp"
              alt="Empty vault"
              fill
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            <div className="absolute bottom-2 left-3 right-3 text-xs text-amber-200/90 font-serif font-bold">
              The Grand Treasury opens at month-end midnight
            </div>
          </div>

          <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1">
              <h5 className="font-bold text-amber-300 font-serif">1. The Crown seed & habit growth</h5>
              <p className="text-[11px] text-zinc-400">
                The High King deposits 5,000 gold at the start of every month. Each habit completed by you and fellow realm champions adds +2 gold to the vault.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1">
              <h5 className="font-bold text-amber-300 font-serif">2. Top 5 champions (60% pool)</h5>
              <p className="text-[11px] text-zinc-400">
                The 5 champions with the most completed habits by the final midnight split 60% of the gold (25%, 15%, 10%, 5%, 5%).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/70 border border-white/5 space-y-1">
              <h5 className="font-bold text-amber-300 font-serif">3. Consistency dividend (40% pool)</h5>
              <p className="text-[11px] text-zinc-400">
                Every persistent player who logs at least 15 active habit days earns an equal share of the remaining 40% royal dividend, regardless of rank.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              onClick={() => setShowRulesModal(false)}
              className="btn-primary-cta text-xs font-bold rounded-xl px-4 py-2"
            >
              Understood
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
