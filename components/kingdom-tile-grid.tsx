"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { KingdomTileComponent } from './kingdom-tile'
import { KINGDOM_TILES } from '@/lib/kingdom-tiles'
import { useToast } from '@/components/ui/use-toast'
import { Coins, Package } from 'lucide-react'

interface KingdomTileGridProps {
  onGoldEarned: (amount: number) => void
  onItemFound: (item: { image: string; name: string; type: string }) => void
}

export function KingdomTileGrid({ onGoldEarned, onItemFound }: KingdomTileGridProps) {
  const { toast } = useToast()
  const [totalGoldEarned, setTotalGoldEarned] = useState(0)
  const [itemsFound, setItemsFound] = useState<Array<{ image: string; name: string; type: string }>>([])

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
          </div>
        </CardContent>
      </Card>

      {/* Tile Grid */}
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
          {KINGDOM_TILES.map((tile) => (
            <KingdomTileComponent
              key={tile.id}
              tile={tile}
              onReward={handleReward}
            />
          ))}
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