import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Tile } from "@/types/tiles";
import { CreatureLayer } from '@/components/creature-layer';

interface MapGridProps {
  grid: Tile[][];
  playerPosition: { x: number; y: number };
  onTileClick: (x: number, y: number) => void;
  className?: string;
  playerLevel?: number;
  onTileSizeChange?: (tileSize: number) => void;
  // Animal props
  penguinPos?: { x: number; y: number } | null;
  horsePos?: { x: number; y: number } | null;
  sheepPos?: { x: number; y: number } | null;
  eaglePos?: { x: number; y: number } | null;
  isPenguinPresent?: boolean;
  isHorsePresent?: boolean;
  isSheepPresent?: boolean;
  horseCaught?: boolean;
  sheepCaught?: boolean;
  penguinCaught?: boolean;
}

const getTileImage = (tileType: string) => {
  switch (tileType) {
    case 'grass':
      return '/images/tiles/grass-tile.png';
    case 'forest':
      return '/images/tiles/forest-tile.png';
    case 'water':
      return '/images/tiles/water-tile.png';
    case 'mountain':
      return '/images/tiles/mountain-tile.png';
    case 'desert':
      return '/images/tiles/desert-tile.png';
    case 'ice':
      return '/images/tiles/ice-tile.png';
    case 'city':
      return '/images/tiles/city-tile.png';
    case 'town':
      return '/images/tiles/town-tile.png';
    case 'mystery':
      return '/images/tiles/mystery-tile.png';
    case 'portal-entrance':
      return '/images/tiles/portal-entrance-tile.png';
    case 'portal-exit':
      return '/images/tiles/portal-exit-tile.png';
    case 'cave':
      return '/images/tiles/cave-tile.png';
    case 'dungeon':
      return '/images/tiles/dungeon-tile.png';
    case 'castle':
      return '/images/tiles/castle-tile.png';
    default:
      return '/images/tiles/empty-tile.png';
  }
};

const getMonsterImageName = (monsterType: string) => {
  switch (monsterType) {
    case 'dragon':
      return 'Dragoni';
    case 'goblin':
      return 'Orci';
    case 'troll':
      return 'Trollie';
    case 'wizard':
      return 'Sorceror';
    case 'pegasus':
      return 'Peggie';
    case 'fairy':
      return 'Fairiel';
    default:
      return 'Dragoni'; // fallback to dragon
  }
};

