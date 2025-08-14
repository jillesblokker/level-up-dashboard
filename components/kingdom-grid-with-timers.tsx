"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { useUser } from '@clerk/nextjs'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useSupabaseRealtimeSync } from '@/hooks/useSupabaseRealtimeSync'
import { getCharacterStats } from '@/lib/character-stats-manager'
import { calculateLevelFromExperience } from '@/types/character'
import { Tile, TileType } from '@/types/tiles'
import { gainGold } from '@/lib/gold-manager'

interface TileTimer {
  id: string
  x: number
  y: number
  tileType: string
  endTime: number
  isReady: boolean
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
  const { user } = useUser()
  const { supabase, isLoading: supabaseLoading } = useSupabase()
  
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
  const [isLoading, setIsLoading] = useState(false)

  // Load kingdom expansions from localStorage on mount
  useEffect(() => {
    const savedExpansions = localStorage.getItem('kingdom-grid-expansions')
    if (savedExpansions) {
      setKingdomExpansions(parseInt(savedExpansions, 10))
    }
  }, [])

  // Load build tokens from localStorage on mount
  useEffect(() => {
    const stats = JSON.parse(localStorage.getItem('character-stats') || '{}')
    setBuildTokens(stats.buildTokens || 0)
  }, [])

  // Calculate player level and expansion requirements
  useEffect(() => {
    const stats = getCharacterStats()
    const currentLevel = calculateLevelFromExperience(stats.experience || 0)
    setPlayerLevel(currentLevel)
  }, [])

  // Calculate if kingdom can be expanded
  const nextExpansionLevel = 5 + kingdomExpansions * 5
  const canExpand = playerLevel >= nextExpansionLevel

  // 🎯 REAL-TIME SUPABASE SUBSCRIPTIONS for property timers
  useSupabaseRealtimeSync({
    table: 'property_timers',
    userId: user?.id,
    onChange: () => {
      console.log('[Kingdom Grid With Timers] Real-time update received from property_timers table');
      loadPropertyTimers();
    }
  });

  // 🎯 REAL-TIME SUPABASE SUBSCRIPTIONS for kingdom grid updates
  useSupabaseRealtimeSync({
    table: 'kingdom_grid',
    userId: user?.id,
    onChange: () => {
      console.log('[Kingdom Grid With Timers] Real-time update received from kingdom_grid table');
      // Trigger grid refresh
      window.dispatchEvent(new Event('kingdom-grid-update'));
    }
  });

