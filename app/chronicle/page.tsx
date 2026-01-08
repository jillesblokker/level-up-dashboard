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
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [viewEntry, setViewEntry] = useState<any | null>(null)
    const supabase = createClientComponentClient()

    const { getToken } = useAuth()

    const loadEntries = async () => {
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
                setEntries(data)
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

    // Toast Logic: Prompt at 18:00 if no entry for today
    useEffect(() => {
        if (isLoading || entries.length === 0) return

        const todayStr = new Date().toISOString().split('T')[0]
        const hasTodayEntry = entries.some(e => e.entry_date === todayStr)
        const hour = new Date().getHours()

        if (hour >= 18 && !hasTodayEntry) {
            // Check if we already showed it this session/day to avoid spam?
            // For simplicity, we trigger it once on mount if conditions met.
            const hasShown = sessionStorage.getItem('chronicle_toast_shown')
            if (!hasShown) {
                toast("The stars are watching...", {
                    description: "It is time to record your deeds in the Chronicle.",
                    action: {
                        label: "Write",
                        onClick: () => setIsJournalOpen(true)
                    }
                })
                sessionStorage.setItem('chronicle_toast_shown', 'true')
            }
        }
    }, [isLoading, entries])

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
        return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
    }

    // Identify days with entries for Calendar modifiers
    const daysWithEntries = entries.map(e => new Date(e.entry_date))

    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date)
        if (date) {
            const dateStr = date.toISOString().split('T')[0]
            const entry = entries.find(e => e.entry_date === dateStr)
            if (entry) {
                setViewEntry(entry)
            } else {
                setViewEntry(null)
            }
        }
    }

    return (
        <div className="min-h-screen bg-black text-amber-50 relative overflow-hidden font-sans">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none" />

            <div className="max-w-4xl mx-auto p-4 md:p-8 relative z-10">
                <div className="flex items-center gap-4 mb-8">
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

                <Tabs defaultValue="scribe" className="space-y-6">
                    <TabsList className="bg-zinc-900/50 border border-amber-900/20 p-1 rounded-full grid grid-cols-2 w-[240px]">
                        <TabsTrigger value="scribe" className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-zinc-400">
                            <PenTool className="w-4 h-4 mr-2" />
                            Scribe
                        </TabsTrigger>
                        <TabsTrigger value="archives" className="rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-zinc-400">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Archives
                        </TabsTrigger>
                    </TabsList>

                    {/* SCRIBE TAB - WRITE MODE */}
                    <TabsContent value="scribe" className="animate-in fade-in slide-in-from-left-4 duration-500">
                        {isLoading ? (
                            <div className="space-y-6">
                                <Skeleton className="h-40 w-full bg-amber-900/10 rounded-xl" />
                                <Skeleton className="h-12 w-48 bg-amber-900/10 rounded-xl" />
                            </div>
                        ) : entries.some(e => e.entry_date === new Date().toISOString().split('T')[0]) ? (
                            // ALREADY CHRONICLED TODAY
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="bg-gradient-to-br from-amber-500/20 to-amber-900/20 p-6 rounded-full border border-amber-500/30 mb-6 shadow-[0_0_30px_rgba(180,83,9,0.2)]">
                                    <Feather className="w-12 h-12 text-amber-400" />
                                </div>
                                <h3 className="text-2xl font-serif text-amber-200 mb-2">Ink Drying on Parchment</h3>
                                <p className="text-amber-500/60 max-w-sm leading-relaxed mb-8">
                                    You have already recorded your deeds for today. Rest well, hero.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => document.getElementById('archives-tab')?.click()} // Simple hack or just use state 
                                    className="border-amber-500/30 text-amber-400 hover:bg-amber-950"
                                >
                                    Review Your Entry
                                </Button>
                            </div>
                        ) : (
                            // EMPTY STATE - READY TO WRITE
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="bg-gradient-to-br from-amber-900/20 to-black p-6 rounded-full border border-amber-900/30 mb-6 shadow-[0_0_30px_rgba(180,83,9,0.1)] group hover:scale-105 transition-transform duration-500 cursor-pointer" onClick={() => setIsJournalOpen(true)}>
                                    <Feather className="w-12 h-12 text-amber-500/80 group-hover:text-amber-400" />
                                </div>
                                <h3 className="text-xl font-serif text-amber-200 mb-2">The Pages are Empty</h3>
                                <p className="text-amber-500/60 max-w-sm leading-relaxed px-4 mb-8">
                                    The chronicle is always open to those who seek to understand themselves. <br />
                                    <span className="text-amber-500/40 text-xs mt-2 block italic">
                                        (Reminder sent at 18:00 if incomplete)
                                    </span>
                                </p>
                                <Button
                                    onClick={() => setIsJournalOpen(true)}
                                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl px-8 h-14 text-lg shadow-lg shadow-amber-900/20 border-t border-white/10 animate-pulse hover:animate-none"
                                >
                                    Write Today&apos;s Chronicle
                                </Button>
                            </div>
                        )}

                        {/* Recent Entries Preview List (Optional, maybe keep simple?) */}
                        {entries.length > 0 && (
                            <div className="mt-12 pt-12 border-t border-amber-900/10">
                                <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Recent Inscriptions</h4>
                                <div className="space-y-4 opacity-60 hover:opacity-100 transition-opacity">
                                    {entries.slice(0, 3).map(entry => (
                                        <div key={entry.id} className="flex gap-4 items-center p-3 rounded-xl bg-zinc-900/30 border border-transparent hover:border-amber-900/30 hover:bg-zinc-900/60 transition-all cursor-default">
                                            <div className="bg-zinc-950 p-2 rounded-lg border border-amber-900/20">
                                                {getMoodIcon(entry.mood_score)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-amber-100 font-serif truncate">{entry.content}</p>
                                                <p className="text-xs text-zinc-500">{formatDate(entry.entry_date)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* ARCHIVES TAB - CALENDAR & READ MODE */}
                    <TabsContent value="archives" className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid md:grid-cols-[1fr_1.5fr] gap-8">
                            {/* Calendar Widget */}
                            <Card className="bg-black/40 border-amber-900/30 backdrop-blur-sm self-start">
                                <CardHeader>
                                    <CardTitle className="text-amber-200 font-serif text-lg flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4 text-amber-500" />
                                        Chronicle Calendar
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={handleDateSelect}
                                        className="p-3 pointer-events-auto"
                                        modifiers={{
                                            entries: daysWithEntries
                                        }}
                                        modifiersStyles={{
                                            entries: {
                                                fontWeight: 'bold',
                                                color: '#f59e0b', // amber-500
                                                textDecoration: 'underline decoration-amber-500/50'
                                            }
                                        }}
                                        classNames={{
                                            day_selected: "bg-amber-600 text-white hover:bg-amber-500 focus:bg-amber-600 rounded-md",
                                            day_today: "bg-zinc-800 text-amber-200 rounded-md",
                                        }}
                                    />
                                    <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500 justify-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Recorded Entry
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 ml-2" /> Empty
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Reading Pane */}
                            <div className="space-y-4">
                                {viewEntry ? (
                                    <Card className="bg-zinc-900/40 border-amber-900/30 h-full animate-in fade-in zoom-in-95 duration-300">
                                        <CardContent className="p-6 md:p-8">
                                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-amber-900/20">
                                                <div className="space-y-1">
                                                    <h3 className="text-xl md:text-2xl font-serif text-amber-100">{formatDate(viewEntry.entry_date)}</h3>
                                                    <p className="text-amber-500/50 text-xs uppercase tracking-widest">Entry Log</p>
                                                </div>
                                                <div className="flex flex-col items-center gap-1 bg-black/40 p-3 rounded-lg border border-amber-900/20">
                                                    {getMoodIcon(viewEntry.mood_score)}
                                                    <span className="text-[10px] text-zinc-500 uppercase">Mood</span>
                                                </div>
                                            </div>
                                            <div className="prose prose-invert prose-amber max-w-none">
                                                <p className="font-serif text-lg leading-relaxed text-zinc-300 italic whitespace-pre-wrap">
                                                    {viewEntry.content}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : selectedDate ? (
                                    <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-800 rounded-xl bg-black/20">
                                        <BookOpen className="w-10 h-10 text-zinc-700 mb-4" />
                                        <p className="text-zinc-500">No entry recorded for <span className="text-amber-500/70">{formatDate(selectedDate.toISOString())}</span>.</p>
                                        {selectedDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] && (
                                            <Button
                                                variant="link"
                                                onClick={() => setIsJournalOpen(true)}
                                                className="text-amber-500 hover:text-amber-400 mt-2"
                                            >
                                                Write Entry Now
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-black/20 rounded-xl">
                                        <p className="text-zinc-500">Select a date to read your chronicle.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <JournalModal
                isOpen={isJournalOpen}
                onClose={() => {
                    setIsJournalOpen(false);
                    loadEntries();
                    // If creating an entry for today, ensure state reflects it
                }}
            />
        </div>
    )
}
