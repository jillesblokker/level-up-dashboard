import React, { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { gainGold } from '@/lib/gold-manager';
import { gainExperience } from '@/lib/experience-manager';
import { Tile } from '@/types/core-interfaces';

import { useWeather } from '@/hooks/use-weather';

// Maintenance cost per building type (material-id -> amount consumed per maintenance cycle)
const MAINTENANCE_COSTS: Record<string, { materialId: string; amount: number; emoji: string }> = {
  farm:        { materialId: 'material-logs',    amount: 1, emoji: '🪵' },
  lumber_mill: { materialId: 'material-logs',    amount: 2, emoji: '🪵' },
  mine:        { materialId: 'material-stone',   amount: 1, emoji: '🪨' },
  market:      { materialId: 'material-stone',   amount: 1, emoji: '🪨' },
  house:       { materialId: 'material-logs',    amount: 1, emoji: '🪵' },
  mansion:     { materialId: 'material-stone',   amount: 2, emoji: '🪨' },
  cottage:     { materialId: 'material-logs',    amount: 1, emoji: '🪵' },
  blacksmith:  { materialId: 'material-steel',   amount: 1, emoji: '⛓️' },
  windmill:    { materialId: 'material-logs',    amount: 1, emoji: '🪵' },
  castle:      { materialId: 'material-steel',   amount: 2, emoji: '⛓️' },
};

const MAINTENANCE_INTERVAL_MS = 48 * 60 * 60 * 1000; // 48 hours
const DECAY_MULTIPLIER = 0.70; // 30% reduction when unmaintained

export function useRealmPassiveRewards(grid: Tile[][], isMounted: boolean) {
    const { toast } = useToast();
    const { weather } = useWeather();
    const [passiveRewards, setPassiveRewards] = useState<{ gold: number, xp: number } | null>(null);
    const [lastCollectionTime, setLastCollectionTime] = useState<number>(Date.now());
    const [lastMaintenanceTime, setLastMaintenanceTime] = useState<number>(0);
    const [maintenanceDecayed, setMaintenanceDecayed] = useState(false);

    // Initial load from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined' && isMounted) {
            const savedCollectionTime = localStorage.getItem('kingdom_last_collection');
            if (savedCollectionTime) setLastCollectionTime(parseInt(savedCollectionTime));

            const savedMaintenanceTime = localStorage.getItem('kingdom_last_maintenance');
            if (savedMaintenanceTime) {
                const mt = parseInt(savedMaintenanceTime);
                setLastMaintenanceTime(mt);
                setMaintenanceDecayed(Date.now() - mt > MAINTENANCE_INTERVAL_MS);
            } else {
                // First time: grace period — treat as maintained
                const now = Date.now();
                localStorage.setItem('kingdom_last_maintenance', now.toString());
                setLastMaintenanceTime(now);
            }
        }
    }, [isMounted]);

    useEffect(() => {
        if (!isMounted || !grid.length) return;

        const calculateRewards = () => {
            const now = Date.now();
            const timeDiffHours = (now - lastCollectionTime) / (1000 * 60 * 60);
            const effectiveHours = Math.min(timeDiffHours, 24);

            if (effectiveHours < 0.1) return;

            // Check maintenance decay
            const isDecayed = lastMaintenanceTime > 0 && (now - lastMaintenanceTime > MAINTENANCE_INTERVAL_MS);
            setMaintenanceDecayed(isDecayed);

            let hourlyGold = 0;
            let hourlyXp = 0;

            grid.forEach((row, y) => {
                row.forEach((tile, x) => {
                    if (tile.type !== 'empty' && tile.type !== 'grass') {
                        let baseValue = tile.cost || 100;
                        let multiplier = 1;

                        // Adjacency Bonuses
                        // Get neighbors
                        const neighbors = [
                            grid[y - 1]?.[x],
                            grid[y + 1]?.[x],
                            grid[y]?.[x - 1],
                            grid[y]?.[x + 1]
                        ].filter(Boolean);

                        // 1. Farm + Water
                        if (tile.type === 'farm') {
                            if (neighbors.some(n => n?.type === 'water')) {
                                multiplier += 0.2;
                            }
                        }

                        // 2. Lumber Mill + Forest
                        if (tile.type === 'lumber_mill') {
                            if (neighbors.some(n => n?.type === 'forest')) {
                                multiplier += 0.2;
                            }
                        }

                        // 3. Market + Housing
                        if (tile.type === 'market') {
                            const houseCount = neighbors.filter(n =>
                                n?.type === 'house' || n?.type === 'mansion' || n?.type === 'cottage'
                            ).length;
                            if (houseCount > 0) {
                                multiplier += (0.1 * houseCount);
                            }
                        }

                        // Weather Bonuses
                        if (weather === 'sunny' && tile.type === 'farm') {
                            multiplier += 0.1;
                        }

                        // Apply maintenance decay if building is unmaintained
                        if (isDecayed && MAINTENANCE_COSTS[tile.type]) {
                            multiplier *= DECAY_MULTIPLIER;
                        }

                        const adjustedValue = baseValue * multiplier;
                        hourlyGold += Math.floor(adjustedValue * 0.05);

                        // Rainy Weather XP Bonus for nature
                        let xpMultiplier = 1;
                        if (weather === 'rainy' && ['forest', 'grass', 'water', 'farm'].includes(tile.type)) {
                            xpMultiplier = 1.2;
                        }
                        hourlyXp += Math.floor(baseValue * 0.02 * xpMultiplier * (isDecayed && MAINTENANCE_COSTS[tile.type] ? DECAY_MULTIPLIER : 1));
                    }
                });
            });

            hourlyGold += 10;
            hourlyXp += 5;

            const pendingGold = Math.floor(hourlyGold * effectiveHours);
            const pendingXp = Math.floor(hourlyXp * effectiveHours);

            if (pendingGold > 0 || pendingXp > 0) {
                setPassiveRewards({ gold: pendingGold, xp: pendingXp });
            }
        };

        const interval = setInterval(calculateRewards, 60000);
        calculateRewards();

        return () => clearInterval(interval);
    }, [grid, lastCollectionTime, lastMaintenanceTime, isMounted, weather]);

    const handleCollectRewards = useCallback(async () => {
        if (!passiveRewards) return;

        await gainGold(passiveRewards.gold, 'kingdom-passive');
        await gainExperience(passiveRewards.xp, 'kingdom-passive');

        const now = Date.now();
        setLastCollectionTime(now);
        localStorage.setItem('kingdom_last_collection', now.toString());
        setPassiveRewards(null);

        toast({
            title: maintenanceDecayed ? "⚠️ Reduced Treasury Collected" : "💰 Royal Treasury Collected!",
            description: maintenanceDecayed
                ? `Collected ${passiveRewards.gold} Gold and ${passiveRewards.xp} XP (−30% decay — buildings need maintenance!)`
                : `You collected ${passiveRewards.gold} Gold and ${passiveRewards.xp} XP from your kingdom!`,
            className: "bg-black bg-gradient-to-r from-amber-900 via-amber-800 to-yellow-900 border-amber-500 border-2 text-white shadow-2xl opacity-100"
        });

        window.dispatchEvent(new CustomEvent('coin-burst', {
            detail: { amount: passiveRewards.gold, x: window.innerWidth / 2, y: window.innerHeight / 2 }
        }));
    }, [passiveRewards, maintenanceDecayed, toast]);

    /**
     * Perform maintenance on all buildings by consuming raw materials from inventory.
     * Returns a summary of materials consumed, or null if no materials were available.
     */
    const handleMaintainBuildings = useCallback(async (userId: string): Promise<{ consumed: Record<string, number>; success: boolean } | null> => {
        if (!grid.length) return null;

        // Tally required materials
        const required: Record<string, number> = {};
        grid.forEach(row => {
            row.forEach(tile => {
                const cost = MAINTENANCE_COSTS[tile.type];
                if (cost) {
                    required[cost.materialId] = (required[cost.materialId] || 0) + cost.amount;
                }
            });
        });

        if (Object.keys(required).length === 0) return null;

        // Try to consume from inventory
        try {
            const { getInventory, removeFromInventory } = await import('@/lib/inventory-manager');
            const inventory = await getInventory(userId);
            const consumed: Record<string, number> = {};
            let anyConsumed = false;

            for (const [materialId, amountNeeded] of Object.entries(required)) {
                const invItem = inventory.find(i => i.id === materialId);
                const available = invItem?.quantity || 0;
                const toConsume = Math.min(available, amountNeeded);
                if (toConsume > 0) {
                    await removeFromInventory(userId, materialId, toConsume);
                    consumed[materialId] = toConsume;
                    anyConsumed = true;
                }
            }

            if (anyConsumed) {
                const now = Date.now();
                setLastMaintenanceTime(now);
                setMaintenanceDecayed(false);
                localStorage.setItem('kingdom_last_maintenance', now.toString());

                const summary = Object.entries(consumed)
                    .map(([id, qty]) => {
                        const cost = Object.values(MAINTENANCE_COSTS).find(c => c.materialId === id);
                        return `${cost?.emoji || '📦'} ${qty}x ${id.replace('material-', '')}`;
                    })
                    .join(', ');

                toast({
                    title: "🔧 Kingdom Maintained!",
                    description: `Used ${summary}. Buildings restored to full output.`,
                    className: "bg-black bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-900 border-emerald-500 border-2 text-white shadow-2xl opacity-100"
                });

                return { consumed, success: true };
            } else {
                toast({
                    title: "⚠️ Insufficient Materials",
                    description: "You don't have enough raw materials to maintain your buildings. Gather logs, stone, and steel or trade in the market!",
                    className: "bg-black bg-gradient-to-r from-red-900 via-red-800 to-orange-900 border-red-500 border-2 text-white shadow-2xl opacity-100",
                    action: (
                        <ToastAction altText="Market" onClick={() => window.location.href = "/market"}>
                            Market
                        </ToastAction>
                    )
                });
                return { consumed: {}, success: false };
            }
        } catch (error) {
            console.error('[Maintenance] Error consuming materials:', error);
            return null;
        }
    }, [grid, toast]);

    return {
        passiveRewards,
        handleCollectRewards,
        maintenanceDecayed,
        handleMaintainBuildings,
        lastMaintenanceTime,
    };
}

