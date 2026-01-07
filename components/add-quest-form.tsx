"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sword, Brain, Crown, Castle, Hammer, Heart, Sun, PersonStanding, Star, Zap, Flame, Trophy } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from '@/components/ui/use-toast'
import { TEXT_CONTENT } from '@/lib/text-content'

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
    might: TEXT_CONTENT.quests.categories.might,
    knowledge: TEXT_CONTENT.quests.categories.knowledge,
    honor: TEXT_CONTENT.quests.categories.honor,
    castle: TEXT_CONTENT.quests.categories.castle,
    craft: TEXT_CONTENT.quests.categories.craft,
    vitality: TEXT_CONTENT.quests.categories.vitality,
    wellness: TEXT_CONTENT.quests.categories.wellness,
    exploration: TEXT_CONTENT.quests.categories.exploration,
};

const questCategories = ['might', 'knowledge', 'honor', 'castle', 'craft', 'vitality', 'wellness', 'exploration'];

interface AddQuestFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: any;
}

export function AddQuestForm({ onSuccess, onCancel, initialData }: AddQuestFormProps) {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [newQuest, setNewQuest] = useState({
        name: '',
        description: '',
        category: 'might',
        difficulty: 'medium'
    })

    // Init with data if provided
    React.useEffect(() => {
        if (initialData) {
            setNewQuest({
                name: initialData.name || '',
                description: initialData.description || '',
                category: initialData.category || 'might',
                difficulty: initialData.difficulty || 'medium'
            })
        }
    }, [initialData])

    const difficultySettings = {
        easy: { label: TEXT_CONTENT.quests.difficulties.easy, color: 'text-green-400', gold: 10, xp: 20, icon: <Star className="w-4 h-4" /> },
        medium: { label: TEXT_CONTENT.quests.difficulties.medium, color: 'text-blue-400', gold: 25, xp: 50, icon: <Zap className="w-4 h-4" /> },
        hard: { label: TEXT_CONTENT.quests.difficulties.hard, color: 'text-orange-400', gold: 60, xp: 120, icon: <Flame className="w-4 h-4" /> },
        epic: { label: TEXT_CONTENT.quests.difficulties.epic, color: 'text-purple-400', gold: 150, xp: 300, icon: <Trophy className="w-4 h-4" /> },
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newQuest.name.trim()) return

        setLoading(true)
        setError(null)

        try {
            const token = await getToken({ template: 'supabase' })
            const response = await fetch('/api/quests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newQuest,
                    is_active: true
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || TEXT_CONTENT.quests.toast.errorAdd)
            }

            toast({
                title: TEXT_CONTENT.quests.toast.successTitle,
                description: TEXT_CONTENT.quests.toast.successDesc.replace('{name}', newQuest.name),
                duration: 3000,
            })

            // Dispatch event for other components to refresh
            window.dispatchEvent(new CustomEvent('quest-added'))

            onSuccess()
        } catch (err) {
            setError(err instanceof Error ? err.message : TEXT_CONTENT.quests.toast.errorGeneric)
        } finally {
            setLoading(false)
        }
    }

    const handleQuestNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const lowerName = name.toLowerCase();
        let updates: Partial<typeof newQuest> = { name };

        // Smart Category Detection
        if (lowerName.match(/\b(run|gym|lift|workout|pushups|squats|train|exercise|sprint|jog)\b/)) updates.category = 'might';
        else if (lowerName.match(/\b(read|study|learn|research|book|course|listen)\b/)) updates.category = 'knowledge';
        else if (lowerName.match(/\b(meditate|sleep|drink|water|relax|breathe|stretch|yoga)\b/)) updates.category = 'vitality';
        else if (lowerName.match(/\b(code|debug|fix|build|create|design|draw|paint|write|craft)\b/)) updates.category = 'craft';
        else if (lowerName.match(/\b(call|email|meet|date|family|friend|talk|social)\b/)) updates.category = 'honor'; // Honor often relates to social bonds/reputation
        else if (lowerName.match(/\b(clean|tidy|chore|organize|house|ledger|money|budget)\b/)) updates.category = 'castle';
        else if (lowerName.match(/\b(walk|hike|explore|visit|travel|drive)\b/)) updates.category = 'exploration';
        else if (lowerName.match(/\b(morning|night|routine|habit|sun)\b/)) updates.category = 'wellness';

        // Smart Difficulty Detection
        if (lowerName.match(/\b(hard|epic|huge|boss|marathon|project)\b/)) updates.difficulty = 'epic';
        else if (lowerName.match(/\b(easy|quick|small|tiny|fast)\b/)) updates.difficulty = 'easy';

        setNewQuest(prev => ({ ...prev, ...updates }));
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
                <label className="text-sm font-bold uppercase tracking-wider text-amber-500/80 ml-1">{TEXT_CONTENT.quests.form.titleLabel}</label>
                <div className="group relative">
                    <input
                        className="w-full p-4 bg-gray-950/50 border-2 border-amber-900/30 rounded-xl focus:border-amber-500/50 focus:bg-gray-900/80 outline-none transition-all duration-300 text-lg placeholder:text-gray-600 shadow-inner"
                        value={newQuest.name}
                        onChange={handleQuestNameChange}
                        placeholder={TEXT_CONTENT.quests.form.titlePlaceholder}
                        required
                        autoFocus
                    />
                    <div className="absolute inset-0 rounded-xl bg-amber-500/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-300" />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-amber-500/80 ml-1">{TEXT_CONTENT.quests.form.descriptionLabel}</label>
                <textarea
                    className="w-full p-4 bg-gray-950/50 border-2 border-amber-900/10 rounded-xl focus:border-amber-500/30 focus:bg-gray-900/80 outline-none transition-all duration-300 min-h-[120px] resize-none text-gray-200 placeholder:text-gray-700"
                    value={newQuest.description}
                    onChange={e => setNewQuest({ ...newQuest, description: e.target.value })}
                    placeholder={TEXT_CONTENT.quests.form.descriptionPlaceholder}
                />
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-amber-500/80 ml-1">{TEXT_CONTENT.quests.form.categoryLabel}</label>
                    <Select
                        value={newQuest.category}
                        onValueChange={(val) => setNewQuest({ ...newQuest, category: val })}
                    >
                        <SelectTrigger className="h-14 bg-gray-950/50 border-2 border-amber-900/20 rounded-xl transition-all hover:border-amber-500/30 w-full">
                            <div className="flex items-center gap-3">
                                {newQuest.category && categoryIcons[newQuest.category as keyof typeof categoryIcons] ? (
                                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                        {React.createElement(categoryIcons[newQuest.category as keyof typeof categoryIcons], { className: "w-4 h-4" })}
                                    </div>
                                ) : (
                                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                        <Sword className="w-4 h-4" />
                                    </div>
                                )}
                                <span className="font-medium">{categoryLabels[newQuest.category as keyof typeof categoryLabels]}</span>
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-amber-900/50">
                            {questCategories.map((cat) => (
                                <SelectItem key={cat} value={cat} className="focus:bg-amber-500/10 focus:text-amber-200">
                                    <div className="flex items-center gap-3 py-1">
                                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                            {React.createElement(categoryIcons[cat as keyof typeof categoryIcons], { className: "w-4 h-4" })}
                                        </div>
                                        <span className="font-medium">{categoryLabels[cat as keyof typeof categoryLabels]}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-amber-500/80 ml-1">{TEXT_CONTENT.quests.form.difficultyLabel}</label>
                    <Select
                        value={newQuest.difficulty}
                        onValueChange={(val) => setNewQuest({ ...newQuest, difficulty: val })}
                    >
                        <SelectTrigger className="h-14 bg-gray-950/50 border-2 border-amber-900/20 rounded-xl transition-all hover:border-amber-500/30 w-full">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 bg-gray-800 rounded-lg ${difficultySettings[newQuest.difficulty as keyof typeof difficultySettings].color}`}>
                                    {difficultySettings[newQuest.difficulty as keyof typeof difficultySettings].icon}
                                </div>
                                <div className="flex flex-col items-start translate-y-[1px]">
                                    <span className="font-bold text-sm leading-tight">{difficultySettings[newQuest.difficulty as keyof typeof difficultySettings].label}</span>
                                    <div className="text-[10px] text-gray-500 uppercase flex gap-2">
                                        <span>+{difficultySettings[newQuest.difficulty as keyof typeof difficultySettings].gold} Gold</span>
                                        <span>+{difficultySettings[newQuest.difficulty as keyof typeof difficultySettings].xp} XP</span>
                                    </div>
                                </div>
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-amber-900/50">
                            {Object.entries(difficultySettings).map(([key, value]) => (
                                <SelectItem key={key} value={key} className="focus:bg-amber-500/10 focus:text-amber-200">
                                    <div className="flex items-center gap-3 py-1">
                                        <div className={`p-2 bg-gray-800 rounded-lg ${value.color}`}>
                                            {value.icon}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-200">{value.label}</div>
                                            <div className="text-[10px] text-gray-500 uppercase flex gap-2">
                                                <span>+{value.gold} Gold</span>
                                                <span>+{value.xp} XP</span>
                                            </div>
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Reward Preview Card */}
            <div className="bg-gradient-to-br from-amber-900/20 to-gray-900/50 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl bg-gray-950/80 border border-amber-500/30 shadow-inner ${difficultySettings[newQuest.difficulty as keyof typeof difficultySettings].color}`}>
                        {difficultySettings[newQuest.difficulty as keyof typeof difficultySettings].icon}
                    </div>
                    <div>
                        <div className="text-xs font-bold text-amber-500/60 uppercase tracking-widest">{TEXT_CONTENT.quests.form.expectedReward}</div>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1">
                                <Sword className="w-4 h-4 text-amber-400" />
                                <span className="text-lg font-bold text-white">{difficultySettings[newQuest.difficulty as keyof typeof difficultySettings].xp} XP</span>
                            </div>
                            <div className="h-4 w-px bg-amber-500/20" />
                            <div className="flex items-center gap-1">
                                <Crown className="w-4 h-4 text-yellow-500" />
                                <span className="text-lg font-bold text-white">{difficultySettings[newQuest.difficulty as keyof typeof difficultySettings].gold} Gold</span>
                            </div>
                        </div>
                    </div>
                </div>
                {newQuest.name && (
                    <div className="hidden sm:block text-right opacity-40 italic text-sm pr-2">
                        {TEXT_CONTENT.quests.form.quote}
                    </div>
                )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-amber-900/30">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={loading}
                    className="h-12 px-8 text-gray-400 hover:text-white hover:bg-white/5"
                >
                    {TEXT_CONTENT.quests.form.abandon}
                </Button>
                <Button
                    type="submit"
                    disabled={loading || !newQuest.name.trim()}
                    className="h-12 px-10 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold text-lg shadow-xl shadow-amber-900/20 border-t border-white/20"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            {TEXT_CONTENT.quests.form.submitting}
                        </div>
                    ) : (
                        TEXT_CONTENT.quests.form.submit
                    )}
                </Button>
            </div>
        </form>
    )
}
