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
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-amber-500 mb-1 sm:mb-2 drop-shadow-sm">
            {isWon ? "✨ You Won Mythic Card! ✨" : "Scratch 3 to Win"}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium tracking-wide">
            {isWon ? "Card added to your Mythics collection!" : "Find 3 matching cards to claim the prize"}
          </p>
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
