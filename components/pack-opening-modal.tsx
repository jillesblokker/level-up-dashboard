"use client";

import { useState, useEffect, useCallback } from 'react';
import { ScratchCard } from './scratch-card';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface PackOpeningModalProps {
  packData: any; // Result from generatePack
  onClose: () => void;
  onClaimed: (isNew: boolean) => void;
}

export function PackOpeningModal({ packData, onClose, onClaimed }: PackOpeningModalProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [claimed, setClaimed] = useState(false);
  const [isNewCard, setIsNewCard] = useState<boolean | null>(null);
  
  const winnerCount = packData.cards.filter((c: any) => revealedIds.has(c.id) && c.isWinnerCard).length;
  const isWon = winnerCount >= 3;

  useEffect(() => {
    if (isWon && !claimed) {
      setClaimed(true);
      // Claim logic
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
                  particleCount: 120,
                  spread: 80,
                  origin: { y: 0.5 },
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
  }, [isWon, claimed, packData, getToken, onClaimed]);

  const handleReveal = useCallback((cardId: string) => {
    setRevealedIds(prev => new Set(prev).add(cardId));
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/95 p-3 sm:p-6 overflow-y-auto relative">
      {/* Golden Particle Ray Burst Background */}
      <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent blur-3xl animate-pulse pointer-events-none" />
      <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center py-6 sm:py-10 pb-28 sm:pb-12 my-auto z-10">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6 sm:mb-8 px-4">
          {isWon ? (
            isNewCard === true ? (
              <div className="space-y-2 animate-bounce">
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-300 text-zinc-950 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-[0_0_20px_rgba(245,158,11,0.8)] border border-amber-200">
                  ✨ NEW CREATURE UNLOCKED! ✨
                </div>
                <h2 className="text-3xl sm:text-5xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 drop-shadow-md">
                  🎉 FIRST-TIME DISCOVERY! 🎉
                </h2>
                <p className="text-xs sm:text-sm text-amber-200 font-bold tracking-wide">
                  New creature added to your Mythic Vault Collection!
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-amber-500 mb-1 sm:mb-2 drop-shadow-sm">
                  ✨ Mythic Card Claimed! ✨
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 font-medium tracking-wide">
                  {isNewCard === false ? "🔄 Duplicate Card (+50 Alchemy Essences Granted)" : "Card added to your Mythics collection!"}
                </p>
              </div>
            )
          ) : (
            <div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-amber-500 mb-1 sm:mb-2 drop-shadow-sm">
                Scratch 3 to Win
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium tracking-wide">
                Find 3 matching cards to claim the prize
              </p>
            </div>
          )}
          <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold shadow-md">
            <span>✨ 100% Guaranteed Mythic Drop Rate Active</span>
          </div>
        </div>

        {/* 3x3 Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-6 mx-auto justify-items-center w-full max-w-[390px] sm:max-w-none px-2">
          {packData.cards.map((card: any) => (
            <ScratchCard 
              key={card.id} 
              cardData={card} 
              onReveal={handleReveal} 
              isWinner={isWon && card.isWinnerCard}
            />
          ))}
        </div>

        {isWon && (
          <div className="flex gap-3 sm:gap-4 mt-8 sm:mt-12 items-center flex-col-reverse sm:flex-row w-full sm:w-auto px-4">
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-sm sm:text-lg px-6 py-4 rounded-full min-h-[48px]"
              onClick={() => {
                onClose();
                router.push('/achievements');
              }}
            >
              See achievements
            </Button>
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-base sm:text-xl px-10 py-4 rounded-full shadow-[0_0_40px_rgba(245,158,11,0.5)] animate-bounce min-h-[52px]"
              onClick={onClose}
            >
              Collect & return
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
