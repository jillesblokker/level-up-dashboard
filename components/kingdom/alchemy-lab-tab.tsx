"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback, useMemo } from "react"
import { FlaskConical, Sparkles, Check, Flame, Zap, Shield, HelpCircle, Activity, Hourglass, Coins, Users, Award, Heart } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { useCitizensStore } from '@/stores/citizensStore';

import { getInventory } from '@/lib/inventory-manager';
import { getUserPreference, setUserPreference } from "@/lib/user-preferences-manager";

interface GuardianDetails {
  id: string;
  name: string;
  emoji: string;
  description: string;
  focus: string;
  themeColor: string;
  glowColor: string;
  particleBg: string;
  enhancements: {
    key: 'forgeLuck' | 'blessingGreed' | 'blessingSwiftness' | 'doubleHarvest' | 'combatProtection';
    name: string;
    benefit: string;
    icon: any;
    potionId?: string;
    spellName?: 'swiftness' | 'greed';
  }[];
}

const GUARDIAN_DETAILS: GuardianDetails[] = [
  {
    id: 'ember-drake',
    name: 'Ember Drake',
    emoji: '🐉',
    description: 'A fierce baby dragon that feeds on the fire of your might and craft habits.',
    focus: 'Might & Craft',
    themeColor: 'from-orange-500/10 to-red-500/15 border-orange-500/20 text-orange-400',
    glowColor: 'shadow-[0_0_20px_rgba(249,115,22,0.35)] border-orange-500/40',
    particleBg: 'bg-orange-500',
    enhancements: [
      {
        key: 'forgeLuck',
        name: 'Forge Luck Elixir',
        benefit: '+10% Blacksmith tempering success rate',
        icon: Sparkles,
        potionId: 'potion-forge-luck'
      },
      {
        key: 'blessingGreed',
        name: 'Blessing of Greed',
        benefit: '+100% Gold rewards from all habits and challenges',
        icon: Coins,
        spellName: 'greed'
      }
    ]
  },
  {
    id: 'sage-owl',
    name: 'Sage Owl',
    emoji: '🦉',
    description: 'A wise scholar owl that thrives on reading, studying, and honoring others.',
    focus: 'Knowledge & Honor',
    themeColor: 'from-cyan-500/10 to-blue-500/15 border-cyan-500/20 text-cyan-400',
    glowColor: 'shadow-[0_0_20px_rgba(6,182,212,0.35)] border-cyan-500/40',
    particleBg: 'bg-cyan-500',
    enhancements: [
      {
        key: 'blessingSwiftness',
        name: 'Blessing of Swiftness',
        benefit: '+100% Experience from habits and challenges',
        icon: Award,
        spellName: 'swiftness'
      }
    ]
  },
  {
    id: 'spirit-sprite',
    name: 'Spirit Sprite',
    emoji: '🧚',
    description: 'A playful forest sprite fueled by nature, castle building, and vitality.',
    focus: 'Vitality & Castle',
    themeColor: 'from-emerald-500/10 to-green-500/15 border-emerald-500/20 text-emerald-400',
    glowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.35)] border-emerald-500/40',
    particleBg: 'bg-emerald-500',
    enhancements: [
      {
        key: 'doubleHarvest',
        name: 'Double Harvest Draught',
        benefit: '+100% Citizen harvesting yields',
        icon: Hourglass,
        potionId: 'potion-double-harvest'
      },
      {
        key: 'combatProtection',
        name: 'Combat Protection Potion',
        benefit: 'Prevents gold loss on Monster Battle failures',
        icon: Shield,
        potionId: 'potion-combat-protection'
      }
    ]
  }
];

