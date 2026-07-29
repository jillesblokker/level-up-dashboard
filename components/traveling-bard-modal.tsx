"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { getUserPreference, setUserPreference } from '@/lib/user-preferences-manager';
import { addToCharacterStat } from '@/lib/character-stats-service';
import { playSFX, SOUNDS } from '@/lib/sound-manager';
import { Music, Sparkles, Gift } from 'lucide-react';

export function TravelingBardWidget({ level = 10, displayName = 'Hero' }: { level?: number; displayName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    try {
      const lastVisit = localStorage.getItem('pref:traveling-bard-last-visit');
      if (lastVisit) {
        const daysSince = (Date.now() - new Date(JSON.parse(lastVisit)).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 1) {
          setIsAvailable(false);
        }
      }
    } catch {}
  }, []);

  const handleListenBallad = () => {
    setUserPreference('traveling-bard-last-visit', new Date().toISOString());
    setIsAvailable(false);
    setIsOpen(false);
    playSFX(SOUNDS.ALLIANCE_OATH);

    addToCharacterStat('experience', 100);
    addToCharacterStat('focus_points', 5);

    toast({
      title: "🪕 Royal Bard's Blessing!",
      description: "The Traveling Bard's song inspired your realm! Earned +100 XP & 🧠 +5 Focus Points!",
    });
  };

  if (!isAvailable) return null;

  return (
    <>
      {/* Floating Medieval Heraldry Badge Trigger (No ugly purple bottom rectangle bar) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-purple-950 via-zinc-950 to-purple-950 border border-purple-500/50 text-purple-200 px-4 py-2 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-105 hover:border-purple-400 transition-all flex items-center gap-2.5 cursor-pointer font-medieval group"
      >
        <span className="text-xl group-hover:rotate-12 transition-transform">🪕</span>
        <span className="text-xs tracking-wider">Traveling Bard Encounter</span>
        <Badge className="bg-purple-600 text-white font-bold text-[9px] px-1.5 py-0.5 uppercase tracking-widest animate-pulse">
          Event
        </Badge>
      </button>

      {/* Medieval Random Encounter Modal (Matching Sheep & Royal Gala Encounters) */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md w-full bg-gradient-to-b from-purple-950/90 via-zinc-950 to-zinc-950 border border-purple-500/40 text-white p-0 rounded-2xl shadow-2xl overflow-hidden font-serif">
          {/* Hero Header Cover Image */}
          <div className="relative h-44 w-full overflow-hidden border-b border-purple-500/30">
            <Image
              src="/images/realm-header.webp"
              alt="Realm Ballad"
              fill
              className="object-cover opacity-80"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/kingdom-header.webp';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

            <Badge className="absolute top-3 left-3 bg-purple-950/90 border border-purple-400/50 text-purple-300 font-medieval text-[10px] uppercase tracking-widest px-2.5 py-1 shadow-md">
              Troubadour Visit
            </Badge>
          </div>

          <div className="p-6 space-y-4 text-center relative -mt-10">
            {/* Avatar Circle */}
            <div className="relative w-20 h-20 mx-auto rounded-full border-2 border-purple-400 overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.5)] bg-zinc-900">
              <Image
                src="/images/riddle-sage.webp"
                alt="Alistair the Bard"
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/allies-header.webp';
                }}
              />
            </div>

            <div className="space-y-1">
              <DialogTitle className="font-medieval text-2xl text-amber-300 tracking-wide">
                The Traveling Bard’s Ballad
              </DialogTitle>
              <DialogDescription className="text-xs text-purple-300 font-medium">
                Alistair • Royal Realm Troubadour
              </DialogDescription>
            </div>

            {/* Ballad Poem Box */}
            <div className="bg-zinc-950/90 p-4 rounded-xl border border-purple-500/30 text-center space-y-2">
              <p className="text-amber-200 text-xs italic leading-relaxed font-serif">
                &quot;Sing hail to Sir {displayName}, of Might and of Mind,<br />
                Level {level} warrior, the bravest you’ll find!<br />
                Daily habits completed, daily challenges won,<br />
                Thrivehaven shall flourish under golden sun!&quot;
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleListenBallad}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-3 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <Gift className="w-4 h-4" /> Applaud Bard (+100 XP & +5 Focus Points)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
