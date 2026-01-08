"use client"

import React, { useEffect, useState } from 'react'
import { Sword, Brain, Crown, Castle, Hammer, Heart, Sun, PersonStanding, Flame, Trophy, Shield, Medal } from 'lucide-react'
import { TEXT_CONTENT } from '@/lib/text-content'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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

const categoryColors = {
    might: 'text-red-500 bg-red-500/10 border-red-500/30',
    knowledge: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    honor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    castle: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
    craft: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    vitality: 'text-pink-500 bg-pink-500/10 border-pink-500/30',
    wellness: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
    exploration: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
};

export function MasteryLedger() {
    const [habits, setHabits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<'week' | 'month'>('week')

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/mastery/history')
            const data = await res.json()
            if (data.habits) {
                // Sort by fulfillment (top performers first)
                const sorted = data.habits.sort((a: any, b: any) => b.stats.fulfillment - a.stats.fulfillment)
                setHabits(sorted)
            }
        } catch (err) {
            console.error('Failed to fetch mastery history:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHistory()
    }, [])

    const getLast7Days = () => {
        const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
        const result = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            result.push(days[d.getDay()])
        }
        return result
    }

    const last7DaysLabels = getLast7Days()

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-amber-500/60 font-serif italic">Consulting the Eternal Ledger...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-900/20 pb-6">
                <div>
                    <h2 className="text-2xl font-bold font-serif text-amber-500 tracking-tight">Mastery Ledger</h2>
                    <p className="text-gray-500 text-sm mt-1">A historical record of your habits and mandates.</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Global Prowess</div>
                        <div className="text-xl font-bold text-white">
                            {habits.length > 0
                                ? Math.round(habits.reduce((acc, h) => acc + h.stats.fulfillment, 0) / habits.length)
                                : 0}%
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Active Paths</div>
                        <div className="text-xl font-bold text-white">{habits.length}</div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {habits.map((habit, idx) => (
                    <Card key={habit.id} className="bg-gray-950/40 border-amber-900/20 hover:border-amber-500/30 transition-all p-4 relative overflow-hidden group">
                        {/* Foil gradient for top performers */}
                        {idx < 3 && (
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none" />
                        )}

                        <div className="flex flex-col lg:flex-row lg:items-center gap-6 relative z-10">
                            {/* Habit Info */}
                            <div className="flex items-center gap-4 lg:w-[250px]">
                                <div className={cn("p-2.5 rounded-xl border", categoryColors[habit.category as keyof typeof categoryColors] || 'text-gray-500 bg-gray-500/10 border-gray-500/30')}>
                                    {React.createElement(categoryIcons[habit.category as keyof typeof categoryIcons] || Sword, { className: "w-5 h-5" })}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-sm text-gray-200 truncate">{habit.name}</h3>
                                        {idx === 0 && <Medal className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                                        {idx === 1 && <Medal className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                                        {idx === 2 && <Medal className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                                    </div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter mt-0.5">
                                        {habit.mandate.count}× {habit.mandate.period} Target
                                    </div>
                                </div>
                            </div>

                            {/* Mastery Cycle Grid */}
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-1">
                                        {view === 'week' ? 'Last 7 Days' : '30-Day History'}
                                    </span>
                                    <div className="flex bg-gray-900/50 p-0.5 rounded-lg border border-gray-800">
                                        <button
                                            onClick={() => setView('week')}
                                            className={cn(
                                                "px-2 py-0.5 text-[8px] font-bold uppercase rounded-md transition-all",
                                                view === 'week'
                                                    ? "bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                                                    : "text-gray-600 hover:text-gray-400"
                                            )}
                                        >
                                            Week
                                        </button>
                                        <button
                                            onClick={() => setView('month')}
                                            className={cn(
                                                "px-2 py-0.5 text-[8px] font-bold uppercase rounded-md transition-all",
                                                view === 'month'
                                                    ? "bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                                                    : "text-gray-600 hover:text-gray-400"
                                            )}
                                        >
                                            Month
                                        </button>
                                    </div>
                                </div>

                                {view === 'week' ? (
                                    <div className="space-y-1.5">
                                        <div className="grid grid-cols-7 gap-1 text-[8px] font-bold text-gray-600">
                                            {last7DaysLabels.map((d, i) => (
                                                <span key={i} className={cn("text-center", i === 6 && "text-amber-500")}>{d}</span>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {habit.grid.map((done: boolean, i: number) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "h-8 rounded-lg border-2 flex items-center justify-center transition-all",
                                                        done
                                                            ? "bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                                                            : "bg-gray-900/40 border-gray-800/60 text-gray-800",
                                                        i === 6 && !done && "border-dash"
                                                    )}
                                                >
                                                    {done ? <Shield className="w-3.5 h-3.5" /> : <div className="w-1 h-1 rounded-full bg-gray-800" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1 items-center justify-center bg-gray-900/10 rounded-xl border border-dashed border-gray-800/50 p-2">
                                        <div className="grid grid-cols-10 gap-x-1 gap-y-1 w-full">
                                            {Array.from({ length: 30 }).map((_, i) => {
                                                const dayIndex = 29 - i;
                                                const done = habit.completions?.some((c: any) => {
                                                    const completionDate = new Date(c.completed_at);
                                                    const targetDate = new Date();
                                                    targetDate.setDate(targetDate.getDate() - dayIndex);
                                                    return completionDate.toISOString().slice(0, 10) === targetDate.toISOString().slice(0, 10);
                                                });

                                                return (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            "h-6 rounded border flex items-center justify-center transition-all",
                                                            done
                                                                ? "bg-amber-500/30 border-amber-500/50"
                                                                : "bg-gray-900/40 border-gray-800/40"
                                                        )}
                                                        title={`${dayIndex === 0 ? 'Today' : (dayIndex + ' days ago')}`}
                                                    >
                                                        {done && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mastery Stats */}
                            <div className="lg:w-[200px] flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{TEXT_CONTENT.quests.mastery.stats.fulfillment}</span>
                                    <span className={cn("text-xs font-bold", habit.stats.fulfillment >= 80 ? 'text-green-500' : 'text-amber-500')}>{habit.stats.fulfillment}%</span>
                                </div>
                                <Progress value={habit.stats.fulfillment} className="h-1.5 bg-gray-900">
                                    <div className={cn("h-full transition-all", habit.stats.fulfillment >= 80 ? 'bg-green-500' : 'bg-amber-500')} style={{ width: `${habit.stats.fulfillment}%` }} />
                                </Progress>
                                <div className="flex items-center justify-between mt-1 text-[10px]">
                                    <span className="text-gray-600 font-bold uppercase">{TEXT_CONTENT.quests.mastery.stats.monthly}</span>
                                    <span className="text-gray-300 font-bold">{habit.stats.monthly} Deeds</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}

                {habits.length === 0 && (
                    <div className="text-center py-12 bg-gray-950/20 border-2 border-dashed border-amber-900/20 rounded-2xl">
                        <PersonStanding className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                        <h4 className="text-lg font-serif text-gray-500">No active paths discovered in the ledger</h4>
                        <p className="text-sm text-gray-600 mt-1">Embark on recurring quests to track your mastery here.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
