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
import { TileType, Tile, TileItem } from '@/types/tiles'
import { useCreatureStore } from "@/stores/creatureStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, Trash2 } from "lucide-react"
import { useCreatureUnlock } from "@/lib/hooks/use-creature-unlock"
import { MapGrid } from '../../components/map-grid'
import { TileInventory } from '@/components/tile-inventory'
import { Switch } from "@/components/ui/switch"
import { generateMysteryEvent, handleEventOutcome, getScrollById } from "@/lib/mystery-events"
import { MysteryEvent } from '@/lib/mystery-events'
import { MysteryEventType } from '@/lib/mystery-events'
import { addToInventory, addToKingdomInventory } from "@/lib/inventory-manager"
import { TileEditor } from '@/components/tile-editor'
import { createTilePlacement } from '@/lib/api'
import { nanoid } from 'nanoid'
import { Minimap } from "@/components/Minimap"
import { MinimapEntity, MinimapRotationMode } from "@/types/minimap"
import { useAchievementStore } from '@/stores/achievementStore'
import { loadInitialGrid, createTileFromNumeric, numericToTileType } from "@/lib/grid-loader"
import { getLatestGrid, uploadGridData, updateGridData, subscribeToGridChanges, createQuestCompletion, getQuestCompletions } from '@/lib/api'
import { useAuth } from "@/components/providers"

// Types
interface Position {
  x: number
  y: number
}

interface TileCounts {
  forestPlaced: number;
  forestDestroyed: number;
  waterPlaced: number;
  mountainDestroyed: number;
  icePlaced: number;
  waterDestroyed: number;
}

interface InventoryItem {
  count: number;
  name: string;
  description: string;
  image: string;
  cost: number;
  type?: string;
  id?: string;
}

interface Inventory {
  [key: string]: InventoryItem;
}

// Create an extended interface for TileItem with x and y coordinates
interface ExtendedTileItem extends TileItem {
  x?: number;
  y?: number;
  image?: string;
}

// Remove empty interface and extend Tile directly where needed
type MapTile = Tile & {
  cityName?: string
  townName?: string
}

// Constants
const GRID_COLS = 12
const INITIAL_ROWS = 7
const ZOOM_LEVELS = [0.5, 1, 1.5, 2]
const AUTOSAVE_INTERVAL = 30000 // 30 seconds

// Initial state
const initialTileInventory: Inventory = {
  grass: { 
    count: 50, 
    name: "Grass", 
    description: "Basic grassland tile", 
    image: "/images/tiles/grass-tile.png",
    cost: 20
  },
  water: { 
    count: 20, 
    name: "Water", 
    description: "Water body tile", 
    image: "/images/tiles/water-tile.png",
    cost: 35
  },
  mountain: { 
    count: 10, 
    name: "Mountain", 
    description: "Mountain tile", 
    image: "/images/tiles/mountain-tile.png",
    cost: 40
  },
  forest: { 
    count: 15, 
    name: "Forest", 
    description: "Forest tile", 
    image: "/images/tiles/forest-tile.png",
    cost: 30
  },
  desert: { 
    count: 12, 
    name: "Desert", 
    description: "Desert tile", 
    image: "/images/tiles/desert-tile.png",
    cost: 25
  },
  ice: { 
    count: 10, 
    name: "Ice", 
    description: "Frozen ice tile", 
    image: "/images/tiles/ice-tile.png",
    cost: 35
  },
  mystery: { 
    count: 5, 
    name: "Mystery", 
    description: "Unknown mysterious tile", 
    image: "/images/tiles/mystery-tile.png",
    cost: 40
  },
  city: { 
    count: 3, 
    name: "City", 
    description: "Large urban settlement", 
    image: "/images/tiles/city-tile.png",
    cost: 50
  },
  town: { 
    count: 5, 
    name: "Town", 
    description: "Small settlement", 
    image: "/images/tiles/town-tile.png",
    cost: 45
  }
}

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
  }
}

// Function to create initial grid
const createInitialGrid = async (): Promise<Tile[][]> => {
  try {
    console.log('Loading initial grid...')
    const { grid: numericGrid } = await loadInitialGrid()
    console.log('Numeric grid loaded:', numericGrid)
    
    const tileGrid = numericGrid.map((row, y) =>
      row.map((numeric, x) => {
        const tile = createTileFromNumeric(numeric, x, y)
        console.log(`Created tile at (${x},${y}):`, tile)
        return tile
      })
    )
    console.log('Final tile grid created:', tileGrid)
    return tileGrid
  } catch (error) {
    console.error('Error creating initial grid:', error)
    // Fallback to empty grid if loading fails
    console.log('Creating fallback empty grid...')
    const fallbackGrid = Array(8).fill(null).map((_, y) =>
      Array(GRID_COLS).fill(null).map((_, x) => ({
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
        image: '/images/tiles/empty-tile.png'
      }))
    )
    console.log('Fallback grid created:', fallbackGrid)
    return fallbackGrid
  }
}

