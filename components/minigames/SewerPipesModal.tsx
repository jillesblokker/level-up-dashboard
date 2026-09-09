'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Trophy, RotateCcw, Droplets, CheckCircle2, Waves, ArrowRight, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { addToCharacterStat, getCharacterStats } from '@/lib/character-stats-service';
import { gainGold } from '@/lib/gold-manager';
import { gainExperience } from '@/lib/experience-manager';
import { playSFX, SOUNDS } from '@/lib/sound-manager';
import { hapticSuccess, hapticMedium } from '@/lib/haptics';
import {
  PIPE_LEVELS,
  PipeLevelConfig,
  PipeCell,
  createPipeGrid,
  simulateFlow,
  SimulationResult,
} from '@/lib/minigames/pipe-puzzle-engine';

interface SewerPipesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SewerPipesModal({ isOpen, onClose, onSuccess }: SewerPipesModalProps) {
  const { toast } = useToast();

  const [levelIndex, setLevelIndex] = useState<number>(0);
  const currentConfig: PipeLevelConfig = PIPE_LEVELS[levelIndex] || PIPE_LEVELS[0]!;

  const [grid, setGrid] = useState<PipeCell[][]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [isDailyClaimed, setIsDailyClaimed] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or reset level
  const initLevel = useCallback(
    (config: PipeLevelConfig) => {
      const newGrid = createPipeGrid(config, true);
      // Run initial flow simulation on scrambled grid
      const sim = simulateFlow(newGrid, config);
      setGrid(sim.updatedGrid);
      setMoves(0);
      setSeconds(0);
      setIsSolved(sim.isSolved);
      setShowCelebration(false);
      setIsTimerRunning(true);
    },
    []
  );

