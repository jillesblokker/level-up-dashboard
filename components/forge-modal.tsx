"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { comprehensiveItems, ComprehensiveItem } from "@/app/lib/comprehensive-items";
import { getInventory, InventoryItem } from "@/lib/inventory-manager";

interface ForgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForgeSuccess?: () => void;
}

interface Recipe {
  id: string;
  targetItemId: string;
  goldCost: number;
  materials: { itemId: string; quantity: number }[];
}

const FORGE_RECIPES: Recipe[] = [
  {
    id: 'craft-sword-irony',
    targetItemId: 'sword-irony',
    goldCost: 50,
    materials: [
      { itemId: 'sword-twig', quantity: 1 },
      { itemId: 'material-steel', quantity: 5 },
      { itemId: 'material-planks', quantity: 2 }
    ]
  },
  {
    id: 'craft-sword-morningstar',
    targetItemId: 'sword-morningstar',
    goldCost: 120,
    materials: [
      { itemId: 'sword-irony', quantity: 1 },
      { itemId: 'material-steel', quantity: 8 },
      { itemId: 'material-planks', quantity: 3 },
      { itemId: 'material-crystal', quantity: 1 }
    ]
  },
  {
    id: 'craft-sword-sunblade',
    targetItemId: 'sword-sunblade',
    goldCost: 250,
    materials: [
      { itemId: 'sword-morningstar', quantity: 1 },
      { itemId: 'material-silver', quantity: 10 },
      { itemId: 'material-crystal', quantity: 5 }
    ]
  },
  {
    id: 'craft-sword-solaraxe',
    targetItemId: 'sword-solaraxe',
    goldCost: 500,
    materials: [
      { itemId: 'sword-sunblade', quantity: 1 },
      { itemId: 'material-gold', quantity: 15 },
      { itemId: 'material-crystal', quantity: 10 }
    ]
  },
  {
    id: 'craft-shield-defecto',
    targetItemId: 'shield-defecto',
    goldCost: 40,
    materials: [
      { itemId: 'shield-reflecto', quantity: 1 },
      { itemId: 'material-logs', quantity: 5 },
      { itemId: 'material-steel', quantity: 3 }
    ]
  },
  {
    id: 'craft-shield-blockado',
    targetItemId: 'shield-blockado',
    goldCost: 100,
    materials: [
      { itemId: 'shield-defecto', quantity: 1 },
      { itemId: 'material-steel', quantity: 8 },
      { itemId: 'material-planks', quantity: 2 },
      { itemId: 'material-crystal', quantity: 1 }
    ]
  },
  {
    id: 'craft-armor-darko',
    targetItemId: 'armor-darko',
    goldCost: 60,
    materials: [
      { itemId: 'armor-normalo', quantity: 1 },
      { itemId: 'material-logs', quantity: 4 },
      { itemId: 'material-steel', quantity: 2 }
    ]
  },
  {
    id: 'craft-armor-silvo',
    targetItemId: 'armor-silvo',
    goldCost: 300,
    materials: [
      { itemId: 'armor-darko', quantity: 1 },
      { itemId: 'material-silver', quantity: 8 },
      { itemId: 'material-crystal', quantity: 4 }
    ]
  },
  {
    id: 'craft-potion-exp',
    targetItemId: 'potion-exp',
    goldCost: 50,
    materials: [
      { itemId: 'material-crystal', quantity: 3 },
      { itemId: 'food-red', quantity: 1 }
    ]
  }
];

