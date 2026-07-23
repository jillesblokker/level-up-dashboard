"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { addToCharacterStat } from '@/lib/character-stats-service';
import { Trophy, Swords, Sparkles, Shield, Coins } from 'lucide-react';

export interface JoustCategory {
  id: string;
  name: string;
  emoji: string;
  playerStat: number; // habit count or stat value
  allyStat: number;
}

export function JoustingTournamentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [battleState, setBattleState] = useState<'selecting' | 'jousting' | 'result'>('selecting');
  const [joustResults, setJoustResults] = useState<{ wins: number; ties: number; losses: number; netGold: number } | null>(null);

  const categories: JoustCategory[] = [
    { id: 'might', name: 'Might & Fitness', emoji: '⚔️', playerStat: 14, allyStat: 10 },
    { id: 'knowledge', name: 'Knowledge & Learning', emoji: '📜', playerStat: 12, allyStat: 15 },
    { id: 'wellness', name: 'Mindset & Wellness', emoji: '🧘', playerStat: 18, allyStat: 14 },
    { id: 'craft', name: 'Craft & Building', emoji: '🔨', playerStat: 8, allyStat: 12 },
    { id: 'honor', name: 'Honor & Consistency', emoji: '🛡️', playerStat: 20, allyStat: 16 }
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
        toastMsg = "🏆 JOUSTING VICTORY! Earned 1,000 Gold & 25 Gems!";
      } else if (wins === losses || ties > 0) {
        netGold = 500;
        addToCharacterStat('gold', 500);
        toastMsg = "🤝 HONORABLE TIE! Both players awarded 500 Gold consolation prize!";
      } else {
        netGold = 100;
        addToCharacterStat('gold', 100);
        toastMsg = "🛡️ Joust Complete! Received 100 Gold participation reward.";
      }

      setJoustResults({ wins, ties, losses, netGold });
      setBattleState('result');

      toast({
        title: "Jousting Tournament Complete!",
        description: toastMsg
      });
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
          <Swords className="w-4 h-4 text-amber-300" />
          <span>Ally Joust Bet</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-950 border border-amber-500/30 text-white max-w-lg p-6 rounded-2xl shadow-2xl space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-amber-300 text-xl">
            <Trophy className="w-5 h-5 text-amber-400" />
            Ally Jousting Tournament Bet
          </DialogTitle>
        </DialogHeader>

        {battleState === 'selecting' && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/80 p-3 rounded-xl border border-white/10">
              Select <strong>3 categories</strong> where you bet your habit stats will outperform your ally’s knight in 3 jousting passes.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-zinc-400">Select 3 Categories:</span>
                <span className="font-mono text-amber-400 font-bold">{selectedCategories.length} / 3 Selected</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {categories.map(c => {
                  const isSelected = selectedCategories.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCategory(c.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-amber-950/40 text-amber-200 shadow-md'
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
                        <span className="text-blue-400 font-bold">Ally: {c.allyStat}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={handleStartJoust}
              disabled={selectedCategories.length !== 3}
              className="w-full h-12 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-black font-black uppercase text-xs tracking-wider rounded-xl"
            >
              🏇 Charge Lance & Begin Jousting Match
            </Button>
          </div>
        )}

        {battleState === 'jousting' && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Swords className="w-12 h-12 text-amber-400 animate-spin" />
            <h3 className="font-serif text-amber-300 font-bold text-base">Knights Charging Down the Tilt Yard...</h3>
            <p className="text-xs text-zinc-400">Comparing Habit Pass 1, 2, and 3!</p>
          </div>
        )}

        {battleState === 'result' && joustResults && (
          <div className="space-y-4 text-center py-2">
            <div className="text-4xl">
              {joustResults.wins > joustResults.losses ? '🏆' : joustResults.wins === joustResults.losses ? '🤝' : '🛡️'}
            </div>
            <h3 className="font-serif text-amber-300 text-xl font-bold">
              {joustResults.wins > joustResults.losses ? 'Tournament Victory!' : joustResults.wins === joustResults.losses ? 'Honorable Tie!' : 'Joust Complete'}
            </h3>

            <div className="bg-zinc-900/80 p-4 rounded-xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-around font-bold">
                <span className="text-emerald-400">Wins: {joustResults.wins}</span>
                <span className="text-amber-400">Ties: {joustResults.ties}</span>
                <span className="text-red-400">Losses: {joustResults.losses}</span>
              </div>
              <div className="pt-2 border-t border-white/10 text-amber-300 font-mono font-bold text-sm">
                🪙 Reward Collected: +{joustResults.netGold} Gold
              </div>
            </div>

            <Button
              onClick={() => { setBattleState('selecting'); setSelectedCategories([]); setIsOpen(false); }}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs h-10 rounded-xl"
            >
              Return to Hall
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
