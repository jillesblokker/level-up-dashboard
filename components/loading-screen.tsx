import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
    title: ReactNode;
    content: ReactNode;
    icon?: ReactNode;
    className?: string;
}

export function LoadingScreen({ title, content, icon, className }: LoadingScreenProps) {
    return (
        <div className={cn("fixed inset-0 z-[1000] flex items-center justify-center p-6 overflow-hidden", className)}>
            {/* Cinematic Radial Background */}
            <div 
                className="fixed inset-0 bg-[#020617] bg-radial-gradient from-blue-900/10 via-black to-black" 
                aria-hidden="true"
            />
            
            {/* Subtle floating particles/overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('/images/noise.png')] mix-blend-overlay" />
            
            <div className="w-full max-w-xl flex flex-col items-center justify-center relative z-10 text-center scale-up-center">
                {/* Advanced icon container with mystical ring */}
                <div className="mb-12 relative">
                    {/* Pulsing Outer Glow */}
                    <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
                    
                    {/* Rotating Dashed Ring */}
                    <div className="absolute -inset-10 border border-dashed border-blue-500/20 rounded-full animate-spin-slow" style={{ animationDuration: '15s' }} />
                    <div className="absolute -inset-10 border border-dashed border-blue-400/10 rounded-full animate-spin-reverse-slow" style={{ animationDuration: '25s' }} />
                    
                    {/* Floating Sparkles */}
                    <div className="absolute -top-6 -right-6 text-blue-400/40 animate-bounce" style={{ animationDelay: '0s' }}>
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="absolute -bottom-8 -left-4 text-blue-300/30 animate-pulse" style={{ animationDelay: '1s' }}>
                        <Sparkles className="w-4 h-4" />
                    </div>
                    
                    {/* Central Icon Orb */}
                    <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full border border-blue-500/30 flex items-center justify-center bg-black/40 backdrop-blur-xl shadow-[0_0_50px_rgba(59,130,246,0.15)] group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-transparent opacity-50" />
                        <div className="relative z-10 scale-125 md:scale-150 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            {icon ? (
                                icon
                            ) : (
                                <Loader2 className="w-10 h-10 animate-spin" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Typography with enhanced hierarchy */}
                <h2 className="text-3xl md:text-4xl font-medieval text-blue-400 mb-8 tracking-wider drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    {title}
                </h2>
                <div className="text-blue-100/70 text-base md:text-lg leading-relaxed px-8 italic font-serif opacity-90 max-w-lg mx-auto">
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
