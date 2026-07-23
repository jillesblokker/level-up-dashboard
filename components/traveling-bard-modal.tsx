"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { getUserPreference, setUserPreference } from '@/lib/user-preferences-manager';
import { addToCharacterStat } from '@/lib/character-stats-service';
import { Music, Sparkles, BookOpen } from 'lucide-react';

export function TravelingBardWidget({ level = 10, displayName = 'Hero' }: { level?: number; displayName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    try {
      const lastVisit = localStorage.getItem('pref:traveling-bard-last-visit');
      if (lastVisit) {
        const daysSince = (Date.now() - new Date(JSON.parse(lastVisit)).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 24) {
          setIsAvailable(false);
        }
      }
    } catch {}
  }, []);

  const handleListenBallad = () => {
    setUserPreference('traveling-bard-last-visit', new Date().toISOString());
    setIsAvailable(false);
    setIsOpen(false);

    addToCharacterStat('experience', 100);
    addToCharacterStat('focus_points', 5);

    toast({
      title: "🪕 The Traveling Bard Sings!",
      description: "Applauded the ballad! Rewarded +100 XP & +5 Focus Points!",
    });
  };

  if (!isAvailable) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="bg-gradient-to-r from-purple-950 via-zinc-900 to-purple-950 border border-purple-500/40 p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs group cursor-pointer hover:border-purple-400 transition-all">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-bounce">🪕</span>
            <div className="text-left">
              <span className="font-serif font-bold text-purple-300 text-sm block">Traveling Bard Visits Realm!</span>
              <span className="text-[11px] text-zinc-400">Click to hear the Royal Ballad of {displayName}</span>
            </div>
          </div>
          <Badge className="bg-purple-600 text-white font-bold text-[10px] shrink-0">
            Listen Ballad
          </Badge>
        </button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-950 border border-purple-500/30 text-white max-w-md p-6 rounded-2xl shadow-2xl space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-purple-300 text-xl">
            <Music className="w-5 h-5 text-purple-400" />
            The Traveling Bard’s Royal Ballad
          </DialogTitle>
        </DialogHeader>

        <div className="bg-zinc-900/90 p-5 rounded-2xl border border-purple-500/20 text-center space-y-3 font-serif">
          <span className="text-4xl block">🎻</span>
          <p className="text-amber-200 text-sm italic leading-relaxed">
            &quot;Sing hail to Sir {displayName}, of Might and of Mind,<br />
            Level {level} warrior, the bravest you’ll find!<br />
            Daily habits completed, daily challenges won,<br />
            Thrivehaven shall flourish under golden sun!&quot;
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 font-mono">
          <span>Reward: ⚡ +100 XP & 🧠 +5 Focus Points</span>
          <Button
            onClick={handleListenBallad}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 h-9 rounded-xl"
          >
            Applaud Bard (+100 XP)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
