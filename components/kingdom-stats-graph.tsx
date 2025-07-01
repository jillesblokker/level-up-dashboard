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
type TimePeriod = 'week' | 'month' | 'year' | 'all'

// Data type for graph rendering
interface GraphData {
  day: string
  gold: number
  experience: number
  quests: number
}

// Empty state component
interface EmptyStateProps {
  tab: 'challenges' | 'quests' | 'gold' | 'experience';
}

function EmptyState({ tab }: EmptyStateProps) {
  const isChallenge = tab === 'challenges';
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
        <Link href={isChallenge ? "/challenges" : "/quests?tab=quests"} passHref legacyBehavior>
          <a
            className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition-all"
            aria-label={isChallenge ? "Start your first challenge" : "Start your first quest"}
            tabIndex={0}
            role="button"
          >
            {isChallenge ? "Start Your First Challenge" : "Start Your First Quest"}
          </a>
        </Link>
      </div>
    </section>
  );
}

export function KingdomStatsGraph({ userId }: { userId: string | null }) {
  const [activeTab, setActiveTab] = useState<'challenges' | 'quests' | 'gold' | 'experience'>('challenges')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week')
  const [graphData, setGraphData] = useState<Array<{ day: string; value: number }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const { supabase } = useSupabase()
  const { userId: clerkUserId } = useAuth()
  const uid = userId || clerkUserId

  // Helper to get date ranges for each period
  function getDateRange(period: TimePeriod) {
    const now = new Date();
    let days: string[] = [];
    if (period === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }
    } else if (period === 'month') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }
    } else if (period === 'year') {
      // Group by month for the last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        days.push(d.toISOString().slice(0, 7)); // YYYY-MM
      }
    } else if (period === 'all') {
      // Just one bar for all time
      days = ['all'];
    }
    return days;
  }

  // Fetch and aggregate data for the selected tab and period
  useEffect(() => {
    if (!uid || !supabase) return;
    setIsLoading(true);
    const days = getDateRange(timePeriod);
    const fetchData = async () => {
      let data: Array<{ day: string; value: number }> = days.map(day => ({ day, value: 0 }));
      let fromDate: string | undefined;
      if (timePeriod === 'week') fromDate = days[0] + 'T00:00:00.000Z';
      else if (timePeriod === 'month') fromDate = days[0] + 'T00:00:00.000Z';
      else if (timePeriod === 'year') fromDate = days[0] + '-01T00:00:00.000Z';
      // For 'all', no fromDate filter
      if (activeTab === 'challenges') {
        const { data: completions } = await supabase
          .from('ChallengeCompletion')
          .select('completedAt')
          .eq('userId', uid)
          .gte('completedAt', fromDate || '')
        if (Array.isArray(completions)) {
          completions.forEach((row) => {
            const completedAt = row && typeof row === 'object' ? (row as { completedAt?: string }).completedAt : undefined;
            if (typeof completedAt !== 'string') return;
            if (timePeriod === 'year') {
              const month = completedAt.slice(0, 7);
              const idx = data.findIndex(d => d.day === month);
              if (idx !== -1 && data[idx]) data[idx].value += 1;
            } else if (timePeriod === 'all') {
              if (data[0]) data[0].value += 1;
            } else {
              const day = completedAt.slice(0, 10);
              const idx = data.findIndex(d => d.day === day);
              if (idx !== -1 && data[idx]) data[idx].value += 1;
            }
          });
        }
      } else if (activeTab === 'quests') {
        const { data: completions } = await supabase
          .from('QuestCompletion')
          .select('date')
          .eq('completed', true)
          .eq('user_id', uid)
          .gte('date', fromDate || '')
        if (Array.isArray(completions)) {
          completions.forEach((row) => {
            const date = row && typeof row === 'object' ? (row as { date?: string }).date : undefined;
            if (typeof date !== 'string') return;
            if (timePeriod === 'year') {
              const month = date.slice(0, 7);
              const idx = data.findIndex(d => d.day === month);
              if (idx !== -1 && data[idx]) data[idx].value += 1;
            } else if (timePeriod === 'all') {
              if (data[0]) data[0].value += 1;
            } else {
              const day = date.slice(0, 10);
              const idx = data.findIndex(d => d.day === day);
              if (idx !== -1 && data[idx]) data[idx].value += 1;
            }
          });
        }
      } else if (activeTab === 'gold') {
        const { data: golds } = await supabase
          .from('gold_transactions')
          .select('amount,created_at')
          .eq('user_id', uid)
          .gte('created_at', fromDate || '')
        if (Array.isArray(golds)) {
          golds.forEach((row) => {
            const createdAt = row && typeof row === 'object' ? (row as { created_at?: string }).created_at : undefined;
            const amount = row && typeof row === 'object' ? (row as { amount?: number | string }).amount : 0;
            if (typeof createdAt !== 'string') return;
            const parsedAmount = typeof amount === 'number' ? amount : (parseInt(amount as string, 10) || 0);
            if (timePeriod === 'year') {
              const month = createdAt.slice(0, 7);
              const idx = data.findIndex(d => d.day === month);
              if (idx !== -1 && data[idx]) data[idx].value += parsedAmount;
            } else if (timePeriod === 'all') {
              if (data[0]) data[0].value += parsedAmount;
            } else {
              const day = createdAt.slice(0, 10);
              const idx = data.findIndex(d => d.day === day);
              if (idx !== -1 && data[idx]) data[idx].value += parsedAmount;
            }
          });
        }
      } else if (activeTab === 'experience') {
        const { data: exps } = await supabase
          .from('ExperienceTransaction')
          .select('amount,createdAt')
          .eq('userId', uid)
          .gte('createdAt', fromDate || '')
        if (Array.isArray(exps)) {
          exps.forEach((row) => {
            const createdAt = row && typeof row === 'object' ? (row as { createdAt?: string }).createdAt : undefined;
            const amount = row && typeof row === 'object' ? (row as { amount?: number | string }).amount : 0;
            if (typeof createdAt !== 'string') return;
            const parsedAmount = typeof amount === 'number' ? amount : (parseInt(amount as string, 10) || 0);
            if (timePeriod === 'year') {
              const month = createdAt.slice(0, 7);
              const idx = data.findIndex(d => d.day === month);
              if (idx !== -1 && data[idx]) data[idx].value += parsedAmount;
            } else if (timePeriod === 'all') {
              if (data[0]) data[0].value += parsedAmount;
            } else {
              const day = createdAt.slice(0, 10);
              const idx = data.findIndex(d => d.day === day);
              if (idx !== -1 && data[idx]) data[idx].value += parsedAmount;
            }
          });
        }
      }
      setGraphData(data);
      setIsLoading(false);
    };
    fetchData();
  }, [activeTab, uid, supabase, timePeriod]);

  // Check if there is any data
  const hasData = graphData.some(d => d.value > 0);

  // Render
  return (
    <Card className="bg-black border-amber-800">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-amber-500 text-2xl font-bold">Kingdom Statistics</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Select time period" className="ml-2">
                {(() => {
                  if (timePeriod === 'week') return 'This week';
                  if (timePeriod === 'month') return 'This month';
                  if (timePeriod === 'year') return 'This year';
                  return 'All time';
                })()}
                <ChevronDown className="ml-2 w-4 h-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent aria-label="kingdom-stats-time-period-dropdown">
              <DropdownMenuItem onSelect={() => setTimePeriod('week')} aria-label="This week">This week</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTimePeriod('month')} aria-label="This month">This month</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTimePeriod('year')} aria-label="This year">This year</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTimePeriod('all')} aria-label="All time">All time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="text-gray-300">Track your realm&apos;s growth</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="py-4">
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
          ) : !hasData ? (
            <EmptyState tab={activeTab} />
          ) : (
            <div className="h-64 flex items-end gap-2 w-full px-4">
              {graphData.map((d, i) => (
                <div key={d.day} className="flex flex-col items-center justify-end flex-1">
                  <div
                    className="w-full rounded-t bg-amber-500 transition-all"
                    style={{ height: `${d.value === 0 ? 8 : d.value * 32}px`, minHeight: 8 }}
                    aria-label={`bar-${d.day}`}
                  />
                  <div className="text-xs text-gray-300 mt-1">{timePeriod === 'year' ? d.day : new Date(d.day).toLocaleDateString()}</div>
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