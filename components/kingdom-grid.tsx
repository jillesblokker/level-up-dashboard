import React from "react";
import Image from "next/image";
import { Tile } from '@/types/tiles';
import { cn } from '@/lib/utils';

interface KingdomGridProps {
  grid: Tile[][];
  onTilePlace: (x: number, y: number, tile: Tile) => void;
  selectedTile: Tile | null;
  setSelectedTile: (tile: Tile | null) => void;
}

export function KingdomGrid({ grid, onTilePlace, selectedTile, setSelectedTile }: KingdomGridProps) {
  const wallImage = '/images/kingdom-tiles/Wall.png';
  const gridCols = grid[0]?.length || 6;
  const gridRows = grid.length;
  // Wall size is 1/4 of a tile, so if grid is 6x6, wall is 1/24 of the grid width/height
  const wallFrac = 1 / (gridCols + 0.5); // 0.5 for two 1/4 walls
  const wallPercent = `${(100 * wallFrac * 0.25).toFixed(2)}%`;
  // --- WALL BORDER LOGIC ---
  // We want a border of wall tiles (mini tiles) around the grid, so the grid is surrounded by a full row/column of wall tiles on each side.
  // We'll render a (N+2)x(N+2) grid, where the outermost tiles are wall tiles, and the inner N x N are the actual grid tiles.
  const wallTile = {
    image: wallImage,
    name: 'Wall',
    ariaLabel: 'Wall tile',
    id: 'wall',
  };
  const renderGridWithWall = () => {
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    const fullRows = rows + 2;
    const fullCols = cols + 2;
    return (
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${fullCols}, 1fr)`,
          gridTemplateRows: `repeat(${fullRows}, 1fr)`,
          width: '100%',
          height: '100%',
          aspectRatio: '1/1',
          gap: 0,
          background: 'none',
        }}
        aria-label="thrivehaven-grid"
      >
        {Array.from({ length: fullRows }).map((_, y) =>
          Array.from({ length: fullCols }).map((_, x) => {
            // If on the border, render wall tile
            if (y === 0 || y === fullRows - 1 || x === 0 || x === fullCols - 1) {
              return (
                <div key={`wall-${x}-${y}`} className="relative w-full h-full aspect-square" style={{ minWidth: 0, minHeight: 0, borderRadius: 0, margin: 0, padding: 0 }}>
                  <Image
                    src={wallTile.image}
                    alt={wallTile.name}
                    fill
                    className="object-cover"
                    draggable={false}
                  />
                </div>
              );
            }
            // Otherwise, render the actual grid tile
            const tile = grid[y - 1]?.[x - 1];
            if (!tile) {
              // Fallback: render an empty div if tile is undefined
              return <div key={`empty-${x - 1}-${y - 1}`} className="w-full h-full aspect-square bg-black/40" />;
            }
            return (
              <button
                key={`tile-${x - 1}-${y - 1}`}
                className={cn(
                  "relative w-full h-full aspect-square border border-amber-800/30 bg-black/60 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500",
                  selectedTile && "ring-2 ring-amber-500"
                )}
                aria-label={tile.ariaLabel || tile.name || `Tile ${x - 1},${y - 1}`}
                onClick={() => selectedTile && onTilePlace(x - 1, y - 1, selectedTile)}
                style={{ minWidth: 0, minHeight: 0, borderRadius: 0, margin: 0, padding: 0 }}
              >
                <Image
                  src={tile.image}
                  alt={tile.name}
                  fill
                  className="object-contain"
                  draggable={false}
                />
              </button>
            );
          })
        )}
      </div>
    );
  };
  return (
    <div className="w-full h-full flex items-center justify-center bg-neutral-900" style={{ padding: 0, margin: 0 }}>
      {renderGridWithWall()}
    </div>
  );
}

interface PropertiesOverlayProps {
  open: boolean;
  onClose: () => void;
  inventory: Tile[];
  selectedTile: Tile | null;
  setSelectedTile: (tile: Tile | null) => void;
}

export function PropertiesOverlay({ open, onClose, inventory, selectedTile, setSelectedTile }: PropertiesOverlayProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true" aria-label="Properties overlay">
      <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-amber-400 hover:text-amber-200 text-2xl" aria-label="Close properties overlay">×</button>
        <h3 className="text-lg font-bold text-amber-500 mb-4">Properties</h3>
        <div className="grid grid-cols-3 gap-4">
          {inventory.map(tile => (
            <button
              key={tile.id}
              className={cn(
                "w-20 h-20 border border-amber-800/30 bg-black/60 flex items-center justify-center focus:outline-none",
                selectedTile?.id === tile.id && "ring-2 ring-amber-500"
              )}
              aria-label={`Select ${tile.name}`}
              onClick={() => setSelectedTile(tile)}
            >
              <Image
                src={tile.image}
                alt={tile.name}
                fill
                className="object-contain rounded"
                draggable={false}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 