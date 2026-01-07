"use client"

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Brain, Coins, Skull, Scroll, Heart } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { MysteryEvent, MysteryEventType } from '@/lib/mystery-events'

interface MysteryEventModalProps {
    isOpen: boolean
    onClose: () => void
    event: MysteryEvent | null
    onChoice: (choice: string) => void
    isProcessing?: boolean
}

export function MysteryEventModal({
    isOpen,
    onClose,
    event,
    onChoice,
    isProcessing = false
}: MysteryEventModalProps) {
    if (!event) return null

    const getStyle = (type: MysteryEventType) => {
        switch (type) {
            case 'treasure':
                return {
                    accent: 'text-amber-400',
                    accentBg: 'bg-amber-500',
                    border: 'border-amber-500/30',
                    button: 'bg-amber-600 hover:bg-amber-500',
                    icon: Coins,
                    image: '/images/riddle-sphinx.png' // Sphinx for ruins/treasure mystery
                }
            case 'riddle':
                return {
                    accent: 'text-purple-400',
                    accentBg: 'bg-purple-500',
                    border: 'border-purple-500/30',
                    button: 'bg-purple-600 hover:bg-purple-500',
                    icon: Brain,
                    image: '/images/riddle-sage.png'
                }
            case 'blessing':
                return {
                    accent: 'text-teal-400',
                    accentBg: 'bg-teal-500',
                    border: 'border-teal-500/30',
                    button: 'bg-teal-600 hover:bg-teal-500',
                    icon: Sparkles,
                    image: '/images/tiles/temple-tile.png'
                }
            case 'curse':
                return {
                    accent: 'text-red-400',
                    accentBg: 'bg-red-500',
                    border: 'border-red-500/30',
                    button: 'bg-red-600 hover:bg-red-500',
                    icon: Skull,
                    image: '/images/tiles/volcano-tile.png'
                }
            case 'quest':
                return {
                    accent: 'text-blue-400',
                    accentBg: 'bg-blue-500',
                    border: 'border-blue-500/30',
                    button: 'bg-blue-600 hover:bg-blue-500',
                    icon: Scroll,
                    image: '/images/tiles/mystery-tile.png'
                }
            default:
                return {
                    accent: 'text-zinc-400',
                    accentBg: 'bg-zinc-500',
                    border: 'border-zinc-500/30',
                    button: 'bg-zinc-600 hover:bg-zinc-500',
                    icon: Heart,
                    image: '/images/tiles/mystery-tile.png'
                }
        }
    }

    const style = getStyle(event.type)
    const Icon = style.icon

    // Try to use ruins icon specifically for ruins event
    const displayImage = event.id.includes('ruins') ? '/images/tiles/ruins-tile.png' : style.image

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
            <DialogContent className="sm:max-w-[420px] max-h-[90vh] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden flex flex-col">
                {/* Thematic Background */}
                <div className={cn("absolute inset-0 opacity-10 pointer-events-none", style.accentBg)}
                    style={{ filter: 'blur(100px)' }} />

                <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <div className="flex flex-col items-center">
                        <DialogHeader className="w-full text-center items-center">
                            <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border text-xs font-bold uppercase tracking-widest mb-4", style.border, style.accent)}>
                                <Icon className="w-3 h-3" />
                                Mystery Event
                            </div>
                            <DialogTitle className="text-3xl font-serif text-white tracking-tight mb-2">
                                {event.title}
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400 text-center leading-relaxed max-w-[280px]">
                                {event.description}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Event Display */}
                        <div className="relative w-full flex flex-col items-center py-6">
                            <div className="relative group">
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
                                    "relative w-36 h-36 rounded-full border-4 shadow-2xl overflow-hidden p-1 bg-zinc-900 transition-all duration-500",
                                    style.border
                                )}>
                                    <div className="relative w-full h-full rounded-full overflow-hidden border border-white/10">
                                        <Image
                                            src={displayImage}
                                            alt={event.title}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40" />
                                    </div>
                                </div>

                                {/* Decorative Icons */}
                                <div className="absolute -top-4 -right-4">
                                    <Icon className={cn("w-6 h-6 animate-pulse opacity-60", style.accent)} />
                                </div>
                            </div>
                        </div>

                        {!isProcessing ? (
                            <div className="w-full space-y-3 mt-4">
                                {event.choices.map((choice, index) => {
                                    const isSecondary = choice.toLowerCase().includes('leave') || choice.toLowerCase().includes('walk')
                                    return (
                                        <Button
                                            key={index}
                                            onClick={() => onChoice(choice)}
                                            variant={isSecondary ? "ghost" : "default"}
                                            className={cn(
                                                "w-full h-12 text-md font-medium tracking-wide transition-all duration-300 rounded-xl",
                                                !isSecondary && cn("text-white shadow-lg", style.button),
                                                isSecondary && "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                                            )}
                                        >
                                            {choice}
                                        </Button>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="w-full py-8 flex flex-col items-center justify-center gap-4">
                                <div className={cn("w-12 h-12 border-4 border-t-transparent rounded-full animate-spin", style.accent)}
                                    style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }} />
                                <p className="text-zinc-400 font-medium animate-pulse">Processing your choice...</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
