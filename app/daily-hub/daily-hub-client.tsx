"use client"

import { logger } from "@/lib/logger";
import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { unwrapApiResponse } from "@/lib/api-response-unwrapper"
import QuestCard from "@/components/quest-card"
import { toast } from "sonner"
import { HeaderSection } from "@/components/HeaderSection"
import { ArrowLeft, ArrowRight, Loader2, TrendingUp, Sparkles, ScrollText, Flame, Map, Plus, Clock, Wind, Star } from "lucide-react"
import { useGameStore } from "@/stores/game-store"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatGold } from "@/lib/utils"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { motion } from "framer-motion"
import { TEXT_CONTENT } from "@/lib/text-content"
import { NewPlayerProgress } from "@/components/onboarding/NewPlayerProgress"
import { useCitizensStore, isHarvestReady } from "@/stores/citizensStore"
import confetti from 'canvas-confetti'
import { hapticHeavy, hapticMedium } from '@/lib/haptics'
import dynamic from 'next/dynamic'
const WeeklyChallengesCard = dynamic(
  () => import('@/components/weekly-challenges-card').then((mod) => mod.WeeklyChallengesCard),
  { ssr: false }
)
const ChroniclesCard = dynamic(
  () => import('@/components/chronicles-card').then((mod) => mod.ChroniclesCard),
  { ssr: false }
)
const ConsistencyChart = dynamic(
  () => import('@/components/consistency-chart').then((mod) => mod.ConsistencyChart),
  { ssr: false, loading: () => <div className="animate-pulse h-40 bg-zinc-900 rounded-xl border border-zinc-800" /> }
)
const DailyRoutineModal = dynamic(
  () => import('@/components/daily-routine-modal').then((mod) => mod.DailyRoutineModal),
  { ssr: false }
)
import NextImage from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getCurrentChapter, getNextChapter } from "@/lib/chronicles-data"
import { HabitGuardian } from "@/components/kingdom/habit-guardian"
import { ActiveTimersLedger } from "@/components/active-timers-ledger"
import { StreakRecoveryCard } from "@/components/streaks/streak-recovery-card"
import { getUserAlliances, checkInToAlliance, Alliance } from "@/lib/alliance-manager"
import { useToast } from "@/components/ui/use-toast"
import { useSound, SOUNDS, playSFX } from "@/lib/sound-manager"
import { CheckCircle2, Shield } from "lucide-react"
import { MedievalOrbIcon } from "@/components/ui/medieval-orb-icon"
import { generatePack } from "@/lib/pack-generator"
import { saveOwnedPack, OwnedPack } from "@/lib/owned-packs-service"

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

