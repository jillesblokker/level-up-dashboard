"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { KnowledgeWorkoutForm } from "@/components/category-modals/knowledge-workout-form"

interface KnowledgeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (activity: string, amount: number, details?: string) => void
}

export function KnowledgeModal({ open, onOpenChange, onSubmit }: KnowledgeModalProps) {
  const [mounted, setMounted] = useState(false)

  // Handle mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed z-50 w-full max-w-lg scale-100 rounded-lg bg-background p-6 opacity-100 shadow-lg animate-in fade-in-90 slide-in-from-bottom-10 sm:rounded-lg md:w-full">
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold leading-none tracking-tight">Log Knowledge Activity</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Track your learning progress and earn XP</p>
        </div>

        <div className="mt-6">
          <KnowledgeWorkoutForm onSubmit={onSubmit} />
        </div>
      </div>
    </div>
  )
}

