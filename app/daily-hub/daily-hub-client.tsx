"use client"

import { logger } from "@/lib/logger";
import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import QuestCard from "@/components/quest-card"
import { HeaderSection } from "@/components/HeaderSection"
import { ArrowLeft, ArrowRight, Loader2, TrendingUp, Sparkles, ScrollText, Flame, Map, Plus, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatGold } from "@/lib/utils"
import { motion } from "framer-motion"
import { TEXT_CONTENT } from "@/lib/text-content"
import { NewPlayerProgress } from "@/components/onboarding/NewPlayerProgress"
import { WeeklyChallengesCard } from "@/components/weekly-challenges-card"
import { ChroniclesCard } from "@/components/chronicles-card"
import NextImage from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface Quest {
    id: string
    name: string
    description: string
    category: string
    difficulty: 'easy' | 'medium' | 'hard' | 'epic'
    completed: boolean
    xpReward?: number
    goldReward?: number
}

interface CharacterStats {
    level: number
    experience: number
    experienceToNextLevel: number
    gold: number
    streakDays: number
}

interface GoldTransaction {
    id: string
    amount: number
    transaction_type: 'gain' | 'spend'
    created_at: string
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

    // Yesterday's Report Card State
    const [showReportCard, setShowReportCard] = useState(false)
    const [yesterdayReport, setYesterdayReport] = useState<{
        completedQuestsCount: number;
        goldEarned: number;
        xpEarned: number;
        milestonesUnlocked: number;
    } | null>(null)

    // Active Perks State & Timer
    const [activePerks, setActivePerks] = useState<any[]>([])
    const [timeState, setTimeState] = useState(Date.now())

    useEffect(() => {
        if (user) {
            loadCharacterStats()
            loadFavoritedQuests()
            loadWeeklyGoldStats()
            loadActivePerks()
        }
    }, [user])

    // Cooldown/Timer Tic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeState(Date.now())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    // Daily Login Report Card Check
    useEffect(() => {
        const checkDailyReportCard = async () => {
            if (!user) return;
            
            const todayStr = new Date().toISOString().split('T')[0] || '';
            const lastSeenDay = localStorage.getItem('last_seen_day');
            
            if (lastSeenDay !== todayStr) {
                try {
                    const res = await fetch('/api/daily-report');
                    if (res.ok) {
                        const data = await res.json();
                        setYesterdayReport(data);
                        setShowReportCard(true);
                    }
                } catch (err) {
                    logger.error('Failed to load daily login report card:', err);
                }
                localStorage.setItem('last_seen_day', todayStr);
            }
        };
        
        if (user) {
            checkDailyReportCard();
        }
    }, [user]);

