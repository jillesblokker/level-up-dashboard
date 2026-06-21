"use client"

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Coins, Crown, Sparkles, Star } from 'lucide-react'

interface LuckyCelebrationProps {
    onComplete: () => void
    amount: number
}

export function LuckyCelebration({ onComplete, amount }: LuckyCelebrationProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete()
        }, 3500) // Duration of celebration
        return () => clearTimeout(timer)
    }, [onComplete])

    // Generate random particles
    const particles = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100 - 50, // -50% to 50% relative to center
        y: Math.random() * 100 - 50,
        scale: Math.random() * 0.5 + 0.5,
        delay: Math.random() * 0.5,
        color: Math.random() > 0.5 ? '#fbbf24' : '#f59e0b' // Amber hues
    }))

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Main Container */}
            <div className="relative flex flex-col items-center justify-center">

                {/* Radiating Glow/Rays */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-[500px] h-[500px] -z-10 bg-gradient-to-r from-amber-500/0 via-amber-500/20 to-amber-500/0 rounded-full blur-3xl opacity-50"
                />

                {/* Text Animation */}
                <motion.div
                    initial={{ scale: 0.5, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex flex-col items-center gap-4 text-center"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-12 h-12 text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" strokeWidth={1.5} />
                        <span className="text-amber-200 font-bold uppercase tracking-widest text-sm drop-shadow-md">Kingdom Fortune</span>
                        <Crown className="w-12 h-12 text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" strokeWidth={1.5} />
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-tighter filter"
                        style={{ textShadow: '0 0 30px rgba(245, 158, 11, 0.5)' }}>
                        LUCKY FIND!
                    </h1>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-8 py-4 rounded-2xl border-2 border-amber-400/50 shadow-2xl mt-4"
                    >
                        <Coins className="w-10 h-10 text-amber-400" />
                        <span className="text-4xl font-bold text-amber-100">+{amount} Gold</span>
                    </motion.div>
                </motion.div>

                {/* Exploding Coins & Stars */}
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                        animate={{
                            x: `${p.x}vw`,
                            y: `${p.y}vh`,
                            scale: p.scale,
                            opacity: [0, 1, 1, 0],
                            rotate: Math.random() * 360
                        }}
                        transition={{
                            duration: 2,
                            delay: p.delay,
                            ease: "easeOut"
                        }}
                        className="absolute text-amber-400"
                    >
                        {p.id % 2 === 0 ? <Star className="w-6 h-6 fill-current" /> : <Sparkles className="w-8 h-8" />}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}
