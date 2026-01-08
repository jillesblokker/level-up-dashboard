"use client"
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Frown, Meh, Smile, Laugh, PartyPopper, Sparkles } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { updateCharacterStats } from '@/lib/character-stats-service'
import { cn } from '@/lib/utils'

interface JournalModalProps {
    isOpen: boolean
    onClose: () => void
    initialData?: {
        content: string
        mood_score: number
        entry_date: string
    } | null
}

export function JournalModal({ isOpen, onClose, initialData }: JournalModalProps) {
    // Reset state when initialData changes or modal opens
    // We use a useEffect or key-based reset in parent, but typical pattern is useEffect here
    // or key in parent. Let's use useEffect to sync initialData.

    const [content, setContent] = useState(initialData?.content || '')
    const [mood, setMood] = useState<number | null>(initialData?.mood_score || null)

    // Sync state when initialData changes (e.g. when opening modal with different entry)
    // Note: this runs on every render if not guarded, but React is smart. 
    // Better: Add a useEffect dependency.

    const [isSubmitting, setIsSubmitting] = useState(false)
    const supabase = createClientComponentClient()

    const { getToken } = useAuth()

    // Sync effect
    // Sync effect
    useEffect(() => {
        if (isOpen) {
            setContent(initialData?.content || '')
            setMood(initialData?.mood_score || null)
        }
    }, [isOpen, initialData])
    // Actually the above useState with initializer only runs once. 
    // We need useEffect.

    const handleSave = async () => {
        if (!mood) {
            toast.error("Please select a mood for the day.")
            return
        }
        setIsSubmitting(true)
        try {
            const token = await getToken({ template: 'supabase' })

            const response = await fetch('/api/chronicle/entries', {
                method: 'POST', // We will update API to handle upsert on POST or add PUT
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content,
                    mood_score: mood,
                    entry_date: initialData?.entry_date || new Date().toISOString().split('T')[0],
                    is_update: !!initialData // Signal to API (optional, or API handles conflict)
                })
            })

            if (!response.ok) {
                // If 409 and not updating, it's an error. If updating, it should work.
                // We'll fix API to upsert.
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save")
            }

            if (!initialData) {
                updateCharacterStats({ experience: 50 }, 'journal_entry')
                toast.success("Journal saved! +50 XP")
            } else {
                toast.success("Journal updated!")
            }
            onClose()
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Failed to save journal.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const moods = [
        { score: 1, icon: Frown, label: "Gloomy" },
        { score: 2, icon: Meh, label: "Quiet" },
        { score: 3, icon: Smile, label: "Good" },
        { score: 4, icon: Laugh, label: "Great" },
        { score: 5, icon: PartyPopper, label: "Radiant" },
    ]

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[90vh] bg-zinc-950 border-zinc-800 text-amber-50 p-0 overflow-hidden flex flex-col shadow-2xl">
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <DialogHeader className="text-center items-center pb-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold uppercase tracking-widest mb-4 text-amber-500 shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            Daily Reflection
                        </div>
                        <DialogTitle className="text-3xl font-serif text-white tracking-tight mb-2">
                            The Sun Sets...
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-sm max-w-[300px] text-center leading-relaxed italic">
                            &quot;The scrolls of time await your inscription. How did the stars align for you today?&quot;
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8 py-4">
                        {/* Mood Selector Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Current Aura</label>
                                {mood && (
                                    <span className="text-[10px] font-medium text-amber-500 uppercase tracking-tight px-2 py-0.5 rounded-full bg-amber-900/30 border border-amber-500/20">
                                        {moods.find(m => m.score === mood)?.label}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-5 gap-2 bg-zinc-900/40 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
                                {moods.map((m) => {
                                    const Icon = m.icon
                                    const isSelected = mood === m.score
                                    return (
                                        <button
                                            key={m.score}
                                            onClick={() => setMood(m.score)}
                                            className={cn(
                                                "relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 group",
                                                isSelected
                                                    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
                                            )}
                                        >
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-amber-400/10 blur-xl rounded-full animate-pulse" />
                                            )}
                                            <Icon className={cn(
                                                "w-7 h-7 transition-transform duration-500 group-hover:scale-110",
                                                isSelected ? "drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" : ""
                                            )} />
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Chronicle Entry Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">The Chronicle</label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const prompts = [
                                            "What made you smile today?",
                                            "What was your biggest challenge, and how did you face it?",
                                            "What are you grateful for in this moment?",
                                            "What did you learn about yourself today?",
                                            "If you could relive one moment from today, what would it be?",
                                            "How did you move closer to your goals today?",
                                            "What was the most peaceful moment of your day?"
                                        ];
                                        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
                                        setContent(prev => prev ? `${prev}\n\nPrompt: ${randomPrompt}` : `Prompt: ${randomPrompt}\n\n`);
                                    }}
                                    className="h-7 text-[10px] uppercase tracking-widest text-amber-500/60 hover:text-amber-400 hover:bg-amber-950/40 rounded-full px-3 border border-amber-500/10"
                                >
                                    <Sparkles className="w-3 h-3 mr-1.5" />
                                    Inspiration
                                </Button>
                            </div>
                            <div className="relative group/textarea">
                                <div className="absolute -inset-[1px] bg-gradient-to-b from-amber-500/20 to-transparent rounded-2xl opacity-0 group-hover/textarea:opacity-100 transition-opacity" />
                                <Textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Speak your truth into the annals of history..."
                                    className="relative bg-zinc-900/60 border-white/5 focus:border-amber-500/50 min-h-[160px] max-h-[250px] rounded-2xl p-4 text-zinc-200 placeholder:text-zinc-600 focus:ring-0 transition-all font-serif italic text-lg leading-relaxed shadow-inner"
                                />
                                {/* Bottom scroll decorative flair */}
                                <div className="absolute bottom-2 right-2 opacity-20 group-hover/textarea:opacity-40 transition-opacity">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-zinc-950 border-t border-white/5 flex flex-row gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
                    >
                        Skip for Now
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSubmitting || !mood}
                        className="flex-[2] h-12 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 border-t border-white/10 active:scale-[0.98] transition-all"
                    >
                        {isSubmitting ? 'Inscribing...' : 'Inscribe Chronicle'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
