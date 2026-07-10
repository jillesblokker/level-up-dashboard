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
    isSleepy?: boolean;
}

export function CreatureSprite({ creature, isPlayerOnTile, tileSize, className, isFavorite = false, isHarvestReady = false, isSleepy = false }: CreatureSpriteProps) {
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
                    "absolute z-50 bg-zinc-950/95 text-amber-100 px-3 py-2 rounded-xl shadow-2xl border border-amber-500/40 text-xs font-serif whitespace-nowrap pointer-events-none transition-all duration-300 transform",
                    showGreeting ? "opacity-100 -translate-y-8 scale-100" : "opacity-0 translate-y-0 scale-75"
                )}
                style={{ bottom: '100%' }}
            >
                <span className="text-amber-500 font-bold mr-1">{creature.name}:</span>
                {greetingText}
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-950 rotate-45 border-b border-r border-amber-500/40" />
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

            {/* Drop Shadow (Point 3) */}
            <div 
                className="absolute bg-black/25 rounded-full blur-[1px] pointer-events-none z-10"
                style={{
                    width: `${creature.scale * 45}%`,
                    height: `${creature.scale * 8}%`,
                    bottom: '12%',
                    left: '50%',
                    transform: 'translateX(-50%)'
                }}
            />

            {/* Drifting Zzzs (Point 16) */}
            {isSleepy && (
                <div className="absolute top-2 right-[18%] z-40 pointer-events-none flex gap-0.5 select-none">
                    <span className="text-[9px] text-zinc-400/80 font-bold animate-zzz-1 opacity-0">z</span>
                    <span className="text-[11px] text-zinc-400/80 font-bold animate-zzz-2 opacity-0">Z</span>
                    <span className="text-[13px] text-zinc-500/80 font-bold animate-zzz-3 opacity-0">Z</span>
                </div>
            )}

            {/* Creature Image */}
            <div 
                className={cn(
                    "relative transition-all duration-300 z-20",
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
                    className="object-contain"
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
                @keyframes zzz-float {
                    0% {
                        transform: translateY(8px) translateX(0) scale(0.7);
                        opacity: 0;
                    }
                    15% {
                        opacity: 0.8;
                    }
                    80% {
                        opacity: 0.8;
                    }
                    100% {
                        transform: translateY(-22px) translateX(6px) scale(1.1);
                        opacity: 0;
                    }
                }
                .animate-zzz-1 {
                    animation: zzz-float 3.2s ease-in-out infinite;
                    animation-delay: 0s;
                }
                .animate-zzz-2 {
                    animation: zzz-float 3.2s ease-in-out infinite;
                    animation-delay: 0.9s;
                }
                .animate-zzz-3 {
                    animation: zzz-float 3.2s ease-in-out infinite;
                    animation-delay: 1.8s;
                }
            `}</style>
        </div>
    );
}
