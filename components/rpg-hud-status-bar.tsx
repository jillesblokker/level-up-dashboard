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
import { useGameStore } from '@/stores/game-store';
import { ChevronLeft, ChevronRight, User, Sparkles, Zap, Snowflake, Brain, Flame, Shield, Sword, Wand2 } from 'lucide-react';

export function RpgHudStatusBar() {
  const [health, setHealth] = useState(100);
  const [mana, setMana] = useState(100);
  const [showSpellModal, setShowSpellModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [charStats, setCharStats] = useState({ level: 1, experience: 0, gold: 0, focus_points: 102 });

  const sanctuaryMode = useGameStore(s => s.sanctuaryMode);
  const setSanctuaryMode = useGameStore(s => s.setSanctuaryMode);

  useEffect(() => {
    setHealth(getHealthVitalitySync());
    setMana(getManaSync());
    try {
      const savedCollapsed = localStorage.getItem('thrivehaven_hud_collapsed');
      if (savedCollapsed !== null) {
        setIsCollapsed(savedCollapsed === 'true');
      }
    } catch {}

    try {
      const s = getCharacterStats();
      if (s) setCharStats({ level: s.level || 1, experience: s.experience || 0, gold: s.gold || 0, focus_points: s.focus_points || 102 });
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
        if (s) setCharStats({ level: s.level || 1, experience: s.experience || 0, gold: s.gold || 0, focus_points: s.focus_points || 102 });
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

  const toggleCollapse = (state?: boolean) => {
    const next = state !== undefined ? state : !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('thrivehaven_hud_collapsed', next.toString());
    } catch {}
  };

  const isPoisoned = health < 10;
  const isPeakKing = health >= 100;
  const currentXpInLevel = Math.max(0, charStats.experience % 100);
  const xpPercent = Math.min(100, Math.max(0, Math.round((currentXpInLevel / 100) * 100)));

  const formatShortGold = (amount: number): string => {
    if (amount >= 1_000_000) {
      const formatted = (amount / 1_000_000).toFixed(1);
      return formatted.endsWith('.0') ? `${Math.floor(amount / 1_000_000)}M` : `${formatted}M`;
    }
    if (amount >= 1_000) {
      const formatted = (amount / 1_000).toFixed(1);
      return formatted.endsWith('.0') ? `${Math.floor(amount / 1_000)}k` : `${formatted}k`;
    }
    return `${amount}`;
  };

  const taxBadgeText = isPeakKing
    ? '👑 +10% Taxes'
    : health >= 50
    ? '🛡️ 1.0x Base Taxes'
    : health >= 10
    ? '⚠️ -25% Sluggish'
    : '💀 -75% Tax Penalty';

  const totalSlides = 4;

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

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
        {isCollapsed ? (
          /* COLLAPSED STATE: LARGE CHARACTER AVATAR BUTTON */
          <button
            type="button"
            onClick={() => {
              hapticSuccess();
              toggleCollapse(false);
            }}
            className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-900 via-amber-950 to-black border-2 border-amber-400 shadow-[0_8px_32px_rgba(0,0,0,0.9),0_0_20px_rgba(245,158,11,0.4)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Click to Expand RPG Status Carousel"
          >
            <div className="w-10 h-10 rounded-full bg-amber-950/80 flex items-center justify-center overflow-hidden border border-amber-300/40">
              <span className="text-xl">👑</span>
            </div>
            {/* Level Badge Overlay */}
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-600 border border-amber-300 text-[9px] font-mono font-bold text-white shadow-md">
              Lv.{charStats.level}
            </span>
          </button>
        ) : (
          /* EXPANDED CAROUSEL HUD CONTAINER */
          <div className="flex items-center gap-2 bg-[#0a0f1d]/95 backdrop-blur-md border border-amber-500/60 shadow-[0_8px_32px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(254,240,138,0.25)] rounded-2xl md:rounded-full px-3 py-2 transition-all duration-300 max-w-full">
            {/* Left: Avatar Thumbnail */}
            <button
              type="button"
              onClick={() => toggleCollapse(true)}
              className="w-8 h-8 rounded-full bg-amber-950 border border-amber-400 flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
              title="Click to Collapse HUD"
            >
              <span className="text-xs">👑</span>
            </button>

            <div className="w-px h-6 bg-zinc-800 shrink-0" />

            {/* Carousel Content */}
            <div className="flex-1 overflow-hidden min-w-[260px] sm:min-w-[340px]">
              {/* SLIDE 0: CORE VIGOR & WILL (Health, Mana, Solid Green Level Bar, Gold, Potion) */}
              {activeSlide === 0 && (
                <div className="flex items-center justify-between gap-2.5 animate-fadeIn">
                  {/* Health Bar */}
                  <div className="flex items-center gap-1.5" title={`Health: ${health}%`}>
                    <span className="text-xs">{isPoisoned ? '🟢' : '❤️'}</span>
                    <div className="w-16 sm:w-20 h-2 bg-zinc-950 rounded-full border border-red-900/60 overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-500 rounded-full", isPoisoned ? "bg-emerald-400" : "bg-red-500")}
                        style={{ width: `${health}%` }}
                      />
                    </div>
                  </div>

                  {/* Mana Bar */}
                  <div
                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                    title="Mana: Click to cast Spells"
                    onClick={(e) => {
                      e.stopPropagation();
                      hapticSuccess();
                      setShowSpellModal(true);
                    }}
                  >
                    <span className="text-xs">🔵</span>
                    <div className="w-16 sm:w-20 h-2 bg-zinc-950 rounded-full border border-cyan-900/60 overflow-hidden">
                      <div className="h-full bg-cyan-400 transition-all duration-500 rounded-full" style={{ width: `${mana}%` }} />
                    </div>
                  </div>

                  {/* Level Bar: SOLID GREEN BAR */}
                  <div className="flex items-center gap-1.5" title={`Level ${charStats.level} (${currentXpInLevel}/100 XP)`}>
                    <span className="text-[10px] font-bold text-emerald-300 font-mono">Lv.{charStats.level}</span>
                    <div className="w-14 sm:w-16 h-2 bg-zinc-950 rounded-full border border-emerald-900/60 overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.8)]" style={{ width: `${xpPercent}%` }} />
                    </div>
                  </div>

                  {/* Gold Pill */}
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-300" title={`Gold: ${charStats.gold.toLocaleString()}`}>
                    <span>🟡</span>
                    <span>{formatShortGold(charStats.gold)}</span>
                  </div>

                  {/* Potion Button */}
                  <button
                    type="button"
                    className="w-6 h-6 rounded-full bg-amber-950 border border-amber-400/60 flex items-center justify-center text-xs shrink-0 active:scale-95"
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
              )}

              {/* SLIDE 1: TOPBAR RESOURCES (Screenshot 1: ✨ 12, ⚡ 85%, ❄️ 1, 🧠 102) */}
              {activeSlide === 1 && (
                <div className="flex items-center justify-around gap-2 text-xs font-mono font-bold animate-fadeIn py-0.5">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                    <span>✨</span> <span>12</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-300">
                    <span>⚡</span> <span>85%</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                    <span>❄️</span> <span>1</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-300">
                    <span>🧠</span> <span>{charStats.focus_points || 102}</span>
                  </div>
                </div>
              )}

              {/* SLIDE 2: SEASONAL EVENT & CATEGORY BOOSTS (Screenshot 2) */}
              {activeSlide === 2 && (
                <div className="flex items-center justify-between gap-1.5 text-[10px] font-bold font-serif animate-fadeIn overflow-x-auto custom-scrollbar py-0.5">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-950/80 border border-amber-500/50 text-amber-300 shrink-0">
                    <span>🔥</span> <span className="uppercase text-[9px]">Forge Fire</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSanctuaryMode(!sanctuaryMode);
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg border shrink-0 transition-colors cursor-pointer",
                      sanctuaryMode ? "bg-indigo-950 border-indigo-400 text-indigo-200" : "bg-zinc-900 border-zinc-700 text-zinc-400"
                    )}
                  >
                    <span>🛡️</span> <span>Sanctuary</span>
                  </button>
                  <span className="px-1.5 py-0.5 rounded bg-red-950 border border-red-500/40 text-red-300 shrink-0">⚔️ MIGHT x4</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300 shrink-0">📖 KNOWLEDGE x2</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 shrink-0">🧘 WELLNESS x3</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300 shrink-0">👑 HONOR x4</span>
                </div>
              )}

              {/* SLIDE 3: STREAK RECOVERY & COMBAT BUFFS (Screenshot 3) */}
              {activeSlide === 3 && (
                <div className="flex items-center justify-between gap-2 text-[10px] animate-fadeIn py-0.5">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-200">
                    <span>🛡️</span>
                    <span className="font-serif font-bold">Streak Recovery (0/2)</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono font-bold text-[9px]">
                    <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40">⚔️ +15% ATK</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40">🪄 +10% Magic</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40">🛡️ +10% Armor</span>
                  </div>
                </div>
              )}
            </div>

            {/* Slide Navigation Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={prevSlide}
                className="p-1 rounded-full hover:bg-white/10 text-amber-400 text-xs transition-colors"
                title="Previous Slide"
              >
                ◀
              </button>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSlide(idx);
                    }}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all cursor-pointer",
                      activeSlide === idx ? "bg-amber-400 w-3" : "bg-zinc-600 hover:bg-zinc-400"
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={nextSlide}
                className="p-1 rounded-full hover:bg-white/10 text-amber-400 text-xs transition-colors"
                title="Next Slide"
              >
                ▶
              </button>
            </div>

            <div className="w-px h-6 bg-zinc-800 shrink-0" />

            {/* FAR RIGHT: CHEVRON LEFT CLOSE BUTTON TO COLLAPSE */}
            <button
              type="button"
              onClick={() => {
                hapticSuccess();
                toggleCollapse(true);
              }}
              className="p-1.5 rounded-full bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 hover:text-white transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
              title="Collapse to Character Avatar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Arcane Spell Menu Modal */}
      <SpellMenuModal isOpen={showSpellModal} onClose={() => setShowSpellModal(false)} />
    </>
  );
}



