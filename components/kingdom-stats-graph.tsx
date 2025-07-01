"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import Link from 'next/link'
import { useSupabaseRealtimeSync } from "@/hooks/useSupabaseRealtimeSync"
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useAuth } from '@clerk/nextjs'

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
        <Link href="/quests?tab=quests" passHref legacyBehavior>
          <a className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition-all" aria-label="Start your first quest" tabIndex={0} role="button">
            Start Your First Quest
          </a>
        </Link>
      </div>
    </section>
  )
}

export function KingdomStatsGraph({ userId }: { userId: string | null }) {
  const [activeTab, setActiveTab] = useState<'challenges' | 'quests' | 'gold' | 'experience'>('challenges')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly')
  const [graphData, setGraphData] = useState<Array<{ day: string; value: number }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const { supabase } = useSupabase()
  const { userId: clerkUserId } = useAuth()
  const uid = userId || clerkUserId

  // Helper to get last 7 days as strings (YYYY-MM-DD)
  function getLast7Days() {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }
    return days
  }

  // Fetch and aggregate data for the selected tab
  useEffect(() => {
    if (!uid || !supabase) return
    setIsLoading(true)
    const days = getLast7Days()
    const fetchData = async () => {
      let data: Array<{ day: string; value: number }> = days.map(day => ({ day, value: 0 }))
      if (activeTab === 'challenges') {
        // Fetch challenge completions
        const { data: completions } = await supabase
          .from('ChallengeCompletion')
          .select('completedAt')
          .eq('userId', uid)
          .gte('completedAt', days[0] + 'T00:00:00.000Z')
        if (completions) {
          completions.forEach((row: any) => {
            const completedAt = row?.completedAt;
            if (typeof completedAt !== 'string') return;
            const day = completedAt.slice(0, 10);
            const idx = data.findIndex(d => d.day === day);
            if (idx !== -1) data[idx].value += 1;
          });
        }
      } else if (activeTab === 'quests') {
        // Fetch quest completions
        const { data: completions } = await supabase
          .from('QuestCompletion')
          .select('date')
          .eq('completed', true)
          .eq('user_id', uid)
          .gte('date', days[0] + 'T00:00:00.000Z')
        if (completions) {
          completions.forEach((row: any) => {
            const date = row?.date;
            if (typeof date !== 'string') return;
            const day = date.slice(0, 10);
            const idx = data.findIndex(d => d.day === day);
            if (idx !== -1) data[idx].value += 1;
          });
        }
      } else if (activeTab === 'gold') {
        // Fetch gold transactions (if available)
        const { data: golds } = await supabase
          .from('gold_transactions')
          .select('amount,created_at')
          .eq('user_id', uid)
          .gte('created_at', days[0] + 'T00:00:00.000Z')
        if (golds) {
          golds.forEach((row: any) => {
            const createdAt = row?.created_at;
            if (typeof createdAt !== 'string') return;
            const day = createdAt.slice(0, 10);
            const idx = data.findIndex(d => d.day === day);
            if (idx !== -1) data[idx].value += typeof row.amount === 'number' ? row.amount : (parseInt(row.amount, 10) || 0);
          });
        }
      } else if (activeTab === 'experience') {
        // Fetch experience transactions
        const { data: exps } = await supabase
          .from('ExperienceTransaction')
          .select('amount,createdAt')
          .eq('userId', uid)
          .gte('createdAt', days[0] + 'T00:00:00.000Z')
        if (exps) {
          exps.forEach((row: any) => {
            const createdAt = row?.createdAt;
            if (typeof createdAt !== 'string') return;
            const day = createdAt.slice(0, 10);
            const idx = data.findIndex(d => d.day === day);
            if (idx !== -1) data[idx].value += typeof row.amount === 'number' ? row.amount : (parseInt(row.amount, 10) || 0);
          });
        }
      }
      setGraphData(data)
      setIsLoading(false)
    }
    fetchData()
  }, [activeTab, uid, supabase])

  // Check if there is any data
  const hasData = graphData.some(d => d.value > 0)

  // Render
  return (
    <Card className="bg-black border-amber-800">
      <CardHeader>
        <CardTitle className="text-amber-500 text-2xl font-bold">Kingdom Statistics</CardTitle>
        <CardDescription className="text-gray-300">Track your realm's growth</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="py-4">
          <div className="text-amber-400 text-xl font-semibold mb-2">Weekly Progress</div>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)} className="mb-4">
            <TabsList aria-label="kingdom-stats-tabs">
              <TabsTrigger value="challenges" aria-label="challenges-tab">Challenges</TabsTrigger>
              <TabsTrigger value="quests" aria-label="quests-tab">Quests</TabsTrigger>
              <TabsTrigger value="gold" aria-label="gold-tab">Gold</TabsTrigger>
              <TabsTrigger value="experience" aria-label="experience-tab">Experience</TabsTrigger>
            </TabsList>
          </Tabs>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
          ) : !hasData && activeTab === 'challenges' ? (
            <EmptyState />
          ) : (
            <div className="h-64 flex items-end gap-2 w-full px-4">
              {graphData.map((d, i) => (
                <div key={d.day} className="flex flex-col items-center justify-end flex-1">
                  <div
                    className="w-full rounded-t bg-amber-500 transition-all"
                    style={{ height: `${d.value === 0 ? 8 : d.value * 32}px`, minHeight: 8 }}
                    aria-label={`bar-${d.day}`}
                  />
                  <div className="text-xs text-gray-300 mt-1">{new Date(d.day).toLocaleDateString()}</div>
                  <div className="text-lg text-white font-bold">{d.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}