"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback } from "react"
import { Sword, Sparkles, Star, Check, Shield, Award, Users, AlertTriangle } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"

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
        i.id.startsWith('item-food-')
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
        i.id.startsWith('scroll-')
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

  const selectedCitizen = citizens.find(c => c.id === selectedId) || null;

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

  // Get tiered material requirements based on citizen level
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
        title: "Max Level Reached",
        description: "This citizen has already achieved elite level 10!",
        variant: "destructive"
      });
      return;
    }

    const goldCost = 50 * level;
    if (playerGold < goldCost) {
      toast({
        title: "Insufficient Gold",
        description: `Training requires ${goldCost}g. You only have ${playerGold}g.`,
        variant: "destructive"
      });
      return;
    }

    const tier = getTrainingTier(level);
    const totalFoodAvailable = inventoryFood.reduce((sum, f) => sum + f.quantity, 0);
    const totalScrollsAvailable = inventoryScrolls.reduce((sum, s) => sum + s.quantity, 0);

    if (totalFoodAvailable < tier.foodQty) {
      toast({
        title: "Missing Food",
        description: `${tier.tierLabel} training requires ${tier.foodQty} food item${tier.foodQty > 1 ? 's' : ''}. You only have ${totalFoodAvailable}.`,
        variant: "destructive"
      });
      return;
    }
    if (totalScrollsAvailable < tier.scrollQty) {
      toast({
        title: "Missing Scrolls",
        description: `${tier.tierLabel} training requires ${tier.scrollQty} scroll${tier.scrollQty > 1 ? 's' : ''}. You only have ${totalScrollsAvailable}.`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsTraining(true);
      playTrainingSound();

      // Trigger visual shake on barracks panel
      const barracksContainer = document.querySelector('.barracks-card-container');
      if (barracksContainer) {
        barracksContainer.classList.add('animate-forge-shake');
        setTimeout(() => barracksContainer.classList.remove('animate-forge-shake'), 300);
      }

      const chosenFood = inventoryFood.find(f => f.quantity >= tier.foodQty);
      const chosenScroll = inventoryScrolls.find(s => s.quantity >= tier.scrollQty);
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
            description: `${selectedCitizen.name} has reached Level ${level + 1}! Their support buffs are now stronger.`,
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

  const getPassiveDescription = (citizen: Citizen) => {
    const lvl = citizen.level || 1;
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
      
      {/* Barracks Header */}
      <div className="relative h-60 md:h-72 rounded-2xl overflow-hidden border border-amber-950/20 shadow-2xl flex items-end">
        <Image
          src="/images/barracks-hero.png"
          alt="Barracks"
          fill
          className="object-cover brightness-90 contrast-105 select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
        <div className="p-6 relative z-10 space-y-1">
          <Badge className="bg-amber-600 text-black font-extrabold text-[9px] uppercase tracking-wider mb-2">
            Kingdom Training Ground
          </Badge>
          <h2 className="font-cardo font-bold text-2xl text-white">Citizen Barracks</h2>
          <p className="text-xs text-zinc-300 max-w-xl">
            Train your citizens using scrolls and food to power up their levels, enhancing their combat support skills and attributes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      
      {/* Left panel: Citizen Selection List */}
      <div className="lg:col-span-1 space-y-4 flex flex-col h-full">
        <h3 className="text-lg font-cardo font-bold text-amber-100 flex items-center gap-2 px-1">
          <Users className="w-5 h-5 text-amber-500" /> Unlock Hall
        </h3>
        <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1 flex-1">
          {citizens.map(c => {
            const isSlotted = combatSupporters.includes(c.id);
            const isSelected = selectedId === c.id;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                  isSelected
                    ? "bg-amber-950/20 border-amber-500/50 shadow-inner shadow-amber-900/10"
                    : "bg-[#0f1115] border-white/5 hover:border-amber-900/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl relative overflow-hidden flex items-center justify-center shrink-0">
                    <Image
                      src={c.filename ? `/images/creatures/${c.filename}` : '/images/placeholders/creature.webp'}
                      alt={c.name}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-white text-xs truncate max-w-[110px]">{c.name}</h4>
                      {c.isMythic && (
                        <Badge className="bg-orange-600/20 text-orange-400 border border-orange-500/30 text-[8px] scale-90 px-1 py-0 uppercase shrink-0">
                          Mythic
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider font-bold">
                      Level {c.level || 1} • {c.type}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {isSlotted && (
                    <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-[8px] px-1 py-0">
                      🗡️ Squad
                    </Badge>
                  )}
                  {c.active && (
                    <Badge variant="outline" className="text-zinc-500 text-[8px] px-1 py-0">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel: Barracks training center */}
      <div className="lg:col-span-2 space-y-4 flex flex-col h-full barracks-card-container transition-all">
        <h3 className="text-lg font-cardo font-bold text-amber-100 flex items-center gap-2 px-1">
          <Sword className="w-5 h-5 text-amber-500" /> Training Arena
        </h3>
        {selectedCitizen === null ? (
          <div className="flex-1 min-h-[500px] flex flex-col items-center justify-center text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20">
            <Sword className="w-12 h-12 text-zinc-600 mb-3 animate-pulse" />
            <h4 className="font-cardo font-bold text-sm text-amber-500/70 mb-1">Barracks Dormitory</h4>
            <p className="text-xs max-w-xs px-6">Select one of your unlocked citizens from the sidebar to train them in the Barracks or assign them to support you in battles!</p>
          </div>
        ) : (
          (() => {
            const c = selectedCitizen;
            const lvl = c.level || 1;
            const nextLvl = lvl + 1;
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

            return (
              <Card className="bg-[#0f1115] border border-amber-950/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between flex-1 min-h-[500px]">
                
                {/* Background lighting flare */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

                <div className="space-y-6">
                  {/* Citizen Header Banner */}
                  <div className="flex items-start justify-between pb-4 border-b border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-900 border border-zinc-700/50 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0 relative">
                        <Image
                          src={c.filename ? `/images/creatures/${c.filename}` : '/images/placeholders/creature.webp'}
                          alt={c.name}
                          width={60}
                          height={60}
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-cardo font-bold text-white text-base leading-none">{c.name}</h4>
                          {c.isMythic && (
                            <Badge className="bg-orange-600/20 text-orange-400 border border-orange-500/30 text-[8px] uppercase">
                              Mythic Card
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1.5 font-bold flex items-center gap-1.5">
                          <span>Level {lvl}</span>
                          <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                          <span className="capitalize text-zinc-400">{c.type} Habitat</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={isLocked}
                        variant={isSlotted ? "destructive" : "secondary"}
                        onClick={() => toggleSupporter(user!.id, c.id)}
                        className={cn(
                          "h-8 text-xs font-bold transition-all px-3",
                          !isSlotted && !isLocked && "bg-emerald-600 hover:bg-emerald-700 text-white"
                        )}
                      >
                        {isLocked ? "Away 🚀" : isSlotted ? "Remove squad" : "⚔️ Slot Supporter"}
                      </Button>
                    </div>
                  </div>

                  {/* Level Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-400">Experience Points:</span>
                      <span className="text-amber-500">{currentXP} / {targetXP} XP</span>
                    </div>
                    <Progress value={(currentXP / targetXP) * 100} className="h-2 bg-zinc-950 border border-white/5" indicatorClassName="bg-gradient-to-r from-amber-600 to-amber-400" />
                    <p className="text-[10px] text-zinc-500">Each training session provides +50 XP and requires resources.</p>
                  </div>

                  {/* Combat support passive buff */}
                  <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-950/20 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500" /> Combat Support Skill:
                      </h5>
                      <p className="text-xs text-zinc-400 mt-1 font-medium">{getPassiveDescription(c)}</p>
                    </div>
                  </div>

                  {/* Training checklist */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-2">
                      Required Resources:
                      <Badge variant="outline" className="text-[8px] text-amber-500 border-amber-500/20 font-bold uppercase px-1.5 py-0">
                        {tier.tierLabel} Tier
                      </Badge>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Gold cost */}
                      <div className={cn(
                        "p-2.5 rounded-xl border text-xs flex justify-between items-center",
                        hasGold ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-400" : "bg-red-950/10 border-red-500/20 text-red-400"
                      )}>
                        <span className="font-semibold">🪙 Gold</span>
                        <span className="font-bold">{goldCost}g</span>
                      </div>

                      {/* Food cost */}
                      <div className={cn(
                        "p-2.5 rounded-xl border text-xs flex justify-between items-center",
                        hasFood ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-400" : "bg-red-950/10 border-red-500/20 text-red-400"
                      )}>
                        <span className="font-semibold truncate">🍎 Nourishment</span>
                        <span className="font-bold">{Math.min(totalFood, tier.foodQty)}/{tier.foodQty}</span>
                      </div>

                      {/* Scroll cost */}
                      <div className={cn(
                        "p-2.5 rounded-xl border text-xs flex justify-between items-center",
                        hasScrolls ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-400" : "bg-red-950/10 border-red-500/20 text-red-400"
                      )}>
                        <span className="font-semibold truncate">📜 Tactical Scroll</span>
                        <span className="font-bold">{Math.min(totalScrolls, tier.scrollQty)}/{tier.scrollQty}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Training Actions */}
                <div className="pt-4 border-t border-white/5 mt-4">
                  {isLocked ? (
                    <Button disabled className="w-full bg-zinc-950 border border-zinc-800 text-zinc-600 cursor-not-allowed text-xs font-bold py-5 rounded-xl uppercase tracking-wider">
                      Locked: Away on Expedition 🚀
                    </Button>
                  ) : lvl >= 10 ? (
                    <Button disabled className="w-full bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed text-xs font-bold py-5 rounded-xl uppercase tracking-wider">
                      Maximum Level (+10) reached
                    </Button>
                  ) : (
                    <Button
                      disabled={!canTrain || isTraining}
                      onClick={handleTrain}
                      className={cn(
                        "w-full text-xs font-bold py-5 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                        canTrain 
                          ? "bg-gradient-to-r from-amber-600 to-amber-500 text-black font-extrabold shadow-lg hover:brightness-110 active:scale-[0.98]" 
                          : "bg-zinc-950 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                      )}
                    >
                      {isTraining ? (
                        <>⏳ Hammering Training Arena...</>
                      ) : (
                        <>🏋️ Train Citizen (+50 XP)</>
                      )}
                    </Button>
                  )}
                  {isLocked && (
                    <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 font-bold bg-zinc-950/40 p-1.5 rounded-lg border border-white/5">
                      🚀 Away on Voyage: This citizen is locked until they return from their Airship Journey.
                    </div>
                  )}
                  {!isLocked && isSlotted && (
                    <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-emerald-500 font-bold bg-emerald-950/10 p-1.5 rounded-lg border border-emerald-500/10">
                      <Check className="w-3.5 h-3.5" /> Ready for Action: This citizen will support your next monster battle!
                    </div>
                  )}
                  {!isLocked && !isSlotted && combatSupporters.length >= 2 && (
                    <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-amber-500 font-bold bg-amber-950/10 p-1.5 rounded-lg border border-amber-500/10">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Slot squad is full. Slotting this card rotates out the oldest supporter.
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
