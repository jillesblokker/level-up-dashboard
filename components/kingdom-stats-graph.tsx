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
import { withToken } from '@/lib/supabase/client'
import { format, parseISO, isThisWeek, isThisMonth, isThisYear } from 'date-fns';

// ---
// KingdomStatsBlock and KingStatsBlock are now fully data-driven.
// They fetch real, time-aggregated data for all tabs (quests, challenges, milestones, gold, experience)
// from the /api/kingdom-stats endpoint. The UI will update reactively as soon as the user completes
// a quest, challenge, milestone, or earns gold/experience. Empty/data states are handled automatically.
// ---

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
        <Link href={"/quests?tab=quests"} passHref legacyBehavior>
          <a
            className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition-all"
            aria-label="Start your first quest"
            tabIndex={0}
            role="button"
          >
            Start Your First Quest
          </a>
        </Link>
      </div>
    </section>
  );
}

// --- Empty State Components for Each Tab ---
function QuestsEmptyState() {
  return (
    <section className="relative h-64 w-full flex flex-col items-center justify-center text-center rounded-lg overflow-hidden" aria-label="kingdom-stats-empty-state-section">
      <Image src="/images/quests-header.jpg" alt="Empty quests placeholder" className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" width={400} height={300} aria-hidden="true" />
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full space-y-3">
        <div className="text-amber-500 text-xl font-bold drop-shadow-md">No quests yet</div>
        <div className="text-gray-100 text-base">Start habit building now to see your kingdom flourish!</div>
        <Link href="/quests?tab=quests" passHref legacyBehavior>
          <a className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold text-lg shadow-md" aria-label="Start your first quest" tabIndex={0} role="button">Start Your First Quest</a>
        </Link>
      </div>
    </section>
  );
}
function ChallengesEmptyState() {
  return (
    <section className="relative h-64 w-full flex flex-col items-center justify-center text-center rounded-lg overflow-hidden" aria-label="kingdom-stats-empty-state-section">
      <Image src="/images/quests-header.jpg" alt="Empty challenges placeholder" className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" width={400} height={300} aria-hidden="true" />
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full space-y-3">
        <div className="text-amber-500 text-xl font-bold drop-shadow-md">No challenges yet</div>
        <div className="text-gray-100 text-base">Start a challenge to see your kingdom grow!</div>
        <Link href="/quests?tab=challenges" passHref legacyBehavior>
          <a className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold text-lg shadow-md" aria-label="Start your first challenge" tabIndex={0} role="button">Start Your First Challenge</a>
        </Link>
      </div>
    </section>
  );
}
function MilestonesEmptyState() {
  return (
    <section className="relative h-64 w-full flex flex-col items-center justify-center text-center rounded-lg overflow-hidden" aria-label="kingdom-stats-empty-state-section">
      <Image src="/images/quests-header.jpg" alt="Empty milestones placeholder" className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" width={400} height={300} aria-hidden="true" />
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full space-y-3">
        <div className="text-amber-500 text-xl font-bold drop-shadow-md">No milestones yet</div>
        <div className="text-gray-100 text-base">Start a milestone to see your kingdom flourish!</div>
        <Link href="/quests?tab=milestones" passHref legacyBehavior>
          <a className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold text-lg shadow-md" aria-label="Start your first milestone" tabIndex={0} role="button">Start Your First Milestone</a>
        </Link>
      </div>
    </section>
  );
}
function GoldEmptyState() {
  return (
    <section className="relative h-64 w-full flex flex-col items-center justify-center text-center rounded-lg overflow-hidden" aria-label="king-stats-empty-state-section">
      <Image src="/images/quests-header.jpg" alt="Empty gold placeholder" className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" width={400} height={300} aria-hidden="true" />
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full space-y-3">
        <div className="text-amber-500 text-xl font-bold drop-shadow-md">No gold earned yet</div>
        <div className="text-gray-100 text-base">Complete quests to earn gold!</div>
        <Link href="/quests?tab=quests" passHref legacyBehavior>
          <a className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold text-lg shadow-md" aria-label="Start your first quest" tabIndex={0} role="button">Start Your First Quest</a>
        </Link>
      </div>
    </section>
  );
}
function ExperienceEmptyState() {
  return (
    <section className="relative h-64 w-full flex flex-col items-center justify-center text-center rounded-lg overflow-hidden" aria-label="king-stats-empty-state-section">
      <Image src="/images/quests-header.jpg" alt="Empty experience placeholder" className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" width={400} height={300} aria-hidden="true" />
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full space-y-3">
        <div className="text-amber-500 text-xl font-bold drop-shadow-md">No experience earned yet</div>
        <div className="text-gray-100 text-base">Complete quests to earn experience!</div>
        <Link href="/quests?tab=quests" passHref legacyBehavior>
          <a className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold text-lg shadow-md" aria-label="Start your first quest" tabIndex={0} role="button">Start Your First Quest</a>
        </Link>
      </div>
    </section>
  );
}

