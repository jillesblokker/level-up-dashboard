"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Tile, TileType, InventoryItem as TileInventoryItem } from '@/types/tiles'
import { MapGrid } from '../../components/map-grid'
import { TileInventory } from '@/components/tile-inventory'
import { Switch } from "@/components/ui/switch"
import { useUser } from '@clerk/nextjs'
import React from "react"
import { createTileFromNumeric, numericToTileType, tileTypeToNumeric } from "@/lib/grid-loader"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, Hammer, Move, Package, Settings, Save, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EnterLocationModal } from '@/components/enter-location-modal'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { gainGold } from '@/lib/gold-manager'
import { gainExperience } from '@/lib/experience-manager'
import { useCreatureStore } from '@/stores/creatureStore'
import { useSupabaseRealtimeSync } from '@/hooks/useSupabaseRealtimeSync'

// Constants
const GRID_COLS = 12;
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
    grass: { ...defaultTile('grass'), cost: 25, quantity: 10 },
    water: { ...defaultTile('water'), cost: 50, quantity: 10 },
    forest: { ...defaultTile('forest'), cost: 75, quantity: 10 },
    mountain: { ...defaultTile('mountain'), cost: 20, quantity: 10 },
    desert: { ...defaultTile('desert'), cost: 100, quantity: 10 },
    ice: { ...defaultTile('ice'), cost: 120, quantity: 10 },
    snow: { ...defaultTile('snow'), cost: 125, quantity: 10 },
    cave: { ...defaultTile('cave'), cost: 200, quantity: 5 },
    town: { ...defaultTile('town'), cost: 250, quantity: 1 },
    city: { ...defaultTile('city'), cost: 300, quantity: 1 },
    castle: { ...defaultTile('castle'), cost: 500, quantity: 1 },
    dungeon: { ...defaultTile('dungeon'), cost: 400, quantity: 2 },
    volcano: { ...defaultTile('volcano'), cost: 500, quantity: 1 },
    lava: { ...defaultTile('lava'), cost: 200, quantity: 5 },
    'portal-entrance': { ...defaultTile('portal-entrance'), cost: 250, quantity: 1 },
    'portal-exit': { ...defaultTile('portal-exit'), cost: 250, quantity: 1 },
    mystery: { ...defaultTile('mystery'), cost: 300, quantity: 1 },
    empty: { ...defaultTile('empty'), cost: 0, quantity: 0 },
    sheep: { ...defaultTile('sheep'), cost: 0, quantity: 0 },
    horse: { ...defaultTile('horse'), cost: 0, quantity: 0 },
    special: { ...defaultTile('special'), cost: 0, quantity: 0 },
    swamp: { ...defaultTile('swamp'), cost: 0, quantity: 0 },
    treasure: { ...defaultTile('treasure'), cost: 0, quantity: 0 },
    monster: { ...defaultTile('monster'), cost: 0, quantity: 0 },
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
    const userId = user?.id;
    const isGuest = !user;
    const router = useRouter();
    const { discoverCreature } = useCreatureStore();

    const [grid, setGrid] = useState<Tile[][]>(createBaseGrid());
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [characterPosition, setCharacterPosition] = useLocalStorage('characterPosition', { x: 2, y: 0 });
    const [inventory, setInventory] = useLocalStorage<Record<TileType, Tile>>('tileInventory', initialInventory);
    const [showInventory, setShowInventory] = useState(false);
    const [selectedTile, setSelectedTile] = useState<TileInventoryItem | null>(null);
    const [autoSave, setAutoSave] = useState(true);
    const [gameMode, setGameMode] = useState<'build' | 'move'>('move');
    const [hasVisitedRealm, setHasVisitedRealm] = useLocalStorage('hasVisitedRealm', false);
    const [modalState, setModalState] = useState<{ isOpen: boolean; locationType: 'city' | 'town'; locationName: string } | null>(null);
    const defaultCharacterPosition = { x: 2, y: 0 };
    const [hasCheckedInitialPosition, setHasCheckedInitialPosition] = useState(false);
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
    const [castleDiceRolling, setCastleDiceRolling] = useState(false);
    const [castleDiceValue, setCastleDiceValue] = useState<number | null>(null);
    const [lastMysteryTile, setLastMysteryTile] = useState<{ x: number; y: number } | null>(null);
    const [mysteryEventCompleted, setMysteryEventCompleted] = useState(false);
    const [penguinPos] = useState<{ x: number; y: number } | null>(null);
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

    // Achievement unlock effect
    useEffect(() => {
        if (!hasVisitedRealm && isAuthLoaded) {
            setHasVisitedRealm(true);
            // Unlock the Necrion achievement (000)
            if (userId) {
                fetch('/api/achievements/unlock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
            }
            // Also unlock Necrion in the local creature store
            discoverCreature('000');
            toast({
                title: "Achievement Unlocked!",
                description: "Necrion - You've discovered the realm map!",
            });
        }
    }, [hasVisitedRealm, isAuthLoaded, userId, setHasVisitedRealm, toast, discoverCreature]);

    // Load grid from /api/realm-tiles on mount
    useEffect(() => {
        const fetchTiles = async () => {
            if (!isAuthLoaded || isGuest) return;
            setIsLoading(true);
            try {
                const res = await fetch('/api/realm-tiles');
                const data = await res.json();
                if (res.ok && data.tiles) {
                    // Reconstruct grid from tiles
                    const gridArr: Tile[][] = Array.from({ length: INITIAL_ROWS }, (_, y) =>
                        Array.from({ length: GRID_COLS }, (_, x) => defaultTile('empty'))
                    );
                    data.tiles.forEach((row: any) => {
                        if (!row) return;
                        if (!gridArr[row.y] || !Array.isArray(gridArr[row.y])) return;
                        for (let x = 0; x < GRID_COLS; x++) {
                            const typeNum = row[`tile_${x}_type`];
                            const tileType = typeof typeNum === 'number' ? numericToTileType[typeNum] || 'empty' : 'empty';
                            if (typeof gridArr[row.y][x] === 'undefined') continue;
                            gridArr[row.y][x] = {
                                ...defaultTile(tileType),
                                x,
                                y: row.y,
                                id: `${tileType}-${x}-${row.y}`,
                                // Optionally add event, updated_at, etc.
                            };
                        }
                    });
                    setGrid(gridArr);
                } else {
                    setGrid(createBaseGrid());
                }
            } catch (err) {
                toast({ title: 'Error', description: 'Failed to load realm tiles', variant: 'destructive' });
                setGrid(createBaseGrid());
            }
            setIsLoading(false);
        };
        fetchTiles();
    }, [isAuthLoaded, isGuest]);

    // --- Supabase real-time sync for realm_grids ---
    useSupabaseRealtimeSync({
        table: 'realm_grids',
        userId,
        onChange: () => {
            if (isAuthLoaded && !isGuest && userId) {
                // Re-fetch the grid from the API
                fetch('/api/realm').then(async (response) => {
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.grid && typeof data.grid === 'string') setGrid(JSON.parse(data.grid));
                    }
                });
            }
        }
    });

    useEffect(() => {
        if (autoSave && saveStatus !== 'saving') {
            const timer = setTimeout(() => saveGrid(grid), AUTOSAVE_INTERVAL);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [grid, saveGrid, saveStatus, autoSave]);

    // Place tile: update grid and send only the changed tile to backend
    const handlePlaceTile = async (x: number, y: number) => {
        if (gameMode !== 'build' || !selectedTile) return;
        const tileToPlace = inventory[selectedTile.type];
        if (!tileToPlace || (tileToPlace.quantity ?? 0) <= 0) return;
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => row.slice());
            if (newGrid[y]?.[x]) {
                newGrid[y][x] = { ...tileToPlace, x, y, quantity: 1 };
            }
            return newGrid;
        });
        setInventory(prev => {
            const newInventory = { ...prev };
            const invTile = newInventory[selectedTile.type];
            if (invTile) {
                invTile.quantity = (invTile.quantity ?? 0) - 1;
            }
            return newInventory;
        });
        // Save only the changed tile
        try {
            await fetch('/api/realm-tiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y, tile_type: tileTypeToNumeric[selectedTile.type] })
            });
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to save tile', variant: 'destructive' });
        }
    };

    const handleTileSelection = (tile: TileInventoryItem | null) => {
        if (tile?.type && inventory[tile.type] && (inventory[tile.type].quantity ?? 0) > 0) {
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
            if (targetTile && ['mountain', 'water', 'lava', 'volcano'].includes(targetTile.type)) {
                toast({
                    title: "Cannot Move",
                    description: `You cannot move to a ${targetTile.type} tile.`,
                    variant: "destructive",
                });
                return;
            }
            setCharacterPosition({ x, y });
        }
    };

    // Expand map function
    const expandMap = () => {
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
        toast({
            title: "Map Expanded",
            description: "Your realm map has been expanded with 3 new rows!",
        });
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
            if (targetTile && ['mountain', 'water', 'lava', 'volcano'].includes(targetTile.type)) {
                toast({
                    title: "Cannot Move",
                    description: `You cannot move to a ${targetTile.type} tile.`,
                    variant: "destructive",
                });
                return;
            }
            
            if (newX !== currentPos.x || newY !== currentPos.y) {
                setCharacterPosition({ x: newX, y: newY });
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
                    toast({
                        title: 'A Mystery!',
                        description: 'You stumble upon a hidden treasure chest. You find 50 gold!',
                    });
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
                toast({
                    title: "Invalid Start Position",
                    description: `Resetting character to (${defaultCharacterPosition.x}, ${defaultCharacterPosition.y})`,
                    variant: "destructive",
                });
            }
        }
    }, [isLoading, grid, characterPosition, hasCheckedInitialPosition, setCharacterPosition, toast, defaultCharacterPosition]);

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
        }, 5000);
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

    // Fix for mystery tile: always change to grass after event
    useEffect(() => {
        if (lastMysteryTile && mysteryEventCompleted) {
            const { x, y } = lastMysteryTile;
            // @ts-ignore: runtime guard ensures grid[y] and grid[y][x] are defined
            const tile = grid[y]?.[x];
            if (typeof x === 'number' && typeof y === 'number') {
                const newGrid = grid.map(row => row.slice());
                // @ts-ignore: runtime guard ensures newGrid[y] is defined
                const newRow = newGrid[y] as Tile[] | undefined;
                if (newRow && tile) {
                    // @ts-ignore: runtime guard ensures newRow[x] is defined
                    assignTile(newRow, x, tile);
                    setGrid(newGrid);
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('update-grid', { detail: { grid: newGrid } }));
                    }
                }
            }
        }
    }, [lastMysteryTile, mysteryEventCompleted, grid]);

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
        }, 7000);
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
                newGrid[y][x] = { ...defaultTile('empty'), x, y, id: `empty-${x}-${y}` };
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

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading Realm...</div>;
    }

    const inventoryAsItems: TileInventoryItem[] = Object.values(inventory)
        .filter(t => t.type !== 'empty' && !['sheep', 'horse', 'special', 'swamp', 'treasure', 'monster'].includes(t.type))
        .map(t => ({
            ...t,
            cost: t.cost ?? 0,
            quantity: t.quantity ?? 0,
        }));

    return (
        <>
            <div className="flex flex-col h-screen bg-gray-900 text-white relative" aria-label="realm-map-section">
                {/* Top Toolbar */}
                <div className="flex items-center justify-between p-2 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 z-30">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Button
                                variant={gameMode === 'move' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setGameMode('move')}
                                className="flex items-center gap-2"
                                aria-label="movement-mode-button"
                            >
                                <Move className="w-4 h-4" />
                                <span className="hidden sm:inline">Move</span>
                            </Button>
                            <Button
                                variant={gameMode === 'build' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setGameMode('build')}
                                className="flex items-center gap-2"
                                aria-label="build-mode-button"
                            >
                                <Hammer className="w-4 h-4" />
                                <span className="hidden sm:inline">Build</span>
                            </Button>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2" aria-label="auto-save-controls">
                                <Switch id="auto-save-switch" checked={autoSave} onCheckedChange={setAutoSave} />
                                <label htmlFor="auto-save-switch" className="text-sm">Auto Save</label>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={expandMap}
                                className="flex items-center gap-2"
                                aria-label="expand-map-button"
                            >
                                <Settings className="w-4 h-4" />
                                <span className="hidden sm:inline">Expand Map</span>
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowInventory(!showInventory)}
                            className="flex items-center gap-2"
                            aria-label="toggle-inventory-button"
                        >
                            <Package className="w-4 h-4" />
                            <span className="hidden sm:inline">Inventory</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetPosition}
                            className="flex items-center gap-2"
                            aria-label="reset-position-button"
                        >
                            <Move className="w-4 h-4" />
                            <span className="hidden sm:inline">Reset Position</span>
                        </Button>
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
                <div className="flex flex-1 overflow-hidden">
                    {/* Main Map Area */}
                    <div className="flex-1 relative">
                        <MapGrid
                            grid={grid}
                            onTileClick={handlePlaceTile}
                            character={characterPosition}
                            onCharacterMove={handleCharacterMove}
                            selectedTile={selectedTile}
                            setHoveredTile={() => {}}
                            isMovementMode={gameMode === 'move'}
                            horsePos={horsePos}
                            sheepPos={sheepPos}
                            eaglePos={eaglePos}
                            penguinPos={penguinPos}
                            isHorsePresent={isHorsePresent && !horseCaught}
                            isPenguinPresent={isPenguinPresent}
                            onTileDelete={handleDeleteTile}
                        />
                    </div>
                </div>
                {/* Side Inventory Panel */}
                {showInventory && (
                    <div id="tile-inventory-panel" role="dialog" aria-modal="true" aria-label="Tile Inventory Panel" className="absolute top-[48px] right-0 h-[calc(100%-48px)] w-96 bg-gray-800/90 backdrop-blur-sm border-l border-gray-700 flex flex-col z-20">
                        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Tile Inventory</h2>
                            <Button
                                ref={closeBtnRef}
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowInventory(false)}
                                aria-label="close-inventory-button"
                            >
                                <X className="w-4 h-4" />
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
                                        localStorage.setItem('tileInventory', JSON.stringify(updated));
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
            </div>
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
        </>
    );
}
