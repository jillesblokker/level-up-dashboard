"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  getActivePetitions,
  resolvePetition,
  refreshAllPetitions,
  Petition,
  PetitionOutcome,
} from '@/lib/petitions-service';
import { addToCharacterStat } from '@/lib/character-stats-service';
import { Scale, RefreshCw } from 'lucide-react';

export function PetitionsTab() {
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [activeOutcomeModal, setActiveOutcomeModal] = useState<{
    isOpen: boolean;
    petitionTitle: string;
    chosenOptionLabel: string;
    requesterRole: string;
    requesterAvatar: string;
    requesterImage?: string | undefined;
    outcome: PetitionOutcome;
    goldChange: number;
    xpReward: number;
  } | null>(null);

  useEffect(() => {
    setPetitions(getActivePetitions());
  }, []);

  const handleChoice = (petitionId: string, choice: 'A' | 'B') => {
    const target = petitions.find(p => p.id === petitionId);
    if (!target) return;

    const res = resolvePetition(petitionId, choice);
    setPetitions(getActivePetitions());

    if (res.goldChange !== 0) {
      addToCharacterStat('gold', res.goldChange, `petition-${petitionId}`);
    }
    if (res.xpReward > 0) {
      addToCharacterStat('experience', res.xpReward, `petition-${petitionId}`);
    }

    // Open outcome modal with petitioner avatar and real rewards
    setActiveOutcomeModal({
      isOpen: true,
      petitionTitle: target.title,
      chosenOptionLabel: res.chosenOptionLabel,
      requesterRole: target.requesterRole,
      requesterAvatar: target.requesterAvatar,
      requesterImage: target.requesterImage,
      outcome: res.outcome,
      goldChange: res.goldChange,
      xpReward: res.xpReward,
    });

    const isFavorable = !res.outcome.isFunnyTwist && res.goldChange >= 0;
    toast({
      title: isFavorable ? `Favorable decree: ${target.title}` : `Chaotic mishap: ${target.title}`,
      description: res.goldChange >= 0
        ? `Gained +${res.goldChange} gold and +${res.xpReward} XP!`
        : `Cost ${Math.abs(res.goldChange)} gold and earned +${res.xpReward} XP.`,
    });
  };

  const handleRefreshPetitions = () => {
    const fresh = refreshAllPetitions();
    setPetitions(fresh);
    toast({
      title: "New petitions summoned",
      description: "Fresh realm decrees have arrived from petitioners across the realm.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Royal Court Header */}
      <Card className="bg-gradient-to-r from-zinc-950 via-[#0e0d14] to-zinc-950 border-amber-500/30 shadow-2xl">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-xl sm:text-2xl shadow-lg shrink-0">
                👑
              </div>
              <div>
                <CardTitle className="font-serif text-amber-300 text-base sm:text-lg flex items-center gap-2 flex-wrap">
                  Royal court petitions
                </CardTitle>
                <CardDescription className="text-zinc-400 text-[11px] sm:text-xs">
                  Review decrees and resolve town dilemmas from creatures and citizens to earn gold and experience.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="px-2.5 py-1 text-[11px] sm:text-xs font-bold shrink-0 text-amber-300 border-amber-500/40 bg-amber-950/40 font-mono">
              {petitions.filter(p => !p.completed).length} decrees pending
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Active Petitions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-serif font-bold text-amber-300 tracking-wide flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" /> Pending realm petitions ({petitions.filter(p => !p.completed).length} active)
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
              {petitions.filter(p => !p.completed).length} pending decrees
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshPetitions}
              className="h-8 text-xs border-amber-900/40 text-amber-300 hover:bg-amber-950/40 font-mono font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> New 4 petitions
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
                  ? 'opacity-70 bg-zinc-950/60 border-zinc-800'
                  : 'bg-zinc-900/95 border-amber-900/40 hover:border-amber-500/50 shadow-xl'
              }`}
            >
              <CardContent className="p-5 space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 border-b border-amber-900/30 pb-3">
                    <div className="flex items-center gap-3">
                      {/* Golden RPG HUD Styled Avatar Frame */}
                      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-900 via-amber-950 to-black border-2 border-amber-400 shadow-[0_4px_16px_rgba(0,0,0,0.8),0_0_12px_rgba(245,158,11,0.3)] flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                        {p.requesterImage ? (
                          <div className="relative w-full h-full rounded-lg overflow-hidden bg-zinc-950/80">
                            <Image
                              src={p.requesterImage}
                              alt={p.requesterRole}
                              fill
                              className="object-contain p-0.5"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <span className="text-2xl filter drop-shadow">{p.requesterAvatar}</span>
                        )}
                      </div>
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
                    {/* Option 1 Button */}
                    <button
                      type="button"
                      onClick={() => handleChoice(p.id, 'A')}
                      className="w-full h-auto min-h-[64px] p-3.5 flex flex-col justify-center items-start bg-zinc-900/90 hover:bg-emerald-950/80 border border-zinc-800 hover:border-emerald-500/50 text-zinc-200 hover:text-emerald-200 rounded-xl text-left transition-all space-y-1 active:scale-95 cursor-pointer shadow-md group"
                    >
                      <span className="font-bold text-zinc-200 group-hover:text-emerald-300 text-xs flex items-center gap-1.5 leading-snug font-serif">
                        👑 {p.optionA.label}
                      </span>
                      <span className="text-[11px] text-zinc-400 group-hover:text-emerald-200/90 leading-snug break-words">
                        {p.optionA.description}
                      </span>
                    </button>

                    {/* Option 2 Button */}
                    <button
                      type="button"
                      onClick={() => handleChoice(p.id, 'B')}
                      className="w-full h-auto min-h-[64px] p-3.5 flex flex-col justify-center items-start bg-zinc-900/90 hover:bg-amber-950/80 border border-zinc-800 hover:border-amber-500/50 text-zinc-200 hover:text-amber-200 rounded-xl text-left transition-all space-y-1 active:scale-95 cursor-pointer shadow-md group"
                    >
                      <span className="font-bold text-zinc-200 group-hover:text-amber-300 text-xs flex items-center gap-1.5 leading-snug font-serif">
                        📜 {p.optionB.label}
                      </span>
                      <span className="text-[11px] text-zinc-400 group-hover:text-amber-200/90 leading-snug break-words">
                        {p.optionB.description}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    p.chosenOutcome?.isFunnyTwist
                      ? 'bg-zinc-950/80 border-rose-500/30'
                      : 'bg-zinc-950/80 border-emerald-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold tracking-wide block font-mono ${
                        p.chosenOutcome?.isFunnyTwist ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {p.chosenOutcome?.isFunnyTwist ? '💥 Chaotic mishap outcome:' : '✨ Favorable outcome:'}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
                        <span className={p.chosenOutcome && p.chosenOutcome.goldChange >= 0 ? "text-amber-400" : "text-rose-400"}>
                          🪙 {p.chosenOutcome && p.chosenOutcome.goldChange >= 0 ? `+${p.chosenOutcome.goldChange}` : p.chosenOutcome?.goldChange} gold
                        </span>
                        <span className="text-indigo-300">
                          ⭐ +{p.chosenOutcome?.xpReward ?? (p.chosenOutcome?.isFunnyTwist ? 10 : 35)} XP
                        </span>
                      </div>
                    </div>
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
      {activeOutcomeModal && (() => {
        const isFavorable = !activeOutcomeModal.outcome.isFunnyTwist && activeOutcomeModal.goldChange >= 0;
        return (
          <Dialog open={activeOutcomeModal.isOpen} onOpenChange={() => setActiveOutcomeModal(null)}>
            <DialogContent className={`max-w-md w-full bg-gradient-to-b ${
              isFavorable
                ? 'from-emerald-950/40 via-zinc-950 to-zinc-950 border-emerald-500/50'
                : 'from-amber-950/40 via-zinc-950 to-zinc-950 border-amber-500/50'
            } border-2 text-white p-6 rounded-2xl shadow-2xl font-serif text-center overflow-hidden z-[100] animate-in zoom-in-95`}>
              <DialogHeader className="items-center text-center">
                {/* Petitioner Character Avatar Frame (styled like Tales / Storybook) */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-900 via-amber-950 to-black border-2 border-amber-400 shadow-[0_4px_20px_rgba(0,0,0,0.8),0_0_16px_rgba(245,158,11,0.35)] flex items-center justify-center overflow-hidden shrink-0 p-1 mx-auto mb-2">
                  {activeOutcomeModal.requesterImage ? (
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-zinc-950/80">
                      <Image
                        src={activeOutcomeModal.requesterImage}
                        alt={activeOutcomeModal.requesterRole || 'Petitioner'}
                        fill
                        className="object-contain p-0.5"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <span className="text-3xl filter drop-shadow">{activeOutcomeModal.requesterAvatar || '👑'}</span>
                  )}
                </div>

                <div className="text-xs font-mono text-amber-300/90 font-bold tracking-wide">
                  Petitioner: {activeOutcomeModal.requesterRole || 'Realm citizen'}
                </div>

                {/* Outcome Status Banner (clearly distinguishes Good vs Bad outcome) */}
                <div className="pt-2">
                  {isFavorable ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-serif font-bold shadow-md">
                      <span>✨</span>
                      <span>Favorable outcome</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-950/90 border border-rose-500/60 text-rose-300 text-xs font-serif font-bold shadow-md">
                      <span>💥</span>
                      <span>Chaotic mishap</span>
                    </div>
                  )}
                </div>

                <DialogTitle className="text-xl sm:text-2xl font-serif font-bold text-amber-200 mt-2">
                  Royal decree outcome
                </DialogTitle>
                <DialogDescription className="text-xs text-amber-200/80 italic">
                  Decree: &quot;{activeOutcomeModal.chosenOptionLabel}&quot;
                </DialogDescription>
              </DialogHeader>

              <div className={`my-4 p-4 rounded-2xl border ${
                isFavorable
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-rose-950/20 border-rose-500/30'
              } space-y-4 text-left`}>
                <p className="text-sm font-bold text-amber-100 leading-relaxed italic border-b border-amber-900/30 pb-3">
                  {activeOutcomeModal.outcome.storyText}
                </p>

                {/* Real Game Rewards Grid: Gold & XP */}
                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono font-bold">
                  <span className={`p-2.5 rounded-xl bg-zinc-900/90 border text-center flex items-center justify-center gap-1.5 ${
                    activeOutcomeModal.goldChange >= 0 ? "text-amber-400 border-amber-500/40" : "text-rose-400 border-rose-500/40"
                  }`}>
                    🪙 Treasury: {activeOutcomeModal.goldChange >= 0 ? `+${activeOutcomeModal.goldChange}` : activeOutcomeModal.goldChange} gold
                  </span>
                  <span className="p-2.5 rounded-xl bg-zinc-900/90 border border-indigo-500/40 text-indigo-300 text-center flex items-center justify-center gap-1.5">
                    ⭐ Experience: +{activeOutcomeModal.xpReward} XP
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setActiveOutcomeModal(null)}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-extrabold tracking-wide text-xs shadow-lg rounded-xl"
              >
                Enact & continue ✓
              </Button>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
