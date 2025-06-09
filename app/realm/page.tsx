"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Image from "next/image"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { getCharacterName } from "@/lib/toast-utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
// Import necessary types from '@/types/tiles'
import { Tile, ConnectionDirection, TileType, InventoryItem, SelectedInventoryItem } from '@/types/tiles'
import { useCreatureStore } from "@/stores/creatureStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, Trash2, RotateCw, RefreshCw, ScrollText, Save } from "lucide-react"
import { useCreatureUnlock } from "@/lib/hooks/use-creature-unlock"
import { MapGrid } from '../../components/map-grid'
import { TileInventory } from '@/components/tile-inventory'
import { Switch } from "@/components/ui/switch"
import { generateMysteryEvent, handleEventOutcome, getScrollById } from "@/lib/mystery-events"
import { MysteryEvent } from '@/lib/mystery-events'
import { MysteryEventType, MysteryEventReward } from '@/lib/mystery-events' // Import MysteryEventReward
import { addToInventory, addToKingdomInventory } from "@/lib/inventory-manager"
import { TileEditor } from '@/components/tile-editor'
import { createTilePlacement, getTilePlacements } from '@/lib/api'
import { nanoid } from 'nanoid'
import { Minimap } from "@/components/Minimap"
import { MinimapEntity, MinimapRotationMode } from "@/types/minimap"
import { useAchievementStore } from '@/stores/achievementStore'
import { loadInitialGrid, createTileFromNumeric, numericToTileType } from "@/lib/grid-loader"
import { getLatestGrid, uploadGridData, updateGridData, subscribeToGridChanges, createQuestCompletion, getQuestCompletions } from '@/lib/api'
import { useAuthContext } from '@/components/providers'
import Link from "next/link"
import { logger } from "@/lib/logger"
import { useSupabaseClientWithToken } from '@/lib/hooks/use-supabase-client'
import { createEventNotification } from "@/lib/notifications"
import { useUser } from '@clerk/nextjs'
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import React from "react"

// Types
interface Position {
  x: number;
  y: number;
}

interface TileCounts {
  forestPlaced: number;
  forestDestroyed: number;
  waterPlaced: number;
  mountainPlaced: number;
  mountainDestroyed: number;
  icePlaced: number;
  waterDestroyed: number;
}

interface Logger {
  log: (level: "error" | "warning" | "info", message: string, source: string) => void;
  error: (message: string, source: string) => void;
  warning: (message: string, source: string) => void;
  warn: (message: string, source: string) => void;
  info: (message: string, source: string) => void;
  clear: () => void;
}


// Constants
const GRID_COLS = 13
const INITIAL_ROWS = 7
const ZOOM_LEVELS = [0.5, 1, 1.5, 2]
const AUTOSAVE_INTERVAL = 30000 // 30 seconds

// Initial state
const initialTileInventory: Partial<Record<TileType, InventoryItem>> = ({
  grass: {
    id: 'grass-1',
    type: 'grass',
    name: "Grass",
    description: "Basic grassland tile",
    connections: [],
    rotation: 0,
    cost: 20,
    quantity: 50,
    image: '/images/tiles/grass-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Grass tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: false,
    cityName: undefined,
  },
  water: {
    id: 'water-1',
    type: 'water',
    name: "Water",
    description: "Water tile",
    connections: [],
    rotation: 0,
    cost: 30,
    quantity: 30,
    image: '/images/tiles/water-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Water tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: false,
    cityName: undefined, // Added optional properties
  },
  mountain: {
    id: 'mountain-1',
    type: 'mountain',
    name: "Mountain",
    description: "Mountain tile",
    connections: [],
    rotation: 0,
    cost: 40,
    quantity: 20,
    image: '/images/tiles/mountain-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Mountain tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: false,
    cityName: undefined, // Added optional properties
  },
  forest: {
    id: 'forest-1',
    type: 'forest',
    name: "Forest",
    description: "Forest tile",
    connections: [],
    rotation: 0,
    cost: 35,
    quantity: 25,
    image: '/images/tiles/forest-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Forest tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: false,
    cityName: undefined, // Added optional properties
  },
  desert: {
    id: 'desert-1',
    type: 'desert',
    name: "Desert",
    description: "Desert tile",
    connections: [],
    rotation: 0,
    cost: 25,
    quantity: 40,
    image: '/images/tiles/desert-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Desert tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: false,
    cityName: undefined, // Added optional properties
  },
  ice: {
    id: 'ice-1',
    type: 'ice',
    name: "Ice",
    description: "Ice tile",
    connections: [],
    rotation: 0,
    cost: 45,
    quantity: 15,
    image: '/images/tiles/ice-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Ice tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: false,
    cityName: undefined, // Added optional properties
  },
  mystery: {
    id: 'mystery-1',
    type: 'mystery',
    name: "Mystery",
    description: "Mystery tile",
    connections: [],
    rotation: 0,
    cost: 50,
    quantity: 10,
    image: '/images/tiles/mystery-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Mystery tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: false,
    cityName: undefined, // Added optional properties
  },
  city: {
    id: 'city-1',
    type: 'city',
    name: "City",
    description: "City tile",
    connections: [],
    rotation: 0,
    cost: 100,
    quantity: 5,
    image: '/images/tiles/city-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "City tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: true,
    cityName: undefined, // Added optional properties
  },
  town: {
    id: 'town-1',
    type: 'town',
    name: "Town",
    description: "Town tile",
    connections: [],
    rotation: 0,
    cost: 75,
    quantity: 8,
    image: '/images/tiles/town-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Town tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: true,
    cityName: undefined, // Added optional properties
  },
  empty: {
    id: 'empty-1',
    type: 'empty',
    name: "Empty",
    description: "Empty tile",
    connections: [],
    rotation: 0,
    cost: 0,
    quantity: 999,
    image: '/images/tiles/empty-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Empty tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: false,
    cityName: undefined, // Added optional properties
  },
  snow: {
    id: 'snow-1',
    type: 'snow',
    name: "Snow",
    description: "Snow tile",
    connections: [],
    rotation: 0,
    cost: 35,
    quantity: 20,
    image: '/images/tiles/ice-tile.png', // Use ice as fallback
    revealed: true,
    isVisited: false,
    ariaLabel: "Snow tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: false,
    cityName: undefined, // Added optional properties
  },
  cave: {
    id: 'cave-1',
    type: 'cave',
    name: "Cave",
    description: "Cave tile",
    connections: [],
    rotation: 0,
    cost: 45,
    quantity: 15,
    image: '/images/tiles/cave-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Cave tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: false,
    cityName: undefined, // Added optional properties
  },
  dungeon: {
    id: 'dungeon-1',
    type: 'dungeon',
    name: "Dungeon",
    description: "Dungeon tile",
    connections: [],
    rotation: 0,
    cost: 80,
    quantity: 8,
    image: '/images/tiles/dungeon-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Dungeon tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: false,
    cityName: undefined, // Added optional properties
  },
  castle: {
    id: 'castle-1',
    type: 'castle',
    name: "Castle",
    description: "Castle tile",
    connections: [],
    rotation: 0,
    cost: 150,
    quantity: 3,
    image: '/images/tiles/castle-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Castle tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: true,
    cityName: undefined, // Added optional properties
  },
  lava: {
    id: 'lava-1',
    type: 'lava',
    name: "Lava",
    description: "A dangerous lava tile that cannot be entered",
    connections: [],
    rotation: 0,
    cost: 60,
    quantity: 10,
    image: '/images/tiles/lava-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Lava tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: false,
    cityName: undefined,
  },
  volcano: {
    id: 'volcano-1',
    type: 'volcano',
    name: "Volcano",
    description: "A dangerous volcano tile that cannot be entered",
    connections: [],
    rotation: 0,
    cost: 80,
    quantity: 5,
    image: '/images/tiles/volcano-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Volcano tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: false,
    cityName: undefined,
  },
  'portal-entrance': {
    id: 'portal-entrance-1',
    type: 'portal-entrance',
    name: "Portal Entrance",
    description: "Entrance portal tile",
    connections: [],
    rotation: 0,
    cost: 200,
    quantity: 1,
    image: '/images/tiles/portal-entrance-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Portal entrance tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: false,
    cityName: undefined,
  },
  'portal-exit': {
    id: 'portal-exit-1',
    type: 'portal-exit',
    name: "Portal Exit",
    description: "Exit portal tile",
    connections: [],
    rotation: 0,
    cost: 200,
    quantity: 1,
    image: '/images/tiles/portal-exit-tile.png',
    revealed: true,
    isVisited: false,
    ariaLabel: "Portal exit tile in inventory",
    x: 0,
    y: 0,
    isMainTile: false,
    isTown: false,
    cityName: undefined,
  },
});

// Add location data
const locationData = {
  city: {
    name: "Grand Citadel",
    description: "A magnificent city with towering spires and bustling markets. The heart of commerce and culture in the realm.",
    locationId: "grand-citadel"
  },
  town: {
    name: "Riverside Haven",
    description: "A peaceful town nestled by the river. Known for its friendly inhabitants and local crafts.",
    locationId: "riverside-haven"
  },
  castle: { // Added castle location data
    name: "Skyreach Castle",
    description: "An ancient castle atop a high peak.",
    locationId: "skyreach-castle"
  },
}

// Function to create base grid with consistent dimensions
const createBaseGrid = (rows: number, cols: number): Tile[][] => {
  return Array(rows).fill(null).map((_, y) =>
    Array(cols).fill(null).map((_, x) => ({
      id: `tile-${x}-${y}`,
      type: 'empty' as TileType,
      name: 'Empty Tile',
      description: 'An empty space ready for a new tile',
      connections: [],
      rotation: 0 as 0 | 90 | 180 | 270,
      revealed: true,
      isVisited: false,
      x,
      y,
      ariaLabel: `Empty tile at position ${x},${y}`,
      image: '/images/tiles/empty-tile.png',
      isMainTile: false, // Default values
      isTown: false, // Default values
      cityName: undefined, // Default values
      cityX: undefined,
      cityY: undefined,
      citySize: undefined,
      bigMysteryX: undefined,
      bigMysteryY: undefined,
      tileSize: undefined,
    }))
  );
};


// Fix the findTilePosition function to handle undefined cases
const findTilePosition = (grid: Tile[][], type: TileType): Position | null => {
  if (!grid || !Array.isArray(grid)) {
    return null;
  }

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (!row || !Array.isArray(row)) continue;

    for (let x = 0; x < row.length; x++) {
      const tile = row[x];
      // Add null/undefined check for tile
      if (tile && tile.type === type) {
        return { x, y };
      }
    }
  }
  return null;
};

