"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback } from "react"
import { X, Sparkles, Star, Clock, Check, ChevronDown, Utensils, Heart } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

import { useCitizensStore, isCitizenHungry, isHarvestReady, FOOD_DAYS_MAP, Citizen } from '@/stores/citizensStore';
import { getInventory } from '@/lib/inventory-manager';
import { loadTileInventory } from '@/lib/data-loaders';
import { useGameStore } from '@/stores/game-store';
import { CreatureDef } from '@/app/dungeon/game-logic';
import { getCharacterStats } from "@/lib/character-stats-service";

export function CitizensTab() {
  const { user } = useUser()
  const activePartnerId = useGameStore(state => state.activePartnerId);
  const setActivePartnerId = useGameStore(state => state.setActivePartnerId);
  const loadCitizens = useCitizensStore(state => state.loadCitizens);
  const citizens = useCitizensStore(state => state.citizens);
  const toggleActive = useCitizensStore(state => state.toggleActive);
  const toggleFavorite = useCitizensStore(state => state.toggleFavorite);
  const feedCitizen = useCitizensStore(state => state.feedCitizen);

  const [citizenFilter, setCitizenFilter] = useState<"all" | "active" | "inactive" | "favorites">("all");
  const [inventoryFood, setInventoryFood] = useState<{ id: string; name: string; quantity: number; emoji: string }[]>([]);
  const [feedModalCitizenId, setFeedModalCitizenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [playerLevel, setPlayerLevel] = useState(1);

  const loadInventoryFood = useCallback(async () => {
    if (!user?.id) return;
    try {
      const inv = await getInventory(user.id);
      const foodItems = inv
        .filter(item => FOOD_DAYS_MAP[item.id] !== undefined && item.quantity > 0)
        .map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          emoji: item.emoji || '🐟'
        }));

      const tileInv = await loadTileInventory(user.id);
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

      setInventoryFood(foodItems);
    } catch (error) {
      logger.error('Failed to load inventory food', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadCitizens(user.id);
      const stats = getCharacterStats();
      if (stats && stats.level) {
        setPlayerLevel(stats.level);
      }
    }
  }, [user?.id, loadCitizens]);

  useEffect(() => {
    loadInventoryFood();
    window.addEventListener('character-inventory-update', loadInventoryFood);
    return () => {
      window.removeEventListener('character-inventory-update', loadInventoryFood);
    };
  }, [loadInventoryFood]);

  const handleToggleActive = async (citizen: Citizen) => {
    if (!user?.id) return;
    
    if (!citizen.active) {
      const activeCount = citizens.filter(c => c.active).length;
      if (activeCount >= 12) {
        toast({
          title: "Active Limit Reached",
          description: "Maximum of 12 active Citizens can wander the Realm. Deactivate another citizen first.",
          variant: "destructive"
        });
        return;
      }
    }
    
    await toggleActive(user.id, citizen.id);
    toast({
      title: citizen.active ? "Citizen Recalled" : "Citizen Sent to Wander",
      description: citizen.active 
        ? `${citizen.name} is resting inside the Citizens tab.` 
        : `${citizen.name} has entered the maps!`,
    });
  };

  const handleEvolve = async (citizen: Citizen, requirement: NonNullable<CreatureDef['evolutionRequirement']>) => {
    if (!user?.id) return;
    
    const characterStats = await getCharacterStats();
    if (!characterStats) return;

    const essenceKey = requirement.essenceType as keyof typeof characterStats;
    const currentEssence = (characterStats as any)[essenceKey] || 0;
    
    if (currentEssence < requirement.amount) {
        toast({ title: "Not enough Essence", description: `You need ${requirement.amount} ${requirement.essenceType.replace('_', ' ')}`, variant: "destructive" });
        return;
    }
    
    try {
        setIsLoading(true);
        const newStats = { ...characterStats, [essenceKey]: currentEssence - requirement.amount };
        
        await fetch('/api/character-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stats_data: newStats })
        });
        
        await fetch('/api/achievements/unlock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ achievementId: requirement.evolvesTo })
        });
        
        toast({ title: "Evolution Complete! ✨", description: `${citizen.name} has evolved into a new form!` });
        
        await loadCitizens(user.id);
    } catch (e) {
        logger.error("Failed to evolve", e);
        toast({ title: "Evolution Failed", description: "Something went wrong.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const getFedTimeRemaining = (citizen: Citizen): string => {
    if (!citizen.lastFedAt) return "Hungry";
    const fedTime = new Date(citizen.lastFedAt).getTime();
    const durationMs = citizen.activeDays * 24 * 60 * 60 * 1000;
    const remaining = fedTime + durationMs - Date.now();
    if (remaining <= 0) return "Hungry";
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getHarvestTimeRemaining = (citizen: Citizen): string => {
    if (!citizen.lastHarvestedAt) return "Ready";
    const lastHarvest = new Date(citizen.lastHarvestedAt).getTime();
    const cooldownMs = 24 * 60 * 60 * 1000;
    const remaining = lastHarvest + cooldownMs - Date.now();
    if (remaining <= 0) return "Ready";
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m`;
  };

  const filteredCitizens = citizens.filter(c => {
    if (citizenFilter === "active") return c.active;
    if (citizenFilter === "inactive") return !c.active;
    if (citizenFilter === "favorites") return c.favorite;
    return true;
  });

  return (
    <div className="w-full animate-fadeIn mt-6">
      <div className="max-w-6xl mx-auto w-full">
        <Card className="medieval-card p-6 mb-8 border border-amber-900/30 bg-zinc-950">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-serif text-amber-500">Kingdom & Realm Citizens</h2>
              <p className="text-zinc-300 text-sm max-w-2xl">
                Manage the magical creatures and cards unlocked through your achievements and mythic packs. 
                Select up to 12 active citizens to wander and populate your maps, keeping the realm alive. 
                Remember to feed them to keep them active, and harvest gold coins daily!
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-zinc-950 p-4 rounded-xl border border-amber-900/20 text-center shrink-0">
              <div>
                <div className="text-xs text-zinc-400">Active Citizens</div>
                <div className="text-lg font-bold text-amber-500 font-serif">
                  {citizens.filter(c => c.active).length} / 12
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400">Total Unlocked</div>
                <div className="text-lg font-bold text-amber-500 font-serif">
                  {citizens.length}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-xs text-zinc-400">Fish Food Available</div>
                <div className="text-lg font-bold text-amber-500 font-serif">
                  {inventoryFood.reduce((acc, f) => acc + f.quantity, 0)}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {(["all", "active", "inactive", "favorites"] as const).map((filter) => (
            <Button
              key={filter}
              variant={citizenFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setCitizenFilter(filter)}
              className={`capitalize font-serif border border-amber-900/30 ${
                citizenFilter === filter 
                  ? "bg-amber-600 hover:bg-amber-700 text-black font-semibold" 
                  : "bg-zinc-950 text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              {filter === "favorites" ? "⭐ Favorites" : filter}
            </Button>
          ))}
        </div>

        {filteredCitizens.length === 0 ? (
          <Card className="bg-zinc-950 border border-amber-900/30 p-12 text-center">
            <p className="text-zinc-500 font-serif">No citizens found matching this filter.</p>
          </Card>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCitizens.map((citizen) => {
              const isHungry = isCitizenHungry(citizen);
              const isReadyToHarvest = isHarvestReady(citizen);
              const imageSrc = citizen.isMythic 
                ? `/images/Mythics/${citizen.filename}?v=2`
                : `/images/creatures/${citizen.filename}`;
              const fedRemaining = getFedTimeRemaining(citizen);
              const harvestRemaining = getHarvestTimeRemaining(citizen);
              
              let habitatColorClass = "border-zinc-800 bg-zinc-900";
              let habitatBadgeColor = "bg-zinc-700 text-zinc-200";
              
              switch (citizen.type) {
                case 'fire':
                  habitatColorClass = "border-red-900/40 bg-red-950/20 hover:border-red-500/30";
                  habitatBadgeColor = "bg-red-900/60 text-red-300";
                  break;
                case 'water':
                  habitatColorClass = "border-blue-900/40 bg-blue-950/20 hover:border-blue-500/30";
                  habitatBadgeColor = "bg-blue-900/60 text-blue-300";
                  break;
                case 'earth':
                  habitatColorClass = "border-amber-900/40 bg-amber-950/20 hover:border-amber-500/30";
                  habitatBadgeColor = "bg-amber-900/60 text-amber-300";
                  break;
                case 'nature':
                  habitatColorClass = "border-emerald-900/40 bg-emerald-950/20 hover:border-emerald-500/30";
                  habitatBadgeColor = "bg-emerald-900/60 text-emerald-300";
                  break;
                case 'ice':
                  habitatColorClass = "border-cyan-900/40 bg-cyan-950/20 hover:border-cyan-500/30";
                  habitatBadgeColor = "bg-cyan-900/60 text-cyan-300";
                  break;
                case 'monster':
                case 'special':
                  habitatColorClass = "border-purple-900/40 bg-purple-950/20 hover:border-purple-500/30";
                  habitatBadgeColor = "bg-purple-900/60 text-purple-300";
                  break;
              }

              return (
                <Card 
                  key={citizen.id} 
                  className={`relative overflow-hidden flex flex-col border transition-all duration-300 rounded-xl ${habitatColorClass} ${
                    citizen.favorite ? 'ring-1 ring-amber-500/30 shadow-md shadow-amber-500/5' : ''
                  }`}
                >
                  <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                    <button
                      onClick={() => toggleFavorite(user!.id, citizen.id)}
                      className="p-1 rounded-full bg-zinc-950 border border-zinc-800 text-amber-500 hover:scale-110 transition-transform duration-200"
                      aria-label={citizen.favorite ? "Unfavorite citizen" : "Favorite citizen"}
                    >
                      <Star className={`w-4 h-4 ${citizen.favorite ? 'fill-amber-500' : 'text-zinc-400'}`} />
                    </button>
                  </div>

                  <CardHeader className="pb-2 pt-4">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-grow">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <CardTitle className="font-serif text-base text-white line-clamp-1">{citizen.name}</CardTitle>
                          <Badge variant="outline" className="bg-amber-950/60 border-amber-500/40 text-amber-400 text-[10px] font-bold px-1.5 py-0">
                            Lvl {citizen.level || 1}
                          </Badge>
                          {activePartnerId === citizen.id && (
                            (() => {
                              const isEvolved = playerLevel >= 50;
                              const elementIcons: Record<string, string> = {
                                fire: '🔥',
                                water: '💧',
                                earth: '🪨',
                                nature: '🍃',
                                ice: '❄️',
                                monster: '😈',
                                special: '🌟'
                              };
                              const elementIcon = elementIcons[citizen.type] || '🐾';
                              return (
                                <Badge className={isEvolved ? "bg-amber-950/80 border-amber-500/30 text-amber-400 text-[9px] font-bold py-0" : "bg-zinc-900 border-zinc-700 text-zinc-400 text-[9px] font-medium py-0"}>
                                  {elementIcon} {isEvolved ? "Evolved Form" : "Evolves at Lvl 50"}
                                </Badge>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow flex flex-col justify-between items-center py-4">
                    <div className="relative w-32 h-32 flex items-center justify-center bg-zinc-950 rounded-xl border border-zinc-800/30 p-4 mb-4 overflow-hidden w-full">
                      <div className={`absolute inset-0 opacity-10 bg-radial-gradient ${
                        citizen.type === 'fire' ? 'from-red-500' :
                        citizen.type === 'water' ? 'from-blue-500' :
                        citizen.type === 'earth' ? 'from-amber-500' :
                        citizen.type === 'nature' ? 'from-emerald-500' :
                        citizen.type === 'ice' ? 'from-cyan-500' : 'from-purple-500'
                      } to-transparent`} />
                      
                      <div className="relative w-24 h-24 transition-transform duration-300 hover:-translate-y-1">
                        <Image
                          src={imageSrc}
                          alt={citizen.name}
                          fill
                          className="object-contain animate-float"
                          sizes="(max-width: 768px) 100px, 150px"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/creatures/001.png';
                          }}
                        />
                      </div>
                    </div>

                    <div className="w-full space-y-2 mt-auto text-xs">
                      <div className="flex justify-between items-center bg-zinc-950 p-2 rounded border border-zinc-800/20">
                        <span className="text-zinc-400">Map Status:</span>
                        <Badge variant={citizen.active ? "default" : "secondary"} className={`font-semibold ${
                          citizen.active ? 'bg-green-600/95 text-white' : 'bg-zinc-850 text-zinc-400'
                        }`}>
                          {citizen.active ? "Wandering" : "Tab Only"}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center bg-zinc-950 p-2 rounded border border-zinc-800/20">
                        <span className="text-zinc-400">Fed Duration:</span>
                        {isHungry ? (
                          <span className="text-red-400 font-semibold flex items-center gap-1">
                            Hungry 🥩
                          </span>
                        ) : (
                          <span className="text-green-400 font-semibold flex items-center gap-1">
                            Fed ({fedRemaining})
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center bg-zinc-950 p-2 rounded border border-zinc-800/20">
                        <span className="text-zinc-400 font-serif">Affection:</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const isFilled = i < Math.floor((citizen.affection || 0) / 20);
                            return (
                              <Heart 
                                key={i} 
                                className={cn(
                                  "w-3 h-3 transition-colors duration-200",
                                  isFilled ? "fill-pink-500 text-pink-500 drop-shadow-[0_0_2px_rgba(244,63,94,0.5)]" : "text-zinc-700"
                                )} 
                              />
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-zinc-950 p-2 rounded border border-zinc-800/20">
                        <span className="text-zinc-400">Daily Gold:</span>
                        {isHungry ? (
                          <span className="text-zinc-500">Requires Feed</span>
                        ) : isReadyToHarvest ? (
                          <span className="text-amber-400 font-semibold flex items-center gap-1 animate-pulse">
                            Collect Taxes ✨
                          </span>
                        ) : (
                          <span className="text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-600" /> {harvestRemaining}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-2 pt-2 pb-4 px-4">
                    <Button
                      size="sm"
                      variant={activePartnerId === citizen.id ? "default" : "outline"}
                      className={`w-full font-semibold text-sm ${
                        activePartnerId === citizen.id
                          ? 'bg-amber-500 text-black hover:bg-amber-400 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-amber-900/40 hover:border-amber-700/50 hover:text-amber-200'
                      }`}
                      onClick={() => setActivePartnerId(activePartnerId === citizen.id ? undefined : citizen.id)}
                    >
                      <Heart className={`w-3.5 h-3.5 mr-1.5 shrink-0 ${activePartnerId === citizen.id ? 'fill-black' : ''}`} />
                      {activePartnerId === citizen.id ? "Partnered" : "Set as Partner"}
                    </Button>

                    <Button
                      size="sm"
                      variant={citizen.active ? "outline" : "default"}
                      className={`w-full font-semibold text-sm ${
                        citizen.active
                          ? 'border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-red-950/40 hover:border-red-800/60 hover:text-red-300'
                          : 'bg-amber-600 text-black hover:bg-amber-500 border-amber-500'
                      }`}
                      onClick={() => handleToggleActive(citizen)}
                    >
                      {citizen.active ? (
                        <><X className="w-3.5 h-3.5 mr-1.5 shrink-0" />Set to Tab Only</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5 mr-1.5 shrink-0" />Let Wander Map</>
                      )}
                    </Button>

                    {isHungry ? (
                      <div className="w-full">
                        {inventoryFood.length === 0 ? (
                          <Button disabled size="sm" className="w-full bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs">
                            <Utensils className="w-3.5 h-3.5 mr-1.5 shrink-0" />No Food in Inventory
                          </Button>
                        ) : feedModalCitizenId === citizen.id ? (
                          <div className="w-full rounded-lg border border-amber-800/40 bg-zinc-950 overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 bg-amber-950/30 border-b border-amber-800/30">
                              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                                <Utensils className="w-3 h-3" />Choose food to feed
                              </span>
                              <button
                                onClick={() => setFeedModalCitizenId(null)}
                                className="text-zinc-500 hover:text-white transition-colors p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex flex-col gap-1 p-2 max-h-48 overflow-y-auto">
                              {inventoryFood.map(f => (
                                <button
                                  key={f.id}
                                  className="flex items-center justify-between w-full text-left px-3 py-2 rounded-md bg-zinc-900 hover:bg-amber-900/30 border border-zinc-800 hover:border-amber-700/50 transition-all duration-150 group"
                                  onClick={async () => {
                                    setFeedModalCitizenId(null);
                                    const success = await feedCitizen(user!.id, citizen.id, f.id);
                                    if (success) {
                                      toast({
                                        title: "Citizen Fed! 🍖",
                                        description: `${citizen.name} is now fed for ${FOOD_DAYS_MAP[f.id] ?? 1} day(s) and will produce gold!`,
                                      });
                                      loadInventoryFood();
                                    }
                                  }}
                                >
                                  <span className="flex items-center gap-2 text-sm text-white">
                                    <span className="text-base">{f.emoji}</span>
                                    <span className="font-medium">{f.name}</span>
                                  </span>
                                  <span className="text-xs text-amber-400 font-semibold bg-amber-950/50 px-1.5 py-0.5 rounded">
                                    ×{f.quantity}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full bg-red-950/60 border border-red-800/50 text-red-300 hover:bg-red-900/50 hover:border-red-600/70 hover:text-red-200 text-sm font-semibold"
                            onClick={() => setFeedModalCitizenId(citizen.id)}
                          >
                            <Utensils className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                            Feed Citizen
                            <ChevronDown className="w-3.5 h-3.5 ml-auto shrink-0 opacity-60" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-green-950/30 border border-green-800/30 text-green-400 text-xs font-semibold">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        Fed and producing Gold!
                      </div>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
