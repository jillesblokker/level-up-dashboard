"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scroll, Sparkles, Award, Shield, ChevronRight, MapPin, CheckCircle2 } from 'lucide-react';
import { MasteredHabit, getMasteredHabits } from '@/lib/habit-mastery-service';

interface HabitStoneMonumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHabit?: MasteredHabit | null;
}

export function HabitStoneMonumentModal({
  isOpen,
  onClose,
  selectedHabit: propSelected
}: HabitStoneMonumentModalProps) {
  const [masteredList, setMasteredList] = useState<MasteredHabit[]>([]);
  const [activeHabit, setActiveHabit] = useState<MasteredHabit | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const list = getMasteredHabits();
    setMasteredList(list);
    if (propSelected) {
      setActiveHabit(propSelected);
    } else if (list.length > 0) {
      setActiveHabit(list[0]!);
    } else {
      setActiveHabit(null);
    }
  }, [isOpen, propSelected]);

  return (
    <Dialog open={isOpen} onOpenChange={(op) => { if (!op) onClose(); }}>
      <DialogContent className="max-w-lg w-full bg-[#0a180f] border-2 border-emerald-600/40 text-emerald-100 p-0 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.25)] font-serif overflow-hidden z-[100]">
        {/* Grassy Top Banner & Zora Monolith Header */}
        <div className="relative bg-gradient-to-b from-emerald-900/60 via-[#0e2718] to-[#0a180f] p-6 pb-4 border-b border-emerald-500/30 text-center">
          {/* Subtle grassy texture background overlay */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
          
          <div className="relative z-10 space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-b from-cyan-950 to-emerald-950 border-2 border-cyan-400/60 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              🗿
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Zora stone monument of mastery
            </div>

            <DialogTitle className="text-2xl font-medieval text-cyan-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Sacred habit monument
            </DialogTitle>
            <DialogDescription className="text-xs text-emerald-300/80 italic max-w-sm mx-auto leading-relaxed">
              Carved into ancient bedrock after 66 days of unwavering discipline. Permanent testament to habits that became second nature.
            </DialogDescription>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {activeHabit ? (
            <div className="space-y-4">
              {/* The Carved Stone Slab (BotW Zora Inscription Style) */}
              <div className="relative rounded-2xl bg-gradient-to-b from-zinc-900 via-[#101b13] to-zinc-950 border-2 border-cyan-500/50 p-6 shadow-2xl overflow-hidden">
                {/* Ancient glowing border runes */}
                <div className="absolute top-2 left-3 text-[10px] font-mono text-cyan-500/40 tracking-widest">
                  ᚛ᚚᚐᚈᚆ ᚑᚃ ᚋᚐᚄᚈᚓᚏ᚜
                </div>
                <div className="absolute top-2 right-3 text-[10px] font-mono text-cyan-500/40 tracking-widest">
                  66᛫DAYS
                </div>

                <div className="my-4 text-center space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-full bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    🏛️
                  </div>

                  <div className="text-xs uppercase tracking-widest text-cyan-400/80 font-mono font-bold">
                    Carved inscription
                  </div>

                  {/* The Exact User Requested Copy */}
                  <blockquote className="text-sm sm:text-base text-zinc-100 font-serif italic leading-relaxed px-2 sm:px-4 py-2 border-y border-cyan-500/20 bg-cyan-950/20 rounded-lg">
                    &ldquo;On <strong className="text-cyan-300 font-normal">{activeHabit.dayName}</strong> ({activeHabit.formattedDate}) you mastered the habit of <strong className="text-amber-300 font-bold underline decoration-amber-500/50 decoration-2 underline-offset-4">{activeHabit.title}</strong>. It seems you got it into your system. Well done and keep it up.&rdquo;
                  </blockquote>

                  <div className="flex items-center justify-center gap-2 pt-1 text-[11px] font-mono text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Conscious effort transformed into permanent instinct</span>
                  </div>
                </div>
              </div>

              {/* Multi-monument switcher if player has mastered multiple habits */}
              {masteredList.length > 1 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-wider block">
                    Other mastered monuments ({masteredList.length}):
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {masteredList.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setActiveHabit(m)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-serif whitespace-nowrap border transition-all ${
                          activeHabit.id === m.id
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md font-bold'
                            : 'bg-zinc-950/60 border-emerald-900/40 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        🗿 {m.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State: Explaining the 66-day mastery bar */
            <div className="p-8 text-center space-y-3 rounded-2xl bg-zinc-950/60 border border-emerald-900/40">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-2xl">
                🌱
              </div>
              <h4 className="text-sm font-serif font-bold text-emerald-200">
                No stone monuments carved yet
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                Neuroscience and habit formation show that <strong className="text-amber-300">66 consecutive days</strong> wires a routine into automaticity.
              </p>
              <p className="text-xs text-emerald-300/80 italic">
                Nurture any habit to 66 days to carve your eternal monument into the realm!
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-700 hover:from-emerald-600 hover:to-teal-500 text-white font-medieval font-bold py-2.5 rounded-xl border border-cyan-400/40 shadow-lg shadow-emerald-950/60 text-xs"
            >
              Honor the monument
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
