"use client"

import { logger } from "@/lib/logger";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { useUser, useAuth } from "@clerk/nextjs";
import KingdomLoading from "./loading"

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
import { EmptyState } from "@/components/ui/empty-state"
import { Backpack, Sword, LayoutGrid, Compass, Gift, BookOpen, Flame, Skull, Trophy } from "lucide-react";
import type { InventoryItem as DefaultInventoryItem } from "@/app/lib/default-inventory"
import type { InventoryItem as ManagerInventoryItem } from "@/lib/inventory-manager"
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Tile, TileType, ConnectionDirection } from '@/types/core-interfaces';
import { gainGold } from '@/lib/gold-manager';
import { gainExperience } from '@/lib/experience-manager';
import { updateCharacterStats, getCharacterStats, fetchFreshCharacterStats } from '@/lib/character-stats-service';
import { MedievalErrorBoundary } from '@/components/medieval-error-boundary';
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
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { supabase, withToken } from '@/lib/supabase/client'

const KingdomStatsBlock = dynamic(() => import("@/components/kingdom-stats-graph").then(m => m.KingdomStatsBlock), { ssr: false });
const KingStatsBlock = dynamic(() => import("@/components/kingdom-stats-graph").then(m => m.KingStatsBlock), { ssr: false });
const KingdomGridWithTimers = dynamic(() => import("@/components/kingdom-grid-with-timers").then(m => m.KingdomGridWithTimers), { 
  ssr: false,
  loading: () => <div className="w-full flex flex-col items-center justify-center py-8 gap-4 animate-pulse">
    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(6, 64px)' }}>
      {Array.from({ length: 36 }).map((_, i) => (
        <div key={i} className="w-16 h-16 bg-zinc-700/50 rounded" />
      ))}
    </div>
  </div>
});
const KingdomPropertiesInventory = dynamic(() => import("@/components/kingdom-properties-inventory").then(m => m.KingdomPropertiesInventory), { ssr: false });
const KingdomTileGrid = dynamic(() => import("@/components/kingdom-tile-grid").then(m => m.KingdomTileGrid), { ssr: false });
const KingdomGuide = dynamic(() => import("@/components/kingdom/kingdom-guide").then(m => m.KingdomGuide), { ssr: false });
import { KingdomBonusesBlock } from "@/components/kingdom/kingdom-bonuses-block";
import { comprehensiveItems } from "@/app/lib/comprehensive-items";


const ProgressionVisualization = dynamic(
  () => import('@/components/progression-visualization').then(m => ({ default: m.ProgressionVisualization })),
  { loading: () => <div className="animate-pulse h-40 bg-zinc-900 rounded-xl border border-zinc-800" />, ssr: false }
);
const EconomyTransparency = dynamic(
  () => import('@/components/economy-transparency').then(m => ({ default: m.EconomyTransparency })),
  { loading: () => <div className="animate-pulse h-40 bg-zinc-900 rounded-xl border border-zinc-800" />, ssr: false }
);
import { Users, Crown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEXT_CONTENT } from "@/lib/text-content";

