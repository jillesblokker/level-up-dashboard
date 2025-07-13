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
        setGraphData(data || []);
      } catch (err) {
        setGraphData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, uid, timePeriod]);

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
            <div className="h-64 flex items-end gap-2 w-full px-4">
              {graphData.map((d, i) => (
                <div key={d.day} className="flex flex-col items-center justify-end flex-1">
                  <div className="w-full rounded-t bg-amber-500 transition-all" style={{ height: `${d.value === 0 ? 8 : d.value * 32}px`, minHeight: 8 }} aria-label={`bar-${d.day}`} />
                  <div className="text-xs text-gray-300 mt-1">{d.day}</div>
                  <div className="text-lg text-white font-bold">{d.value}</div>
                </div>
              ))}
            </div>
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
        setGraphData(data || []);
      } catch (err) {
        setGraphData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, uid, timePeriod]);

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
            <div className="h-64 flex items-end gap-2 w-full px-4">
              {graphData.map((d, i) => (
                <div key={d.day} className="flex flex-col items-center justify-end flex-1">
                  <div className="w-full rounded-t bg-amber-500 transition-all" style={{ height: `${d.value === 0 ? 8 : d.value * 32}px`, minHeight: 8 }} aria-label={`bar-${d.day}`} />
                  <div className="text-xs text-gray-300 mt-1">{d.day}</div>
                  <div className="text-lg text-white font-bold">{d.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}