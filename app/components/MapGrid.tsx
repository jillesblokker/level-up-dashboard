import { useEffect, useRef, useState, memo } from "react";
import Image from "next/image";
import { Tile } from "@/types/tiles";
import { RotateCw } from "lucide-react";
import { CreatureLayer } from '@/components/creature-layer';
import { MonsterSpawn } from "@/types/monsters";

interface MapGridProps {
  grid: Tile[][];
  playerPosition: { x: number; y: number };
  onTileClick: (x: number, y: number) => void;
  className?: string;
  playerLevel?: number;
  onTileSizeChange?: (tileSize: number) => void;
  onTileRotate?: (x: number, y: number) => void;
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
  monsters?: MonsterSpawn[];
  onMonsterClick?: (monster: MonsterSpawn) => void;
}

const getTileImage = (tileType: string) => {
  switch (tileType) {
    case 'grass': return '/images/tiles/grass-tile.png';
    case 'forest': return '/images/tiles/forest-tile.png';
    case 'water': return '/images/tiles/water-tile.png';
    case 'mountain': return '/images/tiles/mountain-tile.png';
    case 'desert': return '/images/tiles/desert-tile.png';
    case 'ice': return '/images/tiles/ice-tile.png';
    case 'city': return '/images/tiles/city-tile.png';
    case 'town': return '/images/tiles/town-tile.png';
    case 'mystery': return '/images/tiles/mystery-tile.png';
    case 'portal-entrance': return '/images/tiles/portal-entrance-tile.png';
    case 'portal-exit': return '/images/tiles/portal-exit-tile.png';
    case 'cave': return '/images/tiles/cave-tile.png';
    case 'dungeon': return '/images/tiles/dungeon-tile.png';
    case 'castle': return '/images/tiles/castle-tile.png';
    case 'crossroad': return '/images/kingdom-tiles/Crossroad.png';
    case 'straightroad': return '/images/kingdom-tiles/Straightroad.png';
    case 'cornerroad': return '/images/kingdom-tiles/Cornerroad.png';
    case 'tsplitroad': return '/images/kingdom-tiles/Tsplitroad.png';
    default: return '/images/tiles/empty-tile.png';
  }
};

const getMonsterImageUrl = (monsterType: string) => {
  const type = monsterType.toLowerCase();
  switch (type) {
    case 'dragon': return '/images/Monsters/Dragoni.png';
    case 'goblin': return '/images/Monsters/Orci.png';
    case 'troll': return '/images/Monsters/Trollie.png';
    case 'wizard': return '/images/Monsters/Sorceror.png';
    case 'pegasus': return '/images/Monsters/Peggie.png';
    case 'fairy': return '/images/Monsters/Fairiel.png';
    default: return '/images/Monsters/Dragoni.png';
  }
};

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

