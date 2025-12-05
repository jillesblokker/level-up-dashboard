'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Trophy, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface AllianceStreakProps {
    userId: string;
}

interface StreakData {
    current: number;
    longest: number;
    lastUpdated: string | null;
}

export function AllianceStreakCard({ userId }: AllianceStreakProps) {
    const [streak, setStreak] = useState<StreakData>({ current: 0, longest: 0, lastUpdated: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchStreak();
        }
    }, [userId]);

    const fetchStreak = async () => {
        try {
            const response = await fetch(`/api/alliance-streak?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setStreak(data);
            }
        } catch (error) {
            console.error('Error fetching alliance streak:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="bg-gradient-to-br from-orange-950/30 to-black border-orange-900/50">
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-orange-900/30 rounded w-1/2"></div>
                        <div className="h-8 bg-orange-900/30 rounded w-1/3"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isActive = streak.current > 0;
    const isNewRecord = streak.current === streak.longest && streak.current > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className={`relative overflow-hidden ${isActive
                    ? 'bg-gradient-to-br from-orange-950/40 to-black border-orange-500/50 shadow-lg shadow-orange-500/20'
                    : 'bg-gradient-to-br from-gray-950/40 to-black border-gray-700/50'
                }`}>
                {/* Animated background effect */}
                {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10 animate-pulse" />
                )}

                <CardContent className="p-6 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Flame className={`w-5 h-5 ${isActive ? 'text-orange-500' : 'text-gray-500'}`} />
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                                    Alliance Streak
                                </h3>
                            </div>

                            <div className="flex items-baseline gap-3">
                                <motion.span
                                    className={`text-5xl font-bold ${isActive ? 'text-orange-400' : 'text-gray-500'}`}
                                    key={streak.current}
                                    initial={{ scale: 1.2, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                >
                                    {streak.current}
                                </motion.span>
                                <span className="text-sm text-gray-400">
                                    {streak.current === 1 ? 'day' : 'days'}
                                </span>
                            </div>

                            {isNewRecord && streak.current > 1 && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-1 mt-2 text-yellow-500 text-xs font-semibold"
                                >
                                    <Trophy className="w-3 h-3" />
                                    New Record!
                                </motion.div>
                            )}

                            {!isActive && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Interact with allies to start your streak
                                </p>
                            )}
                        </div>

                        {/* Longest streak badge */}
                        {streak.longest > 0 && (
                            <div className="flex flex-col items-center gap-1 px-4 py-3 bg-black/40 rounded-lg border border-gray-700/50">
                                <Trophy className="w-5 h-5 text-amber-500" />
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-amber-400">{streak.longest}</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Best</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Milestone progress */}
                    {isActive && (
                        <div className="mt-4 pt-4 border-t border-orange-900/30">
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                                <span>Next milestone</span>
                                <span className="font-semibold">
                                    {streak.current < 7 ? `${7 - streak.current} days to "Loyal Ally"` :
                                        streak.current < 30 ? `${30 - streak.current} days to "Steadfast Companion"` :
                                            streak.current < 100 ? `${100 - streak.current} days to "Eternal Friend"` :
                                                'All milestones achieved! 🎉'}
                                </span>
                            </div>
                            <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400"
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${streak.current < 7 ? (streak.current / 7) * 100 :
                                                streak.current < 30 ? ((streak.current - 7) / 23) * 100 :
                                                    streak.current < 100 ? ((streak.current - 30) / 70) * 100 :
                                                        100
                                            }%`
                                    }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
