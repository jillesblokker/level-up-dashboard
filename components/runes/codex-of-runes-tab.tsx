"use client";

import React, { useState, useEffect } from 'react';
import {
  ALL_RUNES,
  RuneDefinition,
  getCollectedRuneIds,
  getCollectedPlacements,
  RUNE_COLLECTED_EVENT,
} from '@/lib/runes-service';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Trophy, Compass, Lock, RotateCcw, Volume2, Shield } from 'lucide-react';
import { playSFX } from '@/lib/sound-manager';
import { hapticSuccess } from '@/lib/haptics';
import { toast } from '@/components/ui/use-toast';
import { setUserPreference } from '@/lib/user-preferences-manager';

export function CodexOfRunesTab() {
  const [unlockedRuneIds, setUnlockedRuneIds] = useState<string[]>([]);
  const [collectedPlacements, setCollectedPlacements] = useState<string[]>([]);
  const [activeRuneModal, setActiveRuneModal] = useState<RuneDefinition | null>(null);
  const [selectedAett, setSelectedAett] = useState<'all' | 'freyr' | 'heimdall' | 'tyr'>('all');

  const refreshState = () => {
    setUnlockedRuneIds(getCollectedRuneIds());
    setCollectedPlacements(getCollectedPlacements());
  };

  useEffect(() => {
    refreshState();

    const handleUpdate = () => {
      refreshState();
    };

    window.addEventListener(RUNE_COLLECTED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(RUNE_COLLECTED_EVENT, handleUpdate);
    };
  }, []);

  const totalRunes = ALL_RUNES.length;
  const unlockedCount = unlockedRuneIds.length;
  const progressPercent = (unlockedCount / totalRunes) * 100;
  const isMaster = unlockedCount === totalRunes;

  const filteredRunes = selectedAett === 'all'
    ? ALL_RUNES
    : ALL_RUNES.filter((r) => r.aett === selectedAett);

  const handleRuneClick = (rune: RuneDefinition, isUnlocked: boolean) => {
    if (isUnlocked) {
      playSFX('achievement');
      hapticSuccess();
      setActiveRuneModal(rune);
    } else {
      toast({
        title: `Undiscovered Rune (${rune.aettLabel})`,
        description: rune.hint,
      });
    }
  };

  const handleResetRunes = async () => {
    if (confirm('Reset all collected runes so you can discover them again throughout the realm?')) {
      try {
        localStorage.removeItem('thrivehaven_collected_rune_placements');
        await setUserPreference('thrivehaven_collected_rune_placements', []);
        window.dispatchEvent(new CustomEvent(RUNE_COLLECTED_EVENT, { detail: { reset: true } }));
        refreshState();
        toast({
          title: 'Runes dispersed',
          description: 'All 24 Elder Runes have returned to their hiding places across the realm.',
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HERO BANNER: Secret Codex Showcase */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/40 bg-gradient-to-br from-zinc-950 via-[#130d06] to-zinc-950 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs px-2.5 py-0.5">
                ✦ Sacred Elder Futhark unlocked
              </Badge>
              {isMaster && (
                <Badge className="bg-gradient-to-r from-amber-500 to-amber-300 text-zinc-950 font-bold text-xs px-2.5 py-0.5 shadow-md">
                  Elder Runic Master
                </Badge>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 flex items-center gap-3">
              <span>Codex of the 24 Elder Runes</span>
              <span className="font-mono text-amber-400 text-base sm:text-lg">ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              The complete historical 24-rune Elder Futhark, divided into the three sacred ættir. Tap any discovered rune 3 times in its native location across the realm to bind it to your codex.
            </p>
          </div>

          <div className="w-full md:w-64 bg-zinc-900/80 border border-amber-500/30 p-4 rounded-2xl flex flex-col gap-2 shadow-inner">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400">Codex completion</span>
              <span className="text-amber-300 font-bold">{unlockedCount} / {totalRunes}</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-zinc-950" />
            <p className="text-[11px] text-zinc-400 italic text-right">
              {isMaster ? 'All 24 sacred runes awakened' : `${totalRunes - unlockedCount} runes remaining`}
            </p>
          </div>
        </div>

        {/* Master unlocked celebration banner */}
        {isMaster && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
              <div>
                <p className="text-sm font-bold text-amber-200 font-serif">Elder Runic Master of Thrivehaven</p>
                <p className="text-xs text-zinc-300">You have bound all 24 ancient Elder Futhark runes to your codex.</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetRunes}
              className="border-amber-500/40 text-amber-300 hover:bg-amber-950 text-xs rounded-xl h-8 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Re-hide for hunt
            </Button>
          </div>
        )}
      </div>

      {/* ÆTT SELECTION PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: 'all', label: 'All 24 runes', count: totalRunes },
          { id: 'freyr', label: "Freyr's ætt (1–8)", count: 8 },
          { id: 'heimdall', label: "Heimdall's ætt (9–16)", count: 8 },
          { id: 'tyr', label: "Tyr's ætt (17–24)", count: 8 },
        ].map((tab) => {
          const isActive = selectedAett === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedAett(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap border ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* RUNE TILES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRunes.map((rune) => {
          const isUnlocked = unlockedRuneIds.includes(rune.id);
          const foundPlacements = rune.placements.filter((p) =>
            collectedPlacements.includes(p.id)
          );

          return (
            <div
              key={rune.id}
              onClick={() => handleRuneClick(rune, isUnlocked)}
              className={`relative group rounded-2xl p-5 border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between min-h-[170px] ${
                isUnlocked
                  ? 'bg-gradient-to-b from-amber-950/20 via-zinc-950 to-zinc-950/90 border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:-translate-y-0.5'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-amber-900/50 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-mono text-3xl font-bold transition-transform group-hover:scale-105 ${
                      isUnlocked
                        ? 'bg-amber-500/10 border border-amber-500/40 text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        : 'bg-zinc-900/80 border border-zinc-800 text-zinc-600'
                    }`}
                  >
                    {isUnlocked ? rune.symbol : '᛬'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-serif font-bold text-base ${
                          isUnlocked ? 'text-amber-200' : 'text-zinc-500'
                        }`}
                      >
                        {isUnlocked ? rune.name : 'Undiscovered'}
                      </h3>
                      {isUnlocked && (
                        <span className="text-[11px] font-mono text-amber-500/70">
                          {rune.phonetic}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 font-medium line-clamp-1">
                      {isUnlocked ? rune.meaning : rune.aettLabel}
                    </p>
                  </div>
                </div>

                {isUnlocked ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-mono">
                    Bound
                  </Badge>
                ) : (
                  <Badge className="bg-zinc-900 text-zinc-500 border-zinc-800 text-[10px] flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Hidden
                  </Badge>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-900 text-xs">
                {isUnlocked ? (
                  <div className="space-y-1">
                    <p className="text-zinc-300 text-[11px] line-clamp-2 leading-relaxed">
                      {rune.description}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-amber-500/80 pt-1 font-mono">
                      <Compass className="w-3 h-3" />
                      <span>
                        Found in {foundPlacements.map((p) => p.label).join(', ') || 'the realm'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-400 text-[11px] italic line-clamp-2 leading-relaxed">
                    💡 &ldquo;{rune.hint}&rdquo;
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* RUNE DETAIL INSPECTOR MODAL */}
      {activeRuneModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveRuneModal(null)}
        >
          <div
            className="bg-gradient-to-b from-zinc-950 via-[#120e09] to-zinc-950 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/30">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-mono text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]">
                  {activeRuneModal.symbol}
                </span>
                <div>
                  <h3 className="font-serif font-bold text-xl text-amber-200">
                    {activeRuneModal.name}
                  </h3>
                  <p className="text-xs text-amber-400/80 font-mono">
                    Sound: {activeRuneModal.phonetic} • {activeRuneModal.meaning}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  playSFX('streak');
                  hapticSuccess();
                }}
                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30"
                title="Attune runic frequency"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                {activeRuneModal.aettLabel}
              </Badge>
              <p>{activeRuneModal.description}</p>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                <span className="font-bold text-amber-300 block font-serif text-[11px]">
                  Where to locate in Thrivehaven:
                </span>
                <ul className="list-disc list-inside text-zinc-400 space-y-0.5">
                  {activeRuneModal.placements.map((p) => (
                    <li key={p.id}>
                      {p.label} (<span className="text-zinc-500 font-mono">{p.page}</span>)
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Button
              className="w-full btn-primary-cta text-xs font-bold rounded-xl h-10"
              onClick={() => setActiveRuneModal(null)}
            >
              Close codex entry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