    const loadActivePerks = async () => {
        try {
            const response = await fetch('/api/active-perks')
            if (response.ok) {
                const json = await response.json()
                setActivePerks(json.data || [])
            }
        } catch (error) {
            logger.error('Failed to load active perks on daily hub:', error)
        }
    }

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
            logger.error('Failed to load character stats:', error)
        }
    }

    const loadWeeklyGoldStats = async () => {
        try {
            const response = await fetch('/api/gold-transactions?limit=100')
            if (response.ok) {
                const result = await response.json()
                const transactions: GoldTransaction[] = result.data || []

                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

                const weeklyGold = transactions
                    .filter(t => {
                        const transactionDate = new Date(t.created_at)
                        return transactionDate >= sevenDaysAgo && t.transaction_type === 'gain'
                    })
                    .reduce((sum, t) => sum + t.amount, 0)

                setWeeklyGoldEarned(weeklyGold)
            }
        } catch (error) {
            logger.error('Failed to load weekly gold stats:', error)
        }
    }

    const loadFavoritedQuests = async () => {
        try {
            logger.debug(`[Daily Hub] ${TEXT_CONTENT.dailyHub.log.loading}`)

            const favoritesResponse = await fetch('/api/quests/favorites')
            if (!favoritesResponse.ok) {
                throw new Error('Failed to fetch favorite ids')
            }
            const favoritesData = await favoritesResponse.json()
            const favoriteIds = favoritesData.favorites || []

            const questsResponse = await fetch(`/api/quests?t=${Date.now()}`)
            if (questsResponse.ok) {
                const questsData = await questsResponse.json()
                const allQuests = questsData.quests || []

                const favoriteQuests = allQuests
                    .filter((q: any) => {
                        const isFavorite = favoriteIds.includes(q.id)
                        return isFavorite
                    })
                    .slice(0, 6)
                    .map((q: any) => ({
                        ...q,
                        difficulty: ['easy', 'medium', 'hard', 'epic'].includes(q.difficulty) ? q.difficulty : 'medium'
                    }))

                setFavoritedQuests(favoriteQuests)

                const completed = new Set<string>()
                favoriteQuests.forEach((q: Quest) => {
                    if (q.completed) completed.add(q.id)
                })
                setCompletedQuestIds(completed)
            }
        } catch (error) {
            logger.error('[Daily Hub] Error loading favorited quests:', error)
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

                setFavoritedQuests(prev => prev.map(q =>
                    q.id === quest.id ? { ...q, completed: true } : q
                ))

                setTimeout(() => {
                    loadCharacterStats()
                    loadWeeklyGoldStats()
                }, 1500)
            }
        } catch (error) {
            logger.error('Failed to complete quest:', error)
        }
    }

    const getPerkTimeRemaining = (expiresAt: string) => {
        const diff = new Date(expiresAt).getTime() - timeState;
        if (diff <= 0) return "Expired";

        const totalSecs = Math.floor(diff / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m ${secs}s`;
        }
        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto" />
                    <p className="text-amber-200/70 text-lg animate-pulse">{TEXT_CONTENT.dailyHub.loading.spinner}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black pb-20">
            {/* Header Section with CTA */}
            <HeaderSection
                title={TEXT_CONTENT.dailyHub.header.title.replace('{name}', user?.firstName || TEXT_CONTENT.dailyHub.header.defaultName)}
                subtitle={TEXT_CONTENT.dailyHub.header.subtitle}
                imageSrc="/images/daily-hub-hero.webp"
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
                            {TEXT_CONTENT.dailyHub.header.cta}
                        </Button>
                    </Link>
                }
            />

            {/* Spacing between header and content */}
            <div className="h-16 md:h-8" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 md:-mt-20 relative z-10 space-y-6 md:space-y-8">

                {/* Stats Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
                >
                    {/* Total Quests Card */}
                    <Card className="bg-black/80 border-amber-900/50 backdrop-blur-sm shadow-xl overflow-hidden relative group hover:shadow-2xl hover:shadow-purple-500/10 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-5 md:p-6 flex items-center justify-between relative z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm text-purple-200/70 font-medium uppercase tracking-wider">Total Quests</p>
                                    {stats.streakDays > 0 && (
                                        <div className="flex items-center gap-1 bg-orange-950/40 border border-orange-500/30 px-2 py-0.5 rounded-full" title="Current Streak">
                                            <Flame className="w-3 h-3 text-orange-500 animate-pulse" />
                                            <span className="text-xs font-bold text-orange-400">{stats.streakDays}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-4xl font-bold text-white">{favoritedQuests.filter(q => q.completed).length + 24}</span>
                                    <span className="text-sm text-purple-400">Lifetime</span>
                                </div>
                            </div>
                            <div className="h-16 w-16 flex items-center justify-center bg-purple-950/30 rounded-full border border-purple-900/50 text-2xl">
                                ⚔️
                            </div>
                        </CardContent>
                    </Card>

                    {/* Level Card */}
                    <Card className="bg-black/80 border-amber-900/50 backdrop-blur-sm shadow-xl overflow-hidden relative group hover:shadow-2xl hover:shadow-blue-500/10 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-5 md:p-6 relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-sm text-blue-200/70 font-medium uppercase tracking-wider">{TEXT_CONTENT.dailyHub.stats.level.label.replace('{level}', String(stats.level))}</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-2xl font-bold text-white">{stats.experience}</span>
                                        <span className="text-sm text-blue-400">{TEXT_CONTENT.dailyHub.stats.level.xp.replace('{max}', String(stats.experienceToNextLevel))}</span>
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
                                    <p className="text-sm text-yellow-200/70 font-medium uppercase tracking-wider">{TEXT_CONTENT.dailyHub.stats.treasury.title}</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-3xl font-bold text-white" title={`${stats.gold} Gold`}>{formatGold(stats.gold)}</span>
                                        <span className="text-sm text-yellow-500">{TEXT_CONTENT.dailyHub.stats.treasury.unit}</span>
                                    </div>
                                </div>
                                <div className="h-12 w-12 flex items-center justify-center bg-yellow-950/30 rounded-full border border-yellow-900/50 text-2xl">
                                    🪙
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-yellow-900/30 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-green-400 font-medium">
                                    {TEXT_CONTENT.dailyHub.stats.treasury.weekly.replace('{amount}', String(weeklyGoldEarned))}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* New Player Progress */}
                <NewPlayerProgress />

                {/* Challenges & Active Perks Section (Grid Layout) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                    <div className="lg:col-span-2">
                        <WeeklyChallengesCard quests={favoritedQuests} weeklyGoldEarned={weeklyGoldEarned} />
                    </div>
                    
                    {/* ACTIVE PERKS WIDGET */}
                    <div className="lg:col-span-1">
                        <Card className="bg-black/60 border-amber-900/40 backdrop-blur-sm h-full flex flex-col justify-between">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-medieval text-amber-500 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-400" />
                                    <span>Active Buffs</span>
                                </CardTitle>
                                <CardDescription className="text-slate-400 text-xs">
                                    Temporary passive bonuses currently active
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                {activePerks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-center py-8 h-full space-y-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-900/60 border border-amber-900/20 flex items-center justify-center text-xl">
                                            🧪
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-300 font-semibold">No active buffs</p>
                                            <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                                                Drink potions from your inventory or unlock milestones to get buffs.
                                            </p>
                                        </div>
                                        <Link href="/inventory">
                                          <Button size="sm" variant="outline" className="border-amber-900/40 hover:bg-amber-950/20 text-xs text-amber-400 font-bold">
                                              Open Backpack
                                          </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {Array.isArray(activePerks) && activePerks.map((perk, index) => (
                                            <div key={perk.id || index} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">🧪</span>
                                                    <div>
                                                        <h5 className="font-bold text-xs text-amber-100">{perk.perk_name}</h5>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{perk.effect}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-900/30 px-2 py-1 rounded-full">
                                                    <Clock className="w-3 h-3 animate-spin duration-3000" />
                                                    <span>{getPerkTimeRemaining(perk.expires_at)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>

                {/* Gameplay Loop Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="relative"
                >
                    <Card className="bg-black/60 border-amber-900/40 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-6 md:p-8">
                            <h2 className="text-xl md:text-2xl font-bold text-amber-500 font-medieval tracking-wide mb-6">How to Build Habits</h2>

                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                {/* Left Side: Steps List */}
                                <div className="flex-1 space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 font-bold border border-amber-700/50">1</div>
                                        <div>
                                            <h3 className="text-amber-400 font-bold text-lg mb-1">Daily Habits</h3>
                                            <p className="text-sm text-gray-300 leading-relaxed">Completing tasks to earn resources.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 font-bold border border-amber-700/50">2</div>
                                        <div>
                                            <h3 className="text-amber-400 font-bold text-lg mb-1">Expanding Realm</h3>
                                            <p className="text-sm text-gray-300 leading-relaxed">Using resources to grow your map.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 font-bold border border-amber-700/50">3</div>
                                        <div>
                                            <h3 className="text-amber-400 font-bold text-lg mb-1">Daily Kingdom</h3>
                                            <p className="text-sm text-gray-300 leading-relaxed">Managing and maintaining your new territory.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 font-bold border border-amber-700/50">4</div>
                                        <div>
                                            <h3 className="text-amber-400 font-bold text-lg mb-1">Competitive Allies</h3>
                                            <p className="text-sm text-gray-300 leading-relaxed">Engaging with friends and rivals.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 font-bold border border-amber-700/50">5</div>
                                        <div>
                                            <h3 className="text-amber-400 font-bold text-lg mb-1">Building Character</h3>
                                            <p className="text-sm text-gray-300 leading-relaxed">Leveling up your personal stats based on progress.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Image */}
                                <div className="flex-1 w-full max-w-md">
                                    <div className="relative aspect-square rounded-xl overflow-hidden border border-amber-900/30 shadow-2xl bg-black/40">
                                        <NextImage
                                            src="/images/gameplay-loop.webp"
                                            alt="Level Up Gameplay Loop"
                                            fill
                                            priority
                                            className="object-contain p-2"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent pointer-events-none mix-blend-overlay" />
                                    </div>
                                </div>
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
                            <span className="text-amber-200 group-hover:text-white">{TEXT_CONTENT.dailyHub.actions.questBoard}</span>
                        </Button>
                    </Link>
                    <Link href="/kingdom" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 md:py-5 flex flex-col items-center gap-2 bg-black/40 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group active:scale-95">
                            <span className="text-2xl group-hover:scale-110 transition-transform">👑</span>
                            <span className="text-green-200 group-hover:text-white">{TEXT_CONTENT.dailyHub.actions.kingdom}</span>
                        </Button>
                    </Link>
                    <Link href="/realm" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 md:py-5 flex flex-col items-center gap-2 bg-black/40 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group active:scale-95">
                            <Map className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="text-blue-200 group-hover:text-white">{TEXT_CONTENT.dailyHub.actions.realm}</span>
                        </Button>
                    </Link>
                    <Link href="/quests?new=true" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 md:py-5 flex flex-col items-center gap-2 bg-black/40 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group active:scale-95">
                            <Plus className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform" />
                            <span className="text-purple-200 group-hover:text-white">{TEXT_CONTENT.dailyHub.actions.newQuest}</span>
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
                        <h2 className="text-xl md:text-2xl font-bold text-amber-500 font-medieval tracking-wide">{TEXT_CONTENT.dailyHub.favorites.title}</h2>
                        <Link href="/quests">
                            <Button variant="ghost" className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 gap-1 md:gap-2 text-sm md:text-base">
                                {TEXT_CONTENT.dailyHub.favorites.viewAll} <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    {favoritedQuests.length === 0 ? (
                        <Card className="bg-black/40 border-amber-900/30 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-amber-950/30 rounded-full flex items-center justify-center mb-4">
                                    <ScrollText className="w-8 h-8 text-amber-700" />
                                </div>
                                <h3 className="text-xl font-bold text-amber-500 mb-2">{TEXT_CONTENT.dailyHub.favorites.empty.title}</h3>
                                <p className="text-gray-400 max-w-md mb-6">
                                    {TEXT_CONTENT.dailyHub.favorites.empty.description}
                                </p>
                                <Link href="/quests">
                                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                                        {TEXT_CONTENT.dailyHub.favorites.empty.button}
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

            {/* YESTERDAY'S REPORT CARD MODAL */}
            <Dialog open={showReportCard} onOpenChange={setShowReportCard}>
                <DialogContent className="border border-amber-900/40 text-white p-6 max-w-md rounded-2xl shadow-2xl bg-slate-900/95 backdrop-blur-md">
                    <DialogHeader className="text-center space-y-2">
                        <div className="text-5xl mx-auto animate-bounce mb-2">📜</div>
                        <DialogTitle className="text-2xl font-medieval text-amber-500 tracking-wider">Yesterday&apos;s Report Card</DialogTitle>
                        <DialogDescription className="text-slate-400 text-sm">
                            Summary of your realm progress yesterday
                        </DialogDescription>
                    </DialogHeader>

                    {yesterdayReport && (yesterdayReport.completedQuestsCount > 0 || yesterdayReport.goldEarned > 0 || yesterdayReport.milestonesUnlocked > 0) ? (
                        <div className="space-y-4 py-4">
                            <p className="text-center text-sm text-slate-200">
                                You made excellent progress on your path to glory!
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/50 p-3 rounded-xl border border-amber-900/20 text-center">
                                    <div className="text-2xl font-bold text-amber-400">⚔️ {yesterdayReport.completedQuestsCount}</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Quests Done</div>
                                </div>
                                <div className="bg-black/50 p-3 rounded-xl border border-amber-900/20 text-center">
                                    <div className="text-2xl font-bold text-yellow-500">🪙 {yesterdayReport.goldEarned}</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Gold Gained</div>
                                </div>
                                <div className="bg-black/50 p-3 rounded-xl border border-amber-900/20 text-center">
                                    <div className="text-2xl font-bold text-blue-400">⭐ {yesterdayReport.xpEarned}</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">XP Gained</div>
                                </div>
                                <div className="bg-black/50 p-3 rounded-xl border border-amber-900/20 text-center">
                                    <div className="text-2xl font-bold text-purple-400">🏆 {yesterdayReport.milestonesUnlocked}</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Milestones</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4 text-center">
                            <p className="text-sm text-slate-300 italic">
                                &quot;Yesterday was a peaceful rest day, with no active quests completed.&quot;
                            </p>
                            <p className="text-sm text-amber-400/90 font-bold">
                                Today is a brand new day! Conquest waits for no one!
                            </p>
                        </div>
                    )}

                    <div className="flex justify-center pt-2">
                        <Button 
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 rounded-xl shadow-lg shadow-amber-900/40"
                            onClick={() => setShowReportCard(false)}
                        >
                            Conquer Today!
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
