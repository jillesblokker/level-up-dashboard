"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hammer, Coins } from "lucide-react";
import { comprehensiveItems } from "@/app/lib/comprehensive-items";
import { useUser } from "@clerk/nextjs";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { logger } from "@/lib/logger";
import { equipItem, unequipItem } from "@/lib/inventory-manager";
import { KINGDOM_TILES } from "@/lib/kingdom-tiles";
import { useToast } from "@/components/ui/use-toast";
import { TEXT_CONTENT } from "@/lib/text-content";

// --- Types ---

interface KingdomInventoryItem {
  id: string;
  name: string;
  type: string;
  category?: string;
  quantity: number;
  emoji?: string;
  image?: string;
  stats?: Record<string, number>;
  description?: string;
  equipped?: boolean;
  canEquip?: boolean;
  canUse?: boolean;
  sellPrice?: number;
}

interface Recipe {
  id: string;
  targetItemId: string;
  goldCost: number;
  materials: { itemId: string; quantity: number }[];
}

const FORGE_RECIPES: Recipe[] = [
  { id: 'craft-sword-irony',      targetItemId: 'sword-irony',      goldCost: 50,    materials: [
      { itemId: 'sword-twig', quantity: 1 },
      { itemId: 'material-steel', quantity: 5 },
      { itemId: 'material-planks', quantity: 2 }
    ] },
  { id: 'craft-sword-morningstar', targetItemId: 'sword-morningstar', goldCost: 120,    materials: [
      { itemId: 'sword-irony', quantity: 1 },
      { itemId: 'material-steel', quantity: 8 },
      { itemId: 'material-planks', quantity: 3 },
      { itemId: 'material-crystal', quantity: 1 }
    ] },
  { id: 'craft-sword-sunblade',   targetItemId: 'sword-sunblade',   goldCost: 250,    materials: [
      { itemId: 'sword-morningstar', quantity: 1 },
      { itemId: 'material-silver', quantity: 10 },
      { itemId: 'material-crystal', quantity: 5 }
    ] },
  { id: 'craft-sword-solaraxe',   targetItemId: 'sword-solaraxe',   goldCost: 500,    materials: [
      { itemId: 'sword-sunblade', quantity: 1 },
      { itemId: 'material-gold', quantity: 15 },
      { itemId: 'material-crystal', quantity: 10 }
    ] },
  { id: 'craft-shield-defecto',   targetItemId: 'shield-defecto',   goldCost: 40,    materials: [
      { itemId: 'shield-reflecto', quantity: 1 },
      { itemId: 'material-logs', quantity: 5 },
      { itemId: 'material-steel', quantity: 3 }
    ] },
  { id: 'craft-shield-blockado',  targetItemId: 'shield-blockado',  goldCost: 100,    materials: [
      { itemId: 'shield-defecto', quantity: 1 },
      { itemId: 'material-steel', quantity: 8 },
      { itemId: 'material-planks', quantity: 2 },
      { itemId: 'material-crystal', quantity: 1 }
    ] },
  { id: 'craft-armor-darko',      targetItemId: 'armor-darko',      goldCost: 60,    materials: [
      { itemId: 'armor-normalo', quantity: 1 },
      { itemId: 'material-logs', quantity: 4 },
      { itemId: 'material-steel', quantity: 2 }
    ] },
  { id: 'craft-armor-silvo',      targetItemId: 'armor-silvo',      goldCost: 300,    materials: [
      { itemId: 'armor-darko', quantity: 1 },
      { itemId: 'material-silver', quantity: 8 },
      { itemId: 'material-crystal', quantity: 4 }
    ] },
  { id: 'craft-potion-exp',       targetItemId: 'potion-exp',       goldCost: 50,  materials: [{ itemId: 'material-crystal', quantity: 3 }, { itemId: 'food-red', quantity: 1 }] },
];

