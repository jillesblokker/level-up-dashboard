"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
    <section className="relative h-64 w-full flex flex-col items-center justify-center text-center rounded-lg overflow-hidden" aria-label="kingdom-stats-empty-state-section">
      <Image src="/images/quests-header.jpg" alt="Empty experience placeholder" className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" width={400} height={300} aria-hidden="true" />
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full space-y-3">
        <div className="text-amber-500 text-xl font-bold drop-shadow-md">No experience gained yet</div>
        <div className="text-gray-100 text-base">Complete quests and challenges to start leveling up!</div>
        <Link href="/quests?tab=quests" passHref legacyBehavior>
          <a className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold text-lg shadow-md" aria-label="Start your first quest" tabIndex={0} role="button">Start Your First Quest</a>
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
          <a className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white font-bold text-lg shadow-md" aria-label="Start your first quest" tabIndex={0} role="button">Start Your First Quest</a>
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

// Custom tooltip for both chart types
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-amber-700 bg-black/90 p-2 shadow-lg">
        <div className="text-xs text-amber-400 font-bold mb-1">{label}</div>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
            <span className="text-white text-sm font-semibold">{entry.value}</span>
            <span className="text-gray-400 text-xs">{entry.name}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// Bar/Line chart block
function ChartBlock({ graphData, timePeriod, highlightCurrent, ariaLabel, chartType }: {
  graphData: Array<{ day: string; value: number }>,
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
  return (
    <div className="space-y-2">
      {/* Debug info for week view */}
      {timePeriod === 'week' && (
        <div className="text-xs text-gray-400 mb-2">
          Debug: Week data length: {graphData.length}, Data: {JSON.stringify(graphData.slice(0, 3))}...
        </div>
      )}
      
      <div className="h-64 w-full" aria-label={ariaLabel} tabIndex={0} ref={chartRef}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <RechartsBarChart data={graphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barCategoryGap={"20%"}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" />
                          <XAxis
              dataKey="day"
              tick={({ x, y, payload, index }) => {
                if (!isValidDateString(payload.value)) return <g />;
                
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
  const { userId: authUserId, isLoaded, getToken } = useAuth();

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
      const apiUrl = `/api/kingdom-stats-v2?tab=${activeTab}&period=${timePeriod}&_t=${timestamp}`;
      console.log('[Kingdom Stats Component] 🔗 API URL:', apiUrl);
      console.log('[Kingdom Stats Component] 🔑 Auth token present:', !!getToken);
      
      const token = await getToken();
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
        throw new Error(`API error: ${res.status} ${res.statusText}`);
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
      } else if (data.success && data.data && Array.isArray(data.data)) {
        console.log('[Kingdom Stats Component] 📊 Setting graph data (success format):', data.data);
        console.log('[Kingdom Stats Component] 🔍 Week view data sample:', data.data.slice(0, 3));
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
  }, [authUserId, isLoaded, activeTab, timePeriod, getToken]);

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
  const hasData = graphData.length > 0;

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
                  if (timePeriod === 'all') return 'All';
                  return '';
                })()}
                <ChevronDown className="ml-2 w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTimePeriod('week')}>Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimePeriod('month')}>Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimePeriod('year')}>Year</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimePeriod('all')}>All</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex justify-end mt-2">
          {/* Chart type toggle removed - component not defined */}
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
export function KingStatsBlock({ userId }: { userId: string | null }) {
  const [graphData, setGraphData] = useState<Array<{ day: string; value: number }>>([]);
  const [activeTab, setActiveTab] = useState<'gold' | 'experience' | 'level'>('gold');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [isLoading, setIsLoading] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const { userId: authUserId, isLoaded, getToken } = useAuth();

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
      const token = await getToken();
      if (!token) {
        console.log('[Gains Component] No token available');
        return;
      }

      // Add cache-busting parameter to force fresh API call and see backend debugging
      const timestamp = Date.now();
      const apiUrl = `/api/kingdom-stats-v2?tab=${activeTab}&period=${timePeriod}&_t=${timestamp}`;
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
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const { data } = await res.json();
      console.log('[Gains Component] ✅ API response data:', data);
      setGraphData(data || []);
    } catch (err) {
      console.error('[Gains Component] Error fetching king stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authUserId, activeTab, timePeriod, isLoaded, getToken]);

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

  // Show chart if there is data (even if values are 0)
  const hasData = graphData.length > 0;

  return (
    <Card className="bg-black border-amber-800">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-amber-500 text-2xl font-bold">Gains</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Select time period" className="ml-2">
                {(() => {
                  if (timePeriod === 'week') return 'Week';
                  if (timePeriod === 'month') return 'Month';
                  if (timePeriod === 'year') return 'Year';
                  if (timePeriod === 'all') return 'All';
                  return '';
                })()}
                <ChevronDown className="ml-2 w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTimePeriod('week')}>Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimePeriod('month')}>Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimePeriod('year')}>Year</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimePeriod('all')}>All</DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex justify-end mt-2">
          {/* Chart type toggle removed - component not defined */}
        </div>
        <CardDescription className="text-gray-300">Track your gold, experience, and level progression</CardDescription>
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
              <option value="level">Level</option>
            </select>
          </div>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)} className="mb-4 hidden md:block">
            <TabsList aria-label="king-stats-tabs">
              <TabsTrigger value="gold" aria-label="gold-tab">Gold</TabsTrigger>
              <TabsTrigger value="experience" aria-label="experience-tab">Experience</TabsTrigger>
              <TabsTrigger value="level" aria-label="level-tab">Level</TabsTrigger>
            </TabsList>
          </Tabs>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
          ) : !hasData ? (
            activeTab === 'gold' ? <GoldEmptyState /> : 
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