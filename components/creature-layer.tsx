import { logger } from "@/lib/logger";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CreatureDefinition, CREATURE_DEFINITIONS } from '@/lib/creature-mapping';
import { CreatureSprite } from './creature-sprite';
import { Tile } from '@/types/tiles';
import { useUser } from '@clerk/nextjs';
import { useCitizensStore, isCitizenHungry, isHarvestReady, FOOD_DAYS_MAP, Citizen } from '@/stores/citizensStore';
import { getInventory, removeFromInventory } from '@/lib/inventory-manager';
import { useGameStore } from '@/stores/game-store';
import { loadTileInventory } from '@/lib/data-loaders';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { gainGold } from '@/lib/gold-manager';
import { Heart, Sparkles, Star, Clock, Coins } from 'lucide-react';
import Image from 'next/image';

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

export function getUnifiedChatterPool(def: any, questStats: { total: number; completed: number } | null): string[] {
    const base = def.greetings || [];
    if (!questStats) return base;

    const allCompleted = questStats.total > 0 && questStats.completed === questStats.total;
    const progressRatio = questStats.total > 0 ? questStats.completed / questStats.total : 0;

    let progressQuotes: string[] = [];

    switch (def.type) {
        case 'fire':
            if (allCompleted) {
                progressQuotes = [
                    "The forge fires are roaring hot today! Pure power!",
                    "Yes! Let's burn through all these tasks!",
                    "A blazing victory! The realm is burning bright!"
                ];
            } else if (progressRatio > 0.5) {
                progressQuotes = [
                    "Heating up! We are halfway there!",
                    "Keep feeding the flames, boss!",
                    "Sparks are flying! Keep it going!"
                ];
            } else {
                progressQuotes = [
                    "The fire is dying down... we need more spark!",
                    "These cold, uncompleted tasks are killing my vibe!",
                    "Blow some bellows on those habits!"
                ];
            }
            break;
        case 'water':
            if (allCompleted) {
                progressQuotes = [
                    "A flood of completions! Wonderful!",
                    "Everything is flowing perfectly today!",
                    "Clean sweep! We are swimming in success!"
                ];
            } else if (progressRatio > 0.5) {
                progressQuotes = [
                    "Making waves today! Keep paddling!",
                    "The tide is rising in our favor!",
                    "Smooth sailing ahead!"
                ];
            } else {
                progressQuotes = [
                    "Stagnant water... we need movement!",
                    "The water level is dropping... focus, please!",
                    "Don't let the realm dry out!"
                ];
            }
            break;
        case 'earth':
            if (allCompleted) {
                progressQuotes = [
                    "A rock-solid day of completions!",
                    "We moved mountains today!",
                    "Solid ground beneath us. A triumphant day!"
                ];
            } else if (progressRatio > 0.5) {
                progressQuotes = [
                    "Good foundations! Almost there!",
                    "Steady as she goes, Sire!",
                    "Building strength block by block!"
                ];
            } else {
                progressQuotes = [
                    "Stuck in a mudslide... we need effort!",
                    "The ground is crumbling without focus!",
                    "Heave ho! We need more heavy lifting on those habits!"
                ];
            }
            break;
        case 'nature':
            if (allCompleted) {
                progressQuotes = [
                    "A bountiful harvest of completed quests!",
                    "The realm is blooming beautifully today!",
                    "Nature flourishes when you are focused!"
                ];
            } else if (progressRatio > 0.5) {
                progressQuotes = [
                    "Green shoots! We are growing fast today!",
                    "Nurture your habits and watch us grow!",
                    "Reaching for the sun! Almost there!"
                ];
            } else {
                progressQuotes = [
                    "The leaves are wilting... water us with focus!",
                    "Stagnation has set in... cultivate discipline!",
                    "Don't let the weeds overtake the garden!"
                ];
            }
            break;
        case 'ice':
            if (allCompleted) {
                progressQuotes = [
                    "Frozen perfection! Every task iced!",
                    "Cool, calm, and 100% completed!",
                    "Absolute zero stagnation today!"
                ];
            } else if (progressRatio > 0.5) {
                progressQuotes = [
                    "Ice is forming! Solid progress!",
                    "Chillingly good work today!",
                    "Keeping our cool and getting it done!"
                ];
            } else {
                progressQuotes = [
                    "A meltdown is coming! We need discipline!",
                    "Cold winds blow when habits are forgotten...",
                    "Brrr... the energy is freezing up."
                ];
            }
            break;
        default: // special, monster, animals
            if (allCompleted) {
                progressQuotes = [
                    "The fire of your resolve burns as bright as Drakon's breath!",
                    "We have conquered all stagnation today!",
                    "Baa! The grass has never tasted sweeter!",
                    "Neigh! Ready for a victory lap!"
                ];
            } else if (progressRatio > 0.5) {
                progressQuotes = [
                    "The horde is retreating! Keep the pressure on!",
                    "Your strength grows by the hour!",
                    "Munch munch... getting closer to full!"
                ];
            } else {
                progressQuotes = [
                    "Necrion's shadows are creeping closer... stay vigilant!",
                    "The darkness thrives on broken streaks...",
                    "Baa... it's a bit drafty out here."
                ];
            }
            break;
    }

    return [...base, ...progressQuotes];
}