const ITEM_CATEGORIES = [
  { value: 'all',        label: 'All',         emoji: '🎒' },
  { value: 'weapon',     label: 'Weapons',     emoji: '🗡️' },
  { value: 'shield',     label: 'Shields',     emoji: '🛡️' },
  { value: 'armor',      label: 'Armor',       emoji: '🦺' },
  { value: 'artifact',   label: 'Artifacts',   emoji: '🏺' },
  { value: 'mount',      label: 'Mounts',      emoji: '🐎' },
  { value: 'consumable', label: 'Consumables', emoji: '🧪' },
  { value: 'material',   label: 'Materials',   emoji: '🌿' },
  { value: 'scroll',     label: 'Scrolls',     emoji: '📜' },
];

interface InventoryBagOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function InventoryBagOverlay({ open, onClose }: InventoryBagOverlayProps) {
  const { user } = useUser();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('stored');
  const [storedFilter, setStoredFilter] = useState('all');
  
  const [inventoryItems, setInventoryItems] = useState<KingdomInventoryItem[]>([]);
  const [equippedItems, setEquippedItems] = useState<KingdomInventoryItem[]>([]);
  const [storedItems, setStoredItems] = useState<KingdomInventoryItem[]>([]);
  
  const [playerGold, setPlayerGold] = useState(0);
  const [isCrafting, setIsCrafting] = useState<string | null>(null);
  const [floatingCosts, setFloatingCosts] = useState<{ id: number, x: number, y: number, text: string }[]>([]);

  const isInventoryLoadingRef = useRef(false);

