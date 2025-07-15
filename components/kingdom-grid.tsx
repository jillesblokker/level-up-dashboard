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
  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="grid grid-cols-6 gap-1 w-full h-full" aria-label="thrivehaven-grid" style={{ aspectRatio: '1 / 1', maxWidth: '100vw', maxHeight: '100vw' }}>
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
              style={{ minWidth: 0, minHeight: 0 }}
            >
              <Image
                src={tile.image}
                alt={tile.name}
                fill
                className="object-contain rounded"
                draggable={false}
              />
            </button>
          ))
        )}
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