type KingdomInventoryItem = (DefaultInventoryItem | ManagerInventoryItem) & {
  stats?: Record<string, number | undefined> | undefined,
  description?: string | undefined,
  category?: string | undefined,
  star_rating?: number | undefined
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

const getConsumableEffect = async (item: KingdomInventoryItem) => {
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
  if ((item.type === 'item' || item.type === 'potion') && item.name) {
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

      try {
        const { fetchWithAuth } = await import('@/lib/fetchWithAuth');
        await fetchWithAuth('/api/active-modifiers', {
          method: 'POST',
          body: JSON.stringify({
            name: perk.name,
            effect: perk.effect,
            durationHours: 24,
            source: 'potion'
          })
        });
        // Dispatch event to update UI immediately
        window.dispatchEvent(new Event('character-inventory-update'));

        // Also keep localStorage as a temporary fallback/cache
        const now = new Date()
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        const activePerks = JSON.parse(localStorage.getItem('active-potion-perks') || '{}')
        activePerks[perk.name] = { effect: perk.effect, expiresAt: expiresAt.toISOString() }
        localStorage.setItem('active-potion-perks', JSON.stringify(activePerks))

      } catch (e) {
        logger.error("Error saving potion perk:", e);
      }

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
  logger.debug('[Kingdom] createEmptyKingdomGrid called');

  const KINGDOM_GRID_ROWS = 12; // Doubled from 6 to 12 rows
  const KINGDOM_GRID_COLS = 6;
  const VACANT_TILE_IMAGE = '/images/kingdom-tiles/Vacant.webp';

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

  logger.debug('[Kingdom] Base grid created with dimensions:', { rows: KINGDOM_GRID_ROWS, cols: KINGDOM_GRID_COLS });

  // Add some default kingdom tiles to make the grid interesting
  const defaultKingdomTiles = [
    { x: 1, y: 1, type: 'well' as TileType },
    { x: 2, y: 1, type: 'blacksmith' as TileType },
    { x: 3, y: 1, type: 'fisherman' as TileType },
    { x: 4, y: 1, type: 'sawmill' as TileType },
    { x: 5, y: 1, type: 'windmill' as TileType },
    { x: 1, y: 2, type: 'market' as TileType }, // Market Hub
    { x: 2, y: 2, type: 'castle' as TileType }, // Realm Hub (Central)
    { x: 3, y: 2, type: 'quest-board' as TileType }, // Quest Hub
    { x: 4, y: 2, type: 'monument' as TileType }, // Achievements Hub (Hall of Fame)
    { x: 5, y: 2, type: 'pond' as TileType },
    { x: 1, y: 3, type: 'foodcourt' as TileType },
    { x: 2, y: 3, type: 'vegetables' as TileType },
    { x: 3, y: 3, type: 'crystal_cavern' as TileType }, // Dungeon Hub
    { x: 4, y: 3, type: 'mayor' as TileType },
    { x: 5, y: 3, type: 'tavern' as TileType }, // Social Hub
    { x: 1, y: 4, type: 'library' as TileType },
    { x: 2, y: 4, type: 'mansion' as TileType },
    { x: 3, y: 4, type: 'training-grounds' as TileType }, // Character Hub
    { x: 4, y: 4, type: 'archery' as TileType },
    { x: 5, y: 4, type: 'watchtower' as TileType },
  ];

  logger.debug('[Kingdom] Adding default kingdom tiles:', defaultKingdomTiles.length);

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
          image: kingdomTile.image || '/images/kingdom-tiles/default.webp',
        };
        logger.debug(`[Kingdom] Added ${type} tile at position (${x}, ${y})`);
      } catch (error) {
        logger.error(`[Kingdom] Error creating tile ${type} at position (${x}, ${y}):`, error);
      }
    } else {
      logger.warn(`[Kingdom] Failed to add ${type} tile at position (${x}, ${y}) - kingdomTile:`, kingdomTile, 'grid[y]:', grid[y], 'grid[y][x]:', grid[y]?.[x]);
    }
  });

  const finalTileCount = grid.flat().filter(cell => cell && cell.type && cell.type !== 'empty').length;
  logger.debug('[Kingdom] Final grid created with', finalTileCount, 'non-empty tiles');

  return grid;
}

