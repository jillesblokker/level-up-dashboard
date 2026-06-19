"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Tile } from '@/types/tiles';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Hammer, Coins, LayoutGrid, Check } from "lucide-react";
import { comprehensiveItems } from "@/app/lib/comprehensive-items";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  placedCount?: number | undefined;
}

interface Recipe {
  id: string;
  targetItemId: string;
  goldCost: number;
  materials: { itemId: string; quantity: number }[];
}

const FORGE_RECIPES: Recipe[] = [
  { id: 'craft-sword-irony',      targetItemId: 'sword-irony',      goldCost: 50,  materials: [{ itemId: 'material-steel', quantity: 5 }, { itemId: 'material-planks', quantity: 2 }] },
  { id: 'craft-sword-morningstar', targetItemId: 'sword-morningstar', goldCost: 120, materials: [{ itemId: 'material-steel', quantity: 8 }, { itemId: 'material-planks', quantity: 3 }, { itemId: 'material-crystal', quantity: 1 }] },
  { id: 'craft-sword-sunblade',   targetItemId: 'sword-sunblade',   goldCost: 250, materials: [{ itemId: 'material-silver', quantity: 10 }, { itemId: 'material-crystal', quantity: 5 }] },
  { id: 'craft-sword-solaraxe',   targetItemId: 'sword-solaraxe',   goldCost: 500, materials: [{ itemId: 'material-gold', quantity: 15 }, { itemId: 'material-crystal', quantity: 10 }] },
  { id: 'craft-shield-defecto',   targetItemId: 'shield-defecto',   goldCost: 40,  materials: [{ itemId: 'material-logs', quantity: 5 }, { itemId: 'material-steel', quantity: 3 }] },
  { id: 'craft-shield-blockado',  targetItemId: 'shield-blockado',  goldCost: 100, materials: [{ itemId: 'material-steel', quantity: 8 }, { itemId: 'material-planks', quantity: 2 }, { itemId: 'material-crystal', quantity: 1 }] },
  { id: 'craft-armor-darko',      targetItemId: 'armor-darko',      goldCost: 60,  materials: [{ itemId: 'material-logs', quantity: 4 }, { itemId: 'material-steel', quantity: 2 }] },
  { id: 'craft-armor-silvo',      targetItemId: 'armor-silvo',      goldCost: 300, materials: [{ itemId: 'material-silver', quantity: 8 }, { itemId: 'material-crystal', quantity: 4 }] },
  { id: 'craft-potion-exp',       targetItemId: 'potion-exp',       goldCost: 50,  materials: [{ itemId: 'material-crystal', quantity: 3 }, { itemId: 'food-red', quantity: 1 }] },
];

