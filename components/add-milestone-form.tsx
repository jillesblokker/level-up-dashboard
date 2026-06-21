"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sword, Brain, Crown, Castle, Hammer, Heart, Sun, PersonStanding, Trophy, Target, Sparkles } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from '@/components/ui/use-toast'
import { TEXT_CONTENT } from '@/lib/text-content'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const categoryIcons = {
    might: Sword,
    knowledge: Brain,
    honor: Crown,
    castle: Castle,
    craft: Hammer,
    vitality: Heart,
    wellness: Sun,
    exploration: PersonStanding,
};

const categoryLabels = {
    might: "Might",
    knowledge: "Knowledge",
    honor: "Honor",
    castle: "Castle",
    craft: "Craft",
    vitality: "Vitality",
    wellness: "Wellness",
    exploration: "Exploration",
};

const questCategories = ['might', 'knowledge', 'honor', 'castle', 'craft', 'vitality', 'wellness', 'exploration'];

interface AddMilestoneFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: any;
    userId: string;
}

export function AddMilestoneForm({ onSuccess, onCancel, initialData, userId }: AddMilestoneFormProps) {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [newMilestone, setNewMilestone] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        category: initialData?.category || 'might',
        target: initialData?.target || 10,
        unit: initialData?.unit || 'times',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMilestone.name.trim()) return

        setLoading(true)
        setError(null)

        try {
            const token = await getToken({ template: 'supabase' })
            const response = await fetch('/api/milestones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newMilestone,
                    user_id: userId,
                    current_value: 0,
                    completed: false
                })
            })

            if (!response.ok) {
                throw new Error('Failed to add milestone')
            }

            toast({
                title: "Milestone Established",
                description: `${newMilestone.name} has been added to your journey.`,
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
                <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Milestone Title</Label>
                <Input
                    className="bg-zinc-900/60 border-white/5 focus:border-amber-500/50 h-12 rounded-xl px-4 text-zinc-200 placeholder:text-zinc-600 transition-all font-serif italic text-lg shadow-inner"
                    value={newMilestone.name}
                    onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })}
                    placeholder="e.g., Master of the Forge..."
                    required
                    autoFocus
                />
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Edict (Description)</Label>
                <Textarea
                    className="bg-zinc-900/60 border-white/5 focus:border-amber-500/30 min-h-[100px] rounded-xl p-4 text-zinc-300 placeholder:text-zinc-700 resize-none font-serif italic"
                    value={newMilestone.description}
                    onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    placeholder="Describe the historical significance of this milestone..."
                />
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Realm Category</Label>
                    <Select
                        value={newMilestone.category}
                        onValueChange={(val) => setNewMilestone({ ...newMilestone, category: val })}
                    >
                        <SelectTrigger className="h-12 bg-zinc-900/60 border-white/5 rounded-xl transition-all hover:border-amber-500/30 w-full text-zinc-200">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent side="top" className="bg-zinc-950 border-zinc-800 text-zinc-200">
                            {questCategories.map((cat) => (
                                <SelectItem key={cat} value={cat} className="focus:bg-amber-500/10 focus:text-amber-200">
                                    <div className="flex items-center gap-3 py-1">
                                        <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500">
                                            {React.createElement(categoryIcons[cat as keyof typeof categoryIcons], { className: "w-4 h-4" })}
                                        </div>
                                        <span className="font-medium">{categoryLabels[cat as keyof typeof categoryLabels]}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Target Value</Label>
                        <Input
                            type="number"
                            className="bg-zinc-900/60 border-white/5 focus:border-amber-500/50 h-12 rounded-xl px-4 text-zinc-200"
                            value={newMilestone.target}
                            onChange={e => setNewMilestone({ ...newMilestone, target: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Unit</Label>
                        <Input
                            className="bg-zinc-900/60 border-white/5 focus:border-amber-500/50 h-12 rounded-xl px-4 text-zinc-200"
                            value={newMilestone.unit}
                            onChange={e => setNewMilestone({ ...newMilestone, unit: e.target.value })}
                            placeholder="e.g., times, km"
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-amber-900/10 border border-amber-500/20 rounded-2xl flex items-center gap-4">
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-amber-500/30">
                    <Target className="w-5 h-5 text-amber-500 animate-pulse" />
                </div>
                <div>
                    <div className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">Ultimate Goal</div>
                    <div className="text-lg font-serif italic text-white">
                        Complete {newMilestone.target} {newMilestone.unit}
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
                    disabled={loading || !newMilestone.name.trim()}
                    className="flex-[2] h-12 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg border-t border-white/10"
                >
                    {loading ? "Establishing..." : "Add Milestone"}
                </Button>
            </div>
        </form>
    )
}