// Helper to get the kingdom tile inventory with build tokens
function getKingdomTileInventoryWithBuildTokens(): Tile[] {
  const KINGDOM_TILE_IMAGES = [
    'Crossroad.png', 'Straightroad.png', 'Cornerroad.png', 'Tsplitroad.png', 'Archery.png', 'Blacksmith.png', 'Castle.png', 'Fisherman.png', 'Foodcourt.png', 'Fountain.png', 'Grocery.png', 'House.png', 'Inn.png', 'Jousting.png', 'Mansion.png', 'Mayor.png', 'Pond.png', 'Sawmill.png', 'Temple.png', 'Vegetables.png', 'Watchtower.png', 'Well.png', 'Windmill.png', 'Wizard.png', 'ZenGarden.png'
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
        kingdomTileConfig = { id: 'crossroad', name: 'Crossroad', clickMessage: 'A Crossroad tile', image: '/images/kingdom-tiles/Crossroad.webp' } as any;
      } else if (tileName === 'Straightroad') {
        kingdomTileConfig = { id: 'straightroad', name: 'Straight Road', clickMessage: 'A Straight Road tile', image: '/images/kingdom-tiles/Straightroad.webp' } as any;
      } else if (tileName === 'Cornerroad') {
        kingdomTileConfig = { id: 'cornerroad', name: 'Corner Road', clickMessage: 'A Corner Road tile', image: '/images/kingdom-tiles/Cornerroad.webp' } as any;
      } else if (tileName === 'Tsplitroad') {
        kingdomTileConfig = { id: 'tsplitroad', name: 'T-Split Road', clickMessage: 'A T-Split Road tile', image: '/images/kingdom-tiles/Tsplitroad.webp' } as any;
      }
    }

    return {
      id: kingdomTileConfig ? kingdomTileConfig.id : `kingdom-tile-${idx}`,
      type: kingdomTileConfig ? (kingdomTileConfig.id as TileType) : 'special',
      name: tileName,
      description: kingdomTileConfig ? kingdomTileConfig.clickMessage : `${TEXT_CONTENT.kingdomTiles.specialPrefix}${tileName}`,
      connections: [] as ConnectionDirection[],
      rotation: 0 as 0 | 90 | 180 | 270,
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
  const { user, isLoaded } = useUser();

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
  const [showEntrance, setShowEntrance] = useState(false);

  const [zoomed, setZoomed] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const isInitialSaveRef = useRef(true);
  const isOptimisticSaveRef = useRef(false);

  const [kingdomContent, setKingdomContent] = useState<JSX.Element | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [coverImageLoading, setCoverImageLoading] = useState(true);
  const [gridLoading, setGridLoading] = useState(true);
  const [soldItem, setSoldItem] = useState<{ name: string; gold: number } | null>(null);
  const [sellingModalOpen, setSellingModalOpen] = useState(false);


  const [userTokens, setUserTokens] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [journeyStats, setJourneyStats] = useState<{
    dungeonRuns: any[];
    dungeonWins: number;
    journalCount: number;
    meditationCount: number;
    streakTokens: number;
  }>({ dungeonRuns: [], dungeonWins: 0, journalCount: 0, meditationCount: 0, streakTokens: 0 });

  useEffect(() => {
    if (activeTab === 'journey' || kingdomTab === 'journey') {
      fetch('/api/kingdom/journey-stats')
        .then(res => res.json())
        .then(data => setJourneyStats(data))
        .catch(err => logger.error('Failed to load journey stats', err));
    }
  }, [activeTab, kingdomTab]);

  const isInventoryLoadingRef = useRef(false);

  // Debug: Log kingdom tiles configuration
  useEffect(() => {
    // Removed debugging logs
  }, [kingdomTileInventory]);

  // Initialize timers for default kingdom tiles (only if they don't exist)
  useEffect(() => {
    if (!user) return; // Wait for user to be loaded

    // logger.debug('[Kingdom] Initializing kingdom grid and timers for user:', user.id);

    const initializeKingdomData = async () => {
      try {
        const token = await getToken();

        // Initialize timers for default kingdom tiles (only if they don't exist and not visiting)
        if (!isVisiting) {
          const savedTimers = await loadKingdomTimers(token);
          if (!savedTimers || Object.keys(savedTimers).length === 0) {
            // logger.debug('[Kingdom] Creating default timers...');

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
            // logger.debug('[Kingdom] Default timers created and saved to Supabase');
          } else {
            // logger.debug('[Kingdom] Using existing timers from Supabase');
          }
        }


        // Load data for the target user (self or ally)
        const targetId = isVisiting ? visitUserId : null;

        // Load kingdom grid from Supabase with localStorage fallback
        const savedGrid = await loadKingdomGrid(token, targetId);
        if (savedGrid && savedGrid.length > 0) {
          try {
            // Sanitize grid: ensure unique IDs for tiles that should be unique
            const idSet = new Set<string>();
            const sanitized = savedGrid.map((row: Tile[]) => row.map((tile: Tile) => {
              if (!tile || tile.type === 'vacant' || tile.type === 'empty') return tile;
              if (idSet.has(tile.id)) {
                logger.warn(`[Kingdom] Found duplicate tile ID in Supabase: ${tile.id}. Converting to vacant.`);
                return {
                  ...tile,
                  type: 'vacant',
                  name: 'Vacant Plot',
                  image: '/images/kingdom-tiles/Vacant.webp',
                  id: `vacant-${tile.x}-${tile.y}`,
                  description: 'A vacant plot ready for building.'
                } as Tile;
              }
              if (tile.id) idSet.add(tile.id);
              return tile;
            }));
            setKingdomGrid(sanitized);
          } catch (error) {
            logger.warn('[Kingdom] Failed to load/sanitize existing grid, creating new one:', error);
            const newGrid = createEmptyKingdomGrid();
            setKingdomGrid(newGrid);
            await saveKingdomGrid(newGrid, token);
          }
        } else {
          // logger.debug('[Kingdom] No existing grid found, creating new one...');
          const newGrid = createEmptyKingdomGrid();
          setKingdomGrid(newGrid);
          // Save the new grid to Supabase
          await saveKingdomGrid(newGrid, token);
        }

        // Mark initialization as complete
        // logger.debug('[Kingdom] Kingdom initialization complete');
        setGridLoading(false);
      } catch (error) {
        logger.error('[Kingdom] Error initializing kingdom data:', error);
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
        logger.error('[Kingdom] Error loading timers:', error);
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
    // logger.debug('[Kingdom] kingdomGrid updated:', {
    //   gridLength: kingdomGrid.length,
    //   hasTiles: kingdomGrid.some(row => row.some(cell => cell && cell.type && cell.type !== 'empty')),
    //   tileTypes: kingdomGrid.flat().filter(cell => cell && cell.type && cell.type !== 'empty').map(cell => cell.type)
    // });
  }, [kingdomGrid]);

  // Save kingdom grid to Supabase
  const saveKingdomGridToSupabase = useCallback(async (grid: Tile[][]) => {
    // If the grid was updated via the atomic action router (e.g. placing, moving, stashing),
    // skip the duplicate auto-save to prevent race conditions.
    if (isOptimisticSaveRef.current) {
      isOptimisticSaveRef.current = false;
      return;
    }

    // Sanitize grid before saving to prevent persisting duplicates
    const idSet = new Set<string>();
    const sanitizedGrid = grid.map(row => row.map(tile => {
      if (!tile || tile.type === 'vacant' || tile.type === 'empty') return tile;
      if (idSet.has(tile.id)) {
        return {
          ...tile,
          type: 'vacant' as TileType,
          id: `vacant-${tile.x}-${tile.y}`,
          image: '/images/kingdom-tiles/Vacant.webp'
        } as Tile;
      }
      if (tile.id) idSet.add(tile.id);
      return tile;
    }));

    try {
      const token = await getToken();
      if (!token) {
        // logger.debug('[Kingdom] No token available, falling back to localStorage');
        localStorage.setItem('kingdom-grid', JSON.stringify(sanitizedGrid));
        return;
      }

      const response = await fetch('/api/kingdom-grid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ grid: sanitizedGrid }),
      });

      if (response.ok) {
        // logger.debug('[Kingdom] ✅ Grid saved to Supabase successfully');
      } else {
        logger.debug('[Kingdom] ⚠️ Failed to save to Supabase, falling back to localStorage');
        localStorage.setItem('kingdom-grid', JSON.stringify(grid));
      }
    } catch (error) {
      logger.error('[Kingdom] Error saving to Supabase:', error);
      // logger.debug('[Kingdom] Falling back to localStorage');
      localStorage.setItem('kingdom-grid', JSON.stringify(grid));
    }
  }, [getToken]);

  // Save kingdomGrid to Supabase whenever it changes, skipping initial mount load
  useEffect(() => {
    if (kingdomGrid && kingdomGrid.length > 0) {
      if (isInitialSaveRef.current) {
        isInitialSaveRef.current = false;
        // logger.debug('[Kingdom] Skipping initial grid save as it was just loaded');
        return;
      }

      // logger.debug('[Kingdom] Saving kingdomGrid to Supabase:', {
      //   gridLength: kingdomGrid.length,
      //   hasTiles: kingdomGrid.some(row => row.some(cell => cell && cell.type && cell.type !== 'empty')),
      //   tileCount: kingdomGrid.flat().filter(cell => cell && cell.type && cell.type !== 'empty').length
      // });
      saveKingdomGridToSupabase(kingdomGrid);
    }
  }, [kingdomGrid, saveKingdomGridToSupabase]);

  // Helper to determine if an item is consumable
  const isConsumable = (item: KingdomInventoryItem) => {
    return item.type === 'artifact' || item.type === 'scroll' || item.type === 'potion' || (item.type === 'item' && !item.category);
  };

  // Handler for equipping items
  const handleEquip = async (item: KingdomInventoryItem) => {
    // For consumables, show modal
    if (isConsumable(item)) {
      setModalText(await getConsumableEffect(item));
      setModalOpen(true);
      return;
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
        logger.error('[Sell] Response error:', errorText);
        throw new Error(`Failed to remove item from inventory: ${response.status} ${response.statusText}`);
      }

      // Give gold for the sale
      gainGold(sellPrice, `sell-${item.name.toLowerCase()}`);

      // Show selling confirmation modal
      setSoldItem({ name: item.name, gold: sellPrice });
      setSellingModalOpen(true);

      // Refresh inventory from Supabase
      const inventoryRes = await fetch('/api/inventory');
      let allItems = [];
      if (inventoryRes.ok) {
        const json = await inventoryRes.json();
        if (json.success && Array.isArray(json.data)) {
          allItems = json.data;
        }
      }
      
      const equipped = allItems.filter((i: any) => i.equipped);
      const stored = allItems.filter((i: any) => !i.equipped);
      
      const normalize = (items: any[]) => (Array.isArray(items) ? items : []).map(item => ({
        ...item,
        stats: item.stats || {},
        description: item.description || '',
      }) as KingdomInventoryItem);
      
      const normEquipped = normalize(equipped);
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
    } catch (error) {
      logger.error('Failed to sell item:', error);
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
      logger.error('Failed to spend material', e);
    }
  };

  async function handlePlaceKingdomTile(x: number, y: number, tile: Tile) {
    if (!user?.id) return;
    
    const tileId = tile.type || tile.id?.split('-')[0] || tile.id;
    logger.debug('[Kingdom] placing tile, decrementing inventory for:', tileId);

    // 1. Pre-calculate the updated grid
    const updatedGrid = kingdomGrid.map(row => row.slice());
    if (updatedGrid[y]) {
      updatedGrid[y][x] = { ...tile, x, y, id: `${tile.id}-${x}-${y}` };
    }

    // 2. Optimistic UI update for grid
    isOptimisticSaveRef.current = true;
    setKingdomGrid(updatedGrid);

    // 2. Optimistic UI update for inventory
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
          newItems[existingIndex] = { ...existing, quantity: (existing.quantity || 0) - 1 };
        }
        return newItems;
      } else {
        return [...prev, {
          id: tileId,
          name: tile.name,
          type: tile.type as any,
          quantity: -1,
          image: tile.image || ''
        }];
      }
    });

    // 3. Make atomic server request
    try {
      const response = await fetchWithAuth('/api/kingdom-grid/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'place',
          grid: updatedGrid,
          itemId: tileId,
          tileName: tile.name,
          x,
          y
        }),
      });
      if (!response.ok) throw new Error('Failed to place tile atomically');
      window.dispatchEvent(new Event('character-inventory-update'));
    } catch (error) {
      logger.error('[Kingdom] Failed to place tile atomically:', error);
      toast({
        title: "Sync Issue",
        description: "Failed to update layout on server. Your changes may revert.",
        variant: "destructive",
      });
    }
  }

  async function handleMoveKingdomTile(updatedGrid: Tile[][], x: number, y: number, newTile: Tile) {
    if (!user?.id) return;
    
    // Optimistic
    isOptimisticSaveRef.current = true;
    setKingdomGrid(updatedGrid);

    try {
      const response = await fetchWithAuth('/api/kingdom-grid/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          grid: updatedGrid,
          itemId: newTile.type || newTile.id,
          tileName: newTile.name,
          x,
          y
        }),
      });
      if (!response.ok) throw new Error('Failed to move tile atomically');
    } catch (error) {
      logger.error('[Kingdom] Failed to move tile atomically:', error);
      toast({
        title: "Sync Issue",
        description: "Failed to move tile on server.",
        variant: "destructive",
      });
    }
  }

  async function handleStashKingdomTile(updatedGrid: Tile[][], x: number, y: number, tileId: string) {
    if (!user?.id) return;

    // Optimistic grid
    isOptimisticSaveRef.current = true;
    setKingdomGrid(updatedGrid);

    // Optimistic inventory increment
    setLocalItems(prev => {
      const existingIndex = prev.findIndex(i =>
        i.id === tileId || i.id.toLowerCase() === tileId.toLowerCase()
      );
      if (existingIndex >= 0) {
        const newItems = [...prev];
        const existing = newItems[existingIndex];
        if (existing) {
          newItems[existingIndex] = { ...existing, quantity: (existing.quantity || 0) + 1 };
        }
        return newItems;
      } else {
        return [...prev, { id: tileId, name: 'Restored Tile', type: 'item' as any, quantity: 1, image: '' } as KingdomInventoryItem];
      }
    });

    try {
      const response = await fetchWithAuth('/api/kingdom-grid/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stash',
          grid: updatedGrid,
          itemId: tileId,
          x,
          y
        }),
      });
      if (!response.ok) throw new Error('Failed to stash tile atomically');
      window.dispatchEvent(new Event('character-inventory-update'));
    } catch (error) {
      logger.error('[Kingdom] Failed to stash tile atomically:', error);
      toast({
        title: "Sync Issue",
        description: "Failed to return tile to inventory.",
        variant: "destructive",
      });
    }
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
          <Image
            src={imagePath}
            alt={`${getItemDisplayName(item)} ${item.type}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            aria-label={`${item.name}-image`}
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
              <CardTitle className="text-amber-500 text-lg font-semibold mb-1 flex justify-between items-center w-full">
                <span>{getItemDisplayName(item)}</span>
                {item.star_rating && item.star_rating > 0 && (
                  <span className="text-yellow-400 text-sm ml-2 drop-shadow-md" title={`Star Rating: ${item.star_rating}`}>
                    {'★'.repeat(item.star_rating)}
                  </span>
                )}
              </CardTitle>
              {item.type && (
                <Badge className="text-xs bg-zinc-700 text-zinc-300 mb-2">
                  {item.type}
                </Badge>
              )}
              {item.description && (
                <CardDescription className="text-zinc-400 text-sm leading-relaxed">
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
                <span className="text-zinc-400 text-sm">
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

  // NOTE: Kingdom grid is loaded by initializeKingdomData above.
  // Do NOT add a second grid loader here — it causes a race condition
  // that overwrites the saved grid with stale/default data.

  // Consolidated Inventory & Challenges Loading Logic
  const loadInventory = useCallback(async () => {
    if (!user?.id || isInventoryLoadingRef.current) return;

    try {
      isInventoryLoadingRef.current = true;
      // Do NOT setInventoryLoading(true) here! It unmounts the entire page.
      // Initial state is true, so initial load is handled. Subsequent syncs stay silent.

      // 1. Fetch Parallel Data
      const [inventoryRes, stats, challengesResponse] = await Promise.all([
        fetchWithAuth('/api/inventory').catch(() => null),
        getTotalStats(user.id),
        fetch('/api/challenges-ultra-simple').catch(() => null)
      ]);

      let allItems = [];
      if (inventoryRes?.ok) {
        try {
          const json = await inventoryRes.json();
          if (json.success && Array.isArray(json.data)) {
            allItems = json.data;
          }
        } catch (e) {
          logger.warn('[Kingdom] Failed to parse inventory JSON', e);
        }
      } else {
        console.error('[Kingdom] inventoryRes was not ok! Status:', inventoryRes?.status);
      }

      // 2. Handle Challenges safely
      try {
        let finalChallenges = [];
        if (challengesResponse?.ok) {
          finalChallenges = await challengesResponse.json();
          localStorage.setItem('challenges', JSON.stringify(finalChallenges));
        } else {
          const saved = localStorage.getItem('challenges');
          if (saved) finalChallenges = JSON.parse(saved);
        }
        setChallenges(finalChallenges);
      } catch (e) {
        logger.warn('[Kingdom] Failed to parse challenges:', e);
      }

      // 2.5 Fetch Fresh Character Stats (Currencies) safely
      try {
        const freshStats = await fetchFreshCharacterStats();
        if (freshStats) {
          setUserTokens(freshStats.streak_tokens || 0);
          setPlayerLevel(freshStats.level || 1);
        }
      } catch (e) {
        logger.warn('[Kingdom] Failed to fetch character stats:', e);
      }

      // 3. Filter & Update Items
      const normalize = (items: any[]) => (Array.isArray(items) ? items : []).map(item => ({
        ...item,
        stats: item.stats || {},
        description: item.description || '',
      }) as KingdomInventoryItem);

      const equipped = allItems.filter((i: any) => i.equipped);
      const stored = allItems.filter((i: any) => !i.equipped);

      const normEquipped = normalize(equipped);

      // If no items are equipped, show default inventory items as a fallback
      if (normEquipped.length === 0) {
        const defaults = (comprehensiveItems || []).filter(i => i.isDefault).map(item => ({
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
      logger.error('[Kingdom] Inventory load failed with exception:', error);
      try {
        if ((comprehensiveItems || []).filter(i => i.isDefault).length > 0) {
          const defaults = comprehensiveItems.filter(i => i.isDefault).map(item => ({
            ...item,
            stats: item.stats || {},
            description: item.description || '',
            equipped: true,
            type: item.type as any,
            category: item.type,
          })) as KingdomInventoryItem[];
          setEquippedItems(defaults);
        }
      } catch (e) {}
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
      if (typeof pref === 'string') {
        setCoverImage(pref);
      } else {
        // Set default kingdom header image
        setCoverImage('/images/kingdom-header.webp');
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
      type: 'resource', // Use 'resource' for materials found on tiles
      quantity: 1,
      image: item.image || '/images/items/mystery-item.webp',
      description: `A valuable resource: ${item.name}`,
      emoji: '📦',
      stats: {},
      category: item.type || 'resource',
      rarity: 'common'
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

  if (!isLoaded || inventoryLoading || coverImageLoading || gridLoading) {
    return <KingdomLoading />;
  }

  // After animation, show the main content immediately

  return (
    <div className={cn(
      "min-h-screen relative"
    )}>
      {isVisiting && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white px-6 py-3 rounded-2xl border-2 border-amber-500/30  shadow-[0_0_40px_rgba(245,158,11,0.15)] flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
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
            onClick={() => router.push('/city/Grand Citadel/tavern?tab=allies')}
          >
            {TEXT_CONTENT.kingdom.ui.envoyMode.returnHome}
          </Button>
        </div>
      )}



      <HeaderSection
        title={isVisiting ? TEXT_CONTENT.kingdom.ui.header.allyKingdom : TEXT_CONTENT.kingdom.ui.header.myKingdom}
        subtitle={isVisiting ? TEXT_CONTENT.kingdom.ui.header.allyKingdomSubtitle : TEXT_CONTENT.kingdom.ui.header.myKingdomSubtitle}
        imageSrc={coverImage || "/images/Kingdom.webp"}
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
          <div className="flex w-full mb-6 justify-between items-center gap-2">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="thrivehaven">
                <LayoutGrid className="w-4 h-4 mr-2" />
                <span>{TEXT_CONTENT.kingdom.ui.tabs.thrivehaven}</span>
              </TabsTrigger>
              <TabsTrigger value="journey">
                <Compass className="w-4 h-4 mr-2" />
                <span>{TEXT_CONTENT.kingdom.ui.tabs.journey}</span>
              </TabsTrigger>
            </TabsList>
            
            <Link href="/kingdom/archive">
              <Button variant="outline" className="border-amber-900/30 text-amber-500 hover:bg-amber-950/30 hover:text-amber-400">
                <Trophy className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Archive of Triumphs</span>
              </Button>
            </Link>
          </div>
          <TabsContent value="thrivehaven">
            <div className="flex flex-col items-center justify-center w-full">
              {gridLoading ? (
                <div className="w-full flex flex-col items-center justify-center py-8 gap-4">
                  <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(6, 64px)' }}>
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div key={i} className="w-16 h-16 bg-zinc-700/50 animate-pulse rounded" />
                    ))}
                  </div>
                  <span className="text-zinc-400 text-sm">{TEXT_CONTENT.kingdom.ui.loadingGrid}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <MedievalErrorBoundary>
                    <KingdomGridWithTimers
                      grid={kingdomGrid}
                      onTilePlace={isVisiting ? () => { } : handlePlaceKingdomTile}
                      selectedTile={selectedKingdomTile}
                      setSelectedTile={isVisiting ? () => { } : setSelectedKingdomTile}
                      onGridUpdate={isVisiting ? () => { } : (newGrid: Tile[][]) => setKingdomGrid(newGrid)}
                      onGridExpand={isVisiting ? () => { } : (newGrid: Tile[][]) => setKingdomGrid(newGrid)}
                      onTileMove={isVisiting ? undefined : handleMoveKingdomTile}
                      onTileStash={isVisiting ? undefined : handleStashKingdomTile}
                      onGoldEarned={isVisiting ? () => { } : handleKingdomTileGoldEarned}
                      onItemFound={isVisiting ? () => { } : handleKingdomTileItemFound}
                      readOnly={isVisiting}
                      inventory={mergedItems}
                      onMaterialSpend={isVisiting ? undefined : handleMaterialSpend}
                      userId={user?.id || null}
                      playerLevel={playerLevel}
                      onInventoryUpdate={isVisiting ? undefined : handleInventoryUpdate}
                      inventoryItems={[
                        ...equippedItems.map(i => ({ ...i, equipped: true, canEquip: isEquippable(i), canUse: isConsumable(i), sellPrice: getItemSellPrice(i) })),
                        ...storedItems.map(i => ({ ...i, equipped: false, canEquip: isEquippable(i), canUse: isConsumable(i), sellPrice: getItemSellPrice(i) }))
                      ]}
                      onForgeSuccess={loadInventory}
                    />
                  </MedievalErrorBoundary>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="journey">
            <div className="space-y-6">
              {/* Journey Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900 border-amber-900/30">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Sword className="w-8 h-8 text-amber-500 mb-2" />
                    <div className="text-2xl font-bold text-white">{journeyStats.dungeonWins}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Dungeon Wins</div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-amber-900/30">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <BookOpen className="w-8 h-8 text-amber-500 mb-2" />
                    <div className="text-2xl font-bold text-white">{journeyStats.journalCount}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Journals Scribed</div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-amber-900/30">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <LayoutGrid className="w-8 h-8 text-amber-500 mb-2" />
                    <div className="text-2xl font-bold text-white">{journeyStats.meditationCount}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Meditations</div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-amber-900/30">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Flame className="w-8 h-8 text-amber-500 mb-2" />
                    <div className="text-2xl font-bold text-white">{journeyStats.streakTokens}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Streak Tokens</div>
                  </CardContent>
                </Card>
              </div>

              {/* Dungeon History */}
              <Card className="bg-zinc-950 border-amber-900/30">
                <CardHeader>
                  <CardTitle className="text-lg text-amber-500 flex items-center gap-2">
                    <Skull className="w-5 h-5" /> Recent Dungeon History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {journeyStats.dungeonRuns.length > 0 ? (
                    <div className="space-y-4">
                      {journeyStats.dungeonRuns.map((run: any) => {
                        // Calculate highest rarity for visual effects
                        let highestRarity = 'common';
                        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
                        
                        if (run.loot_obtained && Array.isArray(run.loot_obtained)) {
                          run.loot_obtained.forEach((l: any) => {
                            if (l.type === 'item' && l.itemId) {
                              const item = comprehensiveItems.find(i => i.id === l.itemId);
                              if (item && rarities.indexOf(item.rarity) > rarities.indexOf(highestRarity)) {
                                highestRarity = item.rarity;
                              }
                            }
                          });
                        }

                        const rarityGlows: Record<string, string> = {
                          legendary: 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)] bg-yellow-900/10',
                          epic: 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] bg-purple-900/10',
                          rare: 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-blue-900/10',
                          uncommon: 'border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)] bg-green-900/5',
                          common: 'border-amber-900/10 bg-zinc-900'
                        };

                        return (
                          <div key={run.id} className={cn("flex items-center justify-between p-3 rounded-lg border transition-all duration-300", rarityGlows[highestRarity])}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-900/20 rounded-full flex items-center justify-center border border-amber-900/30">
                              <Sword className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <div className="font-bold text-amber-200 capitalize">
                                {run.dungeon_id && run.dungeon_id !== 'unknown' 
                                  ? run.dungeon_id.replace(/-/g, ' ') 
                                  : [
                                      "The Forgotten Deep",
                                      "Obsidian Crypt",
                                      "Whispering Catacombs",
                                      "Shadowy Abyss",
                                      "The Emerald Maw",
                                      "Ancestral Vault",
                                      "Starlight Grotto"
                                    ][(run.id.split('-')[0].split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % 7]}
                              </div>
                              <div className="text-xs text-zinc-500">{new Date(run.completed_at).toLocaleDateString()} at {new Date(run.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className="text-green-400 border-green-900/30 bg-green-900/10">Victory</Badge>
                            <div className="flex gap-2 text-xs">
                              <span className="text-yellow-500">+{run.gold_earned}g</span>
                              <span className="text-blue-400">+{run.xp_earned}xp</span>
                            </div>
                            {/* Loot Visualization */}
                            {run.loot_obtained && Array.isArray(run.loot_obtained) && run.loot_obtained.filter((l: any) => l.type === 'item').length > 0 && (
                              <div className="flex -space-x-1 overflow-hidden mt-1">
                                {run.loot_obtained.filter((l: any) => l.type === 'item').map((lootItem: any, idx: number) => (
                                  <div 
                                    key={idx} 
                                    className="w-6 h-6 rounded-full border border-amber-900/50 bg-zinc-950 flex items-center justify-center p-0.5"
                                    title={lootItem.name}
                                  >
                                    <span className="text-[10px] leading-none" role="img" aria-label={lootItem.name}>
                                      {lootItem.emoji || (lootItem.name?.toLowerCase().includes('sword') ? '⚔️' : lootItem.name?.toLowerCase().includes('potion') ? '🧪' : '📦')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-500">
                      <p>No dungeon conquests recorded yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Kingdom Passive Bonuses */}
              <div className="mb-6">
                <KingdomBonusesBlock grid={kingdomGrid} />
              </div>
              
              {/* Kingdom Stats and Gains - Most Important for Kingdom Page */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="w-full" aria-label="kingdom-stats-block-container">
                  <MedievalErrorBoundary fallbackTitle="Kingdom Stats">
                    <KingdomStatsBlock userId={visitUserId || user?.id || null} />
                  </MedievalErrorBoundary>
                </div>
                <div className="w-full" aria-label="king-stats-block-container">
                  <MedievalErrorBoundary fallbackTitle="King Stats">
                    <KingStatsBlock userId={visitUserId || user?.id || null} />
                  </MedievalErrorBoundary>
                </div>
              </div>

              {/* Progression Visualization */}
              {!isVisiting && (
                <div className="mb-6">
                  <MedievalErrorBoundary fallbackTitle="Progression">
                    <ProgressionVisualization />
                  </MedievalErrorBoundary>
                </div>
              )}

              {/* Economy Transparency */}
              {!isVisiting && (
                <div className="mb-6">
                  <MedievalErrorBoundary fallbackTitle="Treasury Ledger">
                    <EconomyTransparency />
                  </MedievalErrorBoundary>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {/* Bottom spacing */}
      <div className="h-8 md:h-12"></div>

      {/* Selling Confirmation Modal */}
      <Dialog open={sellingModalOpen} onOpenChange={setSellingModalOpen}>
        <DialogContent className="bg-zinc-900 border-amber-800/20" role="dialog" aria-label="selling-confirmation-modal">
          <DialogDescription id="selling-confirmation-modal-desc">Item sold confirmation</DialogDescription>
          <DialogHeader>
            <DialogTitle className="text-2xl font-cardo text-amber-500">
              {TEXT_CONTENT.kingdom.ui.sellSuccess.title}
            </DialogTitle>
            <DialogDescription className="text-zinc-300">
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
        playerLevel={playerLevel}
        grid={kingdomGrid}
        inventoryItems={[
          ...equippedItems.map(i => ({ ...i, equipped: true, canEquip: isEquippable(i), canUse: isConsumable(i), sellPrice: getItemSellPrice(i) })),
          ...storedItems.map(i => ({ ...i, equipped: false, canEquip: isEquippable(i), canUse: isConsumable(i), sellPrice: getItemSellPrice(i) }))
        ]}
        userId={user?.id ?? null}
        onForgeSuccess={loadInventory}
        onEquip={handleEquip}
        onUnequip={handleUnequip}
        onSell={handleSellItem}
      />
    </div>
  );
}