  // Load property timers from database
  const loadPropertyTimers = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/property-timers', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const timers = data.data.map((timer: any) => ({
            id: timer.id,
            x: timer.x,
            y: timer.y,
            tileType: timer.tile_type,
            endTime: new Date(timer.end_time).getTime(),
            isReady: timer.is_ready
          }));
          setTileTimers(timers);
        }
      }
    } catch (error) {
      console.error('[Kingdom Grid With Timers] Error loading property timers:', error);
    }
  }, [user?.id]);

  // Load timers on mount
  useEffect(() => {
    loadPropertyTimers();
  }, [loadPropertyTimers]);

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTileTimers(prev => 
        prev.map(timer => ({
          ...timer,
          isReady: Date.now() >= timer.endTime
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Expand kingdom grid function
  const expandKingdomGrid = () => {
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
    
    // Add 3 new rows with grass tiles
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
      localStorage.setItem('kingdom-grid-expansions', String(newVal));
      return newVal;
    });

    // Call the callbacks to update the parent component's grid
    if (onGridExpand) {
      onGridExpand(newGrid);
    }
    if (onGridUpdate) {
      onGridUpdate(newGrid);
    }

    toast({
      title: "Kingdom Expanded",
      description: "Your kingdom has been expanded with 3 new rows of vacant land!",
    });
  };

  // RESTORE WORKING PROPERTY INTERACTION SYSTEM
  const handleTileClick = async (x: number, y: number, tile: Tile) => {
    // If in placement mode, handle property placement
    if (selectedTile) {
      await handlePropertyPlacement(x, y);
      return;
    }

    // Check if this is a kingdom property tile that can earn rewards
    if (tile.type === 'empty' || tile.type === 'vacant') {
      return; // Can't interact with empty tiles
    }

    // Check if tile is ready for collection
    const timer = tileTimers.find(t => t.x === x && t.y === y);
    if (!timer || !timer.isReady) {
      toast({
        title: "Property Not Ready",
        description: "This property is still producing. Wait for the timer to finish.",
        variant: "destructive",
      });
      return;
    }

    // Generate rewards based on tile type
    const rewards = generatePropertyRewards(tile.type);
    
    // Update timer in database to reset it
    await updateTimerInDatabase(x, y, false);

    // Show reward modal
    setModalData({
      tileName: tile.name,
      goldEarned: rewards.gold,
      itemFound: rewards.item,
      isLucky: rewards.isLucky,
      message: rewards.message
    });
    setShowModal(true);

    // Trigger callbacks
    if (onGoldEarned) onGoldEarned(rewards.gold);
    if (onItemFound && rewards.item) {
      onItemFound(rewards.item);
    }

    // Gain gold
    await gainGold(rewards.gold, `kingdom-${tile.type.toLowerCase()}`);

    // Show success toast
    toast({
      title: "Property Collected!",
      description: `You earned ${rewards.gold} gold from ${tile.name}!`,
    });
  };

  // Generate rewards for different property types
  const generatePropertyRewards = (tileType: string) => {
    const baseRewards: Record<string, { gold: number; message: string; itemChance: number }> = {
      'house': { gold: 50, message: 'Your house provides steady income!', itemChance: 0.1 },
      'castle': { gold: 200, message: 'Your castle generates significant wealth!', itemChance: 0.3 },
      'blacksmith': { gold: 75, message: 'The blacksmith forges valuable items!', itemChance: 0.2 },
      'inn': { gold: 60, message: 'Travelers bring gold to your inn!', itemChance: 0.15 },
      'temple': { gold: 80, message: 'Worshippers donate to your temple!', itemChance: 0.25 },
      'default': { gold: 40, message: 'Your property generates income!', itemChance: 0.05 }
    };

    const reward = baseRewards[tileType.toLowerCase()] || baseRewards['default'];
    if (!reward) return { gold: 0, item: undefined, isLucky: false, message: 'No reward available' };
    
    const isLucky = Math.random() < 0.1; // 10% chance for lucky bonus
    const goldEarned = isLucky ? reward.gold * 2 : reward.gold;
    
    // Check if item is found
    let item = undefined;
    if (Math.random() < reward.itemChance) {
      item = {
        image: `/images/items/${tileType.toLowerCase()}-item.png`,
        name: `${tileType} Item`,
        type: 'treasure'
      };
    }

    return {
      gold: goldEarned,
      item,
      isLucky,
      message: reward.message
    };
  };

  // Handle property placement with database sync
  const handlePropertyPlacement = async (x: number, y: number) => {
    if (!selectedTile || !user?.id) return;
    
    setIsLoading(true);
    try {
      // Call the original onTilePlace function
      onTilePlace(x, y, selectedTile);
      
      // Create timer in database
      const timerEndTime = Date.now() + 60 * 60 * 1000; // Default 1 hour timer
      
      const response = await fetch('/api/property-timers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tileId: selectedTile.id,
          x,
          y,
          tileType: selectedTile.type,
          endTime: new Date(timerEndTime).toISOString(),
          isReady: false
        })
      });
      
      if (!response.ok) {
        console.warn('[Kingdom Grid With Timers] Failed to create timer in database');
      } else {
        console.log('[Kingdom Grid With Timers] Timer created in database successfully');
        // Refresh timers
        loadPropertyTimers();
      }
      
      // Clear selected tile
      setSelectedTile(null);
      
    } catch (error) {
      console.error('[Kingdom Grid With Timers] Error placing property:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update timer in database
  const updateTimerInDatabase = async (x: number, y: number, isReady: boolean) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch('/api/property-timers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          x,
          y,
          isReady,
          endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
        })
      });
      
      if (!response.ok) {
        console.warn('[Kingdom Grid With Timers] Failed to update timer in database');
      }
    } catch (error) {
      console.error('[Kingdom Grid With Timers] Error updating timer:', error);
    }
  };

  const formatTimeRemaining = (endTime: number) => {
    const now = Date.now();
    const timeRemaining = Math.max(0, endTime - now);
    
    if (timeRemaining === 0) return 'Ready!';
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4" aria-label="kingdom-grid-with-timers-container">
      {/* Header with expansion info */}
      <Card className="mb-6 bg-black border-amber-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-amber-500 text-2xl font-bold">Kingdom Grid with Timers</CardTitle>
              <CardDescription className="text-gray-300">
                Build your kingdom and collect rewards from ready properties
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-sm text-gray-400">Level Required</div>
                <div className="text-lg font-bold text-amber-500">{nextExpansionLevel}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Your Level</div>
                <div className={`text-lg font-bold ${playerLevel >= nextExpansionLevel ? 'text-green-500' : 'text-red-500'}`}>
                  {playerLevel}
                </div>
              </div>
              {canExpand && onGridExpand && (
                <Button
                  onClick={expandKingdomGrid}
                  className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900"
                  aria-label="Expand kingdom grid"
                >
                  🚀 Expand Kingdom Grid
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-400">Build Tokens</div>
              <div className="text-xl font-bold text-amber-500">{buildTokens}</div>
            </div>
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-400">Expansions</div>
              <div className="text-xl font-bold text-blue-500">{kingdomExpansions}</div>
            </div>
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-400">Active Timers</div>
              <div className="text-xl font-bold text-green-500">{tileTimers.filter(t => !t.isReady).length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Display with Timers */}
      <div className="mb-6">
        <div className="grid gap-1" style={{ 
          gridTemplateColumns: `repeat(${grid[0]?.length || 0}, minmax(0, 1fr))` 
        }}>
          {grid.map((row, y) =>
            row.map((tile, x) => {
              const timer = tileTimers.find(t => t.x === x && t.y === y);
              const isReady = timer?.isReady || false;
              
              return (
                <div
                  key={`${x}-${y}`}
                  className={`relative w-16 h-16 border border-gray-700 bg-gray-800 flex items-center justify-center cursor-pointer hover:border-amber-500 transition-colors ${
                    isReady ? 'ring-2 ring-green-500' : ''
                  }`}
                  onClick={() => handleTileClick(x, y, tile)}
                  aria-label={`Grid position ${x}, ${y}${tile && tile.type !== 'empty' ? ` - ${tile.type} tile` : ' - empty'}${isReady ? ' - Ready for collection' : ''}`}
                  role="button"
                  tabIndex={0}
                >
                  {tile && tile.type !== 'empty' ? (
                    <img
                      src={tile.image || `/images/kingdom-tiles/${tile.type}.png`}
                      alt={tile.type}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-700 rounded opacity-50" />
                  )}
                  
                  {/* Timer overlay */}
                  {timer && (
                    <div className="absolute -top-2 -right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full">
                      {formatTimeRemaining(timer.endTime)}
                    </div>
                  )}
                  
                  {/* Ready indicator */}
                  {isReady && (
                    <div className="absolute -top-1 -left-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      ✓
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Properties Panel */}
      {propertiesOpen && (
        <Card className="bg-black border-amber-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-amber-500">Properties</CardTitle>
              <Button
                onClick={() => setPropertiesOpen(false)}
                variant="outline"
                size="sm"
                aria-label="Close properties panel"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={propertyTab} onValueChange={(value) => setPropertyTab(value as 'place' | 'buy')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="place" aria-label="Place tiles tab">Place</TabsTrigger>
                <TabsTrigger value="buy" aria-label="Buy tiles tab">Buy</TabsTrigger>
              </TabsList>
              
              <TabsContent value="place" className="mt-4">
                <ScrollArea className="h-64">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Property inventory would go here */}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Properties Toggle Button */}
      <div className="text-center">
        <Button
          onClick={() => setPropertiesOpen(!propertiesOpen)}
          variant="outline"
          className="bg-amber-800 text-white hover:bg-amber-700"
          aria-label="Toggle properties panel"
        >
          {propertiesOpen ? 'Hide Properties' : 'Show Properties'}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <div className="text-white text-lg mb-2">Processing...</div>
            <div className="text-gray-400 text-sm">Please wait while we sync with the database</div>
          </div>
        </div>
      )}
    </div>
  );
} 