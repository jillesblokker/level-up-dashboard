import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Tile, TileType } from '@/types/core-interfaces';
import { useDataLoaders } from './use-data-loaders';
import { createBaseGrid, GRID_COLS, INITIAL_ROWS, EXPANSION_INCREMENT, defaultTile, getTileImage, INITIAL_POS } from '@/app/realm/realm-utils';
import { getUserScopedItem, setUserScopedItem } from '@/lib/user-scoped-storage';
import { z } from 'zod';
import { loadAndProcessInitialGrid, createTileFromNumeric } from '@/lib/grid-loader';
import logger from '@/lib/logger';
import { useAuth } from '@clerk/nextjs';

// Schemas for validation
const TileSchema = z.object({
    x: z.number(),
    y: z.number(),
    type: z.string(),
    id: z.string().optional(),
    isVisited: z.boolean().optional(),
    hasMonster: z.string().optional(),
    monsterAchievementId: z.string().optional(),
    image: z.string().optional(),
    owned: z.number().optional()
});

const GridSchema = z.array(z.array(TileSchema));

export function useRealmGridManager(userId: string | undefined, isMounted: boolean) {
    const [grid, setGrid] = useState<Tile[][]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [characterPosition, setCharacterPosition] = useState<{ x: number, y: number }>(INITIAL_POS);
    const [expansions, setExpansions] = useState(0);
    const [autoSave, setAutoSave] = useState(true);
    const [gridInitialized, setGridInitialized] = useState(false);
    const userPlacedTilesRef = useRef<Record<string, number>>({});

    const { loadGridData, saveGridData, loadCharacterPosition, saveCharacterPosition } = useDataLoaders();
    const { toast } = useToast();
    const { getToken } = useAuth();

    const loadAllData = useCallback(async () => {
        if (!userId || !isMounted) return;

        try {
            setIsLoading(true);

            // Load Grid
            const gridResult: any = await loadGridData(userId);
            logger.info(`[useRealmGridManager] Loaded grid data type: ${typeof gridResult}`, 'RealmGrid');

            let finalGrid: Tile[][] | null = null;

            if (gridResult && gridResult.tiles && Array.isArray(gridResult.tiles)) {
                // Normalized Grid Data
                logger.info('[useRealmGridManager] Detected normalized grid data. Reconstructing...');
                const tiles = gridResult.tiles;

                const newGrid = createBaseGrid();
                let maxY = INITIAL_ROWS - 1;
                tiles.forEach((t: any) => { if (t.y > maxY) maxY = t.y; });

                while (newGrid.length <= maxY) {
                    const y = newGrid.length;
                    const row = Array.from({ length: GRID_COLS }, (_, x) => ({
                        ...defaultTile('empty'),
                        x,
                        y,
                        id: `${x}-${y}`,
                        image: getTileImage('empty')
                    }));
                    newGrid.push(row);
                }

                tiles.forEach((t: any) => {
                    if (newGrid[t.y] && newGrid[t.y]![t.x]) {
                        const reconstructedTile = createTileFromNumeric(t.tile_type, t.x, t.y);
                        if (t.meta) {
                            Object.assign(reconstructedTile, t.meta);
                        }

                        // FIX: Force correct image path for road tiles, overriding any stale metadata
                        if (reconstructedTile.type === 'crossroad') {
                            reconstructedTile.image = '/images/kingdom-tiles/Crossroad.png';
                        } else if (reconstructedTile.type === 'straightroad') {
                            reconstructedTile.image = '/images/kingdom-tiles/Straightroad.png';
                        } else if (reconstructedTile.type === 'cornerroad') {
                            reconstructedTile.image = '/images/kingdom-tiles/Cornerroad.png';
                        } else if (reconstructedTile.type === 'pyramid') {
                            reconstructedTile.image = '/images/tiles/pyramid-tile.png';
                        } else if (reconstructedTile.type === 'whispering-well') {
                            reconstructedTile.image = '/images/tiles/whispering-well-tile.png';
                        } else if (reconstructedTile.type === 'sphinx-gates') {
                            reconstructedTile.image = '/images/tiles/sphinx-gates-tile.png';
                        }

                        newGrid[t.y]![t.x] = reconstructedTile;
                    }
                });

                finalGrid = newGrid;

                const inferredExpansions = Math.max(0, Math.ceil((newGrid.length - INITIAL_ROWS) / EXPANSION_INCREMENT));
                if (inferredExpansions > 0) {
                    setExpansions(inferredExpansions);
                }

            } else if (Array.isArray(gridResult) && gridResult.length > 0) {
                // Legacy Blob Format
                try {
                    const validatedGrid = GridSchema.parse(gridResult);
                    finalGrid = validatedGrid as unknown as Tile[][];
                    logger.info('[useRealmGridManager] Loaded legacy blob grid. Migrating to normalized storage...');

                    // Auto-migrate to new persistence (Fire and forget)
                    (async () => {
                        try {
                            const { tileTypeToNumeric } = await import('@/lib/grid-loader');
                            const tilesToMigrate: any[] = [];

                            finalGrid?.forEach(row => {
                                row.forEach(tile => {
                                    tilesToMigrate.push({
                                        x: tile.x,
                                        y: tile.y,
                                        tile_type: tileTypeToNumeric[tile.type] || 0,
                                        meta: {
                                            isVisited: tile.isVisited,
                                            hasMonster: tile.hasMonster,
                                            monsterAchievementId: tile.monsterAchievementId,
                                            image: tile.image
                                        }
                                    });
                                });
                            });

                            if (tilesToMigrate.length > 0) {
                                const token = await getToken({ template: 'supabase' });
                                await fetch('/api/realm-tiles', {
                                    method: 'POST',
                                    credentials: 'include',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        ...(token && { 'Authorization': `Bearer ${token}` })
                                    },
                                    body: JSON.stringify(tilesToMigrate)
                                });
                                logger.info('[useRealmGridManager] Migration successful: ' + tilesToMigrate.length + ' tiles.');
                            }
                        } catch (err) {
                            console.error('[useRealmGridManager] Migration failed:', err);
                        }
                    })();

                } catch (e) {
                    console.warn('Grid validation failed, using raw data', e);
                    finalGrid = gridResult;
                }
            }

            if (finalGrid) {
                setGrid(finalGrid);
            } else {
                logger.info('[useRealmGridManager] No saved grid found, loading initial seed...');
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
    }, [userId, isMounted, loadGridData, loadCharacterPosition, toast, getToken]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // Debounced Auto-save
    useEffect(() => {
        if (!autoSave || isLoading || !userId || !gridInitialized) return;

        const saveTimeout = setTimeout(async () => {
            try {
                // Only save the whole grid periodically if autoSave is on
                // We rely on per-tile saves for placement/deletion
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
        }, 30000); // Increased to 30 seconds to save egress

        return () => clearTimeout(saveTimeout);
    }, [grid, autoSave, isLoading, userId, gridInitialized, saveGridData]);

    const expandMap = useCallback(async () => {
        const newSize = INITIAL_ROWS + (expansions + 1) * EXPANSION_INCREMENT;
        let diffTiles: Tile[] = [];

        setGrid(prevGrid => {
            const newGrid = Array.from({ length: newSize }, (_, y) =>
                Array.from({ length: GRID_COLS }, (_, x) => {
                    const existingTile = prevGrid[y]?.[x];
                    if (existingTile) return existingTile;

                    // New Tile
                    let randomType: TileType = 'empty';
                    const roll = Math.random();
                    if (roll < 0.015) {
                        randomType = 'pyramid';
                    } else if (roll < 0.03) {
                        randomType = 'whispering-well';
                    } else if (roll < 0.045) {
                        randomType = 'sphinx-gates';
                    }

                    const newTile = {
                        ...defaultTile(randomType),
                        x,
                        y,
                        id: `${x}-${y}`,
                        image: getTileImage(randomType)
                    };
                    diffTiles.push(newTile);
                    return newTile;
                })
            );
            return newGrid;
        });

        const newExpansions = expansions + 1;
        setExpansions(newExpansions);
        localStorage.setItem('realm-expansions', newExpansions.toString());

        // Save expansion to Server (Batch Insert)
        if (userId && diffTiles.length > 0) {
            setSaveStatus('saving');
            try {
                const { tileTypeToNumeric } = await import('@/lib/grid-loader');

                const payload = diffTiles.map(t => ({
                    x: t.x,
                    y: t.y,
                    tile_type: tileTypeToNumeric[t.type] || 0,
                    meta: {}
                }));

                const token = await getToken({ template: 'supabase' });
                const res = await fetch('/api/realm-tiles', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    throw new Error('Failed to save expansion tiles');
                }

                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Failed to save expanded map:', error);
                setSaveStatus('error');
                toast({ title: 'Error', description: 'Failed to save expanded map.', variant: 'destructive' });
            }
        }

        toast({
            title: "Realm Expanded!",
            description: `Your realm is now larger. You can now place tiles up to ${newSize} rows deep!`,
        });
    }, [expansions, userId, toast, getToken]);

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
