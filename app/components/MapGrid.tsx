import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Tile } from "@/types/tiles";

interface MapGridProps {
  grid: Tile[][];
  playerPosition: { x: number; y: number };
  onTileClick: (x: number, y: number) => void;
  className?: string;
  playerLevel?: number;
  onTileSizeChange?: (tileSize: number) => void;
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

export function MapGrid({ grid, playerPosition, onTileClick, playerLevel = 0, onTileSizeChange }: MapGridProps) {
    const gridRef = useRef<HTMLDivElement>(null);
    const [tileSize, setTileSize] = useState(80);

    // Debug logging
    console.log('[MapGrid] Received grid:', grid);
    console.log('[MapGrid] Grid type:', typeof grid);
    console.log('[MapGrid] Grid is array:', Array.isArray(grid));
    console.log('[MapGrid] Grid length:', grid?.length);
    console.log('[MapGrid] First row:', grid?.[0]);
    console.log('[MapGrid] Player position:', playerPosition);

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

  // Safety check: ensure grid is an array (after all hooks)
  if (!grid || !Array.isArray(grid) || grid.length === 0) {
    return (
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center" aria-label="map-container">
        <div className="text-gray-500">Loading map...</div>
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
      <div
        ref={gridRef}
        className="absolute inset-0 overflow-auto map-grid-scroll"
        aria-label="map-grid-scroll-area"
      >
        <div
          className="relative map-grid-container"
          style={{
            width: grid[0] ? `${grid[0].length * tileSize}px` : '0px',
            height: `${grid.length * tileSize}px`,
            display: 'grid',
            gridTemplateColumns: grid[0] ? `repeat(${grid[0].length}, ${tileSize}px)` : 'none',
            gridTemplateRows: `repeat(${grid.length}, ${tileSize}px)`,
            gap: '0px'
          }}
          aria-label="map-grid-container"
          role="grid"
        >
          {grid.map((row, y) => (
            <div key={`row-${y}`} role="row" aria-label={`map-row-${y}`} style={{ display: 'contents' }}>
              {row.map((tile, x) => (
                <div
                  key={tile.id}
                  className={`relative tile ${tile.type} ${tile.isVisited ? 'visited' : ''} ${tile.isMainTile ? 'main-tile' : ''}`}
                  style={{
                    transform: `rotate(${tile.rotation}deg)`,
                    cursor: 'pointer',
                    width: `${tileSize}px`,
                    height: `${tileSize}px`,
                    gridColumn: x + 1,
                    gridRow: y + 1
                  }}
                  onClick={() => onTileClick(x, y)}
                  role="gridcell"
                  aria-label={`${tile.type} tile at position ${x},${y}`}
                >
                  <Image
                    src={getTileImage(tile.type)}
                    alt={tile.name}
                    width={tileSize}
                    height={tileSize}
                    className="tile-image"
                    priority
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
                      />
                    </div>
                  )}
                  {/* Monster overlay */}
                  {tile.hasMonster && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image
                        src={`/images/Monsters/${tile.hasMonster === 'wizard' ? 'Sorceror' : tile.hasMonster}.png`}
                        alt={`${tile.hasMonster} monster`}
                        width={Math.floor(tileSize * 0.6)}
                        height={Math.floor(tileSize * 0.6)}
                        className="monster-image"
                        priority
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MapGrid; 