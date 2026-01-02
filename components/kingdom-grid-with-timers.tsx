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

  // Kingdom tile inventory for properties panel - organized by logical categories
  const [propertyInventory, setPropertyInventory] = useState([
    // Basic Buildings (Level 1) - Affordable starter buildings
    {
      id: 'house',
      name: 'House',
      image: '/images/kingdom-tiles/House.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'basic'
    },
    {
      id: 'well',
      name: 'Well',
      image: '/images/kingdom-tiles/Well.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'basic'
    },
    {
      id: 'pond',
      name: 'Pond',
      image: '/images/kingdom-tiles/Pond.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'basic'
    },
    {
      id: 'vegetables',
      name: 'Vegetables',
      image: '/images/kingdom-tiles/Vegetables.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'basic'
    },

    // Commerce & Services (Level 1-2) - Business and trade buildings
    {
      id: 'market-stalls',
      name: 'Market Stalls',
      image: '/images/kingdom-tiles/MarketStalls.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'commerce'
    },
    {
      id: 'grocery',
      name: 'Grocery',
      image: '/images/kingdom-tiles/Grocery.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'commerce'
    },
    {
      id: 'bakery',
      name: 'Bakery',
      image: '/images/kingdom-tiles/Bakery.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: true,
      eventType: 'harvest',
      category: 'commerce'
    },
    {
      id: 'brewery',
      name: 'Brewery',
      image: '/images/kingdom-tiles/Brewery.png',
      cost: 1,
      levelRequired: 2,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: true,
      eventType: 'harvest',
      category: 'commerce'
    },

    // Production & Crafting (Level 1-2) - Manufacturing and resource buildings
    {
      id: 'blacksmith',
      name: 'Blacksmith',
      image: '/images/kingdom-tiles/Blacksmith.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'production'
    },
    {
      id: 'sawmill',
      name: 'Sawmill',
      image: '/images/kingdom-tiles/Sawmill.png',
      cost: 1,
      levelRequired: 2,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'production'
    },
    {
      id: 'windmill',
      name: 'Windmill',
      image: '/images/kingdom-tiles/Windmill.png',
      cost: 1,
      levelRequired: 2,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'production'
    },

    // Entertainment & Hospitality (Level 1-2) - Leisure and accommodation
    {
      id: 'inn',
      name: 'Inn',
      image: '/images/kingdom-tiles/Inn.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'entertainment'
    },
    {
      id: 'foodcourt',
      name: 'Food Court',
      image: '/images/kingdom-tiles/Foodcourt.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'entertainment'
    },
    {
      id: 'fountain',
      name: 'Fountain',
      image: '/images/kingdom-tiles/Fountain.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'entertainment'
    },
    {
      id: 'crossroad',
      name: 'Crossroad',
      image: '/images/kingdom-tiles/Crossroad.png',
      cost: 0,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'infrastructure'
    },
    {
      id: 'straightroad',
      name: 'Straight Road',
      image: '/images/kingdom-tiles/Straightroad.png',
      cost: 0,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'infrastructure'
    },
    {
      id: 'cornerroad',
      name: 'Corner Road',
      image: '/images/kingdom-tiles/Cornerroad.png',
      cost: 0,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'infrastructure'
    },
    {
      id: 'tsplitroad',
      name: 'T-Split Road',
      image: '/images/kingdom-tiles/Tsplitroad.png',
      cost: 0,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'infrastructure'
    },

    // Combat & Training (Level 2) - Military and skill development
    {
      id: 'archery',
      name: 'Archery',
      image: '/images/kingdom-tiles/Archery.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'combat'
    },
    {
      id: 'training-grounds',
      name: 'Training Grounds',
      image: '/images/kingdom-tiles/TrainingGrounds.png',
      cost: 1,
      levelRequired: 2,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'combat'
    },
    {
      id: 'jousting',
      name: 'Jousting',
      image: '/images/kingdom-tiles/Jousting.png',
      cost: 1,
      levelRequired: 2,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'combat'
    },

    // Infrastructure & Defense (Level 2-3) - Security and essential services
    {
      id: 'watchtower',
      name: 'Watchtower',
      image: '/images/kingdom-tiles/Watchtower.png',
      cost: 1,
      levelRequired: 2,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'infrastructure'
    },
    {
      id: 'stable',
      name: 'Stable',
      image: '/images/kingdom-tiles/Stable.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'infrastructure'
    },
    {
      id: 'library',
      name: 'Library',
      image: '/images/kingdom-tiles/Library.png',
      cost: 1,
      levelRequired: 3,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'infrastructure'
    },

    // Seasonal & Event Buildings (Level 1-2) - Special event structures
    {
      id: 'winter-fountain',
      name: 'Winter Fountain',
      image: '/images/kingdom-tiles/WinterFountain.png',
      cost: 1,
      levelRequired: 2,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: true,
      eventType: 'winter',
      category: 'seasonal'
    },
    {
      id: 'snowy-inn',
      name: 'Snowy Inn',
      image: '/images/kingdom-tiles/SnowyInn.png',
      cost: 1,
      levelRequired: 2,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: true,
      eventType: 'winter',
      category: 'seasonal'
    },
    {
      id: 'ice-sculpture',
      name: 'Ice Sculpture',
      image: '/images/kingdom-tiles/IceSculpture.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: true,
      eventType: 'winter',
      category: 'seasonal'
    },
    {
      id: 'fireworks-stand',
      name: 'Fireworks Stand',
      image: '/images/kingdom-tiles/FireworksStand.png',
      cost: 1,
      levelRequired: 2,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: true,
      eventType: 'winter',
      category: 'seasonal'
    },
    {
      id: 'pumpkin-patch',
      name: 'Pumpkin Patch',
      image: '/images/kingdom-tiles/PumpkinPatch.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: true,
      eventType: 'harvest',
      category: 'seasonal'
    },
    {
      id: 'harvest-barn',
      name: 'Harvest Barn',
      image: '/images/kingdom-tiles/HarvestBarn.png',
      cost: 1,
      levelRequired: 2,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: true,
      eventType: 'harvest',
      category: 'seasonal'
    },

    // Premium & Luxury (Level 3-6) - High-end and prestigious buildings
    {
      id: 'mansion',
      name: 'Mansion',
      image: '/images/kingdom-tiles/Mansion.png',
      cost: 1,
      levelRequired: 3,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'premium'
    },
    {
      id: 'temple',
      name: 'Temple',
      image: '/images/kingdom-tiles/Temple.png',
      cost: 1,
      levelRequired: 4,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'premium'
    },
    {
      id: 'mayor',
      name: 'Mayor',
      image: '/images/kingdom-tiles/Mayor.png',
      cost: 1,
      levelRequired: 5,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'premium'
    },
    {
      id: 'wizard',
      name: 'Wizard',
      image: '/images/kingdom-tiles/Wizard.png',
      cost: 1,
      levelRequired: 6,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'premium'
    },

    // Special Buildings (Level 1) - Unique and starting buildings
    {
      id: 'castle',
      name: 'Castle',
      image: '/images/kingdom-tiles/Castle.png',
      cost: 0,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 1, // Start with 1 castle
      isSeasonal: false,
      category: 'special'
    },
    {
      id: 'fisherman',
      name: 'Fisherman',
      image: '/images/kingdom-tiles/Fisherman.png',
      cost: 1,
      levelRequired: 1,
      costType: 'build-token',
      quantity: 0,
      isSeasonal: false,
      category: 'special'
    }
  ]);

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

  // Handle buying properties with build tokens
  const handleBuyProperty = async (property: typeof propertyInventory[0]) => {
    console.log('[Kingdom] handleBuyProperty called for:', property.name, 'Cost:', property.cost, 'Cost type:', property.costType);

    // Properties should cost build tokens, not gold
    if (property.costType !== 'build-token') {
      console.log('[Kingdom] Property cost type is not build-token:', property.costType);
      toast({
        title: 'Cannot Buy',
        description: 'This property cannot be purchased with build tokens.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Use the component's buildTokens state for consistency
      const currentBuildTokens = buildTokens;

      console.log('[Kingdom] Current build tokens:', currentBuildTokens, 'Required:', property.cost);

      if (currentBuildTokens < property.cost) {
        toast({
          title: 'Insufficient Build Tokens',
          description: `You need ${property.cost} build token(s) for ${property.name}. You have ${currentBuildTokens}.`,
          variant: 'destructive',
        });
        return;
      }

      console.log('[Kingdom] Attempting to spend build token(s):', property.cost);

      // Spend build tokens by updating character stats
      updateCharacterStats({
        build_tokens: currentBuildTokens - property.cost
      }, 'kingdom:buy-property');
      const success = true; // Service doesn't return boolean, assume success as it's optimistic

      console.log('[Kingdom] Build tokens spent result:', success);

      if (success) {
        console.log('[Kingdom] Build tokens spent successfully, updating inventory...');

        // Update build tokens state to reflect the spent tokens
        setBuildTokens(prev => prev - property.cost);

        // Update property quantity
        const updatedInventory = propertyInventory.map(p =>
          p.id === property.id ? { ...p, quantity: (p.quantity || 0) + 1 } : p
        );

        console.log('[Kingdom] Updated inventory:', updatedInventory.find(p => p.id === property.id));

        // Update the property inventory state
        setPropertyInventory(updatedInventory);

        // Persist inventory increment
        try {
          console.log('[Kingdom] Persisting to tile-inventory API...');
          const response = await fetchAuthRetry('/api/tile-inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tile: { id: property.id, type: property.id, name: property.name, quantity: 1, cost: property.cost } })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('[Kingdom] Tile inventory API response:', result);
          } else {
            console.error('[Kingdom] Tile inventory API failed:', response.status, response.statusText);
          }
        } catch (e) {
          console.error('[Kingdom] Failed to increment inventory:', e)
        }

        toast({
          title: 'Property Purchased!',
          description: `You now own ${property.name}!`,
        });
      } else {
        console.log('[Kingdom] Failed to spend build tokens');
        toast({
          title: 'Purchase Failed',
          description: 'Failed to spend build tokens.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[Kingdom] Error buying property:', error);
      toast({
        title: 'Purchase Failed',
        description: 'There was an error purchasing the property.',
        variant: 'destructive',
      });
    }
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
      setShowModal(true)

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
    if (winterFestivalActive && WINTER_EVENT_TILE_IDS.has(kingdomTile.id)) {
      goldEarned = Math.floor(goldEarned * 1.2)
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
    setShowModal(true)

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
    <>
      <div className="relative w-full flex items-center justify-center">
        {/* Weather Indicator */}
        {!placementMode && (
          <div className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur-md border border-amber-500/30 text-amber-100 px-3 py-2 rounded-lg shadow-xl shadow-black/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="text-3xl filter drop-shadow-md">
              {weather === 'sunny' ? '☀️' : weather === 'rainy' ? '🌧️' : '🌬️'}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest font-medieval">{getWeatherName(weather)}</span>
              <span className="text-[10px] text-gray-300 italic">{getWeatherDescription(weather)}</span>
            </div>
          </div>
        )}

        {/* Placement mode indicator */}
        {placementMode && selectedProperty && (
          <div className="absolute top-4 left-4 z-20 bg-amber-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-sm font-bold">Placing: {selectedProperty.name}</span>
            <span className="text-xs">Click vacant tile or press ESC to cancel</span>
          </div>
        )}

        {/* Floating + button in top right corner of grid */}
        <button
          className="absolute top-4 right-4 z-20 w-14 h-14 sm:w-12 sm:h-12 bg-amber-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl sm:text-3xl font-bold hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 touch-manipulation min-h-[44px]"
          aria-label="Open properties panel"
          onClick={() => setPropertiesOpen(true)}
        >
          +
        </button>
        {/* Floating expand button below the + button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="absolute top-24 sm:top-20 right-4 z-20 w-14 h-14 sm:w-12 sm:h-12 bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center text-base sm:text-sm font-bold hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
              onClick={expandKingdomGrid}
              disabled={!canExpand}
              aria-label="Expand kingdom grid"
            >
              🏗️
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

        {renderGridWithBorder()}
      </div>

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
        onBuy={(tile) => {
          handleBuyProperty(tile as any);
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

      {showModal && modalData && (
        <KingdomTileModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          reward={modalData}
        />
      )}
    </>
  )
} 