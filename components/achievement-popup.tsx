import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  Trophy, 
  Star, 
  Shield, 
  Sword, 
  Scroll, 
  X,
  Sparkles,
  Zap
} from 'lucide-react';

// Achievement interface
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: 'quest' | 'streak' | 'level' | 'special';
  reward?: {
    xp?: number;
    gold?: number;
    title?: string;
  };
}

// Achievement popup component
interface AchievementPopupProps {
  achievement: Achievement;
  isVisible: boolean;
  onClose: () => void;
  onClaim?: (achievement: Achievement) => void;
  className?: string;
}

export function AchievementPopup({
  achievement,
  isVisible,
  onClose,
  onClaim,
  className,
}: AchievementPopupProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showRewards, setShowRewards] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Show rewards after initial animation
      setTimeout(() => setShowRewards(true), 500);
    }
    return undefined;
  }, [isVisible]);

  const getRarityConfig = () => {
    switch (achievement.rarity) {
      case 'common':
        return {
          color: 'text-gray-300',
          bgColor: 'from-gray-600 to-gray-700',
          borderColor: 'border-gray-500/30',
          glowColor: 'shadow-gray-500/20',
          icon: '⚪',
        };
      case 'uncommon':
        return {
          color: 'text-green-300',
          bgColor: 'from-green-600 to-green-700',
          borderColor: 'border-green-500/30',
          glowColor: 'shadow-green-500/20',
          icon: '🟢',
        };
      case 'rare':
        return {
          color: 'text-blue-300',
          bgColor: 'from-blue-600 to-blue-700',
          borderColor: 'border-blue-500/30',
          glowColor: 'shadow-blue-500/20',
          icon: '🔵',
        };
      case 'epic':
        return {
          color: 'text-purple-300',
          bgColor: 'from-purple-600 to-purple-700',
          borderColor: 'border-purple-500/30',
          glowColor: 'shadow-purple-500/20',
          icon: '🟣',
        };
      case 'legendary':
        return {
          color: 'text-yellow-300',
          bgColor: 'from-yellow-500 to-yellow-600',
          borderColor: 'border-yellow-400/50',
          glowColor: 'shadow-yellow-400/30',
          icon: '🟡',
        };
      default:
        return {
          color: 'text-gray-300',
          bgColor: 'from-gray-600 to-gray-700',
          borderColor: 'border-gray-500/30',
          glowColor: 'shadow-gray-500/20',
          icon: '⚪',
        };
    }
  };

  const getCategoryIcon = () => {
    switch (achievement.category) {
      case 'quest':
        return <Scroll className="h-4 w-4" />;
      case 'streak':
        return <Zap className="h-4 w-4" />;
      case 'level':
        return <Trophy className="h-4 w-4" />;
      case 'special':
        return <Crown className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const rarityConfig = getRarityConfig();

  if (!isVisible) return null;

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center p-4', className)}>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Achievement card */}
      <Card className={cn(
        'relative w-full max-w-md transform transition-all duration-500 ease-out',
        isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
        'bg-gradient-to-br border shadow-2xl',
        rarityConfig.bgColor,
        rarityConfig.borderColor,
        rarityConfig.glowColor
      )}>
        {/* Close button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </Button>

        <CardContent className="p-6 text-center space-y-4">
          {/* Achievement icon */}
          <div className="relative">
            <div className={cn(
              'mx-auto w-20 h-20 rounded-full flex items-center justify-center text-4xl',
              'bg-gradient-to-br from-white/20 to-white/10 border-2 border-white/30',
              'animate-pulse'
            )}>
              {rarityConfig.icon}
            </div>
            
            {/* Sparkle effects */}
            {showRewards && (
              <div className="absolute inset-0">
                {Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute text-yellow-400 animate-ping"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  >
                    ✨
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achievement title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white font-serif">
              🏆 Achievement Unlocked! 🏆
            </h2>
            <h3 className={cn('text-xl font-bold', rarityConfig.color)}>
              {achievement.name}
            </h3>
          </div>

          {/* Achievement description */}
          <p className="text-white/90 text-sm leading-relaxed">
            {achievement.description}
          </p>

          {/* Category badge */}
          <div className="flex justify-center">
            <Badge className={cn(
              'flex items-center space-x-1 px-3 py-1',
              'bg-white/20 text-white border border-white/30'
            )}>
              {getCategoryIcon()}
              <span className="capitalize">{achievement.category}</span>
            </Badge>
          </div>

          {/* Rewards */}
          {showRewards && achievement.reward && (
            <div className="space-y-3 pt-2">
              <div className="border-t border-white/20 pt-3">
                <h4 className="text-sm font-semibold text-white/80 mb-2">
                  🎁 Rewards:
                </h4>
                <div className="flex justify-center space-x-4">
                  {achievement.reward.xp && (
                    <div className="flex items-center space-x-1 bg-blue-500/20 px-3 py-1 rounded-full">
                      <Sparkles className="h-4 w-4 text-blue-300" />
                      <span className="text-blue-300 text-sm font-medium">
                        +{achievement.reward.xp} XP
                      </span>
                    </div>
                  )}
                  {achievement.reward.gold && (
                    <div className="flex items-center space-x-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                      <span className="text-yellow-300 text-sm">🪙</span>
                      <span className="text-yellow-300 text-sm font-medium">
                        +{achievement.reward.gold} Gold
                      </span>
                    </div>
                  )}
                </div>
                {achievement.reward.title && (
                  <div className="mt-2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                      <Crown className="h-3 w-3 mr-1" />
                      {achievement.reward.title}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Claim button */}
          {showRewards && onClaim && (
            <Button
              onClick={() => onClaim(achievement)}
              className={cn(
                'w-full mt-4 bg-gradient-to-r from-white/20 to-white/10',
                'hover:from-white/30 hover:to-white/20 text-white',
                'border border-white/30 shadow-lg'
              )}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Claim Reward
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Achievement notification (smaller version)
interface AchievementNotificationProps {
  achievement: Achievement;
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

export function AchievementNotification({
  achievement,
  isVisible,
  onClose,
  className,
}: AchievementNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, onClose]);

  const getRarityConfig = () => {
    switch (achievement.rarity) {
      case 'common':
        return 'from-gray-600 to-gray-700 border-gray-500/30';
      case 'uncommon':
        return 'from-green-600 to-green-700 border-green-500/30';
      case 'rare':
        return 'from-blue-600 to-blue-700 border-blue-500/30';
      case 'epic':
        return 'from-purple-600 to-purple-700 border-purple-500/30';
      case 'legendary':
        return 'from-yellow-500 to-yellow-600 border-yellow-400/50';
      default:
        return 'from-gray-600 to-gray-700 border-gray-500/30';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={cn('fixed top-4 right-4 z-50', className)}>
      <Card className={cn(
        'w-80 transform transition-all duration-300 ease-out',
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        'bg-gradient-to-r border shadow-xl',
        getRarityConfig()
      )}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🏆</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white truncate">
                {achievement.name}
              </h4>
              <p className="text-xs text-white/80 truncate">
                {achievement.description}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Achievement manager hook
export function useAchievementManager() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const unlockAchievement = (achievement: Achievement) => {
    setCurrentAchievement(achievement);
    setIsPopupVisible(true);
    setAchievements(prev => [...prev, achievement]);
  };

  const closePopup = () => {
    setIsPopupVisible(false);
    setCurrentAchievement(null);
  };

  const claimAchievement = (achievement: Achievement) => {
    // Handle reward claiming logic here
    console.log('Claiming achievement:', achievement);
    closePopup();
  };

  return {
    achievements,
    currentAchievement,
    isPopupVisible,
    unlockAchievement,
    closePopup,
    claimAchievement,
  };
}
