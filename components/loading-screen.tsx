import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Wind, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
    title: ReactNode;
    content: ReactNode;
    icon?: ReactNode;
}

export function LoadingScreen({ title, content, icon }: LoadingScreenProps) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Modal-like Backdrop */}
            <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
                aria-hidden="true"
            />
            
            <div className="w-full max-w-lg flex flex-col items-center justify-center relative z-10 text-center">
                {/* Simplified Icon Container */}
                <div className="mb-8 relative">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-amber-900/30 flex items-center justify-center bg-gray-950/50 shadow-2xl">
                        {icon ? (
                            <div className="text-amber-500 scale-75 md:scale-100">
                                {icon}
                            </div>
                        ) : (
                            <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                        )}
                    </div>
                </div>

                {/* Title and Content */}
                <h2 className="text-2xl md:text-3xl font-medieval text-amber-500 mb-6 tracking-wide drop-shadow-lg">
                    {title}
                </h2>
                <div className="text-gray-400 text-sm md:text-base leading-relaxed px-6 italic font-serif opacity-80">
                    {content}
                </div>
            </div>
        </div>
    );
}
