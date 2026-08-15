'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getHealthVitalitySync, getTaxMultiplier, drinkHealthPotion } from '@/lib/health-vitality-manager';
import { getManaSync } from '@/lib/mana-manager';
import { getCharacterStats } from '@/lib/character-stats-service';
import { calculateExperienceToNextLevel } from '@/lib/experience-manager';
import { SpellMenuModal } from '@/components/spell-menu-modal';
import { FocusPointsModal } from '@/components/focus-points-modal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { hapticSuccess, hapticMedium, hapticLight } from '@/lib/haptics';
import { useGameStore } from '@/stores/game-store';
import { ChevronLeft, X, Heart, Sparkles, Zap, Snowflake, Brain, Flame, Shield, Sword, Wand2, Coins, Trophy, ArrowRight, ExternalLink, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RpgHudStatusBar() {
  const [health, setHealth] = useState(100);
  const [mana, setMana] = useState(100);
  const [showSpellModal, setShowSpellModal] = useState(false);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<'health' | 'level' | 'gold' | 'essences' | 'fuel' | 'freeze' | 'event' | 'recovery' | 'buffs' | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [drawerTouchStartY, setDrawerTouchStartY] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [charStats, setCharStats] = useState({ level: 1, experience: 0, gold: 0, focus_points: 102 });

  const sanctuaryMode = useGameStore(s => s.sanctuaryMode);
  const setSanctuaryMode = useGameStore(s => s.setSanctuaryMode);

  // Low health heartbeat haptics (< 25% Health)
  useEffect(() => {
    if (health >= 25) return;
    const interval = setInterval(() => {
      hapticLight();
    }, 3500);
    return () => clearInterval(interval);
  }, [health]);

  // Auto-hide HUD when scrolling down on mobile, reveal when scrolling up
  useEffect(() => {
    let lastTop = 0;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      let currentTop = 0;

      if (target === document || target === document.documentElement || target === document.body || !(target instanceof HTMLElement)) {
        currentTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      } else {
        currentTop = target.scrollTop || window.scrollY || 0;
      }

      const diff = currentTop - lastTop;

      // Filter out small jitter (< 5px)
      if (Math.abs(diff) < 5) return;

      if (currentTop > 30 && diff > 0) {
        // Scrolling down -> hide HUD
        setIsVisible(false);
      } else if (diff < 0 || currentTop <= 20) {
        // Scrolling up or near top -> reveal HUD
        setIsVisible(true);
      }

      lastTop = currentTop;
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, []);

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

  const nextSlide = () => {
    hapticLight();
    setActiveSlide((prev) => (prev + 1) % 6);
  };

  const prevSlide = () => {
    hapticLight();
    setActiveSlide((prev) => (prev - 1 + 6) % 6);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches[0]) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || !e.changedTouches || !e.changedTouches[0]) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 35) {
      nextSlide();
    } else if (diff < -35) {
      prevSlide();
    }
    setTouchStartX(null);
  };

  const handleDrawerTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches[0]) {
      setDrawerTouchStartY(e.touches[0].clientY);
    }
  };

  const handleDrawerTouchEnd = (e: React.TouchEvent) => {
    if (drawerTouchStartY === null || !e.changedTouches || !e.changedTouches[0]) return;
    const touchEndY = e.changedTouches[0].clientY;
    if (touchEndY - drawerTouchStartY > 50) {
      setActiveDrawer(null);
    }
    setDrawerTouchStartY(null);
  };

  const openDrawer = (drawerKey: 'health' | 'level' | 'gold' | 'essences' | 'fuel' | 'freeze' | 'event' | 'recovery' | 'buffs') => {
    hapticMedium();
    setActiveDrawer(drawerKey);
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

      {/* Floating RPG Status HUD Container (Auto-Hides on Mobile Scroll Down, Reveals on Scroll Up) */}
      <div
        className={cn(
          "fixed top-[calc(env(safe-area-inset-top,0px)+0.75rem)] left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))] w-[calc(100%-1.5rem)] md:top-auto md:bottom-4 md:left-4 md:right-auto md:w-auto z-[9999] transition-all duration-300 ease-in-out",
          isVisible
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "-translate-y-24 opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto"
        )}
      >
        {isCollapsed ? (
          /* COLLAPSED STATE: UNCROPPED TALL CHARACTER AVATAR BUTTON */
          <button
            type="button"
            onClick={() => {
              hapticSuccess();
              toggleCollapse(false);
            }}
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-amber-900 via-amber-950 to-black border-2 border-amber-400 shadow-[0_8px_32px_rgba(0,0,0,0.95),0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer p-0.5"
            title="Click to Expand RPG Status Carousel"
          >
            <div className="relative w-12 h-12 rounded-full bg-amber-950/90 flex items-center justify-center overflow-hidden border border-amber-300/40">
              <Image src="/images/character/count.webp" alt="Character Avatar" fill className="object-contain p-0.5" unoptimized />
            </div>
            {/* Level Badge Overlay */}
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-600 border border-amber-300 text-[9px] font-mono font-bold text-white shadow-md">
              Lv.{charStats.level}
            </span>
          </button>
        ) : (
          /* EXPANDED CAROUSEL HUD CONTAINER */
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="flex items-center gap-2.5 bg-[#0a0f1d]/95 backdrop-blur-md border border-amber-500/60 shadow-[0_8px_32px_rgba(0,0,0,0.95),inset_0_1px_2px_rgba(254,240,138,0.25)] rounded-2xl md:rounded-full px-3 py-2.5 min-h-[56px] transition-all duration-300 max-w-full overflow-hidden"
          >
            {/* Left: Avatar Thumbnail */}
            <button
              type="button"
              onClick={() => {
                hapticSuccess();
                toggleCollapse(true);
              }}
              className="relative w-10 h-10 rounded-full bg-amber-950 border border-amber-400 flex items-center justify-center shrink-0 hover:scale-105 transition-transform overflow-hidden cursor-pointer shadow-md"
              title="Click Avatar to Collapse HUD"
            >
              <Image src="/images/character/count.webp" alt="Character Avatar" fill className="object-contain p-0.5" unoptimized />
            </button>

            {/* DESKTOP CAROUSEL CONTROLS MOVED TO LEFT (FIRST ITEM NEXT TO AVATAR) */}
            <div className="hidden md:flex items-center gap-1.5 shrink-0 bg-amber-950/40 border border-amber-500/30 px-2 py-1 rounded-full">
              <button
                type="button"
                onClick={prevSlide}
                className="p-1 rounded-full hover:bg-white/10 text-amber-400 text-xs transition-colors cursor-pointer"
                title="Previous Slide"
              >
                ◀
              </button>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      hapticLight();
                      setActiveSlide(idx);
                    }}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all cursor-pointer",
                      activeSlide % 5 === idx ? "bg-amber-400 w-3" : "bg-zinc-600 hover:bg-zinc-400"
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={nextSlide}
                className="p-1 rounded-full hover:bg-white/10 text-amber-400 text-xs transition-colors cursor-pointer"
                title="Next Slide"
              >
                ▶
              </button>
            </div>

            <div className="w-px h-7 bg-zinc-800 shrink-0" />

            {/* Carousel Content Area */}
            <div className="flex-1 overflow-hidden min-w-0">
              {/* DESKTOP VIEW SLIDES (md:) */}
              <div className="hidden md:block">
                {activeSlide % 5 === 0 && (
                  <div className="flex items-center justify-between gap-3 animate-fadeIn">
                    {/* Health Bar */}
                    <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => openDrawer('health')} title={`Health: ${health}%`}>
                      <span className="text-xs">{isPoisoned ? '🟢' : '❤️'}</span>
                      <div className="w-20 h-2 bg-zinc-950 rounded-full border border-red-900/60 overflow-hidden">
                        <div className={cn("h-full transition-all duration-500 rounded-full", isPoisoned ? "bg-emerald-400" : "bg-red-500")} style={{ width: `${health}%` }} />
                      </div>
                    </div>

                    {/* Mana Bar */}
                    <div
                      className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                      title="Mana: Click to cast Spells"
                      onClick={(e) => {
                        e.stopPropagation();
                        hapticSuccess();
                        setShowSpellModal(true);
                      }}
                    >
                      <span className="text-xs">🔵</span>
                      <div className="w-20 h-2 bg-zinc-950 rounded-full border border-cyan-900/60 overflow-hidden">
                        <div className="h-full bg-cyan-400 transition-all duration-500 rounded-full" style={{ width: `${mana}%` }} />
                      </div>
                    </div>

                    {/* Level Bar */}
                    <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => openDrawer('level')} title={`Level ${charStats.level}`}>
                      <span className="text-[10px] font-bold text-emerald-300 font-mono">Lv.{charStats.level}</span>
                      <div className="w-16 h-2 bg-zinc-950 rounded-full border border-emerald-900/60 overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.8)]" style={{ width: `${xpPercent}%` }} />
                      </div>
                    </div>

                    {/* Gold Pill */}
                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-300 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => openDrawer('gold')} title={`Gold: ${charStats.gold.toLocaleString()}`}>
                      <span>🟡</span>
                      <span>{formatShortGold(charStats.gold)}</span>
                    </div>

                    {/* Potion Button */}
                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-amber-950 border border-amber-400/60 flex items-center justify-center text-xs shrink-0 active:scale-95 cursor-pointer"
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

                {activeSlide % 5 === 1 && (
                  <div className="flex items-center justify-around gap-2 text-xs font-mono font-bold animate-fadeIn py-0.5">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 cursor-pointer hover:bg-emerald-900/60 transition-colors" onClick={() => openDrawer('essences')}>
                      <span>✨</span> <span>12 Essences</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-300 cursor-pointer hover:bg-blue-900/60 transition-colors" onClick={() => openDrawer('fuel')}>
                      <span>⚡</span> <span>85% Fuel</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 cursor-pointer hover:bg-cyan-900/60 transition-colors" onClick={() => openDrawer('freeze')}>
                      <span>❄️</span> <span>1 Freeze</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-200 cursor-pointer hover:bg-purple-900/60 transition-colors" onClick={() => setShowFocusModal(true)}>
                      <span>🧠</span> <span>{charStats.focus_points || 102} Focus</span>
                    </div>
                  </div>
                )}

                {activeSlide % 5 === 2 && (
                  <div className="flex items-center justify-between gap-1.5 text-[10px] font-bold font-serif animate-fadeIn overflow-x-auto custom-scrollbar py-0.5">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/50 text-amber-300 shrink-0 cursor-pointer" onClick={() => openDrawer('event')}>
                      <span>🔥</span> <span className="uppercase text-[9px]">Forge Fire</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        hapticMedium();
                        setSanctuaryMode(!sanctuaryMode);
                      }}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-lg border shrink-0 transition-colors cursor-pointer",
                        sanctuaryMode ? "bg-indigo-950 border-indigo-400 text-indigo-200" : "bg-zinc-900 border-zinc-700 text-zinc-400"
                      )}
                    >
                      <span>🛡️</span> <span>Sanctuary</span>
                    </button>
                    <span className="px-2 py-0.5 rounded bg-orange-950 border border-orange-500/40 text-orange-300 shrink-0 cursor-pointer" onClick={() => openDrawer('event')}>⚔️ MIGHT x4</span>
                    <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-300 shrink-0 cursor-pointer" onClick={() => openDrawer('event')}>📖 KNOWLEDGE x2</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 shrink-0 cursor-pointer" onClick={() => openDrawer('event')}>🧘 WELLNESS x3</span>
                    <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300 shrink-0 cursor-pointer" onClick={() => openDrawer('event')}>👑 HONOR x4</span>
                  </div>
                )}

                {activeSlide % 5 === 3 && (
                  <div className="flex items-center justify-between gap-2 text-[10px] animate-fadeIn py-0.5">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-200 cursor-pointer" onClick={() => openDrawer('recovery')}>
                      <span>🛡️</span>
                      <span className="font-serif font-bold">Streak Recovery (0/2)</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-[9px] cursor-pointer" onClick={() => openDrawer('buffs')}>
                      <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-500/40">⚔️ +15% ATK</span>
                      <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/40">🪄 +10% Magic</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-500/40">🛡️ +10% Armor</span>
                    </div>
                  </div>
                )}

                {/* DESKTOP SLIDE 4: QUICK ACTIONS RIBBON */}
                {activeSlide % 5 === 4 && (
                  <div className="flex items-center justify-around gap-2 text-xs font-mono font-bold animate-fadeIn py-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const res = drinkHealthPotion();
                        if (res.success) {
                          hapticSuccess();
                          toast({ title: "🧪 Drank Health Potion!", description: "Restored +30% Health!" });
                        } else {
                          hapticSuccess();
                          window.dispatchEvent(new CustomEvent('open-inventory-bag', { detail: { tab: 'stored', filter: 'consumable' } }));
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-500/50 text-amber-300 hover:bg-amber-900 transition-colors cursor-pointer"
                    >
                      <span>🧪</span> <span>Auto-Potion (+30% HP)</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        hapticMedium();
                        setShowFocusModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-950/80 border border-purple-500/50 text-purple-200 hover:bg-purple-900 transition-colors cursor-pointer"
                    >
                      <span>🧠</span> <span>Quick Focus ({charStats.focus_points || 102} FP)</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        hapticSuccess();
                        setShowSpellModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 hover:bg-cyan-900 transition-colors cursor-pointer"
                    >
                      <span>🪄</span> <span>Arcane Spells</span>
                    </button>
                  </div>
                )}
              </div>

              {/* MOBILE VIEW SLIDES (Clickable items opening interactive drawers & Quick Actions!) */}
              <div className="block md:hidden">
                {/* Mobile Slide 0: Health, Mana, Level */}
                {activeSlide % 6 === 0 && (
                  <div className="flex items-center justify-between gap-2 animate-fadeIn">
                    <div className="flex items-center gap-1 cursor-pointer active:scale-95 transition-transform" onClick={() => openDrawer('health')}>
                      <span className="text-xs">{isPoisoned ? '🟢' : '❤️'}</span>
                      <div className="w-12 h-2 bg-zinc-950 rounded-full border border-red-900/60 overflow-hidden">
                        <div className={cn("h-full transition-all rounded-full", isPoisoned ? "bg-emerald-400" : "bg-red-500")} style={{ width: `${health}%` }} />
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        hapticSuccess();
                        setShowSpellModal(true);
                      }}
                    >
                      <span className="text-xs">🔵</span>
                      <div className="w-12 h-2 bg-zinc-950 rounded-full border border-cyan-900/60 overflow-hidden">
                        <div className="h-full bg-cyan-400 transition-all rounded-full" style={{ width: `${mana}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 cursor-pointer active:scale-95 transition-transform" onClick={() => openDrawer('level')}>
                      <span className="text-[10px] font-bold text-emerald-300 font-mono">Lv.{charStats.level}</span>
                      <div className="w-10 h-2 bg-zinc-950 rounded-full border border-emerald-900/60 overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all rounded-full" style={{ width: `${xpPercent}%` }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile Slide 1: Gold, Potion, Focus */}
                {activeSlide % 6 === 1 && (
                  <div className="flex items-center justify-around gap-2 animate-fadeIn">
                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-300 cursor-pointer active:scale-95 transition-transform" onClick={() => openDrawer('gold')}>
                      <span>🟡</span>
                      <span>{formatShortGold(charStats.gold)}</span>
                    </div>

                    <button
                      type="button"
                      className="w-6 h-6 rounded-full bg-amber-950 border border-amber-400/60 flex items-center justify-center text-xs shrink-0 active:scale-95 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const res = drinkHealthPotion();
                        if (res.success) {
                          hapticSuccess();
                          toast({ title: "🧪 Drank Potion!", description: `Restored +30% Health!` });
                        } else {
                          hapticSuccess();
                          window.dispatchEvent(new CustomEvent('open-inventory-bag', { detail: { tab: 'stored', filter: 'consumable' } }));
                        }
                      }}
                    >
                      🧪
                    </button>

                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-purple-300 cursor-pointer active:scale-95 transition-transform" onClick={() => setShowFocusModal(true)}>
                      <span>🧠</span>
                      <span>{charStats.focus_points || 102} FP</span>
                    </div>
                  </div>
                )}

                {/* Mobile Slide 2: Essences, Fuel, Streak Freeze */}
                {activeSlide % 6 === 2 && (
                  <div className="flex items-center justify-around gap-2 text-xs font-mono font-bold animate-fadeIn">
                    <div className="flex items-center gap-1 text-emerald-300 cursor-pointer active:scale-95 transition-transform" onClick={() => openDrawer('essences')}>
                      <span>✨</span> <span>12</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-300 cursor-pointer active:scale-95 transition-transform" onClick={() => openDrawer('fuel')}>
                      <span>⚡</span> <span>85%</span>
                    </div>
                    <div className="flex items-center gap-1 text-cyan-300 cursor-pointer active:scale-95 transition-transform" onClick={() => openDrawer('freeze')}>
                      <span>❄️</span> <span>1</span>
                    </div>
                  </div>
                )}

                {/* Mobile Slide 3: Forge Fire, Sanctuary, Multipliers */}
                {activeSlide % 6 === 3 && (
                  <div className="flex items-center justify-between gap-1.5 text-[9px] font-bold font-serif animate-fadeIn">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/50 text-amber-300 cursor-pointer" onClick={() => openDrawer('event')}>
                      <span>🔥</span> <span>Forge Fire</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        hapticMedium();
                        setSanctuaryMode(!sanctuaryMode);
                      }}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors cursor-pointer",
                        sanctuaryMode ? "bg-indigo-950 border-indigo-400 text-indigo-200" : "bg-zinc-900 border-zinc-700 text-zinc-400"
                      )}
                    >
                      <span>🛡️</span> <span>Sanctuary</span>
                    </button>
                    <span className="px-1.5 py-0.5 rounded bg-orange-950 border border-orange-500/40 text-orange-300 cursor-pointer" onClick={() => openDrawer('event')}>⚔️ x4</span>
                  </div>
                )}

                {/* Mobile Slide 4: Recovery & Dungeon Buffs */}
                {activeSlide % 6 === 4 && (
                  <div className="flex items-center justify-between gap-1 text-[9px] animate-fadeIn">
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-200 font-serif font-bold cursor-pointer" onClick={() => openDrawer('recovery')}>
                      🛡️ Recovery (0/2)
                    </span>
                    <div className="flex items-center gap-1 font-mono font-bold cursor-pointer" onClick={() => openDrawer('buffs')}>
                      <span className="px-1 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-500/40">⚔️ +15%</span>
                      <span className="px-1 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/40">🪄 +10%</span>
                    </div>
                  </div>
                )}

                {/* Mobile Slide 5: Quick Actions Ribbon */}
                {activeSlide % 6 === 5 && (
                  <div className="flex items-center justify-around gap-1 text-[9px] font-bold animate-fadeIn">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const res = drinkHealthPotion();
                        if (res.success) {
                          hapticSuccess();
                          toast({ title: "🧪 Drank Potion!", description: "Restored +30% Health!" });
                        } else {
                          hapticSuccess();
                          window.dispatchEvent(new CustomEvent('open-inventory-bag', { detail: { tab: 'stored', filter: 'consumable' } }));
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950 border border-amber-500/50 text-amber-300 active:scale-95 transition-transform"
                    >
                      <span>🧪</span> <span>Auto-Potion</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        hapticMedium();
                        setShowFocusModal(true);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950 border border-purple-500/50 text-purple-200 active:scale-95 transition-transform"
                    >
                      <span>🧠</span> <span>Focus ({charStats.focus_points || 102})</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        hapticSuccess();
                        setShowSpellModal(true);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-200 active:scale-95 transition-transform"
                    >
                      <span>🪄</span> <span>Spells</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Chevron Close Button */}
            <button
              type="button"
              onClick={() => {
                hapticSuccess();
                toggleCollapse(true);
              }}
              className="hidden md:flex p-1.5 rounded-full bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 hover:text-white transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
              title="Collapse to Character Avatar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Arcane Spell Menu Modal */}
      <SpellMenuModal isOpen={showSpellModal} onClose={() => setShowSpellModal(false)} />

      {/* Focus Points Modal */}
      <FocusPointsModal
        isOpen={showFocusModal}
        onClose={() => setShowFocusModal(false)}
        currentFocusPoints={charStats.focus_points || 102}
        onStatsUpdate={() => {
          try {
            const s = getCharacterStats();
            if (s) setCharStats({ level: s.level || 1, experience: s.experience || 0, gold: s.gold || 0, focus_points: s.focus_points || 102 });
          } catch {}
        }}
      />

      {/* Interactive Mobile & Desktop Status Item Bottom Sheet Drawer */}
      {activeDrawer && (
        <div className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            onTouchStart={handleDrawerTouchStart}
            onTouchEnd={handleDrawerTouchEnd}
            className="w-full max-w-lg bg-zinc-950 border-t-2 border-amber-500/60 shadow-[0_-12px_48px_rgba(0,0,0,0.95)] rounded-t-3xl p-5 text-white flex flex-col gap-4 animate-slideUp pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            {/* Top Drag Handle Bar */}
            <div className="w-12 h-1.5 bg-amber-500/40 rounded-full mx-auto cursor-grab active:cursor-grabbing mb-1" />

            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 pt-[max(0.25rem,env(safe-area-inset-top))]">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">
                  {activeDrawer === 'health' && '❤️'}
                  {activeDrawer === 'level' && '🟢'}
                  {activeDrawer === 'gold' && '🟡'}
                  {activeDrawer === 'essences' && '✨'}
                  {activeDrawer === 'fuel' && '⚡'}
                  {activeDrawer === 'freeze' && '❄️'}
                  {activeDrawer === 'event' && '🔥'}
                  {activeDrawer === 'recovery' && '🛡️'}
                  {activeDrawer === 'buffs' && '⚔️'}
                </span>
                <div>
                  <h3 className="font-serif font-bold text-lg text-amber-300 leading-none capitalize">
                    {activeDrawer === 'health' && 'Health & Vitality Status'}
                    {activeDrawer === 'level' && `Level ${charStats.level} Progression`}
                    {activeDrawer === 'gold' && 'Royal Treasury Gold'}
                    {activeDrawer === 'essences' && 'Botanical Essences'}
                    {activeDrawer === 'fuel' && 'Ether Voyage Fuel'}
                    {activeDrawer === 'freeze' && 'Streak Freeze Shields'}
                    {activeDrawer === 'event' && 'Active Seasonal Festival'}
                    {activeDrawer === 'recovery' && 'Overdrive Streak Recovery'}
                    {activeDrawer === 'buffs' && 'Today\'s Dungeon Combat Stat Buffs'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">RPG Status Status Overview</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="space-y-4 text-xs text-zinc-300">
              {activeDrawer === 'health' && (
                <div className="space-y-3">
                  <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-red-300">Current Health:</span>
                      <span className="font-mono text-sm text-red-400">{health}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-900 rounded-full border border-red-900/60 overflow-hidden">
                      <div className={cn("h-full transition-all", isPoisoned ? "bg-emerald-400" : "bg-red-500")} style={{ width: `${health}%` }} />
                    </div>
                    <p className="text-[11px] text-zinc-400 italic mt-1">
                      {isPeakKing ? '👑 100% Health! Kingdom tax output boosted by +10%.' : health >= 50 ? '🛡️ Healthy. 1.0x Normal tax output.' : '💀 Low Health. Sluggish tax penalties active!'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button
                      onClick={() => {
                        const res = drinkHealthPotion();
                        if (res.success) {
                          hapticSuccess();
                          toast({ title: "🧪 Drank Protection Potion!", description: `Restored +30% Health!` });
                          setActiveDrawer(null);
                        } else {
                          hapticSuccess();
                          window.dispatchEvent(new CustomEvent('open-inventory-bag', { detail: { tab: 'stored', filter: 'consumable' } }));
                          setActiveDrawer(null);
                        }
                      }}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold h-10"
                    >
                      🧪 Drink Protection Potion (+30% HP)
                    </Button>
                  </div>
                </div>
              )}

              {activeDrawer === 'level' && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2">
                    <div className="flex justify-between items-center font-mono font-bold">
                      <span className="text-emerald-300">Level {charStats.level}</span>
                      <span className="text-emerald-400">{currentXpInLevel} / 100 XP</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-900 rounded-full border border-emerald-900/60 overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${xpPercent}%` }} />
                    </div>
                    <p className="text-[11px] text-zinc-400">Complete daily habits to earn XP, level up, and unlock Paragon ranks at Level 100!</p>
                  </div>
                </div>
              )}

              {activeDrawer === 'gold' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-1">
                    <div className="flex justify-between items-center font-mono font-bold text-amber-300 text-sm">
                      <span>Total Gold:</span>
                      <span>{charStats.gold.toLocaleString()}g</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">Gold is earned from daily habits and kingdom building tax yields.</p>
                  </div>
                  <Button
                    onClick={() => {
                      setActiveDrawer(null);
                      window.location.href = '/market';
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold h-10 flex items-center justify-center gap-2"
                  >
                    🏪 Visit Royal Market <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {activeDrawer === 'essences' && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-1">
                    <h4 className="font-bold text-emerald-300">✨ 12 Botanical Essences</h4>
                    <p className="text-zinc-400 text-[11px]">Harvested from Zen Gardens, Forests, and Botanical buildings. Used for Apotheca potion brewing & citizen training.</p>
                  </div>
                  <Button
                    onClick={() => {
                      setActiveDrawer(null);
                      window.location.href = '/market?tab=apotheca';
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-10 flex items-center justify-center gap-2"
                  >
                    🧪 Open Apotheca Lab <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {activeDrawer === 'fuel' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-950/40 border border-blue-500/40 rounded-xl space-y-1">
                    <h4 className="font-bold text-blue-300">⚡ 85% Ether Voyage Fuel</h4>
                    <p className="text-zinc-400 text-[11px]">Propelled by real-world habit completion. Knowledge habits increase flight speed and 7+ day streaks double voyage speed!</p>
                  </div>
                  <Button
                    onClick={() => {
                      setActiveDrawer(null);
                      window.location.href = '/kingdom?tab=airship';
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-10 flex items-center justify-center gap-2"
                  >
                    ⛵ Airship Voyages <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {activeDrawer === 'freeze' && (
                <div className="space-y-3">
                  <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xl space-y-1">
                    <h4 className="font-bold text-cyan-300">❄️ 1 Streak Freeze Shield</h4>
                    <p className="text-zinc-400 text-[11px]">Automatically protects your habit streak from resetting if you miss a day or need a rest day!</p>
                  </div>
                </div>
              )}

              {activeDrawer === 'event' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-2">
                    <h4 className="font-serif font-bold text-amber-300 text-sm">🔥 FORGE FIRE FESTIVAL (Active)</h4>
                    <p className="text-zinc-400 text-[11px]">Blacksmith, Archery, and Jousting properties gain +20% Gold and +10% XP output during this festival.</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded bg-orange-950 border border-orange-500/40 text-orange-300">⚔️ MIGHT x4</span>
                      <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-300">📖 KNOWLEDGE x2</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">🧘 WELLNESS x3</span>
                    </div>
                  </div>
                </div>
              )}

              {activeDrawer === 'recovery' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-1">
                    <h4 className="font-serif font-bold text-amber-300">🛡️ Overdrive Streak Recovery (0/2)</h4>
                    <p className="text-zinc-400 text-[11px]">Your streak was at risk! Complete 2 habits today (0/2) to fully repair your streak.</p>
                  </div>
                </div>
              )}

              {activeDrawer === 'buffs' && (
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-red-950/60 via-zinc-900 to-blue-950/60 border border-red-500/40 rounded-xl space-y-2">
                    <h4 className="font-serif font-bold text-amber-300">⚔️ Today&apos;s Dungeon Combat Stat Buffs</h4>
                    <p className="text-zinc-400 text-[11px]">Completing today&apos;s habits grants dynamic combat multipliers in Dungeon Keep battles!</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-500/40 font-mono">⚔️ Might: +15% ATK</span>
                      <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/40 font-mono">🪄 Knowledge: +10% Magic</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-500/40 font-mono">🛡️ Castle: +10% Armor</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}





