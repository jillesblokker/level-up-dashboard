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

interface KingdomPropertiesInventoryProps {
  open: boolean;
  onClose: () => void;
  tiles: Tile[];
  selectedTile: Tile | null;
  setSelectedTile: (tile: Tile | null) => void;
  onBuy?: (tile: Tile, method: 'gold' | 'materials' | 'tokens') => void;
  onBuyToken?: () => void;
  inventory?: any[];
  tokens?: number;
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
  tokens = 0
}: KingdomPropertiesInventoryProps) {
  const [activeTab, setActiveTab] = useState<'place' | 'buy'>('place');

  if (!open) return null;

  // Group tiles into "Owned" (Place) and "All" (Buy)
  // Logic: "Place" tab shows ONLY tiles where owned > 0.
  // "Buy" tab shows ALL tiles (or filterable?).

  // Mapping inventory counts to tile IDs
  const inventoryMap = new Map();
  inventory.forEach(item => {
    // Normalize item IDs: 'house' vs 'house-tile'? 
    // Inventory items usually have IDs like 'house' or names.
    // We check both id and name for safety.
    inventoryMap.set(item.id, (inventoryMap.get(item.id) || 0) + (item.quantity || 0));
    if (item.name) inventoryMap.set(item.name.toLowerCase(), (inventoryMap.get(item.name.toLowerCase()) || 0) + (item.quantity || 0));
  });

  const getOwnedCount = (tile: Tile) => {
    return inventoryMap.get(tile.id) || inventoryMap.get(tile.name.toLowerCase()) || 0;
  };

  const ownedTiles = tiles.filter(t => getOwnedCount(t) > 0);
  // Sort buyable tiles? Maybe filter out ones that can't be bought? 
  // For now show all in Buy tab.
  const buyableTiles = tiles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="bg-[#0f1115] rounded-xl w-full max-w-4xl h-[85vh] flex flex-col border border-amber-900/30 shadow-2xl overflow-hidden relative">

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
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 bg-amber-900/20 rounded-full flex items-center justify-center mb-4 text-amber-700">
                    <Hammer size={32} />
                  </div>
                  <h3 className="text-xl font-medium text-gray-400 mb-2">No Properties Owned</h3>
                  <p className="text-gray-500 max-w-xs">Visit the Buy tab to purchase properties for your kingdom.</p>
                  <Button
                    variant="link"
                    className="text-amber-500 mt-4"
                    onClick={() => document.getElementById('tab-buy')?.click()} // Hacky but works if we controlled plain state, better to use state
                  >
                    Go to Shop
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {ownedTiles.map(tile => (
                    <TileCard
                      key={tile.id}
                      tile={tile}
                      owned={getOwnedCount(tile)}
                      mode="place"
                      onSelect={() => {
                        setSelectedTile(tile);
                        onClose(); // Close to place immediately? Or keep open? User preference. Usually 'Place' implies selecting it for placement tool.
                        // Assuming parent handles 'gameMode' switch on select.
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="buy" className="mt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {buyableTiles.map(tile => (
                  <TileCard
                    key={tile.id}
                    tile={tile}
                    owned={getOwnedCount(tile)}
                    mode="buy"
                    onAction={(method) => onBuy?.(tile, method)}
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
  tile: Tile;
  owned: number;
  mode: 'place' | 'buy';
  onSelect?: () => void;
  onAction?: (method: 'gold' | 'materials' | 'tokens') => void;
}) {
  // Determine cost display
  const costGold = tile.cost || 0;
  const costMaterial = tile.materialCost?.length ? tile.materialCost : null;
  const costToken = tile.tokenCost || 0;

  return (
    <Card
      className="bg-[#1e2229] border-amber-900/30 hover:border-amber-500/50 transition-all duration-200 group overflow-hidden flex flex-col h-full cursor-pointer hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1"
      onClick={mode === 'place' ? onSelect : undefined}
    >
      <div className="relative aspect-square w-full bg-[#15181e] p-4 flex items-center justify-center">
        {/* Image */}
        <div className="relative w-full h-full">
          <Image
            src={tile.image}
            alt={tile.name}
            fill
            className="object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        {/* Badges */}
        <div className="absolute top-2 right-2">
          <Badge className={cn("bg-black/60 backdrop-blur border border-white/10 text-xs", owned > 0 ? "text-green-400" : "text-gray-500")}>
            Owned: {owned}
          </Badge>
        </div>

        {/* Cost Badge (Top Left) - Only for Buy mode */}
        {mode === 'buy' && (
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            {costGold > 0 && (
              <Badge className="bg-amber-500/90 text-black font-bold border-0 flex gap-1 items-center px-1.5 h-6">
                <span className="text-[10px]">💰</span> {costGold}g
              </Badge>
            )}
            {costToken > 0 && (
              <Badge className="bg-purple-500/90 text-white font-bold border-0 flex gap-1 items-center px-1.5 h-6">
                <span className="text-[10px]">🎟️</span> {costToken}
              </Badge>
            )}
            {/* Material badge if needed */}
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <h4 className="font-bold text-amber-100 text-center text-sm truncate mb-1" title={tile.name}>{tile.name}</h4>

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