"use client"

import { useState } from 'react';
import Image from 'next/image';
import { Creature } from '@/stores/creatureStore';
import { useCitizensStore } from '@/stores/citizensStore';
import { Star, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreatureCardProps {
  creature: Creature;
  discovered: boolean;
  showCard: boolean;
  previewMode: boolean;
  priority?: boolean;
}

export function CreatureCard({ creature, discovered, showCard, previewMode, priority = false }: CreatureCardProps) {
  const [showStats, setShowStats] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Consider a card as effectively discovered if it's actually discovered or in preview mode
  const isEffectivelyDiscovered = discovered || previewMode;
  const citizens = useCitizensStore(state => state.citizens);
  const citizen = citizens.find(c => c.id === creature.id);

  if (!showCard) {
    return (
      <div className="relative aspect-[3/4] w-full">
        <Image
          src="/images/undiscovered.webp"
          alt="Undiscovered Creature"
          fill
          className="object-contain"
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={showStats}
      aria-label={`Creature card: ${isEffectivelyDiscovered ? creature.name : 'Undiscovered Creature'}. Click or press space to view stats.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setShowStats(!showStats);
        }
      }}
      className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-amber-800/40 bg-gradient-to-b from-amber-950/30 via-zinc-900 to-zinc-950 shadow-xl hover:border-amber-400/60 hover:scale-[1.02] active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
      onClick={() => setShowStats(!showStats)}
    >
      {/* Card Background */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-950/20 via-zinc-950 to-zinc-950" />

      {/* Creature Image */}
      <div className="relative w-full h-full">
        {!imageError ? (
          <Image
            src={isEffectivelyDiscovered ? `/images/creatures/${creature.id}.png?v=3` : "/images/undiscovered.webp"}
            alt={isEffectivelyDiscovered ? creature.name : "Undiscovered Creature"}
            fill
            className="object-contain p-2"
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="text-amber-400 font-bold p-4 text-center">Image not found</div>
        )}
      </div>

      {/* Stats Overlay - High Contrast */}
      {showStats && isEffectivelyDiscovered && (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900/98 to-zinc-950 p-4 sm:p-5 overflow-y-auto flex flex-col z-30 no-scrollbar border-t border-amber-500/40 backdrop-blur-md">
          <h3 className="text-base sm:text-lg font-serif font-bold text-amber-300 mb-2 sm:mb-3 truncate drop-shadow">{creature.name}</h3>
          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
            <div className="bg-zinc-950/80 p-2 rounded-lg border border-amber-900/30">
              <p className="text-zinc-300 font-medium">HP</p>
              <p className="text-amber-200 font-bold font-mono">{creature.stats.hp}</p>
            </div>
            <div className="bg-zinc-950/80 p-2 rounded-lg border border-amber-900/30">
              <p className="text-zinc-300 font-medium">Attack</p>
              <p className="text-amber-200 font-bold font-mono">{creature.stats.attack}</p>
            </div>
            <div className="bg-zinc-950/80 p-2 rounded-lg border border-amber-900/30">
              <p className="text-zinc-300 font-medium">Defense</p>
              <p className="text-amber-200 font-bold font-mono">{creature.stats.defense}</p>
            </div>
            <div className="bg-zinc-950/80 p-2 rounded-lg border border-amber-900/30">
              <p className="text-zinc-300 font-medium">Speed</p>
              <p className="text-amber-200 font-bold font-mono">{creature.stats.speed}</p>
            </div>
            <div className="col-span-2 bg-zinc-950/80 p-2 rounded-lg border border-amber-900/30">
              <p className="text-zinc-300 font-medium">Type</p>
              <p className="text-amber-300 font-semibold capitalize">{creature.stats.type}</p>
            </div>
          </div>

          {citizen && (
            <div className="mt-3 p-2.5 bg-amber-950/50 border border-amber-500/40 rounded-xl flex justify-between items-center shadow-inner">
              <div>
                <p className="text-amber-300 text-[10px] uppercase font-bold tracking-wider">Bond</p>
                <div className="flex gap-1 mt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const isFilled = i < Math.floor((citizen.affection || 0) / 20);
                    return (
                      <Heart 
                        key={i} 
                        className={cn(
                          "w-3.5 h-3.5 transition-colors duration-200",
                          isFilled ? "fill-pink-500 text-pink-500 drop-shadow-[0_0_4px_rgba(244,63,94,0.7)]" : "text-zinc-700"
                        )} 
                      />
                    );
                  })}
                </div>
              </div>
              <div className="text-right">
                <p className="text-amber-300 text-[10px] uppercase font-bold tracking-wider">Status</p>
                <p className="text-amber-200 text-xs font-semibold">{citizen.active ? 'Wandering' : 'Resting'}</p>
              </div>
            </div>
          )}

          <div className="mt-3">
            <p className="text-zinc-300 text-xs font-semibold">Description</p>
            <p className="text-amber-100 text-xs leading-relaxed mt-0.5 italic font-serif">{creature.description}</p>
          </div>
        </div>
      )}
    </div>
  );
} 