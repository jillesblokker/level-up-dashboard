import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Tile, TileType } from '@/types/tiles';
import { useDataLoaders } from './use-data-loaders';
import { createBaseGrid, GRID_COLS, INITIAL_ROWS, EXPANSION_INCREMENT, defaultTile, getTileImage, INITIAL_POS } from '@/app/realm/realm-utils';
import { getUserScopedItem, setUserScopedItem } from '@/lib/user-scoped-storage';
import { z } from 'zod';
import { loadAndProcessInitialGrid } from '@/lib/grid-loader';
import logger from '@/lib/logger';

// Schema for tile validation
const TileSchema = z.object({
    id: z.string(),
    type: z.string(),
    x: z.number(),
    y: z.number(),
    revealed: z.boolean().optional(),
    isVisited: z.boolean().optional(),
    hasMonster: z.any().optional(),
});

const GridSchema = z.array(z.array(TileSchema));

export function useRealmGridManager(userId: string | undefined, isMounted: boolean) {
    const { toast } = useToast();
    const { loadGridData, saveGridData, loadCharacterPosition, saveCharacterPosition } = useDataLoaders();

    const [grid, setGrid] = useState<Tile[][]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [characterPosition, setCharacterPosition] = useState<{ x: number; y: number }>(INITIAL_POS);
    const [expansions, setExpansions] = useState<number>(0);
    const [autoSave, setAutoSave] = useState(true);
    const [gridInitialized, setGridInitialized] = useState(false);
    const userPlacedTilesRef = useRef<Record<string, number>>({});

    // Load placement counts
    useEffect(() => {
        if (typeof window !== 'undefined' && isMounted) {
            const savedCounts = getUserScopedItem('user-placed-tile-counts');
            if (savedCounts) {
                try {
                    userPlacedTilesRef.current = JSON.parse(savedCounts);
                } catch (e) {
                    console.error('Failed to parse user-placed-tile-counts', e);
                }
            }
        }
    }, [isMounted]);

    const loadAllData = useCallback(async () => {
        if (!userId || !isMounted) return;

        try {
            setIsLoading(true);

            // Load Grid
            const gridResult = await loadGridData(userId);
            // gridResult IS the data (Tile[][]), not { data: ... }
            const isGridArray = Array.isArray(gridResult);
            logger.info(`[useRealmGridManager] Loaded grid data: ${gridResult ? `(Array length: ${isGridArray ? gridResult.length : 'N/A'}, Type: ${typeof gridResult})` : 'null/undefined'}`, 'RealmGrid');

            if (gridResult && isGridArray && gridResult.length > 0) {
                try {
                    // Basic validation
                    const validatedGrid = GridSchema.parse(gridResult);
                    setGrid(validatedGrid as unknown as Tile[][]);
                    console.log('[useRealmGridManager] Grid validated and set.');
                } catch (e) {
                    console.warn('Grid validation failed, using raw data', e);
                    setGrid(gridResult);
                }
            } else {
                // Fallback to initial grid (seed)
                console.log('[useRealmGridManager] No saved grid found or invalid format, loading initial grid from seed...');
                const initialGrid = await loadAndProcessInitialGrid();
                setGrid(initialGrid);
            }

            // Load Position
            const posResult = await loadCharacterPosition(userId);
            if (posResult && typeof posResult.x === 'number' && typeof posResult.y === 'number') {
                setCharacterPosition(posResult);
            } else {
                setCharacterPosition(INITIAL_POS);
            }

            // Load Expansions
            const savedExpansions = localStorage.getItem('realm-expansions');
            if (savedExpansions) setExpansions(parseInt(savedExpansions));

            setGridInitialized(true);
        } catch (error) {
            console.error('Failed to load realm data', error);
            toast({ title: 'Error', description: 'Failed to load your realm progress.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [userId, isMounted, loadGridData, loadCharacterPosition, toast]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // Debounced Auto-save
    useEffect(() => {
        if (!autoSave || isLoading || !userId || !gridInitialized) return;

        const saveTimeout = setTimeout(async () => {
            try {
                setSaveStatus('saving');
                const result = await saveGridData(userId, grid);
                if (result.success) {
                    setSaveStatus('saved');
                    setTimeout(() => setSaveStatus('idle'), 2000);
                } else {
                    setSaveStatus('error');
                }
            } catch (error) {
                setSaveStatus('error');
            }
        }, 5000); // 5 second debounce

        return () => clearTimeout(saveTimeout);
    }, [grid, autoSave, isLoading, userId, gridInitialized, saveGridData]);

    const expandMap = useCallback(async () => {
        const newSize = INITIAL_ROWS + (expansions + 1) * EXPANSION_INCREMENT;
        let updatedGrid: Tile[][] = [];

        setGrid(prevGrid => {
            const newGrid = Array.from({ length: newSize }, (_, y) =>
                Array.from({ length: GRID_COLS }, (_, x) => {
                    const existingTile = prevGrid[y]?.[x];
                    if (existingTile) return existingTile;

                    return {
                        ...defaultTile('empty'),
                        x,
                        y,
                        id: `${x}-${y}`,
                        image: getTileImage('empty')
                    };
                })
            );
            updatedGrid = newGrid;
            return newGrid;
        });

        const newExpansions = expansions + 1;
        setExpansions(newExpansions);
        localStorage.setItem('realm-expansions', newExpansions.toString());

        // Immediately save the new grid to backend
        if (userId) {
            setSaveStatus('saving');
            try {
                // Wait a microtask to ensure updatedGrid is captured if needed, though closure captures it here
                const result = await saveGridData(userId, updatedGrid);
                if (result.success) {
                    setSaveStatus('saved');
                    setTimeout(() => setSaveStatus('idle'), 2000);
                } else {
                    setSaveStatus('error');
                    toast({ title: 'Error', description: 'Failed to save expanded map.', variant: 'destructive' });
                }
            } catch (error) {
                console.error('Failed to save expanded map:', error);
                setSaveStatus('error');
            }
        }

        toast({
            title: "Realm Expanded!",
            description: `Your realm is now larger. You can now place tiles up to ${newSize} rows deep!`,
        });
    }, [expansions, userId, saveGridData, toast]);

    const updateCharacterPosition = useCallback((x: number, y: number) => {
        setCharacterPosition({ x, y });
        if (userId) saveCharacterPosition(userId, { x, y });
    }, [userId, saveCharacterPosition]);

    const recordTilePlacement = useCallback((tileType: string) => {
        const key = `${tileType}_tiles_placed`;
        userPlacedTilesRef.current[key] = (userPlacedTilesRef.current[key] || 0) + 1;
        setUserScopedItem('user-placed-tile-counts', JSON.stringify(userPlacedTilesRef.current));
    }, []);

    return {
        grid, setGrid,
        isLoading,
        saveStatus,
        characterPosition, setCharacterPosition: updateCharacterPosition,
        expansions, expandMap,
        autoSave, setAutoSave,
        gridInitialized,
        userPlacedTilesRef,
        recordTilePlacement
    };
}