// Optimized Tile Component
const MapTile = memo(({
  tile,
  x,
  y,
  tileSize,
  isPlayerHere,
  playerLevel,
  onTileClick,
  onTileRotate
}: {
  tile: Tile,
  x: number,
  y: number,
  tileSize: number,
  isPlayerHere: boolean,
  playerLevel: number,
  onTileClick: (x: number, y: number) => void,
  onTileRotate?: ((x: number, y: number) => void) | undefined
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTileClick(x, y);
    }
  };

  return (
    <div
      className={`relative tile ${tile.type} ${tile.isVisited ? 'visited' : ''} ${tile.isMainTile ? 'main-tile' : ''}`}
      style={{
        cursor: 'pointer',
        width: `${tileSize}px`,
        height: `${tileSize}px`,
        gridColumn: x + 1,
        gridRow: y + 1,
        touchAction: 'manipulation'
      }}
      onClick={() => onTileClick(x, y)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`${tile.type} tile at position ${x},${y}${isPlayerHere ? ' - Character is here' : ''}${tile.hasMonster ? ` - Contains ${tile.hasMonster} monster` : ''}`}
    >
      <Image
        src={tile.image || getTileImage(tile.type)}
        alt={tile.name || tile.type}
        width={tileSize}
        height={tileSize}
        className="tile-image"
        onError={(e) => {
          console.warn(`Failed to load tile image for ${tile.type}, using fallback`);
          e.currentTarget.src = '/images/tiles/empty-tile.png';
        }}
        style={{
          objectFit: 'cover',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          transform: `rotate(${tile.rotation || 0}deg)`,
          transition: 'transform 0.3s ease'
        }}
      />
      {isHovered && onTileRotate && !isPlayerHere && !tile.hasMonster && tile.type !== 'empty' && (
        <div className="absolute top-1 right-1 z-20">
          <div
            role="button"
            title="Rotate 90°"
            className="bg-amber-600 text-white p-1 rounded-full hover:bg-amber-700 shadow-md transform hover:scale-110 transition-transform cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onTileRotate(x, y);
            }}
          >
            <RotateCw className="w-3 h-3" />
          </div>
        </div>
      )}
      {isPlayerHere && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={getCharacterImage(playerLevel)}
            alt="Character"
            width={Math.floor(tileSize * 0.5)}
            height={Math.floor(tileSize * 0.5)}
            className="character-image"
            priority // Character always needs priority
            onError={(e) => {
              console.warn('Failed to load character image, using fallback');
              e.currentTarget.src = '/images/character/squire.png';
            }}
          />
        </div>
      )}
      {tile.hasMonster && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={getMonsterImageUrl(tile.hasMonster)}
            alt={`${tile.hasMonster} monster`}
            width={Math.floor(tileSize * 0.6)}
            height={Math.floor(tileSize * 0.6)}
            className="monster-image"
            onError={(e) => {
              console.warn(`Failed to load monster image for ${tile.hasMonster}`);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return prev.tile === next.tile &&
    prev.isPlayerHere === next.isPlayerHere &&
    prev.tileSize === next.tileSize &&
    prev.playerLevel === next.playerLevel;
});

MapTile.displayName = 'MapTile';

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
  penguinCaught = false,
  monsters = [],
  onMonsterClick,
  onTileRotate
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
      const newTileSize = Math.min(Math.max(tileSizeX, tileSizeY), 120);
      const finalTileSize = Math.max(newTileSize, 60);
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
    // e.preventDefault(); // Removed to allow scrolling
  };

  // Safety check: ensure grid is an array
  if (!grid || !Array.isArray(grid) || grid.length === 0) {
    return (
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center" aria-label="map-container">
        <div className="text-gray-500" role="status" aria-live="polite">Loading map...</div>
      </div>
    );
  }

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
          WebkitOverflowScrolling: 'touch',
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
            minWidth: '100%',
            minHeight: '100%'
          }}
          aria-label="map-grid-container"
        >
          {/* Living World Creature Layer */}
          <CreatureLayer grid={grid} mapType="realm" playerPosition={playerPosition} />

          {grid.map((row, y) => {
            if (!Array.isArray(row)) return null;
            return (
              <div key={`row-${y}`} aria-label={`map-row-${y}`} style={{ display: 'contents' }}>
                {row.map((tile, x) => {
                  if (!tile) return null;
                  return (
                    <MapTile
                      key={tile.id || `${x}-${y}`}
                      tile={tile}
                      x={x}
                      y={y}
                      tileSize={tileSize}
                      isPlayerHere={playerPosition.x === x && playerPosition.y === y}
                      playerLevel={playerLevel}
                      onTileClick={onTileClick}
                      onTileRotate={onTileRotate}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Animal Overlays */}
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
            <img src="/images/Animals/penguin.png" alt="Penguin" className="object-contain w-full h-full" />
          </div>
        )}

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
            <img src="/images/Animals/horse.png" alt="Horse" className="object-contain w-full h-full" />
          </div>
        )}

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
            <img src="/images/Animals/sheep.png" alt="Sheep" className="object-contain w-full h-full" />
          </div>
        )}

        {/* Monster Overlays */}
        {monsters && monsters.map(monster => (
          <div
            key={monster.id}
            className="absolute z-30 cursor-pointer hover:scale-110 transition-transform"
            style={{
              left: `${monster.x * tileSize}px`,
              top: `${monster.y * tileSize}px`,
              width: `${tileSize}px`,
              height: `${tileSize}px`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onMonsterClick?.(monster);
            }}
            role="button"
            aria-label={`Fight ${monster.monster_type}`}
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md animate-pulse"></div>
              <img
                src={getMonsterImageUrl(monster.monster_type)}
                alt={monster.monster_type}
                className="relative z-10 object-contain w-full h-full drop-shadow-md"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/creatures/Drakon.png';
                }}
              />

            </div>
          </div>
        ))}

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
            <img src="/images/Animals/eagle.png" alt="Eagle" className="object-contain w-full h-full" />
          </div>
        )}
      </div>
    </div>
  );
}

export default MapGrid;