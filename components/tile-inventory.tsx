"use client";

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { TileType, InventoryItem } from "@/types/tiles"
import { spendGold } from "@/lib/gold-manager"
import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addTileToInventory } from "@/lib/tile-inventory-manager"
import { useUser } from "@clerk/nextjs"


interface TileInventoryProps {
  tiles: InventoryItem[]
  selectedTile: InventoryItem | null
  onSelectTile: (tile: InventoryItem | null) => void
  onUpdateTiles: (tiles: InventoryItem[]) => void
  activeTab: 'place' | 'buy'
  setActiveTab: (tab: 'place' | 'buy') => void
  onOutOfTiles?: (tile: InventoryItem) => void
}

export function TileInventory({ tiles, selectedTile, onSelectTile, onUpdateTiles, activeTab, setActiveTab, onOutOfTiles }: TileInventoryProps) {
  const { user } = useUser();
  const [buyQuantities, setBuyQuantities] = useState<{ [key: string]: number }>({})
  const [selectedCategory, setSelectedCategory] = useState<string>('foundation')

  // Tile categories based on level requirements
  const tileCategories = [
    {
      id: 'foundation',
      name: 'Foundation Tiles',
      minLevel: 0,
      maxLevel: 20,
      description: 'Basic terrain and natural elements',
      tiles: ['grass', 'forest', 'mountain', 'water']
    },
    {
      id: 'settlement',
      name: 'Settlement Tiles',
      minLevel: 20,
      maxLevel: 40,
      description: 'Small communities and basic infrastructure',
      tiles: ['town', 'city', 'desert', 'ice']
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
      id: 'legendary',
      name: 'Legendary Tiles',
      minLevel: 80,
      maxLevel: 100,
      description: 'Epic structures and unique features',
      tiles: ['mystery', 'special', 'treasure', 'monster']
    }
  ];

  // Get user level from character stats
  const [userLevel, setUserLevel] = useState(1);
  
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
    
    loadUserLevel();
  }, []);

  // Create a comprehensive list of all possible tiles
  const allPossibleTiles: InventoryItem[] = [
    // Foundation Tiles (Level 0-20)
    { id: 'grass', name: 'Grass', type: 'grass', quantity: 0, cost: 25, connections: [], description: 'Basic terrain', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Grass tile', image: '/images/tiles/grass-tile.png' },
    { id: 'water', name: 'Water', type: 'water', quantity: 0, cost: 50, connections: [], description: 'Water body', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Water tile', image: '/images/tiles/water-tile.png' },
    { id: 'forest', name: 'Forest', type: 'forest', quantity: 0, cost: 75, connections: [], description: 'Dense woodland', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Forest tile', image: '/images/tiles/forest-tile.png' },
    { id: 'mountain', name: 'Mountain', type: 'mountain', quantity: 0, cost: 100, connections: [], description: 'Rocky terrain', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Mountain tile', image: '/images/tiles/mountain-tile.png' },
    
    // Settlement Tiles (Level 20-40)
    { id: 'town', name: 'Town', type: 'town', quantity: 0, cost: 200, connections: [], description: 'Small settlement', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Town tile', image: '/images/tiles/town-tile.png' },
    { id: 'city', name: 'City', type: 'city', quantity: 0, cost: 500, connections: [], description: 'Large settlement', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'City tile', image: '/images/tiles/city-tile.png' },
    { id: 'desert', name: 'Desert', type: 'desert', quantity: 0, cost: 150, connections: [], description: 'Arid terrain', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Desert tile', image: '/images/tiles/desert-tile.png' },
    { id: 'ice', name: 'Ice', type: 'ice', quantity: 0, cost: 300, connections: [], description: 'Frozen terrain', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Ice tile', image: '/images/tiles/ice-tile.png' },
    
    // Development Tiles (Level 40-60)
    { id: 'castle', name: 'Castle', type: 'castle', quantity: 0, cost: 1000, connections: [], description: 'Fortified structure', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Castle tile', image: '/images/tiles/castle-tile.png' },
    { id: 'dungeon', name: 'Dungeon', type: 'dungeon', quantity: 0, cost: 800, connections: [], description: 'Underground complex', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Dungeon tile', image: '/images/tiles/dungeon-tile.png' },
    { id: 'portal-entrance', name: 'Portal Entrance', type: 'portal-entrance', quantity: 0, cost: 1500, connections: [], description: 'Portal entry point', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Portal entrance tile', image: '/images/tiles/portal-entrance-tile.png' },
    { id: 'portal-exit', name: 'Portal Exit', type: 'portal-exit', quantity: 0, cost: 1500, connections: [], description: 'Portal exit point', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Portal exit tile', image: '/images/tiles/portal-exit-tile.png' },
    
    // Advanced Tiles (Level 60-80)
    { id: 'volcano', name: 'Volcano', type: 'volcano', quantity: 0, cost: 2000, connections: [], description: 'Active volcano', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Volcano tile', image: '/images/tiles/volcano-tile.png' },
    { id: 'lava', name: 'Lava', type: 'lava', quantity: 0, cost: 2500, connections: [], description: 'Molten rock', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Lava tile', image: '/images/tiles/lava-tile.png' },
    { id: 'cave', name: 'Cave', type: 'cave', quantity: 0, cost: 1200, connections: [], description: 'Natural cave', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Cave tile', image: '/images/tiles/cave-tile.png' },
    { id: 'snow', name: 'Snow', type: 'snow', quantity: 0, cost: 400, connections: [], description: 'Snowy terrain', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Snow tile', image: '/images/tiles/snow-tile.png' },
    
    // Legendary Tiles (Level 80-100)
    { id: 'mystery', name: 'Mystery', type: 'mystery', quantity: 0, cost: 5000, connections: [], description: 'Mysterious location', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Mystery tile', image: '/images/tiles/mystery-tile.png' },
    { id: 'special', name: 'Special', type: 'special', quantity: 0, cost: 3000, connections: [], description: 'Special location', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Special tile', image: '/images/tiles/special-tile.png' },
    { id: 'treasure', name: 'Treasure', type: 'treasure', quantity: 0, cost: 4000, connections: [], description: 'Treasure location', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Treasure tile', image: '/images/tiles/treasure-tile.png' },
    { id: 'monster', name: 'Monster', type: 'monster', quantity: 0, cost: 3500, connections: [], description: 'Monster lair', rotation: 0, revealed: true, isVisited: false, x: 0, y: 0, ariaLabel: 'Monster tile', image: '/images/tiles/monster-tile.png' },
  ];

  // Filter tiles by category - show all tiles but mark locked ones
  const getTilesByCategory = (categoryId: string) => {
    const category = tileCategories.find(cat => cat.id === categoryId);
    if (!category) return [];
    
    // Get all possible tiles for this category
    const categoryTiles = allPossibleTiles.filter(tile => category.tiles.includes(tile.type));
    
    // Merge with user's actual inventory to get correct quantities
    return categoryTiles.map(possibleTile => {
      const userTile = tiles.find(t => t.type === possibleTile.type);
      
      // Check if tile is unlocked based on user level
      const isUnlocked = userLevel >= category.minLevel;
      
      // For foundation tiles (level 0-20), give starting quantities to new players
      let quantity = 0;
      if (category.id === 'foundation' && userLevel >= 1) {
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
  };

  // Listen for tile inventory updates
  useEffect(() => {
    const handleTileInventoryUpdate = () => {
      // Trigger a refresh of the tile inventory
      if (user?.id) {
        // This will trigger the parent component to refresh the inventory
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

    console.log('[Tile Inventory] Buy button clicked for', tile.type, 'tile');
    console.log('[Tile Inventory] Quantity:', quantity, 'Cost:', totalCost);

    // Use the unified gold spending system
    if (spendGold(totalCost, `purchase-${quantity}-${tile.name || tile.type}-tiles`)) {
      try {
        // Get user ID from Clerk
        if (!user?.id) {
          console.error('[Tile Inventory] No user ID found');
          toast.error('User not authenticated');
          return;
        }

        console.log('[Tile Inventory] Calling addTileToInventory with:', {
          userId: user.id,
          tile: {
            id: tile.id || tile.type,
            type: tile.type,
            name: tile.name,
            quantity: quantity,
            cost: tile.cost,
            connections: tile.connections || [],
          }
        });

        // Use the tile inventory manager to add tiles
        const result = await addTileToInventory(user.id, {
          id: tile.id || tile.type,
          type: tile.type as any, // Type assertion for compatibility
          name: tile.name,
          quantity: quantity,
          cost: tile.cost,
          connections: tile.connections || [],
        });

        console.log('[Tile Inventory] Purchase completed successfully');

        // Update parent component's state immediately
        const newTiles = tiles.map(item => 
          item.type === tile.type 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        onUpdateTiles(newTiles)
        
        // Trigger a single inventory update event for realm page
        window.dispatchEvent(new Event('tile-inventory-update'));
        
        // Reset the quantity after purchase
        setBuyQuantities(prev => ({ ...prev, [tile.type]: 1 }))
        
        // Show success message
        toast.success(`Purchased ${quantity} ${tile.name || tile.type} tile(s)`)
      } catch (error) {
        console.error('[Tile Inventory] Error updating tile inventory:', error);
        toast.error('Failed to update tile inventory');
      }
    }
  }

  const handleQuantityChange = (type: string, value: string) => {
    const quantity = parseInt(value) || 1
    setBuyQuantities(prev => ({ ...prev, [type]: Math.max(1, quantity) }))
  }

  const getTileImage = (type: TileType) => {
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
      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'place' | 'buy')} className="w-full h-full">
        {/* Main Tabs */}
        <TabsList className="mb-6 w-full flex bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-1">
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
        </TabsList>
        
        <TabsContent value="place" className="space-y-6">
          {/* Category Dropdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Tile Category</label>
              <span className="text-xs text-gray-500">Level {userLevel}</span>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full bg-gray-900/50 border-gray-700">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 min-w-[280px]">
                {tileCategories.map(category => {
                  const isUnlocked = userLevel >= category.minLevel;
                  
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
          
          {/* Tile Grid */}
          <div className="space-y-4">
            {(() => {
              const category = tileCategories.find(cat => cat.id === selectedCategory);
              if (!category) return null;
              
              // For place tab, use getTilesByCategory to show all tiles in category (same as buy tab)
              console.log('[Tile Inventory] Place tab - tiles prop:', tiles.map(t => `${t.type}: ${t.quantity}`));
              console.log('[Tile Inventory] Place tab - category:', category.id, 'includes:', category.tiles);
              const categoryTiles = getTilesByCategory(selectedCategory);
              console.log('[Tile Inventory] Place tab - category tiles:', categoryTiles.map(t => `${t.type}: ${t.quantity}`));
              
              if (!categoryTiles.length) {
                return (
                  <div className="text-center py-12">
                    <div className="text-xl font-bold mb-2">
                      {userLevel < category.minLevel ? '🔒 Locked' : '📦 No tiles available'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {userLevel < category.minLevel 
                        ? `Unlock at level ${category.minLevel}`
                        : 'No tiles in this category'
                      }
                    </div>
                  </div>
                );
              }
              
              return (
                <ScrollArea className="h-full w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                    {categoryTiles.map((tile) => (
                      <Card
                        key={tile.type}
                        className={cn(
                          "relative overflow-hidden transition-all duration-200",
                          selectedTile?.type === tile.type && "ring-2 ring-amber-500 shadow-lg",
                          (tile.quantity === 0 || userLevel < category.minLevel) && "opacity-50",
                          userLevel >= category.minLevel && "cursor-pointer hover:ring-2 hover:ring-amber-500/50 hover:scale-105"
                        )}
                        onClick={() => {
                          if (userLevel < category.minLevel) {
                            return; // Disabled for locked categories
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
                          {userLevel < category.minLevel && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                              <span className="text-white text-xs font-bold bg-gray-600 px-3 py-1 rounded-full">
                                🔒 Lvl {category.minLevel}
                              </span>
                            </div>
                          )}
                          {tile.quantity === 0 && userLevel >= category.minLevel && (
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
                          </div>
                          {tile.quantity === 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20"
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
                    ))}
                  </div>
                </ScrollArea>
              );
            })()}
          </div>
        </TabsContent>
        <TabsContent value="buy" className="space-y-6">
          {/* Category Dropdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Tile Category</label>
              <span className="text-xs text-gray-500">Level {userLevel}</span>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full bg-gray-900/50 border-gray-700">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 min-w-[280px]">
                {tileCategories.map(category => {
                  const isUnlocked = userLevel >= category.minLevel;
                  
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
              
                        {/* Tile Grid */}
          <div className="space-y-4">
            {(() => {
              const category = tileCategories.find(cat => cat.id === selectedCategory);
              if (!category) return null;
              
              const categoryTiles = getTilesByCategory(selectedCategory);
              
              if (!categoryTiles.length) {
                return (
                  <div className="text-center py-12">
                    <div className="text-xl font-bold mb-2">
                      {userLevel < category.minLevel ? '🔒 Locked' : '📦 No tiles available'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {userLevel < category.minLevel 
                        ? `Unlock at level ${category.minLevel}`
                        : 'No tiles in this category'
                      }
                    </div>
                  </div>
                );
              }
              
              return (
                <ScrollArea className="h-full w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                    {categoryTiles.map((tile) => (
                      <Card
                        key={tile.type}
                        className={cn(
                          "relative overflow-hidden transition-all duration-200",
                          (tile.quantity === 0 || userLevel < category.minLevel) && "opacity-50",
                          userLevel >= category.minLevel && "hover:scale-105",
                          tile.quantity === 0 && userLevel >= category.minLevel && "border-2 border-amber-500 shadow-lg"
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
                          {userLevel < category.minLevel && (
                            <span className="absolute top-2 left-2 bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg" aria-label="Locked tile badge">
                              🔒 Lvl {category.minLevel}
                            </span>
                          )}
                          {tile.quantity === 0 && userLevel >= category.minLevel && (
                            <span className="absolute top-2 left-2 bg-green-500 text-white text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg" aria-label="Buyable tile badge">
                              Buyable
                            </span>
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
                              disabled={userLevel < category.minLevel}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "flex-1 min-h-[40px] h-10",
                                userLevel >= category.minLevel 
                                  ? "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 text-amber-500"
                                  : "bg-gray-600/50 border-gray-600 text-gray-400 cursor-not-allowed"
                              )}
                              onClick={(e) => userLevel >= category.minLevel && handleBuyTile(tile, e)}
                              disabled={userLevel < category.minLevel}
                              aria-label={`Buy ${buyQuantities[tile.type] || 1} ${tile.name || tile.type} tile${(buyQuantities[tile.type] || 1) > 1 ? 's' : ''}`}
                            >
                              {userLevel < category.minLevel ? 'Locked' : 'Buy'}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              );
            })()}
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}

// Function to render tile previews
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