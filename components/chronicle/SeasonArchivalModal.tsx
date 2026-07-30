'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Award, Crown, Calendar, Sparkles, BookOpen } from 'lucide-react'

interface SeasonArchivalModalProps {
  isOpen: boolean
  onClose: () => void
}

const PAST_CHAMPIONS = [
  { year: '2025 Season IV', house: 'House of Might', winner: 'Jilles', habitsCompleted: 1420, title: 'Champion of Might' },
  { year: '2025 Season III', house: 'House of Knowledge', winner: 'Elena', habitsCompleted: 1280, title: 'Scholar Sovereign' },
  { year: '2025 Season II', house: 'House of Honor', winner: 'Kaelen', habitsCompleted: 1150, title: 'Paladin of Honor' },
]

export function SeasonArchivalModal({ isOpen, onClose }: SeasonArchivalModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-zinc-950 border border-amber-900/50 text-white rounded-2xl p-6 shadow-2xl overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <Crown className="w-6 h-6" />
              <DialogTitle className="text-xl font-bold tracking-wide text-amber-100">
                Season Champions & Chronicle Archival
              </DialogTitle>
            </div>
            <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-950/30 text-xs">
              Annual Hall of Fame
            </Badge>
          </div>
          <DialogDescription className="text-zinc-400 text-xs mt-1">
            At the start of each new season, standings reset to 0, past champions are permanently archived in the Chronicle, and players earn legacy title badges!
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
          {/* Current Season Hero Banner */}
          <div className="rounded-xl border border-amber-500/40 p-4 bg-gradient-to-r from-amber-950/60 via-zinc-900 to-zinc-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                  2026 Season I Standing <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h4>
                <p className="text-xs text-amber-400 font-medium">House of Might leading with 4,850 Virtue Energy</p>
              </div>
            </div>
            <Badge className="bg-amber-600 text-white font-bold text-[10px]">
              Active Season
            </Badge>
          </div>

          {/* Past Champions List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" /> Chronicle Archived Champions
            </h4>

            <div className="space-y-2">
              {PAST_CHAMPIONS.map((champ, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 flex items-center justify-between text-xs transition-all hover:border-amber-900/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 font-mono font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100">{champ.winner}</span>
                        <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400 bg-zinc-950">
                          {champ.house}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{champ.title}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" /> {champ.year}
                    </span>
                    <span className="font-mono text-xs text-amber-400 font-semibold">{champ.habitsCompleted} Habits</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-zinc-900">
          <Button variant="ghost" onClick={onClose} className="text-xs text-zinc-400 hover:text-white">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
