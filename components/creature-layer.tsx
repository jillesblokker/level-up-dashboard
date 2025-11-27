import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CreatureDefinition, CREATURE_DEFINITIONS } from '@/lib/creature-mapping';
import { CreatureSprite } from './creature-sprite';
import { Tile } from '@/types/tiles';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CreatureLayerProps {
    grid: Tile[][];
    tileSize: number;
    mapType: 'kingdom' | 'realm';
}

interface ActiveCreature {
    instanceId: string;
    definitionId: string;
    position: { row: number; col: number };
    targetPosition: { row: number; col: number };
    state: 'idle' | 'walking';
}

export function CreatureLayer({ grid, mapType }: Omit<CreatureLayerProps, 'tileSize'>) {
    const [activeCreatures, setActiveCreatures] = useState<ActiveCreature[]>([]);
    const [playerTile, setPlayerTile] = useState<{ row: number; col: number } | null>(null);
    const supabase = createClientComponentClient();
    const containerRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Unlocked Achievements & Spawn Creatures
    useEffect(() => {
        const fetchUnlockedCreatures = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch unlocked achievements
            const { data: achievements } = await supabase
                .from('user_achievements')
                .select('achievement_id')
                .eq('user_id', user.id);

            if (!achievements) return;

            const unlockedIds = achievements.map(a => a.achievement_id);
            const creaturesToSpawn: ActiveCreature[] = [];

            // For each unlocked achievement, check if it has a corresponding creature
            unlockedIds.forEach(id => {
                const def = CREATURE_DEFINITIONS[id];
                if (def) {
                    // Find a valid spawn point
                    const spawnPoint = findRandomSpawnPoint(grid, def.type);
                    if (spawnPoint) {
                        creaturesToSpawn.push({
                            instanceId: `${def.id}-${Date.now()}`,
                            definitionId: def.id,
                            position: spawnPoint,
                            targetPosition: spawnPoint,
                            state: 'idle'
                        });
                    }
                }
            });

            setActiveCreatures(creaturesToSpawn);
        };

        fetchUnlockedCreatures();
    }, [grid, supabase]); // Re-run if grid changes (e.g. new tiles placed)

    // 2. Wandering Logic
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveCreatures(prev => prev.map(creature => {
                // 30% chance to move if idle
                if (Math.random() > 0.3) return creature;

                const def = CREATURE_DEFINITIONS[creature.definitionId];
                if (!def) return creature;

                const neighbors = getNeighbors(creature.position, grid);
                const validNeighbors = neighbors.filter(n => n.tile && isHabitatMatch(n.tile, def.type));

                if (validNeighbors.length > 0) {
                    const nextTile = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
                    if (nextTile) {
                        return {
                            ...creature,
                            position: { row: nextTile.row, col: nextTile.col }, // Instant move for now (can animate later)
                            state: 'walking'
                        };
                    }
                }
                return creature;
            }));
        }, 5000); // Try to move every 5 seconds

        return () => clearInterval(interval);
    }, [grid]);

    // 3. Track Player Mouse/Touch Position
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
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
    }, [grid]);

    if (!grid || grid.length === 0 || !grid[0]) return null;

    const rows = grid.length;
    const cols = grid[0].length;

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 pointer-events-auto z-10"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setPlayerTile(null)}
        >
            {activeCreatures.map(creature => {
                const def = CREATURE_DEFINITIONS[creature.definitionId];
                if (!def) return null;

                const isPlayerOnTile = !!playerTile && playerTile.row === creature.position.row && playerTile.col === creature.position.col;

                return (
                    <div
                        key={creature.instanceId}
                        className="absolute transition-all duration-[3000ms] ease-in-out"
                        style={{
                            top: `${(creature.position.row / rows) * 100}%`,
                            left: `${(creature.position.col / cols) * 100}%`,
                            width: `${(1 / cols) * 100}%`,
                            height: `${(1 / rows) * 100}%`,
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
    const validTiles: { row: number; col: number }[] = [];
    grid.forEach((row, r) => {
        if (!row) return;
        row.forEach((tile, c) => {
            if (tile && isHabitatMatch(tile, habitatType)) {
                validTiles.push({ row: r, col: c });
            }
        });
    });

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
    // Tile types: 'vacant', 'house', 'farm', 'lumber_camp', 'mine', 'castle', 'market', 'barracks', 'archery_range', 'stable', 'blacksmith', 'library', 'alchemist', 'tavern', 'church', 'watchtower', 'wall', 'gate', 'road', 'water', 'bridge', 'forest', 'mountain', 'field'

    const tileType = tile.type?.toLowerCase() || 'vacant';

    switch (habitatType) {
        case 'water':
            return tileType.includes('water') || tileType.includes('bridge') || tileType.includes('lake') || tileType.includes('river');
        case 'fire':
            return tileType.includes('blacksmith') || tileType.includes('tavern') || tileType.includes('vacant');
        case 'earth':
            return tileType.includes('mountain') || tileType.includes('mine') || tileType.includes('wall') || tileType.includes('road');
        case 'nature':
            return tileType.includes('forest') || tileType.includes('farm') || tileType.includes('field') || tileType.includes('lumber');
        case 'ice':
            // Assuming we might have ice tiles later, or map to mountains for now
            return tileType.includes('mountain') || tileType.includes('water');
        case 'monster':
            return tileType.includes('vacant') || tileType.includes('forest');
        default:
            return tileType === 'vacant';
    }
}
