"use client";

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { TileType, InventoryItem } from "@/types/tiles"
import { useState } from "react"

// Remove the TileInventory component entirely if all props are unused and the component is not used elsewhere.

export function TileInventory({ tiles, selectedTile, onSelectTile, onUpdateTiles }: {
  tiles: InventoryItem[]
  selectedTile: InventoryItem | null
  onSelectTile: (tile: InventoryItem | null) => void
  onUpdateTiles: (tiles: InventoryItem[]) => void
}) {
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
        <div className="text-lg font-semibold mb-2">Tile Inventory</div>
        <div className="grid grid-cols-2 gap-4">
          {tiles
            .filter(tile => tile.type !== 'portal') // Remove broken portal tile
            .map((tile) => (
            <Card
              key={tile.type}
              className={cn(
                "relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all",
                selectedTile?.type === tile.type && "ring-2 ring-primary"
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuantityChange(tile.type, e.target.value)}
                      className="w-20 h-8"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleBuyTile(tile, e)}
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