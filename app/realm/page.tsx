"use client"

import { logger } from "@/lib/logger";

import { useEffect, useState, useCallback, useRef } from "react"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Tile, TileType, Tile as TileInventoryItem } from '@/types/core-interfaces'
import { MapGrid } from '../components/MapGrid'
import { TileInventory } from '@/components/tile-inventory'
import { Switch } from "@/components/ui/switch"
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@clerk/nextjs'
import React from "react"
import { createTileFromNumeric, numericToTileType, tileTypeToNumeric } from "@/lib/grid-loader"
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, Hammer, Move, Package, Trash2, RotateCcw, PlusCircle, MoreVertical, Users, Compass, Tent, ShieldCheck, Crown, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter, useSearchParams } from 'next/navigation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { DungeonModal } from "@/components/dungeon-modal"
import { RealmEventModal } from '@/components/realm-event-modal'
import { gainGold } from '@/lib/gold-manager'
import { gainExperience } from '@/lib/experience-manager'
import { useCreatureStore } from '@/stores/creatureStore'
import { generateMysteryEvent, handleEventOutcome } from '@/lib/mystery-events'
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { setUserPreference } from "@/lib/user-preferences-manager"

import dynamic from 'next/dynamic';
import { getUserScopedItem, setUserScopedItem } from '@/lib/user-scoped-storage';
import { getCharacterStats, updateCharacterStats, fetchFreshCharacterStats } from '@/lib/character-stats-service';
import { addToInventory } from '@/lib/inventory-manager';
import { addTileToInventory } from '@/lib/tile-inventory-manager';
import { MonsterSpawn, MonsterType } from '@/types/monsters';
import { checkMonsterSpawn, spawnMonsterOnTile, getMonsterAchievementId } from '@/lib/monster-spawn-manager';
import { RealmAnimationWrapper } from '@/components/realm-animation-wrapper';
import { HeaderSection } from '@/components/HeaderSection';
import { PageGuide } from '@/components/page-guide';
import { LoadingScreen } from '@/components/loading-screen';
import RealmLoading from './loading';


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
import { useWeather } from '@/hooks/use-weather';

import { useSound, SOUNDS } from "@/lib/sound-manager"
import { TEXT_CONTENT } from "@/lib/text-content"


// Dynamic imports for performance optimization


const MonsterBattle = dynamic(() => import('@/components/monster-battle').then(mod => ({ default: mod.MonsterBattle })), {
    ssr: false,
    loading: () => null
});
// Import the ErrorBoundary component
import { MedievalErrorBoundary } from "@/components/medieval-error-boundary";


const EnterLocationModal = dynamic(() => import('@/components/enter-location-modal').then(mod => ({ default: mod.EnterLocationModal })), {
    ssr: false
});
const MysteryEventModal = dynamic(() => import('@/components/mystery-event-modal').then(mod => ({ default: mod.MysteryEventModal })), {
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
        logger.error('Failed to load initial grid from CSV, using default:', error);
        return createBaseGrid();
    }
};

// (Helper getAdjacentPositions moved to realm-utils.ts)

function assignTile(row: Tile[], x: number, tile: Tile) {
    row[x] = {
        ...tile,
        type: 'grass',
        name: 'Grass',
        image: '/images/tiles/grass-tile.webp',
        isVisited: true,
    };
}

// --- Creature achievement requirement mapping ---
// (Moved to realm-utils.ts)

