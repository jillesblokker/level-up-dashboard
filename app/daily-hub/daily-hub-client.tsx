"use client"

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChroniclesCard } from '@/components/chronicles-card'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { HeaderSection } from '@/components/HeaderSection'
import QuestCard from '@/components/quest-card'
import { Loader2, Plus, ArrowRight, Map, ScrollText, Flame, TrendingUp } from 'lucide-react'

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

interface GoldTransaction {
    amount: number
    created_at: string
    transaction_type: 'gain' | 'spend'
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
    const [favoritedQuests, setFavoritedQuests] = useState<Quest[]>([])
    const [loading, setLoading] = useState(true)
    const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set())
    const [weeklyGoldEarned, setWeeklyGoldEarned] = useState(0)

    useEffect(() => {
        if (user) {
            loadCharacterStats()
            loadFavoritedQuests()
            loadWeeklyGoldStats()
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

    const loadWeeklyGoldStats = async () => {
        try {
            // Get transactions from the last 7 days
            const response = await fetch('/api/gold-transactions?limit=100')
            if (response.ok) {
                const result = await response.json()
                const transactions: GoldTransaction[] = result.data || []

                // Calculate date 7 days ago
                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

                // Sum up gold gained in the last 7 days
                const weeklyGold = transactions
                    .filter(t => {
                        const transactionDate = new Date(t.created_at)
                        return transactionDate >= sevenDaysAgo && t.transaction_type === 'gain'
                    })
                    .reduce((sum, t) => sum + t.amount, 0)

                setWeeklyGoldEarned(weeklyGold)
            }
        } catch (error) {
            console.error('Failed to load weekly gold stats:', error)
        }
    }

    const loadFavoritedQuests = async () => {
        try {
            console.log('[Daily Hub] Loading favorited quests...')

            // First, get favorited quest IDs
            const favoritesResponse = await fetch('/api/quests/favorites')
            console.log('[Daily Hub] Favorites response status:', favoritesResponse.status)

            if (!favoritesResponse.ok) {
                console.error('[Daily Hub] Failed to fetch favorites')
                setFavoritedQuests([])
                return
            }

            const favoritesData = await favoritesResponse.json()
            console.log('[Daily Hub] Favorites data:', favoritesData)
            const favoriteIds = favoritesData.favorites || []
            console.log('[Daily Hub] Favorite IDs:', favoriteIds)

            if (favoriteIds.length === 0) {
                console.log('[Daily Hub] No favorite IDs found')
                setFavoritedQuests([])
                return
            }

            // Then, get ALL quests (not just daily) and filter for favorites
            const questsResponse = await fetch('/api/quests')
            console.log('[Daily Hub] Quests response status:', questsResponse.status)

            if (questsResponse.ok) {
                const allQuests = await questsResponse.json()
                console.log('[Daily Hub] All quests count:', allQuests.length)
                console.log('[Daily Hub] All quests:', allQuests)

                const favoriteQuests = allQuests
                    .filter((q: any) => {
                        const isFavorite = favoriteIds.includes(q.id)
                        console.log(`[Daily Hub] Quest ${q.id} (${q.name}) is favorite:`, isFavorite)
                        return isFavorite
                    })
                    .slice(0, 6)
                    .map((q: any) => ({
                        ...q,
                        difficulty: ['easy', 'medium', 'hard', 'epic'].includes(q.difficulty) ? q.difficulty : 'medium'
                    }))

                console.log('[Daily Hub] Filtered favorite quests:', favoriteQuests)
                setFavoritedQuests(favoriteQuests)

                // Initialize completed set
                const completed = new Set<string>()
                favoriteQuests.forEach((q: Quest) => {
                    if (q.completed) completed.add(q.id)
                })
                setCompletedQuestIds(completed)
            }
        } catch (error) {
            console.error('[Daily Hub] Error loading favorited quests:', error)
            setFavoritedQuests([])
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
                setFavoritedQuests(prev => prev.map(q =>
                    q.id === quest.id ? { ...q, completed: true } : q
                ))

                // Reload stats after a delay
                setTimeout(() => {
                    loadCharacterStats()
                    loadWeeklyGoldStats()
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
            {/* Header Section with CTA */}
            <HeaderSection
                title={`Welcome, ${user?.firstName || 'Hero'}!`}
                subtitle="Your daily adventure awaits. Complete quests, maintain your streak, and grow your kingdom."
                imageSrc="/images/daily-hub-hero.jpg"
                defaultBgColor="bg-gradient-to-b from-amber-900/40 to-black"
                className="h-[300px] md:h-[400px]"
                shouldRevealImage={true}
                ctaButton={
                    <Link href="/kingdom">
                        <Button
                            size="lg"
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-6 text-lg shadow-2xl hover:shadow-amber-500/50 transition-all hover:scale-105"
                        >
                            <span className="text-2xl mr-2">👑</span>
                            Enter Your Kingdom
                        </Button>
                    </Link>
                }
            />

            {/* Spacing between header and content - more on mobile */}
            <div className="h-16 md:h-8" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 md:-mt-20 relative z-10 space-y-6 md:space-y-8">

                {/* Stats Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
                >
                    {/* Streak Card */}
                    <Card className="bg-black/80 border-amber-900/50 backdrop-blur-sm shadow-xl overflow-hidden relative group hover:shadow-2xl hover:shadow-orange-500/10 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-5 md:p-6 flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-sm text-amber-200/70 font-medium uppercase tracking-wider">Current Streak</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-4xl font-bold text-white">{stats.streakDays}</span>
                                    <span className="text-sm text-amber-500">days</span>
                                </div>
                            </div>
                            <div className="h-16 w-16 flex items-center justify-center bg-orange-950/30 rounded-full border border-orange-900/50">
                                <Flame className="w-8 h-8 text-orange-500" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Level Card */}
                    <Card className="bg-black/80 border-amber-900/50 backdrop-blur-sm shadow-xl overflow-hidden relative group hover:shadow-2xl hover:shadow-blue-500/10 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-5 md:p-6 relative z-10">
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
                            <div className="mt-2 h-2 bg-black/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
                                    style={{ width: `${(stats.experience / stats.experienceToNextLevel) * 100}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gold Card with Weekly Stats */}
                    <Card className="bg-black/80 border-amber-900/50 backdrop-blur-sm shadow-xl overflow-hidden relative group hover:shadow-2xl hover:shadow-yellow-500/10 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-5 md:p-6 relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex-1">
                                    <p className="text-sm text-yellow-200/70 font-medium uppercase tracking-wider">Treasury</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-3xl font-bold text-white">{stats.gold}</span>
                                        <span className="text-sm text-yellow-500">Gold</span>
                                    </div>
                                </div>
                                <div className="h-12 w-12 flex items-center justify-center bg-yellow-950/30 rounded-full border border-yellow-900/50 text-2xl">
                                    🪙
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-yellow-900/30 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-green-400 font-medium">
                                    +{weeklyGoldEarned} earned this week
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Chronicles Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <ChroniclesCard currentLevel={stats.level} />
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
                >
                    <Link href="/quests" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 md:py-5 flex flex-col items-center gap-2 bg-black/40 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group active:scale-95">
                            <ScrollText className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
                            <span className="text-amber-200 group-hover:text-white">Quest Board</span>
                        </Button>
                    </Link>
                    <Link href="/kingdom" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 md:py-5 flex flex-col items-center gap-2 bg-black/40 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group active:scale-95">
                            <span className="text-2xl group-hover:scale-110 transition-transform">👑</span>
                            <span className="text-green-200 group-hover:text-white">Kingdom</span>
                        </Button>
                    </Link>
                    <Link href="/map" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 md:py-5 flex flex-col items-center gap-2 bg-black/40 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group active:scale-95">
                            <Map className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="text-blue-200 group-hover:text-white">World Map</span>
                        </Button>
                    </Link>
                    <Link href="/quests?new=true" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 md:py-5 flex flex-col items-center gap-2 bg-black/40 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group active:scale-95">
                            <Plus className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform" />
                            <span className="text-purple-200 group-hover:text-white">New Quest</span>
                        </Button>
                    </Link>
                </motion.div>

                {/* Favorited Quests */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-amber-500 font-medieval tracking-wide">Your Favorite Quests</h2>
                        <Link href="/quests">
                            <Button variant="ghost" className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 gap-1 md:gap-2 text-sm md:text-base">
                                View All <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    {favoritedQuests.length === 0 ? (
                        <Card className="bg-black/40 border-amber-900/30 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-amber-950/30 rounded-full flex items-center justify-center mb-4">
                                    <ScrollText className="w-8 h-8 text-amber-700" />
                                </div>
                                <h3 className="text-xl font-bold text-amber-500 mb-2">No Favorite Quests Yet</h3>
                                <p className="text-gray-400 max-w-md mb-6">
                                    Star your favorite quests from the Quest Board to see them here for quick access.
                                </p>
                                <Link href="/quests">
                                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                                        Browse Quest Board
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {favoritedQuests.map((quest, index) => (
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
