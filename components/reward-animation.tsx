"use client"

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface RewardAnimationProps {
    x: number
    y: number
    rewards: {
        type: 'gold' | 'xp'
        amount: number
    }[]
    onComplete?: () => void
}

export function RewardAnimation({ x, y, rewards, onComplete }: RewardAnimationProps) {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false)
            onComplete?.()
        }, 1500)

        return () => clearTimeout(timer)
    }, [onComplete])

    if (!isVisible) return null

    // Use portal to render on top of everything
    if (typeof document === 'undefined') return null

    return createPortal(
        <div
            className="fixed pointer-events-none z-[100]"
            style={{ left: x, top: y }}
        >
            <div className="flex flex-col gap-1">
                {rewards.map((reward, index) => (
                    <div
                        key={index}
                        className={cn(
                            "animate-float-up font-bold text-shadow-sm whitespace-nowrap",
                            reward.type === 'gold' ? "text-yellow-400" : "text-blue-400"
                        )}
                        style={{
                            animationDelay: `${index * 0.1}s`,
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}
                    >
                        +{reward.amount} {reward.type === 'gold' ? 'Gold' : 'XP'}
                    </div>
                ))}
            </div>
        </div>,
        document.body
    )
}
