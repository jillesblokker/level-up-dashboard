"use client"

import { useEffect, useState } from "react"
import confetti from "canvas-confetti"

interface CelebrationEffectProps {
  message?: string
}

export function CelebrationEffect({ message = "Congratulations!" }: CelebrationEffectProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Fire confetti
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      // Since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#ef5350", "#42a5f5", "#66bb6a", "#ffa726", "#ab47bc"],
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#ef5350", "#42a5f5", "#66bb6a", "#ffa726", "#ab47bc"],
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-primary text-primary-foreground font-bold text-lg md:text-xl p-4 rounded-lg shadow-lg animate-bounce text-center max-w-[80%]">
        {message}
      </div>
    </div>
  )
}

