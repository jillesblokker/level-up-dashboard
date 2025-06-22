"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tile, TileType, InventoryItem as TileInventoryItem, SelectedInventoryItem } from '@/types/tiles'
import { useCreatureStore } from "@/stores/creatureStore"
import { Settings } from "lucide-react"
import { MapGrid } from '../../components/map-grid'
import { TileInventory } from '@/components/tile-inventory'
import { Switch } from "@/components/ui/switch"
import { generateMysteryEvent } from "@/lib/mystery-events"
import { MysteryEvent } from '@/lib/mystery-events'
import { InventoryItem, addToKingdomInventory, addToInventory } from "@/lib/inventory-manager"
import { Minimap } from "@/components/Minimap"
import { MinimapRotationMode } from "@/types/minimap"
import { useAchievementStore } from '@/stores/achievementStore'
import { logger } from "@/lib/logger"
import { useUser } from '@clerk/nextjs'
import React from "react"
import { gainGold } from "@/lib/gold-manager"
import { gainExperience } from "@/lib/experience-manager"
import { notificationService } from "@/lib/notification-service"
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/hooks/useSupabase";
import { withToken } from "@/lib/supabase/client";
import {
  loadGridFromSupabase,
  loadGridFromLocalStorage,
  saveGridToSupabase,
  saveGridToLocalStorage,
} from '@/lib/grid-persistence';
import { createTileFromNumeric, loadGridWithSupabaseFallback } from "@/lib/grid-loader"

// Types
interface TileCounts {
  forestPlaced: number;
  forestDestroyed: number;
  waterPlaced: number;
  mountainPlaced: number;
  mountainDestroyed: number;
  icePlaced: number;
  waterDestroyed: number;
}

// Constants
const GRID_COLS = 13
const INITIAL_ROWS = 7
const AUTOSAVE_INTERVAL = 30000 // 30 seconds

// Initial state
const defaultTile = (type: TileType): Tile => ({
  id: type,
  name: type.charAt(0).toUpperCase() + type.slice(1),
  description: `${type.charAt(0).toUpperCase() + type.slice(1)} tile`,
  type,
  connections: [],
  rotation: 0,
  revealed: true,
  isVisited: false,
  x: 0,
  y: 0,
  ariaLabel: `${type} tile`,
  image: `/tiles/${type}.png`,
  cost: 0,
  quantity: 0
});

const allTileTypes: TileType[] = [
  'empty', 'mountain', 'grass', 'forest', 'water', 'city', 'town', 'mystery', 'portal', 'portal-entrance',
  'portal-exit', 'snow', 'cave', 'dungeon', 'castle', 'ice', 'desert', 'lava', 'volcano' // removed 'sheep', 'horse'
];

const initialInventory: Record<TileType, Tile> = Object.fromEntries(
  allTileTypes.map(type => [type, defaultTile(type)])
) as Record<TileType, Tile>;

// Add this above RealmPage or near other constants
type LocationInfo = { name: string; description: string };
const realmLocationData: Record<string, LocationInfo> = {
  'Grand Citadel': {
    name: 'Grand Citadel',
    description: 'A majestic fortress city that serves as the capital.'
  },
  'Town 6-6': {
    name: 'Kingdom Marketplace',
    description: 'A bustling marketplace where traders from all corners gather.'
  },
  'Town 3-3': {
    name: 'Royal Stables',
    description: 'Fine steeds and mounts for your journeys.'
  },
  'Town 6-3': {
    name: "Ember's Forge",
    description: 'Master blacksmith crafting weapons and armor.'
  },
  // Add more as needed
};

// Add these functions before RealmPage
const createBaseGrid = (): Tile[][] => {
  const grid: Tile[][] = [];
  for (let y = 0; y < INITIAL_ROWS; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      // Create a default grass tile
      row.push(defaultTile('grass'));
    }
    grid.push(row);
  }
  return grid;
};

// Add missing functions
const processLoadedGrid = (fetchedGrid: number[][]): Tile[][] => {
  return fetchedGrid.map((row, y) =>
    row.map((numeric, x) => createTileFromNumeric(numeric, x, y))
  );
};

