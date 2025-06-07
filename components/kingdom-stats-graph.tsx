"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollText, Coins, Trophy, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { getAggregatedKingdomData } from "@/lib/kingdom-events"
import { useRouter } from "next/navigation"

// Time period types
type TimePeriod = 'today' | 'weekly' | 'yearly'

// Data type for graph rendering
interface GraphData {
  day: string
  gold: number
  experience: number
  quests: number
}

// Empty state component
function EmptyState() {
  const router = useRouter();
  return (
    <section
      className="relative h-64 w-full flex flex-col items-center justify-center text-center rounded-lg overflow-hidden"
      aria-label="kingdom-stats-empty-state-section"
    >
      {/* Placeholder image */}
      <img
        src="/images/quests-header.jpg"
        alt="Empty kingdom stats placeholder"
        className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
        aria-hidden="true"
      />
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full space-y-3">
        <div className="text-amber-500 text-xl font-bold drop-shadow-md" aria-label="kingdom-stats-empty-title">
          No data yet
        </div>
        <div className="text-gray-100 text-base" aria-label="kingdom-stats-empty-desc">
          Start habit building now to see your kingdom flourish!
        </div>
        <button
          className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition-all"
          aria-label="Start your first quest"
          tabIndex={0}
          role="button"
          onClick={() => router.push('/quests')}
        >
          Start Your First Quest
        </button>
      </div>
    </section>
  )
}

export function KingdomStatsGraph() {
  const [activeTab, setActiveTab] = useState("quests")
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly')
  const [graphData, setGraphData] = useState<GraphData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load data when time period changes
  useEffect(() => {
    const loadData = () => {
      try {
        setIsLoading(true)
        const data = getAggregatedKingdomData(timePeriod)
        setGraphData(data)
        console.log(`📊 Kingdom stats loaded for ${timePeriod}:`, data)
      } catch (error) {
        console.error('Error loading kingdom stats:', error)
        setGraphData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [timePeriod])

  // Listen for real-time updates
  useEffect(() => {
    const handleKingdomUpdate = () => {
      // Reload data when events occur
      const data = getAggregatedKingdomData(timePeriod)
      setGraphData(data)
      console.log(`🔄 Kingdom stats updated for ${timePeriod}:`, data)
    }

    // Listen for kingdom events
    window.addEventListener('kingdom:goldGained', handleKingdomUpdate)
    window.addEventListener('kingdom:experienceGained', handleKingdomUpdate)
    window.addEventListener('kingdom:questCompleted', handleKingdomUpdate)

    // Listen for legacy events for backward compatibility
    window.addEventListener('goldUpdate', handleKingdomUpdate)
    window.addEventListener('expUpdate', handleKingdomUpdate)
    window.addEventListener('questComplete', handleKingdomUpdate)

    return () => {
      window.removeEventListener('kingdom:goldGained', handleKingdomUpdate)
      window.removeEventListener('kingdom:experienceGained', handleKingdomUpdate)
      window.removeEventListener('kingdom:questCompleted', handleKingdomUpdate)
      window.removeEventListener('goldUpdate', handleKingdomUpdate)
      window.removeEventListener('expUpdate', handleKingdomUpdate)
      window.removeEventListener('questComplete', handleKingdomUpdate)
    }
  }, [timePeriod])

  // Check if data has any values > 0
  const hasData = (data: GraphData[], type: 'quests' | 'gold' | 'experience') => {
    return data.some(item => item[type] > 0)
  }

  // Get time period display name
  const getTimePeriodName = () => {
    switch (timePeriod) {
      case 'today':
        return 'Today\'s Progress'
      case 'weekly':
        return 'Weekly Progress'
      case 'yearly':
        return 'This Year\'s Progress'
      default:
        return 'Weekly Progress'
    }
  }

  const getHighestValue = (data: GraphData[], type: 'quests' | 'gold' | 'experience') => {
    return Math.max(...data.map(item => item[type]), 10)
  }

  const renderGraph = (data: GraphData[], type: 'quests' | 'gold' | 'experience', color: string, unit: string) => {
    const highestValue = getHighestValue(data, type)
    
    if (isLoading) {
      return (
        <div className="h-64 flex items-center justify-center" aria-label="kingdom-stats-loading">
          <div className="text-gray-400">Loading stats...</div>
        </div>
      )
    }

    return (
      <div className="h-64 flex items-end w-full space-x-1" aria-label={`kingdom-stats-${type}-graph`}>
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className={`w-full ${color} rounded-t transition-all duration-300`} 
              style={{ 
                height: `${item[type] > 0 ? (item[type] / highestValue) * 160 : 0}px`,
                minHeight: item[type] > 0 ? '4px' : '0'
              }}
              aria-label={`${type}-bar-${item.day}-${item[type]}`}
            ></div>
            <div className="mt-2 w-full text-center">
              <div className="text-xs font-medium text-gray-400">{item.day}</div>
              <div className="text-sm font-bold">{item[type]}{unit}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="border border-amber-800/20 bg-black" aria-label="kingdom-stats-card">
      <CardHeader>
        <CardTitle className="text-xl font-medievalsharp text-amber-500">
          <div className="flex items-center justify-between">
            {getTimePeriodName()}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="time-period-dropdown">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTimePeriod('today')} aria-label="select-today">
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimePeriod('weekly')} aria-label="select-weekly">
                  Weekly
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimePeriod('yearly')} aria-label="select-yearly">
                  This Year
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="quests" onValueChange={setActiveTab} aria-label="kingdom-stats-tabs">
          <TabsList className="mb-4 w-full grid grid-cols-3" aria-label="kingdom-stats-tab-list">
            <TabsTrigger value="quests" aria-label="quests-tab">Quests</TabsTrigger>
            <TabsTrigger value="gold" aria-label="gold-tab">Gold</TabsTrigger>
            <TabsTrigger value="exp" aria-label="experience-tab">Experience</TabsTrigger>
          </TabsList>
          <TabsContent value="quests" aria-label="quests-content">
            {hasData(graphData, 'quests') ? renderGraph(graphData, 'quests', 'bg-purple-600', '') : <EmptyState />}
          </TabsContent>
          <TabsContent value="gold" aria-label="gold-content">
            {hasData(graphData, 'gold') ? renderGraph(graphData, 'gold', 'bg-yellow-500', 'g') : <EmptyState />}
          </TabsContent>
          <TabsContent value="exp" aria-label="experience-content">
            {hasData(graphData, 'experience') ? renderGraph(graphData, 'experience', 'bg-blue-500', 'xp') : <EmptyState />}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 