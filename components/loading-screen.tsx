"use client";

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import { SwordLoader } from '@/components/ui/sword-loader';

interface LoadingScreenProps {
    title: React.ReactNode;
    content: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
    variant?: 'blue' | 'amber';
}

export function LoadingScreen({ title, content, icon, className, variant = 'blue' }: LoadingScreenProps) {
    const isAmber = variant === 'amber';
    
    // Choose colors based on variant
    const themeColors = {
        glow: isAmber ? 'bg-amber-500/10' : 'bg-blue-500/10',
        ring1: isAmber ? 'border-amber-500/20' : 'border-blue-500/20',
        ring2: isAmber ? 'border-amber-400/10' : 'border-blue-400/10',
        sparkle1: isAmber ? 'text-amber-400/40' : 'text-blue-400/40',
        sparkle2: isAmber ? 'text-amber-300/30' : 'text-blue-300/30',
        orbBorder: isAmber ? 'border-amber-500/30' : 'border-blue-500/30',
        orbGradient: isAmber ? 'from-amber-900/20' : 'from-blue-900/20',
        iconColor: isAmber ? 'text-amber-400' : 'text-blue-400',
        iconGlow: isAmber ? 'drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]',
        titleColor: isAmber ? 'text-amber-400' : 'text-blue-400',
        titleGlow: isAmber ? 'drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]',
        contentColor: isAmber ? 'text-amber-100/70' : 'text-blue-100/70',
        radialFrom: isAmber ? 'from-amber-900/10' : 'from-blue-900/10',
    };
    return (
        <div className={cn("fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-xl", className)}>
            {/* Cinematic Radial Background */}
            <div 
                className={cn("fixed inset-0 bg-[#020617] bg-radial-gradient via-black to-black", themeColors.radialFrom)} 
                aria-hidden="true"
            />
            
            {/* Robust CSS-based grain noise (Replacement for noise.png 404) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay" 
                 style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                 }} />
            
            <div className="w-full max-w-xl flex flex-col items-center justify-center relative z-10 text-center scale-up-center">
                {/* Prominent Sweeping Medieval Sword Container */}
                <div className="mb-10 relative flex flex-col items-center justify-center">
                    {/* Pulsing Outer Glow */}
                    <div className={cn("absolute inset-0 rounded-full blur-3xl animate-pulse -z-10", themeColors.glow)} />
                    
                    {/* Central Sweeping Cartoony Sword */}
                    <div className="relative z-10 flex items-center justify-center p-4">
                        <SwordLoader size="lg" variant={variant} />
                    </div>
                </div>

                {/* Typography with enhanced hierarchy */}
                <h2 className={cn("text-3xl md:text-4xl font-medieval mb-8 tracking-wider", themeColors.titleColor, themeColors.titleGlow)}>
                    {title}
                </h2>
                <div className={cn("text-base md:text-lg leading-relaxed px-8 italic font-serif opacity-90 max-w-lg mx-auto", themeColors.contentColor)}>
                    {content}
                </div>
            </div>
            
            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes spin-reverse-slow {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
                .animate-spin-reverse-slow {
                    animation: spin-reverse-slow 30s linear infinite;
                }
                .scale-up-center {
                    animation: scale-up-center 0.8s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
                }
                @keyframes scale-up-center {
                    0% { transform: scale(0.95); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
