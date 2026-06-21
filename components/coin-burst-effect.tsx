"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CoinBurstEffectProps {
    show: boolean
    goldAmount: number
    onComplete?: () => void
}

export function CoinBurstEffect({ show, goldAmount, onComplete }: CoinBurstEffectProps) {
    const [coins, setCoins] = useState<{ id: number; x: number; y: number; rotation: number }[]>([])

    useEffect(() => {
        if (show) {
            // Generate random coin positions
            const newCoins = Array.from({ length: 12 }, (_, i) => ({
                id: i,
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200,
                rotation: Math.random() * 720 - 360,
            }))
            setCoins(newCoins)

            // Call onComplete after animation
            const timer = setTimeout(() => {
                onComplete?.()
            }, 1500)

            return () => clearTimeout(timer)
        }
        return undefined
    }, [show, onComplete])

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                    {/* Gold amount text */}
                    <motion.div
                        className="absolute"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 1 }}
                        exit={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <div className="bg-amber-600 text-white px-6 py-3 rounded-full border-4 border-amber-800 shadow-2xl">
                            <span className="text-3xl font-bold">+{goldAmount} 🪙</span>
                        </div>
                    </motion.div>

                    {/* Coin burst particles */}
                    {coins.map((coin) => (
                        <motion.div
                            key={coin.id}
                            className="absolute"
                            initial={{ x: 0, y: 0, scale: 0, rotate: 0 }}
                            animate={{
                                x: coin.x,
                                y: coin.y,
                                scale: [0, 1.2, 0],
                                rotate: coin.rotation,
                            }}
                            transition={{
                                duration: 1.2,
                                ease: "easeOut",
                            }}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 border-2 border-amber-800 shadow-lg flex items-center justify-center">
                                <span className="text-xs">🪙</span>
                            </div>
                        </motion.div>
                    ))}

                    {/* Sparkle effects */}
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={`sparkle-${i}`}
                            className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{
                                scale: [0, 1, 0],
                                opacity: [1, 1, 0],
                                x: (Math.random() - 0.5) * 300,
                                y: (Math.random() - 0.5) * 300,
                            }}
                            transition={{
                                duration: 1.5,
                                delay: i * 0.05,
                                ease: "easeOut",
                            }}
                        />
                    ))}
                </div>
            )}
        </AnimatePresence>
    )
}
