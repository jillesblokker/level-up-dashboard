"use client"

import React, { useState, useEffect } from 'react'
import { useFocusMode } from './focus-mode-context'
import { Button } from '@/components/ui/button'
import { X, CheckCircle2, Play, Pause, RotateCcw, MonitorOff } from 'lucide-react'
import { useQuestCompletion } from '@/hooks/useQuestCompletion'

export function FocusModeOverlay() {
    const { isFocusMode, toggleFocusMode, activeQuest, setFocusQuest } = useFocusMode()
    const { toggleQuestCompletion } = useQuestCompletion()

    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const [isRunning, setIsRunning] = useState(true)

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (isFocusMode && isRunning) {
            interval = setInterval(() => {
                setElapsedSeconds(prev => prev + 1)
            }, 1000)
        }

        return () => clearInterval(interval)
    }, [isFocusMode, isRunning])

    // Reset timer when entering focus mode
    useEffect(() => {
        if (isFocusMode) {
            setElapsedSeconds(0)
            setIsRunning(true)
        }
    }, [isFocusMode, activeQuest])

    if (!isFocusMode) return null

    // Format time MM:SS
    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60)
        const seconds = totalSeconds % 60
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    const handleComplete = async () => {
        if (!activeQuest) return

        // Assuming activeQuest has the structure we need
        // If activeQuest is incomplete, we mark it complete
        const currentCompleted = activeQuest.completed || false

        // We only want to "Complete" it. If it's already done (weird state), we flip it.

        await toggleQuestCompletion(
            activeQuest.id,
            currentCompleted,
            {
                name: activeQuest.name,
                xp: activeQuest.xp,
                gold: activeQuest.gold,
                category: activeQuest.category
            },
            () => {
                // On success
                setFocusQuest(null)
                toggleFocusMode()
            }
        )
    }

    const handleExit = () => {
        toggleFocusMode()
    }

    return (
        <div className="fixed inset-0 z-[100] bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center animate-in fade-in duration-500">

            {/* Top Right Exit */}
            <button
                onClick={handleExit}
                className="absolute top-6 right-6 p-4 text-zinc-500 hover:text-zinc-200 transition-colors rounded-full hover:bg-zinc-900"
                aria-label="Exit Focus Mode"
            >
                <X className="w-8 h-8" />
            </button>

            <div className="flex flex-col items-center max-w-2xl w-full px-4 text-center space-y-12">

                {/* Header / Context */}
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 text-zinc-400 text-sm font-medium border border-zinc-800">
                        <MonitorOff className="w-4 h-4" />
                        <span>Focus Mode</span>
                    </div>
                </div>

                {/* Timer */}
                <div className="relative group">
                    <h1 className="text-[120px] leading-none font-bold tabular-nums tracking-tighter bg-gradient-to-b from-zinc-100 to-zinc-500 bg-clip-text text-transparent select-none">
                        {formatTime(elapsedSeconds)}
                    </h1>

                    {/* Subtle controls on hover */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-4">
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className="p-2 text-zinc-500 hover:text-zinc-200"
                            aria-label={isRunning ? "Pause Timer" : "Resume Timer"}
                        >
                            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => setElapsedSeconds(0)}
                            className="p-2 text-zinc-500 hover:text-zinc-200"
                            aria-label="Reset Timer"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Active Quest */}
                <div className="space-y-6">
                    <h2 className="text-3xl md:text-4xl font-light text-zinc-300">
                        {activeQuest ? activeQuest.name : "Just Focusing..."}
                    </h2>

                    {activeQuest?.description && (
                        <p className="text-xl text-zinc-500 max-w-lg mx-auto leading-relaxed">
                            {activeQuest.description}
                        </p>
                    )}

                    {/* Complete Button */}
                    {activeQuest && (
                        <div className="pt-8">
                            <Button
                                size="lg"
                                onClick={handleComplete}
                                className="h-16 px-10 rounded-full text-xl bg-green-600 hover:bg-green-500 text-white font-medium shadow-[0_0_40px_-10px_rgba(22,163,74,0.4)] hover:shadow-[0_0_60px_-10px_rgba(22,163,74,0.6)] transition-all duration-300 hover:scale-105"
                            >
                                <CheckCircle2 className="w-6 h-6 mr-3" />
                                Complete Task
                            </Button>
                        </div>
                    )}
                </div>

            </div>

            {/* Footer Minimal */}
            <div className="absolute bottom-10 text-zinc-700 text-sm">
                Stay with the breath. One step at a time.
            </div>
        </div>
    )
}
