"use client"

import { logger } from "@/lib/logger";

import React, { useState, useEffect, useCallback, useMemo } from "react"
import Image from "next/image"
import { Tile, TileType } from '@/types/core-interfaces'
import { cn } from '@/lib/utils'
import { KingdomPropertiesInventory } from './kingdom-properties-inventory'
import { Button } from '@/components/ui/button'
import { ArrowRightLeft, Clock, RotateCw, Sparkles, Trash2, Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { KINGDOM_TILES, getRandomItem, getRandomGold, isLucky as isLuckyTile, getRarityColor } from '@/lib/kingdom-tiles'
import { KingdomTileModal } from './kingdom-tile-modal'
import { ZenMeditateModal } from './kingdom/ZenMeditateModal'
import { useToast } from '@/components/ui/use-toast'
import { KingdomTileItem } from './KingdomTileItem'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { CreatureLayer } from '@/components/creature-layer'
import { useWeather } from '@/hooks/use-weather'
import { TEXT_CONTENT } from '@/lib/text-content'
import { AnimatePresence } from 'framer-motion'
import { LuckyCelebration } from '@/components/lucky-celebration'
import { TileActionSheet } from '@/components/tile-action-sheet'
import { KingdomSummaryModal } from './kingdom-summary-modal'


// Game managers will be loaded dynamically to keep the initial bundle light
let goldManager: typeof import('@/lib/gold-manager') | null = null;
let expManager: typeof import('@/lib/experience-manager') | null = null;
let invManager: typeof import('@/lib/inventory-manager') | null = null;
let statsService: typeof import('@/lib/character-stats-service') | null = null;

interface GameManagers {
    goldManager: any;
    expManager: any;
    invManager: any;
    statsService: any;
}

/**
 * Load game managers dynamically to keep initial bundle size small
 */
const loadManagers = async (): Promise<GameManagers> => {
    try {
        if (!goldManager) goldManager = await import('../lib/gold-manager') as any;
        if (!expManager) expManager = await import('../lib/experience-manager') as any;
        if (!invManager) invManager = await import('../lib/inventory-manager') as any;
        if (!statsService) statsService = await import('../lib/character-stats-service') as any;
        
        return { 
            goldManager: goldManager!, 
            expManager: expManager!, 
            invManager: invManager!, 
            statsService: statsService! 
        };
    } catch (e) {
        logger.error('Failed to load game managers', e);
        throw e;
    }
};

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
  userId?: string | null
  onInventoryUpdate?: ((item: any) => void) | undefined
  onTileMove?: ((updatedGrid: Tile[][], x: number, y: number, tile: Tile) => void) | undefined
  onTileStash?: ((updatedGrid: Tile[][], x: number, y: number, tileId: string) => void) | undefined
  playerLevel?: number
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
  onMaterialSpend,
  userId,
  onInventoryUpdate,
  onTileMove,
  onTileStash,
  playerLevel = 1
}: KingdomGridWithTimersProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { weather, getWeatherName, getWeatherDescription } = useWeather()
  const [tileTimers, setTileTimers] = useState<TileTimer[]>([])
  const [hoveredTile, setHoveredTile] = useState<{ x: number, y: number } | null>(null)
  const [movingTileSource, setMovingTileSource] = useState<{ x: number, y: number } | null>(null)
  const [focusCategory, setFocusCategory] = useState<string | null>(null)

  // -- Hoisted Properties Search/Logic for Type Safety --
  // Seasonal event flags (hoisted for property filtering)
  const [winterFestivalActive, setWinterFestivalActive] = useState(false)
  const [harvestFestivalActive, setHarvestFestivalActive] = useState(false)

  const [propertyInventory, setPropertyInventory] = useState(() => {
    // Metadata for UI categorization and locking
    const METADATA: Record<string, { category: string, levelRequired: number, isSeasonal?: boolean, eventType?: string }> = {
      house: { category: 'basic', levelRequired: 1 },
      well: { category: 'basic', levelRequired: 1 },
      pond: { category: 'basic', levelRequired: 1 },
      vegetables: { category: 'basic', levelRequired: 1 },
      'market-stalls': { category: 'commerce', levelRequired: 1 },
      grocery: { category: 'commerce', levelRequired: 1 },
      bakery: { category: 'commerce', levelRequired: 1, isSeasonal: true, eventType: 'harvest' },
      brewery: { category: 'commerce', levelRequired: 2, isSeasonal: true, eventType: 'harvest' },
      blacksmith: { category: 'production', levelRequired: 1 },
      sawmill: { category: 'production', levelRequired: 2 },
      windmill: { category: 'production', levelRequired: 2 },
      stable: { category: 'production', levelRequired: 1 },
      'harvest-barn': { category: 'production', levelRequired: 2, isSeasonal: true, eventType: 'harvest' },
      inn: { category: 'entertainment', levelRequired: 1 },
      'snowy-inn': { category: 'entertainment', levelRequired: 1, isSeasonal: true, eventType: 'winter' },
      foodcourt: { category: 'entertainment', levelRequired: 2 },
      'training-grounds': { category: 'entertainment', levelRequired: 2 },
      'jousting': { category: 'entertainment', levelRequired: 3 },
      'fireworks-stand': { category: 'entertainment', levelRequired: 1, isSeasonal: true, eventType: 'winter' },
      'pumpkin-patch': { category: 'basic', levelRequired: 1, isSeasonal: true, eventType: 'harvest' },
      'winter-fountain': { category: 'basic', levelRequired: 1, isSeasonal: true, eventType: 'winter' },
      'ice-sculpture': { category: 'basic', levelRequired: 1, isSeasonal: true, eventType: 'winter' },
      library: { category: 'advanced', levelRequired: 3 },
      temple: { category: 'advanced', levelRequired: 3 },
      fountain: { category: 'advanced', levelRequired: 2 },
      archery: { category: 'advanced', levelRequired: 2 },
      watchtower: { category: 'advanced', levelRequired: 3 },
      mansion: { category: 'prestige', levelRequired: 4 },
      mayor: { category: 'prestige', levelRequired: 5 },
      castle: { category: 'prestige', levelRequired: 5 },
      wizard: { category: 'prestige', levelRequired: 4 },
      farmland: { category: 'production', levelRequired: 2 },
      jungle: { category: 'adventure', levelRequired: 3 },
      ruins: { category: 'adventure', levelRequired: 4 },
      oasis: { category: 'adventure', levelRequired: 5 },
      coral_reef: { category: 'adventure', levelRequired: 6 },
      graveyard: { category: 'mystic', levelRequired: 7 },
      crystal_cavern: { category: 'mystic', levelRequired: 8 },
      floating_island: { category: 'mystic', levelRequired: 10 },
      'zen-garden': { category: 'mystic', levelRequired: 1 },
    };

    return KINGDOM_TILES.map(tile => {
      const meta = METADATA[tile.id] || { category: 'misc', levelRequired: tile.levelRequired || 1 };
      return {
        id: tile.id,
        name: tile.name,
        image: tile.image,
        cost: tile.cost || 0,
        tokenCost: tile.tokenCost,
        materialCost: tile.materialCost,
        levelRequired: meta.levelRequired || tile.levelRequired || 1,
        costType: 'gold', 
        quantity: 0,
        isSeasonal: meta.isSeasonal || false,
        eventType: meta.eventType,
        category: meta.category
      };
    });
  });

  // Sync property inventory with user inventory (props)
  useEffect(() => {
    if (!inventory) return;
    setPropertyInventory(prev => {
      const inventoryMap = new Map();
      inventory.forEach(i => {
        inventoryMap.set(i.id, i.quantity || 0);
        if (i.id.endsWith('-item')) {
          inventoryMap.set(i.id.replace('-item', ''), i.quantity || 0);
        }
        if (i.name) {
          inventoryMap.set(i.name.toLowerCase(), i.quantity || 0);
        }
      });

      return prev.map(prop => {
        const qty = inventoryMap.get(prop.id) ||
          inventoryMap.get(prop.name?.toLowerCase()) ||
          0;
        if (prop.quantity !== qty) {
          return { ...prop, quantity: qty };
        }
        return prop;
      });
    });
  }, [inventory]);

  const availableProperties = useMemo(() => {
    return propertyInventory.filter(property => {
      if (!property.isSeasonal) return true;
      if (property.eventType === 'winter') return winterFestivalActive;
      if (property.eventType === 'harvest') return harvestFestivalActive;
      return false;
    });
  }, [propertyInventory, winterFestivalActive, harvestFestivalActive]);

  const [selectedInventoryTile, setSelectedInventoryTile] = useState<typeof propertyInventory[0] | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<typeof propertyInventory[0] | null>(null)
  const [placementMode, setPlacementMode] = useState(false)

  // Memoize callback to prevent infinite loops in LuckyCelebration useEffect
  const handleLuckyComplete = useCallback(() => {
    setLuckyCelebrationAmount(null);
    setShowModal(true);
  }, []);

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
  const [zenModalOpen, setZenModalOpen] = useState(false)
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

  // State for mobile action sheet
  const [actionSheetOpen, setActionSheetOpen] = useState(false)
  const [actionSheetTile, setActionSheetTile] = useState<{ tile: Tile; x: number; y: number; timer?: TileTimer } | null>(null)

  // Batch collection state
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [summaryRewards, setSummaryRewards] = useState<any[]>([])

  // Add missing state for expand functionality
  const [propertiesOpen, setPropertiesOpen] = useState(false)
  const [propertyTab, setPropertyTab] = useState<'place' | 'buy'>('place')
  const [kingdomExpansions, setKingdomExpansions] = useState(0)
  const [buildTokens, setBuildTokens] = useState(0)
  const [pendingHabits, setPendingHabits] = useState<string[]>([]) // List of building types with incomplete quests
  const [chaosRiftTiles, setChaosRiftTiles] = useState<Set<string>>(new Set()) // Set of tile IDs with chaos rift overlay

  // Producer tile types that can receive a chaos rift
  const PRODUCER_TILE_TYPES = [
    'blacksmith', 'sawmill', 'windmill', 'farm', 'lumber_mill', 'market',
    'bakery', 'brewery', 'stable', 'harvest-barn', 'well', 'fisherman',
    'fountain', 'grocery', 'foodcourt', 'vegetables', 'farmland', 'inn',
    'market-stalls', 'house', 'mansion', 'castle'
  ]

  // Fetch Quest Status for Habit Indicators & Chaos Rift
  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const res = await fetch('/api/quests');
        if (res.ok) {
          const quests = await res.json();
          const pending: string[] = [];
          
          // Safety check: ensure quests is an array
          if (Array.isArray(quests)) {
            // Check for specific quest-building links
            const hasPendingMeditation = quests.some((q: any) => q.name === 'Daily Meditation' && !q.completed);
            if (hasPendingMeditation) pending.push('zen-garden');

            // --- CHAOS RIFT LOGIC ---
            // Count daily quests that were NOT completed today
            const missedDailyCount = quests.filter((q: any) =>
              (q.mandate_period === 'daily' || !q.mandate_period) && !q.completed
            ).length;

            if (missedDailyCount > 10) {
              // Find all producer tiles currently placed on the grid
              const producerTilesOnGrid: { tileId: string }[] = [];
              grid.forEach(row => {
                row?.forEach(tile => {
                  if (tile && PRODUCER_TILE_TYPES.includes(tile.type?.toLowerCase()) && tile.type !== 'vacant') {
                    producerTilesOnGrid.push({ tileId: tile.id });
                  }
                });
              });

              if (producerTilesOnGrid.length > 0) {
                // Pick one random producer tile to receive the rift
                const randomIdx = Math.floor(Math.random() * producerTilesOnGrid.length);
                const chosen = producerTilesOnGrid[randomIdx];
                if (chosen) {
                  setChaosRiftTiles(new Set([chosen.tileId]));
                  logger.warn(`[Kingdom] Chaos Rift triggered on tile ${chosen.tileId} (${missedDailyCount} missed habits)`);
                }
              }
            } else {
              // Clear chaos rifts if habits are back on track
              setChaosRiftTiles(prev => (prev.size > 0 ? new Set() : prev));
            }
          }
          
          setPendingHabits(pending);
        }
      } catch (e) {
        logger.error('Failed to fetch quests for indicators:', e);
      }
    };

    fetchQuests();
    // Refresh periodically or on focus
    const interval = setInterval(fetchQuests, 60000);
    return () => clearInterval(interval);
  }, [grid]);
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

  // Consolidate character stats loading (Expansions, Tokens, Level)
  // Consolidate character stats loading (Expansions, Tokens, Level)
  useEffect(() => {
    // Function to load stats from local state only (safe for event listeners)
    const loadLocalStats = async () => {
      try {
        const { statsService } = await loadManagers();
        const stats = statsService.getCharacterStats()

        setKingdomExpansions(stats.kingdom_expansions || 0)
        setBuildTokens(stats.build_tokens || 0)
        // Level is now updated upstream via stats refresh
      } catch (error) {
        logger.warn('[Kingdom] Failed to load local character data:', error)
      }
    }

    // Initial sequence: Load local, then fetch fresh from server ONCE
    const init = async () => {
      await loadLocalStats()

      try {
        // This will fetch from server, merge, and emit 'character-stats-update'
        const { statsService } = await loadManagers();
        await statsService.fetchFreshCharacterStats()
      } catch (error) {
        logger.warn('[Kingdom] Failed to fetch fresh stats:', error)
      }
    }

    init()

    // Listen for updates - ONLY reload local stats, DO NOT fetch again
    const handleStatsUpdate = () => loadLocalStats()
    const handleXPUpdate = () => loadLocalStats()

    window.addEventListener('character-stats-update', handleStatsUpdate)
    window.addEventListener('xp-update', handleXPUpdate)
    window.addEventListener('gold-update', handleStatsUpdate)

    return () => {
      window.removeEventListener('character-stats-update', handleStatsUpdate)
      window.removeEventListener('xp-update', handleXPUpdate)
      window.removeEventListener('gold-update', handleStatsUpdate)
    }
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
        logger.error('[Kingdom] Error fetching event flags:', error);
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
          image: '/images/kingdom-tiles/Vacant.webp',
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
      loadManagers().then(({ statsService }) => {
        statsService.updateCharacterStats({ kingdom_expansions: newVal }, 'kingdom-expansion');
      });
      return newVal;
    });

    // Call the callback to update the parent component's grid
    if (onGridExpand) {
      onGridExpand(newGrid);
    } else if (onGridUpdate) {
      onGridUpdate(newGrid);
    }

    toast({
      title: TEXT_CONTENT.kingdomGrid.expansion.success.title,
      description: TEXT_CONTENT.kingdomGrid.expansion.success.description,
    });
  };

  // Legacy function wrapper for compatibility
  const getAvailableProperties = () => availableProperties;



  // Check if player can place a property
  const canPlaceProperty = (property: typeof propertyInventory[0]) => {
    // Check level requirement if it exists
    if (property.levelRequired && playerLevel < property.levelRequired) {
      return false
    }
    // Must have quantity
    return (property.quantity || 0) > 0
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

  const handleBuyProperty = async (property: typeof propertyInventory[0], method: 'gold' | 'materials' | 'tokens' = 'tokens') => {

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

      const { goldManager } = await loadManagers();
      const success = await goldManager.spendGold(property.cost, `buy-property:${property.id}`);
      if (!success) {
        toast({ title: "Insufficient Gold", description: `You need ${property.cost} Gold.`, variant: "destructive" });
        return;
      }

      toast({ title: "Purchased!", description: `Bought ${property.name} for ${property.cost} Gold.` });

      // Add to inventory
      if (userId) {
        try {
          const { invManager } = await loadManagers();
          const buildingItem = {
            id: property.id,
            name: property.name,
            quantity: 1,
            type: 'item',
            category: 'building',
            image: property.image
          };
          await invManager.addToKingdomInventory(userId, buildingItem);
          toast({ title: "Inventory Updated", description: `${property.name} added to your collection.` });
          if (onInventoryUpdate) {
            onInventoryUpdate({
              id: property.id,
              name: property.name,
              quantity: 1,
              type: 'building',
              image: property.image
            });
          }
        } catch (e) {
          logger.error('Failed to add to inventory', e);
          toast({ title: "Inventory Error", description: "Failed to save item.", variant: "destructive" });
        }
      } else {
        logger.warn('[Kingdom] No userId available for inventory add');
      }

      // Emit event to update inventory UI
      window.dispatchEvent(new Event('character-inventory-update'));

      return;

    } else if (method === 'materials') {
      if (!property.materialCost) return;

      // 1. Check Gold (if applicable)
      const goldCost = property.cost || 0;
      // We can't easily check gold balance here definitively without trying to spend or storing it in state,
      // but spendGold handles the check. We should do it FIRST to avoid partial material spend.
      // However, verifying materials first is better UX (don't spend gold if missing wood).

      // 2. Check Materials
      const missing = property.materialCost.filter(mat => {
        // Handle id mapping: 'material-logs' in cost vs 'material-logs' in inventory
        const invItem = inventory.find(i => i.id === mat.itemId || i.name?.toLowerCase() === mat.itemId.replace('material-', '').toLowerCase());
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

      // 3. Deduct Gold
      if (goldCost > 0) {
      const { goldManager } = await loadManagers();
      const success = await goldManager.spendGold(goldCost, `construct:${property.id}`);
        if (!success) {
          toast({ title: "Insufficient Gold", description: `You need ${goldCost} Gold in addition to materials.`, variant: "destructive" });
          return;
        }
      }

      // 4. Deduct Materials
      if (onMaterialSpend) {
        for (const mat of property.materialCost) {
          await onMaterialSpend(mat.itemId, mat.quantity);
        }

        // Add to inventory
        if (userId) {
          try {
            const { invManager } = await loadManagers();
            await invManager.addToKingdomInventory(userId, {
              id: property.id,
              name: property.name,
              quantity: 1,
              type: 'item',
              category: 'building',
              image: property.image
            });
            logger.warn('[Kingdom] Inventory add success (Materials)');
            toast({ title: "Inventory Updated", description: `${property.name} added to your collection.` });
            if (onInventoryUpdate) {
              onInventoryUpdate({
                id: property.id,
                name: property.name,
                quantity: 1,
                type: 'building',
                image: property.image
              });
            }
          } catch (e) {
            logger.error('Failed to add to inventory', e);
            toast({ title: "Inventory Error", description: "Failed to save item.", variant: "destructive" });
          }
        } else {
          logger.warn('[Kingdom] No userId available for inventory add');
        }

        toast({ title: "Construction Started", description: `Used materials and ${goldCost}g to build ${property.name}.` });

        // Trigger inventory update
        window.dispatchEvent(new Event('character-inventory-update'));
      } else {
        logger.warn('onMaterialSpend callback missing');
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

    if (isMovingToSource) {
      logger.info('[KingdomGrid] Moving tile to same spot, cancelling move action.');
      setSelectedProperty(null);
      setPlacementMode(false);
      setMovingTileSource(null);
      return;
    }

    if (!targetTile || (targetTile.type !== 'vacant' && targetTile.type !== 'empty')) {
      toast({
        title: 'Invalid Placement',
        description: 'You can only place properties on vacant tiles.',
        variant: 'destructive',
      });
      return
    }

    // Create the new kingdom tile
    const newTile: Tile = {
      id: `${selectedProperty.id}-${x}-${y}`,
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

    // Create a copy of the grid to update
    const updatedGrid = grid.map(row => row.slice());

    // If we are moving, clear the OLD spot first
    if (movingTileSource) {
      const srcY = movingTileSource.y;
      const srcX = movingTileSource.x;
      logger.info(`[KingdomGrid] Moving tile from (${srcX},${srcY}) to (${x},${y})`);
      if (updatedGrid[srcY] && updatedGrid[srcY][srcX]) {
        updatedGrid[srcY][srcX] = {
          ...updatedGrid[srcY][srcX],
          type: 'vacant',
          name: 'Vacant Plot',
          image: '/images/kingdom-tiles/Vacant.webp',
          id: `vacant-${srcX}-${srcY}`,
          description: 'A vacant plot ready for building.',
          connections: [],
          rotation: 0
        } as Tile;
      }
    }

    // Place the new tile in the grid at the new location
    if (updatedGrid[y]) {
      updatedGrid[y][x] = newTile;
    }

    if (movingTileSource) {
      // MOVE: we already cleared the old cell and placed in the new cell above.
      // Push the full updated grid to the parent so BOTH changes are persisted.
      if (onTileMove) {
        onTileMove(updatedGrid, x, y, newTile);
      } else if (onGridUpdate) {
        onGridUpdate(updatedGrid);
      }
    } else {
      // NEW PLACEMENT (from inventory)
      if (onTilePlace) {
        onTilePlace(x, y, newTile);
      } else if (onGridUpdate) {
        onGridUpdate(updatedGrid);
      }
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
            logger.warn('[Kingdom] Failed to persist timer', e)
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

  // Update timer readiness every 10 seconds (visual only, was 1s)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const tick = () => setTileTimers(prev =>
      prev.map(timer => ({ ...timer, isReady: Date.now() >= timer.endTime }))
    );

    const start = () => { if (interval) clearInterval(interval); interval = setInterval(tick, 10000); };
    const stop = () => { if (interval) clearInterval(interval); interval = null; };
    const onVisibility = () => document.hidden ? stop() : start();

    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
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
        // Removed debugging log
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
              // Removed debugging log
            } catch (e) {
              // Removed debugging log
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

    // Handle Zen Garden interaction
    if (tile.type === 'zen-garden') {
      setZenModalOpen(true);
      return;
    }

    // Handle Functional Buildings (Hub Navigation)
    if (tile.type === 'quest-board') {
      toast({ title: "Checking Quest Board...", description: "Going to Quests." });
      router.push('/quests');
      return;
    }
    if (tile.type === 'market' || tile.type === 'market-stalls') {
      toast({ title: "Entering Market...", description: "Going to Market." });
      router.push('/market');
      return;
    }
    if (tile.type === 'dungeon') {
      toast({ title: "Entering Dungeon...", description: "Teleporting to Dungeon." });
      router.push('/dungeon');
      return;
    }
    if (tile.type === 'monument') {
      toast({ title: "Viewing Hall of Fame...", description: "Going to Achievements." });
      router.push('/achievements');
      return;
    }
    if (tile.type === 'training-grounds') {
      toast({ title: "Entering Training Grounds...", description: "Going to Character." });
      router.push('/character');
      return;
    }
    if (tile.type === 'tavern') {
      toast({ title: "Entering Tavern...", description: "Going to Social." });
      router.push('/social');
      return;
    }
    if (tile.type === 'castle') {
      toast({ title: "Entering Castle...", description: "Going to Realm." });
      router.push('/realm');
      return;
    }
    if (tile.type?.toLowerCase() === 'library') {
      toast({ title: "Entering Library...", description: "Opening Chronicle." });
      router.push('/chronicle');
      return;
    }
    if (tile.type === 'crystal_cavern') {
      toast({ title: "Entering Cavern...", description: "Delve into the depths." });
      router.push('/dungeon');
      return;
    }
    // Removed redundant house hub to consolidate navigation
    // (Training Grounds remains the primary character portal)

    // Handle property tiles (blacksmith, sawmill, etc.) - Collectible production buildings
    // Note: archery, jousting, market, dungeon are navigation tiles handled above
    if (tile.type && (tile.type === 'blacksmith' || tile.type === 'sawmill' ||
      tile.type === 'fisherman' || tile.type === 'grocery' || tile.type === 'foodcourt' ||
      tile.type === 'well' || tile.type === 'windmill' ||
      tile.type === 'fountain' ||
      tile.type === 'mansion' || tile.type === 'mayor' || tile.type === 'archery' || tile.type === 'jousting' || tile.type === 'watchtower')) {

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
      const currentTier = (tile as any).level || 1;
      goldEarned = Math.floor(goldEarned * (1 + ((currentTier - 1) * 0.5)));
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
            const { goldManager, expManager } = await loadManagers();
            goldManager.gainGold(goldEarned, `tile-collect:${kingdomTile.id}`)
            expManager.gainExperience(experienceAwarded, `tile-collect:${kingdomTile.id}`, 'general')
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
            // Removed debugging log
            window.dispatchEvent(new CustomEvent('kingdom-building-collected'))
          } catch (e) {
            // Removed debugging log
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
    const currentTier = (tile as any).level || 1;
    goldEarned = Math.floor(goldEarned * (1 + ((currentTier - 1) * 0.5)));
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
          const { goldManager, expManager } = await loadManagers();
          goldManager.gainGold(goldEarned, `tile-collect:${kingdomTile.id}`)
          expManager.gainExperience(experienceAwarded, `tile-collect:${kingdomTile.id}`, 'general')
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
          // Removed debugging log
          window.dispatchEvent(new CustomEvent('kingdom-building-collected'))
        } catch (e) {
          // Removed debugging log
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
      (async () => {
        try {
          const { invManager } = await loadManagers();
          if (userId) {
            await invManager.addToKingdomInventory(userId, {
              image: itemFound,
              name: itemFound.split('/').pop()?.replace('.png', '') || 'Unknown Item',
              type: kingdomTile.itemType,
              quantity: 1,
              category: 'material'
            } as any);
          }
        } catch (e) {
          logger.error('Failed to add found item to inventory', e);
        }
      })();

      onItemFound({
        image: itemFound,
        name: itemFound.split('/').pop()?.replace('.png', '') || 'Unknown Item',
        type: kingdomTile.itemType
      })
    }
  }

  const handleCollectAllReady = async () => {
    const readyTimers = tileTimers.filter(t => t.isReady);
    if (readyTimers.length === 0) {
      toast({ title: "Nothing to collect", description: "Wait for your buildings to finish production!" });
      return;
    }

    const collectedRewards: any[] = [];
    const updatedTimers = [...tileTimers];

    for (const timer of readyTimers) {
      const { x, y } = timer;
      const tile = grid[y]?.[x];
      if (!tile || tile.type === 'vacant') continue;

      const kingdomTile = KINGDOM_TILES.find(kt =>
        kt.id === tile.type.toLowerCase() ||
        kt.name.toLowerCase() === tile.name.toLowerCase() ||
        kt.image === tile.image
      );
      if (!kingdomTile || kingdomTile.timerMinutes === 0) continue;

      const wasLucky = isLuckyTile(kingdomTile.luckyChance);
      let goldEarned = wasLucky ? kingdomTile.luckyGoldAmount : getRandomGold(...kingdomTile.normalGoldRange);
      const currentTier = (tile as any).level || 1;
      goldEarned = Math.floor(goldEarned * (1 + ((currentTier - 1) * 0.5)));
      const adjacencyMultiplier = calculateAdjacencyBonus(x, y, kingdomTile.id);
      
      if (winterFestivalActive && WINTER_EVENT_TILE_IDS.has(kingdomTile.id)) {
        goldEarned = Math.floor(goldEarned * 1.2 * adjacencyMultiplier);
      } else if (harvestFestivalActive && HARVEST_EVENT_TILE_IDS.has(kingdomTile.id)) {
        goldEarned = Math.floor(goldEarned * 1.2 * adjacencyMultiplier);
      } else {
        goldEarned = Math.floor(goldEarned * adjacencyMultiplier);
      }

      const baseExperience = wasLucky ? Math.ceil(goldEarned * 0.5) : Math.ceil(goldEarned * 0.3);
      const experienceAwarded = (winterFestivalActive && WINTER_EVENT_TILE_IDS.has(kingdomTile.id))
        ? Math.ceil(baseExperience * 1.1)
        : (harvestFestivalActive && HARVEST_EVENT_TILE_IDS.has(kingdomTile.id))
          ? Math.ceil(baseExperience * 1.1)
          : baseExperience;

      // Award gold and experience
      const { goldManager } = await loadManagers();
      const { expManager } = await loadManagers();
      
      goldManager.gainGold(goldEarned, `tile-collect:${kingdomTile.id}`);
      expManager.gainExperience(experienceAwarded, `tile-collect:${kingdomTile.id}`, 'general');

      // Add to summary
      const itemFoundPath = kingdomTile.possibleItems.length > 0 ? getRandomItem(kingdomTile.possibleItems) : null;
      
      let itemName = 'Unknown Item';
      if (itemFoundPath) {
        const fileName = itemFoundPath.split('/').pop() || '';
        itemName = fileName
          .replace(/\.(png|webp)$/, '')
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      collectedRewards.push({
        tileName: kingdomTile.name,
        goldEarned,
        experienceEarned: experienceAwarded,
        itemFound: itemFoundPath ? {
          image: itemFoundPath,
          name: itemName,
          type: kingdomTile.itemType
        } : undefined,
        isLucky: wasLucky
      });

      // Update timer in our local list
      const newEndTime = Date.now() + (kingdomTile.timerMinutes * 60 * 1000);
      const timerIdx = updatedTimers.findIndex(t => t.x === x && t.y === y);
      if (timerIdx >= 0 && updatedTimers[timerIdx]) {
        updatedTimers[timerIdx] = { 
          ...updatedTimers[timerIdx]!, 
          endTime: newEndTime, 
          isReady: false 
        };
      }

      // Persist to API (non-blocking)
      fetchAuthRetry('/api/property-timers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, isReady: false, endTime: new Date(newEndTime).toISOString() })
      }).catch(e => logger.error('Failed to persist timer in batch', e));

      fetchAuthRetry('/api/kingdom-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tileId: kingdomTile.id, wasLucky, goldEarned, experienceAwarded })
      }).catch(e => logger.error('Failed to log event in batch', e));

      if (onGoldEarned) onGoldEarned(goldEarned);
      if (onItemFound && itemFoundPath) {
        const foundItemData = {
          image: itemFoundPath,
          name: itemName,
          type: kingdomTile.itemType
        };
        
        (async () => {
          try {
            const { invManager } = await loadManagers();
            if (userId) {
              await invManager.addToKingdomInventory(userId, {
                ...foundItemData,
                quantity: 1,
                category: 'material'
              } as any);
            }
          } catch (e) {
            logger.error('Failed to add batch found item to inventory', e);
          }
        })();

        onItemFound(foundItemData);
      }
    }

    setTileTimers(updatedTimers);
    window.dispatchEvent(new CustomEvent('kingdom-building-collected'));
    
    setSummaryRewards(collectedRewards);
    setShowSummaryModal(true);
    
    toast({ title: "Harvest Complete!", description: `Collected rewards from ${readyTimers.length} buildings.` });
  }

  const getUpgradeCost = (tileType: string, currentTier: number) => {
    if (currentTier >= 5) return null;
    let baseCost = 250;
    if (['mansion', 'castle', 'wizard', 'mayor', 'dungeon', 'market', 'tavern', 'monument', 'library', 'training-grounds', 'crystal_cavern', 'quest-board'].includes(tileType)) baseCost = 2500;
    else if (['temple', 'watchtower', 'fountain', 'jousting', 'archery'].includes(tileType)) baseCost = 1000;
    else if (['ruins', 'crystal_cavern', 'floating_island', 'graveyard', 'oasis'].includes(tileType)) baseCost = 5000;
    else if (['market-stalls', 'grocery', 'bakery', 'brewery', 'sawmill', 'blacksmith', 'inn', 'tavern', 'market'].includes(tileType)) baseCost = 500;
    else if (['house', 'well', 'pond', 'vegetables', 'pumpkin-patch', 'quest-board'].includes(tileType)) baseCost = 100;
    return baseCost * Math.pow(2, currentTier - 1);
  };

  const handleUpgradeTile = async (x: number, y: number, tile: Tile) => {
    if (readOnly) return;
    const currentTier = (tile as any).level || 1;
    const upgradeCost = getUpgradeCost(tile.type, currentTier);
    
    if (!upgradeCost) {
      toast({ title: "Max Tier Reached", description: "This building cannot be upgraded any further." });
      return;
    }
    
    try {
      const { goldManager } = await loadManagers();
      const success = await goldManager.spendGold(upgradeCost, `upgrade_building_${tile.type}`);
      if (!success) {
        toast({ title: "Not Enough Gold", description: `You need ${upgradeCost.toLocaleString()} gold to upgrade to Tier ${currentTier + 1}.`, variant: "destructive" });
        return;
      }
      
      const newGrid = [...grid];
      newGrid[y] = [...(newGrid[y] || [])];
      newGrid[y][x] = { ...tile, level: currentTier + 1 } as any;
      if (onGridUpdate) {
        onGridUpdate(newGrid);
      }
      toast({ title: "Building Upgraded!", description: `Tier ${currentTier + 1} reached! Reward yields have increased permanently.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Upgrade Failed", description: "An error occurred.", variant: "destructive" });
    }
  };

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
    const updatedGrid = grid.map(row => row.slice());
    if (updatedGrid[y]) {
      updatedGrid[y][x] = {
        ...updatedGrid[y][x],
        type: 'vacant',
        name: 'Vacant Plot',
        image: 'Vacant.png',
        id: updatedGrid[y][x]?.id || `vacant-${x}-${y}`,
        description: 'A vacant plot ready for building.',
        connections: [],
        rotation: 0
      } as Tile;
    }

    const propertyDef = KINGDOM_TILES.find(kt => kt.name === tile.name || kt.id === tile.type);
    const tileId = propertyDef?.id || tile.type || tile.id;

    if (onTileStash) {
      onTileStash(updatedGrid, x, y, tileId);
    } else {
      if (onGridUpdate) onGridUpdate(updatedGrid);
      if (propertyDef && onTileRemove) {
        onTileRemove(propertyDef.id);
      } else if (propertyDef) {
        logger.warn('onTileRemove prop not provided');
      }
    }

    toast({
      title: "Building Stored",
      description: `${tile.name} returned to inventory.`,
    });

    // Handle inventory return in background
    (async () => {
      try {
        const { invManager } = await loadManagers();
        if (userId) {
          await invManager.removeFromKingdomInventory(userId, tileId);
        }
      } catch (e) {
        logger.error('Failed to return building to inventory', e);
      }
    })();
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

    const hours = Math.floor(timeLeft / 3600000)
    const minutes = Math.floor((timeLeft % 3600000) / 60000)
    const seconds = Math.floor((timeLeft % 60000) / 1000)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }

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

        {grid.map((row, y) => 
          row?.map((tile, x) => {
            if (!tile) return <div key={`empty-${x}-${y}`} className="w-full h-full aspect-square bg-black/40" />;

            const timer = tileTimers.find(t => t.x === x && t.y === y);
            const kingdomTile = KINGDOM_TILES.find(kt => 
              kt.id === tile.type?.toLowerCase() || 
              kt.name?.toLowerCase() === tile.name?.toLowerCase()
            );

            return (
              <KingdomTileItem
                key={`${tile.id || 'tile'}-${x}-${y}`}
                x={x}
                y={y}
                tile={tile}
                timer={timer}
                kingdomTile={kingdomTile}
                currentTier={(tile as any).level || 1}
                placementMode={!!placementMode}
                readOnly={!!readOnly}
                focusCategory={focusCategory}
                pendingHabits={pendingHabits}
                hasChaosRift={chaosRiftTiles.has(tile.id)}
                onClick={handleTileClick}
                onMove={handleMoveTile}
                onDelete={handleDeleteTile}
                onRotate={handleRotateTile}
                formatTimeRemaining={formatTimeRemaining}
              />
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Kingdom Control Bar - Moves widgets off the grid to avoid overlap/interaction issues */}
      {/* Kingdom Control Bar - Grounded visual style */}
      <div className="w-full mb-6 flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-slate-950/50 border border-slate-800/50 backdrop-blur-md shadow-xl">
        {/* Left: Weather Info & Focus Mode */}
        <div className="flex items-center gap-4">
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

          {/* 3. Category Focus Mode Toggles */}
          <div className="hidden lg:flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
            {[
              { id: 'might', icon: '⚔️', label: 'Might', types: ['training-grounds', 'blacksmith', 'archery', 'jousting', 'watchtower'] },
              { id: 'knowledge', icon: '📖', label: 'Knowledge', types: ['library', 'wizard', 'temple', 'monument'] },
              { id: 'wellness', icon: '🧘', label: 'Wellness', types: ['zen-garden', 'temple', 'fountain', 'well', 'pond', 'park'] },
              { id: 'honor', icon: '👑', label: 'Honor', types: ['castle', 'mansion', 'mayor', 'monument'] }
            ].map(cat => {
              const count = grid.flat().filter(cell => cell && cat.types.includes(cell.type?.toLowerCase() || '')).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFocusCategory(focusCategory === cat.id ? null : cat.id)}
                  className={cn(
                    "p-1.5 rounded transition-all flex items-center gap-1.5",
                    focusCategory === cat.id 
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/5 opacity-50 grayscale"
                  )}
                  title={`Filter for ${cat.label} synergy`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-[9px] font-bold uppercase tracking-tight hidden xl:inline">{cat.label}</span>
                  <span className={cn(
                    "text-[8px] px-1 rounded-full",
                    focusCategory === cat.id ? "bg-amber-500 text-black" : "bg-white/10 text-slate-400"
                  )}>x{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Resource HUD */}
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5 shadow-inner overflow-x-auto max-w-full mobile-scroll-hide whitespace-nowrap">
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

          {/* Construction Materials - Dynamic List */}
          {[
            { id: 'material-logs', label: 'Logs', icon: '🪵' },
            { id: 'material-stone', label: 'Stone', icon: '🪨' },
            { id: 'material-water', label: 'Water', icon: '💧' },
            { id: 'material-planks', label: 'Planks', icon: '🪚' },
            { id: 'material-stone-block', label: 'Blocks', icon: '🧱' }
          ].map(mat => {
            // Find item by ID or Name
            const item = inventory?.find(i => i.id === mat.id || i.name?.toLowerCase() === mat.label.toLowerCase());
            const qty = item?.quantity || 0;

            return (
              <Tooltip key={mat.id}>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-help ${qty === 0 ? 'opacity-50 grayscale' : ''}`}>
                    <span className="text-lg filter drop-shadow hover:scale-110 transition-transform">{mat.icon}</span>
                    <span className="font-bold font-mono text-slate-200 text-sm">{qty}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-bold text-amber-400">{mat.label}</p>
                  <p className="text-xs text-gray-300">Start with 0? Collect from tiles!</p>
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
            onComplete={handleLuckyComplete}
          />
        )}
      </AnimatePresence>

      {/* Properties Inventory Panel (Replaced inline code with component) */}
      <KingdomPropertiesInventory
        open={propertiesOpen}
        onClose={() => setPropertiesOpen(false)}
        inventory={inventory}
        grid={grid}
        tiles={getAvailableProperties().map(p => ({ ...p, image: p.image?.startsWith('/') ? p.image : `/images/kingdom-tiles/${p.image}` }))}
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
            const managers = await loadManagers();
            if (!managers.goldManager) return;
            
            const success = await managers.goldManager.spendGold(1000, 'build-token-purchase');
            if (success) {
              const { statsService: stats } = managers;
              setBuildTokens(prev => {
                const newVal = (prev || 0) + 1;
                if (stats?.updateCharacterStats) {
                  stats.updateCharacterStats({ build_tokens: newVal }, 'build-token-purchase');
                }
                return newVal;
              });
              toast({ title: "Token Purchased!", description: "You exchanged 1000g for 1 Build Token." });
            } else {
              toast({ title: "Purchase Failed", description: "Insufficient Gold.", variant: "destructive" });
            }
          } catch (e) {
            logger.error('Error in onBuyToken:', e);
            toast({ title: "Purchase Error", description: "Action failed.", variant: "destructive" });
          }
        }}
        tokens={buildTokens}
        playerLevel={playerLevel}
      />

      {
        /* Kingdom Tile Reward Modal */
        showModal && modalData && (
          <KingdomTileModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            reward={modalData}
            onCollectAll={handleCollectAllReady}
            hasBatchReady={tileTimers.filter(t => t.isReady).length > 1}
          />
        )
      }

      {/* Kingdom Harvest Summary Modal */}
      <KingdomSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        rewards={summaryRewards}
      />

      {/* Zen Garden Meditation Modal */}
      <ZenMeditateModal
        isOpen={zenModalOpen}
        onClose={() => setZenModalOpen(false)}
      />

      {/* Mobile Tile Action Sheet */}
      <TileActionSheet
        isOpen={actionSheetOpen}
        onClose={() => {
          setActionSheetOpen(false);
          setActionSheetTile(null);
        }}
        tile={actionSheetTile?.tile || null}
        tileName={actionSheetTile?.tile?.name || actionSheetTile?.tile?.type || ''}
        isReady={actionSheetTile?.timer?.isReady || false}
        timeRemaining={actionSheetTile?.timer ? formatTimeRemaining(actionSheetTile.timer.endTime) : undefined}
        onMove={() => {
          if (actionSheetTile) {
            handleMoveTile(actionSheetTile.x, actionSheetTile.y, actionSheetTile.tile);
          }
        }}
        onUpgrade={() => {
          if (actionSheetTile) {
            handleUpgradeTile(actionSheetTile.x, actionSheetTile.y, actionSheetTile.tile);
          }
        }}
        onEnter={actionSheetTile && ['dungeon', 'market', 'quest-board', 'monument', 'tavern', 'castle', 'library', 'training-grounds', 'crystal_cavern'].includes(actionSheetTile.tile.type) ? () => {
          if (actionSheetTile) {
            handleTileClick(actionSheetTile.x, actionSheetTile.y, actionSheetTile.tile);
          }
        } : undefined}
        canUpgrade={actionSheetTile ? !['path', 'dirt-path', 'road', 'cobblestone', 'water', 'grass', 'vacant', 'crossroad', 'straightroad', 'cornerroad', 'tsplitroad'].includes(actionSheetTile.tile.type) : false}
        upgradeCost={actionSheetTile ? (getUpgradeCost(actionSheetTile.tile.type, (actionSheetTile.tile as any).level || 1) || undefined) : undefined}
        currentTier={actionSheetTile ? ((actionSheetTile.tile as any).level || 1) : 1}
        onDelete={() => {
          if (actionSheetTile) {
            handleDeleteTile(actionSheetTile.x, actionSheetTile.y, actionSheetTile.tile);
          }
        }}
        onRotate={() => {
          if (actionSheetTile) {
            handleRotateTile(actionSheetTile.x, actionSheetTile.y, actionSheetTile.tile);
          }
        }}
        onCollect={actionSheetTile?.timer?.isReady ? () => {
          if (actionSheetTile) {
            handleTileClick(actionSheetTile.x, actionSheetTile.y, actionSheetTile.tile);
          }
        } : undefined}
        onCollectAll={handleCollectAllReady}
        hasBatchReady={tileTimers.filter(t => t.isReady).length > 1}
        onMeditate={actionSheetTile?.tile?.type === 'zen-garden' ? () => {
          setZenModalOpen(true);
        } : undefined}
      />
    </div >
  )
}