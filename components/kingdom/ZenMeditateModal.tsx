"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Cloud, Wind } from 'lucide-react'
import { updateCharacterStats } from '@/lib/character-stats-service'
import { toast } from 'sonner'

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
            <DialogContent className="max-w-md bg-stone-900/95 border-stone-800 backdrop-blur-md">
                <DialogHeader>
                    <DialogTitle className="text-center font-serif text-2xl text-stone-200 flex items-center justify-center gap-2">
                        <Cloud className="w-6 h-6 text-teal-400/50" />
                        Breathe
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center py-12 space-y-8">
                    {/* Breathing Circle */}
                    <div className="relative flex items-center justify-center">
                        <div className={`w-32 h-32 rounded-full border-4 border-teal-500/30 transition-all duration-[4000ms] flex items-center justify-center
                    ${phase === 'inhale' ? 'scale-150 bg-teal-500/10' : phase === 'exhale' ? 'scale-100 bg-transparent' : 'scale-150 bg-teal-500/20'}
                 `}>
                            <Wind className={`w-12 h-12 text-teal-400 transition-opacity duration-1000 ${phase === 'hold' ? 'opacity-100' : 'opacity-70'}`} />
                        </div>
                        <div className="absolute top-40 text-stone-400 font-medium tracking-widest uppercase text-sm">
                            {phase === 'inhale' ? 'Inhale...' : phase === 'hold' ? 'Hold...' : 'Exhale...'}
                        </div>
                    </div>

                    <Button
                        onClick={handleMeditate}
                        disabled={!canClaim}
                        className={`w-full transition-all duration-500 ${canClaim ? 'bg-teal-700 hover:bg-teal-600 text-teal-50' : 'bg-stone-800 text-stone-500'}`}
                    >
                        {canClaim ? "I feel centered (+10 XP)" : "Meditate..."}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
