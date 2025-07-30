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

  // Polling for tile inventory changes instead of real-time sync
  useEffect(() => {
    if (!user?.id) return;
    
    const pollInterval = setInterval(() => {
      // Re-fetch tile inventory and update state
      // (Replace with your actual fetch logic if needed)
      if (typeof window !== 'undefined') {
        // Example: fetch('/api/tile-inventory').then(...)
        // For now, just call onUpdateTiles with the current tiles
        onUpdateTiles(tiles);
      }
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(pollInterval);
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
        await addTileToInventory(user.id, {
          id: tile.id || tile.type,
          type: tile.type as any, // Type assertion for compatibility
          name: tile.name,
          quantity: quantity,
          cost: tile.cost,
          connections: tile.connections || [],
        });

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
      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'place' | 'buy')} className="w-full">
        <TabsList className="mb-4 w-full flex">
          <TabsTrigger value="place" className="flex-1">Place</TabsTrigger>
          <TabsTrigger value="buy" className="flex-1">Buy</TabsTrigger>
        </TabsList>
        <TabsContent value="place">
          <ScrollArea className="h-full w-full">
            {/* Mobile: vertical stack for tile cards */}
            <div className="flex flex-col gap-4 md:hidden p-4">
              {tiles.map((tile) => (
                <Card
                  key={tile.type}
                  className={cn(
                    "relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all min-w-[180px] max-w-[220px] flex-shrink-0",
                    selectedTile?.type === tile.type && "ring-2 ring-primary",
                    tile.quantity === 0 && "opacity-50"
                  )}
                  onClick={() => {
                    if (tile.quantity === 0) {
                      // Switch to buy tab when clicking on empty tile
                      setActiveTab('buy');
                      if (onOutOfTiles) onOutOfTiles(tile);
                      return;
                    }
                    onSelectTile(selectedTile?.type === tile.type ? null : tile);
                  }}
                  aria-label={`Select ${tile.name} tile (Quantity: ${tile.quantity})`}
                >
                  <div className="aspect-square relative">
                    <Image
                      src={getTileImage(tile.type)}
                      alt={tile.name}
                      fill
                      className="object-cover"
                    />
                    {/* Quantity badge in top-right corner */}
                    <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded shadow">
                      {tile.quantity}
                    </div>
                    {tile.quantity === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-amber-500 px-2 py-1 rounded">
                          Buy More
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-background/95 backdrop-blur-sm">
                    <div className="capitalize font-semibold text-sm">{tile.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 text-center">
                      <span className="text-amber-500 font-medium">{tile.cost} gold</span>
                    </div>
                    {tile.quantity === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
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
            {/* Desktop/tablet: grid layout, 2 columns for md+, not 3 */}
            <div className="hidden md:grid grid-cols-2 gap-4 p-4">
              {tiles.map((tile) => (
                <Card
                  key={tile.type}
                  className={cn(
                    "relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all",
                    selectedTile?.type === tile.type && "ring-2 ring-primary",
                    tile.quantity === 0 && "opacity-50"
                  )}
                  onClick={() => {
                    if (tile.quantity === 0) {
                      // Switch to buy tab when clicking on empty tile
                      setActiveTab('buy');
                      if (onOutOfTiles) onOutOfTiles(tile);
                      return;
                    }
                    onSelectTile(selectedTile?.type === tile.type ? null : tile);
                  }}
                  aria-label={`Select ${tile.name} tile (Quantity: ${tile.quantity})`}
                >
                  <div className="aspect-square relative">
                    <Image
                      src={getTileImage(tile.type)}
                      alt={tile.name}
                      fill
                      className="object-cover"
                    />
                    {/* Quantity badge in top-right corner */}
                    <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded shadow">
                      {tile.quantity}
                    </div>
                    {tile.quantity === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-amber-500 px-2 py-1 rounded">
                          Buy More
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-background/95 backdrop-blur-sm">
                    <div className="capitalize font-semibold text-sm">{tile.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 text-center">
                      <span className="text-amber-500 font-medium">{tile.cost} gold</span>
                    </div>
                    {tile.quantity === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
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
        </TabsContent>
        <TabsContent value="buy">
          <ScrollArea className="h-full w-full">
            <div className="flex flex-col gap-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                {tiles.map((tile) => (
                  <Card
                    key={tile.type}
                    className={cn(
                      "relative overflow-hidden transition-all",
                      tile.quantity === 0 && "border-2 border-amber-500 shadow-lg"
                    )}
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={getTileImage(tile.type)}
                        alt={tile.name}
                        fill
                        className="object-cover"
                      />
                      {/* Quantity badge in top-right corner */}
                      <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded shadow">
                        {tile.quantity}
                      </div>
                      {tile.quantity === 0 && (
                        <span className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded shadow" aria-label="Buyable tile badge">Buyable</span>
                      )}
                    </div>
                    <div className="p-3 bg-background/95 backdrop-blur-sm">
                      <div className="capitalize font-semibold text-sm">{tile.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 text-center">
                        <span className="text-amber-500 font-medium">{tile.cost} gold</span>
                      </div>
                      <div className="flex gap-2 mt-2 items-center justify-center">
                        <Input
                          type="number"
                          min="1"
                          value={buyQuantities[tile.type] || 1}
                          onChange={(e) => handleQuantityChange(tile.type, e.target.value)}
                          className="w-14 h-10 text-sm text-center px-2 py-1 border border-gray-700 rounded-md focus:ring-amber-500 focus:border-amber-500"
                          id={`buy-quantity-${tile.type}`}
                          name={`buy-quantity-${tile.type}`}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-h-[40px] h-10"
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
            </div>
          </ScrollArea>
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