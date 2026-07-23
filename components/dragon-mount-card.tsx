"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Lock, Sparkles, Flame, ShieldAlert } from 'lucide-react';

export function DragonMountCard({ heroLevel = 1 }: { heroLevel?: number }) {
  const isFlyable = heroLevel >= 50;
  const [isFlying, setIsFlying] = useState(false);

  const handleToggleFlight = () => {
    if (!isFlyable) {
      toast({
        title: "🔒 Dragon Flight Locked!",
        description: "Your Dragon Mount requires Hero Level 50+ to fly! Current level: " + heroLevel,
        variant: "destructive"
      });
      return;
    }

    setIsFlying(!isFlying);
    toast({
      title: !isFlying ? "🐉 Dragon Takeoff!" : "🐉 Dragon Landed",
      description: !isFlying ? "Flying high across the Realm with fiery wings!" : "Dragon mounted on ground.",
    });
  };

  return (
    <Card className="bg-gradient-to-r from-red-950/60 via-zinc-950 to-red-950/60 border-red-500/30 text-white shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐉</span>
            <div>
              <CardTitle className="font-serif text-red-300 text-base flex items-center gap-2">
                Ignis the Ancient Dragon Mount
                {isFlying && <Badge className="bg-amber-500 text-black font-bold text-[10px] animate-pulse">In Flight ✈️</Badge>}
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                {isFlyable ? "Level 50 Unlocked: Flyable Battle Mount" : "Requires Hero Level 50+ to Take Flight (Current Lvl: " + heroLevel + ")"}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={isFlyable ? 'border-amber-400 text-amber-300 font-bold' : 'border-zinc-600 text-zinc-500'}>
            {isFlyable ? '⚡ Flight Ready (Lvl 50+)' : `🔒 Unlocks at Lvl 50`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-zinc-900/80 rounded-xl border border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-zinc-300 font-medium">Dragon Stance:</span>
            <span className="font-bold text-amber-300">{isFlying ? '🌌 Flying Realm Sky Stance' : '🪨 Ground Guard Stance'}</span>
          </div>

          <Button
            onClick={handleToggleFlight}
            disabled={!isFlyable}
            size="sm"
            className={`text-xs font-bold px-4 h-8 rounded-lg ${
              isFlyable
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
            }`}
          >
            {isFlyable ? (isFlying ? 'Land Dragon' : '🔥 Fly Dragon (Lvl 50+)') : <><Lock className="w-3 h-3 mr-1" /> Requires Lvl 50</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
