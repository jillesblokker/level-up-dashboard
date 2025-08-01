"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown, Coins, ShoppingCart, TrendingUp, Calculator } from 'lucide-react'
import { getCharacterStats } from '@/lib/character-stats-manager'

interface EconomyTransaction {
  type: 'earned' | 'spent'
  amount: number
  source: string
  timestamp: Date
  description: string
}

interface TileCost {
  name: string
  cost: number
  category: string
  description: string
}

export function EconomyTransparency() {
  const [stats, setStats] = useState({
    gold: 0,
    totalEarned: 0,
    totalSpent: 0,
    averagePerQuest: 0
  })
  const [recentTransactions, setRecentTransactions] = useState<EconomyTransaction[]>([])
  const [tileCosts, setTileCosts] = useState<TileCost[]>([])

  useEffect(() => {
    const loadEconomyData = () => {
      try {
        const characterStats = getCharacterStats()
        
        // Get recent transactions from localStorage
        const transactions = JSON.parse(localStorage.getItem('gold-transactions') || '[]')
        const recent = transactions.slice(-5).map((t: any) => ({
          type: t.type,
          amount: t.amount,
          source: t.source,
          timestamp: new Date(t.timestamp),
          description: t.description
        }))
        
        // Calculate totals
        const earned = transactions.filter((t: any) => t.type === 'earned').reduce((sum: number, t: any) => sum + t.amount, 0)
        const spent = transactions.filter((t: any) => t.type === 'spent').reduce((sum: number, t: any) => sum + t.amount, 0)
        
        // Calculate average per quest
        const questTransactions = transactions.filter((t: any) => t.source.includes('quest'))
        const averagePerQuest = questTransactions.length > 0 
          ? questTransactions.reduce((sum: number, t: any) => sum + t.amount, 0) / questTransactions.length 
          : 0
        
        setStats({
          gold: characterStats.gold || 0,
          totalEarned: earned,
          totalSpent: spent,
          averagePerQuest: Math.round(averagePerQuest)
        })
        
        setRecentTransactions(recent)
        
        // Load tile costs
        const costs = [
          { name: 'Basic Tile', cost: 50, category: 'Foundation', description: 'Basic building block for your kingdom' },
          { name: 'Castle Tile', cost: 200, category: 'Defense', description: 'Fortified structure for protection' },
          { name: 'Market Tile', cost: 150, category: 'Economy', description: 'Trading hub for wealth generation' },
          { name: 'Farm Tile', cost: 100, category: 'Resources', description: 'Food production for your people' },
          { name: 'Temple Tile', cost: 300, category: 'Culture', description: 'Spiritual center for morale' },
          { name: 'Barracks Tile', cost: 250, category: 'Military', description: 'Training ground for warriors' }
        ]
        setTileCosts(costs)
        
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

  const getEarningRate = () => {
    const questsCompleted = recentTransactions.filter(t => t.type === 'earned' && t.source.includes('quest')).length
    if (questsCompleted === 0) return 0
    return Math.round(stats.averagePerQuest * questsCompleted)
  }

  return (
    <div className="space-y-6">
      {/* Main Economy Overview */}
      <Card className="border-amber-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <Calculator className="h-5 w-5" />
            Kingdom Economy
          </CardTitle>
          <CardDescription className="text-gray-300">
            Track your wealth and spending patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Balance */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-amber-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Coins className="h-5 w-5 text-amber-400" />
                  <h3 className="font-semibold text-white">Current Balance</h3>
                </div>
                <div className="text-2xl font-bold text-amber-400 mb-2">
                  {stats.gold} Gold
                </div>
                <p className="text-sm text-gray-400">
                  Available for kingdom expansion
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <ArrowUp className="h-5 w-5 text-green-400" />
                  <h3 className="font-semibold text-white">Total Earned</h3>
                </div>
                <div className="text-2xl font-bold text-green-400 mb-2">
                  {stats.totalEarned} Gold
                </div>
                <p className="text-sm text-gray-400">
                  Lifetime earnings from quests
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <ArrowDown className="h-5 w-5 text-red-400" />
                  <h3 className="font-semibold text-white">Total Spent</h3>
                </div>
                <div className="text-2xl font-bold text-red-400 mb-2">
                  {stats.totalSpent} Gold
                </div>
                <p className="text-sm text-gray-400">
                  Invested in kingdom development
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Earning Rate */}
          <Card className="border-amber-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="h-5 w-5 text-amber-400" />
                <h3 className="font-semibold text-white">Earning Rate</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Average per quest</span>
                  <span className="font-semibold text-amber-400">{stats.averagePerQuest} Gold</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">This session</span>
                  <span className="font-semibold text-green-400">{getEarningRate()} Gold</span>
                </div>
                <Progress 
                  value={Math.min((stats.gold / 1000) * 100, 100)} 
                  className="h-2"
                />
                <p className="text-xs text-gray-400">
                  Progress toward next major purchase
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tile Costs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-amber-400" />
              Tile Costs
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {tileCosts.map((tile) => (
                <Card key={tile.name} className="border-amber-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-white">{tile.name}</h4>
                        <p className="text-xs text-gray-400">{tile.description}</p>
                      </div>
                      <Badge variant="outline" className="text-amber-400 border-amber-400">
                        {tile.cost} Gold
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">{tile.category}</span>
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3 text-amber-400" />
                        <span className="text-xs text-amber-400">
                          {stats.gold >= tile.cost ? 'Affordable' : `${tile.cost - stats.gold} more needed`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          {recentTransactions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <div className="space-y-2">
                {recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {transaction.type === 'earned' ? (
                        <ArrowUp className="h-4 w-4 text-green-400" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-400" />
                      )}
                      <div>
                        <p className="text-sm text-white">{transaction.description}</p>
                        <p className="text-xs text-gray-400">{transaction.source}</p>
                      </div>
                    </div>
                    <div className={`font-semibold ${transaction.type === 'earned' ? 'text-green-400' : 'text-red-400'}`}>
                      {transaction.type === 'earned' ? '+' : '-'}{transaction.amount} Gold
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 