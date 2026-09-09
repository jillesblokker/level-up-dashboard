'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Trophy,
  RotateCcw,
  Undo2,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@clerk/nextjs';
import { addToCharacterStat, getCharacterStats } from '@/lib/character-stats-service';
import { gainGold } from '@/lib/gold-manager';
import { gainExperience } from '@/lib/experience-manager';
import { playSFX, SOUNDS } from '@/lib/sound-manager';
import { hapticSuccess, hapticMedium, hapticLight } from '@/lib/haptics';
import {
  ICE_LEVELS,
  IceLevelConfig,
  SlideDirection,
  calculateSlide,
} from '@/lib/minigames/ice-slide-engine';

interface PenguinIceSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PenguinIceSlideModal({ isOpen, onClose, onSuccess }: PenguinIceSlideModalProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const playerName = user?.firstName || user?.username || 'Hero';

  const [encounterPuzzles, setEncounterPuzzles] = useState<IceLevelConfig[]>(() => {
    const shuffled = [...ICE_LEVELS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  });
  const [encounterStep, setEncounterStep] = useState<number>(1);
  const [isEncounterCompleted, setIsEncounterCompleted] = useState<boolean>(false);

  const currentConfig: IceLevelConfig =
    encounterPuzzles[encounterStep - 1] || encounterPuzzles[0] || ICE_LEVELS[0]!;

  const [penguinPos, setPenguinPos] = useState<{ x: number; y: number }>(currentConfig.start);
  const [history, setHistory] = useState<Array<{ x: number; y: number }>>([]);
  const [isSliding, setIsSliding] = useState<boolean>(false);
  const [moves, setMoves] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [isDailyClaimed, setIsDailyClaimed] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [facing, setFacing] = useState<'left' | 'right'>('right');

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize level
  const initLevel = useCallback((config: IceLevelConfig) => {
    setPenguinPos(config.start);
    setHistory([]);
    setMoves(0);
    setSeconds(0);
    setIsSolved(false);
    setIsSliding(false);
    setIsTimerRunning(true);
    setFacing('right');
  }, []);

  // Daily check and randomize 3-puzzle encounter on open
  useEffect(() => {
    if (!isOpen) {
      setIsTimerRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const today = new Date().toDateString();
    const lastPlayed = typeof window !== 'undefined' ? localStorage.getItem('minigame_penguin_ice_date') : null;
    setIsDailyClaimed(lastPlayed === today);

    // Pick 3 distinct random levels for this encounter
    const shuffled = [...ICE_LEVELS].sort(() => 0.5 - Math.random());
    const threePuzzles = shuffled.slice(0, 3);
    setEncounterPuzzles(threePuzzles);
    setEncounterStep(1);
    setIsEncounterCompleted(false);
    initLevel(threePuzzles[0]!);
  }, [isOpen, initLevel]);

  // Stopwatch timer
  useEffect(() => {
    if (!isTimerRunning || isSolved) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, isSolved]);

  // Execute slide move in direction
  const handleSlide = useCallback(
    (dir: SlideDirection) => {
      if (isSliding || isSolved) return;

      const step = calculateSlide(penguinPos, dir, currentConfig);
      // No movement
      if (step.x === penguinPos.x && step.y === penguinPos.y) {
        hapticLight();
        return;
      }

      if (dir === 'left') setFacing('left');
      if (dir === 'right') setFacing('right');

      setIsSliding(true);
      hapticMedium();
      try {
        playSFX(SOUNDS.BUTTON_CLICK);
      } catch (e) {}

      // Save previous position in history
      setHistory(prev => [...prev, penguinPos]);
      const nextMoves = moves + 1;
      setMoves(nextMoves);

      // Slide duration proportional to tiles traveled (min 180ms, max 380ms)
      const distance = Math.abs(step.x - penguinPos.x) + Math.abs(step.y - penguinPos.y);
      const slideDurationMs = Math.min(380, 180 + distance * 35);

      setPenguinPos({ x: step.x, y: step.y });

      setTimeout(() => {
        setIsSliding(false);

        if (step.hitRock) {
          hapticLight();
        }

        if (step.hitExit) {
          handleVictory(nextMoves);
        }
      }, slideDurationMs);
    },
    [penguinPos, isSliding, isSolved, currentConfig, moves]
  );

  // Victory flow
  const handleVictory = async (finalMoves: number) => {
    setIsSolved(true);
    setIsTimerRunning(false);
    hapticSuccess();
    try {
      playSFX(SOUNDS.ACHIEVEMENT);
    } catch (e) {}

    if (encounterStep >= 3) {
      setIsEncounterCompleted(true);
    }

    const today = new Date().toDateString();
    const lastPlayed = typeof window !== 'undefined' ? localStorage.getItem('minigame_penguin_ice_date') : null;
    const isFirstTimeToday = lastPlayed !== today;

    if (isFirstTimeToday) {
      setIsClaiming(true);
      try {
        localStorage.setItem('minigame_penguin_ice_date', today);
        setIsDailyClaimed(true);

        const goldBonus = currentConfig.difficulty === 'glacial' ? 300 : 200;
        const xpBonus = currentConfig.difficulty === 'glacial' ? 150 : 100;

        gainGold(goldBonus, 'minigame-penguin-slide');
        await gainExperience(xpBonus, 'minigame-penguin-slide', 'vitality');
        await addToCharacterStat('frost_essence', 1, 'penguin-ice-solve');

        window.dispatchEvent(new Event('character-stats-update'));

        toast({
          title: encounterStep >= 3 ? "Penguino reached his igloo! 🐧" : "Glacier crossed! 🐧",
          description:
            encounterStep >= 3
              ? `Penguino safely crossed all 3 glaciers home! Awarded +${goldBonus} gold, +${xpBonus} exp & +1 frost essence.`
              : `Glacier ${encounterStep} of 3 crossed! Awarded +${goldBonus} gold, +${xpBonus} exp & +1 frost essence.`,
        });

        if (onSuccess) onSuccess();
      } catch (err) {
        console.error('Failed to claim penguin rewards:', err);
      } finally {
        setIsClaiming(false);
      }
    } else {
      toast({
        title: encounterStep >= 3 ? "Penguino reached his igloo! 🐧" : "Clean glide!",
        description:
          encounterStep >= 3
            ? `Penguino safely made it across all 3 glaciers back to his igloo!`
            : `Glacier ${encounterStep} of 3 completed in ${finalMoves} moves!`,
      });
    }
  };

  // Undo move
  const handleUndo = () => {
    if (isSliding || isSolved || history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    if (previous) {
      setPenguinPos(previous);
      setMoves(m => Math.max(0, m - 1));
    }
  };

  // Reset daily with Focus Points
  const handleResetDailyWithFocus = async () => {
    const stats = getCharacterStats();
    const currentFocus = stats.focus_points || 0;
    const FOCUS_COST = 5;

    if (currentFocus < FOCUS_COST) {
      toast({
        title: "Need more focus points",
        description: `Resetting daily penguin rewards requires ${FOCUS_COST} focus points. You have ${currentFocus}.`,
        variant: "destructive",
      });
      return;
    }

    await addToCharacterStat('focus_points', -FOCUS_COST, 'reset-penguin-ice-daily');
    localStorage.removeItem('minigame_penguin_ice_date');
    setIsDailyClaimed(false);
    window.dispatchEvent(new Event('character-stats-update'));

    toast({
      title: "Glacial lake refreshed!",
      description: `Spent ${FOCUS_COST} focus points to unlock daily penguin rewards again!`,
    });

    initLevel(currentConfig);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Avoid capturing when typing inside inputs
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S', 'ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D', 'z', 'Z', 'r', 'R'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          handleSlide('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handleSlide('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleSlide('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleSlide('right');
          break;
        case 'z':
        case 'Z':
          handleUndo();
          break;
        case 'r':
        case 'R':
          initLevel(currentConfig);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [isOpen, handleSlide, handleUndo, initLevel, currentConfig]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const minDistance = 24;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minDistance) {
      if (dx > 0) handleSlide('right');
      else handleSlide('left');
    } else if (Math.abs(dy) > minDistance) {
      if (dy > 0) handleSlide('down');
      else handleSlide('up');
    }
  };

  // Format stopwatch time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const rocksSet = new Set(currentConfig.rocks.map(r => `${r.x},${r.y}`));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl w-full bg-[#05111c] border border-cyan-500/30 text-cyan-50 p-4 sm:p-6 rounded-2xl shadow-2xl font-serif z-[100] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="text-center pb-1">
          <DialogTitle className="text-2xl font-medieval text-cyan-300">
            Penguino escape
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 italic">
            Slide across frictionless ice using arrow keys or the D-pad. Bank off the granite boulders to find the path home.
          </DialogDescription>
        </DialogHeader>

        {/* Penguino Avatar & Story Banner */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-sky-950/40 via-cyan-950/30 to-zinc-950 border border-cyan-500/30 p-2.5 rounded-2xl shadow-md my-1">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-400/60 shadow-[0_0_10px_rgba(56,189,248,0.3)] shrink-0 bg-cyan-950 flex items-center justify-center">
            <div className="w-8 h-8 relative">
              <Image
                src="/images/Animals/penguin.webp"
                alt="Penguino"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-xs font-bold font-serif text-cyan-300 flex items-center gap-1.5">
              <span>Penguino</span>
              <span className="text-[10px] font-mono text-zinc-400 font-normal">Glacial Wanderer</span>
            </div>
            <p className="text-xs text-zinc-200 font-serif italic leading-snug pt-0.5">
              {isEncounterCompleted ? (
                <span>&ldquo;Thanks for your help {playerName}, Penguino made it safely back to his igloo!&rdquo;</span>
              ) : (
                <span>&ldquo;Penguino wants to get back to his igloo, help him slide across the ice to the exit.&rdquo;</span>
              )}
            </p>
          </div>
        </div>

        {/* Moves & Time Stats Bar */}
        <div className="flex items-center justify-between bg-zinc-950/80 px-3 py-2 rounded-xl border border-cyan-950/60 text-xs my-1">
          <span className="text-zinc-400 font-mono text-[11px] truncate flex items-center gap-1.5">
            <span className="text-cyan-400 font-bold font-serif">Glacier {encounterStep} of 3</span>
            <span className="text-zinc-600">&bull;</span>
            <span className="truncate">{currentConfig.title}</span>
          </span>
          <div className="flex items-center gap-4 font-mono text-xs text-zinc-300 ml-auto">
            <span>Moves: <strong className="text-cyan-400 font-bold">{moves}</strong> / {currentConfig.parMoves}</span>
            <span>Time: <strong className="text-amber-400 font-bold">{formatTime(seconds)}</strong></span>
          </div>
        </div>

        {/* Daily Status Banner */}
        <div className="flex items-center justify-between bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-cyan-900/30 text-[11px]">
          <div className="flex items-center gap-2">
            {isDailyClaimed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Daily reward claimed (practice mode)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="text-amber-300 font-medium">Daily run ready (+200 Gold, +100 EXP, +Fish)</span>
              </>
            )}
          </div>

          {isDailyClaimed && (
            <button
              onClick={handleResetDailyWithFocus}
              className="text-cyan-400 hover:text-cyan-300 underline font-mono text-[10px] ml-auto"
            >
              Reset for 5 FP
            </button>
          )}
        </div>

        {/* Ice Arena Canvas */}
        <div
          className="relative mx-auto my-2 p-2 sm:p-3 bg-gradient-to-b from-sky-950/60 to-slate-950 rounded-2xl border-2 border-cyan-600/30 shadow-2xl flex flex-col items-center justify-center select-none touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Subtle Ice Sheen Background Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-400/10 via-transparent to-transparent rounded-2xl pointer-events-none" />

          {/* Grid Cells */}
          <div
            className="relative grid gap-1 border border-cyan-800/40 rounded-xl p-1 bg-cyan-950/30"
            style={{
              gridTemplateColumns: `repeat(${currentConfig.width}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${currentConfig.height}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: currentConfig.height }).map((_, r) =>
              Array.from({ length: currentConfig.width }).map((__, c) => {
                const isRock = rocksSet.has(`${c},${r}`);
                const isExit = c === currentConfig.exit.x && r === currentConfig.exit.y;
                const isStart = c === currentConfig.start.x && r === currentConfig.start.y;

                return (
                  <div
                    key={`tile-${c}-${r}`}
                    className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center relative overflow-hidden transition-colors border ${
                      isRock
                        ? 'bg-stone-900 border-stone-700 shadow-md'
                        : isExit
                        ? 'border-2 border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                        : 'border-cyan-400/20'
                    }`}
                    style={
                      !isRock
                        ? {
                            backgroundImage: `url('/images/tiles/ice-tile.webp')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : undefined
                    }
                  >
                    {/* Rock Graphic */}
                    {isRock && (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 relative drop-shadow-md">
                        <Image
                          src="/images/items/materials/material-stone.webp"
                          alt="Rock"
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}

                    {/* Exit Glowing Bar Indicator (similar to plank labyrinth exit beacon) */}
                    {isExit && (
                      <div className="absolute inset-0 bg-amber-400/20 pointer-events-none flex items-center justify-center">
                        <div className="w-full h-full border-2 border-amber-300/80 rounded-lg shadow-[inset_0_0_10px_rgba(245,158,11,0.6)] animate-pulse" />
                        <div className="absolute right-0 inset-y-1.5 w-1.5 rounded-l-md bg-gradient-to-b from-amber-400 via-orange-400 to-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.95)] animate-pulse border border-amber-200" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Sliding Penguin Actor */}
            <div
              className="absolute z-30 pointer-events-none transition-all duration-200 ease-out"
              style={{
                width: `${100 / currentConfig.width}%`,
                height: `${100 / currentConfig.height}%`,
                left: `${(penguinPos.x / currentConfig.width) * 100}%`,
                top: `${(penguinPos.y / currentConfig.height) * 100}%`,
              }}
            >
              <div
                className={`w-full h-full flex items-center justify-center p-1 transition-transform duration-150 ${
                  facing === 'left' ? 'scale-x-[-1]' : ''
                } ${isSliding ? 'scale-105' : ''}`}
              >
                <div className="w-7 h-7 sm:w-9 sm:h-9 relative drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
                  <Image
                    src="/images/Animals/penguin.webp"
                    alt="Penguin"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile & Tablet Virtual D-Pad (hidden on desktop) */}
        <div className="flex flex-col items-center justify-center pt-1 sm:hidden">
          <div className="grid grid-cols-3 gap-1.5 w-44">
            <div />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSlide('up')}
              disabled={isSliding || isSolved}
              aria-label="Slide up"
              className="bg-slate-900 border-cyan-800 text-cyan-200 hover:bg-cyan-950 p-2 h-10"
            >
              <ChevronUp className="w-5 h-5" />
            </Button>
            <div />

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSlide('left')}
              disabled={isSliding || isSolved}
              aria-label="Slide left"
              className="bg-slate-900 border-cyan-800 text-cyan-200 hover:bg-cyan-950 p-2 h-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSlide('down')}
              disabled={isSliding || isSolved}
              aria-label="Slide down"
              className="bg-slate-900 border-cyan-800 text-cyan-200 hover:bg-cyan-950 p-2 h-10"
            >
              <ChevronDown className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSlide('right')}
              disabled={isSliding || isSolved}
              aria-label="Slide right"
              className="bg-slate-900 border-cyan-800 text-cyan-200 hover:bg-cyan-950 p-2 h-10"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Encounter Completed Celebratory Card */}
        {isEncounterCompleted && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-sky-950/60 via-zinc-950 to-cyan-950/60 border border-cyan-500/40 text-center my-1">
            <p className="text-cyan-300 font-serif font-bold text-sm">Igloo reached safely!</p>
            <p className="text-zinc-300 text-xs mt-0.5">Penguino safely glided across all 3 glaciers back home.</p>
          </div>
        )}

        {/* Bottom Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {!isEncounterCompleted && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={isSliding || isSolved || history.length === 0}
                className="bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300 text-xs gap-1"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => initLevel(currentConfig)}
                className="bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300 text-xs gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            </div>
          )}

          {isEncounterCompleted ? (
            <Button
              size="sm"
              onClick={onClose}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-serif font-bold text-xs shadow-lg shadow-amber-950 py-2.5"
            >
              Close
            </Button>
          ) : isSolved ? (
            <Button
              size="sm"
              onClick={() => {
                const nextStep = encounterStep + 1;
                setEncounterStep(nextStep);
                initLevel(encounterPuzzles[nextStep - 1]!);
              }}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-serif text-xs gap-1 shadow-lg shadow-cyan-950"
            >
              Next glacier ({encounterStep + 1}/3)
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300 text-xs"
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
