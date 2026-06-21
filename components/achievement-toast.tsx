import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Trophy, Star, Crown, Scroll, Users } from 'lucide-react';
import { AchievementDefinition } from '@/lib/achievement-manager';

const AchievementContent = ({ achievement }: { achievement: AchievementDefinition }) => {
    const Icon = getIcon(achievement.icon);

    return (
        <div className="flex items-center gap-4 p-2 w-full">
            <div className="relative">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-12 h-12 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center text-yellow-500"
                >
                    <Icon className="w-6 h-6" />
                </motion.div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute -top-1 -right-1"
                >
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </motion.div>
            </div>
            <div className="flex-1">
                <motion.h4
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-bold text-lg text-yellow-500"
                >
                    Achievement Unlocked!
                </motion.h4>
                <motion.p
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="font-medium text-foreground"
                >
                    {achievement.title}
                </motion.p>
                <motion.p
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-muted-foreground"
                >
                    {achievement.description}
                </motion.p>
            </div>
            <div className="flex flex-col items-end text-xs font-bold text-yellow-600">
                <span>+{achievement.reward.xp} XP</span>
                <span>+{achievement.reward.gold} Gold</span>
            </div>
        </div>
    );
};

function getIcon(iconName: string) {
    switch (iconName) {
        case 'UserPlus': return Users;
        case 'Users': return Users;
        case 'Crown': return Crown;
        case 'Scroll': return Scroll;
        case 'ScrollText': return Scroll;
        case 'BookOpen': return Scroll;
        default: return Trophy;
    }
}

export const showAchievementToast = (achievement: AchievementDefinition) => {
    // Play sound if possible (optional)
    // const audio = new Audio('/sounds/achievement.mp3');
    // audio.play().catch(() => {});

    toast.custom((t) => (
        <div className="bg-background border-2 border-yellow-500/50 rounded-lg shadow-lg shadow-yellow-500/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent pointer-events-none" />
            <AchievementContent achievement={achievement} />
        </div>
    ), {
        duration: 5000,
        position: 'top-center',
    });
};
