'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getHealthVitalitySync, getTaxMultiplier, drinkHealthPotion } from '@/lib/health-vitality-manager';
import { getManaSync } from '@/lib/mana-manager';
import { SpellMenuModal } from '@/components/spell-menu-modal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { hapticSuccess } from '@/lib/haptics';

export function RpgHudStatusBar() {
  const [health, setHealth] = useState(100);
  const [mana, setMana] = useState(100);
  const [showSpellModal, setShowSpellModal] = useState(false);

  useEffect(() => {
    setHealth(getHealthVitalitySync());
    setMana(getManaSync());

    const handleHealthChange = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (typeof detail?.health === 'number') {
        setHealth(detail.health);
      } else {
        setHealth(getHealthVitalitySync());
      }
    };

    const handleManaChange = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (typeof detail?.mana === 'number') {
        setMana(detail.mana);
      } else {
        setMana(getManaSync());
      }
    };

    window.addEventListener('health-vitality-changed', handleHealthChange);
    window.addEventListener('mana-changed', handleManaChange);
    return () => {
      window.removeEventListener('health-vitality-changed', handleHealthChange);
      window.removeEventListener('mana-changed', handleManaChange);
    };
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
            <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-3 bg-[#0a0f1d]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/50 shadow-[0_8px_32px_rgba(0,0,0,0.85),inset_0_1px_2px_rgba(254,240,138,0.25)]">
              {/* Health Orb (Vigor Liquid) */}
              <div className="flex items-center gap-2 cursor-pointer" title="Health Vigor: Scales Kingdom Tax Yields">
                <div
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center text-xs relative overflow-hidden transition-all shrink-0 shadow-lg",
                    isPeakKing
                      ? "border-amber-300 bg-black shadow-[0_0_20px_rgba(245,158,11,0.9)] scale-105"
                      : isPoisoned
                      ? "border-emerald-400 bg-black shadow-[0_0_20px_rgba(34,197,94,0.9)] animate-pulse"
                      : "border-red-500 bg-black shadow-[0_0_15px_rgba(239,68,68,0.7)]"
                  )}
                >
                  {/* Liquid Fill Height Animation */}
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 right-0 transition-all duration-700",
                      isPoisoned
                        ? "bg-gradient-to-t from-emerald-950 via-emerald-700 to-green-500"
                        : "bg-gradient-to-t from-red-950 via-red-700 to-rose-500"
                    )}
                    style={{ height: `${health}%` }}
                  />
                  {/* Specular Glass Curved Arc Highlight */}
                  <div className="absolute top-0.5 left-1 w-3 h-1.5 rounded-full bg-white/40 blur-[0.5px] pointer-events-none transform -rotate-12" />
                  <span className="relative z-10 font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{isPoisoned ? '🟢' : '🔴'}</span>
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

              {/* Mana Orb (Willpower Liquid) - Click opens Spell Menu */}
              <div
                className="flex items-center gap-2 cursor-pointer group"
                title="Arcane Mana: Click to cast instant Realm Spells!"
                onClick={() => {
                  hapticSuccess();
                  setShowSpellModal(true);
                }}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-cyan-400 bg-black flex items-center justify-center text-xs text-cyan-100 shadow-[0_0_18px_rgba(6,182,212,0.8),inset_0_2px_4px_rgba(255,255,255,0.4)] relative overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                  {/* Arcane Cyan Liquid Fill */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-950 via-cyan-700 to-cyan-400 transition-all duration-700"
                    style={{ height: `${mana}%` }}
                  />
                  <div className="absolute top-0.5 left-1 w-3 h-1.5 rounded-full bg-white/40 blur-[0.5px] pointer-events-none transform -rotate-12" />
                  <span className="relative z-10 font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">🔵</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-serif leading-tight flex items-center gap-1">
                    Mana <span className="text-[9px] text-cyan-300 font-mono">({mana} MP)</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-cyan-200 font-bold leading-tight group-hover:underline">
                    Cast Spells ✨
                  </span>
                </div>
              </div>

              <div className="w-px h-7 bg-amber-900/50" />

              {/* Quick Potion Hotbar Belt Slot */}
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-b from-amber-700 via-amber-900 to-amber-950 border border-amber-400/70 hover:border-amber-300 text-amber-200 hover:text-white transition-all shadow-md active:scale-95 text-xs font-serif font-bold shrink-0 relative group"
                title="1-Tap Drink Potion or Open Potion Bag"
                onClick={(e) => {
                  e.stopPropagation();
                  const res = drinkHealthPotion();
                  if (res.success) {
                    hapticSuccess();
                    toast({
                      title: "🧪 Drank Health Potion!",
                      description: `Restored +30% Health! Current Health: ${res.newHealth}%.`
                    });
                  } else {
                    hapticSuccess();
                    window.dispatchEvent(new CustomEvent('open-inventory-bag', { detail: { tab: 'stored', filter: 'consumable' } }));
                  }
                }}
              >
                <span>🧪</span>
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 text-[8px] font-bold text-black items-center justify-center border border-amber-200 shadow-md">
                    +
                  </span>
                </span>
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-950 border-amber-500/50 text-amber-200 z-[99999]">
            <p className="font-bold">🧪 King Health & Willpower Mana HUD</p>
            <p className="text-xs text-zinc-400">
              • 100% Health: +10% Taxes (Peak King)<br />
              • Under 10% Health: -75% Tax Penalty (Poisoned)<br />
              • Mana: Click Mana Orb to cast Chrono & Tax Spells!<br />
              • Click 🧪 to drink potion or open Potion Pouch!
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Arcane Spell Menu Modal */}
      <SpellMenuModal isOpen={showSpellModal} onClose={() => setShowSpellModal(false)} />
    </>
  );
}

