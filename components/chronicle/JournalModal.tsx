"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Frown, Meh, Smile, Laugh, PartyPopper, BookOpen, Feather } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { updateCharacterStats } from '@/lib/character-stats-service'
import { cn } from '@/lib/utils'
import { BookmarkTab } from '@/components/ui/bookmark-tab'
import { GildedCornerBrackets } from '@/components/ui/gilded-corner-brackets'

interface JournalModalProps {
    isOpen: boolean
    onClose: () => void
    initialData?: {
        content: string
        mood_score: number
        entry_date: string
    } | null
}

export const CHRONICLE_INSPIRATION_PROMPTS: string[] = [
    "What made you smile today?",
    "What was your biggest challenge, and how did you face it?",
    "What are you grateful for in this exact moment?",
    "What did you learn about yourself or your habits today?",
    "If you could relive one moment from today, what would it be?",
    "How did you move closer to your long-term vision today?",
    "What was the most peaceful moment of your day?",
    "Who showed you kindness today, or whom did you support?",
    "What friction did you overcome that you used to avoid?",
    "What gave you genuine energy today, and what drained it?",
    "What is one small victory that someone else might overlook?",
    "How did you nourish your body and mind today?",
    "What thought or mindset served you well through today's tasks?",
    "If today was a chapter in your book of life, what would the title be?",
    "What habit felt easiest to complete today, and why?",
    "What is one thing you did today that your future self will thank you for?",
    "Where did you notice beauty or quiet wonder in your surroundings?",
    "How did you handle an unexpected detour or interruption today?",
    "What does progress feel like to you right now?",
    "What is one boundary or promise to yourself that you honored today?",
    "What made you laugh or brought lightness to your routine?",
    "What is something you let go of today that wasn't serving you?",
    "What is one skill or virtue you exercised today?",
    "How did you find balance between doing and simply being?",
    "What advice would your wiser self give you about today?",
    "What music, conversation, or book inspired you today?",
    "What are you proud of having started, even if unfinished?",
    "How did you practice patience or empathy with yourself or others?",
    "What is a simple comfort you enjoyed today?",
    "What intention do you want to carry into tomorrow morning?"
];

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
    const { getToken } = useAuth()

    useEffect(() => {
        if (isOpen) {
            setContent(initialData?.content || '')
            setMood(initialData?.mood_score || null)
        }
    }, [isOpen, initialData])

    const handleSave = async () => {
        if (!mood) {
            toast.error("Sage Owl tilts its head with a soft hoot: 'How is your spirit feeling today? Pick a mood icon.'")
            return
        }
        if (!content || !content.trim()) {
            toast.error("Sage Owl taps the parchment with a quill: 'Inscribe a few thoughts into your journal before recording.'")
            return
        }
        setIsSubmitting(true)
        const entryDate = initialData?.entry_date || new Date().toISOString().split('T')[0];
        const payload = {
            content: content.trim(),
            mood_score: mood,
            entry_date: entryDate,
            is_update: !!initialData
        };

        // Offline local backup so thoughts are never lost
        try {
            localStorage.setItem(`pref:journal-backup-${entryDate}`, JSON.stringify(payload));
        } catch {}

        try {
            const token = await getToken({ template: 'supabase' })

            const response = await fetch('/api/chronicle/entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to save to server")
            }

            if (!initialData) {
                updateCharacterStats({ experience: 50 }, 'journal_entry')
                toast.success("Sage Owl carefully files your reflection into the archive shelves (+50 xp).")
            } else {
                toast.success("Sage Owl updates your journal record!")
            }
            onClose()
        } catch (e: any) {
            logger.error(e)
            // Queue locally for retry
            try {
                const rawQueue = localStorage.getItem('pref:offline-journal-queue');
                const queue = rawQueue ? JSON.parse(rawQueue) : [];
                queue.push(payload);
                localStorage.setItem('pref:offline-journal-queue', JSON.stringify(queue));
                toast.success("Sage Owl saved your reflection to your local parchment. It will sync to the archive when reconnected.")
                onClose()
            } catch {
                toast.error(e.message || "Failed to save journal.")
            }
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
            <DialogContent className="sm:max-w-lg max-h-[92vh] bg-[#0d0a07] border-2 border-[#5c3e21] text-amber-50 p-0 overflow-hidden flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.98)] rounded-2xl relative">
                {/* Antique Gilded Corner Tome Brackets */}
                <GildedCornerBrackets size="md" inset="inset-1" />

                {/* Stitched leather inner border */}
                <div className="absolute inset-2 rounded-xl border border-dashed border-[#8c6d48]/30 pointer-events-none z-10" />

                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-purple-950/10" />
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <DialogHeader className="text-center items-center pb-4 px-4 sm:px-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold mb-4 text-amber-500 shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            Daily reflection
                        </div>
                        <DialogTitle className="text-3xl font-serif text-white tracking-tight mb-2 break-words">
                            The sun sets...
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-sm max-w-[300px] text-center leading-relaxed italic">
                            &quot;The scrolls of time await your inscription. How did the stars align for you today?&quot;
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8 py-4">
                        {/* Mood Selector Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-xs font-semibold text-zinc-400">Current aura</label>
                                {mood && (
                                    <span className="text-[10px] font-medium text-amber-500 capitalize px-2 py-0.5 rounded-full bg-amber-900/30 border border-amber-500/20">
                                        {moods.find(m => m.score === mood)?.label}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-5 gap-2 bg-[#120d08] p-2 rounded-2xl border border-[#3e2a18]/80 shadow-inner">
                                {moods.map((m) => {
                                    const Icon = m.icon
                                    const isSelected = mood === m.score
                                    return (
                                        <button
                                            key={m.score}
                                            onClick={() => {
                                                setMood(m.score)
                                                if (!content.trim()) {
                                                    const prompts: Record<number, string> = {
                                                        1: "What felt overwhelming today, and how can you reset tomorrow?",
                                                        2: "What was one small habit that kept you going through a slow day?",
                                                        3: "What habits went smoothly today? Reflect on your daily rhythm.",
                                                        4: "What made today feel productive and focused? Capture the momentum!",
                                                        5: "You smashed your goals today! What streak or win are you proudest of?",
                                                    }
                                                    if (prompts[m.score]) {
                                                        setContent(prompts[m.score]!)
                                                    }
                                                }
                                            }}
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

                            {/* Quick Mood Tag Selectors */}
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block font-serif">
                                    ✨ 1-Tap Quick Mood Pill Shortcuts:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {['⚡ Energized', '🎯 Focused', '🌿 Calm', '🔥 Motivated', '🧘 Peaceful'].map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => setContent(prev => prev ? `${prev} [${tag}]` : `[${tag}] `)}
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 hover:border-amber-400 transition-all shadow-sm"
                                        >
                                            + {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Monthly Mood & Habit Balance Synthesis */}
                            <div className="p-3 bg-gradient-to-r from-amber-950/40 via-zinc-950 to-purple-950/40 rounded-xl border border-amber-500/30 space-y-1.5 text-xs mt-3">
                              <div className="flex items-center justify-between text-amber-300 font-bold">
                                <span>📊 Mood & Habit Synthesis</span>
                                <span className="text-[9px] font-mono text-emerald-400">Monthly Balance: Optimal</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-center">
                                <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                                  <span className="text-amber-400 block font-bold">45%</span>
                                  <span className="text-zinc-400">Energized</span>
                                </div>
                                <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                                  <span className="text-blue-400 block font-bold">35%</span>
                                  <span className="text-zinc-400">Focused</span>
                                </div>
                                <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                                  <span className="text-emerald-400 block font-bold">20%</span>
                                  <span className="text-zinc-400">Calm</span>
                                </div>
                              </div>
                            </div>
                        </div>

                        {/* Chronicle Entry Section with Illuminated Codex Framing & Bookmark Tab */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-serif font-bold text-amber-200/90 tracking-wide flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                                    Annals of reflection
                                </label>
                                <BookmarkTab
                                    icon={<Sparkles className="w-3 h-3 text-amber-300" />}
                                    label="Inspiration"
                                    variant="leather"
                                    onClick={() => {
                                        const randomPrompt = CHRONICLE_INSPIRATION_PROMPTS[Math.floor(Math.random() * CHRONICLE_INSPIRATION_PROMPTS.length)];
                                        setContent(prev => prev ? `${prev}\n\nPrompt: ${randomPrompt}` : `Prompt: ${randomPrompt}\n\n`);
                                    }}
                                    title="Draw random reflection prompt"
                                />
                            </div>

                            {/* Illuminated Manuscript Textarea Container */}
                            <div className="relative rounded-2xl bg-gradient-to-b from-[#140e08] via-[#1c130b] to-[#120c07] border-2 border-[#5c3e21]/80 p-4 sm:p-5 shadow-[inset_0_3px_10px_rgba(0,0,0,0.9)] group/textarea">
                                <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#3d2714]/80">
                                    <span className="text-[11px] font-serif font-bold text-amber-200/90 tracking-wide flex items-center gap-1.5">
                                        <Feather className="w-3.5 h-3.5 text-amber-400" />
                                        Manuscript parchment
                                    </span>
                                    <span className="text-[10px] font-mono text-zinc-500">
                                        {initialData?.entry_date || new Date().toISOString().split('T')[0]}
                                    </span>
                                </div>
                                <Textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Inscribe your journey into the annals of Thrivehaven..."
                                    className="relative bg-transparent border-0 focus:ring-0 p-0 text-amber-100 placeholder:text-zinc-600 font-serif italic text-base sm:text-lg leading-relaxed shadow-none resize-none min-h-[160px] max-h-[250px]"
                                />
                                {/* Bottom scroll decorative flair */}
                                <div className="absolute bottom-2.5 right-2.5 opacity-25 group-hover/textarea:opacity-60 transition-opacity pointer-events-none">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-[#0d0a07] border-t border-[#3e2a18] flex flex-row gap-3 relative z-10">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 h-12 rounded-xl text-zinc-400 hover:text-amber-200 hover:bg-[#1a120b] border border-transparent hover:border-[#5c3e21]/50 font-serif"
                    >
                        Skip for now
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="flex-[2] h-12 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-serif font-bold rounded-xl shadow-lg shadow-amber-950/40 border-t border-amber-300/40 active:scale-[0.98] transition-all"
                    >
                        {isSubmitting ? 'Inscribing...' : 'Inscribe chronicle'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
