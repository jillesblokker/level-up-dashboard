"use client"

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Sword, Brain, Crown, Castle, Hammer, Heart, Sun, PersonStanding, Flame, Trophy, Shield, Medal, CheckCircle2, TrendingUp, Ban, Check, X, ScrollText, Target, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { TEXT_CONTENT } from '@/lib/text-content'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAuth } from '@clerk/nextjs'

const categoryIcons: Record<string, any> = {
    might: Sword,
    knowledge: Brain,
    honor: Crown,
    castle: Castle,
    craft: Hammer,
    vitality: Heart,
    wellness: Sun,
    exploration: PersonStanding,
    // Type icons
    quest: ScrollText,
    challenge: Target,
};

const categoryColors: Record<string, string> = {
    might: 'text-red-500 bg-red-500/10 border-red-500/30',
    knowledge: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    honor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    castle: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    craft: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    vitality: 'text-pink-500 bg-pink-500/10 border-pink-500/30',
    wellness: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
    exploration: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
    // Type colors
    quest: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
    challenge: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
};

// Helper for chart color based on category or type
const getCategoryColorHex = (category: string) => {
    const map: Record<string, string> = {
        might: '#ef4444',
        knowledge: '#3b82f6',
        honor: '#f59e0b',
        castle: '#10b981',
        craft: '#f97316',
        vitality: '#ec4899',
        wellness: '#06b6d4',
        exploration: '#6366f1',
        quest: '#a855f7',
        challenge: '#f97316',
    }
    return map[category?.toLowerCase()] || '#f59e0b'; // Default amber
}

// Helper to normalize category names for matching
const normalizeCategory = (cat: string | undefined | null): string => {
    if (!cat) return '';
    return cat.toLowerCase().trim();
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-950 border border-amber-900/50 p-2 rounded-lg shadow-xl text-xs">
                <p className="text-amber-200 font-bold mb-1">{label}</p>
                <p className="text-zinc-300">
                    <span className="font-mono font-bold text-white">{payload[0].value}</span> activities completed
                </p>
            </div>
        )
    }
    return null
}

// Filter type: 'all' | 'type:quest' | 'type:challenge' | category name
type FilterValue = string;

