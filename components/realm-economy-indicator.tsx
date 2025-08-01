"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Coins, ShoppingCart, TrendingUp, Calculator, AlertCircle } from 'lucide-react'
import { getCharacterStats } from '@/lib/character-stats-manager'

interface TileCost {
  name: string
  cost: number
  category: string
  description: string
  affordable: boolean
  shortfall: number
}

export function RealmEconomyIndicator() {
  const [stats, setStats] = useState({
    gold: 0,
    totalSpent: 0,
    averageTileCost: 0
  })
  const [tileCosts, setTileCosts] = useState<TileCost[]>([])
  const [affordableTiles, setAffordableTiles] = useState(0)
  const [totalTiles, setTotalTiles] = useState(0)

  useEffect(() => {
    const loadEconomyData = () => {
      try {
        const characterStats = getCharacterStats()
        
        // Define tile costs based on the realm page
        const costs: TileCost[] = [
          { name: 'Grass', cost: 25, category: 'Foundation', description: 'Basic terrain', affordable: false, shortfall: 0 },
          { name: 'Water', cost: 50, category: 'Foundation', description: 'Water body', affordable: false, shortfall: 0 },
          { name: 'Forest', cost: 75, category: 'Foundation', description: 'Dense woodland', affordable: false, shortfall: 0 },
          { name: 'Mountain', cost: 20, category: 'Foundation', description: 'Rocky terrain', affordable: false, shortfall: 0 },
          { name: 'Desert', cost: 100, category: 'Settlement', description: 'Arid landscape', affordable: false, shortfall: 0 },
          { name: 'Ice', cost: 120, category: 'Settlement', description: 'Frozen terrain', affordable: false, shortfall: 0 },
          { name: 'Snow', cost: 125, category: 'Settlement', description: 'Snowy landscape', affordable: false, shortfall: 0 },
          { name: 'Cave', cost: 200, category: 'Development', description: 'Underground passage', affordable: false, shortfall: 0 },
          { name: 'Town', cost: 250, category: 'Settlement', description: 'Small community', affordable: false, shortfall: 0 },
          { name: 'City', cost: 300, category: 'Settlement', description: 'Large settlement', affordable: false, shortfall: 0 },
          { name: 'Castle', cost: 500, category: 'Development', description: 'Fortified structure', affordable: false, shortfall: 0 },
          { name: 'Dungeon', cost: 400, category: 'Development', description: 'Underground complex', affordable: false, shortfall: 0 },
          { name: 'Volcano', cost: 500, category: 'Advanced', description: 'Active volcano', affordable: false, shortfall: 0 },
          { name: 'Lava', cost: 200, category: 'Advanced', description: 'Molten rock', affordable: false, shortfall: 0 },
          { name: 'Portal Entrance', cost: 250, category: 'Development', description: 'Magical gateway', affordable: false, shortfall: 0 },
          { name: 'Portal Exit', cost: 250, category: 'Development', description: 'Magical gateway', affordable: false, shortfall: 0 },
          { name: 'Mystery', cost: 300, category: 'Legendary', description: 'Unknown location', affordable: false, shortfall: 0 }
        ]
        
        const currentGold = characterStats.gold || 0
        
        // Calculate affordability and shortfall
        const updatedCosts = costs.map(tile => ({
          ...tile,
          affordable: currentGold >= tile.cost,
          shortfall: Math.max(0, tile.cost - currentGold)
        }))
        
        const affordable = updatedCosts.filter(tile => tile.affordable).length
        const averageCost = costs.reduce((sum, tile) => sum + tile.cost, 0) / costs.length
        
        setStats({
          gold: currentGold,
          totalSpent: 0, // Could be calculated from transactions
          averageTileCost: Math.round(averageCost)
        })
        
        setTileCosts(updatedCosts)
        setAffordableTiles(affordable)
        setTotalTiles(costs.length)
        
      } catch (error) {
        console.error('Error loading economy data:', error)
      }
    }

    loadEconomyData()
    
    // Listen for updates
    const handleStatsUpdate = () => loadEconomyData()
    window.addEventListener('character-stats-update', handleStatsUpdate)
    
    return () => {
      window.removeEventListener('character-stats-update', handleStatsUpdate)
    }
  }, [])

  const getNextAffordableTile = () => {
    const affordable = tileCosts.filter(tile => tile.affordable)
    return affordable.length > 0 ? affordable[0] : null
  }

  const getNextGoalTile = () => {
    const unaffordable = tileCosts.filter(tile => !tile.affordable)
    return unaffordable.length > 0 ? unaffordable[0] : null
  }

  return (
    <div className="space-y-4">
      {/* Current Balance */}
      <Card className="border-amber-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <Calculator className="h-5 w-5" />
            Realm Economy
          </CardTitle>
          <CardDescription className="text-gray-300">
            Your wealth for kingdom expansion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Gold Balance */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-amber-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Coins className="h-5 w-5 text-amber-400" />
                  <h3 className="font-semibold text-white">Current Gold</h3>
                </div>
                <div className="text-2xl font-bold text-amber-400 mb-2">
                  {stats.gold} Gold
                </div>
                <p className="text-sm text-gray-400">
                  Available for tiles
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <ShoppingCart className="h-5 w-5 text-green-400" />
                  <h3 className="font-semibold text-white">Affordable Tiles</h3>
                </div>
                <div className="text-2xl font-bold text-green-400 mb-2">
                  {affordableTiles} / {totalTiles}
                </div>
                <p className="text-sm text-gray-400">
                  Tiles you can buy
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <h3 className="font-semibold text-white">Average Cost</h3>
                </div>
                <div className="text-2xl font-bold text-blue-400 mb-2">
                  {stats.averageTileCost} Gold
                </div>
                <p className="text-sm text-gray-400">
                  Per tile
                </p>
              </CardContent>
            </div>
          </CardContent>
        </CardContent>
      </Card>

      {/* Tile Affordability */}
      <Card className="border-amber-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="h-5 w-5 text-amber-400" />
              <h3 className="font-semibold text-white">Tile Affordability</h3>
            </div>
            
            {/* Next Affordable Tile */}
            {getNextAffordableTile() && (
              <div className="p-3 bg-green-900/20 border border-green-800/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-400">{getNextAffordableTile()?.name}</h4>
                    <p className="text-sm text-gray-400">{getNextAffordableTile()?.description}</p>
                  </div>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    {getNextAffordableTile()?.cost} Gold
                  </Badge>
                </div>
                <p className="text-xs text-green-300 mt-2">
                  ✅ You can afford this tile!
                </p>
              </div>
            )}

            {/* Next Goal Tile */}
            {getNextGoalTile() && (
              <div className="p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-amber-400">{getNextGoalTile()?.name}</h4>
                    <p className="text-sm text-gray-400">{getNextGoalTile()?.description}</p>
                  </div>
                  <Badge variant="outline" className="text-amber-400 border-amber-400">
                    {getNextGoalTile()?.cost} Gold
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <p className="text-xs text-amber-300">
                    Need {getNextGoalTile()?.shortfall} more gold
                  </p>
                </div>
                <Progress 
                  value={Math.min((stats.gold / (getNextGoalTile()?.cost || 1)) * 100, 100)} 
                  className="h-2 mt-2"
                />
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-lg font-bold text-green-400">{affordableTiles}</div>
                <div className="text-xs text-gray-400">Affordable</div>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-lg font-bold text-amber-400">{totalTiles - affordableTiles}</div>
                <div className="text-xs text-gray-400">Need More Gold</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card className="border-amber-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
        <CardContent className="p-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Calculator className="h-5 w-5 text-amber-400" />
              Cost Breakdown
            </h3>
            <div className="grid gap-2">
              {tileCosts.slice(0, 6).map((tile) => (
                <div key={tile.name} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${tile.affordable ? 'bg-green-400' : 'bg-amber-400'}`} />
                    <span className="text-sm text-white">{tile.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{tile.category}</span>
                    <Badge variant="outline" className={`text-xs ${tile.affordable ? 'text-green-400 border-green-400' : 'text-amber-400 border-amber-400'}`}>
                      {tile.cost} Gold
                    </Badge>
                  </div>
                </div>
              ))}
              {tileCosts.length > 6 && (
                <div className="text-center text-sm text-gray-400">
                  +{tileCosts.length - 6} more tiles available
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 