'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Sparkles, Compass, Trophy, Star, Shield, Flame, Wand2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { addToCharacterStat } from '@/lib/character-stats-service'
import { getUserPreference, setUserPreference } from '@/lib/user-preferences-manager'

interface TarotReadingModalProps {
  isOpen: boolean
  onClose: () => void
}

const TOWN_TAROT_CARDS = [
  { name: 'The King’s Sun ☀️', buff: '+20% Gold on all habit completions today!', icon: '☀️', goldBonus: 150 },
  { name: 'The Dragon of Might 🐉', buff: '+15% Dungeon Fighter Attack Power today!', icon: '🐉', goldBonus: 200 },
  { name: 'The Sage of Wisdom 🦉', buff: 'Double Experience on all Knowledge habits!', icon: '🦉', goldBonus: 180 },
  { name: 'The Aegis Shield 🛡️', buff: 'Streak Protection active for the next 24 hours!', icon: '🛡️', goldBonus: 120 },
  { name: 'The Star of Abundance ⭐', buff: '+3 Extra Botanical Alchemy Reagents awarded!', icon: '⭐', goldBonus: 250 },
  { name: 'The Alchemist Cauldron 🧪', buff: 'Double Potion Brew Yield in the Apotheca!', icon: '🧪', goldBonus: 175 },
  { name: 'The Airship Propeller ⛵', buff: 'Double Airship Flight Speed on voyages today!', icon: '⛵', goldBonus: 220 },
  { name: 'The House Cup Crown 👑', buff: '+10 Bonus Virtue Points awarded to your House!', icon: '👑', goldBonus: 300 }
]

export function TarotReadingModal({ isOpen, onClose }: TarotReadingModalProps) {
  const { toast } = useToast()
  const [selectedCard, setSelectedCard] = useState<typeof TOWN_TAROT_CARDS[0] | null>(null)
  const [isDrawn, setIsDrawn] = useState(false)
  const [hasDrawnToday, setHasDrawnToday] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const today = new Date().toDateString()
    const lastDraw = localStorage.getItem('town_tarot_draw_date')
    if (lastDraw === today) {
      setHasDrawnToday(true)
      const savedCard = localStorage.getItem('town_tarot_drawn_card')
      if (savedCard) {
        try { setSelectedCard(JSON.parse(savedCard)) } catch {}
      }
    } else {
      setHasDrawnToday(false)
      setIsDrawn(false)
      setSelectedCard(null)
    }
  }, [isOpen])

  const drawCard = async () => {
    if (hasDrawnToday || isDrawn) return
    const randomCard = TOWN_TAROT_CARDS[Math.floor(Math.random() * TOWN_TAROT_CARDS.length)]!
    setSelectedCard(randomCard)
    setIsDrawn(true)
    setHasDrawnToday(true)

    const today = new Date().toDateString()
    localStorage.setItem('town_tarot_draw_date', today)
    localStorage.setItem('town_tarot_drawn_card', JSON.stringify(randomCard))

    await addToCharacterStat('gold', randomCard.goldBonus, 'town-tarot-reading')

    // Apply active blessing to active_alchemy_buffs
    try {
      const currentBuffs = ((await getUserPreference('active_alchemy_buffs')) as any) || {}
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const updatedBuffs: any = {
        ...currentBuffs,
        tarotCardName: randomCard.name,
        tarotExpiresAt: expiresAt,
      }

      if (randomCard.name.includes('Sun')) {
        updatedBuffs.activeSpell = 'greed'
        updatedBuffs.spellExpiresAt = expiresAt
      } else if (randomCard.name.includes('Dragon')) {
        updatedBuffs.bonusAtkPercent = 15
        updatedBuffs.combatProtectionCharges = Math.max(currentBuffs.combatProtectionCharges || 0, 2)
      } else if (randomCard.name.includes('Sage')) {
        updatedBuffs.activeSpell = 'swiftness'
        updatedBuffs.spellExpiresAt = expiresAt
      } else if (randomCard.name.includes('Aegis')) {
        updatedBuffs.streakProtection = true
        updatedBuffs.combatProtectionCharges = (currentBuffs.combatProtectionCharges || 0) + 3
      }

      await setUserPreference('active_alchemy_buffs', updatedBuffs)
      window.dispatchEvent(new CustomEvent('tarot-buff-activated', { detail: updatedBuffs }))
    } catch (e) {
      console.error('Failed to set tarot blessing buff:', e)
    }

    toast({
      title: `🔮 Town tarot drawn: ${randomCard.name}`,
      description: `${randomCard.buff} Awarded +${randomCard.goldBonus} gold!`,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(op) => { if (!op) onClose() }}>
      <DialogContent className="max-w-md w-full bg-gradient-to-b from-purple-950 via-zinc-950 to-zinc-950 border border-purple-500/40 text-purple-100 p-6 rounded-2xl shadow-2xl font-serif text-center overflow-hidden z-[100]">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />

        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Wand2 className="w-6 h-6 text-purple-300 animate-spin" />
          </div>
          <DialogTitle className="text-2xl font-medieval text-purple-200">
            Town fortune tarot reading
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-300 italic leading-relaxed pt-1">
            The royal Cartomancer reads the shifting Ether currents across Thrivehaven. Draw a daily card to reveal how today’s discipline channels ancient blessings into the realm!
          </DialogDescription>
        </DialogHeader>

        {selectedCard ? (
          <div className="my-5 p-5 bg-zinc-950/90 rounded-2xl border border-purple-500/40 space-y-3 animate-in zoom-in duration-300">
            <div className="text-5xl animate-bounce">{selectedCard.icon}</div>
            <h4 className="font-bold text-amber-300 text-lg">{selectedCard.name}</h4>
            <p className="text-xs text-purple-200 font-bold bg-purple-950/60 p-2.5 rounded-xl border border-purple-800/40">
              ✨ Active Blessing: {selectedCard.buff}
            </p>
            <span className="text-[10px] text-emerald-400 font-mono font-bold block">
              + {selectedCard.goldBonus} Gold Offering Claimed
            </span>
          </div>
        ) : (
          <div className="my-5 p-6 bg-zinc-950/80 rounded-2xl border border-purple-900/30 space-y-4">
            <div className="flex justify-center gap-3">
              {[1, 2, 3].map((_, i) => (
                <div
                  key={i}
                  onClick={drawCard}
                  className="w-16 h-24 rounded-xl bg-gradient-to-b from-purple-900 to-zinc-900 border-2 border-purple-500/40 flex items-center justify-center shadow-lg transform hover:-translate-y-1 transition-transform cursor-pointer"
                >
                  <span className="text-2xl">🔮</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-400 italic">Focus your intention and tap any card to reveal today&apos;s town fortune.</p>
          </div>
        )}

        <Button
          onClick={selectedCard ? onClose : drawCard}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold uppercase tracking-wider text-xs shadow-lg"
        >
          {selectedCard ? 'Accept Blessing' : '🔮 Draw Daily Tarot Card'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
