"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback, useMemo } from "react"
import { Sword, Sparkles, Star, Check, Shield, Award, Users, AlertTriangle, Search, Zap, Flame, Droplets, Mountain, Snowflake, Leaf } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"

import { useCitizensStore, Citizen } from '@/stores/citizensStore';
import { getInventory } from '@/lib/inventory-manager';
import { getCharacterStats } from "@/lib/character-stats-service";

export function BarracksTab() {
  const { user } = useUser();
  const loadCitizens = useCitizensStore(state => state.loadCitizens);
  const citizens = useCitizensStore(state => state.citizens);
  const combatSupporters = useCitizensStore(state => state.combatSupporters);
  const trainCitizen = useCitizensStore(state => state.trainCitizen);
  const toggleSupporter = useCitizensStore(state => state.toggleSupporter);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playerGold, setPlayerGold] = useState(0);
  const [inventoryFood, setInventoryFood] = useState<{ id: string; name: string; quantity: number; emoji: string }[]>([]);
  const [inventoryScrolls, setInventoryScrolls] = useState<{ id: string; name: string; quantity: number; emoji: string }[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const loadResources = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 1. Load Gold
      const stats = await getCharacterStats();
      setPlayerGold(stats.gold || 0);

      // 2. Load Inventory items
      const items = await getInventory(user.id);
      
      // Filter foods
      const foods = items.filter((i: any) => 
        i.type === 'food' || 
        i.type === 'consumable' || 
        i.id.startsWith('food-') ||
        i.id.startsWith('item-food-') ||
        i.id.startsWith('fish-')
      ).map((i: any) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        emoji: i.emoji || '🍎'
      }));
      setInventoryFood(foods);

      // Filter scrolls
      const scrolls = items.filter((i: any) => 
        i.type === 'scroll' || 
        i.id.startsWith('scroll-') ||
        i.id.includes('scroll')
      ).map((i: any) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        emoji: i.emoji || '📜'
      }));
      setInventoryScrolls(scrolls);
    } catch (err) {
      logger.error('[Barracks] Failed to load resources:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadCitizens(user.id);
      loadResources();
    }
  }, [user?.id, loadCitizens, loadResources]);

  // Set default selection when citizens load
  useEffect(() => {
    if (citizens.length > 0 && !selectedId) {
      setSelectedId(citizens[0]?.id || null);
    }
  }, [citizens, selectedId]);

  const selectedCitizen = useMemo(() => {
    return citizens.find(c => c.id === selectedId) || null;
  }, [citizens, selectedId]);

  // Filtered citizens list
  const filteredCitizens = useMemo(() => {
    return citizens.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'all' || 
                            (filterType === 'mythic' && c.isMythic) || 
                            (filterType === 'squad' && combatSupporters.includes(c.id)) ||
                            c.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [citizens, searchQuery, filterType, combatSupporters]);

  const getCitizenImageSrc = (c: Citizen) => {
    if (imgErrors[c.id]) {
      return '/images/placeholders/creature.webp';
    }
    if (c.isMythic || c.id?.startsWith('mythic-') || c.filename?.startsWith('Mythic')) {
      return `/images/Mythics/${c.filename}?v=2`;
    }
    return c.filename ? `/images/creatures/${c.filename}` : '/images/placeholders/creature.webp';
  };

  const handleImageError = (citizenId: string) => {
    setImgErrors(prev => ({ ...prev, [citizenId]: true }));
  };

  const getElementBadge = (type: string) => {
    switch (type) {
      case 'fire':
        return { icon: <Flame className="w-3 h-3 text-red-400" />, bg: "bg-red-950/40 text-red-300 border-red-500/30", label: "Fire" };
      case 'water':
        return { icon: <Droplets className="w-3 h-3 text-blue-400" />, bg: "bg-blue-950/40 text-blue-300 border-blue-500/30", label: "Water" };
      case 'earth':
        return { icon: <Mountain className="w-3 h-3 text-amber-500" />, bg: "bg-amber-950/40 text-amber-300 border-amber-500/30", label: "Earth" };
      case 'ice':
        return { icon: <Snowflake className="w-3 h-3 text-cyan-300" />, bg: "bg-cyan-950/40 text-cyan-200 border-cyan-500/30", label: "Ice" };
      case 'nature':
        return { icon: <Leaf className="w-3 h-3 text-emerald-400" />, bg: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30", label: "Nature" };
      default:
        return { icon: <Sparkles className="w-3 h-3 text-purple-400" />, bg: "bg-purple-950/40 text-purple-300 border-purple-500/30", label: "Special" };
    }
  };

  const playTrainingSound = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(800, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(180, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.25);
      gain2.gain.setValueAtTime(0.4, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  const getTrainingTier = (level: number) => {
    if (level >= 8) return { foodQty: 3, scrollQty: 3, tierLabel: 'Elite' };
    if (level >= 5) return { foodQty: 2, scrollQty: 2, tierLabel: 'Advanced' };
    return { foodQty: 1, scrollQty: 1, tierLabel: 'Basic' };
  };

  const handleTrain = async () => {
    if (!user?.id || !selectedCitizen || isTraining) return;

    const level = selectedCitizen.level || 1;
    if (level >= 10) {
      toast({
        title: "Max Level Reached 🏆",
        description: "This citizen has already achieved elite level 10!",
        variant: "destructive"
      });
      return;
    }

    const goldCost = 50 * level;
    if (playerGold < goldCost) {
      toast({
        title: "Insufficient Gold 🪙",
        description: `Training requires ${goldCost}g. You currently have ${playerGold}g.`,
        variant: "destructive"
      });
      return;
    }

    const tier = getTrainingTier(level);
    const totalFoodAvailable = inventoryFood.reduce((sum, f) => sum + f.quantity, 0);
    const totalScrollsAvailable = inventoryScrolls.reduce((sum, s) => sum + s.quantity, 0);

    if (totalFoodAvailable < tier.foodQty) {
      toast({
        title: "Missing Nourishment 🍎",
        description: `${tier.tierLabel} training requires ${tier.foodQty} food item${tier.foodQty > 1 ? 's' : ''}. You only have ${totalFoodAvailable}.`,
        variant: "destructive"
      });
      return;
    }
    if (totalScrollsAvailable < tier.scrollQty) {
      toast({
        title: "Missing Tactical Scrolls 📜",
        description: `${tier.tierLabel} training requires ${tier.scrollQty} scroll${tier.scrollQty > 1 ? 's' : ''}. You only have ${totalScrollsAvailable}.`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsTraining(true);
      playTrainingSound();

      // Visual shake on barracks panel
      const barracksContainer = document.querySelector('.barracks-card-container');
      if (barracksContainer) {
        barracksContainer.classList.add('animate-forge-shake');
        setTimeout(() => barracksContainer.classList.remove('animate-forge-shake'), 300);
      }

      const chosenFood = inventoryFood.find(f => f.quantity >= tier.foodQty) || inventoryFood[0];
      const chosenScroll = inventoryScrolls.find(s => s.quantity >= tier.scrollQty) || inventoryScrolls[0];
      if (!chosenFood || !chosenScroll) {
        toast({ title: "Insufficient materials", description: "Not enough food or scrolls for this training tier.", variant: "destructive" });
        setIsTraining(false);
        return;
      }

      const res = await trainCitizen(user.id, selectedCitizen.id, chosenFood.id, chosenScroll.id, tier.foodQty, tier.scrollQty);

      if (res.success) {
        if (res.leveledUp) {
          toast({
            title: "LEVEL UP! ⚔️🌟",
            description: `${selectedCitizen.name} has reached Level ${level + 1}! Their support skill and gathering output are now stronger.`,
          });
        } else {
          toast({
            title: "Training Complete 🏋️",
            description: `${selectedCitizen.name} gained +50 XP.`,
          });
        }
        await loadResources();
      } else {
        throw new Error(res.error || "Training failed");
      }
    } catch (err: any) {
      toast({
        title: "Training Failed",
        description: err.message || "An unexpected error occurred during training.",
        variant: "destructive"
      });
    } finally {
      setIsTraining(false);
    }
  };

  const getPassiveDescription = (citizen: Citizen, customLevel?: number) => {
    const lvl = customLevel !== undefined ? customLevel : (citizen.level || 1);
    switch (citizen.type) {
      case 'nature':
        return `Adds +${(lvl * 0.5).toFixed(1)}s to the battle sequence memory timer.`;
      case 'fire':
        return `Adds a +${lvl * 3}% bonus attack modifier in Monster Battles.`;
      case 'water':
        return `Adds a +${lvl * 3}% bonus defense modifier in Monster Battles.`;
      case 'earth':
        return `Increases victory XP payouts by +${lvl * 3}%.`;
      case 'ice':
        return `Increases victory Gold payouts by +${lvl * 3}%.`;
      default:
        return `Grants a +${lvl * 2}% chance to trigger Tactical Strike (auto-inputs next sequence key).`;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Barracks Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-800/30 bg-gradient-to-r from-amber-950/80 via-zinc-950 to-zinc-950 p-6 shadow-2xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-600/30 text-amber-300 border border-amber-500/40 font-extrabold text-[10px] uppercase tracking-wider">
                Kingdom Military Training Grounds
              </Badge>
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                🛡️ Round Table: {combatSupporters.length}/2 Knights Pledged
              </Badge>
            </div>
            <h2 className="font-cardo font-bold text-2xl md:text-3xl text-white flex items-center gap-2">
              Citizen Barracks <Zap className="w-6 h-6 text-amber-500 animate-pulse" />
            </h2>
            <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
              Train your unlocked citizens and mythic cards using scrolls and nourishment. Higher level citizens yield increased gold harvests, higher combat modifiers, and unlocked mastery perks.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/90 border border-amber-500/20 p-3 rounded-xl shrink-0">
            <div className="text-right">
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Available Treasury</p>
              <p className="text-base font-extrabold text-amber-400">🪙 {playerGold.toLocaleString()}g</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      
        {/* Left panel: Citizen Selection List */}
        <div className="lg:col-span-1 space-y-3 flex flex-col">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-cardo font-bold text-amber-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" /> Unlock Hall ({filteredCitizens.length})
            </h3>
          </div>

          {/* Search and Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search citizens & mythics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs bg-[#0b0d10] border-zinc-800 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-amber-500/50"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {['all', 'squad', 'mythic', 'fire', 'water', 'earth', 'ice', 'nature'].map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant="ghost"
                  onClick={() => setFilterType(f)}
                  className={cn(
                    "h-6 px-2 text-[10px] capitalize font-bold rounded-lg shrink-0",
                    filterType === f 
                      ? "bg-amber-600/30 text-amber-300 border border-amber-500/40" 
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  )}
                >
                  {f === 'squad' ? '🛡️ Round Table' : f === 'mythic' ? '✨ Mythics' : f}
                </Button>
              ))}
            </div>
          </div>

          {/* Citizens Scroll List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredCitizens.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                No citizens found matching filter.
              </div>
            ) : (
              filteredCitizens.map(c => {
                const isSlotted = combatSupporters.includes(c.id);
                const isSelected = selectedId === c.id;
                const elem = getElementBadge(c.type);
                const imgSrc = getCitizenImageSrc(c);

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden",
                      isSelected
                        ? "bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-950/20"
                        : "bg-[#0b0d10] border-white/5 hover:border-amber-500/30 hover:bg-zinc-900/60"
                    )}
                  >
                    {/* Active Round Table indicator stripe */}
                    {isSlotted && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                    )}

                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar box */}
                      <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-xl relative overflow-hidden flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                        <img
                          src={imgSrc}
                          alt={c.name}
                          onError={() => handleImageError(c.id)}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-white text-xs truncate max-w-[130px] group-hover:text-amber-300 transition-colors">
                            {c.name}
                          </h4>
                          {c.isMythic && (
                            <Badge className="bg-orange-600/20 text-orange-400 border border-orange-500/30 text-[8px] px-1 py-0 uppercase shrink-0">
                              Mythic
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] text-amber-400 font-extrabold uppercase">
                            Lv.{c.level || 1}
                          </span>
                          <span className={cn("text-[9px] px-1.5 py-0.2 rounded border font-semibold flex items-center gap-1", elem.bg)}>
                            {elem.icon} {elem.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {isSlotted ? (
                        <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 text-[8px] px-1.5 py-0.5 font-bold">
                          🛡️ Pledged
                        </Badge>
                      ) : c.active ? (
                        <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-[8px] px-1 py-0">
                          Active
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel: Barracks training center */}
        <div className="lg:col-span-2 space-y-4 flex flex-col barracks-card-container transition-all">
          <h3 className="text-base font-cardo font-bold text-amber-100 flex items-center gap-2 px-1">
            <Sword className="w-4 h-4 text-amber-500" /> Training Arena
          </h3>

          {selectedCitizen === null ? (
            <div className="min-h-[450px] flex flex-col items-center justify-center text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40 p-8">
              <Sword className="w-12 h-12 text-zinc-600 mb-3 animate-pulse" />
              <h4 className="font-cardo font-bold text-base text-amber-400 mb-1">Barracks Dormitory</h4>
              <p className="text-xs max-w-sm">Select one of your unlocked citizens from the Hall of Champions sidebar to begin training and view their knightly blessings!</p>
            </div>
          ) : (
            (() => {
              const c = selectedCitizen;
              const lvl = c.level || 1;
              const nextLvl = Math.min(10, lvl + 1);
              const goldCost = 50 * lvl;
              const currentXP = c.experience || 0;
              const targetXP = lvl * 100;
              const isSlotted = combatSupporters.includes(c.id);
              const isLocked = c.lockedReason === 'expedition';

              const tier = getTrainingTier(lvl);
              const hasGold = playerGold >= goldCost;
              const totalFood = inventoryFood.reduce((sum, f) => sum + f.quantity, 0);
              const totalScrolls = inventoryScrolls.reduce((sum, s) => sum + s.quantity, 0);
              const hasFood = totalFood >= tier.foodQty;
              const hasScrolls = totalScrolls >= tier.scrollQty;
              const canTrain = hasGold && hasFood && hasScrolls && lvl < 10 && !isLocked;
              const elem = getElementBadge(c.type);
              const imgSrc = getCitizenImageSrc(c);

              return (
                <Card className="bg-[#0b0d10] border border-amber-900/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between space-y-6">
                  
                  {/* Background flare */}
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

                  <div className="space-y-6 relative z-10">

                    {/* Character Showcase Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
                      <div className="flex items-center gap-4">
                        {/* Large Avatar frame */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-zinc-950 border-2 border-amber-500/30 rounded-2xl relative overflow-hidden flex items-center justify-center shrink-0 shadow-2xl p-2 bg-gradient-to-b from-zinc-900 to-zinc-950">
                          <img
                            src={imgSrc}
                            alt={c.name}
                            onError={() => handleImageError(c.id)}
                            className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-cardo font-bold text-white text-xl sm:text-2xl">{c.name}</h4>
                            {c.isMythic && (
                              <Badge className="bg-orange-600/20 text-orange-400 border border-orange-500/40 text-[9px] uppercase font-bold">
                                ✨ Mythic Card
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap pt-0.5">
                            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-extrabold text-[10px] uppercase">
                              Level {lvl} / 10
                            </Badge>
                            <span className={cn("text-[10px] px-2 py-0.5 rounded-md border font-bold flex items-center gap-1", elem.bg)}>
                              {elem.icon} {elem.label} Habitat
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20">
                              ❤️ Affection: {c.affection || 0}% (+{((c.affection || 0) * 0.5).toFixed(1)}% Gold Yield)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Supporter Slot Button */}
                      <div className="shrink-0 pt-2 sm:pt-0">
                        <Button
                          size="sm"
                          disabled={isLocked}
                          variant={isSlotted ? "destructive" : "secondary"}
                          onClick={() => toggleSupporter(user!.id, c.id)}
                          className={cn(
                            "h-9 text-xs font-bold transition-all px-4 shadow-md",
                            !isSlotted && !isLocked && "bg-emerald-600 hover:bg-emerald-500 text-white"
                          )}
                        >
                          {isLocked ? "Away 🚀" : isSlotted ? "❌ Dismiss from Round Table" : "⚔️ Pledge to Round Table"}
                        </Button>
                      </div>
                    </div>

                    {/* Level Progress bar */}
                    <div className="space-y-2 bg-zinc-950/60 p-4 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-zinc-400">Experience Points:</span>
                        <span className="text-amber-400 font-extrabold">{currentXP} / {targetXP} XP</span>
                      </div>
                      <Progress value={(currentXP / targetXP) * 100} className="h-2.5 bg-zinc-950 border border-white/10" indicatorClassName="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400" />
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-0.5">
                        <span>Training session: +50 XP</span>
                        {lvl < 10 && <span className="text-amber-400/80 font-semibold">Next level: Level {nextLvl}</span>}
                      </div>
                    </div>

                    {/* Combat support passive buff & Skill Scaling */}
                    <div className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-xl space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <Shield className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-amber-300 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                            <Award className="w-3.5 h-3.5 text-amber-500" /> Honorary Boon:
                          </h5>
                          <p className="text-xs text-white font-medium mt-0.5">{getPassiveDescription(c)}</p>
                        </div>
                      </div>

                      {lvl < 10 && (
                        <div className="border-t border-amber-500/10 pt-2.5 flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400 font-medium">Level {nextLvl} Upgrade Preview:</span>
                          <span className="text-emerald-400 font-bold">{getPassiveDescription(c, nextLvl)}</span>
                        </div>
                      )}
                    </div>

                    {/* Level Mastery Perks Roadmap */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-amber-500" /> Citizen Level Perks & Milestones:
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className={cn(
                          "p-2.5 rounded-xl border text-[11px] space-y-0.5",
                          lvl >= 5 ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-zinc-950/40 border-white/5 text-zinc-500"
                        )}>
                          <div className="font-bold flex items-center gap-1">
                            {lvl >= 5 ? <Check className="w-3 h-3 text-emerald-400" /> : <Star className="w-3 h-3 text-zinc-600" />}
                            Level 5 Perk
                          </div>
                          <p className="text-[10px] text-zinc-400">+15% Gold Gather Yield</p>
                        </div>

                        <div className={cn(
                          "p-2.5 rounded-xl border text-[11px] space-y-0.5",
                          lvl >= 8 ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-zinc-950/40 border-white/5 text-zinc-500"
                        )}>
                          <div className="font-bold flex items-center gap-1">
                            {lvl >= 8 ? <Check className="w-3 h-3 text-emerald-400" /> : <Star className="w-3 h-3 text-zinc-600" />}
                            Level 8 Perk
                          </div>
                          <p className="text-[10px] text-zinc-400">+25% Material Drop Chance</p>
                        </div>

                        <div className={cn(
                          "p-2.5 rounded-xl border text-[11px] space-y-0.5",
                          lvl >= 10 ? "bg-amber-950/30 border-amber-500/40 text-amber-300" : "bg-zinc-950/40 border-white/5 text-zinc-500"
                        )}>
                          <div className="font-bold flex items-center gap-1">
                            {lvl >= 10 ? <Check className="w-3 h-3 text-amber-400" /> : <Star className="w-3 h-3 text-zinc-600" />}
                            Level 10 Master
                          </div>
                          <p className="text-[10px] text-zinc-400">+50% Gold Yield & Title</p>
                        </div>
                      </div>
                    </div>

                    {/* Training Requirements */}
                    <div className="space-y-2 pt-1">
                      <h5 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-2">
                        Required Resources:
                        <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30 font-bold uppercase px-2 py-0">
                          {tier.tierLabel} Tier
                        </Badge>
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Gold cost */}
                        <div className={cn(
                          "p-3 rounded-xl border text-xs flex justify-between items-center",
                          hasGold ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-red-950/20 border-red-500/30 text-red-400"
                        )}>
                          <span className="font-semibold flex items-center gap-1">🪙 Gold</span>
                          <span className="font-bold">{goldCost}g</span>
                        </div>

                        {/* Food cost */}
                        <div className={cn(
                          "p-3 rounded-xl border text-xs flex justify-between items-center",
                          hasFood ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-red-950/20 border-red-500/30 text-red-400"
                        )}>
                          <span className="font-semibold truncate flex items-center gap-1">🍎 Nourishment</span>
                          <span className="font-bold">{Math.min(totalFood, tier.foodQty)}/{tier.foodQty}</span>
                        </div>

                        {/* Scroll cost */}
                        <div className={cn(
                          "p-3 rounded-xl border text-xs flex justify-between items-center",
                          hasScrolls ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-red-950/20 border-red-500/30 text-red-400"
                        )}>
                          <span className="font-semibold truncate flex items-center gap-1">📜 Tactical Scroll</span>
                          <span className="font-bold">{Math.min(totalScrolls, tier.scrollQty)}/{tier.scrollQty}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Training Actions */}
                  <div className="pt-4 border-t border-white/5 mt-4 relative z-10">
                    {isLocked ? (
                      <Button disabled className="w-full bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed text-xs font-bold py-5 rounded-xl uppercase tracking-wider">
                        Locked: Away on Airship Expedition 🚀
                      </Button>
                    ) : lvl >= 10 ? (
                      <Button disabled className="w-full bg-amber-950/20 border border-amber-500/30 text-amber-300 cursor-default text-xs font-bold py-5 rounded-xl uppercase tracking-wider">
                        🏆 Maximum Elite Level 10 Achieved!
                      </Button>
                    ) : (
                      <Button
                        disabled={!canTrain || isTraining}
                        onClick={handleTrain}
                        className={cn(
                          "w-full text-xs font-bold py-6 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl",
                          canTrain 
                            ? "bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-black font-extrabold hover:brightness-110 active:scale-[0.98] shadow-amber-500/10" 
                            : "bg-zinc-950 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                        )}
                      >
                        {isTraining ? (
                          <>⏳ Hammering Arena Forge...</>
                        ) : (
                          <>🏋️ Train Citizen (+50 XP)</>
                        )}
                      </Button>
                    )}

                    {isLocked && (
                      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 font-bold bg-zinc-950/60 p-2 rounded-lg border border-white/5">
                        🚀 Away on Voyage: This citizen is locked until they return from their Airship Journey.
                      </div>
                    )}
                    {!isLocked && isSlotted && (
                      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/20">
                        <Check className="w-3.5 h-3.5" /> Pledged Knight: This citizen is currently at your Round Table!
                      </div>
                    )}
                    {!isLocked && !isSlotted && combatSupporters.length >= 2 && (
                      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-amber-400 font-bold bg-amber-950/20 p-2 rounded-lg border border-amber-500/20">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Round Table Full (2/2): Pledging this knight will replace your oldest supporter.
                      </div>
                    )}
                  </div>

                </Card>
              );
            })()
          )}
        </div>

      </div>
    </div>
  );
}