// Helper to format x-axis labels
function formatXAxisLabel(dateStr: string, period: TimePeriod) {
  let date: Date;
  try {
    date = parseISO(dateStr);
  } catch {
    return { day: '', date: dateStr };
  }
  let dayName = format(date, 'EEE');
  let dayDate = format(date, 'dd-MM-yyyy');
  if (period === 'year') {
    dayName = format(date, 'MMM');
    dayDate = format(date, 'yyyy');
  } else if (period === 'all') {
    // Could be week/month/year, fallback to month/year
    if (dateStr.length === 4) {
      dayName = '';
      dayDate = dateStr;
    } else if (dateStr.length === 7) {
      dayName = format(date, 'MMM');
      dayDate = format(date, 'yyyy');
    }
  }
  return { day: dayName, date: dayDate };
}

// Helper to determine if a bar is in the current period
function isCurrentPeriod(dateStr: string, period: TimePeriod) {
  const date = parseISO(dateStr);
  if (period === 'week') return isThisWeek(date, { weekStartsOn: 1 });
  if (period === 'month') return isThisMonth(date);
  if (period === 'year') return isThisYear(date);
  return false;
}

// Bar chart rendering (shared for both blocks)
function BarChartBlock({ graphData, timePeriod, highlightCurrent, ariaLabel }: {
  graphData: Array<{ day: string; value: number }>,
  timePeriod: TimePeriod,
  highlightCurrent?: boolean,
  ariaLabel: string
}) {
  // Animation: grow bars on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Prevent overflow: scale bars to max height
  const maxBarHeight = 160;
  const maxValue = Math.max(...graphData.map(d => d.value), 1);
  // For scroll: set min width per bar
  let minBarWidth = 40;
  let snapType = '';
  if (timePeriod === 'week') {
    minBarWidth = 48;
    snapType = 'snap-x snap-mandatory';
  } else if (timePeriod === 'month') {
    minBarWidth = 36;
    snapType = 'snap-x snap-mandatory';
  } else if (timePeriod === 'year') {
    minBarWidth = 56;
    snapType = '';
  } else if (timePeriod === 'all') {
    minBarWidth = 48;
    snapType = 'snap-x snap-mandatory';
  }

  return (
    <div
      className={`h-64 w-full flex items-end gap-2 px-4 overflow-x-auto ${snapType}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
      aria-label={ariaLabel}
      tabIndex={0}
    >
      {graphData.map((d, i) => {
        const { day, date } = formatXAxisLabel(d.day, timePeriod);
        const isCurrent = highlightCurrent && isCurrentPeriod(d.day, timePeriod);
        const barHeight = Math.max(8, Math.round((d.value / maxValue) * maxBarHeight));
        return (
          <div
            key={d.day}
            className={`flex flex-col items-center justify-end flex-none ${snapType ? 'snap-start' : ''}`}
            style={{ minWidth: minBarWidth }}
            aria-label={`bar-group-${d.day}`}
          >
            <div
              className={`w-full rounded-t transition-all duration-700 ${mounted ? 'scale-y-100' : 'scale-y-0'} origin-bottom bg-amber-500 shadow-lg ${isCurrent ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black animate-pulse' : ''}`}
              style={{ height: barHeight, minHeight: 8, maxHeight: maxBarHeight }}
              aria-label={`bar-${d.day}`}
            />
            <div className="flex flex-col items-center mt-1 text-xs text-gray-300 select-none">
              <span className="font-bold text-white" aria-label={`bar-label-day-${d.day}`}>{day}</span>
              <span className="text-gray-400" aria-label={`bar-label-date-${d.day}`}>{date}</span>
            </div>
            <div className="text-lg text-white font-bold mt-1" aria-label={`bar-value-${d.day}`}>{d.value}</div>
          </div>
        );
      })}
    </div>
  );
}

