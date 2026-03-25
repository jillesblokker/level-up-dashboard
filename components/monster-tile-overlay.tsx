"use client"

import React from 'react'
import { Tile } from '@/types/tiles'
import { getTileMonsterType } from '@/lib/monster-spawn-manager'

interface MonsterTileOverlayProps {
  tile: Tile
  size?: number
  className?: string
}

export function MonsterTileOverlay({ tile, size = 32, className = '' }: MonsterTileOverlayProps) {
  const monsterType = getTileMonsterType(tile)
  
  if (!monsterType) return null

  const monsterImages = {
    dragon: '/images/Monsters/Dragoni.webp',
    goblin: '/images/Monsters/Orci.webp',
    troll: '/images/Monsters/Trollie.webp',
    wizard: '/images/Monsters/Sorceror.webp',
    pegasus: '/images/Monsters/Peggie.webp',
    fairy: '/images/Monsters/Fairiel.webp'
  }

  const imageSrc = monsterImages[monsterType as keyof typeof monsterImages]

  return (
    <div 
      className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}
      style={{ zIndex: 10 }}
    >
      <div className="relative">
        <img
          src={imageSrc}
          alt={`${monsterType} monster`}
          className="object-contain"
          style={{ width: size, height: size }}
        />
        {/* Monster indicator glow */}
        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse" />
      </div>
    </div>
  )
} 