  // Check daily limit on modal open
  useEffect(() => {
    if (!isOpen) {
      setIsTimerRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const today = new Date().toDateString();
    const lastPlayed = typeof window !== 'undefined' ? localStorage.getItem('minigame_sewer_pipes_date') : null;
    setIsDailyClaimed(lastPlayed === today);

    initLevel(currentConfig);
  }, [isOpen, currentConfig, initLevel]);

  // Timer counter
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

  // Handle pipe tile click / rotation
  const handleTileClick = (r: number, c: number) => {
    if (isSolved) return;

    const cell = grid[r]?.[c];
    if (!cell || cell.isLocked || cell.type === 'empty') return;

    hapticMedium();
    try {
      playSFX(SOUNDS.BUTTON_CLICK);
    } catch (e) {}

    // Rotate cell 90 deg clockwise
    const nextGrid = grid.map((row, rowIdx) =>
      row.map((curr, colIdx) => {
        if (rowIdx === r && colIdx === c) {
          return {
            ...curr,
            rotation: (curr.rotation + 1) % 4,
          };
        }
        return curr;
      })
    );

    const nextMoves = moves + 1;
    setMoves(nextMoves);

    // Simulate flow with new layout
    const sim: SimulationResult = simulateFlow(nextGrid, currentConfig);
    setGrid(sim.updatedGrid);

    if (sim.isSolved) {
      handleVictory(nextMoves);
    }
  };

  // Handle victory flow
  const handleVictory = async (finalMoves: number) => {
    setIsSolved(true);
    setIsTimerRunning(false);
    hapticSuccess();
    try {
      playSFX(SOUNDS.ACHIEVEMENT);
    } catch (e) {}

    const today = new Date().toDateString();
    const lastPlayed = typeof window !== 'undefined' ? localStorage.getItem('minigame_sewer_pipes_date') : null;
    const isFirstTimeToday = lastPlayed !== today;

    if (isFirstTimeToday) {
      setIsClaiming(true);
      try {
        localStorage.setItem('minigame_sewer_pipes_date', today);
        setIsDailyClaimed(true);

        // Award rewards
        const goldBonus = currentConfig.difficulty === 'expert' ? 350 : 250;
        const xpBonus = currentConfig.difficulty === 'expert' ? 180 : 120;

        gainGold(goldBonus, 'minigame-sewer-pipes');
        await gainExperience(xpBonus, 'minigame-sewer-pipes', 'general');
        await addToCharacterStat('build_tokens', 2, 'sewer-pipes-solve');
        await addToCharacterStat('tide_essence', 1, 'sewer-pipes-solve');

        window.dispatchEvent(new Event('character-stats-update'));
        window.dispatchEvent(new CustomEvent('kingdom-building-collected'));

        toast({
          title: "💧 Aqueduct restored!",
          description: `All valves sealed! Awarded +${goldBonus} Gold, +${xpBonus} EXP, +2 Crafting Blocks & +1 Tide Essence.`,
        });

        if (onSuccess) onSuccess();
      } catch (err) {
        console.error('Failed to claim sewer rewards:', err);
      } finally {
        setIsClaiming(false);
      }
    } else {
      toast({
        title: "💧 Clear water flowing!",
        description: `Practice puzzle solved in ${finalMoves} moves!`,
      });
    }

    setShowCelebration(true);
  };

  // Reset with Focus Points
  const handleResetDailyWithFocus = async () => {
    const stats = getCharacterStats();
    const currentFocus = stats.focus_points || 0;
    const FOCUS_COST = 5;

    if (currentFocus < FOCUS_COST) {
      toast({
        title: "Need more focus points",
        description: `Resetting daily sewer rewards requires ${FOCUS_COST} focus points. You have ${currentFocus}.`,
        variant: "destructive",
      });
      return;
    }

    await addToCharacterStat('focus_points', -FOCUS_COST, 'reset-sewer-pipes-daily');
    localStorage.removeItem('minigame_sewer_pipes_date');
    setIsDailyClaimed(false);
    window.dispatchEvent(new Event('character-stats-update'));

    toast({
      title: "Sewers refreshed!",
      description: `Spent ${FOCUS_COST} focus points to unlock daily rewards again!`,
    });

    initLevel(currentConfig);
  };

  // Format stopwatch time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl w-full bg-[#0a0f14] border border-cyan-900/40 text-cyan-50 p-4 sm:p-6 rounded-2xl shadow-2xl font-serif z-[100] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center mb-1 shadow-lg shadow-cyan-950/50">
            <Droplets className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-medieval text-cyan-300">
            Castle sewers & aqueduct
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 italic">
            Rotate the copper joints and brass valves to restore pressure from the mountain spring to the citadel cisterns.
          </DialogDescription>
        </DialogHeader>

        {/* Level / Difficulty Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950/80 p-2 rounded-xl border border-cyan-950/60 text-xs">
          <div className="flex items-center gap-1">
            {PIPE_LEVELS.map((lvl, idx) => {
              const active = idx === levelIndex;
              return (
                <button
                  key={lvl.id}
                  onClick={() => {
                    setLevelIndex(idx);
                    initLevel(lvl);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-sans font-medium transition-colors ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60'
                  }`}
                >
                  {lvl.difficulty === 'standard' && 'Standard (4×4)'}
                  {lvl.difficulty === 'advanced' && 'Advanced (5×5)'}
                  {lvl.difficulty === 'expert' && 'Expert dual (6×6)'}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-300 ml-auto">
            <span>Moves: <strong className="text-cyan-400">{moves}</strong></span>
            <span>Time: <strong className="text-amber-400">{formatTime(seconds)}</strong></span>
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
                <span className="text-amber-300 font-medium">Daily run ready (+250 Gold, +120 EXP, +Stone)</span>
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

        {/* Pipe Grid Board */}
        <div className="relative mx-auto my-2 p-3 sm:p-4 bg-slate-950 rounded-2xl border-2 border-cyan-950 shadow-inner flex flex-col items-center justify-center">
          {/* Legend for Dual Expert Mode */}
          {currentConfig.difficulty === 'expert' && (
            <div className="w-full flex items-center justify-between text-[10px] font-sans px-2 pb-2 text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_6px_#38bdf8]" />
                Fresh water line
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block shadow-[0_0_6px_#c084fc]" />
                Alchemical ether line
              </span>
              <span className="text-zinc-500 italic">Cross pipes bridge both lines!</span>
            </div>
          )}

          <div
            className="grid gap-1 sm:gap-1.5 max-w-full justify-center"
            style={{
              gridTemplateColumns: `repeat(${currentConfig.size}, minmax(0, 1fr))`,
            }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const isWater = cell.flow.water;
                const isEther = cell.flow.ether;

                // Color tint for active fluid
                let fluidGlow = '';
                if (isWater && isEther) fluidGlow = 'ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]';
                else if (isWater) fluidGlow = 'ring-1 ring-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]';
                else if (isEther) fluidGlow = 'ring-1 ring-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.4)]';

                return (
                  <button
                    key={cell.id}
                    onClick={() => handleTileClick(r, c)}
                    disabled={isSolved || cell.isLocked || cell.type === 'empty'}
                    aria-label={`Pipe at row ${r + 1}, column ${c + 1}`}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-slate-800/80 bg-gradient-to-br from-slate-900 to-zinc-950 flex items-center justify-center p-1 transition-transform duration-200 active:scale-95 cursor-pointer select-none ${fluidGlow} ${
                      cell.type === 'empty' ? 'opacity-20 cursor-default' : 'hover:border-cyan-500/40'
                    }`}
                  >
                    {/* Render Pipe Fitting SVG */}
                    <PipeVisual
                      type={cell.type}
                      rotation={cell.rotation}
                      flowWater={cell.flow.water}
                      flowEther={cell.flow.ether}
                      crossFlow={cell.crossFlow}
                    />

                    {/* Source / Drain Indicators */}
                    {r === 0 && c === 0 && (
                      <span className="absolute -top-1 -left-1 text-[8px] bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono px-1 rounded-sm shadow">
                        IN
                      </span>
                    )}
                    {currentConfig.difficulty === 'expert' && r === 2 && c === 0 && (
                      <span className="absolute -top-1 -left-1 text-[8px] bg-purple-950 border border-purple-400 text-purple-300 font-mono px-1 rounded-sm shadow">
                        IN
                      </span>
                    )}
                    {r === currentConfig.size - 1 && c === currentConfig.size - 1 && (
                      <span className="absolute -bottom-1 -right-1 text-[8px] bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono px-1 rounded-sm shadow">
                        OUT
                      </span>
                    )}
                    {currentConfig.difficulty === 'expert' && r === 2 && c === currentConfig.size - 1 && (
                      <span className="absolute -bottom-1 -right-1 text-[8px] bg-purple-950 border border-purple-400 text-purple-300 font-mono px-1 rounded-sm shadow">
                        OUT
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => initLevel(currentConfig)}
            className="bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300 text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Scramble & reset
          </Button>

          {isSolved ? (
            <Button
              size="sm"
              onClick={() => {
                if (levelIndex < PIPE_LEVELS.length - 1) {
                  setLevelIndex(l => l + 1);
                  initLevel(PIPE_LEVELS[levelIndex + 1]!);
                } else {
                  onClose();
                }
              }}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-serif text-xs gap-1 shadow-lg shadow-cyan-950"
            >
              {levelIndex < PIPE_LEVELS.length - 1 ? (
                <>
                  Next difficulty
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                'Close aqueduct'
              )}
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

/**
 * Procedural SVG component rendering accurate metallic pipes with real-time liquid flow.
 */
function PipeVisual({
  type,
  rotation,
  flowWater,
  flowEther,
  crossFlow,
}: {
  type: string;
  rotation: number;
  flowWater: boolean;
  flowEther: boolean;
  crossFlow?: { vertical: string; horizontal: string } | undefined;
}) {
  if (type === 'empty') return null;

  const waterColor = '#38bdf8'; // Cyan
  const etherColor = '#c084fc'; // Purple
  const emptyFluidColor = '#1e293b'; // Slate dark
  const metalColor = '#475569';
  const jointColor = '#94a3b8';

  const rotDeg = rotation * 90;

  if (type === 'straight') {
    const fluidFill = flowWater ? waterColor : flowEther ? etherColor : emptyFluidColor;
    return (
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full transition-transform duration-200 pointer-events-none"
        style={{ transform: `rotate(${rotDeg}deg)` }}
      >
        {/* Outer Pipe */}
        <rect x="32" y="0" width="36" height="100" rx="3" fill={metalColor} stroke="#0f172a" strokeWidth="2" />
        {/* Flanges */}
        <rect x="28" y="0" width="44" height="12" rx="2" fill={jointColor} />
        <rect x="28" y="88" width="44" height="12" rx="2" fill={jointColor} />
        {/* Inner Fluid Stream */}
        <rect x="42" y="0" width="16" height="100" rx="2" fill={fluidFill} />
        {/* Specular Highlight */}
        <line x1="45" y1="4" x2="45" y2="96" stroke="white" strokeOpacity={flowWater || flowEther ? 0.6 : 0.15} strokeWidth="2" />
      </svg>
    );
  }

  if (type === 'elbow') {
    const fluidFill = flowWater ? waterColor : flowEther ? etherColor : emptyFluidColor;
    return (
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full transition-transform duration-200 pointer-events-none"
        style={{ transform: `rotate(${rotDeg}deg)` }}
      >
        {/* Outer Curve Pipe (N to E) */}
        <path
          d="M 32,0 L 32,32 L 100,32 L 100,68 L 68,68 L 68,100 L 32,100 Z"
          fill="none"
        />
        <path
          d="M 32,0 L 68,0 L 68,32 A 36 36 0 0 1 100,68 L 100,68 L 100,32 L 100,32 Z"
          fill="none"
        />
        {/* Clean 90-degree corner fitting */}
        <rect x="32" y="0" width="36" height="68" fill={metalColor} stroke="#0f172a" strokeWidth="1.5" />
        <rect x="32" y="32" width="68" height="36" fill={metalColor} stroke="#0f172a" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="18" fill={metalColor} />
        {/* Flanges */}
        <rect x="28" y="0" width="44" height="12" rx="2" fill={jointColor} />
        <rect x="88" y="28" width="12" height="44" rx="2" fill={jointColor} />
        {/* Inner Fluid Stream */}
        <rect x="42" y="0" width="16" height="50" fill={fluidFill} />
        <rect x="50" y="42" width="50" height="16" fill={fluidFill} />
        <circle cx="50" cy="50" r="8" fill={fluidFill} />
        {/* Specular Highlight */}
        <path d="M 46,4 L 46,46 L 96,46" fill="none" stroke="white" strokeOpacity={flowWater || flowEther ? 0.6 : 0.15} strokeWidth="2" />
      </svg>
    );
  }

  if (type === 't-split') {
    const fluidFill = flowWater ? waterColor : flowEther ? etherColor : emptyFluidColor;
    return (
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full transition-transform duration-200 pointer-events-none"
        style={{ transform: `rotate(${rotDeg}deg)` }}
      >
        {/* Main Vertical Pipe */}
        <rect x="32" y="0" width="36" height="100" fill={metalColor} stroke="#0f172a" strokeWidth="1.5" />
        {/* Horizontal Branch to East */}
        <rect x="50" y="32" width="50" height="36" fill={metalColor} stroke="#0f172a" strokeWidth="1.5" />
        {/* Flanges */}
        <rect x="28" y="0" width="44" height="12" rx="2" fill={jointColor} />
        <rect x="28" y="88" width="44" height="12" rx="2" fill={jointColor} />
        <rect x="88" y="28" width="12" height="44" rx="2" fill={jointColor} />
        {/* Fluid core */}
        <rect x="42" y="0" width="16" height="100" fill={fluidFill} />
        <rect x="50" y="42" width="50" height="16" fill={fluidFill} />
      </svg>
    );
  }

  if (type === 'cross') {
    // Cross over bridge: handles independent vertical and horizontal fluid channels
    const vertFill = crossFlow?.vertical === 'water' ? waterColor : crossFlow?.vertical === 'ether' ? etherColor : emptyFluidColor;
    const horizFill = crossFlow?.horizontal === 'water' ? waterColor : crossFlow?.horizontal === 'ether' ? etherColor : emptyFluidColor;

    return (
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full transition-transform duration-200 pointer-events-none"
        style={{ transform: `rotate(${rotDeg}deg)` }}
      >
        {/* Horizontal Underpass Pipe */}
        <rect x="0" y="32" width="100" height="36" fill={metalColor} stroke="#0f172a" strokeWidth="1.5" />
        <rect x="0" y="42" width="100" height="16" fill={horizFill} />
        <rect x="0" y="28" width="12" height="44" rx="2" fill={jointColor} />
        <rect x="88" y="28" width="12" height="44" rx="2" fill={jointColor} />

        {/* Bridge Shadow */}
        <rect x="28" y="26" width="44" height="48" fill="#000000" opacity="0.4" rx="4" />

        {/* Vertical Overpass Pipe */}
        <rect x="32" y="0" width="36" height="100" fill={metalColor} stroke="#0f172a" strokeWidth="1.5" />
        <rect x="42" y="0" width="16" height="100" fill={vertFill} />
        <rect x="28" y="0" width="44" height="12" rx="2" fill={jointColor} />
        <rect x="28" y="88" width="44" height="12" rx="2" fill={jointColor} />

        {/* Central Bridge Hub Bolting */}
        <rect x="30" y="30" width="40" height="40" rx="6" fill="#334155" stroke="#0f172a" strokeWidth="2" />
        <circle cx="50" cy="50" r="12" fill={vertFill} stroke="#1e293b" strokeWidth="2" />
      </svg>
    );
  }

  return null;
}