export default function RealmPage() {
    return (
        <React.Suspense fallback={<RealmLoading />}>
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
    const { weather, setWeather } = useWeather();
    const weatherRef = useRef(weather);
    const lastMoveTimeRef = useRef(0);

    // Sync weather ref
    useEffect(() => {
        weatherRef.current = weather;
    }, [weather]);

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
    const [availableFood, setAvailableFood] = useState<any[]>([]);

    const fetchFoodForAnimal = useCallback(async () => {
        try {
            const { fetchWithAuth } = await import('@/lib/fetchWithAuth');
            const res = await fetchWithAuth('/api/inventory?category=food');
            let foodList = [];
            if (res.ok) {
                const data = await res.json();
                foodList = data.data || [];
            }

            // Check tile inventory for Water
            if (userId) {
                const { loadTileInventory } = await import('@/lib/data-loaders');
                const tileInv = await loadTileInventory(userId);
                if (tileInv && typeof tileInv === 'object') {
                    const waterItem = tileInv['water'] || tileInv['material-water'];
                    if (waterItem && waterItem.quantity > 0) {
                        foodList.push({
                            id: 'material-water',
                            name: 'Water',
                            quantity: waterItem.quantity,
                            emoji: '💧'
                        });
                    }
                }
            }

            setAvailableFood(foodList);
        } catch (err) {
            logger.error('Failed to fetch food for animal:', err);
        }
    }, [userId]);

    const handleAnimalFeed = async (animalType: string, itemId: string) => {
        try {
            const defId = animalType === 'sheep' ? '901' : animalType === 'horse' ? '902' : '903';
            const { fetchWithAuth } = await import('@/lib/fetchWithAuth');
            const res = await fetchWithAuth('/api/creatures/interact', {
                method: 'POST',
                body: JSON.stringify({
                    definitionId: defId,
                    action: 'feed',
                    itemId
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast({
                    title: "🍎 Animal Fed!",
                    description: data.message,
                });
                setAnimalInteractionModal(null);
                // Refresh character stats to show buff if we add that later
                window.dispatchEvent(new CustomEvent('character-stats-update'));
            } else {
                toast({ title: "Error", description: "Failed to feed animal", variant: "destructive" });
            }
        } catch (err) {
            logger.error('Error feeding animal:', err);
        }
    };

    useEffect(() => {
        if (animalInteractionModal?.isOpen) {
            fetchFoodForAnimal();
        }
    }, [animalInteractionModal?.isOpen, fetchFoodForAnimal]);

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
    const [shouldRevealImage, setShouldRevealImage] = useState(true);

    const [isIntroPlaying, setIsIntroPlaying] = useState(false);

    // Monster battle state
    const [battleOpen, setBattleOpen] = useState(false);
    const [currentMonster, setCurrentMonster] = useState<MonsterType>('dragon');

    // Tile size state for animal positioning
    const [tileSize, setTileSize] = useState(80);

    const [activeEvent, setActiveEvent] = useState<string | null>(null);
    const [pyramidEvent, setPyramidEvent] = useState<{ open: boolean; success: boolean } | null>(null);
    const [wellEvent, setWellEvent] = useState<{ open: boolean; pact: any; availableHabits: any[]; loading: boolean } | null>(null);
    const [sphinxEvent, setSphinxEvent] = useState<{ open: boolean; blocked: boolean; completedCount: number } | null>(null);
    const prevPositionRef = useRef({ x: INITIAL_POS.x, y: INITIAL_POS.y });

    useEffect(() => {
        if (!grid.length) return;
        const currentTile = grid[characterPosition.y]?.[characterPosition.x];
        if (currentTile && currentTile.type !== 'sphinx-gates') {
            prevPositionRef.current = { x: characterPosition.x, y: characterPosition.y };
        }
    }, [characterPosition, grid]);
    const [castleEvent, setCastleEvent] = useState<{ open: boolean, result?: string, reward?: string } | null>(null);
    const [dungeonEvent, setDungeonEvent] = useState<{ open: boolean, questionIndex: number, score: number, prevNumber: number, questions: { fact: string, number: number }[], result?: string } | null>(null);
    const [caveEvent, setCaveEvent] = useState<{ open: boolean, result?: string } | null>(null);
    const [mysteryEvent, setMysteryEvent] = useState<{ open: boolean, event: any, choice?: string } | null>(null);
    const [castleDiceRolling, setCastleDiceRolling] = useState(false);
    const [castleDiceValue, setCastleDiceValue] = useState<number | null>(null);
    const [lastMysteryTile, setLastMysteryTile] = useState<{ x: number; y: number } | null>(null);
    const [mysteryEventCompleted, setMysteryEventCompleted] = useState(false);
    const [isChestClaiming, setIsChestClaiming] = useState(false);
    const [isPyramidClaiming, setIsPyramidClaiming] = useState(false);
    const [canopyEvent, setCanopyEvent] = useState<{ open: boolean; pact: any; availableHabits: any[]; loading: boolean } | null>(null);
    const [obeliskEvent, setObeliskEvent] = useState<{ open: boolean; alreadyCompleted: boolean; loading: boolean } | null>(null);
    const [fairyRingEvent, setFairyRingEvent] = useState<{ open: boolean; rolled: boolean; rollResult?: number; rewardMessage?: string } | null>(null);
    const [isCanopyClaiming, setIsCanopyClaiming] = useState(false);
    const [isObeliskClaiming, setIsObeliskClaiming] = useState(false);
    const [isFairyClaiming, setIsFairyClaiming] = useState(false);
    const [characterStats, setCharacterStats] = useState({ gold: 0, level: 1, experience: 0 });
    const [monsters, setMonsters] = useState<MonsterSpawn[]>([]);
    const [monsterEvent, setMonsterEvent] = useState<{ open: boolean; monster: MonsterSpawn | null }>({ open: false, monster: null });



    // Achievement catch-up hook
    const { triggerCatchUp } = require('@/hooks/use-achievement-catch-up').useAchievementCatchUp();

    useEffect(() => {
        // Load initial stats
        const stats = getCharacterStats();
        if (stats) setCharacterStats(stats);

        // Fetch fresh stats from server
        if (userId) {
            fetchFreshCharacterStats().then(freshStats => {
                if (freshStats) setCharacterStats(freshStats);
            });
            // Trigger achievement catch-up when visiting realm page
            triggerCatchUp(true);
        }
    }, [userId, triggerCatchUp]);

    // Level 25 Ship Unlock Celebration
    useEffect(() => {
        if (characterStats.level >= 25 && userId) {
            const key = `ship_unlock_shown_${userId}`;
            const shown = localStorage.getItem(key);
            if (!shown) {
                toast({
                    title: "🏴‍☠️ High Seas Unlocked!",
                    description: "Level 25 Reached! You can now traverse Water tiles with your Pirate Ship!",
                    duration: 5000,
                    className: "bg-blue-900 border-2 border-amber-500 text-yellow-100 font-bold"
                });
                playSound('level_up');
                localStorage.setItem(key, 'true');
            }
        }
    }, [characterStats.level, userId, toast, playSound]);

    // Level 25 Ship Unlock Celebration
    useEffect(() => {
        if (characterStats.level >= 25 && userId) {
            const key = `ship_unlock_shown_${userId}`;
            const shown = localStorage.getItem(key);
            if (!shown) {
                toast({
                    title: "🏴‍☠️ High Seas Unlocked!",
                    description: "Level 25 Reached! You can now traverse Water tiles with your Pirate Ship!",
                    duration: 5000,
                    className: "bg-blue-900 border-2 border-amber-500 text-yellow-100 font-bold"
                });
                playSound('level_up'); // Assuming 'level_up' or generic sound exists
                localStorage.setItem(key, 'true');
            }
        }
    }, [characterStats.level, userId, toast, playSound]);

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
                logger.error('Error fetching monsters:', error);
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
            const monsterX = monsterEvent.monster.x;
            const monsterY = monsterEvent.monster.y;

            // Mark as defeated
            try {
                await fetch('/api/monster-spawn', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: currentMonsterId, defeated: true })
                });
                // Remove from local state (Overlay)
                setMonsters(prev => prev.filter(m => m.id !== currentMonsterId));

                // Sync with Grid State (Legacy/Fallback)
                setGrid(prev => {
                    const next = prev.map(row => [...row]);
                    if (next[monsterY]?.[monsterX]) {
                        const tile = next[monsterY][monsterX];
                        if (tile) {
                            tile.hasMonster = undefined;
                            tile.monsterAchievementId = undefined;
                        }
                    }
                    return next;
                });

                playSound(SOUNDS.BATTLE_WIN);
                toast({
                    title: TEXT_CONTENT.realm.toasts.monsterDefeated.title,
                    description: TEXT_CONTENT.realm.toasts.monsterDefeated.desc,
                });
            } catch (error) {
                logger.error("Error marking monster defeated:", error);
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
    const [inventoryTab, setInventoryTab] = useState<'place' | 'buy' | 'guide'>('place');
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
            setCurrentMonster(clickedTile.hasMonster as MonsterType);
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
                title: TEXT_CONTENT.realm.toasts.inventoryEmpty.title,
                description: TEXT_CONTENT.realm.toasts.inventoryEmpty.desc,
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
        checkAchievementProgress('place', tileType);

        logger.debug('[Realm] User placed tile:', tileType, 'Total:', userPlacedTilesRef.current[userPlacedKey]);

        // Update selectedTile quantity if it has one
        if (hasTileInSelected && currentSelectedTile.quantity !== undefined) {
            setSelectedTile(prev => prev ? { ...prev, quantity: Math.max(0, (prev.quantity || 0) - 1) } : null);
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
                    saveGridData(userId, updatedGrid).catch(e => logger.error('Failed to background save grid:', e));
                }

                // Immediately save the full grid state
                if (userId) {
                    saveGridData(userId, updatedGrid).catch(e => logger.error('Failed to background save grid:', e));
                }

                const spawnResult = checkMonsterSpawn(updatedGrid, tileType, monstersRef.current);
                if (spawnResult.shouldSpawn && spawnResult.position && spawnResult.monsterType) {
                    const success = spawnMonsterOnTile(currentGrid, spawnResult.position.x, spawnResult.position.y, spawnResult.monsterType as any);
                    if (success) {
                        playSound(SOUNDS.MONSTER_SPAWN);
                        toast({ title: TEXT_CONTENT.realm.toasts.monsterAppeared.title, description: TEXT_CONTENT.realm.toasts.monsterAppeared.desc.replace("{type}", spawnResult.monsterType!) });

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
            logger.error('Error placing tile:', err);
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

            const blockedTiles = ['mountain', 'lava', 'volcano'];
            if (characterStats.level < 25) blockedTiles.push('water');

            if (targetTile && blockedTiles.includes(targetTile.type)) {
                toast({
                    title: TEXT_CONTENT.realm.toasts.cannotMove.title,
                    description: targetTile.type === 'water' && characterStats.level < 25
                        ? "You need Level 25 to sail!"
                        : TEXT_CONTENT.realm.toasts.cannotMove.desc.replace("{type}", targetTile.type),
                    variant: "destructive",
                });
                return;
            }

            // Check for monster battle
            if (targetTile?.hasMonster) {
                setCurrentMonster(targetTile.hasMonster as MonsterType);
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


    // Helper to track stats and unlock related creatures
    // Uses combined counters for related tile types to ensure proper milestone tracking
    const checkAchievementProgress = (action: 'destroy' | 'place', tileType: string) => {
        // Normalize tile types into groups for proper counting
        let counterKey = tileType;
        if (tileType === 'tree' || tileType === 'jungle' || tileType === 'farmland') counterKey = 'forest'; // Combine with forest
        if (tileType === 'snow') counterKey = 'ice'; // Combine snow with ice
        if (tileType === 'oasis' || tileType === 'coral_reef') counterKey = 'water'; // Combine with water

        const key = `stats_${action}_${counterKey}`;
        const current = parseInt(localStorage.getItem(key) || '0');
        const newVal = current + 1;
        localStorage.setItem(key, newVal.toString());

        // Helper to unlock both locally and on server
        const unlock = (creatureId: string, name: string, description: string) => {
            discoverCreature(creatureId);
            unlockAchievement({
                achievementId: creatureId,
                achievementName: name,
                description: description
            });
        };

        // Forest Destruction (Flamio line) - counts both 'forest' and 'tree' together
        if (action === 'destroy' && counterKey === 'forest') {
            if (newVal === 1) unlock('001', 'Flamio', 'A fiery creature awakened by any forest destruction.');
            if (newVal === 5) unlock('002', 'Embera', 'A more powerful fire entity born from continued forest destruction.');
            if (newVal === 10) unlock('003', 'Vulcana', 'The ultimate fire creature, master of forest destruction.');
        }
        // Mountain Destruction (Rockie line)
        if (action === 'destroy' && counterKey === 'mountain') {
            if (newVal === 1) unlock('010', 'Rockie', 'A small rock creature that emerges from destroyed mountains.');
            if (newVal === 5) unlock('011', 'Buldour', 'A stronger mountain spirit, born from continued destruction.');
            if (newVal === 10) unlock('012', 'Montano', 'The ultimate mountain creature, master of destroyed peaks.');
        }

        // Placement Achievements
        if (action === 'place') {
            // Water (Dolphio line)
            if (counterKey === 'water') {
                if (newVal === 1) unlock('004', 'Dolphio', 'A playful water creature that appears when expanding water territories.');
                if (newVal === 5) unlock('005', 'Divero', 'A more experienced water dweller, guardian of expanding waters.');
                if (newVal === 10) unlock('006', 'Flippur', 'The supreme water creature, master of vast water territories.');
            }
            // Forest/Grass (Leaf line) - counts forest, tree, grass together
            if (counterKey === 'forest' || counterKey === 'grass') {
                // Use a combined key for forest+grass placement
                const forestGrassKey = `stats_place_forest_grass`;
                const fgCurrent = parseInt(localStorage.getItem(forestGrassKey) || '0');
                const fgNewVal = fgCurrent + 1;
                localStorage.setItem(forestGrassKey, fgNewVal.toString());

                if (fgNewVal === 1) unlock('007', 'Leaf', 'A small grass creature that appears when planting new forests.');
                if (fgNewVal === 5) unlock('008', 'Oaky', 'A stronger forest guardian, protector of growing woodlands.');
                if (fgNewVal === 10) unlock('009', 'Seqoio', 'The mighty forest spirit, overseer of vast woodlands.');
            }
            // Ice (IceCube line) - Fixed names to match database
            if (counterKey === 'ice') {
                if (newVal === 1) unlock('013', 'IceCube', 'A small ice creature born from placing ice tiles.');
                if (newVal === 5) unlock('014', 'Iciclo', 'A sharp ice spirit responding to expanded frozen lands.');
                if (newVal === 10) unlock('015', 'Glacior', 'The ruler of the frozen wastes, master of ice placement.');
            }
        }
    };

    const handleDestroyTile = async (x: number, y: number) => {
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

            if (!res.ok) throw new Error('Failed to delete tile');

            toast({ title: "💥 Devastated!", description: "The tile has been removed." });

            // Check destruction achievements
            checkAchievementProgress('destroy', originalTile.type);

            // Weather: Snowy Drop Chance
            if (weather === 'snowy' && (originalTile.type === 'forest' || originalTile.type === 'grass')) {
                if (Math.random() < 0.4) { // 40% chance
                    gainExperience(100, 'winter-forage');
                    toast({ title: TEXT_CONTENT.realm.toasts.winterForage.title, description: TEXT_CONTENT.realm.toasts.winterForage.desc, className: "bg-blue-900 border-blue-500 text-blue-100" });
                }
            }

            if (originalTile.type === 'mountain') {
                unlockAchievement({
                    achievementId: '201',
                    achievementName: 'Mountain Destroyer',
                    description: 'Prove your power by destroying a mountain tile'
                });
            }
        } catch (err) {
            setGrid(prev => {
                const next = [...prev];
                if (next[y]) next[y][x] = originalTile;
                return next;
            });
            toast({ title: 'Error', description: 'Failed to delete tile', variant: 'destructive' });
        }
    };

    const transformTile = async (x: number, y: number, newType: string) => {
        const numericType = (tileTypeToNumeric as any)[newType];

        // Optimistic update
        setGrid(prev => {
            const next = [...prev];
            if (next[y]) {
                // Keep some props like rotation? No, reset to default for new type.
                next[y][x] = {
                    ...defaultTile(newType as any),
                    x, y,
                    id: `${newType}-${x}-${y}`,
                    image: getTileImage(newType as any),
                    isVisited: true
                };
            }
            return next;
        });

        try {
            const res = await fetch('/api/realm-tiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y, tile_type: numericType })
            });
            if (!res.ok) throw new Error('Failed to transform tile');
        } catch (err) {
            logger.error('Transform failed', err);
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
                        title: TEXT_CONTENT.realm.toasts.inventoryOpened.title,
                        description: TEXT_CONTENT.realm.toasts.inventoryOpened.desc,
                    });
                }
                return;
            }

            // STRICT MODE CHECK: Only allow movement in 'move' mode
            if (gameModeRef.current !== 'move') {
                return;
            }

            // Movement throttling based on weather
            const now = Date.now();
            const minDelay = weatherRef.current === 'snowy' ? 300 : 150;
            if (now - lastMoveTimeRef.current < minDelay) return;
            lastMoveTimeRef.current = now;

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

            const blockedTiles = ['mountain', 'lava', 'volcano'];
            if (characterStats.level < 25) blockedTiles.push('water');

            if (targetTile && blockedTiles.includes(targetTile.type)) {
                toast({
                    title: TEXT_CONTENT.realm.toasts.cannotMove.title,
                    description: targetTile.type === 'water' && characterStats.level < 25
                        ? "You need Level 25 to sail!"
                        : TEXT_CONTENT.realm.toasts.cannotMove.desc.replace("{type}", targetTile.type),
                    variant: "destructive",
                });
                return;
            }

            // Check for monster battle
            if (targetTile?.hasMonster) {
                setCurrentMonster(targetTile.hasMonster as MonsterType);
                setBattleOpen(true);
                return;
            }

            if (newX !== currentPos.x || newY !== currentPos.y) {
                setCharacterPosition(newX, newY);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toast, setCharacterPosition, setShowInventory, characterStats.level]); // Minimal dependencies

    // Effect to handle landing on special tiles
    useEffect(() => {
        if (!grid.length || !grid[characterPosition.y]?.[characterPosition.x]) return;
        const currentTile = grid[characterPosition.y]?.[characterPosition.x];
        if (currentTile) {
            // Check for monster battle first
            if (currentTile.hasMonster) {
                setCurrentMonster(currentTile.hasMonster as MonsterType);
                setBattleOpen(true);
                return;
            }

            switch (currentTile.type) {
                case 'coral_reef': {
                    setActiveEvent(currentTile.type);
                    transformTile(characterPosition.x, characterPosition.y, 'water');
                    break;
                }
                case 'floating_island':
                case 'crystal_cavern':
                case 'jungle':
                case 'ruins':
                case 'graveyard':
                case 'oasis':
                case 'farmland': {
                    setActiveEvent(currentTile.type);
                    transformTile(characterPosition.x, characterPosition.y, 'grass');
                    break;
                }
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
                case 'settlement':
                    setModalState({ isOpen: true, locationType: 'town', locationName: currentTile?.name ?? 'settlement' });
                    break;
                case 'megapolis':
                    setModalState({ isOpen: true, locationType: 'city', locationName: currentTile?.name ?? 'megapolis' });
                    break;
                case 'mystery':
                    setLastMysteryTile({ x: characterPosition.x, y: characterPosition.y });
                    // Generate and show mystery event modal
                    const mysteryEvent = generateMysteryEvent();
                    if (mysteryEvent) {
                        setMysteryEvent({ open: true, event: mysteryEvent });
                    }
                    break;
                case 'pyramid': {
                    logger.debug("[Realm Landing] Stepped on pyramid tile at:", characterPosition);
                    const checkPyramid = async () => {
                        try {
                            const res = await fetch(`/api/quests?t=${Date.now()}`);
                            const data = await res.json();
                            if (data && Array.isArray(data)) {
                                const allCompleted = data.length > 0 && data.every((q: any) => q.completed);
                                logger.debug("[Realm Landing] Pyramid check complete. Success:", allCompleted);
                                setPyramidEvent({ open: true, success: allCompleted });
                            } else {
                                logger.warn("[Realm Landing] Pyramid check did not receive a valid array");
                                setPyramidEvent({ open: true, success: false });
                            }
                        } catch (error) {
                            logger.error("Failed to check pyramid", error);
                            setPyramidEvent({ open: true, success: false });
                        }
                    };
                    checkPyramid();
                    break;
                }
                case 'whispering-well': {
                    logger.debug("[Realm Landing] Stepped on whispering-well tile at:", characterPosition);
                    const checkWell = async () => {
                        setWellEvent({ open: true, pact: null, availableHabits: [], loading: true });
                        try {
                            const res = await fetch(`/api/quests?t=${Date.now()}`);
                            const data = await res.json();
                            
                            const stored = localStorage.getItem('well-focus-pact');
                            let currentPact = null;
                            if (stored) {
                                try {
                                    currentPact = JSON.parse(stored);
                                } catch (e) {}
                            }

                            if (data && Array.isArray(data)) {
                                if (currentPact) {
                                    const match = data.find((q: any) => q.id === currentPact.habitId);
                                    if (match && match.completed) {
                                        currentPact.completed = true;
                                    }
                                }
                                const uncompleted = data.filter((q: any) => !q.completed);
                                logger.debug("[Realm Landing] Well check complete. Active Pact:", currentPact, "Uncompleted quests count:", uncompleted.length);
                                setWellEvent({
                                    open: true,
                                    pact: currentPact,
                                    availableHabits: uncompleted,
                                    loading: false
                                });
                            } else {
                                logger.warn("[Realm Landing] Well check did not receive a valid array");
                                setWellEvent({
                                    open: true,
                                    pact: currentPact,
                                    availableHabits: [],
                                    loading: false
                                });
                            }
                        } catch (error) {
                            logger.error("Failed to load well pact options", error);
                            setWellEvent({ open: true, pact: null, availableHabits: [], loading: false });
                        }
                    };
                    checkWell();
                    break;
                }
                case 'sphinx-gates': {
                    logger.debug("[Realm Landing] Stepped on sphinx-gates tile at:", characterPosition);
                    const checkSphinxGates = async () => {
                        try {
                            const [questsRes, challengesRes] = await Promise.all([
                                fetch(`/api/quests?t=${Date.now()}`),
                                fetch(`/api/challenges?t=${Date.now()}`)
                            ]);
                            const [questsData, challengesData] = await Promise.all([
                                questsRes.json(),
                                challengesRes.json()
                            ]);

                            let completedCount = 0;
                            if (questsData && Array.isArray(questsData)) {
                                completedCount += questsData.filter((q: any) => q.completed).length;
                            }
                            if (challengesData && Array.isArray(challengesData)) {
                                completedCount += challengesData.filter((c: any) => c.completed).length;
                            }

                            logger.debug("[Realm Landing] Sphinx check complete. Completed count:", completedCount);
                            if (completedCount >= 3) {
                                toast({
                                    title: "Sphinx's Gates Pass",
                                    description: "The Sphinxes bow their heads. Your daily discipline allows you passage!",
                                });
                            } else {
                                setSphinxEvent({ open: true, blocked: true, completedCount });
                                setCharacterPosition(prevPositionRef.current.x, prevPositionRef.current.y);
                            }
                        } catch (error) {
                            logger.error("Failed to check sphinx gates", error);
                        }
                    };
                    checkSphinxGates();
                    break;
                }
                case 'whispering-canopy': {
                    logger.debug("[Realm Landing] Stepped on whispering-canopy tile at:", characterPosition);
                    const checkCanopy = async () => {
                        setCanopyEvent({ open: true, pact: null, availableHabits: [], loading: true });
                        try {
                            const res = await fetch(`/api/quests?t=${Date.now()}`);
                            const data = await res.json();
                            
                            const stored = localStorage.getItem('canopy-focus-pact');
                            let currentPact = null;
                            if (stored) {
                                try {
                                    currentPact = JSON.parse(stored);
                                } catch (e) {}
                            }

                            if (data && Array.isArray(data)) {
                                if (currentPact) {
                                    const match = data.find((q: any) => q.id === currentPact.habitId);
                                    if (match && match.completed) {
                                        currentPact.completed = true;
                                    }
                                }
                                const uncompleted = data.filter((q: any) => !q.completed);
                                logger.debug("[Realm Landing] Canopy check complete. Active Pact:", currentPact, "Uncompleted quests count:", uncompleted.length);
                                setCanopyEvent({
                                    open: true,
                                    pact: currentPact,
                                    availableHabits: uncompleted,
                                    loading: false
                                });
                            } else {
                                setCanopyEvent({
                                    open: true,
                                    pact: currentPact,
                                    availableHabits: [],
                                    loading: false
                                });
                            }
                        } catch (error) {
                            logger.error("Failed to load canopy pact options", error);
                            setCanopyEvent({ open: true, pact: null, availableHabits: [], loading: false });
                        }
                    };
                    checkCanopy();
                    break;
                }
                case 'frostfire-obelisk': {
                    logger.debug("[Realm Landing] Stepped on frostfire-obelisk tile at:", characterPosition);
                    const checkObelisk = async () => {
                        setObeliskEvent({ open: true, alreadyCompleted: false, loading: true });
                        try {
                            const res = await fetch(`/api/quests?t=${Date.now()}`);
                            const data = await res.json();
                            if (data && Array.isArray(data)) {
                                const allCompleted = data.length > 0 && data.every((q: any) => q.completed);
                                setObeliskEvent({
                                    open: true,
                                    alreadyCompleted: allCompleted,
                                    loading: false
                                });
                            } else {
                                setObeliskEvent({
                                    open: true,
                                    alreadyCompleted: false,
                                    loading: false
                                });
                            }
                        } catch (error) {
                            logger.error("Failed to check frostfire obelisk status", error);
                            setObeliskEvent({ open: true, alreadyCompleted: false, loading: false });
                        }
                    };
                    checkObelisk();
                    break;
                }
                case 'fairy-ring': {
                    logger.debug("[Realm Landing] Stepped on fairy-ring tile at:", characterPosition);
                    setFairyRingEvent({ open: true, rolled: false });
                    break;
                }
            }
        }
    }, [characterPosition, grid, toast, setModalState, setCastleEvent, setDungeonEvent, setCaveEvent, setMysteryEvent, setLastMysteryTile, getToken, setCharacterPosition, setPyramidEvent, setWellEvent, setSphinxEvent, setCanopyEvent, setObeliskEvent, setFairyRingEvent]);

    const handleResetPosition = () => {
        setCharacterPosition(INITIAL_POS.x, INITIAL_POS.y);
        toast({
            title: TEXT_CONTENT.realm.toasts.positionReset.title,
            description: TEXT_CONTENT.realm.toasts.positionReset.desc,
        });
    };

    useEffect(() => {
        if (!isLoading && grid.length && characterPosition) {
            const tile = grid[characterPosition.y]?.[characterPosition.x];
            const blockedTiles = ['mountain', 'lava', 'volcano'];
            if (characterStats.level < 25) blockedTiles.push('water');

            if (!tile || blockedTiles.includes(tile.type)) {
                setCharacterPosition(INITIAL_POS.x, INITIAL_POS.y);
            }
        }
    }, [isLoading, grid, characterPosition, setCharacterPosition, characterStats.level]);

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

        if (targetTile.type === 'pyramid' || targetTile.type === 'sphinx-gates' || targetTile.type === 'whispering-canopy' || targetTile.type === 'frostfire-obelisk' || targetTile.type === 'fairy-ring') {
            toast({
                title: "Ancient Landmark",
                description: "This ancient landmark is permanently rooted in the realm and cannot be destroyed!",
                variant: "destructive"
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

    const handleRotateTile = async (x: number, y: number) => {
        const currentGrid = gridRef.current;
        const tile = currentGrid[y]?.[x];

        if (!tile || tile.type === 'empty') return;

        // Optimistic update
        const currentRotation = tile.rotation || 0;
        const newRotation = (currentRotation + 90) % 360 as 0 | 90 | 180 | 270;

        setGrid(prev => {
            const next = prev.map(row => [...row]);
            if (next[y]?.[x]) {
                next[y][x] = { ...next[y][x]!, rotation: newRotation };
            }
            return next;
        });

        // Persist
        try {
            const tileTypeNum = tileTypeToNumeric[tile.type] || 0;
            // Assuming the API handles merging meta or we just set rotation. 
            // If the API overwrites meta, we might lose other meta data if any exists.
            // Currently meta seems unused for other things, so safe to overwrite or merge if API supports it.
            // The API code I saw earlier upserts, so it replaces the row's meta if provided.
            // But we should probably preserve existing meta if we can?
            // Since we don't have existing meta in local state usually (except maybe 'revealed'?), 
            // let's just send rotation.

            await fetch('/api/realm-tiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    x,
                    y,
                    tile_type: tileTypeNum,
                    meta: { rotation: newRotation }
                })
            });

            toast({
                title: TEXT_CONTENT.realm.toasts.immovable.title,
                description: TEXT_CONTENT.realm.toasts.immovable.desc.replace("{type}", tile.type),
                variant: "destructive",
            });
        } catch (e) {
            logger.error('Failed to rotate tile:', e);
            toast({ title: 'Error', description: 'Failed to save rotation', variant: 'destructive' });
        }
    };

    // Debug selectedTile changes
    useEffect(() => {
        // Removed debugging log
    }, [selectedTile]);

    if (!isMounted) return null;

    if (isLoading) {
        return <RealmLoading />;
    }

    return (
        <div className={cn(
            "relative min-h-screen"
        )}>
            {isVisiting && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white px-6 py-3 rounded-2xl border-2 border-amber-500/30  shadow-[0_0_40px_rgba(245,158,11,0.15)] flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                        <Users className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold tracking-wider text-sm text-amber-400 italic">{TEXT_CONTENT.realm.header.envoyMode}</span>
                        <span className="text-xs text-amber-200/60 font-medium">{TEXT_CONTENT.realm.header.envoyDesc}</span>
                    </div>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="h-9 px-4 rounded-xl bg-amber-600 text-black hover:bg-amber-500 border-none ml-2 font-bold"
                        onClick={() => router.push('/city/Grand Citadel/tavern?tab=allies')}
                    >
                        {TEXT_CONTENT.realm.header.returnHome}
                    </Button>
                </div>
            )}

            <HeaderSection
                title={isVisiting ? TEXT_CONTENT.realm.header.envoyTitle : TEXT_CONTENT.realm.header.title}
                subtitle={isVisiting ? TEXT_CONTENT.realm.header.envoySubtitle : TEXT_CONTENT.realm.header.subtitle}
                imageSrc="/images/realm-header.webp"
                defaultBgColor="bg-blue-900"
                shouldRevealImage={true}
                guideComponent={
                    <PageGuide
                        title={TEXT_CONTENT.realm.guide.title}
                        subtitle={TEXT_CONTENT.realm.guide.subtitle}
                        sections={[
                            {
                                title: TEXT_CONTENT.realm.guide.exploration.title,
                                icon: Compass,
                                content: TEXT_CONTENT.realm.guide.exploration.content
                            },
                            {
                                title: TEXT_CONTENT.realm.guide.building.title,
                                icon: Tent,
                                content: TEXT_CONTENT.realm.guide.building.content
                            },
                            {
                                title: TEXT_CONTENT.realm.guide.combat.title,
                                icon: ShieldCheck,
                                content: TEXT_CONTENT.realm.guide.combat.content
                            },
                            {
                                title: TEXT_CONTENT.realm.guide.towns.title,
                                icon: Compass,
                                content: TEXT_CONTENT.realm.guide.towns.content
                            }
                        ]}
                    />
                }
            />
            <RealmAnimationWrapper
                isAnimating={false}
                onImageReveal={setShouldRevealImage}
            >
                {/* Top Toolbar */}
                {!isVisiting && (
                    <div className="flex items-center justify-between bg-zinc-800 z-30 overflow-visible">
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
                                            : "bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-600"
                                    )}
                                    aria-label="movement-mode-button"
                                >
                                    <Move className="w-4 h-4" />
                                    <span className="hidden md:inline">{TEXT_CONTENT.realm.modes.move}</span>
                                </Button>
                                <Button
                                    variant={gameMode === 'build' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setGameMode('build')}
                                    className={cn(
                                        "flex items-center gap-2 min-w-[44px] min-h-[44px]",
                                        gameMode === 'build'
                                            ? "bg-amber-500 text-white hover:bg-amber-600"
                                            : "bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-600"
                                    )}
                                    aria-label="build-mode-button"
                                >
                                    <Hammer className="w-4 h-4" />
                                    <span className="hidden md:inline">{TEXT_CONTENT.realm.modes.build}</span>
                                </Button>
                                <Button
                                    variant={gameMode === 'destroy' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setGameMode('destroy')}
                                    className={cn(
                                        "flex items-center gap-2 min-w-[44px] min-h-[44px] md:hidden",
                                        gameMode === 'destroy'
                                            ? "bg-red-500 text-white hover:bg-red-600"
                                            : "bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-600"
                                    )}
                                    aria-label="destroy-mode-button"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="hidden md:inline">{TEXT_CONTENT.realm.modes.destroy}</span>
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
                                                <span className="hidden sm:inline">{TEXT_CONTENT.realm.modes.expand}</span>
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="top"
                                        className="bg-zinc-900 text-white border-amber-800/30"
                                    >
                                        {canExpand
                                            ? TEXT_CONTENT.realm.modes.expandTooltip
                                            : TEXT_CONTENT.realm.modes.expandLocked.replace("{level}", String(nextExpansionLevel)).replace("{current}", String(characterStats.level))}
                                    </TooltipContent>
                                </Tooltip>

                                {selectedTile && (
                                    <div className="hidden sm:flex items-center gap-3 bg-zinc-900 border border-amber-500/30 rounded-lg px-3 py-1 mr-1 shadow-inner shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex flex-col items-start min-w-[60px]">
                                            <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold">{TEXT_CONTENT.realm.modes.selected}</span>
                                            <span className="text-xs font-bold text-amber-400 truncate max-w-[100px]">{selectedTile.name}</span>
                                        </div>
                                        <div className="h-6 w-px bg-zinc-700 mx-1"></div>
                                        <div className="text-xs font-mono text-zinc-300">
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
                                    <span className="hidden sm:inline">{TEXT_CONTENT.realm.modes.inventory}</span>
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
                                            <span className="hidden sm:inline">{TEXT_CONTENT.realm.modes.more}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={handleResetPosition} className="flex items-center gap-2">
                                            <RotateCcw className="w-4 h-4" />
                                            {TEXT_CONTENT.realm.menu.resetPosition}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleResetMap} className="flex items-center gap-2 text-red-500 hover:text-red-400 focus:text-red-400 focus:bg-red-500/10">
                                            <Trash2 className="w-4 h-4" />
                                            {TEXT_CONTENT.realm.menu.resetRealm}
                                        </DropdownMenuItem>
                                        {/* Auto Save Toggle */}
                                        <div className="px-2 py-1.5">
                                            <div className="flex items-center space-x-2">
                                                <Switch id="auto-save-switch-menu" checked={autoSave} onCheckedChange={setAutoSave} />
                                                <label htmlFor="auto-save-switch-menu" className="text-sm">{TEXT_CONTENT.realm.menu.autoSave}</label>
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
                        availableFood={availableFood}
                        onFeed={(itemId) => handleAnimalFeed(animalInteractionModal.animalType, itemId)}
                        onInteract={() => handleAnimalInteraction(animalInteractionModal.animalType)}
                    />
                )}
                {/* Map Area - Restored to fixed to ensure original rendering logic works */}
                <div className="fixed inset-0 top-[60px] z-0 bg-zinc-900">
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
                        onTileRotate={handleRotateTile}
                        onTileDelete={handleDestroyTile}
                    />
                </div>
                {/* Overlay Inventory Panel */}
                <Sheet open={showInventory} onOpenChange={setShowInventory} modal={false}>
                    <SheetContent side="right" className="w-full sm:w-[500px] bg-zinc-900/95 border-zinc-700 p-0 overflow-hidden flex flex-col z-[50]">
                        <SheetHeader className="px-6 py-4 border-b border-zinc-800 bg-zinc-900 text-left shrink-0">
                            <SheetTitle className="text-2xl font-medieval text-amber-500 flex items-center gap-2">
                                <span className="text-3xl">🏰</span>
                                {TEXT_CONTENT.realm.inventory.title}
                            </SheetTitle>
                            <SheetDescription className="text-zinc-400">
                                {TEXT_CONTENT.realm.inventory.desc}
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 overflow-hidden p-0 relative min-h-0">
                            <MedievalErrorBoundary componentName="TileInventory">
                                <TileInventory
                                    tiles={Array.isArray(inventoryAsItems) ? inventoryAsItems : []}
                                    selectedTile={selectedTile}
                                    onSelectTile={handleTileSelection}
                                    onUpdateTiles={setInventoryAsItems}
                                    activeTab={inventoryTab}
                                    setActiveTab={setInventoryTab}
                                    onOutOfTiles={(tile) => setInventoryTab('buy')}
                                    userLevel={characterStats.level}
                                />
                            </MedievalErrorBoundary>
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Event Modals */}
                {activeEvent && (
                    <RealmEventModal
                        isOpen={!!activeEvent}
                        onClose={() => setActiveEvent(null)}
                        tileType={activeEvent}
                        onWeatherChange={setWeather}
                    />
                )}
                {castleEvent?.open && (
                    <Dialog open={castleEvent.open} onOpenChange={() => setCastleEvent(null)}>
                        <DialogContent aria-label="Castle Event Royal Audience" role="dialog" aria-modal="true">
                            <DialogHeader>
                                <DialogTitle>{TEXT_CONTENT.realm.events.castle.title}</DialogTitle>
                                <DialogDescription>{TEXT_CONTENT.realm.events.castle.desc}</DialogDescription>
                            </DialogHeader>
                            {!castleEvent.result ? (
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="h-16 flex items-center justify-center">
                                        <div className="w-16 h-16 flex items-center justify-center rounded-lg border-4 border-amber-700 bg-zinc-900 text-4xl font-bold text-amber-400 select-none" style={{ transition: 'background 0.2s' }}>
                                            {castleDiceRolling
                                                ? Math.ceil(Math.random() * 6)
                                                : castleDiceValue || 1}
                                        </div>
                                    </div>
                                    <Button aria-label="Roll Dice" disabled={castleDiceRolling} onClick={async () => {
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
                                            result = TEXT_CONTENT.realm.events.castle.result1.replace("{roll}", String(roll));
                                            reward = '+20 gold';
                                            gainGold(20, 'castle-event');
                                        } else if (roll <= 4) {
                                            result = TEXT_CONTENT.realm.events.castle.result2.replace("{roll}", String(roll));
                                            reward = '+40 XP';
                                            gainExperience(40, 'castle-event');
                                        } else {
                                            const attributes = ['Loyalty', 'Defense', 'Wisdom', 'Courage', 'Honor'];
                                            const attr = attributes[Math.floor(Math.random() * attributes.length)] || 'Honor';
                                            result = TEXT_CONTENT.realm.events.castle.result3.replace("{attr}", attr).replace("{roll}", String(roll));
                                            reward = `+1 ${attr}`;
                                            // Add attribute to inventory or show toast (implement as needed)
                                        }
                                        setTimeout(() => setCastleEvent({ open: true, result, reward }), 500);
                                    }}>{castleDiceRolling ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Rolling...
                                        </span>
                                    ) : "Roll Dice"}</Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-lg font-semibold text-center">{castleEvent.result}</div>
                                    <Button aria-label="Close" onClick={() => setCastleEvent(null)}>{TEXT_CONTENT.realm.events.castle.close}</Button>
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
                {/* Cave Event Modal */}
                {caveEvent?.open && (
                    <Dialog open={caveEvent.open} onOpenChange={() => setCaveEvent(null)}>
                        <DialogContent className="sm:max-w-[420px] bg-zinc-950 border-zinc-800 text-zinc-100 overflow-hidden p-0">
                            <div className="absolute inset-0 bg-blue-500/5 opacity-40 pointer-events-none blur-[100px]" />

                            <div className="relative z-10 p-6 flex flex-col items-center">
                                <DialogHeader className="w-full text-center items-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-blue-500/30 text-xs font-bold uppercase tracking-widest mb-4 text-blue-400">
                                        <Compass className="w-3 h-3" />
                                        Exploration Event
                                    </div>
                                    <DialogTitle className="text-3xl font-serif text-white tracking-tight mb-2">
                                        {TEXT_CONTENT.realm.events.cave.title}
                                    </DialogTitle>
                                    <DialogDescription className="text-zinc-400 text-center leading-relaxed max-w-[280px]">
                                        {TEXT_CONTENT.realm.events.cave.desc}
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Cave Display */}
                                <div className="relative w-full flex flex-col items-center py-8">
                                    <div className="relative group">
                                        <div className="absolute inset-0 rounded-full blur-3xl animate-pulse scale-150 opacity-20 bg-blue-500" />
                                        <div className="absolute -inset-4 border border-dashed rounded-full animate-spin-slow opacity-30 border-blue-400" style={{ animationDuration: '15s' }} />
                                        <div className="relative w-48 h-48 rounded-full border-4 shadow-2xl overflow-hidden p-1 bg-zinc-900 border-blue-500/30">
                                            <div className="relative w-full h-full rounded-full overflow-hidden border border-white/10">
                                                <Image
                                                    src="/images/tiles/cave-tile.webp"
                                                    alt="Ancient Cave"
                                                    fill
                                                    className="object-cover"
                                                    priority
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {!caveEvent.result ? (
                                    <div className="w-full space-y-3 mt-4">
                                        <Button className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg border-t border-white/10"
                                            onClick={() => {
                                                const roll = Math.random();
                                                if (roll < 0.2) {
                                                    setCaveEvent({ open: true, result: TEXT_CONTENT.realm.events.cave.res1a });
                                                    gainGold(80, 'cave-event');
                                                } else {
                                                    setCaveEvent({ open: true, result: TEXT_CONTENT.realm.events.cave.res1b });
                                                }
                                            }}>{TEXT_CONTENT.realm.events.cave.path1}</Button>
                                        <Button className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl"
                                            onClick={() => {
                                                const roll = Math.random();
                                                if (roll < 0.1) {
                                                    setCaveEvent({ open: true, result: TEXT_CONTENT.realm.events.cave.res2a });
                                                    gainExperience(120, 'cave-event');
                                                } else {
                                                    setCaveEvent({ open: true, result: TEXT_CONTENT.realm.events.cave.res2b });
                                                }
                                            }}>{TEXT_CONTENT.realm.events.cave.path2}</Button>
                                        <Button variant="ghost" className="w-full h-12 text-zinc-400 hover:text-white"
                                            onClick={() => {
                                                const roll = Math.random();
                                                if (roll < 0.9) {
                                                    setCaveEvent({ open: true, result: TEXT_CONTENT.realm.events.cave.res3a });
                                                    gainGold(10, 'cave-event');
                                                } else {
                                                    setCaveEvent({ open: true, result: TEXT_CONTENT.realm.events.cave.res3b });
                                                    gainGold(-10, 'cave-event');
                                                }
                                            }}>{TEXT_CONTENT.realm.events.cave.path3}</Button>
                                    </div>
                                ) : (
                                    <div className="w-full text-center space-y-6 py-4">
                                        <div className="text-xl font-medium text-blue-100">{caveEvent.result}</div>
                                        <Button className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl" onClick={() => setCaveEvent(null)}>
                                            {TEXT_CONTENT.realm.events.cave.close}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Mystery Event Modal */}
                <MysteryEventModal
                    isOpen={!!mysteryEvent?.open}
                    onClose={() => setMysteryEvent(null)}
                    event={mysteryEvent?.event || null}
                    isProcessing={!!mysteryEvent?.choice}
                    onChoice={(choice) => {
                        setMysteryEvent({ ...mysteryEvent!, choice });
                        handleEventOutcome(mysteryEvent!.event, choice, user?.id);
                        setMysteryEventCompleted(true);
                        setTimeout(() => setMysteryEvent(null), 2000);
                    }}
                />

                {/* Monster Battle Component */}
                <MonsterBattle
                    isOpen={battleOpen}
                    onClose={() => setBattleOpen(false)}
                    monsterType={currentMonster}
                    onBattleComplete={(won, gold, xp) => {
                        if (won) {
                            toast({ title: TEXT_CONTENT.realm.toasts.victory.title, description: TEXT_CONTENT.realm.toasts.victory.desc.replace("{gold}", String(gold)).replace("{xp}", String(xp)) });
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
                            toast({ title: TEXT_CONTENT.realm.toasts.defeat.title, description: TEXT_CONTENT.realm.toasts.defeat.desc, variant: "destructive" });
                        }
                    }}
                />

                {/* Monolith of Devotion (Pyramid) Modal */}
                {pyramidEvent?.open && (
                    <Dialog open={pyramidEvent.open} onOpenChange={() => setPyramidEvent(null)}>
                        <DialogContent className="w-[92%] sm:max-w-[420px] bg-zinc-950 border-zinc-800 text-zinc-100 overflow-hidden p-6 rounded-2xl h-auto max-h-[85vh]">
                            <div className="absolute inset-0 bg-amber-500/5 opacity-40 pointer-events-none blur-[100px]" />
                            <DialogHeader className="text-center items-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-amber-500/30 text-xs font-bold uppercase tracking-widest mb-4 text-amber-400">
                                    <Crown className="w-3 h-3" />
                                    Monolith of Devotion
                                </div>
                                <DialogTitle className="text-3xl font-serif text-white tracking-tight mb-2">
                                    The Sun Pyramid
                                </DialogTitle>
                                <DialogDescription className="text-zinc-400 text-center leading-relaxed">
                                    An ancient structure built to celebrate unbroken discipline. Its gates only open for the fully committed.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex flex-col items-center justify-center my-6 space-y-4">
                                <div className="text-6xl filter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                                    {pyramidEvent.success ? "🔱" : "🔒"}
                                </div>
                                <div className="text-center">
                                    {pyramidEvent.success ? (
                                        <p className="text-green-400 font-bold text-lg">Daily Habits Complete!</p>
                                    ) : (
                                        <p className="text-amber-500/80 font-medium text-sm">Habits Incomplete</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {pyramidEvent.success ? (
                                    <>
                                        <p className="text-sm text-zinc-300 text-center leading-relaxed">
                                            The glyphs on the pyramid walls glow with warm solar energy. Your devotion has awakened the monolith!
                                        </p>
                                        <Button
                                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold font-serif py-3 rounded-xl shadow-lg shadow-amber-950/40"
                                            disabled={isPyramidClaiming}
                                            onClick={async () => {
                                                const today = new Date().toDateString();
                                                const lastClaimed = localStorage.getItem('pyramid-last-claimed');
                                                if (lastClaimed === today) {
                                                    toast({
                                                        title: "Already Claimed",
                                                        description: "You have already received the Monolith's blessing today. Return tomorrow!",
                                                    });
                                                    setPyramidEvent(null);
                                                } else {
                                                    setIsPyramidClaiming(true);
                                                    try {
                                                        await Promise.all([
                                                            gainGold(50, 'pyramid-event'),
                                                            gainExperience(100, 'pyramid-event')
                                                        ]);
                                                        localStorage.setItem('pyramid-last-claimed', today);
                                                        toast({
                                                            title: "Devotion Awakened! ☀️",
                                                            description: "You received +50 Gold and +100 XP!",
                                                        });
                                                    } catch (err) {
                                                        console.error("Failed to claim solar blessing:", err);
                                                    } finally {
                                                        setIsPyramidClaiming(false);
                                                        setPyramidEvent(null);
                                                    }
                                                }
                                            }}
                                        >
                                            {isPyramidClaiming ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Claiming Blessing...
                                                </span>
                                            ) : (
                                                "Claim Solar Blessing ☀️"
                                            )}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-zinc-400 text-center leading-relaxed">
                                            The Monolith stands silent and cold. Finish all your daily habits in the quest log to unlock its ancient power.
                                        </p>
                                        <Button
                                            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850 py-3 rounded-xl font-bold"
                                            onClick={() => setPyramidEvent(null)}
                                        >
                                            Return to Journey
                                        </Button>
                                    </>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Whispering Well of Focus Modal */}
                {wellEvent?.open && (
                    <Dialog open={wellEvent.open} onOpenChange={() => setWellEvent(null)}>
                        <DialogContent className="w-[92%] sm:max-w-[420px] bg-zinc-950 border-zinc-800 text-zinc-100 overflow-hidden p-6 rounded-2xl h-auto max-h-[85vh]">
                            <div className="absolute inset-0 bg-blue-500/5 opacity-40 pointer-events-none blur-[100px]" />
                            <DialogHeader className="text-center items-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-blue-500/30 text-xs font-bold uppercase tracking-widest mb-4 text-blue-400">
                                    <Compass className="w-3 h-3" />
                                    Whispering Well
                                </div>
                                <DialogTitle className="text-3xl font-serif text-white tracking-tight mb-2">
                                    Well of Focus
                                </DialogTitle>
                                <DialogDescription className="text-zinc-400 text-center leading-relaxed">
                                    Peer into the ancient waters. Seal a focus pact on a single daily task to summon a treasure chest.
                                </DialogDescription>
                            </DialogHeader>

                            {wellEvent.loading ? (
                                <div className="h-40 flex items-center justify-center text-amber-500/50 animate-pulse">
                                    Consulting the water spirits...
                                </div>
                            ) : wellEvent.pact ? (
                                <div className="space-y-4 my-4">
                                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Active Pact</p>
                                        <p className="text-lg font-bold text-amber-400 font-serif">&quot;{wellEvent.pact.habitName}&quot;</p>
                                        <p className="text-xs text-zinc-400 mt-2">
                                            {wellEvent.pact.completed ? (
                                                <span className="text-green-400 font-bold">✨ TASK COMPLETED! ✨</span>
                                            ) : (
                                                <span>Status: Incomplete in Quest Log</span>
                                            )}
                                        </p>
                                    </div>

                                    {wellEvent.pact.completed ? (
                                        <Button
                                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold font-serif py-3 rounded-xl shadow-lg"
                                            disabled={isChestClaiming}
                                            onClick={async () => {
                                                const rewards: any[] = [
                                                    { id: 'material-wood', name: 'Elder Wood', quantity: 4, emoji: '🪵', type: 'material', category: 'material', rarity: 'common' },
                                                    { id: 'material-stone', name: 'Ironstone Blocks', quantity: 3, emoji: '🪨', type: 'material', category: 'material', rarity: 'common' },
                                                    { id: 'material-iron', name: 'Raw Iron Ore', quantity: 2, emoji: '⛏️', type: 'material', category: 'material', rarity: 'uncommon' },
                                                    { id: 'material-crystal', name: 'Ember Crystals', quantity: 2, emoji: '💎', type: 'material', category: 'material', rarity: 'rare' },
                                                    { id: 'food-red', name: 'Crimson Fish Food', quantity: 3, emoji: '🐠', type: 'food', category: 'food', rarity: 'common' }
                                                ];
                                                
                                                const rand1 = rewards[Math.floor(Math.random() * rewards.length)];
                                                const rand2 = rewards[(Math.floor(Math.random() * rewards.length) + 1) % rewards.length];
                                                
                                                setIsChestClaiming(true);
                                                try {
                                                    if (userId && rand1 && rand2) {
                                                        await Promise.all([
                                                            addToInventory(userId, rand1),
                                                            addToInventory(userId, rand2)
                                                        ]);
                                                    }
                                                    await gainGold(30, 'well-event');
                                                    
                                                    localStorage.removeItem('well-focus-pact');
                                                    toast({
                                                        title: "Focus Pact Fulfilled! 📦",
                                                        description: `You obtained 30 Gold, ${rand1?.quantity}x ${rand1?.name}, and ${rand2?.quantity}x ${rand2?.name}!`,
                                                     });
                                                } catch (err) {
                                                    console.error("Failed to claim focus chest:", err);
                                                } finally {
                                                    setIsChestClaiming(false);
                                                    setWellEvent(null);
                                                }
                                            }}
                                        >
                                            {isChestClaiming ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Opening Chest...
                                                </span>
                                            ) : (
                                                "Open Focus Chest 🎁"
                                            )}
                                        </Button>
                                    ) : (
                                        <>
                                            <p className="text-xs text-zinc-400 text-center">
                                                Complete this task in your daily Quest board to unlock the well&apos;s floating chest!
                                            </p>
                                            <Button
                                                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 py-3 rounded-xl"
                                                onClick={() => setWellEvent(null)}
                                            >
                                                Return to Map
                                            </Button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 my-4">
                                    <p className="text-xs text-zinc-400 text-center leading-relaxed">
                                        Choose one uncompleted task from your Quest board. Pledging to focus on it will seal a pact. Complete it to claim your reward chest!
                                    </p>
                                    {wellEvent.availableHabits.length === 0 ? (
                                        <p className="text-sm text-center text-green-400 font-bold py-4">
                                            All habits are complete today! Return tomorrow to seal a new pact.
                                        </p>
                                    ) : (
                                        <ScrollArea className="max-h-[160px] border border-zinc-850 rounded-lg p-2 bg-zinc-900/40">
                                            <div className="space-y-2">
                                                {wellEvent.availableHabits.map((habit: any) => (
                                                    <div 
                                                        key={habit.id}
                                                        onClick={() => {
                                                            const today = new Date().toDateString();
                                                            localStorage.setItem('well-focus-pact', JSON.stringify({
                                                                habitId: habit.id,
                                                                habitName: habit.name || habit.title,
                                                                targetDate: today,
                                                                completed: false
                                                            }));
                                                            toast({
                                                                title: "Pact Sealed 📜",
                                                                description: `You have sworn a pact of focus on "${habit.name || habit.title}"!`,
                                                            });
                                                            setWellEvent(null);
                                                        }}
                                                        className="p-2 border border-zinc-800 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-lg text-xs cursor-pointer transition-all flex items-center justify-between"
                                                    >
                                                        <span className="font-medium text-zinc-200">{habit.name || habit.title}</span>
                                                        <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">{habit.category}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                    <Button
                                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 py-2.5 rounded-xl text-xs"
                                        onClick={() => setWellEvent(null)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                )}

                {/* Sphinx's Gates Modal */}
                {sphinxEvent?.open && (
                    <Dialog open={sphinxEvent.open} onOpenChange={() => setSphinxEvent(null)}>
                        <DialogContent className="w-[92%] sm:max-w-[420px] bg-zinc-950 border-zinc-900 text-zinc-100 overflow-hidden p-6 rounded-2xl h-auto max-h-[85vh]">
                            <div className="absolute inset-0 bg-red-950/10 opacity-30 pointer-events-none blur-[100px]" />
                            <DialogHeader className="text-center items-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-red-500/30 text-xs font-bold uppercase tracking-widest mb-4 text-red-400">
                                    <ShieldCheck className="w-3 h-3" />
                                    Sphinx&apos;s Gates
                                </div>
                                <DialogTitle className="text-3xl font-serif text-white tracking-tight mb-2">
                                    Halt, Adventurer!
                                </DialogTitle>
                            </DialogHeader>

                            <div className="flex flex-col items-center justify-center my-6 space-y-4">
                                <div className="text-6xl filter drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                    🦁🚪🦁
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-red-400 font-bold text-lg font-serif">Passage Blocked!</p>
                                    <p className="text-sm text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
                                        &quot;Only those who have completed at least <span className="text-amber-400 font-bold">3 daily habits</span> today may pass through our gates. You have only completed <span className="text-red-400 font-bold">{sphinxEvent.completedCount}</span>.&quot;
                                    </p>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white font-bold font-serif py-3 rounded-xl"
                                onClick={() => setSphinxEvent(null)}
                            >
                                Revert and Complete Quests
                            </Button>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Whispering Canopy Modal */}
                {canopyEvent?.open && (
                    <Dialog open={canopyEvent.open} onOpenChange={() => setCanopyEvent(null)}>
                        <DialogContent className="w-[92%] sm:max-w-[420px] bg-zinc-950 border-zinc-800 text-zinc-100 overflow-hidden p-6 rounded-2xl h-auto max-h-[85vh]">
                            <div className="absolute inset-0 bg-emerald-950/10 opacity-30 pointer-events-none blur-[100px]" />
                            <DialogHeader className="text-center items-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-emerald-500/30 text-xs font-bold uppercase tracking-widest mb-4 text-emerald-400">
                                    <Tent className="w-3 h-3" />
                                    Whispering Canopy
                                </div>
                                <DialogTitle className="text-3xl font-serif text-white tracking-tight mb-2">
                                    Druid&apos;s Sanctuary
                                </DialogTitle>
                            </DialogHeader>

                            {canopyEvent.loading ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
                                    <p className="text-sm text-zinc-400">Consulting the ancient trees...</p>
                                </div>
                            ) : canopyEvent.pact ? (
                                <div className="space-y-4 mt-4">
                                    <div className="bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl space-y-2">
                                        <p className="text-xs uppercase text-emerald-400 font-bold tracking-wider">Active Focus Pledge</p>
                                        <p className="text-sm font-medium text-white">{canopyEvent.pact.title}</p>
                                        <p className="text-xs text-zinc-400 mt-2">
                                            {canopyEvent.pact.completed ? (
                                                <span className="text-green-400 font-bold">✨ TASK COMPLETED! ✨</span>
                                            ) : (
                                                <span>Status: Incomplete in Quest Log</span>
                                            )}
                                        </p>
                                    </div>

                                    {canopyEvent.pact.completed ? (
                                        <Button
                                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold font-serif py-3 rounded-xl shadow-lg"
                                            disabled={isCanopyClaiming}
                                            onClick={async () => {
                                                setIsCanopyClaiming(true);
                                                try {
                                                    if (userId) {
                                                        await Promise.all([
                                                            addToInventory(userId, { id: 'material-herb', name: 'Fey Herbs', quantity: 2, emoji: '🌿', type: 'material', category: 'material', rarity: 'rare' }),
                                                            gainExperience(40, 'canopy-event')
                                                        ]);
                                                    }
                                                    localStorage.removeItem('canopy-focus-pact');
                                                    toast({
                                                        title: "Focus Pact Fulfilled! 🌿",
                                                        description: "You obtained +2x Fey Herbs and +40 XP!",
                                                    });
                                                } catch (err) {
                                                    console.error("Failed to claim canopy blessing:", err);
                                                } finally {
                                                    setIsCanopyClaiming(false);
                                                    setCanopyEvent(null);
                                                }
                                            }}
                                        >
                                            {isCanopyClaiming ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Gathering Herbs...
                                                </span>
                                            ) : (
                                                "Gather Fey Herbs 🌿"
                                            )}
                                        </Button>
                                    ) : (
                                        <>
                                            <p className="text-xs text-zinc-400 text-center">
                                                Complete this task in your daily Quest board to claim fey ingredients!
                                            </p>
                                            <Button
                                                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 py-3 rounded-xl"
                                                onClick={() => setCanopyEvent(null)}
                                            >
                                                Return to Journey
                                            </Button>
                                        </>
                                    )}
                                </div>
                            ) : canopyEvent.availableHabits.length === 0 ? (
                                <div className="space-y-4 mt-4 text-center">
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        You have no uncompleted habits right now. All your quests are done, or no active tasks were found. Return tomorrow!
                                    </p>
                                    <Button
                                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 py-3 rounded-xl"
                                        onClick={() => setCanopyEvent(null)}
                                    >
                                        Return to Journey
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4 mt-4">
                                    <p className="text-sm text-zinc-400 leading-relaxed text-center">
                                        Select an active habit. Complete it to unlock rare fey herbs at the canopy!
                                    </p>
                                    <div className="max-h-[160px] overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                                        {canopyEvent.availableHabits.map((q: any) => (
                                            <button
                                                key={q.id}
                                                className="w-full text-left p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/10 text-xs transition-all text-zinc-300 flex items-center justify-between"
                                                disabled={isCanopyClaiming}
                                                onClick={async () => {
                                                    setIsCanopyClaiming(true);
                                                    try {
                                                        const pact = {
                                                            habitId: q.id,
                                                            title: q.title,
                                                            completed: false,
                                                            timestamp: Date.now()
                                                        };
                                                        localStorage.setItem('canopy-focus-pact', JSON.stringify(pact));
                                                        toast({
                                                            title: "Pledge Sealed! 🌿",
                                                            description: `You have pledged to complete: "${q.title}"`,
                                                        });
                                                    } finally {
                                                        setIsCanopyClaiming(false);
                                                        setCanopyEvent(null);
                                                    }
                                                }}
                                            >
                                                <span className="truncate mr-2 font-medium">{q.title}</span>
                                                <span className="shrink-0 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">PLEDGE</span>
                                            </button>
                                        ))}
                                    </div>
                                    <Button
                                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 py-2.5 rounded-xl text-xs"
                                        onClick={() => setCanopyEvent(null)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                )}

                {/* Frostfire Obelisk Modal */}
                {obeliskEvent?.open && (
                    <Dialog open={obeliskEvent.open} onOpenChange={() => setObeliskEvent(null)}>
                        <DialogContent className="w-[92%] sm:max-w-[420px] bg-zinc-950 border-zinc-800 text-zinc-100 overflow-hidden p-6 rounded-2xl h-auto max-h-[85vh]">
                            <div className="absolute inset-0 bg-blue-950/10 opacity-30 pointer-events-none blur-[100px]" />
                            <DialogHeader className="text-center items-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-blue-500/30 text-xs font-bold uppercase tracking-widest mb-4 text-blue-400">
                                    <Compass className="w-3 h-3" />
                                    Frostfire Obelisk
                                </div>
                                <DialogTitle className="text-3xl font-serif text-white tracking-tight mb-2">
                                    The Glacial Core
                                </DialogTitle>
                            </DialogHeader>

                            {obeliskEvent.loading ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                                    <p className="text-sm text-zinc-400">Absorbing frost energy...</p>
                                </div>
                            ) : obeliskEvent.alreadyCompleted ? (
                                <div className="space-y-4 mt-4 text-center">
                                    <p className="text-sm text-zinc-300 leading-relaxed">
                                        Your daily habits are fully completed today! The Glacial Obelisk glows with power.
                                    </p>
                                    <Button
                                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold font-serif py-3 rounded-xl shadow-lg"
                                        disabled={isObeliskClaiming}
                                        onClick={async () => {
                                            const today = new Date().toDateString();
                                            const lastClaimed = localStorage.getItem('obelisk-last-claimed');
                                            if (lastClaimed === today) {
                                                toast({
                                                    title: "Already Claimed",
                                                    description: "You have already received the Obelisk's glacial blessing today.",
                                                });
                                                setObeliskEvent(null);
                                            } else {
                                                setIsObeliskClaiming(true);
                                                try {
                                                    if (userId) {
                                                        await Promise.all([
                                                            addToInventory(userId, { id: 'material-crystal', name: 'Glacial Shard', quantity: 1, emoji: '❄️', type: 'material', category: 'material', rarity: 'rare' }),
                                                            gainGold(25, 'obelisk-event')
                                                        ]);
                                                    }
                                                    localStorage.setItem('obelisk-last-claimed', today);
                                                    toast({
                                                        title: "Glacial blessing obtained! ❄️",
                                                        description: "You received +1 Glacial Shard and +25 Gold!",
                                                    });
                                                } catch (err) {
                                                    console.error("Failed to claim obelisk:", err);
                                                } finally {
                                                    setIsObeliskClaiming(false);
                                                    setObeliskEvent(null);
                                                }
                                            }
                                        }}
                                    >
                                        {isObeliskClaiming ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Absorbing Shard...
                                            </span>
                                        ) : (
                                            "Claim Glacial Touch ❄️"
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4 mt-4">
                                    <p className="text-sm text-zinc-400 leading-relaxed text-center">
                                        Your daily habits are not yet completed. You can seal a frozen pact for 50 Gold to obtain a **Streak Freeze Scroll** to protect your streak.
                                    </p>
                                    <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex justify-between items-center text-xs">
                                        <span className="text-zinc-400">Pact Cost</span>
                                        <span className="font-bold text-amber-400">50 Gold</span>
                                    </div>
                                    <Button
                                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold font-serif py-3 rounded-xl shadow-lg"
                                        disabled={isObeliskClaiming}
                                        onClick={async () => {
                                            if (characterStats.gold < 50) {
                                                toast({
                                                    title: "Not Enough Gold",
                                                    description: `You need 50 Gold to purchase the Streak Freeze Pact. You have ${characterStats.gold} Gold.`,
                                                    variant: "destructive"
                                                });
                                                setObeliskEvent(null);
                                                return;
                                            }
                                            setIsObeliskClaiming(true);
                                            try {
                                                if (userId) {
                                                    await Promise.all([
                                                        gainGold(-50, 'obelisk-streak-freeze'),
                                                        addTileToInventory(userId, { id: 'streak-scroll', type: 'streak-scroll', name: 'Streak Scroll', quantity: 1, cost: 500, connections: [] })
                                                    ]);
                                                }
                                                toast({
                                                    title: "Streak Freeze Activated! ❄️",
                                                    description: "Deducted 50 Gold. A Streak Scroll has been added to your bag!",
                                                });
                                            } catch (err) {
                                                console.error("Failed to buy streak freeze:", err);
                                            } finally {
                                                setIsObeliskClaiming(false);
                                                setObeliskEvent(null);
                                            }
                                        }}
                                    >
                                        {isObeliskClaiming ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Sealing Pact...
                                            </span>
                                        ) : (
                                            "Activate Streak Freeze (50g) ❄️"
                                        )}
                                    </Button>
                                    <Button
                                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 py-2.5 rounded-xl text-xs mt-2"
                                        onClick={() => setObeliskEvent(null)}
                                    >
                                        Return to Journey
                                    </Button>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                )}

                {/* Fairy Ring Modal */}
                {fairyRingEvent?.open && (
                    <Dialog open={fairyRingEvent.open} onOpenChange={() => setFairyRingEvent(null)}>
                        <DialogContent className="w-[92%] sm:max-w-[420px] bg-zinc-950 border-zinc-800 text-zinc-100 overflow-hidden p-6 rounded-2xl h-auto max-h-[85vh]">
                            <div className="absolute inset-0 bg-amber-950/10 opacity-30 pointer-events-none blur-[100px]" />
                            <DialogHeader className="text-center items-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-amber-500/30 text-xs font-bold uppercase tracking-widest mb-4 text-amber-400">
                                    <Crown className="w-3 h-3" />
                                    Fairy Ring
                                </div>
                                <DialogTitle className="text-3xl font-serif text-white tracking-tight mb-2">
                                    The Pixie Ring
                                </DialogTitle>
                            </DialogHeader>

                            {fairyRingEvent.rolled ? (
                                <div className="space-y-4 mt-4 text-center">
                                    <div className="text-5xl animate-bounce">🧚‍♂️🎲</div>
                                    <p className="text-lg font-serif font-bold text-amber-400">Roll Result: {fairyRingEvent.rollResult}</p>
                                    <p className="text-sm text-zinc-300 leading-relaxed pr-2 pl-2">
                                        {fairyRingEvent.rewardMessage}
                                    </p>
                                    <Button
                                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 py-3 rounded-xl"
                                        onClick={() => setFairyRingEvent(null)}
                                    >
                                        Return to Journey
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4 mt-4">
                                    <p className="text-sm text-zinc-400 leading-relaxed text-center">
                                        Step inside the mushroom ring to deal with the pixies! You can play the Pixie Dance dice game once per day, or leave an offering.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <div className="flex flex-col items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800 space-y-2">
                                            <span className="text-3xl">🎲</span>
                                            <span className="text-xs font-bold text-zinc-200">Pixie Dance</span>
                                            <p className="text-[10px] text-zinc-500 text-center">Roll the die: win Pixie Dust or risk gold loss.</p>
                                            <Button
                                                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs py-1.5 rounded-lg mt-2"
                                                disabled={isFairyClaiming}
                                                onClick={async () => {
                                                    if (!userId) return;
                                                    const today = new Date().toDateString();
                                                    const lastPlayed = localStorage.getItem('fairy-last-played');
                                                    if (lastPlayed === today) {
                                                        toast({
                                                            title: "Already Danced",
                                                            description: "You have already danced with the pixies today. Return tomorrow!",
                                                        });
                                                        return;
                                                    }
                                                    setIsFairyClaiming(true);
                                                    try {
                                                        const roll = Math.ceil(Math.random() * 6);
                                                        let msg = "";
                                                        if (roll <= 2) {
                                                            await gainGold(-15, 'fairy-ring-event');
                                                            msg = "The pixies tickled you and stole 15 Gold! 🧚‍♂️";
                                                        } else if (roll <= 4) {
                                                            await Promise.all([
                                                                gainGold(-10, 'fairy-ring-event'),
                                                                addToInventory(userId, { id: 'material-wood', name: 'Elder Wood', quantity: 3, emoji: '🪵', type: 'material', category: 'material', rarity: 'common' })
                                                            ]);
                                                            msg = "The pixies traded your 10 Gold for 3x Elder Wood! 🪵";
                                                        } else {
                                                            await Promise.all([
                                                                addToInventory(userId, { id: 'material-crystal', name: 'Pixie Dust', quantity: 1, emoji: '✨', type: 'material', category: 'material', rarity: 'rare' }),
                                                                gainGold(50, 'fairy-ring-event'),
                                                                gainExperience(50, 'fairy-ring-event')
                                                            ]);
                                                            msg = "The pixies blessed you! You received Pixie Dust, 50 Gold, and 50 XP! ✨";
                                                        }
                                                        localStorage.setItem('fairy-last-played', today);
                                                        setFairyRingEvent({
                                                            open: true,
                                                            rolled: true,
                                                            rollResult: roll,
                                                            rewardMessage: msg
                                                        });
                                                    } catch (err) {
                                                        console.error("Fairy ring roll failed:", err);
                                                    } finally {
                                                        setIsFairyClaiming(false);
                                                    }
                                                }}
                                            >
                                                Dance
                                            </Button>
                                        </div>

                                        <div className="flex flex-col items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800 space-y-2">
                                            <span className="text-3xl">🪙</span>
                                            <span className="text-xs font-bold text-zinc-200">Gold Offering</span>
                                            <p className="text-[10px] text-zinc-500 text-center">Drop 10 Gold for a guaranteed random material.</p>
                                            <Button
                                                className="w-full bg-zinc-950 text-zinc-300 border border-zinc-850 text-xs py-1.5 rounded-lg mt-2 hover:bg-zinc-900"
                                                disabled={isFairyClaiming}
                                                onClick={async () => {
                                                    if (!userId) return;
                                                    if (characterStats.gold < 10) {
                                                        toast({
                                                            title: "Not Enough Gold",
                                                            description: "You need 10 Gold to leave an offering.",
                                                            variant: "destructive"
                                                        });
                                                        return;
                                                    }
                                                    setIsFairyClaiming(true);
                                                    try {
                                                        const materials: any[] = [
                                                            { id: 'material-wood', name: 'Elder Wood', quantity: 2, emoji: '🪵', type: 'material', category: 'material', rarity: 'common' },
                                                            { id: 'material-stone', name: 'Ironstone Blocks', quantity: 2, emoji: '🪨', type: 'material', category: 'material', rarity: 'common' },
                                                            { id: 'material-iron', name: 'Raw Iron Ore', quantity: 1, emoji: '⛏️', type: 'material', category: 'material', rarity: 'uncommon' }
                                                        ];
                                                        const selectedMat = materials[Math.floor(Math.random() * materials.length)] || materials[0]!;
                                                        await Promise.all([
                                                            gainGold(-10, 'fairy-ring-offering'),
                                                            addToInventory(userId, selectedMat)
                                                        ]);
                                                        toast({
                                                            title: "Offering Left 🪙",
                                                            description: `You left 10 Gold. The ring glowed and rewarded you with ${selectedMat.quantity}x ${selectedMat.name}!`,
                                                        });
                                                    } catch (err) {
                                                        console.error("Offering failed:", err);
                                                    } finally {
                                                        setIsFairyClaiming(false);
                                                        setFairyRingEvent(null);
                                                    }
                                                }}
                                            >
                                                Offer 10g
                                            </Button>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 py-2.5 rounded-xl text-xs mt-2"
                                        onClick={() => setFairyRingEvent(null)}
                                    >
                                        Return to Journey
                                    </Button>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                )}

                {/* Passive Rewards Treasury UI */}
                {passiveRewards && (passiveRewards.gold > 0 || passiveRewards.xp > 0) && (
                    <div className="fixed top-24 right-4 z-40 animate-in slide-in-from-right-5 fade-in duration-500">
                        <Card className="bg-gradient-to-br from-zinc-900 to-amber-950/80 border-amber-500/50 shadow-xl shadow-amber-900/20  w-64 overflow-hidden group hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-50 animate-pulse" />
                            <CardContent className="p-4 relative">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-amber-400 text-sm uppercase tracking-wider flex items-center gap-2">
                                        <Crown className="w-4 h-4" /> {TEXT_CONTENT.realm.treasury.title}
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-amber-200">
                                        <span className="text-xs text-amber-400/80">{TEXT_CONTENT.realm.treasury.taxes}</span>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="flex-1 bg-zinc-950 rounded p-2 border border-amber-500/20 flex flex-col items-center">
                                            <span className="text-xl font-bold text-amber-400">{passiveRewards.gold}</span>
                                            <span className="text-[10px] text-amber-500/70 uppercase">{TEXT_CONTENT.realm.treasury.gold}</span>
                                        </div>
                                        <div className="flex-1 bg-zinc-950 rounded p-2 border border-blue-500/20 flex flex-col items-center">
                                            <span className="text-xl font-bold text-blue-400">{passiveRewards.xp}</span>
                                            <span className="text-[10px] text-blue-500/70 uppercase">{TEXT_CONTENT.realm.treasury.xp}</span>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold border-t border-white/20 shadow-lg active:scale-95 transition-all"
                                        onClick={handleCollectRewards}
                                    >
                                        {TEXT_CONTENT.realm.treasury.collect}
                                    </Button>
                                    <div className="text-center">
                                        <button
                                            onClick={() => {
                                                setInventoryTab('guide');
                                                setShowInventory(true);
                                            }}
                                            className="text-[10px] text-amber-500/70 hover:text-amber-400 underline decoration-dotted transition-colors"
                                        >
                                            {TEXT_CONTENT.realm.treasury.earnMore}
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </RealmAnimationWrapper>
        </div >
    );
}
