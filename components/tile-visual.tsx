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
        return '/images/tiles/grass-tile.png'
      case 'forest':
        return '/images/tiles/forest-tile.png'
      case 'water':
        return '/images/tiles/water-tile.png'
      case 'mountain':
        return '/images/tiles/mountain-tile.png'
      case 'desert':
        return '/images/tiles/desert-tile.png'
      case 'ice':
        return '/images/tiles/ice-tile.png'
      case 'city':
        return '/images/tiles/city-tile.png'
      case 'town':
        return '/images/tiles/town-tile.png'
      case 'mystery':
        return '/images/tiles/mystery-tile.png'
      default:
        return '/images/tiles/empty-tile.png'
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
        !tile.revealed && 'bg-gray-800',
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
          {tile.isDiscovered && !tile.isVisited && (
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center text-xs font-bold text-white z-10">
              !
            </div>
          )}
        </>
      )}
    </div>
  )
}

