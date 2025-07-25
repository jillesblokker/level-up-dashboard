"use client"

import React from "react";
import Image from "next/image";
import { Tile, TileType } from '@/types/tiles';
import { cn } from '@/lib/utils';
import { useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getCharacterStats } from '@/lib/character-stats-manager'
import { toast } from '@/components/ui/use-toast'
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const tileImageFiles = [
  'Archery.png', 'Blacksmith.png', 'Castle.png', 'Fisherman.png', 'Foodcourt.png', 'Fountain.png', 'Grocery.png', 'House.png', 'Inn.png', 'Jousting.png', 'Mansion.png', 'Mayor.png', 'Pond.png', 'Sawmill.png', 'Temple.png', 'Vegetables.png', 'Watchtower.png', 'Well.png', 'Windmill.png', 'Wizard.png',
];
const tileNames: Record<string, string> = {
  Archery: 'Archery', Blacksmith: 'Blacksmith', Castle: 'Castle', Fisherman: 'Fisherman', Foodcourt: 'Foodcourt', Fountain: 'Fountain', Grocery: 'Grocery', House: 'House', Inn: 'Inn', Jousting: 'Jousting', Mansion: 'Mansion', Mayor: 'Mayor', Pond: 'Pond', Sawmill: 'Sawmill', Temple: 'Temple', Vegetables: 'Vegetables', Watchtower: 'Watchtower', Well: 'Well', Windmill: 'Windmill', Wizard: 'Wizard',
};

interface KingdomGridProps {
  grid: Tile[][];
  onTilePlace: (x: number, y: number, tile: Tile) => void;
  selectedTile: Tile | null;
  setSelectedTile: (tile: Tile | null) => void;
  onGridExpand?: (newGrid: Tile[][]) => void; // Add callback for grid expansion
}

