"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback } from "react"
import { FlaskConical, Sparkles, Check, Flame, Zap, Shield, HelpCircle, Activity, Hourglass } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

import { getInventory } from '@/lib/inventory-manager';
import { getUserPreference, setUserPreference } from "@/lib/user-preferences-manager";

interface RecipeIngredient {
  itemId: string;
  name: string;
  emoji: string;
  required: number;
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  ingredients: RecipeIngredient[];
  outputItem: {
    id: string;
    name: string;
    emoji: string;
  };
}

const ALCHEMY_RECIPES: Recipe[] = [
  {
    id: 'recipe-forge-luck',
    name: 'Forge Luck Elixir',
    description: 'Increases Blacksmith Tempering success rate by +10% for your next upgrade attempt.',
    rarity: 'rare',
    ingredients: [
      { itemId: 'material-crystal', name: 'Essence Crystals', emoji: '💎', required: 2 },
      { itemId: 'fish-golden', name: 'Golden Fish', emoji: '🐟', required: 1 },
      { itemId: 'material-water', name: 'Water', emoji: '💧', required: 2 }
    ],
    outputItem: { id: 'potion-forge-luck', name: 'Forge Luck Elixir', emoji: '🧪' }
  },
  {
    id: 'recipe-combat-protection',
    name: 'Combat Protection Potion',
    description: 'Prevents gold loss on round failures in your next Monster Battle.',
    rarity: 'epic',
    ingredients: [
      { itemId: 'material-steel', name: 'Steel Ingots', emoji: '⚔️', required: 2 },
      { itemId: 'fish-rainbow', name: 'Rainbow Fish', emoji: '🐟', required: 1 },
      { itemId: 'material-water', name: 'Water', emoji: '💧', required: 3 }
    ],
    outputItem: { id: 'potion-combat-protection', name: 'Combat Protection Potion', emoji: '🧪' }
  },
  {
    id: 'recipe-double-harvest',
    name: 'Double Harvest Draught',
    description: 'Nourishes citizens, giving them +100% harvesting item yields on their next collection (expires in 24 hours).',
    rarity: 'uncommon',
    ingredients: [
      { itemId: 'material-logs', name: 'Wooden Logs', emoji: '🪵', required: 3 },
      { itemId: 'fish-silver', name: 'Silver Fish', emoji: '🐟', required: 2 },
      { itemId: 'material-water', name: 'Water', emoji: '💧', required: 2 }
    ],
    outputItem: { id: 'potion-double-harvest', name: 'Double Harvest Draught', emoji: '🧪' }
  }
];

