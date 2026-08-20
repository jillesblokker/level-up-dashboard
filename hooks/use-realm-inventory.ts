import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Tile, TileType } from '@/types/core-interfaces';
type TileInventoryItem = Tile;
import { useDataLoaders } from './use-data-loaders';
import { initialInventory } from '@/app/realm/realm-utils';

export function useRealmInventory(userId: string | undefined, isMounted: boolean) {
    const { toast } = useToast();
    const { loadTileInventory, saveTileInventory } = useDataLoaders();

    const [inventory, setInventory] = useState<Record<string, Tile>>(initialInventory);
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
                const hasFoundationTiles = items.some(item => foundationTiles.includes(item.type) && (item.quantity ?? 0) > 0);

                if (!hasFoundationTiles && userLevel >= 1) {
                    foundationTiles.forEach(tileType => {
                        const existingItem = items.find(item => item.type === tileType);
                        if (!existingItem || (existingItem.quantity ?? 0) === 0) {
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

                // MERGE LOCAL SANDBOX TILES (e.g. claimed siege engines)
                const localSandbox = (() => {
                    try { return JSON.parse(localStorage.getItem('sandbox-inventory') || '{}'); }
                    catch { return {}; }
                })();

                const siegeNames: Record<string, string> = {
                    siege_catapult: 'Catapult',
                    siege_scorpion: 'Scorpion',
                    siege_battering_ram: 'Battering ram',
                    siege_trebuchet: 'Trebuchet',
                    siege_tower: 'Siegetower',
                    siege_flame_ballista: 'Balista',
                    siege_spring_cannon: 'Canon',
                    siege_ether_mortar: 'Flaming catapult',
                    siege_dragon_mortar: 'Flaming scorpion',
                    siege_astral_projector: 'Flaming trebuchet',
                };

                Object.entries(localSandbox).forEach(([tileType, qty]) => {
                    const quantity = Number(qty) || 0;
                    if (quantity > 0) {
                        const existingIdx = items.findIndex(i => i.type === tileType || i.id === tileType);
                        const img = tileType.startsWith('siege_') ? `/images/kingdom-tiles/${tileType}.webp` : `/images/tiles/${tileType}-tile.png`;
                        if (existingIdx >= 0) {
                            const curItem = items[existingIdx];
                            if (curItem) {
                                items[existingIdx] = {
                                    ...curItem,
                                    quantity: Math.max(curItem.quantity || 0, quantity),
                                    image: curItem.image || img
                                };
                            }
                        } else {
                            items.push({
                                id: tileType,
                                name: siegeNames[tileType] || tileType,
                                type: tileType as TileType,
                                quantity: quantity,
                                cost: 500,
                                connections: [],
                                description: 'Deployable siege engine',
                                rotation: 0,
                                revealed: true,
                                isVisited: false,
                                x: 0,
                                y: 0,
                                ariaLabel: `${tileType} tile`,
                                image: img,
                            });
                        }
                    }
                });

                setInventoryAsItems(items);

                // Update the legacy inventory mapping if still needed
                const mergedInventory = { ...initialInventory };
                items.forEach(item => {
                    const existing = mergedInventory[item.type];
                    if (existing) {
                        mergedInventory[item.type] = {
                            ...existing,
                            id: existing.id || item.type,
                            quantity: item.quantity ?? 0,
                            owned: item.quantity ?? 0
                        } as Tile;
                    } else {
                        mergedInventory[item.type] = {
                            ...item,
                            id: item.id || item.type,
                            quantity: item.quantity ?? 0,
                            owned: item.quantity ?? 0
                        } as Tile;
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

        window.addEventListener('tile-inventory-update', loadInventory);
        window.addEventListener('inventory-updated', loadInventory);
        window.addEventListener('add-realm-tile-inventory', loadInventory);
        window.addEventListener('storage', loadInventory);

        return () => {
            window.removeEventListener('tile-inventory-update', loadInventory);
            window.removeEventListener('inventory-updated', loadInventory);
            window.removeEventListener('add-realm-tile-inventory', loadInventory);
            window.removeEventListener('storage', loadInventory);
        };
    }, [loadInventory]);

    const updateTileQuantity = useCallback(async (tileType: TileType, delta: number) => {
        setInventoryAsItems(prev => {
            let found = false;
            const newItems = prev.map(item => {
                if (item.type === tileType || item.id === tileType) {
                    found = true;
                    return { ...item, quantity: Math.max(0, (item.quantity || 0) + delta) };
                }
                return item;
            });

            if (!found && delta > 0) {
                // Create new item if not found
                newItems.push({
                    id: tileType,
                    type: tileType,
                    name: tileType, // Fallback name
                    quantity: delta,
                    cost: 0,
                    connections: [],
                    description: 'Material',
                    rotation: 0,
                    revealed: true,
                    isVisited: false,
                    x: 0,
                    y: 0,
                    ariaLabel: tileType,
                    image: '', // No image for pure materials
                } as TileInventoryItem);
            }

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
            if (!prev[tileType] && delta > 0) {
                // Add to legacy inventory if missing
                return {
                    ...prev,
                    [tileType]: {
                        id: tileType,
                        type: tileType,
                        name: tileType,
                        quantity: delta,
                        owned: delta,
                        // Default props
                        connections: [],
                        rotation: 0,
                        revealed: true,
                        isVisited: false,
                        x: 0,
                        y: 0,
                        ariaLabel: tileType,
                        image: '',
                        description: ''
                    } as Tile
                };
            }
            if (!prev[tileType]) return prev;

            const existingTile = prev[tileType];
            const newQuantity = Math.max(0, (existingTile?.quantity ?? 0) + delta);
            return {
                ...prev,
                [tileType]: {
                    ...existingTile,
                    id: existingTile?.id || tileType,
                    quantity: newQuantity,
                    owned: newQuantity
                } as Tile
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
