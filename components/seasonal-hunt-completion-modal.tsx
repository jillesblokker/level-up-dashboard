"use client";

import { useEffect } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Sparkles, Gift, ShieldCheck, Flame, Crown } from 'lucide-react';
import { gainGold } from '@/lib/gold-manager';
import { addToCharacterStat } from '@/lib/character-stats-service';
import { toast } from '@/components/ui/use-toast';
import { SeasonalEvent, SEASONAL_EVENTS } from '@/lib/seasonal-hunt-manager';

interface SeasonalHuntCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventKey: string | null;
}

export function SeasonalHuntCompletionModal({ isOpen, onClose, eventKey }: SeasonalHuntCompletionModalProps) {
  const currentEventKey = eventKey || 'newyear';
  const eventConfig: SeasonalEvent = SEASONAL_EVENTS[currentEventKey] || SEASONAL_EVENTS['newyear']!;

  useEffect(() => {
    if (isOpen) {
      // Trigger multi-stage confetti explosion
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({
          particleCount,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaimRewards = () => {
    // 1. Grant 1,000 Gold
    gainGold(1000, 'seasonal-hunt-completion');

    // 2. Grant +100 Virtue Energy / Character Stat
    try {
      addToCharacterStat('virtue_points', 100, 'seasonal-hunt-completion');
    } catch {
      // Ignore if stat key differs
    }

    // 3. Dispatch completion events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('seasonal-hunt:updated'));
      window.dispatchEvent(new CustomEvent('kingdom:blueprint-unlocked', {
        detail: { eventKey: currentEventKey }
      }));
    }

    toast({
      title: `🎉 ${eventConfig.name} Completed!`,
      description: "Claimed +1,000 Gold, +250 Essences, +100 Virtue Energy & Seasonal Blueprint!",
    });

    onClose();
  };

  const getEventBlueprintName = (key: string) => {
    switch (key) {
      case 'newyear': return 'Fireworks Stand Tile';
      case 'christmas': return 'Winter Fountain Tile';
      case 'halloween': return 'Pumpkin Patch Tile';
      case 'harvest': return 'Harvest Barn Tile';
      case 'easter': return 'Canopy Garden Tile';
      default: return 'Seasonal Kingdom Monument Tile';
    }
  };

  const getEventBlueprintImage = (key: string) => {
    switch (key) {
      case 'newyear': return '/images/kingdom-tiles/FireworksStand.webp';
      case 'christmas': return '/images/kingdom-tiles/WinterFountain.webp';
      case 'halloween': return '/images/kingdom-tiles/PumpkinPatch.webp';
      case 'harvest': return '/images/kingdom-tiles/HarvestBarn.webp';
      default: return '/images/kingdom-tiles/WinterFountain.webp';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-zinc-950 border border-amber-500/40 text-white rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-950/80 border-2 border-amber-400 shadow-lg animate-bounce">
            <Trophy className="h-9 w-9 text-amber-300" />
          </div>
          <DialogTitle className="text-2xl font-bold font-serif text-amber-300 tracking-wide">
            Master Hunter Victory!
          </DialogTitle>
          <DialogDescription className="text-xs text-amber-200/80 font-medium">
            You collected all 10 hidden items in the {eventConfig.name}!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Event Banner */}
          <div className="relative rounded-2xl bg-gradient-to-b from-amber-950/60 to-zinc-900 border border-amber-500/30 p-4 text-center overflow-hidden">
            <div className="absolute top-2 right-2 text-amber-400/30">
              <Sparkles className="h-10 w-10" />
            </div>
            <div className="flex justify-center mb-2">
              <Image
                src={eventConfig.image}
                alt={eventConfig.name}
                width={64}
                height={64}
                className="drop-shadow-[0_4px_12px_rgba(251,191,36,0.5)]"
              />
            </div>
            <p className="text-sm font-semibold text-zinc-200">
              {eventConfig.description}
            </p>
          </div>

          {/* Rewards Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 text-center font-serif">
              Grand Completion Rewards
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Reward 1: 1,000 Gold */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-950/40 border border-amber-500/30">
                <span className="text-2xl">💰</span>
                <span className="text-sm font-bold text-amber-300 font-mono">+1,000 Gold</span>
                <span className="text-[10px] text-zinc-400">Kingdom Treasury</span>
              </div>

              {/* Reward 2: 250 Essences */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
                <span className="text-2xl">🧪</span>
                <span className="text-sm font-bold text-purple-300 font-mono">+250 Essences</span>
                <span className="text-[10px] text-zinc-400">All 4 Elements</span>
              </div>

              {/* Reward 3: Virtue Energy */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                <span className="text-2xl">⚡</span>
                <span className="text-sm font-bold text-emerald-300 font-mono">+100 Virtue</span>
                <span className="text-[10px] text-zinc-400">House Cup Points</span>
              </div>

              {/* Reward 4: Seasonal Blueprint */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-950/40 border border-blue-500/30">
                <Image
                  src={getEventBlueprintImage(currentEventKey)}
                  alt="Blueprint"
                  width={28}
                  height={28}
                  className="rounded mb-0.5"
                />
                <span className="text-xs font-bold text-blue-300 font-serif text-center line-clamp-1">
                  {getEventBlueprintName(currentEventKey)}
                </span>
                <span className="text-[10px] text-zinc-400">Unlocked Tile</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button
            onClick={handleClaimRewards}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-black font-bold text-sm py-3 rounded-2xl shadow-lg border border-amber-300/40 tracking-wide uppercase font-serif"
          >
            🎉 Claim Master Rewards
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
