"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Tile } from '@/types/tiles';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, LayoutGrid, Gem, Check } from "lucide-react";
import { comprehensiveItems } from "@/app/lib/comprehensive-items";
import { AnimatedNumber } from "@/components/ui/animated-number";

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
  onBuy?: (tile: PropertyTile, method: 'gold' | 'tokens' | 'materials' | 'gems', quantity: number) => void;
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
        <div className="flex items-center justify-between p-6 pt-12 sm:pt-6 border-b border-amber-900/20 bg-[#13161b]">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold font-serif text-amber-300 flex items-center gap-3 drop-shadow-sm">
              <span className="text-3xl filter drop-shadow-md">🏢</span>
              Kingdom properties
            </h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full w-11 h-11 min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center text-lg"
          >
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
                  <AnimatedNumber value={playerGold} className="text-xl font-mono font-bold text-amber-400" />
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
              {inventory.filter(i => (i.quantity || 0) > 0 && tiles.some(t => t.id === i.id || t.id === i.type)).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400 border border-dashed border-zinc-700 rounded-xl bg-zinc-950">
                  <span className="text-5xl mb-4">🏗️</span>
                  <h3 className="text-lg font-medium text-amber-500/80 mb-1">No Properties Found</h3>
                  <p className="text-sm max-w-xs mb-4">Buy properties from the Buy tab or claim Siege Engines from the Siege Workshop to place them in your kingdom.</p>
                  <Button variant="outline" onClick={() => setActiveTab('buy')} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/30">
                    Go to Buy Tab
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-36 sm:pb-8">
                  {inventory.filter(i => (i.quantity || 0) > 0 && tiles.some(t => t.id === i.id || t.id === i.type)).map((tile) => (
                    <TileCard
                      key={`inv-${tile.id}`}
                      tile={tile}
                      owned={tile.quantity || 0}
                      placedCount={getPlacedCount(tile.id)}
                      mode="place"
                      onSelect={() => setSelectedTile(tile)}
                      getMaterialCount={getOwnedQty}
                      catalogTiles={tiles}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── BUY tab ──────────────────────────────────────────────── */}
            <TabsContent value="buy" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-36 sm:pb-8">
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
                        onAction={(method, qty) => onBuy && onBuy(tile, method, qty)}
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

function getTileImageSrc(tile: PropertyTile, catalogTiles?: PropertyTile[]): string {
  if (tile.id?.startsWith('siege_')) {
    return `/images/kingdom-tiles/${tile.id}.webp`;
  }
  if (tile.id === 'fortune_teller' || tile.id === 'fortune-teller' || tile.name?.toLowerCase().includes('fortune teller')) {
    return '/images/kingdom-tiles/fortune_teller.webp';
  }

  if (catalogTiles && catalogTiles.length > 0) {
    const catalogMatch = catalogTiles.find(
      ct => ct.id === tile.id || ct.name?.toLowerCase() === tile.name?.toLowerCase()
    );
    if (catalogMatch?.image) {
      let catImg = catalogMatch.image;
      if (!catImg.startsWith('/')) {
        catImg = `/images/kingdom-tiles/${catImg}`;
      }
      return normalizeImagePath(catImg);
    }
  }

  let img = tile.image || '';
  if (!img) {
    img = `/images/kingdom-tiles/${tile.id || 'vacant'}.webp`;
  }
  if (!img.startsWith('/')) {
    img = `/images/kingdom-tiles/${img}`;
  }

  return normalizeImagePath(img);
}

function normalizeImagePath(path: string): string {
  const parts = path.split('/');
  const filename = parts.pop() || '';
  const cleanFilename = filename
    .replace('CornerRoad', 'Cornerroad')
    .replace('StraightRoad', 'Straightroad')
    .replace('TSplitRoad', 'Tsplitroad')
    .replace('CrossRoad', 'Crossroad');

  const webpFilename = cleanFilename.replace(/\.png$/i, '.webp');
  return [...parts, webpFilename].join('/');
}

// ─── TileCard ───────────────────────────────────────────────

function TileCard({ tile, owned, placedCount, mode, playerLevel = 1, tokens = 0, onSelect, onAction, getMaterialCount, catalogTiles }: {
  tile: PropertyTile;
  owned: number;
  placedCount: number;
  mode: 'place' | 'buy';
  playerLevel?: number;
  tokens?: number;
  onSelect?: () => void;
  onAction?: (method: 'gold' | 'tokens' | 'materials' | 'gems', quantity: number) => void;
  getMaterialCount: (itemId: string) => number;
  catalogTiles?: PropertyTile[];
}) {
  const [qty, setQty] = useState(1);
  const isLevelUnlocked = !tile.levelRequired || playerLevel >= tile.levelRequired;
  const canAffordTokens = tile.tokenCost ? tokens >= (tile.tokenCost * qty) : false;
  
  let canAffordMaterials = false;
  if (tile.materialCost && tile.materialCost.length > 0) {
    canAffordMaterials = tile.materialCost.every(req => {
      return getMaterialCount(req.itemId) >= (req.quantity * qty);
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

  const imageSrc = getTileImageSrc(tile, catalogTiles);

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl border transition-all duration-300",
      mode === 'place' && owned > 0 ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-400" :
      "bg-[#0f1115] border-white/5 hover:border-white/20"
    )}>
      <div className="p-3">
        {/* Tags row at the top */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3 border-b border-white/5 pb-2">
          <Badge variant="outline" className="text-[9px] py-0.5 px-2 border-amber-500/30 text-amber-400 whitespace-nowrap">
            Owned: {owned}
          </Badge>
          {placedCount > 0 && (
            <Badge variant="secondary" className="text-[9px] py-0.5 px-2 bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
              Placed: {placedCount}
            </Badge>
          )}
          {(tile.id.includes('winter') || tile.id.includes('snowy') || tile.id.includes('ice')) && (
            <Badge variant="secondary" className="text-[9px] py-0.5 px-2 bg-blue-950/80 text-blue-300 border border-blue-500/30 whitespace-nowrap">
              ❄️ Winter Variant
            </Badge>
          )}
          {tile.id.includes('fireworks') && (
            <Badge variant="secondary" className="text-[9px] py-0.5 px-2 bg-purple-950/80 text-purple-300 border border-purple-500/30 whitespace-nowrap">
              🎆 Festival Variant
            </Badge>
          )}
          {(tile.id.includes('pumpkin') || tile.id.includes('harvest')) && (
            <Badge variant="secondary" className="text-[9px] py-0.5 px-2 bg-orange-950/80 text-orange-300 border border-orange-500/30 whitespace-nowrap">
              🎃 Harvest Variant
            </Badge>
          )}
          {tile.id.includes('spring') && (
            <Badge variant="secondary" className="text-[9px] py-0.5 px-2 bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
              🌸 Spring Variant
            </Badge>
          )}
          {tile.id.includes('solstice') && (
            <Badge variant="secondary" className="text-[9px] py-0.5 px-2 bg-amber-950/80 text-amber-300 border border-amber-500/30 whitespace-nowrap">
              ☀️ Solstice Variant
            </Badge>
          )}
          {tile.id.includes('forge') && (
            <Badge variant="secondary" className="text-[9px] py-0.5 px-2 bg-rose-950/80 text-rose-300 border border-rose-500/30 whitespace-nowrap">
              ⚒️ Forge Variant
            </Badge>
          )}
        </div>

        <div className="flex gap-3">
          <div className="relative w-16 h-16 shrink-0 rounded-lg bg-black/40 border border-white/10 overflow-hidden group-hover:border-amber-500/50 transition-colors flex items-center justify-center p-1">
            <Image
              src={imageSrc}
              alt={tile.name || tile.id}
              fill
              sizes="64px"
              className="object-contain drop-shadow-lg"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-white text-sm truncate">{tile.name}</h4>
            <p className="text-[10px] text-zinc-400 line-clamp-3 min-h-[36px] mt-0.5" title={tile.description}>{tile.description}</p>
            {/* Building Tier Upgrade Progress Bar */}
            <div className="mt-1 space-y-0.5">
              <div className="flex justify-between text-[8px] font-mono text-amber-400">
                <span>Tier {placedCount + 1} Yield</span>
                <span>+{(placedCount + 1) * 25} Gold/hr</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-amber-500/30">
                <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full" style={{ width: `${Math.min(100, (placedCount + 1) * 20)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {mode === 'buy' && (
          <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
            {/* Multi-Buy Stepper + Confirm Checkmark Component */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-zinc-950 border border-amber-900/40 rounded-xl p-1 flex-1 h-9 justify-between shadow-inner">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setQty(p => Math.max(1, p - 1)); }}
                  disabled={!isLevelUnlocked || qty <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 font-extrabold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="font-mono text-xs font-bold text-amber-200 px-2 min-w-[28px] text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setQty(p => p + 1); }}
                  disabled={!isLevelUnlocked}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 font-extrabold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Confirm Checkmark Button */}
              <Button
                type="button"
                size="sm"
                disabled={!isLevelUnlocked}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLevelUnlocked) return;
                  const method = tile.tokenCost ? 'tokens' : tile.cost ? 'gold' : tile.gemCost ? 'gems' : 'materials';
                  onAction?.(method, qty);
                  setQty(1);
                }}
                className={cn(
                  "h-9 px-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-md active:scale-95",
                  !isLevelUnlocked
                    ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white border border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                )}
                aria-label="Confirm purchase"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </Button>
            </div>

            {/* Price Info Banner */}
            <div className="flex flex-wrap gap-1 text-[10px] text-zinc-400 font-mono pt-1 justify-between items-center">
              {tile.cost && tile.cost > 0 && (
                <span className="text-amber-400 font-bold">🪙 {tile.cost * qty} Gold</span>
              )}
              {tile.tokenCost && tile.tokenCost > 0 && (
                <span className="text-emerald-400 font-bold">📜 {tile.tokenCost * qty} Tokens</span>
              )}
              {tile.gemCost && tile.gemCost > 0 && (
                <span className="text-fuchsia-400 font-bold">💎 {tile.gemCost * qty} Gems</span>
              )}
            </div>
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