export function AlchemyLabTab() {
  const { user } = useUser();
  const [activeBuffs, setActiveBuffs] = useState<any>({});
  const [guardianState, setGuardianState] = useState<any>(null);
  const [inventoryCounts, setInventoryCounts] = useState<Record<string, number>>({});
  const [timeState, setTimeState] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);

  // Connect to Citizens store
  const loadCitizens = useCitizensStore(state => state.loadCitizens);
  const citizens = useCitizensStore(state => state.citizens);

  const loadEnhancedData = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 1. Fetch active alchemy buffs
      const buffs = await getUserPreference('active_alchemy_buffs') || {};
      setActiveBuffs(buffs);

      // 2. Fetch habit guardian state
      const gState = await getUserPreference('habit_guardian_state') || null;
      setGuardianState(gState);

      // 3. Fetch inventory counts for potions
      const items = await getInventory(user.id);
      const counts: Record<string, number> = {};
      items.forEach((i: any) => {
        counts[i.id] = (counts[i.id] || 0) + i.quantity;
      });
      setInventoryCounts(counts);

      // 4. Load citizens
      await loadCitizens(user.id);
    } catch (err) {
      logger.error('[Enhanced] Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadCitizens]);

  useEffect(() => {
    if (user?.id) {
      loadEnhancedData();
    }

    const timer = setInterval(() => {
      setTimeState(Date.now());
    }, 1000);

    window.addEventListener('alchemy-buffs-update', loadEnhancedData);
    window.addEventListener('character-inventory-update', loadEnhancedData);

    return () => {
      clearInterval(timer);
      window.removeEventListener('alchemy-buffs-update', loadEnhancedData);
      window.removeEventListener('character-inventory-update', loadEnhancedData);
    };
  }, [user?.id, loadEnhancedData]);

  const activeSpell = activeBuffs.activeSpell;
  const spellExpiresAt = activeBuffs.spellExpiresAt;
  const isSpellActive = activeSpell && spellExpiresAt && new Date(spellExpiresAt).getTime() > timeState;

  const isDoubleHarvestActive = activeBuffs.doubleHarvestUntil && new Date(activeBuffs.doubleHarvestUntil).getTime() > timeState;

  const formatExpires = (expiryStr: string) => {
    const remaining = new Date(expiryStr).getTime() - timeState;
    if (remaining <= 0) return "Expired";
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    if (mins > 60) {
      return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleSelectGuardian = async (id: string) => {
    if (!user?.id) return;
    try {
      const newState = {
        selectedId: id,
        level: guardianState?.level || 1,
        experience: guardianState?.experience || 0,
        lastBountyClaimedAt: guardianState?.lastBountyClaimedAt || null
      };
      await setUserPreference('habit_guardian_state', newState);
      setGuardianState(newState);
      toast({
        title: "Companion Summoned! ✨",
        description: `${GUARDIAN_DETAILS.find(g => g.id === id)?.name} has been set as your active companion.`
      });
      window.dispatchEvent(new Event('character-inventory-update'));
      window.dispatchEvent(new Event('alchemy-buffs-update'));
    } catch (err) {
      toast({
        title: "Summon failed",
        description: "Failed to switch companion.",
        variant: "destructive"
      });
    }
  };

  const handleDrinkPotion = async (potionId: string, name: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/inventory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: potionId, quantity: 1 })
      });
      if (!res.ok) {
        throw new Error("Failed to consume potion");
      }

      const current: any = await getUserPreference('active_alchemy_buffs') || {};
      const updated: any = { ...current };

      if (potionId === 'potion-forge-luck') {
        updated.forgeLuckCharges = (current.forgeLuckCharges || 0) + 1;
        toast({
          title: "Forge Luck Activated! 🧪✨",
          description: "Tempering success rate increased by +10% for your next upgrade attempt."
        });
      } else if (potionId === 'potion-combat-protection') {
        updated.combatProtectionCharges = (current.combatProtectionCharges || 0) + 1;
        toast({
          title: "Shield Barrier Activated! 🧪🛡️",
          description: "Your gold is safe from losses on the next Monster Battle."
        });
      } else if (potionId === 'potion-double-harvest') {
        const next24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        updated.doubleHarvestUntil = next24h;
        toast({
          title: "Nourishing Draught Consumed! 🧪🐟",
          description: "Citizen harvesting yields are doubled for the next 24 hours."
        });
      }

      await setUserPreference('active_alchemy_buffs', updated);
      await loadEnhancedData();

      window.dispatchEvent(new Event('character-inventory-update'));
      window.dispatchEvent(new Event('alchemy-buffs-update'));
      window.dispatchEvent(new Event('character-modifiers-update'));
    } catch (err: any) {
      toast({
        title: "Failed to drink potion",
        description: err.message || "Failed to drink elixir.",
        variant: "destructive"
      });
    }
  };

  const handleSpellCast = async (spellName: 'swiftness' | 'greed') => {
    if (!user?.id) return;

    const cooldownKey = `lastCastAt_${spellName}`;
    const lastCast = activeBuffs[cooldownKey];
    
    // Altar spell cooldown check (24h)
    if (lastCast) {
      const msPassed = Date.now() - new Date(lastCast).getTime();
      const cooling = 24 * 60 * 60 * 1000 - msPassed;
      if (cooling > 0) {
        const hours = Math.floor(cooling / 3600000);
        const mins = Math.floor((cooling % 3600000) / 60000);
        toast({
          title: "Spell Cooldown Active",
          description: `Altar Blessing can be channeled again in ${hours}h ${mins}m.`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const expiration = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // Active for 1 hour
      const updated = {
        ...activeBuffs,
        activeSpell: spellName,
        spellExpiresAt: expiration,
        [cooldownKey]: new Date().toISOString()
      };

      await setUserPreference('active_alchemy_buffs', updated);
      setActiveBuffs(updated);
      toast({
        title: "Blessing Channeled! ✨🔮",
        description: `Your ${spellName === 'swiftness' ? 'Blessing of Swiftness' : 'Blessing of Greed'} is active for 1 hour.`
      });
      window.dispatchEvent(new Event('alchemy-buffs-update'));
      window.dispatchEvent(new Event('character-modifiers-update'));
    } catch (err) {
      toast({
        title: "Spell cast failed",
        description: "Failed to channel altar blessing.",
        variant: "destructive"
      });
    }
  };

  const getSpellCooldownText = (spellName: 'swiftness' | 'greed') => {
    const cooldownKey = `lastCastAt_${spellName}`;
    const lastCast = activeBuffs[cooldownKey];
    if (!lastCast) return null;
    const msPassed = Date.now() - new Date(lastCast).getTime();
    const cooling = 24 * 60 * 60 * 1000 - msPassed;
    if (cooling <= 0) return null;

    const hours = Math.floor(cooling / 3600000);
    const mins = Math.floor((cooling % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  const renderParticles = (colorClass: string) => {
    return Array.from({ length: 8 }).map((_, i) => (
      <motion.div
        key={i}
        className={cn("absolute rounded-full pointer-events-none opacity-40", colorClass)}
        style={{
          width: Math.random() * 5 + 2,
          height: Math.random() * 5 + 2,
          left: `${Math.random() * 80 + 10}%`,
          bottom: "15%"
        }}
        animate={{
          y: [0, -110],
          opacity: [0, 0.7, 0],
          scale: [0.8, 1.2, 0.5]
        }}
        transition={{
          duration: Math.random() * 1.5 + 2,
          repeat: Infinity,
          delay: Math.random() * 1.2
        }}
      />
    ));
  };

  // Get active citizens from store
  const activeCitizens = useMemo(() => {
    return citizens.filter(c => c.active);
  }, [citizens]);

  return (
    <div className="space-y-6">
      
      {/* Enhanced Header Hero */}
      <div className="relative h-60 md:h-72 rounded-2xl overflow-hidden border border-amber-950/20 shadow-2xl flex items-end">
        <Image
          src="/images/alchemy-hero.png"
          alt="Arcane Enhancements"
          fill
          className="object-cover brightness-75 select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="p-6 relative z-10 space-y-1">
          <Badge className="bg-purple-600 text-white font-extrabold text-[9px] uppercase tracking-wider mb-2 px-2.5 py-1">
            Enhanced State
          </Badge>
          <h2 className="font-cardo font-bold text-2xl text-white">Enhanced Citizens & Guardians</h2>
          <p className="text-xs text-zinc-300 max-w-xl">
            Monitor companions and citizens empowered by your alchemy elixirs and spell blessings. Switch active companions, drink brewed elixirs, or channel daily altar magic.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Guardians Dashboard (Left columns) */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-cardo font-bold text-amber-100 flex items-center gap-2 px-1">
            <FlaskConical className="w-5 h-5 text-purple-400" /> Guardian Enhancements
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GUARDIAN_DETAILS.map(g => {
              const isActiveGuardian = guardianState?.selectedId === g.id;
              const gLevel = isActiveGuardian ? (guardianState?.level || 1) : 1;

              // Check active status for enhancements
              const activeEnhancementsList: { name: string; benefit: string; statusText: string; icon: any }[] = [];
              
              g.enhancements.forEach(enh => {
                if (enh.key === 'forgeLuck' && activeBuffs.forgeLuckCharges > 0) {
                  activeEnhancementsList.push({
                    name: enh.name,
                    benefit: enh.benefit,
                    statusText: `${activeBuffs.forgeLuckCharges} charges left`,
                    icon: enh.icon
                  });
                }
                if (enh.key === 'blessingGreed' && isSpellActive && activeSpell === 'greed') {
                  activeEnhancementsList.push({
                    name: enh.name,
                    benefit: enh.benefit,
                    statusText: formatExpires(spellExpiresAt),
                    icon: enh.icon
                  });
                }
                if (enh.key === 'blessingSwiftness' && isSpellActive && activeSpell === 'swiftness') {
                  activeEnhancementsList.push({
                    name: enh.name,
                    benefit: enh.benefit,
                    statusText: formatExpires(spellExpiresAt),
                    icon: enh.icon
                  });
                }
                if (enh.key === 'doubleHarvest' && isDoubleHarvestActive) {
                  activeEnhancementsList.push({
                    name: enh.name,
                    benefit: enh.benefit,
                    statusText: formatExpires(activeBuffs.doubleHarvestUntil),
                    icon: enh.icon
                  });
                }
                if (enh.key === 'combatProtection' && activeBuffs.combatProtectionCharges > 0) {
                  activeEnhancementsList.push({
                    name: enh.name,
                    benefit: enh.benefit,
                    statusText: `${activeBuffs.combatProtectionCharges} charges left`,
                    icon: enh.icon
                  });
                }
              });

              const isEnhanced = activeEnhancementsList.length > 0;

              return (
                <Card
                  key={g.id}
                  className={cn(
                    "bg-[#0f1115] border rounded-2xl relative overflow-hidden transition-all duration-300 flex flex-col justify-between min-h-[460px]",
                    isEnhanced ? g.glowColor : "border-white/5 opacity-70"
                  )}
                >
                  {/* Aura Particles */}
                  <AnimatePresence>
                    {isEnhanced && renderParticles(g.particleBg)}
                  </AnimatePresence>

                  <CardContent className="p-5 flex flex-col h-full justify-between relative z-10 space-y-4">
                    <div className="space-y-4">
                      {/* Guardian Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white text-sm">{g.name}</h4>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                            Focus: {g.focus}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[8px] uppercase font-bold",
                            isEnhanced ? "bg-purple-950/20 text-purple-300 border-purple-500/30 animate-pulse" : "text-zinc-600 border-zinc-900"
                          )}
                        >
                          {isEnhanced ? "Enhanced" : "Resting"}
                        </Badge>
                      </div>

                      {/* Companion Avatar */}
                      <div className="flex flex-col items-center py-2 select-none relative">
                        <motion.div
                          animate={isEnhanced ? {
                            y: [0, -8, 0],
                            scale: [1, 1.05, 1],
                            rotate: [0, 2, -2, 0]
                          } : {}}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="text-6xl"
                        >
                          {g.emoji}
                        </motion.div>
                        <Badge className="bg-zinc-950 text-zinc-400 border border-white/5 text-[9px] mt-3 font-extrabold">
                          Lvl {gLevel} {isActiveGuardian && "(Active)"}
                        </Badge>
                      </div>

                      {/* Enhancements List */}
                      <div className="space-y-2">
                        {isEnhanced ? (
                          <>
                            <h5 className="text-[8px] uppercase tracking-wider font-extrabold text-purple-400">Active Effects:</h5>
                            <div className="space-y-1.5">
                              {activeEnhancementsList.map((act, i) => {
                                const IconComponent = act.icon;
                                return (
                                  <div key={i} className="p-2 bg-zinc-950/80 border border-white/5 rounded-xl text-[10px] space-y-0.5">
                                    <div className="flex justify-between items-center font-bold text-white">
                                      <span className="flex items-center gap-1">
                                        <IconComponent className="w-3 h-3 text-amber-500" />
                                        {act.name}
                                      </span>
                                      <span className="text-amber-400 font-mono text-[9px]">{act.statusText}</span>
                                    </div>
                                    <p className="text-zinc-400 text-[9px] leading-relaxed">{act.benefit}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-zinc-500 italic bg-zinc-950/20 border border-zinc-900 p-2.5 rounded-xl space-y-1">
                            <p className="font-semibold text-zinc-400 not-italic">Can be enhanced by:</p>
                            <ul className="list-disc list-inside space-y-0.5 text-[9px] text-zinc-500 font-medium">
                              {g.enhancements.map((e, idx) => (
                                <li key={idx} className="truncate">{e.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Integrated Interactive Actions Container */}
                    <div className="space-y-2 pt-2 border-t border-white/5 mt-auto">
                      {/* 1. Summon Button */}
                      {!isActiveGuardian ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectGuardian(g.id)}
                          className="w-full text-[10px] h-8 font-bold border-amber-950/30 text-amber-500 hover:bg-amber-950/20"
                        >
                          Summon Companion
                        </Button>
                      ) : (
                        <div className="w-full text-center text-[9px] font-bold text-emerald-400 py-1 bg-emerald-950/20 rounded border border-emerald-900/30 flex items-center justify-center gap-1 select-none">
                          <Check className="w-3 h-3" /> Active Companion
                        </div>
                      )}

                      {/* 2. Spell Altar Cast Blessings */}
                      {g.enhancements.map(enh => {
                        if (!enh.spellName) return null;
                        const cooldownText = getSpellCooldownText(enh.spellName);
                        const isSpellActiveThisPet = isSpellActive && activeSpell === enh.spellName;
                        
                        return (
                          <Button
                            key={enh.key}
                            size="sm"
                            disabled={isSpellActive || !!cooldownText}
                            onClick={() => handleSpellCast(enh.spellName!)}
                            className={cn(
                              "w-full text-[10px] h-8 font-bold flex justify-between px-2.5",
                              isSpellActiveThisPet
                                ? "bg-indigo-900/40 text-indigo-200 border border-indigo-500/20 cursor-not-allowed"
                                : "bg-zinc-950 hover:bg-zinc-900 border border-white/5 text-white"
                            )}
                          >
                            <span className="flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5 text-amber-500" />
                              {enh.spellName === 'swiftness' ? 'Cast Swiftness' : 'Cast Greed'}
                            </span>
                            <span className="text-[8px] font-mono">
                              {cooldownText ? `CD: ${cooldownText}` : isSpellActiveThisPet ? 'Active' : '+100%'}
                            </span>
                          </Button>
                        );
                      })}

                      {/* 3. Consume Potions */}
                      {g.enhancements.map(enh => {
                        if (!enh.potionId) return null;
                        const ownedQty = inventoryCounts[enh.potionId] || 0;
                        
                        return (
                          <Button
                            key={enh.key}
                            size="sm"
                            disabled={ownedQty === 0}
                            onClick={() => handleDrinkPotion(enh.potionId!, enh.name)}
                            className={cn(
                              "w-full text-[10px] h-8 font-bold flex justify-between px-2.5",
                              ownedQty > 0
                                ? "bg-purple-950 hover:bg-purple-900 border border-purple-500/30 text-purple-300"
                                : "bg-zinc-950/40 text-zinc-600 border border-zinc-900 cursor-not-allowed"
                            )}
                          >
                            <span className="flex items-center gap-1">
                              <FlaskConical className="w-3.5 h-3.5" />
                              Drink {enh.key === 'forgeLuck' ? 'Forge Luck' : enh.key === 'doubleHarvest' ? 'Double Harvest' : 'Shield Potion'}
                            </span>
                            <span className="font-mono text-[9px] bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-400">
                              {ownedQty} owned
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Side Panel: Buff Status Overview */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-[#0f1115] border border-amber-950/20 rounded-2xl p-5 shadow-xl flex flex-col justify-between min-h-[300px]">
            <div>
              <h4 className="font-cardo font-bold text-xs text-amber-500 flex items-center gap-1.5 uppercase tracking-wider mb-3">
                <Activity className="w-4 h-4 text-amber-500" /> Buff Status Overview
              </h4>

              <div className="space-y-2.5 mt-2">
                {activeBuffs.forgeLuckCharges > 0 && (
                  <div className="flex justify-between items-center text-xs bg-amber-950/15 border border-amber-500/20 p-2 rounded-xl text-amber-400">
                    <span className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Forge Luck Elixir
                    </span>
                    <span className="font-mono font-bold text-[10px]">{activeBuffs.forgeLuckCharges} charges</span>
                  </div>
                )}

                {activeBuffs.combatProtectionCharges > 0 && (
                  <div className="flex justify-between items-center text-xs bg-emerald-950/15 border border-emerald-500/20 p-2 rounded-xl text-emerald-400">
                    <span className="font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Combat Shielding
                    </span>
                    <span className="font-mono font-bold text-[10px]">{activeBuffs.combatProtectionCharges} charges</span>
                  </div>
                )}

                {isDoubleHarvestActive && (
                  <div className="flex justify-between items-center text-xs bg-blue-950/15 border border-blue-500/20 p-2 rounded-xl text-blue-400">
                    <span className="font-bold flex items-center gap-1.5">
                      <Hourglass className="w-3.5 h-3.5" /> Double Harvest
                    </span>
                    <span className="font-mono font-bold text-[9px]">{formatExpires(activeBuffs.doubleHarvestUntil)}</span>
                  </div>
                )}

                {isSpellActive && (
                  <div className="flex justify-between items-center text-xs bg-indigo-950/15 border border-indigo-500/20 p-2 rounded-xl text-indigo-400">
                    <span className="font-bold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" /> Blessing of {activeSpell}
                    </span>
                    <span className="font-mono font-bold text-[9px]">{formatExpires(spellExpiresAt)}</span>
                  </div>
                )}

                {!activeBuffs.forgeLuckCharges &&
                 !activeBuffs.combatProtectionCharges &&
                 !isDoubleHarvestActive &&
                 !isSpellActive && (
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    No active potion elixirs or altar blessings. Drink elixirs directly from the Guardian cards above or from your inventory bag to activate modifiers!
                  </p>
                )}
              </div>
            </div>
            
            <div className="pt-4 text-[9px] text-zinc-600 text-center font-semibold border-t border-white/5 mt-4">
              Tip: Brew elixirs using the Alchemist Cauldron inside your Inventory Bag overlay.
            </div>
          </Card>
        </div>

      </div>

      {/* Nourished Citizens Panel */}
      <Card className="bg-[#0f1115] border border-amber-950/20 rounded-2xl p-6 shadow-2xl w-full">
        <CardHeader className="p-0 pb-4 border-b border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="font-cardo text-base text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" /> Nourished Citizens Ledger
              </CardTitle>
              <CardDescription className="text-zinc-500 text-xs mt-0.5">
                Active citizens wandering your realm that are affected by Double Harvest elixirs
              </CardDescription>
            </div>
            <AnimatePresence>
              {isDoubleHarvestActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] flex items-center gap-1.5 px-3 py-1.5 shadow-lg border border-emerald-500/20">
                    <Hourglass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} /> Double Harvest Active: {formatExpires(activeBuffs.doubleHarvestUntil)}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardHeader>

        <CardContent className="p-0 pt-6">
          {isDoubleHarvestActive ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {activeCitizens.map(citizen => (
                <div
                  key={citizen.id}
                  className="p-3 bg-zinc-950/80 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] rounded-xl flex flex-col items-center justify-between min-h-[140px] text-center relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
                  
                  <div className="space-y-2 mt-1">
                    <div className="relative w-12 h-12 flex items-center justify-center animate-bounce mb-1" style={{ animationDuration: '2s' }}>
                      <Image
                        src={citizen.isMythic ? `/images/Mythics/${citizen.filename}?v=2` : `/images/creatures/${citizen.filename}`}
                        alt={citizen.name}
                        fill
                        className="object-contain filter drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] select-none pointer-events-none"
                      />
                    </div>
                    <h5 className="font-bold text-white text-xs truncate max-w-[90px]">{citizen.name}</h5>
                    <Badge className="bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5">
                      x2 Yields
                    </Badge>
                  </div>

                  <div className="w-full mt-2">
                    <div className="w-full h-1 bg-zinc-900 border border-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500"
                        animate={{ width: ["0%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <span className="text-[8px] font-bold text-zinc-500 block mt-1 uppercase">Harvesting...</span>
                  </div>
                </div>
              ))}
              {activeCitizens.length === 0 && (
                <div className="col-span-full py-8 text-center text-zinc-500 text-xs italic font-serif">
                  Double Harvest is active, but you have no active Citizens wandering the Realm. Activate them in the Citizens tab!
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-zinc-900 rounded-xl bg-zinc-950/20 max-w-lg mx-auto">
              <FlaskConical className="w-8 h-8 text-zinc-600 mb-3" />
              <h5 className="font-cardo font-bold text-sm text-zinc-300">No Citizen Multipliers Active</h5>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-sm leading-normal">
                Drink a **Double Harvest Draught** directly from Spirit Sprite above or from your Inventory Bag to nourish active citizens. They will produce double items when harvesting materials!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