interface CitizenWithChatterProps {
    creature: ActiveCreature;
    def: any;
    isPlayerOnTile: boolean;
    isSleepy: boolean;
    questStats: { total: number; completed: number } | null;
    citizen: any;
    isHarvestReady: boolean;
    dailyEncounter: {
        date: string;
        citizenId: string;
        materialId: string;
        amount: number;
        completed: boolean;
        text: string;
        rewardGold: number;
    } | null;
}

function CitizenWithChatter({
    creature,
    def,
    isPlayerOnTile,
    isSleepy,
    questStats,
    citizen,
    isHarvestReady,
    dailyEncounter
}: CitizenWithChatterProps) {
    const [chatter, setChatter] = useState<string | null>(null);
    const [visible, setVisible] = useState(false);

    const hasEncounter = dailyEncounter && dailyEncounter.citizenId === def.id;

    useEffect(() => {
        const basePool = getUnifiedChatterPool(def, questStats);
        
        // Add quest requests to the pool if active
        const pool = hasEncounter && !dailyEncounter.completed
            ? [...basePool, "Traveler, I have a request for you! 💬", "Could you spare some raw materials? 🪵"]
            : basePool;

        // Set chatter periodically
        const triggerChatter = () => {
            // Higher chance (50% vs 30%) if there is an active quest
            const chance = hasEncounter && !dailyEncounter.completed ? 0.5 : 0.3;
            if (Math.random() < chance) {
                const randomPhrase = pool[Math.floor(Math.random() * pool.length)];
                if (randomPhrase) {
                    setChatter(randomPhrase);
                    setVisible(true);
                    
                    // Hide after 6 seconds
                    setTimeout(() => {
                        setVisible(false);
                    }, 6000);
                }
            }
        };

        const interval = setInterval(triggerChatter, 20000);
        // Trigger once shortly after mount
        const initialTimeout = setTimeout(triggerChatter, Math.random() * 8000 + 2000);

        return () => {
            clearInterval(interval);
            clearTimeout(initialTimeout);
        };
    }, [questStats, def, hasEncounter, dailyEncounter]);

    return (
        <div className="relative w-full h-full">
            {/* Quest Exclamation Mark (Point 3) */}
            {hasEncounter && !dailyEncounter.completed && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-[25] animate-bounce pointer-events-none drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                    <div className="bg-amber-500 text-black font-extrabold rounded-full w-5 h-5 flex items-center justify-center border-2 border-yellow-300 shadow text-xs select-none">
                        !
                    </div>
                </div>
            )}

            {/* Speech Bubble */}
            {chatter && (
                <div
                    className={`absolute -top-14 left-1/2 -translate-x-1/2 z-[30] bg-zinc-950/95 text-[10px] text-amber-100 px-2.5 py-1.5 rounded-xl border border-amber-500/40 shadow-2xl transition-all duration-500 min-w-[125px] max-w-[160px] text-center font-serif pointer-events-none leading-relaxed select-none ${
                        visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
                    }`}
                >
                    {chatter}
                    {/* Bubble tail */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-950 border-r border-b border-amber-500/40 rotate-45" />
                </div>
            )}

            {/* Visual Sprite */}
            <div className="absolute inset-x-0 bottom-0 top-0">
                <CreatureSprite
                    creature={def}
                    isPlayerOnTile={isPlayerOnTile}
                    tileSize={100}
                    isFavorite={citizen?.favorite || false}
                    isHarvestReady={isHarvestReady}
                    isSleepy={isSleepy}
                />
            </div>
        </div>
    );
}

