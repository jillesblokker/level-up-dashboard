import React from "react";
import Image from "next/image";
import { Tile } from '@/types/tiles';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface KingdomPropertiesInventoryProps {
  open: boolean;
  onClose: () => void;
  tiles: Tile[];
  selectedTile: Tile | null;
  setSelectedTile: (tile: Tile | null) => void;
  onBuy?: (tile: Tile, method: 'gold' | 'materials' | 'tokens') => void;
  inventory?: any[]; // Allow generic inventory for now
  tokens?: number;
}

export function KingdomPropertiesInventory({ open, onClose, tiles, selectedTile, setSelectedTile, onBuy, inventory, tokens }: KingdomPropertiesInventoryProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true" aria-label="Properties overlay">
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full relative shadow-lg border border-amber-800/40">
        <button onClick={onClose} className="absolute top-4 right-4 text-amber-400 hover:text-amber-200 text-2xl bg-black/40 rounded-full w-10 h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500" aria-label="Close properties overlay">×</button>
        <div className="mb-4 flex items-center gap-4">
          <h3 className="text-2xl font-bold text-amber-400">Properties</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-2">
          {tiles.map(tile => {
            // Determine if accessible (example logic: always accessible for now, or check unlock)
            const isSelected = selectedTile?.id === tile.id;

            return (
              <button
                key={tile.id}
                className={cn(
                  "relative flex flex-col items-center border border-amber-800/30 bg-black/60 rounded-lg p-2 cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500",
                  isSelected && "ring-2 ring-amber-500 bg-amber-900/20"
                )}
                aria-label={`Select ${tile.name}`}
                onClick={() => setSelectedTile(isSelected ? null : tile)}
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
                <div className="text-sm font-semibold text-amber-300 text-center truncate w-full">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate">{tile.name}</span>
                    </TooltipTrigger>
                    <TooltipContent>{tile.name}</TooltipContent>
                  </Tooltip>
                </div>

                {/* Cost Indicators (Mini) */}
                <div className="flex gap-1 mt-1 justify-center">
                  {tile.materialCost && tile.materialCost.length > 0 && (
                    <span className="text-[10px] text-amber-200 bg-amber-900/40 px-1 rounded flex items-center gap-0.5" title="Material Cost">
                      🪵
                    </span>
                  )}
                  {tile.tokenCost !== undefined && tile.tokenCost > 0 && (
                    <span className="text-[10px] text-purple-300 bg-purple-900/40 px-1 rounded flex items-center gap-0.5" title="Token Cost">
                      🎟️ {tile.tokenCost}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Detail / Purchase Panel */}
        {selectedTile && (
          <div className="mt-4 p-4 bg-black/40 rounded border border-amber-800/30 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 relative border border-amber-700/50 rounded bg-black/50">
                  <Image src={selectedTile.image} alt={selectedTile.name} fill className="object-contain p-1" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-amber-100">{selectedTile.name}</h4>
                  <p className="text-xs text-amber-400/70 max-w-[200px]">{selectedTile.description}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto">
                {/* Construct Button (Materials) */}
                {(selectedTile.materialCost?.length ?? 0) > 0 ? (
                  <button
                    onClick={() => onBuy?.(selectedTile!, 'materials')}
                    className="flex items-center justify-between gap-3 bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 text-amber-100 px-4 py-2 rounded text-sm transition-colors group"
                  >
                    <span className="font-semibold group-hover:text-white">Construct</span>
                    <div className="flex items-center gap-2 text-xs text-amber-300">
                      {selectedTile.materialCost?.map((cost: any, i: number) => (
                        <span key={i} className="flex items-center gap-1">
                          {/* TODO: Icon lookup based on cost.itemId */}
                          {cost.itemId.includes('logs') ? '🪵' : cost.itemId.includes('planks') ? '🪚' : cost.itemId.includes('stone') ? '🪨' : '📦'}
                          {cost.quantity}
                        </span>
                      ))}
                    </div>
                  </button>
                ) : (
                  // Gold only (Tier 0)
                  <button
                    onClick={() => onBuy?.(selectedTile!, 'gold')}
                    className="flex items-center justify-between gap-3 bg-yellow-900/40 hover:bg-yellow-800/60 border border-yellow-700/50 text-yellow-100 px-4 py-2 rounded text-sm transition-colors"
                  >
                    <span className="font-semibold">Buy with Gold</span>
                    <span className="text-yellow-400">💰 {selectedTile.cost || 100}</span>
                  </button>
                )}

                {/* Redeem Button (Tokens) */}
                {selectedTile.tokenCost !== undefined && selectedTile.tokenCost > 0 && (
                  <button
                    onClick={() => onBuy?.(selectedTile!, 'tokens')}
                    className="flex items-center justify-between gap-3 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 text-purple-100 px-4 py-2 rounded text-sm transition-colors group"
                  >
                    <span className="font-semibold group-hover:text-white">Redeem</span>
                    <span className="flex items-center gap-1 text-purple-300">
                      🎟️ {selectedTile.tokenCost} Token{selectedTile.tokenCost > 1 ? 's' : ''}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 