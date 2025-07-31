import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapIcon, ShoppingCart, Plus, Minus } from 'lucide-react'

interface TileStepProps {
  onNext: () => void
  onPrevious: () => void
  isFirstStep: boolean
  isLastStep: boolean
  stepData: any
}

export function TileStep({ onNext }: TileStepProps) {
  const [selectedTile, setSelectedTile] = useState<string | null>(null)
  const [tileInventory, setTileInventory] = useState([
    { id: 'grass', name: 'Grass', cost: 25, quantity: 0, image: '/images/tiles/grass-tile.png' },
    { id: 'water', name: 'Water', cost: 50, quantity: 0, image: '/images/tiles/water-tile.png' },
    { id: 'forest', name: 'Forest', cost: 75, quantity: 0, image: '/images/tiles/forest-tile.png' }
  ])
  const [goldBalance, setGoldBalance] = useState(20)

  const handleBuyTile = (tileId: string) => {
    const tile = tileInventory.find(t => t.id === tileId)
    if (tile && goldBalance >= tile.cost) {
      setTileInventory(prev => 
        prev.map(t => 
          t.id === tileId 
            ? { ...t, quantity: t.quantity + 1 }
            : t
        )
      )
      setGoldBalance(prev => prev - tile.cost)
    }
  }

  const handlePlaceTile = (tileId: string) => {
    const tile = tileInventory.find(t => t.id === tileId)
    if (tile && tile.quantity > 0) {
      setTileInventory(prev => 
        prev.map(t => 
          t.id === tileId 
            ? { ...t, quantity: t.quantity - 1 }
            : t
        )
      )
      setSelectedTile(null)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-4 md:space-y-6">
      {/* Gold Balance */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-xl md:text-2xl font-bold text-amber-400">{goldBalance}</span>
          <span className="text-amber-400">gold</span>
        </div>
        <p className="text-sm text-gray-400">Use your gold to buy tiles</p>
      </div>

      {/* Tile Inventory */}
      <div className="space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold text-white">Tile Inventory</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {tileInventory.map((tile) => (
            <Card 
              key={tile.id} 
              className={`bg-gray-800/50 border transition-all duration-300 cursor-pointer ${
                selectedTile === tile.id 
                  ? 'border-amber-500 bg-amber-500/10' 
                  : 'border-amber-800/20 hover:border-amber-500/40'
              }`}
              onClick={() => setSelectedTile(tile.id)}
            >
              <CardContent className="p-3 md:p-4">
                <div className="text-center space-y-2 md:space-y-3">
                  <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                    <MapIcon className="h-6 w-6 md:h-8 md:w-8 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm md:text-base">{tile.name}</h4>
                    <div className="flex items-center justify-center space-x-1 md:space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {tile.cost} gold
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Qty: {tile.quantity}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Buy Button */}
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleBuyTile(tile.id)
                    }}
                    disabled={goldBalance < tile.cost}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black text-xs"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Buy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tile Placement Demo */}
      {selectedTile && (
        <Card className="bg-gray-800/50 border border-amber-500/40">
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <h4 className="font-semibold text-white">Place Your Tile</h4>
              <p className="text-sm text-gray-300">
                Click the button below to place your selected tile in your kingdom
              </p>
              <Button
                onClick={() => handlePlaceTile(selectedTile)}
                className="bg-green-500 hover:bg-green-600 text-black"
              >
                Place Tile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tile System Explanation */}
      <div className="space-y-3">
        <h4 className="text-md font-semibold text-white">Tile System</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <h5 className="font-medium text-amber-400 mb-1">Buying Tiles</h5>
            <p className="text-sm text-gray-300">
              Use gold to purchase tiles from the inventory. Different tiles have different costs.
            </p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <h5 className="font-medium text-green-400 mb-1">Placing Tiles</h5>
            <p className="text-sm text-gray-300">
              Place tiles in your kingdom to build and expand your realm. Each tile adds to your kingdom.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Instructions */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-400">
          Try buying a tile and then placing it in your kingdom!
        </p>
        {tileInventory.some(t => t.quantity > 0) && (
          <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-3">
            <p className="text-green-400 font-medium">
              Great! You have tiles in your inventory. Select one to place it.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 