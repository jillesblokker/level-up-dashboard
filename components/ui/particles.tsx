"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'

// Types of particles
export type ParticleType = 'gold' | 'xp' | 'sparkle' | 'fire' | 'confetti'

interface Particle {
    id: string
    x: number
    y: number
    type: ParticleType
    angle: number
    velocity: number
    lifetime: number
    color?: string | undefined
    text?: string | undefined
}

interface ParticleContextType {
    spawnParticles: (x: number, y: number, type: ParticleType, count?: number, options?: { color?: string, text?: string }) => void
    spawnFloatingText: (x: number, y: number, text: string, color?: string) => void
}

const ParticleContext = createContext<ParticleContextType | undefined>(undefined)

export const useParticles = () => {
    const context = useContext(ParticleContext)
    if (!context) {
        throw new Error('useParticles must be used within a ParticleProvider')
    }
    return context
}

export function ParticleProvider({ children }: { children: ReactNode }) {
    const [particles, setParticles] = useState<Particle[]>([])
    const [floatingTexts, setFloatingTexts] = useState<{ id: string, x: number, y: number, text: string, color: string }[]>([])

    const spawnParticles = useCallback((x: number, y: number, type: ParticleType, count = 10, options?: { color?: string, text?: string }) => {
        const newParticles: Particle[] = Array.from({ length: count }).map(() => ({
            id: uuidv4(),
            x,
            y,
            type,
            angle: Math.random() * 360,
            velocity: 2 + Math.random() * 4, // Random speed
            lifetime: 1000 + Math.random() * 1000, // 1-2 seconds
            color: options?.color,
            text: options?.text
        }))

        setParticles(prev => [...prev, ...newParticles])

        // Cleanup is handled by the component's onAnimationComplete, but we can also have a safety timeout
        setTimeout(() => {
            setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)))
        }, 2500)
    }, [])

    const spawnFloatingText = useCallback((x: number, y: number, text: string, color = '#fbbf24') => {
        const id = uuidv4()
        setFloatingTexts(prev => [...prev, { id, x, y, text, color }])

        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(ft => ft.id !== id))
        }, 2000)
    }, [])

    return (
        <ParticleContext.Provider value={{ spawnParticles, spawnFloatingText }}>
            {children}
            <ParticleSystem particles={particles} floatingTexts={floatingTexts} />
        </ParticleContext.Provider>
    )
}

function ParticleSystem({ particles, floatingTexts }: { particles: Particle[], floatingTexts: { id: string, x: number, y: number, text: string, color: string }[] }) {
    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            <AnimatePresence>
                {particles.map(particle => (
                    <Particle key={particle.id} data={particle} />
                ))}
                {floatingTexts.map(ft => (
                    <FloatingText key={ft.id} data={ft} />
                ))}
            </AnimatePresence>
        </div>
    )
}

function Particle({ data }: { data: Particle }) {
    // Calculate end position based on angle and velocity
    // We'll animate x and y directly
    const distance = 100 + Math.random() * 100
    const radian = (data.angle * Math.PI) / 180
    const endX = Math.cos(radian) * distance
    const endY = Math.sin(radian) * distance

    const getParticleContent = () => {
        switch (data.type) {
            case 'gold': return '🪙'
            case 'xp': return '✨'
            case 'sparkle': return '⭐'
            case 'fire': return '🔥'
            case 'confetti': return ['🎉', '🎊', '🎈'][Math.floor(Math.random() * 3)]
            default: return '•'
        }
    }

    return (
        <motion.div
            initial={{ x: data.x, y: data.y, scale: 0, opacity: 1 }}
            animate={{
                x: data.x + endX,
                y: data.y + endY + 100, // Add gravity effect
                scale: [0, 1.5, 0],
                rotate: Math.random() * 360 * 2
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: data.lifetime / 1000, ease: "easeOut" }}
            className="absolute text-xl"
            style={{ color: data.color }}
        >
            {getParticleContent()}
        </motion.div>
    )
}

function FloatingText({ data }: { data: { id: string, x: number, y: number, text: string, color: string } }) {
    return (
        <motion.div
            initial={{ x: data.x, y: data.y, opacity: 0, scale: 0.5 }}
            animate={{
                y: data.y - 100,
                opacity: [0, 1, 1, 0],
                scale: 1
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute font-bold text-2xl drop-shadow-md whitespace-nowrap"
            style={{
                color: data.color,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
        >
            {data.text}
        </motion.div>
    )
}
