"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Tile, TileType, InventoryItem as TileInventoryItem } from '@/types/tiles'
import { MapGrid } from '../components/MapGrid'
import { TileInventory } from '@/components/tile-inventory'
import { Switch } from "@/components/ui/switch"
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@clerk/nextjs'
import React from "react"
import { createTileFromNumeric, numericToTileType, tileTypeToNumeric } from "@/lib/grid-loader"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, Hammer, Move, Package, Settings, Save, Trash2, RotateCcw, PlusCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from 'next/navigation'
import { EnterLocationModal } from '@/components/enter-location-modal'
import { AnimalInteractionModal } from '@/components/animal-interaction-modal'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { gainGold } from '@/lib/gold-manager'
import { gainExperience } from '@/lib/experience-manager'
import { useCreatureStore } from '@/stores/creatureStore'
import { generateMysteryEvent, handleEventOutcome } from '@/lib/mystery-events'
import { cn } from "@/lib/utils"

import dynamic from 'next/dynamic';
import { getCharacterStats } from '@/lib/character-stats-manager';
import { checkMonsterSpawn, spawnMonsterOnTile, getMonsterAchievementId, MonsterType } from '@/lib/monster-spawn-manager';
import { MonsterBattle } from '@/components/monster-battle';
import { RealmAnimationWrapper } from '@/components/realm-animation-wrapper';
import { HeaderSection } from '@/components/HeaderSection';
// Import new data loaders hook
import { useDataLoaders } from '@/hooks/use-data-loaders';
const RevealOverlay = dynamic(() => import('../reveal/page'), { ssr: false });

// Constants
const GRID_COLS = 13;
const INITIAL_ROWS = 7
const AUTOSAVE_INTERVAL = 30000 // 30 seconds

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
    image: `/images/tiles/${type}-tile.png`,
    cost: 0,
    quantity: 0
});

// Special handling for tiles that might not have exact image files
const getTileImage = (type: TileType): string => {
    // Check if the exact image exists, otherwise use a fallback
    const exactPath = `/images/tiles/${type}-tile.png`;
    
    return exactPath;
};

const allTileTypes: TileType[] = [
    'empty', 'mountain', 'grass', 'forest', 'water', 'city', 'town', 'mystery',
    'portal-entrance', 'portal-exit', 'snow', 'cave', 'dungeon', 'castle', 'ice', 'desert',
    'lava', 'volcano'
];

const initialInventory: Record<TileType, Tile> = {
    grass: { ...defaultTile('grass'), cost: 25, owned: 10 },
    water: { ...defaultTile('water'), cost: 50, owned: 10 },
    forest: { ...defaultTile('forest'), cost: 75, owned: 10 },
    mountain: { ...defaultTile('mountain'), cost: 20, owned: 10 },
    desert: { ...defaultTile('desert'), cost: 100, owned: 10 },
    ice: { ...defaultTile('ice'), cost: 120, owned: 10 },
    snow: { ...defaultTile('snow'), cost: 125, owned: 10 },
    cave: { ...defaultTile('cave'), cost: 200, owned: 5 },
    town: { ...defaultTile('town'), cost: 250, owned: 1 },
    city: { ...defaultTile('city'), cost: 300, owned: 1 },
    castle: { ...defaultTile('castle'), cost: 500, owned: 1 },
    dungeon: { ...defaultTile('dungeon'), cost: 400, owned: 2 },
    volcano: { ...defaultTile('volcano'), cost: 500, owned: 1 },
    lava: { ...defaultTile('lava'), cost: 200, owned: 5 },
    'portal-entrance': { ...defaultTile('portal-entrance'), cost: 250, owned: 1 },
    'portal-exit': { ...defaultTile('portal-exit'), cost: 250, owned: 1 },
    mystery: { ...defaultTile('mystery'), cost: 300, owned: 1 },
    empty: { ...defaultTile('empty'), cost: 0, owned: 0 },
    sheep: { ...defaultTile('sheep'), cost: 0, owned: 0 },
    horse: { ...defaultTile('horse'), cost: 0, owned: 0 },
    special: { ...defaultTile('special'), cost: 0, owned: 0 },
    swamp: { ...defaultTile('swamp'), cost: 0, owned: 0 },
    treasure: { ...defaultTile('treasure'), cost: 0, owned: 0 },
        monster: { ...defaultTile('monster'), cost: 0, owned: 0 },
    vacant: { ...defaultTile('empty'), cost: 0, owned: 0 }, // Use empty tile as fallback for vacant
};

const createBaseGrid = (): Tile[][] => {
    return Array.from({ length: INITIAL_ROWS }, (_, y) =>
        Array.from({ length: GRID_COLS }, (_, x) => ({
            ...defaultTile('grass'),
            x,
            y,
            id: `grass-${x}-${y}`,
            image: getTileImage('grass') // Use the corrected image path
        }))
    );
};

