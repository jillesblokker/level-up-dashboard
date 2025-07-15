import React, { useState } from "react";
import Image from "next/image";
import { Tile } from '@/types/tiles';
import { cn } from '@/lib/utils';

interface KingdomGridProps {
  grid: Tile[][];
  onTilePlace: (x: number, y: number, tile: Tile) => void;
  selectedTile: Tile | null;
  setSelectedTile: (tile: Tile | null) => void;
  inventory: Tile[];
}

export function KingdomGrid({ grid, onTilePlace, selectedTile, setSelectedTile, inventory }: KingdomGridProps) {
  return (
    <div className="flex flex-col md:flex-row gap-8 w-full">
      {/* Grid */}
      <div className="flex flex-col items-center">
        <div className="grid grid-cols-6 gap-1" aria-label="thrivehaven-grid">
          {grid.map((row, y) =>
            row.map((tile, x) => (
              <button
                key={`${x}-${y}`}
                className={cn(
                  "relative w-16 h-16 md:w-20 md:h-20 border border-amber-800/30 bg-black/60 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500",
                  selectedTile && "ring-2 ring-amber-500"
                )}
                aria-label={tile.ariaLabel || tile.name || `Tile ${x},${y}`}
                onClick={() => selectedTile && onTilePlace(x, y, selectedTile)}
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
      {/* Inventory */}
      <div className="flex flex-col items-center gap-2" aria-label="kingdom-tile-inventory">
        <h3 className="text-lg font-bold text-amber-500 mb-2">Tile Inventory</h3>
        <div className="grid grid-cols-3 gap-2">
          {inventory.map(tile => (
            <button
              key={tile.id}
              className={cn(
                "w-16 h-16 md:w-20 md:h-20 border border-amber-800/30 bg-black/60 flex items-center justify-center focus:outline-none",
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