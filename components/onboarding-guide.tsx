"use client"

import * as React from 'react'
import { useState, useEffect } from "react"
import { HelpCircle, ArrowRight, ShieldCheck } from "lucide-react"
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
import { useOnboarding } from "@/hooks/use-onboarding"

interface OnboardingGuideProps {
  open: boolean
  onClose: (dontShowAgain: boolean, disableAll?: boolean) => void
  disableAllOption?: boolean
}

export function OnboardingGuide({ open, onClose, disableAllOption = false }: OnboardingGuideProps) {
  const { showGateway, hideGateway, openOnboarding } = useOnboarding()
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [disableAll, setDisableAll] = useState(false)
  const [isGatewayVisible, setIsGatewayVisible] = useState(false)

  // Sync internal gateway visibility with hook state
  useEffect(() => {
    if (open && showGateway) {
      setIsGatewayVisible(true)
    } else {
      setIsGatewayVisible(false)
    }
  }, [open, showGateway])

  const handleClose = () => {
    onClose(dontShowAgain, disableAll)
    setDontShowAgain(false)
    setDisableAll(false)
  }

  const handleStartOnboarding = () => {
    if (dontShowAgain) {
      hideGateway()
    }
    setIsGatewayVisible(false)
    // The hook will handle opening the guide now
    openOnboarding(true)
  }

  const handleSkipGateway = () => {
    if (dontShowAgain) {
      hideGateway()
    }
    handleClose()
  }

  if (isGatewayVisible) {
    return (
      <Dialog open={open} onOpenChange={() => handleSkipGateway()}>
        <DialogContent className="sm:max-w-md bg-stone-950 text-white border-amber-800/40 p-0 overflow-hidden shadow-2xl">
          <div className="relative p-6 pt-10">
            {/* Background Ornate Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

            <DialogHeader className="relative z-10 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center border-2 border-amber-500/30 mb-2">
                <ShieldCheck className="h-8 w-8 text-amber-500" />
              </div>
              <DialogTitle className="font-serif text-3xl text-amber-100 tracking-wide">
                Are you new to ThriveHaven?
              </DialogTitle>
              <DialogDescription className="text-amber-200/70 text-lg italic">
                A grand journey awaits you, traveler. Shall we show you the way?
              </DialogDescription>
            </DialogHeader>

            <div className="py-8 relative z-10">
              <p className="text-center text-amber-100/80 leading-relaxed">
                Start your initiation to learn how to master your habits and build your legendary kingdom.
              </p>
            </div>

            <div className="space-y-6 relative z-10">
              <Button
                onClick={handleStartOnboarding}
                className="w-full h-14 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-lg"
              >
                Start Onboarding
                <ArrowRight className="h-5 w-5" />
              </Button>

              <div className="flex flex-col items-center gap-4 pt-2">
                <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>
                  <Checkbox
                    id="gateway-dont-show"
                    checked={dontShowAgain}
                    onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                    className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:text-stone-950"
                  />
                  <label
                    htmlFor="gateway-dont-show"
                    className="text-sm text-amber-200/60 group-hover:text-amber-200 transition-colors cursor-pointer"
                  >
                    Don&apos;t show this question again
                  </label>
                </div>

                <button
                  onClick={handleSkipGateway}
                  className="text-amber-500/40 hover:text-amber-500/80 text-xs uppercase tracking-widest transition-colors font-semibold"
                >
                  I know the path, skip
                </button>
              </div>
            </div>
          </div>

          {/* Decorative Edge */}
          <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-md bg-stone-950 text-white border-amber-800/40 shadow-2xl overflow-y-auto max-h-[90vh]" role="dialog" aria-label="onboarding-guide-modal">
        <DialogDescription className="sr-only" id="onboarding-guide-modal-desc">Onboarding guide and instructions</DialogDescription>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center text-amber-100 uppercase tracking-tighter">
            <HelpCircle className="mr-3 h-6 w-6 text-amber-500" />
            Kingdom Guide
          </DialogTitle>
          <DialogDescription className="text-amber-200/60 font-medium">Your path to legendary self-improvement</DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <p className="text-amber-100/90 leading-relaxed">
            ThriveHaven transforms your daily discipline into an epic medieval conquest. Every habit you conquer expands your realm.
          </p>

          <div className="space-y-3 bg-amber-950/20 p-4 rounded-lg border border-amber-500/10">
            <h3 className="font-serif text-amber-500 font-bold uppercase text-xs tracking-widest">Key Features</h3>
            <ul className="grid grid-cols-1 gap-2 text-sm text-amber-100/80">
              <li className="flex items-start gap-2"><span className="text-amber-500">⚔️</span> Track tasks to earn gold and XP</li>
              <li className="flex items-start gap-2"><span className="text-amber-500">🏰</span> Expand your realm on the world map</li>
              <li className="flex items-start gap-2"><span className="text-amber-500">🐉</span> Slay monsters and finish rare quests</li>
              <li className="flex items-start gap-2"><span className="text-amber-500">🛡️</span> Maintain streaks to unlock special buffs</li>
            </ul>
          </div>

          <div className="space-y-3 bg-amber-950/20 p-4 rounded-lg border border-amber-500/10">
            <h3 className="font-serif text-amber-500 font-bold uppercase text-xs tracking-widest">Getting Started</h3>
            <ul className="grid grid-cols-1 gap-2 text-sm text-amber-100/80">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold">1</span>
                Check your daily tasks and complete them
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold">2</span>
                Buy map tiles with gold to reveal the land
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold">3</span>
                Interact with creatures for unique rewards
              </li>
            </ul>
          </div>

          <p className="text-center font-serif text-amber-500/80 italic pt-2">Begin your legend today.</p>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-4 border-t border-amber-800/20 pt-6">
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>
              <Checkbox
                id="dont-show"
                checked={dontShowAgain}
                onCheckedChange={(checked: boolean) => setDontShowAgain(checked === true)}
                className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:text-stone-950"
              />
              <label htmlFor="dont-show" className="text-sm text-amber-200/60 group-hover:text-amber-200 transition-colors cursor-pointer">
                Don&apos;t show this guide again
              </label>
            </div>

            {disableAllOption && (
              <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => setDisableAll(!disableAll)}>
                <Checkbox
                  id="disable-all"
                  checked={disableAll}
                  onCheckedChange={(checked: boolean) => setDisableAll(checked === true)}
                  className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:text-stone-950"
                />
                <label htmlFor="disable-all" className="text-sm text-amber-200/60 group-hover:text-amber-200 transition-colors cursor-pointer">
                  Disable all onboarding guides
                </label>
              </div>
            )}
          </div>

          <Button
            type="button"
            className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-6 text-lg shadow-lg shadow-amber-500/10 transition-all hover:scale-[1.01]"
            onClick={handleClose}
          >
            Enter Kingdom
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

