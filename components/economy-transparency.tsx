"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown, Coins, TrendingUp, ScrollText, Filter, Sparkles } from 'lucide-react'
import { TreasureChestVisual } from '@/components/ui/treasure-chest-visual'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { formatGold } from '@/lib/utils'

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
      <div className="bg-[#18110b] border border-amber-500/50 p-3 rounded-xl shadow-2xl font-serif text-amber-100">
        <p className="text-amber-300 font-bold mb-1 text-xs flex items-center gap-1.5">
          <span>📜</span> {label}
        </p>
        <p className="text-sm font-mono font-bold text-amber-200">
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
        const [statsRes, transRes] = await Promise.all([
          fetch('/api/character-stats'),
          fetch('/api/gold-transactions?limit=50')
        ])

        if (statsRes.ok && transRes.ok) {
          const statsData = await statsRes.json()
          const transData = await transRes.json()
          const transactions = transData.data || []

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
        logger.error('[Ledger] Error loading economy data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEconomyData()

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
      {/* Main Economy Vault Overview */}
      <Card className="border-2 border-amber-600/40 bg-gradient-to-b from-[#1c130b] via-[#120c07] to-[#0a0704] text-amber-100 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(251,191,36,0.3)] relative overflow-hidden font-serif">
        {/* Gold Top Highlight Line & Ambient Vault Glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="border-b border-amber-900/30 pb-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-3 text-amber-200 font-serif text-xl sm:text-2xl font-bold tracking-tight">
                <ScrollText className="h-6 w-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                Royal treasury ledger
              </CardTitle>
              <CardDescription className="text-amber-200/60 mt-1 text-xs font-sans">
                A record of the realm&apos;s wealth, district tithes, and expenditures
              </CardDescription>
            </div>

            <div className="w-full md:w-[190px]">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="border-amber-500/40 bg-black/50 text-amber-200 rounded-xl font-serif text-xs">
                  <SelectValue placeholder="Filter view" />
                </SelectTrigger>
                <SelectContent className="bg-[#140e08] border-amber-500/40 text-amber-100 font-serif">
                  <SelectItem value="all">All records</SelectItem>
                  <SelectItem value="earned">Tithes &amp; income</SelectItem>
                  <SelectItem value="spent">Expenditures</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6 relative z-10">
          {/* Current Balance / Ledger Metric Plaques */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Vault Reserve */}
            <div className="border border-amber-500/40 bg-gradient-to-br from-amber-950/70 via-[#140e08] to-zinc-950 p-4 rounded-xl shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-amber-500/20 border-b border-l border-amber-500/30 text-amber-300 text-[9px] font-mono font-bold rounded-bl-lg">
                Vault
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md">
                  <Coins className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-bold text-amber-200/80 font-serif">Royal treasury vault</h3>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-200 font-serif tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" title={`${stats.gold.toLocaleString()} Gold`}>
                {formatGold(stats.gold)} <span className="text-xs font-serif font-normal text-amber-400/70">Gold</span>
              </div>
            </div>

            {/* Tithe Inflow */}
            <div className="border border-emerald-500/40 bg-gradient-to-br from-emerald-950/50 via-[#0a150e] to-zinc-950 p-4 rounded-xl shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-emerald-500/20 border-b border-l border-emerald-500/30 text-emerald-300 text-[9px] font-mono font-bold rounded-bl-lg">
                Inflow
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-md">
                  <ArrowUp className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-bold text-emerald-200/80 font-serif">Tithe inflow</h3>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-300 font-serif tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                +{stats.totalEarned.toLocaleString()} <span className="text-xs font-serif font-normal text-emerald-400/70">Gold</span>
              </div>
            </div>

            {/* Realm Expenditures */}
            <div className="border border-red-500/40 bg-gradient-to-br from-red-950/50 via-[#180a0a] to-zinc-950 p-4 rounded-xl shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-red-500/20 border-b border-l border-red-500/30 text-red-300 text-[9px] font-mono font-bold rounded-bl-lg">
                Outflow
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-300 shadow-md">
                  <ArrowDown className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-bold text-red-200/80 font-serif">Realm expenditures</h3>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-red-300 font-serif tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                -{stats.totalSpent.toLocaleString()} <span className="text-xs font-serif font-normal text-red-400/70">Gold</span>
              </div>
            </div>
          </div>

          {/* Analysis Graph / Empty State */}
          <div className="bg-[#0e0a07]/90 rounded-2xl p-4 sm:p-5 border border-amber-900/40 shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-amber-400/90 flex items-center gap-2 font-serif">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                {filterType === 'all' ? 'Treasury flow ledger' : filterType === 'earned' ? 'Tithe velocity' : 'Expenditure volume'}
              </h3>
              <span className="text-[10px] text-amber-500/60 font-mono font-bold">Archive: recent records</span>
            </div>

            <div className="min-h-[220px] w-full flex items-center justify-center">
              {chartData.length > 0 && mounted ? (
                <ResponsiveContainer width="99%" height={220} className="min-h-[220px]" debounce={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={filterType === 'earned' ? '#10b981' : filterType === 'spent' ? '#f43f5e' : '#f59e0b'} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={filterType === 'earned' ? '#10b981' : filterType === 'spent' ? '#f43f5e' : '#f59e0b'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#78350f" strokeOpacity={0.25} vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#d97706"
                      strokeOpacity={0.6}
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#78350f', strokeOpacity: 0.4 }}
                    />
                    <YAxis
                      stroke="#d97706"
                      strokeOpacity={0.6}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={filterType === 'earned' ? '#10b981' : filterType === 'spent' ? '#f43f5e' : '#f59e0b'}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                /* Rich Medieval Empty State with Rockie & Symmetrical Vault Chest Frame */
                <div className="w-full py-6 px-4 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-center gap-3 relative">
                    {/* Rockie Avatar Frame */}
                    <div className="relative w-14 h-14 rounded-2xl border-2 border-amber-500/40 bg-zinc-950/90 shadow-xl overflow-hidden shrink-0 flex items-center justify-center">
                      <Image
                        src="/images/creatures/Rockie.webp"
                        alt="Rockie"
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    </div>

                    {/* Matching Iron Chest Frame */}
                    <div className="relative w-14 h-14 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-950/60 to-zinc-950 shadow-xl overflow-hidden shrink-0 flex items-center justify-center p-2 relative group">
                      <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                        <defs>
                          <linearGradient id="oakWoodEmpty" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#78350f" />
                            <stop offset="50%" stopColor="#451a03" />
                            <stop offset="100%" stopColor="#290e02" />
                          </linearGradient>
                          <linearGradient id="goldPlateEmpty" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#b45309" />
                            <stop offset="30%" stopColor="#f59e0b" />
                            <stop offset="70%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#78350f" />
                          </linearGradient>
                        </defs>
                        <rect x="15" y="45" width="90" height="45" rx="6" fill="url(#oakWoodEmpty)" stroke="#18181b" strokeWidth="2" />
                        <rect x="25" y="45" width="10" height="45" fill="url(#goldPlateEmpty)" opacity="0.9" />
                        <rect x="85" y="45" width="10" height="45" fill="url(#goldPlateEmpty)" opacity="0.9" />
                        <path d="M 12 45 Q 60 12 108 45 Z" fill="url(#oakWoodEmpty)" stroke="#18181b" strokeWidth="2" />
                        <path d="M 25 45 Q 60 22 85 45" fill="none" stroke="url(#goldPlateEmpty)" strokeWidth="6" opacity="0.9" />
                        <rect x="50" y="40" width="20" height="22" rx="3" fill="url(#goldPlateEmpty)" stroke="#451a03" strokeWidth="1.5" />
                        <circle cx="60" cy="48" r="3" fill="#18181b" />
                        <polygon points="58.5,48 61.5,48 62,56 58,56" fill="#18181b" />
                      </svg>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-zinc-950 border border-amber-500/50 flex items-center justify-center text-[9px]" title="Locked vault">
                        🔒
                      </div>
                    </div>
                  </div>

                  <div className="max-w-md space-y-1.5">
                    <h4 className="text-base font-serif font-bold text-amber-200">The royal vault sits quiet</h4>
                    <p className="text-xs text-amber-300/80 leading-relaxed font-sans">
                      Rockie peeks into the iron chest: &quot;Not a single coin clinking in here yet! Complete your daily habits or collect district taxes to fill the treasury.&quot;
                    </p>
                  </div>

                  {/* Actionable CTAs to Fill the Vault */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
                    <Link href="/quests" className="w-full sm:w-auto">
                      <Button className="btn-primary-cta w-full sm:w-auto text-xs px-5 py-2.5 h-auto shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                        <span>⚔️</span> Embark on quests
                      </Button>
                    </Link>
                    <Button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new Event('collect-all-kingdom-taxes'));
                        }
                      }}
                      variant="outline"
                      className="w-full sm:w-auto text-xs px-5 py-2.5 h-auto border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <span>🏰</span> Collect district taxes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}