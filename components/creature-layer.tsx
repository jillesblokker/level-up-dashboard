import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CreatureDefinition, CREATURE_DEFINITIONS } from '@/lib/creature-mapping';
import { CreatureSprite } from './creature-sprite';
import { Tile } from '@/types/tiles';
import { useUser } from '@clerk/nextjs';

interface CreatureLayerProps {
    grid: Tile[][];
    tileSize: number;
    mapType: 'kingdom' | 'realm';
    playerPosition?: { x: number; y: number }; // Optional: actual player position for tooltips
    onCreatureClick?: (creature: ActiveCreature) => void;
}

interface ActiveCreature {
    instanceId: string;
    definitionId: string;
    position: { row: number; col: number };
    targetPosition: { row: number; col: number };
    state: 'idle' | 'walking';
}

export function CreatureLayer({ grid, mapType, playerPosition, onCreatureClick }: Omit<CreatureLayerProps, 'tileSize'>) {
    const [activeCreatures, setActiveCreatures] = useState<ActiveCreature[]>([]);
    const [playerTile, setPlayerTile] = useState<{ row: number; col: number } | null>(null);
    const { user, isLoaded } = useUser();
    const containerRef = useRef<HTMLDivElement>(null);

    // Update player tile when playerPosition prop changes
    useEffect(() => {
        if (playerPosition) {
            setPlayerTile({ row: playerPosition.y, col: playerPosition.x });
        }
    }, [playerPosition]);

    // 1. Fetch Unlocked Achievements & Spawn Creatures
    useEffect(() => {
        const fetchUnlockedCreatures = async () => {
            // console.log('[CreatureLayer] Fetching unlocked creatures for map:', mapType);

            try {
                if (!isLoaded) {
                    // console.log('[CreatureLayer] Clerk not loaded yet, waiting...');
                    return;
                }

                if (!user) {
                    // console.log('[CreatureLayer] No user logged in, skipping creature spawn');
                    return;
                }

                // console.log('[CreatureLayer] User found:', user.id);

                // Fetch unlocked achievements from your API
                const response = await fetch('/api/achievements');

                if (!response.ok) {
                    console.error('[CreatureLayer] Error fetching achievements:', response.statusText);
                    return;
                }

                const data = await response.json();
                // API returns an array of achievements directly, or an object with error
                const achievements = Array.isArray(data) ? data : (data.achievements || []);

                // console.log('[CreatureLayer] Achievements fetched:', achievements.length);

                if (!achievements || achievements.length === 0) {
                    // console.log('[CreatureLayer] No achievements found. Spawning test creatures for development.');
                    // Spawn a few test creatures for development/testing
                    const testCreatures: ActiveCreature[] = [];
                    const testIds = ['001', '004', '007', '010', '013']; // One of each type

                    testIds.forEach(id => {
                        const def = CREATURE_DEFINITIONS[id];
                        if (def) {
                            const spawnPoint = findRandomSpawnPoint(grid, def.type);
                            if (spawnPoint) {
                                testCreatures.push({
                                    instanceId: `${def.id}-${Date.now()}-${Math.random()}`,
                                    definitionId: def.id,
                                    position: spawnPoint,
                                    targetPosition: spawnPoint,
                                    state: 'idle'
                                });
                                // console.log(`[CreatureLayer] Spawned test creature ${def.name} at`, spawnPoint);
                            }
                        }
                    });

                    setActiveCreatures(testCreatures);
                    return;
                }

                const unlockedIds = achievements.map((a: any) => a.achievement_id || a.id);
                // console.log('[CreatureLayer] Unlocked achievement IDs:', unlockedIds);

                const creaturesToSpawn: ActiveCreature[] = [];

                // For each unlocked achievement, check if it has a corresponding creature
                unlockedIds.forEach((id: string) => {
                    const def = CREATURE_DEFINITIONS[id];
                    if (def) {
                        // Find a valid spawn point
                        const spawnPoint = findRandomSpawnPoint(grid, def.type);
                        if (spawnPoint) {
                            creaturesToSpawn.push({
                                instanceId: `${def.id}-${Date.now()}-${Math.random()}`,
                                definitionId: def.id,
                                position: spawnPoint,
                                targetPosition: spawnPoint,
                                state: 'idle'
                            });
                            // console.log(`[CreatureLayer] Spawned creature ${def.name} at`, spawnPoint);
                        } else {
                            console.warn(`[CreatureLayer] No valid spawn point found for creature ${def.name} (type: ${def.type})`);
                        }
                    }
                });

                // console.log('[CreatureLayer] Total creatures spawned:', creaturesToSpawn.length);
                setActiveCreatures(creaturesToSpawn);
            } catch (error) {
                console.error('[CreatureLayer] Unexpected error:', error);
            }
        };

        fetchUnlockedCreatures();
    }, [grid, user, isLoaded, mapType]); // Re-run if grid changes (e.g. new tiles placed)

    // 2. Wandering Logic - Different for Kingdom vs Realm
    useEffect(() => {
        if (activeCreatures.length === 0) return;

        const moveCreature = (creature: ActiveCreature) => {
            const def = CREATURE_DEFINITIONS[creature.definitionId];
            if (!def) return creature;

            const neighbors = getNeighbors(creature.position, grid);
            const validNeighbors = neighbors.filter(n => n.tile && isHabitatMatch(n.tile, def.type));

            if (validNeighbors.length > 0) {
                const nextTile = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
                if (nextTile) {
                    // console.log(`[CreatureLayer] Moving ${def.name} from`, creature.position, 'to', { row: nextTile.row, col: nextTile.col });
                    return {
                        ...creature,
                        position: { row: nextTile.row, col: nextTile.col },
                        state: 'walking' as const
                    };
                }
            }
            return creature;
        };

        if (mapType === 'kingdom') {
            // Kingdom: Each creature moves independently at random intervals (2-10 seconds)
            const timers: NodeJS.Timeout[] = [];

            activeCreatures.forEach((creature, index) => {
                const scheduleNextMove = () => {
                    const delay = Math.random() * 8000 + 2000; // 2-10 seconds
                    const timer = setTimeout(() => {
                        setActiveCreatures(prev => {
                            const newCreatures = [...prev];
                            if (newCreatures[index]) {
                                newCreatures[index] = moveCreature(newCreatures[index]);
                            }
                            return newCreatures;
                        });
                        scheduleNextMove(); // Schedule next move
                    }, delay);
                    timers.push(timer);
                };
                scheduleNextMove();
            });

            return () => {
                timers.forEach(timer => clearTimeout(timer));
            };
        } else {
            // Realm: All creatures move together every 5 seconds (like animals)
            const interval = setInterval(() => {
                setActiveCreatures(prev => prev.map(moveCreature));
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [grid, activeCreatures.length, mapType]);

    // 3. Track Player Position
    // For Realm: use character position passed via props
    // For Kingdom: track mouse position relative to container
    useEffect(() => {
        if (mapType === 'realm') return; // Realm uses playerPosition prop

        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();

            // Check if mouse is inside the grid
            if (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
            ) {
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                if (!grid || grid.length === 0 || !grid[0]) return;
                const cols = grid[0].length;
                const rows = grid.length;
                const tileWidth = rect.width / cols;
                const tileHeight = rect.height / rows;

                const col = Math.floor(x / tileWidth);
                const row = Math.floor(y / tileHeight);

                setPlayerTile({ row, col });
            } else {
                setPlayerTile(null);
            }
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
    }, [grid, mapType]);

    if (!grid || grid.length === 0 || !grid[0]) return null;

    const rows = grid.length;
    const cols = grid[0].length;

    // console.log('[CreatureLayer] Rendering with', activeCreatures.length, 'creatures');

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 pointer-events-none z-10"
        >
            {activeCreatures.map(creature => {
                const def = CREATURE_DEFINITIONS[creature.definitionId];
                if (!def) {
                    console.warn('[CreatureLayer] No definition found for creature:', creature.definitionId);
                    return null;
                }

                const isPlayerOnTile = !!playerTile && playerTile.row === creature.position.row && playerTile.col === creature.position.col;

                // console.log('[CreatureLayer] Rendering creature:', def.name, 'at position:', creature.position);

                return (
                    <div
                        key={creature.instanceId}
                        className="absolute transition-all duration-[3000ms] ease-in-out pointer-events-auto cursor-pointer hover:scale-110 z-20"
                        style={{
                            top: `${(creature.position.row / rows) * 100}%`,
                            left: `${(creature.position.col / cols) * 100}%`,
                            width: `${(1 / cols) * 100}%`,
                            height: `${(1 / rows) * 100}%`,
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onCreatureClick?.(creature);
                        }}
                    >
                        <CreatureSprite
                            creature={def}
                            isPlayerOnTile={isPlayerOnTile}
                            tileSize={100} // Just a dummy value, component handles scaling via percentage
                        />
                    </div>
                );
            })}
        </div>
    );
}

// --- Helpers ---

function findRandomSpawnPoint(grid: Tile[][], habitatType: string): { row: number; col: number } | null {
    if (!grid) return null;
    let validTiles: { row: number; col: number }[] = [];

    // First pass: Try strict habitat match
    grid.forEach((row, r) => {
        if (!row) return;
        row.forEach((tile, c) => {
            if (tile && isHabitatMatch(tile, habitatType)) {
                validTiles.push({ row: r, col: c });
            }
        });
    });

    // Second pass: If no tiles found, try 'vacant' or 'grass' as fallback for ANY creature
    // This ensures creatures appear even if their specific habitat isn't built yet
    if (validTiles.length === 0) {
        // console.log(`[CreatureLayer] No specific habitat found for ${habitatType}, trying fallback to grass/vacant`);
        grid.forEach((row, r) => {
            if (!row) return;
            row.forEach((tile, c) => {
                const type = tile?.type?.toLowerCase() || 'vacant';
                if (type === 'vacant' || type.includes('grass') || type.includes('dirt') || type.includes('plain')) {
                    validTiles.push({ row: r, col: c });
                }
            });
        });
    }

    if (validTiles.length === 0) return null;
    return validTiles[Math.floor(Math.random() * validTiles.length)] || null;
}

function getNeighbors(pos: { row: number; col: number }, grid: Tile[][]) {
    if (!grid || grid.length === 0) return [];
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    const neighbors = [];

    // Check Up
    if (pos.row > 0) {
        const upRow = grid[pos.row - 1];
        if (upRow && upRow[pos.col]) {
            neighbors.push({ row: pos.row - 1, col: pos.col, tile: upRow[pos.col] });
        }
    }

    // Check Down
    if (pos.row < rows - 1) {
        const downRow = grid[pos.row + 1];
        if (downRow && downRow[pos.col]) {
            neighbors.push({ row: pos.row + 1, col: pos.col, tile: downRow[pos.col] });
        }
    }

    // Check Left
    if (pos.col > 0) {
        const currentRow = grid[pos.row];
        if (currentRow && currentRow[pos.col - 1]) {
            neighbors.push({ row: pos.row, col: pos.col - 1, tile: currentRow[pos.col - 1] });
        }
    }

    // Check Right
    if (pos.col < cols - 1) {
        const currentRow = grid[pos.row];
        if (currentRow && currentRow[pos.col + 1]) {
            neighbors.push({ row: pos.row, col: pos.col + 1, tile: currentRow[pos.col + 1] });
        }
    }

    return neighbors;
}

function isHabitatMatch(tile: Tile, habitatType: string): boolean {
    // Map tile types to habitat types
    // Kingdom tiles: 'vacant', 'well', 'blacksmith', 'fisherman', 'sawmill', 'windmill', 'grocery', 'castle', 'temple', 'fountain', 'pond', 'foodcourt', 'vegetables', 'wizard', 'mayor', 'inn', 'library', 'mansion', 'jousting', 'archery', 'watchtower'
    // Realm tiles: 'grass', 'water', 'forest', 'mountain', 'desert', 'ice', 'snow', 'cave', 'dungeon', 'castle', 'lava', 'volcano', 'city', 'town', 'mystery'

    const tileType = tile.type?.toLowerCase() || 'vacant';

    // console.log('[isHabitatMatch] Checking tile type:', tileType, 'against habitat:', habitatType);

    switch (habitatType) {
        case 'water':
            // Water creatures: ponds, fountains, fisherman areas, water tiles
            return tileType.includes('water') ||
                tileType.includes('pond') ||
                tileType.includes('fountain') ||
                tileType.includes('fisherman') ||
                tileType.includes('well') ||
                tileType.includes('bridge') ||
                tileType.includes('lake') ||
                tileType.includes('river');
        case 'fire':
            // Fire creatures: blacksmith, tavern, inn, kitchen areas, lava
            // Also allow grass/vacant so they aren't stuck if spawned there
            return tileType.includes('blacksmith') ||
                tileType.includes('tavern') ||
                tileType.includes('inn') ||
                tileType.includes('foodcourt') ||
                tileType.includes('lava') ||
                tileType.includes('volcano') ||
                tileType.includes('grass') ||
                tileType === 'vacant';
        case 'earth':
            // Earth creatures: mountains, mines, walls, roads, quarries
            // Also allow grass/vacant
            return tileType.includes('mountain') ||
                tileType.includes('mine') ||
                tileType.includes('wall') ||
                tileType.includes('watchtower') ||
                tileType.includes('road') ||
                tileType.includes('grass') ||
                tileType === 'vacant';
        case 'nature':
            // Nature creatures: forests, farms, gardens, sawmills, windmills
            return tileType.includes('forest') ||
                tileType.includes('farm') ||
                tileType.includes('field') ||
                tileType.includes('lumber') ||
                tileType.includes('sawmill') ||
                tileType.includes('windmill') ||
                tileType.includes('vegetables') ||
                tileType.includes('grass') ||
                tileType === 'vacant';
        case 'ice':
            // Ice creatures: ice tiles, snow, mountains, water (frozen)
            return tileType.includes('ice') ||
                tileType.includes('snow') ||
                tileType.includes('mountain') ||
                tileType.includes('water');
        case 'monster':
            // Monsters: dungeons, caves, castles, vacant areas
            return tileType.includes('dungeon') ||
                tileType.includes('cave') ||
                tileType.includes('castle') ||
                tileType.includes('forest') ||
                tileType.includes('grass') ||
                tileType === 'vacant';
        case 'special':
            // Special creatures: can appear anywhere
            return true;
        default:
            // Default: only vacant tiles
            return tileType === 'vacant' || tileType.includes('grass');
    }
}
