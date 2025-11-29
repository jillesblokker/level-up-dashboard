"use client"

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChronicleProgressBar } from '@/components/chronicle-progress-bar'
import { StreakFlame } from '@/components/streak-flame'
import { QuestCompletionAnimation } from '@/components/quest-completion-animation'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Quest {
    id: string
    name: string
    description: string
    category: string
    difficulty: 'easy' | 'medium' | 'hard'
    xpReward: number
    goldReward: number
    completed: boolean
}

interface CharacterStats {
    level: number
    experience: number
    experienceToNextLevel: number
    gold: number
    streakDays: number
}

export function DailyHubClient() {
    const { user } = useUser()
    const router = useRouter()
    const [stats, setStats] = useState<CharacterStats>({
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        gold: 0,
        streakDays: 0
    })
    const [todaysQuests, setTodaysQuests] = useState<Quest[]>([])
    const [loading, setLoading] = useState(true)
    const [showCompletionAnimation, setShowCompletionAnimation] = useState(false)
    const [completedQuest, setCompletedQuest] = useState<Quest | null>(null)

    useEffect(() => {
        if (user) {
            loadCharacterStats()
            loadTodaysQuests()
        }
    }, [user])

    const loadCharacterStats = async () => {
        try {
            const response = await fetch('/api/character-stats')
            if (response.ok) {
                const data = await response.json()
                setStats({
                    level: data.level || 1,
                    experience: data.experience || 0,
                    experienceToNextLevel: data.experienceToNextLevel || 100,
                    gold: data.gold || 0,
                    streakDays: data.streakDays || 0
                })
            }
        } catch (error) {
            console.error('Failed to load character stats:', error)
        }
    }

    const loadTodaysQuests = async () => {
        try {
            const response = await fetch('/api/quests/daily')
            if (response.ok) {
                const data = await response.json()
                // Limit to 5 quests max for the daily hub
                setTodaysQuests(data.slice(0, 5))
            }
        } catch (error) {
            console.error('Failed to load quests:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCompleteQuest = async (quest: Quest) => {
        try {
            const response = await fetch('/api/quests/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questId: quest.id })
            })

            if (response.ok) {
                setCompletedQuest(quest)
                setShowCompletionAnimation(true)

                // Update local state
                setTodaysQuests(prev => prev.map(q =>
                    q.id === quest.id ? { ...q, completed: true } : q
                ))

                // Reload stats after a delay
                setTimeout(() => {
                    loadCharacterStats()
                }, 3000)
            }
        } catch (error) {
            console.error('Failed to complete quest:', error)
        }
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-600'
            case 'medium': return 'bg-yellow-600'
            case 'hard': return 'bg-red-600'
            default: return 'bg-gray-600'
        }
    }

    const getDifficultyRewards = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return { xp: 25, gold: 25 }
            case 'medium': return { xp: 50, gold: 50 }
            case 'hard': return { xp: 100, gold: 100 }
            default: return { xp: 10, gold: 10 }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-black p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-amber-300 text-center py-12">Loading your daily adventure...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-black p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl font-bold text-amber-300 mb-2 flex items-center gap-3">
                        <span className="text-5xl">🏰</span>
                        Welcome, {user?.firstName || 'Hero'}!
                    </h1>
                    <p className="text-amber-200/70 text-lg italic">
                        Your daily adventure awaits...
                    </p>
                </motion.div>

                {/* Chronicle Progress Bar */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <ChronicleProgressBar
                        currentLevel={stats.level}
                        currentXP={stats.experience}
                        xpToNextLevel={stats.experienceToNextLevel}
                        actName="The Awakening"
                        actDescription="Your journey begins"
                    />
                </motion.div>

                {/* Stats Row */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {/* Streak Flame */}
                    <Card className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border-2 border-orange-700">
                        <CardContent className="p-6 flex flex-col items-center justify-center">
                            <StreakFlame streakDays={stats.streakDays} />
                        </CardContent>
                    </Card>

                    {/* Gold */}
                    <Card className="bg-gradient-to-br from-amber-900/50 to-yellow-900/50 border-2 border-amber-700">
                        <CardContent className="p-6 flex flex-col items-center justify-center">
                            <div className="text-6xl mb-2">🪙</div>
                            <div className="text-4xl font-bold text-amber-300">{stats.gold}</div>
                            <div className="text-sm text-amber-200/70">Gold</div>
                        </CardContent>
                    </Card>

                    {/* Level */}
                    <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-2 border-blue-700">
                        <CardContent className="p-6 flex flex-col items-center justify-center">
                            <div className="text-6xl mb-2">⭐</div>
                            <div className="text-4xl font-bold text-blue-300">Level {stats.level}</div>
                            <div className="text-sm text-blue-200/70">{stats.experience} / {stats.experienceToNextLevel} XP</div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Today's Quests */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-4 border-amber-800">
                        <CardHeader>
                            <CardTitle className="text-2xl text-amber-900 flex items-center gap-2">
                                <span className="text-3xl">⚔️</span>
                                Today&apos;s Quests
                            </CardTitle>
                            <CardDescription className="text-amber-700">
                                Complete these tasks to grow your legend
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {todaysQuests.length === 0 ? (
                                <div className="text-center py-8 text-amber-700">
                                    <p className="mb-4">No quests available. Create your first quest!</p>
                                    <Button asChild>
                                        <Link href="/quests">Create Quest</Link>
                                    </Button>
                                </div>
                            ) : (
                                todaysQuests.map((quest, index) => (
                                    <motion.div
                                        key={quest.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + index * 0.1 }}
                                    >
                                        <Card className={`border-2 ${quest.completed ? 'bg-green-100 border-green-600' : 'bg-white border-amber-600'}`}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className={`font-semibold ${quest.completed ? 'text-green-900 line-through' : 'text-amber-900'}`}>
                                                                {quest.name}
                                                            </h3>
                                                            <Badge className={getDifficultyColor(quest.difficulty)}>
                                                                {quest.difficulty}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-xs">
                                                                {quest.category}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-gray-600">{quest.description}</p>
                                                        <div className="flex gap-3 mt-2">
                                                            <span className="text-xs text-blue-600">+{getDifficultyRewards(quest.difficulty).xp} XP</span>
                                                            <span className="text-xs text-amber-600">+{getDifficultyRewards(quest.difficulty).gold} Gold</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={() => handleCompleteQuest(quest)}
                                                        disabled={quest.completed}
                                                        className={quest.completed ? 'bg-green-600' : 'bg-amber-600 hover:bg-amber-700'}
                                                    >
                                                        {quest.completed ? '✓ Done' : 'Complete'}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            )}

                            {/* View All Quests Link */}
                            <div className="text-center pt-4">
                                <Button variant="outline" asChild>
                                    <Link href="/quests">View All Quests →</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Kingdom Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <Card className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-2 border-green-700 cursor-pointer hover:border-green-500 transition-all"
                        onClick={() => router.push('/kingdom')}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-green-300 mb-2">Your Kingdom</h3>
                                    <p className="text-green-200/70">Manage your realm and collect resources</p>
                                </div>
                                <div className="text-6xl">🏰</div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Quest Completion Animation */}
            {completedQuest && (
                <QuestCompletionAnimation
                    show={showCompletionAnimation}
                    questName={completedQuest.name}
                    xpGained={getDifficultyRewards(completedQuest.difficulty).xp}
                    goldGained={getDifficultyRewards(completedQuest.difficulty).gold}
                    onComplete={() => {
                        setShowCompletionAnimation(false)
                        setCompletedQuest(null)
                    }}
                />
            )}
        </div>
    )
}
