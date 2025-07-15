import React from "react";
import Image from "next/image";
import { Tile } from '@/types/tiles';
import { cn } from '@/lib/utils';

interface KingdomPropertiesInventoryProps {
  open: boolean;
  onClose: () => void;
  tiles: Tile[];
  selectedTile: Tile | null;
  setSelectedTile: (tile: Tile | null) => void;
}

export function KingdomPropertiesInventory({ open, onClose, tiles, selectedTile, setSelectedTile }: KingdomPropertiesInventoryProps) {
  const [activeTab, setActiveTab] = React.useState<'place'>('place');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true" aria-label="Properties overlay">
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full relative shadow-lg border border-amber-800/40">
        <button onClick={onClose} className="absolute top-4 right-4 text-amber-400 hover:text-amber-200 text-2xl bg-black/40 rounded-full w-10 h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500" aria-label="Close properties overlay">×</button>
        <div className="mb-4 flex items-center gap-4">
          <h3 className="text-2xl font-bold text-amber-400">Properties</h3>
          <div className="flex-1" />
          {/* Tabs for future extensibility */}
          <div className="flex gap-2">
            <button
              className={cn(
                "px-4 py-2 rounded font-semibold text-sm",
                activeTab === 'place' ? 'bg-amber-700 text-white' : 'bg-gray-800 text-amber-400',
                'focus:outline-none focus:ring-2 focus:ring-amber-500'
              )}
              onClick={() => setActiveTab('place')}
              aria-label="Show placeable tiles"
            >
              Place
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-2">
          {tiles.map(tile => (
            <button
              key={tile.id}
              className={cn(
                "relative flex flex-col items-center border border-amber-800/30 bg-black/60 rounded-lg p-2 cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500",
                selectedTile?.id === tile.id && "ring-2 ring-amber-500"
              )}
              aria-label={`Select ${tile.name}`}
              onClick={() => setSelectedTile(selectedTile?.id === tile.id ? null : tile)}
            >
              <div className="aspect-square w-20 h-20 relative mb-2">
                <Image
                  src={tile.image}
                  alt={tile.name}
                  fill
                  className="object-contain rounded"
                  draggable={false}
                />
              </div>
              <div className="text-sm font-semibold text-amber-300 text-center truncate w-full">{tile.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 