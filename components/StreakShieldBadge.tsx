'use client'

import React, { useState, useEffect } from 'react'
import { Shield, ShieldAlert, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface StreakShieldBadgeProps {
  userId?: string
  streakDays?: number
  className?: string
}

export function StreakShieldBadge({ userId, streakDays = 0, className = '' }: StreakShieldBadgeProps) {
  const { toast } = useToast()
  const [scrollCount, setScrollCount] = useState<number>(0)
  const [isProtected, setIsProtected] = useState<boolean>(false)

  useEffect(() => {
    try {
      const currentInv = JSON.parse(localStorage.getItem('tileInventory') || '{}')
      const count = currentInv['streak-scroll']?.quantity || 0
      setScrollCount(count)
      setIsProtected(count > 0)
    } catch {
      // Fallback
    }
  }, [userId])

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Badge
        variant="outline"
        className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-mono text-xs transition-all ${
          isProtected
            ? 'bg-blue-950/80 border-blue-500/50 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400'
        }`}
      >
        {isProtected ? (
          <>
            <Shield className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>Streak Freeze Active ({scrollCount})</span>
          </>
        ) : (
          <>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>No Streak Freeze (0)</span>
          </>
        )}
      </Badge>
    </div>
  )
}
