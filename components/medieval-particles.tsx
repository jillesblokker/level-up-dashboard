"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  type: 'gold' | 'xp' | 'sparkle' | 'magic' | 'fire'
  rotation: number
  rotationSpeed: number
}

interface MedievalParticlesProps {
  type?: 'quest-complete' | 'level-up' | 'gold-earned' | 'xp-earned' | 'magic' | 'celebration'
  intensity?: 'low' | 'medium' | 'high'
  duration?: number
  className?: string
  onComplete?: (() => void) | undefined
}

export function MedievalParticles({
  type = 'quest-complete',
  intensity = 'medium',
  duration = 2000,
  className,
  onComplete
}: MedievalParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const particlesRef = useRef<Particle[]>([])
  const [isActive, setIsActive] = useState(true)

  const intensityConfig = {
    low: { count: 10, speed: 1, size: 2 },
    medium: { count: 25, speed: 2, size: 3 },
    high: { count: 50, speed: 3, size: 4 }
  }

  const typeConfig: Record<string, { 
    types: ('gold' | 'xp' | 'sparkle' | 'magic' | 'fire')[], 
    colors: string[], 
    gravity: number 
  }> = {
    'quest-complete': { 
      types: ['gold', 'xp', 'sparkle'],
      colors: ['#f59e0b', '#3b82f6', '#ffffff'],
      gravity: 0.1
    },
    'level-up': { 
      types: ['magic', 'sparkle', 'gold'],
      colors: ['#8b5cf6', '#ffffff', '#f59e0b'],
      gravity: -0.05
    },
    'gold-earned': { 
      types: ['gold', 'sparkle'],
      colors: ['#f59e0b', '#ffffff'],
      gravity: 0.2
    },
    'xp-earned': { 
      types: ['xp', 'magic'],
      colors: ['#3b82f6', '#8b5cf6'],
      gravity: 0.1
    },
    'magic': { 
      types: ['magic', 'sparkle'],
      colors: ['#8b5cf6', '#ffffff'],
      gravity: 0
    },
    'celebration': { 
      types: ['gold', 'xp', 'magic', 'sparkle'],
      colors: ['#f59e0b', '#3b82f6', '#8b5cf6', '#ffffff'],
      gravity: 0.1
    }
  }

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const config = typeConfig[type]
    const intensitySettings = intensityConfig[intensity]

    if (!config) return

    // Create particles
    const createParticles = () => {
      const particles: Particle[] = []
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      for (let i = 0; i < intensitySettings.count; i++) {
        const particleType = config.types[Math.floor(Math.random() * config.types.length)] as 'gold' | 'xp' | 'sparkle' | 'magic' | 'fire'
        const angle = (Math.PI * 2 * i) / intensitySettings.count + Math.random() * 0.5
        const speed = intensitySettings.speed + Math.random() * intensitySettings.speed

        particles.push({
          id: i,
          x: centerX + Math.cos(angle) * 20,
          y: centerY + Math.sin(angle) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 1,
          size: intensitySettings.size + Math.random() * intensitySettings.size,
          type: particleType,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2
        })
      }

      return particles
    }

    particlesRef.current = createParticles()

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current = particlesRef.current.filter(particle => {
        // Update particle
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += config.gravity
        particle.life -= 0.02
        particle.rotation += particle.rotationSpeed

        // Draw particle
        if (particle.life > 0) {
          ctx.save()
          ctx.globalAlpha = particle.life
          ctx.translate(particle.x, particle.y)
          ctx.rotate(particle.rotation)

          const colorIndex = config.types.indexOf(particle.type)
          const color = colorIndex >= 0 && config.colors[colorIndex] ? config.colors[colorIndex] : '#ffffff'
          ctx.fillStyle = color

          switch (particle.type) {
            case 'gold':
              // Gold coin shape
              ctx.beginPath()
              ctx.arc(0, 0, particle.size, 0, Math.PI * 2)
              ctx.fill()
              ctx.strokeStyle = '#d97706'
              ctx.lineWidth = 1
              ctx.stroke()
              break

            case 'xp':
              // XP star shape
              ctx.beginPath()
              for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5
                const x = Math.cos(angle) * particle.size
                const y = Math.sin(angle) * particle.size
                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
              }
              ctx.closePath()
              ctx.fill()
              break

            case 'sparkle':
              // Sparkle cross
              ctx.beginPath()
              ctx.moveTo(-particle.size, 0)
              ctx.lineTo(particle.size, 0)
              ctx.moveTo(0, -particle.size)
              ctx.lineTo(0, particle.size)
              ctx.strokeStyle = color
              ctx.lineWidth = 2
              ctx.stroke()
              break

            case 'magic':
              // Magic circle
              ctx.beginPath()
              ctx.arc(0, 0, particle.size, 0, Math.PI * 2)
              ctx.strokeStyle = color
              ctx.lineWidth = 2
              ctx.stroke()
              break

            case 'fire':
              // Fire particle
              ctx.beginPath()
              ctx.arc(0, 0, particle.size, 0, Math.PI * 2)
              ctx.fillStyle = `hsl(${20 + Math.random() * 40}, 100%, 50%)`
              ctx.fill()
              break
          }

          ctx.restore()
        }

        return particle.life > 0
      })

      if (particlesRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsActive(false)
        onComplete?.()
      }
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, type, intensity, onComplete])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsActive(false)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}

// Quest completion celebration effect
export function QuestCompleteEffect({ 
  onComplete,
  className 
}: { 
  onComplete?: () => void
  className?: string 
}) {
  return (
    <MedievalParticles
      type="quest-complete"
      intensity="high"
      duration={3000}
      className={className || ""}
      onComplete={onComplete || undefined}
    />
  )
}

// Level up celebration effect
export function LevelUpEffect({ 
  onComplete,
  className 
}: { 
  onComplete?: () => void
  className?: string 
}) {
  return (
    <MedievalParticles
      type="level-up"
      intensity="high"
      duration={4000}
      className={className || ""}
      onComplete={onComplete || undefined}
    />
  )
}

// Gold earned effect
export function GoldEarnedEffect({ 
  amount,
  onComplete,
  className 
}: { 
  amount: number
  onComplete?: () => void
  className?: string 
}) {
  return (
    <MedievalParticles
      type="gold-earned"
      intensity={amount > 100 ? 'high' : amount > 50 ? 'medium' : 'low'}
      duration={2000}
      className={className || ""}
      onComplete={onComplete || undefined}
    />
  )
}
