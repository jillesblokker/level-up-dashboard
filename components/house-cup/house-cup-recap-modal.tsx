"use client"

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Crown, Sparkles, Award, Coins, Flame, Star, Shield, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { addToCharacterStat } from '@/lib/character-stats-service';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

interface HouseCupRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'monthly' | 'annual';
}

export function HouseCupRecapModal({ isOpen, onClose, type = 'monthly' }: HouseCupRecapModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [recapData, setRecapData] = useState<any>(null);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchRecap = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`/api/house-cup/recap?type=${type}`);
        if (res.ok) {
          const data = await res.json();
          setRecapData(data);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchRecap();
  }, [isOpen, type]);

  const handleClaim = async () => {
    if (!recapData || claimed) return;
    setClaiming(true);

    try {
      const gold = recapData.rewards.gold || 500;
      const essence = recapData.rewards.essence || 15;

      await addToCharacterStat('gold', gold, 'house-cup-recap');
      await addToCharacterStat('build_tokens', essence, 'house-cup-recap');

      setClaimed(true);
      toast({
        title: "Rewards Claimed! 🏆",
        description: `Received ${gold.toLocaleString()} Gold & ${essence} Essences! Title unlocked: ${recapData.rewards.trophyTitle}.`,
      });

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      toast({
        title: "Claim Error",
        description: "Failed to claim House Cup rewards.",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  if (!recapData && loading) {
    return (
      <Dialog open={isOpen} onOpenChange={(op) => { if (!op) onClose(); }}>
        <DialogContent className="max-w-md bg-zinc-950 border border-amber-900/40 text-amber-100 p-8 text-center">
          <Sparkles className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
          <p className="font-medieval text-lg">Gathering House Cup Standings...</p>
        </DialogContent>
      </Dialog>
    );
  }

  const champion = recapData?.champion || { display_name: 'You', total_points: 0 };
  const viewerStanding = recapData?.viewerStanding || { total_points: 0 };
  const allyCount = recapData?.allyCount || 0;
  const isAnnual = type === 'annual';

  return (
    <Dialog open={isOpen} onOpenChange={(op) => { if (!op) onClose(); }}>
      <DialogContent className="max-w-md w-full bg-gradient-to-b from-amber-950 via-zinc-950 to-zinc-950 border border-amber-500/50 text-amber-100 p-6 rounded-2xl shadow-2xl overflow-hidden font-serif">
        {/* Header */}
        <DialogHeader className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center mb-1 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
          </div>
          <DialogTitle className="font-medieval text-2xl text-amber-300 tracking-wide">
            {isAnnual ? `The House Cup ${recapData?.year || 2026} Celebration` : `Monthly Virtue Recap`}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 italic">
            Honoring consistency, virtue energy, and sovereign habit momentum across the realm.
          </DialogDescription>
        </DialogHeader>

        {/* Champion Showcase Banner */}
        <div className="my-4 p-4 rounded-xl bg-gradient-to-r from-amber-900/40 via-zinc-900 to-amber-900/40 border border-amber-500/30 text-center relative overflow-hidden">
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <Crown className="w-4 h-4 text-amber-300" />
            House champion
          </div>
          <h3 className="font-medieval text-xl text-amber-200">{champion.display_name}</h3>
          <p className="text-xs text-amber-400/80 font-mono mt-0.5">
            {champion.total_points.toLocaleString()} Total Virtue Energy
          </p>
        </div>

        {/* User Stats & Ally Scaling Info */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-center">
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-amber-900/30">
            <div className="text-[10px] text-zinc-400 font-semibold">Your score</div>
            <div className="font-medieval text-lg text-amber-300 mt-0.5">
              {viewerStanding.total_points.toLocaleString()} pts
            </div>
          </div>
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-amber-900/30">
            <div className="text-[10px] text-zinc-400 font-semibold flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-amber-400" /> Participating friends
            </div>
            <div className="font-medieval text-lg text-amber-300 mt-0.5">
              {allyCount} {allyCount === 1 ? 'friend' : 'friends'}
            </div>
          </div>
        </div>

        {/* Monthly Virtues Medal Grid (Jan-Dec) */}
        <div className="p-3.5 bg-zinc-950/90 rounded-xl border border-amber-500/30 space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs font-bold text-amber-300 font-serif">
            <span>🏆 Monthly Virtues Medal Grid (2026)</span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">12/12 Months Tracked</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5 text-[9px] font-mono text-center">
            {['Jan 🥇', 'Feb 🥈', 'Mar 🥇', 'Apr 🥉', 'May 🥇', 'Jun 🥇', 'Jul 🥇', 'Aug 🥇', 'Sep 🥈', 'Oct 🥇', 'Nov 🥇', 'Dec 👑'].map((m, i) => (
              <div key={i} className="p-1 rounded bg-zinc-900 border border-amber-500/30 text-amber-300 font-bold">
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* Scaling Rewards Box */}
        <div className="p-3.5 bg-zinc-950/90 rounded-xl border border-amber-500/30 space-y-2 mb-4">
          <div className="text-xs font-bold text-amber-300 text-center">
            🎁 Scaled sovereign rewards
          </div>
          <div className="flex justify-around items-center pt-1 text-xs">
            <div className="flex items-center gap-1.5 text-amber-200">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-amber-300">+{recapData?.rewards.gold.toLocaleString()} Gold</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-200">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-purple-300">+{recapData?.rewards.essence} Essences</span>
            </div>
          </div>
          <div className="text-[10px] text-center text-zinc-400 italic">
            Rewards scaled +{(allyCount * 25)}% boost from {allyCount} active circle allies!
          </div>
        </div>

        {/* Action Claim Button */}
        <Button
          onClick={handleClaim}
          disabled={claimed || claiming}
          className={`w-full py-3 font-bold text-xs transition-all ${
            claimed
              ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
              : "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-amber-950 shadow-[0_0_25px_rgba(245,158,11,0.5)]"
          }`}
        >
          {claiming ? "Claiming rewards..." : claimed ? "Rewards claimed ✓" : "Claim house cup rewards"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
