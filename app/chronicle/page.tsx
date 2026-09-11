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
import { TalesShelfCard } from '@/components/storybook/tales-shelf-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ReflectionsBookcase } from '@/components/chronicle/ReflectionsBookcase'
import { cn } from '@/lib/utils'
import { CollectibleRune } from '@/components/runes/collectible-rune'

export default function ChroniclePage() {
    const [entries, setEntries] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isJournalOpen, setIsJournalOpen] = useState(false)
    const [isArchivalOpen, setIsArchivalOpen] = useState(false)
    const [journalEntry, setJournalEntry] = useState<any | null>(null)
    const [filterDate, setFilterDate] = useState<string>('')
    const [showInsights, setShowInsights] = useState(false)
    const [viewMode, setViewMode] = useState<'bookcase' | 'list'>('bookcase')

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
            <div className="max-w-6xl mx-auto relative z-10 space-y-6">
                
                {/* BENTO HEADER: Header Bar with Clear Title & Direct Actions */}
                <div className="bg-[#0e1217]/90 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/kingdom">
                            <Button variant="ghost" size="icon" className="text-amber-500/60 hover:text-amber-400 hover:bg-amber-900/20 rounded-xl h-9 w-9 border border-white/10">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 flex items-center gap-2">
                                Tales of the realm
                                <CollectibleRune
                                    id="ansuz_chronicle"
                                    runeId="ansuz"
                                    symbol="ᚨ"
                                    name="Ansuz"
                                    meaning="Wisdom, contemplation, and ancestral voice"
                                />
                            </h1>
                            <p className="text-xs text-zinc-400">Interactive creature stories, habit lessons & reflection journal</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Badge variant="outline" className="text-xs font-mono text-amber-400 border-amber-500/30 bg-amber-950/40 px-3 py-1">
                            {entries.length} {entries.length === 1 ? 'reflection archived' : 'reflections archived'}
                        </Badge>
                        <Button
                            onClick={() => setIsArchivalOpen(true)}
                            variant="outline"
                            className="border-amber-500/30 text-amber-300 hover:bg-amber-950/40 text-xs font-bold rounded-xl px-3 h-9 flex items-center gap-1.5"
                        >
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            Past champions
                        </Button>
                        <Button
                            onClick={handleCreate}
                            className="btn-primary-cta text-xs px-4 h-9 flex items-center gap-1.5 shadow-md font-serif font-bold rounded-xl"
                        >
                            <PenTool className="w-3.5 h-3.5" />
                            Scribe reflection
                        </Button>
                    </div>
                </div>

                <SeasonArchivalModal isOpen={isArchivalOpen} onClose={() => setIsArchivalOpen(false)} />

                {/* ROW 1: Tales of the Realm (7 cols) + Growth Insights & Mood Radar (5 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Card 1: Tales Shelf */}
                    <div className="lg:col-span-7 flex flex-col">
                        <TalesShelfCard className="h-full flex flex-col justify-between" />
                    </div>

                    {/* Card 2: Growth Insights & Mood Radar */}
                    <div className="lg:col-span-5 bg-[#0e1217]/85 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                <div className="flex items-center gap-2 text-amber-400">
                                    <Sparkles className="w-5 h-5 text-amber-400" />
                                    <h2 className="text-base font-bold font-serif text-amber-200">
                                        Growth insights & mood radar
                                    </h2>
                                </div>
                                <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-950/40 font-mono">
                                    Optimal balance
                                </Badge>
                            </div>
                            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                                Review your reflection rhythm and emotional balance synthesized from your private reflections.
                            </p>

                            <WeeklyGrowthInsightsCard />

                            {/* 3 Mood distribution tiles */}
                            <div className="grid grid-cols-3 gap-2.5 pt-1">
                                <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-amber-500/20 text-center space-y-0.5">
                                    <span className="text-base">⚡</span>
                                    <h4 className="font-bold text-xs text-amber-300">Energized</h4>
                                    <p className="text-[10px] text-zinc-400 font-mono">65%</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-blue-500/20 text-center space-y-0.5">
                                    <span className="text-base">🎯</span>
                                    <h4 className="font-bold text-xs text-blue-300">Focused</h4>
                                    <p className="text-[10px] text-zinc-400 font-mono">25%</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-emerald-500/20 text-center space-y-0.5">
                                    <span className="text-base">🌿</span>
                                    <h4 className="font-bold text-xs text-emerald-300">Calm</h4>
                                    <p className="text-[10px] text-zinc-400 font-mono">10%</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={handleCreate}
                                className="w-full h-11 text-xs font-serif font-bold bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                            >
                                <PenTool className="w-3.5 h-3.5 text-amber-400" />
                                <span>Scribe today&apos;s reflection</span>
                            </Button>
                        </div>
                    </div>

                </div>

                {/* ROW 2: Royal Library & Reflection Archives (Full-width 12 cols) */}
                <div className="bg-[#0e1217]/85 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
                    
                    {/* Header Bar with View Switcher & Month Filter */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2 text-amber-400">
                            <BookOpen className="w-5 h-5 text-amber-400" />
                            <div>
                                <h2 className="text-base font-bold font-serif text-amber-200">Royal library archives</h2>
                                <p className="text-xs text-zinc-400">Private journal entries chronicling your real-world habit journey</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap">
                            {/* View Switcher buttons */}
                            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('bookcase')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                                        viewMode === 'bookcase'
                                            ? "bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-sm"
                                            : "text-zinc-400 hover:text-zinc-200"
                                    )}
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>Bookcase</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                                        viewMode === 'list'
                                            ? "bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-sm"
                                            : "text-zinc-400 hover:text-zinc-200"
                                    )}
                                >
                                    <Filter className="w-3.5 h-3.5" />
                                    <span>List</span>
                                </button>
                            </div>

                            {viewMode === 'list' && (
                                <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-xl border border-zinc-800 text-xs">
                                    <span className="text-zinc-400">Month:</span>
                                    <input
                                        type="month"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="bg-transparent border-0 text-xs text-amber-100 focus:outline-none font-mono"
                                    />
                                    {filterDate && (
                                        <button onClick={() => setFilterDate('')} className="text-zinc-400 hover:text-white text-xs ml-1">
                                            ✕
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reflections Content */}
                    {viewMode === 'bookcase' ? (
                        isLoading ? (
                            <div className="p-12 rounded-2xl border-4 border-[#3a2012] bg-[#0c0805] flex flex-col gap-4 items-center justify-center min-h-[320px]">
                                <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
                                <p className="text-xs font-serif text-amber-400/60">Opening the royal library shelves...</p>
                            </div>
                        ) : (
                            <ReflectionsBookcase
                                entries={entries}
                                onSelectEntry={handleEdit}
                                onCreateEntry={handleCreate}
                            />
                        )
                    ) : (
                        <div className="space-y-4">
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
                                                        {entry.mood_tag && (
                                                            <Badge className="bg-amber-950/80 border-amber-500/30 text-amber-300 text-[9px] font-mono">
                                                                {entry.mood_tag}
                                                            </Badge>
                                                        )}
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
                                <div className="py-6">
                                    <EmptyState
                                        title="No journal entries yet"
                                        description="Sage Owl dips a quill in golden ink: 'Scribe your first private reflection to begin chronicling your thoughts and nurturing your inner wisdom.'"
                                        creatureImage="/images/creatures/Sage_owl.webp"
                                        creatureName="Sage Owl"
                                        actionLabel="Scribe first reflection"
                                        onAction={handleCreate}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                </div>

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
