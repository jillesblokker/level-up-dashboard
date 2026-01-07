"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Wind, Sparkles, ScrollText } from 'lucide-react'
import { updateCharacterStats } from '@/lib/character-stats-service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ZenMeditateModalProps {
    isOpen: boolean
    onClose: () => void
}

export function ZenMeditateModal({ isOpen, onClose }: ZenMeditateModalProps) {
    const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
    const [canClaim, setCanClaim] = useState(false)
    const [seconds, setSeconds] = useState(0)

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setPhase('inhale')
            setCanClaim(false)
            setSeconds(0)
        }
    }, [isOpen])

    // Meditation timer loop
    useEffect(() => {
        if (!isOpen) return

        const interval = setInterval(() => {
            setSeconds(s => s + 1)
        }, 1000)

        // Breathing cycle: Inhale 4s, Hold 4s, Exhale 4s
        const breathCycle = setInterval(() => {
            setPhase(p => {
                if (p === 'inhale') return 'hold'
                if (p === 'hold') return 'exhale'
                return 'inhale'
            })
        }, 4000)

        return () => {
            clearInterval(interval)
            clearInterval(breathCycle)
        }
    }, [isOpen])

    // Simple claim check
    useEffect(() => {
        if (seconds >= 12) setCanClaim(true)
    }, [seconds])

    const handleMeditate = async () => {
        await updateCharacterStats({ experience: 10 })
        toast.success("You feel centered.", { description: "+10 XP" })
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-zinc-950 border-teal-900/30 text-zinc-100 overflow-hidden shadow-2xl shadow-teal-900/20">
                <div className="absolute inset-0 bg-gradient-to-b from-teal-950/20 to-transparent pointer-events-none" />

                <DialogHeader className="relative z-10">
                    <DialogTitle className="text-center font-serif text-3xl text-teal-200">
                        The Sacred Garden
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-400 mt-2 text-sm italic font-light">
                        Leave the chaos of the realm behind.
                        A moment of silence is a hero&apos;s greatest weapon.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative z-10 flex flex-col items-center justify-center py-10 space-y-12">
                    {/* Intro / Guidance Text */}
                    {!canClaim && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-teal-900/10 border border-teal-800/20 rounded-full animate-in fade-in slide-in-from-top-4 duration-700">
                            <ScrollText className="w-4 h-4 text-teal-400" />
                            <span className="text-xs text-teal-200/80 tracking-wide uppercase">Follow the circle to regain focus</span>
                        </div>
                    )}

                    {/* Breathing Visual */}
                    <div className="relative flex flex-col items-center justify-center">
                        {/* Outer Glows */}
                        <div className={cn(
                            "absolute w-48 h-48 rounded-full transition-all duration-[4000ms] blur-3xl opacity-20",
                            phase === 'inhale' ? 'bg-teal-400 scale-125' : phase === 'hold' ? 'bg-emerald-400 scale-150' : 'bg-blue-400 scale-100'
                        )} />

                        {/* The Actual Breathing Circle */}
                        <div className={cn(
                            "relative w-32 h-32 rounded-full border border-teal-500/30 flex items-center justify-center transition-all duration-[4000ms] ease-in-out shadow-inner",
                            phase === 'inhale' ? 'scale-150 bg-teal-500/5' : phase === 'hold' ? 'scale-150 bg-teal-500/20' : 'scale-100 bg-transparent'
                        )}>
                            <div className="flex flex-col items-center justify-center">
                                <Wind className={cn(
                                    "w-12 h-12 text-teal-300 transition-all duration-1000",
                                    phase === 'hold' ? 'scale-110 rotate-12 opacity-100' : 'scale-100 opacity-60'
                                )} />
                            </div>
                        </div>

                        {/* Phase Text - Moved inside the relative container but NOT absolute positioned relative to the circle center to avoid overlap */}
                        <div className="mt-12 flex flex-col items-center gap-1">
                            <span className="text-xl font-serif text-teal-100 tracking-[0.3em] uppercase transition-all duration-700">
                                {phase === 'inhale' ? 'Inhale' : phase === 'hold' ? 'Hold' : 'Exhale'}
                            </span>
                            <div className="w-12 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-[200px] flex flex-col items-center space-y-2">
                        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                            <div
                                className="h-full bg-teal-500/50 transition-all duration-1000"
                                style={{ width: `${Math.min(100, (seconds / 12) * 100)}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Moment remaining...</span>
                    </div>

                    <Button
                        onClick={handleMeditate}
                        disabled={!canClaim}
                        className={cn(
                            "w-full py-6 transition-all duration-500 font-serif text-lg",
                            canClaim
                                ? "bg-teal-800 hover:bg-teal-700 text-teal-50 shadow-lg shadow-teal-900/40 border-teal-600"
                                : "bg-zinc-900 text-zinc-600 border-zinc-800 grayscale"
                        )}
                    >
                        {canClaim ? (
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-teal-300" />
                                Claim Serenity (+10 XP)
                            </span>
                        ) : (
                            "Still Centering..."
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
