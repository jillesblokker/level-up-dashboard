"use client"
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, CloudRain, Cloud, CloudSun, Sun, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ChroniclePage() {
    const [entries, setEntries] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClientComponentClient()

    useEffect(() => {
        async function loadEntries() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('chronicle_entries')
                .select('*')
                .eq('user_id', user.id)
                .order('entry_date', { ascending: false })

            if (data) setEntries(data)
            setIsLoading(false)
        }
        loadEntries()
    }, [])

    const getMoodIcon = (score: number) => {
        switch (score) {
            case 1: return <CloudRain className="w-5 h-5 text-zinc-500" />
            case 2: return <Cloud className="w-5 h-5 text-zinc-400" />
            case 3: return <CloudSun className="w-5 h-5 text-amber-200" />
            case 4: return <Sun className="w-5 h-5 text-amber-400" />
            case 5: return <Sparkles className="w-5 h-5 text-amber-500" />
            default: return null
        }
    }

    return (
        <div className="min-h-screen bg-black text-amber-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/profile">
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-serif font-bold text-amber-500">My Chronicle</h1>
                </div>

                {isLoading ? (
                    <div>Loading history...</div>
                ) : entries.length === 0 ? (
                    <div className="text-center text-zinc-500 py-12 border border-dashed border-zinc-800 rounded-lg">
                        No entries yet. Your story begins today.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {entries.map((entry) => (
                            <Card key={entry.id} className="bg-zinc-900/50 border-amber-900/30">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-zinc-400 text-sm">{entry.entry_date}</span>
                                        {getMoodIcon(entry.mood_score)}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-zinc-200 whitespace-pre-wrap font-serif leading-relaxed">
                                        {entry.content}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
