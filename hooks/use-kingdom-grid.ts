import { useState, useEffect, useCallback, useRef } from 'react';
import { Tile, TileType, ConnectionDirection } from '@/types/tiles';
import { KINGDOM_TILES } from '@/lib/kingdom-tiles';
import {
    saveKingdomGrid,
    loadKingdomGrid,
} from '@/lib/supabase-persistence-client';
import { useToast } from "@/components/ui/use-toast";

const KINGDOM_GRID_ROWS = 12;
const KINGDOM_GRID_COLS = 6;
const VACANT_TILE_IMAGE = '/images/kingdom-tiles/Vacant.png';

// Helper to create an empty kingdom grid
export function createEmptyKingdomGrid(): Tile[][] {
    console.log('[Kingdom] createEmptyKingdomGrid called');

    const grid = Array.from({ length: KINGDOM_GRID_ROWS }, (_, y) =>
        Array.from({ length: KINGDOM_GRID_COLS }, (_, x) => ({
            id: `vacant-${x}-${y}`,
            type: 'vacant' as TileType,
            name: 'Vacant',
            description: 'An empty plot of land.',
            connections: [] as ConnectionDirection[],
            rotation: 0 as 0 | 90 | 180 | 270,
            revealed: true,
            isVisited: false,
            x,
            y,
            ariaLabel: `Vacant tile at ${x},${y}`,
            image: VACANT_TILE_IMAGE,
        }))
    );

    // Add some default kingdom tiles to make the grid interesting
    const defaultKingdomTiles = [
        { x: 1, y: 1, type: 'well' as TileType },
        { x: 2, y: 1, type: 'blacksmith' as TileType },
        { x: 3, y: 1, type: 'fisherman' as TileType },
        { x: 4, y: 1, type: 'sawmill' as TileType },
        { x: 5, y: 1, type: 'windmill' as TileType },
        { x: 1, y: 2, type: 'grocery' as TileType },
        { x: 2, y: 2, type: 'castle' as TileType },
        { x: 3, y: 2, type: 'temple' as TileType },
        { x: 4, y: 2, type: 'fountain' as TileType },
        { x: 5, y: 2, type: 'pond' as TileType },
        { x: 1, y: 3, type: 'foodcourt' as TileType },
        { x: 2, y: 3, type: 'vegetables' as TileType },
        { x: 3, y: 3, type: 'wizard' as TileType },
        { x: 4, y: 3, type: 'mayor' as TileType },
        { x: 5, y: 3, type: 'inn' as TileType },
        { x: 1, y: 4, type: 'library' as TileType },
        { x: 2, y: 4, type: 'mansion' as TileType },
        { x: 3, y: 4, type: 'jousting' as TileType },
        { x: 4, y: 4, type: 'archery' as TileType },
        { x: 5, y: 4, type: 'watchtower' as TileType },
    ];

    defaultKingdomTiles.forEach(({ x, y, type }) => {
        const kingdomTile = KINGDOM_TILES.find(kt => kt.id === type);
        if (kingdomTile && grid[y] && grid[y][x]) {
            try {
                grid[y][x] = {
                    id: `${type}-${x}-${y}`,
                    type: type,
                    name: kingdomTile.name || 'Unknown Tile',
                    description: kingdomTile.clickMessage || 'A mysterious tile in your kingdom.',
                    connections: [],
                    rotation: 0 as 0 | 90 | 180 | 270,
                    revealed: true,
                    isVisited: false,
                    x,
                    y,
                    ariaLabel: `${kingdomTile.name || 'Unknown Tile'} at ${x},${y}`,
                    image: kingdomTile.image || '/images/kingdom-tiles/default.png',
                };
            } catch (error) {
                console.error(`[Kingdom] Error creating tile ${type} at position (${x}, ${y}):`, error);
            }
        }
    });

    return grid;
}

export function useKingdomGrid(userId: string | undefined) {
    const [kingdomGrid, setKingdomGrid] = useState<Tile[][]>(createEmptyKingdomGrid());
    const [isLoadingGrid, setIsLoadingGrid] = useState(true);
    const { toast } = useToast();

    // Load grid on mount or user change
    useEffect(() => {
        if (!userId) {
            setKingdomGrid(createEmptyKingdomGrid());
            setIsLoadingGrid(false);
            return;
        }

        const loadGrid = async () => {
            setIsLoadingGrid(true);
            try {
                const loadedGrid = await loadKingdomGrid(userId);
                if (loadedGrid && loadedGrid.length > 0) {
                    // Merge with default/empty grid structure to ensure dimensions
                    const baseGrid = createEmptyKingdomGrid();
                    // Logic to merge loaded grid onto base grid...
                    // For now, if loadedGrid is valid, use it, but ensure it matches dimensions if needed
                    // Simpler: Just use loadedGrid if it's the right shape, or map it.
                    // Assuming loadKingdomGrid returns a valid Tile[][] structure.

                    // Re-implement basic merge logic if needed, or trust persistence
                    // For safety, let's verify dimensions:
                    if (loadedGrid.length === KINGDOM_GRID_ROWS && loadedGrid[0]?.length === KINGDOM_GRID_COLS) {
                        setKingdomGrid(loadedGrid);
                    } else {
                        // Dimension mismatch? Adapt or just use loaded (it might be dynamic in future)
                        // For now, trusting loaded grid but logging.
                        console.warn("Loaded grid dimensions differ from default:", loadedGrid.length);
                        setKingdomGrid(loadedGrid);
                    }
                } else {
                    // No grid found, save the default one
                    const newGrid = createEmptyKingdomGrid();
                    setKingdomGrid(newGrid);
                    await saveKingdomGrid(newGrid, userId);
                }
            } catch (error) {
                console.error("Failed to load kingdom grid:", error);
                toast({
                    title: "Error Loading Kingdom",
                    description: "Could not load your kingdom layout. Using default.",
                    variant: "destructive"
                });
            } finally {
                setIsLoadingGrid(false);
            }
        };

        loadGrid();
    }, [userId, toast]);

    // Save grid function
    const saveGrid = useCallback(async (newGrid: Tile[][]) => {
        if (!userId) return;
        setKingdomGrid(newGrid);
        try {
            await saveKingdomGrid(newGrid, userId);
        } catch (error) {
            console.error("Failed to save kingdom grid:", error);
            toast({
                title: "Save Failed",
                description: "Your kingdom changes couldn't be saved.",
                variant: "destructive"
            });
        }
    }, [userId, toast]);

    const updateTile = useCallback((x: number, y: number, newTile: Tile) => {
        setKingdomGrid(prev => {
            const next = [...prev.map(row => [...row])];
            if (next[y] && next[y][x]) {
                next[y][x] = newTile;
            }
            // Trigger save side effect? 
            // Better to split update state vs save persistence, 
            // but for this refactor we can keep it manual or debounce.
            return next;
        });
        // Note: Calling saveGrid here would need the new state, which isn't available immediately.
        // The consumer should likely call saveGrid(updatedGrid).
    }, []);

    return {
        kingdomGrid,
        setKingdomGrid, // Expose setter for complex updates
        isLoadingGrid,
        saveGrid,
        createEmptyKingdomGrid
    };
}
