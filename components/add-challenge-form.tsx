"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sword, Zap, Flame, Trophy, Info, Dumbbell, History } from 'lucide-react'
import { TEXT_CONTENT } from '@/lib/text-content'
import { useAuth } from '@clerk/nextjs'
import { toast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AddChallengeFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: any;
}

export function AddChallengeForm({ onSuccess, onCancel, initialData }: AddChallengeFormProps) {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [newChallenge, setNewChallenge] = useState({
        name: initialData?.name || '',
        instructions: initialData?.instructions || '',
        setsReps: initialData?.setsReps || '',
        tips: initialData?.tips || '',
        weight: initialData?.weight || '',
        category: initialData?.category || 'might',
        mandatePeriod: initialData?.mandate_period || 'daily',
        mandateCount: initialData?.mandate_count || 1,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newChallenge.name.trim()) return

        setLoading(true)
        setError(null)

        try {
            const token = await getToken({ template: 'supabase' })
            const response = await fetch('/api/challenges', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newChallenge,
                    mandate_period: newChallenge.mandatePeriod,
                    mandate_count: newChallenge.mandateCount
                })
            })

            if (!response.ok) {
                throw new Error('Failed to add custom challenge')
            }

            toast({
                title: "Challenge Accepted",
                description: `${newChallenge.name} has been added to your trials.`,
                duration: 3000,
            })

            onSuccess()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 py-2">
            {error && (
                <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-lg text-red-200 text-sm animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">⚠️ Error:</span>
                        {error}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Trial Title</Label>
                <Input
                    className="bg-zinc-900/60 border-white/5 focus:border-red-500/50 h-12 rounded-xl px-4 text-zinc-200 placeholder:text-zinc-600 transition-all font-serif italic text-lg shadow-inner"
                    value={newChallenge.name}
                    onChange={e => setNewChallenge({ ...newChallenge, name: e.target.value })}
                    placeholder="e.g., The Titan's Grip (Heavy Deadlifts)..."
                    required
                    autoFocus
                />
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">The Ritual (Instructions)</Label>
                <Textarea
                    className="bg-zinc-900/60 border-white/5 focus:border-red-500/30 min-h-[100px] rounded-xl p-4 text-zinc-300 placeholder:text-zinc-700 resize-none font-serif italic"
                    value={newChallenge.instructions}
                    onChange={e => setNewChallenge({ ...newChallenge, instructions: e.target.value })}
                    placeholder="Enumerate the steps of this trial..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-1.5">
                        <History className="w-3 h-3" /> Repetitions
                    </Label>
                    <Input
                        className="bg-zinc-900/60 border-white/5 focus:border-red-500/50 h-12 rounded-xl px-4 text-zinc-200"
                        value={newChallenge.setsReps}
                        onChange={e => setNewChallenge({ ...newChallenge, setsReps: e.target.value })}
                        placeholder="e.g. 5x10"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-1.5">
                        <Dumbbell className="w-3 h-3" /> Burden (Weight)
                    </Label>
                    <Input
                        className="bg-zinc-900/60 border-white/5 focus:border-red-500/50 h-12 rounded-xl px-4 text-zinc-200"
                        value={newChallenge.weight}
                        onChange={e => setNewChallenge({ ...newChallenge, weight: e.target.value })}
                        placeholder="e.g. 100kg"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-1.5">
                    <Info className="w-3 h-3" /> Sage Advice (Tips)
                </Label>
                <Input
                    className="bg-zinc-900/60 border-white/5 focus:border-red-500/50 h-12 rounded-xl px-4 text-zinc-200"
                    value={newChallenge.tips}
                    onChange={e => setNewChallenge({ ...newChallenge, tips: e.target.value })}
                    placeholder="Knowledge to survive the trial..."
                />
            </div>

            {/* Strategic Mandate Section */}
            <div className="space-y-4 p-5 bg-red-950/10 border-2 border-red-900/20 rounded-2xl">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-bold uppercase tracking-wider text-red-500/80 font-serif">{TEXT_CONTENT.quests.mastery.form.sectionTitle}</label>
                    <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-tighter">Trials System</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">{TEXT_CONTENT.quests.mastery.form.periodLabel}</label>
                        <Select
                            value={newChallenge.mandatePeriod}
                            onValueChange={(val) => setNewChallenge({ ...newChallenge, mandatePeriod: val as any })}
                        >
                            <SelectTrigger className="h-12 bg-zinc-900/40 border-red-900/30 rounded-xl transition-all hover:border-red-500/30 text-zinc-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent side="top" className="bg-zinc-900 border-red-900/50">
                                <SelectItem value="daily">{TEXT_CONTENT.quests.mastery.form.periods.daily}</SelectItem>
                                <SelectItem value="weekly">{TEXT_CONTENT.quests.mastery.form.periods.weekly}</SelectItem>
                                <SelectItem value="monthly">{TEXT_CONTENT.quests.mastery.form.periods.monthly}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">{TEXT_CONTENT.quests.mastery.form.countLabel}</label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min="1"
                                max={newChallenge.mandatePeriod === 'weekly' ? 7 : 31}
                                className="h-12 w-full bg-zinc-900/40 border-red-900/30 rounded-xl px-4 focus:border-red-500/50 text-zinc-200 outline-none transition-all"
                                value={newChallenge.mandateCount}
                                onChange={(e) => setNewChallenge({ ...newChallenge, mandateCount: parseInt(e.target.value) || 1 })}
                            />
                            <div className="text-[10px] font-bold text-zinc-600 uppercase">Times</div>
                        </div>
                    </div>
                </div>

                <p className="text-[10px] text-zinc-500 italic px-1 font-serif">
                    {newChallenge.mandatePeriod === 'daily'
                        ? "A trial to be faced every sun-cycle without fail."
                        : `A ritual to be performed ${newChallenge.mandateCount} times throughout the ${newChallenge.mandatePeriod === 'weekly' ? 'week' : 'month'}.`}
                </p>
            </div>

            <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-2xl flex items-center gap-4">
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-red-500/30">
                    <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                </div>
                <div>
                    <div className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest">Reward Potential</div>
                    <div className="text-lg font-serif italic text-white flex items-center gap-2">
                        +50 XP <Sword className="w-4 h-4 text-red-400" />
                    </div>
                </div>
            </div>

            <div className="flex flex-row gap-3 pt-4 border-t border-white/5">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 h-12 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
                >
                    Abandon
                </Button>
                <Button
                    type="submit"
                    disabled={loading || !newChallenge.name.trim()}
                    className="flex-[2] h-12 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg border-t border-white/20"
                >
                    {loading ? "Forging..." : "Add Challenge"}
                </Button>
            </div>
        </form >
    )
}
