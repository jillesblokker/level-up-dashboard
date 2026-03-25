import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Wind, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
    title: ReactNode;
    content: ReactNode;
    icon?: ReactNode;
}

export function LoadingScreen({ title, content, icon }: LoadingScreenProps) {
    const style = {
        // using a similar blue galaxy tone for the background to match the "modal style" look
        gradient: 'from-blue-950/90 via-zinc-950 to-zinc-950',
        border: 'border-blue-700/30',
        accent: 'text-blue-400',
        accentBg: 'bg-blue-900/30'
    };

    return (
        <div className={cn("min-h-screen w-full flex items-center justify-center p-4 bg-black")}>
            <div className="absolute inset-0 bg-black pointer-events-none" />
            <div className={cn("absolute inset-0 bg-gradient-to-b opacity-80 pointer-events-none", style.gradient)} />
            <div className="w-full max-w-lg overflow-hidden flex flex-col items-center justify-center relative z-10">
                {/* Decorative Outer Ring */}
                <div className="relative flex flex-col items-center py-8 group">
                    <div className="relative">
                        {/* Pulsing Outer Glow */}
                        <div className={cn(
                            "absolute inset-0 rounded-full blur-3xl animate-pulse scale-150 opacity-20",
                            style.accentBg
                        )} />

                        {/* Rotating Decorative Border */}
                        <div className={cn(
                            "absolute -inset-4 border border-dashed rounded-full animate-spin-slow opacity-30",
                            style.accent
                        )} style={{ animationDuration: '15s' }} />

                        {/* Main Image Container */}
                        <div className={cn(
                            "relative w-32 h-32 md:w-48 md:h-48 rounded-full border-4 shadow-2xl overflow-hidden p-1 bg-zinc-900 transition-transform duration-500 group-hover:scale-105",
                            style.border
                        )}>
                            <div className="relative w-full h-full rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-zinc-950 text-white">
                                {icon ? icon : <Loader2 className={cn("w-12 h-12 md:w-16 md:h-16 animate-spin opacity-50", style.accent)} />}
                                {/* Subtle overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40" />
                            </div>
                        </div>

                        {/* Sparkle decorations attached to the ring */}
                        <div className="absolute -top-4 -right-4">
                            <Sparkles className={cn("w-6 h-6 animate-pulse opacity-60", style.accent)} />
                        </div>
                        <div className="absolute -bottom-2 -left-4">
                            <Wind className={cn("w-6 h-6 animate-pulse opacity-40", style.accent)} style={{ animationDelay: '0.5s' }} />
                        </div>
                    </div>
                </div>

                {/* Title and description */}
                <div className="relative text-center px-4 mt-8 flex flex-col items-center">
                    <h2 className={cn("text-2xl md:text-3xl font-serif mb-6 drop-shadow-lg", style.accent)}>
                        {title}
                    </h2>
                    <div className="text-zinc-300/80 text-sm md:text-base leading-relaxed text-center font-serif">
                        {content}
                    </div>
                </div>
            </div>
        </div>
    );
}
