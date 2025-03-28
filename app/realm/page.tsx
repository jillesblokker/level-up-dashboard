"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo, useReducer } from "react"
import { 
  ArrowLeft, 
  Save, 
  MapIcon, 
  Compass, 
  BugIcon, 
  User, 
  Plus, 
  Trash, 
  RotateCw, 
  Crown, 
  Clock, 
  ChevronsLeftRight, 
  HelpCircle, 
  ChevronDown, 
  Building, 
  Bell, 
  Settings, 
  ChevronRight, 
  Package, 
  ChevronLeft,
  Mountain,
  Trees,
  Building2,
  Home,
  Sun,
  Crosshair,
  Snowflake,
  Square,
  X
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NavBar } from "@/components/nav-bar"
import { TileVisual } from "@/components/tile-visual"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { GrassTile } from "@/components/tile-visuals/grass-tile"
import { ForestTile } from "@/components/tile-visuals/forest-tile"
import { WaterTile } from "@/components/tile-visuals/water-tile"
import { MountainTile } from "@/components/tile-visuals/mountain-tile"
import { CityTile } from "@/components/tile-visuals/city-tile"
import { DesertTile } from "@/components/tile-visuals/desert-tile"
import { RoadTile } from "@/components/tile-visuals/road-tile"
import { CornerRoadTile } from "@/components/tile-visuals/corner-road-tile"
import { CrossroadTile } from "@/components/tile-visuals/crossroad-tile"
import { SpecialTile } from "@/components/tile-visuals/special-tile"
import { SnowTile } from "@/components/tile-visuals/snow-tile"
import { IntersectionTile } from "@/components/tile-visuals/intersection-tile"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TileInventory } from "@/components/tile-inventory"
import { TileItem } from "@/types/tiles"
import { MapGrid } from "@/components/map-grid"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/database"
import { Tile, TileType, Character, SelectedTile, InventoryTile } from "@/types/tiles"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { TownView } from "@/components/town-view"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useRealm } from "@/lib/realm-context"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { ToastProps } from "@/components/ui/toast"
import { CharacterStats, calculateLevelFromExperience, calculateLevelProgress, calculateExperienceForLevel } from "@/types/character"
import { MapGenerator, generateUserSeed } from "@/lib/map-generator"
import { showScrollToast } from "@/lib/toast-utils"
import { getCharacterName } from "@/lib/toast-utils"
import { TicTacToe } from "@/components/tic-tac-toe"

// Define initial tiles
const initialTiles: InventoryTile[] = [
  {
    id: "grass",
    type: "grass" as TileType,
    name: "Grass Tile",
    description: "A basic grass tile",
    connections: [],
    rotation: 0,
    cost: 5,
    quantity: 50,
    revealed: true
  },
  {
    id: "water",
    type: "water" as TileType,
    name: "Water Tile",
    description: "A water tile",
    connections: [],
    rotation: 0,
    cost: 10,
    quantity: 20,
    revealed: true
  },
  {
    id: "mountain",
    type: "mountain" as TileType,
    name: "Mountain Tile",
    description: "A mountain tile",
    connections: [],
    rotation: 0,
    cost: 20,
    quantity: 10,
    revealed: true
  },
  {
    id: "forest",
    type: "forest" as TileType,
    name: "Forest Tile",
    description: "A forest tile",
    connections: [],
    rotation: 0,
    cost: 15,
    quantity: 15,
    revealed: true
  }
];

// Define initial character position in the second row, second tile from the left
const initialCharacter: Character = {
  x: 1,
  y: 1
};

// Define initial grid with better validation
const createEmptyGrid = (size: number): Tile[][] => {
  if (size < 1) size = 15; // Ensure minimum size
  
  return Array.from({ length: size }, (_, y) => 
    Array.from({ length: size }, (_, x) => ({
      id: `tile-${y}-${x}`,
      type: "empty" as TileType,
      connections: [],
      rotation: 0,
      revealed: true
    }))
  );
};

// Create initial grid with first 5 rows filled
const createInitialGrid = (size: number): Tile[][] => {
  if (size < 1) size = 15; // Ensure minimum size
  
  const grid = createEmptyGrid(size);
  
  // Fill the first 5 rows with grass and mountains on sides
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < size; x++) {
      if (x === 0 || x === size - 1) {
        // Side columns: all mountains
        grid[y][x] = {
          id: `tile-${y}-${x}`,
          type: "mountain" as TileType,
          connections: [],
          rotation: 0,
          revealed: true
        };
      } else {
        // Other tiles in first 5 rows: all grass
        grid[y][x] = {
          id: `tile-${y}-${x}`,
          type: "grass" as TileType,
          connections: [],
          rotation: 0,
          revealed: true
        };
      }
    }
  }

  // Hide remaining rows initially
  for (let y = 5; y < size; y++) {
    for (let x = 0; x < size; x++) {
      grid[y][x] = {
        id: `tile-${y}-${x}`,
        type: "empty" as TileType,
        connections: [],
        rotation: 0,
        revealed: false
      };
    }
  }

  return grid;
};

// Initialize with a larger grid and ensure it's not null
const initialGrid = createInitialGrid(15);

// Update the TileType type to include the new big mystery tile
// type TileType = "empty" | "grass" | "forest" | "water" | "mountain" | "city" | "town" | "desert" | "road" | "corner-road" | "crossroad" | "special" | "mystery" | "big-mystery" | "treasure" | "monster" | "dungeon";

// Define the grid reducer with better validation
const gridReducer = (state: Tile[][], action: { type: string; payload: any }): Tile[][] => {
  // Validate input state
  if (!Array.isArray(state) || state.length === 0) {
    console.error('Invalid state in reducer, resetting...');
    return createInitialGrid(15);
  }

  switch (action.type) {
    case 'UPDATE_GRID': {
      if (!Array.isArray(action.payload) || action.payload.length === 0) {
        console.error('Invalid payload for UPDATE_GRID');
        return state;
      }
      return action.payload as Tile[][];
    }

    case 'SET_GRID': {
      if (!Array.isArray(action.payload) || action.payload.length === 0) {
        console.error('Invalid payload for SET_GRID');
        return state;
      }
      return action.payload as Tile[][];
    }

    case 'UPDATE_TILE': {
      const { x, y, tile } = action.payload;
      if (!tile || typeof tile !== 'object' || !tile.type) {
        console.error('Invalid tile in UPDATE_TILE');
      return state;
  }
      
      const newGrid = state.map(row => [...row]);
      if (!newGrid[y] || !newGrid[y][x]) {
        console.error('Invalid coordinates in UPDATE_TILE');
        return state;
      }
      
      newGrid[y][x] = tile as Tile;
      return newGrid;
    }

    case 'RESET_GRID':
      return createInitialGrid(15);

    default:
      return state;
  }
};

// Add notification type
interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  timestamp: string
}

// Helper function to create notifications
const createNotification = (title: string, message: string, type: string): Notification => ({
  id: Math.random().toString(36).substring(7),
  title,
  message,
  type,
  read: false,
  timestamp: new Date().toISOString()
})

// Helper function to dispatch notifications
const dispatchNotification = (notification: Notification) => {
  const event = new CustomEvent("newNotification", { detail: notification })
  window.dispatchEvent(event)
}

// Update the placeBigMysteryTile function
const placeBigMysteryTile = (x: number, y: number, grid: Tile[][]): Tile[][] => {
  const newGrid = [...grid.map(row => [...row])]; // Deep copy the grid
  
  // Check if we have space for a 2x2 tile
  if (x < grid[0].length - 1 && y < grid.length - 1) {
    // Check if all four tiles are empty or grass
    const canPlaceBigTile = [
      newGrid[y][x].type === "empty" || newGrid[y][x].type === "grass" as TileType,
      newGrid[y][x + 1].type === "empty" || newGrid[y][x + 1].type === "grass" as TileType,
      newGrid[y + 1][x].type === "empty" || newGrid[y + 1][x].type === "grass" as TileType,
      newGrid[y + 1][x + 1].type === "empty" || newGrid[y + 1][x + 1].type === "grass" as TileType
    ].every(Boolean);

    if (canPlaceBigTile) {
      // Place 2x2 big mystery tile
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        newGrid[y + dy][x + dx] = {
          id: `tile-${y + dy}-${x + dx}`,
            type: "big-mystery" as TileType,
            connections: [],
            rotation: 0,
          revealed: true,
            name: "Big Mystery Tile",
            description: "A large mysterious structure waiting to be explored",
          isMainTile: dx === 0 && dy === 0,
            bigMysteryX: x,
            bigMysteryY: y,
            tileSize: 2
          };
        }
      }
      return newGrid;
    }
  }
  return grid;
};

