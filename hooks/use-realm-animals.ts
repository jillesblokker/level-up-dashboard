import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { gainGold } from '@/lib/gold-manager';
import { getAdjacentPositions, GRID_COLS, INITIAL_ROWS } from '@/app/realm/realm-utils';
import { Tile } from '@/types/tiles';

export function useRealmAnimals(grid: Tile[][], isMounted: boolean, characterPosition: { x: number; y: number }, setAnimalInteractionModal: (modal: any) => void) {
    const { toast } = useToast();

    const [horsePos, setHorsePos] = useState<{ x: number; y: number } | null>({ x: 10, y: 4 });
    const [eaglePos, setEaglePos] = useState<{ x: number; y: number } | null>(null);
    const [isHorsePresent, setIsHorsePresent] = useState(true);
    const [isPenguinPresent, setIsPenguinPresent] = useState(false);
    const [penguinPos, setPenguinPos] = useState<{ x: number; y: number } | null>(null);
    const [sheepPos, setSheepPos] = useState<{ x: number; y: number } | null>({ x: 5, y: 2 });
    const [isSheepPresent, setIsSheepPresent] = useState(true);
    const [horseCaught, setHorseCaught] = useState(false);
    const [sheepCaught, setSheepCaught] = useState(false);
    const [penguinCaught, setPenguinCaught] = useState(false);

    // Initial load from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined' && isMounted) {
            const savedHorse = localStorage.getItem('animal-horse-position');
            if (savedHorse) setHorsePos(JSON.parse(savedHorse));

            const savedSheep = localStorage.getItem('animal-sheep-position');
            if (savedSheep) setSheepPos(JSON.parse(savedSheep));

            const horseState = localStorage.getItem('animal-horse-state') === 'true';
            setHorseCaught(horseState);

            const sheepCooldown = localStorage.getItem('animal-sheep-cooldown');
            if (sheepCooldown && Date.now() < parseInt(sheepCooldown)) {
                setSheepCaught(true);
                setIsSheepPresent(false);
            }

            const penguinCooldown = localStorage.getItem('animal-penguin-cooldown');
            if (penguinCooldown && Date.now() < parseInt(penguinCooldown)) {
                setPenguinCaught(true);
                setIsPenguinPresent(false);
            }
        }
    }, [isMounted]);

    // Penguin respawn logic
    useEffect(() => {
        if (!isMounted || !Array.isArray(grid)) return;

        const cooldown = localStorage.getItem('animal-penguin-cooldown');
        if (cooldown && Date.now() < parseInt(cooldown)) {
            if (isPenguinPresent) setIsPenguinPresent(false);
            return;
        }

        const hasIce = grid.some(row => row && row.some(tile => tile?.type === 'ice'));

        if (!hasIce && isPenguinPresent) {
            setIsPenguinPresent(false);
            setPenguinPos(null);
        } else if (hasIce && !isPenguinPresent) {
            let bestIcePos = null;
            const centerX = Math.floor(GRID_COLS / 2);
            const centerY = Math.floor(INITIAL_ROWS / 2);

            for (let y = centerY - 1; y <= centerY + 1; y++) {
                const row = grid[y];
                if (!row) continue;
                for (let x = centerX - 1; x <= centerX + 1; x++) {
                    if (row[x]?.type === 'ice') {
                        bestIcePos = { x, y };
                        break;
                    }
                }
                if (bestIcePos) break;
            }

            if (!bestIcePos) {
                for (let y = 0; y < grid.length; y++) {
                    const row = grid[y];
                    if (!row) continue;
                    for (let x = 0; x < row.length; x++) {
                        if (row[x]?.type === 'ice') {
                            bestIcePos = { x, y };
                            break;
                        }
                    }
                    if (bestIcePos) break;
                }
            }

            if (bestIcePos) {
                setPenguinPos(bestIcePos);
                setIsPenguinPresent(true);
                setPenguinCaught(false);
            }
        }
    }, [grid, isPenguinPresent, isMounted]);

    // Animal movement logic
    useEffect(() => {
        if (!isMounted) return;

        const moveAnimals = () => {
            // Sheep movement
            if (isSheepPresent && sheepPos && !sheepCaught) {
                const adjacent = getAdjacentPositions(sheepPos.x, sheepPos.y, grid);
                const valid = adjacent.filter(pos => {
                    const tile = grid[pos.y]?.[pos.x];
                    return tile && tile.type === 'grass' && !tile.hasMonster;
                });
                if (valid.length > 0) {
                    const next = valid[Math.floor(Math.random() * valid.length)];
                    if (next) {
                        setSheepPos(next);
                        localStorage.setItem('animal-sheep-position', JSON.stringify(next));
                    }
                }
            }

            // Penguin movement
            if (isPenguinPresent && penguinPos && !penguinCaught) {
                const adjacent = getAdjacentPositions(penguinPos.x, penguinPos.y, grid);
                const valid = adjacent.filter(pos => {
                    const tile = grid[pos.y]?.[pos.x];
                    return tile && tile.type === 'ice' && !tile.hasMonster;
                });
                if (valid.length > 0) {
                    const next = valid[Math.floor(Math.random() * valid.length)];
                    if (next) setPenguinPos(next);
                }
            }
        };

        const interval = setInterval(moveAnimals, 5000);
        return () => clearInterval(interval);
    }, [grid, isSheepPresent, sheepPos, sheepCaught, isPenguinPresent, penguinPos, penguinCaught, isMounted]);

    // Position validation
    useEffect(() => {
        if (!isMounted || !Array.isArray(grid) || grid.length === 0) return;

        if (isHorsePresent && horsePos) {
            const tile = grid[horsePos.y]?.[horsePos.x];
            if (!tile || tile.type !== 'grass') {
                for (let y = 0; y < grid.length; y++) {
                    const row = grid[y];
                    if (!row) continue;
                    const x = row.findIndex(t => t && t.type === 'grass' && !t.hasMonster);
                    if (x !== -1) {
                        setHorsePos({ x, y });
                        localStorage.setItem('animal-horse-position', JSON.stringify({ x, y }));
                        break;
                    }
                }
            }
        }

        if (isSheepPresent && sheepPos) {
            const tile = grid[sheepPos.y]?.[sheepPos.x];
            if (!tile || tile.type !== 'grass') {
                for (let y = 0; y < grid.length; y++) {
                    const row = grid[y];
                    if (!row) continue;
                    const x = row.findIndex(t => t && t.type === 'grass' && !t.hasMonster);
                    if (x !== -1) {
                        setSheepPos({ x, y });
                        localStorage.setItem('animal-sheep-position', JSON.stringify({ x, y }));
                        break;
                    }
                }
            }
        }
    }, [grid, isHorsePresent, horsePos, isSheepPresent, sheepPos, isMounted]);

    // Interaction detection
    useEffect(() => {
        if (!isMounted) return;

        if (isHorsePresent && !horseCaught && horsePos && characterPosition.x === horsePos.x && characterPosition.y === horsePos.y) {
            setAnimalInteractionModal({
                isOpen: true,
                animalType: 'horse',
                animalName: 'Wild Horse'
            });
        }

        if (isSheepPresent && !sheepCaught && sheepPos && characterPosition.x === sheepPos.x && characterPosition.y === sheepPos.y) {
            setAnimalInteractionModal({
                isOpen: true,
                animalType: 'sheep',
                animalName: 'Fluffy Sheep'
            });
        }

        if (isPenguinPresent && !penguinCaught && penguinPos && characterPosition.x === penguinPos.x && characterPosition.y === penguinPos.y) {
            setAnimalInteractionModal({
                isOpen: true,
                animalType: 'penguin',
                animalName: 'Playful Penguin'
            });
        }
    }, [characterPosition, horsePos, isHorsePresent, horseCaught, sheepPos, isSheepPresent, sheepCaught, penguinPos, isPenguinPresent, penguinCaught, isMounted]);

    const handleAnimalInteraction = useCallback(async (animalType: 'horse' | 'sheep' | 'penguin' | 'eagle') => {
        if (animalType === 'horse') {
            setHorseCaught(true);
            localStorage.setItem('animal-horse-state', 'true');
            window.dispatchEvent(new CustomEvent('horse-caught'));
            toast({ title: "Horse Tamed!", description: "You successfully tamed the wild horse!" });
        } else if (animalType === 'sheep') {
            try {
                const res = await fetch('/api/creatures/interact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ instanceId: `sheep-${Date.now()}`, definitionId: '901' })
                });
                const data = await res.json();
                if (data.reward && data.shaved) {
                    toast({ title: "Sheep Shaved! 🐑", description: data.message });
                    gainGold(data.reward.amount, 'sheep-shave');
                    setIsSheepPresent(false);
                    setSheepCaught(true);
                    const cooldownTime = Date.now() + 5 * 24 * 60 * 60 * 1000;
                    localStorage.setItem('animal-sheep-cooldown', cooldownTime.toString());
                } else if (data.cooldown) {
                    toast({ title: "Recently Shaved", description: data.message, variant: "destructive" });
                    setIsSheepPresent(false);
                    setSheepCaught(true);
                } else {
                    toast({ title: "Baaa!", description: data.message || "The sheep looks happy." });
                }
            } catch (e) {
                toast({ title: "Error", description: "Failed to interact with sheep", variant: "destructive" });
            }
        } else if (animalType === 'penguin') {
            try {
                const res = await fetch('/api/creatures/interact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ instanceId: `penguin-${Date.now()}`, definitionId: '903' })
                });
                const data = await res.json();
                if (data.reward && data.shaved) {
                    toast({ title: "Noot Noot! 🐧", description: data.message });
                    gainGold(data.reward.amount, 'penguin-play');
                    setIsPenguinPresent(false);
                    setPenguinCaught(true);
                    const cooldownTime = Date.now() + 5 * 24 * 60 * 60 * 1000;
                    localStorage.setItem('animal-penguin-cooldown', cooldownTime.toString());
                } else if (data.cooldown) {
                    toast({ title: "Tired Penguin", description: data.message, variant: "destructive" });
                    setIsPenguinPresent(false);
                    setPenguinCaught(true);
                } else {
                    toast({ title: "Noot Noot!", description: data.message });
                }
            } catch (e) {
                toast({ title: "Error", description: "Failed to interact with penguin", variant: "destructive" });
            }
        }
    }, [toast]);

    return {
        horsePos, eaglePos, isHorsePresent, isPenguinPresent, penguinPos,
        sheepPos, isSheepPresent, horseCaught, sheepCaught, penguinCaught,
        handleAnimalInteraction,
        setIsPenguinPresent, setPenguinPos, setHorsePos, setSheepPos
    };
}
