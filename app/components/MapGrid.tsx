import { useEffect, useRef } from "react";
import Image from "next/image";
import { Tile } from "@/types/tiles";

interface MapGridProps {
  grid: Tile[][];
  playerPosition: { x: number; y: number };
  onTileClick: (x: number, y: number) => void;
  className?: string;
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

export function MapGrid({ grid, playerPosition, onTileClick }: MapGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const handlePan = (dx: number, dy: number) => {
    if (!gridRef.current) return;

    const tileSize = 64;
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
  }, [playerPosition.x, playerPosition.y]);

  return (
    <div className="relative w-full h-[calc(100vh-8rem)] overflow-hidden rounded-lg border border-amber-800/20" aria-label="map-container">
      <div
        ref={gridRef}
        className="absolute inset-0 overflow-auto map-grid-scroll"
        aria-label="map-grid-scroll-area"
      >
        <div 
          className="relative map-grid-container" 
          style={{ 
            width: grid[0] ? `${grid[0].length * 64}px` : '0px',
            height: `${grid.length * 64}px`,
            display: 'grid',
            gridTemplateColumns: grid[0] ? `repeat(${grid[0].length}, 64px)` : 'none',
            gridTemplateRows: `repeat(${grid.length}, 64px)`,
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
                    width: '64px',
                    height: '64px',
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
                    width={64}
                    height={64}
                    className="tile-image"
                    priority
                  />
                  {playerPosition.x === x && playerPosition.y === y && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image
                        src="/images/character.png"
                        alt="Character"
                        width={32}
                        height={32}
                        className="character-image"
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