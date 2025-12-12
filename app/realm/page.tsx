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
import { X, Hammer, Move, Package, Settings, Save, Trash2, RotateCcw, PlusCircle, MoreVertical } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { gainGold } from '@/lib/gold-manager'
import { gainExperience } from '@/lib/experience-manager'
import { useCreatureStore } from '@/stores/creatureStore'
import { generateMysteryEvent, handleEventOutcome } from '@/lib/mystery-events'
import { cn } from "@/lib/utils"

import dynamic from 'next/dynamic';
import { getUserScopedItem, setUserScopedItem } from '@/lib/user-scoped-storage';
import { getCharacterStats } from '@/lib/character-stats-manager';
import { checkMonsterSpawn, spawnMonsterOnTile, getMonsterAchievementId, MonsterType } from '@/lib/monster-spawn-manager';
import { RealmAnimationWrapper } from '@/components/realm-animation-wrapper';
import { HeaderSection } from '@/components/HeaderSection';

// Import new data loaders hook
import { useDataLoaders } from '@/hooks/use-data-loaders';
import { useAchievementUnlock } from '@/hooks/use-achievement-unlock';


// Dynamic imports for performance optimization
const RevealOverlay = dynamic(() => import('../reveal/page'), {
    ssr: false,
    loading: () => null // No loading state needed
});

const MonsterBattle = dynamic(() => import('@/components/monster-battle').then(mod => ({ default: mod.MonsterBattle })), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-screen"><div className="text-white">Loading battle...</div></div>
});

const EnterLocationModal = dynamic(() => import('@/components/enter-location-modal').then(mod => ({ default: mod.EnterLocationModal })), {
    ssr: false
});

