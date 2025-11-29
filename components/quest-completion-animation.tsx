"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { CoinBurstEffect } from './coin-burst-effect'
import { useState, useEffect } from 'react'

interface QuestCompletionAnimationProps {
    show: boolean
    questName: string
    xpGained: number
    goldGained: number
    onComplete?: () => void
}

export function QuestCompletionAnimation({
    show,
    questName,
    xpGained,
    goldGained,
    onComplete
}: QuestCompletionAnimationProps) {
    const [showCoinBurst, setShowCoinBurst] = useState(false)

    useEffect(() => {
        if (show) {
            // Show coin burst after initial animation
            const timer = setTimeout(() => {
                setShowCoinBurst(true)
            }, 500)

            // Complete after all animations
            const completeTimer = setTimeout(() => {
                onComplete?.()
                setShowCoinBurst(false)
            }, 3000)

            return () => {
                clearTimeout(timer)
                clearTimeout(completeTimer)
            }
        }
        return undefined
    }, [show, onComplete])

    return (
        <>
            <AnimatePresence>
                {show && (
                    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                        {/* Background overlay */}
                        <motion.div
                            className="absolute inset-0 bg-black/50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />

                        {/* Main completion card */}
                        <motion.div
                            className="relative bg-gradient-to-br from-amber-50 to-amber-100 border-4 border-amber-800 rounded-xl p-8 shadow-2xl max-w-md"
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 10 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                            {/* Decorative wax seal */}
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                <motion.div
                                    className="w-12 h-12 bg-red-700 rounded-full border-4 border-red-900 flex items-center justify-center shadow-lg"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <span className="text-2xl">✓</span>
                                </motion.div>
                            </div>

                            {/* Content */}
                            <div className="text-center mt-4">
                                <motion.h2
                                    className="text-3xl font-bold text-amber-900 mb-2"
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    Quest Complete!
                                </motion.h2>

                                <motion.p
                                    className="text-lg text-amber-700 mb-6 italic"
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    "{questName}"
                                </motion.p>

                                {/* Rewards */}
                                <div className="flex justify-center gap-6 mb-4">
                                    <motion.div
                                        className="bg-blue-600 text-white px-6 py-3 rounded-lg border-2 border-blue-800 shadow-lg"
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.5, type: "spring" }}
                                    >
                                        <div className="text-2xl font-bold">+{xpGained}</div>
                                        <div className="text-xs">XP</div>
                                    </motion.div>

                                    <motion.div
                                        className="bg-amber-600 text-white px-6 py-3 rounded-lg border-2 border-amber-800 shadow-lg"
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.5, type: "spring" }}
                                    >
                                        <div className="text-2xl font-bold">+{goldGained}</div>
                                        <div className="text-xs">Gold</div>
                                    </motion.div>
                                </div>

                                {/* Motivational message */}
                                <motion.p
                                    className="text-sm text-amber-600 italic"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                >
                                    Your legend grows stronger...
                                </motion.p>
                            </div>

                            {/* Decorative corners */}
                            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-800" />
                            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-800" />
                        </motion.div>

                        {/* Particle effects */}
                        {[...Array(15)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-amber-400 rounded-full"
                                initial={{ scale: 0, x: 0, y: 0 }}
                                animate={{
                                    scale: [0, 1, 0],
                                    x: (Math.random() - 0.5) * 400,
                                    y: (Math.random() - 0.5) * 400,
                                    opacity: [1, 1, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    delay: i * 0.1,
                                    ease: "easeOut",
                                }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Coin burst effect */}
            <CoinBurstEffect
                show={showCoinBurst}
                goldAmount={goldGained}
                onComplete={() => setShowCoinBurst(false)}
            />
        </>
    )
}