const createEmptyTile = (x: number, y: number): Tile => ({
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
  ariaLabel: `empty tile at position ${x},${y}`,
  image: "/images/tiles/empty-tile.png",
});

// Add this function to load the initial grid from CSV
const loadInitialGridFromCSV = async (): Promise<Tile[][]> => {
  try {
    const response = await fetch('/data/initial-grid.csv');
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    
    // Skip the first line (column headers)
    const gridData = lines.slice(1).map(line => 
      line.split(',').map(num => parseInt(num.trim(), 10))
    );
    
    return gridData.map((row, y) =>
      row.map((numeric, x) => createTileFromNumeric(numeric, x, y))
    );
  } catch (error) {
    console.error('Failed to load initial grid from CSV, using default:', error);
    return createBaseGrid();
  }
};

export default function RealmPage() {
  const router = useRouter();
  const { user, isLoaded: isAuthLoaded } = useUser();
  const userId = user?.id;
  const isGuest = !user;
  const { supabase, getToken, isLoading: isSupabaseLoading } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [grid, setGrid] = useState<Tile[][]>(createBaseGrid());
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inventory, setInventory] = useState<Record<TileType, Tile>>(initialInventory);
  const [tileCounts, setTileCounts] = useState<TileCounts>({
    forestPlaced: 0,
    forestDestroyed: 0,
    waterPlaced: 0,
    mountainPlaced: 0,
    mountainDestroyed: 0,
    icePlaced: 0,
    waterDestroyed: 0,
  });
  const updateProgress = (..._args: any[]) => {};
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [characterPosition, setCharacterPosition] = useState({ x: 0, y: 0 });
  const [portalSource, setPortalSource] = useState<{ x: number; y: number; type: TileType } | null>(null);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<MysteryEvent | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ x: number; y: number; name: string; description?: string } | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showScrollMessage, setShowScrollMessage] = useState(false);
  const [movementMode, setMovementMode] = useState<'normal' | 'portal'>('normal');
  const [defaultCharacterPosition] = useState({ x: 6, y: 3 });
  // Track last modal-triggered position
  const [lastModalPosition, setLastModalPosition] = useState<{x: number, y: number} | null>(null);

  // Add missing state variables that are used throughout the component
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [selectedTile, setSelectedTile] = useState<TileInventoryItem | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [questCompletedCount, setQuestCompletedCount] = useState(0);
  const [minimapSwitch, setMinimapSwitch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGridCoordinates, setShowGridCoordinates] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [minimapZoom, setMinimapZoom] = useState(1);
  const [minimapRotationMode, setMinimapRotationMode] = useState<MinimapRotationMode>('static');

  // Animal position states
  const [horsePosition, setHorsePosition] = useState({ x: 2, y: 2 });
  const [sheepPosition, setSheepPosition] = useState({ x: 8, y: 8 });
  const [eaglePosition, setEaglePosition] = useState({ x: 5, y: 5 });
  const [penguinPosition, setPenguinPosition] = useState({ x: 12, y: 12 });
  const [isHorsePresent, setIsHorsePresent] = useState(true);
  const [isPenguinPresent, setIsPenguinPresent] = useState(true);

  // Loading state calculation
  const isLoadingState = isLoading || !isAuthLoaded || isSupabaseLoading;

  const saveCharacterPosition = (pos: { x: number; y: number }) => {
    setCharacterPosition(pos);
    localStorage.setItem('characterPosition', JSON.stringify(pos));
  };

  useEffect(() => {
    const initializeGrid = async () => {
      if (!userId || !supabase) return;

      try {
        setIsLoading(true);
        console.log('Initializing grid...');

        // Try to load from Supabase first
        const loadedGrid = await loadGridWithSupabaseFallback(supabase, userId, isGuest);
        
        if (loadedGrid && loadedGrid.length > 0) {
          console.log('Loaded existing grid from Supabase');
          setGrid(loadedGrid);
        } else {
          console.log('No existing grid found, loading initial grid from CSV');
          const initialGrid = await loadInitialGridFromCSV();
          setGrid(initialGrid);
          
          // Save the initial grid to Supabase
          try {
            await saveGridToSupabase(supabase, userId, initialGrid);
            console.log('Saved initial grid to Supabase');
          } catch (saveError) {
            console.error('Failed to save initial grid to Supabase:', saveError);
            // Save to localStorage as fallback
            saveGridToLocalStorage(initialGrid);
          }
        }
      } catch (error) {
        console.error('Error initializing grid:', error);
        // Fallback to initial grid from CSV
        const initialGrid = await loadInitialGridFromCSV();
        setGrid(initialGrid);
      } finally {
        setIsLoading(false);
      }
    };

    initializeGrid();
  }, [userId, supabase, isGuest]);


  // Autosave grid data
  useEffect(() => {
    if (isLoading || grid.length === 0) {
      return; // Don't save while loading or if grid is empty
    }

    const handleSave = async () => {
      if (supabase && userId && !isGuest) {
        try {
          await withToken(supabase, getToken, (client) => 
            saveGridToSupabase(client, userId, grid)
          );
          toast({ title: "Realm Saved Online!", duration: 2000 });
        } catch (e) {
          console.error("Autosave to Supabase failed, saving to localStorage as fallback.", e);
          await saveGridToLocalStorage(grid);
          toast({ title: "Online save failed. Realm saved locally.", variant: "destructive", duration: 2000 });
        }
      } else {
        await saveGridToLocalStorage(grid);
        toast({ title: "Realm Saved Locally", duration: 2000 });
      }
    };

    const intervalId = setInterval(handleSave, AUTOSAVE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [grid, isLoading, supabase, userId, isGuest, getToken, toast]);

  // Effect to save grid to database for authenticated users or local storage for anonymous users
  useEffect(() => {
    if (isLoading) return;

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
          
          // Check if it's an authentication error
          const errorMessage = error instanceof Error ? error.message : '';
          const isAuthError = errorMessage.includes('Invalid API key') || 
                             errorMessage.includes('401') || 
                             errorMessage.includes('Unauthorized') ||
                             errorMessage.includes('JWT');
          
          if (isAuthError) {
            logger.info('Authentication error detected, falling back to localStorage only', 'GridSave');
            // Save to localStorage as fallback
            localStorage.setItem('grid', JSON.stringify(grid));
            setSyncError('Authentication failed - using local storage only');
          } else {
            setSyncError(error instanceof Error ? error.message : 'Failed to save grid');
          }
        } finally {
          setIsSyncing(false)
        }
      }
    }

    // Save grid on initial load (after !isLoading is true) and at intervals
    if (!isLoading) {
      const saveTimeout = setTimeout(saveGrid, AUTOSAVE_INTERVAL);
      return () => clearTimeout(saveTimeout);
    }

    // Cleanup function for when !isLoading is false or component unmounts before initialization
    return () => {};

  }, [grid, isLoading, userId, isGuest])


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
      if (item && typeof item.quantity === 'number') {
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
    console.log('handleCharacterMove called with:', { newX, newY });
    
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
    console.log('Target tile:', targetTile);
    
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
    console.log('Character position updated to:', { x: newX, y: newY });

    // Handle special tile interactions
    if (targetTile.type === 'portal-entrance' || targetTile.type === 'portal-exit') {
      console.log('Portal interaction triggered');
      setPortalSource({ x: newX, y: newY, type: targetTile.type });
      setShowPortalModal(true);
    } else if (targetTile.type === 'dungeon') {
      console.log('Dungeon interaction triggered');
      localStorage.setItem('current-dungeon', JSON.stringify({ position: { x: newX, y: newY }, type: 'dungeon' }));
      // TODO: Navigate to dungeon page
    } else if (targetTile.type === 'mystery' && !targetTile.isVisited) {
      console.log('Mystery interaction triggered');
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
    } else if ((targetTile.type === 'city' || targetTile.type === 'town') && (!lastModalPosition || lastModalPosition.x !== newX || lastModalPosition.y !== newY)) {
      console.log('City/Town interaction triggered:', { type: targetTile.type, cityName: targetTile.cityName });
      // Use tile type as fallback if cityName is undefined
      const locationKey = targetTile.cityName || targetTile.type;
      const locationInfo = realmLocationData[locationKey];
      console.log('Location info found:', locationInfo);
      if (locationInfo?.name) {
        setCurrentLocation({
          x: newX,
          y: newY,
          name: locationInfo.name,
          description: locationInfo.description,
        });
        setShowLocationModal(true);
        setLastModalPosition({x: newX, y: newY});
        console.log('Location modal should be showing');
      } else {
        // Fallback for tiles without specific location data
        const fallbackName = targetTile.type === 'city' ? 'Unknown City' : 'Unknown Town';
        const fallbackDescription = `A ${targetTile.type} that you have discovered.`;
        setCurrentLocation({
          x: newX,
          y: newY,
          name: fallbackName,
          description: fallbackDescription,
        });
        setShowLocationModal(true);
        setLastModalPosition({x: newX, y: newY});
        console.log('Fallback location modal should be showing');
      }
    } else if (targetTile.type !== 'city' && targetTile.type !== 'town') {
      setLastModalPosition(null);
    }

    // Save position to Supabase and localStorage
    if (supabase && userId) {
      try {
        saveCharacterPosition({ x: newX, y: newY });
      } catch (error) {
        console.log('Supabase save failed, using localStorage only:', error);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('character-position', JSON.stringify({ x: newX, y: newY }));
    }
  }, [setCharacterPosition, grid, toast, supabase, userId, setCurrentLocation, setShowLocationModal, setPortalSource, setShowPortalModal, setCurrentEvent, setGrid, characterPosition, lastModalPosition, saveCharacterPosition]);

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
  const handleInventoryUpdate = (updatedInventory: Record<TileType, Tile>) => {
    setInventory(updatedInventory);
  };

  // Add the handleVisitLocation function
  const handleVisitLocation = (location: { x: number; y: number; name: string }) => {
    const desc = realmLocationData[location.name]?.description || '';
    setCurrentLocation({ ...location, description: desc });
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
        setMovementMode('normal')
      } else if (event.key === 'm' && !event.repeat && !currentEvent) {
        setMovementMode('portal')
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
      
      // Clear Supabase data for authenticated users
      if (!isGuest && userId && supabase) {
        try {
          console.log('Clearing Supabase grid data...');
          const { error: deleteError } = await supabase
            .from('realm_grids')
            .delete()
            .eq('user_id', userId);
          
          if (deleteError) {
            console.warn('Warning: Could not clear Supabase grid data:', deleteError);
          } else {
            console.log('Successfully cleared Supabase grid data');
          }
        } catch (supabaseError) {
          console.warn('Error clearing Supabase data:', supabaseError);
        }
      }
      
      // Use the new function to load and process the initial grid
      const loadedGrid = await loadGridFromLocalStorage();
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
      setInventory(initialInventory); // Reset inventory to initial state
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
      const loadedGrid = await loadGridFromLocalStorage();
      setGrid(loadedGrid);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleHoverTile = (x: number, y: number) => {
    setHoveredTile({ x, y });
  };

  // Correct the handleTileSelection function to use InventoryItem and map to SelectedInventoryItem
const handleTileSelection = (tile: TileInventoryItem | null) => {
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
        // Set to build mode when inventory is opened
        setMovementMode('portal'); // This enables tile placement mode
      }
      return newValue;
    });
  }, []);

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
    gainGold(amount, 'realm-events');
  };

  const handleExperienceUpdate = (amount: number) => {
    gainExperience(amount, 'realm-events', 'general');
  };

  // Fix the updateInventoryFromTileItems function to handle type mismatches and use InventoryItem
   // This function seems intended to update the local inventory state from a list of items,
   // likely from an event outcome or similar.
  const updateInventoryFromTileItems = useCallback((tileItems: TileInventoryItem[]) => { // Explicitly type as InventoryItem[] and wrap in useCallback
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


  // Listen for mystery event completion to replace tile
  React.useEffect(() => {
    const handleMysteryEventCompleted = () => {
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
    };
    window.addEventListener('mystery-event-completed', handleMysteryEventCompleted);
    return () => window.removeEventListener('mystery-event-completed', handleMysteryEventCompleted);
  }, [characterPosition]);

  // Update the handleEventChoice function
  const handleEventChoice = async (choice: string) => {
    if (currentEvent) {
      const outcome = currentEvent.outcomes?.[choice];
      if (outcome && outcome.reward) {
        if (outcome.reward.type === 'gold' && outcome.reward.amount) {
          handleGoldUpdate(outcome.reward.amount);
        }
        if (outcome.reward.type === 'experience' && outcome.reward.amount) {
          handleExperienceUpdate(outcome.reward.amount);
        }
        if (outcome.reward.type === 'item' && outcome.reward.item) {
          outcome.reward.item.forEach(item => {
            // If the item is a horse, ensure it has a unique id and type 'creature'
            if (item.name && item.name.toLowerCase().includes('horse')) {
              addToKingdomInventory({
                ...item,
                id: `horse-${Date.now()}`,
                type: 'creature',
                quantity: 1,
              });
            } else {
              addToKingdomInventory(item);
            }
          });
        }
      }
      setCurrentEvent(null);
    }
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
      // TODO: Implement quest completion tracking when API is ready
      // if (!supabase) throw new Error('Supabase client not initialized');
      // await createQuestCompletion(supabase, 'realm', 'Quest Completed');
      console.log('Quest completion recorded.');
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

  // Fallback: ensure grid and inventory are always set to defaults if empty/invalid
  React.useEffect(() => {
    // Fallback for grid
    if ((!Array.isArray(grid) || grid.length === 0 || !Array.isArray(grid[0]) || grid[0].length === 0) && !isLoading) {
      setGrid(createBaseGrid());
    }
    // Fallback for inventory: only set if it's not an object or is empty
    if (
      !inventory ||
      Array.isArray(inventory) ||
      typeof inventory !== 'object' ||
      Object.keys(inventory).length === 0
    ) {
      setInventory(initialInventory);
    }
  }, [grid, inventory, isLoading]);

  // DEBUG: Show real grid state and fallback if empty
  console.log('REAL GRID STATE:', grid);

  // DEBUG: Log animal positions and presence flags
  console.log('horsePos:', horsePosition, 'isHorsePresent:', isHorsePresent);
  console.log('sheepPos:', sheepPosition);
  console.log('eaglePos:', eaglePosition);
  console.log('penguinPos:', penguinPosition, 'isPenguinPresent:', isPenguinPresent);

  // Add the location modal
  const LocationModal = () => {
    if (!currentLocation) return null;

    // Determine the route based on type and name
    const isCity = currentLocation.name.toLowerCase().includes('city') || currentLocation.name.toLowerCase().includes('citadel');
    const isTown = currentLocation.name.toLowerCase().includes('town');
    // Fallback slug: use cityName if available, else coordinates
    const slug = (grid[currentLocation.y]?.[currentLocation.x]?.cityName || `city-${currentLocation.x}-${currentLocation.y}`).replace(/\s+/g, '-').toLowerCase();
    const townSlug = (grid[currentLocation.y]?.[currentLocation.x]?.cityName || `town-${currentLocation.x}-${currentLocation.y}`).replace(/\s+/g, '-').toLowerCase();

    const handleEnter = () => {
      if (isCity) {
        router.push(`/city/${slug}`);
      } else if (isTown) {
        router.push(`/town/${townSlug}`);
      } else {
        router.push(`/city/${slug}`);
      }
      setShowLocationModal(false);
    };

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
            <Button onClick={handleEnter}>
              Enter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }; // <-- Add this closing brace to end LocationModal

  useEffect(() => {
    const handleHorseCaught = () => {
      setIsHorsePresent(false);
    };
    window.addEventListener('horse-caught', handleHorseCaught);
    return () => window.removeEventListener('horse-caught', handleHorseCaught);
  }, []);
  
  const [showHorseCaughtModal, setShowHorseCaughtModal] = useState(false);
  const [caughtHorse, setCaughtHorse] = useState<InventoryItem | null>(null);

  // Update the horse-caught event handler type
  interface HorseCaughtEvent {
    detail: {
      horse: InventoryItem;
    }
  }

  // Update the event handler
  const handleHorseCaught = (event: HorseCaughtEvent) => {
    console.log('Horse caught event received:', event);
    const caughtHorse: InventoryItem = event.detail.horse;
    setCaughtHorse(caughtHorse);
    setShowHorseCaughtModal(true);
    console.log('Horse modal should be showing');
  };

  // Update the event listener
  useEffect(() => {
    const handleHorseCaughtEvent = (event: Event) => {
      console.log('Horse caught event listener triggered:', event);
      if ('detail' in event) {
        handleHorseCaught(event as HorseCaughtEvent);
      }
    };

    window.addEventListener('horse-caught', handleHorseCaughtEvent);
    return () => window.removeEventListener('horse-caught', handleHorseCaughtEvent);
  }, []);

  // Load tile inventory from localStorage on mount
  useEffect(() => {
    try {
      const savedTileInventory = localStorage.getItem('tile-inventory');
      if (savedTileInventory) {
        setInventory(JSON.parse(savedTileInventory));
      }
    } catch (error) {
      console.error('Error loading tile inventory from localStorage:', error);
    }
  }, []);

  // Whenever tile inventory changes, update localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tile-inventory', JSON.stringify(inventory));
    } catch (error) {
      console.error('Error saving tile inventory to localStorage:', error);
    }
  }, [inventory]);
  
  // Add the missing handleHorseCaughtOk function
  const handleHorseCaughtOk = () => {
    console.log('handleHorseCaughtOk called with caughtHorse:', caughtHorse);
    if (caughtHorse) {
      // Always give experience for catching a horse
      const experienceReward = 25;
      gainExperience(experienceReward, 'horse-caught', 'general');
      
      // Ensure caughtHorse has all required InventoryItem properties and a unique id
      const horseToAdd: InventoryItem = {
        id: caughtHorse.id || `horse-${Date.now()}`,
        name: caughtHorse.name,
        description: caughtHorse.description || '',
        type: 'creature', // Ensure type is 'creature' for kingdom inventory
        emoji: caughtHorse.emoji || '🐎',
        image: caughtHorse.image || '/images/Animals/horse.png',
        quantity: caughtHorse.quantity || 1,
      };
      
      console.log('Adding horse to kingdom inventory:', horseToAdd);
      
      // Add to kingdom inventory
      addToKingdomInventory(horseToAdd);
      
      // Also add to regular inventory for consistency
      addToInventory(horseToAdd);
      
      window.dispatchEvent(new Event('character-inventory-update'));
      
      console.log('Horse added to inventories');
      
      toast({
        title: 'Horse Added!',
        description: `${caughtHorse.name} has been added to your kingdom inventory and you gained ${experienceReward} XP!`,
        variant: "default",
        className: "scroll-toast"
      });
      
      notificationService.addNotification(
        'Horse Caught! 🐎',
        `${caughtHorse.name} has been added to your kingdom inventory and you gained ${experienceReward} XP!`,
        'discovery',
        {
          label: 'View Kingdom',
          href: '/kingdom',
        }
      );
      
      setShowHorseCaughtModal(false);
      setCaughtHorse(null);
    }
  };

  // Mystery Event Modal
  const MysteryEventModal = () => {
    if (!currentEvent) return null;
    return (
      <Dialog open={!!currentEvent} onOpenChange={() => setCurrentEvent(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentEvent.title || 'Mysterious Event'}</DialogTitle>
            <DialogDescription>{currentEvent.description}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            {currentEvent.choices && Object.entries(currentEvent.choices).map(([choice, label]) => (
              <Button key={choice} onClick={() => handleEventChoice(choice)} aria-label={`Choose ${label}`}>{label}</Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Defensive fallback: ensure grid is always initialized
  useEffect(() => {
    if (!Array.isArray(grid) || grid.length === 0 || !Array.isArray(grid[0]) || grid[0].length === 0) {
      // Try to load the grid from localStorage, then initial grid
      loadGridFromLocalStorage().then((initialGrid) => {
        setGrid(initialGrid);
        setIsLoading(false);
      }).catch(() => {
        setGrid(createBaseGrid());
        setIsLoading(false);
      });
    }
  }, [grid, supabase, userId, isGuest]);

  // Real-time subscription for realm grid changes
  useEffect(() => {
    if (!supabase || !userId || isGuest) return;

    console.log('Setting up real-time subscription for realm grid changes...');

    const gridSubscription = supabase
      .channel('realm-grid-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'realm_grids',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Real-time grid change received:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            // Grid was updated on another device
            const numericGrid = payload.new['grid'];
            if (numericGrid && Array.isArray(numericGrid)) {
              // Convert numeric grid back to Tile grid
              const tileGrid: Tile[][] = numericGrid.map((row: number[], y: number) =>
                row.map((numeric: number, x: number) => createTileFromNumeric(numeric, x, y))
              );
              
              setGrid(tileGrid);
              
              toast({
                title: "Realm Updated",
                description: "Your realm has been updated from another device.",
                duration: 3000
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realm grid real-time subscription...');
      supabase.removeChannel(gridSubscription);
    };
  }, [supabase, userId, isGuest, toast]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading Your Realm...</div>;
  }
  
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
          <div className="flex gap-4 mb-4 items-center">
            <Button onClick={expandMap} variant="secondary">Expand Map</Button>
            <Button 
              onClick={toggleInventory} 
              variant={showInventory ? "default" : "secondary"}
              className="flex items-center gap-2"
            >
              <span>🪙</span>
              <span>Inventory</span>
            </Button>
            <Button 
              onClick={() => setMinimapSwitch(!minimapSwitch)} 
              variant={minimapSwitch ? "default" : "secondary"}
              className="flex items-center gap-2"
            >
              <span>🗺️</span>
              <span>Minimap</span>
            </Button>
            {/* Movement/Build Mode Toggle Switch */}
            <button
              type="button"
              aria-label="Toggle Movement/Build Mode"
              className={`relative w-14 h-8 flex items-center rounded-full transition-colors duration-300 focus:outline-none ${movementMode === 'normal' ? 'bg-amber-600' : 'bg-gray-700'}`}
              onClick={() => setMovementMode(movementMode === 'normal' ? 'portal' : 'normal')}
            >
              <span
                className={`absolute left-1 top-1 w-6 h-6 flex items-center justify-center rounded-full bg-white shadow transition-transform duration-300 ${movementMode === 'normal' ? 'translate-x-6' : ''}`}
              >
                {movementMode === 'normal' ? '🐴' : '🛠️'}
              </span>
            </button>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" aria-label="Open Settings">
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Realm Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Fullscreen Mode</span>
                    <Switch checked={isFullscreen} onCheckedChange={setIsFullscreen} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Show Grid Coordinates</span>
                    <Switch checked={showGridCoordinates} onCheckedChange={setShowGridCoordinates} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Auto-save</span>
                    <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                  </div>
                  <Button variant="destructive" onClick={handleReset} className="w-full">
                    Reset Realm
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {/* --- Render the grid --- */}
          <div className="my-8">
            {(!Array.isArray(grid) || grid.length === 0 || !Array.isArray(grid[0]) || grid[0].length === 0) ? (
              <div>
                <h2>No grid data found. Showing fallback.</h2>
              </div>
            ) : (
              <MapGrid
                grid={grid}
                character={characterPosition || defaultCharacterPosition}
                onCharacterMove={handleCharacterMove}
                onTileClick={(x, y) => {
                  if (movementMode !== 'normal' && selectedTile && inventory) {
                    const newGrid = grid.map(row => row.slice());
                    if (newGrid[y]) {
                      const tileToPlace = { ...selectedTile, x, y };
                      newGrid[y][x] = tileToPlace;
                      setGrid(newGrid);
                      // Decrement inventory
                      const updatedInventory = { ...inventory };
                      const inventoryItem = updatedInventory[tileToPlace.type];
                      if (
                        updatedInventory &&
                        tileToPlace &&
                        inventoryItem &&
                        typeof inventoryItem.quantity === 'number' &&
                        inventoryItem.quantity > 0
                      ) {
                        inventoryItem.quantity -= 1;
                        setInventory(updatedInventory);
                      }
                    }
                  }
                }}
                selectedTile={selectedTile}
                isMovementMode={movementMode === 'normal'}
                onGridUpdate={setGrid}
                hoveredTile={hoveredTile ? { row: hoveredTile.y, col: hoveredTile.x } : null}
                setHoveredTile={(tile) => setHoveredTile(tile ? { x: tile.col, y: tile.row } : null)}
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
                setCurrentLocation={(loc) => {
                  if (loc && !('description' in loc)) {
                    const desc = realmLocationData[loc.name]?.description || '';
                    setCurrentLocation({ ...loc, description: desc });
                  } else {
                    setCurrentLocation(loc as any);
                  }
                }}
                isSyncing={isSyncing}
                syncError={syncError}
                saveStatus={saveStatus === 'saved' ? 'success' : saveStatus}
                lastSaveTime={lastSaveTime ? (typeof lastSaveTime === 'string' ? lastSaveTime : lastSaveTime.toISOString()) : null}
                saveError={saveError}
                retryCount={retryCount}
                tileCounts={tileCounts}
                setTileCounts={setTileCounts}
                onGoldUpdate={handleGoldUpdate}
                onExperienceUpdate={handleExperienceUpdate}
                onQuestCompletion={handleQuestCompletion}
                horsePos={horsePosition}
                sheepPos={sheepPosition}
                eaglePos={eaglePosition}
                penguinPos={penguinPosition}
                isHorsePresent={isHorsePresent}
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
                <div className="flex items-center justify-end p-4 border-b border-gray-200 dark:border-gray-800">
                  <Button variant="ghost" onClick={toggleInventory} aria-label="Close Inventory">✕</Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <TileInventory
                    tiles={Object.values(inventory)
                      .filter(tile => tile.type !== 'empty' && (tile.quantity || 0) > 0)
                      as TileInventoryItem[]}
                    selectedTile={selectedTile}
                    onSelectTile={handleTileSelection}
                    onUpdateTiles={(tiles) => {
                      // Convert InventoryItem[] to Record<TileType, Tile>
                      const record: Record<TileType, Tile> = { ...inventory };
                      tiles.forEach(tile => {
                        record[tile.type] = tile as Tile;
                      });
                      setInventory(record);
                    }}
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
              entities={[]}
              zoom={minimapZoom}
              onZoomChange={setMinimapZoom}
              rotationMode={minimapRotationMode}
              onRotationModeChange={setMinimapRotationMode}
              onClose={() => setMinimapSwitch(false)}
            />
          )}
          <LocationModal />
          <MysteryEventModal />
          {showHorseCaughtModal && caughtHorse && (
            <Dialog open={showHorseCaughtModal} onOpenChange={setShowHorseCaughtModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Horse Caught!</DialogTitle>
                </DialogHeader>
                <div className="text-center text-lg mb-4">You caught a wild stallion: <b>{caughtHorse.name}</b></div>
                <div className="flex justify-center mb-4">
                  <img src={caughtHorse.image} alt={caughtHorse.name} width={96} height={96} />
                </div>
                <Button onClick={handleHorseCaughtOk} className="w-full">OK</Button>
              </DialogContent>
            </Dialog>
          )}
          {showPortalModal && portalSource && (
            <Dialog open={showPortalModal} onOpenChange={setShowPortalModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Portal</DialogTitle>
                  <DialogDescription>
                    {portalSource.type === 'portal-entrance'
                      ? 'Do you want to enter the portal?'
                      : 'Do you want to exit the portal?'}
                  </DialogDescription>
                </DialogHeader>
                <Button
                  autoFocus
                  onClick={handlePortalEnter}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handlePortalEnter();
                  }}
                  className="w-full"
                >
                  Enter Portal
                </Button>
                <Button
                  variant="secondary"
                  onClick={handlePortalLeave}
                  className="w-full mt-2"
                >
                  Cancel
                </Button>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
}