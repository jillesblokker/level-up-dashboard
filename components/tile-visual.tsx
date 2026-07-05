"use client"

import React from 'react'
import Image from 'next/image'
import { cn } from "@/lib/utils"
import { Tile } from '@/types/tiles'

interface TileVisualProps {
  tile: Tile
  isSelected?: boolean
  isHovered?: boolean
  isCharacterPresent?: boolean
  onClick?: () => void
  onHover?: () => void
  onHoverEnd?: () => void
  className?: string
}

export function TileVisual({
  tile,
  isSelected,
  isHovered,
  isCharacterPresent,
  onClick,
  onHover,
  onHoverEnd,
  className
}: TileVisualProps) {
  const getTileImage = () => {
    switch (tile.type) {
      case 'grass':
        return '/images/tiles/grass-tile.webp'
      case 'forest':
        return '/images/tiles/forest-tile.webp'
      case 'water':
        return '/images/tiles/water-tile.webp'
      case 'mountain':
        return '/images/tiles/mountain-tile.webp'
      case 'desert':
        return '/images/tiles/desert-tile.webp'
      case 'ice':
        return '/images/tiles/ice-tile.webp'
      case 'city':
        return '/images/tiles/city-tile.webp'
      case 'town':
        return '/images/tiles/town-tile.webp'
      case 'mystery':
        return '/images/tiles/mystery-tile.webp'
      case 'portal-entrance':
        return '/images/tiles/portal-entrance-tile.webp'
      case 'portal-exit':
        return '/images/tiles/portal-exit-tile.webp'
      case 'cave':
        return '/images/tiles/cave-tile.webp'
      case 'dungeon':
        return '/images/tiles/dungeon-tile.webp'
      case 'castle':
        return '/images/tiles/castle-tile.webp'
      case 'snow':
        return '/images/tiles/snow-tile.webp'
      case 'lava':
        return '/images/tiles/lava-tile.webp'
      case 'volcano':
        return '/images/tiles/volcano-tile.webp'
      case 'pyramid':
        return '/images/tiles/pyramid-tile.png'
      case 'whispering-well':
        return '/images/tiles/whispering-well-tile.png'
      case 'sphinx-gates':
        return '/images/tiles/sphinx-gates-tile.png'
      case 'whispering-canopy':
        return '/images/tiles/whispering-canopy-tile.png'
      case 'frostfire-obelisk':
        return '/images/tiles/frostfire-obelisk-tile.png'
      case 'fairy-ring':
        return '/images/tiles/fairy-ring-tile.png'
      case 'settlement':
        return '/images/tiles/settlement-tile.webp'
      case 'megapolis':
        return '/images/tiles/megapolis-tile.webp'
      default:
        return '/images/tiles/empty-tile.webp'
    }
  }

  return (
    <div
      className={cn(
        'relative w-full h-full',
        {
          'ring-2 ring-white': isSelected,
          'opacity-75': isHovered,
          'cursor-pointer': onClick
        },
        !tile.revealed && 'bg-zinc-800',
        className
      )}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      style={{
        transform: `rotate(${tile.rotation}deg)`
      }}
    >
      {tile.revealed && (
        <>
          <Image
            src={getTileImage()}
            alt={tile.type}
            fill
            className="object-cover"
            priority={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {tile.isMainTile && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-black z-10">
              M
            </div>
          )}
        </>
      )}
    </div>
  )
}

