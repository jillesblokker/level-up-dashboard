"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, RefreshCw, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
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

import { useSupabase } from '@/lib/hooks/useSupabase'
import { useSupabaseRealtimeSync } from '@/hooks/useSupabaseRealtimeSync'
import { useAuth } from '@clerk/nextjs'

import { format, parseISO, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, Legend, Cell, Area } from 'recharts';

// Debounce hook for preventing excessive API calls
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]) as T;
}

// ---
// KingdomStatsBlock and KingStatsBlock are now fully data-driven with REAL-TIME SUPABASE SUBSCRIPTIONS.
// They fetch real, time-aggregated data for all tabs (quests, challenges, milestones, gold, experience)
// from the /api/kingdom-stats endpoint and automatically update via Supabase real-time channels.
// The UI will update instantly when database changes occur in quest_completion, challenge_completion,
// or milestone_completion tables. Empty/data states are handled automatically.
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
            Embark on Your First Quest
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
          <a className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold text-lg shadow-md" aria-label="Start your first quest" tabIndex={0} role="button">Embark on Your First Quest</a>
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
          <a className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold text-lg shadow-md" aria-label="Start your first quest" tabIndex={0} role="button">Embark on Your First Quest</a>
        </Link>
      </div>
    </section>
  );
}
function ExperienceEmptyState() {
  return (
    <section className="relative h-64 w-full flex flex-col items-center justify-center text-center rounded-lg overflow-hidden" aria-label="kingdom-stats-empty-state-section">
      <Image src="/images/quests-header.jpg" alt="Empty experience placeholder" className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" width={400} height={300} aria-hidden="true" />
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full space-y-3">
        <div className="text-amber-500 text-xl font-bold drop-shadow-md">No experience gained yet</div>
        <div className="text-gray-100 text-base">Complete quests and challenges to start leveling up!</div>
        <Link href="/quests?tab=quests" passHref legacyBehavior>
          <a className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold text-lg shadow-md" aria-label="Start your first quest" tabIndex={0} role="button">Embark on Your First Quest</a>
        </Link>
      </div>
    </section>
  );
}

function LevelEmptyState() {
  return (
    <section className="relative h-64 w-full flex flex-col items-center justify-center text-center rounded-lg overflow-hidden" aria-label="kingdom-stats-empty-state-section">
      <Image src="/images/quests-header.jpg" alt="Empty level placeholder" className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" width={400} height={300} aria-hidden="true" />
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full space-y-3">
        <div className="text-amber-500 text-xl font-bold drop-shadow-md">No level progression yet</div>
        <div className="text-gray-100 text-base">Gain experience to see your character level up over time!</div>
        <Link href="/quests?tab=quests" passHref legacyBehavior>
          <a className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold text-lg shadow-md" aria-label="Start your first quest" tabIndex={0} role="button">Embark on Your First Quest</a>
        </Link>
      </div>
    </section>
  );
}

// Helper function to format X-axis labels based on time period
function formatXAxisLabel(dateString: string, timePeriod: TimePeriod): { day: string; date: string } {
  if (!dateString || dateString === 'all') {
    return { day: 'All', date: 'Time' };
  }

  try {
    let date: Date;

    if (timePeriod === 'year') {
      // For year view, dateString is YYYY-MM format
      date = new Date(dateString + '-01T00:00:00Z');
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return { day: month, date: year.toString() };
    } else if (timePeriod === 'all') {
      // For all time, show date in a more compact format
      date = new Date(dateString + 'T00:00:00Z');
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      // For all period, show fewer labels to avoid overcrowding
      return {
        day: `${day}/${month}`,
        date: year.toString()
      };
    } else {
      // For week/month view, dateString is YYYY-MM-DD format
      date = new Date(dateString + 'T00:00:00Z');
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });

      return {
        day: weekday.charAt(0), // First letter only
        date: `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`
      };
    }
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return { day: '?', date: '??' };
  }
}

