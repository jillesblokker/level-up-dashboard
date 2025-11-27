import React, { useState, useEffect } from 'react';
import { CreatureDefinition } from '@/lib/creature-mapping';
import { cn } from '@/lib/utils';

interface CreatureSpriteProps {
    creature: CreatureDefinition;
    isPlayerOnTile: boolean;
    tileSize: number;
    className?: string;
}

export function CreatureSprite({ creature, isPlayerOnTile, tileSize, className }: CreatureSpriteProps) {
    const [showGreeting, setShowGreeting] = useState(false);
    const [greetingText, setGreetingText] = useState('');
    const [isJumping, setIsJumping] = useState(false);

    // Handle player entering tile
    useEffect(() => {
        if (isPlayerOnTile) {
            // Trigger greeting
            const randomGreeting = creature.greetings[Math.floor(Math.random() * creature.greetings.length)];
            setGreetingText(randomGreeting || "Hello!");
            setShowGreeting(true);
            setIsJumping(true);

            // Hide greeting after delay
            const timer = setTimeout(() => {
                setShowGreeting(false);
                setIsJumping(false);
            }, 4000);

            return () => clearTimeout(timer);
        } else {
            setShowGreeting(false);
            setIsJumping(false);
            return undefined;
        }
    }, [isPlayerOnTile, creature.greetings]);

    return (
        <div
            className={cn("absolute inset-0 flex items-center justify-center pointer-events-none z-20", className)}
            style={{ width: '100%', height: '100%' }}
        >
            {/* Speech Bubble */}
            <div
                className={cn(
                    "absolute z-50 bg-white/95 text-slate-900 px-3 py-2 rounded-xl shadow-xl border-2 border-amber-500/50 text-xs font-bold whitespace-nowrap pointer-events-none transition-all duration-300 transform",
                    showGreeting ? "opacity-100 -translate-y-8 scale-100" : "opacity-0 translate-y-0 scale-75"
                )}
                style={{ bottom: '100%' }}
            >
                {greetingText}
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-b-2 border-r-2 border-amber-500/50" />
            </div>

            {/* Creature Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={`/images/creatures/${creature.filename}`}
                alt={creature.name}
                className={cn(
                    "object-contain drop-shadow-lg transition-all duration-300",
                    isJumping ? "animate-bounce scale-110" : ""
                )}
                style={{
                    width: `${creature.scale * 70}%`,
                    height: `${creature.scale * 70}%`,
                    animation: isJumping ? undefined : 'waddle 2s ease-in-out infinite',
                }}
                onLoad={() => {
                    console.log('[CreatureSprite] Image loaded successfully:', creature.name, creature.filename);
                }}
                onError={(e) => {
                    console.error('[CreatureSprite] Failed to load image:', creature.name, creature.filename);
                    // Fallback if image fails to load
                    e.currentTarget.style.display = 'none';
                }}
            />
            <style jsx>{`
                @keyframes waddle {
                    0%, 100% {
                        transform: translateX(0) rotate(0deg);
                    }
                    25% {
                        transform: translateX(-2px) rotate(-2deg);
                    }
                    75% {
                        transform: translateX(2px) rotate(2deg);
                    }
                }
            `}</style>
        </div>
    );
}
