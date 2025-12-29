"use client";

import Image from "next/image"
import { BookOpen, MapPin, ArrowUpRight, Droplets, Trees, Home, Mountain, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { TileType, InventoryItem } from "@/types/tiles"
import { spendGold } from "@/lib/gold-manager"
import { useState, useEffect, useMemo } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { addTileToInventory } from "@/lib/tile-inventory-manager"
import { useUser } from "@clerk/nextjs"
import { useSupabase } from "@/lib/hooks/useSupabase"
import { RARE_TILES, RareTile, isRareTileUnlocked, getRareTileUnlockDate, loadRareTiles } from "@/lib/rare-tiles-manager"


// Static definition of all possible tiles to prevent re-creation on every render
const allPossibleTiles: InventoryItem[] = [
  // Foundation Tiles (Level 0-20)
  { id: 'grass', name: 'Grass', type: 'grass', quantity: 0, cost: 25, connections: [], description: 'Basic terrain', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Grass tile', image: '/images/tiles/grass-tile.png' },
  { id: 'water', name: 'Water', type: 'water', quantity: 0, cost: 50, connections: [], description: 'Water body', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Water tile', image: '/images/tiles/water-tile.png' },
  { id: 'forest', name: 'Forest', type: 'forest', quantity: 0, cost: 75, connections: [], description: 'Dense woodland', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Forest tile', image: '/images/tiles/forest-tile.png' },
  { id: 'mountain', name: 'Mountain', type: 'mountain', quantity: 0, cost: 100, connections: [], description: 'Rocky terrain', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Mountain tile', image: '/images/tiles/mountain-tile.png' },
  { id: 'desert', name: 'Desert', type: 'desert', quantity: 0, cost: 125, connections: [], description: 'Arid terrain', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Desert tile', image: '/images/tiles/desert-tile.png' },
  { id: 'ice', name: 'Ice', type: 'ice', quantity: 0, cost: 150, connections: [], description: 'Frozen terrain', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Ice tile', image: '/images/tiles/ice-tile.png' },

  // Settlement Tiles (Level 20-40)
  { id: 'town', name: 'Town', type: 'town', quantity: 0, cost: 200, connections: [], description: 'Small settlement', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Town tile', image: '/images/tiles/town-tile.png' },
  { id: 'city', name: 'City', type: 'city', quantity: 0, cost: 400, connections: [], description: 'Large settlement', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'City tile', image: '/images/tiles/city-tile.png' },

  // Development Tiles (Level 40-60)
  { id: 'castle', name: 'Castle', type: 'castle', quantity: 0, cost: 800, connections: [], description: 'Fortified structure', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Castle tile', image: '/images/tiles/castle-tile.png' },
  { id: 'dungeon', name: 'Dungeon', type: 'dungeon', quantity: 0, cost: 600, connections: [], description: 'Underground complex', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Dungeon tile', image: '/images/tiles/dungeon-tile.png' },
  { id: 'portal-entrance', name: 'Portal Entrance', type: 'portal-entrance', quantity: 0, cost: 1000, connections: [], description: 'Portal entry point', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Portal entrance tile', image: '/images/tiles/portal-entrance-tile.png' },
  { id: 'portal-exit', name: 'Portal Exit', type: 'portal-exit', quantity: 0, cost: 1000, connections: [], description: 'Portal exit point', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Portal exit tile', image: '/images/tiles/portal-exit-tile.png' },

  // Advanced Tiles (Level 60-80)
  { id: 'volcano', name: 'Volcano', type: 'volcano', quantity: 0, cost: 1500, connections: [], description: 'Active volcano', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Volcano tile', image: '/images/tiles/volcano-tile.png' },
  { id: 'lava', name: 'Lava', type: 'lava', quantity: 0, cost: 1800, connections: [], description: 'Molten rock', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Lava tile', image: '/images/tiles/lava-tile.png' },
  { id: 'cave', name: 'Cave', type: 'cave', quantity: 0, cost: 800, connections: [], description: 'Natural cave', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Cave tile', image: '/images/tiles/cave-tile.png' },
  { id: 'snow', name: 'Snow', type: 'snow', quantity: 0, cost: 300, connections: [], description: 'Snowy terrain', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Snow tile', image: '/images/tiles/snow-tile.png' },

  // Consumables
  { id: 'streak-scroll', name: 'Streak Freeze', type: 'streak-scroll', quantity: 0, cost: 500, connections: [], description: 'Protects your streak if you miss a day. Automatically consumed.', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Streak Freeze Scroll', image: '/images/tiles/streak-scroll.png', unlocked: true }
];

// Tile categories with logical organization
const tileCategories = [
  {
    id: 'foundation',
    name: 'Foundation Tiles',
    minLevel: 0,
    maxLevel: 20,
    description: 'Basic terrain and natural features',
    tiles: ['grass', 'water', 'forest', 'mountain', 'desert', 'ice']
  },
  {
    id: 'settlement',
    name: 'Settlement Tiles',
    minLevel: 20,
    maxLevel: 40,
    description: 'Human settlements and communities',
    tiles: ['town', 'city']
  },
  {
    id: 'development',
    name: 'Development Tiles',
    minLevel: 40,
    maxLevel: 60,
    description: 'Advanced infrastructure and specialized buildings',
    tiles: ['castle', 'dungeon', 'portal-entrance', 'portal-exit']
  },
  {
    id: 'advanced',
    name: 'Advanced Tiles',
    minLevel: 60,
    maxLevel: 80,
    description: 'Complex structures and magical elements',
    tiles: ['volcano', 'lava', 'cave', 'snow']
  },
  {
    id: 'rare',
    name: 'Rare Tiles',
    minLevel: 0,
    maxLevel: 100,
    description: 'Special tiles available on specific dates',
    tiles: (Array.isArray(RARE_TILES) ? RARE_TILES : []).map(tile => tile && tile.type ? tile.type : '').filter(Boolean)
  },
  {
    id: 'consumables',
    name: 'Consumables',
    minLevel: 0,
    maxLevel: 100,
    description: 'Special items to help your journey',
    tiles: ['streak-scroll']
  }
];

interface TileInventoryProps {
  tiles: InventoryItem[]
  selectedTile: InventoryItem | null
  onSelectTile: (tile: InventoryItem | null) => void
  onUpdateTiles: (tiles: InventoryItem[]) => void
  activeTab: 'place' | 'buy' | 'guide'
  setActiveTab: (tab: 'place' | 'buy' | 'guide') => void
  onOutOfTiles?: (tile: InventoryItem) => void
}

export function TileInventory({ tiles, selectedTile, onSelectTile, onUpdateTiles, activeTab, setActiveTab, onOutOfTiles }: TileInventoryProps) {
  const { user } = useUser();
  const { supabase, isLoading } = useSupabase();
  const [buyQuantities, setBuyQuantities] = useState<{ [key: string]: number }>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('foundation')
  const [userLevel, setUserLevel] = useState(1);
  const [rareTilesData, setRareTilesData] = useState<RareTile[]>([]);

  // Determine user level safely
  const userLevelValue = userLevel || 1;

  useEffect(() => {
    const loadUserLevel = () => {
      try {
        const stats = JSON.parse(localStorage.getItem('character-stats') || '{}');
        setUserLevel(stats.level || 1);
      } catch (error) {
        console.error('Error loading user level:', error);
        setUserLevel(1);
      }
    };

    const loadRareTilesData = async () => {
      try {
        if (user?.id && supabase && !isLoading) {
          const rareTiles = await loadRareTiles(supabase, user.id);
          setRareTilesData(rareTiles || []);
        }
      } catch (error) {
        console.error('Error loading rare tiles data:', error);
        setRareTilesData([]);
      }
    };

    loadUserLevel();
    loadRareTilesData();
  }, [user?.id, supabase, isLoading]);

  // Listen for rare tile unlock/clear events
  useEffect(() => {
    const handleRareTileUnlocked = () => {
      if (user?.id && supabase) {
        loadRareTiles(supabase, user.id).then(setRareTilesData);
      }
    };

    const handleRareTileCleared = () => {
      if (user?.id && supabase) {
        loadRareTiles(supabase, user.id).then(setRareTilesData);
      }
    };

    window.addEventListener('rare-tile-unlocked', handleRareTileUnlocked);
    window.addEventListener('rare-tile-cleared', handleRareTileCleared);

    return () => {
      window.removeEventListener('rare-tile-unlocked', handleRareTileUnlocked);
      window.removeEventListener('rare-tile-cleared', handleRareTileCleared);
    };
  }, [user?.id, supabase]);

  // Filter tiles by category - show all tiles but mark locked ones
  const getTilesByCategory = useMemo(() => (categoryId: string) => {
    const category = tileCategories.find(cat => cat.id === categoryId);
    if (!category) return [];

    if (category.id === 'rare') {
      // Handle rare tiles differently
      // Safety check for RARE_TILES
      try {
        const safeRareTiles = Array.isArray(RARE_TILES) ? RARE_TILES : [];
        return safeRareTiles.map(rareTile => {
          if (!rareTile) return null; // Safety check
          const userTile = tiles && Array.isArray(tiles) ? tiles.find(t => t.type === rareTile.type) : null;
          // Use loaded rare tiles data if available, otherwise fall back to date-based check
          const loadedRareTile = rareTilesData.find(rt => rt.id === rareTile.id);
          const isUnlocked = loadedRareTile?.unlocked || isRareTileUnlocked(rareTile);

          return {
            id: rareTile.id,
            name: rareTile.name,
            type: rareTile.type as TileType,
            quantity: userTile?.quantity || 0,
            cost: rareTile.cost,
            connections: [],
            rotation: 0 as 0,
            revealed: true,
            isVisited: false,
            x: 0,
            y: 0,
            ariaLabel: `${rareTile.name} tile`,
            image: rareTile.image,
            description: rareTile.description,
            unlocked: isUnlocked
          };
        }).filter(Boolean) as InventoryItem[]; // Filter out nulls
      } catch (err) {
        console.error('Error processing rare tiles:', err);
        return [];
      }
    }

    // Get all possible tiles for this category
    const categoryTiles = allPossibleTiles.filter(tile => category.tiles.includes(tile.type));

    // Merge with user's actual inventory to get correct quantities
    return categoryTiles.map(possibleTile => {
      const userTile = tiles && Array.isArray(tiles) ? tiles.find(t => t.type === possibleTile.type) : null;

      // Check if tile is unlocked based on user level
      const isUnlocked = userLevelValue >= category.minLevel;

      // For foundation tiles (level 0-20), give starting quantities to new players
      let quantity = 0;
      if (category.id === 'foundation' && userLevelValue >= 1) {
        // If user has tiles, use their quantity. If not, start with 5
        quantity = userTile ? userTile.quantity : 5;
      } else {
        // For other categories, use user's quantity or 0
        quantity = userTile?.quantity || 0;
      }

      return {
        ...possibleTile,
        quantity: quantity,
        unlocked: isUnlocked
      };
    });
  }, [tiles, rareTilesData, userLevelValue]);

  // Listen for tile inventory updates
  useEffect(() => {
    const handleTileInventoryUpdate = () => {
      if (user?.id) {
        onUpdateTiles(tiles);
      }
    };

    window.addEventListener('tile-inventory-update', handleTileInventoryUpdate);

    return () => {
      window.removeEventListener('tile-inventory-update', handleTileInventoryUpdate);
    };
  }, [tiles, onUpdateTiles, user?.id]);

  const handleBuyTile = async (tile: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation()

    const quantity = buyQuantities[tile.type] || 1
    const totalCost = tile.cost * quantity

    try {
      const success = await spendGold(totalCost, `purchase-${quantity}-${tile.name || tile.type}-tiles`);
      if (success) {
        if (!user?.id) {
          console.error('[Tile Inventory] No user ID found');
          toast.error('User not authenticated');
          return;
        }

        const result = await addTileToInventory(user.id, {
          id: tile.id || tile.type,
          type: tile.type as any,
          name: tile.name,
          quantity: quantity,
          cost: tile.cost,
          connections: tile.connections || [],
        });

        const newTiles = tiles.map(item =>
          item.type === tile.type
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        onUpdateTiles(newTiles)

        setBuyQuantities(prev => ({ ...prev, [tile.type]: 1 }))
        toast.success(`Purchased ${quantity} ${tile.name || tile.type} tile(s)`)
      }
    } catch (error) {
      console.error('[Tile Inventory] Error updating tile inventory:', error);
      toast.error('Failed to update tile inventory');
    }
  }

  const handleQuantityChange = (type: string, value: string) => {
    const quantity = parseInt(value) || 1
    setBuyQuantities(prev => ({ ...prev, [type]: Math.max(1, quantity) }))
  }

  const getTileImage = (type: TileType) => {
    const rareTile = (Array.isArray(RARE_TILES) ? RARE_TILES : []).find(rt => rt && rt.type === type);
    if (rareTile) {
      return rareTile.image;
    }

    switch (type) {
      case 'city':
        return '/images/tiles/city-tile.png'
      case 'town':
        return '/images/tiles/town-tile.png'
      default:
        return `/images/tiles/${type}-tile.png`
    }
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'place' | 'buy' | 'guide')} className="w-full h-full flex flex-col">
        <div className="px-6 pt-4 pb-2 shrink-0">
          <TabsList className="w-full flex bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-1">
            <TabsTrigger
              value="place"
              className="flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-black font-semibold transition-all rounded-md"
            >
              Place Tiles
            </TabsTrigger>
            <TabsTrigger
              value="buy"
              className="flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-black font-semibold transition-all rounded-md"
            >
              Buy Tiles
            </TabsTrigger>
            <TabsTrigger
              value="guide"
              className="flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-black font-semibold transition-all rounded-md"
            >
              Synergy Guide
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="place" className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden mt-0">
          <div className="px-6 space-y-4 shrink-0 mb-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Tile Category</label>
              <span className="text-xs text-gray-500">Level {userLevelValue}</span>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full bg-gray-900/50 border-gray-700">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 min-w-[280px]">
                {tileCategories.map(category => {
                  const isUnlocked = userLevelValue >= category.minLevel;
                  return (
                    <SelectItem
                      key={category.id}
                      value={category.id}
                      className={cn(
                        "cursor-pointer",
                        !isUnlocked && "opacity-60"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={cn(
                          !isUnlocked && "text-gray-400"
                        )}>
                          {category.name}
                        </span>
                        <span className={cn(
                          "text-xs ml-2",
                          !isUnlocked ? "text-gray-500" : "text-gray-400"
                        )}>
                          Lvl {category.minLevel}-{category.maxLevel}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-h-0 w-full">
            {(() => {
              const category = tileCategories.find(cat => cat.id === selectedCategory);
              if (!category) return null;

              const categoryTiles = getTilesByCategory(selectedCategory);

              if (!categoryTiles.length) {
                return (
                  <div className="text-center py-12 px-6">
                    <div className="text-xl font-bold mb-2">
                      {userLevelValue < category.minLevel ? '🔒 Locked' : '📦 No tiles available'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {userLevelValue < category.minLevel
                        ? `Unlock at level ${category.minLevel}`
                        : 'No tiles in this category'
                      }
                    </div>
                  </div>
                );
              }

              return (
                <ScrollArea className="h-full w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 pb-24">
                    {categoryTiles.map((tile) => {
                      if (!tile) return null;
                      return (
                        <TooltipProvider key={tile.type}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Card
                                className={cn(
                                  "relative overflow-hidden transition-all duration-200",
                                  selectedTile?.type === tile.type && "ring-2 ring-amber-500 shadow-lg",
                                  (tile.quantity === 0 || userLevelValue < category.minLevel) && "opacity-50",
                                  userLevelValue >= category.minLevel && "cursor-pointer hover:ring-2 hover:ring-amber-500/50 hover:scale-105"
                                )}
                                onClick={() => {
                                  if (userLevelValue < category.minLevel) {
                                    return;
                                  }
                                  if (tile.quantity === 0) {
                                    setActiveTab('buy');
                                    if (onOutOfTiles) onOutOfTiles(tile);
                                    return;
                                  }
                                  onSelectTile(selectedTile?.type === tile.type ? null : tile);
                                }}
                                aria-label={`Select ${tile.name} tile (Quantity: ${tile.quantity})`}
                              >
                                <div className="aspect-square relative group">
                                  <Image
                                    src={getTileImage(tile.type)}
                                    alt={tile.name}
                                    fill
                                    className="object-cover transition-transform duration-200 group-hover:scale-110"
                                  />
                                  <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                    {tile.quantity}
                                  </div>
                                  {userLevelValue < category.minLevel && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                      <span className="text-white text-xs font-bold bg-gray-600 px-3 py-1 rounded-full">
                                        🔒 Lvl {category.minLevel}
                                      </span>
                                    </div>
                                  )}
                                  {category.id === 'rare' && !tile.unlocked && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                      <span className="text-white text-xs font-bold bg-purple-600 px-3 py-1 rounded-full">
                                        🔒
                                      </span>
                                    </div>
                                  )}
                                  {tile.quantity === 0 && userLevelValue >= category.minLevel && category.id !== 'rare' && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                      <span className="text-white text-xs font-bold bg-amber-500 px-3 py-1 rounded-full">
                                        Buy More
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="p-4 bg-background/95 backdrop-blur-sm">
                                  <div className="capitalize font-semibold text-sm mb-1">{tile.name}</div>
                                  <div className="text-xs text-muted-foreground text-center">
                                    <span className="text-amber-500 font-medium">{tile.cost} gold</span>
                                    {tile.cost > 0 && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {tile.cost <= 50 ? 'Budget' : tile.cost <= 150 ? 'Standard' : tile.cost <= 300 ? 'Premium' : 'Luxury'}
                                      </div>
                                    )}
                                  </div>
                                  {tile.quantity === 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full mt-3 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('buy');
                                      }}
                                      aria-label={`Switch to buy tab for ${tile.name}`}
                                    >
                                      Buy More
                                    </Button>
                                  )}
                                </div>
                              </Card>
                            </TooltipTrigger>
                            {category.id === 'rare' && !tile.unlocked && (
                              <TooltipContent>
                                <p>A secret... come back another day... :)</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      )
                    })}
                  </div>
                </ScrollArea>
              );
            })()}
          </div>
        </TabsContent>
        <TabsContent value="buy" className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden mt-0">
          <div className="px-6 space-y-4 shrink-0 mb-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Tile Category</label>
              <span className="text-xs text-gray-500">Level {userLevelValue}</span>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full bg-gray-900/50 border-gray-700">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 min-w-[280px]">
                {tileCategories.map(category => {
                  const isUnlocked = userLevelValue >= category.minLevel;
                  return (
                    <SelectItem
                      key={category.id}
                      value={category.id}
                      className={cn(
                        "cursor-pointer",
                        !isUnlocked && "opacity-60"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={cn(
                          !isUnlocked && "text-gray-400"
                        )}>
                          {category.name}
                        </span>
                        <span className={cn(
                          "text-xs ml-2",
                          !isUnlocked ? "text-gray-500" : "text-gray-400"
                        )}>
                          Lvl {category.minLevel}-{category.maxLevel}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-h-0 w-full">
            {(() => {
              const category = tileCategories.find(cat => cat.id === selectedCategory);
              if (!category) return null;

              const categoryTiles = getTilesByCategory(selectedCategory);

              if (!categoryTiles.length) {
                return (
                  <div className="text-center py-12 px-6">
                    <div className="text-xl font-bold mb-2">
                      {userLevelValue < category.minLevel ? '🔒 Locked' : '📦 No tiles available'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {userLevelValue < category.minLevel
                        ? `Unlock at level ${category.minLevel}`
                        : 'No tiles in this category'
                      }
                    </div>
                  </div>
                );
              }

              return (
                <ScrollArea className="h-full w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-6 pb-24">
                    {categoryTiles.map((tile) => {
                      if (!tile) return null;
                      return (
                        <TooltipProvider key={tile.type}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Card
                                className={cn(
                                  "relative overflow-hidden transition-all duration-200",
                                  (tile.quantity === 0 || userLevelValue < category.minLevel) && "opacity-50",
                                  userLevelValue >= category.minLevel && "hover:scale-105",
                                  tile.quantity === 0 && userLevelValue >= category.minLevel && "border-2 border-amber-500 shadow-lg"
                                )}
                              >
                                <div className="aspect-square relative group">
                                  <Image
                                    src={getTileImage(tile.type)}
                                    alt={tile.name}
                                    fill
                                    className="object-cover transition-transform duration-200 group-hover:scale-110"
                                  />
                                  <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                    {tile.quantity}
                                  </div>
                                  {userLevelValue < category.minLevel && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                                      <span className="text-white text-xs font-bold bg-gray-600 px-3 py-1 rounded-full shadow-lg">
                                        🔒 Lvl {category.minLevel}
                                      </span>
                                    </div>
                                  )}
                                  {tile.quantity === 0 && userLevelValue >= category.minLevel && category.id !== 'rare' && (
                                    <span className="absolute top-2 left-2 bg-green-500 text-white text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg" aria-label="Buyable tile badge">
                                      Buyable
                                    </span>
                                  )}
                                  {category.id === 'rare' && !tile.unlocked && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                      <span className="text-white text-xs font-bold bg-purple-600 px-3 py-1 rounded-full">
                                        🔒
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="p-4 bg-background/95 backdrop-blur-sm">
                                  <div className="capitalize font-semibold text-sm mb-1">{tile.name}</div>
                                  <div className="text-xs text-muted-foreground text-center mb-3">
                                    <span className="text-amber-500 font-medium">{tile.cost} gold</span>
                                  </div>
                                  <div className="flex gap-2 items-center justify-center">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={buyQuantities[tile.type] || 1}
                                      onChange={(e) => handleQuantityChange(tile.type, e.target.value)}
                                      className="w-16 h-10 text-sm text-center px-2 py-1 border border-gray-700 rounded-md focus:ring-amber-500 focus:border-amber-500 bg-gray-800"
                                      id={`buy-quantity-${tile.type}`}
                                      name={`buy-quantity-${tile.type}`}
                                      disabled={userLevelValue < category.minLevel}
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className={cn(
                                        "flex-1 min-h-[40px] h-10",
                                        userLevelValue >= category.minLevel
                                          ? "bg-amber-600 border-amber-500 hover:bg-amber-500 text-white font-semibold"
                                          : "bg-gray-600/50 border-gray-600 text-gray-400 cursor-not-allowed"
                                      )}
                                      onClick={(e) => userLevelValue >= category.minLevel && handleBuyTile(tile, e)}
                                      disabled={userLevelValue < category.minLevel}
                                      aria-label={`Buy ${buyQuantities[tile.type] || 1} ${tile.name || tile.type} tile${(buyQuantities[tile.type] || 1) > 1 ? 's' : ''}`}
                                    >
                                      {userLevelValue < category.minLevel ? 'Locked' : 'Buy'}
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            </TooltipTrigger>
                            {category.id === 'rare' && !tile.unlocked && (
                              <TooltipContent>
                                <p>A secret... come back another day... :)</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      )
                    })}
                  </div>
                </ScrollArea>
              );
            })()}
          </div>
        </TabsContent>

        <TabsContent value="guide" className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden mt-0">
          <ScrollArea className="h-full w-full">
            <div className="px-6 py-4 space-y-6 pb-24">
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                <h3 className="text-amber-400 font-bold flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5" />
                  Building Synergies
                </h3>
                <p className="text-sm text-gray-300">
                  Place buildings near specific tiles to boost their production! A &quot;✨&quot; icon will appear when you find a perfect spot.
                </p>
              </div>

              <div className="space-y-4">
                {/* Farm Synergy */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-100 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/farm-tile.png" alt="Farm" width={40} height={40} className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Farm</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                        <span>Needs: <span className="text-blue-400 font-semibold">Water</span></span>
                      </div>
                      <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                        Boosts Gold production by <span className="text-green-400 font-bold">+20%</span> when placed next to a Water tile.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lumber Mill Synergy */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-800 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/lumber_mill-tile.png" alt="Lumber Mill" width={40} height={40} className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Lumber Mill</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                        <span>Needs: <span className="text-green-500 font-semibold">Forest</span></span>
                      </div>
                      <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                        Boosts Gold production by <span className="text-green-400 font-bold">+20%</span> when placed next to a Forest tile.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Market Synergy */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-900 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/market-tile.png" alt="Market" width={40} height={40} className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Market</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                        <span>Needs: <span className="text-yellow-200 font-semibold">Houses</span></span>
                      </div>
                      <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                        <span className="text-green-400 font-bold">+10% Gold</span> for EACH neighboring House, Mansion, or Cottage.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Castle Synergy */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-700 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/castle-tile.png" alt="Castle" width={40} height={40} className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Castle</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                        <span>Needs: <span className="text-gray-300 font-semibold">Space</span></span>
                      </div>
                      <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                        Looks majestic when surrounded by 4+ tiles (not on the edge).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Water Users (Well, Fountain, Fisherman) */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-900 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/fountain-tile.png" alt="Fountain" width={40} height={40} className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Water Buildings</h4>
                      <div className="text-xs text-gray-400 mb-1">
                        Includes: <span className="text-gray-300">Fountain, Well, Fisherman</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                        <Droplets className="w-4 h-4 text-blue-400" />
                        <span>Needs: <span className="text-blue-400 font-semibold">Water</span></span>
                      </div>
                      <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                        <span className="text-green-400 font-bold">+20% Gold</span> when placed next to any Water tile.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Blacksmith Synergy */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-900 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/blacksmith-tile.png" alt="Blacksmith" width={40} height={40} className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Blacksmith</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                        <Mountain className="w-4 h-4 text-gray-400" />
                        <span>Needs: <span className="text-red-500 font-semibold">Mountain / Lava</span></span>
                      </div>
                      <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                        <span className="text-green-400 font-bold">+25% Gold</span> when placed near Mountains or Lava for forge heat.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Commercial Synergy (Inn, Bakery, Grocery, Foodcourt) */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-700 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/inn-tile.png" alt="Inn" width={40} height={40} className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Shops & Inns</h4>
                      <div className="text-xs text-gray-400 mb-1">
                        Includes: <span className="text-gray-300">Inn, Bakery, Grocery, Foodcourt</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                        <Home className="w-4 h-4 text-yellow-500" />
                        <span>Needs: <span className="text-yellow-200 font-semibold">Residents</span></span>
                      </div>
                      <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                        <span className="text-green-400 font-bold">+10% Gold</span> for EACH neighboring House, Mansion, or City.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Magic & Study (Library, Wizard) */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-900 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/wizard-tile.png" alt="Wizard" width={40} height={40} className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Magic & Study</h4>
                      <div className="text-xs text-gray-400 mb-1">
                        Includes: <span className="text-gray-300">Library, Wizard Tower</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                        <MapPin className="w-4 h-4 text-blue-300" />
                        <span>Needs: <span className="text-blue-300 font-semibold">Quiet (Ice / Mountain)</span></span>
                      </div>
                      <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                        <span className="text-green-400 font-bold">+30% Gold</span> when placed in secluded areas like Ice or Mountains.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Farming (Vegetables, Pumpkin Patch) */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-800 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/vegetables-tile.png" alt="Vegetables" width={40} height={40} className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Crops</h4>
                      <div className="text-xs text-gray-400 mb-1">
                        Includes: <span className="text-gray-300">Vegetables, Pumpkin Patch</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 mb-2">
                        <Trees className="w-4 h-4 text-green-500" />
                        <span>Needs: <span className="text-green-600 font-semibold">Grass / Water</span></span>
                      </div>
                      <p className="text-xs text-gray-400 bg-black/40 p-2 rounded">
                        <span className="text-green-400 font-bold">+15% Gold</span> on fertile Grass or near Water.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-xs text-amber-600 italic">
                    More synergies may be discovered as you level up!
                  </p>
                </div>

              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs >
    </>
  )
}

function renderTilePreview(type: string) {
  switch (type) {
    case 'grass':
      return (
        <div className="w-full h-full bg-green-700">
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <rect width="32" height="32" fill="#0D7200" />
            <g fill="#388E3C" opacity="0.7">
              <path d="M5,10 C7,5 10,8 8,12 C13,10 15,15 10,17" />
              <path d="M20,15 C22,10 25,13 23,17 C28,15 30,20 25,22" />
            </g>
          </svg>
        </div>
      );

    case 'water':
      return (
        <div className="w-full h-full bg-blue-600">
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <rect width="32" height="32" fill="#1e90ff" />
            <g fill="#1E88E5" opacity="0.7">
              <path d="M0,20 Q16,10 32,20 L32,32 L0,32 Z" />
            </g>
          </svg>
        </div>
      );

    case 'mountain':
      return (
        <div className="w-full h-full bg-gray-600">
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <rect width="32" height="32" fill="#795548" />
            <path d="M8,26 L16,10 L24,26 Z" fill="#5D4037" />
          </svg>
        </div>
      );

    case 'forest':
      return (
        <div className="w-full h-full bg-green-800">
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <rect width="32" height="32" fill="#33691E" />
            <path d="M8,26 L16,8 L24,26 Z" fill="#2E7D32" />
          </svg>
        </div>
      );

    case 'mystery':
    case 'big-mystery':
      return (
        <div className="w-full h-full bg-purple-700">
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <rect width="32" height="32" fill="#9932cc" />
            <g fill="#5E35B1" opacity="0.7">
              <path d="M16,8 L24,16 L16,24 L8,16 Z" />
              <circle cx="16" cy="16" r="4" />
            </g>
          </svg>
        </div>
      );

    case 'city':
      return (
        <div className="w-full h-full bg-amber-700">
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <rect width="32" height="32" fill="#F59E0B" />
            <g fill="#FF6F00" opacity="0.7">
              <rect x="8" y="12" width="16" height="20" />
              <polygon points="16,4 24,12 8,12" />
            </g>
          </svg>
        </div>
      );

    case 'town':
      return (
        <div className="w-full h-full bg-amber-600">
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <rect width="32" height="32" fill="#ffd700" />
            <g fill="#FF8F00" opacity="0.7">
              <rect x="10" y="14" width="12" height="18" />
              <polygon points="16,6 22,14 10,14" />
            </g>
          </svg>
        </div>
      );

    default:
      return <div className="w-full h-full bg-gray-500"></div>;
  }
}