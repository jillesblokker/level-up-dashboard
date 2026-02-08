"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown, Coins, ShoppingCart, TrendingUp, ScrollText, Filter, Ban } from 'lucide-react'
import { KINGDOM_TILES } from '@/lib/kingdom-tiles'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format } from 'date-fns'

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-950 border border-amber-900/50 p-3 rounded-lg shadow-xl">
        <p className="text-amber-200 font-serif mb-1">{label}</p>
        <p className="text-sm font-mono text-white">
          {payload[0].value.toLocaleString()} Gold
        </p>
      </div>
    )
  }
  return null
}

export function EconomyTransparency() {
  const [stats, setStats] = useState({
    gold: 0,
    totalEarned: 0,
    totalSpent: 0,
    netFlow: 0
  })
  const [allTransactions, setAllTransactions] = useState<EconomyTransaction[]>([])
  const [tileCosts, setTileCosts] = useState<TileCost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState('all') // 'all', 'earned', 'spent'
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadEconomyData = async () => {
      setIsLoading(true)
      try {
        // Fetch real data
        const [statsRes, transRes] = await Promise.all([
          fetch('/api/character-stats'),
          fetch('/api/gold-transactions?limit=50')
        ])

        if (statsRes.ok && transRes.ok) {
          const statsData = await statsRes.json()
          const transData = await transRes.json()
          const transactions = transData.data || []

          // Calculate totals from history (this might be partial if limit=50, 
          // but serves the visual purpose for "Recent Flow")
          const earned = transactions.filter((t: any) => t.transaction_type === 'gain').reduce((sum: number, t: any) => sum + t.amount, 0)
          const spent = transactions.filter((t: any) => t.transaction_type === 'spend').reduce((sum: number, t: any) => sum + t.amount, 0)

          setStats({
            gold: statsData.gold || 0,
            totalEarned: earned,
            totalSpent: spent,
            netFlow: earned - spent
          })

          setAllTransactions(transactions.map((t: any) => ({
            type: t.transaction_type === 'gain' ? 'earned' : 'spent',
            amount: t.amount,
            source: t.source || 'Unknown',
            timestamp: new Date(t.created_at),
            description: t.description || (t.transaction_type === 'gain' ? 'Income' : 'Expense')
          })))
        }

        // Load dynamic tile costs
        const highlightedTiles = KINGDOM_TILES
          .filter(t => t.cost && t.cost > 0)
          .sort((a, b) => (a.cost || 0) - (b.cost || 0))
          .slice(0, 6)
          .map(t => ({
            name: t.name,
            cost: t.cost || 0,
            category: t.itemType === 'none' ? 'Architecture' : 'Industry',
            description: t.clickMessage || 'A kingdom structure'
          }))

        setTileCosts(highlightedTiles)

      } catch (error) {
        console.error('[Ledger] Error loading economy data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEconomyData()

    // Listen for updates from other components
    const handleStatsUpdate = () => loadEconomyData()
    window.addEventListener('character-stats-update', handleStatsUpdate)

    return () => {
      window.removeEventListener('character-stats-update', handleStatsUpdate)
    }
  }, [])

  // Find next affordable goal
  const nextGoal = tileCosts.find(t => t.cost > stats.gold) || tileCosts[tileCosts.length - 1]
  const progressToGoal = nextGoal ? Math.min((stats.gold / nextGoal.cost) * 100, 100) : 100

  // Filter Transactions
  const filteredData = useMemo(() => {
    if (filterType === 'all') return allTransactions
    return allTransactions.filter(t => t.type === filterType)
  }, [allTransactions, filterType])

  // Process Data for Chart
  const chartData = useMemo(() => {
    const groups: Record<string, { date: string, value: number }> = {}

    // Process in chronological order
    const sorted = [...filteredData].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    sorted.forEach(t => {
      const dateKey = format(t.timestamp, 'MMM dd')
      if (!groups[dateKey]) {
        groups[dateKey] = { date: dateKey, value: 0 }
      }
      groups[dateKey].value += t.amount
    })

    return Object.values(groups)
  }, [filteredData])

  return (
    <div className="space-y-6">
      {/* Main Economy Overview */}
      <Card className="border-amber-800/20 bg-gradient-to-br from-zinc-950 to-zinc-900 shadow-xl">
        <CardHeader className="border-b border-amber-900/10 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-3 text-amber-200 font-serif text-2xl">
                <ScrollText className="h-6 w-6 text-amber-500" />
                Royal Treasury Ledger
              </CardTitle>
              <CardDescription className="text-zinc-400 mt-1">
                A record of the realm&apos;s wealth and expenditures
              </CardDescription>
            </div>

            <div className="w-full md:w-[180px]">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="border-amber-900/30 bg-black/40 text-amber-100">
                  <SelectValue placeholder="Filter View" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-amber-900/50 text-amber-100">
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="earned">Income Only</SelectItem>
                  <SelectItem value="spent">Expenses Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          {/* Current Balance */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-amber-900/30 bg-black/40 relative overflow-hidden group">
              <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
              <CardContent className="p-5 relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Coins className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="font-medium text-zinc-300">Current Treasury</h3>
                </div>
                <div className="text-3xl font-bold text-amber-200 font-serif tracking-tight">
                  {stats.gold.toLocaleString()} <span className="text-sm font-sans font-normal text-amber-500/70">Gold</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-900/30 bg-black/40 relative overflow-hidden group">
              <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
              <CardContent className="p-5 relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <ArrowUp className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="font-medium text-zinc-300">Recent Income</h3>
                </div>
                <div className="text-3xl font-bold text-green-200 font-serif tracking-tight">
                  +{stats.totalEarned.toLocaleString()} <span className="text-sm font-sans font-normal text-green-500/70">Gold</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-900/30 bg-black/40 relative overflow-hidden group">
              <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
              <CardContent className="p-5 relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <ArrowDown className="h-5 w-5 text-red-400" />
                  </div>
                  <h3 className="font-medium text-zinc-300">Recent Expenses</h3>
                </div>
                <div className="text-3xl font-bold text-red-200 font-serif tracking-tight">
                  -{stats.totalSpent.toLocaleString()} <span className="text-sm font-sans font-normal text-red-500/70">Gold</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Graph */}
          <div className="bg-black/20 rounded-xl p-4 border border-zinc-800/50">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {filterType === 'all' ? 'Transaction Volume' : filterType === 'earned' ? 'Income Velocity' : 'Expense Volume'}
            </h3>
            <div className="h-[200px] w-full min-h-[200px]">
              {chartData.length > 0 && mounted ? (
                <ResponsiveContainer width="99%" height={200} className="min-h-[200px]" debounce={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={filterType === 'earned' ? '#4ade80' : filterType === 'spent' ? '#f87171' : '#fbbf24'} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={filterType === 'earned' ? '#4ade80' : filterType === 'spent' ? '#f87171' : '#fbbf24'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#71717a"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={filterType === 'earned' ? '#4ade80' : filterType === 'spent' ? '#f87171' : '#fbbf24'}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                  <Ban className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No data available for this view</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Goals */}
          {nextGoal && (
            <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-zinc-300">Next Goal: <span className="text-amber-200">{nextGoal.name}</span></span>
                </div>
                <span className="text-xs text-zinc-500 uppercase tracking-widest">{Math.round(progressToGoal)}% Funded</span>
              </div>
              <Progress value={progressToGoal} className="h-2 bg-zinc-800" indicatorClassName="bg-amber-600" />
              <p className="text-xs text-zinc-500 mt-2 text-right">
                {Math.max(0, nextGoal.cost - stats.gold).toLocaleString()} gold needed
              </p>
            </div>
          )}

          {/* Recent Ledger Entries */}
          <div className="space-y-4">
            <h3 className="text-lg font-serif text-amber-200 flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              Ledger Entries
              {filterType !== 'all' && (
                <Badge variant="outline" className="ml-2 border-amber-500/30 text-amber-500 text-[10px] uppercase">
                  {filterType}
                </Badge>
              )}
            </h3>
            <div className="space-y-1 rounded-xl overflow-hidden border border-zinc-800/50">
              {isLoading ? (
                <div className="p-8 text-center text-zinc-500">Retrieving records...</div>
              ) : filteredData.length > 0 ? (
                filteredData.slice(0, 15).map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors border-b border-zinc-900 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-full ${transaction.type === 'earned' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {transaction.type === 'earned' ? (
                          <ArrowUp className="h-3 w-3 text-green-400" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-zinc-200 font-medium capitalize">{transaction.description || transaction.source}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{format(transaction.timestamp, 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <div className={`font-mono font-bold ${transaction.type === 'earned' ? 'text-green-400' : 'text-red-400'}`}>
                      {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500 italic">No {filterType === 'all' ? '' : filterType} records found in the ledger.</div>
              )}
            </div>
          </div>

          {/* Market Reference */}
          <div className="pt-6 border-t border-amber-900/10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2 mb-4">
              <ShoppingCart className="h-4 w-4" />
              Standard Market Rates
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {tileCosts.map((tile) => (
                <div key={tile.name} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-zinc-800">
                  <span className="text-sm text-zinc-300">{tile.name}</span>
                  <Badge variant="outline" className="text-amber-500 border-amber-900/30 bg-amber-950/10">
                    {tile.cost} G
                  </Badge>
                </div>
              ))}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}