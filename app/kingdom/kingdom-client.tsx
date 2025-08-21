"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HeaderSection } from "@/components/HeaderSection"
import { defaultInventoryItems } from "@/app/lib/default-inventory"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from '@clerk/nextjs'
import { 
  getKingdomInventory, 
  getEquippedItems, 
  getStoredItems, 
  equipItem, 
  unequipItem,
  getTotalStats,
  addToInventory,
  type InventoryItem 
} from "@/lib/inventory-manager"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getUserPreference, setUserPreference } from '@/lib/user-preferences-manager';
import type { InventoryItem as DefaultInventoryItem } from "@/app/lib/default-inventory"
import type { InventoryItem as ManagerInventoryItem } from "@/lib/inventory-manager"
import { KingdomStatsBlock, KingStatsBlock } from "@/components/kingdom-stats-graph";
import { KingdomGridWithTimers } from '@/components/kingdom-grid-with-timers';
import { KingdomPropertiesInventory } from '@/components/kingdom-properties-inventory';
import { ProgressionVisualization } from '@/components/progression-visualization';
import { EconomyTransparency } from '@/components/economy-transparency';
import { KingdomTileGrid } from '@/components/kingdom-tile-grid';
import type { Tile, TileType, ConnectionDirection } from '@/types/tiles';
import { gainGold } from '@/lib/gold-manager';
import { KINGDOM_TILES } from '@/lib/kingdom-tiles';

type KingdomInventoryItem = (DefaultInventoryItem | ManagerInventoryItem) & { 
  stats?: Record<string, number>, 
  description?: string,
  category?: string 
}

interface WindowWithHeaderImages extends Window {
  headerImages?: Record<string, string>;
}

// Perk mapping for potions
const potionPerkMap: Record<string, { name: string; perks: { name: string; effect: string }[] }> = {
  "elixir of strength": {
    name: "Elixir of Strength",
    perks: [
      { name: "Might Mastery", effect: "+10% XP & gold from Might activities per level" },
      { name: "Vitality Sage", effect: "+10% XP & gold from Vitality activities per level" },
    ],
  },
  "elixir of wisdom": {
    name: "Elixir of Wisdom",
    perks: [
      { name: "Knowledge Seeker", effect: "+10% XP & gold from Knowledge activities per level" },
      { name: "Honor Guard", effect: "+10% XP & gold from Honor activities per level" },
    ],
  },
  "elixir of fortitude": {
    name: "Elixir of Fortitude",
    perks: [
      { name: "Castle Steward", effect: "+10% XP & gold from Castle activities per level" },
      { name: "Craft Artisan", effect: "+10% XP & gold from Craft activities per level" },
    ],
  },
}

function getRandomFromArray<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error('Array is empty');
  return arr[Math.floor(Math.random() * arr.length)]!;
}

const getConsumableEffect = (item: KingdomInventoryItem) => {
  // Artifacts: 60, 80, or 100 gold
  if (item.type === 'artifact') {
    const gold = getRandomFromArray([60, 80, 100])
    // Use the unified gold system
    gainGold(gold, 'artifact-consumption')
    return `You used an artifact and gained ${gold} gold!`
  }
  // Scrolls: 10, 25, or 50 gold
  if (item.type === 'scroll') {
    const gold = getRandomFromArray([10, 25, 50])
    // Use the unified gold system
    gainGold(gold, 'scroll-consumption')
    return `You used a scroll and gained ${gold} gold!`
  }
  // Potions: handle each potion type explicitly
  if (item.type === 'item' && item.name) {
    const key = item.name.toLowerCase();
    if (key === 'health potion') {
      // Restore health (if tracked) or show a toast
      // (Assume health is tracked in character-stats)
      const stats = JSON.parse(localStorage.getItem('character-stats') || '{"health":100}')
      stats.health = Math.min((stats.health || 100) + 50, 100)
      localStorage.setItem('character-stats', JSON.stringify(stats))
      return `You used a Health Potion and restored 50 health!`;
    }
    if (key === 'gold potion') {
      const stats = JSON.parse(localStorage.getItem('character-stats') || '{"gold":0}')
      stats.gold = (stats.gold || 0) + 50
      localStorage.setItem('character-stats', JSON.stringify(stats))
      return `You used a Gold Potion and gained 50 gold!`;
    }
    if (key === 'experience potion' || key === 'exp potion') {
      const stats = JSON.parse(localStorage.getItem('character-stats') || '{"experience":0}')
      stats.experience = (stats.experience || 0) + 50
      localStorage.setItem('character-stats', JSON.stringify(stats))
      return `You used an Experience Potion and gained 50 XP!`;
    }
    // Other potions: use perk logic
    if (potionPerkMap[key]) {
      const perk = getRandomFromArray(potionPerkMap[key].perks)
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const activePerks = JSON.parse(localStorage.getItem('active-potion-perks') || '{}')
      activePerks[perk.name] = { effect: perk.effect, expiresAt: expiresAt.toISOString() }
      localStorage.setItem('active-potion-perks', JSON.stringify(activePerks))
      return `You used a ${item.name}! The perk "${perk.name}" is now active for 24 hours: ${perk.effect}`
    }
  }
  return `You used ${item.name}!`
}