// Helper function to create an empty tile
const createEmptyTile = (x: number, y: number): Tile => ({
  id: `tile-${x}-${y}-${Date.now()}`,
  type: 'empty',
  name: 'Empty Tile',
  description: 'An empty space ready for a new tile',
  connections: [],
  rotation: 0,
  revealed: true,
  isVisited: false,
  x,
  y,
  ariaLabel: `Empty tile at position ${x},${y}`,
  image: '/images/tiles/empty-tile.png',
  isMainTile: false, // Default values
  isTown: false, // Default values
  cityName: undefined, // Default values
  cityX: undefined,
  cityY: undefined,
  citySize: undefined,
  bigMysteryX: undefined,
  bigMysteryY: undefined,
  tileSize: undefined,
});

// Fix the processLoadedGrid function to handle undefined cases - Keep only one definition
const processLoadedGrid = (loadedGrid: unknown): Tile[][] => {
  if (!Array.isArray(loadedGrid)) {
    logger.error('Invalid grid data format', 'GridInit');
    return createBaseGrid(INITIAL_ROWS, GRID_COLS);
  }

  return loadedGrid.map((row: unknown, y: number) => {
    if (!Array.isArray(row)) {
      // If a row is not an array, fill it with empty tiles
      return Array(GRID_COLS).fill(null).map((_, x) => createEmptyTile(x, y));
    }

    return row.map((cell: unknown, x: number) => {
      if (typeof cell !== 'object' || cell === null) {
        // If cell is not an object, return an empty tile
        return createEmptyTile(x, y);
      }
      const c = cell as Record<string, any>;
      const tileType = c['type'] || 'empty';
      const baseTile: Tile = {
        id: c['id'] || `tile-${x}-${y}-${Date.now()}`,
        type: tileType,
        name: c['name'] || 'Empty Tile',
        description: c['description'] || 'An empty space ready for a new tile',
        connections: c['connections'] || [],
        rotation: c['rotation'] || 0,
        revealed: c['revealed'] ?? true,
        isVisited: c['isVisited'] ?? false,
        x: c['x'] ?? x,
        y: c['y'] ?? y,
        ariaLabel: c['ariaLabel'] || `${tileType} tile at position ${x},${y}`,
        image: c['image'] || `/images/tiles/${tileType}-tile.png`,
        cost: c['cost'] ?? 0,
        quantity: c['quantity'] ?? 1,
        isMainTile: c['isMainTile'] ?? false,
        isTown: c['isTown'] ?? false,
        cityName: c['cityName'],
        cityX: c['cityX'],
        cityY: c['cityY'],
        citySize: c['citySize'],
        bigMysteryX: c['bigMysteryX'],
        bigMysteryY: c['bigMysteryY'],
        tileSize: c['tileSize'],
      };
      return baseTile;
    });
  });
};


// Fix the mergeTilesIntoGrid function to handle undefined cases
const mergeTilesIntoGrid = (baseGrid: Tile[][], savedTiles: Tile[]): Tile[][] => {
  if (!baseGrid || baseGrid.length === 0 || !Array.isArray(baseGrid[0]) || baseGrid[0].length === 0) {
    logger.error('Base grid is empty or has empty rows', 'GridInit');
    return baseGrid;
  }

  // Create a deep copy of the base grid
  const mergedGrid = baseGrid.map(row => [...row]);
  logger.info('Initial merged grid (copy of base grid)', 'GridInit');

  savedTiles.forEach(tile => {
    // Add more robust checks for tile data
    if (!tile || typeof tile !== 'object' || !('x' in tile) || typeof tile.x !== 'number' || !('y' in tile) || typeof tile.y !== 'number' || !('type' in tile) || typeof tile.type !== 'string') {
      logger.warning('Invalid tile data received for merging', 'GridInit');
      return;
    }

    logger.info(`Processing tile at x:${tile.x}, y:${tile.y} with type:${tile.type}`, 'GridInit');
    // Ensure the target position exists in the mergedGrid
    // Refined check for safety
    if (tile.y >= 0 && tile.y < mergedGrid.length) {
      const row = mergedGrid[tile.y];
      if (row && tile.x >= 0 && tile.x < row.length) { // Check row existence and bounds for x
        const existingTile = row[tile.x];
        if (existingTile !== undefined) { // Check if the tile position is defined in the base grid
          const updatedTile: Tile = { // Explicitly type as Tile
            ...existingTile,
            ...tile,
            id: tile.id || `tile-${tile.x}-${tile.y}-${Date.now()}`, // Ensure ID is unique, prefer existing
            ariaLabel: tile.ariaLabel || `${tile.type} tile at position ${tile.x},${tile.y}`,
            // Ensure connections is an array and other properties are handled
            connections: (Array.isArray(tile.connections) && tile.connections.length > 0) ? tile.connections : existingTile.connections || [],
            rotation: tile.rotation !== undefined ? tile.rotation : existingTile.rotation || 0 as 0 | 90 | 180 | 270,
            revealed: tile.revealed !== undefined ? tile.revealed : existingTile.revealed || false,
            isVisited: tile.isVisited !== undefined ? tile.isVisited : existingTile.isVisited || false,
            name: tile.name || existingTile.name || `${tile.type.charAt(0).toUpperCase() + tile.type.slice(1)} Tile`,
            description: tile.description || existingTile.description || `A ${tile.type} tile`,
            image: tile.image || existingTile.image || `/images/tiles/${tile.type}-tile.png`,
             // Provide default values or ensure they are correctly merged
            isMainTile: tile.isMainTile ?? existingTile.isMainTile ?? false,
            isTown: tile.isTown ?? existingTile.isTown ?? false,
            cityName: tile.cityName ?? existingTile.cityName, // Keep optional nature
            cityX: tile.cityX ?? existingTile.cityX,
            cityY: tile.cityY ?? existingTile.cityY,
            citySize: tile.citySize ?? existingTile.citySize,
            bigMysteryX: tile.bigMysteryX ?? existingTile.bigMysteryX,
            bigMysteryY: tile.bigMysteryY ?? existingTile.bigMysteryY,
            tileSize: tile.tileSize ?? existingTile.tileSize,
             cost: tile.cost ?? existingTile.cost ?? 0, // Provide default for cost
             quantity: tile.quantity ?? existingTile.quantity ?? 1, // Provide default for quantity

          };
          row[tile.x] = updatedTile;
        } else {
             logger.warning(`Existing tile is undefined at position y=${tile.y}, x=${tile.x}`, 'GridInit');
        }
      } else {
         logger.warning(`Invalid x position ${tile.x} for row ${tile.y}`, 'GridInit');
      }
    } else {
      logger.warning(`Tile y position out of bounds: y=${tile.y}, max y=${mergedGrid.length - 1}`, 'GridInit');
    }
  });
  return mergedGrid;
};

// New function to load and process the initial grid
const loadAndProcessInitialGrid = async (): Promise<Tile[][]> => {
  console.log('Loading and processing initial grid...');
  const initialGridData = await loadInitialGrid();

  if (!initialGridData || !initialGridData.grid) {
    console.error('Failed to load initial grid data from loadInitialGrid');
    // Fallback to a base empty grid if initial load fails
    return createBaseGrid(INITIAL_ROWS, GRID_COLS);
  }

  console.log('Initial grid data loaded from loadInitialGrid:', initialGridData);
  
  // Image mapping for tile types
  const getImageForTileType = (tileType: string): string => {
    const tileImages: Record<string, string> = {
      'empty': '/images/tiles/empty-tile.png',
      'grass': '/images/tiles/grass-tile.png',
      'forest': '/images/tiles/forest-tile.png',
      'water': '/images/tiles/water-tile.png',
      'mountain': '/images/tiles/mountain-tile.png',
      'desert': '/images/tiles/desert-tile.png',
      'city': '/images/tiles/city-tile.png',
      'town': '/images/tiles/town-tile.png',
      'mystery': '/images/tiles/mystery-tile.png',
      'ice': '/images/tiles/ice-tile.png',
      'portal-entrance': '/images/tiles/portal-entrance-tile.png',
      'portal-exit': '/images/tiles/portal-exit-tile.png',
      'snow': '/images/tiles/ice-tile.png',
      'cave': '/images/tiles/cave-tile.png',
      'dungeon': '/images/tiles/dungeon-tile.png',
      'castle': '/images/tiles/castle-tile.png',
    };
    return tileImages[tileType] || '/images/tiles/empty-tile.png';
  };
  
  // Convert numeric grid to Tile[][]
  const loadedGrid = initialGridData.grid.map((row: number[], y: number) => row.map((cell: number, x: number) => {
    const tileType = numericToTileType[cell] || 'empty';
    return {
      id: `tile-${x}-${y}-${Date.now()}`,
      type: tileType,
      name: `${tileType.charAt(0).toUpperCase() + tileType.slice(1)} Tile`,
      description: `A ${tileType} tile`,
      connections: [],
      rotation: 0 as 0 | 90 | 180 | 270,
      revealed: true,
      isVisited: false,
      x,
      y,
      ariaLabel: `${tileType} tile at position ${x},${y}`,
      image: getImageForTileType(tileType),
      isMainTile: false, // Provide default for properties from ExtendedTileProperties
      isTown: false,
      cityName: undefined, // Make optional
      cityX: undefined,
      cityY: undefined,
      citySize: undefined,
      bigMysteryX: undefined,
      bigMysteryY: undefined,
      tileSize: undefined,
      cost: 0, // Provide default
      quantity: 1, // Provide default
    } as Tile; // Explicitly cast to Tile
  }));
  console.log('Processed initial grid:', loadedGrid);
  return loadedGrid;
};

// Add this near the top of the file, after imports
const isBrowser = typeof window !== 'undefined';

// Add helper to load/save character position from Supabase
async function loadCharacterPosition(supabase: SupabaseClient<Database>, userId: string): Promise<{ x: number; y: number } | null> {
  try {
    const { data, error } = await supabase
      .from('character_positions')
      .select('x, y')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return { x: data.x, y: data.y };
  } catch {
    return null;
  }
}

async function saveCharacterPosition(supabase: SupabaseClient<Database>, userId: string, pos: { x: number; y: number }) {
  try {
    await supabase
      .from('character_positions')
      .upsert({ user_id: userId, x: pos.x, y: pos.y }, { onConflict: 'user_id' });
  } catch (error) {
    logger.error(`Error saving character position: ${error}`, 'CharacterPosition');
  }
}

// Utility to sanitize the grid before rendering
function sanitizeGrid(grid) {
  return Array.isArray(grid)
    ? grid.map((row, y) =>
        Array.isArray(row)
          ? row.map((tile, x) => tile || createEmptyTile(x, y))
          : Array(GRID_COLS).fill(null).map((_, x) => createEmptyTile(x, y))
      )
    : createBaseGrid(INITIAL_ROWS, GRID_COLS);
}