export function MapGrid({
  grid,
  playerPosition,
  onTileClick,
  playerLevel = 0,
  onTileSizeChange,
  penguinPos,
  horsePos,
  sheepPos,
  eaglePos,
  isPenguinPresent = false,
  isHorsePresent = false,
  isSheepPresent = false,
  horseCaught = false,
  sheepCaught = false,
  penguinCaught = false
}: MapGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [tileSize, setTileSize] = useState(80);
  const [isLoading, setIsLoading] = useState(true);



  // Calculate responsive tile size based on container width
  useEffect(() => {
    function handleResize() {
      if (!gridRef.current) return;

      const containerWidth = gridRef.current.clientWidth;
      const containerHeight = gridRef.current.clientHeight;

      // Calculate optimal tile size to fill the container
      const maxCols = grid?.[0]?.length || 13;
      const maxRows = grid?.length || 7;

      const tileSizeX = containerWidth / maxCols;
      const tileSizeY = containerHeight / maxRows;

      // Use the larger dimension to fill available space, but cap at reasonable max
      const newTileSize = Math.min(Math.max(tileSizeX, tileSizeY), 120); // Use larger dimension, max 120px
      const finalTileSize = Math.max(newTileSize, 60); // Minimum 60px for better visibility
      setTileSize(finalTileSize);
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [grid]);

  // Notify parent component when tile size changes
  useEffect(() => {
    if (onTileSizeChange) {
      onTileSizeChange(tileSize);
    }
  }, [tileSize, onTileSizeChange]);

  // Set loading state when grid changes
  useEffect(() => {
    if (grid && Array.isArray(grid) && grid.length > 0) {
      setIsLoading(false);
    }
  }, [grid]);

  const handlePan = (dx: number, dy: number) => {
    if (!gridRef.current) return;

    const containerWidth = gridRef.current.clientWidth;
    const containerHeight = gridRef.current.clientHeight;

    // Calculate the new scroll position
    const newX = (playerPosition.x * tileSize - containerWidth / 2) + dx;
    const newY = (playerPosition.y * tileSize - containerHeight / 2) + dy;

    // Scroll the grid container
    gridRef.current.scrollTo({
      left: newX,
      top: newY,
      behavior: 'smooth'
    });
  };

  // Keep character in view when moving
  useEffect(() => {
    if (gridRef.current) {
      handlePan(0, 0);
    }
  }, [playerPosition.x, playerPosition.y, tileSize]);

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent default to avoid zoom on double tap
    e.preventDefault();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, x: number, y: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTileClick(x, y);
    }
  };

  // Safety check: ensure grid is an array (after all hooks)
  if (!grid || !Array.isArray(grid) || grid.length === 0) {
    return (
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center" aria-label="map-container">
        <div className="text-gray-500" role="status" aria-live="polite">Loading map...</div>
      </div>
    );
  }

  // Get character image based on player level
  const getCharacterImage = (level: number) => {
    if (level >= 100) return '/images/character/god.png';
    if (level >= 90) return '/images/character/emperor.png';
    if (level >= 80) return '/images/character/king.png';
    if (level >= 70) return '/images/character/prince.png';
    if (level >= 60) return '/images/character/duke.png';
    if (level >= 50) return '/images/character/marquis.png';
    if (level >= 40) return '/images/character/count.png';
    if (level >= 30) return '/images/character/viscount.png';
    if (level >= 20) return '/images/character/baron.png';
    if (level >= 10) return '/images/character/knight.png';
    return '/images/character/squire.png';
  };

  return (
    <div className="relative w-full h-full overflow-hidden" aria-label="map-container">
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="text-white text-lg">Loading realm map...</div>
        </div>
      )}
      <div
        ref={gridRef}
        className="absolute inset-0 overflow-auto map-grid-scroll"
        aria-label="map-grid-scroll-area"
        style={{
          // Mobile-specific improvements
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          scrollBehavior: 'smooth'
        }}
        onTouchStart={handleTouchStart}
      >
        <div
          className="relative map-grid-container"
          style={{
            width: grid[0] ? `${grid[0].length * tileSize}px` : '0px',
            height: `${grid.length * tileSize}px`,
            display: 'grid',
            gridTemplateColumns: grid[0] ? `repeat(${grid[0].length}, ${tileSize}px)` : 'none',
            gridTemplateRows: `repeat(${grid.length}, ${tileSize}px)`,
            gap: '0px',
            // Mobile optimization
            minWidth: '100%',
            minHeight: '100%'
          }}
          aria-label="map-grid-container"
          role="grid"
        >
          {/* Living World Creature Layer */}
          <CreatureLayer grid={grid} mapType="realm" playerPosition={playerPosition} />

          {grid.map((row, y) => {
            if (!Array.isArray(row)) return null;
            return (
              <div key={`row-${y}`} role="row" aria-label={`map-row-${y}`} style={{ display: 'contents' }}>
                {row.map((tile, x) => {
                  if (!tile) return null;
                  return (
                    <div
                      key={tile.id || `${x}-${y}`}
                      className={`relative tile ${tile.type} ${tile.isVisited ? 'visited' : ''} ${tile.isMainTile ? 'main-tile' : ''}`}
                      style={{
                        transform: `rotate(${tile.rotation}deg)`,
                        cursor: 'pointer',
                        width: `${tileSize}px`,
                        height: `${tileSize}px`,
                        gridColumn: x + 1,
                        gridRow: y + 1,
                        // Mobile touch optimization
                        touchAction: 'manipulation'
                      }}
                      onClick={() => onTileClick(x, y)}
                      onKeyDown={(e) => handleKeyDown(e, x, y)}
                      role="gridcell"
                      tabIndex={0}
                      aria-label={`${tile.type} tile at position ${x},${y}${playerPosition.x === x && playerPosition.y === y ? ' - Character is here' : ''}${tile.hasMonster ? ` - Contains ${tile.hasMonster} monster` : ''}`}
                    >
                      <Image
                        src={getTileImage(tile.type)}
                        alt={tile.name || tile.type}
                        width={tileSize}
                        height={tileSize}
                        className="tile-image"
                        priority
                        onError={(e) => {
                          console.warn(`Failed to load tile image for ${tile.type}, using fallback`);
                          e.currentTarget.src = '/images/tiles/empty-tile.png';
                        }}
                        style={{
                          // Mobile optimization
                          objectFit: 'cover',
                          userSelect: 'none',
                          WebkitUserSelect: 'none'
                        }}
                      />
                      {playerPosition.x === x && playerPosition.y === y && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Image
                            src={getCharacterImage(playerLevel)}
                            alt="Character"
                            width={Math.floor(tileSize * 0.5)}
                            height={Math.floor(tileSize * 0.5)}
                            className="character-image"
                            priority
                            onError={(e) => {
                              console.warn('Failed to load character image, using fallback');
                              e.currentTarget.src = '/images/character/squire.png';
                            }}
                          />
                        </div>
                      )}
                      {/* Monster overlay */}
                      {tile.hasMonster && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Image
                            src={`/images/Monsters/${getMonsterImageName(tile.hasMonster)}.png`}
                            alt={`${tile.hasMonster} monster`}
                            width={Math.floor(tileSize * 0.6)}
                            height={Math.floor(tileSize * 0.6)}
                            className="monster-image"
                            priority
                            onError={(e) => {
                              console.warn(`Failed to load monster image for ${tile.hasMonster}`);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Animal Overlays - positioned within the grid container */}
        {/* Penguin - appears on ice tiles, disappears when caught */}
        {isPenguinPresent && penguinPos && !penguinCaught && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: `${penguinPos.x * tileSize + tileSize / 2}px`,
              top: `${penguinPos.y * tileSize + tileSize / 2}px`,
              width: `${tileSize * 3.2}px`,
              height: `${tileSize * 3.2}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <img
              src="/images/Animals/penguin.png"
              alt="Penguin"
              className="object-contain w-full h-full"
            />
          </div>
        )}

        {/* Horse - appears on grass tiles, disappears when caught */}
        {isHorsePresent && horsePos && !horseCaught && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: `${horsePos.x * tileSize + tileSize / 2}px`,
              top: `${horsePos.y * tileSize + tileSize / 2}px`,
              width: `${tileSize * 3.2}px`,
              height: `${tileSize * 3.2}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <img
              src="/images/Animals/horse.png"
              alt="Horse"
              className="object-contain w-full h-full"
            />
          </div>
        )}

        {/* Sheep - appears on grass tiles, disappears when caught */}
        {isSheepPresent && sheepPos && !sheepCaught && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: `${sheepPos.x * tileSize + tileSize / 2}px`,
              top: `${sheepPos.y * tileSize + tileSize / 2}px`,
              width: `${tileSize * 3.2}px`,
              height: `${tileSize * 3.2}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <img
              src="/images/Animals/sheep.png"
              alt="Sheep"
              className="object-contain w-full h-full"
            />
          </div>
        )}

        {/* Eagle - appears when available */}
        {eaglePos && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: `${eaglePos.x * tileSize + tileSize / 2}px`,
              top: `${eaglePos.y * tileSize + tileSize / 2}px`,
              width: `${tileSize * 3.2}px`,
              height: `${tileSize * 3.2}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <img
              src="/images/Animals/eagle.png"
              alt="Eagle"
              className="object-contain w-full h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default MapGrid; 