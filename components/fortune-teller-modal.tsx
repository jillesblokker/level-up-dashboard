"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"
import { fetchFreshCharacterStats, addToCharacterStat } from "@/lib/character-stats-service"
import { getUserPreference, setUserPreference } from "@/lib/user-preferences-manager"

import { motion } from "framer-motion"
import { playSFX } from "@/lib/sound-manager"

interface FortuneTellerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  x: number
  y: number
  tileId: string
  onComplete?: () => void
}

type CardType = 'king' | 'joker' | 'ace' | null

const CARDS: { id: CardType; name: string; task: string; quote: string; image: string; reward: string }[] = [
  {
    id: 'king',
    name: 'The King',
    task: 'Do 10 push ups',
    quote: '"A true king sometimes needs to lead by example and makes his hands dirty."',
    image: '/images/fortune-cards/fortune_card_king.webp',
    reward: '1 Random Material'
  },
  {
    id: 'joker',
    name: 'The Joker',
    task: 'Clean up at least 1 item',
    quote: '"Even a trickster must occasionally clean up their own mess."',
    image: '/images/fortune-cards/fortune_card_joker.webp',
    reward: '1 Mythic Scratch Card'
  },
  {
    id: 'ace',
    name: 'The Ace',
    task: 'Take a moment to rest',
    quote: '"Rest is also important. It is the quiet foundation of all greatness."',
    image: '/images/fortune-cards/fortune_card_ace.webp',
    reward: '5 Gems'
  }
]

