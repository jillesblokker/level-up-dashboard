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
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-neutral-900" style={{ padding: 0, margin: 0 }}>
      {/* Top wall */}
      <div className="flex" style={{ width: `calc(100% - 2 * ${wallPercent})`, height: wallPercent, marginLeft: wallPercent, marginRight: wallPercent }}>
        {Array.from({ length: gridCols }).map((_, i) => (
          <div key={`wall-top-${i}`} style={{ flex: 1, aspectRatio: '1/1', backgroundImage: `url(${wallImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
        ))}
      </div>
      <div className="flex w-full h-full" style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        {/* Left wall */}
        <div className="flex flex-col" style={{ width: wallPercent, height: '100%' }}>
          {Array.from({ length: gridRows }).map((_, i) => (
            <div key={`wall-left-${i}`} style={{ flex: 1, aspectRatio: '1/1', backgroundImage: `url(${wallImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
          ))}
        </div>
        {/* Grid */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${gridRows}, 1fr)`,
            width: `calc(100% - 2 * ${wallPercent})`,
            height: `calc(100% - 2 * ${wallPercent})`,
            aspectRatio: '1/1',
            minWidth: 0,
            minHeight: 0,
            gap: 0,
            background: 'none',
          }}
          aria-label="thrivehaven-grid"
        >
          {grid.map((row, y) =>
            row.map((tile, x) => (
              <button
                key={`${x}-${y}`}
                className={cn(
                  "relative w-full h-full aspect-square border border-amber-800/30 bg-black/60 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500",
                  selectedTile && "ring-2 ring-amber-500"
                )}
                aria-label={tile.ariaLabel || tile.name || `Tile ${x},${y}`}
                onClick={() => selectedTile && onTilePlace(x, y, selectedTile)}
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
            ))
          )}
        </div>
        {/* Right wall */}
        <div className="flex flex-col" style={{ width: wallPercent, height: '100%' }}>
          {Array.from({ length: gridRows }).map((_, i) => (
            <div key={`wall-right-${i}`} style={{ flex: 1, aspectRatio: '1/1', backgroundImage: `url(${wallImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
          ))}
        </div>
      </div>
      {/* Bottom wall */}
      <div className="flex" style={{ width: `calc(100% - 2 * ${wallPercent})`, height: wallPercent, marginLeft: wallPercent, marginRight: wallPercent }}>
        {Array.from({ length: gridCols }).map((_, i) => (
          <div key={`wall-bottom-${i}`} style={{ flex: 1, aspectRatio: '1/1', backgroundImage: `url(${wallImage})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} />
        ))}
      </div>
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