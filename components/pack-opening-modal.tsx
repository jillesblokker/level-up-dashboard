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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950  p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center py-6 sm:py-10">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="text-center mb-6 sm:mb-8 px-4">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-amber-500 mb-1 sm:mb-2 drop-shadow-sm">
            {isWon ? "You Won!" : "Scratch 3 to Win"}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium tracking-wide">
            {isWon ? "Card added to your Mythics collection!" : "Find 3 matching cards to claim the prize"}
          </p>
        </div>

        {/* 3x3 Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mx-auto justify-items-center w-full max-w-[390px] sm:max-w-none px-4">
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
          <div className="flex gap-4 mt-12 items-center flex-col sm:flex-row">
            <Button 
              size="lg" 
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-lg px-8 py-6 rounded-full"
              onClick={() => {
                onClose();
                router.push('/achievements');
              }}
            >
              See achievements
            </Button>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xl px-12 py-6 rounded-full shadow-[0_0_40px_rgba(245,158,11,0.5)] animate-bounce"
              onClick={onClose}
            >
              Collect & Return
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
