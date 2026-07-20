"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Hammer, Coins, Sword, Shield, ArrowRight, Zap, Sparkles, RefreshCw, Flame, Check } from "lucide-react";
import { AlchemyLab } from "@/components/quests/alchemy-lab";
import { Progress } from "@/components/ui/progress";
import { comprehensiveItems } from "@/app/lib/comprehensive-items";
import { useUser } from "@clerk/nextjs";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { logger } from "@/lib/logger";
import { equipItem, unequipItem } from "@/lib/inventory-manager";
import { KINGDOM_TILES } from "@/lib/kingdom-tiles";
import { useToast } from "@/components/ui/use-toast";
import { TEXT_CONTENT } from "@/lib/text-content";
import { getUserPreference, setUserPreference } from "@/lib/user-preferences-manager";

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
  dbId?: string;
  rarity?: string;
}

interface Recipe {
  id: string;
  targetItemId: string;
  goldCost: number;
  materials: { itemId: string; quantity: number }[];
  hint: string;
}

const FORGE_RECIPES: Recipe[] = [
  { id: 'craft-sword-irony',      targetItemId: 'sword-irony',      goldCost: 50,    materials: [
      { itemId: 'sword-twig', quantity: 1 },
      { itemId: 'material-steel', quantity: 5 },
      { itemId: 'material-planks', quantity: 2 }
    ],
    hint: 'A wooden training sword reinforced with refined steel ingots and sturdy timber'
  },
  { id: 'craft-sword-morningstar', targetItemId: 'sword-morningstar', goldCost: 120,    materials: [
      { itemId: 'sword-irony', quantity: 1 },
      { itemId: 'material-steel', quantity: 8 },
      { itemId: 'material-planks', quantity: 3 },
      { itemId: 'material-crystal', quantity: 1 }
    ],
    hint: 'An iron blade honed with dense steel, timber supports, and a glowing crystal'
  },
  { id: 'craft-sword-sunblade',   targetItemId: 'sword-sunblade',   goldCost: 250,    materials: [
      { itemId: 'sword-morningstar', quantity: 1 },
      { itemId: 'material-silver', quantity: 10 },
      { itemId: 'material-crystal', quantity: 5 }
    ],
    hint: 'A morningstar blade fused with gleaming silver bars and radiant essence crystals'
  },
  { id: 'craft-sword-solaraxe',   targetItemId: 'sword-solaraxe',   goldCost: 500,    materials: [
      { itemId: 'sword-sunblade', quantity: 1 },
      { itemId: 'material-gold', quantity: 15 },
      { itemId: 'material-crystal', quantity: 10 }
    ],
    hint: 'A sunblade forged with pure gold bars and a heavy payload of essence crystals'
  },
  { id: 'craft-shield-defecto',   targetItemId: 'shield-defecto',   goldCost: 40,    materials: [
      { itemId: 'shield-reflecto', quantity: 1 },
      { itemId: 'material-logs', quantity: 5 },
      { itemId: 'material-steel', quantity: 3 }
    ],
    hint: 'A simple wooden shield bound with heavy forest logs and solid steel ingots'
  },
  { id: 'craft-shield-blockado',  targetItemId: 'shield-blockado',  goldCost: 100,    materials: [
      { itemId: 'shield-defecto', quantity: 1 },
      { itemId: 'material-steel', quantity: 8 },
      { itemId: 'material-planks', quantity: 2 },
      { itemId: 'material-crystal', quantity: 1 }
    ],
    hint: 'A defecto shield plated with steel ingots, wooden planks, and a protective crystal'
  },
  { id: 'craft-armor-darko',      targetItemId: 'armor-darko',      goldCost: 60,    materials: [
      { itemId: 'armor-normalo', quantity: 1 },
      { itemId: 'material-logs', quantity: 4 },
      { itemId: 'material-steel', quantity: 2 }
    ],
    hint: 'Basic tunic armor reinforced with sturdy timber logs and protective steel ingots'
  },
  { id: 'craft-armor-silvo',      targetItemId: 'armor-silvo',      goldCost: 300,    materials: [
      { itemId: 'armor-darko', quantity: 1 },
      { itemId: 'material-silver', quantity: 8 },
      { itemId: 'material-crystal', quantity: 4 }
    ],
    hint: 'Darkened armor woven with gleaming silver bars and protective essence crystals'
  },
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
  const [forgeSubTab, setForgeSubTab] = useState<'craft' | 'upgrade'>('craft');
  const [selectedUpgradeItem, setSelectedUpgradeItem] = useState<KingdomInventoryItem | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [floatingCosts, setFloatingCosts] = useState<{ id: number, x: number, y: number, text: string }[]>([]);

  // Anvil Forge State
  const [unlockedForgeRecipes, setUnlockedForgeRecipes] = useState<string[]>(['craft-sword-irony', 'craft-shield-defecto', 'craft-armor-darko']);
  const [anvil, setAnvil] = useState<Record<string, number>>({});
  const [forgeState, setForgeState] = useState<'idle' | 'crafting' | 'success' | 'error'>('idle');
  const [forgedItem, setForgedItem] = useState<{ name: string; emoji: string; rarity: string; newlyDiscovered?: boolean } | null>(null);

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

          const dbStats = item.stats || {};
          const mergedStats = { ...(comp.stats || {}), ...dbStats };
          
          let itemName = item.name || comp.name;
          const upgradeLvl = dbStats.upgradeLevel || 0;
          if (upgradeLvl > 0 && !itemName.includes('+')) {
            itemName = `${itemName} +${upgradeLvl}`;
          }

          return {
            ...item,
            dbId: item.dbId || item.id, // Store DB UUID
            id: comp.id,
            name: itemName,
            type: finalType as any,
            category: finalCategory,
            stats: mergedStats,
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
          // Unique key: for equippable gear, distinguish by item ID and upgrade level
          const isEquippable = ['weapon', 'shield', 'armor'].includes(item.type);
          const upgradeLevel = item.stats?.['upgradeLevel'] || 0;
          const uniqueKey = isEquippable ? `${item.id}_lvl_${upgradeLevel}` : item.id;

          if (combined.has(uniqueKey)) {
            const existing = combined.get(uniqueKey)!;
            existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
          } else {
            combined.set(uniqueKey, { ...item });
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

  const loadForgeData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const prefUnlocked = await getUserPreference('unlocked_forge_recipes');
      if (Array.isArray(prefUnlocked)) {
        setUnlockedForgeRecipes(Array.from(new Set(['craft-sword-irony', 'craft-shield-defecto', 'craft-armor-darko', ...prefUnlocked])));
      } else {
        setUnlockedForgeRecipes(['craft-sword-irony', 'craft-shield-defecto', 'craft-armor-darko']);
      }
    } catch (e) {
      logger.error('Error loading unlocked forge recipes:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    if (open) {
      loadInventory();
      loadForgeData();
    }
  }, [open, loadInventory, loadForgeData]);

  useEffect(() => {
    const handleUpdate = () => {
      // Re-fetch when the inventory updates
      loadInventory();
      loadForgeData();
    };
    window.addEventListener('character-inventory-update', handleUpdate);
    return () => window.removeEventListener('character-inventory-update', handleUpdate);
  }, [loadInventory, loadForgeData]);

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

          // Apply custom Alchemy buffs
          if (item.id === 'potion-forge-luck') {
            const current: any = await getUserPreference('active_alchemy_buffs') || {};
            await setUserPreference('active_alchemy_buffs', {
              ...current,
              forgeLuckCharges: (current.forgeLuckCharges || 0) + 1
            });
            toast({
              title: "Forge Luck Activated! 🧪✨",
              description: "Tempering success rate increased by +10% for your next upgrade attempt."
            });
          } else if (item.id === 'potion-combat-protection') {
            const current: any = await getUserPreference('active_alchemy_buffs') || {};
            await setUserPreference('active_alchemy_buffs', {
              ...current,
              combatProtectionCharges: (current.combatProtectionCharges || 0) + 1
            });
            toast({
              title: "Shield Barrier Activated! 🧪🛡️",
              description: "Your gold is safe from losses on the next round failure in Monster Battles."
            });
          } else if (item.id === 'potion-double-harvest') {
            const current: any = await getUserPreference('active_alchemy_buffs') || {};
            const next24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            await setUserPreference('active_alchemy_buffs', {
              ...current,
              doubleHarvestUntil: next24h
            });
            toast({
              title: "Nourishing Draught Consumed! 🧪🐟",
              description: "Citizen harvesting yields are doubled for the next 24 hours!"
            });
          } else if (item.id === 'potion-health') {
            let maxHealth = 100;
            let currentHealth = 100;
            try {
              const statsRes = await fetch('/api/character-stats');
              if (statsRes.ok) {
                const statsData = await statsRes.json();
                maxHealth = statsData.maxHealth || statsData.max_health || 100;
                currentHealth = statsData.health || 100;
              }
            } catch (e) {
              logger.warn('[Bag] Failed to fetch stats for health potion', e);
            }
            const nextHealth = Math.min(currentHealth + 50, maxHealth);
            await fetch('/api/character-stats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stats: { health: nextHealth } })
            });
            toast({
              title: "Health Restored! ❤️",
              description: `Restored 50 HP. Health: ${nextHealth}/${maxHealth}`
            });
          } else if (item.id === 'potion-mana') {
            let maxMana = 100;
            let currentMana = 100;
            try {
              const statsRes = await fetch('/api/character-stats');
              if (statsRes.ok) {
                const statsData = await statsRes.json();
                maxMana = statsData.maxMana || 100;
                currentMana = statsData.mana || 100;
              }
            } catch (e) {
              logger.warn('[Bag] Failed to fetch stats for mana potion', e);
            }
            const nextMana = Math.min(currentMana + 50, maxMana);
            await fetch('/api/character-stats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stats: { mana: nextMana } })
            });
            toast({
              title: "Mana Restored! 🌀",
              description: `Restored 50 Mana. Current: ${nextMana}/${maxMana}`
            });
          } else if (item.id === 'potion-stamina') {
            let maxStamina = 100;
            let currentStamina = 100;
            try {
              const statsRes = await fetch('/api/character-stats');
              if (statsRes.ok) {
                const statsData = await statsRes.json();
                maxStamina = statsData.maxStamina || 100;
                currentStamina = statsData.stamina || 100;
              }
            } catch (e) {
              logger.warn('[Bag] Failed to fetch stats for stamina potion', e);
            }
            const nextStamina = Math.min(currentStamina + 75, maxStamina);
            await fetch('/api/character-stats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stats: { stamina: nextStamina } })
            });
            toast({
              title: "Stamina Restored! 💪",
              description: `Restored 75 Stamina. Current: ${nextStamina}/${maxStamina}`
            });
          } else if (item.id === 'potion-exp') {
            await fetch('/api/character-stats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deltas: [{ stat: 'experience', delta: 100 }] })
            });
            toast({
              title: "Experience Gained! ⭐",
              description: "Consumed Experience Potion. Gained +100 XP!"
            });
          } else if (item.id === 'potion-gold') {
            await fetch('/api/character-stats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deltas: [{ stat: 'gold', delta: 200 }] })
            });
            toast({
              title: "Gold Potion Consumed! 🪙",
              description: "Added +200 Gold to your character stats."
            });
          } else {
            toast({
              title: "Used Item",
              description: `You used ${item.name}`,
            });
          }

          window.dispatchEvent(new Event('character-inventory-update'));
          // Dispatch custom event to update active buffs state in UI tabs
          window.dispatchEvent(new Event('alchemy-buffs-update'));
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

  const addMaterialToAnvil = (id: string) => {
    if (forgeState === 'crafting') return;
    const totalQty = getOwnedQty(id);
    if (totalQty === 0) return;
    const itemComp = comprehensiveItems.find(c => c.id === id);
    const currentQtyOnAnvil = anvil[id] || 0;
    if (currentQtyOnAnvil >= totalQty) {
      toast({
        title: "Limit Reached",
        description: `You only have ${totalQty}x ${itemComp?.name || id} in your bag.`,
        variant: "destructive"
      });
      return;
    }
    setAnvil(prev => ({
      ...prev,
      [id]: currentQtyOnAnvil + 1
    }));
  };

  const removeMaterialFromAnvil = (id: string) => {
    if (forgeState === 'crafting') return;
    setAnvil(prev => {
      const copy = { ...prev };
      const val = copy[id] || 0;
      if (val <= 1) {
        delete copy[id];
      } else {
        copy[id] = val - 1;
      }
      return copy;
    });
  };

  const clearAnvil = () => {
    if (forgeState === 'crafting') return;
    setAnvil({});
  };

  const selectForgeRecipe = (recipe: Recipe) => {
    if (forgeState === 'crafting') return;

    // Verify ingredients using getOwnedQty (same source as displayed badges)
    const missing: string[] = [];
    recipe.materials.forEach(req => {
      const owned = getOwnedQty(req.itemId);
      if (owned < req.quantity) {
        const itemComp = comprehensiveItems.find(c => c.id === req.itemId);
        const name = itemComp ? itemComp.name : req.itemId;
        missing.push(`${req.quantity}x ${name} (have ${owned} available)`);
      }
    });

    if (missing.length > 0) {
      toast({
        title: "Not Enough Materials",
        description: `Missing: ${missing.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    // Replace anvil contents with exactly this recipe's materials (forge = 1 item per craft)
    const nextAnvil: Record<string, number> = {};
    recipe.materials.forEach(req => {
      nextAnvil[req.itemId] = req.quantity;
    });
    setAnvil(nextAnvil);

    toast({
      title: "Materials Loaded",
      description: `Loaded ingredients for ${comprehensiveItems.find(i => i.id === recipe.targetItemId)?.name || 'item'} onto the anvil.`
    });
  };

  const forgeAnvilItem = async () => {
    if (forgeState === 'crafting' || Object.keys(anvil).length === 0) return;

    // Find matching recipe
    let matched: Recipe | null = null;
    for (const recipe of FORGE_RECIPES) {
      if (recipe.materials.length !== Object.keys(anvil).length) continue;
      const isMatch = recipe.materials.every(req => (anvil[req.itemId] || 0) === req.quantity);
      if (isMatch) {
        matched = recipe;
        break;
      }
    }

    if (!matched) {
      setForgeState('crafting');
      setTimeout(() => {
        setForgeState('error');
        setAnvil({});
        toast({
          title: "Forging Failed!",
          description: "The combination of materials on the anvil does not match any blueprints.",
          variant: "destructive"
        });
      }, 2000);
      return;
    }

    // Check gold cost
    if (playerGold < matched.goldCost) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${matched.goldCost}g to forge this item, but you only have ${playerGold}g.`,
        variant: "destructive"
      });
      return;
    }

    try {
      setForgeState('crafting');
      const response = await fetch('/api/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId: matched.id })
      });

      if (!response.ok) {
        const errorJson = await response.json();
        throw new Error(errorJson.error || 'Failed to forge item');
      }

      await response.json();
      const targetItem = comprehensiveItems.find(i => i.id === matched?.targetItemId);
      const isNewDiscovery = matched ? !unlockedForgeRecipes.includes(matched.id) : false;

      setTimeout(async () => {
        setForgeState('success');
        setForgedItem({
          name: targetItem?.name || matched?.targetItemId || 'Forged Item',
          emoji: targetItem?.emoji || '🔨',
          rarity: targetItem?.rarity || 'common',
          newlyDiscovered: isNewDiscovery
        });
        setAnvil({});

        // Unlock recipe if not already unlocked
        if (matched && !unlockedForgeRecipes.includes(matched.id)) {
          const nextUnlocked = [...unlockedForgeRecipes, matched.id];
          setUnlockedForgeRecipes(nextUnlocked);
          try {
            await setUserPreference('unlocked_forge_recipes', nextUnlocked);
          } catch (e) {
            logger.error('Error saving unlocked forge recipes preference:', e);
          }
        }

        // Re-load inventory/gold
        loadInventory();
        window.dispatchEvent(new Event('character-inventory-update'));
      }, 2500);

    } catch (error: any) {
      logger.error('[Forge] Forge error:', error);
      setTimeout(() => {
        setForgeState('error');
        toast({
          title: "Forging Error",
          description: error.message || "Failed to forge item.",
          variant: "destructive"
        });
      }, 2500);
    }
  };

  const playHammerCling = (success: boolean) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(120, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
      gain1.gain.setValueAtTime(0.5, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.3);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(success ? 880 : 330, ctx.currentTime + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(success ? 1760 : 110, ctx.currentTime + 0.6);
      gain2.gain.setValueAtTime(success ? 0.3 : 0.2, ctx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc2.start(ctx.currentTime + 0.05);
      osc2.stop(ctx.currentTime + 0.6);
    } catch { }
  };

  const getUpgradeRequirements = (itemType: string, rarity: string, nextLevel: number) => {
    const goldCost = Math.floor(100 * Math.pow(1.5, nextLevel - 1));
    const materials: { itemId: string; quantity: number }[] = [];

    if (nextLevel <= 3) {
      materials.push({ itemId: 'material-steel', quantity: 3 });
      if (itemType === 'shield') {
        materials.push({ itemId: 'material-planks', quantity: 2 });
      } else {
        materials.push({ itemId: 'material-logs', quantity: 2 });
      }
    } else if (nextLevel <= 7) {
      materials.push({ itemId: 'material-steel', quantity: 5 });
      materials.push({ itemId: 'material-silver', quantity: 3 });
      materials.push({ itemId: 'material-crystal', quantity: 1 });
    } else {
      materials.push({ itemId: 'material-silver', quantity: 8 });
      materials.push({ itemId: 'material-gold', quantity: 3 });
      materials.push({ itemId: 'material-crystal', quantity: 3 });
    }

    if (rarity === 'legendary' || rarity === 'epic') {
      materials.forEach(m => { m.quantity = Math.floor(m.quantity * 1.5); });
    }

    return { goldCost, materials };
  };

  const getSuccessRate = (nextLevel: number) => {
    if (nextLevel <= 3) return 1.0;
    if (nextLevel <= 5) return 0.8;
    if (nextLevel <= 7) return 0.65;
    if (nextLevel <= 9) return 0.45;
    return 0.25;
  };

  const getStatBonus = (rarity: string) => {
    if (rarity === 'common') return 1;
    if (rarity === 'uncommon') return 2;
    if (rarity === 'rare') return 3;
    return 5;
  };

  const handleUpgrade = async (item: KingdomInventoryItem) => {
    if (!user?.id || isUpgrading || !item.dbId) return;

    const currentLevel = item.stats?.['upgradeLevel'] || 0;
    const nextLevel = currentLevel + 1;
    const rarity = item.rarity || 'common';
    const reqs = getUpgradeRequirements(item.type, rarity, nextLevel);

    if (playerGold < reqs.goldCost) {
      toast({
        title: "Insufficient Gold",
        description: "You need more gold to perform this upgrade.",
        variant: "destructive",
      });
      return;
    }

    for (const mat of reqs.materials) {
      if (getOwnedQty(mat.itemId) < mat.quantity) {
        toast({
          title: "Missing Materials",
          description: `You need ${mat.quantity}x ${getMaterialName(mat.itemId)} to proceed.`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsUpgrading(true);

      const bagPanel = document.querySelector('.bag-overlay-container');
      if (bagPanel) {
        bagPanel.classList.add('animate-forge-shake');
        setTimeout(() => bagPanel.classList.remove('animate-forge-shake'), 600);
      }

      const response = await fetch('/api/forge/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbId: item.dbId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upgrade gear');
      }

      const data = await response.json();

      playHammerCling(data.upgraded);

      // Trigger random encounter check for forge
      try {
        const { checkAndTriggerEncounter } = await import('@/lib/encounter-trigger-service');
        checkAndTriggerEncounter('forge');
      } catch (e) {
        logger.warn('Forge encounter check error:', e);
      }

      if (data.upgraded) {
        toast({
          title: "Tempering Success! 🔨✨",
          description: `Upgraded ${item.name} to level +${data.nextLevel}!`,
        });
        setSelectedUpgradeItem(prev => prev ? { ...prev, name: data.name, stats: data.stats } : null);
      } else if (data.degraded) {
        toast({
          title: "Tempering Failure 💢",
          description: `Failed! The item's level degraded to +${data.nextLevel}.`,
          variant: "destructive",
        });
        setSelectedUpgradeItem(prev => prev ? { ...prev, name: data.name, stats: data.stats } : null);
      } else {
        toast({
          title: "Tempering Failure",
          description: "Failed! Materials were lost, but the item level remains unchanged.",
          variant: "destructive",
        });
      }

      window.dispatchEvent(new Event('character-inventory-update'));
    } catch (error: any) {
      logger.error('[Bag] Upgrade Error:', error);
      toast({
        title: "Tempering Failed",
        description: error.message || "An unexpected error occurred during upgrade.",
        variant: "destructive"
      });
    } finally {
      setIsUpgrading(false);
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
          {/* Tags row at the top, spanning full width above the image and info */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3 border-b border-white/5 pb-2">
            <Badge variant="outline" className="text-[9px] py-0.5 px-2 border-amber-500/30 text-amber-400 whitespace-nowrap">
              Owned: {item.quantity}
            </Badge>
            {displayType !== 'item' && (
              <Badge variant="secondary" className="text-[9px] py-0.5 px-2 bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 capitalize whitespace-nowrap">
                {displayType}
              </Badge>
            )}
            {item.equipped && (
              <Badge className="text-[9px] py-0.5 px-2 bg-amber-600 text-white whitespace-nowrap">
                Equipped
              </Badge>
            )}
          </div>

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

  // Stable random values for sparks — generated once, not on every render
  const sparkSeeds = useMemo(() => Array.from({ length: 15 }).map(() => ({
    w: Math.random() * 4 + 2,
    h: Math.random() * 4 + 2,
    left: Math.random() * 60 + 20,
    xDrift: (Math.random() - 0.5) * 160,
    yDrift: -Math.random() * 100 - 50,
    dur: Math.random() * 0.8 + 0.5,
    delay: Math.random() * 0.5
  })), []);

  const renderAnvilSparks = () => {
    const sparkColors = {
      idle: "bg-orange-500/30 shadow-[0_0_4px_rgba(249,115,22,0.3)]",
      crafting: "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse",
      success: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
      error: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
    };

    return sparkSeeds.map((seed, i) => (
      <motion.div
        key={i}
        className={cn("absolute rounded-full", sparkColors[forgeState])}
        style={{
          width: seed.w,
          height: seed.h,
          left: `${seed.left}%`,
          bottom: `55%`
        }}
        animate={forgeState === "crafting" ? {
          x: [0, seed.xDrift],
          y: [0, seed.yDrift],
          opacity: [0, 1, 0],
          scale: [1, 1.5, 0.2]
        } : {
          y: [0, -10],
          opacity: [0, 0.4, 0]
        }}
        transition={{
          duration: seed.dur,
          repeat: Infinity,
          delay: seed.delay
        }}
      />
    ));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/50 " role="dialog" aria-modal="true">
      <div className="bag-overlay-container bg-[#0f1115] w-full max-w-xl h-full border-l border-amber-900/30 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-amber-900/20 bg-[#13161b]">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold font-serif text-amber-300 flex items-center gap-3 drop-shadow-sm">
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
            <TabsList className="grid grid-cols-4 bg-[#0f1115] border border-white/5 p-1 rounded-xl shadow-inner">
              <TabsTrigger value="equipped" className="rounded-lg data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all text-[10px] sm:text-xs font-bold tracking-wide uppercase">Equipped</TabsTrigger>
              <TabsTrigger value="stored" className="rounded-lg data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all text-[10px] sm:text-xs font-bold tracking-wide uppercase">Stored</TabsTrigger>
              <TabsTrigger value="forge" className="rounded-lg data-[state=active]:bg-orange-600 data-[state=active]:text-white transition-all text-[10px] sm:text-xs font-bold tracking-wide uppercase flex items-center gap-1 sm:gap-2 justify-center">
                <Hammer className="w-3 h-3" /> Forge
              </TabsTrigger>
              <TabsTrigger value="alchemy" className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all text-[10px] sm:text-xs font-bold tracking-wide uppercase flex items-center gap-1 sm:gap-2 justify-center">
                <Zap className="w-3 h-3 text-purple-200" /> Alchemy
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

              {/* Sub-tabs for Craft vs Tempering */}
              <div className="flex gap-2 mb-4 bg-zinc-950 p-1 rounded-xl border border-white/5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setForgeSubTab('craft')}
                  className={cn(
                    'flex-1 text-xs font-bold py-1.5 rounded-lg transition-all',
                    forgeSubTab === 'craft' 
                      ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30 shadow' 
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  )}
                >
                  🔨 Craft Recipes
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setForgeSubTab('upgrade')}
                  className={cn(
                    'flex-1 text-xs font-bold py-1.5 rounded-lg transition-all',
                    forgeSubTab === 'upgrade' 
                      ? 'bg-orange-950/40 text-orange-400 border border-orange-500/30 shadow' 
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  )}
                >
                  ✨ Tempering (Upgrade)
                </Button>
              </div>

              {forgeSubTab === 'craft' ? (
                <div className="flex flex-col space-y-6 w-full pb-8">
                  {/* 1. ANVIL CARD */}
                  <Card className="bg-zinc-950/70 border-amber-900/30 shadow-2xl relative overflow-hidden rounded-3xl w-full">
                    <CardHeader className="border-b border-white/5 pb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="font-serif text-lg text-white">Anvil Station</CardTitle>
                          <CardDescription className="text-zinc-400 text-xs">Place materials on the anvil to craft equipment</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAnvil}
                          disabled={forgeState === "crafting" || Object.keys(anvil).length === 0}
                          className="text-zinc-500 hover:text-red-400 text-xs font-bold flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Clear Anvil
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 flex flex-col items-center relative min-h-[380px]">
                      
                      {/* Anvil Area */}
                      <div className="relative w-64 h-64 flex items-center justify-center select-none">
                        
                        {/* Glowing backdrop */}
                        <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 transition-colors duration-1000 ${
                          forgeState === "idle" ? "bg-orange-600" :
                          forgeState === "crafting" ? "bg-yellow-500 animate-pulse" :
                          forgeState === "success" ? "bg-emerald-500" : "bg-red-800"
                        }`} />

                        {/* Animated Sparks */}
                        <AnimatePresence>
                          {forgeState !== "error" && renderAnvilSparks()}
                        </AnimatePresence>

                        {/* Anvil Graphic (HTML/CSS styled) */}
                        <motion.div
                          animate={forgeState === "crafting" ? {
                            x: [0, -2, 2, -2, 2, 0],
                            y: [0, 1, -1, 1, -1, 0],
                            rotate: [0, -1, 1, -1, 1, 0]
                          } : {}}
                          transition={{ duration: 0.25, repeat: Infinity }}
                          className="absolute bottom-6 w-48 h-28 flex flex-col items-center justify-end select-none"
                        >
                          {/* Anvil top horn left & body */}
                          <div className="relative w-full h-14 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 rounded-t-xl border-t border-zinc-500 shadow-xl flex items-center justify-center">
                            {/* Left horn of anvil */}
                            <div className="absolute top-0 -left-6 w-8 h-8 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-bl-[20px] rounded-tl-sm border-t border-l border-zinc-500 transform skew-y-12" />
                            {/* Right flat face */}
                            <div className="absolute top-0 -right-4 w-6 h-10 bg-gradient-to-bl from-zinc-700 to-zinc-900 border-t border-r border-zinc-500 rounded-tr-sm" />
                            
                            {/* Glowing hot metal center */}
                            <div className={`w-20 h-1 rounded-full blur-[2px] transition-colors duration-1000 ${
                              forgeState === "idle" ? "bg-orange-500/40" :
                              forgeState === "crafting" ? "bg-yellow-400 animate-pulse shadow-[0_0_8px_#fbbf24]" :
                              forgeState === "success" ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" :
                              "bg-red-500"
                            }`} />
                          </div>
                          {/* Anvil pillar/waist */}
                          <div className="w-24 h-6 bg-gradient-to-b from-zinc-800 to-zinc-950 border-x border-zinc-900" />
                          {/* Anvil base feet */}
                          <div className="w-40 h-8 bg-gradient-to-b from-zinc-900 to-black rounded-b-xl border-b border-zinc-950 shadow-2xl" />
                        </motion.div>

                        {/* Display floating ingredients loaded in anvil */}
                        <div className="absolute -top-12 left-0 right-0 flex gap-2 flex-wrap justify-center z-10 select-none px-4">
                          {Object.entries(anvil).map(([id, qty]) => {
                            const isRawMat = id.startsWith('material-');
                            const item = isRawMat 
                              ? comprehensiveItems.find(i => i.id === id) 
                              : storedItems.find(i => i.id === id || i.dbId === id);
                            return (
                              <motion.button
                                key={id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                onClick={() => removeMaterialFromAnvil(id)}
                                className="px-2 py-1 bg-zinc-900/90 border border-orange-500/20 rounded-lg flex items-center gap-1 hover:border-red-500/40 group shadow-lg"
                              >
                                <span className="text-sm">{item?.emoji || "📦"}</span>
                                <span className="text-[10px] font-bold text-zinc-400 group-hover:text-red-400">x{qty}</span>
                              </motion.button>
                            )
                          })}
                          {Object.keys(anvil).length === 0 && forgeState === "idle" && (
                            <span className="text-zinc-500 text-xs italic font-serif">Place materials on the anvil...</span>
                          )}
                        </div>

                        {/* Anvil base flame */}
                        <div className="absolute -bottom-4 flex justify-center w-full">
                          <Flame className="w-10 h-10 text-orange-600 animate-pulse" />
                          <Flame className="w-8 h-8 text-yellow-500 animate-bounce -ml-2" />
                        </div>
                      </div>

                      {/* Forge Trigger Action */}
                      {(() => {
                        const matchedAnvilRecipe = FORGE_RECIPES.find(recipe =>
                          recipe.materials.length === Object.keys(anvil).length &&
                          recipe.materials.every(req => (anvil[req.itemId] || 0) === req.quantity)
                        );
                        return (
                          <div className="mt-8 z-10 flex flex-col items-center gap-2">
                            {matchedAnvilRecipe && (
                              <span className="text-[11px] font-bold text-amber-400">
                                <Coins className="w-3 h-3 inline mr-1" />{matchedAnvilRecipe.goldCost}g required
                              </span>
                            )}
                            <Button
                              onClick={forgeAnvilItem}
                              disabled={forgeState === "crafting" || Object.keys(anvil).length === 0}
                              className={`px-8 py-3.5 rounded-2xl font-extrabold shadow-lg transition-all ${
                                Object.keys(anvil).length === 0
                                  ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                                  : "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20 hover:scale-105"
                              }`}
                            >
                              {forgeState === "crafting" ? "🔨 Hammering..." : matchedAnvilRecipe ? `🔨 Forge Item (${matchedAnvilRecipe.goldCost}g)` : "🔨 Forge Item"}
                            </Button>
                          </div>
                        );
                      })()}

                      {/* Success & Error Overlays */}
                      <AnimatePresence>
                        {forgeState === "success" && forgedItem && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 z-20 rounded-3xl"
                          >
                            <div className="p-6 rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400 text-5xl mb-4 animate-bounce">
                              {forgedItem.emoji}
                            </div>
                            <h3 className="font-serif text-xl font-bold text-white mb-1">
                              {forgedItem.name} Successfully Forged!
                            </h3>
                            <Badge className={cn('text-[10px] capitalize font-bold px-3 py-1 mt-1 border',
                              forgedItem.rarity === 'legendary' ? 'bg-orange-950/20 text-orange-400 border-orange-500/30' :
                              forgedItem.rarity === 'epic' ? 'bg-purple-950/20 text-purple-400 border-purple-500/30' :
                              forgedItem.rarity === 'rare' ? 'bg-blue-950/20 text-blue-400 border-blue-500/30' :
                              forgedItem.rarity === 'uncommon' ? 'bg-green-950/20 text-green-400 border-green-500/30' :
                              'bg-zinc-950/20 text-zinc-400 border-zinc-500/30'
                            )}>
                              {forgedItem.rarity}
                            </Badge>
                            {forgedItem.newlyDiscovered && (
                              <p className="text-xs font-bold text-amber-400 mt-3 animate-pulse">🎉 New Blueprint Discovered!</p>
                            )}
                            <p className="text-xs text-zinc-400 mt-3 mb-6 max-w-xs text-center">
                              Your forged equipment has been placed in your stored inventory. Go equip it!
                            </p>
                            <Button
                              onClick={() => {
                                setForgeState("idle")
                                setForgedItem(null)
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg font-bold"
                            >
                              Collect Equipment
                            </Button>
                          </motion.div>
                        )}

                        {forgeState === "error" && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 z-20 text-center rounded-3xl"
                          >
                            <div className="p-6 rounded-full bg-red-500/10 border-2 border-red-500 text-red-400 text-5xl mb-4 animate-bounce">
                              💥
                            </div>
                            <h3 className="font-serif text-xl font-bold text-white mb-1">Forging Failed!</h3>
                            <p className="text-xs text-zinc-400 mb-6 max-w-xs leading-normal">
                              The combination of elements shivered under the hammer strokes and shattered into ash. Check the Known Blueprints ledger for correct quantities!
                            </p>
                            <Button
                              onClick={() => setForgeState("idle")}
                              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5 shadow-lg"
                            >
                              Clear Anvil Ash
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>

                  {/* 2. REAGENTS & EQUIPMENT BAG CARD */}
                  <Card className="bg-zinc-950/70 border-amber-900/30 shadow-2xl rounded-3xl w-full">
                    <CardHeader className="border-b border-white/5 pb-4">
                      <CardTitle className="font-serif text-base text-white">Your Forge Materials & Stored Gear</CardTitle>
                      <CardDescription className="text-zinc-400 text-xs">Materials and weapons in your stored inventory (Click to add to anvil)</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {storedItems
                          .filter(i => i.id.startsWith('material-') || ['weapon', 'shield', 'armor'].includes(i.type))
                          .map(item => {
                            const qtyOnAnvil = anvil[item.id] || 0;
                            const availableQty = item.quantity - qtyOnAnvil;

                            return (
                              <div
                                key={item.id}
                                onClick={() => availableQty > 0 && addMaterialToAnvil(item.id)}
                                className={cn(
                                  'p-4 bg-zinc-900/50 border rounded-2xl flex items-center justify-between transition-all duration-200',
                                  availableQty > 0
                                    ? "border-white/5 cursor-pointer hover:border-orange-500/40 hover:bg-zinc-900/80 hover:scale-[1.01]"
                                    : "border-zinc-900 opacity-40 cursor-not-allowed"
                                )}
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <span className="text-3xl shrink-0 select-none">{item.emoji || "📦"}</span>
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-sm text-zinc-100 truncate">{item.name}</h5>
                                    <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1 leading-normal">{item.description}</p>
                                  </div>
                                </div>
                                <div className="shrink-0 pl-3">
                                  <Badge className="bg-zinc-950 text-orange-400 font-extrabold text-xs px-3 py-1.5 shadow-inner border border-orange-900/20">
                                    {availableQty}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        {storedItems.filter(i => i.id.startsWith('material-') || ['weapon', 'shield', 'armor'].includes(i.type)).length === 0 && (
                          <div className="col-span-full py-8 text-center text-zinc-600 text-xs italic font-serif">
                            Your bag contains no forging materials or stored equipment. Complete habits and quests to gather them!
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 3. RECIPES LEDGER CARD */}
                  <Card className="bg-zinc-950/70 border-amber-900/30 shadow-2xl rounded-3xl w-full">
                    <CardHeader className="border-b border-white/5 pb-4">
                      <CardTitle className="font-serif text-base text-white">Known Blueprints</CardTitle>
                      <CardDescription className="text-zinc-400 text-xs">Formulas to forge weapons, armor, and shields (Click to auto-load anvil)</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {FORGE_RECIPES.map(recipe => {
                          const isUnlocked = unlockedForgeRecipes.includes(recipe.id);
                          const item = comprehensiveItems.find(i => i.id === recipe.targetItemId);
                          if (!item) return null;

                          if (!isUnlocked) {
                            return (
                              <div
                                key={recipe.id}
                                className="p-4 bg-zinc-900/30 border border-white/5 rounded-2xl relative overflow-hidden group flex flex-col justify-between select-none min-h-[140px]"
                              >
                                {/* Blurred content */}
                                <div className="filter blur-[5px] opacity-40 pointer-events-none flex flex-col justify-between h-full w-full">
                                  <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-2xl bg-zinc-800 text-white text-2xl shadow-md shrink-0">
                                      ❓
                                    </div>
                                    <div className="min-w-0">
                                      <h5 className="font-bold text-sm text-zinc-400">Locked Blueprint</h5>
                                      <p className="text-xs text-zinc-500 leading-normal mt-1">Discover this blueprint by experimenting with anvil materials!</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Lock Overlay with Blueprint Hint */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[3px] p-3 text-center">
                                  <span className="text-xl">🔒</span>
                                  <p className="text-xs font-serif italic text-amber-200/90 mt-1.5 leading-snug max-w-[92%] drop-shadow">
                                    "{recipe.hint}"
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={recipe.id}
                              role="button"
                              tabIndex={0}
                              aria-label={`Select blueprint ${item.name} to load anvil materials`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  selectForgeRecipe(recipe);
                                }
                              }}
                              onClick={() => selectForgeRecipe(recipe)}
                              className="p-4 bg-gradient-to-br from-zinc-900 via-zinc-950 to-amber-950/30 border border-amber-800/30 hover:border-orange-400/60 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between hover:scale-[1.01] active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                            >
                              <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl bg-zinc-800 text-white text-2xl shadow-md shrink-0">
                                  {item.emoji}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-bold text-sm text-zinc-100 group-hover:text-orange-300 transition-colors font-serif">{item.name}</h5>
                                    {item.rarity && (
                                      <Badge variant="outline" className={cn('text-[9px] capitalize shrink-0 font-bold',
                                        item.rarity === 'legendary' ? 'border-orange-500/50 bg-orange-950/80 text-orange-300' :
                                        item.rarity === 'epic' ? 'border-purple-500/50 bg-purple-950/80 text-purple-300' :
                                        item.rarity === 'rare' ? 'border-blue-500/50 bg-blue-950/80 text-blue-300' :
                                        item.rarity === 'uncommon' ? 'border-green-500/50 bg-green-950/80 text-green-300' :
                                        'border-zinc-500/50 bg-zinc-900/80 text-zinc-300'
                                      )}>
                                        {item.rarity}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-zinc-300 leading-normal mt-1">{item.description}</p>
                                </div>
                              </div>

                              {/* Material Requirements list */}
                              <div className="flex gap-2 flex-wrap mt-4 border-t border-amber-900/30 pt-3">
                                {recipe.materials.map(req => {
                                  const materialItem = comprehensiveItems.find(c => c.id === req.itemId);
                                  const owned = getOwnedQty(req.itemId);
                                  const isMet = owned >= req.quantity;

                                  return (
                                    <Badge
                                      key={req.itemId}
                                      variant="outline"
                                      className={cn(
                                        'text-[10px] font-bold py-1 px-3 rounded-full flex items-center gap-1.5 border transition-all',
                                        isMet ? "border-emerald-500/40 bg-emerald-950/80 text-emerald-300 shadow-sm" : "border-red-500/40 bg-red-950/80 text-red-300 opacity-90"
                                      )}
                                    >
                                      <span>{materialItem?.emoji || "📦"}</span>
                                      <span>{materialItem?.name || req.itemId} ({owned}/{req.quantity})</span>
                                    </Badge>
                                  );
                                })}
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[10px] font-bold py-1 px-3 rounded-full flex items-center gap-1.5 border transition-all',
                                    playerGold >= recipe.goldCost ? "border-amber-950/20 bg-amber-500/10 text-amber-400" : "border-red-950/20 bg-red-500/10 text-red-400"
                                  )}
                                >
                                  <span>🪙</span>
                                  <span>Cost: {recipe.goldCost}g</span>
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="space-y-4 pb-8">
                  {selectedUpgradeItem === null ? (
                    // 1. Gear Selection list
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-400 px-1">Select an equipped or stored piece of gear to upgrade its base stats:</p>
                      {inventoryItems.filter(item => ['weapon', 'shield', 'armor'].includes(item.type)).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 border border-dashed border-zinc-700 rounded-xl bg-zinc-950">
                          <span className="text-4xl mb-3">🛡️</span>
                          <h4 className="text-sm font-bold text-amber-500/80 mb-1">No Upgradeable Gear</h4>
                          <p className="text-xs max-w-xs px-4">Buy equipment from shops or craft gear recipes first!</p>
                        </div>
                      ) : (
                        inventoryItems
                          .filter(item => ['weapon', 'shield', 'armor'].includes(item.type))
                          .map(item => {
                            const curLvl = item.stats?.['upgradeLevel'] || 0;
                            const statLabel = item.type === 'weapon' ? 'Attack' : 'Defense';
                            const statVal = item.type === 'weapon' ? (item.stats?.['attack'] || 0) : (item.stats?.['defense'] || 0);

                            return (
                              <div
                                key={item.dbId || item.id}
                                className="p-3 bg-[#0f1115] border border-white/5 rounded-xl flex items-center justify-between hover:border-orange-500/30 transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-xl shrink-0">
                                    {item.emoji}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-white text-xs truncate max-w-[150px]">{item.name}</h4>
                                      {item.equipped && (
                                        <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-[8px] scale-90 px-1 py-0 capitalize">
                                          Equipped
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">
                                      {statLabel}: <span className="text-zinc-300 font-bold">{statVal}</span>
                                      {curLvl > 0 && <span className="text-orange-400 ml-2 font-bold">Grade +{curLvl}</span>}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setSelectedUpgradeItem(item)}
                                  className="h-8 text-xs bg-zinc-800 hover:bg-zinc-700 text-white font-bold"
                                >
                                  Select
                                </Button>
                              </div>
                            );
                          })
                      )}
                    </div>
                  ) : (
                    // 2. Tempering panel for selected item
                    (() => {
                      const curLvl = selectedUpgradeItem.stats?.['upgradeLevel'] || 0;
                      const nextLvl = curLvl + 1;
                      const rarity = selectedUpgradeItem.rarity || 'common';
                      const reqs = getUpgradeRequirements(selectedUpgradeItem.type, rarity, nextLvl);
                      const successRate = getSuccessRate(nextLvl);
                      const bonus = getStatBonus(rarity);

                      const isWeapon = selectedUpgradeItem.type === 'weapon';
                      const statLabel = isWeapon ? 'Attack' : 'Defense';
                      const curStat = isWeapon ? (selectedUpgradeItem.stats?.['attack'] || 0) : (selectedUpgradeItem.stats?.['defense'] || 0);
                      const nextStat = curStat + bonus;

                      const metGold = playerGold >= reqs.goldCost;
                      const metMats = reqs.materials.every(m => getOwnedQty(m.itemId) >= m.quantity);
                      const canUpgrade = metGold && metMats && nextLvl <= 10;

                      return (
                        <div className="space-y-4 bg-zinc-950/40 p-4 border border-white/5 rounded-xl shadow-inner">
                          {/* Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-white/5">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{selectedUpgradeItem.emoji}</span>
                              <div>
                                <h4 className="font-bold text-white text-sm">{selectedUpgradeItem.name}</h4>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{rarity} {selectedUpgradeItem.type}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedUpgradeItem(null)}
                              className="text-xs text-zinc-400 hover:text-white"
                            >
                              ✕ Back
                            </Button>
                          </div>

                          {/* Stats Preview Panel */}
                          <div className="grid grid-cols-3 items-center justify-center p-3 bg-zinc-900/60 border border-white/5 rounded-lg text-center">
                            <div>
                              <p className="text-[10px] text-zinc-400 font-bold uppercase">Current</p>
                              <p className="font-bold text-sm text-zinc-300 mt-0.5">+{curLvl}</p>
                              <p className="text-xs text-zinc-400 mt-0.5">{statLabel}: {curStat}</p>
                            </div>
                            <div className="flex flex-col items-center justify-center text-orange-500">
                              <ArrowRight className="w-5 h-5 animate-pulse" />
                              <span className="text-[9px] uppercase font-bold mt-1 text-orange-400/80">Tempering</span>
                            </div>
                            <div>
                              <p className="text-[10px] text-orange-400 font-bold uppercase">Upgraded</p>
                              <p className="font-bold text-sm text-orange-400 mt-0.5">+{nextLvl}</p>
                              <p className="text-xs text-emerald-400 font-bold mt-0.5">{statLabel}: {nextStat}</p>
                            </div>
                          </div>

                          {/* Success probability indicator */}
                          <div className="p-3 bg-[#0a0c10] border border-white/5 rounded-lg space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-zinc-400">Success Rate:</span>
                              <span className={cn(
                                successRate >= 0.8 ? 'text-emerald-400' :
                                successRate >= 0.5 ? 'text-amber-400' :
                                'text-red-400'
                              )}>
                                {Math.floor(successRate * 100)}%
                              </span>
                            </div>
                            <Progress value={successRate * 100} className="h-1.5 bg-zinc-800" indicatorClassName="bg-gradient-to-r from-orange-600 to-amber-400" />
                            {curLvl >= 5 && (
                              <p className="text-[10px] text-red-400 font-bold mt-1">
                                ⚠️ Failure Risk: At +5 or higher, failures have a 50% chance to degrade the item level by 1.
                              </p>
                            )}
                          </div>

                          {/* Requirements Checklist */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Required Materials:</h5>
                            <div className="grid grid-cols-2 gap-2">
                              {/* Gold requirement */}
                              <div className={cn(
                                'p-2 rounded-lg border text-xs flex justify-between items-center',
                                metGold ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400' : 'bg-red-950/10 border-red-500/20 text-red-400'
                              )}>
                                <span className="flex items-center gap-1 font-medium">🪙 Gold Required</span>
                                <span className="font-bold">{reqs.goldCost}g</span>
                              </div>

                              {/* Material requirements */}
                              {reqs.materials.map(m => {
                                const owned = getOwnedQty(m.itemId);
                                const met = owned >= m.quantity;
                                return (
                                  <div
                                    key={m.itemId}
                                    className={cn(
                                      'p-2 rounded-lg border text-xs flex justify-between items-center',
                                      met ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400' : 'bg-red-950/10 border-red-500/20 text-red-400'
                                    )}
                                  >
                                    <span className="flex items-center gap-1 font-medium truncate">
                                      {getMaterialEmoji(m.itemId)} {getMaterialName(m.itemId)}
                                    </span>
                                    <span className="font-bold shrink-0">{owned}/{m.quantity}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Upgrade Action Button */}
                          <div className="pt-2">
                            {curLvl >= 10 ? (
                              <Button disabled className="w-full bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed text-xs font-bold py-5 rounded-xl uppercase tracking-wider">
                                Max Upgrade Reached (+10)
                              </Button>
                            ) : (
                              <Button
                                disabled={!canUpgrade || isUpgrading}
                                onClick={() => handleUpgrade(selectedUpgradeItem)}
                                className={cn(
                                  'w-full text-xs font-bold py-5 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2',
                                  canUpgrade 
                                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-black font-extrabold shadow-lg hover:brightness-110 active:scale-95' 
                                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                                )}
                              >
                                {isUpgrading ? (
                                  <>⏳ Hammering Forge...</>
                                ) : (
                                  <>🔨 Temper Equipment</>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </TabsContent>

            {/* ── ALCHEMY tab ───────────────────────────────────────────── */}
            <TabsContent value="alchemy" className="mt-4 pb-8">
              <AlchemyLab />
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