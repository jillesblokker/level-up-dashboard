"use client"

import { logger } from "@/lib/logger";
;

import Image from "next/image"
import { BookOpen, MapPin, ArrowUpRight, Droplets, Trees, Home, Mountain, Info, Check, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Tile, TileType, InventoryItem } from "@/types/core-interfaces"
import { spendGold } from "@/lib/gold-manager"
import { useState, useEffect, useMemo } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { addTileToInventory } from "@/lib/tile-inventory-manager"
import { useUser } from "@clerk/nextjs"
import { useSupabase } from "@/lib/hooks/useSupabase"
import { RARE_TILES, RareTile, isRareTileUnlocked, getRareTileUnlockDate, loadRareTiles } from "@/lib/rare-tiles-manager"
import { getUserScopedItem } from "@/lib/user-scoped-storage"


// Static definition of all possible tiles to prevent re-creation on every render
const allPossibleTiles: Tile[] = [
  // Foundation & Terrain Tiles (Level 1-25)
  { id: 'grass', name: 'Grass', type: 'grass', quantity: 0, cost: 25, connections: [], description: 'Basic terrain', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Grass tile', image: '/images/tiles/grass-tile.webp' },
  { id: 'crossroad', name: 'Crossroad', type: 'crossroad', quantity: 0, cost: 0, connections: [], description: 'Connecting path', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Crossroad tile', image: '/images/kingdom-tiles/Crossroad.webp' },
  { id: 'straightroad', name: 'Straight Road', type: 'straightroad', quantity: 0, cost: 0, connections: [], description: 'Connecting path', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Straight Road tile', image: '/images/kingdom-tiles/Straightroad.webp' },
  { id: 'cornerroad', name: 'Corner Road', type: 'cornerroad', quantity: 0, cost: 0, connections: [], description: 'Connecting path', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Corner Road tile', image: '/images/kingdom-tiles/Cornerroad.webp' },
  { id: 'tsplitroad', name: 'T-Split Road', type: 'tsplitroad', quantity: 0, cost: 0, connections: [], description: 'Connecting path', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'T-Split Road tile', image: '/images/kingdom-tiles/Tsplitroad.webp' },
  { id: 'water', name: 'Water', type: 'water', quantity: 0, cost: 50, connections: [], description: 'Water body', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Water tile', image: '/images/tiles/water-tile.webp' },
  { id: 'forest', name: 'Forest', type: 'forest', quantity: 0, cost: 75, connections: [], description: 'Dense woodland', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Forest tile', image: '/images/tiles/forest-tile.webp' },
  { id: 'mountain', name: 'Mountain', type: 'mountain', quantity: 0, cost: 100, connections: [], description: 'Rocky terrain', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Mountain tile', image: '/images/tiles/mountain-tile.webp' },
  { id: 'desert', name: 'Desert', type: 'desert', quantity: 0, cost: 125, connections: [], description: 'Arid terrain', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Desert tile', image: '/images/tiles/desert-tile.webp' },
  { id: 'ice', name: 'Ice', type: 'ice', quantity: 0, cost: 150, connections: [], description: 'Frozen terrain', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Ice tile', image: '/images/tiles/ice-tile.webp' },
  { id: 'snow', name: 'Snow', type: 'snow', quantity: 0, cost: 300, connections: [], description: 'Snowy terrain', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Snow tile', image: '/images/tiles/snow-tile.webp' },
  { id: 'cave', name: 'Cave', type: 'cave', quantity: 0, cost: 800, connections: [], description: 'Natural cave', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Cave tile', image: '/images/tiles/cave-tile.webp' },
  { id: 'farmland', name: 'Farmland', type: 'farmland', quantity: 0, cost: 80, connections: [], description: 'Fertile land for crops', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Farmland tile', image: '/images/tiles/farmland-tile.webp' },
  { id: 'jungle', name: 'Jungle', type: 'jungle', quantity: 0, cost: 100, connections: [], description: 'Dense tropical jungle', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Jungle tile', image: '/images/tiles/jungle-tile.webp' },
  { id: 'oasis', name: 'Oasis', type: 'oasis', quantity: 0, cost: 120, connections: [], description: 'A refreshing desert oasis', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Oasis tile', image: '/images/tiles/oasis-tile.webp' },
  { id: 'graveyard', name: 'Graveyard', type: 'graveyard', quantity: 0, cost: 150, connections: [], description: 'Spooky resting place', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Graveyard tile', image: '/images/tiles/graveyard-tile.webp' },

  // Landscape Districts (Level 25-50)
  { id: 'town', name: 'Town District', type: 'town', quantity: 0, cost: 200, connections: [], description: 'Small landscape settlement', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Town tile', image: '/images/tiles/town-tile.webp' },
  { id: 'city', name: 'City District', type: 'city', quantity: 0, cost: 400, connections: [], description: 'Large landscape settlement', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'City tile', image: '/images/tiles/city-tile.webp' },
  { id: 'settlement', name: 'Pioneer Settlement', type: 'settlement', quantity: 0, cost: 600, connections: [], description: 'A growing community of adventurous pioneers', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Settlement tile', image: '/images/tiles/settlement-tile.webp' },
  { id: 'megapolis', name: 'Megapolis', type: 'megapolis', quantity: 0, cost: 3000, connections: [], description: 'A grand fortress city landscape', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Megapolis tile', image: '/images/tiles/megapolis-tile.webp' },
  { id: 'abbey', name: 'Silent Abbey', type: 'abbey', quantity: 0, cost: 600, connections: [], description: 'A silent gothic monastery sanctuary', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Silent Abbey tile', image: '/images/tiles/abbey-tile.webp' },
  { id: 'coral_reef', name: 'Mermaid Coral Reef', type: 'coral_reef', quantity: 0, cost: 150, connections: [], description: 'A mermaid resting on a rock reef', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Mermaid tile', image: '/images/tiles/coral_reef-tile.webp' },

  // Ancient Ruins & Caverns (Level 50-75)
  { id: 'ruins', name: 'Ancient Ruins', type: 'ruins', quantity: 0, cost: 150, connections: [], description: 'Ancient mysterious ruins', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Ancient Ruins tile', image: '/images/tiles/ruins-tile.webp' },
  { id: 'crystal_cavern', name: 'Crystal Cavern', type: 'crystal_cavern', quantity: 0, cost: 200, connections: [], description: 'Cave filled with magical crystals', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Crystal Cavern tile', image: '/images/tiles/crystal_cavern-tile.webp' },
  { id: 'lava', name: 'Lava Fields', type: 'lava', quantity: 0, cost: 1800, connections: [], description: 'Molten rock landscape', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Lava tile', image: '/images/tiles/lava-tile.webp' },
  { id: 'volcano', name: 'Active Volcano', type: 'volcano', quantity: 0, cost: 1500, connections: [], description: 'Active volcano peak', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Volcano tile', image: '/images/tiles/volcano-tile.webp' },

  // Mythic Sandbox Wonders (Level 75-100+)
  { id: 'portal-entrance', name: 'Portal Entrance', type: 'portal-entrance', quantity: 0, cost: 1000, connections: [], description: 'Portal entry point', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Portal entrance tile', image: '/images/tiles/portal-entrance-tile.webp' },
  { id: 'portal-exit', name: 'Portal Exit', type: 'portal-exit', quantity: 0, cost: 1000, connections: [], description: 'Portal exit point', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Portal exit tile', image: '/images/tiles/portal-exit-tile.webp' },
  { id: 'floating_island', name: 'Floating Island', type: 'floating_island', quantity: 0, cost: 500, connections: [], description: 'A mysterious floating island landscape', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Island tile', image: '/images/tiles/floating_island-tile.webp' }
];

// Tile categories with logical organization
const tileCategories = [
  {
    id: 'foundation',
    name: 'Terrain & Roads',
    minLevel: 0,
    maxLevel: 25,
    description: 'Basic terrain, paths, and natural features',
    tiles: ['grass', 'water', 'serene_lake', 'waterway_canal', 'forest', 'mountain', 'desert', 'ice', 'snow', 'cave', 'crossroad', 'straightroad', 'cornerroad', 'tsplitroad', 'farmland', 'jungle', 'oasis', 'graveyard']
  },
  {
    id: 'settlement',
    name: 'Landscape Districts',
    minLevel: 25,
    maxLevel: 50,
    description: 'Macro settlement districts and sanctuaries',
    tiles: ['settlement', 'town', 'city', 'megapolis', 'abbey', 'coral_reef']
  },
  {
    id: 'development',
    name: 'Ancient Ruins & Caverns',
    minLevel: 50,
    maxLevel: 75,
    description: 'Ancient ruins, crystal caves, and volcanic terrain',
    tiles: ['ruins', 'crystal_cavern', 'lava', 'volcano']
  },
  {
    id: 'advanced',
    name: 'Mythic Sandbox Wonders',
    minLevel: 75,
    maxLevel: 100,
    description: 'Floating islands, portals, and mythic landscape monuments',
    tiles: ['portal-entrance', 'portal-exit', 'floating_island', 'astral_citadel_monument']
  },
  {
    id: 'siege_engines',
    name: 'Siege engines',
    minLevel: 0,
    maxLevel: 100,
    description: 'Habit-unlocked siege engines to place on walkable realm tiles',
    tiles: ['siege_catapult', 'siege_scorpion', 'siege_battering_ram', 'siege_trebuchet', 'siege_tower', 'siege_flame_ballista', 'siege_spring_cannon', 'siege_ether_mortar', 'siege_dragon_mortar', 'siege_astral_projector']
  },
  {
    id: 'rare',
    name: 'Rare Event Tiles',
    minLevel: 0,
    maxLevel: 100,
    description: 'Special seasonal event blueprints available during active seasonal months',
    tiles: (Array.isArray(RARE_TILES) ? RARE_TILES : []).map(tile => tile && tile.type ? tile.type : '').filter(Boolean)
  }
];

interface TileInventoryProps {
  tiles: Tile[]
  selectedTile: Tile | null
  onSelectTile: (tile: Tile | null) => void
  onUpdateTiles: (tiles: Tile[]) => void
  activeTab: 'place' | 'buy' | 'guide'
  setActiveTab: (tab: 'place' | 'buy' | 'guide') => void
  onOutOfTiles?: (tile: Tile) => void
  userLevel?: number
}

export function TileInventory({ tiles, selectedTile, onSelectTile, onUpdateTiles, activeTab, setActiveTab, onOutOfTiles, userLevel: userLevelProp }: TileInventoryProps) {
  const { user } = useUser();
  const { supabase, isLoading } = useSupabase();
  const [buyQuantities, setBuyQuantities] = useState<{ [key: string]: number }>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('foundation')
  const [userLevel, setUserLevel] = useState(1);
  const [rareTilesData, setRareTilesData] = useState<RareTile[]>([]);

  // Determine user level safely
  const userLevelValue = userLevelProp || userLevel || 1;

  useEffect(() => {
    const loadUserLevel = () => {
      try {
        const stored = getUserScopedItem('character-stats');
        const stats = stored ? JSON.parse(stored) : {};
        setUserLevel(stats.level || 1);
      } catch (error) {
        logger.error('Error loading user level:', error);
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
        logger.error('Error loading rare tiles data:', error);
        setRareTilesData([]);
      }
    };

    loadUserLevel();
    loadRareTilesData();

    // Listen for character stats updates from the service
    window.addEventListener('character-stats-update', loadUserLevel);
    window.addEventListener('seasonal-hunt:updated', loadRareTilesData);
    window.addEventListener('storage', loadRareTilesData);

    return () => {
      window.removeEventListener('character-stats-update', loadUserLevel);
      window.removeEventListener('seasonal-hunt:updated', loadRareTilesData);
      window.removeEventListener('storage', loadRareTilesData);
    };
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

  const [sandboxVersion, setSandboxVersion] = useState(0);

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
          } as Tile;
        }).filter(Boolean) as Tile[]; // Filter out nulls
      } catch (err) {
        logger.error('Error processing rare tiles:', err);
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
        quantity = (userTile && userTile.quantity !== undefined) ? userTile.quantity : 5;
      } else if (category.id === 'siege_engines') {
        const localSandbox = (() => {
          try { return JSON.parse(localStorage.getItem('sandbox-inventory') || '{}'); }
          catch { return {}; }
        })();
        quantity = userTile?.quantity || localSandbox[possibleTile.type] || 0;
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
  }, [tiles, rareTilesData, userLevelValue, sandboxVersion]);

  // Listen for tile inventory updates
  useEffect(() => {
    const handleTileInventoryUpdate = () => {
      setSandboxVersion(v => v + 1);
      if (user?.id) {
        onUpdateTiles(tiles);
      }
    };

    window.addEventListener('tile-inventory-update', handleTileInventoryUpdate);
    window.addEventListener('inventory-updated', handleTileInventoryUpdate);
    window.addEventListener('add-realm-tile-inventory', handleTileInventoryUpdate);
    window.addEventListener('storage', handleTileInventoryUpdate);

    return () => {
      window.removeEventListener('tile-inventory-update', handleTileInventoryUpdate);
      window.removeEventListener('inventory-updated', handleTileInventoryUpdate);
      window.removeEventListener('add-realm-tile-inventory', handleTileInventoryUpdate);
      window.removeEventListener('storage', handleTileInventoryUpdate);
    };
  }, [tiles, onUpdateTiles, user?.id]);

  const handleBuyTile = async (tile: Tile, e: React.MouseEvent) => {
    e.stopPropagation()

    const quantity = buyQuantities[tile.type] || 1
    const totalCost = (tile.cost || 0) * quantity

    try {
      const success = await spendGold(totalCost, `purchase-${quantity}-${tile.name || tile.type}-tiles`);
      if (success) {
        // Optimistically update local inventory state immediately (0ms visual delay)
        let found = false;
        let newTiles = tiles.map(item => {
          if (item.type === tile.type) {
            found = true;
            return { ...item, quantity: (item.quantity || 0) + quantity };
          }
          return item;
        });
        if (!found) {
          newTiles.push({ ...tile, quantity: quantity });
        }
        onUpdateTiles(newTiles);
        setBuyQuantities(prev => ({ ...prev, [tile.type]: 1 }));
        toast.success(`Purchased ${quantity} ${tile.name || tile.type} tile(s)`);

        // Asynchronously persist to database in background
        if (user?.id) {
          addTileToInventory(user.id, {
            id: tile.id || tile.type,
            type: tile.type as any,
            name: tile.name || tile.type,
            quantity: quantity,
            cost: tile.cost,
            connections: tile.connections || [],
          });
        }
      }
    } catch (error) {
      logger.error('[Tile Inventory] Error updating tile inventory:', error);
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
        return '/images/tiles/city-tile.webp'
      case 'town':
        return '/images/tiles/town-tile.webp'
      case 'crossroad':
        return '/images/kingdom-tiles/Crossroad.webp'
      case 'straightroad':
        return '/images/kingdom-tiles/Straightroad.webp'
      case 'cornerroad':
        return '/images/kingdom-tiles/Cornerroad.webp'
      case 'tsplitroad':
        return '/images/kingdom-tiles/Tsplitroad.webp'
      case 'fortune_teller':
        return '/images/kingdom-tiles/fortune_teller.webp'
      case 'pyramid':
        return '/images/tiles/pyramid-tile.webp'
      case 'whispering-well':
        return '/images/tiles/whispering-well-tile.webp'
      case 'sphinx-gates':
        return '/images/tiles/sphinx-gates-tile.webp'
      case 'whispering-canopy':
        return '/images/tiles/whispering-canopy-tile.webp'
      case 'frostfire-obelisk':
        return '/images/tiles/frostfire-obelisk-tile.webp'
      case 'fairy-ring':
        return '/images/tiles/fairy-ring-tile.webp'
      case 'settlement':
        return '/images/tiles/settlement-tile.webp'
      case 'megapolis':
        return '/images/tiles/megapolis-tile.webp'
      case 'mystic-obelisk':
        return '/images/tiles/mystic-obelisk-tile.webp'
      case 'golden-pantheon':
        return '/images/tiles/golden-pantheon-tile.webp'
      case 'plank-labyrinth':
        return '/images/tiles/plank-labyrinth-tile.webp'
      case 'prison':
        return '/images/tiles/prison-tile.webp'
      case 'apotheca':
        return '/images/tiles/apotheca-tile.webp'
      case 'abbey':
        return '/images/tiles/abbey-tile.webp'
      case 'waterway_canal':
        return '/images/kingdom-tiles/WaterwayCanal.webp'
      case 'astral_citadel_monument':
        return '/images/kingdom-tiles/AstralCitadelMonument.webp'
      case 'serene_lake':
        return '/images/kingdom-tiles/SereneLake.webp'
      case 'mystic_bazaar':
        return '/images/kingdom-tiles/Mystic_bazaar.webp'
      case 'airship_harbor':
        return '/images/kingdom-tiles/Airship_harbor.webp'
      case 'housecup':
        return '/images/kingdom-tiles/Housecup.webp'
      case 'observatory':
        return '/images/kingdom-tiles/Observatory.webp'
      case 'hall_of_champions':
        return '/images/kingdom-tiles/Hall_of_champions.webp'
      case 'titan_watchtower':
        return '/images/kingdom-tiles/Titan_watchtower.webp'
      case 'siege_workshop':
        return '/images/kingdom-tiles/siege_workshop.webp'
      case 'siege_catapult':
        return '/images/kingdom-tiles/siege_catapult.webp'
      case 'siege_scorpion':
        return '/images/kingdom-tiles/siege_scorpion.webp'
      case 'siege_battering_ram':
        return '/images/kingdom-tiles/siege_battering_ram.webp'
      case 'siege_trebuchet':
        return '/images/kingdom-tiles/siege_trebuchet.webp'
      default:
        return `/images/tiles/${type}-tile.webp`
    }
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'place' | 'buy' | 'guide')} className="w-full h-full flex flex-col">
        <div className="px-6 pt-4 pb-2 shrink-0">
          <TabsList
            className="flex h-12 bg-zinc-950  border border-amber-900/30 rounded-xl p-1.5 w-full overflow-x-auto overflow-y-hidden"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'pan-x' }}
          >
            <TabsTrigger
              value="place"
              className="flex-1 shrink-0 h-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/20 rounded-lg text-xs font-bold tracking-widest transition-all whitespace-nowrap"
            >
              Place tiles
            </TabsTrigger>
            <TabsTrigger
              value="buy"
              className="flex-1 shrink-0 h-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/20 rounded-lg text-xs font-bold tracking-widest transition-all whitespace-nowrap"
            >
              Buy tiles
            </TabsTrigger>
          </TabsList>

        </div>

        <TabsContent value="place" className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden mt-0">
          <div className="px-6 space-y-4 shrink-0 mb-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Tile Category</label>
              <span className="text-xs text-zinc-500">Level {userLevelValue}</span>
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 hover:border-amber-500/50 text-white rounded-lg px-4 py-2.5 text-sm font-serif focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner cursor-pointer appearance-none pr-10 transition-colors"
                aria-label="Select Tile Category"
              >
                {tileCategories.map(category => {
                  const isUnlocked = userLevelValue >= category.minLevel;
                  return (
                    <option
                      key={category.id}
                      value={category.id}
                      className="bg-zinc-900 text-zinc-100 py-2"
                    >
                      {category.name} (Lvl {category.minLevel}-{category.maxLevel}){!isUnlocked ? ' 🔒 Preview' : ''}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-amber-500">
                <ChevronDown className="h-4 w-4 opacity-70" />
              </div>
            </div>
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
                      {userLevelValue < category.minLevel ? '🔒 Level Preview' : '📦 No tiles available'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {userLevelValue < category.minLevel
                        ? `Reach level ${category.minLevel} to unlock placement for these blueprints`
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
                                  "relative overflow-hidden transition-all duration-200 h-full flex flex-col",
                                  selectedTile?.type === tile.type && "ring-2 ring-amber-500 shadow-lg",
                                  userLevelValue < category.minLevel && "opacity-75 border-amber-900/30",
                                  userLevelValue >= category.minLevel && "cursor-pointer hover:ring-2 hover:ring-amber-500/50 hover:scale-105"
                                )}
                                onClick={() => {
                                  if (userLevelValue < category.minLevel) {
                                    toast.info(`Reach Level ${category.minLevel} to unlock the ${tile.name} blueprint!`);
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
                                    className={cn(
                                      "object-cover transition-transform duration-200 group-hover:scale-110",
                                      userLevelValue < category.minLevel && "opacity-50 grayscale-[0.5]"
                                    )}
                                    unoptimized={true}
                                  />
                                  <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                    {tile.quantity}
                                  </div>
                                  {userLevelValue < category.minLevel && (
                                    <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 z-10 pointer-events-none">
                                      <span className="text-amber-200 text-xs font-bold bg-zinc-900/90 border border-amber-500/40 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                        🔒 Lvl {category.minLevel} Required
                                      </span>
                                    </div>
                                  )}
                                  {category.id === 'rare' && !tile.unlocked && (
                                    <div className="absolute inset-0 bg-zinc-950/60 flex items-center justify-center">
                                      <span className="text-white text-xs font-bold bg-purple-600 px-3 py-1 rounded-full">
                                        🔒 Seasonal Event
                                      </span>
                                    </div>
                                  )}
                                  {tile.quantity === 0 && userLevelValue >= category.minLevel && category.id !== 'rare' && (
                                    <div className="absolute inset-0 bg-zinc-950/40 flex items-center justify-center">
                                      <span className="text-white text-xs font-bold bg-amber-500 px-3 py-1 rounded-full">
                                        Buy More
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="p-4 bg-background/95 flex-1 flex flex-col">
                                  <div className="capitalize font-semibold text-sm mb-1">{tile.name}</div>
                                  <div className="text-xs text-muted-foreground text-center">
                                    <span className="text-amber-500 font-medium">{tile.cost ?? 0} gold</span>
                                    {(tile.cost ?? 0) > 0 && (
                                      <div className="text-xs text-zinc-500 mt-1">
                                        {(tile.cost ?? 0) <= 50 ? 'Budget' : (tile.cost ?? 0) <= 150 ? 'Standard' : (tile.cost ?? 0) <= 300 ? 'Premium' : 'Luxury'}
                                      </div>
                                    )}
                                  </div>
                                  {tile.quantity === 0 && userLevelValue >= category.minLevel && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full mt-auto bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300"
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
                                <p>A secret... come back during seasonal events!</p>
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
              <label className="text-sm font-medium text-zinc-300">Tile Category</label>
              <span className="text-xs text-zinc-500">Level {userLevelValue}</span>
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 hover:border-amber-500/50 text-white rounded-lg px-4 py-2.5 text-sm font-serif focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner cursor-pointer appearance-none pr-10 transition-colors"
                aria-label="Select Tile Category"
              >
                {tileCategories.map(category => {
                  const isUnlocked = userLevelValue >= category.minLevel;
                  return (
                    <option
                      key={category.id}
                      value={category.id}
                      className="bg-zinc-900 text-zinc-100 py-2"
                    >
                      {category.name} (Lvl {category.minLevel}-{category.maxLevel}){!isUnlocked ? ' 🔒 Preview' : ''}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-amber-500">
                <ChevronDown className="h-4 w-4 opacity-70" />
              </div>
            </div>
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
                      {userLevelValue < category.minLevel ? '🔒 Level Preview' : '📦 No tiles available'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {userLevelValue < category.minLevel
                        ? `Reach level ${category.minLevel} to buy these blueprints`
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
                                  "relative overflow-hidden transition-all duration-200 h-full flex flex-col",
                                  (tile.quantity === 0 || userLevelValue < category.minLevel) && "opacity-80 border-zinc-800",
                                  userLevelValue >= category.minLevel && "hover:scale-105",
                                  tile.quantity === 0 && userLevelValue >= category.minLevel && "border-2 border-amber-500 shadow-lg"
                                )}
                              >
                                <div className="aspect-square relative group">
                                  <Image
                                    src={getTileImage(tile.type)}
                                    alt={tile.name}
                                    fill
                                    className={cn(
                                      "object-cover transition-transform duration-200 group-hover:scale-110",
                                      userLevelValue < category.minLevel && "opacity-50 grayscale-[0.5]"
                                    )}
                                    unoptimized={true}
                                  />
                                  <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                    {tile.quantity}
                                  </div>
                                  {userLevelValue < category.minLevel && (
                                    <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 z-10 pointer-events-none">
                                      <span className="text-amber-200 text-xs font-bold bg-zinc-900/90 border border-amber-500/40 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                        🔒 Lvl {category.minLevel} Required
                                      </span>
                                    </div>
                                  )}
                                  {tile.quantity === 0 && userLevelValue >= category.minLevel && category.id !== 'rare' && (
                                    <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg" aria-label="Buyable tile badge">
                                      Buyable
                                    </span>
                                  )}
                                  {category.id === 'rare' && !tile.unlocked && (
                                    <div className="absolute inset-0 bg-zinc-950/60 flex items-center justify-center">
                                      <span className="text-white text-xs font-bold bg-purple-600 px-3 py-1 rounded-full">
                                        🔒 Seasonal Event
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="p-4 bg-gradient-to-b from-zinc-900 via-zinc-950 to-amber-950/20 border-t border-amber-900/30 flex-1 flex flex-col justify-between">
                                  <div>
                                    <div className="capitalize font-serif font-bold text-sm text-zinc-100 mb-1">{tile.name}</div>
                                    <div className="text-xs text-center mb-3">
                                      <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-zinc-950 border border-amber-500/40 text-amber-300 font-bold font-mono text-xs shadow-sm">
                                        🪙 {tile.cost ?? 0} Gold
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex gap-1.5 items-center justify-center mt-auto pt-2">
                                    {/* Stepper (- qty +) */}
                                    <div className="flex items-center bg-zinc-950 border border-amber-800/40 rounded-xl p-0.5 flex-1 min-h-[36px] justify-between">
                                      <button
                                        type="button"
                                        disabled={userLevelValue < category.minLevel || (buyQuantities[tile.type] || 1) <= 1}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuantityChange(tile.type, String(Math.max(1, (buyQuantities[tile.type] || 1) - 1)));
                                        }}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 font-extrabold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      >
                                        -
                                      </button>
                                      <span className="font-mono text-xs font-bold text-amber-200 px-1">
                                        {buyQuantities[tile.type] || 1}
                                      </span>
                                      <button
                                        type="button"
                                        disabled={userLevelValue < category.minLevel}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuantityChange(tile.type, String((buyQuantities[tile.type] || 1) + 1));
                                        }}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 font-extrabold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      >
                                        +
                                      </button>
                                    </div>

                                    {/* Confirm Checkmark Button */}
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={userLevelValue < category.minLevel}
                                      onClick={(e) => handleBuyTile(tile, e)}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 min-h-[36px] px-3 rounded-xl disabled:opacity-40 disabled:bg-zinc-800 disabled:text-zinc-400"
                                    >
                                      {userLevelValue < category.minLevel ? (
                                        <span className="flex items-center gap-1 text-xs font-bold">🔒 Lvl {category.minLevel}</span>
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            </TooltipTrigger>
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
                <p className="text-sm text-zinc-300">
                  Place buildings near specific tiles to boost their production! A &quot;✨&quot; icon will appear when you find a perfect spot.
                </p>
              </div>

              <div className="space-y-4">
                {/* Farm Synergy */}
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-100 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/farm-tile.webp" alt="Farm" width={40} height={40} className="object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Farm</h4>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1 mb-2">
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                        <span>Needs: <span className="text-blue-400 font-semibold">Water</span></span>
                      </div>
                      <p className="text-xs text-zinc-400 bg-zinc-950 p-2 rounded">
                        Boosts Gold production by <span className="text-green-400 font-bold">+20%</span> when placed next to a Water tile.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lumber Mill Synergy */}
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-800 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/lumber_mill-tile.webp" alt="Lumber Mill" width={40} height={40} className="object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Lumber Mill</h4>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1 mb-2">
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                        <span>Needs: <span className="text-green-500 font-semibold">Forest</span></span>
                      </div>
                      <p className="text-xs text-zinc-400 bg-zinc-950 p-2 rounded">
                        Boosts Gold production by <span className="text-green-400 font-bold">+20%</span> when placed next to a Forest tile.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Market Synergy */}
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-900 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/market-tile.webp" alt="Market" width={40} height={40} className="object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Market</h4>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1 mb-2">
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                        <span>Needs: <span className="text-yellow-200 font-semibold">Houses</span></span>
                      </div>
                      <p className="text-xs text-zinc-400 bg-zinc-950 p-2 rounded">
                        <span className="text-green-400 font-bold">+10% Gold</span> for EACH neighboring House, Mansion, or Cottage.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Castle Synergy */}
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-zinc-700 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/castle-tile.webp" alt="Castle" width={40} height={40} className="object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Castle</h4>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1 mb-2">
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                        <span>Needs: <span className="text-zinc-300 font-semibold">Space</span></span>
                      </div>
                      <p className="text-xs text-zinc-400 bg-zinc-950 p-2 rounded">
                        Looks majestic when surrounded by 4+ tiles (not on the edge).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Water Users (Well, Fountain, Fisherman) */}
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-900 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/fountain-tile.webp" alt="Fountain" width={40} height={40} className="object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Water Buildings</h4>
                      <div className="text-xs text-zinc-400 mb-1">
                        Includes: <span className="text-zinc-300">Fountain, Well, Fisherman</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1 mb-2">
                        <Droplets className="w-4 h-4 text-blue-400" />
                        <span>Needs: <span className="text-blue-400 font-semibold">Water</span></span>
                      </div>
                      <p className="text-xs text-zinc-400 bg-zinc-950 p-2 rounded">
                        <span className="text-green-400 font-bold">+20% Gold</span> when placed next to any Water tile.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Blacksmith Synergy */}
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-900 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/blacksmith-tile.webp" alt="Blacksmith" width={40} height={40} className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Blacksmith</h4>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1 mb-2">
                        <Mountain className="w-4 h-4 text-zinc-400" />
                        <span>Needs: <span className="text-red-500 font-semibold">Mountain / Lava</span></span>
                      </div>
                      <p className="text-xs text-zinc-400 bg-zinc-950 p-2 rounded">
                        <span className="text-green-400 font-bold">+25% Gold</span> when placed near Mountains or Lava for forge heat.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Commercial Synergy (Inn, Bakery, Grocery, Foodcourt) */}
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-700 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/inn-tile.webp" alt="Inn" width={40} height={40} className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Shops & Inns</h4>
                      <div className="text-xs text-zinc-400 mb-1">
                        Includes: <span className="text-zinc-300">Inn, Bakery, Grocery, Foodcourt</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1 mb-2">
                        <Home className="w-4 h-4 text-yellow-500" />
                        <span>Needs: <span className="text-yellow-200 font-semibold">Residents</span></span>
                      </div>
                      <p className="text-xs text-zinc-400 bg-zinc-950 p-2 rounded">
                        <span className="text-green-400 font-bold">+10% Gold</span> for EACH neighboring House, Mansion, or City.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Magic & Study (Library, Wizard) */}
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-purple-900 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/wizard-tile.webp" alt="Wizard" width={40} height={40} className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Magic & Study</h4>
                      <div className="text-xs text-zinc-400 mb-1">
                        Includes: <span className="text-zinc-300">Library, Wizard Tower</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1 mb-2">
                        <MapPin className="w-4 h-4 text-blue-300" />
                        <span>Needs: <span className="text-blue-300 font-semibold">Quiet (Ice / Mountain)</span></span>
                      </div>
                      <p className="text-xs text-zinc-400 bg-zinc-950 p-2 rounded">
                        <span className="text-green-400 font-bold">+30% Gold</span> when placed in secluded areas like Ice or Mountains.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Farming (Vegetables, Pumpkin Patch) */}
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-sm hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-800 p-2 rounded-lg shrink-0">
                      <Image src="/images/tiles/vegetables-tile.webp" alt="Vegetables" width={40} height={40} className="object-cover" unoptimized />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-200">Crops</h4>
                      <div className="text-xs text-zinc-400 mb-1">
                        Includes: <span className="text-zinc-300">Vegetables, Pumpkin Patch</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1 mb-2">
                        <Trees className="w-4 h-4 text-green-500" />
                        <span>Needs: <span className="text-green-600 font-semibold">Grass / Water</span></span>
                      </div>
                      <p className="text-xs text-zinc-400 bg-zinc-950 p-2 rounded">
                        <span className="text-green-400 font-bold">+15% Gold</span> on fertile Grass or near Water.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center space-y-2">
                  <Button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('open-apotheca-modal'));
                      }
                      toast.success("Opening Grand Apotheca Glasshouse...");
                    }}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-zinc-950 font-bold text-xs px-5 py-2 rounded-xl shadow-md gap-2 uppercase tracking-wider"
                  >
                    🧪 Brew Botanical Potions in Apotheca ✨
                  </Button>
                  <p className="text-xs text-amber-600 italic">
                    More synergies may be discovered as you level up!
                  </p>
                </div>

              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="guide" className="hidden">
          {/* Legacy: Guide moved to Kingdom Rewards page */}
        </TabsContent>
      </Tabs>
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
        <div className="w-full h-full bg-zinc-600">
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
      return <div className="w-full h-full bg-zinc-500"></div>;
  }
}