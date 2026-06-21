import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

// Particle interface
interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'gold' | 'xp' | 'resource' | 'sparkle' | 'fire';
}

// Particle system component
interface ParticleSystemProps {
  particles: Particle[];
  className?: string;
}

export function ParticleSystem({ particles, className }: ParticleSystemProps) {
  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute transition-all duration-1000 ease-out"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            transform: `translate(-50%, -50%) scale(${particle.life / particle.maxLife})`,
            opacity: particle.life / particle.maxLife,
            fontSize: `${particle.size}px`,
            color: particle.color,
          }}
        >
          {getParticleEmoji(particle.type)}
        </div>
      ))}
    </div>
  );
}

// Get emoji for particle type
function getParticleEmoji(type: Particle['type']): string {
  switch (type) {
    case 'gold':
      return '🪙';
    case 'xp':
      return '✨';
    case 'resource':
      return '📦';
    case 'sparkle':
      return '⭐';
    case 'fire':
      return '🔥';
    default:
      return '✨';
  }
}

// Gold generation particle effect
interface GoldParticleEffectProps {
  isActive: boolean;
  onComplete?: () => void;
  amount?: number;
  className?: string;
}

export function GoldParticleEffect({
  isActive,
  onComplete,
  amount = 25,
  className,
}: GoldParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (isActive) {
      // Generate gold particles
      const newParticles: Particle[] = Array.from({ length: Math.min(amount, 20) }, (_, i) => ({
        id: `gold-${i}-${Date.now()}`,
        x: 50 + (Math.random() - 0.5) * 20, // Center with some spread
        y: 50 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3 - 1, // Upward movement
        life: 100,
        maxLife: 100,
        size: 16 + Math.random() * 8,
        color: '#fbbf24', // amber-400
        type: 'gold',
      }));

      setParticles(newParticles);

      // Animate particles
      const animate = () => {
        setParticles(prev => 
          prev.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life - 2,
            vy: particle.vy + 0.1, // Gravity
          })).filter(particle => particle.life > 0)
        );

        if (particles.length > 0) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          onComplete?.();
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, amount, onComplete]);

  return (
    <ParticleSystem particles={particles} {...(className && { className })} />
  );
}

// XP generation particle effect
interface XPParticleEffectProps {
  isActive: boolean;
  onComplete?: () => void;
  amount?: number;
  className?: string;
}

export function XPParticleEffect({
  isActive,
  onComplete,
  amount = 50,
  className,
}: XPParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (isActive) {
      // Generate XP particles
      const newParticles: Particle[] = Array.from({ length: Math.min(amount / 10, 15) }, (_, i) => ({
        id: `xp-${i}-${Date.now()}`,
        x: 50 + (Math.random() - 0.5) * 30,
        y: 50 + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 4 - 2,
        life: 120,
        maxLife: 120,
        size: 12 + Math.random() * 6,
        color: '#3b82f6', // blue-500
        type: 'xp',
      }));

      setParticles(newParticles);

      // Animate particles
      const animate = () => {
        setParticles(prev => 
          prev.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life - 2,
            vy: particle.vy + 0.08,
          })).filter(particle => particle.life > 0)
        );

        if (particles.length > 0) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          onComplete?.();
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, amount, onComplete]);

  return (
    <ParticleSystem particles={particles} {...(className && { className })} />
  );
}

// Resource generation particle effect
interface ResourceParticleEffectProps {
  isActive: boolean;
  onComplete?: () => void;
  resourceType?: 'wood' | 'stone' | 'food' | 'metal';
  className?: string;
}

export function ResourceParticleEffect({
  isActive,
  onComplete,
  resourceType = 'wood',
  className,
}: ResourceParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number>();

  const getResourceColor = () => {
    switch (resourceType) {
      case 'wood':
        return '#8b5cf6'; // purple-500
      case 'stone':
        return '#6b7280'; // gray-500
      case 'food':
        return '#10b981'; // emerald-500
      case 'metal':
        return '#f59e0b'; // amber-500
      default:
        return '#6b7280';
    }
  };

  useEffect(() => {
    if (isActive) {
      // Generate resource particles
      const newParticles: Particle[] = Array.from({ length: 8 }, (_, i) => ({
        id: `resource-${i}-${Date.now()}`,
        x: 50 + (Math.random() - 0.5) * 25,
        y: 50 + (Math.random() - 0.5) * 25,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -Math.random() * 3 - 1.5,
        life: 100,
        maxLife: 100,
        size: 14 + Math.random() * 6,
        color: getResourceColor(),
        type: 'resource',
      }));

      setParticles(newParticles);

      // Animate particles
      const animate = () => {
        setParticles(prev => 
          prev.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life - 2,
            vy: particle.vy + 0.1,
          })).filter(particle => particle.life > 0)
        );

        if (particles.length > 0) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          onComplete?.();
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, resourceType, onComplete]);

  return (
    <ParticleSystem particles={particles} {...(className && { className })} />
  );
}

// Sparkle effect for special events
interface SparkleEffectProps {
  isActive: boolean;
  onComplete?: () => void;
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export function SparkleEffect({
  isActive,
  onComplete,
  intensity = 'medium',
  className,
}: SparkleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number>();

  const getParticleCount = () => {
    switch (intensity) {
      case 'low':
        return 5;
      case 'medium':
        return 10;
      case 'high':
        return 20;
      default:
        return 10;
    }
  };

  useEffect(() => {
    if (isActive) {
      // Generate sparkle particles
      const newParticles: Particle[] = Array.from({ length: getParticleCount() }, (_, i) => ({
        id: `sparkle-${i}-${Date.now()}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        life: 80,
        maxLife: 80,
        size: 8 + Math.random() * 4,
        color: '#fbbf24', // amber-400
        type: 'sparkle',
      }));

      setParticles(newParticles);

      // Animate particles
      const animate = () => {
        setParticles(prev => 
          prev.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life - 1,
          })).filter(particle => particle.life > 0)
        );

        if (particles.length > 0) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          onComplete?.();
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, intensity, onComplete]);

  return (
    <ParticleSystem particles={particles} {...(className && { className })} />
  );
}

// Fire effect for streak celebrations
interface FireEffectProps {
  isActive: boolean;
  onComplete?: () => void;
  className?: string;
}

export function FireEffect({
  isActive,
  onComplete,
  className,
}: FireEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (isActive) {
      // Generate fire particles
      const newParticles: Particle[] = Array.from({ length: 12 }, (_, i) => ({
        id: `fire-${i}-${Date.now()}`,
        x: 50 + (Math.random() - 0.5) * 20,
        y: 70 + Math.random() * 20, // Start from bottom
        vx: (Math.random() - 0.5) * 1,
        vy: -Math.random() * 2 - 1,
        life: 100,
        maxLife: 100,
        size: 12 + Math.random() * 8,
        color: '#f97316', // orange-500
        type: 'fire',
      }));

      setParticles(newParticles);

      // Animate particles
      const animate = () => {
        setParticles(prev => 
          prev.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life - 2,
            vy: particle.vy + 0.05, // Slight upward drift
          })).filter(particle => particle.life > 0)
        );

        if (particles.length > 0) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          onComplete?.();
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, onComplete]);

  return (
    <ParticleSystem particles={particles} {...(className && { className })} />
  );
}
