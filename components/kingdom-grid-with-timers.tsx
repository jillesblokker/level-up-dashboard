"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Tile, TileType } from '@/types/tiles'
import { cn } from '@/lib/utils'
import { KingdomPropertiesInventory } from './kingdom-properties-inventory'
import { Button } from '@/components/ui/button'
import { ArrowRightLeft, Clock, Grid, Lock, MoreVertical, Package, Plus, RotateCw, Sparkles, Trophy, Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from "@/components/ui/scroll-area"
import { KINGDOM_TILES, getRandomItem, getRandomGold, isLucky as isLuckyTile, getRarityColor } from '@/lib/kingdom-tiles'
import { KingdomTileModal } from './kingdom-tile-modal'
import { useToast } from '@/components/ui/use-toast'
import { getCharacterStats, updateCharacterStats } from '@/lib/character-stats-service'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { spendGold } from '@/lib/gold-manager'
import { CreatureLayer } from '@/components/creature-layer'
import { useWeather } from '@/hooks/use-weather'
import { TEXT_CONTENT } from '@/lib/text-content'
import { AnimatePresence } from 'framer-motion'
import { LuckyCelebration } from '@/components/lucky-celebration'

// Helper function to calculate level from experience
const calculateLevelFromExperience = (experience: number): number => {
  if (experience < 100) return 1
  if (experience < 300) return 2
  if (experience < 600) return 3
  if (experience < 1000) return 4
  if (experience < 1500) return 5
  if (experience < 2100) return 6
  if (experience < 2800) return 7
  if (experience < 3600) return 8
  if (experience < 4500) return 9
  if (experience < 5500) return 10
  return Math.floor(experience / 1000) + 1
}

interface KingdomGridWithTimersProps {
  grid: Tile[][]
  onTilePlace: (x: number, y: number, tile: Tile) => void
  selectedTile: Tile | null
  setSelectedTile: (tile: Tile | null) => void
  onGridExpand?: (newGrid: Tile[][]) => void
  onGridUpdate?: (newGrid: Tile[][]) => void
  onGoldEarned?: (amount: number) => void
  onItemFound?: (item: { image: string; name: string; type: string }) => void
  readOnly?: boolean
  onTileRemove?: (tileId: string) => void
  inventory?: any[]
  onMaterialSpend?: ((itemId: string, quantity: number) => void | Promise<void>) | undefined
}

interface TileTimer {
  x: number
  y: number
  tileId: string
  endTime: number
  isReady: boolean
}

export function KingdomGridWithTimers({
  grid,
  onTilePlace,
  selectedTile,
  setSelectedTile,
  onGridExpand,
  onGridUpdate,
  onGoldEarned,
  onItemFound,
  readOnly = false,
  onTileRemove,
  inventory = [],
  onMaterialSpend
}: KingdomGridWithTimersProps) {
  const { toast } = useToast()
  const { weather, getWeatherName, getWeatherDescription } = useWeather()
  const [tileTimers, setTileTimers] = useState<TileTimer[]>([])
  const [hoveredTile, setHoveredTile] = useState<{ x: number, y: number } | null>(null)
  const [movingTileSource, setMovingTileSource] = useState<{ x: number, y: number } | null>(null)

  // Helper to calculate placement score for hints
  const getPlacementHint = (x: number, y: number, tileType: string) => {
    const neighbors = [
      grid[y - 1]?.[x],
      grid[y + 1]?.[x],
      grid[y]?.[x - 1],
      grid[y]?.[x + 1]
    ].filter(Boolean);

    let score = 'average';
    let reason = '';

    if (tileType === 'farm') {
      if (neighbors.some(n => n?.type === 'water')) {
        score = 'good';
        reason = TEXT_CONTENT.kingdomGrid.placementHints.farm.good;
      } else {
        reason = TEXT_CONTENT.kingdomGrid.placementHints.farm.bad;
      }
    } else if (tileType === 'lumber_mill') {
      if (neighbors.some(n => n?.type === 'forest')) {
        score = 'good';
        reason = TEXT_CONTENT.kingdomGrid.placementHints.lumber_mill.good;
      } else {
        reason = TEXT_CONTENT.kingdomGrid.placementHints.lumber_mill.bad;
      }
    } else if (tileType === 'market') {
      const houseCount = neighbors.filter(n =>
        n?.type === 'house' || n?.type === 'mansion' || n?.type === 'cottage'
      ).length;
      if (houseCount > 0) {
        score = 'good';
        reason = TEXT_CONTENT.kingdomGrid.placementHints.market.good.replace('{percent}', (10 * houseCount).toString());
      } else {
        reason = TEXT_CONTENT.kingdomGrid.placementHints.market.bad;
      }
    } else if (tileType === 'castle') {
      const hasSpace = neighbors.length >= 4;
      if (hasSpace) {
        score = 'good';
        reason = TEXT_CONTENT.kingdomGrid.placementHints.castle.good;
      } else {
        reason = TEXT_CONTENT.kingdomGrid.placementHints.castle.bad;
      }
    } else if (tileType === 'well' || tileType === 'fountain' || tileType === 'fisherman') {
      if (neighbors.some(n => n?.type === 'water')) {
        score = 'good';
        reason = TEXT_CONTENT.kingdomGrid.placementHints.waterBuildings.good;
      } else {
        reason = TEXT_CONTENT.kingdomGrid.placementHints.waterBuildings.bad;
      }
    } else if (tileType === 'blacksmith') {
      if (neighbors.some(n => n?.type === 'mountain' || n?.type === 'lava')) {
        score = 'good';
        reason = TEXT_CONTENT.kingdomGrid.placementHints.blacksmith.good;
      } else {
        reason = TEXT_CONTENT.kingdomGrid.placementHints.blacksmith.bad;
      }
    } else if (tileType === 'sawmill') {
      if (neighbors.some(n => n?.type === 'forest')) {
        score = 'good';
        reason = TEXT_CONTENT.kingdomGrid.placementHints.sawmill.good;
      } else {
        reason = TEXT_CONTENT.kingdomGrid.placementHints.sawmill.bad;
      }
    } else if (tileType === 'library' || tileType === 'wizard') {
      if (neighbors.some(n => n?.type === 'ice' || n?.type === 'mountain')) {
        score = 'good';
        reason = TEXT_CONTENT.kingdomGrid.placementHints.magic.good;
      } else {
        reason = TEXT_CONTENT.kingdomGrid.placementHints.magic.bad;
      }
    } else if (['inn', 'bakery', 'grocery', 'foodcourt'].includes(tileType)) {
      const residentCount = neighbors.filter(n =>
        n?.type === 'house' || n?.type === 'mansion' || n?.type === 'cottage' || n?.type === 'town' || n?.type === 'city'
      ).length;
      if (residentCount > 0) {
        score = 'good';
        reason = TEXT_CONTENT.kingdomGrid.placementHints.commercial.good.replace('{percent}', (10 * residentCount).toString());
      } else {
        reason = TEXT_CONTENT.kingdomGrid.placementHints.commercial.bad;
      }
    } else if (['vegetables', 'pumpkin_patch'].includes(tileType)) {
      if (neighbors.some(n => n?.type === 'water' || n?.type === 'grass')) {
        score = 'good';
        reason = TEXT_CONTENT.kingdomGrid.placementHints.crops.good;
      } else {
        reason = TEXT_CONTENT.kingdomGrid.placementHints.crops.bad;
      }
    } else {
      // Default for other buildings
      reason = TEXT_CONTENT.kingdomGrid.placementHints.default.replace('{tile}', tileType.replace('_', ' '));
    }

    return { score, reason };
    return { score, reason };
  };

  // Helper to calculate exact adjacency bonus multiplier
  const calculateAdjacencyBonus = (x: number, y: number, tileType: string): number => {
    const neighbors = [
      grid[y - 1]?.[x],
      grid[y + 1]?.[x],
      grid[y]?.[x - 1],
      grid[y]?.[x + 1]
    ].filter(Boolean);

    let bonus = 0;

    if (tileType === 'farm' && neighbors.some(n => n?.type === 'water')) {
      bonus = 0.2;
    } else if (tileType === 'lumber_mill' && neighbors.some(n => n?.type === 'forest')) {
      bonus = 0.2;
    } else if (tileType === 'market') {
      const houseCount = neighbors.filter(n =>
        n?.type === 'house' || n?.type === 'mansion' || n?.type === 'cottage'
      ).length;
      bonus = 0.1 * houseCount;
    } else if (['well', 'fountain', 'fisherman'].includes(tileType) && neighbors.some(n => n?.type === 'water')) {
      bonus = 0.2; // +20% next to water
    } else if (tileType === 'blacksmith' && neighbors.some(n => n?.type === 'mountain' || n?.type === 'lava')) {
      bonus = 0.25;
    } else if (tileType === 'sawmill' && neighbors.some(n => n?.type === 'forest')) {
      bonus = 0.2;
    } else if (['library', 'wizard'].includes(tileType) && neighbors.some(n => n?.type === 'ice' || n?.type === 'mountain')) {
      bonus = 0.3;
    } else if (['inn', 'bakery', 'grocery', 'foodcourt'].includes(tileType)) {
      const residentCount = neighbors.filter(n =>
        n?.type === 'house' || n?.type === 'mansion' || n?.type === 'cottage' || n?.type === 'town' || n?.type === 'city'
      ).length;
      bonus = 0.1 * residentCount;
    } else if (['vegetables', 'pumpkin_patch'].includes(tileType) && neighbors.some(n => n?.type === 'water' || n?.type === 'grass')) {
      bonus = 0.15;
    }

    return 1 + bonus;
  };
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState<{
    tileName: string
    goldEarned: number
    itemFound?: {
      image: string
      name: string
      type: string
    } | undefined
    isLucky: boolean
    message: string
  } | null>(null)

  // State for lucky celebration
  const [luckyCelebrationAmount, setLuckyCelebrationAmount] = useState<number | null>(null)

  // Add missing state for expand functionality
  const [propertiesOpen, setPropertiesOpen] = useState(false)
  const [selectedInventoryTile, setSelectedInventoryTile] = useState<typeof propertyInventory[0] | null>(null)
  const [propertyTab, setPropertyTab] = useState<'place' | 'buy'>('place')
  const [kingdomExpansions, setKingdomExpansions] = useState(0)
  const [buildTokens, setBuildTokens] = useState(0)
  const [playerLevel, setPlayerLevel] = useState(1)
  // Seasonal event flags
  const [winterFestivalActive, setWinterFestivalActive] = useState(false)
  const [harvestFestivalActive, setHarvestFestivalActive] = useState(false)
  // Tiles affected by winter event bonus
  const WINTER_EVENT_TILE_IDS = new Set([
    'winter-fountain',
    'snowy-inn',
    'ice-sculpture',
    'fireworks-stand'
  ])
  // Tiles affected by harvest event bonus
  const HARVEST_EVENT_TILE_IDS = new Set([
    'harvest-barn',
    'pumpkin-patch',
    'bakery',
    'brewery'
  ])

  // Small retry helper to mitigate early auth token races
  const fetchAuthRetry = async (input: RequestInfo | URL, init?: RequestInit, attempts: number = 2): Promise<Response> => {
    let lastError: any = null
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetchWithAuth(input, init)
        if (res && res.ok) return res
        if (res && (res.status === 401 || res.status === 403) && i < attempts - 1) {
          await new Promise(r => setTimeout(r, 250))
          continue
        }
        return res
      } catch (e) {
        lastError = e
        if (i < attempts - 1) await new Promise(r => setTimeout(r, 250))
      }
    }
    throw lastError || new Error('Request failed')
  }

  // Load kingdom expansions from Supabase on mount
  useEffect(() => {
    (async () => {
      try {
        const { getCharacterStats } = await import('@/lib/character-stats-service')
        const stats = getCharacterStats()
        setKingdomExpansions(stats.kingdom_expansions || 0)
      } catch {
        setKingdomExpansions(0)
      }
    })()
  }, [])

  // Load build tokens from Supabase on mount
  useEffect(() => {
    (async () => {
      try {
        const { getCharacterStats } = await import('@/lib/character-stats-service')
        const stats = getCharacterStats()
        setBuildTokens(stats.build_tokens || 0)
      } catch {
        setBuildTokens(0)
      }
    })()
  }, [])

  // Calculate player level and expansion requirements
  useEffect(() => {
    const stats = getCharacterStats()
    const currentLevel = calculateLevelFromExperience(stats.experience || 0)
    setPlayerLevel(currentLevel)
  }, [])

  // Load simple event flags from game settings (per-user)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAuthRetry('/api/game-settings?key=winter_festival_active', { method: 'GET' })
        if (res && res.ok) {
          const json = await res.json()
          const valueRaw = json?.data?.[0]?.setting_value
          const normalized = String(valueRaw).toLowerCase().trim()
          setWinterFestivalActive(normalized === 'true' || normalized === '1' || normalized === 'yes')
        }
      } catch {
        // ignore; default remains false
      }
    })()
  }, [])

  // Load simple event flags from game settings (per-user)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAuthRetry('/api/game-settings?key=harvest_festival_active', { method: 'GET' })
        if (res && res.ok) {
          const json = await res.json()
          const valueRaw = json?.data?.[0]?.setting_value
          const normalized = String(valueRaw).toLowerCase().trim()
          setHarvestFestivalActive(normalized === 'true' || normalized === '1' || normalized === 'yes')
        }
      } catch {
        // ignore; default remains false
      }
    })()
  }, [])

  // Listen for event flag changes from stored data page
  useEffect(() => {
    const handleWinterFestivalToggle = (event: CustomEvent) => {
      setWinterFestivalActive(event.detail.active);
    };

    const handleHarvestFestivalToggle = (event: CustomEvent) => {
      setHarvestFestivalActive(event.detail.active);
    };

    // Immediately fetch current event flag values from database
    const fetchCurrentEventFlags = async () => {
      try {
        // Fetch winter festival status
        const winterResponse = await fetchWithAuth('/api/game-settings?key=winter_festival_active');
        if (winterResponse.ok) {
          const winterData = await winterResponse.json();
          const winterValue = winterData?.data?.data?.[0]?.setting_value;
          if (winterValue !== undefined) {
            const normalized = String(winterValue).toLowerCase();
            const isActive = normalized === 'true' || normalized === '1' || normalized === 'yes';
            setWinterFestivalActive(isActive);
          }
        }

        // Fetch harvest festival status
        const harvestResponse = await fetchWithAuth('/api/game-settings?key=harvest_festival_active');
        if (harvestResponse.ok) {
          const harvestData = await harvestResponse.json();
          const harvestValue = harvestData?.data?.data?.[0]?.setting_value;
          if (harvestValue !== undefined) {
            const normalized = String(harvestValue).toLowerCase();
            const isActive = normalized === 'true' || normalized === '1' || normalized === 'yes';
            setHarvestFestivalActive(isActive);
          }
        }
      } catch (error) {
        console.error('[Kingdom] Error fetching event flags:', error);
      }
    };

    // Fetch current values and set up event listeners
    fetchCurrentEventFlags();

    window.addEventListener('winter-festival-toggled', handleWinterFestivalToggle as EventListener);
    window.addEventListener('harvest-festival-toggled', handleHarvestFestivalToggle as EventListener);

    return () => {
      window.removeEventListener('winter-festival-toggled', handleWinterFestivalToggle as EventListener);
      window.removeEventListener('harvest-festival-toggled', handleHarvestFestivalToggle as EventListener);
    };
  }, []);

  // Calculate if kingdom can be expanded
  const nextExpansionLevel = 5 + kingdomExpansions * 5
  const canExpand = playerLevel >= nextExpansionLevel

  // Expand kingdom grid function
  const expandKingdomGrid = () => {
    // Removed debugging logs

    if (!canExpand) {
      toast({
        title: TEXT_CONTENT.kingdomGrid.expansion.locked.title,
        description: TEXT_CONTENT.kingdomGrid.expansion.locked.description
          .replace('{level}', nextExpansionLevel.toString())
          .replace('{current}', playerLevel.toString()),
        variant: 'destructive',
      });
      return;
    }

    const currentRows = grid.length;
    const currentCols = grid[0]?.length || 6;
    const newRows = currentRows + 3;

    // Create new grid with 3 additional rows
    const newGrid: Tile[][] = [];

    // Add existing rows
    for (let y = 0; y < currentRows; y++) {
      const currentRow = grid[y];
      if (currentRow && Array.isArray(currentRow)) {
        newGrid[y] = [...currentRow];
      }
    }

    // Add 3 new rows with vacant tiles
    for (let y = currentRows; y < newRows; y++) {
      newGrid[y] = new Array(currentCols);
      for (let x = 0; x < currentCols; x++) {
        newGrid[y]![x] = {
          id: `vacant-${x}-${y}`,
          name: TEXT_CONTENT.kingdomGrid.expansion.vacantTile.name,
          description: TEXT_CONTENT.kingdomGrid.expansion.vacantTile.description,
          type: 'vacant',
          image: '/images/kingdom-tiles/Vacant.png',
          cost: 0,
          quantity: 0,
          x,
          y,
          connections: [],
          rotation: 0,
          revealed: true,
          isVisited: false,
          ariaLabel: 'Vacant tile'
        };
      }
    }

    // Update expansion count
    setKingdomExpansions((prev: number) => {
      const newVal = prev + 1;
      import('@/lib/character-stats-service').then(({ updateCharacterStats }) => {
        updateCharacterStats({ kingdom_expansions: newVal }, 'kingdom-expansion');
      });
      return newVal;
    });

    // Call the callback to update the parent component's grid
    if (onGridExpand) {
      onGridExpand(newGrid);
    }

    toast({
      title: TEXT_CONTENT.kingdomGrid.expansion.success.title,
      description: TEXT_CONTENT.kingdomGrid.expansion.success.description,
    });
  };

  // Load build tokens from character stats
  useEffect(() => {
    const loadBuildTokens = async () => {
      try {
        // First try to get from localStorage
        const stats = getCharacterStats();
        setBuildTokens(stats.build_tokens || 0);

        // Then try to fetch fresh data from API (with smart rate limiting)
        const { fetchFreshCharacterStats } = await import('@/lib/character-stats-service');
        const freshStats = await fetchFreshCharacterStats();
        if (freshStats) {
          console.log('[Kingdom] Fresh stats loaded, build tokens:', freshStats.build_tokens);
          setBuildTokens(freshStats.build_tokens || 0);
        }
      } catch (error) {
        console.warn('[Kingdom] Failed to load build tokens:', error);
        // Fallback to localStorage
        try {
          const stats = getCharacterStats();
          setBuildTokens(stats.build_tokens || 0);
        } catch {
          setBuildTokens(0);
        }
      }
    };

    loadBuildTokens();

    // Listen for character stats updates
    const handleStatsUpdate = () => {
      loadBuildTokens();
    };

    window.addEventListener('character-stats-update', handleStatsUpdate);

    return () => {
      window.removeEventListener('character-stats-update', handleStatsUpdate);
    };
  }, []);

  // Kingdom tile inventory for properties panel - dynamically loaded from KINGDOM_TILES source of truth
  const [propertyInventory, setPropertyInventory] = useState(() => {
    // Metadata for UI categorization and locking
    const METADATA: Record<string, { category: string, levelRequired: number, isSeasonal?: boolean, eventType?: string }> = {
      // Basic
      house: { category: 'basic', levelRequired: 1 },
      well: { category: 'basic', levelRequired: 1 },
      pond: { category: 'basic', levelRequired: 1 },
      vegetables: { category: 'basic', levelRequired: 1 },

      // Commerce
      'market-stalls': { category: 'commerce', levelRequired: 1 },
      grocery: { category: 'commerce', levelRequired: 1 },
      bakery: { category: 'commerce', levelRequired: 1, isSeasonal: true, eventType: 'harvest' },
      brewery: { category: 'commerce', levelRequired: 2, isSeasonal: true, eventType: 'harvest' },

      // Production
      blacksmith: { category: 'production', levelRequired: 1 },
      sawmill: { category: 'production', levelRequired: 2 },
      windmill: { category: 'production', levelRequired: 2 },
      stable: { category: 'production', levelRequired: 1 },
      'harvest-barn': { category: 'production', levelRequired: 2, isSeasonal: true, eventType: 'harvest' },

      // Entertainment
      inn: { category: 'entertainment', levelRequired: 1 },
      'snowy-inn': { category: 'entertainment', levelRequired: 1, isSeasonal: true, eventType: 'winter' },
      foodcourt: { category: 'entertainment', levelRequired: 2 },
      'training-grounds': { category: 'entertainment', levelRequired: 2 },
      'jousting': { category: 'entertainment', levelRequired: 3 },
      'fireworks-stand': { category: 'entertainment', levelRequired: 1, isSeasonal: true, eventType: 'winter' },

      // Special / Seasonal
      'pumpkin-patch': { category: 'basic', levelRequired: 1, isSeasonal: true, eventType: 'harvest' },
      'winter-fountain': { category: 'basic', levelRequired: 1, isSeasonal: true, eventType: 'winter' },
      'ice-sculpture': { category: 'basic', levelRequired: 1, isSeasonal: true, eventType: 'winter' },

      // Advanced
      library: { category: 'advanced', levelRequired: 3 },
      temple: { category: 'advanced', levelRequired: 3 },
      fountain: { category: 'advanced', levelRequired: 2 },
      archery: { category: 'advanced', levelRequired: 2 },
      watchtower: { category: 'advanced', levelRequired: 3 },

      // Prestige
      mansion: { category: 'prestige', levelRequired: 4 },
      mayor: { category: 'prestige', levelRequired: 5 },
      castle: { category: 'prestige', levelRequired: 5 },
      wizard: { category: 'prestige', levelRequired: 4 },
    };

    return KINGDOM_TILES.map(tile => {
      const meta = METADATA[tile.id] || { category: 'misc', levelRequired: 1 };
      return {
        id: tile.id,
        name: tile.name,
        image: tile.image,
        cost: tile.cost || 0,
        tokenCost: tile.tokenCost,
        materialCost: tile.materialCost,
        levelRequired: meta.levelRequired,
        costType: 'gold', // Default identifier, actual logic handled by components
        quantity: 0,
        isSeasonal: meta.isSeasonal || false,
        eventType: meta.eventType,
        category: meta.category
      };
    });
  });


  // Property placement state
  const [selectedProperty, setSelectedProperty] = useState<typeof propertyInventory[0] | null>(null)
  const [placementMode, setPlacementMode] = useState(false)

  // Filter properties based on event status
  const getAvailableProperties = () => {
    const available = propertyInventory.filter(property => {
      if (!property.isSeasonal) {
        return true; // Always show non-seasonal properties
      }

      if (property.eventType === 'winter') {
        return winterFestivalActive;
      }

      if (property.eventType === 'harvest') {
        return harvestFestivalActive;
      }

      return false; // Hide seasonal properties when their event is inactive
    });

    return available;
  };


  // Check if player can place a property
  const canPlaceProperty = (property: typeof propertyInventory[0]) => {
    if (property.costType === 'build-token') {
      return (property.quantity || 0) > 0 && playerLevel >= property.levelRequired
    }

    return false
  }

  // Handle property selection for placement
  const handlePropertySelect = (property: typeof propertyInventory[0]) => {
    if (!canPlaceProperty(property)) {
      let errorMessage = ''
      if (property.costType === 'build-token') {
        if ((property.quantity || 0) <= 0) {
          errorMessage = `You don't own any ${property.name}. Buy one first!`
        } else {
          errorMessage = `You need level ${property.levelRequired} to place ${property.name}.`
        }
      }

      toast({
        title: 'Cannot Place Property',
        description: errorMessage,
        variant: 'destructive',
      });
      return;
    }

    setSelectedProperty(property)
    setPlacementMode(true)
    setPropertiesOpen(false)

    toast({
      title: 'Property Selected',
      description: `Click on a vacant tile to place ${property.name}. Press ESC to cancel.`,
    });
  }

  // Handle buying properties
  const handleBuyProperty = async (property: typeof propertyInventory[0], method: 'gold' | 'materials' | 'tokens' = 'tokens') => {
    console.log('[Kingdom] handleBuyProperty called for:', property.name, 'Cost:', property.cost, 'Method:', method);

    if (method === 'tokens') {
      // Properties should cost build tokens
      if (property.costType !== 'build-token') {
        // Just log warning, allow existing flow if valid
      }

      if ((buildTokens || 0) < (property.tokenCost || 1)) {
        toast({
          title: "Not Enough Tokens",
          description: `You need ${property.tokenCost || 1} Build Token(s) to place this.`,
          variant: "destructive"
        });
        return;
      }

      // Token deduction handled on placement or assumed pre-deducted
      // Original logic just allowed placement if tokens existed.
      // We'll keep it as "Unlock to Place".

    } else if (method === 'gold') {
      if (!property.cost) {
        toast({ title: "Error", description: "This item cannot be bought with Gold." });
        return;
      }

      const success = await spendGold(property.cost, `buy-property:${property.id}`);
      if (!success) {
        toast({ title: "Insufficient Gold", description: `You need ${property.cost} Gold.`, variant: "destructive" });
        return;
      }

      toast({ title: "Purchased!", description: `Bought ${property.name} for ${property.cost} Gold.` });

      // Emit event to update inventory UI
      window.dispatchEvent(new Event('character-inventory-update'));

      // We rely on the parent/reload to update the "Owned" count, 
      // but for immediate feedback we can optimistically update propertyInventory?
      // Since propertyInventory is derived from constant + stats, hard to update.
      // User can now find it in 'Place' tab once inventory refreshes.
      // We'll switch tab to 'place' to hint user?
      // setPropertyTab('place'); // Not available in this context? 
      // Actually KingdomPropertiesInventory manages its own tab state.
      return;

    } else if (method === 'materials') {
      if (!property.materialCost) return;

      const missing = property.materialCost.filter(mat => {
        const invItem = inventory.find(i => i.id === mat.itemId || i.name.toLowerCase() === mat.itemId.replace('material-', '').toLowerCase());
        return !invItem || invItem.quantity < mat.quantity;
      });

      if (missing.length > 0) {
        toast({
          title: "Insufficient Materials",
          description: `Missing: ${missing.map(m => `${m.quantity} ${m.itemId.replace('material-', '')}`).join(', ')}`,
          variant: "destructive"
        });
        return;
      }

      if (onMaterialSpend) {
        property.materialCost.forEach(mat => onMaterialSpend(mat.itemId, mat.quantity));
        toast({ title: "Construction Started", description: `Materials used to build ${property.name}.` });

        // Trigger inventory update
        window.dispatchEvent(new Event('character-inventory-update'));
      } else {
        console.warn('onMaterialSpend callback missing');
      }
      return;
    }

    // Common Placement Logic (only for Tokens or if we want auto-placement for others)
    // For Gold/Materials, we just purchased it into inventory.
    if (method !== 'tokens') return;

    // Store the source position and start placement mode WITHOUT removing old tile yet
    setMovingTileSource(null);

    // Select it for placement directly, bypassing quantity checks
    setSelectedProperty(property);
    setPlacementMode(true);
    setPropertiesOpen(false);

    toast({
      title: "Placement Mode",
      description: `Select a location for ${property.name}. Press ESC to cancel.`,
    });
  };

  // Handle property placement on grid
  const handlePropertyPlacement = (x: number, y: number) => {
    // Removed debugging log

    if (!selectedProperty || !placementMode) {
      // Removed debugging log
      return
    }

    const targetTile = grid[y]?.[x]
    // Removed debugging log

    // Allow placement on vacant tiles OR if we are moving to the same spot (effectively resetting)
    const isMovingToSource = movingTileSource && movingTileSource.x === x && movingTileSource.y === y;

    if (!targetTile || ((targetTile.type !== 'vacant' && targetTile.type !== 'empty') && !isMovingToSource)) {
      toast({
        title: 'Invalid Placement',
        description: 'You can only place properties on vacant tiles.',
        variant: 'destructive',
      });
      return
    }

    // Create the new kingdom tile
    const newTile: Tile = {
      id: isMovingToSource && targetTile.id ? targetTile.id : `${selectedProperty.id}-${x}-${y}`,
      name: selectedProperty.name,
      description: `A ${selectedProperty.name.toLowerCase()} building`,
      type: selectedProperty.id as TileType,
      image: selectedProperty.image,
      cost: 0,
      quantity: 0,
      x,
      y,
      connections: [],
      rotation: 0,
      revealed: true,
      isVisited: false,
      ariaLabel: `${selectedProperty.name} tile`
    }

    // IMPORTANT: Update the local grid state directly instead of using onTilePlace
    // This prevents the property from being treated as an inventory item
    const updatedGrid = grid.map(row => row.slice())

    // If we are moving, clear the OLD spot first (unless it's the same spot)
    if (movingTileSource && !isMovingToSource) {
      const srcY = movingTileSource.y;
      const srcX = movingTileSource.x;
      if (updatedGrid[srcY] && updatedGrid[srcY][srcX]) {
        updatedGrid[srcY][srcX] = {
          ...updatedGrid[srcY][srcX],
          type: 'vacant',
          name: 'Vacant Plot',
          image: 'Vacant.png',
          id: updatedGrid[srcY][srcX]?.id || `vacant-${srcX}-${srcY}`,
          description: 'A vacant plot ready for building.',
          connections: [],
          rotation: 0
        } as Tile;
      }
    }

    if (updatedGrid[y]) {
      updatedGrid[y][x] = newTile
      // Removed debugging log
    }

    // Update the parent component's grid using the callback
    if (onGridUpdate) {
      // Removed debugging log
      onGridUpdate(updatedGrid)
    } else {
      // Removed debugging log
    }

    // Decrease property quantity ONLY if NOT moving
    if (!movingTileSource && selectedProperty.costType === 'build-token') {
      const updatedInventory = propertyInventory.map(p =>
        p.id === selectedProperty.id ? { ...p, quantity: Math.max(0, (p.quantity || 0) - 1) } : p
      )
      setPropertyInventory(updatedInventory)
        // Persist inventory decrement
        ; (async () => {
          try {
            const url = `/api/tile-inventory?tileId=${encodeURIComponent(selectedProperty.id)}&quantity=1`
            await fetchAuthRetry(url, { method: 'DELETE' })
          } catch (e) {
            console.warn('[Kingdom] Failed to decrement inventory', e)
          }
        })()
    }

    // Start timer for the new property based on reward value (only if new place, or maybe preserve timer if moved?)
    // For now, restarting timer is acceptable for "Moving" as penalty/reset, unless we want to preserve it.
    // Preserving timer would require reading old timer state. 
    // Let's restart for simplicity as per original implementation, unless requested otherwise.
    const kingdomTile = KINGDOM_TILES.find(kt => kt.id === selectedProperty.id.toLowerCase())

    // Only create timer if the tile has a timer duration > 0 (i.e. it produces passive rewards)
    if (kingdomTile && kingdomTile.timerMinutes > 0) {
      const timerDuration = kingdomTile.timerMinutes * 60 * 1000

      const newTimer: TileTimer = {
        x,
        y,
        tileId: newTile.id,
        endTime: Date.now() + timerDuration,
        isReady: false
      }

      // If we are moving, we should remove the OLD timer
      let finalTimers = [...tileTimers];
      if (movingTileSource) {
        finalTimers = finalTimers.filter(t => t.x !== movingTileSource.x || t.y !== movingTileSource.y)
      }

      // Add new timer
      finalTimers = [...finalTimers, newTimer];

      setTileTimers(finalTimers)
        // Persist timer to API
        ; (async () => {
          try {
            const endIso = new Date(newTimer.endTime).toISOString()
            // If moved, we might want to delete old timer record too? 
            // The API might handle it by x/y overwrite if we just write the new one.
            // But the OLD x/y still has a timer record? Ideally we should delete it.
            if (movingTileSource && !isMovingToSource) {
              // We don't have a direct delete-timer API endpoint exposed easily here, 
              // but we can overwrite it with "vacant" or just let it rot? 
              // Or better, since the tile type at old X,Y is now Vacant, the timer won't be used.
              // We can rely on that.
            }

            await fetchAuthRetry('/api/property-timers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tileId: newTile.id, x, y, tileType: newTile.type, endTime: endIso, isReady: false })
            })
          } catch (e) {
            console.warn('[Kingdom] Failed to persist timer', e)
          }
        })()
    } else if (movingTileSource) {
      // If we moved a non-timer tile (like a road), we still need to remove any stray timer at the old location/new location
      // though roads shouldn't have timers usually.
      // But just to be safe and clean up if we are moving:
      setTileTimers(prev => prev.filter(t => t.x !== movingTileSource.x || t.y !== movingTileSource.y))
    }

    // Reset placement mode
    setSelectedProperty(null)
    setPlacementMode(false)
    setMovingTileSource(null) // Clear moving state

    toast({
      title: 'Property Placed!',
      description: `${selectedProperty.name} has been successfully placed on your kingdom!`,
    });
  }

  // Handle ESC key to cancel placement
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && placementMode) {
        setSelectedProperty(null)
        setPlacementMode(false)
        setMovingTileSource(null) // Clear moving state if present
        toast({
          title: 'Placement Cancelled',
          description: 'Property placement has been cancelled.',
        });
      }
    }

    if (placementMode) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }

    // Return undefined when not in placement mode
    return undefined
  }, [placementMode])

  // Load timers from API (fallback to localStorage) on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAuthRetry('/api/property-timers', { method: 'GET' })
        if (res.ok) {
          const json = await res.json()
          const timers = (json?.data || []).map((t: any) => ({
            x: t.x,
            y: t.y,
            tileId: t.tile_id,
            endTime: typeof t.end_time === 'string' ? new Date(t.end_time).getTime() : t.end_time,
            isReady: !!t.is_ready,
          }))
          setTileTimers(timers)
          return
        }
      } catch { }
      // Fallback to localStorage
      try {
        const savedTimers = localStorage.getItem('kingdom-tile-timers')
        if (savedTimers) setTileTimers(JSON.parse(savedTimers))
      } catch { }
    })()
  }, [])

  // Save timers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('kingdom-tile-timers', JSON.stringify(tileTimers))
  }, [tileTimers])

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTileTimers(prev =>
        prev.map(timer => {
          const now = Date.now()
          const isReady = now >= timer.endTime
          return { ...timer, isReady }
        })
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Initialize timers for existing kingdom tiles on mount
  useEffect(() => {
    // Only run this once on mount when tileTimers is empty
    if (tileTimers.length === 0) {
      const newTimers: TileTimer[] = []

      grid.forEach((row, y) => {
        row.forEach((tile, x) => {
          if (tile && tile.type !== 'empty' && tile.type !== 'vacant') {
            const kingdomTile = KINGDOM_TILES.find(kt => kt.id === tile.type.toLowerCase())
            if (kingdomTile && kingdomTile.timerMinutes > 0) {
              // Create timer for existing tile
              const endTime = Date.now() + (kingdomTile.timerMinutes * 60 * 1000)
              newTimers.push({
                x,
                y,
                tileId: kingdomTile.id,
                endTime,
                isReady: false
              })
            }
          }
        })
      })

      if (newTimers.length > 0) {
        console.log('[Kingdom] Initializing timers for', newTimers.length, 'existing tiles')
        setTileTimers(newTimers)

          // Persist these initial timers to the database
          ; (async () => {
            try {
              for (const timer of newTimers) {
                const endIso = new Date(timer.endTime).toISOString()
                await fetchAuthRetry('/api/property-timers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tileId: timer.tileId,
                    x: timer.x,
                    y: timer.y,
                    tileType: timer.tileId,
                    endTime: endIso,
                    isReady: false
                  })
                })
              }
              console.log('[Kingdom] Successfully persisted initial timers to database')
            } catch (e) {
              console.warn('[Kingdom] Failed to persist initial timers:', e)
            }
          })()
      }
    }
  }, []) // Empty dependency array - only run on mount

  // Update tile click handler to support property placement
  const handleTileClick = (x: number, y: number, tile: Tile) => {
    if (readOnly) return;
    // Removed debugging log

    // If in placement mode, handle property placement
    if (placementMode && selectedProperty) {
      handlePropertyPlacement(x, y)
      return
    }

    // Handle property tiles (archery, blacksmith, etc.)
    if (tile.type && (tile.type === 'archery' || tile.type === 'blacksmith' || tile.type === 'sawmill' ||
      tile.type === 'fisherman' || tile.type === 'grocery' || tile.type === 'foodcourt' ||
      tile.type === 'well' || tile.type === 'windmill' || tile.type === 'castle' ||
      tile.type === 'fountain' || tile.type === 'house' || tile.type === 'inn' ||
      tile.type === 'jousting' || tile.type === 'mansion' || tile.type === 'mayor')) {

      // Check if tile is ready
      const timer = tileTimers.find(t => t.x === x && t.y === y)
      if (!timer) {
        toast({
          title: 'Property Not Ready',
          description: 'This property is still producing. Wait for the timer to finish.',
          variant: 'destructive',
        });
        return
      }

      // Calculate if timer is actually ready (real-time check)
      const now = Date.now()
      const isReady = now >= timer.endTime

      if (!isReady) {
        toast({
          title: 'Property Not Ready',
          description: 'This property is still producing. Wait for the timer to finish.',
          variant: 'destructive',
        });
        return
      }

      // Find the kingdom tile definition
      const kingdomTile = KINGDOM_TILES.find(kt => kt.id === tile.type.toLowerCase())
      if (!kingdomTile) return

      // Generate rewards
      const wasLucky = isLuckyTile(kingdomTile.luckyChance)
      let goldEarned = wasLucky ? kingdomTile.luckyGoldAmount : getRandomGold(...kingdomTile.normalGoldRange)
      // Apply winter event bonus where applicable
      if (winterFestivalActive && WINTER_EVENT_TILE_IDS.has(kingdomTile.id)) {
        goldEarned = Math.floor(goldEarned * 1.2)
      }
      // Apply harvest event bonus where applicable
      if (harvestFestivalActive && HARVEST_EVENT_TILE_IDS.has(kingdomTile.id)) {
        goldEarned = Math.floor(goldEarned * 1.2)
      }
      // Grant experience proportional to gold; apply winter +10% EXP on winter tiles
      const baseExperience = wasLucky ? Math.ceil(goldEarned * 0.5) : Math.ceil(goldEarned * 0.3)
      const experienceAwarded = (winterFestivalActive && WINTER_EVENT_TILE_IDS.has(kingdomTile.id))
        ? Math.ceil(baseExperience * 1.1)
        : (harvestFestivalActive && HARVEST_EVENT_TILE_IDS.has(kingdomTile.id))
          ? Math.ceil(baseExperience * 1.1)
          : baseExperience

        // Award gold and experience
        ; (async () => {
          try {
            const { gainGold } = await import('@/lib/gold-manager')
            const { gainExperience } = await import('@/lib/experience-manager')
            // Award gold and experience
            gainGold(goldEarned, `tile-collect:${kingdomTile.id}`)
            gainExperience(experienceAwarded, `tile-collect:${kingdomTile.id}`, 'general')
          } catch { }
        })()
        // Basic telemetry: log collect
        ; (async () => {
          try {
            await fetchAuthRetry('/api/kingdom-events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tileId: kingdomTile.id, wasLucky, goldEarned, experienceAwarded })
            })
          } catch { }
        })()
      const itemFound = kingdomTile.possibleItems.length > 0 ? getRandomItem(kingdomTile.possibleItems) : null

      // Update timer to restart production
      const newEndTime = Date.now() + (kingdomTile.timerMinutes * 60 * 1000)
      setTileTimers(prev =>
        prev.map(t =>
          t.x === x && t.y === y
            ? { ...t, endTime: newEndTime, isReady: false }
            : t
        )
      )

        // Persist timer restart
        ; (async () => {
          try {
            const endIso = new Date(newEndTime).toISOString()
            await fetchAuthRetry('/api/property-timers', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ x, y, isReady: false, endTime: endIso })
            })

            // Dispatch event to notify other components (like notification manager)
            console.log('[Kingdom] Dispatching kingdom-building-collected event for tile at', x, y)
            window.dispatchEvent(new CustomEvent('kingdom-building-collected'))
          } catch (e) {
            console.warn('[Kingdom] Failed to update timer', e)
          }
        })()

      // Show modal with rewards
      setModalData({
        tileName: kingdomTile.name,
        goldEarned,
        itemFound: itemFound ? {
          image: itemFound,
          name: itemFound.split('/').pop()?.replace('.png', '') || 'Unknown Item',
          type: kingdomTile.itemType
        } : undefined,
        isLucky: wasLucky,
        message: kingdomTile.clickMessage
      })

      // If lucky, show celebration first, then modal
      if (wasLucky) {
        setLuckyCelebrationAmount(goldEarned)
      } else {
        setShowModal(true)
      }

      // Trigger callbacks
      if (onGoldEarned) onGoldEarned(goldEarned)
      if (onItemFound && itemFound) {
        onItemFound({
          image: itemFound,
          name: itemFound.split('/').pop()?.replace('.png', '') || 'Unknown Item',
          type: kingdomTile.itemType
        })
      }

      return
    }

    // Handle other tile types (if any)
    const kingdomTile = KINGDOM_TILES.find(kt => kt.id === tile.type.toLowerCase())
    if (!kingdomTile || kingdomTile.timerMinutes === 0) return

    // Check if tile is ready
    const timer = tileTimers.find(t => t.x === x && t.y === y)
    if (!timer || !timer.isReady) return

    // Generate rewards
    const wasLucky = isLuckyTile(kingdomTile.luckyChance)
    let goldEarned = wasLucky ? kingdomTile.luckyGoldAmount : getRandomGold(...kingdomTile.normalGoldRange)
    // Apply adjacency bonus
    const adjacencyMultiplier = calculateAdjacencyBonus(x, y, kingdomTile.id);
    if (winterFestivalActive && WINTER_EVENT_TILE_IDS.has(kingdomTile.id)) {
      goldEarned = Math.floor(goldEarned * 1.2 * adjacencyMultiplier)
    } else {
      goldEarned = Math.floor(goldEarned * adjacencyMultiplier)
    }
    const baseExperience = wasLucky ? Math.ceil(goldEarned * 0.5) : Math.ceil(goldEarned * 0.3)
    const experienceAwarded = (winterFestivalActive && WINTER_EVENT_TILE_IDS.has(kingdomTile.id))
      ? Math.ceil(baseExperience * 1.1)
      : baseExperience
      // Award gold and experience
      ; (async () => {
        try {
          const { gainGold } = await import('@/lib/gold-manager')
          const { gainExperience } = await import('@/lib/experience-manager')
          gainGold(goldEarned, `tile-collect:${kingdomTile.id}`)
          gainExperience(experienceAwarded, `tile-collect:${kingdomTile.id}`, 'general')
        } catch { }
      })()
      ; (async () => {
        try {
          await fetchAuthRetry('/api/kingdom-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tileId: kingdomTile.id, wasLucky, goldEarned, experienceAwarded })
          })
        } catch { }
      })()
    const itemFound = kingdomTile.possibleItems.length > 0 ? getRandomItem(kingdomTile.possibleItems) : null

    // Update timer
    const newEndTime = Date.now() + (kingdomTile.timerMinutes * 60 * 1000)
    setTileTimers(prev =>
      prev.map(t =>
        t.x === x && t.y === y
          ? { ...t, endTime: newEndTime, isReady: false }
          : t
      )
    )

      // Persist timer restart
      ; (async () => {
        try {
          const endIso = new Date(newEndTime).toISOString()
          await fetchAuthRetry('/api/property-timers', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x, y, isReady: false, endTime: endIso })
          })

          // Dispatch event to notify other components (like notification manager)
          console.log('[Kingdom] Dispatching kingdom-building-collected event for tile at', x, y)
          window.dispatchEvent(new CustomEvent('kingdom-building-collected'))
        } catch (e) {
          console.warn('[Kingdom] Failed to update timer', e)
        }
      })()

    // Generate message with bonus info
    let message = kingdomTile.clickMessage;
    if (adjacencyMultiplier > 1) {
      const percent = Math.round((adjacencyMultiplier - 1) * 100);
      message += ` (Adjacency Bonus: +${percent}%)`;
    }

    // Show modal with rewards
    setModalData({
      tileName: kingdomTile.name,
      goldEarned,
      itemFound: itemFound ? {
        image: itemFound,
        name: itemFound.split('/').pop()?.replace('.png', '') || 'Unknown Item',
        type: kingdomTile.itemType
      } : undefined,
      isLucky: wasLucky,
      message: message
    })

    // If lucky, show celebration first, then modal
    if (wasLucky) {
      setLuckyCelebrationAmount(goldEarned)
    } else {
      setShowModal(true)
    }

    // Trigger callbacks
    if (onGoldEarned) onGoldEarned(goldEarned)
    if (onItemFound && itemFound) {
      onItemFound({
        image: itemFound,
        name: itemFound.split('/').pop()?.replace('.png', '') || 'Unknown Item',
        type: kingdomTile.itemType
      })
    }
  }

  const handleMoveTile = (x: number, y: number, tile: Tile) => {
    // Find the full property definition to select it for placement
    // Find the full property definition to select it for placement
    // Try by ID first (more reliable), then by name
    const propertyDef = getAvailableProperties().find(p => p.id === tile.type || p.name === tile.name) ||
      KINGDOM_TILES.find(kt => kt.id === tile.type || kt.name === tile.name);

    if (propertyDef) {
      // "Pick up" the tile:
      // 1. Select it as if we're placing it (entering placement mode)
      // 2. Remove it from the current spot (set to vacant)
      // 3. Update inventory temporarily or just relying on "swap" logic? 
      // Simpler: Just delete it first (add to inv), then select it.


      // Store the source position and start placement mode WITHOUT removing old tile yet
      setMovingTileSource({ x, y });

      // Select it for placement directly, bypassing quantity checks
      setSelectedProperty(propertyDef as any);
      setPlacementMode(true);
      setPropertiesOpen(false);

      toast({
        title: "Moving Building",
        description: `Select a new location for ${tile.name}. Press ESC to cancel.`,
      });
    }
  };

  const handleDeleteTile = async (x: number, y: number, tile: Tile) => {
    if (!window.confirm(`Are you sure you want to remove ${tile.name}? It will return to your inventory.`)) return;

    // Remove from grid
    const newGrid = [...grid];
    if (newGrid[y]) {
      newGrid[y] = [...newGrid[y]];
      newGrid[y][x] = {
        ...newGrid[y][x],
        type: 'vacant',
        name: 'Vacant Plot',
        image: 'Vacant.png',
        id: newGrid[y][x]?.id || `vacant-${x}-${y}`,
        description: 'A vacant plot ready for building.',
        connections: [],
        rotation: 0
      } as Tile;
      if (onGridUpdate) onGridUpdate(newGrid);
    }

    // Return to inventory
    const propertyDef = KINGDOM_TILES.find(kt => kt.name === tile.name);
    if (propertyDef && onTileRemove) {
      onTileRemove(propertyDef.id);
    } else if (propertyDef) {
      console.warn('onTileRemove prop not provided');
    }

    toast({
      title: "Building Stored",
      description: `${tile.name} returned to inventory.`,
    });
  };

  const handleRotateTile = (x: number, y: number, tile: Tile) => {
    const newGrid = [...grid];
    if (newGrid[y]) {
      newGrid[y] = [...newGrid[y]];
      const currentRotation = newGrid[y][x]?.rotation || 0;
      const newRotation = (currentRotation + 90) % 360 as 0 | 90 | 180 | 270;

      newGrid[y][x] = {
        ...newGrid[y][x]!,
        rotation: newRotation // Update the existing tile object with new rotation
      };

      if (onGridUpdate) onGridUpdate(newGrid);

      toast({
        title: "Rotated",
        description: `Rotated ${tile.name} to ${newRotation}°.`,
      });
    }
  };

  const formatTimeRemaining = (endTime: number) => {
    const now = Date.now()
    const timeLeft = endTime - now

    if (timeLeft <= 0) return 'Ready!'

    const minutes = Math.floor(timeLeft / 60000)
    const seconds = Math.floor((timeLeft % 60000) / 1000)

    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleCreatureClick = (creature: any) => {
    // Determine creature name from definition ID or similar
    // For now, showing a generic message
    toast({
      title: "Creature Spotted! 👀",
      description: "This creature seems friendly but shy. (Interactions coming soon!)",
    })
  }

  const renderGridWithBorder = () => {
    const rows = grid.length
    const cols = grid[0]?.length || 6

    return (
      <div
        className="grid gap-0 border-4 border-gray-700 rounded-lg overflow-hidden shadow-2xl relative"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          width: '100%',
          height: 'auto',
          minHeight: '400px',
          background: 'none',
          border: '20px solid #374151',
        }}
        aria-label="thrivehaven-grid"
      >
        {/* Living World Creature Layer */}
        <CreatureLayer grid={grid} mapType="kingdom" />

        {Array.from({ length: rows }).map((_, y) =>
          Array.from({ length: cols }).map((_, x) => {
            const tile = grid[y]?.[x]
            const timer = tileTimers.find(t => t.x === x && t.y === y)
            const kingdomTile = tile && tile.type !== 'vacant' ? KINGDOM_TILES.find(kt =>
              kt.id === tile.type.toLowerCase() ||
              kt.name.toLowerCase() === tile.name.toLowerCase() ||
              kt.image === tile.image
            ) : null

            if (!tile) {
              return <div key={`empty-${x}-${y}`} className="w-full h-full aspect-square bg-black/40" />
            }

            const isKingdomTile = kingdomTile !== null
            const isReady = timer?.isReady || false
            const rarityClass = ''

            return (
              <button
                key={`tile-${x}-${y}`}
                className={cn(
                  "group relative w-full h-full aspect-square bg-black/60 flex items-center justify-center focus:outline-none",
                  selectedTile && "ring-2 ring-amber-500",
                  isKingdomTile && rarityClass,
                  placementMode && tile.type === 'vacant' && "ring-2 ring-amber-500 cursor-pointer hover:ring-amber-400"
                )}
                onMouseEnter={() => setHoveredTile({ x, y })}
                onMouseLeave={() => setHoveredTile(null)}
                aria-label={tile.ariaLabel || tile.name || `Tile ${x},${y}`}
                onClick={() => {
                  // Removed debugging log

                  if (placementMode && selectedProperty) {
                    // Removed debugging log
                    handlePropertyPlacement(x, y)
                  } else if (isKingdomTile && isReady) {
                    // Removed debugging log
                    handleTileClick(x, y, tile)
                  } else if (selectedTile && (selectedTile.quantity || 0) > 0) {
                    // Removed debugging log
                    onTilePlace(x, y, selectedTile)
                  }
                }}
                style={{ minWidth: 0, minHeight: 0, borderRadius: 0, margin: 0, padding: 0 }}
              >
                <Image
                  src={tile.type === 'vacant' ? '/images/kingdom-tiles/Vacant.png' : (isKingdomTile && kingdomTile ? kingdomTile.image : tile.image)}
                  alt={tile.name}
                  fill
                  className="object-cover"
                  draggable={false}
                  unoptimized
                  onError={(e) => { e.currentTarget.src = '/images/placeholders/empty-tile.svg' }}
                  style={{ transform: `rotate(${tile.rotation || 0}deg)`, transition: 'transform 0.3s ease' }}
                />

                {/* Placement mode indicator for vacant tiles */}
                {placementMode && tile.type === 'vacant' && (
                  <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                    <div className="bg-amber-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
                      Place {selectedProperty?.name}
                    </div>
                  </div>
                )}

                {/* Move/Delete Controls on Hover */}
                {isKingdomTile && !placementMode && !readOnly && (
                  <div className="absolute top-1 right-1 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div
                      role="button"
                      title="Move"
                      className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 shadow-md transform hover:scale-110 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveTile(x, y, tile);
                      }}
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                    </div>
                    <div
                      role="button"
                      title="Store in Inventory"
                      className="bg-red-600 text-white p-1 rounded hover:bg-red-700 shadow-md transform hover:scale-110 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTile(x, y, tile);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </div>
                    <div
                      role="button"
                      title="Rotate 90°"
                      className="bg-amber-600 text-white p-1 rounded hover:bg-amber-700 shadow-md transform hover:scale-110 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRotateTile(x, y, tile);
                      }}
                    >
                      <RotateCw className="w-3 h-3" />
                    </div>
                  </div>
                )}

                {/* Timer overlay for kingdom tiles - hover only to reduce clutter */}
                {isKingdomTile && timer && kingdomTile && kingdomTile.timerMinutes > 0 && (
                  <div className="group-hover:opacity-100 opacity-0 transition-opacity duration-200 absolute bottom-1 left-1 right-1">
                    <div className={cn(
                      "text-xs px-2 py-1 rounded text-center font-mono",
                      isReady
                        ? "bg-green-500 text-white"
                        : "bg-black/80 text-white",
                      // Mobile-specific improvements
                      "sm:text-xs md:text-sm",
                      "min-h-[24px] flex items-center justify-center"
                    )}>
                      {isReady ? (
                        <div className="flex items-center justify-center gap-1">
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="whitespace-nowrap">Ready!</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="whitespace-nowrap">{formatTimeRemaining(timer.endTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Placement Hint Overlay */}
                {placementMode && selectedProperty && (tile.type === 'vacant' || tile.type === 'grass') && (
                  (() => {
                    // Safe access to type property
                    const propType = (selectedProperty as any).type || (selectedProperty as any).id;
                    const { score, reason } = getPlacementHint(x, y, propType);

                    // Show hints for ALL building types now
                    if (true) {
                      return (
                        <div className={cn(
                          "absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-80 transition-opacity z-10",
                          score === 'good' ? "bg-green-500/30 ring-2 ring-green-400" : "bg-yellow-500/10"
                        )}>
                          {score === 'good' && <div className="text-xl animate-bounce">✨</div>}
                          {hoveredTile?.x === x && hoveredTile?.y === y && (
                            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-50 bg-black/95 text-white text-xs px-3 py-2 rounded-lg border border-amber-500 shadow-2xl min-w-[150px] text-center pointer-events-auto">
                              <div className={`font-bold uppercase tracking-wider mb-1 ${score === 'good' ? 'text-green-400' : 'text-yellow-400'}`}>
                                {score === 'good' ? 'Excellent' : 'Average'}
                              </div>
                              <div className="text-[10px] text-gray-300 leading-tight">
                                {reason}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    }
                    return null;
                  })()
                )}
              </button>
            )
          })
        )}
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Kingdom Control Bar - Moves widgets off the grid to avoid overlap/interaction issues */}
      {/* Kingdom Control Bar - Grounded visual style */}
      <div className="w-full mb-6 flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-slate-950/50 border border-slate-800/50 backdrop-blur-md shadow-xl">
        {/* Left: Weather Info */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center cursor-help transition-opacity hover:opacity-80">
              <div className="flex items-center gap-3">
                <div className="text-3xl filter drop-shadow-md">
                  {weather === 'sunny' ? '☀️' : weather === 'rainy' ? '🌧️' : '🌬️'}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-medieval shadow-black drop-shadow-sm">{getWeatherName(weather)}</span>
                  <span className="text-[10px] text-slate-400 italic">{getWeatherDescription(weather)}</span>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Current Weather: Affects resource production rates</p>
          </TooltipContent>
        </Tooltip>

        {/* Center: Resource HUD */}
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
          {/* Build Tokens */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-help">
                <span className="text-lg filter drop-shadow hover:scale-110 transition-transform">👑</span>
                <div className="flex flex-col leading-none">
                  <span className="font-bold font-mono text-amber-400 text-sm">{buildTokens}</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Build Tokens: Specific currency for constructing buildings</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Common Materials - Always show 0 */}
          {['wood', 'stone', 'water'].map(mat => {
            const item = inventory?.find(i => i.id === `material-${mat}` || i.name?.toLowerCase() === mat);
            const qty = item?.quantity || 0;

            const icons: Record<string, string> = { wood: '🪵', stone: '🪨', water: '💧' };
            const labels: Record<string, string> = { wood: 'Wood', stone: 'Stone', water: 'Water' };
            const descs: Record<string, string> = {
              wood: 'Essential for timber structures',
              stone: 'Required for foundations and walls',
              water: 'Used for irrigation and brewing'
            };

            return (
              <Tooltip key={mat}>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-help ${qty === 0 ? 'opacity-50 grayscale' : ''}`}>
                    <span className="text-lg filter drop-shadow hover:scale-110 transition-transform">{icons[mat] || '📦'}</span>
                    <span className="font-bold font-mono text-slate-200 text-sm">{qty}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-bold text-amber-400">{labels[mat] || mat}</p>
                  <p className="text-xs text-gray-300">{descs[mat] || 'Resource'}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:from-slate-600 hover:to-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation transition-all hover:scale-105 active:scale-95"
                onClick={expandKingdomGrid}
                disabled={!canExpand}
                aria-label="Expand kingdom grid"
              >
                <span className="text-lg">🏗️</span>
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="bg-gray-900 text-white border-amber-800/30 max-w-xs break-words"
            >
              {canExpand
                ? `Expand kingdom (Level ${playerLevel} required: ${nextExpansionLevel})`
                : `Requires Level ${nextExpansionLevel} to expand (Current: ${playerLevel})`
              }
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 border-2 border-amber-500/30 text-white rounded-xl shadow-lg flex items-center justify-center text-3xl font-bold hover:from-amber-500 hover:to-amber-700 hover:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-500 touch-manipulation transition-all hover:scale-105 active:scale-95 group"
                aria-label="Open properties panel"
                onClick={() => setPropertiesOpen(true)}
              >
                <span className="filter drop-shadow-md group-hover:block transition-all">+</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Open Shop & Inventory</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="relative w-full flex items-center justify-center">
        {/* Placement mode indicator logic remains on map for context */}
        {placementMode && selectedProperty && (
          <div className="absolute top-4 left-4 z-20 bg-amber-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-sm font-bold">Placing: {selectedProperty.name}</span>
            <span className="text-xs">Click vacant tile or press ESC to cancel</span>
          </div>
        )}

        {renderGridWithBorder()}
      </div>

      <AnimatePresence>
        {luckyCelebrationAmount !== null && (
          <LuckyCelebration
            amount={luckyCelebrationAmount}
            onComplete={() => {
              setLuckyCelebrationAmount(null)
              setShowModal(true)
            }}
          />
        )}
      </AnimatePresence>

      {/* Properties Inventory Panel (Replaced inline code with component) */}
      <KingdomPropertiesInventory
        open={propertiesOpen}
        onClose={() => setPropertiesOpen(false)}
        tiles={getAvailableProperties().map(p => ({ ...p, image: p.image.startsWith('/') ? p.image : `/images/kingdom-tiles/${p.image}` }))}
        selectedTile={selectedInventoryTile}
        setSelectedTile={(tile) => {
          setSelectedInventoryTile(tile as any);
          if (tile) {
            handlePropertySelect(tile as any); // This sets placement mode and closes panel
          }
        }}
        onBuy={(tile, method) => {
          handleBuyProperty(tile as any, method);
        }}
        onBuyToken={async () => {
          try {
            const success = await spendGold(1000, 'build-token-purchase');
            if (success) {
              setBuildTokens(prev => {
                const newVal = (prev || 0) + 1;
                import('@/lib/character-stats-service').then(({ updateCharacterStats }) => {
                  updateCharacterStats({ build_tokens: newVal }, 'build-token-purchase');
                });
                return newVal;
              });
              toast({ title: "Token Purchased!", description: "You exchanged 1000g for 1 Build Token." });
            } else {
              toast({ title: "Purchase Failed", description: "Could not purchase build token.", variant: "destructive" });
            }
          } catch (e) {
            console.error('Error purchasing build token:', e);
            toast({ title: "Purchase Failed", description: "An error occurred while purchasing the build token.", variant: "destructive" });
          }
        }}
        tokens={buildTokens}
        playerLevel={playerLevel}
        inventory={propertyInventory}
      />

      {
        showModal && modalData && (
          <KingdomTileModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            reward={modalData}
          />
        )
      }
    </div >
  )
} 