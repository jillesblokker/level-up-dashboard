"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { useUser, useAuth } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HeaderSection } from "@/components/HeaderSection"
import { defaultInventoryItems } from "@/app/lib/default-inventory"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  getKingdomInventory,
  getEquippedItems,
  getStoredItems,
  equipItem,
  unequipItem,
  getTotalStats,
  addToInventory,
  removeFromKingdomInventory,
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
import { gainExperience } from '@/lib/experience-manager';
import { updateCharacterStats, getCharacterStats, fetchFreshCharacterStats } from '@/lib/character-stats-service';
import { KINGDOM_TILES } from '@/lib/kingdom-tiles';
import {
  saveKingdomGrid,
  saveKingdomTimers,
  saveKingdomItems,
  saveKingdomTileStates,
  loadKingdomGrid,
  loadKingdomTimers,
  loadKingdomItems,
  loadKingdomTileStates
} from '@/lib/supabase-persistence-client'
import { KingdomGuide } from '@/components/kingdom/kingdom-guide'
import dynamic from 'next/dynamic';
const RevealOverlay = dynamic(() => import('../reveal/page'), {
  ssr: false,
  loading: () => null
});
import { Users, Crown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEXT_CONTENT } from "@/lib/text-content";

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
    name: TEXT_CONTENT.kingdom.potions.strength.name,
    perks: [
      { name: TEXT_CONTENT.kingdom.potions.strength.perks.might.name, effect: TEXT_CONTENT.kingdom.potions.strength.perks.might.effect },
      { name: TEXT_CONTENT.kingdom.potions.strength.perks.vitality.name, effect: TEXT_CONTENT.kingdom.potions.strength.perks.vitality.effect },
    ],
  },
  "elixir of wisdom": {
    name: TEXT_CONTENT.kingdom.potions.wisdom.name,
    perks: [
      { name: TEXT_CONTENT.kingdom.potions.wisdom.perks.knowledge.name, effect: TEXT_CONTENT.kingdom.potions.wisdom.perks.knowledge.effect },
      { name: TEXT_CONTENT.kingdom.potions.wisdom.perks.honor.name, effect: TEXT_CONTENT.kingdom.potions.wisdom.perks.honor.effect },
    ],
  },
  "elixir of fortitude": {
    name: TEXT_CONTENT.kingdom.potions.fortitude.name,
    perks: [
      { name: TEXT_CONTENT.kingdom.potions.fortitude.perks.castle.name, effect: TEXT_CONTENT.kingdom.potions.fortitude.perks.castle.effect },
      { name: TEXT_CONTENT.kingdom.potions.fortitude.perks.craft.name, effect: TEXT_CONTENT.kingdom.potions.fortitude.perks.craft.effect },
    ],
  },
}

function getRandomFromArray<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error('Array is empty');
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// Function to merge default grid with user-placed tiles
function mergeGrids(defaultGrid: Tile[][], userGrid: Tile[][]): Tile[][] {
  const mergedGrid = defaultGrid.map((row, y) =>
    row.map((cell, x) => {
      // If user has placed a tile at this position, use it
      if (userGrid[y] && userGrid[y][x] && userGrid[y][x].type && userGrid[y][x].type !== 'vacant') {
        return userGrid[y][x];
      }
      // Otherwise, use the default tile (kingdom tile or vacant)
      return cell;
    })
  );

  return mergedGrid;
}

const getConsumableEffect = (item: KingdomInventoryItem) => {
  // Artifacts: 60, 80, or 100 gold
  if (item.type === 'artifact') {
    const gold = getRandomFromArray([60, 80, 100])
    // Use the unified gold system
    gainGold(gold, 'artifact-consumption')
    return TEXT_CONTENT.kingdom.consumables.artifact.replace('{gold}', gold.toString())
  }
  // Scrolls: 10, 25, or 50 gold
  if (item.type === 'scroll') {
    const gold = getRandomFromArray([10, 25, 50])
    // Use the unified gold system
    gainGold(gold, 'scroll-consumption')
    return TEXT_CONTENT.kingdom.consumables.scroll.replace('{gold}', gold.toString())
  }
  // Potions: handle each potion type explicitly
  if (item.type === 'item' && item.name) {
    const key = item.name.toLowerCase();
    if (key === 'health potion') {
      // Restore health via unified service
      const stats = getCharacterStats();
      const newHealth = Math.min((stats.health || 0) + 50, stats.max_health || 100);
      updateCharacterStats({ health: newHealth }, 'item-use:health-potion');
      return TEXT_CONTENT.kingdom.consumables.healthPotion;
    }
    if (key === 'gold potion') {
      // Use the dedicated gold manager
      gainGold(50, 'item-use:gold-potion');
      return TEXT_CONTENT.kingdom.consumables.goldPotion;
    }
    if (key === 'experience potion' || key === 'exp potion') {
      // Use the dedicated experience manager
      gainExperience(50, 'item-use:experience-potion', 'general');
      return TEXT_CONTENT.kingdom.consumables.xpPotion;
    }
    // Other potions: use perk logic
    if (potionPerkMap[key]) {
      const perk = getRandomFromArray(potionPerkMap[key].perks)
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const activePerks = JSON.parse(localStorage.getItem('active-potion-perks') || '{}')
      activePerks[perk.name] = { effect: perk.effect, expiresAt: expiresAt.toISOString() }
      localStorage.setItem('active-potion-perks', JSON.stringify(activePerks))
      return TEXT_CONTENT.kingdom.consumables.perkActive
        .replace('{item}', getItemDisplayName(item))
        .replace('{perkName}', perk.name)
        .replace('{perkEffect}', perk.effect)
    }
  }
  return TEXT_CONTENT.kingdom.consumables.generic.replace('{item}', getItemDisplayName(item) || 'item')
}

