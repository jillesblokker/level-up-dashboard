"use client"

import * as React from 'react'
import { useState } from "react"
import { HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface OnboardingGuideProps {
  open: boolean
  onClose: (dontShowAgain: boolean, disableAll?: boolean) => void
  disableAllOption?: boolean
}

export function OnboardingGuide({ open, onClose, disableAllOption = false }: OnboardingGuideProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [disableAll, setDisableAll] = useState(false)

  const handleClose = () => {
    onClose(dontShowAgain, disableAll)
    setDontShowAgain(false)
    setDisableAll(false)
  }

  const handleCheckboxChange = (checked: boolean) => {
    // ... existing code ...
  }

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-md bg-black text-white border-amber-800/20">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center">
            <HelpCircle className="mr-2 h-5 w-5 text-amber-500" />
            Welcome to Level Up Kingdom
          </DialogTitle>
          <DialogDescription>Your journey to self-improvement begins here!</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p>
            Level Up Kingdom transforms your daily tasks into an epic medieval adventure. Complete real-life tasks to
            earn gold, gain experience, and expand your kingdom!
          </p>

          <div className="space-y-2">
            <h3 className="font-medium">Key Features:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Track daily tasks and habits</li>
              <li>Earn gold and XP for completing tasks</li>
              <li>Build and expand your kingdom on the world map</li>
              <li>Discover cities, dungeons, and treasures</li>
              <li>Battle monsters and complete quests</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Getting Started:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Check your daily tasks and complete them</li>
              <li>Use earned gold to purchase tiles on the world map</li>
              <li>Explore the map to discover hidden locations</li>
              <li>Visit the market to buy special items</li>
            </ul>
          </div>

          <p>It&apos;s time to start your journey!</p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked: boolean) => setDontShowAgain(checked === true)}
            />
            <label htmlFor="dont-show" className="text-sm cursor-pointer">
              Don&apos;t show this guide again
            </label>
          </div>

          {disableAllOption && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="disable-all"
                checked={disableAll}
                onCheckedChange={(checked: boolean) => setDisableAll(checked === true)}
              />
              <label htmlFor="disable-all" className="text-sm cursor-pointer">
                Disable all onboarding guides
              </label>
            </div>
          )}

          <Button
            type="button"
            className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 sm:ml-auto"
            onClick={handleClose}
          >
            Begin Adventure
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

