"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Tile } from '@/types/tiles';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, LayoutGrid, Gem } from "lucide-react";
import { comprehensiveItems } from "@/app/lib/comprehensive-items";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PropertyTile {
  id: string;
  name: string;
  image: string;
  description?: string | undefined;
  cost?: number | undefined;
  tokenCost?: number | undefined;
  gemCost?: number | undefined;
  materialCost?: { itemId: string; quantity: number }[] | undefined;
  quantity?: number | undefined;
  levelRequired?: number | undefined;
  placedCount?: number | undefined;
}

interface KingdomPropertiesInventoryProps {
  open: boolean;
  onClose: () => void;
  inventory: any[]; 
  tiles: PropertyTile[]; 
  selectedTile: PropertyTile | null;
  setSelectedTile: (tile: PropertyTile | null) => void;
  onBuy?: (tile: PropertyTile, method: 'gold' | 'tokens' | 'materials' | 'gems') => void;
  onBuyToken?: () => void; 
  tokens?: number | undefined;
  playerLevel?: number | undefined;
  grid?: Tile[][] | Record<string, Tile>;
  inventoryItems?: any[] | undefined;
  userId?: string | null | undefined;
}

export function KingdomPropertiesInventory({
  open,
  onClose,
  inventory = [],
  tiles = [],
  selectedTile,
  setSelectedTile,
  onBuy,
  onBuyToken,
  tokens = 0,
  playerLevel = 1,
  grid = {},
  inventoryItems = [],
  userId,
}: KingdomPropertiesInventoryProps) {
  const [activeTab, setActiveTab] = useState('place');
  const [playerGold, setPlayerGold] = useState(0);

  // Sync gold from local storage or events
  useEffect(() => {
    if (!open) return;
    const fetchGold = () => {
      const stats = JSON.parse(localStorage.getItem('character-stats') || '{}');
      setPlayerGold(stats.gold || 0);
    };
    fetchGold();
    window.addEventListener('character-stats-update', fetchGold);
    return () => window.removeEventListener('character-stats-update', fetchGold);
  }, [open]);

  // Owned quantity helper for material costs
  const getOwnedQty = (itemId: string) => {
    const match = (inventoryItems || []).find((i: any) => i.id === itemId);
    return match ? (match.quantity || 0) : 0;
  };

  const getMaterialEmoji = (id: string) => {
    const comp = comprehensiveItems.find(i => i.id === id);
    if (comp?.emoji) return comp.emoji;
    if (id.includes('plank')) return '🪵';
    if (id.includes('log')) return '🌲';
    if (id.includes('stone') || id.includes('iron') || id.includes('steel')) return '🪨';
    if (id.includes('crystal')) return '💎';
    if (id.includes('gold')) return '🪙';
    if (id.includes('silver')) return '🥈';
    return '🌿';
  };

  const getMaterialName = (id: string) => {
    const comp = comprehensiveItems.find(i => i.id === id);
    if (comp) return comp.name;
    const parts = id.split('-');
    return parts.length > 1 && parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : id;
  };

  const renderItemCard = (item: any) => {
    const compItem = comprehensiveItems.find(i => i.id === item.id);
    const emoji = item.emoji || compItem?.emoji;
    const image = item.image || compItem?.image;
    const displayName = compItem?.name || item.name;

    return (
      <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border transition-all bg-[#0f1115] border-white/5">
        <div className="w-12 h-12 shrink-0 relative bg-zinc-950 rounded-lg flex items-center justify-center border border-white/5">
          {emoji ? (
            <span className="text-2xl">{emoji}</span>
          ) : image ? (
            <Image src={image} alt={displayName} fill sizes="48px" className="object-contain rounded-lg" />
          ) : (
            <span className="text-xl">📦</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate text-white">{displayName}</p>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end justify-center gap-2">
          <span className="text-xs font-mono text-amber-400 font-bold">×{item.quantity}</span>
        </div>
      </div>
    );
  };

  if (!open) return null;

  const isLevelUnlocked = (tile: PropertyTile) => !tile.levelRequired || playerLevel >= tile.levelRequired;

  const getPlacedCount = (tileId: string) => {
    let count = 0;
    if (Array.isArray(grid)) {
      grid.forEach(row => {
        row.forEach(t => {
          if (t && t.type === tileId) count++;
        });
      });
    } else {
      Object.values(grid).forEach(t => {
        if (t && t.type === tileId) count++;
      });
    }
    return count;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/50" role="dialog" aria-modal="true">
      <div className="bg-[#0f1115] w-full max-w-xl h-full border-l border-amber-900/30 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-900/20 bg-[#13161b]">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold font-cardo text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 flex items-center gap-3 drop-shadow-sm">
              <span className="text-3xl filter drop-shadow-md">🏢</span>
              Kingdom Properties
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full">
            ✕
          </Button>
        </div>

        {/* Tokens & Resources Row */}
        <div className="px-6 py-3 bg-[#13161b] border-b border-white/5 flex items-center justify-between shrink-0">
           <div className="flex gap-4">
             <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold text-amber-500/70 tracking-wider">Build Tokens</span>
               <div className="flex items-center gap-2">
                 <span className="text-xl">📜</span>
                 <span className="text-xl font-mono font-bold text-amber-100">{tokens}</span>
               </div>
             </div>
             <div className="w-px h-8 bg-white/10" />
             <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold text-amber-500/70 tracking-wider">Kingdom Gold</span>
               <div className="flex items-center gap-2">
                 <Coins className="w-5 h-5 text-amber-400" />
                 <span className="text-xl font-mono font-bold text-amber-400">{playerGold}</span>
               </div>
             </div>
           </div>
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-[#1a1d24]">
            <TabsList className="grid grid-cols-2 bg-[#0f1115] border border-white/5 p-1 rounded-xl shadow-inner">
              <TabsTrigger value="place" className="rounded-lg data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all text-xs font-bold tracking-wide uppercase flex items-center gap-2">
                <LayoutGrid className="w-3 h-3" /> Place
              </TabsTrigger>
              <TabsTrigger value="buy" className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all text-xs font-bold tracking-wide uppercase flex items-center gap-2">
                <Coins className="w-3 h-3" /> Buy
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 bg-[#13161b] custom-scrollbar">

            {/* ── PLACE tab ────────────────────────────────────────────── */}
            <TabsContent value="place" className="mt-4">
              {inventory.filter(i => i.quantity > 0).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400 border border-dashed border-zinc-700 rounded-xl bg-zinc-950">
                  <span className="text-5xl mb-4">🏗️</span>
                  <h3 className="text-lg font-medium text-amber-500/80 mb-1">No Properties Found</h3>
                  <p className="text-sm max-w-xs mb-4">Buy properties from the Buy tab to place them in your kingdom.</p>
                  <Button variant="outline" onClick={() => setActiveTab('buy')} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/30">
                    Go to Buy Tab
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
                  {inventory.filter(i => i.quantity > 0).map((tile) => (
                    <TileCard
                      key={`inv-${tile.id}`}
                      tile={tile}
                      owned={tile.quantity || 0}
                      placedCount={getPlacedCount(tile.id)}
                      mode="place"
                      onSelect={() => setSelectedTile(tile)}
                      getMaterialCount={getOwnedQty}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── BUY tab ──────────────────────────────────────────────── */}
            <TabsContent value="buy" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
                {tiles.map((tile) => {
                  const invItem = inventory.find(i => i.id === tile.id);
                  const owned = invItem?.quantity || 0;
                  const placed = getPlacedCount(tile.id);
                  const unlocked = isLevelUnlocked(tile);

                  return (
                    <div key={`buy-${tile.id}`} className={cn("relative transition-all duration-300", !unlocked && "opacity-60 grayscale-[0.8]")}>
                      {!unlocked && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-[2px]">
                          <div className="text-center bg-zinc-900/90 px-4 py-2 rounded-lg border border-red-500/30">
                            <span className="text-xl mb-1 block">🔒</span>
                            <p className="text-xs font-bold text-red-400">Unlocks at Level {tile.levelRequired}</p>
                          </div>
                        </div>
                      )}
                      <TileCard
                        tile={tile}
                        owned={owned}
                        placedCount={placed}
                        mode="buy"
                        playerLevel={playerLevel}
                        tokens={tokens}
                        onAction={(method) => onBuy && onBuy(tile, method)}
                        getMaterialCount={getOwnedQty}
                      />
                    </div>
                  );
                })}
              </div>
            </TabsContent>

          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}

// ─── TileCard (Unchanged logic) ───────────────────────────

function TileCard({ tile, owned, placedCount, mode, playerLevel = 1, tokens = 0, onSelect, onAction, getMaterialCount }: {
  tile: PropertyTile;
  owned: number;
  placedCount: number;
  mode: 'place' | 'buy';
  playerLevel?: number;
  tokens?: number;
  onSelect?: () => void;
  onAction?: (method: 'gold' | 'tokens' | 'materials' | 'gems') => void;
  getMaterialCount: (itemId: string) => number;
}) {
  const isLevelUnlocked = !tile.levelRequired || playerLevel >= tile.levelRequired;

  const canAffordGold = (tile.cost ?? 0) <= 0 || false; // Note: We don't have playerGold here, but we pass canAfford from parent usually. We'll just let the button trigger and fail if no gold, or we could pass gold down. 
  // For simplicity, we just enable the button and backend will reject if insufficient.
  const canAffordTokens = tile.tokenCost ? tokens >= tile.tokenCost : false;
  
  let canAffordMaterials = false;
  if (tile.materialCost && tile.materialCost.length > 0) {
    canAffordMaterials = tile.materialCost.every(req => {
      return getMaterialCount(req.itemId) >= req.quantity;
    });
  }

  const getMaterialEmoji = (id: string) => {
    const comp = comprehensiveItems.find(i => i.id === id);
    if (comp?.emoji) return comp.emoji;
    if (id.includes('plank')) return '🪵';
    if (id.includes('log')) return '🌲';
    if (id.includes('stone') || id.includes('iron') || id.includes('steel')) return '🪨';
    if (id.includes('crystal')) return '💎';
    if (id.includes('gold')) return '🪙';
    if (id.includes('silver')) return '🥈';
    return '🌿';
  };

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl border transition-all duration-300",
      mode === 'place' && owned > 0 ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-400" :
      "bg-[#0f1115] border-white/5 hover:border-white/20"
    )}>
      <div className="p-3">
        <div className="flex gap-3">
          <div className="relative w-16 h-16 shrink-0 rounded-lg bg-black/40 border border-white/10 overflow-hidden group-hover:border-amber-500/50 transition-colors flex items-center justify-center p-1">
            <Image
              src={tile.image.startsWith('/') ? tile.image : `/images/kingdom-tiles/${tile.image}`}
              alt={tile.name}
              fill
              sizes="64px"
              className="object-contain drop-shadow-lg"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-sm truncate">{tile.name}</h4>
            <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5" title={tile.description}>{tile.description}</p>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[9px] py-0 h-4 border-amber-500/30 text-amber-400">
                Owned: {owned}
              </Badge>
              {placedCount > 0 && (
                <Badge variant="secondary" className="text-[9px] py-0 h-4 bg-emerald-950/50 text-emerald-400 border border-emerald-500/20">
                  Placed: {placedCount}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {mode === 'buy' && (
          <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
            {tile.cost && tile.cost > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full h-7 text-xs justify-between hover:bg-amber-950/40 border-amber-900/50"
                onClick={() => onAction?.('gold')}
                disabled={!isLevelUnlocked}
              >
                <span className="text-zinc-400">Buy with Gold</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">🪙 {tile.cost}</span>
              </Button>
            )}
            
            {tile.tokenCost && tile.tokenCost > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                className={cn(
                  "w-full h-7 text-xs justify-between hover:bg-emerald-950/40 border-emerald-900/50",
                  canAffordTokens ? "text-emerald-400" : "text-emerald-400/50"
                )}
                onClick={() => onAction?.('tokens')}
                disabled={!isLevelUnlocked || !canAffordTokens}
              >
                <span className="text-zinc-400">Use Token</span>
                <span className="font-bold flex items-center gap-1">📜 {tile.tokenCost}</span>
              </Button>
            )}

            {tile.gemCost && tile.gemCost > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full h-7 text-xs justify-between hover:bg-fuchsia-950/40 border-fuchsia-900/50"
                onClick={() => onAction?.('gems')}
                disabled={!isLevelUnlocked}
              >
                <span className="text-zinc-400">Buy with Gems</span>
                <span className="text-fuchsia-400 font-bold flex items-center gap-1"><Gem className="w-3 h-3" /> {tile.gemCost}</span>
              </Button>
            )}

            {tile.materialCost && tile.materialCost.length > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                className={cn(
                  "w-full h-auto py-1 text-xs justify-between hover:bg-blue-950/40 border-blue-900/50 flex-col items-stretch",
                  canAffordMaterials ? "text-blue-400" : "text-blue-400/50"
                )}
                onClick={() => onAction?.('materials')}
                disabled={!isLevelUnlocked || !canAffordMaterials}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-zinc-400">Craft with Materials</span>
                  <span className="font-bold">🔨</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1 justify-end">
                  {tile.materialCost.map(req => {
                    const has = getMaterialCount(req.itemId);
                    const enough = has >= req.quantity;
                    return (
                      <span key={req.itemId} className={cn("text-[9px] px-1 rounded bg-black/40", enough ? "text-blue-300" : "text-red-400")}>
                        {getMaterialEmoji(req.itemId)} {has}/{req.quantity}
                      </span>
                    )
                  })}
                </div>
              </Button>
            )}
          </div>
        )}

        {mode === 'place' && (
          <Button 
            className="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white font-bold h-8 text-xs"
            onClick={onSelect}
            disabled={owned <= 0}
          >
            {owned > 0 ? "Place Property" : "None Available"}
          </Button>
        )}
      </div>
    </div>
  );
}