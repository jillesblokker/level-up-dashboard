"use client"

import { cn } from "@/lib/utils"
import { GrassTile } from "./tile-visuals/grass-tile"
import { ForestTile } from "./tile-visuals/forest-tile"
import { WaterTile } from "./tile-visuals/water-tile"
import { MountainTile } from "./tile-visuals/mountain-tile"
import { CityTile } from "./tile-visuals/city-tile"
import { DesertTile } from "./tile-visuals/desert-tile"
import { RoadTile } from "./tile-visuals/road-tile"
import { CornerRoadTile } from "./tile-visuals/corner-road-tile"
import { CrossroadTile } from "./tile-visuals/crossroad-tile"
import { SpecialTile } from "./tile-visuals/special-tile"
import { SnowTile } from "./tile-visuals/snow-tile"
import { IntersectionTile } from "./tile-visuals/intersection-tile"
import { MysteryTile } from "./tile-visuals/mystery-tile"
import { TreasureTile } from "./tile-visuals/treasure-tile"
import { DungeonTile } from "./tile-visuals/dungeon-tile"
import { MonsterTile } from "./tile-visuals/monster-tile"
import { Building2 } from "lucide-react"
import Image from "next/image"

interface TileVisualProps {
  type: string
  rotation?: number
  isMainTile?: boolean
  citySize?: number
  className?: string
  ariaLabel?: string
  onClick?: () => void
  isSelected?: boolean
  isVisited?: boolean
}

export function TileVisual({ type, rotation = 0, isMainTile, citySize, className, ariaLabel, onClick, isSelected = false, isVisited = false }: TileVisualProps) {
  const imagePath = `/images/tiles/${type}-tile.png`;
  
  // Define a wrapper that applies rotation to any tile component that doesn't handle rotation internally
  const withRotation = (Component: React.ReactNode) => (
    <div style={{ transform: `rotate(${rotation}deg)` }} className="w-full h-full">
      {Component}
    </div>
  );

  switch (type) {
    case "grass":
      return withRotation(<GrassTile ariaLabel={ariaLabel || "Grass tile"} onClick={onClick} className={className} />);
    case "forest":
      return withRotation(<ForestTile ariaLabel={ariaLabel || "Forest tile"} onClick={onClick} className={className} />);
    case "water":
      return withRotation(<WaterTile ariaLabel={ariaLabel || "Water tile"} onClick={onClick} className={className} />);
    case "mountain":
      return withRotation(<MountainTile ariaLabel={ariaLabel || "Mountain tile"} onClick={onClick} className={className} />);
    case "city":
      return withRotation(<CityTile ariaLabel={ariaLabel || "City tile"} onClick={onClick} className={className} isMainTile={isMainTile} citySize={citySize} />);
    case "town":
      return withRotation(<CityTile ariaLabel={ariaLabel || "Town tile"} onClick={onClick} className={cn("scale-90", className)} isMainTile={isMainTile} citySize={citySize} />);
    case "desert":
      return withRotation(<DesertTile ariaLabel={ariaLabel || "Desert tile"} onClick={onClick} className={className} />);
    case "road":
      return <RoadTile ariaLabel={ariaLabel || "Road tile"} onClick={onClick} className={className} rotation={rotation} />;
    case "corner-road":
      return <CornerRoadTile ariaLabel={ariaLabel || "Corner road tile"} onClick={onClick} className={className} rotation={rotation} />;
    case "crossroad":
      return <CrossroadTile ariaLabel={ariaLabel || "Crossroad tile"} onClick={onClick} className={className} rotation={rotation} />;
    case "special":
      return withRotation(<SpecialTile ariaLabel={ariaLabel || "Special tile"} onClick={onClick} className={className} />);
    case "snow":
      return withRotation(<SnowTile ariaLabel={ariaLabel || "Snow tile"} onClick={onClick} className={className} />);
    case "intersection":
      return withRotation(<IntersectionTile ariaLabel={ariaLabel} onClick={onClick} />);
    case "mystery":
      return withRotation(<MysteryTile ariaLabel={ariaLabel || "Mystery tile"} onClick={onClick} className={className} />);
    case "treasure":
      return withRotation(<TreasureTile ariaLabel={ariaLabel || "Treasure tile"} onClick={onClick} className={className} />);
    case "dungeon":
      return withRotation(<DungeonTile ariaLabel={ariaLabel || "Dungeon tile"} onClick={onClick} className={className} />);
    case "monster":
      return withRotation(<MonsterTile ariaLabel={ariaLabel || "Monster tile"} onClick={onClick} className={className} />);
    default:
      return (
        <div className="relative w-full h-full">
          <Image
            src={imagePath}
            alt={`${type} tile`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn(
              "object-cover transition-all",
              isSelected && "ring-2 ring-primary",
              isVisited && "brightness-90",
              rotation && `rotate-${rotation}`
            )}
          />
        </div>
      );
  }
}

