import React from "react";
import Image from "next/image";
import { Tile } from '@/types/tiles';
import { cn } from '@/lib/utils';
import { useEffect, useCallback, useState } from 'react';

interface KingdomGridProps {
  grid: Tile[][];
  onTilePlace: (x: number, y: number, tile: Tile) => void;
  selectedTile: Tile | null;
  setSelectedTile: (tile: Tile | null) => void;
}

export function KingdomGrid({ grid, onTilePlace, selectedTile, setSelectedTile }: KingdomGridProps) {
  const wallImage = '/images/kingdom-tiles/Wall.png';
  const wallTile = {
    image: wallImage,
    name: 'Wall',
    ariaLabel: 'Wall tile',
    id: 'wall',
  };
  const [propertiesOpen, setPropertiesOpen] = React.useState(false);

  // Add state for build tokens and property inventory
  const [buildTokens, setBuildTokens] = useState(() => {
    if (typeof window !== 'undefined') {
      const stats = JSON.parse(localStorage.getItem('character-stats') || '{}');
      return stats.buildTokens || 0;
    }
    return 0;
  });
  const [propertyInventory, setPropertyInventory] = useState<Tile[]>(() => {
    // You may want to pass this as a prop from the parent, but for now, initialize here
    // (You can refactor to lift state up if needed)
    return [];
  });

  // Handler for buying a property tile
  const handleBuyProperty = (tile: Tile) => {
    if (buildTokens < (tile.cost || 1)) return;
    setBuildTokens((prev: number) => {
      const newTokens = prev - (tile.cost || 1);
      if (typeof window !== 'undefined') {
        const stats = JSON.parse(localStorage.getItem('character-stats') || '{}');
        stats.buildTokens = newTokens;
        localStorage.setItem('character-stats', JSON.stringify(stats));
      }
      return newTokens;
    });
    setPropertyInventory((prev) => prev.map(t => t.id === tile.id ? { ...t, quantity: (t.quantity || 0) + 1 } : t));
  };

  // Keyboard shortcut for opening properties
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        setPropertiesOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- WALL BORDER LOGIC ---
  const renderGridWithWall = () => {
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    const fullRows = rows + 2;
    const fullCols = cols + 2;
    return (
      <div
        className="grid gap-0"
        style={{
          gridTemplateColumns: `repeat(${fullCols}, 1fr)`,
          gridTemplateRows: `repeat(${fullRows}, 1fr)`,
          width: '100%',
          height: '100%',
          aspectRatio: '1/1',
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
                    unoptimized
                  />
                </div>
              );
            }
            // Otherwise, render the actual grid tile
            const tile = grid[y - 1]?.[x - 1];
            if (!tile) {
              return <div key={`empty-${x - 1}-${y - 1}`} className="w-full h-full aspect-square bg-black/40" />;
            }
            return (
              <button
                key={`tile-${x - 1}-${y - 1}`}
                className={cn(
                  "relative w-full h-full aspect-square bg-black/60 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500",
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
                  className="object-cover"
                  draggable={false}
                  unoptimized
                  onError={(e) => { e.currentTarget.src = '/images/placeholders/item-placeholder.svg'; }}
                />
              </button>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center" style={{ padding: 0, margin: 0 }}>
      <div className="w-full flex justify-end mb-2">
        <button
          className="bg-amber-700 text-white px-4 py-2 rounded shadow hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Open properties panel"
          onClick={() => setPropertiesOpen(true)}
        >
          Properties
        </button>
      </div>
      <div className="w-full h-full flex items-center justify-center">
        {renderGridWithWall()}
      </div>
      {/* Side panel for properties */}
      {propertiesOpen && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-gray-900 z-50 shadow-lg border-l border-amber-800/40 flex flex-col" role="dialog" aria-modal="true" aria-label="Properties side panel">
          <div className="flex justify-between items-center p-4 border-b border-amber-800/20">
            <h3 className="text-2xl font-bold text-amber-400">Properties</h3>
            <button onClick={() => setPropertiesOpen(false)} className="text-amber-400 hover:text-amber-200 text-2xl bg-black/40 rounded-full w-10 h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500" aria-label="Close properties panel">×</button>
          </div>
          <div className="px-4 pt-2 pb-0">
            <div className="text-lg font-bold text-amber-300 mb-2">Build Tokens: <span className="text-amber-400">{buildTokens}</span></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-4">
              {propertyInventory.map(tile => (
                <div key={tile.id} className="relative flex flex-col items-center border border-amber-800/30 bg-black/60 rounded-lg p-2">
                  <div className="aspect-square w-20 h-20 relative mb-2">
                    <Image
                      src={tile.image}
                      alt={tile.name}
                      fill
                      className="object-contain rounded"
                      draggable={false}
                      unoptimized
                      onError={(e) => { e.currentTarget.src = '/images/placeholders/item-placeholder.svg'; }}
                    />
                  </div>
                  <div className="text-sm font-semibold text-amber-300 text-center truncate w-full mb-1">{tile.name}</div>
                  <div className="text-xs text-amber-200 mb-1">Cost: <span className="font-bold">{tile.cost}</span> 🏗️</div>
                  <div className="text-xs text-amber-200 mb-2">Owned: <span className="font-bold">{tile.quantity || 0}</span></div>
                  <button
                    className="bg-amber-700 text-white px-2 py-1 rounded shadow hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs disabled:opacity-50"
                    aria-label={`Buy ${tile.name}`}
                    disabled={buildTokens < (tile.cost || 1)}
                    onClick={() => handleBuyProperty(tile)}
                  >
                    Buy
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
                unoptimized
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 