'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getHealthVitalitySync, getTaxMultiplier, drinkHealthPotion } from '@/lib/health-vitality-manager';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { hapticSuccess } from '@/lib/haptics';

export function RpgHudStatusBar() {
  const [health, setHealth] = useState(100);

  useEffect(() => {
    setHealth(getHealthVitalitySync());

    const handleHealthChange = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (typeof detail?.health === 'number') {
        setHealth(detail.health);
      } else {
        setHealth(getHealthVitalitySync());
      }
    };

    window.addEventListener('health-vitality-changed', handleHealthChange);
    return () => window.removeEventListener('health-vitality-changed', handleHealthChange);
  }, []);

  const isPoisoned = health < 10;
  const isPeakKing = health >= 100;
  const taxMultiplier = getTaxMultiplier(health);

  const taxBadgeText = isPeakKing
    ? '👑 +10% Taxes'
    : health >= 50
    ? '🛡️ 1.0x Base Taxes'
    : health >= 10
    ? '⚠️ -25% Sluggish Taxes'
    : '💀 -75% Tax Penalty';

  const taxBadgeColor = isPeakKing
    ? 'text-yellow-300 font-black drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
    : health >= 50
    ? 'text-slate-300 font-bold'
    : health >= 10
    ? 'text-amber-400 font-bold'
    : 'text-red-400 font-black animate-pulse';

  return (
    <>
      {/* Critical Illness Poison Overlay (< 10% Health): Light Green Glow & Green Bubbles */}
      {isPoisoned && (
        <div className="fixed inset-0 pointer-events-none z-[9990] overflow-hidden">
          {/* Light Green Edge Vignette Glow */}
          <div className="absolute inset-0 shadow-[inset_0_0_90px_rgba(34,197,94,0.45)] border-4 border-emerald-500/30 animate-pulse" />
          
          {/* Floating Greenish Poison Bubbles */}
          <div className="absolute bottom-6 left-12 text-emerald-400 text-sm animate-bounce opacity-80">🟢</div>
          <div className="absolute bottom-16 left-24 text-green-300 text-xs animate-pulse opacity-70">🫧</div>
          <div className="absolute bottom-10 right-16 text-emerald-400 text-base animate-bounce opacity-80">🧪</div>
          <div className="absolute top-1/2 left-8 text-emerald-500 text-xs animate-pulse opacity-60">🫧</div>
        </div>
      )}

      {/* Floating RPG Status HUD Container: Desktop = Bottom Left Corner, Mobile = Top Full Width below notch */}
      <div className="fixed top-[calc(env(safe-area-inset-top,0px)+0.75rem)] left-3 right-3 w-[calc(100%-1.5rem)] md:top-auto md:bottom-4 md:left-4 md:right-auto md:w-auto z-[9999] pointer-events-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-between md:justify-start gap-1.5 sm:gap-2.5 bg-[#0f1526]/95 backdrop-blur-md px-4 py-2 rounded-full border-1.5 border-amber-500/60 shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(254,240,138,0.2)]">
              {/* Health Flask (Red) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className={cn(
                    "w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center text-xs text-yellow-200 relative overflow-hidden transition-all shrink-0",
                    isPeakKing
                      ? "border-amber-300 bg-radial from-amber-400 via-red-600 to-red-950 shadow-[0_0_20px_rgba(245,158,11,0.9)] scale-105"
                      : isPoisoned
                      ? "border-emerald-400 bg-radial from-emerald-600 via-emerald-950 to-black shadow-[0_0_20px_rgba(34,197,94,0.9)] animate-pulse"
                      : "border-red-400 bg-radial from-rose-600 via-red-900 to-[#280404] shadow-[0_0_15px_rgba(239,68,68,0.7)]"
                  )}
                >
                  {/* Specular Curved Glass Arc */}
                  <div className="absolute top-0.5 left-1 w-2.5 h-1 rounded-full bg-white/40 blur-[0.5px] pointer-events-none" />
                  <span className="relative z-10 font-bold">{isPoisoned ? '🟢' : '🔴'}</span>
                </div>
                <div className="flex flex-col min-w-[70px] sm:min-w-[90px]">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest font-serif leading-tight">
                    {isPoisoned ? 'Poisoned' : 'Health'} ({health}%)
                  </span>
                  <span className={cn("text-[9px] sm:text-[10px] font-mono leading-tight", taxBadgeColor)}>
                    {taxBadgeText}
                  </span>
                </div>
              </div>

              <div className="w-px h-7 bg-amber-900/50" />

              {/* Mana Flask (Blue) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-cyan-400 bg-radial from-cyan-500 via-cyan-900 to-[#041a24] flex items-center justify-center text-xs text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.7),inset_0_2px_4px_rgba(255,255,255,0.4)] relative overflow-hidden shrink-0">
                  <div className="absolute top-0.5 left-1 w-2.5 h-1 rounded-full bg-white/40 blur-[0.5px] pointer-events-none" />
                  <span className="relative z-10 font-bold">🔵</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-serif leading-tight">
                    Mana
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-cyan-200 font-bold leading-tight">
                    Full
                  </span>
                </div>
              </div>

              <div className="w-px h-7 bg-amber-900/50" />

              {/* Quick Potion Drink Slot -> Opens Bag on Potions Tab */}
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-b from-amber-800 to-amber-950 border border-amber-400/60 hover:border-amber-300 text-amber-200 hover:text-white transition-all shadow-md active:scale-95 text-xs font-serif font-bold shrink-0"
                title="Open Potion Bag"
                onClick={(e) => {
                  e.stopPropagation();
                  hapticSuccess();
                  window.dispatchEvent(new CustomEvent('open-inventory-bag', { detail: { tab: 'stored', filter: 'consumable' } }));
                }}
              >
                <span>🧪</span>
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-950 border-amber-500/50 text-amber-200 z-[99999]">
            <p className="font-bold">🧪 King Health & Tax Multiplier HUD</p>
            <p className="text-xs text-zinc-400">
              • 100% Health: +10% Taxes (Peak King)<br />
              • Under 10% Health: -75% Tax Penalty (Poisoned)<br />
              • Click Drink Potion to restore +30% Health!
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}
