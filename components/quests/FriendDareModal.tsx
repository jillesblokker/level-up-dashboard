'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Swords, Flame, Sparkles, Send } from 'lucide-react'

interface FriendDareModalProps {
  isOpen: boolean
  onClose: () => void
  onSendDare: (friendName: string, habitDare: string) => void
}

export function FriendDareModal({ isOpen, onClose, onSendDare }: FriendDareModalProps) {
  const [friendName, setFriendName] = useState('')
  const [habitDare, setHabitDare] = useState('20 Push-ups before 18:00')
  const [isSubmitted, setIsSubmitted] = useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setFriendName('')
      setHabitDare('20 Push-ups before 18:00')
      setIsSubmitted(false)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (friendName.trim() && habitDare.trim()) {
      onSendDare(friendName, habitDare)
      setIsSubmitted(true)
      setTimeout(() => {
        setIsSubmitted(false)
        onClose()
      }, 1500)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-zinc-950 border border-amber-900/50 text-white rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-400">
            <Swords className="w-6 h-6" />
            <DialogTitle className="text-xl font-bold tracking-wide text-amber-100">
              Issue friend dare & virtue duel
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 text-xs mt-1">
            Dare a friend to complete a habit today! Completing habit dares awards <span className="text-amber-400 font-bold">+10 bonus House Cup virtue points</span> to both issuer and recipient!
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center animate-bounce">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-zinc-100">Dare Issued to {friendName}!</h4>
            <p className="text-xs text-zinc-400">Awarded +10 virtue points to your House Cup hourglass!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="my-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Friend Username or Display Name</label>
              <Input
                placeholder="e.g. Alex"
                value={friendName}
                onChange={e => setFriendName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white text-xs h-10 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Habit Challenge Dare</label>
              <Input
                placeholder="e.g. 20 push-ups, read 10 pages, 5-min plank"
                value={habitDare}
                onChange={e => setHabitDare(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white text-xs h-10 rounded-xl"
                required
              />
            </div>

            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-400">
                <Flame className="w-4 h-4" />
                <span>Duel Bonus Reward</span>
              </div>
              <Badge className="bg-amber-600 text-white font-bold text-[10px]">
                +10 Virtue Points
              </Badge>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
              <Button type="button" variant="ghost" onClick={onClose} className="text-xs text-zinc-400 hover:text-white">
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs px-5 rounded-xl shadow-md gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Send Dare
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