// Helper function to check if a date string is valid
function isValidDateString(dateString: string): boolean {
  if (!dateString || dateString === 'all') return false;
  try {
    const date = new Date(dateString + 'T00:00:00Z');
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

// Helper to determine if a bar is in the current period
function isCurrentPeriod(dateStr: string, period: TimePeriod) {
  const date = parseISO(dateStr);
  if (period === 'week') return isThisWeek(date, { weekStartsOn: 1 });
  if (period === 'month') return isThisMonth(date);
  if (period === 'year') return isThisYear(date);
  return false;
}

// Chart type toggle
function ChartTypeToggle({ chartType, setChartType }: { chartType: 'bar' | 'line', setChartType: (t: 'bar' | 'line') => void }) {
  return (
    <div className="flex gap-2 items-center">
      <button
        className={`px-3 py-1 rounded-md text-xl font-semibold transition-colors duration-200 ${chartType === 'bar' ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-300'}`}
        onClick={() => setChartType('bar')}
        aria-label="Bar chart view"
      >
        <span role="img" aria-label="Bar chart">📊</span>
      </button>
      <button
        className={`px-3 py-1 rounded-md text-xl font-semibold transition-colors duration-200 ${chartType === 'line' ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-300'}`}
        onClick={() => setChartType('line')}
        aria-label="Line chart view"
      >
        <span role="img" aria-label="Line chart">📈</span>
      </button>
    </div>
  );
}

// Category emoji mapping
const categoryEmojis: Record<string, string> = {
  'might': '⚔️',
  'vitality': '💪',
  'knowledge': '📚',
  'wellness': '🧘',
  'honor': '🏆',
  'exploration': '🗺️',
  'craft': '🔨',
  'castle': '🏰',
  'unknown': '❓'
};

// Custom tooltip for both chart types
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    // Get the data point that contains category information
    const dataPoint = payload[0]?.payload;
    const categories = dataPoint?.categories || {};

    return (
      <div className="rounded-lg border border-amber-700 bg-black/90 p-3 shadow-lg">
        <div className="text-xs text-amber-400 font-bold mb-2">{label}</div>

        {/* Show total value */}
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full inline-block bg-amber-500" />
          <span className="text-white text-sm font-semibold">{payload[0]?.value}</span>
          <span className="text-gray-400 text-xs">total</span>
        </div>

        {/* Show category breakdown if available */}
        {Object.keys(categories).length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-gray-400 mb-1">Categories:</div>
            {Object.entries(categories).map(([category, count]) => (
              <div key={category} className="flex items-center gap-2">
                <span className="text-sm">{categoryEmojis[category] || '❓'}</span>
                <span className="text-white text-xs font-medium">{category}</span>
                <span className="text-gray-400 text-xs">({count as number})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
}

// Bar/Line chart block
function ChartBlock({ graphData, timePeriod, highlightCurrent, ariaLabel, chartType }: {
  graphData: Array<{ day: string; value: number; categories?: Record<string, number> }>,
  timePeriod: TimePeriod,
  highlightCurrent?: boolean,
  ariaLabel: string,
  chartType: 'bar' | 'line',
}) {
  // Animation: grow bars/lines on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const chartRef = useRef<HTMLDivElement>(null);

  // Prevent overflow: scale bars to max height
  const maxBarHeight = 160;
  const maxValue = Math.max(...graphData.map(d => d.value), 1);

  // Improve Y-axis scaling for better readability
  const getYAxisDomain = () => {
    if (maxValue === 0) return [0, 1];
    if (maxValue <= 5) return [0, Math.max(5, maxValue + 1)];
    if (maxValue <= 20) return [0, Math.max(20, maxValue + 2)];
    if (maxValue <= 100) return [0, Math.max(100, maxValue + 10)];
    if (maxValue <= 1000) return [0, Math.max(1000, maxValue + 100)];
    return [0, maxValue * 1.1]; // Add 10% padding
  };

  const yAxisDomain = getYAxisDomain();
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

  // Get the year range for display below the chart
  const getYearRange = () => {
    if (timePeriod === 'all') {
      if (graphData.length > 0) {
        const firstDate = graphData[0]?.day;
        const lastDate = graphData[graphData.length - 1]?.day;

        if (firstDate && lastDate && firstDate !== lastDate) {
          try {
            const firstYear = new Date(firstDate + 'T00:00:00Z').getFullYear();
            const lastYear = new Date(lastDate + 'T00:00:00Z').getFullYear();
            return firstYear === lastYear ? `${firstYear} (All Time)` : `${firstYear} - ${lastYear} (All Time)`;
          } catch (error) {
            return 'All Time';
          }
        } else if (firstDate) {
          try {
            const year = new Date(firstDate + 'T00:00:00Z').getFullYear();
            return `${year} (All Time)`;
          } catch (error) {
            return 'All Time';
          }
        }
      }
      return 'All Time';
    }

    if (timePeriod === 'year') return new Date().getFullYear().toString();

    if (graphData.length > 0) {
      const firstDate = graphData[0]?.day;
      const lastDate = graphData[graphData.length - 1]?.day;

      if (firstDate && lastDate && firstDate !== lastDate) {
        try {
          const firstYear = new Date(firstDate + 'T00:00:00Z').getFullYear();
          const lastYear = new Date(lastDate + 'T00:00:00Z').getFullYear();
          return firstYear === lastYear ? firstYear.toString() : `${firstYear} - ${lastYear}`;
        } catch (error) {
          return new Date().getFullYear().toString();
        }
      } else if (firstDate) {
        try {
          return new Date(firstDate + 'T00:00:00Z').getFullYear().toString();
        } catch (error) {
          return new Date().getFullYear().toString();
        }
      }
    }
    return new Date().getFullYear().toString();
  };

  // Chart rendering
  if (!mounted) {
    return <div className="h-[300px] w-full min-h-[250px] bg-white/5 rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-2">
      <div className="h-[300px] w-full min-h-[250px] bg-white/5 rounded-lg" aria-label={ariaLabel} tabIndex={0} ref={chartRef}>
        <ResponsiveContainer width="99%" height={300} className="min-h-[250px]" debounce={200}>
          {chartType === 'bar' ? (
            <RechartsBarChart data={graphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap={"20%"}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" />
              <XAxis
                dataKey="day"
                tick={({ x, y, payload, index }) => {
                  if (!isValidDateString(payload.value)) return <g />;

                  // For month view, show only 3 labels: first, middle, and last
                  if (timePeriod === 'month') {
                    const totalDays = graphData.length;
                    const shouldShowLabel = index === 0 || index === Math.floor(totalDays / 2) || index === totalDays - 1;
                    if (!shouldShowLabel) return <g />;
                  }

                  // For 'all' period, show fewer labels to avoid overcrowding
                  if (timePeriod === 'all') {
                    const totalDays = graphData.length;
                    const shouldShowLabel = index === 0 || index === totalDays - 1 || index % Math.max(1, Math.floor(totalDays / 10)) === 0;
                    if (!shouldShowLabel) return <g />;
                  }

                  const { day, date } = formatXAxisLabel(payload.value, timePeriod);
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={-8} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{day}</text>
                      <text x={0} y={8} textAnchor="middle" fill="#bbb" fontSize="10">{date}</text>
                    </g>
                  );
                }}
                axisLine={{ stroke: "#444" }}
                tickLine={false}
                interval={0}
                minTickGap={minBarWidth}
              />
              <YAxis tick={{ fill: "#888" }} axisLine={{ stroke: "#444" }} domain={yAxisDomain} allowDecimals={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "#222", opacity: 0.1 }} />
              <Bar
                dataKey="value"
                fill="#f59e42"
                radius={[8, 8, 0, 0]}
                isAnimationActive={mounted}
                animationDuration={350}
                animationEasing="ease-out"
                minPointSize={4}
                maxBarSize={maxBarHeight}
                onMouseOver={(_, idx) => {
                  if (chartRef.current) {
                    const bars = chartRef.current.querySelectorAll('.recharts-rectangle');
                    if (bars[idx]) bars[idx].classList.add('bar-glow');
                  }
                }}
                onMouseOut={(_, idx) => {
                  if (chartRef.current) {
                    const bars = chartRef.current.querySelectorAll('.recharts-rectangle');
                    if (bars[idx]) bars[idx].classList.remove('bar-glow');
                  }
                }}
              >
                {graphData.map((entry, idx) => {
                  const isCurrent = highlightCurrent && isCurrentPeriod(entry.day, timePeriod);
                  return (
                    <Cell
                      key={`cell-${idx}`}
                      fill={isCurrent ? "#fbbf24" : "#f59e42"}
                      className={isCurrent ? "bar-glow" : ""}
                    />
                  );
                })}
              </Bar>
            </RechartsBarChart>
          ) : (
            <LineChart data={graphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="lineGradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="300">
                  <stop offset="0%" stopColor="#ffd700" stopOpacity="1" />
                  <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" />
              <XAxis
                dataKey="day"
                tick={({ x, y, payload }) => (
                  <text
                    x={x}
                    y={y + 16}
                    textAnchor="middle"
                    fontSize={14}
                    fill="#fbbf24"
                    aria-label={`x-axis-label-${payload.value}`}
                  >
                    {payload.value}
                  </text>
                )}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 14, fill: '#fbbf24' }}
                axisLine={false}
                tickLine={false}
                width={32}
                domain={yAxisDomain}
              />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "#222", opacity: 0.1 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill="url(#lineGradient)"
                fillOpacity={1}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#fbbf24"
                strokeWidth={3}
                dot={{ r: 4, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Year display below the chart */}
      <div className="text-center">
        <h5 className="text-gray-400 text-sm font-medium">{getYearRange()}</h5>
      </div>

      <style jsx>{`
        .bar-glow {
          filter: drop-shadow(0 0 8px #fbbf24cc) drop-shadow(0 0 16px #fbbf24aa);
        }
      `}</style>
    </div>
  );
}

// --- Block 1: KingdomStatsBlock ---
export function KingdomStatsBlock({ userId }: { userId: string | null }) {
  const [graphData, setGraphData] = useState<Array<{ day: string; value: number }>>([]);
  const [activeTab, setActiveTab] = useState<'quests' | 'challenges' | 'milestones' | 'gold' | 'experience'>('quests');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [isLoading, setIsLoading] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [navigationDate, setNavigationDate] = useState<Date | null>(null);
  const { userId: authUserId, isLoaded, getToken } = useAuth();

  // Handle time period navigation (prev/next) - KingdomStatsBlock
  const handleTimeNavigation = (direction: 'prev' | 'next') => {
    // Use navigation date if available, otherwise use current date
    const baseDate = navigationDate || new Date();
    let newDate: Date;

    switch (timePeriod) {
      case 'week':
        // Navigate by weeks from the current navigation position
        newDate = new Date(baseDate);
        if (direction === 'prev') {
          newDate.setDate(baseDate.getDate() - 7);
        } else {
          newDate.setDate(baseDate.getDate() + 7);
        }
        break;
      case 'month':
        // Navigate by months from the current navigation position
        newDate = new Date(baseDate);
        if (direction === 'prev') {
          newDate.setMonth(baseDate.getMonth() - 1);
        } else {
          newDate.setMonth(baseDate.getMonth() + 1);
        }
        break;
      case 'year':
        // Navigate by years from the current navigation position
        newDate = new Date(baseDate);
        if (direction === 'prev') {
          newDate.setFullYear(baseDate.getFullYear() - 1);
        } else {
          newDate.setFullYear(baseDate.getFullYear() + 1);
        }
        break;
      default:
        // For 'all' period, just refresh current data
        fetchData();
        return;
    }

    // Store the navigation date for API calls
    setNavigationDate(newDate);
    // Fetch data for the new period
    fetchData();
  };

  const fetchData = useCallback(async () => {
    console.log('[Kingdom Stats Component] fetchData called with:', { authUserId, isLoaded, activeTab, timePeriod });

    if (!authUserId || !isLoaded) {
      console.log('[Kingdom Stats Component] Not ready to fetch data:', { authUserId, isLoaded });
      return;
    }

    try {
      setIsLoading(true);
      console.log('[Kingdom Stats Component] 🚀 Fetching data from API...');

      // Add cache-busting parameter to force fresh API call and see backend debugging
      const timestamp = Date.now();
      let apiUrl = `/api/kingdom-stats-v2?tab=${activeTab}&period=${timePeriod}&_t=${timestamp}`;
      if (userId && userId !== authUserId) {
        apiUrl += `&userId=${userId}`;
      }

      // Add navigation date if available
      if (navigationDate) {
        const dateParam = navigationDate.toISOString().split('T')[0];
        apiUrl += `&date=${dateParam}`;
      }

      console.log('[Kingdom Stats Component] 🔗 API URL:', apiUrl);
      console.log('[Kingdom Stats Component] 🔑 Auth token present:', !!getToken);

      const token = await getToken({ template: 'supabase' });
      console.log('[Kingdom Stats Component] 🔑 Token retrieved, length:', token?.length || 0);

      const res = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[Kingdom Stats Component] 📡 Response status:', res.status);
      console.log('[Kingdom Stats Component] 📡 Response headers:', Object.fromEntries(res.headers.entries()));
      console.log('[Kingdom Stats Component] 📡 Response URL:', res.url);

      if (!res.ok) {
        let errorDetail = '';
        try {
          const errorJson = await res.json();
          errorDetail = errorJson.error || errorJson.message || '';
        } catch (e) {
          // Body not JSON
        }
        throw new Error(`API error: ${res.status} ${res.statusText} ${errorDetail}`);
      }

      const data = await res.json();
      console.log('[Kingdom Stats Component] ✅ API response:', data);
      console.log('[Kingdom Stats Component] 📋 Response structure:', {
        hasData: !!data.data,
        dataType: typeof data.data,
        isArray: Array.isArray(data.data),
        dataLength: data.data?.length,
        hasSuccess: !!data.success,
        successValue: data.success,
        keys: Object.keys(data)
      });

      // Check if we have data in the response
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        console.log('[Kingdom Stats Component] 📊 Setting graph data:', data.data);
        console.log('[Kingdom Stats Component] 🔍 Week view data sample:', data.data.slice(0, 3));
        console.log('[Kingdom Stats Component] 🔍 FULL Week view data:', data.data);
        console.log('[Kingdom Stats Component] 🔍 Week view data details:', data.data.map((item: any) => ({
          day: item.day,
          value: item.value,
          valueType: typeof item.value,
          hasValue: item.value !== undefined && item.value !== null
        })));
        setGraphData(data.data);
      } else if (data.data && Array.isArray(data.data)) {
        // Success but empty or zero-value data
        console.log('[Kingdom Stats Component] 📊 Setting graph data (empty or all-zero):', data.data);
        setGraphData(data.data);
      } else {
        console.log('[Kingdom Stats Component] ⚠️ API returned no valid data structure:', data);
        setGraphData([]);
      }
    } catch (err) {
      console.error('[Kingdom Stats Component] Error fetching data:', err);
      setGraphData([]);
    } finally {
      setIsLoading(false);
    }
  }, [authUserId, isLoaded, activeTab, timePeriod, navigationDate, getToken]);

  useEffect(() => {
    // Call fetchData when dependencies change
    fetchData();
  }, [fetchData]);

  // Create debounced version of fetchData to prevent excessive API calls
  const debouncedFetchData = useDebounce(fetchData, 1000); // 1 second delay

  // 🎯 REAL-TIME SUPABASE SUBSCRIPTIONS for instant updates
  useSupabaseRealtimeSync({
    table: 'quest_completion',
    userId: authUserId,
    onChange: debouncedFetchData
  });

  useSupabaseRealtimeSync({
    table: 'challenge_completion',
    userId: authUserId,
    onChange: debouncedFetchData
  });

  useSupabaseRealtimeSync({
    table: 'milestone_completion',
    userId: authUserId,
    onChange: debouncedFetchData
  });

  // Keep legacy event listeners for backward compatibility
  useEffect(() => {
    const handleDataUpdate = () => {
      fetchData();
    };

    window.addEventListener('kingdom:challengeCompleted', handleDataUpdate);
    window.addEventListener('kingdom:milestoneCompleted', handleDataUpdate);
    window.addEventListener('kingdom:questCompleted', handleDataUpdate);
    window.addEventListener('kingdom:goldGained', handleDataUpdate);
    window.addEventListener('kingdom:experienceGained', handleDataUpdate);

    return () => {
      window.removeEventListener('kingdom:challengeCompleted', handleDataUpdate);
      window.removeEventListener('kingdom:milestoneCompleted', handleDataUpdate);
      window.removeEventListener('kingdom:questCompleted', handleDataUpdate);
      window.removeEventListener('kingdom:goldGained', handleDataUpdate);
      window.removeEventListener('kingdom:experienceGained', handleDataUpdate);
    };
  }, []);

  // Show chart only if there is at least one non-zero value in the data
  const hasData = graphData.length > 0 && graphData.some(d => d.value > 0);

  return (
    <Card className="bg-black border-amber-800">
      <CardHeader>
        <div className="flex flex-col space-y-4">
          {/* Header with title and description - KingdomStatsBlock */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-2xl font-bold text-amber-500">Kingdom stats</h3>
            <p className="text-gray-400">Track your realm&apos;s growth</p>
          </div>

          {/* Control bar - grouped logically for mobile/web */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Mobile: Compact layout with kebab menu */}
            <div className="flex md:hidden items-center justify-between w-full">
              {/* Left side: Navigation */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => handleTimeNavigation('prev')}
                  aria-label="Previous time period"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Time period dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 px-3 text-sm">
                      {timePeriod === 'week' ? 'Week' : timePeriod === 'month' ? 'Month' : 'Year'}
                      <ChevronDown className="ml-2 h-4 w-4 text-amber-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setTimePeriod('week')}>Week</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimePeriod('month')}>Month</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimePeriod('year')}>Year</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => handleTimeNavigation('next')}
                  aria-label="Next time period"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Right side: Kebab menu for mobile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setNavigationDate(null);
                    fetchData();
                  }}>
                    🏠 Current Period
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChartType(chartType === 'bar' ? 'line' : 'bar')}>
                    {chartType === 'bar' ? '📈' : '📊'} {chartType === 'bar' ? 'Line Chart' : 'Bar Chart'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop: Full layout */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Left side: Time period and chart type */}
              {/* Time period navigation */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => handleTimeNavigation('prev')}
                  aria-label="Previous time period"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Time period dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 px-3 text-sm">
                      {timePeriod === 'week' ? 'Week' : timePeriod === 'month' ? 'Month' : 'Year'}
                      <ChevronDown className="ml-2 h-4 w-4 text-amber-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setTimePeriod('week')}>Week</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimePeriod('month')}>Month</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimePeriod('year')}>Year</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => handleTimeNavigation('next')}
                  aria-label="Next time period"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Current period button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-sm"
                  onClick={() => {
                    setNavigationDate(null);
                    fetchData();
                  }}
                  aria-label="Go to current time period"
                >
                  Current
                </Button>
              </div>

              {/* Chart type toggle */}
              <ChartTypeToggle chartType={chartType} setChartType={setChartType} />
            </div>

            {/* Right side: Refresh button - hidden on mobile (available in 3-dots menu) */}
            <div className="hidden md:flex justify-end">
              <Button
                onClick={fetchData}
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0"
                aria-label="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="py-4">
          {/* Mobile tab selector - KingdomStatsBlock */}
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
          {/* Desktop tabs - KingdomStatsBlock */}
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)} className="mb-4 hidden md:block">
            <TabsList aria-label="kingdom-stats-tabs-kingdom">
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
            <ChartBlock
              graphData={graphData}
              timePeriod={timePeriod}
              highlightCurrent={true}
              ariaLabel="kingdom-stats-bar-chart"
              chartType={chartType}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Block 2: KingStatsBlock ---

// --- Block 2: KingStatsBlock ---
export function KingStatsBlock({ userId }: { userId: string | null }) {
  const [graphData, setGraphData] = useState<Array<{ day: string; value: number }>>([]);
  const [activeTab, setActiveTab] = useState<'gold-gained' | 'gold-spent' | 'experience' | 'level'>('gold-gained');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [isLoading, setIsLoading] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [navigationDate, setNavigationDate] = useState<Date | null>(null);
  const { userId: authUserId, isLoaded, getToken } = useAuth();

  // Handle time period navigation (prev/next) - KingStatsBlock
  const handleTimeNavigation = (direction: 'prev' | 'next') => {
    // Use navigation date if available, otherwise use current date
    const baseDate = navigationDate || new Date();
    let newDate: Date;

    switch (timePeriod) {
      case 'week':
        // Navigate by weeks from the current navigation position
        newDate = new Date(baseDate);
        if (direction === 'prev') {
          newDate.setDate(baseDate.getDate() - 7);
        } else {
          newDate.setDate(baseDate.getDate() + 7);
        }
        break;
      case 'month':
        // Navigate by months from the current navigation position
        newDate = new Date(baseDate);
        if (direction === 'prev') {
          newDate.setMonth(baseDate.getMonth() - 1);
        } else {
          newDate.setMonth(baseDate.getMonth() + 1);
        }
        break;
      case 'year':
        // Navigate by years from the current navigation position
        newDate = new Date(baseDate);
        if (direction === 'prev') {
          newDate.setFullYear(baseDate.getFullYear() - 1);
        } else {
          newDate.setFullYear(baseDate.getFullYear() + 1);
        }
        break;
      default:
        // For 'all' period, just refresh current data
        fetchData();
        return;
    }

    // Store the navigation date for API calls
    setNavigationDate(newDate);
    // Fetch data for the new period
    fetchData();
  };

  const fetchData = useCallback(async () => {
    if (!authUserId) {
      console.log('[Gains Component] No authUserId');
      return;
    }

    if (!isLoaded) {
      console.log('[Gains Component] Not loaded yet');
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        console.log('[Gains Component] No token available');
        return;
      }

      // Add cache-busting parameter to force fresh API call and see backend debugging
      const timestamp = Date.now();
      let apiUrl = `/api/kingdom-stats-v2?tab=${activeTab}&period=${timePeriod}&_t=${timestamp}`;
      if (userId && userId !== authUserId) {
        apiUrl += `&userId=${userId}`;
      }

      // Add navigation date if available
      if (navigationDate) {
        const dateParam = navigationDate.toISOString().split('T')[0];
        apiUrl += `&date=${dateParam}`;
      }

      console.log('[Gains Component] 🔗 API URL:', apiUrl);
      console.log('[Gains Component] 🔑 Token length:', token.length);

      const res = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[Gains Component] 📡 Response status:', res.status);
      console.log('[Gains Component] 📡 Response headers:', Object.fromEntries(res.headers.entries()));
      console.log('[Gains Component] 📡 Response URL:', res.url);

      if (!res.ok) {
        let errorDetail = '';
        try {
          const errorJson = await res.json();
          errorDetail = errorJson.error || errorJson.message || '';
        } catch (e) {
          // Body not JSON
        }
        throw new Error(`API error: ${res.status} ${res.statusText} ${errorDetail}`);
      }

      const { data } = await res.json();
      console.log('[Gains Component] ✅ API response data:', data);
      setGraphData(data || []);
    } catch (err) {
      console.error('[Gains Component] Error fetching king stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authUserId, activeTab, timePeriod, isLoaded, navigationDate, getToken]);

  useEffect(() => {
    if (authUserId && isLoaded) {
      fetchData();
    }
  }, [authUserId, activeTab, timePeriod, isLoaded, fetchData]);

  // Create debounced version of fetchData to prevent excessive API calls
  const debouncedFetchData = useDebounce(fetchData, 1000); // 1 second delay

  // 🎯 REAL-TIME SUPABASE SUBSCRIPTIONS for instant updates
  useSupabaseRealtimeSync({
    table: 'quest_completion',
    userId: authUserId,
    onChange: debouncedFetchData
  });

  useSupabaseRealtimeSync({
    table: 'challenge_completion',
    userId: authUserId,
    onChange: debouncedFetchData
  });

  useSupabaseRealtimeSync({
    table: 'milestone_completion',
    userId: authUserId,
    onChange: debouncedFetchData
  });

  // Keep legacy event listeners for backward compatibility
  useEffect(() => {
    const handleDataUpdate = () => {
      fetchData();
    };

    window.addEventListener('kingdom:challengeCompleted', handleDataUpdate);
    window.addEventListener('kingdom:milestoneCompleted', handleDataUpdate);
    window.addEventListener('kingdom:questCompleted', handleDataUpdate);
    window.addEventListener('kingdom:goldGained', handleDataUpdate);
    window.addEventListener('kingdom:experienceGained', handleDataUpdate);

    return () => {
      window.removeEventListener('kingdom:challengeCompleted', handleDataUpdate);
      window.removeEventListener('kingdom:milestoneCompleted', handleDataUpdate);
      window.removeEventListener('kingdom:questCompleted', handleDataUpdate);
      window.removeEventListener('kingdom:goldGained', handleDataUpdate);
      window.removeEventListener('kingdom:experienceGained', handleDataUpdate);
    };
  }, []);

  // Show chart only if there is at least one non-zero value in the data
  const hasData = graphData.length > 0 && graphData.some(d => d.value > 0);

  return (
    <Card className="bg-black border-amber-800">
      <CardHeader>
        <div className="flex flex-col space-y-4">
          {/* Header with title and description */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-2xl font-bold text-amber-500">Gains</h3>
            <p className="text-gray-400">Track your gold, experience, and level progression</p>
          </div>

          {/* Control bar - grouped logically for mobile/web */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Mobile: Compact layout with kebab menu */}
            <div className="flex md:hidden items-center justify-between w-full">
              {/* Left side: Navigation */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => handleTimeNavigation('prev')}
                  aria-label="Previous time period"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Time period dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 px-3 text-sm">
                      {timePeriod === 'week' ? 'Week' : timePeriod === 'month' ? 'Month' : 'Year'}
                      <ChevronDown className="ml-2 h-4 w-4 text-amber-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setTimePeriod('week')}>Week</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimePeriod('month')}>Month</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimePeriod('year')}>Year</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => handleTimeNavigation('next')}
                  aria-label="Next time period"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Right side: Kebab menu for mobile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setNavigationDate(null);
                    fetchData();
                  }}>
                    🏠 Current Period
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setChartType(chartType === 'bar' ? 'line' : 'bar')}>
                    {chartType === 'bar' ? '📈' : '📊'} {chartType === 'bar' ? 'Line Chart' : 'Bar Chart'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop: Full layout */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Left side: Time period and chart type */}
              <div className="flex items-center space-x-3">
                {/* Time period navigation */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => handleTimeNavigation('prev')}
                    aria-label="Previous time period"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Time period dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-9 px-3 text-sm">
                        {timePeriod === 'week' ? 'Week' : timePeriod === 'month' ? 'Month' : 'Year'}
                        <ChevronDown className="ml-2 h-4 w-4 text-amber-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setTimePeriod('week')}>Week</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimePeriod('month')}>Month</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimePeriod('year')}>Year</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => handleTimeNavigation('next')}
                    aria-label="Next time period"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Current period button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-sm"
                    onClick={() => {
                      setNavigationDate(null);
                      fetchData();
                    }}
                    aria-label="Go to current time period"
                  >
                    Current
                  </Button>
                </div>

                {/* Chart type toggle */}
                <ChartTypeToggle chartType={chartType} setChartType={setChartType} />
              </div>

              {/* Right side: Refresh button - hidden on mobile (available in 3-dots menu) */}
              <div className="hidden md:flex justify-end">
                <Button
                  onClick={fetchData}
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  aria-label="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
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
              <option value="gold-gained">Gold Gained</option>
              <option value="gold-spent">Spent</option>
              <option value="experience">Experience</option>
              <option value="level">Level</option>
            </select>
          </div>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)} className="mb-4 hidden md:block">
            <TabsList aria-label="king-stats-tabs">
              <TabsTrigger value="gold-gained" aria-label="gold-gained-tab">Gold Gained</TabsTrigger>
              <TabsTrigger value="gold-spent" aria-label="gold-spent-tab">Spent</TabsTrigger>
              <TabsTrigger value="experience" aria-label="experience-tab">Experience</TabsTrigger>
              <TabsTrigger value="level" aria-label="level-tab">Level</TabsTrigger>
            </TabsList>
          </Tabs>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
          ) : !hasData ? (
            activeTab === 'gold-gained' || activeTab === 'gold-spent' ? <GoldEmptyState /> :
              activeTab === 'experience' ? <ExperienceEmptyState /> :
                <LevelEmptyState />
          ) : (
            <ChartBlock
              graphData={graphData}
              timePeriod={timePeriod}
              highlightCurrent={true}
              ariaLabel="king-stats-bar-chart"
              chartType={chartType}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}