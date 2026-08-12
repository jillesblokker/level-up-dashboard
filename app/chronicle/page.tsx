"use client"

import { logger } from "@/lib/logger";
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Frown, Meh, Smile, Laugh, PartyPopper, Feather, Calendar as CalendarIcon, BookOpen, PenTool } from 'lucide-react'
import Link from 'next/link'
import { JournalModal } from '@/components/chronicle/JournalModal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SeasonArchivalModal } from '@/components/chronicle/SeasonArchivalModal'
import { Badge } from '@/components/ui/badge'
import { Crown } from 'lucide-react'
import { WeeklyGrowthInsightsCard } from '@/components/chronicle/WeeklyGrowthInsightsCard'

export default function ChroniclePage() {
    const [entries, setEntries] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isJournalOpen, setIsJournalOpen] = useState(false)
    const [isArchivalOpen, setIsArchivalOpen] = useState(false)
    const [journalEntry, setJournalEntry] = useState<any | null>(null)
    const [filterDate, setFilterDate] = useState<string>('') // YYYY-MM format
    const supabase = (typeof window !== 'undefined' ? (require('@/lib/supabase/client').supabase) : null);

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
                // Sort by date desc
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

    const handleJournalSuccess = async () => {
        await loadEntries();
        setIsJournalOpen(false);
        setJournalEntry(null);
    };

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
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/profile">
                            <Button variant="ghost" size="icon" className="text-amber-500/50 hover:text-amber-400 hover:bg-amber-900/20 rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600">
                                Sovereign&apos;s Logbook
                            </h1>
                            <p className="text-amber-500/60 text-sm mt-1">Record your personal daily thoughts, mood, and reflections as you rebuild the realm.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIsArchivalOpen(true)}
                            variant="outline"
                            className="border-amber-500/40 text-amber-300 hover:bg-amber-950/40 font-bold rounded-xl px-4 h-12 flex items-center gap-2"
                        >
                            <Crown className="w-4 h-4 text-amber-400" />
                            Past Champions
                        </Button>
                        <Button
                            onClick={handleCreate}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl px-6 h-12 shadow-lg shadow-amber-900/20 border-t border-white/10 flex items-center gap-2"
                        >
                            <PenTool className="w-4 h-4" />
                            Scribe Entry
                        </Button>
                    </div>
                </div>

                <SeasonArchivalModal isOpen={isArchivalOpen} onClose={() => setIsArchivalOpen(false)} />

                <WeeklyGrowthInsightsCard />

                {/* Weekly Mood Trend Radar Card */}
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-950 to-purple-950/40 border border-amber-500/40 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300 font-serif">
                        <span className="flex items-center gap-1.5">
                            📊 Weekly Mood Trend Radar & AI Synthesis
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">Optimal Balance Active</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-zinc-900/90 border border-amber-500/30 text-center space-y-1">
                            <span className="text-xl">⚡</span>
                            <h4 className="font-bold text-xs text-amber-300">Energized (65%)</h4>
                            <p className="text-[10px] text-zinc-400">Peak physical & habit momentum</p>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-900/90 border border-blue-500/30 text-center space-y-1">
                            <span className="text-xl">🎯</span>
                            <h4 className="font-bold text-xs text-blue-300">Focused (25%)</h4>
                            <p className="text-[10px] text-zinc-400">Deep work & learning sessions</p>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-900/90 border border-emerald-500/30 text-center space-y-1">
                            <span className="text-xl">🌿</span>
                            <h4 className="font-bold text-xs text-emerald-300">Calm (10%)</h4>
                            <p className="text-[10px] text-zinc-400">Restful recovery & mindfulness</p>
                        </div>
                    </div>
                </div>

                {/* Dual Journal Segmented Tabs (Milestones & Season Champions vs Private Reflection Diary) */}
                <Tabs defaultValue="diary" className="w-full mb-6">
                    <TabsList className="grid grid-cols-2 bg-zinc-950 border border-amber-900/40 p-1 rounded-xl mb-6 shadow-inner">
                        <TabsTrigger value="diary" className="rounded-lg text-xs font-bold font-serif py-2.5">
                            📖 Private Reflection Diary
                        </TabsTrigger>
                        <TabsTrigger value="milestones" onClick={() => setIsArchivalOpen(true)} className="rounded-lg text-xs font-bold font-serif py-2.5">
                            🏆 Milestones & Season Champions
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Monthly Sovereign Recap Header Card */}
                <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-amber-950/20 to-zinc-950 border border-amber-500/30 text-amber-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl font-serif">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
                            <h3 className="font-medieval text-lg font-bold text-amber-300">Monthly Sovereign Growth Recap</h3>
                        </div>
                        <p className="text-xs text-zinc-300">
                            Synthesized snapshot of your completed habits, virtue hour balance, and reflection mood trends for this month.
                        </p>
                    </div>
                    <Badge className="bg-amber-600/30 border border-amber-400/50 text-amber-300 font-bold px-3 py-1 text-xs uppercase tracking-widest">
                        Paragon Champion Status: Active
                    </Badge>
                </div>

                {/* Filters & Mood Selectors Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-zinc-900 p-4 rounded-xl border border-amber-900/20">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Month</span>
                        <input
                            type="month"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="bg-black border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-amber-500 font-mono"
                        />
                        {filterDate && (
                            <Button variant="ghost" size="sm" onClick={() => setFilterDate('')} className="h-7 px-2 text-zinc-500 hover:text-zinc-300 text-xs">
                                Clear
                            </Button>
                        )}
                    </div>

                    {/* Mood Selector Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 shrink-0">Moods:</span>
                        {[
                            { label: '⚡ Energized', score: 5 },
                            { label: '🔥 Motivated', score: 4 },
                            { label: '🎯 Focused', score: 3 },
                            { label: '🧘 Calm', score: 2 },
                            { label: '🌿 Rested', score: 1 },
                        ].map((m) => (
                            <span key={m.score} className="px-2 py-1 bg-zinc-950 border border-amber-900/30 text-amber-300 rounded-lg text-[10px] font-mono shrink-0">
                                {m.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* List Content */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full bg-zinc-900 rounded-xl" />)}
                    </div>
                ) : filteredEntries.length > 0 ? (
                    <div className="space-y-4">
                        {filteredEntries.map(entry => (
                            <Card
                                key={entry.id}
                                onClick={() => handleEdit(entry)}
                                className="bg-zinc-900/30 border-amber-900/10 hover:border-amber-500/30 hover:bg-zinc-900 transition-all cursor-pointer group"
                            >
                                <CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:items-center">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-amber-500 font-serif font-bold text-lg">
                                                {formatDate(entry.entry_date)}
                                            </span>
                                            <div className="bg-zinc-950 p-1.5 rounded-lg border border-amber-900/10 flex items-center gap-1.5" title="Mood">
                                                {getMoodIcon(entry.mood_score)}
                                            </div>
                                        </div>
                                        <p className="text-zinc-400 font-serif italic line-clamp-2 md:line-clamp-1">
                                            {entry.content}
                                        </p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-amber-500/50 md:self-center self-end">
                                        <span className="text-xs uppercase tracking-widest font-bold">Review</span>
                                        <ArrowLeft className="w-4 h-4 rotate-180" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-950">
                        <div className="bg-zinc-900 p-4 rounded-full mb-4">
                            <BookOpen className="w-8 h-8 text-zinc-600" />
                        </div>
                        <h3 className="text-xl font-serif text-zinc-300 mb-2">No Entries Found</h3>
                        <p className="text-zinc-500 max-w-sm mb-6">
                            {filterDate ? `No chronicles found for this period.` : `Your legend has yet to be written.`}
                        </p>
                        <Button variant="outline" onClick={handleCreate} className="border-amber-900/30 text-amber-500 hover:bg-amber-950/20">
                            Start Writing
                        </Button>
                    </div>
                )}
            </div>

            <JournalModal
                isOpen={isJournalOpen}
                onClose={handleJournalSuccess}
                initialData={journalEntry}
            />
        </div>
    )
}
