"use client"

import React from 'react'
import { cn, renderSafeNode } from '@/lib/utils'
import { ScrollText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: any
  actionLabel?: string
  onAction?: () => void
  action?: React.ReactNode
  className?: string
}

export function MedievalEmptyState({
  title = "No Items Discovered",
  description = "The realm is quiet. Perform daily habits and explore the kingdom to uncover new treasure!",
  icon,
  actionLabel,
  onAction,
  action,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "p-8 rounded-2xl border border-amber-900/40 bg-gradient-to-b from-amber-950/20 via-zinc-950/90 to-zinc-950 text-center space-y-3 shadow-xl relative overflow-hidden my-4",
        className
      )}
    >
      <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
        {icon ? renderSafeNode(icon, { className: "w-6 h-6" }) : <ScrollText className="w-6 h-6" />}
      </div>

      <div className="space-y-1">
        <h4 className="font-medieval text-lg text-amber-200">{title}</h4>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed italic">
          {description}
        </p>
      </div>

      {action || (actionLabel && onAction && (
        <div className="pt-2">
          <Button
            onClick={onAction}
            variant="gold"
            className="h-9 px-5 text-xs font-bold uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {actionLabel}
          </Button>
        </div>
      ))}
    </div>
  )
}

export const EmptyState = MedievalEmptyState;
