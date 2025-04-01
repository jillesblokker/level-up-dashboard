"use client"

import { cn } from "@/lib/utils";
import Image from "next/image";
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
  type: string;
  rotation?: number;
  isMainTile?: boolean;
  citySize?: number;
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
}

// Map of tile types to their image paths
const tileImages = {
  forest: "/assets/tiles/forest-tile.png?v=1",
  water: "/assets/tiles/water-tile.png?v=1",
  mountain: "/assets/tiles/mountain-tile.png?v=1",
  desert: "/assets/tiles/desert-tile.png?v=1",
  town: "/assets/tiles/town-tile.png?v=1",
  city: "/assets/tiles/city-tile.png?v=1",
} as const;

export function TileVisual({ type, rotation = 0, isMainTile, citySize, className, ariaLabel, onClick }: TileVisualProps) {
  // For grass tile, use the GrassTile component
  if (type === 'grass') {
    return <GrassTile rotation={rotation} className={className} ariaLabel={ariaLabel} onClick={onClick} />;
  }

  // For tiles that use images
  if (type in tileImages) {
    return (
      <div 
        className={cn(
          "w-full h-full relative",
          isMainTile && citySize === 2 && "scale-150",
          className
        )}
        style={{ transform: `rotate(${rotation}deg)` }}
        onClick={onClick}
        role="img"
        aria-label={ariaLabel || `${type} tile`}
      >
        <Image
          src={tileImages[type as keyof typeof tileImages]}
          alt={`${type} tile`}
          fill
          className="object-cover"
          priority={true}
          unoptimized={true}
          loading="eager"
        />
      </div>
    );
  }

  // For other tile types that use components
  switch (type) {
    case "road":
      return <RoadTile rotation={rotation} className={className} ariaLabel={ariaLabel} onClick={onClick} />;
    case "corner":
      return <CornerRoadTile rotation={rotation} className={className} ariaLabel={ariaLabel} onClick={onClick} />;
    case "crossroad":
      return <CrossroadTile rotation={rotation} className={className} ariaLabel={ariaLabel} onClick={onClick} />;
    case "intersection":
      return <IntersectionTile className={className} ariaLabel={ariaLabel} onClick={onClick} />;
    case "t-junction":
      return <TJunctionTile rotation={rotation} className={className} ariaLabel={ariaLabel} onClick={onClick} />;
    case "dead-end":
      return <DeadEndTile rotation={rotation} className={className} ariaLabel={ariaLabel} onClick={onClick} />;
    case "special":
      return <SpecialTile className={className} ariaLabel={ariaLabel} onClick={onClick} />;
    case "snow":
      return <SnowTile className={className} ariaLabel={ariaLabel} onClick={onClick} />;
    case "mystery":
      return <MysteryTile className={className} ariaLabel={ariaLabel} onClick={onClick} />;
    case "treasure":
      return <TreasureTile className={className} ariaLabel={ariaLabel} onClick={onClick} />;
    case "dungeon":
      return <DungeonTile className={className} ariaLabel={ariaLabel} onClick={onClick} />;
    case "monster":
      return <MonsterTile className={className} ariaLabel={ariaLabel} onClick={onClick} />;
    default:
      return (
        <div
          className={cn(
            "w-full h-full bg-gray-200",
            className
          )}
          style={{ transform: `rotate(${rotation}deg)` }}
          aria-label={ariaLabel || "Empty tile"}
          onClick={onClick}
        />
      );
  }
} 