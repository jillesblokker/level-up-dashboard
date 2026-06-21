"use client"

import { useState } from 'react';
import Image from 'next/image';
import { Creature } from '@/stores/creatureStore';
import { useCitizensStore } from '@/stores/citizensStore';
import { Star } from 'lucide-react';

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
      className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-lg bg-slate-950"
      onClick={() => setShowStats(!showStats)}
    >
      {/* Card Background */}
      <div className="absolute inset-0 rounded-lg bg-slate-950" />

      {/* Creature Image */}
      <div className="relative w-full h-full">
        {!imageError ? (
          <Image
            src={isEffectivelyDiscovered ? `/images/creatures/${creature.id}.png?v=3` : "/images/undiscovered.webp"}
            alt={isEffectivelyDiscovered ? creature.name : "Undiscovered Creature"}
            fill
            className="object-contain"
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="text-amber-500">Image not found</div>
        )}
      </div>

      {/* Stats Overlay */}
      {showStats && isEffectivelyDiscovered && (
        <div className="absolute inset-0 bg-slate-900/95 p-4 sm:p-6 overflow-y-auto flex flex-col z-30 no-scrollbar">
          <h3 className="text-base sm:text-lg font-bold text-amber-500 mb-2 sm:mb-4 truncate">{creature.name}</h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div>
              <p className="text-gray-400">HP</p>
              <p className="text-white font-semibold">{creature.stats.hp}</p>
            </div>
            <div>
              <p className="text-gray-400">Attack</p>
              <p className="text-white font-semibold">{creature.stats.attack}</p>
            </div>
            <div>
              <p className="text-gray-400">Defense</p>
              <p className="text-white font-semibold">{creature.stats.defense}</p>
            </div>
            <div>
              <p className="text-gray-400">Speed</p>
              <p className="text-white font-semibold">{creature.stats.speed}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-400">Type</p>
              <p className="text-white font-semibold">{creature.stats.type}</p>
            </div>
          </div>

          {citizen && (
            <div className="mt-3 p-2 bg-amber-950/40 border border-amber-900/50 rounded flex justify-between items-center">
              <div>
                <p className="text-amber-500/80 text-[10px] uppercase font-bold tracking-wider">Bond</p>
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < Math.floor((citizen.affection || 0) / 20) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-amber-500/80 text-[10px] uppercase font-bold tracking-wider">Citizen</p>
                <p className="text-amber-400 text-xs font-semibold">{citizen.active ? 'Wandering' : 'Resting'}</p>
              </div>
            </div>
          )}

          <div className="mt-3 sm:mt-4">
            <p className="text-gray-400 text-xs sm:text-sm">Description</p>
            <p className="text-white text-xs sm:text-sm leading-relaxed mt-0.5">{creature.description}</p>
          </div>
        </div>
      )}
    </div>
  );
} 