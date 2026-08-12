"use client"

import { logger } from "@/lib/logger";
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Frown, Meh, Smile, Laugh, PartyPopper, Calendar as CalendarIcon, BookOpen, PenTool, Crown, ChevronDown, ChevronUp, Sparkles, Filter } from 'lucide-react'
import Link from 'next/link'
import { JournalModal } from '@/components/chronicle/JournalModal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SeasonArchivalModal } from '@/components/chronicle/SeasonArchivalModal'
import { Badge } from '@/components/ui/badge'
import { WeeklyGrowthInsightsCard } from '@/components/chronicle/WeeklyGrowthInsightsCard'

export default function ChroniclePage() {
    const [entries, setEntries] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isJournalOpen, setIsJournalOpen] = useState(false)
    const [isArchivalOpen, setIsArchivalOpen] = useState(false)
    const [journalEntry, setJournalEntry] = useState<any | null>(null)
    const [filterDate, setFilterDate] = useState<string>('')
    const [showInsights, setShowInsights] = useState(false)

    const { getToken } = useAuth()

    const loadEntries = async () => {
        setIsLoading(true)
        try {
            const token = await getToken({ template: 'supabase' })
            if (!token) {
                setIsLoading(false)
                return
            }

            const response = await fetch('/api/chronicle/entries', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                const sorted = data.sort((a: any, b: any) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
                setEntries(sorted)
            }
        } catch (error) {
            logger.error('Failed to load entries', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadEntries()
    }, [])

    const handleEdit = (entry: any) => {
        setJournalEntry(entry)
        setIsJournalOpen(true)
    }

    const handleCreate = () => {
        setJournalEntry(null)
        setIsJournalOpen(true)
    }

    const getMoodIcon = (score: number) => {
        switch (score) {
            case 1: return <Frown className="w-4 h-4 text-zinc-500" />
            case 2: return <Meh className="w-4 h-4 text-zinc-400" />
            case 3: return <Smile className="w-4 h-4 text-amber-200" />
            case 4: return <Laugh className="w-4 h-4 text-amber-400" />
            case 5: return <PartyPopper className="w-4 h-4 text-amber-500" />
            default: return null
        }
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    }

    const filteredEntries = filterDate
        ? entries.filter(e => e.entry_date.startsWith(filterDate))
        : entries;

    return (
        <div className="min-h-screen bg-black text-amber-50 relative overflow-hidden font-sans p-4 md:p-8">
            <div className="max-w-5xl mx-auto relative z-10 space-y-6">
                
                {/* PRIMARY TIER: Header Bar with Clear Title & Direct Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-900/20 pb-4">
                    <div className="flex items-center gap-3">
                        <Link href="/profile">
                            <Button variant="ghost" size="icon" className="text-amber-500/60 hover:text-amber-400 hover:bg-amber-900/20 rounded-full h-9 w-9">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                                Chronicle & Reflection Journal
                            </h1>
                            <p className="text-xs text-zinc-400">Track habit milestones & record private daily reflections</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIsArchivalOpen(true)}
                            variant="outline"
                            className="border-amber-500/30 text-amber-300 hover:bg-amber-950/40 text-xs font-bold rounded-xl px-3 h-10 flex items-center gap-1.5"
                        >
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            Past Champions
                        </Button>
                        <Button
                            onClick={handleCreate}
                            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl px-4 h-10 flex items-center gap-1.5 shadow-md"
                        >
                            <PenTool className="w-3.5 h-3.5" />
                            Scribe Entry
                        </Button>
                    </div>
                </div>

                <SeasonArchivalModal isOpen={isArchivalOpen} onClose={() => setIsArchivalOpen(false)} />

                {/* TERTIARY TIER: Collapsible Insights & Mood Radar (Progressive Disclosure) */}
                <div className="border border-amber-900/30 rounded-2xl bg-zinc-950/60 overflow-hidden">
                    <button
                        onClick={() => setShowInsights(!showInsights)}
                        className="w-full p-4 flex items-center justify-between text-xs font-bold text-amber-300 font-serif hover:bg-amber-950/20 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Monthly Growth Insights & Mood Radar
                        </span>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-950/40">
                                Optimal Balance
                            </Badge>
                            {showInsights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </button>

                    {showInsights && (
                        <div className="p-4 border-t border-amber-900/20 space-y-4 bg-zinc-900/40">
                            <WeeklyGrowthInsightsCard />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                <div className="p-3 rounded-xl bg-zinc-900 border border-amber-500/30 text-center space-y-1">
                                    <span className="text-lg">⚡</span>
                                    <h4 className="font-bold text-xs text-amber-300">Energized (65%)</h4>
                                    <p className="text-[10px] text-zinc-400">Habit momentum active</p>
                                </div>
                                <div className="p-3 rounded-xl bg-zinc-900 border border-blue-500/30 text-center space-y-1">
                                    <span className="text-lg">🎯</span>
                                    <h4 className="font-bold text-xs text-blue-300">Focused (25%)</h4>
                                    <p className="text-[10px] text-zinc-400">Deep learning sessions</p>
                                </div>
                                <div className="p-3 rounded-xl bg-zinc-900 border border-emerald-500/30 text-center space-y-1">
                                    <span className="text-lg">🌿</span>
                                    <h4 className="font-bold text-xs text-emerald-300">Calm (10%)</h4>
                                    <p className="text-[10px] text-zinc-400">Restful recovery</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* SECONDARY TIER: Clean Filters & Dual Tabs */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs font-bold text-zinc-400">Filter Month:</span>
                        <input
                            type="month"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="bg-black border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-amber-100 focus:outline-none focus:border-amber-500 font-mono"
                        />
                        {filterDate && (
                            <Button variant="ghost" size="sm" onClick={() => setFilterDate('')} className="h-6 px-2 text-zinc-400 text-xs">
                                Clear
                            </Button>
                        )}
                    </div>
                    <span className="text-xs font-mono text-amber-400 font-bold">{filteredEntries.length} Reflections Archived</span>
                </div>

                {/* SECONDARY TIER: Clean Reflection Entry Cards */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full bg-zinc-900 rounded-xl" />)}
                    </div>
                ) : filteredEntries.length > 0 ? (
                    <div className="space-y-3">
                        {filteredEntries.map(entry => (
                            <Card
                                key={entry.id}
                                onClick={() => handleEdit(entry)}
                                className="bg-zinc-900/40 border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900/80 transition-all duration-200 cursor-pointer group rounded-xl"
                            >
                                <CardContent className="p-4 flex items-center justify-between gap-4">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-serif font-bold text-amber-300">
                                                {formatDate(entry.entry_date)}
                                            </span>
                                            {getMoodIcon(entry.mood_score)}
                                        </div>
                                        <p className="text-xs text-zinc-300 line-clamp-1 italic font-serif">
                                            {entry.content}
                                        </p>
                                    </div>
                                    <span className="text-xs text-amber-500/60 font-bold group-hover:text-amber-400 transition-colors">
                                        Edit ✎
                                    </span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40">
                        <BookOpen className="w-8 h-8 text-zinc-600 mb-2" />
                        <h4 className="text-sm font-bold text-zinc-300">No Journal Entries Yet</h4>
                        <p className="text-xs text-zinc-500 max-w-xs mt-1">Scribe your first private daily reflection to begin your Sovereign Chronicle.</p>
                        <Button onClick={handleCreate} className="mt-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl px-4 h-9">
                            Write First Entry
                        </Button>
                    </div>
                )}
            </div>

            <JournalModal
                isOpen={isJournalOpen}
                onClose={() => {
                    setIsJournalOpen(false);
                    loadEntries();
                }}
                initialData={journalEntry}
            />
        </div>
    )
}
