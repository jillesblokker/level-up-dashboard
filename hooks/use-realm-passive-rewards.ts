import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { gainGold } from '@/lib/gold-manager';
import { gainExperience } from '@/lib/experience-manager';
import { Tile } from '@/types/tiles';

export function useRealmPassiveRewards(grid: Tile[][], isMounted: boolean) {
    const { toast } = useToast();
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

            grid.forEach(row => {
                row.forEach(tile => {
                    if (tile.type !== 'empty' && tile.type !== 'grass') {
                        const baseValue = tile.cost || 100;
                        hourlyGold += Math.floor(baseValue * 0.05);
                        hourlyXp += Math.floor(baseValue * 0.02);
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
    }, [grid, lastCollectionTime, isMounted]);

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
            className: "bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border-amber-500/50 text-amber-100"
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
