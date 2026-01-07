"use client"
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CloudRain, Cloud, CloudSun, Sun, Sparkles } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { updateCharacterStats } from '@/lib/character-stats-service'

interface JournalModalProps {
    isOpen: boolean
    onClose: () => void
}

export function JournalModal({ isOpen, onClose }: JournalModalProps) {
    const [content, setContent] = useState('')
    const [mood, setMood] = useState<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const supabase = createClientComponentClient()

    const handleSave = async () => {
        if (!mood) {
            toast.error("Please select a mood for the day.")
            return
        }
        setIsSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase.from('chronicle_entries').insert({
                user_id: user.id,
                entry_date: new Date().toISOString().split('T')[0],
                content,
                mood_score: mood
            })

            if (error) {
                if (error.code === '23505') { // Unique violation
                    toast.error("You have already journaled today!")
                    onClose()
                    return
                }
                throw error
            }

            updateCharacterStats({ experience: 50 }, 'journal_entry')
            toast.success("Journal saved! +50 XP")
            onClose()
        } catch (e) {
            console.error(e)
            toast.error("Failed to save journal.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const moods = [
        { score: 1, icon: CloudRain, label: "Stormy" },
        { score: 2, icon: Cloud, label: "Cloudy" },
        { score: 3, icon: CloudSun, label: "Mixed" },
        { score: 4, icon: Sun, label: "Sunny" },
        { score: 5, icon: Sparkles, label: "Radiant" },
    ]

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-amber-900/50 text-amber-50">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl text-amber-500">The Sun Sets...</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Take a moment to record your journey. What challenges did you face? What victories did you claim?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">How was your day?</label>
                        <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                            {moods.map((m) => {
                                const Icon = m.icon
                                const isSelected = mood === m.score
                                return (
                                    <button
                                        key={m.score}
                                        onClick={() => setMood(m.score)}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-md transition-all ${isSelected ? 'text-amber-400 bg-amber-900/20 scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        <Icon className="w-6 h-6" />
                                        <span className="text-[10px] uppercase tracking-wider">{m.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Chronicle Entry</label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Today I conquered..."
                            className="bg-zinc-900/50 border-zinc-800 focus:border-amber-700 min-h-[120px] resize-none text-zinc-200 placeholder:text-zinc-600"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-zinc-200">Skip</Button>
                    <Button onClick={handleSave} disabled={isSubmitting || !mood} className="bg-amber-700 hover:bg-amber-600 text-white">
                        {isSubmitting ? 'Inscribing...' : 'Save to Chronicle'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
