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
import { ArrowLeft, ArrowRight, Loader2, TrendingUp, Sparkles, ScrollText, Flame, Map, Plus, Clock, Wind, Star } from "lucide-react"
import { useGameStore } from "@/stores/game-store"
import { ConsistencyChart } from "@/components/consistency-chart"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatGold } from "@/lib/utils"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { motion } from "framer-motion"
import { TEXT_CONTENT } from "@/lib/text-content"
import { NewPlayerProgress } from "@/components/onboarding/NewPlayerProgress"
import { useCitizensStore, isHarvestReady } from "@/stores/citizensStore"
import dynamic from 'next/dynamic'
const WeeklyChallengesCard = dynamic(
  () => import('@/components/weekly-challenges-card').then((mod) => mod.WeeklyChallengesCard),
  { ssr: false }
)
const ChroniclesCard = dynamic(
  () => import('@/components/chronicles-card').then((mod) => mod.ChroniclesCard),
  { ssr: false }
)
import NextImage from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getCurrentChapter, getNextChapter } from "@/lib/chronicles-data"

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
    const activePartnerId = useGameStore(state => state.activePartnerId)

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

    // Citizens State
    const citizens = useCitizensStore(state => state.citizens);
    const loadCitizens = useCitizensStore(state => state.loadCitizens);
    const citizensReadyCount = useMemo(() => citizens.filter(isHarvestReady).length, [citizens, timeState]);

    useEffect(() => {
        if (user) {
            loadCharacterStats()
            loadFavoritedQuests()
            loadWeeklyGoldStats()
            loadActivePerks()
            loadCitizens(user.id)
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
                const allQuests = Array.isArray(questsData) ? questsData : (questsData.quests || [])

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
    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours()
        const name = user?.firstName || TEXT_CONTENT.dailyHub.header.defaultName
        if (hour < 5) return `The night is dark, ${name}`
        if (hour < 12) return `A bright morning for a quest, ${name}`
        if (hour < 18) return `Good afternoon, ${name}`
        return `Good evening, ${name}`
    }

    const getLoreSummary = () => {
        if (!yesterdayReport) return "";
        const quests = yesterdayReport.completedQuestsCount || 0;
        const gold = yesterdayReport.goldEarned || 0;
        const title = user?.firstName || "Squire";
        const currentChapter = getCurrentChapter(stats.level);
        
        if (quests === 0) {
            return `During a day of peaceful respite, ${title} gathered strength to prepare for the epic battles ahead, chronicling events under Chapter ${currentChapter.id}: ${currentChapter.title}.`;
        }
        
        let text = `Yesterday, ${title} conquered ${quests} ${quests === 1 ? 'quest' : 'quests'}`;
        if (gold > 0) {
            text += ` and brought back ${gold} gold to the treasury`;
        }
        text += `, keeping the dark magic of Necrion at bay and advancing the records of Chapter ${currentChapter.id}: ${currentChapter.title}.`;
        return text;
    };

    return (
        <div className="min-h-screen bg-black pb-20">
            {/* Header Section with CTA */}
            <HeaderSection
                title={getTimeBasedGreeting()}
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
                
                {/* Active Partner Widget (Fixed Bottom Left) */}
                {(() => {
                    const activePartner = citizens.find(c => c.id === activePartnerId);
                    if (!activePartner) return null;
                    const bondLevel = Math.floor(activePartner.affection / 100) + 1;
                    const bondProgress = activePartner.affection % 100;

                    const elementGlowClasses: Record<string, string> = {
                      fire: 'border-red-900/60 shadow-[0_0_30px_rgba(239,68,68,0.15)] hover:border-red-500/80 hover:shadow-[0_0_40px_rgba(239,68,68,0.25)]',
                      water: 'border-blue-900/60 shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-500/80 hover:shadow-[0_0_40px_rgba(59,130,246,0.25)]',
                      earth: 'border-amber-900/60 shadow-[0_0_30px_rgba(217,119,6,0.15)] hover:border-amber-500/80 hover:shadow-[0_0_40px_rgba(217,119,6,0.25)]',
                      nature: 'border-emerald-900/60 shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:border-emerald-500/80 hover:shadow-[0_0_40px_rgba(16,185,129,0.25)]',
                      ice: 'border-cyan-900/60 shadow-[0_0_30px_rgba(34,211,238,0.15)] hover:border-cyan-400/80 hover:shadow-[0_0_40px_rgba(34,211,238,0.25)]',
                      monster: 'border-purple-900/60 shadow-[0_0_30px_rgba(147,51,234,0.15)] hover:border-purple-500/80 hover:shadow-[0_0_40px_rgba(147,51,234,0.25)]'
                    };
                    const glowClass = elementGlowClasses[activePartner.type] || 'border-amber-700/50 shadow-[0_0_40px_rgba(0,0,0,0.8)] hover:border-amber-500/80';

                    const elementInnerBorderClasses: Record<string, string> = {
                      fire: 'border-red-500/50 group-hover:border-red-400',
                      water: 'border-blue-500/50 group-hover:border-blue-400',
                      earth: 'border-amber-500/50 group-hover:border-amber-400',
                      nature: 'border-emerald-500/50 group-hover:border-emerald-400',
                      ice: 'border-cyan-400/50 group-hover:border-cyan-300',
                      monster: 'border-purple-500/50 group-hover:border-purple-400'
                    };
                    const innerBorderClass = elementInnerBorderClasses[activePartner.type] || 'border-amber-500/50 group-hover:border-amber-400';

                    return (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className={`fixed bottom-24 md:bottom-8 left-4 md:left-8 z-[9999] w-[calc(100vw-32px)] md:w-[320px] bg-zinc-950/95 border rounded-2xl p-3 flex flex-col gap-3 transition-all duration-300 group pointer-events-auto ${glowClass}`}
                        >
                            <div className="flex items-center gap-3 w-full">
                                <div className={`relative w-14 h-14 rounded-full overflow-hidden border-2 bg-black flex-shrink-0 transition-colors shadow-inner ${innerBorderClass}`}>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/40 to-transparent opacity-50 pointer-events-none" />
                                    <NextImage src={`/images/creatures/${activePartner.filename}`} alt={activePartner.name} fill className="object-contain p-1 relative z-10" />
                                    <div className="absolute inset-0 bg-amber-500/20 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-amber-400 font-bold text-sm flex items-center justify-between">
                                        {activePartner.name}
                                        <span className="flex text-yellow-400 drop-shadow-md">
                                            {Array.from({ length: Math.min(5, bondLevel) }).map((_, i) => (
                                                <Star key={i} className="w-3 h-3 fill-current" />
                                            ))}
                                        </span>
                                    </h3>
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mt-0.5">Active Partner</p>
                                </div>
                            </div>
                            <div className="w-full bg-zinc-950 rounded-xl p-2 border border-white/5">
                                <div className="flex justify-between text-[10px] mb-1 font-bold">
                                    <span className="text-amber-500/90 tracking-wide uppercase">Bond Progress</span>
                                    <span className="text-amber-400">{bondProgress} <span className="text-amber-600/70">/ 100</span></span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden shadow-inner relative">
                                    <div 
                                        className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-1000 ease-out relative"
                                        style={{ width: `${bondProgress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })()}

                {/* Stats Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
                >
                    {/* Total Quests Card */}
                    <Card className="bg-zinc-950 border-amber-900/50  shadow-xl overflow-hidden relative group hover:shadow-2xl hover:shadow-purple-500/10 transition-all">
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
                    <Card className="bg-zinc-950 border-amber-900/50  shadow-xl overflow-hidden relative group hover:shadow-2xl hover:shadow-blue-500/10 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-5 md:p-6 relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-sm text-blue-200/70 font-medium uppercase tracking-wider">{TEXT_CONTENT.dailyHub.stats.level.label.replace('{level}', String(stats.level))}</p>
                                    <div className="flex items-baseline gap-2">
                                        <AnimatedNumber value={stats.experience} className="text-2xl font-bold text-white" />
                                        <span className="text-sm text-blue-400">{TEXT_CONTENT.dailyHub.stats.level.xp.replace('{max}', String(stats.experienceToNextLevel))}</span>
                                    </div>
                                </div>
                                <div className="h-12 w-12 flex items-center justify-center bg-blue-950/30 rounded-full border border-blue-900/50 text-2xl">
                                    ⭐
                                </div>
                            </div>
                            <div className="mt-2 h-2 bg-zinc-950 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
                                    style={{ width: `${(stats.experience / stats.experienceToNextLevel) * 100}%` }}
                                />
                            </div>

                            {/* Chronicles Chapter Progress */}
                            {(() => {
                                const nextChapter = getNextChapter(stats.level);
                                if (!nextChapter) return null;
                                const currentChapterData = getCurrentChapter(stats.level);
                                const totalLevelsInChapter = nextChapter.levelRequirement - currentChapterData.levelRequirement;
                                const levelsCompletedInChapter = stats.level - currentChapterData.levelRequirement;
                                const chapterProgress = (levelsCompletedInChapter / totalLevelsInChapter) * 100;
                                const levelsRemaining = nextChapter.levelRequirement - stats.level;
                                return (
                                    <div className="mt-4 pt-3 border-t border-zinc-900/60 space-y-1.5">
                                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                                            <span className="font-serif">Next Chapter: <strong className="text-amber-400/90">{nextChapter.title}</strong></span>
                                            <span className="font-mono text-[9px]">{levelsRemaining} lvl to go</span>
                                        </div>
                                        <div className="relative h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-amber-900/20">
                                            <div
                                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-700 to-amber-500 transition-all duration-1000 ease-out"
                                                style={{ width: `${chapterProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>

                    {/* Gold Card with Weekly Stats */}
                    <Card className="bg-zinc-950 border-amber-900/50  shadow-xl overflow-hidden relative group hover:shadow-2xl hover:shadow-yellow-500/10 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-5 md:p-6 relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex-1">
                                    <p className="text-sm text-yellow-200/70 font-medium uppercase tracking-wider">{TEXT_CONTENT.dailyHub.stats.treasury.title}</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-yellow-950 border border-yellow-700/50 flex items-center justify-center text-xl shadow-inner shadow-yellow-900/50">
                                            🪙
                                        </div>
                                        <AnimatedNumber value={stats.gold} formatFn={formatGold} className="text-3xl font-bold text-white" title={`${stats.gold} Gold`} />
                                        <span className="text-sm text-yellow-500">{TEXT_CONTENT.dailyHub.stats.treasury.unit}</span>
                                    </div>
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

                {/* Challenges & Active Perks Section (Grid Layout) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                    <div className="lg:col-span-2 h-full">
                        <WeeklyChallengesCard quests={favoritedQuests} weeklyGoldEarned={weeklyGoldEarned} />
                    </div>
                    
                    {/* ACTIVE PERKS WIDGET */}
                    <div className="lg:col-span-1">
                        <Card className="bg-zinc-950 border-amber-900/40  h-full flex flex-col justify-between">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-medieval text-amber-500 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-400" />
                                    <span>Active Buffs</span>
                                </CardTitle>
                                <CardDescription className="text-zinc-400 text-xs">
                                    Temporary passive bonuses currently active
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                {activePerks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-center py-8 h-full space-y-4">
                                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-amber-900/20 flex items-center justify-center text-xl">
                                            🧪
                                        </div>
                                        <div>
                                            <p className="text-sm text-zinc-300 font-semibold">No active buffs</p>
                                            <p className="text-xs text-zinc-500 mt-1 max-w-[200px] mx-auto">
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
                                        {Array.isArray(activePerks) && activePerks.map((perk, index) => {
                                            const totalDuration = perk.created_at ? (new Date(perk.expires_at).getTime() - new Date(perk.created_at).getTime()) : (24 * 60 * 60 * 1000);
                                            const remaining = new Date(perk.expires_at).getTime() - Date.now();
                                            const progress = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));

                                            return (
                                                <div key={perk.id || index} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800/80 flex flex-col gap-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">🧪</span>
                                                            <div>
                                                                <h5 className="font-bold text-xs text-amber-100">{perk.perk_name}</h5>
                                                                <p className="text-[10px] text-zinc-400 mt-0.5">{perk.effect}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-900/30 px-2 py-1 rounded-full shrink-0">
                                                            <Clock className="w-3 h-3 animate-spin duration-3000" />
                                                            <span>{getPerkTimeRemaining(perk.expires_at)}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Progress bar */}
                                                    <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>

                {/* New Player Progress */}
                <NewPlayerProgress />

                {/* Gameplay Loop Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="relative"
                >
                    <Card className="bg-zinc-950 border-amber-900/40  overflow-hidden">
                        <CardContent className="p-6 md:p-8">
                            <h2 className="text-xl md:text-2xl font-bold text-amber-500 font-medieval tracking-wide mb-6">How to Build Habits</h2>

                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                {/* Left Side: Steps List */}
                                <div className="flex-1 space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 font-bold border border-amber-700/50">1</div>
                                        <div>
                                            <h3 className="text-amber-400 font-bold text-lg mb-1">Daily Habits</h3>
                                            <p className="text-sm text-zinc-300 leading-relaxed">Completing tasks to earn resources.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 font-bold border border-amber-700/50">2</div>
                                        <div>
                                            <h3 className="text-amber-400 font-bold text-lg mb-1">Expanding Realm</h3>
                                            <p className="text-sm text-zinc-300 leading-relaxed">Using resources to grow your map.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 font-bold border border-amber-700/50">3</div>
                                        <div>
                                            <h3 className="text-amber-400 font-bold text-lg mb-1">Daily Kingdom</h3>
                                            <p className="text-sm text-zinc-300 leading-relaxed">Managing and maintaining your new territory.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 font-bold border border-amber-700/50">4</div>
                                        <div>
                                            <h3 className="text-amber-400 font-bold text-lg mb-1">Competitive Allies</h3>
                                            <p className="text-sm text-zinc-300 leading-relaxed">Engaging with friends and rivals.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 font-bold border border-amber-700/50">5</div>
                                        <div>
                                            <h3 className="text-amber-400 font-bold text-lg mb-1">Building Character</h3>
                                            <p className="text-sm text-zinc-300 leading-relaxed">Leveling up your personal stats based on progress.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Image */}
                                <div className="flex-1 w-full max-w-md">
                                    <div className="relative aspect-square rounded-xl overflow-hidden border border-amber-900/30 shadow-2xl bg-zinc-950">
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
                        <Button variant="outline" className="w-full h-auto py-4 md:py-5 flex flex-col items-center gap-2 bg-zinc-950 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group active:scale-95">
                            <ScrollText className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
                            <span className="text-amber-200 group-hover:text-white">{TEXT_CONTENT.dailyHub.actions.questBoard}</span>
                        </Button>
                    </Link>
                    <Link href="/kingdom" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 md:py-5 flex flex-col items-center gap-2 bg-zinc-950 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group active:scale-95">
                            <span className="text-2xl group-hover:scale-110 transition-transform">👑</span>
                            <span className="text-green-200 group-hover:text-white">{TEXT_CONTENT.dailyHub.actions.kingdom}</span>
                        </Button>
                    </Link>
                    <Link href="/realm" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 md:py-5 flex flex-col items-center gap-2 bg-zinc-950 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group active:scale-95">
                            <Map className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="text-blue-200 group-hover:text-white">{TEXT_CONTENT.dailyHub.actions.realm}</span>
                        </Button>
                    </Link>
                    <Link href="/quests?new=true" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 md:py-5 flex flex-col items-center gap-2 bg-zinc-950 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group active:scale-95">
                            <Plus className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform" />
                            <span className="text-purple-200 group-hover:text-white">{TEXT_CONTENT.dailyHub.actions.newQuest}</span>
                        </Button>
                    </Link>
                </motion.div>

                {/* Data Visualizations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.18 }}
                >
                    <ConsistencyChart />
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
                        <Card className="bg-zinc-950 border-amber-900/30 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-amber-950/30 rounded-full flex items-center justify-center mb-4">
                                    <ScrollText className="w-8 h-8 text-amber-700" />
                                </div>
                                <h3 className="text-xl font-bold text-amber-500 mb-2">{TEXT_CONTENT.dailyHub.favorites.empty.title}</h3>
                                <p className="text-zinc-400 max-w-md mb-6">
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
                <DialogContent
                    className="w-[min(90vw,400px)] max-h-[90vh] overflow-y-auto p-0 shadow-2xl rounded-2xl bg-gradient-to-b from-amber-950/90 via-zinc-950 to-zinc-950 border border-amber-700/30 shadow-amber-500/10 text-white animate-in zoom-in-95 duration-200"
                    role="dialog"
                    aria-label="yesterday-report-card-modal"
                >
                    {/* Hidden a11y header */}
                    <DialogHeader className="sr-only">
                        <DialogTitle>Yesterday&apos;s Report Card</DialogTitle>
                        <DialogDescription>Summary of your realm progress yesterday</DialogDescription>
                    </DialogHeader>

                    {/* Background glow */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-20 bg-amber-900/30" />
                    </div>

                    {/* Portrait & Title Section */}
                    <div className="relative z-10 flex flex-col items-center pt-10 pb-4 px-6">
                        <div className="relative group">
                            {/* Pulsing glow */}
                            <div className="absolute inset-0 rounded-full blur-3xl animate-pulse scale-150 opacity-20 bg-amber-900/30" />
                            {/* Rotating ring */}
                            <div
                                className="absolute -inset-4 border border-dashed rounded-full opacity-30 text-amber-400 border-amber-500"
                                style={{ animation: 'spin 15s linear infinite' }}
                            />
                            {/* Portrait circle */}
                            <div className="relative w-36 h-36 rounded-full border-4 shadow-2xl overflow-hidden p-1 bg-zinc-900 border-amber-700/30 group-hover:scale-105 transition-transform duration-500">
                                <div className="relative w-full h-full rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-zinc-950">
                                    <NextImage
                                        src="/images/placeholders/report_scroll.png"
                                        alt="Yesterday's Report Card"
                                        fill
                                        className="object-cover p-1 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 pointer-events-none" />
                                </div>
                            </div>
                            {/* Sparkle decorations */}
                            <Sparkles className="absolute -top-3 -right-3 w-5 h-5 animate-pulse opacity-60 text-amber-400" />
                            <Wind className="absolute -bottom-2 -left-3 w-5 h-5 animate-pulse opacity-40 text-amber-400" style={{ animationDelay: '0.5s' }} />
                        </div>

                        {/* Name & description */}
                        <h2 className="mt-6 text-2xl font-serif font-semibold text-center text-amber-400">
                            Yesterday&apos;s Report Card
                        </h2>
                        <p className="mt-2 text-zinc-300/80 text-sm leading-relaxed text-center">
                            Summary of your yesterday&apos;s achievements in the realm.
                        </p>
                    </div>

                    {/* Report Data Grid */}
                    <div className="relative z-10 px-6 pb-6">
                        {yesterdayReport && (yesterdayReport.completedQuestsCount > 0 || yesterdayReport.goldEarned > 0 || yesterdayReport.milestonesUnlocked > 0) ? (
                            <div className="space-y-4">
                                <p className="text-center text-xs text-amber-200/80 font-mono tracking-wide uppercase">
                                    ⚔️ excellent progress on your path to glory ⚔️
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-zinc-900 p-3 rounded-xl border border-amber-900/20 text-center ">
                                        <div className="text-2xl font-bold text-amber-400">⚔️ {yesterdayReport.completedQuestsCount}</div>
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Quests Done</div>
                                    </div>
                                    <div className="bg-zinc-900 p-3 rounded-xl border border-amber-900/20 text-center ">
                                        <div className="text-2xl font-bold text-yellow-500">🪙 {yesterdayReport.goldEarned}</div>
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Gold Gained</div>
                                    </div>
                                    <div className="bg-zinc-900 p-3 rounded-xl border border-amber-900/20 text-center ">
                                        <div className="text-2xl font-bold text-blue-400">⭐ {yesterdayReport.xpEarned}</div>
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase mt-1">XP Gained</div>
                                    </div>
                                    <div className="bg-zinc-900 p-3 rounded-xl border border-amber-900/20 text-center ">
                                        <div className="text-2xl font-bold text-purple-400">🏆 {yesterdayReport.milestonesUnlocked}</div>
                                        <div className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Milestones</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 py-5 text-center bg-zinc-900/40 border border-amber-900/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />
                                <div className="text-4xl mb-1 animate-pulse">💤</div>
                                <p className="text-sm font-serif text-zinc-300 italic max-w-xs mx-auto leading-relaxed">
                                    &quot;Yesterday was a peaceful rest day, with no active quests completed.&quot;
                                </p>
                                <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-700/30 to-transparent mx-auto my-1" />
                                <p className="text-[10px] text-amber-400 font-bold tracking-widest uppercase animate-pulse">
                                    Today is a new day! Conquest awaits!
                                </p>
                            </div>
                        )}

                        {/* Daily Chronicle (Passive Generation & Weather) */}
                        <div className="mt-6 pt-5 border-t border-amber-900/30">
                            <h3 className="text-[11px] uppercase tracking-widest text-amber-500/70 text-center mb-3 font-semibold">Overnight Chronicle</h3>
                            <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800/50 flex flex-col gap-3">
                                {yesterdayReport && (
                                    <div className="flex items-start gap-3 pb-3 border-b border-zinc-800/80">
                                        <div className="w-8 h-8 rounded-full bg-amber-900/30 flex items-center justify-center shrink-0 border border-amber-700/50">
                                            <span className="text-lg">📜</span>
                                        </div>
                                        <p className="text-xs text-amber-200/90 italic font-serif leading-relaxed">
                                            &quot;{getLoreSummary()}&quot;
                                        </p>
                                    </div>
                                )}
                                {(() => {
                                    const activePartner = citizens.find(c => c.id === activePartnerId);
                                    if (activePartner) {
                                        const bondLevel = Math.floor(activePartner.affection / 100) + 1;
                                        return (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center shrink-0 border border-purple-700/50">
                                                    <span className="text-lg">💖</span>
                                                </div>
                                                <p className="text-sm text-zinc-300">
                                                    Your partner <strong className="text-purple-400">{activePartner.name}</strong> is currently at <strong className="text-purple-400">Bond Level {bondLevel}</strong>. Keep completing quests to grow your bond!
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                
                                {citizensReadyCount > 0 ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-900/30 flex items-center justify-center shrink-0 border border-amber-700/50">
                                            <span className="text-lg">🪙</span>
                                        </div>
                                        <p className="text-sm text-zinc-300">
                                            Your Citizens are awake! You have <strong className="text-amber-400">{citizensReadyCount} {citizensReadyCount === 1 ? 'Citizen' : 'Citizens'}</strong> ready to be harvested in the Kingdom.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-800">
                                            <span className="text-lg opacity-50">💤</span>
                                        </div>
                                        <p className="text-sm text-zinc-500">
                                            Your Citizens are resting or still gathering resources. Check back later!
                                        </p>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center shrink-0 border border-blue-700/50">
                                        <span className="text-lg">☀️</span>
                                    </div>
                                    <p className="text-sm text-zinc-300">
                                        Current Kingdom Weather is based on your recent momentum. Visit the Realm to see the sky!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action button */}
                    <div className="relative z-10 flex flex-col gap-2 px-6 pb-6">
                        <Button
                            className="w-full h-11 text-white rounded-xl bg-amber-600 hover:bg-amber-500 shadow-lg font-bold transition-all"
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
