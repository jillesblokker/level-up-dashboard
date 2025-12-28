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
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, Hammer, Move, Package, Trash2, RotateCcw, PlusCircle, MoreVertical, Users, Compass, Tent, ShieldCheck, Crown } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter, useSearchParams } from 'next/navigation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { DungeonModal } from "@/components/dungeon-modal"
import { gainGold } from '@/lib/gold-manager'
import { gainExperience } from '@/lib/experience-manager'
import { useCreatureStore } from '@/stores/creatureStore'
import { generateMysteryEvent, handleEventOutcome } from '@/lib/mystery-events'
import { cn } from "@/lib/utils"
import { setUserPreference } from "@/lib/user-preferences-manager"

import dynamic from 'next/dynamic';
import { getUserScopedItem, setUserScopedItem } from '@/lib/user-scoped-storage';
import { getCharacterStats, updateCharacterStats, fetchFreshCharacterStats } from '@/lib/character-stats-service';
import { MonsterSpawn, MonsterType } from '@/types/monsters';
import { checkMonsterSpawn, spawnMonsterOnTile, getMonsterAchievementId } from '@/lib/monster-spawn-manager';
import { RealmAnimationWrapper } from '@/components/realm-animation-wrapper';
import { HeaderSection } from '@/components/HeaderSection';
import { PageGuide } from '@/components/page-guide';

// Import realm utilities and constants
import {
    GRID_COLS,
    INITIAL_ROWS,
    EXPANSION_INCREMENT,
    defaultTile,
    getTileImage,
    createBaseGrid,
    INITIAL_POS
} from './realm-utils';

// Import new custom hooks
import { useRealmAnimals } from '@/hooks/use-realm-animals';
import { useRealmPassiveRewards } from '@/hooks/use-realm-passive-rewards';
import { useRealmGridManager } from '@/hooks/use-realm-grid-manager';
import { useRealmInventory } from '@/hooks/use-realm-inventory';

// Import new data loaders hook
import { useDataLoaders } from '@/hooks/use-data-loaders';
import { useAchievementUnlock } from '@/hooks/use-achievement-unlock';

import { useSound, SOUNDS } from "@/lib/sound-manager"


// Dynamic imports for performance optimization
const RevealOverlay = dynamic(() => import('../reveal/page'), {
    ssr: false,
    loading: () => null // No loading state needed
});
const MonsterBattle = dynamic(() => import('@/components/monster-battle').then(mod => ({ default: mod.MonsterBattle })), {
    ssr: false,
    loading: () => null
});
// Import the ErrorBoundary component
import { ErrorBoundary } from "@/components/error-boundary-component";


const EnterLocationModal = dynamic(() => import('@/components/enter-location-modal').then(mod => ({ default: mod.EnterLocationModal })), {
    ssr: false
});

const AnimalInteractionModal = dynamic(() => import('@/components/animal-interaction-modal').then(mod => ({ default: mod.AnimalInteractionModal })), {
    ssr: false
});

// Utilities and constants (GRID_COLS, INITIAL_ROWS, defaultTile, etc.) moved to realm-utils.ts

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

// (Helper getAdjacentPositions moved to realm-utils.ts)

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
// (Moved to realm-utils.ts)

export default function RealmPage() {
    return (
        <React.Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading realm...</div>}>
            <RealmPageContent />
        </React.Suspense>
    );
}