// Add function to generate new rows with mystery tiles
const generateNewRows = (grid: Tile[][], startRow: number): Tile[][] => {
  // Create a deep copy of the grid to preserve existing rows
  const newGrid = grid.map(row => [...row]);
  const size = grid[0].length;

  // Add 5 new rows to the grid
  for (let i = 0; i < 5; i++) {
    const newRow: Tile[] = [];
    
    // Generate tiles for the new row
    for (let x = 0; x < size; x++) {
      if (x === 0 || x === size - 1) {
        // Place mountain tiles on sides
        newRow.push({
          id: `tile-${startRow + i}-${x}`,
          type: "mountain" as TileType,
          connections: [],
          rotation: 0,
          revealed: true
        });
  } else {
        // Place empty tiles in between
        newRow.push({
          id: `tile-${startRow + i}-${x}`,
          type: "empty" as TileType,
          connections: [],
          rotation: 0,
          revealed: true
        });
      }
    }

    // Add mystery tiles (1-3 per row)
    const numMysteryTiles = Math.floor(Math.random() * 3) + 1;
    const possiblePositions = Array.from({ length: size - 2 }, (_, i) => i + 1);
    
    // Shuffle positions
    for (let j = possiblePositions.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [possiblePositions[j], possiblePositions[k]] = [possiblePositions[k], possiblePositions[j]];
    }

    // Place mystery tiles
    for (let j = 0; j < numMysteryTiles; j++) {
      const x = possiblePositions[j];
      // 20% chance for big mystery tile if there's space
      const isBigMystery = Math.random() < 0.2 && 
                          x < size - 2 && 
                          i < 4; // Ensure we have space in the next row
      
      if (isBigMystery) {
        // Place 2x2 big mystery tile if we have space in the next row
        newRow[x] = {
          id: `tile-${startRow + i}-${x}`,
          type: "big-mystery" as TileType,
          connections: [],
          rotation: 0,
          revealed: true,
          name: "Big Mystery Tile",
          description: "A large mysterious structure",
          isMainTile: true,
          bigMysteryX: x,
          bigMysteryY: startRow + i,
          tileSize: 2
        };
        newRow[x + 1] = {
          id: `tile-${startRow + i}-${x + 1}`,
          type: "big-mystery" as TileType,
          connections: [],
          rotation: 0,
          revealed: true,
          isMainTile: false,
          bigMysteryX: x,
          bigMysteryY: startRow + i,
          tileSize: 2
        };
        // Skip the next position since we used it
        j++;
      } else {
        // Place regular mystery tile
        newRow[x] = {
          id: `tile-${startRow + i}-${x}`,
          type: "mystery" as TileType,
          connections: [],
          rotation: 0,
          revealed: true
        };
      }
    }

    // Add the new row to the grid
    newGrid.push(newRow);
  }

  return newGrid;
};

// Add these constants at the top of the file
const MAP_CONFIG = {
  width: 15,
  mysteryTilesPerSection: 3, // 1-5 mystery tiles per section
  sectionSize: 5
};

