"use client"

import { useState } from 'react';
import Image from 'next/image';
import { Creature } from '@/stores/creatureStore';
import { ElementParticles } from './element-particles';

interface CreatureCardProps {
  creature: Creature;
  discovered: boolean;
  showCard: boolean;
  previewMode: boolean;
  hideNameWhenUndiscovered?: boolean;
}

export function CreatureCard({ creature, discovered, showCard, previewMode, hideNameWhenUndiscovered }: CreatureCardProps) {
  const [showStats, setShowStats] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Consider a card as effectively discovered if it's actually discovered or in preview mode
  const isEffectivelyDiscovered = discovered || previewMode;

  if (!showCard) {
    return (
      <div className="relative aspect-[3/4] w-full">
        <Image
          src="/images/undiscovered.png"
          alt="Undiscovered Creature"
          fill
          className="object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div
      className="relative aspect-[3/4] w-full cursor-pointer"
      onClick={() => setShowStats(!showStats)}
    >
      {/* Creature Image */}
      <div className="relative w-full h-full">
        {!imageError ? (
          <Image
            src={isEffectivelyDiscovered ? creature.image : "/images/undiscovered.png"}
            alt={isEffectivelyDiscovered ? creature.name : "Undiscovered Creature"}
            fill
            className="object-contain"
            priority
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="text-amber-500">Image not found</div>
        )}
      </div>

      {/* Stats Overlay */}
      {showStats && isEffectivelyDiscovered && (
        <div className="absolute inset-0 bg-[#0a192f]/90 p-10 flex flex-col">
          <h3 className="text-xl font-bold text-amber-500 mb-4">{creature.name}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-300 mb-1">HP</p>
              <p className="text-white font-medium">{creature.stats.hp}</p>
            </div>
            <div>
              <p className="text-gray-300 mb-1">Attack</p>
              <p className="text-white font-medium">{creature.stats.attack}</p>
            </div>
            <div>
              <p className="text-gray-300 mb-1">Defense</p>
              <p className="text-white font-medium">{creature.stats.defense}</p>
            </div>
            <div>
              <p className="text-gray-300 mb-1">Speed</p>
              <p className="text-white font-medium">{creature.stats.speed}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-300 mb-1">Type</p>
              <p className="text-white font-medium">{creature.stats.type}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-300 mb-1">Description</p>
            <p className="text-white text-sm leading-relaxed">{creature.description}</p>
          </div>
        </div>
      )}

      {/* Particles based on creature type */}
      {isEffectivelyDiscovered && <ElementParticles type={creature.stats.type.toLowerCase()} />}
    </div>
  );
} 