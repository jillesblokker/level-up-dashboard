"use client"

import { motion } from 'framer-motion'

interface ChronicleProgressBarProps {
    currentLevel: number
    currentXP: number
    xpToNextLevel: number
    actName: string
    actDescription: string
}

export function ChronicleProgressBar({
    currentLevel,
    currentXP,
    xpToNextLevel,
    actName,
    actDescription
}: ChronicleProgressBarProps) {
    const progress = (currentXP / xpToNextLevel) * 100

    // Determine which act the player is in
    const getAct = (level: number) => {
        if (level <= 10) return { number: 'I', name: 'The Awakening', subtitle: 'Peasant to Squire' }
        if (level <= 30) return { number: 'II', name: 'The Trials', subtitle: 'Squire to Knight' }
        return { number: 'III', name: 'The Reign', subtitle: 'Knight to Lord' }
    }

    const act = getAct(currentLevel)

    return (
        <div className="relative w-full">
            {/* Parchment background */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-4 border-amber-800 rounded-lg p-6 shadow-2xl relative overflow-hidden">
                {/* Medieval manuscript decoration */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <pattern id="parchment" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                            <path d="M10 10 L20 20 M20 10 L10 20" stroke="#8B4513" strokeWidth="1" />
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#parchment)" />
                    </svg>
                </div>

                {/* Header */}
                <div className="relative z-10 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                                <span className="text-4xl">📜</span>
                                The Chronicle of Your Journey
                            </h2>
                            <p className="text-sm text-amber-700 italic mt-1">
                                Act {act.number}: {act.name}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-amber-900">
                                Level {currentLevel}
                            </div>
                            <div className="text-xs text-amber-700">
                                {act.subtitle}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-amber-800">
                            {currentXP} / {xpToNextLevel} XP
                        </span>
                        <span className="text-sm font-semibold text-amber-800">
                            {Math.round(progress)}%
                        </span>
                    </div>

                    {/* Progress bar container */}
                    <div className="relative h-8 bg-amber-200 border-2 border-amber-800 rounded-full overflow-hidden shadow-inner">
                        {/* Animated progress fill */}
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        >
                            {/* Shine effect */}
                            <motion.div
                                className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                                animate={{
                                    x: ['-100%', '200%']
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                            />
                        </motion.div>

                        {/* Progress text overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-white drop-shadow-lg">
                                {progress >= 10 && `${Math.round(progress)}% to Level ${currentLevel + 1}`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Decorative wax seals at corners */}
                <div className="absolute top-2 right-2 w-8 h-8 bg-red-700 rounded-full border-2 border-red-900 opacity-70" />
                <div className="absolute bottom-2 left-2 w-8 h-8 bg-red-700 rounded-full border-2 border-red-900 opacity-70" />
            </div>

            {/* Milestone indicators */}
            {currentLevel % 10 === 0 && currentLevel > 0 && (
                <motion.div
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                    <div className="bg-amber-600 text-white px-4 py-2 rounded-full border-2 border-amber-800 shadow-lg">
                        <span className="text-sm font-bold">🏆 Milestone Reached!</span>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
