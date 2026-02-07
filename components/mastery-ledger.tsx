"use client"

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Sword, Brain, Crown, Castle, Hammer, Heart, Sun, PersonStanding, Flame, Trophy, Shield, Medal, CheckCircle2, TrendingUp, Ban, Check, X, ScrollText, Target } from 'lucide-react'
import { TEXT_CONTENT } from '@/lib/text-content'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
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

            // Fetch both History (for list/categories) and Raw Completions (for accurate graph)
            const [historyRes, questsRes, challengesRes] = await Promise.all([
                fetch('/api/mastery/history', { headers: authHeaders }),
                fetch('/api/quests/completion', { headers: authHeaders }),
                fetch('/api/challenges/completion', { headers: authHeaders })
            ])

            const historyData = historyRes.ok ? await historyRes.json() : {}
            const questsData = questsRes.ok ? await questsRes.json() : []
            const challengesData = challengesRes.ok ? await challengesRes.json() : []

            if (historyData.habits) {
                // Add type info to habits based on their source
                // Also try to enrich with quest/challenge type
                const enrichedHabits = historyData.habits.map((h: any) => {
                    // Try to determine if it's a quest or challenge based on the data
                    // Usually the history API normalizes this, but let's be safe
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
    }, [getToken])

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

    const getLast7Days = () => {
        const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
        const result = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            result.push(days[d.getDay()])
        }
        return result
    }

    const last7DaysLabels = getLast7Days()

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
                // Default to quest if unknown
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

        // Legacy: plain category match
        return habits.filter(h => normalizeCategory(h.category) === normalizeCategory(selectedFilter));
    }, [habits, selectedFilter])

    // Generate Chart Data from Completions - filtered based on selection
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

            // Type filter
            if (selectedFilter === 'type:quest') {
                return c.completionType === 'quest';
            }
            if (selectedFilter === 'type:challenge') {
                return c.completionType === 'challenge';
            }

            // Category filter
            if (selectedFilter.startsWith('quest:')) {
                const cat = selectedFilter.replace('quest:', '');
                return c.completionType === 'quest' && normalizeCategory(c.category) === cat;
            }
            if (selectedFilter.startsWith('challenge:')) {
                const cat = selectedFilter.replace('challenge:', '');
                return c.completionType === 'challenge' && normalizeCategory(c.category) === cat;
            }

            // Legacy category
            const info = habitInfo[c.itemId];
            if (info) {
                return info.category === normalizeCategory(selectedFilter);
            }
            return normalizeCategory(c.category) === normalizeCategory(selectedFilter);
        });

        // Group by day for the last 7 days
        return last7DaysLabels.map((dayLabel, idx) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - idx));
            const dateStr = d.toISOString().slice(0, 10);

            const count = relevantCompletions.filter(c => {
                if (!c.date) return false;
                return c.date.startsWith(dateStr);
            }).length;

            return { day: dayLabel, count }
        })
    }, [completions, habits, selectedFilter, last7DaysLabels])

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
                <div>
                    <h2 className="text-2xl font-bold font-serif text-amber-500 tracking-tight">Mastery Ledger</h2>
                    <p className="text-gray-500 text-sm mt-1">A historical record of your quests and challenges.</p>
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
                                {/* All */}
                                <SelectItem value="all">All Activities</SelectItem>

                                {/* Quests Section */}
                                <SelectGroup>
                                    <SelectLabel className="text-purple-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 px-2 py-2 border-t border-zinc-800 mt-1">
                                        <ScrollText className="w-3.5 h-3.5" />
                                        Quests
                                    </SelectLabel>
                                    <SelectItem value="type:quest" className="pl-4">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                                            All Quests
                                        </span>
                                    </SelectItem>
                                    {filterOptions.quests.map(cat => (
                                        <SelectItem key={`quest:${cat}`} value={`quest:${cat}`} className="pl-6 capitalize">
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>

                                {/* Challenges Section */}
                                <SelectGroup>
                                    <SelectLabel className="text-orange-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 px-2 py-2 border-t border-zinc-800 mt-1">
                                        <Target className="w-3.5 h-3.5" />
                                        Challenges
                                    </SelectLabel>
                                    <SelectItem value="type:challenge" className="pl-4">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                                            All Challenges
                                        </span>
                                    </SelectItem>
                                    {filterOptions.challenges.map(cat => (
                                        <SelectItem key={`challenge:${cat}`} value={`challenge:${cat}`} className="pl-6 capitalize">
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </Card>

                    {/* Quick Stats for Selection */}
                    <div className="grid grid-cols-2 gap-2">
                        <Card className="p-3 bg-zinc-900/30 border-zinc-800 flex flex-col items-center justify-center">
                            <span className="text-[10px] text-zinc-500 uppercase">Shown</span>
                            <span className="text-xl font-bold text-white">{filteredHabits.length}</span>
                        </Card>
                        <Card className="p-3 bg-zinc-900/30 border-zinc-800 flex flex-col items-center justify-center">
                            <span className="text-[10px] text-zinc-500 uppercase">Avg Yield</span>
                            <span className="text-xl font-bold text-amber-500">
                                {filteredHabits.length > 0
                                    ? Math.round(filteredHabits.reduce((acc, h) => acc + h.stats.fulfillment, 0) / filteredHabits.length)
                                    : 0}%
                            </span>
                        </Card>
                    </div>
                </div>

                {/* Graph */}
                <Card className="bg-black/20 border-zinc-800/50 p-4 relative overflow-hidden">
                    <div className="absolute top-4 left-4 z-10">
                        <h3 className="text-sm font-bold text-zinc-400 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-amber-500" />
                            Weekly Activity
                            {selectedFilter !== 'all' && (
                                <span
                                    className="capitalize px-2 py-0.5 rounded text-xs"
                                    style={{
                                        color: getFilterColor(),
                                        backgroundColor: `${getFilterColor()}20`
                                    }}
                                >
                                    {getFilterLabel(selectedFilter)}
                                </span>
                            )}
                        </h3>
                    </div>
                    <div className="h-[180px] w-full pt-6">
                        {chartData.some(d => d.count > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis
                                        dataKey="day"
                                        stroke="#52525b"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.count > 0 ? getFilterColor() : '#333'}
                                                fillOpacity={0.8}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                <Ban className="w-8 h-8 opacity-20 mb-2" />
                                <span className="text-xs">No activity recorded this week{selectedFilter !== 'all' && ` for ${getFilterLabel(selectedFilter)}`}</span>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Habit List */}
            <div className="grid gap-4 mt-6">
                {filteredHabits.map((habit, idx) => (
                    <Card key={habit.id} className="bg-gray-950/40 border-amber-900/20 hover:border-amber-500/30 transition-all p-4 relative overflow-hidden group">
                        {/* Foil gradient for top performers */}
                        {habit.stats.fulfillment >= 80 && (
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                        )}

                        <div className="flex flex-col lg:flex-row lg:items-center gap-6 relative z-10">
                            {/* Habit Info */}
                            <div className="flex items-center gap-4 lg:w-[280px]">
                                <div className={cn(
                                    "p-2.5 rounded-xl border transition-all duration-300",
                                    habit.habitType === 'quest'
                                        ? categoryColors['quest']
                                        : habit.habitType === 'challenge'
                                            ? categoryColors['challenge']
                                            : categoryColors[normalizeCategory(habit.category)] || 'text-gray-500 bg-gray-500/10 border-gray-500/30'
                                )}>
                                    {React.createElement(
                                        habit.habitType === 'quest'
                                            ? ScrollText
                                            : habit.habitType === 'challenge'
                                                ? Target
                                                : categoryIcons[normalizeCategory(habit.category)] || Sword,
                                        { className: "w-5 h-5" }
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-sm text-gray-200 truncate">{habit.name}</h3>
                                        {idx === 0 && selectedFilter === 'all' && <Medal className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={cn(
                                            "text-[8px] px-1.5 py-0.5 rounded font-bold uppercase",
                                            habit.habitType === 'quest' ? "bg-purple-500/20 text-purple-400" : "bg-orange-500/20 text-orange-400"
                                        )}>
                                            {habit.habitType || 'quest'}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-bold tracking-tighter">
                                            {habit.mandate.count}× {habit.mandate.period}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Mastery Cycle Grid */}
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-1">
                                        {view === 'week' ? 'Last 7 Days' : '30-Day History'}
                                    </span>
                                    <div className="flex bg-gray-900/50 p-0.5 rounded-lg border border-gray-800">
                                        <button
                                            onClick={() => setView('week')}
                                            className={cn(
                                                "px-2 py-0.5 text-[8px] font-bold uppercase rounded-md transition-all",
                                                view === 'week'
                                                    ? "bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                                                    : "text-gray-600 hover:text-gray-400"
                                            )}
                                        >
                                            Week
                                        </button>
                                        <button
                                            onClick={() => setView('month')}
                                            className={cn(
                                                "px-2 py-0.5 text-[8px] font-bold uppercase rounded-md transition-all",
                                                view === 'month'
                                                    ? "bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                                                    : "text-gray-600 hover:text-gray-400"
                                            )}
                                        >
                                            Month
                                        </button>
                                    </div>
                                </div>

                                {view === 'week' ? (
                                    <div className="space-y-1.5">
                                        <div className="grid grid-cols-7 gap-1 text-[8px] font-bold text-gray-600">
                                            {last7DaysLabels.map((d, i) => (
                                                <span key={i} className={cn("text-center", i === 6 && "text-amber-500")}>{d}</span>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {Array.from({ length: 7 }).map((_, i) => {
                                                const targetDate = new Date();
                                                targetDate.setDate(targetDate.getDate() - (6 - i));
                                                const dateStr = targetDate.toISOString().slice(0, 10);

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
                                                            "h-10 rounded-lg border flex items-center justify-center transition-all duration-300 relative",
                                                            hasCompletions
                                                                ? habit.habitType === 'quest'
                                                                    ? "bg-gradient-to-br from-purple-500/30 to-purple-600/20 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                                                                    : "bg-gradient-to-br from-orange-500/30 to-orange-600/20 border-orange-500/60 shadow-[0_0_12px_rgba(249,115,22,0.25)]"
                                                                : "bg-gray-900/40 border-gray-800/60",
                                                            i === 6 && !hasCompletions && "border-dashed border-gray-700"
                                                        )}
                                                        title={`${dateStr === new Date().toISOString().slice(0, 10) ? 'Today' : dateStr}: ${completionCount} completions`}
                                                    >
                                                        {hasCompletions ? (
                                                            <span className={cn(
                                                                "font-bold text-sm",
                                                                habit.habitType === 'quest' ? "text-purple-400" : "text-orange-400"
                                                            )}>
                                                                {completionCount}
                                                            </span>
                                                        ) : (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1 items-center justify-center bg-gray-900/10 rounded-xl border border-dashed border-gray-800/50 p-2">
                                        <div className="grid grid-cols-10 gap-x-1 gap-y-1 w-full">
                                            {Array.from({ length: 30 }).map((_, i) => {
                                                const dayIndex = 29 - i;
                                                const targetDate = new Date();
                                                targetDate.setDate(targetDate.getDate() - dayIndex);
                                                const dateStr = targetDate.toISOString().slice(0, 10);

                                                const completionCount = completions.filter(c => {
                                                    if (!c.date) return false;
                                                    const matchesHabit = c.itemId === habit.id || c.quest_id === habit.id || c.challenge_id === habit.id;
                                                    return matchesHabit && c.date.startsWith(dateStr) && c.completed !== false;
                                                }).length;

                                                const done = completionCount > 0 || habit.completions?.some((c: any) => {
                                                    const completionDate = new Date(c.completed_at);
                                                    return completionDate.toISOString().slice(0, 10) === dateStr;
                                                });

                                                return (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            "h-6 rounded border flex items-center justify-center transition-all",
                                                            done
                                                                ? habit.habitType === 'quest'
                                                                    ? "bg-gradient-to-br from-purple-500/40 to-purple-600/30 border-purple-500/60 shadow-[0_0_5px_rgba(168,85,247,0.2)]"
                                                                    : "bg-gradient-to-br from-orange-500/40 to-orange-600/30 border-orange-500/60 shadow-[0_0_5px_rgba(249,115,22,0.2)]"
                                                                : "bg-gray-900/40 border-gray-800/40"
                                                        )}
                                                        title={`${dayIndex === 0 ? 'Today' : (dayIndex + ' days ago')}: ${completionCount} completion(s)`}
                                                    >
                                                        {done && (
                                                            <span className={cn(
                                                                "font-bold text-[10px]",
                                                                habit.habitType === 'quest' ? "text-purple-300" : "text-orange-300"
                                                            )}>
                                                                {completionCount || '✓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mastery Stats */}
                            <div className="lg:w-[200px] flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{TEXT_CONTENT.quests.mastery.stats.fulfillment}</span>
                                    <span className={cn("text-xs font-bold", habit.stats.fulfillment >= 80 ? 'text-green-500' : 'text-amber-500')}>{habit.stats.fulfillment}%</span>
                                </div>
                                <Progress value={habit.stats.fulfillment} className="h-1.5 bg-gray-900">
                                    <div className={cn("h-full transition-all", habit.stats.fulfillment >= 80 ? 'bg-green-500' : 'bg-amber-500')} style={{ width: `${habit.stats.fulfillment}%` }} />
                                </Progress>
                                <div className="flex items-center justify-between mt-1 text-[10px]">
                                    <span className="text-gray-600 font-bold uppercase">{TEXT_CONTENT.quests.mastery.stats.monthly}</span>
                                    <span className="text-gray-300 font-bold">{habit.stats.monthly} Deeds</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}

                {filteredHabits.length === 0 && (
                    <div className="text-center py-12 bg-gray-950/20 border-2 border-dashed border-amber-900/20 rounded-2xl">
                        <PersonStanding className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <h4 className="text-lg font-serif text-gray-500">
                            {selectedFilter !== 'all' ? `No ${getFilterLabel(selectedFilter)} found` : 'No active paths discovered'}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">Complete quests and challenges to track your mastery here.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
