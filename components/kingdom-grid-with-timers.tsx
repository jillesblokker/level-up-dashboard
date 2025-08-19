"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { Tile, TileType } from '@/types/tiles'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Sparkles } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { KINGDOM_TILES, getRandomItem, getRandomGold, isLucky as isLuckyTile, getRarityColor } from '@/lib/kingdom-tiles'
import { KingdomTileModal } from './kingdom-tile-modal'
import { useToast } from '@/components/ui/use-toast'
import { getCharacterStats } from '@/lib/character-stats-manager'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { spendGold } from '@/lib/gold-manager'

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
  onItemFound
}: KingdomGridWithTimersProps) {
  const { toast } = useToast()
  const [tileTimers, setTileTimers] = useState<TileTimer[]>([])
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
        const { loadCharacterStats } = await import('@/lib/character-stats-manager')
        const stats = await loadCharacterStats()
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
        const { loadCharacterStats } = await import('@/lib/character-stats-manager')
        const stats = await loadCharacterStats()
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

  // Calculate if kingdom can be expanded
  const nextExpansionLevel = 5 + kingdomExpansions * 5
  const canExpand = playerLevel >= nextExpansionLevel

  // Expand kingdom grid function
  const expandKingdomGrid = () => {
    // Removed debugging logs
    
    if (!canExpand) {
      toast({
        title: 'Expansion Locked',
        description: `Reach level ${nextExpansionLevel} to expand your kingdom! (Current level: ${playerLevel})`,
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
          name: 'Vacant',
          description: 'A vacant plot of land',
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
      import('@/lib/character-stats-manager').then(({ saveCharacterStats }) => {
        saveCharacterStats({ kingdom_expansions: newVal });
      });
      return newVal;
    });

    // Call the callback to update the parent component's grid
    if (onGridExpand) {
      onGridExpand(newGrid);
    }

    toast({
      title: "Kingdom Expanded",
      description: "Your kingdom has been expanded with 3 new rows of vacant land!",
    });
  };

  // Kingdom tile inventory for properties panel
  const [propertyInventory, setPropertyInventory] = useState([
    {
      id: 'archery',
      name: 'Archery',
      image: '/images/kingdom-tiles/Archery.png',
      cost: 150,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'winter-fountain',
      name: 'Winter Fountain',
      image: '/images/kingdom-tiles/WinterFountain.png',
      cost: 200,
      levelRequired: 2,
      costType: 'gold',
      quantity: 0,
      isSeasonal: true,
      eventType: 'winter'
    },
    {
      id: 'snowy-inn',
      name: 'Snowy Inn',
      image: '/images/kingdom-tiles/SnowyInn.png',
      cost: 180,
      levelRequired: 2,
      costType: 'gold',
      quantity: 0,
      isSeasonal: true,
      eventType: 'winter'
    },
    {
      id: 'ice-sculpture',
      name: 'Ice Sculpture',
      image: '/images/kingdom-tiles/IceSculpture.png',
      cost: 150,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: true,
      eventType: 'winter'
    },
    {
      id: 'fireworks-stand',
      name: 'Fireworks Stand',
      image: '/images/kingdom-tiles/FireworksStand.png',
      cost: 160,
      levelRequired: 2,
      costType: 'gold',
      quantity: 0,
      isSeasonal: true,
      eventType: 'winter'
    },
    {
      id: 'pumpkin-patch',
      name: 'Pumpkin Patch',
      image: '/images/kingdom-tiles/PumpkinPatch.png',
      cost: 120,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: true,
      eventType: 'harvest'
    },
    {
      id: 'harvest-barn',
      name: 'Harvest Barn',
      image: '/images/kingdom-tiles/HarvestBarn.png',
      cost: 220,
      levelRequired: 2,
      costType: 'gold',
      quantity: 0,
      isSeasonal: true,
      eventType: 'harvest'
    },
    {
      id: 'bakery',
      name: 'Bakery',
      image: '/images/kingdom-tiles/Bakery.png',
      cost: 140,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: true,
      eventType: 'harvest'
    },
    {
      id: 'brewery',
      name: 'Brewery',
      image: '/images/kingdom-tiles/Brewery.png',
      cost: 180,
      levelRequired: 2,
      costType: 'gold',
      quantity: 0,
      isSeasonal: true,
      eventType: 'harvest'
    },
    {
      id: 'market-stalls',
      name: 'Market Stalls',
      image: '/images/kingdom-tiles/MarketStalls.png',
      cost: 130,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'library',
      name: 'Library',
      image: '/images/kingdom-tiles/Library.png',
      cost: 260,
      levelRequired: 3,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'training-grounds',
      name: 'Training Grounds',
      image: '/images/kingdom-tiles/TrainingGrounds.png',
      cost: 200,
      levelRequired: 2,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'stable',
      name: 'Stable',
      image: '/images/kingdom-tiles/Stable.png',
      cost: 160,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'blacksmith',
      name: 'Blacksmith',
      image: '/images/kingdom-tiles/Blacksmith.png',
      cost: 200,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'fisherman',
      name: 'Fisherman',
      image: '/images/kingdom-tiles/Fisherman.png',
      cost: 120,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'foodcourt',
      name: 'Food Court',
      image: '/images/kingdom-tiles/Foodcourt.png',
      cost: 250,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'fountain',
      name: 'Fountain',
      image: '/images/kingdom-tiles/Fountain.png',
      cost: 180,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'grocery',
      name: 'Grocery',
      image: '/images/kingdom-tiles/Grocery.png',
      cost: 160,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'house',
      name: 'House',
      image: '/images/kingdom-tiles/House.png',
      cost: 100,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'inn',
      name: 'Inn',
      image: '/images/kingdom-tiles/Inn.png',
      cost: 220,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'jousting',
      name: 'Jousting',
      image: '/images/kingdom-tiles/Jousting.png',
      cost: 300,
      levelRequired: 2,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'mansion',
      name: 'Mansion',
      image: '/images/kingdom-tiles/Mansion.png',
      cost: 500,
      levelRequired: 3,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'mayor',
      name: 'Mayor',
      image: '/images/kingdom-tiles/Mayor.png',
      cost: 800,
      levelRequired: 5,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'pond',
      name: 'Pond',
      image: '/images/kingdom-tiles/Pond.png',
      cost: 80,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'sawmill',
      name: 'Sawmill',
      image: '/images/kingdom-tiles/Sawmill.png',
      cost: 280,
      levelRequired: 2,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'temple',
      name: 'Temple',
      image: '/images/kingdom-tiles/Temple.png',
      cost: 600,
      levelRequired: 4,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'vegetables',
      name: 'Vegetables',
      image: '/images/kingdom-tiles/Vegetables.png',
      cost: 60,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'watchtower',
      name: 'Watchtower',
      image: '/images/kingdom-tiles/Watchtower.png',
      cost: 350,
      levelRequired: 2,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'well',
      name: 'Well',
      image: '/images/kingdom-tiles/Well.png',
      cost: 90,
      levelRequired: 1,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'windmill',
      name: 'Windmill',
      image: '/images/kingdom-tiles/Windmill.png',
      cost: 320,
      levelRequired: 2,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'wizard',
      name: 'Wizard',
      image: '/images/kingdom-tiles/Wizard.png',
      cost: 1000,
      levelRequired: 6,
      costType: 'gold',
      quantity: 0,
      isSeasonal: false
    },
    {
      id: 'castle',
      name: 'Castle',
      image: '/images/kingdom-tiles/Castle.png',
      cost: 0,
      levelRequired: 1,
      costType: 'gold',
      quantity: 1, // Start with 1 castle
      isSeasonal: false
    }
  ]);

  // Property placement state
  const [selectedProperty, setSelectedProperty] = useState<typeof propertyInventory[0] | null>(null)
  const [placementMode, setPlacementMode] = useState(false)

  // Filter properties based on event status
  const getAvailableProperties = () => {
    return propertyInventory.filter(property => {
      if (!property.isSeasonal) return true; // Always show non-seasonal properties
      
      if (property.eventType === 'winter') {
        return winterFestivalActive;
      }
      
      if (property.eventType === 'harvest') {
        return harvestFestivalActive;
      }
      
      return false; // Hide seasonal properties when their event is inactive
    });
  };


    // Check if player can place a property
    const canPlaceProperty = (property: typeof propertyInventory[0]) => {
    if (property.costType === 'gold') {
      return (property.quantity || 0) > 0 && playerLevel >= property.levelRequired
    }
    
    return false
    }

  // Handle property selection for placement
  const handlePropertySelect = (property: typeof propertyInventory[0]) => {
    if (!canPlaceProperty(property)) {
      let errorMessage = ''
      if (property.costType === 'gold') {
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

  // Handle buying properties with gold
  const handleBuyProperty = async (property: typeof propertyInventory[0]) => {
    if (property.costType !== 'gold') {
      toast({
        title: 'Cannot Buy',
        description: 'This property cannot be purchased with gold.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const success = await spendGold(property.cost, `purchase-${property.name.toLowerCase()}`);
      if (success) {
        // Update property quantity
        const updatedInventory = propertyInventory.map(p => 
          p.id === property.id ? { ...p, quantity: (p.quantity || 0) + 1 } : p
        );
        
        // Update the property inventory state
        setPropertyInventory(updatedInventory);

        // Persist inventory increment
        try {
          await fetchAuthRetry('/api/tile-inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tile: { id: property.id, type: property.id, name: property.name, quantity: 1, cost: property.cost } })
          })
        } catch (e) {
          console.warn('[Kingdom] Failed to increment inventory', e)
        }

        // Award 1 build token for major purchases (optional rule): disabled
        
        toast({
          title: 'Property Purchased!',
          description: `You now own ${property.name}!`,
        });
      }
    } catch (error) {
      console.error('Error buying property:', error);
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

    // IMPORTANT: Update the local grid state directly instead of using onTilePlace
    // This prevents the property from being treated as an inventory item
    const updatedGrid = grid.map(row => row.slice())
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

    // Decrease property quantity for gold-based properties
    if (selectedProperty.costType === 'gold') {
      const updatedInventory = propertyInventory.map(p => 
        p.id === selectedProperty.id ? { ...p, quantity: Math.max(0, (p.quantity || 0) - 1) } : p
      )
      setPropertyInventory(updatedInventory)
      // Persist inventory decrement
      ;(async () => {
        try {
          const url = `/api/tile-inventory?tileId=${encodeURIComponent(selectedProperty.id)}&quantity=1`
          await fetchAuthRetry(url, { method: 'DELETE' })
        } catch (e) {
          console.warn('[Kingdom] Failed to decrement inventory', e)
        }
      })()
    }

    // Start timer for the new property based on reward value
    const kingdomTile = KINGDOM_TILES.find(kt => kt.id === selectedProperty.id.toLowerCase())
    const timerDuration = kingdomTile ? kingdomTile.timerMinutes * 60 * 1000 : 5 * 60 * 1000 // Use property-specific timer or default to 5 minutes
    
    const newTimer: TileTimer = {
      x,
      y,
      tileId: newTile.id,
      endTime: Date.now() + timerDuration,
      isReady: false
    }

    setTileTimers(prev => [...prev, newTimer])
    // Persist timer to API
    ;(async () => {
      try {
        const endIso = new Date(newTimer.endTime).toISOString()
        await fetchAuthRetry('/api/property-timers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tileId: newTile.id, x, y, tileType: newTile.type, endTime: endIso, isReady: false })
        })
      } catch (e) {
        console.warn('[Kingdom] Failed to persist timer', e)
      }
    })()

    // Reset placement mode
    setSelectedProperty(null)
    setPlacementMode(false)

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
      } catch {}
      // Fallback to localStorage
      try {
        const savedTimers = localStorage.getItem('kingdom-tile-timers')
        if (savedTimers) setTileTimers(JSON.parse(savedTimers))
      } catch {}
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

  // Initialize timers for placed kingdom tiles
  useEffect(() => {
    const newTimers: TileTimer[] = []
    
    grid.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile && tile.type !== 'empty' && tile.type !== 'vacant') {
          const kingdomTile = KINGDOM_TILES.find(kt => kt.id === tile.type.toLowerCase())
          if (kingdomTile) {
            const existingTimer = tileTimers.find(t => t.x === x && t.y === y)
            if (!existingTimer) {
              // Create new timer
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
        }
      })
    })

    if (newTimers.length > 0) {
      setTileTimers(prev => {
        const merged = [...prev, ...newTimers]
        return merged
      })
    }
  }, [grid])

  // Update tile click handler to support property placement
  const handleTileClick = (x: number, y: number, tile: Tile) => {
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
      if (!timer || !timer.isReady) {
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
      ;(async () => {
        try {
          const { gainExperience } = await import('@/lib/experience-manager')
          // Fire and forget
          gainExperience(experienceAwarded, `tile-collect:${kingdomTile.id}`, 'general')
        } catch {}
      })()
      // Basic telemetry: log collect
      ;(async () => {
        try {
          await fetchAuthRetry('/api/kingdom-events/collect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tileId: kingdomTile.id, wasLucky, goldEarned, experienceAwarded })
          })
        } catch {}
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
      ;(async () => {
        try {
          const endIso = new Date(newEndTime).toISOString()
          await fetchAuthRetry('/api/property-timers', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x, y, isReady: false, endTime: endIso })
          })
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
    if (!kingdomTile) return

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
    ;(async () => {
      try {
        const { gainExperience } = await import('@/lib/experience-manager')
        gainExperience(experienceAwarded, `tile-collect:${kingdomTile.id}`, 'general')
      } catch {}
    })()
    ;(async () => {
      try {
        await fetchAuthRetry('/api/kingdom-events/collect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tileId: kingdomTile.id, wasLucky, goldEarned, experienceAwarded })
        })
      } catch {}
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
    ;(async () => {
      try {
        const endIso = new Date(newEndTime).toISOString()
        await fetchAuthRetry('/api/property-timers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x, y, isReady: false, endTime: endIso })
        })
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

  const formatTimeRemaining = (endTime: number) => {
    const now = Date.now()
    const timeLeft = endTime - now
    
    if (timeLeft <= 0) return 'Ready!'
    
    const minutes = Math.floor(timeLeft / 60000)
    const seconds = Math.floor((timeLeft % 60000) / 1000)
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const renderGridWithBorder = () => {
    const rows = grid.length
    const cols = grid[0]?.length || 6

    return (
      <div
        className="grid gap-0 border-4 border-gray-700 rounded-lg overflow-hidden shadow-2xl"
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
        {Array.from({ length: rows }).map((_, y) =>
          Array.from({ length: cols }).map((_, x) => {
            const tile = grid[y]?.[x]
            const timer = tileTimers.find(t => t.x === x && t.y === y)
            const kingdomTile = tile ? KINGDOM_TILES.find(kt => 
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
                  src={isKingdomTile && kingdomTile ? kingdomTile.image : tile.image}
                  alt={tile.name}
                  fill
                  className="object-cover"
                  draggable={false}
                  unoptimized
                  onError={(e) => { e.currentTarget.src = '/images/placeholders/item-placeholder.svg' }}
                />
                
                {/* Placement mode indicator for vacant tiles */}
                {placementMode && tile.type === 'vacant' && (
                  <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                    <div className="bg-amber-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
                      Place {selectedProperty?.name}
                    </div>
                  </div>
                )}
                
                {/* Timer overlay for kingdom tiles - hover only to reduce clutter */}
                {isKingdomTile && timer && (
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
      
      {/* Side panel for properties */}
      {propertiesOpen && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-gray-900 z-50 shadow-lg border-l border-amber-800/40 flex flex-col" role="dialog" aria-modal="true" aria-label="Properties side panel">
          <div className="flex justify-between items-center p-4 border-b border-amber-800/20">
            <h3 className="text-2xl font-bold text-amber-400">Properties</h3>
            <button onClick={() => setPropertiesOpen(false)} className="text-amber-400 hover:text-amber-200 text-2xl bg-black/40 rounded-full w-10 h-10 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500" aria-label="Close properties panel">×</button>
          </div>
          <div className="px-4 pt-2 pb-0">
            <div className="text-lg font-bold text-amber-300 mb-2 flex items-center justify-between">
              <span><a href="/quests" className="text-blue-800 hover:text-blue-700 underline cursor-pointer">Streak</a> tokens: <span className="text-amber-400">{buildTokens}</span></span>
              <Button
                onClick={async () => {
                  try {
                    const success = await spendGold(1000, 'build-token-purchase');
                    if (success) {
                    setBuildTokens(prev => {
                      const newVal = (prev || 0) + 1;
                      import('@/lib/character-stats-manager').then(({ saveCharacterStats }) => {
                        saveCharacterStats({ build_tokens: newVal });
                      });
                      return newVal;
                    });
                    }
                  } catch (error) {
                    console.error('Error purchasing build token:', error);
                  }
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 text-sm"
                disabled={(() => {
                  const stats = JSON.parse(localStorage.getItem('character-stats') || '{}');
                  return (stats.gold || 0) < 1000;
                })()}
              >
                Buy (1000g)
              </Button>
            </div>
            {/* Tabs for Place and Buy */}
            <div className="flex gap-2 mb-4">
              <button
                className={`flex-1 py-2 rounded-t bg-gray-800 text-amber-300 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 ${propertyTab === 'place' ? 'bg-amber-800 text-white' : ''}`}
                aria-label="Place properties tab"
                onClick={() => setPropertyTab('place')}
              >
                Place
              </button>
              <button
                className={`flex-1 py-2 rounded-t bg-gray-800 text-amber-300 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 ${propertyTab === 'buy' ? 'bg-amber-800 text-white' : ''}`}
                aria-label="Buy properties tab"
                onClick={() => setPropertyTab('buy')}
              >
                Buy
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {propertyTab === 'place' ? (
              // Place tab - show properties you own
            <div className="grid grid-cols-2 gap-6">
              {getAvailableProperties().map(tile => {
                const canPlace = canPlaceProperty(tile)
                
                return (
                  <button
                    key={tile.id}
                    className={`relative flex flex-col items-center border border-amber-800/30 bg-black/60 rounded-xl p-3 shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      canPlace 
                        ? 'hover:border-amber-500/50 hover:shadow-amber-500/20 cursor-pointer' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => canPlace && handlePropertySelect(tile)}
                    disabled={!canPlace}
                    aria-label={`Select ${tile.name} for placement`}
                  >
                    <div className="relative w-full aspect-square mb-3">
                      <Image
                        src={tile.image.startsWith('/') ? tile.image : `/images/kingdom-tiles/${tile.image}`}
                        alt={tile.name}
                        fill
                        className="object-contain rounded-xl"
                        draggable={false}
                        unoptimized
                      />
                      {/* Level requirement badge */}
                      {tile.levelRequired > 1 && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          Lv.{tile.levelRequired}
                        </div>
                      )}
                        {/* Quantity badge */}
                        <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                          {tile.quantity || 0}
                      </div>
                    </div>
                    <div className="text-base font-bold text-amber-300 text-center truncate w-full mb-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate">{tile.name}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-center">
                            <div className="font-bold">{tile.name}</div>
                              <div className="text-sm text-gray-300">
                                Owned: {tile.quantity || 0}
                              </div>
                            {tile.levelRequired > 1 && (
                              <div className="text-sm text-blue-300">
                                Requires Level {tile.levelRequired}
                              </div>
                            )}
                            {!canPlace && (
                              <div className="text-sm text-red-300 mt-1">
                                  {tile.quantity <= 0 ? 'Buy this property first!' : `Need Level ${tile.levelRequired}`}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-sm text-amber-400 text-center">
                      Click to place
                    </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              // Buy tab - show properties for purchase
              <div className="grid grid-cols-2 gap-6">
                {getAvailableProperties().map(tile => (
                  <button
                    key={tile.id}
                    className="relative flex flex-col items-center border border-amber-800/30 bg-black/60 rounded-xl p-3 shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 hover:border-amber-500/50 hover:shadow-amber-500/20 cursor-pointer"
                    onClick={() => handleBuyProperty(tile)}
                    aria-label={`Buy ${tile.name}`}
                  >
                    <div className="relative w-full aspect-square mb-3">
                      <Image
                        src={tile.image.startsWith('/') ? tile.image : `/images/kingdom-tiles/${tile.image}`}
                        alt={tile.name}
                        fill
                        className="object-contain rounded-xl"
                        draggable={false}
                        unoptimized
                      />
                      {/* Level requirement badge */}
                      {tile.levelRequired > 1 && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          Lv.{tile.levelRequired}
                        </div>
                      )}
                      {/* Cost badge */}
                      <div className="absolute top-2 left-2 bg-amber-600 text-white text-xs px-2 py-1 rounded-full">
                        {tile.cost}g
                        </div>
                      {/* Quantity badge */}
                      <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                        Owned: {tile.quantity || 0}
                      </div>
                    </div>
                    <div className="text-base font-bold text-amber-300 text-center truncate w-full mb-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate">{tile.name}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-center">
                            <div className="font-bold">{tile.name}</div>
                            <div className="text-sm text-gray-300">
                              Cost: {tile.cost} gold
                            </div>
                            <div className="text-sm text-green-300">
                              Owned: {tile.quantity || 0}
                            </div>
                            {tile.levelRequired > 1 && (
                              <div className="text-sm text-blue-300">
                                Requires Level {tile.levelRequired}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-sm text-amber-400 text-center">
                      Click to buy
                    </div>
                    {tile.isSeasonal && (
                      <div className="text-xs text-blue-400 text-center mt-1">
                        Seasonal Tile
                      </div>
                    )}
                  </button>
                ))}
            </div>
            )}
          </div>
        </div>
      )}
      
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