export function CreatureLayer({ grid, mapType, playerPosition, onCreatureClick }: Omit<CreatureLayerProps, 'tileSize'>) {
    const [activeCreatures, setActiveCreatures] = useState<ActiveCreature[]>([]);
    const [playerTile, setPlayerTile] = useState<{ row: number; col: number } | null>(null);
    const { user, isLoaded } = useUser();
    const containerRef = useRef<HTMLDivElement>(null);

    const { toast } = useToast();
    const loadCitizens = useCitizensStore(state => state.loadCitizens);
    const citizens = useCitizensStore(state => state.citizens);
    const feedCitizen = useCitizensStore(state => state.feedCitizen);
    const harvestCitizen = useCitizensStore(state => state.harvestCitizen);
    const isSleepy = useCitizensStore(state => state.isSleepy);
    const offlineCatchup = useCitizensStore(state => state.offlineCatchup);
    const clearOfflineCatchup = useCitizensStore(state => state.clearOfflineCatchup);
    const activePartnerId = useGameStore(state => state.activePartnerId);

    const [selectedCitizenId, setSelectedCitizenId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inventoryFoods, setInventoryFoods] = useState<{ id: string; name: string; quantity: number; emoji: string }[]>([]);
    const [isInteracting, setIsInteracting] = useState(false);
    const [quoteIndex, setQuoteIndex] = useState(0);

    const [questStats, setQuestStats] = useState<{ total: number; completed: number } | null>(null);
    
    // Daily Citizen Encounters / Whispers (Point 3)
    interface DailyEncounter {
        date: string;
        citizenId: string;
        materialId: string;
        amount: number;
        completed: boolean;
        text: string;
        rewardGold: number;
    }
    const [dailyEncounter, setDailyEncounter] = useState<DailyEncounter | null>(null);
    const [materialsCount, setMaterialsCount] = useState<Record<string, number>>({});

    const refreshInventory = useCallback(async () => {
        if (!user?.id) return;
        try {
            const items = await getInventory(user.id);
            const counts: Record<string, number> = {};
            items.forEach(item => {
                counts[item.id] = item.quantity;
            });
            setMaterialsCount(counts);
        } catch (e) {
            console.error('Failed to load inventory for daily encounter check:', e);
        }
    }, [user]);

    // Load inventory on mount or when modal opens
    useEffect(() => {
        if (user) {
            refreshInventory();
        }
    }, [user, isModalOpen, refreshInventory]);

    // Setup daily encounter
    useEffect(() => {
        if (!isLoaded || !user?.id || citizens.length === 0) return;

        const todayStr = new Date().toISOString().slice(0, 10);
        const storedStr = localStorage.getItem('daily_kingdom_encounter');
        
        let encounter: DailyEncounter | null = null;
        if (storedStr) {
            try {
                const parsed = JSON.parse(storedStr);
                if (parsed && parsed.date === todayStr) {
                    encounter = parsed;
                }
            } catch (e) {}
        }

        if (!encounter) {
            // Pick a random citizen
            const randomCitizen = citizens[Math.floor(Math.random() * citizens.length)];
            if (randomCitizen) {
                const materials = [
                    { id: 'material-logs', name: 'Wood Logs', emoji: '🪵', verb: 'build a sturdier fence' },
                    { id: 'material-stone', name: 'Stone Blocks', emoji: '🪨', verb: 'reinforce the foundation' },
                    { id: 'material-steel', name: 'Steel Sheets', emoji: '⛓️', verb: 'mend some rusted tools' }
                ];
                const mat = materials[Math.floor(Math.random() * materials.length)]!;
                const amount = Math.floor(Math.random() * 2) + 1; // 1 or 2
                const rewardGold = amount * 30 + 10;
                
                encounter = {
                    date: todayStr,
                    citizenId: randomCitizen.id,
                    materialId: mat.id,
                    amount,
                    completed: false,
                    text: `needs ${amount}x ${mat.name} ${mat.emoji} to ${mat.verb}`,
                    rewardGold
                };
                localStorage.setItem('daily_kingdom_encounter', JSON.stringify(encounter));
            }
        }

        setDailyEncounter(encounter);
    }, [isLoaded, user, citizens]);

    useEffect(() => {
        if (!user) return;
        const fetchQuests = async () => {
            try {
                const res = await fetch(`/api/quests?t=${Date.now()}`);
                if (res.ok) {
                    const questsList = await res.json();
                    if (Array.isArray(questsList)) {
                        const total = questsList.length;
                        const completed = questsList.filter((q: any) => q.completed).length;
                        setQuestStats({ total, completed });
                    }
                }
            } catch (err) {
                logger.warn('[CreatureLayer] Failed to fetch quest stats:', err);
            }
        };
        fetchQuests();
    }, [user]);

    // Get the selected citizen object from the store dynamically
    const selectedCitizen = citizens.find(c => c.id === selectedCitizenId) || null;

    // Rotate quotes every 2 seconds when modal is open
    useEffect(() => {
        if (!isModalOpen || !selectedCitizen || !selectedCitizen.greetings || selectedCitizen.greetings.length <= 1) {
            return;
        }
        
        // Reset to 0 when opening a new citizen
        const interval = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % selectedCitizen.greetings.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [isModalOpen, selectedCitizen]);

    // Update player tile when playerPosition prop changes
    useEffect(() => {
        if (playerPosition) {
            setPlayerTile({ row: playerPosition.y, col: playerPosition.x });
        }
    }, [playerPosition]);

    // Load citizens when user is available
    useEffect(() => {
        if (isLoaded && user?.id) {
            loadCitizens(user.id).then(() => {
                if (activePartnerId) {
                    useCitizensStore.getState().triggerAutopilotHarvest(user.id, activePartnerId)
                        .then((res) => {
                            if (res && res.count > 0) {
                                toast({
                                    title: "🐾 Autopilot Collection! 🪙",
                                    description: `${res.partnerName} harvested gold from ${res.count} wandering citizens! Received +${res.gold} Gold.`,
                                    duration: 5000
                                });
                            }
                        });
                }
            });
        }
    }, [isLoaded, user?.id, loadCitizens, activePartnerId]);

    // Sync active, fed citizens to maps (capped at 12, prioritizing favorites)
    useEffect(() => {
        if (!isLoaded || !user) return;
        if (citizens.length === 0) return;

        // Get all active and fed citizens (excluding animals, which are handled separately)
        const activeFed = citizens.filter(c => c.active);

        // Prioritize favorites and cap at 12
        const prioritized = [...activeFed].sort((a, b) => {
            if (a.favorite && !b.favorite) return -1;
            if (!a.favorite && b.favorite) return 1;
            return 0;
        });
        const capped = prioritized.slice(0, 12);
        const cappedIds = new Set(capped.map(c => c.id));

        setActiveCreatures(prev => {
            // Keep existing creatures that are still active/fed/capped
            const next = prev.filter(c => cappedIds.has(c.definitionId));

            // Find which capped citizens are NOT yet spawned
            const spawnedIds = new Set(next.map(c => c.definitionId));
            const toSpawn = capped.filter(c => !spawnedIds.has(c.id));

            toSpawn.forEach(c => {
                const spawnPoint = findRandomSpawnPoint(grid, c.type);
                if (spawnPoint) {
                    next.push({
                        instanceId: `${c.id}-${Date.now()}-${Math.random()}`,
                        definitionId: c.id,
                        position: spawnPoint,
                        targetPosition: spawnPoint,
                        state: 'idle'
                    });
                }
            });

            return next;
        });
    }, [citizens, grid, isLoaded, user]);

    // Wandering Logic - Different for Kingdom vs Realm
    useEffect(() => {
        if (activeCreatures.length === 0) return;

        const moveCreature = (creature: ActiveCreature) => {
            const def = citizens.find(c => c.id === creature.definitionId) || CREATURE_DEFINITIONS[creature.definitionId];
            if (!def) return creature;

            const neighbors = getNeighbors(creature.position, grid);
            const validNeighbors = neighbors.filter(n => n.tile && isHabitatMatch(n.tile, def.type));

            if (validNeighbors.length > 0) {
                const nextTile = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
                if (nextTile) {
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
                    // Game Design juice: Link citizen walk speed to streak & Chaos Rifts
                    const stats = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('character-stats') || '{}') : {};
                    const streak = stats.streak || 0;
                    const hasChaosRift = (stats.missedHabits || stats.uncompletedQuestsCount || 0) > 10;
                    
                    let speedMultiplier = Math.min(Math.max(1 + (streak * 0.15), 0.5), 2.5);
                    if (hasChaosRift) {
                        speedMultiplier = 0.35; // Slow down significantly during Chaos Rifts
                    }
                    
                    const minDelay = 2000 / speedMultiplier;
                    const maxDelay = 10000 / speedMultiplier;
                    const delay = Math.random() * (maxDelay - minDelay) + minDelay;

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
    }, [grid, activeCreatures.length, mapType, citizens]);

    // Track Player Position (Kingdom Mouse Hover or Realm playerPosition)
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

    const loadLayerInventoryFood = async (userId: string) => {
        const inv = await getInventory(userId);
        const foodItems = inv
            .filter(item => FOOD_DAYS_MAP[item.id] !== undefined && item.quantity > 0)
            .map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                emoji: item.emoji || '🐟'
            }));

        const tileInv = await loadTileInventory(userId);
        if (tileInv && typeof tileInv === 'object') {
            Object.entries(tileInv).forEach(([rawKey, value]) => {
                const key = rawKey === 'water' ? 'material-water' : rawKey;
                if (FOOD_DAYS_MAP[key] !== undefined && value && value.quantity > 0) {
                    const name = key === 'material-water' ? 'Water' : (value.name || key);
                    const emoji = key === 'material-water' ? '💧' : (value.emoji || '📦');
                    foodItems.push({
                        id: key,
                        name,
                        quantity: value.quantity,
                        emoji
                    });
                }
            });
        }
        return foodItems;
    };

    const handleCreatureClick = async (creature: ActiveCreature) => {
        if (!user) return;
        
        if (isSleepy) {
            toast({
                title: "Citizens are Sleepy! Zzz...",
                description: "Complete a daily habit to wake them up!",
                variant: "destructive"
            });
            return;
        }

        const citizen = citizens.find(c => c.id === creature.definitionId);
        if (!citizen) return;

        setSelectedCitizenId(citizen.id);
        setQuoteIndex(0); // Reset quote when opening
        setIsModalOpen(true);

        if (user?.id) {
            try {
                const foodItems = await loadLayerInventoryFood(user.id);
                setInventoryFoods(foodItems);
            } catch (error) {
                logger.error('Failed to load inventory food for modal:', error);
            }
        }
    };

    const handleFeed = async (foodId: string) => {
        if (!user?.id || !selectedCitizenId) return;
        setIsInteracting(true);
        try {
            const success = await feedCitizen(user.id, selectedCitizenId, foodId);
            if (success) {
                const feedEmoji = foodId === 'material-water' ? '💧' : '🐟';
                toast({
                    title: `Citizen Fed ${feedEmoji}`,
                    description: `${selectedCitizen?.name} has been fed! They are happy and active.`,
                });
                
                // Dispatch event so other pages (like Character inventory) sync up
                window.dispatchEvent(new Event('character-inventory-update'));
                
                // Reload food
                const foodItems = await loadLayerInventoryFood(user.id);
                setInventoryFoods(foodItems);
            } else {
                toast({
                    title: "Feeding Failed",
                    description: "You don't have enough food in your inventory.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            logger.error('Failed to feed citizen:', error);
        } finally {
            setIsInteracting(false);
        }
    };

    const getCitizenSynergy = useCallback((citizenId: string) => {
        const citizen = citizens.find(c => c.id === citizenId);
        if (!citizen) return { multiplier: 1, elementMatch: false, roadMatch: false, tileName: 'Vacant' };

        const creature = activeCreatures.find(c => c.definitionId === citizenId);
        if (!creature) return { multiplier: 1, elementMatch: false, roadMatch: false, tileName: 'Vacant' };

        const tile = grid[creature.position.row]?.[creature.position.col];
        if (!tile) return { multiplier: 1, elementMatch: false, roadMatch: false, tileName: 'Vacant' };

        const elementMatch = isHabitatMatch(tile, citizen.type);
        
        const neighbors = getNeighbors(creature.position, grid);
        const roadMatch = neighbors.some(n => n.tile && (
            n.tile.type?.toLowerCase()?.includes('road') || 
            n.tile.type?.toLowerCase()?.includes('path')
        ));

        let multiplier = 1;
        if (elementMatch) multiplier += 0.25;
        if (roadMatch) multiplier += 0.10;

        return {
            multiplier,
            elementMatch,
            roadMatch,
            tileName: tile.name || tile.type || 'Vacant'
        };
    }, [citizens, activeCreatures, grid]);

    const handleHarvest = async (multiplier?: number) => {
        if (!user?.id || !selectedCitizenId || !selectedCitizen) return;
        setIsInteracting(true);
        try {
            const success = await harvestCitizen(user.id, selectedCitizenId, multiplier);
            if (success) {
                toast({
                    title: "Harvest Collected! 🪙",
                    description: `Successfully collected daily rewards from ${selectedCitizen.name}!`,
                });
                
                // Dispatch event for any other listeners
                window.dispatchEvent(new Event('character-inventory-update'));
                setIsModalOpen(false);
            }
        } catch (error) {
            logger.error('Failed to harvest citizen:', error);
        } finally {
            setIsInteracting(false);
        }
    };

    const handleFulfillRequest = async () => {
        if (!user?.id || !dailyEncounter || dailyEncounter.completed || !selectedCitizen) return;
        
        const owned = materialsCount[dailyEncounter.materialId] || 0;
        if (owned < dailyEncounter.amount) {
            toast({
                title: "Missing Materials",
                description: "You don't have enough materials to fulfill this request.",
                variant: "destructive"
            });
            return;
        }

        setIsInteracting(true);
        try {
            await removeFromInventory(user.id, dailyEncounter.materialId, dailyEncounter.amount);
            
            // Award gold
            await gainGold(dailyEncounter.rewardGold, 'daily-encounter-request');
            
            // Trigger coin burst animation
            window.dispatchEvent(new CustomEvent('coin-burst', {
                detail: { amount: dailyEncounter.rewardGold, x: window.innerWidth / 2, y: window.innerHeight / 2 }
            }));

            // Update state and localStorage
            const updated = { ...dailyEncounter, completed: true };
            setDailyEncounter(updated);
            localStorage.setItem('daily_kingdom_encounter', JSON.stringify(updated));

            toast({
                title: "🔧 Request Fulfilled!",
                description: `You helped ${selectedCitizen.name} and received +${dailyEncounter.rewardGold} Gold!`,
                className: "bg-zinc-900 border-amber-500/50 border text-white shadow-2xl"
            });

            // Dispatch event so other pages (like Character inventory) sync up
            window.dispatchEvent(new Event('character-inventory-update'));

            // Refresh inventory
            refreshInventory();
        } catch (e) {
            console.error('Error fulfilling daily request:', e);
            toast({
                title: "Request Failed",
                description: "An error occurred while transferring materials.",
                variant: "destructive"
            });
        } finally {
            setIsInteracting(false);
        }
    };


    if (!grid || grid.length === 0 || !grid[0]) return null;

    const rows = grid.length;
    const cols = grid[0].length;

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 pointer-events-none z-10"
        >
            {/* Offline Catch-up Modal */}
            <Dialog open={!!offlineCatchup} onOpenChange={(open) => {
                if (!open && offlineCatchup) clearOfflineCatchup();
            }}>
                <DialogContent
                    className="w-[min(90vw,400px)] max-h-[90vh] overflow-y-auto p-0 shadow-2xl rounded-2xl bg-gradient-to-b from-amber-950/90 via-zinc-950 to-zinc-950 border border-amber-700/30 shadow-amber-500/10 text-white animate-in zoom-in-95 duration-200"
                    role="dialog"
                    aria-label="offline-catchup-modal"
                >
                    {/* Hidden a11y header */}
                    <DialogHeader className="sr-only">
                        <DialogTitle>While You Were Away...</DialogTitle>
                        <DialogDescription>Your active citizens gathered resources while you were gone!</DialogDescription>
                    </DialogHeader>

                    {/* Background glow */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-20 bg-amber-900/30" />
                    </div>

                    {/* Portrait & Title Section */}
                    <div className="relative z-10 flex flex-col items-center pt-10 pb-4 px-6">
                        <div className="relative group">
                            {/* Pulsing glow */}
                            <div className="absolute inset-0 rounded-full blur-3xl animate-pulse scale-150 opacity-20 bg-amber-900/30" />
                            {/* Rotating ring */}
                            <div
                                className="absolute -inset-4 border border-dashed rounded-full opacity-30 text-amber-400 border-amber-500"
                                style={{ animation: 'spin 15s linear infinite' }}
                            />
                            {/* Portrait circle */}
                            <div className="relative w-36 h-36 rounded-full border-4 shadow-2xl overflow-hidden p-1 bg-zinc-900 border-amber-700/30 group-hover:scale-105 transition-transform duration-500">
                                <div className="relative w-full h-full rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-zinc-950">
                                    <Image
                                        src="/images/placeholders/report_scroll.png"
                                        alt="Offline Catch-up"
                                        fill
                                        className="object-cover p-1 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 pointer-events-none" />
                                </div>
                            </div>
                            {/* Sparkle decorations */}
                            <Sparkles className="absolute -top-3 -right-3 w-5 h-5 animate-pulse opacity-60 text-amber-400" />
                            <Star className="absolute -bottom-2 -left-3 w-5 h-5 animate-pulse opacity-40 text-amber-400" style={{ animationDelay: '0.5s' }} />
                        </div>

                        {/* Name & description */}
                        <h2 className="mt-6 text-2xl font-serif font-semibold text-center text-amber-400">
                            While You Were Away...
                        </h2>
                        <p className="mt-2 text-zinc-300/80 text-sm leading-relaxed text-center">
                            Your active citizens gathered resources while you were gone!
                        </p>
                    </div>

                    {/* Resources & Items Data */}
                    {offlineCatchup && (
                        <div className="relative z-10 px-6 pb-6 space-y-4">
                            {offlineCatchup.gold > 0 && (
                                <div className="bg-zinc-900 p-4 rounded-xl border border-amber-900/20 text-center flex items-center justify-center gap-3">
                                    <span className="text-3xl">🪙</span>
                                    <div className="text-left">
                                        <div className="text-xl font-bold text-yellow-500">{offlineCatchup.gold} Gold</div>
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Found by your citizens</div>
                                    </div>
                                </div>
                            )}

                            {Object.values(offlineCatchup.items).length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs uppercase tracking-widest text-amber-500/70 text-center font-semibold">Items Gathered</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.values(offlineCatchup.items).map((item, idx) => (
                                            <div key={idx} className="bg-zinc-900 p-3 rounded-xl border border-amber-900/20 flex items-center gap-3">
                                                <span className="text-2xl drop-shadow-md">{item.emoji}</span>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-amber-100 truncate pr-2">{item.name}</span>
                                                    <span className="text-xs text-zinc-400">x{item.quantity}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action button */}
                    <div className="relative z-10 px-6 pb-6">
                        <Button
                            className="w-full h-11 text-white rounded-xl bg-amber-600 hover:bg-amber-500 shadow-lg font-bold transition-all"
                            onClick={clearOfflineCatchup}
                        >
                            Claim Rewards
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {activeCreatures.map(creature => {
                const citizen = citizens.find(c => c.id === creature.definitionId);
                const def = citizen || CREATURE_DEFINITIONS[creature.definitionId];
                if (!def) {
                    logger.warn('[CreatureLayer] No definition found for creature:', creature.definitionId);
                    return null;
                }

                const isPlayerOnTile = !!playerTile && playerTile.row === creature.position.row && playerTile.col === creature.position.col;

                return (
                    <div
                        key={creature.instanceId}
                        className="absolute transition-all ease-in-out pointer-events-none z-20"
                        style={{
                            top: `${(creature.position.row / rows) * 100}%`,
                            left: `${(creature.position.col / cols) * 100}%`,
                            width: `${(1 / cols) * 100}%`,
                            height: `${(1 / rows) * 100}%`,
                            transitionDuration: '3000ms'
                        }}
                    >
                        {/* Smaller Hit Area for Interaction */}
                        <div 
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] pointer-events-auto cursor-pointer hover:scale-125 transition-transform z-30 flex items-center justify-center rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCreatureClick(creature);
                            }}
                        />

                        <CitizenWithChatter
                            creature={creature}
                            def={def}
                            isPlayerOnTile={isPlayerOnTile}
                            isSleepy={isSleepy}
                            questStats={questStats}
                            citizen={citizen}
                            isHarvestReady={citizen ? isHarvestReady(citizen) : false}
                            dailyEncounter={dailyEncounter}
                        />
                    </div>
                );
            })}

            {/* Citizen Interaction Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent 
                    className="w-[min(90vw,420px)] max-w-none p-0 overflow-hidden shadow-2xl rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 border border-zinc-800 shadow-amber-500/5 text-white"
                >
                    <DialogHeader className="sr-only">
                        <DialogTitle>{selectedCitizen?.name || "Citizen Interaction"}</DialogTitle>
                        <DialogDescription>Interact with your realm citizen</DialogDescription>
                    </DialogHeader>

                    {/* Ambient category glow */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-20 ${
                            selectedCitizen?.type === 'fire' ? 'bg-red-500' :
                            selectedCitizen?.type === 'water' ? 'bg-blue-500' :
                            selectedCitizen?.type === 'earth' ? 'bg-amber-600' :
                            selectedCitizen?.type === 'nature' ? 'bg-emerald-500' :
                            selectedCitizen?.type === 'ice' ? 'bg-cyan-400' :
                            selectedCitizen?.type === 'monster' ? 'bg-purple-600' : 'bg-yellow-500'
                        }`} />
                    </div>

                    <div className="relative z-10 flex flex-col items-center pt-8 pb-4 px-6">
                        {/* Portrait */}
                        <div className="relative w-32 h-32 flex items-center justify-center bg-zinc-900 rounded-full border-2 border-zinc-800 shadow-xl overflow-hidden p-4">
                            {selectedCitizen && (
                                <div className="w-24 h-24 relative">
                                    <Image
                                        src={selectedCitizen.isMythic 
                                            ? `/images/Mythics/${selectedCitizen.filename}?v=2` 
                                            : `/images/creatures/${selectedCitizen.filename}`
                                        }
                                        alt={selectedCitizen.name}
                                        fill
                                        sizes="96px"
                                        className="object-contain drop-shadow-md"
                                        onError={(e) => {
                                            logger.warn('Failed to load modal citizen image:', selectedCitizen.name);
                                        }}
                                    />
                                </div>
                            )}
                            {selectedCitizen?.favorite && (
                                <div className="absolute top-1 right-1 bg-amber-500 text-black rounded-full p-1 border border-yellow-300 shadow z-20">
                                    <Star className="w-3 h-3 fill-current" />
                                </div>
                            )}
                        </div>

                        {/* Title & Habitat badge */}
                        <h2 className="mt-4 text-2xl font-serif font-semibold text-center text-amber-500">
                            {selectedCitizen?.name}
                        </h2>
                        
                        <div className="mt-1 flex items-center gap-1.5">
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                                selectedCitizen?.type === 'fire' ? 'bg-red-950/40 text-red-400 border-red-900/50' :
                                selectedCitizen?.type === 'water' ? 'bg-blue-950/40 text-blue-400 border-blue-900/50' :
                                selectedCitizen?.type === 'earth' ? 'bg-amber-950/40 text-amber-600 border-amber-900/50' :
                                selectedCitizen?.type === 'nature' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' :
                                selectedCitizen?.type === 'ice' ? 'bg-cyan-950/40 text-cyan-400 border-cyan-900/50' :
                                selectedCitizen?.type === 'monster' ? 'bg-purple-950/40 text-purple-400 border-purple-900/50' :
                                'bg-yellow-950/40 text-yellow-400 border-yellow-900/50'
                            }`}>
                                {selectedCitizen?.type} Citizen
                            </span>
                            {selectedCitizen?.isMythic && (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-800/50 flex items-center gap-0.5">
                                    <Sparkles className="w-2.5 h-2.5" /> Mythic
                                </span>
                            )}
                        </div>

                        {/* Speech Bubble / Greeting */}
                        <div className="mt-4 bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-2.5 text-zinc-300 text-xs text-center italic max-w-xs relative transition-opacity duration-300">
                            {(() => {
                                if (!selectedCitizen) return null;
                                const pool = getUnifiedChatterPool(selectedCitizen, questStats);
                                const quote = pool[quoteIndex % (pool.length || 1)] || "";
                                return <span>&ldquo;{quote}&rdquo;</span>;
                            })()}
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-900 rotate-45 border-t border-l border-zinc-800/60" />
                        </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="relative z-10 px-6 pb-6 flex flex-col gap-2">
                        {/* Synergy Info */}
                        {(() => {
                            const synergy = selectedCitizen ? getCitizenSynergy(selectedCitizen.id) : { multiplier: 1, elementMatch: false, roadMatch: false, tileName: 'Vacant' };
                            return (
                                <div className="bg-zinc-900 border border-zinc-800/40 rounded-xl p-3 flex flex-col gap-2 text-[11px] mb-1">
                                    <div className="flex justify-between items-center text-zinc-400 pb-1.5 border-b border-zinc-800/50">
                                        <span>Habitat Location:</span>
                                        <span className="font-semibold text-zinc-200 capitalize">{synergy.tileName}</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5 mt-0.5">
                                        {synergy.elementMatch ? (
                                            <div className="flex items-center justify-between text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-1 rounded">
                                                <span className="flex items-center gap-1.5"><span className="text-emerald-500 font-black">✓</span> Element Match</span>
                                                <span className="text-[10px] font-mono font-semibold">+25%</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between text-zinc-500 bg-zinc-900/30 border border-zinc-900/20 px-2.5 py-1 rounded">
                                                <span className="flex items-center gap-1.5"><span className="text-zinc-600 font-bold">✗</span> Element Match</span>
                                                <span className="text-[10px] font-mono">--</span>
                                            </div>
                                        )}
                                        
                                        {synergy.roadMatch ? (
                                            <div className="flex items-center justify-between text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-1 rounded">
                                                <span className="flex items-center gap-1.5"><span className="text-emerald-500 font-black">✓</span> Trade Route Match</span>
                                                <span className="text-[10px] font-mono font-semibold">+10%</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between text-zinc-500 bg-zinc-900/30 border border-zinc-900/20 px-2.5 py-1 rounded">
                                                <span className="flex items-center gap-1.5"><span className="text-zinc-600 font-bold">✗</span> Trade Route Match</span>
                                                <span className="text-[10px] font-mono">--</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-zinc-400 border-t border-zinc-800/50 pt-2 mt-0.5">
                                        <span>Production Rate:</span>
                                        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 font-mono text-xs">
                                            {synergy.multiplier.toFixed(2)}x Yield
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Daily Request Panel (Point 3) */}
                        {selectedCitizen && dailyEncounter && dailyEncounter.citizenId === selectedCitizen.id && (
                            <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-2.5 text-xs mb-1">
                                <div className="flex items-center gap-1.5 text-amber-400 font-bold border-b border-zinc-800/50 pb-1.5">
                                    <span>👑 Daily Citizen Request</span>
                                </div>
                                <p className="text-zinc-300 text-[11px] leading-relaxed italic">
                                    "{selectedCitizen.name} {dailyEncounter.text}."
                                </p>
                                
                                {dailyEncounter.completed ? (
                                    <div className="bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 font-bold rounded-lg py-2 text-center text-[11px] flex items-center justify-center gap-1">
                                        <span>✓ Request Completed! (+{dailyEncounter.rewardGold} Gold)</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center text-[10px] text-zinc-400">
                                            <span>Required Material:</span>
                                            <span className="font-semibold text-zinc-200">
                                                {dailyEncounter.amount}x {dailyEncounter.materialId === 'material-logs' ? 'Wood Logs 🪵' : dailyEncounter.materialId === 'material-stone' ? 'Stone Blocks 🪨' : 'Steel Sheets ⛓️'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-zinc-400">
                                            <span>Your Inventory:</span>
                                            <span className={cn(
                                                "font-semibold",
                                                (materialsCount[dailyEncounter.materialId] || 0) >= dailyEncounter.amount ? "text-emerald-400" : "text-red-400"
                                            )}>
                                                {materialsCount[dailyEncounter.materialId] || 0} owned
                                            </span>
                                        </div>

                                        <Button
                                            onClick={handleFulfillRequest}
                                            disabled={isInteracting || (materialsCount[dailyEncounter.materialId] || 0) < dailyEncounter.amount}
                                            className="w-full h-9 mt-1 bg-amber-600 hover:bg-amber-500 text-black font-semibold text-[11px] rounded-lg"
                                        >
                                            Fulfill Request (+{dailyEncounter.rewardGold} Gold)
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Cooldown or Harvest Button */}
                        {selectedCitizen && isHarvestReady(selectedCitizen) ? (
                            <Button
                                onClick={() => {
                                    const synergy = getCitizenSynergy(selectedCitizen.id);
                                    handleHarvest(synergy.multiplier);
                                }}
                                disabled={isInteracting}
                                className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-black font-serif font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:shadow-[0_0_25px_rgba(245,158,11,0.7)] transition-all hover:-translate-y-0.5"
                            >
                                <Coins className="w-4 h-4" /> Collect Gold 💰
                            </Button>
                        ) : selectedCitizen && !isCitizenHungry(selectedCitizen) ? (
                            <div className="bg-zinc-950 border border-zinc-800/40 rounded-xl p-3 flex flex-col items-center justify-center gap-1">

                                <span className="text-xs text-zinc-400">Next gold harvest available in:</span>
                                <div className="text-amber-500 font-semibold text-sm flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> 
                                    {(() => {
                                        if (!selectedCitizen.lastHarvestedAt) return "Ready!";
                                        const nextHarvest = new Date(selectedCitizen.lastHarvestedAt).getTime() + 24 * 60 * 60 * 1000;
                                        const diff = nextHarvest - Date.now();
                                        if (diff <= 0) return "Ready!";
                                        const hrs = Math.floor(diff / (1000 * 60 * 60));
                                        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                        return `${hrs}h ${mins}m`;
                                    })()}
                                </div>
                            </div>
                        ) : null}

                        {/* Feeding Section if Hungry */}
                        {selectedCitizen && isCitizenHungry(selectedCitizen) && (
                            <div className="flex flex-col gap-2">
                                <div className="text-center text-xs text-red-400 font-semibold mb-1 flex items-center justify-center gap-1">
                                    😋 Needs Fish Food to wander map & produce gold!
                                </div>
                                {inventoryFoods.length === 0 ? (
                                    <Button disabled className="w-full h-11 bg-zinc-800 text-zinc-500 rounded-xl border border-zinc-700">
                                        No Fish Food in Inventory 🐟
                                    </Button>
                                ) : (
                                    <div className="flex flex-col gap-1.5">
                                        {inventoryFoods.map(food => (
                                            <Button
                                                key={food.id}
                                                onClick={() => handleFeed(food.id)}
                                                disabled={isInteracting}
                                                className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-xl flex items-center justify-between px-4 shadow border border-orange-500/20"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span>{food.emoji}</span>
                                                    <span className="text-xs font-semibold">{food.name} (x{food.quantity})</span>
                                                </div>
                                                <span className="text-[10px] bg-zinc-950 text-orange-200 px-2 py-0.5 rounded-md font-mono">
                                                    +{FOOD_DAYS_MAP[food.id]} Day{FOOD_DAYS_MAP[food.id] !== 1 ? 's' : ''} Active
                                                </span>
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            onClick={() => setIsModalOpen(false)}
                            className="w-full h-10 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-xl mt-1 text-xs"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
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
        // logger.debug(`[CreatureLayer] No specific habitat found for ${habitatType}, trying fallback to grass/vacant`);
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

    // logger.debug('[isHabitatMatch] Checking tile type:', tileType, 'against habitat:', habitatType);

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
