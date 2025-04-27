import { Position } from "@/types/game";
import { Tile, TileItem } from "@/types/tiles";
import { useEffect, useRef, useState } from "react";
import { Minimap } from "./Minimap";

export interface MapGridProps {
  grid: Tile[][];
  character: Position;
  onCharacterMove: (newX: number, newY: number) => void;
  onTileClick: (x: number, y: number) => Promise<void>;
  selectedTile: TileItem | null;
  onGridUpdate: (newGrid: Tile[][]) => void;
  isMovementMode: boolean;
  onDiscovery: (message: string) => void;
  onTilePlaced: (tile: TileItem) => void;
  onHover: (tile: Tile | null) => void;
  onHoverEnd: () => void;
  hoveredTile: Tile | null;
  zoomLevel: number;
  onDeleteTile: (x: number, y: number) => void;
  showMinimap: boolean;
}

const MapGrid: React.FC<MapGridProps> = ({
  grid,
  character,
  onCharacterMove,
  onTileClick,
  selectedTile,
  onGridUpdate,
  isMovementMode,
  onDiscovery,
  onTilePlaced,
  onHover,
  onHoverEnd,
  hoveredTile,
  zoomLevel,
  onDeleteTile,
  showMinimap
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });

  const handlePan = (position: Position) => {
    if (!gridRef.current) return;

    const tileSize = 64 * zoomLevel;
    const containerWidth = gridRef.current.clientWidth;
    const containerHeight = gridRef.current.clientHeight;

    // Calculate the new scroll position
    const newX = position.x * tileSize - containerWidth / 2;
    const newY = position.y * tileSize - containerHeight / 2;

    // Update viewport offset
    setViewportOffset({ x: newX, y: newY });

    // Scroll the grid container
    gridRef.current.scrollTo({
      left: newX,
      top: newY,
      behavior: 'smooth'
    });
  };

  // Keep character in view when moving
  useEffect(() => {
    if (isMovementMode && gridRef.current) {
      handlePan({ x: character.x, y: character.y });
    }
  }, [character.x, character.y, isMovementMode]);

  return (
    <div className="relative w-full h-[calc(100vh-8rem)] overflow-hidden rounded-lg border border-amber-800/20" aria-label="map-container">
      <div
        ref={gridRef}
        className="absolute inset-0 overflow-auto"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: '0 0',
        }}
        aria-label="map-grid-scroll-area"
      >
        <div className="relative" style={{ width: grid[0].length * 64, height: grid.length * 64 }}>
          {grid.map((row, y) =>
            row.map((tile, x) => (
              <div
                key={`tile-${x}-${y}`}
                className={`absolute border border-amber-800/20 ${
                  hoveredTile?.x === x && hoveredTile?.y === y ? 'ring-2 ring-amber-500' : ''
                } ${tile.type === 'empty' && selectedTile ? 'cursor-cell hover:bg-amber-500/10' : ''}`}
                style={{
                  width: 64,
                  height: 64,
                  left: x * 64,
                  top: y * 64,
                  cursor: isMovementMode ? 'pointer' : selectedTile ? 'cell' : 'default'
                }}
                onClick={() => onTileClick(x, y)}
                onMouseEnter={() => onHover(tile)}
                onMouseLeave={onHoverEnd}
                aria-label={`map-tile-${x}-${y}`}
              >
                {/* Tile content */}
                {tile.type !== 'empty' && (
                  <div className="w-full h-full bg-amber-500/10" />
                )}
                {character.x === x && character.y === y && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" aria-label="character-marker" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {showMinimap && (
        <Minimap
          gridSize={grid.length}
          characterPosition={character}
          onPan={handlePan}
          tileSize={8}
        />
      )}
    </div>
  );
};

export default MapGrid; 