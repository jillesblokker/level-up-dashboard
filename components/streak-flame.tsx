"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface StreakFlameProps {
    streakDays: number
    className?: string
}

export function StreakFlame({ streakDays, className = '' }: StreakFlameProps) {
    const [flameSize, setFlameSize] = useState(1)
    const [flameColor, setFlameColor] = useState('#FF6B35')

    useEffect(() => {
        // Flame grows with streak length
        if (streakDays >= 100) {
            setFlameSize(3)
            setFlameColor('#FFD700') // Gold flame for 100+ days
        } else if (streakDays >= 30) {
            setFlameSize(2.5)
            setFlameColor('#FFA500') // Orange-gold for 30+ days
        } else if (streakDays >= 7) {
            setFlameSize(2)
            setFlameColor('#FF8C00') // Dark orange for 7+ days
        } else if (streakDays >= 3) {
            setFlameSize(1.5)
            setFlameColor('#FF6B35') // Orange-red for 3+ days
        } else {
            setFlameSize(1)
            setFlameColor('#FF4500') // Red-orange for new streaks
        }
    }, [streakDays])

    // Milestone particle effects
    const isMilestone = streakDays === 7 || streakDays === 30 || streakDays === 100

    return (
        <div className={`relative inline-block ${className}`}>
            {/* Main flame */}
            <motion.div
                className="relative"
                animate={{
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{
                    transform: `scale(${flameSize})`
                }}
            >
                {/* Flame SVG */}
                <svg
                    width="60"
                    height="80"
                    viewBox="0 0 60 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-lg"
                >
                    {/* Outer flame */}
                    <motion.path
                        d="M30 5 C20 15, 15 25, 15 40 C15 55, 20 65, 30 75 C40 65, 45 55, 45 40 C45 25, 40 15, 30 5 Z"
                        fill={flameColor}
                        animate={{
                            d: [
                                "M30 5 C20 15, 15 25, 15 40 C15 55, 20 65, 30 75 C40 65, 45 55, 45 40 C45 25, 40 15, 30 5 Z",
                                "M30 3 C18 13, 13 23, 13 40 C13 57, 18 67, 30 77 C42 67, 47 57, 47 40 C47 23, 42 13, 30 3 Z",
                                "M30 5 C20 15, 15 25, 15 40 C15 55, 20 65, 30 75 C40 65, 45 55, 45 40 C45 25, 40 15, 30 5 Z",
                            ]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Inner flame (lighter) */}
                    <motion.path
                        d="M30 15 C25 22, 22 30, 22 40 C22 50, 25 58, 30 65 C35 58, 38 50, 38 40 C38 30, 35 22, 30 15 Z"
                        fill="#FFE4B5"
                        opacity="0.8"
                        animate={{
                            d: [
                                "M30 15 C25 22, 22 30, 22 40 C22 50, 25 58, 30 65 C35 58, 38 50, 38 40 C38 30, 35 22, 30 15 Z",
                                "M30 13 C24 20, 20 28, 20 40 C20 52, 24 60, 30 67 C36 60, 40 52, 40 40 C40 28, 36 20, 30 13 Z",
                                "M30 15 C25 22, 22 30, 22 40 C22 50, 25 58, 30 65 C35 58, 38 50, 38 40 C38 30, 35 22, 30 15 Z",
                            ]
                        }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Core (brightest) */}
                    <motion.ellipse
                        cx="30"
                        cy="45"
                        rx="8"
                        ry="12"
                        fill="#FFFACD"
                        animate={{
                            ry: [12, 14, 12],
                            opacity: [0.9, 1, 0.9]
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </svg>

                {/* Streak number overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                        className="text-white font-bold text-xl drop-shadow-lg"
                        animate={{
                            scale: isMilestone ? [1, 1.2, 1] : 1,
                        }}
                        transition={{
                            duration: 0.5,
                            repeat: isMilestone ? Infinity : 0,
                        }}
                    >
                        {streakDays}
                    </motion.span>
                </div>
            </motion.div>

            {/* Milestone particle effects */}
            {isMilestone && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-yellow-400"
                            style={{
                                left: '50%',
                                top: '50%',
                            }}
                            animate={{
                                x: [0, Math.cos(i * Math.PI / 4) * 40],
                                y: [0, Math.sin(i * Math.PI / 4) * 40],
                                opacity: [1, 0],
                                scale: [1, 0],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.1,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Streak label */}
            <div className="text-center mt-2">
                <p className="text-amber-300 text-sm font-semibold">
                    {streakDays === 1 ? '1 Day' : `${streakDays} Days`}
                </p>
                <p className="text-gray-400 text-xs">Streak</p>
            </div>
        </div>
    )
}
