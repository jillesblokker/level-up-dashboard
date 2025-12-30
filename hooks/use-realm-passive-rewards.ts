import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { gainGold } from '@/lib/gold-manager';
import { gainExperience } from '@/lib/experience-manager';
import { Tile } from '@/types/tiles';

import { useWeather } from '@/hooks/use-weather';

export function useRealmPassiveRewards(grid: Tile[][], isMounted: boolean) {
    const { toast } = useToast();
    const { weather } = useWeather();
    const [passiveRewards, setPassiveRewards] = useState<{ gold: number, xp: number } | null>(null);
    const [lastCollectionTime, setLastCollectionTime] = useState<number>(Date.now());

    // Initial load from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined' && isMounted) {
            const savedCollectionTime = localStorage.getItem('kingdom_last_collection');
            if (savedCollectionTime) setLastCollectionTime(parseInt(savedCollectionTime));
        }
    }, [isMounted]);

    useEffect(() => {
        if (!isMounted || !grid.length) return;

        const calculateRewards = () => {
            const now = Date.now();
            const timeDiffHours = (now - lastCollectionTime) / (1000 * 60 * 60);
            const effectiveHours = Math.min(timeDiffHours, 24);

            if (effectiveHours < 0.1) return;

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


                        const adjustedValue = baseValue * multiplier;
                        hourlyGold += Math.floor(adjustedValue * 0.05);

                        // Rainy Weather XP Bonus for nature
                        let xpMultiplier = 1;
                        if (weather === 'rainy' && ['forest', 'grass', 'water', 'farm'].includes(tile.type)) {
                            xpMultiplier = 1.2;
                        }
                        hourlyXp += Math.floor(baseValue * 0.02 * xpMultiplier);
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
    }, [grid, lastCollectionTime, isMounted, weather]);

    const handleCollectRewards = useCallback(async () => {
        if (!passiveRewards) return;

        await gainGold(passiveRewards.gold, 'kingdom-passive');
        await gainExperience(passiveRewards.xp, 'kingdom-passive');

        const now = Date.now();
        setLastCollectionTime(now);
        localStorage.setItem('kingdom_last_collection', now.toString());
        setPassiveRewards(null);

        toast({
            title: "💰 Royal Treasury Collected!",
            description: `You collected ${passiveRewards.gold} Gold and ${passiveRewards.xp} XP from your kingdom!`,
            className: "bg-gradient-to-r from-amber-900 to-yellow-900 border-amber-500 border-2 text-amber-50 shadow-xl"
        });

        window.dispatchEvent(new CustomEvent('coin-burst', {
            detail: { amount: passiveRewards.gold, x: window.innerWidth / 2, y: window.innerHeight / 2 }
        }));
    }, [passiveRewards, toast]);

    return {
        passiveRewards,
        handleCollectRewards
    };
}
