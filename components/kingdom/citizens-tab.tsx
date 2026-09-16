"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback, useMemo } from "react"
import { X, Sparkles, Star, Clock, Check, ChevronDown, Utensils, Heart, Crown } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

import { useCitizensStore, isCitizenHungry, isHarvestReady, FOOD_DAYS_MAP, isFoodItem, getFoodActiveDays, formatFoodDisplayName, Citizen, getCitizenDistrictGreeting } from '@/stores/citizensStore';
import { CitizenSpecializationModal, CitizenClass } from '@/components/character/CitizenSpecializationModal';
import { getInventory } from '@/lib/inventory-manager';
import { loadTileInventory } from '@/lib/data-loaders';
import { useGameStore } from '@/stores/game-store';
import { CreatureDef } from '@/app/dungeon/game-logic';
import { getCharacterStats } from "@/lib/character-stats-service";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Sword as SwordIcon } from "lucide-react"
import { CitizenEquipmentModal } from "./CitizenEquipmentModal"

export function getCitizenImageSrc(citizen: Citizen): string {
  const isMythic = citizen.isMythic || citizen.id?.startsWith('mythic-') || citizen.filename?.startsWith('Mythic');
  if (isMythic && citizen.filename) {
    const fn = citizen.filename.replace(/\.png$/i, '.webp');
    return `/images/Mythics/${fn}?v=2`;
  }

  // Animal companion citizens
  if (citizen.id?.startsWith('9') || ['sheep.webp', 'horse.webp', 'penguin.webp'].includes(citizen.filename?.toLowerCase() || '')) {
    const fn = citizen.filename 
      ? citizen.filename.replace(/\.png$/i, '.webp') 
      : (citizen.id === '901' ? 'sheep.webp' : citizen.id === '902' ? 'horse.webp' : 'penguin.webp');
    return `/images/Animals/${fn}`;
  }

  // Standard creature citizens
  if (citizen.filename) {
    const fn = citizen.filename.replace(/\.png$/i, '.webp');
    return `/images/creatures/${fn}`;
  }

  // Fallback to creature ID
  if (citizen.id) {
    return `/images/creatures/${citizen.id}.webp`;
  }

  return '/images/creatures/001.webp';
}

function getCitizenMiniGear(citizen: any) {
  const eq = citizen.equipment || {};
  const slots: ('weapon' | 'offhand' | 'armor' | 'relic')[] = ['weapon', 'offhand', 'armor', 'relic'];
  return slots.map(slot => {
    const item = eq[slot];
    if (item) {
      return {
        name: `${item.name} (${slot})`,
        img: item.image,
        border: 'border-amber-400/90 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
        isEquipped: true
      };
    }
    const defaultIcons: Record<string, { name: string; img: string }> = {
      weapon: { name: 'Empty weapon socket', img: '/images/items/sword/sword-twig.webp' },
      offhand: { name: 'Empty offhand socket', img: '/images/items/shield/shield-blockado.webp' },
      armor: { name: 'Empty armor socket', img: '/images/items/armor/armor-normalo.webp' },
      relic: { name: 'Empty relic socket', img: '/images/items/materials/material-crystal.webp' }
    };
    return {
      name: defaultIcons[slot]?.name || slot,
      img: defaultIcons[slot]?.img || '/images/items/materials/material-crystal.webp',
      border: 'border-zinc-800 opacity-30',
      isEquipped: false
    };
  });
}

