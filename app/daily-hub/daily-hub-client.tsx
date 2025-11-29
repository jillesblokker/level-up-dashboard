"use client"

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChronicleProgressBar } from '@/components/chronicle-progress-bar'
import { StreakFlame } from '@/components/streak-flame'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { HeaderSection } from '@/components/HeaderSection'
import QuestCard from '@/components/quest-card'
import { Loader2, Plus, ArrowRight, LayoutDashboard, Map, ScrollText } from 'lucide-react'

interface Quest {
    id: string
    name: string
    description: string
    category: string
    difficulty: 'easy' | 'medium' | 'hard' | 'epic'
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
    const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set())

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
                // Limit to 6 quests max for the daily hub
                const quests = data.slice(0, 6).map((q: any) => ({
                    ...q,
                    // Ensure difficulty matches the expected type
                    difficulty: ['easy', 'medium', 'hard', 'epic'].includes(q.difficulty) ? q.difficulty : 'medium'
                }))
                setTodaysQuests(quests)

                // Initialize completed set
                const completed = new Set<string>()
                quests.forEach((q: Quest) => {
                    if (q.completed) completed.add(q.id)
                })
                setCompletedQuestIds(completed)
            }
        } catch (error) {
            console.error('Failed to load quests:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCompleteQuest = async (quest: Quest) => {
        if (completedQuestIds.has(quest.id)) return

        try {
            const response = await fetch('/api/quests/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questId: quest.id })
            })

            if (response.ok) {
                setCompletedQuestIds(prev => new Set(prev).add(quest.id))

                // Update local state
                setTodaysQuests(prev => prev.map(q =>
                    q.id === quest.id ? { ...q, completed: true } : q
                ))

                // Reload stats after a delay
                setTimeout(() => {
                    loadCharacterStats()
                }, 1500)
            }
        } catch (error) {
            console.error('Failed to complete quest:', error)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto" />
                    <p className="text-amber-200/70 text-lg animate-pulse">Summoning your daily adventure...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black pb-20">
            {/* Header Section */}
            <HeaderSection
                title={`Welcome, ${user?.firstName || 'Hero'}!`}
                subtitle="Your daily adventure awaits. Complete quests, maintain your streak, and grow your kingdom."
                defaultBgColor="bg-gradient-to-b from-amber-900/40 to-black"
                className="h-[300px] md:h-[400px]"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 space-y-8">

                {/* Stats Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    {/* Streak Card */}
                    <Card className="bg-black/80 border-amber-900/50 backdrop-blur-sm shadow-xl overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-6 flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-sm text-amber-200/70 font-medium uppercase tracking-wider">Current Streak</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-4xl font-bold text-white">{stats.streakDays}</span>
                                    <span className="text-sm text-amber-500">days</span>
                                </div>
                            </div>
                            <div className="h-16 w-16 flex items-center justify-center bg-orange-950/30 rounded-full border border-orange-900/50">
                                <StreakFlame streakDays={stats.streakDays} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Level Card */}
                    <Card className="bg-black/80 border-amber-900/50 backdrop-blur-sm shadow-xl overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-sm text-blue-200/70 font-medium uppercase tracking-wider">Level {stats.level}</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-2xl font-bold text-white">{stats.experience}</span>
                                        <span className="text-sm text-blue-400">/ {stats.experienceToNextLevel} XP</span>
                                    </div>
                                </div>
                                <div className="h-12 w-12 flex items-center justify-center bg-blue-950/30 rounded-full border border-blue-900/50 text-2xl">
                                    ⭐
                                </div>
                            </div>
                            <ChronicleProgressBar
                                currentLevel={stats.level}
                                currentXP={stats.experience}
                                xpToNextLevel={stats.experienceToNextLevel}
                                actName=""
                                actDescription=""
                                className="h-2 mt-2"
                            />
                        </CardContent>
                    </Card>

                    {/* Gold Card */}
                    <Card className="bg-black/80 border-amber-900/50 backdrop-blur-sm shadow-xl overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-6 flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-sm text-yellow-200/70 font-medium uppercase tracking-wider">Treasury</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-4xl font-bold text-white">{stats.gold}</span>
                                    <span className="text-sm text-yellow-500">Gold</span>
                                </div>
                            </div>
                            <div className="h-16 w-16 flex items-center justify-center bg-yellow-950/30 rounded-full border border-yellow-900/50 text-3xl">
                                🪙
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    <Link href="/quests" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 bg-black/40 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group">
                            <ScrollText className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
                            <span className="text-amber-200 group-hover:text-white">Quest Board</span>
                        </Button>
                    </Link>
                    <Link href="/kingdom" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 bg-black/40 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group">
                            <LayoutDashboard className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform" />
                            <span className="text-green-200 group-hover:text-white">Kingdom</span>
                        </Button>
                    </Link>
                    <Link href="/map" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 bg-black/40 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group">
                            <Map className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="text-blue-200 group-hover:text-white">World Map</span>
                        </Button>
                    </Link>
                    <Link href="/quests?new=true" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 bg-black/40 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group">
                            <Plus className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform" />
                            <span className="text-purple-200 group-hover:text-white">New Quest</span>
                        </Button>
                    </Link>
                </motion.div>

                {/* Today's Quests */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-amber-500 font-medieval tracking-wide">Today&apos;s Quests</h2>
                        <Link href="/quests">
                            <Button variant="ghost" className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 gap-2">
                                View All <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    {todaysQuests.length === 0 ? (
                        <Card className="bg-black/40 border-amber-900/30 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-amber-950/30 rounded-full flex items-center justify-center mb-4">
                                    <ScrollText className="w-8 h-8 text-amber-700" />
                                </div>
                                <h3 className="text-xl font-bold text-amber-500 mb-2">No Quests for Today</h3>
                                <p className="text-gray-400 max-w-md mb-6">
                                    Your quest log is empty. Create a new quest to begin your daily adventure and earn rewards.
                                </p>
                                <Link href="/quests">
                                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                                        Create First Quest
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {todaysQuests.map((quest, index) => (
                                <motion.div
                                    key={quest.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                >
                                    <QuestCard
                                        title={quest.name}
                                        description={quest.description}
                                        category={quest.category}
                                        difficulty={quest.difficulty}
                                        progress={quest.completed ? 1 : 0}
                                        maxProgress={1}
                                        reward={{
                                            experience: quest.xpReward || 0,
                                            gold: quest.goldReward || 0
                                        }}
                                        status={quest.completed ? 'completed' : 'not-started'}
                                        onComplete={() => handleCompleteQuest(quest)}
                                        onClick={() => router.push('/quests')}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
