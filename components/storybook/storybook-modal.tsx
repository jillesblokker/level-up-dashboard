'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BookOpen, Compass, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StoryAdventure, StoryChoice, resolveStoryAdventure, CompletedStoryRecord } from '@/lib/storybook-manager';
import { playSFX, SOUNDS } from '@/lib/sound-manager';
import { hapticSuccess } from '@/lib/haptics';

interface StorybookModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: StoryAdventure | null;
  onCompleted?: (record: CompletedStoryRecord) => void;
}

export function StorybookModal({ isOpen, onClose, story, onCompleted }: StorybookModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<StoryChoice | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  if (!story) return null;

  const handleSelectChoice = async (choice: StoryChoice) => {
    setSelectedChoice(choice);
    setIsResolving(true);
    hapticSuccess();
    playSFX(SOUNDS.BUTTON_CLICK);

    // Short page-turn pause for immersion
    setTimeout(async () => {
      const record = await resolveStoryAdventure(story, choice);
      setIsResolving(false);
      playSFX(SOUNDS.BATTLE_WIN);

      if (typeof window !== 'undefined') {
        import('canvas-confetti').then(confetti => {
          confetti.default({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899']
          });
        }).catch(() => {});
      }

      if (onCompleted) {
        onCompleted(record);
      }
    }, 450);
  };

  const handleClose = () => {
    setSelectedChoice(null);
    setIsResolving(false);
    onClose();
  };

  const getVirtueBadgeStyle = (virtue: string) => {
    switch (virtue) {
      case 'vitality': return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
      case 'knowledge': return 'bg-blue-950/80 text-blue-300 border-blue-500/50';
      case 'wellness': return 'bg-teal-950/80 text-teal-300 border-teal-500/50';
      case 'might': return 'bg-red-950/80 text-red-300 border-red-500/50';
      case 'craft': return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      default: return 'bg-purple-950/80 text-purple-300 border-purple-500/50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] max-h-[90dvh] p-0 overflow-hidden flex flex-col border-2 border-amber-700/60 rounded-2xl shadow-2xl bg-[#0e131f] text-zinc-100 font-serif storybook-modal">
        {/* Parchment Storybook Cover Header */}
        <div className="relative shrink-0 bg-gradient-to-b from-[#1b140d] via-[#15100a] to-[#0e131f] p-5 pb-4 border-b border-amber-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5 pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-amber-500/60 text-amber-300 bg-amber-950/70 font-mono text-xs px-2.5 py-0.5 font-bold shrink-0">
                📜 {story.storyNumber}
              </Badge>
              <span className="text-xs text-amber-200/80 font-mono flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {story.locationName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Book of adventures
            </div>
          </div>

          <DialogHeader className="text-left">
            <DialogTitle
              className="story-title text-xl sm:text-2xl font-bold text-amber-200"
              style={{
                fontFamily: 'var(--font-libre-baskerville), Georgia, serif',
                textTransform: 'none',
                fontVariant: 'normal',
                letterSpacing: 'normal'
              }}
            >
              {story.title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Interactive creature storybook encounter
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Story Body Content Container with Generous Bottom Clearance */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 pb-28 sm:pb-32 space-y-6">
          {!selectedChoice ? (
            /* ── STAGE 1: The Narrative Scene ── */
            <div className="space-y-5">
              {/* Character Illustration & Cast Ribbon */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-zinc-900/60 to-zinc-950 border border-amber-900/40 shadow-sm">
                <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-amber-900 via-amber-950 to-black border-2 border-amber-400 shadow-[0_4px_16px_rgba(0,0,0,0.8),0_0_12px_rgba(245,158,11,0.3)] flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                  <div className="relative w-full h-full rounded-lg overflow-hidden bg-zinc-950/80">
                    <Image
                      src={story.avatarImage}
                      alt={story.title}
                      fill
                      className="object-contain p-0.5"
                      unoptimized
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-mono text-zinc-400 block mb-1.5">Creatures in this story:</span>
                  <div className="flex flex-wrap gap-2">
                    {story.characters.map((char, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-zinc-900/95 border border-amber-500/50 px-2.5 py-1.5 rounded-xl shadow-sm">
                        <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-amber-950/90 border border-amber-400/60 shrink-0">
                          <Image
                            src={char.image}
                            alt={char.name}
                            fill
                            className="object-contain p-0.5"
                            unoptimized
                          />
                        </div>
                        <span className="text-xs font-bold text-amber-200 font-serif">
                          {char.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Atmospheric Narrative Text (Parchment styled with soft black ink) */}
              <div className="parchment-container storybook-parchment p-5 sm:p-6 rounded-xl bg-[#fdfaf3] shadow-inner border border-amber-300/40 space-y-3 font-serif text-sm sm:text-base leading-relaxed">
                {story.narrativeText.split('\n\n').map((paragraph, pIdx) => (
                  <p
                    key={pIdx}
                    className="text-[#1c140d] font-serif leading-relaxed"
                    style={{ color: '#1c140d', textShadow: 'none' }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Action Choices Section */}
              <div className="space-y-2.5 pt-1">
                <span className="text-xs font-mono tracking-wide font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> What would you like to do?
                </span>

                <div className="flex flex-col gap-2.5 pb-8">
                  {story.choices.map(choice => (
                    <button
                      key={choice.id}
                      onClick={() => handleSelectChoice(choice)}
                      disabled={isResolving}
                      className={cn(
                        "w-full text-left p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group cursor-pointer",
                        "bg-zinc-950/90 border-amber-700/40 hover:border-amber-400 hover:bg-amber-950/20 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]",
                        isResolving && "opacity-50 pointer-events-none"
                      )}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-amber-300 font-serif group-hover:text-amber-200">
                            {choice.verb}
                          </span>
                          <Badge variant="outline" className={cn("text-[9px] font-mono px-1.5 py-0 font-bold", getVirtueBadgeStyle(choice.virtueType))}>
                            +{choice.virtuePoints} {choice.virtueType}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-300 font-sans leading-snug">
                          {choice.label}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 shrink-0 self-end sm:self-center">
                        <span>Choose</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── STAGE 2: Resolution & Real-Life Lesson ── */
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300 pb-8">
              {/* Selected Choice Pill */}
              <div className="flex items-center justify-between p-2.5 px-4 rounded-xl bg-amber-950/40 border border-amber-500/40">
                <span className="text-xs text-zinc-300 font-sans">
                  You chose: <strong className="text-amber-300 font-serif">{selectedChoice.verb}</strong>
                </span>
                <Badge variant="outline" className={cn("text-[9px] font-mono font-bold", getVirtueBadgeStyle(selectedChoice.virtueType))}>
                  +{selectedChoice.virtuePoints} {selectedChoice.virtueType}
                </Badge>
              </div>

              {/* Resolution Text (Parchment) */}
              <div className="parchment-container storybook-parchment p-5 sm:p-6 rounded-xl bg-[#fdfaf3] shadow-inner border border-amber-300/40 space-y-3 font-serif text-sm sm:text-base leading-relaxed">
                {selectedChoice.resolutionText.split('\n\n').map((paragraph, pIdx) => (
                  <p
                    key={pIdx}
                    className="text-[#1c140d] font-serif leading-relaxed"
                    style={{ color: '#1c140d', textShadow: 'none' }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Real-Life Habit Lesson Moral Callout */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-zinc-950 border border-emerald-500/40 space-y-1 shadow-md">
                <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                  🌱 What we learned:
                </span>
                <p className="text-xs text-emerald-100 font-sans font-medium italic leading-relaxed">
                  &ldquo;{selectedChoice.lessonMoral}&rdquo;
                </p>
              </div>

              {/* Rewards Summary Tray */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-amber-700/40 flex items-center justify-around text-center">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 block">House cup virtue</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    +{selectedChoice.virtuePoints} {selectedChoice.virtueType}
                  </span>
                </div>
                <div className="h-7 w-px bg-zinc-800" />
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 block">Realm treasury</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    +{selectedChoice.goldReward} gold 🪙
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handleClose}
                className="w-full h-11 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-black font-serif font-bold text-sm rounded-xl shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                Save tale & continue ✨
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