// --- Block 1: KingdomStatsBlock ---
export function KingdomStatsBlock({ userId }: { userId: string | null }) {
  const [activeTab, setActiveTab] = useState<'quests' | 'challenges' | 'milestones'>('quests');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [graphData, setGraphData] = useState<Array<{ day: string; value: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const uid = userId;

  // Fetch and aggregate data for the selected tab and period (keep as is for now)
  useEffect(() => {
    if (!uid) return;
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/kingdom-stats?userId=${uid}&tab=${activeTab}&period=${timePeriod}`);
        if (!res.ok) throw new Error('Failed to fetch stats');
        const { data } = await res.json();
        console.log(`[KingdomStatsBlock] Tab: ${activeTab}, Period: ${timePeriod}, Data:`, data);
        setGraphData(data || []);
      } catch (err) {
        setGraphData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, uid, timePeriod]);

  // Show chart if there is at least one non-zero value in the data
  const hasData = graphData.some(d => d.value > 0);

  return (
    <Card className="bg-black border-amber-800">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-amber-500 text-2xl font-bold">Kingdom stats</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Select time period" className="ml-2">
                {(() => {
                  if (timePeriod === 'week') return 'Week';
                  if (timePeriod === 'month') return 'Month';
                  if (timePeriod === 'year') return 'Year';
                  return 'All time';
                })()}
                <ChevronDown className="ml-2 w-4 h-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent aria-label="kingdom-stats-time-period-dropdown">
              <DropdownMenuItem onSelect={() => setTimePeriod('week')} aria-label="Week">Week</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTimePeriod('month')} aria-label="Month">Month</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTimePeriod('year')} aria-label="Year">Year</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTimePeriod('all')} aria-label="All time">All time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="text-gray-300">Track your realm&apos;s growth</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="py-4">
          {/* Mobile tab selector */}
          <div className="mb-4 md:hidden">
            <label htmlFor="kingdom-stats-tab-select" className="sr-only">Select stats tab</label>
            <select
              id="kingdom-stats-tab-select"
              aria-label="Kingdom stats tab selector"
              className="w-full rounded-md border border-amber-800/20 bg-black text-white p-2"
              value={activeTab}
              onChange={e => setActiveTab(e.target.value as typeof activeTab)}
            >
              <option value="quests">Quests</option>
              <option value="challenges">Challenges</option>
              <option value="milestones">Milestones</option>
            </select>
          </div>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)} className="mb-4 hidden md:block">
            <TabsList aria-label="kingdom-stats-tabs">
              <TabsTrigger value="quests" aria-label="quests-tab">Quests</TabsTrigger>
              <TabsTrigger value="challenges" aria-label="challenges-tab">Challenges</TabsTrigger>
              <TabsTrigger value="milestones" aria-label="milestones-tab">Milestones</TabsTrigger>
            </TabsList>
          </Tabs>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
          ) : !hasData ? (
            activeTab === 'quests' ? <QuestsEmptyState /> : activeTab === 'challenges' ? <ChallengesEmptyState /> : <MilestonesEmptyState />
          ) : (
            <BarChartBlock
              graphData={graphData}
              timePeriod={timePeriod}
              highlightCurrent={true}
              ariaLabel="kingdom-stats-bar-chart"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Block 2: KingStatsBlock ---
export function KingStatsBlock({ userId }: { userId: string | null }) {
  const [activeTab, setActiveTab] = useState<'gold' | 'experience'>('gold');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [graphData, setGraphData] = useState<Array<{ day: string; value: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const uid = userId;

  // Fetch and aggregate data for the selected tab and period (keep as is for now)
  useEffect(() => {
    if (!uid) return;
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/kingdom-stats?userId=${uid}&tab=${activeTab}&period=${timePeriod}`);
        if (!res.ok) throw new Error('Failed to fetch stats');
        const { data } = await res.json();
        console.log(`[KingStatsBlock] Tab: ${activeTab}, Period: ${timePeriod}, Data:`, data);
        setGraphData(data || []);
      } catch (err) {
        setGraphData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, uid, timePeriod]);

  // Show chart if there is at least one non-zero value in the data
  const hasData = graphData.some(d => d.value > 0);

  return (
    <Card className="bg-black border-amber-800">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-amber-500 text-2xl font-bold">King stats</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Select time period" className="ml-2">
                {(() => {
                  if (timePeriod === 'week') return 'Week';
                  if (timePeriod === 'month') return 'Month';
                  if (timePeriod === 'year') return 'Year';
                  return 'All time';
                })()}
                <ChevronDown className="ml-2 w-4 h-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent aria-label="king-stats-time-period-dropdown">
              <DropdownMenuItem onSelect={() => setTimePeriod('week')} aria-label="Week">Week</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTimePeriod('month')} aria-label="Month">Month</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTimePeriod('year')} aria-label="Year">Year</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTimePeriod('all')} aria-label="All time">All time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="text-gray-300">Track your gold and experience</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="py-4">
          {/* Mobile tab selector */}
          <div className="mb-4 md:hidden">
            <label htmlFor="king-stats-tab-select" className="sr-only">Select king stats tab</label>
            <select
              id="king-stats-tab-select"
              aria-label="King stats tab selector"
              className="w-full rounded-md border border-amber-800/20 bg-black text-white p-2"
              value={activeTab}
              onChange={e => setActiveTab(e.target.value as typeof activeTab)}
            >
              <option value="gold">Gold</option>
              <option value="experience">Experience</option>
            </select>
          </div>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)} className="mb-4 hidden md:block">
            <TabsList aria-label="king-stats-tabs">
              <TabsTrigger value="gold" aria-label="gold-tab">Gold</TabsTrigger>
              <TabsTrigger value="experience" aria-label="experience-tab">Experience</TabsTrigger>
            </TabsList>
          </Tabs>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
          ) : !hasData ? (
            activeTab === 'gold' ? <GoldEmptyState /> : <ExperienceEmptyState />
          ) : (
            <BarChartBlock
              graphData={graphData}
              timePeriod={timePeriod}
              highlightCurrent={true}
              ariaLabel="king-stats-bar-chart"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}