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

// Helper to create an empty kingdom grid
function createEmptyKingdomGrid(): Tile[][] {
  const KINGDOM_GRID_ROWS = 12; // Doubled from 6 to 12 rows
  const KINGDOM_GRID_COLS = 6;
  const VACANT_TILE_IMAGE = '/images/kingdom-tiles/Vacant.png';
  
  const grid = Array.from({ length: KINGDOM_GRID_ROWS }, (_, y) =>
    Array.from({ length: KINGDOM_GRID_COLS }, (_, x) => ({
      id: `vacant-${x}-${y}`,
      type: 'empty' as TileType,
      name: 'Vacant',
      description: 'An empty plot of land.',
      connections: [] as ConnectionDirection[],
      rotation: 0 as 0 | 90 | 180 | 270,
      revealed: true,
      isVisited: false,
      x,
      y,
      ariaLabel: `Vacant tile at ${x},${y}`,
      image: VACANT_TILE_IMAGE,
    }))
  );
  
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
    { x: 1, y: 4, type: 'house' as TileType },
    { x: 2, y: 4, type: 'mansion' as TileType },
    { x: 3, y: 4, type: 'jousting' as TileType },
    { x: 4, y: 4, type: 'archery' as TileType },
    { x: 5, y: 4, type: 'watchtower' as TileType },
  ];
  
  defaultKingdomTiles.forEach(({ x, y, type }) => {
    const kingdomTile = KINGDOM_TILES.find(kt => kt.id === type);
    if (kingdomTile && grid[y] && grid[y][x]) {
      grid[y][x] = {
        id: `${type}-${x}-${y}`,
        type: type,
        name: kingdomTile.name,
        description: kingdomTile.clickMessage,
        connections: [],
        rotation: 0 as 0 | 90 | 180 | 270,
        revealed: true,
        isVisited: false,
        x,
        y,
        ariaLabel: `${kingdomTile.name} at ${x},${y}`,
        image: kingdomTile.image,
      };
    }
  });
  
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
  // Add debugging to see what userId value we're getting
      // userId received
  
  const { toast } = useToast();
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [equippedItems, setEquippedItems] = useState<KingdomInventoryItem[]>([]);
  const [storedItems, setStoredItems] = useState<KingdomInventoryItem[]>([]);
  const [totalStats, setTotalStats] = useState<{ movement: number; attack: number; defense: number }>({ movement: 0, attack: 0, defense: 0 });
  const [modalOpen, setModalOpen] = useState(false)
  const [modalText, setModalText] = useState("")
  const [activeTab, setActiveTab] = useState("equipped")
  const [kingdomTab, setKingdomTab] = useState("thrivehaven");
  const [kingdomGrid, setKingdomGrid] = useState<Tile[][]>(createEmptyKingdomGrid());
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

  // Debug: Log kingdom tiles configuration
  useEffect(() => {
    // Removed debugging logs
  }, [kingdomTileInventory]);

  // Initialize timers for default kingdom tiles (only if they don't exist)
  useEffect(() => {
    // Check if timers already exist
    const existingTimers = localStorage.getItem('kingdom-tile-timers');
    
    if (!existingTimers) {
      // Removed debugging log
      
      const defaultTimers = [
        { x: 1, y: 1, tileId: 'well', endTime: Date.now() + (10 * 60 * 1000), isReady: false }, // 10 min
        { x: 2, y: 1, tileId: 'blacksmith', endTime: Date.now() + (30 * 60 * 1000), isReady: false }, // 30 min
        { x: 3, y: 1, tileId: 'fisherman', endTime: Date.now() + (15 * 60 * 1000), isReady: false }, // 15 min
        { x: 4, y: 1, tileId: 'sawmill', endTime: Date.now() + (45 * 60 * 1000), isReady: false }, // 45 min
        { x: 5, y: 1, tileId: 'windmill', endTime: Date.now() + (20 * 60 * 1000), isReady: false }, // 20 min
        { x: 1, y: 2, tileId: 'grocery', endTime: Date.now() + (5 * 60 * 1000), isReady: false }, // 5 min
        { x: 2, y: 2, tileId: 'castle', endTime: Date.now() + (480 * 60 * 1000), isReady: false }, // 8 hours (legendary)
        { x: 3, y: 2, tileId: 'temple', endTime: Date.now() + (60 * 60 * 1000), isReady: false }, // 1 hour
        { x: 4, y: 2, tileId: 'fountain', endTime: Date.now() + (25 * 60 * 1000), isReady: false }, // 25 min
        { x: 5, y: 2, tileId: 'pond', endTime: Date.now() + (12 * 60 * 1000), isReady: false }, // 12 min
        { x: 1, y: 3, tileId: 'foodcourt', endTime: Date.now() + (8 * 60 * 1000), isReady: false }, // 8 min
        { x: 2, y: 3, tileId: 'vegetables', endTime: Date.now() + (35 * 60 * 1000), isReady: false }, // 35 min
        { x: 3, y: 3, tileId: 'wizard', endTime: Date.now() + (90 * 60 * 1000), isReady: false }, // 1.5 hours
        { x: 4, y: 3, tileId: 'mayor', endTime: Date.now() + (75 * 60 * 1000), isReady: false }, // 1.25 hours
        { x: 5, y: 3, tileId: 'inn', endTime: Date.now() + (18 * 60 * 1000), isReady: false }, // 18 min
        { x: 1, y: 4, tileId: 'house', endTime: Date.now() + (22 * 60 * 1000), isReady: false }, // 22 min
        { x: 2, y: 4, tileId: 'mansion', endTime: Date.now() + (120 * 60 * 1000), isReady: false }, // 2 hours
        { x: 3, y: 4, tileId: 'jousting', endTime: Date.now() + (150 * 60 * 1000), isReady: false }, // 2.5 hours
        { x: 4, y: 4, tileId: 'archery', endTime: Date.now() + (28 * 60 * 1000), isReady: false }, // 28 min
        { x: 5, y: 4, tileId: 'watchtower', endTime: Date.now() + (65 * 60 * 1000), isReady: false }, // 1.1 hours
      ];
      
      // Save default timers
      localStorage.setItem('kingdom-tile-timers', JSON.stringify(defaultTimers));
    } else {
      // Removed debugging log
    }
    
    // Load kingdom grid (preserve existing if available)
    const existingGrid = localStorage.getItem('kingdom-grid');
    if (existingGrid) {
      try {
        const parsedGrid = JSON.parse(existingGrid);
        setKingdomGrid(parsedGrid);
      } catch (error) {
        console.warn('[Kingdom] Failed to parse existing grid, creating new one');
        setKingdomGrid(createEmptyKingdomGrid());
      }
    } else {
      setKingdomGrid(createEmptyKingdomGrid());
    }
  }, []);

  // Helper to determine if an item is consumable
  const isConsumable = (item: KingdomInventoryItem) => {
    return item.type === 'artifact' || item.type === 'scroll' || (item.type === 'item' && !item.category);
  };

  // Handler for equipping items
  const handleEquip = (item: KingdomInventoryItem) => {
    // For consumables, show modal
    if (item.type === 'artifact' || item.type === 'scroll' || (item.type === 'item' && !item.category)) {
      setModalText(getConsumableEffect(item));
      setModalOpen(true);
    }
    if (userId) equipItem(userId, item.id);
  };

  // Handler for unequipping items
  const handleUnequip = (item: KingdomInventoryItem) => {
    if (userId) unequipItem(userId, item.id);
  };

  // Get sell price for an item
  const getItemSellPrice = (item: KingdomInventoryItem): number => {
    // Base prices for different item types
    const basePrices: Record<string, number> = {
      'weapon': 50,
      'armor': 40,
      'shield': 35,
      'helmet': 25,
      'boots': 20,
      'gloves': 15,
      'ring': 30,
      'necklace': 35,
      'artifact': 100,
      'scroll': 25,
      'potion': 15,
      'food': 8,
      'material': 5,
      'item': 10
    };
    
    // Get base price for item type, default to 10
    const basePrice = basePrices[item.type] || 10;
    
    // Add bonus for items with stats
    let bonus = 0;
    if (item.stats) {
      Object.values(item.stats).forEach(stat => {
        if (typeof stat === 'number') {
          bonus += stat * 5; // +5 gold per stat point
        }
      });
    }
    
    // Add rarity bonus based on item name/type - more comprehensive
    const itemName = item.name.toLowerCase();
    if (itemName.includes('golden') || itemName.includes('rainbow') || itemName.includes('legendary')) {
      bonus += 25; // Legendary items
    } else if (itemName.includes('epic') || itemName.includes('dragon')) {
      bonus += 20; // Epic items
    } else if (itemName.includes('rare') || itemName.includes('silver')) {
      bonus += 15; // Rare items
    } else if (itemName.includes('iron') || itemName.includes('steel') || itemName.includes('magic')) {
      bonus += 12; // Uncommon items
    } else if (itemName.includes('gold') || itemName.includes('crystal')) {
      bonus += 8; // Special items
    }
    
    // Add bonus for specific item types
    if (item.type === 'artifact') bonus += 30;
    if (item.type === 'weapon' && itemName.includes('sword')) bonus += 10;
    if (item.type === 'armor' && itemName.includes('plate')) bonus += 15;
    
    return Math.max(5, basePrice + bonus); // Minimum 5 gold
  };

  // Handle selling items
  const handleSellItem = async (item: KingdomInventoryItem) => {
    // Removed debugging log
    
    if (!userId) {
      // Removed debugging log
      toast({
        title: "Error",
        description: "You must be logged in to sell items",
        variant: "destructive",
      });
      return;
    }
    
    const sellPrice = getItemSellPrice(item);
    // Removed debugging log
    
    try {
      // Remove item from Supabase inventory
      const response = await fetch('/api/inventory/remove-item', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id })
      });
      
      // Removed debugging log
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Sell] Response error:', errorText);
        throw new Error(`Failed to remove item from inventory: ${response.status} ${response.statusText}`);
      }
      
      // Give gold for the sale
      gainGold(sellPrice, `sell-${item.name.toLowerCase()}`);
      
      // Show selling confirmation modal
      setSoldItem({ name: item.name, gold: sellPrice });
      setSellingModalOpen(true);
      
      // Refresh inventory from Supabase
      const equipped = await getEquippedItems(userId);
      const stored = await getStoredItems(userId);
      setEquippedItems(equipped);
      setStoredItems(stored);
    } catch (error) {
      console.error('Failed to sell item:', error);
      toast({
        title: "Error",
        description: `Failed to sell item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Restore handlePlaceKingdomTile for KingdomGrid
  function handlePlaceKingdomTile(x: number, y: number, tile: Tile) {
    setKingdomGrid(prev => {
      const newGrid = prev.map(row => row.slice());
      if (newGrid[y]) {
        newGrid[y][x] = { ...tile, x, y, id: `${tile.id}-${x}-${y}` };
      }
      return newGrid;
    });
    
    // Save the updated grid
    const updatedGrid = kingdomGrid.map(row => row.slice());
    if (updatedGrid[y]) {
      updatedGrid[y][x] = { ...tile, x, y, id: `${tile.id}-${x}-${y}` };
    }
    
    // Save to API
    fetch('/api/kingdom-grid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grid: updatedGrid })
    }).catch(error => {
      console.error('Failed to save kingdom grid:', error);
    });
  }

  // Restore renderItemCard for inventory display
  const renderItemCard = (item: KingdomInventoryItem, isEquipped: boolean = false) => {
    const imagePath = getItemImagePath(item);
    
    return (
      <Card 
        key={item.id} 
        className={`bg-black border-2 border-amber-500/30 rounded-xl shadow-lg transition-all duration-300 hover:border-amber-400/50 hover:shadow-amber-500/20 hover:-translate-y-1 hover:scale-[1.02] ${isEquipped ? 'ring-2 ring-amber-500 shadow-amber-500/30' : ''}`}
        aria-label={`inventory-item-${item.id}`}
      >
        {/* Full-width image container */}
        <div className="w-full h-80 relative overflow-hidden rounded-t-xl">
          <img
            src={imagePath}
            alt={`${item.name} ${item.type}`}
            className="object-cover w-full h-full"
            aria-label={`${item.name}-image`}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => { 
              (e.target as HTMLImageElement).src = "/images/placeholders/item-placeholder.svg"; 
            }}
            onLoad={() => {
            }}
          />
          {/* Equipped label in top right corner */}
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
              {/* Only render the action button if it has valid content */}
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
              
              {/* Sell button for stored items */}
              {!isEquipped && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Removed debugging logs
                    handleSellItem(item);
                  }}
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

  // All useEffect hooks at the top
  useEffect(() => {
    setShowEntrance(true);
    setZoomed(false);
    setMoveUp(false);
    // Linger for 1.5s, then start zoom (3.5s duration) - 0.5s shorter
    const zoomTimeout = setTimeout(() => setZoomed(true), 1500);
    // Start move up at 1.5s (3s duration) - 0.5s shorter
    const moveUpTimeout = setTimeout(() => setMoveUp(true), 1500);
    // Hide overlay and show main content after animation completes (5s total)
    const hideTimeout = setTimeout(() => setShowEntrance(false), 5000);
    return () => {
      clearTimeout(zoomTimeout);
      clearTimeout(moveUpTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  // Load kingdom grid on mount
  useEffect(() => {
    if (!userId) return;
    
    const loadKingdomGrid = async () => {
      try {
        const response = await fetch('/api/kingdom-grid');
        if (response.ok) {
          const data = await response.json();
          if (data.grid) {
            setKingdomGrid(data.grid);
          }
        }
      } catch (error) {
        console.error('Failed to load kingdom grid:', error);
      }
    };

    loadKingdomGrid();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    setInventoryLoading(true);
    const loadInventory = async () => {
      try {
        // Removed debugging log
        const equipped = await getEquippedItems(userId);
        const stored = await getStoredItems(userId);
        const stats = await getTotalStats(userId);
        
        // Removed debugging log
        
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
        
        // Ensure equipped and stored are arrays
        const equippedArray = Array.isArray(equipped) ? equipped : [];
        const storedArray = Array.isArray(stored) ? stored : [];
        
        let equippedItemsToShow = normalizeItems(equippedArray.filter(isEquippable));
        
        // 🎯 SHOW DEFAULT ITEMS if no items are equipped
        if (equippedItemsToShow.length === 0) {
          // No equipped items found, showing default items
          equippedItemsToShow = defaultInventoryItems.map(item => ({
            ...item,
            stats: item.stats || {},
            description: item.description || '',
            equipped: true,
            type: item.type as any, // Convert to compatible type
            category: item.type,
          })) as KingdomInventoryItem[];
        }
        
        setEquippedItems(equippedItemsToShow);
        setStoredItems(normalizeItems(storedArray));
        
        // 🎯 CALCULATE STATS from equipped items (including defaults)
        const calculatedStats = equippedItemsToShow.reduce(
          (totals, item) => {
            const itemStats = item.stats || {};
            return {
              movement: totals.movement + (itemStats.movement || 0),
              attack: totals.attack + (itemStats.attack || 0),
              defense: totals.defense + (itemStats.defense || 0),
            };
          },
          { movement: 0, attack: 0, defense: 0 }
        );
        
        setTotalStats(calculatedStats);
        // Removed debugging log
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
            const itemStats = item.stats || {};
            return {
              movement: totals.movement + (itemStats.movement || 0),
              attack: totals.attack + (itemStats.attack || 0),
              defense: totals.defense + (itemStats.defense || 0),
            };
          },
          { movement: 0, attack: 0, defense: 0 }
        );
        setTotalStats(defaultStats);
      } finally {
        setInventoryLoading(false);
      }
    };
    
    loadInventory();
    
    const handleInventoryUpdate = () => {
      // Only reload if not currently loading to prevent rapid fire requests
      if (!document.querySelector('[data-inventory-loading="true"]')) {
        loadInventory();
      }
    };
    
    window.addEventListener('character-inventory-update', handleInventoryUpdate);
    
    // 🎯 LISTEN FOR QUEST COMPLETION GOLD/XP UPDATES
    const handleGoldUpdate = (event: CustomEvent) => {
      // Removed debugging log
      // Force refresh kingdom stats when gold is gained
      loadInventory();
    };
    
    const handleXPUpdate = (event: CustomEvent) => {
      // Removed debugging log
      // Force refresh kingdom stats when XP is gained  
      loadInventory();
    };
    
    window.addEventListener('kingdom:goldGained', handleGoldUpdate as EventListener);
    window.addEventListener('kingdom:experienceGained', handleXPUpdate as EventListener);
    window.addEventListener('character-stats-update', handleInventoryUpdate);
    
    return () => {
      window.removeEventListener('character-inventory-update', handleInventoryUpdate);
      window.removeEventListener('kingdom:goldGained', handleGoldUpdate as EventListener);
      window.removeEventListener('kingdom:experienceGained', handleXPUpdate as EventListener);
      window.removeEventListener('character-stats-update', handleInventoryUpdate);
    };
  }, [userId]);

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
  // After animation, show the main content immediately
  return (
    <div className="min-h-screen">
      {/* Main Content with Tabs */}
      <HeaderSection
        title="KINGDOM"
        imageSrc={coverImage || ""}
        canEdit={!!userId}
        onImageUpload={async (file) => {
          const reader = new FileReader();
          reader.onload = async (event: ProgressEvent<FileReader>) => {
            const result = event.target?.result as string;
            setCoverImage(result);
            if (userId) {
              await setUserPreference(userId, 'kingdom-header-image', result);
            }
          };
          reader.readAsDataURL(file);
        }}
        className=""
        shouldRevealImage={true}
      />

      <AlertDialog open={modalOpen} onOpenChange={setModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Item Used</AlertDialogTitle>
            <AlertDialogDescription>{modalText}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setModalOpen(false)} aria-label="Close modal">Close</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Content with Tabs */}
      <div className="container mx-auto p-6 space-y-6" aria-label="kingdom-main-content">
        <Tabs value={kingdomTab} onValueChange={setKingdomTab} className="w-full">
          <TabsList className="mb-6 w-full grid grid-cols-4">
            <TabsTrigger value="thrivehaven">Thrivehaven</TabsTrigger>
            <TabsTrigger value="journey">Journey</TabsTrigger>
            <TabsTrigger value="inventory">Bag</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>
          <TabsContent value="thrivehaven">
            <div className="flex flex-col items-center justify-center w-full">
              <div className="flex items-center justify-center w-full">
                <KingdomGridWithTimers
                  grid={kingdomGrid}
                  onTilePlace={handlePlaceKingdomTile}
                  selectedTile={selectedKingdomTile}
                  setSelectedTile={setSelectedKingdomTile}
                  onGridExpand={(newGrid: Tile[][]) => setKingdomGrid(newGrid)}
                  onGridUpdate={(newGrid: Tile[][]) => setKingdomGrid(newGrid)}
                  onGoldEarned={handleKingdomTileGoldEarned}
                  onItemFound={handleKingdomTileItemFound}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="journey">
            <div className="space-y-6">
              {/* Progression Visualization */}
              <div className="mb-6">
                <ProgressionVisualization />
              </div>
              
              {/* Economy Transparency */}
              <div className="mb-6">
                <EconomyTransparency />
              </div>
              
              {/* Existing Stats Blocks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="w-full" aria-label="kingdom-stats-block-container">
                  <KingdomStatsBlock userId={userId} />
                </div>
                <div className="w-full" aria-label="king-stats-block-container">
                  <KingStatsBlock userId={userId} />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="inventory">
            <Card className="bg-black border-amber-800/50" aria-label="kingdom-bag-card">
              <CardHeader>
                <CardTitle className="text-amber-500">Kingdom Bag</CardTitle>
                <CardDescription className="text-gray-400">Your equipment and resources</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="equipped" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="mb-4 md:hidden">
                    <label htmlFor="kingdom-inventory-tab-select" className="sr-only">Select inventory tab</label>
                    <select
                      id="kingdom-inventory-tab-select"
                      aria-label="Kingdom inventory tab selector"
                      className="w-full rounded-md border border-amber-800/20 bg-black text-white p-2"
                      value={activeTab}
                      onChange={e => setActiveTab(e.target.value)}
                    >
                      <option value="equipped">Equipped</option>
                      <option value="stored">Stored</option>
                    </select>
                  </div>
                  <TabsList className="grid w-full grid-cols-2 bg-black border-amber-800/30 hidden md:grid">
                    <TabsTrigger value="equipped" aria-label="equipped-tab">Equipped</TabsTrigger>
                    <TabsTrigger value="stored" aria-label="stored-tab">Stored</TabsTrigger>
                  </TabsList>
                  {inventoryLoading ? (
                    <div className="text-center text-gray-400 py-8">Loading inventory...</div>
                  ) : (
                    <>
                      <TabsContent value="equipped" className="mt-4">
                        {equippedItems.length === 0 ? (
                          <div className="text-center text-gray-400 py-8">
                            No items equipped
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="equipped-items-grid">
                            {equippedItems.map((item) => renderItemCard(item, true))}
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="stored" className="mt-4">
                        {storedItems.length === 0 ? (
                          <Card className="bg-black/50 border-amber-800/30 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                              <div className="w-16 h-16 mb-4 rounded-full bg-amber-900/30 flex items-center justify-center">
                                <span className="text-2xl">🎒</span>
                              </div>
                              <h3 className="text-amber-500 font-semibold text-lg mb-2">Your bag is empty</h3>
                              <p className="text-gray-400 text-sm leading-relaxed">
                                Keep traversing the land and buy new items to be better equipped.
                              </p>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="stored-items-grid">
                            {storedItems.map((item) => renderItemCard(item, false))}
                          </div>
                        )}
                      </TabsContent>
                    </>
                  )}
                </Tabs>
              </CardContent>
            </Card>
                     </TabsContent>
           <TabsContent value="rewards">
             <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
               <CardHeader>
                 <CardTitle className="text-xl font-bold text-blue-100">
                   Kingdom Rewards
                 </CardTitle>
                 <CardDescription className="text-blue-200">
                   Visit your kingdom tiles to earn gold and find items
                 </CardDescription>
               </CardHeader>
               <CardContent>
                                 <KingdomTileGrid 
                  onGoldEarned={handleKingdomTileGoldEarned}
                  onItemFound={handleKingdomTileItemFound}
                  kingdomGrid={kingdomGrid}
                />
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
       </div>
      {/* Bottom spacing */}
      <div className="h-8 md:h-12"></div>
      
      {/* Selling Confirmation Modal */}
      <Dialog open={sellingModalOpen} onOpenChange={setSellingModalOpen}>
        <DialogContent className="bg-gray-900 border-amber-800/20" role="dialog" aria-label="selling-confirmation-modal">
          <DialogDescription id="selling-confirmation-modal-desc">Item sold confirmation</DialogDescription>
          <DialogHeader>
            <DialogTitle className="text-2xl font-cardo text-amber-500">
              Item Sold Successfully!
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              You have successfully sold an item and gained gold.
            </DialogDescription>
          </DialogHeader>

          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-900/30 flex items-center justify-center">
              <span className="text-3xl">💰</span>
            </div>
            <h3 className="text-xl font-cardo text-white mb-2">{soldItem?.name}</h3>
            <p className="text-amber-400 text-2xl font-bold">+{soldItem?.gold} Gold</p>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setSellingModalOpen(false)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 