export function AlchemyLabTab() {
  const { user } = useUser();
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('recipe-forge-luck');
  const [inventoryCounts, setInventoryCounts] = useState<Record<string, number>>({});
  const [activeBuffs, setActiveBuffs] = useState<any>({});
  const [isBrewing, setIsBrewing] = useState(false);
  const [timeState, setTimeState] = useState(Date.now());

  const loadAlchemyData = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 1. Load Inventory
      const items = await getInventory(user.id);
      const counts: Record<string, number> = {};
      items.forEach((i: any) => {
        counts[i.id] = (counts[i.id] || 0) + i.quantity;
      });
      setInventoryCounts(counts);

      // 2. Load Active Buffs
      const buffs = await getUserPreference('active_alchemy_buffs') || {};
      setActiveBuffs(buffs);
    } catch (err) {
      logger.error('[Alchemy] Failed to load alchemy data:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadAlchemyData();
    }

    // Refresh every second for active spell timers
    const timer = setInterval(() => {
      setTimeState(Date.now());
    }, 1000);

    // Listen for custom alchemy updates
    window.addEventListener('alchemy-buffs-update', loadAlchemyData);

    return () => {
      clearInterval(timer);
      window.removeEventListener('alchemy-buffs-update', loadAlchemyData);
    };
  }, [user?.id, loadAlchemyData]);

  const selectedRecipe = ALCHEMY_RECIPES.find(r => r.id === selectedRecipeId)!;

  const playBrewSound = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      for (let i = 0; i < 8; i++) {
        const time = ctx.currentTime + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150 + Math.random() * 80, time);
        osc.frequency.exponentialRampToValueAtTime(300, time + 0.08);
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
        osc.start(time);
        osc.stop(time + 0.08);
      }
    } catch {}
  };

  const handleBrew = async () => {
    if (!user?.id || isBrewing) return;

    // Verify materials
    const missingIngredient = selectedRecipe.ingredients.some(ing => 
      (inventoryCounts[ing.itemId] || 0) < ing.required
    );

    if (missingIngredient) {
      toast({
        title: "Missing Ingredients",
        description: "You do not have all required materials in your inventory to brew this elixir.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsBrewing(true);
      playBrewSound();

      // Trigger cauldron shake
      const cauldronEl = document.querySelector('.cauldron-container');
      if (cauldronEl) {
        cauldronEl.classList.add('animate-forge-shake');
        setTimeout(() => cauldronEl.classList.remove('animate-forge-shake'), 400);
      }

      // Deduct ingredients sequentially
      for (const ing of selectedRecipe.ingredients) {
        await fetch('/api/inventory', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: ing.itemId, quantity: ing.required })
        });
      }

      // Add output item
      const postRes = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: {
            id: selectedRecipe.outputItem.id,
            quantity: 1
          }
        })
      });

      if (postRes.ok) {
        toast({
          title: "Potion Brewed! 🧪✨",
          description: `Successfully brewed 1x ${selectedRecipe.outputItem.name}. Checked into your inventory bag.`
        });
        await loadAlchemyData();
        window.dispatchEvent(new Event('character-inventory-update'));
      } else {
        throw new Error("Failed to receive output elixir.");
      }
    } catch (err: any) {
      toast({
        title: "Brewing failed",
        description: err.message || "Failed to brew potion.",
        variant: "destructive"
      });
    } finally {
      setIsBrewing(false);
    }
  };

  const handleSpellCast = async (spellName: 'swiftness' | 'greed') => {
    if (!user?.id) return;

    const cooldownKey = `lastCastAt_${spellName}`;
    const lastCast = activeBuffs[cooldownKey];
    
    // Spell cooldown check (24h)
    if (lastCast) {
      const msPassed = Date.now() - new Date(lastCast).getTime();
      const cooling = 24 * 60 * 60 * 1000 - msPassed;
      if (cooling > 0) {
        const hours = Math.floor(cooling / 3600000);
        const mins = Math.floor((cooling % 3600000) / 60000);
        toast({
          title: "Spell Cooldown Active",
          description: `This spell can be cast again in ${hours}h ${mins}m.`,
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
        title: `${spellName === 'swiftness' ? '✨ Swiftness Blessing Cast!' : '🪙 Wealth Blessing Cast!'}`,
        description: `Active global bonus +100% ${spellName === 'swiftness' ? 'XP' : 'Gold'} from completed quests for 1 hour.`
      });
    } catch (err: any) {
      toast({
        title: "Blessing Failed",
        description: "Altar magic channeling failed.",
        variant: "destructive"
      });
    }
  };

  const formatExpires = (isoString: string) => {
    const remaining = new Date(isoString).getTime() - timeState;
    if (remaining <= 0) return "Expired";
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    if (mins > 60) {
      return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const spellActive = activeBuffs.activeSpell && activeBuffs.spellExpiresAt && new Date(activeBuffs.spellExpiresAt).getTime() > timeState;

  return (
    <div className="space-y-6">
      
      {/* Alchemy Lab Header */}
      <div className="relative h-60 md:h-72 rounded-2xl overflow-hidden border border-amber-950/20 shadow-2xl flex items-end">
        <Image
          src="/images/alchemy-hero.png"
          alt="Alchemy Lab"
          fill
          className="object-cover brightness-75 select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="p-6 relative z-10 space-y-1">
          <Badge className="bg-amber-600 text-black font-extrabold text-[9px] uppercase tracking-wider mb-2">
            Arcane Sanctuary
          </Badge>
          <h2 className="font-cardo font-bold text-2xl text-white">Alchemy Laboratory</h2>
          <p className="text-xs text-zinc-300 max-w-xl">
            Brew powerful elixirs and channel blessings at the Spell Altar. Utilize materials harvested by your citizens to gain game-changing boosts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Selection Column */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-lg font-cardo font-bold text-amber-100 flex items-center gap-2 px-1">
          <FlaskConical className="w-5 h-5 text-amber-500" /> Recipes Ledger
        </h3>
        
        <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
          {ALCHEMY_RECIPES.map(r => {
            const isSelected = selectedRecipeId === r.id;
            
            // Check if user has all materials
            const hasAll = r.ingredients.every(ing => 
              (inventoryCounts[ing.itemId] || 0) >= ing.required
            );

            return (
              <div
                key={r.id}
                onClick={() => setSelectedRecipeId(r.id)}
                className={cn(
                  "p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                  isSelected
                    ? "bg-amber-950/20 border-amber-500/50 shadow-inner"
                    : "bg-[#0f1115] border-white/5 hover:border-amber-900/30"
                )}
              >
                <div>
                  <h4 className="font-bold text-white text-xs">{r.name}</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 capitalize">
                    {r.rarity} Potion
                  </p>
                </div>
                
                <div className="shrink-0 flex items-center gap-2">
                  {hasAll ? (
                    <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-[8px] uppercase">
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-zinc-500 text-[8px] uppercase">
                      Missing
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cauldron Crafting Center */}
      <div className="lg:col-span-2 space-y-6 cauldron-container transition-all">
        
        <Card className="bg-[#0f1115] border border-amber-950/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[460px]">
          
          <div className="space-y-5">
            {/* banner */}
            <div className="flex items-start justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 bg-zinc-900 border border-zinc-700/50 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0 relative">
                  <span className="text-3xl">{selectedRecipe.outputItem.emoji}</span>
                </div>
                <div>
                  <h4 className="font-cardo font-bold text-white text-sm">{selectedRecipe.name}</h4>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1 capitalize">
                    {selectedRecipe.rarity} Craft Recipe
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-zinc-400 leading-relaxed font-medium bg-zinc-950/60 p-3.5 rounded-xl border border-white/5">
              {selectedRecipe.description}
            </p>

            {/* Ingredients Checklist */}
            <div className="space-y-2.5">
              <h5 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Required Alchemy Reagents:</h5>
              <div className="space-y-2">
                {selectedRecipe.ingredients.map(ing => {
                  const owned = inventoryCounts[ing.itemId] || 0;
                  const satisfied = owned >= ing.required;

                  return (
                    <div
                      key={ing.itemId}
                      className={cn(
                        "p-3 rounded-xl border text-xs flex justify-between items-center transition-all",
                        satisfied 
                          ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-400" 
                          : "bg-red-950/10 border-red-500/20 text-red-400"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{ing.emoji}</span>
                        <span className="font-bold">{ing.name}</span>
                      </div>
                      <span className="font-mono font-bold">
                        {owned} / {ing.required}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="pt-4 border-t border-white/5 mt-4">
            <Button
              disabled={isBrewing || selectedRecipe.ingredients.some(ing => (inventoryCounts[ing.itemId] || 0) < ing.required)}
              onClick={handleBrew}
              className={cn(
                "w-full text-xs font-bold py-5 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                !isBrewing && selectedRecipe.ingredients.every(ing => (inventoryCounts[ing.itemId] || 0) >= ing.required)
                  ? "bg-gradient-to-r from-amber-600 to-amber-500 text-black font-extrabold shadow-lg hover:brightness-110 active:scale-[0.98]" 
                  : "bg-zinc-950 text-zinc-600 border border-zinc-800 cursor-not-allowed"
              )}
            >
              {isBrewing ? (
                <>⏳ Boiling Cauldron Brew...</>
              ) : (
                <>🧪 Brew {selectedRecipe.outputItem.name}</>
              )}
            </Button>
          </div>

        </Card>

        {/* Altar Daily Spells & Buff Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Daily Spell Altar */}
          <Card className="bg-[#0f1115] border border-amber-950/20 rounded-2xl p-5 shadow-xl">
            <h4 className="font-cardo font-bold text-xs text-amber-500 flex items-center gap-1.5 uppercase tracking-wider mb-3.5">
              <Flame className="w-4 h-4 text-amber-500" /> Mage Spell Altar
            </h4>
            
            <p className="text-[10px] text-zinc-500 mb-3.5 leading-relaxed font-semibold">
              Channel daily altar magic for a global quest bonus (1-hour active, 24h cooldown).
            </p>

            <div className="space-y-2">
              <Button
                disabled={spellActive}
                onClick={() => handleSpellCast('swiftness')}
                className="w-full text-xs font-bold justify-between bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-xl p-3 h-auto"
              >
                <span className="flex items-center gap-2 text-white">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Blessing of Swiftness
                </span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  +100% XP
                </span>
              </Button>

              <Button
                disabled={spellActive}
                onClick={() => handleSpellCast('greed')}
                className="w-full text-xs font-bold justify-between bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-xl p-3 h-auto"
              >
                <span className="flex items-center gap-2 text-white">
                  <Zap className="w-4 h-4 text-amber-500" /> Blessing of Greed
                </span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  +100% Gold
                </span>
              </Button>
            </div>
          </Card>

          {/* Active Buff Indicators */}
          <Card className="bg-[#0f1115] border border-amber-950/20 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="font-cardo font-bold text-xs text-amber-500 flex items-center gap-1.5 uppercase tracking-wider mb-3">
                <Activity className="w-4 h-4 text-amber-500" /> Active Buff Status
              </h4>

              <div className="space-y-2.5 mt-2">
                {/* Forge Luck charges */}
                {activeBuffs.forgeLuckCharges > 0 ? (
                  <div className="flex justify-between items-center text-xs bg-amber-950/15 border border-amber-500/20 p-2 rounded-xl text-amber-400">
                    <span className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Forge Luck Elixir
                    </span>
                    <span className="font-mono font-bold text-[10px]">{activeBuffs.forgeLuckCharges} charges</span>
                  </div>
                ) : null}

                {/* Combat Protection charges */}
                {activeBuffs.combatProtectionCharges > 0 ? (
                  <div className="flex justify-between items-center text-xs bg-emerald-950/15 border border-emerald-500/20 p-2 rounded-xl text-emerald-400">
                    <span className="font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Combat Shielding
                    </span>
                    <span className="font-mono font-bold text-[10px]">{activeBuffs.combatProtectionCharges} charges</span>
                  </div>
                ) : null}

                {/* Double Harvest draught */}
                {activeBuffs.doubleHarvestUntil && new Date(activeBuffs.doubleHarvestUntil).getTime() > timeState ? (
                  <div className="flex justify-between items-center text-xs bg-blue-950/15 border border-blue-500/20 p-2 rounded-xl text-blue-400">
                    <span className="font-bold flex items-center gap-1.5">
                      <Hourglass className="w-3.5 h-3.5" /> Double Harvest
                    </span>
                    <span className="font-mono font-bold text-[9px]">{formatExpires(activeBuffs.doubleHarvestUntil)}</span>
                  </div>
                ) : null}

                {/* Active Spell Altar Blessing */}
                {spellActive ? (
                  <div className="flex justify-between items-center text-xs bg-indigo-950/15 border border-indigo-500/20 p-2 rounded-xl text-indigo-400">
                    <span className="font-bold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" /> Blessing of {activeBuffs.activeSpell}
                    </span>
                    <span className="font-mono font-bold text-[9px]">{formatExpires(activeBuffs.spellExpiresAt)}</span>
                  </div>
                ) : null}

                {/* Fallback empty message */}
                {!(activeBuffs.forgeLuckCharges > 0) &&
                 !(activeBuffs.combatProtectionCharges > 0) &&
                 !(activeBuffs.doubleHarvestUntil && new Date(activeBuffs.doubleHarvestUntil).getTime() > timeState) &&
                 !spellActive ? (
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    No active potion elixirs or blessings. Drink elixirs from your inventory bag to activate modifiers!
                  </p>
                ) : null}
              </div>
            </div>

            <div className="pt-2 text-[9px] text-zinc-500 text-center font-medium">
              Check your Inventory Bag to drink brewed potions.
            </div>
          </Card>

        </div>

      </div>

    </div>
  </div>
  );
}