export function CitizensTab() {
  const { user } = useUser()
  const activePartnerId = useGameStore(state => state.activePartnerId);
  const setActivePartnerId = useGameStore(state => state.setActivePartnerId);
  const loadCitizens = useCitizensStore(state => state.loadCitizens);
  const citizens = useCitizensStore(state => state.citizens);
  const toggleActive = useCitizensStore(state => state.toggleActive);
  const toggleFavorite = useCitizensStore(state => state.toggleFavorite);
  const feedCitizen = useCitizensStore(state => state.feedCitizen);
  const mergeDuplicateCitizens = useCitizensStore(state => state.mergeDuplicateCitizens);
  const specializeCitizen = useCitizensStore(state => state.specializeCitizen);
  const hasBanquetHall = useCitizensStore(state => state.hasBanquetHall);
  const unlockBanquetHall = useCitizensStore(state => state.unlockBanquetHall);
  const holdRoyalFeast = useCitizensStore(state => state.holdRoyalFeast);
  const assignDistrictRole = useCitizensStore(state => state.assignDistrictRole);
  const autoAssignAllIdleCitizens = useCitizensStore(state => state.autoAssignAllIdleCitizens);

  const [citizenFilter, setCitizenFilter] = useState<"all" | "active" | "inactive" | "favorites">("all");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [specializeCitizenTarget, setSpecializeCitizenTarget] = useState<Citizen | null>(null);
  const [equipmentModalCitizen, setEquipmentModalCitizen] = useState<Citizen | null>(null);
  const [inventoryFood, setInventoryFood] = useState<{ id: string; name: string; quantity: number; emoji: string }[]>([]);
  const [feedModalCitizenId, setFeedModalCitizenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [playerLevel, setPlayerLevel] = useState(1);

  const hungryCitizens = useMemo(() => {
    return citizens.filter(c => isCitizenHungry(c));
  }, [citizens]);

  const idleCitizens = useMemo(() => {
    return citizens.filter(c => !c.districtRole);
  }, [citizens]);

  const districtCounts = useMemo(() => {
    return {
      lumbermill: citizens.filter(c => c.districtRole === 'Lumbermill').length,
      quarry: citizens.filter(c => c.districtRole === 'Quarry').length,
      arcane: citizens.filter(c => c.districtRole === 'ArcaneWorkshop').length,
      farm: citizens.filter(c => c.districtRole === 'Farm').length,
      barracks: citizens.filter(c => c.districtRole === 'Barracks').length,
    };
  }, [citizens]);

  const handleAutoAssignDistricts = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const res = await autoAssignAllIdleCitizens(user.id);
      if (res.success) {
        if (typeof window !== 'undefined') {
          import('canvas-confetti').then(confetti => {
            confetti.default({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
          }).catch(() => {});
        }
        toast({
          title: "Districts mobilized! 🌲⛏️",
          description: `Auto-assigned ${res.assignedCount} idle citizen(s) to matching kingdom workshops and resource nodes!`,
        });
        await loadCitizens(user.id);
      }
    } catch (e) {
      logger.error("Failed to auto-assign districts", e);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPantryFood = useMemo(() => {
    return inventoryFood.reduce((acc, f) => acc + f.quantity, 0);
  }, [inventoryFood]);

  const feastGoldCost = useMemo(() => {
    let cost = 0;
    for (let i = 0; i < hungryCitizens.length; i++) {
      const batchTier = Math.floor(i / 8);
      cost += 200 + batchTier * 100;
    }
    return cost;
  }, [hungryCitizens.length]);

  const feastBatchesCount = useMemo(() => {
    return Math.max(1, Math.ceil(hungryCitizens.length / 8));
  }, [hungryCitizens.length]);

  const handleUnlockBanquetHall = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const res = await unlockBanquetHall(user.id);
      if (res.success) {
        if (typeof window !== 'undefined') {
          import('canvas-confetti').then(confetti => {
            confetti.default({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
          }).catch(() => {});
        }
        toast({
          title: "Grand banquet hall constructed! 🏰🍖",
          description: "Your kingdom now features the grand banquet hall! You can now hold royal feasts to feed all citizens in 1-tap.",
        });
      } else {
        toast({
          title: "Construction failed",
          description: res.error || "Could not construct grand banquet hall.",
          variant: "destructive"
        });
      }
    } catch (e) {
      logger.error("Failed to construct banquet hall", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHoldRoyalFeast = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const res = await holdRoyalFeast(user.id);
      if (res.success) {
        if (typeof window !== 'undefined') {
          import('canvas-confetti').then(confetti => {
            confetti.default({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
          }).catch(() => {});
        }
        toast({
          title: "Royal feast held! 🍖👑",
          description: `Gathered ${res.count} citizens across ${feastBatchesCount} banquet course${feastBatchesCount > 1 ? 's' : ''} for ${res.goldSpent.toLocaleString()} gold! +5% bonus affection awarded to all guests.`,
        });
        await loadInventoryFood();
      } else {
        toast({
          title: "Feast could not be held",
          description: res.error || "Could not hold feast.",
          variant: "destructive"
        });
      }
    } catch (e) {
      logger.error("Failed to hold royal feast", e);
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateGroups = useMemo(() => {
    const map: Record<string, Citizen[]> = {};
    citizens.forEach(c => {
      const key = c.filename?.toLowerCase() || c.name?.toLowerCase() || c.id;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return Object.entries(map).filter(([_, group]) => group.length > 1);
  }, [citizens]);

  const duplicateCount = useMemo(() => {
    return duplicateGroups.reduce((sum, [_, group]) => sum + group.length, 0);
  }, [duplicateGroups]);

  const handleMergeDuplicates = async () => {
    if (!user?.id || duplicateGroups.length === 0) return;
    try {
      setIsLoading(true);
      const result = await mergeDuplicateCitizens(user.id);
      if (result.success && result.count > 0) {
        if (typeof window !== 'undefined') {
          import('canvas-confetti').then(confetti => {
            confetti.default({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          }).catch(() => {});
        }
        toast({
          title: "Citizens merged!",
          description: `Combined ${result.count} duplicate citizens into upgraded singles! Levels added up successfully.`,
        });
        await loadCitizens(user.id);
      }
    } catch (e) {
      logger.error("Failed to merge duplicate citizens", e);
      toast({
        title: "Merge failed",
        description: "Could not combine duplicate citizens.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadInventoryFood = useCallback(async () => {
    if (!user?.id) return;
    try {
      const inv = await getInventory(user.id);
      
      // Also merge local kingdom-tile-items (e.g. freshly caught fish from kingdom tiles)
      const allItems: any[] = [...(Array.isArray(inv) ? inv : [])];
      if (typeof window !== 'undefined') {
        try {
          const localTileItems = JSON.parse(localStorage.getItem('kingdom-tile-items') || '[]');
          if (Array.isArray(localTileItems)) {
            localTileItems.forEach((lt: any) => {
              if (lt && lt.id && !allItems.some(i => i.id === lt.id)) {
                allItems.push(lt);
              }
            });
          }
        } catch {}
      }

      // Group & stack by canonical food name & emoji
      const foodMap = new Map<string, { id: string; name: string; quantity: number; emoji: string }>();

      allItems
        .filter(item => isFoodItem(item) && (item.quantity || 0) > 0)
        .forEach(item => {
          const { name, emoji } = formatFoodDisplayName(item.id, item.name, item.emoji);
          const stackKey = name.toLowerCase().trim();
          const qty = typeof item.quantity === 'number' ? item.quantity : 1;

          if (foodMap.has(stackKey)) {
            const existing = foodMap.get(stackKey)!;
            existing.quantity += qty;
          } else {
            foodMap.set(stackKey, {
              id: item.id,
              name,
              quantity: qty,
              emoji
            });
          }
        });

      const tileInv = await loadTileInventory(user.id);
      if (tileInv && typeof tileInv === 'object') {
        Object.entries(tileInv).forEach(([rawKey, value]) => {
          const key = rawKey === 'water' ? 'material-water' : rawKey;
          const qty = typeof value === 'number' ? value : (value?.quantity ?? 0);
          if (isFoodItem({ id: key, name: typeof value === 'object' ? value?.name : undefined }) && qty > 0) {
            const rawName = typeof value === 'object' && value?.name ? value.name : key;
            const rawEmoji = typeof value === 'object' && value?.emoji ? value.emoji : undefined;
            const { name, emoji } = formatFoodDisplayName(key, rawName, rawEmoji);
            const stackKey = name.toLowerCase().trim();

            if (foodMap.has(stackKey)) {
              const existing = foodMap.get(stackKey)!;
              existing.quantity += qty;
            } else {
              foodMap.set(stackKey, {
                id: key,
                name,
                quantity: qty,
                emoji
              });
            }
          }
        });
      }

      setInventoryFood(Array.from(foodMap.values()));
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
    window.addEventListener('tile-inventory-update', loadInventoryFood);
    return () => {
      window.removeEventListener('character-inventory-update', loadInventoryFood);
      window.removeEventListener('tile-inventory-update', loadInventoryFood);
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
        
        await fetchWithAuth('/api/character-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stats_data: newStats })
        });
        
        await fetchWithAuth('/api/achievements/unlock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ achievementId: requirement.evolvesTo })
        });
        
        toast({ title: "Evolution complete! ✨", description: `${citizen.name} has evolved into a new form!` });
        
        await loadCitizens(user.id);
    } catch (e) {
        logger.error("Failed to evolve", e);
        toast({ title: "Evolution failed", description: "Something went wrong.", variant: "destructive" });
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

  const filteredCitizens = citizens
    .filter(c => {
      if (citizenFilter === "active" && !c.active) return false;
      if (citizenFilter === "inactive" && c.active) return false;
      if (citizenFilter === "favorites" && !c.favorite) return false;
      if (speciesFilter !== "all" && c.type !== speciesFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return c.name.toLowerCase().includes(query) || (c.type || '').toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      // Sort/group by creature name species first so identical creatures (e.g. Minotaurs) are grouped together
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      return (b.level || 1) - (a.level || 1);
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

        {/* Grand Banquet Hall Widget */}
        {!hasBanquetHall ? (
          <Card className="bg-gradient-to-r from-amber-950/30 via-zinc-950 to-zinc-900 border border-amber-500/30 p-5 rounded-2xl mb-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-2xl shadow-inner">
                  🏰
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-serif font-bold text-amber-300">Grand banquet hall</h3>
                    <Badge className="bg-amber-900/60 border-amber-500/40 text-amber-200 text-[10px] uppercase font-mono tracking-wider">
                      Kingdom tile
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                    Construct the royal banquet hall to feed all your hungry citizens in 1-tap! Caters large communal feasts with multi-course scaling and awards a <span className="text-amber-300 font-semibold">+5% bonus affection</span> surge to all dining guests.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                <Button
                  onClick={handleUnlockBanquetHall}
                  disabled={isLoading}
                  className="btn-rpg-emerald text-xs px-5 py-2.5 font-serif font-bold shadow-lg flex items-center gap-2 w-full sm:w-auto"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  Construct hall (35,000 gold)
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-gradient-to-r from-amber-950/20 via-zinc-950 to-zinc-900 border border-amber-500/40 p-5 rounded-2xl mb-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-2xl shadow-inner">
                  🍖
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-serif font-bold text-amber-300">Grand banquet hall</h3>
                    <Badge className="bg-emerald-950/80 border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
                      ✨ Active
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
                    {hungryCitizens.length === 0 ? (
                      <span className="text-emerald-400">All citizens are currently well-fed and thriving! The banquet tables are polished and ready for the next feast.</span>
                    ) : (
                      <span>
                        <strong className="text-amber-300">{hungryCitizens.length}</strong> hungry citizen{hungryCitizens.length > 1 ? 's' : ''} awaiting banquet catering across <strong className="text-amber-300">{feastBatchesCount}</strong> course{feastBatchesCount > 1 ? 's' : ''} of 8. Feasting awards <span className="text-amber-300 font-semibold">+5% bonus affection</span>!
                      </span>
                    )}
                  </p>
                  {hungryCitizens.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-400">
                      <span className="bg-zinc-900/90 border border-amber-900/40 px-2.5 py-0.5 rounded-full text-amber-300 font-mono">
                        💰 {feastGoldCost.toLocaleString()} gold ({hungryCitizens.length <= 8 ? '200g / citizen' : `scaled per 8 citizens`})
                      </span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full font-mono border",
                        totalPantryFood >= hungryCitizens.length 
                          ? "bg-zinc-900/90 border-emerald-900/40 text-emerald-300"
                          : "bg-red-950/60 border-red-800/60 text-red-300"
                      )}>
                        🍖 {hungryCitizens.length} food portions ({totalPantryFood} available in pantry)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                <Button
                  onClick={handleHoldRoyalFeast}
                  disabled={isLoading || hungryCitizens.length === 0 || totalPantryFood < hungryCitizens.length}
                  className={cn(
                    "text-xs px-5 py-2.5 font-serif font-bold shadow-lg flex items-center gap-2 w-full sm:w-auto",
                    hungryCitizens.length > 0 && totalPantryFood >= hungryCitizens.length
                      ? "btn-rpg-emerald"
                      : "bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed"
                  )}
                >
                  <Utensils className="w-4 h-4 text-amber-300" />
                  {hungryCitizens.length === 0 
                    ? "All citizens fed ✨" 
                    : totalPantryFood < hungryCitizens.length 
                      ? "Need more food in pantry" 
                      : `Hold royal feast (${hungryCitizens.length})`}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Kingdom District Labor & Resource Yields Command Card */}
        <Card className="bg-gradient-to-r from-emerald-950/20 via-zinc-950 to-zinc-900 border border-emerald-500/30 p-5 rounded-2xl mb-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-bold text-emerald-300">Kingdom district labor</h3>
                <Badge className="bg-emerald-950 border-emerald-500/40 text-emerald-300 text-[10px] font-mono">
                  🌲 Passive yields
                </Badge>
              </div>
              <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
                Assign citizens to kingdom district roles to generate passive building resources. Well-fed citizens continuously harvest logs, stone blocks, essence crystals, and food!
              </p>

              {/* District Workers Breakdown */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="bg-zinc-900/90 border border-emerald-800/40 px-2.5 py-1 rounded-lg text-emerald-300 font-mono flex items-center gap-1.5">
                  🌲 Lumbermill: <strong>{districtCounts.lumbermill}</strong> (+{districtCounts.lumbermill} logs/hr)
                </span>
                <span className="bg-zinc-900/90 border border-amber-800/40 px-2.5 py-1 rounded-lg text-amber-300 font-mono flex items-center gap-1.5">
                  ⛏️ Quarry: <strong>{districtCounts.quarry}</strong> (+{districtCounts.quarry} stone/hr)
                </span>
                <span className="bg-zinc-900/90 border border-cyan-800/40 px-2.5 py-1 rounded-lg text-cyan-300 font-mono flex items-center gap-1.5">
                  🔮 Arcane: <strong>{districtCounts.arcane}</strong> (+{districtCounts.arcane} crystal/hr)
                </span>
                <span className="bg-zinc-900/90 border border-teal-800/40 px-2.5 py-1 rounded-lg text-teal-300 font-mono flex items-center gap-1.5">
                  🌾 Farm: <strong>{districtCounts.farm}</strong> (+{districtCounts.farm} food/hr)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Button
                onClick={handleAutoAssignDistricts}
                disabled={isLoading || idleCitizens.length === 0}
                className={cn(
                  "text-xs px-5 py-2.5 font-serif font-bold shadow-lg flex items-center gap-2 w-full sm:w-auto",
                  idleCitizens.length > 0
                    ? "btn-rpg-emerald"
                    : "bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-default"
                )}
              >
                <Sparkles className="w-4 h-4 text-emerald-300" />
                {idleCitizens.length === 0 ? "All citizens assigned ✨" : `Auto-assign (${idleCitizens.length} idle)`}
              </Button>
            </div>
          </div>
        </Card>

        {/* Filter Controls Bar: Status Buttons + Creature Species Dropdown + Search */}
        <div className="bg-zinc-950 p-4 rounded-2xl border border-amber-900/30 mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Status Filter Buttons */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {(["all", "active", "inactive", "favorites"] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={citizenFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCitizenFilter(filter)}
                  className={`capitalize font-serif border border-amber-900/30 text-xs px-3 py-1.5 ${
                    citizenFilter === filter 
                      ? "bg-amber-600 hover:bg-amber-700 text-black font-bold" 
                      : "bg-zinc-900 text-zinc-300 hover:bg-zinc-850 hover:text-white"
                  }`}
                >
                  {filter === "favorites" ? "⭐ Favorites" : filter}
                </Button>
              ))}

              {/* Merge all button for duplicate citizens */}
              {duplicateGroups.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleMergeDuplicates}
                  disabled={isLoading}
                  className="btn-rpg-emerald text-xs px-3.5 py-1.5 shadow-lg flex items-center gap-1.5 shrink-0 font-serif font-bold"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                  Merge all ({duplicateCount} duplicates)
                </Button>
              )}
            </div>

            {/* Species Type Dropdown Filter */}
            <div className="w-full sm:w-[220px]">
              <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                <SelectTrigger className="w-full bg-zinc-900 border-amber-900/40 text-amber-200 text-xs font-bold h-9">
                  <SelectValue placeholder="All Creature Types" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-amber-900/40 text-amber-100">
                  <SelectItem value="all">🐾 All Creature Types</SelectItem>
                  <SelectItem value="fire">🔥 Fire Species</SelectItem>
                  <SelectItem value="water">💧 Water Species</SelectItem>
                  <SelectItem value="earth">🪨 Earth Species</SelectItem>
                  <SelectItem value="nature">🍃 Nature Species</SelectItem>
                  <SelectItem value="ice">❄️ Ice Species</SelectItem>
                  <SelectItem value="monster">😈 Monster Beasts</SelectItem>
                  <SelectItem value="special">🌟 Special Mythics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search by Name */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search creature by name (e.g. Minotaur, Dragon)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-200 text-xs h-9 focus:border-amber-500/40"
            />
          </div>
        </div>

        {filteredCitizens.length === 0 ? (
          <Card className="bg-zinc-950 border border-amber-900/30 p-12 text-center">
            <p className="text-zinc-500 font-serif">No citizens found matching this filter.</p>
          </Card>
        ) : (
          <>
            {/* Mobile Touch Carousel */}
            <div className="md:hidden space-y-3">
              <div className="flex items-center justify-between px-1 text-xs text-amber-400 font-bold">
                <span>🐾 {filteredCitizens.length} {citizenFilter === 'all' ? 'Kingdom Citizens' : citizenFilter}</span>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Swipe 👉</span>
              </div>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-none scroll-smooth -mx-3 px-3">
                {filteredCitizens.map((citizen) => {
                  const isHungry = isCitizenHungry(citizen);
                  const isReadyToHarvest = isHarvestReady(citizen);
                  const imageSrc = getCitizenImageSrc(citizen);
                  const fedRemaining = getFedTimeRemaining(citizen);
                  const harvestRemaining = getHarvestTimeRemaining(citizen);
                  
                  // Format [Green] Minotaur or Green Minotaur -> Green minotaur
                  const rawName = citizen.name || 'Creature';
                  const cleanedName = rawName.replace(/^\[([a-zA-Z]+)\]\s*/, '$1 ');
                  const formattedName = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1).toLowerCase();
                  
                  let habitatColorClass = "border-zinc-800 bg-zinc-900";
                  
                  switch (citizen.type) {
                    case 'fire': habitatColorClass = "border-red-900/40 bg-red-950/20"; break;
                    case 'water': habitatColorClass = "border-blue-900/40 bg-blue-950/20"; break;
                    case 'earth': habitatColorClass = "border-amber-900/40 bg-amber-950/20"; break;
                    case 'nature': habitatColorClass = "border-emerald-900/40 bg-emerald-950/20"; break;
                    case 'ice': habitatColorClass = "border-cyan-900/40 bg-cyan-950/20"; break;
                    case 'monster':
                    case 'special': habitatColorClass = "border-purple-900/40 bg-purple-950/20"; break;
                  }

                  return (
                    <div key={citizen.id} className="w-[85vw] max-w-[320px] shrink-0 snap-center">
                      <Card className={`relative overflow-hidden flex flex-col border transition-all duration-300 rounded-2xl h-full ${habitatColorClass} ${
                        citizen.favorite ? 'ring-1 ring-amber-500/30 shadow-md' : ''
                      }`}>
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            onClick={() => toggleFavorite(user!.id, citizen.id)}
                            className="p-1.5 rounded-full bg-zinc-950/80 border border-zinc-800 text-amber-500"
                          >
                            <Star className={`w-4 h-4 ${citizen.favorite ? 'fill-amber-500' : 'text-zinc-400'}`} />
                          </button>
                        </div>

                        <CardHeader className="pb-2 pt-4">
                          <CardTitle className="font-serif text-base text-white truncate pr-6">{citizen.name}</CardTitle>
                          {citizen.loreTitle && (
                            <span className="text-[10px] text-amber-300 font-serif italic block -mt-0.5 mb-1">
                              {citizen.loreTitle}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <Badge variant="outline" className="bg-amber-950/60 border-amber-500/40 text-amber-400 text-[10px] font-bold">
                              Lvl {citizen.level || 1}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {citizen.type}
                            </Badge>
                            {(() => {
                              const key = citizen.filename?.toLowerCase() || citizen.name?.toLowerCase() || citizen.id;
                              const group = duplicateGroups.find(([k]) => k === key);
                              if (group && group[1].length > 1) {
                                return (
                                  <Badge className="bg-purple-900/80 border-purple-500/40 text-purple-200 text-[9px] font-mono shrink-0">
                                    ✨ {group[1].length} copies
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </CardHeader>

                        <CardContent className="flex-grow flex flex-col justify-between items-center py-3 space-y-3">
                          <div className="relative w-28 h-28 flex items-center justify-center bg-zinc-950/80 rounded-xl border border-zinc-800/40 p-2 overflow-hidden w-full">
                            <Image
                              src={imageSrc}
                              alt={citizen.name}
                              fill
                              className="object-contain animate-float"
                              sizes="120px"
                              unoptimized
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (citizen.id && !target.src.endsWith(`${citizen.id}.webp`)) {
                                  target.src = `/images/creatures/${citizen.id}.webp`;
                                }
                              }}
                            />
                          </div>

                          <div className="w-full space-y-1.5 text-xs">
                            <div className="flex justify-between items-center bg-zinc-950/80 p-2 rounded-lg border border-zinc-800/40">
                              <span className="text-zinc-400">Class:</span>
                              <Badge variant="outline" className="border-amber-500/40 text-amber-300 bg-amber-950/40 font-mono text-[10px] px-1.5 py-0">
                                {citizen.specialization || 'Tank'}
                              </Badge>
                            </div>

                            <div className="flex justify-between items-center bg-zinc-950/80 p-2 rounded-lg border border-zinc-800/40">
                              <span className="text-zinc-400">District Labor:</span>
                              <Select
                                value={citizen.districtRole || 'none'}
                                onValueChange={(val) => assignDistrictRole(user!.id, citizen.id, val === 'none' ? null : val as any)}
                              >
                                <SelectTrigger className="w-[130px] h-7 text-[11px] bg-zinc-900 border-zinc-700 text-amber-200">
                                  <SelectValue placeholder="Assign Role" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-amber-900/50 text-amber-100">
                                  <SelectItem value="none">💤 Idle / None</SelectItem>
                                  <SelectItem value="Lumbermill">🌲 Lumbermill</SelectItem>
                                  <SelectItem value="Quarry">⛏️ Quarry</SelectItem>
                                  <SelectItem value="ArcaneWorkshop">🔮 Arcane</SelectItem>
                                  <SelectItem value="Farm">🌾 Farm</SelectItem>
                                  <SelectItem value="Barracks">⚔️ Barracks</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-[10px] text-zinc-400 italic px-2 py-1 bg-zinc-950/60 rounded border border-zinc-900/60">
                              💬 {getCitizenDistrictGreeting(citizen)}
                            </p>

                            <div className="flex justify-between items-center bg-zinc-950/80 p-2 rounded-lg border border-zinc-800/40">
                              <span className="text-zinc-400">Map Status:</span>
                              <Badge variant={citizen.active ? "default" : "secondary"} className={citizen.active ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'}>
                                {citizen.active ? "Wandering" : "Tab Only"}
                              </Badge>
                            </div>

                            <div className="flex justify-between items-center bg-zinc-950/80 p-2 rounded-lg border border-zinc-800/40">
                              <span className="text-zinc-400">Fed Duration:</span>
                              {isHungry ? (
                                <span className="text-red-400 font-bold">Hungry 🥩</span>
                              ) : (
                                <span className="text-emerald-400 font-bold">Fed ({fedRemaining})</span>
                              )}
                            </div>

                            <div className="flex justify-between items-center bg-zinc-950/80 p-2 rounded-lg border border-zinc-800/40">
                              <span className="text-zinc-400">Daily Taxes:</span>
                              {isHungry ? (
                                <span className="text-zinc-500">Requires Feed</span>
                              ) : isReadyToHarvest ? (
                                <span className="text-emerald-400 font-bold animate-pulse">Collect taxes ✨</span>
                              ) : (
                                <span className="text-zinc-500 font-mono">{harvestRemaining}</span>
                              )}
                            </div>

                            {/* Subtle Mini Paperdoll Loadout Tray */}
                            <button
                              type="button"
                              onClick={() => setEquipmentModalCitizen(citizen)}
                              className="w-full flex items-center justify-between bg-zinc-950/70 hover:bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800/30 hover:border-amber-500/40 transition-colors group text-left cursor-pointer"
                            >
                              <span className="text-[10px] text-zinc-500 group-hover:text-amber-300 font-mono flex items-center gap-1">
                                Loadout: <span className="text-[9px] text-zinc-600 group-hover:text-amber-400">Manage ⚔️</span>
                              </span>
                              <div className="flex items-center gap-1">
                                {getCitizenMiniGear(citizen).map((gear, gIdx) => (
                                  <div
                                    key={gIdx}
                                    title={gear.name}
                                    className={cn(
                                      "relative w-4 h-4 rounded border bg-zinc-900 overflow-hidden flex items-center justify-center transition-transform hover:scale-110",
                                      gear.border
                                    )}
                                  >
                                    <Image
                                      src={gear.img}
                                      alt={gear.name}
                                      fill
                                      className="object-cover p-0.5"
                                      unoptimized
                                    />
                                  </div>
                                ))}
                              </div>
                            </button>
                          </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-2 pt-2 pb-4 px-4">
                          <Button
                            size="sm"
                            className={activePartnerId === citizen.id ? 'w-full btn-rpg-sapphire text-xs font-serif font-bold' : 'w-full border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:text-white text-xs font-serif'}
                            onClick={() => setActivePartnerId(activePartnerId === citizen.id ? undefined : citizen.id)}
                          >
                            <Heart className={`w-3.5 h-3.5 mr-1.5 ${activePartnerId === citizen.id ? 'fill-blue-200' : ''}`} />
                            {activePartnerId === citizen.id ? "Active companion" : "Set as companion"}
                          </Button>

                          <Button
                            size="sm"
                            className={citizen.active ? 'w-full border-zinc-700 bg-zinc-950 text-zinc-300 hover:text-white text-xs font-serif' : 'w-full btn-rpg-emerald text-xs font-serif font-bold'}
                            onClick={() => handleToggleActive(citizen)}
                          >
                            {citizen.active ? "Set to tab only" : "Let wander map"}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full font-semibold text-xs border-amber-800/50 bg-amber-950/20 text-amber-300 hover:bg-amber-900/40 hover:text-amber-100"
                            onClick={() => setSpecializeCitizenTarget(citizen)}
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1.5 shrink-0 text-amber-400" />
                            {citizen.specialization ? `Class: ${citizen.specialization}` : 'Specialize class'}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full font-semibold text-xs border-amber-500/40 bg-amber-950/20 text-amber-200 hover:bg-amber-900/40 hover:text-white"
                            onClick={() => setEquipmentModalCitizen(citizen)}
                          >
                            <SwordIcon className="w-3.5 h-3.5 mr-1.5 shrink-0 text-amber-400" />
                            Equip gear
                          </Button>

                          {isHungry && (
                            <div className="w-full mt-1">
                              {inventoryFood.length === 0 ? (
                                <Button disabled size="sm" className="w-full bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs">
                                  <Utensils className="w-3.5 h-3.5 mr-1.5 shrink-0" />No food in inventory
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
                                              title: "Citizen fed! 🍖",
                                              description: `${citizen.name} is now fed with ${f.name.toLowerCase()} for ${getFoodActiveDays(f.id, f)} day(s) and will produce gold!`,
                                            });
                                            await loadInventoryFood();
                                          }
                                        }}
                                      >
                                        <span className="flex items-center gap-2 text-sm text-white min-w-0">
                                          <span className="text-base shrink-0">{f.emoji}</span>
                                          <span className="font-medium truncate">{f.name}</span>
                                          <span className="text-[10px] text-zinc-400 font-normal shrink-0">
                                            +{getFoodActiveDays(f.id, f)}d
                                          </span>
                                        </span>
                                        <span className="text-xs text-amber-400 font-semibold bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.5 rounded shrink-0">
                                          ×{f.quantity}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  className="w-full btn-rpg-emerald text-xs font-serif font-bold h-9 shadow-md"
                                  onClick={() => setFeedModalCitizenId(citizen.id)}
                                >
                                  <Utensils className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                                  Feed citizen
                                  <ChevronDown className="w-3.5 h-3.5 ml-auto shrink-0 opacity-70" />
                                </Button>
                              )}
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Multi-Column Grid */}
            <div className="hidden md:grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCitizens.map((citizen) => {
              const isHungry = isCitizenHungry(citizen);
              const isReadyToHarvest = isHarvestReady(citizen);
              const imageSrc = getCitizenImageSrc(citizen);
              const fedRemaining = getFedTimeRemaining(citizen);
              const harvestRemaining = getHarvestTimeRemaining(citizen);
              
              const rawName = citizen.name || 'Creature';
              const cleanedName = rawName.replace(/^\[([a-zA-Z]+)\]\s*/, '$1 ');
              const formattedName = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1).toLowerCase();
              
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
                    citizen.active ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-zinc-800'
                  } ${
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
                          <CardTitle className="font-serif text-base text-white line-clamp-1">{formattedName}</CardTitle>
                          <Badge variant="outline" className="bg-amber-950/60 border-amber-500/40 text-amber-400 text-[10px] font-bold px-1.5 py-0">
                            Lvl {citizen.level || 1}
                          </Badge>
                          {citizen.loreTitle && (
                            <span className="text-[10px] text-amber-300/90 font-serif italic block w-full">
                              {citizen.loreTitle}
                            </span>
                          )}
                          {(() => {
                            const key = citizen.filename?.toLowerCase() || citizen.name?.toLowerCase() || citizen.id;
                            const group = duplicateGroups.find(([k]) => k === key);
                            if (group && group[1].length > 1) {
                              return (
                                <Badge className="bg-purple-900/80 border-purple-500/40 text-purple-200 text-[9px] font-mono shrink-0 px-1.5 py-0">
                                  ✨ {group[1].length} copies
                                </Badge>
                              );
                            }
                            return null;
                          })()}
                          {activePartnerId === citizen.id && (
                            (() => {
                              const isEvolved = (citizen.level || 1) >= 50 || playerLevel >= 50;
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
                                <Badge className={isEvolved ? "bg-amber-950/80 border-amber-500/40 text-amber-300 text-[9px] font-bold py-0 shadow-sm" : "bg-zinc-900 border-zinc-700 text-zinc-400 text-[9px] font-medium py-0"}>
                                  {elementIcon} {isEvolved ? "Evolved Form (+20% Yield) ✨" : "Evolves at Lvl 50"}
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
                            if (citizen.id && !target.src.endsWith(`${citizen.id}.webp`)) {
                              target.src = `/images/creatures/${citizen.id}.webp`;
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="w-full space-y-2 mt-auto text-xs">
                      <div className="flex justify-between items-center bg-zinc-950 p-2 rounded border border-zinc-800/20">
                        <span className="text-zinc-400">Class:</span>
                        <Badge variant="outline" className="border-amber-500/40 text-amber-300 bg-amber-950/40 font-mono text-[10px] px-2 py-0.5">
                          {citizen.specialization || 'Tank'}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center bg-zinc-950 p-2 rounded border border-zinc-800/20">
                        <span className="text-zinc-400">District Labor:</span>
                        <Select
                          value={citizen.districtRole || 'none'}
                          onValueChange={(val) => assignDistrictRole(user!.id, citizen.id, val === 'none' ? null : val as any)}
                        >
                          <SelectTrigger className="w-[125px] h-6 text-[10px] bg-zinc-900 border-zinc-700 text-amber-200 py-0">
                            <SelectValue placeholder="Assign Role" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-950 border-amber-900/50 text-amber-100">
                            <SelectItem value="none">💤 Idle / None</SelectItem>
                            <SelectItem value="Lumbermill">🌲 Lumbermill</SelectItem>
                            <SelectItem value="Quarry">⛏️ Quarry</SelectItem>
                            <SelectItem value="ArcaneWorkshop">🔮 Arcane</SelectItem>
                            <SelectItem value="Farm">🌾 Farm</SelectItem>
                            <SelectItem value="Barracks">⚔️ Barracks</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

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
                        <span className="text-zinc-400 font-serif flex items-center gap-1">
                          Affection: <span className="text-[10px] text-pink-300 font-mono font-bold">({citizen.affection || 0}% • +{Math.floor((citizen.affection || 0) / 10)}% Yield)</span>
                        </span>
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
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
                            Collect taxes ✨
                          </span>
                        ) : (
                          <span className="text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-600" /> {harvestRemaining}
                          </span>
                        )}
                      </div>

                      {/* Subtle Mini Paperdoll Loadout Tray */}
                      <button
                        type="button"
                        onClick={() => setEquipmentModalCitizen(citizen)}
                        className="w-full flex items-center justify-between bg-zinc-950/70 hover:bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800/30 hover:border-amber-500/40 transition-colors group text-left cursor-pointer"
                      >
                        <span className="text-[10px] text-zinc-500 group-hover:text-amber-300 font-mono flex items-center gap-1">
                          Loadout: <span className="text-[9px] text-zinc-600 group-hover:text-amber-400">Manage ⚔️</span>
                        </span>
                        <div className="flex items-center gap-1">
                          {getCitizenMiniGear(citizen).map((gear, gIdx) => (
                            <div
                              key={gIdx}
                              title={gear.name}
                              className={cn(
                                "relative w-4 h-4 rounded border bg-zinc-900 overflow-hidden flex items-center justify-center transition-transform hover:scale-110",
                                gear.border
                              )}
                            >
                              <Image
                                src={gear.img}
                                alt={gear.name}
                                fill
                                className="object-cover p-0.5"
                                unoptimized
                              />
                            </div>
                          ))}
                        </div>
                      </button>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-2 pt-2 pb-4 px-4">
                    <Button
                      size="sm"
                      className={`w-full text-xs font-serif font-bold ${
                        activePartnerId === citizen.id
                          ? 'btn-rpg-sapphire shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                          : 'border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:text-white'
                      }`}
                      onClick={() => setActivePartnerId(activePartnerId === citizen.id ? undefined : citizen.id)}
                    >
                      <Heart className={`w-3.5 h-3.5 mr-1.5 shrink-0 ${activePartnerId === citizen.id ? 'fill-blue-200' : ''}`} />
                      {activePartnerId === citizen.id ? "Active companion" : "Set as companion"}
                    </Button>

                    <Button
                      size="sm"
                      className={`w-full text-xs font-serif font-bold ${
                        citizen.active
                          ? 'border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-red-950/40 hover:border-red-800/60 hover:text-red-300'
                          : 'btn-rpg-emerald'
                      }`}
                      onClick={() => handleToggleActive(citizen)}
                    >
                      {citizen.active ? (
                        <><X className="w-3.5 h-3.5 mr-1.5 shrink-0" />Set to tab only</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5 mr-1.5 shrink-0" />Let wander map</>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full font-semibold text-xs border-amber-800/50 bg-amber-950/20 text-amber-300 hover:bg-amber-900/40 hover:text-amber-100"
                      onClick={() => setSpecializeCitizenTarget(citizen)}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 shrink-0 text-amber-400" />
                      {citizen.specialization ? `Class: ${citizen.specialization}` : 'Specialize class'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full font-semibold text-xs border-amber-500/40 bg-amber-950/20 text-amber-200 hover:bg-amber-900/40 hover:text-white"
                      onClick={() => setEquipmentModalCitizen(citizen)}
                    >
                      <SwordIcon className="w-3.5 h-3.5 mr-1.5 shrink-0 text-amber-400" />
                      Equip gear
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
                                        title: "Citizen fed! 🍖",
                                        description: `${citizen.name} is now fed with ${f.name.toLowerCase()} for ${getFoodActiveDays(f.id, f)} day(s) and will produce gold!`,
                                      });
                                      await loadInventoryFood();
                                    }
                                  }}
                                >
                                  <span className="flex items-center gap-2 text-sm text-white min-w-0">
                                    <span className="text-base shrink-0">{f.emoji}</span>
                                    <span className="font-medium truncate">{f.name}</span>
                                    <span className="text-[10px] text-zinc-400 font-normal shrink-0">
                                      +{getFoodActiveDays(f.id, f)}d
                                    </span>
                                  </span>
                                  <span className="text-xs text-amber-400 font-semibold bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.5 rounded shrink-0">
                                    ×{f.quantity}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full btn-rpg-emerald text-xs font-serif font-bold h-9 shadow-md"
                            onClick={() => setFeedModalCitizenId(citizen.id)}
                          >
                            <Utensils className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                            Feed citizen
                            <ChevronDown className="w-3.5 h-3.5 ml-auto shrink-0 opacity-70" />
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
          </>
        )}

        {specializeCitizenTarget && (
          <CitizenSpecializationModal
            isOpen={!!specializeCitizenTarget}
            onClose={() => setSpecializeCitizenTarget(null)}
            citizenName={specializeCitizenTarget.name}
            currentClass={specializeCitizenTarget.specialization as CitizenClass}
            onSpecialize={async (chosenClass) => {
              if (user?.id && specializeCitizenTarget) {
                await specializeCitizen(user.id, specializeCitizenTarget.id, chosenClass)
                toast({
                  title: "Citizen specialized!",
                  description: `${specializeCitizenTarget.name} is now trained as a ${chosenClass}.`,
                })
              }
            }}
          />
        )}

        {equipmentModalCitizen && (
          <CitizenEquipmentModal
            citizen={citizens.find(c => c.id === equipmentModalCitizen.id) || equipmentModalCitizen}
            open={!!equipmentModalCitizen}
            onClose={() => setEquipmentModalCitizen(null)}
            userId={user?.id}
          />
        )}
      </div>
    </div>
  )
}