const POSSIBLE_BUFFS = [
    {
        id: 'potion-exp',
        name: 'Exp draught',
        effect: '+25% quest EXP',
        durationHours: 2,
        icon: '🧪'
    },
    {
        id: 'potion-gold',
        name: 'Gold surge',
        effect: '+20% habit gold',
        durationHours: 4,
        icon: '🍯'
    },
    {
        id: 'potion-focus',
        name: 'Focus tonic',
        effect: '+15% dungeon attack',
        durationHours: 2,
        icon: '⚡'
    },
    {
        id: 'potion-sage',
        name: 'Sage brew',
        effect: '+10% expedition essences',
        durationHours: 6,
        icon: '🍵'
    }
]

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
        archetype?: string;
    } | null>(null)

    // Active Perks State & Timer
    const [activePerks, setActivePerks] = useState<any[]>([])
    const [timeState, setTimeState] = useState(Date.now())
    const [rival, setRival] = useState<{ displayName: string; xpDifference: number } | null>(null)

    // Citizens State
    const citizens = useCitizensStore(state => state.citizens);
    const loadCitizens = useCitizensStore(state => state.loadCitizens);
    const citizensReadyCount = useMemo(() => citizens.filter(isHarvestReady).length, [citizens, timeState]);

    useEffect(() => {
        if (!user) return;

        loadCharacterStats()
        loadFavoritedQuests()
        loadWeeklyGoldStats()
        loadActivePerks()
        loadCitizens(user.id)

        const handleStatsUpdate = () => {
            loadCharacterStats();
            loadWeeklyGoldStats();
        };

        window.addEventListener('character-stats-update', handleStatsUpdate);
        return () => {
            window.removeEventListener('character-stats-update', handleStatsUpdate);
        };
    }, [user])

    // Trigger confetti explosion on 5/10 habit target sweet spot
    useEffect(() => {
        const count = completedQuestIds.size;
        if (count === 5 || count === 10 || count === 15 || count === 20) {
            try {
                hapticHeavy();
                confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            } catch (e) {
                // Fail-safe
            }
        }
    }, [completedQuestIds.size])

    useEffect(() => {
        const loadRivalStats = async () => {
            if (!user?.id || !stats.experience) return;
            try {
                const res = await fetch('/api/leaderboard?sortBy=experience&limit=100');
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && Array.isArray(json.data)) {
                        const myIndex = json.data.findIndex((item: any) => item.userId === user.id);
                        if (myIndex > 0) {
                            const rivalItem = json.data[myIndex - 1];
                            const diff = (rivalItem.value || 0) - stats.experience;
                            if (diff > 0) {
                                setRival({
                                    displayName: rivalItem.displayName,
                                    xpDifference: diff
                                });
                            } else {
                                setRival(null);
                            }
                        } else {
                            setRival(null);
                        }
                    }
                }
            } catch (error) {
                logger.error('Failed to load rival stats:', error);
            }
        };
        loadRivalStats();
    }, [user?.id, stats.experience]);

    const isAtRisk = useMemo(() => {
        if (stats.streakDays <= 0) return false;
        const hasCompletedToday = favoritedQuests.some(q => q.completed);
        if (hasCompletedToday) return false;
        const currentHour = new Date(timeState).getHours();
        return currentHour >= 18; // After 6 PM local time
    }, [stats.streakDays, favoritedQuests, timeState]);

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

    const [activatingBuffId, setActivatingBuffId] = useState<string | null>(null)

    const handleActivateBuff = async (buff: typeof POSSIBLE_BUFFS[0]) => {
        setActivatingBuffId(buff.id)
        try {
            // Check and consume item from inventory if available
            try {
                const invRes = await fetch('/api/inventory')
                if (invRes.ok) {
                    const invJson = await invRes.json()
                    const invData: any = unwrapApiResponse(invJson) || []
                    const items = Array.isArray(invData) ? invData : (invData.items || [])
                    const match = items.find((i: any) => 
                        i.id === buff.id || 
                        i.name?.toLowerCase().includes(buff.name.toLowerCase())
                    )
                    if (match && (match.quantity || 1) > 0) {
                        await fetch('/api/inventory', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ itemId: match.id, quantity: 1 })
                        })
                    }
                }
            } catch (err) {
                logger.warn('Inventory check during buff activation:', err)
            }

            // Post to active perks
            const expiresAt = new Date(Date.now() + buff.durationHours * 60 * 60 * 1000).toISOString()
            const res = await fetch('/api/active-perks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    perk_name: buff.name,
                    effect: buff.effect,
                    expires_at: expiresAt
                })
            })

            // Sync to localStorage as reliable fallback
            try {
                const stored = localStorage.getItem('active-potion-perks') || '{}'
                const perks = JSON.parse(stored)
                perks[buff.name] = { effect: buff.effect, expiresAt }
                localStorage.setItem('active-potion-perks', JSON.stringify(perks))
            } catch (err) {
                logger.warn('Error saving active perk to localStorage:', err)
            }

            toast.success(`${buff.name} activated! ${buff.effect} for ${buff.durationHours} hours.`)
            await loadActivePerks()
        } catch (error) {
            logger.error('Failed to activate buff:', error)
            toast.error('Failed to activate buff. Please try again.')
        } finally {
            setActivatingBuffId(null)
        }
    }

    const loadCharacterStats = async () => {
        try {
            const response = await fetchWithAuth('/api/character-stats')
            if (response.ok) {
                const rawJson = await response.json()
                const data: any = unwrapApiResponse(rawJson)
                if (data) {
                    setStats({
                        level: data.level || data.stats?.level || 1,
                        experience: data.experience || data.stats?.experience || 0,
                        experienceToNextLevel: data.experienceToNextLevel || 100,
                        gold: data.gold || data.stats?.gold || 0,
                        streakDays: data.streakDays || 0
                    })
                }

                // Trigger random encounter check for daily login
                try {
                  const { checkAndTriggerEncounter } = await import('@/lib/encounter-trigger-service');
                  checkAndTriggerEncounter('login');
                } catch (e) {
                  logger.warn('Login encounter check error:', e);
                }
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
                const data: any = unwrapApiResponse(result)
                const transactions: GoldTransaction[] = Array.isArray(data) ? data : (data?.data || data?.transactions || [])

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

            let favoriteIds: string[] = []
            try {
                const favoritesResponse = await fetchWithAuth('/api/quests/favorites')
                if (favoritesResponse.ok) {
                    const favoritesData = await favoritesResponse.json()
                    const favUnwrapped: any = unwrapApiResponse(favoritesData)
                    favoriteIds = favUnwrapped?.favorites || (Array.isArray(favUnwrapped) ? favUnwrapped : [])
                }
            } catch (err) {
                logger.warn('Failed to fetch favorite ids:', err)
            }

            const questsResponse = await fetchWithAuth(`/api/quests?t=${Date.now()}`)
            if (questsResponse.ok) {
                const questsData = await questsResponse.json()
                const questsUnwrapped: any = unwrapApiResponse(questsData)
                const allQuests = Array.isArray(questsUnwrapped) ? questsUnwrapped : (questsUnwrapped?.quests || [])

                const favoritedQuestSet = new Set(
                    favoriteIds.map((id: any) => String(id).toLowerCase())
                )

                let favoriteQuests = allQuests.filter((q: any) => {
                    const idLower = String(q.id || '').toLowerCase()
                    const nameLower = String(q.name || q.title || '').toLowerCase()
                    return favoritedQuestSet.has(idLower) || favoritedQuestSet.has(nameLower)
                })

                if (favoriteQuests.length === 0 && allQuests.length > 0) {
                    favoriteQuests = allQuests.slice(0, 6)
                } else {
                    favoriteQuests = favoriteQuests.slice(0, 6)
                }

                const mappedFavoriteQuests = favoriteQuests.map((q: any) => ({
                    ...q,
                    difficulty: ['easy', 'medium', 'hard', 'epic'].includes(q.difficulty) ? q.difficulty : 'medium'
                }))

                setFavoritedQuests(mappedFavoriteQuests)

                const completed = new Set<string>()
                allQuests.forEach((q: any) => {
                    if (q.completed) completed.add(q.id)
                })
                setCompletedQuestIds(completed)
            }
        } catch (error) {
            logger.error('Error loading favorited quests, retaining local cache:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCompleteQuest = async (quest: Quest) => {
        if (completedQuestIds.has(quest.id)) return

        // Immediate Optimistic Update
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        const nextCount = completedQuestIds.size + 1;
        if (nextCount === 5) {
            toast.success("🔥 5/10 Daily Habit Target Hit! +25% Gold & Essences Streak Multiplier Unlocked!");
        }
        setCompletedQuestIds(prev => new Set(prev).add(quest.id))
        setFavoritedQuests(prev => prev.map(q =>
            q.id === quest.id ? { ...q, completed: true } : q
        ))

        try {
            fetchWithAuth('/api/quests/smart-completion', {
                method: 'POST',
                body: JSON.stringify({ questId: quest.id, completed: true })
            }).catch(err => {
                logger.warn('[Daily Hub] Smart completion network error, retaining optimistic state:', err);
            });

            setTimeout(() => {
                loadCharacterStats()
                loadWeeklyGoldStats()
            }, 1000)
        } catch (error) {
            logger.error('Failed to complete quest server sync:', error)
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
        const name = user?.firstName || "Jilles"
        if (hour < 5) return `Good night, ${name}`
        if (hour < 12) return `Good morning, ${name}`
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
        <div className="min-h-screen bg-black pb-20 relative">
            {/* Mobile Back Button (Point 24) */}
            <div className="absolute top-4 left-4 z-50 md:hidden">
              <Link href="/kingdom">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="bg-black/60 backdrop-blur-md border border-amber-900/30 text-amber-500 hover:text-amber-400 text-xs font-bold"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Kingdom
                </Button>
              </Link>
            </div>

            {/* Header Section with CTA */}
            <HeaderSection
                title={getTimeBasedGreeting()}
                subtitle="Build habits daily to grow your kingdom!"
                imageSrc="/images/headers/daily-hub-hero.webp"
                defaultBgColor="bg-gradient-to-b from-amber-900/40 to-black"
                className="h-[300px] md:h-[400px]"
                shouldRevealImage={true}
                ctaButton={
                    <Link href="/kingdom">
                        <Button
                            size="lg"
                            className="btn-primary-cta"
                        >
                            <span className="text-xl mr-2">👑</span>
                            {TEXT_CONTENT.dailyHub.header.cta}
                        </Button>
                    </Link>
                }
            />

            {/* Spacing between header and content */}
            <div className="h-16 md:h-8" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 md:-mt-20 relative z-10 space-y-6 md:space-y-8">
                <StreakRecoveryCard />

                {/* BENTO ROW 1 — Expedition command & core momentum */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    {/* Bento Tile 1A: Hero companion & morning focus */}
                    <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-gradient-to-b from-zinc-950 via-zinc-950/95 to-amber-950/20 border border-amber-900/40 p-5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                        {/* Top banner: Streak badge */}
                        <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🔥</span>
                                <div>
                                    <h3 className="text-sm font-bold font-serif text-amber-300">Expedition companion</h3>
                                    <p className="text-[11px] text-zinc-400">Daily synergy & focus</p>
                                </div>
                            </div>
                            {stats.streakDays > 0 && (() => {
                                const days = stats.streakDays;
                                let badgeClass = "bg-orange-950/40 border-orange-500/30 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.25)]";
                                let flameClass = "text-orange-500";
                                let streakTitle = "Streak";
                                
                                if (days >= 10) {
                                  badgeClass = "bg-cyan-950/60 border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.5)] animate-pulse";
                                  flameClass = "text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]";
                                  streakTitle = "Celestial streak";
                                } else if (days >= 4) {
                                  badgeClass = "bg-amber-950/50 border-amber-400/40 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.4)]";
                                  flameClass = "text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]";
                                  streakTitle = "Golden streak";
                                }
                                
                                return (
                                  <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold font-mono transition-all", badgeClass)} title={`${streakTitle}: ${days} days`}>
                                      <Flame className={cn("w-3.5 h-3.5 animate-bounce", flameClass)} style={{ animationDuration: '2s' }} />
                                      <span>Day {days} streak</span>
                                  </div>
                                );
                            })()}
                        </div>

                        {/* Streak Warning if at risk */}
                        {isAtRisk && (
                            <div className="mb-4 border border-red-500/30 bg-red-950/30 rounded-xl p-3 flex items-center justify-between gap-3 relative z-10">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl animate-bounce">⚠️</span>
                                    <div>
                                        <h4 className="font-bold text-red-400 text-xs">Streak shield cracking!</h4>
                                        <p className="text-[10px] text-zinc-300">Complete 1 quest before midnight to keep it burning.</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        const element = document.getElementById('favorites-section');
                                        if (element) element.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="bg-red-700 hover:bg-red-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg shrink-0"
                                >
                                    Do a quest
                                </Button>
                            </div>
                        )}

                        {/* Active Partner Creature */}
                        {(() => {
                            const activePartner = citizens.find(c => c.id === activePartnerId);
                            if (!activePartner) {
                                return (
                                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-amber-900/30 flex items-center gap-3 relative z-10 my-2">
                                        <div className="w-12 h-12 rounded-full bg-zinc-950 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                                            🐾
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xs font-bold text-zinc-300">No companion assigned</h4>
                                            <p className="text-[10px] text-zinc-500">Visit kingdom citizens to set an active companion.</p>
                                        </div>
                                        <Link href="/kingdom">
                                            <Button size="sm" variant="ghost" className="text-amber-400 text-xs hover:bg-amber-950/30">
                                                Assign
                                            </Button>
                                        </Link>
                                    </div>
                                );
                            }

                            const bondLevel = Math.floor(activePartner.affection / 100) + 1;
                            const bondProgress = activePartner.affection % 100;

                            const elementGlowClasses: Record<string, string> = {
                              fire: 'border-red-900/60 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
                              water: 'border-blue-900/60 shadow-[0_0_20px_rgba(59,130,246,0.15)]',
                              earth: 'border-amber-900/60 shadow-[0_0_20px_rgba(217,119,6,0.15)]',
                              nature: 'border-emerald-900/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
                              ice: 'border-cyan-900/60 shadow-[0_0_20px_rgba(34,211,238,0.15)]',
                              monster: 'border-purple-900/60 shadow-[0_0_20px_rgba(147,51,234,0.15)]'
                            };
                            const glowClass = elementGlowClasses[activePartner.type] || 'border-amber-700/50 shadow-md';

                            return (
                                <div className={`p-3.5 rounded-xl bg-zinc-950/90 border flex flex-col gap-3 my-2 relative z-10 transition-all ${glowClass}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/50 bg-black shrink-0">
                                            <NextImage src={`/images/creatures/${activePartner.filename}`} alt={activePartner.name} fill className="object-contain p-1" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-xs text-amber-300 truncate">{activePartner.name}</h4>
                                                <span className="flex text-yellow-400">
                                                    {Array.from({ length: Math.min(5, bondLevel) }).map((_, i) => (
                                                        <Star key={i} className="w-3 h-3 fill-current" />
                                                    ))}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-zinc-400">Level {bondLevel} companion</p>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900/80 rounded-lg p-2 border border-white/5">
                                        <div className="flex justify-between text-[10px] font-bold mb-1">
                                          <span className="text-zinc-400 font-serif">Bond progress</span>
                                          <span className="text-amber-400 font-mono">{bondProgress} / 100</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                                          <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-700" style={{ width: `${bondProgress}%` }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Morning Focus Target Ring & Progress */}
                        {(() => {
                            const count = completedQuestIds.size;
                            const targetProgress = Math.min(100, Math.round((count / 5) * 100));

                            let tier = null;
                            if (count >= 20) tier = { title: "dedication", badge: "👑", desc: "Turtoisy slowly nods with deep respect: 20 habits mastered. Even mountains bow to such patience." };
                            else if (count >= 15) tier = { title: "supercharged progress", badge: "⚡", desc: "Sparky zaps with excitement: 15 habits finished! Electric momentum across the realm." };
                            else if (count >= 10) tier = { title: "awesome momentum", badge: "🔥", desc: "Flamio tosses firecrackers in the air: 10 habits glowing hot! You're on a roll." };
                            else if (count >= 5) tier = { title: "great start (5/5 target!)", badge: "🎯", desc: "Spirit Sprite bursts into golden sparkles: 5 habits done! Today's sweet spot achieved." };

                            return (
                                <div className="mt-2 space-y-2 relative z-10">
                                    <div className="rounded-xl border border-amber-500/30 bg-zinc-900/80 p-3 flex flex-col gap-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <MedievalOrbIcon color={count >= 5 ? "gold" : "green"} size="sm">
                                                    🎯
                                                </MedievalOrbIcon>
                                                <span className="font-bold text-xs text-white font-serif">Morning focus target</span>
                                            </div>
                                            <span className="text-[10px] bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                                                {count >= 5 ? '🎯 Target achieved!' : `${count}/5 habits`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                                                <div className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-300 transition-all duration-700 ease-out" style={{ width: `${targetProgress}%` }} />
                                            </div>
                                            <span className="font-mono text-xs font-bold text-amber-400 shrink-0">{targetProgress}%</span>
                                        </div>
                                    </div>

                                    {tier && (
                                        <div className="p-2.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/60 to-zinc-900 text-amber-200 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{tier.badge}</span>
                                                <div>
                                                    <h5 className="font-bold text-xs capitalize text-white">{tier.title}</h5>
                                                    <p className="text-[10px] text-zinc-300 line-clamp-1">{tier.desc}</p>
                                                </div>
                                            </div>
                                            <span className="px-2 py-0.5 bg-black/40 rounded-full text-[10px] font-mono shrink-0">
                                                {count} done
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Bento Tile 1B: Core realm momentum & stats */}
                    <div className="lg:col-span-7 flex flex-col justify-between gap-4">
                        {/* 3 Balanced Metric Tiles */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
                            {/* Habits today card */}
                            <Card className="bg-zinc-950 border-amber-900/40 shadow-xl overflow-hidden relative group hover:border-purple-500/40 transition-all flex flex-col justify-between">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/15 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-5 relative z-10 flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs text-purple-200/70 font-medium uppercase tracking-wider">Habits today</p>
                                            <span className="text-xl">⚔️</span>
                                        </div>
                                        <div className="flex items-baseline gap-2 mt-2">
                                            <span className="text-4xl font-bold text-white font-mono">{completedQuestIds.size}</span>
                                            <span className="text-xs text-purple-400">done today</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between text-[11px] text-zinc-400">
                                        <span>Daily target</span>
                                        <span className="text-amber-400 font-mono font-bold">5 habits</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Level card */}
                            <Card className="bg-zinc-950 border-amber-900/40 shadow-xl overflow-hidden relative group hover:border-blue-500/40 transition-all flex flex-col justify-between">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/15 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-5 relative z-10 flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs text-blue-200/70 font-medium uppercase tracking-wider">Level {stats.level}</p>
                                            {/* Avatar with circular ring */}
                                            <div className="relative h-10 w-10 flex items-center justify-center shrink-0">
                                                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                                    <circle cx="20" cy="20" r="16" className="stroke-zinc-900" strokeWidth="2.5" fill="transparent" />
                                                    <circle
                                                        cx="20"
                                                        cy="20"
                                                        r="16"
                                                        className="stroke-blue-500 drop-shadow-[0_0_4px_rgba(59,130,246,0.5)]"
                                                        strokeWidth="2.5"
                                                        fill="transparent"
                                                        strokeDasharray={2 * Math.PI * 16}
                                                        strokeDashoffset={2 * Math.PI * 16 * (1 - Math.min(1, stats.experience / stats.experienceToNextLevel))}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="h-7 w-7 rounded-full overflow-hidden border border-blue-900/40 bg-zinc-900 relative flex items-center justify-center">
                                                    {user?.imageUrl ? (
                                                        <NextImage src={user.imageUrl} alt="Avatar" fill sizes="28px" className="object-cover" />
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-blue-400">Lvl</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-1.5 mt-2">
                                            <AnimatedNumber value={stats.experience} className="text-2xl font-bold text-white font-mono" />
                                            <span className="text-xs text-blue-400">/ {stats.experienceToNextLevel} xp</span>
                                        </div>
                                        <div className="mt-2 h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500" style={{ width: `${(stats.experience / stats.experienceToNextLevel) * 100}%` }} />
                                        </div>
                                    </div>

                                    {/* Chronicles Chapter */}
                                    {(() => {
                                        const nextChapter = getNextChapter(stats.level);
                                        if (!nextChapter) return null;
                                        const currentChapterData = getCurrentChapter(stats.level);
                                        const totalLevelsInChapter = nextChapter.levelRequirement - currentChapterData.levelRequirement;
                                        const levelsCompletedInChapter = stats.level - currentChapterData.levelRequirement;
                                        const chapterProgress = (levelsCompletedInChapter / totalLevelsInChapter) * 100;
                                        const levelsRemaining = nextChapter.levelRequirement - stats.level;
                                        return (
                                            <div className="mt-3 pt-2.5 border-t border-zinc-900/60 space-y-1">
                                                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                                                    <span className="truncate">{nextChapter.title}</span>
                                                    <span className="font-mono text-[9px] text-amber-400 shrink-0">{levelsRemaining} lvl</span>
                                                </div>
                                                <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-500 transition-all duration-700" style={{ width: `${chapterProgress}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>

                            {/* Treasury card */}
                            <Card className="bg-zinc-950 border-amber-900/40 shadow-xl overflow-hidden relative group hover:border-yellow-500/40 transition-all flex flex-col justify-between">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/15 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-5 relative z-10 flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs text-yellow-200/70 font-medium uppercase tracking-wider">Treasury</p>
                                            <div className="w-8 h-8 rounded-full bg-yellow-950 border border-yellow-700/50 flex items-center justify-center text-sm shadow-inner">
                                                🪙
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2 mt-2">
                                            <AnimatedNumber value={stats.gold} formatFn={formatGold} className="text-3xl font-bold text-white font-mono" title={`${stats.gold} gold`} />
                                            <span className="text-xs text-yellow-500 font-semibold">gold</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-yellow-900/30 flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        <span className="text-[11px] text-emerald-400 font-medium">
                                            +{weeklyGoldEarned} gold this week
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Free Daily Mystery Chest Quick Claim Widget embedded in Row 1 */}
                        <DailyChestStatusWidget />
                    </div>
                </div>

                {/* How to build habits guide */}
                <Card className="bg-zinc-950 border-amber-900/40 overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                        <h2 className="text-xl md:text-2xl font-bold text-amber-500 font-medieval tracking-wide mb-6">How to build habits</h2>

                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            {/* Left Side: Steps List */}
                            <div className="flex-1 space-y-5">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 font-bold border border-amber-700/50">1</div>
                                    <div>
                                        <h3 className="text-amber-400 font-bold text-base mb-0.5">Daily habits</h3>
                                        <p className="text-xs text-zinc-300 leading-relaxed">Completing tasks to earn resources.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 font-bold border border-amber-700/50">2</div>
                                    <div>
                                        <h3 className="text-amber-400 font-bold text-base mb-0.5">Expanding realm</h3>
                                        <p className="text-xs text-zinc-300 leading-relaxed">Using resources to grow your map.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 font-bold border border-amber-700/50">3</div>
                                    <div>
                                        <h3 className="text-amber-400 font-bold text-base mb-0.5">Daily kingdom</h3>
                                        <p className="text-xs text-zinc-300 leading-relaxed">Managing and maintaining your new territory.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 font-bold border border-amber-700/50">4</div>
                                    <div>
                                        <h3 className="text-amber-400 font-bold text-base mb-0.5">Competitive friends</h3>
                                        <p className="text-xs text-zinc-300 leading-relaxed">Engaging with friends and rivals.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 font-bold border border-amber-700/50">5</div>
                                    <div>
                                        <h3 className="text-amber-400 font-bold text-base mb-0.5">Building character</h3>
                                        <p className="text-xs text-zinc-300 leading-relaxed">Leveling up your personal stats based on progress.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Image */}
                            <div className="flex-1 w-full max-w-md">
                                <div className="relative aspect-square rounded-xl overflow-hidden border border-amber-900/30 shadow-2xl bg-zinc-950">
                                    <NextImage
                                        src="/images/placeholders/gameplay-loop.webp"
                                        alt="Level up gameplay loop"
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

                {/* BENTO ROW 2 — Habit execution & active perks */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    {/* Bento Tile 2A: Favorite quests */}
                    <div id="favorites-section" className="lg:col-span-7 flex flex-col justify-between rounded-2xl bg-zinc-950/95 border border-amber-900/40 p-5 shadow-2xl">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-2xl">⚡</span>
                                    <div>
                                        <h3 className="text-lg font-bold text-amber-400 font-medieval tracking-wide">Favorite quests</h3>
                                        <p className="text-xs text-zinc-400">Your core daily priority quests</p>
                                    </div>
                                </div>
                                <Link href="/quests">
                                    <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 text-xs gap-1">
                                        View all <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                            </div>

                            {rival && (
                                <div className="mb-4 bg-zinc-900/60 border border-purple-900/40 rounded-xl p-3 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">👑</span>
                                        <span className="text-zinc-300">
                                            Your rival <strong className="text-purple-400">{rival.displayName}</strong> is only <strong className="text-yellow-400">{rival.xpDifference} XP</strong> ahead.
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-purple-300/80 font-bold uppercase tracking-wider bg-purple-950/40 px-2 py-0.5 rounded border border-purple-900/30 shrink-0">
                                        Close the gap!
                                    </span>
                                </div>
                            )}

                            {favoritedQuests.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-amber-900/30 p-8 flex flex-col items-center justify-center text-center">
                                    <ScrollText className="w-10 h-10 text-amber-700/60 mb-3" />
                                    <h4 className="text-sm font-bold text-amber-400 mb-1">No favorited habits yet</h4>
                                    <p className="text-xs text-zinc-400 max-w-sm mb-4">
                                        Favorite habits on your quest board to track and complete them here every morning.
                                    </p>
                                    <Link href="/quests">
                                        <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl">
                                            Pick favorite quests
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {favoritedQuests.map((quest, index) => (
                                        <motion.div
                                            key={quest.id}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 * index }}
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
                        </div>
                    </div>

                    {/* Bento Tile 2B: Active buffs & Alliance daily oath */}
                    <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                        {/* Active Buffs Card */}
                        <Card className="bg-zinc-950 border-amber-900/40 shadow-xl flex-1 flex flex-col justify-between">
                            <CardHeader className="pb-3 pt-4 px-5">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-medieval text-amber-400 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                        <span>Active buffs</span>
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                                        {activePerks.length} active
                                    </Badge>
                                </div>
                                <CardDescription className="text-zinc-400 text-xs">
                                    Temporary passive bonuses currently active
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-5 pb-5 pt-0 flex-1 flex flex-col justify-center">
                                {activePerks.length === 0 ? (
                                    <div className="space-y-3 flex-1 flex flex-col justify-between py-1">
                                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                                            <span className="font-medium text-amber-300/90">Possible enhancements</span>
                                            <span className="text-[10px] text-zinc-500">Tap to activate</span>
                                        </div>

                                        <div className="space-y-2">
                                            {POSSIBLE_BUFFS.map(buff => (
                                                <div
                                                    key={buff.id}
                                                    className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800/80 hover:border-amber-500/30 flex items-center justify-between gap-3 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-900/30 flex items-center justify-center text-base shrink-0">
                                                            {buff.icon}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h5 className="font-bold text-xs text-amber-100 truncate">{buff.name}</h5>
                                                            <p className="text-[10px] text-zinc-400 truncate">
                                                                {buff.effect} • {buff.durationHours}h
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleActivateBuff(buff)}
                                                        disabled={activatingBuffId === buff.id}
                                                        className="h-7 px-3 text-[11px] font-bold rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 active:scale-95 shrink-0 transition-all"
                                                    >
                                                        {activatingBuffId === buff.id ? "Activating..." : "Activate"}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-2 border-t border-zinc-900/80 flex items-center justify-between text-[11px]">
                                            <span className="text-zinc-500">Need more reagents?</span>
                                            <Link href="/inventory" className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
                                                Open backpack <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {Array.isArray(activePerks) && activePerks.map((perk, index) => {
                                            const totalDuration = perk.created_at ? (new Date(perk.expires_at).getTime() - new Date(perk.created_at).getTime()) : (24 * 60 * 60 * 1000);
                                            const remaining = new Date(perk.expires_at).getTime() - Date.now();
                                            const progress = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));

                                            return (
                                                <div key={perk.id || index} className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800/80 flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="text-xl">🧪</span>
                                                            <div>
                                                                <h5 className="font-bold text-xs text-amber-100">{perk.perk_name}</h5>
                                                                <p className="text-[10px] text-zinc-400">{perk.effect}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-900/30 px-2 py-0.5 rounded-full shrink-0">
                                                            <Clock className="w-3 h-3 animate-spin duration-3000" />
                                                            <span>{getPerkTimeRemaining(perk.expires_at)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                                                        <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000" style={{ width: `${progress}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Alliance Daily Oath Widget */}
                        <AllianceDailyOathWidget />
                    </div>
                </div>

                {/* BENTO ROW 3 — Growth, consistency & challenges */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    {/* Bento Tile 3A: Weekly Challenges */}
                    <div className="lg:col-span-7 h-full">
                        <WeeklyChallengesCard quests={favoritedQuests} weeklyGoldEarned={weeklyGoldEarned} />
                    </div>

                    {/* Bento Tile 3B: Consistency Chart & Active Timers */}
                    <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                        <div className="flex-1">
                            <ConsistencyChart />
                        </div>
                        <div>
                            <ActiveTimersLedger />
                        </div>
                    </div>
                </div>

                {/* Quick actions */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
                >
                    <Link href="/quests" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 md:py-5 flex flex-col items-center gap-2 bg-zinc-950 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group active:scale-95">
                            <ScrollText className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
                            <span className="text-amber-200 group-hover:text-white font-serif">{TEXT_CONTENT.dailyHub.actions.questBoard}</span>
                        </Button>
                    </Link>
                    <Link href="/kingdom" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 md:py-5 flex flex-col items-center gap-2 bg-zinc-950 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group active:scale-95">
                            <span className="text-2xl group-hover:scale-110 transition-transform">👑</span>
                            <span className="text-green-200 group-hover:text-white font-serif">{TEXT_CONTENT.dailyHub.actions.kingdom}</span>
                        </Button>
                    </Link>
                    <Link href="/realm" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 md:py-5 flex flex-col items-center gap-2 bg-zinc-950 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group active:scale-95">
                            <Map className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="text-blue-200 group-hover:text-white font-serif">{TEXT_CONTENT.dailyHub.actions.realm}</span>
                        </Button>
                    </Link>
                    <Link href="/quests?new=true" className="block">
                        <Button variant="outline" className="w-full h-auto py-4 md:py-5 flex flex-col items-center gap-2 bg-zinc-950 border-amber-900/30 hover:bg-amber-950/30 hover:border-amber-700/50 transition-all group active:scale-95">
                            <Plus className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform" />
                            <span className="text-purple-200 group-hover:text-white font-serif">{TEXT_CONTENT.dailyHub.actions.newQuest}</span>
                        </Button>
                    </Link>
                </motion.div>

                {/* Chronicles */}
                <div>
                    <ChroniclesCard currentLevel={stats.level} />
                </div>

                {/* Habit Guardian */}
                <HabitGuardian favoritedQuests={favoritedQuests} />

                {/* New Player Progress */}
                <NewPlayerProgress />
            </div>

            {/* Daily Opening Routine Sequence & Overnight Chronicle Modal (Unified) */}
            <DailyRoutineModal
                isOpen={showReportCard}
                onClose={() => setShowReportCard(false)}
                yesterdayStats={{
                    questsCompleted: yesterdayReport?.completedQuestsCount || completedQuestIds.size || 5,
                    streak: stats.streakDays || 7,
                    goldEarned: yesterdayReport?.goldEarned || (completedQuestIds.size || 5) * 15,
                    xpEarned: yesterdayReport?.xpEarned || 1205,
                    milestonesUnlocked: yesterdayReport?.milestonesUnlocked || 0,
                    archetype: yesterdayReport?.archetype || 'Adventurer',
                }}
                loreSummary={getLoreSummary()}
                activePartnerName={citizens.find(c => c.id === activePartnerId)?.name}
                activePartnerBond={(() => {
                    const partner = citizens.find(c => c.id === activePartnerId);
                    return partner ? Math.floor(partner.affection / 100) + 1 : 1;
                })()}
                citizensReadyCount={citizensReadyCount}
            />
        </div>
    )
}

function AllianceDailyOathWidget() {
  const { user } = useUser();
  const { toast } = useToast();
  const { playSound } = useSound();
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (user?.id) {
      getUserAlliances(user.id).then(data => {
        setAlliances(data || []);
        setLoading(false);
      });
    }
  }, [user?.id]);

  if (loading) return null;

  const myAlliance = alliances[0];

  if (!myAlliance) {
    return (
      <Card className="bg-gradient-to-r from-zinc-950 via-amber-950/20 to-zinc-950 border border-amber-900/30 shadow-xl p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
            🛡️
          </div>
          <div>
            <h4 className="font-bold text-amber-300 text-sm font-serif">Alliance Daily Oath</h4>
            <p className="text-xs text-zinc-400">Join an alliance to swear daily oaths and earn House Cup virtue rewards!</p>
          </div>
        </div>
        <Link href="/social">
          <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold rounded-xl text-xs whitespace-nowrap">
            Find Alliance
          </Button>
        </Link>
      </Card>
    );
  }

  const streak = myAlliance.myStreak?.current || 0;
  const checkedInToday = myAlliance.myStreak?.checkedInToday || false;

  const handleCheckIn = async () => {
    if (checkingIn || checkedInToday) return;
    setCheckingIn(true);
    const result = await checkInToAlliance(myAlliance.id);
    setCheckingIn(false);

    if (result.success) {
      playSound(SOUNDS.ALLIANCE_OATH);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      toast({
        title: "Alliance Oath Sworn! 🛡️",
        description: `You have fulfilled your daily oath for ${myAlliance.name}! Streak: ${result.streak || streak + 1} Days.`,
      });
      setAlliances(prev => prev.map(a => a.id === myAlliance.id ? {
        ...a,
        myStreak: { current: result.streak || streak + 1, checkedInToday: true, lastCheckIn: new Date().toISOString() }
      } : a));
    } else {
      toast({
        title: "Oath Status",
        description: result.message || "Failed to check in.",
        variant: result.message?.includes('already') ? "default" : "destructive"
      });
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden border shadow-2xl p-4 rounded-2xl transition-all duration-300",
      checkedInToday 
        ? "bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-950 border-emerald-500/30" 
        : "bg-gradient-to-r from-amber-950/40 via-purple-950/20 to-zinc-950 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
    )}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border transition-all",
            checkedInToday
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
              : "bg-amber-500/10 border-amber-500/40 text-amber-400 animate-pulse"
          )}>
            {checkedInToday ? "✅" : "🛡️"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300 text-sm font-serif">{myAlliance.name}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/60 border border-amber-500/30 text-amber-400 font-bold">
                <Flame className="w-3 h-3 text-orange-400 fill-orange-400" /> {streak} Day Oath Streak
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-0.5">
              {checkedInToday
                ? "Daily alliance oath sworn! Your loyalty empowers the House Cup."
                : "Fulfill your daily alliance oath to earn +10 House Cup Virtue points & streak bonus!"}
            </p>
          </div>
        </div>

        <Button
          onClick={handleCheckIn}
          disabled={checkedInToday || checkingIn}
          className={cn(
            "w-full sm:w-auto h-10 px-5 rounded-xl font-black text-xs uppercase tracking-wider shrink-0 transition-all shadow-lg active:scale-95",
            checkedInToday
              ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 cursor-default opacity-90"
              : "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-300 text-zinc-950 border border-yellow-300/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          )}
        >
          {checkingIn ? (
            <span className="flex items-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> Swearing Oath...</span>
          ) : checkedInToday ? (
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Oath Sworn Today</span>
          ) : (
            <span className="flex items-center gap-1.5">🛡️ Fulfill Daily Oath</span>
          )}
        </Button>
      </div>
    </Card>
  );
}

function DailyChestStatusWidget() {
  const [isReady, setIsReady] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  const router = useRouter();

  const updateStatus = useCallback(() => {
    try {
      const todayStr = new Date().toDateString();
      const stored = localStorage.getItem("claimed_packs_timestamps");
      if (!stored) {
        setIsReady(true);
      } else {
        const parsed = JSON.parse(stored);
        const lastClaimed = parsed["free_daily"];
        if (!lastClaimed) {
          setIsReady(true);
        } else {
          const lastDateStr = new Date(lastClaimed).toDateString();
          // Strict calendar date matching: if claimed today, not ready until midnight
          setIsReady(lastDateStr !== todayStr);
        }
      }

      // Calculate time remaining until local midnight
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diffMs = Math.max(0, midnight.getTime() - now.getTime());
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeUntilReset(`${hours}h ${minutes}m`);
    } catch {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    updateStatus();
    const interval = setInterval(updateStatus, 15000);
    return () => clearInterval(interval);
  }, [updateStatus]);

  const handleClaim = () => {
    if (isClaiming) return;
    setIsClaiming(true);

    try {
      // 1. Generate daily pack
      const generatedPackData = generatePack("free_daily", Math.random);
      const newOwnedPack: OwnedPack = {
        id: `owned_pack_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        packTypeId: "free_daily",
        packTitle: "Free Daily Pack",
        shortLabel: "Daily",
        purchasedAt: Date.now(),
        packData: generatedPackData,
      };

      // 2. Save pack to owned inventory
      saveOwnedPack(newOwnedPack);

      // 3. Update claimed pack timestamps
      let timestamps: Record<string, number> = {};
      try {
        const stored = localStorage.getItem("claimed_packs_timestamps");
        if (stored) timestamps = JSON.parse(stored);
      } catch {}
      timestamps["free_daily"] = Date.now();
      localStorage.setItem("claimed_packs_timestamps", JSON.stringify(timestamps));

      // 4. Confetti celebration & SFX
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#fbbf24", "#fcd34d", "#10b981", "#ffffff"],
      });
      playSFX("sparkle");
      hapticMedium();

      toast.success("Free daily chest claimed! Added to your mystery card vault.");
      updateStatus();
    } catch (e) {
      toast.error("Failed to claim daily chest.");
    } finally {
      setIsClaiming(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "w-full rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300",
        isReady
          ? "bg-gradient-to-r from-amber-950/40 via-zinc-950 to-amber-950/20 border border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.18)]"
          : "bg-zinc-950/80 border border-zinc-800/80 shadow-md"
      )}
    >
      <div className="flex items-center gap-3.5 w-full sm:w-auto">
        <MedievalOrbIcon
          color={isReady ? "gold" : "green"}
          size="md"
          className={isReady ? "scale-105 animate-pulse" : ""}
        >
          {isReady ? "🎁" : "✓"}
        </MedievalOrbIcon>
        <div>
          <h4 className="font-bold text-sm text-white font-serif">
            Free daily chest
          </h4>
          <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
            {isReady
              ? "Claim today's free daily gift to unlock mystery creature cards & rare alchemy essences."
              : `Opened today. Next free chest unlocks at midnight (${timeUntilReset} remaining).`}
          </p>
        </div>
      </div>

      <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2 shrink-0">
        <Button
          size="sm"
          onClick={handleClaim}
          disabled={!isReady || isClaiming}
          className={cn(
            "w-full sm:w-auto text-xs font-bold tracking-wide rounded-xl px-4 py-2 flex items-center justify-center gap-1.5 transition-all",
            isReady
              ? "btn-primary-cta shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer"
              : "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed opacity-60 hover:bg-zinc-900"
          )}
        >
          {isClaiming ? "Claiming..." : "Claim free chest 🎁"}
        </Button>

        <Link href="/market?tab=mystic-shop" className="w-full sm:w-auto">
          <Button
            size="sm"
            className="w-full sm:w-auto text-xs font-medium rounded-xl px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center gap-1"
          >
            Mystic bazaar →
          </Button>
        </Link>
      </div>
    </div>
  );
}

