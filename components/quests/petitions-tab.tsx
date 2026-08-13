"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  getCitizenHappiness,
  getHappinessTier,
  getActivePetitions,
  resolvePetition,
  refreshAllPetitions,
  Petition,
  PetitionOutcome,
  CitizenHappinessState
} from '@/lib/petitions-service';
import { addToCharacterStat } from '@/lib/character-stats-service';
import { Scale, RefreshCw } from 'lucide-react';

export function PetitionsTab() {
  const [happiness, setHappiness] = useState<CitizenHappinessState>({ score: 75, lastUpdated: '' });
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [activeOutcomeModal, setActiveOutcomeModal] = useState<{
    isOpen: boolean;
    petitionTitle: string;
    chosenOptionLabel: string;
    outcome: PetitionOutcome;
  } | null>(null);

  useEffect(() => {
    setHappiness(getCitizenHappiness());
    setPetitions(getActivePetitions());
  }, []);

  const tier = getHappinessTier(happiness.score);

  const handleChoice = (petitionId: string, choice: 'A' | 'B') => {
    const target = petitions.find(p => p.id === petitionId);
    if (!target) return;

    const res = resolvePetition(petitionId, choice);
    setHappiness(res.happiness);
    setPetitions(getActivePetitions());

    if (res.goldChange !== 0) {
      addToCharacterStat('gold', res.goldChange, `petition-${petitionId}`);
    }

    // Open standard modal dialog with hilarious story reveal
    setActiveOutcomeModal({
      isOpen: true,
      petitionTitle: target.title,
      chosenOptionLabel: res.chosenOptionLabel,
      outcome: res.outcome
    });
  };

  const handleRefreshPetitions = () => {
    const fresh = refreshAllPetitions();
    setPetitions(fresh);
    toast({
      title: "📜 4 New Petitions Summoned!",
      description: "Fresh realm decrees have arrived from petitioners across the realm.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Citizen Happiness Header */}
      <Card className="bg-gradient-to-r from-zinc-950 via-[#0e0d14] to-zinc-950 border-amber-500/30 shadow-2xl">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-xl sm:text-2xl shadow-lg shrink-0">
                👑
              </div>
              <div>
                <CardTitle className="font-serif text-amber-300 text-base sm:text-lg flex items-center gap-2 flex-wrap">
                  King&apos;s rules & town mood
                </CardTitle>
                <CardDescription className="text-zinc-400 text-[11px] sm:text-xs">
                  Guide town petitions with blind royal decrees to build loyalty and gold.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={`px-2.5 py-1 text-[11px] sm:text-xs font-bold shrink-0 ${tier.color}`}>
              {tier.title} ({(tier.taxMultiplier * 100 - 100).toFixed(0)}% gold)
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

      {/* Active Petitions Section (4 Active Petitions) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-serif font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" /> Pending Realm Petitions (4 Active)
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
              {petitions.filter(p => !p.completed).length} Pending Decrees
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshPetitions}
              className="h-8 text-xs border-amber-900/40 text-amber-300 hover:bg-amber-950/40 font-mono font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> New 4 Petitions
            </Button>
          </div>
        </div>

        {/* Mobile Carousel (< 768px), Desktop 2-Column Grid (>= 768px) */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible custom-scrollbar mobile-scroll-hide">
          {petitions.map((p) => (
            <Card
              key={p.id}
              className={`snap-start shrink-0 w-[88vw] max-w-[340px] sm:w-auto sm:max-w-none transition-all ${
                p.completed
                  ? 'opacity-60 bg-zinc-950/60 border-zinc-800'
                  : 'bg-zinc-900/95 border-amber-900/40 hover:border-amber-500/50 shadow-xl'
              }`}
            >
              <CardContent className="p-5 space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 border-b border-amber-900/30 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl filter drop-shadow">{p.requesterAvatar}</span>
                      <div>
                        <h4 className="font-serif font-bold text-amber-200 text-base leading-snug">
                          {p.title}
                        </h4>
                        <span className="text-xs text-zinc-400 font-mono block">Petitioner: {p.requesterRole}</span>
                      </div>
                    </div>
                    {p.completed && (
                      <Badge className="bg-emerald-950 border-emerald-500/40 text-emerald-300 text-[10px] shrink-0">
                        Enacted ✓
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/80 p-3 rounded-xl border border-white/5 italic font-serif">
                    &quot;{p.description}&quot;
                  </p>
                </div>

                {!p.completed ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Option 1 Button (Grey fill default, color only on hover) */}
                    <button
                      type="button"
                      onClick={() => handleChoice(p.id, 'A')}
                      className="w-full h-auto min-h-[64px] p-3.5 flex flex-col justify-center items-start bg-zinc-900/90 hover:bg-emerald-950/80 border border-zinc-800 hover:border-emerald-500/50 text-zinc-200 hover:text-emerald-200 rounded-xl text-left transition-all space-y-1 active:scale-95 cursor-pointer shadow-md group"
                    >
                      <span className="font-bold text-zinc-200 group-hover:text-emerald-300 text-xs flex items-center gap-1.5 leading-snug font-serif">
                        👑 Option 1: {p.optionA.label}
                      </span>
                      <span className="text-[11px] text-zinc-400 group-hover:text-emerald-200/90 leading-snug break-words">
                        {p.optionA.description}
                      </span>
                    </button>

                    {/* Option 2 Button (Grey fill default, color only on hover) */}
                    <button
                      type="button"
                      onClick={() => handleChoice(p.id, 'B')}
                      className="w-full h-auto min-h-[64px] p-3.5 flex flex-col justify-center items-start bg-zinc-900/90 hover:bg-amber-950/80 border border-zinc-800 hover:border-amber-500/50 text-zinc-200 hover:text-amber-200 rounded-xl text-left transition-all space-y-1 active:scale-95 cursor-pointer shadow-md group"
                    >
                      <span className="font-bold text-zinc-200 group-hover:text-amber-300 text-xs flex items-center gap-1.5 leading-snug font-serif">
                        📜 Option 2: {p.optionB.label}
                      </span>
                      <span className="text-[11px] text-zinc-400 group-hover:text-amber-200/90 leading-snug break-words">
                        {p.optionB.description}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-emerald-500/30 text-xs space-y-1.5">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block font-mono">
                      Chosen Decree Outcome:
                    </span>
                    <p className="text-zinc-300 italic font-serif text-[11px] leading-relaxed">
                      {p.chosenOutcome?.storyText || "Decree executed cleanly."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Standard Post-Choice Story Outcome Reveal Dialog */}
      {activeOutcomeModal && (
        <Dialog open={activeOutcomeModal.isOpen} onOpenChange={() => setActiveOutcomeModal(null)}>
          <DialogContent className="max-w-md w-full bg-gradient-to-b from-amber-950 via-zinc-950 to-zinc-950 border-2 border-amber-500/50 text-white p-6 rounded-2xl shadow-2xl font-serif text-center overflow-hidden z-[100] animate-in zoom-in-95">
            <DialogHeader>
              <div className="mx-auto w-14 h-14 rounded-full bg-amber-900/60 border-2 border-amber-400 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-bounce">
                <span className="text-3xl">
                  {activeOutcomeModal.outcome.isFunnyTwist ? '🤪' : '🌟'}
                </span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-medieval text-amber-300">
                Royal Decree Outcome
              </DialogTitle>
              <DialogDescription className="text-xs text-amber-200/80 italic">
                Decree: &quot;{activeOutcomeModal.chosenOptionLabel}&quot;
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 p-4 bg-zinc-950/90 rounded-2xl border border-amber-900/40 space-y-4 text-left">
              <p className="text-sm font-bold text-amber-100 leading-relaxed italic border-b border-amber-900/30 pb-3">
                {activeOutcomeModal.outcome.storyText}
              </p>

              <div className="flex items-center justify-between text-xs font-mono font-bold flex-wrap gap-2">
                <span className={activeOutcomeModal.outcome.goldChange >= 0 ? "text-amber-400" : "text-red-400"}>
                  🪙 Treasury Gold: {activeOutcomeModal.outcome.goldChange >= 0 ? '+' : ''}{activeOutcomeModal.outcome.goldChange} Gold
                </span>
                <span className={activeOutcomeModal.outcome.loyaltyChange >= 0 ? "text-emerald-400" : "text-orange-400"}>
                  👑 Town Loyalty: {activeOutcomeModal.outcome.loyaltyChange >= 0 ? '+' : ''}{activeOutcomeModal.outcome.loyaltyChange}%
                </span>
              </div>
            </div>

            <Button
              onClick={() => setActiveOutcomeModal(null)}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-extrabold uppercase tracking-wider text-xs shadow-lg rounded-xl"
            >
              Enact & Continue ✓
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