export default function RealmPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { handleUnlock } = useCreatureUnlock()
  const gridRef = useRef<HTMLDivElement>(null)
  const { updateProgress } = useAchievementStore()
  const creatureStore = useCreatureStore()

  // Use session and supabase from useAuth
  const { session, isLoading: isAuthLoading, supabase } = useAuth()

  // State declarations
  const [inventory, setInventory] = useLocalStorage<Inventory>("tile-inventory", initialTileInventory)
  const [showScrollMessage, setShowScrollMessage] = useState(false)
  const [characterPosition, setCharacterPosition] = useLocalStorage<Position>("character-position", { x: 2, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedTile, setSelectedTile] = useState<ExtendedTileItem | null>(null)
  const [grid, setGrid] = useState<Tile[][]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<MysteryEvent | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ type: string; name: string; description: string } | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [movementMode, setMovementMode] = useState(true)
  const [hoveredTile, setHoveredTile] = useState<{ row: number; col: number } | null>(null)
  const [gridId, setGridId] = useState<string | null>(null); // State for grid ID

  // Add tileCounts state
  const [tileCounts, setTileCounts] = useLocalStorage<TileCounts>("tile-counts", {
    forestPlaced: 0,
    forestDestroyed: 0,
    waterPlaced: 0,
    mountainDestroyed: 0,
    icePlaced: 0,
    waterDestroyed: 0
  })

  // Add missing state declarations
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [achievementDetails, setAchievementDetails] = useState<{
    creatureName: string;
    requirement: string;
  } | null>(null);

  // Add showInventory state
  const [showInventory, setShowInventory] = useState(false);

  // Add eventDialogOpen state
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  // Add showTileEditor state
  const [showTileEditor, setShowTileEditor] = useState(false)

  // Add a local state for the minimap switch UI only
  const [minimapSwitch, setMinimapSwitch] = useState(false)
  const [minimapZoom, setMinimapZoom] = useState(2.5)
  const [minimapRotationMode, setMinimapRotationMode] = useState<MinimapRotationMode>("static")

  // Example: gather entities for the minimap (NPCs, enemies, landmarks)
  const minimapEntities: MinimapEntity[] = [
    // Example: Place a landmark at (5,5), an enemy at (3,2), and an NPC at (7,1)
    { id: "landmark-1", type: "landmark", position: { x: 5, y: 5 }, icon: "⭐", color: "#fbbf24" },
    { id: "enemy-1", type: "enemy", position: { x: 3, y: 2 }, icon: "👾", color: "#f87171" },
    { id: "npc-1", type: "npc", position: { x: 7, y: 1 }, icon: "🧑", color: "#60a5fa" },
  ]

  // In state declarations, add questCompletedCount
  const [questCompletedCount, setQuestCompletedCount] = useLocalStorage<number>("quest-completed-count", 0);

  // Add Supabase sync state
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  // Effect to initialize grid based on authentication status
  useEffect(() => {
    const initializeGrid = async () => {
      setIsLoading(true);
      let loadedGrid: Tile[][] = [];
      let loadedGridId: string | null = null;

      // Check for the skip-auth cookie
      const skipAuthCookie = typeof document !== 'undefined' ? document.cookie.split(';').find(c => c.trim().startsWith('skip-auth=')) : null;
      const isSkippingAuth = skipAuthCookie ? skipAuthCookie.split('=')[1] === 'true' : false;

      if (isSkippingAuth) {
        console.log('Skipping authentication, creating initial grid...');
        loadedGrid = await createInitialGrid();
      } else if (session?.user?.id && supabase) {
        // Attempt to load grid from Supabase for authenticated users
        console.log('Attempting to load grid from Supabase for user:', session.user.id);
        try {
          // Verify session is still valid
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session verification failed:', sessionError);
            throw new Error('Failed to verify session');
          }

          if (!currentSession) {
            console.error('No active session found');
            throw new Error('Session expired or invalid');
          }

          const savedGridData = await getLatestGrid(supabase, session.user.id);

          if (savedGridData && savedGridData.grid) {
            console.log('Successfully loaded grid from Supabase.');
            // Convert numeric grid to tile grid using the grid-loader function
            loadedGrid = savedGridData.grid.map((row, y) =>
              row.map((numeric, x) => createTileFromNumeric(numeric, x, y))
            );
            loadedGridId = savedGridData.id;
          } else {
            console.log('No saved grid found, creating initial grid...');
            loadedGrid = await createInitialGrid();
            // Upload the initial grid
            const numericGrid = loadedGrid.map(row => 
              row.map(tile => {
                const numericValue = Object.entries(numericToTileType).find(
                  ([_, value]) => value === tile.type
                )?.[0];
                return numericValue ? parseInt(numericValue, 10) : 0;
              })
            );
            const uploadResult = await uploadGridData(supabase, numericGrid, session.user.id);
            if (uploadResult) {
              loadedGridId = uploadResult.id;
            }
          }
        } catch (error) {
          console.error('Error loading or creating grid:', error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to load your realm. Creating a new one...",
            variant: "destructive"
          });
          loadedGrid = await createInitialGrid();
        }
      } else {
        // For non-authenticated users, create a new grid
        console.log('No authenticated user, creating initial grid...');
        loadedGrid = await createInitialGrid();
      }

      setGrid(loadedGrid);
      setGridId(loadedGridId);
      setIsLoading(false);
    };

    initializeGrid();
  }, [session?.user?.id, supabase, toast]);

  // Effect to save grid to database for authenticated users or local storage for anonymous users
  useEffect(() => {
    // Wait until initialized to save
    if (!isInitialized) return;

    // Check for the skip-auth cookie directly in this effect for anonymous saving
    const skipAuthCookie = typeof document !== 'undefined' ? document.cookie.split(';').find(c => c.trim().startsWith('skip-auth=')) : null;
    const isSkippingAuth = skipAuthCookie ? skipAuthCookie.split('=')[1] === 'true' : false;

    if (isSkippingAuth) {
       // Save to local storage if skipping auth (anonymous)
      console.log('Saving grid to local storage (anonymous mode)...');
      localStorage.setItem('grid', JSON.stringify(grid));
    } else if (session?.user?.id && gridId && supabase) { // Ensure supabase is available
      // Save to Supabase if authenticated and gridId exists
      console.log('Saving grid to Supabase for user:', session.user.id, 'gridId:', gridId);
      const saveGameData = async () => {
        try {
           // Convert tile grid to numeric grid for storage if necessary (updateGridData expects number[][])
           const numericGrid = grid.map(row =>
             row.map(tile => {
               const tileType = tile.type;
               const numericType = Number(Object.entries(numericToTileType).find(([_, value]) =>
                 value === tileType
               )?.[0] || 0);
               return numericType;
             })
           );
          // Pass the supabase client to updateGridData
          await updateGridData(supabase, gridId, numericGrid, session.user.id);
           console.log('Grid saved successfully to Supabase.');
        } catch (error) {
          console.error('Error saving grid to Supabase:', error);
          toast({ title: "Error", description: "Failed to save game progress.", variant: "destructive" });
        }
      };

      // Implement autosave or save on specific actions (e.g., button click, tile placement)
      // For now, saving on every grid change after initialization if authenticated
       // A better approach might involve debouncing or a dedicated save button/interval
      saveGameData();
    } else if (isInitialized && session?.user?.id && !gridId && supabase) { // Handle case where authenticated user has no grid yet and needs initial upload
       console.log('User authenticated but no gridId, attempting initial upload...');
        const uploadInitialGrid = async () => {
          try {
             const numericGrid = grid.map(row =>
               row.map(tile => {
                 const tileType = tile.type;
                 const numericType = Number(Object.entries(numericToTileType).find(([_, value]) =>
                   value === tileType
                 )?.[0] || 0);
                 return numericType;
               })
             );
             const newGridData = await uploadGridData(supabase, numericGrid, session.user.id);
              setGridId(newGridData?.id || null);
             console.log('Initial grid uploaded and gridId set:', newGridData?.id);
          } catch (error) {
             console.error('Error uploading initial grid on save effect:', error);
             toast({ title: "Error", description: "Failed to upload initial game progress on save attempt.", variant: "destructive" });
          }
        };
        uploadInitialGrid();
    }
  }, [grid, session, isInitialized, gridId, supabase]); // Depend on grid, session, initialization status, gridId, and supabase

  // Effect for real-time subscription (re-add and adjust)
   useEffect(() => {
      // Check for the skip-auth cookie
       const skipAuthCookie = typeof document !== 'undefined' ? document.cookie.split(';').find(c => c.trim().startsWith('skip-auth=')) : null;
       const isSkippingAuth = skipAuthCookie ? skipAuthCookie.split('=')[1] === 'true' : false;

       // Only set up subscription if authenticated and not skipping auth, and gridId and supabase exist
       if (session?.user?.id && gridId && !isSkippingAuth && supabase) {
           console.log('Subscribing to Supabase grid changes for grid:', gridId);
           // Ensure subscribeToGridChanges is implemented to handle real-time updates
            // and that it filters by gridId if possible, or user_id if not
           // Pass the supabase client to subscribeToGridChanges
           const subscription = subscribeToGridChanges(supabase, session.user.id, (payload) => {
               console.log('Supabase real-time update received:', payload);
               // Handle real-time updates, e.g., update the grid state
               // Make sure the payload structure is correct for updating the grid
               if (payload.new && payload.new.grid && payload.new.id === gridId) { // Also check gridId in payload
                    const updatedGrid = payload.new.grid.map((row: number[], y: number) =>
                      row.map((numeric: number, x: number) => createTileFromNumeric(numeric, x, y))
                    );
                    setGrid(updatedGrid);
                    console.log('Grid updated from real-time subscription.');
               } else if (payload.eventType === 'DELETE' && payload.old?.id === gridId) {
                 // Handle case where the grid is deleted remotely (e.g., reset)
                  console.log('Remote grid deleted. Resetting local grid.');
                  // Optionally create a new initial grid or clear the current one
                   createInitialGrid().then(newGrid => setGrid(newGrid));
                    setGridId(null); // Clear gridId as the grid no longer exists
               }
           });

           subscriptionRef.current = subscription;

           return () => {
               console.log('Unsubscribing from Supabase grid changes.');
               supabase.removeChannel(subscription);
               subscriptionRef.current = null;
           };
       } else if (subscriptionRef.current) {
           // Unsubscribe if switching to anonymous mode or logging out, or gridId or supabase is gone
           console.log('Unsubscribing due to state change or supabase absence.');
           subscriptionRef.current.unsubscribe();
           subscriptionRef.current = null;
       }

   }, [session, gridId, isAuthLoading, supabase]); // Depend on session, gridId, auth loading status, and supabase

  // Keep existing useEffect for autosave notification (optional, can remove if saving on change is preferred)
  // useEffect(() => {
  // // ... existing autosave notification logic ...
  // }, []);

  // Ensure this function correctly updates the local state, which triggers the save effect
  const handleGridUpdate = useCallback(async (newGrid: Tile[][]) => {
    setGrid(newGrid);
    // Saving to Supabase/local storage is handled by the useEffect
  }, [setGrid]); // Add setGrid as a dependency if it could change, though unlikely for useState setter

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
    const tileToDelete = grid[y]?.[x];
    if (!tileToDelete) return;

    // Create an empty tile with proper accessibility attributes
    const emptyTile: Tile = {
      id: `empty-${x}-${y}`,
      type: "empty" as TileType,
      name: "Empty Tile",
      description: "An empty space where a new tile can be placed",
      connections: [],
      rotation: 0,
      revealed: true,
      x,
      y,
      ariaLabel: `Empty tile at position ${x}, ${y}`,
      image: "/images/tiles/empty-tile.png"
    };

    // Update the grid with the empty tile
    const newGrid = [...grid];
    if (newGrid[y]) {
      newGrid[y][x] = emptyTile;
      setGrid(newGrid);
    }

    // Update inventory and tile counts
    const updatedInventory = { ...inventory };
    const tileType = tileToDelete.type;
    
    if (!updatedInventory[tileType]) {
      updatedInventory[tileType] = {
        count: 1,
        name: tileToDelete.name || tileType,
        description: tileToDelete.description || `A ${tileType} tile`,
        image: tileToDelete.image || `/images/tiles/${tileType}-tile.png`,
        cost: 0,
        type: tileType
      };
    } else {
      updatedInventory[tileType].count += 1;
    }
    
    setInventory(updatedInventory);

    // Update tile counts for achievements and creature unlocks
    const updatedTileCounts = { ...tileCounts };
    
    // Forest tile destruction (fire creatures)
    if (tileType === "forest") {
      updatedTileCounts.forestDestroyed += 1;
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
      updatedTileCounts.mountainDestroyed += 1;
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
      const newWaterDestroyed = (tileCounts.waterDestroyed || 0) + 1;
      if (newWaterDestroyed >= 1) useCreatureStore.getState().discoverCreature('016'); // Sparky
      if (newWaterDestroyed >= 5) useCreatureStore.getState().discoverCreature('017'); // Boulty
      if (newWaterDestroyed >= 10) useCreatureStore.getState().discoverCreature('018'); // Voulty
      setTileCounts({ ...tileCounts, waterDestroyed: newWaterDestroyed });
    }
    
    setTileCounts(updatedTileCounts);

    // Show toast notification
    toast({
      title: 'Tile Removed',
      description: `The ${tileToDelete.name} has been removed and added to your inventory.`,
      duration: 3000
    });
  };

  // Add useEffect for first realm visit achievement
  useEffect(() => {
    const checkFirstVisit = async () => {
      const hasVisited = localStorage.getItem('has-visited-realm');
      if (!hasVisited) {
        await useCreatureStore.getState().discoverCreature('000');
        await handleAchievementUnlock('000', 'First time exploring the realm');
        localStorage.setItem('has-visited-realm', 'true');
        toast({
          title: '🧪 Achievement Unlocked!',
          description: "First time exploring the realm - Discovered a poisonous creature!"
        });
      }
    };
    checkFirstVisit();
  }, []);

  // Handle tile placement (for grass, water, forest, ice)
  const handleTileClick = async (x: number, y: number) => {
    if (!selectedTile) return;
    const existingTile = grid[y]?.[x];
    if (existingTile && existingTile.type !== 'empty') {
      toast({
        title: 'Invalid placement',
        description: 'You can only place tiles on empty or compatible tiles.',
        variant: 'destructive',
      });
      return;
    }
    const newTile: Tile = {
      id: nanoid(),
      type: selectedTile.type,
      name: selectedTile.name,
      description: selectedTile.description,
      connections: selectedTile.connections,
      rotation: (selectedTile.rotation ?? 0) as 0 | 90 | 180 | 270,
      revealed: true,
      isVisited: false,
      x,
      y,
      ariaLabel: `${selectedTile.name || selectedTile.type} tile at position ${x},${y}`,
      image: selectedTile.image || '/images/tiles/empty-tile.png'
    };
    const newGrid = grid.map(row => row.map(tile => ({ ...tile })));
    if (newGrid[y]) {
      newGrid[y][x] = newTile;
      setGrid(newGrid);
    }
    setInventory(prev => {
      const newInventory = { ...prev };
      if (newInventory[selectedTile.type]) {
        newInventory[selectedTile.type].count--;
        if (newInventory[selectedTile.type].count <= 0) {
          delete newInventory[selectedTile.type];
        }
      }
      return newInventory;
    });

    // Creature unlocks for placement
    if (selectedTile.type === 'forest') {
      const newCount = (tileCounts.forestPlaced || 0) + 1;
      if (newCount >= 1) useCreatureStore.getState().discoverCreature('007'); // Leaf
      if (newCount >= 5) useCreatureStore.getState().discoverCreature('008'); // Oaky
      if (newCount >= 10) useCreatureStore.getState().discoverCreature('009'); // Seqoio
      setTileCounts({ ...tileCounts, forestPlaced: newCount });
    } else if (selectedTile.type === 'water') {
      const newCount = (tileCounts.waterPlaced || 0) + 1;
      if (newCount >= 1) useCreatureStore.getState().discoverCreature('004'); // Dolphio
      if (newCount >= 5) useCreatureStore.getState().discoverCreature('005'); // Divero
      if (newCount >= 10) useCreatureStore.getState().discoverCreature('006'); // Flippur
      setTileCounts({ ...tileCounts, waterPlaced: newCount });
    } else if (selectedTile.type === 'ice') {
      const newCount = (tileCounts.icePlaced || 0) + 1;
      if (newCount >= 1) useCreatureStore.getState().discoverCreature('013'); // Icey
      if (newCount >= 5) useCreatureStore.getState().discoverCreature('014'); // Blizzey
      if (newCount >= 10) useCreatureStore.getState().discoverCreature('015'); // Hailey
      setTileCounts({ ...tileCounts, icePlaced: newCount });
    }

    try {
      // createTilePlacement calls the API route, which handles server-side auth
      await createTilePlacement(newTile.type, x, y);
    } catch (error) {
      let errorMessage = 'Failed to save tile placement, but it was placed locally.';
      if (error instanceof Error && (error as any).status === 409) {
        errorMessage = 'A tile already exists at this position.';
      }
      toast({
        title: 'Warning',
        description: errorMessage,
        variant: 'default',
        className: 'bg-yellow-900 text-white',
      });
    }
  };

  // 1. Create handleCharacterMove in RealmPage
  const handleCharacterMove = useCallback((newX: number, newY: number) => {
    setCharacterPosition({ x: newX, y: newY });
    const tile = grid[newY]?.[newX];
    if (tile && (tile.type === 'city' || tile.type === 'town')) {
      const locationInfo = locationData[tile.type];
      setCurrentLocation({
        type: tile.type,
        name: locationInfo.name,
        description: locationInfo.description
      });
      setShowLocationModal(true);
    }
  }, [setCharacterPosition, grid]);

  // 2. Use handleCharacterMove in keyboard navigation
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
      const targetTile = grid[newY]?.[newX];
      if (!targetTile || targetTile.type === 'empty') {
        toast({
          title: "Cannot Move",
          description: "You cannot move onto an empty tile!",
          variant: "destructive"
        });
        return;
      }
      if (newX !== x || newY !== y) {
        handleCharacterMove(newX, newY);
        const clickedTile = grid[newY]?.[newX];
        if (movementMode && clickedTile?.type === "mystery" && !clickedTile.isVisited) {
          const mysteryEvent = generateMysteryEvent();
          setCurrentEvent(mysteryEvent);
          const newGrid = [...grid];
          if (newGrid[newY]) {
            newGrid[newY][newX] = {
              ...clickedTile,
              isVisited: true
            };
            setGrid(newGrid);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [characterPosition, grid, handleCharacterMove, movementMode, toast]);

  // Update handleAchievementUnlock to be async and handle state properly
  const handleAchievementUnlock = async (creatureId: string, requirement: string) => {
    try {
      const creatureStore = useCreatureStore.getState()
      const creature = creatureStore.creatures.find(c => c.id === creatureId)
      
      if (!creature) {
        console.error('Creature not found:', creatureId)
        return
      }

      console.log('Unlocking achievement for:', creature.name) // Debug log

      // Set achievement details and show modal
      setAchievementDetails({
        creatureName: creature.name,
        requirement: requirement
      })
      setShowAchievementModal(true)
    } catch (error) {
      console.error('Error in handleAchievementUnlock:', error)
    }
  }

  // Handle inventory updates
  const handleInventoryUpdate = (updatedTiles: any[]) => {
    const newInventory = { ...inventory }
    updatedTiles.forEach(tile => {
      if (newInventory[tile.type]) {
        newInventory[tile.type].count = tile.quantity
      }
    })
    setInventory(newInventory)
    toast({
      title: "Inventory Updated",
      description: "Your tile inventory has been updated.",
      variant: "default"
    })
  }

  // Handle location visit
  const handleVisitLocation = () => {
    console.log('handleVisitLocation called'); // Debug log
    if (!currentLocation) {
      console.log('No currentLocation, returning'); // Debug log
      return;
    }
    console.log('Current location:', currentLocation); // Debug log
    
    setShowLocationModal(false);
    
    // Ensure router is available
    if (!router) {
      console.error('Router is not available');
      return;
    }

    // Route based on location type
    let targetPath = '';
    if (currentLocation.type === 'city') {
      const citySlug = locationData.city.name.toLowerCase().replace(/\s+/g, '-');
      targetPath = `/city/${citySlug}`;
    } else if (currentLocation.type === 'town') {
      const townSlug = locationData.town.name.toLowerCase().replace(/\s+/g, '-');
      targetPath = `/town/${townSlug}`;
    }

    if (targetPath) {
      console.log('Navigating to:', targetPath); // Debug log
      router.push(targetPath);
    } else {
      console.error('No target path generated for navigation'); // Debug log
    }
  };

  // Fix the image rendering for empty tiles
  const getTileImage = (tile: Tile) => {
    if (tile.type === 'empty') {
      return '/images/tiles/empty-tile.png' // Default empty tile image
    }
    return inventory[tile.type]?.image || '/images/tiles/empty-tile.png'
  }

  const getTileName = (tile: Tile) => {
    if (tile.type === 'empty') {
      return 'Empty Tile'
    }
    return inventory[tile.type]?.name || 'Unknown Tile'
  }

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
    try {
      const newGrid = await createInitialGrid();
      setGrid(newGrid);
      setCharacterPosition({ x: 2, y: 0 });
      setTileCounts({
        forestPlaced: 0,
        forestDestroyed: 0,
        waterPlaced: 0,
        mountainDestroyed: 0,
        icePlaced: 0,
        waterDestroyed: 0
      });
      setInventory(initialTileInventory);
      localStorage.removeItem('character-position');
      localStorage.removeItem('tile-counts');
      localStorage.removeItem('tile-inventory');
      console.log('Grid after reset:', newGrid);
      toast({
        title: "Reset Complete",
        description: "Map and counters have been reset to their initial state.",
      });
    } catch (error) {
      console.error('Error resetting grid:', error);
      toast({
        title: 'Reset Failed',
        description: 'There was an error resetting the map. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleHoverTile = (x: number, y: number) => {
    setHoveredTile({ row: y, col: x });
  };

  const handleTileSelection = (tile: ExtendedTileItem | null) => {
    if (!tile) {
      setSelectedTile(null)
      return
    }
    
    setSelectedTile({
      id: tile.id,
      type: tile.type,
      name: tile.name,
      description: tile.description,
      connections: tile.connections,
      cost: tile.cost,
      quantity: tile.quantity,
      x: tile.x || 0,
      y: tile.y || 0,
      image: tile.image || '/images/tiles/empty-tile.png'
    })
  }

  // Handle inventory toggle
  const toggleInventory = useCallback(() => {
    setShowInventory((prev) => {
      const newValue = !prev;
      if (newValue) {
        // Switch to build mode when opening inventory
        setMovementMode(false);
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
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleInventory]);

  // Add these function declarations near the top of the RealmPage component
  const handleGoldUpdate = (amount: number) => {
    // TODO: Implement gold update logic
    console.log('Gold updated by:', amount);
  };

  const handleExperienceUpdate = (amount: number) => {
    // TODO: Implement experience update logic
    console.log('Experience updated by:', amount);
  };

  // Convert inventory to TileItems for the editor
  const inventoryToTileItems = (): ExtendedTileItem[] => {
    return Object.entries(inventory).map(([type, item]) => ({
      id: `${type}-${Date.now()}`,
      type: type as TileType,
      name: item.name,
      description: item.description,
      cost: item.cost,
      quantity: item.count,
      connections: [],
      x: 0,
      y: 0,
      image: item.image || '/images/tiles/empty-tile.png'
    }))
  }

  // Update inventory from TileItems
  const updateInventoryFromTileItems = (tileItems: ExtendedTileItem[]) => {
    const newInventory = { ...inventory }
    
    tileItems.forEach(item => {
      if (newInventory[item.type]) {
        newInventory[item.type] = {
          ...newInventory[item.type],
          count: item.quantity,
          name: item.name,
          description: item.description,
          cost: item.cost,
          image: item.image || '/images/tiles/empty-tile.png'
        }
      }
    })
    
    setInventory(newInventory)
    toast({
      title: "Inventory Updated",
      description: "Your tile inventory has been updated.",
      variant: "default"
    })
  }

  // Update the handleEventChoice function
  const handleEventChoice = async (choice: string) => {
    if (!currentEvent) return;

    const choiceIndex = currentEvent.choices.indexOf(choice);
    if (choiceIndex === -1) return;

    toast({
      title: 'Event Outcome',
      description: currentEvent.outcomes[choice].message
    });

    if (currentEvent.outcomes[choice].reward) {
      const reward = currentEvent.outcomes[choice].reward;
      switch (reward.type) {
        case 'gold':
          if (reward.amount) {
            handleGoldUpdate(reward.amount);
          }
          break;
        case 'experience':
          if (reward.amount) {
            handleExperienceUpdate(reward.amount);
          }
          break;
        case 'scroll':
          if (reward.scroll) {
            const scrollItem = {
              id: reward.scroll.id,
              type: 'scroll' as const,
              name: reward.scroll.name,
              description: reward.scroll.content,
              quantity: 1,
              category: reward.scroll.category,
              stats: {}, // Ensure stats property exists
            };
            addToInventory(scrollItem);
            addToKingdomInventory(scrollItem);
            switch (reward.scroll.category) {
              case 'might':
                handleAchievementUnlock('WARRIOR_SCROLL', 'Discovered Battle Sage!');
                break;
              case 'knowledge':
                handleAchievementUnlock('SCHOLAR_SCROLL', 'Discovered Scroll Keeper!');
                break;
              case 'exploration':
                handleAchievementUnlock('EXPLORER_SCROLL', 'Discovered Path Finder!');
                break;
              case 'social':
                handleAchievementUnlock('DIPLOMAT_SCROLL', 'Discovered Trade Master!');
                break;
              case 'crafting':
                handleAchievementUnlock('ARTISAN_SCROLL', 'Discovered Master Smith!');
                break;
            }
          }
          break;
        case 'item':
          if (reward.item) {
            const itemObj = {
              id: reward.item.id,
              type: 'item' as const,
              name: reward.item.name,
              description: reward.item.description,
              quantity: reward.item.quantity,
              category: reward.item.category,
              stats: {}, // Ensure stats property exists
            };
            addToInventory(itemObj);
            addToKingdomInventory(itemObj);
            if (reward.item.category === 'artifact') {
              handleAchievementUnlock('RELIC_GUARDIAN', 'Discovered Relic Guardian!');
            } else if (reward.item.type === 'scroll') {
              handleAchievementUnlock('TOME_KEEPER', 'Discovered Tome Keeper!');
            }
          }
          break;
      }
    }

    // Mark the tile as visited
    const newGrid = [...grid];
    const { x, y } = characterPosition;
    if (newGrid[y]?.[x]) {
      newGrid[y][x] = { ...newGrid[y][x], isVisited: true };
      setGrid(newGrid);
      localStorage.setItem('grid', JSON.stringify(newGrid));
    }

    // Close the event dialog
    setCurrentEvent(null);
  };

  // 1. Add the expandMap function inside RealmPage
  const expandMap = () => {
    setGrid((prevGrid) => {
      const newRows = [];
      const yStart = prevGrid.length;
      for (let i = 0; i < 3; i++) {
        const y = yStart + i;
        const row = [];
        for (let x = 0; x < GRID_COLS; x++) {
          if (x === 0 || x === GRID_COLS - 1) {
            row.push({
              id: `tile-${x}-${y}`,
              type: 'mountain' as TileType,
              name: 'Mountain Tile',
              description: 'A towering mountain',
              connections: [],
              rotation: 0 as 0 | 90 | 180 | 270,
              revealed: true,
              isVisited: false,
              x,
              y,
              ariaLabel: `Mountain tile at position ${x},${y}`,
              image: '/images/tiles/mountain-tile.png',
            });
          } else {
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
            });
          }
        }
        newRows.push(row);
      }
      return [...prevGrid, ...newRows];
    });
  };

  // Add a function to handle quest completion and unlock dragon creatures
  const handleQuestCompletion = async () => {
    if (!session?.user?.id || !supabase) return; // Ensure user and supabase are available
    const newCount = questCompletedCount + 1;
    if (newCount >= 100) useCreatureStore.getState().discoverCreature('101'); // Drakon
    if (newCount >= 500) useCreatureStore.getState().discoverCreature('102'); // Fireon
    if (newCount >= 1000) useCreatureStore.getState().discoverCreature('103'); // Valerion
    setQuestCompletedCount(newCount);
    try {
      // Pass the supabase client to createQuestCompletion
      await createQuestCompletion(supabase, 'completion', 'Quest Completed'); // Example values
      console.log('Quest completion recorded in Supabase.');
    } catch (error) {
      console.error('Failed to record quest completion:', error);
      toast({ title: "Error", description: "Failed to save quest progress.", variant: "destructive" });
    }
  };

  if (isLoading || isAuthLoading || !supabase) { // Also wait for supabase client
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading your realm...</h2>
          <p className="text-gray-500">Please wait while we prepare your kingdom.</p>
        </div>
      </div>
    )
  }

  // Add debug log before returning JSX
  console.log('Current grid state:', grid);

  return (
    <div className="relative min-h-screen bg-background p-4">
      {/* Add sync status indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {isSyncing && (
          <div className="text-amber-500 text-sm flex items-center gap-1">
            <div className="animate-spin h-4 w-4 border-2 border-amber-500 rounded-full border-t-transparent"></div>
            Syncing...
          </div>
        )}
        {/* Conditionally hide syncError if SKIP_AUTH is true */}
        {syncError && process.env.NEXT_PUBLIC_SKIP_AUTH !== 'true' && (
          <div className="text-red-500 text-sm flex items-center gap-1">
            ⚠️ {syncError}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Expand Map Button */}
          <button
            type="button"
            aria-label="Expand Map"
            onClick={expandMap}
            className="relative w-32 h-8 rounded-full border border-amber-800/40 bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 flex items-center justify-center mr-2"
            style={{ minWidth: 100 }}
          >
            <span className="text-amber-400 font-semibold">Expand Map</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={movementMode ? "Switch to Build Mode" : "Switch to Movement Mode"}
              onClick={() => setMovementMode((prev) => !prev)}
              className={
                `relative w-14 h-8 rounded-full border border-amber-800/40 bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 flex items-center`}
              style={{ minWidth: 56 }}
            >
              <span
                className={
                  `absolute top-1 left-1 w-6 h-6 rounded-full bg-white flex items-center justify-center text-xl shadow transition-transform duration-200 ${movementMode ? 'translate-x-0' : 'translate-x-6'}`
                }
                style={{ pointerEvents: 'none' }}
              >
                {movementMode ? '🐎' : '🛠️'}
              </span>
              {/* Visually hidden labels for accessibility */}
              <span className="sr-only">{movementMode ? 'Movement Mode' : 'Build Mode'}</span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Inventory Switch with Bag Emoji */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={showInventory ? "Hide Inventory" : "Show Inventory"}
              onClick={toggleInventory}
              className="relative w-14 h-8 rounded-full border border-amber-800/40 bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 flex items-center"
              style={{ minWidth: 56 }}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white flex items-center justify-center text-xl shadow transition-transform duration-200 ${showInventory ? 'translate-x-6' : 'translate-x-0'}`}
                style={{ pointerEvents: 'none' }}
              >
                <span className={showInventory ? '' : 'opacity-40'}>👜</span>
              </span>
              <span className="sr-only">{showInventory ? 'Inventory On' : 'Inventory Off'}</span>
            </button>
            <label
              htmlFor="inventory-switch"
              className="text-sm font-medium cursor-pointer select-none"
            >
              Inventory (press 'i')
            </label>
          </div>
          {/* Minimap Switch (UI only, no logic) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={minimapSwitch ? "Hide Minimap" : "Show Minimap"}
              onClick={() => setMinimapSwitch((prev) => !prev)}
              className="relative w-14 h-8 rounded-full border border-amber-800/40 bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 flex items-center"
              style={{ minWidth: 56 }}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white flex items-center justify-center text-xl shadow transition-transform duration-200 ${minimapSwitch ? 'translate-x-6' : 'translate-x-0'}`}
                style={{ pointerEvents: 'none' }}
              >
                <span className={minimapSwitch ? '' : 'opacity-40'}>🗺️</span>
              </span>
              <span className="sr-only">{minimapSwitch ? 'Minimap On' : 'Minimap Off'}</span>
            </button>
            <label className="text-sm font-medium cursor-pointer select-none">
              Minimap
            </label>
          </div>
          {/* Settings Dropdown Menu with Reset Map (rightmost) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-10 w-10 p-0 border border-input hover:bg-accent hover:text-accent-foreground">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { 
                handleReset().catch(error => {
                  console.error('Error in reset:', error);
                  toast({
                    title: "Reset Failed",
                    description: "There was an error resetting the map. Please try again.",
                    variant: "destructive"
                  });
                });
              }}>
                Reset Map
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-4">
        {/* Map Grid */}
        <div className="flex-1">
                <MapGrid
                  grid={grid}
            character={characterPosition}
            onCharacterMove={handleCharacterMove}
            onTileClick={handleTileClick}
            selectedTile={selectedTile ? {
              id: selectedTile.id,
              type: selectedTile.type,
              name: selectedTile.name || selectedTile.type,
              description: selectedTile.description || `${selectedTile.type} tile`,
              connections: selectedTile.connections,
              rotation: 0,
              revealed: true,
              isVisited: false,
              x: selectedTile.x !== undefined ? selectedTile.x : 0,
              y: selectedTile.y !== undefined ? selectedTile.y : 0,
              image: selectedTile.image || '/images/tiles/empty-tile.png'
            } : null}
            onGridUpdate={handleGridUpdate}
            isMovementMode={movementMode}
            onDiscovery={(message) => {
                    toast({
                title: "Discovery",
                description: message
              });
            }}
            onTilePlaced={(tile) => {
              // Handle tile placement
            }}
            onGoldUpdate={(amount) => {
              // Handle gold update
            }}
            onHover={handleHoverTile}
                  onHoverEnd={() => setHoveredTile(null)}
                  hoveredTile={hoveredTile}
            onDeleteTile={(x, y) => {
              const tileType = grid[y][x].type;
              handleTileDelete(x, y);
            }}
          />
                </div>
          </div>

      {/* Tile Inventory Slide-over */}
      <Sheet open={showInventory} onOpenChange={setShowInventory}>
        <SheetContent className="w-[400px] sm:w-[540px] p-0">
          <div className="h-full bg-background">
            <TileInventory
              tiles={Object.entries(inventory).map(([type, item]) => ({
                id: `inventory-${type}`,
                type: type as TileType,
                name: item.name || type,
                description: item.description || `${type} tile`,
                connections: [],
                cost: item.cost,
                quantity: item.count,
                x: -1,
                y: -1,
                image: item.image || '/images/tiles/empty-tile.png'
              }))}
              selectedTile={selectedTile}
              onSelectTile={handleTileSelection}
              onUpdateTiles={handleInventoryUpdate}
            />
              </div>
        </SheetContent>
      </Sheet>

      {/* Event Dialog */}
      {currentEvent && (
        <Dialog open={true} onOpenChange={() => setCurrentEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentEvent.title}</DialogTitle>
              <DialogDescription>{currentEvent.description}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              {currentEvent.choices.map((choice: string, index: number) => (
            <Button
                  key={index}
                  onClick={() => handleEventChoice(choice)}
                  className={index === 0 ? "" : "bg-secondary"}
                >
                  {choice}
              </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Location Dialog */}
      {showLocationModal && currentLocation && (
        <Dialog open={true} onOpenChange={() => setShowLocationModal(false)}>
          <DialogContent>
          <DialogHeader>
              <DialogTitle>{currentLocation.name}</DialogTitle>
              <DialogDescription>{currentLocation.description}</DialogDescription>
          </DialogHeader>
            <DialogFooter>
              <Button onClick={handleVisitLocation}>Visit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {minimapSwitch && (
        <Minimap
          grid={grid}
          playerPosition={characterPosition}
          playerDirection={0}
          entities={minimapEntities}
          zoom={minimapZoom}
          onZoomChange={setMinimapZoom}
          rotationMode={minimapRotationMode}
          onRotationModeChange={setMinimapRotationMode}
          onClose={() => setMinimapSwitch(false)}
        />
      )}
    </div>
  )
}