function RealmPageContent() {
    const { toast } = useToast();
    const { user, isLoaded: isClerkLoaded } = useUser();
    const { getToken } = useAuth();
    const userId = user?.id;
    const searchParams = useSearchParams();
    const visitUserId = searchParams?.get('visit');
    const isVisiting = !!visitUserId && visitUserId !== userId;
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
    const { playSound } = useSound();

    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // --- Realm State Management via Hooks ---
    const {
        grid, setGrid,
        isLoading,
        saveStatus,
        characterPosition, setCharacterPosition,
        expansions, expandMap,
        autoSave, setAutoSave,
        gridInitialized,
        userPlacedTilesRef,
        recordTilePlacement
    } = useRealmGridManager(userId, isMounted);

    const {
        inventory,
        inventoryAsItems,
        setInventoryAsItems,
        updateTileQuantity
    } = useRealmInventory(userId, isMounted);

    // Animal interaction modal state
    const [animalInteractionModal, setAnimalInteractionModal] = useState<{
        isOpen: boolean;
        animalType: 'horse' | 'sheep' | 'penguin' | 'eagle';
        animalName: string;
    } | null>(null);

    const {
        horsePos, eaglePos, isHorsePresent, isPenguinPresent, penguinPos,
        sheepPos, isSheepPresent, horseCaught, sheepCaught, penguinCaught,
        handleAnimalInteraction
    } = useRealmAnimals(grid, isMounted, characterPosition, setAnimalInteractionModal);

    const {
        passiveRewards,
        handleCollectRewards
    } = useRealmPassiveRewards(grid, isMounted);

    // Track visit for New Player Checklist
    useEffect(() => {
        if (user) {
            setUserPreference('onboarding_realm_visited', true)
        }
    }, [user])

    const [showInventory, setShowInventory] = useState(false);
    const [selectedTile, setSelectedTile] = useState<TileInventoryItem | null>(null);
    const [gameMode, setGameMode] = useState<'build' | 'move' | 'destroy'>('move');
    const [hasVisitedRealm, setHasVisitedRealm] = useState(false);
    const [modalState, setModalState] = useState<{ isOpen: boolean; locationType: 'city' | 'town'; locationName: string } | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldRevealImage, setShouldRevealImage] = useState(false);

    const [isIntroPlaying, setIsIntroPlaying] = useState(true);

    // Monster battle state
    const [battleOpen, setBattleOpen] = useState(false);
    const [currentMonster, setCurrentMonster] = useState<MonsterType>('dragon');

    // Tile size state for animal positioning
    const [tileSize, setTileSize] = useState(80);

    const [castleEvent, setCastleEvent] = useState<{ open: boolean, result?: string, reward?: string } | null>(null);
    const [dungeonEvent, setDungeonEvent] = useState<{ open: boolean, questionIndex: number, score: number, prevNumber: number, questions: { fact: string, number: number }[], result?: string } | null>(null);
    const [caveEvent, setCaveEvent] = useState<{ open: boolean, result?: string } | null>(null);
    const [mysteryEvent, setMysteryEvent] = useState<{ open: boolean, event: any, choice?: string } | null>(null);
    const [castleDiceRolling, setCastleDiceRolling] = useState(false);
    const [castleDiceValue, setCastleDiceValue] = useState<number | null>(null);
    const [lastMysteryTile, setLastMysteryTile] = useState<{ x: number; y: number } | null>(null);
    const [mysteryEventCompleted, setMysteryEventCompleted] = useState(false);
    const [characterStats, setCharacterStats] = useState({ gold: 0, level: 1, experience: 0 });
    const [monsters, setMonsters] = useState<MonsterSpawn[]>([]);
    const [monsterEvent, setMonsterEvent] = useState<{ open: boolean; monster: MonsterSpawn | null }>({ open: false, monster: null });


    useEffect(() => {
        // Load initial stats
        const stats = getCharacterStats();
        if (stats) setCharacterStats(stats);

        // Fetch fresh stats from server
        if (userId) {
            fetchFreshCharacterStats().then(freshStats => {
                if (freshStats) setCharacterStats(freshStats);
            });
        }
    }, [userId]);

    // Load monsters
    useEffect(() => {
        if (!isClerkLoaded || !user) return;

        const fetchMonsters = async () => {
            try {
                const res = await fetch('/api/monster-spawns');
                const data = await res.json();
                if (data.success) {
                    setMonsters(data.data);
                }
            } catch (error) {
                console.error('Error fetching monsters:', error);
            }
        };
        fetchMonsters();

        // Listen for spawn events
        window.addEventListener('monster-spawned', fetchMonsters);
        return () => window.removeEventListener('monster-spawned', fetchMonsters);
    }, [isClerkLoaded, user]);

    const handleMonsterClick = (monster: MonsterSpawn) => {
        setMonsterEvent({ open: true, monster });
    };

    const handleBattleComplete = async (won: boolean, goldEarned: number, xpEarned: number) => {
        if (won && monsterEvent.monster) {
            const currentMonsterId = monsterEvent.monster.id;
            // Mark as defeated
            try {
                await fetch('/api/monster-spawn', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: currentMonsterId, defeated: true })
                });
                // Remove from local state
                setMonsters(prev => prev.filter(m => m.id !== currentMonsterId));
                playSound(SOUNDS.BATTLE_WIN);
                toast({
                    title: "Monster Defeated!",
                    description: "The realm is safer now.",
                });
            } catch (error) {
                console.error("Error marking monster defeated:", error);
            }
        }
        setMonsterEvent({ open: false, monster: null });
    };

    // Mystery tile transformation effect
    useEffect(() => {
        if (mysteryEventCompleted && lastMysteryTile) {
            setGrid(prev => {
                const next = prev.map(row => [...row]);
                const x = lastMysteryTile.x;
                const y = lastMysteryTile.y;
                if (next[y]?.[x]) {
                    next[y][x] = { ...defaultTile('grass'), x, y, id: `grass-${x}-${y}`, revealed: true };
                }
                return next;
            });
            setMysteryEventCompleted(false);
            setLastMysteryTile(null);
        }
    }, [mysteryEventCompleted, lastMysteryTile, setGrid]);
    const [inventoryTab, setInventoryTab] = useState<'place' | 'buy'>('place');
    const closeBtnRef = useRef<HTMLButtonElement>(null);


    // State Refs for Event Listeners and Handlers to avoid stale closures
    const gameModeRef = useRef(gameMode);
    const characterPositionRef = useRef(characterPosition);
    const gridRef = useRef(grid);
    const showInventoryRef = useRef(showInventory);
    const selectedTileRef = useRef(selectedTile);
    const inventoryRef = useRef(inventory);
    const monstersRef = useRef(monsters);

    // Keep Refs synced with state
    useEffect(() => {
        gameModeRef.current = gameMode;
        characterPositionRef.current = characterPosition;
        gridRef.current = grid;
        showInventoryRef.current = showInventory;
        selectedTileRef.current = selectedTile;
        inventoryRef.current = inventory;
        monstersRef.current = monsters;
    }, [gameMode, characterPosition, grid, showInventory, selectedTile, inventory, monsters]);

    // Handler for tile size changes from MapGrid
    const handleTileSizeChange = useCallback((newTileSize: number) => {
        setTileSize(newTileSize);
    }, []);

    // --- Interaction Handlers ---
    // (Local handlers moved to hooks)


    // Place tile: update grid and send only the changed tile to backend
    const handlePlaceTile = async (x: number, y: number) => {
        const currentGrid = gridRef.current;
        const currentGameMode = gameModeRef.current;
        const currentSelectedTile = selectedTileRef.current;
        const currentInventory = inventoryRef.current;

        // Check for monster battle first (regardless of game mode)
        const clickedTile = currentGrid[y]?.[x];
        if (clickedTile?.hasMonster) {
            setCurrentMonster(clickedTile.hasMonster);
            setBattleOpen(true);
            return;
        }

        // Handle movement if in move mode
        if (currentGameMode === 'move') {
            handleCharacterMove(x, y);
            return;
        }

        // Handle tile destruction if in destroy mode
        if (currentGameMode === 'destroy') {
            handleDestroyTile(x, y);
            return;
        }

        if (currentGameMode !== 'build' || !currentSelectedTile) {
            // Removed debugging log
            return;
        }

        // Check if we have the tile in inventory (either from main inventory or selectedTile)
        const tileToPlace = currentInventory[currentSelectedTile.type];
        const hasTileInInventory = tileToPlace && (tileToPlace.owned ?? 0) > 0;
        const hasTileInSelected = currentSelectedTile && (currentSelectedTile.quantity ?? 0) > 0;

        if (!hasTileInInventory && !hasTileInSelected) {
            toast({
                title: "📦 Empty Inventory",
                description: "Your tile pouch is empty! Visit the market to restock your building materials.",
                variant: "destructive",
            });
            return;
        }

        // Use the selectedTile if it has quantity, otherwise fall back to inventory
        const tileToUse = hasTileInSelected ? currentSelectedTile : tileToPlace;

        // Optimistically update the UI first
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => row.slice());
            if (newGrid[y]?.[x]) {
                newGrid[y][x] = { ...tileToUse, x, y, owned: 1 };
            }
            return newGrid;
        });

        // Update inventory and placement counts via hooks
        const tileType = currentSelectedTile.type;
        const userPlacedKey = `${tileType}_tiles_placed`;
        updateTileQuantity(tileType, -1);
        recordTilePlacement(tileType);

        console.log('[Realm] User placed tile:', tileType, 'Total:', userPlacedTilesRef.current[userPlacedKey]);

        // Update selectedTile quantity if it has one
        if (hasTileInSelected && currentSelectedTile.quantity !== undefined) {
            setSelectedTile(prev => prev ? { ...prev, quantity: Math.max(0, prev.quantity - 1) } : null);
        }

        // Save tile to backend
        try {
            const tileTypeNum = tileTypeToNumeric[tileType];
            const res = await fetch('/api/realm-tiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y, tile_type: tileTypeNum })
            });

            if (!res.ok) {
                // Revert
                updateTileQuantity(tileType, 1);
                setGrid(prev => {
                    const next = [...prev];
                    if (next[y] && clickedTile) next[y][x] = clickedTile as Tile;
                    return next;
                });
                toast({ title: 'Error', description: 'Failed to place tile', variant: 'destructive' });
            } else {
                // Determine the new grid state for saving and spawning checks
                const updatedGrid = currentGrid.map(row => row.map(t => ({ ...t })));
                if (updatedGrid[y]?.[x]) {
                    updatedGrid[y][x] = { ...tileToUse, x, y, owned: 1 };
                }

                // Immediately save the full grid state
                if (userId) {
                    saveGridData(userId, updatedGrid).catch(e => console.error('Failed to background save grid:', e));
                }

                // Immediately save the full grid state
                if (userId) {
                    saveGridData(userId, updatedGrid).catch(e => console.error('Failed to background save grid:', e));
                }

                const spawnResult = checkMonsterSpawn(updatedGrid, tileType, monstersRef.current);
                if (spawnResult.shouldSpawn && spawnResult.position && spawnResult.monsterType) {
                    const success = spawnMonsterOnTile(currentGrid, spawnResult.position.x, spawnResult.position.y, spawnResult.monsterType as any);
                    if (success) {
                        playSound(SOUNDS.MONSTER_SPAWN);
                        toast({ title: "Monster Appeared!", description: `A ${spawnResult.monsterType} has appeared!` });

                        // Add to UI state optimistically
                        setMonsters(prev => [
                            ...prev,
                            {
                                id: 'temp-' + Date.now(), // Temporary ID until refresh, but functionality holds
                                user_id: userId || '',
                                x: spawnResult.position!.x,
                                y: spawnResult.position!.y,
                                monster_type: spawnResult.monsterType!,
                                spawned_at: new Date().toISOString(),
                                defeated: false,
                                reward_claimed: false
                            }
                        ]);

                        // Add to grid state (legacy support if needed by other components)
                        setGrid(prev => {
                            const next = [...prev];
                            const tile = next[spawnResult.position!.y]?.[spawnResult.position!.x];
                            if (tile) {
                                tile.hasMonster = spawnResult.monsterType as MonsterType;
                                tile.monsterAchievementId = getMonsterAchievementId(spawnResult.monsterType as MonsterType);
                            }
                            return next;
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Error placing tile:', err);
        }
    };

    const handleCharacterMove = (x: number, y: number) => {
        const currentGameMode = gameModeRef.current; // Use ref!
        const currentGrid = gridRef.current;

        if (currentGameMode === 'move') {
            // Check if the target tile is walkable
            const targetTile = currentGrid[y]?.[x];

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

            setCharacterPosition(x, y);
        }
    };

    const handleTileSelection = (tile: TileInventoryItem | null) => {
        // Check if tile can be selected - either from main inventory (owned) or from tile itself (quantity)
        const hasMainInventory = tile?.type && inventory[tile.type] && (inventory[tile.type].owned ?? 0) > 0;
        const hasTileQuantity = tile && (tile.quantity ?? 0) > 0;

        if (hasMainInventory || hasTileQuantity) {
            setSelectedTile(tile);
            setGameMode('build');
        } else {
            setSelectedTile(null);
        }
    };

    const handleDestroyTile = async (x: number, y: number) => {
        const targetTile = grid[y]?.[x];
        if (!targetTile || targetTile.type === 'empty') return;

        // Don't allow destroying certain protected tiles
        if (['mountain', 'water', 'lava', 'volcano'].includes(targetTile.type)) {
            toast({
                title: "⛰️ Immovable Force",
                description: `The ${targetTile.type} resists your power!`,
                variant: "destructive",
            });
            return;
        }

        if (!window.confirm(`Are you sure you want to destroy this ${targetTile.type} tile?`)) return;

        const originalTile = { ...targetTile };

        // Optimistic update
        setGrid(prev => {
            const next = [...prev];
            if (next[y]) next[y][x] = { ...defaultTile('empty'), x, y, id: `empty-${x}-${y}` };
            return next;
        });

        try {
            const res = await fetch('/api/realm-tiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y, tile_type: 0 })
            });

            if (!res.ok) throw new Error('Failed to delete tile');

            toast({ title: "💥 Devastated!", description: "The tile has been removed." });
        } catch (err) {
            setGrid(prev => {
                const next = [...prev];
                if (next[y]) next[y][x] = originalTile;
                return next;
            });
            toast({ title: 'Error', description: 'Failed to delete tile', variant: 'destructive' });
        }
    };


    // --- Helper Functions and Side Effects ---
    const nextExpansionLevel = (expansions + 1) * 5;
    const canExpand = characterStats.level >= nextExpansionLevel;

    // Handler to reset the map to the initial grid
    const handleResetMap = async () => {
        if (!window.confirm("Are you sure you want to reset your entire realm? This cannot be undone!")) return;
        try {
            const token = await getToken({ template: 'supabase' });
            const res = await fetch('/api/realm-tiles/reset', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
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
                if (!showInventoryRef.current) {
                    setShowInventory(true);
                    toast({
                        title: 'Inventory Opened',
                        description: 'Tile inventory opened (press "i" to open)',
                    });
                }
                return;
            }

            // STRICT MODE CHECK: Only allow movement in 'move' mode
            if (gameModeRef.current !== 'move') {
                return;
            }

            const currentPos = characterPositionRef.current;
            const currentGrid = gridRef.current;
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
                    newY = Math.min(currentGrid.length - 1, currentPos.y + 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    newX = Math.max(0, currentPos.x - 1);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    newX = Math.min((currentGrid[0]?.length ?? 0) - 1, currentPos.x + 1);
                    break;
                default:
                    return;
            }

            // Check if the target tile is walkable
            const targetTile = currentGrid[newY]?.[newX];

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
                setCharacterPosition(newX, newY);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toast, setCharacterPosition, setShowInventory]); // Minimal dependencies

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
                    // Shuffle and pick 5 questions
                    const shuffledRequestions = [...questions].sort(() => 0.5 - Math.random());
                    const selectedQuestions = shuffledRequestions.slice(0, 5);
                    if (selectedQuestions.length > 0 && selectedQuestions[0]) {
                        setDungeonEvent({ open: true, questionIndex: 0, score: 0, prevNumber: selectedQuestions[0].number, questions: selectedQuestions });
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
    }, [characterPosition, grid, toast, setModalState, setCastleEvent, setDungeonEvent, setCaveEvent, setMysteryEvent, setLastMysteryTile]);

    const handleResetPosition = () => {
        setCharacterPosition(INITIAL_POS.x, INITIAL_POS.y);
        toast({
            title: "Position Reset",
            description: `Character position reset to center`,
        });
    };

    useEffect(() => {
        if (!isLoading && grid.length && characterPosition) {
            const tile = grid[characterPosition.y]?.[characterPosition.x];
            if (!tile || ['mountain', 'water', 'lava', 'volcano'].includes(tile.type)) {
                setCharacterPosition(INITIAL_POS.x, INITIAL_POS.y);
            }
        }
    }, [isLoading, grid, characterPosition, setCharacterPosition]);

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


    const handleDeleteTile = async (x: number, y: number) => {
        const targetTile = grid[y]?.[x];
        if (!targetTile || targetTile.type === 'empty') return;

        if (!window.confirm(`Are you sure you want to destroy this ${targetTile.type} tile?`)) return;

        const originalTile = { ...targetTile };

        // Optimistic update
        setGrid(prev => {
            const next = [...prev];
            if (next[y]) next[y][x] = { ...defaultTile('empty'), x, y, id: `empty-${x}-${y}` };
            return next;
        });

        try {
            const res = await fetch('/api/realm-tiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y, tile_type: 0 })
            });

            if (!res.ok) {
                throw new Error('Failed to delete tile');
            }
            toast({ title: "💥 Devastated!", description: "The tile has been removed." });
        } catch (err) {
            // Revert
            setGrid(prev => {
                const next = [...prev];
                if (next[y]) next[y][x] = originalTile;
                return next;
            });
            toast({ title: 'Error', description: 'Failed to delete tile', variant: 'destructive' });
        }
    };

    // Debug selectedTile changes
    useEffect(() => {
        // Removed debugging log
    }, [selectedTile]);

    if (!isMounted) return null;

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
        <div className={cn(
            "relative min-h-screen"
        )}>
            {isVisiting && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 text-white px-6 py-3 rounded-2xl border-2 border-amber-500/30 backdrop-blur-xl shadow-[0_0_40px_rgba(245,158,11,0.15)] flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                        <Users className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold tracking-wider text-sm text-amber-400 italic">ENVOY MODE</span>
                        <span className="text-xs text-amber-200/60 font-medium">Exploring Ally&apos;s Realm</span>
                    </div>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="h-9 px-4 rounded-xl bg-amber-600 text-black hover:bg-amber-500 border-none ml-2 font-bold"
                        onClick={() => router.push('/allies')}
                    >
                        Return Home
                    </Button>
                </div>
            )}
            <RevealOverlay />
            <HeaderSection
                title={isVisiting ? "Ally Realm" : "Realm"}
                subtitle={isVisiting ? "Observing a fellow pioneer's journey" : "Explore and build your mystical realm"}
                imageSrc="/images/realm-header.jpg"
                defaultBgColor="bg-blue-900"
                onAnimationStart={() => setIsAnimating(true)}
                onAnimationEnd={() => {
                    setIsAnimating(false);
                    // Unlock interactions only after header is fully revealed (1.5s duration)
                    setTimeout(() => setIsIntroPlaying(false), 1500);
                }}
                shouldRevealImage={true}
                guideComponent={
                    <PageGuide
                        title="Realm"
                        subtitle="Pioneer a mystical world beyond your borders"
                        sections={[
                            {
                                title: "Exploration Mode",
                                icon: Compass,
                                content: "Switch to 'Move' mode to navigate the realm. Discover hidden secrets, rare resources, and mystical events as you uncover the fog."
                            },
                            {
                                title: "Mystical Building",
                                icon: Tent,
                                content: "Use 'Build' mode to place mystical tiles. Different tiles require specific ingredients and can grant unique bonuses to your kingdom."
                            },
                            {
                                title: "Survival & Combat",
                                icon: ShieldCheck,
                                content: "The realm is dangerous! Monsters may spawn as you explore. Ensure your character is equipped with strong gear from your inventory to survive battles."
                            }
                        ]}
                    />
                }
            />
            <RealmAnimationWrapper
                isAnimating={isAnimating}
                onImageReveal={setShouldRevealImage}
            >
                {/* Top Toolbar */}
                {!isVisiting && (
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
                                        <div className="flex items-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={expandMap}
                                                disabled={!canExpand}
                                                aria-label="Expand Map"
                                                className={cn(
                                                    "flex items-center gap-2 min-w-[44px] min-h-[44px]",
                                                    !canExpand && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <PlusCircle className="w-4 h-4" />
                                                <span className="hidden sm:inline">Expand</span>
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="top"
                                        className="bg-gray-900 text-white border-amber-800/30"
                                    >
                                        {canExpand
                                            ? "Expand your realm map to unlock 3 more rows"
                                            : `Reach level ${nextExpansionLevel} to expand further (Current: ${characterStats.level})`}
                                    </TooltipContent>
                                </Tooltip>

                                {selectedTile && (
                                    <div className="hidden sm:flex items-center gap-3 bg-gray-900 border border-amber-500/30 rounded-lg px-3 py-1 mr-1 shadow-inner shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex flex-col items-start min-w-[60px]">
                                            <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Selected</span>
                                            <span className="text-xs font-bold text-amber-400 truncate max-w-[100px]">{selectedTile.name}</span>
                                        </div>
                                        <div className="h-6 w-px bg-gray-700 mx-1"></div>
                                        <div className="text-xs font-mono text-gray-300">
                                            x{selectedTile.quantity ?? 0}
                                        </div>
                                    </div>
                                )}

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
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
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
                        sheepCaught={sheepCaught}
                        penguinCaught={penguinCaught}
                        monsters={monsters}
                        onMonsterClick={handleMonsterClick}
                    />
                </div>
                {/* Overlay Inventory Panel */}
                <Sheet open={showInventory} onOpenChange={setShowInventory} modal={false}>
                    <SheetContent side="right" className="w-full sm:w-[500px] bg-gray-900/95 border-gray-700 p-0 overflow-hidden flex flex-col z-[50]">
                        <SheetHeader className="px-6 py-4 border-b border-gray-800 bg-gray-900 text-left shrink-0">
                            <SheetTitle className="text-2xl font-medieval text-amber-500 flex items-center gap-2">
                                <span className="text-3xl">🏰</span>
                                Realm Inventory
                            </SheetTitle>
                            <SheetDescription className="text-gray-400">
                                Manage your tiles and expanded territory.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 overflow-hidden p-0 relative min-h-0">
                            <ErrorBoundary componentName="TileInventory">
                                <TileInventory
                                    tiles={Array.isArray(inventoryAsItems) ? inventoryAsItems : []}
                                    selectedTile={selectedTile}
                                    onSelectTile={handleTileSelection}
                                    onUpdateTiles={setInventoryAsItems}
                                    activeTab={inventoryTab}
                                    setActiveTab={setInventoryTab}
                                    onOutOfTiles={(tile) => setInventoryTab('buy')}
                                />
                            </ErrorBoundary>
                        </div>
                    </SheetContent>
                </Sheet>

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
                    <DungeonModal
                        isOpen={dungeonEvent.open}
                        onClose={() => setDungeonEvent(null)}
                        questions={dungeonEvent.questions}
                    />
                )}

                {monsterEvent.open && monsterEvent.monster && (
                    <MonsterBattle
                        isOpen={monsterEvent.open}
                        onClose={() => setMonsterEvent({ open: false, monster: null })}
                        monsterType={monsterEvent.monster.monster_type}
                        onBattleComplete={handleBattleComplete}
                    />
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
                                                setMysteryEventCompleted(true);
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
                    onBattleComplete={(won, gold, xp) => {
                        if (won) {
                            toast({ title: "Victory!", description: `Defeated the monster! +${gold} Gold, +${xp} XP` });
                            // Update grid
                            setGrid(prev => {
                                const next = [...prev];
                                const tile = next[characterPosition.y]?.[characterPosition.x];
                                if (tile) {
                                    tile.hasMonster = undefined;
                                    tile.monsterAchievementId = undefined;
                                }
                                return next;
                            });
                        } else {
                            toast({ title: "Defeat", description: "The monster was too strong!", variant: "destructive" });
                        }
                    }}
                />

                {/* Passive Rewards Treasury UI */}
                {passiveRewards && (passiveRewards.gold > 0 || passiveRewards.xp > 0) && (
                    <div className="fixed top-24 right-4 z-40 animate-in slide-in-from-right-5 fade-in duration-500">
                        <Card className="bg-gradient-to-br from-gray-900 to-amber-950/80 border-amber-500/50 shadow-xl shadow-amber-900/20 backdrop-blur-md w-64 overflow-hidden group hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-50 animate-pulse" />
                            <CardContent className="p-4 relative">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-amber-400 text-sm uppercase tracking-wider flex items-center gap-2">
                                        <Crown className="w-4 h-4" /> Treasury
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-amber-200">
                                        <span className="text-xs text-amber-400/80">Taxes Collected</span>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="flex-1 bg-black/40 rounded p-2 border border-amber-500/20 flex flex-col items-center">
                                            <span className="text-xl font-bold text-amber-400">{passiveRewards.gold}</span>
                                            <span className="text-[10px] text-amber-500/70 uppercase">Gold</span>
                                        </div>
                                        <div className="flex-1 bg-black/40 rounded p-2 border border-blue-500/20 flex flex-col items-center">
                                            <span className="text-xl font-bold text-blue-400">{passiveRewards.xp}</span>
                                            <span className="text-[10px] text-blue-500/70 uppercase">XP</span>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold border-t border-white/20 shadow-lg active:scale-95 transition-all"
                                        onClick={handleCollectRewards}
                                    >
                                        Collect Taxes
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </RealmAnimationWrapper>
        </div >
    );
}
