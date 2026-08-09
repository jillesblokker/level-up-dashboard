"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"
import { fetchFreshCharacterStats } from "@/lib/character-stats-service"

import { motion } from "framer-motion"

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
    setSelectedCard(card.id)
  }

  const handleCompleteTask = async () => {
    if (!selectedCard) return
    setIsProcessing(true)

    try {
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
      <DialogContent className="max-w-full sm:max-w-[560px] border-2 border-emerald-800/60 bg-slate-950/95 backdrop-blur-md p-4 sm:p-6 rounded-2xl overflow-x-hidden shadow-2xl">
        <DialogHeader className="p-0 mb-2">
          <DialogTitle className="text-2xl font-medieval text-emerald-400 text-center">
            🔮 The Fortune Teller
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
                className="relative w-full aspect-[2/3] rounded-2xl cursor-pointer transition-all duration-300 border-2 border-emerald-400/60 bg-gradient-to-b from-slate-900 via-emerald-950/70 to-slate-950 overflow-hidden group shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.7)] hover:scale-105 active:scale-95 flex flex-col items-center justify-center"
              >
                {/* Mystical Pattern Background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.2),transparent_70%)] pointer-events-none" />
                
                {/* Decorative Gold Filigree Card Back Border */}
                <div className="absolute inset-2 border border-emerald-500/30 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between text-[10px] text-emerald-400/50">✨ <span>✨</span></div>
                  <div className="flex justify-between text-[10px] text-emerald-400/50">✨ <span>✨</span></div>
                </div>

                {/* Central Orb & Closed Card Mystery Icon */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/90 border-2 border-emerald-400/60 flex items-center justify-center text-emerald-300 font-medieval text-2xl shadow-[0_0_15px_rgba(16,185,129,0.5)] group-hover:scale-110 transition-transform">
                    🔮
                  </div>
                  <span className="text-[11px] font-serif font-bold text-emerald-200 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    Card #{idx + 1}
                  </span>
                </div>

                {/* Mystical Shimmer Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 space-y-5 w-full max-w-full">
            {selectedData && (
              <>
                <div className="perspective-1000 w-full flex justify-center">
                  <motion.div 
                    initial={{ rotateY: 180, scale: 0.8, opacity: 0 }}
                    animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                    transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                    className="relative w-full max-w-[220px] sm:max-w-[260px] aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_0_35px_rgba(16,185,129,0.5)] border-2 border-emerald-400/60 mx-auto"
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
                  <p className="text-xs text-slate-400 font-semibold">Your task</p>
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
