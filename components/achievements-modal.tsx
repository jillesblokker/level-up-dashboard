"use client"
import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ACHIEVEMENTS, AchievementDefinition } from '@/lib/achievement-manager';
import { Trophy, Lock, CheckCircle2, Users, Crown, Scroll, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

interface AchievementsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
}

export function AchievementsModal({ open, onOpenChange, userId }: AchievementsModalProps) {
    const [unlocked, setUnlocked] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const supabase = createClientComponentClient();

    const fetchAchievements = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_achievements')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;

            const unlockedMap = (data || []).reduce((acc: any, curr: any) => {
                acc[curr.achievement_id] = curr;
                return acc;
            }, {});

            setUnlocked(unlockedMap);
        } catch (error) {
            console.error('Error fetching achievements:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, supabase]);

    useEffect(() => {
        if (open && userId) {
            fetchAchievements();
        }
    }, [open, userId, fetchAchievements]);

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'trophy': return Trophy;
            case 'users': return Users;
            case 'crown': return Crown;
            case 'scroll': return Scroll;
            case 'star': return Star;
            default: return Trophy;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden flex flex-col shadow-2xl">
                {/* Thematic Background Effects */}
                <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                    <DialogHeader className="p-6 pb-2 text-center items-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-bold uppercase tracking-widest mb-4 text-yellow-500 shadow-sm">
                            <Trophy className="w-3 h-3" />
                            Grand Gallery
                        </div>
                        <DialogTitle className="text-4xl font-serif text-white tracking-tight mb-2">
                            Alliance Achievements
                        </DialogTitle>
                        <p className="text-zinc-500 text-sm max-w-[400px]">
                            Commemorating your journey through the realm and the legendary milestones reached by your alliance.
                        </p>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
                                <p className="text-zinc-500 font-medium">Revealing your legacies...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 pb-8">
                                {Object.values(ACHIEVEMENTS).map((achievement) => {
                                    const isUnlocked = !!unlocked[achievement.id];
                                    const progress = unlocked[achievement.id]?.progress || 0;
                                    const Icon = getIcon(achievement.icon);
                                    const percent = Math.min(100, (progress / achievement.requirement) * 100);

                                    return (
                                        <div
                                            key={achievement.id}
                                            className={cn(
                                                "relative overflow-hidden rounded-2xl border transition-all duration-500 group",
                                                isUnlocked
                                                    ? "bg-gradient-to-br from-yellow-950/20 via-zinc-900 to-zinc-900/50 border-yellow-500/30 shadow-lg shadow-yellow-900/5"
                                                    : "bg-zinc-900/40 border-zinc-800 opacity-90"
                                            )}
                                        >
                                            {/* Hover Glow effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                                            <div className="relative z-10 p-5 flex flex-col sm:flex-row gap-5">
                                                {/* Image Container */}
                                                <div className="relative group/portrait">
                                                    <div className={cn(
                                                        "relative w-24 h-32 rounded-xl overflow-hidden shrink-0 border-2 transition-transform duration-500 group-hover/portrait:scale-105 shadow-2xl",
                                                        isUnlocked ? "border-yellow-500/40" : "border-zinc-800"
                                                    )}>
                                                        <Image
                                                            src={achievement.image}
                                                            alt={achievement.title}
                                                            fill
                                                            className={cn(
                                                                "object-cover",
                                                                !isUnlocked && "grayscale opacity-40 brightness-50"
                                                            )}
                                                        />
                                                        {!isUnlocked && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                                                <Lock className="w-8 h-8 text-zinc-600 animate-pulse" />
                                                            </div>
                                                        )}
                                                        {isUnlocked && (
                                                            <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/40 via-transparent to-transparent opacity-60" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex-1 flex flex-col">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className={cn(
                                                                "text-xl font-bold font-serif",
                                                                isUnlocked ? "text-yellow-100" : "text-zinc-400"
                                                            )}>
                                                                {achievement.title}
                                                            </h4>
                                                            {isUnlocked && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                                        </div>
                                                        {isUnlocked && (
                                                            <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Mastered</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                                                        {achievement.description}
                                                    </p>

                                                    <div className="mt-auto space-y-3">
                                                        {/* Progress Tracking */}
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between items-end">
                                                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Progress</span>
                                                                <span className="text-xs font-mono text-zinc-400">{progress} <span className="text-zinc-600">/</span> {achievement.requirement}</span>
                                                            </div>
                                                            <div className="relative h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                                                                <div
                                                                    className={cn(
                                                                        "absolute inset-y-0 left-0 transition-all duration-1000",
                                                                        isUnlocked ? "bg-gradient-to-r from-yellow-600 to-amber-400" : "bg-zinc-700"
                                                                    )}
                                                                    style={{ width: `${percent}%` }}
                                                                />
                                                                {isUnlocked && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_100%)] opacity-20 animate-pulse" />}
                                                            </div>
                                                        </div>

                                                        {/* Reward Icons */}
                                                        <div className="flex flex-wrap gap-4 pt-1">
                                                            <div className="flex items-center gap-1.5 bg-yellow-500/5 px-2 py-1 rounded-md border border-yellow-500/10">
                                                                <Star className="w-3.5 h-3.5 text-yellow-500" />
                                                                <span className="text-xs font-bold text-yellow-100/80">{achievement.reward.xp} <span className="text-zinc-600">XP</span></span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 bg-amber-500/5 px-2 py-1 rounded-md border border-amber-500/10">
                                                                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                                <span className="text-xs font-bold text-amber-100/80">{achievement.reward.gold} <span className="text-zinc-600">Gold</span></span>
                                                            </div>
                                                            {achievement.reward.title && (
                                                                <div className="flex items-center gap-1.5 bg-purple-500/5 px-2 py-1 rounded-md border border-purple-500/10">
                                                                    <Crown className="w-3.5 h-3.5 text-purple-400" />
                                                                    <span className="text-xs font-bold text-purple-100/80">{achievement.reward.title}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-zinc-900 bg-zinc-950/50">
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-zinc-800 transition-all duration-300"
                        >
                            Return to Kingdom
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
