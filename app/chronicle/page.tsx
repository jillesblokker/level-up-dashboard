"use client"
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Frown, Meh, Smile, Laugh, PartyPopper, Feather, Calendar as CalendarIcon, BookOpen, PenTool } from 'lucide-react'
import Link from 'next/link'
import { JournalModal } from '@/components/chronicle/JournalModal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export default function ChroniclePage() {
    const [entries, setEntries] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isJournalOpen, setIsJournalOpen] = useState(false)
    const [journalEntry, setJournalEntry] = useState<any | null>(null)
    const [filterDate, setFilterDate] = useState<string>('') // YYYY-MM format
    const supabase = createClientComponentClient()

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
            console.error('Failed to load entries', error)
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

            <div className="max-w-4xl mx-auto relative z-10">
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
                                My Chronicle
                            </h1>
                            <p className="text-amber-500/60 text-sm mt-1">Reflections of a hero</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleCreate}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl px-6 h-12 shadow-lg shadow-amber-900/20 border-t border-white/10 flex items-center gap-2"
                    >
                        <PenTool className="w-4 h-4" />
                        Scribe Entry
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 mb-6 bg-zinc-900/50 p-3 rounded-xl border border-amber-900/10 w-fit">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Filter by Month</span>
                    <input
                        type="month"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-black border border-zinc-700 rounded-lg px-3 py-1 text-sm text-amber-100 focus:outline-none focus:border-amber-500"
                    />
                    {filterDate && (
                        <Button variant="ghost" size="sm" onClick={() => setFilterDate('')} className="h-7 px-2 text-zinc-500 hover:text-zinc-300">
                            Clear
                        </Button>
                    )}
                </div>

                {/* List Content */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full bg-zinc-900/50 rounded-xl" />)}
                    </div>
                ) : filteredEntries.length > 0 ? (
                    <div className="space-y-4">
                        {filteredEntries.map(entry => (
                            <Card
                                key={entry.id}
                                onClick={() => handleEdit(entry)}
                                className="bg-zinc-900/30 border-amber-900/10 hover:border-amber-500/30 hover:bg-zinc-900/50 transition-all cursor-pointer group"
                            >
                                <CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:items-center">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-amber-500 font-serif font-bold text-lg">
                                                {formatDate(entry.entry_date)}
                                            </span>
                                            <div className="bg-black/40 p-1.5 rounded-lg border border-amber-900/10 flex items-center gap-1.5" title="Mood">
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
                    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-3xl bg-black/20">
                        <div className="bg-zinc-900/50 p-4 rounded-full mb-4">
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