export function KingdomGrid({ grid, onTilePlace, selectedTile, setSelectedTile, onGridExpand }: KingdomGridProps) {
  const wallImage = '/images/kingdom-tiles/Wall.png';
  const wallTile = {
    id: 'wall',
    name: 'Wall',
    image: wallImage,
    cost: 0,
    quantity: 0
  };

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

  // Dynamically generate property inventory
  const [propertyInventory, setPropertyInventory] = useState<Tile[]>(() => {
    return tileImageFiles.map((file) => {
      const name = file.replace('.png', '');
      return {
        id: name.toLowerCase(),
        type: name.toLowerCase() as TileType,
        name: tileNames[name] || name,
        description: '',
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
    const stats = getCharacterStats();
    const statsData = JSON.parse(localStorage.getItem('character-stats') || '{}');
    setBuildTokens(statsData.buildTokens || 0);
    setPlayerLevel(stats.level || 1);
  }, []);

  // Handler for buying a property tile
  const handleBuyProperty = (tile: Tile) => {
    if (buildTokens < (tile.cost || 1)) return;
    setBuildTokens((prev: number) => {
      const newTokens = prev - (tile.cost || 1);
      if (typeof window !== 'undefined') {
        const stats = JSON.parse(localStorage.getItem('character-stats') || '{}');
        stats.buildTokens = newTokens;
        localStorage.setItem('character-stats', JSON.stringify(stats));
      }
      return newTokens;
    });
    setPropertyInventory((prev) => prev.map(t => t.id === tile.id ? { ...t, quantity: (t.quantity || 0) + 1 } : t));
  };

  // Expansion gating logic (same as realm map)
  const nextExpansionLevel = 5 + kingdomExpansions * 5;
  const canExpand = playerLevel >= nextExpansionLevel;

  // Expand kingdom grid function
  const expandKingdomGrid = () => {
    if (!canExpand) {
      toast({
        title: 'Expansion Locked',
        description: `Reach level ${nextExpansionLevel} to expand your kingdom!`,
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
          id: `grass-${x}-${y}`,
          name: 'Grass',
          description: 'A patch of green grass',
          type: 'grass',
          image: '/images/kingdom-tiles/Grass.png',
          cost: 0,
          quantity: 0,
          x,
          y,
          connections: [],
          rotation: 0,
          revealed: true,
          isVisited: false,
          ariaLabel: 'Grass tile'
        };
      }
    }
    
    // Update expansion count
    setKingdomExpansions((prev: number) => {
      const newVal = prev + 1;
      localStorage.setItem('kingdom-grid-expansions', String(newVal));
      return newVal;
    });

    // Call the callback to update the parent component's grid
    if (onGridExpand) {
      onGridExpand(newGrid);
    }

    toast({
      title: "Kingdom Expanded",
      description: "Your kingdom has been expanded with 3 new rows of grass!",
    });
  };

  // Keyboard shortcut for opening properties
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        setPropertiesOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // 🎯 LISTEN FOR BUILD TOKEN UPDATES from quest completion
    const handleBuildTokensGained = (event: CustomEvent) => {
      console.log('[Kingdom Grid] Build tokens gained from quest:', event.detail);
      // Refresh build tokens from localStorage
      const stats = JSON.parse(localStorage.getItem('character-stats') || '{}');
      setBuildTokens(stats.buildTokens || 0);
    };
    
    const handleStatsUpdate = () => {
      // Refresh build tokens when character stats update
      const stats = JSON.parse(localStorage.getItem('character-stats') || '{}');
      setBuildTokens(stats.buildTokens || 0);
    };
    
    window.addEventListener('kingdom:buildTokensGained', handleBuildTokensGained as EventListener);
    window.addEventListener('character-stats-update', handleStatsUpdate);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('kingdom:buildTokensGained', handleBuildTokensGained as EventListener);
      window.removeEventListener('character-stats-update', handleStatsUpdate);
    };
  }, []);

  // --- GRID WITH BORDER LOGIC ---
  const renderGridWithBorder = () => {
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    return (
      <div
        className="grid gap-0 border-5 border-gray-700"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          width: '100%',
          height: '100%',
          aspectRatio: '1/1',
          background: 'none',
          border: '20px solid #374151', // dark grey border
        }}
        aria-label="thrivehaven-grid"
      >
        {Array.from({ length: rows }).map((_, y) =>
          Array.from({ length: cols }).map((_, x) => {
            const tile = grid[y]?.[x];
            if (!tile) {
              return <div key={`empty-${x}-${y}`} className="w-full h-full aspect-square bg-black/40" />;
            }
            return (
              <button
                key={`tile-${x}-${y}`}
                className={cn(
                  "relative w-full h-full aspect-square bg-black/60 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500",
                  selectedTile && propertiesOpen && "ring-2 ring-amber-500"
                )}
                aria-label={tile.ariaLabel || tile.name || `Tile ${x},${y}`}
                onClick={() => {
                  if (selectedTile && (selectedTile.quantity || 0) > 0) {
                    onTilePlace(x, y, selectedTile);
                  }
                }}
                style={{ minWidth: 0, minHeight: 0, borderRadius: 0, margin: 0, padding: 0 }}
              >
                <Image
                  src={tile.image}
                  alt={tile.name}
                  fill
                  className="object-cover"
                  draggable={false}
                  unoptimized
                  onError={(e) => { e.currentTarget.src = '/images/placeholders/item-placeholder.svg'; }}
                />
              </button>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center" style={{ padding: 0, margin: 0 }}>
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Floating + button in top right corner of grid */}
        <button
          className="absolute top-4 right-4 z-20 w-12 h-12 bg-amber-700 text-white rounded-full shadow-lg flex items-center justify-center text-3xl font-bold hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Open properties panel"
          onClick={() => setPropertiesOpen(true)}
        >
          +
        </button>
        {/* Floating expand button below the + button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="absolute top-20 right-4 z-20 w-12 h-12 bg-amber-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl font-bold hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Expand kingdom grid"
              onClick={expandKingdomGrid}
              disabled={!canExpand}
            >
              🏗️
            </button>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="bg-gray-900 text-white border-amber-800/30"
          >
            {canExpand 
              ? 'Expand your kingdom to unlock 3 more rows' 
              : `Become level ${nextExpansionLevel} to unlock 3 more rows`
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
                onClick={() => {
                  const stats = JSON.parse(localStorage.getItem('character-stats') || '{}');
                  if (stats.gold >= 1000) {
                    stats.gold -= 1000;
                    stats.buildTokens = (stats.buildTokens || 0) + 1;
                    localStorage.setItem('character-stats', JSON.stringify(stats));
                    setBuildTokens(stats.buildTokens);
                    // Trigger gold update event
                    window.dispatchEvent(new CustomEvent('goldUpdate', { detail: stats.gold }));
                  } else {
                    // Show error toast or alert
                    alert('You need 1000 gold to buy a build token!');
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
            <div className="grid grid-cols-2 gap-6">
              {propertyInventory.map(tile => (
                <div key={tile.id} className="relative flex flex-col items-center border border-amber-800/30 bg-black/60 rounded-xl p-3 shadow-lg">
                  <div className="relative w-full aspect-square mb-3">
                    <Image
                      src={tile.image.startsWith('/') ? tile.image : `/images/kingdom-tiles/${tile.image}`}
                      alt={tile.name}
                      fill
                      className="object-contain rounded-xl"
                      draggable={false}
                      unoptimized
                    />
                  </div>
                  <div className="text-base font-bold text-amber-300 text-center truncate w-full mb-1">{tile.name}</div>
                  <div className="text-sm text-amber-200 mb-1">Cost: <span className="font-bold">{tile.cost}</span> 🏗️</div>
                  <div className="text-sm text-amber-200 mb-2">Owned: <span className="font-bold">{tile.quantity || 0}</span></div>
                  {propertyTab === 'buy' ? (
                    <button
                      className="bg-amber-700 text-white px-3 py-2 rounded shadow hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm disabled:opacity-50 w-full"
                      aria-label={`Buy ${tile.name}`}
                      disabled={buildTokens < (tile.cost || 1)}
                      onClick={() => handleBuyProperty(tile)}
                    >
                      Buy
                    </button>
                  ) : (
                    <button
                      className={`w-full px-3 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold ${selectedTile?.id === tile.id ? 'bg-amber-800 text-white' : 'bg-gray-800 text-amber-300 hover:bg-amber-700 hover:text-white'}`}
                      aria-label={`Select ${tile.name} to place`}
                      onClick={() => setSelectedTile(tile)}
                    >
                      {selectedTile?.id === tile.id ? 'Selected' : 'Place'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PropertiesOverlayProps {
  open: boolean;
  onClose: () => void;
  inventory: Tile[];
  selectedTile: Tile | null;
  setSelectedTile: (tile: Tile | null) => void;
}

export function PropertiesOverlay({ open, onClose, inventory, selectedTile, setSelectedTile }: PropertiesOverlayProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" role="dialog" aria-modal="true" aria-label="Properties overlay">
      <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-amber-400 hover:text-amber-200 text-2xl" aria-label="Close properties overlay">×</button>
        <h3 className="text-lg font-bold text-amber-500 mb-4">Properties</h3>
        <div className="grid grid-cols-3 gap-4">
          {inventory.map(tile => (
            <button
              key={tile.id}
              className={cn(
                "w-20 h-20 border border-amber-800/30 bg-black/60 flex items-center justify-center focus:outline-none",
                selectedTile?.id === tile.id && "ring-2 ring-amber-500"
              )}
              aria-label={`Select ${tile.name}`}
              onClick={() => setSelectedTile(tile)}
            >
              <Image
                src={tile.image}
                alt={tile.name}
                fill
                className="object-contain rounded"
                draggable={false}
                unoptimized
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 