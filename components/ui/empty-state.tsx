import React from 'react'
import Image from 'next/image'
import { cn, renderSafeNode } from '@/lib/utils'
import { ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: any
  creatureImage?: string
  creatureName?: string
  actionLabel?: string
  onAction?: () => void
  action?: React.ReactNode
  className?: string
}

export function MedievalEmptyState({
  title = "No items discovered",
  description = "The realm is quiet. Perform daily habits and explore the kingdom to uncover new treasure!",
  icon,
  creatureImage,
  creatureName,
  actionLabel,
  onAction,
  action,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "p-6 sm:p-8 rounded-2xl border-2 border-amber-600/40 bg-gradient-to-b from-[#18110b] via-[#0f0b07] to-[#0a0705] text-center space-y-4 shadow-2xl relative overflow-hidden my-4",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/10 via-transparent to-transparent pointer-events-none" />

      {/* Creature Avatar or Icon */}
      <div className="flex items-center justify-center relative z-10">
        {creatureImage ? (
          <div className="relative w-16 h-16 rounded-2xl border-2 border-amber-500/40 bg-zinc-950/90 shadow-xl overflow-hidden shrink-0">
            <Image
              src={creatureImage}
              alt={creatureName || "Companion"}
              fill
              className="object-contain p-1"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-amber-950/50 border-2 border-amber-600/40 flex items-center justify-center text-amber-300 shadow-xl">
            {icon ? renderSafeNode(icon, { className: "w-6 h-6" }) : <ScrollText className="w-6 h-6" />}
          </div>
        )}
      </div>

      <div className="space-y-1.5 max-w-md mx-auto relative z-10">
        <h4 className="font-serif text-base sm:text-lg text-amber-200 font-bold">{title}</h4>
        <p className="text-xs text-amber-300/80 leading-relaxed font-sans">
          {description}
        </p>
      </div>

      {(action || (actionLabel && onAction)) && (
        <div className="pt-1 relative z-10 flex justify-center">
          {action ? (
            action
          ) : (
            <Button
              onClick={onAction}
              className="btn-primary-cta text-xs px-6 py-2.5 h-auto shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 font-serif font-bold"
            >
              <span>⚔️</span> {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export const EmptyState = MedievalEmptyState;
