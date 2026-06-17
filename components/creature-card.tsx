"use client"

import { useState } from 'react';
import Image from 'next/image';
import { Creature } from '@/stores/creatureStore';

interface CreatureCardProps {
  creature: Creature;
  discovered: boolean;
  showCard: boolean;
  previewMode: boolean;
}

export function CreatureCard({ creature, discovered, showCard, previewMode }: CreatureCardProps) {
  const [showStats, setShowStats] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Consider a card as effectively discovered if it's actually discovered or in preview mode
  const isEffectivelyDiscovered = discovered || previewMode;

  if (!showCard) {
    return (
      <div className="relative aspect-[3/4] w-full">
        <Image
          src="/images/undiscovered.webp"
          alt="Undiscovered Creature"
          fill
          className="object-contain"
          priority
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
            src={isEffectivelyDiscovered ? creature.image : "/images/undiscovered.webp"}
            alt={isEffectivelyDiscovered ? creature.name : "Undiscovered Creature"}
            fill
            className="object-contain"
            priority
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
          <div className="mt-3 sm:mt-4">
            <p className="text-gray-400 text-xs sm:text-sm">Description</p>
            <p className="text-white text-xs sm:text-sm leading-relaxed mt-0.5">{creature.description}</p>
          </div>
        </div>
      )}
    </div>
  );
} 