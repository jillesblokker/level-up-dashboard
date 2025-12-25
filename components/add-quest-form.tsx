"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sword, Brain, Crown, Castle, Hammer, Heart, Sun, PersonStanding } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from '@/components/ui/use-toast'

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
    might: 'Might',
    knowledge: 'Knowledge',
    honor: 'Honor',
    castle: 'Castle',
    craft: 'Craft',
    vitality: 'Vitality',
    wellness: 'Wellness',
    exploration: 'Exploration',
};

const questCategories = ['might', 'knowledge', 'honor', 'castle', 'craft', 'vitality', 'wellness', 'exploration'];

interface AddQuestFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function AddQuestForm({ onSuccess, onCancel }: AddQuestFormProps) {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [newQuest, setNewQuest] = useState({
        name: '',
        description: '',
        category: 'might',
        difficulty: 'easy'
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
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
                throw new Error(errorData.error || 'Failed to add quest')
            }

            toast({
                title: "Quest Added",
                description: "Your new quest is ready for adventure.",
                duration: 2000,
            })
            onSuccess()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block mb-1 text-sm font-medium text-amber-200">Name</label>
                <input
                    className="w-full p-2 bg-black border border-amber-900/50 rounded focus:border-amber-500 outline-none"
                    value={newQuest.name}
                    onChange={e => setNewQuest({ ...newQuest, name: e.target.value })}
                    placeholder="e.g., Morning Meditation"
                    required
                />
            </div>

            <div>
                <label className="block mb-1 text-sm font-medium text-amber-200">Description</label>
                <textarea
                    className="w-full p-2 bg-black border border-amber-900/50 rounded focus:border-amber-500 outline-none min-h-[100px]"
                    value={newQuest.description}
                    onChange={e => setNewQuest({ ...newQuest, description: e.target.value })}
                    placeholder="What do you want to achieve?"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1 text-sm font-medium text-amber-200">Category</label>
                    <Select
                        value={newQuest.category}
                        onValueChange={(val) => setNewQuest({ ...newQuest, category: val })}
                    >
                        <SelectTrigger className="bg-black border-amber-900/50">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {questCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    <div className="flex items-center gap-2">
                                        {React.createElement(categoryIcons[cat as keyof typeof categoryIcons], { className: "w-4 h-4" })}
                                        {categoryLabels[cat as keyof typeof categoryLabels]}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium text-amber-200">Difficulty</label>
                    <Select
                        value={newQuest.difficulty}
                        onValueChange={(val) => setNewQuest({ ...newQuest, difficulty: val })}
                    >
                        <SelectTrigger className="bg-black border-amber-900/50">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                            <SelectItem value="epic">Epic</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-amber-900/20">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={loading || !newQuest.name}
                >
                    {loading ? 'Adding...' : 'Add Quest'}
                </Button>
            </div>
        </form>
    )
}
