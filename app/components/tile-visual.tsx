"use client"

import React from 'react'
import Image from 'next/image'
import { cn } from "@/lib/utils"
import { Tile } from '@/types/tiles'
import { RoadTile } from "./tile-visuals/road-tile";
import { CornerRoadTile } from "./tile-visuals/corner-road-tile";
import { CrossroadTile } from "./tile-visuals/crossroad-tile";
import { IntersectionTile } from "./tile-visuals/intersection-tile";
import { TJunctionTile } from "./tile-visuals/t-junction-tile";
import { DeadEndTile } from "./tile-visuals/dead-end-tile";
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

  // For grass tile, use the GrassTile component
  if (tile.type === 'grass') {
    return <GrassTile rotation={tile.rotation} className={className} ariaLabel={tile.ariaLabel} onClick={onClick} />;
  }

  // For tiles that use images
  if (tile.type in tileImages && !imageError) {
    return (
      <div 
        className={cn(
          "w-full h-full relative",
          isSelected && "ring-2 ring-yellow-500",
          isHovered && "brightness-110",
          className
        )}
        style={{ transform: `rotate(${tile.rotation || 0}deg)` }}
        onClick={onClick}
        onMouseEnter={onHover}
        onMouseLeave={onHoverEnd}
        role="img"
        aria-label={`${tile.type} tile`}
      >
        <div className="relative w-full h-full">
          <Image
            src={tileImages[tile.type as keyof typeof tileImages]}
            alt={`${tile.type} tile`}
            fill
            sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
            className={cn(
              "object-cover transition-all duration-200",
              isCharacterPresent && "brightness-75"
            )}
            priority={true}
            onError={() => setImageError(true)}
          />
          {isCharacterPresent && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3/4 h-3/4 relative">
                <Image
                  src="/images/character/character-token.png"
                  alt="Character"
                  fill
                  sizes="(max-width: 768px) 25vw, (max-width: 1200px) 20vw, 15vw"
                  className="object-contain"
                  priority={true}
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
    case "road":
      return <RoadTile rotation={tile.rotation} className={className} ariaLabel={tile.ariaLabel} onClick={onClick} />;
    case "corner":
      return <CornerRoadTile rotation={tile.rotation} className={className} ariaLabel={tile.ariaLabel} onClick={onClick} />;
    case "crossroad":
      return <CrossroadTile rotation={tile.rotation} className={className} ariaLabel={tile.ariaLabel} onClick={onClick} />;
    case "intersection":
      return <IntersectionTile className={className} ariaLabel={tile.ariaLabel} onClick={onClick} />;
    case "t-junction":
      return <TJunctionTile rotation={tile.rotation} className={className} ariaLabel={tile.ariaLabel} onClick={onClick} />;
    case "dead-end":
      return <DeadEndTile rotation={tile.rotation} className={className} ariaLabel={tile.ariaLabel} onClick={onClick} />;
    case "special":
      return <SpecialTile className={className} ariaLabel={tile.ariaLabel} onClick={onClick} />;
    case "snow":
      return <SnowTile className={className} ariaLabel={tile.ariaLabel} onClick={onClick} />;
    case "mystery":
      return <MysteryTile className={className} ariaLabel={tile.ariaLabel} onClick={onClick} />;
    case "treasure":
      return <TreasureTile className={className} ariaLabel={tile.ariaLabel} onClick={onClick} />;
    case "dungeon":
      return <DungeonTile className={className} ariaLabel={tile.ariaLabel} onClick={onClick} />;
    case "monster":
      return <MonsterTile className={className} ariaLabel={tile.ariaLabel} onClick={onClick} />;
    default:
      return (
        <div 
          className={cn(
            "w-full h-full bg-green-800",
            isSelected && "ring-2 ring-yellow-500",
            isHovered && "brightness-110",
            className
          )}
          style={{ transform: `rotate(${tile.rotation || 0}deg)` }}
          onClick={onClick}
          onMouseEnter={onHover}
          onMouseLeave={onHoverEnd}
          role="img"
          aria-label={`${tile.type} tile`}
        >
          {isCharacterPresent && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3/4 h-3/4 relative">
                <Image
                  src="/images/character/character-token.png"
                  alt="Character"
                  fill
                  sizes="(max-width: 768px) 25vw, (max-width: 1200px) 20vw, 15vw"
                  className="object-contain"
                  priority={true}
                />
              </div>
            </div>
          )}
        </div>
      );
  }
} 