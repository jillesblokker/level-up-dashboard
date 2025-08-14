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
import { spendGold } from '@/lib/gold-manager'

interface KingdomGridProps {
  grid: Tile[][]
  onTilePlace: (x: number, y: number, tile: Tile) => void
  selectedTile: Tile | null
  setSelectedTile: (tile: Tile | null) => void
  onGridExpand?: () => void
}

export function KingdomGrid({ grid, onTilePlace, selectedTile, setSelectedTile, onGridExpand }: KingdomGridProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const { supabase, isLoading: supabaseLoading } = useSupabase();
  
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const [propertyTab, setPropertyTab] = useState<'place' | 'buy'>('place');
  const [buildTokens, setBuildTokens] = useState(0);
  const [kingdomExpansions, setKingdomExpansions] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('kingdom-grid-expansions') || '0', 10);
    }
    return 0;
  });
  const [playerLevel, setPlayerLevel] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);

  // RESTORE WORKING PROPERTY INVENTORY
  const [propertyInventory, setPropertyInventory] = useState<Tile[]>(() => {
    const tileImageFiles = [
      'Archery.png', 'Blacksmith.png', 'Castle.png', 'Fisherman.png', 'Foodcourt.png', 
      'Fountain.png', 'Grocery.png', 'House.png', 'Inn.png', 'Jousting.png', 
      'Mansion.png', 'Mayor.png', 'Pond.png', 'Sawmill.png', 'Temple.png', 
      'Vegetables.png', 'Watchtower.png', 'Well.png', 'Windmill.png', 'Wizard.png'
    ];
    
    const tileNames: Record<string, string> = {
      Archery: 'Archery', Blacksmith: 'Blacksmith', Castle: 'Castle', Fisherman: 'Fisherman', 
      Foodcourt: 'Foodcourt', Fountain: 'Fountain', Grocery: 'Grocery', House: 'House', 
      Inn: 'Inn', Jousting: 'Jousting', Mansion: 'Mansion', Mayor: 'Mayor', 
      Pond: 'Pond', Sawmill: 'Sawmill', Temple: 'Temple', Vegetables: 'Vegetables', 
      Watchtower: 'Watchtower', Well: 'Well', Windmill: 'Windmill', Wizard: 'Wizard'
    };
    
    return tileImageFiles.map((file: string) => {
      const name = file.replace('.png', '');
      return {
        id: name.toLowerCase(),
        type: name.toLowerCase() as TileType,
        name: tileNames[name] || name,
        description: `A ${name.toLowerCase()} building for your kingdom`,
        connections: [],
        rotation: 0,
        revealed: true,
        isVisited: false,
        x: 0,
        y: 0,
        ariaLabel: `${tileNames[name] || name} property tile`,
        image: `/images/kingdom-tiles/${file}`,
        cost: name === 'Castle' ? 0 : Math.floor(Math.random() * 3) + 1,
        quantity: name === 'Castle' ? 1 : 0, // Only Castle starts with 1, rest start with 0
      };
    });
  });

  // Load build tokens and player level
  useEffect(() => {
    const loadStats = () => {
      try {
        const stats = getCharacterStats();
        const statsData = JSON.parse(localStorage.getItem('character-stats') || '{}');
        // Use the same level calculation as character page and navigation bar
        const currentLevel = calculateLevelFromExperience(stats.experience || statsData.experience || 0);
        const currentBuildTokens = statsData.buildTokens || 0;
        
        setBuildTokens(currentBuildTokens);
        setPlayerLevel(currentLevel);
        
        // Debug logging
        console.log('[Kingdom Grid] === DEBUG INFO ===');
        console.log('[Kingdom Grid] Raw stats:', stats);
        console.log('[Kingdom Grid] Raw statsData:', statsData);
        console.log('[Kingdom Grid] Experience:', stats.experience || statsData.experience || 0);
        console.log('[Kingdom Grid] Calculated level from experience:', currentLevel);
        console.log('[Kingdom Grid] Current kingdom expansions:', kingdomExpansions);
        console.log('[Kingdom Grid] Next expansion level:', 5 + kingdomExpansions * 5);
        console.log('[Kingdom Grid] Can expand:', currentLevel >= (5 + kingdomExpansions * 5));
        console.log('[Kingdom Grid] ===================');
      } catch (error) {
        console.error('[Kingdom Grid] Error loading stats:', error);
        setPlayerLevel(1);
        setBuildTokens(0);
      }
    };
    
    loadStats();
  }, []); // Remove kingdomExpansions dependency to avoid circular updates

  // Listen for character stats updates
  useEffect(() => {
    const handleStatsUpdate = () => {
      console.log('[Kingdom Grid] Stats update event received');
      const stats = getCharacterStats();
      const currentLevel = calculateLevelFromExperience(stats.experience || 0);
      setPlayerLevel(currentLevel);
      console.log('[Kingdom Grid] Updated player level:', currentLevel);
      console.log('[Kingdom Grid] Can expand after update:', currentLevel >= (5 + kingdomExpansions * 5));
    };
    
    window.addEventListener('character-stats-update', handleStatsUpdate);
    return () => window.removeEventListener('character-stats-update', handleStatsUpdate);
  }, [kingdomExpansions]);

  // Force refresh stats when component mounts or expansions change
  useEffect(() => {
    const stats = getCharacterStats();
    const currentLevel = calculateLevelFromExperience(stats.experience || 0);
    console.log('[Kingdom Grid] Force refresh - Level:', currentLevel, 'Expansions:', kingdomExpansions);
  }, [kingdomExpansions]);

  // 🎯 REAL-TIME SUPABASE SUBSCRIPTIONS for kingdom grid updates
  useSupabaseRealtimeSync({
    table: 'kingdom_grid',
    userId: user?.id,
    onChange: () => {
      console.log('[Kingdom Grid] Real-time update received from kingdom_grid table');
      // Trigger grid refresh
      window.dispatchEvent(new Event('kingdom-grid-update'));
    }
  });

  // 🎯 REAL-TIME SUPABASE SUBSCRIPTIONS for property timers
  useSupabaseRealtimeSync({
    table: 'property_timers',
    userId: user?.id,
    onChange: () => {
      console.log('[Kingdom Grid] Real-time update received from property_timers table');
      // Trigger timer refresh
      window.dispatchEvent(new Event('property-timers-update'));
    }
  });

  // RESTORE WORKING BUY PROPERTY FUNCTION
  const handleBuyProperty = async (tile: Tile) => {
    if (buildTokens < (tile.cost || 1)) {
      toast({
        title: "Insufficient Build Tokens",
        description: `You need ${tile.cost} build tokens for ${tile.name}. You have ${buildTokens} tokens.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Spend build tokens
      const success = await spendGold(tile.cost * 1000, 'build-token-purchase');
      if (success) {
        // Update build tokens in localStorage
        const stats = JSON.parse(localStorage.getItem('character-stats') || '{}');
        stats.buildTokens = (stats.buildTokens || 0) + 1;
        localStorage.setItem('character-stats', JSON.stringify(stats));
        setBuildTokens(stats.buildTokens);
        
        // Update property inventory
        setPropertyInventory((prev) => prev.map(t => 
          t.id === tile.id ? { ...t, quantity: (t.quantity || 0) + 1 } : t
        ));
        
        toast({
          title: "Property Purchased!",
          description: `You now own ${tile.name}!`,
        });
      }
    } catch (error) {
      console.error('[Kingdom Grid] Error buying property:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error purchasing the property.",
        variant: "destructive",
      });
    }
  };

  // Expansion gating logic (same as realm map)
  const nextExpansionLevel = 5 + kingdomExpansions * 5;
  const canExpand = playerLevel >= nextExpansionLevel;

  // Manual refresh function for debugging
  const handleManualRefresh = () => {
    const stats = getCharacterStats();
    const currentLevel = calculateLevelFromExperience(stats.experience || 0);
    setPlayerLevel(currentLevel);
    console.log('[Kingdom Grid] Manual refresh - Level:', currentLevel, 'Can expand:', currentLevel >= nextExpansionLevel);
  };

  // Handle tile placement with database sync
  const handleTilePlacement = useCallback(async (x: number, y: number, tile: Tile) => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Call the original onTilePlace function
      onTilePlace(x, y, tile);
      
      // Save to database
      const response = await fetch('/api/kingdom-grid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ grid })
      });
      
      if (!response.ok) {
        console.warn('[Kingdom Grid] Failed to save grid to database');
      } else {
        console.log('[Kingdom Grid] Grid saved to database successfully');
      }
    } catch (error) {
      console.error('[Kingdom Grid] Error saving grid:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, onTilePlace, grid]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4" aria-label="kingdom-grid-container">
      {/* Header with expansion info */}
      <Card className="mb-6 bg-black border-amber-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-amber-500 text-2xl font-bold">Kingdom Grid</CardTitle>
              <CardDescription className="text-gray-300">
                Build your kingdom by placing tiles and expanding your realm
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
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                size="sm"
                aria-label="Refresh kingdom grid stats"
              >
                Refresh
              </Button>
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
              <div className="text-sm text-gray-400">Grid Size</div>
              <div className="text-xl font-bold text-green-500">{grid.length}x{grid[0]?.length || 0}</div>
            </div>
          </div>
          
          {canExpand && onGridExpand && (
            <div className="mt-4 text-center">
              <Button
                onClick={onGridExpand}
                className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900"
                aria-label="Expand kingdom grid"
              >
                🚀 Expand Kingdom Grid
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid Display */}
      <div className="mb-6">
        <div className="grid gap-1" style={{ 
          gridTemplateColumns: `repeat(${grid[0]?.length || 0}, minmax(0, 1fr))` 
        }}>
          {grid.map((row, y) =>
            row.map((tile, x) => (
              <div
                key={`${x}-${y}`}
                className="w-16 h-16 border border-gray-700 bg-gray-800 flex items-center justify-center cursor-pointer hover:border-amber-500 transition-colors"
                onClick={() => selectedTile && handleTilePlacement(x, y, selectedTile)}
                aria-label={`Grid position ${x}, ${y}${tile && tile.type !== 'empty' ? ` - ${tile.type} tile` : ' - empty'}`}
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
              </div>
            ))
          )}
        </div>
      </div>

      {/* RESTORE WORKING PROPERTIES PANEL */}
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
                    {propertyInventory.map(tile => (
                      <div
                        key={tile.id}
                        className="p-3 border border-gray-700 rounded-lg text-center"
                        aria-label={`${tile.name} property tile`}
                      >
                        <img
                          src={tile.image}
                          alt={tile.name}
                          className="w-16 h-16 mx-auto mb-2 object-contain"
                        />
                        <div className="text-sm font-semibold text-white mb-1">{tile.name}</div>
                        <div className="text-sm text-gray-400 mb-2">{tile.description}</div>
                        <div className="text-sm text-amber-200 mb-2">Owned: <span className="font-bold">{tile.quantity || 0}</span></div>
                        <button
                          className={`w-full px-3 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold ${selectedTile?.id === tile.id ? 'bg-amber-800 text-white' : 'bg-gray-800 text-amber-300 hover:bg-amber-700 hover:text-white'}`}
                          aria-label={`Select ${tile.name} to place`}
                          onClick={() => setSelectedTile(tile)}
                          disabled={!tile.quantity || tile.quantity <= 0}
                        >
                          {selectedTile?.id === tile.id ? 'Selected' : 'Place'}
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="buy" className="mt-4">
                <ScrollArea className="h-64">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {propertyInventory.map(tile => (
                      <div
                        key={tile.id}
                        className="p-3 border border-gray-700 rounded-lg text-center"
                        aria-label={`${tile.name} property tile`}
                      >
                        <img
                          src={tile.image}
                          alt={tile.name}
                          className="w-16 h-16 mx-auto mb-2 object-contain"
                        />
                        <div className="text-sm font-semibold text-white mb-1">{tile.name}</div>
                        <div className="text-sm text-gray-400 mb-2">{tile.description}</div>
                                                 <div className="text-sm text-amber-200 mb-2">Cost: <span className="font-bold">{tile.cost || 0}</span> 🏗️</div>
                        <button
                          className="bg-amber-700 text-white px-3 py-2 rounded shadow hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm disabled:opacity-50 w-full"
                          aria-label={`Buy ${tile.name}`}
                          disabled={buildTokens < (tile.cost || 0)}
                          onClick={() => handleBuyProperty(tile)}
                        >
                          Buy
                        </button>
                      </div>
                    ))}
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
            <div className="text-white text-lg mb-2">Saving Kingdom Grid...</div>
            <div className="text-gray-400 text-sm">Please wait while we sync with the database</div>
          </div>
        </div>
      )}
    </div>
  );
} 