export default function RealmPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { handleUnlock } = useCreatureUnlock()
  const gridRef = useRef<HTMLDivElement>(null)
  const { updateProgress } = useAchievementStore()
  const creatureStore = useCreatureStore()
  const { user, isLoaded: isAuthLoaded } = useUser();
  const userId = user?.id;
  const isGuest = !user;
  const subscriptionRef = useRef<any>(null)

  // State declarations
  const [inventory, setInventory] = useLocalStorage<Partial<Record<TileType, InventoryItem>>>("tile-inventory", initialTileInventory)
  const [showScrollMessage, setShowScrollMessage] = useState(false)
  // Ensure characterPosition is always a valid object
  const defaultCharacterPosition = { x: 2, y: 0 };
  const [characterPosition, setCharacterPosition] = useState<{ x: number; y: number }>(defaultCharacterPosition);
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedTile, setSelectedTile] = useState<SelectedInventoryItem | null>(null)
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [gridRotation, setGridRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<MysteryEvent | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ type: string; name: string; description: string } | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [movementMode, setMovementMode] = useState(true)
  const [hoveredTile, setHoveredTile] = useState<{ row: number; col: number } | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [showInventory, setShowInventory] = useState(false)
  const [minimapSwitch, setMinimapSwitch] = useState(false)
  const [minimapEntities, setMinimapEntities] = useState<MinimapEntity[]>([])
  const [minimapZoom, setMinimapZoom] = useState(1)
  const [minimapRotationMode, setMinimapRotationMode] = useState<MinimapRotationMode>('static')
  const [questCompletedCount, setQuestCompletedCount] = useState(0)
  const [showLogs, setShowLogs] = useState(false)
  const [tileCounts, setTileCounts] = useLocalStorage<TileCounts>("tile-counts", {
    forestPlaced: 0,
    forestDestroyed: 0,
    waterPlaced: 0,
    mountainPlaced: 0,
    mountainDestroyed: 0,
    icePlaced: 0,
    waterDestroyed: 0
  })
  // Add save status state with enhanced feedback
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  // Add state for portal modal and portal teleportation
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [portalSource, setPortalSource] = useState<{ x: number; y: number; type: TileType } | null>(null);
  // Add state to track if the horse is present on the map
  const [isHorsePresent, setIsHorsePresent] = useState(true);
  // Add state for eagle and penguin
  const [eaglePosition, setEaglePosition] = useState<{ x: number; y: number }>({ x: 10, y: 6 });
  const [penguinPosition, setPenguinPosition] = useState<{ x: number; y: number } | null>(null);
  const [isPenguinPresent, setIsPenguinPresent] = useState(false);
  // Add state for animal positions
  const [horsePosition, setHorsePosition] = useState<{ x: number; y: number }>({ x: 10, y: 3 });
  const [sheepPosition, setSheepPosition] = useState<{ x: number; y: number }>({ x: 2, y: 4 });

  const { supabase, isLoading: isSupabaseLoading, error: supabaseError } = useSupabaseClientWithToken();

  // Track last modal-triggered position
  const [lastModalPosition, setLastModalPosition] = useState<{x: number, y: number} | null>(null);

  // Initialize grid
  const initializeGrid = async () => {
    let defaultGrid: Tile[][] = [];
    try {
      defaultGrid = await loadAndProcessInitialGrid();
      if (!supabase) {
        setGrid(defaultGrid);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }
      const { data: initialGridData, error: fetchError } = await supabase
        .from('realm_grids')
        .select('grid')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      if (fetchError || !initialGridData?.grid) {
        logger.warning(`Supabase fetch error: ${fetchError?.message || 'No grid found'}, using default grid`, 'GridInit');
        setGrid(defaultGrid);
      } else {
        const fetchedGrid = initialGridData.grid;
        logger.info(`Fetched grid from Supabase: ${fetchedGrid ? 'found' : 'not found'}`, 'GridInit');
        if (fetchedGrid && Array.isArray(fetchedGrid) && fetchedGrid.length > 0) {
          const processedGrid = processLoadedGrid(fetchedGrid);
          setGrid(processedGrid);
          logger.info('Grid loaded from Supabase', 'GridInit');
        } else {
          setGrid(defaultGrid);
          logger.info('Loaded default grid as fallback', 'GridInit');
        }
      }
    } catch (err) {
      logger.error(`Error loading grid: ${err}`, 'GridInit');
      setGrid(defaultGrid);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  // Effect to initialize grid on mount or session/supabase change
  useEffect(() => {
    if (!isAuthLoaded || !supabase) return;
    setIsLoading(true);
    initializeGrid();
  }, [userId, isAuthLoaded, supabase]);

  // Effect to save grid to database for authenticated users or local storage for anonymous users
  useEffect(() => {
    if (!isInitialized) return

    const skipAuthCookie = typeof document !== 'undefined' ? document.cookie.split(';').find(c => c.trim().startsWith('skip-auth=')) : null
    const isSkippingAuth = skipAuthCookie ? skipAuthCookie.split('=')[1] === 'true' : false

    const saveGrid = async () => {
      // Add a stricter check for authenticated Supabase save
      if (!isSkippingAuth && (!userId || isGuest)) {
        logger.info('Skipping Supabase save: No authenticated user session', 'GridSave')
        return // Exit if not skipping auth but no session is available
      }

    if (isSkippingAuth) {
        // Save to local storage for anonymous users
        logger.info('Saving grid to local storage...', 'GridSave')
        localStorage.setItem('grid', JSON.stringify(grid))
      } else { // This block is for authenticated users
        setIsSyncing(true)
        setSyncError(null)
        try {
          logger.info('Attempting to save grid to Supabase...', 'GridSave')
          // Convert grid to numeric format for storage
           const numericGrid = grid.map(row =>
             row.map(tile => {
              // Add null/undefined check for tile
              if (!tile) return 0;
              switch (tile.type) {
                case 'empty': return 0;
                case 'mountain': return 1;
                case 'grass': return 2;
                case 'forest': return 3;
                case 'water': return 4;
                case 'city': return 5;
                case 'town': return 6;
                case 'mystery': return 7;
                case 'portal-entrance': return 8;
                case 'portal-exit': return 9;
                case 'snow': return 10;
                case 'cave': return 11;
                case 'dungeon': return 12;
                case 'castle': return 13;
                case 'ice': return 14;
                case 'lava': return 15;
                default: return 0;
              }
            })
          );
          logger.info('Converted grid to numeric format for Supabase', 'GridSave');

          // Get all grids for the user and sort by updated_at
          if (!supabase) throw new Error('Supabase client not initialized');
          const { data: existingGrids, error: fetchError } = await supabase
            .from('realm_grids')
            .select('id, updated_at') // Select only id and updated_at
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

          if (fetchError) {
            throw new Error(`Error checking existing grids: ${fetchError.message}`);
          }

          if (existingGrids && existingGrids.length > 0) {
            const mostRecentGrid = existingGrids[0];
            if (!mostRecentGrid?.id) {
              logger.warning('Most recent grid found but has no ID', 'GridSave');
              return;
            }
            
            logger.info(`Updating most recent grid with ID ${mostRecentGrid.id}...`, 'GridSave');
            const { error: updateError } = await supabase
              .from('realm_grids')
              .update({ 
                grid: numericGrid as number[][],
                updated_at: new Date().toISOString() 
              })
              .eq('id', mostRecentGrid.id);

            if (updateError) {
              throw new Error(`Error updating grid: ${updateError.message}`);
            }
            logger.info('Grid data updated in Supabase', 'GridSave');

            // Delete any older grids to prevent accumulation
            if (existingGrids.length > 1) {
              const olderGridIds = existingGrids.slice(1).map((grid: any) => grid.id);
              if (!supabase) throw new Error('Supabase client not initialized');
              const { error: deleteError } = await supabase
                .from('realm_grids')
                .delete()
                .in('id', olderGridIds);

              if (deleteError) {
                logger.warning(`Warning: Could not clean up old grids: ${deleteError.message}`, 'GridSave');
              } else {
                logger.info(`Cleaned up ${olderGridIds.length} old grid(s)`, 'GridSave');
              }
            }
          } else {
            // No existing grids, create a new one
            logger.info('No existing grids found, creating new grid...', 'GridSave');
            if (!supabase) throw new Error('Supabase client not initialized');
            const { error: insertError } = await supabase
              .from('realm_grids')
              .insert([{ 
                user_id: userId,
                grid: numericGrid as number[][], // Use number[][]
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }]);

            if (insertError) {
              throw new Error(`Error inserting grid: ${insertError.message}`);
            }
            logger.info('New grid created in Supabase', 'GridSave');
          }

          // Save to localStorage as backup
          logger.info('Saving grid to local storage as backup...', 'GridSave');
          localStorage.setItem('grid', JSON.stringify(grid));
          logger.info('Backup saved to local storage', 'GridSave');
        } catch (error) {
          logger.error(`Error saving grid: ${error instanceof Error ? error.message : 'Unknown error'}`, 'GridSave');
          setSyncError(error instanceof Error ? error.message : 'Failed to save grid');
        } finally {
          setIsSyncing(false)
        }
      }
    }

    // Save grid on initial load (after isInitialized is true) and at intervals
    if (isInitialized) {
        const saveTimeout = setTimeout(saveGrid, AUTOSAVE_INTERVAL);
        return () => clearTimeout(saveTimeout);
    }

    // Cleanup function for when isInitialized is false or component unmounts before initialization
    return () => {};

  }, [grid, isInitialized, userId, isGuest])


  // Effect for real-time subscription
   useEffect(() => {
       // Ensure supabase is defined before attempting to subscribe
       if (userId && !isGuest) { // Add supabase check here
           console.log('Setting up Supabase real-time subscription for tile placements.');
           // This subscription should ideally listen to changes in the tilePlacement table.
           // For now, keeping it minimal as the primary fix is loading.
           // A proper real-time update for tile placements would require a specific Supabase Realtime setup for the tilePlacement table.
           let subscription: any = null;
           const supabase: any = null;
           (async () => {
             if (!supabase) return;
             subscription = supabase
               .channel('tile_placements_channel') // Use a unique channel name for tile placements
               .on(
                 'postgres_changes',
                 {
                   event: '*' ,
                   schema: 'public',
                   table: 'tile_placement', // Listen to changes in the tile_placement table
                   // Note: Filtering by userId here requires a userId column in the tile_placement table.
                   // Ensure your database schema includes this column.
                   filter: `userId=eq.${userId}` // Assuming tilePlacement table has a userId column
                 },
                 (payload: any) => {
                   console.log('Real-time tile placement change received:', payload);
                   // Handle real-time updates here: e.g., update local grid state based on payload
                   // This is a placeholder; actual implementation would depend on payload structure.
                   toast({
                      title: "Real-time Update",
                      description: "Tile placement change detected (real-time update not fully implemented).".concat(payload.eventType || ''),
                      variant: "default"
                   });

                   // Optionally, re-fetch and update the grid for simplicity for now:
                   // initializeGrid(); // This might cause rapid re-renders; consider a more targeted update
                 }
               )
               .subscribe();
           })();
           return () => {
               console.log('Unsubscribing from Supabase tile placement subscription.');
               // Check if subscription is not null before removing
               if (subscription && supabase) {
                 // removeChannel is not async, but if it returns a promise, use .then()
                 const result = supabase.removeChannel(subscription);
                 if (result && typeof result.then === 'function') {
                   result.then(() => {}).catch(() => {});
                 }
               }
           };
       } else {
            // Cleanup function if not authenticated or supabase is undefined
            if (subscriptionRef.current) {
           subscriptionRef.current.unsubscribe();
           subscriptionRef.current = null;
       }
            console.log('No active Supabase grid subscription.');
            return () => {}; // Return empty cleanup function
       }
   }, [userId, isGuest, toast]); // Depend on session, supabase, and toast

  // Other useEffects remain unchanged...

  // Ensure this function correctly updates the local state, which triggers the save effect
  const handleGridUpdate = useCallback(async (newGrid: Tile[][]) => {
    if (!newGrid || !Array.isArray(newGrid)) {
      logger.error('Invalid grid data received', 'GridUpdate');
      return;
    }

    const updatedGrid = newGrid.map((row: Tile[], y: number) => {
      if (!Array.isArray(row)) {
        logger.error(`Invalid row at index ${y}`, 'GridUpdate');
        // Return an array of empty tiles for invalid rows
        return Array(GRID_COLS).fill(null).map((_, x) => createEmptyTile(x, y));
      }
      return row.map((tile: Tile, x: number) => {
        // Ensure tile is not null or undefined
        if (!tile) {
          return createEmptyTile(x, y);
        }
        // Explicitly cast to Tile if needed, ensuring all properties are present or optional
        return {
          ...tile,
          x: tile.x ?? x, // Use existing position or default
          y: tile.y ?? y, // Use existing position or default
          ariaLabel: tile.ariaLabel || `${tile.type} tile at position ${x},${y}`,
          connections: tile.connections || [],
          isMainTile: tile.isMainTile ?? false,
          isTown: tile.isTown ?? false,
          cityName: tile.cityName, // Keep as is, it's optional
          cityX: tile.cityX, // Keep as is, it's optional
          cityY: tile.cityY, // Keep as is, it's optional
          citySize: tile.citySize, // Keep as is, it's optional
          bigMysteryX: tile.bigMysteryX, // Keep as is, it's optional
          bigMysteryY: tile.bigMysteryY, // Keep as is, it's optional
          tileSize: tile.tileSize, // Keep as is, it's optional
          cost: tile.cost ?? 0, // Provide default
          quantity: tile.quantity ?? 1, // Provide default
        } as Tile; // Cast to Tile
      });
    });

    setGrid(updatedGrid);
  }, [setGrid]);

  // Handle fullscreen toggle
  const handleFullscreenToggle = (checked: boolean) => {
    setIsFullscreen(checked)
    const url = new URL(window.location.href)
    if (checked) {
      url.searchParams.set('fullscreen', 'true')
          } else {
      url.searchParams.delete('fullscreen')
    }
    window.history.replaceState({}, '', url.toString())
  }

  // Handle tile deletion
  const handleTileDelete = (x: number, y: number) => {
    // Use optional chaining and nullish coalescing to safely access the tile
    const tileToDelete = grid?.[y]?.[x];
    if (!tileToDelete || tileToDelete.type === 'empty') { // Add check for empty tile
       logger.warning(`Attempted to delete non-existent or empty tile at ${x},${y}`, 'TileDelete');
      return;
    }

    // Create an empty tile with proper accessibility attributes
    const emptyTile: Tile = {
      id: `empty-${x}-${y}`,
      type: "empty" as TileType,
      name: "Empty Tile",
      description: "An empty space where a new tile can be placed",
      connections: [],
      rotation: 0,
      revealed: true,
      isVisited: false,
      x,
      y,
      ariaLabel: `Empty tile at position ${x}, ${y}`,
      image: "/images/tiles/empty-tile.png",
      isMainTile: false, // Provide default
      isTown: false, // Provide default
      cityName: undefined, // Keep optional
      cityX: undefined,
      cityY: undefined,
      citySize: undefined,
      bigMysteryX: undefined,
      bigMysteryY: undefined,
      tileSize: undefined,
      cost: 0, // Provide default
      quantity: 1, // Provide default
    };

    // Update the grid with the empty tile
    const newGrid = [...grid];
    // Use optional chaining and check if the row exists before updating
    if (newGrid?.[y]) {
      newGrid[y][x] = emptyTile;
      setGrid(newGrid);
    } else {
       logger.warning(`Cannot place empty tile at invalid grid position y=${y}, x=${x}`, 'TileDelete');
    }

    // Update inventory and tile counts
    const updatedInventory = { ...inventory };
    const tileType = tileToDelete.type;
    
    // Ensure the tile type exists in inventory or create it if not, then update quantity
    if (!updatedInventory[tileType]) {
       // Create a new InventoryItem based on the deleted tile, providing default values
      updatedInventory[tileType] = {
        id: `${tileType}-1`,
        name: tileToDelete.name || tileType,
        description: tileToDelete.description || `A ${tileType} tile`,
        image: tileToDelete.image || `/images/tiles/${tileType}-tile.png`,
        cost: tileToDelete.cost ?? 0, // Use tileToDelete cost or default
        type: tileType,
        quantity: 1, // Start with quantity 1
        revealed: tileToDelete.revealed ?? true,
        isVisited: tileToDelete.isVisited ?? false,
        rotation: tileToDelete.rotation ?? 0,
        ariaLabel: tileToDelete.ariaLabel || `${tileType} tile in inventory`,
        connections: tileToDelete.connections || [],
        x: tileToDelete.x,
        y: tileToDelete.y,
        isMainTile: tileToDelete.isMainTile ?? false, // Provide default
        isTown: tileToDelete.isTown ?? false, // Provide default
        cityName: tileToDelete.cityName, // Keep optional
        cityX: tileToDelete.cityX,
        cityY: tileToDelete.cityY,
        citySize: tileToDelete.citySize,
        bigMysteryX: tileToDelete.bigMysteryX,
        bigMysteryY: tileToDelete.bigMysteryY,
        tileSize: tileToDelete.tileSize,
      };
    } else {
      // Check if updatedInventory[tileType] is defined before accessing quantity
      const item = updatedInventory[tileType];
      if (item) {
         item.quantity += 1;
      } else {
        // This case should ideally not happen if updatedInventory[tileType] was checked above
        // But as a fallback, create a new item if somehow undefined
        updatedInventory[tileType] = {
          id: `${tileType}-new-${Date.now()}`, // Generate a unique ID
          type: tileType,
          name: tileToDelete.name || tileType,
          description: tileToDelete.description || `A ${tileType} tile`,
          image: tileToDelete.image || `/images/tiles/${tileType}-tile.png`,
          cost: tileToDelete.cost ?? 0,
          quantity: 1,
          revealed: tileToDelete.revealed ?? true,
          isVisited: tileToDelete.isVisited ?? false,
          rotation: tileToDelete.rotation ?? 0,
          ariaLabel: tileToDelete.ariaLabel || `${tileType} tile in inventory`,
          connections: tileToDelete.connections || [],
          x: tileToDelete.x,
          y: tileToDelete.y,
          isMainTile: tileToDelete.isMainTile ?? false,
          isTown: tileToDelete.isTown ?? false,
          cityName: tileToDelete.cityName,
          cityX: tileToDelete.cityX,
          cityY: tileToDelete.cityY,
          citySize: tileToDelete.citySize,
          bigMysteryX: tileToDelete.bigMysteryX,
          bigMysteryY: tileToDelete.bigMysteryY,
          tileSize: tileToDelete.tileSize,
        };
         logger.warning(`Inventory item for type ${tileType} was undefined, created new item`, 'TileDelete');
      }
    }
    
    setInventory(updatedInventory);

    // Update tile counts for achievements and creature unlocks
    const updatedTileCounts = { ...tileCounts };
    
    // Forest tile destruction (fire creatures)
    if (tileType === "forest") {
      updatedTileCounts.forestDestroyed = (updatedTileCounts.forestDestroyed ?? 0) + 1; // Use nullish coalescing
      updateProgress('destroy_10_forest_tiles', updatedTileCounts.forestDestroyed);
      if (updatedTileCounts.forestDestroyed >= 1) {
        useCreatureStore.getState().discoverCreature('001'); // Flamio
      }
      if (updatedTileCounts.forestDestroyed >= 5) {
        useCreatureStore.getState().discoverCreature('002'); // Embera
      }
      if (updatedTileCounts.forestDestroyed >= 10) {
        useCreatureStore.getState().discoverCreature('003'); // Vulcana
        toast({
          title: 'Achievement Unlocked!',
          description: "Forest Destroyer: You've destroyed 10 forest tiles!",
          duration: 5000
        });
      }
    } else if (tileType === "mountain") {
      updatedTileCounts.mountainDestroyed = (updatedTileCounts.mountainDestroyed ?? 0) + 1; // Use nullish coalescing
      updateProgress('destroy_5_mountain_tiles', updatedTileCounts.mountainDestroyed);
      if (updatedTileCounts.mountainDestroyed >= 1) {
        useCreatureStore.getState().discoverCreature('010'); // Rockie
      }
      if (updatedTileCounts.mountainDestroyed >= 5) {
        useCreatureStore.getState().discoverCreature('011'); // Buldour
      }
      if (updatedTileCounts.mountainDestroyed >= 10) {
        useCreatureStore.getState().discoverCreature('012'); // Montano
        toast({
          title: 'Achievement Unlocked!',
          description: "Mountain Breaker: You've destroyed 5 mountain tiles!",
          duration: 5000
        });
      }
    } else if (tileType === "water") {
      const newWaterDestroyed = (tileCounts.waterDestroyed ?? 0) + 1; // Use nullish coalescing
      if (newWaterDestroyed >= 1) useCreatureStore.getState().discoverCreature('016'); // Sparky
      if (newWaterDestroyed >= 5) useCreatureStore.getState().discoverCreature('017'); // Boulty
      if (newWaterDestroyed >= 10) useCreatureStore.getState().discoverCreature('018'); // Voulty
      updateTileCounts('water');
    }
    
    setTileCounts(updatedTileCounts);

    // Show toast notification
    toast({
      title: 'Tile Removed',
      description: `The ${tileToDelete.name} has been removed and added to your inventory.`,
      duration: 3000
    });
  };

  // Update handleAchievementUnlock to be async and handle state properly
  const handleAchievementUnlock = useCallback(async (creatureId: string, requirement: string | number) => {
    // No need to check for supabase client existence, just call updateProgress
    updateProgress(creatureId, Number(requirement)); // Convert to number
  }, [updateProgress]);

  // Add useEffect for first realm visit achievement
  useEffect(() => {
    const checkFirstVisit = async () => {
      const hasVisited = localStorage.getItem('has-visited-realm');
      if (!hasVisited) {
        await useCreatureStore.getState().discoverCreature('000');
        // Ensure handleAchievementUnlock is called with appropriate arguments
        await handleAchievementUnlock('000', 'First time exploring the realm'); // Call the function
        localStorage.setItem('has-visited-realm', 'true');
        toast({
          title: '🧪 Achievement Unlocked!',
          description: "First time exploring the realm - Discovered a poisonous creature!"
        });
      }
    };
    checkFirstVisit();
  }, [handleAchievementUnlock, toast]); // Add handleAchievementUnlock and toast to dependency array

  // Enhanced save function with detailed error handling
  const saveGridImmediately = async (currentGrid: number[][], retryAttempt = 0) => {
    console.log('=== IMMEDIATE SAVE STARTED ===', { retryAttempt })
    
    try {
      setSaveStatus('saving')
      setSaveError(null)
      setRetryCount(retryAttempt)
      
      if (!userId || isGuest) {
        console.log('No user or session, saving to localStorage')
        localStorage.setItem('realm-grid-data', JSON.stringify(currentGrid))
        setSaveStatus('saved')
        setLastSaveTime(new Date())
        setRetryCount(0)
        toast({
          title: "Grid saved locally",
          description: "No authenticated session found"
        })
        return
      }

      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase
        .from('realm_grids')
        .upsert({
          id: userId,
          grid: currentGrid,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (error) {
        console.error('Save error details:', error, JSON.stringify(error, null, 2));
        if (error && error.message) console.error('Error message:', error.message);
        throw error
      }

      console.log('=== SAVE SUCCESSFUL ===', { data, timestamp: new Date() })
      setSaveStatus('saved')
      setLastSaveTime(new Date())
      setRetryCount(0)
      
      // Auto-hide success status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)

    } catch (error: any) {
      console.error('=== SAVE FAILED ===', error)
      
      const errorMessage = error?.message || 'Unknown error'
      setSaveError(errorMessage)
      
      // Check for authentication errors
      const isAuthError = errorMessage.includes('JWT') || 
                         errorMessage.includes('auth') ||
                         error?.status === 401 ||
                         error?.status === 403

      if (isAuthError) {
        console.log('Authentication error detected, falling back to localStorage')
        localStorage.setItem('realm-grid-data', JSON.stringify(currentGrid))
        setSaveStatus('saved')
        setLastSaveTime(new Date())
        setRetryCount(0)
        toast({
          title: "Grid saved locally",
          description: "Authentication issue detected"
        })
        return
      }

      // Retry logic for other errors
      if (retryAttempt < 3) {
        const delay = Math.pow(2, retryAttempt) * 1000 // Exponential backoff
        console.log(`Retrying save in ${delay}ms...`)
        
        setTimeout(() => {
          saveGridImmediately(currentGrid, retryAttempt + 1)
        }, delay)
      } else {
        // Final fallback to localStorage after all retries
        console.log('All retries failed, saving to localStorage as final fallback')
        localStorage.setItem('realm-grid-data', JSON.stringify(currentGrid))
        setSaveStatus('error')
        setRetryCount(3)
        toast({
          title: "Save Failed",
          description: `Save failed after ${retryAttempt + 1} attempts. Saved locally instead.`,
          variant: "destructive"
        })
        
        // Clear error status after 5 seconds
        setTimeout(() => {
          setSaveStatus('idle')
          setRetryCount(0)
        }, 5000)
      }
    }
  }

  // Update tile counts for placed tiles and handle achievements/creatures
  const updateTileCounts = (tileType: TileType) => {
    setTileCounts(prevCounts => {
      const updatedCounts = { ...prevCounts };

      // Forest tile placement achievements and creatures
      if (tileType === 'forest') {
        updatedCounts.forestPlaced = (updatedCounts.forestPlaced ?? 0) + 1;
        updateProgress('place_10_forest_tiles', updatedCounts.forestPlaced);
        if (updatedCounts.forestPlaced >= 1) {
          useCreatureStore.getState().discoverCreature('007'); // Leaf
        }
        if (updatedCounts.forestPlaced >= 5) {
          useCreatureStore.getState().discoverCreature('008'); // Oaky
        }
        if (updatedCounts.forestPlaced >= 10) {
          useCreatureStore.getState().discoverCreature('009'); // Seqoio
          toast({
            title: 'Achievement Unlocked!',
            description: "Forest Planter: You've placed 10 forest tiles!",
            duration: 5000
          });
        }
      }

      // Water tile placement achievements and creatures
      if (tileType === 'water') {
        updatedCounts.waterPlaced = (updatedCounts.waterPlaced ?? 0) + 1;
        updateProgress('place_10_water_tiles', updatedCounts.waterPlaced);
        if (updatedCounts.waterPlaced >= 1) useCreatureStore.getState().discoverCreature('004'); // Dolphio
        if (updatedCounts.waterPlaced >= 5) useCreatureStore.getState().discoverCreature('005'); // Divero
        if (updatedCounts.waterPlaced >= 10) {
          useCreatureStore.getState().discoverCreature('006'); // Flippur
          toast({
            title: 'Achievement Unlocked!',
            description: "Water Shaper: You've placed 10 water tiles!",
            duration: 5000
          });
        }
      }

      // Mountain tile placement achievements and creatures (add more if needed)
      if (tileType === 'mountain') {
        updatedCounts.mountainPlaced = (updatedCounts.mountainPlaced ?? 0) + 1;
        updateProgress('place_10_mountain_tiles', updatedCounts.mountainPlaced);
        // Add similar unlocks for mountain placement if needed
      }

      // Add checks for other placed tile types if needed

      return updatedCounts;
    });
  };

  // Add isPathClear function
  const isPathClear = (startX: number, startY: number, endX: number, endY: number): boolean => {
    // Simple path checking - can be expanded for more complex pathfinding
    const dx = Math.abs(endX - startX);
    const dy = Math.abs(endY - startY);
    
    // If moving diagonally, check both adjacent tiles
    if (dx === 1 && dy === 1) {
      const tile1 = grid[startY]?.[endX];
      const tile2 = grid[endY]?.[startX];
      return !tile1 || !tile2 || 
        (!['mountain', 'water', 'lava', 'volcano'].includes(tile1.type) && 
         !['mountain', 'water', 'lava', 'volcano'].includes(tile2.type));
    }
    
    // For straight movement, just check the target tile
    return true;
  };

  const handleCharacterMove = useCallback((newX: number, newY: number) => {
    // Validate coordinates
    if (newX < 0 || newY < 0 || newY >= grid.length || !grid[0] || newX >= grid[0].length) {
      toast({
        title: "Cannot Move",
        description: "You cannot move outside the map boundaries!",
        variant: "destructive"
      });
      return;
    }

    const targetTile = grid[newY]?.[newX];
    if (!targetTile || targetTile.type === 'empty') {
      toast({
        title: "Cannot Move",
        description: "You cannot move onto an empty tile!",
        variant: "destructive"
      });
      return;
    }

    // Check if the tile is a valid movement target
    if (['mountain', 'water', 'lava', 'volcano'].includes(targetTile.type)) {
      toast({
        title: "Cannot Move",
        description: `You cannot move onto ${targetTile.type} tiles!`,
        variant: "destructive"
      });
      return;
    }

    // Check if path is clear
    if (!isPathClear(characterPosition.x, characterPosition.y, newX, newY)) {
      toast({
        title: "Cannot Move",
        description: "Path is blocked!",
        variant: "destructive"
      });
      return;
    }

    // Update character position
    setCharacterPosition({ x: newX, y: newY });

    // Only trigger modal if position is new
    if ((targetTile.type === 'city' || targetTile.type === 'town') && (!lastModalPosition || lastModalPosition.x !== newX || lastModalPosition.y !== newY)) {
      const locationKey = (targetTile as { locationId?: string }).locationId || targetTile.type;
      const locationInfo = (locationData as Record<string, { name: string; description: string }>)[locationKey];
      if (locationInfo?.name) {
        setCurrentLocation({
          type: targetTile.type,
          name: locationInfo.name,
          description: locationInfo.description || ''
        });
        setShowLocationModal(true);
        setLastModalPosition({x: newX, y: newY});
      }
    } else if (targetTile.type !== 'city' && targetTile.type !== 'town') {
      setLastModalPosition(null);
    }

    // Handle special tile interactions
    if (targetTile.type === 'portal-entrance' || targetTile.type === 'portal-exit') {
      setPortalSource({ x: newX, y: newY, type: targetTile.type });
      setShowPortalModal(true);
    } else if (targetTile.type === 'dungeon') {
      localStorage.setItem('current-dungeon', JSON.stringify({ position: { x: newX, y: newY }, type: 'dungeon' }));
      router.push('/dungeon');
    } else if (targetTile.type === 'mystery' && !targetTile.isVisited) {
      const mysteryEvent = generateMysteryEvent();
      setCurrentEvent(mysteryEvent);
      const newGrid = [...grid];
      if (newGrid[newY] && Array.isArray(newGrid[newY])) {
        const updatedMysteryTile: Tile = {
          ...targetTile,
          isVisited: true,
          cityName: targetTile.cityName,
          cityX: targetTile.cityX,
          cityY: targetTile.cityY,
          citySize: targetTile.citySize,
          bigMysteryX: targetTile.bigMysteryX,
          bigMysteryY: targetTile.bigMysteryY,
          tileSize: targetTile.tileSize,
        };
        newGrid[newY][newX] = updatedMysteryTile;
        setGrid(newGrid);
      }
    }

    // Save position to Supabase and localStorage
    if (supabase && userId) {
      saveCharacterPosition(supabase, userId, { x: newX, y: newY });
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('character-position', JSON.stringify({ x: newX, y: newY }));
    }
  }, [setCharacterPosition, grid, locationData, toast, supabase, userId, setCurrentLocation, setShowLocationModal, setPortalSource, setShowPortalModal, router, setCurrentEvent, setGrid, characterPosition, lastModalPosition]);

  // Update keyboard navigation to use handleCharacterMove
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { x, y } = characterPosition;
      let newX = x;
      let newY = y;
      switch (e.key) {
        case 'ArrowUp':
          if (y > 0) newY = y - 1;
          break;
        case 'ArrowDown':
          if (y < grid.length - 1) newY = y + 1;
          break;
        case 'ArrowLeft':
          if (x > 0) newX = x - 1;
          break;
        case 'ArrowRight':
          if (x < GRID_COLS - 1) newX = x + 1;
          break;
        default:
          return;
      }
      handleCharacterMove(newX, newY);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [characterPosition, grid, handleCharacterMove]);

  // Handle inventory updates - used by TileInventory component
  const handleInventoryUpdate = useCallback((updatedTiles: InventoryItem[]) => { // Explicitly type as InventoryItem[] and wrap in useCallback
     // Ensure updatedTiles is an array of valid InventoryItem objects
    if (!Array.isArray(updatedTiles)) {
        logger.error('Invalid data received for inventory update (handleInventoryUpdate)', 'InventoryUpdate');
        return;
    }

    const validatedTiles = updatedTiles.map(item => {
       // Add validation and provide default values for required properties
        return {
            id: item.id || `${item.type}-auto`,
            type: item.type,
            name: item.name || item.type,
            description: item.description || `A ${item.type} item`,
            connections: item.connections || [],
            rotation: item.rotation || 0,
            revealed: item.revealed ?? true,
            isVisited: item.isVisited ?? false,
            ariaLabel: item.ariaLabel || `${item.name || item.type} in inventory`,
            image: item.image || `/images/tiles/${item.type}-tile.png`,
            cost: item.cost ?? 0, // Provide default for cost
            quantity: item.quantity ?? 0, // Provide default for quantity
            x: item.x ?? 0, // Provide default for x and y if missing
            y: item.y ?? 0,
             // Include optional properties with default undefined if missing
            isMainTile: item.isMainTile ?? false, // Provide default
            isTown: item.isTown ?? false, // Provide default
            cityName: item.cityName,
            cityX: item.cityX,
            cityY: item.cityY,
            citySize: item.citySize,
            bigMysteryX: item.bigMysteryX,
            bigMysteryY: item.bigMysteryY,
            tileSize: item.tileSize,
        } as InventoryItem; // Explicitly cast to InventoryItem
    });


    setInventory(prevInventory => {
      const newInventory = { ...prevInventory };
      validatedTiles.forEach(tile => {
        // Ensure tile.type is a valid key for newInventory
        if (tile.type in newInventory) {
           newInventory[tile.type] = tile;
        } else {
           logger.warning(`Attempted to update inventory for unknown tile type: ${tile.type}`, 'InventoryUpdate');
      }
    });
      return newInventory;
    });
  }, [setInventory]);

  // Add the handleVisitLocation function
  const handleVisitLocation = useCallback(() => {
    if (!currentLocation || !router) return;

    const locationName = currentLocation.name;
    const locationType = currentLocation.type;
    const locationSlug = locationName.toLowerCase().replace(/\s+/g, '-');
    
    if (locationType === 'city' || locationType === 'castle') {
      router.push(`/city/${locationSlug}`);
    } else if (locationType === 'town') {
      router.push(`/town/${locationSlug}`);
    } else {
      router.push(`/locations/${locationSlug}`);
    }
    
    setShowLocationModal(false);
  }, [currentLocation, router, setShowLocationModal]);

  // Fix the image rendering for empty tiles
  const getTileImage = (tile: Tile | undefined) => {
    if (!tile || tile.type === 'empty') {
      return '/images/tiles/empty-tile.png';
    }
    const imageMap: Record<string, string> = {
      empty: '/images/tiles/empty-tile.png',
      grass: '/images/tiles/grass-tile.png',
      water: '/images/tiles/water-tile.png',
      mountain: '/images/tiles/mountain-tile.png',
      forest: '/images/tiles/forest-tile.png',
      desert: '/images/tiles/desert-tile.png',
      ice: '/images/tiles/ice-tile.png',
      mystery: '/images/tiles/mystery-tile.png',
      city: '/images/tiles/city-tile.png',
      town: '/images/tiles/town-tile.png',
      'portal-entrance': '/images/tiles/portal-entrance-tile.png',
      'portal-exit': '/images/tiles/portal-exit-tile.png',
      snow: '/images/tiles/ice-tile.png',
      cave: '/images/tiles/cave-tile.png',
      dungeon: '/images/tiles/dungeon-tile.png',
      castle: '/images/tiles/castle-tile.png',
      lava: '/images/tiles/lava-tile.png',
      volcano: '/images/tiles/volcano-tile.png',
      sheep: '/images/Animals/sheep.png',
    };
    return imageMap[tile.type] || '/images/tiles/empty-tile.png';
  };

  const getTileName = (tile: Tile | undefined) => {
    if (!tile || tile.type === 'empty') {
      return 'Empty Tile';
    }
    // Use optional chaining when accessing inventory properties
    return inventory[tile.type]?.name || 'Unknown Tile';
  };

  // Show scroll message
  useEffect(() => {
    if (showScrollMessage) {
      toast({
        title: "Scroll to explore more!",
        description: "Keep scrolling down to reveal more of the map."
      })
    }
  }, [showScrollMessage, toast])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'b' && !event.repeat && !currentEvent) {
        setMovementMode(false)
      } else if (event.key === 'm' && !event.repeat && !currentEvent) {
        setMovementMode(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentEvent])

  // Add the full reset handler
  const handleReset = async () => {
    setIsLoading(true); // Indicate loading during reset
    try {
      console.log('Resetting grid, attempting to load initial grid...');
      // Use the new function to load and process the initial grid
      const loadedGrid = await loadAndProcessInitialGrid();
      setGrid(loadedGrid);
      console.log('Grid reset to initial grid:', loadedGrid);
      toast({
        title: "Reset Complete",
        description: "Map has been reset to its initial state.",
      });

      // Reset other states
      setCharacterPosition(defaultCharacterPosition);
      setTileCounts({
        forestPlaced: 0,
        forestDestroyed: 0,
        waterPlaced: 0,
        waterDestroyed: 0, // Added missing waterDestroyed reset
        mountainPlaced: 0,
        mountainDestroyed: 0,
        icePlaced: 0
      });
      setInventory(initialTileInventory); // Reset inventory to initial state
      localStorage.removeItem('character-position');
      localStorage.removeItem('tile-counts');
      localStorage.removeItem('tile-inventory');
      localStorage.removeItem('grid'); // Also remove the local storage grid backup

    } catch (error) {
      console.error('Error resetting grid:', error);
      toast({
        title: 'Reset Failed',
        description: 'There was an error resetting the map. Please try again.',
        variant: 'destructive',
      });
      // Ensure grid is set even on error, using the default initial grid
      const loadedGrid = await loadAndProcessInitialGrid();
      setGrid(loadedGrid);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleHoverTile = (x: number, y: number) => {
    setHoveredTile({ row: y, col: x });
  };

  // Correct the handleTileSelection function to use InventoryItem and map to SelectedInventoryItem
const handleTileSelection = (tile: InventoryItem | null) => {
  if (!tile) {
    setSelectedTile(null);
    return;
  }

  // SelectedInventoryItem now extends InventoryItem, so we can directly assign
  const selectedTile: SelectedInventoryItem = {
    ...tile,
    x: -1, // Default position when selected from inventory
    y: -1, // Default position when selected from inventory
    // The optional properties should be handled correctly by the updated types
  };

  setSelectedTile(selectedTile);
};


  // Handle inventory toggle
  const toggleInventory = useCallback(() => {
    setShowInventory((prev: boolean) => {
      const newValue = !prev;
      if (newValue) {
        setMovementMode(false);
      }
      return newValue;
    });
  }, [setShowInventory, setMovementMode]);

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'i' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // Only trigger if the user is not typing in an input field
        if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
          toggleInventory();
        }
      }
      
      // Manual save shortcut (Ctrl+S or Cmd+S)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        console.log('Manual save triggered by keyboard shortcut')
        
        // Convert current grid to numeric format
        const numericGrid = grid.map(row =>
          row.map(tile => {
            if (!tile) return 0;
            switch (tile.type) {
              case 'empty': return 0;
              case 'mountain': return 1;
              case 'grass': return 2;
              case 'forest': return 3;
              case 'water': return 4;
              case 'city': return 5;
              case 'town': return 6;
              case 'mystery': return 7;
              case 'portal-entrance': return 8;
              case 'portal-exit': return 9;
              case 'snow': return 10;
              case 'cave': return 11;
              case 'dungeon': return 12;
              case 'castle': return 13;
              case 'ice': return 14;
              case 'lava': return 15;
              default: return 0;
            }
          })
        );
        
        saveGridImmediately(numericGrid, 0);
        toast({
          title: "Manual Save",
          description: "Grid saved using keyboard shortcut (Ctrl+S)"
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleInventory, grid, saveGridImmediately, toast]);

  // Add these function declarations near the top of the RealmPage component
  const handleGoldUpdate = (amount: number) => {
    // TODO: Implement gold update logic
    console.log('Gold updated by:', amount);
  };

  const handleExperienceUpdate = (amount: number) => {
    // TODO: Implement experience update logic
    console.log('Experience updated by:', amount);
  };

  // Fix the updateInventoryFromTileItems function to handle type mismatches and use InventoryItem
   // This function seems intended to update the local inventory state from a list of items,
   // likely from an event outcome or similar.
  const updateInventoryFromTileItems = useCallback((tileItems: InventoryItem[]) => { // Explicitly type as InventoryItem[] and wrap in useCallback
    const newInventory = { ...inventory };

    tileItems.forEach(item => { // Renamed tile to item for clarity
      if (item && typeof item === 'object' && ('type' in item) && typeof item.type === 'string' && ('quantity' in item) && typeof item.quantity === 'number') {
        const itemType = item.type;

        if (newInventory[itemType]) {
          // Update existing item quantity
          newInventory[itemType] = {
            ...newInventory[itemType],
            quantity: (newInventory[itemType]?.quantity ?? 0) + item.quantity, // Add quantity, handle potential undefined
             // Update other properties if needed, based on which item data is considered primary
             name: item.name || newInventory[itemType].name,
             description: item.description || newInventory[itemType].description,
             cost: item.cost ?? newInventory[itemType].cost ?? 0, // Handle potential undefined and provide default
             image: item.image || newInventory[itemType].image, // Ensure required property is handled
             revealed: item.revealed ?? newInventory[itemType].revealed ?? true, // Ensure required property is handled
             isVisited: item.isVisited ?? newInventory[itemType].isVisited ?? false, // Ensure required property is handled
             rotation: item.rotation ?? newInventory[itemType].rotation ?? 0, // Ensure required property is handled
             ariaLabel: item.ariaLabel || newInventory[itemType].ariaLabel, // Ensure required property is handled
             connections: item.connections || newInventory[itemType].connections || [], // Ensure required property is handled
             x: item.x ?? newInventory[itemType].x ?? 0, // Ensure required property is handled
             y: item.y ?? newInventory[itemType].y ?? 0, // Ensure required property is handled
             isMainTile: item.isMainTile ?? newInventory[itemType].isMainTile ?? false, // Ensure optional property is handled
             isTown: item.isTown ?? newInventory[itemType].isTown ?? false, // Ensure optional property is handled
             cityName: item.cityName ?? newInventory[itemType].cityName, // Ensure optional property is handled
             cityX: item.cityX ?? newInventory[itemType].cityX, // Ensure optional property is handled
             cityY: item.cityY ?? newInventory[itemType].cityY, // Ensure optional property is handled
             citySize: item.citySize ?? newInventory[itemType].citySize, // Ensure optional property is handled
             bigMysteryX: item.bigMysteryX ?? newInventory[itemType].bigMysteryX, // Ensure optional property is handled
             bigMysteryY: item.bigMysteryY ?? newInventory[itemType].bigMysteryY, // Ensure optional property is handled
             tileSize: item.tileSize ?? newInventory[itemType].tileSize, // Ensure optional property is handled
          };
        } else {
          // Add new item to inventory
          newInventory[itemType] = {
             id: item.id || `${itemType}-auto-${Date.now()}`, // Provide a fallback ID
             type: itemType as TileType,
             name: item.name || itemType, // Provide a fallback name
             description: item.description || `A ${itemType} item`, // Provide a fallback description
             connections: item.connections || [], // Provide default if needed
             cost: item.cost ?? 0, // Provide a fallback cost
             quantity: item.quantity,
             image: item.image || `/images/tiles/${itemType}-tile.png`, // Provide a fallback image,
             revealed: item.revealed ?? true, // Provide a fallback revealed state
             isVisited: item.isVisited ?? false, // Provide a fallback isVisited state
             rotation: item.rotation ?? 0 as 0 | 90 | 180 | 270, // Provide a fallback rotation
             ariaLabel: item.ariaLabel || `${item.name || item.type} in inventory`, // Provide a fallback ariaLabel
             x: item.x ?? 0, // Provide default for x and y if missing
             y: item.y ?? 0,
             isMainTile: item.isMainTile ?? false, // Include optional properties and provide default
             isTown: item.isTown ?? false, // Include optional properties and provide default
             cityName: item.cityName, // Include optional properties
             cityX: item.cityX,
             cityY: item.cityY,
             citySize: item.citySize,
             bigMysteryX: item.bigMysteryX,
             bigMysteryY: item.bigMysteryY,
             tileSize: item.tileSize,
          };
        }
      } else {
         logger.warning('Invalid item data received for inventory update (updateInventoryFromTileItems)', 'InventoryUpdate');
      }
    });

    setInventory(newInventory);
    toast({
      title: "Inventory Updated",
      description: "Your tile inventory has been updated.",
      variant: "default"
    });
  }, [inventory, setInventory, toast]);


  // Update the handleEventChoice function
  const handleEventChoice = async (choice: string) => {
    if (!currentEvent) {
      console.warn('No current event to handle');
      return;
    }

    const outcome = currentEvent.outcomes?.[choice];
    if (!outcome || !outcome.message) {
      console.warn(`No valid outcome found for choice: ${choice}`, outcome);
      return;
    }

    // Show outcome message
    toast({
      title: outcome.message,
      description: outcome.message
    });

    // Apply rewards
    const reward = outcome.reward as MysteryEventReward | undefined;
    if (reward && typeof reward === 'object') {
      // Handle gold reward
      if (reward.type === 'gold' && reward.amount !== undefined) {
        const goldAmount = typeof reward.amount === 'number' ? reward.amount : parseInt(String(reward.amount));
        if (!isNaN(goldAmount)) {
          handleGoldUpdate(goldAmount);
          toast({
            title: "Gold Gained!",
            description: `You gained ${goldAmount} gold pieces.`,
            duration: 3000
          });
        } else {
          console.warn('Invalid gold reward amount:', reward.amount);
        }
      }

      // Handle experience reward
      if (reward.type === 'experience' && reward.amount !== undefined) {
        const expAmount = typeof reward.amount === 'number' ? reward.amount : parseInt(String(reward.amount));
        if (!isNaN(expAmount)) {
          handleExperienceUpdate(expAmount);
          toast({
            title: "Experience Gained!",
            description: `You gained ${expAmount} experience points!`,
            duration: 3000
          });
        } else {
          console.warn('Invalid experience reward amount:', reward.amount);
        }
      }

      // Handle item rewards
      if (reward.type === 'item' && reward.item && Array.isArray(reward.item)) {
        updateInventoryFromTileItems(reward.item as InventoryItem[]);
        const firstItem = reward.item[0];
        if (firstItem) {
          toast({
            title: "Item Found!",
            description: `You found ${firstItem.name}`,
            duration: 3000
          });
        }
      }
    }

    // Replace the mystery tile with a grass tile at the character's current position
    setGrid((prevGrid: Tile[][]) => {
      const newGrid = [...prevGrid];
      const { x, y } = characterPosition;
      
      if (newGrid[y] && newGrid[y][x]) {
        const currentTile = newGrid[y][x];
        if (currentTile) {
          const newTile = {
            ...currentTile,
            type: 'grass' as TileType,
            name: 'Grass Tile',
            description: 'A lush grass tile',
            image: '/images/tiles/grass-tile.png',
            isVisited: true,
            ariaLabel: `Grass tile at position ${x},${y}`,
            isMainTile: false,
            isTown: false,
            cityName: undefined,
            cityX: undefined,
            cityY: undefined,
            citySize: undefined,
            bigMysteryX: undefined,
            bigMysteryY: undefined,
            tileSize: undefined,
            cost: 0,
            quantity: 1
          };
          newGrid[y][x] = newTile;
        }
      }
      return newGrid;
    });

    // Clear the current event
    setCurrentEvent(null);
  };

  // 1. Add the expandMap function inside RealmPage
  const expandMap = () => {
    setGrid((prevGrid: Tile[][]) => {
      const newRows = [];
      const yStart = prevGrid.length;
      const rowLength = prevGrid.length > 0 && Array.isArray(prevGrid[0]) ? prevGrid[0].length : GRID_COLS;
      for (let i = 0; i < 3; i++) {
        const y = yStart + i;
        const row: Tile[] = [];
        for (let x = 0; x < rowLength; x++) {
          row.push({
            id: `tile-${x}-${y}`,
            type: 'empty' as TileType,
            name: 'Empty Tile',
            description: 'An empty space ready for a new tile',
            connections: [],
            rotation: 0 as 0 | 90 | 180 | 270,
            revealed: true,
            isVisited: false,
            x,
            y,
            ariaLabel: `Empty tile at position ${x},${y}`,
            image: '/images/tiles/empty-tile.png',
            isMainTile: false,
            isTown: false,
            cityName: undefined,
            cityX: undefined,
            cityY: undefined,
            citySize: undefined,
            bigMysteryX: undefined,
            bigMysteryY: undefined,
            tileSize: undefined,
            cost: 0,
            quantity: 1,
          });
        }
        newRows.push(row);
      }
      return [...prevGrid, ...newRows];
    });
     // Show scroll message after expanding
     setShowScrollMessage(true);
  };


  // Add a function to handle quest completion and unlock dragon creatures
  const handleQuestCompletion = async () => {
    if (!userId || isGuest) {
        console.warn('Session or Supabase client not available for quest completion');
        return; // Ensure user and supabase are available
    }
    const newCount = (questCompletedCount ?? 0) + 1; // Use 0 if questCompletedCount is null/undefined
    if (newCount >= 100) useCreatureStore.getState().discoverCreature('101'); // Drakon
    if (newCount >= 500) useCreatureStore.getState().discoverCreature('102'); // Fireon
    if (newCount >= 1000) useCreatureStore.getState().discoverCreature('103'); // Valerion
    setQuestCompletedCount(newCount);
    try {
      // Pass the supabase client to createQuestCompletion
      if (!supabase) throw new Error('Supabase client not initialized');
      await createQuestCompletion(supabase, 'realm', 'Quest Completed');
      console.log('Quest completion recorded in Supabase.');
    } catch (error) {
      console.error('Failed to record quest completion:', error);
      toast({ title: "Error", description: "Failed to save quest progress.", variant: "destructive" });
    }
  };

  // Helper to find the other portal
  const findOtherPortal = (grid: Tile[][], sourceType: TileType): { x: number; y: number } | null => {
    const targetType = sourceType === 'portal-entrance' ? 'portal-exit' : 'portal-entrance';
    for (let y = 0; y < grid.length; y++) {
      if (!grid[y]) continue;
      for (let x = 0; x < (grid[y]?.length ?? 0); x++) {
        if (grid[y]?.[x]?.type === targetType) {
          return { x, y };
        }
      }
    }
    return null; // Add explicit return for when no portal is found
  };

  // Portal modal handlers
  const handlePortalEnter = () => {
    if (!portalSource) return;
    const dest = findOtherPortal(grid, portalSource.type);
    if (
      dest &&
      typeof dest.y === 'number' &&
      typeof dest.x === 'number' &&
      Array.isArray(grid) &&
      Array.isArray(grid[dest.y])
    ) {
      const row = grid[dest.y];
      if (row && row[dest.x] !== undefined) {
        setCharacterPosition({ x: dest.x, y: dest.y });
        logger.info(`Teleported from ${portalSource.type} at (${portalSource.x},${portalSource.y}) to (${dest.x},${dest.y})`, 'PortalTeleport');
      }
    }
    setShowPortalModal(false);
    setPortalSource(null);
  };

  const handlePortalLeave = () => {
    setShowPortalModal(false);
    setPortalSource(null);
  };

  type AnimalType = 'horse' | 'sheep' | 'penguin' | 'bird';

  // Helper: Find all connected ice tiles (BFS)
  const getConnectedIceTiles = (start: { x: number; y: number }, grid: Tile[][]) => {
    const visited = new Set<string>();
    const queue = [start];
    const connected: { x: number; y: number }[] = [];
    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (!grid[y] || !grid[y][x]) continue;
      const tile = grid[y][x];
      if (!tile || (tile.type !== 'ice' && tile.type !== 'snow')) continue;
      connected.push({ x, y });
      // Check 4 directions
      [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 }
      ].forEach(pos => {
        if (
          pos.x >= 0 && pos.y >= 0 &&
          pos.y < grid.length &&
          Array.isArray(grid[0]) && pos.x < grid[0].length &&
          !visited.has(`${pos.x},${pos.y}`)
        ) {
          if (!grid[pos.y]?.[pos.x]) return;
          const t = grid[pos.y]?.[pos.x];
          if (t && (t.type === 'ice' || t.type === 'snow')) {
            queue.push(pos);
          }
        }
      });
    }
    return connected;
  };

  const getValidAdjacentTiles = (x: number, y: number, animalType: AnimalType) => {
    const adjacentTiles = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 }
    ];

    return adjacentTiles.filter(pos => {
      if (pos.x < 0 || pos.y < 0 || pos.y >= grid.length || !Array.isArray(grid[0]) || pos.x >= (grid[0]?.length ?? 0)) {
        return false;
      }
      const tile = grid[pos.y]?.[pos.x];
      if (!tile || !tile.type) return false;
      switch (animalType) {
        case 'horse':
        case 'sheep':
          return tile.type === 'grass' || tile.type === 'mystery';
        case 'penguin':
          return tile.type === 'ice' || tile.type === 'snow';
        case 'bird':
          return true;
        default:
          return false;
      }
    });
  };

  // Function to move animals randomly
  const moveAnimals = useCallback(() => {
    // Horse
    if (isHorsePresent) {
      const validHorseMoves = getValidAdjacentTiles(horsePosition.x, horsePosition.y, 'horse');
      if (validHorseMoves.length > 0) {
        const randomMove = validHorseMoves[Math.floor(Math.random() * validHorseMoves.length)];
        if (randomMove) setHorsePosition(randomMove);
      }
    }
    // Sheep
    const validSheepMoves = getValidAdjacentTiles(sheepPosition.x, sheepPosition.y, 'sheep');
    if (validSheepMoves.length > 0) {
      const randomMove = validSheepMoves[Math.floor(Math.random() * validSheepMoves.length)];
      if (randomMove) setSheepPosition(randomMove);
    }
    // Eagle (bird)
    if (eaglePosition) {
      const validEagleMoves = getValidAdjacentTiles(eaglePosition.x, eaglePosition.y, 'bird');
      if (validEagleMoves.length > 0) {
        const randomMove = validEagleMoves[Math.floor(Math.random() * validEagleMoves.length)];
        if (randomMove) setEaglePosition(randomMove);
      }
    }
    // Penguin
    if (isPenguinPresent && penguinPosition) {
      // Only move if there are at least 2 connected ice tiles
      const connected = getConnectedIceTiles(penguinPosition, grid);
      if (connected.length > 1) {
        // Only move to adjacent ice tiles that are part of the connected group
        const validPenguinMoves = getValidAdjacentTiles(penguinPosition.x, penguinPosition.y, 'penguin').filter(pos =>
          connected.some(c => c.x === pos.x && c.y === pos.y)
        );
        if (validPenguinMoves.length > 0) {
          const randomMove = validPenguinMoves[Math.floor(Math.random() * validPenguinMoves.length)];
          if (randomMove) setPenguinPosition(randomMove);
        }
      }
    }
  }, [grid, horsePosition, sheepPosition, eaglePosition, penguinPosition, isHorsePresent, isPenguinPresent]);

  // Set up interval for animal movement
  useEffect(() => {
    const interval = setInterval(moveAnimals, 5000);
    return () => clearInterval(interval);
  }, [moveAnimals]);

  // Penguin spawn logic: when first ice tile is placed
  useEffect(() => {
    if (!isPenguinPresent) {
      for (let y = 0; y < grid.length; y++) {
        if (!grid[y]) continue;
        for (let x = 0; x < (grid[y]?.length ?? 0); x++) {
          const tile = grid[y]?.[x];
          if (tile && (tile.type === 'ice' || tile.type === 'snow')) {
            setPenguinPosition({ x, y });
            setIsPenguinPresent(true);
            return;
          }
        }
      }
    }
  }, [grid, isPenguinPresent]);

  // Add debug log before returning JSX
  console.log('Current grid state:', grid);
  console.log('Current selected tile state:', selectedTile); // Log selected tile state

  // Use a variable for loading state instead of early return
  const isLoadingState = isLoading || !isAuthLoaded || !isInitialized;

  // Fallback: ensure grid and inventory are always set to defaults if empty/invalid
  React.useEffect(() => {
    // Fallback for grid
    if ((!Array.isArray(grid) || grid.length === 0 || !Array.isArray(grid[0]) || grid[0].length === 0) && !isLoading) {
      setGrid(createBaseGrid(INITIAL_ROWS, GRID_COLS));
    }
    // Fallback for inventory: only set if it's not an object or is empty
    if (
      !inventory ||
      Array.isArray(inventory) ||
      typeof inventory !== 'object' ||
      Object.keys(inventory).length === 0
    ) {
      setInventory(initialTileInventory);
    }
  }, [grid, inventory, isLoading]);

  // DEBUG: Show real grid state and fallback if empty
  console.log('REAL GRID STATE:', grid);

  // DEBUG: Log animal positions and presence flags
  console.log('horsePos:', horsePosition, 'isHorsePresent:', isHorsePresent);
  console.log('sheepPos:', sheepPosition);
  console.log('eaglePos:', eaglePosition);
  console.log('penguinPos:', penguinPosition, 'isPenguinPresent:', isPenguinPresent);

  // TEMP: Force horse to visible position for testing
  const debugHorsePos = { x: 2, y: 0 };
  const debugIsHorsePresent = true;

  // Add the location modal
  const LocationModal = () => {
    if (!currentLocation) return null;

    return (
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentLocation.name}</DialogTitle>
            <DialogDescription>{currentLocation.description}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowLocationModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleVisitLocation}>
              Enter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="relative min-h-screen bg-background p-4">
      {isLoadingState ? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Loading your realm...</h2>
            <p className="text-gray-500">Please wait while we prepare your kingdom.</p>
          </div>
        </div>
      ) : (
        <>
          {/* --- UI controls (settings, toggles, etc.) above the grid --- */}
          <div className="flex gap-4 mb-4 items-center">
            <Button onClick={expandMap} variant="secondary">Expand Map</Button>
            <Button onClick={toggleInventory} variant="secondary">Inventory (press 'i')</Button>
            <Switch checked={minimapSwitch} onCheckedChange={setMinimapSwitch}>Minimap</Switch>
            <Button onClick={() => setIsFullscreen(!isFullscreen)} variant="ghost">
              <Settings className="w-5 h-5" />
            </Button>
            {/* Movement/Build mode toggles */}
            <Switch checked={movementMode} onCheckedChange={setMovementMode} aria-label="Toggle Movement Mode">
              {movementMode ? 'Movement Mode' : 'Build Mode'}
            </Switch>
          </div>
          {/* --- Debug overlay for character position --- */}
          <div className="fixed top-2 left-2 z-50 bg-black bg-opacity-70 text-white px-3 py-1 rounded shadow text-xs pointer-events-none">
            Char Pos: x={characterPosition.x}, y={characterPosition.y}
          </div>
          {/* --- Render the grid --- */}
          <div className="my-8">
            {(!Array.isArray(grid) || grid.length === 0 || !Array.isArray(grid[0]) || grid[0].length === 0) ? (
              <div>
                <h2>No grid data found. Showing fallback.</h2>
              </div>
            ) : (
              <MapGrid
                grid={sanitizeGrid(grid)}
                character={characterPosition || defaultCharacterPosition}
                onCharacterMove={handleCharacterMove}
                onTileClick={(x, y) => {
                  if (!movementMode && selectedTile) {
                    // Place tile from inventory
                    const newGrid = grid.map(row => row.slice());
                    const tileToPlace = { ...selectedTile, x, y };
                    newGrid[y][x] = tileToPlace;
                    setGrid(newGrid);
                    // Decrement inventory
                    const updatedInventory = { ...inventory };
                    if (updatedInventory[tileToPlace.type] && updatedInventory[tileToPlace.type].quantity > 0) {
                      updatedInventory[tileToPlace.type].quantity -= 1;
                      setInventory(updatedInventory);
                    }
                    // Do NOT deselect the tile after placement, so user can place multiple tiles
                    // setSelectedTile(null);
                  }
                }}
                selectedTile={selectedTile}
                isMovementMode={movementMode}
                onGridUpdate={setGrid}
                hoveredTile={hoveredTile}
                setHoveredTile={setHoveredTile}
                gridRotation={gridRotation}
                minimapEntities={minimapEntities}
                minimapZoom={minimapZoom}
                minimapRotationMode={minimapRotationMode}
                onTileDelete={handleTileDelete}
                onReset={handleReset}
                showScrollMessage={showScrollMessage}
                setShowScrollMessage={setShowScrollMessage}
                inventory={inventory}
                onInventoryUpdate={handleInventoryUpdate}
                onVisitLocation={handleVisitLocation}
                onEventChoice={handleEventChoice}
                currentEvent={currentEvent}
                setCurrentEvent={setCurrentEvent}
                showLocationModal={showLocationModal}
                setShowLocationModal={setShowLocationModal}
                currentLocation={currentLocation}
                setCurrentLocation={setCurrentLocation}
                isSyncing={isSyncing}
                syncError={syncError}
                saveStatus={saveStatus}
                lastSaveTime={lastSaveTime}
                saveError={saveError}
                retryCount={retryCount}
                tileCounts={tileCounts}
                setTileCounts={setTileCounts}
                onGoldUpdate={handleGoldUpdate}
                onExperienceUpdate={handleExperienceUpdate}
                onQuestCompletion={handleQuestCompletion}
                onExpandMap={expandMap}
                horsePosition={debugHorsePos}
                sheepPosition={sheepPosition}
                eaglePosition={eaglePosition}
                penguinPosition={penguinPosition}
                isHorsePresent={debugIsHorsePresent}
                isPenguinPresent={isPenguinPresent}
                portalSource={portalSource}
                setPortalSource={setPortalSource}
                showPortalModal={showPortalModal}
                setShowPortalModal={setShowPortalModal}
              />
            )}
          </div>
          {/* --- Tile Inventory Side Drawer Overlay (shop) --- */}
          {showInventory && (
            <>
              {/* Background overlay for click-to-close */}
              <div className="fixed inset-0 z-40 bg-black bg-opacity-60" onClick={toggleInventory} aria-label="Close Inventory Overlay" />
              {/* Side drawer */}
              <aside className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-lg flex flex-col" role="dialog" aria-modal="true" aria-label="Tile Inventory Shop">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-lg font-semibold">Tile Inventory</span>
                  <Button variant="ghost" onClick={toggleInventory} aria-label="Close Inventory">✕</Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <TileInventory
                    tiles={Object.values(inventory) as InventoryItem[]}
                    selectedTile={selectedTile}
                    onSelectTile={handleTileSelection}
                    onUpdateTiles={handleInventoryUpdate}
                  />
                </div>
              </aside>
            </>
          )}
          {/* --- Minimap Overlay --- */}
          {minimapSwitch && (
            <Minimap
              grid={grid}
              playerPosition={characterPosition}
              entities={minimapEntities}
              zoom={minimapZoom}
              onZoomChange={setMinimapZoom}
              rotationMode={minimapRotationMode}
              onRotationModeChange={setMinimapRotationMode}
              onClose={() => setMinimapSwitch(false)}
            />
          )}
          <LocationModal />
        </>
      )}
    </div>
  );
}