const loadInitialGridFromCSV = async (): Promise<Tile[][]> => {
    try {
        const response = await fetch('/data/initial-grid.csv');
        if (!response.ok) throw new Error("CSV not found");
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
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

// Helper to get adjacent positions
function getAdjacentPositions(x: number, y: number, grid: any[][]): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  if (!grid || !Array.isArray(grid) || !Array.isArray(grid[0])) return positions;
  // up
  if (
    y > 0 &&
    Array.isArray(grid[y - 1]) &&
    typeof x === 'number' &&
    // @ts-ignore: runtime guard ensures grid[y-1][x] is defined
    grid[y - 1][x] !== undefined
  ) {
    positions.push({ x, y: y - 1 });
  }
  // down
  if (
    y < grid.length - 1 &&
    Array.isArray(grid[y + 1]) &&
    typeof x === 'number' &&
    // @ts-ignore: runtime guard ensures grid[y+1][x] is defined
    grid[y + 1][x] !== undefined
  ) {
    positions.push({ x, y: y + 1 });
  }
  // left
  if (
    x > 0 &&
    Array.isArray(grid[y]) &&
    // @ts-ignore: runtime guard ensures grid[y][x-1] is defined
    grid[y][x - 1] !== undefined
  ) {
    positions.push({ x: x - 1, y });
  }
  // right
  if (
    Array.isArray(grid[y]) &&
    x < grid[y].length - 1 &&
    // @ts-ignore: runtime guard ensures grid[y][x+1] is defined
    grid[y][x + 1] !== undefined
  ) {
    positions.push({ x: x + 1, y });
  }
  return positions;
}

function assignTile(row: Tile[], x: number, tile: Tile) {
  row[x] = {
    ...tile,
    type: 'grass',
    name: 'Grass',
    image: '/images/tiles/grass-tile.png',
    isVisited: true,
  };
}

// --- Creature achievement requirement mapping ---
const creatureRequirements = [
  { id: '001', action: 'forest_tiles_destroyed', threshold: 1 },
  { id: '002', action: 'forest_tiles_destroyed', threshold: 5 },
  { id: '003', action: 'forest_tiles_destroyed', threshold: 10 },
  { id: '004', action: 'water_tiles_placed', threshold: 1 },
  { id: '005', action: 'water_tiles_placed', threshold: 5 },
  { id: '006', action: 'water_tiles_placed', threshold: 10 },
  { id: '007', action: 'forest_tiles_placed', threshold: 1 },
  { id: '008', action: 'forest_tiles_placed', threshold: 5 },
  { id: '009', action: 'forest_tiles_placed', threshold: 10 },
  { id: '010', action: 'mountain_tiles_destroyed', threshold: 1 },
  { id: '011', action: 'mountain_tiles_destroyed', threshold: 5 },
  { id: '012', action: 'mountain_tiles_destroyed', threshold: 10 },
  { id: '013', action: 'ice_tiles_placed', threshold: 1 },
  { id: '014', action: 'ice_tiles_placed', threshold: 5 },
  { id: '015', action: 'ice_tiles_placed', threshold: 10 },
  // Add more as needed
];

export default function RealmPage() {
    const { toast } = useToast();
    const { user, isLoaded: isAuthLoaded } = useUser();
    const { getToken } = useAuth();
    const userId = user?.id;
    const isGuest = !user;
    const router = useRouter();
    const { discoverCreature } = useCreatureStore();
    const {
        loadGridData,
        saveGridData,
        loadCharacterPosition,
        saveCharacterPosition,
        loadTileInventory,
        saveTileInventory
    } = useDataLoaders();

    const [grid, setGrid] = useState<Tile[][]>(createBaseGrid());
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [characterPosition, setCharacterPosition] = useState<{ x: number; y: number }>({ x: 2, y: 0 });
    const [inventory, setInventory] = useState<Record<TileType, Tile>>(initialInventory);
    const [showInventory, setShowInventory] = useState(false);
    const [selectedTile, setSelectedTile] = useState<TileInventoryItem | null>(null);
    const [autoSave, setAutoSave] = useState(true);
    const [gameMode, setGameMode] = useState<'build' | 'move'>('move');
    const [hasVisitedRealm, setHasVisitedRealm] = useState(false);
    const [modalState, setModalState] = useState<{ isOpen: boolean; locationType: 'city' | 'town'; locationName: string } | null>(null);
    const defaultCharacterPosition = { x: 2, y: 0 };
    const [hasCheckedInitialPosition, setHasCheckedInitialPosition] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldRevealImage, setShouldRevealImage] = useState(false);
    const closeBtnRef = useRef<HTMLButtonElement>(null);
    const [horsePos, setHorsePos] = useState<{ x: number; y: number } | null>(() => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('horsePos');
        if (saved) return JSON.parse(saved);
      }
      return { x: 10, y: 4 };
    });
    const [eaglePos, setEaglePos] = useState<{ x: number; y: number } | null>(null);
    const [isHorsePresent, setIsHorsePresent] = useState(true);
    const [isPenguinPresent, setIsPenguinPresent] = useState(false);
    const [inventoryTab, setInventoryTab] = useState<'place' | 'buy'>('place');
    const [castleEvent, setCastleEvent] = useState<{ open: boolean, result?: string, reward?: string } | null>(null);
    const [dungeonEvent, setDungeonEvent] = useState<{ open: boolean, questionIndex: number, score: number, prevNumber: number, questions: { fact: string, number: number }[], result?: string } | null>(null);
    const [caveEvent, setCaveEvent] = useState<{ open: boolean, result?: string } | null>(null);
    const [mysteryEvent, setMysteryEvent] = useState<{ open: boolean, event: any, choice?: string } | null>(null);
    const [castleDiceRolling, setCastleDiceRolling] = useState(false);
    const [castleDiceValue, setCastleDiceValue] = useState<number | null>(null);
    const [lastMysteryTile, setLastMysteryTile] = useState<{ x: number; y: number } | null>(null);
    const [mysteryEventCompleted, setMysteryEventCompleted] = useState(false);
    const [penguinPos, setPenguinPos] = useState<{ x: number; y: number } | null>(null);
    const [sheepPos, setSheepPos] = useState<{ x: number; y: number } | null>(() => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('sheepPos');
        if (saved) return JSON.parse(saved);
      }
      return { x: 5, y: 2 };
    });
    const [isSheepPresent, setIsSheepPresent] = useState(true);
    const [horseCaught, setHorseCaught] = useState(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('horseCaught') === 'true';
      }
      return false;
    });
    const [characterStats, setCharacterStats] = useState(() => getCharacterStats());

    // Load actual inventory from database and apply starting quantities if needed
    const [inventoryAsItems, setInventoryAsItems] = useState<TileInventoryItem[]>([]);

    // Animal interaction modal state
    const [animalInteractionModal, setAnimalInteractionModal] = useState<{
      isOpen: boolean;
      animalType: 'horse' | 'sheep' | 'penguin' | 'eagle';
      animalName: string;
    } | null>(null);

    // Monster battle state
    const [battleOpen, setBattleOpen] = useState(false);
    const [currentMonster, setCurrentMonster] = useState<'dragon' | 'goblin' | 'troll' | 'wizard' | 'pegasus' | 'fairy'>('dragon');

    // Tile size state for animal positioning
    const [tileSize, setTileSize] = useState(80);

    // Handler for tile size changes from MapGrid
    const handleTileSizeChange = useCallback((newTileSize: number) => {
      console.log('[Realm] Tile size changed to:', newTileSize);
      setTileSize(newTileSize);
    }, []);

    // Handler for animal interactions
    const handleAnimalInteraction = useCallback((animalType: 'horse' | 'sheep' | 'penguin' | 'eagle') => {
      if (animalType === 'horse') {
        setHorseCaught(true);
        localStorage.setItem('horseCaught', 'true');
        
        // Dispatch horse-caught event
        window.dispatchEvent(new CustomEvent('horse-caught'));
        
        // Show notification
        toast({
          title: "Horse Tamed!",
          description: "You successfully tamed the wild horse!",
        });
      }
      // Add other animal interactions here as needed
    }, []);

    // Debug animal positioning
    useEffect(() => {
      console.log('[Realm] Animal positioning debug:', {
        tileSize,
        penguinPos: penguinPos ? { x: penguinPos.x * tileSize, y: penguinPos.y * tileSize } : null,
        horsePos: horsePos ? { x: horsePos.x * tileSize, y: horsePos.y * tileSize } : null,
        sheepPos: sheepPos ? { x: sheepPos.x * tileSize, y: sheepPos.y * tileSize } : null,
        eaglePos: eaglePos ? { x: eaglePos.x * tileSize, y: eaglePos.y * tileSize } : null
      });
    }, [tileSize, penguinPos, horsePos, sheepPos, eaglePos]);

    // --- Penguin and Achievement Logic Helpers ---
    function findFirstIceTile(grid: Tile[][]): { x: number; y: number } | null {
      for (let y = 0; y < grid.length; y++) {
        const row = grid[y];
        if (!row) continue;
        for (let x = 0; x < row.length; x++) {
          if (row[x]?.type === 'ice') return { x, y };
        }
      }
      return null;
    }

    function countTiles(grid: Tile[][], type: string): number {
      let count = 0;
      for (let y = 0; y < grid.length; y++) {
        const row = grid[y];
        if (!row) continue;
        for (let x = 0; x < row.length; x++) {
          if (row[x]?.type === type) count++;
        }
      }
      return count;
    }

    // --- Penguin respawn and disappearance logic ---
    useEffect(() => {
      if (!Array.isArray(grid)) return;
      const hasIce = grid.some(row => row && row.some(tile => tile?.type === 'ice'));
      console.log('[Realm] Penguin logic - hasIce:', hasIce, 'isPenguinPresent:', isPenguinPresent);
      
      if (!hasIce && isPenguinPresent) {
        console.log('[Realm] Penguin logic - no ice tiles, removing penguin');
        setIsPenguinPresent(false);
        setPenguinPos(null);
      } else if (hasIce && !isPenguinPresent) {
        console.log('[Realm] Penguin logic - ice tiles found, placing penguin');
        // Find the first ice tile, prioritizing center tiles
        let bestIcePos = null;
        const centerX = Math.floor(GRID_COLS / 2);
        const centerY = Math.floor(INITIAL_ROWS / 2);
        
        console.log('[Realm] Penguin logic - center area:', { centerX, centerY });
        
        // First try to find ice tiles in the center area
        for (let y = centerY - 1; y <= centerY + 1; y++) {
          for (let x = centerX - 1; x <= centerX + 1; x++) {
            if (y >= 0 && y < grid.length && x >= 0 && x < GRID_COLS) {
              const tile = grid[y]?.[x];
              console.log('[Realm] Penguin logic - checking center tile:', { x, y, type: tile?.type });
              if (tile?.type === 'ice') {
                bestIcePos = { x, y };
                console.log('[Realm] Penguin logic - found center ice tile:', bestIcePos);
                break;
              }
            }
          }
          if (bestIcePos) break;
        }
        
        // If no center ice tile found, find any ice tile
        if (!bestIcePos) {
          console.log('[Realm] Penguin logic - no center ice tile, searching all tiles');
          bestIcePos = findFirstIceTile(grid);
          console.log('[Realm] Penguin logic - found ice tile:', bestIcePos);
        }
        
        console.log('[Realm] Penguin logic - final ice tile position:', bestIcePos);
        if (bestIcePos) {
          setPenguinPos(bestIcePos);
          setIsPenguinPresent(true);
          console.log('[Realm] Penguin logic - penguin placed at:', bestIcePos);
        } else {
          console.log('[Realm] Penguin logic - no ice tile found for penguin');
        }
      }
    }, [grid]);

    // Debug animal states (commented out to reduce console spam)
    // useEffect(() => {
    //   console.log('[Realm] Animal states - horse:', { isHorsePresent, horsePos, horseCaught });
    //   console.log('[Realm] Animal states - sheep:', { isSheepPresent, sheepPos });
    //   console.log('[Realm] Animal states - penguin:', { isPenguinPresent, penguinPos });
    //   console.log('[Realm] Grid bounds:', { cols: GRID_COLS, rows: INITIAL_ROWS });
    // }, [isHorsePresent, horsePos, horseCaught, isSheepPresent, sheepPos, isPenguinPresent, penguinPos]);

    // Animal movement logic
    useEffect(() => {
      if (!Array.isArray(grid)) return;

      const moveAnimals = () => {
        // Move sheep every 5 seconds
        if (isSheepPresent && sheepPos) {
          // console.log('[Realm] Sheep movement - current position:', sheepPos);
          const adjacentPositions = getAdjacentPositions(sheepPos.x, sheepPos.y, grid);
          // console.log('[Realm] Sheep movement - adjacent positions:', adjacentPositions);
          
          const validPositions = adjacentPositions.filter(pos => {
            const tile = grid[pos.y]?.[pos.x];
            const isValid = tile && tile.type === 'grass' && !tile.hasMonster;
            // console.log('[Realm] Sheep movement - checking position:', pos, 'tile type:', tile?.type, 'has monster:', tile?.hasMonster, 'valid:', isValid);
            return isValid;
          });
          
          // console.log('[Realm] Sheep movement - valid positions:', validPositions);
          
          if (validPositions.length > 0) {
            const newPos = validPositions[Math.floor(Math.random() * validPositions.length)];
            if (newPos) {
              setSheepPos(newPos);
              localStorage.setItem('sheepPos', JSON.stringify(newPos));
              // console.log('[Realm] Sheep moved to:', newPos);
            }
          } else {
            // console.log('[Realm] Sheep movement - no valid positions found');
          }
        }
      };

      const interval = setInterval(moveAnimals, 5000); // Move every 5 seconds
      return () => clearInterval(interval);
    }, [grid, isSheepPresent, sheepPos]);

    // Horse interaction logic
    useEffect(() => {
      if (!Array.isArray(grid) || !isHorsePresent || horseCaught || !horsePos) return;

      // Check if player is on the same tile as horse
      if (characterPosition.x === horsePos.x && characterPosition.y === horsePos.y) {
        console.log('[Realm] Player encountered the horse!');
        
        // Show animal interaction modal
        setAnimalInteractionModal({
          isOpen: true,
          animalType: 'horse',
          animalName: 'Wild Horse'
        });
      }
    }, [characterPosition, horsePos, isHorsePresent, horseCaught, grid]);

    // --- Load and transform completed mystery tiles on page load ---
    useEffect(() => {
      if (typeof window !== 'undefined' && grid.length > 0) {
        const completedMysteryTiles = JSON.parse(localStorage.getItem('completedMysteryTiles') || '[]');
        if (completedMysteryTiles.length > 0) {
          let gridChanged = false;
          const newGrid = grid.map(row => row.slice());
          
          completedMysteryTiles.forEach((tileKey: string) => {
            const parts = tileKey.split('-');
            if (parts.length === 2) {
              const xStr = parts[0];
              const yStr = parts[1];
              if (xStr && yStr) {
                const x = parseInt(xStr, 10);
                const y = parseInt(yStr, 10);
                
                if (!isNaN(x) && !isNaN(y) && newGrid[y]?.[x] && newGrid[y][x].type === 'mystery') {
                  // Transform mystery tile to grass tile
                  newGrid[y][x] = { 
                    ...defaultTile('grass'), 
                    x, 
                    y, 
                    id: `grass-${x}-${y}`,
                    image: getTileImage('grass')
                  };
                  gridChanged = true;
                }
              }
            }
          });
          
          if (gridChanged) {
            setGrid(newGrid);
            console.log('Transformed completed mystery tiles to grass tiles');
          }
        }
      }
    }, [grid.length]); // Only run when grid is loaded

    // --- Listen for mystery-event-completed and update grid ---
    useEffect(() => {
      function handler() {
        if (lastMysteryTile) {
          const { x, y } = lastMysteryTile;
          if (typeof x === 'number' && typeof y === 'number') {
            const newGrid = grid.map(row => row.slice());
            if (newGrid[y]?.[x]) {
              // Change mystery tile to grass tile
              newGrid[y][x] = { 
                ...defaultTile('grass'), 
                x, 
                y, 
                id: `grass-${x}-${y}`,
                image: getTileImage('grass')
              };
              setGrid(newGrid);
              
              // Save to backend
              fetch('/api/realm-tiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y, tile_type: tileTypeToNumeric['grass'] })
              }).catch(() => {
                toast({ title: 'Error', description: 'Failed to save grass tile', variant: 'destructive' });
              });
              
              // Save completed mystery tile to localStorage for persistence
              if (typeof window !== 'undefined') {
                const completedMysteryTiles = JSON.parse(localStorage.getItem('completedMysteryTiles') || '[]');
                const tileKey = `${x}-${y}`;
                if (!completedMysteryTiles.includes(tileKey)) {
                  completedMysteryTiles.push(tileKey);
                  localStorage.setItem('completedMysteryTiles', JSON.stringify(completedMysteryTiles));
                }
              }
              
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('update-grid', { detail: { grid: newGrid } }));
              }
            }
          }
          setLastMysteryTile(null);
          setMysteryEventCompleted(false);
        }
      }
      window.addEventListener('mystery-event-completed', handler);
      return () => window.removeEventListener('mystery-event-completed', handler);
    }, [lastMysteryTile, grid]);

    // --- General achievement tracker ---
    useEffect(() => {
      // Track tile actions for achievements
      const actionCounts: Record<string, number> = {};
      for (const req of creatureRequirements) {
        // e.g., 'forest_tiles_destroyed', 'ice_tiles_placed', etc.
        const [tileType, action] = req.action.split('_tiles_');
        if (action === 'placed' && tileType) {
          actionCounts[req.action] = countTiles(grid, tileType as string);
        } else if (action === 'destroyed') {
          // For destroyed, you may need to track this via a separate state or event log
          // For now, skip unless you have a destruction log
          actionCounts[req.action] = 0;
        }
      }
      for (const req of creatureRequirements) {
        const count = actionCounts[req.action];
        if (typeof count === 'number' && typeof req.threshold === 'number' && count >= req.threshold) {
          // Unlock achievement if not already unlocked
          if (userId) {
            // Add a guard to prevent repeated calls for the same achievement
            const achievementKey = `unlocked_${req.id}`;
            if (!sessionStorage.getItem(achievementKey)) {
              sessionStorage.setItem(achievementKey, 'true');
              (async () => {
                const token = await getToken({ template: 'supabase' });
                fetch('/api/achievements/unlock', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ achievementId: req.id })
                });
              })();
              discoverCreature(req.id);
            }
          }
        }
      }
    }, [grid, userId, discoverCreature, getToken]);

    // Achievement unlock effect
    useEffect(() => {
        if (!hasVisitedRealm && isAuthLoaded) {
            setHasVisitedRealm(true);
            // Unlock the Necrion achievement (000) - only once per session
            if (userId && !sessionStorage.getItem('unlocked_000')) {
                sessionStorage.setItem('unlocked_000', 'true');
                (async () => {
                  const token = await getToken({ template: 'supabase' });
                  fetch('/api/achievements/unlock', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ achievementId: '000' })
                  })
                  .then(res => {
                      if (!res.ok) throw new Error('Failed to unlock achievement');
                  })
                  .catch(err => {
                      toast({
                          title: 'Achievement Unlock Failed',
                          description: 'Could not unlock the Necrion achievement. Please try again later.',
                          variant: 'destructive',
                      });
                      console.error('Achievement unlock error:', err);
                  });
                })();
                // Also unlock Necrion in the local creature store
                discoverCreature('000');
                toast({
                    title: "New achievement",
                    description: "Necrion - You've discovered the realm map!",
                });
            }
        }
    }, [hasVisitedRealm, isAuthLoaded, userId, setHasVisitedRealm, toast, discoverCreature, getToken]);

    // Load data from Supabase with localStorage fallback
    useEffect(() => {
        const loadUserData = async () => {
            if (!isAuthLoaded || isGuest || !userId) return;
            
            console.log('[Realm] loadUserData called for userId:', userId);
            setIsLoading(true);
            try {
                // Load grid data
                console.log('[Realm] Calling loadGridData...');
                const gridResult = await loadGridData(userId);
                console.log('[Data Loaders] loadGridData called for userId:', userId);
                console.log('[Data Loaders] Making API call to: /api/data?type=grid&userId=' + userId);
                
                if (gridResult && gridResult.data) {
                    console.log('[Data Loaders] API response status: 200');
                    console.log('[Realm] Grid data received:', gridResult.data);
                    console.log('[Realm] Grid data type:', typeof gridResult.data);
                    console.log('[Realm] Grid data is array:', Array.isArray(gridResult.data));
                    console.log('[Realm] Grid data length:', gridResult.data?.length);
                    
                    // The API returns { data: { grid: [...] } }, so we need to access gridResult.data.grid
                    const actualGridData = gridResult.data.grid;
                    console.log('[Realm] Actual grid data:', actualGridData);
                    console.log('[Realm] Actual grid data type:', typeof actualGridData);
                    console.log('[Realm] Actual grid data is array:', Array.isArray(actualGridData));
                    console.log('[Realm] Actual grid data length:', actualGridData?.length);
                    
                    if (actualGridData && Array.isArray(actualGridData)) {
                        setGrid(actualGridData);
                    } else {
                        console.log('[Realm] No valid grid data found, trying to load from realm-tiles API...');
                        // Try to load from realm-tiles API instead of CSV
                        try {
                            const res = await fetch('/api/realm-tiles');
                            const data = await res.json();
                            console.log('[Realm] Realm-tiles API response:', { status: res.status, data });
                            if (res.ok && data.tiles && Array.isArray(data.tiles)) {
                                const maxRow = Math.max(...data.tiles.map((row: any) => row.y ?? 0), INITIAL_ROWS - 1);
                                const gridArr: Tile[][] = Array.from({ length: maxRow + 1 }, (_, y) =>
                                    Array.from({ length: GRID_COLS }, (_, x) => defaultTile('grass'))
                                );
                                console.log('[Realm] Processing tiles data:', data.tiles);
                                data.tiles.forEach((row: any) => {
                                    if (!row) return;
                                    if (!gridArr[row.y] || !Array.isArray(gridArr[row.y])) return;
                                    for (let x = 0; x < GRID_COLS; x++) {
                                        const typeNum = row[`tile_${x}_type`];
                                        const tileType = typeof typeNum === 'number' ? numericToTileType[typeNum] || 'grass' : 'grass';
                                        const rowArr = gridArr[row.y];
                                        if (!rowArr || typeof rowArr[x] === 'undefined') continue;
                                        rowArr[x] = {
                                            ...defaultTile(tileType),
                                            x,
                                            y: row.y,
                                            id: `${tileType}-${x}-${row.y}`,
                                        };
                                        if (tileType !== 'grass') {
                                            console.log('[Realm] Loaded tile:', { x, y: row.y, type: tileType, typeNum });
                                        }
                                    }
                                });
                                setGrid(gridArr);
                            } else {
                                console.log('[Realm] No valid tiles data, loading initial grid from CSV...');
                                const initialGrid = await loadInitialGridFromCSV();
                                setGrid(initialGrid);
                            }
                        } catch (err) {
                            console.error('[Realm] Error loading tiles:', err);
                            console.log('[Realm] Loading initial grid from CSV...');
                            const initialGrid = await loadInitialGridFromCSV();
                            setGrid(initialGrid);
                        }
                    }
                } else {
                    console.log('[Data Loaders] API response status: 404 - using fallback');
                    // Fallback to API or create base grid
                    try {
                        console.log('[Realm] Loading tiles from API...');
                        const res = await fetch('/api/realm-tiles');
                        const data = await res.json();
                        console.log('[Realm] API response:', { status: res.status, data });
                        if (res.ok && data.tiles && Array.isArray(data.tiles)) {
                            const maxRow = Math.max(...data.tiles.map((row: any) => row.y ?? 0), INITIAL_ROWS - 1);
                            const gridArr: Tile[][] = Array.from({ length: maxRow + 1 }, (_, y) =>
                                Array.from({ length: GRID_COLS }, (_, x) => defaultTile('empty'))
                            );
                            console.log('[Realm] Processing tiles data:', data.tiles);
                            data.tiles.forEach((row: any) => {
                                if (!row) return;
                                if (!gridArr[row.y] || !Array.isArray(gridArr[row.y])) return;
                                for (let x = 0; x < GRID_COLS; x++) {
                                    const typeNum = row[`tile_${x}_type`];
                                    const tileType = typeof typeNum === 'number' ? numericToTileType[typeNum] || 'empty' : 'empty';
                                    const rowArr = gridArr[row.y];
                                    if (!rowArr || typeof rowArr[x] === 'undefined') continue;
                                    rowArr[x] = {
                                        ...defaultTile(tileType),
                                        x,
                                        y: row.y,
                                        id: `${tileType}-${x}-${row.y}`,
                                    };
                                    if (tileType !== 'empty') {
                                        console.log('[Realm] Loaded tile:', { x, y: row.y, type: tileType, typeNum });
                                    }
                                }
                            });
                            setGrid(gridArr);
                        } else {
                            console.warn('[Realm] Invalid tiles data from API:', data);
                            console.log('[Realm] Loading initial grid from CSV...');
                            const initialGrid = await loadInitialGridFromCSV();
                            setGrid(initialGrid);
                        }
                    } catch (err) {
                        console.error('[Realm] Error loading tiles:', err);
                        console.log('[Realm] Loading initial grid from CSV...');
                        const initialGrid = await loadInitialGridFromCSV();
                        setGrid(initialGrid);
                    }
                }

                // Load character position
                const position = await loadCharacterPosition(userId);
                if (position) {
                    setCharacterPosition(position);
                }

                // Load tile inventory
                const inventoryResult = await loadTileInventory(userId);
                console.log('[Realm] Inventory data received:', inventoryResult);
                if (inventoryResult && inventoryResult.data && Object.keys(inventoryResult.data).length > 0) {
                    // Merge with initial inventory
                    const mergedInventory = { ...initialInventory };
                    Object.entries(inventoryResult.data).forEach(([tileId, item]: [string, any]) => {
                        if (!item || typeof item !== 'object') {
                            console.warn('[Realm] Invalid inventory item:', item);
                            return;
                        }
                        const tileType = item.type as TileType;
                        if (mergedInventory[tileType]) {
                            mergedInventory[tileType] = {
                                ...mergedInventory[tileType],
                                owned: item.quantity || 0,
                                quantity: item.quantity || 0, // Update quantity property too
                                cost: item.cost || mergedInventory[tileType].cost
                            };
                        }
                    });
                    setInventory(mergedInventory);
                } else {
                    // If no inventory data, start with empty quantities instead of defaults
                    const emptyInventory = { ...initialInventory };
                    Object.keys(emptyInventory).forEach(tileType => {
                        emptyInventory[tileType as TileType] = {
                            ...emptyInventory[tileType as TileType],
                            owned: 0,
                            quantity: 0
                        };
                    });
                    setInventory(emptyInventory);
                }

                // Load hasVisitedRealm from localStorage as fallback
                const visited = localStorage.getItem('hasVisitedRealm');
                if (visited === 'true') {
                    setHasVisitedRealm(true);
                }

            } catch (error) {
                console.error('Error loading user data:', error);
                toast({ 
                    title: 'Error', 
                    description: 'Failed to load your data. Using default settings.', 
                    variant: 'destructive' 
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [isAuthLoaded, isGuest, userId, getToken]);

    // --- Polling for grid changes instead of real-time sync ---
    useEffect(() => {
        if (!isAuthLoaded || isGuest || !userId) return;
        
        const pollInterval = setInterval(async () => {
            try {
                // Use the same authenticated approach as loadGridData
                const gridResult = await loadGridData(userId);
                if (gridResult && gridResult.data && Array.isArray(gridResult.data)) {
                    setGrid(gridResult.data);
                }
            } catch (error) {
                console.error('Error polling for grid changes:', error);
            }
        }, 10000); // Poll every 10 seconds instead of 5
        
        return () => clearInterval(pollInterval);
    }, [isAuthLoaded, isGuest, userId, loadGridData, getToken]);

    // Auto-save grid to Supabase with localStorage fallback
    useEffect(() => {
        if (!autoSave || isLoading || !userId) return;
        
        const saveTimeout = setTimeout(async () => {
            try {
                setSaveStatus('saving');
                
                // Save to Supabase with localStorage fallback
                const result = await saveGridData(userId, grid);
                
                if (result.success) {
                    setSaveStatus('saved');
                    setTimeout(() => setSaveStatus('idle'), 2000);
                } else {
                    setSaveStatus('error');
                    setTimeout(() => setSaveStatus('idle'), 3000);
                }
            } catch (error) {
                console.error('Save error:', error);
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        }, 1000);
        
        return () => clearTimeout(saveTimeout);
    }, [grid, autoSave, isLoading, userId, getToken]);

    // Listen for tile inventory updates
    useEffect(() => {
        const handleTileInventoryUpdate = async () => {
            console.log('[Realm] Tile inventory update event received');
            if (!userId) return;
            
            try {
                // Reload tile inventory
                const inventoryResult = await loadTileInventory(userId);
                console.log('[Realm] Reloaded inventory data:', inventoryResult);
                if (inventoryResult && inventoryResult.data && Object.keys(inventoryResult.data).length > 0) {
                    // Merge with initial inventory
                    const mergedInventory = { ...initialInventory };
                    Object.entries(inventoryResult.data).forEach(([tileId, item]: [string, any]) => {
                        if (!item || typeof item !== 'object') {
                            console.warn('[Realm] Invalid inventory item:', item);
                            return;
                        }
                        const tileType = item.type as TileType;
                        if (mergedInventory[tileType]) {
                            mergedInventory[tileType] = {
                                ...mergedInventory[tileType],
                                owned: item.quantity || 0,
                                quantity: item.quantity || 0,
                                cost: item.cost || mergedInventory[tileType].cost
                            };
                        }
                    });
                    setInventory(mergedInventory);
                    
                    // Also update inventoryAsItems
                    const items: TileInventoryItem[] = Object.values(inventoryResult.data)
                        .filter((t: any) => t.type !== 'empty' && !['sheep', 'horse', 'special', 'swamp', 'treasure', 'monster'].includes(t.type))
                        .map((t: any) => ({
                            ...t,
                            cost: t.cost ?? 0,
                            quantity: t.quantity || 0,
                        }));
                    console.log('[Realm] Updated inventoryAsItems:', items.map(i => `${i.type}: ${i.quantity}`));
                    setInventoryAsItems(items);
                }
            } catch (error) {
                console.error('[Realm] Error reloading tile inventory:', error);
            }
        };
        
        window.addEventListener('tile-inventory-update', handleTileInventoryUpdate);
        
        return () => {
            window.removeEventListener('tile-inventory-update', handleTileInventoryUpdate);
        };
    }, [userId, getToken]);

    // Load inventory items from database and apply starting quantities if needed
    useEffect(() => {
        const loadInventoryItems = async () => {
            if (!userId) return;
            
            // Get user level for starting quantities
            const userLevel = (() => {
                try {
                    const stats = JSON.parse(localStorage.getItem('character-stats') || '{}');
                    return stats.level || 1;
                } catch (error) {
                    return 1;
                }
            })();
            
            console.log('[Realm] Loading inventory items...');
            console.log('[Realm] User level:', userLevel);
            
            try {
                const inventoryResult = await loadTileInventory(userId);
                console.log('[Realm] Database result:', inventoryResult);
                
                if (inventoryResult && inventoryResult.data) {
                    const items: TileInventoryItem[] = Object.values(inventoryResult.data)
                        .filter((t: any) => t.type !== 'empty' && !['sheep', 'horse', 'special', 'swamp', 'treasure', 'monster'].includes(t.type))
                        .map((t: any) => ({
                            ...t,
                            cost: t.cost ?? 0,
                            quantity: t.quantity || 0,
                        }));
                    
                    // Check if user has any foundation tiles, if not, give starting quantities
                    const foundationTiles = ['grass', 'water', 'forest', 'mountain'];
                    const hasFoundationTiles = items.some(item => foundationTiles.includes(item.type) && item.quantity > 0);
                    
                    if (!hasFoundationTiles && userLevel >= 1) {
                        console.log('[Realm] No foundation tiles found, giving starting quantities');
                        // Give starting quantities for foundation tiles
                        foundationTiles.forEach(tileType => {
                            const existingItem = items.find(item => item.type === tileType);
                            if (!existingItem || existingItem.quantity === 0) {
                                items.push({
                                    id: tileType,
                                    name: tileType.charAt(0).toUpperCase() + tileType.slice(1),
                                    type: tileType as TileType,
                                    quantity: 5,
                                    cost: 0,
                                    connections: [],
                                    description: '',
                                    rotation: 0 as 0 | 90 | 180 | 270,
                                    revealed: true,
                                    isVisited: false,
                                    x: 0,
                                    y: 0,
                                    ariaLabel: `${tileType} tile`,
                                    image: `/images/tiles/${tileType}-tile.png`,
                                });
                            }
                        });
                    } else {
                        console.log('[Realm] Found existing tiles:', items.map(i => `${i.type}: ${i.quantity}`));
                    }
                    
                    console.log('[Realm] Inventory items loaded:', items.map(i => `${i.type}: ${i.quantity}`));
                    setInventoryAsItems(items);
                }
            } catch (error) {
                console.error('[Realm] Error loading inventory items:', error);
            }
        };
        
        loadInventoryItems();
    }, [userId]);

    // Place tile: update grid and send only the changed tile to backend
    const handlePlaceTile = async (x: number, y: number) => {
        // Check for monster battle first (regardless of game mode)
        const clickedTile = grid[y]?.[x];
        if (clickedTile?.hasMonster) {
            setCurrentMonster(clickedTile.hasMonster);
            setBattleOpen(true);
            return;
        }
        
        // Handle movement if in move mode
        if (gameMode === 'move') {
            handleCharacterMove(x, y);
            return;
        }
        
        if (gameMode !== 'build' || !selectedTile) return;
        const tileToPlace = inventory[selectedTile.type];
        if (!tileToPlace || (tileToPlace.owned ?? 0) <= 0) {
            toast({
                title: "Cannot Place Tile",
                description: "You don't have any of this tile type in your inventory",
                variant: "destructive",
            });
            return;
        }
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => row.slice());
            if (newGrid[y]?.[x]) {
                newGrid[y][x] = { ...tileToPlace, x, y, owned: 1 };
            }
            return newGrid;
        });
        setInventory(prev => {
            const newInventory = { ...prev };
            const invTile = newInventory[selectedTile.type];
            if (invTile) {
                invTile.owned = (invTile.owned ?? 0) - 1;
            }
            
            // Save inventory to Supabase
            if (userId) {
                saveTileInventory(userId, newInventory).catch(error => {
                    console.error('Failed to save inventory:', error);
                });
            }
            
            return newInventory;
        });
        // Save only the changed tile
        try {
            if (!selectedTile?.type) {
                console.error('No tile type selected');
                toast({ title: 'Error', description: 'No tile type selected', variant: 'destructive' });
                return;
            }
            
            const tileTypeNum = tileTypeToNumeric[selectedTile.type];
            if (typeof tileTypeNum === 'undefined') {
                console.error('Invalid tile type:', selectedTile.type);
                toast({ title: 'Error', description: `Invalid tile type: ${selectedTile.type}`, variant: 'destructive' });
                return;
            }
            
            console.log('[Realm] Saving tile:', { x, y, tile_type: tileTypeNum, tile_type_name: selectedTile.type });
            const res = await fetch('/api/realm-tiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y, tile_type: tileTypeNum })
            });
            if (!res.ok) {
                const err = await res.json();
                toast({ title: 'Error', description: `Failed to save tile: ${err.error}`, variant: 'destructive' });
                console.error('Tile save error:', err);
            } else {
                console.log('[Realm] Tile saved successfully');
                // Check for monster spawns after successful tile placement
                console.log('[Realm] Checking monster spawn for tile type:', selectedTile.type);
                // Create updated grid with the new tile for spawn check
                const updatedGrid = grid.map(row => row.slice());
                if (updatedGrid[y] && updatedGrid[y][x]) {
                    updatedGrid[y][x] = { ...tileToPlace, x, y, owned: 1 };
                }
                const spawnResult = checkMonsterSpawn(updatedGrid, selectedTile.type);
                console.log('[Realm] Monster spawn result:', spawnResult);
                
                if (spawnResult.shouldSpawn && spawnResult.position && spawnResult.monsterType) {
                    console.log('[Realm] Spawning monster:', spawnResult.monsterType, 'at position:', spawnResult.position);
                    // Spawn the monster
                    const success = spawnMonsterOnTile(grid, spawnResult.position.x, spawnResult.position.y, spawnResult.monsterType as any);
                    if (success) {
                        // Update grid to show monster
                        setGrid(prevGrid => {
                            const newGrid = prevGrid.map(row => row.slice());
                            const pos = spawnResult.position!;
                            const monsterType = spawnResult.monsterType;
                            const row = newGrid[pos.y];
                            const tile = row?.[pos.x];
                            if (row && tile && monsterType) {
                                tile.hasMonster = monsterType as MonsterType;
                                tile.monsterAchievementId = getMonsterAchievementId(monsterType as MonsterType);
                                console.log('[Realm] Monster added to grid:', monsterType, 'at', pos);
                            }
                            return newGrid;
                        });
                        
                        // Show notification
                        toast({
                            title: "Monster Appeared!",
                            description: `A ${spawnResult.monsterType} has appeared on the map!`,
                        });
                    }
                }
                
                // Check for creature discoveries
                const iceCount = countTiles(grid, 'ice');
                console.log('[Realm] Ice tiles count:', iceCount);
                
                if (iceCount >= 5 && !useCreatureStore.getState().isCreatureDiscovered('014')) {
                    // Discover Blizzey when 5 ice tiles are placed
                    useCreatureStore.getState().discoverCreature('014');
                    toast({
                        title: "Creature Discovered!",
                        description: "You discovered Blizzey, the powerful ice spirit!",
                    });
                }
                
                // Unlock achievement for special tiles
                const tileTypeToAchievement: Record<string, string> = {
                    'ice': '013', // Example: 013 = first ice tile placed
                    'snow': '016', // Example: 016 = first snow tile placed
                    'cave': '011', // Example: 011 = first cave tile placed
                    // Add more mappings as needed
                };
                const achievementId = tileTypeToAchievement[selectedTile.type];
                if (achievementId && userId) {
                    try {
                        const token = await getToken({ template: 'supabase' });
                        const unlockRes = await fetch('/api/achievements/unlock', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ achievementId })
                        });
                        if (!unlockRes.ok) {
                            const unlockErr = await unlockRes.json();
                            toast({ title: 'Achievement Error', description: `Failed to unlock achievement: ${unlockErr.error}`, variant: 'destructive' });
                            console.error('Achievement unlock error:', unlockErr);
                        }
                    } catch (err) {
                        toast({ title: 'Achievement Error', description: 'Failed to unlock achievement', variant: 'destructive' });
                        console.error('Achievement unlock error:', err);
                    }
                }
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to save tile', variant: 'destructive' });
            console.error('Tile save error:', err);
        }
    };

    const handleTileSelection = (tile: TileInventoryItem | null) => {
        if (tile?.type && inventory[tile.type] && (inventory[tile.type].owned ?? 0) > 0) {
            setSelectedTile(tile);
            setShowInventory(false);
        } else {
            setSelectedTile(null);
        }
    };

    const handleCharacterMove = (x: number, y: number) => {
        if (gameMode === 'move') {
            // Check if the target tile is walkable
            const targetTile = grid[y]?.[x];
            
            // Check for empty tile
            if (!targetTile || targetTile.type === 'empty') {
                toast({
                    title: "Cannot Move",
                    description: "This is undiscovered land, buy a tile to expand the realm",
                    variant: "destructive",
                });
                return;
            }
            
            if (targetTile && ['mountain', 'water', 'lava', 'volcano'].includes(targetTile.type)) {
                toast({
                    title: "Cannot Move",
                    description: `You cannot move to a ${targetTile.type} tile.`,
                    variant: "destructive",
                });
                return;
            }

            // Check for monster battle
            if (targetTile?.hasMonster) {
                setCurrentMonster(targetTile.hasMonster);
                setBattleOpen(true);
                return;
            }

            setCharacterPosition({ x, y });
        }
    };

    // Expand map function
    const expandMap = async () => {
        if (!canExpand) {
            toast({
                title: 'Expansion Locked',
                description: `Reach level ${nextExpansionLevel} to expand your realm map!`,
                variant: 'destructive',
            });
            return;
        }
        const currentRows = grid.length;
        const currentCols = grid[0]?.length || GRID_COLS;
        const newRows = currentRows + 3;
        
        // Create new grid with 3 additional rows
        const newGrid: Tile[][] = [];
        
        // Add existing rows
        for (let y = 0; y < currentRows; y++) {
            const currentRow = grid[y];
            if (currentRow && Array.isArray(currentRow)) {
                newGrid[y] = [...currentRow];
            }
        }
        
        // Add 3 new rows
        for (let y = currentRows; y < newRows; y++) {
            newGrid[y] = new Array(currentCols);
            for (let x = 0; x < currentCols; x++) {
                let tileType: TileType = 'empty';
                
                // First and last columns are mountain tiles
                if (x === 0 || x === currentCols - 1) {
                    tileType = 'mountain';
                } else {
                    // Random mystery tile (1 in 20 chance for each non-mountain tile)
                    if (Math.random() < 0.05) {
                        tileType = 'mystery';
                    }
                }
                
                newGrid[y]![x] = {
                    ...defaultTile(tileType),
                    x,
                    y,
                    id: `${tileType}-${x}-${y}`,
                    image: getTileImage(tileType)
                };
            }
        }
        
        setGrid(newGrid);
        // Persist all new tiles in the new rows to the backend
        try {
            if (!Array.isArray(newGrid)) return;
            for (let y = currentRows; y < newRows; y++) {
                if (!Array.isArray(newGrid[y])) continue;
                for (let x = 0; x < currentCols; x++) {
                    const tile = newGrid[y]?.[x];
                    if (!tile) continue;
                    const tileTypeNum = tileTypeToNumeric[tile.type];
                    if (typeof tileTypeNum === 'undefined') continue;
                    await fetch('/api/realm-tiles', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ x, y, tile_type: tileTypeNum })
                    });
                }
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to save expanded map tiles', variant: 'destructive' });
        }
        setExpansions(prev => {
            const newVal = prev + 1;
            localStorage.setItem('realm-map-expansions', String(newVal));
            return newVal;
        });
        toast({
            title: "Map Expanded",
            description: "Your realm map has been expanded with 3 new rows!",
        });
    };

    // Handler to reset the map to the initial grid
    const handleResetMap = async () => {
        try {
            const res = await fetch('/api/realm-tiles/reset', { method: 'POST' });
            if (res.ok) {
                // Reload the grid after reset
                window.location.reload();
            } else {
                throw new Error('Failed to reset map');
            }
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to reset map', variant: 'destructive' });
        }
    };

    // Keyboard movement handlers
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Open inventory with 'i' key if not in an input/textarea
            if (event.key === 'i' || event.key === 'I') {
                const active = document.activeElement;
                if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) return;
                if (!showInventory) {
                    setShowInventory(true);
                    toast({
                        title: 'Inventory Opened',
                        description: 'Tile inventory opened (press "i" to open)',
                    });
                }
                return;
            }
            if (gameMode !== 'move') return;
            
            const currentPos = characterPosition;
            let newX = currentPos.x;
            let newY = currentPos.y;
            
            switch (event.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    newY = Math.max(0, currentPos.y - 1);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    newY = Math.min(grid.length - 1, currentPos.y + 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    newX = Math.max(0, currentPos.x - 1);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    newX = Math.min((grid[0]?.length ?? 0) - 1, currentPos.x + 1);
                    break;
                default:
                    return;
            }
            
            // Check if the target tile is walkable
            const targetTile = grid[newY]?.[newX];
            
            // Check for empty tile
            if (!targetTile || targetTile.type === 'empty') {
                toast({
                    title: "Cannot Move",
                    description: "This is undiscovered land, buy a tile to expand the realm",
                    variant: "destructive",
                });
                return;
            }
            
            if (targetTile && ['mountain', 'water', 'lava', 'volcano'].includes(targetTile.type)) {
                toast({
                    title: "Cannot Move",
                    description: `You cannot move to a ${targetTile.type} tile.`,
                    variant: "destructive",
                });
                return;
            }
            
            // Check for monster battle
            if (targetTile?.hasMonster) {
                setCurrentMonster(targetTile.hasMonster);
                setBattleOpen(true);
                return;
            }
            
            if (newX !== currentPos.x || newY !== currentPos.y) {
                setCharacterPosition({ x: newX, y: newY });
                // Save character position to Supabase
                if (userId) {
                    saveCharacterPosition(userId, { x: newX, y: newY }).catch(error => {
                        console.error('Failed to save character position:', error);
                    });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameMode, characterPosition, grid, toast, showInventory, setShowInventory]);

    // Effect to handle landing on special tiles
    useEffect(() => {
        if (!grid.length || !grid[characterPosition.y]?.[characterPosition.x]) return;
        const currentTile = grid[characterPosition.y]?.[characterPosition.x];
        if (currentTile) {
            // Check for monster battle first
            if (currentTile.hasMonster) {
                setCurrentMonster(currentTile.hasMonster);
                setBattleOpen(true);
                return;
            }
            
            switch (currentTile.type) {
                case 'castle': {
                    setCastleEvent({ open: true });
                    break;
                }
                case 'dungeon': {
                    // Example trivia questions (replace with real medieval facts)
                    const questions = [
                        { fact: 'How many castles are in England? (1,500)', number: 1500 },
                        { fact: 'How many knights in a typical round table? (12)', number: 12 },
                        { fact: 'How many years did the Hundred Years\' War last? (116)', number: 116 },
                        { fact: 'How many towers in the Tower of London? (21)', number: 21 },
                        { fact: 'How many wives did King Henry VIII have? (6)', number: 6 },
                        { fact: 'How many crusades were there? (9)', number: 9 },
                        { fact: 'How many people could fit in a medieval jousting arena? (5,000)', number: 5000 },
                        { fact: 'How many bouncy castles are there in the world? (10,000)', number: 10000 },
                        { fact: 'How many years did the Black Death last? (7)', number: 7 },
                        { fact: 'How many dragons in St. George\'s legend? (1)', number: 1 },
                        { fact: 'How many pages in the Magna Carta? (4)', number: 4 },
                        { fact: 'How many steps in a castle spiral staircase? (100)', number: 100 },
                        { fact: 'How many shields in a knight\'s armory? (20)', number: 20 },
                        { fact: 'How many candles in a grand medieval feast? (200)', number: 200 },
                        { fact: 'How many bells in Notre Dame? (10)', number: 10 },
                        { fact: 'How many kings in a deck of cards? (4)', number: 4 },
                        { fact: 'How many arrows in a longbowman\'s quiver? (24)', number: 24 },
                        { fact: 'How many castles in Wales? (600)', number: 600 },
                        { fact: 'How many knights in the Order of the Garter? (24)', number: 24 },
                        { fact: 'How many years did the War of the Roses last? (32)', number: 32 },
                    ];
                    const randomIndex = Math.floor(Math.random() * questions.length);
                    const question = questions[randomIndex] || questions[0];
                    if (question) {
                        setDungeonEvent({ open: true, questionIndex: 0, score: 0, prevNumber: question.number, questions: [question] });
                    }
                    break;
                }
                case 'cave': {
                    setCaveEvent({ open: true });
                    break;
                }
                case 'city':
                    setModalState({ isOpen: true, locationType: 'city', locationName: currentTile?.name ?? 'Bravos' });
                    break;
                case 'town':
                    setModalState({ isOpen: true, locationType: 'town', locationName: currentTile?.name ?? 'Riverwood' });
                    break;
                case 'mystery':
                    setLastMysteryTile({ x: characterPosition.x, y: characterPosition.y });
                    // Generate and show mystery event modal
                    const mysteryEvent = generateMysteryEvent();
                    if (mysteryEvent) {
                        setMysteryEvent({ open: true, event: mysteryEvent });
                    }
                    break;
            }
        }
    }, [characterPosition, grid, toast]);

    const handleResetPosition = () => {
        setCharacterPosition(defaultCharacterPosition);
        toast({
            title: "Position Reset",
            description: `Character position reset to (${defaultCharacterPosition.x}, ${defaultCharacterPosition.y})`,
        });
    };

    useEffect(() => {
        if (!isLoading && grid.length && characterPosition && !hasCheckedInitialPosition) {
            setHasCheckedInitialPosition(true);
            const tile = grid[characterPosition.y]?.[characterPosition.x];
            if (!tile || ['mountain', 'water', 'lava', 'volcano'].includes(tile.type)) {
                setCharacterPosition(defaultCharacterPosition);
                // Removed toast message - this is expected behavior, not an error
                console.log(`[Realm] Invalid start position, resetting to (${defaultCharacterPosition.x}, ${defaultCharacterPosition.y})`);
            }
        }
    }, [isLoading, grid, characterPosition, hasCheckedInitialPosition, setCharacterPosition, defaultCharacterPosition]);

    // Focus trap for inventory panel
    useEffect(() => {
        if (showInventory) {
            // Focus the close button when inventory opens
            closeBtnRef.current?.focus();
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    setShowInventory(false);
                }
                // Trap focus inside the panel
                if (e.key === 'Tab' && showInventory) {
                    const panel = document.getElementById('tile-inventory-panel');
                    if (!panel) return;
                    const focusable = panel.querySelectorAll<HTMLElement>(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    const first = focusable[0];
                    const last = focusable[focusable.length - 1];
                    if (!first || !last) return;
                    if (e.shiftKey) {
                        if (document.activeElement === first) {
                            e.preventDefault();
                            last.focus();
                        }
                    } else {
                        if (document.activeElement === last) {
                            e.preventDefault();
                            first.focus();
                        }
                    }
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
        return undefined;
    }, [showInventory]);

    // When leaving build mode or switching to 'buy', clear selectedTile
    useEffect(() => {
        if (gameMode !== 'build' || inventoryTab === 'buy') {
            setSelectedTile(null);
        }
    }, [gameMode, inventoryTab]);

    // 1. When tile inventory is open, always set gameMode to 'build'.
    useEffect(() => {
        if (showInventory) setGameMode('build');
    }, [showInventory]);

    // Ensure animals are placed on valid tiles if not already set
    useEffect(() => {
        // Place horse at start position (10,4) if not set
        if (!horsePos) {
            setHorsePos({ x: 10, y: 4 });
        }
        if (!eaglePos) {
            const nonEmptyTiles: { x: number; y: number }[] = [];
            grid.forEach((row, y) => row.forEach((tile, x) => {
                if (tile.type !== 'empty') nonEmptyTiles.push({ x, y });
            }));
            if (nonEmptyTiles.length > 0) {
                const next = nonEmptyTiles[0];
                if (next) setEaglePos(next);
            }
        }
    }, [grid, horsePos, eaglePos, setHorsePos, setEaglePos]);

    // Animal movement logic (adjacent only)
    useEffect(() => {
        const interval = setInterval(() => {
            if (horsePos) {
                const adj = getAdjacentPositions(horsePos.x, horsePos.y, grid).filter(pos =>
                    !!grid[pos.y]?.[pos.x] &&
                    grid[pos.y]?.[pos.x]?.type === 'grass'
                );
                if (adj.length > 0) {
                    const next = adj[Math.floor(Math.random() * adj.length)];
                    if (next) setHorsePos(next);
                }
            }
        }, 10000); // Reduced from 5000 to 10000ms
        return () => clearInterval(interval);
    }, [grid, horsePos, setHorsePos]);

    // Persist horse position to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined' && horsePos) {
            localStorage.setItem('horsePos', JSON.stringify(horsePos));
        }
    }, [horsePos]);

    // Keyboard shortcut: 'm' for move mode
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'm' || event.key === 'M') {
                setGameMode('move');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);



    // Listen for horse-caught event
    useEffect(() => {
        const handler = (e: any) => {
            if (!horseCaught) {
                setIsHorsePresent(false);
                setHorseCaught(true);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('horseCaught', 'true');
                }
            }
        };
        window.addEventListener('horse-caught', handler);
        return () => window.removeEventListener('horse-caught', handler);
    }, [horseCaught]);

    // Sheep movement logic (adjacent only)
    useEffect(() => {
        const interval = setInterval(() => {
            if (sheepPos) {
                const adj = getAdjacentPositions(sheepPos.x, sheepPos.y, grid).filter(pos =>
                    !!grid[pos.y]?.[pos.x] &&
                    grid[pos.y]?.[pos.x]?.type === 'grass'
                );
                if (adj.length > 0) {
                    const next = adj[Math.floor(Math.random() * adj.length)];
                    if (next) setSheepPos(next);
                }
            }
        }, 15000); // Reduced from 7000 to 15000ms
        return () => clearInterval(interval);
    }, [grid, sheepPos, setSheepPos]);

    // Persist sheep position to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined' && sheepPos) {
            localStorage.setItem('sheepPos', JSON.stringify(sheepPos));
        }
    }, [sheepPos]);

    // Delete tile: set to empty and send to backend
    const handleDeleteTile = (x: number, y: number) => {
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => row.slice());
            if (newGrid[y]?.[x] && newGrid[y][x].type !== 'empty') {
                const deletedTileType = newGrid[y][x].type;
                newGrid[y][x] = { ...defaultTile('empty'), x, y, id: `empty-${x}-${y}` };
                
                // Track tile destruction for achievements
                if (userId && deletedTileType) {
                    const achievementKey = `destroyed_${deletedTileType}_tiles`;
                    const currentCount = parseInt(localStorage.getItem(achievementKey) || '0');
                    const newCount = currentCount + 1;
                    localStorage.setItem(achievementKey, newCount.toString());
                    
                    // Check for destruction achievements
                    const destructionAchievements = [
                        { type: 'forest', threshold: 3, achievementId: '201' },
                        { type: 'mountain', threshold: 2, achievementId: '202' },
                        { type: 'water', threshold: 1, achievementId: '203' },
                        { type: 'desert', threshold: 2, achievementId: '204' },
                        { type: 'ice', threshold: 1, achievementId: '205' }
                    ];
                    
                    const achievement = destructionAchievements.find(a => a.type === deletedTileType);
                    if (achievement && newCount >= achievement.threshold) {
                        // Unlock achievement
                        (async () => {
                            const token = await getToken({ template: 'supabase' });
                            fetch('/api/achievements/unlock', {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ achievementId: achievement.achievementId })
                            }).then(() => {
                                toast({
                                    title: "Achievement Unlocked!",
                                    description: `Destroyed ${achievement.threshold} ${deletedTileType} tiles!`,
                                });
                            }).catch(console.error);
                        })();
                    }
                }
            }
            // Save only the changed tile
            fetch('/api/realm-tiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y, tile_type: tileTypeToNumeric['empty'] })
            }).catch(() => {
                toast({ title: 'Error', description: 'Failed to delete tile', variant: 'destructive' });
            });
            return newGrid;
        });
    };

    // Handle monster battle completion
    const handleBattleComplete = (won: boolean, goldEarned: number, xpEarned: number) => {
        if (won) {
            // Remove monster from the current tile
            setGrid(prevGrid => {
                const newGrid = prevGrid.map(row => row.slice());
                const currentTile = newGrid[characterPosition.y]?.[characterPosition.x];
                if (currentTile) {
                    currentTile.hasMonster = undefined;
                    currentTile.monsterAchievementId = undefined;
                }
                return newGrid;
            });
            
            // Save the updated tile to backend
            fetch('/api/realm-tiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    x: characterPosition.x, 
                    y: characterPosition.y, 
                    tile_type: tileTypeToNumeric[grid[characterPosition.y]?.[characterPosition.x]?.type || 'empty'],
                    has_monster: null,
                    monster_achievement_id: null
                })
            }).catch(() => {
                toast({ title: 'Error', description: 'Failed to save monster defeat', variant: 'destructive' });
            });
            
            // Show victory message
            toast({
                title: "Victory!",
                description: `You defeated the monster! Earned ${goldEarned} gold and ${xpEarned} XP!`,
            });
        } else {
            // Show defeat message - monster stays on the map for retry
            toast({
                title: "Defeat!",
                description: `The monster was too strong! You lost ${Math.abs(goldEarned)} gold. Try again when you're ready!`,
                variant: "destructive",
            });
        }
    };

    // Add penguin state at the top of RealmPage
    // Only declare penguinPos and isPenguinPresent once at the top of RealmPage
    // After grid is loaded or updated, place penguin on first visible ice tile if not already present
    useEffect(() => {
      if (!isPenguinPresent && grid.length) {
        for (let y = 0; y < grid.length; y++) {
          const row = grid[y];
          if (!row) continue;
          for (let x = 0; x < row.length; x++) {
            if (row[x]?.type === 'ice') {
              setPenguinPos({ x, y });
              setIsPenguinPresent(true);
              return;
            }
          }
        }
      }
    }, [grid, isPenguinPresent]);
    // Penguin movement logic: move every 5 seconds to adjacent ice tile
    useEffect(() => {
      if (!isPenguinPresent || !penguinPos) return;
      const interval = setInterval(() => {
        const adj = getAdjacentPositions(penguinPos.x, penguinPos.y, grid).filter(pos => {
          const row = grid[pos.y];
          return !!row && row[pos.x]?.type === 'ice';
        });
        if (adj.length > 0) {
          const next = adj[Math.floor(Math.random() * adj.length)];
          if (next) setPenguinPos(next);
        }
      }, 5000);
      return () => clearInterval(interval);
    }, [grid, penguinPos, isPenguinPresent]);

    // Expansion gating logic
    const [expansions, setExpansions] = useState<number>(() => {
      if (typeof window !== 'undefined') {
        return parseInt(localStorage.getItem('realm-map-expansions') || '0', 10);
      }
      return 0;
    });
    const [playerLevel, setPlayerLevel] = useState<number>(1);
    useEffect(() => {
      // Get player level from character stats
      const stats = getCharacterStats();
      setPlayerLevel(stats.level || 1);
    }, []);
    
    // Fix expansion count if user is level 5 but expansion count is wrong
    useEffect(() => {
      if (playerLevel >= 5 && expansions > 0) {
        // If user is level 5+ but has expansions recorded, reset to 0
        setExpansions(0);
        localStorage.setItem('realm-map-expansions', '0');
      }
    }, [playerLevel, expansions]);
    
    const nextExpansionLevel = 5 + expansions * 5;
    const canExpand = playerLevel >= nextExpansionLevel;

    // Validate animal positions when grid changes
    useEffect(() => {
      if (!Array.isArray(grid) || grid.length === 0) return;
      
      // Validate horse position
      if (isHorsePresent && horsePos) {
        const tile = grid[horsePos.y]?.[horsePos.x];
        if (!tile || tile.type !== 'grass') {
          console.log('[Realm] Horse on invalid tile, finding new grass position');
          // Find a valid grass tile
          for (let y = 0; y < grid.length; y++) {
            const row = grid[y];
            if (!row) continue;
            for (let x = 0; x < row.length; x++) {
              const checkTile = row[x];
              if (checkTile && checkTile.type === 'grass' && !checkTile.hasMonster) {
                setHorsePos({ x, y });
                localStorage.setItem('horsePos', JSON.stringify({ x, y }));
                console.log('[Realm] Horse moved to valid position:', { x, y });
                break;
              }
            }
          }
        }
      }
      
      // Validate sheep position
      if (isSheepPresent && sheepPos) {
        const tile = grid[sheepPos.y]?.[sheepPos.x];
        if (!tile || tile.type !== 'grass') {
          console.log('[Realm] Sheep on invalid tile, finding new grass position');
          // Find a valid grass tile
          for (let y = 0; y < grid.length; y++) {
            const row = grid[y];
            if (!row) continue;
            for (let x = 0; x < row.length; x++) {
              const checkTile = row[x];
              if (checkTile && checkTile.type === 'grass' && !checkTile.hasMonster) {
                setSheepPos({ x, y });
                localStorage.setItem('sheepPos', JSON.stringify({ x, y }));
                console.log('[Realm] Sheep moved to valid position:', { x, y });
                break;
              }
            }
          }
        }
      }
    }, [grid, isHorsePresent, horsePos, isSheepPresent, sheepPos]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8">
                <h2 className="text-2xl font-bold text-white mb-4">Exploring the lands of Valoreth</h2>
                <div className="bg-black/70 border border-amber-800 rounded-lg p-6 max-w-lg text-center text-amber-100 text-lg shadow-lg">
                    <p>
                        In the mystical realm of Valoreth, King Aldric sought treasures of growth.<br/>
                        Through ancient forests and crystal caves he wandered,<br/>
                        Each terrain revealing new mysteries and hidden wisdom.<br/>
                        Will you follow his path and claim your destiny?<br/>
                        The realm awaits those brave enough to grow stronger.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <RevealOverlay />
            <HeaderSection
                title="Realm"
                subtitle="Explore and build your mystical realm"
                imageSrc="/images/realm-header.jpg"
                defaultBgColor="bg-blue-900"
                onAnimationStart={() => setIsAnimating(true)}
                onAnimationEnd={() => setIsAnimating(false)}
                shouldRevealImage={true}
            />
            <RealmAnimationWrapper 
                isAnimating={isAnimating}
                onImageReveal={setShouldRevealImage}
            >
                {/* Top Toolbar */}
                <div className="flex items-center justify-between bg-gray-800 z-30 overflow-visible">
                  {/* On mobile, make action rows horizontally scrollable and touch-friendly */}
                  <div className="flex flex-1 flex-col gap-2 overflow-visible">
                    <div className="flex items-center gap-2 overflow-x-auto flex-nowrap md:gap-4 md:overflow-visible md:flex-wrap overflow-visible p-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                      <Button
                        variant={gameMode === 'move' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setGameMode('move')}
                        className="flex items-center gap-2 min-w-[44px] min-h-[44px]"
                        aria-label="movement-mode-button"
                      >
                        <Move className="w-4 h-4" />
                        <span className="hidden md:inline text-blue-500">Move</span>
                      </Button>
                      <Button
                        variant={gameMode === 'build' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setGameMode('build')}
                        className={cn(
                          "flex items-center gap-2 min-w-[44px] min-h-[44px]",
                          gameMode === 'build' 
                            ? "bg-amber-500 text-black hover:bg-amber-600" 
                            : "bg-gray-800 text-white hover:bg-gray-700 border-gray-600"
                        )}
                        aria-label="build-mode-button"
                      >
                        <Hammer className="w-4 h-4" />
                        <span className="hidden md:inline">Build</span>
                      </Button>
                      <div className="hidden md:flex items-center space-x-2 min-w-[100px]" aria-label="auto-save-controls">
                        <Switch id="auto-save-switch" checked={autoSave} onCheckedChange={setAutoSave} />
                        <label htmlFor="auto-save-switch" className="text-sm">Auto Save</label>
                      </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={expandMap}
                              disabled={!canExpand}
                              aria-label="Expand Map"
                              className="flex items-center gap-2 min-w-[44px] min-h-[44px] disabled:pointer-events-auto"
                            >
                              <PlusCircle className="w-4 h-4" />
                              <span className="hidden sm:inline">Expand Map</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="top" 
                            className="bg-gray-900 text-white border-amber-800/30"
                          >
                            {canExpand 
                              ? 'Expand your realm map to unlock 3 more rows' 
                              : `Become level ${nextExpansionLevel} to unlock 3 more rows`
                            }
                          </TooltipContent>
                        </Tooltip>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetMap}
                        className="flex items-center gap-2 min-w-[44px] min-h-[44px]"
                        aria-label="reset-map-button"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Reset Map</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInventory(!showInventory)}
                        className="flex items-center gap-2 min-w-[44px] min-h-[44px]"
                        aria-label="toggle-inventory-button"
                      >
                        <Package className="w-4 h-4" />
                        <span className="hidden sm:inline">Inventory</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetPosition}
                        className="flex items-center gap-2 min-w-[44px] min-h-[44px]"
                        aria-label="reset-position-button"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="hidden sm:inline">Reset Position</span>
                      </Button>
                    </div>
                  </div>
                </div>
                {modalState && (
                    <EnterLocationModal
                        isOpen={modalState.isOpen}
                        onClose={() => setModalState(null)}
                        locationType={modalState.locationType}
                        locationName={modalState.locationName}
                    />
                )}
                {animalInteractionModal && (
                    <AnimalInteractionModal
                        isOpen={animalInteractionModal.isOpen}
                        onClose={() => setAnimalInteractionModal(null)}
                        animalType={animalInteractionModal.animalType}
                        animalName={animalInteractionModal.animalName}
                        onInteract={() => handleAnimalInteraction(animalInteractionModal.animalType)}
                    />
                )}
                {/* Full Width Map Area - Break out of all containers */}
                <div className="fixed inset-0 top-[60px] left-0 right-0 bottom-8 md:bottom-12 z-10">
                    <MapGrid
                        grid={grid}
                        playerPosition={characterPosition}
                        onTileClick={handlePlaceTile}
                        playerLevel={characterStats.level}
                        onTileSizeChange={handleTileSizeChange}
                        penguinPos={penguinPos}
                        horsePos={horsePos}
                        sheepPos={sheepPos}
                        eaglePos={eaglePos}
                        isPenguinPresent={isPenguinPresent}
                        isHorsePresent={isHorsePresent}
                        isSheepPresent={isSheepPresent}
                        horseCaught={horseCaught}
                    />
                </div>
                {/* Overlay Inventory Panel */}
                {showInventory && (
                    <div id="tile-inventory-panel" role="dialog" aria-modal="true" aria-label="Tile Inventory Panel" className="absolute top-[60px] right-0 h-[calc(100%-60px-2rem)] md:h-[calc(100%-60px-3rem)] w-96 max-w-[90vw] bg-gray-800/95 backdrop-blur-md border-l border-gray-700 flex flex-col z-30 p-2 shadow-2xl">
                        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Tile Inventory</h2>
                            <Button
                                ref={closeBtnRef}
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowInventory(false)}
                                aria-label="close-inventory-button"
                                className="min-w-[44px] min-h-[44px]"
                            >
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            <TileInventory
                                tiles={inventoryAsItems}
                                selectedTile={selectedTile}
                                onSelectTile={setSelectedTile}
                                onUpdateTiles={(newTiles: typeof inventoryAsItems) => {
                                    setInventory(prev => {
                                        const updated = { ...prev };
                                        newTiles.forEach((tile: typeof inventoryAsItems[number]) => {
                                            updated[tile.type] = { ...updated[tile.type], ...tile };
                                        });
                                        
                                        // Save to Supabase with localStorage fallback
                                        if (userId) {
                                            saveTileInventory(userId, updated).catch(error => {
                                                console.error('Failed to save inventory:', error);
                                            });
                                        }
                                        
                                        return updated;
                                    });
                                }}
                                activeTab={inventoryTab}
                                setActiveTab={setInventoryTab}
                                onOutOfTiles={(tile) => toast({ title: 'No more tiles of this type', description: 'Buy more!' })}
                            />
                        </ScrollArea>
                    </div>
                )}
                
                {/* Event Modals */}
                {castleEvent?.open && (
                    <Dialog open={castleEvent.open} onOpenChange={() => setCastleEvent(null)}>
                        <DialogContent aria-label="Castle Event Royal Audience" role="dialog" aria-modal="true">
                            <DialogHeader>
                                <DialogTitle>Royal Audience with the King</DialogTitle>
                                <DialogDescription>You enter the grand hall of the castle and are summoned before the King. He sits on a golden throne, surrounded by advisors and guards. He peers down at you with curiosity.</DialogDescription>
                            </DialogHeader>
                            {!castleEvent.result ? (
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="h-16 flex items-center justify-center">
                                        <div className="w-16 h-16 flex items-center justify-center rounded-lg border-4 border-amber-700 bg-gray-900 text-4xl font-bold text-amber-400 select-none" style={{ transition: 'background 0.2s' }}>
                                            {castleDiceRolling
                                                ? Math.ceil(Math.random() * 6)
                                                : castleDiceValue || 1}
                                        </div>
                                    </div>
                                    <Button aria-label="Roll Dice" onClick={async () => {
                                        setCastleDiceRolling(true);
                                        setCastleDiceValue(null);
                                        let roll = 1;
                                        const interval = setInterval(() => {
                                            roll = Math.ceil(Math.random() * 6);
                                            setCastleDiceValue(roll);
                                        }, 100);
                                        await new Promise(res => setTimeout(res, 1000));
                                        clearInterval(interval);
                                        setCastleDiceRolling(false);
                                        setCastleDiceValue(roll);
                                        let result = '';
                                        let reward = '';
                                        if (roll <= 2) {
                                            result = `The King rewards your humble service with 20 gold for your travels. (Rolled ${roll})`;
                                            reward = '+20 gold';
                                            gainGold(20, 'castle-event');
                                        } else if (roll <= 4) {
                                            result = `The King is impressed by your tales and grants you 40 EXP to continue your noble path. (Rolled ${roll})`;
                                            reward = '+40 XP';
                                            gainExperience(40, 'castle-event');
                                        } else {
                                            const attributes = ['Loyalty', 'Defense', 'Wisdom', 'Courage', 'Honor'];
                                            const attr = attributes[Math.floor(Math.random() * attributes.length)];
                                            result = `The King knights you an Honorary Guardian and gifts +1 ${attr} to your Kingdom Inventory. (Rolled ${roll})`;
                                            reward = `+1 ${attr}`;
                                            // Add attribute to inventory or show toast (implement as needed)
                                        }
                                        setTimeout(() => setCastleEvent({ open: true, result, reward }), 500);
                                    }}>Roll Dice</Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-lg font-semibold text-center">{castleEvent.result}</div>
                                    <Button aria-label="Close" onClick={() => setCastleEvent(null)}>Close</Button>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                )}
                {dungeonEvent?.open && dungeonEvent?.questions && (
                    <Dialog open={dungeonEvent.open} onOpenChange={() => setDungeonEvent(null)}>
                        <DialogContent aria-label="Dungeon Event Higher or Lower" role="dialog" aria-modal="true">
                            <DialogHeader>
                                <DialogTitle>Medieval Dungeon: Higher or Lower?</DialogTitle>
                                <DialogDescription>You descend into a damp, torch-lit dungeon. Echoes bounce from the walls. A voice from the shadows challenges you to a battle of wit and lore.<br/>&quot;Is the next number higher or lower?&quot;</DialogDescription>
                            </DialogHeader>
                            {dungeonEvent.questionIndex < dungeonEvent.questions.length ? (
                                <div className="space-y-4">
                                    <div className="text-lg font-semibold text-center">{dungeonEvent.questions[dungeonEvent.questionIndex]?.fact}</div>
                                    <div className="flex gap-4 justify-center">
                                        <Button aria-label="Higher" onClick={() => {
                                            const nextQuestionIndex = dungeonEvent.questionIndex + 1;
                                            if (nextQuestionIndex >= dungeonEvent.questions.length) {
                                                setDungeonEvent({ ...dungeonEvent, questionIndex: nextQuestionIndex, result: `You scored ${dungeonEvent.score} out of 20! (+${dungeonEvent.score * 5} XP)` });
                                                gainExperience(dungeonEvent.score * 5, 'dungeon-event');
                                                return;
                                            }
                                            const nextQuestion = dungeonEvent?.questions?.[nextQuestionIndex];
                                            if (nextQuestion && dungeonEvent.questions && typeof dungeonEvent.questionIndex === 'number' && dungeonEvent.questions[dungeonEvent.questionIndex]) {
                                                const correct = nextQuestion.number > dungeonEvent.questions[dungeonEvent.questionIndex]!.number;
                                                setDungeonEvent({
                                                    ...dungeonEvent,
                                                    questionIndex: nextQuestionIndex,
                                                    score: dungeonEvent.score + (correct ? 1 : 0),
                                                    prevNumber: nextQuestion.number,
                                                });
                                            }
                                        }}>Higher</Button>
                                        <Button aria-label="Lower" onClick={() => {
                                            const nextQuestionIndex = dungeonEvent.questionIndex + 1;
                                            if (nextQuestionIndex >= dungeonEvent.questions.length) {
                                                setDungeonEvent({ ...dungeonEvent, questionIndex: nextQuestionIndex, result: `You scored ${dungeonEvent.score} out of 20! (+${dungeonEvent.score * 5} XP)` });
                                                return;
                                            }
                                            const nextQuestion = dungeonEvent?.questions?.[nextQuestionIndex];
                                            if (nextQuestion && dungeonEvent.questions && typeof dungeonEvent.questionIndex === 'number' && dungeonEvent.questions[dungeonEvent.questionIndex]) {
                                                const correct = nextQuestion.number < dungeonEvent.questions[dungeonEvent.questionIndex]!.number;
                                                setDungeonEvent({
                                                    ...dungeonEvent,
                                                    questionIndex: nextQuestionIndex,
                                                    score: dungeonEvent.score + (correct ? 1 : 0),
                                                    prevNumber: nextQuestion.number,
                                                });
                                            }
                                        }}>Lower</Button>
                                    </div>
                                    <div className="text-sm text-center text-gray-400">Current Score: {dungeonEvent.score} / 20</div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-lg font-semibold text-center">{dungeonEvent.result}</div>
                                    <Button aria-label="Close" onClick={() => setDungeonEvent(null)}>Close</Button>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                )}
                {caveEvent?.open && (
                    <Dialog open={caveEvent.open} onOpenChange={() => setCaveEvent(null)}>
                        <DialogContent aria-label="Cave Event Three Paths" role="dialog" aria-modal="true">
                            <DialogHeader>
                                <DialogTitle>Cave: Choose a Path</DialogTitle>
                                <DialogDescription>You find yourself at a fork deep in the heart of a shadowy cave. Three paths lie before you, each whispering fate in a different tone.<br/>&quot;Which path do you choose, brave adventurer?&quot;</DialogDescription>
                            </DialogHeader>
                            {!caveEvent.result ? (
                                <div className="space-y-4 flex flex-col">
                                    <Button className="w-full" aria-label="Gem Path" onClick={() => {
                                        const roll = Math.random();
                                        if (roll < 0.2) {
                                            setCaveEvent({ open: true, result: 'You find a radiant Gem worth 80 gold!' });
                                            gainGold(80, 'cave-event');
                                        } else {
                                            setCaveEvent({ open: true, result: "It's just dust and shadows… you find nothing." });
                                        }
                                    }}>Path 1: Gem Path</Button>
                                    <Button className="w-full" aria-label="Dark Path" onClick={() => {
                                        const roll = Math.random();
                                        if (roll < 0.1) {
                                            setCaveEvent({ open: true, result: 'A friendly Wizard appears and grants you 120 EXP!' });
                                            gainExperience(120, 'cave-event');
                                        } else {
                                            setCaveEvent({ open: true, result: 'You stumble through the dark with no gain.' });
                                        }
                                    }}>Path 2: Dark Path</Button>
                                    <Button className="w-full" aria-label="Light at the End" onClick={() => {
                                        const roll = Math.random();
                                        if (roll < 0.9) {
                                            setCaveEvent({ open: true, result: 'You emerge safely and gain 10 gold.' });
                                            gainGold(10, 'cave-event');
                                        } else {
                                            setCaveEvent({ open: true, result: 'It leads to a working volcano—you lose 10 gold in the chaos.' });
                                            gainGold(-10, 'cave-event');
                                        }
                                    }}>Path 3: Light at the End</Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-lg font-semibold text-center">{caveEvent.result}</div>
                                    <Button aria-label="Close" onClick={() => setCaveEvent(null)}>Close</Button>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                )}
                
                {/* Mystery Event Modal */}
                {mysteryEvent?.open && (
                    <Dialog open={mysteryEvent.open} onOpenChange={() => setMysteryEvent(null)}>
                        <DialogContent aria-label="Mystery Event" role="dialog" aria-modal="true">
                            <DialogHeader>
                                <DialogTitle>{mysteryEvent.event.title}</DialogTitle>
                                <DialogDescription>{mysteryEvent.event.description}</DialogDescription>
                            </DialogHeader>
                            {!mysteryEvent.choice ? (
                                <div className="space-y-4 flex flex-col">
                                    {mysteryEvent.event.choices.map((choice: string, index: number) => (
                                        <Button 
                                            key={index}
                                            className="w-full" 
                                            aria-label={`Choice ${index + 1}: ${choice}`}
                                            onClick={() => {
                                                setMysteryEvent({ ...mysteryEvent, choice });
                                                handleEventOutcome(mysteryEvent.event, choice, user?.id);
                                                setTimeout(() => setMysteryEvent(null), 2000);
                                            }}
                                        >
                                            {choice}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-lg font-semibold text-center">
                                        Processing your choice...
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                )}
                
                {/* Monster Battle Component */}
                <MonsterBattle
                    isOpen={battleOpen}
                    onClose={() => setBattleOpen(false)}
                    monsterType={currentMonster}
                    onBattleComplete={handleBattleComplete}
                />
            </RealmAnimationWrapper>
        </>
    );
}
