import React, { useState } from "react";
import Image from "next/image";
import { Tile } from '@/types/tiles';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Hammer, Coins, LayoutGrid } from "lucide-react";

// Define a compatible interface for tiles used in this component
interface PropertyTile {
  id: string;
  name: string;
  image: string;
  description?: string | undefined;
  cost?: number | undefined;
  tokenCost?: number | undefined;
  materialCost?: { itemId: string; quantity: number }[] | undefined;
  quantity?: number | undefined;
  levelRequired?: number | undefined;
  placedCount?: number | undefined; // Added to track count on map
}

interface KingdomPropertiesInventoryProps {
  open: boolean;
  onClose: () => void;
  tiles: PropertyTile[];
  selectedTile: PropertyTile | null;
  setSelectedTile: (tile: PropertyTile | null) => void;
  onBuy?: (tile: PropertyTile, method: 'gold' | 'materials' | 'tokens') => void;
  onBuyToken?: () => void;
  inventory?: any[];
  tokens?: number;
  playerLevel?: number;
  grid?: Tile[][]; // Added to calculate placed counts
}

export function KingdomPropertiesInventory({
  open,
  onClose,
  tiles,
  selectedTile,
  setSelectedTile,
  onBuy,
  onBuyToken,
  inventory = [],
  tokens = 0,
  playerLevel = 1,
  grid = []
}: KingdomPropertiesInventoryProps) {
  const [activeTab, setActiveTab] = useState<'place' | 'buy'>('place');

  if (!open) return null;

  // Group tiles into "Owned" (Place) and "All" (Buy)
  // Logic: "Place" tab shows ONLY tiles where owned > 0.
  // "Buy" tab shows ALL tiles (or filterable?).

  // Mapping inventory counts to tile IDs
  const inventoryMap = new Map<string, number>();
  (inventory || []).forEach(item => {
    // 1. Exact ID
    const quantity = item.quantity || 0;
    inventoryMap.set(item.id, (inventoryMap.get(item.id) || 0) + quantity);

    // 2. Normalized ID (lowercase)
    const lowerId = item.id.toLowerCase();
    if (lowerId !== item.id) {
      inventoryMap.set(lowerId, (inventoryMap.get(lowerId) || 0) + quantity);
    }

    // 3. ID without '-item' suffix
    if (lowerId.endsWith('-item')) {
      const cleanId = lowerId.replace('-item', '');
      inventoryMap.set(cleanId, (inventoryMap.get(cleanId) || 0) + quantity);
    }

    // 4. Name-based keys - only if different from ID to avoid double-counting
    if (item.name) {
      const lowerName = item.name.toLowerCase();
      const lowerId = item.id.toLowerCase();
      // Only add name-based key if it's different from the id
      if (lowerName !== lowerId && lowerName !== item.id) {
        inventoryMap.set(lowerName, (inventoryMap.get(lowerName) || 0) + quantity);
        // Also remove spaces for tighter matching - BUT only if different from original
        const nameNoSpace = lowerName.replace(/\s+/g, '');
        if (nameNoSpace !== lowerName && nameNoSpace !== lowerId) {
          inventoryMap.set(nameNoSpace, (inventoryMap.get(nameNoSpace) || 0) + quantity);
        }
      }
    }
  });

  // Calculate how many of each tile type are placed on the map
  const placedMap = new Map<string, number>();
  if (grid && grid.length > 0) {
    grid.flat().forEach(cell => {
      if (cell && cell.type && cell.type !== 'vacant' && cell.type !== 'empty') {
        const type = cell.type.toLowerCase();
        placedMap.set(type, (placedMap.get(type) || 0) + 1);
      }
    });
  }

  const getOwnedCount = (tile: PropertyTile) => {
    const exactId = tile.id;
    const lowerId = tile.id.toLowerCase();
    const nameKey = tile.name.toLowerCase();
    const nameNoSpace = nameKey.replace(/\s+/g, '');

    // Try all reasonable keys - use nullish coalescing to handle 0 correctly
    const exactCount = inventoryMap.get(exactId);
    if (exactCount !== undefined) return exactCount;

    const lowerCount = inventoryMap.get(lowerId);
    if (lowerCount !== undefined) return lowerCount;

    const nameCount = inventoryMap.get(nameKey);
    if (nameCount !== undefined) return nameCount;

    const noSpaceCount = inventoryMap.get(nameNoSpace);
    if (noSpaceCount !== undefined) return noSpaceCount;

    return 0;
  };

  const getPlacedCount = (tile: PropertyTile) => {
    const exactId = tile.id.toLowerCase();
    const nameKey = tile.name.toLowerCase().replace(/\s+/g, '');
    
    return placedMap.get(exactId) || placedMap.get(nameKey) || 0;
  };

  const ownedTiles = tiles.filter(t => {
    const count = getOwnedCount(t);
    return count > 0;
  });
  // Sort buyable tiles? Maybe filter out ones that can't be bought? 
  // For now show all in Buy tab.
  // Filter buyable tiles based on the selected tier
  const buyableTiles = tiles;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-[#0f1115] w-full max-w-xl h-full border-l border-amber-900/30 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-900/20 bg-[#13161b]">
          <div>
            <h2 className="text-3xl font-serif text-amber-400 tracking-wide mb-1">Properties</h2>
            <p className="text-amber-500/60 text-sm">Manage your kingdom&apos;s architecture</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-amber-500 hover:text-amber-300 hover:bg-amber-950/30 rounded-full h-10 w-10"
          >
            <span className="text-2xl">×</span>
          </Button>
        </div>

        {/* Currency Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0c10] border-b border-amber-900/20">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-medium text-lg">Build tokens:</span>
            <span className="text-2xl font-bold text-amber-400">{tokens}</span>
          </div>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-lg shadow-amber-900/20"
            onClick={onBuyToken}
          >
            Buy Token (1000g)
          </Button>
        </div>

        {/* Tabs & Content */}
        <Tabs defaultValue="place" className="flex-1 flex flex-col min-h-0" onValueChange={(v) => setActiveTab(v as any)}>
          <div className="px-6 py-4">
            <TabsList className="w-full grid grid-cols-2 bg-[#1a1d24] p-1 h-12 rounded-lg border border-amber-900/20">
              <TabsTrigger
                value="place"
                className="data-[state=active]:bg-[#2a2e37] data-[state=active]:text-amber-400 text-gray-400 font-medium text-base transition-all"
              >
                Place
              </TabsTrigger>
              <TabsTrigger
                value="buy"
                className="data-[state=active]:bg-[#2a2e37] data-[state=active]:text-amber-400 text-gray-400 font-medium text-base transition-all"
              >
                Buy
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 pb-6">
            <TabsContent value="place" className="mt-0">
              {ownedTiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 border border-dashed border-gray-700 rounded-xl bg-black/20">
                  <div className="w-16 h-16 bg-amber-900/20 rounded-full flex items-center justify-center mb-4 text-amber-700">
                    <Hammer size={32} />
                  </div>
                  <h3 className="text-xl font-medium text-amber-500/80 mb-2">No Properties Owned</h3>
                  <p className="max-w-xs text-sm">Visit the Buy tab to purchase properties for your kingdom.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 pb-8">
                  {ownedTiles.map(tile => (
                    <TileCard
                      key={tile.id}
                      tile={tile}
                      owned={getOwnedCount(tile)}
                      placedCount={getPlacedCount(tile)}
                      mode="place"
                      onSelect={() => {
                        setSelectedTile(tile);
                        onClose();
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="buy" className="mt-0">
              <div className="grid grid-cols-2 gap-4 pb-8">
                {tiles.map(tile => (
                  <TileCard
                    key={tile.id}
                    tile={tile}
                    owned={getOwnedCount(tile)}
                    placedCount={getPlacedCount(tile)}
                    mode="buy"
                    playerLevel={playerLevel}
                    onAction={(method) => onBuy && onBuy(tile, method)}
                    getMaterialCount={(itemId) => {
                      return inventoryMap.get(itemId) ||
                        inventoryMap.get(itemId.replace('material-', '')) ||
                        inventoryMap.get(`material-${itemId}`) || 0;
                    }}
                  />
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}

// Sub-component for individual cards
function TileCard({ tile, owned, placedCount, mode, playerLevel = 1, onSelect, onAction, getMaterialCount }: {
  tile: PropertyTile;
  owned: number;
  placedCount: number;
  mode: 'place' | 'buy';
  playerLevel?: number;
  onSelect?: () => void;
  onAction?: (method: 'gold' | 'materials' | 'tokens') => void;
  getMaterialCount?: (itemId: string) => number;
}) {
  // Special state: Affordable right now?
  const isAffordable = !isPlaceMode && !isLocked && (
    (hasTokenCost && tokens >= tokenCost) ||
    (!hasTokenCost && hasMaterialCost && tile.materialCost?.every(m => (getMaterialCount ? getMaterialCount(m.itemId) : 0) >= m.quantity)) ||
    (!hasTokenCost && !hasMaterialCost && goldCost > 0) // Just check gold if no materials/tokens
  );

  // New Unlock Badge: If levelRequired === playerLevel
  const isNewlyUnlocked = !isPlaceMode && tile.levelRequired === playerLevel;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 border-2 bg-[#0f1115] flex flex-col h-full",
        isPlaceMode
          ? "border-amber-500/30 hover:border-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
          : isLocked
            ? "border-gray-800 opacity-70 grayscale-[0.5]"
            : isAffordable
              ? "border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:border-emerald-400"
              : "border-gray-800 hover:border-gray-600"
      )}
      onClick={isPlaceMode ? onSelect : undefined}
    >
      {/* Card Header Illustration */}
      <div className={cn("w-full aspect-[4/3] relative bg-[#1a1d24] p-4 flex items-center justify-center shrink-0", isPlaceMode ? "bg-amber-900/10" : "")}>
        <Image
          src={tile.image}
          alt={tile.name}
          width={96}
          height={96}
          className={cn(
            "object-contain drop-shadow-lg transform transition-transform duration-300",
            !isLocked && "group-hover:scale-110",
            isLocked && "opacity-50 blur-[1px]"
          )}
          unoptimized
        />

        {/* 6. Newly Unlocked Badge */}
        {isNewlyUnlocked && (
          <div className="absolute top-0 left-0 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-br-lg shadow-lg z-30 uppercase animate-pulse">
            New Unlock
          </div>
        )}

        {/* 2. Affordability Flash */}
        {isAffordable && (
           <div className="absolute top-2 left-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg z-30 animate-bounce">
              <Hammer className="w-3 h-3" />
           </div>
        )}

        {/* Locked Overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <div className="bg-red-900/90 text-red-100 px-3 py-1 rounded-full text-xs font-bold border border-red-500/50 flex items-center gap-1 shadow-lg">
              <span>🔒 Lvl {tile.levelRequired}</span>
            </div>
          </div>
        )}

        {/* Available to Place Badge (Top Right) */}
        {owned - placedCount > 0 && (
          <div className="absolute top-2 right-2 bg-emerald-600 shadow-lg text-white text-[10px] uppercase font-black px-2 py-1 rounded-md border border-emerald-400/40 z-20 animate-pulse-subtle">
            Ready to Place: {owned - placedCount}
          </div>
        )}
        
        {/* Fully Placed Badge (Top Right) */}
        {owned > 0 && owned === placedCount && (
          <div className="absolute top-2 right-2 bg-zinc-700 text-zinc-300 text-[10px] uppercase font-bold px-2 py-1 rounded-md border border-zinc-600/50 z-20">
            All Placed
          </div>
        )}
... (rest of header section) ...
      </div>

      <CardContent className="p-3 flex-1 flex flex-col">
        <h3 className={cn("font-bold text-lg leading-tight mb-1 truncate font-medieval tracking-wide text-center", isLocked ? "text-gray-500" : "text-amber-100")}>
          {tile.name}
        </h3>

        {/* Owned vs Placed Summary (Very Clear) */}
... (Inventory Status bar) ...

        {/* Buy Mode Requirements */}
        {!isPlaceMode && (
          <div className="space-y-3 mt-auto">

            {/* Option 1: Construction (Gold + Materials) */}
            <div className={cn("bg-black/40 rounded-lg p-2 border border-white/5", isLocked && "opacity-50")}>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1 text-center">Construct</div>
              <div className="flex flex-col gap-1.5">
                {/* Gold Cost */}
                {(goldCost > 0 || (!hasMaterialCost && !hasTokenCost)) && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-500 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5" />
                      <span className="font-bold">{goldCost}g</span>
                    </span>
                  </div>
                )}

                {/* Material Costs + 7. Progress Bars */}
                {hasMaterialCost && tile.materialCost?.map((mat, idx) => {
                  const rawName = mat.itemId.replace('material-', '');
                  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
                  const count = getMaterialCount ? getMaterialCount(mat.itemId) : 0;
                  const isEnough = count >= mat.quantity;
                  const progressWidth = Math.min(100, (count / mat.quantity) * 100);

                  return (
                    <div key={idx} className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={cn("font-bold", isEnough ? "text-green-500" : "text-slate-400")}>
                          {mat.quantity}x {displayName}
                        </span>
                        {!isEnough && (
                          <span className="text-red-500/70 font-mono">
                            {count}/{mat.quantity}
                          </span>
                        )}
                        {isEnough && <Check className="w-2.5 h-2.5 text-green-500" />}
                      </div>
                      {!isEnough && (
                         <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-600/50" style={{ width: `${progressWidth}%` }} />
                         </div>
                      )}
                    </div>
                  );
                })}

                <Button
                  size="sm"
                  className={cn(
                    "w-full mt-1 border h-7 text-xs transition-all",
                    isAffordable 
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-lg shadow-emerald-900/40"
                      : "bg-amber-900/60 hover:bg-amber-800 text-amber-100 border-amber-800/50"
                  )}
                  onClick={(e) => { e.stopPropagation(); onAction?.(hasMaterialCost ? 'materials' : 'gold'); }}
                  disabled={isLocked}
                >
                  {isLocked ? 'Locked' : isAffordable ? 'Build Now' : 'Build'}
                </Button>
              </div>
            </div>
... (rest of buy option) ...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

            {/* Option 2: Token Redemption (if available) */}
            {hasTokenCost && (
              <div className={cn("bg-purple-900/20 rounded-lg p-2 border border-purple-500/20", isLocked && "opacity-50")}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] text-purple-300 uppercase tracking-widest font-bold">Fast Track</div>
                  <div className="text-purple-400 font-bold text-sm flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    {tokenCost}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-purple-700 hover:bg-purple-600 text-white h-7 text-xs border border-purple-500/40"
                  onClick={(e) => { e.stopPropagation(); onAction?.('tokens'); }}
                  disabled={isLocked}
                >
                  {isLocked ? 'Locked' : 'Redeem'}
                </Button>
              </div>
            )}

            {/* Fallback if no token cost and no materials (Tier 0 mostly) */}
            {!hasTokenCost && !hasMaterialCost && goldCost === 0 && (
              <div className="text-center text-[10px] text-gray-500 italic">
                Free Construction
              </div>
            )}

          </div>
        )}
      </CardContent>
    </Card>
  );
}