export default function RealmPage() {
  const { toast } = useToast()
  const [isClient, setIsClient] = useState(false)
  const [goldBalance, setGoldBalance] = useState(1000)
  const [tiles, setTiles] = useState<InventoryTile[]>(initialTiles)
  const [selectedTile, setSelectedTile] = useState<SelectedTile | null>(null)
  const [showCityDialog, setShowCityDialog] = useState(false)
  const [cityName, setCityName] = useState("")
  const [cityPosition, setCityPosition] = useState<{ row: number; col: number } | null>(null)
  const [showCityView, setShowCityView] = useState(false)
  const [selectedCityName, setSelectedCityName] = useState("")
  const [isTown, setIsTown] = useState(false)
  const [hoveredTile, setHoveredTile] = useState<{ row: number; col: number } | null>(null)
  const [grid, dispatchGrid] = useReducer(gridReducer, initialGrid)
  const [visibleRows, setVisibleRows] = useState(5)
  const [visibleCols, setVisibleCols] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const [character, setCharacter] = useState<Character>(initialCharacter)
  const mapRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [showTownModal, setShowTownModal] = useState(false)
  const [currentTownName, setCurrentTownName] = useState("")
  const [currentTownIsTown, setCurrentTownIsTown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLandscape, setIsLandscape] = useState(false)
  const [activeTab, setActiveTab] = useState("map")
  const [showTileInventory, setShowTileInventory] = useState(false)
  const [isMovementMode, setIsMovementMode] = useState(false)
  const [showRiddleModal, setShowRiddleModal] = useState(false)
  const [currentRiddle, setCurrentRiddle] = useState(0)
  const [riddleAnswers, setRiddleAnswers] = useState<boolean[]>([])
  const [showMonsterModal, setShowMonsterModal] = useState(false)
  const [currentMonster, setCurrentMonster] = useState<{ name: string; health: number; } | null>(null)
  const [playerHealth, setPlayerHealth] = useState(100)
  const [showTreasureModal, setShowTreasureModal] = useState(false)
  const [treasureAmount, setTreasureAmount] = useState(0)
  const [characterStats, setCharacterStats] = useState<CharacterStats>({
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    gold: 1000,
    titles: {
      equipped: "",
      unlocked: 0,
      total: 0
    },
    perks: {
      active: 0,
      total: 0
    }
  });
  const tabs = [
    { value: "map", label: "Map" },
    { value: "inventory", label: "Inventory" },
    { value: "settings", label: "Settings" }
  ]

  // Move renderInventoryTile inside the component
  const renderInventoryTile = useCallback((tile: InventoryTile) => {
    return <TileVisual type={tile.type} rotation={tile.rotation || 0} />;
  }, []);

  // Check for landscape orientation on mount and when orientation changes
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerHeight < window.innerWidth)
    }
    
    // Set initial orientation
    checkOrientation()
    
    // Add event listener for orientation changes
    window.addEventListener('resize', checkOrientation)
    
    // Clean up
    return () => window.removeEventListener('resize', checkOrientation)
  }, [])

  // Initialize the database and load data
  useEffect(() => {
    const initializeData = async () => {
      setIsClient(true)
      setIsLoading(true)
      setError(null) // Reset error state
      
      try {
        // Initialize database first
        await db.init()

        // Load or generate user's map seed
        let mapSeed: number;
        try {
          const savedSeed = localStorage.getItem("map-seed");
          if (savedSeed) {
            mapSeed = parseInt(savedSeed, 10);
          } else {
            mapSeed = generateUserSeed();
            localStorage.setItem("map-seed", mapSeed.toString());
          }
        } catch (error) {
          console.error("Error with map seed:", error);
          mapSeed = generateUserSeed();
          localStorage.setItem("map-seed", mapSeed.toString());
        }

        // Create map generator with user's seed
        const mapGenerator = new MapGenerator(mapSeed, MAP_CONFIG);

        // Load saved grid state
        try {
          const savedGrid = localStorage.getItem("realm-grid");
          if (savedGrid) {
            const parsedGrid = JSON.parse(savedGrid);
            // Validate the grid
            if (Array.isArray(parsedGrid) && parsedGrid.length > 0 && 
                Array.isArray(parsedGrid[0]) && 
                parsedGrid.every(row => 
                  Array.isArray(row) && row.every(tile => 
                    tile && typeof tile === 'object' && 
                    typeof tile.type === 'string' && 
                    Array.isArray(tile.connections)
                  )
                )) {
              dispatchGrid({ type: 'UPDATE_GRID', payload: parsedGrid });
            } else {
              throw new Error("Invalid grid structure");
            }
          } else {
            // Generate initial grid section
            const initialGrid = mapGenerator.generateInitialSection();
            dispatchGrid({ type: 'UPDATE_GRID', payload: initialGrid });
            localStorage.setItem("realm-grid", JSON.stringify(initialGrid));
    }
        } catch (error) {
          console.error("Error loading grid:", error);
          // Show error toast
          toast({
            variant: "destructive",
            title: "Error Loading Map",
            description: "Your map data was corrupted and has been reset.",
          });
          // Generate new initial grid
          const initialGrid = mapGenerator.generateInitialSection();
          dispatchGrid({ type: 'UPDATE_GRID', payload: initialGrid });
          localStorage.setItem("realm-grid", JSON.stringify(initialGrid));
        }

        // Load tile inventory
        try {
          const savedTiles = await db.getTileInventory();
          if (savedTiles && savedTiles.length > 0) {
            setTiles(savedTiles);
          } else {
            await db.saveTileInventory(initialTiles);
            setTiles(initialTiles);
          }
        } catch (error) {
          console.error("Error loading tile inventory:", error);
          setTiles(initialTiles);
        }

        // Load character stats
        try {
          const savedStats = localStorage.getItem("character-stats");
          if (savedStats) {
            const parsedStats = JSON.parse(savedStats);
            setCharacterStats(parsedStats);
            setGoldBalance(parsedStats.gold);
        }
      } catch (error) {
          console.error("Error loading character stats:", error);
        }

      } catch (error) {
        console.error("Error initializing data:", error);
        setError("Failed to initialize game data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }

    initializeData()
  }, [])

  // Function to add notifications
  const addNotification = useCallback((title: string, message: string, type: string) => {
    dispatchNotification(createNotification(title, message, type))
  }, [])

  // Generate a random city name
  const generateRandomCityName = useCallback(() => {
    const prefixes = ["Oak", "River", "Stone", "Frost", "Sun", "Shadow", "Iron", "Silver", "Golden", "Crystal"]
    const suffixes = ["vale", "town", "hold", "peak", "haven", "fen", "gate", "bridge", "ford", "keep"]

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]

    return prefix + suffix
  }, [])

  // Optimize grid updates with useCallback
  const updateGrid = useCallback((newGrid: Tile[][]) => {
    dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid })
  }, [])

  // Handle mystery tile click
  const handleMysteryTile = useCallback((x: number, y: number) => {
    const random = Math.random();
    const newGrid = [...grid];

    if (random < 0.15) {
      // Special tile (15% chance)
      newGrid[y][x] = {
        id: `tile-${y}-${x}`,
        type: "special" as TileType,
        connections: [],
        rotation: 0,
        revealed: true,
        name: "Ancient Ruins"
      };

      toast({
        title: "Ancient Ruins Discovered!",
        description: "You've uncovered ancient ruins with mysterious properties.",
      });
    } else if (random < 0.4) {
      // Treasure (25% chance)
      const goldAmount = Math.floor(Math.random() * 50) + 20;
      
      // First show treasure tile
      newGrid[y][x] = {
        id: `tile-${y}-${x}`,
        type: "treasure" as TileType,
        connections: [],
        rotation: 0,
        revealed: true,
        name: "Treasure Chest"
      };
      
      // Update gold balance
      setGoldBalance(prev => prev + goldAmount);
      localStorage.setItem("gold-balance", String(goldBalance + goldAmount));
      
      toast({
        title: "Treasure Found!",
        description: `You found ${goldAmount} gold!`,
      });
      
      // After 3 seconds, convert to grass
      setTimeout(() => {
        newGrid[y][x] = {
          id: `tile-${y}-${x}`,
          type: "grass" as TileType,
          connections: [],
          rotation: 0,
          revealed: true
        };
        dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
        localStorage.setItem("realm-grid", JSON.stringify(newGrid));
      }, 3000);
    } else if (random < 0.6) {
      // Monster encounter (20% chance)
      const monsterTypes = ["goblin", "wolf", "bandit", "skeleton", "troll"];
      const monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
      const monsterLevel = Math.floor(Math.random() * 3) + 1;
      
      // First show monster tile
      newGrid[y][x] = {
        id: `tile-${y}-${x}`,
        type: "monster" as TileType,
        connections: [],
        rotation: 0,
        revealed: true,
        name: `Level ${monsterLevel} ${monsterType}`
      };

      toast({
        title: `Monster Encounter!`,
        description: `You've encountered a level ${monsterLevel} ${monsterType}! Prepare for battle!`,
        variant: "destructive",
      });

      // Store monster info and position
      localStorage.setItem(
        "current-monster",
        JSON.stringify({
          type: monsterType,
          level: monsterLevel,
          position: { x, y },
        })
      );

      // After battle (when returning from dungeon page), it will be grass
      // This is handled in the useEffect that checks URL parameters
      newGrid[y][x] = {
        id: `tile-${y}-${x}`,
        type: "grass" as TileType,
        connections: [],
        rotation: 0,
        revealed: true
      };
    } else if (random < 0.75) {
      // Dungeon (15% chance)
      newGrid[y][x] = {
        id: `tile-${y}-${x}`,
        type: "dungeon" as TileType,
        connections: [],
        rotation: 0,
        revealed: true,
        name: "Mysterious Dungeon",
        isDiscovered: true
      };
      
      toast({
        title: "Dungeon Discovered!",
        description: "You've found a mysterious dungeon entrance. Brave adventurers might find treasures within.",
      });

      // Store dungeon info
      localStorage.setItem(
        "current-dungeon",
        JSON.stringify({
          level: Math.floor(Math.random() * 3) + 1,
          position: { x, y },
        })
      );

      // The dungeon tile remains as is - it can be revisited
      } else {
      // Town (25% chance)
      const townName = "Town of " + generateRandomCityName();
      
      // Create permanent town tile
        newGrid[y][x] = {
          id: `tile-${y}-${x}`,
        type: "town" as TileType,
        connections: [],
        rotation: 0,
        revealed: true,
        name: townName,
        cityName: townName,
        isDiscovered: true
      };
      
      // Save town info
      const storedCities = JSON.parse(localStorage.getItem("saved-cities") || "{}");
      const tileKey = `${x}-${y}`;
      storedCities[tileKey] = { name: townName, isTown: true, size: 1 };
      localStorage.setItem("saved-cities", JSON.stringify(storedCities));
      
      setCurrentTownName(townName);
      setCurrentTownIsTown(true);
      setShowTownModal(true);
      
      showScrollToast(
        'discovery',
        "Settlement Found",
        `King ${getCharacterName()}, behold! The prosperous town of ${townName} pledges its loyalty to your crown.`
      );
    }
    
    dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
    localStorage.setItem("realm-grid", JSON.stringify(newGrid));
  }, [grid, goldBalance, generateRandomCityName, toast, dispatchGrid]);

  // Add effect to handle return from dungeon/battle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const returnType = params.get('return');
      const posX = parseInt(params.get('x') || '0');
      const posY = parseInt(params.get('y') || '0');

      if (returnType && !isNaN(posX) && !isNaN(posY)) {
        const newGrid = [...grid];
        
        if (returnType === 'monster' || returnType === 'treasure') {
          // Convert to grass after monster battle or treasure collection
          newGrid[posY][posX] = {
            id: `tile-${posY}-${posX}`,
          type: "grass" as TileType,
          connections: [],
          rotation: 0,
          revealed: true
        };
        } else if (returnType === 'dungeon') {
          // Ensure dungeon remains but is marked as visited
          if (newGrid[posY][posX].type === "dungeon" as TileType) {
            newGrid[posY][posX] = {
              ...newGrid[posY][posX],
              isVisited: true
            };
      }
    }
    
    dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
    localStorage.setItem("realm-grid", JSON.stringify(newGrid));
        
        // Clean up URL parameters
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [grid, dispatchGrid]);

  // Add movement animation helper
  const animateMovement = (startX: number, startY: number, endX: number, endY: number) => {
    const character = document.querySelector('.character');
    if (!character) return;
    
    const tileSize = 64; // Adjust based on your tile size
    const startPosX = startX * tileSize;
    const startPosY = startY * tileSize;
    const endPosX = endX * tileSize;
    const endPosY = endY * tileSize;
    
    character.animate([
      { transform: `translate(${startPosX}px, ${startPosY}px)` },
      { transform: `translate(${endPosX}px, ${endPosY}px)` }
    ], {
      duration: 500,
      easing: 'ease-in-out',
      fill: 'forwards'
    });
  };

  // Update findPath to handle adjacent tiles correctly
  const findPath = (grid: Tile[][], start: { x: number; y: number }, end: { x: number; y: number }): { x: number; y: number }[] | null => {
    // Validate start and end positions are within bounds
    if (start.x < 0 || start.x >= grid[0].length || start.y < 0 || start.y >= grid.length ||
        end.x < 0 || end.x >= grid[0].length || end.y < 0 || end.y >= grid.length) {
      return null;
    }

    // Calculate Euclidean distance
    const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    if (distance > 40) { // Increased range from 3.5 to 40
      return null;
    }

    // Check if target tile is valid
    const targetTile = grid[end.y][end.x];
    if (targetTile.type === "mountain" || targetTile.type === "water" || targetTile.type === "empty") {
      return null;
    }

    // For direct moves within range, return direct path
    if (distance <= 40) { // Increased range from 3.5 to 40
      return [start, end];
    }

    // For longer paths, implement A* pathfinding
    const queue = [{ pos: start, path: [start], cost: 0 }];
    const visited = new Set();

    while (queue.length > 0) {
      // Sort by cost + heuristic (Manhattan distance to target)
      queue.sort((a, b) => {
        const aScore = a.cost + Math.abs(end.x - a.pos.x) + Math.abs(end.y - a.pos.y);
        const bScore = b.cost + Math.abs(end.x - b.pos.x) + Math.abs(end.y - b.pos.y);
        return aScore - bScore;
      });

      const current = queue.shift()!;
      const key = `${current.pos.x},${current.pos.y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      // Check if we reached the target
      if (current.pos.x === end.x && current.pos.y === end.y) {
        return current.path;
      }

      // Add adjacent tiles (including diagonals)
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;

          const newX = current.pos.x + dx;
          const newY = current.pos.y + dy;
        
        // Check bounds
          if (newX < 0 || newX >= grid[0].length || newY < 0 || newY >= grid.length) {
            continue;
          }

          // Check if tile is walkable
          const tile = grid[newY][newX];
          if (tile.type === "mountain" || tile.type === "water" || tile.type === "empty") {
            continue;
          }

          const newKey = `${newX},${newY}`;
          if (visited.has(newKey)) continue;

          // Calculate new cost (diagonal moves cost more)
          const newCost = current.cost + (dx !== 0 && dy !== 0 ? 1.4 : 1);

          // Only add if total path length would be <= 3
          if (current.path.length < 4) {
            queue.push({
              pos: { x: newX, y: newY },
              path: [...current.path, { x: newX, y: newY }],
              cost: newCost
            });
          }
        }
      }
    }

    return null;
  };

  // Add riddles data
  const riddles = [
    {
      question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
      answers: ["An Echo", "A Cloud", "A River", "A Tree"],
      correctAnswer: 0
    },
    {
      question: "The more you take, the more you leave behind. What am I?",
      answers: ["Money", "Time", "Footsteps", "Memories"],
      correctAnswer: 2
    },
    {
      question: "What has keys, but no locks; space, but no room; and you can enter, but not go in?",
      answers: ["A Map", "A House", "A Keyboard", "A Door"],
      correctAnswer: 2
    },
    {
      question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. I have roads, but no cars. What am I?",
      answers: ["A Globe", "A Map", "A Painting", "A Dream"],
      correctAnswer: 1
    },
    {
      question: "What is always running but never moves, often murmurs but never talks, has a bed but never sleeps, and has a mouth but never eats?",
      answers: ["A Clock", "A River", "A Mountain", "A Tree"],
      correctAnswer: 1
    },
    {
      question: "The person who makes it, sells it. The person who buys it never uses it. The person who uses it doesn't know they are. What is it?",
      answers: ["A Riddle", "A Coffin", "A Secret", "A Map"],
      correctAnswer: 1
    },
    {
      question: "What can run but never walks, has a mouth but never talks, has a head but never weeps, has a bed but never sleeps?",
      answers: ["A River", "A Mountain", "A Clock", "A Road"],
      correctAnswer: 0
    },
    {
      question: "I am not alive, but I grow; I don't have lungs, but I need air; I don't have a mouth, but water kills me. What am I?",
      answers: ["A Tree", "Fire", "A Cloud", "A Stone"],
      correctAnswer: 1
    },
    {
      question: "What is seen in the middle of March and April that can't be seen at the beginning or end of either month?",
      answers: ["Spring", "Rain", "The Letter R", "Flowers"],
      correctAnswer: 2
    },
    {
      question: "What building has the most stories?",
      answers: ["A Castle", "A Library", "A Tower", "A Temple"],
      correctAnswer: 1
    }
  ];

  // Update riddle selection to be random
  const [currentRiddles, setCurrentRiddles] = useState<typeof riddles>([]);
  
  useEffect(() => {
    // Randomly select 3 unique riddles when a dungeon is encountered
    if (showRiddleModal) {
      const shuffled = [...riddles].sort(() => 0.5 - Math.random());
      setCurrentRiddles(shuffled.slice(0, 3));
      setCurrentRiddle(0);
      setRiddleAnswers([]);
    }
  }, [showRiddleModal]);

  // Add monster encounter handler
  const handleMonsterAttack = useCallback(() => {
    if (!currentMonster) return;

    // Calculate damage
    const monsterDamage = Math.floor(Math.random() * 10) + 5;
    const playerDamage = Math.floor(Math.random() * 15) + 10;
    
    const newMonsterHealth = currentMonster.health - playerDamage;
    
    if (newMonsterHealth <= 0) {
      // Monster defeated
      setShowMonsterModal(false);
      const goldReward = Math.floor(Math.random() * 50) + 20;
      setCharacterStats(prev => ({
        ...prev,
        gold: prev.gold + goldReward,
        experience: prev.experience + 25,
        titles: { ...prev.titles },
        perks: { ...prev.perks }
      }));
      toast({
        title: "Victory!",
        description: `You defeated the ${currentMonster.name} and gained ${goldReward} gold!`,
        variant: "default"
      });
      return;
    }
    
    const newPlayerHealth = playerHealth - monsterDamage;
    
    if (newPlayerHealth <= 0) {
      // Player loses
      setShowMonsterModal(false);
      setCharacterStats(prev => ({
        ...prev,
        gold: Math.max(0, prev.gold - 10),
        titles: { ...prev.titles },
        perks: { ...prev.perks }
      }));
      toast({
        title: "Defeat!",
        description: `The ${currentMonster.name} defeated you! You lost 10 gold.`,
        variant: "destructive"
      });
      return;
    }
    
    setCurrentMonster({ 
      name: currentMonster.name,
      health: newMonsterHealth 
    });
    setPlayerHealth(newPlayerHealth);
  }, [currentMonster, playerHealth, toast]);

  // Update handleCharacterMove to include mystery tile interaction
  const handleCharacterMove = useCallback(async (targetX: number, targetY: number) => {
    // Validate target position is within grid bounds
    if (targetY >= grid.length || targetX >= grid[0].length || targetX < 0 || targetY < 0) {
      showScrollToast(
        'error',
        undefined,
        "The edge of the known world lies before you. We must not venture further."
      );
      return;
    }

    // Don't move if target tile is mountain, water or empty
    if (grid[targetY][targetX].type === "mountain" as TileType || 
        grid[targetY][targetX].type === "water" as TileType || 
        grid[targetY][targetX].type === "empty" as TileType) {
      showScrollToast(
        'error',
        grid[targetY][targetX].type === "empty" 
          ? "Untamed Wilderness" 
          : grid[targetY][targetX].type === "mountain" 
            ? "Impassable Mountains"
            : "Treacherous Waters",
        `King ${getCharacterName()}, ${
          grid[targetY][targetX].type === "empty" 
            ? "the wild lands beckon, but we must first lay proper roads for your passage."
            : grid[targetY][targetX].type === "mountain" 
              ? "these peaks tower before us, defying even your royal command."
              : "these waters run too deep and swift for safe crossing, Your Majesty."
        }`
      );
      return;
    }

    // Calculate Euclidean distance to check if move is too far
    const distance = Math.sqrt(Math.pow(targetX - character.x, 2) + Math.pow(targetY - character.y, 2));
    if (distance > 40) {
      showScrollToast(
        'error',
        "Rest Required",
        `King ${getCharacterName()}, your royal entourage requires rest before such a lengthy journey.`
      );
      return;
    }

    // Find path to target
    const path = findPath(grid, { x: character.x, y: character.y }, { x: targetX, y: targetY });

    if (!path) {
      showScrollToast(
        'error',
        "Path Blocked",
        `King ${getCharacterName()}, we must seek another route. The current path is unsuitable for your royal procession.`
      );
      return;
    }

    // Animate movement along the path
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1];
      const to = path[i];
      
      await new Promise<void>((resolve) => {
        animateMovement(from.x, from.y, to.x, to.y);
        setTimeout(resolve, 500);
      });
    }

    // Update character position
    const newCharacter = { ...character, x: targetX, y: targetY };
    setCharacter(newCharacter);
    localStorage.setItem("character-position", JSON.stringify(newCharacter));

    // Handle town tile interaction
    if (grid[targetY][targetX].type === "town" as TileType) {
      const storedCities = JSON.parse(localStorage.getItem("saved-cities") || "{}");
      const tileKey = `${targetX}-${targetY}`;
      
      if (storedCities[tileKey]) {
        setCurrentTownName(storedCities[tileKey].name);
        setCurrentTownIsTown(true);
        setShowTownModal(true);
        
        showScrollToast(
          'discovery',
          "Town Visited",
          `King ${getCharacterName()}, welcome to ${storedCities[tileKey].name}. Your loyal subjects await your guidance.`
        );
      }
    }

    // Handle mystery tile interaction
    if (grid[targetY][targetX].type === "mystery" as TileType) {
      const random = Math.random();
    const newGrid = [...grid];

      if (random < 0.2) { // 20% chance for a town
        const townName = "Town of " + generateRandomCityName();
        
        // Create permanent town tile
        newGrid[targetY][targetX] = {
          id: `tile-${targetY}-${targetX}`,
          type: "town" as TileType,
      connections: [],
      rotation: 0,
          revealed: true,
          name: townName,
          cityName: townName,
          isDiscovered: true
        };
        
        // Save town info
        const storedCities = JSON.parse(localStorage.getItem("saved-cities") || "{}");
        const tileKey = `${targetX}-${targetY}`;
        storedCities[tileKey] = { name: townName, isTown: true, size: 1 };
        localStorage.setItem("saved-cities", JSON.stringify(storedCities));
        
        setCurrentTownName(townName);
        setCurrentTownIsTown(true);
        setShowTownModal(true);
        
        showScrollToast(
          'discovery',
          "Settlement Found",
          `King ${getCharacterName()}, behold! The prosperous town of ${townName} pledges its loyalty to your crown.`
        );
      } else if (random < 0.4) { // 20% chance for a dungeon
        setCurrentRiddle(0);
        setRiddleAnswers([]);
        setShowRiddleModal(true);
      } else if (random < 0.6) { // 20% chance for a monster
        const monsterTypes = ["Dragon", "Troll", "Goblin", "Witch", "Dark Knight"];
        const monsterName = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
        setCurrentMonster({ name: monsterName, health: 100 });
        setPlayerHealth(100);
        setShowMonsterModal(true);
      } else if (random < 0.8) { // 20% chance for treasure
        const amount = Math.floor(Math.random() * 226) + 25; // 25 to 250 gold
        setTreasureAmount(amount);
        setShowTreasureModal(true);
        setGoldBalance(prev => prev + amount);
      } else { // 20% chance for nothing
        newGrid[targetY][targetX] = {
          ...newGrid[targetY][targetX],
          type: "grass" as TileType
        };
        showScrollToast('discovery', undefined, "The mists part to reveal... mere grassland. Not all mysteries hide treasures.");
      }

    dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
      localStorage.setItem("realm-grid", JSON.stringify(newGrid));
    }

    // Reveal adjacent tiles
    const newGrid = [...grid];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const newX = targetX + dx;
        const newY = targetY + dy;
        if (newX >= 0 && newX < grid[0].length && newY >= 0 && newY < grid.length) {
          newGrid[newY][newX] = {
            ...newGrid[newY][newX],
            revealed: true
          };
        }
      }
    }
    dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
    localStorage.setItem("realm-grid", JSON.stringify(newGrid));
  }, [grid, character, dispatchGrid, generateRandomCityName]);

  // Update handleTileClick to handle both modes with restrictions
  const handleTileClick = useCallback((x: number, y: number) => {
    const clickedTile = grid[y][x];
    
    // Movement Mode
    if (isMovementMode) {
      handleCharacterMove(x, y);
      return;
    }
    
    // Building Mode
    if (selectedTile) {
    // Check if tile is already occupied
      if (grid[y][x].type !== "empty" as TileType) {
        showScrollToast(
          'error',
          "Land Occupied",
          `King ${getCharacterName()}, this plot already bears the mark of your realm. Might I suggest another location for your grand designs?`
        );
      return;
    }

    // Check if we have enough gold
    if (goldBalance < selectedTile.cost) {
        showScrollToast(
          'error',
          "Treasury Low",
          `King ${getCharacterName()}, the royal coffers run thin. We must replenish your treasury before proceeding with construction.`
        );
      return;
    }

    // Check if we have enough tiles
    const tileInInventory = tiles.find((t: InventoryTile) => t.id === selectedTile.id);
      if (!tileInInventory || tileInInventory.quantity === undefined || tileInInventory.quantity <= 0) {
        showScrollToast(
          'error',
          "Resources Depleted",
          `King ${getCharacterName()}, our builders require more materials. Shall I arrange for additional supplies?`
        );
        setSelectedTile(null);
      return;
    }

      try {
        // Place the tile
    const newGrid = [...grid];
    newGrid[y][x] = {
      id: `tile-${y}-${x}`,
      type: selectedTile.type,
          connections: selectedTile.connections,
          rotation: 0,
          revealed: true
        };

        // Update grid
    dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });

      // Update gold balance
        setGoldBalance(prev => prev - selectedTile.cost);

        // Update tile quantity
        const updatedTiles = tiles.map(t =>
      t.id === selectedTile.id 
            ? { ...t, quantity: (t.quantity || 0) - 1 }
            : t
        );
        setTiles(updatedTiles);
        
        // Save to localStorage
        localStorage.setItem("realm-grid", JSON.stringify(newGrid));
        localStorage.setItem("tile-inventory", JSON.stringify(updatedTiles));
        
        const updatedTileQuantity = (tileInInventory.quantity || 0) - 1;
        
        if (updatedTileQuantity === 0) {
    setSelectedTile(null);
          showScrollToast(
            'error',
            "Supplies Exhausted",
            `King ${getCharacterName()}, we have used the last of our ${selectedTile.name.toLowerCase()} materials. Your builders await new supplies.`
          );
        }

        showScrollToast(
          'tilePlaced',
          "Construction Complete",
          `King ${getCharacterName()}, your new ${selectedTile.name.toLowerCase()} stands ready, built to your exacting specifications.`
        );

      } catch (error) {
        console.error("Error placing tile:", error);
        showScrollToast(
          'error',
          undefined,
          "The fates conspire against us! The tile could not be placed."
        );
      }
      return;
    }

    // Handle city and town clicks (available in both modes)
    if (clickedTile.type === "city" as TileType || clickedTile.type === "town" as TileType) {
      const cityTile = grid[y][x];
      // Get the main tile coordinates
      const mainX = cityTile.cityX ?? x;
      const mainY = cityTile.cityY ?? y;
      
      const storedCities = JSON.parse(localStorage.getItem("saved-cities") || "{}");
      const tileKey = `${mainX}-${mainY}`;
      let cityName;
      let isTown = clickedTile.type === "town" as TileType;
      
      if (storedCities[tileKey]) {
        cityName = storedCities[tileKey].name;
        isTown = storedCities[tileKey].isTown;
      } else {
        cityName = isTown ? 
          "Town of " + generateRandomCityName() : 
          "City of " + generateRandomCityName();
          
        storedCities[tileKey] = { name: cityName, isTown, size: 2 };
        localStorage.setItem("saved-cities", JSON.stringify(storedCities));
      }
      
      setCurrentTownName(cityName);
      setCurrentTownIsTown(isTown);
      setShowTownModal(true);
      
      showScrollToast(
        'discovery',
        "Settlement Found",
        `King ${getCharacterName()}, behold! The prosperous settlement of ${cityName} pledges its loyalty to your crown.`
      );
      return;
    }

    // Special tile interaction (only in building mode)
    if (!isMovementMode && clickedTile.type === "special" as TileType) {
      showScrollToast(
        'discovery',
        "Ancient Discovery",
        `King ${getCharacterName()}, we have uncovered ruins of great antiquity. What secrets might they hold for your realm?`
      );
    }
  }, [grid, selectedTile, handleCharacterMove, generateRandomCityName, isMovementMode, goldBalance, tiles]);

  // Update rotateTile to only work in building mode
  const rotateTile = useCallback((x: number, y: number) => {
    if (isMovementMode) {
      showScrollToast(
        'error',
        "Mode Required",
        `King ${getCharacterName()}, we must return to the construction phase to properly arrange your realm's structures.`
      );
      return;
    }

    const newGrid = [...grid];
    const currentRotation = newGrid[y][x].rotation || 0;
    newGrid[y][x] = {
      ...newGrid[y][x],
      rotation: (currentRotation + 90) % 360
    };
    dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
    
    localStorage.setItem("realm-grid", JSON.stringify(newGrid));
    
    showScrollToast(
      'tilePlaced',
      "Structure Aligned",
      `King ${getCharacterName()}, the edifice has been reoriented according to your royal decree.`
    );
  }, [grid, dispatchGrid, isMovementMode]);

  // Update deleteTile to only work in building mode and allow mountain deletion
  const deleteTile = useCallback((x: number, y: number) => {
    if (isMovementMode) {
      showScrollToast(
        'error',
        "Builder's Notice",
        `King ${getCharacterName()}, your master builder requires the construction mode to reshape the lands.`
      );
      return;
    }

    // Allow deletion of any tile type in building mode
    const newGrid = [...grid];
    newGrid[y][x] = {
      id: `tile-${y}-${x}`,
      type: "empty" as TileType,
      connections: [],
      rotation: 0,
      revealed: true
    };
    dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
    
    localStorage.setItem("realm-grid", JSON.stringify(newGrid));
    
    showScrollToast(
      'tilePlaced',
      "Land Cleared",
      `King ${getCharacterName()}, the area has been cleared as commanded, ready for your next grand vision.`
    );
  }, [grid, dispatchGrid, isMovementMode]);

  // Add saveMap function
  const handleSaveRealm = useCallback(() => {
    try {
      localStorage.setItem("realm-grid", JSON.stringify(grid));
      showScrollToast(
        'discovery',
        "Plans Preserved",
        `King ${getCharacterName()}, your royal cartographers have documented the realm's layout in the ancient scrolls.`
      );
    } catch (error) {
      console.error("Error saving realm:", error);
      showScrollToast(
        'error',
        "Scribe's Error",
        `King ${getCharacterName()}, forgive us! The royal scribes failed to record your realm's design. The enchanted inks have failed us.`
      );
    }
  }, [grid]);

  // Connect to the saveMap function in ClientLayout
  useEffect(() => {
    const saveMapHandler = () => {
      handleSaveRealm();
    };
    
    // Set the event handler for the 'saveMap' custom event
    window.addEventListener('saveMap', saveMapHandler);
    
    return () => {
      window.removeEventListener('saveMap', saveMapHandler);
    };
  }, [handleSaveRealm]);

  // Add handleResetMap function
  const handleResetMap = useCallback(() => {
    dispatchGrid({ type: 'RESET_GRID', payload: initialGrid });
    setCharacter(initialCharacter);
    localStorage.setItem("realm-grid", JSON.stringify(initialGrid));
    toast({
      title: "Map Reset",
      description: "The map has been reset to its initial state.",
    });
  }, [toast]);

  // Add grid validation effect
  useEffect(() => {
    // Validate grid on mount and changes
    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      console.error('Invalid grid state detected, resetting...');
      const newGrid = createInitialGrid(15);
      dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
      return;
    }

    // Validate each tile in the grid
    const hasInvalidTiles = grid.some(row => 
      !Array.isArray(row) || row.some(tile => 
        !tile || typeof tile !== 'object' || !tile.type
      )
    );

    if (hasInvalidTiles) {
      console.error('Invalid tiles detected, resetting grid...');
      const newGrid = createInitialGrid(15);
      dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
    }
  }, [grid]);

  // Update localStorage sync effect to handle invalid grid states
  useEffect(() => {
    const loadSavedGrid = () => {
      try {
        const savedGrid = localStorage.getItem("realm-grid");
        if (savedGrid) {
          const parsedGrid = JSON.parse(savedGrid);
          
          // Validate grid structure
          if (!Array.isArray(parsedGrid) || !parsedGrid.length || !Array.isArray(parsedGrid[0])) {
            throw new Error('Invalid grid structure');
          }

          // Validate each tile
          const isValidGrid = parsedGrid.every(row => 
            Array.isArray(row) && row.every(tile => 
              tile && 
              typeof tile === 'object' && 
              typeof tile.id === 'string' && 
              typeof tile.type === 'string' && 
              Array.isArray(tile.connections) && 
              typeof tile.rotation === 'number' && 
              typeof tile.revealed === 'boolean'
            )
          );

          if (!isValidGrid) {
            throw new Error('Invalid tile data');
          }

          dispatchGrid({ type: 'UPDATE_GRID', payload: parsedGrid });
        } else {
          // If no saved grid, create a new one
          const newGrid = createInitialGrid(15);
          dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
          localStorage.setItem("realm-grid", JSON.stringify(newGrid));
        }
      } catch (error) {
        console.error('Error loading saved grid:', error);
        // Create a new grid if loading fails
        const newGrid = createInitialGrid(15);
        dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
        localStorage.setItem("realm-grid", JSON.stringify(newGrid));
      }
    };

    if (isClient) {
      loadSavedGrid();
    }
  }, [isClient]);

  // Add this effect to place the big mystery tile after the grid is initialized
  useEffect(() => {
    if (isClient && grid.length > 10) {
      const x = 1; // Second column from the left
      const y = 9; // Row 9
      
      const updatedGrid = placeBigMysteryTile(x, y, grid);
      if (updatedGrid !== grid) {
        dispatchGrid({ type: 'UPDATE_GRID', payload: updatedGrid });
        localStorage.setItem("realm-grid", JSON.stringify(updatedGrid));
      }
    }
  }, [isClient, grid.length]);

  // Update handleShowMoreRows to preserve first 5 rows
  const handleShowMoreRows = useCallback(() => {
    if (visibleRows >= grid.length) {
      toast({
        title: "Maximum Rows Reached",
        description: "You've revealed all available rows.",
      });
      return;
    }

    const newGrid = generateNewRows(grid, visibleRows);
    dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
    setVisibleRows(prev => Math.min(prev + 5, grid.length));
    
    // Save the updated grid
    localStorage.setItem("realm-grid", JSON.stringify(newGrid));
    
    toast({
      title: "New Area Revealed",
      description: "5 new rows have been revealed with mystery tiles!",
    });
  }, [grid, visibleRows, toast]);

  // Add function to handle experience gains
  const gainExperience = useCallback((amount: number, source: string) => {
    setCharacterStats(prev => {
      const newStats = {
        ...prev,
        experience: prev.experience + amount,
        level: calculateLevelFromExperience(prev.experience + amount),
        experienceToNextLevel: calculateExperienceForLevel(calculateLevelFromExperience(prev.experience + amount) + 1),
        gold: prev.gold
      };

      // Save to localStorage and dispatch event
      localStorage.setItem("character-stats", JSON.stringify(newStats));
      window.dispatchEvent(new Event("character-stats-update"));

      if (newStats.level > prev.level) {
        toast({
          title: "Level Up!",
          description: `You've reached level ${newStats.level}!`,
        });
      }

      return newStats;
    });

    toast({
      title: "Experience Gained!",
      description: `+${amount} XP from ${source}`,
    });
  }, [toast]);

  // Update riddle completion to grant experience
  const handleRiddleComplete = useCallback((correct: boolean) => {
    if (correct) {
      const goldReward = 100;
      const expReward = 50;
      setGoldBalance(prev => prev + goldReward);
      gainExperience(expReward, "Solving Riddles");
      toast({
        title: "Riddles Completed!",
        description: `You answered all riddles correctly and earned ${goldReward} gold and ${expReward} XP!`
      });
    }
  }, [toast, gainExperience]);

  // Update treasure find to grant experience
  const handleTreasureFound = useCallback((amount: number) => {
    const expReward = Math.floor(amount / 2); // Experience is half of gold found
    setGoldBalance(prev => prev + amount);
    gainExperience(expReward, "Finding Treasure");
    toast({
      title: "Treasure Found!",
      description: `You found ${amount} gold and gained ${expReward} XP!`,
    });
  }, [toast, gainExperience]);

  // Add effect to save character stats
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("character-stats", JSON.stringify({
        ...characterStats,
        gold: goldBalance
      }));
    }
  }, [isClient, characterStats, goldBalance]);

  // Add this effect to check if user is at bottom of visible map
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    if (!grid) return;
    
    // Check if any tiles in the last 5 rows are revealed
    const lastFiveRows = grid.slice(-5);
    const hasRevealedTiles = lastFiveRows.some(row => 
      row.some(tile => tile.revealed)
    );
    
    setIsAtBottom(hasRevealedTiles);
  }, [grid]);

  const handleAddMoreRows = useCallback(() => {
    // Get the current number of rows
    const currentRows = grid.length;
    
    // Generate 5 new rows
    const newGrid = generateNewRows(grid, currentRows);
    
    // Update the grid
    dispatchGrid({ type: 'SET_GRID', payload: newGrid });
    
    // Save to localStorage
    try {
      localStorage.setItem('realm-grid', JSON.stringify(newGrid));
    } catch (error) {
      console.error('Failed to save grid:', error);
    }
  }, [grid]);

  // Update character stats
  const updateCharacterStats = (newStats: Partial<CharacterStats>) => {
    setCharacterStats(prev => ({
      ...prev,
      ...newStats,
      titles: {
        ...prev.titles,
        ...(newStats.titles || {})
      },
      perks: {
        ...prev.perks,
        ...(newStats.perks || {})
      }
    }));
  };

  // Handle monster defeat
  const handleMonsterDefeat = useCallback(() => {
    const goldReward = Math.floor(Math.random() * 50) + 20;
    const expReward = Math.floor(Math.random() * 30) + 15;
    
    updateCharacterStats({
      gold: characterStats.gold + goldReward,
      experience: characterStats.experience + expReward
    });
    
    toast({
      title: "Victory!",
      description: `You defeated the monster! Earned ${goldReward} gold and ${expReward} XP.`,
      variant: "default",
    });
  }, [characterStats, toast]);

  // Update character stats when leveling up
  const handleLevelUp = useCallback(() => {
    setCharacterStats(prev => ({
      ...prev,
      level: prev.level + 1,
      experience: 0,
      experienceToNextLevel: prev.experienceToNextLevel * 1.5,
      titles: {
        ...prev.titles,
        unlocked: prev.titles.unlocked + 1
      },
      perks: {
        ...prev.perks,
        active: prev.perks.active + 1
      }
    }));
  }, []);

  // Main render
  if (!isClient || isLoading) {
  return (
      <div className="flex min-h-screen flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-amber-400">Loading realm...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* Main Content */}
      <div className="flex-1 space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-serif">Realm Builder</h1>
            <p className="text-muted-foreground">Design and expand your realm</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-gradient-to-r from-amber-900/20 to-amber-800/20 border border-amber-800/20">
              <button
                onClick={() => setIsMovementMode(true)}
                className={cn(
                  "p-2 rounded-full transition-all duration-200",
                  isMovementMode 
                    ? "bg-amber-600 text-white shadow-lg" 
                    : "text-amber-600/60 hover:text-amber-600"
                )}
              >
                ♞
              </button>
              <button
                onClick={() => setIsMovementMode(false)}
                className={cn(
                  "p-2 rounded-full transition-all duration-200",
                  !isMovementMode 
                    ? "bg-amber-600 text-white shadow-lg" 
                    : "text-amber-600/60 hover:text-amber-600"
                )}
              >
                🏰
              </button>
            </div>
            <Button 
              variant="outline" 
              className="border-amber-800/20 hover:bg-amber-900/20"
              onClick={() => {
                setShowTileInventory(!showTileInventory);
                if (!showTileInventory) {
                  setIsMovementMode(false);
                }
              }}
            >
              <Package className="mr-2 h-4 w-4" />
              Tile Inventory
            </Button>
            <Button 
              variant="outline" 
              className="border-amber-800/20 hover:bg-amber-900/20"
              onClick={handleSaveRealm}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Map
            </Button>
            <Button 
              variant="outline" 
              className="border-amber-800/20 hover:bg-amber-900/20"
              onClick={handleResetMap}
            >
              <RotateCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Map container with improved layout */}
        <div className="relative w-full">
          <div className="w-full bg-gradient-to-br from-amber-900/10 to-amber-950/30 rounded-lg border border-amber-800/20 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-10rem)]">
              <div ref={mapRef} className="p-4 min-w-[320px]">
                <MapGrid
                  grid={grid}
                  onTileClick={handleTileClick}
                  onGridUpdate={(newGrid: Tile[][]) => dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid })}
                  onGoldUpdate={(amount) => setGoldBalance((prev) => prev + amount)}
                  character={character}
                  onCharacterMove={handleCharacterMove}
                  selectedTile={selectedTile}
                  onTilePlaced={() => setSelectedTile(null)}
                  onDiscovery={(discovery) => {
                    toast({
                      title: "New Discovery!",
                      description: discovery,
                    })
                  }}
                  onHover={(x: number, y: number) => setHoveredTile({ row: y, col: x })}
                  onHoverEnd={() => setHoveredTile(null)}
                  hoveredTile={hoveredTile}
                  onRotateTile={rotateTile}
                  onDeleteTile={deleteTile}
                  isMovementMode={isMovementMode}
                  onAddMoreRows={handleAddMoreRows}
                />

                {/* Show More Button */}
                {visibleRows < grid.length && (
                  <div className="flex justify-center mt-6">
                <Button 
                      variant="outline"
                      className="border-amber-800/20 hover:bg-amber-900/20"
                      onClick={handleShowMoreRows}
                >
                      <ChevronDown className="mr-2 h-4 w-4" />
                      Show More Rows
                </Button>
                  </div>
                )}
                </div>
            </ScrollArea>
          </div>

          {/* Improved Tile Inventory Panel */}
          {showTileInventory && (
            <div className="fixed right-0 top-0 h-screen w-80 bg-gradient-to-b from-blue-900 to-blue-950 p-4 text-white shadow-lg z-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Tile Inventory</h3>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-blue-800"
                  onClick={() => setShowTileInventory(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-300">Gold Balance: {goldBalance}</p>
              </div>

              <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
                <div className="space-y-4">
                  {tiles
                    .filter(tile => tile.type !== "city" as TileType && tile.type !== "town" as TileType)
                    .map((tile) => (
                      <div
                        key={tile.id}
                        className={cn(
                          "flex flex-col p-2 rounded transition-colors",
                          selectedTile?.id === tile.id
                            ? "bg-blue-700"
                            : "bg-blue-900/50"
                        )}
                      >
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setSelectedTile({
                            ...tile,
                            quantity: tile.quantity || 0,
                            isSelected: true
                          })}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                            {renderInventoryTile(tile)}
          </div>
                          <div>
                            <p className="font-medium">{tile.name}</p>
                              <p className="text-xs text-gray-300">Cost: {tile.cost} gold</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-300">
                          x{tile.quantity}
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              if (goldBalance >= tile.cost) {
                                const newTiles = tiles.map(t => 
                                  t.id === tile.id 
                                    ? { ...t, quantity: (t.quantity || 0) + 1 }
                                    : t
                                );
                                setTiles(newTiles);
                                setGoldBalance(prev => prev - tile.cost);
                                localStorage.setItem("gold-balance", String(goldBalance - tile.cost));
                                db.saveTileInventory(newTiles);
                                toast({
                                  title: "Tile Purchased",
                                  description: `Bought 1 ${tile.name} tile for ${tile.cost} gold.`
                                });
                              } else {
                                toast({
                                  title: "Insufficient Gold",
                                  description: `You need ${tile.cost} gold to buy this tile.`,
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            Buy Tile
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* City/Town Dialogs */}
      <Dialog open={showCityDialog} onOpenChange={setShowCityDialog}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
            <DialogTitle className="font-serif text-xl">Name Your Settlement</DialogTitle>
              <DialogDescription>
              Give a name to your new settlement
              </DialogDescription>
            </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="cityName">Settlement Name</Label>
              <Input
                id="cityName"
                placeholder="Enter a name..."
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="bg-gray-900 border-amber-800/20"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isTown" 
                checked={isTown} 
                onCheckedChange={(checked) => setIsTown(checked === true)} 
              />
              <label
                htmlFor="isTown"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                This is a small town (instead of a city)
              </label>
              </div>
            </div>
            <DialogFooter>
            <Button variant="outline" onClick={() => setShowCityDialog(false)}>
              Cancel
              </Button>
            <Button
              disabled={!cityName.trim()}
              onClick={() => {
                if (cityName.trim() && cityPosition) {
                  const newGrid = [...grid];
                  newGrid[cityPosition.row][cityPosition.col] = {
                    ...newGrid[cityPosition.row][cityPosition.col],
                    type: isTown ? "town" as TileType : "city" as TileType,
                    cityName: cityName.trim(),
                    isTown,
                  };
                  dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
                  setCityName("");
                  setShowCityDialog(false);
                  setIsTown(false);
                  
                  toast({
                    title: `${isTown ? "Town" : "City"} Founded!`,
                    description: `You've established the ${isTown ? "town" : "city"} of ${cityName}.`,
                  });
                }
              }}
              className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900"
            >
              Create {isTown ? "Town" : "City"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Town Modal */}
      <Dialog open={showTownModal} onOpenChange={(open) => {
        if (!open && character) {
          // When closing the modal, ensure the tile is a town tile
          const newGrid = [...grid];
          if (newGrid[character.y][character.x].type === "mystery") {
            newGrid[character.y][character.x] = {
              id: `tile-${character.y}-${character.x}`,
              type: "town" as TileType,
              connections: [],
              rotation: 0,
              revealed: true,
              name: currentTownName,
              cityName: currentTownName,
              isDiscovered: true
            };
            dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
            localStorage.setItem("realm-grid", JSON.stringify(newGrid));

            // Save the town in localStorage
            const savedCities = JSON.parse(localStorage.getItem("saved-cities") || "[]");
            savedCities.push({ name: currentTownName, x: character.x, y: character.y });
            localStorage.setItem("saved-cities", JSON.stringify(savedCities));
          }
        }
        setShowTownModal(open);
      }}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-b from-blue-900 to-blue-950">
          <DialogHeader>
            <DialogTitle>Town Discovered!</DialogTitle>
            <DialogDescription>
              You've discovered a new town in your realm!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{currentTownName || "New Town"}</p>
              <p className="text-gray-400">{currentTownIsTown ? "A bustling town in your realm" : "A city in your realm"}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Town Stats:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-blue-900/50 p-2 rounded">
                  <p className="text-gray-400">Population</p>
                  <p className="font-medium">{currentTownIsTown ? "2,500" : "10,000"} citizens</p>
          </div>
                <div className="bg-blue-900/50 p-2 rounded">
                  <p className="text-gray-400">Gold Income</p>
                  <p className="font-medium">+10 per turn</p>
                    </div>
                <div className="bg-blue-900/50 p-2 rounded">
                  <p className="text-gray-400">Happiness</p>
                  <p className="font-medium">85%</p>
                  </div>
                <div className="bg-blue-900/50 p-2 rounded">
                  <p className="text-gray-400">Resources</p>
                  <p className="font-medium">{currentTownIsTown ? "Wood, Stone" : "Abundant"}</p>
                  </div>
                  </div>
                </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Available Actions:</h3>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    // Collect town income
                    setGoldBalance(prev => prev + 10);
                    toast({
                      title: "Income Collected!",
                      description: "You've collected 10 gold from the town.",
                    });
                  }}
                >
                  Collect Income (10 Gold)
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    // Upgrade town
                    if (goldBalance >= 50) {
                      setGoldBalance(prev => prev - 50);
                      toast({
                        title: "Town Upgraded!",
                        description: "The town has been improved and will now generate more income.",
                      });
                    } else {
                      toast({
                        title: "Not Enough Gold",
                        description: "You need 50 gold to upgrade the town.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  Upgrade Town (50 Gold)
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => {
                    // Build defenses
                    if (goldBalance >= 30) {
                      setGoldBalance(prev => prev - 30);
                      toast({
                        title: "Defenses Built!",
                        description: "The town is now better protected against threats.",
                      });
                    } else {
                      toast({
                        title: "Not Enough Gold",
                        description: "You need 30 gold to build defenses.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  Build Defenses (30 Gold)
                </Button>
                    </div>
                  </div>
                    </div>
          
          <DialogFooter>
            <Button onClick={() => setShowTownModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Riddle Modal */}
      <Dialog open={showRiddleModal} onOpenChange={setShowRiddleModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Ancient Riddle</DialogTitle>
            <DialogDescription>
              Answer the riddle correctly to proceed deeper into the dungeon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <p className="text-lg font-medium mb-4">
              {currentRiddles[currentRiddle]?.question}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {currentRiddles[currentRiddle]?.answers.map((answer, index) => (
                <Button
                  key={index}
                  variant={riddleAnswers[currentRiddle] === (index === currentRiddles[currentRiddle].correctAnswer) ? "default" : "outline"}
                  onClick={() => {
                    const newAnswers = [...riddleAnswers];
                    newAnswers[currentRiddle] = index === currentRiddles[currentRiddle].correctAnswer;
                    setRiddleAnswers(newAnswers);
                    
                    if (currentRiddle < 2) {
                      setCurrentRiddle(prev => prev + 1);
                    } else {
                      // All riddles answered
                      const allCorrect = newAnswers.every(a => a);
                      if (allCorrect) {
                        setCharacterStats(prev => ({
                          ...prev,
                          gold: prev.gold + 100,
                          experience: prev.experience + 50
                        }));
                        showScrollToast(
                          'discovery',
                          "Riddles Solved!",
                          `King ${getCharacterName()}, your wisdom has unlocked the dungeon's secrets! You've earned 100 gold and gained valuable knowledge.`
                        );
                      } else {
                        showScrollToast(
                          'error',
                          "Riddles Failed",
                          `King ${getCharacterName()}, the ancient riddles proved too cryptic. Perhaps next time we shall fare better.`
                        );
                      }
                      // Convert dungeon tile to grass
                      const newGrid = [...grid];
                      newGrid[character.y][character.x] = {
                        id: `tile-${character.y}-${character.x}`,
                        type: "grass" as TileType,
                        connections: [],
                        rotation: 0,
                        revealed: true
                      };
                      dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
                      localStorage.setItem("realm-grid", JSON.stringify(newGrid));
                      setShowRiddleModal(false);
                    }
                  }}
                >
                  {answer}
                </Button>
              ))}
                  </div>
                    </div>
        </DialogContent>
      </Dialog>

      {/* Monster Modal */}
      <Dialog open={showMonsterModal} onOpenChange={setShowMonsterModal}>
        <DialogContent className="sm:max-w-[425px] bg-transparent border-0 p-0">
          <div className="w-full h-full">
            <TicTacToe
              onGameEnd={(playerWon, isTie) => {
                if (playerWon) {
                  // Player wins
                  setCharacterStats(prev => ({
                    ...prev,
                    gold: prev.gold + 50,
                    experience: prev.experience + 25
                  }));
                  showScrollToast(
                    'discovery',
                    "Victory!",
                    `King ${getCharacterName()}, your tactical brilliance has won the day! The monster's hoard of 50 gold is yours, and you've gained valuable experience.`
                  );
                } else if (isTie) {
                  // Tie game
                  setCharacterStats(prev => ({
                    ...prev,
                    gold: prev.gold + 10,
                    experience: prev.experience + 10
                  }));
                  showScrollToast(
                    'discovery',
                    "A Draw!",
                    `King ${getCharacterName()}, the battle ends in a stalemate. You've earned 10 gold and gained some experience from this encounter.`
                  );
                } else {
                  // Player loses
                  setCharacterStats(prev => ({
                    ...prev,
                    gold: Math.max(0, prev.gold - 25)
                  }));
                  showScrollToast(
                    'error',
                    "Defeat",
                    `King ${getCharacterName()}, the monster proved too cunning. Your forces retreat, and 25 gold was lost in the skirmish.`
                  );
                }
                setShowMonsterModal(false);
                
                // Convert monster tile to grass
                const newGrid = [...grid];
                newGrid[character.y][character.x] = {
                  id: `tile-${character.y}-${character.x}`,
                  type: "grass" as TileType,
                  connections: [],
                  rotation: 0,
                  revealed: true
                };
                dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
                localStorage.setItem("realm-grid", JSON.stringify(newGrid));
              }}
            />
                  </div>
        </DialogContent>
      </Dialog>

      {/* Treasure Modal */}
      <Dialog open={showTreasureModal} onOpenChange={setShowTreasureModal}>
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-b from-blue-900 to-blue-950">
          <DialogHeader>
            <DialogTitle>Treasure Found!</DialogTitle>
            <DialogDescription>
              You discovered a treasure chest!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{treasureAmount} Gold</p>
              <p className="text-gray-400">has been added to your balance</p>
                    </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => {
              // Convert mystery tile to grass after collecting treasure
              const newGrid = [...grid];
              newGrid[character.y][character.x] = {
                id: `tile-${character.y}-${character.x}`,
                type: "grass" as TileType,
                connections: [],
                rotation: 0,
                revealed: true
              };
              dispatchGrid({ type: 'UPDATE_GRID', payload: newGrid });
              localStorage.setItem("realm-grid", JSON.stringify(newGrid));
              setShowTreasureModal(false);
            }}>
              Collect Treasure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// City View Component
function CityView({ cityName, isTown, onReturn }: { cityName: string; isTown: boolean; onReturn: () => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Population</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{isTown ? "2,500" : "10,000"} citizens</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Buildings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{isTown ? "15" : "50"}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Notable Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {isTown ? (
              <>
                <li>Town Hall</li>
                <li>Marketplace</li>
                <li>Inn</li>
                <li>Blacksmith</li>
              </>
            ) : (
              <>
                <li>Royal Castle</li>
                <li>Grand Cathedral</li>
                <li>Market District</li>
                <li>Craftsmen's Quarter</li>
                <li>Mage's Tower</li>
              </>
            )}
          </ul>
        </CardContent>
      </Card>

      <Button onClick={onReturn} className="w-full">
        Return to Map
      </Button>
    </div>
  )
}