// Helper to get display name (remove category prefix like "fish-", "horse-", etc.)
function getItemDisplayName(item: KingdomInventoryItem): string {
  if (!item.name) return 'Unknown Item';
  
  // Split by hyphen and take the part after the first hyphen
  const parts = item.name.split('-');
  if (parts.length > 1) {
    // Capitalize the first letter of the remaining part
    const displayName = parts.slice(1).join('-');
    return displayName.charAt(0).toUpperCase() + displayName.slice(1);
  }
  
  // If no hyphen, return the original name
  return item.name;
}

// Helper to get fallback image path (copy logic from getItemImagePath in city location page)
function getItemImagePath(item: KingdomInventoryItem): string {
  // Check if item has a specific image path
  if (item.image) {
    return item.image;
  }

  // Fallback to default path construction
  return `/images/items/${item.name}`;
}

// Helper to determine if an item is equippable
function isEquippable(item: KingdomInventoryItem): boolean {
  // Only allow equipment, creature (mount), or items with a category (e.g., weapon, shield, armor)
  if (item.type === 'equipment' || item.type === 'creature') return true;
  if (item.category && ['weapon', 'shield', 'armor', 'mount'].includes(item.category)) return true;
  return false;
}

// Create an empty kingdom grid with default tiles
function createEmptyKingdomGrid(): Tile[][] {
  console.log('[Kingdom] createEmptyKingdomGrid called');
  
  // Create a 12x6 grid
  const rows = 12;
  const cols = 6;
  const grid: Tile[][] = [];
  
  console.log('[Kingdom] Creating base grid with dimensions:', { rows, cols });
  
  // Initialize empty grid
  for (let y = 0; y < rows; y++) {
    grid[y] = [];
    for (let x = 0; x < cols; x++) {
      grid[y]![x] = {
        id: `empty-${x}-${y}`,
        type: 'empty',
        name: 'Empty',
        description: 'Empty space',
        connections: [],
        rotation: 0,
        revealed: false,
        isVisited: false,
        x,
        y,
        ariaLabel: `Empty space at ${x},${y}`,
        image: '/images/placeholders/empty-tile.svg',
      };
    }
  }
  
  console.log('[Kingdom] Base grid created with dimensions:', { rows, cols });
  
  // Add some default kingdom tiles to make the grid interesting
  const defaultKingdomTiles = [
    { x: 1, y: 1, type: 'well' as TileType },
    { x: 2, y: 1, type: 'blacksmith' as TileType },
    { x: 3, y: 1, type: 'fisherman' as TileType },
    { x: 4, y: 1, type: 'sawmill' as TileType },
    { x: 5, y: 1, type: 'windmill' as TileType },
    { x: 1, y: 2, type: 'grocery' as TileType },
    { x: 2, y: 2, type: 'castle' as TileType },
    { x: 3, y: 2, type: 'temple' as TileType },
    { x: 4, y: 2, type: 'fountain' as TileType },
    { x: 5, y: 2, type: 'pond' as TileType },
    { x: 1, y: 3, type: 'foodcourt' as TileType },
    { x: 2, y: 3, type: 'vegetables' as TileType },
    { x: 3, y: 3, type: 'wizard' as TileType },
    { x: 4, y: 3, type: 'mayor' as TileType },
    { x: 5, y: 3, type: 'inn' as TileType },
    { x: 1, y: 4, type: 'library' as TileType }, // Fixed: replaced 'house' with 'library'
    { x: 2, y: 4, type: 'mansion' as TileType },
    { x: 3, y: 4, type: 'jousting' as TileType },
    { x: 4, y: 4, type: 'archery' as TileType },
    { x: 5, y: 4, type: 'watchtower' as TileType },
  ];
  
  console.log('[Kingdom] Adding default kingdom tiles:', defaultKingdomTiles.length);
  
  defaultKingdomTiles.forEach(({ x, y, type }) => {
    const kingdomTile = KINGDOM_TILES.find(kt => kt.id === type);
    if (kingdomTile && grid[y] && grid[y][x]) {
      try {
        grid[y]![x]! = {
          id: `${type}-${x}-${y}`,
          type: type,
          name: kingdomTile.name || 'Unknown Tile',
          description: kingdomTile.clickMessage || 'A mysterious tile in your kingdom.',
          connections: [],
          rotation: 0 as 0 | 90 | 180 | 270,
          revealed: true,
          isVisited: false,
          x,
          y,
          ariaLabel: `${kingdomTile.name || 'Unknown Tile'} at ${x},${y}`,
          image: kingdomTile.image || '/images/kingdom-tiles/default.png',
        };
        console.log(`[Kingdom] Added ${type} tile at position (${x}, ${y})`);
      } catch (error) {
        console.error(`[Kingdom] Error creating tile ${type} at position (${x}, ${y}):`, error);
      }
    } else {
      console.warn(`[Kingdom] Failed to add ${type} tile at position (${x}, ${y}) - kingdomTile:`, kingdomTile, 'grid[y]:', grid[y], 'grid[y][x]:', grid[y]?.[x]);
    }
  });
  
  const finalTileCount = grid.flat().filter(cell => cell && cell.type && cell.type !== 'empty').length;
  console.log('[Kingdom] Final grid created with', finalTileCount, 'non-empty tiles');
  
  return grid;
}

