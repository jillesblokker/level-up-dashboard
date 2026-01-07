"use client"
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, CloudRain, Cloud, CloudSun, Sun, Sparkles, Feather } from 'lucide-react'
import Link from 'next/link'
import { JournalModal } from '@/components/chronicle/JournalModal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function ChroniclePage() {
    const [entries, setEntries] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isJournalOpen, setIsJournalOpen] = useState(false)
    const supabase = createClientComponentClient()

    const loadEntries = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setIsLoading(false)
            return
        }

        const { data } = await supabase
            .from('chronicle_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('entry_date', { ascending: false })

        if (data) setEntries(data)
        setIsLoading(false)
    }

    useEffect(() => {
        loadEntries()
    }, [])

    const getMoodIcon = (score: number) => {
        switch (score) {
            case 1: return <CloudRain className="w-4 h-4 text-zinc-500" />
            case 2: return <Cloud className="w-4 h-4 text-zinc-400" />
            case 3: return <CloudSun className="w-4 h-4 text-amber-200" />
            case 4: return <Sun className="w-4 h-4 text-amber-400" />
            case 5: return <Sparkles className="w-4 h-4 text-amber-500" />
            default: return null
        }
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
    }

    return (
        <div className="min-h-screen bg-black text-amber-50 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none" />

            <div className="max-w-3xl mx-auto p-6 md:p-12 relative z-10">
                <div className="flex items-center gap-4 mb-10">
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

                {isLoading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4">
                                <div className="flex flex-col items-center gap-2 pt-1">
                                    <Skeleton className="w-3 h-3 rounded-full bg-amber-900/30" />
                                    <Skeleton className="w-0.5 h-24 bg-amber-900/10" />
                                </div>
                                <div className="flex-1 space-y-3 pb-8">
                                    <Skeleton className="h-6 w-1/3 bg-amber-900/20 rounded" />
                                    <Skeleton className="h-24 w-full bg-amber-900/10 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                        <div className="bg-gradient-to-br from-amber-900/20 to-black p-6 rounded-full border border-amber-900/30 mb-6 shadow-[0_0_30px_rgba(180,83,9,0.1)]">
                            <Feather className="w-12 h-12 text-amber-500/80" />
                        </div>
                        <h3 className="text-xl font-serif text-amber-200 mb-2">The Pages are Empty</h3>
                        <div className="space-y-6">
                            <p className="text-amber-500/60 max-w-sm leading-relaxed px-4">
                                {new Date().getHours() >= 18
                                    ? "The sun has set. The parchment is ready for your story."
                                    : "Your legend awaits its first chapter. Return at sunset (18:00) to record your journey."}
                            </p>
                            {new Date().getHours() >= 18 && (
                                <Button
                                    onClick={() => setIsJournalOpen(true)}
                                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-amber-900/20 border-t border-white/10"
                                >
                                    Write Today&apos;s Chronicle
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-0">
                        {entries.map((entry, idx) => (
                            <div key={entry.id} className="flex gap-6 relative group">
                                {/* Timeline Line */}
                                <div className="flex flex-col items-center pt-1.5">
                                    <div className={`w-3 h-3 shrink-0 rounded-full border-2 ${idx === 0 ? 'border-amber-400 bg-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'border-amber-900/50 bg-black'}`} />
                                    {idx !== entries.length - 1 && <div className="w-0.5 flex-1 bg-gradient-to-b from-amber-900/30 to-amber-900/10 my-2" />}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pb-12">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-serif text-amber-500/90 text-sm tracking-wide">
                                            {formatDate(entry.entry_date)}
                                        </span>
                                        <div className="bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-900/30 flex items-center gap-1.5" title="Mood">
                                            {getMoodIcon(entry.mood_score)}
                                        </div>
                                    </div>

                                    <Card className="bg-zinc-900/40 border-amber-900/20 backdrop-blur-sm group-hover:bg-zinc-900/60 transition-colors duration-300">
                                        <CardContent className="p-5 pt-5">
                                            <p className="text-zinc-300 font-serif leading-relaxed whitespace-pre-wrap">
                                                {entry.content}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <JournalModal
                isOpen={isJournalOpen}
                onClose={() => {
                    setIsJournalOpen(false);
                    loadEntries();
                }}
            />
        </div>
    )
}
