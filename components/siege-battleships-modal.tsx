"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { addToCharacterStat } from '@/lib/character-stats-service';
import { playSFX, SOUNDS } from '@/lib/sound-manager';
import { Bomb, Castle, Sparkles, Target } from 'lucide-react';

interface GridCell {
  x: number;
  y: number;
  hasTarget: boolean;
  targetType?: 'tower' | 'ram' | 'wall' | undefined;
  hit: boolean;
}

interface SiegeBattleshipModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function SiegeBattleshipModal({ isOpen: controlledIsOpen, onClose }: SiegeBattleshipModalProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleOpenChange = (open: boolean) => {
    if (!open && onClose) onClose();
    if (!isControlled) setInternalIsOpen(open);
  };

  const [boulders, setBoulders] = useState(5);
  const [score, setScore] = useState(0);
  const [grid, setGrid] = useState<GridCell[]>(() => generateInitialGrid());

  function generateInitialGrid(): GridCell[] {
    const cells: GridCell[] = [];
    const targetIndices = new Set([2, 7, 8, 12, 18, 22]); // 6 hidden target coordinates in 5x5 grid

    for (let i = 0; i < 25; i++) {
      const x = i % 5;
      const y = Math.floor(i / 5);
      const isTarget = targetIndices.has(i);
      cells.push({
        x,
        y,
        hasTarget: isTarget,
        targetType: isTarget ? (i % 2 === 0 ? 'tower' : 'ram') : undefined,
        hit: false
      });
    }
    return cells;
  }

  const handleLaunchCatapult = (index: number) => {
    if (boulders <= 0 || !grid[index] || grid[index]!.hit) return;

    const newGrid = [...grid];
    if (!newGrid[index]) return;
    newGrid[index]!.hit = true;
    setGrid(newGrid);
    setBoulders(prev => prev - 1);

    if (newGrid[index]!.hasTarget) {
      setScore(prev => prev + 1);
      addToCharacterStat('gold', 250);
      addToCharacterStat('build_tokens', 1);
      playSFX(SOUNDS.DUNGEON_CHALLENGE);
      toast({
        title: "💥 Direct catapult hit!",
        description: `Destroyed enemy ${newGrid[index]!.targetType || 'fortress wall'}! Earned +250 gold & 1x crafting stone.`,
      });
    } else {
      toast({
        title: "💨 Boulder Missed!",
        description: "Strike landed in the outer moat.",
      });
    }
  };

  const handleReset = () => {
    setGrid(generateInitialGrid());
    setBoulders(5);
    setScore(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
            <Bomb className="w-4 h-4 text-red-300" />
            <span>Catapult Siege</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="bg-zinc-950 border border-red-500/30 text-white max-w-md p-4 sm:p-6 rounded-2xl shadow-2xl space-y-3 sm:space-y-4 max-h-[88dvh] overflow-y-auto">
        <DialogHeader className="pr-10 sm:pr-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <DialogTitle className="flex items-center gap-2 font-serif text-red-300 text-xl break-words">
              <Castle className="w-5 h-5 text-red-400 shrink-0" />
              <span>Catapult siege battleships</span>
            </DialogTitle>
            <Badge variant="outline" className="border-red-500/40 text-red-200 text-xs font-mono font-bold w-fit">
              🪨 {boulders} boulders left
            </Badge>
          </div>
        </DialogHeader>

        <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/80 p-3 rounded-xl border border-white/10">
          Target hidden enemy siege towers and rams on the 5x5 fortress grid. Direct hits yield gold and building stone!
        </p>

        {/* 5x5 Battleship Grid */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 p-2 bg-zinc-900/90 rounded-2xl border border-white/10 w-full">
          {grid.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handleLaunchCatapult(idx)}
              disabled={cell.hit || boulders <= 0}
              className={`aspect-square min-h-[44px] rounded-xl border flex items-center justify-center text-base sm:text-lg font-bold transition-all ${
                cell.hit
                  ? cell.hasTarget
                    ? 'bg-red-950 border-red-500 text-red-400 animate-bounce'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-600 opacity-60'
                  : 'bg-zinc-800 border-white/10 hover:border-red-400/60 hover:bg-zinc-700 active:scale-95'
              }`}
            >
              {cell.hit ? (cell.hasTarget ? '💥' : '🌊') : '🎯'}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs font-mono pt-2">
          <span className="text-zinc-400">Fortress Targets Destroyed: <strong className="text-amber-400">{score} / 6</strong></span>
          <Button onClick={handleReset} variant="outline" size="sm" className="text-xs text-zinc-300 h-8">
            Reload Siege
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