// Helper to get the kingdom tile inventory with build tokens
function getKingdomTileInventoryWithBuildTokens(): Tile[] {
  const KINGDOM_TILE_IMAGES = [
    'Archery.png', 'Blacksmith.png', 'Castle.png', 'Fisherman.png', 'Foodcourt.png', 'Fountain.png', 'Grocery.png', 'House.png', 'Inn.png', 'Jousting.png', 'Mansion.png', 'Mayor.png', 'Pond.png', 'Sawmill.png', 'Temple.png', 'Vegetables.png', 'Watchtower.png', 'Well.png', 'Windmill.png', 'Wizard.png'
  ];
  return KINGDOM_TILE_IMAGES.map((filename, idx) => {
    const tileName = filename.replace('.png', '');
    const isCastle = filename === 'Castle.png';
    // Find the corresponding kingdom tile configuration
    const kingdomTileConfig = KINGDOM_TILES.find(kt => kt.name.toLowerCase() === tileName.toLowerCase());
    
    return {
      id: `kingdom-tile-${idx}`,
      type: kingdomTileConfig ? (kingdomTileConfig.id as TileType) : 'special',
      name: tileName,
      description: kingdomTileConfig ? kingdomTileConfig.clickMessage : `A special kingdom tile: ${tileName}`,
      connections: [] as ConnectionDirection[],
      rotation: 0,
      revealed: true,
      isVisited: false,
      x: 0,
      y: 0,
      ariaLabel: `Kingdom tile: ${tileName}`,
      image: `/images/kingdom-tiles/${filename}`,
      cost: isCastle ? 0 : Math.floor(Math.random() * 3) + 1, // 1-3 build tokens
      quantity: isCastle ? 1 : 0, // Only Castle starts with 1, rest start with 0
    };
  });
}

