import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MapIcon, Crown, TrendingUp } from 'lucide-react'

interface KingdomStepProps {
  onNext: () => void
  onPrevious: () => void
  isFirstStep: boolean
  isLastStep: boolean
  stepData: any
}

export function KingdomStep({ onNext }: KingdomStepProps) {
  const [kingdomSize, setKingdomSize] = useState(0)
  const [placedTiles, setPlacedTiles] = useState<string[]>([])
  const [showGrowth, setShowGrowth] = useState(false)

  useEffect(() => {
    // Simulate kingdom growth
    const timer = setTimeout(() => {
      setShowGrowth(true)
      setKingdomSize(3)
      setPlacedTiles(['grass', 'water', 'forest'])
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const kingdomGrid = [
    ['', 'grass', 'water', ''],
    ['', '', 'forest', ''],
    ['', '', '', '']
  ]

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Kingdom Overview */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Crown className="h-8 w-8 text-amber-400" />
          <span className="text-2xl font-bold text-amber-400">Your Kingdom</span>
        </div>
        <p className="text-gray-300">
          Watch your kingdom grow as you place tiles and expand your realm.
        </p>
      </div>

      {/* Kingdom Grid Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Kingdom Grid</h3>
        <div className="flex justify-center">
          <div className="grid grid-cols-4 gap-1 bg-gray-800/50 border border-amber-800/20 rounded-lg p-4">
            {kingdomGrid.map((row, rowIndex) => 
              row.map((tile, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-12 h-12 rounded border transition-all duration-300 ${
                    tile 
                      ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 border-amber-500/40' 
                      : 'bg-gray-700/50 border-gray-600/30'
                  }`}
                >
                  {tile && (
                    <div className="w-full h-full flex items-center justify-center overflow-hidden">
                      <img 
                        src={`/images/tiles/${tile}-tile.png`}
                        alt={`${tile} tile`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <MapIcon className="h-6 w-6 text-amber-400 fallback-icon absolute inset-0 m-auto" style={{ display: 'none' }} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Kingdom Stats */}
      {showGrowth && (
        <Card className="bg-gray-800/50 border border-amber-800/20">
          <CardContent className="p-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-white">Kingdom Stats</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{kingdomSize}</div>
                  <div className="text-sm text-gray-400">Tiles Placed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">+{kingdomSize * 10}</div>
                  <div className="text-sm text-gray-400">Kingdom Value</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kingdom Building Explanation */}
      <div className="space-y-3">
        <h4 className="text-md font-semibold text-white">Kingdom Building</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <h5 className="font-medium text-amber-400 mb-1">Tile Placement</h5>
            <p className="text-sm text-gray-300">
              Place tiles strategically to build your kingdom. Each tile adds value and expands your realm.
            </p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <h5 className="font-medium text-green-400 mb-1">Kingdom Growth</h5>
            <p className="text-sm text-gray-300">
              Watch your kingdom grow as you add more tiles. Larger kingdoms unlock new features.
            </p>
          </div>
        </div>
      </div>

      {/* Placed Tiles Display */}
      {showGrowth && (
        <div className="space-y-3">
          <h4 className="text-md font-semibold text-white">Placed Tiles</h4>
          <div className="flex justify-center space-x-2">
            {placedTiles.map((tile, index) => (
              <div
                key={index}
                className="w-8 h-8 bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/40 rounded flex items-center justify-center"
              >
                <MapIcon className="h-4 w-4 text-amber-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Growth Animation Status */}
      {!showGrowth && (
        <div className="text-center">
          <p className="text-sm text-gray-400">Watch your kingdom grow as tiles are placed...</p>
        </div>
      )}

      {/* Kingdom Benefits */}
      {showGrowth && (
        <div className="space-y-3">
          <h4 className="text-md font-semibold text-white">Kingdom Benefits</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-gray-300">Unlock new quest categories</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-gray-300">Earn bonus rewards</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-gray-300">Access special events</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 