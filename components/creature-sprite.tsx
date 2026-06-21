import { logger } from "@/lib/logger";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CreatureDefinition } from '@/lib/creature-mapping';
import { cn } from '@/lib/utils';

interface CreatureSpriteProps {
    creature: CreatureDefinition & { isMythic?: boolean };
    isPlayerOnTile: boolean;
    tileSize: number;
    className?: string;
    isFavorite?: boolean;
    isHarvestReady?: boolean;
}

export function CreatureSprite({ creature, isPlayerOnTile, tileSize, className, isFavorite = false, isHarvestReady = false }: CreatureSpriteProps) {
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

    const isMythic = creature.isMythic || creature.id?.startsWith('mythic-') || creature.filename?.startsWith('Mythic');
    const imagePath = isMythic 
        ? `/images/Mythics/${creature.filename}?v=2` 
        : `/images/creatures/${creature.filename}`;

    return (
        <div
            className={cn("absolute inset-0 flex items-center justify-center pointer-events-none z-20", className)}
            style={{ width: '100%', height: '100%' }}
        >
            {/* Speech Bubble */}
            <div
                className={cn(
                    "absolute z-50 bg-white/95 text-zinc-900 px-3 py-2 rounded-xl shadow-xl border-2 border-amber-500/50 text-xs font-bold whitespace-nowrap pointer-events-none transition-all duration-300 transform",
                    showGreeting ? "opacity-100 -translate-y-8 scale-100" : "opacity-0 translate-y-0 scale-75"
                )}
                style={{ bottom: '100%' }}
            >
                <span className="text-amber-600 font-extrabold mr-1">{creature.name}:</span>
                {greetingText}
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-b-2 border-r-2 border-amber-500/50" />
            </div>

            {/* Favorite Glow Ring */}
            {isFavorite && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <div className="w-[60%] h-[15%] rounded-full bg-amber-500/20 border border-amber-400/30 blur-[2px] animate-pulse absolute bottom-1" />
                </div>
            )}

            {/* Harvest Ready Indicator */}
            {isHarvestReady && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                    <div className="bg-amber-500 text-white rounded-full p-1 border border-yellow-300 shadow-md flex items-center justify-center w-6 h-6">
                        <span className="text-xs select-none">🪙</span>
                    </div>
                </div>
            )}

            {/* Creature Image */}
            <div 
                className={cn(
                    "relative transition-all duration-300",
                    isJumping ? "animate-bounce scale-110" : ""
                )}
                style={{
                    width: `${creature.scale * 70}%`,
                    height: `${creature.scale * 70}%`,
                    animation: isJumping ? undefined : 'waddle 2s ease-in-out infinite',
                }}
            >
                <Image
                    src={imagePath}
                    alt={creature.name}
                    fill
                    sizes="100px"
                    className="object-contain drop-shadow-lg"
                    onError={() => {
                        logger.error('[CreatureSprite] Failed to load image:', creature.name, creature.filename, 'path tried:', imagePath);
                    }}
                />
            </div>
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
