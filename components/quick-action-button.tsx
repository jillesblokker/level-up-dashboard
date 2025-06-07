"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { ReactNode } from "react"

interface QuickAction {
  icon: ReactNode
  label: string
  xp: number
}

interface QuickActionButtonProps {
  title: string
  icon: ReactNode
  color: string
  actions: QuickAction[]
}

export function QuickActionButton({ title, icon, color, actions }: QuickActionButtonProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button
          variant="outline"
          className={`h-24 w-full justify-start ${color} hover:${color}/90`}
        >
          <div className="flex flex-col items-center justify-center w-full space-y-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
          </div>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{title} Actions</h4>
          <div className="grid gap-2">
            {actions.map((action, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md p-2 hover:bg-accent"
              >
                <div className="flex items-center space-x-2">
                  {action.icon}
                  <span className="text-sm">{action.label}</span>
                </div>
                <span className="text-sm text-green-500">+{action.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