export function FortuneTellerModal({ open, onOpenChange, x, y, tileId, onComplete }: FortuneTellerModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CardType>(null)
  const [shuffledCards, setShuffledCards] = useState<typeof CARDS>([])
  
  // Shuffle cards on open
  useEffect(() => {
    if (open) {
      setSelectedCard(null)
      setShuffledCards([...CARDS].sort(() => Math.random() - 0.5))
    }
  }, [open])

  const handleCardClick = (card: typeof CARDS[0]) => {
    if (selectedCard) return
    playSFX('magic-spell')
    setSelectedCard(card.id)
  }

  const handleCompleteTask = async () => {
    if (!selectedCard) return
    setIsProcessing(true)

    try {
      if (tileId === 'town-tarot' || !x) {
        const card = CARDS.find(c => c.id === selectedCard);
        const today = new Date().toDateString();
        localStorage.setItem('town_tarot_draw_date', today);
        localStorage.setItem('town_tarot_drawn_card', JSON.stringify(card));

        if (selectedCard === 'king') {
          await addToCharacterStat('gold', 200, 'town-tarot-king');
        } else if (selectedCard === 'joker') {
          await addToCharacterStat('gold', 300, 'town-tarot-joker');
        } else if (selectedCard === 'ace') {
          await addToCharacterStat('gems', 5, 'town-tarot-ace');
        }

        try {
          const currentBuffs = ((await getUserPreference('active_alchemy_buffs')) as any) || {};
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          const updatedBuffs = {
            ...currentBuffs,
            tarotCardName: card?.name || 'Daily Fortune',
            tarotExpiresAt: expiresAt,
            activeSpell: selectedCard === 'king' ? 'greed' : selectedCard === 'ace' ? 'swiftness' : 'combat_strength',
            spellExpiresAt: expiresAt,
            bonusAtkPercent: selectedCard === 'joker' ? 15 : currentBuffs.bonusAtkPercent || 0,
            streakProtection: selectedCard === 'ace' ? true : currentBuffs.streakProtection || false,
          };
          await setUserPreference('active_alchemy_buffs', updatedBuffs);
          window.dispatchEvent(new CustomEvent('tarot-buff-activated', { detail: updatedBuffs }));
        } catch (e) {
          console.error('Failed to save tarot buff:', e);
        }

        toast({
          title: `🔮 Fortune claimed: ${card?.name || 'Tarot Card'}!`,
          description: `You received: ${card?.reward || 'Daily blessing'}!`,
        });

        if (onComplete) onComplete();
        onOpenChange(false);
        return;
      }

      const response = await fetch('/api/kingdom/fortune-teller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y, tileId, cardChoice: selectedCard })
      })

      if (!response.ok) {
        throw new Error('Failed to claim fortune')
      }

      const data = await response.json()
      
      toast({
        title: "Fortune Claimed!",
        description: `You received: ${data.rewardMessage}`,
      })

      // Refresh stats
      await fetchFreshCharacterStats()
      
      if (onComplete) {
        onComplete()
      }
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "The spirits are silent. Try again later.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const selectedData = CARDS.find(c => c.id === selectedCard)

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!isProcessing) onOpenChange(val); }}>
      <DialogContent className="max-w-full sm:max-w-[560px] border-2 border-emerald-800/60 bg-slate-950/95 backdrop-blur-md p-4 sm:p-6 rounded-2xl overflow-y-auto max-h-[90dvh] shadow-2xl">
        <DialogHeader className="px-8 sm:px-10 pb-2 mb-2">
          <DialogTitle className="text-2xl font-medieval text-emerald-400 text-center break-words">
            🔮 The fortune teller
          </DialogTitle>
          <DialogDescription className="text-center text-emerald-200/80 text-xs sm:text-sm">
            {!selectedCard ? "Pick a card to reveal your destiny..." : "Your fate is sealed."}
          </DialogDescription>
        </DialogHeader>

        {!selectedCard ? (
          <div className="grid grid-cols-3 gap-3 sm:gap-5 w-full justify-items-center py-3">
            {shuffledCards.map((card, idx) => (
              <div 
                key={idx}
                onClick={() => handleCardClick(card)}
                className="relative w-full aspect-[2/3] rounded-2xl cursor-pointer transition-all duration-300 border-2 border-emerald-400/60 overflow-hidden group shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.7)] hover:scale-105 active:scale-95"
              >
                {/* Celestial Tarot Card Back Image */}
                <Image
                  src="/images/tarot/card_back.webp"
                  alt={`Fate Card #${idx + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
                
                {/* Emerald Glow & Mystical Border Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-transparent to-emerald-500/20 pointer-events-none" />
                <div className="absolute inset-1.5 border border-emerald-400/40 rounded-xl pointer-events-none" />

                {/* Badge Overlay */}
                <div className="absolute bottom-2 inset-x-2 flex justify-center z-10">
                  <span className="text-[10px] sm:text-xs font-serif font-bold text-emerald-200 bg-slate-950/85 px-2.5 py-0.5 rounded-full border border-emerald-400/50 shadow-md">
                    Card #{idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-2 space-y-3.5 w-full max-w-full">
            {selectedData && (
              <>
                <div className="perspective-1000 w-full flex justify-center">
                  <motion.div 
                    initial={{ rotateY: 180, scale: 0.8, opacity: 0 }}
                    animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                    transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                    className="relative w-full max-w-[180px] sm:max-w-[190px] aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.5)] border-2 border-emerald-400/60 mx-auto"
                  >
                    <Image
                      src={selectedData.image}
                      alt={selectedData.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </motion.div>
                </div>
                
                <div className="text-center space-y-1.5 max-w-md px-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-emerald-300 font-serif">{selectedData.name}</h3>
                  <p className="text-xs sm:text-sm italic text-emerald-100/80 leading-relaxed">&quot;{selectedData.quote.replace(/"/g, '')}&quot;</p>
                </div>

                <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-4 w-full text-center space-y-2 shadow-lg">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-emerald-900/40 pb-1.5 mb-1">
                    <span>Your Destiny Task</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      🔮 24h Tarot Blessing
                    </span>
                  </div>
                  <p className="text-base sm:text-lg text-white font-bold">{selectedData.task}</p>
                  <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <span>✨ Reward:</span>
                    <span>{selectedData.reward}</span>
                  </div>
                </div>

                <Button 
                  onClick={handleCompleteTask} 
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold h-12 text-base rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] min-h-[48px]"
                >
                  {isProcessing ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Channeling...</>
                  ) : (
                    "I Have Completed This Task"
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
