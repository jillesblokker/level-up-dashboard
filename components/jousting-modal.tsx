"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { addToCharacterStat } from '@/lib/character-stats-service';
import { playSFX, SOUNDS } from '@/lib/sound-manager';
import { Trophy, Swords, Sparkles, Shield, Coins } from 'lucide-react';

export interface JoustCategory {
  id: string;
  name: string;
  emoji: string;
  playerStat: number; // habit count or stat value
  allyStat: number;
}

interface JoustingTournamentModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function JoustingTournamentModal({ isOpen: controlledIsOpen, onClose }: JoustingTournamentModalProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleOpenChange = (open: boolean) => {
    if (!open && onClose) onClose();
    if (!isControlled) setInternalIsOpen(open);
  };

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [battleState, setBattleState] = useState<'selecting' | 'jousting' | 'result'>('selecting');
  const [joustResults, setJoustResults] = useState<{ wins: number; ties: number; losses: number; netGold: number } | null>(null);

  const categories: JoustCategory[] = [
    { id: 'might', name: 'Might', emoji: '⚔️', playerStat: 14, allyStat: 10 },
    { id: 'knowledge', name: 'Knowledge', emoji: '📜', playerStat: 12, allyStat: 15 },
    { id: 'wellness', name: 'Wellness', emoji: '🧘', playerStat: 18, allyStat: 14 },
    { id: 'craft', name: 'Craft', emoji: '🔨', playerStat: 8, allyStat: 12 },
    { id: 'honor', name: 'Honor', emoji: '🛡️', playerStat: 20, allyStat: 16 }
  ];

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(c => c !== id));
    } else if (selectedCategories.length < 3) {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const handleStartJoust = () => {
    if (selectedCategories.length !== 3) return;
    setBattleState('jousting');
    playSFX(SOUNDS.BUTTON_CLICK); // Sword clang

    setTimeout(() => {
      let wins = 0;
      let ties = 0;
      let losses = 0;

      selectedCategories.forEach(catId => {
        const cat = categories.find(c => c.id === catId);
        if (!cat) return;
        if (cat.playerStat > cat.allyStat) wins++;
        else if (cat.playerStat === cat.allyStat) ties++;
        else losses++;
      });

      let netGold = 0;
      let toastMsg = '';

      if (wins > losses) {
        netGold = 1000;
        addToCharacterStat('gold', 1000);
        addToCharacterStat('gems', 25);
        toastMsg = "+1,000 gold & 25 gems";
      } else if (wins === losses || ties > 0) {
        netGold = 500;
        addToCharacterStat('gold', 500);
        toastMsg = "+500 gold tie reward";
      } else {
        netGold = 100;
        addToCharacterStat('gold', 100);
        toastMsg = "+100 gold reward";
      }

      setJoustResults({ wins, ties, losses, netGold });
      setBattleState('result');
      playSFX(SOUNDS.BATTLE_WIN);

      toast({
        title: "Joust complete",
        description: toastMsg
      });
    }, 2200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="font-serif font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
            <Swords className="w-4 h-4 text-amber-300" />
            <span>Ally joust</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="bg-zinc-950 border border-amber-500/30 text-white max-w-lg p-6 rounded-2xl shadow-2xl space-y-4 max-h-[88dvh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-amber-300 text-xl">
            <Trophy className="w-5 h-5 text-amber-400" />
            Ally joust
          </DialogTitle>
        </DialogHeader>

        {battleState === 'selecting' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-zinc-400">
              <span className="font-medium">Choose 3 virtues</span>
              <span className="font-mono text-amber-400 font-bold">{selectedCategories.length}/3 selected</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {categories.map(c => {
                const isSelected = selectedCategories.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCategory(c.id)}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                      isSelected
                        ? 'border-amber-400/80 bg-amber-950/40 text-amber-200 shadow-md'
                        : 'border-white/10 bg-zinc-900/60 text-zinc-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.emoji}</span>
                      <span className="font-bold">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-emerald-400 font-bold">You: {c.playerStat}</span>
                      <span className="text-zinc-500">vs</span>
                      <span className="text-blue-400 font-bold">Friend: {c.allyStat}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={handleStartJoust}
              disabled={selectedCategories.length !== 3}
              className="w-full h-11 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-black font-serif font-bold text-sm tracking-wide rounded-xl cursor-pointer"
            >
              Start joust
            </Button>
          </div>
        )}

        {battleState === 'jousting' && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            {/* Tilt Yard Showdown Arena */}
            <div className="relative w-full h-44 rounded-2xl bg-gradient-to-r from-amber-950/60 via-zinc-950 to-blue-950/60 border-2 border-amber-500/40 overflow-hidden flex items-center justify-between px-4 sm:px-8 shadow-2xl">
              {/* Tilt Railing Barrier */}
              <div className="absolute inset-x-0 bottom-4 h-2 bg-amber-900/60 border-y border-amber-700/50" />
              
              {/* Player Hero Knight */}
              <div className="relative z-10 flex flex-col items-center animate-in slide-in-from-left duration-700">
                <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl border-2 border-emerald-400/80 overflow-hidden bg-zinc-900 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                  <Image
                    src="/images/character/knight.webp"
                    alt="Player Knight"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span className="mt-1 text-[10px] font-bold text-emerald-300 font-mono">Your knight</span>
              </div>

              {/* Clash Impact Sparks & Swords */}
              <div className="relative z-20 flex flex-col items-center">
                <div className="relative w-12 h-12 rounded-full bg-amber-950/90 border border-amber-400 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.8)] animate-pulse">
                  <Swords className="w-6 h-6 text-amber-300 animate-spin" />
                </div>
                <span className="mt-1 text-[9px] font-bold text-amber-400 uppercase tracking-widest animate-bounce">Pass 3/3</span>
              </div>

              {/* Opponent Friend Knight */}
              <div className="relative z-10 flex flex-col items-center animate-in slide-in-from-right duration-700">
                <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl border-2 border-blue-400/80 overflow-hidden bg-zinc-900 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                  <Image
                    src="/images/character/duke.webp"
                    alt="Rival Knight"
                    fill
                    className="object-cover -scale-x-100"
                    unoptimized
                  />
                </div>
                <span className="mt-1 text-[10px] font-bold text-blue-300 font-mono">Rival knight</span>
              </div>
            </div>

            <h3 className="font-serif text-amber-300 font-bold text-base animate-pulse">Joust in progress...</h3>
            <p className="text-xs text-zinc-400">Comparing virtue scores.</p>
          </div>
        )}

        {battleState === 'result' && joustResults && (
          <div className="space-y-4 text-center py-2">
            <div className="text-4xl">
              {joustResults.wins > joustResults.losses ? '🏆' : joustResults.wins === joustResults.losses ? '🤝' : '🛡️'}
            </div>
            <h3 className="font-serif text-amber-300 text-xl font-bold">
              {joustResults.wins > joustResults.losses ? 'Joust victory' : joustResults.wins === joustResults.losses ? 'Honorable tie' : 'Joust complete'}
            </h3>

            <div className="bg-zinc-900/80 p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-around font-bold">
                <span className="text-emerald-400">Wins: {joustResults.wins}</span>
                <span className="text-amber-400">Ties: {joustResults.ties}</span>
                <span className="text-red-400">Losses: {joustResults.losses}</span>
              </div>
              <div className="pt-2 border-t border-white/10 text-amber-300 font-mono font-bold text-sm">
                Reward: +{joustResults.netGold} gold
              </div>
            </div>

            <Button
              onClick={() => { setBattleState('selecting'); setSelectedCategories([]); handleOpenChange(false); }}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-serif font-bold text-xs h-10 rounded-xl"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
