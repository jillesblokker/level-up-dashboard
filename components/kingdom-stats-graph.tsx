"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { getAggregatedKingdomData } from "@/lib/kingdom-events"
import Image from 'next/image'

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
  return (
    <section
      className="relative h-64 w-full flex flex-col items-center justify-center text-center rounded-lg overflow-hidden"
      aria-label="kingdom-stats-empty-state-section"
    >
      {/* Placeholder image */}
      <Image
        src="/images/quests-header.jpg"
        alt="Empty kingdom stats placeholder"
        className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
        width={400}
        height={300}
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
  const [statType, setStatType] = useState<'quests' | 'gold' | 'experience'>('quests')
  // Challenge state
  const [challengeData, setChallengeData] = useState<Array<{ day: string; count: number }>>([])
  const [challengeCompleted, setChallengeCompleted] = useState(false)

  // Load challenge data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('kingdom-challenge-data-v1')
    if (stored) {
      let parsed: any = [];
      try {
        parsed = JSON.parse(stored)
      } catch { parsed = [] }
      if (!Array.isArray(parsed)) parsed = [];
      setChallengeData(parsed)
      setChallengeCompleted(
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        parsed.some((d: { count?: number } | undefined) => !!d && typeof d.count === 'number' && d.count > 0)
      )
    }
  }, [])

  // Save challenge data to localStorage
  useEffect(() => {
    localStorage.setItem('kingdom-challenge-data-v1', JSON.stringify(challengeData))
    const arr = Array.isArray(challengeData) ? challengeData : [];
    setChallengeCompleted(
      Array.isArray(arr) &&
      arr.length > 0 &&
      arr.some((d: { count?: number } | undefined) => !!d && typeof d.count === 'number' && d.count > 0)
    )
  }, [challengeData])

  // Handler for completing a challenge
  const handleCompleteChallenge = () => {
    // Add a completion for today
    const today = new Date().toLocaleDateString()
    setChallengeData(prev => {
      const idx = prev.findIndex(d => d.day === today)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx].count += 1
        return updated
      } else {
        return [...prev, { day: today, count: 1 }]
      }
    })
  }

  // Load data when time period or statType changes
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
  }, [timePeriod, statType])

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
    <div className="flex flex-col space-y-4">
      {/* Rest of the component content */}
    </div>
  )
}