"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { getCitizenHappiness, getHappinessTier, getActivePetitions, resolvePetition, Petition, CitizenHappinessState } from '@/lib/petitions-service';
import { addToCharacterStat } from '@/lib/character-stats-service';
import { Crown, Sparkles, Scale, AlertTriangle, ShieldCheck } from 'lucide-react';

export function PetitionsTab() {
  const [happiness, setHappiness] = useState<CitizenHappinessState>({ score: 75, lastUpdated: '' });
  const [petitions, setPetitions] = useState<Petition[]>([]);

  useEffect(() => {
    setHappiness(getCitizenHappiness());
    setPetitions(getActivePetitions());
  }, []);

  const tier = getHappinessTier(happiness.score);

  const handleChoice = (petitionId: string, choice: 'A' | 'B') => {
    const res = resolvePetition(petitionId, choice);
    setHappiness(res.happiness);
    setPetitions(getActivePetitions());

    if (res.goldChange !== 0) {
      addToCharacterStat('gold', res.goldChange);
    }

    toast({
      title: "Royal Decree Enacted!",
      description: `Citizen Loyalty is now ${res.happiness.score}%. Treasury change: ${res.goldChange >= 0 ? '+' : ''}${res.goldChange} Gold.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* House of the Dragon Citizen Happiness Header */}
      <Card className="bg-gradient-to-r from-zinc-950 via-[#0e0d14] to-zinc-950 border-amber-500/30 shadow-2xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-2xl shadow-lg">
                👑
              </div>
              <div>
                <CardTitle className="font-serif text-amber-300 text-xl flex items-center gap-2">
                  Royal Decrees & Citizen Happiness
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Your court decisions directly impact citizen loyalty and kingdom tax revenue.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={`px-3 py-1 text-xs font-bold ${tier.color}`}>
              {tier.title} ({(tier.taxMultiplier * 100 - 100).toFixed(0)}% Tax Output)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Happiness Progress Bar */}
          <div className="space-y-2 bg-zinc-900/80 p-4 rounded-xl border border-white/10">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-medium">Kingdom Alignment Bar:</span>
              <span className="font-mono font-bold text-amber-300">{happiness.score}% Loyalty</span>
            </div>
            <Progress value={happiness.score} className="h-3.5 bg-zinc-950" />
            <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-1">
              <span className="text-red-400 font-bold">Revolting (0%)</span>
              <span className="text-orange-400">Restless (30%)</span>
              <span className="text-emerald-400">Loyal (70%)</span>
              <span className="text-amber-400 font-bold">Serving (100%)</span>
            </div>
            <p className="text-xs text-zinc-300 italic pt-1 border-t border-white/5">
              💡 {tier.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Petitions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-serif font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" /> Pending Realm Petitions
          </h3>
          <span className="text-xs text-zinc-400 font-mono">
            {petitions.filter(p => !p.completed).length} Pending Decrees
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {petitions.map(p => (
            <Card key={p.id} className={`transition-all ${p.completed ? 'opacity-50 bg-zinc-950/40 border-white/5' : 'bg-zinc-900/90 border-amber-900/40 hover:border-amber-500/40'}`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{p.requesterAvatar}</span>
                    <div>
                      <h4 className="font-serif font-bold text-amber-200 text-base flex items-center gap-2">
                        {p.title}
                        {p.completed && <Badge className="bg-emerald-950 text-emerald-300 text-[10px]">Decree Enacted</Badge>}
                      </h4>
                      <span className="text-xs text-zinc-400 font-mono">Petitioner: {p.requesterRole}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-white/5">
                  &quot;{p.description}&quot;
                </p>

                {!p.completed ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Option A */}
                    <Button
                      onClick={() => handleChoice(p.id, 'A')}
                      className="h-auto py-3 px-4 flex flex-col items-start bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 rounded-xl text-left transition-all"
                    >
                      <span className="font-bold text-emerald-300 text-xs flex items-center gap-1">
                        👑 Option 1: {p.optionA.label}
                      </span>
                      <span className="text-[10px] text-emerald-200/80 mt-1">
                        {p.optionA.description}
                      </span>
                    </Button>

                    {/* Option B */}
                    <Button
                      onClick={() => handleChoice(p.id, 'B')}
                      className="h-auto py-3 px-4 flex flex-col items-start bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 rounded-xl text-left transition-all"
                    >
                      <span className="font-bold text-amber-300 text-xs flex items-center gap-1">
                        📜 Option 2: {p.optionB.label}
                      </span>
                      <span className="text-[10px] text-amber-200/80 mt-1">
                        {p.optionB.description}
                      </span>
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="w-4 h-4" /> This petition has been resolved by royal decree.
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
