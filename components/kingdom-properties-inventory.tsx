import React, { useState } from "react";
import Image from "next/image";
import { Tile } from '@/types/tiles';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Hammer, Coins } from "lucide-react";

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
  levelRequired?: number | undefined; // Added for compatibility
}

interface KingdomPropertiesInventoryProps {
  open: boolean;
  onClose: () => void;
  tiles: PropertyTile[]; // Changed from Tile[]
  selectedTile: PropertyTile | null; // Changed from Tile | null
  setSelectedTile: (tile: PropertyTile | null) => void;
  onBuy?: (tile: PropertyTile, method: 'gold' | 'materials' | 'tokens') => void;
  onBuyToken?: () => void;
  inventory?: any[];
  tokens?: number;
  playerLevel?: number;
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
  playerLevel = 1
}: KingdomPropertiesInventoryProps) {
  const [activeTab, setActiveTab] = useState<'place' | 'buy'>('place');

  if (!open) return null;

  // Group tiles into "Owned" (Place) and "All" (Buy)
  // Logic: "Place" tab shows ONLY tiles where owned > 0.
  // "Buy" tab shows ALL tiles (or filterable?).

  // Mapping inventory counts to tile IDs
  const inventoryMap = new Map();
  (inventory || []).forEach(item => {
    // Normalize item IDs: 'house' vs 'house-tile'? 
    // Inventory items usually have IDs like 'house' or names.
    // We check both id and name for safety.
    inventoryMap.set(item.id, (inventoryMap.get(item.id) || 0) + (item.quantity || 0));
    if (item.name) inventoryMap.set(item.name.toLowerCase(), (inventoryMap.get(item.name.toLowerCase()) || 0) + (item.quantity || 0));
  });

  const getOwnedCount = (tile: PropertyTile) => {
    return inventoryMap.get(tile.id) || inventoryMap.get(tile.name.toLowerCase()) || 0;
  };

  const ownedTiles = tiles.filter(t => getOwnedCount(t) > 0);
  // Sort buyable tiles? Maybe filter out ones that can't be bought? 
  // For now show all in Buy tab.
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
                    mode="buy"
                    onAction={(method) => onBuy && onBuy(tile, method)}
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
function TileCard({ tile, owned, mode, onSelect, onAction }: {
  tile: PropertyTile;
  owned: number;
  mode: 'place' | 'buy';
  onSelect?: () => void;
  onAction?: (method: 'gold' | 'materials' | 'tokens') => void;
}) {
  const isPlaceMode = mode === 'place';
  const hasMaterialCost = tile.materialCost && tile.materialCost.length > 0;
  const hasTokenCost = tile.tokenCost && tile.tokenCost > 0;
  // If no cost specified, assume gold only (default behavior for old tiles)
  const goldCost = tile.cost || 0;

  // Determine displayed costs
  // Prioritize Materials > Tokens > Gold Only for "Type" label? No, show all options.

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 border-2 bg-[#0f1115]",
        isPlaceMode
          ? "border-amber-500/30 hover:border-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
          : "border-gray-800 hover:border-gray-600"
      )}
      onClick={isPlaceMode ? onSelect : undefined}
    >
      {/* Card Header Illustration */}
      <div className={cn("w-full aspect-[4/3] relative bg-[#1a1d24] p-4 flex items-center justify-center", isPlaceMode ? "bg-amber-900/10" : "")}>
        <Image
          src={tile.image}
          alt={tile.name}
          width={96}
          height={96}
          className="object-contain drop-shadow-lg transform transition-transform duration-300 group-hover:scale-110"
          unoptimized
        />

        {/* Owned Badge */}
        {owned > 0 && (
          <div className="absolute top-2 right-2 bg-green-600/90 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-sm border border-green-400/30">
            Owned: {owned}

            <div className="mt-auto pt-2 grid gap-2">
              {mode === 'place' ? (
                <div className="text-center text-xs text-amber-500/80 font-medium uppercase tracking-wider">
                  Click to Place
                </div>
              ) : (
                // Buy Actions
                <>
                  {/* Gold Buy */}
                  {(costGold > 0 || (!costMaterial && !costToken)) && (
                    <Button
                      size="sm"
                      className="w-full text-xs h-8 bg-amber-900/30 hover:bg-amber-600 border border-amber-800/50 text-amber-200"
                      onClick={(e) => { e.stopPropagation(); onAction?.('gold'); }}
                    >
                      Buy {costGold}g
                    </Button>
                  )}

                  {/* Material Buy */}
                  {costMaterial && (
                    <Button
                      size="sm"
                      className="w-full text-xs h-8 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300"
                      onClick={(e) => { e.stopPropagation(); onAction?.('materials'); }}
                      title={`Needs: ${costMaterial.map(m => `${m.quantity}x ${m.itemId}`).join(', ')}`}
                    >
                      Construct 🪵
                    </Button>
                  )}

                  {/* Token Buy */}
                  {costToken > 0 && (
                    <Button
                      size="sm"
                      className="w-full text-xs h-8 bg-purple-900/30 hover:bg-purple-600 border border-purple-800/50 text-purple-200"
                      onClick={(e) => { e.stopPropagation(); onAction?.('tokens'); }}
                    >
                      Redeem 🎟️
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
    </Card>
  )
} 