export function ForgeModal({ isOpen, onClose, onForgeSuccess }: ForgeModalProps) {
  const [playerGold, setPlayerGold] = useState<number>(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCrafting, setIsCrafting] = useState<string | null>(null);
  const { toast } = useToast();

  const loadPlayerData = async () => {
    try {
      setIsLoading(true);
      // Fetch stats
      const statsRes = await fetch("/api/character-stats");
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setPlayerGold(stats.gold || 0);
      }
      // Fetch inventory
      const invItems = await getInventory('me'); // 'me' maps to authenticated user
      setInventory(invItems || []);
    } catch (e) {
      logger.error("Failed to load player data for forge", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPlayerData();
    }
  }, [isOpen]);

  const getOwnedQuantity = (itemId: string): number => {
    const match = inventory.find(i => i.id === itemId);
    return match ? match.quantity : 0;
  };

  const getMaterialName = (itemId: string): string => {
    const match = comprehensiveItems.find(i => i.id === itemId);
    return match ? match.name : itemId;
  };

  const getMaterialEmoji = (itemId: string): string => {
    const match = comprehensiveItems.find(i => i.id === itemId);
    return match ? match.emoji : '📦';
  };

  const handleCraft = async (recipe: Recipe) => {
    // Client-side verification
    if (playerGold < recipe.goldCost) {
      toast({
        title: "Insufficient Gold",
        description: "Complete quests to earn gold for crafting!",
        variant: "destructive"
      });
      return;
    }

    for (const req of recipe.materials) {
      const owned = getOwnedQuantity(req.itemId);
      if (owned < req.quantity) {
        toast({
          title: "Insufficient Materials",
          description: `You need ${req.quantity}x ${getMaterialName(req.itemId)} to craft this.`,
          variant: "destructive"
        });
        return;
      }
    }

    setIsCrafting(recipe.id);
    try {
      const res = await fetch("/api/forge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe.id })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Crafting failed");
      }

      toast({
        title: "Forge Success! 🔨",
        description: `Successfully crafted a ${comprehensiveItems.find(i => i.id === recipe.targetItemId)?.name}!`,
      });

      // Dispatch event to sync overall stats (like gold counters) on page
      window.dispatchEvent(new Event('character-inventory-update'));
      window.dispatchEvent(new Event('character-stats-update'));
      
      // Reload modal state
      await loadPlayerData();
      onForgeSuccess?.();
    } catch (e: any) {
      logger.error("Crafting request failed", e);
      toast({
        title: "Forge Failed",
        description: e.message || "Something went wrong while crafting.",
        variant: "destructive"
      });
    } finally {
      setIsCrafting(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-zinc-900 text-white border border-zinc-800 rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-amber-500 font-serif text-3xl font-bold flex items-center gap-2">
            🔨 The Royal Forge
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm">
            Combine your harvested kingdom materials and gold to forge equipment and items.
          </DialogDescription>
        </DialogHeader>

        {/* Player Gold Balance Display */}
        <div className="bg-zinc-950 border border-zinc-850/40 rounded-xl p-3 flex justify-between items-center my-2">
          <span className="text-zinc-400 text-sm font-medium">Your Wealth:</span>
          <span className="text-amber-400 font-bold text-lg flex items-center gap-1">
            🪙 {playerGold} Gold
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <span className="animate-spin text-amber-500 text-4xl">⏳</span>
          </div>
        ) : (
          <ScrollArea className="h-[400px] mt-2 pr-2">
            <div className="space-y-4">
              {FORGE_RECIPES.map(recipe => {
                const item = comprehensiveItems.find(i => i.id === recipe.targetItemId)!;
                const canCraft = playerGold >= recipe.goldCost && recipe.materials.every(req => getOwnedQuantity(req.itemId) >= req.quantity);

                return (
                  <div 
                    key={recipe.id}
                    className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-amber-500/30 transition-all"
                  >
                    {/* Item Metadata */}
                    <div className="flex gap-4 items-start max-w-sm">
                      <div className="text-4xl bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-center justify-center shrink-0">
                        {item.emoji}
                      </div>
                      <div>
                        <div className="flex gap-2 items-center">
                          <h4 className="font-bold text-white text-base leading-tight">{item.name}</h4>
                          <Badge variant="outline" className={`text-[10px] capitalize ${
                            item.rarity === 'legendary' ? 'border-orange-500 text-orange-400 bg-orange-950/20' :
                            item.rarity === 'epic' ? 'border-purple-500 text-purple-400 bg-purple-950/20' :
                            item.rarity === 'rare' ? 'border-blue-500 text-blue-400 bg-blue-950/20' :
                            item.rarity === 'uncommon' ? 'border-green-500 text-green-400 bg-green-950/20' :
                            'border-zinc-500 text-zinc-400 bg-zinc-950/20'
                          }`}>
                            {item.rarity}
                          </Badge>
                        </div>
                        <p className="text-zinc-400 text-xs mt-1 leading-snug">{item.description}</p>
                        
                        {/* Stats Row */}
                        {item.stats && Object.keys(item.stats).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {Object.entries(item.stats).map(([k, v]) => (
                              <span key={k} className="text-[10px] text-amber-500 font-mono bg-amber-500/5 border border-amber-500/10 px-1.5 py-0.5 rounded uppercase">
                                {k}: +{v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Requirements & Craft Button */}
                    <div className="flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-zinc-800 pt-3 md:pt-0">
                      {/* Materials requirements grid */}
                      <div className="flex flex-wrap md:flex-col gap-2 items-end justify-end w-full">
                        {recipe.materials.map(req => {
                          const owned = getOwnedQuantity(req.itemId);
                          const meetsReq = owned >= req.quantity;

                          return (
                            <span 
                              key={req.itemId}
                              className={`text-xs font-medium flex items-center gap-1.5 ${meetsReq ? 'text-green-400' : 'text-red-400'}`}
                            >
                              <span>{getMaterialEmoji(req.itemId)}</span>
                              <span>{getMaterialName(req.itemId)}:</span>
                              <span className="font-mono">{owned}/{req.quantity}</span>
                            </span>
                          );
                        })}
                        
                        {/* Gold cost */}
                        <span className={`text-xs font-semibold flex items-center gap-1.5 ${playerGold >= recipe.goldCost ? 'text-amber-400' : 'text-red-400'}`}>
                          <span>🪙</span>
                          <span>Gold Cost:</span>
                          <span className="font-mono">{recipe.goldCost} gold</span>
                        </span>
                      </div>

                      {/* Craft button */}
                      <Button
                        disabled={!canCraft || isCrafting !== null}
                        onClick={() => handleCraft(recipe)}
                        className={`h-9 w-full md:w-28 font-semibold rounded-lg text-xs ${
                          canCraft 
                            ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/10' 
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                        }`}
                      >
                        {isCrafting === recipe.id ? '🔨 Forging...' : '🔨 Forge'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