const AnimalInteractionModal = dynamic(() => import('@/components/animal-interaction-modal').then(mod => ({ default: mod.AnimalInteractionModal })), {
    ssr: false
});

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
    // Property tiles
    archery: { ...defaultTile('archery'), cost: 150, owned: 0 },
    blacksmith: { ...defaultTile('blacksmith'), cost: 200, owned: 0 },
    sawmill: { ...defaultTile('sawmill'), cost: 120, owned: 0 },
    fisherman: { ...defaultTile('fisherman'), cost: 120, owned: 0 },
    grocery: { ...defaultTile('grocery'), cost: 160, owned: 0 },
    foodcourt: { ...defaultTile('foodcourt'), cost: 250, owned: 0 },
    well: { ...defaultTile('well'), cost: 100, owned: 0 },
    windmill: { ...defaultTile('windmill'), cost: 180, owned: 0 },
    fountain: { ...defaultTile('fountain'), cost: 180, owned: 0 },
    house: { ...defaultTile('house'), cost: 100, owned: 0 },
    inn: { ...defaultTile('inn'), cost: 220, owned: 0 },
    jousting: { ...defaultTile('jousting'), cost: 300, owned: 0 },
    mansion: { ...defaultTile('mansion'), cost: 500, owned: 0 },
    mayor: { ...defaultTile('mayor'), cost: 800, owned: 0 },
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
    const { unlockAchievement } = useAchievementUnlock();


    const [grid, setGrid] = useState<Tile[][]>(createBaseGrid());
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [characterPosition, setCharacterPosition] = useState<{ x: number; y: number }>({ x: 2, y: 0 });
    const [inventory, setInventory] = useState<Record<TileType, Tile>>(initialInventory);
    const [showInventory, setShowInventory] = useState(false);
    const [selectedTile, setSelectedTile] = useState<TileInventoryItem | null>(null);
    const [autoSave, setAutoSave] = useState(true);
    const [gridInitialized, setGridInitialized] = useState(false);
    // Track tiles explicitly placed by the user (not system-generated)
    // Initialize from localStorage if available to persist progress
    const userPlacedTilesRef = useRef<Record<string, number>>({});

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedCounts = getUserScopedItem('user-placed-tile-counts');
            if (savedCounts) {
                try {
                    userPlacedTilesRef.current = JSON.parse(savedCounts);
                } catch (e) {
                    console.error('Failed to parse user-placed-tile-counts', e);
                }
            }
        }
    }, []);
    const [gameMode, setGameMode] = useState<'build' | 'move' | 'destroy'>('move');
    const [hasVisitedRealm, setHasVisitedRealm] = useState(false);
    const [modalState, setModalState] = useState<{ isOpen: boolean; locationType: 'city' | 'town'; locationName: string } | null>(null);
    const defaultCharacterPosition = { x: 2, y: 0 };
    const [hasCheckedInitialPosition, setHasCheckedInitialPosition] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldRevealImage, setShouldRevealImage] = useState(false);
    const closeBtnRef = useRef<HTMLButtonElement>(null);
    const [horsePos, setHorsePos] = useState<{ x: number; y: number } | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('animal-horse-position');
            if (saved) return JSON.parse(saved);
        }
        return { x: 10, y: 4 };
    });
    const [eaglePos, setEaglePos] = useState<{ x: number; y: number } | null>(null);
    const [isHorsePresent, setIsHorsePresent] = useState(true);
    const [isPenguinPresent, setIsPenguinPresent] = useState(() => {
        if (typeof window !== 'undefined') {
            const cooldown = localStorage.getItem('animal-penguin-cooldown');
            if (cooldown && Date.now() < parseInt(cooldown)) return false;
        }
        return false; // Default to false until we check grid for ice
    });
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
            const saved = localStorage.getItem('animal-sheep-position');
            if (saved) return JSON.parse(saved);
        }
        return { x: 5, y: 2 };
    });
    const [isSheepPresent, setIsSheepPresent] = useState(() => {
        if (typeof window !== 'undefined') {
            const cooldown = localStorage.getItem('animal-sheep-cooldown');
            if (cooldown && Date.now() < parseInt(cooldown)) return false;
        }
        return true;
    });
    const [horseCaught, setHorseCaught] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('animal-horse-state') === 'true';
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
        setTileSize(newTileSize);
    }, []);

    // Handler for animal interactions
    const handleAnimalInteraction = useCallback(async (animalType: 'horse' | 'sheep' | 'penguin' | 'eagle') => {
        if (animalType === 'horse') {
            setHorseCaught(true);
            localStorage.setItem('animal-horse-state', 'true');

            // Dispatch horse-caught event
            window.dispatchEvent(new CustomEvent('horse-caught'));

            // Show notification
            toast({
                title: "Horse Tamed!",
                description: "You successfully tamed the wild horse!",
            });
        } else if (animalType === 'sheep') {
            try {
                const res = await fetch('/api/creatures/interact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ instanceId: `sheep-${Date.now()}`, definitionId: '901' })
                });
                const data = await res.json();
                if (data.reward && data.shaved) {
                    toast({ title: "Sheep Shaved!", description: data.message });
                    gainExperience(data.reward.amount, 'sheep-shave');
                    setIsSheepPresent(false);
                    // Set 5-day cooldown
                    const cooldownTime = Date.now() + 5 * 24 * 60 * 60 * 1000;
                    localStorage.setItem('animal-sheep-cooldown', cooldownTime.toString());
                } else if (data.cooldown) {
                    toast({ title: "Recently Shaved", description: data.message, variant: "destructive" });
                    setIsSheepPresent(false); // Hide it if we know it's on cooldown
                } else {
                    toast({ title: "Baaa!", description: data.message || "The sheep looks happy." });
                }
            } catch (e) {
                console.error("Sheep interaction failed", e);
                toast({ title: "Error", description: "Failed to interact with sheep", variant: "destructive" });
            }
        } else if (animalType === 'penguin') {
            try {
                const res = await fetch('/api/creatures/interact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ instanceId: `penguin-${Date.now()}`, definitionId: '903' })
                });
                const data = await res.json();
                if (data.reward && data.shaved) { // API returns 'shaved' flag on success
                    toast({
                        title: "Noot Noot!",
                        description: data.message,
                    });
                    gainExperience(data.reward.amount, 'penguin-play');
                    setIsPenguinPresent(false);
                    // Set 5-day cooldown
                    const cooldownTime = Date.now() + 5 * 24 * 60 * 60 * 1000;
                    localStorage.setItem('animal-penguin-cooldown', cooldownTime.toString());
                } else if (data.cooldown) {
                    toast({ title: "Tired Penguin", description: data.message, variant: "destructive" });
                    setIsPenguinPresent(false);
                } else {
                    toast({ title: "Noot Noot!", description: data.message });
                }
            } catch (e) {
                console.error("Penguin interaction failed", e);
                toast({ title: "Error", description: "Failed to interact with penguin", variant: "destructive" });
            }
        }
    }, [toast]);



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

        // Check cooldown first
        if (typeof window !== 'undefined') {
            const cooldown = localStorage.getItem('animal-penguin-cooldown');
            if (cooldown && Date.now() < parseInt(cooldown)) {
                if (isPenguinPresent) setIsPenguinPresent(false);
                return;
            }
        }

        const hasIce = grid.some(row => row && row.some(tile => tile?.type === 'ice'));

        if (!hasIce && isPenguinPresent) {
            setIsPenguinPresent(false);
            setPenguinPos(null);
        } else if (hasIce && !isPenguinPresent) {
            // Find the first ice tile, prioritizing center tiles
            let bestIcePos = null;
            const centerX = Math.floor(GRID_COLS / 2);
            const centerY = Math.floor(INITIAL_ROWS / 2);

            // First try to find ice tiles in the center area
            for (let y = centerY - 1; y <= centerY + 1; y++) {
                for (let x = centerX - 1; x <= centerX + 1; x++) {
                    if (y >= 0 && y < grid.length && x >= 0 && x < GRID_COLS) {
                        const tile = grid[y]?.[x];
                        if (tile?.type === 'ice') {
                            bestIcePos = { x, y };
                            break;
                        }
                    }
                }
                if (bestIcePos) break;
            }

            // If no center ice tile found, find any ice tile
            if (!bestIcePos) {
                bestIcePos = findFirstIceTile(grid);
            }

            if (bestIcePos) {
                setPenguinPos(bestIcePos);
                setIsPenguinPresent(true);
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
            // Show animal interaction modal
            setAnimalInteractionModal({
                isOpen: true,
                animalType: 'horse',
                animalName: 'Wild Horse'
            });
        }
    }, [characterPosition, horsePos, isHorsePresent, horseCaught, grid]);

    // Sheep interaction logic
    useEffect(() => {
        if (!Array.isArray(grid) || !isSheepPresent || !sheepPos) return;

        // Check if player is on the same tile as sheep
        if (characterPosition.x === sheepPos.x && characterPosition.y === sheepPos.y) {
            setAnimalInteractionModal({
                isOpen: true,
                animalType: 'sheep',
                animalName: 'Wooly Sheep'
            });
        }
    }, [characterPosition, sheepPos, isSheepPresent, grid]);

    // Penguin interaction logic
    useEffect(() => {
        if (!Array.isArray(grid) || !isPenguinPresent || !penguinPos) return;

        // Check if player is on the same tile as penguin
        if (characterPosition.x === penguinPos.x && characterPosition.y === penguinPos.y) {
            setAnimalInteractionModal({
                isOpen: true,
                animalType: 'penguin',
                animalName: 'Happy Penguin'
            });
        }
    }, [characterPosition, penguinPos, isPenguinPresent, grid]);

    // --- Load and transform completed mystery tiles on page load ---
    useEffect(() => {
        if (typeof window !== 'undefined' && grid.length > 0) {
            const completedMysteryTiles = JSON.parse(localStorage.getItem('mystery-completed-tiles') || '[]');
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
                            const completedMysteryTiles = JSON.parse(localStorage.getItem('mystery-completed-tiles') || '[]');
                            const tileKey = `${x}-${y}`;
                            if (!completedMysteryTiles.includes(tileKey)) {
                                completedMysteryTiles.push(tileKey);
                                localStorage.setItem('mystery-completed-tiles', JSON.stringify(completedMysteryTiles));
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
        // Only track achievements after grid is initialized
        if (!gridInitialized) {
            return;
        }

        // Track tile actions for achievements using explicit user-placed counts
        const actionCounts: Record<string, number> = {};
        for (const req of creatureRequirements) {
            const [tileType, action] = req.action.split('_tiles_');
            if (action === 'placed' && tileType) {
                // Use explicit user-placed tile tracking instead of grid counts
                const userPlacedKey = `${tileType}_tiles_placed`;
                actionCounts[req.action] = userPlacedTilesRef.current[userPlacedKey] || 0;
            } else if (action === 'destroyed') {
                // Track destroyed tiles from localStorage
                const achievementKey = `destroyed_${tileType}_tiles`;
                actionCounts[req.action] = parseInt(localStorage.getItem(achievementKey) || '0');
            }
        }

        for (const req of creatureRequirements) {
            const count = actionCounts[req.action];
            if (typeof count === 'number' && typeof req.threshold === 'number' && count >= req.threshold) {
                // Unlock achievement if not already unlocked
                if (userId) {
                    // Add a guard to prevent repeated calls for the same achievement
                    const achievementKey = `unlocked_${req.id}`;
                    if (!localStorage.getItem(achievementKey)) {
                        localStorage.setItem(achievementKey, 'true');
                        (async () => {
                            try {
                                const token = await getToken({ template: 'supabase' });
                                console.log(`[Achievement Unlock] Attempting to unlock achievement ${req.id}`);
                                const response = await fetch('/api/achievements/unlock', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ achievementId: req.id })
                                });

                                if (response.ok) {
                                    const result = await response.json();
                                    console.log(`[Achievement Unlock] ✅ Successfully unlocked achievement ${req.id}:`, result);
                                } else {
                                    const error = await response.json();
                                    console.error(`[Achievement Unlock] ❌ Failed to unlock achievement ${req.id}:`, error);
                                    // Remove the storage flag so it can be retried
                                    localStorage.removeItem(achievementKey);
                                }
                            } catch (error) {
                                console.error(`[Achievement Unlock] ❌ Error unlocking achievement ${req.id}:`, error);
                                // Remove the storage flag so it can be retried
                                localStorage.removeItem(achievementKey);
                            }
                        })();
                        discoverCreature(req.id);
                    }
                }
            }
        }
    }, [grid, userId, discoverCreature, getToken, gridInitialized]);

    // Achievement unlock effect
    useEffect(() => {
        if (!hasVisitedRealm && isAuthLoaded && userId) {
            setHasVisitedRealm(true);

            // Unlock the Necrion achievement (000) using the centralized hook
            unlockAchievement({
                achievementId: '000',
                achievementName: 'Necrion',
                description: "Necrion - You've discovered the realm map!",
                onSuccess: () => {
                    // Also unlock Necrion in the local creature store
                    discoverCreature('000');
                },
            });
        }
    }, [hasVisitedRealm, isAuthLoaded, userId, setHasVisitedRealm, unlockAchievement, discoverCreature]);


    // Load data from Supabase with localStorage fallback
    useEffect(() => {
        const loadUserData = async () => {
            if (!isAuthLoaded || isGuest || !userId) return;

            setIsLoading(true);
            try {
                // Load grid data
                const gridResult = await loadGridData(userId);

                if (gridResult && gridResult.data) {
                    // The API returns { data: { grid: [...] } }, so we need to access gridResult.data.grid
                    const actualGridData = gridResult.data.grid;

                    if (actualGridData && Array.isArray(actualGridData)) {
                        setGrid(actualGridData);
                    } else {
                        // Try to load from realm-tiles API instead of CSV
                        try {
                            const res = await fetch('/api/realm-tiles');
                            const data = await res.json();
                            if (res.ok && data.tiles && Array.isArray(data.tiles)) {
                                const maxRow = Math.max(...data.tiles.map((row: any) => row.y ?? 0), INITIAL_ROWS - 1);
                                const gridArr: Tile[][] = Array.from({ length: maxRow + 1 }, (_, y) =>
                                    Array.from({ length: GRID_COLS }, (_, x) => defaultTile('grass'))
                                );
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
                                    }
                                });
                                setGrid(gridArr);
                            } else {
                                const initialGrid = await loadInitialGridFromCSV();
                                setGrid(initialGrid);
                            }
                        } catch (err) {
                            console.error('[Realm] Error loading tiles:', err);
                            const initialGrid = await loadInitialGridFromCSV();
                            setGrid(initialGrid);
                        }
                    }
                } else {
                    // Fallback to API or create base grid
                    try {
                        const res = await fetch('/api/realm-tiles');
                        const data = await res.json();
                        if (res.ok && data.tiles && Array.isArray(data.tiles)) {
                            const maxRow = Math.max(...data.tiles.map((row: any) => row.y ?? 0), INITIAL_ROWS - 1);
                            const gridArr: Tile[][] = Array.from({ length: maxRow + 1 }, (_, y) =>
                                Array.from({ length: GRID_COLS }, (_, x) => defaultTile('empty'))
                            );
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
                                }
                            });
                            setGrid(gridArr);
                        } else {
                            const initialGrid = await loadInitialGridFromCSV();
                            setGrid(initialGrid);
                        }
                    } catch (err) {
                        console.error('[Realm] Error loading tiles:', err);
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
                // Mark grid as initialized so achievement tracking can begin
                // But achievements will only trigger for explicitly user-placed tiles
                setGridInitialized(true);
            }
        };

        loadUserData();
    }, [isAuthLoaded, isGuest, userId, getToken]);

    // --- Polling for grid changes instead of real-time sync - DISABLED TO PREVENT INFINITE LOOPS ---
    useEffect(() => {
        if (!isAuthLoaded || isGuest || !userId) return;

        // Disable polling to prevent infinite loops
        console.log('[Realm Page] Polling disabled to prevent infinite loops');

        // Only load grid data once on mount
        // Grid will be updated via event listeners instead
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
            if (!userId) return;

            try {
                // Comment out database reload since onUpdateTiles is working correctly
                // The database reload was causing race conditions and overwriting correct data
                /*
                // Reload tile inventory
                const inventoryResult = await loadTileInventory(userId);
                if (inventoryResult && inventoryResult.data && Object.keys(inventoryResult.data).length > 0) {
                    // Merge with initial inventory
                    const mergedInventory = { ...initialInventory };
                    Object.entries(inventoryResult.data).forEach(([tileId, item]: [string, any]) => {
                        if (!item || typeof item !== 'object') {
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
                    setInventoryAsItems(items);
                }
                */
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

            try {
                const inventoryResult = await loadTileInventory(userId);

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
                    }

                    setInventoryAsItems(items);
                }
            } catch (error) {
                console.error('[Realm] Error loading inventory items:', error);
            }
        };

        loadInventoryItems();
    }, [userId, isAuthLoaded]);



    // Place tile: update grid and send only the changed tile to backend
    const handlePlaceTile = async (x: number, y: number) => {
        // Removed debugging log

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

        // Handle tile destruction if in destroy mode
        if (gameMode === 'destroy') {
            handleDestroyTile(x, y);
            return;
        }

        if (gameMode !== 'build' || !selectedTile) {
            // Removed debugging log
            return;
        }

        // Check if we have the tile in inventory (either from main inventory or selectedTile)
        const tileToPlace = inventory[selectedTile.type];
        const hasTileInInventory = tileToPlace && (tileToPlace.owned ?? 0) > 0;
        const hasTileInSelected = selectedTile && (selectedTile.quantity ?? 0) > 0;

        if (!hasTileInInventory && !hasTileInSelected) {
            // Removed debugging log
            toast({
                title: "📦 Empty Inventory",
                description: "Your tile pouch is empty! Visit the market to restock your building materials.",
                variant: "destructive",
            });
            return;
        }

        // Use the selectedTile if it has quantity, otherwise fall back to inventory
        const tileToUse = hasTileInSelected ? selectedTile : tileToPlace;

        // Removed debugging log

        // Optimistically update the UI first for better user experience
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => row.slice());
            if (newGrid[y]?.[x]) {
                newGrid[y][x] = { ...tileToUse, x, y, owned: 1 };
                // Removed debugging log
            }
            return newGrid;
        });

        // Track user-placed tile for achievement system
        const tileType = selectedTile.type;
        const userPlacedKey = `${tileType}_tiles_placed`;
        userPlacedTilesRef.current[userPlacedKey] = (userPlacedTilesRef.current[userPlacedKey] || 0) + 1;

        // Persist user-placed tile counts to user-scoped storage
        setUserScopedItem('user-placed-tile-counts', JSON.stringify(userPlacedTilesRef.current));

        console.log('[Realm] User placed tile:', tileType, 'Total:', userPlacedTilesRef.current[userPlacedKey]);

        // Update inventory - handle both owned and quantity properties
        setInventory(prev => {
            const newInventory = { ...prev };
            const invTile = newInventory[selectedTile.type];
            if (invTile) {
                // If we're using the selectedTile (which has quantity), update the main inventory
                if (hasTileInSelected) {
                    invTile.owned = Math.max(0, (invTile.owned ?? 0) - 1);
                } else {
                    // If we're using the main inventory, update owned
                    invTile.owned = Math.max(0, (invTile.owned ?? 0) - 1);
                }
            }

            // Save inventory to Supabase
            if (userId) {
                saveTileInventory(userId, newInventory).catch(error => {
                    console.error('Failed to save inventory:', error);
                });
            }

            return newInventory;
        });

        // Also update the selectedTile quantity if it has one
        if (hasTileInSelected && selectedTile.quantity !== undefined) {
            setSelectedTile(prev => prev ? { ...prev, quantity: Math.max(0, prev.quantity - 1) } : null);
        }

        // Save only the changed tile with retry logic
        try {
            if (!selectedTile?.type) {
                console.error('No tile type selected');
                toast({ title: '🎯 No Target Selected', description: 'Choose your weapon! Select a tile type from your inventory first.', variant: 'destructive' });
                return;
            }

            const tileTypeNum = tileTypeToNumeric[selectedTile.type];
            if (typeof tileTypeNum === 'undefined') {
                console.error('Invalid tile type:', selectedTile.type);
                toast({ title: '⚠️ Unknown Material', description: 'This mysterious tile type defies classification! The realm doesn\'t recognize it.', variant: 'destructive' });
                return;
            }

            // Removed debugging log

            // Enhanced fetch with retry logic and timeout
            const saveTileWithRetry = async (attempt: number = 1): Promise<Response> => {
                const maxAttempts = 3;
                const timeoutMs = 10000; // 10 second timeout

                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                    const response = await fetch('/api/realm-tiles', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ x, y, tile_type: tileTypeNum }),
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);
                    return response;
                } catch (error) {
                    if (error instanceof Error && error.name === 'AbortError') {
                        console.warn(`[Realm] Tile save attempt ${attempt} timed out`);
                    } else {
                        console.warn(`[Realm] Tile save attempt ${attempt} failed:`, error);
                    }

                    if (attempt < maxAttempts) {
                        // Exponential backoff: 1s, 2s, 4s
                        const delay = Math.pow(2, attempt - 1) * 1000;
                        // Removed debugging log
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return saveTileWithRetry(attempt + 1);
                    }

                    throw error;
                }
            };

            const res = await saveTileWithRetry();

            if (!res.ok) {
                const err = await res.json();
                toast({ title: 'Error', description: `Failed to save tile: ${err.error}`, variant: 'destructive' });
                console.error('Tile save error:', err);

                // Revert the optimistic update on failure
                setGrid(prevGrid => {
                    const newGrid = prevGrid.map(row => row.slice());
                    if (newGrid[y]?.[x]) {
                        newGrid[y][x] = clickedTile || { ...defaultTile('empty'), x, y, id: `empty-${x}-${y}` };
                    }
                    return newGrid;
                });

                // Restore inventory
                setInventory(prev => {
                    const newInventory = { ...prev };
                    const invTile = newInventory[selectedTile.type];
                    if (invTile) {
                        invTile.owned = (invTile.owned ?? 0) + 1;
                    }
                    return newInventory;
                });

                // Restore selectedTile quantity if it was used
                if (hasTileInSelected && selectedTile.quantity !== undefined) {
                    setSelectedTile(prev => prev ? { ...prev, quantity: (prev.quantity ?? 0) + 1 } : null);
                }

                return;
            }

            // Removed debugging log

            // Check for monster spawns after successful tile placement
            // Removed debugging log
            // Create updated grid with the new tile for spawn check
            const updatedGrid = grid.map(row => row.slice());
            if (updatedGrid[y] && updatedGrid[y][x]) {
                updatedGrid[y][x] = { ...tileToUse, x, y, owned: 1 };
            }
            const spawnResult = checkMonsterSpawn(updatedGrid, selectedTile.type);
            // Removed debugging log

            if (spawnResult.shouldSpawn && spawnResult.position && spawnResult.monsterType) {
                // Removed debugging log
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
                            // Removed debugging log
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
            // Removed debugging log

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
        } catch (err) {
            console.error('Tile save error:', err);

            // Determine if it's a network error
            const isNetworkError = err instanceof Error && (
                err.message.includes('Failed to fetch') ||
                err.message.includes('NetworkError') ||
                err.message.includes('ERR_TIMED_OUT') ||
                err.message.includes('ERR_NETWORK_CHANGED') ||
                err.message.includes('ERR_INTERNET_DISCONNECTED')
            );

            if (isNetworkError) {
                toast({
                    title: 'Network Error',
                    description: 'Tile placed locally but failed to save due to network issues. It will be saved when connection is restored.',
                    variant: 'destructive'
                });

                // Store the tile placement for later sync when network is restored
                const pendingTile = {
                    x,
                    y,
                    tile_type: tileTypeToNumeric[selectedTile.type],
                    timestamp: Date.now(),
                    selectedTileType: selectedTile.type,
                    wasUsingSelectedTile: hasTileInSelected
                };
                const pendingTiles = JSON.parse(localStorage.getItem('pendingTilePlacements') || '[]');
                pendingTiles.push(pendingTile);
                localStorage.setItem('pendingTilePlacements', JSON.stringify(pendingTiles));

                // Set up a retry mechanism when network is restored
                const checkNetworkAndRetry = () => {
                    if (navigator.onLine) {
                        // Removed debugging log
                        // Retry pending placements
                        const pendingTiles = JSON.parse(localStorage.getItem('pendingTilePlacements') || '[]');
                        if (pendingTiles.length > 0) {
                            pendingTiles.forEach(async (pendingTile: any) => {
                                try {
                                    const res = await fetch('/api/realm-tiles', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            x: pendingTile.x,
                                            y: pendingTile.y,
                                            tile_type: pendingTile.tile_type
                                        })
                                    });
                                    if (res.ok) {
                                        // Removed debugging log
                                        // Remove from pending list
                                        const updatedPending = pendingTiles.filter((t: any) =>
                                            !(t.x === pendingTile.x && t.y === pendingTile.y && t.tile_type === pendingTile.tile_type)
                                        );
                                        localStorage.setItem('pendingTilePlacements', JSON.stringify(updatedPending));
                                    }
                                } catch (retryError) {
                                    console.error('[Realm] Failed to sync pending tile placement:', retryError);
                                }
                            });
                        }
                        // Remove the event listener
                        window.removeEventListener('online', checkNetworkAndRetry);
                    }
                };

                window.addEventListener('online', checkNetworkAndRetry);
            } else {
                toast({ title: 'Error', description: 'Failed to save tile', variant: 'destructive' });

                // Revert the optimistic update on non-network errors
                setGrid(prevGrid => {
                    const newGrid = prevGrid.map(row => row.slice());
                    if (newGrid[y]?.[x]) {
                        newGrid[y][x] = clickedTile || { ...defaultTile('empty'), x, y, id: `empty-${x}-${y}` };
                    }
                    return newGrid;
                });

                // Restore inventory
                setInventory(prev => {
                    const newInventory = { ...prev };
                    const invTile = newInventory[selectedTile.type];
                    if (invTile) {
                        invTile.owned = (invTile.owned ?? 0) + 1;
                    }
                    return newInventory;
                });

                // Restore selectedTile quantity if it was used
                if (hasTileInSelected && selectedTile.quantity !== undefined) {
                    setSelectedTile(prev => prev ? { ...prev, quantity: (prev.quantity ?? 0) + 1 } : null);
                }
            }
        }
    };

    const handleTileSelection = (tile: TileInventoryItem | null) => {
        // Removed debugging log

        // Check if tile can be selected - either from main inventory (owned) or from tile itself (quantity)
        const hasMainInventory = tile?.type && inventory[tile.type] && (inventory[tile.type].owned ?? 0) > 0;
        const hasTileQuantity = tile && (tile.quantity ?? 0) > 0;

        if (hasMainInventory || hasTileQuantity) {
            // Removed debugging log
            setSelectedTile(tile);
            setShowInventory(false);
        } else {
            // Removed debugging log
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
                    title: "🌌 Uncharted Territory",
                    description: "The void stretches before you! Place a tile to claim this mysterious land.",
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

    const handleDestroyTile = async (x: number, y: number) => {
        const targetTile = grid[y]?.[x];

        // Check if there's a tile to destroy
        if (!targetTile || targetTile.type === 'empty') {
            toast({
                title: "🌫️ Empty Void",
                description: "There's nothing here to destroy - just empty space waiting for your touch.",
                variant: "destructive",
            });
            return;
        }

        // Don't allow destroying certain protected tiles
        if (['mountain', 'water', 'lava', 'volcano'].includes(targetTile.type)) {
            const protectionMessages = {
                'mountain': "The ancient mountain stands defiant! Even your power cannot shake the eternal peaks.",
                'water': "The mystical waters are protected by ancient magic! They cannot be destroyed.",
                'lava': "The lava flows with primordial power! Your destruction attempts are futile against the earth's fury.",
                'volcano': "The volcanic forces are beyond mortal control! The realm's fire cannot be extinguished."
            };

            toast({
                title: "⛰️ Immovable Force",
                description: protectionMessages[targetTile.type as keyof typeof protectionMessages] || `The ${targetTile.type} resists your power!`,
                variant: "destructive",
            });
            return;
        }

        // Show confirmation dialog
        const confirmed = window.confirm(`Are you sure you want to destroy this ${targetTile.type} tile?`);
        if (!confirmed) {
            return;
        }

        try {
            // Optimistically update the UI first
            setGrid(prevGrid => {
                const newGrid = prevGrid.map(row => row.slice());
                if (newGrid[y]?.[x]) {
                    newGrid[y][x] = {
                        id: `${x}-${y}`,
                        type: 'empty',
                        name: 'Empty Tile',
                        description: 'An empty tile',
                        connections: [],
                        rotation: 0,
                        revealed: true,
                        isVisited: false,
                        x,
                        y,
                        ariaLabel: `Empty tile at position ${x},${y}`,
                        image: '/images/tiles/empty-tile.png',
                        owned: 0,
                        hasMonster: undefined
                    };
                }
                return newGrid;
            });

            // Send destruction request to backend
            const response = await fetch('/api/realm-tiles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    x,
                    y,
                    tile_type: 0, // 0 = empty
                    event_type: null
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to destroy tile');
            }

            // Show success message
            const tileTypeNames = {
                'forest': 'forest',
                'mountain': 'mountain',
                'water': 'water',
                'ice': 'ice',
                'grass': 'grass',
                'city': 'city',
                'town': 'town'
            };
            const tileName = tileTypeNames[targetTile.type as keyof typeof tileTypeNames] || targetTile.type;

            toast({
                title: "💥 Devastation Complete!",
                description: `The ${tileName} tile crumbles to dust beneath your mighty power!`,
            });

            // Track tile destruction for achievements
            if (userId && targetTile.type) {
                const achievementKey = `destroyed_${targetTile.type}_tiles`;
                const currentCount = parseInt(localStorage.getItem(achievementKey) || '0');
                const newCount = currentCount + 1;
                localStorage.setItem(achievementKey, newCount.toString());

                // Check for destruction achievements
                const destructionAchievements = [
                    { type: 'forest', threshold: 1, achievementId: '001' },
                    { type: 'forest', threshold: 5, achievementId: '002' },
                    { type: 'forest', threshold: 10, achievementId: '003' },
                    { type: 'mountain', threshold: 1, achievementId: '010' },
                    { type: 'mountain', threshold: 5, achievementId: '011' },
                    { type: 'mountain', threshold: 10, achievementId: '012' },
                    { type: 'water', threshold: 1, achievementId: '004' },
                    { type: 'water', threshold: 5, achievementId: '005' },
                    { type: 'water', threshold: 10, achievementId: '006' },
                    { type: 'ice', threshold: 1, achievementId: '013' },
                    { type: 'ice', threshold: 5, achievementId: '014' },
                    { type: 'ice', threshold: 10, achievementId: '015' }
                ];

                const achievement = destructionAchievements.find(a => a.type === targetTile.type);
                if (achievement && newCount >= achievement.threshold) {
                    // Check if achievement is already unlocked
                    const unlockKey = `unlocked_${achievement.achievementId}`;
                    if (!sessionStorage.getItem(unlockKey)) {
                        sessionStorage.setItem(unlockKey, 'true');

                        // Unlock achievement
                        (async () => {
                            try {
                                const token = await getToken({ template: 'supabase' });
                                const response = await fetch('/api/achievements/unlock', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ achievementId: achievement.achievementId })
                                });

                                if (response.ok) {
                                    // Show achievement notification with improved thematic messages
                                    const achievementMessages = {
                                        '001': { title: "🔥 Flamio Emerges!", description: "While clearing a path by destroying 1 forest tile, you discover the fiery creature Flamio and 25 gold for your treasure pile!" },
                                        '002': { title: "🔥 Embera Awakens!", description: "While clearing a path by destroying 5 forest tiles, you find the fierce Embera and 50 gold for your treasure pile!" },
                                        '003': { title: "🔥 Vulcana Rises!", description: "While clearing a path by destroying 10 forest tiles, you awaken the ultimate fire creature Vulcana and 100 gold for your treasure pile!" },
                                        '004': { title: "💧 Dolpio Emerges!", description: "While clearing a path by destroying 1 water tile, you discover the playful water creature Dolpio and 25 gold for your treasure pile!" },
                                        '005': { title: "💧 Divero Awakens!", description: "While clearing a path by destroying 5 water tiles, you find the experienced water dweller Divero and 50 gold for your treasure pile!" },
                                        '006': { title: "💧 Flippur Rises!", description: "While clearing a path by destroying 10 water tiles, you awaken the supreme water creature Flippur and 100 gold for your treasure pile!" },
                                        '010': { title: "⛰️ Rockie Emerges!", description: "While clearing a path by destroying 1 mountain tile, you discover the mountain spirit Rockie and 25 gold for your treasure pile!" },
                                        '011': { title: "⛰️ Buldour Awakens!", description: "While clearing a path by destroying 5 mountain tiles, you find the stronger mountain spirit Buldour and 50 gold for your treasure pile!" },
                                        '012': { title: "⛰️ Montano Rises!", description: "While clearing a path by destroying 10 mountain tiles, you awaken the ultimate mountain creature Montano and 100 gold for your treasure pile!" },
                                        '013': { title: "❄️ Icey Emerges!", description: "While clearing a path by destroying 1 ice tile, you discover the small ice creature Icey and 25 gold for your treasure pile!" },
                                        '014': { title: "❄️ Hailey Awakens!", description: "While clearing a path by destroying 5 ice tiles, you find the powerful ice spirit Hailey and 50 gold for your treasure pile!" },
                                        '015': { title: "❄️ Blizzey Rises!", description: "While clearing a path by destroying 10 ice tiles, you awaken the supreme ice creature Blizzey and 100 gold for your treasure pile!" }
                                    };

                                    const message = achievementMessages[achievement.achievementId as keyof typeof achievementMessages];
                                    if (message) {
                                        toast({
                                            title: message.title,
                                            description: message.description,
                                        });
                                    } else {
                                        // Fallback for unknown achievements
                                        const tileTypeNames = {
                                            'forest': 'Forest',
                                            'mountain': 'Mountain',
                                            'water': 'Water',
                                            'ice': 'Ice'
                                        };
                                        const tileName = tileTypeNames[targetTile.type as keyof typeof tileTypeNames] || targetTile.type;

                                        toast({
                                            title: "🏆 Legendary Achievement!",
                                            description: `The ancient ${tileName.toLowerCase()} trembles as you claim victory! ${tileName} Destroyer rank achieved!`,
                                        });
                                    }

                                    // Discover creature if applicable
                                    discoverCreature(achievement.achievementId);
                                }
                            } catch (error) {
                                console.error('Error unlocking achievement:', error);
                            }
                        })();
                    }
                }
            }

        } catch (error) {
            console.error('Error destroying tile:', error);

            // Revert the UI change on error
            setGrid(prevGrid => {
                const newGrid = prevGrid.map(row => row.slice());
                if (newGrid[y]?.[x]) {
                    newGrid[y][x] = targetTile; // Restore original tile
                }
                return newGrid;
            });

            toast({
                title: "❌ Destruction Failed",
                description: "The realm's magic resists your attempt. The tile remains untouched.",
                variant: "destructive",
            });
        }
    };

    // Expand map function
    const expandMap = async () => {
        if (!canExpand) {
            toast({
                title: '🔒 Realm Locked',
                description: `The ancient barriers hold strong! Reach level ${nextExpansionLevel} to unlock the realm's hidden depths!`,
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
            localStorage.setItem('realm-expansions', String(newVal));
            return newVal;
        });
        toast({
            title: "🌍 Realm Expanded!",
            description: "The mystical boundaries shift! Three new rows of land emerge from the cosmic void!",
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
                    title: "🌌 Uncharted Territory",
                    description: "The void stretches before you! Place a tile to claim this mysterious land.",
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
                    localStorage.setItem('animal-horse-state', 'true');
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
            return parseInt(localStorage.getItem('realm-expansions') || '0', 10);
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
            localStorage.setItem('realm-expansions', '0');
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
                // Removed debugging log
                // Find a valid grass tile
                for (let y = 0; y < grid.length; y++) {
                    const row = grid[y];
                    if (!row) continue;
                    for (let x = 0; x < row.length; x++) {
                        const checkTile = row[x];
                        if (checkTile && checkTile.type === 'grass' && !checkTile.hasMonster) {
                            setHorsePos({ x, y });
                            localStorage.setItem('animal-horse-position', JSON.stringify({ x, y }));
                            // Removed debugging log
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
                // Find a valid grass tile
                for (let y = 0; y < grid.length; y++) {
                    const row = grid[y];
                    if (!row) continue;
                    for (let x = 0; x < row.length; x++) {
                        const checkTile = row[x];
                        if (checkTile && checkTile.type === 'grass' && !checkTile.hasMonster) {
                            setSheepPos({ x, y });
                            localStorage.setItem('animal-sheep-position', JSON.stringify({ x, y }));
                            break;
                        }
                    }
                }
            }
        }
    }, [grid, isHorsePresent, horsePos, isSheepPresent, sheepPos]);

    // Network status and resilience
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'unstable'>('online');
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    // Monitor network status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setNetworkStatus('online');
            // Removed debugging log

            // Sync any pending tile placements
            syncPendingTilePlacements();
        };

        const handleOffline = () => {
            setIsOnline(false);
            setNetworkStatus('offline');
            // Removed debugging log
        };

        const handleNetworkChange = () => {
            if (navigator.onLine) {
                setIsOnline(true);
                setNetworkStatus('online');
            } else {
                setIsOnline(false);
                setNetworkStatus('offline');
            }
        };

        // Check for pending syncs on mount
        const checkPendingSyncs = () => {
            const pendingTiles = JSON.parse(localStorage.getItem('realm-pending-tiles') || '[]');
            setPendingSyncCount(pendingTiles.length);
        };

        checkPendingSyncs();

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('focus', checkPendingSyncs);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('focus', checkPendingSyncs);
        };
    }, []);

    // Sync pending tile placements when network is restored
    const syncPendingTilePlacements = async () => {
        try {
            const pendingTiles = JSON.parse(localStorage.getItem('realm-pending-tiles') || '[]');
            if (pendingTiles.length === 0) return;

            // Removed debugging log
            setPendingSyncCount(pendingTiles.length);

            const successfulSyncs: any[] = [];
            const failedSyncs: any[] = [];

            for (const pendingTile of pendingTiles) {
                try {
                    const res = await fetch('/api/realm-tiles', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            x: pendingTile.x,
                            y: pendingTile.y,
                            tile_type: pendingTile.tile_type
                        })
                    });

                    if (res.ok) {
                        successfulSyncs.push(pendingTile);
                        // Removed debugging log
                    } else {
                        // Increment retry count for failed syncs
                        const updatedTile = { ...pendingTile, retryCount: (pendingTile.retryCount || 0) + 1 };

                        // Remove tiles that have been retried too many times
                        if (updatedTile.retryCount < 5) {
                            failedSyncs.push(updatedTile);
                        } else {
                            // Removed debugging log
                        }

                        // Removed debugging log
                    }
                } catch (error) {
                    // Increment retry count for network errors
                    const updatedTile = { ...pendingTile, retryCount: (pendingTile.retryCount || 0) + 1 };

                    // Remove tiles that have been retried too many times
                    if (updatedTile.retryCount < 5) {
                        failedSyncs.push(updatedTile);
                    } else {
                        // Removed debugging log
                    }

                    // Removed debugging log
                }
            }

            // Update pending list with only failed syncs
            localStorage.setItem('realm-pending-tiles', JSON.stringify(failedSyncs));
            setPendingSyncCount(failedSyncs.length);

            if (successfulSyncs.length > 0) {
                toast({
                    title: "Sync Complete",
                    description: `Successfully synced ${successfulSyncs.length} tile placements`,
                });
            }

            if (failedSyncs.length > 0) {
                toast({
                    title: "Sync Incomplete",
                    description: `${failedSyncs.length} tile placements failed to sync and will be retried later`,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('[Realm] Error during sync:', error);
        }
    };

    // Enhanced error handling for tile placement failures
    const handleTilePlacementError = (error: any, x: number, y: number, tileType: TileType) => {
        console.error('[Realm] Tile placement error:', error);

        // Determine error type
        const isNetworkError = error instanceof Error && (
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError') ||
            error.message.includes('ERR_TIMED_OUT') ||
            error.message.includes('ERR_NETWORK_CHANGED') ||
            error.message.includes('ERR_INTERNET_DISCONNECTED') ||
            error.message.includes('timeout') ||
            error.message.includes('network')
        );

        const isAuthError = error instanceof Error && (
            error.message.includes('Unauthorized') ||
            error.message.includes('401') ||
            error.message.includes('auth')
        );

        const isServerError = error instanceof Error && (
            error.message.includes('500') ||
            error.message.includes('Internal server error') ||
            error.message.includes('Database')
        );

        if (isNetworkError) {
            toast({
                title: 'Network Error',
                description: 'Tile placed locally but failed to save due to network issues. It will be saved when connection is restored.',
                variant: 'destructive'
            });

            // Store for later sync
            const pendingTile = {
                x,
                y,
                tile_type: tileTypeToNumeric[tileType],
                timestamp: Date.now(),
                retryCount: 0
            };

            const pendingTiles = JSON.parse(localStorage.getItem('pendingTilePlacements') || '[]');
            pendingTiles.push(pendingTile);
            localStorage.setItem('pendingTilePlacements', JSON.stringify(pendingTiles));
            setPendingSyncCount(pendingTiles.length);

        } else if (isAuthError) {
            toast({
                title: 'Authentication Error',
                description: 'Please log in again to continue placing tiles.',
                variant: 'destructive'
            });

            // Revert the optimistic update
            revertTilePlacement(x, y);

        } else if (isServerError) {
            toast({
                title: 'Server Error',
                description: 'The server is experiencing issues. Please try again later.',
                variant: 'destructive'
            });

            // Store for later retry
            const pendingTile = {
                x,
                y,
                tile_type: tileTypeToNumeric[tileType],
                timestamp: Date.now(),
                retryCount: 0
            };

            const pendingTiles = JSON.parse(localStorage.getItem('pendingTilePlacements') || '[]');
            pendingTiles.push(pendingTile);
            localStorage.setItem('pendingTilePlacements', JSON.stringify(pendingTiles));
            setPendingSyncCount(pendingTiles.length);

        } else {
            toast({
                title: 'Unknown Error',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive'
            });

            // Revert the optimistic update for unknown errors
            revertTilePlacement(x, y);
        }
    };

    // Helper function to revert tile placement
    const revertTilePlacement = (x: number, y: number) => {
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => row.slice());
            if (newGrid[y]?.[x]) {
                // Find the original tile at this position
                const originalTile = grid[y]?.[x];
                newGrid[y][x] = originalTile || { ...defaultTile('empty'), x, y, id: `empty-${x}-${y}` };
            }
            return newGrid;
        });

        // Restore inventory
        if (selectedTile) {
            setInventory(prev => {
                const newInventory = { ...prev };
                const invTile = newInventory[selectedTile.type];
                if (invTile) {
                    invTile.owned = (invTile.owned ?? 0) + 1;
                }
                return newInventory;
            });
        }
    };

    // Debug selectedTile changes
    useEffect(() => {
        // Removed debugging log
    }, [selectedTile]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8">
                <div className="bg-black/70 border border-amber-800 rounded-lg p-6 max-w-lg text-center text-amber-100 text-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-white mb-4">Exploring the lands of Valoreth</h2>
                    <p>
                        In the mystical realm of Valoreth, King Necrion sought treasures of growth.<br />
                        Through ancient forests and crystal caves he wandered,<br />
                        Each terrain revealing new mysteries and hidden wisdom.<br />
                        Will you follow his path and claim your destiny?<br />
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
                        {/* Main Action Buttons - Always visible */}
                        <div className="flex items-center gap-2 overflow-x-auto flex-nowrap md:gap-3 md:overflow-visible overflow-visible p-2" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <Button
                                variant={gameMode === 'move' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setGameMode('move')}
                                className={cn(
                                    "flex items-center gap-2 min-w-[44px] min-h-[44px]",
                                    gameMode === 'move'
                                        ? "bg-blue-500 text-white hover:bg-blue-600"
                                        : "bg-gray-800 text-white hover:bg-gray-700 border-gray-600"
                                )}
                                aria-label="movement-mode-button"
                            >
                                <Move className="w-4 h-4" />
                                <span className="hidden md:inline">Move</span>
                            </Button>
                            <Button
                                variant={gameMode === 'build' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setGameMode('build')}
                                className={cn(
                                    "flex items-center gap-2 min-w-[44px] min-h-[44px]",
                                    gameMode === 'build'
                                        ? "bg-amber-500 text-white hover:bg-amber-600"
                                        : "bg-gray-800 text-white hover:bg-gray-700 border-gray-600"
                                )}
                                aria-label="build-mode-button"
                            >
                                <Hammer className="w-4 h-4" />
                                <span className="hidden md:inline">Build</span>
                            </Button>
                            <Button
                                variant={gameMode === 'destroy' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setGameMode('destroy')}
                                className={cn(
                                    "flex items-center gap-2 min-w-[44px] min-h-[44px]",
                                    gameMode === 'destroy'
                                        ? "bg-red-500 text-white hover:bg-red-600"
                                        : "bg-gray-800 text-white hover:bg-gray-700 border-gray-600"
                                )}
                                aria-label="destroy-mode-button"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden md:inline">Destroy</span>
                            </Button>
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
                                        <span className="hidden sm:inline">Expand</span>
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
                            {/* Inventory Button */}
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

                            {/* Kebab Menu for Secondary Actions */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-2 min-w-[44px] min-h-[44px]"
                                        aria-label="more-actions-menu"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                        <span className="hidden sm:inline">More</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={handleResetMap} className="flex items-center gap-2">
                                        <Trash2 className="w-4 h-4" />
                                        Reset Map
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleResetPosition} className="flex items-center gap-2">
                                        <RotateCcw className="w-4 h-4" />
                                        Reset Position
                                    </DropdownMenuItem>
                                    {/* Auto Save Toggle */}
                                    <div className="px-2 py-1.5">
                                        <div className="flex items-center space-x-2">
                                            <Switch id="auto-save-switch-menu" checked={autoSave} onCheckedChange={setAutoSave} />
                                            <label htmlFor="auto-save-switch-menu" className="text-sm">Auto Save</label>
                                        </div>
                                    </div>
                                    {/* Manual Sync Button */}
                                    {pendingSyncCount > 0 && (
                                        <DropdownMenuItem onClick={syncPendingTilePlacements} className="flex items-center gap-2 text-amber-400">
                                            <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                                            Sync ({pendingSyncCount})
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Network Status Indicator */}
                {!isOnline && (
                    <div className="bg-red-900/80 border border-red-600 text-white px-4 py-2 text-sm text-center z-20">
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                            <span>Offline Mode - Tile placements will be saved locally and synced when connection is restored</span>
                            {pendingSyncCount > 0 && (
                                <span className="bg-red-600 px-2 py-1 rounded text-xs">
                                    {pendingSyncCount} pending
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {isOnline && pendingSyncCount > 0 && (
                    <div className="bg-amber-900/80 border border-amber-600 text-white px-4 py-2 text-sm text-center z-20">
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                            <span>Syncing {pendingSyncCount} pending tile placements...</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={syncPendingTilePlacements}
                                className="h-6 px-2 text-xs bg-amber-700 border-amber-500 text-white hover:bg-amber-600"
                            >
                                Retry Now
                            </Button>
                        </div>
                    </div>
                )}

                {/* Debug Network Status (only show in development) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="bg-gray-800/80 border border-gray-600 text-gray-300 px-4 py-2 text-xs text-center z-20">
                        <div className="flex items-center justify-center gap-4">
                            <span>Network: {networkStatus}</span>
                            <span>Online: {isOnline ? 'Yes' : 'No'}</span>
                            <span>Pending: {pendingSyncCount}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    // Removed debugging logs
                                }}
                                className="h-6 px-2 text-xs bg-gray-700 border-gray-500 text-gray-300 hover:bg-gray-600"
                            >
                                Debug
                            </Button>
                        </div>
                    </div>
                )}
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
                <div className="fixed inset-0 top-[60px] left-0 right-0 bottom-0 z-10 bg-gray-900">
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
                                    // Update the inventoryAsItems state directly
                                    setInventoryAsItems(newTiles);

                                    // Also update the inventory state for compatibility
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
                                <DialogDescription>You descend into a damp, torch-lit dungeon. Echoes bounce from the walls. A voice from the shadows challenges you to a battle of wit and lore.<br />&quot;Is the next number higher or lower?&quot;</DialogDescription>
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
                                <DialogDescription>You find yourself at a fork deep in the heart of a shadowy cave. Three paths lie before you, each whispering fate in a different tone.<br />&quot;Which path do you choose, brave adventurer?&quot;</DialogDescription>
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
