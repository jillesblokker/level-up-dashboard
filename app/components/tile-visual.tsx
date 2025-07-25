"use client"

import React from 'react'
import Image from 'next/image'
import { cn } from "@/lib/utils"
import { Tile } from '@/types/tiles'
import { SpecialTile } from "./tile-visuals/special-tile";
import { SnowTile } from "./tile-visuals/snow-tile";
import { MysteryTile } from "./tile-visuals/mystery-tile";
import { TreasureTile } from "./tile-visuals/treasure-tile";
import { DungeonTile } from "./tile-visuals/dungeon-tile";
import { MonsterTile } from "./tile-visuals/monster-tile";
import { GrassTile } from "./tile-visuals/grass-tile";

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

// Map of tile types to their image paths
const tileImages = {
  empty: "/images/tiles/empty-tile.png",
  forest: "/images/tiles/forest-tile.png",
  mountain: "/images/tiles/mountain-tile.png",
  water: "/images/tiles/water-tile.png",
  mystery: "/images/tiles/mystery-tile.png",
  desert: "/images/tiles/desert-tile.png",
  town: "/images/tiles/town-tile.png",
  city: "/images/tiles/city-tile.png",
} as const;

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
  const [imageError, setImageError] = React.useState(false)

  // Common props for interactive tiles
  const commonTileProps = {
    onClick,
    onMouseEnter: onHover,
    onMouseLeave: onHoverEnd,
    role: "button",
    "aria-label": `${tile.ariaLabel || `${tile.type} tile`}${isSelected ? ' - selected' : ''}${isCharacterPresent ? ' - character present' : ''}`,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    },
    "aria-pressed": isSelected,
    "aria-describedby": tile.description ? `tile-description-${tile.id}` : undefined
  };

  // For grass tile, use the GrassTile component
  if (tile.type === 'grass') {
    return <GrassTile {...(className && { className })} {...(onClick && { onClick })} ariaLabel={tile.ariaLabel} />;
  }

  // For tiles that use images
  if (tile.type in tileImages && !imageError) {
    return (
      <div 
        {...commonTileProps}
        className={cn(
          "w-full h-full relative tile-container",
          isSelected && "ring-2 ring-amber-500",
          isHovered && "brightness-110",
          tile.type === 'empty' && "bg-amber-900/20 empty-tile-container",
          className
        )}
        style={{ transform: `rotate(${tile.rotation || 0}deg)` }}
      >
        {tile.description && (
          <div id={`tile-description-${tile.id}`} className="sr-only">
            {tile.description}
          </div>
        )}
        <div className="relative w-full h-full tile-image-container">
          <Image
            src={tileImages[tile.type as keyof typeof tileImages]}
            alt={`${tile.name || tile.type} tile visual`}
            fill
            sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
            className={cn(
              "object-cover transition-all duration-200",
              isCharacterPresent && "brightness-75",
              tile.type === 'empty' && "opacity-75"
            )}
            priority={true}
            onError={() => setImageError(true)}
            aria-hidden="true"
          />
          {isCharacterPresent && (
            <div 
              className="absolute inset-0 flex items-center justify-center character-container"
              aria-label="Character location indicator"
              role="status"
            >
              <div className="w-3/4 h-3/4 relative">
                <Image
                  src="/images/character/character.png"
                  alt="Character token"
                  fill
                  sizes="(max-width: 768px) 25vw, (max-width: 1200px) 20vw, 15vw"
                  className="object-contain"
                  priority={true}
                  aria-hidden="true"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // For other tile types that use components
  switch (tile.type) {
    case "special":
      return <SpecialTile {...(className && { className })} {...(onClick && { onClick })} ariaLabel={tile.ariaLabel} />;
    case "snow":
      return <SnowTile {...(className && { className })} {...(onClick && { onClick })} ariaLabel={tile.ariaLabel} />;
    case "mystery":
      return <MysteryTile {...(className && { className })} {...(onClick && { onClick })} ariaLabel={tile.ariaLabel} />;
    case "treasure":
      return <TreasureTile {...(className && { className })} {...(onClick && { onClick })} ariaLabel={tile.ariaLabel} />;
    case "dungeon":
      return <DungeonTile {...(className && { className })} {...(onClick && { onClick })} ariaLabel={tile.ariaLabel} />;
    case "monster":
      return <MonsterTile {...(className && { className })} {...(onClick && { onClick })} ariaLabel={tile.ariaLabel} />;
    default:
      return <div {...(className && { className })} aria-label={tile.ariaLabel}>Unknown Tile</div>;
  }
} 