const ITEM_CATEGORIES = [
  { value: 'all',       label: 'All',       emoji: '🎒' },
  { value: 'weapon',    label: 'Weapons',   emoji: '🗡️' },
  { value: 'shield',    label: 'Shields',   emoji: '🛡️' },
  { value: 'armor',     label: 'Armor',     emoji: '🦺' },
  { value: 'equipment', label: 'Equipment', emoji: '⚔️' },
  { value: 'resource',  label: 'Resources', emoji: '🌿' },
  { value: 'scroll',    label: 'Scrolls',   emoji: '📜' },
  { value: 'creature',  label: 'Creatures', emoji: '🐉' },
  { value: 'item',      label: 'Items',     emoji: '📦' },
  { value: 'artifact',  label: 'Artifacts', emoji: '🏺' },
  { value: 'book',      label: 'Books',     emoji: '📚' },
  { value: 'mount',     label: 'Mounts',    emoji: '🐎' },
];

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
  grid?: Tile[][];
  inventoryItems?: any[] | undefined;
  userId?: string | null;
  onForgeSuccess?: (() => void) | undefined;
  onEquip?: (item: any) => void;
  onUnequip?: (item: any) => void;
  onSell?: (item: any) => void;
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
  grid = [],
  inventoryItems = [],
  userId,
  onForgeSuccess,
  onEquip,
  onUnequip,
  onSell,
}: KingdomPropertiesInventoryProps) {
  const [activeTab, setActiveTab] = useState<'place' | 'buy' | 'equipped' | 'stored' | 'forge'>('place');
  const [floatingCosts, setFloatingCosts] = useState<{ id: string; text: string; x: number; y: number }[]>([]);
  const [storedFilter, setStoredFilter] = useState('all');
  const [playerGold, setPlayerGold] = useState(0);
  const [isCrafting, setIsCrafting] = useState<string | null>(null);
  const [forgeError, setForgeError] = useState<string | null>(null);
  const [forgeSuccess, setForgeSuccess] = useState<string | null>(null);

  // Fetch gold when Forge tab is active
  useEffect(() => {
    if (activeTab === 'forge') {
      fetch('/api/character-stats')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setPlayerGold(data.gold || 0); })
        .catch(() => {});
    }
  }, [activeTab]);

  const triggerFloatingCost = (method: 'gold' | 'materials' | 'tokens', tile: PropertyTile, event: React.MouseEvent) => {
    const costText = method === 'gold' ? `-${tile.cost}g` : method === 'tokens' ? `-${tile.tokenCost}t` : 'Resources -';
    const id = Math.random().toString(36).substr(2, 9);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setFloatingCosts(prev => [...prev, { id, text: costText, x: rect.left + rect.width / 2, y: rect.top }]);
    setTimeout(() => { setFloatingCosts(prev => prev.filter(f => f.id !== id)); }, 1000);
  };

  if (!open) return null;

  // ─── Inventory map (for place/buy tabs) ──────────────────────────────────
  const inventoryMap = new Map<string, number>();
  (inventory || []).forEach(item => {
    const quantity = item.quantity || 0;
    inventoryMap.set(item.id, (inventoryMap.get(item.id) || 0) + quantity);
    const lowerId = item.id.toLowerCase();
    if (lowerId !== item.id) inventoryMap.set(lowerId, (inventoryMap.get(lowerId) || 0) + quantity);
    if (lowerId.endsWith('-item')) {
      const cleanId = lowerId.replace('-item', '');
      inventoryMap.set(cleanId, (inventoryMap.get(cleanId) || 0) + quantity);
    }
    if (item.name) {
      const lowerName = item.name.toLowerCase();
      if (lowerName !== lowerId && lowerName !== item.id) inventoryMap.set(lowerName, (inventoryMap.get(lowerName) || 0) + quantity);
    }
  });

  // Placed count map
  const placedMap = new Map<string, number>();
  if (grid && grid.length > 0) {
    grid.flat().forEach(cell => {
      if (cell && cell.type && cell.type !== 'vacant' && cell.type !== 'empty') {
        const type = cell.type.toLowerCase();
        placedMap.set(type, (placedMap.get(type) || 0) + 1);
      }
    });
  }

  const getOwnedCount = (tile: PropertyTile) => inventoryMap.get(tile.id) ?? inventoryMap.get(tile.id.toLowerCase()) ?? 0;
  const getPlacedCount = (tile: PropertyTile) => placedMap.get(tile.id.toLowerCase()) || 0;
  const ownedTiles = tiles.filter(t => getOwnedCount(t) > 0);

  // ─── Equipped / Stored split ─────────────────────────────────────────────
  const equippedInventory = (inventoryItems || []).filter((i: any) => i.equipped);
  const storedInventory = (inventoryItems || []).filter((i: any) => !i.equipped);
  const filteredStored = storedFilter === 'all'
    ? storedInventory
    : storedInventory.filter((i: any) => i.type === storedFilter);

  // ─── Forge helpers ────────────────────────────────────────────────────────
  const getOwnedQty = (itemId: string) => {
    const match = (inventoryItems || []).find((i: any) => i.id === itemId);
    return match ? match.quantity : 0;
  };
  const getMaterialName = (itemId: string) => comprehensiveItems.find(i => i.id === itemId)?.name ?? itemId;
  const getMaterialEmoji = (itemId: string) => comprehensiveItems.find(i => i.id === itemId)?.emoji ?? '📦';

  const handleCraft = async (recipe: Recipe) => {
    setForgeError(null);
    setForgeSuccess(null);
    if (playerGold < recipe.goldCost) { setForgeError('Not enough gold.'); return; }
    for (const req of recipe.materials) {
      if (getOwnedQty(req.itemId) < req.quantity) {
        setForgeError(`Need ${req.quantity}x ${getMaterialName(req.itemId)}.`);
        return;
      }
    }
    setIsCrafting(recipe.id);
    try {
      const res = await fetch('/api/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: recipe.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Crafting failed');
      const itemName = comprehensiveItems.find(i => i.id === recipe.targetItemId)?.name ?? recipe.targetItemId;
      setForgeSuccess(`Successfully forged: ${itemName}!`);
      setPlayerGold(g => g - recipe.goldCost);
      window.dispatchEvent(new Event('character-inventory-update'));
      window.dispatchEvent(new Event('character-stats-update'));
      onForgeSuccess?.();
    } catch (e: any) {
      setForgeError(e.message || 'Something went wrong.');
    } finally {
      setIsCrafting(null);
    }
  };

  // ─── Item card renderer (Equipped / Stored) ───────────────────────────────
  const renderItemCard = (item: any) => {
    const compItem = comprehensiveItems.find(i => i.id === item.id);
    const emoji = item.emoji || compItem?.emoji;
    const image = item.image || compItem?.image;
    return (
    <div
      key={item.id}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-all',
        item.equipped
          ? 'bg-amber-950/20 border-amber-500/30'
          : 'bg-[#0f1115] border-white/5 hover:border-white/10'
      )}
    >
      <div className="w-12 h-12 shrink-0 relative bg-black/40 rounded-lg flex items-center justify-center border border-white/5">
        {emoji ? (
          <span className="text-2xl">{emoji}</span>
        ) : image ? (
          <Image src={image} alt={item.name} fill sizes="48px" className="object-contain rounded-lg" />
        ) : (
          <span className="text-xl">📦</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('font-semibold text-sm truncate', item.equipped ? 'text-amber-300' : 'text-white')}>{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="secondary" className="text-[9px] py-0 h-4 capitalize">{item.type}</Badge>
          {item.equipped && <Badge className="text-[9px] py-0 h-4 bg-amber-600">Equipped</Badge>}
        </div>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end justify-center gap-2">
        <span className="text-xs font-mono text-amber-400 font-bold">×{item.quantity}</span>
        <div className="flex gap-1.5">
          {(item.equipped || item.canEquip || item.canUse) && (
            <Button
              size="sm"
              onClick={() => item.equipped ? onUnequip?.(item) : onEquip?.(item)}
              className={cn("h-6 px-2 text-[10px] font-bold text-white shadow-md", item.equipped ? 'bg-red-600 hover:bg-red-700' : item.canUse ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700')}
            >
              {item.equipped ? 'Unequip' : item.canUse ? 'Use' : 'Equip'}
            </Button>
          )}
          {!item.equipped && item.sellPrice !== undefined && item.sellPrice > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSell?.(item)}
              className="h-6 px-2 text-[10px] bg-orange-950/40 hover:bg-orange-900 border-orange-500/50 text-orange-400"
            >
              Sell ({item.sellPrice}g)
            </Button>
          )}
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-[#0f1115] w-full max-w-xl h-full border-l border-amber-900/30 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-900/20 bg-[#13161b]">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-3xl font-serif text-amber-400 tracking-wide mb-1">Inventory</h2>
              <p className="text-amber-500/60 text-sm">Kingdom · Bag · Forge</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-amber-500 hover:text-amber-300 hover:bg-amber-950/30 rounded-full h-10 w-10">
            <span className="text-2xl">×</span>
          </Button>
        </div>

        {/* Currency Bar (only shown on Place/Buy tabs) */}
        {(activeTab === 'place' || activeTab === 'buy') && (
          <div className="flex items-center justify-between px-6 py-4 bg-[#0a0c10] border-b border-amber-900/20">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-medium text-lg">Build tokens:</span>
              <span className="text-2xl font-bold text-amber-400">{tokens}</span>
            </div>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-lg shadow-amber-900/20" onClick={onBuyToken}>
              Buy Token (1000g)
            </Button>
          </div>
        )}



        {/* Tabs */}
        <Tabs
          defaultValue="place"
          value={activeTab}
          className="flex-1 flex flex-col min-h-0"
          onValueChange={(v) => {
            setActiveTab(v as any);
            setForgeError(null);
            setForgeSuccess(null);
          }}
        >
          <div className="px-4 py-3 border-b border-amber-900/20 bg-[#0f1115]">
            <TabsList className="w-full grid grid-cols-5 bg-[#1a1d24] p-1 h-10 rounded-lg border border-amber-900/20 gap-0.5">
              {[
                { value: 'place',    label: '🏗️ Place' },
                { value: 'buy',      label: '🪙 Buy' },
                { value: 'equipped', label: '⚔️ Equip' },
                { value: 'stored',   label: '🎒 Stored' },
                { value: 'forge',    label: '🔨 Forge' },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-[#2a2e37] data-[state=active]:text-amber-400 text-gray-500 font-medium text-[11px] transition-all px-1"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 pb-6">

            {/* ── PLACE tab ─────────────────────────────────────────────── */}
            <TabsContent value="place" className="mt-4">
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
                    <TileCard key={tile.id} tile={tile} owned={getOwnedCount(tile)} placedCount={getPlacedCount(tile)} mode="place"
                      onSelect={() => { setSelectedTile(tile); onClose(); }} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── BUY tab ───────────────────────────────────────────────── */}
            <TabsContent value="buy" className="mt-4">
              <div className="grid grid-cols-2 gap-4 pb-8">
                {tiles.map(tile => (
                  <TileCard key={tile.id} tile={tile} owned={getOwnedCount(tile)} placedCount={getPlacedCount(tile)} mode="buy"
                    playerLevel={playerLevel} tokens={tokens}
                    onAction={(method, e) => { triggerFloatingCost(method, tile, e); onBuy && onBuy(tile, method); }}
                    getMaterialCount={(itemId) => inventoryMap.get(itemId) || 0}
                  />
                ))}
              </div>
            </TabsContent>

            {/* ── EQUIPPED tab ──────────────────────────────────────────── */}
            <TabsContent value="equipped" className="mt-4">
              {equippedInventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 border border-dashed border-gray-700 rounded-xl bg-black/20">
                  <span className="text-5xl mb-4">⚔️</span>
                  <h3 className="text-lg font-medium text-amber-500/80 mb-1">Nothing Equipped</h3>
                  <p className="text-sm max-w-xs mb-4">Equip weapons, armor, and shields from your stored items.</p>
                </div>
              ) : (
                <div className="space-y-2 pb-8">
                  {equippedInventory.map(renderItemCard)}
                </div>
              )}
            </TabsContent>

            {/* ── STORED tab ────────────────────────────────────────────── */}
            <TabsContent value="stored" className="mt-4">
              {/* Category filter chips */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {ITEM_CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setStoredFilter(cat.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all',
                      storedFilter === cat.value
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-[#1a1d24] border-white/10 text-gray-400 hover:border-white/20'
                    )}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>

              {filteredStored.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 border border-dashed border-gray-700 rounded-xl bg-black/20">
                  <span className="text-5xl mb-4">🎒</span>
                  <h3 className="text-lg font-medium text-amber-500/80 mb-1">
                    {storedFilter === 'all' ? 'Bag is Empty' : `No ${storedFilter} items`}
                  </h3>
                  <p className="text-sm max-w-xs mb-4">Complete quests, collect from tiles and dungeons to fill your bag.</p>
                </div>
              ) : (
                <div className="space-y-2 pb-8">
                  {filteredStored.map(renderItemCard)}
                </div>
              )}
            </TabsContent>

            {/* ── FORGE tab ─────────────────────────────────────────────── */}
            <TabsContent value="forge" className="mt-4">
              {/* Gold balance */}
              <div className="flex items-center justify-between bg-[#0a0c10] border border-amber-900/20 rounded-xl px-4 py-3 mb-4">
                <span className="text-sm text-gray-400 font-medium">Your Gold</span>
                <span className="text-amber-400 font-bold text-lg">🪙 {playerGold.toLocaleString()}</span>
              </div>

              {/* Feedback messages */}
              {forgeError && (
                <div className="mb-3 px-4 py-2.5 bg-red-950/60 border border-red-500/40 rounded-xl text-sm text-red-300">
                  ❌ {forgeError}
                </div>
              )}
              {forgeSuccess && (
                <div className="mb-3 px-4 py-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-sm text-emerald-300">
                  ✅ {forgeSuccess}
                </div>
              )}

              <div className="space-y-3 pb-8">
                {FORGE_RECIPES.map(recipe => {
                  const item = comprehensiveItems.find(i => i.id === recipe.targetItemId);
                  if (!item) return null;
                  const canCraft = playerGold >= recipe.goldCost &&
                    recipe.materials.every(req => getOwnedQty(req.itemId) >= req.quantity);

                  return (
                    <div
                      key={recipe.id}
                      className={cn(
                        'p-4 rounded-xl border transition-all',
                        canCraft
                          ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400/50'
                          : 'bg-[#0f1115] border-white/5'
                      )}
                    >
                      <div className="flex gap-3 items-start">
                        {/* Item icon */}
                        <div className="w-12 h-12 shrink-0 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center text-2xl">
                          {item.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                            {item.rarity && (
                              <Badge variant="outline" className={cn('text-[9px] capitalize shrink-0',
                                item.rarity === 'legendary' ? 'border-orange-500 text-orange-400' :
                                item.rarity === 'epic' ? 'border-purple-500 text-purple-400' :
                                item.rarity === 'rare' ? 'border-blue-500 text-blue-400' :
                                item.rarity === 'uncommon' ? 'border-green-500 text-green-400' :
                                'border-slate-500 text-slate-400'
                              )}>
                                {item.rarity}
                              </Badge>
                            )}
                          </div>

                          {/* Material requirements */}
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {recipe.materials.map(req => {
                              const owned = getOwnedQty(req.itemId);
                              const met = owned >= req.quantity;
                              return (
                                <span key={req.itemId} className={cn('text-xs flex items-center gap-1', met ? 'text-emerald-400' : 'text-red-400')}>
                                  {getMaterialEmoji(req.itemId)} {getMaterialName(req.itemId)}: {owned}/{req.quantity}
                                </span>
                              );
                            })}
                            <span className={cn('text-xs flex items-center gap-1', playerGold >= recipe.goldCost ? 'text-amber-400' : 'text-red-400')}>
                              🪙 {recipe.goldCost}g
                            </span>
                          </div>
                        </div>

                        {/* Forge button */}
                        <Button
                          size="sm"
                          disabled={!canCraft || isCrafting !== null}
                          onClick={() => handleCraft(recipe)}
                          className={cn(
                            'shrink-0 h-9 text-xs font-bold w-20',
                            canCraft
                              ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          )}
                        >
                          {isCrafting === recipe.id ? '⏳' : '🔨 Forge'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

          </ScrollArea>
        </Tabs>

        {/* Floating cost animations */}
        {floatingCosts.map(f => (
          <div
            key={f.id}
            className="fixed z-[100] text-amber-400 font-bold pointer-events-none animate-float-up text-sm shadow-black drop-shadow-md"
            style={{ left: f.x, top: f.y }}
          >
            {f.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TileCard (unchanged internals, same as before) ───────────────────────────

function TileCard({ tile, owned, placedCount, mode, playerLevel = 1, tokens = 0, onSelect, onAction, getMaterialCount }: {
  tile: PropertyTile;
  owned: number;
  placedCount: number;
  mode: 'place' | 'buy';
  playerLevel?: number;
  tokens?: number;
  onSelect?: () => void;
  onAction?: (method: 'gold' | 'materials' | 'tokens', event: React.MouseEvent) => void;
  getMaterialCount?: (itemId: string) => number;
}) {
  const isPlaceMode = mode === 'place';
  const hasMaterialCost = !!tile.materialCost && tile.materialCost.length > 0;
  const hasTokenCost = !!tile.tokenCost && tile.tokenCost > 0;
  const goldCost = tile.cost || 0;
  const tokenCost = tile.tokenCost || 0;

  const isLocked = !isPlaceMode && tile.levelRequired !== undefined && playerLevel < tile.levelRequired;
  const canAffordWithMaterials = hasMaterialCost && tile.materialCost?.every(m => (getMaterialCount?.(m.itemId) || 0) >= m.quantity);
  const canAffordWithTokens = hasTokenCost && tokens >= tokenCost;
  const canAffordWithGold = !hasMaterialCost && !hasTokenCost && goldCost > 0;
  const isAffordable = !isPlaceMode && !isLocked && (canAffordWithMaterials || canAffordWithTokens || canAffordWithGold);
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
      <div className={cn("w-full aspect-[4/3] relative bg-[#1a1d24] p-4 flex items-center justify-center shrink-0", isPlaceMode ? "bg-amber-900/10" : "")}>
        <Image
          src={tile.image}
          alt={tile.name}
          width={96}
          height={96}
          className={cn("object-contain drop-shadow-lg transform transition-transform duration-300", !isLocked && "group-hover:scale-110", isLocked && "opacity-50 blur-[1px]")}
          unoptimized
        />
        {isNewlyUnlocked && (
          <div className="absolute top-0 left-0 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-br-lg shadow-lg z-30 uppercase animate-pulse-subtle">New Unlock</div>
        )}
        {isAffordable && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg z-30 animate-float-subtle">
            <Hammer className="w-3 h-3" />
          </div>
        )}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <div className="bg-red-900/90 text-red-100 px-3 py-1 rounded-full text-xs font-bold border border-red-500/50 flex items-center gap-1 shadow-lg">
              <span>🔒 Lvl {tile.levelRequired}</span>
            </div>
          </div>
        )}
        {owned - placedCount > 0 && (
          <div className="absolute top-2 right-2 bg-emerald-600 shadow-lg text-white text-[10px] uppercase font-black px-2 py-1 rounded-md border border-emerald-400/40 z-20">
            Ready: {owned - placedCount}
          </div>
        )}
        {owned > 0 && owned === placedCount && (
          <div className="absolute top-2 right-2 bg-zinc-700 text-zinc-300 text-[10px] uppercase font-bold px-2 py-1 rounded-md border border-zinc-600/50 z-20">
            All Placed
          </div>
        )}
        {placedCount > 0 && (
          <div className="absolute top-2 left-2 bg-blue-700/80 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-lg border border-blue-400/30 z-20 flex items-center gap-1">
            <LayoutGrid className="w-2.5 h-2.5" />
            <span>Map: {placedCount}</span>
          </div>
        )}
        {owned - placedCount > 0 && !isPlaceMode && (
          <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-1 rounded-full shadow-lg z-30 animate-pulse-subtle">
            <LayoutGrid className="w-3 h-3" />
          </div>
        )}
      </div>

      <CardContent className="p-3 flex-1 flex flex-col">
        <h3 className={cn("font-bold text-lg leading-tight mb-0.5 truncate font-medieval tracking-wide text-center", isLocked ? "text-gray-500" : "text-amber-100")}>
          {tile.name}
        </h3>
        {!isLocked && (
          <p className="text-[10px] text-amber-500/70 text-center italic mb-2 leading-tight">
            {tile.id === 'library' && "Brings +10% Knowledge XP"}
            {tile.id === 'training-grounds' && "Brings +10% Might XP"}
            {tile.id === 'castle' && "Brings +10% Honor XP"}
            {(tile.id === 'zen-garden' || tile.id === 'temple') && "Brings +10% Wellness XP"}
            {(tile.id === 'sawmill' || tile.id === 'stone-quarry') && "Generates passive resources"}
            {(tile.id === 'house' || tile.id === 'mansion') && "Increases your population limits"}
            {!['library','training-grounds','castle','zen-garden','temple','sawmill','stone-quarry','house','mansion'].includes(tile.id) && "Contributes to kingdom growth"}
          </p>
        )}
        <div className="mt-auto space-y-3">
          <div className="flex flex-col gap-1.5 bg-black/40 rounded-lg p-2.5 border border-white/5 shadow-inner">
            <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-0.5">
              <span>Property Stats</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                <span>Verified</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">On Map</span>
                <span className="text-sm font-black text-blue-400">{placedCount}</span>
              </div>
              <div className="h-8 w-px bg-white/5" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">In Stash</span>
                <span className={cn("text-sm font-black", (owned - placedCount) > 0 ? "text-emerald-400" : "text-zinc-600")}>
                  {Math.max(0, owned - placedCount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isPlaceMode ? (
          <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold mt-auto h-8 text-xs">Place Now</Button>
        ) : (
          <div className="space-y-2 mt-auto">
            <div className={cn("bg-black/40 rounded-lg p-2 border border-white/5", isLocked && "opacity-50")}>
              <div className="flex flex-col gap-1.5">
                {(goldCost > 0 || (!hasMaterialCost && !hasTokenCost)) && (
                  <div className="flex items-center justify-between text-xs text-amber-500 font-bold">
                    <span className="flex items-center gap-1"><Coins className="w-3 h-3" /> {goldCost}g</span>
                  </div>
                )}
                {hasMaterialCost && tile.materialCost?.map((mat, idx) => {
                  const count = getMaterialCount?.(mat.itemId) || 0;
                  const isEnough = count >= mat.quantity;
                  const progress = Math.min(100, (count / mat.quantity) * 100);
                  const matName = mat.itemId.replace('material-', '');
                  return (
                    <div key={idx} className="flex flex-col gap-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span className={isEnough ? "text-green-500" : "text-slate-400"}>{mat.quantity}x {matName}</span>
                        {!isEnough && <span className="text-red-500/70">{count}/{mat.quantity}</span>}
                        {isEnough && <Check className="w-3 h-3 text-green-500" />}
                      </div>
                      {!isEnough && (
                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-600/50" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
                <Button
                  size="sm"
                  className={cn("w-full h-7 text-xs font-bold", isAffordable ? "bg-emerald-600 hover:bg-emerald-500" : "bg-amber-900/40")}
                  disabled={isLocked}
                  onClick={(e) => { e.stopPropagation(); onAction?.(hasMaterialCost ? 'materials' : 'gold', e); }}
                >
                  {isAffordable ? 'Acquire Now' : 'Acquire'}
                </Button>
              </div>
            </div>
            {hasTokenCost && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                onClick={(e) => { e.stopPropagation(); onAction?.('tokens', e); }}
                disabled={isLocked}
              >
                <Crown className="w-3 h-3 mr-1" /> {tile.tokenCost} Tokens
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}