"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { KingdomTileComponent } from './kingdom-tile'
import { KINGDOM_TILES, getRarityColor } from '@/lib/kingdom-tiles'
import { useToast } from '@/components/ui/use-toast'
import { Coins, Package, Crown } from 'lucide-react'

interface KingdomTileGridProps {
  onGoldEarned: (amount: number) => void
  onItemFound: (item: { image: string; name: string; type: string }) => void
  kingdomGrid?: any[][] // The actual kingdom grid with placed tiles
}

export function KingdomTileGrid({ onGoldEarned, onItemFound, kingdomGrid = [] }: KingdomTileGridProps) {
  const { toast } = useToast()
  const [totalGoldEarned, setTotalGoldEarned] = useState(0)
  const [itemsFound, setItemsFound] = useState<Array<{ image: string; name: string; type: string }>>([])
  const [placedTiles, setPlacedTiles] = useState<typeof KINGDOM_TILES>([])

  // Extract placed tiles from kingdom grid and get their timers
  useEffect(() => {
    if (kingdomGrid && kingdomGrid.length > 0) {
      const placed = KINGDOM_TILES.filter(tile => {
        // Check if this tile type exists anywhere in the kingdom grid
        return kingdomGrid.some(row => 
          row.some(cell => 
            cell && cell.type && cell.type.toLowerCase() === tile.id
          )
        )
      })
      setPlacedTiles(placed)
    }
  }, [kingdomGrid])

  // Load timers from localStorage to sync with kingdom grid
  useEffect(() => {
    const savedTimers = localStorage.getItem('kingdom-tile-timers')
    if (savedTimers) {
      const timers = JSON.parse(savedTimers)
      // Update tile states based on actual timers
      setPlacedTiles(prev => 
        prev.map(tile => {
          const timer = timers.find((t: any) => t.tileId === tile.id)
          return {
            ...tile,
            timer: timer || null
          }
        })
      )
    }
  }, [])

  const handleReward = (gold: number, item?: { image: string; name: string; type: string }) => {
    // Update gold
    setTotalGoldEarned(prev => prev + gold)
    onGoldEarned(gold)

    // Update items
    if (item) {
      setItemsFound(prev => [...prev, item])
      onItemFound(item)
    }

    // Show toast
    toast({
      title: "Kingdom Reward!",
      description: `You earned ${gold} gold${item ? ` and found a ${item.type}!` : '!'}`,
    })
  }

  if (placedTiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Kingdom Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <Crown className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Kingdom Tiles Placed</h3>
            <p className="text-gray-600 text-sm">
              Place tiles on your kingdom grid to unlock rewards and start earning gold!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kingdom Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-500" />
                <span className="font-semibold">Total Gold Earned:</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  {totalGoldEarned} gold
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">Items Found:</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {itemsFound.length}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Placed Tiles:</span>
              <Badge variant="outline">{placedTiles.length}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tile Grid */}
      <ScrollArea className="h-[600px] sm:h-[500px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 p-2 sm:p-4">
          {placedTiles.map((tile) => {
            const savedTimers = localStorage.getItem('kingdom-tile-timers')
            const timers = savedTimers ? JSON.parse(savedTimers) : []
            const timer = timers.find((t: any) => t.tileId === tile.id)
            
            return (
              <div key={tile.id} className="relative">
                <KingdomTileComponent
                  tile={tile}
                  onReward={handleReward}
                  timer={timer}
                />
                {/* Rarity Badge */}
                <Badge 
                  className={`absolute top-2 right-2 text-xs ${getRarityColor(tile.rarity)}`}
                >
                  {tile.rarity}
                </Badge>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Recent Items Found */}
      {itemsFound.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Items Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {itemsFound.slice(-6).map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="relative w-8 h-8">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="object-contain w-full h-full"
                      onError={(e) => { 
                        e.currentTarget.src = '/images/placeholders/item-placeholder.svg' 
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 