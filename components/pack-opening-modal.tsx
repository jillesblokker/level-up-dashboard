"use client";

import { useState, useEffect, useCallback } from 'react';
import { ScratchCard } from './scratch-card';
import { X, ChevronLeft, ChevronRight, Grid, Sparkles, Trophy, CheckCircle, Eye, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { hapticSuccess, hapticMedium, hapticLight } from '@/lib/haptics';
import { removeOwnedPack } from '@/lib/owned-packs-service';
import { getMythicName } from '@/lib/pack-generator';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('grid');
  const [showBoardOnEndScreen, setShowBoardOnEndScreen] = useState(false);

  const cards = packData.cards || [];
  const totalCards = cards.length;
  const currentCard = cards[activeCardIndex] || cards[0];

  const winnerCard = cards.find((c: any) => c.isWinnerCard) || cards[0];
  const winnerCount = cards.filter((c: any) => revealedIds.has(c.id) && c.isWinnerCard).length;
  const allScratched = revealedIds.size >= totalCards;
  const isWon = winnerCount >= 3 || allScratched;

  // Responsively default to 3x3 grid on desktop and single card carousel on mobile
  useEffect(() => {
    const handleCheckMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setViewMode(mobile ? 'single' : 'grid');
    };
    handleCheckMobile();
    window.addEventListener('resize', handleCheckMobile);
    return () => window.removeEventListener('resize', handleCheckMobile);
  }, []);

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
            
            if (typeof window !== 'undefined') {
              import('canvas-confetti').then(confetti => {
                confetti.default({
                  particleCount: isNew ? 180 : 120,
                  spread: 100,
                  origin: { y: 0.4 },
                  colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#10b981', '#3b82f6', '#ec4899']
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

    // In single view on mobile, advance to next unscratched card after 1 second so player sees the revealed card
    if (viewMode === 'single') {
      setTimeout(() => {
        setActiveCardIndex(prev => (prev < totalCards - 1 ? prev + 1 : prev));
      }, 1000);
    }
  }, [totalCards, viewMode]);

  const handleScratchAll = () => {
    hapticMedium();
    const allIds = new Set<string>(cards.map((c: any) => c.id));
    setRevealedIds(allIds);
  };

  // Color & Image for winner card
  const colors = ['red', 'green', 'blue', 'white', 'black'];
  const winnerColorName = colors[winnerCard?.variantIndex ?? 0] || 'red';
  const winnerImagePath = winnerCard ? `/images/Mythics/Mythic${winnerCard.number}${winnerColorName}.webp?v=2` : null;
  const winnerCreatureName = winnerCard ? getMythicName(winnerCard.number, winnerCard.variantIndex) : 'Mythic card';

  return (
    <div className="fixed inset-0 z-[999999] flex flex-col justify-between bg-zinc-950 p-3 sm:p-6 overflow-y-auto select-none min-h-dvh h-dvh max-h-dvh pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between z-20 pb-2 border-b border-amber-900/40 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="font-serif font-bold text-amber-300 text-sm sm:text-base capitalize">
            {packData.title || "Mystery card pack"}
          </span>
          <span className="text-xs text-amber-500/70 font-medium hidden sm:inline">
            ({revealedIds.size} / {totalCards} scratched)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle (Grid vs Single) */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewMode(viewMode === 'single' ? 'grid' : 'single')}
            className="text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-xs font-medium px-3 h-9"
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

      {/* Main Content Area */}
      <div className="relative w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center my-2 z-10 min-h-0 overflow-y-auto">
        {/* =========================================================================
            END SCREEN / VICTORY SHOWCASE (When 3 matching cards found or pack won)
           ========================================================================= */}
        {isWon && !showBoardOnEndScreen ? (
          <div className="flex flex-col items-center justify-center w-full my-auto space-y-3 sm:space-y-4 max-w-lg mx-auto animate-in zoom-in-95 duration-500">
            {/* Victory Header Banner */}
            <div className="text-center space-y-1.5 shrink-0">
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-zinc-950 px-4 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-wide shadow-lg border border-amber-200">
                🎉 3 matching cards found!
              </div>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-amber-300 drop-shadow-md">
                {isNewCard ? "✨ New creature unlocked! ✨" : "✨ Mystery card claimed! ✨"}
              </h2>
              <p className="text-xs sm:text-sm text-amber-200/90 font-medium">
                {isNewCard ? "Added to your mystery cards vault!" : "Duplicate converted to +50 alchemy essences."}
              </p>
            </div>

            {/* Prominent Claimed Creature Card Showcase */}
            <div className="relative w-full max-w-[230px] sm:max-w-[270px] aspect-[2/3] rounded-2xl overflow-hidden border-4 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.6)] bg-zinc-950 flex flex-col justify-end p-3 animate-pulse ring-4 ring-amber-500/40">
              {/* Background Ornate Texture */}
              <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity pointer-events-none">
                <Image
                  src="/images/headers/undiscovered.webp"
                  alt="Card frame texture"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Creature Artwork */}
              {winnerImagePath && (
                <Image
                  src={winnerImagePath}
                  alt={winnerCreatureName}
                  fill
                  className="object-contain p-2 relative z-10 drop-shadow-2xl"
                  priority
                />
              )}

              {/* Bottom Card Label Info Overlay */}
              <div className="relative z-20 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent pt-6 pb-1 px-2 rounded-xl text-center flex flex-col items-center">
                <span className="text-xs sm:text-sm font-serif font-bold text-amber-200 tracking-wider capitalize drop-shadow">
                  {winnerCreatureName}
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-purple-300 capitalize">
                  {winnerCard?.rarity || "Mythic"}
                </span>
                <div className="flex items-center justify-between w-full mt-1 pt-1 border-t border-amber-900/40 text-[10px] sm:text-xs">
                  <span className="font-mono text-zinc-400">#{winnerCard?.number}</span>
                  <span className="font-mono text-amber-300 font-bold">{winnerCard?.price} 🪙</span>
                </div>
              </div>
            </div>

            {/* Winning 3-Matching Set Summary Strip */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-full text-[11px] text-amber-300 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Found 3 matching {winnerCreatureName} cards</span>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowBoardOnEndScreen(true)}
                className="text-xs text-amber-400 hover:text-amber-200 underline font-medium cursor-pointer h-7"
              >
                <Eye className="w-3.5 h-3.5 mr-1" /> View all 9 scratched cards
              </Button>
            </div>
          </div>
        ) : null}

        {/* =========================================================================
            ACTIVE SCRATCHING PHASE (OR BOARD REVIEW ON VICTORY)
           ========================================================================= */}
        {(!isWon || showBoardOnEndScreen) && (
          <>
            {/* Title & Instructions */}
            <div className="text-center mb-3 space-y-0.5 shrink-0">
              <h2 className="text-xl sm:text-3xl font-serif font-bold text-amber-400 drop-shadow-sm">
                {isWon ? "Scratched mystery board" : "Scratch 3 matching cards to win"}
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                {viewMode === 'single'
                  ? `Scratching card ${activeCardIndex + 1} of ${totalCards}`
                  : "Scratch cards to reveal 3 matching symbols and win"}
              </p>
            </div>

            {/* DESKTOP / GRID VIEW: 3x3 GRID (Default on Desktop) */}
            {viewMode === 'grid' && (
              <div className="flex flex-col items-center w-full my-auto space-y-3">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-5 justify-items-center w-full max-w-[360px] sm:max-w-xl md:max-w-2xl mx-auto">
                  {cards.map((card: any) => {
                    const isWinnerMatching = isWon && card.isWinnerCard;
                    const isCardRevealed = revealedIds.has(card.id);
                    return (
                      <div
                        key={card.id}
                        className={cn(
                          "relative rounded-xl transition-all duration-300 p-0.5 w-full flex justify-center",
                          isWinnerMatching && "ring-4 ring-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.9)] scale-105"
                        )}
                      >
                        <ScratchCard 
                          cardData={card} 
                          isRevealed={isCardRevealed}
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

                {isWon && showBoardOnEndScreen && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowBoardOnEndScreen(false)}
                    className="bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900 text-xs font-medium px-4 h-8"
                  >
                    Back to claimed creature
                  </Button>
                )}
              </div>
            )}

            {/* MOBILE / SINGLE CARD CAROUSEL VIEW (Default on Mobile) */}
            {viewMode === 'single' && (
              <div className="flex flex-col items-center gap-4 w-full max-w-md my-auto">
                {/* Single Scratch Card Container */}
                <div className="relative w-full max-w-[270px] sm:max-w-[320px] aspect-[2/3] min-h-[340px] sm:min-h-[420px] rounded-2xl overflow-hidden border-4 border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.5)] bg-zinc-950 flex items-center justify-center p-1">
                  <ScratchCard 
                    key={currentCard.id} 
                    cardData={currentCard} 
                    isRevealed={revealedIds.has(currentCard.id)}
                    onReveal={handleReveal} 
                    isWinner={isWon && currentCard.isWinnerCard}
                    fullscreen={true}
                  />
                </div>

                {/* Carousel Controls & Step Dots */}
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={activeCardIndex === 0}
                    onClick={() => {
                      hapticLight();
                      setActiveCardIndex(prev => Math.max(0, prev - 1));
                    }}
                    className="bg-amber-950/60 border-amber-500/40 text-amber-300 disabled:opacity-30 h-9 px-2.5 text-xs font-medium"
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
                        aria-label={`Go to card ${idx + 1}`}
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
                    className="bg-amber-950/60 border-amber-500/40 text-amber-300 disabled:opacity-30 h-9 px-2.5 text-xs font-medium"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-0.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Scratch All Button during active game */}
            {!allScratched && !isWon && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleScratchAll}
                className="text-xs text-amber-400/80 hover:text-amber-200 underline font-medium cursor-pointer mt-1"
              >
                ✨ Scratch all cards
              </Button>
            )}
          </>
        )}
      </div>

      {/* Footer Claim Actions — Sticky Bottom Bar with safe area bounds */}
      {isWon && (
        <div className="sticky bottom-0 z-50 w-full max-w-md mx-auto flex flex-col sm:flex-row gap-2.5 pt-3 pb-2 border-t border-amber-900/50 bg-zinc-950/95 backdrop-blur-md shrink-0 shadow-2xl rounded-2xl p-3">
          <Button 
            size="lg" 
            variant="outline"
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700 font-medium text-xs sm:text-sm rounded-xl h-11"
            onClick={() => {
              onClose();
              router.push('/achievements?tab=mystery-cards');
            }}
          >
            🏆 Mystery cards vault
          </Button>
          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium text-sm rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-bounce h-11"
            onClick={onClose}
          >
            Collect
          </Button>
        </div>
      )}
    </div>
  );
}
