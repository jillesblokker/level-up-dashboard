import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Particle effect for quest completion
interface ParticleProps {
  x: number;
  y: number;
  delay: number;
  type: 'gold' | 'xp' | 'sparkle';
}

function Particle({ x, y, delay, type }: ParticleProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getParticleContent = () => {
    switch (type) {
      case 'gold':
        return '🪙';
      case 'xp':
        return '✨';
      case 'sparkle':
        return '⭐';
      default:
        return '✨';
    }
  };

  const getParticleColor = () => {
    switch (type) {
      case 'gold':
        return 'text-yellow-400';
      case 'xp':
        return 'text-blue-400';
      case 'sparkle':
        return 'text-purple-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div
      className={cn(
        'absolute pointer-events-none text-2xl font-bold transition-all duration-1000 ease-out',
        getParticleColor(),
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: visible ? 'translateY(-100px) scale(1.2)' : 'translateY(0) scale(0.5)',
      }}
    >
      {getParticleContent()}
    </div>
  );
}

// Quest completion celebration
interface QuestCelebrationProps {
  isVisible: boolean;
  onComplete?: () => void;
  xp?: number;
  gold?: number;
  questName?: string;
}

export function QuestCelebration({
  isVisible,
  onComplete,
  xp = 50,
  gold = 25,
  questName = 'Quest',
}: QuestCelebrationProps) {
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowParticles(true);
      const timer = setTimeout(() => {
        setShowParticles(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
    return undefined;
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  // Generate random particle positions
  const particles: ParticleProps[] = Array.from({ length: 12 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: i * 100,
    type: i < 4 ? 'gold' : i < 8 ? 'xp' : 'sparkle',
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-zinc-950 " />
      
      {/* Celebration content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          {/* Quest completed text */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-amber-50 px-8 py-4 rounded-xl shadow-2xl border border-amber-500/30">
            <h2 className="text-3xl font-bold font-serif mb-2">
              ⚔️ Quest Completed! ⚔️
            </h2>
            <p className="text-xl font-medium">{questName}</p>
          </div>

          {/* Rewards */}
          <div className="flex justify-center space-x-6">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-900 px-4 py-2 rounded-lg shadow-lg">
              <div className="text-2xl font-bold">+{gold}</div>
              <div className="text-sm font-medium">🪙 Gold</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-blue-900 px-4 py-2 rounded-lg shadow-lg">
              <div className="text-2xl font-bold">+{xp}</div>
              <div className="text-sm font-medium">✨ XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Particles */}
      {showParticles && (
        <div className="absolute inset-0">
          {particles.map((particle, index) => (
            <Particle key={index} {...particle} />
          ))}
        </div>
      )}
    </div>
  );
}

// Level up celebration
interface LevelUpCelebrationProps {
  isVisible: boolean;
  onComplete?: () => void;
  newLevel?: number;
  className?: string;
}

export function LevelUpCelebration({
  isVisible,
  onComplete,
  newLevel = 1,
  className,
}: LevelUpCelebrationProps) {
  const [showEffect, setShowEffect] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowEffect(true);
      const timer = setTimeout(() => {
        setShowEffect(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={cn('fixed inset-0 pointer-events-none z-50', className)}>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-amber-900/30 " />
      
      {/* Level up content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-6">
          {/* Level up text */}
          <div className="bg-gradient-to-r from-purple-600 to-amber-600 text-white px-12 py-8 rounded-2xl shadow-2xl border border-purple-500/30">
            <h1 className="text-5xl font-bold font-serif mb-4">
              🏆 LEVEL UP! 🏆
            </h1>
            <p className="text-3xl font-bold text-amber-200">
              Level {newLevel}
            </p>
          </div>

          {/* Confetti effect */}
          {showEffect && (
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  className="absolute text-4xl animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                >
                  {['🎉', '🎊', '⭐', '✨', '🏆'][Math.floor(Math.random() * 5)]}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Streak celebration
interface StreakCelebrationProps {
  isVisible: boolean;
  onComplete?: () => void;
  streakDays?: number;
  className?: string;
}

export function StreakCelebration({
  isVisible,
  onComplete,
  streakDays = 7,
  className,
}: StreakCelebrationProps) {
  const [showEffect, setShowEffect] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowEffect(true);
      const timer = setTimeout(() => {
        setShowEffect(false);
        onComplete?.();
      }, 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={cn('fixed inset-0 pointer-events-none z-50', className)}>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/30 to-red-900/30 " />
      
      {/* Streak content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          {/* Streak text */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-6 rounded-xl shadow-2xl border border-orange-500/30">
            <h2 className="text-4xl font-bold font-serif mb-2">
              🔥 STREAK MASTER! 🔥
            </h2>
            <p className="text-2xl font-bold text-orange-200">
              {streakDays} Day Streak!
            </p>
          </div>

          {/* Fire effect */}
          {showEffect && (
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 15 }, (_, i) => (
                <div
                  key={i}
                  className="absolute text-3xl animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 1}s`,
                  }}
                >
                  🔥
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Achievement unlock celebration
interface AchievementCelebrationProps {
  isVisible: boolean;
  onComplete?: () => void;
  achievementName?: string;
  achievementDescription?: string;
  className?: string;
}

export function AchievementCelebration({
  isVisible,
  onComplete,
  achievementName = 'Achievement',
  achievementDescription = 'You unlocked a new achievement!',
  className,
}: AchievementCelebrationProps) {
  const [showEffect, setShowEffect] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowEffect(true);
      const timer = setTimeout(() => {
        setShowEffect(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={cn('fixed inset-0 pointer-events-none z-50', className)}>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 to-emerald-900/30 " />
      
      {/* Achievement content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-6">
          {/* Achievement text */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-8 rounded-2xl shadow-2xl border border-green-500/30">
            <h1 className="text-4xl font-bold font-serif mb-4">
              🏅 ACHIEVEMENT UNLOCKED! 🏅
            </h1>
            <h2 className="text-2xl font-bold text-green-200 mb-2">
              {achievementName}
            </h2>
            <p className="text-lg text-green-100">
              {achievementDescription}
            </p>
          </div>

          {/* Sparkle effect */}
          {showEffect && (
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 25 }, (_, i) => (
                <div
                  key={i}
                  className="absolute text-2xl animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                >
                  ✨
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