export function KingdomClient({ userId }: { userId: string | null }) {
  const { toast } = useToast();
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [equippedItems, setEquippedItems] = useState<KingdomInventoryItem[]>([]);
  const [storedItems, setStoredItems] = useState<KingdomInventoryItem[]>([]);
  const [totalStats, setTotalStats] = useState<{ movement: number; attack: number; defense: number }>({ movement: 0, attack: 0, defense: 0 });
  const [modalOpen, setModalOpen] = useState(false)
  const [modalText, setModalText] = useState("")
  const [activeTab, setActiveTab] = useState("equipped")
  const [kingdomTab, setKingdomTab] = useState("thrivehaven");
  const [kingdomGrid, setKingdomGrid] = useState<Tile[][]>([]);
  const [selectedKingdomTile, setSelectedKingdomTile] = useState<Tile | null>(null);
  const kingdomTileInventory = getKingdomTileInventoryWithBuildTokens();
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [showEntrance, setShowEntrance] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const [moveUp, setMoveUp] = useState(false);
  const [kingdomReady, setKingdomReady] = useState(false);
  const [kingdomContent, setKingdomContent] = useState<JSX.Element | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [coverImageLoading, setCoverImageLoading] = useState(true);
  const [sellingModalOpen, setSellingModalOpen] = useState(false);
  const [soldItem, setSoldItem] = useState<{ name: string; gold: number } | null>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [gridLoading, setGridLoading] = useState(true);

  // 🎯 LOAD KINGDOM GRID FROM DATABASE
  useEffect(() => {
    if (!userId) return;
    
    const loadKingdomGrid = async () => {
      try {
        setGridLoading(true);
        const response = await fetch('/api/kingdom-grid');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.grid && data.data.grid.length > 0) {
            // Database has a valid grid with tiles
            console.log('[Kingdom] Loaded grid from database:', data.data.grid.length);
            setKingdomGrid(data.data.grid);
          } else {
            // Database is empty or has no tiles, create default grid
            console.log('[Kingdom] Database grid is empty, creating default grid...');
            const defaultGrid = createEmptyKingdomGrid();
            console.log('[Kingdom] Created default grid with tiles:', defaultGrid.flat().filter(cell => cell && cell.type && cell.type !== 'empty').length);
            setKingdomGrid(defaultGrid);
            // Save default grid to database
            await saveKingdomGrid(defaultGrid);
          }
        } else {
          // API failed, create default grid
          console.warn('[Kingdom] Failed to load grid from API, creating default...');
          const defaultGrid = createEmptyKingdomGrid();
          console.log('[Kingdom] Created default grid due to API failure:', defaultGrid.flat().filter(cell => cell && cell.type && cell.type !== 'empty').length);
          setKingdomGrid(defaultGrid);
          // Try to save to database
          await saveKingdomGrid(defaultGrid);
        }
      } catch (error) {
        console.error('[Kingdom] Error loading grid:', error);
        // Fallback to default grid on any error
        const defaultGrid = createEmptyKingdomGrid();
        console.log('[Kingdom] Created default grid due to error:', defaultGrid.flat().filter(cell => cell && cell.type && cell.type !== 'empty').length);
        setKingdomGrid(defaultGrid);
        // Try to save to database
        await saveKingdomGrid(defaultGrid);
      } finally {
        setGridLoading(false);
      }
    };

    loadKingdomGrid();
  }, [userId]);

  // 🎯 SAVE KINGDOM GRID TO DATABASE
  useEffect(() => {
    if (!userId || !kingdomGrid || kingdomGrid.length === 0) return;
    
    const saveGrid = async () => {
      try {
        await saveKingdomGrid(kingdomGrid);
      } catch (error) {
        console.error('[Kingdom] Error saving grid:', error);
      }
    };

    saveGrid();
  }, [kingdomGrid, userId]);

  // 🎯 LOAD CHALLENGES FROM DATABASE
  useEffect(() => {
    if (!userId) return;
    
    const loadChallenges = async () => {
      try {
        const response = await fetch('/api/challenges');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            console.log('[Kingdom] Loaded challenges from database:', data.data.length);
            setChallenges(data.data);
          }
        }
      } catch (error) {
        console.error('[Kingdom] Error loading challenges:', error);
      }
    };

    loadChallenges();
  }, [userId]);

  // 🎯 LOAD INVENTORY FROM DATABASE
  useEffect(() => {
    if (!userId) return;
    
    const loadInventory = async () => {
      try {
        const response = await fetch('/api/inventory');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            console.log('[Kingdom] Inventory data:', data.data);
            setInventoryLoading(true); // Set loading to true before processing
            const equipped = data.data.equipped || [];
            const stored = data.data.stored || [];
            const stats = data.data.stats || { movement: 0, attack: 0, defense: 0 };
            
            // Normalize items to always have a 'stats' property and description
            const normalizeItems = (items: any[]) => {
              if (!Array.isArray(items)) {
                console.warn('[Kingdom] Items is not an array:', items);
                return [];
              }
              return items.map(item => ({
                ...item,
                stats: (item as any).stats || {},
                description: (item as any).description || '',
              }) as KingdomInventoryItem);
            };
            
            // Ensure equipped and stored are arrays with defensive programming
            const equippedArray = Array.isArray(equipped) ? equipped : [];
            const storedArray = Array.isArray(stored) ? stored : [];
            
            // Filter equipped items safely
            const equippableItems = equippedArray.filter(item => {
              try {
                return isEquippable(item);
              } catch (error) {
                console.warn('[Kingdom] Error filtering item:', item, error);
                return false;
              }
            });
            
            let equippedItemsToShow = normalizeItems(equippableItems);
            
            // 🎯 SHOW DEFAULT ITEMS if no items are equipped
            if (equippedItemsToShow.length === 0) {
              equippedItemsToShow = defaultInventoryItems.map(item => ({
                ...item,
                stats: item.stats || {},
                description: item.description || '',
                equipped: true,
                type: item.type as any,
                category: item.type,
              })) as KingdomInventoryItem[];
            }
            
            setEquippedItems(equippedItemsToShow);
            setStoredItems(normalizeItems(storedArray));
            
            // 🎯 CALCULATE STATS from equipped items (including defaults)
            const calculatedStats = equippedItemsToShow.reduce(
              (totals, item) => {
                try {
                  const itemStats = item?.stats || {};
                  return {
                    movement: totals.movement + (itemStats.movement || 0),
                    attack: totals.attack + (itemStats.attack || 0),
                    defense: totals.defense + (itemStats.defense || 0),
                  };
                } catch (error) {
                  console.warn('[Kingdom] Error calculating stats for item:', item, error);
                  return totals;
                }
              },
              { movement: 0, attack: 0, defense: 0 }
            );
            
            setTotalStats(calculatedStats);
          }
        }
      } catch (error) {
        console.error('[Kingdom] Error loading inventory:', error);
        // Show default items on error too
        const defaultItems = defaultInventoryItems.map(item => ({
          ...item,
          stats: item.stats || {},
          description: item.description || '',
          equipped: true,
          type: item.type as any,
          category: item.type,
        })) as KingdomInventoryItem[];
        setEquippedItems(defaultItems);
        setStoredItems([]);
        
        // Calculate stats from default items
        const defaultStats = defaultItems.reduce(
          (totals, item) => {
            try {
              const itemStats = item?.stats || {};
              return {
                movement: totals.movement + (itemStats.movement || 0),
                attack: totals.attack + (itemStats.attack || 0),
                defense: totals.defense + (itemStats.defense || 0),
              };
            } catch (error) {
              console.warn('[Kingdom] Error calculating default stats for item:', item, error);
              return totals;
            }
          },
          { movement: 0, attack: 0, defense: 0 }
        );
        setTotalStats(defaultStats);
      } finally {
        setInventoryLoading(false);
      }
    };

    loadInventory();
    
    // 🎯 LISTEN FOR REAL-TIME UPDATES
    const handleInventoryUpdate = () => {
      if (!document.querySelector('[data-inventory-loading="true"]')) {
        loadInventory();
      }
    };
    
    const handleChallengeUpdate = () => {
      loadInventory();
    };
    
    window.addEventListener('character-inventory-update', handleInventoryUpdate);
    window.addEventListener('challenge-update', handleChallengeUpdate);
    
    return () => {
      window.removeEventListener('character-inventory-update', handleInventoryUpdate);
      window.removeEventListener('challenge-update', handleChallengeUpdate);
    };
  }, [userId, challenges.length]);

  // 🎯 SAVE KINGDOM GRID TO DATABASE FUNCTION
  const saveKingdomGrid = async (grid: Tile[][]) => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/kingdom-grid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grid })
      });
      
      if (response.ok) {
        console.log('[Kingdom] Grid saved to database successfully');
      } else {
        console.error('[Kingdom] Failed to save grid to database');
      }
    } catch (error) {
      console.error('[Kingdom] Error saving grid:', error);
    }
  };

  // 🎯 HELPER FUNCTIONS
  const getItemImagePath = (item: KingdomInventoryItem): string => {
    if (item.image && item.image.startsWith('/')) {
      return item.image;
    }
    return `/images/items/${item.image || 'default-item.png'}`;
  };

  const getItemDisplayName = (item: KingdomInventoryItem): string => {
    return item.name || 'Unknown Item';
  };

  const getItemSellPrice = (item: KingdomInventoryItem): number => {
    // Base sell price on item stats or use a default
    if (item.stats) {
      const totalStats = (item.stats.movement || 0) + (item.stats.attack || 0) + (item.stats.defense || 0);
      return Math.max(5, Math.floor(totalStats * 2));
    }
    return 10; // Default sell price
  };

  const isEquippable = (item: KingdomInventoryItem): boolean => {
    // Check if the item has a type that can be equipped
    return item.type === 'weapon' || item.type === 'armor' || item.type === 'equipment';
  };

  const isConsumable = (item: KingdomInventoryItem): boolean => {
    // Check if the item has a type that can be consumed
    return item.type === 'potion' || item.type === 'food' || item.type === 'scroll' || item.type === 'artifact';
  };

  const handleEquip = (item: KingdomInventoryItem) => {
    if (!userId) return;
    
    // Remove from stored items
    setStoredItems(prev => prev.filter(i => i.id !== item.id));
    
    // Add to equipped items
    setEquippedItems(prev => [...prev, { ...item, equipped: true }]);
    
    // Update stats
    const newStats = {
      movement: totalStats.movement + (item.stats?.movement || 0),
      attack: totalStats.attack + (item.stats?.attack || 0),
      defense: totalStats.defense + (item.stats?.defense || 0),
    };
    setTotalStats(newStats);
    
    // Save to database
    saveInventoryToDatabase();
  };

  const handleUnequip = (item: KingdomInventoryItem) => {
    if (!userId) return;
    
    // Remove from equipped items
    setEquippedItems(prev => prev.filter(i => i.id !== item.id));
    
    // Add to stored items
    setStoredItems(prev => [...prev, { ...item, equipped: false }]);
    
    // Update stats
    const newStats = {
      movement: totalStats.movement - (item.stats?.movement || 0),
      attack: totalStats.attack - (item.stats?.attack || 0),
      defense: totalStats.defense - (item.stats?.defense || 0),
    };
    setTotalStats(newStats);
    
    // Save to database
    saveInventoryToDatabase();
  };

  const handleSellItem = (item: KingdomInventoryItem) => {
    if (!userId) return;
    
    const sellPrice = getItemSellPrice(item);
    
    // Remove from stored items
    setStoredItems(prev => prev.filter(i => i.id !== item.id));
    
    // Add gold
    gainGold(sellPrice, 'item-sale');
    
    // Save to database
    saveInventoryToDatabase();
    
    // Show success message
    toast({
      title: "Item Sold!",
      description: `Sold ${item.name} for ${sellPrice} gold!`,
    });
  };

  const saveInventoryToDatabase = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipped: equippedItems,
          stored: storedItems,
          stats: totalStats
        })
      });
      
      if (response.ok) {
        console.log('[Kingdom] Inventory saved to database');
      } else {
        console.error('[Kingdom] Failed to save inventory to database');
      }
    } catch (error) {
      console.error('[Kingdom] Error saving inventory:', error);
    }
  };

  const handleKingdomTileGoldEarned = (amount: number) => {
    // Use the unified gold system
    gainGold(amount, 'kingdom-tile-reward')
    
    // Trigger gold update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gold-updated', { 
        detail: { amount, source: 'kingdom-tile' } 
      }))
    }
  }

  const handleKingdomTileItemFound = (item: { image: string; name: string; type: string }) => {
    // Add item to inventory
    const inventoryItem: InventoryItem = {
      id: `kingdom-tile-${Date.now()}`,
      name: item.name,
      type: 'item', // Use 'item' as default type for kingdom tile items
      quantity: 1,
      image: item.image,
      description: `Found from kingdom tile: ${item.name}`,
      category: item.type
    }

    // Add to proper inventory system
    if (userId) {
      addToInventory(userId, inventoryItem);
    }

    // Also store in localStorage for backwards compatibility
    const existingItems = JSON.parse(localStorage.getItem('kingdom-tile-items') || '[]')
    existingItems.push(inventoryItem)
    localStorage.setItem('kingdom-tile-items', JSON.stringify(existingItems))

    // Trigger inventory update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inventory-updated', { 
        detail: { item: inventoryItem } 
      }))
    }
  }

  // 🎯 ANIMATION EFFECTS
  useEffect(() => {
    setShowEntrance(true);
    setZoomed(false);
    setMoveUp(false);
    
    const zoomTimeout = setTimeout(() => setZoomed(true), 1500);
    const moveUpTimeout = setTimeout(() => setMoveUp(true), 1500);
    const hideTimeout = setTimeout(() => setShowEntrance(false), 5000);
    
    return () => {
      clearTimeout(zoomTimeout);
      clearTimeout(moveUpTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  // 🎯 COVER IMAGE EFFECTS
  useEffect(() => {
    if (!userId) return;
    setCoverImageLoading(true);
    const loadCoverImage = async () => {
      const pref = await getUserPreference(userId, 'kingdom-header-image');
      if (pref) {
        setCoverImage(pref);
      } else {
        // Set default kingdom header image
        setCoverImage('/images/kingdom-header.jpg');
      }
      setCoverImageLoading(false);
    };
    loadCoverImage();
  }, [userId]);

  // 🎯 EARLY RETURNS - Must be after all useEffect hooks
  if (showEntrance) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black" style={{ width: '100vw', height: '100vh', padding: 0, margin: 0 }}>
        <div className="relative w-full h-full" style={{ overflow: 'hidden', padding: 0, margin: 0 }}>
          <Image
            src="/images/kingdom-tiles/Entrance.png"
            alt="Kingdom Entrance"
            fill
            className={`object-cover transition-transform ease-in-out kingdom-entrance-img`}
            style={{
              objectPosition: 'top center',
              transform:
                zoomed
                  ? `scale(16) translateY(-50%)`
                  : moveUp
                    ? 'scale(1) translateY(-50%)'
                    : 'scale(1) translateY(0%)',
              transition:
                zoomed && moveUp
                  ? 'transform 3s cubic-bezier(0.4,0,0.2,1) 2s, transform 3.5s cubic-bezier(0.4,0,0.2,1) 2s'
                  : zoomed
                    ? 'transform 3.5s cubic-bezier(0.4,0,0.2,1) 2s'
                    : moveUp
                      ? 'transform 3s cubic-bezier(0.4,0,0.2,1) 2s'
                      : 'none',
            }}
            unoptimized
          />
        </div>
      </div>
    );
  }

  // 🎯 SHOW LOADING STATE OR GRID
  if (gridLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-amber-500 mb-2">Loading Kingdom...</h2>
          <p className="text-gray-400">Creating your kingdom tiles</p>
        </div>
      </div>
    );
  }

  // 🎯 SHOW EMPTY STATE IF NO GRID
  if (!kingdomGrid || kingdomGrid.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Kingdom Grid Error</h2>
          <p className="text-gray-400 mb-4">Failed to load kingdom grid</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // 🎯 KINGDOM GRID HANDLERS
  const handlePlaceKingdomTile = (x: number, y: number, tile: Tile) => {
    const newGrid = kingdomGrid.map(row => row.slice());
    if (newGrid[y]) {
      newGrid[y][x] = { ...tile, x, y, id: `${tile.id}-${x}-${y}` };
      setKingdomGrid(newGrid);
      // Save to database
      saveKingdomGrid(newGrid);
    }
  };

  // 🎯 RENDER ITEM CARD
  const renderItemCard = (item: KingdomInventoryItem, isEquipped: boolean = false) => {
    const imagePath = getItemImagePath(item);
    
    return (
      <Card 
        key={item.id} 
        className={`bg-black border-2 border-amber-500/30 rounded-xl shadow-lg transition-all duration-300 hover:border-amber-400/50 hover:shadow-amber-500/20 hover:-translate-y-1 hover:scale-[1.02] ${isEquipped ? 'ring-2 ring-amber-500 shadow-amber-500/30' : ''}`}
        aria-label={`inventory-item-${item.id}`}
      >
        <div className="w-full h-80 relative overflow-hidden rounded-t-xl">
          <img
            src={imagePath}
            alt={`${item.name} ${item.type}`}
            className="object-cover w-full h-full"
            aria-label={`${item.name}-image`}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => { 
              (e.target as HTMLImageElement).src = "/images/placeholders/item-placeholder.svg"; 
            }}
          />
          {isEquipped && (
            <div className="absolute top-2 right-2">
              <div className="bg-amber-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                Equipped
              </div>
            </div>
          )}
        </div>
        
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-amber-500 text-lg font-semibold mb-1">
                {getItemDisplayName(item)}
              </CardTitle>
              {item.type && (
                <Badge className="text-xs bg-gray-700 text-gray-300 mb-2">
                  {item.type}
                </Badge>
              )}
              {item.description && (
                <CardDescription className="text-gray-400 text-sm leading-relaxed">
                  {item.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {item.stats && Object.keys(item.stats).length > 0 && (
                <div className="flex gap-2">
                  {item.stats.movement && (
                    <Badge variant="outline" className="text-xs">
                      🏃 {item.stats.movement}
                    </Badge>
                  )}
                  {item.stats.attack && (
                    <Badge variant="outline" className="text-xs">
                      ⚔️ {item.stats.attack}
                    </Badge>
                  )}
                  {item.stats.defense && (
                    <Badge variant="outline" className="text-xs">
                      🛡️ {item.stats.defense}
                    </Badge>
                  )}
                </div>
              )}
              {item.quantity && item.quantity > 1 && (
                <span className="text-gray-400 text-sm">
                  Qty: {item.quantity}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              {(isEquipped || isEquippable(item) || isConsumable(item)) && (
                <Button
                  size="sm"
                  onClick={() => isEquipped ? handleUnequip(item) : handleEquip(item)}
                  className={`${
                    isEquipped
                      ? 'bg-red-600 hover:bg-red-700'
                      : isEquippable(item)
                        ? 'bg-green-600 hover:bg-blue-700'
                        : isConsumable(item)
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  aria-label={
                    isEquipped
                      ? `Unequip ${item.name}`
                      : isConsumable(item)
                        ? `Use ${item.name}`
                        : isEquippable(item)
                          ? `Equip ${item.name}`
                          : undefined
                  }
                >
                  {isEquipped
                    ? "Unequip"
                    : isConsumable(item)
                      ? "Use"
                      : isEquippable(item)
                        ? "Equip"
                        : null}
                </Button>
              )}
              
              {!isEquipped && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSellItem(item)}
                  className="bg-orange-600 hover:bg-orange-700 text-white border-orange-500"
                  aria-label={`Sell ${item.name} for ${getItemSellPrice(item)} gold`}
                >
                  Sell {getItemSellPrice(item)}g
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // 🎯 MAIN RENDER
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Kingdom Header */}
      <HeaderSection 
        title="Kingdom of Thrivehaven"
        subtitle="Build your empire, one tile at a time"
        coverImage={coverImage}
        coverImageLoading={coverImageLoading}
        onCoverImageChange={(newImage) => setCoverImage(newImage)}
        userId={userId}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Kingdom Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-amber-500 mb-4">Kingdom Grid</h2>
          <KingdomTileGrid 
            grid={kingdomGrid}
            onTileClick={setSelectedKingdomTile}
            onGoldEarned={handleKingdomTileGoldEarned}
            onItemFound={handleKingdomTileItemFound}
          />
        </div>

        {/* Kingdom Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-amber-500 mb-4">Kingdom Statistics</h2>
          <KingdomStatsBlock />
        </div>

        {/* Inventory Tabs */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-amber-500 mb-4">Inventory</h2>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="equipped">Equipped ({equippedItems.length})</TabsTrigger>
              <TabsTrigger value="stored">Stored ({storedItems.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="equipped" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {equippedItems.map(item => renderItemCard(item, true))}
                {equippedItems.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-400">
                    No items equipped. Equip items to boost your stats!
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="stored" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storedItems.map(item => renderItemCard(item, false))}
                {storedItems.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-400">
                    No items in storage. Complete quests to find items!
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Properties */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-amber-500 mb-4">Kingdom Properties</h2>
          <KingdomPropertiesInventory />
        </div>

        {/* Progression */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-amber-500 mb-4">Progression</h2>
          <ProgressionVisualization />
        </div>

        {/* Economy Transparency */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-amber-500 mb-4">Economy Transparency</h2>
          <EconomyTransparency />
        </div>
      </div>

      {/* Kingdom Tile Modal */}
      {selectedKingdomTile && (
        <Dialog open={!!selectedKingdomTile} onOpenChange={() => setSelectedKingdomTile(null)}>
          <DialogContent className="bg-black border-amber-500 text-white">
            <DialogHeader>
              <DialogTitle className="text-amber-500">{selectedKingdomTile.name}</DialogTitle>
              <DialogDescription>{selectedKingdomTile.description}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <img 
                src={selectedKingdomTile.image} 
                alt={selectedKingdomTile.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <p className="text-gray-300">{selectedKingdomTile.description}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedKingdomTile(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Selling Modal */}
      <Dialog open={sellingModalOpen} onOpenChange={setSellingModalOpen}>
        <DialogContent className="bg-black border-amber-500 text-white">
          <DialogHeader>
            <DialogTitle>Item Sold!</DialogTitle>
            <DialogDescription>
              {soldItem && `You sold ${soldItem.name} for ${soldItem.gold} gold!`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSellingModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}