"use client"

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown, Coins, TrendingUp, ScrollText, Filter, Ban } from 'lucide-react'
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



        </CardContent>
      </Card>
    </div>
  )
}