export function MasteryLedger() {
    const { getToken } = useAuth()
    const [habits, setHabits] = useState<any[]>([])
    const [completions, setCompletions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<'week' | 'month'>('week')
    const [selectedFilter, setSelectedFilter] = useState<FilterValue>('all')
    const [selectedDate, setSelectedDate] = useState(new Date())

    // Calculate the week range (Mon-Sun) for the selected date
    const weekDays = useMemo(() => {
        const d = new Date(selectedDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const start = new Date(d.setDate(diff));

        const days = [];
        for (let i = 0; i < 7; i++) {
            const current = new Date(start);
            current.setDate(current.getDate() + i);
            days.push(current);
        }
        return days;
    }, [selectedDate]);

    const fetchData = useCallback(async () => {
        try {
            // Get authentication token
            const token = await getToken({ template: 'supabase' })

            if (!token) {
                console.warn('[MasteryLedger] No auth token available, skipping fetch')
                setLoading(false)
                return
            }

            const authHeaders = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }

            // Use the selected date to determine the month context for history
            const dateStr = selectedDate.toISOString().split('T')[0];

            // Fetch both History (for list/categories) and Raw Completions (for accurate graph)
            const [historyRes, questsRes, challengesRes] = await Promise.all([
                fetch(`/api/mastery/history?date=${dateStr}`, { headers: authHeaders }),
                fetch('/api/quests/completion', { headers: authHeaders }),
                fetch('/api/challenges/completion', { headers: authHeaders })
            ])

            const historyData = historyRes.ok ? await historyRes.json() : {}
            const questsData = questsRes.ok ? await questsRes.json() : []
            const challengesData = challengesRes.ok ? await challengesRes.json() : []

            if (historyData.habits) {
                // Add type info to habits based on their source
                const enrichedHabits = historyData.habits.map((h: any) => {
                    const habitType = h.type || (h.mandate?.period ? 'quest' : 'challenge');
                    return {
                        ...h,
                        habitType: habitType
                    };
                });

                // Sort by fulfillment (top performers first)
                const sorted = enrichedHabits.sort((a: any, b: any) => b.stats.fulfillment - a.stats.fulfillment)
                setHabits(sorted)
            }

            // Merge completions with type info
            const allCompletions = [
                ...(Array.isArray(questsData) ? questsData.map((c: any) => ({
                    ...c,
                    completionType: 'quest',
                    date: c.completed_at || c.date,
                    itemId: c.quest_id,
                    category: c.category
                })) : []),
                ...(Array.isArray(challengesData) ? challengesData.map((c: any) => ({
                    ...c,
                    completionType: 'challenge',
                    date: c.date || c.completed_at,
                    itemId: c.challenge_id,
                    category: c.category
                })) : [])
            ];

            setCompletions(allCompletions)

        } catch (err) {
            console.error('Failed to fetch ledger data:', err)
        } finally {
            setLoading(false)
        }
    }, [getToken, selectedDate])

    useEffect(() => {
        fetchData()

        // Listen for updates from other components
        const handleUpdate = () => {
            console.log('[MasteryLedger] Received update event, refreshing data...')
            fetchData()
        }

        window.addEventListener('quest-completed', handleUpdate)
        window.addEventListener('challenge-completed', handleUpdate)
        window.addEventListener('character-stats-update', handleUpdate)

        return () => {
            window.removeEventListener('quest-completed', handleUpdate)
            window.removeEventListener('challenge-completed', handleUpdate)
            window.removeEventListener('character-stats-update', handleUpdate)
        }
    }, [fetchData])

    // Get unique categories from habits for filter dropdown, grouped by type
    const filterOptions = useMemo(() => {
        const questCategories = new Set<string>();
        const challengeCategories = new Set<string>();

        habits.forEach(h => {
            const cat = normalizeCategory(h.category);
            if (!cat) return;

            if (h.habitType === 'quest') {
                questCategories.add(cat);
            } else if (h.habitType === 'challenge') {
                challengeCategories.add(cat);
            } else {
                questCategories.add(cat);
            }
        });

        // Also check completions for additional categories
        completions.forEach(c => {
            const cat = normalizeCategory(c.category);
            if (!cat) return;

            if (c.completionType === 'quest') {
                questCategories.add(cat);
            } else if (c.completionType === 'challenge') {
                challengeCategories.add(cat);
            }
        });

        return {
            quests: Array.from(questCategories).sort(),
            challenges: Array.from(challengeCategories).sort()
        };
    }, [habits, completions])

    // Count quests and challenges
    const typeCounts = useMemo(() => {
        const questCount = habits.filter(h => h.habitType === 'quest').length;
        const challengeCount = habits.filter(h => h.habitType === 'challenge').length;
        return { quests: questCount, challenges: challengeCount };
    }, [habits]);

    // Filter habits for the list based on the selected filter
    const filteredHabits = useMemo(() => {
        if (selectedFilter === 'all') return habits;

        // Type filter
        if (selectedFilter === 'type:quest') {
            return habits.filter(h => h.habitType === 'quest');
        }
        if (selectedFilter === 'type:challenge') {
            return habits.filter(h => h.habitType === 'challenge');
        }

        // Category filter (from quests or challenges)
        if (selectedFilter.startsWith('quest:')) {
            const cat = selectedFilter.replace('quest:', '');
            return habits.filter(h => h.habitType === 'quest' && normalizeCategory(h.category) === cat);
        }
        if (selectedFilter.startsWith('challenge:')) {
            const cat = selectedFilter.replace('challenge:', '');
            return habits.filter(h => h.habitType === 'challenge' && normalizeCategory(h.category) === cat);
        }

        return habits.filter(h => normalizeCategory(h.category) === normalizeCategory(selectedFilter));
    }, [habits, selectedFilter])

    // Generate Chart Data from Completions - filtered based on selection and week
    const chartData = useMemo(() => {
        // Create a map of itemId -> info from habits
        const habitInfo = habits.reduce((acc: Record<string, { category: string; type: string }>, h: any) => {
            if (h.id) {
                acc[h.id] = {
                    category: normalizeCategory(h.category),
                    type: h.habitType || 'quest'
                };
            }
            return acc;
        }, {});

        // Filter completions based on current filter
        const relevantCompletions = completions.filter(c => {
            if (selectedFilter === 'all') return true;
            if (selectedFilter === 'type:quest') return c.completionType === 'quest';
            if (selectedFilter === 'type:challenge') return c.completionType === 'challenge';
            if (selectedFilter.startsWith('quest:')) {
                const cat = selectedFilter.replace('quest:', '');
                return c.completionType === 'quest' && normalizeCategory(c.category) === cat;
            }
            if (selectedFilter.startsWith('challenge:')) {
                const cat = selectedFilter.replace('challenge:', '');
                return c.completionType === 'challenge' && normalizeCategory(c.category) === cat;
            }

            const info = habitInfo[c.itemId];
            if (info) return info.category === normalizeCategory(selectedFilter);
            return normalizeCategory(c.category) === normalizeCategory(selectedFilter);
        });

        // Group by day for the selected week
        return weekDays.map((d) => {
            const dateStr = d.toISOString().slice(0, 10);
            // Format label (Mon, Tue)
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);

            const count = relevantCompletions.filter(c => {
                if (!c.date) return false;
                return c.date.startsWith(dateStr);
            }).length;

            return { day: dayLabel, count, fullDate: dateStr, isFuture: d > new Date() }
        })
    }, [completions, habits, selectedFilter, weekDays])

    // Calculate completion counts per habit per day for the grid display
    const getHabitDayCompletions = useCallback((habitId: string, dayIndex: number) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - dayIndex));
        const dateStr = d.toISOString().slice(0, 10);

        return completions.filter(c => {
            if (!c.date || (c.itemId !== habitId && c.quest_id !== habitId && c.challenge_id !== habitId)) return false;
            return c.date.startsWith(dateStr) && c.completed !== false;
        }).length;
    }, [completions])

    // Get display label for current filter
    const getFilterLabel = (filter: string) => {
        if (filter === 'all') return 'All Activities';
        if (filter === 'type:quest') return 'All Quests';
        if (filter === 'type:challenge') return 'All Challenges';
        if (filter.startsWith('quest:')) return `Quest: ${filter.replace('quest:', '')}`;
        if (filter.startsWith('challenge:')) return `Challenge: ${filter.replace('challenge:', '')}`;
        return filter;
    }

    // Get color for current filter
    const getFilterColor = () => {
        if (selectedFilter === 'type:quest' || selectedFilter.startsWith('quest:')) return getCategoryColorHex('quest');
        if (selectedFilter === 'type:challenge' || selectedFilter.startsWith('challenge:')) return getCategoryColorHex('challenge');
        if (selectedFilter !== 'all') return getCategoryColorHex(selectedFilter);
        return '#f59e0b';
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-amber-500/60 font-serif italic">Consulting the Eternal Ledger...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-amber-900/20 pb-6">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold font-serif text-amber-500 tracking-tight">Mastery Ledger</h2>
                    <p className="text-gray-500 text-sm mt-1">A historical record of your quests and challenges.</p>

                    {/* Date Navigation Toolbar */}
                    <div className="flex items-center gap-2 mt-4">
                        <Button variant="outline" size="icon" className="h-8 w-8 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:text-amber-500" onClick={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() - 7);
                            setSelectedDate(d);
                        }}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-2 px-3 h-8 border border-zinc-700 rounded-md bg-zinc-900 min-w-[180px] justify-center text-sm font-medium text-zinc-300">
                            <Calendar className="h-3.5 w-3.5 text-amber-500/70" />
                            <span>
                                {weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                {' - '}
                                {weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>

                        <Button variant="outline" size="icon" className="h-8 w-8 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:text-amber-500" onClick={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() + 7);
                            setSelectedDate(d);
                        }}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:text-amber-500 ml-2"
                            onClick={() => setSelectedDate(new Date())}
                        >
                            Today
                        </Button>
                    </div>
                </div>

                {/* Global Stats */}
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Quests</div>
                        <div className="text-xl font-bold text-purple-400">{typeCounts.quests}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Challenges</div>
                        <div className="text-xl font-bold text-orange-400">{typeCounts.challenges}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Avg Prowess</div>
                        <div className="text-xl font-bold text-white">
                            {habits.length > 0
                                ? Math.round(habits.reduce((acc, h) => acc + h.stats.fulfillment, 0) / habits.length)
                                : 0}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis Section */}
            <div className="grid gap-6 md:grid-cols-[250px_1fr]">
                {/* Filters */}
                <div className="space-y-4">
                    <Card className="p-4 bg-black/40 border-amber-900/20">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                            Filter by Type & Category
                        </label>
                        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                            <SelectTrigger className="w-full bg-zinc-900/80 border-amber-900/30 text-amber-100">
                                <SelectValue placeholder="All Activities" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-amber-900/30 text-amber-100 max-h-[300px]">
                                <SelectItem value="all">All Activities</SelectItem>
                                <SelectGroup>
                                    <SelectLabel className="text-xs text-amber-500/70 font-bold uppercase mt-2">Types</SelectLabel>
                                    <SelectItem value="type:quest" className="pl-6">All Quests</SelectItem>
                                    <SelectItem value="type:challenge" className="pl-6">All Challenges</SelectItem>
                                </SelectGroup>
                                {filterOptions.quests.length > 0 && ((selectedFilter === 'all' || selectedFilter.includes('quest')) || true) && (
                                    <SelectGroup>
                                        <SelectLabel className="text-xs text-purple-500/70 font-bold uppercase mt-2">Quest Categories</SelectLabel>
                                        {filterOptions.quests.map(cat => (
                                            <SelectItem key={`quest:${cat}`} value={`quest:${cat}`} className="pl-6 capitalize">
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                )}
                                {filterOptions.challenges.length > 0 && ((selectedFilter === 'all' || selectedFilter.includes('challenge')) || true) && (
                                    <SelectGroup>
                                        <SelectLabel className="text-xs text-orange-500/70 font-bold uppercase mt-2">Challenge Categories</SelectLabel>
                                        {filterOptions.challenges.map(cat => (
                                            <SelectItem key={`challenge:${cat}`} value={`challenge:${cat}`} className="pl-6 capitalize">
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                )}
                            </SelectContent>
                        </Select>

                        <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 uppercase font-bold tracking-wider">Shown</span>
                                <span className="font-mono text-white text-lg font-bold">{filteredHabits.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 uppercase font-bold tracking-wider">Avg Yield</span>
                                <span style={{ color: getFilterColor() }} className="font-mono text-lg font-bold">
                                    {filteredHabits.length > 0
                                        ? Math.round(filteredHabits.reduce((acc, h) => acc + h.stats.fulfillment, 0) / filteredHabits.length)
                                        : 0}%
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Graph */}
                <Card className="bg-black/40 border-amber-900/10 p-6 min-h-[300px] flex flex-col">
                    <div className="mb-6 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-amber-500" />
                            <h3 className="text-sm font-bold text-gray-300">Weekly Activity</h3>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 600 }}
                                    dy={10}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{
                                        backgroundColor: '#09090b',
                                        border: '1px solid rgba(245,158,11,0.2)',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ color: '#fbbf24' }}
                                />
                                <Bar
                                    dataKey="count"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getFilterColor()} fillOpacity={0.9} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Habit List */}
            <div className="grid gap-4 mt-6">
                {filteredHabits.map((habit, idx) => (
                    <Card key={habit.id} className="bg-zinc-950/40 border-amber-900/10 hover:bg-zinc-900/60 hover:border-amber-500/20 transition-all p-3 group relative overflow-hidden">
                        {/* Subtle highlight for high performers */}
                        {habit.stats.fulfillment >= 80 && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-green-600" />
                        )}

                        <div className="flex flex-col md:flex-row md:items-center gap-4 pl-2">
                            {/* 1. Identity Section */}
                            <div className="flex items-center gap-3 md:w-[250px] min-w-0">
                                <div className={cn(
                                    "p-2 rounded-lg border shrink-0",
                                    habit.habitType === 'quest'
                                        ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                        : "bg-orange-500/10 border-orange-500/20 text-orange-400"
                                )}>
                                    {React.createElement(
                                        habit.habitType === 'quest' ? ScrollText : Target,
                                        { className: "w-4 h-4" }
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-sm text-zinc-200 truncate pr-2" title={habit.name}>
                                        {habit.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-zinc-500 capitalize">{normalizeCategory(habit.category) || 'General'}</span>
                                        <span className="text-[10px] text-zinc-600">•</span>
                                        <span className="text-[10px] text-zinc-500">{habit.mandate.count}× {habit.mandate.period}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Trend Section (Selected Week) */}
                            <div className="flex-1 flex flex-col justify-center">
                                <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-bold mb-1.5 md:hidden">Weekly Activity</span>
                                <div className="grid grid-cols-7 gap-1 max-w-[280px]">
                                    {weekDays.map((d, i) => {
                                        const dateStr = d.toISOString().slice(0, 10);
                                        const isToday = d.toDateString() === new Date().toDateString();

                                        const completionCount = completions.filter(c => {
                                            if (!c.date) return false;
                                            const matchesHabit = c.itemId === habit.id || c.quest_id === habit.id || c.challenge_id === habit.id;
                                            return matchesHabit && c.date.startsWith(dateStr) && c.completed !== false;
                                        }).length;

                                        const hasCompletions = completionCount > 0;

                                        return (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "h-8 rounded-sm flex items-center justify-center transition-all relative group/day",
                                                    hasCompletions
                                                        ? habit.habitType === 'quest'
                                                            ? "bg-purple-500/20 border border-purple-500/30 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.1)]"
                                                            : "bg-orange-500/20 border border-orange-500/30 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.1)]"
                                                        : "bg-zinc-900/50 border border-zinc-800/50",
                                                    isToday && !hasCompletions && "border-zinc-700 ring-1 ring-zinc-700"
                                                )}
                                            >
                                                {hasCompletions ? (
                                                    <span className="font-bold text-xs">{completionCount}</span>
                                                ) : (
                                                    <div className="w-0.5 h-0.5 rounded-full bg-zinc-700" />
                                                )}
                                                {/* Tooltip on hover */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-zinc-900 text-[9px] text-zinc-300 rounded border border-zinc-700 whitespace-nowrap opacity-0 group-hover/day:opacity-100 pointer-events-none z-20">
                                                    {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. Stats Section */}
                            <div className="flex items-center gap-6 md:w-[180px] md:justify-end border-t md:border-t-0 border-zinc-800/50 pt-3 md:pt-0 mt-1 md:mt-0">
                                <div className="flex flex-col items-center">
                                    <span className="text-xl font-bold text-zinc-200">{habit.stats.monthly}</span>
                                    <span className="text-[9px] uppercase text-zinc-600 font-bold">Month</span>
                                </div>
                                <div className="flex flex-col items-end min-w-[60px]">
                                    <span className={cn(
                                        "text-sm font-bold",
                                        habit.stats.fulfillment >= 80 ? "text-green-500" : "text-amber-500"
                                    )}>
                                        {habit.stats.fulfillment}%
                                    </span>
                                    <Progress value={habit.stats.fulfillment} className="h-1 w-16 bg-zinc-800 mt-1">
                                        <div
                                            className={cn("h-full", habit.stats.fulfillment >= 80 ? "bg-green-500" : "bg-amber-500")}
                                            style={{ width: `${habit.stats.fulfillment}%` }}
                                        />
                                    </Progress>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}

                {filteredHabits.length === 0 && (
                    <div className="text-center py-12 bg-gray-950/20 border-2 border-dashed border-amber-900/20 rounded-2xl">
                        <PersonStanding className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-400 mb-2">The Ledger is Empty</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            No active quests or challenges found for this category. Adjust the filters or begin a new journey.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