// Helper to get display name (remove category prefix like "fish-", "horse-", etc.)
function getItemDisplayName(item: KingdomInventoryItem): string {
  if (!item.name) return TEXT_CONTENT.kingdom.ui.inventory.unknownItem;

  // 1. Check direct mapping in TEXT_CONTENT
  // @ts-ignore - Dynamic key access
  if (TEXT_CONTENT.kingdom.items[item.name]) {
    // @ts-ignore
    return TEXT_CONTENT.kingdom.items[item.name];
  }

  // 2. Fallback: Split by hyphen and formatted
  const parts = item.name.split('-');
  if (parts.length > 1) {
    const displayName = parts.slice(1).join('-');
    return displayName.charAt(0).toUpperCase() + displayName.slice(1);
  }

  // 3. Last resort: Original name
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
  console.log('[Kingdom] createEmptyKingdomGrid called');

  const KINGDOM_GRID_ROWS = 12; // Doubled from 6 to 12 rows
  const KINGDOM_GRID_COLS = 6;
  const VACANT_TILE_IMAGE = '/images/kingdom-tiles/Vacant.png';

  const grid = Array.from({ length: KINGDOM_GRID_ROWS }, (_, y) =>
    Array.from({ length: KINGDOM_GRID_COLS }, (_, x) => ({
      id: `vacant-${x}-${y}`,
      type: 'vacant' as TileType,
      name: 'Vacant',
      description: TEXT_CONTENT.kingdomGrid.expansion.vacantTile.description,
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

  console.log('[Kingdom] Base grid created with dimensions:', { rows: KINGDOM_GRID_ROWS, cols: KINGDOM_GRID_COLS });

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
        grid[y][x] = {
          id: `${type}-${x}-${y}`,
          type: type,
          name: kingdomTile.name || TEXT_CONTENT.kingdomTiles.unknown.name,
          description: kingdomTile.clickMessage || TEXT_CONTENT.kingdomTiles.unknown.description,
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
    'Crossroad.png', 'Straightroad.png', 'Cornerroad.png', 'Tsplitroad.png', 'Archery.png', 'Blacksmith.png', 'Castle.png', 'Fisherman.png', 'Foodcourt.png', 'Fountain.png', 'Grocery.png', 'House.png', 'Inn.png', 'Jousting.png', 'Mansion.png', 'Mayor.png', 'Pond.png', 'Sawmill.png', 'Temple.png', 'Vegetables.png', 'Watchtower.png', 'Well.png', 'Windmill.png', 'Wizard.png'
  ];
  return KINGDOM_TILE_IMAGES.map((filename, idx) => {
    const tileName = filename.replace('.png', '');
    const isCastle = filename === 'Castle.png';
    // Find the corresponding kingdom tile configuration
    let kingdomTileConfig = KINGDOM_TILES.find(kt =>
      kt.name.toLowerCase() === tileName.toLowerCase() ||
      kt.name.toLowerCase().replace(' ', '') === tileName.toLowerCase()
    );

    // Fallback logic to ensure visibility
    if (!kingdomTileConfig) {
      if (tileName === 'Crossroad') {
        kingdomTileConfig = { id: 'crossroad', name: 'Crossroad', clickMessage: 'A Crossroad tile', image: '/images/kingdom-tiles/Crossroad.png' } as any;
      } else if (tileName === 'Straightroad') {
        kingdomTileConfig = { id: 'straightroad', name: 'Straight Road', clickMessage: 'A Straight Road tile', image: '/images/kingdom-tiles/Straightroad.png' } as any;
      } else if (tileName === 'Cornerroad') {
        kingdomTileConfig = { id: 'cornerroad', name: 'Corner Road', clickMessage: 'A Corner Road tile', image: '/images/kingdom-tiles/Cornerroad.png' } as any;
      } else if (tileName === 'Tsplitroad') {
        kingdomTileConfig = { id: 'tsplitroad', name: 'T-Split Road', clickMessage: 'A T-Split Road tile', image: '/images/kingdom-tiles/Tsplitroad.png' } as any;
      }
    }

    return {
      id: kingdomTileConfig ? kingdomTileConfig.id : `kingdom-tile-${idx}`,
      type: kingdomTileConfig ? (kingdomTileConfig.id as TileType) : 'special',
      name: tileName,
      description: kingdomTileConfig ? kingdomTileConfig.clickMessage : `${TEXT_CONTENT.kingdomTiles.specialPrefix}${tileName}`,
      connections: [] as ConnectionDirection[],
      rotation: 0,
      revealed: true,
      isVisited: false,
      x: 0,
      y: 0,
      ariaLabel: `Kingdom tile: ${tileName}`,
      image: `/images/kingdom-tiles/${filename}`,
      cost: kingdomTileConfig?.cost || 0,
      tokenCost: kingdomTileConfig?.tokenCost,
      materialCost: kingdomTileConfig?.materialCost,
      quantity: isCastle ? 1 : 0,
      levelRequired: kingdomTileConfig?.levelRequired,
    };
  });
}

export function KingdomClient() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const visitUserId = searchParams?.get('visit');
  const isVisiting = !!visitUserId && visitUserId !== user?.id;

  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [equippedItems, setEquippedItems] = useState<KingdomInventoryItem[]>([]);
  const [storedItems, setStoredItems] = useState<KingdomInventoryItem[]>([]);
  const [localItems, setLocalItems] = useState<KingdomInventoryItem[]>([]);

  const mergedItems = useMemo(() => {
    const items = [...storedItems];
    localItems.forEach(localItem => {
      // Relaxed matching: case-insensitive ID, or ID variants, or name-based
      const localName = localItem.name?.toLowerCase();
      const idx = items.findIndex(i => {
        // ID-based matches
        if (i.id === localItem.id) return true;
        if (i.id.toLowerCase() === localItem.id.toLowerCase()) return true;
        if (i.id === `${localItem.id}-item`) return true;

        // Name-based matches (crucial for UUID vs string ID scenarios)
        if (localName && i.name?.toLowerCase() === localName) return true;

        return false;
      });

      if (idx >= 0) {
        const existing = items[idx];
        const newQty = (existing?.quantity || 0) + localItem.quantity;
        items[idx] = { ...existing, quantity: newQty } as KingdomInventoryItem;
      } else {
        items.push(localItem);
      }
    });
    return items;
  }, [storedItems, localItems]);



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
  const [fadeOut, setFadeOut] = useState(false);
  const isInitialSaveRef = useRef(true);

  const [kingdomContent, setKingdomContent] = useState<JSX.Element | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [coverImageLoading, setCoverImageLoading] = useState(true);
  const [gridLoading, setGridLoading] = useState(true);
  const [sellingModalOpen, setSellingModalOpen] = useState(false);
  const [soldItem, setSoldItem] = useState<{ name: string; gold: number } | null>(null);
  const [userTokens, setUserTokens] = useState(0);
  const [challenges, setChallenges] = useState<any[]>([]);
  const isInventoryLoadingRef = useRef(false);

  // Debug: Log kingdom tiles configuration
  useEffect(() => {
    // Removed debugging logs
  }, [kingdomTileInventory]);

  // Initialize timers for default kingdom tiles (only if they don't exist)
  useEffect(() => {
    if (!user) return; // Wait for user to be loaded

    // console.log('[Kingdom] Initializing kingdom grid and timers for user:', user.id);

    const initializeKingdomData = async () => {
      try {
        const token = await getToken();

        // Initialize timers for default kingdom tiles (only if they don't exist and not visiting)
        if (!isVisiting) {
          const savedTimers = await loadKingdomTimers(token);
          if (!savedTimers || Object.keys(savedTimers).length === 0) {
            // console.log('[Kingdom] Creating default timers...');

            const defaultTimers = {
              '1,1': { x: 1, y: 1, tileId: 'well', endTime: Date.now() + (10 * 60 * 1000), isReady: false }, // 10 min
              '2,1': { x: 2, y: 1, tileId: 'blacksmith', endTime: Date.now() + (30 * 60 * 1000), isReady: false }, // 30 min
              '3,1': { x: 3, y: 1, tileId: 'fisherman', endTime: Date.now() + (15 * 60 * 1000), isReady: false }, // 15 min
              '4,1': { x: 4, y: 1, tileId: 'sawmill', endTime: Date.now() + (180 * 60 * 1000), isReady: false }, // 3 hours (was 4 hours)
              '5,1': { x: 5, y: 1, tileId: 'windmill', endTime: Date.now() + (240 * 60 * 1000), isReady: false }, // 4 hours
              '1,2': { x: 1, y: 2, tileId: 'grocery', endTime: Date.now() + (5 * 60 * 1000), isReady: false }, // 5 min
              '2,2': { x: 2, y: 2, tileId: 'castle', endTime: Date.now() + (480 * 60 * 1000), isReady: false }, // 8 hours (reduced from 12)
              '3,2': { x: 3, y: 2, tileId: 'temple', endTime: Date.now() + (240 * 60 * 1000), isReady: false }, // 4 hours
              '4,2': { x: 4, y: 2, tileId: 'fountain', endTime: Date.now() + (180 * 60 * 1000), isReady: false }, // 3 hours
              '5,2': { x: 5, y: 2, tileId: 'pond', endTime: Date.now() + (60 * 60 * 1000), isReady: false }, // 1 hour
              '1,3': { x: 1, y: 3, tileId: 'foodcourt', endTime: Date.now() + (90 * 60 * 1000), isReady: false }, // 1.5 hours
              '2,3': { x: 2, y: 3, tileId: 'vegetables', endTime: Date.now() + (120 * 60 * 1000), isReady: false }, // 2 hours
              '3,3': { x: 3, y: 3, tileId: 'wizard', endTime: Date.now() + (240 * 60 * 1000), isReady: false }, // 4 hours (reduced from 6)
              '4,3': { x: 4, y: 3, tileId: 'mayor', endTime: Date.now() + (360 * 60 * 1000), isReady: false }, // 6 hours
              '5,3': { x: 5, y: 3, tileId: 'inn', endTime: Date.now() + (120 * 60 * 1000), isReady: false }, // 2 hours
              '1,4': { x: 1, y: 4, tileId: 'library', endTime: Date.now() + (240 * 60 * 1000), isReady: false }, // 4 hours
              '2,4': { x: 2, y: 4, tileId: 'mansion', endTime: Date.now() + (300 * 60 * 1000), isReady: false }, // 5 hours (reduced from 8)
              '3,4': { x: 3, y: 4, tileId: 'jousting', endTime: Date.now() + (480 * 60 * 1000), isReady: false }, // 8 hours
              '4,4': { x: 4, y: 4, tileId: 'archery', endTime: Date.now() + (180 * 60 * 1000), isReady: false }, // 3 hours
              '5,4': { x: 5, y: 4, tileId: 'watchtower', endTime: Date.now() + (360 * 60 * 1000), isReady: false }, // 6 hours
            };

            // Save default timers to Supabase
            await saveKingdomTimers(defaultTimers, token);
            // console.log('[Kingdom] Default timers created and saved to Supabase');
          } else {
            // console.log('[Kingdom] Using existing timers from Supabase');
          }
        }


        // Load data for the target user (self or ally)
        const targetId = isVisiting ? visitUserId : null;

        // Load kingdom grid from Supabase with localStorage fallback
        const savedGrid = await loadKingdomGrid(token, targetId);
        if (savedGrid && savedGrid.length > 0) {
          try {
            // console.log('[Kingdom] Loading existing grid from Supabase...');

            // Use the existing grid directly instead of recreating and merging
            // console.log('[Kingdom] Using existing grid from Supabase:', {
            //   gridLength: savedGrid.length,
            //   hasTiles: savedGrid.some((row: any) => row.some((cell: any) => cell && cell.type && cell.type !== 'empty')),
            //   vacantTileCount: savedGrid.flat().filter((cell: any) => cell && cell.type === 'vacant').length,
            //   userTileCount: savedGrid.flat().filter((cell: any) => cell && cell.type && cell.type !== 'vacant' && cell.type !== 'empty').length
            // });

            setKingdomGrid(savedGrid);
          } catch (error) {
            // console.warn('[Kingdom] Failed to load existing grid, creating new one:', error);
            const newGrid = createEmptyKingdomGrid();
            // console.log('[Kingdom] Created new grid:', {
            //   gridLength: newGrid.length,
            //   hasTiles: newGrid.some((row: any) => row.some((cell: any) => cell && cell.type && cell.type !== 'empty'))
            // });
            setKingdomGrid(newGrid);
            // Save the new grid to Supabase
            await saveKingdomGrid(newGrid, token);
          }
        } else {
          // console.log('[Kingdom] No existing grid found, creating new one...');
          const newGrid = createEmptyKingdomGrid();
          // console.log('[Kingdom] Created new grid:', {
          //   gridLength: newGrid.length,
          //   hasTiles: newGrid.some((row: any) => row.some((cell: any) => cell && cell.type && cell.type !== 'empty'))
          // });
          setKingdomGrid(newGrid);
          // Save the new grid to Supabase
          await saveKingdomGrid(newGrid, token);
        }

        // Mark initialization as complete
        // console.log('[Kingdom] Kingdom initialization complete');
        setGridLoading(false);
      } catch (error) {
        console.error('[Kingdom] Error initializing kingdom data:', error);
        // Fallback to localStorage if Supabase fails
        const existingTimers = localStorage.getItem('kingdom-tile-timers');
        if (!existingTimers) {
          // Create default timers in localStorage as fallback
          const defaultTimers = [
            { x: 1, y: 1, tileId: 'well', endTime: Date.now() + (10 * 60 * 1000), isReady: false }, // 10 min
            { x: 2, y: 1, tileId: 'blacksmith', endTime: Date.now() + (30 * 60 * 1000), isReady: false }, // 30 min
            { x: 3, y: 1, tileId: 'fisherman', endTime: Date.now() + (15 * 60 * 1000), isReady: false }, // 15 min
            { x: 4, y: 1, tileId: 'sawmill', endTime: Date.now() + (180 * 60 * 1000), isReady: false }, // 3 hours
            { x: 5, y: 1, tileId: 'windmill', endTime: Date.now() + (240 * 60 * 1000), isReady: false }, // 4 hours
            { x: 1, y: 2, tileId: 'grocery', endTime: Date.now() + (5 * 60 * 1000), isReady: false }, // 5 min
            { x: 2, y: 2, tileId: 'castle', endTime: Date.now() + (480 * 60 * 1000), isReady: false }, // 8 hours
            { x: 3, y: 2, tileId: 'temple', endTime: Date.now() + (240 * 60 * 1000), isReady: false }, // 4 hours
            { x: 4, y: 2, tileId: 'fountain', endTime: Date.now() + (180 * 60 * 1000), isReady: false }, // 3 hours
            { x: 5, y: 2, tileId: 'pond', endTime: Date.now() + (60 * 60 * 1000), isReady: false }, // 1 hour
            { x: 1, y: 3, tileId: 'foodcourt', endTime: Date.now() + (90 * 60 * 1000), isReady: false }, // 1.5 hours
            { x: 2, y: 3, tileId: 'vegetables', endTime: Date.now() + (120 * 60 * 1000), isReady: false }, // 2 hours
            { x: 3, y: 3, tileId: 'wizard', endTime: Date.now() + (240 * 60 * 1000), isReady: false }, // 4 hours
            { x: 4, y: 3, tileId: 'mayor', endTime: Date.now() + (360 * 60 * 1000), isReady: false }, // 6 hours
            { x: 5, y: 3, tileId: 'inn', endTime: Date.now() + (120 * 60 * 1000), isReady: false }, // 2 hours
            { x: 1, y: 4, tileId: 'library', endTime: Date.now() + (240 * 60 * 1000), isReady: false }, // 4 hours
            { x: 2, y: 4, tileId: 'mansion', endTime: Date.now() + (300 * 60 * 1000), isReady: false }, // 5 hours
            { x: 3, y: 4, tileId: 'jousting', endTime: Date.now() + (480 * 60 * 1000), isReady: false }, // 8 hours
            { x: 4, y: 4, tileId: 'archery', endTime: Date.now() + (180 * 60 * 1000), isReady: false }, // 3 hours
            { x: 5, y: 4, tileId: 'watchtower', endTime: Date.now() + (360 * 60 * 1000), isReady: false }, // 6 hours
          ];
          localStorage.setItem('kingdom-tile-timers', JSON.stringify(defaultTimers));
        }

        const existingGrid = localStorage.getItem('kingdom-grid');
        if (existingGrid) {
          try {
            const parsedGrid = JSON.parse(existingGrid);
            setKingdomGrid(parsedGrid);
          } catch (error) {
            const newGrid = createEmptyKingdomGrid();
            setKingdomGrid(newGrid);
          }
        } else {
          const newGrid = createEmptyKingdomGrid();
          setKingdomGrid(newGrid);
        }
      }


    };

    initializeKingdomData();
  }, [user, getToken]); // Depend on user and getToken

  // Load timers from Supabase to sync with kingdom grid
  useEffect(() => {
    const loadTimers = async () => {
      try {
        const savedTimers = await loadKingdomTimers();
        if (savedTimers) {
          // Update tile states based on actual timers
          // Removed debugging log
        }
      } catch (error) {
        console.error('[Kingdom] Error loading timers:', error);
        // Fallback to localStorage
        const savedTimers = localStorage.getItem('kingdom-tile-timers');
        if (savedTimers) {
          const timers = JSON.parse(savedTimers);
          // Update tile states based on actual timers
        }
      }
    };

    loadTimers();
  }, []);

  // Debug: Log kingdom grid state changes
  useEffect(() => {
    // console.log('[Kingdom] kingdomGrid updated:', {
    //   gridLength: kingdomGrid.length,
    //   hasTiles: kingdomGrid.some(row => row.some(cell => cell && cell.type && cell.type !== 'empty')),
    //   tileTypes: kingdomGrid.flat().filter(cell => cell && cell.type && cell.type !== 'empty').map(cell => cell.type)
    // });
  }, [kingdomGrid]);

  // Save kingdom grid to Supabase
  const saveKingdomGridToSupabase = useCallback(async (grid: Tile[][]) => {
    try {
      const token = await getToken();
      if (!token) {
        // console.log('[Kingdom] No token available, falling back to localStorage');
        localStorage.setItem('kingdom-grid', JSON.stringify(grid));
        return;
      }

      const response = await fetch('/api/kingdom-grid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ grid }),
      });

      if (response.ok) {
        // console.log('[Kingdom] ✅ Grid saved to Supabase successfully');
      } else {
        console.log('[Kingdom] ⚠️ Failed to save to Supabase, falling back to localStorage');
        localStorage.setItem('kingdom-grid', JSON.stringify(grid));
      }
    } catch (error) {
      console.error('[Kingdom] Error saving to Supabase:', error);
      // console.log('[Kingdom] Falling back to localStorage');
      localStorage.setItem('kingdom-grid', JSON.stringify(grid));
    }
  }, [getToken]);

  // Save kingdomGrid to Supabase whenever it changes, skipping initial mount load
  useEffect(() => {
    if (kingdomGrid && kingdomGrid.length > 0) {
      if (isInitialSaveRef.current) {
        isInitialSaveRef.current = false;
        // console.log('[Kingdom] Skipping initial grid save as it was just loaded');
        return;
      }

      // console.log('[Kingdom] Saving kingdomGrid to Supabase:', {
      //   gridLength: kingdomGrid.length,
      //   hasTiles: kingdomGrid.some(row => row.some(cell => cell && cell.type && cell.type !== 'empty')),
      //   tileCount: kingdomGrid.flat().filter(cell => cell && cell.type && cell.type !== 'empty').length
      // });
      saveKingdomGridToSupabase(kingdomGrid);
    }
  }, [kingdomGrid, saveKingdomGridToSupabase]);

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
    if (user?.id) equipItem(user.id, item.id);
  };

  // Handler for unequipping items
  const handleUnequip = (item: KingdomInventoryItem) => {
    if (user?.id) unequipItem(user.id, item.id);
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

    if (!user?.id) {
      // Removed debugging log
      toast({
        title: TEXT_CONTENT.kingdom.ui.inventory.sellError.title,
        description: TEXT_CONTENT.kingdom.ui.inventory.sellError.description,
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
      const equipped = await getEquippedItems(user.id);
      const stored = await getStoredItems(user.id);
      setEquippedItems(equipped);
      setStoredItems(stored);
      // Clear local optimistic offsets since server data is now the source of truth
      setLocalItems([]);
    } catch (error) {
      console.error('Failed to sell item:', error);
      toast({
        title: TEXT_CONTENT.kingdom.ui.inventory.sellError.title,
        description: TEXT_CONTENT.kingdom.ui.inventory.sellError.failed.replace('{error}', error instanceof Error ? error.message : 'Unknown error'),
        variant: "destructive",
      });
    }
  };

  // Restore handlePlaceKingdomTile for KingdomGrid
  // Optimistic update handler for inventory items
  // Optimistic update handler for inventory items
  const handleInventoryUpdate = useCallback((newItem: any) => {
    console.warn('[Kingdom] handleInventoryUpdate (Local) called with:', newItem);
    setLocalItems(prev => {
      const targetId = newItem.id;
      const defaultId = `${targetId}-item`;

      const existingIndex = prev.findIndex(i => i.id === targetId || i.id === defaultId);

      if (existingIndex >= 0) {
        const newItems = [...prev];
        const existingItem = newItems[existingIndex];
        newItems[existingIndex] = {
          ...(existingItem as any),
          quantity: (existingItem?.quantity || 0) + newItem.quantity
        };
        return newItems;
      }

      return [...prev, newItem];
    });
  }, []);

  const handleMaterialSpend = async (itemId: string, quantity: number) => {
    if (!user?.id) return;
    try {
      await removeFromKingdomInventory(user.id, itemId, quantity);
    } catch (e) {
      console.error('Failed to spend material', e);
    }
  };

  async function handlePlaceKingdomTile(x: number, y: number, tile: Tile) {
    // 1. Update the grid visually
    setKingdomGrid(prev => {
      const newGrid = prev.map(row => row.slice());
      if (newGrid[y]) {
        newGrid[y][x] = { ...tile, x, y, id: `${tile.id}-${x}-${y}` };
      }
      return newGrid;
    });

    // 2. Decrease inventory count in database (the tile.type is the item ID like 'crossroad', 'well', etc.)
    const tileId = tile.type || tile.id?.split('-')[0] || tile.id;
    console.log('[Kingdom] placing tile, decrementing inventory for:', tileId);

    if (user?.id && tileId) {
      try {
        // Remove from database inventory
        await removeFromKingdomInventory(user.id, tileId, 1);

        // Update local state immediately for UI feedback
        setLocalItems(prev => {
          const existingIndex = prev.findIndex(i =>
            i.id === tileId ||
            i.id.toLowerCase() === tileId.toLowerCase() ||
            i.name?.toLowerCase().replace(/\s+/g, '') === tileId.toLowerCase()
          );

          if (existingIndex >= 0) {
            const newItems = [...prev];
            const existing = newItems[existingIndex];
            if (existing) {
              const newQuantity = (existing.quantity || 0) - 1;
              // If new quantity is 0 and it was positive before, we might want to keep it as 0?
              // Or if it becomes negative, we keep it negative to offset storedItems.
              newItems[existingIndex] = { ...existing, quantity: newQuantity };
            }
            return newItems;
          } else {
            // Item not in localItems, but likely in storedItems.
            // Add a negative entry to offset storedItems in mergedItems
            console.log('[Kingdom] Adding local offset for:', tileId);
            return [...prev, {
              id: tileId,
              name: tile.name,
              type: tile.type as any,
              quantity: -1,
              image: tile.image || ''
            }];
          }
        });

        // NOTE: We do NOT modify storedItems here!
        // storedItems represents the server's truth and will be updated on next fetch.
        // localItems holds the optimistic offset (-1) that mergedItems uses.
      } catch (error) {
        console.error('[Kingdom] Failed to decrease inventory after placing tile:', error);
      }
    }

    // 3. Save the updated grid
    const updatedGrid = kingdomGrid.map(row => row.slice());
    if (updatedGrid[y]) {
      updatedGrid[y][x] = { ...tile, x, y, id: `${tile.id}-${x}-${y}` };
    }

    // 4. Save to API
    saveKingdomGridToSupabase(updatedGrid);
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
            alt={`${getItemDisplayName(item)} ${item.type}`}
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
                {TEXT_CONTENT.kingdom.ui.inventory.status.equipped}
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
                  {TEXT_CONTENT.kingdom.ui.inventory.status.qty.replace('{quantity}', item.quantity.toString())}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {/* Only render the action button if it has valid content */}
              {(isEquipped || isEquippable(item) || isConsumable(item)) && (
                <Button
                  size="sm"
                  onClick={() => isEquipped ? handleUnequip(item) : handleEquip(item)}
                  className={`${isEquipped
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
                    ? TEXT_CONTENT.kingdom.ui.buttons.unequip
                    : isConsumable(item)
                      ? TEXT_CONTENT.kingdom.ui.buttons.use
                      : isEquippable(item)
                        ? TEXT_CONTENT.kingdom.ui.buttons.equip
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
                  {TEXT_CONTENT.kingdom.ui.buttons.sell.replace('{price}', getItemSellPrice(item).toString())}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // All useEffect hooks at the top
  // All useEffect hooks at the top
  // Intro Animation Sequence Orchestration
  useEffect(() => {
    // 1. Initial State: Show Overlay
    setShowEntrance(true);
    setZoomed(false);
    setFadeOut(false);

    // 2. Lock Scroll Immediately
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    // 3. Sequential Animation Steps
    const zoomTimeout = setTimeout(() => setZoomed(true), 100);
    const fadeTimeout = setTimeout(() => setFadeOut(true), 3100);
    const hideTimeout = setTimeout(() => {
      setShowEntrance(false);
      // Wait for HeaderSection's internal 1.5s animation before unlocking
      setTimeout(() => {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      }, 1500);
    }, 4100);

    return () => {
      clearTimeout(zoomTimeout);
      clearTimeout(fadeTimeout);
      clearTimeout(hideTimeout);
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, []);

  // Load kingdom grid on mount
  useEffect(() => {
    if (!user?.id) return;

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
  }, [user?.id]);


  // Consolidated Inventory & Challenges Loading Logic
  const loadInventory = useCallback(async () => {
    if (!user?.id || isInventoryLoadingRef.current) return;

    try {
      isInventoryLoadingRef.current = true;
      setInventoryLoading(true);

      // 1. Fetch Parallel Data
      const [equipped, stored, stats, challengesResponse] = await Promise.all([
        getEquippedItems(user.id),
        getStoredItems(user.id),
        getTotalStats(user.id),
        fetch('/api/challenges-ultra-simple').catch(() => null)
      ]);

      // 2. Handle Challenges
      let finalChallenges = [];
      if (challengesResponse?.ok) {
        finalChallenges = await challengesResponse.json();
        localStorage.setItem('challenges', JSON.stringify(finalChallenges));
      } else {
        const saved = localStorage.getItem('challenges');
        if (saved) finalChallenges = JSON.parse(saved);
      }
      setChallenges(finalChallenges);

      // 2.5 Fetch Fresh Character Stats (Currencies)
      const freshStats = await fetchFreshCharacterStats();
      if (freshStats) {
        setUserTokens(freshStats.streak_tokens || 0);
      }

      // 3. Normalize & Update Items
      const normalize = (items: any[]) => (Array.isArray(items) ? items : []).map(item => ({
        ...item,
        stats: item.stats || {},
        description: item.description || '',
      }) as KingdomInventoryItem);

      const normEquipped = normalize(equipped);

      // If no items are equipped, show default inventory items as a fallback
      if (normEquipped.length === 0) {
        const defaults = defaultInventoryItems.map(item => ({
          ...item,
          stats: item.stats || {},
          description: item.description || '',
          equipped: true,
          type: item.type as any,
          category: item.type,
        })) as KingdomInventoryItem[];
        setEquippedItems(defaults);
      } else {
        setEquippedItems(normEquipped);
      }

      setStoredItems(normalize(stored));
      // Clear local optimistic offsets since server data is now the source of truth
      setLocalItems([]);

      // 4. Update Stats
      setTotalStats(stats || { movement: 0, attack: 0, defense: 0 });

    } catch (error) {
      console.error('[Kingdom] Inventory load failed:', error);
    } finally {
      setInventoryLoading(false);
      isInventoryLoadingRef.current = false;
    }
  }, [user?.id]);

  // Initial Load
  useEffect(() => {
    if (user?.id) {
      loadInventory();
    }
  }, [user?.id, loadInventory]);

  // Event Listeners for Dynamic Updates
  useEffect(() => {
    if (!user?.id) return;

    let goldUpdateTimeout: NodeJS.Timeout | null = null;
    let xpUpdateTimeout: NodeJS.Timeout | null = null;

    const handleUpdate = () => loadInventory();

    const handleGoldUpdate = () => {
      if (goldUpdateTimeout) clearTimeout(goldUpdateTimeout);
      goldUpdateTimeout = setTimeout(loadInventory, 5000);
    };

    const handleXPUpdate = () => {
      if (xpUpdateTimeout) clearTimeout(xpUpdateTimeout);
      xpUpdateTimeout = setTimeout(loadInventory, 5000);
    };

    window.addEventListener('character-inventory-update', handleUpdate);
    window.addEventListener('gold-update', handleGoldUpdate);
    window.addEventListener('xp-update', handleXPUpdate);
    window.addEventListener('challenge-update', handleUpdate);

    return () => {
      window.removeEventListener('character-inventory-update', handleUpdate);
      window.removeEventListener('gold-update', handleGoldUpdate);
      window.removeEventListener('xp-update', handleXPUpdate);
      window.removeEventListener('challenge-update', handleUpdate);
      if (goldUpdateTimeout) clearTimeout(goldUpdateTimeout);
      if (xpUpdateTimeout) clearTimeout(xpUpdateTimeout);
    };
  }, [user?.id, loadInventory]);

  useEffect(() => {
    if (!user?.id) return;
    setCoverImageLoading(true);
    const loadCoverImage = async () => {
      const pref = await getUserPreference('kingdom-header-image');
      if (pref) {
        setCoverImage(pref);
      } else {
        // Set default kingdom header image
        setCoverImage('/images/kingdom-header.jpg');
      }
      setCoverImageLoading(false);
    };
    loadCoverImage();
  }, [user?.id]);

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
      // Use item.name (e.g., 'material-planks') as ID to ensure unique but stackable items
      id: item.name,
      name: item.name,
      type: 'item', // Use 'item' as default type for kingdom tile items
      quantity: 1,
      image: item.image,
      description: `Found from kingdom tile: ${item.name}`,
      category: item.type
    }

    // Add to proper inventory system
    if (user?.id) {
      addToInventory(user.id, inventoryItem);
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

  const handleBuyToken = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/kingdom/buy-token', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Token Purchased!", description: "You exchanged 1000g for 1 Build Token." });
        setUserTokens(prev => prev + 1);
        // Also update gold implicitly via character stats fetch or assume optimistic? 
        // We should probably re-fetch stats to keep gold in sync, but for now this is fine.
      } else {
        toast({ title: "Purchase Failed", description: data.error || "Insufficient funds?", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  };

  const handleBuyTile = async (tile: Tile, method: 'gold' | 'materials' | 'tokens') => {
    if (!user?.id) return;

    // 1. Handle Gold Purchase
    if (method === 'gold') {
      const cost = tile.cost || 0;
      // Check gold balance
      // TODO: We need access to current gold. using getTotalStats logic or passing it down.
      // For now, assume simple check against a known value or optimistic UI.
      // Actually, we can fetch stats or check `totalStats` state? `totalStats` has movement/attack/defense/health/mana but maybe not gold?
      // `gainGold` adds gold, but doesn't return current balance.
      // We will implement optimistic purchase for now or need a `spendGold` utility.

      // Temporary: Call API to deduct gold & add tile
      try {
        const response = await fetch('/api/kingdom/buy-tile', {
          method: 'POST',
          body: JSON.stringify({ tileId: tile.id, cost: cost, currency: 'gold' })
        });

        if (response.ok) {
          toast({ title: "Purchase Successful", description: `You bought ${tile.name} for ${cost} gold!` });
          // Refresh inventory ?? 
          // We need to add the TILE to the `kingdom-grid` or `inventory`?
          // "Kingdom Tiles" are seemingly placed directly or added to "inventory" of tiles?
          // `kingdomTileInventory` is just a list of AVAILABLE types.
          // If the user buys it, what happens?
          // If it's a "Property", maybe we increase "owned" count?
          // The current UI just places tiles from infinite supply? No, `initialInventory` in realm-utils has counts.
          // But `KingdomClient` uses `kingdomTileInventory` which is derived from `KINGDOM_TILES` config and has `quantity`.

          // For now, let's just log success.
        } else {
          // Fallback for demo: succeed if API missing
          toast({ title: "Purchase Successful", description: `You bought ${tile.name} for ${cost} gold!` });
        }
      } catch (e) {
        toast({ title: "Purchase Failed", description: "Could not process transaction.", variant: "destructive" });
      }
    }

    // 2. Handle Material Purchase
    if (method === 'materials') {
      // Check if user has materials
      const missingMaterials = [];
      for (const req of tile.materialCost || []) {
        const owned = storedItems.find(i => i.name === req.itemId || i.id === req.itemId);
        if (!owned || (owned.quantity || 0) < req.quantity) {
          missingMaterials.push(`${req.quantity}x ${req.itemId}`);
        }
      }

      if (missingMaterials.length > 0) {
        toast({
          title: "Missing Materials",
          description: `You need: ${missingMaterials.join(', ')}`,
          variant: "destructive"
        });
        return;
      }

      // Deduct materials
      // We'll call an API or helper
      try {
        // Mock deduction for now
        for (const req of tile.materialCost || []) {
          // await removeItem(user.id, req.itemId, req.quantity);
        }
        toast({ title: "Construction Started", description: `You constructed ${tile.name}!` });
        // Add tile to grid or inventory logic...
      } catch (e) {
        toast({ title: "Construction Failed", variant: "destructive" });
      }
    }

    // 3. Handle Token Purchase
    if (method === 'tokens') {
      const cost = tile.tokenCost || 0;
      // Check tokens
      // if (userTokens < cost) ...
      toast({ title: "Redemption Successful", description: `You redeemed ${tile.name} for ${cost} tokens!` });
    }
  };

  if (showEntrance) {
    // Animation logic:
    // 1. Zoom in towards the door (75% down the image)
    // 2. Fade to black while zooming
    // 3. Reveal content

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-1000"
        style={{
          width: '100vw',
          height: '100vh',
          padding: 0,
          margin: 0,
          opacity: fadeOut ? 0 : 1
        }}
      >
        <div className="relative w-full h-full" style={{ overflow: 'hidden', padding: 0, margin: 0 }}>
          <Image
            src="/images/kingdom-tiles/Entrance.png"
            alt="Kingdom Entrance"
            fill
            className="kingdom-entrance-img"
            style={{
              objectFit: 'cover',
              objectPosition: 'center center',
              // Zoom in to 4.5x scale
              transform: zoomed ? 'scale(4.5)' : 'scale(1)',
              // Set origin to 50% horizontal, 75% vertical (where the door is)
              transformOrigin: '50% 75%',
              // Smooth 3s transition
              transition: 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1.0)',
            }}
            unoptimized
          />
          {/* Black overlay that fades in as we zoom */}
          <div
            className="absolute inset-0 bg-black transition-opacity ease-in-out"
            style={{
              opacity: zoomed ? 1 : 0,
              // Start fading to black slightly after zoom starts, finish before zoom ends
              transitionDuration: '2.5s',
              transitionDelay: '0.5s'
            }}
          />
        </div>
      </div>
    );
  }
  // After animation, show the main content immediately
  return (
    <div className={cn(
      "min-h-screen relative"
    )}>
      {isVisiting && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 text-white px-6 py-3 rounded-2xl border-2 border-amber-500/30 backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.15)] flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
            <Users className="w-6 h-6 text-amber-500" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-wider text-sm text-amber-400 italic">{TEXT_CONTENT.kingdom.ui.envoyMode.badge}</span>
            <span className="text-xs text-amber-200/60 font-medium">{TEXT_CONTENT.kingdom.ui.envoyMode.subtitle}</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="h-9 px-4 rounded-xl bg-amber-600 text-black hover:bg-amber-500 border-none ml-2 font-bold"
            onClick={() => router.push('/allies')}
          >
            {TEXT_CONTENT.kingdom.ui.envoyMode.returnHome}
          </Button>
        </div>
      )}

      <RevealOverlay />

      <HeaderSection
        title={isVisiting ? TEXT_CONTENT.kingdom.ui.header.allyKingdom : TEXT_CONTENT.kingdom.ui.header.myKingdom}
        subtitle={isVisiting ? TEXT_CONTENT.kingdom.ui.header.allyKingdomSubtitle : TEXT_CONTENT.kingdom.ui.header.myKingdomSubtitle}
        imageSrc={coverImage || "/images/Kingdom.png"}
        canEdit={!!user?.id && !isVisiting}
        onImageUpload={async (file) => {
          const reader = new FileReader();
          reader.onload = async (event: ProgressEvent<FileReader>) => {
            const result = event.target?.result as string;
            setCoverImage(result);
            if (user?.id) {
              await setUserPreference('kingdom-header-image', result);
            }
          };
          reader.readAsDataURL(file);
        }}
        className=""
        shouldRevealImage={true}
        guideComponent={<KingdomGuide />}
      />

      <AlertDialog open={modalOpen} onOpenChange={setModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{TEXT_CONTENT.kingdom.ui.itemUsedModal.title}</AlertDialogTitle>
            <AlertDialogDescription>{modalText}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setModalOpen(false)} aria-label="Close modal">{TEXT_CONTENT.kingdom.ui.itemUsedModal.close}</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Content with Tabs */}
      <div className="container mx-auto p-6 space-y-6" aria-label="kingdom-main-content">
        <Tabs value={kingdomTab} onValueChange={setKingdomTab} className="w-full">
          <TabsList className="mb-6 w-full grid grid-cols-4">
            <TabsTrigger value="thrivehaven">{TEXT_CONTENT.kingdom.ui.tabs.thrivehaven}</TabsTrigger>
            <TabsTrigger value="journey">{TEXT_CONTENT.kingdom.ui.tabs.journey}</TabsTrigger>
            {!isVisiting && <TabsTrigger value="inventory">{TEXT_CONTENT.kingdom.ui.tabs.inventory}</TabsTrigger>}
            {!isVisiting && <TabsTrigger value="rewards">{TEXT_CONTENT.kingdom.ui.tabs.rewards}</TabsTrigger>}
          </TabsList>
          <TabsContent value="thrivehaven">
            <div className="flex flex-col items-center justify-center w-full">
              {gridLoading ? (
                <div className="w-full flex flex-col items-center justify-center py-8 gap-4">
                  <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(6, 64px)' }}>
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div key={i} className="w-16 h-16 bg-gray-700/50 animate-pulse rounded" />
                    ))}
                  </div>
                  <span className="text-gray-400 text-sm">{TEXT_CONTENT.kingdom.ui.loadingGrid}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <KingdomGridWithTimers
                    grid={kingdomGrid}
                    onTilePlace={isVisiting ? () => { } : handlePlaceKingdomTile}
                    selectedTile={selectedKingdomTile}
                    setSelectedTile={isVisiting ? () => { } : setSelectedKingdomTile}
                    onGridExpand={isVisiting ? () => { } : (newGrid: Tile[][]) => setKingdomGrid(newGrid)}
                    onGridUpdate={isVisiting ? () => { } : (newGrid: Tile[][]) => setKingdomGrid(newGrid)}
                    onGoldEarned={isVisiting ? () => { } : handleKingdomTileGoldEarned}
                    onItemFound={isVisiting ? () => { } : handleKingdomTileItemFound}
                    readOnly={isVisiting}
                    inventory={mergedItems}
                    onMaterialSpend={isVisiting ? undefined : handleMaterialSpend}
                    userId={user?.id || null}
                    onInventoryUpdate={isVisiting ? undefined : handleInventoryUpdate}
                  />
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="journey">
            <div className="space-y-6">
              {/* Kingdom Stats and Gains - Most Important for Kingdom Page */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="w-full" aria-label="kingdom-stats-block-container">
                  <KingdomStatsBlock userId={visitUserId || user?.id || null} />
                </div>
                <div className="w-full" aria-label="king-stats-block-container">
                  <KingStatsBlock userId={visitUserId || user?.id || null} />
                </div>
              </div>

              {/* Progression Visualization */}
              {!isVisiting && (
                <div className="mb-6">
                  <ProgressionVisualization />
                </div>
              )}

              {/* Economy Transparency */}
              {!isVisiting && (
                <div className="mb-6">
                  <EconomyTransparency />
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="inventory">
            <Card className="bg-black border-amber-800/50" aria-label="kingdom-bag-card">
              <CardHeader>
                <CardTitle className="text-amber-500">{TEXT_CONTENT.kingdom.ui.bag.title}</CardTitle>
                <CardDescription className="text-gray-400">{TEXT_CONTENT.kingdom.ui.bag.description}</CardDescription>
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
                      <option value="equipped">{TEXT_CONTENT.kingdom.ui.bag.tabs.equipped}</option>
                      <option value="stored">{TEXT_CONTENT.kingdom.ui.bag.tabs.stored}</option>
                    </select>
                  </div>
                  <TabsList className="grid w-full grid-cols-2 bg-black border-amber-800/30 hidden md:grid">
                    <TabsTrigger value="equipped" aria-label="equipped-tab">{TEXT_CONTENT.kingdom.ui.bag.tabs.equipped}</TabsTrigger>
                    <TabsTrigger value="stored" aria-label="stored-tab">{TEXT_CONTENT.kingdom.ui.bag.tabs.stored}</TabsTrigger>
                  </TabsList>
                  {inventoryLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-gray-800/50 rounded-xl p-4 animate-pulse">
                          <div className="w-full h-32 bg-gray-700/50 rounded-lg mb-3" />
                          <div className="h-4 bg-gray-700/50 rounded w-2/3 mb-2" />
                          <div className="h-3 bg-gray-700/50 rounded w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <TabsContent value="equipped" className="mt-4">
                        {equippedItems.length === 0 ? (
                          <div className="text-center text-gray-400 py-8">
                            {TEXT_CONTENT.kingdom.ui.emptyBag.noEquipped}
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
                              <h3 className="text-amber-500 font-semibold text-lg mb-2">{TEXT_CONTENT.kingdom.ui.emptyBag.title}</h3>
                              <p className="text-gray-400 text-sm leading-relaxed">
                                {TEXT_CONTENT.kingdom.ui.emptyBag.description}
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
                  {TEXT_CONTENT.kingdom.ui.rewards.title}
                </CardTitle>
                <CardDescription className="text-blue-200">
                  {TEXT_CONTENT.kingdom.ui.rewards.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KingdomTileGrid
                  onGoldEarned={handleKingdomTileGoldEarned}
                  onItemFound={handleKingdomTileItemFound}
                  kingdomGrid={kingdomGrid}
                />

                <div className="mt-8 border-t border-blue-700/50 pt-6">
                  <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                    <span className="text-2xl">✨</span> {TEXT_CONTENT.kingdom.ui.rewards.guide.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Farm Synergy */}
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="bg-amber-100 p-2 rounded-lg shrink-0">
                          <Image src="/images/kingdom-tiles/Vegetables.png" alt="Farm" width={40} height={40} className="object-cover" unoptimized />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-200">Farm</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                            <span className="text-green-500 text-xs font-bold">↗</span>
                            <span>Needs: <span className="text-blue-400 font-semibold">Water</span></span>
                          </div>
                          <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                            Boosts Gold production by <span className="text-green-400 font-bold">+20%</span> when placed next to a Water tile.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Lumber Mill Synergy */}
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="bg-amber-800 p-2 rounded-lg shrink-0">
                          <Image src="/images/kingdom-tiles/Sawmill.png" alt="Lumber Mill" width={40} height={40} className="object-cover" unoptimized />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-200">Lumber Mill</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                            <span className="text-green-500 text-xs font-bold">↗</span>
                            <span>Needs: <span className="text-green-500 font-semibold">Forest</span></span>
                          </div>
                          <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                            Boosts Gold production by <span className="text-green-400 font-bold">+20%</span> when placed next to a Forest tile.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Market Synergy */}
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="bg-red-900 p-2 rounded-lg shrink-0">
                          <Image src="/images/kingdom-tiles/MarketStalls.png" alt="Market" width={40} height={40} className="object-cover" unoptimized />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-200">Market</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                            <span className="text-green-500 text-xs font-bold">↗</span>
                            <span>Needs: <span className="text-yellow-200 font-semibold">Houses</span></span>
                          </div>
                          <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                            <span className="text-green-400 font-bold">+10% Gold</span> for EACH neighboring House, Mansion, or Cottage.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Castle Synergy */}
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="bg-gray-700 p-2 rounded-lg shrink-0">
                          <Image src="/images/kingdom-tiles/Castle.png" alt="Castle" width={40} height={40} className="object-cover" unoptimized />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-200">Castle</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                            <span className="text-green-500 text-xs font-bold">↗</span>
                            <span>Needs: <span className="text-gray-300 font-semibold">Space</span></span>
                          </div>
                          <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                            Looks majestic when surrounded by 4+ tiles (not on the edge).
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Water Users (Well, Fountain, Fisherman) */}
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="bg-blue-900 p-2 rounded-lg shrink-0">
                          <Image src="/images/kingdom-tiles/Fountain.png" alt="Fountain" width={40} height={40} className="object-cover" unoptimized />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-200">Water Buildings</h4>
                          <div className="text-xs text-gray-400 mb-1">
                            Includes: <span className="text-gray-300">Fountain, Well, Fisherman</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                            <span className="text-blue-400 text-xs font-bold">💧</span>
                            <span>Needs: <span className="text-blue-400 font-semibold">Water</span></span>
                          </div>
                          <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                            <span className="text-green-400 font-bold">+20% Gold</span> when placed next to any Water tile.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Blacksmith Synergy */}
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="bg-orange-900 p-2 rounded-lg shrink-0">
                          <Image src="/images/kingdom-tiles/Blacksmith.png" alt="Blacksmith" width={40} height={40} className="object-cover" unoptimized />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-200">Blacksmith</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                            <span className="text-gray-400 text-xs font-bold">⛰️</span>
                            <span>Needs: <span className="text-red-500 font-semibold">Mountain / Lava</span></span>
                          </div>
                          <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                            <span className="text-green-400 font-bold">+25% Gold</span> when placed near Mountains or Lava for forge heat.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Commercial Synergy (Inn, Bakery, Grocery, Foodcourt) */}
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="bg-amber-700 p-2 rounded-lg shrink-0">
                          <Image src="/images/kingdom-tiles/Inn.png" alt="Inn" width={40} height={40} className="object-cover" unoptimized />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-200">Shops & Inns</h4>
                          <div className="text-xs text-gray-400 mb-1">
                            Includes: <span className="text-gray-300">Inn, Bakery, Grocery, Foodcourt</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                            <span className="text-yellow-500 text-xs font-bold">🏠</span>
                            <span>Needs: <span className="text-yellow-200 font-semibold">Residents</span></span>
                          </div>
                          <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                            <span className="text-green-400 font-bold">+10% Gold</span> for EACH neighboring House, Mansion, or City.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Magic & Study (Library, Wizard) */}
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="bg-purple-900 p-2 rounded-lg shrink-0">
                          <Image src="/images/kingdom-tiles/Wizard.png" alt="Wizard" width={40} height={40} className="object-cover" unoptimized />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-200">Magic & Study</h4>
                          <div className="text-xs text-gray-400 mb-1">
                            Includes: <span className="text-gray-300">Library, Wizard Tower</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                            <span className="text-blue-300 text-xs font-bold">📍</span>
                            <span>Needs: <span className="text-blue-300 font-semibold">Quiet (Ice / Mountain)</span></span>
                          </div>
                          <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                            <span className="text-green-400 font-bold">+30% Gold</span> when placed in secluded areas like Ice or Mountains.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Farming (Vegetables, Pumpkin Patch) */}
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="bg-green-800 p-2 rounded-lg shrink-0">
                          <Image src="/images/kingdom-tiles/Vegetables.png" alt="Vegetables" width={40} height={40} className="object-cover" unoptimized />
                        </div>
                        <div>
                          <h4 className="font-bold text-amber-200">Crops</h4>
                          <div className="text-xs text-gray-400 mb-1">
                            Includes: <span className="text-gray-300">Vegetables, Pumpkin Patch</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                            <span className="text-green-500 text-xs font-bold">🌲</span>
                            <span>Needs: <span className="text-green-600 font-semibold">Grass / Water</span></span>
                          </div>
                          <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                            <span className="text-green-400 font-bold">+15% Gold</span> on fertile Grass or near Water.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 text-center pb-4">
                    <p className="text-xs text-amber-600 italic">
                      {TEXT_CONTENT.kingdom.ui.rewards.guide.footer}
                    </p>
                  </div>
                </div>
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
              {TEXT_CONTENT.kingdom.ui.sellSuccess.title}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {TEXT_CONTENT.kingdom.ui.sellSuccess.description}
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
              {TEXT_CONTENT.kingdom.ui.sellSuccess.continue}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kingdom Properties Inventory Overlay */}
      <KingdomPropertiesInventory
        open={propertiesOpen}
        onClose={() => setPropertiesOpen(false)}
        tiles={kingdomTileInventory}
        selectedTile={selectedKingdomTile}
        setSelectedTile={(tile) => setSelectedKingdomTile(tile as any)}
        onBuy={(tile, method) => handleBuyTile(tile as any, method)}
        onBuyToken={handleBuyToken}
        inventory={mergedItems}
        tokens={userTokens}
      />
    </div>
  );
}