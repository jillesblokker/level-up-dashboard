import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Tile, TileType, InventoryItem as TileInventoryItem } from '@/types/tiles';
import { useDataLoaders } from './use-data-loaders';
import { initialInventory } from '@/app/realm/realm-utils';

export function useRealmInventory(userId: string | undefined, isMounted: boolean) {
    const { toast } = useToast();
    const { loadTileInventory, saveTileInventory } = useDataLoaders();

    const [inventory, setInventory] = useState<Record<TileType, Tile>>(initialInventory);
    const [inventoryAsItems, setInventoryAsItems] = useState<TileInventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadInventory = useCallback(async () => {
        if (!userId || !isMounted) return;

        try {
            setIsLoading(true);
            const userLevel = (() => {
                try {
                    const stats = JSON.parse(localStorage.getItem('character-stats') || '{}');
                    return stats.level || 1;
                } catch { return 1; }
            })();

            const inventoryResult = await loadTileInventory(userId);

            // inventoryResult IS the data object (Record<string, any>)
            if (inventoryResult && typeof inventoryResult === 'object') {
                const items: TileInventoryItem[] = Object.values(inventoryResult)
                    .filter((t: any) => t && t.type !== 'empty' && !['sheep', 'horse', 'special', 'swamp', 'treasure', 'monster'].includes(t.type))
                    .map((t: any) => ({
                        ...t,
                        cost: t.cost ?? 0,
                        quantity: t.quantity || 0,
                    }));

                const foundationTiles = ['grass', 'water', 'forest', 'mountain'];
                const hasFoundationTiles = items.some(item => foundationTiles.includes(item.type) && item.quantity > 0);

                if (!hasFoundationTiles && userLevel >= 1) {
                    foundationTiles.forEach(tileType => {
                        const existingItem = items.find(item => item.type === tileType);
                        if (!existingItem || existingItem.quantity === 0) {
                            items.push({
                                id: tileType,
                                name: tileType.charAt(0).toUpperCase() + tileType.slice(1),
                                type: tileType as TileType,
                                quantity: 5,
                                cost: 25, // default cost
                                connections: [],
                                description: '',
                                rotation: 0,
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

                // MERGE MISSING DEFAULT TILES (Fix for new tiles not showing up)
                Object.entries(initialInventory).forEach(([key, val]) => {
                    // If this tile type is meant to be owned by default (owned > 0)
                    // and it is NOT in the current items list
                    if (val.owned && val.owned > 0 && !items.some(i => i.type === key)) {
                        items.push({
                            ...val,
                            quantity: val.owned, // explicit quantity from default
                            // ensure required fields
                            id: val.id || key,
                            image: val.image || `/images/tiles/${key}-tile.png`
                        } as TileInventoryItem);
                    }
                });
                setInventoryAsItems(items);

                // Update the legacy inventory mapping if still needed
                const mergedInventory = { ...initialInventory };
                items.forEach(item => {
                    if (mergedInventory[item.type]) {
                        mergedInventory[item.type] = {
                            ...mergedInventory[item.type],
                            quantity: item.quantity,
                            owned: item.quantity
                        };
                    }
                });
                setInventory(mergedInventory);
            }
        } catch (error) {
            console.error('Failed to load inventory', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, isMounted, loadTileInventory]);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    const updateTileQuantity = useCallback(async (tileType: TileType, delta: number) => {
        setInventoryAsItems(prev => {
            const newItems = prev.map(item => {
                if (item.type === tileType) {
                    return { ...item, quantity: Math.max(0, (item.quantity || 0) + delta) };
                }
                return item;
            });

            // Sync with backend
            if (userId) {
                const updatedInventory: Record<string, any> = {};
                newItems.forEach(item => {
                    updatedInventory[item.id || item.type] = item;
                });
                saveTileInventory(userId, updatedInventory);
            }

            return newItems;
        });

        // Sync legacy inventory
        setInventory(prev => {
            if (!prev[tileType]) return prev;
            const newQuantity = Math.max(0, (prev[tileType].quantity || 0) + delta);
            return {
                ...prev,
                [tileType]: { ...prev[tileType], quantity: newQuantity, owned: newQuantity }
            };
        });
    }, [userId, saveTileInventory]);

    return {
        inventory,
        inventoryAsItems,
        setInventoryAsItems,
        isLoading,
        updateTileQuantity
    };
}
