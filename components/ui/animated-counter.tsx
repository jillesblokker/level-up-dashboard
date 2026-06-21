"use client"

import { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
    value: number
    duration?: number
    className?: string
    prefix?: string
    suffix?: string
    decimals?: number
    separator?: string
}

export function AnimatedCounter({
    value,
    duration = 1000,
    className = '',
    prefix = '',
    suffix = '',
    decimals = 0,
    separator = ','
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(value)
    const previousValueRef = useRef(value)
    const animationFrameRef = useRef<number>()
    const startTimeRef = useRef<number>()

    useEffect(() => {
        const previousValue = previousValueRef.current
        const difference = value - previousValue

        // If no change, don't animate
        if (difference === 0) return

        // Cancel any ongoing animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }

        // Reset start time
        startTimeRef.current = undefined

        const animate = (currentTime: number) => {
            if (!startTimeRef.current) {
                startTimeRef.current = currentTime
            }

            const elapsed = currentTime - startTimeRef.current
            const progress = Math.min(elapsed / duration, 1)

            // Easing function (ease-out cubic)
            const easeOutCubic = 1 - Math.pow(1 - progress, 3)

            const currentValue = previousValue + difference * easeOutCubic
            setDisplayValue(currentValue)

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate)
            } else {
                setDisplayValue(value)
                previousValueRef.current = value
            }
        }

        animationFrameRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [value, duration])

    // Format number with separators
    const formatNumber = (num: number) => {
        const fixed = num.toFixed(decimals)
        const parts = fixed.split('.')
        if (parts[0]) {
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)
        }
        return parts.join('.')
    }

    return (
        <span className={className}>
            {prefix}
            {formatNumber(displayValue)}
            {suffix}
        </span>
    )
}
