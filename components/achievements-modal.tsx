import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { ACHIEVEMENTS, AchievementDefinition } from '@/lib/achievement-manager';
import { Trophy, Lock, CheckCircle2, Users, Crown, Scroll, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface AchievementsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
}

export function AchievementsModal({ open, onOpenChange, userId }: AchievementsModalProps) {
    const [unlocked, setUnlocked] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const supabase = createClientComponentClient();

    useEffect(() => {
        if (open && userId) {
            fetchAchievements();
        }
    }, [open, userId]);

    const fetchAchievements = async () => {
        try {
            const { data } = await supabase
                .from('alliance_achievements')
                .select('*')
                .eq('user_id', userId);

            const unlockedMap: Record<string, any> = {};
            data?.forEach(ach => {
                unlockedMap[ach.achievement_type] = ach;
            });
            setUnlocked(unlockedMap);
        } catch (error) {
            console.error('Error fetching achievements:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'UserPlus': return Users;
            case 'Users': return Users;
            case 'Crown': return Crown;
            case 'Scroll': return Scroll;
            case 'ScrollText': return Scroll;
            case 'BookOpen': return Scroll;
            default: return Trophy;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Alliance Achievements
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4">
                    <div className="grid grid-cols-1 gap-4 py-4">
                        {Object.values(ACHIEVEMENTS).map((achievement) => {
                            const isUnlocked = !!unlocked[achievement.id];
                            const progress = unlocked[achievement.id]?.progress || 0;
                            const Icon = getIcon(achievement.icon);

                            // Calculate percentage for progress bar (if we had exact progress tracking for locked ones)
                            // Since we only store progress on update/unlock, we might show 0 if not started.
                            // For now, assume progress is stored in DB even if not unlocked (based on my manager logic)
                            const percent = Math.min(100, (progress / achievement.requirement) * 100);

                            return (
                                <div
                                    key={achievement.id}
                                    className={cn(
                                        "relative overflow-hidden rounded-lg border p-4 transition-all",
                                        isUnlocked
                                            ? "bg-yellow-500/5 border-yellow-500/50 shadow-sm"
                                            : "bg-muted/50 border-muted opacity-80 grayscale-[0.5]"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "p-3 rounded-full flex items-center justify-center shrink-0",
                                            isUnlocked ? "bg-yellow-500/20 text-yellow-500" : "bg-muted text-muted-foreground"
                                        )}>
                                            {isUnlocked ? <Icon className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                        </div>

                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className={cn("font-bold", isUnlocked && "text-yellow-600 dark:text-yellow-400")}>
                                                    {achievement.title}
                                                </h4>
                                                {isUnlocked && (
                                                    <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                                        <CheckCircle2 className="w-3 h-3" /> Unlocked
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-muted-foreground">{achievement.description}</p>

                                            <div className="mt-3 space-y-1">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Progress</span>
                                                    <span>{progress} / {achievement.requirement}</span>
                                                </div>
                                                <Progress value={percent} className={cn("h-2", isUnlocked ? "bg-yellow-100" : "bg-secondary")} indicatorClassName={isUnlocked ? "bg-yellow-500" : "bg-primary"} />
                                            </div>

                                            <div className="flex gap-3 mt-2 text-xs font-medium text-muted-foreground">
                                                <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                                    <Star className="w-3 h-3" /> {achievement.reward.xp} XP
                                                </span>
                                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                    <div className="w-3 h-3 rounded-full bg-amber-400" /> {achievement.reward.gold} Gold
                                                </span>
                                                {achievement.reward.title && (
                                                    <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                                        <Crown className="w-3 h-3" /> Title: {achievement.reward.title}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
