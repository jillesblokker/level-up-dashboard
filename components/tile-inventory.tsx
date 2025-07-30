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

  // Get user level (placeholder - replace with actual level logic)
  const userLevel = 1; // TODO: Get actual user level

  // Filter tiles by category
  const getTilesByCategory = (categoryId: string) => {
    const category = tileCategories.find(cat => cat.id === categoryId);
    if (!category) return [];
    
    const isUnlocked = userLevel >= category.minLevel;
    if (!isUnlocked) return [];
    
    return tiles.filter(tile => category.tiles.includes(tile.type));
  };

  // Listen for tile inventory updates
  useEffect(() => {
    const handleTileInventoryUpdate = () => {
      console.log('Tile inventory update event received');
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

    // Use the unified gold spending system
    if (spendGold(totalCost, `purchase-${quantity}-${tile.name || tile.type}-tiles`)) {
      try {
        // Get user ID from Clerk
        if (!user?.id) {
          console.error('No user ID found');
          toast.error('User not authenticated');
          return;
        }

        // Use the tile inventory manager to add tiles
        const result = await addTileToInventory(user.id, {
          id: tile.id || tile.type,
          type: tile.type as any, // Type assertion for compatibility
          name: tile.name,
          quantity: quantity,
          cost: tile.cost,
          connections: tile.connections || [],
        });

        console.log('Tile purchase result:', result);

        // Update local state after successful API call
        const newTiles = tiles.map(item => 
          item.type === tile.type 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        onUpdateTiles(newTiles)
        
        // Dispatch event to trigger a refresh of tile inventory
        window.dispatchEvent(new Event('tile-inventory-update'));
        
        // Reset the quantity after purchase
        setBuyQuantities(prev => ({ ...prev, [tile.type]: 1 }))
        
        // Show success message
        toast.success(`Purchased ${quantity} ${tile.name || tile.type} tile(s)`)
      } catch (error) {
        console.error('Error updating tile inventory:', error);
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
        {/* Main Tabs - Improved styling */}
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
          {/* Category Tabs - Responsive design */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-lg p-2">
              {tileCategories.map(category => {
                const isUnlocked = userLevel >= category.minLevel;
                const categoryTiles = getTilesByCategory(category.id);
                const hasTiles = categoryTiles.length > 0;
                
                return (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    disabled={!isUnlocked || !hasTiles}
                    className={cn(
                      "data-[state=active]:bg-amber-500 data-[state=active]:text-black font-medium transition-all rounded-md",
                      !isUnlocked && "opacity-50 cursor-not-allowed",
                      !hasTiles && "opacity-30"
                    )}
                  >
                    <div className="text-center px-2 py-1">
                      <div className="font-bold text-xs md:text-sm truncate">{category.name}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        Lvl {category.minLevel}-{category.maxLevel}
                      </div>
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>
              
              {tileCategories.map(category => (
                <TabsContent key={category.id} value={category.id}>
                  {!getTilesByCategory(category.id).length ? (
                    <div className="text-center py-8">
                      <div className="text-lg font-bold">
                        {userLevel < category.minLevel ? 'Locked' : 'No tiles available'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {userLevel < category.minLevel 
                          ? `Unlock at level ${category.minLevel}`
                          : 'No tiles in this category'
                        }
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="h-full w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                        {getTilesByCategory(category.id).map((tile) => (
                          <Card
                            key={tile.type}
                            className={cn(
                              "relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-amber-500/50 transition-all duration-200 hover:scale-105",
                              selectedTile?.type === tile.type && "ring-2 ring-amber-500 shadow-lg",
                              tile.quantity === 0 && "opacity-50"
                            )}
                            onClick={() => {
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
                              {tile.quantity === 0 && (
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
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        <TabsContent value="buy" className="space-y-6">
          {/* Category Tabs - Responsive design */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 bg-gray-900/30 backdrop-blur-sm border border-gray-700 rounded-lg p-2">
              {tileCategories.map(category => {
                const isUnlocked = userLevel >= category.minLevel;
                const categoryTiles = getTilesByCategory(category.id);
                const hasTiles = categoryTiles.length > 0;
                
                return (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    disabled={!isUnlocked || !hasTiles}
                    className={cn(
                      "data-[state=active]:bg-amber-500 data-[state=active]:text-black font-medium transition-all rounded-md",
                      !isUnlocked && "opacity-50 cursor-not-allowed",
                      !hasTiles && "opacity-30"
                    )}
                  >
                    <div className="text-center px-2 py-1">
                      <div className="font-bold text-xs md:text-sm truncate">{category.name}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        Lvl {category.minLevel}-{category.maxLevel}
                      </div>
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>
              
                              {tileCategories.map(category => (
                <TabsContent key={category.id} value={category.id}>
                  {!getTilesByCategory(category.id).length ? (
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
                  ) : (
                    <ScrollArea className="h-full w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                        {getTilesByCategory(category.id).map((tile) => (
                          <Card
                            key={tile.type}
                            className={cn(
                              "relative overflow-hidden transition-all duration-200 hover:scale-105",
                              tile.quantity === 0 && "border-2 border-amber-500 shadow-lg"
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
                              {tile.quantity === 0 && (
                                <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg" aria-label="Buyable tile badge">
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
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 min-h-[40px] h-10 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 text-amber-500"
                                  onClick={(e) => handleBuyTile(tile, e)}
                                  aria-label={`Buy ${buyQuantities[tile.type] || 1} ${tile.name || tile.type} tile${(buyQuantities[tile.type] || 1) > 1 ? 's' : ''}`}
                                >
                                  Buy
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              ))}
            </Tabs>
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