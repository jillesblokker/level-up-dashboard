"use client";

import { useState, useEffect, useCallback } from 'react';
import { ScratchCard } from './scratch-card';
import { X, ChevronLeft, ChevronRight, Grid, Sparkles, Trophy, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { hapticSuccess, hapticMedium, hapticLight } from '@/lib/haptics';
import { removeOwnedPack } from '@/lib/owned-packs-service';
import { cn } from '@/lib/utils';

interface PackOpeningModalProps {
  packData: any; // Result from generatePack
  ownedPackId?: string;
  onClose: () => void;
  onClaimed: (isNew: boolean) => void;
}

export function PackOpeningModal({ packData, ownedPackId, onClose, onClaimed }: PackOpeningModalProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [claimed, setClaimed] = useState(false);
  const [isNewCard, setIsNewCard] = useState<boolean | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');

  const cards = packData.cards || [];
  const totalCards = cards.length;
  const currentCard = cards[activeCardIndex] || cards[0];

  const winnerCount = cards.filter((c: any) => revealedIds.has(c.id) && c.isWinnerCard).length;
  const allScratched = revealedIds.size >= totalCards;
  const isWon = winnerCount >= 3 || allScratched;

  // Auto-switch to grid view when all cards are scratched to show matching cards
  useEffect(() => {
    if (allScratched && viewMode === 'single') {
      setTimeout(() => {
        setViewMode('grid');
        hapticSuccess();
      }, 600);
    }
  }, [allScratched, viewMode]);

  // Hide floating HUD and companion overlay while unpacking modal is mounted
  useEffect(() => {
    document.body.setAttribute('data-unpack-open', 'true');
    window.dispatchEvent(new CustomEvent('unpack-modal-state', { detail: { isOpen: true } }));
    return () => {
      document.body.removeAttribute('data-unpack-open');
      window.dispatchEvent(new CustomEvent('unpack-modal-state', { detail: { isOpen: false } }));
    };
  }, []);

  useEffect(() => {
    if (isWon && !claimed) {
      setClaimed(true);
      if (ownedPackId) {
        removeOwnedPack(ownedPackId);
      }
      
      const claim = async () => {
        const token = await getToken();
        if (!token) return;
        
        const res = await fetch('/api/packs/claim-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                cardId: String(packData.winnerNumber),
                variantId: String(packData.winnerVariantIndex),
                packId: packData.id
            })
        });
        
        let isNew = false;
        if (res.ok) {
          try {
            const data = await res.json();
            isNew = !!data.isNew;
            setIsNewCard(isNew);
            
            if (isNew && typeof window !== 'undefined') {
              import('canvas-confetti').then(confetti => {
                confetti.default({
                  particleCount: 150,
                  spread: 90,
                  origin: { y: 0.4 },
                  colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#ffffff']
                });
              }).catch(() => {});
            }
          } catch (e) {
            console.error('Failed to parse claim response:', e);
          }
        }
        
        onClaimed(isNew);
      };
      claim();
    }
  }, [isWon, claimed, packData, ownedPackId, getToken, onClaimed]);

  const handleReveal = useCallback((cardId: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev).add(cardId);
      return next;
    });

    hapticLight();

    // 1-Second Delay before advancing to next card on mobile/single mode so player sees the revealed card
    setTimeout(() => {
      setActiveCardIndex(prev => (prev < totalCards - 1 ? prev + 1 : prev));
    }, 1000);
  }, [totalCards]);

  const handleScratchAll = () => {
    hapticMedium();
    const allIds = new Set<string>(cards.map((c: any) => c.id));
    setRevealedIds(allIds);
    setViewMode('grid');
  };

  return (
    <div className="fixed inset-0 z-[999999] flex flex-col justify-between bg-black/95 p-3 sm:p-6 overflow-y-auto animate-fadeIn select-none min-h-dvh h-dvh max-h-dvh pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between z-20 pb-2 border-b border-amber-900/40 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="font-serif font-bold text-amber-300 text-sm sm:text-base">
            {packData.title || "Mythic scratch pack"}
          </span>
          <span className="text-xs text-amber-500/70 font-mono font-bold hidden sm:inline">
            ({revealedIds.size} / {totalCards} scratched)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewMode(viewMode === 'single' ? 'grid' : 'single')}
            className="text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-xs font-mono font-bold px-3 h-9"
          >
            <Grid className="w-3.5 h-3.5 mr-1" />
            {viewMode === 'single' ? 'Grid view' : 'Single view'}
          </Button>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
            title="Close unpacking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area (Dynamic viewport height flex-1) */}
      <div className="relative w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center my-2 z-10 min-h-0 overflow-y-auto">
        {/* Victory Header Toast Banner */}
        {isWon ? (
          <div className="text-center mb-3 space-y-1 animate-bounce shrink-0">
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-zinc-950 px-4 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-wide uppercase shadow-lg border border-amber-200">
              🎉 3 matching cards found!
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-amber-300 drop-shadow-md">
              {isNewCard ? "✨ New creature unlocked! ✨" : "✨ Mythic card claimed! ✨"}
            </h2>
            <p className="text-xs text-amber-200/90 font-medium">
              {isNewCard ? "Added to your mythic collection vault!" : "Duplicate converted to +50 alchemy essences."}
            </p>
          </div>
        ) : (
          <div className="text-center mb-3 space-y-0.5 shrink-0">
            <h2 className="text-xl sm:text-3xl font-serif font-bold text-amber-400 drop-shadow-sm">
              Scratch 3 matching cards to win
            </h2>
            <p className="text-xs text-zinc-400 font-medium">
              {viewMode === 'single' ? `Scratching card ${activeCardIndex + 1} of ${totalCards}` : "Scratch all 9 cards on grid to reveal matching cards"}
            </p>
          </div>
        )}

        {/* SINGLE CARD FULL-SCREEN SCRATCH MODE */}
        {viewMode === 'single' && (
          <div className="flex flex-col items-center gap-4 w-full max-w-md my-auto">
            {/* Full-Screen Scratch Card Canvas Container */}
            <div className="relative w-full max-w-[270px] sm:max-w-[320px] aspect-[2/3] min-h-[320px] sm:min-h-[400px] rounded-2xl overflow-hidden border-4 border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.5)] bg-zinc-950 flex items-center justify-center p-1">
              <ScratchCard 
                key={currentCard.id} 
                cardData={currentCard} 
                onReveal={handleReveal} 
                isWinner={isWon && currentCard.isWinnerCard}
                fullscreen={true}
              />
            </div>

            {/* Navigation Dots & Step Controls */}
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                disabled={activeCardIndex === 0}
                onClick={() => {
                  hapticLight();
                  setActiveCardIndex(prev => Math.max(0, prev - 1));
                }}
                className="bg-amber-950/60 border-amber-500/40 text-amber-300 disabled:opacity-30 h-9 px-2.5 text-xs font-bold"
              >
                <ChevronLeft className="w-4 h-4 mr-0.5" /> Prev
              </Button>

              <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-amber-900/40">
                {cards.map((c: any, idx: number) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      hapticLight();
                      setActiveCardIndex(idx);
                    }}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all cursor-pointer",
                      activeCardIndex === idx
                        ? "bg-amber-400 w-5"
                        : revealedIds.has(c.id)
                        ? "bg-emerald-500"
                        : "bg-zinc-600 hover:bg-zinc-400"
                    )}
                  />
                ))}
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={activeCardIndex === totalCards - 1}
                onClick={() => {
                  hapticLight();
                  setActiveCardIndex(prev => Math.min(totalCards - 1, prev + 1));
                }}
                className="bg-amber-950/60 border-amber-500/40 text-amber-300 disabled:opacity-30 h-9 px-2.5 text-xs font-bold"
              >
                Next <ChevronRight className="w-4 h-4 ml-0.5" />
              </Button>
            </div>

            {!allScratched && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleScratchAll}
                className="text-xs text-amber-400/80 hover:text-amber-200 underline font-mono cursor-pointer"
              >
                ✨ Scratch all cards
              </Button>
            )}
          </div>
        )}

        {/* 3x3 GRID OVERVIEW MODE (Matching Cards Highlighted!) */}
        {viewMode === 'grid' && (
          <div className="flex flex-col items-center w-full my-auto space-y-3">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 justify-items-center w-full max-w-[360px] sm:max-w-xl">
              {cards.map((card: any) => {
                const isWinnerMatching = isWon && card.isWinnerCard;
                return (
                  <div
                    key={card.id}
                    className={cn(
                      "relative rounded-xl transition-all duration-300 p-0.5",
                      isWinnerMatching && "ring-4 ring-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.9)] scale-105"
                    )}
                  >
                    <ScratchCard 
                      cardData={card} 
                      onReveal={handleReveal} 
                      isWinner={isWinnerMatching}
                    />
                    {isWinnerMatching && (
                      <div className="absolute -top-2 -right-2 z-50 bg-amber-400 text-black p-1 rounded-full shadow-lg animate-pulse">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Claim Actions — Sticky Bottom Bar Safe Area Offsets */}
      {isWon && (
        <div className="sticky bottom-0 z-50 w-full max-w-md mx-auto flex flex-col sm:flex-row gap-2.5 pt-3 pb-2 border-t border-amber-900/50 bg-black/95 backdrop-blur-md shrink-0 shadow-2xl rounded-2xl p-3">
          <Button 
            size="lg" 
            variant="outline"
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700 font-bold text-xs sm:text-sm rounded-xl h-11"
            onClick={() => {
              onClose();
              router.push('/achievements');
            }}
          >
            🏆 Vault collection
          </Button>
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-bounce h-11"
            onClick={onClose}
          >
            Collect
          </Button>
        </div>
      )}
    </div>
  );
}
