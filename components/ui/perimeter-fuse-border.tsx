"use client"

import React, { useRef, useState, useLayoutEffect, useEffect } from "react"
import { cn } from "@/lib/utils"

export interface PerimeterFuseBorderProps {
  color?: 'emerald' | 'amber' | 'cyan' | 'purple' | 'crimson' | 'frost'
  durationMs?: number
  progressPercent?: number
  strokeWidth?: number
  borderRadius?: number
  className?: string
  animated?: boolean
}

export function PerimeterFuseBorder({
  color = 'emerald',
  durationMs,
  progressPercent,
  strokeWidth = 2.5,
  borderRadius = 12,
  className,
  animated = true,
}: PerimeterFuseBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 300, h: 80 })
  const [totalLen, setTotalLen] = useState<number>(0)

  useLayoutEffect(() => {
    const el = containerRef.current?.parentElement
    if (!el) return undefined

    const updateSize = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setDims({ w: rect.width, h: rect.height })
      }
    }

    updateSize()
    const animTimer = setTimeout(updateSize, 350)

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateSize)
      ro.observe(el)
      return () => {
        clearTimeout(animTimer)
        ro.disconnect()
      }
    }
    return () => clearTimeout(animTimer)
  }, [])

  useEffect(() => {
    if (pathRef.current) {
      try {
        const len = pathRef.current.getTotalLength()
        if (len > 0) setTotalLen(Math.round(len))
      } catch {}
    }
  }, [dims])

  const { w, h } = dims
  const inset = strokeWidth / 2
  const r = borderRadius
  const rx = Math.max(1, r - inset)

  // Clockwise path starting at top-right corner (w - r, inset)
  const pathD = `M ${w - r} ${inset} A ${rx} ${rx} 0 0 1 ${w - inset} ${r} L ${w - inset} ${h - r} A ${rx} ${rx} 0 0 1 ${w - r} ${h - inset} L ${r} ${h - inset} A ${rx} ${rx} 0 0 1 ${inset} ${h - r} L ${inset} ${r} A ${rx} ${rx} 0 0 1 ${r} ${inset} Z`

  const colorPalettes = {
    emerald: { grad: ['#34d399', '#10b981', '#059669'], text: 'text-emerald-400' },
    amber: { grad: ['#fbbf24', '#f59e0b', '#d97706'], text: 'text-amber-400' },
    cyan: { grad: ['#38bdf8', '#06b6d4', '#0284c7'], text: 'text-cyan-400' },
    purple: { grad: ['#c084fc', '#a855f7', '#7e22ce'], text: 'text-purple-400' },
    crimson: { grad: ['#f87171', '#ef4444', '#b91c1c'], text: 'text-red-400' },
    frost: { grad: ['#93c5fd', '#3b82f6', '#1d4ed8'], text: 'text-blue-400' },
  }

  const palette = colorPalettes[color] || colorPalettes.emerald
  const uniqueId = React.useId().replace(/:/g, '')

  let strokeDashoffset = 0
  if (progressPercent !== undefined && totalLen > 0) {
    strokeDashoffset = totalLen * (1 - Math.max(0, Math.min(100, progressPercent)) / 100)
  }

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 pointer-events-none overflow-hidden z-20", className)}
      style={{ borderRadius }}
    >
      <svg className={cn("w-full h-full overflow-visible", palette.text)} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          <linearGradient id={`perimeter-grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.grad[0]} />
            <stop offset="50%" stopColor={palette.grad[1]} />
            <stop offset="100%" stopColor={palette.grad[2]} />
          </linearGradient>
          <filter id={`perimeter-glow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke={`url(#perimeter-grad-${uniqueId})`}
          strokeWidth={strokeWidth}
          filter={`url(#perimeter-glow-${uniqueId})`}
          style={
            durationMs && totalLen > 0
              ? {
                  strokeDasharray: `${totalLen} ${totalLen}`,
                  strokeDashoffset: 0,
                  ['--toast-perimeter-len' as any]: `${totalLen}px`,
                  animation: `toast-perimeter-deplete ${durationMs}ms linear forwards`,
                }
              : progressPercent !== undefined && totalLen > 0
              ? {
                  strokeDasharray: `${totalLen} ${totalLen}`,
                  strokeDashoffset,
                  transition: 'stroke-dashoffset 500ms linear',
                }
              : {
                  strokeDasharray: totalLen ? `${totalLen * 0.4} ${totalLen * 0.1}` : '1000 1000',
                  animation: animated ? 'perimeter-dash-rotate 12s linear infinite' : 'none',
                }
          }
        />
      </svg>
    </div>
  )
}
