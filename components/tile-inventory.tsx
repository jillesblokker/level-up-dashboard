"use client";

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useGoldStore } from "@/stores/goldStore"
import { TileType, InventoryItem } from "@/types/tiles"
import { useState } from "react"

interface TileInventoryProps {
  tiles: InventoryItem[]
  selectedTile: InventoryItem | null
  onSelectTile: (tile: InventoryItem | null) => void
  onUpdateTiles: (tiles: InventoryItem[]) => void
}

export function TileInventory({ tiles, selectedTile, onSelectTile, onUpdateTiles }: TileInventoryProps) {
  const { gold, updateGold } = useGoldStore()
  const [buyQuantities, setBuyQuantities] = useState<{ [key: string]: number }>({})

  const handleBuyTile = (tile: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const quantity = buyQuantities[tile.type] || 1
    const totalCost = tile.cost * quantity
    // Read gold from character-stats
    const savedStats = localStorage.getItem('character-stats')
    const stats = savedStats ? JSON.parse(savedStats) : { gold: 1000 }
    const currentGold = stats.gold || 0

    if (currentGold < totalCost) {
      toast(
        `Not enough gold: You need ${totalCost} gold to buy ${quantity} ${tile.name || tile.type} tile${quantity > 1 ? 's' : ''}.`
      )
      return
    }

    // Update gold in character-stats and dispatch event
    const newGold = currentGold - totalCost
    const newStats = { ...stats, gold: newGold }
    localStorage.setItem('character-stats', JSON.stringify(newStats))
    window.dispatchEvent(new Event('character-stats-update'))

    // Update tiles
    const newTiles = tiles.map(item => 
      item.type === tile.type 
        ? { ...item, quantity: item.quantity + quantity }
        : item
    )
    onUpdateTiles(newTiles)
    
    toast(
      `You bought ${quantity} ${tile.name || tile.type} tile${quantity > 1 ? 's' : ''} for ${totalCost} gold.`
    )

    // Reset the quantity after purchase
    setBuyQuantities(prev => ({ ...prev, [tile.type]: 1 }))
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
    <ScrollArea className="h-full w-full">
      <div className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          {tiles.map((tile) => (
            <Card
              key={tile.type}
              className={cn(
                "relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all",
                selectedTile?.type === tile.type && "ring-2 ring-primary",
                tile.quantity === 0 && "border-2 border-amber-500 shadow-lg"
              )}
              onClick={() => tile.quantity > 0 && onSelectTile(selectedTile?.type === tile.type ? null : tile)}
            >
              <div className="aspect-square relative">
                <Image
                  src={getTileImage(tile.type)}
                  alt={tile.name}
                  fill
                  className="object-cover"
                />
                {tile.quantity === 0 && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded shadow" aria-label="Buyable tile badge">Buyable</span>
                )}
              </div>
              <div className="p-3 bg-background/95 backdrop-blur-sm">
                <div className="capitalize font-semibold text-sm">{tile.name}</div>
                <div className="text-xs text-muted-foreground mt-1 flex justify-between items-center">
                  <span className="font-medium">Quantity: {tile.quantity}</span>
                  <span className="text-amber-500 font-medium">{tile.cost} gold</span>
                </div>
                {tile.quantity === 0 && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="number"
                      min="1"
                      value={buyQuantities[tile.type] || 1}
                      onChange={(e) => handleQuantityChange(tile.type, e.target.value)}
                      className="w-20 h-8"
                      id={`buy-quantity-${tile.type}`}
                      name={`buy-quantity-${tile.type}`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => handleBuyTile(tile, e)}
                      aria-label={`Buy ${buyQuantities[tile.type] || 1} ${tile.name || tile.type} tile${(buyQuantities[tile.type] || 1) > 1 ? 's' : ''}`}
                    >
                      Buy
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

// Function to render tile previews
function renderTilePreview(type: string) {
  switch (type) {
    case 'grass':
      return (
        <div className="w-full h-full bg-green-700">
          <svg viewBox="0 0 32 32" className="w-full h-full">
            <rect width="32" height="32" fill="#4CAF50" />
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
            <rect width="32" height="32" fill="#2196F3" />
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
            <rect width="32" height="32" fill="#7E57C2" />
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
            <rect width="32" height="32" fill="#FFA000" />
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
            <rect width="32" height="32" fill="#FFB300" />
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