  // --- Data Fetching ---
  const loadInventory = useCallback(async () => {
    if (!user?.id || isInventoryLoadingRef.current) return;
    try {
      isInventoryLoadingRef.current = true;
      
      const [inventoryRes, statsRes] = await Promise.all([
        fetchWithAuth(`/api/inventory?_t=${Date.now()}`).catch(() => null),
        fetchWithAuth(`/api/character-stats?_t=${Date.now()}`).catch(() => null)
      ]);

      let allItems: any[] = [];
      if (inventoryRes?.ok) {
        try {
          const json = await inventoryRes.json();
          if (json.success && Array.isArray(json.data)) {
            allItems = json.data;
          }
        } catch (e) {
          logger.warn('[Bag] Failed to parse inventory JSON', e);
        }
      }

      if (statsRes?.ok) {
        try {
          const stats = await statsRes.json();
          setPlayerGold(stats.gold || 0);
        } catch (e) {
          logger.warn('[Bag] Failed to parse stats JSON', e);
        }
      }

      const normalize = (items: any[]) => {
        const mapped = (Array.isArray(items) ? items : []).map(item => {
          // Map legacy DB names to their comprehensive IDs
          let lookupId = item.id;
          if (lookupId.toLowerCase() === 'blanko') lookupId = 'armor-blanko';
          else if (lookupId.toLowerCase() === 'sunblade') lookupId = 'sword-sunblade';
          else if (lookupId.toLowerCase() === 'logs') lookupId = 'material-logs';
          else if (lookupId.toLowerCase() === 'scroll of perkament') lookupId = 'scroll-perkamento';
          else if (lookupId.toLowerCase() === 'scroll of scrolly') lookupId = 'scroll-scrolly';
          
          const comp = comprehensiveItems.find(i => i.id === lookupId || i.id.toLowerCase() === lookupId.toLowerCase() || i.name.toLowerCase() === item.name?.toLowerCase());
          
          // Completely ignore and hide items that don't match the compendium
          if (!comp) return null;

          let finalType = (comp.type || 'item').toLowerCase();
          let finalCategory = (comp.category || 'item').toLowerCase();

          // Ensure strict categories
          if (finalType === 'potion' || finalType === 'food' || finalType === 'consumable') finalCategory = 'consumable';
          else if (finalType === 'material') finalCategory = 'material';
          else if (finalType === 'artifact') finalCategory = 'artifact';

          return {
            ...item,
            id: comp.id,
            name: comp.name,
            type: finalType as any,
            category: finalCategory,
            stats: comp.stats || {},
            description: comp.description || '',
            image: comp.image,
            emoji: comp.emoji,
          } as KingdomInventoryItem;
        }).filter(item => {
          if (!item) return false;
          // Strict Tile Filter: if it's in KINGDOM_TILES, it doesn't belong in the item bag!
          if (KINGDOM_TILES.some(t => t.id === item.id)) return false;
          // Also explicitly catch 'cornerroad' or other generic tile names
          if (['cornerroad', 'straightroad', 'crossroad', 'tsplitroad'].includes(item.id)) return false;
          return true;
        }) as KingdomInventoryItem[];

        // Combine duplicates
        const combined = new Map<string, KingdomInventoryItem>();
        mapped.forEach(item => {
          if (combined.has(item.id)) {
            const existing = combined.get(item.id)!;
            existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
          } else {
            combined.set(item.id, { ...item });
          }
        });
        
        return Array.from(combined.values());
      };

      const equipped = allItems.filter((i: any) => i.equipped);
      const stored = allItems.filter((i: any) => !i.equipped);

      const normEquipped = normalize(equipped);

      if (normEquipped.length === 0) {
        const defaults = (comprehensiveItems || []).filter(i => i.isDefault).map(item => ({
          ...item,
          stats: item.stats || {},
          description: item.description || '',
          equipped: true,
          quantity: 1,
          type: item.type as any,
          category: item.type,
        })) as KingdomInventoryItem[];
        setEquippedItems(defaults);
      } else {
        setEquippedItems(normEquipped);
      }

      setStoredItems(normalize(stored));
      setInventoryItems(normalize(allItems));
    } finally {
      isInventoryLoadingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (open) {
      loadInventory();
    }
  }, [open, loadInventory]);

  useEffect(() => {
    const handleUpdate = () => {
      // Re-fetch when the inventory updates
      loadInventory();
    };
    window.addEventListener('character-inventory-update', handleUpdate);
    return () => window.removeEventListener('character-inventory-update', handleUpdate);
  }, [loadInventory]);

  // --- Actions ---

  const isEquippable = (item: KingdomInventoryItem) => {
    return ['weapon', 'armor', 'shield', 'equipment', 'helmet', 'boots', 'gloves', 'ring', 'necklace', 'mount'].includes(item.type) || 
           (item.category && ['weapon', 'armor', 'shield', 'equipment', 'mount'].includes(item.category));
  };

  const isConsumable = (item: KingdomInventoryItem) => {
    return item.type === 'artifact' || item.type === 'scroll' || item.type === 'potion' || (item.type === 'item' && !item.category);
  };

  const getItemSellPrice = (item: KingdomInventoryItem): number => {
    const basePrices: Record<string, number> = {
      'weapon': 50, 'armor': 40, 'shield': 35, 'helmet': 25, 'boots': 20,
      'gloves': 15, 'ring': 30, 'necklace': 35, 'artifact': 100, 'scroll': 25,
      'potion': 15, 'food': 8, 'material': 5, 'item': 10
    };
    const basePrice = basePrices[item.type] || 10;
    let bonus = 0;
    if (item.stats) {
      Object.values(item.stats).forEach(stat => {
        if (typeof stat === 'number') bonus += stat * 5;
      });
    }
    const itemName = item.name.toLowerCase();
    if (itemName.includes('golden') || itemName.includes('rainbow') || itemName.includes('legendary')) bonus += 25;
    else if (itemName.includes('epic') || itemName.includes('dragon')) bonus += 20;
    else if (itemName.includes('rare') || itemName.includes('silver')) bonus += 15;
    else if (itemName.includes('iron') || itemName.includes('steel') || itemName.includes('magic')) bonus += 12;
    else if (itemName.includes('gold') || itemName.includes('crystal')) bonus += 8;

    if (item.type === 'artifact') bonus += 30;
    if (item.type === 'weapon' && itemName.includes('sword')) bonus += 10;
    if (item.type === 'armor' && itemName.includes('plate')) bonus += 15;

    return Math.max(5, basePrice + bonus);
  };

  const handleEquip = async (item: KingdomInventoryItem) => {
    if (isConsumable(item)) {
      if (user?.id) {
        try {
          await fetch('/api/inventory', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: item.id, quantity: 1 })
          });
          toast({
            title: "Used Item",
            description: `You used ${item.name}`,
          });
          window.dispatchEvent(new Event('character-inventory-update'));
        } catch (e) {
          logger.error('[Bag] Failed to remove consumable after use', e);
        }
      }
      return;
    }
    if (user?.id) equipItem(user.id, item.id);
  };

  const handleUnequip = (item: KingdomInventoryItem) => {
    if (user?.id) unequipItem(user.id, item.id);
  };

  const handleSellItem = async (item: KingdomInventoryItem) => {
    if (!user?.id) return;
    const sellPrice = getItemSellPrice(item);
    try {
      const response = await fetch('/api/inventory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, quantity: 1 })
      });
      if (!response.ok) throw new Error('Failed to remove item');

      await fetch('/api/character-stats/add-gold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: sellPrice })
      });

      toast({
        title: TEXT_CONTENT.kingdom.ui.sellSuccess.title,
        description: TEXT_CONTENT.kingdom.ui.sellSuccess.description.replace('{amount}', sellPrice.toString()),
      });
      window.dispatchEvent(new Event('character-inventory-update'));
    } catch (error) {
      logger.error('[Bag] Error selling item:', error);
      toast({
        title: TEXT_CONTENT.kingdom.ui.inventory.sellError.title,
        description: TEXT_CONTENT.kingdom.ui.inventory.sellError.description,
        variant: "destructive",
      });
    }
  };

  const handleCraft = async (recipe: Recipe) => {
    if (!user?.id || isCrafting) return;
    try {
      setIsCrafting(recipe.id);
      const response = await fetch('/api/inventory/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: recipe.id })
      });

      if (!response.ok) throw new Error('Failed to forge item');

      toast({
        title: "Forging Successful!",
        description: "Your new item has been crafted.",
      });

      window.dispatchEvent(new Event('character-inventory-update'));
    } catch (error: any) {
      logger.error('[Bag] Forge Error:', error);
      toast({
        title: "Forging Failed",
        description: error.message || "Could not craft this item.",
        variant: "destructive"
      });
    } finally {
      setIsCrafting(null);
    }
  };

  // --- Rendering ---
  
  const fullInventory = [
    ...equippedItems.map(i => ({ ...i, equipped: true, canEquip: isEquippable(i), canUse: isConsumable(i), sellPrice: getItemSellPrice(i) })),
    ...storedItems.map(i => ({ ...i, equipped: false, canEquip: isEquippable(i), canUse: isConsumable(i), sellPrice: getItemSellPrice(i) }))
  ];

  const equippedInventoryView = fullInventory.filter(i => i.equipped);
  const storedInventoryView = fullInventory.filter(i => !i.equipped);

  const filteredStored = storedInventoryView.filter(item => {
    if (storedFilter === 'all') return true;
    return item.type === storedFilter || item.category === storedFilter;
  });

  const getOwnedQty = (itemId: string) => {
    const match = inventoryItems.find((i: any) => i.id === itemId);
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
    const rawName = typeof item.name === 'string' ? item.name : '';
    const cleanName = rawName.replace(/\.(webp|png|jpg|jpeg)$/i, '').trim();

    const compItem = comprehensiveItems.find(i => 
      i.id === item.id || 
      i.id === cleanName || 
      i.id === cleanName.toLowerCase() ||
      i.id === cleanName.toLowerCase().replace(/\s+/g, '-')
    );
    const emoji = item.emoji || compItem?.emoji;
    
    let defaultImage = '';
    if (!compItem && cleanName.startsWith('material-')) defaultImage = `/images/items/materials/${cleanName}.webp`;
    else if (!compItem && cleanName.startsWith('armor-')) defaultImage = `/images/items/armor/${cleanName}.webp`;
    else if (!compItem && cleanName.startsWith('potion-')) defaultImage = `/images/items/potion/${cleanName}.webp`;
    
    const image = item.image || compItem?.image || defaultImage;
    
    let displayName = compItem?.name || cleanName;
    if (displayName === 'Blanko Armor' || cleanName === 'armor-blanko') displayName = 'Blanko';
    if (displayName === 'Wooden Logs' || cleanName === 'material-logs') displayName = 'Logs';
    if (displayName === 'Wooden Planks' || cleanName === 'material-planks') displayName = 'Planks';
    if (displayName === 'Normalo Armor' || cleanName === 'armor-normalo') displayName = 'Normalo';
    if (cleanName === 'material-stone-block') displayName = 'Stone';

    const displayType = item.type;

    return (
      <div
        key={item.id}
        className={cn(
          "group relative overflow-hidden rounded-xl border transition-all duration-300 flex flex-col",
          item.equipped 
            ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-400" 
            : "bg-[#0f1115] border-white/5 hover:border-white/20"
        )}
      >
        <div className="p-3 flex-1 flex flex-col">
          <div className="flex gap-3">
            <div className="relative w-16 h-16 shrink-0 rounded-lg bg-black/40 border border-white/10 overflow-hidden group-hover:border-amber-500/50 transition-colors flex items-center justify-center p-1">
              {image ? (
                <Image src={image} alt={displayName} fill sizes="64px" className="object-contain drop-shadow-lg" />
              ) : emoji ? (
                <span className="text-3xl filter drop-shadow-md">{emoji}</span>
              ) : (
                <span className="text-2xl filter drop-shadow-md">📦</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className={cn('font-bold text-sm truncate', item.equipped ? 'text-amber-300' : 'text-white')}>{displayName}</h4>
              <p className="text-[10px] text-zinc-400 line-clamp-3 min-h-[36px] mt-0.5" title={item.description || ''}>{item.description || ''}</p>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[9px] py-0 h-4 border-amber-500/30 text-amber-400">
                  Owned: {item.quantity}
                </Badge>
                {displayType !== 'item' && (
                  <Badge variant="secondary" className="text-[9px] py-0 h-4 bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 capitalize">
                    {displayType}
                  </Badge>
                )}
                {item.equipped && (
                  <Badge className="text-[9px] py-0 h-4 bg-amber-600 text-white">
                    Equipped
                  </Badge>
                )}
              </div>

              {/* Material Stock Cap Progress Bar (Point 4) */}
              {(cleanName.startsWith('material-') || item.category === 'material' || item.type === 'material') && (() => {
                const isRareMat = item.id === 'material-crystal' || item.id === 'material-steel' || item.id === 'material-silver' || item.id === 'material-gold';
                const materialCap = isRareMat ? 10 : 50;
                return (
                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                      <span>Pouch Limit</span>
                      <span>{item.quantity}/{materialCap}</span>
                    </div>
                    <div className="w-full bg-zinc-950 border border-white/5 rounded-full h-1 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          (item.quantity / materialCap) >= 1 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-amber-600/70"
                        )} 
                        style={{ width: `${Math.min(100, (item.quantity / materialCap) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3 flex-1 flex flex-col justify-end">
            {(item.equipped || item.canEquip || item.canUse) && (
              <Button
                size="sm"
                onClick={() => item.equipped ? handleUnequip(item) : handleEquip(item)}
                className={cn(
                  "w-full h-8 text-xs font-bold text-white shadow-md",
                  item.equipped ? 'bg-red-600 hover:bg-red-700' : 
                  item.canUse ? 'bg-amber-600 hover:bg-amber-700' : 
                  'bg-emerald-600 hover:bg-emerald-700'
                )}
              >
                {item.equipped ? 'Unequip Item' : item.canUse ? 'Use Item' : 'Equip Item'}
              </Button>
            )}
            {!item.equipped && item.sellPrice !== undefined && item.sellPrice > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSellItem(item)}
                className="w-full h-8 text-xs bg-orange-950/40 hover:bg-orange-900 border-orange-500/50 text-orange-400 font-bold"
              >
                Sell ({item.sellPrice}g)
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/50 " role="dialog" aria-modal="true">
      <div className="bg-[#0f1115] w-full max-w-xl h-full border-l border-amber-900/30 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-900/20 bg-[#13161b]">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold font-cardo text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 flex items-center gap-3 drop-shadow-sm">
              <span className="text-3xl filter drop-shadow-md">🎒</span>
              Your Bag
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full"
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-[#1a1d24]">
            <TabsList className="grid grid-cols-3 bg-[#0f1115] border border-white/5 p-1 rounded-xl shadow-inner">
              <TabsTrigger value="equipped" className="rounded-lg data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all text-xs font-bold tracking-wide uppercase">Equipped</TabsTrigger>
              <TabsTrigger value="stored" className="rounded-lg data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all text-xs font-bold tracking-wide uppercase">Stored</TabsTrigger>
              <TabsTrigger value="forge" className="rounded-lg data-[state=active]:bg-orange-600 data-[state=active]:text-white transition-all text-xs font-bold tracking-wide uppercase flex items-center gap-2">
                <Hammer className="w-3 h-3" /> Forge
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 bg-[#13161b] custom-scrollbar">
            {/* ── EQUIPPED tab ──────────────────────────────────────────── */}
            <TabsContent value="equipped" className="mt-4">
              {equippedInventoryView.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400 border border-dashed border-zinc-700 rounded-xl bg-zinc-950">
                  <span className="text-5xl mb-4">🛡️</span>
                  <h3 className="text-lg font-medium text-amber-500/80 mb-1">Nothing Equipped</h3>
                  <p className="text-sm max-w-xs mb-4">Go to your Stored items to equip gear.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
                  {equippedInventoryView.map(renderItemCard)}
                </div>
              )}
            </TabsContent>

            {/* ── STORED tab ────────────────────────────────────────────── */}
            <TabsContent value="stored" className="mt-4">
              <div className="flex flex-wrap gap-1.5 mb-4">
                {ITEM_CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setStoredFilter(cat.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all duration-200',
                      storedFilter === cat.value
                        ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.45)]'
                        : 'bg-[#1a1d24] border-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-200'
                    )}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>

              {filteredStored.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400 border border-dashed border-zinc-700 rounded-xl bg-zinc-950">
                  <span className="text-5xl mb-4">🎒</span>
                  <h3 className="text-lg font-medium text-amber-500/80 mb-1">
                    {storedFilter === 'all' ? 'Bag is Empty' : `No ${storedFilter} items`}
                  </h3>
                  <p className="text-sm max-w-xs mb-4">Complete quests, collect from tiles and dungeons to fill your bag.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
                  {filteredStored.map(renderItemCard)}
                </div>
              )}
            </TabsContent>

            {/* ── FORGE tab ─────────────────────────────────────────────── */}
            <TabsContent value="forge" className="mt-4">
              <div className="mb-6 p-4 rounded-xl bg-orange-950/20 border border-orange-500/30 flex items-center justify-between shadow-inner">
                <div>
                  <h3 className="font-bold text-orange-400 flex items-center gap-2">
                    <Hammer className="w-4 h-4" /> The Forge
                  </h3>
                  <p className="text-xs text-orange-400/70 mt-1">Combine materials to craft powerful items.</p>
                </div>
                <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg border border-orange-900/50">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-amber-400">{playerGold}</span>
                </div>
              </div>

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
                        <div className="w-12 h-12 shrink-0 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center text-2xl">
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
                                'border-zinc-500 text-zinc-400'
                              )}>
                                {item.rarity}
                              </Badge>
                            )}
                          </div>

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

                        <Button
                          size="sm"
                          disabled={!canCraft || isCrafting !== null}
                          onClick={() => handleCraft(recipe)}
                          className={cn(
                            'shrink-0 h-9 text-xs font-bold w-20',
                            canCraft
                              ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg'
                              : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
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