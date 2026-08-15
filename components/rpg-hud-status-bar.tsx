'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getHealthVitalitySync, getTaxMultiplier, drinkHealthPotion } from '@/lib/health-vitality-manager';
import { getManaSync } from '@/lib/mana-manager';
import { getCharacterStats } from '@/lib/character-stats-service';
import { calculateExperienceToNextLevel } from '@/lib/experience-manager';
import { SpellMenuModal } from '@/components/spell-menu-modal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { hapticSuccess } from '@/lib/haptics';

export function RpgHudStatusBar() {
  const [health, setHealth] = useState(100);
  const [mana, setMana] = useState(100);
  const [showSpellModal, setShowSpellModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [charStats, setCharStats] = useState({ level: 1, experience: 0, gold: 0 });

  useEffect(() => {
    setHealth(getHealthVitalitySync());
    setMana(getManaSync());
    try {
      const s = getCharacterStats();
      if (s) setCharStats({ level: s.level || 1, experience: s.experience || 0, gold: s.gold || 0 });
    } catch {}

    const handleHealthChange = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      setHealth(typeof detail?.health === 'number' ? detail.health : getHealthVitalitySync());
    };

    const handleManaChange = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      setMana(typeof detail?.mana === 'number' ? detail.mana : getManaSync());
    };

    const handleStatsChange = () => {
      try {
        const s = getCharacterStats();
        if (s) setCharStats({ level: s.level || 1, experience: s.experience || 0, gold: s.gold || 0 });
      } catch {}
    };

    window.addEventListener('health-vitality-changed', handleHealthChange);
    window.addEventListener('mana-changed', handleManaChange);
    window.addEventListener('character-stats-update', handleStatsChange);
    window.addEventListener('gold-update', handleStatsChange);
    window.addEventListener('xp-update', handleStatsChange);

    return () => {
      window.removeEventListener('health-vitality-changed', handleHealthChange);
      window.removeEventListener('mana-changed', handleManaChange);
      window.removeEventListener('character-stats-update', handleStatsChange);
      window.removeEventListener('gold-update', handleStatsChange);
      window.removeEventListener('xp-update', handleStatsChange);
    };
  }, []);

  const isPoisoned = health < 10;
  const isPeakKing = health >= 100;
  const taxMultiplier = getTaxMultiplier(health);

  const xpNeeded = calculateExperienceToNextLevel(charStats.experience);
  const currentXpInLevel = Math.max(0, charStats.experience % 100);
  const xpPercent = Math.min(100, Math.max(0, Math.round((currentXpInLevel / 100) * 100)));

  const taxBadgeText = isPeakKing
    ? '👑 +10% Taxes'
    : health >= 50
    ? '🛡️ 1.0x Base Taxes'
    : health >= 10
    ? '⚠️ -25% Sluggish'
    : '💀 -75% Tax Penalty';

  return (
    <>
      {/* Critical Illness Poison Overlay (< 10% Health) */}
      {isPoisoned && (
        <div className="fixed inset-0 pointer-events-none z-[9990] overflow-hidden">
          <div className="absolute inset-0 shadow-[inset_0_0_90px_rgba(34,197,94,0.45)] border-4 border-emerald-500/30 animate-pulse" />
          <div className="absolute bottom-6 left-12 text-emerald-400 text-sm animate-bounce opacity-80">🟢</div>
          <div className="absolute bottom-16 left-24 text-green-300 text-xs animate-pulse opacity-70">🫧</div>
        </div>
      )}

      {/* Floating RPG Status HUD Container */}
      <div className="fixed top-[calc(env(safe-area-inset-top,0px)+0.75rem)] left-3 right-3 w-[calc(100%-1.5rem)] md:top-auto md:bottom-4 md:left-4 md:right-auto md:w-auto z-[9999] pointer-events-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={() => setShowDetails(!showDetails)}
              className="cursor-pointer transition-all duration-300 bg-[#0a0f1d]/95 backdrop-blur-md border border-amber-500/50 shadow-[0_8px_32px_rgba(0,0,0,0.85),inset_0_1px_2px_rgba(254,240,138,0.2)] rounded-2xl md:rounded-full p-2.5 sm:p-3"
            >
              {/* DESKTOP MINIMALIST ROW (Hidden text by default, reveals on click) */}
              <div className="hidden md:flex items-center gap-3">
                {/* 1. Health Bar Pill */}
                <div className="flex items-center gap-2" title={`Health: ${health}% (${taxBadgeText})`}>
                  <span className="text-xs">{isPoisoned ? '🟢' : '❤️'}</span>
                  <div className="w-24 h-2.5 bg-zinc-950/80 rounded-full border border-red-900/60 overflow-hidden relative shadow-inner">
                    <div
                      className={cn(
                        "h-full transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]",
                        isPoisoned
                          ? "bg-gradient-to-r from-emerald-700 to-green-400"
                          : "bg-gradient-to-r from-red-700 via-rose-500 to-red-400"
                      )}
                      style={{ width: `${health}%` }}
                    />
                  </div>
                  {showDetails && (
                    <span className="text-[10px] font-mono text-red-400 font-bold leading-none animate-fadeIn">
                      {health}%
                    </span>
                  )}
                </div>

                <div className="w-px h-5 bg-zinc-800" />

                {/* 2. Mana Bar Pill (Clicking opens Spell Menu) */}
                <div
                  className="flex items-center gap-2 group/mana"
                  title="Mana: Click to cast instant Realm Spells!"
                  onClick={(e) => {
                    e.stopPropagation();
                    hapticSuccess();
                    setShowSpellModal(true);
                  }}
                >
                  <span className="text-xs">🔵</span>
                  <div className="w-24 h-2.5 bg-zinc-950/80 rounded-full border border-cyan-900/60 overflow-hidden relative shadow-inner group-hover/mana:border-cyan-400 transition-colors">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-700 via-blue-500 to-cyan-300 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                      style={{ width: `${mana}%` }}
                    />
                  </div>
                  {showDetails && (
                    <span className="text-[10px] font-mono text-cyan-300 font-bold leading-none animate-fadeIn">
                      {mana} MP
                    </span>
                  )}
                </div>

                <div className="w-px h-5 bg-zinc-800" />

                {/* 3. Level & XP Progress Bar Pill */}
                <div className="flex items-center gap-2" title={`Level ${charStats.level} (${currentXpInLevel}/100 XP)`}>
                  <span className="text-xs font-serif font-bold text-purple-300">Lv.{charStats.level}</span>
                  <div className="w-20 h-2.5 bg-zinc-950/80 rounded-full border border-purple-900/60 overflow-hidden relative shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-purple-700 via-indigo-500 to-amber-400 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                  {showDetails && (
                    <span className="text-[10px] font-mono text-purple-300 font-bold leading-none animate-fadeIn">
                      {xpPercent}%
                    </span>
                  )}
                </div>

                <div className="w-px h-5 bg-zinc-800" />

                {/* 4. Gold Pill */}
                <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-300" title="Kingdom Gold">
                  <span>👑</span>
                  <span>{charStats.gold.toLocaleString()}g</span>
                </div>

                <div className="w-px h-5 bg-zinc-800" />

                {/* 5. Quick Potion Hotbar Slot */}
                <button
                  type="button"
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-950/80 border border-amber-400/60 hover:border-amber-300 text-amber-200 hover:text-white transition-all shadow-md active:scale-95 text-xs font-bold shrink-0"
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
                </button>
              </div>

              {/* MOBILE STACKED CAPSULE CARD (Clean 3-row stacked view) */}
              <div className="flex md:hidden flex-col gap-2 w-full">
                {/* Mobile Row 1: Health Bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-[75px]">
                    <span className="text-xs">{isPoisoned ? '🟢' : '❤️'}</span>
                    <span className="text-[10px] font-bold text-red-400 uppercase font-serif">Health</span>
                  </div>
                  <div className="flex-1 h-2 bg-zinc-950 rounded-full border border-red-900/60 overflow-hidden relative">
                    <div
                      className={cn(
                        "h-full transition-all duration-500 rounded-full",
                        isPoisoned ? "bg-emerald-400" : "bg-gradient-to-r from-red-600 to-rose-400"
                      )}
                      style={{ width: `${health}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-red-300 font-bold min-w-[32px] text-right">{health}%</span>
                </div>

                {/* Mobile Row 2: Mana Bar */}
                <div
                  className="flex items-center justify-between gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    hapticSuccess();
                    setShowSpellModal(true);
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-[75px]">
                    <span className="text-xs">🔵</span>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase font-serif">Mana</span>
                  </div>
                  <div className="flex-1 h-2 bg-zinc-950 rounded-full border border-cyan-900/60 overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 transition-all duration-500 rounded-full"
                      style={{ width: `${mana}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 font-bold min-w-[32px] text-right">{mana}MP</span>
                </div>

                {/* Mobile Row 3: Level/XP Bar & Gold / Potion Controls */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-[10px] font-serif font-bold text-purple-300">Lv.{charStats.level}</span>
                    <div className="flex-1 h-2 bg-zinc-950 rounded-full border border-purple-900/60 overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-amber-400 transition-all duration-500 rounded-full"
                        style={{ width: `${xpPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono font-bold text-amber-300">👑 {charStats.gold}g</span>
                    <button
                      type="button"
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-950 border border-amber-400/60 text-xs text-amber-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        const res = drinkHealthPotion();
                        if (res.success) {
                          hapticSuccess();
                          toast({ title: "🧪 Drank Health Potion!", description: `Restored +30% Health!` });
                        } else {
                          hapticSuccess();
                          window.dispatchEvent(new CustomEvent('open-inventory-bag', { detail: { tab: 'stored', filter: 'consumable' } }));
                        }
                      }}
                    >
                      🧪
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-950 border-amber-500/50 text-amber-200 z-[99999]">
            <p className="font-bold">🧪 Unified RPG Status HUD</p>
            <p className="text-xs text-zinc-400">
              • 100% Health: +10% Taxes ({taxBadgeText})<br />
              • Mana: Click Mana bar to cast Chrono & Tax Spells!<br />
              • Level {charStats.level}: {currentXpInLevel}/100 XP<br />
              • Gold: {charStats.gold.toLocaleString()}g | Click 🧪 for Potions
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Arcane Spell Menu Modal */}
      <SpellMenuModal isOpen={showSpellModal} onClose={() => setShowSpellModal(false)} />
    </>
  );
}


